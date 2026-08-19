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
using System.Threading.Tasks;
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
    private bool _suppressMainWindowPositionPersistence = true;

    // ── Constructor ────────────────────────────────────────────────────────
    public MainWindow()
    {
        Title          = BaseWindowTitle;
        Icon           = new WindowIcon(AssetLoader.Open(new Uri("avares://MTC/mtc2.png")));
        Width          = DefaultMainWindowWidth;
        Height         = DefaultMainWindowHeight;
        MinWidth       = 800;
        MinHeight      = 500;
        Background     = BgWindow;
        FontFamily     = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        EnsureInitialMtcTab();
        Core.GlobalModules.ScriptWindowFactory = new AvaloniaScriptWindowFactory(
            ResolveScriptWindowRegistration,
            () => _appPrefs.DisableScriptWindowStayInFront);
        RecreateClassicShellControls();
        RecreateDeckShellControls();

        UpdateWindowTitle();

        // Session logging for direct telnet mode is handled through the shared Core logger.
        RefreshSessionLogTarget();

        // Wire keyboard → telnet
        SetTerminalInputHandler(bytes => RouteTerminalInput(bytes, SendToTelnet));

        // Load persisted preferences (recent file list etc.) before the first shell build
        // so we don't compose the visual tree twice on startup.
        _appPrefs = AppPreferences.Load();
        _terminalFontSize = GetNearestTerminalFontSize(_appPrefs.TerminalFontSize);
        _buffer.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(_appPrefs.ScrollbackLines);
        MigrateMainWindowGeometryIfNeeded();
        RestoreMainWindowBoundsIfPossible();
        _standaloneNativeHaggle.SetEnabled(true);
        _standaloneNativeHaggle.SetPortHaggleMode(ResolveGlobalPortHaggleMode());
        _standaloneNativeHaggle.SetPlanetHaggleMode(ResolveGlobalPlanetHaggleMode());
        bool resetCommandDeckLayout =
            _appPrefs.CommandDeckLayoutVersion < AppPreferences.CurrentCommandDeckLayoutVersion ||
            _appPrefs.CommandDeckPanels.Values.Any(layout => layout.Width <= 0 || layout.BodyHeight <= 0);
        if (resetCommandDeckLayout)
        {
            _appPrefs.CommandDeckPanels.Clear();
            _appPrefs.CommandDeckLayoutVersion = AppPreferences.CurrentCommandDeckLayoutVersion;
            _appPrefs.Save();
        }
        AppPaths.SetConfiguredProgramDir(_appPrefs.ProgramDirectory);
        UpdateMtcPerfInstrumentationState();
        // Command Deck is an explicit per-session workspace. MTC always opens
        // in the classic skin, regardless of the skin used in the prior run.
        _useCommandDeckSkin = false;
        _appPrefs.CommandDeckSkinEnabled = false;
        RestoreInWindowLayoutPreferences();
        if (ActiveMtcTab is { } startupTab)
            CaptureMtcTabSession(startupTab);

        _redAlertTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(30) };
        _redAlertTimer.Tick += (_, _) =>
        {
            _redAlertTimer.Stop();
            ClearRedAlert();
        };

        Content = BuildLayout();
        ApplyUiScaleToMainWindow();
        PositionChanged += (_, _) => OnMainWindowPositionChanged();
        SizeChanged += (_, _) => OnMainWindowSizeChanged();

        ApplyDebugLoggingPreferences();
        ApplyJsonRpcPreferences();
        ApplyRedAlertPreference();
        RebuildRecentMenu();
        RebuildProxyMenu();
        RebuildScriptsMenu();
        RefreshNotesMenuState();
        _parser.Feed("\x1b[2J\x1b[H");
        _parser.Feed($"\x1b[1;33m{MtcVersion.WindowTitle}\x1b[0m\r\n");
        _parser.Feed("\x1b[37mUse \x1b[1;32mFile \u25b6 New Connection\x1b[0;37m or \x1b[1;32mOpen\x1b[0;37m to select a game, then \x1b[1;32mFile \u25b6 Connect\x1b[0;37m to connect.\x1b[0m\r\n");
        _buffer.Dirty = true;

        _mombotKeepaliveTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(30) };
        _mombotKeepaliveTimer.Tick += (_, _) =>
        {
            foreach (var tab in _mtcTabs.ToArray())
            {
                if (!tab.IsLiveSession)
                    continue;

                _ = ExecuteInOptionalMtcTabSessionAsync(tab, async () =>
                {
                    if (_mombotKeepaliveTickRunning)
                        return;

                    _mombotKeepaliveTickRunning = true;
                    await RunNativeMombotKeepaliveTickAsync();
                });
            }
        };
        _mombotKeepaliveTimer.Start();

        _onlineAutoRefreshTimer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = OnlineAutoRefreshPollInterval,
        };
        _onlineAutoRefreshTimer.Tick += (_, _) =>
        {
            foreach (var tab in _mtcTabs.ToArray())
            {
                if (tab.IsLiveSession)
                    _ = ExecuteInOptionalMtcTabSessionAsync(tab, TrySendOnlineAutoRefreshAsync);
            }
        };
        _onlineAutoRefreshTimer.Start();

        Closing += OnMainWindowClosing;
        Opened += (_, _) =>
        {
            Dispatcher.UIThread.Post(
                () => _suppressMainWindowPositionPersistence = false,
                DispatcherPriority.Background);
            _nativeAppMenuReady = true;
            _nativeAppMenuAttached = false;
            _nativeDockMenuAttached = false;
            RequestNativeAppMenuRefresh(force: true);
            RequestNativeDockMenuRefresh(force: true);
            _ = EnsureSharedPathsConfiguredAsync();
            _ = RecoverPreviousOpenTabsOnStartupAsync();
            QueueStartupMtcUpdateCheck();
        };
        Activated += (_, _) => RequestActiveTerminalFocusForWindowActivation();
        Closed    += (_, _) =>
        {
            _mainWindowClosing = true;
            SaveAllTabNotesNow();
            PersistOpenMtcTabsToRecents();
            _notesSaveTimer?.Stop();
            CaptureMainWindowSize();
            CaptureCommWindowHeights();
            SaveInWindowLayoutPreferences();
            _appPrefs.Save();
            _nativeAppMenuReady = false;
            _nativeAppMenuAttached = false;
            _nativeDockMenuAttached = false;
            _mombotKeepaliveTimer.Stop();
            _onlineAutoRefreshTimer.Stop();
            _updateCheckCts?.Cancel();
            _updateCheckCts?.Dispose();
            _updateCheckCts = null;
            CloseOwnedChildWindows();
            StopOwnedChildProcesses();
            StopAllMtcTabSessions();
            _proxyCts?.Cancel();
            _jsonRpcServer?.Dispose();
            _jsonRpcServer = null;
            foreach (var tab in _mtcTabs.ToArray())
            {
                try { tab.PythonScripts.Dispose(); } catch { }
                try { tab.GameAgent.Dispose(); } catch { }
                try { tab.TerminalRecorder?.Dispose(); } catch { }
                tab.TerminalRecorder = null;
            }
            try { _gameAgent?.Dispose(); } catch { }
            try { _terminalRecorder?.Dispose(); } catch { }
            _terminalRecorder = null;
            _redAlertTimer.Stop();
            foreach (var tab in _mtcTabs.ToArray())
                tab.StatusRefreshTimer?.Stop();
            StopMtcPerfInstrumentation();
        };
    }

    private bool _mainWindowCloseConfirmed;
    private bool _mainWindowClosePromptActive;

    private void OnMainWindowClosing(object? sender, WindowClosingEventArgs e)
    {
        if (_mainWindowCloseConfirmed)
            return;

        IReadOnlyList<MtcTabPrototype> connectedTabs = GetServerConnectedMtcTabs();
        if (connectedTabs.Count == 0)
            return;

        e.Cancel = true;
        if (_mainWindowClosePromptActive)
            return;

        _mainWindowClosePromptActive = true;
        _ = ConfirmCloseConnectedWindowAsync(connectedTabs);
    }

    private async Task ConfirmCloseConnectedWindowAsync(IReadOnlyList<MtcTabPrototype> connectedTabs)
    {
        try
        {
            bool confirmed = await ShowConfirmAsync(
                "Close Connected Games",
                BuildCloseConnectedGamesMessage(connectedTabs),
                "Yes",
                "No");
            if (!confirmed)
                return;

            _mainWindowCloseConfirmed = true;
            _mainWindowClosing = true;
            await StopAllMtcTabSessionsAsync();
            Close();
        }
        finally
        {
            _mainWindowClosePromptActive = false;
        }
    }

    private IReadOnlyList<MtcTabPrototype> GetServerConnectedMtcTabs()
    {
        if (_boundMtcTab is not null)
            CaptureMtcTabSession(_boundMtcTab);

        return _mtcTabs
            .Where(tab => tab.IsLiveSession && IsMtcTabConnectedToServer(tab))
            .ToArray();
    }

    private static bool IsMtcTabConnectedToServer(MtcTabPrototype tab)
    {
        if (tab.GameInstance?.IsConnected == true)
            return true;

        if (tab.Telnet.IsConnected)
            return true;

        if (Volatile.Read(ref tab.EmbeddedServerConnectedState) == 1)
            return true;

        return tab.State.Connected;
    }

    private static string BuildCloseConnectedGamesMessage(IReadOnlyList<MtcTabPrototype> connectedTabs)
    {
        string games = string.Join(
            Environment.NewLine,
            connectedTabs.Select(tab => "- " + GetLiveMtcTabTitle(tab, null)));
        return "the following games are still connected, are you sure?" +
               Environment.NewLine +
               Environment.NewLine +
               games;
    }

    private void RestoreInWindowLayoutPreferences()
    {
        _commWindowVisible = _appPrefs.ShowCommWindow;
        _classicCommWindowHeight = NormalizeStoredPanelHeight(
            _appPrefs.ClassicCommWindowHeight,
            ClassicCommWindowDefaultHeight);
        _deckCommWindowHeight = NormalizeStoredPanelHeight(
            _appPrefs.DeckCommWindowHeight,
            DeckCommWindowDefaultHeight);
        _notesPanelVisible = _appPrefs.ShowNotesPanel;
    }

    private void SaveInWindowLayoutPreferences()
    {
        _appPrefs.ShowCommWindow = _commWindowVisible;
        SaveCommWindowSizePreferences();
        _appPrefs.ShowNotesPanel = _notesPanelVisible;
    }

    private void SaveCommWindowSizePreferences()
    {
        _appPrefs.ClassicCommWindowHeight = NormalizeStoredPanelHeight(
            _classicCommWindowHeight,
            ClassicCommWindowDefaultHeight);
        _appPrefs.DeckCommWindowHeight = NormalizeStoredPanelHeight(
            _deckCommWindowHeight,
            DeckCommWindowDefaultHeight);
    }

    private static double NormalizeStoredPanelHeight(double value, double fallback)
        => value >= CommWindowMinHeight && value <= 1000 && !double.IsNaN(value) && !double.IsInfinity(value)
            ? value
            : fallback;

    private void RestoreMainWindowBoundsIfPossible()
    {
        RestoreMainWindowSizeIfPossible();
        RestoreMainWindowPositionIfPossible();
    }

    private void MigrateMainWindowGeometryIfNeeded()
    {
        if (_appPrefs.MainWindowGeometryVersion >= AppPreferences.CurrentMainWindowGeometryVersion)
            return;

        // A short-lived Command Deck build allowed its near-fullscreen bounds to
        // overwrite the classic window size. Repair only that oversized shape;
        // preserve ordinary user-resized classic windows.
        if (_appPrefs.HasMainWindowSize &&
            _appPrefs.MainWindowWidth >= DefaultMainWindowWidth * 1.9 &&
            _appPrefs.MainWindowHeight >= DefaultMainWindowHeight * 1.9)
        {
            _appPrefs.SetMainWindowSize(DefaultMainWindowWidth, DefaultMainWindowHeight);
        }

        _appPrefs.MainWindowGeometryVersion = AppPreferences.CurrentMainWindowGeometryVersion;
        _appPrefs.Save();
    }

    private void RestoreMainWindowSizeIfPossible()
    {
        if (!_appPrefs.HasMainWindowSize)
            return;

        Width = Math.Max(MinWidth, _appPrefs.MainWindowWidth);
        Height = Math.Max(MinHeight, _appPrefs.MainWindowHeight);
    }

    private void RestoreMainWindowPositionIfPossible()
    {
        if (!_appPrefs.HasMainWindowPosition)
            return;

        var savedPosition = new PixelPoint(_appPrefs.MainWindowX, _appPrefs.MainWindowY);
        if (!IsPositionOnAnyScreen(savedPosition))
            return;

        Position = savedPosition;
    }

    private void OnMainWindowSizeChanged()
    {
        if (_suppressMainWindowPositionPersistence ||
            _useCommandDeckSkin ||
            WindowState != WindowState.Normal)
            return;

        CaptureMainWindowSize();
    }

    private void CaptureMainWindowSize()
    {
        if (_useCommandDeckSkin || WindowState != WindowState.Normal)
            return;

        double width = Bounds.Width > 0 ? Bounds.Width : Width;
        double height = Bounds.Height > 0 ? Bounds.Height : Height;
        _appPrefs.SetMainWindowSize(width, height);
    }

    private void OnMainWindowPositionChanged()
    {
        NotifyTerminalWindowMove();

        if (_suppressMainWindowPositionPersistence ||
            _useCommandDeckSkin ||
            WindowState != WindowState.Normal)
            return;

        PixelPoint currentPosition = Position;
        if (!IsPositionOnAnyScreen(currentPosition))
            return;

        _appPrefs.SetMainWindowPosition(currentPosition.X, currentPosition.Y);
    }

    private bool IsPositionOnAnyScreen(PixelPoint position)
    {
        foreach (var screen in Screens.All)
        {
            PixelRect workArea = screen.WorkingArea;
            if (position.X >= workArea.X &&
                position.Y >= workArea.Y &&
                position.X < workArea.X + workArea.Width &&
                position.Y < workArea.Y + workArea.Height)
            {
                return true;
            }
        }

        return false;
    }

}
