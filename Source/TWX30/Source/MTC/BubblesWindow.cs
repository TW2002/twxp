using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public class BubblesWindow : Window
{
    private enum FinderTabKind
    {
        Bubbles,
        DeadEnds,
        Tunnels,
    }

    private enum FinderSortMode
    {
        Door,
        Sectors,
        Depth,
        DistToSd,
        DistToSol,
    }

    private sealed record FinderRow(
        ushort Door,
        ushort Deepest,
        ushort Size,
        ushort Depth,
        int? DistToSd,
        int? DistToSol,
        IReadOnlyList<ushort> Sectors,
        IReadOnlyList<ushort> Gates,
        bool Gapped)
    {
        public int GateCount => Math.Max(1, Gates.Count);
    }

    private readonly record struct FinderCacheKey(
        Core.ModDatabase Database,
        long ChangeStamp,
        FinderTabKind Kind,
        int MinSize,
        int MaxSize,
        int MaxGates,
        bool NoEnemyPlanets,
        bool NoEnemyFigs,
        bool AllowSeparatedByGates);

    private sealed class FinderTabState
    {
        public required FinderTabKind Kind { get; init; }
        public required TextBlock Summary { get; init; }
        public required TextBlock SearchStatus { get; init; }
        public required TextBox MinSizeBox { get; init; }
        public required TextBox MaxSizeBox { get; init; }
        public TextBox? MaxGatesBox { get; init; }
        public required TextBox SectorSearchBox { get; init; }
        public required StackPanel RowHost { get; init; }
        public ScrollViewer? ResultsScrollViewer { get; set; }
        public TacticalMapControl PreviewMap { get; set; } = null!;
        public required Button CopySelectedButton { get; init; }
        public required Button SectorSearchButton { get; init; }
        public required CheckBox? AllowSeparatedByGatesCheckBox { get; init; }
        public required CheckBox? NoEnemyPlanetsCheckBox { get; init; }
        public required CheckBox? NoEnemyFigsCheckBox { get; init; }
        public Button? SortSectorsButton { get; set; }
        public Button? SortDepthButton { get; set; }
        public Button? SortDistToSdButton { get; set; }
        public Button? SortDistToSolButton { get; set; }
        public FinderSortMode SortMode { get; set; } = FinderSortMode.Sectors;
        public bool SortDescending { get; set; } = true;
        public List<FinderRow> Rows { get; set; } = [];
        public FinderRow? SelectedRow { get; set; }
        public bool Loaded { get; set; }
        public FinderCacheKey? CachedKey { get; set; }
        public IReadOnlyList<FinderRow> CachedRows { get; set; } = Array.Empty<FinderRow>();
    }

    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly Func<int> _getCurrentSector;
    private readonly Func<GameState?>? _getState;
    private readonly Action<int, int>? _setBubbleSizeRange;
    private readonly Action<int, int>? _setDeadEndSizeRange;
    private readonly Action<int, int>? _setTunnelSizeRange;
    private readonly FinderTabState _bubbleTab;
    private readonly FinderTabState _deadEndTab;
    private readonly FinderTabState _tunnelTab;

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgCardAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush BgSelected = new SolidColorBrush(Color.FromRgb(32, 83, 97));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush ColAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush ColWarn = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush ColError = new SolidColorBrush(Color.FromRgb(255, 106, 106));
    private static readonly IBrush ColSuccess = new SolidColorBrush(Color.FromRgb(116, 239, 164));

    public BubblesWindow(
        Func<Core.ModDatabase?> getDb,
        Func<int> getCurrentSector,
        Func<GameState?>? getState,
        Func<int> getBubbleMinSize,
        Func<int> getBubbleMaxSize,
        Action<int, int>? setBubbleSizeRange = null,
        Func<int>? getDeadEndMinSize = null,
        Func<int>? getDeadEndMaxSize = null,
        Action<int, int>? setDeadEndSizeRange = null,
        Func<int>? getTunnelMinSize = null,
        Func<int>? getTunnelMaxSize = null,
        Action<int, int>? setTunnelSizeRange = null)
    {
        _getDb = getDb;
        _getCurrentSector = getCurrentSector;
        _getState = getState;
        _setBubbleSizeRange = setBubbleSizeRange;
        _setDeadEndSizeRange = setDeadEndSizeRange;
        _setTunnelSizeRange = setTunnelSizeRange;

        Title = "Bubble Finder";
        Width = 1340;
        Height = 760;
        MinWidth = 980;
        MinHeight = 520;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _bubbleTab = BuildFinderTab(
            FinderTabKind.Bubbles,
            Math.Max(1, getBubbleMinSize()),
            Math.Max(1, getBubbleMaxSize()),
            showAllowSeparatedByGates: true);
        _deadEndTab = BuildFinderTab(
            FinderTabKind.DeadEnds,
            Math.Max(1, getDeadEndMinSize?.Invoke() ?? 2),
            Math.Max(1, getDeadEndMaxSize?.Invoke() ?? Core.ModBubble.DefaultMaxBubbleSize),
            showAllowSeparatedByGates: false);
        _tunnelTab = BuildFinderTab(
            FinderTabKind.Tunnels,
            Math.Max(1, getTunnelMinSize?.Invoke() ?? 2),
            Math.Max(1, getTunnelMaxSize?.Invoke() ?? Core.ModBubble.DefaultMaxBubbleSize),
            showAllowSeparatedByGates: false);

        var tabs = new TabControl
        {
            Margin = new Thickness(12),
            ItemsSource = new object[]
            {
                BuildTabItem("Bubbles", _bubbleTab),
                BuildTabItem("Dead Ends", _deadEndTab),
                BuildTabItem("Tunnels", _tunnelTab),
            },
        };

        tabs.SelectionChanged += async (_, _) =>
        {
            FinderTabState state = GetTabState(tabs.SelectedIndex);
            if (!state.Loaded)
                await RefreshTabAsync(state);
        };

        Content = tabs;
        Opened += async (_, _) =>
        {
            if (!_bubbleTab.Loaded)
                await RefreshTabAsync(_bubbleTab);
        };
    }

    private TabItem BuildTabItem(string header, FinderTabState state)
    {
        var refreshButton = new Button
        {
            Content = "Refresh",
            Padding = new Thickness(12, 5),
            Height = 34,
            VerticalAlignment = VerticalAlignment.Center,
        };
        StyleActionButton(refreshButton, primary: true);
        refreshButton.Click += async (_, _) => await RefreshTabFromInputAsync(state);

        var minLabel = BuildToolbarLabel("Min Size");
        var maxLabel = BuildToolbarLabel("Max Size");

        var actionsPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 10,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                minLabel,
                state.MinSizeBox,
                maxLabel,
                state.MaxSizeBox,
                refreshButton,
            },
        };
        if (state.MaxGatesBox != null)
        {
            actionsPanel.Children.Insert(4, BuildToolbarLabel("Max Entrances"));
            actionsPanel.Children.Insert(5, state.MaxGatesBox);
        }

        var headerText = new TextBlock
        {
            Text = state.Kind switch
            {
                FinderTabKind.Bubbles => "Bubble results",
                FinderTabKind.DeadEnds => "Dead-end results",
                FinderTabKind.Tunnels => "Tunnel results",
                _ => "Finder results",
            },
            Foreground = ColText,
            FontSize = 18,
            FontWeight = FontWeight.SemiBold,
        };

        var topStack = new StackPanel
        {
            Orientation = Orientation.Vertical,
            Spacing = 8,
            Children =
            {
                new DockPanel
                {
                    Children =
                    {
                        new Border
                        {
                            Child = actionsPanel,
                            VerticalAlignment = VerticalAlignment.Top,
                        }.WithDock(Dock.Right),
                        new StackPanel
                        {
                            Orientation = Orientation.Vertical,
                            Spacing = 4,
                            Children =
                            {
                                headerText,
                                state.Summary,
                                state.SearchStatus,
                            },
                        },
                    },
                },
            },
        };

        var filterPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 18,
            VerticalAlignment = VerticalAlignment.Center,
        };
        if (state.NoEnemyPlanetsCheckBox != null)
            filterPanel.Children.Add(state.NoEnemyPlanetsCheckBox);
        if (state.NoEnemyFigsCheckBox != null)
            filterPanel.Children.Add(state.NoEnemyFigsCheckBox);
        if (state.AllowSeparatedByGatesCheckBox != null)
            filterPanel.Children.Add(state.AllowSeparatedByGatesCheckBox);
        if (filterPanel.Children.Count > 0)
            topStack.Children.Add(filterPanel);

        var resultsScrollViewer = new ScrollViewer
        {
            Content = state.RowHost,
            VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
        };
        state.ResultsScrollViewer = resultsScrollViewer;

        var leftPane = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,*,Auto"),
            RowSpacing = 10,
            Children =
            {
                BuildColumnHeader(state),
                resultsScrollViewer.WithRow(1),
                new Border
                {
                    Background = BgPanel,
                    BorderBrush = InnerEdge,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(10),
                    Padding = new Thickness(10, 8),
                    Child = new Grid
                    {
                        ColumnDefinitions = new ColumnDefinitions("Auto,*,Auto,Auto,Auto"),
                        ColumnSpacing = 8,
                        Children =
                        {
                            state.CopySelectedButton,
                            BuildToolbarLabel("Find Sector").WithColumn(2),
                            state.SectorSearchBox.WithColumn(3),
                            state.SectorSearchButton.WithColumn(4),
                        },
                    },
                }.WithRow(2),
            },
        };

        var rightPane = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,*"),
            RowSpacing = 10,
            Children =
            {
                new Border
                {
                    Background = BgCardAlt,
                    BorderBrush = InnerEdge,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(10),
                    Padding = new Thickness(12, 10),
                    Child = new TextBlock
                    {
                        Text = "Map Preview",
                        Foreground = ColMuted,
                        FontSize = 12,
                        FontWeight = FontWeight.SemiBold,
                    },
                },
                new Border
                {
                    Background = BgPanel,
                    BorderBrush = Edge,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(14),
                    Padding = new Thickness(4),
                    Child = new Border
                    {
                        Background = BgCardAlt,
                        BorderBrush = InnerEdge,
                        BorderThickness = new Thickness(1),
                        CornerRadius = new CornerRadius(12),
                        ClipToBounds = true,
                        Child = state.PreviewMap,
                    },
                }.WithRow(1),
            },
        };

        var body = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("2.7*,4.3*"),
            ColumnSpacing = 12,
            Margin = new Thickness(0, 10, 0, 0),
            Children =
            {
                leftPane,
                rightPane.WithColumn(1),
            },
        };

        return new TabItem
        {
            Header = header,
            Content = new Border
            {
                Background = BgWin,
                Child = new DockPanel
                {
                    LastChildFill = true,
                    Children =
                    {
                        new Border
                        {
                            Background = BgPanel,
                            BorderBrush = Edge,
                            BorderThickness = new Thickness(1),
                            CornerRadius = new CornerRadius(14),
                            Padding = new Thickness(14, 12),
                            Margin = new Thickness(0, 0, 0, 10),
                            Child = topStack,
                        }.WithDock(Dock.Top),
                        body,
                    },
                },
            },
        };
    }

    private FinderTabState GetTabState(int selectedIndex)
    {
        return selectedIndex switch
        {
            1 => _deadEndTab,
            2 => _tunnelTab,
            _ => _bubbleTab,
        };
    }

    private FinderTabState BuildFinderTab(FinderTabKind kind, int minSize, int maxSize, bool showAllowSeparatedByGates)
    {
        var state = new FinderTabState
        {
            Kind = kind,
            Summary = new TextBlock
            {
                Foreground = ColMuted,
                FontSize = 13,
                TextWrapping = TextWrapping.Wrap,
            },
            SearchStatus = new TextBlock
            {
                Foreground = ColMuted,
                FontSize = 12,
                TextWrapping = TextWrapping.Wrap,
            },
            MinSizeBox = new TextBox
            {
                Text = minSize.ToString(),
                Width = 72,
                Height = 34,
                HorizontalContentAlignment = HorizontalAlignment.Center,
                VerticalContentAlignment = VerticalAlignment.Center,
            },
            MaxSizeBox = new TextBox
            {
                Text = maxSize.ToString(),
                Width = 72,
                Height = 34,
                HorizontalContentAlignment = HorizontalAlignment.Center,
                VerticalContentAlignment = VerticalAlignment.Center,
            },
            MaxGatesBox = showAllowSeparatedByGates
                ? new TextBox
                {
                    Text = "1",
                    Width = 60,
                    Height = 34,
                    HorizontalContentAlignment = HorizontalAlignment.Center,
                    VerticalContentAlignment = VerticalAlignment.Center,
                }
                : null,
            SectorSearchBox = new TextBox
            {
                Watermark = "sector",
                Width = 92,
                Height = 34,
                HorizontalContentAlignment = HorizontalAlignment.Center,
                VerticalContentAlignment = VerticalAlignment.Center,
            },
            RowHost = new StackPanel
            {
                Spacing = 8,
            },
            PreviewMap = null!,
            CopySelectedButton = new Button
            {
                Content = "Copy Sectors",
                Padding = new Thickness(12, 5),
                Height = 34,
                IsEnabled = false,
            },
            SectorSearchButton = new Button
            {
                Content = "Find",
                Padding = new Thickness(12, 5),
                Height = 34,
            },
            AllowSeparatedByGatesCheckBox = showAllowSeparatedByGates
                ? new CheckBox
                {
                    Content = "Allow sectors to be separated by gates",
                    IsChecked = true,
                    Foreground = ColText,
                    VerticalAlignment = VerticalAlignment.Center,
                }
                : null,
            NoEnemyPlanetsCheckBox = showAllowSeparatedByGates
                ? new CheckBox
                {
                    Content = "No enemy planets",
                    IsChecked = false,
                    Foreground = ColText,
                    VerticalAlignment = VerticalAlignment.Center,
                }
                : null,
            NoEnemyFigsCheckBox = showAllowSeparatedByGates
                ? new CheckBox
                {
                    Content = "No enemy figs",
                    IsChecked = false,
                    Foreground = ColText,
                    VerticalAlignment = VerticalAlignment.Center,
                }
                : null,
        };

        StyleInputBox(state.MinSizeBox);
        StyleInputBox(state.MaxSizeBox);
        if (state.MaxGatesBox != null)
            StyleInputBox(state.MaxGatesBox);
        StyleInputBox(state.SectorSearchBox);
        StyleActionButton(state.CopySelectedButton, primary: true);
        StyleActionButton(state.SectorSearchButton, primary: true);
        state.CopySelectedButton.Click += async (_, _) => await CopySelectedAsync(state);
        state.SectorSearchButton.Click += async (_, _) => await SearchForSectorAsync(state);
        state.SectorSearchBox.KeyDown += async (_, e) =>
        {
            if (e.Key != Key.Enter)
                return;

            e.Handled = true;
            await SearchForSectorAsync(state);
        };

        if (state.AllowSeparatedByGatesCheckBox != null)
            state.AllowSeparatedByGatesCheckBox.IsCheckedChanged += async (_, _) => await RefreshTabAsync(state, forceRecompute: true);
        if (state.NoEnemyPlanetsCheckBox != null)
            state.NoEnemyPlanetsCheckBox.IsCheckedChanged += async (_, _) => await RefreshTabAsync(state, forceRecompute: true);
        if (state.NoEnemyFigsCheckBox != null)
            state.NoEnemyFigsCheckBox.IsCheckedChanged += async (_, _) => await RefreshTabAsync(state, forceRecompute: true);

        state.PreviewMap = new TacticalMapControl(
            () => state.SelectedRow?.Door ?? Math.Max(1, _getCurrentSector()),
            _getDb,
            () => _getState?.Invoke())
        {
            MinHeight = 420,
        };
        state.PreviewMap.SetViewMode(TacticalMapViewMode.Bubble);

        return state;
    }

    private Control BuildColumnHeader(FinderTabState state)
    {
        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("84,84,84,92,92,*,Auto"),
            ColumnSpacing = 12,
        };

        if (state.Kind == FinderTabKind.Tunnels)
        {
            AddHeaderCell(grid, "Start", 0);
            AddHeaderCell(grid, "End", 1);
            state.SortSectorsButton = AddSortHeaderCell(grid, "Sectors", 2, state, FinderSortMode.Sectors);
            state.SortDepthButton = null;
            state.SortDistToSdButton = AddSortHeaderCell(grid, "Dist to SD", 3, state, FinderSortMode.DistToSd);
            state.SortDistToSolButton = AddSortHeaderCell(grid, "Dist to Terra", 4, state, FinderSortMode.DistToSol);
        }
        else
        {
            AddHeaderCell(grid, state.Kind == FinderTabKind.Bubbles ? "Entrance(s)" : "Door", 0);
            state.SortSectorsButton = AddSortHeaderCell(grid, "Sectors", 1, state, FinderSortMode.Sectors);
            state.SortDepthButton = AddSortHeaderCell(grid, "Depth", 2, state, FinderSortMode.Depth);
            state.SortDistToSdButton = AddSortHeaderCell(grid, "Dist to SD", 3, state, FinderSortMode.DistToSd);
            state.SortDistToSolButton = AddSortHeaderCell(grid, "Dist to Terra", 4, state, FinderSortMode.DistToSol);
        }
        AddHeaderCell(grid, "Sector List", 5);
        AddHeaderCell(grid, string.Empty, 6);
        UpdateSortButtons(state);

        return new Border
        {
            Background = BgCardAlt,
            BorderBrush = InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12, 10),
            Child = grid,
        };
    }

    private static TextBlock BuildToolbarLabel(string text)
    {
        return new TextBlock
        {
            Text = text,
            Foreground = ColMuted,
            FontSize = 12,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private static void AddHeaderCell(Grid grid, string text, int column)
    {
        var block = new TextBlock
        {
            Text = text,
            Foreground = ColMuted,
            FontSize = 12,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(block, column);
        grid.Children.Add(block);
    }

    private Button AddSortHeaderCell(Grid grid, string text, int column, FinderTabState state, FinderSortMode mode)
    {
        var button = new Button
        {
            Padding = new Thickness(0),
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Center,
        };
        button.Click += async (_, _) =>
        {
            OnSortClicked(state, mode);
            await RefreshTabAsync(state);
        };
        Grid.SetColumn(button, column);
        grid.Children.Add(button);
        return button;
    }

    private void OnSortClicked(FinderTabState state, FinderSortMode mode)
    {
        if (state.SortMode == mode)
            state.SortDescending = !state.SortDescending;
        else
        {
            state.SortMode = mode;
            state.SortDescending = true;
        }
    }

    private void UpdateSortButtons(FinderTabState state)
    {
        if (state.SortSectorsButton != null)
            state.SortSectorsButton.Content = BuildSortLabel("Sectors", state, FinderSortMode.Sectors);

        if (state.SortDepthButton != null)
            state.SortDepthButton.Content = BuildSortLabel("Depth", state, FinderSortMode.Depth);

        if (state.SortDistToSdButton != null)
            state.SortDistToSdButton.Content = BuildSortLabel("Dist to SD", state, FinderSortMode.DistToSd);

        if (state.SortDistToSolButton != null)
            state.SortDistToSolButton.Content = BuildSortLabel("Dist to Terra", state, FinderSortMode.DistToSol);
    }

    private static Control BuildSortLabel(string label, FinderTabState state, FinderSortMode mode)
    {
        string displayLabel = mode switch
        {
            FinderSortMode.DistToSd => "Dist to\nSD",
            FinderSortMode.DistToSol => "Dist to\nTerra",
            _ => label,
        };

        string text = state.SortMode != mode
            ? $"{displayLabel}  ▲▼"
            : state.SortDescending
                ? $"{displayLabel}  ▼"
                : $"{displayLabel}  ▲";

        return new TextBlock
        {
            Text = text,
            Foreground = ColMuted,
            FontSize = 12,
            FontWeight = FontWeight.SemiBold,
            TextWrapping = TextWrapping.Wrap,
            TextAlignment = TextAlignment.Left,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private async Task RefreshTabFromInputAsync(FinderTabState state)
    {
        if (!TryApplyInput(state, out _, out _, out _))
            return;

        await RefreshTabAsync(state, forceRecompute: true);
    }

    private async Task RefreshTabAsync(FinderTabState state, bool forceRecompute = false)
    {
        state.RowHost.Children.Clear();
        UpdateSortButtons(state);
        state.SearchStatus.Text = string.Empty;

        Core.ModDatabase? db = _getDb();
        if (db == null)
        {
            state.Summary.Text = "No active database. Connect to or open a game first.";
            state.Summary.Foreground = ColError;
            state.Rows = [];
            state.SelectedRow = null;
            state.CachedKey = null;
            state.CachedRows = Array.Empty<FinderRow>();
            UpdatePreviewSelection(state, null);
            state.Loaded = true;
            return;
        }

        if (!TryApplyInput(state, out int minSize, out int maxSize, out int maxGates))
            return;

        int stardockSector = ResolveStardockSector(db);
        int solSector = ResolveSolSector(db);
        IReadOnlyList<FinderRow> rows = GetOrLoadRows(
            state,
            db,
            minSize,
            maxSize,
            maxGates,
            stardockSector,
            solSector,
            forceRecompute);

        FinderRow? previousSelection = state.SelectedRow;
        state.Rows = SortRows(state, rows).ToList();
        state.Summary.Text = state.Kind switch
        {
            FinderTabKind.Bubbles => maxGates > 1
                ? $"{state.Rows.Count} solid bubble(s) found with up to {maxGates} entrance(s)."
                : $"{state.Rows.Count} solid bubble(s) found.",
            FinderTabKind.DeadEnds => $"{state.Rows.Count} dead end(s) found.",
            FinderTabKind.Tunnels => $"{state.Rows.Count} tunnel(s) found.",
            _ => $"{state.Rows.Count} result(s) found.",
        };
        state.Summary.Foreground = state.Rows.Count == 0 ? ColWarn : ColMuted;

        if (state.Rows.Count == 0)
        {
            state.SelectedRow = null;
            state.CopySelectedButton.IsEnabled = false;
            state.RowHost.Children.Add(BuildEmptyCard(
                state.Kind switch
                {
                    FinderTabKind.Bubbles => maxGates > 1
                        ? $"No bubbles match the current size range and maximum entrance count of {maxGates}."
                        : "No bubbles match the current size range.",
                    FinderTabKind.DeadEnds => "No dead ends match the current size range.",
                    FinderTabKind.Tunnels => "No tunnels match the current size range.",
                    _ => "No results match the current size range.",
                }));
            UpdatePreviewSelection(state, null);
            state.Loaded = true;
            return;
        }

        FinderRow selectedRow = previousSelection != null
            ? state.Rows.FirstOrDefault(row =>
                row.Door == previousSelection.Door &&
                row.Size == previousSelection.Size &&
                row.Sectors.SequenceEqual(previousSelection.Sectors))
              ?? state.Rows[0]
            : state.Rows[0];
        state.SelectedRow = selectedRow;
        state.CopySelectedButton.IsEnabled = true;

        foreach (FinderRow row in state.Rows)
            state.RowHost.Children.Add(BuildRowCard(state, row));

        UpdatePreviewSelection(state, selectedRow);
        state.Loaded = true;
        await Task.CompletedTask;
    }

    private bool TryApplyInput(FinderTabState state, out int minSize, out int maxSize, out int maxGates)
    {
        minSize = 1;
        maxSize = Core.ModBubble.DefaultMaxBubbleSize;
        maxGates = 1;

        string rawMin = (state.MinSizeBox.Text ?? string.Empty).Trim();
        string rawMax = (state.MaxSizeBox.Text ?? string.Empty).Trim();
        if (!int.TryParse(rawMin, out minSize) || minSize < 1 ||
            !int.TryParse(rawMax, out maxSize) || maxSize < 1)
        {
            state.Summary.Text = "Min and max size must both be whole numbers greater than zero.";
            state.Summary.Foreground = ColError;
            return false;
        }

        if (state.MaxGatesBox != null)
        {
            string rawGates = (state.MaxGatesBox.Text ?? string.Empty).Trim();
            if (!int.TryParse(rawGates, out maxGates) || maxGates < 1)
            {
                state.Summary.Text = "Maximum entrances must be a whole number greater than zero.";
                state.Summary.Foreground = ColError;
                return false;
            }

            state.MaxGatesBox.Text = maxGates.ToString();
        }

        if (minSize > maxSize)
            (minSize, maxSize) = (maxSize, minSize);

        state.MinSizeBox.Text = minSize.ToString();
        state.MaxSizeBox.Text = maxSize.ToString();

        if (state.Kind == FinderTabKind.Bubbles)
            _setBubbleSizeRange?.Invoke(minSize, maxSize);
        else if (state.Kind == FinderTabKind.DeadEnds)
            _setDeadEndSizeRange?.Invoke(minSize, maxSize);
        else
            _setTunnelSizeRange?.Invoke(minSize, maxSize);

        return true;
    }

    private async Task SearchForSectorAsync(FinderTabState state)
    {
        string rawSector = (state.SectorSearchBox.Text ?? string.Empty).Trim();
        if (!int.TryParse(rawSector, out int sectorNumber) || sectorNumber <= 0)
        {
            state.SearchStatus.Text = "Enter a whole-number sector to search.";
            state.SearchStatus.Foreground = ColError;
            return;
        }

        if (!TryApplyInput(state, out _, out _, out _))
            return;

        await RefreshTabAsync(state);
        if (state.Rows.Count == 0)
        {
            state.SearchStatus.Text = $"Sector {sectorNumber} is not in a {GetFinderKindName(state)}.";
            state.SearchStatus.Foreground = ColWarn;
            return;
        }

        FinderRow? row = state.Rows.FirstOrDefault(row =>
            row.Door == sectorNumber ||
            row.Deepest == sectorNumber ||
            row.Sectors.Contains((ushort)sectorNumber) ||
            row.Gates.Contains((ushort)sectorNumber));

        if (row == null)
        {
            state.SearchStatus.Text = $"Sector {sectorNumber} is not in a {GetFinderKindName(state)}.";
            state.SearchStatus.Foreground = ColWarn;
            return;
        }

        state.SearchStatus.Text = state.Kind switch
        {
            FinderTabKind.Bubbles => $"Sector {sectorNumber} is in bubble entrance(s) {FormatGates(row)}.",
            FinderTabKind.DeadEnds => $"Sector {sectorNumber} is in dead end door {row.Door}.",
            FinderTabKind.Tunnels => $"Sector {sectorNumber} is in tunnel {row.Door} -> {row.Deepest}.",
            _ => $"Sector {sectorNumber} was found.",
        };
        state.SearchStatus.Foreground = ColSuccess;
        SelectRow(state, row, bringIntoView: true);
    }

    private IReadOnlyList<FinderRow> GetOrLoadRows(
        FinderTabState state,
        Core.ModDatabase db,
        int minSize,
        int maxSize,
        int maxGates,
        int stardockSector,
        int solSector,
        bool forceRecompute)
    {
        FinderCacheKey cacheKey = new(
            db,
            db.ChangeStamp,
            state.Kind,
            minSize,
            maxSize,
            maxGates,
            state.NoEnemyPlanetsCheckBox?.IsChecked == true,
            state.NoEnemyFigsCheckBox?.IsChecked == true,
            state.AllowSeparatedByGatesCheckBox?.IsChecked == true);

        if (!forceRecompute && state.CachedKey == cacheKey)
            return state.CachedRows;

        IReadOnlyList<FinderRow> rows = state.Kind switch
        {
            FinderTabKind.Bubbles => LoadBubbleRows(db, minSize, maxSize, maxGates, state, stardockSector, solSector),
            FinderTabKind.DeadEnds => LoadDeadEndRows(db, minSize, maxSize, stardockSector, solSector),
            FinderTabKind.Tunnels => LoadTunnelRows(db, minSize, maxSize, stardockSector, solSector),
            _ => Array.Empty<FinderRow>(),
        };

        state.CachedKey = cacheKey;
        state.CachedRows = rows;
        return rows;
    }

    private IReadOnlyList<FinderRow> LoadBubbleRows(
        Core.ModDatabase db,
        int minSize,
        int maxSize,
        int maxGates,
        FinderTabState state,
        int stardockSector,
        int solSector)
    {
        IReadOnlyList<Core.BubbleInfo> bubbles = Core.ProxyGameOperations.GetBubbles(
            db,
            maxSize,
            state.AllowSeparatedByGatesCheckBox?.IsChecked == true,
            maxGates);

        bool noEnemyPlanets = state.NoEnemyPlanetsCheckBox?.IsChecked == true;
        bool noEnemyFigs = state.NoEnemyFigsCheckBox?.IsChecked == true;
        GameState? ownerState = _getState?.Invoke();

        return bubbles
            .Where(bubble => !bubble.Gapped)
            .Where(bubble => bubble.Size >= minSize && bubble.Size <= maxSize)
            .Where(bubble => Math.Max(1, bubble.GateCount) <= maxGates)
            .Where(bubble => !noEnemyPlanets || !BubbleHasEnemyPlanets(db, bubble.Sectors, ownerState))
            .Where(bubble => !noEnemyFigs || !BubbleHasEnemyFigs(db, bubble.Sectors, ownerState))
            .Select(bubble => new FinderRow(
                bubble.Gate,
                bubble.Deepest,
                bubble.Size,
                bubble.MaxDepth,
                stardockSector > 0 ? NormalizeNearestDistance(db, bubble.Gates, stardockSector) : null,
                solSector > 0 ? NormalizeNearestDistance(db, bubble.Gates, solSector) : null,
                bubble.Sectors,
                bubble.Gates,
                bubble.Gapped))
            .ToArray();
    }

    private static bool BubbleHasEnemyPlanets(
        Core.ModDatabase db,
        IReadOnlyList<ushort> sectors,
        GameState? state)
    {
        foreach (ushort sectorNumber in sectors)
        {
            foreach (Core.Planet planet in db.GetPlanetsInSector(sectorNumber))
            {
                if (SectorOwnershipClassifier.IsEnemyOwner(planet.Owner, state))
                    return true;
            }
        }

        return false;
    }

    private static bool BubbleHasEnemyFigs(
        Core.ModDatabase db,
        IReadOnlyList<ushort> sectors,
        GameState? state)
    {
        foreach (ushort sectorNumber in sectors)
        {
            if (db.LoadSector(sectorNumber) is not Core.SectorData sector)
                continue;

            if (sector.Fighters.Quantity > 0 &&
                SectorOwnershipClassifier.IsEnemyOwner(sector.Fighters.Owner, state))
            {
                return true;
            }
        }

        return false;
    }

    private static IReadOnlyList<FinderRow> LoadDeadEndRows(
        Core.ModDatabase db,
        int minSize,
        int maxSize,
        int stardockSector,
        int solSector)
    {
        IReadOnlyList<Core.DeadEndInfo> deadEnds = Core.ProxyGameOperations.GetDeadEnds(db, maxSize);
        return deadEnds
            .Where(deadEnd => deadEnd.Size >= minSize && deadEnd.Size <= maxSize)
            .Select(deadEnd => new FinderRow(
                deadEnd.Door,
                deadEnd.Deepest,
                deadEnd.Size,
                deadEnd.MaxDepth,
                stardockSector > 0 ? NormalizeDistance(db.GetDistance(deadEnd.Door, stardockSector)) : null,
                solSector > 0 ? NormalizeDistance(db.GetDistance(deadEnd.Door, solSector)) : null,
                deadEnd.Sectors,
                new[] { deadEnd.Door },
                false))
            .ToArray();
    }

    private static IReadOnlyList<FinderRow> LoadTunnelRows(
        Core.ModDatabase db,
        int minSize,
        int maxSize,
        int stardockSector,
        int solSector)
    {
        IReadOnlyList<Core.TunnelInfo> tunnels = Core.ProxyGameOperations.GetTunnels(db, maxSize);
        return tunnels
            .Where(tunnel => tunnel.Size >= minSize && tunnel.Size <= maxSize)
            .Select(tunnel => new FinderRow(
                tunnel.Start,
                tunnel.End,
                tunnel.Size,
                tunnel.Size,
                stardockSector > 0 ? NormalizeNearestDistance(db, tunnel.Start, tunnel.End, stardockSector) : null,
                solSector > 0 ? NormalizeNearestDistance(db, tunnel.Start, tunnel.End, solSector) : null,
                tunnel.Sectors,
                new[] { tunnel.Start, tunnel.End },
                false))
            .ToArray();
    }

    private static int? NormalizeDistance(int distance) => distance >= 0 ? distance : null;

    private static int? NormalizeNearestDistance(Core.ModDatabase db, int firstSector, int secondSector, int targetSector)
    {
        int first = db.GetDistance(firstSector, targetSector);
        int second = db.GetDistance(secondSector, targetSector);
        bool hasFirst = first >= 0;
        bool hasSecond = second >= 0;
        if (!hasFirst && !hasSecond)
            return null;
        if (!hasFirst)
            return second;
        if (!hasSecond)
            return first;
        return Math.Min(first, second);
    }

    private static int? NormalizeNearestDistance(Core.ModDatabase db, IReadOnlyList<ushort> sectors, int targetSector)
    {
        int? nearest = null;
        foreach (ushort sector in sectors)
        {
            int distance = db.GetDistance(sector, targetSector);
            if (distance < 0)
                continue;

            nearest = nearest.HasValue ? Math.Min(nearest.Value, distance) : distance;
        }

        return nearest;
    }

    private static int ResolveStardockSector(Core.ModDatabase db)
    {
        int sector = db.DBHeader.StarDock;
        return sector == 0 || sector == 65535 ? 0 : sector;
    }

    private static int ResolveSolSector(Core.ModDatabase db)
    {
        for (int sectorNumber = 1; sectorNumber <= db.DBHeader.Sectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector?.SectorPort == null || sector.SectorPort.ClassIndex != 0)
                continue;

            if (string.Equals(sector.SectorPort.Name, "Sol", StringComparison.OrdinalIgnoreCase))
                return sectorNumber;
        }

        return db.DBHeader.Sectors > 0 ? 1 : 0;
    }

    private IOrderedEnumerable<FinderRow> SortRows(FinderTabState state, IEnumerable<FinderRow> rows)
    {
        return state.SortMode switch
        {
            FinderSortMode.Sectors => state.SortDescending
                ? rows.OrderByDescending(row => row.Size).ThenBy(row => row.Door)
                : rows.OrderBy(row => row.Size).ThenBy(row => row.Door),
            FinderSortMode.Depth => state.SortDescending
                ? rows.OrderByDescending(row => row.Depth).ThenBy(row => row.Door)
                : rows.OrderBy(row => row.Depth).ThenBy(row => row.Door),
            FinderSortMode.DistToSd => SortByNullableDistance(rows, row => row.DistToSd, state.SortDescending),
            FinderSortMode.DistToSol => SortByNullableDistance(rows, row => row.DistToSol, state.SortDescending),
            _ => rows.OrderBy(row => row.Door),
        };
    }

    private static IOrderedEnumerable<FinderRow> SortByNullableDistance(
        IEnumerable<FinderRow> rows,
        Func<FinderRow, int?> selector,
        bool descending)
    {
        return descending
            ? rows.OrderBy(row => selector(row).HasValue ? 0 : 1)
                .ThenByDescending(row => selector(row) ?? int.MinValue)
                .ThenBy(row => row.Door)
            : rows.OrderBy(row => selector(row).HasValue ? 0 : 1)
                .ThenBy(row => selector(row) ?? int.MaxValue)
                .ThenBy(row => row.Door);
    }

    private Control BuildRowCard(FinderTabState state, FinderRow row)
    {
        string sectorList = string.Join(" ", row.Sectors);
        bool selected = state.SelectedRow == row;

        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("84,84,84,92,92,*,Auto"),
            ColumnSpacing = 12,
        };

        AddValueCell(grid, state.Kind == FinderTabKind.Bubbles ? FormatGates(row) : row.Door.ToString(), 0, ColAccent, bold: true);
        if (state.Kind == FinderTabKind.Tunnels)
        {
            AddValueCell(grid, row.Deepest.ToString(), 1, ColText);
            AddValueCell(grid, row.Size.ToString(), 2, ColText);
        }
        else
        {
            AddValueCell(grid, row.Size.ToString(), 1, ColText);
            AddValueCell(grid, row.Depth.ToString(), 2, ColText);
        }
        AddValueCell(grid, FormatDistance(row.DistToSd), 3, ColText);
        AddValueCell(grid, FormatDistance(row.DistToSol), 4, ColText);
        AddValueCell(grid, sectorList, 5, ColMuted, wrap: true);

        var copyButton = new Button
        {
            Content = "Copy",
            Padding = new Thickness(10, 4),
            Height = 30,
            VerticalAlignment = VerticalAlignment.Center,
        };
        StyleActionButton(copyButton, primary: false);
        copyButton.Click += async (_, _) => await CopySectorListAsync(copyButton, sectorList);
        Grid.SetColumn(copyButton, 6);
        grid.Children.Add(copyButton);

        var border = new Border
        {
            Background = selected ? BgSelected : BgCard,
            BorderBrush = selected ? ColAccent : Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Child = new Border
            {
                Background = selected ? BgCard : BgCardAlt,
                BorderBrush = selected ? ColAccent : InnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(9),
                Padding = new Thickness(12, 10),
                Child = grid,
            },
        };
        border.PointerPressed += (_, _) => SelectRow(state, row);
        return border;
    }

    private Control BuildEmptyCard(string text)
    {
        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(14, 12),
            Child = new TextBlock
            {
                Text = text,
                Foreground = ColText,
                FontSize = 14,
            },
        };
    }

    private static string GetFinderKindName(FinderTabState state)
        => state.Kind switch
        {
            FinderTabKind.Bubbles => "bubble",
            FinderTabKind.DeadEnds => "dead end",
            FinderTabKind.Tunnels => "tunnel",
            _ => "result",
        };

    private void SelectRow(FinderTabState state, FinderRow row, bool bringIntoView = false)
    {
        if (state.SelectedRow == row && !bringIntoView)
            return;

        state.SelectedRow = row;
        state.CopySelectedButton.IsEnabled = true;
        RebuildRows(state, bringIntoView);
        UpdatePreviewSelection(state, row);
    }

    private void RebuildRows(FinderTabState state, bool bringIntoView = false)
    {
        state.RowHost.Children.Clear();
        Control? selectedControl = null;
        foreach (FinderRow row in state.Rows)
        {
            Control rowCard = BuildRowCard(state, row);
            if (state.SelectedRow == row)
                selectedControl = rowCard;
            state.RowHost.Children.Add(rowCard);
        }

        if (bringIntoView && selectedControl != null)
            Dispatcher.UIThread.Post(() => selectedControl.BringIntoView());
    }

    private void UpdatePreviewSelection(FinderTabState state, FinderRow? row)
    {
        if (row == null)
        {
            state.PreviewMap.SetPreviewSelection(null);
            state.PreviewMap.FollowLiveSector();
            return;
        }

        if (state.Kind == FinderTabKind.Tunnels)
        {
            int centerSector = row.Sectors.Count > 0 ? row.Sectors[row.Sectors.Count / 2] : row.Door;
            state.PreviewMap.CenterOnSector(centerSector);
            state.PreviewMap.SetPreviewSelection(
                row.Sectors.Select(sector => (int)sector),
                gateSector: 0,
                surroundingDepth: 1,
                legendText: $"PREVIEW TUNNEL {row.Door} -> {row.Deepest}  |  {row.Sectors.Count} SELECTED");
        }
        else
        {
            state.PreviewMap.CenterOnSector(row.Door);
            state.PreviewMap.SetPreviewSelection(
                row.Sectors.Concat(row.Gates).Select(sector => (int)sector),
                row.Door,
                legendText: $"PREVIEW BUBBLE {FormatGates(row)}  |  {row.Size} SECTORS  |  {row.GateCount} ENTRANCE(S)");
        }

        state.PreviewMap.SetViewMode(TacticalMapViewMode.Bubble);
    }

    private async Task CopySelectedAsync(FinderTabState state)
    {
        if (state.SelectedRow == null)
            return;

        await ClipboardHelper.TrySetTextAsync(this, string.Join(" ", state.SelectedRow.Sectors));
    }

    private async Task CopySectorListAsync(Button button, string sectorList)
    {
        string previous = button.Content?.ToString() ?? "Copy";
        try
        {
            bool copied = await ClipboardHelper.TrySetTextAsync(this, sectorList);
            button.Content = copied ? "Copied" : "Copy failed";
            button.Foreground = copied ? ColSuccess : ColError;
            await Task.Delay(900);
        }
        finally
        {
            button.Content = previous;
            button.ClearValue(Button.ForegroundProperty);
        }
    }

    private static string FormatDistance(int? distance) => distance?.ToString() ?? string.Empty;

    private static string FormatGates(FinderRow row)
    {
        IReadOnlyList<ushort> gates = row.Gates.Count > 0 ? row.Gates : new[] { row.Door };
        if (gates.Count == 1)
            return gates[0].ToString();

        if (gates.Count == 2)
            return $"{gates[0]}/{gates[1]}";

        return $"{gates[0]} +{gates.Count - 1}";
    }

    private static void AddValueCell(Grid grid, string text, int column, IBrush foreground, bool bold = false, bool wrap = false)
    {
        var block = new TextBlock
        {
            Text = text,
            Foreground = foreground,
            FontSize = 13,
            FontWeight = bold ? FontWeight.SemiBold : FontWeight.Normal,
            VerticalAlignment = wrap ? VerticalAlignment.Top : VerticalAlignment.Center,
            TextWrapping = wrap ? TextWrapping.Wrap : TextWrapping.NoWrap,
        };
        Grid.SetColumn(block, column);
        grid.Children.Add(block);
    }

    private static void StyleActionButton(Button button, bool primary)
    {
        button.Background = primary ? ColAccent : BgCardAlt;
        button.Foreground = primary ? BgWin : ColText;
        button.BorderBrush = primary ? ColAccent : InnerEdge;
        button.BorderThickness = new Thickness(1);
        button.CornerRadius = new CornerRadius(8);
    }

    private static void StyleInputBox(TextBox textBox)
    {
        textBox.Background = BgCardAlt;
        textBox.BorderBrush = InnerEdge;
        textBox.BorderThickness = new Thickness(1);
        textBox.Foreground = ColText;
        textBox.CaretBrush = ColAccent;
    }

}

internal static class BubbleFinderControlExtensions
{
    public static T WithDock<T>(this T control, Dock dock)
        where T : Control
    {
        DockPanel.SetDock(control, dock);
        return control;
    }

    public static T WithColumn<T>(this T control, int column)
        where T : Control
    {
        Grid.SetColumn(control, column);
        return control;
    }

    public static T WithRow<T>(this T control, int row)
        where T : Control
    {
        Grid.SetRow(control, row);
        return control;
    }
}
