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
    private void RebuildProxyMenu(bool force = false)
    {
        RecordMtcPerf(PeekCurrentMtcTabContext() ?? ActiveMtcTab, force ? "menu.proxy.rebuild.force" : "menu.proxy.rebuild");
        if (MtcPerfSwitches.DisableMenus)
        {
            RecordMtcSubsystemSkipped(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "menus");
            return;
        }

        if (!Dispatcher.UIThread.CheckAccess())
        {
            RecordMtcUiPost(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "menu.proxy.rebuild", DispatcherPriority.Background);
            PostToCurrentMtcTabSession(() => RebuildProxyMenu(force), DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (AreSharedMenusOpen && !force)
        {
            _proxyMenuRebuildPending = true;
            _nativeMenuRefreshPending = true;
            return;
        }

        _proxyMenuRebuildPending = false;

        string gameName = _embeddedGameName ?? DeriveGameName();
        bool hasGame = !string.IsNullOrWhiteSpace(gameName);
        bool hasDatabase = _sessionDb != null;
        bool hasInterpreter = CurrentInterpreter != null;
        bool canPlayCapture = _gameInstance != null;
        bool canRunProxyScripts = hasInterpreter || CanUseRemoteProxyScripts();
        var owner = CurrentMtcTabContext();

        var proxyItems = BuildProxyMenuItems(gameName, hasGame, hasDatabase, hasInterpreter, canPlayCapture);
        _proxyMenu.ItemsSource = proxyItems;
        bool canUseManagedRemote = IsManagedRemoteProxyGame();
        _proxyMenu.IsEnabled = _gameInstance != null || canUseManagedRemote;
        _botMenu.IsEnabled = hasInterpreter || canUseManagedRemote;
        if (canUseManagedRemote)
            RebuildManagedRemoteBotMenu(hasInterpreter || canUseManagedRemote, owner);
        else
            _botMenu.ItemsSource = BuildTopLevelBotMenuItems(hasInterpreter);
        _quickMenu.ItemsSource = BuildQuickMenuItems(canRunProxyScripts);
        _quickMenu.IsEnabled = canRunProxyScripts;
        _scriptsMenu.IsEnabled = canRunProxyScripts;
        RebuildAiMenu(force);
        RequestNativeAppMenuRefresh(force);
        RequestNativeDockMenuRefresh(force);
    }

    private void RebuildAiMenu(bool force = false)
    {
        RecordMtcPerf(PeekCurrentMtcTabContext() ?? ActiveMtcTab, force ? "menu.ai.rebuild.force" : "menu.ai.rebuild");
        if (MtcPerfSwitches.DisableMenus)
        {
            RecordMtcSubsystemSkipped(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "menus");
            return;
        }

        if (!Dispatcher.UIThread.CheckAccess())
        {
            RecordMtcUiPost(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "menu.ai.rebuild", DispatcherPriority.Background);
            PostToCurrentMtcTabSession(() => RebuildAiMenu(force), DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (AreSharedMenusOpen && !force)
        {
            _aiMenuRebuildPending = true;
            _nativeMenuRefreshPending = true;
            return;
        }

        _aiMenuRebuildPending = false;

        List<object> items = BuildAiMenuItems();
        _aiMenu.ItemsSource = items;
        bool hasItems = items.OfType<MenuItem>().Any(item => item.IsEnabled);
        _aiMenu.IsEnabled = hasItems;
        _aiMenu.IsVisible = hasItems;
    }

    private List<object> BuildProxyMenuItems(string gameName, bool hasGame, bool hasDatabase, bool hasInterpreter, bool canPlayCapture)
    {
        var items = new List<object>
        {
            new MenuItem
            {
                Header = hasGame ? EscapeMenuHeaderText($"Current Game: {gameName}") : "No game selected",
                IsEnabled = false,
            },
            new Separator(),
        };

        var stopMenu = new MenuItem { Header = "_Stop", IsEnabled = hasInterpreter || CanUseRemoteProxyScripts() };
        stopMenu.ItemsSource = BuildStopMenuItems();
        stopMenu.SubmenuOpened += (_, _) => stopMenu.ItemsSource = BuildStopMenuItems();
        items.Add(stopMenu);

        items.Add(new Separator());

        var exportMenu = new MenuItem { Header = "_Export", IsEnabled = hasDatabase };
        exportMenu.ItemsSource = BuildProxyExportItems(hasDatabase);
        items.Add(exportMenu);

        var importMenu = new MenuItem { Header = "_Import", IsEnabled = hasDatabase };
        importMenu.ItemsSource = BuildProxyImportItems(hasDatabase);
        items.Add(importMenu);

        var loggingMenu = new MenuItem { Header = "_Logging", IsEnabled = hasGame };
        loggingMenu.ItemsSource = BuildProxyLoggingItems(canPlayCapture, hasGame);
        items.Add(loggingMenu);
        items.Add(new Separator());

        int listenPort = GetConfiguredProxyListenPort();
        bool listenConfigured = _state.EmbeddedProxy && _state.ListenForConnections;
        bool listenerActive = _gameInstance?.IsLocalListenerActive == true;
        var listenItem = new MenuItem
        {
            Header = EscapeMenuHeaderText($"Listen on Port {listenPort}"),
            IsEnabled = _gameInstance != null && listenConfigured,
            ToggleType = MenuItemToggleType.CheckBox,
            IsChecked = listenerActive,
        };
        listenItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => ToggleProxyListenerAsync(!listenerActive));
        items.Add(listenItem);
        items.Add(new Separator());

        var advancedSettings = new MenuItem { Header = "_Advanced Settings…", IsEnabled = true };
        advancedSettings.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(OnAdvancedProxySettingsAsync);
        items.Add(advancedSettings);

        return items;
    }

    private int GetConfiguredProxyListenPort()
    {
        int port = _embeddedGameConfig?.ListenPort > 0
            ? _embeddedGameConfig.ListenPort
            : _state.ListenPort;
        return NormalizeListenPort(port);
    }

    private async Task ToggleProxyListenerAsync(bool enabled)
    {
        if (_gameInstance == null || !_state.ListenForConnections)
            return;

        int listenPort = GetConfiguredProxyListenPort();
        try
        {
            await _gameInstance.ConfigureLocalListenerAsync(enabled, listenPort);
            string status = enabled ? "listening" : "stopped listening";
            _parser.Feed($"\x1b[1;36m[Proxy {status} on port {listenPort}]\x1b[0m\r\n");
        }
        catch (Exception ex)
        {
            _parser.Feed($"\x1b[1;31m[Listen failed: {ex.Message}]\x1b[0m\r\n");
            Core.GlobalModules.DebugLog($"[MTC.ProxyMenu] failed to toggle listener: {ex}\n");
        }
        finally
        {
            _buffer.Dirty = true;
            RebuildProxyMenu();
        }
    }

    private List<object> BuildStopMenuItems()
    {
        var items = new List<object>();
        var interpreter = CurrentInterpreter;
        if (interpreter == null)
        {
            if (CanUseRemoteProxyScripts())
            {
                var killRemote = new MenuItem { Header = "_Kill Script by ID…" };
                killRemote.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(OnRemoteProxyKillScriptByIdAsync);
                items.Add(killRemote);
            }
            else
            {
                items.Add(new MenuItem { Header = "No proxy scripts active", IsEnabled = false });
            }
            return items;
        }

        var stopAll = new MenuItem { Header = "_All Scripts" };
        stopAll.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => OnProxyForceStopAllScriptsAsync(includeSystemScripts: false));
        items.Add(stopAll);

        var stopNonSystem = new MenuItem { Header = "All _Non-System Scripts" };
        stopNonSystem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => OnProxyStopAllScriptsAsync(includeSystemScripts: false));
        items.Add(stopNonSystem);

        var scripts = Core.ProxyGameOperations.GetRunningScripts(interpreter);
        if (scripts.Count == 0)
        {
            items.Add(new Separator());
            items.Add(new MenuItem { Header = "No active scripts", IsEnabled = false });
            return items;
        }

        items.Add(new Separator());

        foreach (var script in scripts)
        {
            int scriptId = script.Id;
            var item = new MenuItem
            {
                Header = EscapeMenuHeaderText(script.IsSystemScript ? $"{script.Name} (system)" : script.Name)
            };
            item.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => OnProxyStopScriptAsync(scriptId));
            items.Add(item);
        }

        return items;
    }

    private List<object> BuildProxyExportItems(bool enabled)
    {
        var items = new List<object>();

        var exportWarps = new MenuItem { Header = "Export _Warps", IsEnabled = enabled };
        exportWarps.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ExportWarpsAsync);
        items.Add(exportWarps);

        var exportBubbles = new MenuItem { Header = "Export _Bubbles", IsEnabled = enabled };
        exportBubbles.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ExportBubblesAsync);
        items.Add(exportBubbles);

        var exportDeadends = new MenuItem { Header = "Export _Deadends", IsEnabled = enabled };
        exportDeadends.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ExportDeadendsAsync);
        items.Add(exportDeadends);

        var exportTwx = new MenuItem { Header = "Export _TWX", IsEnabled = enabled };
        exportTwx.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ExportTwxAsync);
        items.Add(exportTwx);

        return items;
    }

    private List<object> BuildProxyImportItems(bool enabled)
    {
        var items = new List<object>();

        var importWarps = new MenuItem { Header = "Import _Warps", IsEnabled = enabled };
        importWarps.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ImportWarpsAsync);
        items.Add(importWarps);

        var importTwx = new MenuItem { Header = "Import T_WX", IsEnabled = enabled };
        importTwx.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ImportTwxAsync);
        items.Add(importTwx);

        return items;
    }

    private List<object> BuildProxyLoggingItems(bool canPlayCapture, bool hasGame)
    {
        var items = new List<object>();

        var playCapture = new MenuItem { Header = "_Play Capture…", IsEnabled = canPlayCapture };
        playCapture.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(PlayCaptureAsync);
        items.Add(playCapture);

        var history = new MenuItem { Header = "_History…", IsEnabled = hasGame && _gameInstance != null };
        history.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ShowProxyHistoryAsync);
        items.Add(history);

        var ansiCompanion = new MenuItem
        {
            Header = (_embeddedGameConfig?.LogAnsiCompanion ?? false) ? "Disable ANSI Game Log" : "Create ANSI Game Log",
            IsEnabled = hasGame,
        };
        ansiCompanion.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ToggleAnsiCompanionLoggingAsync);
        items.Add(ansiCompanion);

        items.Add(new Separator());

        EmbeddedMtcDebugConfig debugPrefs = GetCurrentDebugConfig();
        var debugPortHaggle = new MenuItem
        {
            Header = debugPrefs.DebugPortHaggleEnabled ? "Disable Port Haggle Debug" : "Debug Port Haggle",
            IsEnabled = hasGame,
        };
        debugPortHaggle.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(TogglePortHaggleDebugLoggingAsync);
        items.Add(debugPortHaggle);

        var debugPlanetHaggle = new MenuItem
        {
            Header = debugPrefs.DebugPlanetHaggleEnabled ? "Disable Planet Haggle Debug" : "Debug Planet Haggle",
            IsEnabled = hasGame,
        };
        debugPlanetHaggle.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(TogglePlanetHaggleDebugLoggingAsync);
        items.Add(debugPlanetHaggle);

        return items;
    }

    private async Task ToggleAnsiCompanionLoggingAsync()
    {
        string gameName = DeriveGameName();
        if (string.IsNullOrWhiteSpace(gameName))
            return;

        EmbeddedGameConfig config = _embeddedGameConfig ?? await LoadOrCreateEmbeddedGameConfigAsync(gameName);
        config.LogAnsiCompanion = !config.LogAnsiCompanion;
        if (config.LogAnsiCompanion)
        {
            config.LogEnabled = true;
            config.LogAnsi = false;
        }

        _embeddedGameConfig = config;
        ApplySessionLogSettings(config);
        if (_gameInstance != null)
        {
            _gameInstance.Logger.LogANSI = config.LogAnsiCompanion ? false : config.LogAnsi;
            _gameInstance.Logger.LogAnsiCompanion = config.LogAnsiCompanion;
        }
        await SaveEmbeddedGameConfigAsync(gameName, config);

        string safeGameName = Core.SharedPaths.SanitizeFileComponent(gameName);
        string ansiPath = Path.Combine(AppPaths.GetDebugLogDir(), $"{DateTime.Today:yyyy-MM-dd} {safeGameName}_ansi.log");
        string status = config.LogAnsiCompanion ? "enabled" : "disabled";
        string pathText = config.LogAnsiCompanion ? $": {ansiPath}" : string.Empty;
        _parser.Feed($"\x1b[1;36m[ANSI game log {status}{pathText}]\x1b[0m\r\n");
        _buffer.Dirty = true;
        RebuildScriptsMenu();
        RequestNativeAppMenuRefresh();
    }

    private async Task TogglePortHaggleDebugLoggingAsync()
    {
        EmbeddedMtcDebugConfig debugPrefs = GetCurrentDebugConfig();
        debugPrefs.DebugPortHaggleEnabled = !debugPrefs.DebugPortHaggleEnabled;
        await SaveCurrentDebugConfigAsync();
        ApplyDebugLoggingPreferences();
        string status = debugPrefs.DebugPortHaggleEnabled ? "enabled" : "disabled";
        _parser.Feed($"\x1b[1;36m[Port haggle debug {status}: {AppPaths.GetPortHaggleDebugLogPath(CurrentInterpreter?.ScriptDirectory ?? _appPrefs.ScriptsDirectory)}]\x1b[0m\r\n");
        _buffer.Dirty = true;
        RebuildScriptsMenu();
        RequestNativeAppMenuRefresh();
    }

    private async Task TogglePlanetHaggleDebugLoggingAsync()
    {
        EmbeddedMtcDebugConfig debugPrefs = GetCurrentDebugConfig();
        debugPrefs.DebugPlanetHaggleEnabled = !debugPrefs.DebugPlanetHaggleEnabled;
        await SaveCurrentDebugConfigAsync();
        ApplyDebugLoggingPreferences();
        string status = debugPrefs.DebugPlanetHaggleEnabled ? "enabled" : "disabled";
        _parser.Feed($"\x1b[1;36m[Planet haggle debug {status}: {AppPaths.GetPlanetHaggleDebugLogPath(CurrentInterpreter?.ScriptDirectory ?? _appPrefs.ScriptsDirectory)}]\x1b[0m\r\n");
        _buffer.Dirty = true;
        RebuildScriptsMenu();
        RequestNativeAppMenuRefresh();
    }

    private List<object> BuildQuickMenuItems(bool enabled)
    {
        var items = new List<object>();
        if (!enabled)
        {
            items.Add(new MenuItem { Header = "Proxy scripts are not active", IsEnabled = false });
            return items;
        }

        if (IsManagedRemoteProxyGame())
        {
            items.Add(new MenuItem { Header = "Remote scripts are in the Scripts menu", IsEnabled = false });
            return items;
        }

        string scriptDirectory = GetEffectiveProxyScriptDirectory();
        string programDir = GetEffectiveProxyProgramDir(scriptDirectory);
        var groups = Core.ProxyMenuCatalog.BuildQuickLoadGroups(programDir, scriptDirectory);

        foreach (var group in groups)
        {
            var groupMenu = new MenuItem { Header = EscapeMenuHeaderText(group.Name) };
            var groupItems = new List<object>();
            foreach (var entry in group.Entries)
            {
                string relativePath = entry.RelativePath;
                var item = new MenuItem { Header = EscapeMenuHeaderText(entry.DisplayName) };
                item.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => LoadQuickScriptAsync(relativePath));
                groupItems.Add(item);
            }

            groupMenu.ItemsSource = groupItems;
            items.Add(groupMenu);
        }

        if (groups.Count == 0)
            items.Add(new MenuItem { Header = "No quick-load scripts found", IsEnabled = false });

        return items;
    }

    private List<object> BuildAiMenuItems()
    {
        var gameAgentItem = new MenuItem { Header = "_Game Agent" };
        gameAgentItem.Click += (_, _) => ExecuteInActiveMtcTabSession(OpenGameAgentWindow);
        var configureItem = new MenuItem { Header = "_Configure Game Agent..." };
        configureItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(ConfigureGameAgentAsync);
        var replayItem = new MenuItem { Header = "Game Agent _Replay..." };
        replayItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(OpenGameAgentReplayWindowAsync);

        var items = new List<object>
        {
            gameAgentItem,
            configureItem,
            replayItem,
        };
        return items;
    }

    private void RebuildManagedRemoteBotMenu(bool enabled, MtcTabPrototype? owner)
    {
        _botMenu.ItemsSource = BuildTopLevelBotMenuItems(enabled, BuildRemoteBotLoadingSections());
        if (!TryGetCurrentProxyManagementClient(out ProxyManagementClient? remoteClient))
            return;

        _ = Task.Run(async () => await remoteClient!.ListBotConfigsAsync())
            .ContinueWith(t =>
            {
                ExecuteInOptionalMtcTabSession(owner, () =>
                {
                    if (!PrepareMtcTabVisualRefresh() || !IsManagedRemoteProxyGame())
                        return;

                    IReadOnlyList<StoredBotSection> bots = t.IsFaulted
                        ? BuildRemoteBotErrorSections()
                        : BuildRemoteBotSections(t.Result);
                    _botMenu.ItemsSource = BuildTopLevelBotMenuItems(enabled, bots);
                    RequestNativeAppMenuRefresh();
                });
            }, TaskScheduler.FromCurrentSynchronizationContext());
    }

    private List<object> BuildTopLevelBotMenuItems(bool enabled, IReadOnlyList<StoredBotSection>? configuredBots = null)
    {
        var items = new List<object>();
        BotRuntimeState runtime = GetBotRuntimeState();
        bool managedRemote = IsManagedRemoteProxyGame();
        IReadOnlyList<StoredBotSection> bots = configuredBots ?? LoadConfiguredBotSections();
        bool nativeConfigured = managedRemote
            ? bots.Any(bot => bot.IsNative && bot.ScriptAvailable)
            : IsNativeMombotConfiguredForStart();
        bool hasStartableExternalBot = bots.Any(bot => !bot.IsNative && (managedRemote || bot.ScriptAvailable));

        var startMenu = new MenuItem { Header = "_Start", IsEnabled = enabled && (nativeConfigured || hasStartableExternalBot) };
        startMenu.ItemsSource = BuildBotStartMenuItems(enabled, bots);
        if (!managedRemote)
        {
            startMenu.SubmenuOpened += (_, _) =>
                startMenu.ItemsSource = BuildBotStartMenuItems(enabled, LoadConfiguredBotSections());
        }
        items.Add(startMenu);

        var stopItem = new MenuItem { Header = "S_top", IsEnabled = runtime.IsRunning };
        stopItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(StopActiveBotAsync);
        items.Add(stopItem);

        var configureMenu = new MenuItem { Header = "_Configure" };
        configureMenu.ItemsSource = BuildBotConfigureMenuItems(bots);
        if (!managedRemote)
        {
            configureMenu.SubmenuOpened += (_, _) =>
                configureMenu.ItemsSource = BuildBotConfigureMenuItems(LoadConfiguredBotSections());
        }
        items.Add(configureMenu);

        var addBot = new MenuItem { Header = "_Add Bot…" };
        addBot.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(AddBotAsync);
        items.Add(addBot);

        return items;
    }

    private List<object> BuildBotStartMenuItems(bool proxyReady, IReadOnlyList<StoredBotSection> bots)
    {
        var items = new List<object>();
        bool managedRemote = IsManagedRemoteProxyGame();
        if (!proxyReady || (_gameInstance == null || CurrentInterpreter == null) && !managedRemote)
        {
            items.Add(new MenuItem { Header = "Embedded proxy is not running", IsEnabled = false });
            return items;
        }

        BotRuntimeState runtime = GetBotRuntimeState();
        StoredBotSection nativeBot = bots.First(bot => bot.IsNative);
        bool nativeConfigured = managedRemote ? nativeBot.ScriptAvailable : IsNativeMombotConfiguredForStart();
        var nativeItem = new MenuItem
        {
            Header = runtime.NativeRunning
                ? $"{NativeMombotMenuLabel} (running)"
                : nativeConfigured
                    ? NativeMombotMenuLabel
                    : $"{NativeMombotMenuLabel} (configure first)",
            IsEnabled = runtime.NativeRunning || nativeConfigured,
        };
        string nativeSectionName = nativeBot.SectionName;
        nativeItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => StartConfiguredBotFromCurrentTabAsync(nativeSectionName));
        items.Add(nativeItem);

        if (!managedRemote)
        {
            var nativeNewGameItem = new MenuItem
            {
                Header = "New Game",
                IsEnabled = nativeConfigured && !runtime.NativeRunning,
            };
            nativeNewGameItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => StartConfiguredNativeMombotNewGameFromCurrentTabAsync(nativeSectionName));
            items.Add(nativeNewGameItem);
        }

        List<StoredBotSection> externalBots = bots
            .Where(bot => !bot.IsNative)
            .OrderBy(bot => bot.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (externalBots.Count == 0)
        {
            items.Add(new Separator());
            items.Add(new MenuItem { Header = "No external bots configured", IsEnabled = false });
            return items;
        }

        items.Add(new Separator());
        foreach (StoredBotSection bot in externalBots)
        {
            string sectionName = bot.SectionName;
            string header = bot.DisplayName;
            if (string.Equals(runtime.ExternalBotName, bot.Config.Name, StringComparison.OrdinalIgnoreCase))
                header += " (running)";
            else if (!managedRemote && !bot.ScriptAvailable)
                header += " (script missing)";

            var item = new MenuItem
            {
                Header = EscapeMenuHeaderText(header),
                IsEnabled = managedRemote || bot.ScriptAvailable,
            };
            item.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => StartConfiguredBotFromCurrentTabAsync(sectionName));
            items.Add(item);
        }

        return items;
    }

    private List<object> BuildBotConfigureMenuItems(IReadOnlyList<StoredBotSection> bots)
    {
        var items = new List<object>();

        StoredBotSection nativeBot = bots.First(bot => bot.IsNative);
        var nativeItem = new MenuItem { Header = NativeMombotMenuLabel };
        string nativeSectionName = nativeBot.SectionName;
        nativeItem.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => ConfigureBotFromCurrentTabAsync(nativeSectionName));
        items.Add(nativeItem);

        List<StoredBotSection> externalBots = bots
            .Where(bot => !bot.IsNative)
            .OrderBy(bot => bot.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (externalBots.Count == 0)
        {
            items.Add(new Separator());
            items.Add(new MenuItem { Header = "No external bots configured", IsEnabled = false });
            return items;
        }

        items.Add(new Separator());
        foreach (StoredBotSection bot in externalBots)
        {
            string sectionName = bot.SectionName;
            var item = new MenuItem
            {
                Header = EscapeMenuHeaderText(bot.DisplayName),
            };
            item.Click += (_, _) => _ = ExecuteInActiveMtcTabSessionAsync(() => ConfigureBotFromCurrentTabAsync(sectionName));
            items.Add(item);
        }

        return items;
    }

    private StoredBotSection? ResolveConfiguredBotSectionForCurrentTab(string sectionName)
    {
        IReadOnlyList<StoredBotSection> currentBots = LoadConfiguredBotSections();
        if (string.Equals(sectionName, Core.ProxyMenuCatalog.NativeMombotSectionName, StringComparison.OrdinalIgnoreCase))
            return currentBots.FirstOrDefault(bot => bot.IsNative);

        return currentBots.FirstOrDefault(bot =>
            string.Equals(bot.SectionName, sectionName, StringComparison.OrdinalIgnoreCase));
    }

    private async Task StartConfiguredBotFromCurrentTabAsync(string sectionName)
    {
        StoredBotSection? bot = ResolveConfiguredBotSectionForCurrentTab(sectionName);
        if (bot == null)
        {
            await ShowMessageAsync("Bot", "That bot configuration is no longer available.");
            return;
        }

        await StartConfiguredBotAsync(bot);
    }

    private async Task StartConfiguredNativeMombotNewGameFromCurrentTabAsync(string sectionName)
    {
        StoredBotSection? bot = ResolveConfiguredBotSectionForCurrentTab(sectionName);
        if (bot == null || !bot.IsNative)
        {
            await ShowMessageAsync("Bot", "The native MomBot configuration is no longer available.");
            return;
        }

        await StartConfiguredNativeMombotNewGameAsync(bot);
    }

    private async Task ConfigureBotFromCurrentTabAsync(string sectionName)
    {
        StoredBotSection? bot = ResolveConfiguredBotSectionForCurrentTab(sectionName);
        if (bot == null)
        {
            await ShowMessageAsync("Bot", "That bot configuration is no longer available.");
            return;
        }

        await ConfigureBotAsync(bot);
    }

    private IReadOnlyList<StoredBotSection> LoadConfiguredBotSections()
    {
        string scriptDirectory = GetEffectiveProxyScriptDirectory();
        string programDir = GetEffectiveProxyProgramDir(scriptDirectory);
        IReadOnlyList<Core.TwxpConfigSection> sections = Core.TwxpConfigStore.LoadSections(programDir);
        var storedBots = new List<StoredBotSection>
        {
            CreateNativeStoredBotSection(programDir, scriptDirectory)
        };

        foreach (Core.TwxpConfigSection section in sections)
        {
            if (!section.Name.StartsWith("bot:", StringComparison.OrdinalIgnoreCase) ||
                Core.ProxyMenuCatalog.IsNativeBotSection(section))
            {
                continue;
            }

            storedBots.Add(CreateStoredBotSection(section, programDir, scriptDirectory));
        }

        return storedBots;
    }

    private StoredBotSection CreateNativeStoredBotSection(string programDir, string scriptDirectory)
    {
        Core.BotConfig config = BuildCurrentGameNativeBotConfig();
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Native"] = "1",
            ["Configured"] = config.Properties.TryGetValue("Configured", out string? configured) ? configured : "0",
            ["Name"] = config.Name,
            ["Script"] = config.ScriptFile,
            ["Description"] = config.Description,
            ["AutoStart"] = config.AutoStart ? "1" : "0",
            ["NameVar"] = config.NameVar,
            ["CommsVar"] = config.CommsVar,
            ["LoginScript"] = config.LoginScript,
            ["Theme"] = config.Theme,
        };

        return new StoredBotSection(
            Core.ProxyMenuCatalog.NativeMombotSectionName,
            Core.ProxyMenuCatalog.GetBotAlias(Core.ProxyMenuCatalog.NativeMombotSectionName),
            NativeMombotMenuLabel,
            true,
            BotScriptsExist(config, programDir, scriptDirectory),
            config,
            values);
    }

    private IReadOnlyList<Core.TwxpConfigSection> EnsureNativeBotSectionInTwxpCfg(string programDir)
    {
        List<Core.TwxpConfigSection> sections = Core.TwxpConfigStore.LoadSections(programDir).ToList();
        Dictionary<string, string> defaults = BuildDefaultNativeBotValues();
        int nativeIndex = sections.FindIndex(Core.ProxyMenuCatalog.IsNativeBotSection);
        bool changed = false;

        if (nativeIndex < 0)
        {
            sections.Add(new Core.TwxpConfigSection(Core.ProxyMenuCatalog.NativeMombotSectionName, defaults));
            changed = true;
        }
        else
        {
            Core.TwxpConfigSection existing = sections[nativeIndex];
            Dictionary<string, string> merged = MergeBotValues(existing.Values, defaults);
            if (!ConfigValuesEqual(existing.Values, merged))
            {
                sections[nativeIndex] = new Core.TwxpConfigSection(existing.Name, merged);
                changed = true;
            }
        }

        if (changed)
            Core.TwxpConfigStore.SaveSections(programDir, sections);

        return sections;
    }

    private StoredBotSection CreateStoredBotSection(Core.TwxpConfigSection section, string programDir, string scriptDirectory)
    {
        bool isNative = Core.ProxyMenuCatalog.IsNativeBotSection(section);
        var values = isNative
            ? MergeBotValues(section.Values, BuildDefaultNativeBotValues())
            : new Dictionary<string, string>(section.Values, StringComparer.OrdinalIgnoreCase);
        if (isNative)
            values["LoginScript"] = "disabled";

        string alias = isNative
            ? Core.ProxyMenuCatalog.GetBotAlias(Core.ProxyMenuCatalog.NativeMombotSectionName)
            : Core.ProxyMenuCatalog.GetBotAlias(section.Name);
        string displayName = values.TryGetValue("Name", out string? configuredName) && !string.IsNullOrWhiteSpace(configuredName)
            ? configuredName.Trim()
            : alias;
        string scriptList = values.TryGetValue("Script", out string? configuredScripts)
            ? NormalizeBotScriptList(configuredScripts)
            : string.Empty;
        List<string> scripts = scriptList
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(script => script.Replace('\\', '/'))
            .Where(script => !string.IsNullOrWhiteSpace(script))
            .ToList();

        var config = new Core.BotConfig
        {
            Alias = alias,
            Name = displayName,
            ScriptFile = scripts.FirstOrDefault() ?? string.Empty,
            ScriptFiles = scripts,
            Description = values.TryGetValue("Description", out string? description) ? description : string.Empty,
            AutoStart = ParseTwxpBool(values.TryGetValue("AutoStart", out string? autoStart) ? autoStart : null, fallback: !isNative),
            NameVar = values.TryGetValue("NameVar", out string? nameVar) ? nameVar : string.Empty,
            CommsVar = values.TryGetValue("CommsVar", out string? commsVar) ? commsVar : string.Empty,
            LoginScript = values.TryGetValue("LoginScript", out string? loginScript) ? loginScript : string.Empty,
            Theme = values.TryGetValue("Theme", out string? theme) ? theme : string.Empty,
            Properties = new Dictionary<string, string>(values, StringComparer.OrdinalIgnoreCase),
        };

        return new StoredBotSection(
            section.Name,
            alias,
            isNative ? NativeMombotMenuLabel : displayName,
            isNative,
            isNative || BotScriptsExist(config, programDir, scriptDirectory),
            config,
            values);
    }

    private IReadOnlyList<StoredBotSection> BuildRemoteBotLoadingSections()
    {
        StoredBotSection native = CreateRemoteNativePlaceholder(scriptAvailable: false);
        return [native];
    }

    private IReadOnlyList<StoredBotSection> BuildRemoteBotErrorSections()
    {
        StoredBotSection native = CreateRemoteNativePlaceholder(scriptAvailable: false);
        return [native];
    }

    private IReadOnlyList<StoredBotSection> BuildRemoteBotSections(IReadOnlyList<ProxyManagedBotConfig> remoteBots)
    {
        var sections = new List<StoredBotSection>();
        ProxyManagedBotConfig? remoteMombot = remoteBots.FirstOrDefault(IsRemoteMombotConfig);
        sections.Add(remoteMombot != null
            ? CreateRemoteStoredBotSection(remoteMombot, isNative: true)
            : CreateRemoteNativePlaceholder(scriptAvailable: false));

        sections.AddRange(remoteBots
            .Where(bot => !IsRemoteMombotConfig(bot))
            .Select(bot => CreateRemoteStoredBotSection(bot, isNative: false))
            .OrderBy(bot => bot.DisplayName, StringComparer.OrdinalIgnoreCase));
        return sections;
    }

    private StoredBotSection CreateRemoteNativePlaceholder(bool scriptAvailable)
    {
        Core.BotConfig config = BuildCurrentGameNativeBotConfig();
        config.Alias = "mombot";
        config.ScriptFile = "mombot/mombot.cts";
        config.ScriptFiles = ["mombot/mombot.cts"];
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Name"] = config.Name,
            ["Script"] = config.ScriptFile,
            ["Description"] = config.Description,
            ["AutoStart"] = config.AutoStart ? "1" : "0",
            ["NameVar"] = config.NameVar,
            ["CommsVar"] = config.CommsVar,
            ["LoginScript"] = "disabled",
            ["Theme"] = config.Theme,
        };

        return new StoredBotSection(
            "bot:mombot",
            "mombot",
            NativeMombotMenuLabel,
            true,
            scriptAvailable,
            config,
            values);
    }

    private static StoredBotSection CreateRemoteStoredBotSection(ProxyManagedBotConfig remote, bool isNative)
    {
        string alias = string.IsNullOrWhiteSpace(remote.Alias) ? "bot" : remote.Alias.Trim();
        string sectionName = string.IsNullOrWhiteSpace(remote.SectionName) ? "bot:" + alias : remote.SectionName.Trim();
        string scriptList = NormalizeBotScriptList(remote.Script);
        List<string> scripts = scriptList
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(script => script.Replace('\\', '/'))
            .Where(script => !string.IsNullOrWhiteSpace(script))
            .ToList();
        string displayName = string.IsNullOrWhiteSpace(remote.Name) ? alias : remote.Name.Trim();
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Name"] = displayName,
            ["Script"] = scriptList,
            ["Description"] = remote.Description ?? string.Empty,
            ["AutoStart"] = remote.AutoStart ? "1" : "0",
            ["NameVar"] = remote.NameVar ?? string.Empty,
            ["CommsVar"] = remote.CommsVar ?? string.Empty,
            ["LoginScript"] = isNative ? "disabled" : remote.LoginScript ?? string.Empty,
            ["Theme"] = remote.Theme ?? string.Empty,
        };

        var config = new Core.BotConfig
        {
            Alias = alias,
            Name = displayName,
            ScriptFile = scripts.FirstOrDefault() ?? string.Empty,
            ScriptFiles = scripts,
            Description = values["Description"],
            AutoStart = remote.AutoStart,
            NameVar = values["NameVar"],
            CommsVar = values["CommsVar"],
            LoginScript = values["LoginScript"],
            Theme = values["Theme"],
            Properties = values,
        };

        return new StoredBotSection(
            sectionName,
            alias,
            isNative ? NativeMombotMenuLabel : displayName,
            isNative,
            scripts.Count > 0,
            config,
            values);
    }

    private static bool IsRemoteMombotConfig(ProxyManagedBotConfig bot)
        => string.Equals(bot.Alias, "mombot", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(bot.SectionName, "bot:mombot", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(bot.SectionName, Core.ProxyMenuCatalog.NativeMombotSectionName, StringComparison.OrdinalIgnoreCase);

}
