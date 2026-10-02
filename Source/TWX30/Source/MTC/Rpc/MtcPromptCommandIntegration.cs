using System.Text;

namespace MTC;

public partial class MainWindow
{
    private readonly Dictionary<string, DateTimeOffset> _rpcConsumedPrompts = new(StringComparer.Ordinal);

    private Task<MtcRpcActionResult> SendMtcRpcPromptCommandAsync(MtcRpcPromptCommand request)
        => InvokeMtcRpcUiAsync(() =>
        {
            MtcRpcPromptGuard.Validate(request, GetGameAgentGameName(), IsMtcRpcConnected(),
                IsGameAgentActiveForCurrentTab(), _gameAgent.GetRecentEvents(700));
            if (_rpcConsumedPrompts.TryGetValue(request.GameName, out var consumed) && consumed >= request.PromptTimestamp)
                throw new MtcRpcException(-32007, "This prompt was already consumed.");
            if (_termCtrl.SendInput == null)
                return Task.FromResult(MtcRpcActionResult.Fail("Terminal input is not available."));
            string payload = request.Command;
            if (request.AppendEnter && !payload.EndsWith('\r') && !payload.EndsWith('\n')) payload += "\r";
            // Consume before dispatch: a timeout or downstream exception must not
            // turn an uncertain send into a repeated game action.
            _rpcConsumedPrompts[request.GameName] = request.PromptTimestamp;
            _termCtrl.SendInput.Invoke(Encoding.Latin1.GetBytes(payload));
            return Task.FromResult(MtcRpcActionResult.Ok("Prompt response submitted."));
        });
}
