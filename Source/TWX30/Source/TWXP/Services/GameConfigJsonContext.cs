using System.Collections.ObjectModel;
using System.Text.Json.Serialization;
using TWXP.Models;

namespace TWXP.Services;

[JsonSourceGenerationOptions(WriteIndented = true)]
[JsonSerializable(typeof(List<GameConfig>))]
[JsonSerializable(typeof(ObservableCollection<GameConfig>))]
[JsonSerializable(typeof(GameConfig))]
[JsonSerializable(typeof(GameRegistry))]
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(Dictionary<string, string>))]
internal partial class GameConfigJsonContext : JsonSerializerContext
{
}
