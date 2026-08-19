namespace MTC;

/// <summary>
/// Holds all game-state values displayed in the info sidebars.
/// Call <see cref="NotifyChanged"/> after updating to refresh the UI.
/// </summary>
public class GameState
{
    // ── Trader Info ────────────────────────────────────────────────────────
    public string TraderName  { get; set; } = string.Empty;
    public int    Sector      { get; set; } = 0;
    public int    Turns       { get; set; } = 0;
    public int    Experience  { get; set; } = 0;
    public string Alignment   { get; set; } = "0";
    public long   Credits     { get; set; } = 0;

    // ── Holds ──────────────────────────────────────────────────────────────
    public int HoldsTotal  { get; set; } = 0;
    public int FuelOre     { get; set; } = 0;
    public int Organics    { get; set; } = 0;
    public int Equipment   { get; set; } = 0;
    public int Colonists   { get; set; } = 0;
    public int HoldsEmpty  { get; set; } = 0;

    // ── Ship Info ──────────────────────────────────────────────────────────
    public int Fighters     { get; set; } = 0;
    public int Shields      { get; set; } = 0;
    public int TurnsPerWarp { get; set; } = 0;

    // Combat beam/device counts (can be extended)
    public int Etheral     { get; set; } = 0;
    public int Beacon      { get; set; } = 0;
    public int Disruptor   { get; set; } = 0;
    public int Photon      { get; set; } = 0;
    public int Armor       { get; set; } = 0;
    public int Limpet      { get; set; } = 0;
    public int Genesis     { get; set; } = 0;
    public int Atomic      { get; set; } = 0;
    public int Corbomite   { get; set; } = 0;
    public int Cloak       { get; set; } = 0;
    public bool HasTranswarpDrive1 { get; set; } = false;
    public bool HasTranswarpDrive2 { get; set; } = false;
    public int TranswarpDrive1 { get; set; } = 0;
    public int TranswarpDrive2 { get; set; } = 0;
    public bool ScannerD   { get; set; } = false;
    public bool ScannerH   { get; set; } = false;
    public bool ScannerP   { get; set; } = false;

    // ── Connection status ──────────────────────────────────────────────────
    public string Host            { get; set; } = string.Empty;
    public int    Port            { get; set; } = 2002;
    public string GameName        { get; set; } = string.Empty;
    public TwProtocol Protocol    { get; set; } = TwProtocol.Telnet;
    public bool   LocalTwxProxy   { get; set; } = true;
    public string TwxProxyDbPath  { get; set; } = string.Empty;
    public string RemoteProxyServerId { get; set; } = string.Empty;
    public string RemoteProxyGameId { get; set; } = string.Empty;
    public bool   EmbeddedProxy   { get; set; } = true;
    public int    Sectors         { get; set; } = ConnectionProfile.DefaultSectors;
    public bool   AutoReconnect   { get; set; } = false;
    public bool   ListenForConnections { get; set; } = false;
    public int    ListenPort      { get; set; } = ConnectionProfile.DefaultListenPort;
    public bool   UseLogin        { get; set; } = false;
    public bool   UseRLogin       { get; set; } = false;
    public string LoginScript     { get; set; } = "0_Login.cts";
    public string LoginName       { get; set; } = string.Empty;
    public string Password        { get; set; } = string.Empty;
    public string GameLetter      { get; set; } = string.Empty;
    public bool   Connected       { get; set; } = false;
    public string ShipName  { get; set; } = "-";
    public int    Corp      { get; set; } = 0;
    public string LastDollar { get; set; } = "-";
    public string CurrentCmd { get; set; } = "-";

    public event Action? Changed;
    public void NotifyChanged() => Changed?.Invoke();
}
