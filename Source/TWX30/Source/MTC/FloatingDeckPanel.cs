using System;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

/// <summary>
/// Floating in-console window used by the command-deck skin.
/// Supports dragging, resizing, minimizing, and optional closing.
/// </summary>
public sealed class FloatingDeckPanel : Border
{
    [Flags]
    private enum ResizeEdge
    {
        None = 0,
        Left = 1,
        Top = 2,
        Right = 4,
        Bottom = 8,
    }

    private const double ResizeHandleThickness = 8;
    private const double HeaderChromeHeight = 56;
    private const double MinimizedPanelHeight = 52;
    private static readonly IBrush ResizeCueBrush = new SolidColorBrush(Color.FromArgb(58, 0, 212, 201));
    private static readonly IBrush ResizeCornerCueBrush = new SolidColorBrush(Color.FromArgb(72, 255, 193, 74));
    private readonly Border _bodyHost;
    private readonly Button _minButton;
    private readonly Button? _closeButton;
    private readonly TextBlock _titleText;
    private double _bodyHeight;
    private double _minBodyHeight;
    private double _minPanelWidth;
    private bool _isDragging;
    private bool _isResizing;
    private bool _isClosed;
    private bool _isMinimized;
    private Point _dragStartPointer;
    private double _dragStartLeft;
    private double _dragStartTop;
    private ResizeEdge _resizeEdge;
    private Point _resizeStartPointer;
    private double _resizeStartLeft;
    private double _resizeStartTop;
    private double _resizeStartWidth;
    private double _resizeStartBodyHeight;

    public string PanelId { get; }
    public bool CanClose { get; }
    public bool IsMinimized => _isMinimized;
    public bool IsClosed => _isClosed;
    public bool IsActive { get; private set; }
    public double PanelWidth => Width;
    public double PanelHeight => GetCurrentPanelHeight();
    public double BodyHeight => _bodyHeight;
    public Func<FloatingDeckPanel, double, double, (double Left, double Top)>? DragSnapHandler { get; set; }

    public event Action<FloatingDeckPanel>? Activated;
    public event Action<FloatingDeckPanel>? StateChanged;

    public FloatingDeckPanel(
        string panelId,
        string title,
        string tag,
        Control body,
        double width,
        double bodyHeight,
        bool canClose,
        IBrush frameBrush,
        IBrush frameAltBrush,
        IBrush headerBrush,
        IBrush headerAltBrush,
        IBrush edgeBrush,
        IBrush innerEdgeBrush,
        IBrush titleBrush,
        IBrush mutedBrush,
        FontFamily titleFont)
    {
        PanelId = panelId;
        CanClose = canClose;
        _bodyHeight = bodyHeight;
        _minPanelWidth = Math.Min(width, Math.Max(220, width * 0.55));
        _minBodyHeight = Math.Min(bodyHeight, Math.Max(120, bodyHeight * 0.5));

        Width = width;
        MinWidth = _minPanelWidth;
        Background = frameBrush;
        BorderBrush = edgeBrush;
        BorderThickness = new Thickness(1.4);
        CornerRadius = new CornerRadius(18);
        Padding = new Thickness(2);

        _bodyHost = new Border
        {
            Padding = new Thickness(14),
            Height = bodyHeight,
            MinHeight = _minBodyHeight,
            ClipToBounds = true,
            Child = body,
        };

        _titleText = new TextBlock
        {
            Text = title,
            FontFamily = titleFont,
            FontSize = 16,
            FontWeight = FontWeight.Bold,
            Foreground = titleBrush,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var tagBadge = new Border
        {
            Background = headerAltBrush,
            BorderBrush = innerEdgeBrush,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(8, 3),
            Margin = new Thickness(0, 0, 8, 0),
            Child = new TextBlock
            {
                Text = tag,
                Foreground = mutedBrush,
                FontSize = 10,
                FontWeight = FontWeight.SemiBold,
                VerticalAlignment = VerticalAlignment.Center,
            },
        };

        _minButton = BuildHeaderButton("—", mutedBrush);
        _minButton.Click += (_, _) =>
        {
            SetMinimized(!_isMinimized);
            Activated?.Invoke(this);
        };

        if (canClose)
        {
            _closeButton = BuildHeaderButton("✕", mutedBrush);
            _closeButton.Click += (_, _) =>
            {
                SetClosed(true);
                Activated?.Invoke(this);
            };
        }

        var headerRight = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 6,
            Children = { tagBadge, _minButton },
        };
        if (_closeButton != null)
            headerRight.Children.Add(_closeButton);

        var titleBar = new Border
        {
            Background = headerBrush,
            CornerRadius = new CornerRadius(14, 14, 0, 0),
            Padding = new Thickness(14, 10),
            Cursor = new Cursor(StandardCursorType.DragMove),
            Child = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                    new ColumnDefinition { Width = GridLength.Auto },
                },
                Children =
                {
                    _titleText,
                    headerRight,
                },
            },
        };
        Grid.SetColumn(headerRight, 1);

        titleBar.PointerPressed += OnTitleBarPointerPressed;
        titleBar.PointerMoved += OnTitleBarPointerMoved;
        titleBar.PointerReleased += OnTitleBarPointerReleased;
        titleBar.DoubleTapped += (_, _) =>
        {
            SetMinimized(!_isMinimized);
            Activated?.Invoke(this);
        };
        PointerPressed += (_, _) => Activated?.Invoke(this);

        var contentGrid = new Grid();
        contentGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        contentGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        contentGrid.Children.Add(titleBar);
        Grid.SetRow(_bodyHost, 1);
        contentGrid.Children.Add(_bodyHost);

        var panelChrome = new Border
        {
            Background = frameAltBrush,
            BorderBrush = innerEdgeBrush,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(16),
            Child = contentGrid,
        };

        var resizeGrid = new Grid();
        resizeGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(ResizeHandleThickness) });
        resizeGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        resizeGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(ResizeHandleThickness) });
        resizeGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(ResizeHandleThickness) });
        resizeGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        resizeGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(ResizeHandleThickness) });

        Grid.SetRow(panelChrome, 1);
        Grid.SetColumn(panelChrome, 1);
        resizeGrid.Children.Add(panelChrome);

        AddResizeHandle(resizeGrid, ResizeEdge.Top, 0, 1);
        AddResizeHandle(resizeGrid, ResizeEdge.Bottom, 2, 1);
        AddResizeHandle(resizeGrid, ResizeEdge.Left, 1, 0);
        AddResizeHandle(resizeGrid, ResizeEdge.Right, 1, 2);
        AddResizeHandle(resizeGrid, ResizeEdge.Top | ResizeEdge.Left, 0, 0);
        AddResizeHandle(resizeGrid, ResizeEdge.Top | ResizeEdge.Right, 0, 2);
        AddResizeHandle(resizeGrid, ResizeEdge.Bottom | ResizeEdge.Left, 2, 0);
        AddResizeHandle(resizeGrid, ResizeEdge.Bottom | ResizeEdge.Right, 2, 2);

        Child = resizeGrid;
    }

    public void SetTitle(string title)
        => _titleText.Text = string.IsNullOrWhiteSpace(title) ? "GAME" : title.Trim();

    public void SetActive(bool active)
    {
        IsActive = active;
        BorderThickness = active ? new Thickness(2.6) : new Thickness(1.4);
        _titleText.FontWeight = active ? FontWeight.ExtraBold : FontWeight.Bold;
    }

    public void MoveTo(double left, double top, bool clampToHost = true)
    {
        if (clampToHost && Parent is Control host)
        {
            double panelWidth = GetCurrentPanelWidth();
            double panelHeight = GetCurrentPanelHeight();
            double maxLeft = Math.Max(0, host.Bounds.Width - panelWidth);
            double maxTop = Math.Max(0, host.Bounds.Height - panelHeight);
            left = Math.Clamp(left, 0, maxLeft);
            top = Math.Clamp(top, 0, maxTop);
        }

        Canvas.SetLeft(this, left);
        Canvas.SetTop(this, top);
        StateChanged?.Invoke(this);
    }

    public void SetPanelSize(double width, double bodyHeight)
    {
        Width = Math.Max(_minPanelWidth, width);
        _bodyHeight = Math.Max(_minBodyHeight, bodyHeight);
        if (!_isMinimized)
            _bodyHost.Height = _bodyHeight;
        StateChanged?.Invoke(this);
    }

    public void SetMinimumPanelSize(double width, double bodyHeight)
    {
        _minPanelWidth = Math.Max(220, width);
        _minBodyHeight = Math.Max(120, bodyHeight);
        MinWidth = _minPanelWidth;
        _bodyHost.MinHeight = _minBodyHeight;
        SetPanelSize(Math.Max(PanelWidth, _minPanelWidth), Math.Max(_bodyHeight, _minBodyHeight));
    }

    public void SetMinimized(bool minimized)
    {
        _isMinimized = minimized;
        _bodyHost.IsVisible = !minimized;
        _bodyHost.Height = minimized ? 0 : _bodyHeight;
        _bodyHost.Margin = minimized ? new Thickness(0) : new Thickness(0);
        _minButton.Content = minimized ? "▢" : "—";
        StateChanged?.Invoke(this);
    }

    public void SetClosed(bool closed)
    {
        if (closed && !CanClose)
            return;

        _isClosed = closed;
        IsVisible = !closed;
        StateChanged?.Invoke(this);
    }

    public void Restore(double left, double top)
    {
        if (_isClosed)
            _isClosed = false;

        IsVisible = true;
        if (_isMinimized)
            SetMinimized(false);

        MoveTo(left, top);
        Activated?.Invoke(this);
    }

    public (double Left, double Top) GetPosition()
    {
        double left = Canvas.GetLeft(this);
        double top = Canvas.GetTop(this);
        return (double.IsNaN(left) ? 0 : left, double.IsNaN(top) ? 0 : top);
    }

    private static Button BuildHeaderButton(string label, IBrush foreground)
    {
        return new Button
        {
            Content = label,
            Width = 22,
            Height = 22,
            Padding = new Thickness(0),
            Background = Brushes.Transparent,
            BorderBrush = Brushes.Transparent,
            Foreground = foreground,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Cursor = new Cursor(StandardCursorType.Hand),
        };
    }

    private void AddResizeHandle(Grid host, ResizeEdge edge, int row, int column)
    {
        var handle = new Border
        {
            Background = Brushes.Transparent,
            Cursor = new Cursor(GetCursorType(edge)),
        };
        handle.PointerPressed += (sender, e) => OnResizePointerPressed(sender, e, edge);
        handle.PointerMoved += OnResizePointerMoved;
        handle.PointerReleased += OnResizePointerReleased;
        handle.PointerEntered += (_, _) => handle.Background = IsCorner(edge) ? ResizeCornerCueBrush : ResizeCueBrush;
        handle.PointerExited += (_, _) =>
        {
            if (!_isResizing || _resizeEdge != edge)
                handle.Background = Brushes.Transparent;
        };
        Grid.SetRow(handle, row);
        Grid.SetColumn(handle, column);
        host.Children.Add(handle);
    }

    private static bool IsCorner(ResizeEdge edge)
        => edge == (ResizeEdge.Top | ResizeEdge.Left)
            || edge == (ResizeEdge.Top | ResizeEdge.Right)
            || edge == (ResizeEdge.Bottom | ResizeEdge.Left)
            || edge == (ResizeEdge.Bottom | ResizeEdge.Right);

    private static StandardCursorType GetCursorType(ResizeEdge edge)
    {
        return edge switch
        {
            ResizeEdge.Left or ResizeEdge.Right => StandardCursorType.SizeWestEast,
            ResizeEdge.Top or ResizeEdge.Bottom => StandardCursorType.SizeNorthSouth,
            ResizeEdge.Top | ResizeEdge.Left => StandardCursorType.TopLeftCorner,
            ResizeEdge.Top | ResizeEdge.Right => StandardCursorType.TopRightCorner,
            ResizeEdge.Bottom | ResizeEdge.Left => StandardCursorType.BottomLeftCorner,
            ResizeEdge.Bottom | ResizeEdge.Right => StandardCursorType.BottomRightCorner,
            _ => StandardCursorType.Arrow,
        };
    }

    private void OnTitleBarPointerPressed(object? sender, PointerPressedEventArgs e)
    {
        if (_isResizing || e.Source is Button || !e.GetCurrentPoint(this).Properties.IsLeftButtonPressed || Parent is not Control host)
            return;

        Activated?.Invoke(this);
        _isDragging = true;
        _dragStartPointer = e.GetPosition(host);
        (_dragStartLeft, _dragStartTop) = GetPosition();
        e.Pointer.Capture((IInputElement?)sender);
        e.Handled = true;
    }

    private void OnTitleBarPointerMoved(object? sender, PointerEventArgs e)
    {
        if (_isResizing || !_isDragging || Parent is not Control host)
            return;

        Point current = e.GetPosition(host);
        double left = _dragStartLeft + (current.X - _dragStartPointer.X);
        double top = _dragStartTop + (current.Y - _dragStartPointer.Y);
        if (DragSnapHandler != null)
            (left, top) = DragSnapHandler(this, left, top);

        MoveTo(left, top);
        e.Handled = true;
    }

    private void OnTitleBarPointerReleased(object? sender, PointerReleasedEventArgs e)
    {
        if (!_isDragging)
            return;

        _isDragging = false;
        e.Pointer.Capture(null);
        StateChanged?.Invoke(this);
        e.Handled = true;
    }

    private void OnResizePointerPressed(object? sender, PointerPressedEventArgs e, ResizeEdge edge)
    {
        if (_isMinimized || _isDragging || !e.GetCurrentPoint(this).Properties.IsLeftButtonPressed || Parent is not Control host)
            return;

        Activated?.Invoke(this);
        _isResizing = true;
        _resizeEdge = edge;
        _resizeStartPointer = e.GetPosition(host);
        (_resizeStartLeft, _resizeStartTop) = GetPosition();
        _resizeStartWidth = GetCurrentPanelWidth();
        _resizeStartBodyHeight = _bodyHeight;
        e.Pointer.Capture((IInputElement?)sender);
        e.Handled = true;
    }

    private void OnResizePointerMoved(object? sender, PointerEventArgs e)
    {
        if (!_isResizing || Parent is not Control host)
            return;

        Point current = e.GetPosition(host);
        double deltaX = current.X - _resizeStartPointer.X;
        double deltaY = current.Y - _resizeStartPointer.Y;

        double newLeft = _resizeStartLeft;
        double newTop = _resizeStartTop;
        double newWidth = _resizeStartWidth;
        double newBodyHeight = _resizeStartBodyHeight;

        if ((_resizeEdge & ResizeEdge.Right) != 0)
            newWidth = _resizeStartWidth + deltaX;
        if ((_resizeEdge & ResizeEdge.Left) != 0)
        {
            newWidth = _resizeStartWidth - deltaX;
            newLeft = _resizeStartLeft + deltaX;
        }
        if ((_resizeEdge & ResizeEdge.Bottom) != 0)
            newBodyHeight = _resizeStartBodyHeight + deltaY;
        if ((_resizeEdge & ResizeEdge.Top) != 0)
        {
            newBodyHeight = _resizeStartBodyHeight - deltaY;
            newTop = _resizeStartTop + deltaY;
        }

        if ((_resizeEdge & ResizeEdge.Left) != 0 && newWidth < _minPanelWidth)
            newLeft = _resizeStartLeft + (_resizeStartWidth - _minPanelWidth);
        if ((_resizeEdge & ResizeEdge.Top) != 0 && newBodyHeight < _minBodyHeight)
            newTop = _resizeStartTop + (_resizeStartBodyHeight - _minBodyHeight);

        newWidth = Math.Max(_minPanelWidth, newWidth);
        newBodyHeight = Math.Max(_minBodyHeight, newBodyHeight);

        if (newLeft < 0)
        {
            newWidth += newLeft;
            newLeft = 0;
        }
        if (newTop < 0)
        {
            newBodyHeight += newTop;
            newTop = 0;
        }

        newWidth = Math.Max(_minPanelWidth, newWidth);
        newBodyHeight = Math.Max(_minBodyHeight, newBodyHeight);

        double maxWidth = Math.Max(_minPanelWidth, host.Bounds.Width - newLeft);
        double maxBodyHeight = Math.Max(_minBodyHeight, host.Bounds.Height - newTop - HeaderChromeHeight);
        newWidth = Math.Min(newWidth, maxWidth);
        newBodyHeight = Math.Min(newBodyHeight, maxBodyHeight);

        Width = newWidth;
        _bodyHeight = newBodyHeight;
        _bodyHost.Height = newBodyHeight;
        MoveTo(newLeft, newTop);
        e.Handled = true;
    }

    private void OnResizePointerReleased(object? sender, PointerReleasedEventArgs e)
    {
        if (!_isResizing)
            return;

        _isResizing = false;
        _resizeEdge = ResizeEdge.None;
        e.Pointer.Capture(null);
        StateChanged?.Invoke(this);
        e.Handled = true;
    }

    private double GetCurrentPanelWidth()
        => Bounds.Width > 1 ? Bounds.Width : Width;

    private double GetCurrentPanelHeight()
        => _isMinimized ? MinimizedPanelHeight : _bodyHeight + HeaderChromeHeight;
}
