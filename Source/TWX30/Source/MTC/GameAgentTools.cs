using System;
using System.Collections.Generic;
using System.Linq;

namespace MTC;

internal sealed class GameAgentToolDescriptor
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public bool CanExecuteGameCommand { get; init; }
    public bool RequiresApproval { get; init; }
}

internal sealed class GameAgentToolCallResult
{
    public string ToolName { get; init; } = string.Empty;
    public bool Success { get; init; }
    public bool WouldRequireApproval { get; init; }
    public string Message { get; init; } = string.Empty;
    public Dictionary<string, string> Data { get; init; } = [];
}

internal static class GameAgentToolRegistry
{
    public static IReadOnlyList<GameAgentToolDescriptor> DescribeTools()
        =>
        [
            new()
            {
                Name = "observe_context",
                Description = "Read the compact live game context and recent observed events.",
                CanExecuteGameCommand = false,
                RequiresApproval = false,
            },
            new()
            {
                Name = "recommend_action",
                Description = "Return the deterministic copilot's next structured action recommendation without sending anything.",
                CanExecuteGameCommand = false,
                RequiresApproval = false,
            },
            new()
            {
                Name = "query_sector",
                Description = "Read known database details for the current or adjacent sector.",
                CanExecuteGameCommand = false,
                RequiresApproval = false,
            },
            new()
            {
                Name = "query_route",
                Description = "Plan a route from known database warps. Not implemented in the observer baseline.",
                CanExecuteGameCommand = false,
                RequiresApproval = false,
            },
            new()
            {
                Name = "list_scripts",
                Description = "List script/runtime state for future suggestions. Currently returns a placeholder.",
                CanExecuteGameCommand = false,
                RequiresApproval = false,
            },
            new()
            {
                Name = "propose_command",
                Description = "Draft a command for user review without sending anything.",
                CanExecuteGameCommand = false,
                RequiresApproval = true,
            },
            new()
            {
                Name = "send_command",
                Description = "Send raw terminal input to the game stream.",
                CanExecuteGameCommand = true,
                RequiresApproval = true,
            },
            new()
            {
                Name = "run_mombot_command",
                Description = "Run a native MTC Mombot command such as `t 1234` for twarp or `m 1234` for mow.",
                CanExecuteGameCommand = true,
                RequiresApproval = true,
            },
            new()
            {
                Name = "run_script",
                Description = "Disabled safety placeholder. Future versions may run approved scripts.",
                CanExecuteGameCommand = true,
                RequiresApproval = true,
            },
            new()
            {
                Name = "stop_script",
                Description = "Disabled safety placeholder. Future versions may stop approved scripts.",
                CanExecuteGameCommand = true,
                RequiresApproval = true,
            },
        ];

    public static GameAgentToolCallResult ObserveContext(GameAgentContextSnapshot context)
        => new()
        {
            ToolName = "observe_context",
            Success = true,
            Message = "Context observed without changing gameplay.",
            Data = new Dictionary<string, string>
            {
                ["game"] = context.GameName,
                ["connected"] = context.Connected ? "true" : "false",
                ["sector"] = context.CurrentSector > 0 ? context.CurrentSector.ToString() : string.Empty,
                ["prompt"] = context.CurrentPrompt,
                ["recentEvents"] = context.RecentEvents.Count.ToString(),
                ["onlinePlayers"] = string.Join("; ", context.OnlinePlayers),
                ["runningScripts"] = string.Join("; ", context.RunningScripts.Select(script => script.Name)),
                ["botMode"] = context.Bot.Mode,
            },
        };

    public static GameAgentToolCallResult RecommendAction(GameAgentContextSnapshot context)
        => GameAgentCopilot.RecommendAction(context);

    public static GameAgentToolCallResult QuerySector(GameAgentContextSnapshot context, int sectorNumber)
    {
        GameAgentSectorSnapshot? sector = null;
        if (context.CurrentSectorDetails?.Number == sectorNumber)
            sector = context.CurrentSectorDetails;
        sector ??= context.AdjacentSectors.FirstOrDefault(candidate => candidate.Number == sectorNumber);

        if (sector == null)
        {
            return new GameAgentToolCallResult
            {
                ToolName = "query_sector",
                Success = false,
                Message = $"Sector {sectorNumber} is not in the compact live snapshot.",
            };
        }

        return new GameAgentToolCallResult
        {
            ToolName = "query_sector",
            Success = true,
            Message = $"Sector {sector.Number} details returned from local database snapshot.",
            Data = new Dictionary<string, string>
            {
                ["sector"] = sector.Number.ToString(),
                ["explored"] = sector.Explored,
                ["warpsOut"] = string.Join(" ", sector.WarpsOut),
                ["warpsIn"] = string.Join(" ", sector.WarpsIn),
                ["port"] = sector.Port,
                ["planets"] = string.Join("; ", sector.Planets),
                ["fighters"] = sector.Fighters,
                ["armids"] = sector.ArmidMines,
                ["limpets"] = sector.LimpetMines,
            },
        };
    }

    public static GameAgentToolCallResult ListScripts()
        => ListScripts([]);

    public static GameAgentToolCallResult ListScripts(IReadOnlyList<GameAgentRunningScriptSnapshot> runningScripts)
    {
        if (runningScripts.Count == 0)
        {
            return new GameAgentToolCallResult
            {
                ToolName = "list_scripts",
                Success = true,
                Message = "No running scripts are visible in the current interpreter snapshot.",
            };
        }

        return new GameAgentToolCallResult
        {
            ToolName = "list_scripts",
            Success = true,
            Message = $"{runningScripts.Count} running script(s) returned from the interpreter snapshot.",
            Data = runningScripts.Take(24).ToDictionary(
                script => script.Id.ToString(),
                script => $"{script.Name}{(script.Paused ? " paused" : string.Empty)}{(script.IsBot ? " bot" : string.Empty)}"),
        };
    }

    public static GameAgentToolCallResult ListScriptsLegacyPlaceholder()
        => new()
        {
            ToolName = "list_scripts",
            Success = true,
            Message = "Script listing is scaffolded; runtime script inventory is not wired yet.",
        };

    public static GameAgentToolCallResult ProposeCommand(string command)
        => new()
        {
            ToolName = "propose_command",
            Success = true,
            WouldRequireApproval = true,
            Message = $"Proposed command only, not sent: {command}",
        };

    public static GameAgentToolCallResult DisabledAction(string toolName)
        => new()
        {
            ToolName = toolName,
            Success = false,
            WouldRequireApproval = true,
            Message = "Direct model command execution is disabled. Action requests use the Game Agent request runner or JSON-RPC action methods.",
        };
}
