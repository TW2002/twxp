using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Avalonia;
using Avalonia.Platform;
using Avalonia.Platform.Storage;
using SkiaSharp;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    /// <summary>Connects using the current Host/Port already set in state.</summary>
    private void DoConnect()
        => _ = ConnectDirectTelnetAsync(reconnectIfConnected: true);

    private async Task<bool> ConnectDirectTelnetAsync(bool reconnectIfConnected)
    {
        var tab = CurrentMtcTabContext();
        if (_telnet.IsConnected)
        {
            if (!reconnectIfConnected)
                return true;
            _telnet.Disconnect();
        }

        _telnet.SetWindowSize(_buffer.Columns, _buffer.Rows);
        try
        {
            await _telnet.ConnectAsync(_state.Host, _state.Port);
            return true;
        }
        catch (Exception ex)
        {
            void Report()
            {
                _parser.Feed($"\x1b[1;31m[Connect failed: {ex.Message}]\x1b[0m\r\n");
                _buffer.Dirty = true;
            }

            if (Dispatcher.UIThread.CheckAccess())
            {
                if (tab is not null)
                    ExecuteInMtcTabSession(tab, Report);
                else
                    Report();
            }
            else
            {
                Dispatcher.UIThread.Post(() =>
                {
                    if (tab is not null)
                        ExecuteInMtcTabSession(tab, Report);
                    else
                        Report();
                });
            }

            return false;
        }
    }

    /// <summary>
    /// Connects in embedded proxy mode: creates a <see cref="Core.GameInstance"/>,
    /// wires it to the terminal via in-process pipes, and lets scripts / user
    /// interact before the game server connection is made.
    /// </summary>
    private async Task DoConnectEmbeddedAsync()
    {
        var owningTab = CurrentMtcTabContext();
        if (owningTab is null)
        {
            Core.GlobalModules.DebugLog("[MTC.ConnectEmbedded] refused ownerless embedded proxy start.\n");
            return;
        }

        Core.TwxRuntimeContext runtimeContext = owningTab.RuntimeContext;
        using IDisposable runtimeScope = Core.GlobalModules.UseRuntimeContext(runtimeContext);

        // Wait for any in-flight stop to fully complete so its cleanup cannot
        // race with our setup (e.g. fast Disconnect→Connect or Reconnect).
        await _pendingEmbeddedStop;
        RebindMtcTabSessionAfterAwait(owningTab);
        _pendingEmbeddedStop = Task.CompletedTask;

        // Stop an existing instance if somehow still attached.
        if (_gameInstance != null)
        {
            await StopEmbeddedAsync();
            RebindMtcTabSessionAfterAwait(owningTab);
        }

        // Derive game name first (needed for the game config path and database path).
        string gameName = GetEmbeddedGameName();
        if (string.IsNullOrWhiteSpace(gameName))
        {
            _parser.Feed("\x1b[1;31m[No game selected. Open or create a game before starting the embedded proxy.]\x1b[0m\r\n");
            _buffer.Dirty = true;
            return;
        }

        // Load (or create) the shared TWXP game config JSON.
        // This gives us the persisted variable state and the authoritative sector count.
        var gameConfig = await LoadOrCreateEmbeddedGameConfigAsync(gameName);
        RebindMtcTabSessionAfterAwait(owningTab);
        ApplyEmbeddedConnectionState(gameName, gameConfig);
        bool configChanged =
            !string.Equals(gameConfig.Name, gameName, StringComparison.Ordinal) ||
            gameConfig.Host != _state.Host ||
            gameConfig.Port != _state.Port ||
            gameConfig.Sectors != _state.Sectors ||
            gameConfig.ListenPort != _state.ListenPort ||
            (gameConfig.Mtc?.ListenForConnections ?? false) != _state.ListenForConnections ||
            !string.Equals(gameConfig.DatabasePath, AppPaths.TwxproxyDatabasePathForGame(gameName), StringComparison.OrdinalIgnoreCase) ||
            gameConfig.AutoReconnect != _state.AutoReconnect;
        gameConfig = BuildEmbeddedGameConfigFromState(gameName, gameConfig);
        gameConfig.DatabasePath = AppPaths.TwxproxyDatabasePathForGame(gameName);
        if (configChanged)
        {
            await SaveEmbeddedGameConfigAsync(gameName, gameConfig);
            RebindMtcTabSessionAfterAwait(owningTab);
        }
        _embeddedGameConfig = gameConfig;
        _embeddedGameName = gameName;
        _currentProfilePath = AppPaths.TwxproxyGameConfigFileFor(gameName);
        SyncMombotRuntimeConfigFromTwxpCfg(gameConfig);
        ApplySessionLogSettings(gameConfig);

        // Open / create the session database using sectors from the game config.
        OpenSessionDatabase(gameName, gameConfig.Sectors, useSharedProxyDatabase: true);

        // Resolve the effective script directory from the MTC-wide preference first,
        // then fall back to older per-game state only when no app-level setting exists.
        string effectiveScriptDir = ResolveEffectiveScriptDirectory(gameConfig.ScriptDirectory);

        // Create the script interpreter.
        string programDir = AppPaths.ProgramDir;
        var interpreter = new Core.ModInterpreter();
        interpreter.ScriptDirectory = effectiveScriptDir;
        interpreter.ProgramDir      = programDir;
        Core.GlobalModules.ProgramDir = programDir;  // shared global used by some script commands
        ApplyDebugLoggingPreferences();

        // Embedded mode needs a live menu manager so OPENMENU pauses and displays
        // configuration menus (same behavior as TWXP ProxyService startup).
        Core.GlobalModules.TWXMenu = new Core.MenuManager(runtimeContext);

        // Load previously saved variables (excluding session-startup flags).
        gameConfig.Variables = NormalizeEmbeddedVariables(gameConfig.Variables);

        var varsToLoad = new System.Collections.Generic.Dictionary<string, string>(gameConfig.Variables, StringComparer.OrdinalIgnoreCase);
        varsToLoad.Remove("$gfile_chk");
        varsToLoad.Remove("$doRelog");
        ApplySessionStartupVarDefaults(varsToLoad);
        Core.ScriptRef.LoadVarsForGame(runtimeContext, varsToLoad);

        // When savevar is called, persist the value into the TWXP game config JSON.
        Core.ScriptRef.SetOnVariableSaved(runtimeContext, (varName, value) =>
        {
            if (string.Equals(varName, "$gfile_chk", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(varName, "$doRelog",   StringComparison.OrdinalIgnoreCase))
                return;
            gameConfig.Variables[varName] = value;
            GameConfigService.RequestVariablesSave(gameName, gameConfig.Variables);
        });

        SyncMombotSpecialSectorVarsFromDatabase(persist: true);
        BackfillScriptMombotBootstrapState(gameConfig, gameName, programDir);

        // Create GameInstance. MTC always attaches its own direct client; the TCP
        // listener is only started when the profile explicitly enables it.
        var gi = new Core.GameInstance(
            gameName,
            _state.Host,
            _state.Port,
            listenPort: gameConfig.ListenPort,
            commandChar: gameConfig.CommandChar == '\0' ? '$' : gameConfig.CommandChar,
            interpreter: interpreter,
            scriptDirectory: effectiveScriptDir,
            runtimeContext: runtimeContext)
        {
            Verbose       = false,          // suppress diagnostic Console.WriteLine in embedded mode
            AutoReconnect = _state.AutoReconnect,
        };
        gi.Logger.LogDirectory = AppPaths.GetDebugLogDir(effectiveScriptDir);
        gi.Logger.SetLogIdentity(gameName);
        gi.ReconnectDelayMs = Math.Max(1, gameConfig.ReconnectDelaySeconds) * 1000;
        gi.LocalEcho = gameConfig.LocalEcho;
        gi.AcceptExternal = gameConfig.AcceptExternal;
        gi.AllowLerkers = gameConfig.AllowLerkers;
        gi.ExternalAddress = gameConfig.ExternalAddress ?? string.Empty;
        gi.BroadCastMsgs = gameConfig.BroadcastMessages;
        ApplyNetworkWatchdogPreferences(gi);
        gi.Logger.LogEnabled = false;
        gi.Logger.LogData = false;
        gi.Logger.LogAnsiCompanion = gameConfig.LogAnsiCompanion;
        gi.Logger.LogANSI = gameConfig.LogAnsiCompanion ? false : gameConfig.LogAnsi;
        gi.Logger.BinaryLogs = gameConfig.LogBinary;
        gi.Logger.NotifyPlayCuts = gameConfig.NotifyPlayCuts;
        gi.Logger.MaxPlayDelay = gameConfig.MaxPlayDelay;
        gi.SeedShipStatus(BuildShipStatusSeedFromCurrentState());
        gi.SetNativeHaggleEnabled(gameConfig.NativeHaggleEnabled, Core.NativeHaggleChangeSource.Config);
        Core.GlobalModules.DebugLog(
            $"[MTC] Embedded haggle startup prefsPortMode={ResolveGlobalPortHaggleMode()} prefsPlanetMode={ResolveGlobalPlanetHaggleMode()} legacyGameMode={gameConfig.NativeHaggleMode ?? "-"}\n");
        gi.SetNativeHaggleModes(ResolveGlobalPortHaggleMode(), ResolveGlobalPlanetHaggleMode());
        Action<bool, Core.NativeHaggleChangeSource> nativeHaggleChangedHandler =
            (enabled, source) =>
            {
                if (owningTab is not null && owningTab.Id != Volatile.Read(ref _activeMtcTabId))
                    return;

                ExecuteInOptionalMtcTabSession(owningTab, () => OnNativeHaggleChanged(enabled, source));
            };
        Action nativeHaggleStatsChangedHandler =
            () =>
            {
                if (owningTab is not null && owningTab.Id != Volatile.Read(ref _activeMtcTabId))
                    return;

                ExecuteInOptionalMtcTabSession(owningTab, OnNativeHaggleStatsChanged);
            };
        Action<Core.ShipStatus> shipStatusUpdatedHandler =
            status =>
            {
                if (owningTab is not null && owningTab.Id != _activeMtcTabId)
                {
                    ExecuteInMtcTabBackgroundContext(
                        owningTab,
                        () =>
                        {
                            ApplyShipStatusToTabState(owningTab, status, notifyChanged: false, observeAgent: false);
                            MarkMtcTabVisualStateDirty(owningTab, infoPanels: true, statusBar: true);
                        });
                    return;
                }

                if (owningTab is not null)
                {
                    RequestCoalescedMtcTabShipStatusRefresh(owningTab, status, "embedded.shipstatus");
                    return;
                }

                ExecuteInOptionalMtcTabSession(null, () => OnShipStatusUpdated(status));
            };
        if (owningTab is not null)
        {
            owningTab.EmbeddedNativeHaggleChangedHandler = nativeHaggleChangedHandler;
            owningTab.EmbeddedNativeHaggleStatsChangedHandler = nativeHaggleStatsChangedHandler;
            owningTab.EmbeddedShipStatusUpdatedHandler = shipStatusUpdatedHandler;
        }
        gi.NativeHaggleChanged += nativeHaggleChangedHandler;
        gi.NativeHaggleStatsChanged += nativeHaggleStatsChangedHandler;
        gi.ShipStatusUpdated += shipStatusUpdatedHandler;
        gi.NativeBotActivator = (botConfig, requestedBotName) =>
        {
            Dispatcher.UIThread.Post(async () => await ExecuteInOptionalMtcTabSessionAsync(owningTab, async () =>
            {
                if (_gameInstance != null &&
                    !string.IsNullOrWhiteSpace(_gameInstance.ActiveBotName) &&
                    !_mombot.Enabled)
                {
                    StopActiveExternalBotCore(publishStopMessage: false);
                }

                if (_mombot.Enabled)
                    return;

                await StartInternalMombotAsync(
                    botConfig,
                    requestedBotName,
                    interactiveOfflinePrompt: false,
                    publishMissingGameMessage: false);
            }));
            return true;
        };
        gi.NativeBotStopper = _ =>
        {
            Core.BotConfig? activeBotConfig = !string.IsNullOrWhiteSpace(gi.ActiveBotName)
                ? gi.GetBotConfig(gi.ActiveBotName)
                : null;
            if (Core.ProxyMenuCatalog.IsNativeBotConfig(activeBotConfig))
                gi.ActiveBotName = string.Empty;

            Dispatcher.UIThread.Post(async () => await ExecuteInOptionalMtcTabSessionAsync(owningTab, async () =>
            {
                await _runtimeStopGate.WaitAsync();
                try
                {
                    bool shipDestroyed = HasNativeMombotShipDestroyedFlag();
                    bool doNotResuscitate = HasNativeMombotDoNotResuscitateFlag();
                    bool disconnectServerAfterStop = !shipDestroyed && !doNotResuscitate;
                    Core.GlobalModules.DebugLog(
                        $"[MTC.NativeBotStopper] stop requested disconnectAfterStop={disconnectServerAfterStop} shipDestroyed={shipDestroyed} dnr={doNotResuscitate}\n");
                    Core.GlobalModules.FlushDebugLog();

                    await StopInternalMombotCoreAsync(
                        publishStopMessage: false,
                        suppressMissingGameMessage: true,
                        disconnectServerAfterStop: disconnectServerAfterStop);
                }
                finally
                {
                    _runtimeStopGate.Release();
                }
            }));
            return true;
        };
        gi.NativeBotRebooter = _ =>
        {
            Dispatcher.UIThread.Post(async () => await ExecuteInOptionalMtcTabSessionAsync(owningTab, async () =>
            {
                Core.BotConfig rebootBotConfig = LoadConfiguredBotSections()
                    .First(bot => bot.IsNative)
                    .Config;
                Core.GlobalModules.DebugLog(
                    $"[MTC.NativeBotReboot] begin enabled={_mombot.Enabled} connected={(_gameInstance?.IsConnected ?? false)} bot='{rebootBotConfig?.Name ?? string.Empty}'\n");
                Core.GlobalModules.FlushDebugLog();

                try
                {
                    await _runtimeStopGate.WaitAsync();
                    try
                    {
                        if (_mombot.Enabled)
                        {
                            await StopInternalMombotCoreAsync(
                                publishStopMessage: false,
                                suppressMissingGameMessage: true);
                        }
                    }
                    finally
                    {
                        _runtimeStopGate.Release();
                    }

                    Core.GlobalModules.DebugLog(
                        $"[MTC.NativeBotReboot] starting bot='{rebootBotConfig?.Name ?? string.Empty}' connected={(_gameInstance?.IsConnected ?? false)}\n");
                    Core.GlobalModules.FlushDebugLog();
                    await StartInternalMombotAsync(
                        rebootBotConfig,
                        requestedBotName: string.Empty,
                        interactiveOfflinePrompt: false,
                        publishMissingGameMessage: false);

                    if (_mombot.Enabled)
                        PublishMombotLocalMessage("Mombot reboot complete.");

                    Core.GlobalModules.DebugLog(
                        $"[MTC.NativeBotReboot] complete enabled={_mombot.Enabled}\n");
                    Core.GlobalModules.FlushDebugLog();
                }
                catch (Exception ex)
                {
                    Core.GlobalModules.DebugLog(
                        $"[MTC.NativeBotReboot] failed: {ex}\n");
                    Core.GlobalModules.FlushDebugLog();
                    PublishMombotLocalMessage($"Mombot reboot failed: {ex.Message}");
                }
            }));
            return true;
        };
        gi.NativeBotCanAcceptLocalInput = () => _mombot.Enabled;
        gi.NativeBotLocalInputExecutor = input =>
            ExecuteInOptionalMtcTabSessionAsync(owningTab, () => ExecuteMombotRemoteInputAsync(input));
        gi.NativeBotHotkeyExecutor = keyByte =>
            ExecuteInOptionalMtcTabSessionAsync(owningTab, () => ExecuteMombotRemoteHotkeyAsync(keyByte));

        // Two in-process pipes for bidirectional communication.
        // serverToTerm: gi writes game output → MTC reads for the ANSI parser.
        // termToServer: MTC writes keystrokes → gi reads as "local client" input.
        var serverToTerm = new System.IO.Pipelines.Pipe(new System.IO.Pipelines.PipeOptions(
            pauseWriterThreshold: 16 * 1024 * 1024,
            resumeWriterThreshold: 8 * 1024 * 1024,
            minimumSegmentSize: 64 * 1024,
            useSynchronizationContext: false));
        var termToServer = new System.IO.Pipelines.Pipe(new System.IO.Pipelines.PipeOptions(
            pauseWriterThreshold: 1024 * 1024,
            resumeWriterThreshold: 512 * 1024,
            minimumSegmentSize: 4096,
            useSynchronizationContext: false));

        if (gameConfig.Mtc?.ListenForConnections == true)
        {
            await gi.StartAsync();
            RebindMtcTabSessionAfterAwait(owningTab);
        }

        // Wire the GameInstance to the pipe streams.
        gi.ConnectDirectClient(
            toTerminal:   serverToTerm.Writer.AsStream(),   // gi writes game output here
            fromTerminal: termToServer.Reader.AsStream());  // gi reads keystrokes from here

        _proxyCts = new CancellationTokenSource();
        var cts = _proxyCts;

        // Replace the keyboard -> telnet wiring with keyboard -> pipe. The
        // dedicated writer keeps Pipe.Flush off the UI thread while preserving
        // strict outbound input order.
        var termWriter = termToServer.Writer.AsStream();
        var terminalInputQueue = new BlockingCollection<byte[]>();
        var terminalInputThread = new Thread(() =>
        {
            try
            {
                foreach (byte[] data in terminalInputQueue.GetConsumingEnumerable(cts.Token))
                {
                    if (data.Length == 0)
                        continue;

                    termWriter.Write(data, 0, data.Length);
                    termWriter.Flush();
                }
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                Core.GlobalModules.DebugLog($"[MTC.ConnectEmbedded] terminal input writer failed: {ex.Message}\n");
            }
        })
        {
            IsBackground = true,
            Name = "MTC embedded input writer"
        };
        terminalInputThread.Start();

        SetTerminalInputHandler(bytes =>
        {
            ExecuteInOptionalMtcTabSession(owningTab, () => RouteTerminalInput(bytes, data =>
            {
                if (data.Length == 0 || cts.IsCancellationRequested)
                    return;

                try { terminalInputQueue.Add(data.ToArray(), cts.Token); }
                catch (OperationCanceledException) { }
                catch (InvalidOperationException) { }
            }));
        });

        // Background task: pipe-reader → AnsiParser.
        var termReader = serverToTerm.Reader.AsStream();

        _ = Task.Run(async () =>
        {
            using var runtimeScope = Core.GlobalModules.UseRuntimeContext(runtimeContext);
            var buf = new byte[64 * 1024];
            try
            {
                while (!cts.Token.IsCancellationRequested)
                {
                    int n = await termReader.ReadAsync(buf, 0, buf.Length, cts.Token).ConfigureAwait(false);
                    if (n == 0) break;
                    var chunk = buf[..n].ToArray();
                    bool terminalDeaf = IsEmbeddedTerminalClientDeaf(owningTab);

                    byte[] artifactFilteredChunk = FilterTerminalDisplayArtifacts(owningTab, chunk);
                    byte[] displayChunk = artifactFilteredChunk;
                    if (displayChunk.Length > 0)
                        EnqueueDisplayChunk(owningTab, displayChunk, force: terminalDeaf);
                    if (!terminalDeaf && artifactFilteredChunk.Length > 0)
                        QueueSessionLogChunk(owningTab, artifactFilteredChunk);
                }
            }
            catch (OperationCanceledException) { }
            catch { }
        }, cts.Token);

        // Wire ServerDataReceived → trigger engine + ShipInfoParser + AutoRecorder.
        // Mirrors ProxyService.ServerDataReceived: splits on \r (TW2002 line terminator),
        // fires TextLineEvent / TextEvent / ActivateTriggers for each complete line,
        // and uses Pascal prompt semantics for partial prompts.
        var serverLineBuf = new System.Text.StringBuilder();
        var serverAnsiLineBuf = new System.Text.StringBuilder();
        bool serverScriptInAnsi = false;
        string lastDispatchedPartialLine = string.Empty;
        string lastDispatchedPartialAnsiLine = string.Empty;

        object serverDataSync = new();
        const int MaxQueuedEmbeddedUiObserverLines = 64;

        bool ShouldQueueEmbeddedUiObserverLine(string strippedLine, string ansiLine, bool isPrompt, ref bool queuedOnlineCapture)
        {
            string trimmed = strippedLine.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                return queuedOnlineCapture || owningTab?.CapturingOnlinePlayers == true;

            if (IsGameAgentWindowActive(owningTab))
                return true;

            if (isPrompt ||
                LooksLikeAgentPrompt(trimmed) ||
                IsSessionTerminationWarningLine(trimmed) ||
                TryGetMombotPromptNameFromLine(trimmed, out _))
            {
                return true;
            }

            if (IsOnlinePlayersHeaderLine(strippedLine))
            {
                queuedOnlineCapture = true;
                if (owningTab is not null)
                {
                    owningTab.CapturingOnlinePlayers = true;
                    owningTab.OnlinePlayersCaptureSawPlayer = false;
                }
                return true;
            }

            if (queuedOnlineCapture || owningTab?.CapturingOnlinePlayers == true)
                return true;

            if (owningTab?.AwaitingComputerShipTypeLine == true ||
                (trimmed.StartsWith("Computer command [TL=", StringComparison.OrdinalIgnoreCase) && trimmed.EndsWith(';')))
            {
                return true;
            }

            if (trimmed.EndsWith(" enters the game.", StringComparison.OrdinalIgnoreCase) ||
                trimmed.EndsWith(" exits the game.", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (!string.IsNullOrEmpty(ansiLine) && Core.AnsiCodes.TryParseCommMessageLine(ansiLine, out _))
                return true;

            if (TryNormalizeCommEventLine(strippedLine, ansiLine, out _))
                return true;

            return _appPrefs.EnableRedAlertMode &&
                (trimmed.StartsWith("Shipboard Computers", StringComparison.Ordinal) ||
                 trimmed.Contains("is powering up weapons systems!", StringComparison.Ordinal));
        }

        void ProcessEmbeddedQueuedUiObserverLine(string strippedLine, string ansiLine, bool isPrompt)
        {
            if (owningTab is not null && owningTab.Id != Volatile.Read(ref _activeMtcTabId))
            {
                ExecuteInMtcTabBackgroundContext(owningTab, () =>
                    ProcessEmbeddedQueuedStateObserverLine(strippedLine, ansiLine, isPrompt));
                return;
            }

            if (string.IsNullOrWhiteSpace(strippedLine))
            {
                ObserveOnlinePlayersLine(strippedLine);
                return;
            }

            if (!string.IsNullOrWhiteSpace(strippedLine))
            {
                ObserveGameAgentServerLine(strippedLine, ansiLine, isPrompt);
                ObserveComputerShipTypeLine(strippedLine);
                ObserveOnlinePlayersLine(strippedLine);
                if (!HandlePotentialCommLine(ansiLine))
                    HandlePotentialGameEventLine(strippedLine, ansiLine);
                SyncMombotPromptStateFromLine(strippedLine, ansiLine);
                ObserveEmbeddedKeepaliveWatchLine(strippedLine);
                ObserveNativeMombotWatchLine(strippedLine);
            }
        }

        void ProcessEmbeddedQueuedStateObserverLine(string strippedLine, string ansiLine, bool isPrompt)
        {
            if (string.IsNullOrWhiteSpace(strippedLine))
            {
                ObserveOnlinePlayersLine(strippedLine);
                return;
            }

            ObserveComputerShipTypeLine(strippedLine);
            ObserveOnlinePlayersLine(strippedLine);
            SyncMombotPromptVarsFromLine(runtimeContext, strippedLine);
            ObserveEmbeddedKeepaliveWatchLine(strippedLine, gi);
        }

        void ObserveNativeMombotServerLine(string strippedLine)
        {
            var tabMombot = owningTab?.Mombot ?? _mombot;

            if (string.IsNullOrWhiteSpace(strippedLine) ||
                !tabMombot.ObserveServerLine(strippedLine, observeWatcher: _appPrefs.EnableRedAlertMode))
            {
                return;
            }

            if (owningTab is not null && owningTab.Id != Volatile.Read(ref _activeMtcTabId))
            {
                MarkMtcTabVisualStateDirty(owningTab, infoPanels: true, statusBar: true);
                return;
            }

            PostToMtcTabSession(owningTab, () =>
            {
                RefreshMombotUi();
                RequestStatusBarRefresh();
                RebuildProxyMenu();
                _buffer.Dirty = true;
            });
        }

        void ProcessEmbeddedServerData(string text, bool allowUiObservers, bool queueUiObservers = false)
        {
            List<(string Stripped, string Ansi, bool IsPrompt)>? queuedUiObserverLines =
                queueUiObservers && owningTab is not null ? [] : null;
            bool queuedOnlineCapture = owningTab?.CapturingOnlinePlayers == true;

            void QueueEmbeddedUiObserverLine(string strippedLine, string ansiLine, bool isPrompt)
            {
                if (queuedUiObserverLines is null ||
                    queuedUiObserverLines.Count >= MaxQueuedEmbeddedUiObserverLines ||
                    !ShouldQueueEmbeddedUiObserverLine(strippedLine, ansiLine, isPrompt, ref queuedOnlineCapture))
                {
                    return;
                }

                queuedUiObserverLines.Add((strippedLine, ansiLine, isPrompt));
            }

            lock (serverDataSync)
            {
                if (allowUiObservers)
                    MarkGameTrafficActivity();
                else if (owningTab is not null)
                    Volatile.Write(ref owningTab.LastGameTrafficTicks, Stopwatch.GetTimestamp());

                string ansiChunk = Core.AnsiCodes.PrepareScriptAnsiText(text);
                string plainChunk = Core.AnsiCodes.StripANSIStateful(ansiChunk, ref serverScriptInAnsi);

                serverLineBuf.Append(plainChunk);
                serverAnsiLineBuf.Append(ansiChunk);

                string buffered = serverLineBuf.ToString();
                string bufferedAnsi = serverAnsiLineBuf.ToString();
                int searchPos = 0;
                int ansiSearchPos = 0;
                int lastProcessedPos = 0;
                int lastAnsiProcessedPos = 0;

                while (searchPos < buffered.Length)
                {
                    int crPos = buffered.IndexOf('\r', searchPos);

                    if (crPos == -1)
                    {
                        // No complete line yet — remainder is a partial line / prompt.
                        string remainder = buffered[lastProcessedPos..];
                        string remainderAnsi = bufferedAnsi[lastAnsiProcessedPos..];
                        serverLineBuf.Clear();
                        serverLineBuf.Append(remainder);
                        serverAnsiLineBuf.Clear();
                        serverAnsiLineBuf.Append(remainderAnsi);

                        if (!string.IsNullOrEmpty(remainder))
                        {
                            string scriptRemainder = remainder;
                            bool alreadyDispatchedPartial =
                                string.Equals(scriptRemainder, lastDispatchedPartialLine, StringComparison.Ordinal) &&
                                string.Equals(remainderAnsi, lastDispatchedPartialAnsiLine, StringComparison.Ordinal);

                            if (!alreadyDispatchedPartial)
                            {
                                lastDispatchedPartialLine = scriptRemainder;
                                lastDispatchedPartialAnsiLine = remainderAnsi;

                                string strippedRemainder = Core.AnsiCodes.NormalizeTerminalText(scriptRemainder);
                                Core.GlobalModules.GlobalAutoRecorder.ProcessPrompt(strippedRemainder, remainderAnsi);
                                if (allowUiObservers)
                                    ObserveGameAgentServerLine(strippedRemainder, remainderAnsi, isPrompt: true);
                                else
                                    QueueEmbeddedUiObserverLine(strippedRemainder, remainderAnsi, isPrompt: true);
                                if (Core.GlobalModules.GlobalAutoRecorder.CurrentSector > 0)
                                    Core.ScriptRef.SetCurrentSector(runtimeContext, Core.GlobalModules.GlobalAutoRecorder.CurrentSector);
                                bool nativeHaggleResponded = gi.ProcessNativeHaggleLine(strippedRemainder);
                                Core.ScriptRef.SetCurrentAnsiLine(remainderAnsi);
                                Core.ScriptRef.SetCurrentLine(scriptRemainder);
                                // Server prompts and partial lines must keep flowing to the interpreter
                                // even while a proxy menu is open, otherwise waitfor/text triggers stall.
                                // Match Pascal TWX here: partial prompts go through AutoTextEvent
                                // and then TextEvent only. They do not fire TextLineEvent and do
                                // not re-activate triggers until a full CR-terminated line is processed.
                                interpreter.DispatchPartialLine(scriptRemainder, remainderAnsi, false);
                                if (!string.IsNullOrWhiteSpace(strippedRemainder))
                                {
                                    if (allowUiObservers)
                                    {
                                        ObserveComputerShipTypeLine(strippedRemainder);
                                        ObserveOnlinePlayersLine(strippedRemainder);
                                        SyncMombotPromptStateFromLine(strippedRemainder, remainderAnsi);
                                        ObserveEmbeddedKeepaliveWatchLine(strippedRemainder);
                                        ObserveNativeMombotWatchLine(strippedRemainder);
                                    }
                                    else
                                    {
                                        SyncMombotPromptVarsFromLine(runtimeContext, strippedRemainder);
                                        ObserveEmbeddedKeepaliveWatchLine(strippedRemainder, gi);
                                    }
                                }
                                if (nativeHaggleResponded)
                                {
                                    serverLineBuf.Clear();
                                    lastDispatchedPartialLine = string.Empty;
                                    lastDispatchedPartialAnsiLine = string.Empty;
                                }
                            }
                        }
                        break;
                    }

                    // Complete \r-terminated line.
                    int ansiCrPos = bufferedAnsi.IndexOf('\r', ansiSearchPos);
                    if (ansiCrPos == -1)
                        break;

                    string lineRaw = bufferedAnsi[lastAnsiProcessedPos..(ansiCrPos + 1)];
                    string lineForScript = NormalizeLegacyInterrogLineForScripts(buffered[lastProcessedPos..crPos]);
                    string lineStripped = Core.AnsiCodes.NormalizeTerminalText(lineForScript);
                    lastDispatchedPartialLine = string.Empty;
                    lastDispatchedPartialAnsiLine = string.Empty;

                    if (!string.IsNullOrEmpty(lineStripped))
                    {
                        gi.FeedShipStatusLine(lineStripped);
                        Core.GlobalModules.GlobalAutoRecorder.RecordLine(lineStripped, lineRaw);
                        if (allowUiObservers)
                            ObserveGameAgentServerLine(lineStripped, lineRaw, isPrompt: false);
                        else
                            QueueEmbeddedUiObserverLine(lineStripped, lineRaw, isPrompt: false);
                        if (Core.GlobalModules.GlobalAutoRecorder.CurrentSector > 0)
                            Core.ScriptRef.SetCurrentSector(runtimeContext, Core.GlobalModules.GlobalAutoRecorder.CurrentSector);
                        if (allowUiObservers)
                        {
                            ObserveComputerShipTypeLine(lineStripped);
                            ObserveOnlinePlayersLine(lineStripped);
                        }
                    }

                    gi.History.ProcessLine(lineStripped);
                    gi.ProcessNativeHaggleLine(lineStripped);
                    if (allowUiObservers)
                    {
                        if (!HandlePotentialCommLine(lineRaw))
                            HandlePotentialGameEventLine(lineStripped, lineRaw);
                    }
                    Core.ScriptRef.SetCurrentAnsiLine(lineRaw);
                    Core.ScriptRef.SetCurrentLine(lineForScript);

                    // Real server lines must continue to advance script waits/triggers even if a
                    // proxy menu is open locally.
                    interpreter.DispatchCompleteLine(lineForScript, lineRaw, false);

                    if (!string.IsNullOrWhiteSpace(lineStripped))
                    {
                        if (allowUiObservers)
                        {
                            SyncMombotPromptStateFromLine(lineStripped, lineRaw);
                            ObserveEmbeddedKeepaliveWatchLine(lineStripped);
                            ObserveNativeMombotWatchLine(lineStripped);
                        }
                        else
                        {
                            SyncMombotPromptVarsFromLine(runtimeContext, lineStripped);
                            ObserveEmbeddedKeepaliveWatchLine(lineStripped, gi);
                        }

                        ObserveNativeMombotServerLine(lineStripped);
                    }

                    searchPos = crPos + 1;
                    lastProcessedPos = searchPos;
                    ansiSearchPos = ansiCrPos + 1;
                    lastAnsiProcessedPos = ansiSearchPos;
                }

                if (lastProcessedPos >= buffered.Length)
                {
                    serverLineBuf.Clear();
                    lastDispatchedPartialLine = string.Empty;
                    lastDispatchedPartialAnsiLine = string.Empty;
                    string ansiRemainder = lastAnsiProcessedPos < bufferedAnsi.Length
                        ? bufferedAnsi[lastAnsiProcessedPos..]
                        : string.Empty;
                    serverAnsiLineBuf.Clear();
                    if (ansiRemainder.Length > 0)
                        serverAnsiLineBuf.Append(ansiRemainder);
                }
            }

            if (queuedUiObserverLines is { Count: > 0 } && owningTab is not null)
            {
                var capturedUiObserverLines = queuedUiObserverLines.ToArray();
                Dispatcher.UIThread.Post(() =>
                {
                    ExecuteInOptionalMtcTabSession(owningTab, () =>
                    {
                        foreach (var item in capturedUiObserverLines)
                            ProcessEmbeddedQueuedUiObserverLine(item.Stripped, item.Ansi, item.IsPrompt);
                    });
                }, DispatcherPriority.Background);
            }
        }

        gi.ServerDataReceived += (_, e) =>
        {
            bool activeAtReceive = owningTab is not null && owningTab.Id == _activeMtcTabId;
            if (owningTab is not null)
            {
                ExecuteInMtcTabBackgroundContext(
                    owningTab,
                    () => ProcessEmbeddedServerData(e.Text, allowUiObservers: false, queueUiObservers: activeAtReceive));
                return;
            }

            ExecuteInOptionalMtcTabSession(
                owningTab,
                () => ProcessEmbeddedServerData(e.Text, allowUiObservers: true));
        };

        // Wire Connected / Disconnected events.
        // Note: OnGameConnected() was already called when the proxy started; we only need to
        // update game-connection state (status bar, _state.Connected) here.
        gi.Connected += (_, _) =>
        {
            bool wasConnected = owningTab is not null
                ? Interlocked.Exchange(ref owningTab.EmbeddedServerConnectedState, 1) == 1
                : _state.Connected;
            if (owningTab is not null)
                owningTab.State.Connected = true;

            Dispatcher.UIThread.Post(() => ExecuteInOptionalMtcTabSession(owningTab, () =>
            {
                _state.Connected = true;
                SetTerminalConnected(true);
                if (!wasConnected)
                {
                    ObserveGameAgentConnectionChanged(connected: true);
                    OnGameConnected();
                    _ = ExecuteInOptionalMtcTabSessionAsync(owningTab, () => TryAutoStartNativeBotAsync("server-connect"));
                    _parser.Feed($"\x1b[1;32m[Connected to {_state.Host}:{_state.Port}]\x1b[0m\r\n");
                }
                RefreshStatusBar();
                _buffer.Dirty = true;
            }));
        };

        gi.Disconnected += (_, _) =>
        {
            bool wasConnected = owningTab is not null
                ? Interlocked.Exchange(ref owningTab.EmbeddedServerConnectedState, 0) == 1
                : _state.Connected;
            if (owningTab is not null)
                owningTab.State.Connected = false;

            ExecuteInOptionalMtcTabSession(owningTab, () =>
            {
                bool stopNativeMombot = _mombot.Enabled && ShouldStopNativeMombotAfterDisconnect();
                bool nativeMombotWillRelog = _mombot.Enabled && !stopNativeMombot && ShouldNativeMombotAutoRelog();
                if (nativeMombotWillRelog)
                {
                    gi.AutoReconnect = true;
                    gi.StartReconnectIfNeeded();
                }

                if (stopNativeMombot)
                {
                    SuppressNativeMombotRelogState(
                        preserveDoNotResuscitate: true,
                        preserveShipDestroyed: HasNativeMombotShipDestroyedFlag());
                }

                // Fire 'Connection Lost' so scripts can re-register triggers, etc.
                interpreter.ProgramEvent("Connection Lost", "", false);
                Dispatcher.UIThread.Post(() => ExecuteInOptionalMtcTabSession(owningTab, () =>
                {
                    _state.Connected = false;
                    if (wasConnected)
                        ObserveGameAgentConnectionChanged(connected: false);
                    if (wasConnected)
                    {
                        var disconnectMessage = Encoding.UTF8.GetBytes(
                            nativeMombotWillRelog
                                ? $"\r\n\x1b[1;31m[MTC] Game server disconnected from {_state.Host}:{_state.Port}. Native relog is active; reconnect attempts will continue until Mombot/relog is stopped.\x1b[0m\r\n"
                                : $"\r\n\x1b[1;31m[MTC] Game server disconnected from {_state.Host}:{_state.Port}. Session is closed; type $c to reconnect.\x1b[0m\r\n");
                        EnqueueDisplayChunk(owningTab, disconnectMessage, force: true);
                    }
                    // In embedded mode the proxy is still alive after a server
                    // disconnect, so keep the terminal "connected" unless the
                    // GameInstance itself is being torn down.
                    bool proxyStillRunning = _gameInstance?.IsRunning == true;
                    SetTerminalConnected(proxyStillRunning);
                    OnGameDisconnected();
                    RefreshStatusBar();
                    _buffer.Dirty = true;
                }));

                if (_mombot.Enabled)
                    Dispatcher.UIThread.Post(async () => await ExecuteInOptionalMtcTabSessionAsync(owningTab, HandleNativeMombotDisconnectAsync));

                if (stopNativeMombot)
                    Dispatcher.UIThread.Post(async () => await ExecuteInOptionalMtcTabSessionAsync(owningTab, StopNativeMombotAfterDisconnectAsync));
            });
        };

        // Wire getinput / getconsoleinput input buffering — mirrors what ProxyService does.
        // LocalDataReceived fires byte-by-byte; we accumulate into lines and call
        // interpreter.LocalInputEvent(line) when Enter arrives.
        var getInputBuffer = new System.Text.StringBuilder();
        object getInputBufferSync = new();

        void RunLocalInputBufferAction(Action action)
        {
            if (owningTab is not null)
            {
                ExecuteInMtcTabBackgroundContext(owningTab, action);
                return;
            }

            using var inputScope = Core.GlobalModules.UseRuntimeContext(runtimeContext);
            action();
        }

        gi.ClearInputBufferRequested += (_, _) =>
            RunLocalInputBufferAction(() =>
            {
                lock (getInputBufferSync)
                    getInputBuffer.Clear();
            });

        gi.LocalDataReceived += (_, e) =>
        {
            RunLocalInputBufferAction(() =>
            {
                lock (getInputBufferSync)
                {
                    // Backspace / DEL
                    if (e.Data.Length == 1 && (e.Data[0] == 8 || e.Data[0] == 127))
                    {
                        if (getInputBuffer.Length > 0)
                            getInputBuffer.Length--;
                        return;
                    }

                    string text = e.Text;
                    getInputBuffer.Append(text);

                    // Keypress mode: fire immediately on any printable character.
                    if (interpreter.HasKeypressInputWaiting && getInputBuffer.Length > 0)
                    {
                        string key = getInputBuffer.ToString();
                        getInputBuffer.Clear();
                        interpreter.LocalInputEvent(key);
                        return;
                    }

                    // Not waiting for input and connected -- discard the buffer so stale
                    // data doesn't trigger a line event next time getinput is active.
                    if (gi.IsConnected && !interpreter.IsAnyScriptWaitingForInput())
                    {
                        getInputBuffer.Clear();
                        return;
                    }

                    // Full-line getinput: deliver when Enter (\r or \n) arrives.
                    if (getInputBuffer.ToString().Contains('\r') || getInputBuffer.ToString().Contains('\n'))
                    {
                        string line = getInputBuffer.ToString().TrimEnd('\r', '\n');
                        getInputBuffer.Clear();
                        // Blank Enter is a valid response for getinput/getconsoleinput and
                        // must be delivered to scripts to preserve TWX27 behavior.
                        interpreter.LocalInputEvent(line);
                    }
                }
            });
        };

        gi.ScriptStopped += (_, _) =>
        {
            bool activeTab = owningTab is null || owningTab.Id == Volatile.Read(ref _activeMtcTabId);
            if (activeTab)
            {
                Dispatcher.UIThread.Post(() => ExecuteInOptionalMtcTabSession(owningTab, () =>
                {
                    RefreshStatusBar();
                    RebuildProxyMenu();
                }));
            }

            ExecuteInOptionalMtcTabSession(owningTab, () =>
            {
                _mombot.HandleObservedScriptStop();
                ScheduleNativeMombotStartupWatch(owningTab);
                HandleNativeMombotPostLoginScriptStop();
            });
        };

        gi.ScriptLoaded += (_, _) =>
        {
            if (owningTab is not null && owningTab.Id != Volatile.Read(ref _activeMtcTabId))
                return;

            ExecuteInOptionalMtcTabSession(owningTab, CancelPendingMombotInteractivePromptRedraw);

            Dispatcher.UIThread.Post(() => ExecuteInOptionalMtcTabSession(owningTab, () =>
            {
                RefreshStatusBar();
                RebuildProxyMenu();
            }));
        };

        gi.ClientTypeChanged += (_, e) =>
        {
            if (e.ClientIndex != EmbeddedLocalClientIndex)
                return;

            if (owningTab is not null && owningTab.Id != Volatile.Read(ref _activeMtcTabId))
            {
                ExecuteInMtcTabBackgroundContext(
                    owningTab,
                    () => SyncEmbeddedTerminalClientTypeStateOnly(owningTab, e.ClientType));
                return;
            }

            Dispatcher.UIThread.Post(() => ExecuteInOptionalMtcTabSession(owningTab, () => SyncEmbeddedTerminalClientType(e.ClientType)));
        };

        _gameInstance = gi;
        ApplyEmbeddedTerminalOutputMode();
        SyncEmbeddedTerminalClientType(gi.GetClientType(EmbeddedLocalClientIndex));
        ReloadRegisteredBotConfigs();
        SyncMombotRuntimeConfigFromTwxpCfg(gameConfig);
        _mombot.AttachSession(gi, _sessionDb, interpreter, GetOrCreateEmbeddedMombotConfig(gameConfig));
        gi.ServerDataSent += (_, e) =>
        {
            if (owningTab is not null)
            {
                ExecuteInMtcTabBackgroundContext(owningTab, () => _mombot.ObserveOutboundText(e.Text));
                return;
            }

            using var outboundScope = Core.GlobalModules.UseRuntimeContext(runtimeContext);
            _mombot.ObserveOutboundText(e.Text);
        };
        RefreshStatusBar();
        Core.ScriptRef.SetActiveGameInstance(runtimeContext, gi);  // routes getinput through the pipe, not the system console
        await LoadEmbeddedExpansionModulesAsync(gameName, programDir, effectiveScriptDir, gi, interpreter);
        RebindMtcTabSessionAfterAwait(owningTab);
        OnNativeHaggleChanged(gi.NativeHaggleEnabled, Core.NativeHaggleChangeSource.Config);
        AppPaths.EnsureDirectories();

        // The proxy is now running. Scripts can execute and communicate with the user
        // before any server connection is made. The server connection is triggered by
        // the $c command (typed by the user or called from a script via the connect command).
        SetTerminalConnected(true);
        OnGameDisconnected();   // proxy is live, but the game server is not connected yet
        _parser.Feed($"\x1b[1;32m[Embedded proxy ready — type \x1b[1;33m$c\x1b[1;32m to connect to {_state.Host}:{_state.Port}, or start a script]\x1b[0m\r\n");
        _buffer.Dirty = true;
        await TryAutoStartNativeBotAsync("open-game");
        RebindMtcTabSessionAfterAwait(owningTab);
        if (owningTab is null || owningTab.Id == _activeMtcTabId)
            RefreshActiveMtcTabUiStateScoped();
    }

    private void ApplyNetworkWatchdogPreferences(Core.GameInstance? gameInstance = null)
    {
        gameInstance ??= _gameInstance;
        if (gameInstance == null)
            return;

        gameInstance.StaleLocalInputProbeEnabled = _appPrefs.StaleConnectionProbeEnabled;
        gameInstance.LocalInputResponseTimeoutSeconds = AppPreferences.NormalizeNetworkWatchdogSeconds(
            _appPrefs.StaleConnectionProbeTimeoutSeconds,
            AppPreferences.DefaultLocalInputResponseTimeoutSeconds);
        gameInstance.GameIdleKeepaliveEnabled = _appPrefs.GameIdleKeepaliveEnabled;
        gameInstance.GameIdleKeepaliveIntervalSeconds = AppPreferences.NormalizeNetworkWatchdogSeconds(
            _appPrefs.GameIdleKeepaliveIntervalSeconds,
            AppPreferences.DefaultGameIdleKeepaliveIntervalSeconds);
    }

    /// <summary>Stops the embedded <see cref="Core.GameInstance"/> and restores normal state.
    /// Must be awaited (not fire-and-forget) from DoConnectEmbeddedAsync to avoid races.</summary>
    private Task StopEmbeddedAsync()
    {
        lock (_embeddedStopSync)
        {
            if (_pendingEmbeddedStop.IsCompleted)
                _pendingEmbeddedStop = StopEmbeddedSerializedAsync();

            return _pendingEmbeddedStop;
        }
    }

    private async Task StopEmbeddedSerializedAsync()
    {
        var owningTab = ResolveCurrentMtcTabContext();
        await _runtimeStopGate.WaitAsync();
        RebindMtcTabSessionAfterAwait(owningTab);
        try
        {
            await StopEmbeddedCoreAsync();
            RebindMtcTabSessionAfterAwait(owningTab);
        }
        finally
        {
            _runtimeStopGate.Release();
        }
    }

    private async Task StopEmbeddedCoreAsync()
    {
        var owningTab = ResolveCurrentMtcTabContext();
        TraceRuntimeStop($"[MTC.StopEmbedded] begin game={_embeddedGameName ?? "-"} hasGame={(_gameInstance != null)} nativeMombot={_mombot.Enabled} externalBot={_gameInstance?.ActiveBotName ?? string.Empty}");
        _proxyCts?.Cancel();
        _proxyCts = null;

        var gi = _gameInstance;
        bool hadActiveBot = _mombot.Enabled || !string.IsNullOrWhiteSpace(gi?.ActiveBotName);
        if (hadActiveBot)
        {
            TraceRuntimeStop($"[MTC.StopEmbedded] draining active bots before proxy stop");
            await StopActiveBotCoreAsync(
                publishNativeStopMessage: false,
                publishExternalStopMessage: false,
                suppressMissingGameMessage: true);
            RebindMtcTabSessionAfterAwait(owningTab);
        }

        _gameInstance = null;
        if (gi != null && owningTab is not null)
        {
            if (owningTab.EmbeddedNativeHaggleChangedHandler is not null)
                gi.NativeHaggleChanged -= owningTab.EmbeddedNativeHaggleChangedHandler;
            if (owningTab.EmbeddedNativeHaggleStatsChangedHandler is not null)
                gi.NativeHaggleStatsChanged -= owningTab.EmbeddedNativeHaggleStatsChangedHandler;
            if (owningTab.EmbeddedShipStatusUpdatedHandler is not null)
                gi.ShipStatusUpdated -= owningTab.EmbeddedShipStatusUpdatedHandler;

            owningTab.EmbeddedNativeHaggleChangedHandler = null;
            owningTab.EmbeddedNativeHaggleStatsChangedHandler = null;
            owningTab.EmbeddedShipStatusUpdatedHandler = null;
        }
        await DisposeEmbeddedExpansionModulesAsync();
        RebindMtcTabSessionAfterAwait(owningTab);
        if (gi != null)
        {
            TraceRuntimeStop($"[MTC.StopEmbedded] awaiting GameInstance.StopAsync");
            await gi.StopAsync();  // no ConfigureAwait(false) — continuation returns to UI thread
            RebindMtcTabSessionAfterAwait(owningTab);
        }
        _mombot.DetachSession();
        _terminalLivePaused = false;
        if (owningTab is { } tab)
            tab.TerminalLivePaused = false;
        ClearPausedTerminalChunks(owningTab);
        UpdateTerminalLiveSelector();

        Core.TwxRuntimeContext? runtimeContext = owningTab?.RuntimeContext ?? gi?.RuntimeContext ?? ActiveMtcRuntimeContext;
        Core.ScriptRef.SetActiveGameInstance(runtimeContext, null);
        Core.ScriptRef.SetOnVariableSaved(runtimeContext, null);  // detach savevar persistence for this game
        if (!string.IsNullOrWhiteSpace(_embeddedGameName))
            await GameConfigService.FlushVariablesAsync(_embeddedGameName);
        _embeddedGameConfig = null;
        _embeddedGameName = null;
        ApplyDebugLoggingPreferences();

        try { _sessionDb?.CloseDatabase(); } catch { }
        _sessionDb = null;
        _gameFileLock?.Dispose();
        _gameFileLock = null;
        Core.ScriptRef.SetActiveDatabase(runtimeContext, null);
        ApplyJsonRpcPreferences();

        // Restore default keyboard → telnet wiring (runs on UI thread, no Dispatcher.Post needed).
        SetTerminalInputHandler(bytes => RouteTerminalInput(bytes, SendToTelnet));

        _state.Connected      = false;
        SetTerminalConnected(false);
        OnGameDisconnected();
        _parser.Feed("\x1b[1;31m[Embedded proxy stopped]\x1b[0m\r\n");
        RefreshStatusBar();
        UpdateHaggleToggleState();
        _buffer.Dirty = true;
        TraceRuntimeStop($"[MTC.StopEmbedded] complete game={_embeddedGameName ?? "-"}");
    }

    private async Task LoadEmbeddedExpansionModulesAsync(
        string gameName,
        string programDir,
        string scriptDirectory,
        Core.GameInstance gameInstance,
        Core.ModInterpreter interpreter)
    {
        var owningTab = ResolveCurrentMtcTabContext();
        await DisposeEmbeddedExpansionModulesAsync();
        RebindMtcTabSessionAfterAwait(owningTab);

        try
        {
            _moduleHost = await Core.ExpansionModuleHost.CreateAsync(new Core.ExpansionModuleHostOptions
            {
                HostTargets = Core.ExpansionHostTargets.Mtc,
                HostName = "MTC",
                GameName = gameName,
                ProgramDir = programDir,
                ScriptDirectory = scriptDirectory,
                ModuleDataRootDirectory = AppPaths.ModuleDataDir,
                ModuleDirectories = new[]
                {
                    AppPaths.ModulesDir,
                    Core.SharedPaths.LegacyModulesDir,
                },
                GameInstance = gameInstance,
                Interpreter = interpreter,
                Database = _sessionDb,
            });
            RebindMtcTabSessionAfterAwait(owningTab);
            RegisterEmbeddedModuleMenuCommands(
                owningTab,
                gameName,
                programDir,
                scriptDirectory,
                gameInstance,
                interpreter);

            Core.GlobalModules.DebugLog(
                $"[MTC.ModuleHost] Loaded {_moduleHost.LoadedModules.Count} module(s) for game '{gameName}'.\n");
        }
        catch (Exception ex)
        {
            _moduleHost = null;
            Core.GlobalModules.DebugLog($"[MTC.ModuleHost] Failed to initialize modules: {ex}\n");
        }
    }

    private async Task DisposeEmbeddedExpansionModulesAsync()
    {
        var owningTab = ResolveCurrentMtcTabContext();
        DisposeEmbeddedModuleMenuCommands();
        Core.ExpansionModuleHost? moduleHost = _moduleHost;
        _moduleHost = null;

        if (moduleHost == null)
            return;

        try
        {
            await moduleHost.DisposeAsync();
            RebindMtcTabSessionAfterAwait(owningTab);
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.ModuleHost] Failed to dispose modules: {ex}\n");
        }
    }

    private void RegisterEmbeddedModuleMenuCommands(
        MtcTabPrototype? owningTab,
        string gameName,
        string programDir,
        string scriptDirectory,
        Core.GameInstance gameInstance,
        Core.ModInterpreter interpreter)
    {
        DisposeEmbeddedModuleMenuCommands();

        _moduleMenuRegistrations.Add(gameInstance.RegisterProxyMenuCommand(new Core.ProxyMenuCommand
        {
            Path = "MR",
            Description = "Reload modules",
            ExecuteAsync = async _ =>
            {
                await gameInstance.SendMessageAsync("\r\nReloading expansion modules...\r\n");
                await ExecuteInOptionalMtcTabSessionAsync(owningTab, async () =>
                {
                    await LoadEmbeddedExpansionModulesAsync(
                        gameName,
                        programDir,
                        scriptDirectory,
                        gameInstance,
                        interpreter);
                    int count = _moduleHost?.LoadedModules.Count ?? 0;
                    await gameInstance.SendMessageAsync($"Reloaded {count} expansion module(s).\r\n");
                    RefreshStatusBar();
                    RebuildProxyMenu();
                });

                return Core.ProxyMenuCommandResult.ExitMenu;
            },
        }));
    }

    private void DisposeEmbeddedModuleMenuCommands()
    {
        foreach (IDisposable registration in _moduleMenuRegistrations)
            registration.Dispose();

        _moduleMenuRegistrations.Clear();
    }
}
