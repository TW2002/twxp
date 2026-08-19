using System.Collections.Generic;
using System.Linq;

namespace TWXProxy.Core;

public sealed record DeadEndInfo(
    ushort Door,
    ushort Deepest,
    ushort Size,
    ushort MaxDepth,
    IReadOnlyList<ushort> Sectors);

internal static class DeadEndFinder
{
    public static IReadOnlyList<DeadEndInfo> Find(ModDatabase database, int maxSize)
    {
        int cappedMaxSize = maxSize > 0 ? maxSize : ModBubble.DefaultMaxBubbleSize;
        int sectorCount = database.DBHeader.Sectors;
        ushort[][] linkedNeighbors = BuildLinkedNeighborIndex(database, sectorCount);
        int[] pathVisitMarks = new int[sectorCount + 1];
        int visitStamp = 0;
        var candidates = new List<DeadEndInfo>();

        for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
        {
            if (linkedNeighbors[sectorNumber].Length != 1)
                continue;

            if (!TryBuildDeadEnd(
                    (ushort)sectorNumber,
                    cappedMaxSize,
                    linkedNeighbors,
                    pathVisitMarks,
                    ref visitStamp,
                    out DeadEndInfo? deadEnd) || deadEnd == null)
                continue;

            candidates.Add(deadEnd);
        }

        return FilterMaximalDeadEnds(candidates);
    }

    private static bool TryBuildDeadEnd(
        ushort terminalSector,
        int maxSize,
        ushort[][] linkedNeighbors,
        int[] pathVisitMarks,
        ref int visitStamp,
        out DeadEndInfo? deadEnd)
    {
        deadEnd = null;

        visitStamp++;
        if (visitStamp == int.MaxValue)
        {
            System.Array.Clear(pathVisitMarks, 0, pathVisitMarks.Length);
            visitStamp = 1;
        }

        var path = new List<ushort>(Math.Min(maxSize, 32));
        ushort current = terminalSector;
        ushort previous = 0;

        while (true)
        {
            ushort[] currentNeighbors = linkedNeighbors[current];
            if (path.Count == 0)
            {
                // A true dead-end starts at a terminal sector.
                if (currentNeighbors.Length != 1)
                    return false;
            }
            else
            {
                // Interior tunnel sectors cannot fork.
                if (currentNeighbors.Length != 2)
                    return false;
            }

            if (pathVisitMarks[current] == visitStamp)
                return false;

            pathVisitMarks[current] = visitStamp;
            path.Add(current);
            if (path.Count > maxSize)
                return false;

            ushort next = 0;
            for (int i = 0; i < currentNeighbors.Length; i++)
            {
                ushort neighbor = currentNeighbors[i];
                if (neighbor == previous)
                    continue;

                if (next != 0)
                    return false;

                next = neighbor;
            }

            if (next == 0 || pathVisitMarks[next] == visitStamp)
                return false;

            ushort[] nextNeighbors = linkedNeighbors[next];

            if (nextNeighbors.Length == 2)
            {
                previous = current;
                current = next;
                continue;
            }

            // The door must connect the tunnel to the broader universe, not just
            // terminate into another isolated sector.
            bool hasOutsideUniverseNeighbor = false;
            for (int i = 0; i < nextNeighbors.Length; i++)
            {
                ushort neighbor = nextNeighbors[i];
                if (neighbor != current && pathVisitMarks[neighbor] != visitStamp)
                {
                    hasOutsideUniverseNeighbor = true;
                    break;
                }
            }
            if (!hasOutsideUniverseNeighbor)
                return false;

            path.Reverse();
            deadEnd = new DeadEndInfo(
                Door: next,
                Deepest: terminalSector,
                Size: (ushort)path.Count,
                MaxDepth: (ushort)path.Count,
                Sectors: path.ToArray());
            return true;
        }
    }

    private static ushort[][] BuildLinkedNeighborIndex(ModDatabase database, int sectorCount)
    {
        var neighbors = new ushort[sectorCount + 1][];

        for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
        {
            SectorData? sector = database.GetSector(sectorNumber);
            if (sector == null)
            {
                neighbors[sectorNumber] = [];
                continue;
            }

            var linkedNeighbors = new List<ushort>(sector.WarpsIn.Count + 6);
            for (int i = 0; i < 6; i++)
            {
                int warp = sector.Warp[i];
                if (warp == 0)
                    break;

                if (warp <= ushort.MaxValue && !linkedNeighbors.Contains((ushort)warp))
                    linkedNeighbors.Add((ushort)warp);
            }

            foreach (int warpIn in sector.WarpsIn)
            {
                if (warpIn <= ushort.MaxValue && !linkedNeighbors.Contains((ushort)warpIn))
                    linkedNeighbors.Add((ushort)warpIn);
            }

            neighbors[sectorNumber] = linkedNeighbors.ToArray();
        }

        return neighbors;
    }

    private static IReadOnlyList<DeadEndInfo> FilterMaximalDeadEnds(IEnumerable<DeadEndInfo> candidates)
    {
        var accepted = new List<DeadEndInfo>();
        var coveredSectors = new HashSet<ushort>();

        foreach (DeadEndInfo candidate in candidates
                     .OrderByDescending(candidate => candidate.Size)
                     .ThenBy(candidate => candidate.Door)
                     .ThenBy(candidate => candidate.Deepest))
        {
            if (candidate.Sectors.All(coveredSectors.Contains))
                continue;

            accepted.Add(candidate);
            foreach (ushort sector in candidate.Sectors)
                coveredSectors.Add(sector);
        }

        return accepted
            .OrderBy(candidate => candidate.Door)
            .ThenBy(candidate => candidate.Deepest)
            .ToArray();
    }

}
