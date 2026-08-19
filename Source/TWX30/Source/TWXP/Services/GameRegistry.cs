namespace TWXP.Services;

internal sealed class GameRegistry
{
    public string ScriptsDirectory { get; set; } = string.Empty;
    public string PortHaggleMode { get; set; } = string.Empty;
    public string PlanetHaggleMode { get; set; } = string.Empty;
    public List<string> Games { get; set; } = new();
}
