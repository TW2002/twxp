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
    private void OnTelnetConnected()
    {
        var owner = ResolveCurrentMtcTabContext();

        void Apply()
        {
            bool wasConnected = _state.Connected;
            _state.Connected = true;
            SetTerminalConnected(true);
            if (!wasConnected)
            {
                ObserveGameAgentConnectionChanged(connected: true);
                RefreshSessionLogTarget(CurrentInterpreter?.ScriptDirectory);
                // Open (or create) the sector database for this game connection.
                OpenSessionDatabase(DeriveGameName(), _state.Sectors, useSharedProxyDatabase: false);
                OnGameConnected();
                UpdateTemporaryMacroControls();
                _parser.Feed($"\x1b[1;32m[Connected to {_state.Host}:{_state.Port}]\x1b[0m\r\n");
            }
            RefreshStatusBar();
            _buffer.Dirty = true;
        }

        if (Dispatcher.UIThread.CheckAccess())
            ExecuteInOptionalMtcTabSession(owner, Apply);
        else
            PostToMtcTabSession(owner, Apply);
    }

    private void OnTelnetDisconnected()
    {
        var owner = ResolveCurrentMtcTabContext();

        void Apply()
        {
            bool wasConnected = _state.Connected;
            _state.Connected = false;
            if (wasConnected)
                ObserveGameAgentConnectionChanged(connected: false);
            _sessionLog.CloseLog();
            // Flush and close the database.
            try { _sessionDb?.CloseDatabase(); } catch { /* best-effort */ }
            _sessionDb = null;
            _gameFileLock?.Dispose();
            _gameFileLock = null;
            Core.ScriptRef.SetActiveDatabase(owner?.RuntimeContext ?? ActiveMtcRuntimeContext, null);
            SetTerminalConnected(false);
            OnGameDisconnected();
            UpdateTemporaryMacroControls();
            if (wasConnected)
                _parser.Feed("\x1b[1;31m[Disconnected]\x1b[0m\r\n");
            RefreshStatusBar();
            _buffer.Dirty = true;
        }

        if (Dispatcher.UIThread.CheckAccess())
            ExecuteInOptionalMtcTabSession(owner, Apply);
        else
            PostToMtcTabSession(owner, Apply);
    }

    private void OnTelnetError(string msg)
    {
        var owner = ResolveCurrentMtcTabContext();

        void Apply()
        {
            _parser.Feed($"\x1b[1;31m[Error: {msg}]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }

        if (Dispatcher.UIThread.CheckAccess())
            ExecuteInOptionalMtcTabSession(owner, Apply);
        else
            PostToMtcTabSession(owner, Apply);
    }

    // ── Connection menu state helpers ──────────────────────────────────────

    /// <summary>Derives a filesystem-safe game name for log/DB file naming.</summary>
    private string DeriveGameName()
    {
        string name = !string.IsNullOrWhiteSpace(_state.GameName)
            ? _state.GameName
            : (!string.IsNullOrEmpty(_currentProfilePath)
                ? Path.GetFileNameWithoutExtension(_currentProfilePath)
                : (!string.IsNullOrWhiteSpace(_state.Host)
                    ? $"{_state.Host}_{_state.Port}"
                    : string.Empty));
        name = string.Concat(name.Split(Path.GetInvalidFileNameChars()));
        if (IsGeneratedPlaceholderGameName(name))
            return "game";
        return string.IsNullOrWhiteSpace(name) ? "game" : name;
    }

    /// <summary>Call after a profile is applied (game selected) to enable Connect.</summary>
    private void OnGameSelected()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(OnGameSelected, DispatcherPriority.Background);
            return;
        }

        ClearOnlinePlayers();
        if (!PrepareMtcTabVisualRefresh())
            return;

        UpdateNotesForActiveGame();
        _fileEdit.IsEnabled       = true;
        _fileConnect.IsEnabled    = true;
        _fileDisconnect.IsEnabled = false;
        RebuildProxyMenu();
        RebuildScriptsMenu();
    }

    /// <summary>Call when TCP connection is established.</summary>
    private void OnGameConnected()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(OnGameConnected, DispatcherPriority.Background);
            return;
        }

        long now = Stopwatch.GetTimestamp();
        Volatile.Write(ref _lastGameTrafficTicks, now);
        Volatile.Write(ref _lastOnlineRefreshTicks, now);
        ResetServerCommandTyping();
        if (!PrepareMtcTabVisualRefresh())
            return;

        _fileConnect.IsEnabled    = false;
        _fileDisconnect.IsEnabled = true;
        UpdateHaggleToggleState();
        RefreshMombotUi();
        UpdateNotesForActiveGame();
        RebuildProxyMenu();
        RebuildScriptsMenu();
    }

    /// <summary>Call when TCP connection is lost / disconnected.</summary>
    private void OnGameDisconnected()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(OnGameDisconnected, DispatcherPriority.Background);
            return;
        }

        Volatile.Write(ref _lastGameTrafficTicks, 0);
        Volatile.Write(ref _lastOnlineRefreshTicks, 0);
        ResetServerCommandTyping();
        ClearOnlinePlayers();
        ClearRedAlert();
        if (!PrepareMtcTabVisualRefresh())
            return;

        SaveCurrentNotesNow();
        RefreshNotesMenuState();
        _fileConnect.IsEnabled    = true;
        _fileDisconnect.IsEnabled = false;
        UpdateHaggleToggleState();
        RefreshMombotUi();
        RebuildProxyMenu();
        RebuildScriptsMenu();
    }

    private void OnHaggleToggleRequested()
    {
        if (_gameInstance == null)
        {
            if (CanUseRemoteProxyScripts())
            {
                SendProxyMenuCommand("h");
                PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
                return;
            }

            if (!_state.EmbeddedProxy && _telnet.IsConnected)
            {
                bool enabled = _standaloneNativeHaggle.Toggle();
                _parser.Feed($"\x1b[1;36m[Native haggle {(enabled ? "enabled" : "disabled")}]\x1b[0m\r\n");
                _buffer.Dirty = true;
            }
            UpdateHaggleToggleState();
            return;
        }

        _termCtrl.SendInput?.Invoke(System.Text.Encoding.ASCII.GetBytes("$h"));
        PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
    }

    private void UpdateHaggleToggleState()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(UpdateHaggleToggleState, DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        bool haggleAvailable = _gameInstance != null || (!_state.EmbeddedProxy && _telnet.IsConnected);
        _statusHaggleButton.IsEnabled = haggleAvailable;
        UpdateTerminalLiveSelector();
    }

    private void ProcessStandaloneNativeHaggleLine(string strippedLine)
    {
        if (_state.EmbeddedProxy ||
            CanUseRemoteProxyScripts() ||
            !_telnet.IsConnected ||
            string.IsNullOrWhiteSpace(strippedLine))
            return;

        string? response = _standaloneNativeHaggle.HandleLine(strippedLine);
        if (string.IsNullOrEmpty(response))
            return;

        _telnet.SendRaw(System.Text.Encoding.ASCII.GetBytes(response + "\r"));
        Core.GlobalModules.DebugLog($"[MTC.NativeHaggle] standalone SEND '{response}\\r'\n");
    }

    private void ApplyMombotConfigChange(Action<MTC.mombot.mombotConfig> update)
    {
        _embeddedGameConfig ??= new EmbeddedGameConfig();
        MTC.mombot.mombotConfig config = GetOrCreateEmbeddedMombotConfig(_embeddedGameConfig);

        update(config);
        config.WatcherEnabled = config.Enabled;
        _mombot.ApplyConfig(config);
        RefreshStatusBar();
        RebuildProxyMenu();
        _ = SaveCurrentGameConfigAsync();
    }

    private BotRuntimeState GetBotRuntimeState()
    {
        string externalBotName = _gameInstance?.ActiveBotName ?? string.Empty;
        return new BotRuntimeState(_mombot.Enabled, externalBotName);
    }

    private void RememberNativeMombotBotName(string? botName)
    {
        string normalized = NormalizeMombotValue(botName);
        if (string.IsNullOrWhiteSpace(normalized))
            return;

        if (string.Equals(_appPrefs.LastNativeMombotBotName, normalized, StringComparison.OrdinalIgnoreCase))
            return;

        _appPrefs.LastNativeMombotBotName = normalized;
        _appPrefs.Save();
    }

    private bool IsNativeMombotConfiguredForStart()
    {
        MTC.mombot.mombotConfig? config = _embeddedGameConfig?.mombot ?? _embeddedGameConfig?.Mtc?.mombot;
        if (config?.Configured == true)
            return true;

        return HasCompleteNativeMombotRelogSettings();
    }

    private bool HasCompleteNativeMombotRelogSettings()
    {
        string configLogin = NormalizeMombotValue(_embeddedGameConfig?.LoginName, treatSelfAsEmpty: true);
        string configPassword = NormalizeMombotValue(_embeddedGameConfig?.Password);
        string configGameLetter = NormalizeMombotValue(_embeddedGameConfig?.GameLetter);

        string loginName = FirstMeaningfulMombotValue(
            configLogin,
            ReadCurrentMombotVar(string.Empty, "$BOT~USERNAME"),
            ReadCurrentMombotVar(string.Empty, "$username"));
        string serverName = FirstMeaningfulMombotValue(
            configLogin,
            ReadCurrentMombotVar(string.Empty, "$BOT~SERVERNAME"),
            ReadCurrentMombotVar(string.Empty, "$servername"),
            loginName);
        string password = FirstMeaningfulMombotValue(
            configPassword,
            ReadCurrentMombotVar(string.Empty, "$BOT~PASSWORD"),
            ReadCurrentMombotVar(string.Empty, "$password"));
        string gameLetter = FirstMeaningfulMombotValue(
            configGameLetter,
            ReadCurrentMombotVar(string.Empty, "$BOT~LETTER"),
            ReadCurrentMombotVar(string.Empty, "$letter"));

        return !string.IsNullOrWhiteSpace(serverName) &&
               !string.IsNullOrWhiteSpace(loginName) &&
               !string.IsNullOrWhiteSpace(password) &&
               !string.IsNullOrWhiteSpace(NormalizeGameLetter(gameLetter));
    }

    private void RefreshMombotUi()
    {
        if (_mombot.Enabled)
            return;

        if (HasMombotInteractiveState())
            CloseMombotInteractiveState();
    }

    private bool HasMombotInteractiveState()
    {
        return _mombotPromptOpen ||
            _mombotHotkeyPromptOpen ||
            _mombotScriptPromptOpen ||
            _mombotPreferencesOpen ||
            _mombotMacroPromptOpen ||
            _mombotPreferencesInputHandler != null ||
            _mombotPreferencesInputBuffer.Length > 0;
    }

    private bool HasMombotInteractiveStateFor(MtcTabPrototype? owner)
    {
        if (owner is null)
            return HasMombotInteractiveState();

        return owner.MombotPromptOpen ||
            owner.MombotHotkeyPromptOpen ||
            owner.MombotScriptPromptOpen ||
            owner.MombotPreferencesOpen ||
            owner.MombotMacroPromptOpen ||
            owner.MombotPreferencesInputHandler != null ||
            owner.MombotPreferencesInputBuffer.Length > 0;
    }

    private void CloseMombotInteractiveState(bool clearBotIsDeaf = true)
    {
        if (!HasMombotInteractiveState() && !clearBotIsDeaf)
            return;

        bool restoredPreferencesMenuDeaf = _mombotPreferencesMenuDeafActive;
        ResetMombotPromptState();
        if (clearBotIsDeaf && !restoredPreferencesMenuDeaf)
            PersistMombotBoolean(false, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");

        _parser.Feed("\r\x1b[K");
        _buffer.Dirty = true;
        FocusActiveTerminal();
    }

    private void EnsureEmbeddedMombotClientAudible()
    {
        PersistMombotBoolean(false, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");

        if (_gameInstance == null)
            return;

        if (_terminalLivePaused)
        {
            SetTerminalLivePaused(false);
            return;
        }

        _gameInstance.SetClientType(EmbeddedLocalClientIndex, Core.ClientType.Standard);
    }

    private void OnNativeHaggleChanged(bool enabled, Core.NativeHaggleChangeSource source)
    {
        var gameConfig = _embeddedGameConfig;
        var gameName = _embeddedGameName;
        if (source == Core.NativeHaggleChangeSource.User &&
            gameConfig != null &&
            !string.IsNullOrWhiteSpace(gameName) &&
            gameConfig.NativeHaggleEnabled != enabled)
        {
            gameConfig.NativeHaggleEnabled = enabled;
            _ = SaveEmbeddedGameConfigAsync(gameName, gameConfig);
        }

        var owner = ResolveCurrentMtcTabContext();
        PostToMtcTabSession(owner, () =>
        {
            UpdateHaggleToggleState();
            RefreshMombotUi();
            RequestStatusBarRefresh();
            _buffer.Dirty = true;
        });
    }

    private void OnNativeHaggleStatsChanged()
    {
        var owner = ResolveCurrentMtcTabContext();
        PostToMtcTabSession(owner, () =>
        {
            RefreshMombotUi();
            if (ShouldShowStatusBarHaggleInfo())
            {
                RequestStatusBarRefresh();
                _buffer.Dirty = true;
            }
        });
    }

    private async Task OnAdvancedProxySettingsAsync()
    {
        await Task.Yield();

        string currentPortMode = ResolveGlobalPortHaggleMode();
        string currentPlanetMode = ResolveGlobalPlanetHaggleMode();
        _appPrefs.PortHaggleMode = currentPortMode;
        _appPrefs.PlanetHaggleMode = currentPlanetMode;
        IReadOnlyList<Core.NativeHaggleModeInfo> availablePortModes =
            _gameInstance?.NativePortHaggleModes ?? DiscoverAvailableNativeHaggleModes(Core.NativeHaggleTradeKind.Port);
        IReadOnlyList<Core.NativeHaggleModeInfo> availablePlanetModes =
            _gameInstance?.NativePlanetHaggleModes ?? DiscoverAvailableNativeHaggleModes(Core.NativeHaggleTradeKind.Planet);
        var dialog = new AdvancedProxySettingsDialog(currentPortMode, currentPlanetMode, availablePortModes, availablePlanetModes);
        bool saved = await dialog.ShowDialog<bool>(this);
        if (!saved)
            return;

        string selectedPortMode = Core.NativeHaggleModes.Normalize(dialog.SelectedPortHaggleMode);
        string selectedPlanetMode = Core.NativeHaggleModes.Normalize(dialog.SelectedPlanetHaggleMode);
        if (string.Equals(currentPortMode, selectedPortMode, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(currentPlanetMode, selectedPlanetMode, StringComparison.OrdinalIgnoreCase))
            return;

        _appPrefs.PortHaggleMode = selectedPortMode;
        _appPrefs.PlanetHaggleMode = selectedPlanetMode;
        _appPrefs.Save();

        if (_gameInstance != null)
            _gameInstance.SetNativeHaggleModes(selectedPortMode, selectedPlanetMode);
        else
        {
            _standaloneNativeHaggle.SetPortHaggleMode(selectedPortMode);
            _standaloneNativeHaggle.SetPlanetHaggleMode(selectedPlanetMode);
        }

        string selectedPortLabel = availablePortModes
            .FirstOrDefault(info => string.Equals(info.Id, selectedPortMode, StringComparison.OrdinalIgnoreCase))
            ?.DisplayName ?? selectedPortMode;
        string selectedPlanetLabel = availablePlanetModes
            .FirstOrDefault(info => string.Equals(info.Id, selectedPlanetMode, StringComparison.OrdinalIgnoreCase))
            ?.DisplayName ?? selectedPlanetMode;
        _parser.Feed($"\x1b[1;36m[Native haggle modes: Port={selectedPortLabel} ({selectedPortMode}), Planet={selectedPlanetLabel} ({selectedPlanetMode})]\x1b[0m\r\n");
        _buffer.Dirty = true;
        RebuildProxyMenu();
    }

    private IReadOnlyList<Core.NativeHaggleModeInfo> DiscoverAvailableNativeHaggleModes(Core.NativeHaggleTradeKind tradeKind)
    {
        return Core.NativeHaggleModeDiscovery.DiscoverFromDirectories(new[]
        {
            AppPaths.ModulesDir,
            Core.SharedPaths.LegacyModulesDir,
        })
        .Where(info => info.SupportsTradeKind(tradeKind))
        .ToList();
    }

    // ── Menu actions ───────────────────────────────────────────────────────

    private async Task OnConnectAsync()
    {
        if (_state.EmbeddedProxy)
        {
            string targetGameName = GetEmbeddedGameName();
            if (_gameInstance != null &&
                (!_gameInstance.IsRunning ||
                 !string.Equals(_gameInstance.GameName, targetGameName, StringComparison.OrdinalIgnoreCase)))
                await StopEmbeddedAsync();

            if (_gameInstance == null)
                await DoConnectEmbeddedAsync();

            if (_gameInstance != null && !_gameInstance.IsConnected)
                await ConnectEmbeddedServerAsync();
        }
        else
            DoConnect();
    }

    private async Task OnDisconnectAsync()
    {
        if (_gameInstance != null)
        {
            if (_gameInstance.IsConnected)
                await _gameInstance.DisconnectFromServerAsync();
            return;
        }
        if (!_telnet.IsConnected)
        {
            _ = ShowMessageAsync("Disconnect", "No active connection.");
            return;
        }
        _telnet.Disconnect();
    }

    private async Task OnResetGameAsync()
    {
        _menuBar.Close();

        string gameName = NormalizeGameName(_embeddedGameName ?? DeriveGameName());
        if (string.IsNullOrWhiteSpace(gameName))
        {
            await ShowMessageAsync("Reset Game", "No game is currently loaded.");
            return;
        }

        bool confirmed = await ShowConfirmAsync(
            "Reset Game",
            $"This will reset all game data and settings for '{gameName}'.\n\nAre you sure?",
            "Yes",
            "Cancel");
        if (!confirmed)
            return;

        bool restartEmbeddedProxy = _state.EmbeddedProxy && _gameInstance != null;
        string configPath = GameConfigPathForMode(gameName, _state.EmbeddedProxy);
        EmbeddedGameConfig config = _embeddedGameConfig ?? await LoadOrCreateEmbeddedGameConfigAsync(gameName);
        config.Name = gameName;
        config.DatabasePath = ResolveResetDatabasePath(gameName, config);
        string resetScriptDirectory = CurrentInterpreter?.ScriptDirectory ?? GetEffectiveProxyScriptDirectory();
        string resetProgramDir = CurrentInterpreter?.ProgramDir ?? GetEffectiveProxyProgramDir(resetScriptDirectory);
        string resetNativeScriptRoot = GetMombotScriptRootRelative(GetNativeMombotScriptRoot(BuildCurrentGameNativeBotConfig()));
        ResetEmbeddedGameIdentity(config);

        Core.DataHeader sourceHeader = ResolveResetSourceHeader(config.DatabasePath);
        Core.DataHeader resetHeader = BuildResetDatabaseHeader(config, sourceHeader);

        try
        {
            if (_gameInstance != null)
            {
                await StopEmbeddedAsync();
            }
            else if (_telnet.IsConnected)
            {
                _telnet.Disconnect();
            }

            try { _sessionDb?.CloseDatabase(); } catch { }
            _sessionDb = null;
            _gameFileLock?.Dispose();
            _gameFileLock = null;
            Core.TwxRuntimeContext? runtimeContext = ResolveCurrentMtcTabContext()?.RuntimeContext ?? _gameInstance?.RuntimeContext ?? ActiveMtcRuntimeContext;
            Core.ScriptRef.SetActiveDatabase(runtimeContext, null);
            Core.ScriptRef.SetOnVariableSaved(runtimeContext, null);
            Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
            config.Variables.Clear();
            await GameConfigService.ResetVariablesAsync(gameName, config.Variables);
            ClearMombotRelogState();
            ResetMombotGameStorage(gameName, resetProgramDir, resetNativeScriptRoot);

            Directory.CreateDirectory(Path.GetDirectoryName(config.DatabasePath)!);
            using (Core.GameFileLock.Acquire("MTC reset game", configPath, config.DatabasePath))
            {
                var db = new Core.ModDatabase();
                db.CreateDatabase(config.DatabasePath, resetHeader);
                db.CloseDatabase();

                config.Mtc ??= new EmbeddedMtcConfig();
                config.Mtc.State = new EmbeddedMtcState();
                await SaveEmbeddedGameConfigAsync(gameName, config);
            }

            _currentProfilePath = configPath;
            _embeddedGameConfig = config;
            _embeddedGameName = gameName;
            ApplyProfile(BuildProfileFromConfig(config));
            OnGameSelected();
            ApplyJsonRpcPreferences();

            _parser.Feed($"\x1b[1;36m[Game reset: {gameName}]\x1b[0m\r\n");
            _buffer.Dirty = true;

            if (restartEmbeddedProxy)
                await DoConnectEmbeddedAsync();
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Reset Game Error", ex.Message);
        }
    }

    private void ResetEmbeddedGameIdentity(EmbeddedGameConfig config)
    {
        config.UseLogin = false;
        config.UseRLogin = false;
        config.LoginScript = "0_Login.cts";
        config.LoginName = string.Empty;
        config.Password = string.Empty;
        config.Variables.Clear();

        if (config.Extra != null)
        {
            config.Extra.Remove("CharacterName");
            config.Extra.Remove("LastConnected");
        }
    }

    private void ResetMombotGameStorage(string gameName, string? programDir = null, string? nativeScriptRoot = null)
    {
        string normalizedGameName = NormalizeGameName(gameName);
        if (string.IsNullOrWhiteSpace(normalizedGameName))
            return;

        string scriptDirectory = CurrentInterpreter?.ScriptDirectory ?? GetEffectiveProxyScriptDirectory();
        programDir = string.IsNullOrWhiteSpace(programDir)
            ? CurrentInterpreter?.ProgramDir ?? GetEffectiveProxyProgramDir(scriptDirectory)
            : programDir;
        nativeScriptRoot = string.IsNullOrWhiteSpace(nativeScriptRoot)
            ? GetMombotScriptRootRelative(GetNativeMombotScriptRoot(BuildCurrentGameNativeBotConfig()))
            : nativeScriptRoot;

        var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            AppPaths.GameDataDirForGame(normalizedGameName),
            Path.Combine(programDir, "games", normalizedGameName)
        };

        if (!string.IsNullOrWhiteSpace(nativeScriptRoot))
        {
            paths.Add(Path.Combine(
                programDir,
                nativeScriptRoot.Replace('/', Path.DirectorySeparatorChar),
                "games",
                normalizedGameName));
        }

        foreach (string path in paths)
            DeleteDirectoryIfPresent(path);
    }

    private static void DeleteDirectoryIfPresent(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
            return;

        try
        {
            Directory.Delete(path, recursive: true);
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[ResetGame] Failed to delete Mombot game storage '{path}': {ex.Message}\n");
            throw;
        }
    }

    private string ResolveResetDatabasePath(string gameName, EmbeddedGameConfig config)
    {
        if (!string.IsNullOrWhiteSpace(_sessionDb?.DatabasePath))
            return _sessionDb.DatabasePath;

        if (!string.IsNullOrWhiteSpace(config.DatabasePath))
            return config.DatabasePath;

        return _state.EmbeddedProxy
            ? AppPaths.TwxproxyDatabasePathForGame(gameName)
            : AppPaths.MtcStandaloneDatabasePathForGame(gameName);
    }

    private Core.DataHeader ResolveResetSourceHeader(string databasePath)
    {
        if (_sessionDb != null)
            return _sessionDb.DBHeader;

        if (!string.IsNullOrWhiteSpace(databasePath) && File.Exists(databasePath))
        {
            try
            {
                var db = new Core.ModDatabase();
                db.OpenDatabase(databasePath);
                var header = db.DBHeader;
                db.CloseDatabase();
                return header;
            }
            catch
            {
            }
        }

        return new Core.DataHeader();
    }

    private Core.DataHeader BuildResetDatabaseHeader(EmbeddedGameConfig config, Core.DataHeader sourceHeader)
    {
        string loginScript = string.IsNullOrWhiteSpace(config.LoginScript)
            ? (string.IsNullOrWhiteSpace(sourceHeader.LoginScript) ? "0_Login.cts" : sourceHeader.LoginScript)
            : config.LoginScript;

        char gameLetter = !string.IsNullOrWhiteSpace(config.GameLetter)
            ? char.ToUpperInvariant(config.GameLetter[0])
            : sourceHeader.Game;

        char commandChar = config.CommandChar == '\0'
            ? (sourceHeader.CommandChar == '\0' ? '$' : sourceHeader.CommandChar)
            : config.CommandChar;

        int sectorCount = config.Sectors > 0
            ? config.Sectors
            : (sourceHeader.Sectors > 0 ? sourceHeader.Sectors : (_state.Sectors > 0 ? _state.Sectors : 1000));

        int serverPort = config.Port > 0
            ? config.Port
            : (sourceHeader.ServerPort > 0 ? sourceHeader.ServerPort : _state.Port);

        int listenPort = config.ListenPort > 0
            ? config.ListenPort
            : (sourceHeader.ListenPort > 0 ? sourceHeader.ListenPort : 2300);

        return new Core.DataHeader
        {
            ProgramName = sourceHeader.ProgramName,
            Version = sourceHeader.Version == 0 ? (byte)Core.DatabaseConstants.DatabaseVersion : sourceHeader.Version,
            Sectors = sectorCount,
            Address = string.IsNullOrWhiteSpace(config.Host)
                ? (string.IsNullOrWhiteSpace(sourceHeader.Address) ? _state.Host : sourceHeader.Address)
                : config.Host,
            Description = sourceHeader.Description,
            ServerPort = (ushort)Math.Clamp(serverPort, 0, ushort.MaxValue),
            ListenPort = (ushort)Math.Clamp(listenPort, 0, ushort.MaxValue),
            LoginScript = loginScript,
            Password = config.Password ?? string.Empty,
            LoginName = config.LoginName ?? string.Empty,
            Game = gameLetter,
            IconFile = sourceHeader.IconFile,
            UseRLogin = config.UseRLogin,
            UseLogin = config.UseLogin,
            RobFactor = sourceHeader.RobFactor,
            StealFactor = sourceHeader.StealFactor,
            CommandChar = commandChar,
        };
    }

    private async Task ShowAboutAsync()
    {
        const double aboutImageSize = 330;

        var okBtn = new Button
        {
            Content = "OK",
            MinWidth = 110,
        };

        var aboutText = new TextBlock
        {
            Width = aboutImageSize,
            Text =
                $"{MtcVersion.ProductName} ({MtcVersion.ShortProductName})\n" +
                $"Version {MtcVersion.DisplayVersion}\n" +
                $"Build {MtcVersion.BuildNumber}\n\n" +
                "Cross-platform Trade Wars 2002 client\n" +
                "built on TWXProxy Core.\n\n" +
                "Copyright (C) 2026 Matt Mosley\n" +
                "Licensed under GPL v2+",
            Foreground = FgKey,
            TextWrapping = TextWrapping.Wrap,
            TextAlignment = TextAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
        };

        var dlg = new Window
        {
            Title = "About MTC",
            SizeToContent = SizeToContent.WidthAndHeight,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            CanResize = false,
            Background = BgPanel,
            Content = new Border
            {
                Padding = new Thickness(18),
                Child = new StackPanel
                {
                    Width = aboutImageSize,
                    Spacing = 14,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    Children =
                    {
                        new Image
                        {
                            Source = AboutLogo,
                            Width = aboutImageSize,
                            Height = aboutImageSize,
                            Stretch = Stretch.Uniform,
                            HorizontalAlignment = HorizontalAlignment.Center,
                        },
                        aboutText,
                        new StackPanel
                        {
                            Margin = new Thickness(0, 4, 0, 0),
                            HorizontalAlignment = HorizontalAlignment.Center,
                            Children = { okBtn },
                        },
                    },
                },
            },
        };

        okBtn.Click += (_, _) => dlg.Close();
        await dlg.ShowDialog(this);
    }

    private async Task OnPreferencesAsync()
    {
        MtcTabPrototype? owner = ResolveCurrentMtcTabContext() ?? ActiveMtcTab;
        if (owner is not null)
            EnsureMtcTabSessionBound(owner);

        EmbeddedMtcDebugConfig debugPrefs = GetCurrentDebugConfig();
        string gameName = GetDebugLogGameName();
        EmbeddedGameConfig? gameConfig = _embeddedGameConfig;
        if (gameConfig == null && !string.IsNullOrWhiteSpace(gameName))
        {
            gameConfig = await LoadOrCreateEmbeddedGameConfigAsync(gameName);
            _embeddedGameConfig = gameConfig;
            if (owner is not null)
            {
                owner.EmbeddedGameConfig = gameConfig;
                owner.EmbeddedGameName = gameName;
            }
        }

        bool saved = await new PreferencesDialog(_appPrefs, debugPrefs, GetCurrentJsonRpcConfig(), gameConfig, gameName).ShowDialog<bool>(this);
        if (!saved)
        {
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
            return;
        }

        AppPaths.SetConfiguredProgramDir(_appPrefs.ProgramDirectory);
        UpdateMtcPerfInstrumentationState();
        _buffer.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines);
        await ClearScriptDirectoryFromAllGameConfigsAsync();
        RefreshRuntimeScriptDirectoryFromPreferences();
        await SaveCurrentDebugConfigAsync();
        if (owner is not null)
            CaptureMtcTabSession(owner);
        ApplyDebugLoggingPreferences();
        ApplyJsonRpcPreferences();
        ApplyNetworkWatchdogPreferences();
        if (!_appPrefs.UpdateChecksEnabled)
            HideMtcUpdateBanner();
        ApplySessionLogSettings(_embeddedGameConfig);
        ApplyRedAlertPreference();
        ApplyScriptWindowStayInFrontPreference();
        RebuildScriptsMenu();
        PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
    }

    private async Task SaveCurrentDebugConfigAsync()
    {
        if (_embeddedGameConfig == null)
            return;

        string? rawGameName = !string.IsNullOrWhiteSpace(_embeddedGameConfig.Name)
            ? _embeddedGameConfig.Name
            : (!string.IsNullOrWhiteSpace(_embeddedGameName) ? _embeddedGameName : _state.GameName);
        if (string.IsNullOrWhiteSpace(rawGameName))
            return;

        string gameName = NormalizeGameName(rawGameName);
        await SaveEmbeddedGameConfigAsync(gameName, _embeddedGameConfig);
    }

    private Task OnMacrosAsync()
    {
        var owner = ActiveMtcTab;
        if (owner?.MacroSettingsDialog is { } existing)
        {
            if (existing.WindowState == WindowState.Minimized)
                existing.WindowState = WindowState.Normal;

            existing.Activate();
            return Task.CompletedTask;
        }

        var dialog = new MacroSettingsDialog(
            _appPrefs.MacroBindings
                .Select(binding => new AppPreferences.MacroBinding
                {
                    Hotkey = binding.Hotkey,
                    Macro = binding.Macro,
                })
                .ToArray(),
            (macro, count) => ExecuteInOptionalMtcTabSessionAsync(owner, () => PlayConfiguredMacroBurstAsync(macro, count)),
            SaveMacroBindings);

        if (owner != null)
            owner.MacroSettingsDialog = dialog;
        dialog.ShowActivated = false;
        dialog.Closed += (_, _) =>
        {
            ExecuteInOptionalMtcTabSession(owner, () =>
            {
                if (owner != null && ReferenceEquals(owner.MacroSettingsDialog, dialog))
                    owner.MacroSettingsDialog = null;

                UpdateTerminalLiveSelector();
            });
        };

        ShowMtcTabOwnedWindow(owner, dialog, activate: false);
        UpdateTerminalLiveSelector();
        FocusActiveTerminal();
        return Task.CompletedTask;
    }

    private void SaveMacroBindings(IReadOnlyList<AppPreferences.MacroBinding> bindings)
    {
        _appPrefs.MacroBindings.Clear();
        foreach (AppPreferences.MacroBinding binding in bindings)
        {
            _appPrefs.MacroBindings.Add(new AppPreferences.MacroBinding
            {
                Hotkey = binding.Hotkey,
                Macro = binding.Macro,
            });
        }

        _appPrefs.Save();
    }

    private void ApplyDebugLoggingPreferences()
    {
        MtcTabPrototype? owner = ResolveCurrentMtcTabContext();
        IDisposable? runtimeScope = owner is null ? null : Core.GlobalModules.UseRuntimeContext(owner.RuntimeContext);
        try
        {
            AppPaths.SetConfiguredProgramDir(_appPrefs.ProgramDirectory);
            string programDir = AppPaths.ProgramDir;
            Core.GlobalModules.ProgramDir = programDir;
            EmbeddedMtcDebugConfig debugPrefs = GetCurrentDebugConfig();
            Core.GlobalModules.PreferPreparedVm = _appPrefs.PreparedVmEnabled;
            Core.GlobalModules.ScriptInfiniteLoopProtectionEnabled = _appPrefs.ScriptInfiniteLoopProtectionEnabled;
            Core.GlobalModules.EnableVmMetrics = _appPrefs.VmMetricsEnabled;
            Core.GlobalModules.PreparedScriptCacheLimitBytes =
                Math.Max(1, _appPrefs.PreparedScriptCacheLimitKb) * 1024L;
            Core.GlobalModules.MombotHotkeyPrewarmLimitBytes =
                Math.Max(1, _appPrefs.MombotHotkeyPrewarmLimitKb) * 1024L;
            AppPaths.EnsureDebugLogDir();
            string debugGameName = GetDebugLogGameName();
            Core.GlobalModules.ConfigureDebugLogging(
                string.IsNullOrWhiteSpace(debugGameName)
                    ? AppPaths.GetDebugLogPath()
                    : AppPaths.GetDebugLogPathForGame(debugGameName),
                debugPrefs.DebugLoggingEnabled,
                debugPrefs.VerboseDebugLogging,
                debugPrefs.TriggerDebugLogging,
                debugPrefs.ScriptTraceDebugLogging,
                debugPrefs.AutoRecorderDebugLogging,
                debugPrefs.VariablePersistenceDebugLogging);
            Core.GlobalModules.ConfigureHaggleDebugLogging(
                AppPaths.GetPortHaggleDebugLogPath(),
                debugPrefs.DebugPortHaggleEnabled,
                AppPaths.GetPlanetHaggleDebugLogPath(),
                debugPrefs.DebugPlanetHaggleEnabled);
            Core.GlobalModules.ConfigureDatabaseCorrectionLogging(
                string.IsNullOrWhiteSpace(debugGameName)
                    ? AppPaths.GetDatabaseCorrectionLogPath()
                    : AppPaths.GetDatabaseCorrectionLogPathForGame(debugGameName),
                debugPrefs.DebugLoggingEnabled && debugPrefs.DebugDatabaseChanges);
            _standaloneNativeHaggle.SetPortHaggleMode(ResolveGlobalPortHaggleMode());
            _standaloneNativeHaggle.SetPlanetHaggleMode(ResolveGlobalPlanetHaggleMode());
            RefreshSessionLogTarget();
            if (_gameInstance != null)
                _gameInstance.Logger.LogDirectory = AppPaths.GetDebugLogDir();
        }
        finally
        {
            runtimeScope?.Dispose();
        }
    }

    private void RequestStatusBarRefresh()
    {
        var owner = PeekCurrentMtcTabContext();
        RecordMtcPerf(owner ?? ActiveMtcTab, "status.request");
        if (MtcPerfSwitches.DisableStatusBar)
        {
            RecordMtcSubsystemSkipped(owner ?? ActiveMtcTab, "status-bar");
            return;
        }

        if (owner is not null && !IsActiveMtcTab(owner))
        {
            MarkMtcTabVisualStateDirty(owner, statusBar: true);
            owner.StatusRefreshTimer?.Stop();
            return;
        }

        if (!Dispatcher.UIThread.CheckAccess())
        {
            if (owner is null)
                return;

            if (Interlocked.Exchange(ref owner.StatusRefreshPostScheduled, 1) == 0)
            {
                RecordMtcUiPost(owner, "status.request", DispatcherPriority.Background);
                Dispatcher.UIThread.Post(() =>
                {
                    RecordMtcUiRun(owner, "status.request");
                    Interlocked.Exchange(ref owner.StatusRefreshPostScheduled, 0);
                    if (!IsActiveMtcTab(owner))
                    {
                        MarkMtcTabVisualStateDirty(owner, statusBar: true);
                        return;
                    }

                    ExecuteInMtcTabSession(owner, RequestStatusBarRefresh);
                }, DispatcherPriority.Background);
            }
            else
            {
                RecordMtcPerf(owner, "status.request.coalesced");
            }

            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        var activeOwner = ActiveMtcTab;
        if (activeOwner is not null && activeOwner.Id != _activeMtcTabId)
        {
            CaptureMtcTabSession(activeOwner);
            return;
        }

        if (activeOwner is not null)
        {
            _deferredStatusBarRefresh = true;
            activeOwner.DeferredStatusBarRefresh = true;
            TimeSpan delay = GetStatusBarRefreshDelay();
            if (delay <= TimeSpan.Zero)
            {
                RefreshStatusBar();
                return;
            }

            DispatcherTimer statusRefreshTimer = EnsureMtcTabStatusRefreshTimer(activeOwner);
            statusRefreshTimer.Interval = delay;
            if (!statusRefreshTimer.IsEnabled)
                statusRefreshTimer.Start();
            return;
        }

        RefreshStatusBar();
    }

    private TimeSpan GetStatusBarRefreshDelay()
    {
        if (HasPendingTerminalDisplayBacklog())
            return TimeSpan.FromMilliseconds(350);

        long lastRefreshTicks = Volatile.Read(ref _lastStatusBarRefreshTicks);
        if (lastRefreshTicks == 0)
            return TimeSpan.Zero;

        TimeSpan elapsed = Stopwatch.GetElapsedTime(lastRefreshTicks);
        TimeSpan minInterval = TimeSpan.FromMilliseconds(250);
        return elapsed >= minInterval ? TimeSpan.Zero : minInterval - elapsed;
    }

    private DispatcherTimer EnsureMtcTabStatusRefreshTimer(MtcTabPrototype tab)
    {
        if (tab.StatusRefreshTimer is null)
        {
            tab.StatusRefreshTimer = new DispatcherTimer(DispatcherPriority.Background);
        }

        if (!tab.StatusRefreshTimerWired)
        {
            tab.StatusRefreshTimer.Tick += (_, _) =>
            {
                tab.StatusRefreshTimer?.Stop();
                if (tab.Id != Volatile.Read(ref _activeMtcTabId))
                    return;

                RecordMtcUiRun(tab, "status.timer");
                ExecuteInOptionalMtcTabSession(tab, RefreshStatusBar);
            };
            tab.StatusRefreshTimerWired = true;
        }

        return tab.StatusRefreshTimer;
    }

    private static int CountTransportLines(byte[] bytes)
    {
        int count = 0;
        for (int i = 0; i < bytes.Length; i++)
        {
            if (bytes[i] == 0x0D)
                count++;
        }

        return count;
    }
    private string GetDebugLogGameName()
    {
        if (_gameInstance != null && !string.IsNullOrWhiteSpace(_gameInstance.GameName))
            return NormalizeGameName(_gameInstance.GameName);

        if (!string.IsNullOrWhiteSpace(_embeddedGameName))
            return NormalizeGameName(_embeddedGameName);

        if (!string.IsNullOrWhiteSpace(_embeddedGameConfig?.Name))
            return NormalizeGameName(_embeddedGameConfig.Name);

        if (!string.IsNullOrWhiteSpace(_currentProfilePath) || !string.IsNullOrWhiteSpace(_state.GameName))
            return DeriveGameName();

        return string.Empty;
    }

    private void RefreshSessionLogTarget(string? scriptDirectory = null)
    {
        string programDir = AppPaths.ProgramDir;
        _sessionLog.ProgramDir = programDir;
        _sessionLog.LogDirectory = AppPaths.GetDebugLogDir();
        _sessionLog.SetLogIdentity(DeriveGameName());
        _sessionLog.ScriptLoggingScope = CurrentInterpreter;
    }

    private void ApplySessionLogSettings(EmbeddedGameConfig? gameConfig)
    {
        if (gameConfig == null)
            return;

        _sessionLog.LogEnabled = gameConfig.LogEnabled;
        _sessionLog.LogData = gameConfig.LogEnabled;
        _sessionLog.LogAnsiCompanion = gameConfig.LogAnsiCompanion;
        _sessionLog.LogANSI = gameConfig.LogAnsiCompanion ? false : gameConfig.LogAnsi;
        _sessionLog.BinaryLogs = gameConfig.LogBinary;
        _sessionLog.NotifyPlayCuts = gameConfig.NotifyPlayCuts;
        _sessionLog.MaxPlayDelay = gameConfig.MaxPlayDelay;
    }

}
