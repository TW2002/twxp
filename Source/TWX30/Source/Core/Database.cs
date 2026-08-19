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
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace TWXProxy.Core
{
    #region Enums and Constants

    public enum FighterType
    {
        Toll,
        Defensive,
        Offensive,
        None
    }

    public enum ProductType
    {
        FuelOre,
        Organics,
        Equipment
    }

    public static class DatabaseConstants
    {
        public const int DatabaseVersion = 16;
        public static readonly string[] DayNames = { "Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat" };
        public const string BustParameterName = "BUSTED";
        public const string FakeBustParameterName = "FAKEBUST";
        public const string BustDateParameterName = "BUSTDATE";
    }

    #endregion

    #region Data Structures

    /// <summary>
    /// Space object (fighters or mines)
    /// </summary>
    public class SpaceObject
    {
        public int Quantity { get; set; }
        public string Owner { get; set; } = string.Empty;
        public FighterType FigType { get; set; }
    }

    /// <summary>
    /// Port information
    /// </summary>
    public class Port
    {
        public string Name { get; set; } = string.Empty;
        public bool Dead { get; set; }
        public byte BuildTime { get; set; }
        public byte ClassIndex { get; set; }
        public Dictionary<ProductType, bool> BuyProduct { get; set; } = new();
        public Dictionary<ProductType, byte> ProductPercent { get; set; } = new();
        public Dictionary<ProductType, ushort> ProductAmount { get; set; } = new();
        public DateTime Update { get; set; }

        public Port()
        {
            foreach (ProductType pt in Enum.GetValues<ProductType>())
            {
                BuyProduct[pt] = false;
                ProductPercent[pt] = 0;
                ProductAmount[pt] = 0;
            }
        }
    }

    /// <summary>
    /// Trader information
    /// </summary>
    public class Trader
    {
        public string DisplayLabel { get; set; } = "Traders";
        public string Name { get; set; } = string.Empty;
        public string ShipType { get; set; } = string.Empty;
        public string ShipName { get; set; } = string.Empty;
        public int Fighters { get; set; }
    }

    /// <summary>
    /// Ship information
    /// </summary>
    public class Ship
    {
        public string Name { get; set; } = string.Empty;
        public string Owner { get; set; } = string.Empty;
        public string ShipType { get; set; } = string.Empty;
        public int Fighters { get; set; }
    }

    /// <summary>
    /// <summary>
    /// Planet information.  Planets are standalone entities keyed by their
    /// in-game registry number (which is unique and permanent).  They can
    /// move between sectors, so <see cref="LastSector"/> records the most
    /// recently observed location.  A planet ID of 0 means the ID is not yet
    /// known (name was seen in a sector display but the land list hasn't been
    /// read yet).
    /// </summary>
    public class Planet
    {
        /// <summary>In-game registry number (unique).  0 = not yet known.</summary>
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        /// <summary>Sector number where this planet was last seen (0 = unknown).</summary>
        public int LastSector { get; set; }
        public int ObservedOrder { get; set; }
        public string Owner { get; set; } = string.Empty;
        public int Level { get; set; }
        public bool? Shielded { get; set; }
        public int Fighters { get; set; } = -1;
        public int FuelOre { get; set; } = -1;
        public int Organics { get; set; } = -1;
        public int Equipment { get; set; } = -1;
    }

    /// <summary>
    /// Sector variable (custom named values per sector)
    /// </summary>
    public class SectorVar
    {
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    /// <summary>
    /// Complete sector information - extended from Core.Sector
    /// </summary>
    public class SectorData : Sector
    {
        public int Number { get; set; }
        public Port? SectorPort { get; set; }
        public new byte NavHaz { get; set; }
        public new SpaceObject Fighters { get; set; } = new();
        public SpaceObject MinesArmid { get; set; } = new();
        public SpaceObject MinesLimpet { get; set; } = new();
        public new string Constellation { get; set; } = string.Empty;
        public new string Beacon { get; set; } = string.Empty;
        public DateTime Update { get; set; }
        public new bool Anomaly { get; set; }
        public new int Density { get; set; }
        public byte WarpCount { get; set; }
        public new List<Ship> Ships { get; set; } = new();
        public new List<Trader> Traders { get; set; } = new();
        /// <summary>
        /// Planet names observed in the last sector display (Planets : line).
        /// Used for SECTOR.PLANETS / SECTOR.PLANETCOUNT.  Does not include
        /// planet IDs — see <see cref="ModDatabase.GetPlanetsInSector"/> for
        /// ID-keyed planets from the land list.
        /// </summary>
        public List<string> PlanetNames { get; set; } = new();
        public Dictionary<string, string> Variables { get; set; } = new();
        public List<int> WarpsIn { get; set; } = new(); // Sectors that warp to this one
    }

    /// <summary>
    /// Database header
    /// </summary>
    public class DataHeader
    {
        public string ProgramName { get; set; } = "TWX PROXY";
        public byte Version { get; set; } = DatabaseConstants.DatabaseVersion;
        public int Sectors { get; set; }
        public ushort StarDock { get; set; }
        public ushort AlphaCentauri { get; set; }
        public ushort Rylos { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ushort ServerPort { get; set; }
        public ushort ListenPort { get; set; }
        public string LoginScript { get; set; } = "0_Login.cts";
        public string Password { get; set; } = string.Empty;
        public string LoginName { get; set; } = string.Empty;
        public char Game { get; set; }
        public string IconFile { get; set; } = string.Empty;
        public bool UseRLogin { get; set; }
        public bool UseLogin { get; set; }
        public byte RobFactor { get; set; }
        public byte StealFactor { get; set; }
        public DateTime LastPortCIM { get; set; }
        public char CommandChar { get; set; } = '$';
    }

    public sealed record MajorSpaceLaneRoute(
        string Name,
        int FromSector,
        int ToSector,
        IReadOnlyList<int> Sectors);

    #endregion

    /// <summary>
    /// ModDatabase: High-performance in-memory database for Trade Wars 2002 universe
    /// Uses concurrent collections for thread-safe real-time updates
    /// </summary>
    public class ModDatabase : TWXModule, ITWXDatabase, ITWXGlobals
    {
        private readonly ConcurrentDictionary<int, SectorData> _sectors;
        private readonly ConcurrentDictionary<int, Planet> _planets;  // keyed by planet ID
        private DataHeader _header;
        private int _maxSectorSeen = 0;
        private string _databaseName = string.Empty;
        private string _databasePath = string.Empty;
        private bool _recording = false;
        private bool _useCache = true;
        private bool _isOpen = false;
        private readonly ReaderWriterLockSlim _headerLock;
        private Timer? _autoSaveTimer;
        private readonly object _saveLock = new();
        private static readonly ConcurrentDictionary<string, long> _databasePathGenerations = new(StringComparer.OrdinalIgnoreCase);
        private long _databasePathGeneration;
        private int _nextProvisionalPlanetId = -1;
        private NetworkManager? _networkManager;
        private GameInstance? _gameInstance;
        private long _changeStamp;
        private readonly object _pathGraphLock = new();
        private PathGraph? _pathGraphCache;
        private long _pathGraphCacheChangeStamp = long.MinValue;
        [ThreadStatic] private static BidirectionalPathScratch? _threadBidirectionalScratch;
        [ThreadStatic] private static AllCoursesPathScratch? _threadAllCoursesScratch;
        [ThreadStatic] private static ReverseDistanceScratch? _threadReverseDistanceScratch;

        public ModDatabase()
        {
            _sectors = new ConcurrentDictionary<int, SectorData>();
            _planets = new ConcurrentDictionary<int, Planet>();
            _header = new DataHeader();
            _headerLock = new ReaderWriterLockSlim();

            GlobalModules.DebugLog($"[ModDatabase] Constructor called\n");
        }

        #region Properties

        public string DatabaseName
        {
            get => _databaseName;
            set => _databaseName = value;
        }

        public string DatabasePath => _databasePath;

        public bool UseCache
        {
            get => _useCache;
            set => _useCache = value;
        }

        public bool Recording
        {
            get => _recording;
            set => _recording = value;
        }

        public string ProgramDir { get; set; } = OperatingSystem.IsWindows()
            ? WindowsInstallInfo.GetInstalledProgramDirOrDefault()
            : Environment.CurrentDirectory;

        /// <summary>
        /// Number of sectors in the universe.  Returns int.MaxValue when the
        /// universe size is not yet known (no .twx file loaded / live capture),
        /// so that all range guards in the codebase treat any positive sector
        /// number as valid rather than silently returning empty data.
        /// </summary>
        public int SectorCount => _header.Sectors > 0 ? _header.Sectors : int.MaxValue;

        /// <summary>
        /// Highest sector number written to the database so far (populated from live capture).
        /// </summary>
        public int MaxSectorSeen => _maxSectorSeen;

        public DataHeader DBHeader
        {
            get
            {
                _headerLock.EnterReadLock();
                try
                {
                    return _header;
                }
                finally
                {
                    _headerLock.ExitReadLock();
                }
            }
        }

        public bool IsOpen => _isOpen;

        /// <summary>
        /// Monotonic stamp for in-memory consumers that want to cache derived results
        /// and invalidate them when the underlying database changes.
        /// </summary>
        public long ChangeStamp => Interlocked.Read(ref _changeStamp);

        /// <summary>
        /// Updates selected header fields from caller-supplied values.  Only non-default
        /// values overwrite the stored ones, so optional fields can be left at their zero/
        /// empty defaults to leave the database copy unchanged.
        /// Always call after OpenDatabase() to keep the header in sync with the current
        /// game configuration (host, port, sector count, command char).
        /// </summary>
        public void UpdateHeader(DataHeader updates)
        {
            _headerLock.EnterWriteLock();
            try
            {
                int previousSectors = _header.Sectors;
                if (updates.Sectors > 0) _header.Sectors = updates.Sectors;
                if (!string.IsNullOrEmpty(updates.Address)) _header.Address = updates.Address;
                if (updates.ServerPort != 0) _header.ServerPort = updates.ServerPort;
                if (updates.ListenPort != 0) _header.ListenPort = updates.ListenPort;
                if (updates.CommandChar != '\0') _header.CommandChar = updates.CommandChar;
                if (!string.IsNullOrEmpty(updates.Description)) _header.Description = updates.Description;
                if (_header.Sectors > previousSectors)
                    EnsureSectorCapacity(_header.Sectors);
                Interlocked.Increment(ref _changeStamp);
            }
            finally
            {
                _headerLock.ExitWriteLock();
            }
        }

        /// <summary>
        /// Replaces the in-memory database header exactly as supplied.
        /// Use this when editing persisted database metadata where false/blank values
        /// are meaningful and should not be treated as "leave unchanged".
        /// </summary>
        public void ReplaceHeader(DataHeader header)
        {
            _headerLock.EnterWriteLock();
            try
            {
                int previousSectors = _header.Sectors;
                _header = header;
                if (_header.Sectors > previousSectors)
                    EnsureSectorCapacity(_header.Sectors);
                Interlocked.Increment(ref _changeStamp);
            }
            finally
            {
                _headerLock.ExitWriteLock();
            }
        }

        /// <summary>
        /// Ensures the in-memory sector map contains blank sector records up to the
        /// configured universe size. This allows an existing database to grow after
        /// creation when the game sector count is corrected upward.
        /// </summary>
        private void EnsureSectorCapacity(int sectorCount)
        {
            if (sectorCount <= 0)
                return;

            for (int i = 1; i <= sectorCount; i++)
            {
                _sectors.TryAdd(i, new SectorData
                {
                    Number = i,
                    Explored = ExploreType.No
                });
            }
        }

        public bool IsNetworkActive => _gameInstance?.IsRunning ?? false;

        public bool IsConnected => _gameInstance?.IsConnected ?? false;

        public GameInstance? GameInstance => _gameInstance;

        #endregion

        #region Database Operations

        /// <summary>
        /// Create a new database with specified parameters
        /// </summary>
        public void CreateDatabase(string filename, DataHeader header)
        {
            CloseDatabase();

            _header = header;
            _databasePath = filename;
            _databasePathGeneration = BumpDatabaseGeneration(filename);
            _databaseName = Path.GetFileNameWithoutExtension(filename);
            _sectors.Clear();
            _planets.Clear();
            ResetNextProvisionalPlanetId();
            for (int i = 1; i <= header.Sectors; i++)
            {
                var sector = new SectorData
                {
                    Number = i,
                    Explored = ExploreType.No
                };
                _sectors[i] = sector;
            }

            _isOpen = true;
            SaveDatabase();
            StartAutoSave();
        }

        /// <summary>
        /// Open an existing database from file
        /// </summary>
        public void OpenDatabase(string filename)
        {
            CloseDatabase();

            _databasePath = filename;
            _databasePathGeneration = CurrentDatabaseGeneration(filename);
            _databaseName = Path.GetFileNameWithoutExtension(filename);

            if (File.Exists(filename))
            {
                LoadDatabase();
                bool repaired = RepairLandmarkHeadersFromSectorData();
                repaired |= RepairLoadedPlanetSightings();
                if (repaired)
                    SaveDatabase();
            }
            else
            {
                throw new FileNotFoundException($"Database file not found: {filename}");
            }

            _isOpen = true;
            StartAutoSave();
        }

        /// <summary>
        /// Close the database and save changes
        /// </summary>
        public void CloseDatabase()
        {
            if (_isOpen)
            {
                StopAutoSave();
                SaveDatabase();
                _sectors.Clear();
                _planets.Clear();
                ResetNextProvisionalPlanetId();
                _isOpen = false;
            }
        }

        /// <summary>
        /// Clears all sector and planet data, resetting every sector to unexplored,
        /// while preserving the database header (universe size, game settings, etc.).
        /// </summary>
        public void ResetSectors()
        {
            if (!_isOpen)
                return;

            _sectors.Clear();
            _planets.Clear();
            ResetNextProvisionalPlanetId();
            _maxSectorSeen = 0;

            int count = _header.Sectors;
            for (int i = 1; i <= count; i++)
                _sectors[i] = new SectorData { Number = i, Explored = ExploreType.No };

            SaveDatabase();
        }

        /// <summary>
        /// Save database to disk
        /// </summary>
        public void SaveDatabase()
        {
            if (string.IsNullOrEmpty(_databasePath))
                return;

            lock (_saveLock)
            {
                try
                {
                    if (IsStaleDatabaseHandle())
                    {
                        GlobalModules.DebugLog($"[Database] Skipped stale save for {_databasePath}\n");
                        return;
                    }

                    string tempPath = _databasePath + ".tmp";

                    using (var stream = new FileStream(tempPath, FileMode.Create, FileAccess.Write))
                    using (var writer = new BinaryWriter(stream))
                    {
                        // Write header
                        WriteHeader(writer);

                        // Write sector count
                        writer.Write(_sectors.Count);

                        // Write all sectors
                        foreach (var sector in _sectors.Values.OrderBy(s => s.Number))
                        {
                            WriteSector(writer, sector);
                        }

                        // Write planets (top-level, keyed by ID — v10+)
                        writer.Write(_planets.Count);
                        foreach (var planet in _planets.Values)
                        {
                            writer.Write(planet.Id);
                            writer.Write(planet.Name);
                            writer.Write(planet.LastSector);
                            writer.Write(planet.ObservedOrder);
                            writer.Write(planet.Owner);
                            writer.Write(planet.Level);
                            writer.Write(planet.Shielded.HasValue);
                            writer.Write(planet.Shielded.GetValueOrDefault());
                            writer.Write(planet.Fighters);
                            writer.Write(planet.FuelOre);
                            writer.Write(planet.Organics);
                            writer.Write(planet.Equipment);
                        }
                    }

                    // Atomic replace
                    if (File.Exists(_databasePath))
                        File.Delete(_databasePath);
                    File.Move(tempPath, _databasePath);
                }
                catch (Exception ex)
                {
                    throw new Exception($"Failed to save database: {ex.Message}", ex);
                }
            }
        }

        private static string NormalizeDatabasePath(string filename)
        {
            return Path.GetFullPath(filename);
        }

        private static long CurrentDatabaseGeneration(string filename)
        {
            return _databasePathGenerations.GetOrAdd(NormalizeDatabasePath(filename), 0);
        }

        private static long BumpDatabaseGeneration(string filename)
        {
            return _databasePathGenerations.AddOrUpdate(
                NormalizeDatabasePath(filename),
                1,
                (_, current) => current == long.MaxValue ? 1 : current + 1);
        }

        private bool IsStaleDatabaseHandle()
        {
            return !string.IsNullOrEmpty(_databasePath)
                && _databasePathGeneration != CurrentDatabaseGeneration(_databasePath);
        }

        /// <summary>
        /// Load database from disk
        /// </summary>
        private void LoadDatabase()
        {
            try
            {
                using (var stream = new FileStream(_databasePath, FileMode.Open, FileAccess.Read))
                using (var reader = new BinaryReader(stream))
                {
                    // Read header
                    ReadHeader(reader);

                    // Read sector count
                    int sectorCount = reader.ReadInt32();

                    // Read all sectors
                    _sectors.Clear();
                    _planets.Clear();
                    for (int i = 0; i < sectorCount; i++)
                    {
                        var sector = ReadSector(reader);
                        _sectors[sector.Number] = sector;
                    }

                    // Rebuild WarpsIn index from persisted Warp[] data.
                    // Pascal computes warp-ins on demand by scanning all sectors;
                    // we pre-build a cache here so WARPINCOUNT is O(1).
                    // Clear persisted reverse links first so stale entries do not
                    // survive when a sector's outbound warp list changes.
                    foreach (var s in _sectors.Values)
                        s.WarpsIn.Clear();

                    foreach (var s in _sectors.Values)
                    {
                        int origin = s.Number;
                        foreach (int warp in s.Warp.Where(w => w > 0))
                        {
                            if (_sectors.TryGetValue(warp, out var target)
                                && !target.WarpsIn.Contains(origin))
                                target.WarpsIn.Add(origin);
                        }
                    }

                    // v10+: read top-level planet table (keyed by ID)
                    if (_header.Version >= 10 && reader.BaseStream.Position < reader.BaseStream.Length)
                    {
                        int planetCount = reader.ReadInt32();
                        for (int i = 0; i < planetCount; i++)
                        {
                            int id = reader.ReadInt32();
                            string name = reader.ReadString();
                            int lastSector = reader.ReadInt32();
                            var planet = new Planet { Id = id, Name = name, LastSector = lastSector };
                            if (_header.Version >= 12 && reader.BaseStream.Position < reader.BaseStream.Length)
                            {
                                if (_header.Version >= 14)
                                    planet.ObservedOrder = reader.ReadInt32();
                                planet.Owner = reader.ReadString();
                                planet.Level = reader.ReadInt32();
                                if (_header.Version >= 13)
                                {
                                    bool hasShielded = reader.ReadBoolean();
                                    bool shielded = reader.ReadBoolean();
                                    planet.Shielded = hasShielded ? shielded : null;
                                }
                                planet.Fighters = reader.ReadInt32();
                                planet.FuelOre = reader.ReadInt32();
                                planet.Organics = reader.ReadInt32();
                                planet.Equipment = reader.ReadInt32();
                            }

                            _planets[id] = planet;
                        }

                        ResetNextProvisionalPlanetId();
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to load database: {ex.Message}", ex);
            }
        }

        #endregion

        #region Sector Operations

        /// <summary>
        /// Load a sector from memory
        /// </summary>
        public Sector? LoadSector(int sectorNumber)
        {
            if (_sectors.TryGetValue(sectorNumber, out var sector))
            {
                return sector;
            }
            return null;
        }

        /// <summary>
        /// Get a sector from memory (returns SectorData)
        /// </summary>
        public SectorData? GetSector(int sectorNumber)
        {
            if (_sectors.TryGetValue(sectorNumber, out var sector))
            {
                return sector;
            }
            return null;
        }

        /// <summary>
        /// Save sector to memory (real-time update)
        /// </summary>
        public void SaveSector(SectorData sector)
        {
            SaveSectorCore(sector, updateWarpInCache: true);
            Interlocked.Increment(ref _changeStamp);
        }

        public void SaveSectorsBulk(IEnumerable<SectorData> sectors)
        {
            bool savedAny = false;
            foreach (SectorData sector in sectors)
            {
                SaveSectorCore(sector, updateWarpInCache: false);
                savedAny = true;
            }

            if (!savedAny)
                return;

            RebuildWarpInCache();
            Interlocked.Increment(ref _changeStamp);
        }

        private void SaveSectorCore(SectorData sector, bool updateWarpInCache)
        {
            // When _header.Sectors == 0 the universe size is not yet known (live capture
            // before a .twx file is loaded) — allow any positive sector number.
            if (sector.Number < 1 || (_header.Sectors > 0 && sector.Number > _header.Sectors))
                throw new ArgumentOutOfRangeException(nameof(sector.Number));

            // TWX27 recalculates TSector.Warps from Warp[] on every save.
            sector.WarpCount = (byte)sector.Warp.Count(warp => warp != 0);
            _sectors[sector.Number] = sector;
            sector.Update = DateTime.Now;

            // Track highest sector number seen (used by SECTORS sysconst before .twx load)
            if (sector.Number > _maxSectorSeen)
                _maxSectorSeen = sector.Number;

            // Pascal parity: saving a live sector with a special port updates the
            // database header landmark sectors. Do not clear landmark headers when a
            // sector is saved without complete port data, because live parsing
            // intentionally nulls SectorPort before the Ports line is re-read.
            // Otherwise transient partial saves can make special sectors disappear
            // from the UI even though the saved vars and subsequent parse still know
            // the correct location.
            bool isStarDock = sector.SectorPort?.ClassIndex == 9;
            bool isAlpha = sector.SectorPort?.ClassIndex == 0 &&
                           string.Equals(sector.SectorPort.Name, "Alpha Centauri", StringComparison.OrdinalIgnoreCase);
            bool isRylos = sector.SectorPort?.ClassIndex == 0 &&
                           string.Equals(sector.SectorPort.Name, "Rylos", StringComparison.OrdinalIgnoreCase);

            if (isStarDock)
            {
                if (GlobalModules.DatabaseCorrectionLoggingEnabled &&
                    _header.StarDock != 0 && _header.StarDock != ushort.MaxValue && _header.StarDock != sector.Number)
                    GlobalModules.DatabaseCorrectionLog(
                        "Database.SaveSector",
                        $"Stardock corrected from sector {_header.StarDock} to {sector.Number} while saving port '{sector.SectorPort?.Name ?? string.Empty}'.");
                _header.StarDock = (ushort)sector.Number;
            }

            if (isAlpha)
            {
                if (GlobalModules.DatabaseCorrectionLoggingEnabled &&
                    _header.AlphaCentauri != 0 && _header.AlphaCentauri != ushort.MaxValue && _header.AlphaCentauri != sector.Number)
                    GlobalModules.DatabaseCorrectionLog(
                        "Database.SaveSector",
                        $"Alpha Centauri corrected from sector {_header.AlphaCentauri} to {sector.Number} while saving port '{sector.SectorPort?.Name ?? string.Empty}'.");
                _header.AlphaCentauri = (ushort)sector.Number;
            }

            if (isRylos)
            {
                if (GlobalModules.DatabaseCorrectionLoggingEnabled &&
                    _header.Rylos != 0 && _header.Rylos != ushort.MaxValue && _header.Rylos != sector.Number)
                    GlobalModules.DatabaseCorrectionLog(
                        "Database.SaveSector",
                        $"Rylos corrected from sector {_header.Rylos} to {sector.Number} while saving port '{sector.SectorPort?.Name ?? string.Empty}'.");
                _header.Rylos = (ushort)sector.Number;
            }

            // Update warp-in cache for connected sectors
            if (updateWarpInCache)
                UpdateWarpInCache(sector);
        }

        private void RebuildWarpInCache()
        {
            foreach (var sector in _sectors.Values)
                sector.WarpsIn.Clear();

            foreach (var sector in _sectors.Values)
            {
                int origin = sector.Number;
                foreach (int warp in sector.Warp.Where(w => w > 0))
                {
                    if (!_sectors.TryGetValue(warp, out var targetSector))
                    {
                        targetSector = new SectorData { Number = warp };
                        _sectors[warp] = targetSector;
                        if (warp > _maxSectorSeen)
                            _maxSectorSeen = warp;
                    }

                    if (!targetSector.WarpsIn.Contains(origin))
                        targetSector.WarpsIn.Add(origin);
                }
            }
        }

        private bool RepairLandmarkHeadersFromSectorData()
        {
            ushort stardock = 0;
            ushort alpha = 0;
            ushort rylos = 0;

            foreach (var sector in _sectors.Values)
            {
                var port = sector.SectorPort;
                if (port == null || port.Dead)
                    continue;

                if (stardock == 0 && port.ClassIndex == 9)
                    stardock = (ushort)sector.Number;

                if (alpha == 0 &&
                    port.ClassIndex == 0 &&
                    string.Equals(port.Name, "Alpha Centauri", StringComparison.OrdinalIgnoreCase))
                {
                    alpha = (ushort)sector.Number;
                }

                if (rylos == 0 &&
                    port.ClassIndex == 0 &&
                    string.Equals(port.Name, "Rylos", StringComparison.OrdinalIgnoreCase))
                {
                    rylos = (ushort)sector.Number;
                }

                if (stardock != 0 && alpha != 0 && rylos != 0)
                    break;
            }

            bool changed = _header.StarDock != stardock ||
                           _header.AlphaCentauri != alpha ||
                           _header.Rylos != rylos;

            if (changed)
            {
                GlobalModules.DebugLog($"[ModDatabase] Repaired landmark header sectors SD {_header.StarDock}->{stardock}, Alpha {_header.AlphaCentauri}->{alpha}, Rylos {_header.Rylos}->{rylos}\n");
                if (GlobalModules.DatabaseCorrectionLoggingEnabled)
                {
                    GlobalModules.DatabaseCorrectionLog(
                        "Database.RepairLandmarks",
                        $"Landmark headers repaired: Stardock {_header.StarDock}->{stardock}, Alpha {_header.AlphaCentauri}->{alpha}, Rylos {_header.Rylos}->{rylos}.");
                }
                _header.StarDock = stardock;
                _header.AlphaCentauri = alpha;
                _header.Rylos = rylos;
            }

            return changed;
        }

        public bool RepairPlanetSightings()
        {
            bool repaired = RepairLoadedPlanetSightings();
            if (repaired)
                SaveDatabase();

            return repaired;
        }

        private bool RepairLoadedPlanetSightings()
        {
            bool changed = false;

            foreach (Planet provisional in _planets.Values
                         .Where(p => p.Id < 0 && IsAnonymousPlanetSightingName(p.Name))
                         .ToList())
            {
                changed |= _planets.TryRemove(provisional.Id, out _);
            }

            foreach (SectorData sector in _sectors.Values)
            {
                if (sector.PlanetNames.Count == 0)
                    continue;

                int removed = sector.PlanetNames.RemoveAll(IsAnonymousPlanetSightingName);
                if (removed > 0)
                    changed = true;
            }

            var knownPlanetSectorsByName = _planets.Values
                .Where(p => p.Id > 0 && p.LastSector > 0)
                .Select(p => new
                {
                    Name = NormalizePlanetNameForMatch(p.Name),
                    p.LastSector
                })
                .Where(p => !string.IsNullOrWhiteSpace(p.Name) &&
                            !IsAnonymousPlanetSightingName(p.Name))
                .GroupBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(p => p.LastSector).ToHashSet(),
                    StringComparer.OrdinalIgnoreCase);

            if (knownPlanetSectorsByName.Count > 0)
            {
                foreach (Planet provisional in _planets.Values
                             .Where(p => p.Id < 0 &&
                                         knownPlanetSectorsByName.ContainsKey(NormalizePlanetNameForMatch(p.Name)))
                             .ToList())
                {
                    changed |= _planets.TryRemove(provisional.Id, out _);
                }

                foreach (SectorData sector in _sectors.Values)
                {
                    if (sector.PlanetNames.Count == 0)
                        continue;

                    int removed = sector.PlanetNames.RemoveAll(name =>
                    {
                        string normalizedName = NormalizePlanetNameForMatch(name);
                        return !string.IsNullOrWhiteSpace(normalizedName) &&
                               knownPlanetSectorsByName.TryGetValue(normalizedName, out HashSet<int>? knownSectors) &&
                               !knownSectors.Contains(sector.Number);
                    });

                    if (removed > 0)
                        changed = true;
                }
            }

            var authoritativeMobilePlanets = _planets.Values
                .Where(p => p.Id > 0 &&
                            p.LastSector > 0 &&
                            TryGetNumberedMobilePlanetId(p.Name, out int namedId) &&
                            namedId == p.Id)
                .GroupBy(p => NormalizePlanetNameForMatch(p.Name), StringComparer.OrdinalIgnoreCase)
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .OrderByDescending(p => p.Level)
                        .ThenByDescending(p => p.LastSector)
                        .First(),
                    StringComparer.OrdinalIgnoreCase);

            foreach ((string normalizedName, Planet authoritative) in authoritativeMobilePlanets)
            {
                foreach (Planet duplicate in _planets.Values
                             .Where(p => p.Id < 0 &&
                                         PlanetDisplayNamesMatch(p.Name, normalizedName))
                             .ToList())
                {
                    changed |= _planets.TryRemove(duplicate.Id, out _);
                }

                foreach (Planet duplicate in _planets.Values
                             .Where(p => p.Id > 0 &&
                                         p.Id != authoritative.Id &&
                                         p.LastSector > 0 &&
                                         PlanetDisplayNamesMatch(p.Name, normalizedName))
                             .ToList())
                {
                    Planet update = ClonePlanet(duplicate);
                    update.LastSector = 0;
                    update.ObservedOrder = 0;
                    _planets[update.Id] = update;
                    changed = true;
                }

                foreach (SectorData sector in _sectors.Values)
                {
                    if (sector.PlanetNames.Count == 0)
                        continue;

                    if (sector.Number == authoritative.LastSector)
                        continue;

                    int removed = sector.PlanetNames.RemoveAll(name =>
                        PlanetDisplayNamesMatch(name, normalizedName));
                    if (removed > 0)
                        changed = true;
                }
            }

            foreach (SectorData sector in _sectors.Values)
                changed |= TrimRepeatedKnownPlanetSightings(sector);

            if (changed)
            {
                ResetNextProvisionalPlanetId();
                Interlocked.Increment(ref _changeStamp);
                GlobalModules.DebugLog("[ModDatabase] Repaired duplicate/stale planet sightings from loaded database\n");
            }

            return changed;
        }

        /// <summary>
        /// Get all sectors that warp into the specified sector (backdoors)
        /// </summary>
        public List<int> GetBackDoors(Sector sector, int sectorNumber)
        {
            var backDoors = new List<int>();

            if (_sectors.TryGetValue(sectorNumber, out var sectorData))
            {
                // Find all sectors not in the direct warp list that warp to this sector
                var directWarps = new HashSet<int>(sector.Warp.Where(w => w > 0));

                foreach (var warpIn in sectorData.WarpsIn)
                {
                    if (!directWarps.Contains(warpIn))
                    {
                        backDoors.Add(warpIn);
                    }
                }
            }

            return backDoors;
        }

        /// <summary>Record or update a planet by its registry ID.</summary>
        public void SavePlanet(Planet planet)
        {
            if (planet.Id == 0)
                return;

            SavePlanetWithSectorIndex(planet);
        }

        public void ClearPlanetSector(int planetId)
        {
            if (planetId == 0)
                return;

            if (!_planets.TryGetValue(planetId, out Planet? existing))
                return;

            Planet before = ClonePlanet(existing);
            Planet after = _planets.AddOrUpdate(
                planetId,
                _ => before,
                (_, existing) =>
                {
                    Planet update = ClonePlanet(existing);
                    update.LastSector = 0;
                    update.ObservedOrder = 0;
                    return update;
                });

            SyncPlanetSectorMembership(before, after);
            Interlocked.Increment(ref _changeStamp);
        }

        public Planet SaveOrAttachPlanetByOrder(Planet planet)
        {
            if (planet.LastSector <= 0)
            {
                SavePlanet(planet);
                return planet;
            }

            if (planet.ObservedOrder > 0 && planet.Id > 0)
            {
                Planet? provisional = _planets.Values
                    .Where(p => p.Id < 0 && p.LastSector == planet.LastSector && p.ObservedOrder == planet.ObservedOrder)
                    .OrderBy(p => p.Id)
                    .FirstOrDefault();

                if (provisional != null)
                {
                    Planet merged = MergePlanet(provisional, planet);
                    merged.Id = planet.Id;
                    _planets.TryRemove(provisional.Id, out _);
                    return SavePlanetWithSectorIndex(merged);
                }
            }

            SavePlanet(planet);
            return GetPlanet(planet.Id) ?? planet;
        }

        public Planet SaveOrAttachPlanetByDetail(Planet planet)
        {
            if (planet.Id <= 0)
            {
                SavePlanet(planet);
                return planet;
            }

            if (_planets.ContainsKey(planet.Id))
            {
                SavePlanet(planet);
                return GetPlanet(planet.Id) ?? planet;
            }

            if (planet.LastSector > 0)
            {
                var provisionalCandidates = _planets.Values
                    .Where(p => p.Id < 0 && p.LastSector == planet.LastSector)
                    .OrderBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                    .ThenBy(p => p.Id)
                    .ToList();

                Planet? match = null;
                string normalizedIncomingName = NormalizePlanetNameForMatch(planet.Name);
                if (!string.IsNullOrWhiteSpace(normalizedIncomingName))
                {
                    var sameName = provisionalCandidates
                        .Where(p => string.Equals(
                            NormalizePlanetNameForMatch(p.Name),
                            normalizedIncomingName,
                            StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    if (sameName.Count == 1)
                        match = sameName[0];
                }

                if (match == null && provisionalCandidates.Count == 1)
                    match = provisionalCandidates[0];

                if (match != null)
                {
                    Planet merged = MergePlanet(match, planet);
                    merged.Id = planet.Id;
                    _planets.TryRemove(match.Id, out _);
                    return SavePlanetWithSectorIndex(merged);
                }
            }

            SavePlanet(planet);
            return GetPlanet(planet.Id) ?? planet;
        }

        public void SyncSectorPlanetSightings(int sectorNumber, IReadOnlyList<Planet> sightings)
        {
            if (sectorNumber <= 0)
                return;

            var normalizedSightings = sightings
                .Select((planet, index) => new Planet
                {
                    Id = planet.Id,
                    Name = NormalizePlanetNameForMatch(planet.Name),
                    LastSector = sectorNumber,
                    ObservedOrder = index + 1,
                    Owner = planet.Owner,
                    Shielded = planet.Shielded
                })
                .Where(planet => !string.IsNullOrWhiteSpace(planet.Name))
                .ToList();

            var knownPlanets = _planets.Values
                .Where(p => p.Id > 0 && p.LastSector == sectorNumber)
                .OrderBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                .ThenBy(p => p.Id)
                .ToList();

            TrimRepeatedKnownPlanetSightings(normalizedSightings, knownPlanets);

            var provisionalPlanets = _planets.Values
                .Where(p => p.Id < 0 && p.LastSector == sectorNumber)
                .OrderBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                .ThenBy(p => p.Id)
                .ToList();

            bool removedAnonymousProvisionals = false;
            foreach (Planet provisional in provisionalPlanets
                         .Where(p => IsAnonymousPlanetSightingName(p.Name))
                         .ToList())
            {
                removedAnonymousProvisionals |= _planets.TryRemove(provisional.Id, out _);
            }

            if (removedAnonymousProvisionals)
            {
                provisionalPlanets = provisionalPlanets
                    .Where(p => !IsAnonymousPlanetSightingName(p.Name))
                    .ToList();
            }

            var matchedKnownIds = new HashSet<int>();
            var matchedSightingIndexes = new HashSet<int>();

            for (int i = 0; i < normalizedSightings.Count; i++)
            {
                Planet sighting = normalizedSightings[i];
                Planet? known = knownPlanets
                    .Where(p => !matchedKnownIds.Contains(p.Id) &&
                                PlanetDisplayNamesMatch(p.Name, sighting.Name))
                    .OrderBy(p => p.ObservedOrder == sighting.ObservedOrder ? 0 : 1)
                    .ThenBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                    .ThenBy(p => p.Id)
                    .FirstOrDefault();

                if (known == null)
                    continue;

                Planet update = ClonePlanet(sighting);
                update.Id = known.Id;
                SavePlanet(update);
                matchedKnownIds.Add(known.Id);
                matchedSightingIndexes.Add(i);
            }

            foreach (Planet stale in knownPlanets.Where(p => !matchedKnownIds.Contains(p.Id)))
            {
                // SavePlanet preserves zero sector values as "unknown"; stale sightings need an explicit clear.
                ClearPlanetSector(stale.Id);
            }

            var matchedProvisionalIds = new HashSet<int>();
            for (int i = 0; i < normalizedSightings.Count; i++)
            {
                if (matchedSightingIndexes.Contains(i))
                    continue;

                Planet sighting = ClonePlanet(normalizedSightings[i]);
                if (IsAnonymousPlanetSightingName(sighting.Name))
                    continue;

                Planet? provisional = provisionalPlanets
                    .Where(p => !matchedProvisionalIds.Contains(p.Id) &&
                                PlanetDisplayNamesMatch(p.Name, sighting.Name))
                    .OrderBy(p => p.ObservedOrder == sighting.ObservedOrder ? 0 : 1)
                    .ThenBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                    .ThenBy(p => p.Id)
                    .FirstOrDefault();

                if (provisional != null)
                {
                    sighting.Id = provisional.Id;
                    matchedProvisionalIds.Add(provisional.Id);
                }
                else
                {
                    sighting.Id = AllocateProvisionalPlanetId();
                    matchedProvisionalIds.Add(sighting.Id);
                }

                SavePlanet(sighting);
            }

            bool removedProvisionals = false;
            foreach (Planet stale in provisionalPlanets.Where(p => !matchedProvisionalIds.Contains(p.Id)))
                removedProvisionals |= _planets.TryRemove(stale.Id, out _);

            if (removedProvisionals || removedAnonymousProvisionals)
            {
                ResetNextProvisionalPlanetId();
                Interlocked.Increment(ref _changeStamp);
            }
        }

        private Planet SavePlanetWithSectorIndex(Planet planet)
        {
            Planet? before = _planets.TryGetValue(planet.Id, out Planet? existing)
                ? ClonePlanet(existing)
                : null;

            Planet after = _planets.AddOrUpdate(
                planet.Id,
                _ => ClonePlanet(planet),
                (_, existing) => MergePlanet(existing, planet));

            SyncPlanetSectorMembership(before, after);
            Interlocked.Increment(ref _changeStamp);
            return ClonePlanet(after);
        }

        private void SyncPlanetSectorMembership(Planet? before, Planet after)
        {
            if (after.Id == 0)
                return;

            int previousSector = before?.LastSector ?? 0;
            int currentSector = after.LastSector;
            string previousName = before?.Name ?? string.Empty;
            string currentName = after.Name ?? string.Empty;

            bool nameChanged = !PlanetDisplayNamesMatch(previousName, currentName);
            if (previousSector > 0 && (previousSector != currentSector || nameChanged))
            {
                RemovePlanetDisplayNameFromSector(previousSector, before ?? after, currentName);
            }

            if (currentSector > 0 && !string.IsNullOrWhiteSpace(currentName))
                AddOrUpdatePlanetDisplayNameInSector(currentSector, previousName, after);
        }

        private void RemovePlanetDisplayNameFromSector(int sectorNumber, Planet planet, string fallbackName)
        {
            string planetName = !string.IsNullOrWhiteSpace(planet.Name) ? planet.Name : fallbackName;
            if (sectorNumber <= 0 || string.IsNullOrWhiteSpace(planetName))
                return;

            if (!_sectors.TryGetValue(sectorNumber, out SectorData? sector) || sector.PlanetNames.Count == 0)
                return;

            int index = FindPlanetDisplayNameIndex(sector.PlanetNames, planetName, planet.ObservedOrder);
            if (index < 0)
                return;

            sector.PlanetNames.RemoveAt(index);
            SaveSector(sector);
        }

        private void AddOrUpdatePlanetDisplayNameInSector(int sectorNumber, string previousName, Planet planet)
        {
            if (sectorNumber <= 0 || string.IsNullOrWhiteSpace(planet.Name))
                return;

            SectorData? sector = GetOrCreateSectorData(sectorNumber);
            if (sector == null)
                return;

            string displayName = BuildPlanetSectorDisplayName(planet);
            int currentIndex = FindPlanetDisplayNameIndex(sector.PlanetNames, displayName, planet.ObservedOrder);
            if (currentIndex >= 0)
            {
                int preferredIndex = planet.ObservedOrder - 1;
                if (preferredIndex < 0 || preferredIndex == currentIndex)
                {
                    if (!string.Equals(sector.PlanetNames[currentIndex], displayName, StringComparison.Ordinal))
                    {
                        sector.PlanetNames[currentIndex] = displayName;
                        SaveSector(sector);
                    }
                    return;
                }
            }

            int previousIndex = FindPlanetDisplayNameIndex(sector.PlanetNames, previousName, planet.ObservedOrder);
            if (previousIndex >= 0)
            {
                int preferredIndex = planet.ObservedOrder - 1;
                if (preferredIndex < 0 || preferredIndex == previousIndex)
                {
                    sector.PlanetNames[previousIndex] = displayName;
                    SaveSector(sector);
                    return;
                }
            }

            int insertIndex = planet.ObservedOrder > 0
                ? Math.Clamp(planet.ObservedOrder - 1, 0, sector.PlanetNames.Count)
                : sector.PlanetNames.Count;
            sector.PlanetNames.Insert(insertIndex, displayName);
            SaveSector(sector);
        }

        private SectorData? GetOrCreateSectorData(int sectorNumber)
        {
            if (sectorNumber < 1 || (_header.Sectors > 0 && sectorNumber > _header.Sectors))
                return null;

            return _sectors.GetOrAdd(sectorNumber, sn => new SectorData { Number = sn });
        }

        private static int FindPlanetDisplayNameIndex(IReadOnlyList<string> names, string planetName, int observedOrder = 0)
        {
            if (string.IsNullOrWhiteSpace(planetName))
                return -1;

            int preferredIndex = observedOrder - 1;
            if (preferredIndex >= 0 &&
                preferredIndex < names.Count &&
                PlanetDisplayNamesMatch(names[preferredIndex], planetName))
            {
                return preferredIndex;
            }

            for (int i = 0; i < names.Count; i++)
            {
                if (PlanetDisplayNamesMatch(names[i], planetName))
                    return i;
            }

            return -1;
        }

        private bool TrimRepeatedKnownPlanetSightings(SectorData sector)
        {
            if (sector.PlanetNames.Count == 0)
                return false;

            var knownPlanets = _planets.Values
                .Where(p => p.Id > 0 && p.LastSector == sector.Number)
                .OrderBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                .ThenBy(p => p.Id)
                .ToList();

            if (knownPlanets.Count == 0 || sector.PlanetNames.Count <= knownPlanets.Count)
                return false;

            var sightings = sector.PlanetNames
                .Select((name, index) => new Planet
                {
                    Name = NormalizePlanetNameForMatch(name),
                    ObservedOrder = index + 1
                })
                .Where(planet => !string.IsNullOrWhiteSpace(planet.Name))
                .ToList();

            if (!TrimRepeatedKnownPlanetSightings(sightings, knownPlanets))
                return false;

            int trimmedCount = sightings.Count;
            if (trimmedCount >= sector.PlanetNames.Count)
                return false;

            sector.PlanetNames.RemoveRange(trimmedCount, sector.PlanetNames.Count - trimmedCount);

            bool changed = true;
            foreach (Planet duplicate in _planets.Values
                         .Where(p => p.Id < 0 &&
                                     p.LastSector == sector.Number &&
                                     p.ObservedOrder > trimmedCount)
                         .ToList())
            {
                changed |= _planets.TryRemove(duplicate.Id, out _);
            }

            return changed;
        }

        private static bool TrimRepeatedKnownPlanetSightings(List<Planet> sightings, IReadOnlyList<Planet> knownPlanets)
        {
            int knownCount = knownPlanets.Count;
            if (knownCount == 0 || sightings.Count <= knownCount)
                return false;

            if (!PlanetSightingSequenceMatches(sightings, knownPlanets, 0))
                return false;

            int index = knownCount;
            bool sawRepeatedBlock = false;
            while (index + knownCount <= sightings.Count &&
                   PlanetSightingSequenceMatches(sightings, knownPlanets, index))
            {
                sawRepeatedBlock = true;
                index += knownCount;
            }

            if (!sawRepeatedBlock || index != sightings.Count)
                return false;

            sightings.RemoveRange(knownCount, sightings.Count - knownCount);
            return true;
        }

        private static bool PlanetSightingSequenceMatches(
            IReadOnlyList<Planet> sightings,
            IReadOnlyList<Planet> knownPlanets,
            int startIndex)
        {
            if (startIndex < 0 || startIndex + knownPlanets.Count > sightings.Count)
                return false;

            for (int i = 0; i < knownPlanets.Count; i++)
            {
                if (!PlanetDisplayNamesMatch(sightings[startIndex + i].Name, knownPlanets[i].Name))
                    return false;
            }

            return true;
        }

        private static bool PlanetDisplayNamesMatch(string? left, string? right)
        {
            string normalizedLeft = NormalizePlanetNameForMatch(left);
            string normalizedRight = NormalizePlanetNameForMatch(right);
            return !string.IsNullOrWhiteSpace(normalizedLeft) &&
                   !string.IsNullOrWhiteSpace(normalizedRight) &&
                   string.Equals(normalizedLeft, normalizedRight, StringComparison.OrdinalIgnoreCase);
        }

        // "." is a valid planet name in TradeWars; do not classify any visible
        // sector planet entry as anonymous or filter it from script-visible data.
        private static bool IsAnonymousPlanetSightingName(string? name) =>
            false;

        private static string BuildPlanetSectorDisplayName(Planet planet)
        {
            string name = string.IsNullOrWhiteSpace(planet.Name) ? "." : planet.Name.Trim();
            return planet.Shielded == true &&
                   !name.Contains("(Shielded)", StringComparison.OrdinalIgnoreCase)
                ? $"{name} (Shielded)"
                : name;
        }

        /// <summary>Look up a planet by registry ID; returns null if unknown.</summary>
        public Planet? GetPlanet(int id) =>
            _planets.TryGetValue(id, out var p) ? p : null;

        public List<Planet> GetAllPlanets() =>
            _planets.Values
                .OrderBy(p => p.LastSector <= 0 ? int.MaxValue : p.LastSector)
                .ThenBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                .ThenBy(p => string.IsNullOrWhiteSpace(p.Name) ? "~" : p.Name, StringComparer.OrdinalIgnoreCase)
                .ThenBy(p => p.Id)
                .ToList();

        /// <summary>
        /// Return all planets with a known ID whose last-seen sector is <paramref name="sectorNumber"/>.
        /// The result is ordered by registry ID so script-visible enumeration is stable.
        /// </summary>
        public List<Planet> GetPlanetsInSector(int sectorNumber) =>
            _planets.Values
                .Where(p => p.LastSector == sectorNumber)
                .OrderBy(p => p.ObservedOrder > 0 ? p.ObservedOrder : int.MaxValue)
                .ThenBy(p => p.Id)
                .ToList();

        /// <summary>
        /// Returns the TWX27-style planet list for a sector.
        /// TWX27 exposes the sector's current visible planet-item list here, so the
        /// sector display cache is authoritative once it exists. Duplicate names
        /// and "." names are valid TradeWars planet names and must be preserved.
        /// If we have not yet seen a sector-visible list, fall back to the ID-keyed
        /// planet records so scripts can still see known planets discovered from
        /// other paths.
        /// </summary>
        public List<string> GetPlanetNamesInSector(int sectorNumber)
        {
            var sector = GetSector(sectorNumber);
            var sectorPlanetNames = sector?.PlanetNames
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .ToList() ?? new List<string>();

            if (sectorPlanetNames.Count > 0)
                return sectorPlanetNames;

            var planets = GetPlanetsInSector(sectorNumber);
            return planets.Select(BuildPlanetSectorDisplayName).ToList();
        }

        private List<string> GetCanonicalPlanetDisplayNames(int sectorNumber, IReadOnlyList<string> sectorPlanetNames)
        {
            if (sectorPlanetNames.Count == 0)
                return new List<string>();

            var knownPlanets = GetPlanetsInSector(sectorNumber)
                .Where(planet => !string.IsNullOrWhiteSpace(planet.Name))
                .ToList();
            if (knownPlanets.Count == 0)
            {
                return sectorPlanetNames
                    .Where(name => !IsAnonymousPlanetSightingName(name))
                    .ToList();
            }

            var remainingSightings = sectorPlanetNames.ToList();

            var displayNames = new List<string>();
            foreach (Planet planet in knownPlanets)
            {
                int sightingIndex = remainingSightings.FindIndex(sighting =>
                    PlanetDisplayNamesMatch(sighting, planet.Name));
                if (sightingIndex >= 0)
                    remainingSightings.RemoveAt(sightingIndex);

                displayNames.Add(BuildPlanetSectorDisplayName(planet));
            }

            foreach (string sighting in remainingSightings)
            {
                // When the ID-keyed records already account for the same visible
                // planet name, leftover matching sector strings are stale display
                // cache from an earlier render and should not be shown as extras.
                if (knownPlanets.Any(planet => PlanetDisplayNamesMatch(planet.Name, sighting)))
                    continue;

                if (IsAnonymousPlanetSightingName(sighting))
                    continue;

                displayNames.Add(sighting);
            }

            return displayNames;
        }

        private static Planet ClonePlanet(Planet planet) => new()
        {
            Id = planet.Id,
            Name = planet.Name,
            LastSector = planet.LastSector,
            ObservedOrder = planet.ObservedOrder,
            Owner = planet.Owner,
            Level = planet.Level,
            Shielded = planet.Shielded,
            Fighters = planet.Fighters,
            FuelOre = planet.FuelOre,
            Organics = planet.Organics,
            Equipment = planet.Equipment,
        };

        private static Planet MergePlanet(Planet existing, Planet incoming) => new()
        {
            Id = incoming.Id > 0 ? incoming.Id : existing.Id,
            Name = !string.IsNullOrWhiteSpace(incoming.Name) ? incoming.Name : existing.Name,
            LastSector = incoming.LastSector > 0 ? incoming.LastSector : existing.LastSector,
            ObservedOrder = incoming.ObservedOrder > 0 ? incoming.ObservedOrder : existing.ObservedOrder,
            Owner = !string.IsNullOrWhiteSpace(incoming.Owner) ? incoming.Owner : existing.Owner,
            Level = incoming.Level > 0 ? incoming.Level : existing.Level,
            Shielded = incoming.Shielded ?? existing.Shielded,
            Fighters = incoming.Fighters >= 0 ? incoming.Fighters : existing.Fighters,
            FuelOre = incoming.FuelOre >= 0 ? incoming.FuelOre : existing.FuelOre,
            Organics = incoming.Organics >= 0 ? incoming.Organics : existing.Organics,
            Equipment = incoming.Equipment >= 0 ? incoming.Equipment : existing.Equipment,
        };

        private int AllocateProvisionalPlanetId()
        {
            while (_planets.ContainsKey(_nextProvisionalPlanetId))
                _nextProvisionalPlanetId--;

            return _nextProvisionalPlanetId--;
        }

        private static string NormalizePlanetNameForMatch(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return string.Empty;

            string normalized = raw.Trim();
            normalized = normalized.Replace("<<<<", string.Empty, StringComparison.Ordinal);
            normalized = normalized.Replace(">>>>", string.Empty, StringComparison.Ordinal);
            normalized = normalized.Trim();
            normalized = Regex.Replace(normalized, @"\s*\(Shielded\)\s*$", string.Empty, RegexOptions.IgnoreCase);
            normalized = normalized.Trim();
            normalized = Regex.Replace(normalized, @"^\([A-Z]\)\s*", string.Empty, RegexOptions.IgnoreCase);
            return normalized.Trim();
        }

        private static bool TryGetNumberedMobilePlanetId(string? name, out int id)
        {
            id = 0;
            string normalizedName = NormalizePlanetNameForMatch(name);
            Match match = Regex.Match(normalizedName, @"^(\d+)\s+M$", RegexOptions.IgnoreCase);
            return match.Success && int.TryParse(match.Groups[1].Value, out id);
        }

        private static string BuildPlanetSectorKey(int sectorNumber, string? planetName)
        {
            string normalizedName = NormalizePlanetNameForMatch(planetName);
            return string.IsNullOrWhiteSpace(normalizedName)
                ? string.Empty
                : $"{sectorNumber}\u001f{normalizedName}";
        }

        private void ResetNextProvisionalPlanetId()
        {
            int smallestId = _planets.Keys.DefaultIfEmpty(0).Min();
            _nextProvisionalPlanetId = smallestId < 0 ? smallestId - 1 : -1;
        }

        /// <summary>
        /// Update the warp-in cache for a sector's outbound warps.
        /// Pascal has no WarpsIn cache, but we maintain one for O(1) WARPINCOUNT lookups.
        /// If the target sector doesn't exist yet we create a stub entry so the WarpsIn
        /// data is never lost (Pascal avoids this by writing every sector to disk where
        /// it always has a default record; we replicate that guarantee in memory).
        /// This updater also removes stale reverse links when a sector's outbound warps
        /// change.
        /// </summary>
        private void UpdateWarpInCache(SectorData sector)
        {
            int origin = sector.Number;
            var currentTargets = new HashSet<int>(sector.Warp.Where(w => w > 0));

            foreach (var targetSector in _sectors.Values)
            {
                if (!currentTargets.Contains(targetSector.Number))
                    targetSector.WarpsIn.Remove(origin);
            }

            foreach (var warp in currentTargets)
            {
                if (!_sectors.TryGetValue(warp, out var targetSector))
                {
                    // Target sector not yet seen — create a stub so WarpsIn is never lost.
                    // Matches Pascal where TWXDatabase.LoadSector always returns a record
                    // (default-initialised if the sector has never been explicitly saved).
                    targetSector = new SectorData { Number = warp };
                    _sectors[warp] = targetSector;
                    if (warp > _maxSectorSeen)
                        _maxSectorSeen = warp;
                }
                if (!targetSector.WarpsIn.Contains(origin))
                    targetSector.WarpsIn.Add(origin);
            }
        }

        /// <summary>
        /// Get or create sector variable
        /// </summary>
        public string GetSectorVar(int sectorNumber, string varName)
        {
            if (_sectors.TryGetValue(sectorNumber, out var sector))
            {
                return sector.Variables.TryGetValue(varName, out var value) ? value : string.Empty;
            }
            return string.Empty;
        }

        /// <summary>
        /// Set sector variable
        /// </summary>
        public void SetSectorVar(int sectorNumber, string varName, string value)
        {
            if (sectorNumber < 1 || sectorNumber > _header.Sectors)
                return;

            var sector = _sectors.GetOrAdd(sectorNumber, number => new SectorData { Number = number });

            if (string.IsNullOrEmpty(value))
            {
                sector.Variables.Remove(varName);
            }
            else
            {
                sector.Variables[varName] = value;
            }

            if (string.Equals(varName, DatabaseConstants.BustParameterName, StringComparison.OrdinalIgnoreCase))
            {
                if (IsTruthySectorParameter(value))
                    sector.Variables[DatabaseConstants.BustDateParameterName] = DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                else
                    sector.Variables.Remove(DatabaseConstants.BustDateParameterName);
            }

            Interlocked.Increment(ref _changeStamp);
        }

        public int ClearBustsBefore(DateTime localDay)
        {
            DateTime cutoff = localDay.Date;
            int cleared = 0;

            foreach (SectorData sector in _sectors.Values)
            {
                if (!sector.Variables.TryGetValue(DatabaseConstants.BustParameterName, out string? bustedValue) ||
                    !IsTruthySectorParameter(bustedValue))
                {
                    continue;
                }

                if (!sector.Variables.TryGetValue(DatabaseConstants.BustDateParameterName, out string? bustDateValue) ||
                    !TryParseBustDate(bustDateValue, out DateTime bustDate) ||
                    bustDate.Date >= cutoff)
                {
                    continue;
                }

                sector.Variables.Remove(DatabaseConstants.BustParameterName);
                sector.Variables.Remove(DatabaseConstants.FakeBustParameterName);
                sector.Variables.Remove(DatabaseConstants.BustDateParameterName);
                cleared++;
            }

            if (cleared > 0)
                Interlocked.Increment(ref _changeStamp);

            return cleared;
        }

        private static bool TryParseBustDate(string value, out DateTime date)
        {
            if (DateTime.TryParseExact(
                    value,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out date))
            {
                return true;
            }

            return DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeLocal,
                out date);
        }

        private static bool IsTruthySectorParameter(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return false;

            string trimmed = value.Trim();
            if (string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmed, "yes", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.Equals(trimmed, "false", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmed, "no", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int number)
                ? number != 0
                : !string.Equals(trimmed, "0", StringComparison.Ordinal);
        }

        /// <summary>
        /// Get all variable names for a sector
        /// </summary>
        public IEnumerable<string> GetSectorVarNames(int sectorNumber)
        {
            if (_sectors.TryGetValue(sectorNumber, out var sector))
            {
                return sector.Variables.Keys;
            }
            return Enumerable.Empty<string>();
        }

        #endregion

        #region Pathfinding

        /// <summary>
        /// Calculate shortest path between two sectors using Dijkstra's algorithm
        /// </summary>
        /// <param name="fromSector">Starting sector number</param>
        /// <param name="toSector">Destination sector number</param>
        /// <param name="avoidSectors">Set of sector numbers to avoid (optional)</param>
        /// <returns>List of sector numbers representing the path, or empty list if no path found</returns>
        public List<int> CalculateShortestPath(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            // Validate inputs
            if (fromSector < 1 || fromSector > _header.Sectors ||
                toSector < 1 || toSector > _header.Sectors)
            {
                return new List<int>();
            }

            if (fromSector == toSector)
            {
                return new List<int> { fromSector };
            }

            avoidSectors ??= new HashSet<int>();

            // Check if start or end are avoided
            if (avoidSectors.Contains(fromSector) || avoidSectors.Contains(toSector))
            {
                return new List<int>();
            }

            // Initialize Dijkstra data structures
            var distances = new Dictionary<int, int>();
            var previous = new Dictionary<int, int>();
            var visited = new HashSet<int>();

            // Priority queue: (distance, sectorNumber)
            var priorityQueue = new SortedSet<(int distance, int sector)>();

            // Initialize starting sector
            distances[fromSector] = 0;
            priorityQueue.Add((0, fromSector));

            while (priorityQueue.Count > 0)
            {
                // Get sector with minimum distance
                var (currentDist, currentSector) = priorityQueue.Min;
                priorityQueue.Remove(priorityQueue.Min);

                // Skip if already visited
                if (visited.Contains(currentSector))
                    continue;

                visited.Add(currentSector);

                // Check if we reached the destination
                if (currentSector == toSector)
                {
                    return ReconstructPath(previous, fromSector, toSector);
                }

                // Get current sector data
                var sector = GetSector(currentSector);
                if (sector == null)
                    continue;

                // Explore neighbors (warps)
                foreach (var warp in sector.Warp.Where(w => w > 0 && w <= _header.Sectors))
                {
                    int neighborSector = warp;

                    // Skip avoided sectors
                    if (avoidSectors.Contains(neighborSector))
                        continue;

                    // Skip already visited
                    if (visited.Contains(neighborSector))
                        continue;

                    // Calculate new distance (each warp has cost of 1)
                    int newDistance = currentDist + 1;

                    // Update if we found a shorter path
                    if (!distances.ContainsKey(neighborSector) || newDistance < distances[neighborSector])
                    {
                        // Remove old entry if exists
                        if (distances.ContainsKey(neighborSector))
                        {
                            priorityQueue.Remove((distances[neighborSector], neighborSector));
                        }

                        distances[neighborSector] = newDistance;
                        previous[neighborSector] = currentSector;
                        priorityQueue.Add((newDistance, neighborSector));
                    }
                }
            }

            // No path found
            return new List<int>();
        }

        /// <summary>
        /// Calculate a shortest path using the classic TWX/TWX27 breadth-first
        /// course semantics. Ties are resolved by stored warp order, and the
        /// returned path includes both start and destination sectors.
        /// </summary>
        public List<int> CalculatePascalShortestPath(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            if (fromSector < 1 || fromSector > _header.Sectors ||
                toSector < 1 || toSector > _header.Sectors)
            {
                return new List<int>();
            }

            if (fromSector == toSector)
            {
                return new List<int> { fromSector };
            }

            var avoids = avoidSectors ?? new HashSet<int>();
            var visited = new bool[_header.Sectors + 1];
            var previous = new int[_header.Sectors + 1];
            var queue = new Queue<int>();

            // Match TWX27 PlotWarpCourse semantics: the start sector itself is
            // always allowed even if it appears in the avoids set.
            visited[fromSector] = true;
            queue.Enqueue(fromSector);

            while (queue.Count > 0)
            {
                int focus = queue.Dequeue();
                var sector = GetSector(focus);
                if (sector == null)
                    continue;

                foreach (var warp in sector.Warp.Where(w => w > 0 && w <= _header.Sectors))
                {
                    int adjacent = warp;
                    if (avoids.Contains(adjacent) || visited[adjacent])
                        continue;

                    previous[adjacent] = focus;

                    if (adjacent == toSector)
                    {
                        var result = new List<int>();
                        int current = adjacent;
                        while (current > 0)
                        {
                            result.Add(current);
                            current = previous[current];
                        }

                        result.Reverse();
                        return result;
                    }

                    visited[adjacent] = true;
                    queue.Enqueue(adjacent);
                }
            }

            return new List<int>();
        }

        public IReadOnlyList<MajorSpaceLaneRoute> CalculateMajorSpaceLaneRoutes(bool markSectorParameters = false)
        {
            var routes = new List<MajorSpaceLaneRoute>(8);
            DataHeader header = DBHeader;
            int stardock = header.StarDock;
            int rylos = header.Rylos;
            int alpha = header.AlphaCentauri;

            AddMajorSpaceLaneRoute(routes, "Terra to Stardock", 1, stardock);
            AddMajorSpaceLaneRoute(routes, "Stardock to Terra", stardock, 1);
            AddMajorSpaceLaneRoute(routes, "Stardock to Rylos", stardock, rylos);
            AddMajorSpaceLaneRoute(routes, "Rylos to Stardock", rylos, stardock);
            AddMajorSpaceLaneRoute(routes, "Stardock to Alpha Centauri", stardock, alpha);
            AddMajorSpaceLaneRoute(routes, "Alpha Centauri to Stardock", alpha, stardock);
            AddMajorSpaceLaneRoute(routes, "Rylos to Alpha Centauri", rylos, alpha);
            AddMajorSpaceLaneRoute(routes, "Alpha Centauri to Rylos", alpha, rylos);

            if (markSectorParameters)
                MarkMajorSpaceLaneSectorParameters(routes);

            return routes;
        }

        public HashSet<int> GetMajorSpaceLaneSectors(bool markSectorParameters = false)
        {
            var sectors = new HashSet<int>();
            foreach (MajorSpaceLaneRoute route in CalculateMajorSpaceLaneRoutes(markSectorParameters))
            {
                foreach (int sectorNumber in route.Sectors)
                    sectors.Add(sectorNumber);
            }

            return sectors;
        }

        private void AddMajorSpaceLaneRoute(List<MajorSpaceLaneRoute> routes, string name, int fromSector, int toSector)
        {
            if (!IsKnownSector(fromSector) || !IsKnownSector(toSector))
                return;

            List<int> sectors = CalculatePascalShortestPath(fromSector, toSector);
            if (sectors.Count == 0)
                return;

            routes.Add(new MajorSpaceLaneRoute(name, fromSector, toSector, sectors));
        }

        public bool MarkMajorSpaceLaneSectorParameters(IReadOnlyList<MajorSpaceLaneRoute> routes)
        {
            bool changed = false;
            foreach (MajorSpaceLaneRoute route in routes)
            {
                foreach (int sectorNumber in route.Sectors)
                {
                    if (GetSectorVar(sectorNumber, "MSLSEC") == "1")
                        continue;

                    SetSectorVar(sectorNumber, "MSLSEC", "1");
                    changed = true;
                }
            }

            if (changed)
                Interlocked.Increment(ref _changeStamp);

            return changed;
        }

        private bool IsKnownSector(int sectorNumber)
        {
            return sectorNumber > 0 &&
                   sectorNumber != ushort.MaxValue &&
                   (_header.Sectors <= 0 || sectorNumber <= _header.Sectors);
        }

        /// <summary>
        /// Calculate a shortest path using bidirectional breadth-first search.
        /// The returned path includes both start and destination sectors. Exact
        /// tie-breaking may differ from TWX27/Pascal semantics, but hop count is
        /// guaranteed to be shortest on the directed warp graph.
        /// </summary>
        public List<int> CalculateBidirectionalShortestPath(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            if (fromSector < 1 || fromSector > _header.Sectors ||
                toSector < 1 || toSector > _header.Sectors)
            {
                return new List<int>();
            }

            if (fromSector == toSector)
            {
                return new List<int> { fromSector };
            }

            var avoids = avoidSectors ?? new HashSet<int>();
            if (avoids.Contains(toSector))
                return new List<int>();

            PathGraph graph = GetPathGraph();
            BidirectionalPathScratch scratch = GetBidirectionalScratch(graph.SectorCount);
            return scratch.FindPath(graph, fromSector, toSector, avoids);
        }

        /// <summary>
        /// Calculate every directed shortest path between two sectors. The first
        /// entries are seeded from the TWX27/Pascal BFS path and the current
        /// bidirectional path, then any remaining equal-hop paths are enumerated.
        /// </summary>
        public List<List<int>> CalculateAllShortestPaths(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            var results = new List<List<int>>();

            if (fromSector < 1 || fromSector > _header.Sectors ||
                toSector < 1 || toSector > _header.Sectors)
            {
                return results;
            }

            var avoids = avoidSectors ?? new HashSet<int>();
            if (avoids.Contains(toSector))
                return results;

            List<int> currentPath = CalculateBidirectionalShortestPath(fromSector, toSector, avoids);
            if (currentPath.Count == 0)
                return results;

            int shortestDistance = currentPath.Count - 1;
            int expectedPathLength = currentPath.Count;
            var seen = new HashSet<string>(StringComparer.Ordinal);

            void AddPath(IReadOnlyList<int> path)
            {
                if (path.Count != expectedPathLength)
                    return;
                if (path.Count == 0 || path[0] != fromSector || path[^1] != toSector)
                    return;

                string signature = string.Join(",", path);
                if (!seen.Add(signature))
                    return;

                results.Add(path.ToList());
            }

            AddPath(CalculatePascalShortestPath(fromSector, toSector, avoids));
            AddPath(currentPath);

            PathGraph graph = GetPathGraph();
            int[] distanceFromStart = CalculatePathDistances(graph.Outbound, fromSector, graph.SectorCount, avoids, fromSector);
            int[] distanceToTarget = CalculatePathDistances(graph.Inbound, toSector, graph.SectorCount, avoids, fromSector);
            if (distanceFromStart[toSector] != shortestDistance)
                return results;

            var pathBuffer = new int[expectedPathLength];
            pathBuffer[0] = fromSector;

            void Walk(int sector, int depth)
            {
                if (depth == shortestDistance)
                {
                    if (sector == toSector)
                        AddPath(pathBuffer);
                    return;
                }

                int nextDepth = depth + 1;
                foreach (int adjacent in graph.Outbound[sector])
                {
                    if (distanceFromStart[adjacent] != nextDepth)
                        continue;
                    if (distanceToTarget[adjacent] < 0)
                        continue;
                    if (nextDepth + distanceToTarget[adjacent] != shortestDistance)
                        continue;
                    if (avoids.Contains(adjacent))
                        continue;

                    pathBuffer[nextDepth] = adjacent;
                    Walk(adjacent, nextDepth);
                }
            }

            Walk(fromSector, 0);
            return results;
        }

        private static int[] CalculatePathDistances(
            int[][] edges,
            int startSector,
            int sectorCount,
            HashSet<int> avoidSectors,
            int allowedAvoidedSector)
        {
            var distances = new int[sectorCount + 1];
            Array.Fill(distances, -1);

            var queue = new int[sectorCount + 1];
            int head = 0;
            int tail = 0;
            distances[startSector] = 0;
            queue[tail++] = startSector;

            while (head < tail)
            {
                int current = queue[head++];
                int nextDistance = distances[current] + 1;
                foreach (int adjacent in edges[current])
                {
                    if (distances[adjacent] >= 0)
                        continue;
                    if (adjacent != allowedAvoidedSector && avoidSectors.Contains(adjacent))
                        continue;

                    distances[adjacent] = nextDistance;
                    queue[tail++] = adjacent;
                }
            }

            return distances;
        }

        /// <summary>
        /// Reconstruct path from previous nodes dictionary
        /// </summary>
        private List<int> ReconstructPath(Dictionary<int, int> previous, int start, int end)
        {
            var path = new List<int>();
            int current = end;

            while (current != start)
            {
                path.Add(current);
                if (!previous.ContainsKey(current))
                {
                    // Path reconstruction failed
                    return new List<int>();
                }
                current = previous[current];
            }

            path.Add(start);
            path.Reverse();
            return path;
        }

        /// <summary>
        /// Calculate distance (number of warps) between two sectors
        /// </summary>
        /// <param name="fromSector">Starting sector number</param>
        /// <param name="toSector">Destination sector number</param>
        /// <param name="avoidSectors">Set of sector numbers to avoid (optional)</param>
        /// <returns>Distance in warps, or -1 if no path exists</returns>
        public int GetDistance(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            var path = CalculateBidirectionalShortestPath(fromSector, toSector, avoidSectors);
            return path.Count > 0 ? path.Count - 1 : -1;
        }

        private PathGraph GetPathGraph()
        {
            int sectorCount = _header.Sectors;
            long changeStamp = ChangeStamp;
            PathGraph? cached = _pathGraphCache;
            if (cached != null &&
                _pathGraphCacheChangeStamp == changeStamp &&
                cached.SectorCount == sectorCount)
            {
                return cached;
            }

            lock (_pathGraphLock)
            {
                cached = _pathGraphCache;
                if (cached != null &&
                    _pathGraphCacheChangeStamp == changeStamp &&
                    cached.SectorCount == sectorCount)
                {
                    return cached;
                }

                var outbound = new int[sectorCount + 1][];
                var inbound = new int[sectorCount + 1][];
                for (int sectorNumber = 1; sectorNumber <= sectorCount; sectorNumber++)
                {
                    if (_sectors.TryGetValue(sectorNumber, out var sector))
                    {
                        outbound[sectorNumber] = ExtractValidWarps(sector.Warp, sectorCount);
                        inbound[sectorNumber] = ExtractValidWarpsIn(sector.WarpsIn, sectorCount);
                    }
                    else
                    {
                        outbound[sectorNumber] = Array.Empty<int>();
                        inbound[sectorNumber] = Array.Empty<int>();
                    }
                }

                cached = new PathGraph(sectorCount, outbound, inbound);
                _pathGraphCache = cached;
                _pathGraphCacheChangeStamp = changeStamp;
                return cached;
            }
        }

        private static int[] ExtractValidWarps(int[] warps, int sectorCount)
        {
            int validCount = 0;
            for (int i = 0; i < warps.Length; i++)
            {
                int warp = warps[i];
                if (warp > 0 && warp <= sectorCount)
                    validCount++;
            }

            if (validCount == 0)
                return Array.Empty<int>();

            var result = new int[validCount];
            int index = 0;
            for (int i = 0; i < warps.Length; i++)
            {
                int warp = warps[i];
                if (warp > 0 && warp <= sectorCount)
                    result[index++] = warp;
            }

            return result;
        }

        private static int[] ExtractValidWarpsIn(List<int> warpsIn, int sectorCount)
        {
            if (warpsIn.Count == 0)
                return Array.Empty<int>();

            int validCount = 0;
            for (int i = 0; i < warpsIn.Count; i++)
            {
                int warp = warpsIn[i];
                if (warp > 0 && warp <= sectorCount)
                    validCount++;
            }

            if (validCount == 0)
                return Array.Empty<int>();

            var result = new int[validCount];
            int index = 0;
            for (int i = 0; i < warpsIn.Count; i++)
            {
                int warp = warpsIn[i];
                if (warp > 0 && warp <= sectorCount)
                    result[index++] = warp;
            }

            return result;
        }

        private static BidirectionalPathScratch GetBidirectionalScratch(int sectorCount)
        {
            BidirectionalPathScratch scratch = _threadBidirectionalScratch ??= new BidirectionalPathScratch();
            scratch.EnsureCapacity(sectorCount);
            return scratch;
        }

        private static AllCoursesPathScratch GetAllCoursesScratch(int sectorCount)
        {
            AllCoursesPathScratch scratch = _threadAllCoursesScratch ??= new AllCoursesPathScratch();
            scratch.EnsureCapacity(sectorCount);
            return scratch;
        }

        private static ReverseDistanceScratch GetReverseDistanceScratch(int sectorCount)
        {
            ReverseDistanceScratch scratch = _threadReverseDistanceScratch ??= new ReverseDistanceScratch();
            scratch.EnsureCapacity(sectorCount);
            return scratch;
        }

        /// <summary>
        /// Return the breadth-first reachable sector queue used by Pascal PlotWarpCourse(start, 0).
        /// The starting sector is included first, followed by reachable sectors in BFS order.
        /// </summary>
        public List<int> GetReachableSectorsBreadthFirst(int startSector, HashSet<int>? avoidSectors = null)
        {
            if (startSector < 1 || startSector > _header.Sectors)
                return new List<int>();

            var visited = new HashSet<int>();
            var queue = new Queue<int>();
            var result = new List<int>();
            var avoids = avoidSectors ?? new HashSet<int>();

            visited.Add(startSector);
            queue.Enqueue(startSector);
            result.Add(startSector);

            while (queue.Count > 0)
            {
                int currentSector = queue.Dequeue();
                var sector = GetSector(currentSector);
                if (sector == null)
                    continue;

                foreach (var warp in sector.Warp.Where(w => w > 0 && w <= _header.Sectors))
                {
                    int neighbor = warp;
                    if (avoids.Contains(neighbor) || visited.Contains(neighbor))
                        continue;

                    visited.Add(neighbor);
                    queue.Enqueue(neighbor);
                    result.Add(neighbor);
                }
            }

            return result;
        }

        /// <summary>
        /// Build the Pascal-style all-courses array for a starting sector using
        /// a dedicated single-source breadth-first tree. Each entry corresponds
        /// to a destination sector number (1-based). Unreachable sectors still
        /// contain a single-element course with just themselves.
        /// </summary>
        public List<List<string>> GetAllCoursesFrom(int startSector, HashSet<int>? avoidSectors = null)
        {
            if (startSector < 1 || startSector > _header.Sectors)
                return new List<List<string>>();

            PathGraph graph = GetPathGraph();
            AllCoursesPathScratch scratch = GetAllCoursesScratch(graph.SectorCount);
            return scratch.BuildAllCourses(graph, startSector, avoidSectors ?? new HashSet<int>());
        }

        /// <summary>
        /// Find which warp from the current sector gets closest to the target sector
        /// </summary>
        /// <param name="fromSector">Current sector number</param>
        /// <param name="toSector">Target sector number</param>
        /// <param name="avoidSectors">Set of sector numbers to avoid (optional)</param>
        /// <returns>Best warp sector number, or 0 if no valid warp found</returns>
        public int GetNearestWarp(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            if (fromSector < 1 || fromSector > _header.Sectors ||
                toSector < 1 || toSector > _header.Sectors)
            {
                return 0;
            }

            var sector = GetSector(fromSector);
            if (sector == null)
                return 0;

            int[] warps = ExtractValidWarps(sector.Warp, _header.Sectors);
            if (warps.Length == 0)
                return 0;

            PathGraph graph = GetPathGraph();
            ReverseDistanceScratch scratch = GetReverseDistanceScratch(graph.SectorCount);
            return scratch.GetNearestWarp(graph, warps, toSector, avoidSectors ?? new HashSet<int>());
        }

        /// <summary>
        /// Get all warps from a sector sorted by distance to target
        /// </summary>
        /// <param name="fromSector">Current sector number</param>
        /// <param name="toSector">Target sector number</param>
        /// <param name="avoidSectors">Set of sector numbers to avoid (optional)</param>
        /// <returns>List of warp sector numbers sorted by distance to target (closest first)</returns>
        public List<int> GetWarpsSortedByDistance(int fromSector, int toSector, HashSet<int>? avoidSectors = null)
        {
            if (fromSector < 1 || fromSector > _header.Sectors)
            {
                return new List<int>();
            }

            var sector = GetSector(fromSector);
            if (sector == null)
                return new List<int>();

            int[] warps = ExtractValidWarps(sector.Warp, _header.Sectors);
            if (warps.Length == 0)
                return new List<int>();

            PathGraph graph = GetPathGraph();
            ReverseDistanceScratch scratch = GetReverseDistanceScratch(graph.SectorCount);
            return scratch.GetWarpsSortedByDistance(graph, warps, toSector, avoidSectors ?? new HashSet<int>());
        }

        #endregion

        #region Serialization

        private void WriteHeader(BinaryWriter writer)
        {
            // Always write the current version constant so the file reflects the format used.
            _header.Version = DatabaseConstants.DatabaseVersion;

            writer.Write(_header.ProgramName);
            writer.Write(_header.Version);
            writer.Write(_header.Sectors);
            writer.Write(_header.StarDock);
            writer.Write(_header.AlphaCentauri);
            writer.Write(_header.Rylos);
            writer.Write(_header.Address);
            writer.Write(_header.Description);
            writer.Write(_header.ServerPort);
            writer.Write(_header.ListenPort);
            writer.Write(_header.LoginScript);
            writer.Write(_header.Password);
            writer.Write(_header.LoginName);
            writer.Write(_header.Game);
            writer.Write(_header.IconFile);
            writer.Write(_header.UseRLogin);
            writer.Write(_header.UseLogin);
            writer.Write(_header.RobFactor);
            writer.Write(_header.StealFactor);
            writer.Write(_header.LastPortCIM.ToBinary());
            // v11+
            writer.Write(_header.CommandChar);
        }

        private void ReadHeader(BinaryReader reader)
        {
            _header.ProgramName = reader.ReadString();
            _header.Version = reader.ReadByte();
            _header.Sectors = reader.ReadInt32();
            _header.StarDock = reader.ReadUInt16();
            _header.AlphaCentauri = reader.ReadUInt16();
            _header.Rylos = reader.ReadUInt16();
            _header.Address = reader.ReadString();
            _header.Description = reader.ReadString();
            _header.ServerPort = reader.ReadUInt16();
            _header.ListenPort = reader.ReadUInt16();
            _header.LoginScript = reader.ReadString();
            _header.Password = reader.ReadString();
            _header.LoginName = reader.ReadString();
            _header.Game = reader.ReadChar();
            _header.IconFile = reader.ReadString();
            _header.UseRLogin = reader.ReadBoolean();
            _header.UseLogin = reader.ReadBoolean();
            _header.RobFactor = reader.ReadByte();
            _header.StealFactor = reader.ReadByte();
            _header.LastPortCIM = DateTime.FromBinary(reader.ReadInt64());
            // v11: CommandChar added
            if (_header.Version >= 11 && reader.BaseStream.Position < reader.BaseStream.Length)
                _header.CommandChar = reader.ReadChar();
        }

        public static bool TryReadHeader(string filename, out DataHeader header)
        {
            header = new DataHeader();

            try
            {
                using var stream = new FileStream(filename, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var reader = new BinaryReader(stream);

                header.ProgramName = reader.ReadString();
                header.Version = reader.ReadByte();
                header.Sectors = reader.ReadInt32();
                header.StarDock = reader.ReadUInt16();
                header.AlphaCentauri = reader.ReadUInt16();
                header.Rylos = reader.ReadUInt16();
                header.Address = reader.ReadString();
                header.Description = reader.ReadString();
                header.ServerPort = reader.ReadUInt16();
                header.ListenPort = reader.ReadUInt16();
                header.LoginScript = reader.ReadString();
                header.Password = reader.ReadString();
                header.LoginName = reader.ReadString();
                header.Game = reader.ReadChar();
                header.IconFile = reader.ReadString();
                header.UseRLogin = reader.ReadBoolean();
                header.UseLogin = reader.ReadBoolean();
                header.RobFactor = reader.ReadByte();
                header.StealFactor = reader.ReadByte();
                header.LastPortCIM = DateTime.FromBinary(reader.ReadInt64());
                if (header.Version >= 11 && reader.BaseStream.Position < reader.BaseStream.Length)
                    header.CommandChar = reader.ReadChar();

                return true;
            }
            catch
            {
                header = new DataHeader();
                return false;
            }
        }

        private void WriteSector(BinaryWriter writer, SectorData sector)
        {
            writer.Write(sector.Number);

            // Warps
            for (int i = 0; i < 6; i++)
            {
                if (_header.Version >= 16)
                    writer.Write(sector.Warp[i]);
                else
                    writer.Write((ushort)Math.Clamp(sector.Warp[i], ushort.MinValue, ushort.MaxValue));
            }

            // Port
            writer.Write(sector.SectorPort != null);
            if (sector.SectorPort != null)
            {
                WritePort(writer, sector.SectorPort);
            }

            // Basic properties
            writer.Write(sector.NavHaz);
            WriteSpaceObject(writer, sector.Fighters);
            WriteSpaceObject(writer, sector.MinesArmid);
            WriteSpaceObject(writer, sector.MinesLimpet);
            writer.Write(sector.Constellation);
            writer.Write(sector.Beacon);
            writer.Write(sector.Update.ToBinary());
            writer.Write(sector.Anomaly);
            writer.Write(sector.Density);
            writer.Write(sector.WarpCount);
            writer.Write((byte)sector.Explored);

            // Lists
            writer.Write(sector.Ships.Count);
            foreach (var ship in sector.Ships)
                WriteShip(writer, ship);

            writer.Write(sector.Traders.Count);
            foreach (var trader in sector.Traders)
                WriteTrader(writer, trader);

            // PlanetNames from sector display (lightweight — no IDs)
            writer.Write(sector.PlanetNames.Count);
            foreach (var name in sector.PlanetNames)
                writer.Write(name);

            writer.Write(sector.Variables.Count);
            foreach (var kvp in sector.Variables)
            {
                writer.Write(kvp.Key);
                writer.Write(kvp.Value);
            }

            writer.Write(sector.WarpsIn.Count);
            foreach (var warpIn in sector.WarpsIn)
            {
                if (_header.Version >= 16)
                    writer.Write(warpIn);
                else
                    writer.Write((ushort)Math.Clamp(warpIn, ushort.MinValue, ushort.MaxValue));
            }
        }

        private SectorData ReadSector(BinaryReader reader)
        {
            var sector = new SectorData
            {
                Number = reader.ReadInt32()
            };

            // Warps
            for (int i = 0; i < 6; i++)
            {
                sector.Warp[i] = _header.Version >= 16
                    ? reader.ReadInt32()
                    : reader.ReadUInt16();
            }

            // Port
            if (reader.ReadBoolean())
            {
                sector.SectorPort = ReadPort(reader);
            }

            // Basic properties
            sector.NavHaz = reader.ReadByte();
            sector.Fighters = ReadSpaceObject(reader);
            sector.MinesArmid = ReadSpaceObject(reader);
            sector.MinesLimpet = ReadSpaceObject(reader);
            sector.Constellation = reader.ReadString();
            sector.Beacon = reader.ReadString();
            sector.Update = DateTime.FromBinary(reader.ReadInt64());
            sector.Anomaly = reader.ReadBoolean();
            sector.Density = reader.ReadInt32();
            sector.WarpCount = reader.ReadByte();
            sector.Explored = (ExploreType)reader.ReadByte();

            // Lists
            int shipCount = reader.ReadInt32();
            for (int i = 0; i < shipCount; i++)
                sector.Ships.Add(ReadShip(reader));

            int traderCount = reader.ReadInt32();
            for (int i = 0; i < traderCount; i++)
                sector.Traders.Add(ReadTrader(reader));

            // PlanetNames from sector display
            int planetNameCount = reader.ReadInt32();
            for (int i = 0; i < planetNameCount; i++)
                sector.PlanetNames.Add(reader.ReadString());

            int varCount = reader.ReadInt32();
            for (int i = 0; i < varCount; i++)
            {
                string key = reader.ReadString();
                string value = reader.ReadString();
                sector.Variables[key] = value;
            }

            int warpInCount = reader.ReadInt32();
            for (int i = 0; i < warpInCount; i++)
            {
                sector.WarpsIn.Add(_header.Version >= 16
                    ? reader.ReadInt32()
                    : reader.ReadUInt16());
            }

            return sector;
        }

        private void WritePort(BinaryWriter writer, Port port)
        {
            writer.Write(port.Name);
            writer.Write(port.Dead);
            writer.Write(port.BuildTime);
            writer.Write(port.ClassIndex);

            foreach (ProductType pt in Enum.GetValues<ProductType>())
            {
                writer.Write(port.BuyProduct[pt]);
                writer.Write(port.ProductPercent[pt]);
                writer.Write(port.ProductAmount[pt]);
            }

            writer.Write(port.Update.ToBinary());
        }

        private Port ReadPort(BinaryReader reader)
        {
            var port = new Port
            {
                Name = reader.ReadString(),
                Dead = reader.ReadBoolean(),
                BuildTime = reader.ReadByte(),
                ClassIndex = reader.ReadByte()
            };

            foreach (ProductType pt in Enum.GetValues<ProductType>())
            {
                port.BuyProduct[pt] = reader.ReadBoolean();
                port.ProductPercent[pt] = reader.ReadByte();
                port.ProductAmount[pt] = reader.ReadUInt16();
            }

            port.Update = DateTime.FromBinary(reader.ReadInt64());
            return port;
        }

        private void WriteSpaceObject(BinaryWriter writer, SpaceObject obj)
        {
            writer.Write(obj.Quantity);
            writer.Write(obj.Owner);
            writer.Write((byte)obj.FigType);
        }

        private SpaceObject ReadSpaceObject(BinaryReader reader)
        {
            return new SpaceObject
            {
                Quantity = reader.ReadInt32(),
                Owner = reader.ReadString(),
                FigType = (FighterType)reader.ReadByte()
            };
        }

        private void WriteShip(BinaryWriter writer, Ship ship)
        {
            writer.Write(ship.Name);
            writer.Write(ship.Owner);
            writer.Write(ship.ShipType);
            writer.Write(ship.Fighters);
        }

        private Ship ReadShip(BinaryReader reader)
        {
            return new Ship
            {
                Name = reader.ReadString(),
                Owner = reader.ReadString(),
                ShipType = reader.ReadString(),
                Fighters = reader.ReadInt32()
            };
        }

        private void WriteTrader(BinaryWriter writer, Trader trader)
        {
            writer.Write(trader.Name);
            writer.Write(trader.ShipType);
            writer.Write(trader.ShipName);
            writer.Write(trader.Fighters);
            writer.Write(trader.DisplayLabel);
        }

        private Trader ReadTrader(BinaryReader reader)
        {
            var trader = new Trader
            {
                Name = reader.ReadString(),
                ShipType = reader.ReadString(),
                ShipName = reader.ReadString(),
                Fighters = reader.ReadInt32()
            };

            if (_header.Version >= 15 && reader.BaseStream.Position < reader.BaseStream.Length)
                trader.DisplayLabel = reader.ReadString();

            return trader;
        }

        #endregion

        #region Auto-Save

        private void StartAutoSave()
        {
            // Auto-save every 60 seconds
            _autoSaveTimer = new Timer(AutoSaveCallback, null, TimeSpan.FromSeconds(60), TimeSpan.FromSeconds(60));
        }

        private void StopAutoSave()
        {
            _autoSaveTimer?.Dispose();
            _autoSaveTimer = null;
        }

        private void AutoSaveCallback(object? state)
        {
            try
            {
                SaveDatabase();
            }
            catch (Exception ex)
            {
                // Log error but don't crash
                Console.WriteLine($"Auto-save failed: {ex.Message}");
            }
        }

        #endregion

        #region TWX26 Database Import

        /// <summary>
        /// Load a TWX26 database file into memory
        /// </summary>
        public void LoadFromTWX26(string filename)
        {
            CloseDatabase();

            using var fs = new FileStream(filename, FileMode.Open, FileAccess.Read);
            using var reader = new BinaryReader(fs);

            // Read the header
            _header = ReadTWX26Header(reader);
            _databaseName = Path.GetFileNameWithoutExtension(filename);
            _databasePath = filename;

            // Initialize sectors dictionary
            _sectors.Clear();

            Console.WriteLine($"Reading {_header.Sectors} sectors from TWX26 database...");

            // Read all sectors (they are stored sequentially after the header)
            for (int i = 1; i <= _header.Sectors; i++)
            {
                try
                {
                    var sector = ReadTWX26Sector(reader, i);
                    _sectors[i] = sector;

                    if (i % 100 == 0)
                    {
                        Console.WriteLine($"  Loaded {i}/{_header.Sectors} sectors...");
                    }
                }
                catch (EndOfStreamException)
                {
                    Console.WriteLine($"Warning: Reached end of file at sector {i}");
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Error reading sector {i}: {ex.Message}");
                    // Continue with next sector
                }
            }

            _isOpen = true;
            Console.WriteLine($"Successfully loaded TWX26 database: {_sectors.Count} sectors");
        }

        /// <summary>
        /// Read TWX26 header from binary file
        /// </summary>
        private DataHeader ReadTWX26Header(BinaryReader reader)
        {
            var header = new DataHeader
            {
                ProgramName = ReadPascalString(reader, 12),
                Version = reader.ReadByte(),
                Sectors = reader.ReadUInt16(),
                StarDock = reader.ReadUInt16(),
                AlphaCentauri = reader.ReadUInt16(),
                Rylos = reader.ReadUInt16(),
                Address = ReadPascalString(reader, 40),
                Description = ReadPascalString(reader, 40),
                ServerPort = reader.ReadUInt16(),
                ListenPort = reader.ReadUInt16(),
                LoginScript = ReadPascalString(reader, 255),
                Password = ReadPascalString(reader, 40),
                LoginName = ReadPascalString(reader, 40),
                Game = (char)reader.ReadByte(),
                IconFile = ReadPascalString(reader, 255),
                UseRLogin = reader.ReadBoolean(),
                UseLogin = reader.ReadBoolean(),
                RobFactor = reader.ReadByte(),
                StealFactor = reader.ReadByte(),
                LastPortCIM = SafeReadOADate(reader)
            };

            return header;
        }

        /// <summary>
        /// Read TWX26 sector from binary file
        /// </summary>
        private SectorData ReadTWX26Sector(BinaryReader reader, int sectorNumber)
        {
            var sector = new SectorData
            {
                Number = sectorNumber
            };

            // Read warps (6 warps)
            sector.Warp = new int[6];
            for (int i = 0; i < 6; i++)
            {
                sector.Warp[i] = reader.ReadUInt16();
            }

            // Read port
            var portName = ReadPascalString(reader, 40);
            if (!string.IsNullOrEmpty(portName))
            {
                sector.SectorPort = new Port
                {
                    Name = portName,
                    Dead = reader.ReadBoolean(),
                    BuildTime = reader.ReadByte(),
                    ClassIndex = reader.ReadByte()
                };

                // Read product buy flags (3 products: FuelOre, Organics, Equipment)
                for (int i = 0; i < 3; i++)
                {
                    sector.SectorPort.BuyProduct[(ProductType)i] = reader.ReadBoolean();
                }

                // Read product percentages
                for (int i = 0; i < 3; i++)
                {
                    sector.SectorPort.ProductPercent[(ProductType)i] = reader.ReadByte();
                }

                // Read product amounts
                for (int i = 0; i < 3; i++)
                {
                    sector.SectorPort.ProductAmount[(ProductType)i] = reader.ReadUInt16();
                }

                sector.SectorPort.Update = SafeReadOADate(reader);
            }
            else
            {
                // Skip port data if no port name
                reader.BaseStream.Seek(1 + 1 + 1 + 3 + 3 + 6 + 8, SeekOrigin.Current);
            }

            // Read navigation hazard
            sector.NavHaz = reader.ReadByte();

            // Read fighters
            sector.Fighters = ReadTWX26SpaceObject(reader);

            // Read armid mines
            sector.MinesArmid = ReadTWX26SpaceObject(reader);

            // Read limpet mines
            sector.MinesLimpet = ReadTWX26SpaceObject(reader);

            // Read constellation
            sector.Constellation = ReadPascalString(reader, 40);

            // Read beacon
            sector.Beacon = ReadPascalString(reader, 40);

            // Read update time
            sector.Update = SafeReadOADate(reader);

            // Read anomaly flag
            sector.Anomaly = reader.ReadBoolean();

            // Read density
            sector.Density = reader.ReadInt32();

            // Read warp count
            sector.WarpCount = reader.ReadByte();

            // Read explored type (byte enum)
            byte exploredByte = reader.ReadByte();
            // Map TWX26 TSectorExploredType to ExploreType
            // etNo=0, etCalc=1, etDensity=2, etHolo=3
            sector.Explored = exploredByte switch
            {
                0 => ExploreType.No,
                1 => ExploreType.Calc,
                2 => ExploreType.Density,
                3 => ExploreType.Yes,  // Map etHolo to Yes
                _ => ExploreType.No
            };

            // Read Ships pointer (4 bytes) - we'll skip linked list reading for now
            int shipsPtr = reader.ReadInt32();

            // Read Traders pointer (4 bytes)
            int tradersPtr = reader.ReadInt32();

            // Read Planets pointer (4 bytes)
            int planetsPtr = reader.ReadInt32();

            // Read Vars pointer (4 bytes)
            int varsPtr = reader.ReadInt32();

            // Note: Reading linked lists (ships, traders, planets, vars) requires 
            // seeking to absolute positions in the file, which we'll implement if needed

            return sector;
        }

        /// <summary>
        /// Read TWX26 SpaceObject (fighters/mines)
        /// </summary>
        private SpaceObject ReadTWX26SpaceObject(BinaryReader reader)
        {
            return new SpaceObject
            {
                Quantity = reader.ReadInt32(),
                Owner = ReadPascalString(reader, 40),
                FigType = (FighterType)reader.ReadByte()
            };
        }

        /// <summary>
        /// Read Pascal-style string (length-prefixed)
        /// </summary>
        private string ReadPascalString(BinaryReader reader, int maxLength)
        {
            byte length = reader.ReadByte();
            if (length > maxLength)
                length = (byte)maxLength;

            if (length == 0)
            {
                // Skip the rest of the allocated space
                reader.BaseStream.Seek(maxLength, SeekOrigin.Current);
                return string.Empty;
            }

            byte[] bytes = reader.ReadBytes(length);

            // Skip remaining allocated space
            int remaining = maxLength - length;
            if (remaining > 0)
                reader.BaseStream.Seek(remaining, SeekOrigin.Current);

            // Try Windows-1252 encoding, fallback to ASCII if not available
            try
            {
                // Register encoding provider for code page support (needed on non-Windows platforms)
                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                return System.Text.Encoding.GetEncoding(1252).GetString(bytes);
            }
            catch
            {
                // Fallback to ASCII if Windows-1252 is not available
                return System.Text.Encoding.ASCII.GetString(bytes);
            }
        }

        /// <summary>
        /// Safely read OLE Automation date, returning DateTime.MinValue if invalid
        /// </summary>
        private DateTime SafeReadOADate(BinaryReader reader)
        {
            double oaDate = reader.ReadDouble();
            try
            {
                return DateTime.FromOADate(oaDate);
            }
            catch
            {
                // Return MinValue for invalid dates
                return DateTime.MinValue;
            }
        }

        #endregion

        #region Network Operations

        /// <summary>
        /// Start network connection for this database game
        /// </summary>
        public async Task StartNetworkAsync()
        {
            if (_gameInstance != null && _gameInstance.IsRunning)
            {
                throw new InvalidOperationException("Network is already running");
            }

            if (string.IsNullOrWhiteSpace(_header.Address))
            {
                throw new InvalidOperationException("Server address is not configured");
            }

            if (_header.ServerPort == 0 || _header.ListenPort == 0)
            {
                throw new InvalidOperationException("Server port or listen port is not configured");
            }

            // Initialize network manager if needed
            _networkManager ??= new NetworkManager();

            GlobalModules.DebugLog($"[StartNetworkAsync] Starting game instance for {_databaseName}\n");

            // Start the game instance
            _gameInstance = await _networkManager.StartGameAsync(
                _databaseName,
                _header.Address,
                _header.ServerPort,
                _header.ListenPort,
                _header.CommandChar  // Use command character from database configuration
            );

            GlobalModules.DebugLog($"[StartNetworkAsync] Game instance started, subscribing to events\n");

            // Hook up event handlers for script processing
            _gameInstance.CommandReceived += OnCommandReceived;
            _gameInstance.Connected += OnConnected;
            _gameInstance.Disconnected += OnDisconnected;

            GlobalModules.DebugLog($"[StartNetworkAsync] Events subscribed successfully\n");

            // Set up script access to game instance and database
            ScriptRef.SetActiveGameInstance(_gameInstance);
            ScriptRef.SetActiveDatabase(this);

            Console.WriteLine($"Network started for {_databaseName}");
        }

        /// <summary>
        /// Stop network connection
        /// </summary>
        public async Task StopNetworkAsync()
        {
            if (_gameInstance != null)
            {
                // Unhook event handlers
                _gameInstance.CommandReceived -= OnCommandReceived;
                _gameInstance.Connected -= OnConnected;
                _gameInstance.Disconnected -= OnDisconnected;

                await _gameInstance.StopAsync();
                _gameInstance.Dispose();
                _gameInstance = null;

                // Clear script database reference
                ScriptRef.SetActiveDatabase(null);

                Console.WriteLine($"Network stopped for {_databaseName}");
            }
        }

        /// <summary>
        /// Stop a specific game instance by name
        /// </summary>
        public async Task StopGameInstanceAsync(string gameName)
        {
            if (_networkManager != null)
            {
                await _networkManager.StopGameAsync(gameName);

                // If this was our game instance, clear the reference
                if (_gameInstance != null && _gameInstance.GameName == gameName)
                {
                    _gameInstance = null;
                }
            }
        }

        /// <summary>
        /// Stop all game instances
        /// </summary>
        public async Task StopAllGameInstancesAsync()
        {
            if (_networkManager != null)
            {
                await _networkManager.StopAllGamesAsync();
                _gameInstance = null;
            }
        }

        /// <summary>
        /// Send a message to the local client
        /// </summary>
        public async Task SendMessageAsync(string message)
        {
            if (_gameInstance != null && _gameInstance.IsRunning)
            {
                await _gameInstance.SendMessageAsync(message);
            }
        }

        /// <summary>
        /// Send raw data to the server
        /// </summary>
        public async Task SendToServerAsync(byte[] data)
        {
            if (_gameInstance != null && _gameInstance.IsRunning)
            {
                await _gameInstance.SendToServerAsync(data);
            }
        }

        /// <summary>
        /// Send raw data to the local client
        /// </summary>
        public async Task SendToLocalAsync(byte[] data)
        {
            if (_gameInstance != null && _gameInstance.IsRunning)
            {
                await _gameInstance.SendToLocalAsync(data);
            }
        }

        #endregion

        #region Network Event Handlers

        private void OnCommandReceived(object? sender, CommandEventArgs e)
        {
            // TODO: Handle TWX proxy commands
            // Example commands: STATUS, SAVE, RELOAD, SCRIPT, etc.
            Console.WriteLine($"[{_databaseName}] Command received: {e.Command}");
        }

        private void OnConnected(object? sender, EventArgs e)
        {
            Console.WriteLine($"[{_databaseName}] Connected to server");
        }

        private void OnDisconnected(object? sender, DisconnectEventArgs e)
        {
            Console.WriteLine($"[{_databaseName}] Disconnected: {e.Reason}");
        }

        #endregion

        private sealed class PathGraph
        {
            public PathGraph(int sectorCount, int[][] outbound, int[][] inbound)
            {
                SectorCount = sectorCount;
                Outbound = outbound;
                Inbound = inbound;
            }

            public int SectorCount { get; }
            public int[][] Outbound { get; }
            public int[][] Inbound { get; }
        }

        private sealed class AllCoursesPathScratch
        {
            private int[] _visitStamp = Array.Empty<int>();
            private int[] _previous = Array.Empty<int>();
            private int[] _queue = Array.Empty<int>();
            private int _stamp;

            public void EnsureCapacity(int sectorCount)
            {
                int size = sectorCount + 1;
                if (_visitStamp.Length >= size)
                    return;

                _visitStamp = new int[size];
                _previous = new int[size];
                _queue = new int[size];
                _stamp = 0;
            }

            public List<List<string>> BuildAllCourses(PathGraph graph, int startSector, HashSet<int> avoidSectors)
            {
                int stamp = NextStamp();
                bool hasAvoids = avoidSectors.Count > 0;
                int head = 0;
                int tail = 0;

                _visitStamp[startSector] = stamp;
                _previous[startSector] = 0;
                _queue[tail++] = startSector;

                while (head < tail)
                {
                    int focus = _queue[head++];
                    int[] warps = graph.Outbound[focus];
                    for (int i = 0; i < warps.Length; i++)
                    {
                        int adjacent = warps[i];
                        if (_visitStamp[adjacent] == stamp)
                            continue;
                        if (hasAvoids && avoidSectors.Contains(adjacent))
                            continue;

                        _visitStamp[adjacent] = stamp;
                        _previous[adjacent] = focus;
                        _queue[tail++] = adjacent;
                    }
                }

                var courses = new List<List<string>>(graph.SectorCount);
                for (int sectorNumber = 1; sectorNumber <= graph.SectorCount; sectorNumber++)
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

        private sealed class ReverseDistanceScratch
        {
            private int[] _visitStamp = Array.Empty<int>();
            private int[] _distance = Array.Empty<int>();
            private int[] _queue = Array.Empty<int>();
            private int _stamp;

            public void EnsureCapacity(int sectorCount)
            {
                int size = sectorCount + 1;
                if (_visitStamp.Length >= size)
                    return;

                _visitStamp = new int[size];
                _distance = new int[size];
                _queue = new int[size];
                _stamp = 0;
            }

            public int GetNearestWarp(PathGraph graph, IReadOnlyList<int> warps, int targetSector, HashSet<int> avoidSectors)
            {
                int[] distances = ScoreWarps(graph, warps, targetSector, avoidSectors);
                int bestWarp = 0;
                int bestDistance = int.MaxValue;

                for (int i = 0; i < warps.Count; i++)
                {
                    int distance = distances[i];
                    if (distance >= 0 && distance < bestDistance)
                    {
                        bestDistance = distance;
                        bestWarp = warps[i];
                    }
                }

                return bestWarp;
            }

            public List<int> GetWarpsSortedByDistance(PathGraph graph, IReadOnlyList<int> warps, int targetSector, HashSet<int> avoidSectors)
            {
                int[] distances = ScoreWarps(graph, warps, targetSector, avoidSectors);
                return Enumerable.Range(0, warps.Count)
                    .Select(index => (warp: warps[index], distance: distances[index]))
                    .OrderBy(item => item.distance < 0 ? int.MaxValue : item.distance)
                    .ThenBy(item => item.warp)
                    .Select(item => item.warp)
                    .ToList();
            }

            private int[] ScoreWarps(PathGraph graph, IReadOnlyList<int> warps, int targetSector, HashSet<int> avoidSectors)
            {
                var distances = new int[warps.Count];
                Array.Fill(distances, -1);

                if (targetSector < 1 || targetSector > graph.SectorCount)
                    return distances;

                bool hasAvoids = avoidSectors.Count > 0;
                if (hasAvoids && avoidSectors.Contains(targetSector))
                    return distances;

                int unresolved = 0;
                for (int i = 0; i < warps.Count; i++)
                {
                    int warp = warps[i];
                    if (hasAvoids && avoidSectors.Contains(warp))
                        continue;

                    if (warp == targetSector)
                    {
                        distances[i] = 0;
                    }
                    else
                    {
                        unresolved++;
                    }
                }

                if (unresolved == 0)
                    return distances;

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
                    int[] inbound = graph.Inbound[focus];
                    for (int i = 0; i < inbound.Length; i++)
                    {
                        int previous = inbound[i];
                        if (_visitStamp[previous] == stamp)
                            continue;
                        if (hasAvoids && avoidSectors.Contains(previous))
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

                return distances;
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

        private sealed class BidirectionalPathScratch
        {
            private int[] _visitStampForward = Array.Empty<int>();
            private int[] _visitStampBackward = Array.Empty<int>();
            private int[] _distanceForward = Array.Empty<int>();
            private int[] _distanceBackward = Array.Empty<int>();
            private int[] _previousForward = Array.Empty<int>();
            private int[] _nextBackward = Array.Empty<int>();
            private int[] _queueForward = Array.Empty<int>();
            private int[] _queueBackward = Array.Empty<int>();
            private int _stamp;

            public void EnsureCapacity(int sectorCount)
            {
                int size = sectorCount + 1;
                if (_visitStampForward.Length >= size)
                    return;

                _visitStampForward = new int[size];
                _visitStampBackward = new int[size];
                _distanceForward = new int[size];
                _distanceBackward = new int[size];
                _previousForward = new int[size];
                _nextBackward = new int[size];
                _queueForward = new int[size];
                _queueBackward = new int[size];
                _stamp = 0;
            }

            public List<int> FindPath(PathGraph graph, int fromSector, int toSector, HashSet<int> avoidSectors)
            {
                int stamp = NextStamp();
                int headForward = 0;
                int tailForward = 0;
                int headBackward = 0;
                int tailBackward = 0;
                int bestMeet = 0;
                int bestDistance = int.MaxValue;
                bool hasAvoids = avoidSectors.Count > 0;

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
                        ExpandForwardLevel(graph, stamp, hasAvoids, avoidSectors,
                            ref headForward, ref tailForward, ref bestMeet, ref bestDistance);
                    }
                    else
                    {
                        ExpandBackwardLevel(graph, stamp, hasAvoids, avoidSectors, fromSector,
                            ref headBackward, ref tailBackward, ref bestMeet, ref bestDistance);
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

            private void ExpandForwardLevel(
                PathGraph graph,
                int stamp,
                bool hasAvoids,
                HashSet<int> avoidSectors,
                ref int head,
                ref int tail,
                ref int bestMeet,
                ref int bestDistance)
            {
                int levelDistance = _distanceForward[_queueForward[head]];
                while (head < tail && _distanceForward[_queueForward[head]] == levelDistance)
                {
                    int current = _queueForward[head++];
                    int[] warps = graph.Outbound[current];
                    for (int i = 0; i < warps.Length; i++)
                    {
                        int adjacent = warps[i];
                        if (_visitStampForward[adjacent] == stamp)
                            continue;

                        if (hasAvoids && avoidSectors.Contains(adjacent))
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

            private void ExpandBackwardLevel(
                PathGraph graph,
                int stamp,
                bool hasAvoids,
                HashSet<int> avoidSectors,
                int fromSector,
                ref int head,
                ref int tail,
                ref int bestMeet,
                ref int bestDistance)
            {
                int levelDistance = _distanceBackward[_queueBackward[head]];
                while (head < tail && _distanceBackward[_queueBackward[head]] == levelDistance)
                {
                    int current = _queueBackward[head++];
                    int[] inbound = graph.Inbound[current];
                    for (int i = 0; i < inbound.Length; i++)
                    {
                        int previous = inbound[i];
                        if (_visitStampBackward[previous] == stamp)
                            continue;

                        if (hasAvoids && previous != fromSector && avoidSectors.Contains(previous))
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

        #region IDisposable

        public override void Dispose()
        {
            // Stop network first
            if (_gameInstance != null)
            {
                StopNetworkAsync().Wait();
            }
            _networkManager?.Dispose();

            CloseDatabase();
            _headerLock?.Dispose();
            base.Dispose();
        }

        #endregion
    }
}
