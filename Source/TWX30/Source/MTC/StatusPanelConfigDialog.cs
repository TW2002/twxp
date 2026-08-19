using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class StatusPanelConfigDialogResult
{
    public List<AppPreferences.StatusPanelSectionPreference> Sections { get; init; } = [];
}

internal sealed class StatusPanelConfigDialog : Window
{
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(9, 36, 44));
    private static readonly IBrush BgSection = new SolidColorBrush(Color.FromRgb(14, 55, 66));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(7, 28, 36));
    private static readonly IBrush BdInput = new SolidColorBrush(Color.FromRgb(0, 116, 138));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(150, 191, 199));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));

    private sealed class SectionRow
    {
        public required AppPreferences.StatusPanelSectionPreference Section { get; init; }
        public required CheckBox VisibleCheckBox { get; init; }
        public ComboBox? OnlineRefreshComboBox { get; init; }
    }

    private sealed class OnlineRefreshIntervalOption
    {
        public required string Label { get; init; }
        public required int Seconds { get; init; }

        public override string ToString() => Label;
    }

    private readonly List<AppPreferences.StatusPanelSectionPreference> _sections;
    private readonly List<SectionRow> _rows = [];
    private readonly StackPanel _rowsHost = new() { Spacing = 8 };

    public StatusPanelConfigDialogResult? Result { get; private set; }

    public StatusPanelConfigDialog(IReadOnlyList<AppPreferences.StatusPanelSectionPreference> sections)
    {
        Title = "Configure Status Panel";
        Width = 620;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgPanel;

        _sections = (sections ?? [])
            .Select(static section => new AppPreferences.StatusPanelSectionPreference
            {
                Id = section.Id,
                Visible = section.Visible,
                Order = section.Order,
                OnlineAutoRefreshEnabled = section.OnlineAutoRefreshEnabled,
                OnlineRefreshIntervalSeconds = AppPreferences.NormalizeOnlineRefreshIntervalSeconds(section.OnlineRefreshIntervalSeconds),
            })
            .ToList();

        RebuildRows();

        var btnSave = BuildActionButton("Save", Accent);
        btnSave.Click += (_, _) =>
        {
            Result = new StatusPanelConfigDialogResult
            {
                Sections = _rows
                    .Select((row, index) => new AppPreferences.StatusPanelSectionPreference
                    {
                        Id = row.Section.Id,
                        Visible = row.VisibleCheckBox.IsChecked == true,
                        Order = index,
                        OnlineAutoRefreshEnabled = GetOnlineRefreshEnabled(row),
                        OnlineRefreshIntervalSeconds = GetOnlineRefreshIntervalSeconds(row),
                    })
                    .ToList(),
            };
            Close(true);
        };

        var btnCancel = BuildActionButton("Cancel", BgInput);
        btnCancel.Click += (_, _) => Close(false);

        Content = new Border
        {
            Padding = new Thickness(18),
            Child = new StackPanel
            {
                Spacing = 14,
                Children =
                {
                    new Border
                    {
                        Background = BgSection,
                        BorderBrush = BdInput,
                        BorderThickness = new Thickness(1),
                        CornerRadius = new CornerRadius(10),
                        Padding = new Thickness(14),
                        Child = new StackPanel
                        {
                            Spacing = 10,
                            Children =
                            {
                                new TextBlock
                                {
                                    Text = "Classic status panel layout",
                                    Foreground = Accent,
                                    FontSize = 17,
                                    FontWeight = FontWeight.SemiBold,
                                },
                                new TextBlock
                                {
                                    Text = "Show or hide the left-side Trader, Online, and Ship Info sections, then move them up or down to change their order.",
                                    Foreground = FgMuted,
                                    TextWrapping = TextWrapping.Wrap,
                                },
                                _rowsHost,
                            },
                        },
                    },
                    new TextBlock
                    {
                        Text = "This currently affects the classic sidebar layout. Command Deck stays unchanged for now.",
                        Foreground = FgMuted,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        HorizontalAlignment = HorizontalAlignment.Right,
                        Spacing = 10,
                        Children = { btnSave, btnCancel },
                    },
                },
            },
        };
    }

    private void RebuildRows()
    {
        _rows.Clear();
        _rowsHost.Children.Clear();

        for (int index = 0; index < _sections.Count; index++)
        {
            AppPreferences.StatusPanelSectionPreference section = _sections[index];
            int currentIndex = index;

            var checkBox = new CheckBox
            {
                Content = AppPreferences.GetStatusPanelSectionLabel(section.Id),
                IsChecked = section.Visible,
                Foreground = FgText,
                VerticalAlignment = VerticalAlignment.Center,
            };

            var upButton = BuildActionButton("Up", BgInput);
            upButton.MinWidth = 74;
            upButton.IsEnabled = currentIndex > 0;
            upButton.Click += (_, _) =>
            {
                MoveSection(currentIndex, currentIndex - 1);
            };

            var downButton = BuildActionButton("Down", BgInput);
            downButton.MinWidth = 74;
            downButton.IsEnabled = currentIndex < _sections.Count - 1;
            downButton.Click += (_, _) =>
            {
                MoveSection(currentIndex, currentIndex + 1);
            };

            bool isOnline = string.Equals(section.Id, AppPreferences.StatusPanelOnline, StringComparison.OrdinalIgnoreCase);
            ComboBox? onlineRefreshComboBox = isOnline
                ? BuildOnlineRefreshComboBox(section.OnlineAutoRefreshEnabled, section.OnlineRefreshIntervalSeconds)
                : null;

            var row = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition(GridLength.Star),
                    new ColumnDefinition(GridLength.Auto),
                    new ColumnDefinition(GridLength.Auto),
                    new ColumnDefinition(GridLength.Auto),
                },
                ColumnSpacing = 10,
            };

            Grid.SetColumn(checkBox, 0);
            row.Children.Add(checkBox);

            if (onlineRefreshComboBox != null)
            {
                var refreshOptions = new StackPanel
                {
                    Orientation = Orientation.Horizontal,
                    Spacing = 8,
                    VerticalAlignment = VerticalAlignment.Center,
                    Children =
                    {
                        new TextBlock
                        {
                            Text = "Update every",
                            Foreground = FgMuted,
                            VerticalAlignment = VerticalAlignment.Center,
                        },
                        onlineRefreshComboBox,
                    },
                };

                Grid.SetColumn(refreshOptions, 1);
                row.Children.Add(refreshOptions);
            }

            Grid.SetColumn(upButton, 2);
            Grid.SetColumn(downButton, 3);
            row.Children.Add(upButton);
            row.Children.Add(downButton);

            _rows.Add(new SectionRow
            {
                Section = section,
                VisibleCheckBox = checkBox,
                OnlineRefreshComboBox = onlineRefreshComboBox,
            });

            _rowsHost.Children.Add(new Border
            {
                Background = BgInput,
                BorderBrush = BdInput,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(12, 10),
                Child = row,
            });
        }
    }

    private void MoveSection(int fromIndex, int toIndex)
    {
        if (fromIndex < 0 || fromIndex >= _sections.Count || toIndex < 0 || toIndex >= _sections.Count || fromIndex == toIndex)
            return;

        CaptureVisibleState();
        AppPreferences.StatusPanelSectionPreference section = _sections[fromIndex];
        _sections.RemoveAt(fromIndex);
        _sections.Insert(toIndex, section);
        RebuildRows();
    }

    private void CaptureVisibleState()
    {
        for (int index = 0; index < _rows.Count; index++)
        {
            _sections[index].Visible = _rows[index].VisibleCheckBox.IsChecked == true;
            _sections[index].OnlineRefreshIntervalSeconds = GetOnlineRefreshIntervalSeconds(_rows[index]);
        }
    }

    private static int GetOnlineRefreshIntervalSeconds(SectionRow row)
        => row.OnlineRefreshComboBox?.SelectedItem is OnlineRefreshIntervalOption { Seconds: > 0 } option
            ? AppPreferences.NormalizeOnlineRefreshIntervalSeconds(option.Seconds)
            : AppPreferences.NormalizeOnlineRefreshIntervalSeconds(row.Section.OnlineRefreshIntervalSeconds);

    private static bool GetOnlineRefreshEnabled(SectionRow row)
        => row.OnlineRefreshComboBox?.SelectedItem is OnlineRefreshIntervalOption { Seconds: > 0 };

    private static ComboBox BuildOnlineRefreshComboBox(bool enabled, int selectedSeconds)
    {
        var options = new List<OnlineRefreshIntervalOption>
        {
            new() { Label = "Off", Seconds = 0 },
            new() { Label = "30 seconds", Seconds = 30 },
            new() { Label = "1 minute", Seconds = 60 },
            new() { Label = "2 minutes", Seconds = 120 },
            new() { Label = "5 minutes", Seconds = 300 },
        };

        int normalizedSeconds = AppPreferences.NormalizeOnlineRefreshIntervalSeconds(selectedSeconds);
        int selectedOptionSeconds = enabled ? normalizedSeconds : 0;
        return new ComboBox
        {
            ItemsSource = options,
            SelectedItem = options.First(option => option.Seconds == selectedOptionSeconds),
            Width = 135,
            MinHeight = 34,
            Padding = new Thickness(10, 5),
            Background = BgPanel,
            Foreground = FgText,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private static Button BuildActionButton(string text, IBrush background)
    {
        return new Button
        {
            Content = text,
            MinWidth = 100,
            Padding = new Thickness(14, 8),
            Background = background,
            Foreground = FgText,
            BorderBrush = BdInput,
            BorderThickness = new Thickness(1),
        };
    }
}
