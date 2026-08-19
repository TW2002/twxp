using System.Buffers.Binary;
using System.Net;
using System.Text;

namespace TWXProxy.Core;

public sealed record RunningScriptInfo(
    int Id,
    string Name,
    string Reference,
    bool IsSystemScript,
    bool IsBot,
    bool Paused);

public sealed record TwxImportResult(
    int ImportedSectorRecords,
    int ExpectedSectorRecords,
    bool WasTruncated,
    int SkippedInvalidWarps);

/// <summary>
/// Shared proxy-side operational helpers used by both the standalone UI and MTC.
/// The goal is to keep import/export/script-control behavior in one place rather
/// than re-implementing it separately in each frontend.
/// </summary>
public static class ProxyGameOperations
{
    private const int TwxHeaderSize = 256;
    private const int TwxSectorRecordSize = 96;

    private readonly record struct BubbleCacheKey(ModDatabase Database, long ChangeStamp, int MaxBubbleSize, int MaxGateCount, bool AllowSeparatedByGates);
    private readonly record struct DeadEndCacheKey(ModDatabase Database, long ChangeStamp, int MaxDeadEndSize);
    private readonly record struct TunnelCacheKey(ModDatabase Database, long ChangeStamp, int MaxTunnelSize);

    private static readonly object FinderCacheLock = new();
    private static BubbleCacheKey? _lastBubbleCacheKey;
    private static IReadOnlyList<BubbleInfo> _lastBubbleCache = Array.Empty<BubbleInfo>();
    private static DeadEndCacheKey? _lastDeadEndCacheKey;
    private static IReadOnlyList<DeadEndInfo> _lastDeadEndCache = Array.Empty<DeadEndInfo>();
    private static TunnelCacheKey? _lastTunnelCacheKey;
    private static IReadOnlyList<TunnelInfo> _lastTunnelCache = Array.Empty<TunnelInfo>();

    private static bool ShouldKeepFinderCache(int maxSize)
        => maxSize <= ModBubble.DefaultMaxBubbleSize;

    public static IReadOnlyList<RunningScriptInfo> GetRunningScripts(ModInterpreter? interpreter)
    {
        if (interpreter == null)
            return Array.Empty<RunningScriptInfo>();

        var scripts = new List<RunningScriptInfo>(interpreter.Count);
        for (int i = 0; i < interpreter.Count; i++)
        {
            var script = interpreter.GetScript(i);
            if (script == null)
                continue;

            scripts.Add(new RunningScriptInfo(
                i,
                script.ScriptName,
                script.Compiler?.ScriptFile ?? script.LoadEventName ?? script.ScriptName,
                script.System,
                script.IsBot,
                script.Paused));
        }

        return scripts;
    }

    public static ScriptDebuggerSnapshot? GetScriptDebuggerSnapshot(ModInterpreter? interpreter, int scriptId)
    {
        if (interpreter == null)
            return null;

        var script = interpreter.GetScript(scriptId);
        if (script == null)
            return null;

        return new ScriptDebuggerSnapshot(
            scriptId,
            script.ScriptName,
            script.Compiler?.ScriptFile ?? script.LoadEventName ?? script.ScriptName,
            script.System,
            script.IsBot,
            script.Paused,
            script.PausedReason,
            script.WaitingForInput,
            script.WaitingForAuth,
            script.WaitForActive,
            script.KeypressMode,
            script.SubStackDepth,
            script.WaitText,
            script.LastExecutionTicks,
            script.LastExecutionCommandCount,
            script.LastExecutionResolvedParamCount,
            script.LastExecutionUsedPrepared,
            script.LastExecutionCompleted,
            script.GetVariableSnapshot(),
            script.GetTriggerSnapshot());
    }

    public static void LoadScript(ModInterpreter interpreter, string scriptPath)
    {
        if (interpreter == null)
            throw new ArgumentNullException(nameof(interpreter));
        if (string.IsNullOrWhiteSpace(scriptPath))
            throw new ArgumentException("Script path is required.", nameof(scriptPath));

        interpreter.Load(scriptPath.Trim(), false);
    }

    public static bool StopScriptById(ModInterpreter? interpreter, int scriptId)
    {
        if (interpreter == null)
            return false;

        var script = interpreter.GetScript(scriptId);
        if (script == null)
            return false;

        interpreter.StopByHandle(script);
        return true;
    }

    public static bool StopScriptByName(ModInterpreter? interpreter, string scriptName)
    {
        if (interpreter == null || string.IsNullOrWhiteSpace(scriptName))
            return false;

        for (int i = 0; i < interpreter.Count; i++)
        {
            var script = interpreter.GetScript(i);
            if (script == null)
                continue;

            string runningReference = script.Compiler?.ScriptFile ?? script.LoadEventName ?? script.ScriptName;
            bool matchesProgramDir = ModInterpreter.ScriptReferencesMatch(runningReference, scriptName, interpreter.ProgramDir, interpreter.ScriptDirectory);
            bool matchesScriptDir = ModInterpreter.ScriptReferencesMatch(runningReference, scriptName, interpreter.ScriptDirectory, interpreter.ScriptDirectory);
            if (matchesProgramDir || matchesScriptDir)
            {
                interpreter.StopByHandle(script);
                return true;
            }
        }

        return false;
    }

    public static bool PauseScriptById(ModInterpreter? interpreter, int scriptId)
    {
        if (interpreter == null)
            return false;

        var script = interpreter.GetScript(scriptId);
        if (script == null)
            return false;

        script.Pause();
        return true;
    }

    public static bool ResumeScriptById(ModInterpreter? interpreter, int scriptId)
    {
        if (interpreter == null)
            return false;

        var script = interpreter.GetScript(scriptId);
        if (script == null)
            return false;

        script.Resume();
        return true;
    }

    public static void StopAllScripts(ModInterpreter? interpreter, bool includeSystemScripts)
    {
        interpreter?.StopAll(includeSystemScripts);
    }

    public static void ForceStopAllScripts(ModInterpreter? interpreter, bool includeSystemScripts)
    {
        interpreter?.ForceStopAll(includeSystemScripts);
    }

    public static void ForceStopInterruptibleScripts(ModInterpreter? interpreter)
    {
        interpreter?.ForceStopInterruptible();
    }

    public static void ExportWarps(ModDatabase database, string outputPath)
    {
        EnsureOpenDatabase(database);
        EnsureParentDirectory(outputPath);

        int width = database.DBHeader.Sectors.ToString().Length + 1;
        using var writer = new StreamWriter(outputPath, false, Encoding.ASCII);
        writer.WriteLine(":");

        for (int i = 1; i <= database.DBHeader.Sectors; i++)
        {
            var sector = database.GetSector(i);
            if (sector == null)
                continue;

            var warps = sector.Warp.Where(w => w > 0).ToArray();
            if (warps.Length == 0)
                continue;

            var line = new StringBuilder();
            line.Append(i);
            line.Append(Utility.GetSpace(width - i.ToString().Length));

            for (int index = 0; index < warps.Length; index++)
            {
                if (index > 0)
                {
                    int prevWidth = warps[index - 1].ToString().Length;
                    line.Append(Utility.GetSpace(width - prevWidth));
                }

                line.Append(warps[index]);
            }

            writer.WriteLine(line.ToString());
        }

        writer.WriteLine(":");
    }

    public static int ImportWarps(ModDatabase database, string inputPath)
    {
        EnsureOpenDatabase(database);
        if (!File.Exists(inputPath))
            throw new FileNotFoundException("Warp import file not found.", inputPath);

        int imported = 0;
        var changedSectors = new List<SectorData>();
        var changedSectorNumbers = new HashSet<int>();
        foreach (string rawLine in File.ReadLines(inputPath))
        {
            string line = rawLine.Trim();
            if (string.IsNullOrEmpty(line) ||
                string.Equals(line, ":", StringComparison.Ordinal) ||
                string.Equals(line, ": ENDINTERROG", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            int sectorNumber = Utility.StrToIntSafe(Utility.GetParameter(line, 1));
            if (sectorNumber <= 0 || sectorNumber > database.DBHeader.Sectors)
                throw new InvalidDataException($"Invalid sector number in warp import: '{line}'");

            var sector = database.GetSector(sectorNumber)
                ?? throw new InvalidDataException($"Sector {sectorNumber} not found.");

            for (int parameter = 2; parameter <= 7; parameter++)
            {
                int warp = Utility.StrToIntSafe(Utility.GetParameter(line, parameter));
                if (warp <= 0 || warp > database.DBHeader.Sectors)
                    continue;

                AddWarp(sector, warp);
            }

            if (sector.Explored == ExploreType.No)
                sector.Explored = ExploreType.Calc;

            if (changedSectorNumbers.Add(sector.Number))
                changedSectors.Add(sector);
            imported++;
        }

        database.SaveSectorsBulk(changedSectors);
        database.SaveDatabase();
        return imported;
    }

    public static void ExportDeadends(ModDatabase database, string outputPath)
    {
        EnsureOpenDatabase(database);
        EnsureParentDirectory(outputPath);

        using var writer = new StreamWriter(outputPath, false, Encoding.ASCII);
        for (int i = 1; i <= database.DBHeader.Sectors; i++)
        {
            var sector = database.GetSector(i);
            if (sector == null)
                continue;

            bool hasOutboundWarp = sector.Warp.Any(w => w > 0);
            if (hasOutboundWarp && sector.WarpsIn.Count == 1)
                writer.WriteLine(i);
        }
    }

    public static void ExportBubbles(ModDatabase database, string outputPath, int maxBubbleSize)
    {
        EnsureOpenDatabase(database);
        EnsureParentDirectory(outputPath);

        var bubble = new ModBubble
        {
            MaxBubbleSize = maxBubbleSize > 0 ? maxBubbleSize : ModBubble.DefaultMaxBubbleSize
        };

        var previousDatabase = GlobalModules.TWXDatabase;
        var previousBubble = GlobalModules.TWXBubble;
        try
        {
            GlobalModules.TWXDatabase = database;
            GlobalModules.TWXBubble = bubble;
            using var writer = new StreamWriter(outputPath, false, Encoding.ASCII);
            bubble.ExportBubbles(writer);
        }
        finally
        {
            GlobalModules.TWXBubble = previousBubble;
            GlobalModules.TWXDatabase = previousDatabase;
        }
    }

    public static IReadOnlyList<BubbleInfo> GetBubbles(
        ModDatabase database,
        int maxBubbleSize,
        bool allowSectorsSeparatedByGates = false,
        int maxGateCount = 1)
    {
        EnsureOpenDatabase(database);

        int effectiveMaxBubbleSize = maxBubbleSize > 0 ? maxBubbleSize : ModBubble.DefaultMaxBubbleSize;
        int effectiveMaxGateCount = Math.Max(1, maxGateCount);
        BubbleCacheKey cacheKey = new(
            database,
            database.ChangeStamp,
            effectiveMaxBubbleSize,
            effectiveMaxGateCount,
            allowSectorsSeparatedByGates);

        lock (FinderCacheLock)
        {
            if (_lastBubbleCacheKey == cacheKey)
                return _lastBubbleCache;
        }

        var bubble = new ModBubble
        {
            MaxBubbleSize = effectiveMaxBubbleSize,
            MaxGateCount = effectiveMaxGateCount,
            AllowSectorsSeparatedByGates = allowSectorsSeparatedByGates,
        };

        var previousDatabase = GlobalModules.TWXDatabase;
        var previousBubble = GlobalModules.TWXBubble;
        try
        {
            GlobalModules.TWXDatabase = database;
            GlobalModules.TWXBubble = bubble;
            IReadOnlyList<BubbleInfo> bubbles = bubble.GetBubbles();
            if (ShouldKeepFinderCache(effectiveMaxBubbleSize))
            {
                lock (FinderCacheLock)
                {
                    _lastBubbleCacheKey = cacheKey;
                    _lastBubbleCache = bubbles;
                }
            }
            return bubbles;
        }
        finally
        {
            GlobalModules.TWXBubble = previousBubble;
            GlobalModules.TWXDatabase = previousDatabase;
        }
    }

    public static IReadOnlyList<DeadEndInfo> GetDeadEnds(
        ModDatabase database,
        int maxDeadEndSize)
    {
        EnsureOpenDatabase(database);
        int effectiveMaxDeadEndSize = maxDeadEndSize > 0 ? maxDeadEndSize : ModBubble.DefaultMaxBubbleSize;
        DeadEndCacheKey cacheKey = new(database, database.ChangeStamp, effectiveMaxDeadEndSize);

        lock (FinderCacheLock)
        {
            if (_lastDeadEndCacheKey == cacheKey)
                return _lastDeadEndCache;
        }

        IReadOnlyList<DeadEndInfo> deadEnds = DeadEndFinder.Find(
            database,
            effectiveMaxDeadEndSize);

        if (ShouldKeepFinderCache(effectiveMaxDeadEndSize))
        {
            lock (FinderCacheLock)
            {
                _lastDeadEndCacheKey = cacheKey;
                _lastDeadEndCache = deadEnds;
            }
        }

        return deadEnds;
    }

    public static IReadOnlyList<TunnelInfo> GetTunnels(
        ModDatabase database,
        int maxTunnelSize)
    {
        EnsureOpenDatabase(database);
        int effectiveMaxTunnelSize = maxTunnelSize > 0 ? maxTunnelSize : ModBubble.DefaultMaxBubbleSize;
        TunnelCacheKey cacheKey = new(database, database.ChangeStamp, effectiveMaxTunnelSize);

        lock (FinderCacheLock)
        {
            if (_lastTunnelCacheKey == cacheKey)
                return _lastTunnelCache;
        }

        IReadOnlyList<TunnelInfo> tunnels = TunnelFinder.Find(
            database,
            effectiveMaxTunnelSize);

        if (ShouldKeepFinderCache(effectiveMaxTunnelSize))
        {
            lock (FinderCacheLock)
            {
                _lastTunnelCacheKey = cacheKey;
                _lastTunnelCache = tunnels;
            }
        }

        return tunnels;
    }

    public static void ExportTwx(ModDatabase database, string outputPath)
    {
        EnsureOpenDatabase(database);
        EnsureParentDirectory(outputPath);

        int sectorCount = database.DBHeader.Sectors;
        var header = BuildTwxHeader(database);
        int crc = GetCrc(header, 0, header.Length);
        var sectorRecords = new byte[sectorCount][];

        for (int i = 1; i <= sectorCount; i++)
        {
            var sector = database.GetSector(i)
                ?? throw new InvalidDataException($"Sector {i} not found.");
            byte[] record = BuildTwxSectorRecord(sector);
            sectorRecords[i - 1] = record;
            crc ^= GetCrc(record, 0, record.Length);
        }

        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(32, 4), crc);

        using var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None);
        stream.Write(header, 0, header.Length);
        foreach (byte[] record in sectorRecords)
            stream.Write(record, 0, record.Length);
    }

    public static TwxImportResult ImportTwx(ModDatabase database, string inputPath, bool keepRecent)
    {
        EnsureOpenDatabase(database);
        if (!File.Exists(inputPath))
            throw new FileNotFoundException("TWX import file not found.", inputPath);

        using var stream = new FileStream(inputPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var reader = new BinaryReader(stream, Encoding.ASCII);

        byte[] header = reader.ReadBytes(TwxHeaderSize);
        if (header.Length != TwxHeaderSize)
            throw new InvalidDataException("Incomplete TWX header.");

        int sectors = ReadNetworkInt32(header, 12);
        if (sectors != database.DBHeader.Sectors)
            throw new InvalidDataException($"TWX file requires a {sectors}-sector database.");

        int version = ReadNetworkInt32(header, 8);
        if (version != 1)
            throw new InvalidDataException($"Unsupported TWX version: {version}");

        int crc = GetCrc(header, 0, header.Length);
        long payloadBytes = Math.Max(0, stream.Length - TwxHeaderSize);
        int availableRecords = (int)(payloadBytes / TwxSectorRecordSize);
        int recordCount = Math.Min(sectors, availableRecords);
        bool truncated = recordCount < sectors;

        if (recordCount == 0)
            throw new InvalidDataException("Incomplete TWX sector data.");

        byte[][] sectorRecords = new byte[recordCount][];
        for (int i = 0; i < recordCount; i++)
        {
            byte[] record = reader.ReadBytes(TwxSectorRecordSize);
            if (record.Length != TwxSectorRecordSize)
                throw new InvalidDataException("Incomplete TWX sector data.");
            sectorRecords[i] = record;
            crc ^= GetCrc(record, 0, record.Length);
        }

        if (!truncated && crc != 0)
            throw new InvalidDataException("TWX file checksum is invalid.");

        int skippedInvalidWarps = 0;
        var changedSectors = new List<SectorData>(recordCount);
        for (int i = 1; i <= recordCount; i++)
        {
            var sector = database.GetSector(i)
                ?? throw new InvalidDataException($"Sector {i} not found.");
            skippedInvalidWarps += ApplyTwxSectorRecord(database, sector, sectorRecords[i - 1], keepRecent);
            changedSectors.Add(sector);
        }

        database.SaveSectorsBulk(changedSectors);
        database.SaveDatabase();
        return new TwxImportResult(recordCount, sectors, truncated, skippedInvalidWarps);
    }

    private static int ApplyTwxSectorRecord(ModDatabase database, SectorData sector, byte[] record, bool keepRecent)
    {
        int skippedInvalidWarps = 0;

        sbyte info = unchecked((sbyte)record[0]);
        sbyte navHaz = unchecked((sbyte)record[1]);
        int sectorUpdateRaw = ReadNetworkInt32(record, 4);
        int fighters = ReadNetworkInt32(record, 8);
        sbyte fighterType = unchecked((sbyte)record[14]);
        sbyte anomaly = unchecked((sbyte)record[15]);
        short armids = ReadNetworkInt16(record, 16);
        short limpets = ReadNetworkInt16(record, 20);
        int[] portAmount =
        {
            ReadNetworkInt32(record, 24),
            ReadNetworkInt32(record, 28),
            ReadNetworkInt32(record, 32)
        };
        sbyte[] portPercent =
        {
            unchecked((sbyte)record[36]),
            unchecked((sbyte)record[37]),
            unchecked((sbyte)record[38])
        };
        sbyte warps = unchecked((sbyte)record[39]);
        int[] warpSectors =
        {
            ReadNetworkInt32(record, 40),
            ReadNetworkInt32(record, 44),
            ReadNetworkInt32(record, 48),
            ReadNetworkInt32(record, 52),
            ReadNetworkInt32(record, 56),
            ReadNetworkInt32(record, 60)
        };
        int portUpdateRaw = ReadNetworkInt32(record, 64);
        int density = ReadNetworkInt32(record, 68);

        for (int index = 0; index < Math.Max(0, (int)warps); index++)
        {
            int warp = BaseZero(warpSectors[index]);
            if (warp == 0)
                break;
            if (warp > database.DBHeader.Sectors)
            {
                skippedInvalidWarps++;
                continue;
            }
            AddWarpSorted(sector, warp);
        }

        if (sector.Explored == ExploreType.No)
            sector.Explored = ExploreType.Calc;

        DateTime sectorUpdate = sectorUpdateRaw <= 0 ? DateTime.MinValue : ConvertFromCTime(sectorUpdateRaw);
        if (sectorUpdate > sector.Update || !keepRecent)
        {
            sector.Explored = ExploreType.Yes;

            if (info == 12)
            {
                EnsurePort(sector).Dead = true;
            }
            else if (info == 10 || info > 12)
            {
                sector.SectorPort = null;
            }
            else if (info == 11)
            {
                if (density >= 0)
                    sector.Explored = ExploreType.Density;
                else if (warps > 0 || sector.Warp.Any(w => w > 0))
                    sector.Explored = ExploreType.Calc;
                else
                    sector.Explored = ExploreType.No;
            }
            else
            {
                var port = EnsurePort(sector);
                if (string.IsNullOrEmpty(port.Name))
                    port.Name = "???";

                port.ClassIndex = (byte)info;
                port.Dead = false;
                ApplyPortClassDefaults(port, port.ClassIndex);
            }

            sector.NavHaz = (byte)BaseZero(navHaz);
            sector.Fighters.Owner = "Unknown";
            sector.Fighters.Quantity = BaseZero(fighters);
            sector.Fighters.FigType = fighterType switch
            {
                1 => FighterType.Toll,
                2 => FighterType.Offensive,
                3 => FighterType.Defensive,
                _ => FighterType.None
            };

            sector.MinesArmid.Owner = "Unknown";
            sector.MinesArmid.Quantity = armids < 0 ? 0 : armids;

            sector.MinesLimpet.Owner = "Unknown";
            sector.MinesLimpet.Quantity = limpets < 0 ? 0 : limpets;

            if (string.IsNullOrEmpty(sector.Constellation) || sector.Constellation.StartsWith("???", StringComparison.Ordinal))
                sector.Constellation = "??? (data import only)";

            sector.Beacon = string.Empty;
            sector.Update = sectorUpdate;
            sector.Anomaly = anomaly > 0;
            sector.Density = density;
        }

        DateTime portUpdate = portUpdateRaw <= 0 ? DateTime.MinValue : ConvertFromCTime(portUpdateRaw);
        if (portUpdate > (sector.SectorPort?.Update ?? DateTime.MinValue) || !keepRecent)
        {
            var port = EnsurePort(sector);
            port.ProductPercent[ProductType.FuelOre] = (byte)BaseZero(portPercent[0]);
            port.ProductPercent[ProductType.Organics] = (byte)BaseZero(portPercent[1]);
            port.ProductPercent[ProductType.Equipment] = (byte)BaseZero(portPercent[2]);
            port.ProductAmount[ProductType.FuelOre] = (ushort)BaseZero(portAmount[0]);
            port.ProductAmount[ProductType.Organics] = (ushort)BaseZero(portAmount[1]);
            port.ProductAmount[ProductType.Equipment] = (ushort)BaseZero(portAmount[2]);
            port.Update = portUpdate;
        }

        return skippedInvalidWarps;
    }

    private static Port EnsurePort(SectorData sector)
    {
        sector.SectorPort ??= new Port();
        return sector.SectorPort;
    }

    private static void ApplyPortClassDefaults(Port port, int classIndex)
    {
        switch (classIndex)
        {
            case 1:
                port.BuyProduct[ProductType.FuelOre] = true;
                port.BuyProduct[ProductType.Organics] = true;
                port.BuyProduct[ProductType.Equipment] = false;
                break;
            case 2:
                port.BuyProduct[ProductType.FuelOre] = true;
                port.BuyProduct[ProductType.Organics] = false;
                port.BuyProduct[ProductType.Equipment] = true;
                break;
            case 3:
                port.BuyProduct[ProductType.FuelOre] = false;
                port.BuyProduct[ProductType.Organics] = true;
                port.BuyProduct[ProductType.Equipment] = true;
                break;
            case 4:
                port.BuyProduct[ProductType.FuelOre] = false;
                port.BuyProduct[ProductType.Organics] = false;
                port.BuyProduct[ProductType.Equipment] = true;
                break;
            case 5:
                port.BuyProduct[ProductType.FuelOre] = false;
                port.BuyProduct[ProductType.Organics] = true;
                port.BuyProduct[ProductType.Equipment] = false;
                break;
            case 6:
                port.BuyProduct[ProductType.FuelOre] = true;
                port.BuyProduct[ProductType.Organics] = false;
                port.BuyProduct[ProductType.Equipment] = false;
                break;
            case 7:
                port.BuyProduct[ProductType.FuelOre] = false;
                port.BuyProduct[ProductType.Organics] = false;
                port.BuyProduct[ProductType.Equipment] = false;
                break;
            default:
                port.BuyProduct[ProductType.FuelOre] = true;
                port.BuyProduct[ProductType.Organics] = true;
                port.BuyProduct[ProductType.Equipment] = true;
                break;
        }
    }

    private static void AddWarp(SectorData sector, int warp)
    {
        if (sector.Warp.Any(existing => existing == warp))
            return;

        for (int i = 0; i < sector.Warp.Length; i++)
        {
            if (sector.Warp[i] == 0)
            {
                sector.Warp[i] = warp;
                sector.WarpCount = (byte)Math.Max(sector.WarpCount, i + 1);
                return;
            }
        }
    }

    private static void AddWarpSorted(SectorData sector, int warp)
    {
        if (sector.Warp.Any(existing => existing == warp))
            return;

        var warps = sector.Warp.Where(w => w > 0).Select(w => (int)w).ToList();
        warps.Add(warp);
        warps.Sort();

        Array.Clear(sector.Warp, 0, sector.Warp.Length);
        for (int i = 0; i < warps.Count && i < sector.Warp.Length; i++)
            sector.Warp[i] = warps[i];

        sector.WarpCount = (byte)warps.Count;
    }

    private static void EnsureOpenDatabase(ModDatabase database)
    {
        if (database == null)
            throw new ArgumentNullException(nameof(database));
        if (!database.IsOpen)
            throw new InvalidOperationException("No active database is open.");
    }

    private static void EnsureParentDirectory(string path)
    {
        string? directory = Path.GetDirectoryName(path);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);
    }

    private static int BaseZero(int value) => value < 0 ? 0 : value;
    private static int BaseZero(sbyte value) => value < 0 ? 0 : value;

    private static int ConvertToCTime(DateTime dateTime)
    {
        if (dateTime == DateTime.MinValue)
            return 0;

        return (int)Math.Round((dateTime.ToOADate() - 25569d) * 86400d);
    }

    private static DateTime ConvertFromCTime(int cTime)
    {
        return DateTime.FromOADate((cTime / 86400d) + 25569d);
    }

    private static int GetCrc(byte[] bytes, int offset, int length)
    {
        int crc = 0;
        for (int i = offset; i < offset + length; i += 4)
            crc ^= BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(i, 4));
        return crc;
    }

    private static byte[] BuildTwxHeader(ModDatabase database)
    {
        byte[] buffer = new byte[TwxHeaderSize];
        Encoding.ASCII.GetBytes("TWEX", 0, 4, buffer, 0);
        WriteNetworkInt32(buffer, 4, ConvertToCTime(DateTime.Now));
        WriteNetworkInt32(buffer, 8, 1);
        WriteNetworkInt32(buffer, 12, database.DBHeader.Sectors);
        WriteNetworkInt32(buffer, 16, database.DBHeader.StarDock);
        WriteNetworkInt32(buffer, 20, -1);
        WriteNetworkInt32(buffer, 24, -1);
        WriteNetworkInt32(buffer, 28, -1);
        BinaryPrimitives.WriteInt32LittleEndian(buffer.AsSpan(32, 4), 0);
        return buffer;
    }

    private static byte[] BuildTwxSectorRecord(SectorData sector)
    {
        byte[] buffer = new byte[TwxSectorRecordSize];
        buffer[0] = DetermineSectorInfo(sector);
        buffer[1] = unchecked((byte)Math.Clamp((int)sector.NavHaz, 0, 100));
        BinaryPrimitives.WriteInt16LittleEndian(buffer.AsSpan(2, 2), 0);

        WriteNetworkInt32(buffer, 4, sector.Update == DateTime.MinValue ? 0 : ConvertToCTime(sector.Update));
        WriteNetworkInt32(buffer, 8, sector.Fighters.Quantity);
        BinaryPrimitives.WriteInt16LittleEndian(buffer.AsSpan(12, 2), -1);
        buffer[14] = sector.Fighters.Quantity == 0
            ? unchecked((byte)-1)
            : (byte)(sector.Fighters.FigType switch
            {
                FighterType.Toll => 1,
                FighterType.Offensive => 2,
                FighterType.Defensive => 3,
                _ => -1
            });
        buffer[15] = sector.Density < 0
            ? unchecked((byte)-1)
            : (sector.Anomaly ? (byte)1 : (byte)0);
        WriteNetworkInt16(buffer, 16, (short)sector.MinesArmid.Quantity);
        BinaryPrimitives.WriteInt16LittleEndian(buffer.AsSpan(18, 2), -1);
        WriteNetworkInt16(buffer, 20, (short)sector.MinesLimpet.Quantity);
        BinaryPrimitives.WriteInt16LittleEndian(buffer.AsSpan(22, 2), -1);

        if (sector.SectorPort == null || sector.SectorPort.ClassIndex == 0)
        {
            WriteNetworkInt32(buffer, 24, -1);
            WriteNetworkInt32(buffer, 28, -1);
            WriteNetworkInt32(buffer, 32, -1);
            buffer[36] = unchecked((byte)-1);
            buffer[37] = unchecked((byte)-1);
            buffer[38] = unchecked((byte)-1);
            WriteNetworkInt32(buffer, 64, 0);
        }
        else
        {
            WriteNetworkInt32(buffer, 24, sector.SectorPort.ProductAmount[ProductType.FuelOre]);
            WriteNetworkInt32(buffer, 28, sector.SectorPort.ProductAmount[ProductType.Organics]);
            WriteNetworkInt32(buffer, 32, sector.SectorPort.ProductAmount[ProductType.Equipment]);
            buffer[36] = sector.SectorPort.ProductPercent[ProductType.FuelOre];
            buffer[37] = sector.SectorPort.ProductPercent[ProductType.Organics];
            buffer[38] = sector.SectorPort.ProductPercent[ProductType.Equipment];
            WriteNetworkInt32(buffer, 64, sector.SectorPort.Update == DateTime.MinValue ? 0 : ConvertToCTime(sector.SectorPort.Update));
        }

        int warpCount = sector.Warp.TakeWhile(w => w > 0).Count();
        buffer[39] = warpCount == 0 ? unchecked((byte)-1) : (byte)warpCount;
        for (int i = 0; i < 6; i++)
            WriteNetworkInt32(buffer, 40 + (i * 4), sector.Warp[i]);

        WriteNetworkInt32(buffer, 68, sector.Density);
        return buffer;
    }

    private static byte DetermineSectorInfo(SectorData sector)
    {
        if (sector.Explored != ExploreType.Yes && (sector.SectorPort?.ClassIndex ?? 0) == 0)
            return 11;

        if (sector.SectorPort?.Dead == true)
            return 12;

        if (sector.SectorPort == null || string.IsNullOrEmpty(sector.SectorPort.Name))
            return 10;

        return sector.SectorPort.ClassIndex;
    }

    private static void WriteNetworkInt32(byte[] buffer, int offset, int value)
    {
        BinaryPrimitives.WriteInt32BigEndian(buffer.AsSpan(offset, 4), value);
    }

    private static void WriteNetworkInt16(byte[] buffer, int offset, short value)
    {
        BinaryPrimitives.WriteInt16BigEndian(buffer.AsSpan(offset, 2), value);
    }

    private static int ReadNetworkInt32(byte[] buffer, int offset)
    {
        return BinaryPrimitives.ReadInt32BigEndian(buffer.AsSpan(offset, 4));
    }

    private static short ReadNetworkInt16(byte[] buffer, int offset)
    {
        return BinaryPrimitives.ReadInt16BigEndian(buffer.AsSpan(offset, 2));
    }
}
