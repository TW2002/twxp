using System.Text.Json;

namespace TWXProxy.Core;

public static class GameVariableStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
    };

    public static async Task<Dictionary<string, string>> LoadAsync(
        string path,
        string? backupPath = null,
        CancellationToken cancellationToken = default)
    {
        string? json = await SafeJsonFile.ReadAllTextWithRecoveryAsync(path, backupPath, cancellationToken)
            .ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            Dictionary<string, string>? loaded = JsonSerializer.Deserialize<Dictionary<string, string>>(json, JsonOptions);
            return Normalize(loaded);
        }
        catch
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
    }

    public static async Task SaveAsync(
        string path,
        IDictionary<string, string>? variables,
        string? backupPath = null,
        CancellationToken cancellationToken = default)
    {
        Dictionary<string, string> normalized = Normalize(variables);
        string json = JsonSerializer.Serialize(normalized, JsonOptions);
        await SafeJsonFile.WriteAllTextAtomicAsync(path, json, backupPath, cancellationToken)
            .ConfigureAwait(false);
    }

    public static Dictionary<string, string> Normalize(IDictionary<string, string>? source)
    {
        var normalized = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (source == null)
            return normalized;

        foreach (KeyValuePair<string, string> entry in source)
            normalized[entry.Key] = entry.Value;

        return normalized;
    }
}

public sealed class DebouncedGameVariableStore
{
    private readonly object _sync = new();
    private readonly Dictionary<string, PendingVariableSave> _pending = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, Task> _workers = new(StringComparer.OrdinalIgnoreCase);
    private readonly TimeSpan _delay;

    public DebouncedGameVariableStore(TimeSpan? delay = null)
    {
        _delay = delay ?? TimeSpan.FromSeconds(2);
    }

    public void RequestSave(string path, IDictionary<string, string>? variables, string? backupPath = null)
    {
        string key = Path.GetFullPath(path);
        var save = new PendingVariableSave(
            key,
            string.IsNullOrWhiteSpace(backupPath) ? null : Path.GetFullPath(backupPath),
            GameVariableStore.Normalize(variables));

        lock (_sync)
        {
            _pending[key] = save;
            if (!_workers.ContainsKey(key))
                _workers[key] = Task.Run(() => RunWorkerAsync(key));
        }
    }

    public async Task FlushAsync(string path)
    {
        string key = Path.GetFullPath(path);
        PendingVariableSave? save = null;
        lock (_sync)
        {
            if (_pending.Remove(key, out PendingVariableSave? pending))
                save = pending;
        }

        if (save != null)
            await SaveSnapshotAsync(save).ConfigureAwait(false);
    }

    public async Task ResetAsync(string path, IDictionary<string, string>? variables = null, string? backupPath = null)
    {
        string key = Path.GetFullPath(path);
        string? fullBackupPath = string.IsNullOrWhiteSpace(backupPath) ? null : Path.GetFullPath(backupPath);
        Task? worker = null;
        lock (_sync)
        {
            _pending.Remove(key);
            _workers.TryGetValue(key, out worker);
        }

        if (worker != null)
        {
            try
            {
                await worker.ConfigureAwait(false);
            }
            catch
            {
                // Reset writes the authoritative replacement below.
            }
        }

        await GameVariableStore.SaveAsync(key, variables, backupPath: null).ConfigureAwait(false);

        if (!string.IsNullOrWhiteSpace(fullBackupPath) && File.Exists(fullBackupPath))
            File.Delete(fullBackupPath);
    }

    public async Task FlushAllAsync()
    {
        List<PendingVariableSave> saves;
        lock (_sync)
        {
            saves = _pending.Values.ToList();
            _pending.Clear();
        }

        foreach (PendingVariableSave save in saves)
            await SaveSnapshotAsync(save).ConfigureAwait(false);
    }

    private async Task RunWorkerAsync(string key)
    {
        while (true)
        {
            await Task.Delay(_delay).ConfigureAwait(false);

            PendingVariableSave? save = null;
            lock (_sync)
            {
                if (_pending.Remove(key, out PendingVariableSave? pending))
                    save = pending;
            }

            if (save != null)
                await SaveSnapshotAsync(save).ConfigureAwait(false);

            lock (_sync)
            {
                if (_pending.ContainsKey(key))
                    continue;

                _workers.Remove(key);
                return;
            }
        }
    }

    private static Task SaveSnapshotAsync(PendingVariableSave save)
        => GameVariableStore.SaveAsync(save.Path, save.Variables, save.BackupPath);

    private sealed record PendingVariableSave(
        string Path,
        string? BackupPath,
        Dictionary<string, string> Variables);
}
