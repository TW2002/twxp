using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Core = TWXProxy.Core;

namespace MTC;

internal sealed class MajorSpaceLanesWindow : Window
{
    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly StackPanel _routeHost;
    private readonly TextBlock _summaryText;
    private readonly TextBlock _statusText;
    private IReadOnlyList<Core.MajorSpaceLaneRoute> _routes = Array.Empty<Core.MajorSpaceLaneRoute>();

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgCardAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush ColAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush ColWarn = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush ColSuccess = new SolidColorBrush(Color.FromRgb(116, 239, 164));

    public MajorSpaceLanesWindow(Func<Core.ModDatabase?> getDb)
    {
        _getDb = getDb;

        Title = "Major Space Lanes";
        Width = 980;
        Height = 680;
        MinWidth = 720;
        MinHeight = 460;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _summaryText = new TextBlock
        {
            Text = "No database loaded.",
            Foreground = ColText,
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };

        _statusText = new TextBlock
        {
            Text = string.Empty,
            Foreground = ColMuted,
            FontSize = 12,
            VerticalAlignment = VerticalAlignment.Center,
        };

        _routeHost = new StackPanel
        {
            Orientation = Orientation.Vertical,
            Spacing = 8,
        };

        var refreshButton = BuildButton("Refresh", RefreshRoutes);
        var copyButton = BuildButton("Copy All", async () => await CopyAllRoutesAsync());
        var markButton = BuildButton("Mark MSLSEC", MarkMajorSpaceLaneSectors, primary: true);

        var toolbar = new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12, 10),
            Child = new Grid
            {
                ColumnDefinitions = new ColumnDefinitions("Auto,*"),
                ColumnSpacing = 14,
                Children =
                {
                    new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        Spacing = 8,
                        VerticalAlignment = VerticalAlignment.Center,
                        Children = { refreshButton, copyButton, markButton },
                    }.WithGridPosition(0, 0),
                    _summaryText.WithGridPosition(0, 1),
                },
            },
        };

        var scroll = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Content = _routeHost,
        };

        Content = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,*,Auto"),
            Margin = new Thickness(12),
            RowSpacing = 10,
            Children =
            {
                toolbar.WithGridPosition(0, 0),
                new Border
                {
                    Background = BgPanel,
                    BorderBrush = Edge,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(10),
                    Padding = new Thickness(10),
                    Child = scroll,
                }.WithGridPosition(1, 0),
                new Border
                {
                    Background = BgCardAlt,
                    BorderBrush = InnerEdge,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(10),
                    Padding = new Thickness(12, 8),
                    Child = _statusText,
                }.WithGridPosition(2, 0),
            },
        };

        Opened += (_, _) => RefreshRoutes();
    }

    private Button BuildButton(string text, Action action, bool primary = false)
    {
        var button = new Button
        {
            Content = text,
            Padding = new Thickness(12, 6),
            Background = primary ? ColAccent : BgCardAlt,
            BorderBrush = primary ? ColWarn : InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Foreground = primary ? Brushes.Black : ColText,
            FontWeight = FontWeight.SemiBold,
        };
        button.Click += (_, _) => action();
        return button;
    }

    private Button BuildButton(string text, Func<Task> action, bool primary = false)
    {
        var button = new Button
        {
            Content = text,
            Padding = new Thickness(12, 6),
            Background = primary ? ColAccent : BgCardAlt,
            BorderBrush = primary ? ColWarn : InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Foreground = primary ? Brushes.Black : ColText,
            FontWeight = FontWeight.SemiBold,
        };
        button.Click += async (_, _) => await action();
        return button;
    }

    private void RefreshRoutes()
    {
        Core.ModDatabase? db = _getDb();
        _routeHost.Children.Clear();
        _statusText.Text = string.Empty;

        if (db == null)
        {
            _routes = Array.Empty<Core.MajorSpaceLaneRoute>();
            _summaryText.Text = "No database loaded.";
            _routeHost.Children.Add(BuildEmptyState("Connect to a game or open a database to calculate Major Space Lanes."));
            return;
        }

        _routes = db.CalculateMajorSpaceLaneRoutes();
        int uniqueSectors = _routes.SelectMany(route => route.Sectors).Distinct().Count();
        _summaryText.Text = $"{_routes.Count} route(s), {uniqueSectors} unique MSL sector(s)";

        if (_routes.Count == 0)
        {
            _routeHost.Children.Add(BuildEmptyState("Major Space Lanes are unavailable until Terra, StarDock, Rylos, Alpha Centauri, and path data are known."));
            return;
        }

        foreach (Core.MajorSpaceLaneRoute route in _routes)
            _routeHost.Children.Add(BuildRouteRow(route));
    }

    private void MarkMajorSpaceLaneSectors()
    {
        Core.ModDatabase? db = _getDb();
        if (db == null)
        {
            _statusText.Text = "No database loaded.";
            return;
        }

        IReadOnlyList<Core.MajorSpaceLaneRoute> routes = db.CalculateMajorSpaceLaneRoutes();
        bool changed = db.MarkMajorSpaceLaneSectorParameters(routes);
        int uniqueSectors = routes.SelectMany(route => route.Sectors).Distinct().Count();
        RefreshRoutes();
        _statusText.Foreground = changed ? ColSuccess : ColMuted;
        _statusText.Text = changed
            ? $"Marked {uniqueSectors} sector(s) with MSLSEC=1."
            : $"MSLSEC was already set for {uniqueSectors} sector(s).";
    }

    private async Task CopyAllRoutesAsync()
    {
        if (_routes.Count == 0)
        {
            _statusText.Text = "No MSL routes to copy.";
            return;
        }

        string text = BuildRouteReport(_routes);
        bool copied = await ClipboardHelper.TrySetTextAsync(this, text);
        _statusText.Foreground = copied ? ColSuccess : ColWarn;
        _statusText.Text = copied
            ? "Copied Major Space Lane routes."
            : "Clipboard copy failed.";
    }

    private Control BuildRouteRow(Core.MajorSpaceLaneRoute route)
    {
        string sectorList = string.Join(" ", route.Sectors);
        var copyButton = BuildButton("Copy", async () =>
        {
            bool copied = await ClipboardHelper.TrySetTextAsync(this, FormatRoute(route));
            _statusText.Foreground = copied ? ColSuccess : ColWarn;
            _statusText.Text = copied ? $"Copied {route.Name}." : "Clipboard copy failed.";
        });

        var header = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,Auto,Auto"),
            ColumnSpacing = 10,
            Children =
            {
                new TextBlock
                {
                    Text = route.Name,
                    Foreground = ColText,
                    FontSize = 14,
                    FontWeight = FontWeight.Bold,
                    VerticalAlignment = VerticalAlignment.Center,
                }.WithGridPosition(0, 0),
                new TextBlock
                {
                    Text = $"{Math.Max(0, route.Sectors.Count - 1)} hop(s)",
                    Foreground = ColMuted,
                    FontSize = 12,
                    VerticalAlignment = VerticalAlignment.Center,
                }.WithGridPosition(0, 1),
                copyButton.WithGridPosition(0, 2),
            },
        };

        return new Border
        {
            Background = BgCard,
            BorderBrush = InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12),
            Child = new StackPanel
            {
                Orientation = Orientation.Vertical,
                Spacing = 8,
                Children =
                {
                    header,
                    new TextBlock
                    {
                        Text = $"{route.FromSector} -> {route.ToSector}",
                        Foreground = ColAccent,
                        FontSize = 12,
                        FontWeight = FontWeight.SemiBold,
                    },
                    new TextBlock
                    {
                        Text = sectorList,
                        Foreground = ColText,
                        FontSize = 12,
                        TextWrapping = TextWrapping.Wrap,
                    },
                },
            },
        };
    }

    private static Control BuildEmptyState(string text)
    {
        return new Border
        {
            Background = BgCard,
            BorderBrush = InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(16),
            Child = new TextBlock
            {
                Text = text,
                Foreground = ColMuted,
                FontSize = 13,
                TextWrapping = TextWrapping.Wrap,
            },
        };
    }

    private static string BuildRouteReport(IEnumerable<Core.MajorSpaceLaneRoute> routes)
    {
        var sb = new StringBuilder();
        foreach (Core.MajorSpaceLaneRoute route in routes)
        {
            if (sb.Length > 0)
                sb.AppendLine();
            sb.AppendLine(FormatRoute(route));
        }

        return sb.ToString();
    }

    private static string FormatRoute(Core.MajorSpaceLaneRoute route)
        => $"{route.Name} ({route.FromSector} -> {route.ToSector}, {Math.Max(0, route.Sectors.Count - 1)} hop(s))\n{string.Join(" ", route.Sectors)}";
}
