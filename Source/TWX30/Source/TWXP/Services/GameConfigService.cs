using System.Collections.ObjectModel;
using System.Xml.Linq;
using TWXP.Models;

namespace TWXP.Services;

public interface IGameConfigService
{
    event EventHandler<string>? ProgramDirectoryChanged;
    event EventHandler<string>? ScriptsDirectoryChanged;
    Task<ObservableCollection<GameConfig>> LoadConfigsAsync();
    Task SaveConfigAsync(GameConfig config);
    void RequestVariablesSave(GameConfig config);
    Task SaveVariablesAsync(GameConfig config);
    Task FlushVariablesAsync(GameConfig config);
    Task RemoveConfigAsync(string configId);
    Task DeleteConfigAsync(string configId);
    Task<GameConfig?> GetConfigAsync(string configId);
    Task<string> GetProgramDirectoryAsync();
    Task SetProgramDirectoryAsync(string programDirectory);
    Task<string> GetScriptsDirectoryAsync();
    Task SetScriptsDirectoryAsync(string scriptDirectory);
    Task<string> GetPortHaggleModeAsync();
    Task SetPortHaggleModeAsync(string haggleMode);
    Task<string> GetPlanetHaggleModeAsync();
    Task SetPlanetHaggleModeAsync(string haggleMode);
}

public class GameConfigService : IGameConfigService
{
    public event EventHandler<string>? ProgramDirectoryChanged;
    public event EventHandler<string>? ScriptsDirectoryChanged;
    private string? _programDirectoryOverride;
    private string? _scriptsDirectoryOverride;
    private readonly TWXProxy.Core.DebouncedGameVariableStore _variableSaves = new();

    public GameConfigService(string? programDirectory = null, string? scriptsDirectory = null)
    {
        if (!string.IsNullOrWhiteSpace(programDirectory))
        {
            _programDirectoryOverride = NormalizeProgramDirectory(programDirectory);
            _scriptsDirectoryOverride = NormalizeScriptDirectory(scriptsDirectory);
            AppPaths.SetConfiguredProgramDir(_programDirectoryOverride);
        }
        else
        {
            var sharedPaths = TWXProxy.Core.SharedPathSettingsStore.Load();
            AppPaths.SetConfiguredProgramDir(sharedPaths.ProgramDirectory);
        }

        AppPaths.EnsureDirectories();
    }

    private void ApplyProgramDirectory()
    {
        if (!string.IsNullOrWhiteSpace(_programDirectoryOverride))
        {
            AppPaths.SetConfiguredProgramDir(_programDirectoryOverride);
            return;
        }

        var sharedPaths = TWXProxy.Core.SharedPathSettingsStore.Load();
        AppPaths.SetConfiguredProgramDir(sharedPaths.ProgramDirectory);
    }

    public static string GetDefaultScriptDirectory()
        => AppPaths.DefaultScriptDir;

    private static string NormalizeScriptDirectory(string? scriptDirectory)
    {
        if (string.IsNullOrWhiteSpace(scriptDirectory))
            return string.Empty;

        string trimmed = scriptDirectory.Trim();
        try
        {
            trimmed = Path.GetFullPath(trimmed);
        }
        catch
        {
        }

        return trimmed.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    }

    private static string NormalizeProgramDirectory(string? programDirectory)
    {
        if (string.IsNullOrWhiteSpace(programDirectory))
            return string.Empty;

        try
        {
            return Path.GetFullPath(programDirectory.Trim())
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }
        catch
        {
            return programDirectory.Trim();
        }
    }

    private static string VariablesPathForGame(string gameName)
        => AppPaths.GameVariablesFileFor(NormalizeGameName(gameName));

    private static string VariablesBackupPathForGame(string gameName)
        => VariablesPathForGame(gameName) + ".bak";

    private static string ConfigBackupPathForGame(string gameName, string configPath)
        => Path.Combine(AppPaths.GameDataDirForGame(NormalizeGameName(gameName)), Path.GetFileName(configPath) + ".bak");

    private static string NormalizeGameName(string? value)
    {
        string name = string.Concat((value ?? string.Empty).Split(Path.GetInvalidFileNameChars())).Trim();
        return string.IsNullOrWhiteSpace(name) ? "game" : name;
    }

    private static string NormalizeGameNameFromConfigPath(string path)
        => NormalizeGameName(Path.GetFileNameWithoutExtension(path));

    private static Dictionary<string, string> NormalizeVariables(IDictionary<string, string>? variables)
        => TWXProxy.Core.GameVariableStore.Normalize(variables);

    private static string ResolveEffectiveScriptDirectory(string? configuredScriptDirectory, string? programDirectory)
    {
        string normalized = NormalizeScriptDirectory(configuredScriptDirectory);
        return string.IsNullOrWhiteSpace(normalized)
            ? TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(programDirectory)
            : normalized;
    }

    private static string NormalizePortHaggleMode(string? haggleMode)
    {
        string normalized = TWXProxy.Core.NativeHaggleModes.Normalize(haggleMode);
        return string.IsNullOrWhiteSpace(normalized)
            ? TWXProxy.Core.NativeHaggleModes.Default
            : normalized;
    }

    private static string NormalizePlanetHaggleMode(string? haggleMode)
    {
        string normalized = TWXProxy.Core.NativeHaggleModes.Normalize(haggleMode);
        return string.IsNullOrWhiteSpace(normalized)
            ? TWXProxy.Core.NativeHaggleModes.DefaultPlanet
            : normalized;
    }

    private static string NormalizeStoredPortHaggleMode(string? haggleMode) =>
        string.IsNullOrWhiteSpace(haggleMode) ? string.Empty : NormalizePortHaggleMode(haggleMode);

    private static string NormalizeStoredPlanetHaggleMode(string? haggleMode) =>
        string.IsNullOrWhiteSpace(haggleMode) ? string.Empty : NormalizePlanetHaggleMode(haggleMode);

    private static void ApplyDefaults(GameConfig config, string? scriptsDirectory)
    {
        config.ScriptDirectory = ResolveEffectiveScriptDirectory(scriptsDirectory, AppPaths.ProgramDir);

        if (string.IsNullOrWhiteSpace(config.LoginScript))
            config.LoginScript = "0_Login.cts";

        if (config.CommandChar == '\0')
            config.CommandChar = '$';
        if (config.ListenPort == 0)
            config.ListenPort = 2300;
        if (config.Sectors <= 0)
            config.Sectors = 1000;
        if (config.BubbleSize <= 0 ||
            (!config.BubbleSizeCustomized && config.BubbleSize == TWXProxy.Core.ModBubble.LegacyDefaultMaxBubbleSize))
            config.BubbleSize = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
        if (config.ReconnectDelaySeconds <= 0)
            config.ReconnectDelaySeconds = 5;
        if (config.MaxPlayDelay <= 0)
            config.MaxPlayDelay = 10000;

        if (string.IsNullOrWhiteSpace(config.DatabasePath) ||
            !Path.IsPathRooted(config.DatabasePath) ||
            string.Equals(Path.GetDirectoryName(config.DatabasePath), AppPaths.LegacyDatabaseDir, StringComparison.OrdinalIgnoreCase))
        {
            config.DatabasePath = AppPaths.DatabasePathForGame(config.Name);
        }
    }

    private async Task<GameRegistry> LoadRegistryAsync()
    {
        ApplyProgramDirectory();

        string configPath = AppPaths.ConfigFile;
        if (File.Exists(configPath))
        {
            try
            {
                var document = XDocument.Load(configPath);
                XElement? section = TWXProxy.Core.SharedConfigFile.GetSection(
                    document,
                    TWXProxy.Core.SharedConfigFile.TwxpPrefsSectionName);
                if (section != null)
                {
                    GameRegistry registry = ParseRegistrySection(section);
                    registry.Games = NormalizeRegistryGamePaths(registry.Games);
                    return registry;
                }
            }
            catch
            {
            }
        }

        if (File.Exists(AppPaths.LegacyGameConfigFile))
            return await MigrateLegacyRegistryAsync(AppPaths.LegacyGameConfigFile);

        return new GameRegistry();
    }

    private async Task SaveRegistryAsync(GameRegistry registry)
    {
        registry.Games ??= new List<string>();
        registry.Games = NormalizeRegistryGamePaths(registry.Games);
        registry.PortHaggleMode = NormalizeStoredPortHaggleMode(registry.PortHaggleMode);
        registry.PlanetHaggleMode = NormalizeStoredPlanetHaggleMode(registry.PlanetHaggleMode);

        string configPath = AppPaths.ConfigFile;
        var document = TWXProxy.Core.SharedConfigFile.LoadOrCreate(configPath);
        var section = new XElement(
            TWXProxy.Core.SharedConfigFile.TwxpPrefsSectionName,
            new XElement("PortHaggleMode", registry.PortHaggleMode),
            new XElement("PlanetHaggleMode", registry.PlanetHaggleMode),
            new XElement("Games",
                registry.Games.Select(path => new XElement("Game", new XAttribute("Path", path)))));

        TWXProxy.Core.SharedConfigFile.ReplaceSection(
            document,
            TWXProxy.Core.SharedConfigFile.TwxpPrefsSectionName,
            section);
        TWXProxy.Core.SharedConfigFile.Save(document, configPath);
        await Task.CompletedTask;
    }

    private static GameRegistry ParseRegistrySection(XElement section)
    {
        var registry = new GameRegistry
        {
            PortHaggleMode = NormalizeStoredPortHaggleMode((string?)section.Element("PortHaggleMode")),
            PlanetHaggleMode = NormalizeStoredPlanetHaggleMode((string?)section.Element("PlanetHaggleMode")),
            Games = section.Element("Games")?.Elements("Game")
                .Select(element => (string?)element.Attribute("Path") ?? (string?)element)
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .Cast<string>()
                .ToList() ?? new List<string>(),
        };

        return registry;
    }

    private List<string> NormalizeRegistryGamePaths(IEnumerable<string>? gamePaths)
    {
        var normalized = new List<string>();
        if (gamePaths == null)
            return normalized;

        foreach (string path in gamePaths)
        {
            string normalizedPath = NormalizeGameDataFilePath(path);
            if (string.IsNullOrWhiteSpace(normalizedPath))
                continue;

            if (!normalized.Contains(normalizedPath, StringComparer.OrdinalIgnoreCase))
                normalized.Add(normalizedPath);
        }

        return normalized;
    }

    private string NormalizeGameDataFilePath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return string.Empty;

        string fileName = Path.GetFileName(path);
        if (string.IsNullOrWhiteSpace(fileName))
            return string.Empty;

        string destinationPath = Path.Combine(AppPaths.GamesDir, fileName);
        try
        {
            Directory.CreateDirectory(AppPaths.GamesDir);
            string fullDestination = Path.GetFullPath(destinationPath);
            string fullSource = Path.GetFullPath(path);

            if (!string.Equals(fullSource, fullDestination, StringComparison.OrdinalIgnoreCase) &&
                File.Exists(fullSource) &&
                !File.Exists(fullDestination))
            {
                File.Move(fullSource, fullDestination);
            }

            return fullDestination;
        }
        catch
        {
            return destinationPath;
        }
    }

    private static async Task<GameConfig?> ReadGameFileAsync(string filePath)
    {
        try
        {
            string fallbackGameName = NormalizeGameNameFromConfigPath(filePath);
            string? json = await TWXProxy.Core.SafeJsonFile.ReadAllTextWithRecoveryAsync(
                filePath,
                ConfigBackupPathForGame(fallbackGameName, filePath));
            if (string.IsNullOrWhiteSpace(json))
                return null;

            GameConfig? config = System.Text.Json.JsonSerializer.Deserialize(
                json, GameConfigJsonContext.Default.GameConfig);
            if (config == null)
                return null;

            if (string.IsNullOrWhiteSpace(config.Name))
                config.Name = fallbackGameName;

            config.GameDataFilePath = filePath;
            config.Variables = await LoadVariablesAndMigrateInlineAsync(config, filePath);
            return config;
        }
        catch
        {
            return null;
        }
    }

    private static async Task<Dictionary<string, string>> LoadVariablesAndMigrateInlineAsync(
        GameConfig config,
        string configPath)
    {
        string gameName = NormalizeGameName(config.Name);
        Dictionary<string, string> inlineVariables = NormalizeVariables(config.Variables);
        string variablesPath = VariablesPathForGame(gameName);
        bool variablesFileExists = File.Exists(variablesPath) || File.Exists(VariablesBackupPathForGame(gameName));
        Dictionary<string, string> variables = variablesFileExists
            ? await TWXProxy.Core.GameVariableStore.LoadAsync(variablesPath, VariablesBackupPathForGame(gameName))
            : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        bool migratedInline = false;
        if (inlineVariables.Count > 0)
        {
            foreach (KeyValuePair<string, string> entry in inlineVariables)
            {
                if (!variables.ContainsKey(entry.Key))
                    variables[entry.Key] = entry.Value;
            }

            await SaveVariablesStaticAsync(gameName, variables);
            migratedInline = true;
        }

        if (migratedInline)
        {
            config.Variables = variables;
            await WriteGameFileAsync(config, configPath);
        }

        return variables;
    }

    private static async Task SaveVariablesStaticAsync(string gameName, IDictionary<string, string>? variables)
    {
        string normalizedGameName = NormalizeGameName(gameName);
        await TWXProxy.Core.GameVariableStore.SaveAsync(
            VariablesPathForGame(normalizedGameName),
            variables,
            VariablesBackupPathForGame(normalizedGameName));
    }

    private static async Task WriteGameFileAsync(GameConfig config, string path)
    {
        Dictionary<string, string> runtimeVariables = config.Variables;
        string? runtimeScriptDirectory = config.ScriptDirectory;
        string? runtimeNativeHaggleMode = config.NativeHaggleMode;

        config.ScriptDirectory = null;
        config.NativeHaggleMode = null;
        config.Variables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string json;
        try
        {
            json = System.Text.Json.JsonSerializer.Serialize(
                config, GameConfigJsonContext.Default.GameConfig);
        }
        finally
        {
            config.ScriptDirectory = runtimeScriptDirectory;
            config.NativeHaggleMode = runtimeNativeHaggleMode;
            config.Variables = runtimeVariables;
        }

        await TWXProxy.Core.SafeJsonFile.WriteAllTextAtomicAsync(
            path,
            json,
            ConfigBackupPathForGame(config.Name, path));
    }

    private async Task<GameRegistry> MigrateOldConfigsAsync(List<GameConfig> oldConfigs)
    {
        var registry = new GameRegistry();
        string? migratedScriptsDirectory = oldConfigs
            .Select(config => NormalizeScriptDirectory(config.ScriptDirectory))
            .FirstOrDefault(path => !string.IsNullOrWhiteSpace(path));
        if (!string.IsNullOrWhiteSpace(migratedScriptsDirectory))
        {
            string migratedProgramDirectory = TWXProxy.Core.SharedPaths.ResolveProgramDir(migratedScriptsDirectory);
            TWXProxy.Core.SharedPathSettingsStore.Save(migratedProgramDirectory, migratedScriptsDirectory);
            AppPaths.SetConfiguredProgramDir(migratedProgramDirectory);
        }

        foreach (GameConfig config in oldConfigs)
        {
            ApplyDefaults(config, null);
            config.GameDataFilePath = AppPaths.GameDataFileFor(config.Name);

            Directory.CreateDirectory(Path.GetDirectoryName(config.GameDataFilePath)!);
            await SaveVariablesStaticAsync(config.Name, config.Variables);
            await WriteGameFileAsync(config, config.GameDataFilePath);
            registry.Games.Add(config.GameDataFilePath);
        }

        await SaveRegistryAsync(registry);
        return registry;
    }

    private async Task<GameRegistry> MigrateLegacyRegistryAsync(string legacyRegistryFile)
    {
        try
        {
            string json = await File.ReadAllTextAsync(legacyRegistryFile);
            var trimmed = json.AsSpan().TrimStart();
            if (trimmed.Length == 0)
                return new GameRegistry();

            if (trimmed[0] == '[' && trimmed.Length >= 2 && trimmed[1] == '{')
            {
                var oldConfigs = System.Text.Json.JsonSerializer.Deserialize(
                    json, GameConfigJsonContext.Default.ListGameConfig);
                if (oldConfigs != null)
                    return await MigrateOldConfigsAsync(oldConfigs);
            }

            if (trimmed[0] == '[')
            {
                var oldPaths = System.Text.Json.JsonSerializer.Deserialize(
                    json, GameConfigJsonContext.Default.ListString) ?? new List<string>();
                var registry = new GameRegistry
                {
                    Games = NormalizeRegistryGamePaths(oldPaths),
                };
                await SaveRegistryAsync(registry);
                return registry;
            }

            var legacyRegistry = System.Text.Json.JsonSerializer.Deserialize(
                json, GameConfigJsonContext.Default.GameRegistry) ?? new GameRegistry();
            string migratedScriptsDirectory = NormalizeScriptDirectory(legacyRegistry.ScriptsDirectory);
            if (!string.IsNullOrWhiteSpace(migratedScriptsDirectory))
            {
                string migratedProgramDirectory = TWXProxy.Core.SharedPaths.ResolveProgramDir(migratedScriptsDirectory);
                TWXProxy.Core.SharedPathSettingsStore.Save(migratedProgramDirectory, migratedScriptsDirectory);
                AppPaths.SetConfiguredProgramDir(migratedProgramDirectory);
            }
            legacyRegistry.Games = NormalizeRegistryGamePaths(legacyRegistry.Games);
            legacyRegistry.PortHaggleMode = NormalizeStoredPortHaggleMode(legacyRegistry.PortHaggleMode);
            legacyRegistry.PlanetHaggleMode = NormalizeStoredPlanetHaggleMode(legacyRegistry.PlanetHaggleMode);
            await SaveRegistryAsync(legacyRegistry);
            return legacyRegistry;
        }
        catch
        {
            return new GameRegistry();
        }
    }

    public async Task<ObservableCollection<GameConfig>> LoadConfigsAsync()
    {
        var registry = await LoadRegistryAsync();
        var configs = new ObservableCollection<GameConfig>();

        foreach (string filePath in registry.Games)
        {
            if (!File.Exists(filePath))
                continue;

            GameConfig? config = await ReadGameFileAsync(filePath);
            if (config == null)
                continue;

            ApplyDefaults(config, null);
            config.GameDataFilePath = filePath;
            configs.Add(config);
        }

        return configs;
    }

    public async Task SaveConfigAsync(GameConfig config)
    {
        var registry = await LoadRegistryAsync();
        string desiredPath = AppPaths.GameDataFileFor(config.Name);
        string previousPath = config.GameDataFilePath;

        ApplyDefaults(config, null);
        config.GameDataFilePath = desiredPath;

        Directory.CreateDirectory(Path.GetDirectoryName(config.GameDataFilePath)!);
        await SaveVariablesAsync(config);
        await WriteGameFileAsync(config, config.GameDataFilePath);

        registry.Games.RemoveAll(path => string.Equals(path, previousPath, StringComparison.OrdinalIgnoreCase));
        if (!registry.Games.Contains(config.GameDataFilePath, StringComparer.OrdinalIgnoreCase))
            registry.Games.Add(config.GameDataFilePath);

        await SaveRegistryAsync(registry);
    }

    public void RequestVariablesSave(GameConfig config)
    {
        ApplyProgramDirectory();
        _variableSaves.RequestSave(
            VariablesPathForGame(config.Name),
            config.Variables,
            VariablesBackupPathForGame(config.Name));
    }

    public Task SaveVariablesAsync(GameConfig config)
    {
        ApplyProgramDirectory();
        return SaveVariablesStaticAsync(config.Name, config.Variables);
    }

    public Task FlushVariablesAsync(GameConfig config)
    {
        ApplyProgramDirectory();
        return _variableSaves.FlushAsync(VariablesPathForGame(config.Name));
    }

    public async Task RemoveConfigAsync(string configId)
    {
        var configs = await LoadConfigsAsync();
        GameConfig? config = configs.FirstOrDefault(candidate => candidate.Id == configId);
        if (config == null || string.IsNullOrEmpty(config.GameDataFilePath))
            return;

        var registry = await LoadRegistryAsync();
        registry.Games.RemoveAll(path => string.Equals(path, config.GameDataFilePath, StringComparison.OrdinalIgnoreCase));
        await SaveRegistryAsync(registry);
    }

    public async Task DeleteConfigAsync(string configId)
    {
        await RemoveConfigAsync(configId);
    }

    public async Task<GameConfig?> GetConfigAsync(string configId)
    {
        var configs = await LoadConfigsAsync();
        return configs.FirstOrDefault(config => config.Id == configId);
    }

    public Task<string> GetProgramDirectoryAsync()
    {
        if (!string.IsNullOrWhiteSpace(_programDirectoryOverride))
            return Task.FromResult(_programDirectoryOverride);

        string programDirectory = TWXProxy.Core.SharedPathSettingsStore.Load().ProgramDirectory;
        AppPaths.SetConfiguredProgramDir(programDirectory);
        return Task.FromResult(programDirectory);
    }

    public Task SetProgramDirectoryAsync(string programDirectory)
    {
        if (!string.IsNullOrWhiteSpace(_programDirectoryOverride))
        {
            string normalizedOverride = NormalizeProgramDirectory(programDirectory);
            if (string.IsNullOrWhiteSpace(normalizedOverride))
                normalizedOverride = TWXProxy.Core.SharedPaths.GetDefaultProgramDir();
            _programDirectoryOverride = normalizedOverride;
            if (string.IsNullOrWhiteSpace(_scriptsDirectoryOverride))
                _scriptsDirectoryOverride = TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(normalizedOverride);
            AppPaths.SetConfiguredProgramDir(normalizedOverride);
            ProgramDirectoryChanged?.Invoke(this, normalizedOverride);
            return Task.CompletedTask;
        }

        var sharedPaths = TWXProxy.Core.SharedPathSettingsStore.Load();
        string oldDefaultScripts = TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(sharedPaths.ProgramDirectory);
        string nextProgramDirectory = NormalizeProgramDirectory(programDirectory);
        string nextScriptsDirectory = sharedPaths.ScriptsDirectory;

        if (string.IsNullOrWhiteSpace(nextProgramDirectory))
            nextProgramDirectory = TWXProxy.Core.SharedPaths.GetDefaultProgramDir();

        if (string.IsNullOrWhiteSpace(nextScriptsDirectory) ||
            string.Equals(nextScriptsDirectory, oldDefaultScripts, StringComparison.OrdinalIgnoreCase))
        {
            nextScriptsDirectory = TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(nextProgramDirectory);
        }

        TWXProxy.Core.SharedPathSettingsStore.Save(nextProgramDirectory, nextScriptsDirectory);
        AppPaths.SetConfiguredProgramDir(nextProgramDirectory);
        ProgramDirectoryChanged?.Invoke(this, nextProgramDirectory);
        ScriptsDirectoryChanged?.Invoke(this, nextScriptsDirectory);
        return Task.CompletedTask;
    }

    public Task<string> GetScriptsDirectoryAsync()
    {
        if (!string.IsNullOrWhiteSpace(_programDirectoryOverride))
        {
            string scriptsDirectory = string.IsNullOrWhiteSpace(_scriptsDirectoryOverride)
                ? TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(_programDirectoryOverride)
                : _scriptsDirectoryOverride;
            AppPaths.SetConfiguredProgramDir(_programDirectoryOverride);
            return Task.FromResult(scriptsDirectory);
        }

        var sharedPaths = TWXProxy.Core.SharedPathSettingsStore.Load();
        AppPaths.SetConfiguredProgramDir(sharedPaths.ProgramDirectory);
        return Task.FromResult(sharedPaths.ScriptsDirectory);
    }

    public Task SetScriptsDirectoryAsync(string scriptDirectory)
    {
        if (!string.IsNullOrWhiteSpace(_programDirectoryOverride))
        {
            string normalizedOverrideScripts = NormalizeScriptDirectory(scriptDirectory);
            if (string.IsNullOrWhiteSpace(normalizedOverrideScripts))
                normalizedOverrideScripts = TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(_programDirectoryOverride);
            _scriptsDirectoryOverride = normalizedOverrideScripts;
            AppPaths.SetConfiguredProgramDir(_programDirectoryOverride);
            ScriptsDirectoryChanged?.Invoke(this, normalizedOverrideScripts);
            return Task.CompletedTask;
        }

        var sharedPaths = TWXProxy.Core.SharedPathSettingsStore.Load();
        string normalized = NormalizeScriptDirectory(scriptDirectory);
        if (string.IsNullOrWhiteSpace(normalized))
            normalized = TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(sharedPaths.ProgramDirectory);

        TWXProxy.Core.SharedPathSettingsStore.Save(sharedPaths.ProgramDirectory, normalized);
        AppPaths.SetConfiguredProgramDir(sharedPaths.ProgramDirectory);
        ScriptsDirectoryChanged?.Invoke(this, normalized);
        return Task.CompletedTask;
    }

    public async Task<string> GetPortHaggleModeAsync()
    {
        GameRegistry registry = await LoadRegistryAsync();
        return NormalizeStoredPortHaggleMode(registry.PortHaggleMode);
    }

    public async Task SetPortHaggleModeAsync(string haggleMode)
    {
        GameRegistry registry = await LoadRegistryAsync();
        string normalized = NormalizePortHaggleMode(haggleMode);
        if (string.Equals(normalized, registry.PortHaggleMode, StringComparison.OrdinalIgnoreCase))
            return;

        registry.PortHaggleMode = normalized;
        await SaveRegistryAsync(registry);
    }

    public async Task<string> GetPlanetHaggleModeAsync()
    {
        GameRegistry registry = await LoadRegistryAsync();
        return NormalizeStoredPlanetHaggleMode(registry.PlanetHaggleMode);
    }

    public async Task SetPlanetHaggleModeAsync(string haggleMode)
    {
        GameRegistry registry = await LoadRegistryAsync();
        string normalized = NormalizePlanetHaggleMode(haggleMode);
        if (string.Equals(normalized, registry.PlanetHaggleMode, StringComparison.OrdinalIgnoreCase))
            return;

        registry.PlanetHaggleMode = normalized;
        await SaveRegistryAsync(registry);
    }
}
