namespace TWXProxy.Core;

/// <summary>
/// Partial ship-status update sourced from live game output outside the full
/// "/" or "I" ship info displays.
/// </summary>
public sealed class ShipStatusDelta
{
    public int? CurrentSector { get; set; }
    public int? ShipNumber { get; set; }
    public int? Turns { get; set; }
    public long? Experience { get; set; }
    public long ExperienceDelta { get; set; }

    public long? Credits { get; set; }

    public int? Fighters { get; set; }
    public int FightersDelta { get; set; }

    public int? Shields { get; set; }
    public int ShieldsDelta { get; set; }

    public int? TotalHolds { get; set; }
    public int TotalHoldsDelta { get; set; }

    public int? HoldsEmpty { get; set; }
    public int HoldsEmptyDelta { get; set; }

    public int FuelOreDelta { get; set; }
    public int OrganicsDelta { get; set; }
    public int EquipmentDelta { get; set; }
    public int ColonistsDelta { get; set; }

    public int AtomicDetDelta { get; set; }
    public int BeaconsDelta { get; set; }
    public int CorbomiteDelta { get; set; }
    public int CloaksDelta { get; set; }
    public int EtherProbesDelta { get; set; }
    public int MineDisruptorsDelta { get; set; }
    public int GenesisTorpsDelta { get; set; }
    public int PhotonsDelta { get; set; }
    public int ArmidMinesDelta { get; set; }
    public int LimpetMinesDelta { get; set; }

    public bool? PlanetScanner { get; set; }
    public bool? PsychProbe { get; set; }
    public string? LRSType { get; set; }
    public int? TurnsPerWarp { get; set; }
    public int? TransWarp1 { get; set; }
    public int? TransWarp2 { get; set; }

    public bool HasChanges()
    {
        return Credits.HasValue ||
               CurrentSector.HasValue ||
               ShipNumber.HasValue ||
               Turns.HasValue ||
               Experience.HasValue || ExperienceDelta != 0 ||
               Fighters.HasValue || FightersDelta != 0 ||
               Shields.HasValue || ShieldsDelta != 0 ||
               TotalHolds.HasValue || TotalHoldsDelta != 0 ||
               HoldsEmpty.HasValue || HoldsEmptyDelta != 0 ||
               FuelOreDelta != 0 ||
               OrganicsDelta != 0 ||
               EquipmentDelta != 0 ||
               ColonistsDelta != 0 ||
               AtomicDetDelta != 0 ||
               BeaconsDelta != 0 ||
               CorbomiteDelta != 0 ||
               CloaksDelta != 0 ||
               EtherProbesDelta != 0 ||
               MineDisruptorsDelta != 0 ||
               GenesisTorpsDelta != 0 ||
               PhotonsDelta != 0 ||
               ArmidMinesDelta != 0 ||
               LimpetMinesDelta != 0 ||
               PlanetScanner.HasValue ||
               PsychProbe.HasValue ||
               LRSType != null ||
               TurnsPerWarp.HasValue ||
               TransWarp1.HasValue ||
               TransWarp2.HasValue;
    }

    public void ApplyTo(ShipStatus status)
    {
        if (CurrentSector.HasValue)
            status.CurrentSector = ClampNonNegative(CurrentSector.Value);

        if (ShipNumber.HasValue)
            status.ShipNumber = ClampNonNegative(ShipNumber.Value);

        if (Turns.HasValue)
        {
            status.Turns = ClampNonNegative(Turns.Value);
            status.UnlimitedGame = false;
        }

        if (Credits.HasValue)
            status.Credits = Credits.Value;

        if (Experience.HasValue)
            status.Experience = ClampNonNegative(Experience.Value);
        status.Experience = ClampNonNegative(status.Experience + ExperienceDelta);

        if (Fighters.HasValue)
            status.Fighters = ClampNonNegative(Fighters.Value);
        status.Fighters = ClampNonNegative(status.Fighters + FightersDelta);

        if (Shields.HasValue)
            status.Shields = ClampNonNegative(Shields.Value);
        status.Shields = ClampNonNegative(status.Shields + ShieldsDelta);

        if (TotalHolds.HasValue)
            status.TotalHolds = ClampNonNegative(TotalHolds.Value);
        status.TotalHolds = ClampNonNegative(status.TotalHolds + TotalHoldsDelta);

        if (HoldsEmpty.HasValue)
            status.HoldsEmpty = ClampNonNegative(HoldsEmpty.Value);
        status.HoldsEmpty = ClampNonNegative(status.HoldsEmpty + HoldsEmptyDelta);

        status.FuelOre = ClampNonNegative(status.FuelOre + FuelOreDelta);
        status.Organics = ClampNonNegative(status.Organics + OrganicsDelta);
        status.Equipment = ClampNonNegative(status.Equipment + EquipmentDelta);
        status.Colonists = ClampNonNegative(status.Colonists + ColonistsDelta);

        status.AtomicDet = ClampNonNegative(status.AtomicDet + AtomicDetDelta);
        status.Beacons = ClampNonNegative(status.Beacons + BeaconsDelta);
        status.Corbomite = ClampNonNegative(status.Corbomite + CorbomiteDelta);
        status.Cloaks = ClampNonNegative(status.Cloaks + CloaksDelta);
        status.EtherProbes = ClampNonNegative(status.EtherProbes + EtherProbesDelta);
        status.MineDisruptors = ClampNonNegative(status.MineDisruptors + MineDisruptorsDelta);
        status.GenesisTorps = ClampNonNegative(status.GenesisTorps + GenesisTorpsDelta);
        status.Photons = ClampNonNegative(status.Photons + PhotonsDelta);
        status.ArmidMines = ClampNonNegative(status.ArmidMines + ArmidMinesDelta);
        status.LimpetMines = ClampNonNegative(status.LimpetMines + LimpetMinesDelta);

        if (PlanetScanner.HasValue)
            status.PlanetScanner = PlanetScanner.Value;
        if (PsychProbe.HasValue)
            status.PsychProbe = PsychProbe.Value;
        if (LRSType != null)
            status.LRSType = LRSType;
        if (TurnsPerWarp.HasValue)
            status.TurnsPerWarp = ClampNonNegative(TurnsPerWarp.Value);
        if (TransWarp1.HasValue)
            status.TransWarp1 = ClampNonNegative(TransWarp1.Value);
        if (TransWarp2.HasValue)
            status.TransWarp2 = ClampNonNegative(TransWarp2.Value);

        if (TotalHoldsDelta != 0 && !HoldsEmpty.HasValue && HoldsEmptyDelta == 0)
            status.HoldsEmpty = ClampNonNegative(status.HoldsEmpty + TotalHoldsDelta);
    }

    private static int ClampNonNegative(int value) => value < 0 ? 0 : value;
    private static long ClampNonNegative(long value) => value < 0 ? 0 : value;
}
