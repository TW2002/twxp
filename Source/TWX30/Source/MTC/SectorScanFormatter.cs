using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Core = TWXProxy.Core;

namespace MTC;

internal static class SectorScanFormatter
{
    private const string SectorLabel = "Sector  : ";
    private const string BeaconLabel = "Beacon  : ";
    private const string PortLabel = "Ports   : ";
    private const string PlanetLabel = "Planets : ";
    private const string TraderLabel = "Traders : ";
    private const string ShipLabel = "Ships   : ";
    private const string FighterLabel = "Fighters: ";
    private const string MineLabel = "Mines   : ";
    private const string MineContinuationLabel = "        : ";
    private const string WarpLabel = "Warps to Sector(s) :  ";

    public static string FormatSectorTooltip(int sectorNumber, Core.SectorData? sector, Core.ModDatabase? database)
    {
        var output = new StringBuilder();
        output.Append(SectorLabel)
              .Append(sectorNumber)
              .Append(" in ")
              .Append(FormatConstellation(sector?.Constellation))
              .AppendLine();

        if (sector == null)
            return output.ToString().TrimEnd();

        if (!string.IsNullOrWhiteSpace(sector.Beacon))
        {
            output.Append(BeaconLabel)
                  .Append(sector.Beacon.Trim())
                  .AppendLine();
        }

        if (sector.SectorPort is { Dead: false } port && !string.IsNullOrWhiteSpace(port.Name))
        {
            output.Append(PortLabel)
                  .Append(port.Name)
                  .Append(", Class ")
                  .Append(port.ClassIndex)
                  .Append(" (")
                  .Append(FormatPortClass(port))
                  .AppendLine(")");
        }

        IReadOnlyList<string> planets = GetPlanetLines(sectorNumber, sector, database);
        AppendBlock(output, PlanetLabel, planets);
        AppendTraderBlocks(output, sector.Traders);
        AppendBlock(output, ShipLabel, BuildShipLines(sector.Ships));

        if (sector.Fighters.Quantity > 0)
        {
            output.Append(FighterLabel)
                  .Append(sector.Fighters.Quantity.ToString("N0"));
            if (!string.IsNullOrWhiteSpace(sector.Fighters.Owner))
                output.Append(" (").Append(sector.Fighters.Owner.Trim()).Append(')');
            output.Append(" [")
                  .Append(FormatFighterType(sector.Fighters.FigType))
                  .AppendLine("]");
        }

        var mineLines = BuildMineLines(sector);
        if (mineLines.Count > 0)
            AppendBlock(output, MineLabel, mineLines, MineContinuationLabel);

        int[] warps = sector.Warp.Where(w => w > 0).ToArray();
        if (warps.Length > 0)
        {
            output.Append(WarpLabel)
                  .Append(string.Join(" - ", warps))
                  .AppendLine();
        }

        return output.ToString().TrimEnd();
    }

    private static void AppendTraderBlocks(StringBuilder output, IReadOnlyList<Core.Trader> traders)
    {
        if (traders.Count == 0)
            return;

        foreach (IGrouping<string, Core.Trader> group in traders.GroupBy(t => NormalizeTraderLabel(t.DisplayLabel)))
            AppendBlock(output, FormatTraderLabel(group.Key), BuildTraderLines(group.ToList()));
    }

    private static void AppendBlock(StringBuilder output, string label, IReadOnlyList<string> lines, string? continuationLabel = null)
    {
        if (lines.Count == 0)
            return;

        output.Append(label).Append(lines[0]).AppendLine();
        string continuation = continuationLabel ?? new string(' ', label.Length);
        for (int index = 1; index < lines.Count; index++)
            output.Append(continuation).Append(lines[index]).AppendLine();
    }

    private static IReadOnlyList<string> GetPlanetLines(int sectorNumber, Core.SectorData sector, Core.ModDatabase? database)
    {
        if (database == null)
            return sector.PlanetNames;

        List<string> planetNames = database.GetPlanetNamesInSector(sectorNumber);
        return planetNames.Count > 0 ? planetNames : sector.PlanetNames;
    }

    private static List<string> BuildTraderLines(IReadOnlyList<Core.Trader> traders)
    {
        var lines = new List<string>();
        foreach (Core.Trader trader in traders)
        {
            bool hasShipDetail =
                !string.IsNullOrWhiteSpace(trader.ShipName) ||
                !string.IsNullOrWhiteSpace(trader.ShipType);

            var summary = new StringBuilder();
            summary.Append(trader.Name);
            if (trader.Fighters > 0)
                summary.Append(", w/ ").Append(trader.Fighters.ToString("N0")).Append(" ftrs");
            if (hasShipDetail)
                summary.Append(',');
            lines.Add(summary.ToString());

            if (hasShipDetail)
            {
                var detail = new StringBuilder("in");
                if (!string.IsNullOrWhiteSpace(trader.ShipName))
                    detail.Append(' ').Append(trader.ShipName.Trim());
                if (!string.IsNullOrWhiteSpace(trader.ShipType))
                    detail.Append(" (").Append(trader.ShipType.Trim()).Append(')');
                lines.Add(detail.ToString());
            }
        }

        return lines;
    }

    private static List<string> BuildShipLines(IReadOnlyList<Core.Ship> ships)
    {
        var lines = new List<string>();
        foreach (Core.Ship ship in ships)
        {
            var summary = new StringBuilder();
            summary.Append(ship.Name);
            if (!string.IsNullOrWhiteSpace(ship.Owner))
                summary.Append(" [Owned by] ").Append(ship.Owner);
            if (ship.Fighters > 0)
                summary.Append(", w/ ").Append(ship.Fighters.ToString("N0")).Append(" ftrs,");
            lines.Add(summary.ToString());

            if (!string.IsNullOrWhiteSpace(ship.ShipType))
                lines.Add($"({ship.ShipType})");
        }

        return lines;
    }

    private static List<string> BuildMineLines(Core.SectorData sector)
    {
        var lines = new List<string>();
        if (sector.MinesArmid.Quantity > 0)
            lines.Add(FormatMineLine(sector.MinesArmid.Quantity, "Type 1 Armid", sector.MinesArmid.Owner));
        if (sector.MinesLimpet.Quantity > 0)
            lines.Add(FormatMineLine(sector.MinesLimpet.Quantity, "Type 2 Limpet", sector.MinesLimpet.Owner));
        return lines;
    }

    private static string FormatMineLine(int quantity, string mineType, string owner)
    {
        var line = new StringBuilder();
        line.Append(quantity.ToString("N0")).Append(" (").Append(mineType).Append(')');
        if (!string.IsNullOrWhiteSpace(owner))
        {
            string trimmedOwner = owner.Trim();
            if (trimmedOwner.StartsWith('(') && trimmedOwner.EndsWith(')'))
                line.Append(' ').Append(trimmedOwner);
            else
                line.Append(" (").Append(trimmedOwner).Append(')');
        }
        return line.ToString();
    }

    private static string NormalizeTraderLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
            return "Traders";

        string value = label.Trim();
        if (value.Equals("Federals", StringComparison.OrdinalIgnoreCase))
            return "Federals";
        if (value.Equals("JemHada", StringComparison.OrdinalIgnoreCase) ||
            value.Equals("Jem'Hada", StringComparison.OrdinalIgnoreCase))
            return "Jem'Hada";
        return value;
    }

    private static string FormatTraderLabel(string label) =>
        label switch
        {
            "Federals" => "Federals: ",
            "Jem'Hada" => "Jem'Hada: ",
            "Traders" => TraderLabel,
            _ => $"{label}: ",
        };

    private static string FormatConstellation(string? constellation)
    {
        string text = string.IsNullOrWhiteSpace(constellation) ? "uncharted space" : constellation.Trim();
        return text.EndsWith('.') ? text : text + ".";
    }

    private static string FormatPortClass(Core.Port port)
    {
        if (port.ClassIndex is 0 or 9)
            return "Special";

        char fuel = port.BuyProduct.TryGetValue(Core.ProductType.FuelOre, out bool buyFuel) && buyFuel ? 'B' : 'S';
        char organics = port.BuyProduct.TryGetValue(Core.ProductType.Organics, out bool buyOrg) && buyOrg ? 'B' : 'S';
        char equipment = port.BuyProduct.TryGetValue(Core.ProductType.Equipment, out bool buyEquip) && buyEquip ? 'B' : 'S';
        return new string([fuel, organics, equipment]);
    }

    private static string FormatFighterType(Core.FighterType fighterType) =>
        fighterType switch
        {
            Core.FighterType.Toll => "Toll",
            Core.FighterType.Defensive => "Defensive",
            _ => "Offensive",
        };
}
