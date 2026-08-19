using System.Text.Json;
using System.Text.Json.Serialization;

namespace TWXP.Models;

public class GameConfig
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 23;
    public int ListenPort { get; set; } = 2300;
    public char CommandChar { get; set; } = '$';
    public int Sectors { get; set; } = 1000;
    public string DatabasePath { get; set; } = string.Empty;
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ScriptDirectory { get; set; }
    public bool AutoConnect { get; set; }
    public bool AutoReconnect { get; set; }
    public int ReconnectDelaySeconds { get; set; } = 5;
    public bool NativeHaggleEnabled { get; set; } = true;
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? NativeHaggleMode { get; set; }
    public bool UseCache { get; set; } = true;
    public int BubbleMinSize { get; set; } = 1;
    public int BubbleSize { get; set; } = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
    public bool BubbleSizeCustomized { get; set; }
    public int DeadEndMinSize { get; set; } = 1;
    public int DeadEndMaxSize { get; set; } = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
    public int TunnelMinSize { get; set; } = 2;
    public int TunnelMaxSize { get; set; } = TWXProxy.Core.ModBubble.DefaultMaxBubbleSize;
    public bool LocalEcho { get; set; } = true;
    public bool LogEnabled { get; set; } = true;
    public bool LogAnsi { get; set; }
    public bool LogAnsiCompanion { get; set; }
    public bool LogBinary { get; set; }
    public bool NotifyPlayCuts { get; set; } = true;
    public int MaxPlayDelay { get; set; } = 10000;
    public bool AcceptExternal { get; set; } = true;
    public bool AllowLerkers { get; set; } = true;
    public bool BroadcastMessages { get; set; } = true;
    public string ExternalAddress { get; set; } = string.Empty;
    public string LerkerAddress { get; set; } = string.Empty;
    public bool StreamingMode { get; set; }
    public bool UseLogin { get; set; }
    public bool UseRLogin { get; set; }
    public string LoginScript { get; set; } = "0_Login.cts";
    public string LoginName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string GameLetter { get; set; } = string.Empty;
    
    // Runtime status - not persisted
    [JsonIgnore]
    public GameStatus Status { get; set; } = GameStatus.Stopped;
    
    public DateTime? LastConnected { get; set; }
    
    // Additional settings
    public bool UseEncryption { get; set; }
    public string CharacterName { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;

    /// <summary>
    /// Variables persisted via savevar/loadvar for this game.
    /// Stored in the game's GAMENAME.json data file alongside the config.
    /// </summary>
    public Dictionary<string, string> Variables { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Runtime path to this game's GAMENAME.json data file.
    /// Set when the config is loaded from disk; not serialised.
    /// </summary>
    [JsonIgnore]
    public string GameDataFilePath { get; set; } = string.Empty;

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

public enum GameStatus
{
    Stopped,
    Starting,
    Running,
    Paused,
    Error
}
