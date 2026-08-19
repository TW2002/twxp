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

/// <summary>
/// Main application window – SWATH-style layout:
///   [Menu bar]
///   [Sidebar 165 px | ANSI terminal (expandable)]
///   [Status bar]
/// </summary>
public partial class MainWindow : Window
{
    private sealed record CommEntry(Core.CommMessageChannel Channel, string Sender, string Message, bool IsLocal);
    private readonly record struct PendingDisplayChunk(byte[] Bytes);
    private readonly record struct FinderPrewarmKey(
        string DatabasePath,
        long ChangeStamp,
        int BubbleMaxSize,
        int DeadEndMaxSize,
        int TunnelMaxSize,
        bool AllowSeparatedByGates);

    private const string BaseWindowTitle = MtcVersion.WindowTitle;
    private const double DefaultMainWindowWidth = 1100;
    private const double DefaultMainWindowHeight = 650;
    private const int MaxCommEntries = 500;
    private const double ClassicCommWindowDefaultHeight = 140;
    private const double DeckCommWindowDefaultHeight = 150;
    private const double CommWindowMinHeight = 90;
    private const double ClassicCommSplitterHeight = 6;
    private const double DeckCommSplitterHeight = 8;
    private const double DeckPanelSnapThreshold = 18;
    private const double DeckPanelSnapGap = 18;
    private const double DeckPanelGridSize = 18;
    private const int TemporaryMacroMaxCharacters = 200;
    private const int EmbeddedLocalClientIndex = 0;
    private static readonly TimeSpan OnlineAutoRefreshPollInterval = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan OnlineAutoRefreshQuietPeriod = TimeSpan.FromSeconds(2);
    private static readonly double[] TerminalFontSizeOptions = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32];

    // ── Core components ────────────────────────────────────────────────────
    private GameState       _state = null!;
    private TerminalBuffer  _buffer = null!;
    private AnsiParser      _parser = null!;
    private TelnetClient    _telnet = null!;
    private TerminalControl _termCtrl = null!;
    private TerminalControl _deckTermCtrl = null!;
    private readonly DispatcherTimer _redAlertTimer;
    private Core.ShipInfoParser _shipParser = null!;
    private readonly DispatcherTimer _mombotKeepaliveTimer;
    private readonly DispatcherTimer _onlineAutoRefreshTimer;
    // ── Current saved profile path (null = not yet saved) ──────────────────
    private string?         _currentProfilePath;
    private AppPreferences  _appPrefs = new();
    private Border?         _updateBanner;
    private TextBlock?      _updateBannerText;
    private Button?         _updateBannerDownloadButton;
    private MtcUpdateCheckResult? _pendingMtcUpdate;
    private bool            _mtcUpdateDialogOpen;
    private CancellationTokenSource? _updateCheckCts;
    private Core.ModDatabase?              _sessionDb;
    private Core.GameInstance?             _gameInstance;   // non-null only in embedded proxy mode
    private Core.ExpansionModuleHost?      _moduleHost;     // embedded proxy expansion modules
    private List<IDisposable>              _moduleMenuRegistrations = [];
    private Core.GameFileLock?             _gameFileLock;
    private Core.NativeHaggleEngine _standaloneNativeHaggle = null!;
    private GameAgentRuntime                 _gameAgent = null!;
    private CancellationTokenSource?       _proxyCts;       // cancels the pipe-reader task
    private Task                           _pendingEmbeddedStop = Task.CompletedTask; // tracks in-flight StopEmbeddedAsync
    private object                         _embeddedStopSync = new();
    private SemaphoreSlim                  _runtimeStopGate = new(1, 1);
    private Core.ModLog                    _sessionLog = null!;
    private EmbeddedGameConfig?            _embeddedGameConfig;
    private string?                        _embeddedGameName;
    private const string NativeMombotMenuLabel = "MomBot (native)";
    private MenuItem        _recentMenu    = new() { Header = "_Recent" };
    private bool            _recentMenuOpen;
    private bool            _recentMenuRebuildPending;
    private readonly HashSet<MenuItem> _openSharedMenus = [];
    private bool            _proxyMenuRebuildPending;
    private bool            _scriptsMenuRebuildPending;
    private bool            _aiMenuRebuildPending;
    private bool            _nativeMenuRefreshPending;
    private int             _nativeAppMenuRefreshScheduled;
    private int             _nativeDockMenuRefreshScheduled;
    private int             _nativeAppMenuSignature;
    private int             _nativeDockMenuSignature;
    private bool            _nativeAppMenuSignatureValid;
    private bool            _nativeDockMenuSignatureValid;
    private bool            _tabStripRefreshPending;
    private bool            _focusTerminalAfterSharedMenuClose;
    private int             _activationTerminalFocusTicket;
    private MenuItem        _proxyMenu     = new() { Header = "_Proxy" };
    private MenuItem        _scriptsMenu   = new() { Header = "_Scripts" };
    private MenuItem        _botMenu       = new() { Header = "_Bot" };
    private MenuItem        _quickMenu     = new() { Header = "_Quick" };
    private MenuItem        _toolsMenu     = new() { Header = "_Tools" };
    private MenuItem        _aiMenu        = new() { Header = "_Chat", IsVisible = false };
    private readonly MenuItem _viewClearRecents = new() { Header = "Clear _Recents" };
    private MenuItem        _fileEdit       = new() { Header = "_Edit Connection…", IsEnabled = false };
    private MenuItem        _fileConnect    = new() { Header = "_Connect",    IsEnabled = false };
    private MenuItem        _fileDisconnect = new() { Header = "_Disconnect", IsEnabled = false };
    private Menu            _menuBar       = new();
    private readonly MenuItem _viewClassicSkin = new() { Header = "_Classic Console" };
    private readonly MenuItem _viewCommandDeckSkin = new() { Header = "_Command Deck" };
    private readonly MenuItem _viewCommWindow = new() { Header = "_Comm Window" };
    private readonly MenuItem _viewShowHaggleDetails = new() { Header = "Haggle _Statistics" };
    private readonly MenuItem _viewBottomBar = new() { Header = "_Status Bar" };
    private readonly List<(MenuItem Item, double Size)> _viewFontSizeItems = [];
    private readonly NativeMenu _nativeAppMenu = new();
    private readonly NativeMenu _nativeDockMenu = new();
    private MTC.mombot.mombotService _mombot = null!;
    private PythonScriptRunner _pythonScripts = null!;
    private readonly Border _shellHost = new();
    private readonly Border _statusBar = new();
    private readonly Border _menuBarHost = new();
    private readonly Border _menuFontSizeFrame = new();
    private readonly Button _menuFontSizeDecreaseButton = new() { Content = "-" };
    private readonly Button _menuFontSizeIncreaseButton = new() { Content = "+" };
    private readonly Border _statusMacroHost = new();
    private readonly Grid _statusBarLayoutRoot = new();
    private readonly StackPanel _statusBarContent = new()
    {
        Orientation = Orientation.Horizontal,
        Spacing = 8,
        VerticalAlignment = VerticalAlignment.Center,
        Margin = new Thickness(8, 0),
    };
    private DockPanel? _rootDock;
    private readonly Canvas _quickMacroOverlayLayer = new()
    {
        IsHitTestVisible = false,
        IsVisible = false,
    };
    private Canvas? _deckSurface;
    private Grid? _deckWorkspaceHost;
    private Viewbox? _deckWorkspaceScaler;
    private Control? _deckWorkspace;
    private double _deckWorkspaceMinimumWidth;
    private double _deckWorkspaceMinimumHeight;
    private readonly Dictionary<string, FloatingDeckPanel> _deckPanels = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, DeckPanelState> _deckPanelStates = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<int, TerminalControl> _deckTerminalControls = [];
    private StackPanel _deckOnlinePlayersHost = new() { Spacing = 3 };
    private int _deckNextZIndex = 100;
    private bool _deckPanelsInitialized;
    private bool _suppressDeckPanelStateSync;
    private TacticalMapControl? _tacticalMap;
    private bool _useCommandDeckSkin;
    private bool _nativeAppMenuReady;
    private bool _nativeAppMenuAttached;
    private bool _nativeDockMenuAttached;
    private bool _commWindowVisible;
    private double _classicCommWindowHeight = ClassicCommWindowDefaultHeight;
    private double _deckCommWindowHeight = DeckCommWindowDefaultHeight;
    private Core.CommMessageChannel _commSelectedChannel = Core.CommMessageChannel.FedComm;
    private string _commPrivateTarget = string.Empty;
    private Button? _macroRecordButton;
    private Button? _macroStopButton;
    private Button? _macroPlayButton;
    private Button? _deckMacroRecordButton;
    private Button? _deckMacroStopButton;
    private Button? _deckMacroPlayButton;
    private List<byte[]> _temporaryMacroChunks = [];
    private bool _temporaryMacroRecording;
    private bool _suppressTemporaryMacroRecording;
    private TerminalSessionRecorder? _terminalRecorder;
    private Button? _terminalRecordButton;
    private readonly Button _statusMacrosButton = new();
    private readonly Button _statusStopAllButton = new();
    private readonly Button _statusCommButton = new();
    private readonly Button _statusBotButton = new();
    private readonly Button _statusMapButton = new();
    private readonly Button _statusDockShopperButton = new();
    private readonly Button _statusHaggleButton = new() { Content = "HAGGLE" };
    private readonly Button _statusLivePausedButton = new() { Content = "LIVE" };
    private readonly Button _statusRedAlertButton = new() { Content = "RED ALERT" };
    private readonly Border _statusMacrosFrame = new();
    private readonly Border _statusStopAllFrame = new();
    private readonly Border _statusCommFrame = new();
    private readonly Border _statusBotFrame = new();
    private readonly Border _statusMapFrame = new();
    private readonly Border _statusDockShopperFrame = new();
    private readonly Border _statusHaggleFrame = new();
    private readonly Border _statusLivePausedFrame = new();
    private readonly Border _statusRedAlertFrame = new();
    private readonly object _pausedTerminalSync = new();
    private readonly object _terminalDisplayArtifactSync = new();
    private readonly object _finderPrewarmSync = new();
    private readonly List<byte[]> _pausedTerminalChunks = [];
    private readonly ConcurrentQueue<PendingDisplayChunk> _pendingDisplayChunks = new();
    private bool _terminalLivePaused;
    private bool _deferredInfoPanelsRefresh;
    private readonly ConcurrentQueue<byte[]> _pendingSessionLogChunks = new();
    private bool _deferredOnlinePanelRefresh;
    private bool _deferredStatusBarRefresh;
    private int _displayDrainScheduled;
    private string _statusBarLayoutSignature = string.Empty;
    private bool _statusMacrosHovered;
    private int _sessionLogDrainScheduled;
    private int _infoPanelsRefreshPostScheduled;
    private int _statusRefreshPostScheduled;
    private int _onlineAutoRefreshRunning;
    private int _serverInputPendingCharacters;
    private long _lastInfoPanelsRefreshTicks;
    private long _lastStatusBarRefreshTicks;
    private long _lastGameTrafficTicks;
    private long _lastOnlineRefreshTicks;
    private DispatcherTimer? _infoPanelsRefreshTimer;
    private DispatcherTimer? _currentGameConfigSaveTimer;
    private bool _currentGameConfigSaveRunning;
    private bool _currentGameConfigSaveAgain;
    private bool _statusStopAllHovered;
    private bool _statusCommHovered;
    private bool _statusBotHovered;
    private bool _statusMapHovered;
    private bool _statusDockShopperHovered;
    private bool _statusHaggleHovered;
    private bool _statusLivePausedHovered;
    private bool _redAlertEnabled;
    private Avalonia.Controls.Shapes.Path? _statusStopAllSign;
    private TextBlock? _statusStopAllLabel;
    private Border? _statusCommFlap;
    private Border? _statusCommBody;
    private Border? _statusCommIndicator;
    private Border? _statusBotHead;
    private Border? _statusBotBody;
    private Border? _statusBotEyeLeft;
    private Border? _statusBotEyeRight;
    private Border? _statusBotAntenna;
    private Border? _statusBotAntennaTip;
    private Border? _statusHaggleSpark;
    private Border? _statusHaggleBeam;
    private Border? _statusHaggleStem;
    private Border? _statusHaggleLeftLink;
    private Border? _statusHaggleRightLink;
    private Border? _statusHaggleLeftPan;
    private Border? _statusHaggleRightPan;
    private Border? _statusHaggleBase;
    private Border? _statusMapPanelLeft;
    private Border? _statusMapPanelCenter;
    private Border? _statusMapPanelRight;
    private Avalonia.Controls.Shapes.Path? _statusMapRoute;
    private Border? _statusMapNodeA;
    private Border? _statusMapNodeB;
    private Border? _statusMapNodeC;
    private Border? _statusMacrosLineTop;
    private Border? _statusMacrosLineMiddle;
    private Border? _statusMacrosLineBottom;
    private Avalonia.Controls.Shapes.Path? _statusMacrosPlay;
    private Border? _commPanelBorder;
    private Button? _commFedTabButton;
    private Button? _commSubspaceTabButton;
    private Button? _commPrivateTabButton;
    private Button? _commEventsTabButton;
    private TextBlock? _commFedTextBlock;
    private TextBlock? _commSubspaceTextBlock;
    private TextBlock? _commPrivateTextBlock;
    private TextBlock? _commEventsTextBlock;
    private ScrollViewer? _commFedScrollViewer;
    private ScrollViewer? _commSubspaceScrollViewer;
    private ScrollViewer? _commPrivateScrollViewer;
    private ScrollViewer? _commEventsScrollViewer;
    private TextBox? _commComposeTextBox;
    private TextBox? _commPrivateTargetTextBox;
    private TextBlock? _commPrivateTargetLabel;
    private RowDefinition? _commSplitterRow;
    private RowDefinition? _commPanelRow;
    private GridSplitter? _commGridSplitter;
    private Border? _deckCommPanelBorder;
    private Button? _deckCommFedTabButton;
    private Button? _deckCommSubspaceTabButton;
    private Button? _deckCommPrivateTabButton;
    private Button? _deckCommEventsTabButton;
    private TextBlock? _deckCommFedTextBlock;
    private TextBlock? _deckCommSubspaceTextBlock;
    private TextBlock? _deckCommPrivateTextBlock;
    private TextBlock? _deckCommEventsTextBlock;
    private ScrollViewer? _deckCommFedScrollViewer;
    private ScrollViewer? _deckCommSubspaceScrollViewer;
    private ScrollViewer? _deckCommPrivateScrollViewer;
    private ScrollViewer? _deckCommEventsScrollViewer;
    private TextBox? _deckCommComposeTextBox;
    private TextBox? _deckCommPrivateTargetTextBox;
    private TextBlock? _deckCommPrivateTargetLabel;
    private RowDefinition? _deckCommSplitterRow;
    private RowDefinition? _deckCommPanelRow;
    private GridSplitter? _deckCommGridSplitter;
    private List<CommEntry> _commEntries = [];
    private Action<byte[]>? _terminalInputHandler;
    private string? _terminalFontFamilyName;
    private double _terminalFontSize = TerminalControl.DefaultFontSize;
    private bool _mombotPromptOpen;
    private bool _mombotHotkeyPromptOpen;
    private bool _mombotScriptPromptOpen;
    private bool _mombotPreferencesOpen;
    private bool _mombotPreferencesMenuDeafActive;
    private bool _mombotPreferencesMenuDeafRestore;
    private bool _mombotInteractivePromptTerminalDeafActive;
    private bool _mombotInteractivePromptTerminalDeafRestore;
    private bool _mombotPreferencesCaptureSingleKey;
    private string _mombotPreferencesInputPrompt = string.Empty;
    private string _mombotPreferencesInputBuffer = string.Empty;
    private Action<string>? _mombotPreferencesInputHandler;
    private MombotPreferencesBlankSubmitBehavior _mombotPreferencesBlankSubmitBehavior = MombotPreferencesBlankSubmitBehavior.Ignore;
    private int _mombotPreferencesHotkeySlot;
    private int _mombotPreferencesShipPageStart = 1;
    private int _mombotPreferencesPlanetTypePageStart = 1;
    private int _mombotPreferencesPlanetListCursor = 2;
    private int _mombotPreferencesPlanetListNextCursor = 2;
    private bool _mombotPreferencesPlanetListHasMore;
    private int _mombotPreferencesTraderListCursor = 2;
    private int _mombotPreferencesTraderListNextCursor = 2;
    private bool _mombotPreferencesTraderListHasMore;
    private bool _mombotMacroPromptOpen;
    private MombotGridContext? _mombotMacroContext;
    private IReadOnlyList<MombotHotkeyScriptEntry> _mombotHotkeyScripts = Array.Empty<MombotHotkeyScriptEntry>();
    private List<string> _mombotCommandHistory = [];
    private string _mombotPromptBuffer = string.Empty;
    private string _mombotPromptDraft = string.Empty;
    private Func<string, string>? _mombotPromptSubmitTransform;
    private int _mombotPromptHistoryIndex;
    private int _mombotPromptCursorIndex;
    private MombotPreferencesPage _mombotPreferencesPage;
    private string _mombotLastKeepaliveLine = string.Empty;
    private int _mombotObservedGamePromptVersion;
    private int _mombotMacroPromptRedrawTicket;
    private string _mombotLastObservedGamePromptAnsi = string.Empty;
    private string _mombotLastObservedGamePromptPlain = string.Empty;
    private readonly object _nativeMombotPostLoginMacroLock = new();
    private string _pendingNativeMombotPostLoginMacro = string.Empty;
    private bool _pendingTerminalSyncMarkerLeadByte;
    private bool _pendingTerminalSyncMarkerUtf8LeadByte;
    private bool _mombotKeepaliveTickRunning;
    private bool _mombotStartupDataGatherPending;
    private bool _mombotStartupDataGatherRunning;
    private bool _mombotStartupPostInitPending;
    private bool _mombotStartupFinalizeRunning;
    private bool _nativeBotAutoStartInFlight;
    private FinderPrewarmKey? _lastFinderPrewarmKey;
    private int _nativeMombotStartupWatchScheduled;
    private string _currentShipType = string.Empty;
    private string _currentShipClass = string.Empty;
    private string _currentComputerShipType = string.Empty;
    private bool _awaitingComputerShipTypeLine;
    private List<string> _onlinePlayers = [];
    private List<string> _pendingOnlinePlayers = [];
    private volatile bool _capturingOnlinePlayers;
    private bool _onlinePlayersCaptureSawPlayer;
    private sealed record StoredBotSection(
        string SectionName,
        string Alias,
        string DisplayName,
        bool IsNative,
        bool ScriptAvailable,
        Core.BotConfig Config,
        Dictionary<string, string> Values);
    private sealed record BotRuntimeState(bool NativeRunning, string ExternalBotName)
    {
        public bool IsRunning => NativeRunning || !string.IsNullOrWhiteSpace(ExternalBotName);

        public string DisplayName =>
            NativeRunning
                ? NativeMombotMenuLabel
                : string.IsNullOrWhiteSpace(ExternalBotName)
                    ? "Off"
                    : ExternalBotName;
    }
    // ── Sidebar value TextBlocks (updated when GameState fires Changed) ────
    private TextBlock _valName     = new();
    private StackPanel _onlinePlayersHost = new() { Spacing = 2 };
    private TextBlock _valSector    = new();
    private Border    _sectorBustIndicator = new();
    private TextBlock _valTurns     = new();
    private TextBlock _valExper     = new();
    private TextBlock _valAlignm    = new();
    private TextBlock _valCred      = new();
    private TextBlock _valHTotal    = new();
    private TextBlock _valFuelOre   = new();
    private TextBlock _valOrganics  = new();
    private TextBlock _valEquipment = new();
    private TextBlock _valColonists = new();
    private TextBlock _valEmpty     = new();
    private ColumnDefinition _holdsFuelOreColumn = new();
    private ColumnDefinition _holdsOrganicsColumn = new();
    private ColumnDefinition _holdsEquipmentColumn = new();
    private ColumnDefinition _holdsColonistsColumn = new();
    private ColumnDefinition _holdsEmptyColumn = new();
    private Border? _holdsFuelOreSegment;
    private Border? _holdsOrganicsSegment;
    private Border? _holdsEquipmentSegment;
    private Border? _holdsColonistsSegment;
    private Border? _holdsEmptySegment;
    private TextBlock _shipInfoHeaderText = new();
    private TextBlock _valFighters  = new();
    private TextBlock _valShields   = new();
    private TextBlock _valTrnWarp   = new();
    // Ship Info – compact paired equipment rows
    private TextBlock _valEther     = new();
    private TextBlock _valBeacon    = new();
    private TextBlock _valDisruptor = new();
    private TextBlock _valPhoton    = new();
    private TextBlock _valArmid     = new();
    private TextBlock _valLimpet    = new();
    private TextBlock _valGenesis   = new();
    private TextBlock _valAtomic    = new();
    private TextBlock _valCorbo     = new();
    private TextBlock _valCloak     = new();
    private TextBlock _valTW1       = new();
    private TextBlock _valTW2       = new();
    private Border    _scanIndTW1   = new();
    private Border    _scanIndTW2   = new();
    private Border    _scanIndD     = new();
    private Border    _scanIndH     = new();
    private Border    _scanIndP     = new();
    private TextBlock _deckValName     = new();
    private TextBlock _deckValSector   = new();
    private TextBlock _deckValTurns    = new();
    private TextBlock _deckValExper    = new();
    private TextBlock _deckValAlignm   = new();
    private TextBlock _deckValCred     = new();
    private TextBlock _deckValHTotal   = new();
    private TextBlock _deckValFuelOre  = new();
    private TextBlock _deckValOrganics = new();
    private TextBlock _deckValEquipment = new();
    private TextBlock _deckValColonists = new();
    private TextBlock _deckValEmpty     = new();
    private TextBlock _deckValFighters  = new();
    private TextBlock _deckValShields   = new();
    private TextBlock _deckValTrnWarp   = new();
    private TextBlock _deckValEther     = new();
    private TextBlock _deckValBeacon    = new();
    private TextBlock _deckValDisruptor = new();
    private TextBlock _deckValPhoton    = new();
    private TextBlock _deckValArmid     = new();
    private TextBlock _deckValLimpet    = new();
    private TextBlock _deckValGenesis   = new();
    private TextBlock _deckValAtomic    = new();
    private TextBlock _deckValCorbo     = new();
    private TextBlock _deckValCloak     = new();
    private TextBlock _deckValTW1       = new();
    private TextBlock _deckValTW2       = new();
    private Border    _deckScanIndTW1   = new();
    private Border    _deckScanIndTW2   = new();
    private Border    _deckScanIndD     = new();
    private Border    _deckScanIndH     = new();
    private Border    _deckScanIndP     = new();

    // ── Status bar text ───────────────────────────────────────────────────
    private TextBlock _statusText = new();
    private TextBlock _statusTerminalSizeText = new();
    private TextBlock _statusStarDockValue = new();
    private TextBlock _statusBackdoorValue = new();
    private TextBlock _statusRylosValue = new();
    private TextBlock _statusAlphaValue = new();
    private Control? _statusStarDockChip;
    private Control? _statusBackdoorChip;
    private Control? _statusRylosChip;
    private Control? _statusAlphaChip;
    private TextBlock _deckHudHeaderSector = new();
    private TextBlock _deckHudHeaderConnection = new();
    private TextBlock _deckHudShipName = new();
    private TextBlock _deckHudShipSubtitle = new();
    private TextBlock _deckHudStarDock = new();
    private TextBlock _deckHudRylos = new();
    private TextBlock _deckHudAlpha = new();
    private TextBlock _deckHudUniverse = new();

    // ── Colors ────────────────────────────────────────────────────────────
    // BgChrome is the medium-gray frame that encases the whole window
    private static readonly IBrush BgChrome    = new SolidColorBrush(Color.FromRgb(105, 105, 105));
    private static readonly IBrush BgWindow    = new SolidColorBrush(Color.FromRgb(105, 105, 105));
    private static readonly IBrush BgSidebar   = new SolidColorBrush(Color.FromRgb(80,  80,  80));
    private static readonly IBrush BgPanel     = new SolidColorBrush(Color.FromRgb(88,  88,  88));
    private static readonly IBrush FgKey       = new SolidColorBrush(Color.FromRgb(220, 220, 220));
    private static readonly IBrush FgValue     = new SolidColorBrush(Color.FromRgb(85,  255, 85));
    private static readonly IBrush FgTitle     = new SolidColorBrush(Color.FromRgb(255, 255, 85));
    private static readonly IBrush BgStatus    = new SolidColorBrush(Color.FromRgb(70,  70,  70));
    private static readonly IBrush FgStatus    = new SolidColorBrush(Color.FromRgb(230, 230, 230));
    private static readonly IBrush BorderColor    = new SolidColorBrush(Color.FromRgb(40,  40,  40));
    private static readonly IBrush BorderHi       = new SolidColorBrush(Color.FromRgb(140, 140, 140));
    private static readonly IBrush ScannerActive  = new SolidColorBrush(Color.FromRgb(85,  255, 85));
    private static readonly IBrush ScannerInactive= new SolidColorBrush(Color.FromRgb(50,  50,  50));
    private static readonly IBrush ScannerFgInact = new SolidColorBrush(Color.FromRgb(130, 130, 130));
    private static readonly IBrush HudWindow    = new SolidColorBrush(Color.FromRgb(8,  14, 20));
    private static readonly IBrush HudMenu      = new SolidColorBrush(Color.FromRgb(16, 27, 36));
    private static readonly IBrush HudShell     = new SolidColorBrush(Color.FromRgb(10,  21, 29));
    private static readonly IBrush HudFrame     = new SolidColorBrush(Color.FromRgb(14,  33, 42));
    private static readonly IBrush HudFrameAlt  = new SolidColorBrush(Color.FromRgb(18,  43, 53));
    private static readonly IBrush HudHeader    = new SolidColorBrush(Color.FromRgb(16,  53, 67));
    private static readonly IBrush HudHeaderAlt = new SolidColorBrush(Color.FromRgb(20,  64, 74));


    private static readonly FontFamily HudTitleFont = new("Eurostile, Bank Gothic, Bahnschrift, Segoe UI, sans-serif");
    private static readonly Bitmap AboutLogo = new(AssetLoader.Open(new Uri("avares://MTC/mtc.png")));
    private static readonly Bitmap HudLogo = new(AssetLoader.Open(new Uri("avares://MTC/mtc2.png")));

    private sealed class DeckPanelState
    {
        public required string PanelId { get; init; }
        public required double Left { get; set; }
        public required double Top { get; set; }
        public required double Width { get; set; }
        public required double BodyHeight { get; set; }
        public required int ZIndex { get; set; }
        public bool Closed { get; set; }
        public bool Minimized { get; set; }
    }

}
