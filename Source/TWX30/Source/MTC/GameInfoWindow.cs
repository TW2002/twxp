using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Core = TWXProxy.Core;

namespace MTC;

public class GameInfoWindow : Window
{
    private enum GameSettingFormat
    {
        Text,
        Boolean,
        Percent,
        Milliseconds,
        MaxCommands
    }

    private enum OwnershipFilter
    {
        All,
        Mine,
        Enemy
    }

    private sealed record FighterRow(int Sector, string Owner, int Quantity);
    private sealed record PlanetRow(
        int Sector,
        int? PlanetId,
        string Name,
        string Owner,
        string LevelDisplay,
        int? LevelSort,
        int? Fighters,
        int? FuelOre,
        int? Organics,
        int? Equipment);
    private sealed record PlanetSighting(string Name, bool Shielded);
    private sealed record PortRow(
        int Sector,
        string Name,
        string PortClass,
        int PortClassSort,
        string Mcic,
        int? McicSort);
    private sealed record ShipRow(
        int Sector,
        string Name,
        string ShipType,
        string PilotOrOwner,
        int Fighters,
        string Source);
    private sealed record AlienRow(
        int Sector,
        string Race,
        string Name,
        int Fighters,
        string ShipName,
        string ShipType);
    private sealed record GameSettingRow(string Label, GameSettingFormat Format, params string[] VariableNames);

    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly Func<GameState?> _getState;
    private readonly Func<IReadOnlyDictionary<string, string>?> _getGameVars;
    private readonly Func<int> _getBubbleCount;
    private readonly TextBlock _header;
    private readonly StackPanel _statsContent;
    private readonly StackPanel _settingsContent;
    private readonly StackPanel _fightersContent;
    private readonly StackPanel _planetsContent;
    private readonly StackPanel _portsContent;
    private readonly StackPanel _shipsContent;
    private readonly StackPanel _aliensContent;

    private OwnershipFilter _fighterFilter = OwnershipFilter.All;
    private OwnershipFilter _planetFilter = OwnershipFilter.All;
    private string _fighterSortColumn = "sector";
    private bool _fighterSortDescending;
    private string _planetSortColumn = "sector";
    private bool _planetSortDescending;
    private string _portSortColumn = "sector";
    private bool _portSortDescending;
    private string _shipSortColumn = "sector";
    private bool _shipSortDescending;
    private string _alienSortColumn = "sector";
    private bool _alienSortDescending;

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(0x00, 0x00, 0x00));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(0x08, 0x08, 0x08));
    private static readonly IBrush BgRowAlt = new SolidColorBrush(Color.FromRgb(0x11, 0x11, 0x11));
    private static readonly IBrush BgHeader = new SolidColorBrush(Color.FromRgb(0x14, 0x14, 0x14));
    private static readonly IBrush BgActive = new SolidColorBrush(Color.FromRgb(0x14, 0x3f, 0x7a));
    private static readonly IBrush ColBorder = new SolidColorBrush(Color.FromRgb(0x2d, 0x2d, 0x2d));
    private static readonly IBrush ColGreen = new SolidColorBrush(Color.FromRgb(0x00, 0xff, 0x55));
    private static readonly IBrush ColCyan = new SolidColorBrush(Color.FromRgb(0x33, 0xee, 0xff));
    private static readonly IBrush ColYellow = new SolidColorBrush(Color.FromRgb(0xff, 0xee, 0x33));
    private static readonly IBrush ColBlue = new SolidColorBrush(Color.FromRgb(0x44, 0x66, 0xff));
    private static readonly IBrush ColMagenta = new SolidColorBrush(Color.FromRgb(0xff, 0x33, 0xff));
    private static readonly IBrush ColRed = new SolidColorBrush(Color.FromRgb(0xff, 0x44, 0x44));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(0xaa, 0xaa, 0xaa));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(0xe6, 0xe6, 0xe6));

    private static readonly IReadOnlyList<GameSettingRow> GameSettings =
    [
        new("Gold Enabled", GameSettingFormat.Boolean, "$GAME~GOLDENABLED"),
        new("MBBS Compatibility", GameSettingFormat.Boolean, "$GAME~MBBS"),
        new("Internal Aliens", GameSettingFormat.Boolean, "$GAME~INTERNALALIENS"),
        new("Internal Ferrengi", GameSettingFormat.Boolean, "$GAME~INTERNALFERRENGI"),
        new("Max Commands", GameSettingFormat.MaxCommands, "$GAME~MAX_COMMANDS"),
        new("Inactive Time", GameSettingFormat.Text, "$GAME~INACTIVE_TIME"),
        new("Colonist Regen Rate", GameSettingFormat.Text, "$GAME~COLONIST_REGEN"),
        new("Photon Missile Duration", GameSettingFormat.Text, "$GAME~PHOTON_DURATION"),
        new("Photons Enabled", GameSettingFormat.Boolean, "$GAME~PHOTONS_ENABLED"),
        new("Debris Loss Percent", GameSettingFormat.Percent, "$GAME~DEBRIS_LOSS"),
        new("Trade Percent", GameSettingFormat.Percent, "$GAME~PTRADESETTING"),
        new("Production Rate", GameSettingFormat.Percent, "$GAME~PRODUCTION_RATE"),
        new("Max Production Regen", GameSettingFormat.Percent, "$GAME~PRODUCTION_REGEN"),
        new("Multiple Photons", GameSettingFormat.Boolean, "$GAME~MULTIPLE_PHOTONS"),
        new("Clear Bust Days", GameSettingFormat.Text, "$GAME~CLEAR_BUST_DAYS"),
        new("Steal Factor", GameSettingFormat.Percent, "$GAME~ACTUAL_STEAL_FACTOR", "$GAME~STEAL_FACTOR"),
        new("Rob Factor", GameSettingFormat.Percent, "$GAME~ACTUAL_ROB_FACTOR", "$GAME~ROB_FACTOR"),
        new("Port Production Max", GameSettingFormat.Text, "$GAME~PORT_MAX"),
        new("Radiation Lifetime", GameSettingFormat.Text, "$GAME~RADIATION_LIFETIME"),
        new("Reregister Ship", GameSettingFormat.Text, "$GAME~LSD_REREGISTERCOST"),
        new("Limpet Removal", GameSettingFormat.Text, "$GAME~LIMPET_REMOVAL_COST"),
        new("Genesis Torpedo", GameSettingFormat.Text, "$GAME~GENESIS_COST"),
        new("Armid Mine", GameSettingFormat.Text, "$GAME~ARMID_COST"),
        new("Limpet Mine", GameSettingFormat.Text, "$GAME~LIMPET_COST"),
        new("Beacon", GameSettingFormat.Text, "$GAME~BEACON_COST"),
        new("Type I TWarp", GameSettingFormat.Text, "$GAME~TWARPI_COST"),
        new("Type II TWarp", GameSettingFormat.Text, "$GAME~TWARPII_COST"),
        new("TWarp Upgrade", GameSettingFormat.Text, "$GAME~TWARP_UPGRADE_COST"),
        new("Psychic Probe", GameSettingFormat.Text, "$GAME~PSYCHIC_COST"),
        new("Planet Scanner", GameSettingFormat.Text, "$GAME~PLANET_SCANNER_COST"),
        new("Atomic Detonator", GameSettingFormat.Text, "$GAME~ATOMIC_COST"),
        new("Corbomite", GameSettingFormat.Text, "$GAME~CORBO_COST"),
        new("Ether Probe", GameSettingFormat.Text, "$GAME~PROBE_COST"),
        new("Photon Missile", GameSettingFormat.Text, "$GAME~PHOTON_COST"),
        new("Cloaking Device", GameSettingFormat.Text, "$GAME~CLOAK_COST"),
        new("Mine Disruptor", GameSettingFormat.Text, "$GAME~DISRUPTOR_COST"),
        new("Holographic Scanner", GameSettingFormat.Text, "$GAME~HOLO_COST"),
        new("Density Scanner", GameSettingFormat.Text, "$GAME~DENSITY_COST"),
        new("Max Planet Sector", GameSettingFormat.Text, "$GAME~MAX_PLANETS_PER_SECTOR"),
        new("Max Game Planets", GameSettingFormat.Text, "$GAME~MAX_PLANETS_IN_GAME"),
        new("FedSpace Photons", GameSettingFormat.Boolean, "$GAME~FEDSPACEPHOTONS"),
        new("Latency", GameSettingFormat.Text, "$GAME~LATENCY"),
        new("Ship Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYSHIP"),
        new("Planet Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYPLANET"),
        new("Other Attacks Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYOTHERATTACK"),
        new("Ship Transporter Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYSHIPTRANSPORTER"),
        new("Planet Transporter Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYPLANETTRANSPORTER"),
        new("EProbe Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYEPROBE"),
        new("Photon Launch Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYPHOTONLAUNCH"),
        new("Photon Wave Delay", GameSettingFormat.Milliseconds, "$GAME~DELAYPHOTONDELAY"),
    ];

    public GameInfoWindow(
        Func<Core.ModDatabase?> getDb,
        Func<GameState?> getState,
        Func<IReadOnlyDictionary<string, string>?>? getGameVars = null,
        Func<int>? getBubbleCount = null)
    {
        _getDb = getDb;
        _getState = getState;
        _getGameVars = getGameVars ?? (() => null);
        _getBubbleCount = getBubbleCount ?? (() => 0);

        Title = "Game Info";
        Width = 1120;
        Height = 760;
        MinWidth = 880;
        MinHeight = 520;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        var refreshBtn = new Button
        {
            Content = "Refresh",
            Padding = new Thickness(10, 4),
        };
        refreshBtn.Click += (_, _) => RefreshInfo();

        _header = new TextBlock
        {
            Text = "Game database summary",
            Foreground = ColMuted,
            Margin = new Thickness(12, 8, 12, 6),
            FontSize = 13,
        };

        _statsContent = new StackPanel { Margin = new Thickness(12), Spacing = 3 };
        _settingsContent = new StackPanel { Margin = new Thickness(12), Spacing = 8 };
        _fightersContent = new StackPanel { Margin = new Thickness(12), Spacing = 8 };
        _planetsContent = new StackPanel { Margin = new Thickness(12), Spacing = 8 };
        _portsContent = new StackPanel { Margin = new Thickness(12), Spacing = 8 };
        _shipsContent = new StackPanel { Margin = new Thickness(12), Spacing = 8 };
        _aliensContent = new StackPanel { Margin = new Thickness(12), Spacing = 8 };

        var tabs = new TabControl
        {
            ItemsSource = new object[]
            {
                new TabItem
                {
                    Header = "Stats",
                    Content = new ScrollViewer
                    {
                        Content = _statsContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
                    }
                },
                new TabItem
                {
                    Header = "Settings",
                    Content = new ScrollViewer
                    {
                        Content = _settingsContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
                    }
                },
                new TabItem
                {
                    Header = "Fighters",
                    Content = new ScrollViewer
                    {
                        Content = _fightersContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                    }
                },
                new TabItem
                {
                    Header = "Planets",
                    Content = new ScrollViewer
                    {
                        Content = _planetsContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                    }
                },
                new TabItem
                {
                    Header = "Ports",
                    Content = new ScrollViewer
                    {
                        Content = _portsContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                    }
                },
                new TabItem
                {
                    Header = "Ships",
                    Content = new ScrollViewer
                    {
                        Content = _shipsContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                    }
                },
                new TabItem
                {
                    Header = "Aliens",
                    Content = new ScrollViewer
                    {
                        Content = _aliensContent,
                        VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                        HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
                    }
                }
            }
        };

        var toolbar = new DockPanel
        {
            Background = BgPanel,
            LastChildFill = false,
            Children =
            {
                new Border
                {
                    Padding = new Thickness(12, 8, 12, 8),
                    Child = refreshBtn,
                }
            }
        };

        Content = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,Auto,*"),
            Children =
            {
                toolbar,
                _header,
                tabs
            }
        };
        Grid.SetRow(toolbar, 0);
        Grid.SetRow(_header, 1);
        Grid.SetRow(tabs, 2);

        Opened += (_, _) => RefreshInfo();
    }

    private void RefreshInfo()
    {
        _statsContent.Children.Clear();
        _settingsContent.Children.Clear();
        _fightersContent.Children.Clear();
        _planetsContent.Children.Clear();
        _portsContent.Children.Clear();
        _shipsContent.Children.Clear();
        _aliensContent.Children.Clear();

        Core.ModDatabase? db = _getDb();
        if (db == null)
        {
            _header.Text = "No active database. Connect to a game first.";
            _header.Foreground = ColRed;
            RenderEmptyTab(_statsContent, "No active database.");
            RenderEmptyTab(_settingsContent, "No active database.");
            RenderEmptyTab(_fightersContent, "No active database.");
            RenderEmptyTab(_planetsContent, "No active database.");
            RenderEmptyTab(_portsContent, "No active database.");
            RenderEmptyTab(_shipsContent, "No active database.");
            RenderEmptyTab(_aliensContent, "No active database.");
            return;
        }

        int totalSectors = db.DBHeader.Sectors > 0 ? db.DBHeader.Sectors : db.MaxSectorSeen;
        if (totalSectors <= 0)
        {
            _header.Text = "Universe size is not known yet.";
            _header.Foreground = ColRed;
            RenderEmptyTab(_statsContent, "Universe size is not known yet.");
            RenderEmptyTab(_settingsContent, "Universe size is not known yet.");
            RenderEmptyTab(_fightersContent, "Universe size is not known yet.");
            RenderEmptyTab(_planetsContent, "Universe size is not known yet.");
            RenderEmptyTab(_portsContent, "Universe size is not known yet.");
            RenderEmptyTab(_shipsContent, "Universe size is not known yet.");
            RenderEmptyTab(_aliensContent, "Universe size is not known yet.");
            return;
        }

        _header.Text = $"Database: {db.DatabaseName}";
        _header.Foreground = ColMuted;

        RenderStats(db, totalSectors);
        RenderSettings();
        RenderFighters(db, totalSectors);
        RenderPlanets(db, totalSectors);
        RenderPorts(db, totalSectors);
        RenderShips(db, totalSectors);
        RenderAliens(db, totalSectors);
    }

    private void RenderStats(Core.ModDatabase db, int totalSectors)
    {
        int knownPorts = 0;
        int visitedSectors = 0;
        int knownSectors = 0;
        int alienSightings = 0;
        int solSector = 0;
        int rylosSector = 0;
        int alphaSector = 0;

        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            if (sector.Explored != Core.ExploreType.No)
                knownSectors++;
            if (sector.Explored == Core.ExploreType.Yes)
                visitedSectors++;

            alienSightings += sector.Traders.Count(trader => IsAlienDisplayLabel(trader.DisplayLabel));

            if (sector.SectorPort == null || string.IsNullOrWhiteSpace(sector.SectorPort.Name))
                continue;

            knownPorts++;

            if (sector.SectorPort.ClassIndex == 0)
            {
                if (string.Equals(sector.SectorPort.Name, "Sol", StringComparison.OrdinalIgnoreCase))
                    solSector = sectorNumber;
                else if (string.Equals(sector.SectorPort.Name, "Rylos", StringComparison.OrdinalIgnoreCase))
                    rylosSector = sectorNumber;
                else if (string.Equals(sector.SectorPort.Name, "Alpha Centauri", StringComparison.OrdinalIgnoreCase))
                    alphaSector = sectorNumber;
            }
        }

        if (rylosSector == 0 && db.DBHeader.Rylos != 0 && db.DBHeader.Rylos != 65535)
            rylosSector = db.DBHeader.Rylos;
        if (alphaSector == 0 && db.DBHeader.AlphaCentauri != 0 && db.DBHeader.AlphaCentauri != 65535)
            alphaSector = db.DBHeader.AlphaCentauri;

        int stardockSector = (db.DBHeader.StarDock != 0 && db.DBHeader.StarDock != 65535) ? db.DBHeader.StarDock : 0;
        string stardockName = "-";
        if (stardockSector > 0)
            stardockName = db.GetSector(stardockSector)?.SectorPort?.Name ?? "StarDock";

        int totalBubbles = _getBubbleCount();

        AddOverviewLine("StarDock location:", FormatLocation(stardockSector, stardockName), ColGreen);
        AddOverviewLine("Sol location:", FormatSector(solSector), ColCyan);
        AddOverviewLine("Rylos location:", FormatSector(rylosSector), ColCyan);
        AddOverviewLine("Alpha Centauri location:", FormatSector(alphaSector), ColCyan);
        AddOverviewSpacer();
        AddOverviewLine("Known ports.......:", knownPorts.ToString(), ColYellow);
        AddOverviewLine("Known bubbles.....:", totalBubbles.ToString(), ColBlue);
        AddOverviewLine("Aliens seen.......:", alienSightings.ToString(), ColYellow);
        AddOverviewLine("Explored sectors..:", $"{visitedSectors} ({FormatPercent(visitedSectors, totalSectors)})", ColCyan);
        AddOverviewLine("Known sectors.....:", $"{knownSectors} ({FormatPercent(knownSectors, totalSectors)})", ColMagenta);
        AddOverviewLine("Number of sectors.:", totalSectors.ToString(), ColRed);
    }

    private void RenderSettings()
    {
        _settingsContent.Children.Add(new TextBlock
        {
            Text = "Mombot game settings captured from the server game-info screen and saved in the current game JSON.",
            Foreground = ColMuted,
            FontSize = 11,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 2),
        });

        var left = new StackPanel { Spacing = 3 };
        var right = new StackPanel { Spacing = 3 };
        int split = (GameSettings.Count + 1) / 2;

        for (int i = 0; i < GameSettings.Count; i++)
        {
            Control row = BuildSettingRow(GameSettings[i], i);
            if (i < split)
                left.Children.Add(row);
            else
                right.Children.Add(row);
        }

        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,*"),
            ColumnSpacing = 10,
        };
        Grid.SetColumn(left, 0);
        Grid.SetColumn(right, 1);
        grid.Children.Add(left);
        grid.Children.Add(right);

        _settingsContent.Children.Add(grid);
    }

    private Control BuildSettingRow(GameSettingRow setting, int index)
    {
        bool found = TryReadGameSetting(setting, out string rawValue);
        string display = found ? FormatGameSettingValue(rawValue, setting.Format) : "-";
        IBrush valueBrush = found
            ? GetGameSettingValueBrush(display, setting.Format)
            : ColMuted;

        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("210,12,*"),
        };

        var label = new TextBlock
        {
            Text = setting.Label,
            Foreground = found ? ColCyan : ColMuted,
            FontSize = 11,
            TextTrimming = TextTrimming.CharacterEllipsis,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(6, 3),
        };

        var equals = new TextBlock
        {
            Text = "=",
            Foreground = ColMuted,
            FontSize = 11,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 3),
        };

        var value = new TextBlock
        {
            Text = display,
            Foreground = valueBrush,
            FontSize = 11,
            TextTrimming = TextTrimming.CharacterEllipsis,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(2, 3, 6, 3),
        };

        Grid.SetColumn(label, 0);
        Grid.SetColumn(equals, 1);
        Grid.SetColumn(value, 2);
        grid.Children.Add(label);
        grid.Children.Add(equals);
        grid.Children.Add(value);

        return new Border
        {
            Background = index % 2 == 0 ? BgPanel : BgRowAlt,
            BorderBrush = ColBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            Child = grid,
        };
    }

    private bool TryReadGameSetting(GameSettingRow setting, out string value)
    {
        foreach (string name in setting.VariableNames.SelectMany(GetCompatibleGameVarNames))
        {
            IReadOnlyDictionary<string, string>? vars = _getGameVars();
            if (vars != null &&
                vars.TryGetValue(name, out string? configuredValue) &&
                !string.IsNullOrWhiteSpace(configuredValue))
            {
                value = configuredValue.Trim();
                return true;
            }

        }

        value = string.Empty;
        return false;
    }

    private static IEnumerable<string> GetCompatibleGameVarNames(string name)
    {
        yield return name;

        int prefixLength = name.Length > 0 && (name[0] == '$' || name[0] == '%') ? 1 : 0;
        int separator = name.LastIndexOf('~');
        if (separator > prefixLength && separator < name.Length - 1)
            yield return name[..prefixLength] + name[(separator + 1)..];
    }

    private static string FormatGameSettingValue(string rawValue, GameSettingFormat format)
    {
        string value = rawValue.Trim();
        if (string.IsNullOrEmpty(value))
            return "-";

        return format switch
        {
            GameSettingFormat.Boolean => FormatBooleanValue(value),
            GameSettingFormat.Percent => FormatPercentValue(value),
            GameSettingFormat.Milliseconds => FormatMillisecondValue(value),
            GameSettingFormat.MaxCommands => FormatMaxCommandsValue(value),
            _ => FormatCompactNumber(value),
        };
    }

    private static string FormatBooleanValue(string value)
    {
        if (IsTruthy(value))
            return "yes";
        if (IsFalsey(value))
            return "no";
        return value;
    }

    private static string FormatPercentValue(string value)
    {
        if (value.EndsWith("%", StringComparison.Ordinal))
            return value;

        return $"{FormatCompactNumber(value)}%";
    }

    private static string FormatMillisecondValue(string value)
    {
        if (!long.TryParse(value.Replace(",", string.Empty, StringComparison.Ordinal), out long milliseconds))
            return value;

        return $"{milliseconds:N0} ms";
    }

    private static string FormatMaxCommandsValue(string value)
    {
        if (long.TryParse(value.Replace(",", string.Empty, StringComparison.Ordinal), out long commands) &&
            commands <= 0)
        {
            return "Unlimited";
        }

        return FormatCompactNumber(value);
    }

    private static string FormatCompactNumber(string value)
    {
        string compact = value.Replace(",", string.Empty, StringComparison.Ordinal);
        return long.TryParse(compact, out long number)
            ? number.ToString("N0")
            : value;
    }

    private static IBrush GetGameSettingValueBrush(string display, GameSettingFormat format)
    {
        if (format != GameSettingFormat.Boolean)
            return ColText;

        return display.Equals("yes", StringComparison.OrdinalIgnoreCase)
            ? ColGreen
            : display.Equals("no", StringComparison.OrdinalIgnoreCase)
                ? ColRed
                : ColText;
    }

    private static bool IsTruthy(string value)
        => value.Equals("1", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("TRUE", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("YES", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("ON", StringComparison.OrdinalIgnoreCase);

    private static bool IsFalsey(string value)
        => value.Equals("0", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("FALSE", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("NO", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("OFF", StringComparison.OrdinalIgnoreCase);

    private void RenderFighters(Core.ModDatabase db, int totalSectors)
    {
        var rows = new List<FighterRow>();
        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector?.Fighters == null || sector.Fighters.Quantity <= 0)
                continue;

            rows.Add(new FighterRow(
                sectorNumber,
                string.IsNullOrWhiteSpace(sector.Fighters.Owner) ? "-" : sector.Fighters.Owner,
                sector.Fighters.Quantity));
        }

        GameState? state = _getState();
        rows = ApplyOwnershipFilter(rows, _fighterFilter, r => r.Owner, state)
            .ToList();

        rows = SortFighters(rows).ToList();

        _fightersContent.Children.Add(BuildFilterBar(
            "Fighter Filter",
            _fighterFilter,
            filter =>
            {
                _fighterFilter = filter;
                RefreshInfo();
            }));

        _fightersContent.Children.Add(BuildTableHeader(
            "100,*,140",
            (HeaderLabel("Sector", _fighterSortColumn == "sector", _fighterSortDescending), false, () => ToggleSort("fighter", "sector")),
            (HeaderLabel("Owner", _fighterSortColumn == "owner", _fighterSortDescending), false, () => ToggleSort("fighter", "owner")),
            (HeaderLabel("Number", _fighterSortColumn == "number", _fighterSortDescending), true, () => ToggleSort("fighter", "number"))));

        if (rows.Count == 0)
        {
            RenderEmptyTab(_fightersContent, "No matching fighter records.");
            return;
        }

        var rowsPanel = new StackPanel { Spacing = 2 };
        for (int i = 0; i < rows.Count; i++)
        {
            FighterRow row = rows[i];
            rowsPanel.Children.Add(BuildDataRow(
                "100,*,140",
                i,
                (row.Sector.ToString(), false),
                (row.Owner, false),
                (row.Quantity.ToString("N0"), true)));
        }

        _fightersContent.Children.Add(rowsPanel);
    }

    private void RenderPlanets(Core.ModDatabase db, int totalSectors)
    {
        db.RepairPlanetSightings();

        var rows = new List<PlanetRow>();
        var sightingsBySector = new Dictionary<int, List<PlanetSighting>>();

        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            List<string> planetNames = db.GetPlanetNamesInSector(sectorNumber);
            if (planetNames.Count == 0)
                continue;

            sightingsBySector[sectorNumber] = planetNames
                .Select(ParsePlanetSighting)
                .ToList();
        }

        var planetsBySector = db.GetAllPlanets()
            .Where(planet => planet.LastSector > 0)
            .Where(planet => planet.Id > 0 || !IsAnonymousPlanetName(planet.Name))
            .GroupBy(planet => planet.LastSector)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderBy(planet => planet.ObservedOrder > 0 ? planet.ObservedOrder : int.MaxValue)
                    .ThenBy(planet => planet.Id)
                    .ToList());

        var sectorNumbers = new HashSet<int>(sightingsBySector.Keys);
        foreach (int sector in planetsBySector.Keys)
            sectorNumbers.Add(sector);

        foreach (int sectorNumber in sectorNumbers.OrderBy(sector => sector))
        {
            planetsBySector.TryGetValue(sectorNumber, out List<Core.Planet>? knownPlanets);
            sightingsBySector.TryGetValue(sectorNumber, out List<PlanetSighting>? sightings);

            knownPlanets ??= new List<Core.Planet>();
            sightings ??= new List<PlanetSighting>();

            var remainingSightings = sightings.ToList();
            foreach (Core.Planet planet in knownPlanets)
            {
                PlanetSighting? sighting = null;
                int sightingIndex = remainingSightings.FindIndex(candidate =>
                    PlanetNamesMatch(candidate.Name, planet.Name));
                if (sightingIndex >= 0)
                {
                    sighting = remainingSightings[sightingIndex];
                    remainingSightings.RemoveAt(sightingIndex);
                }

                string name = string.IsNullOrWhiteSpace(planet.Name) ? "." : planet.Name;
                if (string.IsNullOrWhiteSpace(name) || name == ".")
                    name = sighting?.Name ?? ".";

                int? levelSort = planet.Level > 0 ? planet.Level : null;
                string levelDisplay = planet.Level > 0 ? planet.Level.ToString() : "-";
                if (!levelSort.HasValue && (planet.Shielded == true || sighting?.Shielded == true))
                {
                    levelSort = 5;
                    levelDisplay = "5+";
                }

                rows.Add(new PlanetRow(
                    sectorNumber,
                    planet.Id > 0 ? planet.Id : null,
                    name,
                    string.IsNullOrWhiteSpace(planet.Owner) ? "-" : planet.Owner,
                    levelDisplay,
                    levelSort,
                    planet.Fighters >= 0 ? planet.Fighters : null,
                    planet.FuelOre >= 0 ? planet.FuelOre : null,
                    planet.Organics >= 0 ? planet.Organics : null,
                    planet.Equipment >= 0 ? planet.Equipment : null));
            }

            foreach (PlanetSighting sighting in remainingSightings)
            {
                if (IsAnonymousPlanetName(sighting.Name))
                    continue;

                rows.Add(new PlanetRow(
                    sectorNumber,
                    null,
                    string.IsNullOrWhiteSpace(sighting.Name) ? "." : sighting.Name,
                    "-",
                    sighting.Shielded ? "5+" : "-",
                    sighting.Shielded ? 5 : null,
                    null,
                    null,
                    null,
                    null));
            }
        }

        GameState? state = _getState();
        rows = ApplyOwnershipFilter(rows, _planetFilter, r => r.Owner, state)
            .ToList();
        rows = SortPlanets(rows).ToList();

        _planetsContent.Children.Add(BuildFilterBar(
            "Planet Filter",
            _planetFilter,
            filter =>
            {
                _planetFilter = filter;
                RefreshInfo();
            }));

        _planetsContent.Children.Add(BuildTableHeader(
            "80,70,220,160,80,100,90,90,90",
            (HeaderLabel("Sector", _planetSortColumn == "sector", _planetSortDescending), false, () => ToggleSort("planet", "sector")),
            (HeaderLabel("#", _planetSortColumn == "id", _planetSortDescending), true, () => ToggleSort("planet", "id")),
            (HeaderLabel("Name", _planetSortColumn == "name", _planetSortDescending), false, () => ToggleSort("planet", "name")),
            (HeaderLabel("Owner", _planetSortColumn == "owner", _planetSortDescending), false, () => ToggleSort("planet", "owner")),
            (HeaderLabel("Lvl", _planetSortColumn == "level", _planetSortDescending), true, () => ToggleSort("planet", "level")),
            (HeaderLabel("Figs", _planetSortColumn == "fighters", _planetSortDescending), true, () => ToggleSort("planet", "fighters")),
            (HeaderLabel("Ore", _planetSortColumn == "ore", _planetSortDescending), true, () => ToggleSort("planet", "ore")),
            (HeaderLabel("Org", _planetSortColumn == "org", _planetSortDescending), true, () => ToggleSort("planet", "org")),
            (HeaderLabel("Equ", _planetSortColumn == "equ", _planetSortDescending), true, () => ToggleSort("planet", "equ"))));

        if (rows.Count == 0)
        {
            RenderEmptyTab(_planetsContent, "No matching planets.");
            return;
        }

        var rowsPanel = new StackPanel { Spacing = 2 };
        for (int i = 0; i < rows.Count; i++)
        {
            PlanetRow row = rows[i];
            rowsPanel.Children.Add(BuildDataRow(
                "80,70,220,160,80,100,90,90,90",
                i,
                (row.Sector > 0 ? row.Sector.ToString() : "-", true),
                (row.PlanetId.HasValue ? row.PlanetId.Value.ToString() : "-", true),
                (row.Name, false),
                (row.Owner, false),
                (row.LevelDisplay, true),
                (FormatNullable(row.Fighters), true),
                (FormatNullable(row.FuelOre), true),
                (FormatNullable(row.Organics), true),
                (FormatNullable(row.Equipment), true)));
        }

        _planetsContent.Children.Add(rowsPanel);
    }

    private void RenderPorts(Core.ModDatabase db, int totalSectors)
    {
        var rows = new List<PortRow>();
        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            Core.Port? port = sector?.SectorPort;
            if (port == null || port.Dead || string.IsNullOrWhiteSpace(port.Name))
                continue;

            (string mcic, int? sortKey) = GetPortMcic(sector!);
            rows.Add(new PortRow(
                sectorNumber,
                port.Name,
                FormatPortClass(port),
                port.ClassIndex,
                mcic,
                sortKey));
        }

        rows = SortPorts(rows).ToList();

        _portsContent.Children.Add(BuildTableHeader(
            "80,260,140,180",
            (HeaderLabel("Sector", _portSortColumn == "sector", _portSortDescending), false, () => ToggleSort("port", "sector")),
            (HeaderLabel("Port Name", _portSortColumn == "name", _portSortDescending), false, () => ToggleSort("port", "name")),
            (HeaderLabel("Port Class", _portSortColumn == "class", _portSortDescending), false, () => ToggleSort("port", "class")),
            (HeaderLabel("MCIC", _portSortColumn == "mcic", _portSortDescending), false, () => ToggleSort("port", "mcic"))));

        if (rows.Count == 0)
        {
            RenderEmptyTab(_portsContent, "No known ports.");
            return;
        }

        var rowsPanel = new StackPanel { Spacing = 2 };
        for (int i = 0; i < rows.Count; i++)
        {
            PortRow row = rows[i];
            rowsPanel.Children.Add(BuildDataRow(
                "80,260,140,180",
                i,
                (row.Sector.ToString(), true),
                (row.Name, false),
                (row.PortClass, false),
                (row.Mcic, false)));
        }

        _portsContent.Children.Add(rowsPanel);
    }

    private void RenderShips(Core.ModDatabase db, int totalSectors)
    {
        var rows = new List<ShipRow>();
        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null || (sector.Ships.Count == 0 && sector.Traders.Count == 0))
                continue;

            foreach (Core.Ship ship in sector.Ships)
            {
                rows.Add(new ShipRow(
                    sectorNumber,
                    string.IsNullOrWhiteSpace(ship.Name) ? "-" : ship.Name.Trim(),
                    string.IsNullOrWhiteSpace(ship.ShipType) ? "-" : ship.ShipType.Trim(),
                    string.IsNullOrWhiteSpace(ship.Owner) ? "-" : ship.Owner.Trim(),
                    ship.Fighters,
                    "Ship"));
            }

            foreach (Core.Trader trader in sector.Traders)
            {
                if (IsAlienDisplayLabel(trader.DisplayLabel))
                    continue;

                rows.Add(new ShipRow(
                    sectorNumber,
                    string.IsNullOrWhiteSpace(trader.ShipName) ? "-" : trader.ShipName.Trim(),
                    string.IsNullOrWhiteSpace(trader.ShipType) ? "-" : trader.ShipType.Trim(),
                    string.IsNullOrWhiteSpace(trader.Name) ? "-" : trader.Name.Trim(),
                    trader.Fighters,
                    string.IsNullOrWhiteSpace(trader.DisplayLabel) ? "Trader" : trader.DisplayLabel.Trim()));
            }
        }

        rows = SortShips(rows).ToList();

        _shipsContent.Children.Add(BuildTableHeader(
            "80,230,300,260,120,120",
            (HeaderLabel("Sector", _shipSortColumn == "sector", _shipSortDescending), true, () => ToggleSort("ship", "sector")),
            (HeaderLabel("Ship Name", _shipSortColumn == "name", _shipSortDescending), false, () => ToggleSort("ship", "name")),
            (HeaderLabel("Ship Type", _shipSortColumn == "type", _shipSortDescending), false, () => ToggleSort("ship", "type")),
            (HeaderLabel("Pilot / Owner", _shipSortColumn == "owner", _shipSortDescending), false, () => ToggleSort("ship", "owner")),
            (HeaderLabel("Fighters", _shipSortColumn == "fighters", _shipSortDescending), true, () => ToggleSort("ship", "fighters")),
            (HeaderLabel("Source", _shipSortColumn == "source", _shipSortDescending), false, () => ToggleSort("ship", "source"))));

        if (rows.Count == 0)
        {
            RenderEmptyTab(_shipsContent, "No recorded ships.");
            return;
        }

        var rowsPanel = new StackPanel { Spacing = 2 };
        for (int i = 0; i < rows.Count; i++)
        {
            ShipRow row = rows[i];
            rowsPanel.Children.Add(BuildDataRow(
                "80,230,300,260,120,120",
                i,
                (row.Sector.ToString(), true),
                (row.Name, false),
                (row.ShipType, false),
                (row.PilotOrOwner, false),
                (row.Fighters > 0 ? row.Fighters.ToString("N0") : "-", true),
                (row.Source, false)));
        }

        _shipsContent.Children.Add(rowsPanel);
    }

    private void RenderAliens(Core.ModDatabase db, int totalSectors)
    {
        Dictionary<string, string> raceLookup = BuildAlienRaceLookup(db, totalSectors);
        var rows = new List<AlienRow>();

        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null || sector.Traders.Count == 0)
                continue;

            foreach (Core.Trader trader in sector.Traders)
            {
                if (!IsAlienDisplayLabel(trader.DisplayLabel))
                    continue;

                rows.Add(new AlienRow(
                    sectorNumber,
                    ResolveAlienRace(sector, trader.DisplayLabel, raceLookup),
                    string.IsNullOrWhiteSpace(trader.Name) ? "-" : trader.Name.Trim(),
                    trader.Fighters,
                    string.IsNullOrWhiteSpace(trader.ShipName) ? "-" : trader.ShipName.Trim(),
                    string.IsNullOrWhiteSpace(trader.ShipType) ? "-" : trader.ShipType.Trim()));
            }
        }

        rows = SortAliens(rows).ToList();

        _aliensContent.Children.Add(BuildTableHeader(
            "80,170,260,110,240,280",
            (HeaderLabel("Sector", _alienSortColumn == "sector", _alienSortDescending), true, () => ToggleSort("alien", "sector")),
            (HeaderLabel("Alien Race", _alienSortColumn == "race", _alienSortDescending), false, () => ToggleSort("alien", "race")),
            (HeaderLabel("Alien Name", _alienSortColumn == "name", _alienSortDescending), false, () => ToggleSort("alien", "name")),
            (HeaderLabel("Fighters", _alienSortColumn == "fighters", _alienSortDescending), true, () => ToggleSort("alien", "fighters")),
            (HeaderLabel("Ship Name", _alienSortColumn == "ship", _alienSortDescending), false, () => ToggleSort("alien", "ship")),
            (HeaderLabel("Ship Type", _alienSortColumn == "type", _alienSortDescending), false, () => ToggleSort("alien", "type"))));

        if (rows.Count == 0)
        {
            RenderEmptyTab(_aliensContent, "No recorded alien ship sightings.");
            return;
        }

        var rowsPanel = new StackPanel { Spacing = 2 };
        for (int i = 0; i < rows.Count; i++)
        {
            AlienRow row = rows[i];
            rowsPanel.Children.Add(BuildDataRow(
                "80,170,260,110,240,280",
                i,
                (row.Sector.ToString(), true),
                (row.Race, false),
                (row.Name, false),
                (row.Fighters > 0 ? row.Fighters.ToString("N0") : "-", true),
                (row.ShipName, false),
                (row.ShipType, false)));
        }

        _aliensContent.Children.Add(rowsPanel);
    }

    private IEnumerable<FighterRow> SortFighters(IEnumerable<FighterRow> rows) => _fighterSortColumn switch
    {
        "owner" => _fighterSortDescending
            ? rows.OrderByDescending(r => r.Owner, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Owner, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "number" => _fighterSortDescending
            ? rows.OrderByDescending(r => r.Quantity).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Quantity).ThenBy(r => r.Sector),
        _ => _fighterSortDescending
            ? rows.OrderByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Sector)
    };

    private IEnumerable<PlanetRow> SortPlanets(IEnumerable<PlanetRow> rows) => _planetSortColumn switch
    {
        "name" => _planetSortDescending
            ? rows.OrderByDescending(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector).ThenByDescending(r => r.PlanetId ?? int.MinValue)
            : rows.OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector).ThenBy(r => r.PlanetId ?? int.MaxValue),
        "owner" => _planetSortDescending
            ? rows.OrderByDescending(r => r.Owner, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector).ThenByDescending(r => r.PlanetId ?? int.MinValue)
            : rows.OrderBy(r => r.Owner, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector).ThenBy(r => r.PlanetId ?? int.MaxValue),
        "id" => SortNullable(rows, r => r.PlanetId, _planetSortDescending, r => r.Sector),
        "level" => SortNullable(rows, r => r.LevelSort, _planetSortDescending, r => r.Sector),
        "fighters" => SortNullable(rows, r => r.Fighters, _planetSortDescending, r => r.Sector),
        "ore" => SortNullable(rows, r => r.FuelOre, _planetSortDescending, r => r.Sector),
        "org" => SortNullable(rows, r => r.Organics, _planetSortDescending, r => r.Sector),
        "equ" => SortNullable(rows, r => r.Equipment, _planetSortDescending, r => r.Sector),
        _ => _planetSortDescending
            ? rows.OrderByDescending(r => r.Sector).ThenByDescending(r => r.PlanetId ?? int.MinValue).ThenBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
            : rows.OrderBy(r => r.Sector).ThenBy(r => r.PlanetId ?? int.MaxValue).ThenBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
    };

    private IEnumerable<PortRow> SortPorts(IEnumerable<PortRow> rows) => _portSortColumn switch
    {
        "name" => _portSortDescending
            ? rows.OrderByDescending(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "class" => _portSortDescending
            ? rows.OrderByDescending(r => r.PortClassSort).ThenByDescending(r => r.Name, StringComparer.OrdinalIgnoreCase)
            : rows.OrderBy(r => r.PortClassSort).ThenBy(r => r.Name, StringComparer.OrdinalIgnoreCase),
        "mcic" => SortNullable(rows, r => r.McicSort, _portSortDescending, r => r.Sector),
        _ => _portSortDescending
            ? rows.OrderByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Sector)
    };

    private IEnumerable<ShipRow> SortShips(IEnumerable<ShipRow> rows) => _shipSortColumn switch
    {
        "name" => _shipSortDescending
            ? rows.OrderByDescending(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "type" => _shipSortDescending
            ? rows.OrderByDescending(r => r.ShipType, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.ShipType, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "owner" => _shipSortDescending
            ? rows.OrderByDescending(r => r.PilotOrOwner, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.PilotOrOwner, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "fighters" => _shipSortDescending
            ? rows.OrderByDescending(r => r.Fighters).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Fighters).ThenBy(r => r.Sector),
        "source" => _shipSortDescending
            ? rows.OrderByDescending(r => r.Source, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Source, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        _ => _shipSortDescending
            ? rows.OrderByDescending(r => r.Sector).ThenByDescending(r => r.Name, StringComparer.OrdinalIgnoreCase)
            : rows.OrderBy(r => r.Sector).ThenBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
    };

    private IEnumerable<AlienRow> SortAliens(IEnumerable<AlienRow> rows) => _alienSortColumn switch
    {
        "race" => _alienSortDescending
            ? rows.OrderByDescending(r => r.Race, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Race, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "name" => _alienSortDescending
            ? rows.OrderByDescending(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "fighters" => _alienSortDescending
            ? rows.OrderByDescending(r => r.Fighters).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.Fighters).ThenBy(r => r.Sector),
        "ship" => _alienSortDescending
            ? rows.OrderByDescending(r => r.ShipName, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.ShipName, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        "type" => _alienSortDescending
            ? rows.OrderByDescending(r => r.ShipType, StringComparer.OrdinalIgnoreCase).ThenByDescending(r => r.Sector)
            : rows.OrderBy(r => r.ShipType, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Sector),
        _ => _alienSortDescending
            ? rows.OrderByDescending(r => r.Sector).ThenByDescending(r => r.Race, StringComparer.OrdinalIgnoreCase)
            : rows.OrderBy(r => r.Sector).ThenBy(r => r.Race, StringComparer.OrdinalIgnoreCase)
    };

    private static IEnumerable<T> SortNullable<T>(
        IEnumerable<T> rows,
        Func<T, int?> keySelector,
        bool descending,
        Func<T, int> tieBreaker)
    {
        return descending
            ? rows.OrderByDescending(r => keySelector(r).HasValue)
                  .ThenByDescending(r => keySelector(r) ?? int.MinValue)
                  .ThenByDescending(tieBreaker)
            : rows.OrderBy(r => keySelector(r).HasValue ? 0 : 1)
                  .ThenBy(r => keySelector(r) ?? int.MaxValue)
                  .ThenBy(tieBreaker);
    }

    private IEnumerable<T> ApplyOwnershipFilter<T>(
        IEnumerable<T> rows,
        OwnershipFilter filter,
        Func<T, string> ownerSelector,
        GameState? state)
    {
        return filter switch
        {
            OwnershipFilter.Mine => rows.Where(row => IsFriendlyOwner(ownerSelector(row), state)),
            OwnershipFilter.Enemy => rows.Where(row =>
                !string.IsNullOrWhiteSpace(ownerSelector(row)) &&
                ownerSelector(row) != "-" &&
                !IsFriendlyOwner(ownerSelector(row), state)),
            _ => rows
        };
    }

    private static string FormatNullable(int? value) => value.HasValue ? value.Value.ToString("N0") : "-";

    private static PlanetSighting ParsePlanetSighting(string raw)
    {
        string normalized = NormalizePlanetName(raw);
        bool shielded = raw.Contains("(Shielded)", StringComparison.OrdinalIgnoreCase);
        return new PlanetSighting(normalized, shielded);
    }

    private static bool PlanetNamesMatch(string? left, string? right)
    {
        string normalizedLeft = NormalizePlanetName(left ?? string.Empty);
        string normalizedRight = NormalizePlanetName(right ?? string.Empty);
        return string.Equals(normalizedLeft, normalizedRight, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAnonymousPlanetName(string? raw) =>
        string.Equals(NormalizePlanetName(raw ?? string.Empty), ".", StringComparison.Ordinal);

    private static string NormalizePlanetName(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return ".";

        string normalized = raw.Trim();
        normalized = normalized.Replace("<<<<", string.Empty, StringComparison.Ordinal);
        normalized = normalized.Replace(">>>>", string.Empty, StringComparison.Ordinal);
        normalized = normalized.Trim();
        normalized = Regex.Replace(normalized, @"\s*\(Shielded\)\s*$", string.Empty, RegexOptions.IgnoreCase);
        normalized = normalized.Trim();
        normalized = Regex.Replace(normalized, @"^\([A-Z]\)\s*", string.Empty, RegexOptions.IgnoreCase);
        normalized = normalized.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? "." : normalized;
    }

    private static bool IsFriendlyOwner(string owner, GameState? state)
        => SectorOwnershipClassifier.IsFriendlyOwner(owner, state);

    private static bool IsAlienDisplayLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
            return false;

        string value = label.Trim();
        return !value.Equals("Traders", StringComparison.OrdinalIgnoreCase) &&
               !value.Equals("Federals", StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<string, string> BuildAlienRaceLookup(Core.ModDatabase db, int totalSectors)
    {
        var lookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int sectorNumber = 1; sectorNumber <= totalSectors; sectorNumber++)
        {
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            if (!AliensWindow.TryNormalizeAlienConstellation(sector.Constellation, out string constellation))
                continue;

            string race = AliensWindow.BuildRaceLabel(constellation);
            AddAlienRaceLookup(lookup, race, race);
            AddAlienRaceLookup(lookup, constellation, race);
        }

        return lookup;
    }

    private static void AddAlienRaceLookup(Dictionary<string, string> lookup, string keySource, string race)
    {
        string key = NormalizeAlienRaceKey(keySource);
        if (string.IsNullOrEmpty(key))
            return;

        lookup.TryAdd(key, race);
        if (key.Length > 8)
            lookup.TryAdd(key[..8], race);
    }

    private static string ResolveAlienRace(Core.SectorData sector, string label, IReadOnlyDictionary<string, string> raceLookup)
    {
        if (AliensWindow.TryNormalizeAlienConstellation(sector.Constellation, out string constellation))
            return AliensWindow.BuildRaceLabel(constellation);

        string key = NormalizeAlienRaceKey(label);
        if (raceLookup.TryGetValue(key, out string? race))
            return race;

        if (key.Length > 8 && raceLookup.TryGetValue(key[..8], out race))
            return race;

        return string.IsNullOrWhiteSpace(label) ? "Alien" : label.Trim();
    }

    private static string NormalizeAlienRaceKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return new string(value
            .Where(char.IsLetterOrDigit)
            .Select(char.ToLowerInvariant)
            .ToArray());
    }

    private void ToggleSort(string table, string column)
    {
        switch (table)
        {
            case "fighter":
                (_fighterSortColumn, _fighterSortDescending) = ToggleSortState(_fighterSortColumn, _fighterSortDescending, column);
                break;
            case "planet":
                (_planetSortColumn, _planetSortDescending) = ToggleSortState(_planetSortColumn, _planetSortDescending, column);
                break;
            case "port":
                (_portSortColumn, _portSortDescending) = ToggleSortState(_portSortColumn, _portSortDescending, column);
                break;
            case "ship":
                (_shipSortColumn, _shipSortDescending) = ToggleSortState(_shipSortColumn, _shipSortDescending, column);
                break;
            case "alien":
                (_alienSortColumn, _alienSortDescending) = ToggleSortState(_alienSortColumn, _alienSortDescending, column);
                break;
        }

        RefreshInfo();
    }

    private static (string column, bool descending) ToggleSortState(string currentColumn, bool currentDescending, string nextColumn)
    {
        if (string.Equals(currentColumn, nextColumn, StringComparison.OrdinalIgnoreCase))
            return (currentColumn, !currentDescending);

        return (nextColumn, false);
    }

    private static string HeaderLabel(string label, bool active, bool descending)
    {
        if (!active)
            return label;
        return descending ? $"{label} ▼" : $"{label} ▲";
    }

    private Border BuildFilterBar(string label, OwnershipFilter activeFilter, Action<OwnershipFilter> onChange)
    {
        var row = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Children =
            {
                new TextBlock
                {
                    Text = label,
                    Foreground = ColMuted,
                    VerticalAlignment = VerticalAlignment.Center,
                    Margin = new Thickness(0, 2, 8, 0),
                },
                BuildFilterButton("All", activeFilter == OwnershipFilter.All, () => onChange(OwnershipFilter.All)),
                BuildFilterButton("Mine", activeFilter == OwnershipFilter.Mine, () => onChange(OwnershipFilter.Mine)),
                BuildFilterButton("Enemy", activeFilter == OwnershipFilter.Enemy, () => onChange(OwnershipFilter.Enemy)),
            }
        };

        return new Border
        {
            Background = BgPanel,
            BorderBrush = ColBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(10, 8),
            Child = row,
        };
    }

    private Button BuildFilterButton(string label, bool active, Action onClick)
    {
        var button = new Button
        {
            Content = label,
            Padding = new Thickness(10, 3),
            Background = active ? BgActive : BgHeader,
            Foreground = active ? Brushes.White : ColMuted,
            BorderBrush = active ? ColBlue : ColBorder,
            BorderThickness = new Thickness(1),
            MinWidth = 70,
        };
        button.Click += (_, _) => onClick();
        return button;
    }

    private Border BuildTableHeader(string columns, params (string text, bool rightAlign, Action onClick)[] headers)
    {
        var grid = new Grid { ColumnDefinitions = new ColumnDefinitions(columns) };
        for (int i = 0; i < headers.Length; i++)
        {
            var header = headers[i];
            var text = new TextBlock
            {
                Text = header.text,
                Foreground = ColCyan,
                HorizontalAlignment = header.rightAlign ? HorizontalAlignment.Right : HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(6, 4),
            };

            var hitTarget = new Border
            {
                Background = Brushes.Transparent,
                Child = text
            };
            hitTarget.PointerPressed += (_, _) => header.onClick();

            Grid.SetColumn(hitTarget, i);
            grid.Children.Add(hitTarget);
        }

        return new Border
        {
            Background = BgHeader,
            BorderBrush = ColBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Child = grid,
        };
    }

    private Border BuildDataRow(string columns, int index, params (string text, bool rightAlign)[] cells)
    {
        var grid = new Grid { ColumnDefinitions = new ColumnDefinitions(columns) };
        for (int i = 0; i < cells.Length; i++)
        {
            var cell = cells[i];
            var text = new TextBlock
            {
                Text = cell.text,
                Foreground = ColText,
                TextTrimming = TextTrimming.CharacterEllipsis,
                HorizontalAlignment = cell.rightAlign ? HorizontalAlignment.Right : HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(6, 4),
            };
            Grid.SetColumn(text, i);
            grid.Children.Add(text);
        }

        return new Border
        {
            Background = index % 2 == 0 ? BgPanel : BgRowAlt,
            BorderBrush = ColBorder,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            Child = grid,
        };
    }

    private void RenderEmptyTab(Panel panel, string message)
    {
        panel.Children.Add(new TextBlock
        {
            Text = message,
            Foreground = ColMuted,
            Margin = new Thickness(0, 8, 0, 0),
        });
    }

    private void AddOverviewSpacer()
    {
        _statsContent.Children.Add(new Border { Height = 8 });
    }

    private void AddOverviewLine(string label, string value, IBrush valueColor)
    {
        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("260,*"),
        };

        var labelBlock = new TextBlock
        {
            Text = label,
            Foreground = valueColor,
            FontSize = 14,
        };

        var valueBlock = new TextBlock
        {
            Text = value,
            Foreground = valueColor,
            FontSize = 14,
        };

        Grid.SetColumn(labelBlock, 0);
        Grid.SetColumn(valueBlock, 1);
        grid.Children.Add(labelBlock);
        grid.Children.Add(valueBlock);
        _statsContent.Children.Add(grid);
    }

    private static string FormatLocation(int sector, string name)
    {
        if (sector <= 0)
            return "-";
        return string.IsNullOrWhiteSpace(name) || name == "-"
            ? sector.ToString()
            : $"{sector} ({name})";
    }

    private static string FormatSector(int sector) => sector > 0 ? sector.ToString() : "-";

    private static string FormatPercent(int value, int total)
    {
        if (total <= 0)
            return "0.00%";
        return $"{(value * 100.0 / total):0.00}%";
    }

    private static string FormatPortClass(Core.Port port)
    {
        if (port.ClassIndex == 9)
            return "StarDock";

        if (port.ClassIndex == 0)
            return string.IsNullOrWhiteSpace(port.Name) ? "Special" : port.Name;

        char f = port.BuyProduct.TryGetValue(Core.ProductType.FuelOre, out bool buyFuel) && buyFuel ? 'B' : 'S';
        char o = port.BuyProduct.TryGetValue(Core.ProductType.Organics, out bool buyOrg) && buyOrg ? 'B' : 'S';
        char e = port.BuyProduct.TryGetValue(Core.ProductType.Equipment, out bool buyEquip) && buyEquip ? 'B' : 'S';
        return $"{port.ClassIndex} ({f}{o}{e})";
    }

    private static (string display, int? sortKey) GetPortMcic(Core.SectorData sector)
    {
        var values = new List<(string label, int value)>();
        foreach ((string key, string label) in new[] { ("OREMCIC", "O"), ("ORGMCIC", "G"), ("EQUMCIC", "E") })
        {
            if (sector.Variables.TryGetValue(key, out string? raw) &&
                int.TryParse(raw, out int value))
            {
                values.Add((label, value));
            }
        }

        if (values.Count == 0)
            return ("-", null);

        if (values.Count == 1)
            return (values[0].value.ToString(), values[0].value);

        string display = string.Join(" ", values.Select(v => $"{v.label}:{v.value}"));
        int sortKey = (int)Math.Round(values.Average(v => v.value));
        return (display, sortKey);
    }
}
