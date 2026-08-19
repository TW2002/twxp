using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

public sealed class QCannonCalculatorWindow : Window
{
    private const int DefaultRowCount = 5;
    private const int MinRowCount = 1;
    private const double DefaultSectorCannonPercent = 5.0;

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(6, 24, 31));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush ColAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush ColHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush ColProjection = new SolidColorBrush(Color.FromRgb(116, 239, 164));
    private static readonly IBrush ColError = new SolidColorBrush(Color.FromRgb(255, 106, 106));

    private readonly List<QCannonRow> _rows = new();
    private readonly Grid _table;
    private readonly Button _removeRowButton;
    private readonly TextBox _defaultDecayBox;
    private readonly TextBlock _statusText;
    private readonly TextBlock[] _totalTexts;

    public QCannonCalculatorWindow()
    {
        Title = "QCannon Calculator";
        Width = 980;
        Height = 580;
        MinWidth = 840;
        MinHeight = 440;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        for (int index = 0; index < DefaultRowCount; index++)
            _rows.Add(CreateRow());

        _totalTexts = Enumerable.Range(0, 5)
            .Select(_ => BuildValueText(ColHot, bold: true))
            .ToArray();

        _defaultDecayBox = BuildInputBox("5");
        _defaultDecayBox.Width = 72;
        _defaultDecayBox.TextChanged += (_, _) => Recalculate();

        _statusText = new TextBlock
        {
            Foreground = ColMuted,
            FontSize = 12,
            TextWrapping = TextWrapping.Wrap,
            Text = "Enter the two most recent cannon-hit columns. Rows with only the first hit use the sector cannon percent to estimate Hit 0.",
        };

        var clearButton = BuildActionButton("Clear", primary: false);
        clearButton.Click += (_, _) => ClearRows();

        var copyButton = BuildActionButton("Copy Summary", primary: true);
        copyButton.Click += async (_, _) =>
        {
            await ClipboardHelper.TrySetTextAsync(this, BuildCopySummary());
        };

        var closeButton = BuildActionButton("Close", primary: false);
        closeButton.Click += (_, _) => Close();

        var addRowButton = BuildRowButton("+");
        addRowButton.Click += (_, _) => AddCalculatorRow();

        _removeRowButton = BuildRowButton("-");
        _removeRowButton.Click += (_, _) => RemoveCalculatorRow();

        var rowControls = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Left,
            Spacing = 8,
            Children =
            {
                BuildLabel("Rows:"),
                _removeRowButton,
                addRowButton,
            },
        };

        var mainActions = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 10,
            Children = { clearButton, copyButton, closeButton },
        };

        var actionRow = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("Auto,*,Auto"),
            Children =
            {
                rowControls,
                mainActions,
            },
        };
        Grid.SetColumn(mainActions, 2);

        _table = BuildTable();
        var settingsRow = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("Auto,Auto,*"),
            ColumnSpacing = 10,
            Children =
            {
                BuildLabel("Default sector cannon percent:"),
                _defaultDecayBox,
                BuildFormulaText(),
            },
        };
        Grid.SetColumn(_defaultDecayBox, 1);
        Grid.SetColumn(settingsRow.Children[2], 2);

        var rootGrid = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,Auto,*,Auto"),
            RowSpacing = 14,
            Children =
            {
                BuildHeader(),
                settingsRow,
                new Border
                {
                    Background = BgPanel,
                    BorderBrush = Edge,
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(14),
                    Padding = new Thickness(12),
                    Child = new ScrollViewer
                    {
                        VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
                        Content = _table,
                    },
                },
                actionRow,
            },
        };
        Grid.SetRow(settingsRow, 1);
        Grid.SetRow(rootGrid.Children[2], 2);
        Grid.SetRow(actionRow, 3);

        Content = new Border
        {
            Background = BgWin,
            Padding = new Thickness(18),
            Child = rootGrid,
        };

        UpdateRowButtons();
        Recalculate();
    }

    private QCannonRow CreateRow()
    {
        var row = new QCannonRow(_rows.Count + 1);
        row.Previous.TextChanged += (_, _) => Recalculate();
        row.Latest.TextChanged += (_, _) => Recalculate();
        return row;
    }

    private Control BuildHeader()
    {
        var titleBlock = new StackPanel
        {
            Spacing = 4,
            Children =
            {
                new TextBlock
                {
                    Text = "QCANNON CALCULATOR",
                    Foreground = ColAccent,
                    FontSize = 25,
                    FontWeight = FontWeight.Bold,
                },
                new TextBlock
                {
                    Text = "Project the next three cannon hits from the two most recent observed hits.",
                    Foreground = ColMuted,
                    TextWrapping = TextWrapping.Wrap,
                },
            },
        };
        Grid.SetColumn(titleBlock, 0);
        Grid.SetColumn(_statusText, 1);

        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(18, 14),
            Child = new Grid
            {
                ColumnDefinitions = new ColumnDefinitions("*,Auto"),
                Children =
                {
                    titleBlock,
                    _statusText,
                },
            },
        };
    }

    private Grid BuildTable()
    {
        var table = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("52,132,132,132,132,132,100"),
            ColumnSpacing = 8,
            RowSpacing = 8,
            MinWidth = 850,
        };

        PopulateTable(table);
        return table;
    }

    private void RebuildTable()
    {
        PopulateTable(_table);
        UpdateRowButtons();
    }

    private void PopulateTable(Grid table)
    {
        DetachTableChildren(table);
        table.Children.Clear();
        table.RowDefinitions = new RowDefinitions(string.Join(',', Enumerable.Repeat("Auto", _rows.Count + 2)));

        AddHeader(table, 0, "#");
        AddHeader(table, 1, "Hit -1");
        AddHeader(table, 2, "Hit 0");
        AddHeader(table, 3, "Next +1");
        AddHeader(table, 4, "Next +2");
        AddHeader(table, 5, "Next +3");
        AddHeader(table, 6, "Ratio");

        for (int i = 0; i < _rows.Count; i++)
            AddRow(table, i + 1, _rows[i]);

        int totalRow = _rows.Count + 1;
        AddCell(table, totalRow, 0, BuildValueText("Total", ColAccent, bold: true), BgCard);
        for (int i = 0; i < _totalTexts.Length; i++)
            AddCell(table, totalRow, i + 1, _totalTexts[i], BgCard);
        AddCell(table, totalRow, 6, BuildValueText("--", ColMuted), BgCard);
    }

    private static void DetachTableChildren(Grid table)
    {
        foreach (Border border in table.Children.OfType<Border>())
            border.Child = null;
    }

    private void AddRow(Grid table, int rowIndex, QCannonRow row)
    {
        AddCell(table, rowIndex, 0, BuildValueText(row.Index.ToString(CultureInfo.InvariantCulture), ColMuted), BgCard);
        AddCell(table, rowIndex, 1, row.Previous, BgInput);
        AddCell(table, rowIndex, 2, row.Latest, BgInput);
        AddCell(table, rowIndex, 3, row.Next1, BgCard);
        AddCell(table, rowIndex, 4, row.Next2, BgCard);
        AddCell(table, rowIndex, 5, row.Next3, BgCard);
        AddCell(table, rowIndex, 6, row.Ratio, BgCard);
    }

    private static void AddHeader(Grid table, int column, string text)
        => AddCell(table, 0, column, BuildValueText(text, ColAccent, bold: true), BgCard);

    private static void AddCell(Grid table, int row, int column, Control child, IBrush background)
    {
        var border = new Border
        {
            Background = background,
            BorderBrush = InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(6),
            Child = child,
        };
        Grid.SetRow(border, row);
        Grid.SetColumn(border, column);
        table.Children.Add(border);
    }

    private void Recalculate()
    {
        double fallbackRatio = ReadDefaultSectorCannonRatio();
        double[] totals = new double[5];
        int activeRows = 0;
        int invalidRows = 0;

        foreach (QCannonRow row in _rows)
        {
            double? previous = TryReadDamage(row.Previous.Text);
            double? latest = TryReadDamage(row.Latest.Text);

            row.ClearOutputs();
            if (previous == null && latest == null)
                continue;

            if (previous is null or <= 0)
            {
                row.Ratio.Text = "need -1";
                row.Ratio.Foreground = ColError;
                invalidRows++;
                if (latest.GetValueOrDefault() > 0)
                    totals[1] += latest.GetValueOrDefault();
                continue;
            }

            double previousValue = previous.Value;
            double observedLatest;
            bool assumedLatest = latest is null or <= 0;
            if (assumedLatest)
                observedLatest = previousValue * fallbackRatio;
            else
                observedLatest = latest.GetValueOrDefault();

            double ratio = observedLatest / previousValue;
            double next1 = observedLatest * ratio;
            double next2 = next1 * ratio;
            double next3 = next2 * ratio;

            row.Next1.Text = FormatDamage(next1);
            row.Next2.Text = FormatDamage(next2);
            row.Next3.Text = FormatDamage(next3);
            row.Ratio.Text = $"{ratio:P1}{(assumedLatest ? "*" : string.Empty)}";
            row.Ratio.Foreground = ratio > 1.0 ? ColHot : ColProjection;

            totals[0] += previousValue;
            totals[1] += observedLatest;
            totals[2] += next1;
            totals[3] += next2;
            totals[4] += next3;
            activeRows++;
        }

        for (int i = 0; i < _totalTexts.Length; i++)
            _totalTexts[i].Text = totals[i] > 0 ? FormatDamage(totals[i]) : "--";

        _statusText.Text = invalidRows > 0
            ? $"{activeRows} row(s) projected; {invalidRows} row(s) need a valid Hit -1 value."
            : $"{activeRows} row(s) projected. A ratio marked * used the sector cannon percent.";
        _statusText.Foreground = invalidRows > 0 ? ColError : ColMuted;
    }

    private void ClearRows()
    {
        foreach (QCannonRow row in _rows)
        {
            row.Previous.Text = string.Empty;
            row.Latest.Text = string.Empty;
        }

        Recalculate();
    }

    private void AddCalculatorRow()
    {
        _rows.Add(CreateRow());
        RebuildTable();
        Recalculate();
    }

    private void RemoveCalculatorRow()
    {
        if (_rows.Count <= MinRowCount)
            return;

        _rows.RemoveAt(_rows.Count - 1);
        RebuildTable();
        Recalculate();
    }

    private void UpdateRowButtons()
        => _removeRowButton.IsEnabled = _rows.Count > MinRowCount;

    private string BuildCopySummary()
    {
        return string.Join(Environment.NewLine, new[]
        {
            "QCannon Calculator",
            $"Hit -1 total: {_totalTexts[0].Text}",
            $"Hit 0 total: {_totalTexts[1].Text}",
            $"Next +1 total: {_totalTexts[2].Text}",
            $"Next +2 total: {_totalTexts[3].Text}",
            $"Next +3 total: {_totalTexts[4].Text}",
        });
    }

    private double ReadDefaultSectorCannonRatio()
    {
        if (!double.TryParse((_defaultDecayBox.Text ?? string.Empty).Trim().TrimEnd('%'), NumberStyles.Float, CultureInfo.InvariantCulture, out double value))
            value = DefaultSectorCannonPercent;

        double percent = Math.Clamp(value, 0.0, 100.0);
        return 1.0 - (percent / 100.0);
    }

    private static double? TryReadDamage(string? text)
    {
        string normalized = (text ?? string.Empty).Trim().Replace(",", string.Empty, StringComparison.Ordinal);
        return double.TryParse(normalized, NumberStyles.Float, CultureInfo.InvariantCulture, out double value)
            ? value
            : null;
    }

    private static string FormatDamage(double value)
        => Math.Round(value, MidpointRounding.AwayFromZero).ToString("N0", CultureInfo.InvariantCulture);

    private static TextBox BuildInputBox(string text = "")
    {
        return new TextBox
        {
            Text = text,
            Background = BgInput,
            Foreground = ColText,
            BorderBrush = Edge,
            HorizontalContentAlignment = HorizontalAlignment.Right,
            VerticalContentAlignment = VerticalAlignment.Center,
            FontSize = 15,
            Padding = new Thickness(8, 3),
        };
    }

    private static TextBlock BuildValueText(string text, IBrush foreground, bool bold = false)
    {
        return new TextBlock
        {
            Text = text,
            Foreground = foreground,
            FontSize = 15,
            FontWeight = bold ? FontWeight.Bold : FontWeight.Normal,
            TextAlignment = TextAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private static TextBlock BuildValueText(IBrush foreground, bool bold = false)
        => BuildValueText("--", foreground, bold);

    private static TextBlock BuildFormulaText()
    {
        return new TextBlock
        {
            Text = "Blank Hit 0: Hit 0 = Hit -1 x (1 - cannon% / 100). Then next = latest x (latest / previous).",
            Foreground = ColMuted,
            FontSize = 12,
            TextWrapping = TextWrapping.Wrap,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private static TextBlock BuildLabel(string text)
    {
        return new TextBlock
        {
            Text = text,
            Foreground = ColText,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    private static Button BuildActionButton(string text, bool primary)
    {
        return new Button
        {
            Content = text,
            Background = primary ? ColAccent : BgCard,
            Foreground = primary ? Brushes.Black : ColText,
            BorderBrush = primary ? ColAccent : Edge,
            Padding = new Thickness(16, 6),
            MinWidth = 96,
        };
    }

    private static Button BuildRowButton(string text)
    {
        return new Button
        {
            Content = text,
            Background = BgCard,
            Foreground = ColText,
            BorderBrush = Edge,
            Padding = new Thickness(10, 4),
            MinWidth = 42,
        };
    }

    private sealed class QCannonRow
    {
        public QCannonRow(int index)
        {
            Index = index;
            Previous = BuildInputBox();
            Latest = BuildInputBox();
            Next1 = BuildValueText(ColProjection);
            Next2 = BuildValueText(ColProjection);
            Next3 = BuildValueText(ColProjection);
            Ratio = BuildValueText(ColMuted);
        }

        public int Index { get; }
        public TextBox Previous { get; }
        public TextBox Latest { get; }
        public TextBlock Next1 { get; }
        public TextBlock Next2 { get; }
        public TextBlock Next3 { get; }
        public TextBlock Ratio { get; }

        public void ClearOutputs()
        {
            Next1.Text = "--";
            Next2.Text = "--";
            Next3.Text = "--";
            Ratio.Text = "--";
            Ratio.Foreground = ColMuted;
        }
    }
}
