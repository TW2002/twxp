namespace MTC;

internal sealed class MtcRpcPromptCommand
{
    public required string GameName { get; init; }
    public required string Prompt { get; init; }
    public required DateTimeOffset PromptTimestamp { get; init; }
    public required string Command { get; init; }
    public bool AppendEnter { get; init; }
}

internal static class MtcRpcPromptGuard
{
    // Call and send in the same UI dispatch, after any approval has completed.
    internal static void Validate(MtcRpcPromptCommand request, string gameName,
        bool connected, bool observerActive, IReadOnlyList<GameAgentEvent> events)
    {
        if (!connected || !observerActive || !string.Equals(request.GameName, gameName, StringComparison.Ordinal))
            throw new MtcRpcException(-32007, "Game connection or active observer changed.");

        var last = events.LastOrDefault(evt => evt.Kind is GameAgentEventKind.ServerLine or
            GameAgentEventKind.ServerPrompt or GameAgentEventKind.ClientInput or GameAgentEventKind.Disconnected);
        if (last == null || last.Kind != GameAgentEventKind.ServerPrompt ||
            last.Timestamp != request.PromptTimestamp ||
            !string.Equals(last.GameName, request.GameName, StringComparison.Ordinal) ||
            !string.Equals(last.PlainText, request.Prompt, StringComparison.Ordinal))
            throw new MtcRpcException(-32007, "Prompt changed or input was already sent; observe a new prompt.");
    }
}
