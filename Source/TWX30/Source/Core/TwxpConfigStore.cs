using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;

namespace TWXProxy.Core;

public sealed class TwxpConfigSection
{
    public TwxpConfigSection(string name, IDictionary<string, string>? values = null)
    {
        Name = name ?? string.Empty;
        Values = values == null
            ? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, string>(values, StringComparer.OrdinalIgnoreCase);
    }

    public string Name { get; }
    public Dictionary<string, string> Values { get; }
}

public static class TwxpConfigStore
{
    public static IReadOnlyList<TwxpConfigSection> LoadSections(string? programDir = null)
    {
        string resolvedProgramDir = ResolveProgramDirectory(programDir);
        if (TryLoadSectionsFromConfig(resolvedProgramDir, out IReadOnlyList<TwxpConfigSection>? sections))
        {
            if (sections != null)
                return sections;

            return Array.Empty<TwxpConfigSection>();
        }

        foreach (string legacyPath in SharedPaths.GetLegacyTwxpConfigCandidates(resolvedProgramDir))
        {
            if (!File.Exists(legacyPath))
                continue;

            try
            {
                var migrated = ReadIniSections(legacyPath);
                if (migrated.Count > 0)
                    SaveSections(resolvedProgramDir, migrated);
                return migrated;
            }
            catch
            {
                // Ignore corrupt legacy files and continue.
            }
        }

        return Array.Empty<TwxpConfigSection>();
    }

    public static void SaveSections(string? programDir, IEnumerable<TwxpConfigSection> sections)
    {
        string resolvedProgramDir = ResolveProgramDirectory(programDir);
        string configPath = SharedPaths.GetConfigFilePath(resolvedProgramDir);
        var document = SharedConfigFile.LoadOrCreate(configPath);
        var section = new XElement(
            SharedConfigFile.TwxpConfigSectionName,
            sections
                .Where(item => !string.IsNullOrWhiteSpace(item.Name))
                .OrderBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
                .Select(item => new XElement(
                    "Section",
                    new XAttribute("Name", item.Name),
                    item.Values
                        .OrderBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
                        .Select(entry => new XElement(
                            "Entry",
                            new XAttribute("Key", entry.Key),
                            new XAttribute("Value", entry.Value ?? string.Empty))))));

        SharedConfigFile.ReplaceSection(document, SharedConfigFile.TwxpConfigSectionName, section);
        SharedConfigFile.Save(document, configPath);
    }

    private static bool TryLoadSectionsFromConfig(string programDir, out IReadOnlyList<TwxpConfigSection>? sections)
    {
        sections = null;
        string configPath = SharedPaths.GetConfigFilePath(programDir);
        if (!File.Exists(configPath))
            return false;

        try
        {
            var document = XDocument.Load(configPath);
            XElement? section = SharedConfigFile.GetSection(document, SharedConfigFile.TwxpConfigSectionName);
            if (section == null)
                return false;

            sections = ParseXmlSections(section);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static List<TwxpConfigSection> ParseXmlSections(XElement root)
    {
        var sections = new List<TwxpConfigSection>();
        foreach (XElement section in root.Elements("Section"))
        {
            string? name = (string?)section.Attribute("Name");
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (XElement entry in section.Elements("Entry"))
            {
                string? key = (string?)entry.Attribute("Key");
                if (string.IsNullOrWhiteSpace(key))
                    continue;

                values[key] = (string?)entry.Attribute("Value") ?? string.Empty;
            }

            sections.Add(new TwxpConfigSection(name, values));
        }

        return sections;
    }

    private static List<TwxpConfigSection> ReadIniSections(string path)
    {
        var sections = new List<TwxpConfigSection>();
        TwxpConfigSection? current = null;

        foreach (string rawLine in File.ReadLines(path))
        {
            string line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith(";", StringComparison.Ordinal) || line.StartsWith("#", StringComparison.Ordinal))
                continue;

            if (line.StartsWith("[", StringComparison.Ordinal) && line.EndsWith("]", StringComparison.Ordinal))
            {
                string name = line[1..^1].Trim();
                if (string.IsNullOrWhiteSpace(name))
                {
                    current = null;
                    continue;
                }

                current = new TwxpConfigSection(name);
                sections.Add(current);
                continue;
            }

            if (current == null)
                continue;

            int equalsIndex = line.IndexOf('=');
            if (equalsIndex <= 0)
                continue;

            string key = line[..equalsIndex].Trim();
            if (string.IsNullOrWhiteSpace(key))
                continue;

            string value = line[(equalsIndex + 1)..].Trim();
            current.Values[key] = value;
        }

        return sections;
    }

    private static string ResolveProgramDirectory(string? programDir)
    {
        if (string.IsNullOrWhiteSpace(programDir))
            return SharedPaths.ResolveProgramDir();

        try
        {
            return Path.GetFullPath(programDir)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }
        catch
        {
            return programDir.Trim();
        }
    }
}
