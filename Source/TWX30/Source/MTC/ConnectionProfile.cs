using System.Xml.Linq;

namespace MTC;

/// <summary>
/// Transport protocol for the game connection.
/// </summary>
public enum TwProtocol { Telnet, Rlogin }

/// <summary>
/// All settings needed to establish and configure a game connection,
/// including the last-known ship state so the sidebar is pre-populated
/// when the game config is re-opened.
/// This class remains the MTC dialog/load/save DTO and can still import
/// legacy UTF-8 XML ".mtc" files.
/// </summary>
public class ConnectionProfile
{
    public const int DefaultSectors = 20000;
    public const int DefaultListenPort = 2300;

    public string     Name            { get; set; } = string.Empty;
    // ── Connection ─────────────────────────────────────────────────────────
    public string     Server          { get; set; } = string.Empty;
    public int        Port            { get; set; } = 2002;
    public TwProtocol Protocol        { get; set; } = TwProtocol.Telnet;

    // ── TWXProxy integration ───────────────────────────────────────────────
    public bool       LocalTwxProxy   { get; set; } = true;
    public string     TwxProxyDbPath  { get; set; } = string.Empty;
    public string     RemoteProxyServerId { get; set; } = string.Empty;
    public string     RemoteProxyGameId { get; set; } = string.Empty;

    // ── Embedded proxy (native script engine inside MTC) ───────────────────
    /// <summary>When true MTC runs the TWX proxy engine in-process instead of using a bare telnet connection.</summary>
    public bool       EmbeddedProxy   { get; set; } = true;
    /// <summary>Universe size in sectors — used to pre-size the game database when MTC or the embedded proxy creates it.</summary>
    public int        Sectors         { get; set; } = DefaultSectors;
    /// <summary>When true the embedded proxy automatically reconnects to the server after a disconnect.</summary>
    public bool       AutoReconnect   { get; set; } = false;
    /// <summary>When true the embedded proxy opens a TCP listener for external/lurker clients.</summary>
    public bool       ListenForConnections { get; set; } = false;
    /// <summary>TCP port used when <see cref="ListenForConnections"/> is enabled.</summary>
    public int        ListenPort      { get; set; } = DefaultListenPort;
    /// <summary>Run the configured login script after the embedded proxy connects.</summary>
    public bool       UseLogin        { get; set; } = false;
    /// <summary>Use Pascal-style RLogin handshake when the embedded proxy connects.</summary>
    public bool       UseRLogin       { get; set; } = false;
    public string     LoginScript     { get; set; } = "0_Login.cts";
    public string     LoginName       { get; set; } = string.Empty;
    public string     Password        { get; set; } = string.Empty;
    public string     GameLetter      { get; set; } = string.Empty;
    /// <summary>Optional known TW2002 edit used to seed Mombot ship and planet catalogs.</summary>
    public string     EditId          { get; set; } = string.Empty;
    /// <summary>True once the profile has explicitly stored embedded login automation settings.</summary>
    public bool       LoginSettingsConfigured { get; set; } = false;
    /// <summary>Transient value used by Auto Setup to configure native MomBot during first login.</summary>
    public string     AutoSetupBotName { get; set; } = string.Empty;
    /// <summary>Transient Auto Setup post-login action: nothing, command, macro, or terra.</summary>
    public string     AutoSetupAfterLoginAction { get; set; } = "nothing";
    /// <summary>Transient native MomBot command to run after Auto Setup login when requested.</summary>
    public string     AutoSetupBotCommand { get; set; } = string.Empty;
    /// <summary>Transient macro to fire after Auto Setup login when requested.</summary>
    public string     AutoSetupMacroAfterLogin { get; set; } = string.Empty;

    // ── Legacy terminal settings ───────────────────────────────────────────
    /// <summary>Legacy profile value retained for older files; active scrollback is global MTC preference.</summary>
    public int        ScrollbackLines { get; set; } = TerminalBuffer.DefaultScrollbackLines;

    // ── Trader info (last known) ───────────────────────────────────────────
    public string     TraderName   { get; set; } = string.Empty;
    public int        Sector       { get; set; } = 0;
    public int        Turns        { get; set; } = 0;
    public int        Experience   { get; set; } = 0;
    public string     Alignment    { get; set; } = "0";
    public long       Credits      { get; set; } = 0;
    public int        Corp         { get; set; } = 0;

    // ── Ship info (last known) ─────────────────────────────────────────────
    public string     ShipName     { get; set; } = string.Empty;
    public int        HoldsTotal   { get; set; } = 0;
    public int        FuelOre      { get; set; } = 0;
    public int        Organics     { get; set; } = 0;
    public int        Equipment    { get; set; } = 0;
    public int        Colonists    { get; set; } = 0;
    public int        HoldsEmpty   { get; set; } = 0;
    public int        Fighters     { get; set; } = 0;
    public int        Shields      { get; set; } = 0;
    public int        TurnsPerWarp { get; set; } = 0;

    // ── Combat items (last known) ──────────────────────────────────────────
    public int        Etheral      { get; set; } = 0;
    public int        Beacon       { get; set; } = 0;
    public int        Disruptor    { get; set; } = 0;
    public int        Photon       { get; set; } = 0;
    public int        Armor        { get; set; } = 0;
    public int        Limpet       { get; set; } = 0;
    public int        Genesis      { get; set; } = 0;
    public int        Atomic       { get; set; } = 0;
    public int        Corbomite    { get; set; } = 0;
    public int        Cloak        { get; set; } = 0;
    public bool       HasTranswarpDrive1 { get; set; } = false;
    public bool       HasTranswarpDrive2 { get; set; } = false;
    public int        TranswarpDrive1 { get; set; } = 0;
    public int        TranswarpDrive2 { get; set; } = 0;
    public bool       ScannerD     { get; set; } = false;
    public bool       ScannerH     { get; set; } = false;
    public bool       ScannerP     { get; set; } = false;

    // ── Serialisation ──────────────────────────────────────────────────────

    /// <summary>Save this profile to an XML ".mtc" file.</summary>
    public void SaveXml(string path)
    {
        var doc = new XDocument(
            new XElement("MtcConnection",
                // Connection
                new XElement("Server",          Server),
                new XElement("Port",            Port),
                new XElement("Protocol",        Protocol.ToString()),
                new XElement("LocalTwxProxy",   LocalTwxProxy),
                new XElement("TwxProxyDbPath",  TwxProxyDbPath),
                new XElement("RemoteProxyServerId", RemoteProxyServerId),
                new XElement("RemoteProxyGameId", RemoteProxyGameId),
                new XElement("EmbeddedProxy",   EmbeddedProxy),
                new XElement("Sectors",         Sectors),
                new XElement("AutoReconnect",   AutoReconnect),
                new XElement("ListenForConnections", ListenForConnections),
                new XElement("ListenPort",      ListenPort),
                new XElement("UseLogin",        UseLogin),
                new XElement("UseRLogin",       UseRLogin),
                new XElement("LoginScript",     LoginScript),
                new XElement("LoginName",       LoginName),
                new XElement("Password",        Password),
                new XElement("GameLetter",      GameLetter),
                new XElement("EditId",          EditId),
                new XElement("LoginSettingsConfigured", LoginSettingsConfigured),
                new XElement("ScrollbackLines", ScrollbackLines),
                // Trader info
                new XElement("TraderName",      TraderName),
                new XElement("Sector",          Sector),
                new XElement("Turns",           Turns),
                new XElement("Experience",      Experience),
                new XElement("Alignment",       Alignment),
                new XElement("Credits",         Credits),
                new XElement("Corp",            Corp),
                // Ship
                new XElement("ShipName",        ShipName),
                new XElement("HoldsTotal",      HoldsTotal),
                new XElement("FuelOre",         FuelOre),
                new XElement("Organics",        Organics),
                new XElement("Equipment",       Equipment),
                new XElement("Colonists",       Colonists),
                new XElement("HoldsEmpty",      HoldsEmpty),
                new XElement("Fighters",        Fighters),
                new XElement("Shields",         Shields),
                new XElement("TurnsPerWarp",    TurnsPerWarp),
                // Combat
                new XElement("Etheral",         Etheral),
                new XElement("Beacon",          Beacon),
                new XElement("Disruptor",       Disruptor),
                new XElement("Photon",          Photon),
                new XElement("Armor",           Armor),
                new XElement("Limpet",          Limpet),
                new XElement("Genesis",         Genesis),
                new XElement("Atomic",          Atomic),
                new XElement("Corbomite",       Corbomite),
                new XElement("Cloak",           Cloak),
                new XElement("HasTranswarpDrive1", HasTranswarpDrive1),
                new XElement("HasTranswarpDrive2", HasTranswarpDrive2),
                new XElement("TranswarpDrive1", TranswarpDrive1),
                new XElement("TranswarpDrive2", TranswarpDrive2),
                new XElement("ScannerD",        ScannerD),
                new XElement("ScannerH",        ScannerH),
                new XElement("ScannerP",        ScannerP)
            )
        );
        doc.Save(path);
    }

    /// <summary>Load a profile from an XML ".mtc" file.</summary>
    public static ConnectionProfile LoadXml(string path)
    {
        var root = XDocument.Load(path).Root
                   ?? throw new InvalidDataException($"Empty or invalid MTC file: {path}");

        int I(string name, int def = 0)   => (int?)   root.Element(name) ?? def;
        long L(string name, long def = 0) => (long?)  root.Element(name) ?? def;
        bool B(string name, bool def = false) => (bool?)root.Element(name) ?? def;
        string S(string name, string def = "") => (string?)root.Element(name) ?? def;

        var p = new ConnectionProfile();
        // Connection
        p.Server          = S("Server");
        p.Port            = I("Port", 2002);
        p.Protocol        = Enum.TryParse<TwProtocol>(S("Protocol"), out var proto)
                            ? proto : TwProtocol.Telnet;
        p.LocalTwxProxy   = B("LocalTwxProxy", true);
        p.TwxProxyDbPath  = S("TwxProxyDbPath");
        p.RemoteProxyServerId = S("RemoteProxyServerId");
        p.RemoteProxyGameId = S("RemoteProxyGameId");
        p.EmbeddedProxy   = B("EmbeddedProxy", true);
        p.Sectors         = I("Sectors", DefaultSectors);
        p.AutoReconnect   = B("AutoReconnect",  false);
        p.ListenForConnections = B("ListenForConnections", false);
        p.ListenPort      = I("ListenPort", DefaultListenPort);
        p.UseLogin        = B("UseLogin", false);
        p.UseRLogin       = B("UseRLogin", false);
        p.LoginScript     = S("LoginScript", "0_Login.cts");
        p.LoginName       = S("LoginName");
        p.Password        = S("Password");
        p.GameLetter      = S("GameLetter");
        p.EditId          = S("EditId");
        p.LoginSettingsConfigured = B("LoginSettingsConfigured", false);
        p.ScrollbackLines = I("ScrollbackLines", 2000);
        // Trader
        p.TraderName    = S("TraderName");
        p.Sector        = I("Sector");
        p.Turns         = I("Turns");
        p.Experience    = I("Experience");
        p.Alignment     = S("Alignment", "0");
        p.Credits       = L("Credits");
        p.Corp          = I("Corp");
        // Ship
        p.ShipName      = S("ShipName");
        p.HoldsTotal    = I("HoldsTotal");
        p.FuelOre       = I("FuelOre");
        p.Organics      = I("Organics");
        p.Equipment     = I("Equipment");
        p.Colonists     = I("Colonists");
        p.HoldsEmpty    = I("HoldsEmpty");
        p.Fighters      = I("Fighters");
        p.Shields       = I("Shields");
        p.TurnsPerWarp  = I("TurnsPerWarp");
        // Combat
        p.Etheral       = I("Etheral");
        p.Beacon        = I("Beacon");
        p.Disruptor     = I("Disruptor");
        p.Photon        = I("Photon");
        p.Armor         = I("Armor");
        p.Limpet        = I("Limpet");
        p.Genesis       = I("Genesis");
        p.Atomic        = I("Atomic");
        p.Corbomite     = I("Corbomite");
        p.Cloak         = I("Cloak");
        p.TranswarpDrive1 = I("TranswarpDrive1");
        p.TranswarpDrive2 = I("TranswarpDrive2");
        p.HasTranswarpDrive1 = B("HasTranswarpDrive1", p.TranswarpDrive1 > 0);
        p.HasTranswarpDrive2 = B("HasTranswarpDrive2", p.TranswarpDrive2 > 0);
        p.ScannerD      = B("ScannerD");
        p.ScannerH      = B("ScannerH");
        p.ScannerP      = B("ScannerP");
        return p;
    }
}
