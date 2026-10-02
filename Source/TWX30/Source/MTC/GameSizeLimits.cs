namespace MTC;

internal static class GameSizeLimits
{
    public const int MinimumSectors = 100;
    public const int MaximumSectors = 1_000_000;

    public static bool IsValidSectorCount(int sectors)
        => sectors is >= MinimumSectors and <= MaximumSectors;

    public static string RangeDisplay => $"{MinimumSectors:N0} to {MaximumSectors:N0}";
}
