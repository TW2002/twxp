using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private Control BuildSidebar()
    {
        var stack = new StackPanel
        {
            Background  = Brushes.Transparent,
            Orientation = Orientation.Vertical,
            Margin      = new Thickness(0, 0, 0, 0),
        };

        foreach (AppPreferences.StatusPanelSectionPreference section in _appPrefs.GetOrderedStatusPanelSections())
        {
            if (!section.Visible)
                continue;

            switch (section.Id)
            {
                case AppPreferences.StatusPanelTrader:
                    stack.Children.Add(BuildTraderInfoPanel());
                    break;
                case AppPreferences.StatusPanelOnline:
                    stack.Children.Add(BuildOnlinePanel());
                    break;
                case AppPreferences.StatusPanelShipInfo:
                    stack.Children.Add(BuildShipInfoPanel());
                    break;
            }
        }

        var scroll = new ScrollViewer
        {
            VerticalScrollBarVisibility   = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
            Content = stack,
        };

        // Wrap in a border that gives a raised look against the gray chrome
        var outer = new Border
        {
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1.4),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(2),
            Child = new Border
            {
                Background = HudFrameAlt,
                BorderBrush = HudInnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                Child = scroll,
            },
        };

        return outer;
    }

    private bool HasVisibleStatusPanelSections()
        => _appPrefs.GetOrderedStatusPanelSections().Any(section => section.Visible);

    private Control BuildTraderInfoPanel()
    {
        var panel = new StackPanel
        {
            Background = Brushes.Transparent,
            Orientation = Orientation.Vertical,
            Margin = new Thickness(0, 0, 0, 3),
        };

        _valName.Foreground = HudText;
        _valName.FontSize = 14;
        _valName.FontWeight = FontWeight.SemiBold;
        _valName.TextAlignment = TextAlignment.Right;
        _valName.TextTrimming = TextTrimming.CharacterEllipsis;
        _valName.TextWrapping = TextWrapping.NoWrap;
        _valName.MinWidth = 0;
        _valName.HorizontalAlignment = HorizontalAlignment.Stretch;
        _valName.VerticalAlignment = VerticalAlignment.Center;
        _valName.Margin = new Thickness(0, 0, 10, 0);

        var headerGrid = new Grid();
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(8) });
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

        var headerTitle = new TextBlock
        {
            Text = "Trader",
            Foreground = HudAccent,
            FontFamily = HudTitleFont,
            FontSize = 14,
            FontWeight = Avalonia.Media.FontWeight.SemiBold,
            Margin = new Thickness(10, 6, 0, 6),
            VerticalAlignment = VerticalAlignment.Center,
        };

        Grid.SetColumn(headerTitle, 0);
        Grid.SetColumn(_valName, 2);
        headerGrid.Children.Add(headerTitle);
        headerGrid.Children.Add(_valName);

        panel.Children.Add(new Border
        {
            Background = HudHeader,
            Child = headerGrid,
        });

        panel.Children.Add(new Border
        {
            Background = HudInnerEdge,
            Height = 1,
            Margin = new Thickness(0),
        });

        _sectorBustIndicator = new Border
        {
            Background = HudBustBg,
            BorderBrush = HudAccentWarn,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(3),
            Padding = new Thickness(6, 1),
            Margin = new Thickness(0, 0, 6, 0),
            IsVisible = false,
            Child = new TextBlock
            {
                Text = "BUST",
                Foreground = Brushes.White,
                FontSize = 10,
                FontWeight = FontWeight.Bold,
                VerticalAlignment = VerticalAlignment.Center,
            },
        };

        var sectorValueHost = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Right,
            Children = { _sectorBustIndicator, _valSector },
        };
        panel.Children.Add(BuildPanelRow("Sector", sectorValueHost, _valSector));
        panel.Children.Add(BuildPanelRow("Turns", _valTurns));
        panel.Children.Add(BuildPanelRow("Exper.", _valExper));
        panel.Children.Add(BuildPanelRow("Alignm.", _valAlignm));
        panel.Children.Add(BuildPanelRow("Cred.", _valCred));

        panel.Children.Add(new Border { Height = 8 });
        return new Border
        {
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1.4),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(2),
            Margin = new Thickness(0, 0, 0, 3),
            Child = new Border
            {
                Background = HudFrameAlt,
                BorderBrush = HudInnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                Child = panel,
            },
        };
    }

    private Control BuildOnlinePanel()
    {
        var panel = new StackPanel
        {
            Background = Brushes.Transparent,
            Orientation = Orientation.Vertical,
            Margin = new Thickness(0, 0, 0, 3),
        };

        panel.Children.Add(new Border
        {
            Background = HudHeader,
            Child = new TextBlock
            {
                Text = "Online",
                Foreground = HudAccent,
                FontFamily = HudTitleFont,
                FontSize = 14,
                FontWeight = FontWeight.SemiBold,
                Margin = new Thickness(10, 6, 8, 6),
                VerticalAlignment = VerticalAlignment.Center,
            },
        });

        panel.Children.Add(new Border
        {
            Background = HudInnerEdge,
            Height = 1,
            Margin = new Thickness(0),
        });

        _onlinePlayersHost = new StackPanel
        {
            Spacing = 3,
        };

        panel.Children.Add(new ScrollViewer
        {
            Margin = new Thickness(10, 8, 10, 6),
            Height = 48,
            VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
            Content = _onlinePlayersHost,
        });
        panel.Children.Add(new Border { Height = 4 });

        RefreshOnlinePanel();

        return new Border
        {
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1.4),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(2),
            Margin = new Thickness(0, 0, 0, 3),
            Child = new Border
            {
                Background = HudFrameAlt,
                BorderBrush = HudInnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                Child = panel,
            },
        };
    }

    private Control BuildHoldsPanel()
    {
        _valHTotal.Foreground = HudText;
        _valHTotal.FontSize = 14;
        _valHTotal.FontWeight = FontWeight.SemiBold;
        _valHTotal.VerticalAlignment = VerticalAlignment.Center;
        _valHTotal.Margin = new Thickness(0, 0, 6, 0);

        var headerGrid = new Grid();
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var headerTitle = new TextBlock
        {
            Text = "Holds",
            Foreground = HudAccent,
            FontFamily = HudTitleFont,
            FontSize = 14,
            FontWeight = FontWeight.SemiBold,
            Margin = new Thickness(10, 6, 8, 6),
        };

        Grid.SetColumn(headerTitle, 0);
        Grid.SetColumn(_valHTotal, 1);
        headerGrid.Children.Add(headerTitle);
        headerGrid.Children.Add(_valHTotal);

        var panel = new StackPanel
        {
            Background = Brushes.Transparent,
            Orientation = Orientation.Vertical,
            Margin = new Thickness(0, 0, 0, 3),
            Children =
            {
                new Border
                {
                    Background = HudHeader,
                    Child = headerGrid,
                },
                new Border
                {
                    Background = HudInnerEdge,
                    Height = 1,
                    Margin = new Thickness(0),
                },
                BuildHoldsStackedBar(),
                BuildHoldsLegendCompact(),
                new Border { Height = 4 },
            },
        };

        return new Border
        {
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1.4),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(2),
            Margin = new Thickness(0, 0, 0, 3),
            Child = new Border
            {
                Background = HudFrameAlt,
                BorderBrush = HudInnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                Child = panel,
            },
        };
    }

    private Control BuildHoldsStackedBar(Thickness? margin = null, double height = 14)
    {
        _holdsFuelOreColumn = new ColumnDefinition { Width = new GridLength(0, GridUnitType.Star) };
        _holdsOrganicsColumn = new ColumnDefinition { Width = new GridLength(0, GridUnitType.Star) };
        _holdsEquipmentColumn = new ColumnDefinition { Width = new GridLength(0, GridUnitType.Star) };
        _holdsColonistsColumn = new ColumnDefinition { Width = new GridLength(0, GridUnitType.Star) };
        _holdsEmptyColumn = new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) };

        var segments = new Grid
        {
            ColumnDefinitions =
            {
                _holdsFuelOreColumn,
                _holdsOrganicsColumn,
                _holdsEquipmentColumn,
                _holdsColonistsColumn,
                _holdsEmptyColumn,
            },
            ClipToBounds = true,
        };

        _holdsFuelOreSegment = AddHoldsSegment(segments, HoldsOreBrush, 0);
        _holdsOrganicsSegment = AddHoldsSegment(segments, HoldsOrgBrush, 1);
        _holdsEquipmentSegment = AddHoldsSegment(segments, HoldsEqBrush, 2);
        _holdsColonistsSegment = AddHoldsSegment(segments, HoldsColsBrush, 3);
        _holdsEmptySegment = AddHoldsSegment(segments, HoldsFreeBrush, 4);

        return new Border
        {
            Margin = margin ?? new Thickness(10, 8, 10, 3),
            Height = height,
            Background = HudStatus,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(1),
            Child = segments,
        };
    }

    private static Border AddHoldsSegment(Grid grid, IBrush brush, int column)
    {
        var segment = new Border
        {
            Background = brush,
        };
        Grid.SetColumn(segment, column);
        grid.Children.Add(segment);
        return segment;
    }

    private Control BuildHoldsLegendCompact(Thickness? margin = null, double itemSpacing = 12, double fontSize = 11)
    {
        var legend = new WrapPanel
        {
            Orientation = Orientation.Horizontal,
            Margin = margin ?? new Thickness(10, 0, 10, 0),
        };
        legend.Children.Add(BuildHoldsLegendItem("Ore", HoldsOreBrush, itemSpacing, fontSize));
        legend.Children.Add(BuildHoldsLegendItem("Org", HoldsOrgBrush, itemSpacing, fontSize));
        legend.Children.Add(BuildHoldsLegendItem("Equ", HoldsEqBrush, itemSpacing, fontSize));
        legend.Children.Add(BuildHoldsLegendItem("Colo", HoldsColsBrush, itemSpacing, fontSize));
        legend.Children.Add(BuildHoldsLegendItem("Free", HoldsFreeBrush, itemSpacing, fontSize));
        return legend;
    }

    private Control BuildHoldsLegendItem(string label, IBrush chipBrush, double itemSpacing, double fontSize)
    {
        var row = new Grid
        {
            Margin = new Thickness(0, 1, itemSpacing, 1),
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(new GridLength(3)),
                new ColumnDefinition(GridLength.Auto),
            },
            Children =
            {
                BuildLegendSwatch(chipBrush),
                new TextBlock
                {
                    Text = label,
                    Foreground = HudMuted,
                    FontSize = fontSize,
                    FontWeight = FontWeight.SemiBold,
                    VerticalAlignment = VerticalAlignment.Center,
                },
            },
        };

        Grid.SetColumn(row.Children[0], 0);
        Grid.SetColumn(row.Children[1], 2);
        return row;
    }

    private static Control BuildLegendSwatch(IBrush brush)
    {
        return new Border
        {
            Width = 10,
            Height = 10,
            CornerRadius = new CornerRadius(2),
            Background = brush,
            VerticalAlignment = VerticalAlignment.Center,
        };
    }

    // ── Expanded Ship Info panel ───────────────────────────────────────────

    private Control BuildShipInfoPanel()
    {
        var panel = new StackPanel { Background = Brushes.Transparent, Orientation = Orientation.Vertical, Margin = new Thickness(0, 0, 0, 3) };

        _shipInfoHeaderText.Text = "Ship Info";
        _shipInfoHeaderText.Foreground = HudAccent;
        _shipInfoHeaderText.FontFamily = HudTitleFont;
        _shipInfoHeaderText.FontSize = 14;
        _shipInfoHeaderText.FontWeight = Avalonia.Media.FontWeight.SemiBold;
        _shipInfoHeaderText.Margin = new Thickness(10, 6, 8, 6);
        _shipInfoHeaderText.TextTrimming = TextTrimming.CharacterEllipsis;
        _shipInfoHeaderText.MaxLines = 1;

        // Title header
        panel.Children.Add(new Border
        {
            Background = HudHeader,
            Child = _shipInfoHeaderText,
        });
        panel.Children.Add(new Border { Background = HudInnerEdge, Height = 1 });

        // Full-width rows: Fighters and Shields only. TPW lives in the compact grid.
        foreach (var (key, tb) in new (string, TextBlock)[] {
            ("Fighters",   _valFighters),
            ("Shields",    _valShields),
        })
        {
            panel.Children.Add(BuildShipInfoSummaryRow(key, tb));
        }

        panel.Children.Add(new Border { Background = HudInnerEdge, Height = 1, Margin = new Thickness(0, 2, 0, 1) });
        panel.Children.Add(BuildShipInfoHoldsSection());

        // Divider before compact equipment rows
        panel.Children.Add(new Border { Background = HudInnerEdge, Height = 1, Margin = new Thickness(0, 2, 0, 1) });

        // Compact equipment grid: three columns fit the standard sidebar width
        // if each cell is treated as a tight fixed slot for label + 3-digit value.
        panel.Children.Add(BuildShipInfoCompactGrid());

        // Divider before scanners
        panel.Children.Add(new Border { Background = HudInnerEdge, Height = 1, Margin = new Thickness(0, 2, 0, 1) });

        // Scanner indicators
        panel.Children.Add(BuildScannerRow());
        panel.Children.Add(new Border { Height = 8 });

        return new Border
        {
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1.4),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(2),
            Margin = new Thickness(0, 0, 0, 3),
            Child = new Border
            {
                Background = HudFrameAlt,
                BorderBrush = HudInnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                Child = panel,
            },
        };
    }

    private Control BuildShipInfoHoldsSection()
    {
        _valHTotal.Foreground = HudText;
        _valHTotal.FontSize = 11;
        _valHTotal.FontWeight = FontWeight.SemiBold;
        _valHTotal.VerticalAlignment = VerticalAlignment.Center;
        _valHTotal.Margin = new Thickness(0, 0, 4, 0);

        var header = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                new ColumnDefinition { Width = GridLength.Auto },
            },
        };

        var title = new TextBlock
        {
            Text = "Holds",
            Foreground = HudMuted,
            FontSize = 11,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };

        Grid.SetColumn(title, 0);
        Grid.SetColumn(_valHTotal, 1);
        header.Children.Add(title);
        header.Children.Add(_valHTotal);

        return new Border
        {
            Background = HudFrame,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(5, 4, 5, 4),
            Margin = new Thickness(6, 2, 6, 1),
            Child = new StackPanel
            {
                Orientation = Orientation.Vertical,
                Children =
                {
                    header,
                    BuildHoldsStackedBar(new Thickness(0, 5, 0, 2), 12),
                    BuildHoldsLegendCompact(new Thickness(0, 0, 0, 0), 8, 10),
                },
            },
        };
    }

    private Control BuildShipInfoCompactGrid()
    {
        var items = new (string Label, TextBlock Value)[]
        {
            ("Ethr", _valEther),
            ("Bea",  _valBeacon),
            ("Disr", _valDisruptor),
            ("Pho",  _valPhoton),
            ("Arm",  _valArmid),
            ("Lim",  _valLimpet),
            ("Gen",  _valGenesis),
            ("Ato",  _valAtomic),
            ("Corb", _valCorbo),
            ("Clo",  _valCloak),
            ("TPW",  _valTrnWarp),
        };

        const int columnCount = 3;
        int rowCount = (items.Length + columnCount - 1) / columnCount;

        var grid = new Grid
        {
            Margin = new Thickness(4, 1, 4, 1),
        };

        for (int column = 0; column < columnCount; column++)
        {
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            if (column < columnCount - 1)
                grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(3) });
        }

        for (int row = 0; row < rowCount; row++)
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

        for (int index = 0; index < items.Length; index++)
        {
            int row = index / columnCount;
            int column = index % columnCount;
            Control cell = BuildShipInfoCompactCell(items[index].Label, items[index].Value);
            Grid.SetRow(cell, row);
            Grid.SetColumn(cell, column * 2);
            grid.Children.Add(cell);
        }

        return grid;
    }

    private Control BuildShipInfoCompactCell(string key, TextBlock valTb)
    {
        valTb.Text = "0";
        valTb.Foreground = HudText;
        valTb.FontSize = 10;
        valTb.FontWeight = FontWeight.SemiBold;
        valTb.FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");
        valTb.TextAlignment = TextAlignment.Right;
        valTb.TextWrapping = TextWrapping.NoWrap;
        valTb.MinWidth = 0;
        valTb.VerticalAlignment = VerticalAlignment.Center;

        var keyTb = new TextBlock
        {
            Text = key,
            Foreground = HudMuted,
            FontSize = 10,
            TextWrapping = TextWrapping.NoWrap,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var cellGrid = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = new GridLength(3) },
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
            },
        };

        Control valueWell = BuildShipInfoCompactValueWell(valTb);

        Grid.SetColumn(keyTb, 0);
        Grid.SetColumn(valueWell, 2);
        cellGrid.Children.Add(keyTb);
        cellGrid.Children.Add(valueWell);

        return new Border
        {
            Background = HudHeaderAlt,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(2, 2, 2, 2),
            Margin = new Thickness(0, 1, 0, 0),
            Child = cellGrid,
        };
    }

    private Control BuildShipInfoSummaryRow(string key, TextBlock valTb)
    {
        valTb.Text = "-";
        valTb.Foreground = HudText;
        valTb.FontSize = 12;
        valTb.FontWeight = FontWeight.SemiBold;
        valTb.FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");
        valTb.TextAlignment = TextAlignment.Right;
        valTb.TextWrapping = TextWrapping.NoWrap;
        valTb.MinWidth = 60;
        valTb.VerticalAlignment = VerticalAlignment.Center;

        var keyTb = new TextBlock
        {
            Text = key,
            Foreground = HudMuted,
            FontSize = 12,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var row = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                new ColumnDefinition { Width = GridLength.Auto },
            },
        };

        Control valueWell = BuildShipInfoValueWell(valTb, UiSize(60), UiThickness(5, 1, 5, 1));

        Grid.SetColumn(keyTb, 0);
        Grid.SetColumn(valueWell, 1);
        row.Children.Add(keyTb);
        row.Children.Add(valueWell);

        return new Border
        {
            Background = HudFrame,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(5, 1, 5, 1),
            Margin = new Thickness(6, 2, 6, 1),
            Child = row,
        };
    }

    private Control BuildShipInfoValueWell(TextBlock valueText, double minWidth, Thickness padding)
    {
        valueText.MinWidth = minWidth;

        return new Border
        {
            Background = HudInset,
            BorderBrush = HudInsetEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(3),
            Padding = new Thickness(1),
            Child = new Border
            {
                Background = Brushes.Black,
                BorderBrush = HudStatus,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(2),
                Padding = padding,
                Child = valueText,
            },
        };
    }

    private Control BuildShipInfoCompactValueWell(TextBlock valueText)
    {
        valueText.HorizontalAlignment = HorizontalAlignment.Stretch;

        return new Border
        {
            Width = UiSize(30),
            HorizontalAlignment = HorizontalAlignment.Right,
            Background = HudInset,
            BorderBrush = HudInsetEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(3),
            Padding = new Thickness(1),
            Child = new Border
            {
                Background = Brushes.Black,
                BorderBrush = HudStatus,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(2),
                Padding = new Thickness(1, 1, 1, 1),
                Child = valueText,
            },
        };
    }

    private Control BuildScannerRow()
    {
        Border MakeScanInd(string label, double width) => new Border
        {
            Width = UiSize(width), Height = UiSize(18), CornerRadius = UiCornerRadius(2),
            Background = HudHeaderAlt, Margin = UiThickness(2, 0, 2, 0),
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            Child = new TextBlock
            {
                Text = label, FontSize = 11, FontWeight = Avalonia.Media.FontWeight.Bold,
                Foreground = HudMuted,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = UiThickness(2, 1, 2, 1),
            },
        };
        _scanIndTW1 = MakeScanInd("TW1", 28);
        _scanIndTW2 = MakeScanInd("TW2", 28);
        _scanIndD = MakeScanInd("D", 20);
        _scanIndH = MakeScanInd("H", 20);
        _scanIndP = MakeScanInd("P", 20);
        var indicators = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Left,
        };
        indicators.Children.Add(_scanIndTW1);
        indicators.Children.Add(_scanIndTW2);
        indicators.Children.Add(_scanIndD);
        indicators.Children.Add(_scanIndH);
        indicators.Children.Add(_scanIndP);
        return new Border
        {
            Margin = new Thickness(6, 2, 6, 3),
            Child = indicators,
        };
    }

    private Button CreateMacroControlButton(string glyph, string toolTip, bool deckSkin, Action onClick, bool compact = false)
    {
        var button = new Button
        {
            Content = glyph,
            Width = UiSize(compact ? 22 : deckSkin ? 34 : 30),
            Height = UiSize(compact ? 18 : deckSkin ? 30 : 26),
            Padding = Thickness.Parse("0"),
            FontSize = glyph == "●"
                ? (compact ? 14 : deckSkin ? 22 : 20)
                : (compact ? 11 : deckSkin ? 18 : 16),
            FontWeight = FontWeight.SemiBold,
            Background = Brushes.Transparent,
            BorderBrush = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Focusable = false,
            Foreground = HudMuted,
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            CornerRadius = new CornerRadius(999),
        };

        ToolTip.SetTip(button, toolTip);
        button.Click += (_, _) =>
        {
            ExecuteInActiveMtcTabSession(() =>
            {
                onClick();
                PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
            });
        };
        return button;
    }

    private Button CreateQuickMacroPlayButton(bool deckSkin, bool compact = false)
    {
        var button = CreateMacroControlButton(
            "▶",
            "Open Quick Macro Player / play once when open",
            deckSkin,
            OnQuickMacroPlayButtonClicked,
            compact);
        return button;
    }

    private void OnQuickMacroPlayButtonClicked()
    {
        _ = IsActiveQuickMacroOverlayVisible()
            ? PlaySavedQuickMacroOnceAsync()
            : OpenQuickMacroWindowAsync();
    }

    private Control BuildStatusMacroBox()
    {
        Button recordButton = CreateMacroControlButton("●", "Record Quick Macro", deckSkin: false, StartTemporaryMacroRecording, compact: true);
        Button stopButton = CreateMacroControlButton("■", "Stop Recording", deckSkin: false, StopTemporaryMacroRecording, compact: true);
        Button playButton = CreateQuickMacroPlayButton(deckSkin: false, compact: true);

        _macroRecordButton = recordButton;
        _macroStopButton = stopButton;
        _macroPlayButton = playButton;

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = UiSize(2),
            VerticalAlignment = VerticalAlignment.Center,
            Children = { recordButton, stopButton, playButton },
        };

        UpdateTemporaryMacroControls();

        return new Border
        {
            Background = HudHeaderAlt,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = UiCornerRadius(8),
            Padding = UiThickness(6, 2, 6, 2),
            VerticalAlignment = VerticalAlignment.Center,
            Child = buttons,
        };
    }

    private Control BuildMacroRow(bool deckSkin)
    {
        Button recordButton = CreateMacroControlButton("●", "Record Quick Macro", deckSkin, StartTemporaryMacroRecording);
        Button stopButton = CreateMacroControlButton("■", "Stop Recording", deckSkin, StopTemporaryMacroRecording);
        Button playButton = CreateQuickMacroPlayButton(deckSkin);

        if (deckSkin)
        {
            _deckMacroRecordButton = recordButton;
            _deckMacroStopButton = stopButton;
            _deckMacroPlayButton = playButton;
        }
        else
        {
            _macroRecordButton = recordButton;
            _macroStopButton = stopButton;
            _macroPlayButton = playButton;
        }

        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = UiSize(deckSkin ? 6 : 5),
            VerticalAlignment = VerticalAlignment.Center,
            Margin = deckSkin ? UiThickness(0, 2, 0, 3) : UiThickness(6, 2, 6, 3),
            Children = { recordButton, stopButton, playButton },
        };

        UpdateTemporaryMacroControls();
        return buttons;
    }

    private Control BuildDeckScannerRow()
    {
        Border MakeScanInd(string label, double width) => new Border
        {
            Width = UiSize(width),
            Height = UiSize(20),
            CornerRadius = UiCornerRadius(6),
            Background = HudHeaderAlt,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            Margin = UiThickness(2, 0, 2, 0),
            Child = new TextBlock
            {
                Text = label,
                FontSize = 11,
                FontWeight = FontWeight.Bold,
                Foreground = HudMuted,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
            },
        };

        _deckScanIndTW1 = MakeScanInd("TW1", 36);
        _deckScanIndTW2 = MakeScanInd("TW2", 36);
        _deckScanIndD = MakeScanInd("D", 24);
        _deckScanIndH = MakeScanInd("H", 24);
        _deckScanIndP = MakeScanInd("P", 24);

        var indicators = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Right,
            Children = { _deckScanIndTW1, _deckScanIndTW2, _deckScanIndD, _deckScanIndH, _deckScanIndP },
        };

        return new Border
        {
            Margin = new Thickness(0, 2, 0, 3),
            Child = indicators,
        };
    }

}
