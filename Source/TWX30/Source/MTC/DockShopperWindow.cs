using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class DockShopperShipChoice
{
    public DockShopperShipChoice(string token, string name, string cost = "", string details = "")
    {
        Token = token;
        Name = name;
        Cost = cost;
        Details = details;
    }

    public string Token { get; }
    public string Name { get; }
    public string Cost { get; }
    public string Details { get; }

    public override string ToString()
        => string.IsNullOrWhiteSpace(Cost) ? $"{Token} - {Name}" : $"{Token} - {Name} ({Cost})";
}

internal sealed record DockShopperOrderResult(string EncodedOrder, string CommandLine);

internal sealed class DockShopperWindow : Window
{
    private const double ShipChoiceDropDownRowHeight = 36;
    private const double ShipChoiceDropDownPadding = 12;

    private static readonly IBrush BgWindow = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(18, 43, 53));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(137, 162, 172));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush AccentHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush AccentInk = new SolidColorBrush(Color.FromRgb(8, 26, 30));
    private static readonly IBrush Border = new SolidColorBrush(Color.FromRgb(51, 86, 99));

    private readonly List<QuantityRow> _quantityRows = [];
    private readonly ComboBox _planetScannerChoice = BuildCombo(["None", "Yes"]);
    private readonly ComboBox _longRangeChoice = BuildCombo(["None", "Holo", "Density"]);
    private readonly ComboBox _twarpChoice = BuildCombo(["None", "Yes"]);
    private readonly TextBox _towShipNumber = BuildSmallTextBox("0", 80);
    private readonly ComboBox _shipChoice;
    private readonly TextBox _shipCount = BuildSmallTextBox("1", 64);
    private readonly TextBox _shipName = BuildSmallTextBox("LSD Ship", 170);
    private readonly TextBlock _encodedPreview = new();
    private readonly TextBlock _validationText = new();
    private readonly IReadOnlyList<DockShopperShipChoice> _shipChoices;

    public DockShopperWindow(IReadOnlyList<DockShopperShipChoice> shipChoices)
    {
        _shipChoices = shipChoices.Count > 1 ? shipChoices : BuildFallbackShipChoices();
        _shipChoice = BuildShipCombo(_shipChoices);
        _planetScannerChoice.SelectionChanged += (_, _) => RefreshPreview();
        _longRangeChoice.SelectionChanged += (_, _) => RefreshPreview();
        _twarpChoice.SelectionChanged += (_, _) => RefreshPreview();

        Title = "Dock Shopper";
        Width = 690;
        Height = 720;
        MinWidth = 620;
        MinHeight = 560;
        Background = BgWindow;
        Foreground = FgText;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        var root = new DockPanel
        {
            LastChildFill = true,
            Margin = new Thickness(16),
        };

        var footer = BuildFooter();
        DockPanel.SetDock(footer, Dock.Bottom);
        root.Children.Add(footer);

        var header = new StackPanel
        {
            Spacing = 4,
            Margin = new Thickness(0, 0, 0, 12),
            Children =
            {
                new TextBlock
                {
                    Text = "LoneStar's StarDock Shopper",
                    FontSize = 20,
                    FontWeight = FontWeight.Bold,
                    Foreground = AccentHot,
                },
                new TextBlock
                {
                    Text = "Emporium Daily Specials",
                    FontSize = 13,
                    Foreground = Accent,
                },
            },
        };
        DockPanel.SetDock(header, Dock.Top);
        root.Children.Add(header);

        var content = new StackPanel { Spacing = 14 };
        content.Children.Add(BuildHardwarePanel());
        content.Children.Add(BuildShipyardPanel());
        content.Children.Add(BuildShipPurchasePanel());

        root.Children.Add(new ScrollViewer
        {
            VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            Content = content,
        });

        Content = root;
        RefreshPreview();
    }

    public DockShopperOrderResult? Result { get; private set; }

    private Control BuildHardwarePanel()
    {
        var grid = BuildOrderGrid();
        AddGridHeader(grid);
        AddQuantityRow(grid, "Atomic Detonators", "15,000", 255);
        AddQuantityRow(grid, "Beacons", "100", 255);
        AddQuantityRow(grid, "Corbomite Transducers", "1,000", 255);
        AddQuantityRow(grid, "Cloaking Units", "25,000", 255);
        AddQuantityRow(grid, "E-Probes", "10,000", 255);
        AddChoiceRow(grid, "Planet Scanner", "30,000", _planetScannerChoice);
        AddQuantityRow(grid, "Limpet Mines", "10,000", 255);
        AddQuantityRow(grid, "Armid Mines", "1,000", 255);
        AddQuantityRow(grid, "Photon Missiles", "40,000", 255);
        AddChoiceRow(grid, "Long Range Scan", "25,000", _longRangeChoice);
        AddQuantityRow(grid, "Mine Disruptors", "6,000", 255);
        AddQuantityRow(grid, "Genesis Torpedoes", "20,000", 255);
        AddChoiceRow(grid, "Twarp Drive", "80,000", _twarpChoice);
        return BuildPanel("Hardware", grid);
    }

    private Control BuildShipyardPanel()
    {
        var grid = BuildOrderGrid();
        AddGridHeader(grid);
        AddQuantityRow(grid, "Holds", "5,250", 50_000);
        AddQuantityRow(grid, "Figs", "232", 5_000_000);
        AddQuantityRow(grid, "Shields", "117", 5_000_000);

        int row = grid.RowDefinitions.Count;
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        AddCell(grid, "Tow Ship", row, 0, FgText);
        AddCell(grid, "", row, 1, FgMuted);
        grid.Children.Add(_towShipNumber);
        Grid.SetRow(_towShipNumber, row);
        Grid.SetColumn(_towShipNumber, 2);
        AddCell(grid, "Ship number, or 0.", row, 3, FgMuted);
        _towShipNumber.TextChanged += (_, _) => RefreshPreview();

        return BuildPanel("Shipyard", grid);
    }

    private Control BuildShipPurchasePanel()
    {
        _shipChoice.SelectionChanged += (_, _) => RefreshPreview();
        _shipCount.TextChanged += (_, _) => RefreshPreview();
        _shipName.TextChanged += (_, _) => RefreshPreview();

        var viewButton = BuildActionButton("View", primary: false);
        viewButton.Click += async (_, _) =>
        {
            if (_shipChoice.SelectedItem is DockShopperShipChoice choice)
                await ShowShipDetailsAsync(choice);
        };

        var clearButton = BuildActionButton("Clear", primary: false);
        clearButton.Click += (_, _) =>
        {
            _shipChoice.SelectedIndex = 0;
            _shipCount.Text = "1";
            _shipName.Text = "LSD Ship";
        };

        var grid = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = new GridLength(120) },
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                new ColumnDefinition { Width = GridLength.Auto },
            },
            RowDefinitions =
            {
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = GridLength.Auto },
            },
            RowSpacing = 8,
            ColumnSpacing = 10,
        };

        AddCell(grid, "Buy Ship", 0, 0, FgText);
        grid.Children.Add(_shipChoice);
        Grid.SetRow(_shipChoice, 0);
        Grid.SetColumn(_shipChoice, 1);
        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Children = { viewButton, clearButton },
        };
        grid.Children.Add(buttons);
        Grid.SetRow(buttons, 0);
        Grid.SetColumn(buttons, 2);

        AddCell(grid, "Quantity", 1, 0, FgText);
        grid.Children.Add(_shipCount);
        Grid.SetRow(_shipCount, 1);
        Grid.SetColumn(_shipCount, 1);
        AddCell(grid, "0 means no ship purchase.", 1, 2, FgMuted);

        AddCell(grid, "Ship Name", 2, 0, FgText);
        grid.Children.Add(_shipName);
        Grid.SetRow(_shipName, 2);
        Grid.SetColumn(_shipName, 1);
        Grid.SetColumnSpan(_shipName, 2);

        return BuildPanel("Ship Purchase", grid);
    }

    private Control BuildFooter()
    {
        _encodedPreview.FontFamily = FontFamily.Parse("Menlo, Consolas, monospace");
        _encodedPreview.FontSize = 11;
        _encodedPreview.Foreground = AccentHot;
        _encodedPreview.TextWrapping = TextWrapping.Wrap;

        _validationText.Foreground = new SolidColorBrush(Color.FromRgb(255, 112, 112));
        _validationText.MinHeight = 18;

        var goButton = BuildActionButton("Go", primary: true);
        goButton.Click += (_, _) =>
        {
            if (!TryBuildOrder(out string encoded, out string error))
            {
                _validationText.Text = error;
                return;
            }

            Result = new DockShopperOrderResult(encoded, "lsd " + encoded);
            Close(true);
        };

        var cancelButton = BuildActionButton("Cancel", primary: false);
        cancelButton.Click += (_, _) => Close(false);

        return new Border
        {
            Background = BgPanel,
            BorderBrush = Border,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(12),
            Margin = new Thickness(0, 12, 0, 0),
            Child = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                    new ColumnDefinition { Width = GridLength.Auto },
                },
                RowDefinitions =
                {
                    new RowDefinition { Height = GridLength.Auto },
                    new RowDefinition { Height = GridLength.Auto },
                },
                ColumnSpacing = 12,
                RowSpacing = 6,
                Children =
                {
                    _encodedPreview,
                    _validationText.WithGridPosition(1, 0),
                    new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        Spacing = 8,
                        Children = { cancelButton, goButton },
                    }.WithGridPosition(0, 1, rowSpan: 2),
                },
            },
        };
    }

    private static Grid BuildOrderGrid()
        => new()
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = new GridLength(210) },
                new ColumnDefinition { Width = new GridLength(86) },
                new ColumnDefinition { Width = new GridLength(124) },
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
            },
            RowSpacing = 6,
            ColumnSpacing = 10,
        };

    private static Control BuildPanel(string title, Control child)
        => new Border
        {
            Background = BgPanel,
            BorderBrush = Border,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(12),
            Child = new StackPanel
            {
                Spacing = 10,
                Children =
                {
                    new TextBlock
                    {
                        Text = title,
                        FontSize = 14,
                        FontWeight = FontWeight.Bold,
                        Foreground = Accent,
                    },
                    child,
                },
            },
        };

    private static void AddGridHeader(Grid grid)
    {
        int row = grid.RowDefinitions.Count;
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        AddCell(grid, "Item", row, 0, FgMuted, bold: true);
        AddCell(grid, "Price", row, 1, FgMuted, bold: true);
        AddCell(grid, "Order", row, 2, FgMuted, bold: true);
        AddCell(grid, "Amount", row, 3, FgMuted, bold: true);
    }

    private void AddQuantityRow(Grid grid, string name, string price, int max)
    {
        var row = new QuantityRow(name, price, max);
        row.Mode.SelectionChanged += (_, _) =>
        {
            row.Amount.IsEnabled = row.IsSpecific;
            RefreshPreview();
        };
        row.Amount.TextChanged += (_, _) => RefreshPreview();
        row.Amount.IsEnabled = false;
        _quantityRows.Add(row);

        int index = grid.RowDefinitions.Count;
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        AddCell(grid, name, index, 0, FgText);
        AddCell(grid, price, index, 1, AccentHot);
        grid.Children.Add(row.Mode);
        Grid.SetRow(row.Mode, index);
        Grid.SetColumn(row.Mode, 2);
        grid.Children.Add(row.Amount);
        Grid.SetRow(row.Amount, index);
        Grid.SetColumn(row.Amount, 3);
    }

    private static void AddChoiceRow(Grid grid, string name, string price, ComboBox combo)
    {
        int index = grid.RowDefinitions.Count;
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        AddCell(grid, name, index, 0, FgText);
        AddCell(grid, price, index, 1, AccentHot);
        grid.Children.Add(combo);
        Grid.SetRow(combo, index);
        Grid.SetColumn(combo, 2);
    }

    private static void AddCell(Grid grid, string text, int row, int column, IBrush foreground, bool bold = false)
    {
        var cell = new TextBlock
        {
            Text = text,
            Foreground = foreground,
            FontWeight = bold ? FontWeight.Bold : FontWeight.Normal,
            VerticalAlignment = VerticalAlignment.Center,
            TextWrapping = TextWrapping.Wrap,
        };
        grid.Children.Add(cell);
        Grid.SetRow(cell, row);
        Grid.SetColumn(cell, column);
    }

    private static ComboBox BuildCombo(IEnumerable<object> items)
    {
        var combo = new ComboBox
        {
            ItemsSource = items.ToArray(),
            SelectedIndex = 0,
            MinWidth = 116,
            Background = BgInput,
            BorderBrush = Border,
            Foreground = FgText,
            Padding = new Thickness(8, 2),
        };
        return combo;
    }

    private static ComboBox BuildCombo(IEnumerable<string> items)
        => BuildCombo(items.Cast<object>());

    private static ComboBox BuildShipCombo(IReadOnlyList<DockShopperShipChoice> choices)
    {
        var combo = BuildCombo(choices.Cast<object>());
        combo.MaxDropDownHeight = choices.Count * ShipChoiceDropDownRowHeight + ShipChoiceDropDownPadding;
        return combo;
    }

    private static TextBox BuildSmallTextBox(string text, double width)
        => new()
        {
            Text = text,
            Width = width,
            Background = BgInput,
            BorderBrush = Border,
            Foreground = FgText,
            CaretBrush = Accent,
            Padding = new Thickness(8, 3),
        };

    private static Button BuildActionButton(string text, bool primary)
        => new()
        {
            Content = text,
            MinWidth = primary ? 86 : 72,
            Height = 30,
            Background = primary ? Accent : BgInput,
            BorderBrush = primary ? AccentHot : Border,
            Foreground = primary ? AccentInk : FgText,
            BorderThickness = new Thickness(1),
            FontWeight = FontWeight.SemiBold,
            Padding = new Thickness(12, 4),
        };

    private void RefreshPreview()
    {
        if (TryBuildOrder(out string encoded, out string error))
        {
            _encodedPreview.Text = "lsd " + encoded;
            _validationText.Text = string.Empty;
        }
        else
        {
            _encodedPreview.Text = "lsd " + encoded;
            _validationText.Text = error;
        }
    }

    private bool TryBuildOrder(out string encoded, out string error)
    {
        error = string.Empty;
        var fields = new List<string>(20);
        foreach (QuantityRow row in _quantityRows.Take(5))
            fields.Add(row.Encode(out error));
        if (!string.IsNullOrEmpty(error))
        {
            encoded = string.Join("@", fields);
            return false;
        }

        fields.Add(EncodeYesNo(_planetScannerChoice));

        foreach (QuantityRow row in _quantityRows.Skip(5).Take(3))
            fields.Add(row.Encode(out error));
        if (!string.IsNullOrEmpty(error))
        {
            encoded = string.Join("@", fields);
            return false;
        }

        fields.Add(EncodeLongRangeScan());

        foreach (QuantityRow row in _quantityRows.Skip(8).Take(2))
            fields.Add(row.Encode(out error));
        if (!string.IsNullOrEmpty(error))
        {
            encoded = string.Join("@", fields);
            return false;
        }

        fields.Add(EncodeYesNo(_twarpChoice));

        foreach (QuantityRow row in _quantityRows.Skip(10))
            fields.Add(row.Encode(out error));
        if (!string.IsNullOrEmpty(error))
        {
            encoded = string.Join("@", fields);
            return false;
        }

        fields.Add(EncodeTowShip(out error));
        if (!string.IsNullOrEmpty(error))
        {
            encoded = string.Join("@", fields);
            return false;
        }

        fields.Add(EncodeShipToken());
        fields.Add(EncodeShipCount(out error));
        if (!string.IsNullOrEmpty(error))
        {
            encoded = string.Join("@", fields);
            return false;
        }

        fields.Add(EncodeShipName());
        encoded = string.Join("@", fields);
        error = string.Empty;
        return true;
    }

    private string EncodeLongRangeScan()
    {
        string value = (_longRangeChoice.SelectedItem as string ?? string.Empty).Trim();
        if (string.Equals(value, "Holo", StringComparison.OrdinalIgnoreCase))
            return "H";
        if (string.Equals(value, "Density", StringComparison.OrdinalIgnoreCase))
            return "D";
        return "N";
    }

    private static string EncodeYesNo(ComboBox combo)
    {
        string value = (combo.SelectedItem as string ?? string.Empty).Trim();
        return string.Equals(value, "Yes", StringComparison.OrdinalIgnoreCase) ? "Y" : "N";
    }

    private string EncodeTowShip(out string error)
    {
        error = string.Empty;
        string value = (_towShipNumber.Text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
            return "0";
        if (!int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out int number) || number < 0)
        {
            error = "Tow ship must be a non-negative number.";
            return "0";
        }

        return number.ToString(CultureInfo.InvariantCulture);
    }

    private string EncodeShipToken()
    {
        if (_shipChoice.SelectedItem is not DockShopperShipChoice choice || string.Equals(choice.Token, "0", StringComparison.Ordinal))
            return "0";

        return choice.Token.Trim().ToUpperInvariant();
    }

    private string EncodeShipCount(out string error)
    {
        error = string.Empty;
        if (string.Equals(EncodeShipToken(), "0", StringComparison.Ordinal))
            return "0";

        string value = (_shipCount.Text ?? string.Empty).Trim();
        if (!int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out int count) || count < 1)
        {
            error = "Ship quantity must be 1 or higher.";
            return "0";
        }

        return count.ToString(CultureInfo.InvariantCulture);
    }

    private string EncodeShipName()
    {
        if (string.Equals(EncodeShipToken(), "0", StringComparison.Ordinal))
            return "0";

        string name = (_shipName.Text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            name = "LSD Ship";

        return name.Replace("@", " ").Replace('\t', ' ').Replace(" ", "@");
    }

    private async System.Threading.Tasks.Task ShowShipDetailsAsync(DockShopperShipChoice choice)
    {
        var detail = string.IsNullOrWhiteSpace(choice.Details)
            ? "No saved ship details are available yet. Run LSD once from dock to let it scan shipyard data."
            : choice.Details;

        var window = new Window
        {
            Title = $"Ship {choice.Token}",
            Width = 440,
            Height = 260,
            Background = BgWindow,
            Foreground = FgText,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Content = new Border
            {
                Background = BgPanel,
                BorderBrush = Border,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(14),
                Margin = new Thickness(14),
                Child = new StackPanel
                {
                    Spacing = 10,
                    Children =
                    {
                        new TextBlock
                        {
                            Text = choice.ToString(),
                            FontSize = 16,
                            FontWeight = FontWeight.Bold,
                            Foreground = AccentHot,
                        },
                        new TextBlock
                        {
                            Text = detail,
                            TextWrapping = TextWrapping.Wrap,
                            Foreground = FgText,
                        },
                    },
                },
            },
        };

        await window.ShowDialog(this);
    }

    private static IReadOnlyList<DockShopperShipChoice> BuildFallbackShipChoices()
    {
        var choices = new List<DockShopperShipChoice> { new("0", "None") };
        for (char token = 'A'; token <= 'Z'; token++)
            choices.Add(new DockShopperShipChoice(token.ToString(), $"Ship {token}"));
        return choices;
    }

    private sealed class QuantityRow
    {
        public QuantityRow(string name, string price, int max)
        {
            Name = name;
            Price = price;
            Max = max;
            Mode = BuildCombo(["None", "Max", "Specific"]);
            Amount = BuildSmallTextBox("0", 90);
        }

        public string Name { get; }
        public string Price { get; }
        public int Max { get; }
        public ComboBox Mode { get; }
        public TextBox Amount { get; }
        public bool IsSpecific => string.Equals(Mode.SelectedItem as string, "Specific", StringComparison.OrdinalIgnoreCase);

        public string Encode(out string error)
        {
            error = string.Empty;
            string mode = Mode.SelectedItem as string ?? "None";
            if (string.Equals(mode, "None", StringComparison.OrdinalIgnoreCase))
                return "0";
            if (string.Equals(mode, "Max", StringComparison.OrdinalIgnoreCase))
                return "M";

            string value = (Amount.Text ?? string.Empty).Trim();
            if (!int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out int number) ||
                number < 0 ||
                number > Max)
            {
                error = $"{Name} must be between 0 and {Max.ToString(CultureInfo.InvariantCulture)}.";
                return "0";
            }

            return number.ToString(CultureInfo.InvariantCulture);
        }
    }
}

internal static class DockShopperGridExtensions
{
    public static T WithGridPosition<T>(this T control, int row, int column, int rowSpan = 1, int columnSpan = 1)
        where T : Control
    {
        Grid.SetRow(control, row);
        Grid.SetColumn(control, column);
        if (rowSpan > 1)
            Grid.SetRowSpan(control, rowSpan);
        if (columnSpan > 1)
            Grid.SetColumnSpan(control, columnSpan);
        return control;
    }
}
