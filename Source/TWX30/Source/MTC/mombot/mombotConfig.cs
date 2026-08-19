using System.Collections.Generic;

namespace MTC.mombot;

internal sealed class mombotConfig
{
    public bool Configured { get; set; }
    public bool Enabled { get; set; }
    public bool AutoStart { get; set; }
    public string Name { get; set; } = "MomBot";
    public string Description { get; set; } = "Built-in native Mombot runtime";
    public string NameVar { get; set; } = "BotName";
    public string CommsVar { get; set; } = "BotComms";
    public string LoginScript { get; set; } = "disabled";
    public string Theme { get; set; } = "7|[MOMBOT]|~D|~G|~B|~C";
    public bool AcceptSelfCommands { get; set; } = true;
    public bool AcceptSubspaceCommands { get; set; } = true;
    public bool AcceptPrivateCommands { get; set; } = true;
    public bool WatcherEnabled { get; set; } = true;
    public string ScriptRoot { get; set; } = "scripts/mombot";
    public List<string> AuthorizedUsers { get; set; } = new();
}
