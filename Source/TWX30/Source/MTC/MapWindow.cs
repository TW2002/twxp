using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Shapes;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using SkiaSharp;
using Avalonia.Skia;
using Avalonia.Rendering.SceneGraph;
using Core = TWXProxy.Core;

namespace MTC;

/// <summary>
/// Visual sector map window — similar to SWATH's Visual Map.
/// Renders sectors as boxes with warp-line connections.
/// Solid lines = two-way warps, dashed lines = one-way warps.
/// </summary>
public class MapWindow : Window
{
    private enum MapViewMode
    {
        Classic,
        Bubble,
        Hex,
    }

    // ── Layout constants ──────────────────────────────────────────────────
    private const float BoxW    = 56f;   // sector box width
    private const float BoxH    = 38f;   // sector box height
    private const float GridX   = 90f;   // horizontal grid cell size
    private const float GridY   = 66f;   // vertical grid cell size
    private const int   MaxDepth = 4;    // BFS depth from center

    // ── State ─────────────────────────────────────────────────────────────
    private int  _centerSector;
    private readonly Func<int>            _getCurrentSector;
    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly Func<GameState?>? _getState;
    private bool _followCurrentSector = true;
    private MapViewMode _viewMode = MapViewMode.Bubble;

    // Computed layout: sector number → canvas position
    private Dictionary<int, SKPoint> _positions = new();
    private Dictionary<int, Core.SectorData?> _sectorCache = new();
    private Dictionary<int, int> _depthCache = new();
    private HashSet<int> _majorSpaceLaneSectors = new();
    private (ushort StarDock, ushort AlphaCentauri, ushort Rylos)? _majorSpaceLaneHeader;
    private long _majorSpaceLaneChangeStamp = long.MinValue;

    // Nav history (browser-style back/forward)
    private readonly List<int> _history      = new();
    private int                _historyIndex = -1;

    // Pan & zoom
    private float   _zoom      = 1.0f;
    private SKPoint _pan       = new(0, 0);
    private bool    _dragging;
    private bool    _dragMoved;
    private Point   _dragStart;
    private SKPoint _panStart;

    // UI controls
    private readonly MapCanvas  _canvas;
    private readonly TacticalMapControl _tacticalMap;
    private readonly TextBlock  _titleLabel;
    private readonly TextBox    _sectorBox;
    private readonly ComboBox   _viewSelector;
    private          Button     _backBtn    = new();
    private          Button     _fwdBtn     = new();
    private          Slider     _zoomSlider = new();
    private readonly TextBlock  _zoomLabel;
    private readonly StackPanel _tacticalZoomBar;
    private readonly TextBlock  _tacticalZoomText;
    private readonly Control    _classicLegend;
    private readonly DispatcherTimer _refreshTimer;

    // ── Colors (SkiaSharp) ────────────────────────────────────────────────
    private static readonly IBrush DeckWindow = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush DeckFrame = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush DeckFrameAlt = new SolidColorBrush(Color.FromRgb(18, 43, 53));
    private static readonly IBrush DeckHeader = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush DeckHeaderAlt = new SolidColorBrush(Color.FromRgb(20, 64, 74));
    private static readonly IBrush DeckEdge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush DeckInnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush DeckText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush DeckMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush DeckAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush DeckAccentHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush DeckAccentInk = new SolidColorBrush(Color.FromRgb(8, 26, 30));
    private static readonly SKColor ColBg         = new(0x0a, 0x0a, 0x18);
    private static readonly SKColor ColBoxExp      = new(0x00, 0xc8, 0xc8); // teal — explored
    private static readonly SKColor ColBoxDensity  = new(0x40, 0x80, 0x80); // dim teal — density only
    private static readonly SKColor ColBoxUnknown  = new(0x50, 0x50, 0x55); // gray — unknown
    private static readonly SKColor ColBoxCurrent  = new(0x22, 0xcc, 0x55); // green — current
    private static readonly SKColor ColBoxMajorLane= new(0x33, 0x99, 0xff); // blue — major space lane
    private static readonly SKColor ColBoxText     = new(0x00, 0x00, 0x00);
    private static readonly SKColor ColBoxTextUnk  = new(0xdd, 0xdd, 0xdd);
    private static readonly SKColor ColLineTwo     = new(0xff, 0xff, 0xff); // solid two-way
    private static readonly SKColor ColLineOne     = new(0x88, 0x88, 0x88); // dashed one-way
    private static readonly SKColor ColStarBg      = new(0xff, 0xff, 0xff);
    private static readonly SKColor ColPort        = new(0x00, 0xff, 0x00);

    private static readonly float[] DashIntervals  = { 6f, 5f };

    // ── Star field (random, fixed seed per window) ────────────────────────
    private readonly (float X, float Y, byte A)[] _stars;

    public MapWindow(
        Func<int> getCurrentSector,
        Func<Core.ModDatabase?> getDb,
        Func<GameState?>? getState = null)
    {
        _getCurrentSector = getCurrentSector;
        _getDb            = getDb;
        _getState         = getState;
        _centerSector     = getCurrentSector();
        if (_centerSector <= 0) _centerSector = 1;

        Title          = "Visual Map";
        Width          = 1100;
        Height         = 760;
        MinWidth       = 600;
        MinHeight      = 400;
        Background     = DeckWindow;

        // Generate a fixed star field
        var rng = new Random(42);
        _stars = new (float, float, byte)[250];
        for (int i = 0; i < _stars.Length; i++)
            _stars[i] = ((float)(rng.NextDouble() * 4000 - 2000),
                          (float)(rng.NextDouble() * 4000 - 2000),
                          (byte)(80 + rng.Next(176)));

        // ── Title label ───────────────────────────────────────────────────
        _titleLabel = new TextBlock
        {
            Text              = "Visual Map",
            Foreground        = DeckText,
            FontFamily        = new FontFamily("Eurostile, Bank Gothic, Bahnschrift, Segoe UI, sans-serif"),
            FontSize          = 14,
            FontWeight        = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
            Margin            = new Thickness(6, 0, 12, 0),
        };

        _backBtn = new Button
        {
            Content = BuildToolbarChevronIcon(forward: false),
            Width = 36,
            Height = 32,
            Padding = new Thickness(2),
            IsEnabled = false,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _backBtn.Click += (_, _) => NavBack();
        ToolTip.SetTip(_backBtn, "Back");
        StyleToolbarButton(_backBtn);

        _fwdBtn = new Button
        {
            Content = BuildToolbarChevronIcon(forward: true),
            Width = 36,
            Height = 32,
            Padding = new Thickness(2),
            IsEnabled = false,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _fwdBtn.Click += (_, _) => NavForward();
        ToolTip.SetTip(_fwdBtn, "Forward");
        StyleToolbarButton(_fwdBtn);

        var centerBtn  = new Button { Content = "Go", Padding = new Thickness(12, 4), Height = 32, VerticalAlignment = VerticalAlignment.Center };
        centerBtn.Click  += (_, _) => GoToSector();
        StyleToolbarButton(centerBtn, primary: true);

        var currentBtn = new Button { Content = "Current", Padding = new Thickness(12, 4), Height = 32, VerticalAlignment = VerticalAlignment.Center };
        currentBtn.Click += (_, _) =>
        {
            _followCurrentSector = true;
            NavigateTo(Math.Max(1, _getCurrentSector()));
        };
        StyleToolbarButton(currentBtn);

        var refreshBtn = new Button { Content = "\u21bb", Width = 32, Height = 32, Padding = new Thickness(4, 2), VerticalAlignment = VerticalAlignment.Center };
        refreshBtn.Click += (_, _) => Rebuild();
        ToolTip.SetTip(refreshBtn, "Refresh");
        StyleToolbarButton(refreshBtn);

        _zoomSlider = new Slider
        {
            Minimum           = 0,
            Maximum           = 100,
            Value             = ZoomToSlider(_zoom),
            Width             = 120,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _zoomSlider.ValueChanged += (_, e) =>
        {
            _zoom = SliderToZoom((float)e.NewValue);
            _canvas?.InvalidateVisual();
        };
        _zoomLabel = new TextBlock
        {
            Text = "Zoom:",
            Foreground = DeckMuted,
            FontSize = 12,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(10, 0, 4, 0),
        };

        _sectorBox = new TextBox
        {
            Width                    = 70,
            FontSize                 = 12,
            Watermark                = "sector #",
            VerticalAlignment        = VerticalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
        };
        _sectorBox.KeyDown += OnSectorBoxKeyDown;
        StyleToolbarTextBox(_sectorBox);

        _viewSelector = new ComboBox
        {
            Width = 118,
            Height = 32,
            VerticalAlignment = VerticalAlignment.Center,
            Background = DeckHeaderAlt,
            BorderBrush = DeckInnerEdge,
            BorderThickness = new Thickness(1),
            Foreground = DeckText,
            ItemsSource = new[] { "Classic", "Modern", "Hex" },
            SelectedIndex = 1,
        };
        _viewSelector.SelectionChanged += (_, _) =>
        {
            SetMapViewMode(_viewSelector.SelectedIndex switch
            {
                0 => MapViewMode.Classic,
                2 => MapViewMode.Hex,
                _ => MapViewMode.Bubble,
            });
        };

        var sectorLabelNav = new TextBlock
        {
            Text              = "Sector:",
            Foreground        = DeckMuted,
            FontSize          = 12,
            VerticalAlignment = VerticalAlignment.Center,
            Margin            = new Thickness(10, 0, 4, 0),
        };
        var viewLabel = new TextBlock
        {
            Text              = "View:",
            Foreground        = DeckMuted,
            FontSize          = 12,
            VerticalAlignment = VerticalAlignment.Center,
            Margin            = new Thickness(10, 0, 4, 0),
        };

        _tacticalZoomText = new TextBlock
        {
            Text = "--",
            Foreground = DeckText,
            FontSize = 12,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var zoomOutBtn = new Button
        {
            Content = BuildToolbarZoomIcon(increase: false),
            Width = 36,
            Height = 32,
            Padding = new Thickness(2),
            VerticalAlignment = VerticalAlignment.Center,
        };
        zoomOutBtn.Click += (_, _) => _tacticalMap?.AdjustZoom(-0.12f);
        StyleToolbarButton(zoomOutBtn);
        var zoomInBtn = new Button
        {
            Content = BuildToolbarZoomIcon(increase: true),
            Width = 36,
            Height = 32,
            Padding = new Thickness(2),
            VerticalAlignment = VerticalAlignment.Center,
        };
        zoomInBtn.Click += (_, _) => _tacticalMap?.AdjustZoom(0.12f);
        StyleToolbarButton(zoomInBtn);
        var zoomResetBtn = new Button { Content = "Reset", Height = 32, Padding = new Thickness(12, 4), VerticalAlignment = VerticalAlignment.Center };
        zoomResetBtn.Click += (_, _) => _tacticalMap?.ResetZoom();
        StyleToolbarButton(zoomResetBtn);
        _tacticalZoomBar = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 6,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                zoomOutBtn,
                BuildInfoChip("Zoom", _tacticalZoomText),
                zoomInBtn,
                zoomResetBtn,
            },
        };

        var toolbar = new Border
        {
            Background = DeckFrame,
            BorderBrush = DeckEdge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(16),
            Padding    = new Thickness(10, 8),
            Child      = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Spacing     = 6,
                Children    =
                {
                    _backBtn, _fwdBtn,
                    new Border { Width = 4 },
                    _titleLabel,
                    sectorLabelNav, _sectorBox, centerBtn, currentBtn, refreshBtn,
                    viewLabel, _viewSelector,
                    _zoomLabel, _zoomSlider,
                    _tacticalZoomBar,
                },
            },
        };

        // Legend
        _classicLegend = BuildLegend();

        // ── Canvas ────────────────────────────────────────────────────────
        _canvas = new MapCanvas(this);
        _canvas.PointerWheelChanged += OnWheel;
        _canvas.PointerPressed      += OnPointerPressed;
        _canvas.PointerMoved        += OnPointerMoved;
        _canvas.PointerReleased     += OnPointerReleased;
        _canvas.DoubleTapped        += OnDoubleTapped;

        _tacticalMap = new TacticalMapControl(
            () => _centerSector,
            () => _getDb(),
            () => _getState?.Invoke())
        {
            MinHeight = 220,
        };
        _tacticalMap.ZoomChanged += _ => Dispatcher.UIThread.Post(UpdateTacticalZoomUi, DispatcherPriority.Background);
        _tacticalMap.SectorDoubleClicked += (_, sectorNumber) =>
        {
            _followCurrentSector = false;
            NavigateTo(sectorNumber);
        };

        var mapSurface = new Grid();
        mapSurface.Children.Add(_canvas);
        mapSurface.Children.Add(_tacticalMap);

        var layout = new DockPanel { Background = DeckWindow, Margin = new Thickness(10) };
        DockPanel.SetDock(toolbar, Dock.Top);
        DockPanel.SetDock(_classicLegend,  Dock.Bottom);
        layout.Children.Add(toolbar);
        layout.Children.Add(_classicLegend);
        layout.Children.Add(new Border
        {
            Background = DeckFrame,
            BorderBrush = DeckEdge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(2),
            Child = new Border
            {
                Background = DeckFrameAlt,
                BorderBrush = DeckInnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                ClipToBounds = true,
                Child = mapSurface,
            },
        });

        Content = layout;

        // Auto-refresh every 2 s:
        //   • If the player has moved to a new sector → NavigateTo (full re-center + rebuild)
        //   • Otherwise → RefreshData (re-read DB, redraw, no layout recalc)
        _refreshTimer = new DispatcherTimer(TimeSpan.FromSeconds(2), DispatcherPriority.Background,
            (_, _) =>
            {
                int cur = _getCurrentSector();
                if (_followCurrentSector && cur > 0 && cur != _centerSector)
                    NavigateTo(cur);
                else
                    RefreshData();
            });
        Opened  += (_, _) => _refreshTimer.Start();
        Closing += (_, _) => _refreshTimer.Stop();

        SetMapViewMode(MapViewMode.Bubble);
        NavigateTo(_centerSector);
    }

    // ── Legend bar ────────────────────────────────────────────────────────

    private Border BuildLegend()
    {
        static Border Swatch(Color c) => new Border
        {
            Width = 18, Height = 12, Background = new SolidColorBrush(c),
            Margin = new Thickness(0, 0, 4, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };
        static TextBlock Lbl(string t) => new TextBlock
        {
            Text = t, Foreground = Brushes.Silver, FontSize = 11,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 12, 0),
        };

        var panel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Background  = new SolidColorBrush(Color.FromRgb(0x14, 0x14, 0x20)),
            Margin      = new Thickness(0),
            Height      = 24,
            Children    =
            {
                new Border { Width = 8 },
                Swatch(Color.FromRgb(0x22, 0xcc, 0x55)), Lbl("Current"),
                Swatch(Color.FromRgb(0x33, 0x99, 0xff)), Lbl("MSL"),
                Swatch(Color.FromRgb(0x00, 0xc8, 0xc8)), Lbl("Explored"),
                Swatch(Color.FromRgb(0x40, 0x80, 0x80)), Lbl("Density only"),
                Swatch(Color.FromRgb(0x50, 0x50, 0x55)), Lbl("Unknown"),
            },
        };

        // Solid line swatch
        var solidLine = new Border
        {
            Width = 22, Height = 2,
            Background = new SolidColorBrush(Colors.White),
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 4, 0),
        };
        panel.Children.Add(solidLine);
        panel.Children.Add(Lbl("Two-way"));

        // Dashed line swatch — approximate with three small borders
        var dashPanel = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 4, 0) };
        foreach (var (w, bg) in new (int, IBrush)[] { (5, Brushes.Gray), (3, Brushes.Transparent), (5, Brushes.Gray), (3, Brushes.Transparent), (5, Brushes.Gray) })
            dashPanel.Children.Add(new Border { Width = w, Height = 2, Background = bg });
        panel.Children.Add(dashPanel);
        panel.Children.Add(Lbl("One-way"));

        return new Border
        {
            Background = DeckFrame,
            BorderBrush = DeckInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(14),
            Padding = new Thickness(6, 2),
            Child = panel,
        };
    }

    private void SetMapViewMode(MapViewMode viewMode)
    {
        _viewMode = viewMode;
        bool classic = viewMode == MapViewMode.Classic;

        _canvas.IsVisible = classic;
        _canvas.IsHitTestVisible = classic;
        _tacticalMap.IsVisible = !classic;
        _tacticalMap.IsHitTestVisible = !classic;
        _classicLegend.IsVisible = classic;
        _zoomSlider.IsVisible = classic;
        _zoomLabel.IsVisible = classic;
        _tacticalZoomBar.IsVisible = !classic;

        if (!classic)
        {
            _tacticalMap.SetViewMode(viewMode == MapViewMode.Hex
                ? TacticalMapViewMode.Hex
                : TacticalMapViewMode.Bubble);
            UpdateTacticalZoomUi();
            _tacticalMap.InvalidateVisual();
        }
        else
        {
            _canvas.InvalidateVisual();
        }

        UpdateTitle();
    }

    private void UpdateTitle()
    {
        _titleLabel.Text = $"Map View / Center: Sector {_centerSector}";
    }

    private void UpdateTacticalZoomUi()
    {
        _tacticalZoomText.Text = $"{_tacticalMap.ZoomPercent}%";
    }

    private static void StyleToolbarButton(Button button, bool primary = false)
    {
        button.Background = primary ? DeckAccent : DeckHeaderAlt;
        button.BorderBrush = primary ? DeckAccentHot : DeckInnerEdge;
        button.BorderThickness = new Thickness(1);
        button.CornerRadius = new CornerRadius(10);
        button.Foreground = primary ? DeckAccentInk : DeckText;
        button.FontSize = 12;
        button.FontWeight = FontWeight.SemiBold;
    }

    private static Grid BuildToolbarIconSurface(Color accentColor)
    {
        var accentBrush = new SolidColorBrush(accentColor);
        var haloBrush = new SolidColorBrush(Color.FromArgb(36, accentColor.R, accentColor.G, accentColor.B));
        var sheenBrush = new SolidColorBrush(Color.FromArgb(140, 255, 255, 255));

        var ring = new Border
        {
            Width = 14,
            Height = 14,
            CornerRadius = new CornerRadius(7),
            BorderThickness = new Thickness(1.15),
            BorderBrush = accentBrush,
            Background = haloBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var sheen = new Border
        {
            Width = 6,
            Height = 1,
            CornerRadius = new CornerRadius(1),
            Background = sheenBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 2, 0, 0),
            Opacity = 0.9,
        };

        return new Grid
        {
            Width = 16,
            Height = 16,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                ring,
                sheen,
            },
        };
    }

    private static Control BuildToolbarZoomIcon(bool increase)
    {
        Color accentColor = increase
            ? Color.FromRgb(118, 255, 141)
            : Color.FromRgb(0, 212, 201);

        var accentBrush = new SolidColorBrush(accentColor);
        var icon = BuildToolbarIconSurface(accentColor);
        icon.Children.Add(new Border
        {
            Width = 7,
            Height = 1.8,
            CornerRadius = new CornerRadius(1),
            Background = accentBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        });

        if (increase)
        {
            icon.Children.Add(new Border
            {
                Width = 1.8,
                Height = 7,
                CornerRadius = new CornerRadius(1),
                Background = accentBrush,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
            });
        }

        return icon;
    }

    private static Control BuildToolbarChevronIcon(bool forward)
    {
        Color accentColor = Color.FromRgb(94, 244, 238);
        var icon = BuildToolbarIconSurface(accentColor);
        var accentBrush = new SolidColorBrush(accentColor);
        icon.Children.Add(new Avalonia.Controls.Shapes.Path
        {
            Width = 7,
            Height = 9,
            Stretch = Stretch.Fill,
            Stroke = accentBrush,
            StrokeThickness = 1.5,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Data = Geometry.Parse(forward
                ? "M 1,1 L 6,4.5 L 1,8"
                : "M 6,1 L 1,4.5 L 6,8"),
        });
        return icon;
    }

    private static void StyleToolbarTextBox(TextBox textBox)
    {
        textBox.Background = DeckHeaderAlt;
        textBox.BorderBrush = DeckInnerEdge;
        textBox.BorderThickness = new Thickness(1);
        textBox.Foreground = DeckText;
        textBox.CaretBrush = DeckAccent;
    }

    private static Border BuildInfoChip(string label, Control value)
    {
        if (value is TextBlock text)
        {
            text.Foreground = DeckText;
            text.FontSize = 12;
            text.FontWeight = FontWeight.SemiBold;
            text.VerticalAlignment = VerticalAlignment.Center;
        }

        return new Border
        {
            Background = DeckHeaderAlt,
            BorderBrush = DeckInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(10, 6),
            Child = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Spacing = 8,
                Children =
                {
                    new TextBlock
                    {
                        Text = label.ToUpperInvariant(),
                        Foreground = DeckMuted,
                        FontSize = 11,
                        FontWeight = FontWeight.SemiBold,
                        VerticalAlignment = VerticalAlignment.Center,
                    },
                    value,
                },
            },
        };
    }

    // ── Navigation history ─────────────────────────────────────────────────

    private void NavigateTo(int sector)
    {
        if (sector <= 0) return;
        // Truncate forward history when navigating to a new sector
        if (_historyIndex < _history.Count - 1)
            _history.RemoveRange(_historyIndex + 1, _history.Count - _historyIndex - 1);
        // Don't push duplicate consecutive entry
        if (_history.Count == 0 || _history[_historyIndex] != sector)
        {
            _history.Add(sector);
            _historyIndex = _history.Count - 1;
        }
        _centerSector = sector;
        _pan = new SKPoint(0, 0);
        Rebuild();
        UpdateTitle();
    }

    private void NavBack()
    {
        if (_historyIndex <= 0) return;
        _historyIndex--;
        _centerSector = _history[_historyIndex];
        _pan = new SKPoint(0, 0);
        Rebuild();
    }

    private void NavForward()
    {
        if (_historyIndex >= _history.Count - 1) return;
        _historyIndex++;
        _centerSector = _history[_historyIndex];
        _pan = new SKPoint(0, 0);
        Rebuild();
    }

    private void UpdateNavButtons()
    {
        _backBtn.IsEnabled = _historyIndex > 0;
        _fwdBtn.IsEnabled  = _historyIndex < _history.Count - 1;
    }

    // ── Zoom helpers ───────────────────────────────────────────────────────

    // Slider 0→100 maps logarithmically: 0 = 0.2×, 50 ≈ 0.9×, 100 = 4.0×
    private static float SliderToZoom(float v)
        => 0.2f * (float)Math.Pow(20.0, v / 100.0);

    private static float ZoomToSlider(float z)
        => (float)(Math.Log(z / 0.2) / Math.Log(20.0) * 100.0);

    // ── Rebuild layout ────────────────────────────────────────────────────

    /// <summary>
    /// Full rebuild: BFS from current center, recompute force-directed layout, redraw.
    /// Call when the center sector changes (player moved) or on explicit Refresh.
    /// </summary>
    public void Rebuild()
    {
        _positions.Clear();
        _sectorCache.Clear();
        _depthCache.Clear();

        var db = _getDb();
        if (db == null)
        {
            _canvas.InvalidateVisual();
            _tacticalMap.InvalidateVisual();
            return;
        }

        // BFS from center sector, collect sectors up to MaxDepth hops
        var visited  = new Dictionary<int, int>(); // sector → depth
        var queue    = new Queue<int>();
        if (_centerSector > 0)
        {
            visited[_centerSector] = 0;
            queue.Enqueue(_centerSector);
        }

        while (queue.Count > 0)
        {
            int sn = queue.Dequeue();
            int d  = visited[sn];
            var sd = db.GetSector(sn);
            _sectorCache[sn] = sd;
            if (d >= MaxDepth || sd == null) continue;

            foreach (var w in sd.Warp.Where(w => w > 0))
            {
                if (!visited.ContainsKey(w))
                {
                    visited[w] = d + 1;
                    queue.Enqueue(w);
                }
            }
            // Also include WarpsIn neighbors so we can draw back-arrows
            foreach (var w in sd.WarpsIn.Where(w => w > 0))
            {
                if (!visited.ContainsKey(w) && d + 1 <= MaxDepth)
                {
                    visited[w] = d + 1;
                    queue.Enqueue(w);
                }
            }
        }

        // Cache any missing sectors
        foreach (var sn in visited.Keys.Where(s => !_sectorCache.ContainsKey(s)))
            _sectorCache[sn] = db.GetSector(sn);

        _depthCache = new Dictionary<int, int>(visited);
        RefreshMajorSpaceLaneSectors(db, force: true);

        // ── Layout: BFS tree with simple force-relaxation ─────────────────
        ComputePositions(visited);

        // Debug: log all visible sectors and their DB status
        if (Core.GlobalModules.DebugMode)
        {
            Core.GlobalModules.DebugLog($"[MapWindow.Rebuild] center={_centerSector} positions={_positions.Count}\n");
            foreach (var sn in _positions.Keys.OrderBy(x => x))
            {
                var s = db.GetSector(sn);
                if (s == null)
                    Core.GlobalModules.DebugLog($"  sector {sn}: NOT IN DB\n");
                else
                    Core.GlobalModules.DebugLog($"  sector {sn}: explored={s.Explored} port={(s.SectorPort == null ? "null" : $"{s.SectorPort.Name} cls={s.SectorPort.ClassIndex}")}\n");
            }
        }

        UpdateTitle();
        UpdateNavButtons();
        _canvas.InvalidateVisual();
        _tacticalMap.InvalidateVisual();
    }

    /// <summary>
    /// Lightweight refresh: re-read sector data from the DB for all currently
    /// visible sectors, then redraw without recomputing the layout.
    /// Call when the player is still in the same sector but new data may have
    /// arrived (holo scan, sector display, etc.).
    /// </summary>
    private void RefreshData()
    {
        var db = _getDb();
        if (db == null)
        {
            _canvas.InvalidateVisual();
            _tacticalMap.InvalidateVisual();
            return;
        }
        foreach (var sn in _positions.Keys.ToList())
            _sectorCache[sn] = db.GetSector(sn);
        RefreshMajorSpaceLaneSectors(db);
        _canvas.InvalidateVisual();
        _tacticalMap.InvalidateVisual();
    }

    private int VisibleDepthForZoom()
    {
        if (_zoom >= 2.75f)
            return 1;
        if (_zoom >= 1.65f)
            return 2;
        if (_zoom >= 0.95f)
            return 3;
        return MaxDepth;
    }

    private void RefreshMajorSpaceLaneSectors(Core.ModDatabase db, bool force = false)
    {
        var header = db.DBHeader;
        var currentHeader = (header.StarDock, header.AlphaCentauri, header.Rylos);
        long changeStamp = db.ChangeStamp;
        if (!force && _majorSpaceLaneHeader == currentHeader && _majorSpaceLaneChangeStamp == changeStamp)
            return;

        _majorSpaceLaneHeader = currentHeader;
        _majorSpaceLaneChangeStamp = changeStamp;
        _majorSpaceLaneSectors = db.GetMajorSpaceLaneSectors();
    }

    // ── Position computation ──────────────────────────────────────────────

    private void ComputePositions(Dictionary<int, int> visited)
    {
        // ── Grid layout ───────────────────────────────────────────────────
        // Place each sector at an integer (col, row) grid cell.
        // The center sector occupies (0, 0).  Its warp neighbours are
        // placed in the 8 surrounding cells (cardinal + diagonal) ordered
        // by angle so the layout preserves compass orientation.  Deeper
        // sectors continue to expand outward.
        //
        // Preferred slots around a parent at (pc, pr) are the 8 neighbours
        // sorted by how well their direction matches the parent-to-grandparent
        // direction so the tree grows "away" from its parent naturally.

        var cellOf    = new Dictionary<int, (int c, int r)>();
        var usedCells = new HashSet<(int, int)>();

        cellOf[_centerSector]                 = (0, 0);
        usedCells.Add((0, 0));

        // 8 candidate offsets, ordered by angle (E, SE, S, SW, W, NW, N, NE)
        var  allOffsets = new (int dc, int dr)[]
        {
            ( 1,  0), ( 1,  1), ( 0,  1), (-1,  1),
            (-1,  0), (-1, -1), ( 0, -1), ( 1, -1),
        };

        var db     = _getDb();
        var placeQ = new Queue<int>();
        placeQ.Enqueue(_centerSector);
        var placed = new HashSet<int> { _centerSector };

        // Build BFS parent map built from warp-out edges
        var parentOf = new Dictionary<int, int>();
        {
            var bfsQ = new Queue<int>();
            var seen = new HashSet<int> { _centerSector };
            bfsQ.Enqueue(_centerSector);
            while (bfsQ.Count > 0)
            {
                int sn = bfsQ.Dequeue();
                var sd = db?.GetSector(sn);
                if (sd == null) continue;
                foreach (var w in sd.Warp.Where(w => w > 0 && visited.ContainsKey(w) && !seen.Contains(w)))
                {
                    seen.Add(w);
                    parentOf[w] = sn;
                    bfsQ.Enqueue(w);
                }
            }
        }

        while (placeQ.Count > 0)
        {
            int sn = placeQ.Dequeue();
            var sd = db?.GetSector(sn);
            if (sd == null) continue;

            (int pc, int pr) = cellOf[sn];

            // Preferred outgoing direction: away from parent (or East if root)
            int tdc = 1, tdr = 0;
            if (parentOf.TryGetValue(sn, out int par) && cellOf.TryGetValue(par, out var parCell))
            {
                tdc = pc - parCell.c;
                tdr = pr - parCell.r;
            }

            // Normalise to unit direction
            float dlen = MathF.Sqrt(tdc * tdc + tdr * tdr);
            float tdcf = dlen > 0 ? tdc / dlen : 1f;
            float tdrf = dlen > 0 ? tdr / dlen : 0f;

            // Sort candidate offsets by similarity to preferred direction
            var sorted = allOffsets
                .OrderBy(o =>
                {
                    float olen = MathF.Sqrt(o.dc * o.dc + o.dr * o.dr);
                    float dot  = olen > 0 ? (o.dc / olen * tdcf + o.dr / olen * tdrf) : 0f;
                    return -dot; // most-similar first (highest dot product)
                })
                .ToList();

            // Assign each unplaced warp neighbour the best free cell
            var neighbours = sd.Warp
                .Where(w => w > 0 && visited.ContainsKey(w) && !placed.Contains(w))
                .ToList();

            foreach (var w in neighbours)
            {
                // Find closest free cell in sorted preference order, expanding
                // ring distance if the near slots are all taken
                bool assigned = false;
                for (int ring = 1; ring <= 6 && !assigned; ring++)
                {
                    foreach (var (odc, odr) in sorted)
                    {
                        var cell = (pc + odc * ring, pr + odr * ring);
                        if (!usedCells.Contains(cell))
                        {
                            cellOf[w] = cell;
                            usedCells.Add(cell);
                            placed.Add(w);
                            placeQ.Enqueue(w);
                            assigned = true;
                            break;
                        }
                    }
                }
            }
        }

        // ── Convert grid cells to pixel positions ─────────────────────────
        var result = new Dictionary<int, SKPoint>();
        foreach (var (sn, (c, r)) in cellOf)
            result[sn] = new SKPoint(c * GridX, r * GridY);

        _positions = result;
    }

    private static float Dist(SKPoint a, SKPoint b)
    {
        float dx = a.X - b.X, dy = a.Y - b.Y;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }

    private static float AngleBetween(SKPoint from, SKPoint to)
        => (float)Math.Atan2(to.Y - from.Y, to.X - from.X);

    /// <summary>Point on the sector box edge in the direction from
    /// <paramref name="center"/> toward <paramref name="toward"/>.</summary>
    private static SKPoint BoxEdgePoint(SKPoint center, SKPoint toward)
    {
        float dx = toward.X - center.X;
        float dy = toward.Y - center.Y;
        float adx = Math.Abs(dx), ady = Math.Abs(dy);
        if (adx < 0.001f && ady < 0.001f) return center;
        float tx = adx > 0.001f ? (BoxW / 2f) / adx : float.MaxValue;
        float ty = ady > 0.001f ? (BoxH / 2f) / ady : float.MaxValue;
        float t  = Math.Min(tx, ty);
        return new SKPoint(center.X + dx * t, center.Y + dy * t);
    }

    // ── Rendering (called from MapCanvas) ────────────────────────────────

    internal void Draw(SKCanvas sk, float canvasW, float canvasH)
    {
        // Draw background rect (not sk.Clear which bypasses the clip layer and
        // would overdraw toolbar/legend rendered by Avalonia above this control).
        using var bgPaint = new SKPaint { Color = ColBg, Style = SKPaintStyle.Fill };
        sk.DrawRect(0, 0, canvasW, canvasH, bgPaint);
        bgPaint.Dispose();

        // Clip to canvas bounds so nothing bleeds into toolbar/legend regions.
        sk.ClipRect(new SKRect(0, 0, canvasW, canvasH));

        // Transform: canvas center + pan + zoom
        float cx = canvasW / 2 + _pan.X;
        float cy = canvasH / 2 + _pan.Y;
        sk.Save();
        sk.Translate(cx, cy);
        sk.Scale(_zoom);

        // Stars
        using var starPaint = new SKPaint { IsAntialias = false };
        foreach (var star in _stars)
        {
            starPaint.Color = ColStarBg.WithAlpha(star.A);
            sk.DrawCircle(star.X, star.Y, 1.0f, starPaint);
        }

        if (_positions.Count == 0) { sk.Restore(); return; }

        // ── Draw warp lines first (under boxes) ───────────────────────────
        using var linePaintTwo = new SKPaint
        {
            IsAntialias = true, StrokeWidth = 2f,
            Color = ColLineTwo, Style = SKPaintStyle.Stroke,
        };
        using var linePaintOne = new SKPaint
        {
            IsAntialias = true, StrokeWidth = 1.5f,
            Color = ColLineOne, Style = SKPaintStyle.Stroke,
            PathEffect = SKPathEffect.CreateDash(DashIntervals, 0),
        };

        int visibleDepth = VisibleDepthForZoom();
        var drawnEdges = new HashSet<(int, int)>();
        foreach (var (sn, pos) in _positions)
        {
            if (!_depthCache.TryGetValue(sn, out int depth) || depth > visibleDepth)
                continue;

            if (!_sectorCache.TryGetValue(sn, out var sd) || sd == null) continue;
            foreach (var w in sd.Warp.Where(w => w > 0 && _positions.ContainsKey(w)))
            {
                if (!_depthCache.TryGetValue(w, out int warpDepth) || warpDepth > visibleDepth)
                    continue;

                // Check two-way: target also has a warp back to us
                _sectorCache.TryGetValue(w, out var target);
                bool twoWay = target != null && target.Warp.Contains(sn);

                // Only draw each edge once
                int a = Math.Min(sn, w), b = Math.Max(sn, w);
                if (twoWay && drawnEdges.Contains((a, b))) continue;
                drawnEdges.Add((a, b));

                // Route lines from box edge to box edge for cleaner visuals
                SKPoint pA = BoxEdgePoint(pos,          _positions[w]);
                SKPoint pB = BoxEdgePoint(_positions[w], pos);

                if (twoWay)
                    sk.DrawLine(pA.X, pA.Y, pB.X, pB.Y, linePaintTwo);
                else
                    DrawArrow(sk, pA, pB, linePaintOne);
            }
        }

        // ── Draw sector boxes ──────────────────────────────────────────────
        using var boxPaint   = new SKPaint { IsAntialias = false, Style = SKPaintStyle.Fill };
        using var borderPaint= new SKPaint { IsAntialias = true,  Style = SKPaintStyle.Stroke, StrokeWidth = 1.5f };
        using var textPaint  = new SKPaint { IsAntialias = true, TextSize = 11f, Typeface = SKTypeface.Default };
        using var smallPaint = new SKPaint { IsAntialias = true, TextSize = 9f,  Typeface = SKTypeface.Default };

        int currentSect = _getCurrentSector();

        foreach (var (sn, pos) in _positions)
        {
            if (!_depthCache.TryGetValue(sn, out int depth) || depth > visibleDepth)
                continue;

            _sectorCache.TryGetValue(sn, out var sd);
            bool isCurrent = sn == currentSect;
            bool isMajorLane = _majorSpaceLaneSectors.Contains(sn);

            SKColor fillColor = isCurrent ? ColBoxCurrent :
                isMajorLane                          ? ColBoxMajorLane :
                sd?.Explored == Core.ExploreType.Yes     ? ColBoxExp :
                sd?.Explored == Core.ExploreType.Density ? ColBoxDensity :
                ColBoxUnknown;

            float x = pos.X - BoxW / 2;
            float y = pos.Y - BoxH / 2;
            var   r = new SKRect(x, y, x + BoxW, y + BoxH);

            boxPaint.Color = fillColor;
            sk.DrawRect(r, boxPaint);

            borderPaint.Color = isCurrent
                ? new SKColor(0x00, 0x99, 0x33)
                : isMajorLane
                    ? new SKColor(0x00, 0x55, 0xbb)
                : sd?.Explored == Core.ExploreType.Yes
                    ? new SKColor(0x00, 0x99, 0x99)
                    : new SKColor(0x44, 0x44, 0x55);
            borderPaint.PathEffect = null;
            sk.DrawRect(r, borderPaint);

            // Sector number
            bool darkBg = fillColor == ColBoxUnknown;
            textPaint.Color = darkBg ? ColBoxTextUnk : ColBoxText;
            string numStr = sn.ToString();
            float tw = textPaint.MeasureText(numStr);
            sk.DrawText(numStr, pos.X - tw / 2, y + 13f, textPaint);

            // Port/content icons — show port label whenever we have port data (regardless
            // of ExploreType), and show general sector info for any explored sector.
            if (sd != null && (sd.SectorPort != null || sd.Explored > Core.ExploreType.No))
            {
                // Use dark (black) text when background is light: explored teal or current green
                bool darkText = isCurrent || isMajorLane || sd.Explored == Core.ExploreType.Yes;
                DrawSectorIcons(sk, sd, pos, y + 24f, smallPaint, darkText);
            }
            else if (sd != null)
            {
                // Sector IS in DB but has no port and no exploration data → gray "?"
                smallPaint.Color = new SKColor(0x88, 0x88, 0x88);
                sk.DrawText("?", pos.X - 4f, y + 28f, smallPaint);
            }
            else
            {
                // Sector NOT in DB at all → red "?" so we can distinguish
                smallPaint.Color = new SKColor(0xff, 0x44, 0x44);
                sk.DrawText("?", pos.X - 4f, y + 28f, smallPaint);
            }
        }

        sk.Restore();
    }

    private static void DrawSectorIcons(SKCanvas sk, Core.SectorData sd, SKPoint pos, float y, SKPaint smallPaint, bool darkText)
    {
        string label;
        SKColor labelColor;

        if (sd.SectorPort != null && !sd.SectorPort.Dead)
        {
            // Build SBB/BSS/etc. label: Fuel/Organics/Equipment order, B=port buys, S=port sells
            char f = sd.SectorPort.BuyProduct.TryGetValue(Core.ProductType.FuelOre,   out bool bf) && bf ? 'B' : 'S';
            char o = sd.SectorPort.BuyProduct.TryGetValue(Core.ProductType.Organics,  out bool bo) && bo ? 'B' : 'S';
            char e = sd.SectorPort.BuyProduct.TryGetValue(Core.ProductType.Equipment, out bool be) && be ? 'B' : 'S';
            label = new string(new[] { f, o, e });
            if (sd.NavHaz > 0)
                label += $" {sd.NavHaz}%";
            labelColor = darkText ? SKColors.Black : new SKColor(0x00, 0xee, 0x44);
        }
        else if (sd.NavHaz > 0)
        {
            label      = $"{sd.NavHaz}%";
            labelColor = darkText ? SKColors.Black : new SKColor(0xff, 0x99, 0x00);
        }
        else
        {
            label      = "—";
            labelColor = darkText ? new SKColor(0x33, 0x33, 0x33) : new SKColor(0x77, 0x77, 0x77);
        }

        smallPaint.Color = labelColor;
        float tw = smallPaint.MeasureText(label);
        sk.DrawText(label, pos.X - tw / 2, y, smallPaint);
    }

    private static void DrawArrow(SKCanvas sk, SKPoint from, SKPoint to, SKPaint paint)
    {
        sk.DrawLine(from.X, from.Y, to.X, to.Y, paint);

        // Small arrowhead at target end
        float angle = AngleBetween(from, to);
        float ax     = to.X - (float)Math.Cos(angle) * 9f;
        float ay     = to.Y - (float)Math.Sin(angle) * 9f;
        float wing   = 0.4f;
        float wx1    = ax + (float)Math.Cos(angle - Math.PI / 2 + wing) * 5f;
        float wy1    = ay + (float)Math.Sin(angle - Math.PI / 2 + wing) * 5f;
        float wx2    = ax + (float)Math.Cos(angle + Math.PI / 2 - wing) * 5f;
        float wy2    = ay + (float)Math.Sin(angle + Math.PI / 2 - wing) * 5f;

        using var arrowPaint = paint.Clone();
        arrowPaint.PathEffect = null;
        arrowPaint.Style = SKPaintStyle.Stroke;
        sk.DrawLine(to.X, to.Y, wx1, wy1, arrowPaint);
        sk.DrawLine(to.X, to.Y, wx2, wy2, arrowPaint);
    }

    // ── Input handlers ────────────────────────────────────────────────────

    private void OnWheel(object? sender, PointerWheelEventArgs e)
    {
        float factor = e.Delta.Y > 0 ? 1.15f : 1f / 1.15f;
        _zoom = Math.Clamp(_zoom * factor, 0.15f, 6f);
        _canvas.InvalidateVisual();
    }

    private void OnPointerPressed(object? sender, PointerPressedEventArgs e)
    {
        if (e.GetCurrentPoint(_canvas).Properties.IsLeftButtonPressed)
        {
            _dragging  = true;
            _dragMoved = false;
            _dragStart = e.GetPosition(_canvas);
            _panStart  = _pan;
        }
    }

    private void OnPointerMoved(object? sender, PointerEventArgs e)
    {
        if (!_dragging) return;
        var pos  = e.GetPosition(_canvas);
        var diff = pos - _dragStart;
        if (!_dragMoved && (Math.Abs(diff.X) > 3 || Math.Abs(diff.Y) > 3))
            _dragMoved = true;
        _pan = new SKPoint(_panStart.X + (float)diff.X, _panStart.Y + (float)diff.Y);
        _canvas.InvalidateVisual();
    }

    private void OnPointerReleased(object? sender, PointerReleasedEventArgs e)
    {
        bool shouldSelect = _dragging && !_dragMoved;
        _dragging = false;
        if (!shouldSelect)
            return;

        TryFocusSectorAt(e.GetPosition(_canvas));
    }

    private void OnDoubleTapped(object? sender, TappedEventArgs e)
    {
        TryFocusSectorAt(e.GetPosition(_canvas));
    }

    private void OnSectorBoxKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Return || e.Key == Key.Enter)
            GoToSector();
    }

    private void GoToSector()
    {
        if (int.TryParse(_sectorBox.Text?.Trim(), out int sn) && sn > 0)
        {
            _sectorBox.Text = string.Empty;
            _followCurrentSector = false;
            NavigateTo(sn);
        }
    }

    private void TryFocusSectorAt(Point tapPos)
    {
        float cx = (float)(_canvas.Bounds.Width  / 2) + _pan.X;
        float cy = (float)(_canvas.Bounds.Height / 2) + _pan.Y;

        float wx = ((float)tapPos.X - cx) / _zoom;
        float wy = ((float)tapPos.Y - cy) / _zoom;

        int closest = 0;
        float minD  = float.MaxValue;
        foreach (var (sn, pos) in _positions)
        {
            float d = Dist(pos, new SKPoint(wx, wy));
            if (d < minD) { minD = d; closest = sn; }
        }

        if (closest > 0 && minD < BoxW)
        {
            _followCurrentSector = false;
            NavigateTo(closest);
        }
    }

    // ── MapCanvas inner class ─────────────────────────────────────────────

    /// <summary>
    /// Custom Avalonia control that delegates SkiaSharp drawing to MapWindow.
    /// Uses the ICustomDrawOperation pattern to access the raw SKCanvas.
    /// </summary>
    private class MapCanvas : Control
    {
        private readonly MapWindow _owner;
        public MapCanvas(MapWindow owner) => _owner = owner;

        public override void Render(DrawingContext context)
        {
            var bounds = new Rect(0, 0, Bounds.Width, Bounds.Height);
            context.Custom(new MapDrawOp(bounds, _owner));
        }

        private class MapDrawOp : ICustomDrawOperation
        {
            private readonly Rect      _bounds;
            private readonly MapWindow _owner;
            public MapDrawOp(Rect bounds, MapWindow owner) { _bounds = bounds; _owner = owner; }
            public Rect Bounds => _bounds;
            public bool HitTest(Point p) => _bounds.Contains(p);
            public bool Equals(ICustomDrawOperation? other) => false;
            public void Dispose() { }

            public void Render(ImmediateDrawingContext ctx)
            {
                var feature = ctx.TryGetFeature(typeof(ISkiaSharpApiLeaseFeature)) as ISkiaSharpApiLeaseFeature;
                if (feature == null) return;
                using var lease = feature.Lease();
                _owner.Draw(lease.SkCanvas, (float)_bounds.Width, (float)_bounds.Height);
            }
        }
    }
}
