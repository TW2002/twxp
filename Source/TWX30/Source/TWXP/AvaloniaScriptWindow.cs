using System.Text.RegularExpressions;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using TWXProxy.Core;

namespace TWXP;

internal sealed class ScriptPopupWindow : Window
{
    private static readonly Regex AnsiEscape = new(@"\x1b\[[0-9;]*[A-Za-z]", RegexOptions.Compiled);

    private readonly ScrollViewer _scroll;
    private readonly StackPanel _lines;

    public ScriptPopupWindow(string name, string title, int width, int height, bool onTop)
    {
        Title = string.IsNullOrWhiteSpace(title) ? name : title;
        Width = Math.Max(width, 120);
        Height = Math.Max(height, 80);
        MinWidth = 120;
        MinHeight = 60;
        Topmost = onTop;
        ShowInTaskbar = false;
        CanResize = true;
        Background = new SolidColorBrush(Color.FromRgb(0x08, 0x0c, 0x18));
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");
        FontSize = 12;

        _lines = new StackPanel
        {
            Orientation = Orientation.Vertical,
            Margin = new Thickness(6, 4, 6, 4),
        };

        _scroll = new ScrollViewer
        {
            Content = _lines,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
        };

        Content = _scroll;
    }

    public void SetContent(string rawContent)
    {
        string clean = AnsiEscape.Replace(rawContent, string.Empty);
        string[] parts = clean.Split('*');

        _lines.Children.Clear();
        foreach (string part in parts)
        {
            if (string.IsNullOrEmpty(part))
            {
                _lines.Children.Add(new Border { Height = 4 });
                continue;
            }

            _lines.Children.Add(new TextBlock
            {
                Text = part,
                Foreground = Brushes.White,
                TextWrapping = TextWrapping.NoWrap,
            });
        }

        _scroll.ScrollToEnd();
    }
}

internal sealed class AvaloniaScriptWindow : IScriptWindow
{
    private readonly string _name;
    private readonly string _title;
    private readonly int _width;
    private readonly int _height;
    private readonly bool _onTop;

    private ScriptPopupWindow? _popup;
    private string _textContent = string.Empty;
    private bool _isVisible;
    private bool _disposed;

    public AvaloniaScriptWindow(string name, string title, int width, int height, bool onTop)
    {
        _name = name;
        _title = title;
        _width = width;
        _height = height;
        _onTop = onTop;
    }

    public string Name => _name;
    public string Title => _title;
    public int Width => _width;
    public int Height => _height;
    public bool OnTop => _onTop;
    public bool IsVisible => _isVisible;

    public string TextContent
    {
        get => _textContent;
        set
        {
            _textContent = value;
            if (_isVisible && _popup is not null)
                Dispatcher.UIThread.Post(() => _popup?.SetContent(value));
        }
    }

    public void Show()
    {
        if (_disposed || _isVisible)
            return;

        _isVisible = true;
        Dispatcher.UIThread.Post(() =>
        {
            _popup ??= new ScriptPopupWindow(_name, _title, _width, _height, _onTop);
            _popup.Closed += (_, _) =>
            {
                _popup = null;
                _isVisible = false;
            };

            if (!string.IsNullOrEmpty(_textContent))
                _popup.SetContent(_textContent);

            _popup.Show();
        });
    }

    public void Hide()
    {
        if (!_isVisible)
            return;

        _isVisible = false;
        Dispatcher.UIThread.Post(() =>
        {
            _popup?.Close();
            _popup = null;
        });
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        _disposed = true;
        Hide();
    }
}

public sealed class AvaloniaScriptWindowFactory : IScriptWindowFactory
{
    public IScriptWindow CreateWindow(string name, string title, int width, int height, bool onTop = false)
        => new AvaloniaScriptWindow(name, title, width, height, onTop);
}
