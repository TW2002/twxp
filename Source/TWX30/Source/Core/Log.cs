using System;
using System.IO;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TWXProxy.Core;

/// <summary>
/// Centralized capture logging and playback for proxy/game traffic.
/// Mirrors the old Pascal TModLog behavior closely enough for TWX-style
/// capture files while staying usable from both the proxy and MTC.
/// </summary>
public sealed class ModLog : TWXModule, IModLog, ITWXGlobals
{
    private static readonly object ScriptLoggingSync = new();
    private static readonly Dictionary<object, HashSet<object>> ScriptLoggingSuppressors =
        new(ReferenceEqualityComparer.Instance);

    private enum AnsiStripState
    {
        None,
        Escape,
        Csi,
        Osc,
        OscEscape,
    }

    private readonly object _lock = new();
    private string _programDir = GlobalModules.ProgramDir;
    private string _logDirectory = GetDefaultLogDirectory(GlobalModules.ProgramDir);
    private string _logIdentity = "game";
    private string _logFilename = string.Empty;
    private string _ansiLogFilename = string.Empty;
    private FileStream? _logStream;
    private FileStream? _ansiLogStream;
    private StreamWriter? _textWriter;
    private StreamWriter? _ansiTextWriter;
    private DateTime _lastLogDate = DateTime.MinValue;
    private bool _logEnabled = true;
    private bool _logData = true;
    private bool _logAnsi;
    private bool _logAnsiCompanion;
    private bool _binaryLogs;
    private bool _notifyPlayCuts = true;
    private int _maxPlayDelay = 10000;
    private object? _scriptLoggingScope;
    private CancellationTokenSource? _playbackCancellation;
    private Task? _playbackTask;
    private Func<byte[], CancellationToken, Task>? _playbackSink;
    private Action<string>? _messageSink;
    private bool _playingLog;
    private AnsiStripState _ansiStripState;

    public string ProgramDir
    {
        get => _programDir;
        set
        {
            string previousProgramDir = _programDir;
            _programDir = value;

            string previousDefault = GetDefaultLogDirectory(previousProgramDir);
            if (PathEquals(_logDirectory, previousDefault))
                LogDirectory = GetDefaultLogDirectory(_programDir);
        }
    }

    public string LogDirectory
    {
        get => _logDirectory;
        set
        {
            string next = string.IsNullOrWhiteSpace(value) ? GetDefaultLogDirectory(_programDir) : value;
            lock (_lock)
            {
                if (PathEquals(_logDirectory, next))
                    return;

                _logDirectory = next;
                CloseLogLocked();
            }
        }
    }

    public string LogFilename
    {
        get
        {
            lock (_lock)
            {
                return _logFilename;
            }
        }
    }

    public bool LogEnabled
    {
        get => _logEnabled;
        set
        {
            lock (_lock)
            {
                if (_logEnabled == value)
                    return;

                _logEnabled = value;
                if (!value)
                    CloseLogLocked();
            }
        }
    }

    public bool LogData
    {
        get => _logData;
        set
        {
            lock (_lock)
            {
                _logData = value;
                if (!value)
                    CloseLogLocked();
            }
        }
    }

    public bool LogANSI
    {
        get => _logAnsi;
        set
        {
            lock (_lock)
            {
                if (_logAnsi == value)
                    return;

                _logAnsi = value;
                CloseLogLocked();
            }
        }
    }

    public bool LogAnsiCompanion
    {
        get => _logAnsiCompanion;
        set
        {
            lock (_lock)
            {
                if (_logAnsiCompanion == value)
                    return;

                _logAnsiCompanion = value;
                CloseLogLocked();
            }
        }
    }

    public bool BinaryLogs
    {
        get => _binaryLogs;
        set
        {
            lock (_lock)
            {
                if (_binaryLogs == value)
                    return;

                _binaryLogs = value;
                CloseLogLocked();
            }
        }
    }

    public bool NotifyPlayCuts
    {
        get => _notifyPlayCuts;
        set => _notifyPlayCuts = value;
    }

    public int MaxPlayDelay
    {
        get => _maxPlayDelay;
        set => _maxPlayDelay = value > 0 ? value : 10000;
    }

    public bool PlayingLog
    {
        get
        {
            lock (_lock)
            {
                return _playingLog;
            }
        }
    }

    public object? ScriptLoggingScope
    {
        get
        {
            lock (_lock)
            {
                return _scriptLoggingScope;
            }
        }
        set
        {
            lock (_lock)
            {
                _scriptLoggingScope = value;
            }
        }
    }

    public void SetLogIdentity(string? logIdentity)
    {
        string next = string.IsNullOrWhiteSpace(logIdentity)
            ? "game"
            : SharedPaths.SanitizeFileComponent(Path.GetFileNameWithoutExtension(logIdentity));

        lock (_lock)
        {
            if (string.Equals(_logIdentity, next, StringComparison.OrdinalIgnoreCase))
                return;

            _logIdentity = next;
            CloseLogLocked();
        }
    }

    public void SetPlaybackTargets(
        Func<byte[], CancellationToken, Task>? playbackSink,
        Action<string>? messageSink = null)
    {
        lock (_lock)
        {
            _playbackSink = playbackSink;
            _messageSink = messageSink;
        }
    }

    public void SetScriptLoggingEnabled(object source, bool enabled)
    {
        ArgumentNullException.ThrowIfNull(source);

        object? scope;
        lock (_lock)
        {
            scope = _scriptLoggingScope;
        }

        UpdateScriptLoggingOverride(scope, source, enabled);
    }

    public void ClearScriptLoggingOverride(object source)
    {
        ArgumentNullException.ThrowIfNull(source);

        object? scope;
        lock (_lock)
        {
            scope = _scriptLoggingScope;
        }

        UpdateScriptLoggingOverride(scope, source, enabled: true);
    }

    public void RecordServerData(byte[] ansiData)
    {
        if (ansiData.Length == 0)
            return;

        byte[] bytesToWrite = PrepareData(ansiData);
        if (bytesToWrite.Length == 0)
            return;

        lock (_lock)
        {
            if (!_logEnabled || !_logData || IsScriptLoggingSuppressedLocked())
                return;

            EnsureLogOpenLocked();

            if (_logStream == null)
                return;

            if (_binaryLogs)
            {
                WriteBinaryRecordLocked(bytesToWrite);
            }
            else
            {
                _textWriter!.Write(Encoding.Latin1.GetString(bytesToWrite));
                if (_ansiTextWriter != null)
                    _ansiTextWriter.Write(Encoding.Latin1.GetString(ansiData));
            }
        }
    }

    public void RecordServerText(string ansiText)
    {
        if (string.IsNullOrEmpty(ansiText))
            return;

        RecordServerData(Encoding.Latin1.GetBytes(ansiText));
    }

    public bool BeginPlayLog(string filename)
    {
        Func<byte[], CancellationToken, Task>? sink;

        lock (_lock)
        {
            if (_playingLog)
                return false;

            sink = _playbackSink;
            if (sink == null)
                return false;

            _playingLog = true;
            _playbackCancellation = new CancellationTokenSource();
            _playbackTask = PlaybackLoopAsync(filename, sink, _playbackCancellation.Token);
        }

        return true;
    }

    public void EndPlayLog()
    {
        StopPlayback(announceCompletion: true);
    }

    public void NotifyUserInput()
    {
        if (PlayingLog)
            EndPlayLog();
    }

    public void CloseLog()
    {
        lock (_lock)
        {
            CloseLogLocked();
        }
    }

    public override void Dispose()
    {
        StopPlayback(announceCompletion: false);
        CloseLog();
        base.Dispose();
    }

    private byte[] PrepareData(byte[] ansiData)
    {
        if (!_logAnsi)
            return StripAnsiBytes(ansiData);

        byte[] copy = new byte[ansiData.Length];
        Buffer.BlockCopy(ansiData, 0, copy, 0, ansiData.Length);
        return copy;
    }

    private bool IsScriptLoggingSuppressedLocked()
    {
        object? scope = _scriptLoggingScope;
        if (scope == null)
            return false;

        lock (ScriptLoggingSync)
        {
            return ScriptLoggingSuppressors.TryGetValue(scope, out HashSet<object>? suppressors) &&
                   suppressors.Count > 0;
        }
    }

    private static void UpdateScriptLoggingOverride(object? scope, object source, bool enabled)
    {
        if (scope == null)
            return;

        lock (ScriptLoggingSync)
        {
            if (!ScriptLoggingSuppressors.TryGetValue(scope, out HashSet<object>? suppressors))
            {
                if (enabled)
                    return;

                suppressors = new HashSet<object>(ReferenceEqualityComparer.Instance);
                ScriptLoggingSuppressors[scope] = suppressors;
            }

            if (enabled)
            {
                suppressors.Remove(source);
                if (suppressors.Count == 0)
                    ScriptLoggingSuppressors.Remove(scope);

                return;
            }

            suppressors.Add(source);
        }
    }

    private void EnsureLogOpenLocked()
    {
        DateTime today = DateTime.Today;
        string expectedPath = BuildLogPath(today);
        string expectedAnsiPath = BuildAnsiCompanionPath(today);
        bool useAnsiCompanion = !_binaryLogs && _logAnsiCompanion && !_logAnsi;

        if (_logStream != null &&
            _lastLogDate == today &&
            string.Equals(_logFilename, expectedPath, StringComparison.Ordinal) &&
            ((!useAnsiCompanion && _ansiLogStream == null) ||
             (useAnsiCompanion && _ansiLogStream != null && string.Equals(_ansiLogFilename, expectedAnsiPath, StringComparison.Ordinal))))
            return;

        CloseLogLocked();

        Directory.CreateDirectory(Path.GetDirectoryName(expectedPath)!);
        _logStream = new FileStream(expectedPath, FileMode.OpenOrCreate, FileAccess.Write, FileShare.ReadWrite);
        _logStream.Seek(0, SeekOrigin.End);
        _textWriter = _binaryLogs
            ? null
            : new StreamWriter(_logStream, Encoding.UTF8, 4096, leaveOpen: true) { AutoFlush = true };
        if (useAnsiCompanion)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(expectedAnsiPath)!);
            _ansiLogStream = new FileStream(expectedAnsiPath, FileMode.OpenOrCreate, FileAccess.Write, FileShare.ReadWrite);
            _ansiLogStream.Seek(0, SeekOrigin.End);
            _ansiTextWriter = new StreamWriter(_ansiLogStream, Encoding.UTF8, 4096, leaveOpen: true) { AutoFlush = true };
            _ansiLogFilename = expectedAnsiPath;
        }
        _lastLogDate = today;
        _logFilename = expectedPath;
    }

    private void CloseLogLocked()
    {
        try
        {
            _textWriter?.Dispose();
            _logStream?.Dispose();
            _ansiTextWriter?.Dispose();
            _ansiLogStream?.Dispose();
        }
        catch
        {
            // Logging must never disrupt the proxy.
        }

        _textWriter = null;
        _logStream = null;
        _ansiTextWriter = null;
        _ansiLogStream = null;
        _lastLogDate = DateTime.MinValue;
        _logFilename = string.Empty;
        _ansiLogFilename = string.Empty;
        _ansiStripState = AnsiStripState.None;
    }

    private void WriteBinaryRecordLocked(byte[] data)
    {
        uint timestamp = unchecked((uint)Environment.TickCount64);
        byte[] header = new byte[6];
        BitConverter.TryWriteBytes(header.AsSpan(0, 4), timestamp);
        BitConverter.TryWriteBytes(header.AsSpan(4, 2), checked((ushort)data.Length));

        _logStream!.Write(header, 0, header.Length);
        _logStream.Write(data, 0, data.Length);
        _logStream.Flush();
    }

    private string BuildLogPath(DateTime day)
    {
        string safeIdentity = SharedPaths.SanitizeFileComponent(_logIdentity);
        string extension = _binaryLogs ? ".cap" : ".log";
        return Path.Combine(_logDirectory, $"{day:yyyy-MM-dd} {safeIdentity}{extension}");
    }

    private string BuildAnsiCompanionPath(DateTime day)
    {
        string safeIdentity = SharedPaths.SanitizeFileComponent(_logIdentity);
        return Path.Combine(_logDirectory, $"{day:yyyy-MM-dd} {safeIdentity}_ansi.log");
    }

    private byte[] StripAnsiBytes(byte[] ansiData)
    {
        if (ansiData.Length == 0)
            return Array.Empty<byte>();

        byte[] buffer = new byte[ansiData.Length];
        int count = 0;

        foreach (byte value in ansiData)
        {
            switch (_ansiStripState)
            {
                case AnsiStripState.Escape:
                    if (value == (byte)'[')
                    {
                        _ansiStripState = AnsiStripState.Csi;
                        continue;
                    }

                    if (value == (byte)']')
                    {
                        _ansiStripState = AnsiStripState.Osc;
                        continue;
                    }

                    _ansiStripState = AnsiStripState.None;
                    continue;

                case AnsiStripState.Csi:
                    if (value >= 0x40 && value <= 0x7E)
                        _ansiStripState = AnsiStripState.None;
                    continue;

                case AnsiStripState.Osc:
                    if (value == 0x07)
                        _ansiStripState = AnsiStripState.None;
                    else if (value == 0x1B)
                        _ansiStripState = AnsiStripState.OscEscape;
                    continue;

                case AnsiStripState.OscEscape:
                    if (value == (byte)'\\')
                        _ansiStripState = AnsiStripState.None;
                    else if (value == 0x1B)
                        _ansiStripState = AnsiStripState.OscEscape;
                    else
                        _ansiStripState = AnsiStripState.Osc;
                    continue;
            }

            if (value == 0x1B)
            {
                _ansiStripState = AnsiStripState.Escape;
                continue;
            }

            buffer[count++] = value;
        }

        if (count == 0)
            return Array.Empty<byte>();

        byte[] clean = new byte[count];
        Buffer.BlockCopy(buffer, 0, clean, 0, count);
        return clean;
    }

    private static string GetDefaultLogDirectory(string? programDir)
    {
        if (!string.IsNullOrWhiteSpace(programDir))
            return Path.Combine(programDir, "logs");

        return SharedPaths.LogDir;
    }

    private async Task PlaybackLoopAsync(
        string filename,
        Func<byte[], CancellationToken, Task> sink,
        CancellationToken token)
    {
        bool announcedStart = false;

        try
        {
            using var stream = new FileStream(filename, FileMode.Open, FileAccess.Read, FileShare.Read);
            using var reader = new BinaryReader(stream, Encoding.Latin1, leaveOpen: false);
            _messageSink?.Invoke($"Beginning playback of capture file: {filename}\r\nPress any key to terminate.\r\n");
            announcedStart = true;

            uint lastTimestamp = 0;

            while (!token.IsCancellationRequested && stream.Position + 6 <= stream.Length)
            {
                uint timestamp = reader.ReadUInt32();
                ushort size = reader.ReadUInt16();

                if (size == 0)
                    continue;

                byte[] payload = reader.ReadBytes(size);
                if (payload.Length != size)
                    break;

                int delay = 1;
                if (lastTimestamp != 0)
                {
                    uint delta;
                    if (lastTimestamp == timestamp)
                        delta = 1;
                    else if (lastTimestamp > timestamp)
                        delta = timestamp + (uint.MaxValue - lastTimestamp);
                    else
                        delta = timestamp - lastTimestamp;

                    if (delta > _maxPlayDelay)
                    {
                        delay = 5000;
                        if (_notifyPlayCuts)
                            _messageSink?.Invoke($"PLAYBACK: Long delay of {delta / 1000}s cut to 5s\r\n");
                    }
                    else
                    {
                        delay = (int)Math.Max(1, delta);
                    }
                }

                lastTimestamp = timestamp;
                await Task.Delay(delay, token).ConfigureAwait(false);
                await sink(payload, token).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
            // User input or shutdown stopped playback.
        }
        catch (Exception ex)
        {
            _messageSink?.Invoke($"Unable to open capture file '{filename}' for play: {ex.Message}\r\n");
        }
        finally
        {
            StopPlayback(announceCompletion: announcedStart);
        }
    }

    private void StopPlayback(bool announceCompletion)
    {
        Action<string>? messageSink = null;
        CancellationTokenSource? cancellation = null;

        lock (_lock)
        {
            if (!_playingLog)
                return;

            _playingLog = false;
            cancellation = _playbackCancellation;
            _playbackCancellation = null;
            _playbackTask = null;
            messageSink = _messageSink;
        }

        try
        {
            cancellation?.Cancel();
            cancellation?.Dispose();
        }
        catch
        {
            // Best effort.
        }

        if (announceCompletion)
            messageSink?.Invoke("Playback of capture file completed.\r\n");
    }

    private static bool PathEquals(string left, string right)
    {
        StringComparison comparison = OperatingSystem.IsWindows()
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;
        return string.Equals(Path.GetFullPath(left), Path.GetFullPath(right), comparison);
    }
}
