using System;
using System.Collections.Generic;
using System.Linq;

namespace MTC;

internal sealed class GameAgentCopilotLegalAction
{
    public string Action { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string ExpectedPrompt { get; init; } = string.Empty;
    public string InputType { get; init; } = "single_char";
    public string Risk { get; init; } = "low";
    public bool RequiresConfirmation { get; init; }
    public bool StateChanging { get; init; }
    public bool Destructive { get; init; }
    public bool RecommendationOnly { get; init; }
}

internal sealed class GameAgentCopilotProposal
{
    public string Action { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string ExpectedPrompt { get; init; } = string.Empty;
    public string Risk { get; init; } = "low";
    public double Confidence { get; init; }
}

internal sealed class GameAgentCopilotValidation
{
    public string Status { get; init; } = "rejected";
    public bool AutoSendAllowed { get; init; }
    public IReadOnlyList<string> Reasons { get; init; } = [];
}

internal sealed class GameAgentCopilotRecommendation
{
    public string Schema { get; init; } = "mtc.game-agent.copilot-recommendation.v1";
    public string Prompt { get; init; } = "Unknown";
    public string PromptRaw { get; init; } = string.Empty;
    public int Sector { get; init; }
    public IReadOnlyList<GameAgentCopilotLegalAction> LegalActions { get; init; } = [];
    public GameAgentCopilotProposal Proposal { get; init; } = new();
    public GameAgentCopilotValidation Validation { get; init; } = new();
    public bool DryRunOnly { get; init; } = true;
    public string Message { get; init; } = string.Empty;
}

internal static class GameAgentCopilot
{
    private const double MinRecommendationConfidence = 0.25;
    private const double MinAutoSendConfidence = 0.8;
    private const double MinAutomationLabConfidence = 0.2;

    public static GameAgentCopilotRecommendation Recommend(GameAgentContextSnapshot context)
        => Recommend(context.CurrentPrompt, context.CurrentSector, context.RecentEvents);

    public static GameAgentCopilotRecommendation Recommend(string currentPrompt, int sector, IReadOnlyList<GameAgentEvent> recentEvents)
    {
        string promptRaw = ResolvePromptRaw(currentPrompt, recentEvents);
        string prompt = DetectPrompt(promptRaw);
        IReadOnlyList<GameAgentCopilotLegalAction> legalActions = LegalActionsFor(prompt);
        GameAgentCopilotProposal proposal = BuildProposal(prompt, legalActions);
        GameAgentCopilotValidation validation = Validate(proposal, legalActions);

        return new GameAgentCopilotRecommendation
        {
            Prompt = prompt,
            PromptRaw = promptRaw,
            Sector = sector,
            LegalActions = legalActions,
            Proposal = proposal,
            Validation = validation,
            DryRunOnly = true,
            Message = validation.Status == "rejected"
                ? "No safe copilot action is available for the detected prompt."
                : $"Copilot recommends '{proposal.Action}' at {prompt}; no command was sent.",
        };
    }

    public static GameAgentToolCallResult RecommendAction(GameAgentContextSnapshot context)
    {
        GameAgentCopilotRecommendation recommendation = Recommend(context);
        Dictionary<string, string> data = new()
        {
            ["prompt"] = recommendation.Prompt,
            ["action"] = recommendation.Proposal.Action,
            ["reason"] = recommendation.Proposal.Reason,
            ["risk"] = recommendation.Proposal.Risk,
            ["confidence"] = recommendation.Proposal.Confidence.ToString("0.00"),
            ["validation"] = recommendation.Validation.Status,
            ["autoSendAllowed"] = recommendation.Validation.AutoSendAllowed ? "true" : "false",
            ["dryRunOnly"] = recommendation.DryRunOnly ? "true" : "false",
        };

        return new GameAgentToolCallResult
        {
            ToolName = "recommend_action",
            Success = recommendation.Validation.Status != "rejected",
            WouldRequireApproval = recommendation.Validation.AutoSendAllowed,
            Message = recommendation.Message,
            Data = data,
        };
    }

    public static GameAgentCopilotValidation ValidateForAutomationLab(GameAgentCopilotRecommendation recommendation)
    {
        GameAgentCopilotProposal proposal = recommendation.Proposal;
        if (string.IsNullOrWhiteSpace(proposal.Action))
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["No action was proposed."],
            };
        }

        if (string.Equals(recommendation.Prompt, "Unknown", StringComparison.OrdinalIgnoreCase))
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Automation Lab stopped because the current prompt is unknown."],
            };
        }

        GameAgentCopilotLegalAction? legalAction = recommendation.LegalActions.FirstOrDefault(action =>
            string.Equals(action.Action, proposal.Action, StringComparison.OrdinalIgnoreCase));
        if (legalAction == null)
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Automation Lab stopped because the proposed action is not legal at the detected prompt."],
            };
        }

        if (proposal.Confidence < MinAutomationLabConfidence)
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Automation Lab stopped because planner confidence is too low."],
            };
        }

        if (legalAction.Destructive)
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Automation Lab still blocks destructive actions."],
            };
        }

        if (legalAction.RequiresConfirmation &&
            !proposal.Action.Equals("N", StringComparison.OrdinalIgnoreCase))
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Automation Lab blocks affirmative confirmation actions until a higher-level strategy approves them."],
            };
        }

        var reasons = new List<string>
        {
            "Action is legal at the detected prompt.",
            "Automation Lab is enabled, so state-changing and recommendation-only gates are relaxed for disposable test games.",
        };
        if (legalAction.StateChanging)
            reasons.Add("This action can change game state.");
        if (legalAction.RequiresConfirmation)
            reasons.Add("This action declines a confirmation prompt.");
        if (!string.Equals(legalAction.Risk, "low", StringComparison.OrdinalIgnoreCase))
            reasons.Add($"Risk is {legalAction.Risk}.");

        return new GameAgentCopilotValidation
        {
            Status = "accepted",
            AutoSendAllowed = true,
            Reasons = reasons,
        };
    }

    private static string ResolvePromptRaw(string currentPrompt, IReadOnlyList<GameAgentEvent> recentEvents)
    {
        GameAgentEvent? promptEvent = recentEvents
            .Where(evt => evt.Kind == GameAgentEventKind.ServerPrompt)
            .Reverse()
            .FirstOrDefault();

        string raw = promptEvent == null
            ? currentPrompt
            : FirstNonEmpty(promptEvent.PlainText, promptEvent.PromptSurface, currentPrompt);

        return Normalize(raw);
    }

    private static string DetectPrompt(string raw)
    {
        string text = Normalize(raw);
        string lower = text.ToLowerInvariant();

        if (lower.Contains("your offer [", StringComparison.Ordinal))
            return "Trade/Haggle";
        if (lower.Contains("select (h)olo scan", StringComparison.Ordinal))
            return "ScanChoice";
        if (lower.Contains("confirmed? (y/n)", StringComparison.Ordinal) ||
            lower.Contains("do you want instructions", StringComparison.Ordinal) ||
            lower.Contains("do you want to engage the transwarp drive", StringComparison.Ordinal) ||
            lower.Contains("do you want to make this jump blind", StringComparison.Ordinal) ||
            lower.Contains("all systems ready, shall we engage", StringComparison.Ordinal) ||
            lower.Contains("do you wish to abort", StringComparison.Ordinal))
        {
            return "SpecialConfirmation";
        }
        if (lower.Contains("enter your choice", StringComparison.Ordinal))
            return "Port";
        if (lower.StartsWith("computer command", StringComparison.Ordinal) || string.Equals(text, "Computer", StringComparison.OrdinalIgnoreCase))
            return "Computer";
        if (lower.StartsWith("planet command", StringComparison.Ordinal) || string.Equals(text, "Planet", StringComparison.OrdinalIgnoreCase))
            return "Planet";
        if (lower.StartsWith("citadel command", StringComparison.Ordinal) || string.Equals(text, "Citadel", StringComparison.OrdinalIgnoreCase))
            return "Citadel";
        if (lower.StartsWith("corporate command", StringComparison.Ordinal) || string.Equals(text, "Corporate", StringComparison.OrdinalIgnoreCase))
            return "Corporate";
        if (lower.StartsWith("stardock command", StringComparison.Ordinal) || string.Equals(text, "Stardock", StringComparison.OrdinalIgnoreCase))
            return "Stardock";
        if (lower.StartsWith("attack", StringComparison.Ordinal) || lower.StartsWith("combat", StringComparison.Ordinal))
            return "Combat";
        if (lower.StartsWith("command", StringComparison.Ordinal) || string.Equals(text, "Command", StringComparison.OrdinalIgnoreCase))
            return "Command";

        return string.IsNullOrWhiteSpace(text) ? "Unknown" : text;
    }

    private static IReadOnlyList<GameAgentCopilotLegalAction> LegalActionsFor(string prompt)
        => prompt switch
        {
            "Command" =>
            [
                Action("?", "Show command help", "Command"),
                Action("/", "Quick stats", "Command"),
                Action("D", "Re-display current sector", "Command"),
                Action("S", "Open long-range scan choice", "ScanChoice"),
                Action("C", "Open ship computer", "Computer"),
                Action("P", "Port and trade", "Port", risk: "medium", stateChanging: true),
                Action("L", "Land on a planet", "Planet", risk: "medium", stateChanging: true),
                Action("A", "Attack enemy ship", "Combat", risk: "high", requiresConfirmation: true, stateChanging: true, destructive: true, recommendationOnly: true),
                Action("Q", "Quit and exit", "SpecialConfirmation", risk: "high", requiresConfirmation: true, stateChanging: true, recommendationOnly: true),
            ],
            "ScanChoice" =>
            [
                Action("H", "Holo scan", "Command"),
                Action("D", "Density scan", "Command"),
                Action("Q", "Quit scan prompt", "Command"),
            ],
            "Computer" =>
            [
                Action("?", "Show computer help", "Computer"),
                Action("R", "Port report", "Computer", inputType: "sector_or_default"),
                Action("X", "List current avoids", "Computer"),
                Action("Q", "Exit computer", "Command"),
                Action("V", "Manage avoided sectors", "Computer", risk: "medium", stateChanging: true),
                Action("B", "Begin self destruct", "SpecialConfirmation", risk: "high", requiresConfirmation: true, stateChanging: true, destructive: true, recommendationOnly: true),
            ],
            "Planet" =>
            [
                Action("D", "Display planet", "Planet"),
                Action("Q", "Leave planet", "Command", stateChanging: true),
                Action("C", "Enter citadel", "Citadel"),
                Action("T", "Take or leave product", "Planet", risk: "medium", stateChanging: true),
                Action("S", "Load or unload colonists", "Planet", risk: "medium", stateChanging: true),
                Action("Z", "Try to destroy planet", "SpecialConfirmation", risk: "high", requiresConfirmation: true, stateChanging: true, destructive: true, recommendationOnly: true),
            ],
            "Citadel" =>
            [
                Action("S", "Scan this sector", "Citadel"),
                Action("I", "Personal info", "Citadel"),
                Action("Q", "Leave citadel", "Planet", stateChanging: true),
                Action("C", "Open ship computer", "Computer"),
                Action("T", "Treasury fund transfer", "Citadel", risk: "medium", stateChanging: true),
                Action("P", "Planetary TransWarp", "SpecialConfirmation", risk: "high", requiresConfirmation: true, stateChanging: true, recommendationOnly: true),
            ],
            "Port" =>
            [
                Action("Q", "Quit port menu", "Command"),
                Action("T", "Trade at port", "Trade/Haggle", risk: "medium", stateChanging: true),
                Action("R", "Rob or steal", "Port", risk: "high", stateChanging: true, destructive: true, recommendationOnly: true),
                Action("A", "Attack port", "Combat", risk: "high", requiresConfirmation: true, stateChanging: true, destructive: true, recommendationOnly: true),
            ],
            "Trade/Haggle" =>
            [
                Action("*", "Accept default offer", "Port", risk: "medium", stateChanging: true),
                Action("Q", "Quit negotiation if accepted by prompt", "Port", risk: "medium"),
            ],
            "SpecialConfirmation" =>
            [
                Action("N", "Decline or abort confirmation", string.Empty),
                Action("Y", "Accept confirmation", string.Empty, risk: "high", requiresConfirmation: true, stateChanging: true, recommendationOnly: true),
            ],
            "Corporate" =>
            [
                Action("?", "Show corporate help", "Corporate"),
                Action("Q", "Exit corporate menu", "Command"),
            ],
            "Stardock" =>
            [
                Action("?", "Show Stardock help", "Stardock"),
                Action("Q", "Exit Stardock menu", "Command"),
            ],
            "Combat" =>
            [
                Action("Q", "Abort combat flow if accepted by prompt", "Command", risk: "medium"),
            ],
            _ => [],
        };

    private static GameAgentCopilotProposal BuildProposal(string prompt, IReadOnlyList<GameAgentCopilotLegalAction> legalActions)
    {
        if (legalActions.Count == 0)
        {
            return new GameAgentCopilotProposal
            {
                Reason = "No legal actions are known for the detected prompt.",
                Risk = "high",
                Confidence = 0,
            };
        }

        string preferred = prompt switch
        {
            "Command" => "/",
            "ScanChoice" => "H",
            "Computer" => "R",
            "Planet" => "D",
            "Citadel" => "S",
            "Port" => "Q",
            "Trade/Haggle" => "Q",
            "SpecialConfirmation" => "N",
            _ => legalActions[0].Action,
        };

        GameAgentCopilotLegalAction selected = legalActions.FirstOrDefault(action =>
            string.Equals(action.Action, preferred, StringComparison.OrdinalIgnoreCase)) ?? legalActions[0];

        return new GameAgentCopilotProposal
        {
            Action = selected.Action,
            Reason = ReasonFor(prompt, selected),
            ExpectedPrompt = selected.ExpectedPrompt,
            Risk = selected.Risk,
            Confidence = selected.Risk == "low" ? 0.82 : 0.68,
        };
    }

    private static GameAgentCopilotValidation Validate(GameAgentCopilotProposal proposal, IReadOnlyList<GameAgentCopilotLegalAction> legalActions)
    {
        GameAgentCopilotLegalAction? legalAction = legalActions.FirstOrDefault(action =>
            string.Equals(action.Action, proposal.Action, StringComparison.OrdinalIgnoreCase));

        if (legalAction == null)
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Action is not legal at the current prompt."],
            };
        }

        if (proposal.Confidence < MinRecommendationConfidence)
        {
            return new GameAgentCopilotValidation
            {
                Status = "rejected",
                Reasons = ["Planner confidence is too low even for recommendation."],
            };
        }

        var reasons = new List<string>();
        bool autoSendAllowed = true;
        if (proposal.Confidence < MinAutoSendConfidence)
        {
            reasons.Add("Planner confidence is below the auto-send threshold.");
            autoSendAllowed = false;
        }
        if (legalAction.RecommendationOnly)
        {
            reasons.Add("Action is marked recommendation-only.");
            autoSendAllowed = false;
        }
        if (legalAction.RequiresConfirmation)
        {
            reasons.Add("Action requires confirmation.");
            autoSendAllowed = false;
        }
        if (legalAction.StateChanging)
        {
            reasons.Add("State-changing actions are not auto-sendable by default.");
            autoSendAllowed = false;
        }
        if (legalAction.Destructive)
        {
            reasons.Add("Destructive actions are not auto-sendable.");
            autoSendAllowed = false;
        }
        if (legalAction.Risk != "low")
        {
            reasons.Add("Only low-risk actions are auto-sendable by default.");
            autoSendAllowed = false;
        }

        return new GameAgentCopilotValidation
        {
            Status = autoSendAllowed ? "accepted" : "recommendation_only",
            AutoSendAllowed = autoSendAllowed,
            Reasons = autoSendAllowed
                ? ["Action is legal and passes the auto-send safety gate."]
                : reasons,
        };
    }

    private static GameAgentCopilotLegalAction Action(
        string action,
        string label,
        string expectedPrompt,
        string inputType = "single_char",
        string risk = "low",
        bool requiresConfirmation = false,
        bool stateChanging = false,
        bool destructive = false,
        bool recommendationOnly = false)
        => new()
        {
            Action = action,
            Label = label,
            ExpectedPrompt = expectedPrompt,
            InputType = inputType,
            Risk = risk,
            RequiresConfirmation = requiresConfirmation,
            StateChanging = stateChanging,
            Destructive = destructive,
            RecommendationOnly = recommendationOnly,
        };

    private static string ReasonFor(string prompt, GameAgentCopilotLegalAction selected)
    {
        if (prompt == "Command" && selected.Action == "/")
            return "Refresh quick stats before making a state-changing decision.";
        if (prompt == "ScanChoice" && selected.Action.Equals("H", StringComparison.OrdinalIgnoreCase))
            return "Holo scan is a low-risk way to inspect adjacent sector details.";
        if (prompt == "SpecialConfirmation" && selected.Action.Equals("N", StringComparison.OrdinalIgnoreCase))
            return "Decline confirmation by default until a strategy layer explicitly approves it.";
        if (selected.RecommendationOnly || selected.Risk != "low")
            return $"{selected.Label} is legal, but should remain recommendation-only.";
        return $"{selected.Label} is a low-risk legal action at the current prompt.";
    }

    private static string FirstNonEmpty(params string[] values)
        => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? string.Empty;

    private static string Normalize(string? text)
        => (text ?? string.Empty).Replace("\r", string.Empty).Replace('\n', ' ').Trim();
}
