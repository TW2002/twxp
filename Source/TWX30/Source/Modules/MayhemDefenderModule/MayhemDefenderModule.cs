using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TWXProxy.Core;

namespace MayhemDefenderModule;

public sealed class MayhemDefenderModule : IExpansionModule
{
    private const string CommandPrefix = "md";
    private const string LegacyCommandPrefix = "mayhem defender";
    private const string PwarpPrompt = "What sector do you want to warp this planet to? (Q to Abort)";
    private const string CitadelPrompt = "Citadel command (?=help)";
    private const string LimpetPrefix = "Limpet mine in ";
    private const string FighterPrefix = "Deployed Fighters Report Sector ";
    private const string PlainFighterPrefix = "Report Sector ";
    private const string ChaserAlienAnsiMarker = "\u001b[1;36m\u001b[33m";
    private static readonly byte[] LimpetPrefixBytes = Encoding.ASCII.GetBytes(LimpetPrefix);
    private static readonly byte[] LimpetSuffixBytes = Encoding.ASCII.GetBytes("activated");

    private readonly object _sync = new();
    private readonly List<IDisposable> _menuRegistrations = new();
    private ExpansionModuleContext? _context;
    private IDisposable? _fastRegistration;
    private DefenderMode _mode = DefenderMode.Off;
    private bool _waitingForPwarpPrompt;
    private bool _pwarpPromptReady;
    private string _fastParseTail = string.Empty;
    private AnsiStripState _fastAnsiState;
    private AnsiStripState _serverAnsiState;
    private Dictionary<int, byte[]> _fotonMacros = new();
    private Dictionary<int, int> _fotonAdjacent = new();
    private InterceptSample? _lastLimpetIntercept;
    private int _macroCount;
    private int _fireCount;
    private int _missedMacroCount;
    private int _immediateSendFailures;
    private long _totalReceiveToSendStartTicks;
    private long _totalSendDurationTicks;
    private long _sendTimingCount;
    private long _totalLimpetToFighterTicks;
    private long _limpetToFighterCount;

    public string Id => "mayhem-defender";
    public string DisplayName => "Mayhem Defender";
    public ExpansionHostTargets SupportedHosts => ExpansionHostTargets.Mtc;

    public Task InitializeAsync(ExpansionModuleContext context, CancellationToken cancellationToken)
    {
        _context = context;
        context.GameInstance.CommandReceived += OnCommandReceived;
        context.GameInstance.ServerDataReceived += OnServerDataReceived;
        _fastRegistration = context.GameInstance.RegisterFastServerDataResponder(OnFastServerData);
        RegisterMenuCommands(context.GameInstance);
        context.Log("Initialized. Use '$md' for help, '$mdf' foton, '$mdl' ldrop, '$mds' stop.");
        return Task.CompletedTask;
    }

    public Task ShutdownAsync(CancellationToken cancellationToken)
    {
        ExpansionModuleContext? context = _context;
        if (context != null)
        {
            context.GameInstance.CommandReceived -= OnCommandReceived;
            context.GameInstance.ServerDataReceived -= OnServerDataReceived;
        }

        foreach (IDisposable registration in _menuRegistrations)
            registration.Dispose();
        _menuRegistrations.Clear();

        _fastRegistration?.Dispose();
        _fastRegistration = null;
        _context = null;
        return Task.CompletedTask;
    }

    private void RegisterMenuCommands(GameInstance gameInstance)
    {
        _menuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new ProxyMenuCommand
        {
            Path = "MD",
            Description = "Mayhem Defender",
            ExecuteAsync = _ =>
            {
                SendHelp();
                return Task.FromResult(ProxyMenuCommandResult.StayInMenu);
            },
        }));
        _menuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new ProxyMenuCommand
        {
            Path = "MDF",
            Description = "Foton",
            ExecuteAsync = _ =>
            {
                Start(DefenderMode.Foton);
                return Task.FromResult(ProxyMenuCommandResult.ExitMenu);
            },
        }));
        _menuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new ProxyMenuCommand
        {
            Path = "MDL",
            Description = "Ldrop",
            ExecuteAsync = _ =>
            {
                Start(DefenderMode.Pdrop);
                return Task.FromResult(ProxyMenuCommandResult.ExitMenu);
            },
        }));
        _menuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new ProxyMenuCommand
        {
            Path = "MDS",
            Description = "Stop",
            ExecuteAsync = _ =>
            {
                Stop(sendAbort: true);
                return Task.FromResult(ProxyMenuCommandResult.ExitMenu);
            },
        }));
        _menuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new ProxyMenuCommand
        {
            Path = "MDR",
            Description = "Rebuild macros",
            ExecuteAsync = _ =>
            {
                RebuildMacros(sendStatus: true);
                return Task.FromResult(ProxyMenuCommandResult.StayInMenu);
            },
        }));
        _menuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new ProxyMenuCommand
        {
            Path = "MDT",
            Description = "Status",
            ExecuteAsync = _ =>
            {
                SendStatus();
                return Task.FromResult(ProxyMenuCommandResult.StayInMenu);
            },
        }));
    }

    private void OnCommandReceived(object? sender, CommandEventArgs e)
    {
        string command = NormalizeCommand(e.Command);
        if (!TryParseCommand(command, out string args))
        {
            return;
        }

        string verb = FirstWord(args);

        switch (verb.ToLowerInvariant())
        {
            case "":
            case "?":
            case "h":
            case "help":
                SendHelp();
                break;
            case "f":
            case "foton":
                Start(DefenderMode.Foton);
                break;
            case "l":
            case "pdrop":
            case "ldrop":
                Start(DefenderMode.Pdrop);
                break;
            case "r":
            case "rebuild":
                RebuildMacros(sendStatus: true);
                break;
            case "s":
            case "stop":
            case "off":
                Stop(sendAbort: true);
                break;
            case "t":
            case "status":
                SendStatus();
                break;
            default:
                SendHelp();
                break;
        }
    }

    private void Start(DefenderMode mode)
    {
        ExpansionModuleContext? context = _context;
        if (context == null)
            return;

        string prompt = ScriptRef.GetCurrentGameVar("$PLAYER~CURRENT_PROMPT", string.Empty);
        if (!string.Equals(prompt, "Citadel", StringComparison.OrdinalIgnoreCase))
        {
            SendLocal($"Mayhem Defender must start from Citadel. Current prompt is '{(string.IsNullOrWhiteSpace(prompt) ? "unknown" : prompt)}'.");
            return;
        }

        if (mode == DefenderMode.Foton && RebuildMacros(sendStatus: false) == 0)
        {
            SendLocal("Mayhem Defender foton found no usable FIGSEC adjacent macros. Not starting.");
            return;
        }

        lock (_sync)
        {
            _mode = mode;
            _waitingForPwarpPrompt = true;
            _pwarpPromptReady = false;
            _fireCount = 0;
            _missedMacroCount = 0;
            _immediateSendFailures = 0;
            _totalReceiveToSendStartTicks = 0;
            _totalSendDurationTicks = 0;
            _sendTimingCount = 0;
            _totalLimpetToFighterTicks = 0;
            _limpetToFighterCount = 0;
            _lastLimpetIntercept = null;
            _fastParseTail = string.Empty;
            _fastAnsiState = AnsiStripState.Ground;
            _serverAnsiState = AnsiStripState.Ground;
        }

        context.GameInstance.SendToServerAsync(Encoding.ASCII.GetBytes("p"));
        SendLocal($"Mayhem Defender {ModeName(mode)} waiting at planetary TransWarp prompt.");
    }

    private void Stop(bool sendAbort)
    {
        ExpansionModuleContext? context = _context;
        bool shouldAbort;

        lock (_sync)
        {
            shouldAbort = sendAbort && _mode != DefenderMode.Off && (_waitingForPwarpPrompt || _pwarpPromptReady);
            _mode = DefenderMode.Off;
            _waitingForPwarpPrompt = false;
            _pwarpPromptReady = false;
            _lastLimpetIntercept = null;
            _fastParseTail = string.Empty;
            _fastAnsiState = AnsiStripState.Ground;
            _serverAnsiState = AnsiStripState.Ground;
        }

        if (shouldAbort && context != null)
            context.GameInstance.SendToServerAsync(Encoding.ASCII.GetBytes("q"));

        SendLocal("Mayhem Defender stopped.");
    }

    private int RebuildMacros(bool sendStatus)
    {
        ExpansionModuleContext? context = _context;
        ModDatabase? db = context?.Database ?? ScriptRef.GetActiveDatabase();
        if (db == null)
        {
            if (sendStatus)
                SendLocal("Mayhem Defender cannot rebuild macros: no active database.");
            return 0;
        }

        var macros = new Dictionary<int, byte[]>();
        var adjacent = new Dictionary<int, int>();
        int sectorCount = db.SectorCount;

        for (int target = 11; target <= sectorCount; target++)
        {
            SectorData? targetSector = db.GetSector(target);
            if (targetSector == null || targetSector.WarpsIn.Count == 0)
                continue;

            foreach (ushort inbound in targetSector.WarpsIn)
            {
                SectorData? inboundSector = db.GetSector(inbound);
                if (inboundSector == null)
                    continue;

                if (inboundSector.Fighters.Quantity <= 0 || !IsFigSec(inboundSector))
                    continue;

                macros[target] = Encoding.ASCII.GetBytes($"{inbound}\r y c p y {target}\r q ");
                adjacent[target] = inbound;
                break;
            }
        }

        lock (_sync)
        {
            _fotonMacros = macros;
            _fotonAdjacent = adjacent;
            _macroCount = macros.Count;
        }

        if (sendStatus)
            SendLocal($"Mayhem Defender rebuilt {_macroCount.ToString(CultureInfo.InvariantCulture)} foton macros.");

        return macros.Count;
    }

    private void OnServerDataReceived(object? sender, TWXProxy.Core.DataReceivedEventArgs e)
    {
        if (_context == null || e.Data.Length == 0)
            return;

        string text;
        lock (_sync)
            text = StripAnsi(e.Text, ref _serverAnsiState);

        HandlePromptState(text);
    }

    private void OnFastServerData(FastServerDataEventArgs e)
    {
        DefenderMode mode;
        bool ready;
        Dictionary<int, byte[]> fotonMacros;

        lock (_sync)
        {
            mode = _mode;
            ready = _pwarpPromptReady;
            fotonMacros = _fotonMacros;
        }

        if (mode == DefenderMode.Pdrop &&
            ready &&
            e.IsRawReceive &&
            TryParseRawLimpetSector(e.Data, out int rawLimpetSector))
        {
            FirePdrop(e, rawLimpetSector);
            return;
        }

        if (e.IsRawReceive)
            return;

        string text = BuildFastParseText(e.Text);
        if (!ready && text.Contains(PwarpPrompt, StringComparison.OrdinalIgnoreCase))
        {
            lock (_sync)
            {
                if (_mode != DefenderMode.Off)
                {
                    _waitingForPwarpPrompt = false;
                    _pwarpPromptReady = true;
                    ready = true;
                }
            }
        }

        if (mode == DefenderMode.Off || !ready)
        {
            if (mode == DefenderMode.Pdrop &&
                TryParseFighterSector(text, out int pdropFighterSector) &&
                !IsAlienFighterHit(e.Text))
            {
                RememberFastParseTail(text, parsedHit: true);
                TrackFighterTiming(e, pdropFighterSector);
                return;
            }

            RememberFastParseTail(text, parsedHit: false);
            return;
        }

        if (TryParseLimpetSector(text, out int limpetSector))
        {
            RememberFastParseTail(text, parsedHit: true);

            if (mode == DefenderMode.Pdrop)
            {
                FirePdrop(e, limpetSector);
                return;
            }

            if (mode == DefenderMode.Foton)
            {
                FireFoton(e, limpetSector, fotonMacros);
                return;
            }
        }

        if (mode == DefenderMode.Foton &&
            TryParseFighterSector(text, out int fighterSector) &&
            !IsAlienFighterHit(e.Text))
        {
            RememberFastParseTail(text, parsedHit: true);
            TrackFighterTiming(e, fighterSector);
            FireFoton(e, fighterSector, fotonMacros);
            return;
        }

        RememberFastParseTail(text, parsedHit: false);
    }

    private void HandlePromptState(string text)
    {
        ExpansionModuleContext? context = _context;
        if (context == null)
            return;

        int pwarpPrompt = text.LastIndexOf(PwarpPrompt, StringComparison.OrdinalIgnoreCase);
        int citadelPrompt = text.LastIndexOf(CitadelPrompt, StringComparison.OrdinalIgnoreCase);
        if (pwarpPrompt < 0 && citadelPrompt < 0)
            return;

        if (pwarpPrompt > citadelPrompt)
        {
            lock (_sync)
            {
                if (_mode != DefenderMode.Off)
                {
                    _waitingForPwarpPrompt = false;
                    _pwarpPromptReady = true;
                }
            }
            return;
        }

        bool shouldRearm;
        lock (_sync)
        {
            shouldRearm = _mode != DefenderMode.Off && !_waitingForPwarpPrompt;
            if (shouldRearm)
            {
                _waitingForPwarpPrompt = true;
                _pwarpPromptReady = false;
            }
        }

        if (shouldRearm)
        {
            context.Log("Citadel prompt detected while armed; re-entering planetary TransWarp prompt.");
            context.GameInstance.SendToServerAsync(Encoding.ASCII.GetBytes("p"));
        }
    }

    private void FirePdrop(FastServerDataEventArgs e, int sector)
    {
        byte[] payload = Encoding.ASCII.GetBytes($"{sector}\ry");
        FirePayload(e, sector, payload, "ldrop", adjacentSector: 0, trackLimpet: true);
    }

    private void FireFoton(FastServerDataEventArgs e, int sector, Dictionary<int, byte[]> macros)
    {
        if (!macros.TryGetValue(sector, out byte[]? payload))
        {
            lock (_sync)
                _missedMacroCount++;
            return;
        }

        int adjacentSector = 0;
        lock (_sync)
            _fotonAdjacent.TryGetValue(sector, out adjacentSector);

        FirePayload(e, sector, payload, "foton", adjacentSector, trackLimpet: false);
    }

    private void FirePayload(
        FastServerDataEventArgs e,
        int sector,
        byte[] payload,
        string action,
        int adjacentSector,
        bool trackLimpet)
    {
        lock (_sync)
        {
            if (_mode == DefenderMode.Off || !_pwarpPromptReady)
                return;

            _pwarpPromptReady = false;
            _waitingForPwarpPrompt = false;
            _fireCount++;
        }

        FastServerSendResult result = e.TrySendToServerImmediate(payload);
        long receiveToSendStart = result.StartTimestamp - e.ReceiveTimestamp;
        long sendDuration = result.EndTimestamp - result.StartTimestamp;

        lock (_sync)
        {
            if (result.Success)
            {
                _totalReceiveToSendStartTicks += receiveToSendStart;
                _totalSendDurationTicks += sendDuration;
                _sendTimingCount++;
            }
            else
            {
                _immediateSendFailures++;
            }

            if (trackLimpet)
            {
                _lastLimpetIntercept = new InterceptSample(
                    sector,
                    e.ReceiveTimestamp,
                    result.StartTimestamp,
                    result.EndTimestamp,
                    result.Success);
            }
        }

        if (!result.Success)
        {
            _context?.Log($"{action} immediate send failed for sector {sector}: {result.Error}");
            e.SendToServerAsync(payload);
            return;
        }

        if (adjacentSector > 0)
            _context?.Log($"{action} fired target={sector} adjacent={adjacentSector} receiveToSendUs={TicksToMicroseconds(receiveToSendStart):F1} sendUs={TicksToMicroseconds(sendDuration):F1}");
        else
            _context?.Log($"{action} fired sector={sector} receiveToSendUs={TicksToMicroseconds(receiveToSendStart):F1} sendUs={TicksToMicroseconds(sendDuration):F1}");
    }

    private void TrackFighterTiming(FastServerDataEventArgs e, int sector)
    {
        lock (_sync)
        {
            if (_lastLimpetIntercept == null || _lastLimpetIntercept.Sector != sector)
                return;

            long delta = e.ReceiveTimestamp - _lastLimpetIntercept.ReceiveTimestamp;
            if (delta < 0)
                return;

            _totalLimpetToFighterTicks += delta;
            _limpetToFighterCount++;
            _context?.Log($"ldrop timing sector={sector} limpetToFighterUs={TicksToMicroseconds(delta):F1} sendSuccess={_lastLimpetIntercept.SendSuccess}");
            _lastLimpetIntercept = null;
        }
    }

    private void SendStatus()
    {
        DefenderMode mode;
        bool waiting;
        bool ready;
        int macros;
        int fires;
        int missed;
        int failures;
        long timingCount;
        long receiveToSendTicks;
        long sendTicks;
        long limpetToFighterCount;
        long limpetToFighterTicks;

        lock (_sync)
        {
            mode = _mode;
            waiting = _waitingForPwarpPrompt;
            ready = _pwarpPromptReady;
            macros = _macroCount;
            fires = _fireCount;
            missed = _missedMacroCount;
            failures = _immediateSendFailures;
            timingCount = _sendTimingCount;
            receiveToSendTicks = _totalReceiveToSendStartTicks;
            sendTicks = _totalSendDurationTicks;
            limpetToFighterCount = _limpetToFighterCount;
            limpetToFighterTicks = _totalLimpetToFighterTicks;
        }

        string sendTiming = timingCount > 0
            ? $" avgReceiveToSend={TicksToMicroseconds(receiveToSendTicks / (double)timingCount):F1}us avgSend={TicksToMicroseconds(sendTicks / (double)timingCount):F1}us"
            : string.Empty;
        string hitTiming = limpetToFighterCount > 0
            ? $" avgLimpetToFighter={TicksToMicroseconds(limpetToFighterTicks / (double)limpetToFighterCount):F1}us"
            : string.Empty;

        SendLocal($"Mayhem Defender mode={ModeName(mode)} waitingPrompt={waiting} ready={ready} macros={macros} fires={fires} misses={missed} immediateFailures={failures}{sendTiming}{hitTiming}");
    }

    private void SendHelp()
    {
        SendLocal("Mayhem Defender: $mdf=foton $mdl=ldrop $mds=stop $mdr=rebuild $mdt=status");
    }

    private void SendLocal(string message)
    {
        _context?.SendMessageAsync($"\r\n[Mayhem Defender] {message}\r\n");
    }

    private static string NormalizeCommand(string command)
        => command.Trim().ToLowerInvariant();

    private static bool TryParseCommand(string command, out string args)
    {
        args = string.Empty;

        if (command.Equals(CommandPrefix, StringComparison.OrdinalIgnoreCase))
            return true;

        if (command.StartsWith(CommandPrefix + " ", StringComparison.OrdinalIgnoreCase))
        {
            args = command[(CommandPrefix.Length + 1)..].Trim();
            return true;
        }

        if (command.StartsWith(CommandPrefix, StringComparison.OrdinalIgnoreCase))
        {
            args = command[CommandPrefix.Length..].Trim();
            return true;
        }

        return TryStripPrefix(command, LegacyCommandPrefix, out args);
    }

    private static bool TryStripPrefix(string command, string prefix, out string args)
    {
        args = string.Empty;
        if (!command.Equals(prefix, StringComparison.OrdinalIgnoreCase) &&
            !command.StartsWith(prefix + " ", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        args = command.Length == prefix.Length ? string.Empty : command[(prefix.Length + 1)..].Trim();
        return true;
    }

    private static string FirstWord(string args)
        => args.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? string.Empty;

    private static string ModeName(DefenderMode mode)
        => mode == DefenderMode.Pdrop ? "ldrop" : mode.ToString().ToLowerInvariant();

    private static bool IsFigSec(SectorData sector)
    {
        foreach ((string key, string value) in sector.Variables)
        {
            if (string.Equals(key, "FIGSEC", StringComparison.OrdinalIgnoreCase))
                return IsTruthy(value);
        }

        return false;
    }

    private static bool IsTruthy(string value)
    {
        string normalized = value.Trim();
        return normalized == "1" ||
               normalized.Equals("true", StringComparison.OrdinalIgnoreCase) ||
               normalized.Equals("yes", StringComparison.OrdinalIgnoreCase) ||
               normalized.Equals("y", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseLimpetSector(string text, out int sector)
    {
        sector = 0;
        int start = text.IndexOf(LimpetPrefix, StringComparison.OrdinalIgnoreCase);
        if (start < 0)
            return false;

        start += LimpetPrefix.Length;
        return TryReadPositiveIntAt(text, start, out sector, out int afterDigits) &&
               StartsWithAfterWhitespace(text, afterDigits, "activated");
    }

    private static bool TryParseFighterSector(string text, out int sector)
    {
        sector = 0;
        int start = text.IndexOf(FighterPrefix, StringComparison.OrdinalIgnoreCase);
        if (start >= 0)
        {
            start += FighterPrefix.Length;
            if (TryReadPositiveIntAt(text, start, out sector, out int afterDigits) &&
                NextNonWhitespaceIs(text, afterDigits, ':'))
            {
                return true;
            }
        }

        start = text.IndexOf(PlainFighterPrefix, StringComparison.OrdinalIgnoreCase);
        if (start < 0)
            return false;

        start += PlainFighterPrefix.Length;
        return TryReadPositiveIntAt(text, start, out sector, out int plainAfterDigits) &&
               NextNonWhitespaceIs(text, plainAfterDigits, ':');
    }

    private static bool TryParseRawLimpetSector(byte[] data, out int sector)
    {
        sector = 0;
        ReadOnlySpan<byte> span = data;
        int start = span.IndexOf(LimpetPrefixBytes);
        if (start < 0)
            return false;

        int pos = start + LimpetPrefixBytes.Length;
        while (pos < span.Length && IsAsciiWhitespace(span[pos]))
            pos++;

        if (pos >= span.Length || span[pos] < (byte)'0' || span[pos] > (byte)'9')
            return false;

        int value = 0;
        while (pos < span.Length && span[pos] >= (byte)'0' && span[pos] <= (byte)'9')
        {
            value = (value * 10) + (span[pos] - (byte)'0');
            pos++;
        }

        while (pos < span.Length && IsAsciiWhitespace(span[pos]))
            pos++;

        if (pos + LimpetSuffixBytes.Length > span.Length ||
            !span.Slice(pos, LimpetSuffixBytes.Length).SequenceEqual(LimpetSuffixBytes))
        {
            return false;
        }

        sector = value;
        return value > 0;
    }

    private string BuildFastParseText(string rawText)
    {
        lock (_sync)
        {
            string text = StripAnsi(rawText, ref _fastAnsiState);
            if (_fastParseTail.Length == 0)
                return text;

            return _fastParseTail + text;
        }
    }

    private void RememberFastParseTail(string text, bool parsedHit)
    {
        lock (_sync)
        {
            if (parsedHit)
            {
                _fastParseTail = string.Empty;
                return;
            }

            int lineBreak = Math.Max(text.LastIndexOf('\r'), text.LastIndexOf('\n'));
            string tail = lineBreak >= 0 ? text[(lineBreak + 1)..] : text;
            _fastParseTail = tail.Length <= 160 ? tail : tail[^160..];
        }
    }

    private static bool TryReadPositiveIntAt(string text, int start, out int value, out int afterDigits)
    {
        value = 0;
        afterDigits = start;

        while (start < text.Length && char.IsWhiteSpace(text[start]))
            start++;

        if (start >= text.Length || !char.IsDigit(text[start]))
            return false;

        int result = 0;
        int pos = start;
        while (pos < text.Length && char.IsDigit(text[pos]))
        {
            result = (result * 10) + (text[pos] - '0');
            pos++;
        }

        value = result;
        afterDigits = pos;
        return result > 0;
    }

    private static bool StartsWithAfterWhitespace(string text, int start, string value)
    {
        while (start < text.Length && char.IsWhiteSpace(text[start]))
            start++;

        return start + value.Length <= text.Length &&
               text.AsSpan(start, value.Length).Equals(value, StringComparison.OrdinalIgnoreCase);
    }

    private static bool NextNonWhitespaceIs(string text, int start, char expected)
    {
        while (start < text.Length && char.IsWhiteSpace(text[start]))
            start++;

        return start < text.Length && text[start] == expected;
    }

    private static bool IsAsciiWhitespace(byte value)
        => value is (byte)' ' or (byte)'\t' or (byte)'\r' or (byte)'\n';

    private static bool IsAlienFighterHit(string text)
    {
        int colon = text.IndexOf(": ", StringComparison.Ordinal);
        if (colon < 0)
            return false;

        int possessive = text.IndexOf("'s", colon + 2, StringComparison.Ordinal);
        if (possessive < 0)
            return false;

        string traderAnsi = text[(colon + 2)..possessive];
        return traderAnsi.Contains(ChaserAlienAnsiMarker, StringComparison.Ordinal);
    }

    private static string StripAnsi(string value)
    {
        var state = AnsiStripState.Ground;
        return StripAnsi(value, ref state);
    }

    private static string StripAnsi(string value, ref AnsiStripState state)
    {
        if (value.IndexOf('\u001b') < 0)
        {
            if (state == AnsiStripState.Ground)
                return value;
        }

        if (value.Length == 0)
            return value;

        var sb = new StringBuilder(value.Length);
        for (int i = 0; i < value.Length; i++)
        {
            char ch = value[i];

            switch (state)
            {
                case AnsiStripState.Ground:
                    if (ch == '\u001b')
                    {
                        state = AnsiStripState.Escape;
                    }
                    else
                    {
                        sb.Append(ch);
                    }
                    break;

                case AnsiStripState.Escape:
                    state = ch == '[' ? AnsiStripState.Csi : AnsiStripState.Ground;
                    break;

                case AnsiStripState.Csi:
                    if (ch is >= '@' and <= '~')
                        state = AnsiStripState.Ground;
                    break;
            }
        }

        return sb.ToString();
    }

    private static double TicksToMicroseconds(long ticks)
        => ticks * 1_000_000.0 / Stopwatch.Frequency;

    private static double TicksToMicroseconds(double ticks)
        => ticks * 1_000_000.0 / Stopwatch.Frequency;

    private enum DefenderMode
    {
        Off,
        Foton,
        Pdrop,
    }

    private enum AnsiStripState
    {
        Ground,
        Escape,
        Csi,
    }

    private sealed record InterceptSample(
        int Sector,
        long ReceiveTimestamp,
        long SendStartTimestamp,
        long SendEndTimestamp,
        bool SendSuccess);
}
