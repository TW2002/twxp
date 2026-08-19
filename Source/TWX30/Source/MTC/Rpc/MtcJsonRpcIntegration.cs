using System.Text;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private MtcJsonRpcServer? _jsonRpcServer;

    private void ApplyJsonRpcPreferences()
    {
        try
        {
            EmbeddedMtcJsonRpcConfig jsonRpcPrefs = GetCurrentJsonRpcConfig();
            bool shouldEnable = jsonRpcPrefs.Enabled &&
                                HasMtcJsonRpcGameContext(_embeddedGameConfig, _embeddedGameName, _sessionDb, _gameInstance);
            if (!shouldEnable && _jsonRpcServer == null)
                return;

            _jsonRpcServer ??= new MtcJsonRpcServer(BuildMtcRpcBridge());
            _jsonRpcServer.ApplyOptions(new MtcJsonRpcServerOptions
            {
                Enabled = shouldEnable,
                BindAddress = AppPreferences.NormalizeJsonRpcBindAddress(jsonRpcPrefs.BindAddress),
                Port = AppPreferences.NormalizeJsonRpcPort(jsonRpcPrefs.Port),
                AuthToken = AppPreferences.NormalizeJsonRpcAuthToken(jsonRpcPrefs.AuthToken),
                ApprovalLevel = MtcRpcApprovalLevels.Parse(jsonRpcPrefs.ApprovalLevel),
            });
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.JsonRpc] failed to apply preferences: {ex}\n");
            _parser.Feed($"\x1b[1;31m[JSON-RPC failed: {ex.Message}]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }
    }

    private EmbeddedMtcJsonRpcConfig GetCurrentJsonRpcConfig()
    {
        if (_embeddedGameConfig == null)
            return new EmbeddedMtcJsonRpcConfig();

        _embeddedGameConfig.Mtc ??= new EmbeddedMtcConfig();
        _embeddedGameConfig.Mtc.JsonRpc ??= new EmbeddedMtcJsonRpcConfig();
        return _embeddedGameConfig.Mtc.JsonRpc;
    }

    private static bool HasMtcJsonRpcGameContext(
        EmbeddedGameConfig? config,
        string? gameName,
        Core.ModDatabase? sessionDb,
        Core.GameInstance? gameInstance)
    {
        if (config != null || sessionDb != null || gameInstance != null)
            return true;

        string normalizedGameName = NormalizeGameName(gameName);
        return !string.IsNullOrWhiteSpace(normalizedGameName) &&
               !IsGeneratedPlaceholderGameName(normalizedGameName);
    }

    private MtcRpcBridge BuildMtcRpcBridge()
        => new()
        {
            GetContextAsync = BuildMtcRpcContextAsync,
            GetRecentEventsAsync = GetMtcRpcRecentEventsAsync,
            QuerySectorAsync = QueryMtcRpcSectorAsync,
            ListScriptsAsync = ListMtcRpcScriptsAsync,
            SendCommandAsync = SendMtcRpcCommandAsync,
            RunMombotCommandAsync = ExecuteGameAgentMombotCommandAsync,
            RunScriptAsync = RunMtcRpcScriptAsync,
            StopScriptAsync = StopMtcRpcScriptAsync,
            ApproveActionAsync = ApproveMtcRpcActionAsync,
        };

    private Task<GameAgentContextSnapshot> BuildMtcRpcContextAsync(int recentEventCount)
        => InvokeMtcRpcUiAsync(() =>
        {
            _gameAgent.SetGameName(GetGameAgentGameName());
            return Task.FromResult(_gameAgent.BuildContextSnapshot(
                _state,
                _sessionDb,
                BuildGameAgentBotSnapshot(),
                BuildGameAgentOnlinePlayersSnapshot(),
                BuildGameAgentRunningScriptsSnapshot(),
                recentEventCount));
        });

    private Task<IReadOnlyList<GameAgentEvent>> GetMtcRpcRecentEventsAsync(int limit, bool includeAnsi)
    {
        IReadOnlyList<GameAgentEvent> events = _gameAgent.GetRecentEvents(limit);
        if (includeAnsi)
            return Task.FromResult(events);

        IReadOnlyList<GameAgentEvent> stripped = events
            .Select(evt => new GameAgentEvent
            {
                Timestamp = evt.Timestamp,
                GameName = evt.GameName,
                Kind = evt.Kind,
                PlainText = evt.PlainText,
                AnsiText = string.Empty,
                CurrentSector = evt.CurrentSector,
                PromptSurface = evt.PromptSurface,
                Metadata = evt.Metadata,
            })
            .ToArray();
        return Task.FromResult(stripped);
    }

    private Task<GameAgentSectorSnapshot?> QueryMtcRpcSectorAsync(int sector)
        => InvokeMtcRpcUiAsync(() => Task.FromResult(GameAgentRuntime.BuildSectorSnapshot(_sessionDb, sector)));

    private async Task<IReadOnlyList<GameAgentRunningScriptSnapshot>> ListMtcRpcScriptsAsync()
    {
        GameAgentContextSnapshot context = await BuildMtcRpcContextAsync(recentEventCount: 0).ConfigureAwait(false);
        return context.RunningScripts;
    }

    private Task<MtcRpcActionResult> SendMtcRpcCommandAsync(string command, bool appendEnter)
        => InvokeMtcRpcUiAsync(() =>
        {
            if (!IsMtcRpcConnected())
                return Task.FromResult(MtcRpcActionResult.Fail("No active game connection."));

            string payload = command ?? string.Empty;
            if (appendEnter && !payload.EndsWith('\r') && !payload.EndsWith('\n'))
                payload += "\r";

            byte[] bytes = Encoding.Latin1.GetBytes(payload);
            if (_termCtrl.SendInput == null)
                return Task.FromResult(MtcRpcActionResult.Fail("Terminal input is not available."));

            _termCtrl.SendInput.Invoke(bytes);
            return Task.FromResult(MtcRpcActionResult.Ok("Command submitted through the MTC terminal input path.", new Dictionary<string, string>
            {
                ["bytes"] = bytes.Length.ToString(),
                ["appendEnter"] = appendEnter ? "true" : "false",
            }));
        });

    private Task<MtcRpcActionResult> RunMtcRpcScriptAsync(string script)
        => InvokeMtcRpcUiAsync(() =>
        {
            string scriptReference = (script ?? string.Empty).Trim().Replace('\\', '/');
            if (string.IsNullOrWhiteSpace(scriptReference))
                return Task.FromResult(MtcRpcActionResult.Fail("Script name is required."));

            Core.ModInterpreter? interpreter = CurrentInterpreter;
            bool remoteProxyScripts = interpreter == null && CanUseRemoteProxyScripts();
            if (interpreter == null && !remoteProxyScripts)
                return Task.FromResult(MtcRpcActionResult.Fail("Proxy scripts are not available for the current game."));

            try
            {
                if (interpreter != null)
                    Core.ProxyGameOperations.LoadScript(interpreter, scriptReference);
                else
                    SendProxyMenuCommand($"ss {scriptReference}");

                _parser.Feed($"\x1b[1;36m[JSON-RPC loaded script: {scriptReference}]\x1b[0m\r\n");
                _buffer.Dirty = true;
                RebuildProxyMenu();
                RebuildScriptsMenu();
                return Task.FromResult(MtcRpcActionResult.Ok("Script load requested.", new Dictionary<string, string>
                {
                    ["script"] = scriptReference,
                }));
            }
            catch (Exception ex)
            {
                return Task.FromResult(MtcRpcActionResult.Fail(ex.Message));
            }
        });

    private Task<MtcRpcActionResult> StopMtcRpcScriptAsync(int? id, string? name)
        => InvokeMtcRpcUiAsync(() =>
        {
            Core.ModInterpreter? interpreter = CurrentInterpreter;
            bool remoteProxyScripts = interpreter == null && CanUseRemoteProxyScripts();
            if (interpreter == null && !remoteProxyScripts)
                return Task.FromResult(MtcRpcActionResult.Fail("Proxy scripts are not available for the current game."));

            try
            {
                bool stopped;
                if (interpreter != null && id is { } scriptId)
                {
                    stopped = Core.ProxyGameOperations.StopScriptById(interpreter, scriptId);
                    return Task.FromResult(stopped
                        ? MtcRpcActionResult.Ok($"Script ID {scriptId} stopped.")
                        : MtcRpcActionResult.Fail($"Script ID {scriptId} was not found."));
                }

                if (interpreter != null && !string.IsNullOrWhiteSpace(name))
                {
                    stopped = Core.ProxyGameOperations.StopScriptByName(interpreter, name);
                    return Task.FromResult(stopped
                        ? MtcRpcActionResult.Ok($"Script '{name}' stopped.")
                        : MtcRpcActionResult.Fail($"Script '{name}' was not found."));
                }

                if (remoteProxyScripts && id is { } remoteId)
                {
                    SendProxyMenuCommand($"sk {remoteId}");
                    return Task.FromResult(MtcRpcActionResult.Ok($"Remote proxy kill requested for script ID {remoteId}."));
                }

                return Task.FromResult(MtcRpcActionResult.Fail("Stopping a remote script by name is not supported; use id."));
            }
            catch (Exception ex)
            {
                return Task.FromResult(MtcRpcActionResult.Fail(ex.Message));
            }
        });

    private Task<bool> ApproveMtcRpcActionAsync(string action, string details)
        => InvokeMtcRpcUiAsync(() => ShowConfirmAsync(
            "JSON-RPC Action Approval",
            $"{action}\n\n{details}\n\nAllow this JSON-RPC client action?",
            "Allow",
            "Reject"));

    private bool IsMtcRpcConnected()
        => _gameInstance?.IsConnected == true || _telnet.IsConnected;

    private Task<T> InvokeMtcRpcUiAsync<T>(Func<Task<T>> action)
    {
        var owner = ResolveCurrentMtcTabContext();
        var runtimeContext = Core.GlobalModules.CurrentContext;
        if (Dispatcher.UIThread.CheckAccess())
        {
            owner ??= FindMtcTabForRuntimeContext(runtimeContext) ?? ActiveMtcTab;
            return ExecuteInOptionalMtcTabSessionAsync(owner, action);
        }

        var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        Dispatcher.UIThread.Post(async () =>
        {
            try
            {
                var resolvedOwner = owner
                    ?? FindMtcTabForRuntimeContext(runtimeContext)
                    ?? ActiveMtcTab;
                tcs.SetResult(await ExecuteInOptionalMtcTabSessionAsync(resolvedOwner, action).ConfigureAwait(true));
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        });
        return tcs.Task;
    }
}
