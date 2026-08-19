using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Core = TWXProxy.Core;

namespace MTC;

internal static class TerminalRecordingFormat
{
    public const string FormatName = "mtc-rec-v1";
    public const string Extension = ".mtc";
    public const string LegacyExtension = ".mtcrec";

    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false,
    };
}

internal sealed class TerminalRecordingHeader
{
    public string RecordType { get; set; } = "header";
    public string Format { get; set; } = TerminalRecordingFormat.FormatName;
    public int Version { get; set; } = 1;
    public string CreatedUtc { get; set; } = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);
    public string Game { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public int Columns { get; set; } = 80;
    public int Rows { get; set; } = 24;
    public string App { get; set; } = "MTC";
}

internal sealed class TerminalRecordingEvent
{
    public string RecordType { get; set; } = "event";
    public long T { get; set; }
    public string Kind { get; set; } = string.Empty;
    public string? Data { get; set; }
    public int? Columns { get; set; }
    public int? Rows { get; set; }
}

internal sealed class TerminalRecording
{
    public TerminalRecordingHeader Header { get; }
    public IReadOnlyList<TerminalRecordingEvent> Events { get; }

    public TerminalRecording(TerminalRecordingHeader header, IReadOnlyList<TerminalRecordingEvent> events)
    {
        Header = header;
        Events = events;
    }

    public static async Task<TerminalRecording> LoadAsync(string path, CancellationToken cancellationToken = default)
    {
        await using FileStream fileStream = File.OpenRead(path);
        await using var gzipStream = new GZipStream(fileStream, CompressionMode.Decompress);
        using var reader = new StreamReader(gzipStream);

        TerminalRecordingHeader? header = null;
        var events = new List<TerminalRecordingEvent>();

        while (await reader.ReadLineAsync(cancellationToken).ConfigureAwait(false) is string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            using JsonDocument document = JsonDocument.Parse(line);
            if (!document.RootElement.TryGetProperty("recordType", out JsonElement typeElement))
                continue;

            string? recordType = typeElement.GetString();
            if (string.Equals(recordType, "header", StringComparison.OrdinalIgnoreCase))
            {
                header = JsonSerializer.Deserialize<TerminalRecordingHeader>(
                    line,
                    TerminalRecordingFormat.JsonOptions);
            }
            else if (string.Equals(recordType, "event", StringComparison.OrdinalIgnoreCase))
            {
                TerminalRecordingEvent? evt = JsonSerializer.Deserialize<TerminalRecordingEvent>(
                    line,
                    TerminalRecordingFormat.JsonOptions);
                if (evt != null)
                    events.Add(evt);
            }
        }

        if (header == null)
            throw new InvalidDataException("Recording does not contain an MTC recording header.");
        if (!string.Equals(header.Format, TerminalRecordingFormat.FormatName, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException($"Unsupported recording format: {header.Format}");

        return new TerminalRecording(header, events);
    }
}

internal sealed class TerminalSessionRecorder : IDisposable
{
    private readonly Channel<TerminalRecordingEvent> _channel;
    private readonly CancellationTokenSource _stopSource = new();
    private readonly FileStream _fileStream;
    private readonly GZipStream _gzipStream;
    private readonly StreamWriter _writer;
    private readonly Task _writerTask;
    private readonly Stopwatch _clock = Stopwatch.StartNew();
    private int _stopping;
    private int _disposed;

    public string FilePath { get; }
    public TerminalRecordingHeader Header { get; }

    private TerminalSessionRecorder(string filePath, TerminalRecordingHeader header)
    {
        FilePath = filePath;
        Header = header;
        Directory.CreateDirectory(Path.GetDirectoryName(filePath) ?? ".");

        _fileStream = new FileStream(
            filePath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.Read,
            bufferSize: 64 * 1024,
            useAsync: true);
        _gzipStream = new GZipStream(_fileStream, CompressionLevel.SmallestSize);
        _writer = new StreamWriter(_gzipStream);
        _channel = Channel.CreateUnbounded<TerminalRecordingEvent>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false,
        });
        _writerTask = Task.Run(WriteLoopAsync);
    }

    public static TerminalSessionRecorder Start(string programDirectory, string gameName, string host, int port, int columns, int rows)
    {
        string safeGame = Core.SharedPaths.SanitizeFileComponent(string.IsNullOrWhiteSpace(gameName) ? "game" : gameName);
        string stamp = DateTimeOffset.Now.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
        string path = Path.Combine(programDirectory, $"{safeGame}-{stamp}{TerminalRecordingFormat.Extension}");
        var header = new TerminalRecordingHeader
        {
            Game = safeGame,
            Host = host ?? string.Empty,
            Port = Math.Max(0, port),
            Columns = Math.Max(1, columns),
            Rows = Math.Max(1, rows),
        };

        return new TerminalSessionRecorder(path, header);
    }

    public void RecordOutput(byte[] data, int offset, int length)
    {
        if (length <= 0 || Volatile.Read(ref _stopping) != 0)
            return;

        var copy = new byte[length];
        Buffer.BlockCopy(data, offset, copy, 0, length);
        TryWrite(new TerminalRecordingEvent
        {
            T = ElapsedMilliseconds(),
            Kind = "output",
            Data = Convert.ToBase64String(copy),
        });
    }

    public void RecordInput(byte[] data)
    {
        if (data.Length == 0 || Volatile.Read(ref _stopping) != 0)
            return;

        var copy = new byte[data.Length];
        Buffer.BlockCopy(data, 0, copy, 0, data.Length);
        TryWrite(new TerminalRecordingEvent
        {
            T = ElapsedMilliseconds(),
            Kind = "input",
            Data = Convert.ToBase64String(copy),
        });
    }

    public void RecordResize(int columns, int rows)
    {
        if (columns <= 0 || rows <= 0 || Volatile.Read(ref _stopping) != 0)
            return;

        TryWrite(new TerminalRecordingEvent
        {
            T = ElapsedMilliseconds(),
            Kind = "resize",
            Columns = columns,
            Rows = rows,
        });
    }

    public async Task StopAsync()
    {
        if (Interlocked.Exchange(ref _stopping, 1) != 0)
            return;

        TryWrite(new TerminalRecordingEvent
        {
            T = ElapsedMilliseconds(),
            Kind = "stop",
        });
        _channel.Writer.TryComplete();
        await _writerTask.ConfigureAwait(false);
    }

    public void Dispose()
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0)
            return;

        try
        {
            StopAsync().GetAwaiter().GetResult();
        }
        catch
        {
            // Best effort during window shutdown.
        }
        finally
        {
            _stopSource.Dispose();
        }
    }

    private void TryWrite(TerminalRecordingEvent evt)
    {
        if (!_channel.Writer.TryWrite(evt))
        {
            Core.GlobalModules.DebugLog("[MTC.Recording] failed to queue recording event\n");
        }
    }

    private long ElapsedMilliseconds()
        => Math.Max(0, _clock.ElapsedMilliseconds);

    private async Task WriteLoopAsync()
    {
        int pendingFlushCount = 0;
        try
        {
            await WriteRecordAsync(Header).ConfigureAwait(false);

            await foreach (TerminalRecordingEvent evt in _channel.Reader.ReadAllAsync(_stopSource.Token).ConfigureAwait(false))
            {
                await WriteRecordAsync(evt).ConfigureAwait(false);
                pendingFlushCount++;
                if (pendingFlushCount >= 64)
                {
                    pendingFlushCount = 0;
                    await _writer.FlushAsync().ConfigureAwait(false);
                }
            }

            await _writer.FlushAsync().ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.Recording] writer failed: {ex}\n");
        }
        finally
        {
            await _writer.DisposeAsync().ConfigureAwait(false);
            await _gzipStream.DisposeAsync().ConfigureAwait(false);
            await _fileStream.DisposeAsync().ConfigureAwait(false);
        }
    }

    private Task WriteRecordAsync<T>(T record)
    {
        string json = JsonSerializer.Serialize(record, TerminalRecordingFormat.JsonOptions);
        return _writer.WriteLineAsync(json);
    }
}
