using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class StatusBarConfigDialogResult
{
    public bool ShowStarDock { get; init; }
    public bool ShowBackdoor { get; init; }
    public bool ShowRylos { get; init; }
    public bool ShowAlpha { get; init; }
    public bool ShowIpInfo { get; init; }
    public bool ShowHaggleInfo { get; init; }
    public List<EmbeddedMtcStatusSectorChip> CustomSectors { get; init; } = [];
}

internal sealed class StatusBarConfigDialog : Window
{
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(9, 36, 44));
    private static readonly IBrush BgSection = new SolidColorBrush(Color.FromRgb(14, 55, 66));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(7, 28, 36));
    private static readonly IBrush BdInput = new SolidColorBrush(Color.FromRgb(0, 116, 138));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(150, 191, 199));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush AccentWarn = new SolidColorBrush(Color.FromRgb(255, 112, 112));

    private readonly List<EmbeddedMtcStatusSectorChip> _customSectors;
    private readonly StackPanel _customSectorList = new() { Spacing = 6 };
    private readonly TextBlock _validationText = new()
    {
        Foreground = AccentWarn,
        FontSize = 12,
        IsVisible = false,
        TextWrapping = TextWrapping.Wrap,
    };

    public StatusBarConfigDialogResult? Result { get; private set; }

    public StatusBarConfigDialog(EmbeddedMtcStatusBarConfig config)
    {
        Title = "Configure Status Bar";
        Width = 720;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgPanel;

        _customSectors = (config.CustomSectors ?? [])
            .Where(static chip => chip != null)
            .Select(static chip => new EmbeddedMtcStatusSectorChip
            {
                Name = chip.Name ?? string.Empty,
                Sector = chip.Sector,
            })
            .ToList();

        var chkShowSd = BuildCheckBox("Show SD", config.ShowStarDock);
        var chkShowBd = BuildCheckBox("Show BD", config.ShowBackdoor);
        var chkShowRylos = BuildCheckBox("Show Rylos", config.ShowRylos);
        var chkShowAlpha = BuildCheckBox("Show Alpha", config.ShowAlpha);
        var chkShowIpInfo = BuildCheckBox("Show IP info", config.ShowIpInfo);
        var chkShowHaggleInfo = BuildCheckBox("Show Haggle info", config.ShowHaggleInfo);

        var visibilityGrid = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Star),
            },
            RowDefinitions =
            {
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
            },
            ColumnSpacing = 18,
            RowSpacing = 8,
        };
        AddToGrid(visibilityGrid, chkShowSd, 0, 0);
        AddToGrid(visibilityGrid, chkShowBd, 1, 0);
        AddToGrid(visibilityGrid, chkShowRylos, 0, 1);
        AddToGrid(visibilityGrid, chkShowAlpha, 1, 1);
        AddToGrid(visibilityGrid, chkShowIpInfo, 0, 2);
        AddToGrid(visibilityGrid, chkShowHaggleInfo, 1, 2);

        var txtName = new TextBox
        {
            Width = 220,
            Watermark = "Custom name",
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = BdInput,
        };
        var txtSector = new TextBox
        {
            Width = 110,
            Watermark = "Sector",
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = BdInput,
        };
        var btnAdd = BuildActionButton("Add", Accent);
        btnAdd.Click += (_, _) =>
        {
            string name = (txtName.Text ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                SetValidation("Enter a name for the custom status item.");
                return;
            }

            if (!int.TryParse((txtSector.Text ?? string.Empty).Trim(), out int sector) ||
                sector <= 0 ||
                sector == ushort.MaxValue)
            {
                SetValidation("Enter a valid sector number.");
                return;
            }

            _customSectors.Add(new EmbeddedMtcStatusSectorChip
            {
                Name = name,
                Sector = sector,
            });
            txtName.Text = string.Empty;
            txtSector.Text = string.Empty;
            SetValidation(null);
            RebuildCustomSectorList();
        };

        var addRow = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 10,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                txtName,
                txtSector,
                btnAdd,
            },
        };

        var customSection = new Border
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
                        Text = "Custom sector chips",
                        Foreground = Accent,
                        FontSize = 17,
                        FontWeight = FontWeight.SemiBold,
                    },
                    new TextBlock
                    {
                        Text = "These are stored with the current game and show after Alpha in the status bar.",
                        Foreground = FgMuted,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    new ScrollViewer
                    {
                        MaxHeight = 170,
                        Content = _customSectorList,
                    },
                    addRow,
                    _validationText,
                },
            },
        };

        RebuildCustomSectorList();

        var btnSave = BuildActionButton("Save", Accent);
        btnSave.Click += (_, _) =>
        {
            Result = new StatusBarConfigDialogResult
            {
                ShowStarDock = chkShowSd.IsChecked == true,
                ShowBackdoor = chkShowBd.IsChecked == true,
                ShowRylos = chkShowRylos.IsChecked == true,
                ShowAlpha = chkShowAlpha.IsChecked == true,
                ShowIpInfo = chkShowIpInfo.IsChecked == true,
                ShowHaggleInfo = chkShowHaggleInfo.IsChecked == true,
                CustomSectors = _customSectors
                    .Select(static chip => new EmbeddedMtcStatusSectorChip
                    {
                        Name = chip.Name,
                        Sector = chip.Sector,
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
                                    Text = "Visible status items",
                                    Foreground = Accent,
                                    FontSize = 17,
                                    FontWeight = FontWeight.SemiBold,
                                },
                                visibilityGrid,
                            },
                        },
                    },
                    customSection,
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

    private static void AddToGrid(Grid grid, Control control, int column, int row)
    {
        Grid.SetColumn(control, column);
        Grid.SetRow(control, row);
        grid.Children.Add(control);
    }

    private CheckBox BuildCheckBox(string text, bool isChecked)
    {
        return new CheckBox
        {
            Content = text,
            IsChecked = isChecked,
            Foreground = FgText,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private Button BuildActionButton(string text, IBrush background)
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

    private void RebuildCustomSectorList()
    {
        _customSectorList.Children.Clear();

        if (_customSectors.Count == 0)
        {
            _customSectorList.Children.Add(new TextBlock
            {
                Text = "No custom sector chips yet.",
                Foreground = FgMuted,
                FontStyle = FontStyle.Italic,
            });
            return;
        }

        for (int index = 0; index < _customSectors.Count; index++)
        {
            EmbeddedMtcStatusSectorChip chip = _customSectors[index];
            int removeIndex = index;

            var removeButton = BuildActionButton("Remove", BgInput);
            removeButton.MinWidth = 88;
            removeButton.Click += (_, _) =>
            {
                _customSectors.RemoveAt(removeIndex);
                SetValidation(null);
                RebuildCustomSectorList();
            };

            var row = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition(new GridLength(1, GridUnitType.Star)),
                    new ColumnDefinition(GridLength.Auto),
                    new ColumnDefinition(GridLength.Auto),
                },
                ColumnSpacing = 10,
            };

            AddToGrid(row, new TextBlock
            {
                Text = chip.Name,
                Foreground = FgText,
                FontWeight = FontWeight.SemiBold,
                VerticalAlignment = VerticalAlignment.Center,
            }, 0, 0);

            AddToGrid(row, new TextBlock
            {
                Text = chip.Sector.ToString(),
                Foreground = FgMuted,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(0, 0, 8, 0),
            }, 1, 0);

            AddToGrid(row, removeButton, 2, 0);

            _customSectorList.Children.Add(new Border
            {
                Background = BgInput,
                BorderBrush = BdInput,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(10, 8),
                Child = row,
            });
        }
    }

    private void SetValidation(string? message)
    {
        _validationText.Text = message ?? string.Empty;
        _validationText.IsVisible = !string.IsNullOrWhiteSpace(message);
    }
}
