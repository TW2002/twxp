using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;

namespace TWXProxy.Core;

public static class SharedConfigFile
{
    public const string RootElementName = "TwxProxyConfig";
    public const string SharedPathsSectionName = "SharedPaths";
    public const string MtcPrefsSectionName = "MtcPrefs";
    public const string TwxpPrefsSectionName = "TwxpPrefs";
    public const string TwxpConfigSectionName = "TwxpCfg";

    public static XDocument CreateEmptyDocument()
        => new(new XElement(RootElementName));

    public static XDocument LoadOrCreate(string? path = null)
    {
        string resolvedPath = path ?? SharedPaths.ConfigFilePath;

        try
        {
            if (File.Exists(resolvedPath))
                return XDocument.Load(resolvedPath);
        }
        catch
        {
        }

        return CreateEmptyDocument();
    }

    public static XDocument LoadFirstExisting(IEnumerable<string> candidatePaths)
    {
        foreach (string candidatePath in candidatePaths
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            try
            {
                if (File.Exists(candidatePath))
                    return XDocument.Load(candidatePath);
            }
            catch
            {
            }
        }

        return CreateEmptyDocument();
    }

    public static XElement? GetSection(XDocument document, string sectionName)
    {
        XElement? root = document.Root;
        if (root == null)
            return null;

        if (string.Equals(root.Name.LocalName, sectionName, StringComparison.OrdinalIgnoreCase))
            return root;

        if (string.Equals(root.Name.LocalName, RootElementName, StringComparison.OrdinalIgnoreCase))
        {
            return root.Elements()
                .FirstOrDefault(element => string.Equals(
                    element.Name.LocalName,
                    sectionName,
                    StringComparison.OrdinalIgnoreCase));
        }

        return null;
    }

    public static void ReplaceSection(XDocument document, string sectionName, XElement replacement)
    {
        XElement root = EnsureRoot(document);
        root.Elements()
            .Where(element => string.Equals(
                element.Name.LocalName,
                sectionName,
                StringComparison.OrdinalIgnoreCase))
            .Remove();
        root.Add(new XElement(replacement));
    }

    public static void Save(XDocument document, string? path = null)
    {
        string resolvedPath = path ?? SharedPaths.ConfigFilePath;
        EnsureRoot(document);
        Directory.CreateDirectory(Path.GetDirectoryName(resolvedPath)!);
        document.Save(resolvedPath);
    }

    private static XElement EnsureRoot(XDocument document)
    {
        if (document.Root == null)
        {
            var root = new XElement(RootElementName);
            document.Add(root);
            return root;
        }

        if (string.Equals(document.Root.Name.LocalName, RootElementName, StringComparison.OrdinalIgnoreCase))
            return document.Root;

        XElement legacySection = new(document.Root);
        document.RemoveNodes();
        var wrappedRoot = new XElement(RootElementName, legacySection);
        document.Add(wrappedRoot);
        return wrappedRoot;
    }
}
