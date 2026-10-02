using System.Collections.Concurrent;

namespace TWXProxy.Core;

public sealed record OpenTwTopologyRow(int SectorNumber, IReadOnlyList<int> Warps);

public partial class ModDatabase
{
    public void ReplaceOpenTwTopology(
        IEnumerable<OpenTwTopologyRow> rows,
        int sectorCount,
        string universeId,
        string topologyHash,
        DateTime syncedAtUtc)
    {
        ArgumentNullException.ThrowIfNull(rows);
        if (sectorCount < 1)
            throw new ArgumentOutOfRangeException(nameof(sectorCount));
        if (!Guid.TryParse(universeId, out Guid parsedUniverseId) || parsedUniverseId == Guid.Empty)
            throw new ArgumentException("OpenTW universe ID must be a non-empty UUID.", nameof(universeId));
        if (string.IsNullOrWhiteSpace(topologyHash) ||
            !topologyHash.StartsWith("sha256:", StringComparison.Ordinal))
            throw new ArgumentException("OpenTW topology hash must use sha256.", nameof(topologyHash));

        lock (_saveLock)
        {
            ConcurrentDictionary<int, SectorData> originalSectors = _sectors;
            ConcurrentDictionary<int, Planet> originalPlanets = _planets;
            DataHeader originalHeader = _header;
            int originalMaxSectorSeen = _maxSectorSeen;
            bool newUniverse = !string.Equals(
                originalHeader.OpenTwUniverseId,
                parsedUniverseId.ToString("D"),
                StringComparison.OrdinalIgnoreCase);
            var stagedSectors = new ConcurrentDictionary<int, SectorData>(
                concurrencyLevel: Environment.ProcessorCount,
                capacity: sectorCount);
            ConcurrentDictionary<int, Planet> stagedPlanets = newUniverse
                ? new ConcurrentDictionary<int, Planet>()
                : originalPlanets;

            int expectedSector = 1;
            foreach (OpenTwTopologyRow row in rows)
            {
                if (row.SectorNumber != expectedSector)
                    throw new InvalidDataException($"Expected topology sector {expectedSector}, got {row.SectorNumber}.");
                if (row.Warps.Count > 6 || row.Warps.Distinct().Count() != row.Warps.Count ||
                    row.Warps.Any(warp => warp < 1 || warp > sectorCount))
                    throw new InvalidDataException($"Topology sector {row.SectorNumber} has invalid warps.");

                SectorData sector;
                if (newUniverse || !originalSectors.TryGetValue(row.SectorNumber, out SectorData? existing))
                {
                    sector = new SectorData
                    {
                        Number = row.SectorNumber,
                        Explored = ExploreType.Calc
                    };
                }
                else
                {
                    sector = CloneSector(existing);
                    if (sector.Explored == ExploreType.No)
                        sector.Explored = ExploreType.Calc;
                }

                Array.Clear(sector.Warp, 0, sector.Warp.Length);
                for (int index = 0; index < row.Warps.Count; index++)
                    sector.Warp[index] = row.Warps[index];
                sector.WarpCount = (byte)row.Warps.Count;
                stagedSectors[row.SectorNumber] = sector;
                expectedSector++;
            }

            if (expectedSector != sectorCount + 1)
                throw new InvalidDataException($"Topology ended at sector {expectedSector - 1}; expected {sectorCount}.");

            RebuildWarpInCache(stagedSectors);
            DataHeader stagedHeader = CloneHeader(originalHeader);
            stagedHeader.Sectors = sectorCount;
            stagedHeader.OpenTwUniverseId = parsedUniverseId.ToString("D");
            stagedHeader.OpenTwTopologyHash = topologyHash;
            stagedHeader.OpenTwTopologySyncedAtUtc = syncedAtUtc.ToUniversalTime();
            if (newUniverse)
            {
                stagedHeader.StarDock = 0;
                stagedHeader.AlphaCentauri = 0;
                stagedHeader.Rylos = 0;
            }

            _headerLock.EnterWriteLock();
            try
            {
                Volatile.Write(ref _sectors, stagedSectors);
                Volatile.Write(ref _planets, stagedPlanets);
                _header = stagedHeader;
                _maxSectorSeen = sectorCount;
            }
            finally
            {
                _headerLock.ExitWriteLock();
            }

            try
            {
                SaveDatabaseUnlocked();
            }
            catch
            {
                _headerLock.EnterWriteLock();
                try
                {
                    Volatile.Write(ref _sectors, originalSectors);
                    Volatile.Write(ref _planets, originalPlanets);
                    _header = originalHeader;
                    _maxSectorSeen = originalMaxSectorSeen;
                }
                finally
                {
                    _headerLock.ExitWriteLock();
                }
                throw;
            }

            if (newUniverse)
                ResetNextProvisionalPlanetId();
            Interlocked.Increment(ref _changeStamp);
        }
    }

    private static void RebuildWarpInCache(ConcurrentDictionary<int, SectorData> sectors)
    {
        foreach (SectorData sector in sectors.Values)
            sector.WarpsIn.Clear();

        foreach (SectorData sector in sectors.Values)
        {
            foreach (int warp in sector.Warp.Where(warp => warp > 0))
            {
                if (sectors.TryGetValue(warp, out SectorData? target))
                    target.WarpsIn.Add(sector.Number);
            }
        }
    }

    private static SectorData CloneSector(SectorData source)
    {
        var clone = new SectorData
        {
            Number = source.Number,
            SectorPort = source.SectorPort,
            NavHaz = source.NavHaz,
            Fighters = source.Fighters,
            MinesArmid = source.MinesArmid,
            MinesLimpet = source.MinesLimpet,
            Constellation = source.Constellation,
            Beacon = source.Beacon,
            Update = source.Update,
            Anomaly = source.Anomaly,
            Density = source.Density,
            WarpCount = source.WarpCount,
            Ships = source.Ships,
            Traders = source.Traders,
            PlanetNames = source.PlanetNames,
            Variables = source.Variables,
            WarpsIn = new List<int>(),
            Warp = (int[])source.Warp.Clone(),
            Explored = source.Explored,
            SectorName = source.SectorName,
            Ports = source.Ports,
            Planets = source.Planets,
            Mines = source.Mines,
            FigOwner = source.FigOwner
        };
        Sector sourceBase = source;
        Sector cloneBase = clone;
        cloneBase.Traders = sourceBase.Traders;
        cloneBase.Ships = sourceBase.Ships;
        cloneBase.Fighters = sourceBase.Fighters;
        cloneBase.NavHaz = sourceBase.NavHaz;
        cloneBase.Anomaly = sourceBase.Anomaly;
        cloneBase.Constellation = sourceBase.Constellation;
        cloneBase.Beacon = sourceBase.Beacon;
        cloneBase.Density = sourceBase.Density;
        return clone;
    }

    private static DataHeader CloneHeader(DataHeader source) => new()
    {
        ProgramName = source.ProgramName,
        Version = source.Version,
        Sectors = source.Sectors,
        StarDock = source.StarDock,
        AlphaCentauri = source.AlphaCentauri,
        Rylos = source.Rylos,
        Address = source.Address,
        Description = source.Description,
        ServerPort = source.ServerPort,
        ListenPort = source.ListenPort,
        LoginScript = source.LoginScript,
        Password = source.Password,
        LoginName = source.LoginName,
        Game = source.Game,
        IconFile = source.IconFile,
        UseRLogin = source.UseRLogin,
        UseLogin = source.UseLogin,
        RobFactor = source.RobFactor,
        StealFactor = source.StealFactor,
        LastPortCIM = source.LastPortCIM,
        CommandChar = source.CommandChar,
        OpenTwUniverseId = source.OpenTwUniverseId,
        OpenTwTopologyHash = source.OpenTwTopologyHash,
        OpenTwTopologySyncedAtUtc = source.OpenTwTopologySyncedAtUtc
    };
}
