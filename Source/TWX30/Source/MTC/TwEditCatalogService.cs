using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Core = TWXProxy.Core;

namespace MTC;

internal static class TwEditCatalogService
{
    private const string CatalogRelativePath = "Data/tw2002-edits.json";
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static IReadOnlyList<TwEditDefinition>? _edits;

    public static IReadOnlyList<TwEditDefinition> LoadEdits()
    {
        if (_edits != null)
            return _edits;

        try
        {
            string json = LoadCatalogJson();
            if (string.IsNullOrWhiteSpace(json))
            {
                _edits = Array.Empty<TwEditDefinition>();
                return _edits;
            }

            TwEditCatalogFile? catalog = JsonSerializer.Deserialize<TwEditCatalogFile>(json, JsonOptions);
            _edits = catalog?.Edits?
                .Where(edit => !string.IsNullOrWhiteSpace(edit.Id))
                .OrderBy(edit => string.Equals(edit.Id, "Subzero", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                .ThenBy(edit => edit.Name, StringComparer.OrdinalIgnoreCase)
                .ToArray() ?? Array.Empty<TwEditDefinition>();
            return _edits;
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.EditCatalog] failed to load catalog: {ex}\n");
            Core.GlobalModules.FlushDebugLog();
            _edits = Array.Empty<TwEditDefinition>();
            return _edits;
        }
    }

    public static TwEditDefinition? FindEdit(string? editId)
    {
        if (string.IsNullOrWhiteSpace(editId))
            return null;

        return LoadEdits().FirstOrDefault(edit =>
            string.Equals(edit.Id, editId, StringComparison.OrdinalIgnoreCase));
    }

    public static IReadOnlyList<TwEditOption> LoadOptions()
    {
        var options = new List<TwEditOption>
        {
            new(string.Empty, "Standard / Unknown", null),
        };
        options.AddRange(LoadEdits().Select(edit => new TwEditOption(edit.Id, edit.Name, edit)));
        return options;
    }

    public static void ApplyEditDefaults(string gameName, string? editId)
    {
        TwEditDefinition? edit = FindEdit(editId);
        if (edit == null)
            return;

        try
        {
            string safeGameName = Core.SharedPaths.SanitizeFileComponent(gameName);
            if (string.IsNullOrWhiteSpace(safeGameName))
                safeGameName = "game";

            string gameDirectory = Path.Combine(AppPaths.TwxproxyGamesDir, safeGameName);
            Directory.CreateDirectory(gameDirectory);

            MergeCatalogFile(
                Path.Combine(gameDirectory, "ships.cfg"),
                OrderShips(edit).Select(ship => ship.Cfg),
                fixedFieldCounts: [9]);
            MergeCatalogFile(
                Path.Combine(gameDirectory, "planets.cfg"),
                edit.Planets.Select(planet => planet.Cfg),
                fixedFieldCounts: [6, 7]);
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.EditCatalog] failed to apply '{editId}' defaults for '{gameName}': {ex}\n");
            Core.GlobalModules.FlushDebugLog();
        }
    }

    private static string ResolveCatalogPath()
    {
        string outputPath = Path.Combine(AppContext.BaseDirectory, CatalogRelativePath);
        if (File.Exists(outputPath))
            return outputPath;

        string sourcePath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", CatalogRelativePath);
        return Path.GetFullPath(sourcePath);
    }

    private static string LoadCatalogJson()
    {
        string path = ResolveCatalogPath();
        if (File.Exists(path))
            return File.ReadAllText(path);

        using Stream? stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("MTC.Data.tw2002-edits.json");
        if (stream == null)
            return string.Empty;

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private static void MergeCatalogFile(string path, IEnumerable<string?> catalogLines, IReadOnlyList<int> fixedFieldCounts)
    {
        var existingLines = new List<string>();
        var existingNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (File.Exists(path))
        {
            foreach (string line in File.ReadLines(path))
            {
                existingLines.Add(line);
                AddCatalogNames(existingNames, line, fixedFieldCounts);
            }
        }

        bool changed = false;
        foreach (string? rawLine in catalogLines)
        {
            string line = rawLine?.TrimEnd() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            string? name = ExtractCatalogName(line, fixedFieldCounts[0]);
            if (string.IsNullOrWhiteSpace(name) || existingNames.Contains(name))
                continue;

            existingLines.Add(line);
            existingNames.Add(name);
            changed = true;
        }

        if (!changed && File.Exists(path))
            return;

        string? directory = Path.GetDirectoryName(path);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);
        File.WriteAllLines(path, existingLines);
    }

    private static void AddCatalogNames(HashSet<string> names, string line, IReadOnlyList<int> fixedFieldCounts)
    {
        foreach (int count in fixedFieldCounts)
        {
            string? name = ExtractCatalogName(line, count);
            if (!string.IsNullOrWhiteSpace(name))
                names.Add(name);
        }
    }

    private static string? ExtractCatalogName(string line, int fixedFieldCount)
    {
        if (string.IsNullOrWhiteSpace(line))
            return null;

        string[] parts = line.Split(' ', fixedFieldCount + 1, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length <= fixedFieldCount ? null : parts[fixedFieldCount].Trim();
    }

    public static IEnumerable<TwEditShip> OrderShips(TwEditDefinition edit)
        => edit.Ships
            .OrderBy(ship => IsAlienShip(ship) ? 1 : 0)
            .ThenBy(ship => IsAlienShip(ship) ? GetAlienRaceName(ship) : string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(ship => ship.Id)
            .ThenBy(ship => ship.Name, StringComparer.OrdinalIgnoreCase);

    public static bool IsAlienShip(TwEditShip ship)
        => !string.IsNullOrWhiteSpace(GetAlienRaceName(ship));

    public static string GetAlienRaceName(TwEditShip ship)
    {
        if (!string.IsNullOrWhiteSpace(ship.Alien))
            return ship.Alien.Trim();

        const string prefix = "Used by alien race ";
        if (!string.IsNullOrWhiteSpace(ship.Deployment) &&
            ship.Deployment.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return ship.Deployment[prefix.Length..].Trim();
        }

        return string.Empty;
    }
}

internal sealed record TwEditOption(string Id, string Name, TwEditDefinition? Edit)
{
    public override string ToString() => Name;
}

internal sealed class TwEditCatalogFile
{
    public int SchemaVersion { get; set; }
    public List<TwEditDefinition> Edits { get; set; } = [];
}

internal sealed class TwEditDefinition
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public int ShipCount { get; set; }
    public int PlanetCount { get; set; }
    public int AlienCount { get; set; }
    public List<TwEditAlias> AlienShipAliases { get; set; } = [];
    public List<TwEditAlias> AlienPlanetAliases { get; set; } = [];
    public List<TwEditShip> Ships { get; set; } = [];
    public List<TwEditPlanet> Planets { get; set; } = [];
    public List<TwEditAlien> Aliens { get; set; } = [];
}

internal sealed class TwEditAlias
{
    public string Alien { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AliasOf { get; set; } = string.Empty;
}

internal sealed class TwEditShip
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Deployment { get; set; } = string.Empty;
    public int MaxHolds { get; set; }
    public int StartHolds { get; set; }
    public int MaxShields { get; set; }
    public int HoldValue { get; set; }
    public int TurnsPerWarp { get; set; }
    public int XportRange { get; set; }
    public int Mines { get; set; }
    public int MineDisruptors { get; set; }
    public int DriveValue { get; set; }
    public int MaxFighters { get; set; }
    public int FightersPerWave { get; set; }
    public double OffOdds { get; set; }
    public double DefOdds { get; set; }
    public int CompValue { get; set; }
    public int PhotonMissiles { get; set; }
    public int EtherProbes { get; set; }
    public int Beacons { get; set; }
    public int Cloaks { get; set; }
    public int HullValue { get; set; }
    public int XpNeeded { get; set; }
    public int GenesisTorps { get; set; }
    public int AtomicDets { get; set; }
    public int Corbomite { get; set; }
    public int TotalPrice { get; set; }
    public List<string> Flags { get; set; } = [];
    public string Source { get; set; } = string.Empty;
    public string Alien { get; set; } = string.Empty;
    public string AliasOf { get; set; } = string.Empty;
    public string Cfg { get; set; } = string.Empty;
}

internal sealed class TwEditPlanet
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BaseName { get; set; } = string.Empty;
    public string ClassLetter { get; set; } = string.Empty;
    public string Subclass { get; set; } = string.Empty;
    public string General { get; set; } = string.Empty;
    public int Habitability { get; set; }
    public int Hazard { get; set; }
    public int OreProd { get; set; }
    public int OrgProd { get; set; }
    public int EquipProd { get; set; }
    public int FigProd { get; set; }
    public int MaxOreColonists { get; set; }
    public int MaxOrgColonists { get; set; }
    public int MaxEquipColonists { get; set; }
    public int MaxOreInventory { get; set; }
    public int MaxOrgInventory { get; set; }
    public int MaxEquipInventory { get; set; }
    public int MaxFighters { get; set; }
    public int MaxShields { get; set; }
    public int MaxCitadelLevel { get; set; }
    public List<TwEditCitadelLevel> CitadelLevels { get; set; } = [];
    public string Source { get; set; } = string.Empty;
    public string Alien { get; set; } = string.Empty;
    public string AliasOf { get; set; } = string.Empty;
    public string Cfg { get; set; } = string.Empty;
}

internal sealed class TwEditCitadelLevel
{
    public int Level { get; set; }
    public int Colonists { get; set; }
    public int Days { get; set; }
    public int Equipment { get; set; }
    public int FuelOre { get; set; }
    public int Organics { get; set; }
}

internal sealed class TwEditAlien
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Singular { get; set; } = string.Empty;
    public string Plural { get; set; } = string.Empty;
    public int StartPopulation { get; set; }
    public int MaxPopulation { get; set; }
    public int StartDay { get; set; }
    public int MaxDay { get; set; }
    public int MoveRate { get; set; }
    public int FleetSize { get; set; }
    public int AssaultSize { get; set; }
    public int? HomeworldId { get; set; }
    public string HomeworldName { get; set; } = string.Empty;
    public int? HomeworldType { get; set; }
    public int? StartCitadel { get; set; }
    public List<string> SpecificShips { get; set; } = [];
    public List<string> Flags { get; set; } = [];
    public List<TwEditFormula> Formulas { get; set; } = [];
}

internal sealed class TwEditFormula
{
    public string Name { get; set; } = string.Empty;
    public string Expression { get; set; } = string.Empty;
}
