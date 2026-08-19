using System;

namespace MTC;

internal static class NativeMombotStartupBridge
{
    public static string ToScriptBoolean(bool value)
        => value ? "1" : "0";

    public static string ResolveStartupMove(
        string? botMowToDock,
        string? botMowToDockLower,
        string? startMowOption,
        string? botMowToDockBackdoor,
        string? botMowToDockBackdoorUpper)
    {
        string normalizedStartMowOption = NormalizeMombotValue(startMowOption);
        bool backdoor = string.Equals(normalizedStartMowOption, "backdoor", StringComparison.OrdinalIgnoreCase) ||
                        IsTruthy(botMowToDockBackdoor) ||
                        IsTruthy(botMowToDockBackdoorUpper);
        bool mowToDock = backdoor ||
                         IsTruthy(botMowToDock) ||
                         IsTruthy(botMowToDockLower);

        if (!mowToDock)
            return "none";

        return backdoor ? "backdoor" : "dock";
    }

    public static string ResolveDockMowDestination(bool mowToDock, string? stardock, string? savedDestination)
    {
        if (!mowToDock)
            return string.Empty;

        string normalizedStardock = NormalizeDefinedSector(stardock);
        if (!string.IsNullOrEmpty(normalizedStardock))
            return normalizedStardock;

        string normalizedSavedDestination = NormalizeDefinedSector(savedDestination);
        return normalizedSavedDestination == "1" ? string.Empty : normalizedSavedDestination;
    }

    private static bool IsTruthy(string? value)
    {
        string normalized = NormalizeMombotValue(value);
        return string.Equals(normalized, "1", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(normalized, "true", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(normalized, "yes", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeMombotValue(string? value)
        => (value ?? string.Empty).Trim();

    private static string NormalizeDefinedSector(string? value)
    {
        string normalized = NormalizeMombotValue(value);
        if (!int.TryParse(normalized, out int sector) || sector <= 0 || sector == ushort.MaxValue)
            return string.Empty;

        return sector.ToString();
    }
}
