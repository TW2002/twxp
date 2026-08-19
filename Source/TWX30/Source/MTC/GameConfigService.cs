using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Core = TWXProxy.Core;

namespace MTC;

internal static class GameConfigService
{
    private static readonly Core.DebouncedGameVariableStore VariableSaves = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
    };

    public static string NormalizeGameName(string? value)
    {
        string name = string.Concat((value ?? string.Empty).Split(Path.GetInvalidFileNameChars())).Trim();
        return string.IsNullOrWhiteSpace(name) ? "game" : name;
    }

    public static Dictionary<string, string> NormalizeVariables(IDictionary<string, string>? source)
        => Core.GameVariableStore.Normalize(source);

    public static string GameConfigPathForMode(string gameName, bool embeddedProxy)
        => embeddedProxy
            ? AppPaths.TwxproxyGameConfigFileFor(gameName)
            : AppPaths.MtcStandaloneGameConfigFileFor(gameName);

    public static string DatabasePathForMode(string gameName, bool embeddedProxy)
        => embeddedProxy
            ? AppPaths.TwxproxyDatabasePathForGame(gameName)
            : AppPaths.MtcStandaloneDatabasePathForGame(gameName);

    public static string VariablesPathForGame(string gameName)
        => AppPaths.GameVariablesFileFor(NormalizeGameName(gameName));

    public static string GameConfigPathForConfig(EmbeddedGameConfig config)
        => GameConfigPathForMode(NormalizeGameName(config.Name), config.Mtc?.EmbeddedProxy ?? true);

    public static bool HasGameNameConflict(
        string gameName,
        bool embeddedProxy,
        string? currentConfigPath = null,
        string? currentDatabasePath = null)
    {
        string configPath = GameConfigPathForMode(gameName, embeddedProxy);
        if (File.Exists(configPath) &&
            !string.Equals(configPath, currentConfigPath, StringComparison.OrdinalIgnoreCase))
            return true;

        string databasePath = DatabasePathForMode(gameName, embeddedProxy);
        if (File.Exists(databasePath) &&
            !string.Equals(databasePath, currentDatabasePath, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    public static bool PathsEqualSafe(string? left, string? right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
            return false;

        try
        {
            return string.Equals(
                Path.GetFullPath(left),
                Path.GetFullPath(right),
                StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return string.Equals(left, right, StringComparison.OrdinalIgnoreCase);
        }
    }

    public static MTC.mombot.mombotConfig GetOrCreateMombotConfig(EmbeddedGameConfig config)
    {
        config.Mtc ??= new EmbeddedMtcConfig();
        config.Mtc.State ??= new EmbeddedMtcState();
        config.Mtc.Debug ??= new EmbeddedMtcDebugConfig();
        config.mombot ??= config.Mtc.mombot ?? new MTC.mombot.mombotConfig();
        config.Mtc.mombot = config.mombot;
        return config.mombot;
    }

    public static EmbeddedGameConfig NormalizeMombotConfig(EmbeddedGameConfig config)
    {
        _ = GetOrCreateMombotConfig(config);
        return config;
    }

    public static EmbeddedGameConfig BuildPersistableConfig(EmbeddedGameConfig source)
    {
        string snapshotJson = JsonSerializer.Serialize(source, JsonOptions);
        EmbeddedGameConfig persisted =
            JsonSerializer.Deserialize<EmbeddedGameConfig>(snapshotJson, JsonOptions) ??
            new EmbeddedGameConfig();

        NormalizeMombotConfig(persisted);
        MTC.mombot.mombotConfig persistedMombot = GetOrCreateMombotConfig(persisted);
        persistedMombot.Enabled = false;
        persistedMombot.WatcherEnabled = false;
        persisted.Variables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        return persisted;
    }

    public static EmbeddedGameConfig? TryLoadSharedGameConfig(string gameName)
    {
        try
        {
            string path = AppPaths.TwxproxyGameConfigFileFor(gameName);
            if (!File.Exists(path))
                return null;

            string backupPath = ConfigBackupPathForGame(gameName, path);
            string? json = Core.SafeJsonFile.ReadAllTextWithRecovery(path, backupPath);
            if (string.IsNullOrWhiteSpace(json))
                return null;

            EmbeddedGameConfig? config = JsonSerializer.Deserialize<EmbeddedGameConfig>(json, JsonOptions);
            if (config == null)
                return null;

            config.Name = string.IsNullOrWhiteSpace(config.Name)
                ? NormalizeGameName(gameName)
                : NormalizeGameName(config.Name);
            config.DatabasePath = string.IsNullOrWhiteSpace(config.DatabasePath)
                ? AppPaths.TwxproxyDatabasePathForGame(config.Name)
                : config.DatabasePath;
            config.Variables = LoadVariablesAndMigrateInlineAsync(config.Name, config, path)
                .GetAwaiter()
                .GetResult();
            return NormalizeMombotConfig(config);
        }
        catch
        {
            return null;
        }
    }

    public static async Task<EmbeddedGameConfig?> LoadConfigAsync(string path)
    {
        try
        {
            string fallbackGameName = NormalizeGameNameFromConfigPath(path);
            string backupPath = ConfigBackupPathForGame(fallbackGameName, path);
            string? json = await Core.SafeJsonFile.ReadAllTextWithRecoveryAsync(path, backupPath);
            if (string.IsNullOrWhiteSpace(json))
                return null;

            EmbeddedGameConfig? config = JsonSerializer.Deserialize<EmbeddedGameConfig>(json, JsonOptions);
            if (config == null)
                return null;
            if (string.IsNullOrWhiteSpace(config.Name))
                config.Name = fallbackGameName;
            if (config.Sectors <= 0)
                config.Sectors = 1000;
            if (string.IsNullOrWhiteSpace(config.DatabasePath))
                config.DatabasePath = DatabasePathForMode(config.Name, config.Mtc?.EmbeddedProxy ?? true);
            config.Variables = await LoadVariablesAndMigrateInlineAsync(config.Name, config, path);
            return NormalizeMombotConfig(config);
        }
        catch
        {
            return null;
        }
    }

    public static async Task SaveConfigAsync(string gameName, EmbeddedGameConfig config)
    {
        try
        {
            AppPaths.EnsureTwxproxyGamesDir();
            config.Name = string.IsNullOrWhiteSpace(config.Name)
                ? NormalizeGameName(gameName)
                : NormalizeGameName(config.Name);
            string path = GameConfigPathForConfig(config);
            await SaveVariablesAsync(config.Name, config.Variables);
            EmbeddedGameConfig persisted = BuildPersistableConfig(config);
            string json = JsonSerializer.Serialize(persisted, JsonOptions);
            await Core.SafeJsonFile.WriteAllTextAtomicAsync(path, json, ConfigBackupPathForGame(config.Name, path));
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.GameConfig] save failed for '{gameName}': {ex}\n");
            Core.GlobalModules.FlushDebugLog();
        }
    }

    public static void RequestVariablesSave(string gameName, IDictionary<string, string>? variables)
    {
        string normalizedGameName = NormalizeGameName(gameName);
        VariableSaves.RequestSave(
            VariablesPathForGame(normalizedGameName),
            variables,
            VariablesBackupPathForGame(normalizedGameName));
    }

    public static async Task SaveVariablesAsync(string gameName, IDictionary<string, string>? variables)
    {
        string normalizedGameName = NormalizeGameName(gameName);
        await Core.GameVariableStore.SaveAsync(
            VariablesPathForGame(normalizedGameName),
            variables,
            VariablesBackupPathForGame(normalizedGameName));
    }

    public static async Task FlushVariablesAsync(string gameName)
    {
        await VariableSaves.FlushAsync(VariablesPathForGame(NormalizeGameName(gameName)));
    }

    public static async Task ResetVariablesAsync(string gameName, IDictionary<string, string>? variables = null)
    {
        string normalizedGameName = NormalizeGameName(gameName);
        await VariableSaves.ResetAsync(
            VariablesPathForGame(normalizedGameName),
            variables,
            VariablesBackupPathForGame(normalizedGameName));
    }

    private static async Task<Dictionary<string, string>> LoadVariablesAndMigrateInlineAsync(
        string gameName,
        EmbeddedGameConfig config,
        string configPath)
    {
        string normalizedGameName = NormalizeGameName(gameName);
        Dictionary<string, string> inlineVariables = NormalizeVariables(config.Variables);
        string variablesPath = VariablesPathForGame(normalizedGameName);
        bool variablesFileExists = File.Exists(variablesPath) || File.Exists(VariablesBackupPathForGame(normalizedGameName));
        Dictionary<string, string> variables = variablesFileExists
            ? await Core.GameVariableStore.LoadAsync(variablesPath, VariablesBackupPathForGame(normalizedGameName))
            : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        bool migratedInline = false;
        if (inlineVariables.Count > 0)
        {
            foreach (KeyValuePair<string, string> entry in inlineVariables)
            {
                if (!variables.ContainsKey(entry.Key))
                    variables[entry.Key] = entry.Value;
            }

            await SaveVariablesAsync(normalizedGameName, variables);
            migratedInline = true;
        }

        if (migratedInline)
        {
            config.Variables = variables;
            EmbeddedGameConfig persisted = BuildPersistableConfig(config);
            string json = JsonSerializer.Serialize(persisted, JsonOptions);
            await Core.SafeJsonFile.WriteAllTextAtomicAsync(
                configPath,
                json,
                ConfigBackupPathForGame(normalizedGameName, configPath));
        }

        return variables;
    }

    private static string ConfigBackupPathForGame(string gameName, string configPath)
        => Path.Combine(AppPaths.GameDataDirForGame(NormalizeGameName(gameName)), Path.GetFileName(configPath) + ".bak");

    private static string VariablesBackupPathForGame(string gameName)
        => VariablesPathForGame(gameName) + ".bak";

    private static string NormalizeGameNameFromConfigPath(string path)
    {
        string name = Path.GetFileNameWithoutExtension(path);
        return name.EndsWith("_mtc", StringComparison.OrdinalIgnoreCase)
            ? NormalizeGameName(name[..^4])
            : NormalizeGameName(name);
    }
}
