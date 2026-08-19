using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Core = TWXProxy.Core;

namespace MTC;

internal sealed class AliensWindow : Window
{
    private sealed record AlienSectorRow(int Sector, string Constellation);
    private sealed record AlienGroup(string Name, string Race, IReadOnlyList<AlienSectorRow> Sectors);

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgCardAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush ColAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush ColAccentHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush ColWarning = new SolidColorBrush(Color.FromRgb(255, 106, 133));

    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly TextBlock _summaryText;
    private readonly StackPanel _groupsHost;

    public AliensWindow(Func<Core.ModDatabase?> getDb)
    {
        _getDb = getDb;

        Title = "Aliens";
        Width = 880;
        Height = 680;
        MinWidth = 700;
        MinHeight = 460;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _summaryText = new TextBlock
        {
            Foreground = ColMuted,
            FontSize = 12,
            TextWrapping = TextWrapping.Wrap,
        };

        _groupsHost = new StackPanel { Spacing = 12 };

        var refreshButton = BuildActionButton("Refresh", primary: true);
        refreshButton.Click += (_, _) => RefreshAliens();

        var closeButton = BuildActionButton("Close", primary: false);
        closeButton.Click += (_, _) => Close();

        var actionRow = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 10,
            Children = { refreshButton, closeButton },
        };

        var scroll = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Content = _groupsHost,
        };

        Control header = BuildHeader();
        Control summaryPanel = BuildSummaryPanel();
        var rootGrid = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,Auto,*,Auto"),
            RowSpacing = 14,
            Children =
            {
                header,
                summaryPanel,
                scroll,
                actionRow,
            },
        };
        Grid.SetRow(summaryPanel, 1);
        Grid.SetRow(scroll, 2);
        Grid.SetRow(actionRow, 3);

        Content = new Border
        {
            Background = BgWin,
            Padding = new Thickness(18),
            Child = rootGrid,
        };

        Opened += (_, _) => RefreshAliens();
    }

    private Control BuildHeader()
    {
        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(18, 14),
            Child = new StackPanel
            {
                Spacing = 4,
                Children =
                {
                    new TextBlock
                    {
                        Text = "ALIENS",
                        Foreground = ColAccent,
                        FontSize = 26,
                        FontWeight = FontWeight.Bold,
                    },
                    new TextBlock
                    {
                        Text = "Display alien sectors for known races.",
                        Foreground = ColMuted,
                        FontSize = 12,
                    },
                },
            },
        };
    }

    private Control BuildSummaryPanel()
    {
        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(14),
            Padding = new Thickness(14, 10),
            Child = _summaryText,
        };
    }

    private static Button BuildActionButton(string label, bool primary)
    {
        return new Button
        {
            Content = label,
            Padding = new Thickness(16, 8),
            Background = primary ? ColAccent : BgCardAlt,
            BorderBrush = primary ? ColAccentHot : Edge,
            BorderThickness = new Thickness(1.5),
            Foreground = primary ? BgWin : ColText,
            CornerRadius = new CornerRadius(12),
            FontWeight = FontWeight.SemiBold,
            MinWidth = 120,
        };
    }

    private void RefreshAliens()
    {
        _groupsHost.Children.Clear();

        Core.ModDatabase? db = _getDb();
        if (db == null)
        {
            _summaryText.Text = "No database is currently open.";
            _groupsHost.Children.Add(BuildEmptyCard(
                "No active game database",
                "Connect or open a game first, then refresh this view."));
            return;
        }

        int totalSectors = db.DBHeader.Sectors > 0 ? db.DBHeader.Sectors : db.MaxSectorSeen;
        if (totalSectors <= 0)
        {
            _summaryText.Text = $"Database: {FormatDatabaseName(db)} | No sector count is available.";
            _groupsHost.Children.Add(BuildEmptyCard(
                "No sectors available",
                "The alien-space scan needs a sized database."));
            return;
        }

        IReadOnlyList<AlienGroup> groups = BuildAlienGroups(db, totalSectors);
        int totalAlienSectors = groups.Sum(group => group.Sectors.Count);

        _summaryText.Text =
            $"Database: {FormatDatabaseName(db)} | Alien races: {groups.Count} | Known alien-space sectors: {totalAlienSectors} | Scan range: 11-{totalSectors}";

        if (groups.Count == 0)
        {
            _groupsHost.Children.Add(BuildEmptyCard(
                "No alien space found",
                "Sectors whose constellation contains 'Space' and not 'uncharted' are included, whether explored or unexplored."));
            return;
        }

        foreach (AlienGroup group in groups)
            _groupsHost.Children.Add(BuildAlienGroupCard(group));
    }

    private static IReadOnlyList<AlienGroup> BuildAlienGroups(Core.ModDatabase db, int totalSectors)
    {
        var rows = new List<AlienSectorRow>();
        for (int sectorNumber = 11; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            if (!TryNormalizeAlienConstellation(sector.Constellation, out string constellation))
                continue;

            rows.Add(new AlienSectorRow(sectorNumber, constellation));
        }

        return rows
            .GroupBy(row => row.Constellation, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                string name = group.Key;
                return new AlienGroup(
                    name,
                    BuildRaceLabel(name),
                    group.OrderBy(row => row.Sector).ToList());
            })
            .OrderBy(group => group.Race, StringComparer.OrdinalIgnoreCase)
            .ThenBy(group => group.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    internal static bool TryNormalizeAlienConstellation(string? value, out string constellation)
    {
        constellation = string.Empty;
        if (string.IsNullOrWhiteSpace(value))
            return false;

        string cleaned = value.Trim().TrimEnd('.').Trim();
        cleaned = Regex.Replace(cleaned, @"\s+\(unexplored\)\s*$", string.Empty, RegexOptions.IgnoreCase);
        cleaned = cleaned.Trim().TrimEnd('.');

        if (cleaned.IndexOf("uncharted", StringComparison.OrdinalIgnoreCase) >= 0)
            return false;

        if (cleaned.IndexOf("Space", StringComparison.OrdinalIgnoreCase) < 0)
            return false;

        constellation = cleaned;
        return !string.IsNullOrWhiteSpace(constellation);
    }

    internal static string BuildRaceLabel(string constellation)
    {
        string race = Regex.Replace(constellation, @"\s+Space$", string.Empty, RegexOptions.IgnoreCase).Trim();
        return string.IsNullOrWhiteSpace(race) ? constellation : race;
    }

    private static string FormatDatabaseName(Core.ModDatabase db)
    {
        if (!string.IsNullOrWhiteSpace(db.DatabaseName))
            return db.DatabaseName;

        if (!string.IsNullOrWhiteSpace(db.DatabasePath))
            return System.IO.Path.GetFileNameWithoutExtension(db.DatabasePath);

        return "current game";
    }

    private Control BuildAlienGroupCard(AlienGroup group)
    {
        var titleRow = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,Auto,Auto"),
            ColumnSpacing = 10,
        };

        var titleBlock = new StackPanel
        {
            Spacing = 2,
            Children =
            {
                new TextBlock
                {
                    Text = group.Race,
                    Foreground = ColAccent,
                    FontSize = 20,
                    FontWeight = FontWeight.Bold,
                },
                new TextBlock
                {
                    Text = group.Name,
                    Foreground = ColMuted,
                    FontSize = 11,
                },
            },
        };

        var countText = new TextBlock
        {
            Text = $"{group.Sectors.Count:N0} sectors",
            Foreground = ColAccentHot,
            FontSize = 14,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var copyButton = new Button
        {
            Content = "Copy",
            Padding = new Thickness(12, 5),
            Background = BgCardAlt,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.25),
            Foreground = ColText,
            CornerRadius = new CornerRadius(9),
            FontSize = 12,
            FontWeight = FontWeight.SemiBold,
            MinWidth = 72,
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
        copyButton.Click += async (_, _) => await CopyAlienSectorsAsync(copyButton, group);

        Grid.SetColumn(titleBlock, 0);
        Grid.SetColumn(countText, 1);
        Grid.SetColumn(copyButton, 2);
        titleRow.Children.Add(titleBlock);
        titleRow.Children.Add(countText);
        titleRow.Children.Add(copyButton);

        var sectorText = new TextBlock
        {
            Text = string.Join(", ", group.Sectors.Select(row => row.Sector.ToString())),
            Foreground = ColText,
            FontSize = 13,
            LineHeight = 21,
            TextWrapping = TextWrapping.Wrap,
        };

        return new Border
        {
            Background = BgCard,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(16),
            Padding = new Thickness(16, 14),
            Child = new StackPanel
            {
                Spacing = 12,
                Children =
                {
                    titleRow,
                    new Border
                    {
                        Background = BgCardAlt,
                        BorderBrush = Edge,
                        BorderThickness = new Thickness(1),
                        CornerRadius = new CornerRadius(12),
                        Padding = new Thickness(10, 10),
                        Child = sectorText,
                    },
                },
            },
        };
    }

    private async System.Threading.Tasks.Task CopyAlienSectorsAsync(Button button, AlienGroup group)
    {
        string previous = button.Content?.ToString() ?? "Copy";
        string sectorList = string.Join(" ", group.Sectors.Select(row => row.Sector.ToString()));

        try
        {
            bool copied = await ClipboardHelper.TrySetTextAsync(this, sectorList);
            button.Content = copied ? "Copied" : "Failed";
            button.Foreground = copied ? ColAccentHot : ColWarning;
            await System.Threading.Tasks.Task.Delay(900);
        }
        finally
        {
            button.Content = previous;
            button.ClearValue(Button.ForegroundProperty);
        }
    }

    private static Control BuildEmptyCard(string title, string message)
    {
        return new Border
        {
            Background = BgCard,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(16),
            Padding = new Thickness(18),
            Child = new StackPanel
            {
                Spacing = 6,
                Children =
                {
                    new TextBlock
                    {
                        Text = title,
                        Foreground = ColWarning,
                        FontSize = 18,
                        FontWeight = FontWeight.Bold,
                    },
                    new TextBlock
                    {
                        Text = message,
                        Foreground = ColMuted,
                        FontSize = 12,
                        TextWrapping = TextWrapping.Wrap,
                    },
                },
            },
        };
    }
}
