using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Avalonia;
using Avalonia.Platform;
using Avalonia.Platform.Storage;
using SkiaSharp;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    // ── Connection profile helpers ──────────────────────────────────────────

    /// <summary>Builds a <see cref="ConnectionProfile"/> from the current live state.</summary>
    private ConnectionProfile BuildProfileFromState() => new ConnectionProfile
    {
        Name            = DeriveGameName(),
        // Connection
        Server          = _state.Host,
        Port            = _state.Port,
        Protocol        = _state.Protocol,
        LocalTwxProxy   = _state.LocalTwxProxy,
        TwxProxyDbPath  = _state.TwxProxyDbPath,
        RemoteProxyServerId = _state.RemoteProxyServerId,
        RemoteProxyGameId = _state.RemoteProxyGameId,
        EmbeddedProxy   = _state.EmbeddedProxy,
        Sectors         = _state.Sectors,
        AutoReconnect   = _state.AutoReconnect,
        ListenForConnections = _state.ListenForConnections,
        ListenPort      = NormalizeListenPort(_state.ListenPort),
        UseLogin        = _state.UseLogin,
        UseRLogin       = _state.UseRLogin,
        LoginScript     = string.IsNullOrWhiteSpace(_state.LoginScript) ? "0_Login.cts" : _state.LoginScript,
        LoginName       = _state.LoginName,
        Password        = _state.Password,
        GameLetter      = _state.GameLetter,
        LoginSettingsConfigured = _state.EmbeddedProxy,
        ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines),
        // Trader
        TraderName      = _state.TraderName,
        Sector          = _state.Sector,
        Turns           = _state.Turns,
        Experience      = _state.Experience,
        Alignment       = _state.Alignment,
        Credits         = _state.Credits,
        Corp            = _state.Corp,
        // Ship
        ShipName        = _state.ShipName,
        HoldsTotal      = _state.HoldsTotal,
        FuelOre         = _state.FuelOre,
        Organics        = _state.Organics,
        Equipment       = _state.Equipment,
        Colonists       = _state.Colonists,
        HoldsEmpty      = _state.HoldsEmpty,
        Fighters        = _state.Fighters,
        Shields         = _state.Shields,
        TurnsPerWarp    = _state.TurnsPerWarp,
        // Combat
        Etheral         = _state.Etheral,
        Beacon          = _state.Beacon,
        Disruptor       = _state.Disruptor,
        Photon          = _state.Photon,
        Armor           = _state.Armor,
        Limpet          = _state.Limpet,
        Genesis         = _state.Genesis,
        Atomic          = _state.Atomic,
        Corbomite       = _state.Corbomite,
        Cloak           = _state.Cloak,
        HasTranswarpDrive1 = _state.HasTranswarpDrive1,
        HasTranswarpDrive2 = _state.HasTranswarpDrive2,
        TranswarpDrive1 = _state.TranswarpDrive1,
        TranswarpDrive2 = _state.TranswarpDrive2,
        ScannerD        = _state.ScannerD,
        ScannerH        = _state.ScannerH,
        ScannerP        = _state.ScannerP,
        EditId          = _embeddedGameConfig?.Mtc?.EditId ?? string.Empty,
    };

    private ConnectionProfile BuildProfileFromConfig(EmbeddedGameConfig config)
    {
        EmbeddedMtcConfig mtc = config.Mtc ?? new EmbeddedMtcConfig();
        EmbeddedMtcState state = mtc.State ?? new EmbeddedMtcState();
        return new ConnectionProfile
        {
            Name = string.IsNullOrWhiteSpace(config.Name) ? DeriveGameName() : config.Name,
            Server = config.Host,
            Port = config.Port,
            Protocol = Enum.TryParse<TwProtocol>(mtc.Protocol, true, out TwProtocol protocol)
                ? protocol
                : TwProtocol.Telnet,
            LocalTwxProxy = mtc.LocalTwxProxy,
            TwxProxyDbPath = mtc.TwxProxyDbPath,
            RemoteProxyServerId = mtc.RemoteProxyServerId,
            RemoteProxyGameId = mtc.RemoteProxyGameId,
            EmbeddedProxy = mtc.EmbeddedProxy,
            Sectors = config.Sectors,
            AutoReconnect = config.AutoReconnect,
            ListenForConnections = mtc.ListenForConnections,
            ListenPort = NormalizeListenPort(config.ListenPort),
            UseLogin = config.UseLogin,
            UseRLogin = config.UseRLogin,
            LoginScript = string.IsNullOrWhiteSpace(config.LoginScript) ? "0_Login.cts" : config.LoginScript,
            LoginName = config.LoginName,
            Password = config.Password,
            GameLetter = config.GameLetter,
            EditId = mtc.EditId,
            LoginSettingsConfigured = mtc.EmbeddedProxy,
            ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines),
            TraderName = state.TraderName,
            Sector = state.Sector,
            Turns = state.Turns,
            Experience = state.Experience,
            Alignment = string.IsNullOrWhiteSpace(state.Alignment) ? "0" : state.Alignment,
            Credits = state.Credits,
            Corp = state.Corp,
            ShipName = string.IsNullOrWhiteSpace(state.ShipName) ? "-" : state.ShipName,
            HoldsTotal = state.HoldsTotal,
            FuelOre = state.FuelOre,
            Organics = state.Organics,
            Equipment = state.Equipment,
            Colonists = state.Colonists,
            HoldsEmpty = state.HoldsEmpty,
            Fighters = state.Fighters,
            Shields = state.Shields,
            TurnsPerWarp = state.TurnsPerWarp,
            Etheral = state.Etheral,
            Beacon = state.Beacon,
            Disruptor = state.Disruptor,
            Photon = state.Photon,
            Armor = state.Armor,
            Limpet = state.Limpet,
            Genesis = state.Genesis,
            Atomic = state.Atomic,
            Corbomite = state.Corbomite,
            Cloak = state.Cloak,
            HasTranswarpDrive1 = state.HasTranswarpDrive1 || state.TranswarpDrive1 > 0,
            HasTranswarpDrive2 = state.HasTranswarpDrive2 || state.TranswarpDrive2 > 0,
            TranswarpDrive1 = state.TranswarpDrive1,
            TranswarpDrive2 = state.TranswarpDrive2,
            ScannerD = NormalizeDensityScanner(state.ScannerD, state.ScannerH),
            ScannerH = state.ScannerH,
            ScannerP = state.ScannerP,
        };
    }

    private EmbeddedMtcState BuildEmbeddedMtcState()
    {
        return new EmbeddedMtcState
        {
            TraderName = _state.TraderName,
            Sector = _state.Sector,
            Turns = _state.Turns,
            Experience = _state.Experience,
            Alignment = _state.Alignment,
            Credits = _state.Credits,
            Corp = _state.Corp,
            ShipName = _state.ShipName,
            HoldsTotal = _state.HoldsTotal,
            FuelOre = _state.FuelOre,
            Organics = _state.Organics,
            Equipment = _state.Equipment,
            Colonists = _state.Colonists,
            HoldsEmpty = _state.HoldsEmpty,
            Fighters = _state.Fighters,
            Shields = _state.Shields,
            TurnsPerWarp = _state.TurnsPerWarp,
            Etheral = _state.Etheral,
            Beacon = _state.Beacon,
            Disruptor = _state.Disruptor,
            Photon = _state.Photon,
            Armor = _state.Armor,
            Limpet = _state.Limpet,
            Genesis = _state.Genesis,
            Atomic = _state.Atomic,
            Corbomite = _state.Corbomite,
            Cloak = _state.Cloak,
            HasTranswarpDrive1 = _state.HasTranswarpDrive1,
            HasTranswarpDrive2 = _state.HasTranswarpDrive2,
            TranswarpDrive1 = _state.TranswarpDrive1,
            TranswarpDrive2 = _state.TranswarpDrive2,
            ScannerD = NormalizeDensityScanner(_state.ScannerD, _state.ScannerH),
            ScannerH = _state.ScannerH,
            ScannerP = _state.ScannerP,
        };
    }

    private Core.ShipStatus BuildShipStatusSeedFromCurrentState()
    {
        string lrsType = _state.ScannerH
            ? "Holo"
            : (_state.ScannerD ? "Density" : string.Empty);

        return new Core.ShipStatus
        {
            TraderName = _state.TraderName ?? string.Empty,
            Experience = _state.Experience,
            Alignment = long.TryParse((_state.Alignment ?? string.Empty).Replace(",", string.Empty, StringComparison.Ordinal), out long alignment)
                ? alignment
                : 0L,
            Corp = _state.Corp,
            ShipName = _state.ShipName ?? string.Empty,
            ShipType = _currentShipType ?? string.Empty,
            ShipClass = _currentShipClass ?? string.Empty,
            CurrentSector = _state.Sector,
            Turns = _state.Turns,
            TurnsPerWarp = _state.TurnsPerWarp,
            TotalHolds = _state.HoldsTotal,
            FuelOre = _state.FuelOre,
            Organics = _state.Organics,
            Equipment = _state.Equipment,
            Colonists = _state.Colonists,
            HoldsEmpty = _state.HoldsEmpty,
            Fighters = _state.Fighters,
            Shields = _state.Shields,
            Photons = _state.Photon,
            ArmidMines = _state.Armor,
            LimpetMines = _state.Limpet,
            GenesisTorps = _state.Genesis,
            AtomicDet = _state.Atomic,
            Corbomite = _state.Corbomite,
            Cloaks = _state.Cloak,
            Beacons = _state.Beacon,
            EtherProbes = _state.Etheral,
            MineDisruptors = _state.Disruptor,
            PlanetScanner = _state.ScannerP,
            LRSType = lrsType,
            HasTransWarp1 = _state.HasTranswarpDrive1,
            HasTransWarp2 = _state.HasTranswarpDrive2,
            TransWarp1 = _state.TranswarpDrive1,
            TransWarp2 = _state.TranswarpDrive2,
            Credits = _state.Credits
        };
    }

    private string ResolveGlobalPortHaggleMode() => Core.NativeHaggleModes.Normalize(_appPrefs.PortHaggleMode);

    private string ResolveGlobalPlanetHaggleMode()
    {
        if (string.IsNullOrWhiteSpace(_appPrefs.PlanetHaggleMode))
            return Core.NativeHaggleModes.DefaultPlanet;

        string normalized = Core.NativeHaggleModes.Normalize(_appPrefs.PlanetHaggleMode);
        return string.IsNullOrWhiteSpace(normalized) ? Core.NativeHaggleModes.DefaultPlanet : normalized;
    }

    private static string NormalizeScriptDirectoryValue(string? scriptDirectory)
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
            // Keep the original text if it cannot be normalized yet.
        }

        return trimmed.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    }

    private string GetConfiguredScriptsDirectoryValue()
        => NormalizeScriptDirectoryValue(_appPrefs.ScriptsDirectory);

    private string? ResolvePersistedGameScriptDirectory(string? existingGameScriptDirectory)
    {
        if (!string.IsNullOrWhiteSpace(GetConfiguredScriptsDirectoryValue()))
            return null;

        string normalizedExisting = NormalizeScriptDirectoryValue(existingGameScriptDirectory);
        return string.IsNullOrWhiteSpace(normalizedExisting) ? null : normalizedExisting;
    }

    private string ResolveEffectiveScriptDirectory(string? gameScriptDirectory = null)
    {
        string configuredScriptsDirectory = GetConfiguredScriptsDirectoryValue();
        if (!string.IsNullOrWhiteSpace(configuredScriptsDirectory))
            return configuredScriptsDirectory;

        string normalizedGameScriptDirectory = NormalizeScriptDirectoryValue(gameScriptDirectory);
        if (!string.IsNullOrWhiteSpace(normalizedGameScriptDirectory))
            return normalizedGameScriptDirectory;

        return NormalizeScriptDirectoryValue(
            OperatingSystem.IsWindows()
                ? Path.Combine(AppPaths.ProgramDir, "scripts")
                : Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments));
    }

    private bool ClearGameConfigScriptDirectory(EmbeddedGameConfig config)
    {
        if (string.IsNullOrWhiteSpace(config.ScriptDirectory))
        {
            return false;
        }

        config.ScriptDirectory = null;
        return true;
    }

    private async Task ClearScriptDirectoryFromAllGameConfigsAsync()
    {
        if (string.IsNullOrWhiteSpace(GetConfiguredScriptsDirectoryValue()))
            return;

        if (_embeddedGameConfig != null)
            ClearGameConfigScriptDirectory(_embeddedGameConfig);

        AppPaths.EnsureTwxproxyGamesDir();
        foreach (string path in Directory.EnumerateFiles(AppPaths.TwxproxyGamesDir, "*.json"))
        {
            EmbeddedGameConfig? config = await TryLoadGameConfigAsync(path);
            if (config == null || !ClearGameConfigScriptDirectory(config))
                continue;

            await SaveEmbeddedGameConfigAsync(NormalizeGameName(config.Name), config);
        }
    }

    private void RefreshRuntimeScriptDirectoryFromPreferences()
    {
        Core.ModInterpreter? interpreter = CurrentInterpreter;
        if (interpreter != null)
        {
            interpreter.ScriptDirectory = ResolveEffectiveScriptDirectory(_embeddedGameConfig?.ScriptDirectory);
            interpreter.ProgramDir = GetEffectiveProxyProgramDir(interpreter.ScriptDirectory);
        }
    }

    private EmbeddedGameConfig BuildEmbeddedGameConfigFromState(string gameName, EmbeddedGameConfig? existing = null)
    {
        EmbeddedGameConfig config = existing ?? new EmbeddedGameConfig();
        config.Name = gameName;
        config.Host = _state.Host;
        config.Port = _state.Port;
        config.Sectors = _state.Sectors;
        config.ListenPort = NormalizeListenPort(_state.ListenPort);
        config.DatabasePath = string.IsNullOrWhiteSpace(config.DatabasePath)
            ? DatabasePathForMode(gameName, _state.EmbeddedProxy)
            : config.DatabasePath;
        config.ScriptDirectory = ResolvePersistedGameScriptDirectory(config.ScriptDirectory);
        config.NativeHaggleMode = null;
        config.AutoReconnect = _state.AutoReconnect;
        config.Mtc ??= new EmbeddedMtcConfig();
        config.Mtc.Protocol = _state.Protocol.ToString();
        config.Mtc.LocalTwxProxy = _state.LocalTwxProxy;
        config.Mtc.TwxProxyDbPath = _state.TwxProxyDbPath;
        config.Mtc.RemoteProxyServerId = _state.RemoteProxyServerId;
        config.Mtc.RemoteProxyGameId = _state.RemoteProxyGameId;
        config.Mtc.EmbeddedProxy = _state.EmbeddedProxy;
        config.Mtc.EditId = config.Mtc.EditId ?? string.Empty;
        config.Mtc.ListenForConnections = _state.ListenForConnections;
        config.Mtc.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines);
        config.Mtc.State = BuildEmbeddedMtcState();
        config.Variables = NormalizeEmbeddedVariables(config.Variables);
        return config;
    }

    private void ApplyEmbeddedConnectionState(string gameName, EmbeddedGameConfig config)
    {
        _state.GameName = NormalizeGameName(string.IsNullOrWhiteSpace(config.Name) ? gameName : config.Name);
        _state.Host = config.Host;
        _state.Port = config.Port;
        _state.Sectors = config.Sectors;
        _state.ListenPort = NormalizeListenPort(config.ListenPort);
        _state.AutoReconnect = config.AutoReconnect;
        _state.UseLogin = config.UseLogin;
        _state.UseRLogin = config.UseRLogin;
        _state.LoginScript = string.IsNullOrWhiteSpace(config.LoginScript) ? "0_Login.cts" : config.LoginScript;
        _state.LoginName = config.LoginName;
        _state.Password = config.Password;
        _state.GameLetter = string.IsNullOrWhiteSpace(config.GameLetter)
            ? string.Empty
            : config.GameLetter.Trim().Substring(0, 1).ToUpperInvariant();
        _state.EmbeddedProxy = config.Mtc?.EmbeddedProxy ?? _state.EmbeddedProxy;
        _state.ListenForConnections = config.Mtc?.ListenForConnections ?? false;
        _state.LocalTwxProxy = config.Mtc?.LocalTwxProxy ?? _state.LocalTwxProxy;
        _state.TwxProxyDbPath = config.Mtc?.TwxProxyDbPath ?? _state.TwxProxyDbPath;
        _state.RemoteProxyServerId = config.Mtc?.RemoteProxyServerId ?? string.Empty;
        _state.RemoteProxyGameId = config.Mtc?.RemoteProxyGameId ?? string.Empty;
        _state.Protocol = Enum.TryParse<TwProtocol>(config.Mtc?.Protocol, true, out TwProtocol protocol)
            ? protocol
            : TwProtocol.Telnet;

        _buffer.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines);
    }

    private static EmbeddedMtcState BuildEmbeddedMtcState(ConnectionProfile profile)
    {
        return new EmbeddedMtcState
        {
            TraderName = profile.TraderName,
            Sector = profile.Sector,
            Turns = profile.Turns,
            Experience = profile.Experience,
            Alignment = profile.Alignment,
            Credits = profile.Credits,
            Corp = profile.Corp,
            ShipName = profile.ShipName,
            HoldsTotal = profile.HoldsTotal,
            FuelOre = profile.FuelOre,
            Organics = profile.Organics,
            Equipment = profile.Equipment,
            Colonists = profile.Colonists,
            HoldsEmpty = profile.HoldsEmpty,
            Fighters = profile.Fighters,
            Shields = profile.Shields,
            TurnsPerWarp = profile.TurnsPerWarp,
            Etheral = profile.Etheral,
            Beacon = profile.Beacon,
            Disruptor = profile.Disruptor,
            Photon = profile.Photon,
            Armor = profile.Armor,
            Limpet = profile.Limpet,
            Genesis = profile.Genesis,
            Atomic = profile.Atomic,
            Corbomite = profile.Corbomite,
            Cloak = profile.Cloak,
            HasTranswarpDrive1 = profile.HasTranswarpDrive1 || profile.TranswarpDrive1 > 0,
            HasTranswarpDrive2 = profile.HasTranswarpDrive2 || profile.TranswarpDrive2 > 0,
            TranswarpDrive1 = profile.TranswarpDrive1,
            TranswarpDrive2 = profile.TranswarpDrive2,
            ScannerD = NormalizeDensityScanner(profile.ScannerD, profile.ScannerH),
            ScannerH = profile.ScannerH,
            ScannerP = profile.ScannerP,
        };
    }

    private EmbeddedGameConfig BuildEmbeddedGameConfigFromProfile(
        ConnectionProfile profile,
        string databasePath,
        EmbeddedGameConfig? existing = null)
    {
        EmbeddedGameConfig config = existing ?? new EmbeddedGameConfig();
        config.Name = NormalizeGameName(profile.Name);
        config.Host = profile.Server;
        config.Port = profile.Port;
        config.Sectors = profile.Sectors;
        config.ListenPort = NormalizeListenPort(profile.ListenPort);
        config.DatabasePath = databasePath;
        config.ScriptDirectory = ResolvePersistedGameScriptDirectory(config.ScriptDirectory);
        config.NativeHaggleMode = null;
        config.AutoReconnect = profile.AutoReconnect;
        config.UseLogin = profile.UseLogin;
        config.UseRLogin = profile.UseRLogin;
        config.LoginScript = string.IsNullOrWhiteSpace(profile.LoginScript) ? "0_Login.cts" : profile.LoginScript;
        config.LoginName = profile.LoginName;
        config.Password = profile.Password;
        config.GameLetter = profile.GameLetter;
        config.Mtc ??= new EmbeddedMtcConfig();
        config.Mtc.Protocol = profile.Protocol.ToString();
        config.Mtc.LocalTwxProxy = profile.LocalTwxProxy;
        config.Mtc.TwxProxyDbPath = profile.TwxProxyDbPath;
        config.Mtc.RemoteProxyServerId = profile.RemoteProxyServerId;
        config.Mtc.RemoteProxyGameId = profile.RemoteProxyGameId;
        config.Mtc.EmbeddedProxy = profile.EmbeddedProxy;
        config.Mtc.EditId = profile.EditId ?? string.Empty;
        config.Mtc.ListenForConnections = profile.ListenForConnections;
        config.Mtc.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines);
        config.Mtc.State = BuildEmbeddedMtcState(profile);
        config.Variables = NormalizeEmbeddedVariables(config.Variables);
        return config;
    }

    private static Dictionary<string, string> NormalizeEmbeddedVariables(IDictionary<string, string>? source)
        => GameConfigService.NormalizeVariables(source);

    private static string NormalizeGameName(string? value)
        => GameConfigService.NormalizeGameName(value);

    private static bool IsGeneratedPlaceholderGameName(string? value)
    {
        string name = string.Concat((value ?? string.Empty).Split(Path.GetInvalidFileNameChars())).Trim();
        return Regex.IsMatch(name, "^_[0-9]+$", RegexOptions.CultureInvariant);
    }

    private static bool IsGeneratedPlaceholderRecentPath(string? path)
        => IsGeneratedPlaceholderGameName(Path.GetFileNameWithoutExtension(path ?? string.Empty));

    private static int NormalizeListenPort(int port)
        => port is >= 1 and <= ushort.MaxValue
            ? port
            : ConnectionProfile.DefaultListenPort;

    private static string GameConfigPathForMode(string gameName, bool embeddedProxy)
        => GameConfigService.GameConfigPathForMode(gameName, embeddedProxy);

    private static string DatabasePathForMode(string gameName, bool embeddedProxy)
        => GameConfigService.DatabasePathForMode(gameName, embeddedProxy);

    private static string GameConfigPathForConfig(EmbeddedGameConfig config)
        => GameConfigService.GameConfigPathForConfig(config);

    private bool GameNameConflicts(string gameName, bool embeddedProxy, string? currentConfigPath = null, string? currentDatabasePath = null)
        => GameConfigService.HasGameNameConflict(gameName, embeddedProxy, currentConfigPath, currentDatabasePath);

    /// <summary>Applies a profile to GameState and the terminal buffer.</summary>
    private void ApplyProfile(ConnectionProfile p)
    {
        if (!CanCurrentMtcTabAdoptGameIdentity(p.Name, "profile"))
            return;

        if (p.EmbeddedProxy && !HasExplicitEmbeddedLoginSettings(p))
        {
            var sharedConfig = TryLoadEmbeddedGameConfigForGame(GetEmbeddedGameName(p));
            if (sharedConfig != null)
            {
                p.UseLogin = sharedConfig.UseLogin;
                p.UseRLogin = sharedConfig.UseRLogin;
                p.LoginScript = sharedConfig.LoginScript;
                p.LoginName = sharedConfig.LoginName;
                p.Password = sharedConfig.Password;
                p.GameLetter = sharedConfig.GameLetter;
            }
        }

        if (_gameInstance == null &&
            !_telnet.IsConnected &&
            _embeddedGameConfig != null)
        {
            LoadOfflineCurrentGameVars(ResolveCurrentMtcTabContext()?.RuntimeContext ?? ActiveMtcRuntimeContext, _embeddedGameConfig);
        }

        // Connection
        _state.GameName       = NormalizeGameName(p.Name);
        _state.Host           = p.Server;
        _state.Port           = p.Port;
        _state.Protocol       = p.Protocol;
        _state.LocalTwxProxy  = p.LocalTwxProxy;
        _state.TwxProxyDbPath = p.TwxProxyDbPath;
        _state.RemoteProxyServerId = p.RemoteProxyServerId;
        _state.RemoteProxyGameId = p.RemoteProxyGameId;
        _state.EmbeddedProxy   = p.EmbeddedProxy;
        _state.Sectors         = p.Sectors;
        _state.AutoReconnect   = p.AutoReconnect;
        _state.ListenForConnections = p.ListenForConnections;
        _state.ListenPort      = NormalizeListenPort(p.ListenPort);
        _state.UseLogin        = p.UseLogin;
        _state.UseRLogin       = p.UseRLogin;
        _state.LoginScript     = string.IsNullOrWhiteSpace(p.LoginScript) ? "0_Login.cts" : p.LoginScript;
        _state.LoginName       = p.LoginName;
        _state.Password        = p.Password;
        _state.GameLetter      = string.IsNullOrWhiteSpace(p.GameLetter)
            ? string.Empty
            : p.GameLetter.Trim().Substring(0, 1).ToUpperInvariant();
        _buffer.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines);
        // Trader
        _state.TraderName     = p.TraderName;
        _state.Sector         = p.Sector;
        _state.Turns          = p.Turns;
        _state.Experience     = p.Experience;
        _state.Alignment      = p.Alignment;
        _state.Credits        = p.Credits;
        _state.Corp           = p.Corp;
        // Ship
        _state.ShipName       = string.IsNullOrEmpty(p.ShipName) ? "-" : p.ShipName;
        _currentShipType      = string.Empty;
        _currentShipClass     = string.Empty;
        _currentComputerShipType = string.Empty;
        _awaitingComputerShipTypeLine = false;
        ClearOnlinePlayers();
        _state.HoldsTotal     = p.HoldsTotal;
        _state.FuelOre        = p.FuelOre;
        _state.Organics       = p.Organics;
        _state.Equipment      = p.Equipment;
        _state.Colonists      = p.Colonists;
        _state.HoldsEmpty     = p.HoldsEmpty;
        _state.Fighters       = p.Fighters;
        _state.Shields        = p.Shields;
        _state.TurnsPerWarp   = p.TurnsPerWarp;
        // Combat
        _state.Etheral        = p.Etheral;
        _state.Beacon         = p.Beacon;
        _state.Disruptor      = p.Disruptor;
        _state.Photon         = p.Photon;
        _state.Armor          = p.Armor;
        _state.Limpet         = p.Limpet;
        _state.Genesis        = p.Genesis;
        _state.Atomic         = p.Atomic;
        _state.Corbomite      = p.Corbomite;
        _state.Cloak          = p.Cloak;
        _state.HasTranswarpDrive1 = p.HasTranswarpDrive1 || p.TranswarpDrive1 > 0;
        _state.HasTranswarpDrive2 = p.HasTranswarpDrive2 || p.TranswarpDrive2 > 0;
        _state.TranswarpDrive1 = p.TranswarpDrive1;
        _state.TranswarpDrive2 = p.TranswarpDrive2;
        _state.ScannerD       = NormalizeDensityScanner(p.ScannerD, p.ScannerH);
        _state.ScannerH       = p.ScannerH;
        _state.ScannerP       = p.ScannerP;
        SyncMombotRuntimeConfigFromTwxpCfg();
        _mombot.ApplyConfig(_embeddedGameConfig != null ? GetOrCreateEmbeddedMombotConfig(_embeddedGameConfig) : null);
        UpdateWindowTitle();
        RefreshStatusBar();
        _state.NotifyChanged();
    }

    private static void LoadOfflineCurrentGameVars(Core.TwxRuntimeContext? runtimeContext, EmbeddedGameConfig config)
    {
        config.Variables = NormalizeEmbeddedVariables(config.Variables);
        NormalizeEmbeddedMombotConfig(config);

        var varsToLoad = new Dictionary<string, string>(config.Variables, StringComparer.OrdinalIgnoreCase);
        varsToLoad.Remove("$gfile_chk");
        varsToLoad.Remove("$doRelog");
        ApplySessionStartupVarDefaults(varsToLoad);

        Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
        Core.ScriptRef.LoadVarsForGame(runtimeContext, varsToLoad);
    }

    private static void ApplySessionStartupVarDefaults(IDictionary<string, string> vars)
    {
        vars["$BOT~REDALERT"] = "FALSE";
        vars["$BOT~redalert"] = "FALSE";
        vars["$bot~redalert"] = "FALSE";
        vars["$redalert"] = "FALSE";
    }

    private static EmbeddedGameConfig NormalizeEmbeddedMombotConfig(EmbeddedGameConfig config)
        => GameConfigService.NormalizeMombotConfig(config);

    private static EmbeddedMtcDebugConfig GetOrCreateEmbeddedDebugConfig(EmbeddedGameConfig config)
    {
        config.Mtc ??= new EmbeddedMtcConfig();
        config.Mtc.Debug ??= new EmbeddedMtcDebugConfig();
        return config.Mtc.Debug;
    }

    private EmbeddedMtcDebugConfig GetCurrentDebugConfig()
    {
        if (_embeddedGameConfig != null)
            return GetOrCreateEmbeddedDebugConfig(_embeddedGameConfig);

        return new EmbeddedMtcDebugConfig();
    }

    private static MTC.mombot.mombotConfig GetOrCreateEmbeddedMombotConfig(EmbeddedGameConfig config)
        => GameConfigService.GetOrCreateMombotConfig(config);

    private void UpdateWindowTitle()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(UpdateWindowTitle, DispatcherPriority.Background);
            return;
        }

        var owner = ResolveCurrentMtcTabContext();
        string? gameName = null;
        if (!string.IsNullOrWhiteSpace(_embeddedGameName))
        {
            gameName = _embeddedGameName;
        }
        else if (!string.IsNullOrWhiteSpace(_state.GameName))
        {
            gameName = NormalizeGameName(_state.GameName);
        }
        else if (!string.IsNullOrWhiteSpace(_currentProfilePath))
        {
            gameName = Path.GetFileNameWithoutExtension(_currentProfilePath);
        }

        UpdateLiveMtcTabTitle(owner, gameName);

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (IsLiveMtcTabActive())
        {
            Title = string.IsNullOrWhiteSpace(gameName)
                ? BaseWindowTitle
                : $"{BaseWindowTitle} [{gameName}]";
        }
    }

    private static bool HasExplicitEmbeddedLoginSettings(ConnectionProfile profile)
    {
        return profile.LoginSettingsConfigured;
    }

    private string GetEmbeddedGameName(ConnectionProfile? profile = null)
    {
        if (!string.IsNullOrWhiteSpace(profile?.Name))
            return NormalizeGameName(profile.Name);
        if (!string.IsNullOrWhiteSpace(_state.GameName))
            return NormalizeGameName(_state.GameName);
        if (!string.IsNullOrEmpty(_currentProfilePath))
        {
            string pathGameName = Path.GetFileNameWithoutExtension(_currentProfilePath);
            if (!IsGeneratedPlaceholderGameName(pathGameName))
                return NormalizeGameName(pathGameName);
        }

        string? host = profile?.Server ?? _state.Host;
        if (string.IsNullOrWhiteSpace(host))
            return string.Empty;

        return NormalizeGameName($"{host}_{profile?.Port ?? _state.Port}");
    }

    private static EmbeddedGameConfig? TryLoadEmbeddedGameConfigForGame(string gameName)
        => GameConfigService.TryLoadSharedGameConfig(gameName);


    private async Task ConnectEmbeddedServerAsync()
    {
        if (_gameInstance != null && !_gameInstance.IsRunning)
        {
            await StopEmbeddedAsync();
            await DoConnectEmbeddedAsync();
        }

        if (_gameInstance == null || _gameInstance.IsConnected)
            return;

        try
        {
            await _gameInstance.SendToLocalAsync(System.Text.Encoding.ASCII.GetBytes($"\r\n{_gameInstance.ConnectingStatusText}\r\n"));
            await _gameInstance.ConnectToServerAsync();
            await _gameInstance.SendToLocalAsync(System.Text.Encoding.ASCII.GetBytes("Connected!\r\n"));
        }
        catch (Exception ex)
        {
            await _gameInstance.SendToLocalAsync(System.Text.Encoding.ASCII.GetBytes($"\r\nConnection failed: {ex.Message}\r\n"));
        }
    }

    /// <summary>
    /// Loads the shared TWXP game config JSON for <paramref name="gameName"/>.
    /// Creates and saves a new config (seeded from current state) if none exists yet.
    /// </summary>
    private async Task<EmbeddedGameConfig> LoadOrCreateEmbeddedGameConfigAsync(string gameName)
    {
        string path = AppPaths.TwxproxyGameConfigFileFor(gameName);
        if (File.Exists(path))
        {
            EmbeddedGameConfig? cfg = await GameConfigService.LoadConfigAsync(path);
            if (cfg != null)
                return NormalizeEmbeddedMombotConfig(cfg);
        }

        // First run — seed from current profile.
        var newCfg = new EmbeddedGameConfig
        {
            Name    = gameName,
            Host    = _state.Host,
            Port    = _state.Port,
            Sectors = _state.Sectors,
            DatabasePath = AppPaths.TwxproxyDatabasePathForGame(gameName),
            ScriptDirectory = null,
            NativeHaggleEnabled = true,
            NativeHaggleMode = null,
            UseLogin = false,
            UseRLogin = false,
            LoginScript = "0_Login.cts",
            LoginName = string.Empty,
            Password = string.Empty,
            GameLetter = string.Empty,
            mombot = new MTC.mombot.mombotConfig(),
            Mtc = new EmbeddedMtcConfig
            {
                Protocol = _state.Protocol.ToString(),
                LocalTwxProxy = _state.LocalTwxProxy,
                TwxProxyDbPath = _state.TwxProxyDbPath,
                EmbeddedProxy = _state.EmbeddedProxy,
                ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines),
                State = BuildEmbeddedMtcState(),
            },
        };
        NormalizeEmbeddedMombotConfig(newCfg);
        await SaveEmbeddedGameConfigAsync(gameName, newCfg);
        return newCfg;
    }

    /// <summary>Persists <paramref name="cfg"/> to the shared TWXP games directory.</summary>
    private static async Task SaveEmbeddedGameConfigAsync(string gameName, EmbeddedGameConfig cfg)
        => await GameConfigService.SaveConfigAsync(gameName, cfg);

    private async Task SaveCurrentGameConfigAsync()
    {
        string gameName = DeriveGameName();
        if (string.IsNullOrWhiteSpace(gameName))
            return;

        if (!CanCurrentMtcTabAdoptGameIdentity(gameName, "save-config"))
            return;

        EmbeddedGameConfig config = _embeddedGameConfig ?? (_state.EmbeddedProxy
            ? await LoadOrCreateEmbeddedGameConfigAsync(gameName)
            : BuildEmbeddedGameConfigFromState(gameName, new EmbeddedGameConfig
            {
                Name = gameName,
                Host = _state.Host,
                Port = _state.Port,
                Sectors = _state.Sectors,
                DatabasePath = AppPaths.MtcStandaloneDatabasePathForGame(gameName),
            }));
        config = BuildEmbeddedGameConfigFromState(gameName, config);
        if (string.IsNullOrWhiteSpace(config.DatabasePath))
            config.DatabasePath = DatabasePathForMode(gameName, _state.EmbeddedProxy);
        await SaveEmbeddedGameConfigAsync(gameName, config);
        _embeddedGameConfig = config;
        _embeddedGameName = gameName;
        _currentProfilePath ??= GameConfigPathForMode(gameName, _state.EmbeddedProxy);
    }

    private async Task OpenPathAsync(string path, bool addToRecent, bool allowReplaceConnectedTab = false)
    {
        string extension = Path.GetExtension(path);
        if (extension.Equals(".json", StringComparison.OrdinalIgnoreCase))
        {
            EmbeddedGameConfig? config = await TryLoadGameConfigAsync(path);
            if (config == null)
            {
                await ShowMessageAsync("Load Error", $"Could not read game config:\n{path}");
                return;
            }

            string modeConfigPath = GameConfigPathForConfig(config);
            if (string.Equals(Path.GetFullPath(path), Path.GetFullPath(modeConfigPath), StringComparison.OrdinalIgnoreCase))
            {
                await ApplyLoadedGameConfigAsync(config, path, addToRecent, allowReplaceConnectedTab);
                return;
            }

            ConnectionProfile importedProfile = BuildProfileFromConfig(config);
            ConnectionProfile? uniqueProfile = await EnsureUniqueProfileAsync(
                importedProfile,
                currentConfigPath: path,
                currentDatabasePath: config.DatabasePath);
            if (uniqueProfile == null)
                return;

            importedProfile = uniqueProfile;
            string gameName = importedProfile.Name;
            string importedDatabasePath = DatabasePathForMode(gameName, importedProfile.EmbeddedProxy);
            if (!string.IsNullOrWhiteSpace(config.DatabasePath) && File.Exists(config.DatabasePath))
            {
                if (!await ImportDatabaseIntoSharedStoreAsync(config.DatabasePath, gameName, importedProfile.EmbeddedProxy))
                    return;
            }

            EmbeddedGameConfig importedConfig = BuildEmbeddedGameConfigFromProfile(importedProfile, importedDatabasePath, config);
            importedConfig.Variables = NormalizeEmbeddedVariables(config.Variables);
            await SaveEmbeddedGameConfigAsync(gameName, importedConfig);
            await ApplyLoadedGameConfigAsync(importedConfig, GameConfigPathForMode(gameName, importedProfile.EmbeddedProxy), addToRecent, allowReplaceConnectedTab);
            return;
        }

        if (extension.Equals(".xdb", StringComparison.OrdinalIgnoreCase))
        {
            await ImportDatabaseAsGameAsync(path, addToRecent, allowReplaceConnectedTab);
            return;
        }

        if (extension.Equals(".mtc", StringComparison.OrdinalIgnoreCase))
        {
            ConnectionProfile legacy;
            try
            {
                legacy = ConnectionProfile.LoadXml(path);
            }
            catch (Exception ex)
            {
                await ShowMessageAsync("Load Error", ex.Message);
                return;
            }

            if (string.IsNullOrWhiteSpace(legacy.Name))
                legacy.Name = NormalizeGameName(Path.GetFileNameWithoutExtension(path));

            ConnectionProfile? uniqueLegacy = await EnsureUniqueProfileAsync(legacy);
            if (uniqueLegacy == null)
                return;

            legacy = uniqueLegacy;
            string gameName = legacy.Name;
            string sharedDbPath = DatabasePathForMode(gameName, legacy.EmbeddedProxy);
            if (!string.IsNullOrWhiteSpace(legacy.TwxProxyDbPath) && File.Exists(legacy.TwxProxyDbPath))
            {
                if (!await ImportDatabaseIntoSharedStoreAsync(legacy.TwxProxyDbPath, gameName, legacy.EmbeddedProxy))
                    return;
            }

            EmbeddedGameConfig config = BuildEmbeddedGameConfigFromProfile(legacy, sharedDbPath);
            await SaveEmbeddedGameConfigAsync(gameName, config);
            string configPath = GameConfigPathForMode(gameName, legacy.EmbeddedProxy);
            await ApplyLoadedGameConfigAsync(config, configPath, addToRecent, allowReplaceConnectedTab);
            return;
        }

        await ShowMessageAsync("Unsupported File", $"MTC can open .json game configs, .xdb databases, or legacy .mtc files.\n\n{path}");
    }

    private async Task<bool> PrepareCurrentTabForGameLoadAsync(string targetGameName, bool allowReplaceConnectedTab)
    {
        if (!allowReplaceConnectedTab)
            return true;

        MtcTabPrototype? tab = PeekCurrentMtcTabContext();
        if (tab is null && Dispatcher.UIThread.CheckAccess())
            tab = ActiveMtcTab;
        if (tab is null)
            return true;

        if (ReferenceEquals(_boundMtcTab, tab))
            CaptureMtcTabSession(tab);

        string currentGameName = GetMtcTabGameIdentity(tab);
        string normalizedTarget = NormalizeGameName(targetGameName);
        if (string.IsNullOrWhiteSpace(currentGameName) ||
            string.Equals(currentGameName, normalizedTarget, StringComparison.OrdinalIgnoreCase) ||
            !IsMtcTabConnectedToServer(tab))
        {
            return true;
        }

        bool confirmed = await ShowConfirmAsync(
            "Close Current Connection",
            $"Are you sure you want to close the connection to {currentGameName}?",
            "Yes",
            "No");
        if (!confirmed)
            return false;

        Core.GlobalModules.DebugLog(
            $"[MTC.OpenRecent] replacing connected tab game current='{currentGameName}' target='{normalizedTarget}'.\n");
        await DisconnectCurrentTabForGameReplacementAsync(tab);
        return true;
    }

    private async Task DisconnectCurrentTabForGameReplacementAsync(MtcTabPrototype tab)
    {
        CloseMtcTabOwnedWindows(tab);
        await ExecuteInOptionalMtcTabSessionAsync(tab, async () =>
        {
            try { _telnet.Disconnect(); } catch { }
            _proxyCts?.Cancel();
            _proxyCts = null;
            try { await _pythonScripts.StopAllAsync(); } catch { }

            if (_gameInstance != null)
                await StopEmbeddedAsync();
            else
            {
                _gameFileLock?.Dispose();
                _gameFileLock = null;
                try { _sessionDb?.CloseDatabase(); } catch { }
                _sessionDb = null;
                Core.ScriptRef.SetActiveDatabase(tab.RuntimeContext, null);
                Core.ScriptRef.SetOnVariableSaved(tab.RuntimeContext, null);
                OnGameDisconnected();
            }
        });
    }

    private async Task ApplyLoadedGameConfigAsync(EmbeddedGameConfig config, string configPath, bool addToRecent, bool allowReplaceConnectedTab = false)
    {
        string targetGameName = NormalizeGameName(config.Name);
        if (!await PrepareCurrentTabForGameLoadAsync(targetGameName, allowReplaceConnectedTab))
            return;

        if (!CanCurrentMtcTabAdoptGameIdentity(targetGameName, "load-game"))
            return;

        bool switchingProfile =
            !string.IsNullOrWhiteSpace(_currentProfilePath) &&
            !PathsEqualSafe(_currentProfilePath, configPath);
        bool switchingEmbeddedGame =
            _gameInstance != null
                ? !string.Equals(_gameInstance.GameName, targetGameName, StringComparison.OrdinalIgnoreCase)
                : !string.IsNullOrWhiteSpace(_embeddedGameName) &&
                  !string.Equals(_embeddedGameName, targetGameName, StringComparison.OrdinalIgnoreCase);

        if (_gameInstance != null && (switchingProfile || switchingEmbeddedGame))
        {
            Core.GlobalModules.DebugLog(
                $"[MTC] Switching loaded game: stopping embedded runtime currentGame='{_gameInstance.GameName}' targetGame='{targetGameName}' currentProfile='{_currentProfilePath ?? "<none>"}' targetProfile='{configPath}'\n");
            await StopEmbeddedAsync();
        }

        if (switchingProfile || switchingEmbeddedGame)
            Core.ScriptRef.ClearCurrentGameVars(ResolveCurrentMtcTabContext()?.RuntimeContext ?? _gameInstance?.RuntimeContext ?? ActiveMtcRuntimeContext);

        if (NormalizeEmbeddedRelogFlagsIfEstablished(config))
            await SaveEmbeddedGameConfigAsync(targetGameName, config);

        _currentProfilePath = configPath;
        _embeddedGameConfig = config;
        _embeddedGameName = targetGameName;
        ApplyProfile(BuildProfileFromConfig(config));
        ApplyDebugLoggingPreferences();
        if (addToRecent)
            AddToRecentAndSave(configPath);
        OnGameSelected();
        ApplyJsonRpcPreferences();

        if (_state.EmbeddedProxy && _gameInstance == null)
        {
            await DoConnectEmbeddedAsync();
        }
        else
        {
            _parser.Feed($"\x1b[1;36m[Game loaded: {_state.Host}:{_state.Port}  —  use File \u25b6 Connect to connect]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }
    }

    private static bool PathsEqualSafe(string? left, string? right)
        => GameConfigService.PathsEqualSafe(left, right);

    private async Task ImportDatabaseAsGameAsync(string databasePath, bool addToRecent, bool allowReplaceConnectedTab = false)
    {
        ConnectionProfile draft = BuildProfileFromDatabase(databasePath);
        string defaultGameName = NormalizeGameName(draft.Name);
        string defaultSharedDatabasePath = DatabasePathForMode(defaultGameName, draft.EmbeddedProxy);
        string defaultConfigPath = GameConfigPathForMode(defaultGameName, draft.EmbeddedProxy);

        if (File.Exists(defaultConfigPath))
        {
            EmbeddedGameConfig? existingConfig = await TryLoadGameConfigAsync(defaultConfigPath);
            if (existingConfig != null)
            {
                string existingDbPath = string.IsNullOrWhiteSpace(existingConfig.DatabasePath)
                    ? defaultSharedDatabasePath
                    : existingConfig.DatabasePath;
                if (string.Equals(Path.GetFullPath(databasePath), Path.GetFullPath(existingDbPath), StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(Path.GetFullPath(databasePath), Path.GetFullPath(defaultSharedDatabasePath), StringComparison.OrdinalIgnoreCase))
                {
                    await ApplyLoadedGameConfigAsync(existingConfig, defaultConfigPath, addToRecent, allowReplaceConnectedTab);
                    return;
                }
            }
        }

        var dialog = new NewConnectionDialog(draft, proxyServers: _appPrefs.ProxyServers);
        if (!await dialog.ShowDialog<bool>(this) || dialog.Result == null)
            return;

        ConnectionProfile? uniqueProfile = await EnsureUniqueProfileAsync(dialog.Result, currentDatabasePath: databasePath);
        if (uniqueProfile == null)
            return;

        ConnectionProfile imported = uniqueProfile;
        string gameName = imported.Name;
        if (!await ImportDatabaseIntoSharedStoreAsync(databasePath, gameName, imported.EmbeddedProxy))
            return;

        string sharedDbPath = DatabasePathForMode(gameName, imported.EmbeddedProxy);
        EmbeddedGameConfig config = BuildEmbeddedGameConfigFromProfile(imported, sharedDbPath);
        await SaveEmbeddedGameConfigAsync(gameName, config);
        TwEditCatalogService.ApplyEditDefaults(gameName, imported.EditId);
        string configPath = GameConfigPathForMode(gameName, imported.EmbeddedProxy);
        await ApplyLoadedGameConfigAsync(config, configPath, addToRecent, allowReplaceConnectedTab);
    }

    private async Task<EmbeddedGameConfig?> TryLoadGameConfigAsync(string path)
        => await GameConfigService.LoadConfigAsync(path);

    private ConnectionProfile BuildProfileFromDatabase(string databasePath)
    {
        string gameName = NormalizeGameName(Path.GetFileNameWithoutExtension(databasePath));
        var profile = new ConnectionProfile
        {
            Name = gameName,
            Server = _state.Host,
            Port = _state.Port,
            Protocol = TwProtocol.Telnet,
            EmbeddedProxy = true,
            LocalTwxProxy = true,
            TwxProxyDbPath = AppPaths.TwxproxyDatabasePathForGame(gameName),
            Sectors = 1000,
            ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines),
            LoginScript = "0_Login.cts",
        };

        try
        {
            var database = new Core.ModDatabase();
            database.OpenDatabase(databasePath);
            Core.DataHeader header = database.DBHeader;
            profile.Server = string.IsNullOrWhiteSpace(header.Address) ? profile.Server : header.Address;
            profile.Port = header.ServerPort == 0 ? profile.Port : header.ServerPort;
            profile.ListenPort = header.ListenPort == 0 ? profile.ListenPort : header.ListenPort;
            profile.Sectors = header.Sectors > 0 ? header.Sectors : profile.Sectors;
            profile.UseLogin = header.UseLogin;
            profile.UseRLogin = header.UseRLogin;
            profile.LoginScript = string.IsNullOrWhiteSpace(header.LoginScript) ? "0_Login.cts" : header.LoginScript;
            profile.LoginName = header.LoginName ?? string.Empty;
            profile.Password = header.Password ?? string.Empty;
            profile.GameLetter = header.Game == '\0' ? string.Empty : header.Game.ToString();
            database.CloseDatabase();
        }
        catch
        {
        }

        return profile;
    }

    private async Task<ConnectionProfile?> EnsureUniqueProfileAsync(ConnectionProfile profile, string? currentConfigPath = null, string? currentDatabasePath = null)
    {
        ConnectionProfile working = profile;
        while (true)
        {
            working.Name = NormalizeGameName(working.Name);
            if (!GameNameConflicts(working.Name, working.EmbeddedProxy, currentConfigPath, currentDatabasePath))
                return working;

            await ShowMessageAsync(
                "Game Name In Use",
                $"A game or database named '{working.Name}' already exists under the shared twxproxy folder.\n\nPlease choose a different game name.");

            var dialog = new NewConnectionDialog(working, proxyServers: _appPrefs.ProxyServers);
            if (!await dialog.ShowDialog<bool>(this) || dialog.Result == null)
                return null;
            working = dialog.Result;
        }
    }

    private async Task<bool> ImportDatabaseIntoSharedStoreAsync(string sourceDatabasePath, string targetGameName, bool embeddedProxy = true)
    {
        string targetPath = DatabasePathForMode(targetGameName, embeddedProxy);
        if (string.Equals(Path.GetFullPath(sourceDatabasePath), Path.GetFullPath(targetPath), StringComparison.OrdinalIgnoreCase))
            return true;

        try
        {
            AppPaths.EnsureTwxproxyDatabaseDir();
            Directory.CreateDirectory(Path.GetDirectoryName(targetPath)!);
            File.Copy(sourceDatabasePath, targetPath, overwrite: false);
            return true;
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Database Import Error", ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Opens or creates the sector database for the current connection.
    /// Named after the profile file (if saved) or the host:port string.
    /// Non-proxy mode uses MTC's local database store. Embedded-proxy mode uses the
    /// shared TWX Proxy database store so MTC and the proxy read/write the same .xdb.
    /// </summary>
    private void OpenSessionDatabase(string? gameName = null, int sectors = 0, bool useSharedProxyDatabase = false)
    {
        try
        {
            int databaseSectors = sectors > 0
                ? sectors
                : (_state.Sectors > 0 ? _state.Sectors : 1000);

            if (gameName == null)
            {
                gameName = !string.IsNullOrEmpty(_currentProfilePath)
                    ? Path.GetFileNameWithoutExtension(_currentProfilePath)
                    : $"{_state.Host}_{_state.Port}";

                // Strip chars unsafe in filenames
                gameName = string.Concat(gameName.Split(Path.GetInvalidFileNameChars()));
                if (string.IsNullOrWhiteSpace(gameName)) gameName = "game";
            }

            string dbPath;
            if (useSharedProxyDatabase)
            {
                AppPaths.EnsureTwxproxyDatabaseDir();
                dbPath = !string.IsNullOrWhiteSpace(_embeddedGameConfig?.DatabasePath)
                    ? _embeddedGameConfig!.DatabasePath
                    : AppPaths.TwxproxyDatabasePathForGame(gameName);

                string legacyMtcDbPath = AppPaths.LegacyDatabasePathForGame(gameName);
                if (!File.Exists(dbPath) && File.Exists(legacyMtcDbPath))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
                    File.Copy(legacyMtcDbPath, dbPath, overwrite: false);
                }
            }
            else
            {
                AppPaths.EnsureDirectories();
                dbPath = AppPaths.MtcStandaloneDatabasePathForGame(gameName);
            }

            string configPath = useSharedProxyDatabase
                ? AppPaths.TwxproxyGameConfigFileFor(gameName)
                : AppPaths.MtcStandaloneGameConfigFileFor(gameName);
            _gameFileLock?.Dispose();
            _gameFileLock = null;
            _gameFileLock = Core.GameFileLock.Acquire(
                useSharedProxyDatabase ? "MTC embedded proxy" : "MTC standalone client",
                configPath,
                dbPath);

            var db = new Core.ModDatabase();
            if (File.Exists(dbPath))
            {
                db.OpenDatabase(dbPath);
                db.UseCache = _embeddedGameConfig?.UseCache ?? true;
                var header = db.DBHeader;
                bool headerDirty = false;
                if (databaseSectors > 0)
                {
                    headerDirty |= header.Sectors != databaseSectors;
                    header.Sectors = databaseSectors;
                }
                string configLoginScript = string.IsNullOrWhiteSpace(_embeddedGameConfig?.LoginScript) ? "0_Login.cts" : _embeddedGameConfig.LoginScript;
                string configLoginName = _embeddedGameConfig?.LoginName ?? string.Empty;
                string configPassword = _embeddedGameConfig?.Password ?? string.Empty;
                char configGameChar = string.IsNullOrWhiteSpace(_embeddedGameConfig?.GameLetter) ? '\0' : char.ToUpperInvariant(_embeddedGameConfig.GameLetter[0]);
                headerDirty |= header.Address != _state.Host;
                header.Address = _state.Host;
                headerDirty |= header.ServerPort != (ushort)_state.Port;
                header.ServerPort = (ushort)_state.Port;
                headerDirty |= header.ListenPort != (ushort)(_embeddedGameConfig?.ListenPort ?? 2300);
                header.ListenPort = (ushort)(_embeddedGameConfig?.ListenPort ?? 2300);
                headerDirty |= header.CommandChar != (_embeddedGameConfig?.CommandChar ?? '$');
                header.CommandChar = _embeddedGameConfig?.CommandChar ?? '$';
                headerDirty |= header.UseLogin != (_embeddedGameConfig?.UseLogin ?? false);
                header.UseLogin = _embeddedGameConfig?.UseLogin ?? false;
                headerDirty |= header.UseRLogin != (_embeddedGameConfig?.UseRLogin ?? false);
                header.UseRLogin = _embeddedGameConfig?.UseRLogin ?? false;
                headerDirty |= header.LoginScript != configLoginScript;
                header.LoginScript = configLoginScript;
                headerDirty |= header.LoginName != configLoginName;
                header.LoginName = configLoginName;
                headerDirty |= header.Password != configPassword;
                header.Password = configPassword;
                headerDirty |= header.Game != configGameChar;
                header.Game = configGameChar;
                db.ReplaceHeader(header);
                if (headerDirty)
                    db.SaveDatabase();
            }
            else
            {
                db.CreateDatabase(dbPath, new Core.DataHeader
                {
                    Address    = _state.Host,
                    ServerPort = (ushort)_state.Port,
                    ListenPort = (ushort)(_embeddedGameConfig?.ListenPort ?? 2300),
                    CommandChar = _embeddedGameConfig?.CommandChar ?? '$',
                    Sectors    = databaseSectors,
                    UseLogin   = _embeddedGameConfig?.UseLogin ?? false,
                    UseRLogin  = _embeddedGameConfig?.UseRLogin ?? false,
                    LoginScript = string.IsNullOrWhiteSpace(_embeddedGameConfig?.LoginScript) ? "0_Login.cts" : _embeddedGameConfig.LoginScript,
                    LoginName  = _embeddedGameConfig?.LoginName ?? string.Empty,
                    Password   = _embeddedGameConfig?.Password ?? string.Empty,
                    Game       = string.IsNullOrWhiteSpace(_embeddedGameConfig?.GameLetter) ? '\0' : char.ToUpperInvariant(_embeddedGameConfig.GameLetter[0]),
                });
            }

            _sessionDb = db;
            Core.ScriptRef.SetActiveDatabase(ResolveCurrentMtcTabContext()?.RuntimeContext ?? ActiveMtcRuntimeContext, db);
            QueueFinderPrewarm(db);

            var owner = ResolveCurrentMtcTabContext();
            PostToMtcTabSession(owner, () =>
                _parser.Feed($"\x1b[1;36m[Database: {dbPath}]\x1b[0m\r\n"));
        }
        catch (Exception ex)
        {
            var owner = ResolveCurrentMtcTabContext();
            PostToMtcTabSession(owner, () =>
                _parser.Feed($"\x1b[1;31m[DB open failed: {ex.Message}]\x1b[0m\r\n"));
        }
    }

    private Core.ModInterpreter? CurrentInterpreter
    {
        get
        {
            Core.TwxRuntimeContext? context =
                ResolveCurrentMtcTabContext()?.RuntimeContext ??
                _gameInstance?.RuntimeContext ??
                ActiveMtcRuntimeContext;
            if (context == null)
                return null;
            if (_gameInstance?.RuntimeContext is { } gameContext && ReferenceEquals(gameContext, context))
            {
                if (gameContext.ActiveInterpreter is { } gameInterpreter)
                    return gameInterpreter;
                if (gameContext.TWXInterpreter is Core.ModInterpreter gameTwxInterpreter)
                    return gameTwxInterpreter;
            }

            if (context?.ActiveInterpreter is { } tabInterpreter)
                return tabInterpreter;
            if (context?.TWXInterpreter is Core.ModInterpreter tabTwxInterpreter)
                return tabTwxInterpreter;
            return null;
        }
    }

    private bool CanUseRemoteProxyScripts()
    {
        if (!_state.EmbeddedProxy &&
            _telnet.IsConnected &&
            !string.IsNullOrWhiteSpace(_state.RemoteProxyServerId) &&
            !string.IsNullOrWhiteSpace(_state.RemoteProxyGameId) &&
            _appPrefs.ProxyServers.Any(server => string.Equals(server.Id, _state.RemoteProxyServerId, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return !_state.EmbeddedProxy &&
            _gameInstance == null &&
            _telnet.IsConnected &&
            _state.LocalTwxProxy &&
            IsLoopbackHost(_state.Host) &&
            IsConfiguredForSameProxyProgramDirectory();
    }

    private bool CanRunProxyScripts()
        => CurrentInterpreter != null || CanUseRemoteProxyScripts();

    private bool IsConfiguredForSameProxyProgramDirectory()
    {
        try
        {
            string mtcProgramDir = Path.GetFullPath(AppPaths.ProgramDir)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string proxyProgramDir = Path.GetFullPath(Core.SharedPathSettingsStore.Load().ProgramDirectory)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            return string.Equals(mtcProgramDir, proxyProgramDir, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static bool IsLoopbackHost(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return false;

        string trimmed = host.Trim();
        if (trimmed.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("::1", StringComparison.Ordinal) ||
            trimmed.Equals("[::1]", StringComparison.Ordinal) ||
            trimmed.StartsWith("127.", StringComparison.Ordinal))
            return true;

        return System.Net.IPAddress.TryParse(trimmed, out var address) &&
            System.Net.IPAddress.IsLoopback(address);
    }

    private void OpenNewWindowInNewProcess()
    {
        try
        {
            string[] args = Environment.GetCommandLineArgs().Skip(1).ToArray();

            string? processPath = Environment.ProcessPath;
            if (string.IsNullOrWhiteSpace(processPath))
                processPath = Process.GetCurrentProcess().MainModule?.FileName;

            if (string.IsNullOrWhiteSpace(processPath))
            {
                _parser.Feed("\x1b[1;31m[Unable to open a new MTC window: current executable path is unavailable]\x1b[0m\r\n");
                return;
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = processPath,
                WorkingDirectory = Environment.CurrentDirectory,
                UseShellExecute = false,
            };

            if (OperatingSystem.IsMacOS() || OperatingSystem.IsLinux())
                startInfo.Environment["MTC_UNIX_DETACHED"] = "1";

            foreach (string arg in args)
                startInfo.ArgumentList.Add(arg);

            RegisterOwnedChildProcess(Process.Start(startInfo));
        }
        catch (Exception ex)
        {
            _parser.Feed($"\x1b[1;31m[Unable to open a new MTC window: {ex.Message}]\x1b[0m\r\n");
        }
    }
}
