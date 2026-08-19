using System;
using System.IO;
using Core = TWXProxy.Core;

namespace MTC;

/// <summary>
/// Resolves filesystem paths for MTC. User-visible data is shared under the
/// same ~/Library/twxproxy tree used by the standalone proxy.
/// </summary>
public static class AppPaths
{
    private static readonly string _legacyLocalAppDataDir = BuildLegacyLocalAppDataDir();
    private static string _configuredProgramDir = Core.SharedPaths.TryGetStoredProgramDir()
        ?? Core.SharedPaths.GetDefaultProgramDir();

    /// <summary>Legacy/bootstrap app-data root retained only for migration paths.</summary>
    public static string AppDataDir => Core.SharedPaths.AppDataDir;

    public static string ProgramDir => GetEffectiveProgramDir();

    /// <summary>Directory where game JSON files and databases are stored.</summary>
    public static string DatabaseDir => Path.Combine(ProgramDir, "games");

    /// <summary>Legacy pre-3.0 MTC-only database directory used for one-time migration.</summary>
    public static string LegacyDatabaseDir => Path.Combine(_legacyLocalAppDataDir, "databases");

    /// <summary>Directory where session/capture logs are stored for the active TWX program directory.</summary>
    public static string LogDir => GetDebugLogDir();

    /// <summary>Directory where MTC debug logs are stored for the active TWX program directory.</summary>
    public static string DebugLogDir => Path.Combine(GetEffectiveProgramDir(), "logs");

    /// <summary>Path to the MTC debug log file for the active TWX program directory.</summary>
    public static string DebugLogPath => GetDebugLogPath();

    /// <summary>Path to the dedicated port/native haggle debug log.</summary>
    public static string PortHaggleDebugLogPath => Path.Combine(DebugLogDir, "mtc_haggle_debug.log");

    /// <summary>Path to the dedicated planet negotiation debug log.</summary>
    public static string PlanetHaggleDebugLogPath => Path.Combine(DebugLogDir, "mtc_neg_debug.log");

    /// <summary>Directory where MTC-only expansion modules can be placed.</summary>
    public static string ModulesDir => Path.Combine(ProgramDir, "modules");

    /// <summary>Directory where expansion modules persist state.</summary>
    public static string ModuleDataDir => Core.SharedPaths.GetModuleDataRootDir(ProgramDir);

    public static string TwxproxyDatabaseDir => DatabaseDir;

    /// <summary>Directory where shared expansion modules can be placed for both MTC and TWXP.</summary>
    public static string SharedModulesDir => Core.SharedPaths.ModulesDir;

    /// <summary>Returns the .xdb path for a given game name.</summary>
    public static string DatabasePathForGame(string gameName)
    {
        string safe = string.Concat(gameName.Split(Path.GetInvalidFileNameChars()));
        if (string.IsNullOrWhiteSpace(safe)) safe = "game";
        return Path.Combine(DatabaseDir, safe + ".xdb");
    }

    /// <summary>Returns the MTC standalone .xdb path for a given game name.</summary>
    public static string MtcStandaloneDatabasePathForGame(string gameName)
    {
        string safe = Core.SharedPaths.SanitizeFileComponent(gameName);
        return Path.Combine(DatabaseDir, safe + "_mtc.xdb");
    }

    public static string LegacyDatabasePathForGame(string gameName)
    {
        string safe = string.Concat(gameName.Split(Path.GetInvalidFileNameChars()));
        if (string.IsNullOrWhiteSpace(safe)) safe = "game";
        return Path.Combine(LegacyDatabaseDir, safe + ".xdb");
    }

    /// <summary>Returns the shared TWX Proxy .xdb path for a given game name.</summary>
    public static string TwxproxyDatabasePathForGame(string gameName)
        => DatabasePathForGame(gameName);

    /// <summary>Ensure required directories exist.</summary>
    public static void EnsureDirectories()
    {
        Directory.CreateDirectory(ProgramDir);
        Directory.CreateDirectory(DatabaseDir);
        Directory.CreateDirectory(LogDir);
        Directory.CreateDirectory(TwxproxyGamesDir);
        Directory.CreateDirectory(ModulesDir);
        Directory.CreateDirectory(ModuleDataDir);
    }

    public static void EnsureTwxproxyDatabaseDir()
    {
        Directory.CreateDirectory(TwxproxyDatabaseDir);
    }

    public static void EnsureSharedModulesDir()
    {
        Core.SharedPaths.EnsureModuleDir();
    }

    /// <summary>Directory where shared game JSON files live for the configured TWX program folder.</summary>
    public static string TwxproxyGamesDir => Path.Combine(ProgramDir, "games");

    /// <summary>Returns the path to the shared TWXP game config JSON for a given game name.</summary>
    public static string TwxproxyGameConfigFileFor(string gameName)
        => Path.Combine(TwxproxyGamesDir, Core.SharedPaths.SanitizeFileComponent(gameName) + ".json");

    /// <summary>Returns the path to the MTC standalone game config JSON for a given game name.</summary>
    public static string MtcStandaloneGameConfigFileFor(string gameName)
        => Path.Combine(TwxproxyGamesDir, Core.SharedPaths.SanitizeFileComponent(gameName) + "_mtc.json");

    public static string GameDataDirForGame(string gameName)
        => Core.SharedPaths.GameDataDirForGame(gameName, ProgramDir);

    public static string GameVariablesFileFor(string gameName)
        => Core.SharedPaths.GameVariablesPathForGame(gameName, ProgramDir);

    /// <summary>Returns the per-game notes file path under the shared TWX program directory.</summary>
    public static string NotesPathForGame(string gameName)
        => Path.Combine(GameDataDirForGame(gameName), "notes.txt");

    public static string ConfigFilePath => Core.SharedPaths.ConfigFilePath;

    /// <summary>Ensure the shared twxproxy games directory exists.</summary>
    public static void EnsureTwxproxyGamesDir() => Directory.CreateDirectory(TwxproxyGamesDir);

    public static void SetConfiguredProgramDir(string? programDirectory)
    {
        if (string.IsNullOrWhiteSpace(programDirectory))
            return;

        _configuredProgramDir = Path.GetFullPath(programDirectory)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        Core.GlobalModules.ProgramDir = _configuredProgramDir;
    }

    public static string GetEffectiveProgramDir(string? scriptDirectory = null)
    {
        if (!string.IsNullOrWhiteSpace(_configuredProgramDir))
            return _configuredProgramDir;

        return Core.SharedPaths.ResolveProgramDir(scriptDirectory);
    }

    public static string GetDebugLogDir(string? scriptDirectory = null)
        => Path.Combine(GetEffectiveProgramDir(scriptDirectory), "logs");

    public static string GetDebugLogPath(string? scriptDirectory = null)
        => GetDebugLogPathForGame(null, scriptDirectory);

    public static string GetDebugLogPathForGame(string? gameName, string? scriptDirectory = null)
        => Path.Combine(
            GetDebugLogDir(scriptDirectory),
            $"{SanitizeLogIdentity(gameName)}_debug.log");

    public static string GetPortHaggleDebugLogPath(string? scriptDirectory = null)
        => Path.Combine(GetDebugLogDir(scriptDirectory), "mtc_haggle_debug.log");

    public static string GetPlanetHaggleDebugLogPath(string? scriptDirectory = null)
        => Path.Combine(GetDebugLogDir(scriptDirectory), "mtc_neg_debug.log");

    public static string GetDatabaseCorrectionLogPath(string? scriptDirectory = null)
        => GetDatabaseCorrectionLogPathForGame(null, scriptDirectory);

    public static string GetDatabaseCorrectionLogPathForGame(string? gameName, string? scriptDirectory = null)
        => Path.Combine(
            GetDebugLogDir(scriptDirectory),
            $"{SanitizeLogIdentity(gameName)}_db_errors.log");

    public static void EnsureDebugLogDir(string? scriptDirectory = null)
        => Directory.CreateDirectory(GetDebugLogDir(scriptDirectory));

    public static void ResetStartupDebugLogs(string? scriptDirectory = null)
    {
        // Multiple MTC instances can share a program directory. Deleting every
        // *_debug.log here can unlink another running game's active log file.
        EnsureDebugLogDir(scriptDirectory);
    }

    private static string SanitizeLogIdentity(string? gameName)
    {
        string resolved = string.IsNullOrWhiteSpace(gameName) ? "mtc" : gameName;
        return Core.SharedPaths.SanitizeFileComponent(resolved);
    }

    private static string BuildLegacyLocalAppDataDir()
    {
        if (OperatingSystem.IsMacOS() || OperatingSystem.IsMacCatalyst())
        {
            string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(home, "Library", "MTC");
        }

        if (OperatingSystem.IsWindows())
        {
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(localAppData, "MTC");
        }

        string xdgData = Environment.GetEnvironmentVariable("XDG_DATA_HOME")
            ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "share");
        return Path.Combine(xdgData, "mtc");
    }
}
