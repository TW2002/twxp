using System.Collections.Generic;
using System.Linq;

namespace TWXProxy.Core;

public sealed record TunnelInfo(
    ushort Start,
    ushort End,
    ushort Size,
    IReadOnlyList<ushort> Sectors);

internal static class TunnelFinder
{
    public static IReadOnlyList<TunnelInfo> Find(ModDatabase database, int maxSize)
    {
        int cappedMaxSize = maxSize > 0 ? maxSize : ModBubble.DefaultMaxBubbleSize;
        int sectorCount = database.DBHeader.Sectors;
        ushort[][] linkedNeighbors = BuildLinkedNeighborIndex(database, sectorCount);
        int[] pathVisitMarks = new int[sectorCount + 1];
        int visitStamp = 0;
        var coveredTunnelSectors = new bool[sectorCount + 1];
        var tunnels = new List<TunnelInfo>();

        for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
        {
            if (coveredTunnelSectors[sectorNumber] || linkedNeighbors[sectorNumber].Length != 2)
                continue;

            if (!TryBuildTunnel(
                    (ushort)sectorNumber,
                    cappedMaxSize,
                    linkedNeighbors,
                    pathVisitMarks,
                    ref visitStamp,
                    out TunnelInfo? tunnel) || tunnel == null)
            {
                continue;
            }

            tunnels.Add(tunnel);
            foreach (ushort tunnelSector in tunnel.Sectors)
                coveredTunnelSectors[tunnelSector] = true;
        }

        return tunnels
            .OrderBy(tunnel => tunnel.Start)
            .ThenBy(tunnel => tunnel.End)
            .ThenBy(tunnel => tunnel.Size)
            .ToArray();
    }

    private static bool TryBuildTunnel(
        ushort seedSector,
        int maxSize,
        ushort[][] linkedNeighbors,
        int[] pathVisitMarks,
        ref int visitStamp,
        out TunnelInfo? tunnel)
    {
        tunnel = null;

        ushort[] seedNeighbors = linkedNeighbors[seedSector];
        if (seedNeighbors.Length != 2)
            return false;

        visitStamp++;
        if (visitStamp == int.MaxValue)
        {
            System.Array.Clear(pathVisitMarks, 0, pathVisitMarks.Length);
            visitStamp = 1;
        }

        var path = new List<ushort> { seedSector };
        pathVisitMarks[seedSector] = visitStamp;

        if (!TraceDirection(
                seedSector,
                seedNeighbors[0],
                prepend: true,
                maxSize,
                linkedNeighbors,
                pathVisitMarks,
                visitStamp,
                path,
                out ushort startSector))
        {
            return false;
        }

        if (!TraceDirection(
                seedSector,
                seedNeighbors[1],
                prepend: false,
                maxSize,
                linkedNeighbors,
                pathVisitMarks,
                visitStamp,
                path,
                out ushort endSector))
        {
            return false;
        }

        if (startSector == 0 || endSector == 0 || startSector == endSector)
            return false;

        if (path.Count < 2 || path.Count > maxSize)
            return false;

        if (startSector > endSector ||
            (startSector == endSector && path[0] > path[^1]))
        {
            (startSector, endSector) = (endSector, startSector);
            path.Reverse();
        }

        tunnel = new TunnelInfo(
            Start: startSector,
            End: endSector,
            Size: (ushort)path.Count,
            Sectors: path.ToArray());
        return true;
    }

    private static bool TraceDirection(
        ushort seedSector,
        ushort firstNeighbor,
        bool prepend,
        int maxSize,
        ushort[][] linkedNeighbors,
        int[] pathVisitMarks,
        int visitStamp,
        List<ushort> path,
        out ushort outsideSector)
    {
        outsideSector = 0;
        ushort previous = seedSector;
        ushort current = firstNeighbor;

        while (true)
        {
            if (pathVisitMarks[current] == visitStamp)
                return false;

            ushort[] currentNeighbors = linkedNeighbors[current];
            if (currentNeighbors.Length != 2)
            {
                outsideSector = current;
                return true;
            }

            pathVisitMarks[current] = visitStamp;
            if (prepend)
                path.Insert(0, current);
            else
                path.Add(current);

            if (path.Count > maxSize)
                return false;

            ushort next = currentNeighbors[0] == previous
                ? currentNeighbors[1]
                : currentNeighbors[1] == previous
                    ? currentNeighbors[0]
                    : (ushort)0;

            if (next == 0)
                return false;

            previous = current;
            current = next;
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
}
