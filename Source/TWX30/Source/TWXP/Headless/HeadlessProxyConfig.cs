using System.Text.Json.Serialization;
using TWXP.Models;

namespace TWXP.Headless;

public sealed class HeadlessProxyConfig
{
    public string ProgramDir { get; set; } = string.Empty;
    public string ScriptsDirectory { get; set; } = string.Empty;
    public string ManagementBindAddress { get; set; } = "127.0.0.1";
    public int ManagementPort { get; set; } = 2099;
    public List<string> AllowedIpAddresses { get; set; } = ["127.0.0.1", "::1"];
    public List<string> SecurityTokens { get; set; } = [];
    public bool AutoStartGames { get; set; } = true;
    public int FirstGameListenPort { get; set; } = 2023;
    public List<GameConfig> Games { get; set; } = [];
}

[JsonSourceGenerationOptions(
    WriteIndented = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    PropertyNameCaseInsensitive = true)]
[JsonSerializable(typeof(HeadlessProxyConfig))]
[JsonSerializable(typeof(GameConfig))]
internal partial class HeadlessProxyJsonContext : JsonSerializerContext
{
}
