using System;
using System.Globalization;
using System.Linq;
using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class TwEditViewDialog : Window
{
    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(142, 195, 205));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));

    public TwEditViewDialog(TwEditDefinition edit)
    {
        Title = $"Edit Details - {edit.Name}";
        Width = 1120;
        Height = 760;
        MinWidth = 760;
        MinHeight = 520;
        CanResize = true;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgWin;

        var close = new Button
        {
            Content = "Close",
            MinWidth = 86,
            Padding = new Thickness(12, 6),
            Background = BgPanel,
            BorderBrush = InnerEdge,
            Foreground = FgText,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };
        close.Click += (_, _) => Close();

        Content = new Border
        {
            Padding = new Thickness(14),
            Child = new DockPanel
            {
                LastChildFill = true,
                Children =
                {
                    BuildHeader(edit),
                    BuildFooter(close),
                    new TabControl
                    {
                        ItemsSource = new[]
                        {
                            BuildTab("Ships", BuildShipsText(edit), wrap: false),
                            BuildTab("Planets", BuildPlanetsText(edit), wrap: false),
                            BuildTab("Aliens", BuildAliensText(edit), wrap: true),
                            BuildTab("Cfg Output", BuildCfgText(edit), wrap: false),
                        },
                    },
                },
            },
        };
    }

    private static Control BuildHeader(TwEditDefinition edit)
    {
        var panel = new StackPanel
        {
            Spacing = 4,
            Margin = new Thickness(0, 0, 0, 10),
        };
        DockPanel.SetDock(panel, Dock.Top);
        panel.Children.Add(new TextBlock
        {
            Text = edit.Name,
            Foreground = Accent,
            FontSize = 20,
            FontWeight = FontWeight.SemiBold,
        });
        panel.Children.Add(new TextBlock
        {
            Text = $"{edit.ShipCount} ships, {edit.PlanetCount} planets, {edit.AlienCount} alien races",
            Foreground = FgMuted,
            FontSize = 13,
        });
        return panel;
    }

    private static Control BuildFooter(Button close)
    {
        var panel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 10, 0, 0),
            Children = { close },
        };
        DockPanel.SetDock(panel, Dock.Bottom);
        return panel;
    }

    private static TabItem BuildTab(string header, string text, bool wrap)
        => new()
        {
            Header = header,
            Content = new Border
            {
                Background = BgPanel,
                Padding = new Thickness(10),
                Child = new ScrollViewer
                {
                    HorizontalScrollBarVisibility = wrap ? ScrollBarVisibility.Disabled : ScrollBarVisibility.Auto,
                    VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                    Content = new SelectableTextBlock
                    {
                        Text = text,
                        Foreground = FgText,
                        FontFamily = FontFamily.Parse("Menlo, Consolas, monospace"),
                        FontSize = 12,
                        TextWrapping = wrap ? TextWrapping.Wrap : TextWrapping.NoWrap,
                    },
                },
            },
        };

    private static string BuildShipsText(TwEditDefinition edit)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Name                           Figs     Shields  Off  Def  TPW Holds Start Price      Deployment");
        sb.AppendLine("-----------------------------------------------------------------------------------------------");
        foreach (TwEditShip ship in TwEditCatalogService.OrderShips(edit))
        {
            sb.AppendLine(
                $"{Trim(ship.Name, 30),-30} {ship.MaxFighters,8:N0} {ship.MaxShields,8:N0} {ship.OffOdds,4:0.0} {ship.DefOdds,4:0.0} {ship.TurnsPerWarp,3} {ship.MaxHolds,5} {ship.StartHolds,5} {ship.TotalPrice,10:N0} {ShipDeploymentLabel(ship)}{AliasSuffix(ship)}");
        }
        return sb.ToString();
    }

    private static string BuildPlanetsText(TwEditDefinition edit)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Name                                      Ore Col    Rate    Org Col    Rate    Equ Col    Rate       Figs  Shields Cit Source");
        sb.AppendLine("-----------------------------------------------------------------------------------------------------------------------------");
        foreach (TwEditPlanet planet in edit.Planets.OrderBy(planet => planet.Id).ThenBy(planet => planet.Name, StringComparer.OrdinalIgnoreCase))
        {
            sb.AppendLine(
                $"{Trim(planet.Name, 40),-40} {planet.MaxOreColonists,8:N0} {planet.OreProd,7} {planet.MaxOrgColonists,10:N0} {planet.OrgProd,7} {planet.MaxEquipColonists,10:N0} {planet.EquipProd,7} {planet.MaxFighters,10:N0} {planet.MaxShields,8:N0} {planet.MaxCitadelLevel,3} {PlanetSourceLabel(planet)}");
        }

        AppendPlanetAliasNotes(sb, edit);

        sb.AppendLine();
        sb.AppendLine("Citadel build requirements");
        sb.AppendLine("--------------------------");
        foreach (TwEditPlanet planet in edit.Planets.Where(planet => planet.CitadelLevels.Count > 0).OrderBy(planet => planet.Id))
        {
            sb.AppendLine(planet.Name);
            foreach (TwEditCitadelLevel level in planet.CitadelLevels.OrderBy(level => level.Level))
            {
                sb.AppendLine(
                    $"  L{level.Level}: {level.Colonists:N0} cols, {level.Days} days, {level.Equipment:N0} eq, {level.FuelOre:N0} ore, {level.Organics:N0} org");
            }
        }
        return sb.ToString();
    }

    private static string BuildAliensText(TwEditDefinition edit)
    {
        var sb = new StringBuilder();
        if (edit.Aliens.Count == 0)
        {
            sb.AppendLine("No alien definition file was present for this edit.");
            return sb.ToString();
        }

        foreach (TwEditAlien alien in edit.Aliens.OrderBy(alien => alien.Id))
        {
            sb.AppendLine($"{alien.Name} ({alien.Singular} / {alien.Plural})");
            sb.AppendLine($"  Population: {alien.StartPopulation}-{alien.MaxPopulation}  Days: {alien.StartDay}-{alien.MaxDay}  Move: {alien.MoveRate}  Fleet: {alien.FleetSize}  Assault: {alien.AssaultSize}");
            if (!string.IsNullOrWhiteSpace(alien.HomeworldName))
                sb.AppendLine($"  Homeworld: {alien.HomeworldName}  Type: {alien.HomeworldType?.ToString(CultureInfo.InvariantCulture) ?? "-"}  Start citadel: {alien.StartCitadel?.ToString(CultureInfo.InvariantCulture) ?? "-"}");
            if (alien.SpecificShips.Count > 0)
                sb.AppendLine($"  Specific ships: {string.Join(", ", alien.SpecificShips)}");
            if (alien.Flags.Count > 0)
                sb.AppendLine($"  Flags: {string.Join(" ", alien.Flags)}");
            foreach (TwEditFormula formula in alien.Formulas)
                sb.AppendLine($"  {formula.Name}: {formula.Expression}");
            sb.AppendLine();
        }

        if (edit.AlienShipAliases.Count > 0 || edit.AlienPlanetAliases.Count > 0)
        {
            sb.AppendLine("Alien-derived cfg additions");
            sb.AppendLine("---------------------------");
            foreach (TwEditAlias alias in edit.AlienShipAliases)
                sb.AppendLine($"  Ship: {alias.Name} ({alias.Alien}, from {alias.AliasOf})");
            foreach (TwEditAlias alias in edit.AlienPlanetAliases)
                sb.AppendLine($"  Planet: {alias.Name} ({alias.Alien}, from {alias.AliasOf})");
        }

        return sb.ToString();
    }

    private static string BuildCfgText(TwEditDefinition edit)
    {
        var sb = new StringBuilder();
        sb.AppendLine("ships.cfg");
        sb.AppendLine("---------");
        foreach (TwEditShip ship in TwEditCatalogService.OrderShips(edit))
            sb.AppendLine(ship.Cfg);
        sb.AppendLine();
        sb.AppendLine("planets.cfg");
        sb.AppendLine("-----------");
        foreach (TwEditPlanet planet in edit.Planets)
            sb.AppendLine(planet.Cfg);
        return sb.ToString();
    }

    private static string AliasSuffix(TwEditShip ship)
        => string.IsNullOrWhiteSpace(ship.AliasOf) ? string.Empty : $" [{ship.Source}: {ship.AliasOf}]";

    private static string ShipDeploymentLabel(TwEditShip ship)
    {
        string alienRace = TwEditCatalogService.GetAlienRaceName(ship);
        return string.IsNullOrWhiteSpace(alienRace) ? ship.Deployment : $"Alien: {alienRace}";
    }

    private static string PlanetSourceLabel(TwEditPlanet planet)
        => planet.Source switch
        {
            "alien-homeworld" => "alien HW",
            "alien-specific-ship" => "alien",
            _ => planet.Source,
        };

    private static void AppendPlanetAliasNotes(StringBuilder sb, TwEditDefinition edit)
    {
        var aliases = edit.Planets
            .Where(planet => !string.IsNullOrWhiteSpace(planet.AliasOf))
            .OrderBy(planet => planet.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (aliases.Length == 0)
            return;

        sb.AppendLine();
        sb.AppendLine("Alien-derived planet aliases");
        sb.AppendLine("----------------------------");
        foreach (TwEditPlanet planet in aliases)
        {
            string alien = string.IsNullOrWhiteSpace(planet.Alien) ? "alien" : planet.Alien;
            sb.AppendLine($"{planet.Name} - {alien}, based on {planet.AliasOf}");
        }
    }

    private static string Trim(string value, int length)
    {
        if (value.Length <= length)
            return value;
        return value[..Math.Max(0, length - 1)] + ".";
    }
}
