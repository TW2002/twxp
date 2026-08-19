using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using TWXProxy.Core;

namespace TWXP;

internal sealed class HistoryWindow : Window
{
    private readonly IProxyService _proxyService;
    private readonly string _gameId;
    private readonly ComboBox _channelPicker;
    private readonly TextBox _viewer;
    private readonly DispatcherTimer _refreshTimer;

    public HistoryWindow(string gameId, string gameName, IProxyService proxyService)
    {
        _proxyService = proxyService;
        _gameId = gameId;

        Title = $"History - {gameName}";
        Width = 760;
        Height = 560;
        MinWidth = 520;
        MinHeight = 360;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        _channelPicker = new ComboBox
        {
            ItemsSource = new[] { "Messages", "Fighters", "Computer" },
            SelectedIndex = 0,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
        _channelPicker.SelectionChanged += async (_, _) => await RefreshAsync();

        _viewer = new TextBox
        {
            IsReadOnly = true,
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            FontFamily = "Cascadia Code, Menlo, Consolas, Courier New, monospace",
        };

        var refreshButton = new Button { Content = "Refresh" };
        refreshButton.Click += async (_, _) => await RefreshAsync();

        var clearButton = new Button { Content = "Clear Current" };
        clearButton.Click += async (_, _) => await ClearCurrentAsync();

        var closeButton = new Button { Content = "Close" };
        closeButton.Click += (_, _) => Close();

        Content = new StackPanel
        {
            Margin = new Thickness(16),
            Spacing = 12,
            Children =
            {
                _channelPicker,
                _viewer,
                new StackPanel
                {
                    Orientation = Orientation.Horizontal,
                    Spacing = 10,
                    Children = { refreshButton, clearButton, closeButton },
                },
            },
        };

        _refreshTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(750),
        };
        _refreshTimer.Tick += async (_, _) => await RefreshAsync();

        Opened += async (_, _) =>
        {
            await RefreshAsync();
            _refreshTimer.Start();
        };

        Closed += (_, _) => _refreshTimer.Stop();
    }

    private async Task RefreshAsync()
    {
        HistorySnapshot snapshot = await _proxyService.GetHistoryAsync(_gameId);
        _viewer.Text = _channelPicker.SelectedIndex switch
        {
            1 => string.Join(Environment.NewLine, snapshot.Fighters),
            2 => string.Join(Environment.NewLine, snapshot.Computer),
            _ => string.Join(Environment.NewLine, snapshot.Messages),
        };
    }

    private async Task ClearCurrentAsync()
    {
        HistoryType type = _channelPicker.SelectedIndex switch
        {
            1 => HistoryType.Fighter,
            2 => HistoryType.Computer,
            _ => HistoryType.Msg,
        };

        await _proxyService.ClearHistoryAsync(_gameId, type);
        await RefreshAsync();
    }
}
