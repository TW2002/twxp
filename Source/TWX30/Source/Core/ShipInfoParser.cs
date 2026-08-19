using System.Text.RegularExpressions;

namespace TWXProxy.Core;

/// <summary>
/// Stateful line-by-line parser that extracts ship/trader status from the
/// two TW2002 display commands:
///
///   "/"  — four single lines, fields delimited by the Latin-1 0xB3 "³" byte.
///   "I"  — multi-line Info block between "&lt;Info&gt;" and the next Command prompt.
///
/// Feed every ANSI-stripped line from the server through <see cref="FeedLine"/>.
/// When a complete update has been parsed the <see cref="Updated"/> event fires
/// with the current <see cref="ShipStatus"/> snapshot.
/// </summary>
public class ShipInfoParser
{
    // ── State ──────────────────────────────────────────────────────────────
    private ShipStatus _s = new();
    private ShipStatus? _infoBlockSnapshot;

    // Multi-line "I" block tracking
    private bool _inInfoBlock;
    private bool _infoBlockSawTransWarpSection;
    private bool _infoBlockSawTransWarp1;
    private bool _infoBlockSawTransWarp2;

    // "/" one-liner: the server sends 4 lines that each look like
    //   " Sect 12545³Turns 25,000³..."
    // We recognise them by the presence of the ³ separator.
    private const char Sep = '\u00B3';  // Latin-1 0xB3

    // ── Events ────────────────────────────────────────────────────────────

    /// <summary>
    /// Fired after a complete "/" or "I" response has been parsed.
    /// The argument is the live <see cref="ShipStatus"/> instance (not a copy).
    /// </summary>
    public event Action<ShipStatus>? Updated;

    /// <summary>
    /// Returns a clone of the last stable parsed ship status.
    /// During an in-progress info block this intentionally stays on the
    /// previously committed snapshot until the block completes.
    /// </summary>
    public ShipStatus CurrentStatus => CloneStatus(_s);

    // ── Public API ─────────────────────────────────────────────────────────

    /// <summary>
    /// Seeds the parser with a previously known stable status. This prevents
    /// partial live deltas from publishing a blank baseline before the next
    /// authoritative "/" or "I" refresh arrives.
    /// </summary>
    public void SeedStatus(ShipStatus status)
    {
        _s = CloneStatus(status);
        _infoBlockSnapshot = null;
        _inInfoBlock = false;
        _infoBlockSawTransWarpSection = false;
        _infoBlockSawTransWarp1 = false;
        _infoBlockSawTransWarp2 = false;
    }

    /// <summary>
    /// Feed one ANSI-stripped line from the server.
    /// Call this for every line (complete or partial prompt) received.
    /// </summary>
    public void FeedLine(string line)
    {
        if (string.IsNullOrEmpty(line)) return;

        string trimmed = line.Trim();
        if (ShouldIgnoreStatusCommLine(trimmed))
            return;

        // ── "I" block delimiters ──────────────────────────────────────────
        if (trimmed.Equals("<Info>", StringComparison.OrdinalIgnoreCase))
        {
            _inInfoBlock = true;
            _infoBlockSawTransWarpSection = false;
            _infoBlockSawTransWarp1 = false;
            _infoBlockSawTransWarp2 = false;
            _infoBlockSnapshot = CloneStatus(_s);
            ResetInfoBlockShipSnapshot(_infoBlockSnapshot);
            return;
        }

        if (_inInfoBlock && IsInfoBlockTerminator(trimmed))
        {
            if (_infoBlockSnapshot != null)
            {
                FinalizeInfoBlockTranswarpState(_infoBlockSnapshot);
                _s = _infoBlockSnapshot;
                Updated?.Invoke(_s);
            }

            _infoBlockSnapshot = null;
            _inInfoBlock = false;
            return;
        }

        if (_inInfoBlock)
        {
            if (trimmed.Length == 0)
                return;

            if (TryParseIncrementalInfoLine(trimmed))
                return;

            // The live "I" display can contain blank/odd formatting or server
            // noise between known info lines. Stay in info mode until the next
            // command prompt instead of discarding the entire snapshot.
            return;
        }

        // ── "/" one-liner lines (contain the ³ separator) ─────────────────
        if (line.Contains(Sep))
        {
            bool parsed = ParseSlashLine(line);
            if (parsed)
            {
                // Older servers often ended the "/" block on a line that contained both
                // "Aln " and "Exp ". Newer/wrapped displays can split alignment and
                // experience across separate lines, with the last line carrying
                // "Exp ...", "Corp ...", and "Ship ...". Treat either layout as a
                // complete slash-status update.
                if (IsSlashTerminalLine(line))
                    Updated?.Invoke(_s);
            }
            return;
        }

        // ── Fighter-drop confirmation ─────────────────────────────────────
        // "Done. You have 837 fighter(s) in close support."
        {
            var m = _rxDoneFighters.Match(trimmed);
            if (m.Success)
            {
                _s.Fighters = ParseInt(m.Groups[1].Value);
                Updated?.Invoke(_s);
                return;
            }
        }

        // ── Live turn-count lines ────────────────────────────────────────
        // "You have 24,991 turns remaining."
        // "You have 1 turn remaining."
        {
            var m = _rxTurnsRemaining.Match(trimmed);
            if (m.Success)
            {
                _s.Turns = ParseInt(m.Groups[1].Value);
                _s.UnlimitedGame = false;
                Updated?.Invoke(_s);
                return;
            }
        }

        {
            var m = _rxTurnsDeducted.Match(trimmed);
            if (m.Success)
            {
                _s.Turns = ParseInt(m.Groups[1].Value);
                _s.UnlimitedGame = false;
                Updated?.Invoke(_s);
                return;
            }
        }

        // ── Live credits/holds lines seen during trading ──────────────────
        if (ShipStatusTextParser.TryParseLiveCreditsLine(trimmed, out long credits, out int? emptyHolds))
        {
            _s.Credits = credits;
            if (emptyHolds.HasValue)
                _s.HoldsEmpty = emptyHolds.Value;
            Updated?.Invoke(_s);
        }
    }

    /// <summary>
    /// Applies a partial live ship-status update sourced from parser state outside
    /// the dedicated "/" and "I" ship info displays.
    /// </summary>
    public void ApplyDelta(ShipStatusDelta delta)
    {
        if (delta == null || !delta.HasChanges())
            return;

        delta.ApplyTo(_s);
        Updated?.Invoke(_s);
    }

    // ── "/" one-liner parser ───────────────────────────────────────────────

    private bool ParseSlashLine(string line)
    {
        // Split on ³ and parse each "Key value" token
        var tokens = line.Split(Sep, StringSplitOptions.RemoveEmptyEntries);
        bool any = false;
        bool sawSlashHoldsTotal = false;
        bool sawSlashFuelOre = false;
        bool sawSlashOrganics = false;
        bool sawSlashEquipment = false;
        bool sawSlashColonists = false;

        foreach (var raw in tokens)
        {
            string tok = raw.Trim();
            if (tok.Length == 0) continue;

            // Every token is "Label value[,value…]" with a single space separator
            // after the label keyword.  We match by the known keyword prefix.
            any = true;

            if (TrySlash(tok, "Sect ", out long sect)) _s.CurrentSector = (int)sect;
            else if (TrySlash(tok, "Turns ", out long turns))
            {
                _s.Turns = (int)turns;
                if (turns > 0)
                    _s.UnlimitedGame = false;
            }
            else if (TrySlash(tok, "Creds ", out long creds)) _s.Credits = creds;
            else if (TrySlash(tok, "Figs ", out long figs)) _s.Fighters = (int)figs;
            else if (TrySlash(tok, "Shlds ", out long shlds)) _s.Shields = (int)shlds;
            else if (TrySlash(tok, "Hlds ", out long hlds))
            {
                _s.TotalHolds = (int)hlds;
                sawSlashHoldsTotal = true;
            }
            else if (TrySlash(tok, "Ore ", out long ore))
            {
                _s.FuelOre = (int)ore;
                sawSlashFuelOre = true;
            }
            else if (TrySlash(tok, "Org ", out long org))
            {
                _s.Organics = (int)org;
                sawSlashOrganics = true;
            }
            else if (TrySlash(tok, "Equ ", out long equ))
            {
                _s.Equipment = (int)equ;
                sawSlashEquipment = true;
            }
            else if (TrySlash(tok, "Col ", out long col))
            {
                _s.Colonists = (int)col;
                sawSlashColonists = true;
            }
            else if (TrySlash(tok, "Phot ", out long phot)) _s.Photons = (int)phot;
            else if (TrySlash(tok, "Armd ", out long armd)) _s.ArmidMines = (int)armd;
            else if (TrySlash(tok, "Lmpt ", out long lmpt)) _s.LimpetMines = (int)lmpt;
            else if (TrySlash(tok, "GTorp ", out long gtorp)) _s.GenesisTorps = (int)gtorp;
            else if (TrySlash(tok, "TWarp ", out string twarp)) ApplySlashTranswarpType(twarp);
            else if (TrySlash(tok, "Clks ", out long clks)) _s.Cloaks = (int)clks;
            else if (TrySlash(tok, "Beacns ", out long beacns)) _s.Beacons = (int)beacns;
            else if (TrySlash(tok, "AtmDt ", out long atmdt)) _s.AtomicDet = (int)atmdt;
            else if (TrySlash(tok, "Crbo ", out long crbo)) _s.Corbomite = (int)crbo;
            else if (TrySlash(tok, "EPrb ", out long eprb)) _s.EtherProbes = (int)eprb;
            else if (TrySlash(tok, "MDis ", out long mdis)) _s.MineDisruptors = (int)mdis;
            else if (TrySlash(tok, "PsPrb ", out string psp)) _s.PsychProbe = IsBoolYes(psp);
            else if (TrySlash(tok, "PlScn ", out string plsn)) _s.PlanetScanner = IsBoolYes(plsn);
            else if (TrySlash(tok, "LRS ", out string lrs)) _s.LRSType = NormalizeLongRangeScannerType(lrs);
            else if (TrySlash(tok, "Aln ", out long aln)) _s.Alignment = aln;
            else if (TrySlash(tok, "Exp ", out long exp)) _s.Experience = exp;
            else if (TrySlash(tok, "Corp ", out long corp)) _s.Corp = (int)corp;
            else if (TrySlash(tok, "Ship ", out string shipInfo))
            {
                string[] shipParts = shipInfo.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                if (shipParts.Length > 0 && int.TryParse(shipParts[0], out int shipNumber))
                    _s.ShipNumber = shipNumber;
                if (shipParts.Length > 1)
                    _s.ShipClass = shipParts[1].Trim();
            }
        }

        if (_s.TotalHolds > 0 &&
            (sawSlashHoldsTotal || sawSlashFuelOre || sawSlashOrganics || sawSlashEquipment || sawSlashColonists))
        {
            int usedHolds = _s.FuelOre + _s.Organics + _s.Equipment + _s.Colonists;
            _s.HoldsEmpty = Math.Max(0, _s.TotalHolds - usedHolds);
        }

        return any;
    }

    private static bool IsSlashTerminalLine(string line)
    {
        if (string.IsNullOrEmpty(line))
            return false;

        return (line.Contains("Aln ", StringComparison.Ordinal) && line.Contains("Exp ", StringComparison.Ordinal)) ||
               line.Contains("Ship ", StringComparison.Ordinal) ||
               (line.Contains("Exp ", StringComparison.Ordinal) && line.Contains("Corp ", StringComparison.Ordinal));
    }

    // ── "I" multi-line parser ─────────────────────────────────────────────

    // "Done. You have 837 fighter(s) in close support."
    private static readonly Regex _rxDoneFighters = new(
        @"^Done\.\s+You have ([\d,]+) fighter",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex _rxTurnsRemaining = new(
        @"^You have ([\d,]+) turns? remaining\.?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex _rxTurnsDeducted = new(
        @"^(?:One|[\d,]+)\s+turns?\s+deducted,\s+([\d,]+)\s+turns?\s+left\.?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex _rxRankExp = new(
        @"([\d,]+)\s+points?,\s+Alignment=([\d,]+)",
        RegexOptions.Compiled);

    private static readonly Regex _rxTotalHolds = new(
        @"(\d[\d,]*)\s*-\s*(.*)$",
        RegexOptions.Compiled);

    private static readonly Regex _rxHoldComponent = new(
        @"(Fuel Ore|Organics|Equipment|Colonists|Empty)\s*=\s*([\d,]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex _rxTwoFieldLine = new(
        // Matches two "Label: value" pairs on the same line separated by spaces
        @"^(.+?)\s*:\s*(\S+)\s{3,}(.+?)\s*:\s*(\S+)\s*$",
        RegexOptions.Compiled);

    private bool TryParseIncrementalInfoLine(string line)
    {
        if (!LooksLikeInfoLine(line))
            return false;

        ParseInfoLine(line);
        return true;
    }

    private void ParseInfoLine(string line)
    {
        ShipStatus target = _infoBlockSnapshot ?? _s;

        // Key: value lines — split on the first ':'
        int colon = line.IndexOf(':');
        if (colon <= 0)
        {
            CheckTransWarpHeader(line);
            ParseCorpLine(target, line);
            return;
        }

        string key = line[..colon].Trim();
        string val = line[(colon + 1)..].Trim();

        switch (key)
        {
            case "Trader Name":
                {
                    // val is "Rank Name" — we only want the last word (the name, not the rank)
                    var parts = val.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    target.TraderName = parts.Length > 0 ? parts[^1] : val;
                    break;
                }

            case "Rank and Exp":
                {
                    var m = _rxRankExp.Match(val);
                    if (m.Success)
                    {
                        target.Experience = ParseLong(m.Groups[1].Value);
                        target.Alignment = ParseLong(m.Groups[2].Value);
                        // Optional alignment text after the number
                        string rest = val[(m.Index + m.Length)..].Trim();
                        if (!string.IsNullOrEmpty(rest)) target.AlignText = rest;
                    }
                    break;
                }

            case "Times Blown Up":
                target.TimesBlownUp = ParseInt(val);
                break;

            // "Corp           # 2," — colon split gives key="Corp           # 2,"
            // …but actually the format is "Corp           # 2," with '#' not ':'
            // We catch it below in the '#' branch.

            case "Ship Name":
                target.ShipName = val;
                break;

            case "Ship Info":
                target.ShipType = val;
                if (string.IsNullOrWhiteSpace(target.ShipClass))
                    target.ShipClass = val;
                break;

            case "Turns to Warp":
                target.TurnsPerWarp = ParseInt(val);
                break;

            case "Current Sector":
                target.CurrentSector = ParseInt(val);
                break;

            case "Turns left":
                if (val.Equals("Unlimited", StringComparison.OrdinalIgnoreCase))
                {
                    target.Turns = 0;
                    target.UnlimitedGame = true;
                }
                else
                {
                    target.Turns = ParseInt(val);
                    target.UnlimitedGame = false;
                }
                break;

            case "Total Holds":
                {
                    var m = _rxTotalHolds.Match(val);
                    if (m.Success)
                    {
                        target.TotalHolds = ParseInt(m.Groups[1].Value);
                        ParseHoldComponents(target, m.Groups[2].Value);

                        if (target.HoldsEmpty <= 0)
                        {
                            int empty = target.TotalHolds - target.FuelOre - target.Organics - target.Equipment - target.Colonists;
                            target.HoldsEmpty = empty < 0 ? 0 : empty;
                        }
                    }
                    else
                    {
                        target.TotalHolds = ParseInt(val.Split('-')[0].Trim());
                    }
                    break;
                }

            case "Fighters":
                target.Fighters = ParseInt(val);
                break;

            case "Shield points":
                target.Shields = ParseInt(val.Split('+')[0]); // strip "+X regeneration"
                break;

            // Two-value lines — handled below after the switch
            case var k when k.StartsWith("Armid Mines"):
                target.ArmidMines = ParseFirstNum(val);
                target.LimpetMines = ParseSecondField(line, "Limpet Mines");
                break;

            case var k when k.StartsWith("Photon Missiles"):
                target.Photons = ParseFirstNum(val);
                target.GenesisTorps = ParseSecondField(line, "Genesis Torps");
                break;

            case "Genesis Torps":
                target.GenesisTorps = ParseInt(val);
                break;

            case var k when k.StartsWith("Atomic Detn"):
                target.AtomicDet = ParseFirstNum(val);
                target.Corbomite = ParseSecondField(line, "Corbomite Level");
                break;

            case "Ether Probes":
                target.EtherProbes = ParseInt(val);
                break;

            case var k when k.StartsWith("Cloaking Device"):
                target.Cloaks = ParseFirstNum(val);
                target.EtherProbes = ParseSecondField(line, "Ether Probes");
                break;

            case "Mine Disruptors":
                target.MineDisruptors = ParseInt(val);
                break;

            case var k when k.StartsWith("Navigation Beacons") || k.Equals("Beacons"):
                target.Beacons = ParseFirstNum(val);
                break;

            case "Planet Scanner":
                target.PlanetScanner = IsBoolYes(val);
                break;

            case "LongRange Scan":
                target.LRSType = NormalizeLongRangeScannerType(val);
                break;

            case var k when k.Contains("Type 1 Jump"):
                _infoBlockSawTransWarpSection = true;
                _infoBlockSawTransWarp1 = true;
                target.HasTransWarp1 = true;
                target.TransWarp1 = ParseInt(val.Split(' ')[0]);
                break;

            case var k when k.Contains("Type 2 Jump"):
                _infoBlockSawTransWarpSection = true;
                _infoBlockSawTransWarp2 = true;
                target.HasTransWarp2 = true;
                target.TransWarp2 = ParseInt(val.Split(' ')[0]);
                break;

            case var k when k.StartsWith("Interdictor"):
                target.Interdictor = IsBoolYes(val);
                break;

            case "Credits":
                target.Credits = ParseLong(val);
                break;
        }

        ParseCorpLine(target, line);
    }

    private void CheckTransWarpHeader(string line)
    {
        if (line.StartsWith("TransWarp Power", StringComparison.Ordinal))
            _infoBlockSawTransWarpSection = true;
    }

    private void FinalizeInfoBlockTranswarpState(ShipStatus target)
    {
        if (!_infoBlockSawTransWarpSection)
        {
            target.HasTransWarp1 = false;
            target.HasTransWarp2 = false;
            target.TransWarp1 = 0;
            target.TransWarp2 = 0;
            return;
        }

        if (!_infoBlockSawTransWarp1)
        {
            target.HasTransWarp1 = false;
            target.TransWarp1 = 0;
        }

        if (!_infoBlockSawTransWarp2)
        {
            target.HasTransWarp2 = false;
            target.TransWarp2 = 0;
        }
    }

    private static void ResetInfoBlockShipSnapshot(ShipStatus target)
    {
        // A full "I" scan is authoritative for the current ship. Clear ship-local
        // inventory/equipment fields up front so omitted lines on the new ship do
        // not leave stale values behind from the previous hull.
        target.TotalHolds = 0;
        target.FuelOre = 0;
        target.Organics = 0;
        target.Equipment = 0;
        target.Colonists = 0;
        target.HoldsEmpty = 0;

        target.Fighters = 0;
        target.Shields = 0;
        target.Photons = 0;
        target.ArmidMines = 0;
        target.LimpetMines = 0;
        target.GenesisTorps = 0;
        target.AtomicDet = 0;
        target.Corbomite = 0;

        target.Cloaks = 0;
        target.Beacons = 0;
        target.EtherProbes = 0;
        target.MineDisruptors = 0;
        target.PsychProbe = false;
        target.PlanetScanner = false;
        target.LRSType = string.Empty;
        target.HasTransWarp1 = false;
        target.HasTransWarp2 = false;
        target.TransWarp1 = 0;
        target.TransWarp2 = 0;
        target.Interdictor = false;
    }

    private static bool IsInfoBlockTerminator(string line)
    {
        return line.StartsWith("Command [TL=", StringComparison.Ordinal) ||
               line.StartsWith("Computer command [TL=", StringComparison.Ordinal);
    }

    private static string NormalizeLongRangeScannerType(string value)
    {
        string normalized = value.Trim();
        if (string.IsNullOrEmpty(normalized))
            return string.Empty;

        if (normalized.Contains("Holo", StringComparison.OrdinalIgnoreCase))
            return "Holo";

        if (normalized.Equals("None", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("No", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("No LRS", StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        return normalized;
    }

    private static bool ShouldIgnoreStatusCommLine(string line)
    {
        if (string.IsNullOrEmpty(line))
            return false;

        return line.StartsWith("R ", StringComparison.Ordinal) ||
               line.StartsWith("F ", StringComparison.Ordinal) ||
               line.StartsWith("P ", StringComparison.Ordinal) ||
               line.StartsWith("'", StringComparison.Ordinal) ||
               line.StartsWith("`", StringComparison.Ordinal);
    }

    private static bool LooksLikeInfoLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return false;

        return line.StartsWith("Trader Name", StringComparison.Ordinal) ||
               line.StartsWith("Rank and Exp", StringComparison.Ordinal) ||
               line.StartsWith("Times Blown Up", StringComparison.Ordinal) ||
               line.StartsWith("Corp", StringComparison.Ordinal) ||
               line.StartsWith("Ship Name", StringComparison.Ordinal) ||
               line.StartsWith("Ship Info", StringComparison.Ordinal) ||
               line.StartsWith("Date Built", StringComparison.Ordinal) ||
               line.StartsWith("Turns to Warp", StringComparison.Ordinal) ||
               line.StartsWith("Current Sector", StringComparison.Ordinal) ||
               line.StartsWith("Turns left", StringComparison.Ordinal) ||
               line.StartsWith("Total Holds", StringComparison.Ordinal) ||
               line.StartsWith("Fighters", StringComparison.Ordinal) ||
               line.StartsWith("Shield points", StringComparison.Ordinal) ||
               line.StartsWith("Armid Mines", StringComparison.Ordinal) ||
               line.StartsWith("Photon Missiles", StringComparison.Ordinal) ||
               line.StartsWith("Genesis Torps", StringComparison.Ordinal) ||
               line.StartsWith("Atomic Detn", StringComparison.Ordinal) ||
               line.StartsWith("Ether Probes", StringComparison.Ordinal) ||
               line.StartsWith("Cloaking Device", StringComparison.Ordinal) ||
               line.StartsWith("Mine Disruptors", StringComparison.Ordinal) ||
               line.StartsWith("Navigation Beacons", StringComparison.Ordinal) ||
               line.StartsWith("Beacons", StringComparison.Ordinal) ||
               line.StartsWith("Planet Scanner", StringComparison.Ordinal) ||
               line.StartsWith("LongRange Scan", StringComparison.Ordinal) ||
               line.StartsWith("TransWarp Power", StringComparison.Ordinal) ||
               line.Contains("Type 1 Jump", StringComparison.Ordinal) ||
               line.Contains("Type 2 Jump", StringComparison.Ordinal) ||
               line.StartsWith("Interdictor", StringComparison.Ordinal) ||
               line.StartsWith("Credits", StringComparison.Ordinal);
    }

    private static void ParseHoldComponents(ShipStatus target, string value)
    {
        foreach (Match match in _rxHoldComponent.Matches(value))
        {
            if (!match.Success)
                continue;

            int amount = ParseInt(match.Groups[2].Value);
            switch (match.Groups[1].Value.Trim().ToUpperInvariant())
            {
                case "FUEL ORE":
                    target.FuelOre = amount;
                    break;
                case "ORGANICS":
                    target.Organics = amount;
                    break;
                case "EQUIPMENT":
                    target.Equipment = amount;
                    break;
                case "COLONISTS":
                    target.Colonists = amount;
                    break;
                case "EMPTY":
                    target.HoldsEmpty = amount;
                    break;
            }
        }
    }

    private static void ParseCorpLine(ShipStatus target, string line)
    {
        if (!line.Contains("Corp", StringComparison.Ordinal) || !line.Contains('#', StringComparison.Ordinal))
            return;

        int hash = line.IndexOf('#');
        if (hash < 0 || hash >= line.Length - 1)
            return;

        string corpVal = line[(hash + 1)..].Trim();
        int comma = corpVal.IndexOf(',');
        if (comma >= 0)
            corpVal = corpVal[..comma];

        if (int.TryParse(corpVal.Trim(), out int corpNumber))
            target.Corp = corpNumber;
    }

    /// <summary>
    /// Extracts a labelled value from lines that pack two fields,
    /// e.g. "Armid Mines  T1: 1                       Limpet Mines T2: 250"
    /// Returns 0 if the label is not found.
    /// </summary>
    private static int ParseSecondField(string line, string label)
    {
        int idx = line.IndexOf(label, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return 0;
        int c = line.IndexOf(':', idx);
        if (c < 0) return 0;
        string rest = line[(c + 1)..].Trim().Split(' ')[0];
        return ParseInt(rest);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static bool TrySlash(string token, string prefix, out long value)
    {
        value = 0;
        if (!token.StartsWith(prefix, StringComparison.Ordinal)) return false;
        string rest = token[prefix.Length..].Replace(",", "").Trim();
        return long.TryParse(rest, out value);
    }

    private static bool TrySlash(string token, string prefix, out string value)
    {
        value = string.Empty;
        if (!token.StartsWith(prefix, StringComparison.Ordinal)) return false;
        value = token[prefix.Length..].Trim();
        return true;
    }

    private void ApplySlashTranswarpType(string value)
    {
        string normalized = value.Trim();
        if (normalized.Equals("No", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("0", StringComparison.OrdinalIgnoreCase))
        {
            _s.HasTransWarp1 = false;
            _s.HasTransWarp2 = false;
            _s.TransWarp1 = 0;
            _s.TransWarp2 = 0;
            return;
        }

        if (normalized.Equals("1", StringComparison.OrdinalIgnoreCase))
        {
            _s.HasTransWarp1 = true;
            _s.HasTransWarp2 = false;
            _s.TransWarp1 = Math.Max(_s.TransWarp1, 1);
            _s.TransWarp2 = 0;
            return;
        }

        if (normalized.Equals("2", StringComparison.OrdinalIgnoreCase))
        {
            _s.HasTransWarp1 = true;
            _s.HasTransWarp2 = true;
            _s.TransWarp1 = Math.Max(_s.TransWarp1, 1);
            _s.TransWarp2 = Math.Max(_s.TransWarp2, 1);
        }
    }

    private static bool IsBoolYes(string s) =>
        s.Equals("Yes", StringComparison.OrdinalIgnoreCase) ||
        s.Equals("Y", StringComparison.OrdinalIgnoreCase);

    private static int ParseInt(string s)
    {
        if (int.TryParse(s.Replace(",", "").Trim(), out int v)) return v;
        return 0;
    }

    /// <summary>Extracts the first numeric (optionally comma-separated) token from a string.
    /// Used for compound lines like "5     Limpet Mines T2:      10" where we want just 5.</summary>
    private static int ParseFirstNum(string s)
    {
        var first = s.TrimStart().Split(new char[] { ' ', '\t' }, 2, StringSplitOptions.RemoveEmptyEntries);
        return first.Length > 0 ? ParseInt(first[0]) : 0;
    }

    private static long ParseLong(string s)
    {
        if (long.TryParse(s.Replace(",", "").Trim(), out long v)) return v;
        return 0;
    }

    private static ShipStatus CloneStatus(ShipStatus status) => new()
    {
        TraderName = status.TraderName,
        Experience = status.Experience,
        Alignment = status.Alignment,
        AlignText = status.AlignText,
        TimesBlownUp = status.TimesBlownUp,
        Corp = status.Corp,
        ShipName = status.ShipName,
        ShipType = status.ShipType,
        ShipNumber = status.ShipNumber,
        ShipClass = status.ShipClass,
        CurrentSector = status.CurrentSector,
        Turns = status.Turns,
        UnlimitedGame = status.UnlimitedGame,
        TurnsPerWarp = status.TurnsPerWarp,
        TotalHolds = status.TotalHolds,
        FuelOre = status.FuelOre,
        Organics = status.Organics,
        Equipment = status.Equipment,
        Colonists = status.Colonists,
        HoldsEmpty = status.HoldsEmpty,
        Fighters = status.Fighters,
        Shields = status.Shields,
        Photons = status.Photons,
        ArmidMines = status.ArmidMines,
        LimpetMines = status.LimpetMines,
        GenesisTorps = status.GenesisTorps,
        AtomicDet = status.AtomicDet,
        Corbomite = status.Corbomite,
        Cloaks = status.Cloaks,
        Beacons = status.Beacons,
        EtherProbes = status.EtherProbes,
        MineDisruptors = status.MineDisruptors,
        PsychProbe = status.PsychProbe,
        PlanetScanner = status.PlanetScanner,
        LRSType = status.LRSType,
        HasTransWarp1 = status.HasTransWarp1,
        HasTransWarp2 = status.HasTransWarp2,
        TransWarp1 = status.TransWarp1,
        TransWarp2 = status.TransWarp2,
        Interdictor = status.Interdictor,
        Credits = status.Credits
    };
}
