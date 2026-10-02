using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Templates;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using TWXProxy.Core;

namespace MTC;

// Sources have immutable owners. Only the explicit jump button selects a game.
internal sealed class CommandDeckScriptWindows : ContentControl
{
    internal sealed record Source(int Id, string Title, DockedScriptWindows Windows, Action Select);
    private sealed record Report(Border Frame, SelectableTextBlock Text, Expander Expander);
    private sealed record Group(Expander Frame, StackPanel Stack, TextBlock Title);
    private readonly Source[] _sources;
    private readonly ScriptWindowPalette _palette;
    private readonly double _scale;
    private readonly StackPanel _stack = new() { Spacing = 10 };
    private readonly Dictionary<int, Group> _groups = new();
    private readonly Dictionary<IScriptWindow, Report> _views = new();
    private readonly TextBlock _count;
    private readonly HashSet<int> _dirty = new();
    private readonly Dictionary<int, Action> _handlers = new();
    private bool _attached;
    private bool _collapsed;
    private int _refreshQueued;
    public ScrollViewer Scroll { get; }

    public CommandDeckScriptWindows(IEnumerable<Source> sources, double scale, ScriptWindowPalette palette)
    {
        _sources = sources.ToArray(); _scale = scale; _palette = palette;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");
        FontSize = 12; ClipToBounds = true;
        HorizontalContentAlignment = HorizontalAlignment.Stretch;
        VerticalContentAlignment = VerticalAlignment.Stretch; Background = palette.Frame;
        _count = new TextBlock { Text = "Script windows / All games", Foreground = palette.Text,
            FontWeight = FontWeight.Bold, VerticalAlignment = VerticalAlignment.Center };
        var collapse = CommandDeckConsole.ActionButton("\u2195", "Collapse or expand all reports", () =>
        {
            _collapsed = !_collapsed;
            foreach (var report in _views.Values) report.Expander.IsExpanded = !_collapsed;
        }, palette);
        var header = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto"), Margin = new Thickness(10) };
        header.Children.Add(_count); Grid.SetColumn(collapse, 1); header.Children.Add(collapse);
        Scroll = new ScrollViewer { Content = _stack, Margin = new Thickness(8, 0, 8, 8),
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled, VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        var root = new Grid { RowDefinitions = new RowDefinitions("Auto,*") };
        root.Children.Add(header); Grid.SetRow(Scroll, 1); root.Children.Add(Scroll); Content = root;
        foreach (var source in _sources)
        {
            _handlers.Add(source.Id, () => QueueRefresh(source.Id));
            var title = new TextBlock { Text = source.Title, Foreground = palette.Accent,
                TextTrimming = TextTrimming.CharacterEllipsis, VerticalAlignment = VerticalAlignment.Center };
            ToolTip.SetTip(title, source.Title);
            var heading = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto") };
            heading.Children.Add(title);
            var jump = CommandDeckConsole.ActionButton("\u21b0", "Go to " + source.Title + " console", source.Select, palette);
            Grid.SetColumn(jump, 1); heading.Children.Add(jump);
            var stack = new StackPanel { Spacing = 8 };
            var group = CompactExpander(heading, stack, Brushes.Transparent, true);
            _groups.Add(source.Id, new Group(group, stack, title)); _stack.Children.Add(group);
        }
        AttachedToVisualTree += (_, _) =>
        {
            _attached = true;
            foreach (var source in _sources) source.Windows.Changed += _handlers[source.Id];
            Refresh(_sources.Select(s => s.Id).ToHashSet());
        };
        DetachedFromVisualTree += (_, _) =>
        {
            _attached = false;
            foreach (var source in _sources) source.Windows.Changed -= _handlers[source.Id];
        };
        Refresh(_sources.Select(s => s.Id).ToHashSet());
    }

    public void UpdateSourceTitle(int id, string title, bool selected)
    {
        if (!_groups.TryGetValue(id, out var group)) return;
        group.Title.Text = title; group.Title.FontWeight = selected ? FontWeight.Bold : FontWeight.Normal;
        ToolTip.SetTip(group.Title, title);
    }

    private void QueueRefresh(int id)
    {
        lock (_dirty) _dirty.Add(id);
        if (Interlocked.Exchange(ref _refreshQueued, 1) != 0) return;
        Dispatcher.UIThread.Post(() =>
        {
            HashSet<int> dirty;
            lock (_dirty) { dirty = new(_dirty); _dirty.Clear(); Interlocked.Exchange(ref _refreshQueued, 0); }
            if (_attached) Refresh(dirty);
        }, DispatcherPriority.Background);
    }

    private void Refresh(HashSet<int> dirty)
    {
        foreach (var source in _sources.Where(source => dirty.Contains(source.Id)))
        {
            var entries = source.Windows.Snapshot(); var group = _groups[source.Id];
            var frames = entries.Select(entry =>
            {
                if (!_views.TryGetValue(entry.Window, out var report))
                    _views.Add(entry.Window, report = BuildReport(entry.Window));
                string text = AnsiCodes.StripANSI(entry.Text).Replace("*", "\n");
                if (report.Text.Text != text) report.Text.Text = text;
                return report.Frame;
            }).ToArray();
            foreach (var old in group.Stack.Children.OfType<Border>().Except(frames).ToArray())
            {
                group.Stack.Children.Remove(old);
                _views.Remove(_views.First(pair => ReferenceEquals(pair.Value.Frame, old)).Key);
            }
            for (int i = 0; i < frames.Length; i++)
                if (i >= group.Stack.Children.Count || !ReferenceEquals(group.Stack.Children[i], frames[i]))
                { group.Stack.Children.Remove(frames[i]); group.Stack.Children.Insert(i, frames[i]); }
            group.Frame.IsVisible = entries.Length > 0;
        }
        _count.Text = $"Script windows ({_views.Count})";
    }

    private Report BuildReport(IScriptWindow window)
    {
        var text = new SelectableTextBlock { Foreground = _palette.Text, TextWrapping = TextWrapping.NoWrap,
            Margin = new Thickness(8 * _scale) };
        var scroll = new ScrollViewer { Content = text, Background = Brushes.Black,
            Height = 160 * _scale, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        var title = new TextBlock { Text = window.Title, Foreground = _palette.Text,
            TextTrimming = TextTrimming.CharacterEllipsis };
        ToolTip.SetTip(title, window.Title);
        var expander = CompactExpander(title, scroll, _palette.Header, !_collapsed);
        var grip = new Thumb { Height = 9 * _scale, Cursor = new Cursor(StandardCursorType.SizeNorthSouth),
            Focusable = true, Background = _palette.Header,
            Template = new FuncControlTemplate<Thumb>((_, _) => new Border
            {
                Height = 2 * _scale, Width = 42 * _scale, Background = _palette.Edge,
                CornerRadius = new CornerRadius(_scale), HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
            }) };
        ToolTip.SetTip(grip, "Resize " + window.Title);
        Avalonia.Automation.AutomationProperties.SetName(grip, "Resize " + window.Title);
        void Resize(double delta) => scroll.Height = Math.Clamp(scroll.Height + delta, 72 * _scale, 1800 * _scale);
        grip.DragDelta += (_, e) => Resize(e.Vector.Y);
        grip.KeyDown += (_, e) =>
        {
            if (e.Key is not (Key.Up or Key.Down)) return;
            Resize((e.Key == Key.Down ? 1 : -1) * 16 * _scale);
            e.Handled = true;
        };
        grip.IsVisible = expander.IsExpanded;
        expander.PropertyChanged += (_, e) =>
        {
            if (e.Property == Expander.IsExpandedProperty) grip.IsVisible = expander.IsExpanded;
        };
        var body = new Grid { RowDefinitions = new RowDefinitions("Auto,Auto") };
        body.Children.Add(expander);
        Grid.SetRow(grip, 1); body.Children.Add(grip);
        var frame = new Border { Background = _palette.Header, BorderBrush = _palette.Edge,
            BorderThickness = new Thickness(1), CornerRadius = new CornerRadius(4), Child = body, ClipToBounds = true };
        return new(frame, text, expander);
    }

    private static Expander CompactExpander(Control header, Control body, IBrush background, bool expanded)
    {
        var expander = new Expander { Header = header, Content = body, IsExpanded = expanded,
            HorizontalAlignment = HorizontalAlignment.Stretch, HorizontalContentAlignment = HorizontalAlignment.Stretch };
        expander.Template = new FuncControlTemplate<Expander>((owner, _) =>
        {
            var arrow = new TextBlock { Text = owner.IsExpanded ? "\u2304" : "\u203a", Width = 14,
                Foreground = Brushes.Gray, VerticalAlignment = VerticalAlignment.Center };
            var heading = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,*") };
            heading.Children.Add(arrow); Grid.SetColumn(header, 1); heading.Children.Add(header);
            var button = new Button { Content = heading, Background = background, BorderThickness = new Thickness(0),
                Padding = new Thickness(7, 5), MinHeight = 32, HorizontalContentAlignment = HorizontalAlignment.Stretch };
            button.Click += (_, e) => { if (ReferenceEquals(e.Source, button)) owner.IsExpanded = !owner.IsExpanded; };
            var host = new ContentControl { Content = body, IsVisible = owner.IsExpanded,
                HorizontalContentAlignment = HorizontalAlignment.Stretch };
            owner.PropertyChanged += (_, e) =>
            {
                if (e.Property != Expander.IsExpandedProperty) return;
                host.IsVisible = owner.IsExpanded;
                arrow.Text = owner.IsExpanded ? "\u2304" : "\u203a";
            };
            var grid = new Grid { RowDefinitions = new RowDefinitions("Auto,Auto") };
            grid.Children.Add(button); Grid.SetRow(host, 1); grid.Children.Add(host);
            return grid;
        });
        return expander;
    }
}
