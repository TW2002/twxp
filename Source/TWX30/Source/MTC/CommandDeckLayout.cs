using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Templates;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.LogicalTree;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

public partial class MainWindow
{
    private Grid? _commandDeckRoot;
    private Grid? _commandDeckConsoleGrid;
    private ContentControl? _commandDeckNotes;
    private ContentControl? _commandDeckReportsHost;
    private CommandDeckScriptWindows? _commandDeckReports;
    private TextBlock? _commandDeckTarget;
    private TextBlock? _commandDeckIdentity;
    private StackPanel? _commandDeckPages;
    private readonly Dictionary<int, CommandDeckConsole> _commandDeckConsoles = new();
    private int _commandDeckPage;
    private int? _commandDeckExpanded;
    private Thumb? _commandDeckInspectorGrip;
    private Thumb? _commandDeckReportsGrip;
    private readonly Dictionary<string, CommandDeckPanel> _commandDeckPanels = new();
    private Grid? _commandDeckInspector;
    private ScrollViewer? _commandDeckDetails;
    private Grid? _commandDeckRight;
    private readonly ContentControl _commandDeckToolbarHost = new();
    private readonly ContentControl _menuToolsHost = new();
    private StackPanel? _menuInlineTools;
    private Button? _menuToolsOverflow;
    private Flyout? _menuToolsFlyout;
    private bool ShowMainStatusBar => _appPrefs.ShowBottomBar && !_useCommandDeckSkin;
    private (int Game, TWXProxy.Core.ModDatabase? Database, int Sector, long Stamp, int Corp, string Trader)? _commandDeckTacticalContext;

    private ScriptWindowPalette DeckPalette => new(HudFrame, HudEdge, HudHeaderAlt, HudAccent, HudText);

    private Control BuildCommandDeckLayout()
    {
        foreach (var tab in _mtcTabs) Interlocked.Exchange(ref tab.DeckConsoleVisible, 0);
        RecreateDeckShellControls();
        _deckPanels.Clear(); _deckSurface = null; _deckPanelsInitialized = false;
        _commandDeckConsoles.Clear(); _commandDeckExpanded = null;
        _commandDeckPanels.Clear();
        _commandDeckTacticalContext = null;
        _tacticalMap = new TacticalMapControl(() => ActiveMtcTab?.State.Sector ?? 0,
            () => (ActiveMtcTab?.RuntimeContext.ActiveDatabase ?? ActiveMtcTab?.SessionDb) is { IsOpen: true } database ? database : null,
            () => ActiveMtcTab?.State) { MinHeight = 0, Height = UiSize(170) };
        _tacticalMap.SectorDoubleClicked += (_, sector) => _tacticalMap?.CenterOnSector(sector);

        _commandDeckRoot = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("Auto,8,*,8,Auto"),
            Background = HudShell,
        };
        _commandDeckRoot.ColumnDefinitions[0].Width = new GridLength(UiSize(_appPrefs.CommandDeckInspectorWidth));
        _commandDeckRoot.ColumnDefinitions[4].Width = new GridLength(UiSize(_appPrefs.CommandDeckReportsWidth));
        _commandDeckToolbarHost.Content = BuildCommandDeckToolbar();
        var inspector = BuildCommandDeckInspector();
        _commandDeckRoot.Children.Add(inspector);
        _commandDeckInspectorGrip = BuildCommandDeckDivider(false);
        Grid.SetColumn(_commandDeckInspectorGrip, 1);
        _commandDeckRoot.Children.Add(_commandDeckInspectorGrip);
        _commandDeckConsoleGrid = new Grid
        {
            RowDefinitions = new RowDefinitions("*,*"), ColumnDefinitions = new ColumnDefinitions("*,*"),
        };
        _deckWorkspaceHost = new Grid { Children = { _commandDeckConsoleGrid }, ClipToBounds = true };
        Grid.SetColumn(_deckWorkspaceHost, 2);
        _commandDeckRoot.Children.Add(_deckWorkspaceHost);
        _commandDeckReportsGrip = BuildCommandDeckDivider(true);
        Grid.SetColumn(_commandDeckReportsGrip, 3);
        _commandDeckRoot.Children.Add(_commandDeckReportsGrip);
        _commandDeckReportsHost = new ContentControl
        {
            HorizontalContentAlignment = HorizontalAlignment.Stretch,
            VerticalContentAlignment = VerticalAlignment.Stretch,
        };
        _commandDeckReports = null;
        _commandDeckRight = new Grid { RowDefinitions = new RowDefinitions("*,Auto"), Background = HudFrame };
        _commandDeckRight.Children.Add(_commandDeckReportsHost);
        var tactical = DeckInspectorSection("Tactical", _tacticalMap!);
        Grid.SetRow(tactical, 1); _commandDeckRight.Children.Add(tactical);
        Grid.SetColumn(_commandDeckRight, 4);
        _commandDeckRoot.Children.Add(_commandDeckRight);

        foreach (var tab in _mtcTabs.Where(t => t.IsLiveSession))
        {
            var terminal = CreateTerminalControl(tab);
            terminal.SetMinimumGridSize(DeckConsoleDefaultColumns, DeckConsoleDefaultRows);
            _deckTerminalControls.Add(tab.Id, terminal);
            var console = new CommandDeckConsole(terminal,
                () => SelectCommandDeckGame(tab.Id), () => ExpandCommandDeckGame(tab.Id),
                () => CloseMtcTab(tab.Id), DeckPalette) { Margin = new Thickness(4) };
            _commandDeckConsoles.Add(tab.Id, console);
            _commandDeckConsoleGrid.Children.Add(console);
        }
        _deckWorkspaceMinimumWidth = 2 * (_deckTerminalControls.Values.FirstOrDefault()?.MinimumPixelWidth ?? 640) + 24;
        _deckWorkspaceMinimumHeight = 2 * (_deckTerminalControls.Values.FirstOrDefault()?.MinimumPixelHeight ?? 360) + 160;
        UpdateCommandDeckSelection();
        RefreshCommandDeckSidebars();
        LayoutCommandDeckPage();
        IDisposable? metadataTimer = null;
        _commandDeckRoot.AttachedToVisualTree += (_, _) =>
            metadataTimer = DispatcherTimer.Run(() => { RefreshCommandDeckMetadata(); return true; }, TimeSpan.FromMilliseconds(500));
        _commandDeckRoot.DetachedFromVisualTree += (_, _) => { metadataTimer?.Dispose(); metadataTimer = null; };
        return _commandDeckRoot;
    }

    private Control BuildCommandDeckToolbar()
    {
        var toolbar = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,Auto,*"), Margin = UiThickness(8, 0, 4, 0),
            VerticalAlignment = VerticalAlignment.Center, ClipToBounds = true };
        var controls = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 4 };
        controls.Children.Add(new TextBlock { Text = "Command Deck", Foreground = HudText,
            FontWeight = FontWeight.Bold, VerticalAlignment = VerticalAlignment.Center });
        controls.Children.Add(CommandDeckConsole.ActionButton("+", "Add game", CreateStagedMtcTab, DeckPalette));
        controls.Children.Add(CommandDeckConsole.ActionButton("\u25a6", "Restore tiled consoles", () =>
        { _commandDeckExpanded = null; LayoutCommandDeckPage(); }, DeckPalette));
        controls.Children.Add(CommandDeckConsole.ActionButton("\u21ba", "Reset deck layout", () =>
        {
            _appPrefs.CommandDeckInspectorWidth = 250; _appPrefs.CommandDeckReportsWidth = 300;
            _commandDeckRoot!.ColumnDefinitions[0].Width = new GridLength(UiSize(250));
            _appPrefs.CommandDeckClosedPanels.Clear(); _appPrefs.CommandDeckCollapsedPanels.Clear();
            UpdateCommandDeckPanels();
            _commandDeckExpanded = null; LayoutCommandDeckPage(); _appPrefs.Save();
        }, DeckPalette));
        Button? panels = null;
        panels = CommandDeckConsole.ActionButton("\u2637", "Show or hide deck panels", () =>
        {
            var menu = new ContextMenu();
            foreach (var pair in _commandDeckPanels)
            {
                string name = pair.Key;
                var item = new MenuItem { Header = name, ToggleType = MenuItemToggleType.CheckBox,
                    IsChecked = !pair.Value.IsClosed };
                item.Click += (_, _) => SetCommandDeckPanelState(name, !pair.Value.IsClosed, false);
                menu.Items.Add(item);
            }
            menu.Open(panels!);
        }, DeckPalette);
        controls.Children.Add(panels);
        _commandDeckPages = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 4, Margin = new Thickness(8, 0) };
        _commandDeckTarget = new TextBlock { Foreground = HudAccent, FontWeight = FontWeight.Bold,
            VerticalAlignment = VerticalAlignment.Center, HorizontalAlignment = HorizontalAlignment.Stretch,
            TextAlignment = TextAlignment.Right, TextTrimming = TextTrimming.CharacterEllipsis };
        toolbar.Children.Add(controls); Grid.SetColumn(_commandDeckPages, 1); toolbar.Children.Add(_commandDeckPages);
        Grid.SetColumn(_commandDeckTarget, 2); toolbar.Children.Add(_commandDeckTarget);
        return toolbar;
    }

    private void UpdateCommandDeckMenuChrome()
    {
        _statusBar.IsVisible = ShowMainStatusBar;
        _commandDeckToolbarHost.IsVisible = _useCommandDeckSkin;
        if (_menuInlineTools == null || _menuToolsFlyout == null || _menuToolsOverflow == null) return;
        _menuToolsFlyout.Hide();
        _menuToolsHost.Content = null;
        _menuToolsFlyout.Content = null;
        if (_useCommandDeckSkin)
        {
            _menuToolsFlyout.Content = _menuInlineTools;
            _menuToolsHost.Content = _menuToolsOverflow;
        }
        else
        {
            _commandDeckToolbarHost.Content = null;
            _menuToolsHost.Content = _menuInlineTools;
        }
    }

    private Control BuildCommandDeckInspector()
    {
        var inspector = new Grid { RowDefinitions = new RowDefinitions("Auto,Auto,*"), Background = HudFrame, ClipToBounds = true };
        _commandDeckInspector = inspector;
        _commandDeckIdentity = new TextBlock { Foreground = HudAccent, FontWeight = FontWeight.Bold,
            FontSize = 14, TextWrapping = TextWrapping.Wrap, Margin = UiThickness(12) };
        inspector.Children.Add(_commandDeckIdentity);
        var details = new StackPanel { Spacing = 0 };
        details.Children.Add(DeckInspectorSection("Trader", BuildDeckTraderPanel()));
        var ship = new StackPanel { Spacing = 5 };
        ship.Children.Add(BuildDeckPairedMetrics(new (string, TextBlock)[] {
            ("Fighters", _deckValFighters), ("Shields", _deckValShields),
            ("Turns/warp", _deckValTrnWarp), ("Holds", _deckValHTotal),
            ("Fuel ore", _deckValFuelOre), ("Organics", _deckValOrganics),
            ("Equipment", _deckValEquipment), ("Colonists", _deckValColonists) }));
        var devices = new StackPanel { Spacing = 5 };
        devices.Children.Add(BuildDeckPairedMetrics(new (string, TextBlock)[] {
            ("Probes", _deckValEther), ("Beacons", _deckValBeacon), ("Disruptors", _deckValDisruptor),
            ("Photons", _deckValPhoton), ("Armids", _deckValArmid), ("Limpets", _deckValLimpet),
            ("Genesis", _deckValGenesis), ("Atomic", _deckValAtomic), ("Corbomite", _deckValCorbo), ("Cloaks", _deckValCloak) }));
        devices.Children.Add(BuildDeckScannerRow());
        details.Children.Add(DeckInspectorSection("Ship & cargo", ship));
        details.Children.Add(DeckInspectorSection("Devices", devices));
        details.Children.Add(DeckInspectorSection("Online", _deckOnlinePlayersHost));
        var scroll = new ScrollViewer { Content = details, HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        Grid.SetRow(scroll, 1); inspector.Children.Add(scroll);
        _commandDeckDetails = scroll;
        _commandDeckNotes = new ContentControl {
            HorizontalContentAlignment = HorizontalAlignment.Stretch, VerticalContentAlignment = VerticalAlignment.Stretch };
        var notes = DeckInspectorSection("Notes", _commandDeckNotes);
        Grid.SetRow(notes, 2); inspector.Children.Add(notes);
        inspector.SizeChanged += (_, _) => UpdateCommandDeckPanelSpace();
        return inspector;
    }

    private CommandDeckPanel DeckInspectorSection(string title, Control content)
    {
        foreach (var text in content.GetLogicalDescendants().OfType<TextBlock>())
            if (text.FontSize > 13) text.FontSize = 12;
        var panel = new CommandDeckPanel(title, content, DeckPalette,
            (closed, collapsed) => SetCommandDeckPanelState(title, closed, collapsed));
        _commandDeckPanels.Add(title, panel);
        panel.SetState(_appPrefs.CommandDeckClosedPanels.Contains(title), _appPrefs.CommandDeckCollapsedPanels.Contains(title));
        return panel;
    }

    private Control BuildDeckPairedMetrics((string Label, TextBlock Value)[] metrics)
    {
        var grid = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto,*,Auto"), MinWidth = UiSize(220) };
        for (int i = 0; i < metrics.Length; i++)
        {
            if (i % 2 == 0) grid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
            var (label, value) = metrics[i];
            var caption = new TextBlock { Text = label, Foreground = HudMuted, FontSize = 11,
                TextWrapping = TextWrapping.Wrap, VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(i % 2 == 0 ? 0 : 8, 2, 4, 2) };
            value.FontSize = 11; value.Foreground = HudText; value.FontWeight = FontWeight.SemiBold;
            value.VerticalAlignment = VerticalAlignment.Center; value.TextAlignment = TextAlignment.Right;
            Grid.SetRow(caption, i / 2); Grid.SetColumn(caption, i % 2 * 2); grid.Children.Add(caption);
            Grid.SetRow(value, i / 2); Grid.SetColumn(value, i % 2 * 2 + 1); grid.Children.Add(value);
        }
        return new ScrollViewer { Content = grid, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Disabled };
    }

    private void SetCommandDeckPanelState(string name, bool closed, bool collapsed)
    {
        if (name == "Notes" && closed) SaveCurrentNotesNow();
        if (closed) _appPrefs.CommandDeckClosedPanels.Add(name); else _appPrefs.CommandDeckClosedPanels.Remove(name);
        if (collapsed) _appPrefs.CommandDeckCollapsedPanels.Add(name); else _appPrefs.CommandDeckCollapsedPanels.Remove(name);
        UpdateCommandDeckPanels(); _appPrefs.Save();
    }

    private void UpdateCommandDeckPanels()
    {
        foreach (var pair in _commandDeckPanels)
            pair.Value.SetState(_appPrefs.CommandDeckClosedPanels.Contains(pair.Key), _appPrefs.CommandDeckCollapsedPanels.Contains(pair.Key));
        UpdateCommandDeckPanelSpace();
        bool rightVisible = _appPrefs.ScriptWindowsInsideMtc ||
            (_commandDeckPanels.TryGetValue("Tactical", out var tactical) && tactical.IsVisible);
        if (_commandDeckRoot == null) return;
        _commandDeckReportsGrip!.IsVisible = rightVisible;
        _commandDeckRoot.ColumnDefinitions[3].Width = new GridLength(rightVisible ? 8 : 0);
        _commandDeckRoot.ColumnDefinitions[4].Width = new GridLength(rightVisible ? UiSize(_appPrefs.CommandDeckReportsWidth) : 0);
        if (_commandDeckRight != null) _commandDeckRight.IsVisible = rightVisible;
    }

    private void UpdateCommandDeckPanelSpace()
    {
        if (_commandDeckInspector == null || _commandDeckDetails == null || !_commandDeckPanels.TryGetValue("Notes", out var notes)) return;
        bool expanded = notes.IsVisible && !notes.IsCollapsed;
        _commandDeckInspector.RowDefinitions[1].Height = expanded ? GridLength.Auto : GridLength.Star;
        _commandDeckInspector.RowDefinitions[2].Height = expanded ? GridLength.Star : GridLength.Auto;
        _commandDeckDetails.MaxHeight = expanded
            ? Math.Max(0, _commandDeckInspector.Bounds.Height - (_commandDeckIdentity?.Bounds.Height ?? 0) - UiSize(245))
            : double.PositiveInfinity;
    }

    private Thumb BuildCommandDeckDivider(bool reports)
    {
        var grip = new Thumb { Width = 8, Focusable = true, Cursor = new Cursor(StandardCursorType.SizeWestEast),
            Template = new FuncControlTemplate<Thumb>((_, _) => new Border { Background = HudEdge, Width = 2,
                HorizontalAlignment = HorizontalAlignment.Center }) };
        ToolTip.SetTip(grip, reports ? "Resize script windows" : "Resize inspector and Notes");
        grip.DragDelta += (_, e) => ResizeCommandDeckPane(reports, e.Vector.X);
        grip.DragCompleted += (_, _) => _appPrefs.Save();
        grip.KeyDown += (_, e) =>
        {
            if (e.Key is not (Key.Left or Key.Right)) return;
            ResizeCommandDeckPane(reports, e.Key == Key.Right ? 12 : -12); _appPrefs.Save(); e.Handled = true;
        };
        return grip;
    }

    private void ResizeCommandDeckPane(bool reports, double delta)
    {
        if (_commandDeckRoot == null) return;
        int column = reports ? 4 : 0;
        double current = _commandDeckRoot.ColumnDefinitions[column].Width.Value;
        double available = Math.Max(0, (_deckWorkspaceHost?.Bounds.Width ?? 0) - UiSize(360));
        double requested = current + (reports ? -delta : delta);
        double width = Math.Clamp(requested, UiSize(180), Math.Max(UiSize(180), Math.Min(UiSize(520), current + available)));
        _commandDeckRoot.ColumnDefinitions[column].Width = new GridLength(width);
        if (reports) _appPrefs.CommandDeckReportsWidth = width / UiSize(1);
        else _appPrefs.CommandDeckInspectorWidth = width / UiSize(1);
    }

    private void RefreshCommandDeckSidebars()
    {
        if (_commandDeckRoot == null || _commandDeckNotes == null || _commandDeckReportsHost == null) return;
        bool notes = ShouldShowNotesPanel();
        if (notes && _commandDeckNotes.Content == null)
        {
            var panel = BuildNotesPanel();
            if (panel is Border border) { border.CornerRadius = new CornerRadius(0); border.BorderThickness = new Thickness(0); border.Padding = new Thickness(0); }
            if (_notesHeaderText != null) _notesHeaderText.IsVisible = false;
            _commandDeckNotes.Content = panel; ApplyUiFontScale(panel, CurrentUiScale);
        }
        _commandDeckPanels["Notes"].Available = notes;
        bool inside = _appPrefs.ScriptWindowsInsideMtc;
        UpdateCommandDeckPanels();
        _commandDeckReportsHost.IsVisible = inside;
        if (inside && _commandDeckReports == null)
        {
            _commandDeckReports = new CommandDeckScriptWindows(_mtcTabs.Where(t => t.IsLiveSession).Select(tab =>
                new CommandDeckScriptWindows.Source(tab.Id, tab.Title, tab.ScriptWindows,
                    () => SelectCommandDeckGame(tab.Id))), UiSize(1), DeckPalette);
            _commandDeckReportsHost.Content = _commandDeckReports;
            ApplyUiFontScale(_commandDeckReports, CurrentUiScale);
        }
        else if (!inside) { _commandDeckReportsHost.Content = null; _commandDeckReports = null; }
        RefreshCommandDeckMetadata();
    }

    private void SelectCommandDeckGame(int id)
    {
        ActivateMtcTab(id);
        UpdateCommandDeckSelection();
        FocusActiveTerminal();
    }

    private void ExpandCommandDeckGame(int id)
    {
        SelectCommandDeckGame(id);
        _commandDeckExpanded = _commandDeckExpanded == id ? null : id;
        LayoutCommandDeckPage();
    }

    private void UpdateCommandDeckSelection()
    {
        if (_commandDeckRoot == null) return;
        var tabs = _mtcTabs.Where(t => t.IsLiveSession).ToArray();
        int index = Array.FindIndex(tabs, t => t.Id == _activeMtcTabId);
        int nextPage = Math.Max(0, index / 4);
        if (nextPage != _commandDeckPage || (_commandDeckExpanded.HasValue && _commandDeckExpanded != _activeMtcTabId))
        { _commandDeckPage = nextPage; _commandDeckExpanded = null; LayoutCommandDeckPage(); }
        if (_deckTerminalControls.TryGetValue(_activeMtcTabId, out var terminal)) _deckTermCtrl = terminal;
        RefreshCommandDeckMetadata();
    }

    private void LayoutCommandDeckPage()
    {
        if (_commandDeckConsoleGrid == null) return;
        var tabs = _mtcTabs.Where(t => t.IsLiveSession).ToArray();
        _commandDeckPage = Math.Clamp(_commandDeckPage, 0, Math.Max(0, (tabs.Length - 1) / 4));
        for (int i = 0; i < tabs.Length; i++)
        {
            var tab = tabs[i];
            if (!_commandDeckConsoles.TryGetValue(tab.Id, out var console)) continue;
            bool visible = i / 4 == _commandDeckPage && (!_commandDeckExpanded.HasValue || _commandDeckExpanded == tab.Id);
            bool wasVisible = Interlocked.Exchange(ref tab.DeckConsoleVisible, visible ? 1 : 0) != 0;
            console.IsVisible = visible;
            if (visible && !wasVisible) RenderPendingDisplaySnapshotOnActivation(tab);
            Grid.SetRow(console, _commandDeckExpanded.HasValue ? 0 : i % 4 / 2);
            Grid.SetColumn(console, _commandDeckExpanded.HasValue ? 0 : i % 2);
            Grid.SetRowSpan(console, _commandDeckExpanded.HasValue ? 2 : 1);
            Grid.SetColumnSpan(console, _commandDeckExpanded.HasValue ? 2 : 1);
        }
        _commandDeckPages!.Children.Clear();
        if (tabs.Length > 4)
            for (int p = 0; p < (tabs.Length + 3) / 4; p++)
            {
                int id = tabs[p * 4].Id;
                var button = new Button { Content = $"Deck {p + 1}", Padding = new Thickness(8, 4),
                    Background = p == _commandDeckPage ? HudHeaderAlt : Brushes.Transparent, Foreground = HudText };
                button.Click += (_, _) => SelectCommandDeckGame(id);
                _commandDeckPages.Children.Add(button);
            }
        RefreshCommandDeckMetadata();
    }

    private void RefreshCommandDeckMetadata()
    {
        if (!_useCommandDeckSkin || _commandDeckRoot == null) return;
        RefreshCommandDeckTacticalContext();
        foreach (var tab in _mtcTabs)
        {
            bool active = tab.Id == _activeMtcTabId;
            bool connected = IsMtcTabConnectedToServer(tab);
            if (_commandDeckConsoles.TryGetValue(tab.Id, out var console))
            {
                var database = tab.RuntimeContext.ActiveDatabase ?? tab.SessionDb;
                var header = database is { IsOpen: true } ? database.DBHeader : null;
                string Sector(int? number, params string[] names)
                {
                    if (number is > 0 and not 65535) return number.Value.ToString();
                    foreach (string name in names)
                    {
                        string value = TWXProxy.Core.ScriptRef.GetCurrentGameVar(tab.RuntimeContext, name, string.Empty);
                        if (IsDefinedMombotSectorValue(value)) return value;
                    }
                    return "-";
                }
                string host = tab.EmbeddedGameConfig?.Host ?? tab.State.Host;
                int port = tab.EmbeddedGameConfig?.Port ?? tab.State.Port;
                string endpoint = string.IsNullOrWhiteSpace(host) ? "No server" : $"{host}:{port}";
                string mode = tab.Mombot.Enabled ? tab.Mombot.GetStatusSnapshot().Mode : "Off";
                console.Update(tab.Title, endpoint + (connected ? " / Connected" : " / Disconnected"),
                    Sector(header?.StarDock, "$STARDOCK", "$MAP~STARDOCK", "$MAP~stardock", "$BOT~STARDOCK"),
                    Sector(null, "$MAP~BACKDOOR", "$MAP~backdoor", "$backdoor"),
                    Sector(header?.Rylos, "$MAP~RYLOS", "$MAP~rylos", "$BOT~RYLOS"),
                    string.IsNullOrWhiteSpace(mode) ? "General" : mode, active, _commandDeckExpanded == tab.Id);
                console.RefreshExploration(database);
            }
            _commandDeckReports?.UpdateSourceTitle(tab.Id, tab.Title, active);
        }
        _commandDeckTarget!.Text = "Command target: " + (ActiveMtcTab?.Title ?? "None");
        ToolTip.SetTip(_commandDeckTarget, _commandDeckTarget.Text);
        _commandDeckIdentity!.Text = ActiveMtcTab?.Title ?? "No game selected";
    }

    private void RefreshCommandDeckTacticalContext()
    {
        if (!_useCommandDeckSkin || _tacticalMap == null) return;
        var owner = ActiveMtcTab;
        var database = owner?.RuntimeContext.ActiveDatabase ?? owner?.SessionDb;
        if (database is not { IsOpen: true }) database = null;
        var current = (Game: owner?.Id ?? -1, Database: database, Sector: owner?.State.Sector ?? 0,
            Stamp: database?.ChangeStamp ?? -1, Corp: owner?.State.Corp ?? 0, Trader: owner?.State.TraderName ?? string.Empty);
        if (_commandDeckTacticalContext == current) return;
        var previous = _commandDeckTacticalContext;
        _commandDeckTacticalContext = current;
        if (previous == null || previous.Value.Game != current.Game || !ReferenceEquals(previous.Value.Database, current.Database))
            _tacticalMap.ResetLiveContext();
        else
            _tacticalMap.RefreshSnapshot();
    }
}
