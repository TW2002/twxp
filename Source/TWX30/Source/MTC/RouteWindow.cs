using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Core = TWXProxy.Core;

namespace MTC;

public class RouteWindow : Window
{
    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly Func<int> _getCurrentSector;
    private readonly Func<GameState?>? _getState;
    private readonly TextBox _startSectorBox;
    private readonly TextBox _endSectorBox;
    private readonly TextBlock _hopsText;
    private readonly TextBlock _statusText;
    private readonly TacticalMapControl _previewMap;
    private readonly Button _copySectorsButton;
    private List<int> _currentRoute = [];

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgCardAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush ColAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush ColError = new SolidColorBrush(Color.FromRgb(255, 106, 106));
    private static readonly IBrush ColSuccess = new SolidColorBrush(Color.FromRgb(116, 239, 164));

    public RouteWindow(
        Func<Core.ModDatabase?> getDb,
        Func<int> getCurrentSector,
        Func<GameState?>? getState = null)
    {
        _getDb = getDb;
        _getCurrentSector = getCurrentSector;
        _getState = getState;

        Title = "Find Route";
        Width = 980;
        Height = 560;
        MinWidth = 760;
        MinHeight = 420;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _startSectorBox = new TextBox
        {
            Width = 96,
            Height = 34,
            Text = Math.Max(1, _getCurrentSector()).ToString(),
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
        };
        _endSectorBox = new TextBox
        {
            Width = 96,
            Height = 34,
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
        };
        StyleInputBox(_startSectorBox);
        StyleInputBox(_endSectorBox);

        _hopsText = new TextBlock
        {
            Text = "Hops: --",
            Foreground = ColText,
            FontSize = 18,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        _statusText = new TextBlock
        {
            Foreground = ColMuted,
            FontSize = 13,
            TextWrapping = TextWrapping.Wrap,
        };

        var findButton = new Button
        {
            Content = "Go",
            Width = 84,
            Height = 34,
            Padding = new Thickness(12, 5),
        };
        StyleActionButton(findButton, primary: true);
        findButton.Click += async (_, _) => await FindRouteAsync();

        _copySectorsButton = new Button
        {
            Content = "Copy Sectors",
            Height = 34,
            Padding = new Thickness(16, 5),
            IsEnabled = false,
        };
        StyleActionButton(_copySectorsButton, primary: true);
        _copySectorsButton.Click += async (_, _) => await CopyRouteAsync();

        var closeButton = new Button
        {
            Content = "Close",
            Height = 34,
            Padding = new Thickness(16, 5),
        };
        StyleActionButton(closeButton, primary: false);
        closeButton.Click += (_, _) => Close();

        _previewMap = new TacticalMapControl(
            () => _currentRoute.Count > 0 ? _currentRoute[0] : Math.Max(1, _getCurrentSector()),
            _getDb,
            () => _getState?.Invoke())
        {
            MinHeight = 320,
        };
        _previewMap.SetViewMode(TacticalMapViewMode.Bubble);

        _startSectorBox.KeyDown += async (_, e) => await HandleSectorBoxKeyDownAsync(e);
        _endSectorBox.KeyDown += async (_, e) => await HandleSectorBoxKeyDownAsync(e);

        var headerGrid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("Auto,96,Auto,96,Auto,*"),
            ColumnSpacing = 10,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                BuildLabel("Start sector:"),
                _startSectorBox.WithColumn(1),
                BuildLabel("End sector:").WithColumn(2),
                _endSectorBox.WithColumn(3),
                findButton.WithColumn(4),
                _hopsText.WithColumn(5),
            },
        };

        var topPanel = new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(14),
            Padding = new Thickness(14, 12),
            Child = new StackPanel
            {
                Spacing = 10,
                Children =
                {
                    headerGrid,
                    _statusText,
                },
            },
        };

        var previewPanel = new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(14),
            Padding = new Thickness(12),
            Margin = new Thickness(0, 10, 0, 0),
            Child = new Border
            {
                Background = BgCardAlt,
                BorderBrush = InnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                ClipToBounds = true,
                Child = _previewMap,
            },
        };

        var footer = new DockPanel
        {
            Margin = new Thickness(0, 10, 0, 0),
            LastChildFill = false,
            Children =
            {
                _copySectorsButton.WithDock(Dock.Left),
                closeButton.WithDock(Dock.Right),
            },
        };

        Content = new Border
        {
            Background = BgWin,
            Padding = new Thickness(12),
            Child = new DockPanel
            {
                LastChildFill = true,
                Children =
                {
                    topPanel.WithDock(Dock.Top),
                    footer.WithDock(Dock.Bottom),
                    previewPanel,
                },
            },
        };
    }

    private async Task HandleSectorBoxKeyDownAsync(KeyEventArgs e)
    {
        if (e.Key != Key.Enter)
            return;

        e.Handled = true;
        await FindRouteAsync();
    }

    private async Task FindRouteAsync()
    {
        Core.ModDatabase? db = _getDb();
        if (db == null)
        {
            ShowError("No active database. Connect to or open a game first.");
            return;
        }

        if (!TryParseSector(_startSectorBox.Text, out int startSector) ||
            !TryParseSector(_endSectorBox.Text, out int endSector))
        {
            ShowError("Enter whole-number start and end sectors.");
            return;
        }

        int maxSector = db.DBHeader.Sectors;
        if ((maxSector > 0 && startSector > maxSector) || (maxSector > 0 && endSector > maxSector))
        {
            ShowError($"Sectors must be between 1 and {maxSector}.");
            return;
        }

        List<int> route = db.CalculateBidirectionalShortestPath(startSector, endSector);
        if (route.Count == 0)
        {
            _currentRoute = [];
            _copySectorsButton.IsEnabled = false;
            _hopsText.Text = "Hops: --";
            _statusText.Text = $"No route found from {startSector} to {endSector}.";
            _statusText.Foreground = ColError;
            _previewMap.SetPreviewSelection(null);
            _previewMap.FollowLiveSector();
            return;
        }

        _currentRoute = route;
        int hops = Math.Max(0, route.Count - 1);
        _hopsText.Text = $"Hops: {hops}";
        _statusText.Text = $"Route found from {startSector} to {endSector}.";
        _statusText.Foreground = ColSuccess;
        _copySectorsButton.IsEnabled = true;
        _previewMap.CenterOnSector(route[0]);
        _previewMap.SetPreviewSelection(
            route,
            gateSector: 0,
            surroundingDepth: 1,
            legendText: $"ROUTE {startSector} -> {endSector}  |  {hops} HOPS",
            limitHighlightedSectors: false);
        _previewMap.SetViewMode(TacticalMapViewMode.Bubble);
        await Task.CompletedTask;
    }

    private async Task CopyRouteAsync()
    {
        if (_currentRoute.Count == 0)
            return;

        string previousText = _copySectorsButton.Content?.ToString() ?? "Copy Sectors";
        IBrush previousForeground = _copySectorsButton.Foreground ?? BgWin;
        try
        {
            bool copied = await ClipboardHelper.TrySetTextAsync(this, string.Join(" ", _currentRoute));
            _copySectorsButton.Content = copied ? "Copied" : "Copy failed";
            _copySectorsButton.Foreground = copied ? ColSuccess : ColError;
            await Task.Delay(900);
        }
        finally
        {
            _copySectorsButton.Content = previousText;
            _copySectorsButton.Foreground = previousForeground;
        }
    }

    private static bool TryParseSector(string? raw, out int sectorNumber)
    {
        return int.TryParse((raw ?? string.Empty).Trim(), out sectorNumber) && sectorNumber > 0;
    }

    private void ShowError(string message)
    {
        _statusText.Text = message;
        _statusText.Foreground = ColError;
        _hopsText.Text = "Hops: --";
        _copySectorsButton.IsEnabled = false;
    }
    private static TextBlock BuildLabel(string text)
    {
        return new TextBlock
        {
            Text = text,
            Foreground = ColText,
            FontSize = 15,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private static void StyleInputBox(TextBox box)
    {
        box.Background = BgCardAlt;
        box.BorderBrush = InnerEdge;
        box.BorderThickness = new Thickness(1);
        box.CaretBrush = ColText;
        box.Foreground = ColText;
        box.SelectionBrush = ColAccent;
    }

    private static void StyleActionButton(Button button, bool primary)
    {
        button.Background = primary ? ColAccent : BgCardAlt;
        button.Foreground = primary ? BgWin : ColText;
        button.BorderBrush = primary ? ColAccent : Edge;
        button.BorderThickness = new Thickness(1);
        button.CornerRadius = new CornerRadius(10);
    }
}
