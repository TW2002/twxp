using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace TWXProxy.Core;

public static class SafeJsonFile
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> FileLocks = new(StringComparer.OrdinalIgnoreCase);

    public static async Task<string?> ReadAllTextWithRecoveryAsync(
        string path,
        string? backupPath = null,
        CancellationToken cancellationToken = default)
    {
        string fullPath = Path.GetFullPath(path);
        SemaphoreSlim gate = GetGate(fullPath);
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            string? primary = await TryReadValidJsonAsync(fullPath, cancellationToken).ConfigureAwait(false);
            if (primary != null)
            {
                if (!string.IsNullOrWhiteSpace(backupPath))
                    await EnsureBackupAsync(fullPath, backupPath!, cancellationToken).ConfigureAwait(false);
                return primary;
            }

            if (string.IsNullOrWhiteSpace(backupPath))
                return null;

            string? backup = await TryReadValidJsonAsync(backupPath!, cancellationToken).ConfigureAwait(false);
            if (backup == null)
                return null;

            await WriteAllTextAtomicUnderLockAsync(
                fullPath,
                backup,
                backupPath: null,
                ensureBackup: false,
                cancellationToken).ConfigureAwait(false);
            return backup;
        }
        finally
        {
            gate.Release();
        }
    }

    public static string? ReadAllTextWithRecovery(string path, string? backupPath = null)
    {
        string fullPath = Path.GetFullPath(path);
        SemaphoreSlim gate = GetGate(fullPath);
        gate.Wait();
        try
        {
            string? primary = TryReadValidJson(fullPath);
            if (primary != null)
            {
                if (!string.IsNullOrWhiteSpace(backupPath))
                    EnsureBackup(fullPath, backupPath!);
                return primary;
            }

            if (string.IsNullOrWhiteSpace(backupPath))
                return null;

            string? backup = TryReadValidJson(backupPath!);
            if (backup == null)
                return null;

            WriteAllTextAtomicUnderLock(fullPath, backup, backupPath: null, ensureBackup: false);
            return backup;
        }
        finally
        {
            gate.Release();
        }
    }

    public static async Task WriteAllTextAtomicAsync(
        string path,
        string json,
        string? backupPath = null,
        CancellationToken cancellationToken = default)
    {
        string fullPath = Path.GetFullPath(path);
        SemaphoreSlim gate = GetGate(fullPath);
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await WriteAllTextAtomicUnderLockAsync(
                fullPath,
                json,
                backupPath,
                ensureBackup: true,
                cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            gate.Release();
        }
    }

    public static void WriteAllTextAtomic(string path, string json, string? backupPath = null)
    {
        string fullPath = Path.GetFullPath(path);
        SemaphoreSlim gate = GetGate(fullPath);
        gate.Wait();
        try
        {
            WriteAllTextAtomicUnderLock(fullPath, json, backupPath, ensureBackup: true);
        }
        finally
        {
            gate.Release();
        }
    }

    private static async Task WriteAllTextAtomicUnderLockAsync(
        string fullPath,
        string json,
        string? backupPath,
        bool ensureBackup,
        CancellationToken cancellationToken)
    {
        ValidateJson(json);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        if (!string.IsNullOrWhiteSpace(backupPath) && File.Exists(fullPath))
        {
            string? current = await TryReadValidJsonAsync(fullPath, cancellationToken).ConfigureAwait(false);
            if (current != null)
                await WriteRawAtomicAsync(backupPath!, current, cancellationToken).ConfigureAwait(false);
        }

        await WriteRawAtomicAsync(fullPath, json, cancellationToken).ConfigureAwait(false);

        if (ensureBackup && !string.IsNullOrWhiteSpace(backupPath) && !File.Exists(backupPath!))
            await WriteRawAtomicAsync(backupPath!, json, cancellationToken).ConfigureAwait(false);
    }

    private static void WriteAllTextAtomicUnderLock(
        string fullPath,
        string json,
        string? backupPath,
        bool ensureBackup)
    {
        ValidateJson(json);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        if (!string.IsNullOrWhiteSpace(backupPath) && File.Exists(fullPath))
        {
            string? current = TryReadValidJson(fullPath);
            if (current != null)
                WriteRawAtomic(backupPath!, current);
        }

        WriteRawAtomic(fullPath, json);

        if (ensureBackup && !string.IsNullOrWhiteSpace(backupPath) && !File.Exists(backupPath!))
            WriteRawAtomic(backupPath!, json);
    }

    private static async Task EnsureBackupAsync(
        string fullPath,
        string backupPath,
        CancellationToken cancellationToken)
    {
        if (File.Exists(backupPath))
            return;

        string? current = await TryReadValidJsonAsync(fullPath, cancellationToken).ConfigureAwait(false);
        if (current != null)
            await WriteRawAtomicAsync(backupPath, current, cancellationToken).ConfigureAwait(false);
    }

    private static void EnsureBackup(string fullPath, string backupPath)
    {
        if (File.Exists(backupPath))
            return;

        string? current = TryReadValidJson(fullPath);
        if (current != null)
            WriteRawAtomic(backupPath, current);
    }

    private static async Task<string?> TryReadValidJsonAsync(string path, CancellationToken cancellationToken)
    {
        try
        {
            if (!File.Exists(path))
                return null;

            string json = await File.ReadAllTextAsync(path, Encoding.UTF8, cancellationToken).ConfigureAwait(false);
            if (string.IsNullOrWhiteSpace(json))
                return null;

            ValidateJson(json);
            return json;
        }
        catch
        {
            return null;
        }
    }

    private static string? TryReadValidJson(string path)
    {
        try
        {
            if (!File.Exists(path))
                return null;

            string json = File.ReadAllText(path, Encoding.UTF8);
            if (string.IsNullOrWhiteSpace(json))
                return null;

            ValidateJson(json);
            return json;
        }
        catch
        {
            return null;
        }
    }

    private static async Task WriteRawAtomicAsync(
        string path,
        string contents,
        CancellationToken cancellationToken)
    {
        string fullPath = Path.GetFullPath(path);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        string tempPath = BuildTempPath(fullPath);
        try
        {
            await using (var stream = new FileStream(
                tempPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 16384,
                FileOptions.WriteThrough))
            {
                byte[] bytes = Encoding.UTF8.GetBytes(contents);
                await stream.WriteAsync(bytes, cancellationToken).ConfigureAwait(false);
                await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
                stream.Flush(flushToDisk: true);
            }

            ReplaceFile(tempPath, fullPath);
        }
        finally
        {
            TryDelete(tempPath);
        }
    }

    private static void WriteRawAtomic(string path, string contents)
    {
        string fullPath = Path.GetFullPath(path);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        string tempPath = BuildTempPath(fullPath);
        try
        {
            using (var stream = new FileStream(
                tempPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 16384,
                FileOptions.WriteThrough))
            {
                byte[] bytes = Encoding.UTF8.GetBytes(contents);
                stream.Write(bytes, 0, bytes.Length);
                stream.Flush(flushToDisk: true);
            }

            ReplaceFile(tempPath, fullPath);
        }
        finally
        {
            TryDelete(tempPath);
        }
    }

    private static void ReplaceFile(string tempPath, string destinationPath)
    {
        if (File.Exists(destinationPath))
        {
            File.Replace(tempPath, destinationPath, destinationBackupFileName: null, ignoreMetadataErrors: true);
            return;
        }

        File.Move(tempPath, destinationPath);
    }

    private static string BuildTempPath(string fullPath)
    {
        string directory = Path.GetDirectoryName(fullPath)!;
        string fileName = Path.GetFileName(fullPath);
        return Path.Combine(directory, $".{fileName}.{Environment.ProcessId}.{Guid.NewGuid():N}.tmp");
    }

    private static void ValidateJson(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
        }
    }

    private static SemaphoreSlim GetGate(string path)
        => FileLocks.GetOrAdd(Path.GetFullPath(path), _ => new SemaphoreSlim(1, 1));
}
