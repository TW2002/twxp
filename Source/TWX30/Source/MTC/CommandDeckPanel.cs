using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class CommandDeckPanel : Border
{
    private readonly ContentControl _body;
    private readonly Button _minimize;
    public bool IsCollapsed { get; private set; }
    public bool IsClosed { get; private set; }
    public bool Available { get; set; } = true;

    public CommandDeckPanel(string title, Control content, ScriptWindowPalette palette,
        Action<bool, bool> change)
    {
        Background = palette.Frame; BorderBrush = palette.Edge;
        BorderThickness = new Thickness(0, 0, 0, 1); ClipToBounds = true;
        var heading = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto,Auto"), Margin = new Thickness(8, 3) };
        heading.Children.Add(new TextBlock { Text = title, FontSize = 12, FontWeight = FontWeight.Bold,
            Foreground = palette.Text, VerticalAlignment = VerticalAlignment.Center,
            TextTrimming = TextTrimming.CharacterEllipsis });
        _minimize = CommandDeckConsole.ActionButton("\u2212", "Minimize " + title,
            () => change(false, !IsCollapsed), palette);
        var close = CommandDeckConsole.ActionButton("\u00d7", "Close " + title,
            () => change(true, IsCollapsed), palette);
        Grid.SetColumn(_minimize, 1); heading.Children.Add(_minimize);
        Grid.SetColumn(close, 2); heading.Children.Add(close);
        _body = new ContentControl { Content = content, Margin = new Thickness(8, 2, 8, 8),
            HorizontalContentAlignment = HorizontalAlignment.Stretch,
            VerticalContentAlignment = VerticalAlignment.Stretch };
        var grid = new Grid { RowDefinitions = new RowDefinitions("Auto,*") };
        grid.Children.Add(heading); Grid.SetRow(_body, 1); grid.Children.Add(_body); Child = grid;
        Title = title;
    }

    public string Title { get; }

    public void SetState(bool closed, bool collapsed)
    {
        IsClosed = closed; IsCollapsed = collapsed; IsVisible = Available && !closed;
        _body.IsVisible = !collapsed;
        _minimize.Content = collapsed ? "\u25a1" : "\u2212";
        string action = (collapsed ? "Restore " : "Minimize ") + Title;
        ToolTip.SetTip(_minimize, action);
        Avalonia.Automation.AutomationProperties.SetName(_minimize, action);
    }
}
