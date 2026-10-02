using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using TWXProxy.Core;

namespace MTC;

internal sealed record ScriptWindowPalette(IBrush Frame, IBrush Edge, IBrush Header, IBrush Accent, IBrush Text);

internal sealed class ScriptWindowSidebar : Grid
{
    private readonly DockedScriptWindows _windows;
    private readonly Control? _notes;
    private readonly bool _aboveNotes;
    private double _notesWidth;
    private readonly double _baselineNotesWidth;
    private readonly double _scale;
    private readonly bool _reserveWindowSpace;
    private readonly ScriptWindowPalette _palette;
    private readonly Grid _windowBody = new();
    private readonly Border _windowFrame;
    private readonly SelectableTextBlock _text;
    private readonly ScrollViewer _contentScroll;
    private readonly StackPanel _otherTitles = new();
    private readonly ScrollViewer _titleScroll;
    private IScriptWindow[] _lastWindows = [];
    private IScriptWindow? _lastActive;
    private DockedScriptWindows.Entry[] _entries = [];
    private bool _attached;
    private int _refreshQueued;
    private double _availableWidth = 800;
    private double _windowWidthLimit = double.PositiveInfinity;
    public double RequiredWidth { get; private set; }
    public double BaselineWidth => _notes != null ? _baselineNotesWidth : 0;
    public double NotesWidth => _notesWidth;
    public event Action? RequiredWidthChanged;

    public ScriptWindowSidebar(DockedScriptWindows windows, Control? notes, bool aboveNotes,
        double notesWidth, double scale, ScriptWindowPalette palette, bool reserveWindowSpace = false)
    {
        _windows = windows;
        _notes = notes;
        _aboveNotes = aboveNotes;
        _notesWidth = notesWidth;
        _baselineNotesWidth = notesWidth;
        _scale = scale;
        _reserveWindowSpace = reserveWindowSpace;
        if (reserveWindowSpace) _windowWidthLimit = notesWidth;
        _palette = palette;
        ClipToBounds = true;
        MinWidth = 0;
        _text = new SelectableTextBlock
        {
            FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace"),
            // Like Notes, use the base size; the shell applies UI font scaling.
            FontSize = 12,
            Foreground = palette.Text,
            TextWrapping = TextWrapping.NoWrap,
            Margin = new Thickness(6 * scale),
        };
        _contentScroll = new ScrollViewer
        {
            Background = Brushes.Black,
            Content = _text,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            MinHeight = 0,
        };
        _titleScroll = new ScrollViewer
        {
            Content = _otherTitles,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
        };
        _windowBody.RowDefinitions = new RowDefinitions("Auto,*,Auto");
        Grid.SetRow(_contentScroll, 1);
        Grid.SetRow(_titleScroll, 2);
        _windowBody.Children.Add(_contentScroll);
        _windowBody.Children.Add(_titleScroll);
        _windowFrame = new Border
        {
            Background = palette.Frame,
            BorderBrush = palette.Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(16 * scale),
            Padding = new Thickness(10 * scale),
            ClipToBounds = true,
            Child = _windowBody,
        };
        Children.Add(_windowFrame);
        if (_notes != null) Children.Add(_notes);
        AttachedToVisualTree += (_, _) =>
        {
            _attached = true;
            _windows.Changed += QueueRefresh;
            Refresh();
        };
        DetachedFromVisualTree += (_, _) =>
        {
            _attached = false;
            _windows.Changed -= QueueRefresh;
        };
        _windowFrame.SizeChanged += (_, _) =>
            _titleScroll.MaxHeight = Math.Max(30 * _scale, _windowFrame.Bounds.Height * .4);
        Refresh();
    }

    public void SetAvailableWidth(double width)
    {
        _availableWidth = Math.Max(0, width);
        UpdateLayoutSize();
    }

    public void SetWindowWidthLimit(double width)
    {
        _windowWidthLimit = Math.Max(1, width);
        UpdateLayoutSize();
    }

    public void SetNotesWidth(double width)
    {
        _notesWidth = Math.Max(120 * _scale, width);
        UpdateLayoutSize();
    }

    private void QueueRefresh()
    {
        // SETWINDOWCONTENTS can run much faster than the desktop can render.
        if (Interlocked.Exchange(ref _refreshQueued, 1) != 0) return;
        Dispatcher.UIThread.Post(() =>
        {
            Interlocked.Exchange(ref _refreshQueued, 0);
            if (_attached) Refresh();
        }, DispatcherPriority.Background);
    }

    private void Refresh()
    {
        _entries = _windows.Snapshot();
        var active = _entries.FirstOrDefault(entry => entry.Active);
        var ids = _entries.Select(entry => entry.Window).ToArray();
        if (!_lastWindows.SequenceEqual(ids) || !ReferenceEquals(_lastActive, active?.Window))
        {
            foreach (var child in _windowBody.Children.Where(c => Grid.GetRow(c) == 0).ToArray())
                _windowBody.Children.Remove(child);
            _otherTitles.Children.Clear();
            if (active != null) _windowBody.Children.Add(BuildTitle(active));
            foreach (var entry in _entries.Where(entry => !entry.Active))
                _otherTitles.Children.Add(BuildTitle(entry));
            if (!ReferenceEquals(_lastActive, active?.Window)) _contentScroll.Offset = default;
            _lastWindows = ids;
            _lastActive = active?.Window;
        }
        string text = AnsiCodes.StripANSI(active?.Text ?? string.Empty).Replace("*", "\n");
        if (_text.Text != text) _text.Text = text;
        _titleScroll.IsVisible = _entries.Length > 1;
        UpdateLayoutSize();
    }

    private Button BuildTitle(DockedScriptWindows.Entry entry)
    {
        var label = new TextBlock
        {
            Text = entry.Window.Title,
            FontSize = 13 * _scale,
            FontWeight = FontWeight.Bold,
            TextTrimming = TextTrimming.CharacterEllipsis,
            VerticalAlignment = VerticalAlignment.Center,
        };
        var title = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,*") };
        title.Children.Add(new TextBlock
        {
            Text = entry.Active ? "\u25be" : "\u25b8",
            Margin = new Thickness(0, 0, 6 * _scale, 0),
            VerticalAlignment = VerticalAlignment.Center,
        });
        Grid.SetColumn(label, 1);
        title.Children.Add(label);
        var button = new Button
        {
            Content = title,
            HorizontalAlignment = HorizontalAlignment.Stretch,
            HorizontalContentAlignment = HorizontalAlignment.Stretch,
            Height = 32 * _scale,
            Padding = new Thickness(4 * _scale, 0),
            Background = entry.Active ? _palette.Header : Brushes.Transparent,
            Foreground = _palette.Accent,
            BorderThickness = new Thickness(0),
            CornerRadius = new CornerRadius(4),
        };
        ToolTip.SetTip(button, entry.Window.Title);
        button.Click += (_, _) => _windows.Select(entry.Window);
        return button;
    }

    private void UpdateLayoutSize()
    {
        bool hasWindows = _entries.Length != 0;
        IsVisible = _reserveWindowSpace || hasWindows || _notes != null;
        _windowFrame.IsVisible = hasWindows;
        double gap = 10 * _scale;
        double requested = hasWindows ? Math.Max(180 * _scale, _entries.Max(e => e.Window.Width) + 24 * _scale) : 0;
        requested = Math.Min(requested, _windowWidthLimit);
        _windowFrame.MaxWidth = _windowWidthLimit;
        double notesWidth = _notesWidth;
        double desired = _reserveWindowSpace
            ? notesWidth * (!_aboveNotes && _notes != null ? 2 : 1) + (!_aboveNotes && _notes != null ? gap : 0)
            : !hasWindows ? _notesWidth : _aboveNotes || _notes == null
            ? Math.Max(_notes != null ? _notesWidth : 0, requested)
            : _notesWidth + gap + requested;
        double required = IsVisible ? desired : 0;
        bool widthChanged = Math.Abs(RequiredWidth - required) > .01;
        RequiredWidth = required;
        Width = IsVisible ? Math.Min(desired, _availableWidth) : 0;

        bool split = hasWindows && _aboveNotes && _notes != null;
        bool beside = (hasWindows || _reserveWindowSpace) && !_aboveNotes && _notes != null;
        // Retain controls and notes undo state when content changes or windows close.
        string rows = split ? "*,10,*" : "*";
        if (RowDefinitions.Count != (split ? 3 : 1)) RowDefinitions = new RowDefinitions(rows);
        if (split) RowDefinitions[1].Height = new GridLength(gap);
        if (ColumnDefinitions.Count != (beside ? 3 : 1))
            ColumnDefinitions = beside ? new ColumnDefinitions("Auto,10,*") : new ColumnDefinitions("*");
        if (beside)
        {
            ColumnDefinitions[0].Width = new GridLength(Math.Min(notesWidth, Math.Max(0, Width - gap - (_reserveWindowSpace ? 0 : 120 * _scale))));
            ColumnDefinitions[1].Width = new GridLength(gap);
        }
        Grid.SetRow(_windowFrame, 0);
        Grid.SetColumn(_windowFrame, beside ? 2 : 0);
        if (_notes != null)
        {
            Grid.SetRow(_notes, split ? 2 : 0);
            Grid.SetColumn(_notes, 0);
        }
        if (widthChanged) RequiredWidthChanged?.Invoke();
    }
}
