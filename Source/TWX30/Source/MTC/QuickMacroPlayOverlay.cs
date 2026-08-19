using System;
using System.Globalization;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Input.Platform;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

public sealed class QuickMacroPlayOverlay : Border
{
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(8, 45, 56));
    private static readonly IBrush BgPanelSoft = new SolidColorBrush(Color.FromRgb(4, 22, 28));
    private static readonly IBrush BdInput = new SolidColorBrush(Color.FromRgb(9, 126, 149));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(230, 243, 246));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(150, 198, 209));
    private static readonly IBrush AccentBorder = new SolidColorBrush(Color.FromRgb(18, 214, 214));
    private static readonly IBrush AccentOk = new SolidColorBrush(Color.FromRgb(118, 255, 141));
    private static readonly IBrush AccentInk = new SolidColorBrush(Color.FromRgb(8, 26, 30));
    private static readonly IBrush ButtonBg = new SolidColorBrush(Color.FromRgb(10, 93, 109));

    private readonly TextBox _macroTextBox;
    private readonly TextBox _countTextBox;
    private readonly Button _playButton;
    private readonly Button _closeButton;
    private readonly Func<string, int, Task<string?>> _playAsync;
    private readonly Action _refocusRequested;
    private Point _dragStartPoint;
    private double _dragStartLeft;
    private double _dragStartTop;
    private bool _dragging;
    private bool _macroEditing;
    private bool _countEditing;
    private bool _playing;

    public QuickMacroPlayOverlay(
        string macro,
        double width,
        double height,
        double fontSize,
        Func<string, int, Task<string?>> playAsync,
        Action closeRequested,
        Action refocusRequested)
    {
        ArgumentNullException.ThrowIfNull(playAsync);
        ArgumentNullException.ThrowIfNull(closeRequested);
        ArgumentNullException.ThrowIfNull(refocusRequested);
        _playAsync = playAsync;
        _refocusRequested = refocusRequested;

        Width = width;
        Height = height;
        MinWidth = width;
        MinHeight = height;
        MaxWidth = width;
        MaxHeight = height;
        Background = BgPanel;
        BorderBrush = AccentBorder;
        BorderThickness = new Thickness(1.4);
        CornerRadius = new CornerRadius(12);
        Padding = new Thickness(8);
        ClipToBounds = true;

        _macroTextBox = new TextBox
        {
            Text = macro,
            Watermark = "quick macro",
            Foreground = FgNormal,
            TextWrapping = TextWrapping.Wrap,
            AcceptsReturn = false,
            FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace"),
            FontSize = fontSize,
            Height = Math.Max(26, height - 24),
            MinHeight = Math.Max(26, height - 24),
            MaxHeight = Math.Max(26, height - 24),
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Padding = new Thickness(8, 1, 6, 1),
            HorizontalContentAlignment = HorizontalAlignment.Left,
            VerticalContentAlignment = VerticalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _macroTextBox.GotFocus += (_, _) => _macroEditing = true;
        _macroTextBox.LostFocus += (_, _) => _macroEditing = false;
        _macroTextBox.KeyDown += (_, e) =>
        {
            if (e.Key == Key.Enter)
            {
                e.Handled = true;
                _ = PlayAsync();
            }
            else if (e.Key == Key.Escape)
            {
                e.Handled = true;
                _macroEditing = false;
                refocusRequested();
            }
        };
        WireTextBoxClipboard(_macroTextBox);

        var macroBox = new Border
        {
            Background = BgPanelSoft,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(7),
            Padding = new Thickness(2, 3),
            Child = _macroTextBox,
        };

        _countTextBox = new TextBox
        {
            Text = "1",
            Width = 48,
            Height = Math.Max(30, height - 18),
            Background = BgPanelSoft,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
            FontSize = fontSize,
            Padding = new Thickness(4, 2),
        };
        ToolTip.SetTip(_countTextBox, "Times to play");
        _countTextBox.GotFocus += (_, _) => _countEditing = true;
        _countTextBox.LostFocus += (_, _) =>
        {
            _countEditing = false;
            NormalizePlayCountText();
        };
        _countTextBox.KeyDown += (_, e) =>
        {
            if (e.Key == Key.Enter)
            {
                e.Handled = true;
                _ = PlayAsync();
            }
            else if (e.Key == Key.Escape)
            {
                e.Handled = true;
                NormalizePlayCountText();
                _countEditing = false;
                refocusRequested();
            }
        };
        WireTextBoxClipboard(_countTextBox);

        _playButton = CreateIconButton(AccentOk, "Play macro");
        _playButton.Content = BuildPlayIcon(AccentInk);
        _playButton.Click += async (_, _) => await PlayAsync().ConfigureAwait(true);

        _closeButton = CreateIconButton(ButtonBg, "Close");
        _closeButton.Content = new TextBlock
        {
            Text = "X",
            Foreground = FgNormal,
            FontWeight = FontWeight.Bold,
            FontSize = fontSize,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _closeButton.Click += (_, _) =>
        {
            closeRequested();
            refocusRequested();
        };

        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,8,Auto,6,Auto,6,Auto"),
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(macroBox, 0);
        Grid.SetColumn(_countTextBox, 2);
        Grid.SetColumn(_playButton, 4);
        Grid.SetColumn(_closeButton, 6);
        grid.Children.Add(macroBox);
        grid.Children.Add(_countTextBox);
        grid.Children.Add(_playButton);
        grid.Children.Add(_closeButton);
        Child = grid;

        PointerPressed += BeginDrag;
        PointerMoved += ContinueDrag;
        PointerReleased += EndDrag;
        PointerCaptureLost += EndDragCaptureLost;
        PointerExited += (_, _) =>
        {
            if (!_macroEditing && !_countEditing)
                refocusRequested();
        };
    }

    public int PlayCount => ParsePlayCount();
    public string MacroText => _macroTextBox.Text ?? string.Empty;

    public void SetMacroText(string macro)
    {
        if (_macroEditing)
            return;

        _macroTextBox.Text = macro;
    }

    private static void WireTextBoxClipboard(TextBox textBox)
    {
        textBox.KeyDown += async (_, e) =>
        {
            bool primaryModifier = e.KeyModifiers.HasFlag(KeyModifiers.Control) ||
                                   e.KeyModifiers.HasFlag(KeyModifiers.Meta);
            if (!primaryModifier)
                return;

            switch (e.Key)
            {
                case Key.A:
                {
                    string current = textBox.Text ?? string.Empty;
                    textBox.SelectionStart = 0;
                    textBox.SelectionEnd = current.Length;
                    textBox.CaretIndex = current.Length;
                    e.Handled = true;
                    break;
                }

                case Key.C:
                {
                    string selected = textBox.SelectedText ?? string.Empty;
                    if (selected.Length > 0)
                        await ClipboardHelper.TrySetTextAsync(textBox, selected);
                    e.Handled = true;
                    break;
                }

                case Key.X:
                {
                    string selected = textBox.SelectedText ?? string.Empty;
                    if (selected.Length > 0)
                    {
                        if (await ClipboardHelper.TrySetTextAsync(textBox, selected))
                            ReplaceSelection(textBox, string.Empty);
                    }
                    e.Handled = true;
                    break;
                }

                case Key.V:
                {
                    var clipboard = TopLevel.GetTopLevel(textBox)?.Clipboard;
                    if (clipboard != null)
                    {
                        string? pasted = await ClipboardExtensions.TryGetTextAsync(clipboard);
                        if (!string.IsNullOrEmpty(pasted))
                            ReplaceSelection(textBox, pasted);
                    }
                    e.Handled = true;
                    break;
                }
            }
        };
    }

    private static void ReplaceSelection(TextBox textBox, string replacement)
    {
        string current = textBox.Text ?? string.Empty;
        int start = Math.Min(textBox.SelectionStart, textBox.SelectionEnd);
        int end = Math.Max(textBox.SelectionStart, textBox.SelectionEnd);
        start = Math.Clamp(start, 0, current.Length);
        end = Math.Clamp(end, 0, current.Length);

        string updated = current.Substring(0, start) + replacement + current.Substring(end);
        int caret = start + replacement.Length;
        textBox.Text = updated;
        textBox.SelectionStart = caret;
        textBox.SelectionEnd = caret;
        textBox.CaretIndex = caret;
    }

    private static Button CreateIconButton(IBrush background, string tooltip)
    {
        var button = new Button
        {
            Width = 34,
            Height = 30,
            MinWidth = 34,
            MinHeight = 30,
            Background = background,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(7),
            Padding = new Thickness(0),
            Focusable = false,
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
        };
        ToolTip.SetTip(button, tooltip);
        return button;
    }

    private static Control BuildPlayIcon(IBrush fill)
    {
        return new TextBlock
        {
            Text = "▶",
            Foreground = fill,
            FontSize = 16,
            FontWeight = FontWeight.Bold,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private int ParsePlayCount()
    {
        string text = _countTextBox.Text?.Trim() ?? string.Empty;
        if (!int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int count))
            count = 1;

        count = Math.Clamp(count, 1, 1000);
        string normalized = count.ToString(CultureInfo.InvariantCulture);
        if (!string.Equals(_countTextBox.Text, normalized, StringComparison.Ordinal))
            _countTextBox.Text = normalized;
        return count;
    }

    private void NormalizePlayCountText()
        => _ = ParsePlayCount();

    private async Task PlayAsync()
    {
        if (_playing)
            return;

        _playing = true;
        _playButton.IsEnabled = false;
        try
        {
            int count = ParsePlayCount();
            string macroText = MacroText;
            _macroEditing = false;
            _countEditing = false;
            await _playAsync(macroText, count).ConfigureAwait(true);
        }
        finally
        {
            _playing = false;
            _playButton.IsEnabled = true;
            _refocusRequested();
        }
    }

    private void BeginDrag(object? sender, PointerPressedEventArgs e)
    {
        if (Parent is not Canvas)
            return;

        if (IsPointerWithinControl(_macroTextBox, e) ||
            IsPointerWithinControl(_countTextBox, e) ||
            IsPointerWithinControl(_playButton, e) ||
            IsPointerWithinControl(_closeButton, e))
        {
            return;
        }

        _dragging = true;
        _dragStartPoint = e.GetPosition((Visual)Parent);
        _dragStartLeft = Canvas.GetLeft(this);
        _dragStartTop = Canvas.GetTop(this);
        if (double.IsNaN(_dragStartLeft))
            _dragStartLeft = 0;
        if (double.IsNaN(_dragStartTop))
            _dragStartTop = 0;
        e.Pointer.Capture(this);
        e.Handled = true;
    }

    private static bool IsPointerWithinControl(Control control, PointerEventArgs e)
    {
        Rect bounds = control.Bounds;
        if (bounds.Width <= 0 || bounds.Height <= 0)
            return false;

        Point point = e.GetPosition(control);
        return point.X >= 0 &&
               point.Y >= 0 &&
               point.X <= bounds.Width &&
               point.Y <= bounds.Height;
    }

    private void ContinueDrag(object? sender, PointerEventArgs e)
    {
        if (!_dragging || Parent is not Canvas parent)
            return;

        Point point = e.GetPosition(parent);
        double left = _dragStartLeft + point.X - _dragStartPoint.X;
        double top = _dragStartTop + point.Y - _dragStartPoint.Y;
        Canvas.SetLeft(this, Math.Clamp(left, 0, Math.Max(0, parent.Bounds.Width - Bounds.Width)));
        Canvas.SetTop(this, Math.Clamp(top, 0, Math.Max(0, parent.Bounds.Height - Bounds.Height)));
        e.Handled = true;
    }

    private void EndDrag(object? sender, PointerEventArgs e)
    {
        if (!_dragging)
            return;

        _dragging = false;
        e.Pointer.Capture(null);
        e.Handled = true;
        Dispatcher.UIThread.Post(_refocusRequested, DispatcherPriority.Input);
    }

    private void EndDragCaptureLost(object? sender, PointerCaptureLostEventArgs e)
    {
        if (!_dragging)
            return;

        _dragging = false;
        e.Handled = true;
        Dispatcher.UIThread.Post(_refocusRequested, DispatcherPriority.Input);
    }
}
