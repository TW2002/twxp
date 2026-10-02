using MTC;
using TWXProxy.Core;

internal static class SectorExplorationSummaryTests
{
    public static void Run()
    {
        if (new SectorExplorationSummary(12000, 8160).Text != "68% Explored" ||
            new SectorExplorationSummary(1000000, 1000000).Text != "100% Explored" ||
            new SectorExplorationSummary(10000, 9999).Text.Contains("100%") ||
            new SectorExplorationSummary(0, 12).Text != "")
            throw new Exception("Unexpected sector summary formatting");

        string directory = Path.Combine(Path.GetTempPath(), "mtc-explored-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        using var database = new ModDatabase();
        try
        {
            if (SectorExplorationSummary.Read(database).Text != "")
                throw new Exception("Unknown universe size must not be displayed");
            database.CreateDatabase(Path.Combine(directory, "test.xdb"), new DataHeader { Sectors = 100 });
            foreach (int n in Enumerable.Range(1, 68))
                database.SaveSector(new SectorData { Number = n, Explored = ExploreType.Yes });
            database.SaveSector(new SectorData { Number = 69, Explored = ExploreType.Calc });
            if (SectorExplorationSummary.Read(database).Text != "68% Explored")
                throw new Exception("Route-only sectors must not count as explored");
            database.ResetSectors();
            if (SectorExplorationSummary.Read(database).Text != "0% Explored")
                throw new Exception("Reset must clear explored count");
            database.CloseDatabase();
            if (SectorExplorationSummary.Read(database).Text != "")
                throw new Exception("Closed database must not expose stale summary");
        }
        finally
        {
            database.CloseDatabase();
            Directory.Delete(directory, true);
        }
    }
}
