using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;

namespace TWXProxy.Core;

public sealed class SharedPathSettings
{
    public string ProgramDirectory { get; set; } = string.Empty;
    public string ScriptsDirectory { get; set; } = string.Empty;
    public bool IsConfigured { get; set; }
}

public static class SharedPathSettingsStore
{
    public static SharedPathSettings Load()
    {
        string? storedProgramDir = SharedPaths.TryGetStoredProgramDir();
        string programDirectory = storedProgramDir ?? SharedPaths.GetDefaultProgramDir();
        string scriptsDirectory = GetDefaultScriptsDirectory(programDirectory);
        bool configured = !string.IsNullOrWhiteSpace(storedProgramDir);

        try
        {
            string configPath = SharedPaths.GetConfigFilePath(programDirectory);
            var document = SharedConfigFile.LoadOrCreate(configPath);
            XElement? section = SharedConfigFile.GetSection(document, SharedConfigFile.SharedPathsSectionName);
            if (section != null)
            {
                string? configuredProgramDirectory = NormalizeDirectoryValue((string?)section.Element("ProgramDirectory"));
                if (!string.IsNullOrWhiteSpace(configuredProgramDirectory))
                {
                    programDirectory = configuredProgramDirectory;
                    scriptsDirectory = GetDefaultScriptsDirectory(programDirectory);
                    configured = true;
                }

                string? configuredScriptsDirectory = NormalizeDirectoryValue((string?)section.Element("ScriptsDirectory"));
                if (!string.IsNullOrWhiteSpace(configuredScriptsDirectory))
                    scriptsDirectory = configuredScriptsDirectory;
            }
        }
        catch
        {
        }

        return new SharedPathSettings
        {
            ProgramDirectory = programDirectory,
            ScriptsDirectory = scriptsDirectory,
            IsConfigured = configured,
        };
    }

    public static void Save(string? programDirectory, string? scriptsDirectory)
    {
        string normalizedProgramDirectory = NormalizeDirectoryValue(programDirectory);
        if (string.IsNullOrWhiteSpace(normalizedProgramDirectory))
            normalizedProgramDirectory = SharedPaths.GetDefaultProgramDir();

        string normalizedScriptsDirectory = NormalizeDirectoryValue(scriptsDirectory);
        if (string.IsNullOrWhiteSpace(normalizedScriptsDirectory))
            normalizedScriptsDirectory = GetDefaultScriptsDirectory(normalizedProgramDirectory);

        try
        {
            string configPath = SharedPaths.GetConfigFilePath(normalizedProgramDirectory);
            var document = SharedConfigFile.LoadFirstExisting(GetConfigCandidates(normalizedProgramDirectory));
            var section = new XElement(
                SharedConfigFile.SharedPathsSectionName,
                new XElement("ProgramDirectory", normalizedProgramDirectory),
                new XElement("ScriptsDirectory", normalizedScriptsDirectory));

            SharedConfigFile.ReplaceSection(document, SharedConfigFile.SharedPathsSectionName, section);
            Directory.CreateDirectory(normalizedProgramDirectory);
            SharedPaths.StoreProgramDir(normalizedProgramDirectory);
            SharedConfigFile.Save(document, configPath);
        }
        catch
        {
        }
    }

    public static string GetDefaultScriptsDirectory(string? programDirectory)
    {
        string resolvedProgramDirectory = NormalizeDirectoryValue(programDirectory);
        if (string.IsNullOrWhiteSpace(resolvedProgramDirectory))
            resolvedProgramDirectory = SharedPaths.GetDefaultProgramDir();

        return Path.Combine(resolvedProgramDirectory, "scripts");
    }

    private static IEnumerable<string> GetConfigCandidates(string programDirectory)
    {
        var candidates = new List<string>
        {
            SharedPaths.GetConfigFilePath(programDirectory),
        };

        string? storedProgramDirectory = SharedPaths.TryGetStoredProgramDir();
        if (!string.IsNullOrWhiteSpace(storedProgramDirectory))
            candidates.Add(SharedPaths.GetConfigFilePath(storedProgramDirectory));

        return candidates.Distinct(StringComparer.OrdinalIgnoreCase);
    }

    private static string NormalizeDirectoryValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        try
        {
            return Path.GetFullPath(value.Trim())
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }
        catch
        {
            return value.Trim();
        }
    }
}
