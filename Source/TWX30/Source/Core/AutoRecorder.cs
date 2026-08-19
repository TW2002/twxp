/*
 * AutoRecorder.cs
 * Parses incoming game text and updates the sector database in real-time.
 * This replicates the "Auto Recorder" functionality of the original Pascal TWX Proxy.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TWXProxy.Core
{
    /// <summary>
    /// Stateful parser that reads lines of game output and keeps the sector database
    /// up to date.  Called for every complete (and partial) line received from the
    /// game server before text triggers are fired so that getSector / sysconst calls
    /// always see current data.
    /// </summary>
    public class AutoRecorder
    {
        // ── State ──────────────────────────────────────────────────────────────
        private int _lastSector;        // Most recently seen "Sector  : NNNN" number
        private bool _inDensityScan;     // Inside a Relative Density Scan block
        private bool _inHoloScan;        // Inside a Holo Scan block
        private int _currentSector;     // Sector extracted from most recent Command prompt

        // Density-scan warp collection: all sectors listed in an active density scan
        // are adjacent to the player's current sector — so we collect them and write
        // them as Warp[] for the origin sector when the scan finishes.
        private int _densityFromSector;  // _currentSector snapshot at scan start
        private readonly List<int> _densityScanSectors = new();

        // Sector-display position: tracks which continuation-line type we're inside
        private enum SectorPos { None, Mines, Ports, Planets, Traders, Ships }
        private SectorPos _sectorPos;
        private int _activeSectorDisplaySector;
        private bool _activeSectorDisplaySawPort;
        private bool _activeSectorDisplayHadCachedPort;
        private readonly Trader _currentTrader = new();
        private readonly Ship _currentShip = new();

        // StarDock prompt / purchase tracking
        private enum DockArea { None, StarDock, HardwareEmporium, Shipyards, ShipyardCommerce }
        private DockArea _dockArea;
        private enum PendingDockPurchaseKind { None, Quantity, HoloScanner, DensityScanner, PlanetScanner, TransWarp1, TransWarp2 }
        private PendingDockPurchaseKind _pendingDockPurchaseKind;
        private string _pendingDockPurchaseItemName = string.Empty;
        private int _pendingDockPurchaseQuantity;

        // Planet fighter transfer tracking
        private enum PendingPlanetFighterTransferKind { None, Take, Leave }
        private PendingPlanetFighterTransferKind _pendingPlanetFighterTransferKind;
        private int _pendingPlanetFighterTransferQuantity;

        private enum PlanetProductTransferKind { None, Take, Leave }
        private PlanetProductTransferKind _pendingPlanetProductTransferKind;
        private string _pendingPlanetProductName = string.Empty;
        private int _pendingPlanetProductQuantity;

        private int _pendingSectorDefenseSector;
        private int _pendingSectorDefenseQuantity;
        private string _pendingSectorDefenseOwner = string.Empty;
        private FighterType _pendingSectorDefenseType = FighterType.None;
        private int _pendingTransporterShipNumber;

        // Planet land-list / detail parsing state
        private bool _inLandList;     // True after "Registry# and Planet Name" header
        private int _landListSector; // Sector the land list belongs to (_lastSector at entry)
        private int _lastLandListPlanetId;
        private int _activePlanetDetailId;
        private int _landedPlanetId;
        private int _landListPlanetIndex;
        private readonly List<bool> _pendingLandListShielded = new();

        // Warp-lane (Frontier Map) parsing state
        // Pascal: TModExtractor.ProcessWarpLine / FCurrentDisplay = dWarpLane
        // Activated by "The shortest path (" or "  TO > " lines from the f command.
        private bool _inWarpLane;        // Currently inside an FM path response
        private readonly StringBuilder _warpLaneBuffer = new();
        private bool _inNavPointDisplay; // Inside "<Set Course to NavPoint>" preview output

        // Commerce / port report parsing state
        // Pascal: Process.ParsePortReport — triggered by "Commerce report for X:"
        private bool _inPortReport;       // Inside a commerce report block
        private int _portReportSector;   // Sector whose port is being updated
        private bool _portReportHasFuel;  // Fuel Ore line was received
        private bool _portReportHasOrg;   // Organics line was received
        private int _pendingPortReportSectorOverride;
        private PortStaticSnapshot? _portReportOriginalSnapshot;

        // CIM (Computer Information Menu) download state.
        // Pascal: TDisplay dCIM → dPortCIM or dWarpCIM.
        // Triggered by the ": " prompt sent by the game after ^R.
        // The first data line identifies which kind of CIM is coming:
        //   port CIM → line ends with '%'
        //   warp CIM → line ends with a number
        private bool _inCIM;              // Waiting to identify first data line
        private bool _inPortCIM;          // Processing port CIM lines
        private bool _inWarpCIM;          // Processing warp CIM lines
        private bool _inFigScan;          // Processing deployed fighter scan lines
        private readonly HashSet<int> _currentFigScanSectors = new();
        private enum MineScanKind { None, Armid, Limpet }
        private MineScanKind _inMineScanKind;
        private readonly Dictionary<int, (int Quantity, string Owner)> _currentMineScanSectors = new();
        private bool _portCimBatchActive; // Tracking sectors observed in the current port CIM pass
        private readonly HashSet<int> _currentPortCimSectors = new();

        // ── Empty-density-scan detection ──────────────────────────────────────
        // ── Public API ─────────────────────────────────────────────────────────

        /// <summary>
        /// True while holo-scan sector lines are being received.  Used to track
        /// whether "Sector  : NNNN" lines are neighbours (holo scan) or the current
        /// sector (D command / movement display).
        /// </summary>
        public bool InHoloScan => _inHoloScan;

        /// <summary>
        /// The sector number most recently seen in a <c>Command [TL=...]:[N]</c> prompt
        /// or a <c>Sector  : N</c> display line, matching the TWX27 extractor behavior.
        /// </summary>
        public int CurrentSector => _currentSector;

        /// <summary>
        /// Raised on the thread-pool (same thread as <see cref="RecordLine"/>) whenever
        /// a prompt-derived current sector changes — i.e. each time a new sector number
        /// is extracted from a <c>Command [TL=...]:[N]</c> prompt.  Argument is the new
        /// sector number.
        /// </summary>
        public event Action<int>? CurrentSectorChanged;

        /// <summary>
        /// Raised whenever live parsing updates landmark sectors such as Stardock,
        /// Alpha Centauri, or Rylos in the active database header.
        /// </summary>
        public event Action? LandmarkSectorsChanged;

        /// <summary>
        /// Raised when the server confirms a planet build, which consumes one
        /// genesis torpedo from the player's ship inventory.
        /// </summary>
        public event Action<int>? GenesisTorpsChanged;

        /// <summary>
        /// Raised when the server confirms a planet detonation, which consumes one
        /// atomic detonator from the player's ship inventory.
        /// </summary>
        public event Action<int>? AtomicDetChanged;

        /// <summary>
        /// Raised when StarDock prompts reveal a live ship inventory or credit change.
        /// </summary>
        public event Action<ShipStatusDelta>? ShipStatusDeltaDetected;

        /// <summary>
        /// Clears parser state when a session or active database changes so stale
        /// display/report mode from a previous game cannot bleed into the next one.
        /// </summary>
        public void ResetState(string reason = "manual")
        {
            _lastSector = 0;
            _inDensityScan = false;
            _inHoloScan = false;
            _currentSector = 0;
            _densityFromSector = 0;
            _densityScanSectors.Clear();
            _sectorPos = SectorPos.None;
            _activeSectorDisplaySector = 0;
            _activeSectorDisplaySawPort = false;
            _activeSectorDisplayHadCachedPort = false;
            _currentTrader.DisplayLabel = "Traders";
            _currentTrader.Name = string.Empty;
            _currentTrader.ShipType = string.Empty;
            _currentTrader.ShipName = string.Empty;
            _currentTrader.Fighters = 0;
            _currentShip.Name = string.Empty;
            _currentShip.Owner = string.Empty;
            _currentShip.ShipType = string.Empty;
            _currentShip.Fighters = 0;
            _inLandList = false;
            _landListSector = 0;
            _lastLandListPlanetId = 0;
            _activePlanetDetailId = 0;
            _landedPlanetId = 0;
            _landListPlanetIndex = 0;
            _pendingLandListShielded.Clear();
            _dockArea = DockArea.None;
            _inWarpLane = false;
            _warpLaneBuffer.Clear();
            _inNavPointDisplay = false;
            _inPortReport = false;
            _portReportSector = 0;
            _portReportHasFuel = false;
            _portReportHasOrg = false;
            _pendingPortReportSectorOverride = 0;
            _inCIM = false;
            _inPortCIM = false;
            _inWarpCIM = false;
            _inFigScan = false;
            _pendingPlanetFighterTransferKind = PendingPlanetFighterTransferKind.None;
            _pendingPlanetFighterTransferQuantity = 0;
            _pendingPlanetProductTransferKind = PlanetProductTransferKind.None;
            _pendingPlanetProductName = string.Empty;
            _pendingPlanetProductQuantity = 0;
            _pendingTransporterShipNumber = 0;

            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] State reset reason={reason}\n");
        }

        // ── Compiled Regex ─────────────────────────────────────────────────────
        // "Sector  : 3942 in The Crucible" — sector display header (D command, holo scan)
        // Group 1 = sector number, Group 2 = optional constellation name after " in "
        private static readonly Regex _rxSector = new(
            @"^Sector\s{1,4}:\s*(\d+)(?:\s+in\s+(.+))?", RegexOptions.Compiled);

        // "(T) Sector  : 1 in The Federation."
        // "(S) Sector  : 1034 in The Federation."
        // "(*) Sector  : 4306 in The Federation."
        // "(1) Sector  : 4612 in uncharted space."
        // NavPoint previews prefix the sector header, so they must not reuse the
        // previous sector when parsing the following indented port lines. The
        // prefix is not limited to letters; it can also be "*", or a navpoint slot
        // number like "(1)" / "(4)".
        private static readonly Regex _rxNavPointSector = new(
            @"^\([^)]+\)\s+Sector\s{1,4}:\s*(\d+)(?:\s+in\s+(.+))?", RegexOptions.Compiled);

        // "Warps to Sector(s) :  4497 - 5489 - 6477 - 15024 - 19702"
        // Parenthesised entries like "(3583)" are unexplored sectors and are still valid
        // outbound warps — the parentheses are stripped in ParseWarpsLine.
        // Leading optional whitespace handles indented holo-scan display format.
        private static readonly Regex _rxWarps = new(
            @"^\s*Warps to Sector\(s\)\s*:\s*(.+)", RegexOptions.Compiled);

        // "Ports   : Leander Minor, Class 3 (SBB)"
        // Group 1 = name, Group 2 = class number, Group 3 = optional SBB notation
        // Leading optional whitespace handles indented holo-scan display format.
        private static readonly Regex _rxPort = new(
            @"^\s*Ports\s+:\s+(.+),\s+Class\s+(\d+)(?:\s*\(([BSbs]{3})\))?", RegexOptions.Compiled);

        private static readonly Regex _rxPortDestroyed = new(
            @"^\s*Ports\s+:\s+.*<=-DANGER-=>", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // "Beacon  : FedSpace, FedLaw Enforced"
        private static readonly Regex _rxBeacon = new(
            @"^\s*Beacon\s+:\s+(.+)", RegexOptions.Compiled);

        // "Command [TL=00:00:00]:[4497]" — extracts current sector from game prompt
        private static readonly Regex _rxCommandSector = new(
            @"Command \[TL=.*?\]:\[(\d+)\]", RegexOptions.Compiled);

        private static readonly Regex _rxComputerSector = new(
            @"Computer command \[TL=.*?\]:\[(\d+)\]", RegexOptions.Compiled);

        // "Commerce report for Howdah Primus:"
        private static readonly Regex _rxCommerceReport = new(
            @"^Commerce report for (.+?):", RegexOptions.Compiled);

        // "Fuel Ore   Selling   1600    100%       0"
        // "Organics   Buying    1630    100%       0"
        // "Equipment  Buying    2310    100%       0"
        private static readonly Regex _rxProductLine = new(
            @"^(Fuel Ore|Organics|Equipment)\s+(Selling|Buying)\s+([\d,]+)\s+(\d+)%",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // Density scan data line:
        // "Sector   4497  ==>              0  Warps : 3    NavHaz :     0%    Anom : No"
        // "Sector ( 5528) ==>              0  Warps : 4    NavHaz :     0%    Anom : No"
        private static readonly Regex _rxDensityLine = new(
            @"^\s*Sector\s+(?:\(\s*)?(\d+)(?:\s*\))?\s+==>\s+([\d,]+)\s+Warps\s*:\s*(\d+)\s+NavHaz\s*:\s*(\d+)%\s+Anom\s*:\s*(Yes|No)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // "Fighters: 2,316,238 (belong to your Corp) [Defensive]"
        // "Fighters: 50 (offensive) owned by yours"
        // Quantity may contain commas.  Owner is the text inside the first ( ).
        // FigType comes from an optional trailing [Toll]/[Defensive]/[Offensive] bracket.
        private static readonly Regex _rxFighters = new(
            @"^Fighters\s*:\s*([\d,]+)\s+\((.+?)\)(?:\s+\[(.+?)\])?",
            RegexOptions.Compiled);

        // "NavHaz  :  15%" — NavHaz from sector display
        private static readonly Regex _rxNavHaz = new(
            @"^NavHaz\s+:\s+(\d+)%", RegexOptions.Compiled);

        // "Mines   : 3 (Type 1 Armid) (belong to your Corp)"
        // "Mines   : 3 (Type 2 Limpet) owned by yours"
        private static readonly Regex _rxMines = new(
            @"^Mines\s+:\s+(\d+)\s+\(Type\s+\d+\s+(Armid|Limpet)\)\s*(.*)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // Continuation mine line indented with spaces:
        // "        : 3 (Type 2 Limpet) (belong to your Corp)"
        private static readonly Regex _rxMinesCont = new(
            @"^\s+:\s+(\d+)\s+\(Type\s+\d+\s+(Armid|Limpet)\)\s*(.*)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // "Planets : <<<< (L) Romulus >>>> (Shielded)"  — first planet on the line
        private static readonly Regex _rxPlanets = new(
            @"^Planets?\s+:\s+(.*)", RegexOptions.Compiled);

        // Planet continuation line: any indented continuation while the sector parser is
        // inside the planets block. TWX27 accepts plain lines like
        // "          (M) ." as well as decorated forms such as
        // "          <<<< (L) Vulcan >>>> (Shielded)".
        private static readonly Regex _rxPlanetCont = new(
            @"^\s{2,}(.+\S)\s*$", RegexOptions.Compiled);

        // Land-list entry (from the L command at a sector):
        // "   <   8> Romulus                            Level 6   0%     10M     15%    L"
        private static readonly Regex _rxLandEntry = new(
            @"^\s+<\s*(\d+)>\s+(\S[^<]*?)\s{3,}", RegexOptions.Compiled);

        private static readonly Regex _rxLandEntryDetail = new(
            @"^\s+<\s*(\d+)>\s+(\S.*?\S?)\s{2,}(?:Level\s+(\d+)|None)\s+\S+\s+(\S+)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetOwnedBy = new(
            @"^\s*Owned by:\s+(.+?)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // Planet detail header (inside a planet):
        // "Planet #55 in sector 12545: ."
        private static readonly Regex _rxPlanetDetail = new(
            @"^Planet\s+#(\d+)\s+in\s+sector\s+(\d+)\s*:\s*(.*)", RegexOptions.Compiled);

        private static readonly Regex _rxPlanetClaimedBy = new(
            @"^Claimed by:\s+(.+?)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetCitadelLevel = new(
            @"^Planet has a level\s+(\d+)\s+Citadel",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetInventoryLine = new(
            @"^(Fuel Ore|Organics|Equipment)\s+[\d,]+\s+\d+\s+[\d,]+\s+([\d,]+)\s+[\d,]+\s+[\d,]+$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetInventoryFighters = new(
            @"^Fighters\s+N/A\s+\d+\s+[\d,]+\s+([\d,]+)\s+[\d,]+\s+[\d,]+$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxTraderLine = new(
            @"^\s*(?<label>Traders|Federals|Aliens|Ferrengi|Jem'?Hada)\s*:\s*(?<name>.+?),\s+w/\s+(?<fighters>[\d,]+)\s+ftrs",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxTraderContinuationLine = new(
            @"^\s*(?<name>.+?),\s+w/\s+(?<fighters>[\d,]+)\s+ftrs",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxShipLine = new(
            @"^\s*Ships\s+:\s+(?<name>.+?)\s+\[Owned by\]\s*(?<owner>.*?),\s+w/\s+(?<fighters>[\d,]+)\s+ftrs,",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxShipContinuationLine = new(
            @"^\s*(?<name>.+?)\s+\[Owned by\]\s*(?<owner>.*?),\s+w/\s+(?<fighters>[\d,]+)\s+ftrs,",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPortSectorPrompt = new(
            @"^What sector is the port in\?\s*(?:\[(\d+)\])?",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxStardock = new(
            @"StarDock.*sector\s+(\d+)\.",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockCredits = new(
            @"^You have ([\d,]+) credits\.$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockCurrentFighters = new(
            @"^You have ([\d,]+) fighters\.$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxCurrentShields = new(
            @"^You have ([\d,]+) shields?(?:[.,].*)?$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxInfoTurnsToWarp = new(
            @"^Turns to Warp\s*:\s*([\d,]+)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxComputerTurnsPerWarp = new(
            @"\bTurns Per Warp\s*:\s*([\d,]+)\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxTurnsDeducted = new(
            @"^(?:One|[\d,]+)\s+turns?\s+deducted,\s+([\d,]+)\s+turns?\s+left\.?$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockPurchasePrompt = new(
            @"^How many (.+?) do you want(?: to buy)?(?: .*?)?\?\s*([\d,]+)?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockScannerChoice = new(
            @"^Which would you like\?\s+\(H/D/Quit\)\s*([HDQ])?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockTranswarpChoice = new(
            @"^Which would you like\?\s+\(1/2/U/Quit\)\s*([12UQ])?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockPlanetScannerInterest = new(
            @"^I can let you have one for [\d,]+ credits, interested\?\s*(Yes|No|Y|N)?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDockAlreadyOwned = new(
            @"^You don't need two!\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetFighterTransferChoice = new(
            @"^Do you wish to \(L\)eave or \(T\)ake Fighters\?\s+\[([LT])\]\s+\(Q to Exit\)(?:\s+([LTQ]))?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetFighterTransferQuantity = new(
            @"^How many Fighters do you want to (take|leave)\s+\(([\d,]+)\s+(?:Max|on board)\)\s+\[([\d,]+)\]\s+\?\s*([\d,]+)?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetProductDirection = new(
            @"^\(L\)eave or \(T\)ake Product\?\s+\[([LT])\](?:\s+([LTQ]))?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetProductSelector = new(
            @"^Which product are you (taking|leaving)\?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetProductQuantity = new(
            @"^How many holds of (Fuel Ore|Organics|Equipment) do you want to (take|leave)\s+\(\[([\d,]+)\]\s+(empty holds|on board)\)\s+\?\s*([\d,]+)?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetProductLoaded = new(
            @"^You load the (Fuel Ore|Organics|Equipment) aboard your ship\.$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPlanetProductUnloaded = new(
            @"^You unload the (Fuel Ore|Organics|Equipment) from your ship\.$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxJettisonedCargo = new(
            @"^([\d,]+)\s+holds?\s+of\s+(Fuel Ore|Organics|Equipment|Colonists)\s+jettisoned\.$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxFigScanSector = new(
            @"^\s*(\d+)\s+(\S+)\s+(Personal|Corp(?:orate)?|Corporate)\s+(Defensive|Toll|Offensive)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxMineScanSector = new(
            @"^\s*(\d+)\s+([\d,]+)\s+(Personal|Corp(?:orate)?|Corporate)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxScanTotal = new(
            @"^\s*[\d,]+\s+Total\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxSectorDefenderPrompt = new(
            @"^How many fighters do you want defending this sector\?\s+([\d,]+)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxSectorDefenderOwnerPrompt = new(
            @"^Should these be \(C\)orporate fighters or \(P\)ersonal fighters\?\s*([CP])\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxSectorDefenderTypePrompt = new(
            @"^Should they be \(D\)efensive, \(O\)ffensive or Charge a \(T\)oll \?\s*([DOT])\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxSectorDefenderSuccess = new(
            @"^Done\.\s+You have\s+[\d,]+\s+fighter\(s\)\s+in close support\.\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxFighterHitReport = new(
            @"^Deployed Fighters Report Sector\s+(\d+)\s*:",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxLimpetHitReport = new(
            @"^Limpet mine in\s+(\d+)\s+activated",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxArmidHitReport = new(
            @"^Your mines in\s+(\d+)\s+did\s+",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDestroyedFigsSector = new(
            @"fighters in sector\s+(\d+)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxDestroyedFriendlyFigs = new(
            @"destroyed\s+([\d,]+)\s+of\s+your(?:\s+Corp's)?\s+fighters\s+in\s+sector\s+(\d+)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxLostCorpFigsSector = new(
            @"^Your Corp's fighters in sector\s+(\d+)\s+lost\s+",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxLostPersonalFigsSector = new(
            @"^Your fighters in sector\s+(\d+)\s+lost\s+",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxNoFigsSector = new(
            @"^You do not have any fighters in Sector\s+(\d+)\.?",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPgridAdd = new(
            @"^Successfully P-gridded(?: w/xport)? into sector\s+(\d+)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxPgridRemove = new(
            @"^Unsuccessful P-grid into sector\s+(\d+)\.",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxTradeExperienceReward = new(
            @"^For your (good|great|excellent) trading you receive ([\d,]+) experience point",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxTransporterShipChoice = new(
            @"^Choose which ship to beam to \(Q=Quit\)\s+(\d+)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex _rxTransporterSuccess = new(
            @"^Security code accepted, engaging transporter control\.$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // ── Public API ─────────────────────────────────────────────────────────

        /// <summary>
        /// Feed one (stripped) line of game output into the recorder.
        /// </summary>
        public void RecordLine(string line, string? ansiLine = null)
        {
            if (string.IsNullOrWhiteSpace(line)) return;

            string rawLine = NormalizeRecorderLine(line.TrimEnd('\r', '\n'));
            string trimmedLine = rawLine.Trim();

            if (ShouldIgnoreRecorderCommLine(rawLine, ansiLine))
                return;

            if (TryProcessTradeExperienceReward(rawLine))
                return;

            if (TryProcessPhotonMissileLaunch(rawLine, ansiLine))
                return;

            if (TryProcessTransporterShipChange(trimmedLine))
                return;

            // Log any line that looks warp-related so we can trace what the game sends
            if (rawLine.IndexOf("Warp", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawLine.IndexOf("Long Range", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawLine.IndexOf("Holo", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawLine.IndexOf("Sector", StringComparison.OrdinalIgnoreCase) >= 0 ||
                rawLine.IndexOf("Port", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] RAW inHolo={_inHoloScan} inWarpLane={_inWarpLane} inPortRpt={_inPortReport} lastSect={_lastSector}: '{rawLine}'\n");
            }

            var db = ScriptRef.ActiveDatabase;
            if (db == null)
            {
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] SKIPPED (db==null): '{rawLine}'\n");
                return;
            }

            if (TryProcessGenesisTorpedoState(trimmedLine))
                return;

            if (TryProcessPrompt(db, rawLine, trimmedLine, ansiLine))
                return;

            if (IsDestroyedStarPortNotice(rawLine))
            {
                MarkDestroyedPort(db, ResolveDestroyedPortSector());
                return;
            }

            if (TryProcessLiveShipStatus(trimmedLine))
                return;

            if (TryProcessDockStatus(trimmedLine))
                return;

            if (TryProcessPlanetFighterTransferStatus(trimmedLine))
                return;

            if (TryProcessPlanetProductTransferStatus(trimmedLine))
                return;

            if (TryProcessCargoJettisonStatus(trimmedLine))
                return;

            {
                var m = _rxSectorDefenderPrompt.Match(trimmedLine);
                if (m.Success)
                {
                    ParseSectorDefenderPrompt(db, m);
                    return;
                }
            }

            if (TryProcessSectorDefenseStatus(db, trimmedLine))
                return;

            if (TryProcessWatcherState(db, rawLine, trimmedLine))
                return;

            // ── Warp-lane trigger — checked on the RAW line before Trim() ────
            // Pascal: Copy(Line, 1, 19) = 'The shortest path (' or Copy(Line, 1, 7) = '  TO > '
            // Pascal never trims, so '  TO > ' carries its leading spaces.  We must check
            // before calling Trim() or the spaces are lost and the match always fails.
            if (rawLine.StartsWith("The shortest path (") || rawLine.StartsWith("  TO > "))
            {
                if (_inWarpLane && _warpLaneBuffer.Length > 0)
                    FinalizeWarpLane(db);

                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] WarpLane STARTED: '{rawLine}'\n");
                _inWarpLane = true;
                _warpLaneBuffer.Clear();
                return;
            }

            // ── Warp-lane continuation lines ──────────────────────────────────
            if (_inWarpLane)
            {
                // ': ' is the ZTM re-query prompt — it signals end of the current route.
                if (trimmedLine == ":")
                {
                    FinalizeWarpLane(db);
                    return;
                }

                if (trimmedLine.StartsWith("*** Error - No route", StringComparison.OrdinalIgnoreCase))
                {
                    ResetWarpLane();
                    return;
                }

                if (rawLine.Contains('>') &&
                    trimmedLine.Length > 0 &&
                    (char.IsDigit(trimmedLine[0]) || trimmedLine[0] == '('))
                {
                    if (_warpLaneBuffer.Length > 0)
                        _warpLaneBuffer.Append(' ');
                    _warpLaneBuffer.Append(rawLine.Trim());
                }
                return;
            }

            // ── CIM type identification (first data line) ──────────────────────
            if (_inCIM)
            {
                if (trimmedLine.Length > 2)
                {
                    _inCIM = false;
                    if (trimmedLine.EndsWith("%"))
                    {
                        _inPortCIM = true;
                        BeginPortCimBatch();
                        db.DBHeader.LastPortCIM = DateTime.Now;
                        ParsePortCIMLine(db, trimmedLine);
                    }
                    else
                    {
                        _inWarpCIM = true;
                        ParseWarpCIMLine(db, trimmedLine);
                    }
                }
                return;
            }

            // ── CIM data lines ─────────────────────────────────────────────────
            if (_inPortCIM)
            {
                ParsePortCIMLine(db, trimmedLine);
                return;
            }
            if (_inWarpCIM)
            {
                ParseWarpCIMLine(db, trimmedLine);
                return;
            }

            // ── Planet land-list (L command) ───────────────────────────────────
            // Header line triggers the mode; entries supply planet ID + name.
            if (trimmedLine.StartsWith("Registry# and Planet Name", StringComparison.OrdinalIgnoreCase))
            {
                _inLandList = true;
                _landListSector = _currentSector;
                _lastLandListPlanetId = 0;
                _landListPlanetIndex = 0;
                _pendingLandListShielded.Clear();
                var sector = GetOrCreate(db, _landListSector);
                if (sector != null)
                {
                    foreach (string planetName in sector.PlanetNames)
                        _pendingLandListShielded.Add(planetName.Contains("(Shielded)", StringComparison.OrdinalIgnoreCase));
                    sector.PlanetNames.Clear();
                }
                return;
            }
            if (_inLandList)
            {
                if (trimmedLine.StartsWith("---")) return;  // separator
                var le = _rxLandEntry.Match(rawLine);
                if (le.Success && int.TryParse(le.Groups[1].Value, out int planetId))
                {
                    _landListPlanetIndex++;
                    string pname = le.Groups[2].Value.Trim();
                    var planet = new Planet
                    {
                        Id = planetId,
                        Name = pname,
                        LastSector = _landListSector,
                        ObservedOrder = _landListPlanetIndex,
                        Shielded = _landListPlanetIndex <= _pendingLandListShielded.Count
                            ? _pendingLandListShielded[_landListPlanetIndex - 1]
                            : null
                    };

                    var details = _rxLandEntryDetail.Match(rawLine);
                    if (details.Success)
                    {
                        if (details.Groups[3].Success &&
                            int.TryParse(details.Groups[3].Value, out int level) &&
                            level > 0)
                        {
                            planet.Level = level;
                        }

                        if (details.Groups[4].Success)
                            planet.Fighters = ParseDisplayedFighterCount(details.Groups[4].Value, 0);
                    }

                    db.SaveOrAttachPlanetByOrder(planet);
                    _lastLandListPlanetId = planetId;
                    return;
                }
                // Owned-by continuation lines belong to the active land list.
                var ownedBy = _rxPlanetOwnedBy.Match(trimmedLine);
                if (ownedBy.Success)
                {
                    if (_lastLandListPlanetId > 0)
                    {
                        db.SavePlanet(new Planet
                        {
                            Id = _lastLandListPlanetId,
                            Owner = ownedBy.Groups[1].Value.Trim()
                        });
                    }
                    return;
                }

                // Any other line ends the list; fall through so the new display/prompt
                // can be parsed normally instead of being swallowed by stale list state.
                if (_landListSector > 0)
                {
                    var sector = GetOrCreate(db, _landListSector);
                    if (sector != null)
                        SyncSectorPlanetSightings(db, sector);
                }
                _inLandList = false;
                _landListSector = 0;
                _lastLandListPlanetId = 0;
                _landListPlanetIndex = 0;
                _pendingLandListShielded.Clear();
                if (string.IsNullOrWhiteSpace(trimmedLine))
                    return;

                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Land list ended by line: '{trimmedLine}'\n");
            }

            // ── Planet detail page ─────────────────────────────────────────────
            // "Planet #55 in sector 12545: ."
            {
                var pd = _rxPlanetDetail.Match(trimmedLine);
                if (pd.Success
                    && int.TryParse(pd.Groups[1].Value, out int pid)
                    && int.TryParse(pd.Groups[2].Value, out int psector))
                {
                    string pname = pd.Groups[3].Value.Trim();
                    _activePlanetDetailId = pid;
                    _landedPlanetId = pid;
                    db.SaveOrAttachPlanetByDetail(new Planet { Id = pid, Name = pname, LastSector = psector });
                    return;
                }
            }

            if (_activePlanetDetailId > 0)
            {
                var claimedBy = _rxPlanetClaimedBy.Match(trimmedLine);
                if (claimedBy.Success)
                {
                    db.SavePlanet(new Planet
                    {
                        Id = _activePlanetDetailId,
                        Owner = claimedBy.Groups[1].Value.Trim()
                    });
                    return;
                }

                var citadel = _rxPlanetCitadelLevel.Match(trimmedLine);
                if (citadel.Success)
                {
                    db.SavePlanet(new Planet
                    {
                        Id = _activePlanetDetailId,
                        Level = ParseCommaInt(citadel.Groups[1].Value)
                    });
                    return;
                }

                var product = _rxPlanetInventoryLine.Match(trimmedLine);
                if (product.Success)
                {
                    int amount = ParseCommaInt(product.Groups[2].Value);
                    var planet = new Planet { Id = _activePlanetDetailId };
                    switch (product.Groups[1].Value.Trim().ToLowerInvariant())
                    {
                        case "fuel ore":
                            planet.FuelOre = amount;
                            break;
                        case "organics":
                            planet.Organics = amount;
                            break;
                        case "equipment":
                            planet.Equipment = amount;
                            break;
                    }

                    db.SavePlanet(planet);
                    return;
                }

                var fighters = _rxPlanetInventoryFighters.Match(trimmedLine);
                if (fighters.Success)
                {
                    db.SavePlanet(new Planet
                    {
                        Id = _activePlanetDetailId,
                        Fighters = ParseCommaInt(fighters.Groups[1].Value)
                    });
                    return;
                }
            }

            // ── Mode switching ─────────────────────────────────────────────────
            if (trimmedLine.StartsWith("Relative Density Scan", StringComparison.OrdinalIgnoreCase) ||
                rawLine.StartsWith("                          Relative Density Scan", StringComparison.OrdinalIgnoreCase))
            {
                FinalizeWarpLane(db);
                _inDensityScan = true;
                _inHoloScan = false;
                _densityFromSector = _currentSector;
                _densityScanSectors.Clear();
                return;
            }

            if (trimmedLine.StartsWith("Long Range Scan", StringComparison.OrdinalIgnoreCase))
            {
                // We are NOW inside a holo scan.  Set the flag immediately so that
                // the "Sector  : NNNN" lines in the scan body do NOT update
                // _currentSector (those sectors are neighbors, NOT the player's
                // current position).
                FinalizeWarpLane(db);
                _inHoloScan = true;
                _inDensityScan = false;
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] HoloScan started, currentSector={_currentSector}\n");
                return;
            }

            if (trimmedLine.StartsWith("Select (H)olo Scan", StringComparison.OrdinalIgnoreCase))
                return;

            // Separator / decoration lines
            if (trimmedLine.StartsWith("---") || trimmedLine.StartsWith("==="))
                return;

            // ── Density scan lines ────────────────────────────────────────────
            if (_inDensityScan)
            {
                var m = _rxDensityLine.Match(trimmedLine);
                if (m.Success)
                {
                    int sn = ParseDensityLine(db, m);
                    if (sn > 0)
                        _densityScanSectors.Add(sn);
                }
                return;
            }

            // ── Sector display header ─────────────────────────────────────────
            {
                var m = _rxSector.Match(rawLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sn))
                {
                    if (_activeSectorDisplaySector > 0 && _activeSectorDisplaySector != sn)
                        FinalizeActiveSectorDisplay(db);

                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] lastSector {_lastSector}→{sn} inHolo={_inHoloScan} inWarpLane={_inWarpLane} inPortRpt={_inPortReport}\n");
                    // A sector display definitively ends any warp-lane sequence.
                    // For 1-hop FM transwarp paths the ':' re-query prompt never arrives,
                    // so _inWarpLane must be cleared here or subsequent sector data gets consumed.
                    if (_inWarpLane)
                    {
                        GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] WarpLane cleared by Sector display\n");
                        FinalizeWarpLane(db);
                    }
                    _lastSector = sn;
                    _sectorPos = SectorPos.None;

                    // Clear volatile sector data to be re-populated from following lines.
                    var sec = GetOrCreate(db, sn);
                    if (sec != null)
                    {
                        _activeSectorDisplaySector = sn;
                        _activeSectorDisplaySawPort = false;
                        _activeSectorDisplayHadCachedPort = sec.SectorPort != null && !string.IsNullOrEmpty(sec.SectorPort.Name);
                        sec.Fighters = new SpaceObject();
                        sec.MinesArmid = new SpaceObject();
                        sec.MinesLimpet = new SpaceObject();
                        sec.Beacon = string.Empty;
                        sec.PlanetNames.Clear();
                        sec.Ships.Clear();
                        sec.Traders.Clear();
                        _currentTrader.DisplayLabel = "Traders";
                        _currentTrader.Name = string.Empty;
                        _currentTrader.ShipName = string.Empty;
                        _currentTrader.ShipType = string.Empty;
                        _currentTrader.Fighters = 0;
                        _currentShip.Name = string.Empty;
                        _currentShip.Owner = string.Empty;
                        _currentShip.ShipType = string.Empty;
                        _currentShip.Fighters = 0;
                        // Keep cached port commerce data through the live sector display.
                        // If no Ports line arrives by the time the display completes, we
                        // discard the cached port then. This preserves fresh commerce-report
                        // detail when a subsequent sector display only redraws the short
                        // "Ports   :" header.
                        if (_activeSectorDisplayHadCachedPort)
                            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Preserving cached port for sector {sn} pending live sector display\n");
                    }

                    // Match Pascal extractor behavior: each "Sector  : NNNN" line advances
                    // the extractor's current sector, including intermediate holo sectors.
                    // Scripts such as DisR and Moveship rely on CURRENTSECTOR changing before
                    // the prompt returns.
                    _currentSector = sn;
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Current sector set to {sn} from sector display\n");

                    // While sitting on a planet, planetary transwarp redraws the
                    // destination sector before another detail page. Keep the
                    // registry-keyed planet location current instead of allowing the
                    // anonymous sector display row to become a new provisional planet.
                    if (!_inHoloScan && _landedPlanetId > 0)
                    {
                        db.SavePlanet(new Planet { Id = _landedPlanetId, LastSector = sn });
                        GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Planet {_landedPlanetId} moved to sector {sn} from live sector display\n");
                    }

                    // Always capture constellation name when present (works for both
                    // normal sector display AND holo scan: "Sector  : 9363  in  The Crucible")
                    if (m.Groups[2].Success)
                    {
                        string constName = m.Groups[2].Value.Trim();
                        if (!string.IsNullOrEmpty(constName))
                        {
                            var constellationSector = GetOrCreate(db, sn);
                            if (constellationSector != null)
                            {
                                constellationSector.Constellation = constName;
                                db.SaveSector(constellationSector);
                                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sn} constellation = {constName}\n");
                            }
                        }
                    }

                    _inHoloScan = true;   // Any "Sector  : NNNN" marks start of a display block
                    return;
                }
            }

            if (_inNavPointDisplay)
            {
                var m = _rxNavPointSector.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sn))
                {
                    _lastSector = sn;
                    _sectorPos = SectorPos.None;

                    if (m.Groups[2].Success)
                    {
                        string constName = m.Groups[2].Value.Trim();
                        if (!string.IsNullOrEmpty(constName))
                        {
                            var navSector = GetOrCreate(db, sn);
                            if (navSector != null)
                            {
                                navSector.Constellation = constName;
                                db.SaveSector(navSector);
                                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] NavPoint sector {sn} constellation = {constName}\n");
                            }
                        }
                    }

                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] NavPoint preview sector -> {sn}\n");
                    return;
                }
            }

            {
                var stardock = _rxStardock.Match(trimmedLine);
                if (stardock.Success && int.TryParse(stardock.Groups[1].Value, out int dockSector))
                {
                    if (dockSector > 0 && dockSector <= db.SectorCount)
                    {
                        ushort previousDock = db.DBHeader.StarDock;
                        bool changed = previousDock != (ushort)dockSector;
                        LogLandmarkCorrection("Stardock", previousDock, dockSector, "AutoRecorder.StarDockPrompt");
                        db.DBHeader.StarDock = (ushort)dockSector;

                        var dock = GetOrCreate(db, dockSector);
                        if (dock != null)
                        {
                            dock.Constellation = "The Federation";
                            dock.Beacon = "FedSpace, FedLaw Enforced";
                            dock.SectorPort ??= new Port();
                            dock.SectorPort.Dead = false;
                            dock.SectorPort.BuildTime = 0;
                            dock.SectorPort.Name = "Stargate Alpha I";
                            dock.SectorPort.ClassIndex = 9;
                            dock.Explored = ExploreType.Calc;
                            dock.Update = DateTime.Now;
                            db.SaveSector(dock);
                        }

                        ScriptRef.SetCurrentGameVar("$STARDOCK", dockSector.ToString());
                        ScriptRef.OnVariableSaved?.Invoke("$STARDOCK", dockSector.ToString());
                        LandmarkSectorsChanged?.Invoke();
                        if (changed && previousDock != 0 && previousDock != 65535)
                        {
                            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Stardock corrected from sector {previousDock} to {dockSector}\n");
                        }
                        else
                        {
                            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Stardock discovered in sector {dockSector}\n");
                        }
                    }
                    return;
                }
            }

            {
                var m = _rxCommerceReport.Match(trimmedLine);
                if (m.Success)
                {
                    _inPortReport = true;
                    _portReportSector = _pendingPortReportSectorOverride > 0 ? _pendingPortReportSectorOverride : _currentSector;
                    _portReportHasFuel = false;
                    _portReportHasOrg = false;
                    _pendingPortReportSectorOverride = 0;
                    // Set port name now; product lines will fill BuyProduct/Amount/Percent
                    var sec = GetOrCreate(db, _portReportSector);
                    if (sec != null)
                    {
                        _portReportOriginalSnapshot = GlobalModules.DatabaseCorrectionLoggingEnabled
                            ? CapturePortStaticSnapshot(sec.SectorPort)
                            : null;
                        sec.SectorPort ??= new Port();
                        string reportName = m.Groups[1].Value.Trim();
                        if (!string.IsNullOrEmpty(reportName))
                            sec.SectorPort.Name = reportName;
                        db.SaveSector(sec);
                    }
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Commerce report for sector {_portReportSector}\n");
                    return;
                }
            }
            if (_inPortReport)
            {
                var pm = _rxProductLine.Match(trimmedLine);
                if (pm.Success)
                {
                    ParseProductLine(db, pm);
                    return;
                }
                // Skip other lines inside the report (date/time etc.) and fall through
                return;
            }

            if (trimmedLine.StartsWith("Deployed  Mine  Scan", StringComparison.OrdinalIgnoreCase))
            {
                BeginMineScan(db, MineScanKind.Armid);
                return;
            }

            if (trimmedLine.StartsWith("Deployed  Limpet  Scan", StringComparison.OrdinalIgnoreCase))
            {
                BeginMineScan(db, MineScanKind.Limpet);
                return;
            }

            if (trimmedLine.StartsWith("Activated  Limpet  Scan", StringComparison.OrdinalIgnoreCase))
            {
                if (_inMineScanKind != MineScanKind.None)
                    CompleteMineScan(db, "activated limpet scan");
                _inMineScanKind = MineScanKind.None;
                _currentMineScanSectors.Clear();
                return;
            }

            if (_inMineScanKind != MineScanKind.None)
            {
                ProcessMineScanLine(db, trimmedLine);
                return;
            }

            if (trimmedLine.StartsWith("Deployed  Fighter  Scan", StringComparison.OrdinalIgnoreCase))
            {
                _inFigScan = true;
                _currentFigScanSectors.Clear();
                return;
            }

            if (_inFigScan)
            {
                ProcessFigScanLine(db, trimmedLine);
                return;
            }

            // ── Data lines that belong to _lastSector ─────────────────────────
            if (_lastSector <= 0)
            {
                if (trimmedLine.IndexOf("Warps to Sector", StringComparison.OrdinalIgnoreCase) >= 0)
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] DROPPED warp line (_lastSector=0): '{trimmedLine}'\n");
                return;
            }

            // Warps
            {
                var m = _rxWarps.Match(rawLine);
                if (m.Success)
                {
                    ParseWarpsLine(db, _lastSector, m.Groups[1].Value);
                    return;
                }
                // Log if line looks like it should match but didn't
                if (trimmedLine.IndexOf("Warps to Sector", StringComparison.OrdinalIgnoreCase) >= 0)
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] WARN: warp line not matched by regex for sect={_lastSector}: '{trimmedLine}'\n");
            }

            // Port
            {
                if (IsDestroyedPortDisplayLine(rawLine))
                {
                    MarkDestroyedPort(db, _lastSector);
                    _sectorPos = SectorPos.Ports;
                    return;
                }

                var m = _rxPort.Match(rawLine);
                if (m.Success)
                {
                    ParsePortLine(db, _lastSector, rawLine, m);
                    _sectorPos = SectorPos.Ports;
                    return;
                }
                // Warn if a line looks like a port line but the regex didn't match
                if (trimmedLine.StartsWith("Port", StringComparison.OrdinalIgnoreCase))
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] WARN: port-like line not matched for sector {_lastSector}: '{trimmedLine}'\n");
            }

            // NavHaz  :  15%
            {
                var m = _rxNavHaz.Match(trimmedLine);
                if (m.Success)
                {
                    var sector = GetOrCreate(db, _lastSector);
                    if (sector != null)
                    {
                        if (byte.TryParse(m.Groups[1].Value, out byte nh))
                            sector.NavHaz = nh;
                        db.SaveSector(sector);
                    }
                    _sectorPos = SectorPos.None;
                    return;
                }
            }

            // Beacon (federation space etc.)
            {
                var m = _rxBeacon.Match(rawLine);
                if (m.Success)
                {
                    var sector = GetOrCreate(db, _lastSector);
                    if (sector != null)
                    {
                        sector.Beacon = m.Groups[1].Value.Trim();
                        db.SaveSector(sector);
                    }
                    _sectorPos = SectorPos.None;
                    return;
                }
            }

            // Fighters
            {
                var m = _rxFighters.Match(trimmedLine);
                if (m.Success)
                {
                    ParseFightersLine(db, _lastSector, m);
                    _sectorPos = SectorPos.None;
                    return;
                }
            }

            // Mines (first line)
            {
                var m = _rxMines.Match(trimmedLine);
                if (m.Success)
                {
                    ParseMinesLine(db, _lastSector, m);
                    _sectorPos = SectorPos.Mines;
                    return;
                }
            }

            // Mines continuation line: "        : 3 (Type 2 Limpet) ..."
            if (_sectorPos == SectorPos.Mines)
            {
                var m = _rxMinesCont.Match(rawLine);
                if (m.Success)
                {
                    ParseMinesLine(db, _lastSector, m);
                    return;
                }
            }

            // Planets (first line): replace the sector's last visible planet list
            // with the newest sighting. This keeps repeated previews from appending
            // stale entries forever while still preserving legitimate duplicate names
            // when the current display itself shows multiple planets with the same
            // visible name.
            {
                var m = _rxPlanets.Match(trimmedLine);
                if (m.Success)
                {
                    var sector = GetOrCreate(db, _lastSector);
                    if (sector != null)
                    {
                        sector.PlanetNames.Clear();
                        string name = m.Groups[1].Value.Trim();
                        if (!string.IsNullOrEmpty(name))
                            sector.PlanetNames.Add(name);
                        db.SaveSector(sector);
                    }
                    _sectorPos = SectorPos.Planets;
                    return;
                }
            }

            // Planet continuation lines (indented <<<< ... >>>>
            if (_sectorPos == SectorPos.Planets)
            {
                var m = _rxPlanetCont.Match(rawLine);
                if (m.Success)
                {
                    var sector = GetOrCreate(db, _lastSector);
                    if (sector != null)
                    {
                        sector.PlanetNames.Add(m.Groups[1].Value.Trim());
                        db.SaveSector(sector);
                    }
                    return;
                }
                // Any non-planet-looking line ends the planets block. Reconcile now
                // so UI/database readers do not see raw display-only rows while the
                // rest of the sector display continues parsing.
                var planetSector = GetOrCreate(db, _lastSector);
                if (planetSector != null)
                    SyncSectorPlanetSightings(db, planetSector);
                _sectorPos = SectorPos.None;
            }

            {
                var m = _rxTraderLine.Match(trimmedLine);
                if (m.Success)
                {
                    ParseTraderSummary(m);
                    _sectorPos = SectorPos.Traders;
                    return;
                }
            }

            if (_sectorPos == SectorPos.Traders && rawLine.StartsWith("        ", StringComparison.Ordinal))
            {
                ParseTraderContinuation(db, _lastSector, rawLine);
                return;
            }

            {
                var m = _rxShipLine.Match(trimmedLine);
                if (m.Success)
                {
                    ParseShipSummary(m);
                    _sectorPos = SectorPos.Ships;
                    return;
                }
            }

            if (_sectorPos == SectorPos.Ships && rawLine.StartsWith("        ", StringComparison.Ordinal))
            {
                ParseShipContinuation(db, _lastSector, rawLine);
                return;
            }

            if (_sectorPos == SectorPos.Ports && rawLine.StartsWith("        ", StringComparison.Ordinal))
            {
                ParsePortContinuation(db, _lastSector, rawLine);
                return;
            }
        }

        public void ProcessPrompt(string line, string? ansiLine = null)
        {
            if (string.IsNullOrWhiteSpace(line))
                return;

            string rawLine = NormalizeRecorderLine(line.TrimEnd('\r', '\n'));
            if (ShouldIgnoreRecorderCommLine(rawLine, ansiLine))
                return;

            string trimmedLine = rawLine.Trim();
            TryProcessPrompt(ScriptRef.ActiveDatabase, rawLine, trimmedLine, ansiLine);
        }

        // ── Private helpers ────────────────────────────────────────────────────

        private bool TryProcessPrompt(ModDatabase? db, string rawLine, string trimmedLine, string? ansiLine = null)
        {
            if (string.IsNullOrEmpty(trimmedLine))
                return false;

            if (_inWarpLane &&
                (trimmedLine.StartsWith("Command [TL=", StringComparison.Ordinal) ||
                 trimmedLine.StartsWith("Computer command [TL=", StringComparison.Ordinal)))
            {
                GlobalModules.AutoRecorderDebugLog("[AutoRecorder] WarpLane cleared by prompt\n");
                FinalizeWarpLane(db);
            }

            if (trimmedLine.StartsWith("Command [TL=", StringComparison.Ordinal))
            {
                FinalizeActiveSectorDisplay(db);
                ResetPromptDisplays(db, preservePortReport: _inPortReport || _pendingPortReportSectorOverride > 0);
                _landedPlanetId = 0;

                var mc = _rxCommandSector.Match(trimmedLine);
                if (mc.Success && int.TryParse(mc.Groups[1].Value, out int csn))
                {
                    _currentSector = csn;
                    _lastSector = csn;
                    CurrentSectorChanged?.Invoke(csn);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Current sector set to {csn} from prompt\n");
                }
                _dockArea = DockArea.None;
                return true;
            }

            if (trimmedLine.StartsWith("Computer command [TL=", StringComparison.Ordinal))
            {
                FinalizeActiveSectorDisplay(db);
                ResetPromptDisplays(db, preservePortReport: _inPortReport || _pendingPortReportSectorOverride > 0);

                var mc = _rxComputerSector.Match(trimmedLine);
                if (mc.Success && int.TryParse(mc.Groups[1].Value, out int csn))
                {
                    _currentSector = csn;
                    _lastSector = csn;
                    CurrentSectorChanged?.Invoke(csn);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Current sector set to {csn} from computer prompt\n");
                }
                _dockArea = DockArea.None;
                return true;
            }

            bool probeConsumed = TryProcessEtherProbeConsumed(trimmedLine, ansiLine);

            if (trimmedLine.StartsWith("Citadel treasury contains", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("Stop in this sector", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("Engage the Autopilot?", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("Probe entering sector :", StringComparison.OrdinalIgnoreCase) ||
                probeConsumed)
            {
                FinalizeActiveSectorDisplay(db);
                ResetPromptDisplays(db);
                _dockArea = DockArea.None;
                return true;
            }

            if (trimmedLine.StartsWith("<Set Course to NavPoint>", StringComparison.OrdinalIgnoreCase))
            {
                ResetPromptDisplays(db);
                _inNavPointDisplay = true;
                _sectorPos = SectorPos.None;
                GlobalModules.AutoRecorderDebugLog("[AutoRecorder] Entered NavPoint preview\n");
                _dockArea = DockArea.None;
                return true;
            }

            if (trimmedLine.StartsWith("Choose NavPoint", StringComparison.OrdinalIgnoreCase))
            {
                _inNavPointDisplay = false;
                _sectorPos = SectorPos.None;
                GlobalModules.AutoRecorderDebugLog("[AutoRecorder] Exited NavPoint preview\n");
                return true;
            }

            if (TryProcessDockPrompt(trimmedLine))
                return true;

            if (TryProcessDockStatus(trimmedLine))
                return true;

            if (trimmedLine == ":")
            {
                if (_inWarpLane)
                    FinalizeWarpLane(db);

                _inCIM = true;
                _inPortCIM = false;
                _inWarpCIM = false;
                return true;
            }

            var m = _rxPortSectorPrompt.Match(trimmedLine);
            if (m.Success)
            {
                int promptSector = _currentSector;
                int bracket = trimmedLine.IndexOf(']');
                if (bracket >= 0 && bracket + 1 < trimmedLine.Length)
                {
                    string tail = trimmedLine[(bracket + 1)..].Trim();
                    if (int.TryParse(tail, out int typedSector) && typedSector > 0)
                        promptSector = typedSector;
                    else if (m.Groups[1].Success && int.TryParse(m.Groups[1].Value, out int bracketSector))
                        promptSector = bracketSector;
                }
                else if (m.Groups[1].Success && int.TryParse(m.Groups[1].Value, out int bracketSector))
                {
                    promptSector = bracketSector;
                }

                _pendingPortReportSectorOverride = promptSector;
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Port report sector prompt -> {_pendingPortReportSectorOverride}\n");
                return true;
            }

            return false;
        }

        private bool TryProcessEtherProbeConsumed(string trimmedLine, string? ansiLine)
        {
            if (!IsEtherProbeConsumedLine(trimmedLine))
            {
                string normalizedAnsiLine = string.IsNullOrWhiteSpace(ansiLine)
                    ? string.Empty
                    : NormalizeRecorderLine(ansiLine.TrimEnd('\r', '\n')).Trim();
                if (!IsEtherProbeConsumedLine(normalizedAnsiLine))
                    return false;
            }

            EmitShipStatusDelta(new ShipStatusDelta
            {
                EtherProbesDelta = -1
            });
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Ether probe consumed: '{trimmedLine}'\n");
            return true;
        }

        private static bool IsEtherProbeConsumedLine(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return false;

            return line.StartsWith("Probe Destroyed!", StringComparison.OrdinalIgnoreCase) ||
                   line.StartsWith("Probe Self Destructs", StringComparison.OrdinalIgnoreCase);
        }

        private bool TryProcessDockPrompt(string trimmedLine)
        {
            if (trimmedLine.StartsWith("<StarDock> Where to?", StringComparison.OrdinalIgnoreCase))
            {
                _dockArea = DockArea.StarDock;
                return true;
            }

            if (trimmedLine.StartsWith("<Hardware Emporium>", StringComparison.OrdinalIgnoreCase))
            {
                _dockArea = DockArea.HardwareEmporium;
                return true;
            }

            if (trimmedLine.StartsWith("<Shipyards>", StringComparison.OrdinalIgnoreCase))
            {
                _dockArea = DockArea.Shipyards;
                return true;
            }

            if (trimmedLine.StartsWith("Which item do you wish to buy?", StringComparison.OrdinalIgnoreCase))
            {
                _dockArea = DockArea.ShipyardCommerce;
                return true;
            }

            if (trimmedLine.StartsWith("Landing on Federation StarDock.", StringComparison.OrdinalIgnoreCase))
            {
                _dockArea = DockArea.StarDock;
                ResetPendingDockPurchase();
                return true;
            }

            if (trimmedLine.StartsWith("You return to your ship and blast off from the StarDock.", StringComparison.OrdinalIgnoreCase))
            {
                _dockArea = DockArea.None;
                ResetPendingDockPurchase();
                return true;
            }

            var scannerChoice = _rxDockScannerChoice.Match(trimmedLine);
            if (scannerChoice.Success)
            {
                char choice = scannerChoice.Groups[1].Success && scannerChoice.Groups[1].Value.Length > 0
                    ? char.ToUpperInvariant(scannerChoice.Groups[1].Value[0])
                    : '\0';
                _pendingDockPurchaseKind = choice switch
                {
                    'H' => PendingDockPurchaseKind.HoloScanner,
                    'D' => PendingDockPurchaseKind.DensityScanner,
                    _ => PendingDockPurchaseKind.None,
                };
                _pendingDockPurchaseItemName = string.Empty;
                _pendingDockPurchaseQuantity = 0;
                return true;
            }

            var transwarpChoice = _rxDockTranswarpChoice.Match(trimmedLine);
            if (transwarpChoice.Success)
            {
                char choice = transwarpChoice.Groups[1].Success && transwarpChoice.Groups[1].Value.Length > 0
                    ? char.ToUpperInvariant(transwarpChoice.Groups[1].Value[0])
                    : '\0';
                _pendingDockPurchaseKind = choice switch
                {
                    '1' => PendingDockPurchaseKind.TransWarp1,
                    '2' => PendingDockPurchaseKind.TransWarp2,
                    _ => PendingDockPurchaseKind.None,
                };
                _pendingDockPurchaseItemName = string.Empty;
                _pendingDockPurchaseQuantity = 0;
                return true;
            }

            var planetScannerInterest = _rxDockPlanetScannerInterest.Match(trimmedLine);
            if (planetScannerInterest.Success)
            {
                string response = planetScannerInterest.Groups[1].Success
                    ? planetScannerInterest.Groups[1].Value.Trim()
                    : string.Empty;
                _pendingDockPurchaseKind = IsBoolYes(response)
                    ? PendingDockPurchaseKind.PlanetScanner
                    : PendingDockPurchaseKind.None;
                _pendingDockPurchaseItemName = string.Empty;
                _pendingDockPurchaseQuantity = 0;
                return true;
            }

            return false;
        }

        private bool TryProcessDockStatus(string trimmedLine)
        {
            if (_dockArea == DockArea.None)
                return false;

            var credits = _rxDockCredits.Match(trimmedLine);
            if (credits.Success)
            {
                ShipStatusDelta? purchaseDelta = BuildPendingDockPurchaseConfirmationDelta();
                if (purchaseDelta != null)
                    EmitShipStatusDelta(purchaseDelta);

                EmitShipStatusDelta(new ShipStatusDelta
                {
                    Credits = ParseCommaLong(credits.Groups[1].Value)
                });
                ResetPendingDockPurchase();
                return true;
            }

            if (_dockArea == DockArea.ShipyardCommerce)
            {
                var fighters = _rxDockCurrentFighters.Match(trimmedLine);
                if (fighters.Success)
                {
                    EmitShipStatusDelta(new ShipStatusDelta
                    {
                        Fighters = ParseCommaInt(fighters.Groups[1].Value)
                    });
                    return true;
                }

            }

            if (trimmedLine.StartsWith("Ok!  We'll get that sent over to your ship, installation is free!", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("Ok!  We'll get that installed in your ship right away!", StringComparison.OrdinalIgnoreCase))
            {
                ShipStatusDelta? purchaseDelta = BuildPendingDockPurchaseConfirmationDelta();
                if (purchaseDelta != null)
                {
                    EmitShipStatusDelta(purchaseDelta);
                    if (_pendingDockPurchaseKind != PendingDockPurchaseKind.Quantity)
                        ResetPendingDockPurchase();
                }
                return true;
            }

            if (_rxDockAlreadyOwned.IsMatch(trimmedLine))
            {
                ShipStatusDelta? purchaseDelta = BuildPendingDockPurchaseConfirmationDelta();
                if (purchaseDelta != null)
                    EmitShipStatusDelta(purchaseDelta);
                ResetPendingDockPurchase();
                return true;
            }

            var purchase = _rxDockPurchasePrompt.Match(trimmedLine);
            if (!purchase.Success)
                return false;

            int quantity = ParseCommaInt(purchase.Groups[2].Value);
            if (quantity <= 0)
            {
                ResetPendingDockPurchase();
                return true;
            }

            _pendingDockPurchaseKind = PendingDockPurchaseKind.Quantity;
            _pendingDockPurchaseItemName = purchase.Groups[1].Value;
            _pendingDockPurchaseQuantity = quantity;
            return true;
        }

        private bool TryProcessPlanetFighterTransferStatus(string trimmedLine)
        {
            var choice = _rxPlanetFighterTransferChoice.Match(trimmedLine);
            if (choice.Success)
            {
                char action = choice.Groups[2].Success && choice.Groups[2].Value.Length > 0
                    ? char.ToUpperInvariant(choice.Groups[2].Value[0])
                    : char.ToUpperInvariant(choice.Groups[1].Value[0]);

                _pendingPlanetFighterTransferKind = action switch
                {
                    'T' => PendingPlanetFighterTransferKind.Take,
                    'L' => PendingPlanetFighterTransferKind.Leave,
                    _ => PendingPlanetFighterTransferKind.None,
                };
                _pendingPlanetFighterTransferQuantity = 0;
                return true;
            }

            var quantity = _rxPlanetFighterTransferQuantity.Match(trimmedLine);
            if (quantity.Success)
            {
                bool isTake = quantity.Groups[1].Value.Equals("take", StringComparison.OrdinalIgnoreCase);
                int explicitQuantity = quantity.Groups[4].Success ? ParseCommaInt(quantity.Groups[4].Value) : 0;
                int defaultQuantity = ParseCommaInt(quantity.Groups[3].Value);
                int selectedQuantity = quantity.Groups[4].Success ? explicitQuantity : defaultQuantity;

                _pendingPlanetFighterTransferKind = isTake
                    ? PendingPlanetFighterTransferKind.Take
                    : PendingPlanetFighterTransferKind.Leave;
                _pendingPlanetFighterTransferQuantity = Math.Max(0, selectedQuantity);

                if (_pendingPlanetFighterTransferQuantity <= 0)
                    ResetPendingPlanetFighterTransfer();
                return true;
            }

            if (trimmedLine.StartsWith("The Fighters join your battle force.", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("The Fighters join your battle force", StringComparison.OrdinalIgnoreCase))
            {
                if (_pendingPlanetFighterTransferKind == PendingPlanetFighterTransferKind.Take &&
                    _pendingPlanetFighterTransferQuantity > 0)
                {
                    EmitShipStatusDelta(new ShipStatusDelta
                    {
                        FightersDelta = _pendingPlanetFighterTransferQuantity
                    });
                }

                ResetPendingPlanetFighterTransfer();
                return true;
            }

            if (trimmedLine.Equals("Done!", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.Equals("Done.", StringComparison.OrdinalIgnoreCase))
            {
                if (_pendingPlanetFighterTransferKind == PendingPlanetFighterTransferKind.Leave &&
                    _pendingPlanetFighterTransferQuantity > 0)
                {
                    EmitShipStatusDelta(new ShipStatusDelta
                    {
                        FightersDelta = -_pendingPlanetFighterTransferQuantity
                    });
                }

                ResetPendingPlanetFighterTransfer();
                return true;
            }

            if (trimmedLine.StartsWith("Planet command (?=help)", StringComparison.OrdinalIgnoreCase))
            {
                ResetPendingPlanetFighterTransfer();
                return false;
            }

            return false;
        }

        private bool TryProcessLiveShipStatus(string trimmedLine)
        {
            if (ShipStatusTextParser.TryParseLiveCreditsLine(trimmedLine, out long credits, out int? emptyHolds))
            {
                var delta = new ShipStatusDelta
                {
                    Credits = credits
                };

                if (emptyHolds.HasValue)
                    delta.HoldsEmpty = emptyHolds.Value;

                EmitShipStatusDelta(delta);
                return true;
            }

            var shields = _rxCurrentShields.Match(trimmedLine);
            if (shields.Success)
            {
                EmitShipStatusDelta(new ShipStatusDelta
                {
                    Shields = ParseCommaInt(shields.Groups[1].Value)
                });
                return true;
            }

            var turnsToWarp = _rxInfoTurnsToWarp.Match(trimmedLine);
            if (turnsToWarp.Success)
            {
                EmitShipStatusDelta(new ShipStatusDelta
                {
                    TurnsPerWarp = ParseCommaInt(turnsToWarp.Groups[1].Value)
                });
                return true;
            }

            var turnsPerWarp = _rxComputerTurnsPerWarp.Match(trimmedLine);
            if (turnsPerWarp.Success)
            {
                EmitShipStatusDelta(new ShipStatusDelta
                {
                    TurnsPerWarp = ParseCommaInt(turnsPerWarp.Groups[1].Value)
                });
                return true;
            }

            var turnsDeducted = _rxTurnsDeducted.Match(trimmedLine);
            if (turnsDeducted.Success)
            {
                EmitShipStatusDelta(new ShipStatusDelta
                {
                    Turns = ParseCommaInt(turnsDeducted.Groups[1].Value)
                });
                return true;
            }

            return false;
        }

        private bool TryProcessPlanetProductTransferStatus(string trimmedLine)
        {
            var direction = _rxPlanetProductDirection.Match(trimmedLine);
            if (direction.Success)
            {
                char action = direction.Groups[2].Success && direction.Groups[2].Value.Length > 0
                    ? char.ToUpperInvariant(direction.Groups[2].Value[0])
                    : char.ToUpperInvariant(direction.Groups[1].Value[0]);

                _pendingPlanetProductTransferKind = action switch
                {
                    'T' => PlanetProductTransferKind.Take,
                    'L' => PlanetProductTransferKind.Leave,
                    _ => PlanetProductTransferKind.None,
                };
                _pendingPlanetProductName = string.Empty;
                _pendingPlanetProductQuantity = 0;
                return true;
            }

            var selector = _rxPlanetProductSelector.Match(trimmedLine);
            if (selector.Success)
                return true;

            var quantity = _rxPlanetProductQuantity.Match(trimmedLine);
            if (quantity.Success)
            {
                string productName = quantity.Groups[1].Value.Trim();
                bool isTake = quantity.Groups[2].Value.Equals("take", StringComparison.OrdinalIgnoreCase);
                int defaultQuantity = ParseCommaInt(quantity.Groups[3].Value);
                int explicitQuantity = quantity.Groups[5].Success ? ParseCommaInt(quantity.Groups[5].Value) : 0;
                int selectedQuantity = quantity.Groups[5].Success ? explicitQuantity : defaultQuantity;

                _pendingPlanetProductTransferKind = isTake
                    ? PlanetProductTransferKind.Take
                    : PlanetProductTransferKind.Leave;
                _pendingPlanetProductName = productName;
                _pendingPlanetProductQuantity = Math.Max(0, selectedQuantity);

                if (_pendingPlanetProductQuantity <= 0)
                    ResetPendingPlanetProductTransfer();
                return true;
            }

            var loaded = _rxPlanetProductLoaded.Match(trimmedLine);
            if (loaded.Success)
            {
                EmitPendingPlanetProductDelta(
                    PlanetProductTransferKind.Take,
                    loaded.Groups[1].Value.Trim());
                ResetPendingPlanetProductTransfer();
                return true;
            }

            var unloaded = _rxPlanetProductUnloaded.Match(trimmedLine);
            if (unloaded.Success)
            {
                EmitPendingPlanetProductDelta(
                    PlanetProductTransferKind.Leave,
                    unloaded.Groups[1].Value.Trim());
                ResetPendingPlanetProductTransfer();
                return true;
            }

            if (trimmedLine.StartsWith("Planet command (?=help)", StringComparison.OrdinalIgnoreCase))
            {
                ResetPendingPlanetProductTransfer();
                return false;
            }

            return false;
        }

        private void EmitShipStatusDelta(ShipStatusDelta delta)
        {
            if (delta == null || !delta.HasChanges())
                return;

            ShipStatusDeltaDetected?.Invoke(delta);
        }

        private bool TryProcessTradeExperienceReward(string rawLine)
        {
            var reward = _rxTradeExperienceReward.Match(rawLine);
            if (!reward.Success)
                return false;

            long amount = ParseCommaLong(reward.Groups[2].Value);
            if (amount <= 0)
                return false;

            EmitShipStatusDelta(new ShipStatusDelta { ExperienceDelta = amount });
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Trade experience reward tier={reward.Groups[1].Value} delta={amount}\n");
            return true;
        }

        private bool TryProcessPhotonMissileLaunch(string rawLine, string? ansiLine)
        {
            if (!IsPhotonMissileLaunchLine(rawLine))
            {
                string normalizedAnsiLine = string.IsNullOrWhiteSpace(ansiLine)
                    ? string.Empty
                    : NormalizeRecorderLine(ansiLine.TrimEnd('\r', '\n'));
                if (!IsPhotonMissileLaunchLine(normalizedAnsiLine))
                    return false;
            }

            EmitShipStatusDelta(new ShipStatusDelta
            {
                PhotonsDelta = -1
            });
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Photon missile launched, photons delta=-1: '{rawLine}'\n");
            return true;
        }

        private static bool IsPhotonMissileLaunchLine(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return false;

            return line.StartsWith("Photon Missile launched into sector", StringComparison.OrdinalIgnoreCase);
        }

        private bool TryProcessTransporterShipChange(string trimmedLine)
        {
            var choice = _rxTransporterShipChoice.Match(trimmedLine);
            if (choice.Success)
            {
                _pendingTransporterShipNumber = ParseCommaInt(choice.Groups[1].Value);
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Transporter pending ship={_pendingTransporterShipNumber}\n");
                return true;
            }

            if (_pendingTransporterShipNumber <= 0)
                return false;

            if (_rxTransporterSuccess.IsMatch(trimmedLine))
            {
                int shipNumber = _pendingTransporterShipNumber;
                _pendingTransporterShipNumber = 0;
                EmitShipStatusDelta(new ShipStatusDelta { ShipNumber = shipNumber });
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Transporter ship changed ship={shipNumber}\n");
                return true;
            }

            _pendingTransporterShipNumber = 0;
            return false;
        }

        private void EmitPendingPlanetProductDelta(PlanetProductTransferKind confirmationKind, string confirmationProductName)
        {
            if (_pendingPlanetProductTransferKind == PlanetProductTransferKind.None ||
                _pendingPlanetProductQuantity <= 0 ||
                string.IsNullOrWhiteSpace(_pendingPlanetProductName))
            {
                return;
            }

            if (_pendingPlanetProductTransferKind != confirmationKind)
                return;

            if (!string.Equals(_pendingPlanetProductName, confirmationProductName, StringComparison.OrdinalIgnoreCase))
                return;

            int direction = confirmationKind == PlanetProductTransferKind.Take ? 1 : -1;
            int quantity = _pendingPlanetProductQuantity * direction;

            ShipStatusDelta? delta = BuildCargoDelta(confirmationProductName, quantity, -quantity);
            if (delta == null)
                return;

            EmitShipStatusDelta(delta);
        }

        private bool TryProcessCargoJettisonStatus(string trimmedLine)
        {
            var match = _rxJettisonedCargo.Match(trimmedLine);
            if (!match.Success)
                return false;

            int quantity = ParseCommaInt(match.Groups[1].Value);
            if (quantity <= 0)
                return true;

            ShipStatusDelta? delta = BuildCargoDelta(
                match.Groups[2].Value.Trim(),
                -quantity,
                quantity);
            if (delta != null)
                EmitShipStatusDelta(delta);

            return true;
        }

        private static ShipStatusDelta? BuildCargoDelta(string productName, int cargoDelta, int holdsEmptyDelta)
        {
            var delta = new ShipStatusDelta
            {
                HoldsEmptyDelta = holdsEmptyDelta
            };

            switch (productName.Trim().ToLowerInvariant())
            {
                case "fuel ore":
                    delta.FuelOreDelta = cargoDelta;
                    break;

                case "organics":
                    delta.OrganicsDelta = cargoDelta;
                    break;

                case "equipment":
                    delta.EquipmentDelta = cargoDelta;
                    break;

                case "colonists":
                    delta.ColonistsDelta = cargoDelta;
                    break;

                default:
                    return null;
            }

            return delta;
        }

        private static string NormalizeRecorderLine(string line)
        {
            if (string.IsNullOrEmpty(line))
                return string.Empty;

            string stripped = AnsiCodes.StripANSI(line);
            var normalized = new List<char>(stripped.Length);

            for (int i = 0; i < stripped.Length; i++)
            {
                char ch = stripped[i];
                if (ch == '\b' || ch == (char)0x7F)
                {
                    if (normalized.Count > 0)
                        normalized.RemoveAt(normalized.Count - 1);
                    continue;
                }

                if (ch == '\t' || ch >= ' ')
                    normalized.Add(ch);
            }

            return normalized.Count == 0 ? string.Empty : new string(normalized.ToArray());
        }

        private void SyncSectorPlanetSightings(ModDatabase db, SectorData sector)
        {
            if (sector.Number <= 0)
                return;

            db.SyncSectorPlanetSightings(
                sector.Number,
                sector.PlanetNames.Select(name => ParseSectorPlanetSighting(sector, name)).ToList());
        }

        private static Planet ParseSectorPlanetSighting(SectorData sector, string raw)
        {
            return new Planet
            {
                Name = NormalizeSectorPlanetName(raw),
                Shielded = raw.Contains("(Shielded)", StringComparison.OrdinalIgnoreCase),
                Owner = GetInferredPlanetOwner(sector)
            };
        }

        private static string GetInferredPlanetOwner(SectorData sector)
        {
            if (sector.Fighters == null || sector.Fighters.Quantity <= 0)
                return string.Empty;

            string owner = sector.Fighters.Owner?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(owner))
                return string.Empty;

            if (owner.Equals("belong to your Corp", StringComparison.OrdinalIgnoreCase) ||
                owner.Equals("yours", StringComparison.OrdinalIgnoreCase) ||
                owner.Contains("your Corp", StringComparison.OrdinalIgnoreCase))
            {
                return string.Empty;
            }

            return $"{owner} [inferred]";
        }

        private static string NormalizeSectorPlanetName(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return ".";

            string normalized = raw.Trim();
            normalized = normalized.Replace("<<<<", string.Empty, StringComparison.Ordinal);
            normalized = normalized.Replace(">>>>", string.Empty, StringComparison.Ordinal);
            normalized = normalized.Trim();
            normalized = Regex.Replace(normalized, @"\s*\(Shielded\)\s*$", string.Empty, RegexOptions.IgnoreCase);
            normalized = normalized.Trim();
            normalized = Regex.Replace(normalized, @"^\([A-Z]\)\s*", string.Empty, RegexOptions.IgnoreCase);
            normalized = normalized.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? "." : normalized;
        }

        private void FinalizeActiveSectorDisplay(ModDatabase? db)
        {
            if (db == null || _activeSectorDisplaySector <= 0)
                return;

            int sectorNumber = _activeSectorDisplaySector;
            var sector = GetOrCreate(db, sectorNumber);
            if (sector == null)
                return;

            if (!_activeSectorDisplaySawPort &&
                _activeSectorDisplayHadCachedPort)
            {
                sector.SectorPort = null;
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Cleared cached port for sector {sectorNumber} after live sector display showed no port\n");
            }

            SyncSectorPlanetSightings(db, sector);
            SyncSectorDeploymentMarkers(db, sector);

            // TWX27 SectorCompleted() promotes any completed sector display,
            // including probe displays that only emitted a header, to etHolo.
            sector.Explored = ExploreType.Yes;
            sector.Update = DateTime.Now;
            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] SectorCompleted sector={sectorNumber}\n");
            _activeSectorDisplaySector = 0;
            _activeSectorDisplaySawPort = false;
            _activeSectorDisplayHadCachedPort = false;
        }

        private void ResetPromptDisplays(ModDatabase? db, bool preservePortReport = false)
        {
            if (db != null)
                FinalizeWarpLane(db);
            else
                ResetWarpLane();

            if (db != null && _densityFromSector > 0 && _densityScanSectors.Count > 0)
                CommitDensityWarps(db, _densityFromSector, _densityScanSectors);

            _densityFromSector = 0;
            _densityScanSectors.Clear();
            _inDensityScan = false;
            _inHoloScan = false;
            if (!preservePortReport)
            {
                _inPortReport = false;
                _portReportSector = 0;
                _portReportHasFuel = false;
                _portReportHasOrg = false;
                _pendingPortReportSectorOverride = 0;
            }
            _inCIM = false;
            _inPortCIM = false;
            _inWarpCIM = false;
            if (_inFigScan && db != null)
                CompleteFigScan(db, "prompt");
            _inFigScan = false;
            _currentFigScanSectors.Clear();
            if (_inMineScanKind != MineScanKind.None && db != null)
                CompleteMineScan(db, "prompt");
            _inMineScanKind = MineScanKind.None;
            _currentMineScanSectors.Clear();
            ResetPendingPlanetFighterTransfer();
            ResetPendingSectorDefense();
            _portCimBatchActive = false;
            _currentPortCimSectors.Clear();
            _inNavPointDisplay = false;
            _inLandList = false;
            _landListSector = 0;
            _lastLandListPlanetId = 0;
            _activePlanetDetailId = 0;
            _landListPlanetIndex = 0;
            _pendingLandListShielded.Clear();
            _activeSectorDisplaySector = 0;
            _activeSectorDisplaySawPort = false;
            _activeSectorDisplayHadCachedPort = false;
        }

        private void MarkDestroyedPort(ModDatabase db, int sectorNum)
        {
            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            sector.SectorPort = new Port
            {
                Dead = true,
                Update = DateTime.Now,
            };
            if (_activeSectorDisplaySector == sectorNum)
            {
                _activeSectorDisplaySawPort = true;
                _activeSectorDisplayHadCachedPort = false;
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} port marked destroyed and non-existent\n");
        }

        private int ResolveDestroyedPortSector()
        {
            if (_currentSector > 0)
                return _currentSector;

            if (_lastSector > 0)
                return _lastSector;

            return _activeSectorDisplaySector;
        }

        private static bool IsDestroyedStarPortNotice(string rawLine)
        {
            return rawLine.StartsWith("You destroyed the Star Port!", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsDestroyedPortDisplayLine(string rawLine)
        {
            if (_rxPortDestroyed.IsMatch(rawLine))
                return true;

            string trimmed = rawLine.TrimStart();
            return trimmed.StartsWith("Ports", StringComparison.OrdinalIgnoreCase) &&
                   trimmed.IndexOf(':') >= 0 &&
                   trimmed.IndexOf("Scanners indicate massive debris", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static void ParsePortContinuation(ModDatabase db, int sectorNum, string line)
        {
            var sector = GetOrCreate(db, sectorNum);
            if (sector?.SectorPort == null) return;

            foreach (string token in line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries))
            {
                if (byte.TryParse(token, out byte buildTime))
                {
                    sector.SectorPort.BuildTime = buildTime;
                    db.SaveSector(sector);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} port buildtime={buildTime}\n");
                    return;
                }
            }
        }

        private void ParseTraderSummary(Match m)
        {
            if (m.Groups["label"].Success && !string.IsNullOrWhiteSpace(m.Groups["label"].Value))
                _currentTrader.DisplayLabel = NormalizeTraderDisplayLabel(m.Groups["label"].Value);
            else if (string.IsNullOrWhiteSpace(_currentTrader.DisplayLabel))
                _currentTrader.DisplayLabel = "Traders";

            _currentTrader.Name = m.Groups["name"].Value.Trim();
            _currentTrader.ShipName = string.Empty;
            _currentTrader.ShipType = string.Empty;
            _currentTrader.Fighters = ParseCommaInt(m.Groups["fighters"].Value);
        }

        private void ParseTraderContinuation(ModDatabase db, int sectorNum, string line)
        {
            string trimmed = line.Trim();
            if (trimmed.StartsWith("in ", StringComparison.OrdinalIgnoreCase))
            {
                int open = trimmed.IndexOf('(');
                int close = trimmed.IndexOf(')', open + 1);
                if (open > 3 && close > open)
                {
                    var sector = GetOrCreate(db, sectorNum);
                    if (sector == null) return;

                    var trader = new Trader
                    {
                        DisplayLabel = _currentTrader.DisplayLabel,
                        Name = _currentTrader.Name,
                        Fighters = _currentTrader.Fighters,
                        ShipName = trimmed.Substring(3, open - 4).Trim(),
                        ShipType = trimmed.Substring(open + 1, close - open - 1).Trim()
                    };

                    RemovePriorPlayerTraderSightings(db, sectorNum, trader);
                    sector.Traders.Add(trader);
                    db.SaveSector(sector);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} trader={_currentTrader.Name} ship={sector.Traders[^1].ShipName} type={sector.Traders[^1].ShipType} figs={_currentTrader.Fighters}\n");
                }
                return;
            }

            var m = _rxTraderContinuationLine.Match(trimmed);
            if (m.Success)
                ParseTraderSummary(m);
        }

        private static bool IsPlayerTraderDisplayLabel(string? label)
        {
            if (string.IsNullOrWhiteSpace(label))
                return false;

            return string.Equals(label.Trim(), "Traders", StringComparison.OrdinalIgnoreCase);
        }

        private static void RemovePriorPlayerTraderSightings(ModDatabase db, int currentSector, Trader trader)
        {
            if (currentSector <= 0 ||
                string.IsNullOrWhiteSpace(trader.Name) ||
                !IsPlayerTraderDisplayLabel(trader.DisplayLabel))
            {
                return;
            }

            int sectorLimit = db.DBHeader.Sectors > 0 ? db.DBHeader.Sectors : db.MaxSectorSeen;
            if (sectorLimit <= 0)
                return;

            string traderName = trader.Name.Trim();
            for (int sectorNumber = 1; sectorNumber <= sectorLimit; sectorNumber++)
            {
                if (sectorNumber == currentSector)
                    continue;

                var sector = db.GetSector(sectorNumber);
                if (sector == null || sector.Traders.Count == 0)
                    continue;

                int removed = sector.Traders.RemoveAll(existing =>
                    IsPlayerTraderDisplayLabel(existing.DisplayLabel) &&
                    string.Equals(existing.Name.Trim(), traderName, StringComparison.OrdinalIgnoreCase));

                if (removed <= 0)
                    continue;

                db.SaveSector(sector);
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Removed stale trader={traderName} from sector {sectorNumber} after sighting in sector {currentSector}\n");
            }
        }

        private static string NormalizeTraderDisplayLabel(string? label)
        {
            if (string.IsNullOrWhiteSpace(label))
                return "Traders";

            string value = label.Trim();
            if (value.Equals("Federals", StringComparison.OrdinalIgnoreCase))
                return "Federals";
            if (value.Equals("JemHada", StringComparison.OrdinalIgnoreCase) ||
                value.Equals("Jem'Hada", StringComparison.OrdinalIgnoreCase))
                return "Jem'Hada";
            return value;
        }

        private void ParseShipSummary(Match m)
        {
            _currentShip.Name = m.Groups["name"].Value.Trim();
            _currentShip.Owner = m.Groups["owner"].Value.Trim();
            _currentShip.ShipType = string.Empty;
            _currentShip.Fighters = ParseCommaInt(m.Groups["fighters"].Value);
        }

        private void ParseShipContinuation(ModDatabase db, int sectorNum, string line)
        {
            string trimmed = line.Trim();
            if (trimmed.StartsWith("(", StringComparison.Ordinal))
            {
                int close = trimmed.IndexOf(')');
                if (close > 1)
                {
                    var sector = GetOrCreate(db, sectorNum);
                    if (sector == null) return;

                    sector.Ships.Add(new Ship
                    {
                        Name = _currentShip.Name,
                        Owner = _currentShip.Owner,
                        Fighters = _currentShip.Fighters,
                        ShipType = trimmed.Substring(1, close - 1).Trim()
                    });
                    db.SaveSector(sector);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} ship={_currentShip.Name} owner={_currentShip.Owner} type={sector.Ships[^1].ShipType} figs={_currentShip.Fighters}\n");
                }
                return;
            }

            var m = _rxShipContinuationLine.Match(trimmed);
            if (m.Success)
                ParseShipSummary(m);
        }

        private void ProcessFigScanLine(ModDatabase db, string line)
        {
            if (line.StartsWith("No fighters deployed", StringComparison.OrdinalIgnoreCase))
            {
                ResetFigDatabase(db);
                _currentFigScanSectors.Clear();
                _inFigScan = false;
                return;
            }

            var m = _rxFigScanSector.Match(line);
            if (!m.Success)
                return;

            if (!int.TryParse(m.Groups[1].Value, out int sectorNum) || sectorNum <= 0)
                return;

            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            _currentFigScanSectors.Add(sectorNum);

            sector.Fighters.Owner = m.Groups[3].Value.StartsWith("Personal", StringComparison.OrdinalIgnoreCase)
                ? "yours"
                : "belong to your Corp";

            sector.Fighters.Quantity = ParseDisplayedFighterCount(m.Groups[2].Value, sector.Fighters.Quantity);
            string figType = m.Groups[4].Value;
            sector.Fighters.FigType = figType.Equals("Defensive", StringComparison.OrdinalIgnoreCase)
                ? FighterType.Defensive
                : figType.Equals("Toll", StringComparison.OrdinalIgnoreCase)
                    ? FighterType.Toll
                    : FighterType.Offensive;

            db.SaveSector(sector);
            AddFigMarker(db, sectorNum);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Fig scan sector={sectorNum} qty={sector.Fighters.Quantity} owner={sector.Fighters.Owner} type={sector.Fighters.FigType}\n");
        }

        private void CompleteFigScan(ModDatabase db, string reason)
        {
            ReconcileFriendlyFightersFromScan(db, _currentFigScanSectors, reason);
        }

        private static void ResetFigDatabase(ModDatabase db)
        {
            ReconcileFriendlyFightersFromScan(db, new HashSet<int>(), "no fighters deployed");
        }

        private static void ReconcileFriendlyFightersFromScan(ModDatabase db, IReadOnlySet<int> scannedSectors, string reason)
        {
            int maxSector = db.DBHeader.Sectors > 0 ? db.DBHeader.Sectors : db.MaxSectorSeen;
            int clearedFriendlyFighters = 0;
            int removedFigMarkers = 0;

            for (int i = 1; i <= maxSector; i++)
            {
                if (scannedSectors.Contains(i))
                    continue;

                var sector = db.GetSector(i);
                if (sector == null)
                    continue;

                bool hadFriendlyFighters = sector.Fighters.Quantity > 0 && IsFriendlyFighterOwner(sector.Fighters.Owner);
                bool hadFigMarker = IsSectorVarTrue(db, i, "FIGSEC");

                if (hadFriendlyFighters)
                {
                    sector.Fighters.Owner = string.Empty;
                    sector.Fighters.FigType = FighterType.None;
                    sector.Fighters.Quantity = 0;
                    db.SaveSector(sector);
                    clearedFriendlyFighters++;
                }

                if (hadFigMarker)
                {
                    RemoveFigMarker(db, i);
                    removedFigMarkers++;
                }
            }

            db.SetSectorVar(2, "FIG_COUNT", scannedSectors.Count.ToString());
            GlobalModules.AutoRecorderDebugLog(
                $"[AutoRecorder] Fig scan complete: seen={scannedSectors.Count} clearedFriendlyFigSectors={clearedFriendlyFighters} removedFigMarkers={removedFigMarkers} reason={reason}\n");
        }

        private void BeginMineScan(ModDatabase db, MineScanKind kind)
        {
            if (_inMineScanKind != MineScanKind.None)
                CompleteMineScan(db, "new mine scan");

            _inMineScanKind = kind;
            _currentMineScanSectors.Clear();
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Mine scan begin kind={kind}\n");
        }

        private void ProcessMineScanLine(ModDatabase db, string line)
        {
            if (line.StartsWith("No ", StringComparison.OrdinalIgnoreCase) &&
                line.Contains("mines deployed", StringComparison.OrdinalIgnoreCase))
            {
                CompleteMineScan(db, "none deployed");
                return;
            }

            if (_rxScanTotal.IsMatch(line))
            {
                CompleteMineScan(db, "total");
                return;
            }

            var m = _rxMineScanSector.Match(line);
            if (!m.Success)
                return;

            if (!int.TryParse(m.Groups[1].Value, out int sectorNum) || sectorNum <= 0)
                return;

            int quantity = ParseCommaInt(m.Groups[2].Value);
            string owner = m.Groups[3].Value.StartsWith("Personal", StringComparison.OrdinalIgnoreCase)
                ? "yours"
                : "belong to your Corp";

            _currentMineScanSectors[sectorNum] = (quantity, owner);

            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            ApplyMineScanToSector(sector, _inMineScanKind, quantity, owner);
            db.SaveSector(sector);
            SetMineMarker(db, sectorNum, _inMineScanKind, quantity > 0 && IsFriendlyDeploymentOwner(owner));
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Mine scan sector={sectorNum} kind={_inMineScanKind} qty={quantity} owner={owner}\n");
        }

        private void CompleteMineScan(ModDatabase db, string reason)
        {
            MineScanKind kind = _inMineScanKind;
            if (kind == MineScanKind.None)
                return;

            ReconcileFriendlyMinesFromScan(db, kind, _currentMineScanSectors, reason);
            _inMineScanKind = MineScanKind.None;
            _currentMineScanSectors.Clear();
        }

        private static void ReconcileFriendlyMinesFromScan(
            ModDatabase db,
            MineScanKind kind,
            IReadOnlyDictionary<int, (int Quantity, string Owner)> scannedSectors,
            string reason)
        {
            int maxSector = db.DBHeader.Sectors > 0 ? db.DBHeader.Sectors : db.MaxSectorSeen;
            int clearedFriendlyMineSectors = 0;

            foreach (var pair in scannedSectors)
            {
                int sectorNum = pair.Key;
                var entry = pair.Value;
                var sector = GetOrCreate(db, sectorNum);
                if (sector == null)
                    continue;

                ApplyMineScanToSector(sector, kind, entry.Quantity, entry.Owner);
                db.SaveSector(sector);
                SetMineMarker(db, sectorNum, kind, entry.Quantity > 0 && IsFriendlyDeploymentOwner(entry.Owner));
            }

            for (int i = 1; i <= maxSector; i++)
            {
                if (scannedSectors.ContainsKey(i))
                    continue;

                var sector = db.GetSector(i);
                bool hadMarker = IsSectorVarTrue(db, i, GetMineMarkerName(kind));
                if (sector == null)
                {
                    if (hadMarker)
                        SetMineMarker(db, i, kind, false);
                    continue;
                }

                SpaceObject mines = kind == MineScanKind.Armid ? sector.MinesArmid : sector.MinesLimpet;
                bool hadFriendlyMines = mines.Quantity > 0 && IsFriendlyDeploymentOwner(mines.Owner);
                if (!hadFriendlyMines && !hadMarker)
                    continue;

                if (hadFriendlyMines)
                {
                    mines.Quantity = 0;
                    mines.Owner = string.Empty;
                    db.SaveSector(sector);
                    clearedFriendlyMineSectors++;
                }

                SetMineMarker(db, i, kind, false);
            }

            GlobalModules.AutoRecorderDebugLog(
                $"[AutoRecorder] Mine scan complete: kind={kind} seen={scannedSectors.Count} clearedFriendlyMineSectors={clearedFriendlyMineSectors} reason={reason}\n");
        }

        private static void ApplyMineScanToSector(SectorData sector, MineScanKind kind, int quantity, string owner)
        {
            SpaceObject mines = kind == MineScanKind.Armid ? sector.MinesArmid : sector.MinesLimpet;
            mines.Quantity = quantity;
            mines.Owner = owner;
        }

        private static bool IsFriendlyFighterOwner(string owner)
        {
            return IsFriendlyDeploymentOwner(owner);
        }

        private static bool IsFriendlyDeploymentOwner(string owner)
        {
            if (string.IsNullOrWhiteSpace(owner))
                return false;

            return owner.Equals("yours", StringComparison.OrdinalIgnoreCase) ||
                   owner.Equals("belong to your Corp", StringComparison.OrdinalIgnoreCase) ||
                   owner.Contains("your Corp", StringComparison.OrdinalIgnoreCase);
        }

        private static int ParseDisplayedFighterCount(string text, int existingValue)
        {
            string normalized = text.Replace(",", string.Empty, StringComparison.Ordinal).Trim();
            if (int.TryParse(normalized, out int exact))
                return exact;

            if (normalized.Length < 2)
                return existingValue;

            char suffix = char.ToUpperInvariant(normalized[^1]);
            if (!double.TryParse(normalized[..^1], out double baseValue))
                return existingValue;

            double multiplier = suffix switch
            {
                'T' => 1_000d,
                'M' => 1_000_000d,
                'B' => 1_000_000_000d,
                _ => 0d
            };

            if (multiplier <= 0)
                return existingValue;

            int approx = (int)(baseValue * multiplier);
            int margin = (int)(multiplier / 2d);
            if (existingValue < approx - margin || existingValue > approx + margin)
                return approx;
            return existingValue;
        }

        private void ParseSectorDefenderPrompt(ModDatabase db, Match m)
        {
            int sectorNum = _currentSector > 0 ? _currentSector : _lastSector;
            if (sectorNum <= 0)
            {
                ResetPendingSectorDefense();
                return;
            }

            var sector = GetOrCreate(db, sectorNum);
            if (sector == null)
            {
                ResetPendingSectorDefense();
                return;
            }

            int quantity = ParseCommaInt(m.Groups[1].Value);
            _pendingSectorDefenseSector = sectorNum;
            _pendingSectorDefenseQuantity = Math.Max(0, quantity);
            _pendingSectorDefenseOwner = string.Empty;
            _pendingSectorDefenseType = FighterType.None;

            if (_pendingSectorDefenseQuantity <= 0)
                ResetPendingSectorDefense();

            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} defenders prompt -> fighters={quantity}\n");
        }

        private bool TryProcessSectorDefenseStatus(ModDatabase db, string trimmedLine)
        {
            var owner = _rxSectorDefenderOwnerPrompt.Match(trimmedLine);
            if (owner.Success)
            {
                _pendingSectorDefenseOwner = owner.Groups[1].Value.Equals("P", StringComparison.OrdinalIgnoreCase)
                    ? "yours"
                    : "belong to your Corp";
                return true;
            }

            var figType = _rxSectorDefenderTypePrompt.Match(trimmedLine);
            if (figType.Success)
            {
                _pendingSectorDefenseType = figType.Groups[1].Value.ToUpperInvariant() switch
                {
                    "D" => FighterType.Defensive,
                    "T" => FighterType.Toll,
                    _ => FighterType.Offensive,
                };
                return true;
            }

            if (_rxSectorDefenderSuccess.IsMatch(trimmedLine))
            {
                if (_pendingSectorDefenseSector > 0 && _pendingSectorDefenseQuantity > 0)
                {
                    var sector = GetOrCreate(db, _pendingSectorDefenseSector);
                    if (sector != null)
                    {
                        sector.Fighters.Quantity = _pendingSectorDefenseQuantity;
                        if (!string.IsNullOrWhiteSpace(_pendingSectorDefenseOwner))
                            sector.Fighters.Owner = _pendingSectorDefenseOwner;
                        if (_pendingSectorDefenseType != FighterType.None)
                            sector.Fighters.FigType = _pendingSectorDefenseType;
                        db.SaveSector(sector);
                        AddFigMarker(db, _pendingSectorDefenseSector);
                        GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {_pendingSectorDefenseSector} defense drop committed qty={_pendingSectorDefenseQuantity} owner={sector.Fighters.Owner} type={sector.Fighters.FigType}\n");
                    }
                }

                ResetPendingSectorDefense();
                return true;
            }

            return false;
        }

        private static int ParseCommaInt(string text)
        {
            return int.TryParse(text.Replace(",", string.Empty, StringComparison.Ordinal), out int value) ? value : 0;
        }

        private static long ParseCommaLong(string text)
        {
            return long.TryParse(text.Replace(",", string.Empty, StringComparison.Ordinal), out long value) ? value : 0L;
        }

        private static bool IsBoolYes(string text)
        {
            return text.Equals("Yes", StringComparison.OrdinalIgnoreCase) ||
                   text.Equals("Y", StringComparison.OrdinalIgnoreCase);
        }

        private static bool TryBuildDockPurchaseDelta(string itemName, int quantity, out ShipStatusDelta? delta)
        {
            delta = null;
            if (quantity <= 0)
                return false;

            string normalized = Regex.Replace(itemName, @"[^a-z0-9]+", " ", RegexOptions.IgnoreCase)
                .Trim()
                .ToLowerInvariant();

            if (normalized.Contains("fighter", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { FightersDelta = quantity };
                return true;
            }

            if (normalized.Contains("shield armor point", StringComparison.Ordinal) ||
                normalized.Contains("shield point", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { ShieldsDelta = quantity };
                return true;
            }

            if (normalized.Contains("cargo hold", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta
                {
                    TotalHoldsDelta = quantity,
                    HoldsEmptyDelta = quantity
                };
                return true;
            }

            if (normalized.Contains("atomic detonator", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { AtomicDetDelta = quantity };
                return true;
            }

            if (normalized.Contains("marker beacon", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { BeaconsDelta = quantity };
                return true;
            }

            if (normalized.Contains("corbomite", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { CorbomiteDelta = quantity };
                return true;
            }

            if (normalized.Contains("cloaking device", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { CloaksDelta = quantity };
                return true;
            }

            if (normalized.Contains("ether probe", StringComparison.Ordinal) ||
                normalized.Equals("probe", StringComparison.Ordinal) ||
                normalized.Equals("probes", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { EtherProbesDelta = quantity };
                return true;
            }

            if (normalized.Contains("planet scanner", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { PlanetScanner = true };
                return true;
            }

            if (normalized.Contains("limpet", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { LimpetMinesDelta = quantity };
                return true;
            }

            if (normalized.Contains("space mine", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { ArmidMinesDelta = quantity };
                return true;
            }

            if (normalized.Contains("photon missile", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { PhotonsDelta = quantity };
                return true;
            }

            if (normalized.Contains("mine disruptor", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { MineDisruptorsDelta = quantity };
                return true;
            }

            if (normalized.Contains("genesis torpedo", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { GenesisTorpsDelta = quantity };
                return true;
            }

            if (normalized.Contains("psychic probe", StringComparison.Ordinal))
            {
                delta = new ShipStatusDelta { PsychProbe = true };
                return true;
            }

            return false;
        }

        private ShipStatusDelta? BuildPendingDockPurchaseConfirmationDelta()
        {
            switch (_pendingDockPurchaseKind)
            {
                case PendingDockPurchaseKind.HoloScanner:
                    return new ShipStatusDelta { LRSType = "Holo" };

                case PendingDockPurchaseKind.DensityScanner:
                    return new ShipStatusDelta { LRSType = "Density" };

                case PendingDockPurchaseKind.PlanetScanner:
                    return new ShipStatusDelta { PlanetScanner = true };

                case PendingDockPurchaseKind.TransWarp1:
                    return new ShipStatusDelta
                    {
                        TransWarp1 = 1,
                        TransWarp2 = 0
                    };

                case PendingDockPurchaseKind.TransWarp2:
                    return new ShipStatusDelta
                    {
                        TransWarp1 = 1,
                        TransWarp2 = 1
                    };

                case PendingDockPurchaseKind.Quantity:
                    if (TryBuildDockPurchaseDelta(_pendingDockPurchaseItemName, _pendingDockPurchaseQuantity, out ShipStatusDelta? delta))
                        return delta;
                    break;
            }

            return null;
        }

        private void ResetPendingDockPurchase()
        {
            _pendingDockPurchaseKind = PendingDockPurchaseKind.None;
            _pendingDockPurchaseItemName = string.Empty;
            _pendingDockPurchaseQuantity = 0;
        }

        private void ResetPendingPlanetFighterTransfer()
        {
            _pendingPlanetFighterTransferKind = PendingPlanetFighterTransferKind.None;
            _pendingPlanetFighterTransferQuantity = 0;
        }

        private void ResetPendingPlanetProductTransfer()
        {
            _pendingPlanetProductTransferKind = PlanetProductTransferKind.None;
            _pendingPlanetProductName = string.Empty;
            _pendingPlanetProductQuantity = 0;
        }

        private void ResetPendingSectorDefense()
        {
            _pendingSectorDefenseSector = 0;
            _pendingSectorDefenseQuantity = 0;
            _pendingSectorDefenseOwner = string.Empty;
            _pendingSectorDefenseType = FighterType.None;
        }

        private bool TryProcessWatcherState(ModDatabase db, string rawLine, string trimmedLine)
        {
            if (ShouldIgnoreRecorderCommLine(rawLine, ansiLine: null))
                return false;

            if (trimmedLine.StartsWith("For getting caught your alignment went down by", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("Suddenly you're Busted!", StringComparison.OrdinalIgnoreCase))
            {
                int sector = ResolveWatcherSector();
                if (sector <= 0)
                    return true;

                db.SetSectorVar(sector, DatabaseConstants.BustParameterName, "1");
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] BUSTED sector={sector}\n");
                return true;
            }

            if (trimmedLine.StartsWith("(You realize the guards saw you last time!)", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.StartsWith("(You suddenly remember that you were caught stealing here before)", StringComparison.OrdinalIgnoreCase))
            {
                int sector = ResolveWatcherSector();
                if (sector <= 0)
                    return true;

                db.SetSectorVar(sector, DatabaseConstants.BustParameterName, "1");
                db.SetSectorVar(sector, DatabaseConstants.FakeBustParameterName, "1");
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] FAKEBUST sector={sector}\n");
                return true;
            }

            {
                var m = _rxFighterHitReport.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    PublishLastHit("fighter", sector);
                    return true;
                }
            }

            {
                var m = _rxLimpetHitReport.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    PublishLastHit("limpet", sector);
                    return true;
                }
            }

            {
                var m = _rxArmidHitReport.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    PublishLastHit("armid", sector);
                    return true;
                }
            }

            if (trimmedLine.StartsWith("Should these be (D)efensive, (O)ffensive or Charge a (T)oll ?", StringComparison.OrdinalIgnoreCase))
            {
                int sector = ScriptRef.GetCurrentSector();
                if (sector > 10)
                    AddFigMarker(db, sector);
                return true;
            }

            {
                var m = _rxPgridAdd.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    AddFigMarker(db, sector);
                    return true;
                }
            }

            {
                var m = _rxPgridRemove.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    RemoveFigMarker(db, sector);
                    return true;
                }
            }

            {
                var m = _rxNoFigsSector.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    RemoveFigMarker(db, sector);
                    return true;
                }
            }

            if (_rxLostCorpFigsSector.IsMatch(trimmedLine) || _rxLostPersonalFigsSector.IsMatch(trimmedLine))
            {
                var m = _rxDestroyedFigsSector.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    RemoveFigMarker(db, sector);
                    return true;
                }
            }

            if (trimmedLine.StartsWith("The Federation We destroyed your Corp's", StringComparison.OrdinalIgnoreCase))
            {
                var m = _rxDestroyedFigsSector.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    db.SetSectorVar(sector, "MSLSEC", "1");
                    RemoveFigMarker(db, sector);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Federation erased corp figs sector={sector} msl=1\n");
                    return true;
                }
            }

            {
                var m = _rxDestroyedFriendlyFigs.Match(trimmedLine);
                if (m.Success &&
                    int.TryParse(m.Groups[2].Value, out int sector) &&
                    sector > 0)
                {
                    int destroyed = ParseCommaInt(m.Groups[1].Value);
                    ApplyFriendlyFighterLoss(db, sector, destroyed);
                    return true;
                }
            }

            if (trimmedLine.Contains(" of your fighters in sector ", StringComparison.OrdinalIgnoreCase) &&
                trimmedLine.Contains(" destroyed ", StringComparison.OrdinalIgnoreCase))
            {
                var m = _rxDestroyedFigsSector.Match(trimmedLine);
                if (m.Success && int.TryParse(m.Groups[1].Value, out int sector))
                {
                    RemoveFigMarker(db, sector);
                    return true;
                }
            }

            return false;
        }

        private static void ApplyFriendlyFighterLoss(ModDatabase db, int sectorNum, int destroyed)
        {
            if (sectorNum <= 0 || sectorNum > db.SectorCount)
                return;

            var sector = GetOrCreate(db, sectorNum);
            if (sector == null)
                return;

            int current = sector.Fighters.Quantity;
            int updated = current > 0 && destroyed > 0
                ? Math.Max(0, current - destroyed)
                : 0;

            sector.Fighters.Quantity = updated;
            if (updated <= 0)
            {
                sector.Fighters.Owner = string.Empty;
                sector.Fighters.FigType = FighterType.None;
            }

            db.SaveSector(sector);

            if (updated <= 0)
                RemoveFigMarker(db, sectorNum);

            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Friendly fighters destroyed sector={sectorNum} destroyed={destroyed} remaining={updated}\n");
        }

        private bool TryProcessGenesisTorpedoState(string trimmedLine)
        {
            if (trimmedLine.StartsWith("For building this planet you receive", StringComparison.OrdinalIgnoreCase))
            {
                GenesisTorpsChanged?.Invoke(-1);
                GlobalModules.AutoRecorderDebugLog("[AutoRecorder] Planet build detected, genesis torps delta=-1\n");
                return true;
            }

            if (trimmedLine.StartsWith("For blowing up this planet you receive", StringComparison.OrdinalIgnoreCase))
            {
                AtomicDetChanged?.Invoke(-1);
                GlobalModules.AutoRecorderDebugLog("[AutoRecorder] Planet detonation detected, atomic detonators delta=-1\n");
                return true;
            }

            return false;
        }

        private int ResolveWatcherSector()
        {
            if (_currentSector > 0)
                return _currentSector;

            int scriptSector = ScriptRef.GetCurrentSector();
            if (scriptSector > 0)
                return scriptSector;

            return _lastSector;
        }

        private static bool ShouldIgnoreRecorderCommLine(string line, string? ansiLine)
        {
            if (string.IsNullOrEmpty(line))
                return false;

            if (AnsiCodes.TryParseCommMessageLine(ansiLine ?? string.Empty, out _))
                return true;

            string trimmed = line.TrimStart();
            if (trimmed.StartsWith(">", StringComparison.Ordinal) ||
                trimmed.StartsWith("Received from Shipboard Computers", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (line.StartsWith("P ", StringComparison.Ordinal) ||
                line.StartsWith("'", StringComparison.Ordinal) ||
                line.StartsWith("`", StringComparison.Ordinal))
            {
                return true;
            }

            if (string.IsNullOrEmpty(ansiLine) &&
                (line.StartsWith("R ", StringComparison.Ordinal) ||
                 line.StartsWith("F ", StringComparison.Ordinal)))
            {
                return true;
            }

            return false;
        }

        private static void PublishLastHit(string hitType, int sector)
        {
            if (sector <= 0)
                return;

            ScriptRef.SetGlobalVar("$BOT~LAST_HIT_TYPE", hitType);
            ScriptRef.SetGlobalVar("$BOT~LAST_HIT", sector.ToString());

            switch (hitType)
            {
                case "fighter":
                    ScriptRef.SetGlobalVar("$BOT~LAST_FIGHTER_HIT", sector.ToString());
                    break;
                case "limpet":
                    ScriptRef.SetGlobalVar("$BOT~LAST_LIMPET_HIT", sector.ToString());
                    break;
                case "armid":
                    ScriptRef.SetGlobalVar("$BOT~LAST_ARMID_HIT", sector.ToString());
                    break;
            }

            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Last hit type={hitType} sector={sector}\n");
        }

        private static void AddFigMarker(ModDatabase db, int sector)
        {
            if (sector <= 0 || sector > db.SectorCount)
                return;

            bool alreadyPresent = IsSectorVarTrue(db, sector, "FIGSEC");
            if (!alreadyPresent)
            {
                int count = GetSectorVarInt(db, 2, "FIG_COUNT");
                db.SetSectorVar(2, "FIG_COUNT", (count + 1).ToString());
            }

            SetSectorFlag(db, sector, "FIGSEC", true);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] FIGSEC add sector={sector} count={GetSectorVarInt(db, 2, "FIG_COUNT")}\n");
        }

        private static void RemoveFigMarker(ModDatabase db, int sector)
        {
            if (sector <= 0 || sector > db.SectorCount)
                return;

            bool alreadyPresent = IsSectorVarTrue(db, sector, "FIGSEC");
            if (alreadyPresent)
            {
                int count = Math.Max(0, GetSectorVarInt(db, 2, "FIG_COUNT") - 1);
                db.SetSectorVar(2, "FIG_COUNT", count.ToString());
            }

            SetSectorFlag(db, sector, "FIGSEC", false);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] FIGSEC remove sector={sector} count={GetSectorVarInt(db, 2, "FIG_COUNT")}\n");
        }

        private static void SyncSectorDeploymentMarkers(ModDatabase db, SectorData sector)
        {
            if (sector.Number <= 0 || sector.Number > db.SectorCount)
                return;

            bool hasFriendlyFighters = sector.Fighters.Quantity > 0 && IsFriendlyDeploymentOwner(sector.Fighters.Owner);
            if (hasFriendlyFighters)
                AddFigMarker(db, sector.Number);
            else
                RemoveFigMarker(db, sector.Number);

            SetMineMarker(
                db,
                sector.Number,
                MineScanKind.Armid,
                sector.MinesArmid.Quantity > 0 && IsFriendlyDeploymentOwner(sector.MinesArmid.Owner));

            SetMineMarker(
                db,
                sector.Number,
                MineScanKind.Limpet,
                sector.MinesLimpet.Quantity > 0 && IsFriendlyDeploymentOwner(sector.MinesLimpet.Owner));
        }

        private static void SetMineMarker(ModDatabase db, int sector, MineScanKind kind, bool present)
        {
            if (kind == MineScanKind.None)
                return;

            SetSectorFlag(db, sector, GetMineMarkerName(kind), present);
        }

        private static string GetMineMarkerName(MineScanKind kind)
        {
            return kind == MineScanKind.Armid ? "MINESEC" : "LIMPSEC";
        }

        private static void SetSectorFlag(ModDatabase db, int sector, string name, bool present)
        {
            if (sector <= 0 || sector > db.SectorCount)
                return;

            db.SetSectorVar(sector, name, present ? "1" : "0");
        }

        private static bool IsSectorVarTrue(ModDatabase db, int sector, string name)
        {
            string value = db.GetSectorVar(sector, name);
            return value == "1" || value.Equals("TRUE", StringComparison.OrdinalIgnoreCase);
        }

        private static int GetSectorVarInt(ModDatabase db, int sector, string name)
        {
            return int.TryParse(db.GetSectorVar(sector, name), out int value) ? value : 0;
        }

        // Returns the sector number on success (so caller can collect it), 0 on failure.
        private static int ParseDensityLine(ModDatabase db, Match m)
        {
            if (!int.TryParse(m.Groups[1].Value, out int sn)) return 0;
            var sector = GetOrCreate(db, sn);
            if (sector == null) return 0;

            // Density value (Pascal: GetParameter(X,4))
            sector.Density = ParseCommaInt(m.Groups[2].Value);

            // Warp count (Pascal: GetParameter(X,7)) — count only, not the Warp[] array
            if (byte.TryParse(m.Groups[3].Value, out byte wc))
                sector.WarpCount = wc;

            // NavHaz % (Pascal: GetParameter(X,10), stripped of trailing '%')
            if (byte.TryParse(m.Groups[4].Value, out byte navhaz))
                sector.NavHaz = navhaz;

            // Anomaly flag (Pascal: GetParameter(X,13) = 'Yes')
            sector.Anomaly = m.Groups[5].Value.Equals("Yes", StringComparison.OrdinalIgnoreCase);

            // Pascal: if Sect.Explored in [etNo, etCalc] then set Constellation/Explored/Update
            if (sector.Explored == ExploreType.No || sector.Explored == ExploreType.Calc)
            {
                sector.Constellation = "??? (Density only)";
                sector.Explored = ExploreType.Density;
                sector.Update = DateTime.Now;
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] density sector={sn} density={sector.Density} warps={wc} navhaz={navhaz} anom={sector.Anomaly}\n");
            return sn;
        }

        // Write the sectors listed in a density scan as Warp[] for the origin sector.
        // Because a density scan from sector A enumerates all sectors directly adjacent
        // to A, those sector numbers ARE A's warps.
        private static void CommitDensityWarps(ModDatabase db, int fromSector, List<int> sectors)
        {
            var sec = GetOrCreate(db, fromSector);
            if (sec == null) return;

            var observedWarps = sectors
                .Take(6)
                .Where(sn => sn > 0)
                .ToList();
            LogWarpStaticCorrection(fromSector, sec, observedWarps, "AutoRecorder.DensityScan");

            for (int i = 0; i < 6; i++) sec.Warp[i] = 0;
            int idx = 0;
            foreach (int sn in observedWarps)
            {
                sec.Warp[idx++] = sn;
            }
            sec.WarpCount = (byte)Math.Min(idx, 6);

            db.SaveSector(sec);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {fromSector} warps from density scan: {string.Join(", ", sectors)}\n");
        }

        private void ParseWarpsLine(ModDatabase db, int sectorNum, string warpsPart)
        {
            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            // Parse "4497 - 5489 - 6477 - 15024 - 19702"
            // Also handles parenthesised unexplored sectors: "(3583) - 4497 - (6198)"
            var observedWarps = new List<int>();
            foreach (var token in warpsPart.Split(new[] { ' ', '-' }, StringSplitOptions.RemoveEmptyEntries))
            {
                if (observedWarps.Count >= 6) break;
                // Strip surrounding parentheses from unexplored-sector notation
                var clean = token.Trim().Trim('(', ')');
                if (int.TryParse(clean, out int w) && w > 0 && (db.SectorCount <= 0 || w <= db.SectorCount))
                    observedWarps.Add(w);
            }

            LogWarpStaticCorrection(sectorNum, sector, observedWarps, "AutoRecorder.SectorDisplay");

            // Clear existing warps
            for (int i = 0; i < 6; i++) sector.Warp[i] = 0;

            for (int i = 0; i < observedWarps.Count; i++)
                sector.Warp[i] = observedWarps[i];

            sector.WarpCount = (byte)Math.Min(observedWarps.Count, 6);

            // Pascal SectorCompleted() sets etHolo (the maximum explored level) whenever
            // a full sector display finishes — this covers both direct visits and holo scans.
            // Only upgrade, never downgrade (density-only will already be ExploreType.Density).
            if (sector.Explored != ExploreType.Yes)
            {
                sector.Explored = ExploreType.Yes;
                sector.Update = DateTime.Now;
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] ParseWarpsLine sect={sectorNum} stored=[{string.Join(",", sector.Warp)}]\n");

            if (_activeSectorDisplaySector == sectorNum)
                FinalizeActiveSectorDisplay(db);
        }

        private void ParsePortLine(ModDatabase db, int sectorNum, string rawLine, Match m)
        {
            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            if (_activeSectorDisplaySector == sectorNum)
                _activeSectorDisplaySawPort = true;

            bool navPointPreview = _inNavPointDisplay;
            ushort previousDock = db.DBHeader.StarDock;
            ushort previousAlpha = db.DBHeader.AlphaCentauri;
            ushort previousRylos = db.DBHeader.Rylos;

            PortStaticSnapshot? beforePort = GlobalModules.DatabaseCorrectionLoggingEnabled
                ? CapturePortStaticSnapshot(sector.SectorPort)
                : null;
            sector.SectorPort ??= new Port();
            string observedName = m.Groups[1].Value.Trim();
            sector.SectorPort.Name = observedName;
            sector.SectorPort.Dead = false;
            sector.SectorPort.BuildTime = 0;

            byte observedClass = sector.SectorPort.ClassIndex;
            if (byte.TryParse(m.Groups[2].Value, out byte cls))
            {
                observedClass = cls;
                sector.SectorPort.ClassIndex = cls;
            }

            // Parse S/B notation from optional group 3, e.g. "(SBB)"
            // B = port Buys this product (player sells to port)
            // S = port Sells this product (player buys from port)
            string? observedType = null;
            if (m.Groups[3].Success)
            {
                string notation = m.Groups[3].Value.ToUpperInvariant();
                if (notation.Length == 3)
                {
                    observedType = notation;
                    sector.SectorPort.BuyProduct[ProductType.FuelOre] = notation[0] == 'B';
                    sector.SectorPort.BuyProduct[ProductType.Organics] = notation[1] == 'B';
                    sector.SectorPort.BuyProduct[ProductType.Equipment] = notation[2] == 'B';
                }
            }

            if (beforePort.HasValue)
            {
                LogPortStaticCorrection(
                    sectorNum,
                    beforePort.Value,
                    observedName,
                    observedClass,
                    observedType,
                    "AutoRecorder.SectorDisplay");
            }

            // A Ports line means we have a real sector scan (D command or holo scan).
            // Upgrade explore level so the sector doesn't stay stuck at Unknown/Calc,
            // which can happen for dead-end sectors that never emit a Warps line.
            if (sector.Explored != ExploreType.Yes)
            {
                sector.Explored = ExploreType.Yes;
                if (sector.Update == default) sector.Update = DateTime.Now;
            }

            bool navShowsStarDock =
                sector.SectorPort.ClassIndex == 9 &&
                (!navPointPreview || rawLine.IndexOf("(StarDock)", StringComparison.OrdinalIgnoreCase) >= 0);
            bool navShowsAlpha =
                sector.SectorPort.ClassIndex == 0 &&
                string.Equals(sector.SectorPort.Name, "Alpha Centauri", StringComparison.OrdinalIgnoreCase);
            bool navShowsRylos =
                sector.SectorPort.ClassIndex == 0 &&
                string.Equals(sector.SectorPort.Name, "Rylos", StringComparison.OrdinalIgnoreCase);

            db.SaveSector(sector);

            if (navPointPreview)
            {
                if (!navShowsStarDock)
                    db.DBHeader.StarDock = previousDock;
                if (!navShowsAlpha)
                    db.DBHeader.AlphaCentauri = previousAlpha;
                if (!navShowsRylos)
                    db.DBHeader.Rylos = previousRylos;

                if (navShowsStarDock)
                {
                    string dockSector = sectorNum.ToString();
                    ScriptRef.SetCurrentGameVar("$STARDOCK", dockSector);
                    ScriptRef.SetCurrentGameVar("$MAP~STARDOCK", dockSector);
                    ScriptRef.SetCurrentGameVar("$MAP~stardock", dockSector);
                    ScriptRef.SetCurrentGameVar("$BOT~STARDOCK", dockSector);
                    ScriptRef.SetCurrentGameVar("$stardock", dockSector);
                    ScriptRef.OnVariableSaved?.Invoke("$STARDOCK", dockSector);
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] NavPoint confirmed Stardock in sector {sectorNum}\n");
                }
            }

            if (sector.SectorPort.ClassIndex == 9 ||
                (sector.SectorPort.ClassIndex == 0 &&
                 (string.Equals(sector.SectorPort.Name, "Alpha Centauri", StringComparison.OrdinalIgnoreCase) ||
                  string.Equals(sector.SectorPort.Name, "Rylos", StringComparison.OrdinalIgnoreCase))))
            {
                LandmarkSectorsChanged?.Invoke();
            }
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} port={sector.SectorPort.Name} class={observedClass}\n");
        }

        /// <summary>
        /// Parses a product line from a commerce report and updates the port's
        /// BuyProduct, ProductAmount, and ProductPercent data.
        /// Pascal equivalent: Process.pas commerce report block.
        /// </summary>
        private void ParseProductLine(ModDatabase db, Match m)
        {
            if (_portReportSector <= 0) return;
            var sector = GetOrCreate(db, _portReportSector);
            if (sector == null) return;

            sector.SectorPort ??= new Port();

            string productName = m.Groups[1].Value;
            string status = m.Groups[2].Value;
            string amtStr = m.Groups[3].Value.Replace(",", "");
            string pctStr = m.Groups[4].Value;

            // "Buying" → port buys (players sell here), "Selling" → port sells (players buy here)
            bool buys = status.Equals("Buying", StringComparison.OrdinalIgnoreCase);

            ushort amt = 0;
            if (!ushort.TryParse(amtStr, out amt))
            {
                if (uint.TryParse(amtStr, out uint bigAmt))
                    amt = bigAmt > ushort.MaxValue ? ushort.MaxValue : (ushort)bigAmt;
            }
            if (!byte.TryParse(pctStr, out byte pct)) pct = 0;

            ProductType pt;
            if (productName.Equals("Fuel Ore", StringComparison.OrdinalIgnoreCase))
            {
                pt = ProductType.FuelOre;
                _portReportHasFuel = true;
            }
            else if (productName.Equals("Organics", StringComparison.OrdinalIgnoreCase))
            {
                pt = ProductType.Organics;
                _portReportHasOrg = true;
            }
            else
            {
                pt = ProductType.Equipment;
            }

            sector.SectorPort.BuyProduct[pt] = buys;
            sector.SectorPort.ProductAmount[pt] = amt;
            sector.SectorPort.ProductPercent[pt] = pct;

            // After Equipment line: derive ClassIndex from buy pattern if not already set,
            // then timestamp and close the report block.
            if (pt == ProductType.Equipment && _portReportHasFuel && _portReportHasOrg)
            {
                byte derivedClass = DeriveClassIndex(
                    sector.SectorPort.BuyProduct[ProductType.FuelOre],
                    sector.SectorPort.BuyProduct[ProductType.Organics],
                    sector.SectorPort.BuyProduct[ProductType.Equipment]);
                string derivedType = FormatPortType(sector.SectorPort);

                if (_portReportOriginalSnapshot.HasValue)
                {
                    LogPortStaticCorrection(
                        _portReportSector,
                        _portReportOriginalSnapshot.Value,
                        sector.SectorPort.Name,
                        derivedClass,
                        derivedType,
                        "AutoRecorder.PortReport");
                }

                sector.SectorPort.ClassIndex = derivedClass;
                sector.SectorPort.Update = DateTime.Now;
                _inPortReport = false;
                _portReportOriginalSnapshot = null;
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Port report complete: sector={_portReportSector} class={sector.SectorPort.ClassIndex}\n");
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Port product: {productName} {status} amt={amt} pct={pct}% sector={_portReportSector}\n");
        }

        /// <summary>
        /// Derives the TWX port class index from the buy/sell pattern.
        /// Pascal mapping: BBS=1, BSB=2, SBB=3, SSB=4, SBS=5, BSS=6, SSS=7, BBB=8.
        /// (B=port buys, S=port sells; order = FuelOre, Organics, Equipment)
        /// </summary>
        private static byte DeriveClassIndex(bool buyFuel, bool buyOrg, bool buyEquip)
        {
            if (buyFuel && buyOrg && !buyEquip) return 1; // BBS
            if (buyFuel && !buyOrg && buyEquip) return 2; // BSB
            if (!buyFuel && buyOrg && buyEquip) return 3; // SBB
            if (!buyFuel && !buyOrg && buyEquip) return 4; // SSB
            if (!buyFuel && buyOrg && !buyEquip) return 5; // SBS
            if (buyFuel && !buyOrg && !buyEquip) return 6; // BSS
            if (!buyFuel && !buyOrg && !buyEquip) return 7; // SSS
            if (buyFuel && buyOrg && buyEquip) return 8; // BBB
            return 0;
        }

        private static void ParseFightersLine(ModDatabase db, int sectorNum, Match m)
        {
            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            // Quantity: strip commas (Pascal: StripChar(S, ','))
            string qtyStr = m.Groups[1].Value.Replace(",", "");
            if (int.TryParse(qtyStr, out int qty))
                sector.Fighters.Quantity = qty;

            // Owner: text between the first ( and ) — Pascal: Copy(Line, I, Pos(')'...)
            sector.Fighters.Owner = m.Groups[2].Value.Trim();

            // FigType: from optional trailing [Toll]/[Defensive]/[Offensive] bracket
            // Pascal: check last 6 chars for [Toll], last 11 for [Defensive], else Offensive
            string bracket = m.Groups[3].Success ? m.Groups[3].Value.Trim() : string.Empty;
            sector.Fighters.FigType = bracket.Equals("Toll", StringComparison.OrdinalIgnoreCase)
                ? FighterType.Toll
                : bracket.Equals("Defensive", StringComparison.OrdinalIgnoreCase)
                    ? FighterType.Defensive
                    : FighterType.Offensive;

            db.SaveSector(sector);
            if (sector.Fighters.Quantity > 0 && IsFriendlyDeploymentOwner(sector.Fighters.Owner))
                AddFigMarker(db, sectorNum);
            else
                RemoveFigMarker(db, sectorNum);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} fighters={qty} owner={sector.Fighters.Owner} type={sector.Fighters.FigType}\n");
        }

        // "Mines   : 3 (Type 1 Armid) (belong to your Corp)"  — or continuation variant.
        // Groups: 1=quantity, 2=Armid|Limpet, 3=owner text
        private static void ParseMinesLine(ModDatabase db, int sectorNum, Match m)
        {
            var sector = GetOrCreate(db, sectorNum);
            if (sector == null) return;

            if (!int.TryParse(m.Groups[1].Value, out int qty)) return;
            string mineType = m.Groups[2].Value;
            string owner = NormalizeOwnerText(m.Groups[3].Value);

            if (mineType.Equals("Armid", StringComparison.OrdinalIgnoreCase))
            {
                sector.MinesArmid.Quantity = qty;
                sector.MinesArmid.Owner = owner;
                SetMineMarker(db, sectorNum, MineScanKind.Armid, qty > 0 && IsFriendlyDeploymentOwner(owner));
            }
            else
            {
                sector.MinesLimpet.Quantity = qty;
                sector.MinesLimpet.Owner = owner;
                SetMineMarker(db, sectorNum, MineScanKind.Limpet, qty > 0 && IsFriendlyDeploymentOwner(owner));
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Sector {sectorNum} mines {mineType}={qty} owner={owner}\n");
        }

        private static string NormalizeOwnerText(string? rawOwner)
        {
            if (string.IsNullOrWhiteSpace(rawOwner))
                return string.Empty;

            string owner = rawOwner.Trim();
            if (owner.StartsWith("(") && owner.EndsWith(")") && owner.Length > 1)
                owner = owner[1..^1].Trim();

            const string ownedByPrefix = "owned by ";
            if (owner.StartsWith(ownedByPrefix, StringComparison.OrdinalIgnoreCase))
                owner = owner[ownedByPrefix.Length..].Trim();

            return owner;
        }

        // ── Warp-lane helpers ──────────────────────────────────────────────────

        /// <summary>
        /// Pascal: TModExtractor.ProcessWarpLine.
        /// Parses a line of sector numbers separated by " >" and writes each
        /// consecutive pair as a warp connection (one direction only, matching Pascal).
        /// </summary>
        private void FinalizeWarpLane(ModDatabase? db)
        {
            if (db != null && _warpLaneBuffer.Length > 0)
            {
                string route = _warpLaneBuffer.ToString();
                ProcessWarpLaneRoute(db, route);
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] WarpLane finalized: '{route}'\n");
            }

            ResetWarpLane();
        }

        private void ResetWarpLane()
        {
            _inWarpLane = false;
            _warpLaneBuffer.Clear();
        }

        private static void ProcessWarpLaneRoute(ModDatabase db, string line)
        {
            // Pascal: StripChar(Line, ')'); StripChar(Line, '(');
            string stripped = line.Replace("(", "").Replace(")", "");

            // Pascal: Split(Line, Sectors, ' >') — split on the two-char delimiter " >"
            string[] tokens = stripped.Split(new[] { " >" }, StringSplitOptions.RemoveEmptyEntries);

            int lastWarpLaneSect = 0;

            foreach (string token in tokens)
            {
                // Pascal: CurSect := StrToIntSafe(Sectors[I]); if CurSect < 1 then exit
                // Use continue (not return) so trailing empty tokens from " >" endings
                // don't abort processing of earlier valid sectors on the same line.
                // Pascal: StrToIntSafe + range check then 'exit' (not continue) — abort
                // the whole line if any token is out of range, matching Pascal behaviour.
                if (!int.TryParse(token.Trim(), out int curSect)) return;
                if (curSect < 1 || (db.SectorCount > 0 && curSect > db.SectorCount)) return;

                if (lastWarpLaneSect > 0)
                    AddWarpToSector(db, lastWarpLaneSect, curSect);

                lastWarpLaneSect = curSect;
            }
        }

        /// <summary>
        /// Pascal: TModExtractor.AddWarp.
        /// Inserts <paramref name="warp"/> into the Warp[] array of sector
        /// <paramref name="sectorNum"/> in sorted ascending order, ignoring duplicates.
        /// Sets Explored=Calc and Constellation="??? (warp calc only)" if the sector
        /// was previously unexplored (etNo).
        /// </summary>
        private static void AddWarpToSector(ModDatabase db, int sectorNum, int warp)
        {
            var sec = GetOrCreate(db, sectorNum);
            if (sec == null) return;

            // Skip if already present
            for (int i = 0; i < 6; i++)
                if (sec.Warp[i] == warp) return;

            // Find sorted insertion position (ascending; stop at first slot that is
            // empty (0) or holds a value larger than warp).
            int pos = 6; // default: all 6 slots are full with smaller values — no room
            for (int i = 0; i < 6; i++)
            {
                if (sec.Warp[i] == 0 || sec.Warp[i] > warp)
                {
                    pos = i;
                    break;
                }
            }

            if (pos < 6)
            {
                // Shift everything from pos+1 onward up by one to make room
                for (int i = 5; i > pos; i--)
                    sec.Warp[i] = sec.Warp[i - 1];
                sec.Warp[pos] = warp;
            }

            // Pascal: if S.Explored = etNo then set Constellation/Explored/Update
            if (sec.Explored == ExploreType.No)
            {
                sec.Constellation = "??? (warp calc only)";
                sec.Explored = ExploreType.Calc;
                sec.Update = DateTime.Now;
            }

            db.SaveSector(sec);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] AddWarp sector={sectorNum} warp={warp} (FM lane)\n");
        }

        private static SectorData? GetOrCreate(ModDatabase db, int sectorNum)
        {
            if (sectorNum <= 0)
            {
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Reject sector={sectorNum} dbSectorCount={db.SectorCount}\n");
                return null;
            }

            int sectorCount = db.SectorCount;
            if (sectorCount > 0 && sectorCount != int.MaxValue && sectorNum > sectorCount)
            {
                try
                {
                    DataHeader header = db.DBHeader;
                    int previousSectors = header.Sectors;
                    if (sectorNum > previousSectors)
                    {
                        header.Sectors = sectorNum;
                        db.ReplaceHeader(header);
                        db.SaveDatabase();
                        GlobalModules.AutoRecorderDebugLog(
                            $"[AutoRecorder] Auto-grew database sectors old={previousSectors} new={sectorNum}\n");
                    }
                }
                catch (Exception ex)
                {
                    GlobalModules.AutoRecorderDebugLog(
                        $"[AutoRecorder] Failed to auto-grow database for sector={sectorNum} dbSectorCount={sectorCount} error='{ex.Message}'\n");
                }

                sectorCount = db.SectorCount;
                if (sectorCount > 0 && sectorCount != int.MaxValue && sectorNum > sectorCount)
                {
                    GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Reject sector={sectorNum} dbSectorCount={sectorCount}\n");
                    return null;
                }
            }

            var sector = db.GetSector(sectorNum);
            if (sector != null) return sector;

            // Sector not yet in dictionary — create a blank entry and save it.
            sector = new SectorData { Number = sectorNum };
            try { db.SaveSector(sector); } catch { /* ignore range errors for unknown universes */ }
            return sector;
        }

        private readonly struct PortStaticSnapshot
        {
            public PortStaticSnapshot(string name, byte classIndex, string portType, bool hasKnownType)
            {
                Name = name;
                ClassIndex = classIndex;
                PortType = portType;
                HasKnownType = hasKnownType;
            }

            public string Name { get; }
            public byte ClassIndex { get; }
            public string PortType { get; }
            public bool HasKnownType { get; }
            public bool HasKnownClass => ClassIndex >= 1 && ClassIndex <= 8;
            public bool HasKnownName => IsMeaningfulPortName(Name);
            public bool HasIdentity => HasKnownName || HasKnownClass || HasKnownType;
        }

        private static PortStaticSnapshot CapturePortStaticSnapshot(Port? port)
        {
            if (port == null)
                return new PortStaticSnapshot(string.Empty, 0, string.Empty, false);

            bool hasKnownType = port.ClassIndex >= 1 && port.ClassIndex <= 8;
            return new PortStaticSnapshot(
                port.Name ?? string.Empty,
                port.ClassIndex,
                hasKnownType ? FormatPortType(port) : string.Empty,
                hasKnownType);
        }

        private static bool IsMeaningfulPortName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return false;

            string trimmed = name.Trim();
            return !trimmed.Equals("???", StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatPortType(Port port)
            => FormatPortType(
                port.BuyProduct.TryGetValue(ProductType.FuelOre, out bool fuel) && fuel,
                port.BuyProduct.TryGetValue(ProductType.Organics, out bool organics) && organics,
                port.BuyProduct.TryGetValue(ProductType.Equipment, out bool equipment) && equipment);

        private static string FormatPortType(bool buyFuel, bool buyOrganics, bool buyEquipment)
            => string.Create(3, (buyFuel, buyOrganics, buyEquipment), static (chars, state) =>
            {
                chars[0] = state.buyFuel ? 'B' : 'S';
                chars[1] = state.buyOrganics ? 'B' : 'S';
                chars[2] = state.buyEquipment ? 'B' : 'S';
            });

        private static string CleanLogValue(string value)
            => value.Replace("\r", " ").Replace("\n", " ").Trim();

        private static void LogPortStaticCorrection(
            int sectorNum,
            PortStaticSnapshot before,
            string observedName,
            byte observedClass,
            string? observedType,
            string source)
        {
            if (!GlobalModules.DatabaseCorrectionLoggingEnabled)
                return;

            if (!before.HasIdentity)
                return;

            var changes = new List<string>();
            if (before.HasKnownName &&
                IsMeaningfulPortName(observedName) &&
                !string.Equals(before.Name, observedName, StringComparison.OrdinalIgnoreCase))
            {
                changes.Add($"name '{CleanLogValue(before.Name)}' -> '{CleanLogValue(observedName)}'");
            }

            if (before.HasKnownClass &&
                observedClass >= 1 && observedClass <= 8 &&
                before.ClassIndex != observedClass)
            {
                changes.Add($"class {before.ClassIndex} -> {observedClass}");
            }

            if (before.HasKnownType &&
                !string.IsNullOrWhiteSpace(observedType) &&
                observedType.Length == 3 &&
                !string.Equals(before.PortType, observedType, StringComparison.OrdinalIgnoreCase))
            {
                changes.Add($"type {before.PortType} -> {observedType.ToUpperInvariant()}");
            }

            if (changes.Count == 0)
                return;

            GlobalModules.DatabaseCorrectionLog(
                source,
                $"Sector {sectorNum} port static correction: {string.Join("; ", changes)}.");
        }

        private static List<int> CaptureWarpSnapshot(SectorData sector)
            => sector.Warp
                .Where(warp => warp > 0)
                .ToList();

        private static string FormatWarpList(IEnumerable<int> warps)
            => string.Join(" - ", warps);

        private static bool WarpListsMatch(IReadOnlyList<int> left, IReadOnlyList<int> right)
            => left.Count == right.Count &&
               left.OrderBy(warp => warp).SequenceEqual(right.OrderBy(warp => warp));

        private static void LogWarpStaticCorrection(
            int sectorNum,
            SectorData sector,
            IReadOnlyList<int> observedWarps,
            string source)
        {
            if (!GlobalModules.DatabaseCorrectionLoggingEnabled)
                return;

            if (sector.Explored != ExploreType.Yes)
                return;

            var before = CaptureWarpSnapshot(sector);
            if (before.Count == 0 || WarpListsMatch(before, observedWarps))
                return;

            GlobalModules.DatabaseCorrectionLog(
                source,
                $"Sector {sectorNum} warps corrected from [{FormatWarpList(before)}] to [{FormatWarpList(observedWarps)}].");
        }

        private static void LogLandmarkCorrection(string landmarkName, ushort previousSector, int observedSector, string source)
        {
            if (!GlobalModules.DatabaseCorrectionLoggingEnabled)
                return;

            if (previousSector == 0 || previousSector == ushort.MaxValue || previousSector == observedSector)
                return;

            GlobalModules.DatabaseCorrectionLog(
                source,
                $"{landmarkName} corrected from sector {previousSector} to {observedSector}.");
        }

        // ── CIM helpers ────────────────────────────────────────────────────────

        /// <summary>
        /// Parses a port CIM line and updates the port in the sector database.
        /// Pascal: TModExtractor.ProcessCIMLine (dPortCIM branch).
        ///
        /// Format:  "  SSSS [-] AMOUNT PCT% [-] AMOUNT PCT% [-] AMOUNT PCT%"
        /// where the optional '-' before each product amount indicates the port
        /// buys that product (player can sell here).
        ///
        /// Detection: strip '-' and '%', then whitespace-split.
        /// Tokens: sect, ore, pOre, org, pOrg, equip, pEquip
        /// Buy indicators: scan the original token list for '-' before each amount.
        /// </summary>
        private void ParsePortCIMLine(ModDatabase db, string line)
        {
            // Strip '-' and '%' for numeric extraction (Pascal: StringReplace)
            string stripped = line.Replace("-", " ").Replace("%", " ");
            var nums = stripped.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);

            if (nums.Length < 7)
            {
                FinishPortCimBatch(db, "short-line");
                _inPortCIM = false;
                return;
            }

            if (!int.TryParse(nums[0], out int sect) || sect <= 0
                || (db.SectorCount > 0 && sect > db.SectorCount))
            {
                FinishPortCimBatch(db, "invalid-sector");
                _inPortCIM = false;
                return;
            }

            if (!int.TryParse(nums[1], out int ore) || !int.TryParse(nums[2], out int pOre)
             || !int.TryParse(nums[3], out int org) || !int.TryParse(nums[4], out int pOrg)
             || !int.TryParse(nums[5], out int equip) || !int.TryParse(nums[6], out int pEquip))
            {
                FinishPortCimBatch(db, "invalid-values");
                _inPortCIM = false;
                return;
            }

            // Validate percent ranges (Pascal: if < 0 or > 100 → dNone; exit)
            if (ore < 0 || org < 0 || equip < 0
             || pOre < 0 || pOre > 100 || pOrg < 0 || pOrg > 100 || pEquip < 0 || pEquip > 100)
            {
                FinishPortCimBatch(db, "invalid-percent");
                _inPortCIM = false;
                return;
            }

            _currentPortCimSectors.Add(sect);

            var sector = GetOrCreate(db, sect);
            if (sector == null) return;

            PortStaticSnapshot? beforePort = GlobalModules.DatabaseCorrectionLoggingEnabled
                ? CapturePortStaticSnapshot(sector.SectorPort)
                : null;
            sector.SectorPort ??= new Port();

            sector.SectorPort.ProductAmount[ProductType.FuelOre] = (ushort)Math.Min(ore, ushort.MaxValue);
            sector.SectorPort.ProductAmount[ProductType.Organics] = (ushort)Math.Min(org, ushort.MaxValue);
            sector.SectorPort.ProductAmount[ProductType.Equipment] = (ushort)Math.Min(equip, ushort.MaxValue);
            sector.SectorPort.ProductPercent[ProductType.FuelOre] = (byte)pOre;
            sector.SectorPort.ProductPercent[ProductType.Organics] = (byte)pOrg;
            sector.SectorPort.ProductPercent[ProductType.Equipment] = (byte)pEquip;
            sector.SectorPort.Update = DateTime.Now;

            // Buy/sell detection: detect via token scanning. A CIM report is a
            // fresh observation, so let it correct stale port class/type while
            // preserving any known port name. TW can emit buys as either
            // "- 2270" or "-65530", so consume both marker forms.
            var origTokens = line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            bool buyFuel = false, buyOrg = false, buyEquip = false;

            int ti = 1; // skip sector number token
            buyFuel = ConsumePortCimBuyMarker(origTokens, ref ti);
            ti += 2; // skip amount + percent% tokens
            buyOrg = ConsumePortCimBuyMarker(origTokens, ref ti);
            ti += 2; // skip amount + percent%
            buyEquip = ConsumePortCimBuyMarker(origTokens, ref ti);

            byte observedClass = DeriveClassIndex(buyFuel, buyOrg, buyEquip);
            string observedType = FormatPortType(buyFuel, buyOrg, buyEquip);
            if (beforePort.HasValue)
            {
                LogPortStaticCorrection(
                    sect,
                    beforePort.Value,
                    sector.SectorPort.Name,
                    observedClass,
                    observedType,
                    "AutoRecorder.PortCIM");
            }

            sector.SectorPort.BuyProduct[ProductType.FuelOre] = buyFuel;
            sector.SectorPort.BuyProduct[ProductType.Organics] = buyOrg;
            sector.SectorPort.BuyProduct[ProductType.Equipment] = buyEquip;
            sector.SectorPort.ClassIndex = observedClass;
            if (string.IsNullOrEmpty(sector.SectorPort.Name))
                sector.SectorPort.Name = "???";

            // Pascal: if (S.Explored = etNo) → mark as calc-explored
            if (sector.Explored == ExploreType.No)
            {
                sector.Constellation = "??? (port data/calc only)";
                sector.Explored = ExploreType.Calc;
                sector.Update = DateTime.Now;
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Port CIM: sector={sect} ore={ore}/{pOre}% org={org}/{pOrg}% equip={equip}/{pEquip}%\n");
        }

        private static bool ConsumePortCimBuyMarker(string[] tokens, ref int tokenIndex)
        {
            if (tokenIndex >= tokens.Length || !tokens[tokenIndex].StartsWith("-", StringComparison.Ordinal))
                return false;

            if (tokens[tokenIndex] == "-")
                tokenIndex++;

            return true;
        }

        private void BeginPortCimBatch()
        {
            _portCimBatchActive = true;
            _currentPortCimSectors.Clear();
        }

        private void FinishPortCimBatch(ModDatabase db, string reason)
        {
            if (!_portCimBatchActive)
                return;

            _portCimBatchActive = false;

            if (_currentPortCimSectors.Count == 0)
            {
                GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Port CIM complete: seen=0 reason={reason}\n");
                _currentPortCimSectors.Clear();
                return;
            }

            int clearedFighterSectors = 0;
            int removedFigMarkers = 0;

            int maxSector = db.SectorCount == int.MaxValue ? db.MaxSectorSeen : db.SectorCount;
            for (int sectorNum = 1; sectorNum <= maxSector; sectorNum++)
            {
                if (_currentPortCimSectors.Contains(sectorNum))
                    continue;

                var sector = db.GetSector(sectorNum);
                if (sector?.SectorPort == null)
                    continue;

                int classIndex = sector.SectorPort.ClassIndex;
                if (classIndex <= 0 || classIndex >= 9)
                    continue;

                bool hadFigMarker = IsSectorVarTrue(db, sectorNum, "FIGSEC");
                bool hadFriendlyFighters =
                    sector.Fighters.Quantity > 0 &&
                    (sector.Fighters.Owner.Equals("yours", StringComparison.OrdinalIgnoreCase) ||
                     sector.Fighters.Owner.Equals("belong to your Corp", StringComparison.OrdinalIgnoreCase));

                if (!hadFigMarker && !hadFriendlyFighters)
                    continue;

                if (hadFriendlyFighters)
                {
                    sector.Fighters.Quantity = 0;
                    sector.Fighters.Owner = string.Empty;
                    sector.Fighters.FigType = FighterType.None;
                    db.SaveSector(sector);
                    clearedFighterSectors++;
                }

                if (hadFigMarker)
                {
                    RemoveFigMarker(db, sectorNum);
                    removedFigMarkers++;
                }
            }

            GlobalModules.AutoRecorderDebugLog(
                $"[AutoRecorder] Port CIM complete: seen={_currentPortCimSectors.Count} clearedFriendlyFigSectors={clearedFighterSectors} removedFigMarkers={removedFigMarkers} reason={reason}\n");
            _currentPortCimSectors.Clear();
        }

        /// <summary>
        /// Parses a warp CIM line and updates the sector's Warp[] array.
        /// Pascal: TModExtractor.ProcessCIMLine (dWarpCIM branch).
        ///
        /// Format: "SSSS W1 W2 W3 W4 W5 W6"   (up to 6 warp destinations, 0 = none)
        /// </summary>
        private void ParseWarpCIMLine(ModDatabase db, string line)
        {
            var tokens = line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);

            if (tokens.Length < 1) { _inWarpCIM = false; return; }

            if (!int.TryParse(tokens[0], out int sect) || sect <= 0
                || (db.SectorCount > 0 && sect > db.SectorCount))
            {
                _inWarpCIM = false;
                return;
            }

            var sector = GetOrCreate(db, sect);
            if (sector == null) { _inWarpCIM = false; return; }

            var observedWarps = new List<int>();
            for (int i = 0; i < 6; i++)
            {
                if (i + 1 < tokens.Length && int.TryParse(tokens[i + 1], out int w))
                {
                    // Pascal: if X < 0 or X > Sectors → dNone; exit
                    if (w < 0 || (db.SectorCount > 0 && w > db.SectorCount))
                    {
                        _inWarpCIM = false;
                        return;
                    }
                    if (w > 0)
                        observedWarps.Add(w);
                }
            }

            LogWarpStaticCorrection(sect, sector, observedWarps, "AutoRecorder.WarpCIM");

            for (int i = 0; i < 6; i++)
                sector.Warp[i] = i < observedWarps.Count ? observedWarps[i] : 0;
            sector.WarpCount = (byte)Math.Min(observedWarps.Count, 6);

            if (sector.Explored == ExploreType.No)
            {
                sector.Constellation = "??? (warp calc only)";
                sector.Explored = ExploreType.Calc;
                sector.Update = DateTime.Now;
            }

            db.SaveSector(sector);
            GlobalModules.AutoRecorderDebugLog($"[AutoRecorder] Warp CIM: sector={sect} warps={string.Join(",", sector.Warp.Where(w => w > 0))}\n");
        }
    }
}
