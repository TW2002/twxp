/*
Copyright (C) 2005  Remco Mulder

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

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
*/

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading;

namespace TWXProxy.Core
{
    public interface IConditionalLogGate
    {
        static abstract bool IsEnabled { get; }
    }

    [InterpolatedStringHandler]
    public ref struct ConditionalLogInterpolatedStringHandler<TGate>
        where TGate : IConditionalLogGate
    {
        private DefaultInterpolatedStringHandler _builder;

        public ConditionalLogInterpolatedStringHandler(
            int literalLength,
            int formattedCount,
            out bool shouldAppend)
        {
            IsEnabled = shouldAppend = TGate.IsEnabled;
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
        public void AppendFormatted(string? value) => _builder.AppendFormatted(value);
        public void AppendFormatted(string? value, int alignment = 0, string? format = null) =>
            _builder.AppendFormatted(value, alignment, format);

        public string GetFormattedText() => _builder.ToStringAndClear();
    }

    public readonly struct DebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.DebugMode;
    }

    public readonly struct TriggerDebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.DebugMode && GlobalModules.TriggerDebugMode;
    }

    public readonly struct ScriptTraceDebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.DebugMode && GlobalModules.ScriptTraceDebugMode;
    }

    public readonly struct VariablePersistenceDebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled =>
            GlobalModules.DebugMode && GlobalModules.VariablePersistenceDebugMode;
    }

    public readonly struct AutoRecorderDebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled =>
            GlobalModules.DebugMode && GlobalModules.AutoRecorderDebugMode;
    }

    public readonly struct PortHaggleDebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.PortHaggleDebugMode;
    }

    public readonly struct PlanetHaggleDebugLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.PlanetHaggleDebugMode;
    }

    public readonly struct DatabaseCorrectionLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.DatabaseCorrectionLoggingEnabled;
    }

    public readonly struct VmMetricLogGate : IConditionalLogGate
    {
        public static bool IsEnabled => GlobalModules.EnableVmMetrics;
    }

    public class TimerItem
    {
        private string _name;
        private long _startTime;

        public TimerItem(string name)
        {
            _name = name;
            _startTime = Stopwatch.GetTimestamp();
        }

        public string Name
        {
            get { return _name; }
            set { _name = value; }
        }

        public long StartTime
        {
            get { return _startTime; }
            set { _startTime = value; }
        }
    }

    public class GlobalVarItem : IDisposable
    {
        private string _name;
        private string _value;
        private List<string>? _array;
        private int _arrayCount;

        public GlobalVarItem(string name, string value)
        {
            _name = name;
            _value = value;
            _arrayCount = 0;
        }

        public GlobalVarItem(string name, List<string> data)
        {
            _name = name;
            _value = string.Empty;
            _array = data;
            _arrayCount = data.Count;
        }

        public string Name
        {
            get { return _name; }
            set { _name = value; }
        }

        public string Value
        {
            get { return _value; }
            set { _value = value; }
        }

        public List<string>? Data
        {
            get { return _array; }
            set { _array = value; }
        }

        public int ArrayCount
        {
            get { return _arrayCount; }
            set { _arrayCount = value; }
        }

        public void Dispose()
        {
            _array?.Clear();
        }
    }

    /// <summary>
    /// Per-game runtime state that historically lived in <see cref="GlobalModules"/>.
    /// MTC tab support requires each game session to own one of these contexts so
    /// server, interpreter, database, and AutoRecorder state cannot bleed between tabs.
    /// </summary>
    public sealed class TwxRuntimeContext
    {
        public TwxRuntimeContext(string name)
        {
            Name = string.IsNullOrWhiteSpace(name) ? "default" : name;
        }

        public string Name { get; }
        public ITWXMenu? TWXMenu { get; set; }
        public ITWXDatabase? TWXDatabase { get; set; }
        public object? TWXLog { get; set; }
        public object? TWXExtractor { get; set; }
        public object? TWXInterpreter { get; set; }
        public ITWXServer? TWXServer { get; set; }
        public object? TWXClient { get; set; }
        public object? TWXBubble { get; set; }
        public object? TWXGUI { get; set; }
        public object? PersistenceManager { get; set; }
        public AutoRecorder AutoRecorder { get; } = new AutoRecorder();
        public ModDatabase? ActiveDatabase { get; set; }
        public ModInterpreter? ActiveInterpreter { get; set; }
        public GameInstance? ActiveGameInstance { get; set; }
        public Action<string, string>? OnVariableSaved { get; set; }
        public int CurrentSector { get; set; }
        public string CurrentLine { get; set; } = string.Empty;
        public string CurrentAnsiLine { get; set; } = string.Empty;
        public string RawPacket { get; set; } = string.Empty;
        public bool DebugMode { get; set; } = true;
        public bool VerboseDebugMode { get; set; } = false;
        public bool ScriptTraceDebugMode { get; set; } = false;
        public bool VariablePersistenceDebugMode { get; set; } = false;
        public bool AutoRecorderDebugMode { get; set; } = true;
        public bool TriggerDebugMode { get; set; } = false;
        public string DebugLogPath { get; set; } = "/tmp/twxp_debug.log";
        public string DatabaseCorrectionLogPath { get; set; } = "/tmp/twxp_db_errors.log";
        public bool DatabaseCorrectionLoggingEnabled { get; set; } = false;
        public Dictionary<string, string> CurrentGameVars { get; } =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        public List<GlobalVarItem> TWXGlobalVars { get; set; } = new List<GlobalVarItem>();
        public List<TimerItem> TWXTimers { get; set; } = new List<TimerItem>();
    }

    // Global module instances - these will be initialized by the application
    public static class GlobalModules
    {
        private sealed class RuntimeContextScope : IDisposable
        {
            private readonly TwxRuntimeContext? _previousContext;
            private bool _disposed;

            public RuntimeContextScope(TwxRuntimeContext context)
            {
                _previousContext = _currentContext.Value;
                _currentContext.Value = context;
            }

            public void Dispose()
            {
                if (_disposed)
                    return;

                _currentContext.Value = _previousContext;
                _disposed = true;
            }
        }

        private static readonly TwxRuntimeContext _defaultContext = new("default");
        private static readonly AsyncLocal<TwxRuntimeContext?> _currentContext = new();

        public static TwxRuntimeContext DefaultContext => _defaultContext;
        public static TwxRuntimeContext CurrentContext => _currentContext.Value ?? _defaultContext;

        /// <summary>
        /// Binds runtime-global lookups to a session context for the current async flow.
        /// Use at GameInstance, script, and MTC tab boundaries before enabling multiple
        /// live sessions in one process.
        /// </summary>
        public static IDisposable UseRuntimeContext(TwxRuntimeContext? context)
            => new RuntimeContextScope(context ?? _defaultContext);

        // Module variables - forward declarations for modules
        // These would be properly typed once the module classes are converted
        public static ITWXMenu? TWXMenu
        {
            get => CurrentContext.TWXMenu;
            set => CurrentContext.TWXMenu = value;
        }

        public static ITWXDatabase? TWXDatabase
        {
            get => CurrentContext.TWXDatabase;
            set => CurrentContext.TWXDatabase = value;
        }

        public static ITWXDatabase? Database => TWXDatabase;
        public static IScriptWindowFactory ScriptWindowFactory { get; set; } = new ConsoleScriptWindowFactory();
        public static IPanelOverlayService? PanelOverlay { get; set; }

        public static object? TWXLog
        {
            get => CurrentContext.TWXLog;
            set => CurrentContext.TWXLog = value;
        }

        public static object? TWXExtractor
        {
            get => CurrentContext.TWXExtractor;
            set => CurrentContext.TWXExtractor = value;
        }

        public static object? TWXInterpreter
        {
            get => CurrentContext.TWXInterpreter;
            set => CurrentContext.TWXInterpreter = value;
        }

        public static ITWXServer? TWXServer
        {
            get => CurrentContext.TWXServer;
            set => CurrentContext.TWXServer = value;
        }

        public static ITWXServer? Server => TWXServer;

        public static object? TWXClient
        {
            get => CurrentContext.TWXClient;
            set => CurrentContext.TWXClient = value;
        }

        public static object? TWXBubble
        {
            get => CurrentContext.TWXBubble;
            set => CurrentContext.TWXBubble = value;
        }

        public static object? TWXGUI
        {
            get => CurrentContext.TWXGUI;
            set => CurrentContext.TWXGUI = value;
        }

        public static object? PersistenceManager
        {
            get => CurrentContext.PersistenceManager;
            set => CurrentContext.PersistenceManager = value;
        }

        public static string ProgramDir { get; set; } = OperatingSystem.IsWindows()
            ? WindowsInstallInfo.GetInstalledProgramDirOrDefault()
            : AppContext.BaseDirectory;

        /// <summary>Auto-recorder that parses game text and updates the sector database.</summary>
        public static AutoRecorder GlobalAutoRecorder => CurrentContext.AutoRecorder;

        public static List<GlobalVarItem> TWXGlobalVars
        {
            get => CurrentContext.TWXGlobalVars;
            set => CurrentContext.TWXGlobalVars = value ?? new List<GlobalVarItem>();
        }

        public static List<TimerItem> TWXTimers
        {
            get => CurrentContext.TWXTimers;
            set => CurrentContext.TWXTimers = value ?? new List<TimerItem>();
        }

        // Debug configuration
        public static bool DebugMode
        {
            get => CurrentContext.DebugMode;
            set => CurrentContext.DebugMode = value;
        }

        /// <summary>
        /// When false (default), suppresses very high-frequency per-parameter
        /// evaluation logs ([PreEval], [PostEval], [EvaluateArrayIndexes]).
        /// Set to true only when diagnosing deep variable-evaluation bugs.
        /// </summary>
        public static bool VerboseDebugMode
        {
            get => CurrentContext.VerboseDebugMode;
            set => CurrentContext.VerboseDebugMode = value;
        }
        /// <summary>
        /// Enables extremely high-volume script VM instruction tracing such as
        /// [BRANCH], [CMP], [ADD], and detailed command helper diagnostics.
        /// Keep this off unless chasing a VM/runtime execution bug.
        /// </summary>
        public static bool ScriptTraceDebugMode
        {
            get => CurrentContext.ScriptTraceDebugMode;
            set => CurrentContext.ScriptTraceDebugMode = value;
        }
        /// <summary>
        /// Enables high-volume SAVEVAR/LOADVAR persistence tracing separately from
        /// general debug and VM trace logging.
        /// </summary>
        public static bool VariablePersistenceDebugMode
        {
            get => CurrentContext.VariablePersistenceDebugMode;
            set => CurrentContext.VariablePersistenceDebugMode = value;
        }
        /// <summary>
        /// Enables AutoRecorder parser/database chatter. This is useful when
        /// validating sector parsing, but is separate from general runtime logs.
        /// </summary>
        public static bool AutoRecorderDebugMode
        {
            get => CurrentContext.AutoRecorderDebugMode;
            set => CurrentContext.AutoRecorderDebugMode = value;
        }
        public static bool TriggerDebugMode
        {
            get => CurrentContext.TriggerDebugMode;
            set => CurrentContext.TriggerDebugMode = value;
        }
        public static bool PortHaggleDebugMode { get; set; } = false;
        public static bool PlanetHaggleDebugMode { get; set; } = false;

        /// <summary>
        /// When true, logs comparison operation results (ISEQUAL, ISGREATER, etc.) with both
        /// operand values and the result. Useful for tracing conditional logic such as the
        /// haggle derive range-check inner loop. Toggle from a script with: diagmode on/off
        /// </summary>
        public static bool DiagnoseMode { get; set; } = false;

        /// <summary>
        /// Enables lightweight VM timing/counter summaries for script load and execute paths.
        /// These summaries are written through the shared log path even when normal debug logging is off.
        /// </summary>
        public static bool EnableVmMetrics { get; set; } = false;

        /// <summary>
        /// Enables the script execution watchdog that stops apparent infinite loops.
        /// </summary>
        public static bool ScriptInfiniteLoopProtectionEnabled { get; set; } = true;

        /// <summary>
        /// When true, newly created Script instances prefer the prepared VM path.
        /// Defaults to false so existing runtime behavior is unchanged unless explicitly enabled.
        /// </summary>
        public static bool PreferPreparedVm { get; set; } = false;

        /// <summary>
        /// Enables the conservative in-memory source compile cache for .ts loads.
        /// Cache keys are validated against the full discovered include/dependency set.
        /// </summary>
        public static bool EnableSourceScriptCache { get; set; } = true;

        public const long DefaultPreparedScriptCacheLimitBytes = 512 * 1024;
        public const long DefaultMombotHotkeyPrewarmLimitBytes = 256 * 1024;

        public static long PreparedScriptCacheLimitBytes { get; set; } = DefaultPreparedScriptCacheLimitBytes;
        public static long MombotHotkeyPrewarmLimitBytes { get; set; } = DefaultMombotHotkeyPrewarmLimitBytes;

        public static string DebugLogPath
        {
            get => CurrentContext.DebugLogPath;
            set => CurrentContext.DebugLogPath = value;
        }
        public static string PortHaggleDebugLogPath { get; set; } = "/tmp/twxp_haggle_debug.log";
        public static string PlanetHaggleDebugLogPath { get; set; } = "/tmp/twxp_neg_debug.log";
        public static string DatabaseCorrectionLogPath
        {
            get => CurrentContext.DatabaseCorrectionLogPath;
            set => CurrentContext.DatabaseCorrectionLogPath = value;
        }
        public static bool DatabaseCorrectionLoggingEnabled
        {
            get => CurrentContext.DatabaseCorrectionLoggingEnabled;
            set => CurrentContext.DatabaseCorrectionLoggingEnabled = value;
        }
        private static readonly object _debugLock = new object();
        private static readonly object _databaseCorrectionLogLock = new object();
        private static readonly object _debugWorkerLock = new object();
        private readonly struct DebugLogEntry
        {
            public DebugLogEntry(string path, string text)
            {
                Path = path;
                Text = text;
            }

            public string Path { get; }
            public string Text { get; }
        }

        private static readonly ConcurrentQueue<DebugLogEntry> _pendingDebugMessages = new();
        private static readonly AutoResetEvent _debugQueueSignal = new AutoResetEvent(false);
        private static Thread? _debugWorkerThread = null;
        private static long _pendingDebugMessageCount = 0;
        private static int _droppedDebugMessageCount = 0;
        private static int _debugFlushRequested = 0;
        private const int MaxPendingDebugMessages = 16384;
        private const long MaxDebugLogBytes = 512L * 1024 * 1024;
        private static StreamWriter? _debugWriter = null;
        private static string? _debugWriterPath = null;
        private static StreamWriter? _portHaggleWriter = null;
        private static StreamWriter? _planetHaggleWriter = null;

        private static void CloseDebugWriterUnsafe()
        {
            _debugWriter?.Dispose();
            _debugWriter = null;
            _debugWriterPath = null;
        }

        private static void RotateOversizedDebugLogUnsafe(string path)
        {
            if (!File.Exists(path))
                return;

            long existingLength;
            try
            {
                existingLength = new FileInfo(path).Length;
            }
            catch
            {
                return;
            }

            if (existingLength < MaxDebugLogBytes)
                return;

            string directory = Path.GetDirectoryName(path) ?? string.Empty;
            string fileName = Path.GetFileName(path);
            string rotatedPath = Path.Combine(
                directory,
                $"{fileName}.{DateTime.Now:yyyyMMdd-HHmmss}.old");

            try
            {
                File.Move(path, rotatedPath, overwrite: true);
            }
            catch
            {
                // Rotation is best-effort. If the file cannot be moved, continue
                // appending rather than risking gameplay behavior.
            }
        }

        private static void EnsureLogWriter(bool resetFile, string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return;

            string? directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            if (_debugWriter != null &&
                !string.Equals(_debugWriterPath, path, StringComparison.Ordinal))
            {
                CloseDebugWriterUnsafe();
            }

            if (_debugWriter != null && !resetFile)
            {
                bool logFileStillVisible = true;
                try
                {
                    logFileStillVisible = File.Exists(path);
                }
                catch
                {
                    // If the visibility check fails, keep the existing writer.
                    logFileStillVisible = true;
                }

                if (logFileStillVisible)
                    return;

                CloseDebugWriterUnsafe();
            }

            if (!resetFile)
                RotateOversizedDebugLogUnsafe(path);

            bool fileExists = File.Exists(path);
            long existingLength = 0;
            if (fileExists)
            {
                try
                {
                    existingLength = new FileInfo(path).Length;
                }
                catch
                {
                    existingLength = 0;
                }
            }

            _debugWriter?.Dispose();
            _debugWriter = new StreamWriter(path, append: true, System.Text.Encoding.UTF8, bufferSize: 4096)
            {
                AutoFlush = false
            };
            _debugWriterPath = path;

            if (resetFile || !fileExists || existingLength == 0)
            {
                _debugWriter.WriteLine($"=== TWX Proxy Debug Log Started {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");
                _debugWriter.Flush();
            }
            else
            {
                _debugWriter.WriteLine($"=== TWX Proxy Debug Log Continued {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");
                _debugWriter.Flush();
            }
        }

        private static void EnsureDebugWorker()
        {
            lock (_debugWorkerLock)
            {
                if (_debugWorkerThread != null)
                    return;

                _debugWorkerThread = new Thread(DebugWriterLoop)
                {
                    IsBackground = true,
                    Name = "TWX Debug Log Writer",
                };
                _debugWorkerThread.Start();
            }
        }

        private static void DebugWriterLoop()
        {
            while (true)
            {
                _debugQueueSignal.WaitOne(250);
                try
                {
                    bool flushRequested = Interlocked.Exchange(ref _debugFlushRequested, 0) != 0;
                    DrainQueuedDebugMessages(flushWriter: flushRequested || !_pendingDebugMessages.IsEmpty);
                }
                catch
                {
                }
            }
        }

        private static void ClearQueuedDebugMessages()
        {
            while (_pendingDebugMessages.TryDequeue(out _))
            {
                Interlocked.Decrement(ref _pendingDebugMessageCount);
            }

            Interlocked.Exchange(ref _droppedDebugMessageCount, 0);
        }

        private static void EmitDroppedDebugMessageSummaryUnsafe(string path)
        {
            int dropped = Interlocked.Exchange(ref _droppedDebugMessageCount, 0);
            if (dropped <= 0)
                return;

            EnsureLogWriter(resetFile: false, path);
            _debugWriter?.Write(
                $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [DEBUG LOG] Dropped {dropped} messages because the async debug queue hit its backlog limit.\n");
        }

        private static void DrainQueuedDebugMessages(bool flushWriter)
        {
            lock (_debugLock)
            {
                bool wrote = false;
                string? lastPath = null;
                while (_pendingDebugMessages.TryDequeue(out DebugLogEntry entry))
                {
                    Interlocked.Decrement(ref _pendingDebugMessageCount);
                    if (string.IsNullOrWhiteSpace(entry.Path))
                        continue;

                    if (!string.Equals(lastPath, entry.Path, StringComparison.Ordinal))
                    {
                        EnsureLogWriter(resetFile: false, entry.Path);
                        lastPath = entry.Path;
                    }

                    if (_debugWriter == null)
                        continue;

                    _debugWriter.Write(entry.Text);
                    wrote = true;
                }

                int dropped = Volatile.Read(ref _droppedDebugMessageCount);
                if (dropped > 0)
                {
                    string summaryPath = lastPath ?? _debugWriterPath ?? DebugLogPath;
                    EmitDroppedDebugMessageSummaryUnsafe(summaryPath);
                    wrote = true;
                }

                if (flushWriter && (wrote || _debugWriter != null))
                    _debugWriter?.Flush();
            }
        }

        private static void RequestDebugWriterFlush()
        {
            Interlocked.Exchange(ref _debugFlushRequested, 1);
            EnsureDebugWorker();
            _debugQueueSignal.Set();
        }

        private static void WriteLogMessage(string message)
        {
            string path = DebugLogPath;
            if (string.IsNullOrWhiteSpace(path))
                return;

            EnsureDebugWorker();

            long queuedMessageCount = Interlocked.Increment(ref _pendingDebugMessageCount);
            if (queuedMessageCount > MaxPendingDebugMessages)
            {
                Interlocked.Decrement(ref _pendingDebugMessageCount);
                Interlocked.Increment(ref _droppedDebugMessageCount);
                _debugQueueSignal.Set();
                return;
            }

            _pendingDebugMessages.Enqueue(new DebugLogEntry(path, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {message}"));
            _debugQueueSignal.Set();
        }

        private static StreamWriter? CreateAppendWriter(string path, string header)
        {
            string? directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            bool fileExists = File.Exists(path);
            bool writeHeader = !fileExists || new FileInfo(path).Length == 0;
            var writer = new StreamWriter(path, append: true, System.Text.Encoding.UTF8, bufferSize: 4096)
            {
                AutoFlush = true
            };

            if (writeHeader)
                writer.WriteLine(header);
            else
                writer.WriteLine($"=== {header.Trim('=', ' ')} {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");

            writer.Flush();
            return writer;
        }

        private static void EnsureTradeDebugWriters()
        {
            if (PortHaggleDebugMode && _portHaggleWriter == null)
            {
                _portHaggleWriter = CreateAppendWriter(
                    PortHaggleDebugLogPath,
                    $"=== Port Haggle Debug Log Started {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");
            }

            if (PlanetHaggleDebugMode && _planetHaggleWriter == null)
            {
                _planetHaggleWriter = CreateAppendWriter(
                    PlanetHaggleDebugLogPath,
                    $"=== Planet Haggle Debug Log Started {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");
            }
        }

        public static void ConfigureDebugLogging(
            string? debugLogPath,
            bool enabled,
            bool verboseEnabled,
            bool triggerEnabled,
            bool scriptTraceEnabled = false,
            bool autoRecorderEnabled = true,
            bool variablePersistenceEnabled = false)
        {
            bool signalWriter = false;
            TwxRuntimeContext context = CurrentContext;
            lock (_debugLock)
            {
                string resolvedPath = string.IsNullOrWhiteSpace(debugLogPath)
                    ? context.DebugLogPath
                    : debugLogPath;
                bool pathChanged = !string.Equals(context.DebugLogPath, resolvedPath, StringComparison.Ordinal);
                bool enabledChanged = context.DebugMode != enabled;
                bool verboseChanged = context.VerboseDebugMode != verboseEnabled;
                bool triggerChanged = context.TriggerDebugMode != triggerEnabled;
                bool scriptTraceChanged = context.ScriptTraceDebugMode != scriptTraceEnabled;
                bool autoRecorderChanged = context.AutoRecorderDebugMode != autoRecorderEnabled;
                bool variablePersistenceChanged = context.VariablePersistenceDebugMode != variablePersistenceEnabled;

                if (!pathChanged && !enabledChanged && !verboseChanged && !triggerChanged &&
                    !scriptTraceChanged && !autoRecorderChanged && !variablePersistenceChanged)
                    return;

                context.DebugLogPath = resolvedPath;
                context.DebugMode = enabled;
                context.VerboseDebugMode = verboseEnabled;
                context.TriggerDebugMode = triggerEnabled;
                context.ScriptTraceDebugMode = scriptTraceEnabled;
                context.AutoRecorderDebugMode = autoRecorderEnabled;
                context.VariablePersistenceDebugMode = variablePersistenceEnabled;

                signalWriter = enabled || EnableVmMetrics || Volatile.Read(ref _pendingDebugMessageCount) > 0;
            }

            if (signalWriter)
            {
                try
                {
                    RequestDebugWriterFlush();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DEBUG LOG INIT ERROR] {ex.Message}");
                }
            }
        }

        public static void ConfigureHaggleDebugLogging(
            string? portHaggleDebugLogPath,
            bool portEnabled,
            string? planetHaggleDebugLogPath,
            bool planetEnabled)
        {
            lock (_debugLock)
            {
                if (!string.IsNullOrWhiteSpace(portHaggleDebugLogPath))
                    PortHaggleDebugLogPath = portHaggleDebugLogPath;
                if (!string.IsNullOrWhiteSpace(planetHaggleDebugLogPath))
                    PlanetHaggleDebugLogPath = planetHaggleDebugLogPath;

                bool portChanged = PortHaggleDebugMode != portEnabled;
                bool planetChanged = PlanetHaggleDebugMode != planetEnabled;
                PortHaggleDebugMode = portEnabled;
                PlanetHaggleDebugMode = planetEnabled;

                if (!PortHaggleDebugMode || portChanged)
                {
                    _portHaggleWriter?.Dispose();
                    _portHaggleWriter = null;
                }

                if (!PlanetHaggleDebugMode || planetChanged)
                {
                    _planetHaggleWriter?.Dispose();
                    _planetHaggleWriter = null;
                }

                try
                {
                    EnsureTradeDebugWriters();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[HAGGLE LOG INIT ERROR] {ex.Message}");
                }
            }
        }

        public static void ConfigureDatabaseCorrectionLogging(string? databaseCorrectionLogPath, bool? enabled = null)
        {
            TwxRuntimeContext context = CurrentContext;
            if (enabled.HasValue)
                context.DatabaseCorrectionLoggingEnabled = enabled.Value;

            if (string.IsNullOrWhiteSpace(databaseCorrectionLogPath))
                return;

            lock (_databaseCorrectionLogLock)
            {
                context.DatabaseCorrectionLogPath = databaseCorrectionLogPath;
                try
                {
                    string? directory = Path.GetDirectoryName(context.DatabaseCorrectionLogPath);
                    if (!string.IsNullOrWhiteSpace(directory))
                        Directory.CreateDirectory(directory);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DB CORRECTION LOG INIT ERROR] {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Initialize/clear the debug log file. Call this at application startup.
        /// </summary>
        public static void InitializeDebugLog()
        {
            ConfigureDebugLogging(DebugLogPath, DebugMode, VerboseDebugMode, TriggerDebugMode, ScriptTraceDebugMode, AutoRecorderDebugMode, VariablePersistenceDebugMode);
            ConfigureHaggleDebugLogging(PortHaggleDebugLogPath, PortHaggleDebugMode, PlanetHaggleDebugLogPath, PlanetHaggleDebugMode);
        }

        /// <summary>
        /// Request that buffered debug log entries be flushed by the background writer.
        /// This must not perform disk I/O on caller threads because many call sites are
        /// UI or gameplay-sensitive paths.
        /// </summary>
        public static void FlushDebugLog()
        {
            if (Volatile.Read(ref _pendingDebugMessageCount) == 0 &&
                !PortHaggleDebugMode &&
                !PlanetHaggleDebugMode) return;
            try
            {
                if (Volatile.Read(ref _pendingDebugMessageCount) > 0)
                    RequestDebugWriterFlush();
            }
            catch { /* ignore */ }
        }

        /// <summary>
        /// Write debug message to log file if DebugMode is enabled.
        /// High-frequency per-parameter evaluation messages are gated by VerboseDebugMode.
        /// </summary>
        public static void DebugLog(string message)
        {
            if (IsNativeHaggleDebugMessage(message)) return;
            if (!DebugMode) return;
            if (IsVerboseRuntimeDebugMessage(message) && !VerboseDebugMode) return;

            try
            {
                WriteLogMessage(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void DebugLog(
            ref ConditionalLogInterpolatedStringHandler<DebugLogGate> message)
        {
            if (message.IsEnabled)
                DebugLog(message.GetFormattedText());
        }

        private static bool IsNativeHaggleDebugMessage(string message)
        {
            if (string.IsNullOrEmpty(message))
                return false;

            return message.StartsWith("[NativeHaggle]", StringComparison.Ordinal) ||
                   message.StartsWith("[MTC.NativeHaggle]", StringComparison.Ordinal);
        }

        private static bool IsVerboseRuntimeDebugMessage(string message)
        {
            if (string.IsNullOrEmpty(message))
                return false;

            if (message.IndexOf("failed", StringComparison.OrdinalIgnoreCase) >= 0 ||
                message.IndexOf("error", StringComparison.OrdinalIgnoreCase) >= 0 ||
                message.IndexOf("exception", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return false;
            }

            return message.StartsWith("[FORCEVAR]", StringComparison.Ordinal) ||
                   message.StartsWith("[FILEEXISTS]", StringComparison.Ordinal) ||
                   message.StartsWith("[LIE]", StringComparison.Ordinal) ||
                   message.StartsWith("[VARCACHE]", StringComparison.Ordinal) ||
                   message.StartsWith("[DEBUG]", StringComparison.Ordinal) ||
                   message.StartsWith("[ModInterpreter.Load]", StringComparison.Ordinal) ||
                   message.StartsWith("[ScriptCmp.LoadFromFile]", StringComparison.Ordinal) ||
                   message.StartsWith("[Script.ProgramEvent]", StringComparison.Ordinal) ||
                   message.StartsWith("[Script.Dispose]", StringComparison.Ordinal) ||
                   message.StartsWith("[Script.Stop]", StringComparison.Ordinal);
        }

        /// <summary>
        /// Write high-volume trigger and trigger-adjacent diagnostics when trigger
        /// debugging is explicitly enabled. This category stays off by default so
        /// script trigger storms do not swamp the shared debug log.
        /// </summary>
        public static void TriggerDebugLog(string message)
        {
            if (!DebugMode || !TriggerDebugMode) return;

            try
            {
                WriteLogMessage(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TRIGGER DEBUG LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void TriggerDebugLog(
            ref ConditionalLogInterpolatedStringHandler<TriggerDebugLogGate> message)
        {
            if (message.IsEnabled)
                TriggerDebugLog(message.GetFormattedText());
        }

        public static void ScriptTraceDebugLog(string message)
        {
            if (!DebugMode || !ScriptTraceDebugMode) return;

            try
            {
                WriteLogMessage(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SCRIPT TRACE LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void ScriptTraceDebugLog(
            ref ConditionalLogInterpolatedStringHandler<ScriptTraceDebugLogGate> message)
        {
            if (message.IsEnabled)
                ScriptTraceDebugLog(message.GetFormattedText());
        }

        public static void VariablePersistenceDebugLog(string message)
        {
            if (!DebugMode || !VariablePersistenceDebugMode) return;

            try
            {
                WriteLogMessage(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VARIABLE PERSISTENCE LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void VariablePersistenceDebugLog(
            ref ConditionalLogInterpolatedStringHandler<VariablePersistenceDebugLogGate> message)
        {
            if (message.IsEnabled)
                VariablePersistenceDebugLog(message.GetFormattedText());
        }

        public static void AutoRecorderDebugLog(string message)
        {
            if (!DebugMode || !AutoRecorderDebugMode) return;

            try
            {
                WriteLogMessage(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTORECORDER LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void AutoRecorderDebugLog(
            ref ConditionalLogInterpolatedStringHandler<AutoRecorderDebugLogGate> message)
        {
            if (message.IsEnabled)
                AutoRecorderDebugLog(message.GetFormattedText());
        }

        public static void DatabaseCorrectionLog(string source, string message)
        {
            bool enabled = DatabaseCorrectionLoggingEnabled;
            string path = DatabaseCorrectionLogPath;
            if (!enabled || string.IsNullOrWhiteSpace(path))
                return;

            try
            {
                lock (_databaseCorrectionLogLock)
                {
                    string? directory = Path.GetDirectoryName(path);
                    if (!string.IsNullOrWhiteSpace(directory))
                        Directory.CreateDirectory(directory);

                    bool writeHeader = !File.Exists(path);
                    using var writer = new StreamWriter(path, append: true, System.Text.Encoding.UTF8, bufferSize: 4096);
                    if (writeHeader)
                        writer.WriteLine($"=== TWX Database Correction Log Started {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");

                    writer.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [{source}] {message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB CORRECTION LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void DatabaseCorrectionLog(
            string source,
            ref ConditionalLogInterpolatedStringHandler<DatabaseCorrectionLogGate> message)
        {
            if (message.IsEnabled)
                DatabaseCorrectionLog(source, message.GetFormattedText());
        }

        /// <summary>
        /// Write VM-specific metric output to the shared log path when VM metrics are enabled,
        /// without requiring full debug logging.
        /// </summary>
        public static void VmMetricLog(string message)
        {
            if (!EnableVmMetrics) return;

            try
            {
                WriteLogMessage(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VM METRIC LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void VmMetricLog(
            ref ConditionalLogInterpolatedStringHandler<VmMetricLogGate> message)
        {
            if (message.IsEnabled)
                VmMetricLog(message.GetFormattedText());
        }

        public static void PortHaggleDebug(string message)
        {
            if (!PortHaggleDebugMode) return;

            try
            {
                lock (_debugLock)
                {
                    EnsureTradeDebugWriters();
                    _portHaggleWriter?.Write($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PORT HAGGLE LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void PortHaggleDebug(
            ref ConditionalLogInterpolatedStringHandler<PortHaggleDebugLogGate> message)
        {
            if (message.IsEnabled)
                PortHaggleDebug(message.GetFormattedText());
        }

        public static void PlanetHaggleDebug(string message)
        {
            if (!PlanetHaggleDebugMode) return;

            try
            {
                lock (_debugLock)
                {
                    EnsureTradeDebugWriters();
                    _planetHaggleWriter?.Write($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PLANET HAGGLE LOG ERROR] {ex.Message}: {message}");
            }
        }

        public static void PlanetHaggleDebug(
            ref ConditionalLogInterpolatedStringHandler<PlanetHaggleDebugLogGate> message)
        {
            if (message.IsEnabled)
                PlanetHaggleDebug(message.GetFormattedText());
        }
    }
}
