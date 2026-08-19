using System;
using System.Text.RegularExpressions;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using TWXProxy.Core;

namespace MTC;

// ── Popup Window ─────────────────────────────────────────────────────────────

/// <summary>
/// A standalone Avalonia Window opened by the TWX script WINDOW command.
/// Content is set via SETWINDOWCONTENTS and uses '*' as the line separator.
/// </summary>
internal class ScriptPopupWindow : Window
{
    private readonly ScrollViewer _scroll;
    private readonly TextBlock    _content;

    private static readonly IBrush BgWin  = new SolidColorBrush(Color.FromRgb(0x08, 0x0c, 0x18));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(0xd8, 0xe8, 0xff));

    // Strip ANSI/VT100 escape sequences from script window content
    private static readonly Regex AnsiEscape = new(@"\x1b\[[0-9;]*[A-Za-z]", RegexOptions.Compiled);

    public ScriptPopupWindow(string name, string title, int width, int height, bool onTop)
    {
        Title      = string.IsNullOrWhiteSpace(title) ? name : title;
        Width      = Math.Max(width,  120);
        Height     = Math.Max(height, 80);
        MinWidth   = 120;
        MinHeight  = 60;
        Background = BgWin;
        Topmost    = onTop;
        ShowActivated = false;
        // Don't show in taskbar — these are script auxiliary windows
        ShowInTaskbar = false;
        CanResize     = true;

        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");
        FontSize   = 12;

        _content = new TextBlock
        {
            Foreground = FgText,
            TextWrapping = TextWrapping.NoWrap,
            Margin = new Thickness(6, 4, 6, 4),
            FontFamily = FontFamily,
            FontSize = FontSize,
        };
        _scroll = new ScrollViewer
        {
            Content            = _content,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility   = ScrollBarVisibility.Auto,
        };

        Content = _scroll;
    }

    public void RaiseForTabSelection()
    {
        if (!IsVisible)
            return;

        Topmost = true;
        Dispatcher.UIThread.Post(() =>
        {
            if (IsVisible)
                Topmost = false;
        }, DispatcherPriority.Background);
    }

    /// <summary>
    /// Replace all displayed lines. Content uses '*' as the line separator
    /// (the TWX script convention: "line1*line2*line3").
    /// Leading/trailing '*' and consecutive '**' produce blank lines which
    /// are rendered as small spacers rather than full-height empty rows.
    /// ANSI escape sequences are stripped before display.
    /// </summary>
    public void SetContent(string rawContent)
    {
        // Strip ANSI escape sequences the script may have embedded
        var clean = AnsiEscape.Replace(rawContent, string.Empty);
        _content.Text = clean.Replace("*", Environment.NewLine);
        _scroll.ScrollToEnd();
    }
}

// ── IScriptWindow wrapper ─────────────────────────────────────────────────────

/// <summary>
/// Wraps a <see cref="ScriptPopupWindow"/> as an <see cref="IScriptWindow"/>.
/// All Avalonia calls are marshalled to the UI thread.
/// </summary>
internal sealed class AvaloniaScriptWindow : IScriptWindow
{
    private ScriptPopupWindow? _popup;
    private string _textContent = string.Empty;
    private bool   _isVisible;
    private bool   _disposed;
    private readonly Action<Window>? _registerWindow;

    private readonly string _name;
    private readonly string _title;
    private readonly int    _width;
    private readonly int    _height;
    private readonly bool   _onTop;

    public AvaloniaScriptWindow(
        string name,
        string title,
        int width,
        int height,
        bool onTop,
        Action<Window>? registerWindow = null)
    {
        _name   = name;
        _title  = title;
        _width  = width;
        _height = height;
        _onTop  = onTop;
        _registerWindow = registerWindow;
    }

    public string Name        => _name;
    public string Title       => _title;
    public int    Width       => _width;
    public int    Height      => _height;
    public bool   OnTop       => _onTop;
    public bool   IsVisible   => _isVisible;

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
        if (_disposed || _isVisible) return;
        _isVisible = true;
        Dispatcher.UIThread.Post(() =>
        {
            if (_popup is null)
            {
                _popup = new ScriptPopupWindow(_name, _title, _width, _height, _onTop);
                _popup.Closed += (_, _) =>
                {
                    _popup    = null;
                    _isVisible = false;
                };
                _registerWindow?.Invoke(_popup);
            }
            if (!string.IsNullOrEmpty(_textContent))
                _popup.SetContent(_textContent);
            _popup.Show();
        });
    }

    public void Hide()
    {
        if (!_isVisible) return;
        _isVisible = false;
        Dispatcher.UIThread.Post(() => { _popup?.Close(); _popup = null; });
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        Hide();
    }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/// <summary>
/// Registered on <see cref="GlobalModules.ScriptWindowFactory"/> at startup.
/// Creates real Avalonia popup windows for script WINDOW commands.
/// </summary>
public sealed class AvaloniaScriptWindowFactory : IScriptWindowFactory
{
    private readonly Func<TwxRuntimeContext, Action<Window>?>? _registrationResolver;
    private readonly Func<bool>? _ignoreStayInFrontResolver;

    public AvaloniaScriptWindowFactory(
        Func<TwxRuntimeContext, Action<Window>?>? registrationResolver = null,
        Func<bool>? ignoreStayInFrontResolver = null)
    {
        _registrationResolver = registrationResolver;
        _ignoreStayInFrontResolver = ignoreStayInFrontResolver;
    }

    public IScriptWindow CreateWindow(string name, string title, int width, int height, bool onTop = false)
    {
        TwxRuntimeContext runtimeContext = GlobalModules.CurrentContext;
        Action<Window>? registerWindow = _registrationResolver?.Invoke(runtimeContext);
        bool effectiveOnTop = onTop && _ignoreStayInFrontResolver?.Invoke() != true;
        return new AvaloniaScriptWindow(name, title, width, height, effectiveOnTop, registerWindow);
    }
}
