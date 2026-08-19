namespace TWXProxy.Core;

/// <summary>
/// Framework-agnostic snapshot of the local player's ship statistics.
/// Populated by <see cref="ShipInfoParser"/> from the game server's
/// "/" (one-liner) and "I" (full info block) command responses.
/// </summary>
public class ShipStatus
{
    // ── Trader ────────────────────────────────────────────────────────────
    public string TraderName { get; set; } = string.Empty;
    public long Experience { get; set; }
    public long Alignment { get; set; }
    public string AlignText { get; set; } = string.Empty; // "Saintly", "Evil" etc.
    public int TimesBlownUp { get; set; }
    public int Corp { get; set; }

    // ── Ship ──────────────────────────────────────────────────────────────
    public string ShipName { get; set; } = string.Empty;
    public string ShipType { get; set; } = string.Empty; // "Attack Ship" etc.
    public int ShipNumber { get; set; }
    public string ShipClass { get; set; } = string.Empty;

    // ── Navigation ────────────────────────────────────────────────────────
    public int CurrentSector { get; set; }
    public int Turns { get; set; }
    public bool UnlimitedGame { get; set; }
    public int TurnsPerWarp { get; set; }

    // ── Cargo ─────────────────────────────────────────────────────────────
    public int TotalHolds { get; set; }
    public int FuelOre { get; set; }
    public int Organics { get; set; }
    public int Equipment { get; set; }
    public int Colonists { get; set; }
    public int HoldsEmpty { get; set; }

    // ── Combat ────────────────────────────────────────────────────────────
    public int Fighters { get; set; }
    public int Shields { get; set; }
    public int Photons { get; set; }
    public int ArmidMines { get; set; }
    public int LimpetMines { get; set; }
    public int GenesisTorps { get; set; }
    public int AtomicDet { get; set; }
    public int Corbomite { get; set; }

    // ── Equipment ─────────────────────────────────────────────────────────
    public int Cloaks { get; set; }
    public int Beacons { get; set; }
    public int EtherProbes { get; set; }
    public int MineDisruptors { get; set; }
    public bool PsychProbe { get; set; }
    public bool PlanetScanner { get; set; }
    public string LRSType { get; set; } = string.Empty;
    public bool HasTransWarp1 { get; set; }
    public bool HasTransWarp2 { get; set; }
    public int TransWarp1 { get; set; }  // hops
    public int TransWarp2 { get; set; }  // hops
    public bool Interdictor { get; set; }

    // ── Finances ──────────────────────────────────────────────────────────
    public long Credits { get; set; }
}
