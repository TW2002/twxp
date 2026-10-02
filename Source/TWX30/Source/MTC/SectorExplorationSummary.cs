using System.Globalization;
using TWXProxy.Core;

namespace MTC;

internal readonly record struct SectorExplorationSummary(int Total, int Explored)
{
    public string Text => Total <= 0 ? string.Empty :
        string.Create(CultureInfo.InvariantCulture,
            $"{(long)Math.Clamp(Explored, 0, Total) * 100 / Total}% Explored");

    public static SectorExplorationSummary Read(ModDatabase database)
    {
        int total = database.DBHeader.Sectors;
        if (!database.IsOpen || total <= 0)
            return default;

        int explored = 0;
        // Individual reads avoid copying/locking the entire sector dictionary.
        for (int number = 1; number <= total; number++)
            if (database.GetSector(number)?.Explored == ExploreType.Yes)
                explored++;
        return new(total, explored);
    }
}
