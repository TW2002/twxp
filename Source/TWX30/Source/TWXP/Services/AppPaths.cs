namespace TWXP.Services;

/// <summary>
/// Resolves platform-specific paths for TWX Proxy application data.
/// Shared game files and the unified config live under the active program directory.
/// </summary>
public static class AppPaths
{
    private static readonly string _legacyAppDataDir = BuildLegacyAppDataDir();
    private static string _configuredProgramDir = TWXProxy.Core.SharedPathSettingsStore.Load().ProgramDirectory;

    /// <summary>Legacy/bootstrap app-data root retained only for migration paths.</summary>
    public static string AppDataDir => TWXProxy.Core.SharedPaths.AppDataDir;

    public static string ProgramDir => GetEffectiveProgramDir();

    /// <summary>Directory where the unified shared config file is stored.</summary>
    public static string ConfigDir => ProgramDir;

    /// <summary>Legacy pre-unification app-data root used for migration.</summary>
    public static string LegacyConfigDir => _legacyAppDataDir;

    /// <summary>Path to the shared XML config file.</summary>
    public static string ConfigFile => TWXProxy.Core.SharedPaths.GetConfigFilePath(ProgramDir);

    public static string LegacyGameConfigFile => Path.Combine(LegacyConfigDir, "gameconfigs.json");

    /// <summary>Directory where per-game data JSON files are stored.</summary>
    public static string GamesDir => Path.Combine(ProgramDir, "games");

    /// <summary>Returns the GAMENAME.json path for a given game name.</summary>
    public static string GameDataFileFor(string gameName)
    {
        string safe = string.Concat(gameName.Split(Path.GetInvalidFileNameChars()));
        if (string.IsNullOrWhiteSpace(safe)) safe = "game";
        return Path.Combine(GamesDir, TWXProxy.Core.SharedPaths.SanitizeFileComponent(gameName) + ".json");
    }

    public static string GameDataDirForGame(string gameName)
        => TWXProxy.Core.SharedPaths.GameDataDirForGame(gameName, ProgramDir);

    public static string GameVariablesFileFor(string gameName)
        => TWXProxy.Core.SharedPaths.GameVariablesPathForGame(gameName, ProgramDir);

    /// <summary>
    /// Directory where per-game databases are stored alongside the game JSON files.
    /// </summary>
    public static string DatabaseDir => GamesDir;

    /// <summary>
    /// Legacy per-app database directory used before the shared-database change.
    /// Still used for one-time migration of existing default databases.
    /// </summary>
    public static string LegacyDatabaseDir => Path.Combine(AppDataDir, "databases");

    /// <summary>
    /// Default scripts directory (used when a game config has no explicit ScriptDirectory).
    ///   macOS   : /Library/Application Support/twxproxy/scripts
    ///   Windows : ProgramDir\scripts, where ProgramDir comes from the installer registry key
    ///   Linux   : /usr/local/share/twxproxy/scripts
    /// Users can override this per-game in Settings.
    /// </summary>
    public static string DefaultScriptDir => TWXProxy.Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(ProgramDir);

    /// <summary>Returns the .xdb path for a given game name.</summary>
    public static string DatabasePathForGame(string gameName)
    {
        string safe = TWXProxy.Core.SharedPaths.SanitizeFileComponent(gameName);
        return Path.Combine(DatabaseDir, safe + ".xdb");
    }

    public static string LegacyDatabasePathForGame(string gameName)
    {
        string safe = TWXProxy.Core.SharedPaths.SanitizeFileComponent(gameName);
        return Path.Combine(LegacyDatabaseDir, safe + ".xdb");
    }

    /// <summary>Directory where per-game debug logs are stored.</summary>
    public static string LogsDir => Path.Combine(ProgramDir, "logs");

    /// <summary>Directory where TWXP-only expansion modules can be placed.</summary>
    public static string ModulesDir => Path.Combine(ProgramDir, "modules");

    /// <summary>Directory where expansion modules persist state.</summary>
    public static string ModuleDataDir => TWXProxy.Core.SharedPaths.GetModuleDataRootDir(ProgramDir);

    /// <summary>Directory where shared expansion modules can be placed for both apps.</summary>
    public static string SharedModulesDir => TWXProxy.Core.SharedPaths.ModulesDir;

    /// <summary>Returns the debug log path for a given game name.</summary>
    public static string DebugLogPathForGame(string gameName)
    {
        string safe = string.Concat(gameName.Split(Path.GetInvalidFileNameChars()));
        if (string.IsNullOrWhiteSpace(safe)) safe = "game";
        return Path.Combine(LogsDir, safe + "_debug.log");
    }

    /// <summary>Ensure all required directories exist.</summary>
    public static void EnsureDirectories()
    {
        Directory.CreateDirectory(ProgramDir);
        Directory.CreateDirectory(ConfigDir);
        Directory.CreateDirectory(GamesDir);
        Directory.CreateDirectory(DatabaseDir);
        Directory.CreateDirectory(LogsDir);
        Directory.CreateDirectory(ModulesDir);
        Directory.CreateDirectory(ModuleDataDir);
        TWXProxy.Core.SharedPaths.EnsureModuleDir();
    }

    public static void SetConfiguredProgramDir(string? programDir)
    {
        if (string.IsNullOrWhiteSpace(programDir))
            return;

        _configuredProgramDir = Path.GetFullPath(programDir)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        TWXProxy.Core.GlobalModules.ProgramDir = _configuredProgramDir;
    }

    public static string GetEffectiveProgramDir()
        => string.IsNullOrWhiteSpace(_configuredProgramDir)
            ? TWXProxy.Core.SharedPaths.ResolveProgramDir()
            : _configuredProgramDir;

    private static string BuildLegacyAppDataDir()
    {
        if (OperatingSystem.IsMacOS())
        {
            string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(home, "Library", "Application Support", "twxproxy");
        }

        if (OperatingSystem.IsWindows())
        {
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(localAppData, "twxproxy");
        }

        string xdgData = Environment.GetEnvironmentVariable("XDG_DATA_HOME")
            ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "share");
        return Path.Combine(xdgData, "twxproxy");
    }
}
