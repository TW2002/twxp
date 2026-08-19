/*
Copyright (C) 2026  Matt Mosley

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TWXProxy.Core
{
    public enum NativeHaggleChangeSource
    {
        Runtime = 0,
        User,
        Script,
        Config,
    }

    public sealed class NativeBotClientInputResult
    {
        public static NativeBotClientInputResult NotHandled { get; } = new(false, string.Empty);
        public static NativeBotClientInputResult Handled { get; } = new(true, string.Empty);

        private NativeBotClientInputResult(bool handled, string promptSeed)
        {
            IsHandled = handled;
            PromptSeed = promptSeed;
        }

        public bool IsHandled { get; }
        public string PromptSeed { get; }

        public static NativeBotClientInputResult StartPrompt(string promptSeed)
            => new(true, promptSeed ?? string.Empty);
    }

    /// <summary>
    /// Represents a single game instance with server and local connections
    /// </summary>
    public class GameInstance : IDisposable, ITWXServer
    {
        [InterpolatedStringHandler]
        private ref struct NetworkLogInterpolatedStringHandler
        {
            private DefaultInterpolatedStringHandler _builder;

            public NetworkLogInterpolatedStringHandler(
                int literalLength,
                int formattedCount,
                GameInstance instance,
                out bool shouldAppend)
            {
                IsEnabled = shouldAppend = instance.Verbose || GlobalModules.DebugMode;
                _builder = shouldAppend
                    ? new DefaultInterpolatedStringHandler(literalLength, formattedCount)
                    : default;
            }

            public bool IsEnabled { get; }
            public void AppendLiteral(string value) => _builder.AppendLiteral(value);
            public void AppendFormatted<T>(T value) => _builder.AppendFormatted(value);
            public void AppendFormatted<T>(T value, string? format) =>
                _builder.AppendFormatted(value, format);
            public void AppendFormatted<T>(T value, int alignment) =>
                _builder.AppendFormatted(value, alignment);
            public void AppendFormatted<T>(T value, int alignment, string? format) =>
                _builder.AppendFormatted(value, alignment, format);
            public string GetFormattedText() => _builder.ToStringAndClear();
        }

        [InterpolatedStringHandler]
        private ref struct VerboseLogInterpolatedStringHandler
        {
            private DefaultInterpolatedStringHandler _builder;

            public VerboseLogInterpolatedStringHandler(
                int literalLength,
                int formattedCount,
                GameInstance instance,
                out bool shouldAppend)
            {
                IsEnabled = shouldAppend = instance.Verbose;
                _builder = shouldAppend
                    ? new DefaultInterpolatedStringHandler(literalLength, formattedCount)
                    : default;
            }

            public bool IsEnabled { get; }
            public void AppendLiteral(string value) => _builder.AppendLiteral(value);
            public void AppendFormatted<T>(T value) => _builder.AppendFormatted(value);
            public void AppendFormatted<T>(T value, string? format) =>
                _builder.AppendFormatted(value, format);
            public void AppendFormatted<T>(T value, int alignment) =>
                _builder.AppendFormatted(value, alignment);
            public void AppendFormatted<T>(T value, int alignment, string? format) =>
                _builder.AppendFormatted(value, alignment, format);
            public string GetFormattedText() => _builder.ToStringAndClear();
        }

        private sealed class DeferredLocalOutput
        {
            public byte[] Data { get; init; } = Array.Empty<byte>();
            public bool BroadcastDeaf { get; init; }
        }

        private enum ScriptPipeToggleOutputAction
        {
            None,
            Suppress
        }

        private sealed class ClientSession
        {
            public TcpClient? TcpClient { get; init; }
            public Stream WriteStream { get; init; } = Stream.Null;
            public Stream ReadStream { get; init; } = Stream.Null;
            public bool IsDirect { get; init; }
            public string RemoteAddress { get; set; } = string.Empty;
            public ClientType Type { get; set; } = ClientType.Standard;
            public bool EchoMarks { get; set; }
            public MenuHandler MenuHandler { get; init; } = null!;
            public Task? ReadTask { get; set; }
            public bool NativeBotCommandMode { get; set; }
            public bool NativeBotHotkeyMode { get; set; }
            public bool SuppressNextLineFeedAfterNativeBotPrompt { get; set; }
            public StringBuilder NativeBotCommandBuffer { get; } = new();
            public bool IsConnected => IsDirect ? WriteStream != Stream.Null : (TcpClient?.Connected ?? false);
        }

        private sealed class ClientContextScope : IDisposable
        {
            private readonly AsyncLocal<int?> _slot;
            private readonly int? _previous;

            public ClientContextScope(AsyncLocal<int?> slot, int? next)
            {
                _slot = slot;
                _previous = slot.Value;
                _slot.Value = next;
            }

            public void Dispose()
            {
                _slot.Value = _previous;
            }
        }

        private readonly string _gameName;
        private readonly string _serverAddress;
        private readonly int _serverPort;
        private int _listenPort;
        private int _automationListenPort;
        private readonly string _scriptDirectory;
        private char _commandChar;
        private readonly ModInterpreter? _interpreter;
        private readonly List<(string Search, string Replace)> _systemQuickTexts = new();
        private readonly List<(string Search, string Replace)> _userQuickTexts = new();
        private readonly Dictionary<string, BotConfig> _botConfigs = new(StringComparer.OrdinalIgnoreCase);
        private readonly List<BotConfig> _botOrder = new();
        private readonly List<ClientSession> _clients = new();
        private readonly object _clientLock = new();
        private readonly AsyncLocal<int?> _preferredClientIndex = new();
        private NativeHaggleChangeSource _pendingNativeHaggleChangeSource = NativeHaggleChangeSource.Runtime;

        // ITWXServer / IModServer properties
        public bool StreamEnabled { get; set; }
        public bool AllowLerkers { get; set; } = true;
        public string LerkerAddress { get; set; } = string.Empty;
        public bool AcceptExternal { get; set; } = true;
        public string ExternalAddress { get; set; } = string.Empty;
        public bool BroadCastMsgs { get; set; } = true;
        public bool LocalEcho { get; set; } = true;
        public bool StaleLocalInputProbeEnabled { get; set; } = true;
        public int LocalInputResponseTimeoutSeconds { get; set; } = DefaultLocalInputResponseTimeoutSeconds;
        public bool GameIdleKeepaliveEnabled { get; set; } = true;
        public int GameIdleKeepaliveIntervalSeconds { get; set; } = DefaultGameIdleKeepaliveIntervalSeconds;
        public int ClientCount
        {
            get
            {
                lock (_clientLock)
                    return _clients.Count;
            }
        }
        public bool HasPendingServerTraffic
        {
            get
            {
                if (!_serverSendQueue.IsEmpty ||
                    Interlocked.CompareExchange(ref _serverSendPumpScheduled, 0, 0) != 0)
                {
                    return true;
                }

                lock (_deferredLocalOutputLock)
                    return _serverDataDispatchDepth > 0 || _deferredLocalOutput.Count > 0;
            }
        }
        public string ActiveBotName { get; set; } = string.Empty;
        public Func<BotConfig, string, bool>? NativeBotActivator { get; set; }
        public Func<string, bool>? NativeBotStopper { get; set; }
        public Func<string, bool>? NativeBotRebooter { get; set; }
        public Func<string, string?>? NativeBotScriptRedirector { get; set; }
        public Func<bool>? NativeBotCanAcceptLocalInput { get; set; }
        public Func<string, Task<bool>>? NativeBotLocalInputExecutor { get; set; }
        public Func<byte, Task<NativeBotClientInputResult>>? NativeBotHotkeyExecutor { get; set; }

        private TcpClient? _serverClient;
        private TcpListener? _localListener;
        private TcpListener? _automationListener;
        private NetworkStream? _serverStream;

        private CancellationTokenSource? _cancellationSource;
        private Task? _serverReadTask;
        private Task? _acceptTask;
        private Task? _automationAcceptTask;
        private Task? _serverStaleWatchdogTask;

        private bool _isRunning;
        private readonly object _stateLock = new();
        private readonly MenuHandler _directMenuHandler;
        private readonly NativeHaggleEngine _nativeHaggle = new();
        private readonly SemaphoreSlim _serverSendLock = new(1, 1);
        private readonly SemaphoreSlim _localSendLock = new(1, 1);
        private readonly ModLog _log = new();
        private readonly ShipInfoParser _shipInfoParser = new();
        private readonly object _shipStatusLock = new();
        private ShipStatus _currentShipStatus = new();
        private readonly object _deferredLocalOutputLock = new();
        private readonly List<DeferredLocalOutput> _deferredLocalOutput = new();
        private readonly ConcurrentQueue<byte[]> _serverSendQueue = new();
        private readonly SemaphoreSlim _serverSendSignal = new(0);
        private readonly object _fastServerDataResponderLock = new();
        private readonly List<Action<FastServerDataEventArgs>> _fastServerDataResponders = new();
        private readonly object _proxyMenuCommandLock = new();
        private readonly Dictionary<string, ProxyMenuCommand> _proxyMenuCommands = new(StringComparer.OrdinalIgnoreCase);
        private int _serverDataDispatchDepth;
        private int _serverSendPumpScheduled;
        private readonly object _serverOutputBoundaryLock = new();
        private bool _serverOutputLineOpen;
        private int _serverOutputAnsiState;
        private int _deferredLocalOutputFlushScheduled;
        private int _suppressScriptPipeToggleMessageCount;

        // Telnet negotiation state
        private bool _telnetNegotiationComplete = false;
        private readonly List<byte> _clientBufferDuringNegotiation = new();
        private readonly object _negotiationLock = new();

        // Auto-reconnect: true by default, set to false by "disconnect disable"
        private bool _autoReconnect = true;
        private int _reconnectDelayMs = 5000;
        private int _reconnectLoopRunning = 0; // Interlocked guard — only one loop at a time
        private int _disconnectHandling = 0;   // Interlocked guard — emit disconnect UI/event once
        private int _serverStaleWatchdogRunning = 0;
        private long _lastServerReceiveUtcTicks = 0;
        private long _lastClientToServerActivityUtcTicks = 0;
        private long _pendingLocalInputProbeUtcTicks = 0;
        private int _pendingLocalInputProbeBytes = 0;
        private string _pendingLocalInputProbeSummary = string.Empty;
        public const int DefaultLocalInputResponseTimeoutSeconds = 60;
        public const int DefaultGameIdleKeepaliveIntervalSeconds = 30;
        private const int MinimumNetworkWatchdogSeconds = 5;
        private const int MaximumNetworkWatchdogSeconds = 600;
        private static readonly byte[] GameIdleKeepaliveBytes = [0x1B, (byte)'[', (byte)'0', (byte)'n'];
        private static readonly TimeSpan ServerStaleWatchdogInterval = TimeSpan.FromSeconds(1);
        private static readonly TimeSpan DeferredLocalOutputQuietDelay = TimeSpan.FromMilliseconds(100);
        public bool AutoReconnect { get => _autoReconnect; set => _autoReconnect = value; }
        public int ReconnectDelayMs
        {
            get => _reconnectDelayMs;
            set => _reconnectDelayMs = Math.Max(1000, value);
        }

        /// <summary>
        /// When false, suppresses all Console.WriteLine diagnostic output.
        /// Set to false in embedded (direct) mode to keep the console clean.
        /// </summary>
        public bool Verbose { get; set; } = true;


        // Log: important events (connect/disconnect/errors) → always written to DebugLog.
        // LogVerbose: high-frequency traffic (byte counts) → Console only when Verbose=true.
        private void Log(string message) { if (GlobalModules.DebugMode) GlobalModules.DebugLog(message + "\n"); if (Verbose) Console.WriteLine(message); }
        private void LogVerbose(string message) { if (Verbose) Console.WriteLine(message); }
        private void Log(
            [InterpolatedStringHandlerArgument("")] ref NetworkLogInterpolatedStringHandler message)
        {
            if (message.IsEnabled)
                Log(message.GetFormattedText());
        }
        private void LogVerbose(
            [InterpolatedStringHandlerArgument("")] ref VerboseLogInterpolatedStringHandler message)
        {
            if (message.IsEnabled)
                LogVerbose(message.GetFormattedText());
        }

        private static long UtcNowTicks() => DateTime.UtcNow.Ticks;

        private static string FormatServerEndpoint(string serverAddress, int serverPort)
        {
            string host = string.IsNullOrWhiteSpace(serverAddress) ? "server" : serverAddress.Trim();
            if (host.Contains(':') && !host.StartsWith('[') && !host.EndsWith(']'))
                host = $"[{host}]";
            return $"{host}:{serverPort}";
        }

        // Telnet protocol constants
        private const byte IAC = 255;  // Interpret As Command
        private const byte DONT = 254;
        private const byte DO = 253;
        private const byte WONT = 252;
        private const byte WILL = 251;
        private const byte SB = 250;   // Subnegotiation Begin
        private const byte SE = 240;   // Subnegotiation End

        // Events for script processing hooks
        public event EventHandler<DataReceivedEventArgs>? ServerDataReceived;
        public event EventHandler<DataReceivedEventArgs>? LocalDataReceived;
        public event EventHandler<DataReceivedEventArgs>? ServerDataSent;
        public event EventHandler<CommandEventArgs>? CommandReceived;
        public event EventHandler? Connected;
        public event EventHandler<DisconnectEventArgs>? Disconnected;
        public event EventHandler? ScriptLoaded;
        public event EventHandler? ScriptStopped;
        public event EventHandler? ClearInputBufferRequested;
        public event Action<bool, NativeHaggleChangeSource>? NativeHaggleChanged;
        public event Action? NativeHaggleStatsChanged;
        public event Action<ShipStatus>? ShipStatusUpdated;
        public event EventHandler<ClientTypeChangedEventArgs>? ClientTypeChanged;

        public string GameName => _gameName;
        public bool IsRunning => _isRunning;
        public bool IsConnected => _serverClient?.Connected ?? false;
        public string ServerEndpoint => FormatServerEndpoint(_serverAddress, _serverPort);
        public string ConnectingStatusText => $"Connecting to {ServerEndpoint}...";
        public bool IsLocalListenerActive
        {
            get
            {
                lock (_stateLock)
                    return _localListener != null;
            }
        }

        public bool IsAutomationListenerActive
        {
            get
            {
                lock (_stateLock)
                    return _automationListener != null;
            }
        }

        public int AutomationListenPort
        {
            get
            {
                lock (_stateLock)
                    return _automationListener == null ? 0 : _automationListenPort;
            }
        }
        public char CommandChar => _commandChar;
        public bool IsProxyMenuActive
        {
            get
            {
                lock (_clientLock)
                    return _clients.Any(client => client.MenuHandler.IsActive);
            }
        }
        public bool NativeHaggleEnabled => _nativeHaggle.Enabled;
        public string NativeHaggleMode => _nativeHaggle.FirstBidMode;
        public string NativePortHaggleMode => _nativeHaggle.PortHaggleMode;
        public string NativePlanetHaggleMode => _nativeHaggle.PlanetHaggleMode;
        public IReadOnlyList<NativeHaggleModeInfo> NativeHaggleModes => _nativeHaggle.AvailableModes;
        public IReadOnlyList<NativeHaggleModeInfo> NativePortHaggleModes => _nativeHaggle.AvailablePortModes;
        public IReadOnlyList<NativeHaggleModeInfo> NativePlanetHaggleModes => _nativeHaggle.AvailablePlanetModes;
        public int NativeHaggleCompletedCount => _nativeHaggle.CompletedHaggles;
        public int NativeHaggleSuccessfulCount => _nativeHaggle.SuccessfulHaggles;
        public int NativeHaggleGoodCount => _nativeHaggle.GoodRewardCount;
        public int NativeHaggleGreatCount => _nativeHaggle.GreatRewardCount;
        public int NativeHaggleExcellentCount => _nativeHaggle.ExcellentRewardCount;
        public int NativeHaggleSuccessRatePercent => _nativeHaggle.SuccessRatePercent;
        public ModLog Logger => _log;
        public ProxyHistoryBuffer History { get; } = new();
        public bool LogDataEnabled
        {
            get => _log.LogData;
            set => _log.LogData = value;
        }
        public bool LogAnsiEnabled
        {
            get => _log.LogANSI;
            set => _log.LogANSI = value;
        }
        public TwxRuntimeContext RuntimeContext { get; }

        public ShipStatus CurrentShipStatus
        {
            get
            {
                lock (_shipStatusLock)
                    return CloneShipStatus(_currentShipStatus);
            }
        }

        public GameInstance(string gameName, string serverAddress, int serverPort, int listenPort, char commandChar = '$', ModInterpreter? interpreter = null, string? scriptDirectory = null, TwxRuntimeContext? runtimeContext = null)
        {
            RuntimeContext = runtimeContext ?? GlobalModules.CurrentContext;
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);

            _gameName = gameName;
            _serverAddress = serverAddress;
            _serverPort = serverPort;
            _interpreter = interpreter;
            _scriptDirectory = scriptDirectory ?? GetDefaultScriptDirectory();

            // Register this instance as the global TWXServer for script access
            if (_interpreter != null)
            {
                _interpreter.RuntimeContext = RuntimeContext;
                GlobalModules.TWXServer = this;
                GlobalModules.TWXInterpreter = _interpreter;
                ScriptRef.SetActiveInterpreter(_interpreter);
                GlobalModules.DebugLog($"[GameInstance] Registered TWXServer and TWXInterpreter for game {_gameName}\n");
            }
            _listenPort = listenPort;
            _commandChar = commandChar;
            _directMenuHandler = new MenuHandler(this, interpreter, _scriptDirectory, () => 0);
            _nativeHaggle.SetEnabled(true);
            _nativeHaggle.EnabledChanged += enabled =>
            {
                NativeHaggleChanged?.Invoke(enabled, _pendingNativeHaggleChangeSource);
                _pendingNativeHaggleChangeSource = NativeHaggleChangeSource.Runtime;
            };
            _nativeHaggle.StatsChanged += () => NativeHaggleStatsChanged?.Invoke();
            _log.ProgramDir = GlobalModules.ProgramDir;
            _log.SetLogIdentity(gameName);
            GlobalModules.ConfigureDatabaseCorrectionLogging(
                Path.Combine(GlobalModules.ProgramDir, "logs", $"{SharedPaths.SanitizeFileComponent(gameName)}_db_errors.log"));
            _log.ScriptLoggingScope = _interpreter;
            _log.SetPlaybackTargets(
                (payload, token) => SendPlaybackToLocalAsync(payload, token),
                message => SendMessageAsync(message).GetAwaiter().GetResult());
            GlobalModules.TWXLog = _log;
            InitializeSystemQuickTexts();
            _shipInfoParser.Updated += status =>
            {
                ShipStatus snapshot = CloneShipStatus(status);
                lock (_shipStatusLock)
                    _currentShipStatus = snapshot;
                ShipStatusUpdated?.Invoke(CloneShipStatus(snapshot));
            };

            string programDir = !string.IsNullOrWhiteSpace(scriptDirectory)
                ? (Path.GetDirectoryName(scriptDirectory) ?? GetDefaultProgramDir())
                : GlobalModules.ProgramDir;
            foreach (var bot in ProxyMenuCatalog.LoadBotConfigs(programDir, scriptDirectory))
                RegisterBotConfig(bot);
        }

        private Task RunInRuntimeContextAsync(Func<Task> action, CancellationToken schedulingToken = default)
        {
            TwxRuntimeContext context = RuntimeContext;
            return Task.Run(async () =>
            {
                using var runtimeScope = GlobalModules.UseRuntimeContext(context);
                await action().ConfigureAwait(false);
            }, schedulingToken);
        }

        public void SeedShipStatus(ShipStatus status)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ShipStatus snapshot = CloneShipStatus(status);
            _shipInfoParser.SeedStatus(snapshot);
            lock (_shipStatusLock)
                _currentShipStatus = CloneShipStatus(snapshot);
        }

        private static string GetDefaultProgramDir()
        {
            if (OperatingSystem.IsWindows())
                return WindowsInstallInfo.GetInstalledProgramDirOrDefault();

            return AppContext.BaseDirectory;
        }

        private static string GetDefaultScriptDirectory()
        {
            return Path.Combine(GetDefaultProgramDir(), "scripts");
        }

        public IDisposable PushClientContext(int clientIndex)
        {
            return new ClientContextScope(_preferredClientIndex, clientIndex >= 0 ? clientIndex : null);
        }

        public void FeedShipStatusLine(string line)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(line))
                return;

            _shipInfoParser.FeedLine(line);
            lock (_shipStatusLock)
                _currentShipStatus = _shipInfoParser.CurrentStatus;
        }

        public void AdjustGenesisTorps(int delta)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (delta == 0)
                return;

            _shipInfoParser.ApplyDelta(new ShipStatusDelta
            {
                GenesisTorpsDelta = delta
            });
        }

        public void AdjustAtomicDet(int delta)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (delta == 0)
                return;

            _shipInfoParser.ApplyDelta(new ShipStatusDelta
            {
                AtomicDetDelta = delta
            });
        }

        public void ApplyShipStatusDelta(ShipStatusDelta delta)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (delta == null || !delta.HasChanges())
                return;

            _shipInfoParser.ApplyDelta(delta);
        }

        private static ShipStatus CloneShipStatus(ShipStatus status) => new()
        {
            TraderName = status.TraderName,
            Experience = status.Experience,
            Alignment = status.Alignment,
            AlignText = status.AlignText,
            TimesBlownUp = status.TimesBlownUp,
            Corp = status.Corp,
            ShipName = status.ShipName,
            ShipType = status.ShipType,
            ShipNumber = status.ShipNumber,
            ShipClass = status.ShipClass,
            CurrentSector = status.CurrentSector,
            Turns = status.Turns,
            UnlimitedGame = status.UnlimitedGame,
            TurnsPerWarp = status.TurnsPerWarp,
            TotalHolds = status.TotalHolds,
            FuelOre = status.FuelOre,
            Organics = status.Organics,
            Equipment = status.Equipment,
            Colonists = status.Colonists,
            HoldsEmpty = status.HoldsEmpty,
            Fighters = status.Fighters,
            Shields = status.Shields,
            Photons = status.Photons,
            ArmidMines = status.ArmidMines,
            LimpetMines = status.LimpetMines,
            GenesisTorps = status.GenesisTorps,
            AtomicDet = status.AtomicDet,
            Corbomite = status.Corbomite,
            Cloaks = status.Cloaks,
            Beacons = status.Beacons,
            EtherProbes = status.EtherProbes,
            MineDisruptors = status.MineDisruptors,
            PsychProbe = status.PsychProbe,
            PlanetScanner = status.PlanetScanner,
            LRSType = status.LRSType,
            HasTransWarp1 = status.HasTransWarp1,
            HasTransWarp2 = status.HasTransWarp2,
            TransWarp1 = status.TransWarp1,
            TransWarp2 = status.TransWarp2,
            Interdictor = status.Interdictor,
            Credits = status.Credits
        };

        public string GetClientAddress(int index)
        {
            ClientSession? client = GetClientSession(index);
            return client?.RemoteAddress ?? string.Empty;
        }

        public void NotifyScriptLoad()
        {
            _ = SendEchoMarkAsync(2);
            ScriptLoaded?.Invoke(this, EventArgs.Empty);
        }

        public void NotifyScriptStop()
        {
            _ = SendEchoMarkAsync(3);
            ScriptStopped?.Invoke(this, EventArgs.Empty);
        }

        private async Task SendEchoMarkAsync(byte mark)
        {
            List<ClientSession> targets;
            lock (_clientLock)
                targets = _clients.Where(client => client.EchoMarks).ToList();

            byte[] payload = new byte[] { 255, mark };
            foreach (ClientSession client in targets)
            {
                try
                {
                    await client.WriteStream.WriteAsync(payload, 0, payload.Length);
                    await client.WriteStream.FlushAsync();
                }
                catch
                {
                    // Ignore stale clients here; disconnect cleanup will remove them.
                }
            }
        }

        private ClientSession? GetClientSession(int index)
        {
            lock (_clientLock)
            {
                if (index < 0 || index >= _clients.Count)
                    return null;
                return _clients[index];
            }
        }

        private int GetClientIndex(ClientSession session)
        {
            lock (_clientLock)
                return _clients.IndexOf(session);
        }

        private IReadOnlyList<ClientSession> GetClientSnapshot()
        {
            lock (_clientLock)
                return _clients.ToList();
        }

        private void AddClientSession(ClientSession session)
        {
            lock (_clientLock)
                _clients.Add(session);
        }

        private void RemoveClientSession(ClientSession session)
        {
            lock (_clientLock)
                _clients.Remove(session);
        }

        private static void CloseClientSession(ClientSession session)
        {
            try { session.WriteStream.Close(); } catch { }
            if (!ReferenceEquals(session.ReadStream, session.WriteStream))
            {
                try { session.ReadStream.Close(); } catch { }
            }
            try { session.TcpClient?.Close(); } catch { }
        }

        private static bool IsPrivateClientAddress(string remoteAddress)
        {
            if (string.IsNullOrWhiteSpace(remoteAddress))
                return false;

            if (remoteAddress.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                remoteAddress.Equals("::1", StringComparison.OrdinalIgnoreCase) ||
                remoteAddress.StartsWith("192.168.", StringComparison.OrdinalIgnoreCase) ||
                remoteAddress.StartsWith("10.", StringComparison.OrdinalIgnoreCase))
                return true;

            if (remoteAddress.StartsWith("172.", StringComparison.OrdinalIgnoreCase))
            {
                string[] parts = remoteAddress.Split('.');
                if (parts.Length > 1 && int.TryParse(parts[1], out int octet))
                    return octet is >= 16 and <= 31;
            }

            return false;
        }

        private static bool AddressMatchesList(string remoteAddress, string addressList)
        {
            if (string.IsNullOrWhiteSpace(remoteAddress) || string.IsNullOrWhiteSpace(addressList))
                return false;

            string[] parts = addressList
                .Split(new[] { ' ', ',', ';', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (string part in parts)
            {
                if (part == "*" || part == "*.*.*.*")
                    return true;

                string prefix = part.Replace(".*", string.Empty, StringComparison.OrdinalIgnoreCase);
                if (remoteAddress.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private bool ShouldAcceptClient(string remoteAddress, out bool localClient, out bool lerker)
        {
            localClient = IsPrivateClientAddress(remoteAddress) || AddressMatchesList(remoteAddress, ExternalAddress);
            lerker = AddressMatchesList(remoteAddress, LerkerAddress);

            return remoteAddress.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                   remoteAddress.Equals("::1", StringComparison.OrdinalIgnoreCase) ||
                   (AcceptExternal && localClient) ||
                   (AllowLerkers && lerker);
        }

        private ClientType DetermineClientType(string remoteAddress, bool localClient)
        {
            if ((localClient && AcceptExternal) ||
                remoteAddress.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                remoteAddress.Equals("::1", StringComparison.OrdinalIgnoreCase))
            {
                return ClientType.Standard;
            }

            return ClientType.Mute;
        }

        private static string DescribeClientType(ClientType type) => type switch
        {
            ClientType.Standard => "STANDARD",
            ClientType.Mute => "VIEW ONLY",
            ClientType.Deaf => "DEAF",
            ClientType.Stream => "STREAMING",
            ClientType.Rejected => "REJECTED",
            _ => type.ToString().ToUpperInvariant()
        };

        private static byte[] ApplyStreamMask(byte[] data)
        {
            byte[] masked = new byte[data.Length];
            Array.Copy(data, masked, data.Length);

            bool inAnsi = false;
            for (int i = 0; i < masked.Length; i++)
            {
                byte b = masked[i];
                if (b == 27)
                {
                    inAnsi = true;
                    continue;
                }

                if (!inAnsi && b >= (byte)'0' && b <= (byte)'9')
                    masked[i] = (byte)'1';

                if ((b >= (byte)'A' && b <= (byte)'Z') || (b >= (byte)'a' && b <= (byte)'z'))
                    inAnsi = false;
            }

            return masked;
        }

        /// <summary>
        /// Start the game instance - connect to server and start listening
        /// </summary>
        public async Task StartAsync()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            lock (_stateLock)
            {
                if (_isRunning)
                {
                    throw new InvalidOperationException($"Game instance {_gameName} is already running");
                }
                _isRunning = true;
            }

            try
            {
                _cancellationSource = new CancellationTokenSource();
                var token = _cancellationSource.Token;

                StartLocalListener(_listenPort, token);

                // NOTE: Server connection is now manual - triggered by $c command
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error starting: {ex.Message}");
                await StopAsync();
                throw;
            }
        }

        /// <summary>
        /// Stop the game instance and close all connections
        /// </summary>
        public async Task StopAsync()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            GlobalModules.DebugLog($"[Network] StopAsync called for {_gameName}\n{System.Environment.StackTrace}\n");
            GlobalModules.FlushDebugLog();
            lock (_stateLock)
            {
                if (!_isRunning)
                    return;
                _isRunning = false;
            }

            try
            {
                _cancellationSource?.Cancel();

                // Wait for tasks to complete
                var tasks = new List<Task>();
                if (_serverReadTask != null) tasks.Add(_serverReadTask);
                if (_acceptTask != null) tasks.Add(_acceptTask);
                if (_automationAcceptTask != null) tasks.Add(_automationAcceptTask);
                tasks.AddRange(GetClientSnapshot().Select(client => client.ReadTask).Where(task => task != null)!);

                await Task.WhenAll(tasks.Where(t => t != null));
            }
            catch (OperationCanceledException)
            {
                // Expected when cancelling
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error stopping: {ex.Message}");
            }
            finally
            {
                // Stop all scripts (including bots/system scripts) before closing connections.
                // This disposes every script's triggers and timers so they don't fire against
                // a dead connection and don't leak into the next session.
                _interpreter?.StopAll(true);

                // Wipe the entire in-memory script-var cache so no savevar values
                // survive into the next proxy session.
                ScriptRef.ClearAllScriptVars();
                GlobalModules.GlobalAutoRecorder.ResetState($"game-stop:{_gameName}");

                CloseConnections();
                Log($"[{_gameName}] Stopped");
            }
        }

        /// <summary>
        /// Starts or stops the external/lurker TCP listener without disrupting the
        /// current server connection, scripts, or the embedded direct MTC client.
        /// </summary>
        public async Task ConfigureLocalListenerAsync(bool enabled, int listenPort)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (listenPort is < 1 or > ushort.MaxValue)
                throw new ArgumentOutOfRangeException(nameof(listenPort), "Listen port must be between 1 and 65535.");

            if (!enabled)
            {
                await StopLocalListenerAsync();
                return;
            }

            _cancellationSource ??= new CancellationTokenSource();
            lock (_stateLock)
            {
                _isRunning = true;
                if (_localListener != null && _listenPort == listenPort)
                    return;
            }

            await StopLocalListenerAsync();
            StartLocalListener(listenPort, _cancellationSource.Token);
        }

        /// <summary>
        /// Starts a private loopback-only listener for MTC-managed automation clients.
        /// Passing 0 requests an ephemeral port from the OS.
        /// </summary>
        public async Task<int> EnsureAutomationListenerAsync(int listenPort = 0)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (listenPort is < 0 or > ushort.MaxValue)
                throw new ArgumentOutOfRangeException(nameof(listenPort), "Listen port must be 0 or between 1 and 65535.");

            _cancellationSource ??= new CancellationTokenSource();
            lock (_stateLock)
            {
                _isRunning = true;
                if (_automationListener != null &&
                    (listenPort == 0 || _automationListenPort == listenPort))
                {
                    return _automationListenPort;
                }
            }

            await StopAutomationListenerAsync();
            StartAutomationListener(listenPort, _cancellationSource.Token);
            return AutomationListenPort;
        }

        public async Task StopAutomationListenerAsync()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            Task? acceptTask;
            lock (_stateLock)
            {
                acceptTask = _automationAcceptTask;
                _automationAcceptTask = null;
                _automationListener?.Stop();
                _automationListener = null;
                _automationListenPort = 0;
            }

            if (acceptTask == null)
                return;

            try
            {
                await acceptTask;
            }
            catch (OperationCanceledException)
            {
            }
            catch
            {
                // AcceptAutomationConnectionsAsync already logs meaningful listener failures.
            }
        }

        private void StartLocalListener(int listenPort, CancellationToken token)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            var listener = new TcpListener(IPAddress.Any, listenPort);
            listener.Start();
            _listenPort = listenPort;
            _localListener = listener;
            Log($"[{_gameName}] Listening on 0.0.0.0:{_listenPort}");
            Log($"[{_gameName}] Type $c to connect to server");

            _acceptTask = RunInRuntimeContextAsync(() => AcceptLocalConnectionsAsync(token), token);
        }

        private void StartAutomationListener(int listenPort, CancellationToken token)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            var listener = new TcpListener(IPAddress.Loopback, listenPort);
            listener.Start();
            int actualPort = ((IPEndPoint)listener.LocalEndpoint).Port;
            lock (_stateLock)
            {
                _automationListenPort = actualPort;
                _automationListener = listener;
            }
            Log($"[{_gameName}] Automation listener active on 127.0.0.1:{actualPort}");

            _automationAcceptTask = RunInRuntimeContextAsync(() => AcceptAutomationConnectionsAsync(token), token);
        }

        private async Task StopLocalListenerAsync()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            Task? acceptTask;
            lock (_stateLock)
            {
                acceptTask = _acceptTask;
                _acceptTask = null;
                _localListener?.Stop();
                _localListener = null;
            }

            if (acceptTask == null)
                return;

            try
            {
                await acceptTask;
            }
            catch (OperationCanceledException)
            {
            }
            catch
            {
                // AcceptLocalConnectionsAsync already logs meaningful listener failures.
            }
        }

        /// <summary>
        /// Attach MTC's own terminal streams as the "local client" without opening a TCP listener.
        /// <paramref name="toTerminal"/> is where GameInstance writes game output (MTC reads from the other end).
        /// <paramref name="fromTerminal"/> is where MTC writes keystrokes (GameInstance reads from it).
        /// Call this before <see cref="ConnectToServerAsync"/>.
        /// </summary>
        public void ConnectDirectClient(Stream toTerminal, Stream fromTerminal)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _cancellationSource ??= new CancellationTokenSource();
            lock (_stateLock) { _isRunning = true; }

            var token = _cancellationSource.Token;
            var session = new ClientSession
            {
                IsDirect = true,
                RemoteAddress = "127.0.0.1",
                Type = ClientType.Standard,
                WriteStream = toTerminal,
                ReadStream = fromTerminal,
                MenuHandler = _directMenuHandler,
            };

            AddClientSession(session);
            session.ReadTask = RunInRuntimeContextAsync(() => ReadFromClientAsync(session, token), token);
        }

        /// <summary>
        /// Manually connect to the game server
        /// </summary>
        public async Task ConnectToServerAsync()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (_serverClient?.Connected == true)
            {
                Log($"[{_gameName}] Already connected to server");
                return;
            }

            if (_cancellationSource == null)
            {
                throw new InvalidOperationException("Game instance is not running");
            }

            var token = _cancellationSource.Token;

            try
            {
                GlobalModules.GlobalAutoRecorder.ResetState($"server-connect:{_gameName}");
                _serverClient = new TcpClient();
                ConfigureServerSocket(_serverClient);
                await _serverClient.ConnectAsync(_serverAddress, _serverPort, token);
                _serverStream = _serverClient.GetStream();

                Log($"[{_gameName}] Connected to {ServerEndpoint}");

                // Reset telnet negotiation state
                lock (_negotiationLock)
                {
                    _telnetNegotiationComplete = false;
                    _clientBufferDuringNegotiation.Clear();
                }

                System.Threading.Interlocked.Exchange(ref _disconnectHandling, 0);
                long connectedTicks = UtcNowTicks();
                Interlocked.Exchange(ref _lastServerReceiveUtcTicks, connectedTicks);
                MarkClientToServerActivity(connectedTicks);
                ResetServerOutputBoundaryState();
                ClearPendingLocalInputProbe();

                await SendInitialHandshakeAsync(token);
                _interpreter?.HandleConnectionAccepted();
                Connected?.Invoke(this, EventArgs.Empty);

                // Start reading from server
                _serverReadTask = RunInRuntimeContextAsync(() => ReadFromServerAsync(token), token);
                StartServerStaleWatchdog(token);
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Failed to connect to server: {ex.Message}");
                throw;
            }
        }

        private static void ConfigureServerSocket(TcpClient client)
        {
            const int bufferBytes = 4 * 1024 * 1024;

            try
            {
                client.NoDelay = true;
                client.ReceiveBufferSize = bufferBytes;
                client.SendBufferSize = bufferBytes;
            }
            catch
            {
                // Socket buffer limits vary by platform; defaults are safe if tuning fails.
            }
        }

        private DataHeader? GetActiveHeader()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (ScriptRef.GetActiveDatabase() is ModDatabase activeDb)
                return activeDb.DBHeader;
            return GlobalModules.TWXDatabase is ModDatabase globalDb ? globalDb.DBHeader : null;
        }

        private async Task SendInitialHandshakeAsync(CancellationToken token)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (_serverStream == null || _serverClient?.Connected != true)
                return;

            DataHeader? header = GetActiveHeader();
            byte[] handshake;

            if (header?.UseRLogin == true)
            {
                string loginName = header.LoginName ?? string.Empty;
                handshake = Encoding.ASCII.GetBytes("\0" + loginName + "\0\0\0");
                GlobalModules.DebugLog($"[GameInstance] Sending RLogin handshake for '{loginName}'\n");
            }
            else
            {
                handshake = new byte[] { IAC, DO, 246 };
                GlobalModules.DebugLog("[GameInstance] Sending telnet login handshake\n");
            }

            await _serverStream.WriteAsync(handshake, 0, handshake.Length, token);
            await _serverStream.FlushAsync(token);
        }

        /// <summary>
        /// Manually disconnect from the game server
        /// </summary>
        public async Task DisconnectFromServerAsync()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            GlobalModules.DebugLog($"[Network] DisconnectFromServerAsync called for {_gameName}\n");
            GlobalModules.FlushDebugLog();
            if (_serverClient?.Connected != true)
            {
                Log($"[{_gameName}] Not connected to server");
                return;
            }

            try
            {
                if (System.Threading.Interlocked.CompareExchange(ref _disconnectHandling, 1, 0) != 0)
                {
                    Log($"[{_gameName}] Disconnect already in progress");
                    return;
                }

                Log($"[{_gameName}] Disconnecting from server");

                // Close the server connection
                _serverStream?.Close();
                _serverClient?.Close();
                _serverStream = null;
                _serverClient = null;
                ClearPendingServerSends();
                ClearPendingLocalInputProbe();

                // Reset telnet negotiation state
                lock (_negotiationLock)
                {
                    _telnetNegotiationComplete = false;
                    _clientBufferDuringNegotiation.Clear();
                }

                // Send disconnect message to client
                await SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\n[twxp] Disconnected from server.  Type {_commandChar}c to reconnect.\r\n"));

                Disconnected?.Invoke(this, new DisconnectEventArgs("User requested disconnect"));
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error disconnecting: {ex.Message}");
                throw;
            }
        }

        private async Task AcceptLocalConnectionsAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested && _localListener != null)
                {
                    var client = await _localListener.AcceptTcpClientAsync(token);
                    client.NoDelay = true;

                    string remoteAddress = ((IPEndPoint?)client.Client.RemoteEndPoint)?.Address.ToString() ?? "unknown";
                    bool allowed = ShouldAcceptClient(remoteAddress, out bool localClient, out _);
                    NetworkStream stream = client.GetStream();

                    if (!allowed)
                    {
                        byte[] reject = Encoding.ASCII.GetBytes($"\r\nExternal connections are disabled. Goodbye {remoteAddress}!\r\n");
                        await stream.WriteAsync(reject, 0, reject.Length, token);
                        await stream.FlushAsync(token);
                        client.Close();

                        if (BroadCastMsgs)
                            await SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\nRemote connection rejected from: {remoteAddress}\r\n"), broadcastDeaf: true, token: token);
                        continue;
                    }

                    ClientSession? session = null;
                    session = new ClientSession
                    {
                        TcpClient = client,
                        WriteStream = stream,
                        ReadStream = stream,
                        RemoteAddress = remoteAddress,
                        Type = DetermineClientType(remoteAddress, localClient),
                        MenuHandler = new MenuHandler(this, _interpreter, _scriptDirectory, () => GetClientIndex(session!))
                    };

                    AddClientSession(session);
                    Log($"[{_gameName}] Client connected from {remoteAddress} as {DescribeClientType(session.Type)}");

                    await stream.WriteAsync(new byte[] { 255, 251, 1 }, 0, 3, token);
                    await stream.FlushAsync(token);

                    string banner = $"\r\n{Constants.ProductDisplayName}\r\n";
                    await stream.WriteAsync(Encoding.ASCII.GetBytes(banner), token);

                    if (session.Type == ClientType.Mute || session.Type == ClientType.Stream)
                    {
                        string viewOnly = "\r\nYou are locked in view only mode\r\n\r\n";
                        await stream.WriteAsync(Encoding.ASCII.GetBytes(viewOnly), token);
                    }
                    else
                    {
                        string prompt = $"\r\nPress {_commandChar} to activate terminal menu\r\n\r\n";
                        await stream.WriteAsync(Encoding.ASCII.GetBytes(prompt), token);
                    }
                    await stream.FlushAsync(token);

                    if (BroadCastMsgs)
                        await SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\nActive connection detected from: {remoteAddress}\r\n"), broadcastDeaf: true, token: token);

                    _interpreter?.ProgramEvent("Client connected", string.Empty, false);
                    session.ReadTask = RunInRuntimeContextAsync(() => ReadFromClientAsync(session, token), token);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown
            }
            catch (Exception) when (token.IsCancellationRequested || _localListener == null)
            {
                // Expected when the listener is intentionally disabled or the proxy is stopping.
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error accepting connections: {ex.Message}");
            }
        }

        private async Task AcceptAutomationConnectionsAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested && _automationListener != null)
                {
                    var client = await _automationListener.AcceptTcpClientAsync(token);
                    client.NoDelay = true;

                    string remoteAddress = ((IPEndPoint?)client.Client.RemoteEndPoint)?.Address.ToString() ?? "unknown";
                    if (!IsPrivateClientAddress(remoteAddress))
                    {
                        try { client.Close(); } catch { }
                        Log($"[{_gameName}] Automation connection rejected from {remoteAddress}");
                        continue;
                    }

                    NetworkStream stream = client.GetStream();
                    ClientSession? session = null;
                    session = new ClientSession
                    {
                        TcpClient = client,
                        WriteStream = stream,
                        ReadStream = stream,
                        RemoteAddress = $"automation:{remoteAddress}",
                        Type = ClientType.Standard,
                        MenuHandler = new MenuHandler(this, _interpreter, _scriptDirectory, () => GetClientIndex(session!))
                    };

                    AddClientSession(session);
                    Log($"[{_gameName}] Automation client connected from {remoteAddress}");

                    await stream.WriteAsync(new byte[] { 255, 251, 1 }, 0, 3, token);
                    await stream.FlushAsync(token);

                    string banner = $"\r\n{Constants.ProductDisplayName}\r\n";
                    await stream.WriteAsync(Encoding.ASCII.GetBytes(banner), token);
                    string prompt = $"\r\nPress {_commandChar} to activate terminal menu\r\n\r\n";
                    await stream.WriteAsync(Encoding.ASCII.GetBytes(prompt), token);
                    await stream.FlushAsync(token);

                    _interpreter?.ProgramEvent("Client connected", string.Empty, false);
                    session.ReadTask = RunInRuntimeContextAsync(() => ReadFromClientAsync(session, token), token);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown.
            }
            catch (Exception) when (token.IsCancellationRequested || _automationListener == null)
            {
                // Expected when the listener is intentionally disabled or the proxy is stopping.
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error accepting automation connections: {ex.Message}");
            }
        }

        private async Task ReadFromServerAsync(CancellationToken token)
        {
            var buffer = new byte[8192];

            try
            {
                while (!token.IsCancellationRequested && _serverStream != null)
                {
                    int bytesRead = await _serverStream.ReadAsync(buffer, 0, buffer.Length, token);

                    if (bytesRead == 0)
                    {
                        Log($"[{_gameName}] Server disconnected");

                        if (System.Threading.Interlocked.CompareExchange(ref _disconnectHandling, 1, 0) != 0)
                            break;

                        try
                        {
                            string disconnectText = _autoReconnect && !token.IsCancellationRequested
                                ? $"\r\n[twxp] Server disconnected.  Proxy auto-reconnecting...\r\n"
                                : $"\r\n[twxp] Server disconnected.  Type {_commandChar}c to reconnect.\r\n";
                            await SendToLocalAsync(Encoding.ASCII.GetBytes(disconnectText), broadcastDeaf: true, token: token);
                        }
                        catch (Exception ex)
                        {
                            Log($"[{_gameName}] Could not send disconnect message to clients: {ex.Message}");
                        }

                        // Clean up server connection
                        _serverStream?.Close();
                        _serverClient?.Close();
                        _serverStream = null;
                        _serverClient = null;
                        ClearPendingServerSends();
                        ClearPendingLocalInputProbe();

                        // Reset telnet negotiation state
                        lock (_negotiationLock)
                        {
                            _telnetNegotiationComplete = false;
                            _clientBufferDuringNegotiation.Clear();
                        }

                        Disconnected?.Invoke(this, new DisconnectEventArgs("Server closed connection"));
                        StartReconnectIfNeeded();
                        break;
                    }

                    long receiveTimestamp = MarkServerReceive();

                    var data = new byte[bytesRead];
                    Array.Copy(buffer, data, bytesRead);

                    DispatchFastServerDataResponders(data, receiveTimestamp, isRawReceive: true);

                    LogVerbose($"[{_gameName}] Server -> Local: {bytesRead} bytes");

                    // Process telnet protocol and get cleaned data
                    var (cleanData, telnetResponses) = ProcessTelnetFromServer(data);

                    // Send telnet responses back to server if needed
                    if (telnetResponses.Count > 0 && _serverStream != null)
                    {
                        var responses = telnetResponses.ToArray();
                        await _serverStream.WriteAsync(responses, 0, responses.Length, token);
                        await _serverStream.FlushAsync(token);
                        LogVerbose($"[{_gameName}] -> Sent {responses.Length} bytes telnet negotiation to server");
                    }

                    // Check if telnet negotiation is complete (first clean data from server)
                    if (!_telnetNegotiationComplete && cleanData.Length > 0)
                    {
                        byte[]? bufferedData = null;

                        lock (_negotiationLock)
                        {
                            _telnetNegotiationComplete = true;
                            Log($"[{_gameName}] Telnet negotiation complete");

                            // Get any buffered client data that was waiting
                            if (_clientBufferDuringNegotiation.Count > 0)
                            {
                                LogVerbose($"[{_gameName}] Sending {_clientBufferDuringNegotiation.Count} buffered bytes from client");
                                bufferedData = _clientBufferDuringNegotiation.ToArray();
                                _clientBufferDuringNegotiation.Clear();
                            }
                        }

                        // Send buffered data outside the lock
                        if (bufferedData != null && _serverStream != null)
                        {
                            await SendToServerAsync(bufferedData);
                            MarkLocalInputProbe(bufferedData);
                        }
                    }

                    if (cleanData.Length > 0)
                    {
                        DispatchFastServerDataResponders(cleanData, receiveTimestamp, isRawReceive: false);

                        _log.RecordServerData(cleanData);

                        foreach (byte[] segment in SplitServerOutputForDispatch(cleanData))
                        {
                            if (segment.Length == 0)
                                continue;

                            ScriptPipeToggleOutputAction pipeToggleAction = GetScriptPipeToggleOutputAction(segment);
                            bool suppressLocalOutput = pipeToggleAction != ScriptPipeToggleOutputAction.None;
                            if (!suppressLocalOutput)
                            {
                                UpdateServerOutputBoundaryState(segment);
                                await SendToLocalAsync(segment, token: token);
                            }

                            await FlushDeferredLocalOutputWhenSafeAsync(token);
                        }

                        // Match Pascal TWX's ProcessInBound shape for scripts,
                        // AutoRecorder, and parser consumers: they receive the
                        // cleaned inbound buffer once and maintain their own
                        // CR/current-line state. Keep this after local display
                        // forwarding so interactive script output/input prompts
                        // do not get ahead of the game text that caused them.
                        BeginServerDataDispatch();
                        try
                        {
                            ServerDataReceived?.Invoke(this, new DataReceivedEventArgs(cleanData));
                        }
                        finally
                        {
                            EndServerDataDispatch();
                        }

                        await FlushDeferredLocalOutputWhenSafeAsync(token);
                        LogVerbose($"[{_gameName}] -> Forwarded {cleanData.Length} bytes to local clients");
                    }
                    else
                    {
                        Log($"[{_gameName}] -> Only telnet negotiation, nothing to forward");
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error reading from server: {ex.Message}");

                if (System.Threading.Interlocked.CompareExchange(ref _disconnectHandling, 1, 0) != 0)
                    return;

                // Clean up server connection
                _serverStream?.Close();
                _serverClient?.Close();
                _serverStream = null;
                _serverClient = null;
                ClearPendingServerSends();
                ClearPendingLocalInputProbe();

                // Reset telnet negotiation state
                lock (_negotiationLock)
                {
                    _telnetNegotiationComplete = false;
                    _clientBufferDuringNegotiation.Clear();
                }

                try
                {
                    string disconnectText = _autoReconnect && !token.IsCancellationRequested
                        ? $"\r\n[twxp] Server disconnected.  Proxy auto-reconnecting...\r\n"
                        : $"\r\n[twxp] Server disconnected.  Type {_commandChar}c to reconnect.\r\n";
                    await SendToLocalAsync(Encoding.ASCII.GetBytes(disconnectText), broadcastDeaf: true, token: token);
                }
                catch (Exception sendEx)
                {
                    Log($"[{_gameName}] Could not send disconnect message to clients: {sendEx.Message}");
                }

                Disconnected?.Invoke(this, new DisconnectEventArgs(ex.Message));
                StartReconnectIfNeeded();
            }
        }

        private async Task ReconnectLoopAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested && _autoReconnect)
                {
                    int reconnectDelay = _reconnectDelayMs;
                    try { await Task.Delay(reconnectDelay, token); } catch (OperationCanceledException) { return; }
                    if (token.IsCancellationRequested) return;
                    if (_serverClient?.Connected == true) return; // already reconnected

                    try
                    {
                        Log($"[{_gameName}] Auto-reconnect attempt...");
                        GlobalModules.DebugLog($"[AutoReconnect] Connecting to {_serverAddress}:{_serverPort}\n");
                        await SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\nConnecting to {ServerEndpoint}...\r\n"), broadcastDeaf: true, token: token);
                        await ConnectToServerAsync();
                        GlobalModules.DebugLog($"[AutoReconnect] Connected successfully\n");
                        GlobalModules.FlushDebugLog();
                        Log($"[{_gameName}] Auto-reconnect succeeded");
                        await SendToLocalAsync(Encoding.ASCII.GetBytes("Connected!\r\n"), broadcastDeaf: true, token: token);
                        return;
                    }
                    catch (Exception ex)
                    {
                        Log($"[{_gameName}] Auto-reconnect failed: {ex.Message}, retrying in {reconnectDelay / 1000}s...");
                        GlobalModules.DebugLog($"[AutoReconnect] Failed: {ex.Message}, retrying...\n");
                        try
                        {
                            await SendToLocalAsync(
                                Encoding.ASCII.GetBytes($"\r\nConnection failed: {ex.Message}; retrying in {reconnectDelay / 1000}s...\r\n"),
                                broadcastDeaf: true,
                                token: token);
                        }
                        catch
                        {
                            // Local clients may be gone while the proxy keeps retrying.
                        }
                    }
                }
            }
            finally
            {
                System.Threading.Interlocked.Exchange(ref _reconnectLoopRunning, 0);
            }
        }

        /// <summary>
        /// Start the reconnect loop if not already running. Safe to call from any thread.
        /// </summary>
        public void StartReconnectIfNeeded()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (!_autoReconnect || _serverClient?.Connected == true) return;
            if (_cancellationSource == null) return;
            // Only start if no loop is currently running
            if (System.Threading.Interlocked.CompareExchange(ref _reconnectLoopRunning, 1, 0) == 0)
            {
                GlobalModules.DebugLog($"[AutoReconnect] StartReconnectIfNeeded: launching reconnect loop\n");
                GlobalModules.FlushDebugLog();
                _ = RunInRuntimeContextAsync(() => ReconnectLoopAsync(_cancellationSource.Token));
            }
        }

        private void StartServerStaleWatchdog(CancellationToken token)
        {
            if (Interlocked.CompareExchange(ref _serverStaleWatchdogRunning, 1, 0) != 0)
                return;

            _serverStaleWatchdogTask = RunInRuntimeContextAsync(() => ServerStaleWatchdogLoopAsync(token), token);
        }

        private async Task ServerStaleWatchdogLoopAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested)
                {
                    await Task.Delay(ServerStaleWatchdogInterval, token);

                    if (_serverClient?.Connected != true || _serverStream == null)
                        continue;

                    DateTime nowUtc = DateTime.UtcNow;
                    if (await TryHandleStaleLocalInputProbeAsync(nowUtc, token))
                        continue;

                    await TrySendGameIdleKeepaliveAsync(nowUtc, token);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown.
            }
            finally
            {
                Interlocked.Exchange(ref _serverStaleWatchdogRunning, 0);
            }
        }

        private async Task DisconnectStaleServerAsync(
            DateTime probeUtc,
            long lastReceiveTicks,
            TimeSpan elapsed,
            CancellationToken token)
        {
            if (Interlocked.CompareExchange(ref _disconnectHandling, 1, 0) != 0)
                return;

            string lastReceiveText = lastReceiveTicks > 0
                ? new DateTime(lastReceiveTicks, DateTimeKind.Utc).ToString("O")
                : "<never>";
            string probeSummary = _pendingLocalInputProbeSummary;
            int probeBytes = Volatile.Read(ref _pendingLocalInputProbeBytes);
            string reason =
                $"No server data received for {elapsed.TotalSeconds:F1}s after local terminal input " +
                $"({probeBytes} byte(s), {probeSummary}); lastServerReceiveUtc={lastReceiveText}";

            Log($"[{_gameName}] Stale server connection detected: {reason}");

            try { _serverStream?.Close(); } catch { }
            try { _serverClient?.Close(); } catch { }
            _serverStream = null;
            _serverClient = null;
            ClearPendingServerSends();
            ClearPendingLocalInputProbe();

            lock (_negotiationLock)
            {
                _telnetNegotiationComplete = false;
                _clientBufferDuringNegotiation.Clear();
            }

            try
            {
                string disconnectText = _autoReconnect && !token.IsCancellationRequested
                    ? $"\r\n[twxp] Stale server connection detected after local input.  Proxy auto-reconnecting...\r\n"
                    : $"\r\n[twxp] Stale server connection detected after local input.  Type {_commandChar}c to reconnect.\r\n";
                await SendToLocalAsync(Encoding.ASCII.GetBytes(disconnectText), broadcastDeaf: true, token: token);
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Could not send stale disconnect message to clients: {ex.Message}");
            }

            Disconnected?.Invoke(this, new DisconnectEventArgs(reason));

            StartReconnectIfNeeded();
        }

        private long MarkServerReceive()
        {
            long ticks = UtcNowTicks();
            Interlocked.Exchange(ref _lastServerReceiveUtcTicks, ticks);
            ClearPendingLocalInputProbe();
            return Stopwatch.GetTimestamp();
        }

        private void MarkClientToServerActivity()
            => MarkClientToServerActivity(UtcNowTicks());

        private void MarkClientToServerActivity(long utcTicks)
            => Interlocked.Exchange(ref _lastClientToServerActivityUtcTicks, utcTicks);

        private async Task<bool> TryHandleStaleLocalInputProbeAsync(DateTime nowUtc, CancellationToken token)
        {
            if (!StaleLocalInputProbeEnabled)
            {
                ClearPendingLocalInputProbe();
                return false;
            }

            long probeTicks = Interlocked.Read(ref _pendingLocalInputProbeUtcTicks);
            if (probeTicks <= 0)
                return false;

            long lastReceiveTicks = Interlocked.Read(ref _lastServerReceiveUtcTicks);
            if (lastReceiveTicks >= probeTicks)
            {
                ClearPendingLocalInputProbe();
                return false;
            }

            DateTime probeUtc = new(probeTicks, DateTimeKind.Utc);
            TimeSpan elapsed = nowUtc - probeUtc;
            if (elapsed < TimeSpan.FromSeconds(NormalizeNetworkWatchdogSeconds(
                    LocalInputResponseTimeoutSeconds,
                    DefaultLocalInputResponseTimeoutSeconds)))
            {
                return false;
            }

            if (IsServerDataDispatchActive())
            {
                Log($"[{_gameName}] Stale server connection probe suppressed while server data dispatch is active: elapsed={elapsed.TotalSeconds:F1}s after local input; script execution may be monopolizing the read loop");
                return true;
            }

            await DisconnectStaleServerAsync(probeUtc, lastReceiveTicks, elapsed, token);
            return true;
        }

        private async Task TrySendGameIdleKeepaliveAsync(DateTime nowUtc, CancellationToken token)
        {
            if (!GameIdleKeepaliveEnabled || token.IsCancellationRequested)
                return;

            int intervalSeconds = NormalizeNetworkWatchdogSeconds(
                GameIdleKeepaliveIntervalSeconds,
                DefaultGameIdleKeepaliveIntervalSeconds);
            long lastActivityTicks = Interlocked.Read(ref _lastClientToServerActivityUtcTicks);
            if (lastActivityTicks <= 0)
                return;

            TimeSpan idle = nowUtc - new DateTime(lastActivityTicks, DateTimeKind.Utc);
            if (idle < TimeSpan.FromSeconds(intervalSeconds))
                return;

            if (!_serverSendQueue.IsEmpty ||
                Interlocked.CompareExchange(ref _serverSendPumpScheduled, 0, 0) != 0)
            {
                return;
            }

            if (!_serverSendLock.Wait(0))
                return;

            await SendGameIdleKeepaliveBytesAsync($"after {idle.TotalSeconds:F1}s idle", token, releaseLock: true);
        }

        public Task SendGameIdleKeepaliveAsync(string reason)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            CancellationToken token = _cancellationSource?.Token ?? CancellationToken.None;
            if (token.IsCancellationRequested)
                return Task.CompletedTask;

            if (!_serverSendLock.Wait(0))
                return Task.CompletedTask;

            return SendGameIdleKeepaliveBytesAsync(reason, token, releaseLock: true);
        }

        private async Task SendGameIdleKeepaliveBytesAsync(string reason, CancellationToken token, bool releaseLock)
        {
            try
            {
                NetworkStream? stream = _serverStream;
                if (stream == null || _serverClient?.Connected != true)
                    return;

                await stream.WriteAsync(GameIdleKeepaliveBytes, 0, GameIdleKeepaliveBytes.Length, token);
                await stream.FlushAsync(token);
                MarkClientToServerActivity();
                GlobalModules.DebugLog($"[{_gameName}] Sent ANSI status-response keepalive {reason}; next keepalive based on client-to-server inactivity\n");
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error sending idle keepalive: {ex.Message}");
            }
            finally
            {
                if (releaseLock)
                    _serverSendLock.Release();
            }
        }

        private static int NormalizeNetworkWatchdogSeconds(int value, int defaultValue)
            => value is >= MinimumNetworkWatchdogSeconds and <= MaximumNetworkWatchdogSeconds
                ? value
                : defaultValue;

        private void ClearPendingLocalInputProbe()
        {
            Interlocked.Exchange(ref _pendingLocalInputProbeUtcTicks, 0);
            Volatile.Write(ref _pendingLocalInputProbeBytes, 0);
            _pendingLocalInputProbeSummary = string.Empty;
        }

        private void MarkLocalInputProbe(byte[] data)
        {
            if (!ShouldProbeForServerResponse(data))
                return;

            Interlocked.Exchange(ref _pendingLocalInputProbeUtcTicks, UtcNowTicks());
            Volatile.Write(ref _pendingLocalInputProbeBytes, data.Length);
            _pendingLocalInputProbeSummary = SummarizeProbeBytes(data);
        }

        private static bool ShouldProbeForServerResponse(byte[] data)
        {
            foreach (byte b in data)
            {
                if (b == 13 || b == 10 || (b >= 0x20 && b < 0x7F))
                    return true;
            }

            return false;
        }

        private static string SummarizeProbeBytes(byte[] data)
        {
            const int maxBytes = 16;
            int count = Math.Min(data.Length, maxBytes);
            var hex = new StringBuilder();
            var ascii = new StringBuilder();

            for (int i = 0; i < count; i++)
            {
                if (i > 0)
                    hex.Append(' ');
                byte b = data[i];
                hex.Append(b.ToString("X2"));
                ascii.Append(b >= 0x20 && b < 0x7F ? (char)b : '.');
            }

            if (data.Length > maxBytes)
            {
                hex.Append(" ...");
                ascii.Append("...");
            }

            return $"hex={hex}, ascii='{ascii}'";
        }

        private bool CanAcceptNativeBotClientInput()
        {
            Func<bool>? canAccept = NativeBotCanAcceptLocalInput;
            if (canAccept == null)
                return false;

            try
            {
                return canAccept();
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[NativeBot.RemoteInput] accept check failed: {ex.Message}\n");
                return false;
            }
        }

        private async Task<bool> TryHandleNativeBotClientInputAsync(
            ClientSession session,
            byte value,
            bool scriptWaitingForInput,
            bool keypressMode,
            CancellationToken token)
        {
            if (session.SuppressNextLineFeedAfterNativeBotPrompt)
            {
                session.SuppressNextLineFeedAfterNativeBotPrompt = false;
                if (value == 0x0A)
                    return true;
            }

            if (session.NativeBotCommandMode)
                return await HandleNativeBotClientCommandInputAsync(session, value, token);

            if (session.NativeBotHotkeyMode)
                return await HandleNativeBotClientHotkeyInputAsync(session, value, token);

            if (scriptWaitingForInput ||
                keypressMode ||
                !CanAcceptNativeBotClientInput())
            {
                return false;
            }

            if (value == (byte)'>')
            {
                await BeginNativeBotClientCommandPromptAsync(session, string.Empty, token);
                return true;
            }

            if (value == 0x09)
            {
                await BeginNativeBotClientHotkeyPromptAsync(session, token);
                return true;
            }

            return false;
        }

        private async Task BeginNativeBotClientCommandPromptAsync(ClientSession session, string initialValue, CancellationToken token)
        {
            session.NativeBotHotkeyMode = false;
            session.NativeBotCommandMode = true;
            session.NativeBotCommandBuffer.Clear();
            if (!string.IsNullOrEmpty(initialValue))
                session.NativeBotCommandBuffer.Append(initialValue);

            await WriteNativeBotClientPromptAsync(session, "\r\nmombot> " + initialValue, token);
        }

        private async Task BeginNativeBotClientHotkeyPromptAsync(ClientSession session, CancellationToken token)
        {
            session.NativeBotCommandMode = false;
            session.NativeBotCommandBuffer.Clear();
            session.NativeBotHotkeyMode = true;

            await WriteNativeBotClientPromptAsync(session, "\r\nmombot hotkey> ", token);
        }

        private async Task<bool> HandleNativeBotClientCommandInputAsync(ClientSession session, byte value, CancellationToken token)
        {
            if (!CanAcceptNativeBotClientInput())
            {
                ResetNativeBotClientInputState(session);
                return false;
            }

            switch (value)
            {
                case 0x1B:
                    ResetNativeBotClientInputState(session);
                    await WriteNativeBotClientPromptAsync(session, "\r\n", token);
                    return true;

                case 0x0D:
                    session.SuppressNextLineFeedAfterNativeBotPrompt = true;
                    await SubmitNativeBotClientCommandAsync(session, token);
                    return true;

                case 0x0A:
                    await SubmitNativeBotClientCommandAsync(session, token);
                    return true;

                case 0x08:
                case 0x7F:
                    if (session.NativeBotCommandBuffer.Length > 0)
                    {
                        session.NativeBotCommandBuffer.Length--;
                        await WriteNativeBotClientPromptAsync(session, "\b \b", token);
                    }
                    return true;

                case 0x09:
                    session.NativeBotCommandMode = false;
                    session.NativeBotCommandBuffer.Clear();
                    await BeginNativeBotClientHotkeyPromptAsync(session, token);
                    return true;

                default:
                    if (value >= 0x20)
                    {
                        session.NativeBotCommandBuffer.Append((char)value);
                        await WriteNativeBotClientPromptAsync(session, Encoding.Latin1.GetString(new[] { value }), token);
                    }
                    return true;
            }
        }

        private async Task<bool> HandleNativeBotClientHotkeyInputAsync(ClientSession session, byte value, CancellationToken token)
        {
            if (!CanAcceptNativeBotClientInput())
            {
                ResetNativeBotClientInputState(session);
                return false;
            }

            switch (value)
            {
                case 0x1B:
                case 0x0D:
                    session.SuppressNextLineFeedAfterNativeBotPrompt = value == 0x0D;
                    ResetNativeBotClientInputState(session);
                    await WriteNativeBotClientPromptAsync(session, "\r\n", token);
                    return true;

                case 0x0A:
                    ResetNativeBotClientInputState(session);
                    await WriteNativeBotClientPromptAsync(session, "\r\n", token);
                    return true;
            }

            session.NativeBotHotkeyMode = false;

            Func<byte, Task<NativeBotClientInputResult>>? executor = NativeBotHotkeyExecutor;
            if (executor == null)
            {
                await WriteNativeBotClientPromptAsync(session, "\r\nmombot: hotkeys are unavailable.\r\n", token);
                return true;
            }

            try
            {
                NativeBotClientInputResult result = await executor(value);
                if (!string.IsNullOrEmpty(result.PromptSeed))
                {
                    await BeginNativeBotClientCommandPromptAsync(session, result.PromptSeed, token);
                    return true;
                }

                if (!result.IsHandled)
                    await WriteNativeBotClientPromptAsync(session, "\r\n", token);
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[NativeBot.RemoteInput] hotkey failed for {value}: {ex}\n");
                GlobalModules.FlushDebugLog();
                await WriteNativeBotClientPromptAsync(session, $"\r\nmombot: hotkey failed: {ex.Message}\r\n", token);
            }

            return true;
        }

        private async Task SubmitNativeBotClientCommandAsync(ClientSession session, CancellationToken token)
        {
            string input = session.NativeBotCommandBuffer.ToString().Trim();
            ResetNativeBotClientInputState(session);
            await WriteNativeBotClientPromptAsync(session, "\r\n", token);

            if (string.IsNullOrWhiteSpace(input))
                return;

            Func<string, Task<bool>>? executor = NativeBotLocalInputExecutor;
            if (executor == null)
            {
                await WriteNativeBotClientPromptAsync(session, "mombot: local commands are unavailable.\r\n", token);
                return;
            }

            try
            {
                bool handled = await executor(input);
                if (!handled)
                    await WriteNativeBotClientPromptAsync(session, "mombot: command was not handled.\r\n", token);
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[NativeBot.RemoteInput] command failed for '{input}': {ex}\n");
                GlobalModules.FlushDebugLog();
                await WriteNativeBotClientPromptAsync(session, $"mombot: command failed: {ex.Message}\r\n", token);
            }
        }

        private static void ResetNativeBotClientInputState(ClientSession session)
        {
            session.NativeBotCommandMode = false;
            session.NativeBotHotkeyMode = false;
            session.NativeBotCommandBuffer.Clear();
        }

        private static async Task WriteNativeBotClientPromptAsync(ClientSession session, string text, CancellationToken token)
        {
            if (string.IsNullOrEmpty(text))
                return;

            byte[] bytes = Encoding.Latin1.GetBytes(text);
            await session.WriteStream.WriteAsync(bytes, 0, bytes.Length, token);
            await session.WriteStream.FlushAsync(token);
        }

        private async Task ReadFromClientAsync(ClientSession session, CancellationToken token)
        {
            var buffer = new byte[8192];
            var commandBuffer = new StringBuilder();
            bool inCommandMode = false;
            int scriptFullLineInputEchoLength = 0;

            try
            {
                while (!token.IsCancellationRequested && session.IsConnected)
                {
                    int bytesRead = await session.ReadStream.ReadAsync(buffer, 0, buffer.Length, token);
                    if (bytesRead == 0)
                        break;

                    for (int i = 0; i < bytesRead; i++)
                    {
                        _log.NotifyUserInput();

                        byte b = buffer[i];
                        char c = (char)b;

                        if (session.Type is ClientType.Mute or ClientType.Stream)
                            continue;

                        if (c == _commandChar)
                        {
                            if (session.MenuHandler.IsActive)
                            {
                                await session.MenuHandler.ExitMenuAsync();
                            }
                            else if (inCommandMode)
                            {
                                string command = commandBuffer.ToString();
                                commandBuffer.Clear();
                                inCommandMode = false;

                                Log($"[{_gameName}] Command from {session.RemoteAddress}: {command}");
                                using var _ = PushClientContext(GetClientIndex(session));
                                await HandleCommandAsync(command);
                            }
                            else
                            {
                                inCommandMode = false;
                                await session.MenuHandler.HandleMenuCommandAsync(c);
                            }
                        }
                        else if (inCommandMode)
                        {
                            commandBuffer.Append(c);
                        }
                        else
                        {
                            if (session.MenuHandler.IsActive)
                            {
                                bool handled = await session.MenuHandler.HandleInputCharAsync(c);
                                if (!handled)
                                    await session.MenuHandler.HandleMenuCommandAsync(c);
                                continue;
                            }

                            bool scriptWaitingForInput = _interpreter?.IsAnyScriptWaitingForInput() ?? false;
                            bool handledByScriptMenu = false;

                            if (!scriptWaitingForInput && GlobalModules.TWXMenu is MenuManager menuMgr && menuMgr.IsMenuOpen())
                                handledByScriptMenu = menuMgr.HandleMenuInput(c);

                            if (!handledByScriptMenu)
                            {
                                bool handled = await session.MenuHandler.HandleInputCharAsync(c);

                                if (!handled && session.MenuHandler.CurrentMenu != MenuState.None)
                                {
                                    await session.MenuHandler.HandleMenuCommandAsync(c);
                                }
                                else if (!handled)
                                {
                                    bool keypressMode = scriptWaitingForInput && (_interpreter?.HasKeypressInputWaiting ?? false);
                                    if (await TryHandleNativeBotClientInputAsync(session, b, scriptWaitingForInput, keypressMode, token))
                                        continue;

                                    bool echoKeypressInput = keypressMode && (_interpreter?.HasEchoingKeypressInputWaiting ?? false);
                                    bool textOutConsumed = false;
                                    bool enteredInputWait = false;
                                    if (_interpreter != null && !scriptWaitingForInput)
                                    {
                                        textOutConsumed = _interpreter.TextOutEvent(c.ToString(), null);
                                        enteredInputWait = _interpreter.IsAnyScriptWaitingForInput();
                                    }

                                    // If a text-out trigger on this exact character just opened a
                                    // GETINPUT/GETCONSOLEINPUT wait, do not also forward that same
                                    // character to the server or reuse it as the pending reply.
                                    bool suppressCurrentCharForNewInputWait = !scriptWaitingForInput && enteredInputWait;
                                    if (!scriptWaitingForInput)
                                        scriptFullLineInputEchoLength = 0;

                                    bool sendToServer = !textOutConsumed &&
                                                        !scriptWaitingForInput &&
                                                        !suppressCurrentCharForNewInputWait;
                                    if (sendToServer && _serverStream != null && _serverClient?.Connected == true)
                                    {
                                        bool negotiationInProgress;
                                        lock (_negotiationLock)
                                            negotiationInProgress = !_telnetNegotiationComplete;

                                        if (negotiationInProgress)
                                        {
                                            lock (_negotiationLock)
                                                _clientBufferDuringNegotiation.Add(b);

                                            if (i == 0)
                                                Log($"[{_gameName}] Buffering client data during telnet negotiation");
                                        }
                                        else
                                        {
                                            byte[] forwarded = new byte[] { b };
                                            await SendToServerAsync(forwarded);
                                            MarkLocalInputProbe(forwarded);
                                        }
                                    }
                                    else if (scriptWaitingForInput && keypressMode && echoKeypressInput)
                                    {
                                        if (b >= 32 || b == 9)
                                        {
                                            await session.WriteStream.WriteAsync(new byte[] { b }, 0, 1, token);
                                            await session.WriteStream.FlushAsync(token);
                                        }
                                    }
                                    else if (scriptWaitingForInput && !keypressMode)
                                    {
                                        if (b == 8 || b == 127)
                                        {
                                            await session.WriteStream.WriteAsync(new byte[] { 8, 32, 8 }, 0, 3, token);
                                            await session.WriteStream.FlushAsync(token);
                                            if (scriptFullLineInputEchoLength > 0)
                                                scriptFullLineInputEchoLength--;
                                        }
                                        else if (b != 13 && b != 10)
                                        {
                                            if (scriptFullLineInputEchoLength == 0 && (b >= 32 || b == 9))
                                                await session.WriteStream.WriteAsync(new byte[] { 32 }, 0, 1, token);
                                            await session.WriteStream.WriteAsync(new byte[] { b }, 0, 1, token);
                                            await session.WriteStream.FlushAsync(token);
                                            if (b >= 32 || b == 9)
                                                scriptFullLineInputEchoLength++;
                                        }
                                        else if (b == 13)
                                        {
                                            await session.WriteStream.WriteAsync(new byte[] { 13, 10 }, 0, 2, token);
                                            await session.WriteStream.FlushAsync(token);
                                            scriptFullLineInputEchoLength = 0;
                                        }
                                    }

                                    if (!textOutConsumed && !suppressCurrentCharForNewInputWait)
                                    {
                                        LocalDataReceived?.Invoke(this, new DataReceivedEventArgs(new byte[] { b }));
                                    }
                                    else if (suppressCurrentCharForNewInputWait)
                                        GlobalModules.DebugLog($"[INPUT] Suppressed trigger character {b} ('{c}') after text-out handler opened input wait\n");
                                }
                            }
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Error reading from client {session.RemoteAddress}: {ex.Message}");
            }
            finally
            {
                bool wasRejected = session.Type == ClientType.Rejected;
                RemoveClientSession(session);

                CloseClientSession(session);

                if (!wasRejected)
                {
                    IReadOnlyList<ClientSession> remaining = GetClientSnapshot();
                    byte[] notice = Encoding.ASCII.GetBytes($"\r\nConnection lost from: {session.RemoteAddress}\r\n");
                    foreach (ClientSession other in remaining)
                    {
                        if (ReferenceEquals(other, session))
                            continue;
                        try
                        {
                            await other.WriteStream.WriteAsync(notice, 0, notice.Length, token);
                            await other.WriteStream.FlushAsync(token);
                        }
                        catch
                        {
                            // Ignore stale peers here.
                        }
                    }

                    _interpreter?.ProgramEvent("Client disconnected", string.Empty, false);
                }

                Log($"[{_gameName}] Client disconnected: {session.RemoteAddress}");
            }
        }

        /// <summary>
        /// Process telnet protocol sequences from server
        /// Returns cleaned data (without telnet commands) and responses to send back
        /// </summary>
        private (byte[] cleanData, List<byte> responses) ProcessTelnetFromServer(byte[] data)
        {
            var cleanData = new List<byte>();
            var responses = new List<byte>();

            int i = 0;
            while (i < data.Length)
            {
                if (data[i] == IAC && i + 1 < data.Length)
                {
                    byte command = data[i + 1];

                    if (command == IAC)
                    {
                        // Escaped IAC (255 255 means literal 255)
                        cleanData.Add(IAC);
                        i += 2;
                    }
                    else if (command == DO && i + 2 < data.Length)
                    {
                        // Server wants us to DO something
                        byte option = data[i + 2];
                        Log($"[{_gameName}] Telnet: Server DO {option}");
                        // Respond with WONT (we don't support options)
                        responses.Add(IAC);
                        responses.Add(WONT);
                        responses.Add(option);
                        i += 3;
                    }
                    else if (command == DONT && i + 2 < data.Length)
                    {
                        // Server wants us to NOT do something
                        byte option = data[i + 2];
                        Log($"[{_gameName}] Telnet: Server DONT {option}");
                        // Acknowledge with WONT
                        responses.Add(IAC);
                        responses.Add(WONT);
                        responses.Add(option);
                        i += 3;
                    }
                    else if (command == WILL && i + 2 < data.Length)
                    {
                        // Server will do something
                        byte option = data[i + 2];
                        Log($"[{_gameName}] Telnet: Server WILL {option}");
                        // Accept with DO (or reject with DONT if we don't want it)
                        responses.Add(IAC);
                        responses.Add(DO);
                        responses.Add(option);
                        i += 3;
                    }
                    else if (command == WONT && i + 2 < data.Length)
                    {
                        // Server won't do something
                        byte option = data[i + 2];
                        Log($"[{_gameName}] Telnet: Server WONT {option}");
                        // Acknowledge with DONT
                        responses.Add(IAC);
                        responses.Add(DONT);
                        responses.Add(option);
                        i += 3;
                    }
                    else if (command == SB)
                    {
                        // Subnegotiation - skip until SE
                        Log($"[{_gameName}] Telnet: Subnegotiation Begin");
                        i += 2;
                        while (i < data.Length - 1)
                        {
                            if (data[i] == IAC && data[i + 1] == SE)
                            {
                                Log($"[{_gameName}] Telnet: Subnegotiation End");
                                i += 2;
                                break;
                            }
                            i++;
                        }
                    }
                    else
                    {
                        // Unknown IAC command, skip it
                        Log($"[{_gameName}] Telnet: Unknown command {command}");
                        i += 2;
                    }
                }
                else
                {
                    // Regular data
                    cleanData.Add(data[i]);
                    i++;
                }
            }

            return (cleanData.ToArray(), responses);
        }

        /// <summary>
        /// Handle command execution
        /// </summary>
        private async Task HandleCommandAsync(string command)
        {
            // Fire event for external handling
            CommandReceived?.Invoke(this, new CommandEventArgs(command));

            // Handle built-in commands
            switch (command.ToLower())
            {
                case "c":
                case "connect":
                    // Check if already connected - if so, disconnect
                    if (_serverClient?.Connected == true)
                    {
                        await DisconnectFromServerAsync();
                    }
                    else
                    {
                        // Not connected, so connect
                        try
                        {
                            await SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\n{ConnectingStatusText}\r\n"));
                            await ConnectToServerAsync();
                            await SendToLocalAsync(Encoding.ASCII.GetBytes("Connected!\r\n"));
                        }
                        catch (Exception ex)
                        {
                            await SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\nConnection failed: {ex.Message}\r\n"));
                        }
                    }
                    break;
            }
        }

        /// <summary>
        /// Send data to the server
        /// </summary>
        public Task SendToServerAsync(byte[] data)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (data.Length == 0 || _serverStream == null || _serverClient?.Connected != true)
                return Task.CompletedTask;

            byte[] copy = new byte[data.Length];
            Buffer.BlockCopy(data, 0, copy, 0, data.Length);
            DispatchServerDataSent(copy);

            if (_serverSendQueue.IsEmpty && _serverSendLock.Wait(0))
            {
                try
                {
                    NetworkStream? stream = _serverStream;
                    if (stream != null && _serverClient?.Connected == true)
                    {
                        stream.Write(copy, 0, copy.Length);
                        stream.Flush();
                        MarkClientToServerActivity();
                    }

                    return Task.CompletedTask;
                }
                catch (Exception ex)
                {
                    Log($"[{_gameName}] Error sending immediate server data: {ex.Message}");
                    return Task.CompletedTask;
                }
                finally
                {
                    _serverSendLock.Release();
                }
            }

            _serverSendQueue.Enqueue(copy);
            _serverSendSignal.Release();
            ScheduleServerSendPump();
            return Task.CompletedTask;
        }

        public FastServerSendResult TrySendToServerImmediate(byte[] data)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            long startTimestamp = Stopwatch.GetTimestamp();

            if (data.Length == 0)
                return FastServerSendResult.Failed(startTimestamp, Stopwatch.GetTimestamp(), "No data to send.");

            NetworkStream? stream = _serverStream;
            if (stream == null || _serverClient?.Connected != true)
                return FastServerSendResult.Failed(startTimestamp, Stopwatch.GetTimestamp(), "Server is not connected.");

            if (!_serverSendLock.Wait(0))
                return FastServerSendResult.Failed(startTimestamp, Stopwatch.GetTimestamp(), "Server send lock is busy.");

            try
            {
                stream.Write(data, 0, data.Length);
                stream.Flush();
                MarkClientToServerActivity();
                DispatchServerDataSent(data);
                return FastServerSendResult.Succeeded(startTimestamp, Stopwatch.GetTimestamp(), data.Length);
            }
            catch (Exception ex)
            {
                return FastServerSendResult.Failed(startTimestamp, Stopwatch.GetTimestamp(), ex.Message);
            }
            finally
            {
                _serverSendLock.Release();
            }
        }

        public IDisposable RegisterFastServerDataResponder(Action<FastServerDataEventArgs> responder)
        {
            ArgumentNullException.ThrowIfNull(responder);

            lock (_fastServerDataResponderLock)
                _fastServerDataResponders.Add(responder);

            return new FastServerDataResponderRegistration(this, responder);
        }

        public IDisposable RegisterProxyMenuCommand(ProxyMenuCommand command)
        {
            ArgumentNullException.ThrowIfNull(command);

            string path = NormalizeProxyMenuPath(command.Path);
            if (path.Length == 0)
                throw new ArgumentException("Proxy menu command path cannot be empty.", nameof(command));

            var registered = command with { Path = path };
            lock (_proxyMenuCommandLock)
                _proxyMenuCommands[path] = registered;

            return new ProxyMenuCommandRegistration(this, path, registered);
        }

        internal bool HasProxyMenuPath(string path)
        {
            string normalized = NormalizeProxyMenuPath(path);
            lock (_proxyMenuCommandLock)
            {
                return _proxyMenuCommands.ContainsKey(normalized) ||
                       _proxyMenuCommands.Keys.Any(key => key.StartsWith(normalized, StringComparison.OrdinalIgnoreCase));
            }
        }

        internal IReadOnlyList<ProxyMenuCommand> GetProxyMenuChildCommands(string parentPath)
        {
            string normalized = NormalizeProxyMenuPath(parentPath);
            int childLength = normalized.Length + 1;

            lock (_proxyMenuCommandLock)
            {
                return _proxyMenuCommands
                    .Where(pair =>
                        pair.Key.Length == childLength &&
                        (normalized.Length == 0 || pair.Key.StartsWith(normalized, StringComparison.OrdinalIgnoreCase)))
                    .Select(pair => pair.Value)
                    .OrderBy(command => command.Path, StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
        }

        internal bool HasProxyMenuChildren(string parentPath)
            => GetProxyMenuChildCommands(parentPath).Count > 0;

        internal string GetProxyMenuCommandDescription(string path)
        {
            string normalized = NormalizeProxyMenuPath(path);
            lock (_proxyMenuCommandLock)
            {
                return _proxyMenuCommands.TryGetValue(normalized, out ProxyMenuCommand? command)
                    ? command.Description
                    : string.Empty;
            }
        }

        internal async Task<ProxyMenuCommandResult?> ExecuteProxyMenuCommandAsync(string path)
        {
            ProxyMenuCommand? command;
            string normalized = NormalizeProxyMenuPath(path);
            lock (_proxyMenuCommandLock)
                _proxyMenuCommands.TryGetValue(normalized, out command);

            if (command?.ExecuteAsync == null)
                return null;

            var context = new ProxyMenuCommandContext(this, normalized);
            return await command.ExecuteAsync(context).ConfigureAwait(false);
        }

        internal void UnregisterProxyMenuCommand(string path, ProxyMenuCommand command)
        {
            lock (_proxyMenuCommandLock)
            {
                if (_proxyMenuCommands.TryGetValue(path, out ProxyMenuCommand? current) &&
                    ReferenceEquals(current, command))
                {
                    _proxyMenuCommands.Remove(path);
                }
            }
        }

        internal void UnregisterFastServerDataResponder(Action<FastServerDataEventArgs> responder)
        {
            lock (_fastServerDataResponderLock)
                _fastServerDataResponders.Remove(responder);
        }

        private static string NormalizeProxyMenuPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return string.Empty;

            var normalized = new StringBuilder(path.Length);
            foreach (char c in path)
            {
                if (!char.IsWhiteSpace(c) && c != '>' && c != '/')
                    normalized.Append(char.ToUpperInvariant(c));
            }

            return normalized.ToString();
        }

        private void DispatchFastServerDataResponders(byte[] data, long receiveTimestamp, bool isRawReceive)
        {
            Action<FastServerDataEventArgs>[] responders;
            lock (_fastServerDataResponderLock)
            {
                if (_fastServerDataResponders.Count == 0)
                    return;

                responders = _fastServerDataResponders.ToArray();
            }

            var args = new FastServerDataEventArgs(this, data, receiveTimestamp, Stopwatch.GetTimestamp(), isRawReceive);
            foreach (Action<FastServerDataEventArgs> responder in responders)
            {
                try
                {
                    responder(args);
                }
                catch (Exception ex)
                {
                    Log($"[{_gameName}] Fast server data responder failed: {ex.Message}");
                }
            }
        }

        private void ScheduleServerSendPump()
        {
            if (Interlocked.CompareExchange(ref _serverSendPumpScheduled, 1, 0) != 0)
                return;

            CancellationToken token = _cancellationSource?.Token ?? CancellationToken.None;
            _ = RunInRuntimeContextAsync(() => ProcessServerSendQueueAsync(token));
        }

        private async Task ProcessServerSendQueueAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested)
                {
                    await _serverSendSignal.WaitAsync(token);

                    while (!token.IsCancellationRequested)
                    {
                        try
                        {
                            await _serverSendLock.WaitAsync(token);
                            try
                            {
                                if (!_serverSendQueue.TryDequeue(out byte[]? data) || data == null)
                                    break;

                                NetworkStream? stream = _serverStream;
                                if (stream != null && _serverClient?.Connected == true)
                                {
                                    await stream.WriteAsync(data, 0, data.Length, token);
                                    await stream.FlushAsync(token);
                                    MarkClientToServerActivity();
                                }
                            }
                            finally
                            {
                                _serverSendLock.Release();
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            throw;
                        }
                        catch (Exception ex)
                        {
                            Log($"[{_gameName}] Error sending queued server data: {ex.Message}");
                            if (_serverStream == null || _serverClient?.Connected != true)
                                ClearPendingServerSends();
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown.
            }
            finally
            {
                Interlocked.Exchange(ref _serverSendPumpScheduled, 0);
                if (!_serverSendQueue.IsEmpty && !token.IsCancellationRequested)
                    ScheduleServerSendPump();
            }
        }

        private void ClearPendingServerSends()
        {
            while (_serverSendQueue.TryDequeue(out _)) { }
        }

        /// <summary>
        /// Send data to the local client
        /// </summary>
        private static async Task WriteToClientAsync(ClientSession client, byte[] data, CancellationToken token = default)
        {
            byte[] payload = client.Type == ClientType.Stream ? ApplyStreamMask(data) : data;
            await client.WriteStream.WriteAsync(payload, 0, payload.Length, token);
            await client.WriteStream.FlushAsync(token);
        }

        public async Task SendToLocalAsync(byte[] data, bool broadcastDeaf = false, CancellationToken token = default)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            await _localSendLock.WaitAsync(token);
            try
            {
                IReadOnlyList<ClientSession> clients = GetClientSnapshot();
                foreach (ClientSession client in clients)
                {
                    if (client.Type == ClientType.Rejected)
                        continue;
                    if (!broadcastDeaf && client.Type == ClientType.Deaf)
                        continue;

                    try
                    {
                        await WriteToClientAsync(client, data, token);
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        Log($"[SendToLocalAsync] Failed sending to client {client.RemoteAddress}: {ex.Message}");
                        RemoveClientSession(client);
                        CloseClientSession(client);
                    }
                }
            }
            finally
            {
                _localSendLock.Release();
            }
        }

        public async Task SendToClientAsync(int clientIndex, byte[] data, CancellationToken token = default)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            await _localSendLock.WaitAsync(token);
            try
            {
                ClientSession? client = GetClientSession(clientIndex);
                if (client == null || client.Type == ClientType.Rejected)
                    return;

                try
                {
                    await WriteToClientAsync(client, data, token);
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    Log($"[SendToClientAsync] Failed sending to client {client.RemoteAddress}: {ex.Message}");
                    RemoveClientSession(client);
                    CloseClientSession(client);
                }
            }
            finally
            {
                _localSendLock.Release();
            }
        }

        private async Task SendPlaybackToLocalAsync(byte[] data, CancellationToken token)
        {
            await SendToLocalAsync(data, token: token);
        }

        /// <summary>
        /// Send text to the local client
        /// </summary>
        public async Task SendMessageAsync(string message)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            message = ApplyQuickText(message);
            var data = Encoding.ASCII.GetBytes(message);
            if (TryQueueDeferredLocalOutput(data, broadcastDeaf: false))
                return;

            if (_preferredClientIndex.Value is int clientIndex)
                await SendToClientAsync(clientIndex, data);
            else
                await SendToLocalAsync(data);
        }

        public string ApplyQuickText(string text)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            text = text.Replace("~~", "\u00FF", StringComparison.Ordinal);

            if (text.Contains("~_", StringComparison.Ordinal))
            {
                string botTag = _interpreter?.ActiveBotTag ?? string.Empty;
                int tagLength = _interpreter?.ActiveBotTagLength ?? 0;
                string filler = new string('-', Math.Max(0, 67 - tagLength));
                text = text.Replace("~_", filler + botTag + "--", StringComparison.Ordinal);
            }

            foreach ((string Search, string Replace) in _userQuickTexts)
                text = text.Replace(Search, Replace, StringComparison.Ordinal);

            foreach ((string Search, string Replace) in _systemQuickTexts)
                text = text.Replace(Search, Replace, StringComparison.Ordinal);

            text = text.Replace("\u00FF", "~", StringComparison.Ordinal);
            return text.Replace("^[", "\u001b[", StringComparison.Ordinal);
        }

        private void AddSystemQuickText(string key, string value)
        {
            _systemQuickTexts.Add((key, value));
        }

        private void InitializeSystemQuickTexts()
        {
            AddSystemQuickText("~a", "^[0;30m");
            AddSystemQuickText("~b", "^[0;31m");
            AddSystemQuickText("~c", "^[0;32m");
            AddSystemQuickText("~d", "^[0;33m");
            AddSystemQuickText("~e", "^[0;34m");
            AddSystemQuickText("~f", "^[0;35m");
            AddSystemQuickText("~g", "^[0;36m");
            AddSystemQuickText("~h", "^[0;37m");
            AddSystemQuickText("~A", "^[1;30m");
            AddSystemQuickText("~B", "^[1;31m");
            AddSystemQuickText("~C", "^[1;32m");
            AddSystemQuickText("~D", "^[1;33m");
            AddSystemQuickText("~E", "^[1;34m");
            AddSystemQuickText("~F", "^[1;35m");
            AddSystemQuickText("~G", "^[1;36m");
            AddSystemQuickText("~H", "^[1;37m");
            AddSystemQuickText("~i", "^[40m");
            AddSystemQuickText("~j", "^[41m");
            AddSystemQuickText("~k", "^[42m");
            AddSystemQuickText("~l", "^[43m");
            AddSystemQuickText("~m", "^[44m");
            AddSystemQuickText("~n", "^[45m");
            AddSystemQuickText("~o", "^[46m");
            AddSystemQuickText("~p", "^[47m");
            AddSystemQuickText("~I", "^[5;40m");
            AddSystemQuickText("~J", "^[5;41m");
            AddSystemQuickText("~K", "^[5;42m");
            AddSystemQuickText("~L", "^[5;43m");
            AddSystemQuickText("~M", "^[5;44m");
            AddSystemQuickText("~N", "^[5;45m");
            AddSystemQuickText("~O", "^[5;46m");
            AddSystemQuickText("~P", "^[5;47m");
            AddSystemQuickText("~!", "^[2J^[H");
            AddSystemQuickText("~@", "\r^[0m^[0K");
            AddSystemQuickText("~0", "^[0m");
            AddSystemQuickText("~1", "^[0m^[1;36m");
            AddSystemQuickText("~2", "^[0m^[1;33m");
            AddSystemQuickText("~3", "^[0m^[35m");
            AddSystemQuickText("~4", "^[0m^[1;44m");
            AddSystemQuickText("~5", "^[0m^[32m");
            AddSystemQuickText("~6", "^[0m^[1;5;37m");
            AddSystemQuickText("~7", "^[0m^[1;37m");
            AddSystemQuickText("~8", "^[0m^[1;5;31m");
            AddSystemQuickText("~9", "^[0m^[30;47m");
            AddSystemQuickText("~s", "\u001b[s");
            AddSystemQuickText("~u", "\u001b[u");
            AddSystemQuickText("~-", "---------------------------------------------------------------------");
            AddSystemQuickText("~=", "=====================================================================");
            AddSystemQuickText("~+", "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
        }

        private void RegisterBotConfig(BotConfig config)
        {
            if (string.IsNullOrWhiteSpace(config.Name))
                return;

            if (_botConfigs.TryGetValue(config.Name, out BotConfig? existing))
                _botOrder.Remove(existing);

            _botConfigs[config.Name] = config;
            _botOrder.Add(config);
        }

        public void ReloadBotConfigs(string? programDir, string? scriptDirectory, bool includeNative = false)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _botConfigs.Clear();
            _botOrder.Clear();

            foreach (BotConfig bot in ProxyMenuCatalog.LoadBotConfigs(programDir, scriptDirectory, includeNative))
                RegisterBotConfig(bot);

            if (!string.IsNullOrWhiteSpace(ActiveBotName) &&
                !_botConfigs.ContainsKey(ActiveBotName) &&
                !_botOrder.Any(bot => string.Equals(bot.Name, ActiveBotName, StringComparison.OrdinalIgnoreCase)))
            {
                ActiveBotName = string.Empty;
            }
        }

        public void RegisterOrUpdateBotConfig(BotConfig config)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RegisterBotConfig(config);
        }

        public bool ToggleNativeHaggle(NativeHaggleChangeSource source = NativeHaggleChangeSource.User)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            SetNativeHaggleEnabled(!NativeHaggleEnabled, source);
            return _nativeHaggle.Enabled;
        }

        public void SetNativeHaggleEnabled(bool enabled, NativeHaggleChangeSource source = NativeHaggleChangeSource.Runtime)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (_nativeHaggle.Enabled == enabled)
            {
                _pendingNativeHaggleChangeSource = NativeHaggleChangeSource.Runtime;
                return;
            }

            _pendingNativeHaggleChangeSource = source;
            _nativeHaggle.SetEnabled(enabled);
        }

        public void SetNativeHaggleMode(string? mode)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _nativeHaggle.SetFirstBidMode(mode);
        }

        public void SetNativePortHaggleMode(string? mode)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _nativeHaggle.SetPortHaggleMode(mode);
        }

        public void SetNativePlanetHaggleMode(string? mode)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _nativeHaggle.SetPlanetHaggleMode(mode);
        }

        public void SetNativeHaggleModes(string? portMode, string? planetMode)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _nativeHaggle.SetPortHaggleMode(portMode);
            _nativeHaggle.SetPlanetHaggleMode(planetMode);
        }

        internal void RegisterNativeHaggleMode(NativeHaggleModeExtension mode)
        {
            _nativeHaggle.RegisterMode(mode);
        }

        internal void UnregisterNativeHaggleMode(string? modeId)
        {
            _nativeHaggle.UnregisterMode(modeId);
        }

        public void SetCommandChar(char commandChar)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (!char.IsControl(commandChar))
                _commandChar = commandChar;
        }

        public bool ProcessNativeHaggleLine(string line)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(line))
                return false;

            string? response = _nativeHaggle.HandleLine(line);
            if (!string.IsNullOrEmpty(response))
            {
                SendNativeHaggleResponse(response);
                return true;
            }

            return false;
        }

        public void ObserveScriptSend(string text)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _nativeHaggle.ObserveScriptSend(text);

            if (text == "|")
            {
                Interlocked.Increment(ref _suppressScriptPipeToggleMessageCount);
                GlobalModules.DebugLog("[MSGTOGGLE] Armed suppression for next script-triggered message toggle response\n");
            }
        }

        private void DispatchServerDataSent(byte[] data)
        {
            EventHandler<DataReceivedEventArgs>? handler = ServerDataSent;
            if (handler == null || data.Length == 0)
                return;

            byte[] copy = new byte[data.Length];
            Buffer.BlockCopy(data, 0, copy, 0, data.Length);

            try
            {
                handler(this, new DataReceivedEventArgs(copy));
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[Network] ServerDataSent observer failed: {ex}\n");
            }
        }

        private ScriptPipeToggleOutputAction GetScriptPipeToggleOutputAction(byte[] cleanData)
        {
            if (Volatile.Read(ref _suppressScriptPipeToggleMessageCount) <= 0)
            {
                return ScriptPipeToggleOutputAction.None;
            }

            string text = Encoding.Latin1.GetString(cleanData);
            bool containsToggleMessage =
                text.Contains("Silencing all messages.", StringComparison.Ordinal) ||
                text.Contains("Displaying all messages.", StringComparison.Ordinal);
            bool containsPrompt =
                text.Contains("(?=Help)? :", StringComparison.Ordinal) ||
                text.Contains("Main> ", StringComparison.Ordinal) ||
                text.Contains("Script> ", StringComparison.Ordinal);

            if (containsToggleMessage && Volatile.Read(ref _suppressScriptPipeToggleMessageCount) > 0)
            {
                Interlocked.Decrement(ref _suppressScriptPipeToggleMessageCount);
                if (containsPrompt)
                    return ScriptPipeToggleOutputAction.None;

                GlobalModules.DebugLog("[MSGTOGGLE] Suppressed local display of script-triggered message toggle response\n");
                return ScriptPipeToggleOutputAction.Suppress;
            }

            return ScriptPipeToggleOutputAction.None;
        }

        private static IEnumerable<byte[]> SplitServerOutputForDispatch(byte[] data)
        {
            int start = 0;
            int i = 0;

            while (i < data.Length)
            {
                byte value = data[i];
                if (value == (byte)'\r')
                {
                    int end = ConsumeLineTerminatorTail(data, i + 1);
                    yield return SliceBytes(data, start, end - start);
                    start = end;
                    i = end;
                    continue;
                }

                if (value == (byte)'\n')
                {
                    int end = i + 1;
                    yield return SliceBytes(data, start, end - start);
                    start = end;
                }

                i++;
            }

            if (start < data.Length)
                yield return SliceBytes(data, start, data.Length - start);
        }

        private static int ConsumeLineTerminatorTail(byte[] data, int index)
        {
            // TW2002 commonly sends "text\r ESC[0m \n next prompt".  Keep the
            // reset/LF attached to the completed line so deferred script output
            // flushes after the visual line is complete, not between CR and reset.
            while (index < data.Length)
            {
                if (data[index] == (byte)'\n')
                {
                    index++;
                    continue;
                }

                if (data[index] != 0x1B)
                    break;

                int escapeStart = index;
                index++;
                if (index >= data.Length)
                    return data.Length;

                if (data[index] == (byte)'[')
                {
                    index++;
                    while (index < data.Length)
                    {
                        byte b = data[index++];
                        if (b >= 0x40 && b <= 0x7E)
                            break;
                    }

                    continue;
                }

                // Unknown/incomplete escape: keep the rest with this line rather
                // than allowing local script output to split an ANSI sequence.
                return data.Length;
            }

            return index;
        }

        private static byte[] SliceBytes(byte[] data, int offset, int length)
        {
            if (length <= 0)
                return Array.Empty<byte>();

            var result = new byte[length];
            Buffer.BlockCopy(data, offset, result, 0, length);
            return result;
        }

        private static byte[] CopyBytes(byte[] data)
        {
            if (data.Length == 0)
                return Array.Empty<byte>();

            var result = new byte[data.Length];
            Buffer.BlockCopy(data, 0, result, 0, data.Length);
            return result;
        }

        private void SendNativeHaggleResponse(string response)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            _serverSendLock.Wait();
            try
            {
                if (_serverStream == null || _serverClient?.Connected != true)
                {
                    GlobalModules.DebugLog($"[NativeHaggle] Dropped response '{response}' because the server is not connected.\n");
                    return;
                }

                byte[] data = Encoding.ASCII.GetBytes(response + "\r");
                GlobalModules.DebugLog($"[NativeHaggle] SEND '{response}\\r'\n");
                _serverStream.Write(data, 0, data.Length);
                _serverStream.Flush();
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[NativeHaggle] SEND FAILED '{response}': {ex.Message}\n");
            }
            finally
            {
                _serverSendLock.Release();
            }
        }

        /// <summary>
        /// Request input buffer to be cleared (for GETINPUT)
        /// </summary>
        public void ClearInputBuffer()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ClearInputBufferRequested?.Invoke(this, EventArgs.Empty);
        }

        private void CloseConnections()
        {
            _log.CloseLog();

            _serverStream?.Close();
            _serverClient?.Close();
            _localListener?.Stop();
            _automationListener?.Stop();

            _serverStream = null;
            _serverClient = null;
            _localListener = null;
            _automationListener = null;
            _automationListenPort = 0;
            ClearPendingServerSends();
            ClearPendingLocalInputProbe();

            IReadOnlyList<ClientSession> clients = GetClientSnapshot();
            foreach (ClientSession client in clients)
            {
                try { client.WriteStream.Close(); } catch { }
                if (!ReferenceEquals(client.ReadStream, client.WriteStream))
                {
                    try { client.ReadStream.Close(); } catch { }
                }
                try { client.TcpClient?.Close(); } catch { }
            }

            lock (_clientLock)
                _clients.Clear();
        }

        #region ITWXServer Implementation

        public void Broadcast(string message)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            byte[] data = Encoding.Latin1.GetBytes(ApplyQuickText(message));
            if (TryQueueDeferredLocalOutput(data, broadcastDeaf: false))
                return;

            SendToLocalAsync(data).Wait();
        }

        public void Broadcast(string message, bool broadcastDeaf)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            byte[] data = Encoding.Latin1.GetBytes(ApplyQuickText(message));
            // ECHO/ECHOEX and script prompts use broadcastDeaf so menu/status
            // messages remain visible while scripts mute server output. Do not
            // defer those behind server dispatch, or a deafing script can appear
            // to hang without showing its own progress message.
            if (!broadcastDeaf && TryQueueDeferredLocalOutput(data, broadcastDeaf: false))
                return;

            SendToLocalAsync(data, broadcastDeaf: broadcastDeaf).Wait();
        }

        public void BroadcastLiteral(string message)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            byte[] data = Encoding.Latin1.GetBytes(message ?? string.Empty);
            if (TryQueueDeferredLocalOutput(data, broadcastDeaf: false))
                return;

            SendToLocalAsync(data).Wait();
        }

        public void BroadcastLiteral(string message, bool broadcastDeaf)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            byte[] data = Encoding.Latin1.GetBytes(message ?? string.Empty);
            if (!broadcastDeaf && TryQueueDeferredLocalOutput(data, broadcastDeaf: false))
                return;

            SendToLocalAsync(data, broadcastDeaf: broadcastDeaf).Wait();
        }

        public void ClientMessage(string message)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            byte[] data = Encoding.Latin1.GetBytes(ApplyQuickText(message));
            if (TryQueueDeferredLocalOutput(data, broadcastDeaf: false))
                return;

            SendToLocalAsync(data).Wait();
        }

        private void ResetServerOutputBoundaryState()
        {
            lock (_serverOutputBoundaryLock)
            {
                _serverOutputLineOpen = false;
                _serverOutputAnsiState = 0;
            }
        }

        private void UpdateServerOutputBoundaryState(byte[] data)
        {
            if (data.Length == 0)
                return;

            lock (_serverOutputBoundaryLock)
            {
                foreach (byte value in data)
                    UpdateServerOutputBoundaryState(value);
            }
        }

        private void UpdateServerOutputBoundaryState(byte value)
        {
            const byte escape = 0x1B;
            const byte bell = 0x07;

            if (_serverOutputAnsiState == 1)
            {
                _serverOutputAnsiState = value switch
                {
                    (byte)'[' => 2,
                    (byte)']' => 3,
                    >= 0x30 and <= 0x7E => 0,
                    _ => 1
                };
                return;
            }

            if (_serverOutputAnsiState == 2)
            {
                if (value is >= 0x40 and <= 0x7E)
                    _serverOutputAnsiState = 0;
                return;
            }

            if (_serverOutputAnsiState == 3)
            {
                if (value == bell)
                    _serverOutputAnsiState = 0;
                else if (value == escape)
                    _serverOutputAnsiState = 4;
                return;
            }

            if (_serverOutputAnsiState == 4)
            {
                _serverOutputAnsiState = value == (byte)'\\' ? 0 : 3;
                return;
            }

            if (value == escape)
            {
                // ANSI cursor/erase/SGR sequences can be the first part of a
                // visual line even before printable text arrives.  Do not let
                // deferred local/script output flush between that setup and the
                // following server text, or it can inherit/corrupt color state.
                _serverOutputLineOpen = true;
                _serverOutputAnsiState = 1;
                return;
            }

            if (value is (byte)'\r' or (byte)'\n')
            {
                _serverOutputLineOpen = false;
                return;
            }

            if (value >= 0x20 || value == (byte)'\t')
                _serverOutputLineOpen = true;
        }

        private bool IsDeferredLocalOutputFlushSafe()
        {
            lock (_serverOutputBoundaryLock)
                return _serverOutputAnsiState == 0 && !_serverOutputLineOpen;
        }

        private bool IsServerOutputInsideAnsi()
        {
            lock (_serverOutputBoundaryLock)
                return _serverOutputAnsiState != 0;
        }

        private void BeginServerDataDispatch()
        {
            lock (_deferredLocalOutputLock)
                _serverDataDispatchDepth++;
        }

        private void EndServerDataDispatch()
        {
            lock (_deferredLocalOutputLock)
            {
                if (_serverDataDispatchDepth > 0)
                    _serverDataDispatchDepth--;
            }
        }

        private bool IsServerDataDispatchActive()
        {
            lock (_deferredLocalOutputLock)
                return _serverDataDispatchDepth > 0;
        }

        private bool TryQueueDeferredLocalOutput(byte[] data, bool broadcastDeaf)
        {
            lock (_deferredLocalOutputLock)
            {
                if (_serverDataDispatchDepth <= 0)
                    return false;

                byte[] copy = new byte[data.Length];
                Buffer.BlockCopy(data, 0, copy, 0, data.Length);
                _deferredLocalOutput.Add(new DeferredLocalOutput
                {
                    Data = copy,
                    BroadcastDeaf = broadcastDeaf
                });
                return true;
            }
        }

        private bool HasDeferredLocalOutput()
        {
            lock (_deferredLocalOutputLock)
                return _deferredLocalOutput.Count > 0;
        }

        private async Task FlushDeferredLocalOutputWhenSafeAsync(CancellationToken token = default)
        {
            if (!HasDeferredLocalOutput())
                return;

            if (IsDeferredLocalOutputFlushSafe())
                await FlushDeferredLocalOutputAsync(token);
            else
                ScheduleDeferredLocalOutputFlushAfterQuiet(token);
        }

        private async Task FlushDeferredLocalOutputAsync(CancellationToken token = default)
        {
            List<DeferredLocalOutput>? pending = null;
            lock (_deferredLocalOutputLock)
            {
                if (_serverDataDispatchDepth > 0 || _deferredLocalOutput.Count == 0)
                    return;

                pending = new List<DeferredLocalOutput>(_deferredLocalOutput);
                _deferredLocalOutput.Clear();
            }

            foreach (DeferredLocalOutput output in pending)
                await SendToLocalAsync(output.Data, output.BroadcastDeaf, token);
        }

        private void ScheduleDeferredLocalOutputFlushAfterQuiet(CancellationToken token = default)
        {
            if (!HasDeferredLocalOutput())
                return;

            if (Interlocked.CompareExchange(ref _deferredLocalOutputFlushScheduled, 1, 0) != 0)
                return;

            _ = RunInRuntimeContextAsync(() => DeferredLocalOutputQuietFlushLoopAsync(token));
        }

        private async Task DeferredLocalOutputQuietFlushLoopAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested && HasDeferredLocalOutput())
                {
                    long observedReceiveTicks = Interlocked.Read(ref _lastServerReceiveUtcTicks);
                    await Task.Delay(DeferredLocalOutputQuietDelay, token);

                    if (!HasDeferredLocalOutput())
                        return;

                    if (Interlocked.Read(ref _lastServerReceiveUtcTicks) != observedReceiveTicks)
                        continue;

                    // Never let script/local output complete a partially received ANSI sequence.
                    if (IsServerOutputInsideAnsi())
                        continue;

                    await FlushDeferredLocalOutputAsync(token);
                    return;
                }
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown.
            }
            catch (Exception ex)
            {
                Log($"[{_gameName}] Deferred local output flush failed: {ex.Message}");
            }
            finally
            {
                Interlocked.Exchange(ref _deferredLocalOutputFlushScheduled, 0);

                if (!token.IsCancellationRequested && HasDeferredLocalOutput())
                    ScheduleDeferredLocalOutputFlushAfterQuiet(token);
            }
        }

        public void AddQuickText(string key, string value)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(key))
                return;

            ClearQuickText(key);
            _userQuickTexts.Add((key, ApplyQuickText(value ?? string.Empty)));
        }

        public void ClearQuickText(string? key = null)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(key))
            {
                _userQuickTexts.Clear();
                return;
            }

            _userQuickTexts.RemoveAll(entry => string.Equals(entry.Search, key, StringComparison.Ordinal));
        }

        public ClientType GetClientType(int index)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            return GetClientSession(index)?.Type ?? ClientType.Standard;
        }

        public void SetClientType(int index, ClientType type)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ClientType previousType;

            lock (_clientLock)
            {
                if (index < 0 || index >= _clients.Count)
                    return;

                ClientSession client = _clients[index];
                previousType = client.Type;
                if (previousType == type)
                    return;

                client.Type = type;
            }

            ClientTypeChanged?.Invoke(this, new ClientTypeChangedEventArgs(index, previousType, type));
        }

        public void RegisterBot(string botName, string scriptFile, string description = "")
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(botName) || string.IsNullOrWhiteSpace(scriptFile))
                return;

            RegisterBotConfig(new BotConfig
            {
                Name = botName,
                ScriptFile = scriptFile.Replace('\\', '/'),
                ScriptFiles = new List<string> { scriptFile.Replace('\\', '/') },
                Description = description ?? string.Empty,
            });
        }

        public void UnregisterBot(string botName)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(botName))
                return;

            BotConfig? config = GetBotConfig(botName);
            if (config == null)
                return;

            _botConfigs.Remove(config.Name);
            _botOrder.Remove(config);
            if (string.Equals(ActiveBotName, config.Name, StringComparison.OrdinalIgnoreCase))
                ActiveBotName = string.Empty;
        }

        public List<string> GetBotList()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            return _botOrder.Select(bot => bot.Name).ToList();
        }

        public BotConfig? GetBotConfig(string botName)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(botName))
                return null;

            string selector = botName.Trim();
            if (selector.StartsWith("bot:", StringComparison.OrdinalIgnoreCase))
                selector = selector["bot:".Length..];

            if (_botConfigs.TryGetValue(selector, out BotConfig? config))
                return config;

            config = _botOrder.FirstOrDefault(bot =>
                string.Equals(bot.Alias, selector, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(bot.Name, selector, StringComparison.OrdinalIgnoreCase));
            if (config != null)
                return config;

            return _botOrder.FirstOrDefault(bot =>
                (!string.IsNullOrWhiteSpace(bot.ScriptFile) &&
                 bot.ScriptFile.Contains(selector, StringComparison.OrdinalIgnoreCase)) ||
                bot.ScriptFiles.Any(script => script.Contains(selector, StringComparison.OrdinalIgnoreCase)));
        }

        public object? GetActiveBot()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            return _interpreter?.GetActiveBot();
        }

        #endregion

        public void Dispose()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);

            // Unregister from GlobalModules if we're the current TWXServer
            if (GlobalModules.TWXServer == this)
            {
                GlobalModules.TWXServer = null;
            }

            StopAsync().Wait();
            _cancellationSource?.Dispose();
            _serverSendLock.Dispose();
            _localSendLock.Dispose();
            _log.Dispose();
        }
    }

    /// <summary>
    /// Event args for data received events
    /// </summary>
    public class DataReceivedEventArgs : EventArgs
    {
        public byte[] Data { get; }
        // Use Latin1 (ISO-8859-1) to preserve bytes 128-255 as char n.
        // Pascal TWX used 8-bit strings where byte 179 = char 179, so scripts
        // that use #179 (the ³ status-bar separator) must see the same value.
        public string Text => Encoding.Latin1.GetString(Data);

        public DataReceivedEventArgs(byte[] data)
        {
            Data = data;
        }
    }

    public sealed class FastServerDataEventArgs : EventArgs
    {
        private readonly GameInstance _gameInstance;
        private string? _text;

        internal FastServerDataEventArgs(
            GameInstance gameInstance,
            byte[] data,
            long receiveTimestamp,
            long dispatchTimestamp,
            bool isRawReceive)
        {
            _gameInstance = gameInstance;
            Data = data;
            ReceiveTimestamp = receiveTimestamp;
            DispatchTimestamp = dispatchTimestamp;
            IsRawReceive = isRawReceive;
        }

        public byte[] Data { get; }
        public long ReceiveTimestamp { get; }
        public long DispatchTimestamp { get; }
        public bool IsRawReceive { get; }
        public string Text => _text ??= Encoding.Latin1.GetString(Data);

        public FastServerSendResult TrySendToServerImmediate(byte[] data)
            => _gameInstance.TrySendToServerImmediate(data);

        public Task SendToServerAsync(byte[] data)
            => _gameInstance.SendToServerAsync(data);
    }

    public readonly record struct FastServerSendResult(
        bool Success,
        int BytesSent,
        long StartTimestamp,
        long EndTimestamp,
        string Error)
    {
        public static FastServerSendResult Succeeded(long startTimestamp, long endTimestamp, int bytesSent)
            => new(true, bytesSent, startTimestamp, endTimestamp, string.Empty);

        public static FastServerSendResult Failed(long startTimestamp, long endTimestamp, string error)
            => new(false, 0, startTimestamp, endTimestamp, error);
    }

    internal sealed class FastServerDataResponderRegistration : IDisposable
    {
        private GameInstance? _gameInstance;
        private Action<FastServerDataEventArgs>? _responder;

        public FastServerDataResponderRegistration(
            GameInstance gameInstance,
            Action<FastServerDataEventArgs> responder)
        {
            _gameInstance = gameInstance;
            _responder = responder;
        }

        public void Dispose()
        {
            GameInstance? gameInstance = Interlocked.Exchange(ref _gameInstance, null);
            Action<FastServerDataEventArgs>? responder = Interlocked.Exchange(ref _responder, null);
            if (gameInstance != null && responder != null)
                gameInstance.UnregisterFastServerDataResponder(responder);
        }
    }

    public enum ProxyMenuCommandResult
    {
        StayInMenu,
        ExitMenu,
    }

    public sealed record ProxyMenuCommand
    {
        public required string Path { get; init; }
        public required string Description { get; init; }
        public Func<ProxyMenuCommandContext, Task<ProxyMenuCommandResult>>? ExecuteAsync { get; init; }
    }

    public sealed class ProxyMenuCommandContext
    {
        internal ProxyMenuCommandContext(GameInstance gameInstance, string path)
        {
            GameInstance = gameInstance;
            Path = path;
        }

        public GameInstance GameInstance { get; }
        public string Path { get; }
        public char Key => Path.Length == 0 ? '\0' : Path[^1];

        public Task SendMessageAsync(string message)
            => GameInstance.SendMessageAsync(message);

        public Task SendToServerAsync(string text)
            => GameInstance.SendToServerAsync(Encoding.ASCII.GetBytes(text));
    }

    internal sealed class ProxyMenuCommandRegistration : IDisposable
    {
        private GameInstance? _gameInstance;
        private ProxyMenuCommand? _command;
        private readonly string _path;

        public ProxyMenuCommandRegistration(
            GameInstance gameInstance,
            string path,
            ProxyMenuCommand command)
        {
            _gameInstance = gameInstance;
            _path = path;
            _command = command;
        }

        public void Dispose()
        {
            GameInstance? gameInstance = Interlocked.Exchange(ref _gameInstance, null);
            ProxyMenuCommand? command = Interlocked.Exchange(ref _command, null);
            if (gameInstance != null && command != null)
                gameInstance.UnregisterProxyMenuCommand(_path, command);
        }
    }

    /// <summary>
    /// Event args for command events
    /// </summary>
    public class CommandEventArgs : EventArgs
    {
        public string Command { get; }

        public CommandEventArgs(string command)
        {
            Command = command;
        }
    }

    /// <summary>
    /// Event args for disconnect events
    /// </summary>
    public class DisconnectEventArgs : EventArgs
    {
        public string Reason { get; }

        public DisconnectEventArgs(string reason)
        {
            Reason = reason;
        }
    }

    public class ClientTypeChangedEventArgs : EventArgs
    {
        public int ClientIndex { get; }
        public ClientType PreviousType { get; }
        public ClientType ClientType { get; }

        public ClientTypeChangedEventArgs(int clientIndex, ClientType previousType, ClientType clientType)
        {
            ClientIndex = clientIndex;
            PreviousType = previousType;
            ClientType = clientType;
        }
    }

    /// <summary>
    /// Manages multiple game instances
    /// </summary>
    public class NetworkManager : IDisposable
    {
        private readonly ConcurrentDictionary<string, GameInstance> _gameInstances;
        private readonly object _managementLock = new();

        public NetworkManager()
        {
            _gameInstances = new ConcurrentDictionary<string, GameInstance>();
        }

        /// <summary>
        /// Create and start a game instance
        /// </summary>
        public async Task<GameInstance> StartGameAsync(string gameName, string serverAddress, int serverPort, int listenPort, char commandChar = '$', ModInterpreter? interpreter = null, string? scriptDirectory = null)
        {
            lock (_managementLock)
            {
                if (_gameInstances.ContainsKey(gameName))
                {
                    throw new InvalidOperationException($"Game instance {gameName} is already running");
                }
            }

            var instance = new GameInstance(gameName, serverAddress, serverPort, listenPort, commandChar, interpreter, scriptDirectory);

            if (_gameInstances.TryAdd(gameName, instance))
            {
                try
                {
                    await instance.StartAsync();
                    Console.WriteLine($"Started game instance: {gameName}");
                    return instance;
                }
                catch
                {
                    _gameInstances.TryRemove(gameName, out _);
                    throw;
                }
            }

            throw new InvalidOperationException($"Failed to add game instance {gameName}");
        }

        /// <summary>
        /// Stop a game instance
        /// </summary>
        public async Task StopGameAsync(string gameName)
        {
            if (_gameInstances.TryRemove(gameName, out var instance))
            {
                await instance.StopAsync();
                instance.Dispose();
                Console.WriteLine($"Stopped game instance: {gameName}");
            }
        }

        /// <summary>
        /// Get a game instance by name
        /// </summary>
        public GameInstance? GetGame(string gameName)
        {
            _gameInstances.TryGetValue(gameName, out var instance);
            return instance;
        }

        /// <summary>
        /// Get all running game instances
        /// </summary>
        public IEnumerable<GameInstance> GetAllGames()
        {
            return _gameInstances.Values;
        }

        /// <summary>
        /// Stop all game instances
        /// </summary>
        public async Task StopAllGamesAsync()
        {
            var tasks = _gameInstances.Values.Select(g => g.StopAsync()).ToList();
            await Task.WhenAll(tasks);

            foreach (var instance in _gameInstances.Values)
            {
                instance.Dispose();
            }

            _gameInstances.Clear();
            Console.WriteLine("Stopped all game instances");
        }

        public void Dispose()
        {
            StopAllGamesAsync().Wait();
        }
    }
}
