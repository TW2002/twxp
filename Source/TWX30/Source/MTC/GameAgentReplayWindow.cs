using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class GameAgentReplayWindow : Window
{
    private readonly string _path;
    private readonly IReadOnlyList<GameAgentEvent> _events;
    private readonly TextBox _snapshotBox;
    private readonly TextBox _eventBox;
    private readonly TextBlock _statusText;
    private readonly Slider _slider;
    private int _index;

    public GameAgentReplayWindow(string path)
    {
        _path = path;
        _events = GameAgentRuntime.ReadEvents(path).ToArray();
        _index = Math.Max(0, _events.Count - 1);

        Title = "Game Agent Replay";
        Width = 1040;
        Height = 700;
        MinWidth = 760;
        MinHeight = 500;
        Background = new SolidColorBrush(Color.FromRgb(0x07, 0x12, 0x17));
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _snapshotBox = BuildReadOnlyBox("Replay snapshot");
        _eventBox = BuildReadOnlyBox("Event stream");
        _statusText = new TextBlock
        {
            Foreground = new SolidColorBrush(Color.FromRgb(0x8a, 0xb8, 0xc0)),
            VerticalAlignment = VerticalAlignment.Center,
        };

        _slider = new Slider
        {
            Minimum = 0,
            Maximum = Math.Max(0, _events.Count - 1),
            Value = _index,
            TickFrequency = 1,
            IsSnapToTickEnabled = true,
        };
        _slider.PropertyChanged += (_, e) =>
        {
            if (e.Property == Slider.ValueProperty)
                SetIndex((int)Math.Round(_slider.Value));
        };

        var firstButton = BuildButton("First", () => SetIndex(0));
        var backButton = BuildButton("-1", () => SetIndex(_index - 1));
        var forwardButton = BuildButton("+1", () => SetIndex(_index + 1));
        var lastButton = BuildButton("Last", () => SetIndex(_events.Count - 1));

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Children = { firstButton, backButton, forwardButton, lastButton },
        };

        var topRow = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,Auto"),
            ColumnSpacing = 12,
        };
        topRow.Children.Add(_slider.WithColumn(0));
        topRow.Children.Add(buttons.WithColumn(1));

        var body = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,*"),
            RowDefinitions = new RowDefinitions("Auto,*,Auto"),
            Margin = new Thickness(14),
            ColumnSpacing = 12,
            RowSpacing = 10,
        };

        body.Children.Add(topRow.WithColumn(0).WithRow(0));
        Grid.SetColumnSpan(topRow, 2);
        body.Children.Add(WrapPanel("Reconstructed State", _snapshotBox).WithColumn(0).WithRow(1));
        body.Children.Add(WrapPanel("Recent Events", _eventBox).WithColumn(1).WithRow(1));
        body.Children.Add(_statusText.WithColumn(0).WithRow(2));
        Grid.SetColumnSpan(_statusText, 2);

        Content = body;

        KeyDown += OnKeyDown;
        Opened += (_, _) => Render();
    }

    private static TextBox BuildReadOnlyBox(string watermark)
        => new()
        {
            IsReadOnly = true,
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            Watermark = watermark,
            Background = new SolidColorBrush(Color.FromRgb(0x03, 0x1d, 0x26)),
            Foreground = Brushes.Gainsboro,
            BorderBrush = new SolidColorBrush(Color.FromRgb(0x12, 0x5e, 0x70)),
            Padding = new Thickness(8),
        };

    private static Button BuildButton(string text, Action action)
    {
        var button = new Button
        {
            Content = text,
            MinWidth = 72,
            Height = 32,
        };
        button.Click += (_, _) => action();
        return button;
    }

    private static Control WrapPanel(string title, Control child)
        => new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(0x0b, 0x26, 0x30)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(0x1b, 0x82, 0x95)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(10),
            Child = new DockPanel
            {
                Children =
                {
                    new TextBlock
                    {
                        Text = title,
                        Foreground = new SolidColorBrush(Color.FromRgb(0x00, 0xd4, 0xc9)),
                        FontSize = 16,
                        FontWeight = FontWeight.SemiBold,
                        Margin = new Thickness(0, 0, 0, 8),
                    }.WithDock(Dock.Top),
                    child,
                }
            }
        };

    private void OnKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Left)
        {
            e.Handled = true;
            SetIndex(_index - 1);
        }
        else if (e.Key == Key.Right)
        {
            e.Handled = true;
            SetIndex(_index + 1);
        }
    }

    private void SetIndex(int index)
    {
        if (_events.Count == 0)
        {
            _index = 0;
            Render();
            return;
        }

        int clamped = Math.Clamp(index, 0, _events.Count - 1);
        if (clamped == _index && (int)Math.Round(_slider.Value) == clamped)
            return;

        _index = clamped;
        if ((int)Math.Round(_slider.Value) != clamped)
            _slider.Value = clamped;
        Render();
    }

    private void Render()
    {
        GameAgentReplaySnapshot snapshot = GameAgentRuntime.BuildReplaySnapshot(_path, _events, _index);
        _snapshotBox.Text = BuildSnapshotText(snapshot);
        _eventBox.Text = BuildEventText(snapshot);
        _statusText.Text = _events.Count == 0
            ? $"No replay events loaded from {_path}"
            : $"Event {_index + 1:N0} / {_events.Count:N0}  |  {_path}";
    }

    private static string BuildSnapshotText(GameAgentReplaySnapshot snapshot)
        => $"Game: {Display(snapshot.GameName)}\n" +
           $"Connected: {(snapshot.Connected ? "yes" : "no")}\n" +
           $"Sector: {Display(snapshot.CurrentSector)}\n" +
           $"Prompt: {Display(snapshot.CurrentPrompt)}\n" +
           $"Credits: {snapshot.Credits:N0}\n" +
           $"Fighters: {snapshot.Fighters:N0}\n" +
           $"Shields: {snapshot.Shields:N0}\n" +
           $"Holds: {snapshot.HoldsEmpty:N0} empty / {snapshot.HoldsTotal:N0} total\n" +
           $"Timestamp: {(snapshot.Timestamp == default ? "-" : snapshot.Timestamp.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"))}";

    private static string BuildEventText(GameAgentReplaySnapshot snapshot)
    {
        var sb = new StringBuilder();
        foreach (GameAgentEvent evt in snapshot.RecentEvents.TakeLast(36))
        {
            string text = string.IsNullOrWhiteSpace(evt.PlainText) ? evt.Kind.ToString() : evt.PlainText.Trim();
            if (text.Length > 140)
                text = text[..140] + "...";
            sb.Append(evt.Timestamp.ToLocalTime().ToString("HH:mm:ss"))
              .Append(" [")
              .Append(evt.Kind)
              .Append("] ")
              .AppendLine(text);
        }

        return sb.ToString().TrimEnd();
    }

    private static string Display(string? value)
        => string.IsNullOrWhiteSpace(value) ? "-" : value.Trim();

    private static string Display(int value)
        => value > 0 ? value.ToString() : "-";
}
