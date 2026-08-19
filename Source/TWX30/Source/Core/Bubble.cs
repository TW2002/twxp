/*
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
*/

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TWXProxy.Core
{
    public sealed record BubbleInfo(
        ushort Gate,
        ushort Deepest,
        ushort Size,
        ushort MaxDepth,
        bool Gapped,
        IReadOnlyList<ushort> Sectors,
        IReadOnlyList<ushort> Gates)
    {
        public int GateCount => Gates.Count;

        public BubbleInfo(
            ushort gate,
            ushort deepest,
            ushort size,
            ushort maxDepth,
            bool gapped,
            IReadOnlyList<ushort> sectors)
            : this(gate, deepest, size, maxDepth, gapped, sectors, new[] { gate })
        {
        }
    }

    /// <summary>
    /// Bubble structure representing a closed area of sectors
    /// </summary>
    internal struct Bubble
    {
        public ushort Gate;
        public ushort Deepest;
        public ushort Size;
        public ushort MaxDepth;
        public bool Gapped;
        public IReadOnlyList<ushort> Sectors;
        public IReadOnlyList<ushort> Gates;
    }

    /// <summary>
    /// TModBubble: Analyzes the game database to find "bubbles" (closed areas of sectors)
    /// </summary>
    public class ModBubble : TWXModule, IModBubble
    {
        public const int LegacyDefaultMaxBubbleSize = 25;
        public const int DefaultMaxBubbleSize = 150;

        private int _bubbleSize;
        private int _deepestDepth;
        private int _deepestPoint;
        private int _totalBubbles;
        private int _gappedBubbles;
        private int _maxBubbleSize;
        private byte[] _bubblesCovered = Array.Empty<byte>();
        private int[] _areaCovered = Array.Empty<int>();
        private readonly List<ushort> _areaTraversal = new();
        private List<Bubble> _bubbleList = new List<Bubble>();
        private StreamWriter? _targetFile;
        private ITWXDatabase? _analysisDatabase;
        private int _analysisVisitStamp;

        public ModBubble()
        {
            MaxBubbleSize = DefaultMaxBubbleSize;
        }

        #region IModBubble Implementation

        public int MaxBubbleSize
        {
            get => _maxBubbleSize;
            set => _maxBubbleSize = value;
        }

        public bool AllowSectorsSeparatedByGates { get; set; }
        public int MaxGateCount { get; set; } = 1;

        #endregion

        #region Bubble Analysis

        private bool IsClosedArea(SectorData area, ushort areaIndex, ushort last, ushort depth)
        {
            if (_bubbleSize > _maxBubbleSize ||
                areaIndex == 0 ||
                areaIndex > _areaCovered.Length ||
                !HasUsableWarpList(area))
            {
                return false;
            }

            if (depth > _deepestDepth)
            {
                _deepestPoint = areaIndex;
                _deepestDepth = depth;
            }

            int coveredIndex = areaIndex - 1;
            if (_areaCovered[coveredIndex] != _analysisVisitStamp)
                _areaTraversal.Add((ushort)areaIndex);
            _areaCovered[coveredIndex] = _analysisVisitStamp;

            for (int i = 0; i < 6; i++)
            {
                int warp = area.Warp[i];

                if (warp == 0)
                    break;

                if (warp > _areaCovered.Length || warp > ushort.MaxValue)
                    return false;

                if (warp != last && _areaCovered[warp - 1] != _analysisVisitStamp)
                {
                    var s = _analysisDatabase?.LoadSector(warp) as SectorData;
                    if (s == null)
                        continue;

                    // See if it warps back into here
                    bool warpsBack = false;
                    for (int j = 0; j < 6; j++)
                    {
                        int reverseWarp = s.Warp[j];
                        if (reverseWarp == 0)
                            break;

                        if (reverseWarp == areaIndex)
                        {
                            warpsBack = true;
                            break;
                        }
                    }

                    if (warpsBack)
                    {
                        _bubbleSize++;

                        if (!IsClosedArea(s, (ushort)warp, (ushort)areaIndex, (ushort)(depth + 1)))
                        {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        private static bool HasUsableWarpList(Sector sector)
        {
            return sector.Explored != ExploreType.No && sector.Warp.Any(warp => warp > 0);
        }

        private int TestBubble(
            ushort gate,
            ushort interior,
            out ushort deepest,
            out bool gapped,
            out ushort maxDepth,
            out IReadOnlyList<ushort> sectors)
        {
            _bubbleSize = 0;
            _deepestDepth = 0;
            deepest = 0;
            gapped = false;
            maxDepth = 0;
            var coveredSectors = new List<ushort>();
            sectors = coveredSectors;

            var database = GlobalModules.Database;
            if (database == null)
                return -1;

            var area = database.LoadSector(interior) as SectorData;
            if (area == null)
                return -1;

            int sectorCount = database.SectorCount;
            if (_areaCovered.Length != sectorCount)
                _areaCovered = new int[sectorCount];
            _areaTraversal.Clear();
            _analysisDatabase = database;
            _analysisVisitStamp++;
            if (_analysisVisitStamp == int.MaxValue)
            {
                Array.Clear(_areaCovered, 0, _areaCovered.Length);
                _analysisVisitStamp = 1;
            }

            if (!IsClosedArea(area, interior, gate, 0))
            {
                return -1;
            }

            // Copy the area covered to a bubble-local sector list.
            foreach (ushort sectorNumber in _areaTraversal)
            {
                coveredSectors.Add(sectorNumber);

                // Check for backdoors
                if (!gapped)
                {
                    var sector = database.LoadSector(sectorNumber);
                    if (sector is SectorData sectorData)
                    {
                        if (HasBackDoors(sectorData))
                            gapped = true;
                    }
                }
            }

            deepest = (ushort)_deepestPoint;
            maxDepth = sectors.Count > 0 ? (ushort)(_deepestDepth + 1) : (ushort)0;
            return _bubbleSize + 1;
        }

        private void MarkBubbleCovered(IEnumerable<ushort> sectors)
        {
            foreach (ushort sectorNumber in sectors)
            {
                if (sectorNumber >= 1 && sectorNumber <= _bubblesCovered.Length)
                    _bubblesCovered[sectorNumber - 1] = 1;
            }
        }

        private static bool IsMergedBubbleGapped(ITWXDatabase database, ushort gate, IReadOnlyCollection<ushort> sectors)
        {
            var mergedSectorSet = new HashSet<ushort>(sectors);

            foreach (ushort sectorNumber in sectors)
            {
                var sector = database.LoadSector(sectorNumber) as SectorData;
                if (sector == null)
                    continue;

                foreach (int backdoor in sector.WarpsIn)
                {
                    if (backdoor == gate)
                        continue;

                    if (IsDirectWarp(sector, backdoor))
                        continue;

                    if (backdoor > ushort.MaxValue || !mergedSectorSet.Contains((ushort)backdoor))
                        return true;
                }
            }

            return false;
        }

        private static bool HasBackDoors(SectorData sector)
        {
            foreach (int warpIn in sector.WarpsIn)
            {
                if (!IsDirectWarp(sector, warpIn))
                    return true;
            }

            return false;
        }

        private static bool IsDirectWarp(Sector sector, int candidate)
        {
            for (int i = 0; i < 6; i++)
            {
                int warp = sector.Warp[i];
                if (warp == 0)
                    break;

                if (warp == candidate)
                    return true;
            }

            return false;
        }

        #endregion

        #region Public Methods

        public void DumpBubbles()
        {
            var database = GlobalModules.Database;
            if (database == null)
                return;

            string fileName = Path.Combine(
                GlobalModules.ProgramDir,
                $"{database.DatabaseName}_Bubbles.txt"
            );

            try
            {
                using (var writer = new StreamWriter(fileName))
                {
                    ExportBubbles(writer);
                }
            }
            catch
            {
                // Ignore export failures; we still want the on-screen results below.
            }

            WriteBubbles(false);

            // Broadcast results
            string message = $"\r\n{AnsiCodes.ANSI_15}Completed - {_totalBubbles - _gappedBubbles} solid bubbles, " +
                           $"{_gappedBubbles} gapped bubbles (total of {_totalBubbles} bubbles)\r\n" +
                           "Bubbles shown in red are gapped (broken by at least one backdoor)\r\n";

            GlobalModules.Server?.Broadcast(message);
        }

        public void ShowBubble(ushort gate, ushort interior)
        {
            var database = GlobalModules.Database;
            if (database == null)
                return;

            _bubbleSize = 0;
            _deepestDepth = 0;

            var area = database.LoadSector(interior) as SectorData;
            if (area == null)
                return;

            if (_areaCovered.Length != database.SectorCount)
                _areaCovered = new int[database.SectorCount];
            _analysisDatabase = database;
            _analysisVisitStamp++;
            if (_analysisVisitStamp == int.MaxValue)
            {
                Array.Clear(_areaCovered, 0, _areaCovered.Length);
                _analysisVisitStamp = 1;
            }
            var gaps = new List<ushort>();

            if (IsClosedArea(area, interior, gate, 0))
            {
                string output = $"{AnsiCodes.ANSI_9}Gate: {AnsiCodes.ANSI_11}{gate}\r\n" +
                              $"{AnsiCodes.ANSI_9}Size: {AnsiCodes.ANSI_11}{_bubbleSize + 1}\r\n" +
                              $"{AnsiCodes.ANSI_9}Deepest Sector: {AnsiCodes.ANSI_11}{_deepestPoint}\r\n" +
                              $"{AnsiCodes.ANSI_9}Interior: {AnsiCodes.ANSI_11}";

                GlobalModules.Server?.Broadcast(output);

                int col = 1;
                for (int i = 1; i <= database.SectorCount; i++)
                {
                    if (_areaCovered[i - 1] == 1)
                    {
                        col++;
                        string sector = i.ToString().PadRight(6);
                        GlobalModules.Server?.Broadcast(sector);

                        if (col >= 8)
                        {
                            GlobalModules.Server?.Broadcast("\r\n          ");
                            col = 1;
                        }

                        var sector2 = database.LoadSector(i);
                        if (sector2 != null)
                        {
                            var backDoors = database.GetBackDoors(sector2, i);
                            gaps.AddRange(backDoors
                                .Where(backDoor => backDoor <= ushort.MaxValue)
                                .Select(backDoor => (ushort)backDoor));
                        }
                    }
                }

                if (gaps.Count > 0)
                {
                    string gapOutput = $"\r\n{AnsiCodes.ANSI_9}Back Doors: {AnsiCodes.ANSI_12}";
                    gapOutput += string.Join(" ", gaps);
                    GlobalModules.Server?.Broadcast(gapOutput);
                }
            }
            else
            {
                GlobalModules.Server?.Broadcast($"{AnsiCodes.ANSI_15}No bubble found.");
            }

            GlobalModules.Server?.Broadcast("\r\n\r\n");
        }

        public (int TotalBubbles, int GappedBubbles, int SolidBubbles) GetBubbleCounts()
        {
            var database = GlobalModules.Database;
            if (database == null)
                return (0, 0, 0);

            IReadOnlyList<BubbleInfo> bubbles = GetBubbles();
            int gappedBubbles = bubbles.Count(bubble => bubble.Gapped);
            return (bubbles.Count, gappedBubbles, bubbles.Count - gappedBubbles);
        }

        public IReadOnlyList<BubbleInfo> GetBubbles()
        {
            var database = GlobalModules.Database;
            if (database == null)
                return Array.Empty<BubbleInfo>();

            AnalyzeBubbles(database);

            return BuildBubbleInfos(database);
        }

        public void ExportBubbles(StreamWriter writer)
        {
            _targetFile = writer;
            WriteBubbles(true);
        }

        #endregion

        #region Private Methods

        private void WriteBubbles(bool useFile)
        {
            var database = GlobalModules.Database;
            if (database == null)
                return;

            AnalyzeBubbles(database);

            if (useFile)
            {
                _bubbleList.Sort((a, b) => a.Deepest.CompareTo(b.Deepest));
            }

            // Output bubbles that aren't parts of other bubbles
            foreach (var bubble in _bubbleList)
            {
                if (_bubblesCovered[bubble.Gate - 1] == 0)
                {
                    if (useFile && _targetFile != null)
                    {
                        _targetFile.WriteLine($"{bubble.Deepest} {bubble.Size}");
                    }
                    else
                    {
                        _totalBubbles++;

                        string output;
                        if (bubble.Gapped)
                        {
                            _gappedBubbles++;
                            output = $"{AnsiCodes.ANSI_4}Gate: {AnsiCodes.ANSI_12}{bubble.Gate,-10}" +
                                   $"{AnsiCodes.ANSI_4}Deepest: {AnsiCodes.ANSI_12}{bubble.Deepest,-10}" +
                                   $"{AnsiCodes.ANSI_4}Size: {AnsiCodes.ANSI_12}{bubble.Size}\r\n";
                        }
                        else
                        {
                            output = $"{AnsiCodes.ANSI_3}Gate: {AnsiCodes.ANSI_11}{bubble.Gate,-10}" +
                                   $"{AnsiCodes.ANSI_3}Deepest: {AnsiCodes.ANSI_11}{bubble.Deepest,-10}" +
                                   $"{AnsiCodes.ANSI_3}Size: {AnsiCodes.ANSI_11}{bubble.Size}\r\n";
                        }

                        GlobalModules.Server?.Broadcast(output);
                    }
                }
            }

        }

        private void AnalyzeBubbles(ITWXDatabase database)
        {
            _bubbleList.Clear();
            _totalBubbles = 0;
            _gappedBubbles = 0;
            _bubblesCovered = new byte[database.SectorCount];

            for (int i = 1; i <= database.SectorCount; i++)
            {
                var sector = database.LoadSector(i);
                if (sector == null)
                    continue;

                if (sector.Warp[1] > 0 && _bubblesCovered[i - 1] == 0)
                {
                    if (AllowSectorsSeparatedByGates)
                    {
                        CheckBubbleAllowingGateSeparatedSectors(i, sector);
                    }
                    else
                    {
                        for (int warpIndex = 0; warpIndex < 6; warpIndex++)
                        {
                            int warp = sector.Warp[warpIndex];
                            if (warp <= 0)
                                break;
                            if (warp <= ushort.MaxValue)
                                CheckBubble(i, (ushort)warp);
                        }
                    }
                }
            }

            if (MaxGateCount > 1)
                AnalyzeMultiGateBubbles(database, MaxGateCount);
        }

        private void CheckBubble(int gate, ushort interior)
        {
            int size = TestBubble(
                (ushort)gate,
                interior,
                out ushort deepest,
                out bool gapped,
                out ushort maxDepth,
                out IReadOnlyList<ushort> sectors);

            if (size > 1)
            {
                var bubble = new Bubble
                {
                    Gate = (ushort)gate,
                    Deepest = deepest,
                    Size = (ushort)size,
                    MaxDepth = maxDepth,
                    Gapped = gapped,
                    Sectors = sectors,
                    Gates = new[] { (ushort)gate },
                };

                _bubbleList.Add(bubble);

                // Gapped candidates are useful to report, but must not suppress
                // smaller solid bubbles when a larger max-size search finds them first.
                if (!bubble.Gapped)
                    MarkBubbleCovered(bubble.Sectors);
            }
        }

        private void CheckBubbleAllowingGateSeparatedSectors(int gate, Sector gateSector)
        {
            var database = GlobalModules.Database;
            if (database == null)
                return;

            var mergedSectorSet = new HashSet<ushort>();
            var mergedSectors = new List<ushort>();
            var solidMergedSectorSet = new HashSet<ushort>();
            var solidMergedSectors = new List<ushort>();
            ushort deepest = 0;
            ushort maxDepth = 0;
            ushort solidDeepest = 0;
            ushort solidMaxDepth = 0;

            foreach (ushort interior in gateSector.Warp.Where(warp => warp > 0 && warp <= ushort.MaxValue).Select(warp => (ushort)warp).Distinct())
            {
                int size = TestBubble(
                    (ushort)gate,
                    interior,
                    out ushort branchDeepest,
                    out bool branchGapped,
                    out ushort branchDepth,
                    out IReadOnlyList<ushort> branchSectors);

                if (size <= 0)
                    continue;

                foreach (ushort sectorNumber in branchSectors)
                {
                    if (mergedSectorSet.Add(sectorNumber))
                        mergedSectors.Add(sectorNumber);
                }

                if (!branchGapped)
                {
                    foreach (ushort sectorNumber in branchSectors)
                    {
                        if (solidMergedSectorSet.Add(sectorNumber))
                            solidMergedSectors.Add(sectorNumber);
                    }
                }

                if (branchDepth > maxDepth)
                {
                    maxDepth = branchDepth;
                    deepest = branchDeepest;
                }

                if (!branchGapped && branchDepth > solidMaxDepth)
                {
                    solidMaxDepth = branchDepth;
                    solidDeepest = branchDeepest;
                }
            }

            if (mergedSectors.Count > 1)
            {
                ushort gateCountedDepth = maxDepth > 0 ? (ushort)(maxDepth + 1) : (ushort)0;
                bool gapped = IsMergedBubbleGapped(database, (ushort)gate, mergedSectors);

                var bubble = new Bubble
                {
                    Gate = (ushort)gate,
                    Deepest = deepest,
                    Size = (ushort)mergedSectors.Count,
                    MaxDepth = gateCountedDepth,
                    Gapped = gapped,
                    Sectors = mergedSectors,
                    Gates = new[] { (ushort)gate },
                };

                _bubbleList.Add(bubble);

                // See CheckBubble: only closed, solid bubbles should influence
                // later coverage and final gate suppression.
                if (!bubble.Gapped)
                    MarkBubbleCovered(bubble.Sectors);

                if (bubble.Gapped &&
                    solidMergedSectors.Count > 1 &&
                    solidMergedSectors.Count < mergedSectors.Count)
                {
                    ushort solidGateCountedDepth = solidMaxDepth > 0 ? (ushort)(solidMaxDepth + 1) : (ushort)0;
                    bool solidGapped = IsMergedBubbleGapped(database, (ushort)gate, solidMergedSectors);

                    var solidBubble = new Bubble
                    {
                        Gate = (ushort)gate,
                        Deepest = solidDeepest,
                        Size = (ushort)solidMergedSectors.Count,
                        MaxDepth = solidGateCountedDepth,
                        Gapped = solidGapped,
                        Sectors = solidMergedSectors,
                        Gates = new[] { (ushort)gate },
                    };

                    _bubbleList.Add(solidBubble);

                    if (!solidBubble.Gapped)
                        MarkBubbleCovered(solidBubble.Sectors);
                }
            }
        }

        private IReadOnlyList<BubbleInfo> BuildBubbleInfos(ITWXDatabase database)
        {
            return _bubbleList
                .Where(bubble => bubble.Gate > 0 && bubble.Gate <= _bubblesCovered.Length)
                .Where(bubble => _bubblesCovered[bubble.Gate - 1] == 0)
                .Select(bubble =>
                {
                    IReadOnlyList<ushort> gates = FindBoundaryGates(database, bubble.Sectors, bubble.Gate);
                    return bubble with { Gates = gates };
                })
                .GroupBy(bubble => BuildSectorSetKey(bubble.Sectors))
                .Select(group =>
                {
                    Bubble primary = group
                        .OrderBy(bubble => bubble.Gate)
                        .ThenByDescending(bubble => bubble.MaxDepth)
                        .First();
                    IReadOnlyList<ushort> gates = group
                        .SelectMany(bubble => bubble.Gates.Count > 0 ? bubble.Gates : new[] { bubble.Gate })
                        .Where(gate => gate > 0)
                        .Distinct()
                        .OrderBy(gate => gate)
                        .ToArray();

                    return new BubbleInfo(
                        gates.Count > 0 ? gates[0] : primary.Gate,
                        primary.Deepest,
                        primary.Size,
                        primary.MaxDepth,
                        group.Any(bubble => bubble.Gapped),
                        primary.Sectors,
                        gates.Count > 0 ? gates : new[] { primary.Gate });
                })
                .OrderBy(bubble => bubble.Gate)
                .ToArray();
        }

        private void AnalyzeMultiGateBubbles(ITWXDatabase database, int maxGateCount)
        {
            if (maxGateCount < 2 || _maxBubbleSize <= 0)
                return;

            int sectorCount = database.SectorCount;
            if (sectorCount <= 0 || sectorCount == int.MaxValue)
                return;

            ushort[][] linkedNeighbors = BuildUndirectedLinkedNeighborIndex(database, sectorCount);
            ushort outsideRoot = ChooseOutsideRoot(database, linkedNeighbors);
            if (outsideRoot == 0)
                return;

            var seenSectorSets = new HashSet<string>(
                _bubbleList.Select(bubble => BuildSectorSetKey(bubble.Sectors)),
                StringComparer.Ordinal);

            int[] discovery = new int[sectorCount + 1];
            int[] low = new int[sectorCount + 1];
            int[] parent = new int[sectorCount + 1];
            int[] nextNeighborIndex = new int[sectorCount + 1];
            int[] subtreeSize = new int[sectorCount + 1];
            int[] subtreeStart = new int[sectorCount + 1];
            bool[] touchesRemovedGate = new bool[sectorCount + 1];
            var traversalOrder = new List<ushort>(sectorCount);
            var stack = new Stack<ushort>(sectorCount);

            for (ushort removedGate = 1; removedGate <= sectorCount; removedGate++)
            {
                if (linkedNeighbors[removedGate].Length == 0)
                    continue;

                ushort root = outsideRoot != removedGate
                    ? outsideRoot
                    : ChooseOutsideRoot(database, linkedNeighbors, removedGate);
                if (root == 0)
                    continue;

                Array.Clear(discovery, 0, discovery.Length);
                Array.Clear(low, 0, low.Length);
                Array.Clear(parent, 0, parent.Length);
                Array.Clear(nextNeighborIndex, 0, nextNeighborIndex.Length);
                Array.Clear(subtreeSize, 0, subtreeSize.Length);
                Array.Clear(subtreeStart, 0, subtreeStart.Length);
                Array.Clear(touchesRemovedGate, 0, touchesRemovedGate.Length);
                traversalOrder.Clear();
                stack.Clear();

                int time = 0;
                EnterTarjanVertex(
                    root,
                    removedGate,
                    linkedNeighbors,
                    discovery,
                    low,
                    subtreeSize,
                    subtreeStart,
                    touchesRemovedGate,
                    traversalOrder,
                    ref time);
                stack.Push(root);

                while (stack.Count > 0)
                {
                    ushort current = stack.Peek();
                    ushort[] neighbors = linkedNeighbors[current];
                    if (nextNeighborIndex[current] < neighbors.Length)
                    {
                        ushort neighbor = neighbors[nextNeighborIndex[current]++];
                        if (neighbor == removedGate)
                        {
                            touchesRemovedGate[current] = true;
                            continue;
                        }

                        if (discovery[neighbor] == 0)
                        {
                            parent[neighbor] = current;
                            EnterTarjanVertex(
                                neighbor,
                                removedGate,
                                linkedNeighbors,
                                discovery,
                                low,
                                subtreeSize,
                                subtreeStart,
                                touchesRemovedGate,
                                traversalOrder,
                                ref time);
                            stack.Push(neighbor);
                            continue;
                        }

                        if (neighbor != parent[current])
                            low[current] = Math.Min(low[current], discovery[neighbor]);

                        continue;
                    }

                    stack.Pop();
                    int currentParent = parent[current];
                    if (currentParent == 0)
                        continue;

                    if (low[current] >= discovery[currentParent] &&
                        touchesRemovedGate[current] &&
                        subtreeSize[current] > 1 &&
                        subtreeSize[current] <= _maxBubbleSize)
                    {
                        IReadOnlyList<ushort> sectors = CopySubtreeSectors(
                            traversalOrder,
                            subtreeStart[current],
                            subtreeSize[current]);
                        var gates = new SortedSet<ushort> { removedGate, (ushort)currentParent };
                        if (gates.Count <= maxGateCount)
                        {
                            string key = BuildSectorSetKey(sectors);
                            if (seenSectorSets.Add(key))
                            {
                                (ushort deepest, ushort maxDepth) = CalculateMultiGateDepth(
                                    linkedNeighbors,
                                    sectors,
                                    gates);
                                _bubbleList.Add(new Bubble
                                {
                                    Gate = gates.First(),
                                    Deepest = deepest,
                                    Size = (ushort)sectors.Count,
                                    MaxDepth = maxDepth,
                                    Gapped = false,
                                    Sectors = sectors,
                                    Gates = gates.ToArray(),
                                });
                                MarkBubbleCovered(sectors);
                            }
                        }
                    }

                    low[currentParent] = Math.Min(low[currentParent], low[current]);
                    if (subtreeSize[currentParent] <= _maxBubbleSize)
                    {
                        subtreeSize[currentParent] += subtreeSize[current];
                        if (subtreeSize[currentParent] > _maxBubbleSize)
                            subtreeSize[currentParent] = _maxBubbleSize + 1;
                    }

                    touchesRemovedGate[currentParent] |= touchesRemovedGate[current];
                }
            }
        }

        private static void EnterTarjanVertex(
            ushort vertex,
            ushort removedGate,
            ushort[][] linkedNeighbors,
            int[] discovery,
            int[] low,
            int[] subtreeSize,
            int[] subtreeStart,
            bool[] touchesRemovedGate,
            List<ushort> traversalOrder,
            ref int time)
        {
            discovery[vertex] = ++time;
            low[vertex] = discovery[vertex];
            subtreeSize[vertex] = 1;
            subtreeStart[vertex] = traversalOrder.Count;
            touchesRemovedGate[vertex] = linkedNeighbors[vertex].Contains(removedGate);
            traversalOrder.Add(vertex);
        }

        private static IReadOnlyList<ushort> CopySubtreeSectors(
            IReadOnlyList<ushort> traversalOrder,
            int start,
            int count)
        {
            var sectors = new ushort[count];
            for (int i = 0; i < count; i++)
                sectors[i] = traversalOrder[start + i];
            Array.Sort(sectors);
            return sectors;
        }

        private static (ushort Deepest, ushort MaxDepth) CalculateMultiGateDepth(
            ushort[][] linkedNeighbors,
            IReadOnlyList<ushort> sectors,
            IReadOnlyCollection<ushort> gates)
        {
            if (sectors.Count == 0)
                return (0, 0);

            var sectorSet = new HashSet<ushort>(sectors);
            var distance = new Dictionary<ushort, ushort>();
            var queue = new Queue<ushort>();

            foreach (ushort gate in gates)
            {
                foreach (ushort neighbor in linkedNeighbors[gate])
                {
                    if (!sectorSet.Contains(neighbor) || distance.ContainsKey(neighbor))
                        continue;

                    distance[neighbor] = 1;
                    queue.Enqueue(neighbor);
                }
            }

            while (queue.Count > 0)
            {
                ushort current = queue.Dequeue();
                ushort nextDistance = (ushort)(distance[current] + 1);
                foreach (ushort neighbor in linkedNeighbors[current])
                {
                    if (!sectorSet.Contains(neighbor) || distance.ContainsKey(neighbor))
                        continue;

                    distance[neighbor] = nextDistance;
                    queue.Enqueue(neighbor);
                }
            }

            ushort deepest = sectors[0];
            ushort maxDepth = 0;
            foreach (ushort sector in sectors)
            {
                ushort sectorDepth = distance.TryGetValue(sector, out ushort value) ? value : (ushort)0;
                if (sectorDepth > maxDepth || (sectorDepth == maxDepth && sector > deepest))
                {
                    deepest = sector;
                    maxDepth = sectorDepth;
                }
            }

            return (deepest, maxDepth);
        }

        private static ushort ChooseOutsideRoot(
            ITWXDatabase database,
            ushort[][] linkedNeighbors,
            ushort excluded = 0)
        {
            DataHeader? header = (database as ModDatabase)?.DBHeader;
            ushort[] preferred =
            {
                header?.StarDock ?? 0,
                header?.Rylos ?? 0,
                header?.AlphaCentauri ?? 0,
                1,
            };

            foreach (ushort sector in preferred)
            {
                if (sector > 0 &&
                    sector != excluded &&
                    sector < linkedNeighbors.Length &&
                    linkedNeighbors[sector].Length > 0)
                {
                    return sector;
                }
            }

            for (ushort sector = 1; sector < linkedNeighbors.Length; sector++)
            {
                if (sector != excluded && linkedNeighbors[sector].Length > 0)
                    return sector;
            }

            return 0;
        }

        private static ushort[][] BuildUndirectedLinkedNeighborIndex(ITWXDatabase database, int sectorCount)
        {
            var sectors = new SectorData?[sectorCount + 1];
            var usable = new bool[sectorCount + 1];
            for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
            {
                sectors[sectorNumber] = database.LoadSector(sectorNumber) as SectorData;
                usable[sectorNumber] = sectors[sectorNumber] != null && HasUsableWarpList(sectors[sectorNumber]!);
            }

            var links = new List<ushort>[sectorCount + 1];
            for (int sectorNumber = 0; sectorNumber <= sectorCount; sectorNumber++)
                links[sectorNumber] = new List<ushort>();

            for (ushort sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
            {
                SectorData? sector = sectors[sectorNumber];
                if (sector == null || !usable[sectorNumber])
                    continue;

                for (int i = 0; i < 6; i++)
                {
                    int warp = sector.Warp[i];
                    if (warp == 0)
                        break;

                    if (warp <= sectorCount && usable[warp])
                        AddUndirectedLink(links, sectorNumber, (ushort)warp);
                }

                foreach (int warpIn in sector.WarpsIn)
                {
                    if (warpIn > 0 && warpIn <= sectorCount && usable[warpIn])
                        AddUndirectedLink(links, sectorNumber, (ushort)warpIn);
                }
            }

            var neighbors = new ushort[sectorCount + 1][];
            for (int sectorNumber = 0; sectorNumber <= sectorCount; sectorNumber++)
            {
                links[sectorNumber].Sort();
                neighbors[sectorNumber] = links[sectorNumber].ToArray();
            }

            return neighbors;
        }

        private static void AddUndirectedLink(List<ushort>[] links, ushort first, ushort second)
        {
            if (first == second)
                return;

            if (!links[first].Contains(second))
                links[first].Add(second);
            if (!links[second].Contains(first))
                links[second].Add(first);
        }

        private static string BuildSectorSetKey(IReadOnlyList<ushort> sectors)
        {
            return string.Join(",", sectors.OrderBy(sector => sector));
        }

        private static IReadOnlyList<ushort> FindBoundaryGates(
            ITWXDatabase database,
            IReadOnlyList<ushort> sectors,
            ushort fallbackGate)
        {
            var interior = new HashSet<ushort>(sectors);
            var gates = new SortedSet<ushort>();
            AddGateIfValid(database, interior, gates, fallbackGate);

            foreach (ushort sectorNumber in sectors)
            {
                if (database.LoadSector(sectorNumber) is not SectorData sector)
                    continue;

                for (int i = 0; i < 6; i++)
                {
                    int warp = sector.Warp[i];
                    if (warp == 0)
                        break;

                    if (warp <= ushort.MaxValue)
                        AddGateIfValid(database, interior, gates, (ushort)warp);
                }

                foreach (int warpIn in sector.WarpsIn)
                    if (warpIn <= ushort.MaxValue)
                        AddGateIfValid(database, interior, gates, (ushort)warpIn);
            }

            return gates.Count > 0 ? gates.ToArray() : new[] { fallbackGate };
        }

        private static void AddGateIfValid(
            ITWXDatabase database,
            HashSet<ushort> interior,
            SortedSet<ushort> gates,
            ushort candidate)
        {
            if (candidate == 0 || interior.Contains(candidate))
                return;

            Sector? sector = database.LoadSector(candidate);
            if (sector == null || !HasUsableWarpList(sector))
                return;

            gates.Add(candidate);
        }

        #endregion
    }
}
