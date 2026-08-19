using System.Text.Json;

namespace TWXP;

internal static class GameConfigCloner
{
    public static GameConfig Clone(GameConfig config)
    {
        string json = JsonSerializer.Serialize(config, GameConfigJsonContext.Default.GameConfig);
        GameConfig? clone = JsonSerializer.Deserialize(json, GameConfigJsonContext.Default.GameConfig);
        if (clone == null)
            throw new InvalidOperationException("Unable to clone game configuration.");

        clone.Status = config.Status;
        clone.GameDataFilePath = config.GameDataFilePath;
        clone.Variables = new Dictionary<string, string>(
            config.Variables ?? new Dictionary<string, string>(),
            StringComparer.OrdinalIgnoreCase);
        return clone;
    }
}
