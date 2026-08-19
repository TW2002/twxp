using System;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

internal sealed class HistoryWindow : Window
{
    private readonly Func<Core.HistorySnapshot> _snapshotProvider;
    private readonly Action<Core.HistoryType?> _clearAction;
    private readonly TabControl _tabs;
    private readonly TextBox _messages;
    private readonly TextBox _fighters;
    private readonly TextBox _computer;
    private readonly DispatcherTimer _refreshTimer;

    public HistoryWindow(string title, Func<Core.HistorySnapshot> snapshotProvider, Action<Core.HistoryType?> clearAction)
    {
        _snapshotProvider = snapshotProvider;
        _clearAction = clearAction;

        Title = title;
        Width = 880;
        Height = 520;
        MinWidth = 640;
        MinHeight = 360;
        Background = new SolidColorBrush(Color.FromRgb(30, 30, 30));

        _messages = BuildViewer();
        _fighters = BuildViewer();
        _computer = BuildViewer();

        _tabs = new TabControl
        {
            ItemsSource = new object[]
            {
                new TabItem { Header = "Messages", Content = _messages },
                new TabItem { Header = "Fighters", Content = _fighters },
                new TabItem { Header = "Computer", Content = _computer },
            }
        };

        var clearButton = new Button
        {
            Content = "Clear Current",
            MinWidth = 120,
            HorizontalAlignment = HorizontalAlignment.Left,
        };
        clearButton.Click += (_, _) => ClearCurrent();

        var closeButton = new Button
        {
            Content = "Close",
            MinWidth = 120,
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        closeButton.Click += (_, _) => Close();

        var buttonRow = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("Auto,*,Auto"),
            Margin = new Thickness(0, 10, 0, 0),
        };
        Grid.SetColumn(clearButton, 0);
        Grid.SetColumn(closeButton, 2);
        buttonRow.Children.Add(clearButton);
        buttonRow.Children.Add(closeButton);

        Content = new DockPanel
        {
            Margin = new Thickness(14),
            Children =
            {
                new StackPanel
                {
                    Spacing = 10,
                    Children =
                    {
                        _tabs,
                        buttonRow,
                    }
                }
            }
        };

        _refreshTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(500) };
        _refreshTimer.Tick += (_, _) => Refresh();
        Opened += (_, _) =>
        {
            Refresh();
            _refreshTimer.Start();
        };
        Closed += (_, _) => _refreshTimer.Stop();
    }

    private static TextBox BuildViewer() => new()
    {
        IsReadOnly = true,
        AcceptsReturn = true,
        TextWrapping = TextWrapping.NoWrap,
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace"),
        Background = new SolidColorBrush(Color.FromRgb(18, 18, 18)),
        Foreground = Brushes.Gainsboro,
        BorderBrush = new SolidColorBrush(Color.FromRgb(65, 65, 65)),
        MinHeight = 400,
    };

    private void Refresh()
    {
        Core.HistorySnapshot snapshot = _snapshotProvider();
        _messages.Text = string.Join(Environment.NewLine, snapshot.Messages);
        _fighters.Text = string.Join(Environment.NewLine, snapshot.Fighters);
        _computer.Text = string.Join(Environment.NewLine, snapshot.Computer);
    }

    private void ClearCurrent()
    {
        Core.HistoryType? type = _tabs.SelectedIndex switch
        {
            1 => Core.HistoryType.Fighter,
            2 => Core.HistoryType.Computer,
            _ => Core.HistoryType.Msg,
        };

        _clearAction(type);
        Refresh();
    }
}
