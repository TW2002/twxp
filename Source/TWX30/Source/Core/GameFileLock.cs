using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace TWXProxy.Core;

/// <summary>
/// Holds an exclusive process-scoped lock for a game's JSON/database pair.
/// The lock file is intentionally left on disk; the OS releases the exclusive
/// handle when the owning process exits, so stale metadata does not block reuse.
/// </summary>
public sealed class GameFileLock : IDisposable
{
    private readonly FileStream _stream;
    private bool _disposed;

    private GameFileLock(string lockFilePath, FileStream stream)
    {
        LockFilePath = lockFilePath;
        _stream = stream;
    }

    public string LockFilePath { get; }

    public sealed record Info(
        string LockFilePath,
        string? Owner,
        int? Pid,
        string? ProcessName,
        string? ConfigPath,
        string? DatabasePath,
        bool IsProcessRunning);

    public static GameFileLock Acquire(string owner, string configPath, string databasePath)
    {
        string lockFilePath = GetLockFilePath(configPath);
        Directory.CreateDirectory(Path.GetDirectoryName(lockFilePath)!);

        TryRemoveStaleLock(lockFilePath);

        FileStream stream;
        try
        {
            stream = new FileStream(
                lockFilePath,
                FileMode.OpenOrCreate,
                FileAccess.ReadWrite,
                FileShare.None);
        }
        catch (IOException ex)
        {
            LockMetadata? metadata = TryReadMetadata(lockFilePath);
            string details = metadata == null
                ? lockFilePath
                : $"{lockFilePath} (owner: {metadata.Owner ?? "unknown"}, pid: {metadata.Pid?.ToString() ?? "unknown"}, process: {metadata.ProcessName ?? "unknown"})";
            throw new IOException(
                $"Game files are already in use by another running process. Lock: {details}",
                ex);
        }

        try
        {
            WriteMetadata(stream, owner, configPath, databasePath);
            return new GameFileLock(lockFilePath, stream);
        }
        catch
        {
            stream.Dispose();
            throw;
        }
    }

    public static string GetLockFilePath(string configPath)
    {
        string fullConfigPath = Path.GetFullPath(configPath);
        return fullConfigPath + ".lock";
    }

    public static Info? TryInspect(string lockFilePath)
    {
        if (string.IsNullOrWhiteSpace(lockFilePath) || !File.Exists(lockFilePath))
            return null;

        LockMetadata? metadata = TryReadMetadata(lockFilePath);
        if (metadata == null)
            return null;

        bool running = metadata.Pid is int pid && IsProcessRunning(pid);
        return new Info(
            Path.GetFullPath(lockFilePath),
            metadata.Owner,
            metadata.Pid,
            metadata.ProcessName,
            metadata.ConfigPath,
            metadata.DatabasePath,
            running);
    }

    public static bool TryRemoveIfStale(string lockFilePath)
    {
        Info? info = TryInspect(lockFilePath);
        if (info?.Pid == null || info.IsProcessRunning)
            return false;

        try
        {
            File.Delete(lockFilePath);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static void WriteMetadata(FileStream stream, string owner, string configPath, string databasePath)
    {
        var process = Process.GetCurrentProcess();
        string metadata = string.Join(
            Environment.NewLine,
            "{",
            $"  \"owner\": \"{Escape(owner)}\",",
            $"  \"pid\": {process.Id},",
            $"  \"processName\": \"{Escape(process.ProcessName)}\",",
            $"  \"configPath\": \"{Escape(Path.GetFullPath(configPath))}\",",
            $"  \"databasePath\": \"{Escape(Path.GetFullPath(databasePath))}\",",
            $"  \"acquiredUtc\": \"{DateTimeOffset.UtcNow:O}\"",
            "}",
            string.Empty);

        byte[] data = Encoding.UTF8.GetBytes(metadata);
        stream.SetLength(0);
        stream.Write(data, 0, data.Length);
        stream.Flush(flushToDisk: true);
        stream.Position = 0;
    }

    private static void TryRemoveStaleLock(string lockFilePath)
    {
        if (!File.Exists(lockFilePath))
            return;

        LockMetadata? metadata = TryReadMetadata(lockFilePath);
        if (metadata?.Pid == null)
            return;

        if (IsProcessRunning(metadata.Pid.Value))
            return;

        try
        {
            File.Delete(lockFilePath);
        }
        catch
        {
            // Let the exclusive open below produce the user-facing lock error.
        }
    }

    private static LockMetadata? TryReadMetadata(string lockFilePath)
    {
        try
        {
            string json = File.ReadAllText(lockFilePath, Encoding.UTF8);
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return null;

            return new LockMetadata(
                TryGetString(root, "owner"),
                TryGetInt(root, "pid"),
                TryGetString(root, "processName"),
                TryGetString(root, "configPath"),
                TryGetString(root, "databasePath"));
        }
        catch
        {
            return null;
        }
    }

    private static string? TryGetString(JsonElement root, string name)
    {
        return root.TryGetProperty(name, out JsonElement element) && element.ValueKind == JsonValueKind.String
            ? element.GetString()
            : null;
    }

    private static int? TryGetInt(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out JsonElement element))
            return null;

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int value))
            return value;

        if (element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out value))
            return value;

        return null;
    }

    private static bool IsProcessRunning(int pid)
    {
        if (pid <= 0)
            return false;

        try
        {
            using Process process = Process.GetProcessById(pid);
            return !process.HasExited;
        }
        catch
        {
            return false;
        }
    }

    private static string Escape(string value)
    {
        return value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("\"", "\\\"", StringComparison.Ordinal)
            .Replace("\r", "\\r", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);
    }

    private sealed record LockMetadata(
        string? Owner,
        int? Pid,
        string? ProcessName,
        string? ConfigPath,
        string? DatabasePath);

    public void Dispose()
    {
        if (_disposed)
            return;

        _disposed = true;
        _stream.Dispose();
    }
}
