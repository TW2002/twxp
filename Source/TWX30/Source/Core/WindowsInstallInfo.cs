using System;
using System.IO;
using System.Runtime.Versioning;
using Microsoft.Win32;

namespace TWXProxy.Core;

/// <summary>
/// Windows-specific install metadata shared by the MSI and runtime.
/// </summary>
public static class WindowsInstallInfo
{
    public const string RegistryKeyPath = @"Software\TWXProxy\TWX30";
    public const string ProgramDirValueName = "ProgramDir";
    public const string InstallDirValueName = "InstallDir";

    public static string GetInstalledProgramDirOrDefault()
    {
        return TryGetInstalledProgramDir() ?? GetDefaultProgramDir();
    }

    public static string? TryGetInstalledProgramDir()
    {
        if (!OperatingSystem.IsWindows())
            return null;

        return ReadRegistryString(RegistryHive.LocalMachine, ProgramDirValueName)
            ?? ReadRegistryString(RegistryHive.CurrentUser, ProgramDirValueName);
    }

    public static string GetDefaultProgramDir()
    {
        string root = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";
        return Path.Combine(root, "twxproxy");
    }

    public static string GetDefaultScriptsDirectory()
    {
        return Path.Combine(GetInstalledProgramDirOrDefault(), "scripts");
    }

    public static void SetInstalledProgramDir(string programDir)
    {
        if (!OperatingSystem.IsWindows() || string.IsNullOrWhiteSpace(programDir))
            return;

        WriteRegistryString(RegistryHive.CurrentUser, ProgramDirValueName, Path.GetFullPath(programDir));
    }

    [SupportedOSPlatform("windows")]
    private static string? ReadRegistryString(RegistryHive hive, string valueName)
    {
        try
        {
            foreach (RegistryView view in GetViews())
            {
                using RegistryKey baseKey = RegistryKey.OpenBaseKey(hive, view);
                using RegistryKey? key = baseKey.OpenSubKey(RegistryKeyPath, writable: false);
                if (key?.GetValue(valueName) is string value && !string.IsNullOrWhiteSpace(value))
                    return value;
            }
        }
        catch
        {
        }

        return null;
    }

    [SupportedOSPlatform("windows")]
    private static void WriteRegistryString(RegistryHive hive, string valueName, string value)
    {
        try
        {
            foreach (RegistryView view in GetViews())
            {
                using RegistryKey baseKey = RegistryKey.OpenBaseKey(hive, view);
                using RegistryKey key = baseKey.CreateSubKey(RegistryKeyPath, writable: true);
                key.SetValue(valueName, value, RegistryValueKind.String);
            }
        }
        catch
        {
        }
    }

    [SupportedOSPlatform("windows")]
    private static RegistryView[] GetViews()
    {
        if (!OperatingSystem.IsWindows())
            return [RegistryView.Default];

        return Environment.Is64BitOperatingSystem
            ? [RegistryView.Registry64, RegistryView.Registry32, RegistryView.Default]
            : [RegistryView.Default];
    }
}
