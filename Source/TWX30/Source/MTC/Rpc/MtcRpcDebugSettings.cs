using System.Text.Json;
using Core = TWXProxy.Core;

namespace MTC;

internal sealed class MtcRpcDebugSnapshot
{
    public string GameName { get; init; } = string.Empty;
    public Dictionary<string, bool> Settings { get; init; } = [];
    public Dictionary<string, bool> EffectiveSettings { get; init; } = [];
    public Dictionary<string, string> LogPaths { get; init; } = [];
    public string[] ProcessWideSettings { get; init; } = ["debugPortHaggleEnabled", "debugPlanetHaggleEnabled"];
}

internal static class MtcRpcDebugSettings
{
    private sealed record Setting(string Name, Func<EmbeddedMtcDebugConfig, bool> Get,
        Action<EmbeddedMtcDebugConfig, bool> Set);

    private static readonly Setting[] Settings =
    [
        new("debugLoggingEnabled", c => c.DebugLoggingEnabled, (c, v) => c.DebugLoggingEnabled = v),
        new("verboseDebugLogging", c => c.VerboseDebugLogging, (c, v) => c.VerboseDebugLogging = v),
        new("scriptTraceDebugLogging", c => c.ScriptTraceDebugLogging, (c, v) => c.ScriptTraceDebugLogging = v),
        new("variablePersistenceDebugLogging", c => c.VariablePersistenceDebugLogging, (c, v) => c.VariablePersistenceDebugLogging = v),
        new("autoRecorderDebugLogging", c => c.AutoRecorderDebugLogging, (c, v) => c.AutoRecorderDebugLogging = v),
        new("triggerDebugLogging", c => c.TriggerDebugLogging, (c, v) => c.TriggerDebugLogging = v),
        new("debugDatabaseChanges", c => c.DebugDatabaseChanges, (c, v) => c.DebugDatabaseChanges = v),
        new("debugPortHaggleEnabled", c => c.DebugPortHaggleEnabled, (c, v) => c.DebugPortHaggleEnabled = v),
        new("debugPlanetHaggleEnabled", c => c.DebugPlanetHaggleEnabled, (c, v) => c.DebugPlanetHaggleEnabled = v),
    ];

    public static string[] Names => Settings.Select(s => s.Name).ToArray();

    public static Dictionary<string, bool> ParsePatch(JsonElement? parameters)
    {
        if (parameters is not { ValueKind: JsonValueKind.Object } value ||
            !value.TryGetProperty("settings", out var settings) || settings.ValueKind != JsonValueKind.Object)
            throw new MtcRpcException(-32602, "Parameter 'settings' must be an object of debug setting names and boolean values.");

        var patch = new Dictionary<string, bool>(StringComparer.Ordinal);
        foreach (var property in value.EnumerateObject())
            if (property.Name != "settings" && property.Name != "gameName")
                throw new MtcRpcException(-32602, $"Unknown parameter '{property.Name}'.");
        foreach (var property in settings.EnumerateObject())
        {
            if (!Settings.Any(s => s.Name == property.Name))
                throw new MtcRpcException(-32602, $"Unknown debug setting '{property.Name}'.", Names);
            if (property.Value.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                throw new MtcRpcException(-32602, $"Debug setting '{property.Name}' must be a boolean.");
            if (!patch.TryAdd(property.Name, property.Value.GetBoolean()))
                throw new MtcRpcException(-32602, $"Duplicate debug setting '{property.Name}'.");
        }
        if (patch.Count == 0)
            throw new MtcRpcException(-32602, "At least one debug setting is required.");
        return patch;
    }

    public static void Apply(EmbeddedMtcDebugConfig config, IReadOnlyDictionary<string, bool> patch)
    {
        foreach (var setting in Settings)
            if (patch.TryGetValue(setting.Name, out bool enabled))
                setting.Set(config, enabled);
    }

    public static void ApplyHagglePatch(IReadOnlyDictionary<string, bool> patch, string portLogPath, string planetLogPath)
    {
        bool hasPort = patch.TryGetValue("debugPortHaggleEnabled", out bool portEnabled);
        bool hasPlanet = patch.TryGetValue("debugPlanetHaggleEnabled", out bool planetEnabled);
        if (hasPort || hasPlanet)
            Core.GlobalModules.ConfigureHaggleDebugLogging(
                hasPort ? portLogPath : null, hasPort ? portEnabled : Core.GlobalModules.PortHaggleDebugMode,
                hasPlanet ? planetLogPath : null, hasPlanet ? planetEnabled : Core.GlobalModules.PlanetHaggleDebugMode);
    }

    public static MtcRpcDebugSnapshot Snapshot(string gameName, EmbeddedMtcDebugConfig config)
        => new()
        {
            GameName = gameName,
            Settings = Settings.ToDictionary(s => s.Name, s => s.Get(config)),
            EffectiveSettings = new Dictionary<string, bool>
            {
                ["debugLoggingEnabled"] = Core.GlobalModules.DebugMode,
                ["verboseDebugLogging"] = Core.GlobalModules.DebugMode && Core.GlobalModules.VerboseDebugMode,
                ["scriptTraceDebugLogging"] = Core.GlobalModules.DebugMode && Core.GlobalModules.ScriptTraceDebugMode,
                ["variablePersistenceDebugLogging"] = Core.GlobalModules.DebugMode && Core.GlobalModules.VariablePersistenceDebugMode,
                ["autoRecorderDebugLogging"] = Core.GlobalModules.DebugMode && Core.GlobalModules.AutoRecorderDebugMode,
                ["triggerDebugLogging"] = Core.GlobalModules.DebugMode && Core.GlobalModules.TriggerDebugMode,
                ["debugDatabaseChanges"] = Core.GlobalModules.DatabaseCorrectionLoggingEnabled,
                ["debugPortHaggleEnabled"] = Core.GlobalModules.PortHaggleDebugMode,
                ["debugPlanetHaggleEnabled"] = Core.GlobalModules.PlanetHaggleDebugMode,
            },
            LogPaths = new Dictionary<string, string>
            {
                ["debug"] = Core.GlobalModules.DebugLogPath,
                ["databaseChanges"] = Core.GlobalModules.DatabaseCorrectionLogPath,
                ["portHaggle"] = Core.GlobalModules.PortHaggleDebugLogPath,
                ["planetHaggle"] = Core.GlobalModules.PlanetHaggleDebugLogPath,
            },
        };
}
