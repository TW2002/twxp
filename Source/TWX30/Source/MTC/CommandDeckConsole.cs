using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using TWXProxy.Core;

namespace MTC;

// Each console owns its terminal; changing the inspector never rebinds this view.
internal sealed class CommandDeckConsole : Border
{
    private readonly TextBlock _title;
    private readonly TextBlock _status;
    private readonly TextBlock _input;
    private readonly TextBlock _starDock;
    private readonly TextBlock _backdoor;
    private readonly TextBlock _rylos;
    private readonly TextBlock _botMode;
    private readonly TextBlock _explored;
    private readonly Button _expand;
    private readonly Border _terminalHost;
    private readonly IBrush _edge;
    private readonly IBrush _accent;
    private ModDatabase? _explorationDatabase;
    private long _explorationStamp = -1;
    private long _explorationNextRefresh;
    private bool _explorationRunning;
    private bool _attached;

    public CommandDeckConsole(TerminalControl terminal, Action select, Action expand,
        Action close, ScriptWindowPalette palette)
    {
        _edge = palette.Edge; _accent = palette.Accent;
        BorderBrush = _edge; BorderThickness = new Thickness(1);
        CornerRadius = new CornerRadius(4); Background = palette.Frame; ClipToBounds = true;
        _title = new TextBlock { FontSize = 13, FontWeight = FontWeight.Bold,
            Foreground = palette.Text, TextTrimming = TextTrimming.CharacterEllipsis };
        _status = new TextBlock { FontSize = 10, Foreground = palette.Text,
            TextTrimming = TextTrimming.CharacterEllipsis };
        _input = new TextBlock { Text = "INPUT", FontSize = 10, FontWeight = FontWeight.Bold,
            Foreground = palette.Accent, VerticalAlignment = VerticalAlignment.Center, IsVisible = false };
        var selectButton = new Button
        {
            Background = Brushes.Transparent, BorderThickness = new Thickness(0),
            HorizontalContentAlignment = HorizontalAlignment.Stretch, Padding = new Thickness(10, 6),
            Content = _title,
        };
        selectButton.Click += (_, _) => select();
        _expand = ActionButton("\u25a1", "Expand console", expand, palette);
        var actions = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 5,
            Margin = new Thickness(4), Children = { _input, _expand,
                ActionButton("\u00d7", "Close game", close, palette) } };
        var header = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto"), RowDefinitions = new RowDefinitions("Auto,Auto"), Background = palette.Header };
        header.Children.Add(selectButton); Grid.SetColumn(actions, 1); header.Children.Add(actions);
        var statusButton = new Button { Content = _status, Background = Brushes.Transparent, BorderThickness = new Thickness(0),
            HorizontalContentAlignment = HorizontalAlignment.Stretch, Padding = new Thickness(10, 0, 8, 6) };
        statusButton.Click += (_, _) => select();
        Grid.SetRow(statusButton, 1); Grid.SetColumnSpan(statusButton, 2); header.Children.Add(statusButton);
        _terminalHost = new Border { Background = Brushes.Black, Padding = new Thickness(5), Child = terminal };
        var scaler = new Viewbox { Stretch = Stretch.Uniform, StretchDirection = StretchDirection.DownOnly,
            HorizontalAlignment = HorizontalAlignment.Stretch, VerticalAlignment = VerticalAlignment.Stretch,
            Child = _terminalHost };
        var reminders = new WrapPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        TextBlock Reminder(string name, string color)
        {
            var text = new TextBlock { FontSize = 10, Foreground = palette.Text };
            ToolTip.SetTip(text, name);
            reminders.Children.Add(new Border { Child = text, BorderBrush = Brush.Parse(color),
                BorderThickness = new Thickness(0, 0, 0, 1), Padding = new Thickness(3, 1), Margin = new Thickness(0, 1, 5, 1) });
            return text;
        }
        _starDock = Reminder("StarDock", "#dcb347");
        _backdoor = Reminder("StarDock backdoor", "#f0596c");
        _rylos = Reminder("Rylos", "#00c9bd");
        _botMode = new TextBlock { FontSize = 10, Foreground = palette.Text, Margin = new Thickness(0, 3, 0, 0),
            TextTrimming = TextTrimming.CharacterEllipsis };
        reminders.Children.Add(_botMode);
        _explored = new TextBlock { FontSize = 10, Foreground = palette.Text, Text = "--% Explored",
            VerticalAlignment = VerticalAlignment.Center, HorizontalAlignment = HorizontalAlignment.Right, Margin = new Thickness(6, 0, 0, 0) };
        var footer = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto"), Height = 40, Margin = new Thickness(6, 0), ClipToBounds = true };
        footer.Children.Add(reminders); Grid.SetColumn(_explored, 1); footer.Children.Add(_explored);
        footer.SizeChanged += (_, _) => _botMode.MaxWidth = Math.Max(0, footer.Bounds.Width - _explored.Bounds.Width - 6);
        var body = new Grid { RowDefinitions = new RowDefinitions("Auto,*,Auto") };
        body.Children.Add(header);
        var terminalArea = new Border { Background = Brushes.Black, Child = scaler, ClipToBounds = true };
        Grid.SetRow(terminalArea, 1); body.Children.Add(terminalArea);
        Grid.SetRow(footer, 2); body.Children.Add(footer); Child = body;
        terminalArea.SizeChanged += (_, _) => FitTerminal(terminal, terminalArea.Bounds.Size);
        AttachedToVisualTree += (_, _) => _attached = true;
        DetachedFromVisualTree += (_, _) => { _attached = false; _explorationDatabase = null; };
        FitTerminal(terminal, default);
    }

    private void FitTerminal(TerminalControl terminal, Size available)
    {
        double width = terminal.MinimumPixelWidth + 10;
        double height = terminal.MinimumPixelHeight + 10;
        double factor = available.Width > 0 && available.Height > 0
            ? Math.Min(1, Math.Min(available.Width / width, available.Height / height)) : 1;
        _terminalHost.Width = Math.Max(width, available.Width / Math.Max(.1, factor));
        _terminalHost.Height = Math.Max(height, available.Height / Math.Max(.1, factor));
    }

    public void Update(string title, string status, string starDock, string backdoor, string rylos, string mode, bool active, bool expanded)
    {
        _title.Text = title; ToolTip.SetTip(_title, title);
        _status.Text = status; ToolTip.SetTip(_status, status); _input.IsVisible = active;
        _starDock.Text = "SD " + starDock; _backdoor.Text = "BD " + backdoor; _rylos.Text = "Rylos " + rylos;
        _botMode.Text = "Bot Mode: " + mode; ToolTip.SetTip(_botMode, _botMode.Text);
        BorderBrush = active ? _accent : _edge;
        _expand.Content = expanded ? "\u25a3" : "\u25a1";
        ToolTip.SetTip(_expand, expanded ? "Restore tiled consoles" : "Expand console");
    }

    public async void RefreshExploration(ModDatabase? database)
    {
        if (!ReferenceEquals(database, _explorationDatabase))
        {
            _explorationDatabase = database; _explorationStamp = -1; _explorationNextRefresh = 0;
            _explored.Text = "--% Explored";
        }
        if (database is not { IsOpen: true } || database.DBHeader.Sectors <= 0)
        { _explored.Text = "--% Explored"; _explorationStamp = -1; return; }
        if (!_attached || !IsVisible || _explorationRunning || _explorationStamp == database.ChangeStamp ||
            Environment.TickCount64 < _explorationNextRefresh) return;
        _explorationRunning = true; _explorationNextRefresh = Environment.TickCount64 + 2000;
        long stamp = database.ChangeStamp;
        try
        {
            // Never count sectors on the UI thread or reuse another console's database.
            var summary = await Task.Run(() => SectorExplorationSummary.Read(database));
            if (!_attached || !ReferenceEquals(database, _explorationDatabase) || !database.IsOpen || database.ChangeStamp != stamp) return;
            _explorationStamp = stamp;
            _explored.Text = summary.Total > 0 ? summary.Text : "--% Explored";
        }
        catch (Exception ex) { GlobalModules.DebugLog($"[MTC] Deck exploration summary failed: {ex.Message}\n"); }
        finally { _explorationRunning = false; }
    }

    internal static Button ActionButton(string glyph, string name, Action action, ScriptWindowPalette palette)
    {
        var button = new Button { Content = glyph, Width = 26, Height = 26, Padding = new Thickness(0),
            Background = Brushes.Transparent, BorderThickness = new Thickness(0), Foreground = palette.Text,
            HorizontalContentAlignment = HorizontalAlignment.Center, VerticalContentAlignment = VerticalAlignment.Center };
        ToolTip.SetTip(button, name);
        Avalonia.Automation.AutomationProperties.SetName(button, name);
        button.Click += (_, _) => action();
        return button;
    }
}
