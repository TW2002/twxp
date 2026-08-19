using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MTC;

/// <summary>
/// Subset of TWXP's GameConfig JSON schema used by embedded games in MTC.
/// <para>
/// <see cref="JsonExtensionDataAttribute"/> on <see cref="Extra"/> ensures all fields that
/// TWXP writes (ListenPort, CommandChar, AutoConnect, …) are round-tripped transparently,
/// so a file can be shared safely between the standalone TWXP proxy and MTC.
/// </para>
/// </summary>
internal class EmbeddedGameConfig
{
    public string Id      { get; set; } = Guid.NewGuid().ToString();
    public string Name    { get; set; } = string.Empty;
    public string Host    { get; set; } = string.Empty;
    public int    Port    { get; set; } = 23;
    public int    Sectors { get; set; } = ConnectionProfile.DefaultSectors;
    public int    ListenPort { get; set; } = 2300;
    public char   CommandChar { get; set; } = '$';
    public string DatabasePath { get; set; } = string.Empty;
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ScriptDirectory { get; set; }
    public bool   AutoReconnect { get; set; }
    public int    ReconnectDelaySeconds { get; set; } = 5;
    public bool   NativeHaggleEnabled { get; set; } = true;
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? NativeHaggleMode { get; set; }
    public bool   UseCache { get; set; } = true;
    public int    BubbleMinSize { get; set; } = 5;
    public int    BubbleSize { get; set; } = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
    public bool   BubbleSizeCustomized { get; set; }
    public int    DeadEndMinSize { get; set; } = 2;
    public int    DeadEndMaxSize { get; set; } = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
    public int    TunnelMinSize { get; set; } = 2;
    public int    TunnelMaxSize { get; set; } = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
    public bool   LocalEcho { get; set; } = true;
    public bool   LogEnabled { get; set; } = true;
    public bool   LogAnsi { get; set; }
    public bool   LogAnsiCompanion { get; set; }
    public bool   LogBinary { get; set; }
    public bool   NotifyPlayCuts { get; set; } = true;
    public int    MaxPlayDelay { get; set; } = 10000;
    public bool   AcceptExternal { get; set; } = true;
    public bool   AllowLerkers { get; set; } = true;
    public bool   BroadcastMessages { get; set; } = true;
    public string ExternalAddress { get; set; } = string.Empty;
    public string LerkerAddress { get; set; } = string.Empty;
    public bool   StreamingMode { get; set; }
    public bool   UseLogin { get; set; }
    public bool   UseRLogin { get; set; }
    public string LoginScript { get; set; } = "0_Login.cts";
    public string LoginName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string GameLetter { get; set; } = string.Empty;

    /// <summary>Variables persisted by <c>savevar</c> / retrieved by <c>loadvar</c>.</summary>
    public Dictionary<string, string> Variables { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>MTC-specific settings/state stored alongside the shared game config.</summary>
    public EmbeddedMtcConfig Mtc { get; set; } = new();

    /// <summary>Shared native Mombot settings stored at the top level for cross-app compatibility.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public MTC.mombot.mombotConfig? mombot { get; set; }

    /// <summary>Preserves every TWXP GameConfig field not listed above.</summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

internal class EmbeddedMtcConfig
{
    public string Protocol { get; set; } = nameof(TwProtocol.Telnet);
    public bool LocalTwxProxy { get; set; } = true;
    public string TwxProxyDbPath { get; set; } = string.Empty;
    public string RemoteProxyServerId { get; set; } = string.Empty;
    public string RemoteProxyGameId { get; set; } = string.Empty;
    public bool EmbeddedProxy { get; set; } = true;
    public string EditId { get; set; } = string.Empty;
    public bool ListenForConnections { get; set; }
    public int ScrollbackLines { get; set; } = TerminalBuffer.DefaultScrollbackLines;
    public EmbeddedMtcStatusBarConfig StatusBar { get; set; } = new();
    public EmbeddedMtcDebugConfig Debug { get; set; } = new();
    public EmbeddedMtcJsonRpcConfig JsonRpc { get; set; } = new();
    [JsonIgnore]
    public MTC.mombot.mombotConfig mombot { get; set; } = new();
    [JsonPropertyName("mombot")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public MTC.mombot.mombotConfig? LegacyMombot
    {
        get => null;
        set
        {
            if (value != null)
                mombot = value;
        }
    }
    [JsonPropertyName("mbot")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public MTC.mombot.mombotConfig? LegacyMbot
    {
        get => null;
        set
        {
            if (value != null)
                mombot = value;
        }
    }
    public EmbeddedMtcState State { get; set; } = new();
}

internal class EmbeddedMtcDebugConfig
{
    public bool DebugLoggingEnabled { get; set; } = true;
    public bool VerboseDebugLogging { get; set; }
    public bool ScriptTraceDebugLogging { get; set; }
    public bool VariablePersistenceDebugLogging { get; set; }
    public bool AutoRecorderDebugLogging { get; set; }
    public bool TriggerDebugLogging { get; set; }
    public bool DebugDatabaseChanges { get; set; }
    public bool DebugPortHaggleEnabled { get; set; }
    public bool DebugPlanetHaggleEnabled { get; set; }
}

internal class EmbeddedMtcJsonRpcConfig
{
    public bool Enabled { get; set; }
    public string BindAddress { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 7623;
    public string AuthToken { get; set; } = string.Empty;
    public string ApprovalLevel { get; set; } = MtcRpcApprovalLevels.ApproveActions;
}

internal class EmbeddedMtcStatusBarConfig
{
    public bool ShowStarDock { get; set; } = true;
    public bool ShowBackdoor { get; set; } = true;
    public bool ShowRylos { get; set; } = true;
    public bool ShowAlpha { get; set; } = true;
    public bool ShowIpInfo { get; set; } = true;
    public bool ShowHaggleInfo { get; set; }
    public List<EmbeddedMtcStatusSectorChip> CustomSectors { get; set; } = [];
}

internal class EmbeddedMtcStatusSectorChip
{
    public string Name { get; set; } = string.Empty;
    public int Sector { get; set; }
}

internal class EmbeddedMtcState
{
    public string TraderName { get; set; } = string.Empty;
    public int Sector { get; set; }
    public int Turns { get; set; }
    public int Experience { get; set; }
    public string Alignment { get; set; } = "0";
    public long Credits { get; set; }
    public int Corp { get; set; }
    public string ShipName { get; set; } = "-";
    public int HoldsTotal { get; set; }
    public int FuelOre { get; set; }
    public int Organics { get; set; }
    public int Equipment { get; set; }
    public int Colonists { get; set; }
    public int HoldsEmpty { get; set; }
    public int Fighters { get; set; }
    public int Shields { get; set; }
    public int TurnsPerWarp { get; set; }
    public int Etheral { get; set; }
    public int Beacon { get; set; }
    public int Disruptor { get; set; }
    public int Photon { get; set; }
    public int Armor { get; set; }
    public int Limpet { get; set; }
    public int Genesis { get; set; }
    public int Atomic { get; set; }
    public int Corbomite { get; set; }
    public int Cloak { get; set; }
    public bool HasTranswarpDrive1 { get; set; }
    public bool HasTranswarpDrive2 { get; set; }
    public int TranswarpDrive1 { get; set; }
    public int TranswarpDrive2 { get; set; }
    public bool ScannerD { get; set; }
    public bool ScannerH { get; set; }
    public bool ScannerP { get; set; }
}
