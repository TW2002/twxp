using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using TWXProxy.Core;

namespace TWXCourseBench;

internal static class Program
{
    private const int DefaultSamples = 10000;
    private const int DefaultSeed = 12345;
    private const int DefaultDiffExamples = 5;
    private const int AllCoursesSourceChecks = 4;
    private const int AllCoursesDestinationChecksPerSource = 32;
    private const int AllCoursesComparisonSources = 4;
    private const int DistanceChecks = 2000;
    private const int WarpChecks = 500;
    private const int WarpBenchmarkChecks = 2000;

    private static int Main(string[] args)
    {
        try
        {
            var options = ParseArgs(args);
            if (options.ShowHelp)
            {
                PrintUsage();
                return 0;
            }

            List<string> databasePaths = ResolveDatabasePaths(options.DatabasePaths);
            if (databasePaths.Count == 0)
            {
                Console.Error.WriteLine("No .xdb files found to benchmark.");
                return 1;
            }

            foreach (string dbPath in databasePaths)
            {
                BenchmarkDatabase(dbPath, options.Samples, options.Seed, options.DiffExamples);
                Console.WriteLine();
            }

            return 0;
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            Console.Error.WriteLine();
            PrintUsage();
            return 2;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Benchmark failed: {ex}");
            return 1;
        }
    }

    private static void BenchmarkDatabase(string dbPath, int sampleCount, int seed, int diffExamples)
    {
        using var db = new ModDatabase { ProgramDir = SharedPaths.ProgramDir };
        db.OpenDatabase(dbPath);
        int sectorCount = NormalizeDatabaseUniverseSize(db);
        Console.WriteLine($"effective sector count: {sectorCount}");
        var graph = PreparedGraph.FromDatabase(db);
        var hotRunner = new PascalHotRunner(graph);
        var allCoursesHotBuilder = new PascalAllCoursesHotBuilder(graph);
        var reverseDistanceRunner = new ReverseDistanceRunner(graph);
        var candidates = Enumerable.Range(1, sectorCount)
            .Where(i => graph.Outbound[i].Length > 0)
            .ToArray();

        if (candidates.Length < 2)
        {
            Console.WriteLine($"DB={db.DatabaseName} path={dbPath}");
            Console.WriteLine("  insufficient connected sectors to benchmark");
            return;
        }

        var rng = new Random(unchecked(seed + db.DatabaseName.GetHashCode()));
        var pairs = new List<(int From, int To)>(sampleCount);
        for (int i = 0; i < sampleCount; i++)
        {
            int from = candidates[rng.Next(candidates.Length)];
            int to = candidates[rng.Next(candidates.Length)];
            while (to == from)
                to = candidates[rng.Next(candidates.Length)];

            pairs.Add((from, to));
        }

        WarmUp(db, hotRunner, pairs);

        var (pascalMs, pascalResults) = TimeAlgorithm(pairs, pair => db.CalculatePascalShortestPath(pair.From, pair.To));
        var (hotMs, hotResults) = TimeAlgorithm(pairs, pair => hotRunner.FindPath(pair.From, pair.To));
        var (bidirectionalMs, bidirectionalResults) = TimeAlgorithm(pairs, pair => db.CalculateBidirectionalShortestPath(pair.From, pair.To));
        var (dijkstraMs, dijkstraResults) = TimeAlgorithm(pairs, pair => db.CalculateShortestPath(pair.From, pair.To));

        ComparisonStats hotStats = CompareAgainstBaseline("hot-bfs", pairs, pascalResults, hotResults, diffExamples);
        ComparisonStats bidirectionalStats = CompareAgainstBaseline("bidirectional-bfs", pairs, pascalResults, bidirectionalResults, diffExamples);
        ComparisonStats dijkstraStats = CompareAgainstBaseline("dijkstra", pairs, pascalResults, dijkstraResults, diffExamples);
        AllCoursesComparisonStats allCoursesStats = CompareAllCoursesImplementations(db, candidates, allCoursesHotBuilder, seed, diffExamples);
        ApiConsistencyStats apiStats = ValidateCourseApis(db, candidates, pairs, seed, diffExamples);
        WarpHelperBenchmarkStats warpBenchmarkStats = BenchmarkWarpHelperAlgorithms(db, reverseDistanceRunner, pairs, diffExamples);

        Console.WriteLine($"DB={db.DatabaseName} path={dbPath}");
        Console.WriteLine($"  candidate sectors with warps: {candidates.Length}");
        Console.WriteLine($"  sampled pairs: {pairs.Count}");
        Console.WriteLine($"  runtime pascal bfs: {pascalMs:F2} ms ({pascalMs / pairs.Count:F4} ms/query)");
        Console.WriteLine($"  hot bfs prototype:  {hotMs:F2} ms ({hotMs / pairs.Count:F4} ms/query) [{DescribeRelative(hotMs, pascalMs)}]");
        PrintComparison(hotStats);
        Console.WriteLine($"  bidirectional bfs:  {bidirectionalMs:F2} ms ({bidirectionalMs / pairs.Count:F4} ms/query) [{DescribeRelative(bidirectionalMs, pascalMs)}]");
        PrintComparison(bidirectionalStats);
        Console.WriteLine($"  dijkstra:           {dijkstraMs:F2} ms ({dijkstraMs / pairs.Count:F4} ms/query) [{DescribeRelative(dijkstraMs, pascalMs)}]");
        PrintComparison(dijkstraStats);
        PrintAllCoursesComparison(allCoursesStats);
        PrintApiConsistency(apiStats);
        PrintWarpHelperBenchmark(warpBenchmarkStats);
    }

    private static void WarmUp(
        ModDatabase db,
        PascalHotRunner hotRunner,
        IReadOnlyList<(int From, int To)> pairs)
    {
        int count = Math.Min(100, pairs.Count);
        for (int i = 0; i < count; i++)
        {
            var pair = pairs[i];
            _ = db.CalculatePascalShortestPath(pair.From, pair.To);
            _ = hotRunner.FindPath(pair.From, pair.To);
            _ = db.CalculateBidirectionalShortestPath(pair.From, pair.To);
            _ = db.CalculateShortestPath(pair.From, pair.To);
        }
    }

    private static (double ElapsedMs, List<List<int>> Results) TimeAlgorithm(
        IReadOnlyList<(int From, int To)> pairs,
        Func<(int From, int To), List<int>> algorithm)
    {
        var results = new List<List<int>>(pairs.Count);
        var sw = Stopwatch.StartNew();
        for (int i = 0; i < pairs.Count; i++)
            results.Add(algorithm(pairs[i]));
        sw.Stop();
        return (sw.Elapsed.TotalMilliseconds, results);
    }

    private static bool PathsEqual(IReadOnlyList<int> left, IReadOnlyList<int> right)
    {
        if (left.Count != right.Count)
            return false;

        for (int i = 0; i < left.Count; i++)
        {
            if (left[i] != right[i])
                return false;
        }

        return true;
    }

    private static string PathToString(IReadOnlyList<int> path)
        => path.Count == 0 ? "<none>" : string.Join(">", path.Select(v => v.ToString(CultureInfo.InvariantCulture)));

    private static void AddExample(List<string> examples, int limit, string example)
    {
        if (examples.Count < limit)
            examples.Add(example);
    }

    private static int NormalizeDatabaseUniverseSize(ModDatabase db)
    {
        int maxSector = GetLoadedMaxSector(db);
        if (db.DBHeader.Sectors >= maxSector && db.DBHeader.Sectors > 0)
            return db.DBHeader.Sectors;

        var header = db.DBHeader;
        header.Sectors = maxSector;
        db.UpdateHeader(header);
        return maxSector;
    }

    private static int GetLoadedMaxSector(ModDatabase db)
    {
        var sectorsField = typeof(ModDatabase).GetField("_sectors", BindingFlags.Instance | BindingFlags.NonPublic);
        if (sectorsField?.GetValue(db) is not ConcurrentDictionary<int, SectorData> sectors || sectors.IsEmpty)
            throw new InvalidOperationException("Could not determine loaded sector range for benchmark.");

        return sectors.Keys.Max();
    }

    private static ComparisonStats CompareAgainstBaseline(
        string name,
        IReadOnlyList<(int From, int To)> pairs,
        IReadOnlyList<List<int>> baselineResults,
        IReadOnlyList<List<int>> candidateResults,
        int diffExamples)
    {
        var stats = new ComparisonStats(name);
        for (int i = 0; i < pairs.Count; i++)
        {
            var pair = pairs[i];
            List<int> baseline = baselineResults[i];
            List<int> candidate = candidateResults[i];

            if (PathsEqual(baseline, candidate))
                stats.ExactSamePath++;

            bool baselineReachable = baseline.Count > 0;
            bool candidateReachable = candidate.Count > 0;

            if (!baselineReachable && !candidateReachable)
            {
                stats.BothUnreachable++;
                continue;
            }

            if (baselineReachable && !candidateReachable)
            {
                stats.BaselineOnlyReachable++;
                AddExample(stats.Examples, diffExamples,
                    $"reachable mismatch {pair.From}->{pair.To}: baseline={PathToString(baseline)} candidate=<none>");
                continue;
            }

            if (!baselineReachable && candidateReachable)
            {
                stats.CandidateOnlyReachable++;
                AddExample(stats.Examples, diffExamples,
                    $"reachable mismatch {pair.From}->{pair.To}: baseline=<none> candidate={PathToString(candidate)}");
                continue;
            }

            int baselineHops = baseline.Count - 1;
            int candidateHops = candidate.Count - 1;

            if (baselineHops == candidateHops)
            {
                stats.SameHopCount++;
                if (!PathsEqual(baseline, candidate))
                {
                    AddExample(stats.Examples, diffExamples,
                        $"same distance diff route {pair.From}->{pair.To}: baseline={PathToString(baseline)} candidate={PathToString(candidate)}");
                }
            }
            else
            {
                stats.DifferentHopCount++;
                AddExample(stats.Examples, diffExamples,
                    $"different distance {pair.From}->{pair.To}: baseline={PathToString(baseline)} ({baselineHops}) candidate={PathToString(candidate)} ({candidateHops})");
            }
        }

        return stats;
    }

    private static string DescribeRelative(double candidateMs, double baselineMs)
    {
        if (candidateMs == 0)
            return "n/a";

        if (candidateMs < baselineMs)
            return $"{baselineMs / candidateMs:F2}x faster than runtime";

        if (candidateMs > baselineMs)
            return $"{candidateMs / baselineMs:F2}x slower than runtime";

        return "same speed as runtime";
    }

    private static void PrintComparison(ComparisonStats stats)
    {
        Console.WriteLine($"    exact same path: {stats.ExactSamePath}");
        Console.WriteLine($"    same hop count: {stats.SameHopCount}");
        Console.WriteLine($"    different hop count: {stats.DifferentHopCount}");
        Console.WriteLine($"    both unreachable: {stats.BothUnreachable}");
        Console.WriteLine($"    baseline-only reachable: {stats.BaselineOnlyReachable}");
        Console.WriteLine($"    candidate-only reachable: {stats.CandidateOnlyReachable}");
        Console.WriteLine($"    sample diffs for {stats.Name}:");
        if (stats.Examples.Count == 0)
            Console.WriteLine("      <none>");
        else
            foreach (string example in stats.Examples)
                Console.WriteLine($"      {example}");
    }

    private static AllCoursesComparisonStats CompareAllCoursesImplementations(
        ModDatabase db,
        IReadOnlyList<int> candidates,
        PascalAllCoursesHotBuilder hotBuilder,
        int seed,
        int diffExamples)
    {
        var stats = new AllCoursesComparisonStats();
        var rng = new Random(unchecked(seed + db.DatabaseName.GetHashCode() ^ 0x41C0A11C));
        int[] sampledSources = candidates
            .OrderBy(_ => rng.Next())
            .Take(Math.Min(AllCoursesComparisonSources, candidates.Count))
            .ToArray();

        foreach (int source in sampledSources)
        {
            stats.SourcesChecked++;

            var legacyStopwatch = Stopwatch.StartNew();
            List<List<string>> legacyCourses = BuildLegacyAllCourses(db, source);
            legacyStopwatch.Stop();
            stats.LegacyElapsedMs += legacyStopwatch.Elapsed.TotalMilliseconds;

            var currentStopwatch = Stopwatch.StartNew();
            List<List<string>> currentCourses = db.GetAllCoursesFrom(source);
            currentStopwatch.Stop();
            stats.CurrentElapsedMs += currentStopwatch.Elapsed.TotalMilliseconds;

            var hotStopwatch = Stopwatch.StartNew();
            List<List<string>> hotCourses = hotBuilder.BuildAllCourses(source);
            hotStopwatch.Stop();
            stats.HotElapsedMs += hotStopwatch.Elapsed.TotalMilliseconds;

            int entryCount = Math.Min(legacyCourses.Count, currentCourses.Count);
            for (int destination = 1; destination <= entryCount; destination++)
            {
                stats.EntriesChecked++;
                List<int> legacyRoute = ParseAllCourseEntry(legacyCourses, destination);
                List<int> currentRoute = ParseAllCourseEntry(currentCourses, destination);

                if (PathsEqual(legacyRoute, currentRoute))
                    stats.ExactSamePath++;

                bool legacyReachable = IsReachableAllCourse(source, destination, legacyRoute);
                bool currentReachable = IsReachableAllCourse(source, destination, currentRoute);

                if (!legacyReachable && !currentReachable)
                {
                    stats.BothUnreachable++;
                    continue;
                }

                if (legacyReachable && !currentReachable)
                {
                    stats.LegacyOnlyReachable++;
                    AddExample(stats.Examples, diffExamples,
                        $"getallcourses reachable mismatch {source}->{destination}: legacy={PathToString(legacyRoute)} current=<none>");
                    continue;
                }

                if (!legacyReachable && currentReachable)
                {
                    stats.CurrentOnlyReachable++;
                    AddExample(stats.Examples, diffExamples,
                        $"getallcourses reachable mismatch {source}->{destination}: legacy=<none> current={PathToString(currentRoute)}");
                    continue;
                }

                int legacyHops = legacyRoute.Count - 1;
                int currentHops = currentRoute.Count - 1;
                if (legacyHops == currentHops)
                {
                    stats.SameHopCount++;
                    if (!PathsEqual(legacyRoute, currentRoute))
                    {
                        AddExample(stats.Examples, diffExamples,
                            $"getallcourses same distance diff route {source}->{destination}: legacy={PathToString(legacyRoute)} current={PathToString(currentRoute)}");
                    }
                }
                else
                {
                    stats.DifferentHopCount++;
                    AddExample(stats.Examples, diffExamples,
                        $"getallcourses different distance {source}->{destination}: legacy={PathToString(legacyRoute)} ({legacyHops}) current={PathToString(currentRoute)} ({currentHops})");
                }
            }

            int hotEntryCount = Math.Min(legacyCourses.Count, hotCourses.Count);
            for (int destination = 1; destination <= hotEntryCount; destination++)
            {
                List<int> legacyRoute = ParseAllCourseEntry(legacyCourses, destination);
                List<int> hotRoute = ParseAllCourseEntry(hotCourses, destination);
                if (!PathsEqual(legacyRoute, hotRoute))
                {
                    stats.HotMismatches++;
                    AddExample(stats.HotExamples, diffExamples,
                        $"hot getallcourses mismatch {source}->{destination}: legacy={PathToString(legacyRoute)} hot={PathToString(hotRoute)}");
                }
                else
                {
                    stats.HotExactMatches++;
                }
            }
        }

        return stats;
    }

    private static void PrintAllCoursesComparison(AllCoursesComparisonStats stats)
    {
        Console.WriteLine("  getallcourses legacy vs current:");
        Console.WriteLine($"    sources checked: {stats.SourcesChecked}");
        Console.WriteLine($"    entries checked: {stats.EntriesChecked}");
        Console.WriteLine($"    legacy total time: {stats.LegacyElapsedMs:F2} ms");
        Console.WriteLine($"    hot bfs total time: {stats.HotElapsedMs:F2} ms");
        Console.WriteLine($"    current total time: {stats.CurrentElapsedMs:F2} ms");
        Console.WriteLine($"    hot exact matches vs legacy: {stats.HotExactMatches}");
        Console.WriteLine($"    hot mismatches vs legacy: {stats.HotMismatches}");
        Console.WriteLine($"    exact same path: {stats.ExactSamePath}");
        Console.WriteLine($"    same hop count: {stats.SameHopCount}");
        Console.WriteLine($"    different hop count: {stats.DifferentHopCount}");
        Console.WriteLine($"    both unreachable: {stats.BothUnreachable}");
        Console.WriteLine($"    legacy-only reachable: {stats.LegacyOnlyReachable}");
        Console.WriteLine($"    current-only reachable: {stats.CurrentOnlyReachable}");
        Console.WriteLine("    sample diffs:");
        if (stats.Examples.Count == 0)
            Console.WriteLine("      <none>");
        else
            foreach (string example in stats.Examples)
                Console.WriteLine($"      {example}");
        if (stats.HotExamples.Count > 0)
        {
            Console.WriteLine("    sample hot diffs:");
            foreach (string example in stats.HotExamples)
                Console.WriteLine($"      {example}");
        }
    }

    private static ApiConsistencyStats ValidateCourseApis(
        ModDatabase db,
        IReadOnlyList<int> candidates,
        IReadOnlyList<(int From, int To)> pairs,
        int seed,
        int diffExamples)
    {
        var stats = new ApiConsistencyStats();
        var rng = new Random(unchecked(seed + db.DatabaseName.GetHashCode() ^ 0x5A17C0DE));
        int[] sampledSources = candidates
            .OrderBy(_ => rng.Next())
            .Take(Math.Min(AllCoursesSourceChecks, candidates.Count))
            .ToArray();

        foreach (int source in sampledSources)
        {
            stats.AllCoursesSourcesChecked++;
            var allCoursesStopwatch = Stopwatch.StartNew();
            List<List<string>> allCourses = db.GetAllCoursesFrom(source);
            allCoursesStopwatch.Stop();
            stats.AllCoursesElapsedMs += allCoursesStopwatch.Elapsed.TotalMilliseconds;
            List<List<string>> expectedAllCourses = BuildLegacyAllCourses(db, source);
            var destinations = candidates
                .Where(candidate => candidate != source)
                .OrderBy(_ => rng.Next())
                .Take(AllCoursesDestinationChecksPerSource)
                .ToList();

            foreach (int destination in destinations)
            {
                stats.AllCoursesEntriesChecked++;
                List<int> expected = ParseAllCourseEntry(expectedAllCourses, destination);
                List<int> actual = ParseAllCourseEntry(allCourses, destination);

                if (expected.Count == 1 && expected[0] == destination)
                {
                    if (actual.Count == 1 && actual[0] == destination)
                    {
                        stats.AllCoursesUnreachableMatches++;
                    }
                    else
                    {
                        stats.AllCoursesMismatches++;
                        AddExample(stats.Examples, diffExamples,
                            $"getallcourses mismatch {source}->{destination}: expected=<none> actual={PathToString(actual)}");
                    }

                    continue;
                }

                if (PathsEqual(expected, actual))
                {
                    stats.AllCoursesExactMatches++;
                }
                else
                {
                    stats.AllCoursesMismatches++;
                    AddExample(stats.Examples, diffExamples,
                        $"getallcourses mismatch {source}->{destination}: expected={PathToString(expected)} actual={PathToString(actual)}");
                }
            }
        }

        foreach (var pair in pairs.Take(DistanceChecks))
        {
            stats.DistancePairsChecked++;
            int expected = GetExpectedDistance(db, pair.From, pair.To);
            int actual = db.GetDistance(pair.From, pair.To);
            if (expected == actual)
            {
                stats.DistanceMatches++;
            }
            else
            {
                stats.DistanceMismatches++;
                AddExample(stats.Examples, diffExamples,
                    $"getdistance mismatch {pair.From}->{pair.To}: expected={expected} actual={actual}");
            }
        }

        foreach (var pair in pairs)
        {
            if (stats.WarpPairsChecked >= WarpChecks)
                break;

            var sector = db.GetSector(pair.From);
            if (sector == null)
                continue;

            var warps = sector.Warp
                .Where(warp => warp > 0 && warp <= db.SectorCount)
                .Select(warp => (int)warp)
                .ToList();
            if (warps.Count == 0)
                continue;

            stats.WarpPairsChecked++;

            List<int> expectedSorted = warps
                .Select(warp => (warp, distance: GetExpectedDistance(db, warp, pair.To)))
                .OrderBy(item => item.distance < 0 ? int.MaxValue : item.distance)
                .ThenBy(item => item.warp)
                .Select(item => item.warp)
                .ToList();
            List<int> actualSorted = db.GetWarpsSortedByDistance(pair.From, pair.To);
            if (PathsEqual(expectedSorted, actualSorted))
            {
                stats.WarpOrderingMatches++;
            }
            else
            {
                stats.WarpOrderingMismatches++;
                AddExample(stats.Examples, diffExamples,
                    $"getwarpssortedbydistance mismatch {pair.From}->{pair.To}: expected={PathToString(expectedSorted)} actual={PathToString(actualSorted)}");
            }

            int expectedNearest = expectedSorted
                .FirstOrDefault(warp => GetExpectedDistance(db, warp, pair.To) >= 0);
            int actualNearest = db.GetNearestWarp(pair.From, pair.To);
            if (expectedNearest == actualNearest)
            {
                stats.NearestWarpMatches++;
            }
            else
            {
                stats.NearestWarpMismatches++;
                AddExample(stats.Examples, diffExamples,
                    $"getnearestwarp mismatch {pair.From}->{pair.To}: expected={expectedNearest} actual={actualNearest}");
            }
        }

        return stats;
    }

    private static void PrintApiConsistency(ApiConsistencyStats stats)
    {
        Console.WriteLine("  course api consistency:");
        Console.WriteLine($"    getallcourses sources checked: {stats.AllCoursesSourcesChecked}");
        Console.WriteLine($"    getallcourses total time: {stats.AllCoursesElapsedMs:F2} ms");
        Console.WriteLine($"    getallcourses entries checked: {stats.AllCoursesEntriesChecked}");
        Console.WriteLine($"    getallcourses exact matches: {stats.AllCoursesExactMatches}");
        Console.WriteLine($"    getallcourses unreachable matches: {stats.AllCoursesUnreachableMatches}");
        Console.WriteLine($"    getallcourses mismatches: {stats.AllCoursesMismatches}");
        Console.WriteLine($"    getdistance pairs checked: {stats.DistancePairsChecked}");
        Console.WriteLine($"    getdistance matches: {stats.DistanceMatches}");
        Console.WriteLine($"    getdistance mismatches: {stats.DistanceMismatches}");
        Console.WriteLine($"    warp helper pairs checked: {stats.WarpPairsChecked}");
        Console.WriteLine($"    getwarpssortedbydistance matches: {stats.WarpOrderingMatches}");
        Console.WriteLine($"    getwarpssortedbydistance mismatches: {stats.WarpOrderingMismatches}");
        Console.WriteLine($"    getnearestwarp matches: {stats.NearestWarpMatches}");
        Console.WriteLine($"    getnearestwarp mismatches: {stats.NearestWarpMismatches}");
        Console.WriteLine("    sample api diffs:");
        if (stats.Examples.Count == 0)
            Console.WriteLine("      <none>");
        else
            foreach (string example in stats.Examples)
                Console.WriteLine($"      {example}");
    }

    private static WarpHelperBenchmarkStats BenchmarkWarpHelperAlgorithms(
        ModDatabase db,
        ReverseDistanceRunner reverseDistanceRunner,
        IReadOnlyList<(int From, int To)> pairs,
        int diffExamples)
    {
        var stats = new WarpHelperBenchmarkStats();
        var sampledPairs = new List<(int From, int To, List<int> Warps)>();

        foreach (var pair in pairs)
        {
            if (sampledPairs.Count >= WarpBenchmarkChecks)
                break;

            var sector = db.GetSector(pair.From);
            if (sector == null)
                continue;

            var warps = sector.Warp
                .Where(warp => warp > 0 && warp <= db.SectorCount)
                .Select(warp => (int)warp)
                .ToList();
            if (warps.Count == 0)
                continue;

            sampledPairs.Add((pair.From, pair.To, warps));
        }

        var currentSortWatch = Stopwatch.StartNew();
        foreach (var sample in sampledPairs)
        {
            List<int> currentSorted = db.GetWarpsSortedByDistance(sample.From, sample.To);
            List<int> reverseSorted = reverseDistanceRunner.GetWarpsSortedByDistance(sample.Warps, sample.To);
            if (PathsEqual(currentSorted, reverseSorted))
            {
                stats.SortedMatches++;
            }
            else
            {
                stats.SortedMismatches++;
                AddExample(stats.Examples, diffExamples,
                    $"reverse sort mismatch {sample.From}->{sample.To}: current={PathToString(currentSorted)} reverse={PathToString(reverseSorted)}");
            }
        }
        currentSortWatch.Stop();
        stats.CurrentSortedElapsedMs = currentSortWatch.Elapsed.TotalMilliseconds;

        var reverseSortWatch = Stopwatch.StartNew();
        foreach (var sample in sampledPairs)
            _ = reverseDistanceRunner.GetWarpsSortedByDistance(sample.Warps, sample.To);
        reverseSortWatch.Stop();
        stats.ReverseSortedElapsedMs = reverseSortWatch.Elapsed.TotalMilliseconds;

        var currentNearestWatch = Stopwatch.StartNew();
        foreach (var sample in sampledPairs)
        {
            int currentNearest = db.GetNearestWarp(sample.From, sample.To);
            int reverseNearest = reverseDistanceRunner.GetNearestWarp(sample.Warps, sample.To);
            if (currentNearest == reverseNearest)
            {
                stats.NearestMatches++;
            }
            else
            {
                stats.NearestMismatches++;
                AddExample(stats.Examples, diffExamples,
                    $"reverse nearest mismatch {sample.From}->{sample.To}: current={currentNearest} reverse={reverseNearest}");
            }
        }
        currentNearestWatch.Stop();
        stats.CurrentNearestElapsedMs = currentNearestWatch.Elapsed.TotalMilliseconds;

        var reverseNearestWatch = Stopwatch.StartNew();
        foreach (var sample in sampledPairs)
            _ = reverseDistanceRunner.GetNearestWarp(sample.Warps, sample.To);
        reverseNearestWatch.Stop();
        stats.ReverseNearestElapsedMs = reverseNearestWatch.Elapsed.TotalMilliseconds;

        stats.PairsChecked = sampledPairs.Count;
        return stats;
    }

    private static void PrintWarpHelperBenchmark(WarpHelperBenchmarkStats stats)
    {
        Console.WriteLine("  warp helper algorithms:");
        Console.WriteLine($"    pairs checked: {stats.PairsChecked}");
        Console.WriteLine($"    current sorted total time: {stats.CurrentSortedElapsedMs:F2} ms");
        Console.WriteLine($"    reverse-bfs sorted total time: {stats.ReverseSortedElapsedMs:F2} ms");
        Console.WriteLine($"    sorted matches: {stats.SortedMatches}");
        Console.WriteLine($"    sorted mismatches: {stats.SortedMismatches}");
        Console.WriteLine($"    current nearest total time: {stats.CurrentNearestElapsedMs:F2} ms");
        Console.WriteLine($"    reverse-bfs nearest total time: {stats.ReverseNearestElapsedMs:F2} ms");
        Console.WriteLine($"    nearest matches: {stats.NearestMatches}");
        Console.WriteLine($"    nearest mismatches: {stats.NearestMismatches}");
        Console.WriteLine("    sample diffs:");
        if (stats.Examples.Count == 0)
            Console.WriteLine("      <none>");
        else
            foreach (string example in stats.Examples)
                Console.WriteLine($"      {example}");
    }

    private static int GetExpectedDistance(ModDatabase db, int fromSector, int toSector)
    {
        List<int> path = db.CalculateBidirectionalShortestPath(fromSector, toSector);
        return path.Count > 0 ? path.Count - 1 : -1;
    }

    private static bool IsReachableAllCourse(int source, int destination, IReadOnlyList<int> route)
    {
        if (route.Count == 0)
            return false;

        if (source == destination)
            return route.Count == 1 && route[0] == source;

        return route[0] == source && route[^1] == destination;
    }

    private static List<int> ParseAllCourseEntry(IReadOnlyList<List<string>> allCourses, int destination)
    {
        if (destination < 1 || destination > allCourses.Count)
            return new List<int>();

        var result = new List<int>(allCourses[destination - 1].Count);
        foreach (string step in allCourses[destination - 1])
        {
            if (int.TryParse(step, NumberStyles.Integer, CultureInfo.InvariantCulture, out int sector))
                result.Add(sector);
        }

        return result;
    }

    private static List<List<string>> BuildLegacyAllCourses(ModDatabase db, int startSector, HashSet<int>? avoidSectors = null)
    {
        var courses = new List<List<string>>();
        if (startSector < 1 || startSector > db.SectorCount)
            return courses;

        var avoids = avoidSectors ?? new HashSet<int>();
        var visited = new HashSet<int>();
        var previous = new Dictionary<int, int>();
        var queue = new Queue<int>();

        if (!avoids.Contains(startSector))
        {
            visited.Add(startSector);
            queue.Enqueue(startSector);
        }

        while (queue.Count > 0)
        {
            int currentSector = queue.Dequeue();
            var sector = db.GetSector(currentSector);
            if (sector == null)
                continue;

            foreach (var warp in sector.Warp.Where(w => w > 0 && w <= db.SectorCount))
            {
                int adjacent = warp;
                if (avoids.Contains(adjacent) || visited.Contains(adjacent))
                    continue;

                visited.Add(adjacent);
                previous[adjacent] = currentSector;
                queue.Enqueue(adjacent);
            }
        }

        for (int sectorNumber = 1; sectorNumber <= db.SectorCount; sectorNumber++)
        {
            var course = new List<string> { sectorNumber.ToString(CultureInfo.InvariantCulture) };
            int reverse = previous.TryGetValue(sectorNumber, out var prev) ? prev : 0;

            while (reverse > 0)
            {
                course.Add(reverse.ToString(CultureInfo.InvariantCulture));
                reverse = previous.TryGetValue(reverse, out prev) ? prev : 0;
            }

            course.Reverse();
            courses.Add(course);
        }

        return courses;
    }

    private static List<string> ResolveDatabasePaths(List<string> rawPaths)
    {
        if (rawPaths.Count == 0)
        {
            string dbDir = SharedPaths.DatabaseDir;
            return Directory.Exists(dbDir)
                ? Directory.GetFiles(dbDir, "*.xdb").OrderBy(path => path, StringComparer.OrdinalIgnoreCase).ToList()
                : new List<string>();
        }

        var resolved = new List<string>();
        foreach (string raw in rawPaths)
        {
            string path = Path.GetFullPath(raw);
            if (!File.Exists(path))
                throw new ArgumentException($"Database file not found: {raw}");

            resolved.Add(path);
        }

        return resolved;
    }

    private static Options ParseArgs(string[] args)
    {
        var options = new Options();

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];
            switch (arg)
            {
                case "-h":
                case "--help":
                    options.ShowHelp = true;
                    break;

                case "--samples":
                    options.Samples = ParsePositiveInt(args, ref i, "--samples");
                    break;

                case "--seed":
                    options.Seed = ParseInt(args, ref i, "--seed");
                    break;

                case "--show-diffs":
                    options.DiffExamples = ParseNonNegativeInt(args, ref i, "--show-diffs");
                    break;

                default:
                    options.DatabasePaths.Add(arg);
                    break;
            }
        }

        return options;
    }

    private static int ParsePositiveInt(string[] args, ref int index, string option)
    {
        int value = ParseInt(args, ref index, option);
        if (value <= 0)
            throw new ArgumentException($"{option} must be greater than 0.");
        return value;
    }

    private static int ParseNonNegativeInt(string[] args, ref int index, string option)
    {
        int value = ParseInt(args, ref index, option);
        if (value < 0)
            throw new ArgumentException($"{option} must be 0 or greater.");
        return value;
    }

    private static int ParseInt(string[] args, ref int index, string option)
    {
        if (index + 1 >= args.Length)
            throw new ArgumentException($"Missing value for {option}.");

        index++;
        if (!int.TryParse(args[index], NumberStyles.Integer, CultureInfo.InvariantCulture, out int value))
            throw new ArgumentException($"Invalid integer for {option}: {args[index]}");

        return value;
    }

    private static void PrintUsage()
    {
        Console.WriteLine("TWXCourseBench");
        Console.WriteLine("Benchmarks GETCOURSE-style Pascal BFS against shortest-path routing.");
        Console.WriteLine();
        Console.WriteLine("Usage:");
        Console.WriteLine("  dotnet run --project Source/TWXCourseBench/TWXCourseBench.csproj -- [options] [db1.xdb db2.xdb ...]");
        Console.WriteLine();
        Console.WriteLine("Options:");
        Console.WriteLine($"  --samples <n>      Random start/destination pairs per database (default {DefaultSamples})");
        Console.WriteLine($"  --seed <n>         Random seed base (default {DefaultSeed})");
        Console.WriteLine($"  --show-diffs <n>   Number of sample route differences to print (default {DefaultDiffExamples})");
        Console.WriteLine("  --help             Show this help");
        Console.WriteLine();
        Console.WriteLine("If no database paths are provided, the tool scans SharedPaths.DatabaseDir for *.xdb files.");
    }

    private sealed class Options
    {
        public bool ShowHelp { get; set; }
        public int Samples { get; set; } = DefaultSamples;
        public int Seed { get; set; } = DefaultSeed;
        public int DiffExamples { get; set; } = DefaultDiffExamples;
        public List<string> DatabasePaths { get; } = new();
    }

    private sealed class ComparisonStats
    {
        public ComparisonStats(string name)
        {
            Name = name;
        }

        public string Name { get; }
        public int ExactSamePath { get; set; }
        public int SameHopCount { get; set; }
        public int DifferentHopCount { get; set; }
        public int BothUnreachable { get; set; }
        public int BaselineOnlyReachable { get; set; }
        public int CandidateOnlyReachable { get; set; }
        public List<string> Examples { get; } = new();
    }

    private sealed class ApiConsistencyStats
    {
        public int AllCoursesSourcesChecked { get; set; }
        public double AllCoursesElapsedMs { get; set; }
        public int AllCoursesEntriesChecked { get; set; }
        public int AllCoursesExactMatches { get; set; }
        public int AllCoursesUnreachableMatches { get; set; }
        public int AllCoursesMismatches { get; set; }
        public int DistancePairsChecked { get; set; }
        public int DistanceMatches { get; set; }
        public int DistanceMismatches { get; set; }
        public int WarpPairsChecked { get; set; }
        public int WarpOrderingMatches { get; set; }
        public int WarpOrderingMismatches { get; set; }
        public int NearestWarpMatches { get; set; }
        public int NearestWarpMismatches { get; set; }
        public List<string> Examples { get; } = new();
    }

    private sealed class AllCoursesComparisonStats
    {
        public int SourcesChecked { get; set; }
        public int EntriesChecked { get; set; }
        public double LegacyElapsedMs { get; set; }
        public double HotElapsedMs { get; set; }
        public double CurrentElapsedMs { get; set; }
        public int HotExactMatches { get; set; }
        public int HotMismatches { get; set; }
        public int ExactSamePath { get; set; }
        public int SameHopCount { get; set; }
        public int DifferentHopCount { get; set; }
        public int BothUnreachable { get; set; }
        public int LegacyOnlyReachable { get; set; }
        public int CurrentOnlyReachable { get; set; }
        public List<string> Examples { get; } = new();
        public List<string> HotExamples { get; } = new();
    }

    private sealed class WarpHelperBenchmarkStats
    {
        public int PairsChecked { get; set; }
        public double CurrentSortedElapsedMs { get; set; }
        public double ReverseSortedElapsedMs { get; set; }
        public int SortedMatches { get; set; }
        public int SortedMismatches { get; set; }
        public double CurrentNearestElapsedMs { get; set; }
        public double ReverseNearestElapsedMs { get; set; }
        public int NearestMatches { get; set; }
        public int NearestMismatches { get; set; }
        public List<string> Examples { get; } = new();
    }

    private sealed class PreparedGraph
    {
        private PreparedGraph(int sectorCount, int[][] outbound, int[][] inbound)
        {
            SectorCount = sectorCount;
            Outbound = outbound;
            Inbound = inbound;
        }

        public int SectorCount { get; }
        public int[][] Outbound { get; }
        public int[][] Inbound { get; }

        public static PreparedGraph FromDatabase(ModDatabase db)
        {
            int sectorCount = db.SectorCount;
            var outbound = new int[sectorCount + 1][];
            var inboundLists = new List<int>[sectorCount + 1];

            for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
            {
                var sector = db.GetSector(sectorNumber);
                if (sector == null)
                {
                    outbound[sectorNumber] = Array.Empty<int>();
                    continue;
                }

                var warps = sector.Warp
                    .Where(warp => warp > 0 && warp <= sectorCount)
                    .Select(warp => (int)warp)
                    .ToArray();

                outbound[sectorNumber] = warps;
                foreach (int warp in warps)
                {
                    inboundLists[warp] ??= new List<int>(4);
                    inboundLists[warp].Add(sectorNumber);
                }
            }

            var inbound = new int[sectorCount + 1][];
            for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
                inbound[sectorNumber] = inboundLists[sectorNumber]?.ToArray() ?? Array.Empty<int>();

            return new PreparedGraph(sectorCount, outbound, inbound);
        }
    }

    private sealed class PascalHotRunner
    {
        private readonly PreparedGraph _graph;
        private readonly int[] _visitStamp;
        private readonly int[] _previous;
        private readonly int[] _queue;
        private int _stamp;

        public PascalHotRunner(PreparedGraph graph)
        {
            _graph = graph;
            _visitStamp = new int[graph.SectorCount + 1];
            _previous = new int[graph.SectorCount + 1];
            _queue = new int[graph.SectorCount + 1];
        }

        public List<int> FindPath(int fromSector, int toSector)
        {
            if (fromSector < 1 || fromSector > _graph.SectorCount ||
                toSector < 1 || toSector > _graph.SectorCount)
            {
                return new List<int>();
            }

            if (fromSector == toSector)
                return new List<int> { fromSector };

            int stamp = NextStamp();
            int head = 0;
            int tail = 0;

            _visitStamp[fromSector] = stamp;
            _previous[fromSector] = 0;
            _queue[tail++] = fromSector;

            while (head < tail)
            {
                int focus = _queue[head++];
                int[] warps = _graph.Outbound[focus];
                for (int i = 0; i < warps.Length; i++)
                {
                    int adjacent = warps[i];
                    if (_visitStamp[adjacent] == stamp)
                        continue;

                    _previous[adjacent] = focus;
                    if (adjacent == toSector)
                        return ReconstructPath(fromSector, adjacent);

                    _visitStamp[adjacent] = stamp;
                    _queue[tail++] = adjacent;
                }
            }

            return new List<int>();
        }

        private List<int> ReconstructPath(int fromSector, int toSector)
        {
            var result = new List<int>();
            int current = toSector;
            while (current > 0)
            {
                result.Add(current);
                current = _previous[current];
            }

            result.Reverse();
            return result.Count > 0 && result[0] == fromSector ? result : new List<int>();
        }

        private int NextStamp()
        {
            _stamp++;
            if (_stamp != int.MaxValue)
                return _stamp;

            Array.Clear(_visitStamp, 0, _visitStamp.Length);
            _stamp = 1;
            return _stamp;
        }
    }

    private sealed class PascalAllCoursesHotBuilder
    {
        private readonly PreparedGraph _graph;
        private readonly int[] _visitStamp;
        private readonly int[] _previous;
        private readonly int[] _queue;
        private int _stamp;

        public PascalAllCoursesHotBuilder(PreparedGraph graph)
        {
            _graph = graph;
            _visitStamp = new int[graph.SectorCount + 1];
            _previous = new int[graph.SectorCount + 1];
            _queue = new int[graph.SectorCount + 1];
        }

        public List<List<string>> BuildAllCourses(int startSector)
        {
            if (startSector < 1 || startSector > _graph.SectorCount)
                return new List<List<string>>();

            int stamp = NextStamp();
            int head = 0;
            int tail = 0;

            _visitStamp[startSector] = stamp;
            _previous[startSector] = 0;
            _queue[tail++] = startSector;

            while (head < tail)
            {
                int focus = _queue[head++];
                int[] warps = _graph.Outbound[focus];
                for (int i = 0; i < warps.Length; i++)
                {
                    int adjacent = warps[i];
                    if (_visitStamp[adjacent] == stamp)
                        continue;

                    _visitStamp[adjacent] = stamp;
                    _previous[adjacent] = focus;
                    _queue[tail++] = adjacent;
                }
            }

            var courses = new List<List<string>>(_graph.SectorCount);
            for (int sectorNumber = 1; sectorNumber <= _graph.SectorCount; sectorNumber++)
            {
                if (sectorNumber == startSector)
                {
                    courses.Add(new List<string> { startSector.ToString(CultureInfo.InvariantCulture) });
                }
                else if (_visitStamp[sectorNumber] != stamp)
                {
                    courses.Add(new List<string> { sectorNumber.ToString(CultureInfo.InvariantCulture) });
                }
                else
                {
                    courses.Add(ReconstructCourse(startSector, sectorNumber));
                }
            }

            return courses;
        }

        private List<string> ReconstructCourse(int startSector, int destination)
        {
            var reversed = new List<int>();
            int current = destination;
            while (current > 0)
            {
                reversed.Add(current);
                current = _previous[current];
            }

            reversed.Reverse();
            if (reversed.Count == 0 || reversed[0] != startSector)
                return new List<string> { destination.ToString(CultureInfo.InvariantCulture) };

            return reversed
                .Select(sector => sector.ToString(CultureInfo.InvariantCulture))
                .ToList();
        }

        private int NextStamp()
        {
            _stamp++;
            if (_stamp != int.MaxValue)
                return _stamp;

            Array.Clear(_visitStamp, 0, _visitStamp.Length);
            _stamp = 1;
            return _stamp;
        }
    }

    private sealed class ReverseDistanceRunner
    {
        private readonly PreparedGraph _graph;
        private readonly int[] _visitStamp;
        private readonly int[] _distance;
        private readonly int[] _queue;
        private int _stamp;

        public ReverseDistanceRunner(PreparedGraph graph)
        {
            _graph = graph;
            _visitStamp = new int[graph.SectorCount + 1];
            _distance = new int[graph.SectorCount + 1];
            _queue = new int[graph.SectorCount + 1];
        }

        public List<int> GetWarpsSortedByDistance(IReadOnlyList<int> warps, int targetSector)
        {
            var scores = ScoreWarps(warps, targetSector);
            return scores
                .OrderBy(item => item.distance < 0 ? int.MaxValue : item.distance)
                .ThenBy(item => item.warp)
                .Select(item => item.warp)
                .ToList();
        }

        public int GetNearestWarp(IReadOnlyList<int> warps, int targetSector)
        {
            var scores = ScoreWarps(warps, targetSector);
            int bestWarp = 0;
            int bestDistance = int.MaxValue;

            for (int i = 0; i < scores.Count; i++)
            {
                var score = scores[i];
                if (score.distance >= 0 && score.distance < bestDistance)
                {
                    bestDistance = score.distance;
                    bestWarp = score.warp;
                }
            }

            return bestWarp;
        }

        private List<(int warp, int distance)> ScoreWarps(IReadOnlyList<int> warps, int targetSector)
        {
            var results = new List<(int warp, int distance)>(warps.Count);
            if (targetSector < 1 || targetSector > _graph.SectorCount)
            {
                for (int i = 0; i < warps.Count; i++)
                    results.Add((warps[i], -1));
                return results;
            }

            int[] distances = new int[warps.Count];
            Array.Fill(distances, -1);
            int unresolved = warps.Count;
            for (int i = 0; i < warps.Count; i++)
            {
                if (warps[i] == targetSector)
                {
                    distances[i] = 0;
                    unresolved--;
                }
            }

            if (unresolved > 0)
            {
                int stamp = NextStamp();
                int head = 0;
                int tail = 0;

                _visitStamp[targetSector] = stamp;
                _distance[targetSector] = 0;
                _queue[tail++] = targetSector;

                while (head < tail && unresolved > 0)
                {
                    int focus = _queue[head++];
                    int nextDistance = _distance[focus] + 1;
                    int[] inbound = _graph.Inbound[focus];
                    for (int i = 0; i < inbound.Length; i++)
                    {
                        int previous = inbound[i];
                        if (_visitStamp[previous] == stamp)
                            continue;

                        _visitStamp[previous] = stamp;
                        _distance[previous] = nextDistance;
                        _queue[tail++] = previous;

                        for (int warpIndex = 0; warpIndex < warps.Count; warpIndex++)
                        {
                            if (distances[warpIndex] < 0 && warps[warpIndex] == previous)
                            {
                                distances[warpIndex] = nextDistance;
                                unresolved--;
                            }
                        }
                    }
                }
            }

            for (int i = 0; i < warps.Count; i++)
                results.Add((warps[i], distances[i]));
            return results;
        }

        private int NextStamp()
        {
            _stamp++;
            if (_stamp != int.MaxValue)
                return _stamp;

            Array.Clear(_visitStamp, 0, _visitStamp.Length);
            _stamp = 1;
            return _stamp;
        }
    }

    private sealed class BidirectionalRunner
    {
        private readonly PreparedGraph _graph;
        private readonly int[] _visitStampForward;
        private readonly int[] _visitStampBackward;
        private readonly int[] _distanceForward;
        private readonly int[] _distanceBackward;
        private readonly int[] _previousForward;
        private readonly int[] _nextBackward;
        private readonly int[] _queueForward;
        private readonly int[] _queueBackward;
        private int _stamp;

        public BidirectionalRunner(PreparedGraph graph)
        {
            _graph = graph;
            int size = graph.SectorCount + 1;
            _visitStampForward = new int[size];
            _visitStampBackward = new int[size];
            _distanceForward = new int[size];
            _distanceBackward = new int[size];
            _previousForward = new int[size];
            _nextBackward = new int[size];
            _queueForward = new int[size];
            _queueBackward = new int[size];
        }

        public List<int> FindPath(int fromSector, int toSector)
        {
            if (fromSector < 1 || fromSector > _graph.SectorCount ||
                toSector < 1 || toSector > _graph.SectorCount)
            {
                return new List<int>();
            }

            if (fromSector == toSector)
                return new List<int> { fromSector };

            int stamp = NextStamp();
            int headForward = 0;
            int tailForward = 0;
            int headBackward = 0;
            int tailBackward = 0;
            int bestMeet = 0;
            int bestDistance = int.MaxValue;

            _visitStampForward[fromSector] = stamp;
            _distanceForward[fromSector] = 0;
            _previousForward[fromSector] = 0;
            _queueForward[tailForward++] = fromSector;

            _visitStampBackward[toSector] = stamp;
            _distanceBackward[toSector] = 0;
            _nextBackward[toSector] = 0;
            _queueBackward[tailBackward++] = toSector;

            while (headForward < tailForward && headBackward < tailBackward)
            {
                if ((tailForward - headForward) <= (tailBackward - headBackward))
                {
                    ExpandForwardLevel(stamp, ref headForward, ref tailForward, ref bestMeet, ref bestDistance);
                }
                else
                {
                    ExpandBackwardLevel(stamp, ref headBackward, ref tailBackward, ref bestMeet, ref bestDistance);
                }

                if (bestMeet == 0)
                    continue;

                int forwardFront = headForward < tailForward ? _distanceForward[_queueForward[headForward]] : int.MaxValue / 4;
                int backwardFront = headBackward < tailBackward ? _distanceBackward[_queueBackward[headBackward]] : int.MaxValue / 4;
                if ((long)forwardFront + backwardFront >= bestDistance)
                    break;
            }

            return bestMeet == 0 ? new List<int>() : ReconstructPath(fromSector, toSector, bestMeet);
        }

        private void ExpandForwardLevel(int stamp, ref int head, ref int tail, ref int bestMeet, ref int bestDistance)
        {
            int levelDistance = _distanceForward[_queueForward[head]];
            while (head < tail && _distanceForward[_queueForward[head]] == levelDistance)
            {
                int current = _queueForward[head++];
                int[] warps = _graph.Outbound[current];
                for (int i = 0; i < warps.Length; i++)
                {
                    int adjacent = warps[i];
                    if (_visitStampForward[adjacent] == stamp)
                        continue;

                    _visitStampForward[adjacent] = stamp;
                    _distanceForward[adjacent] = levelDistance + 1;
                    _previousForward[adjacent] = current;
                    _queueForward[tail++] = adjacent;

                    if (_visitStampBackward[adjacent] == stamp)
                    {
                        int totalDistance = _distanceForward[adjacent] + _distanceBackward[adjacent];
                        if (totalDistance < bestDistance)
                        {
                            bestDistance = totalDistance;
                            bestMeet = adjacent;
                        }
                    }
                }
            }
        }

        private void ExpandBackwardLevel(int stamp, ref int head, ref int tail, ref int bestMeet, ref int bestDistance)
        {
            int levelDistance = _distanceBackward[_queueBackward[head]];
            while (head < tail && _distanceBackward[_queueBackward[head]] == levelDistance)
            {
                int current = _queueBackward[head++];
                int[] inbound = _graph.Inbound[current];
                for (int i = 0; i < inbound.Length; i++)
                {
                    int previous = inbound[i];
                    if (_visitStampBackward[previous] == stamp)
                        continue;

                    _visitStampBackward[previous] = stamp;
                    _distanceBackward[previous] = levelDistance + 1;
                    _nextBackward[previous] = current;
                    _queueBackward[tail++] = previous;

                    if (_visitStampForward[previous] == stamp)
                    {
                        int totalDistance = _distanceForward[previous] + _distanceBackward[previous];
                        if (totalDistance < bestDistance)
                        {
                            bestDistance = totalDistance;
                            bestMeet = previous;
                        }
                    }
                }
            }
        }

        private List<int> ReconstructPath(int fromSector, int toSector, int meetSector)
        {
            var result = new List<int>();
            int current = meetSector;
            while (current > 0)
            {
                result.Add(current);
                current = _previousForward[current];
            }

            result.Reverse();
            if (result.Count == 0 || result[0] != fromSector)
                return new List<int>();

            current = _nextBackward[meetSector];
            while (current > 0)
            {
                result.Add(current);
                current = _nextBackward[current];
            }

            return result.Count > 0 && result[^1] == toSector ? result : new List<int>();
        }

        private int NextStamp()
        {
            _stamp++;
            if (_stamp != int.MaxValue)
                return _stamp;

            Array.Clear(_visitStampForward, 0, _visitStampForward.Length);
            Array.Clear(_visitStampBackward, 0, _visitStampBackward.Length);
            _stamp = 1;
            return _stamp;
        }
    }
}
