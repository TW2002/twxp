using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Platform.Storage;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private const int MombotCommandHistoryLimit = 100;

    private void SyncMombotPromptStateFromLine(string line, string? ansiLine = null)
    {
        string trimmedLine = Core.AnsiCodes.NormalizeTerminalText(line).TrimStart();
        if (IsNativeMombotShipDestroyedLine(trimmedLine))
        {
            MarkNativeMombotShipDestroyed();
        }

        bool isGamePromptLine = TryGetMombotPromptNameFromLine(line, out string promptName);
        if (!isGamePromptLine)
        {
            CancelPendingMombotInteractivePromptRedraw();
            return;
        }

        if (isGamePromptLine)
        {
            _mombotObservedGamePromptVersion++;
            _mombotLastObservedGamePromptPlain = Core.AnsiCodes.NormalizeTerminalText(line).TrimEnd();
            _mombotLastObservedGamePromptAnsi = string.IsNullOrWhiteSpace(ansiLine)
                ? _mombotLastObservedGamePromptPlain
                : SanitizeObservedPromptForDisplay(ansiLine);
            SetMombotCurrentVars(promptName, "$PLAYER~CURRENT_PROMPT", "$PLAYER~startingLocation", "$bot~startingLocation");
            SetMombotCurrentVars("0", "$relogging", "$connectivity~relogging");

            // When a native Mombot interactive prompt is open, reclaim the bottom line
            // after the server returns to a stable command/citadel prompt. We debounce
            // the redraw so echoed game prompts do not repaint over report/scan output.
            if (HasMombotInteractiveState() &&
                (string.Equals(promptName, "Command", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(promptName, "Citadel", StringComparison.OrdinalIgnoreCase)))
            {
                ScheduleMombotInteractivePromptRedraw(_mombotObservedGamePromptVersion);
            }
        }
    }

    private static void SyncMombotPromptVarsFromLine(Core.TwxRuntimeContext? context, string line)
    {
        if (!TryGetMombotPromptNameFromLine(line, out string promptName))
            return;

        SetMombotCurrentVars(context, promptName, "$PLAYER~CURRENT_PROMPT", "$PLAYER~startingLocation", "$bot~startingLocation");
        SetMombotCurrentVars(context, "0", "$relogging", "$connectivity~relogging");
    }

    private static bool IsNativeMombotShipDestroyedLine(string trimmedLine)
    {
        if (trimmedLine.StartsWith("You will have to start over from scratch!", StringComparison.OrdinalIgnoreCase))
            return true;

        if (trimmedLine.StartsWith("You rush to an escape pod and abandon ship", StringComparison.OrdinalIgnoreCase))
            return true;

        return trimmedLine.StartsWith("Your ", StringComparison.OrdinalIgnoreCase) &&
            trimmedLine.EndsWith(" has been destroyed!", StringComparison.OrdinalIgnoreCase);
    }

    private static string SanitizeObservedPromptForDisplay(string text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        StringBuilder? sanitized = null;

        for (int index = 0; index < text.Length; index++)
        {
            char value = text[index];

            // Mombot's legacy prompt probe uses #145/#8. Keep those bytes available to the
            // script engine, but never replay them into the visible terminal prompt.
            if (value == '\x91')
            {
                sanitized ??= new StringBuilder(text.Length);
                if (index + 1 < text.Length && text[index + 1] == '\b')
                    index++;
                continue;
            }

            if (value == '\b')
            {
                sanitized ??= new StringBuilder(text.Length);
                continue;
            }

            sanitized?.Append(value);
        }

        return sanitized == null ? text : sanitized.ToString();
    }

    private void CancelPendingMombotInteractivePromptRedraw()
    {
        unchecked
        {
            _mombotMacroPromptRedrawTicket++;
        }
    }

    private const int MombotInteractivePromptRedrawMaxBacklogRetries = 25;

    private void ScheduleMombotInteractivePromptRedraw(int promptVersion, int backlogRetry = 0)
    {
        var owner = ResolveCurrentMtcTabContext();
        int ticket;
        unchecked
        {
            ticket = ++_mombotMacroPromptRedrawTicket;
        }

        _ = Task.Run(async () =>
        {
            await Task.Delay(120).ConfigureAwait(false);
            await Dispatcher.UIThread.InvokeAsync(() =>
            {
                ExecuteInOptionalMtcTabSession(owner, () =>
                {
                    if (ticket != _mombotMacroPromptRedrawTicket)
                        return;

                    if (!HasMombotInteractiveState())
                        return;

                    if (_mombotObservedGamePromptVersion != promptVersion)
                        return;

                    if (HasPendingTerminalDisplayBacklog())
                    {
                        if (backlogRetry < MombotInteractivePromptRedrawMaxBacklogRetries)
                        {
                            ScheduleMombotInteractivePromptRedraw(promptVersion, backlogRetry + 1);
                            return;
                        }

                        RedrawMombotPrompt(waitForTerminalBacklog: false);
                        return;
                    }

                    RedrawMombotPrompt();
                });
            }, DispatcherPriority.Background);
        });
    }

    private async Task RunNativeMombotKeepaliveTickAsync()
    {
        try
        {
            await Task.Yield();

            if (_gameInstance == null)
            {
                _mombotLastKeepaliveLine = string.Empty;
                return;
            }

            if (!_mombot.Enabled)
            {
                _mombotLastKeepaliveLine = string.Empty;
                return;
            }

            if (ShouldStopNativeMombotAfterDisconnect() || !ShouldNativeMombotAutoRelog())
            {
                _mombotLastKeepaliveLine = string.Empty;
                return;
            }

            if (!_gameInstance.IsConnected)
            {
                _mombotLastKeepaliveLine = string.Empty;
                await TriggerNativeMombotRelogAsync(relogMessage: string.Empty, disconnectFirst: false);
                return;
            }

            string currentLine = NormalizeMombotPromptComparisonValue(
                Core.ScriptRef.GetCurrentLine(CurrentMombotRuntimeContext()));
            if (string.IsNullOrWhiteSpace(currentLine))
                return;

            bool stuckPrompt = IsNativeMombotReconnectPrompt(currentLine);
            if (stuckPrompt)
            {
                await TriggerNativeMombotRelogAsync(
                    relogMessage: $"Stuck on baffling prompt: [{currentLine}], so I relogged.*",
                    disconnectFirst: true);
                _mombotLastKeepaliveLine = string.Empty;
                return;
            }

            if (IsNativeMombotRelogInProgress())
            {
                _mombotLastKeepaliveLine = string.Empty;
                return;
            }

            _mombotLastKeepaliveLine = currentLine;
        }
        finally
        {
            _mombotKeepaliveTickRunning = false;
        }
    }

    private void ObserveEmbeddedKeepaliveWatchLine(
        string line,
        Core.GameInstance? gameInstance = null)
    {
        gameInstance ??= _gameInstance;
        if (gameInstance == null ||
            !gameInstance.IsConnected ||
            !IsSessionTerminationWarningLine(line))
        {
            return;
        }

        _ = SendKeepaliveAsync(gameInstance, "embedded session termination warning");
    }

    private void ObserveNativeMombotWatchLine(string line)
    {
        if (_gameInstance == null || string.IsNullOrWhiteSpace(line))
            return;

        if (_gameInstance.IsConnected && IsSessionTerminationWarningLine(line))
            _ = SendKeepaliveAsync("native mombot session termination warning");

        if (!_mombot.Enabled ||
            (!_mombotStartupDataGatherPending && !_mombotStartupPostInitPending))
        {
            return;
        }

        ScheduleNativeMombotStartupWatch(ResolveCurrentMtcTabContext());
    }

    private void ScheduleNativeMombotStartupWatch(MtcTabPrototype? owner)
    {
        if (!_mombot.Enabled ||
            (!_mombotStartupDataGatherPending && !_mombotStartupPostInitPending))
        {
            return;
        }

        if (Interlocked.Exchange(ref _nativeMombotStartupWatchScheduled, 1) != 0)
            return;

        _ = Task.Run(async () =>
            await ExecuteInOptionalMtcTabSessionAsync(owner, RunNativeMombotStartupWatchAsync).ConfigureAwait(false));
    }

    private async Task RunNativeMombotStartupWatchAsync()
    {
        try
        {
            await TryRunNativeMombotInitialSettingsAsync();
            await FinalizeNativeMombotStartupAsync();
        }
        finally
        {
            Interlocked.Exchange(ref _nativeMombotStartupWatchScheduled, 0);
        }
    }

    private static bool IsSessionTerminationWarningLine(string line)
    {
        return !string.IsNullOrWhiteSpace(line) &&
            (line.Contains("Your session will be terminated in ", StringComparison.OrdinalIgnoreCase) ||
             line.Contains("You now have Thirty seconds until termination.", StringComparison.OrdinalIgnoreCase) ||
             line.Contains("Only TEN seconds remain.  Session termination is imminent.", StringComparison.OrdinalIgnoreCase));
    }

    private async Task SendKeepaliveAsync(string reason)
    {
        await SendKeepaliveAsync(_gameInstance, reason);
    }

    private async Task SendKeepaliveAsync(Core.GameInstance? gameInstance, string reason)
    {
        if (gameInstance == null || !gameInstance.IsConnected)
            return;

        Core.GlobalModules.DebugLog($"[MTC.Keepalive] Sending ANSI status-response keepalive for {reason}\n");
        await gameInstance.SendGameIdleKeepaliveAsync(reason);
    }

    private byte[] FilterTerminalDisplayArtifacts(byte[] chunk)
        => FilterTerminalDisplayArtifacts(ResolveCurrentMtcTabContext(), chunk);

    private byte[] FilterTerminalDisplayArtifacts(MtcTabPrototype? owner, byte[] chunk)
    {
        if (chunk.Length == 0)
            return chunk;

        object sync = owner?.TerminalDisplayArtifactSync ?? _terminalDisplayArtifactSync;
        lock (sync)
        {
            bool pendingTerminalSyncMarkerLeadByte =
                owner?.PendingTerminalSyncMarkerLeadByte ?? _pendingTerminalSyncMarkerLeadByte;
            bool pendingTerminalSyncMarkerUtf8LeadByte =
                owner?.PendingTerminalSyncMarkerUtf8LeadByte ?? _pendingTerminalSyncMarkerUtf8LeadByte;

            List<byte>? filtered = null;
            int index = 0;

            if (pendingTerminalSyncMarkerLeadByte)
            {
                pendingTerminalSyncMarkerLeadByte = false;

                if (chunk[0] == 0x08)
                {
                    filtered = new List<byte>(Math.Max(0, chunk.Length - 1));
                    index = 1;
                }
                else
                {
                    filtered = new List<byte>(chunk.Length);
                }
            }

            if (pendingTerminalSyncMarkerUtf8LeadByte)
            {
                pendingTerminalSyncMarkerUtf8LeadByte = false;

                if (index < chunk.Length && chunk[index] == 0x91)
                {
                    filtered ??= new List<byte>(chunk.Length);
                    index++;
                    if (index < chunk.Length && chunk[index] == 0x08)
                    {
                        index++;
                    }
                    else if (index >= chunk.Length)
                    {
                        pendingTerminalSyncMarkerLeadByte = true;
                    }
                }
                else
                {
                    filtered ??= new List<byte>(chunk.Length + 1);
                    filtered.Add(0xC2);
                }
            }

            for (; index < chunk.Length; index++)
            {
                byte value = chunk[index];

                if (value == 0xC2)
                {
                    if (index + 1 < chunk.Length)
                    {
                        if (chunk[index + 1] == 0x91)
                        {
                            filtered = EnsureTerminalDisplayFilteredBuffer(filtered, chunk, index);
                            index++;
                            if (index + 1 < chunk.Length && chunk[index + 1] == 0x08)
                                index++;
                            else if (index + 1 >= chunk.Length)
                                pendingTerminalSyncMarkerLeadByte = true;
                            continue;
                        }
                    }
                    else
                    {
                        filtered = EnsureTerminalDisplayFilteredBuffer(filtered, chunk, index);
                        pendingTerminalSyncMarkerUtf8LeadByte = true;
                        continue;
                    }
                }

                if (value == 0x91)
                {
                    filtered = EnsureTerminalDisplayFilteredBuffer(filtered, chunk, index);
                    if (index + 1 < chunk.Length)
                    {
                        if (chunk[index + 1] == 0x08)
                        {
                            index++;
                            continue;
                        }
                    }
                    else
                    {
                        pendingTerminalSyncMarkerLeadByte = true;
                        continue;
                    }

                    continue;
                }

                if (value == 0x1B &&
                    index + 6 < chunk.Length &&
                    chunk[index + 1] == (byte)'[' &&
                    chunk[index + 2] == (byte)'K' &&
                    chunk[index + 3] == 0x1B &&
                    chunk[index + 4] == (byte)'[' &&
                    chunk[index + 5] == (byte)'1' &&
                    chunk[index + 6] == (byte)'A')
                {
                    filtered = EnsureTerminalDisplayFilteredBuffer(filtered, chunk, index, 8);
                    filtered.Add(0x0D);
                    filtered.Add(0x1B);
                    filtered.Add((byte)'[');
                    filtered.Add((byte)'K');
                    filtered.Add(0x1B);
                    filtered.Add((byte)'[');
                    filtered.Add((byte)'1');
                    filtered.Add((byte)'A');
                    filtered.Add(0x0D);
                    filtered.Add(0x1B);
                    filtered.Add((byte)'[');
                    filtered.Add((byte)'K');
                    index += 6;
                    continue;
                }

                filtered?.Add(value);
            }

            if (owner is not null)
            {
                owner.PendingTerminalSyncMarkerLeadByte = pendingTerminalSyncMarkerLeadByte;
                owner.PendingTerminalSyncMarkerUtf8LeadByte = pendingTerminalSyncMarkerUtf8LeadByte;
            }
            else
            {
                _pendingTerminalSyncMarkerLeadByte = pendingTerminalSyncMarkerLeadByte;
                _pendingTerminalSyncMarkerUtf8LeadByte = pendingTerminalSyncMarkerUtf8LeadByte;
            }

            return filtered == null ? chunk : filtered.ToArray();
        }
    }

    private static List<byte> EnsureTerminalDisplayFilteredBuffer(
        List<byte>? filtered,
        byte[] chunk,
        int preserveLength,
        int extraCapacity = 0)
    {
        if (filtered != null)
            return filtered;

        var result = new List<byte>(chunk.Length + extraCapacity);
        for (int copyIndex = 0; copyIndex < preserveLength; copyIndex++)
            result.Add(chunk[copyIndex]);

        return result;
    }

    private bool ShouldNativeMombotAutoRelog()
    {
        if (!IsMombotTruthy(ReadCurrentMombotVar("0", "$BOT~DORELOG", "$doRelog")) ||
            HasNativeMombotShipDestroyedFlag())
        {
            return false;
        }

        return !ShouldPromptForMombotRelogSettings(BuildMombotRelogDefaults());
    }

    private bool IsNativeMombotRelogInProgress()
    {
        return HasNativeMombotRelogFlag() ||
               IsNativeMombotRelogScriptLoaded();
    }

    private bool HasNativeMombotRelogFlag()
    {
        return IsMombotTruthy(ReadCurrentMombotVar("0", "$relogging", "$connectivity~relogging"));
    }

    private void HandleNativeMombotPostLoginScriptStop()
    {
        string macro = ConsumeNativeMombotPostLoginMacro();
        if (string.IsNullOrWhiteSpace(macro))
            return;

        var owner = ResolveCurrentMtcTabContext();
        PostToMtcTabSessionAsync(owner, async () =>
        {
            for (int attempt = 0; attempt < 20; attempt++)
            {
                if (_gameInstance?.IsConnected == true && IsNativeMombotPostLoginReady())
                    break;

                await Task.Delay(100);
            }

            if (_gameInstance == null || !_gameInstance.IsConnected || !IsNativeMombotPostLoginReady())
            {
                lock (_nativeMombotPostLoginMacroLock)
                {
                    if (string.IsNullOrWhiteSpace(_pendingNativeMombotPostLoginMacro))
                        _pendingNativeMombotPostLoginMacro = macro;
                }

                Core.GlobalModules.DebugLog($"[MTC.NativeBotStart] deferred post-login macro='{macro}' because login is not ready\n");
                Core.GlobalModules.FlushDebugLog();
                return;
            }

            Core.GlobalModules.DebugLog($"[MTC.NativeBotStart] sending post-login macro='{macro}'\n");
            Core.GlobalModules.FlushDebugLog();
            await SendMombotServerMacroAsync(macro);
            PersistMombotVars(string.Empty, "$BOT~STARTMACRO", "$bot~startMacro", "$startMacro");
        });
    }

    private bool IsNativeMombotPostLoginReady()
    {
        if (IsMombotTruthy(ReadCurrentMombotVar("0", "$relogging", "$connectivity~relogging")))
            return false;

        string prompt = ReadCurrentMombotVar(string.Empty, "$PLAYER~CURRENT_PROMPT", "$PLAYER~startingLocation", "$bot~startingLocation");
        return string.Equals(prompt, "Command", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(prompt, "Citadel", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(prompt, "Planet", StringComparison.OrdinalIgnoreCase);
    }

    private void MarkNativeMombotShipDestroyed()
    {
        if (!HasNativeMombotShipDestroyedFlag())
        {
            Core.GlobalModules.DebugLog("[MTC.NativeBot] observed ship destroyed text; preserving return-after-destroyed state\n");
            Core.GlobalModules.FlushDebugLog();
        }

        PersistMombotVars("1", "$BOT~ISSHIPDESTROYED", "$bot~isShipDestroyed");
        PersistMombotVars("1", "$BOT~DO_NOT_RESUSCITATE", "$bot~do_not_resuscitate", "$do_not_resuscitate");
        SetMombotSessionVar("$BOT~ISSHIPDESTROYED", "1");
        SetMombotSessionVar("$bot~isShipDestroyed", "1");
        SetMombotSessionVar("$BOT~DO_NOT_RESUSCITATE", "1");
        SetMombotSessionVar("$bot~do_not_resuscitate", "1");
        SetMombotSessionVar("$do_not_resuscitate", "1");
    }

    private async Task TriggerNativeMombotRelogAsync(string relogMessage, bool disconnectFirst)
    {
        await Task.Yield();

        if (!_mombot.Enabled || _gameInstance == null || ShouldStopNativeMombotAfterDisconnect())
            return;

        if (!ShouldNativeMombotAutoRelog())
            return;

        if (IsNativeMombotRelogScriptLoaded())
            return;

        if (IsNativeMombotXenterReconnectInProgress())
        {
            Core.GlobalModules.DebugLog("[MTC.NativeBotRelog] suppressed relog command while xenter owns reconnect\n");
            Core.GlobalModules.FlushDebugLog();
            return;
        }

        if (HasNativeMombotRelogFlag())
        {
            string currentLine = NormalizeMombotPromptComparisonValue(
                Core.ScriptRef.GetCurrentLine(CurrentMombotRuntimeContext()));
            if (_gameInstance.IsConnected && !IsNativeMombotReconnectPrompt(currentLine))
                return;

            Core.GlobalModules.DebugLog("[MTC.NativeBotRelog] clearing stale relogging flag before relog trigger\n");
            Core.GlobalModules.FlushDebugLog();
            SetMombotCurrentVars("0", "$relogging", "$connectivity~relogging");
        }

        SetMombotCurrentVars("1", "$relogging", "$connectivity~relogging");
        if (!string.IsNullOrWhiteSpace(relogMessage))
            SetMombotCurrentVars(relogMessage, "$relog_message");

        if (disconnectFirst && _gameInstance.IsConnected)
            await _gameInstance.DisconnectFromServerAsync();

        await ExecuteMombotUiCommandAsync("relog");
    }

    private bool IsNativeMombotRelogScriptLoaded()
    {
        return IsNativeMombotScriptLoaded("relog.cts");
    }

    private bool IsNativeMombotXenterReconnectInProgress()
    {
        Core.ModInterpreter? interpreter = CurrentInterpreter;
        if (interpreter == null)
            return false;

        for (int i = 0; i < interpreter.Count; i++)
        {
            Core.Script? script = interpreter.GetScript(i);
            if (script == null)
                continue;

            string reference = (script.Compiler?.ScriptFile ?? script.LoadEventName ?? script.ScriptName)
                .Replace('\\', '/');
            if (reference.EndsWith("/xenter.cts", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(Path.GetFileName(reference), "xenter.cts", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(script.ScriptName, "xenter.cts", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            foreach (Core.ScriptTriggerInfo trigger in script.GetTriggerSnapshot())
            {
                if (ContainsXenterToken(trigger.Name) ||
                    ContainsXenterToken(trigger.LabelName))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool ContainsXenterToken(string value)
    {
        return !string.IsNullOrWhiteSpace(value) &&
               value.Contains("xenter", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsNativeMombotReconnectPrompt(string line)
    {
        string normalized = NormalizeMombotPromptComparisonValue(line);
        if (string.IsNullOrWhiteSpace(normalized))
            return false;

        string gameMenuPrompt = NormalizeMombotPromptComparisonValue(
            ReadCurrentMombotVar(string.Empty, "$GAME~GAME_MENU_PROMPT", "$GAME_MENU_PROMPT"));

        return (!string.IsNullOrWhiteSpace(gameMenuPrompt) &&
                string.Equals(normalized, gameMenuPrompt, StringComparison.OrdinalIgnoreCase)) ||
               string.Equals(normalized, "Enter your choice:", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(normalized, "Selection (? for menu):", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeMombotPromptComparisonValue(string value)
    {
        return Core.AnsiCodes.NormalizeTerminalText(value ?? string.Empty).Trim();
    }

    private string GetInitialMombotPromptName()
    {
        return GetMombotPromptSurface() switch
        {
            MombotPromptSurface.Command => "Command",
            MombotPromptSurface.Citadel => "Citadel",
            MombotPromptSurface.Planet => "Planet",
            _ => "Undefined",
        };
    }

    private static bool TryGetMombotPromptNameFromLine(string line, out string promptName)
    {
        promptName = string.Empty;
        if (string.IsNullOrWhiteSpace(line))
            return false;

        if (line.StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase))
        {
            promptName = "Command";
            return true;
        }

        if (line.StartsWith("Computer command [TL=", StringComparison.OrdinalIgnoreCase))
        {
            promptName = "Computer";
            return true;
        }

        if (line.StartsWith("Citadel command (", StringComparison.OrdinalIgnoreCase) ||
            line.Contains("<Enter Citadel>", StringComparison.OrdinalIgnoreCase) ||
            line.Contains("Citadel treasury contains", StringComparison.OrdinalIgnoreCase))
        {
            promptName = "Citadel";
            return true;
        }

        int commandIndex = line.IndexOf(" command (", StringComparison.OrdinalIgnoreCase);
        if (commandIndex > 0)
        {
            string candidate = line[..commandIndex].Trim();
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                promptName = candidate;
                return true;
            }
        }

        return false;
    }

    private Core.TwxRuntimeContext? CurrentMombotRuntimeContext()
        => ResolveCurrentMtcTabContext()?.RuntimeContext ?? _gameInstance?.RuntimeContext ?? ActiveMtcRuntimeContext;

    private void SetMombotCurrentVars(string value, params string[] names)
    {
        Core.TwxRuntimeContext? context = CurrentMombotRuntimeContext();
        SetMombotCurrentVars(context, value, names);
    }

    private static void SetMombotCurrentVars(Core.TwxRuntimeContext? context, string value, params string[] names)
    {
        foreach (string name in names)
            Core.ScriptRef.SetCurrentGameVar(context, name, value);
    }

    private void MirrorMombotCurrentVars(string fallback, params string[] names)
    {
        SetMombotCurrentVars(ReadCurrentMombotVar(fallback, names), names);
    }

    private string ReadCurrentMombotVar(string fallback, params string[] names)
    {
        Core.TwxRuntimeContext? context = CurrentMombotRuntimeContext();
        foreach (string name in names)
        {
            string value = Core.ScriptRef.GetCurrentGameVar(context, name, string.Empty);
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return fallback;
    }

    private string ReadNamedMombotVar(string name, string fallback)
        => Core.ScriptRef.GetCurrentGameVar(CurrentMombotRuntimeContext(), name, fallback);

    private void SetNamedMombotVar(string name, string value)
        => Core.ScriptRef.SetCurrentGameVar(CurrentMombotRuntimeContext(), name, value);

    private string ReadCurrentMombotSectorVar(string fallback, params string[] names)
    {
        Core.TwxRuntimeContext? context = CurrentMombotRuntimeContext();
        string? firstNonEmpty = null;
        foreach (string name in names)
        {
            string value = Core.ScriptRef.GetCurrentGameVar(context, name, string.Empty);
            if (string.IsNullOrWhiteSpace(value))
                continue;

            firstNonEmpty ??= value;
            if (IsDefinedMombotSectorValue(value))
                return value;
        }

        return IsDefinedMombotSectorValue(fallback) ? fallback : (firstNonEmpty ?? fallback);
    }

    private void SyncMombotSpecialSectorVarsFromDatabase(bool persist)
    {
        if (_sessionDb == null)
            return;

        var header = _sessionDb.DBHeader;
        SyncMombotSpecialSectorVar(
            FormatMombotSector(header.StarDock),
            persist,
            "$STARDOCK",
            "$MAP~STARDOCK",
            "$MAP~stardock",
            "$BOT~STARDOCK",
            "$stardock");
        SyncMombotSpecialSectorVar(
            FormatMombotSector(header.Rylos),
            persist,
            "$MAP~RYLOS",
            "$MAP~rylos",
            "$BOT~RYLOS",
            "$rylos");
        SyncMombotSpecialSectorVar(
            FormatMombotSector(header.AlphaCentauri),
            persist,
            "$MAP~ALPHA_CENTAURI",
            "$MAP~alpha_centauri",
            "$BOT~ALPHA_CENTAURI",
            "$alpha_centauri");
    }

    private void SyncMombotSpecialSectorVar(string sector, bool persist, params string[] names)
    {
        if (!IsDefinedMombotSectorValue(sector))
            return;

        if (persist)
            PersistMombotVars(sector, names);
        else
            SetMombotCurrentVars(sector, names);
    }

    private string GetMombotVersionDisplay()
    {
        string major = ReadCurrentMombotVar("5", "$BOT~MAJOR_VERSION", "$bot~major_version", "$major_version");
        string minor = ReadCurrentMombotVar("0beta", "$BOT~MINOR_VERSION", "$bot~minor_version", "$minor_version");
        return string.IsNullOrWhiteSpace(minor) ? major : $"{major}.{minor}";
    }

    private static string FormatMombotSector(ushort? sector)
    {
        if (!sector.HasValue)
            return "0";

        ushort value = sector.Value;
        return value == 0 || value == ushort.MaxValue ? "0" : value.ToString();
    }

    private static string FirstMeaningfulMombotValue(params string?[] candidates)
    {
        foreach (string? candidate in candidates)
        {
            string normalized = NormalizeMombotValue(candidate, treatSelfAsEmpty: true);
            if (!string.IsNullOrEmpty(normalized))
                return normalized;
        }

        return string.Empty;
    }

    private static string NormalizeMombotValue(string? value, bool treatSelfAsEmpty = false)
    {
        string trimmed = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            return string.Empty;
        if (string.Equals(trimmed, "0", StringComparison.OrdinalIgnoreCase))
            return string.Empty;
        if (treatSelfAsEmpty && string.Equals(trimmed, "self", StringComparison.OrdinalIgnoreCase))
            return string.Empty;
        return trimmed;
    }

    private static bool IsDefinedMombotSectorValue(string? value)
    {
        if (!int.TryParse(value, out int sector))
            return false;

        return sector > 0 && sector != ushort.MaxValue;
    }

    private static string NormalizeGameLetter(string? value)
    {
        string normalized = NormalizeMombotValue(value);
        return string.IsNullOrEmpty(normalized) ? string.Empty : normalized[..1].ToUpperInvariant();
    }

    private static bool LooksLikeEstablishedRelogProfile(
        string loginName,
        string password,
        string gameLetter,
        string? traderName,
        string? gameStats,
        string? currentSector)
    {
        bool hasCredentials =
            !string.IsNullOrWhiteSpace(NormalizeMombotValue(loginName, treatSelfAsEmpty: true)) &&
            !string.IsNullOrWhiteSpace(NormalizeMombotValue(password)) &&
            !string.IsNullOrWhiteSpace(NormalizeGameLetter(gameLetter));

        bool hasTrader = !string.IsNullOrWhiteSpace(NormalizeMombotValue(traderName));
        bool hasGameStats = IsMombotTruthy(gameStats ?? string.Empty);
        bool hasCurrentSector = ParseGameVarInt(currentSector ?? "0") > 0;

        return hasCredentials && (hasTrader || hasGameStats || hasCurrentSector);
    }

    private static bool NormalizeEmbeddedRelogFlagsIfEstablished(EmbeddedGameConfig config)
    {
        config.Variables = NormalizeEmbeddedVariables(config.Variables);

        string loginName = NormalizeMombotValue(config.LoginName, treatSelfAsEmpty: true);
        string password = NormalizeMombotValue(config.Password);
        string gameLetter = NormalizeGameLetter(config.GameLetter);
        string traderName = config.Variables.TryGetValue("$PLAYER~TRADER_NAME", out string? trader) ? trader : string.Empty;
        string gameStats = config.Variables.TryGetValue("$GAME~GAMESTATS", out string? stats) ? stats : "0";
        string currentSector = config.Variables.TryGetValue("$PLAYER~CURRENT_SECTOR", out string? sector) ? sector : "0";

        if (!LooksLikeEstablishedRelogProfile(loginName, password, gameLetter, traderName, gameStats, currentSector))
            return false;

        bool changed = false;
        changed |= SetNormalizedEmbeddedVar(config.Variables, "$BOT~NEWGAMEDAY1", "0");
        changed |= SetNormalizedEmbeddedVar(config.Variables, "$BOT~NEWGAMEOLDER", "1");

        if (changed)
        {
            Core.GlobalModules.DebugLog(
                $"[MTC.RelogDefaults] normalized stale relog flags in config for game='{config.Name}'\n");
        }

        return changed;
    }

    private static bool SetNormalizedEmbeddedVar(IDictionary<string, string> vars, string name, string value)
    {
        if (vars.TryGetValue(name, out string? existing) && string.Equals(existing, value, StringComparison.Ordinal))
            return false;

        vars[name] = value;
        return true;
    }

    private string GetEffectiveProxyScriptDirectory()
    {
        if (!string.IsNullOrWhiteSpace(CurrentInterpreter?.ScriptDirectory))
            return CurrentInterpreter.ScriptDirectory;

        if (!string.IsNullOrWhiteSpace(_appPrefs.ScriptsDirectory))
            return NormalizeScriptDirectoryValue(_appPrefs.ScriptsDirectory);

        if (!string.IsNullOrWhiteSpace(_embeddedGameConfig?.ScriptDirectory))
            return NormalizeScriptDirectoryValue(_embeddedGameConfig.ScriptDirectory);

        return Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(_appPrefs.ProgramDirectory);
    }

    private static string GetEffectiveProxyProgramDir(string scriptDirectory)
    {
        if (!string.IsNullOrWhiteSpace(AppPaths.ProgramDir))
            return AppPaths.ProgramDir;

        string trimmed = scriptDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        return Path.GetDirectoryName(trimmed) ?? trimmed;
    }

    private async Task EnsureSharedPathsConfiguredAsync()
    {
        if (_appPrefs.HasConfiguredSharedPaths)
            return;

        var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null)
            return;

        string defaultProgramDir = Core.SharedPaths.GetDefaultProgramDir();
        IStorageFolder? startFolder = null;
        try
        {
            startFolder = await storage.TryGetFolderFromPathAsync(defaultProgramDir);
        }
        catch
        {
        }

        var folders = await storage.OpenFolderPickerAsync(new FolderPickerOpenOptions
        {
            Title = "Select TWX Program Directory",
            SuggestedStartLocation = startFolder,
            AllowMultiple = false,
        });

        if (folders.Count == 0)
            return;

        string programDir = folders[0].Path.LocalPath;
        _appPrefs.ProgramDirectory = programDir;
        _appPrefs.ScriptsDirectory = Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(programDir);
        _appPrefs.Save();
        AppPaths.SetConfiguredProgramDir(_appPrefs.ProgramDirectory);
        ApplyDebugLoggingPreferences();
        RebuildScriptsMenu();
    }

    private async Task OnProxyLoadScriptAsync()
    {
        await Task.Yield();

        var interpreter = CurrentInterpreter;
        bool remoteProxyScripts = interpreter == null && CanUseRemoteProxyScripts();
        if (interpreter == null && !remoteProxyScripts)
            return;

        var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null)
            return;

        IStorageFolder? start = null;
        string preferred = !string.IsNullOrWhiteSpace(_appPrefs.ScriptsDirectory)
            ? _appPrefs.ScriptsDirectory
            : GetEffectiveProxyScriptDirectory();

        try
        {
            start = await storage.TryGetFolderFromPathAsync(preferred);
        }
        catch { }

        var files = await storage.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title = "Load TWX Script",
            SuggestedStartLocation = start,
            AllowMultiple = false,
            FileTypeFilter =
            [
                new FilePickerFileType("TWX Scripts") { Patterns = ["*.ts", "*.cts"] },
                new FilePickerFileType("All Files") { Patterns = ["*"] },
            ],
        });

        if (files.Count == 0)
            return;

        string fullPath = files[0].Path.LocalPath;
        string scriptPath = fullPath;
        string scriptRoot = interpreter?.ScriptDirectory ?? GetEffectiveProxyScriptDirectory();
        if (!string.IsNullOrWhiteSpace(scriptRoot))
        {
            string fullRoot = Path.GetFullPath(scriptRoot)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                + Path.DirectorySeparatorChar;
            string candidate = Path.GetFullPath(fullPath);
            if (candidate.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
                scriptPath = Path.GetRelativePath(scriptRoot, fullPath).Replace('\\', '/');
        }

        try
        {
            if (IsManagedRemoteProxyGame())
                await TryRunManagedRemoteScriptAsync(scriptPath);
            else if (interpreter != null)
                Core.ProxyGameOperations.LoadScript(interpreter, scriptPath);
            else
                SendProxyMenuCommand($"ss {scriptPath}");
            _parser.Feed($"\x1b[1;36m[Loaded script: {scriptPath}]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Load Script Failed", ex.Message);
        }

        RebuildProxyMenu();
        FocusActiveTerminal();
    }

    private async Task LoadQuickScriptAsync(string relativePath)
    {
        // Let the menu close before running synchronous proxy work that can
        // update the terminal and rebuild menus.
        await Task.Yield();

        var interpreter = CurrentInterpreter;
        bool remoteProxyScripts = interpreter == null && CanUseRemoteProxyScripts();
        if (interpreter == null && !remoteProxyScripts)
            return;

        try
        {
            if (IsManagedRemoteProxyGame())
                await TryRunManagedRemoteScriptAsync(relativePath);
            else if (interpreter != null)
                Core.ProxyGameOperations.LoadScript(interpreter, relativePath);
            else
                SendProxyMenuCommand($"ss {relativePath}");
            _parser.Feed($"\x1b[1;36m[Loaded quick script: {relativePath}]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Quick Load Failed", ex.Message);
        }

        RebuildProxyMenu();
        FocusActiveTerminal();
    }

    private async Task SwitchBotAsync(string botName)
    {
        // Let the menu close before running synchronous bot-switch logic on
        // the UI thread, otherwise the dropdown can remain visually stuck.
        await Task.Yield();

        try
        {
            CurrentInterpreter?.SwitchBot(string.Empty, botName, stopBotScripts: true);
            _parser.Feed($"\x1b[1;36m[Switched bot: {botName}]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Switch Bot Failed", ex.Message);
        }

        RebuildProxyMenu();
        FocusActiveTerminal();
    }

    private enum MombotPromptSurface
    {
        Unknown,
        Command,
        Citadel,
        Planet,
        Computer,
    }

    private enum MombotPreferencesPage
    {
        General,
        GameStats,
        Hotkeys,
        ShipInfo,
        PlanetTypes,
        PlanetList,
        TraderList,
    }

    private enum MombotPreferencesBlankSubmitBehavior
    {
        Ignore,
        Submit,
    }

    private sealed record MombotGridContext(
        MombotPromptSurface Surface,
        int CurrentSector,
        IReadOnlyList<int> AdjacentSectors,
        int PlanetNumber,
        bool Connected,
        int PhotonCount);

    private sealed record MombotHotkeyScriptEntry(
        int Slot,
        string LoadReference,
        string DisplayName);

    private sealed record MombotShipCatalogEntry(
        string Name,
        string Shields,
        string DefOdds,
        string OffOdds,
        string Cost,
        string MaxHolds,
        string MaxFighters,
        string InitHolds,
        string Tpw,
        bool Defender);

    private sealed record MombotPlanetCatalogEntry(
        string Name,
        string FuelMin,
        string FuelMax,
        string OrgMin,
        string OrgMax,
        string EquipMin,
        string EquipMax,
        bool Keeper);

    private void SendToTelnet(byte[] bytes)
    {
        if (_telnet.IsConnected)
            _telnet.SendRaw(bytes);
        else
            _parser.Feed("\x1b[33m[not connected]\x1b[0m\r\n");
    }

    private void RouteTerminalInput(byte[] bytes, Action<byte[]> forward)
    {
        RecordTemporaryMacroInput(bytes);
        RecordTerminalInputForRecording(bytes);

        if (TryHandleConfiguredMacroHotkey(bytes))
            return;

        if (TryHandleMombotPromptInput(bytes))
            return;

        if (bytes.Length > 1 && bytes[0] == 0x09)
        {
            if (TryInterceptMombotHotkeyAccess(new byte[] { 0x09 }))
            {
                byte[] remaining = bytes[1..];
                if (remaining.Length == 0)
                    return;

                if (TryHandleMombotPromptInput(remaining))
                    return;

                if (TryInterceptMombotCommandPrompt(remaining))
                    return;

                ObserveForwardedServerInput(remaining);
                ObserveGameAgentClientInput(remaining);
                forward(remaining);
                return;
            }
        }

        if (TryInterceptMombotHotkeyAccess(bytes))
            return;

        if (TryInterceptMombotCommandPrompt(bytes))
            return;

        ObserveForwardedServerInput(bytes);
        ObserveGameAgentClientInput(bytes);
        forward(bytes);
    }

    private void ObserveForwardedServerInput(byte[] bytes)
    {
        if (bytes.Length == 0)
            return;

        MarkGameTrafficActivity();
        int pendingCharacters = Volatile.Read(ref _serverInputPendingCharacters);
        foreach (byte value in bytes)
        {
            switch (value)
            {
                case 0x0D:
                case 0x0A:
                    pendingCharacters = 0;
                    break;

                case 0x08:
                case 0x7F:
                    pendingCharacters = Math.Max(0, pendingCharacters - 1);
                    break;

                default:
                    if (value >= 0x20)
                        pendingCharacters = Math.Min(4096, pendingCharacters + 1);
                    break;
            }
        }

        Volatile.Write(ref _serverInputPendingCharacters, pendingCharacters);
    }

    private bool HasPendingUserTypedServerCommand()
        => Volatile.Read(ref _serverInputPendingCharacters) > 0;

    private void ResetServerCommandTyping()
        => Volatile.Write(ref _serverInputPendingCharacters, 0);

    private void StartTemporaryMacroRecording()
    {
        if (!HasActiveMacroConnection())
        {
            ShowMacroNotice("temporary macro recording requires an active connection");
            return;
        }

        _temporaryMacroChunks.Clear();
        _temporaryMacroRecording = true;
        UpdateTemporaryMacroControls();
        ShowMacroNotice($"temporary macro recording started ({TemporaryMacroMaxCharacters} characters max)");
        FocusActiveTerminal();
    }

    private void StopTemporaryMacroRecording()
    {
        if (!_temporaryMacroRecording)
        {
            FocusActiveTerminal();
            return;
        }

        _temporaryMacroRecording = false;
        UpdateTemporaryMacroControls();
        string macroText = GetTemporaryMacroText();
        UpdateOpenQuickMacroPlayWindow(macroText, "Updated from latest recording.");
        ShowMacroNotice($"temporary macro recording stopped ({macroText.Length} characters)");
        FocusActiveTerminal();
    }

    private void ResetTemporaryMacroSession()
    {
        _temporaryMacroRecording = false;
        _temporaryMacroChunks.Clear();
        UpdateTemporaryMacroControls();
    }

    private void RecordTemporaryMacroInput(byte[] bytes)
    {
        if (!_temporaryMacroRecording || _suppressTemporaryMacroRecording || bytes.Length == 0)
            return;

        var currentBytes = new List<byte>(GetTemporaryMacroBytes());
        var acceptedBytes = new List<byte>(bytes.Length);
        bool reachedLimit = false;

        foreach (byte value in bytes)
        {
            currentBytes.Add(value);
            if (EncodeTemporaryMacroBytes(currentBytes).Length > TemporaryMacroMaxCharacters)
            {
                currentBytes.RemoveAt(currentBytes.Count - 1);
                reachedLimit = true;
                break;
            }

            acceptedBytes.Add(value);
        }

        if (acceptedBytes.Count > 0)
            _temporaryMacroChunks.Add(acceptedBytes.ToArray());

        if (!reachedLimit)
            return;

        _temporaryMacroRecording = false;
        UpdateTemporaryMacroControls();
        UpdateOpenQuickMacroPlayWindow(GetTemporaryMacroText(), "Updated from latest recording.");
        ShowMacroNotice($"temporary macro recorder stopped at {TemporaryMacroMaxCharacters} characters");
    }

    private Task OpenQuickMacroWindowAsync()
    {
        var owner = ActiveMtcTab;
        if (_temporaryMacroRecording)
            return Task.CompletedTask;

        string macroText = GetTemporaryMacroText();
        ShowQuickMacroOverlay(owner, macroText);
        return Task.CompletedTask;
    }

    private async Task PlaySavedQuickMacroOnceAsync()
    {
        if (_temporaryMacroRecording)
            return;

        if (!HasActiveMacroConnection())
        {
            ShowMacroNotice("quick macro playback requires an active connection");
            return;
        }

        if (_temporaryMacroChunks.Count == 0 || _temporaryMacroChunks.All(chunk => chunk.Length == 0))
        {
            ShowMacroNotice("quick macro is empty");
            return;
        }

        string? error = await PlayTemporaryMacroBurstAsync(_temporaryMacroChunks, 1);
        if (!string.IsNullOrWhiteSpace(error))
            ShowMacroNotice(error);
    }

    private void UpdateOpenQuickMacroPlayWindow(string macroText, string statusMessage)
    {
        if (ActiveMtcTab?.QuickMacroPlayOverlay is not { IsVisible: true } overlay)
            return;

        overlay.SetMacroText(macroText);
    }

    private Task<string?> PlayTemporaryMacroBurstAsync(IReadOnlyList<byte[]> macroChunks, int count)
    {
        if (macroChunks.Count == 0 || macroChunks.All(chunk => chunk.Length == 0))
            return Task.FromResult<string?>("Temporary macro is empty.");

        if (!HasActiveMacroConnection())
            return Task.FromResult<string?>("Temporary macros need an active game connection.");

        Action<byte[]>? send = _terminalInputHandler;
        if (send == null)
            return Task.FromResult<string?>("Temporary macros need an active game connection.");

        byte[] macroPayload = GetCombinedMacroPayload(macroChunks);
        if (macroPayload.Length == 0)
            return Task.FromResult<string?>("Temporary macro is empty.");

        if (!TryBuildRepeatedMacroPayload(macroPayload, count, out byte[] burstPayload, out string? burstError))
            return Task.FromResult<string?>(burstError ?? "Temporary macro burst is invalid.");

        _suppressTemporaryMacroRecording = true;
        try
        {
            send(burstPayload);
        }
        finally
        {
            _suppressTemporaryMacroRecording = false;
        }

        return Task.FromResult<string?>(null);
    }

    private string GetTemporaryMacroText()
        => EncodeTemporaryMacroBytes(GetTemporaryMacroBytes());

    private byte[] GetTemporaryMacroBytes()
    {
        return GetCombinedMacroPayload(_temporaryMacroChunks);
    }

    private static string EncodeTemporaryMacroBytes(IEnumerable<byte> bytes)
    {
        var builder = new System.Text.StringBuilder();
        foreach (byte value in bytes)
        {
            switch (value)
            {
                case (byte)'\r':
                    builder.Append('*');
                    break;
                case (byte)'*':
                    builder.Append(@"\*");
                    break;
                case (byte)'\\':
                    builder.Append(@"\\");
                    break;
                default:
                    if (value is >= 32 and <= 126)
                        builder.Append((char)value);
                    else
                        builder.Append(@"\x").Append(value.ToString("X2"));
                    break;
            }
        }

        return builder.ToString();
    }

    private string? ValidateTemporaryMacroText(string macroText)
    {
        if (string.IsNullOrWhiteSpace(macroText))
            return "Enter a macro before playback.";

        if (macroText.Length > TemporaryMacroMaxCharacters)
            return $"Temporary macros are limited to {TemporaryMacroMaxCharacters} characters.";

        return TryDecodeTemporaryMacroText(macroText, out _, out string? error)
            ? null
            : error ?? "Macro text is invalid.";
    }

    private static bool TryDecodeTemporaryMacroText(string macroText, out byte[] bytes, out string? error)
    {
        var values = new List<byte>(macroText.Length);

        for (int index = 0; index < macroText.Length; index++)
        {
            char current = macroText[index];
            if (current == '*')
            {
                values.Add((byte)'\r');
                continue;
            }

            if (current != '\\')
            {
                if (current > byte.MaxValue)
                {
                    bytes = [];
                    error = "Temporary macros support Latin-1 text only.";
                    return false;
                }

                values.Add((byte)current);
                continue;
            }

            if (index == macroText.Length - 1)
            {
                bytes = [];
                error = "A backslash must be followed by \\\\, \\*, or \\xNN.";
                return false;
            }

            char next = macroText[++index];
            switch (next)
            {
                case '\\':
                    values.Add((byte)'\\');
                    break;
                case '*':
                    values.Add((byte)'*');
                    break;
                case 'x':
                case 'X':
                    if (index + 2 >= macroText.Length ||
                        !byte.TryParse(macroText.Substring(index + 1, 2), System.Globalization.NumberStyles.HexNumber, null, out byte hexValue))
                    {
                        bytes = [];
                        error = "Use \\x followed by two hex digits.";
                        return false;
                    }

                    values.Add(hexValue);
                    index += 2;
                    break;
                default:
                    bytes = [];
                    error = "A backslash must be followed by \\\\, \\*, or \\xNN.";
                    return false;
            }
        }

        bytes = values.ToArray();
        error = null;
        return true;
    }

    private void ShowMacroNotice(string message)
    {
        _parser.Feed($"\r\n\x1b[33m[{message}]\x1b[0m\r\n");

        if (HasMombotInteractiveState())
        {
            RedrawMombotPrompt(waitForTerminalBacklog: false);
        }
        else
        {
            // Server prompts are stateful. Do not replay cached prompts locally;
            // any real prompt redraw must come from the server.
            FocusActiveTerminal();
        }

        _buffer.Dirty = true;
    }

    private bool TryHandleConfiguredMacroHotkey(byte[] bytes)
    {
        if (!TerminalControl.TryGetMacroHotkeyName(bytes, out string hotkey))
            return false;

        AppPreferences.MacroBinding? binding = _appPrefs.MacroBindings
            .LastOrDefault(entry =>
                string.Equals(entry.Hotkey, hotkey, StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(entry.Macro));

        if (binding == null)
            return false;

        _ = PromptAndPlayConfiguredMacroAsync(binding);
        return true;
    }

    private static string ExpandConfiguredMacro(string macro)
        => string.IsNullOrEmpty(macro) ? string.Empty : macro.Replace("*", "\r");

    private static bool TryGetConfiguredCommandMacro(string macro, out string commandText)
    {
        string trimmed = macro?.Trim() ?? string.Empty;
        if (trimmed.StartsWith(">", StringComparison.Ordinal))
        {
            commandText = trimmed[1..].Trim();
            return true;
        }

        commandText = string.Empty;
        return false;
    }

    private static bool TryGetConfiguredScriptMacro(string macro, out string scriptReference)
    {
        string trimmed = macro?.Trim() ?? string.Empty;
        if (trimmed.StartsWith("$", StringComparison.Ordinal))
        {
            scriptReference = trimmed[1..].Trim();
            return true;
        }

        scriptReference = string.Empty;
        return false;
    }

    private void UpsertConfiguredMacroBinding(string hotkey, string macro)
    {
        string normalizedHotkey = NormalizeConfiguredMacroHotkey(hotkey);
        _appPrefs.MacroBindings.RemoveAll(binding =>
            string.Equals(binding.Hotkey, normalizedHotkey, StringComparison.OrdinalIgnoreCase));
        _appPrefs.MacroBindings.Add(new AppPreferences.MacroBinding
        {
            Hotkey = normalizedHotkey,
            Macro = macro,
        });
        _appPrefs.Save();
    }

    private static string NormalizeConfiguredMacroHotkey(string? hotkey)
    {
        string candidate = string.IsNullOrWhiteSpace(hotkey) ? "F1" : hotkey.Trim().ToUpperInvariant();
        return TerminalControl.SupportedMacroHotkeys.Contains(candidate, StringComparer.OrdinalIgnoreCase)
            ? candidate
            : "F1";
    }

    private async Task PromptAndPlayConfiguredMacroAsync(AppPreferences.MacroBinding binding)
    {
        var owner = ResolveCurrentMtcTabContext() ?? ActiveMtcTab;
        string macro = binding.Macro;
        if (string.IsNullOrWhiteSpace(macro))
            return;

        if (!HasActiveMacroConnection())
        {
            _parser.Feed("\x1b[33m[macro requires an active connection]\x1b[0m\r\n");
            _buffer.Dirty = true;
            return;
        }

        if (owner?.QuickMacroPlayWindow is { IsVisible: true } existing)
        {
            existing.Activate();
            return;
        }

        var dialog = new MacroPlayDialog(macro);
        if (owner != null)
            owner.QuickMacroPlayWindow = dialog;
        RegisterMtcTabOwnedWindow(owner, dialog);

        bool accepted;
        try
        {
            accepted = await dialog.ShowDialog<bool>(this);
        }
        finally
        {
            RebindMtcTabSessionAfterAwait(owner);
            if (owner != null && ReferenceEquals(owner.QuickMacroPlayWindow, dialog))
                owner.QuickMacroPlayWindow = null;
        }

        if (!accepted)
        {
            if (owner?.Id == _activeMtcTabId)
                FocusActiveTerminal();
            return;
        }

        string updatedMacro = dialog.MacroText;
        if (!string.Equals(binding.Macro, updatedMacro, StringComparison.Ordinal))
        {
            binding.Macro = updatedMacro;
            _appPrefs.Save();
        }

        string? error = await ExecuteInOptionalMtcTabSessionAsync(owner, () =>
            PlayConfiguredMacroBurstAsync(updatedMacro, dialog.PlayCount));
        if (!string.IsNullOrWhiteSpace(error))
        {
            _parser.Feed($"\x1b[33m[{error}]\x1b[0m\r\n");
            _buffer.Dirty = true;
        }

        if (owner?.Id == _activeMtcTabId)
            FocusActiveTerminal();
    }

    private async Task<string?> PlayConfiguredMacroBurstAsync(string macro, int count)
    {
        if (string.IsNullOrWhiteSpace(macro))
            return "Macro is empty.";

        if (TryGetConfiguredCommandMacro(macro, out string commandText))
            return await PlayConfiguredCommandMacroAsync(commandText, count);

        if (TryGetConfiguredScriptMacro(macro, out string scriptReference))
            return await PlayConfiguredScriptMacroAsync(scriptReference, count);

        if (!HasActiveMacroConnection())
            return "Macros need an active game connection.";

        Action<byte[]>? send = _terminalInputHandler;
        if (send == null)
            return "Macros need an active game connection.";

        string expanded = ExpandConfiguredMacro(macro);
        if (string.IsNullOrEmpty(expanded))
            return null;

        byte[] payload = System.Text.Encoding.Latin1.GetBytes(expanded);
        if (payload.Length == 0)
            return null;

        if (!TryBuildRepeatedMacroPayload(payload, count, out byte[] burstPayload, out string? burstError))
            return burstError ?? "Macro burst is invalid.";

        send(burstPayload);
        return null;
    }

    private async Task<string?> PlayConfiguredCommandMacroAsync(string commandText, int count)
    {
        if (string.IsNullOrWhiteSpace(commandText))
            return "Enter a native Mombot command after >.";

        if (_gameInstance == null)
            return "Command macros need the embedded proxy to be running.";

        for (int i = 0; i < count; i++)
            await ExecuteMombotUiCommandAsync(commandText);

        FocusActiveTerminal();
        return null;
    }

    private async Task<string?> PlayConfiguredScriptMacroAsync(string scriptReference, int count)
    {
        if (string.IsNullOrWhiteSpace(scriptReference))
            return "Enter a script name after $.";

        if (count > 1)
            return "Script macros can only be played once at a time.";

        var interpreter = CurrentInterpreter;
        if (interpreter == null)
            return "Script macros need the embedded proxy to be running.";

        string normalizedReference = scriptReference.Trim().Replace('\\', '/');

        try
        {
            await Task.Yield();
            Core.ProxyGameOperations.LoadScript(interpreter, normalizedReference);
            _parser.Feed($"\x1b[1;36m[Loaded macro script: {normalizedReference}]\x1b[0m\r\n");
            _buffer.Dirty = true;
            RebuildProxyMenu();
            RebuildScriptsMenu();
            FocusActiveTerminal();
            return null;
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
    }

    private static byte[] GetCombinedMacroPayload(IEnumerable<byte[]> chunks)
    {
        int totalLength = 0;
        foreach (byte[] chunk in chunks)
            totalLength += chunk.Length;

        if (totalLength == 0)
            return [];

        byte[] payload = new byte[totalLength];
        int offset = 0;
        foreach (byte[] chunk in chunks)
        {
            if (chunk.Length == 0)
                continue;

            Buffer.BlockCopy(chunk, 0, payload, offset, chunk.Length);
            offset += chunk.Length;
        }

        return payload;
    }

    private static bool TryBuildRepeatedMacroPayload(byte[] payload, int count, out byte[] burstPayload, out string? error)
    {
        burstPayload = [];
        error = null;

        if (payload.Length == 0 || count <= 0)
            return true;

        long totalLength = (long)payload.Length * count;
        if (totalLength > int.MaxValue)
        {
            error = "Macro burst is too large to send in one pass.";
            return false;
        }

        if (count == 1)
        {
            burstPayload = payload;
            return true;
        }

        burstPayload = new byte[(int)totalLength];
        int offset = 0;
        for (int i = 0; i < count; i++)
        {
            Buffer.BlockCopy(payload, 0, burstPayload, offset, payload.Length);
            offset += payload.Length;
        }

        return true;
    }

    private bool TryHandleMombotPromptInput(byte[] bytes)
    {
        if (!_mombot.Enabled)
        {
            if (HasMombotInteractiveState())
                CloseMombotInteractiveState();
            return false;
        }

        if (!HasMombotInteractiveState())
            return false;

        if (_mombotPreferencesOpen)
            return TryHandleMombotPreferencesInput(bytes);

        if (_mombotScriptPromptOpen)
            return TryHandleMombotScriptPromptInput(bytes);

        if (_mombotHotkeyPromptOpen)
            return TryHandleMombotHotkeyPromptInput(bytes);

        if (_mombotMacroPromptOpen)
            return TryHandleMombotMacroPromptInput(bytes);

        if (!_mombotPromptOpen)
            return false;

        if (bytes.Length == 0)
            return true;

        if (MatchesMombotPromptSequence(bytes, 'A'))
        {
            RecallMombotPromptHistory(-1);
            return true;
        }

        if (MatchesMombotPromptSequence(bytes, 'B'))
        {
            RecallMombotPromptHistory(1);
            return true;
        }

        if (MatchesMombotPromptSequence(bytes, 'C'))
        {
            MoveMombotPromptCursor(1);
            return true;
        }

        if (MatchesMombotPromptSequence(bytes, 'D'))
        {
            MoveMombotPromptCursor(-1);
            return true;
        }

        if (MatchesMombotPromptSequence(bytes, 'H'))
        {
            SetMombotPromptCursor(0);
            return true;
        }

        if (MatchesMombotPromptSequence(bytes, 'F'))
        {
            SetMombotPromptCursor(_mombotPromptBuffer.Length);
            return true;
        }

        if (bytes.Length == 4 &&
            bytes[0] == 0x1B &&
            bytes[1] == (byte)'[' &&
            bytes[2] == (byte)'3' &&
            bytes[3] == (byte)'~')
        {
            if (DeleteMombotPromptCharacterAtCursor())
            {
                _mombotPromptHistoryIndex = _mombotCommandHistory.Count;
                _mombotPromptDraft = _mombotPromptBuffer;
                RedrawMombotPrompt();
            }
            return true;
        }

        if (bytes.Length == 1 && bytes[0] == 0x1B)
        {
            CancelMombotPrompt();
            return true;
        }

        bool changed = false;
        foreach (byte value in bytes)
        {
            switch (value)
            {
                case 0x08:
                case 0x7F:
                    changed = DeleteMombotPromptCharacterBeforeCursor() || changed;
                    break;

                case 0x0D:
                case 0x0A:
                    SubmitMombotPrompt();
                    return true;

                case 0x09:
                    BeginMombotHotkeyPrompt();
                    return true;

                default:
                    if (value >= 0x20)
                    {
                        if (value == (byte)'$')
                        {
                            CancelMombotPrompt();
                            return true;
                        }

                        if (value == (byte)'>' && _mombotPromptBuffer.Length == 0)
                        {
                            BeginMombotMacroPrompt();
                            return true;
                        }

                        InsertMombotPromptCharacter((char)value);
                        changed = true;
                    }
                    break;
            }
        }

        if (changed)
        {
            _mombotPromptHistoryIndex = _mombotCommandHistory.Count;
            _mombotPromptDraft = _mombotPromptBuffer;
            RedrawMombotPrompt();
        }

        return true;
    }

    private bool TryHandleMombotMacroPromptInput(byte[] bytes)
    {
        if (!_mombotMacroPromptOpen)
            return false;

        if (bytes.Length == 0)
            return true;

        foreach (byte value in bytes)
        {
            switch (value)
            {
                case 0x1B:
                case 0x0D:
                case 0x0A:
                    EndMombotMacroPrompt();
                    return true;

                case 0x09:
                    EndMombotMacroPrompt();
                    BeginMombotHotkeyPrompt();
                    return true;

                case (byte)'?':
                    PublishMombotLocalMessage(BuildMombotMacroHelpLine());
                    return true;

                default:
                    if (TryHandleMombotMacroKey(value))
                        return true;
                    break;
            }
        }

        PublishMombotLocalMessage(BuildMombotMacroHelpLine());
        return true;
    }

    private bool TryHandleMombotHotkeyPromptInput(byte[] bytes)
    {
        if (!_mombotHotkeyPromptOpen)
            return false;

        if (bytes.Length == 0)
            return true;

        foreach (byte value in bytes)
        {
            switch (value)
            {
                case 0x1B:
                case 0x0D:
                case 0x0A:
                    EndMombotHotkeyPrompt();
                    return true;

                case 0x09:
                    if (TryResolveMombotHotkeyCommand(0x09, out string? tabCommandOrAction) &&
                        !string.IsNullOrWhiteSpace(tabCommandOrAction))
                    {
                        _ = ExecuteMombotHotkeySelectionAsync(tabCommandOrAction);
                    }
                    else
                    {
                        _ = ExecuteMombotHotkeySelectionAsync(":INTERNAL_COMMANDS~stopModules");
                    }
                    return true;

                case (byte)'?':
                    _ = ExecuteMombotHotkeyCommandAsync("help");
                    return true;

                default:
                    if (value >= (byte)'0' && value <= (byte)'9')
                    {
                        _ = ExecuteMombotHotkeyScriptAsync(value == (byte)'0' ? 10 : value - (byte)'0');
                        return true;
                    }

                    if (TryResolveMombotHotkeyCommand(value, out string? commandOrAction) &&
                        !string.IsNullOrWhiteSpace(commandOrAction))
                    {
                        _ = ExecuteMombotHotkeySelectionAsync(commandOrAction);
                        return true;
                    }

                    EndMombotHotkeyPrompt();
                    return true;
            }
        }

        return true;
    }

    private bool TryHandleMombotScriptPromptInput(byte[] bytes)
    {
        if (!_mombotScriptPromptOpen)
            return false;

        if (bytes.Length == 0)
            return true;

        foreach (byte value in bytes)
        {
            switch (value)
            {
                case 0x1B:
                case 0x0D:
                case 0x0A:
                    EndMombotScriptPrompt();
                    return true;

                case (byte)'?':
                    PublishMombotScriptPromptList(_mombotHotkeyScripts);
                    RedrawMombotPrompt();
                    return true;

                default:
                    if (value >= (byte)'0' && value <= (byte)'9')
                    {
                        _ = ExecuteMombotHotkeyScriptAsync(value == (byte)'0' ? 10 : value - (byte)'0');
                        return true;
                    }

                    EndMombotScriptPrompt();
                    return true;
            }
        }

        return true;
    }

    private static bool MatchesMombotPromptSequence(byte[] bytes, char finalChar)
    {
        return bytes.Length == 3 &&
            bytes[0] == 0x1B &&
            bytes[1] == (byte)'[' &&
            bytes[2] == (byte)finalChar;
    }

    private void BeginMombotHotkeyPrompt()
    {
        if (_gameInstance == null)
        {
            PublishMombotLocalMessage("Mombot hotkeys are only available while the embedded proxy is running.");
            return;
        }

        if (!_mombot.Enabled)
        {
            PublishMombotLocalMessage("Enable Mombot first.");
            return;
        }

        bool preservePreferencesBotIsDeaf = _mombotPreferencesOpen;
        ResetMombotPromptState();
        if (preservePreferencesBotIsDeaf)
            PersistMombotBoolean(true, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");

        if (_mombotHotkeyPromptOpen)
            return;

        _mombotHotkeyPromptOpen = true;
        _mombotHotkeyScripts = Array.Empty<MombotHotkeyScriptEntry>();
        EnterMombotInteractivePromptTerminalDeaf();
        RedrawMombotPrompt();
    }

    private void EndMombotHotkeyPrompt()
    {
        _mombotHotkeyPromptOpen = false;
        _mombotScriptPromptOpen = false;
        _mombotHotkeyScripts = Array.Empty<MombotHotkeyScriptEntry>();

        if (HasMombotInteractiveState())
            RedrawMombotPrompt();
        else
        {
            if (_mombotInteractivePromptTerminalDeafActive)
                ExitMombotInteractivePromptTerminalDeaf();
            _parser.Feed("\r\x1b[K");
            _buffer.Dirty = true;
            FocusActiveTerminal();
        }
    }

    private void BeginMombotScriptPrompt()
    {
        IReadOnlyList<MombotHotkeyScriptEntry> scripts = LoadMombotHotkeyScripts();
        if (scripts.Count == 0)
        {
            PublishMombotLocalMessage("No Mombot hotkey scripts are configured.");
            return;
        }

        _mombotHotkeyPromptOpen = false;
        _mombotScriptPromptOpen = true;
        _mombotHotkeyScripts = scripts;

        EnterMombotInteractivePromptTerminalDeaf();
        PublishMombotScriptPromptList(scripts);
        RedrawMombotPrompt();
    }

    private void EndMombotScriptPrompt()
    {
        _mombotScriptPromptOpen = false;
        _mombotHotkeyScripts = Array.Empty<MombotHotkeyScriptEntry>();

        if (HasMombotInteractiveState())
            RedrawMombotPrompt();
        else
        {
            if (_mombotInteractivePromptTerminalDeafActive)
                ExitMombotInteractivePromptTerminalDeaf();
            _parser.Feed("\r\x1b[K");
            _buffer.Dirty = true;
            FocusActiveTerminal();
        }
    }

    private void BeginMombotPrompt(string initialValue = "", Func<string, string>? submitTransform = null)
    {
        if (_gameInstance == null)
        {
            PublishMombotLocalMessage("Mombot commands are only available while the embedded proxy is running.");
            return;
        }

        if (!_mombot.Enabled)
        {
            PublishMombotLocalMessage("Enable Mombot first.");
            return;
        }

        if (_mombotPromptOpen)
            return;

        EnsureMombotCommandHistoryLoaded();
        _mombotPromptOpen = true;
        _mombotPromptBuffer = initialValue;
        _mombotPromptDraft = initialValue;
        _mombotPromptSubmitTransform = submitTransform;
        _mombotPromptHistoryIndex = _mombotCommandHistory.Count;
        _mombotPromptCursorIndex = initialValue.Length;
        _mombotHotkeyPromptOpen = false;
        _mombotScriptPromptOpen = false;
        _mombotPreferencesOpen = false;
        _mombotMacroPromptOpen = false;
        _mombotMacroContext = null;
        _mombotHotkeyScripts = Array.Empty<MombotHotkeyScriptEntry>();
        EnterMombotInteractivePromptTerminalDeaf();
        RedrawMombotPrompt();
    }

    private void BeginMombotMacroPrompt()
    {
        if (!_mombotPromptOpen || _mombotMacroPromptOpen)
            return;

        if (_gameInstance == null || !_gameInstance.IsConnected)
        {
            PublishMombotLocalMessage("Mombot macros need an active game connection.");
            return;
        }

        MombotGridContext context = BuildMombotGridContext();
        if (context.Surface != MombotPromptSurface.Command &&
            context.Surface != MombotPromptSurface.Citadel)
        {
            PublishMombotLocalMessage("Mombot macros are available from command or citadel prompts.");
            return;
        }

        _mombotMacroContext = context;
        _mombotMacroPromptOpen = true;
        RedrawMombotPrompt();
    }

    private void EndMombotMacroPrompt()
    {
        _mombotMacroPromptOpen = false;
        _mombotMacroContext = null;
        RedrawMombotPrompt();
    }

    private string NormalizeMombotMowHotkeyCommand(string command)
    {
        string trimmed = (command ?? string.Empty).Trim();
        if (trimmed.Length == 0)
            return trimmed;

        string[] parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length != 2 || !string.Equals(parts[0], "mow", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        string configuredDropCount = ReadCurrentMombotVar("1", "$PLAYER~surroundFigs", "$PLAYER~SURROUNDFIGS").Trim();
        if (string.IsNullOrWhiteSpace(configuredDropCount))
            configuredDropCount = "1";

        return $"mow {parts[1]} {configuredDropCount}";
    }

    private void RecallMombotPromptHistory(int delta)
    {
        if (!_mombotPromptOpen || _mombotCommandHistory.Count == 0)
            return;

        int count = _mombotCommandHistory.Count;
        if (_mombotPromptHistoryIndex == count)
            _mombotPromptDraft = _mombotPromptBuffer;

        _mombotPromptHistoryIndex = Math.Clamp(_mombotPromptHistoryIndex + delta, 0, count);
        _mombotPromptBuffer = _mombotPromptHistoryIndex >= count
            ? _mombotPromptDraft
            : _mombotCommandHistory[_mombotPromptHistoryIndex];
        _mombotPromptCursorIndex = _mombotPromptBuffer.Length;
        RedrawMombotPrompt();
    }

    private void MoveMombotPromptCursor(int delta)
    {
        if (!_mombotPromptOpen)
            return;

        SetMombotPromptCursor(_mombotPromptCursorIndex + delta);
    }

    private void SetMombotPromptCursor(int index)
    {
        if (!_mombotPromptOpen)
            return;

        int normalized = Math.Clamp(index, 0, _mombotPromptBuffer.Length);
        if (normalized == _mombotPromptCursorIndex)
            return;

        _mombotPromptCursorIndex = normalized;
        RedrawMombotPrompt();
    }

    private void InsertMombotPromptCharacter(char value)
    {
        int cursor = Math.Clamp(_mombotPromptCursorIndex, 0, _mombotPromptBuffer.Length);
        _mombotPromptBuffer = _mombotPromptBuffer.Insert(cursor, value.ToString());
        _mombotPromptCursorIndex = cursor + 1;
    }

    private bool DeleteMombotPromptCharacterBeforeCursor()
    {
        int cursor = Math.Clamp(_mombotPromptCursorIndex, 0, _mombotPromptBuffer.Length);
        if (cursor <= 0)
            return false;

        _mombotPromptBuffer = _mombotPromptBuffer.Remove(cursor - 1, 1);
        _mombotPromptCursorIndex = cursor - 1;
        return true;
    }

    private bool DeleteMombotPromptCharacterAtCursor()
    {
        int cursor = Math.Clamp(_mombotPromptCursorIndex, 0, _mombotPromptBuffer.Length);
        if (cursor >= _mombotPromptBuffer.Length)
            return false;

        _mombotPromptBuffer = _mombotPromptBuffer.Remove(cursor, 1);
        return true;
    }

    private void CancelMombotPrompt()
    {
        if (!HasMombotInteractiveState())
            return;

        CloseMombotInteractiveState();
    }

    private void SubmitMombotPrompt()
    {
        if (!_mombotPromptOpen)
            return;

        string command = _mombotPromptBuffer;
        Func<string, string>? submitTransform = _mombotPromptSubmitTransform;
        string prompt = GetMombotPromptPrefix();

        ResetMombotPromptState();

        if (submitTransform != null)
            command = submitTransform(command);

        if (string.IsNullOrWhiteSpace(command))
        {
            _parser.Feed("\r\x1b[K");
            _buffer.Dirty = true;
            FocusActiveTerminal();
            return;
        }

        _parser.Feed("\r\x1b[K");
        _parser.Feed(prompt);
        _parser.Feed(command);
        _parser.Feed("\r\n");

        RecordMombotInteractiveCommandInGameLog(command);
        ExecuteMombotLocalInput(command);
    }

    private void RecordMombotInteractiveCommandInGameLog(string command)
    {
        var gameInstance = _gameInstance;
        if (gameInstance == null || string.IsNullOrWhiteSpace(command))
            return;

        gameInstance.Logger.RecordServerText(">" + command + "\r");
    }

    private void ResetMombotPromptState()
    {
        if (_mombotPreferencesOpen || _mombotPreferencesMenuDeafActive)
            ExitMombotPreferencesMenuDeaf();
        if (_mombotInteractivePromptTerminalDeafActive)
            ExitMombotInteractivePromptTerminalDeaf();

        _mombotPromptOpen = false;
        _mombotHotkeyPromptOpen = false;
        _mombotScriptPromptOpen = false;
        _mombotPreferencesOpen = false;
        _mombotPreferencesCaptureSingleKey = false;
        _mombotPreferencesBlankSubmitBehavior = MombotPreferencesBlankSubmitBehavior.Ignore;
        _mombotPreferencesInputPrompt = string.Empty;
        _mombotPreferencesInputBuffer = string.Empty;
        _mombotPreferencesInputHandler = null;
        _mombotPreferencesHotkeySlot = 0;
        _mombotMacroPromptOpen = false;
        _mombotMacroContext = null;
        _mombotHotkeyScripts = Array.Empty<MombotHotkeyScriptEntry>();
        _mombotPromptBuffer = string.Empty;
        _mombotPromptDraft = string.Empty;
        _mombotPromptSubmitTransform = null;
        _mombotPromptHistoryIndex = _mombotCommandHistory.Count;
        _mombotPromptCursorIndex = 0;
    }

    private void RedrawMombotPrompt(bool waitForTerminalBacklog = true)
    {
        if (!HasMombotInteractiveState())
            return;

        if (waitForTerminalBacklog && HasPendingTerminalDisplayBacklog())
        {
            ScheduleMombotInteractivePromptRedraw(_mombotObservedGamePromptVersion);
            return;
        }

        _parser.Feed("\r\x1b[K");
        _parser.Feed(
            _mombotPreferencesOpen ? GetMombotPreferencesPromptPrefix() :
            _mombotScriptPromptOpen ? GetMombotScriptPromptPrefix() :
            _mombotHotkeyPromptOpen ? GetMombotHotkeyPromptPrefix() :
            _mombotMacroPromptOpen ? GetMombotMacroPromptPrefix() :
            GetMombotPromptPrefix());
        if (_mombotPreferencesOpen)
        {
            if (_mombotPreferencesInputBuffer.Length > 0)
                _parser.Feed(_mombotPreferencesInputBuffer);
        }
        else if (!_mombotScriptPromptOpen && !_mombotHotkeyPromptOpen && !_mombotMacroPromptOpen && _mombotPromptBuffer.Length > 0)
        {
            _parser.Feed(_mombotPromptBuffer);
            int charsToMoveLeft = _mombotPromptBuffer.Length - Math.Clamp(_mombotPromptCursorIndex, 0, _mombotPromptBuffer.Length);
            if (charsToMoveLeft > 0)
                _parser.Feed($"\x1b[{charsToMoveLeft}D");
        }
        _buffer.Dirty = true;
        FocusActiveTerminal();
    }

    private string GetMombotPromptPrefix()
    {
        MTC.mombot.mombotStatusSnapshot snapshot = _mombot.GetStatusSnapshot();
        string mode = string.IsNullOrWhiteSpace(snapshot.Mode) ? "General" : snapshot.Mode;
        string botName = string.IsNullOrWhiteSpace(snapshot.BotName) ? "mombot" : snapshot.BotName;
        return $"\x1b[1;34m{{{mode}}}\x1b[0;37m {botName}\x1b[1;32m>\x1b[0m ";
    }

    private string GetMombotMacroPromptPrefix()
    {
        string options = "H=Holo D=Dens S=Surround X=Xenter";
        if (_mombotMacroContext is { AdjacentSectors.Count: > 0 } context)
        {
            string sectorKeys = string.Join(" ", context.AdjacentSectors
                .Take(10)
                .Select((sector, index) => $"{((index + 1) % 10)}={sector}"));
            options += " " + sectorKeys;
        }

        return $"\x1b[1;33m{{{options}}}\x1b[0;37m mombot\x1b[1;32m>\x1b[0m ";
    }

    private static string GetMombotHotkeyPromptPrefix()
    {
        return "\x1b[1;37m**Hotkey\x1b[1;32m>\x1b[0m ";
    }

    private static string GetMombotScriptPromptPrefix()
    {
        return "\x1b[1;37m***Scripts\x1b[1;32m>\x1b[0m ";
    }

    private string GetMombotPreferencesPromptPrefix()
    {
        string label = string.IsNullOrWhiteSpace(_mombotPreferencesInputPrompt)
            ? GetMombotPreferencesPageTitle(_mombotPreferencesPage)
            : _mombotPreferencesInputPrompt;
        return $"\x1b[1;37m{label}\x1b[1;32m>\x1b[0m ";
    }

    private void BeginMombotPreferencesMenu(MombotPreferencesPage page = MombotPreferencesPage.General)
    {
        if (_gameInstance == null)
        {
            PublishMombotLocalMessage("Mombot preferences are only available while the embedded proxy is running.");
            return;
        }

        if (!_mombot.Enabled)
        {
            PublishMombotLocalMessage("Enable Mombot first.");
            return;
        }

        ResetMombotPromptState();
        _mombotPreferencesOpen = true;
        _mombotPreferencesPage = page;
        _mombotPreferencesShipPageStart = 1;
        _mombotPreferencesPlanetTypePageStart = 1;
        _mombotPreferencesPlanetListCursor = 2;
        _mombotPreferencesPlanetListNextCursor = 2;
        _mombotPreferencesPlanetListHasMore = false;
        _mombotPreferencesTraderListCursor = 2;
        _mombotPreferencesTraderListNextCursor = 2;
        _mombotPreferencesTraderListHasMore = false;

        EnterMombotPreferencesMenuDeaf();
        string subspace = ReadCurrentMombotVar("0", "$BOT~SUBSPACE", "$bot~subspace", "$subspace");
        string botPassword = ReadCurrentMombotVar(string.Empty, "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password");
        if (string.IsNullOrWhiteSpace(botPassword) && !string.Equals(subspace, "0", StringComparison.OrdinalIgnoreCase))
            PersistMombotVars(subspace, "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password");

        RenderMombotPreferencesPage();
    }

    private void EndMombotPreferencesMenu()
    {
        if (!_mombotPreferencesOpen)
            return;

        ExitMombotPreferencesMenuDeaf();
        _mombotPreferencesOpen = false;
        ClearMombotPreferencesInputState();
        _parser.Feed("\r\x1b[K");
        _buffer.Dirty = true;
        FocusActiveTerminal();
        ApplyMombotExecutionRefresh();
    }

    private void EnterMombotPreferencesMenuDeaf()
    {
        if (_gameInstance == null)
            return;

        if (!_mombotPreferencesMenuDeafActive)
        {
            _mombotPreferencesMenuDeafRestore = AnyMombotClientDeaf();
            _mombotPreferencesMenuDeafActive = true;
        }

        SetMombotClientsDeaf(true);
        PersistMombotBoolean(true, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");
    }

    private void EnterMombotInteractivePromptTerminalDeaf()
    {
        if (_gameInstance == null)
            return;

        var owner = ResolveCurrentMtcTabContext();
        if (!_mombotInteractivePromptTerminalDeafActive)
        {
            _mombotInteractivePromptTerminalDeafRestore =
                _gameInstance.GetClientType(EmbeddedLocalClientIndex) == Core.ClientType.Deaf;
            _mombotInteractivePromptTerminalDeafActive = true;
        }

        _terminalLivePaused = true;
        if (owner is not null)
            owner.TerminalLivePaused = true;

        ClearPausedTerminalChunks(owner);
        ClearPendingSessionLogChunks(owner);

        if (_gameInstance.GetClientType(EmbeddedLocalClientIndex) == Core.ClientType.Standard)
            _gameInstance.SetClientType(EmbeddedLocalClientIndex, Core.ClientType.Deaf);
        else
            UpdateTerminalLiveSelector();
    }

    private void ExitMombotInteractivePromptTerminalDeaf()
    {
        if (!_mombotInteractivePromptTerminalDeafActive)
            return;

        var owner = ResolveCurrentMtcTabContext();
        bool keepDeaf = _mombotInteractivePromptTerminalDeafRestore;

        _terminalLivePaused = keepDeaf;
        if (owner is not null)
            owner.TerminalLivePaused = keepDeaf;

        if (_gameInstance != null)
        {
            Core.ClientType targetType = keepDeaf ? Core.ClientType.Deaf : Core.ClientType.Standard;
            if (_gameInstance.GetClientType(EmbeddedLocalClientIndex) != targetType)
                _gameInstance.SetClientType(EmbeddedLocalClientIndex, targetType);
        }

        if (keepDeaf)
        {
            ClearPausedTerminalChunks(owner);
            ClearPendingSessionLogChunks(owner);
        }
        else
        {
            ClearPausedTerminalChunks(owner);
            FlushDeferredPanelRefreshes();
        }

        UpdateTerminalLiveSelector();
        _mombotInteractivePromptTerminalDeafActive = false;
        _mombotInteractivePromptTerminalDeafRestore = false;
    }

    private void ExitMombotPreferencesMenuDeaf()
    {
        if (!_mombotPreferencesMenuDeafActive)
            return;

        if (_mombotPreferencesMenuDeafRestore)
        {
            SetMombotClientsDeaf(true);
            PersistMombotBoolean(true, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");
        }
        else
        {
            SetMombotClientsDeaf(false);
            PersistMombotBoolean(false, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");
        }

        _mombotPreferencesMenuDeafActive = false;
        _mombotPreferencesMenuDeafRestore = false;
    }

    private bool AnyMombotClientDeaf()
    {
        if (_gameInstance == null)
            return false;

        int clientCount = _gameInstance.ClientCount;
        for (int i = 0; i < clientCount; i++)
        {
            if (_gameInstance.GetClientType(i) == Core.ClientType.Deaf)
                return true;
        }

        return false;
    }

    private void SetMombotClientsDeaf(bool deaf)
    {
        if (_gameInstance == null)
            return;

        int clientCount = _gameInstance.ClientCount;
        for (int i = 0; i < clientCount; i++)
        {
            Core.ClientType clientType = _gameInstance.GetClientType(i);
            if (deaf)
            {
                if (clientType == Core.ClientType.Standard)
                    _gameInstance.SetClientType(i, Core.ClientType.Deaf);
            }
            else if (clientType == Core.ClientType.Deaf)
            {
                _gameInstance.SetClientType(i, Core.ClientType.Standard);
            }
        }
    }

    private void ClearMombotPreferencesInputState()
    {
        _mombotPreferencesCaptureSingleKey = false;
        _mombotPreferencesBlankSubmitBehavior = MombotPreferencesBlankSubmitBehavior.Ignore;
        _mombotPreferencesInputPrompt = string.Empty;
        _mombotPreferencesInputBuffer = string.Empty;
        _mombotPreferencesInputHandler = null;
        _mombotPreferencesHotkeySlot = 0;
    }

    private bool TryHandleMombotPreferencesInput(byte[] bytes)
    {
        if (!_mombotPreferencesOpen)
            return false;

        if (_mombotPreferencesInputHandler != null)
            return TryHandleMombotPreferencesResponseInput(bytes);

        if (bytes.Length == 0)
            return true;

        if (bytes.Length == 1 && bytes[0] == 0x1B)
        {
            EndMombotPreferencesMenu();
            return true;
        }

        foreach (byte value in bytes)
        {
            if (value == 0x0D || value == 0x0A)
            {
                EndMombotPreferencesMenu();
                return true;
            }

            if (value < 0x20 || value > 0x7E)
                continue;

            HandleMombotPreferencesSelection(char.ToUpperInvariant((char)value));
            return true;
        }

        return true;
    }

    private bool TryHandleMombotPreferencesResponseInput(byte[] bytes)
    {
        if (!_mombotPreferencesOpen || _mombotPreferencesInputHandler == null)
            return false;

        if (bytes.Length == 0)
            return true;

        if (_mombotPreferencesCaptureSingleKey)
        {
            foreach (byte value in bytes)
            {
                if (value == 0x1B)
                {
                    CancelMombotPreferencesInput();
                    return true;
                }

                string? input = value switch
                {
                    0x08 => "\b",
                    0x09 => "\t",
                    0x0D => "\r",
                    0x0A => "\n",
                    0x7F => "\b",
                    >= 0x20 and <= 0x7E => ((char)value).ToString(),
                    _ => null,
                };

                if (input != null)
                {
                    CompleteMombotPreferencesInput(input);
                    return true;
                }
            }

            return true;
        }

        bool changed = false;
        foreach (byte value in bytes)
        {
            switch (value)
            {
                case 0x08:
                case 0x7F:
                    if (_mombotPreferencesInputBuffer.Length > 0)
                    {
                        _mombotPreferencesInputBuffer = _mombotPreferencesInputBuffer[..^1];
                        changed = true;
                    }
                    break;

                case 0x1B:
                    CancelMombotPreferencesInput();
                    return true;

                case 0x0D:
                case 0x0A:
                    CompleteMombotPreferencesInput(_mombotPreferencesInputBuffer);
                    return true;

                default:
                    if (value >= 0x20)
                    {
                        _mombotPreferencesInputBuffer += (char)value;
                        changed = true;
                    }
                    break;
            }
        }

        if (changed)
            RedrawMombotPrompt();

        return true;
    }

    private void BeginMombotPreferencesInput(
        string prompt,
        Action<string> handler,
        string initialValue = "",
        bool captureSingleKey = false,
        MombotPreferencesBlankSubmitBehavior blankSubmitBehavior = MombotPreferencesBlankSubmitBehavior.Ignore)
    {
        _mombotPreferencesCaptureSingleKey = captureSingleKey;
        _mombotPreferencesBlankSubmitBehavior = blankSubmitBehavior;
        _mombotPreferencesInputPrompt = prompt;
        // TWX-style preference edits should prompt for a fresh value rather than
        // preloading the current one into the editable buffer.
        _mombotPreferencesInputBuffer = string.Empty;
        _mombotPreferencesInputHandler = handler;
        RedrawMombotPrompt();
    }

    private void CompleteMombotPreferencesInput(string value)
    {
        Action<string>? handler = _mombotPreferencesInputHandler;
        MombotPreferencesBlankSubmitBehavior blankSubmitBehavior = _mombotPreferencesBlankSubmitBehavior;
        ClearMombotPreferencesInputState();

        if (blankSubmitBehavior == MombotPreferencesBlankSubmitBehavior.Submit || !string.IsNullOrWhiteSpace(value))
            handler?.Invoke(value);

        if (_mombotPreferencesOpen && _mombotPreferencesInputHandler == null)
            RenderMombotPreferencesPage();
    }

    private void CancelMombotPreferencesInput()
    {
        ClearMombotPreferencesInputState();
        if (_mombotPreferencesOpen)
            RenderMombotPreferencesPage();
    }

    private void HandleMombotPreferencesSelection(char selection)
    {
        switch (_mombotPreferencesPage)
        {
            case MombotPreferencesPage.General:
                HandleMombotGeneralPreferencesSelection(selection);
                break;

            case MombotPreferencesPage.GameStats:
                HandleMombotGameStatsPreferencesSelection(selection);
                break;

            case MombotPreferencesPage.Hotkeys:
                HandleMombotHotkeyPreferencesSelection(selection);
                break;

            case MombotPreferencesPage.ShipInfo:
                HandleMombotShipPreferencesSelection(selection);
                break;

            case MombotPreferencesPage.PlanetTypes:
                HandleMombotPlanetTypePreferencesSelection(selection);
                break;

            case MombotPreferencesPage.PlanetList:
                HandleMombotPlanetListPreferencesSelection(selection);
                break;

            case MombotPreferencesPage.TraderList:
                HandleMombotTraderListPreferencesSelection(selection);
                break;
        }
    }

    private void HandleMombotGeneralPreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.GameStats;
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.TraderList;
                RenderMombotPreferencesPage();
                return;

            case 'N':
                BeginMombotPreferencesInput(
                    "Bot Name",
                    value =>
                    {
                        string newBotName = (value ?? string.Empty).Replace("^", string.Empty).Replace(" ", string.Empty).Trim().ToLowerInvariant();
                        if (string.IsNullOrWhiteSpace(newBotName))
                            return;

                        PersistMombotVars(
                            newBotName,
                            "$BOT~BOT_NAME",
                            "$SWITCHBOARD~BOT_NAME",
                            "$SWITCHBOARD~bot_name",
                            "$bot~bot_name",
                            "$bot_name",
                            "$bot~name");

                        try
                        {
                            string path = ResolveMombotCurrentFilePath("$gconfig_file");
                            if (!string.IsNullOrWhiteSpace(path))
                            {
                                string? directory = Path.GetDirectoryName(path);
                                if (!string.IsNullOrWhiteSpace(directory))
                                    Directory.CreateDirectory(directory);
                                File.WriteAllText(path, newBotName + Environment.NewLine);
                            }
                        }
                        catch
                        {
                        }
                    },
                    ReadCurrentMombotVar("mombot", "$SWITCHBOARD~BOT_NAME", "$SWITCHBOARD~bot_name", "$bot~bot_name", "$bot_name"));
                return;

            case 'P':
                BeginMombotPreferencesInput(
                    "Game Password",
                    value => PersistMombotVars(value.Trim(), "$BOT~PASSWORD", "$bot~password", "$password"),
                    ReadCurrentMombotVar(string.Empty, "$BOT~PASSWORD", "$bot~password", "$password"),
                    blankSubmitBehavior: MombotPreferencesBlankSubmitBehavior.Submit);
                return;

            case 'Z':
                BeginMombotPreferencesInput(
                    "Bot Password",
                    value => PersistMombotVars(value.Trim(), "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password"),
                    ReadCurrentMombotVar(string.Empty, "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password"),
                    blankSubmitBehavior: MombotPreferencesBlankSubmitBehavior.Submit);
                return;

            case 'G':
                BeginMombotPreferencesInput(
                    "Game Letter",
                    value => PersistMombotVars(value.Trim().ToUpperInvariant(), "$BOT~LETTER", "$bot~letter", "$letter"),
                    ReadCurrentMombotVar(string.Empty, "$BOT~LETTER", "$bot~letter", "$letter"),
                    blankSubmitBehavior: MombotPreferencesBlankSubmitBehavior.Submit);
                return;

            case 'C':
                BeginMombotPreferencesInput(
                    "Login Name",
                    value => PersistMombotVars(value.Trim(), "$BOT~USERNAME", "$bot~username", "$username"),
                    ReadCurrentMombotVar(string.Empty, "$BOT~USERNAME", "$bot~username", "$username"),
                    blankSubmitBehavior: MombotPreferencesBlankSubmitBehavior.Submit);
                return;

            case '1':
                if (!IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~UNLIMITEDGAME", "$PLAYER~unlimitedGame", "$unlimitedGame")))
                {
                    BeginMombotPreferencesInput(
                        "Turn Limit",
                        value =>
                        {
                            if (int.TryParse(value.Trim(), out int turnLimit) && turnLimit >= 0 && turnLimit <= 65000)
                                PersistMombotVars(turnLimit.ToString(), "$BOT~BOT_TURN_LIMIT", "$bot~bot_turn_limit", "$bot_turn_limit");
                        },
                        ReadCurrentMombotVar("0", "$BOT~BOT_TURN_LIMIT", "$bot~bot_turn_limit", "$bot_turn_limit"));
                }
                return;

            case '3':
                PromptMombotCountPreference("Surround figs", 0, 50000, MombotCountZeroBehavior.KeepZero, "$PLAYER~surroundFigs", "$PLAYER~SURROUNDFIGS");
                return;

            case '4':
                PromptMombotCountPreference("Surround limpets", 0, 250, MombotCountZeroBehavior.KeepZero, "$PLAYER~surroundLimp", "$PLAYER~SURROUNDLIMP");
                return;

            case '5':
                PromptMombotCountPreference("Surround armids", 0, 250, MombotCountZeroBehavior.KeepZero, "$PLAYER~surroundMine", "$PLAYER~SURROUNDMINE");
                return;

            case '8':
            {
                bool shieldedOnly = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundAvoidShieldedOnly"));
                bool allPlanets = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundAvoidAllPlanets"));
                if (shieldedOnly)
                    PersistMombotSurroundPlanetAvoidance(allPlanets: true, shieldedOnly: false, none: false);
                else if (allPlanets)
                    PersistMombotSurroundPlanetAvoidance(allPlanets: false, shieldedOnly: false, none: true);
                else
                    PersistMombotSurroundPlanetAvoidance(allPlanets: false, shieldedOnly: true, none: false);
                RenderMombotPreferencesPage();
                return;
            }

            case '7':
                ToggleMombotBooleanPreference("$bot~autoattack", "$BOT~autoattack", "$autoattack");
                return;

            case '2':
            {
                bool defender = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~defenderCapping"));
                bool offense = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~offenseCapping", "$offenseCapping"));
                if (defender)
                {
                    PersistMombotBoolean(false, "$PLAYER~defenderCapping");
                    PersistMombotBoolean(true, "$PLAYER~offenseCapping", "$offenseCapping");
                    PersistMombotBoolean(true, "$PLAYER~cappingAliens", "$cappingAliens");
                }
                else if (offense)
                {
                    PersistMombotBoolean(false, "$PLAYER~defenderCapping");
                    PersistMombotBoolean(false, "$PLAYER~offenseCapping", "$offenseCapping");
                    PersistMombotBoolean(false, "$PLAYER~cappingAliens", "$cappingAliens");
                }
                else
                {
                    PersistMombotBoolean(true, "$PLAYER~defenderCapping");
                    PersistMombotBoolean(false, "$PLAYER~offenseCapping", "$offenseCapping");
                    PersistMombotBoolean(true, "$PLAYER~cappingAliens", "$cappingAliens");
                }

                RenderMombotPreferencesPage();
                return;
            }

            case '6':
            {
                bool offensive = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~dropOffensive"));
                bool toll = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~dropToll"));
                if (offensive)
                {
                    PersistMombotBoolean(false, "$PLAYER~dropOffensive");
                    PersistMombotBoolean(true, "$PLAYER~dropToll");
                }
                else if (toll)
                {
                    PersistMombotBoolean(false, "$PLAYER~dropOffensive");
                    PersistMombotBoolean(false, "$PLAYER~dropToll");
                }
                else
                {
                    PersistMombotBoolean(true, "$PLAYER~dropOffensive");
                    PersistMombotBoolean(false, "$PLAYER~dropToll");
                }

                RenderMombotPreferencesPage();
                return;
            }

            case '0':
                ToggleMombotBooleanPreference("$BOT~command_prompt_extras", "$command_prompt_extras");
                return;

            case 'V':
                ToggleMombotBooleanPreference("$BOT~silent_running", "$bot~silent_running", "$silent_running");
                return;

            case 'K':
                ToggleMombotBooleanPreference("$PLAYER~surround_before_hkill");
                return;

            case 'S':
                PromptMombotSectorPreference("Stardock", allowZeroReset: true, ResetMombotSpecialSector.Stardock, "$MAP~STARDOCK", "$MAP~stardock", "$BOT~STARDOCK", "$stardock");
                return;

            case 'J':
                BeginMombotPreferencesInput(
                    "Alarm List",
                    value => PersistMombotVars(value.Trim(), "$BOT~alarm_list", "$bot~alarm_list", "$alarm_list"),
                    ReadCurrentMombotVar(string.Empty, "$BOT~alarm_list", "$bot~alarm_list", "$alarm_list"),
                    blankSubmitBehavior: MombotPreferencesBlankSubmitBehavior.Submit);
                return;

            case 'X':
                PromptMombotCountPreference("Safe Ship", 0, int.MaxValue, MombotCountZeroBehavior.TreatAsUndefined, "$BOT~SAFE_SHIP", "$BOT~safe_ship", "$bot~safe_ship", "$safe_ship");
                return;

            case 'L':
                PromptMombotCountPreference("Safe Planet", 0, int.MaxValue, MombotCountZeroBehavior.TreatAsUndefined, "$BOT~SAFE_PLANET", "$BOT~safe_planet", "$bot~safe_planet", "$safe_planet");
                return;

            case 'E':
                BeginMombotPreferencesInput(
                    "Banner Interval (minutes)",
                    value =>
                    {
                        if (int.TryParse(value.Trim(), out int interval))
                            PersistMombotVars((interval > 0 ? interval : 5760).ToString(), "$BOT~echoInterval", "$echoInterval");
                    },
                    ReadCurrentMombotVar("5760", "$BOT~echoInterval", "$echoInterval"));
                return;

            case 'R':
                PromptMombotSectorPreference("Rylos", allowZeroReset: true, ResetMombotSpecialSector.Rylos, "$MAP~RYLOS", "$MAP~rylos", "$BOT~RYLOS", "$rylos");
                return;

            case 'A':
                PromptMombotSectorPreference("Alpha Centauri", allowZeroReset: true, ResetMombotSpecialSector.Alpha, "$MAP~ALPHA_CENTAURI", "$MAP~alpha_centauri", "$BOT~ALPHA_CENTAURI", "$alpha_centauri");
                return;

            case 'B':
                PromptMombotSectorPreference("Backdoor", allowZeroReset: false, ResetMombotSpecialSector.None, "$MAP~BACKDOOR", "$MAP~backdoor", "$backdoor");
                return;

            case 'H':
                PromptMombotSectorPreference("Home Sector", allowZeroReset: false, ResetMombotSpecialSector.None, "$MAP~HOME_SECTOR", "$MAP~home_sector", "$BOT~HOME_SECTOR", "$home_sector");
                return;

            case '9':
            {
                bool overwrite = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundOverwrite"));
                bool passive = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundPassive"));
                if (overwrite)
                {
                    PersistMombotBoolean(false, "$PLAYER~surroundOverwrite");
                    PersistMombotBoolean(true, "$PLAYER~surroundPassive");
                    PersistMombotBoolean(false, "$PLAYER~surroundNormal");
                }
                else if (passive)
                {
                    PersistMombotBoolean(false, "$PLAYER~surroundOverwrite");
                    PersistMombotBoolean(false, "$PLAYER~surroundPassive");
                    PersistMombotBoolean(true, "$PLAYER~surroundNormal");
                }
                else
                {
                    PersistMombotBoolean(true, "$PLAYER~surroundOverwrite");
                    PersistMombotBoolean(false, "$PLAYER~surroundPassive");
                    PersistMombotBoolean(false, "$PLAYER~surroundNormal");
                }

                RenderMombotPreferencesPage();
                return;
            }

            default:
                EndMombotPreferencesMenu();
                return;
        }
    }

    private void HandleMombotGameStatsPreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.Hotkeys;
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.General;
                RenderMombotPreferencesPage();
                return;

            default:
                EndMombotPreferencesMenu();
                return;
        }
    }

    private void HandleMombotHotkeyPreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.ShipInfo;
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.GameStats;
                RenderMombotPreferencesPage();
                return;
        }

        if (TryGetMombotHotkeySlotFromSelection(selection, out int slot))
        {
            PromptMombotHotkeySelection(slot);
            return;
        }

        EndMombotPreferencesMenu();
    }

    private void HandleMombotShipPreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.Hotkeys;
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.PlanetTypes;
                RenderMombotPreferencesPage();
                return;

            case '+':
            {
                int count = LoadMombotShipCatalogEntries().Count;
                _mombotPreferencesShipPageStart = count <= 10 || _mombotPreferencesShipPageStart + 10 >= count ? 1 : _mombotPreferencesShipPageStart + 10;
                RenderMombotPreferencesPage();
                return;
            }
        }

        if (TryGetMombotPagedItemOffset(selection, out int offset))
        {
            ToggleMombotShipDefender(offset);
            return;
        }

        EndMombotPreferencesMenu();
    }

    private void HandleMombotPlanetTypePreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.ShipInfo;
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.PlanetList;
                RenderMombotPreferencesPage();
                return;

            case '+':
            {
                int count = LoadMombotPlanetCatalogEntries().Count;
                _mombotPreferencesPlanetTypePageStart = count <= 10 || _mombotPreferencesPlanetTypePageStart + 10 > count ? 1 : _mombotPreferencesPlanetTypePageStart + 10;
                RenderMombotPreferencesPage();
                return;
            }

            case 'K':
                BeginMombotPreferencesInput(
                    "Keeper Planet Slot (0-9)",
                    value =>
                    {
                        if (string.IsNullOrEmpty(value))
                            return;
                        char key = char.ToUpperInvariant(value[0]);
                        if (TryGetMombotPagedItemOffset(key, out int toggleOffset))
                            ToggleMombotPlanetKeeper(toggleOffset);
                    },
                    captureSingleKey: true);
                return;
        }

        if (TryGetMombotPagedItemOffset(selection, out int offset))
        {
            PromptMombotPlanetTypeEdit(offset);
            return;
        }

        EndMombotPreferencesMenu();
    }

    private void HandleMombotPlanetListPreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.PlanetTypes;
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.TraderList;
                RenderMombotPreferencesPage();
                return;

            case '+':
                _mombotPreferencesPlanetListCursor = _mombotPreferencesPlanetListHasMore ? _mombotPreferencesPlanetListNextCursor : 2;
                RenderMombotPreferencesPage();
                return;

            default:
                EndMombotPreferencesMenu();
                return;
        }
    }

    private void HandleMombotTraderListPreferencesSelection(char selection)
    {
        switch (selection)
        {
            case '?':
                RenderMombotPreferencesPage();
                return;

            case '<':
                _mombotPreferencesPage = MombotPreferencesPage.PlanetList;
                RenderMombotPreferencesPage();
                return;

            case '>':
                _mombotPreferencesPage = MombotPreferencesPage.General;
                RenderMombotPreferencesPage();
                return;

            case '+':
                _mombotPreferencesTraderListCursor = _mombotPreferencesTraderListHasMore ? _mombotPreferencesTraderListNextCursor : 2;
                RenderMombotPreferencesPage();
                return;

            default:
                EndMombotPreferencesMenu();
                return;
        }
    }

    private void RenderMombotPreferencesPage()
    {
        if (!_mombotPreferencesOpen)
            return;

        var body = new System.Text.StringBuilder();
        body.Append("\x1b[2J\x1b[H");

        switch (_mombotPreferencesPage)
        {
            case MombotPreferencesPage.General:
                BuildMombotGeneralPreferencesPage(body);
                break;

            case MombotPreferencesPage.GameStats:
                BuildMombotGameStatsPreferencesPage(body);
                break;

            case MombotPreferencesPage.Hotkeys:
                BuildMombotHotkeyPreferencesPage(body);
                break;

            case MombotPreferencesPage.ShipInfo:
                BuildMombotShipPreferencesPage(body);
                break;

            case MombotPreferencesPage.PlanetTypes:
                BuildMombotPlanetTypePreferencesPage(body);
                break;

            case MombotPreferencesPage.PlanetList:
                BuildMombotPlanetListPreferencesPage(body);
                break;

            case MombotPreferencesPage.TraderList:
                BuildMombotTraderListPreferencesPage(body);
                break;
        }

        _parser.Feed(body.ToString());
        _buffer.Dirty = true;
        RedrawMombotPrompt();
    }

    private void BuildMombotGeneralPreferencesPage(System.Text.StringBuilder body)
    {
        string botName = ReadCurrentMombotVar("mombot", "$SWITCHBOARD~BOT_NAME", "$SWITCHBOARD~bot_name", "$bot~bot_name", "$bot_name");
        string loginPassword = ReadCurrentMombotVar(string.Empty, "$BOT~PASSWORD", "$bot~password", "$password");
        string botPassword = ReadCurrentMombotVar(string.Empty, "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password");
        string loginName = ReadCurrentMombotVar(string.Empty, "$BOT~USERNAME", "$bot~username", "$username");
        string turnLimit = ReadCurrentMombotVar("0", "$BOT~BOT_TURN_LIMIT", "$bot~bot_turn_limit", "$bot_turn_limit");
        string captureMode = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~defenderCapping"))
            ? "Using defense"
            : IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~offenseCapping", "$offenseCapping"))
                ? "Using offense"
                : "Don't attack";
        string figType = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~dropOffensive"))
            ? "Offensive"
            : IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~dropToll"))
                ? "Toll"
                : "Defensive";
        string avoidPlanets = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundAvoidShieldedOnly"))
            ? "Shielded"
            : IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundAvoidAllPlanets"))
                ? "All"
                : "None";
        string surroundType = IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundOverwrite"))
            ? "All Sectors"
            : IsMombotTruthy(ReadCurrentMombotVar("0", "$PLAYER~surroundPassive"))
                ? "Passive"
                : "Normal";
        string alarmList = ReadCurrentMombotVar(string.Empty, "$BOT~alarm_list", "$bot~alarm_list", "$alarm_list");
        string stardockDisplay = ReadCurrentMombotSectorVar(FormatMombotSector(_sessionDb?.DBHeader.StarDock), "$STARDOCK", "$MAP~STARDOCK", "$MAP~stardock", "$BOT~STARDOCK");
        string backdoorDisplay = ReadCurrentMombotSectorVar("0", "$MAP~BACKDOOR", "$MAP~backdoor");
        string rylosDisplay = ReadCurrentMombotSectorVar(FormatMombotSector(_sessionDb?.DBHeader.Rylos), "$MAP~RYLOS", "$MAP~rylos", "$BOT~RYLOS");
        string alphaDisplay = ReadCurrentMombotSectorVar(FormatMombotSector(_sessionDb?.DBHeader.AlphaCentauri), "$MAP~ALPHA_CENTAURI", "$MAP~alpha_centauri", "$BOT~ALPHA_CENTAURI");
        string homeDisplay = ReadCurrentMombotSectorVar("0", "$MAP~HOME_SECTOR", "$MAP~home_sector", "$BOT~HOME_SECTOR");

        int totalWidth = GetMombotPreferencesLayoutWidth();
        int columnGap = totalWidth >= 104 ? 6 : 4;
        int columnWidth = Math.Max(36, (totalWidth - columnGap) / 2);

        List<MombotPreferencesDisplayCell> leftColumn =
        [
            BuildMombotPreferencesSectionCell("General Info", columnWidth),
            BuildMombotPreferencesKeyValueCell("C", "Login Name:", loginName),
            BuildMombotPreferencesKeyValueCell("P", "Login Password", loginPassword),
            BuildMombotPreferencesKeyValueCell("N", "Bot Name", botName),
            BuildMombotPreferencesKeyValueCell("Z", "Bot Password", botPassword),
            BuildMombotPreferencesKeyValueCell("G", "Game Letter:", ReadCurrentMombotVar(string.Empty, "$BOT~LETTER", "$bot~letter", "$letter")),
            BuildMombotPreferencesKeyValueCell("E", "Banner Interval:", ReadCurrentMombotVar("5760", "$BOT~echoInterval", "$echoInterval") + " Minutes"),
            BuildMombotPreferencesKeyValueCell("1", "Turn Limit:", turnLimit),
            BuildMombotPreferencesKeyValueCell("0", "MSL/Busted Prompt", FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$BOT~command_prompt_extras", "$command_prompt_extras"))),
            BuildMombotPreferencesKeyValueCell("V", "Silent Mode:", FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$BOT~silent_running", "$bot~silent_running", "$silent_running"))),
            BuildMombotPreferencesSectionCell("Capture Options", columnWidth),
            BuildMombotPreferencesKeyValueCell("2", "Alien Ships:", captureMode),
            BuildMombotPreferencesSectionCell("Current Ship Stats", columnWidth),
            BuildMombotPreferencesStatCell("Offensive Odds:", ReadCurrentMombotVar("0", "$SHIP~SHIP_OFFENSIVE_ODDS")),
            BuildMombotPreferencesStatCell("Max Attack:", ReadCurrentMombotVar("0", "$SHIP~SHIP_MAX_ATTACK")),
            BuildMombotPreferencesStatCell("Max Fighters:", ReadCurrentMombotVar("0", "$SHIP~SHIP_FIGHTERS_MAX")),
        ];

        List<MombotPreferencesDisplayCell> rightColumn =
        [
            BuildMombotPreferencesSectionCell("Gridding/Attack Options", columnWidth),
            BuildMombotPreferencesKeyValueCell("3", "Figs to drop:", ReadCurrentMombotVar("0", "$PLAYER~surroundFigs", "$PLAYER~SURROUNDFIGS")),
            BuildMombotPreferencesKeyValueCell("4", "Limps to drop:", ReadCurrentMombotVar("0", "$PLAYER~surroundLimp", "$PLAYER~SURROUNDLIMP")),
            BuildMombotPreferencesKeyValueCell("5", "Armids to drop:", ReadCurrentMombotVar("0", "$PLAYER~surroundMine", "$PLAYER~SURROUNDMINE")),
            BuildMombotPreferencesKeyValueCell("6", "Fig Type:", figType),
            BuildMombotPreferencesKeyValueCell("7", "Auto Kill Mode?", FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$bot~autoattack", "$BOT~autoattack", "$autoattack"))),
            BuildMombotPreferencesKeyValueCell("8", "Avoid Planets?", avoidPlanets),
            BuildMombotPreferencesKeyValueCell("9", "Surround type?", surroundType),
            BuildMombotPreferencesKeyValueCell("K", "Surround HKILL?", FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$PLAYER~surround_before_hkill"))),
            BuildMombotPreferencesKeyValueCell("J", "Alarm List", string.IsNullOrWhiteSpace(alarmList) ? "None" : "Active"),
            BuildMombotPreferencesSectionCell("Location Variables", columnWidth),
            BuildMombotPreferencesLocationCell("S", "Stardock", "S", FormatMombotDefinedSectorDisplay(stardockDisplay)),
            BuildMombotPreferencesLocationCell("B", "Backdoor", "B", FormatMombotDefinedSectorDisplay(backdoorDisplay)),
            BuildMombotPreferencesLocationCell("R", "Rylos", "R", FormatMombotDefinedSectorDisplay(rylosDisplay)),
            BuildMombotPreferencesLocationCell("A", "Alpha", "A", FormatMombotDefinedSectorDisplay(alphaDisplay)),
            BuildMombotPreferencesLocationCell("H", "Home Sector", "H", FormatMombotDefinedSectorDisplay(homeDisplay)),
            BuildMombotPreferencesLocationCell("X", "Safe Ship", "X", FormatMombotDefinedSectorDisplay(ReadCurrentMombotVar("0", "$BOT~SAFE_SHIP", "$BOT~safe_ship", "$bot~safe_ship", "$safe_ship"))),
            BuildMombotPreferencesLocationCell("L", "Safe Planet", "L", FormatMombotDefinedSectorDisplay(ReadCurrentMombotVar("0", "$BOT~SAFE_PLANET", "$BOT~safe_planet", "$bot~safe_planet", "$safe_planet"))),
        ];

        body.Append("\r\n");
        AppendMombotPreferencesTwoColumnCells(body, leftColumn, rightColumn, columnWidth, columnGap);
        body.Append("\r\n");
        AppendMombotPreferencesStyledFooter(body, "[<] Trader List", "Game Stats [>]", totalWidth: totalWidth);
    }

    private void BuildMombotGameStatsPreferencesPage(System.Text.StringBuilder body)
    {
        string serverMaxCommands = ReadCurrentMombotVar("0", "$GAME~MAX_COMMANDS", "$MAX_COMMANDS");

        int totalWidth = GetMombotPreferencesLayoutWidth();
        int columnGap = totalWidth >= 104 ? 6 : 4;
        int columnWidth = Math.Max(36, (totalWidth - columnGap) / 2);

        List<MombotPreferencesDisplayCell> leftColumn =
        [
            BuildMombotPreferencesSectionCell("Hardware / Dock Costs", columnWidth),
            BuildMombotPreferencesStatCell("Atomic Detonators:", ReadCurrentMombotVar("0", "$GAME~ATOMIC_COST", "$ATOMIC_COST"), 24),
            BuildMombotPreferencesStatCell("Marker Beacons:", ReadCurrentMombotVar("0", "$GAME~BEACON_COST", "$BEACON_COST"), 24),
            BuildMombotPreferencesStatCell("Corbomite Devices:", ReadCurrentMombotVar("0", "$GAME~CORBO_COST", "$CORBO_COST"), 24),
            BuildMombotPreferencesStatCell("Cloaking Devices:", ReadCurrentMombotVar("0", "$GAME~CLOAK_COST", "$CLOAK_COST"), 24),
            BuildMombotPreferencesStatCell("Subspace Ether:", ReadCurrentMombotVar("0", "$GAME~PROBE_COST", "$PROBE_COST"), 24),
            BuildMombotPreferencesStatCell("Planet Scanners:", ReadCurrentMombotVar("0", "$GAME~PLANET_SCANNER_COST", "$PLANET_SCANNER_COST"), 24),
            BuildMombotPreferencesStatCell("Limpet Mines:", ReadCurrentMombotVar("0", "$GAME~LIMPET_COST", "$LIMPET_REMOVAL_COST"), 24),
            BuildMombotPreferencesStatCell("Space Mines:", ReadCurrentMombotVar("0", "$GAME~ARMID_COST", "$ARMID_COST"), 24),
            BuildMombotPreferencesStatCell("Photon Missiles:", IsMombotTruthy(ReadCurrentMombotVar("0", "$GAME~PHOTONS_ENABLED", "$PHOTONS_ENABLED")) ? ReadCurrentMombotVar("0", "$GAME~PHOTON_COST", "$PHOTON_COST") : "Disabled", 24),
            BuildMombotPreferencesSectionCell("Scanner / Ship Costs", columnWidth),
            BuildMombotPreferencesStatCell("Holographic Scan:", ReadCurrentMombotVar("0", "$GAME~HOLO_COST", "$HOLO_COST"), 24),
            BuildMombotPreferencesStatCell("Density Scan:", ReadCurrentMombotVar("0", "$GAME~DENSITY_COST", "$DENSITY_COST"), 24),
            BuildMombotPreferencesStatCell("Mine Disruptors:", ReadCurrentMombotVar("0", "$GAME~DISRUPTOR_COST", "$DISRUPTOR_COST"), 24),
            BuildMombotPreferencesStatCell("Genesis Torps:", ReadCurrentMombotVar("0", "$GAME~GENESIS_COST", "$GENESIS_COST"), 24),
            BuildMombotPreferencesStatCell("TransWarp I:", ReadCurrentMombotVar("0", "$GAME~TWARPI_COST", "$TWARPI_COST"), 24),
            BuildMombotPreferencesStatCell("TransWarp II:", ReadCurrentMombotVar("0", "$GAME~TWARPII_COST", "$TWARPII_COST"), 24),
            BuildMombotPreferencesStatCell("Psychic Probes:", ReadCurrentMombotVar("0", "$GAME~PSYCHIC_COST", "$PSYCHIC_COST"), 24),
            BuildMombotPreferencesStatCell("Limpet Removal:", ReadCurrentMombotVar("0", "$GAME~LIMPET_REMOVAL_COST", "$LIMPET_REMOVAL_COST"), 24),
        ];

        List<MombotPreferencesDisplayCell> rightColumn =
        [
            BuildMombotPreferencesSectionCell("Server / Trade Rules", columnWidth),
            BuildMombotPreferencesStatCell("Server Max Cmds:", serverMaxCommands == "0" ? "Unlimited" : serverMaxCommands, 24),
            BuildMombotPreferencesStatCell("Gold Enabled:", FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$GAME~goldEnabled", "$goldEnabled")), 24),
            BuildMombotPreferencesStatCell("MBBS Mode:", FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$GAME~mbbs", "$mbbs")), 24),
            BuildMombotPreferencesStatCell("Multiple Photons:", IsMombotTruthy(ReadCurrentMombotVar("0", "$GAME~PHOTONS_ENABLED", "$PHOTONS_ENABLED")) ? FormatMombotBoolDisplay(ReadCurrentMombotVar("0", "$GAME~MULTIPLE_PHOTONS", "$MULTIPLE_PHOTONS")) : "Disabled", 24),
            BuildMombotPreferencesStatCell("Colonists / Day:", ReadCurrentMombotVar("0", "$GAME~colonist_regen", "$colonist_regen"), 24),
            BuildMombotPreferencesStatCell("Planet Trade:", ReadCurrentMombotVar("0", "$GAME~ptradesetting", "$ptradesetting") + "%", 24),
            BuildMombotPreferencesStatCell("Steal Factor:", ReadCurrentMombotVar("0", "$GAME~STEAL_FACTOR", "$steal_factor"), 24),
            BuildMombotPreferencesStatCell("Rob Factor:", ReadCurrentMombotVar("0", "$GAME~rob_factor", "$rob_factor"), 24),
            BuildMombotPreferencesStatCell("Bust Clear Days:", ReadCurrentMombotVar("0", "$GAME~CLEAR_BUST_DAYS", "$CLEAR_BUST_DAYS"), 24),
            BuildMombotPreferencesSectionCell("Port / Universe Rules", columnWidth),
            BuildMombotPreferencesStatCell("Port Maximum:", ReadCurrentMombotVar("0", "$GAME~PORT_MAX", "$port_max"), 24),
            BuildMombotPreferencesStatCell("Port Prod Rate:", ReadCurrentMombotVar("0", "$GAME~PRODUCTION_RATE", "$PRODUCTION_RATE") + "%", 24),
            BuildMombotPreferencesStatCell("Port Regen Max:", ReadCurrentMombotVar("0", "$GAME~PRODUCTION_REGEN", "$PRODUCTION_REGEN") + "%", 24),
            BuildMombotPreferencesStatCell("Nav Haz Loss:", ReadCurrentMombotVar("0", "$GAME~DEBRIS_LOSS", "$DEBRIS_LOSS") + "%", 24),
            BuildMombotPreferencesStatCell("Radiation Life:", ReadCurrentMombotVar("0", "$GAME~RADIATION_LIFETIME", "$RADIATION_LIFETIME"), 24),
        ];

        body.Append("\r\n");
        AppendMombotPreferencesTwoColumnCells(body, leftColumn, rightColumn, columnWidth, columnGap);
        body.Append("\r\n");
        AppendMombotPreferencesStyledFooter(body, "[<] Preferences", "Hot Keys [>]", totalWidth: totalWidth);
    }

    private void BuildMombotHotkeyPreferencesPage(System.Text.StringBuilder body)
    {
        MombotHotkeyConfigData config = LoadMombotHotkeyConfigData();
        int totalWidth = GetMombotPreferencesLayoutWidth();
        int columnGap = totalWidth >= 104 ? 6 : 4;
        int columnWidth = Math.Max(36, (totalWidth - columnGap) / 2);

        List<MombotPreferencesDisplayCell> leftColumn =
        [
            BuildMombotPreferencesSectionCell("Standard Hot Keys", columnWidth),
        ];

        List<MombotPreferencesDisplayCell> rightColumn =
        [
            BuildMombotPreferencesSectionCell("Custom Hot Keys", columnWidth),
        ];

        for (int slot = 1; slot <= 17; slot++)
        {
            string title = GetMombotHotkeySlotTitle(slot, config.CustomCommands[Math.Min(slot - 1, config.CustomCommands.Length - 1)]);
            string keyValue = slot <= config.CustomKeys.Length ? config.CustomKeys[slot - 1] : "0";
            leftColumn.Add(BuildMombotPreferencesHotkeyCell(GetMombotHotkeySlotLabel(slot), title, FormatMombotHotkeyDisplay(keyValue)));
        }

        for (int slot = 18; slot <= 33; slot++)
        {
            string title = GetMombotHotkeySlotTitle(slot, config.CustomCommands[Math.Min(slot - 1, config.CustomCommands.Length - 1)]);
            string keyValue = slot <= config.CustomKeys.Length ? config.CustomKeys[slot - 1] : "0";
            rightColumn.Add(BuildMombotPreferencesHotkeyCell(GetMombotHotkeySlotLabel(slot), title, FormatMombotHotkeyDisplay(keyValue)));
        }

        body.Append("\r\n");
        AppendMombotPreferencesTwoColumnCells(body, leftColumn, rightColumn, columnWidth, columnGap);
        body.Append("\r\n");
        AppendMombotPreferencesStyledFooter(body, "[<] Game Stats", "Ship Info [>]", "Choose a slot to rebind, any other key exits", totalWidth);
    }

    private void BuildMombotShipPreferencesPage(System.Text.StringBuilder body)
    {
        AppendMombotPreferencesHeader(body, "Preferences", "Known Ship Information");

        List<MombotShipCatalogEntry> ships = LoadMombotShipCatalogEntries();
        if (ships.Count == 0)
        {
            body.Append("No ship catalog file is available.\r\n");
        }
        else
        {
            int start = Math.Clamp(_mombotPreferencesShipPageStart, 1, ships.Count);
            int count = Math.Min(10, ships.Count - start + 1);
            for (int offset = 0; offset < count; offset++)
            {
                MombotShipCatalogEntry ship = ships[start + offset - 1];
                string label = offset.ToString();
                string value = $"Def {ship.DefOdds} Off {ship.OffOdds} TPW {ship.Tpw} Bonus {(ship.Defender ? "Yes" : "No")} Shields {ship.Shields} Figs {ship.MaxFighters}";
                AppendMombotPreferencesEntry(body, label, ship.Name, value);
            }
        }

        AppendMombotPreferencesFooter(body, "[>] Planet Types", "[<] Hot Keys", "[+] More Ships, 0-9 toggles defender, any other key exits");
    }

    private void BuildMombotPlanetTypePreferencesPage(System.Text.StringBuilder body)
    {
        AppendMombotPreferencesHeader(body, "Preferences", "Planet Type Information");

        List<MombotPlanetCatalogEntry> planets = LoadMombotPlanetCatalogEntries();
        if (planets.Count == 0)
        {
            body.Append("No planet catalog file is available.\r\n");
        }
        else
        {
            int start = Math.Clamp(_mombotPreferencesPlanetTypePageStart, 1, planets.Count);
            int count = Math.Min(10, planets.Count - start + 1);
            for (int offset = 0; offset < count; offset++)
            {
                MombotPlanetCatalogEntry planet = planets[start + offset - 1];
                string label = offset.ToString();
                string value = $"Fuel {planet.FuelMin}-{planet.FuelMax} Org {planet.OrgMin}-{planet.OrgMax} Eq {planet.EquipMin}-{planet.EquipMax} Keeper {(planet.Keeper ? "Yes" : "No")}";
                AppendMombotPreferencesEntry(body, label, planet.Name, value);
            }
        }

        AppendMombotPreferencesFooter(body, "[>] Planet List", "[<] Ship Info", "[+] More Planets, [K] toggle keeper, 0-9 edits, any other key exits");
    }

    private void BuildMombotPlanetListPreferencesPage(System.Text.StringBuilder body)
    {
        AppendMombotPreferencesHeader(body, "Preferences", "Known Planet List");

        List<string> lines = CollectMombotPlanetListPage(_mombotPreferencesPlanetListCursor, out int nextCursor, out bool hasMore);
        _mombotPreferencesPlanetListNextCursor = nextCursor;
        _mombotPreferencesPlanetListHasMore = hasMore;

        if (lines.Count == 0)
            body.Append("[End of List]\r\n");
        else
            foreach (string line in lines)
                body.Append(line).Append("\r\n");

        AppendMombotPreferencesFooter(body, "[>] Trader List", "[<] Planet Types", hasMore ? "[+] More Planets, any other key exits" : "Any other key exits");
    }

    private void BuildMombotTraderListPreferencesPage(System.Text.StringBuilder body)
    {
        AppendMombotPreferencesHeader(body, "Preferences", "Trader List");

        List<string> lines = CollectMombotTraderListPage(_mombotPreferencesTraderListCursor, out int nextCursor, out bool hasMore);
        _mombotPreferencesTraderListNextCursor = nextCursor;
        _mombotPreferencesTraderListHasMore = hasMore;

        if (lines.Count == 0)
            body.Append("[End of List]\r\n");
        else
            foreach (string line in lines)
                body.Append(line).Append("\r\n");

        AppendMombotPreferencesFooter(body, "[>] Preferences", "[<] Planet List", hasMore ? "[+] More Traders, any other key exits" : "Any other key exits");
    }

    private enum MombotCountZeroBehavior
    {
        KeepZero,
        TreatAsUndefined,
    }

    private void PromptMombotCountPreference(
        string prompt,
        int minValue,
        int maxValue,
        MombotCountZeroBehavior zeroBehavior = MombotCountZeroBehavior.KeepZero,
        params string[] names)
    {
        BeginMombotPreferencesInput(
            prompt,
            value =>
            {
                if (!int.TryParse(value.Trim(), out int count))
                    return;

                if (count < minValue || count > maxValue)
                    return;

                if (count == 0 && zeroBehavior == MombotCountZeroBehavior.TreatAsUndefined)
                {
                    PersistMombotVars("0", names);
                    return;
                }

                PersistMombotVars(count.ToString(), names);
            },
            ReadCurrentMombotVar(minValue.ToString(), names));
    }

    private enum ResetMombotSpecialSector
    {
        None,
        Stardock,
        Rylos,
        Alpha,
    }

    private void PromptMombotSectorPreference(string prompt, bool allowZeroReset, ResetMombotSpecialSector resetType, params string[] names)
    {
        string currentValue = resetType switch
        {
            ResetMombotSpecialSector.Stardock => ReadCurrentMombotSectorVar(
                FormatMombotSector(_sessionDb?.DBHeader.StarDock),
                "$STARDOCK",
                "$MAP~STARDOCK",
                "$MAP~stardock",
                "$BOT~STARDOCK"),
            ResetMombotSpecialSector.Rylos => ReadCurrentMombotSectorVar(
                FormatMombotSector(_sessionDb?.DBHeader.Rylos),
                "$MAP~RYLOS",
                "$MAP~rylos",
                "$BOT~RYLOS"),
            ResetMombotSpecialSector.Alpha => ReadCurrentMombotSectorVar(
                FormatMombotSector(_sessionDb?.DBHeader.AlphaCentauri),
                "$MAP~ALPHA_CENTAURI",
                "$MAP~alpha_centauri",
                "$BOT~ALPHA_CENTAURI"),
            _ => ReadCurrentMombotSectorVar("0", names),
        };

        BeginMombotPreferencesInput(
            prompt,
            value =>
            {
                if (!int.TryParse(value.Trim(), out int sector))
                    return;

                int maxSector = _sessionDb?.DBHeader.Sectors ?? Math.Max(1, _state.Sector);
                if (sector == 0 && allowZeroReset)
                {
                    string resetValue = resetType switch
                    {
                        ResetMombotSpecialSector.Stardock => FormatMombotSector(_sessionDb?.DBHeader.StarDock),
                        ResetMombotSpecialSector.Rylos => FormatMombotSector(_sessionDb?.DBHeader.Rylos),
                        ResetMombotSpecialSector.Alpha => FormatMombotSector(_sessionDb?.DBHeader.AlphaCentauri),
                        _ => "0",
                    };
                    PersistMombotVars(resetValue, names);
                    return;
                }

                if (sector >= 1 && sector <= maxSector)
                    PersistMombotVars(sector.ToString(), names);
            },
            currentValue);
    }

    private void PersistMombotSurroundPlanetAvoidance(bool allPlanets, bool shieldedOnly, bool none)
    {
        PersistMombotBoolean(shieldedOnly, "$PLAYER~surroundAvoidShieldedOnly");
        PersistMombotBoolean(allPlanets, "$PLAYER~surroundAvoidAllPlanets");
        PersistMombotBoolean(none, "$PLAYER~surroundDontAvoid");
    }

    private void ToggleMombotBooleanPreference(params string[] names)
    {
        bool current = IsMombotTruthy(ReadCurrentMombotVar("0", names));
        PersistMombotBoolean(!current, names);
        RenderMombotPreferencesPage();
    }

    private void PromptMombotHotkeySelection(int slot)
    {
        _mombotPreferencesHotkeySlot = slot;
        MombotHotkeyConfigData config = LoadMombotHotkeyConfigData();
        string slotName = GetMombotHotkeySlotTitle(slot, config.CustomCommands[slot - 1]);
        BeginMombotPreferencesInput(
            $"New Hotkey For {slotName}",
            value => CompleteMombotHotkeySelection(slot, value),
            captureSingleKey: true);
    }

    private void CompleteMombotHotkeySelection(int slot, string value)
    {
        if (string.IsNullOrEmpty(value))
            return;

        char selectedKey = value[0];
        int lower = char.ToLowerInvariant(selectedKey);
        int upper = char.ToUpperInvariant(selectedKey);
        if ((lower >= '0' && lower <= '9') || selectedKey == '?')
        {
            PublishMombotLocalMessage("Hotkeys cannot use digits or '?'.");
            return;
        }

        MombotHotkeyConfigData config = LoadMombotHotkeyConfigData();
        string[] hotkeys = config.Hotkeys.ToArray();
        string[] customKeys = config.CustomKeys.ToArray();
        string[] customCommands = config.CustomCommands.ToArray();
        string slotValue = slot.ToString();

        if (!CanBindMombotHotkeyCode(hotkeys, lower, slotValue) || !CanBindMombotHotkeyCode(hotkeys, upper, slotValue))
        {
            PublishMombotLocalMessage("Hot key already bound to another function.");
            return;
        }

        string existingKey = customKeys[slot - 1];
        if (!string.IsNullOrEmpty(existingKey))
        {
            int existingLower = char.ToLowerInvariant(existingKey[0]);
            int existingUpper = char.ToUpperInvariant(existingKey[0]);
            ClearMombotHotkeyCode(hotkeys, existingLower, slotValue);
            ClearMombotHotkeyCode(hotkeys, existingUpper, slotValue);
        }

        SetMombotHotkeyCode(hotkeys, lower, slotValue);
        SetMombotHotkeyCode(hotkeys, upper, slotValue);
        customKeys[slot - 1] = selectedKey.ToString();

        if (slot > 17)
        {
            string currentCommand = customCommands[slot - 1] == "0" ? string.Empty : customCommands[slot - 1];
            BeginMombotPreferencesInput(
                $"Command For {GetMombotHotkeySlotLabel(slot)}",
                command =>
                {
                    customCommands[slot - 1] = string.IsNullOrWhiteSpace(command) ? "0" : command.Trim();
                    WriteMombotHotkeyConfig(new MombotHotkeyConfigData(hotkeys, customKeys, customCommands));
                },
                currentCommand,
                blankSubmitBehavior: MombotPreferencesBlankSubmitBehavior.Submit);
            return;
        }

        WriteMombotHotkeyConfig(new MombotHotkeyConfigData(hotkeys, customKeys, customCommands));
    }

    private void ToggleMombotShipDefender(int pageOffset)
    {
        List<MombotShipCatalogEntry> ships = LoadMombotShipCatalogEntries();
        int index = _mombotPreferencesShipPageStart + pageOffset - 1;
        if (index < 0 || index >= ships.Count)
            return;

        MombotShipCatalogEntry ship = ships[index];
        ships[index] = ship with { Defender = !ship.Defender };
        WriteMombotShipCatalogEntries(ships);
        RenderMombotPreferencesPage();
    }

    private void ToggleMombotPlanetKeeper(int pageOffset)
    {
        List<MombotPlanetCatalogEntry> planets = LoadMombotPlanetCatalogEntries();
        int index = _mombotPreferencesPlanetTypePageStart + pageOffset - 1;
        if (index < 0 || index >= planets.Count)
            return;

        MombotPlanetCatalogEntry planet = planets[index];
        planets[index] = planet with { Keeper = !planet.Keeper };
        WriteMombotPlanetCatalogEntries(planets);
        RenderMombotPreferencesPage();
    }

    private void PromptMombotPlanetTypeEdit(int pageOffset)
    {
        List<MombotPlanetCatalogEntry> planets = LoadMombotPlanetCatalogEntries();
        int index = _mombotPreferencesPlanetTypePageStart + pageOffset - 1;
        if (index < 0 || index >= planets.Count)
            return;

        MombotPlanetCatalogEntry original = planets[index];
        string[] values =
        {
            original.FuelMin,
            original.FuelMax,
            original.OrgMin,
            original.OrgMax,
            original.EquipMin,
            original.EquipMax,
        };

        string[] prompts =
        {
            $"Min Fuel For {original.Name}",
            $"Max Fuel For {original.Name}",
            $"Min Organics For {original.Name}",
            $"Max Organics For {original.Name}",
            $"Min Equipment For {original.Name}",
            $"Max Equipment For {original.Name}",
        };

        void PromptField(int fieldIndex)
        {
            if (fieldIndex >= values.Length)
            {
                BeginMombotPreferencesInput(
                    $"Keeper Planet {original.Name} (Y/N)",
                    keeper =>
                    {
                        bool isKeeper = keeper.Length > 0 && char.ToUpperInvariant(keeper[0]) == 'Y';
                        planets[index] = original with
                        {
                            FuelMin = values[0],
                            FuelMax = values[1],
                            OrgMin = values[2],
                            OrgMax = values[3],
                            EquipMin = values[4],
                            EquipMax = values[5],
                            Keeper = isKeeper,
                        };
                        WriteMombotPlanetCatalogEntries(planets);
                    },
                    captureSingleKey: true);
                return;
            }

            BeginMombotPreferencesInput(
                prompts[fieldIndex],
                response =>
                {
                    if (!int.TryParse(response.Trim(), out _))
                        return;
                    values[fieldIndex] = response.Trim();
                    PromptField(fieldIndex + 1);
                },
                values[fieldIndex]);
        }

        PromptField(0);
    }

    private List<string> CollectMombotPlanetListPage(int startSector, out int nextCursor, out bool hasMore)
    {
        var results = new List<string>();
        int sectors = _sessionDb?.DBHeader.Sectors ?? 0;
        if (_sessionDb == null || sectors <= 0)
        {
            nextCursor = 2;
            hasMore = false;
            return results;
        }

        int index = Math.Max(2, startSector);
        for (; index <= sectors && results.Count < 3; index++)
        {
            Core.SectorData? sector = _sessionDb.GetSector(index);
            if (sector == null || sector.PlanetNames.Count == 0 || IsMombotBubbleSector(sector))
                continue;

            results.Add($"Sector {sector.Number}: {string.Join(", ", sector.PlanetNames)}");
        }

        hasMore = false;
        nextCursor = 2;
        for (int probe = index; probe <= sectors; probe++)
        {
            Core.SectorData? sector = _sessionDb.GetSector(probe);
            if (sector != null && sector.PlanetNames.Count > 0 && !IsMombotBubbleSector(sector))
            {
                hasMore = true;
                nextCursor = probe;
                break;
            }
        }

        return results;
    }

    private List<string> CollectMombotTraderListPage(int startSector, out int nextCursor, out bool hasMore)
    {
        var results = new List<string>();
        int sectors = _sessionDb?.DBHeader.Sectors ?? 0;
        if (_sessionDb == null || sectors <= 0)
        {
            nextCursor = 2;
            hasMore = false;
            return results;
        }

        int index = Math.Max(2, startSector);
        for (; index <= sectors && results.Count < 3; index++)
        {
            Core.SectorData? sector = _sessionDb.GetSector(index);
            if (sector == null || sector.Traders.Count == 0)
                continue;

            string traders = string.Join(", ", sector.Traders.Select(trader => trader.Name));
            results.Add($"Sector {sector.Number}: {traders}");
        }

        hasMore = false;
        nextCursor = 2;
        for (int probe = index; probe <= sectors; probe++)
        {
            Core.SectorData? sector = _sessionDb.GetSector(probe);
            if (sector != null && sector.Traders.Count > 0)
            {
                hasMore = true;
                nextCursor = probe;
                break;
            }
        }

        return results;
    }

    private List<MombotShipCatalogEntry> LoadMombotShipCatalogEntries()
    {
        string filePath = ResolveMombotCurrentFilePath("$SHIP~cap_file");
        var ships = new List<MombotShipCatalogEntry>();
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            return ships;

        foreach (string line in File.ReadLines(filePath))
        {
            if (TryParseMombotCatalogLine(line, 9, out string[] fields, out string name))
            {
                ships.Add(new MombotShipCatalogEntry(
                    name,
                    fields[0],
                    fields[1],
                    fields[2],
                    fields[3],
                    fields[4],
                    fields[5],
                    fields[6],
                    fields[7],
                    IsMombotTruthy(fields[8])));
            }
        }

        return ships;
    }

    private void WriteMombotShipCatalogEntries(IReadOnlyList<MombotShipCatalogEntry> ships)
    {
        string capFile = ResolveMombotCurrentFilePath("$SHIP~cap_file");
        if (string.IsNullOrWhiteSpace(capFile))
            return;

        string? directory = Path.GetDirectoryName(capFile);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        File.WriteAllLines(
            capFile,
            ships.Select(ship => $"{ship.Shields} {ship.DefOdds} {ship.OffOdds} {ship.Cost} {ship.MaxHolds} {ship.MaxFighters} {ship.InitHolds} {ship.Tpw} {(ship.Defender ? "1" : "0")} {ship.Name}"));

        string bonusFile = Path.Combine(Path.GetDirectoryName(capFile) ?? string.Empty, "dbonus-ships.cfg");
        File.WriteAllLines(bonusFile, ships.Where(ship => ship.Defender).Select(ship => ship.Name));
    }

    private List<MombotPlanetCatalogEntry> LoadMombotPlanetCatalogEntries()
    {
        string filePath = ResolveMombotCurrentFilePath("$PLANET~planet_file");
        var planets = new List<MombotPlanetCatalogEntry>();
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            return planets;

        foreach (string line in File.ReadLines(filePath))
        {
            if (TryParseMombotCatalogLine(line, 7, out string[] fields, out string name))
            {
                planets.Add(new MombotPlanetCatalogEntry(
                    name,
                    fields[0],
                    fields[1],
                    fields[2],
                    fields[3],
                    fields[4],
                    fields[5],
                    IsMombotTruthy(fields[6])));
            }
        }

        return planets;
    }

    private void WriteMombotPlanetCatalogEntries(IReadOnlyList<MombotPlanetCatalogEntry> planets)
    {
        string planetFile = ResolveMombotCurrentFilePath("$PLANET~planet_file");
        if (string.IsNullOrWhiteSpace(planetFile))
            return;

        string? directory = Path.GetDirectoryName(planetFile);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        File.WriteAllLines(
            planetFile,
            planets.Select(planet => $"{planet.FuelMin} {planet.FuelMax} {planet.OrgMin} {planet.OrgMax} {planet.EquipMin} {planet.EquipMax} {(planet.Keeper ? "1" : "0")}  {planet.Name}"));
    }

    private MombotHotkeyConfigData LoadMombotHotkeyConfigData()
    {
        string filePath = ResolveMombotCurrentFilePath("$mombot_config_file");
        if (!string.IsNullOrWhiteSpace(filePath) &&
            TryLoadMombotHotkeyConfigFromFile(filePath, out MombotHotkeyConfigData? loaded) &&
            loaded != null)
        {
            return loaded;
        }

        string? directory = string.IsNullOrWhiteSpace(filePath) ? null : Path.GetDirectoryName(filePath);
        if (!string.IsNullOrWhiteSpace(directory) &&
            TryLoadLegacyMombotHotkeyConfig(
                Path.Combine(directory, "custom_keys.cfg"),
                Path.Combine(directory, "custom_commands.cfg"),
                out MombotHotkeyConfigData? migrated) &&
            migrated != null)
        {
            if (!string.IsNullOrWhiteSpace(filePath))
                WriteMombotHotkeyConfig(migrated);
            return migrated;
        }

        return BuildDefaultMombotHotkeyConfigData();
    }

    private void WriteMombotHotkeyConfig(MombotHotkeyConfigData config)
    {
        string filePath = ResolveMombotCurrentFilePath("$mombot_config_file");
        if (string.IsNullOrWhiteSpace(filePath))
            return;

        WriteMombotHotkeyConfigFile(filePath, config);
        string? directory = Path.GetDirectoryName(filePath);
        if (string.IsNullOrWhiteSpace(directory))
            return;

        foreach (string legacyName in new[] { "hotkeys.cfg", "custom_keys.cfg", "custom_commands.cfg" })
        {
            string legacyPath = Path.Combine(directory, legacyName);
            try
            {
                if (!string.Equals(Path.GetFullPath(legacyPath), Path.GetFullPath(filePath), StringComparison.OrdinalIgnoreCase) &&
                    File.Exists(legacyPath))
                {
                    File.Delete(legacyPath);
                }
            }
            catch
            {
            }
        }
    }

    private static bool TryParseMombotCatalogLine(string line, int fixedFieldCount, out string[] fields, out string trailingName)
    {
        fields = Array.Empty<string>();
        trailingName = string.Empty;
        if (string.IsNullOrWhiteSpace(line))
            return false;

        string[] tokens = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (tokens.Length < fixedFieldCount + 1)
            return false;

        fields = tokens.Take(fixedFieldCount).ToArray();
        trailingName = string.Join(" ", tokens.Skip(fixedFieldCount));
        return !string.IsNullOrWhiteSpace(trailingName);
    }

    private static bool TryGetMombotHotkeySlotFromSelection(char selection, out int slot)
    {
        const string options = "1234567890ABCDEFGHIJKLMNOPRSTUVWX";
        int index = options.IndexOf(selection);
        slot = index + 1;
        return index >= 0;
    }

    private static bool TryGetMombotPagedItemOffset(char selection, out int offset)
    {
        if (selection >= '0' && selection <= '9')
        {
            offset = selection == '0' ? 0 : selection - '0';
            return true;
        }

        offset = -1;
        return false;
    }

    private static string GetMombotHotkeySlotLabel(int slot)
    {
        const string options = "1234567890ABCDEFGHIJKLMNOPRSTUVWX";
        return slot >= 1 && slot <= options.Length ? options[slot - 1].ToString() : slot.ToString();
    }

    private static string GetMombotHotkeySlotTitle(int slot, string command)
    {
        string[] builtIns =
        {
            "Auto Kill",
            "Auto Capture",
            "Auto Refurb",
            "Surround",
            "Holo-Torp",
            "Transwarp Drive",
            "Planet Macros",
            "Quick Script Loading",
            "Dny Holo Kill",
            "Stop Current Mode",
            "Dock Macros",
            "Exit Enter",
            "Mow",
            "Fast Foton",
            "Clear Sector",
            "Preferences",
            "LS Dock Shopper",
        };

        if (slot >= 1 && slot <= builtIns.Length)
            return builtIns[slot - 1];

        return string.IsNullOrWhiteSpace(command) || command == "0"
            ? $"Custom Hotkey {slot - 17}"
            : command;
    }

    private static string GetMombotPreferencesPageTitle(MombotPreferencesPage page)
    {
        return page switch
        {
            MombotPreferencesPage.General => "***Preferences",
            MombotPreferencesPage.GameStats => "***Game Stats",
            MombotPreferencesPage.Hotkeys => "***Hot Keys",
            MombotPreferencesPage.ShipInfo => "***Ship Info",
            MombotPreferencesPage.PlanetTypes => "***Planet Types",
            MombotPreferencesPage.PlanetList => "***Planet List",
            MombotPreferencesPage.TraderList => "***Trader List",
            _ => "***Preferences",
        };
    }

    private int GetMombotPreferencesLayoutWidth()
    {
        int columns = _buffer.Columns > 0 ? _buffer.Columns : 110;
        return Math.Clamp(columns - 2, 78, 110);
    }

    private readonly record struct MombotPreferencesDisplayCell(string Text, int VisibleWidth);

    private static void AppendMombotPreferencesHeader(System.Text.StringBuilder body, string title, string subtitle)
    {
        body.Append("\x1b[1;33mMombot ").Append(title).Append("\x1b[0m");
        if (!string.IsNullOrWhiteSpace(subtitle))
            body.Append(" - ").Append(subtitle);
        body.Append("\r\n\r\n");
    }

    private static MombotPreferencesDisplayCell BuildMombotPreferencesSectionCell(string title, int width)
    {
        int visibleWidth = Math.Max(width, title.Length);
        int pad = Math.Max(0, visibleWidth - title.Length);
        int leftPad = pad / 2;
        int rightPad = pad - leftPad;
        string text = "\x1b[1;36m" + new string(' ', leftPad) + title + new string(' ', rightPad) + "\x1b[0m";
        return new MombotPreferencesDisplayCell(text, visibleWidth);
    }

    private static MombotPreferencesDisplayCell BuildMombotPreferencesKeyValueCell(string key, string label, string value, int labelWidth = 18)
    {
        string safeValue = FormatMombotPreferencesValue(value);
        string paddedLabel = label.PadRight(labelWidth);
        string text = "\x1b[1;35m<\x1b[1;32m" + key + "\x1b[1;35m>\x1b[0m " +
            "\x1b[1;37m" + paddedLabel + "\x1b[0m " +
            "\x1b[1;33m" + safeValue + "\x1b[0m";
        int visibleWidth = 3 + 1 + labelWidth + 1 + safeValue.Length;
        return new MombotPreferencesDisplayCell(text, visibleWidth);
    }

    private static MombotPreferencesDisplayCell BuildMombotPreferencesLocationCell(string key, string label, string shortLabel, string value)
    {
        string safeValue = FormatMombotPreferencesValue(value);
        string paddedLabel = (label + ":").PadRight(12);
        string paddedShortLabel = ("(" + shortLabel + ")").PadRight(4);
        string text = "\x1b[1;35m<\x1b[1;32m" + key + "\x1b[1;35m>\x1b[0m " +
            "\x1b[1;37m" + paddedLabel + "\x1b[0m " +
            "\x1b[1;37m" + paddedShortLabel + "\x1b[0m " +
            "\x1b[1;33m" + safeValue + "\x1b[0m";
        int visibleWidth = 3 + 1 + 12 + 1 + 4 + 1 + safeValue.Length;
        return new MombotPreferencesDisplayCell(text, visibleWidth);
    }

    private static MombotPreferencesDisplayCell BuildMombotPreferencesStatCell(string label, string value, int labelWidth = 18)
    {
        string safeValue = FormatMombotPreferencesValue(value);
        string paddedLabel = label.PadRight(labelWidth);
        string text = "\x1b[1;37m" + paddedLabel + "\x1b[0m " +
            "\x1b[1;33m" + safeValue + "\x1b[0m";
        int visibleWidth = labelWidth + 1 + safeValue.Length;
        return new MombotPreferencesDisplayCell(text, visibleWidth);
    }

    private static MombotPreferencesDisplayCell BuildMombotPreferencesHotkeyCell(string key, string title, string binding, int titleWidth = 24)
    {
        string safeBinding = FormatMombotPreferencesValue(binding);
        string paddedTitle = title.PadRight(titleWidth);
        string text = "\x1b[1;35m<\x1b[1;32m" + key + "\x1b[1;35m>\x1b[0m " +
            "\x1b[1;37m" + paddedTitle + "\x1b[0m " +
            "\x1b[1;33m" + safeBinding + "\x1b[0m";
        int visibleWidth = 3 + 1 + titleWidth + 1 + safeBinding.Length;
        return new MombotPreferencesDisplayCell(text, visibleWidth);
    }

    private static void AppendMombotPreferencesTwoColumnCells(
        System.Text.StringBuilder body,
        IReadOnlyList<MombotPreferencesDisplayCell> leftColumn,
        IReadOnlyList<MombotPreferencesDisplayCell> rightColumn,
        int columnWidth,
        int columnGap)
    {
        int rows = Math.Max(leftColumn.Count, rightColumn.Count);
        for (int i = 0; i < rows; i++)
        {
            MombotPreferencesDisplayCell left = i < leftColumn.Count
                ? leftColumn[i]
                : new MombotPreferencesDisplayCell(string.Empty, 0);
            MombotPreferencesDisplayCell right = i < rightColumn.Count
                ? rightColumn[i]
                : new MombotPreferencesDisplayCell(string.Empty, 0);

            body.Append(left.Text);
            int spacing = Math.Max(columnGap, columnWidth - left.VisibleWidth + columnGap);
            body.Append(' ', spacing);
            body.Append(right.Text);
            body.Append("\r\n");
        }
    }

    private static void AppendMombotPreferencesStyledFooter(System.Text.StringBuilder body, string leftHint, string rightHint, string miscHint = "Any other key exits", int totalWidth = 110)
    {
        string leftText = FormatMombotPreferencesNavHint(leftHint);
        string rightText = FormatMombotPreferencesNavHint(rightHint);
        int visibleWidth = leftHint.Length + rightHint.Length;
        int spacing = Math.Max(6, totalWidth - visibleWidth);

        body.Append(leftText)
            .Append(' ', spacing)
            .Append(rightText)
            .Append("\r\n")
            .Append("\x1b[0;37m")
            .Append(miscHint)
            .Append("\x1b[0m\r\n");
    }

    private static string FormatMombotPreferencesNavHint(string text)
    {
        return text
            .Replace("[<]", "\x1b[1;35m[\x1b[1;32m<\x1b[1;35m]\x1b[0m")
            .Replace("[>]", "\x1b[1;35m[\x1b[1;32m>\x1b[1;35m]\x1b[0m");
    }

    private static string FormatMombotPreferencesValue(string value)
        => string.IsNullOrWhiteSpace(value) ? "(empty)" : value.Trim();

    private static void AppendMombotPreferencesEntry(System.Text.StringBuilder body, string key, string label, string value)
    {
        body.Append('[').Append(key).Append("] ")
            .Append(label.PadRight(24))
            .Append(value)
            .Append("\r\n");
    }

    private static void AppendMombotPreferencesFooter(System.Text.StringBuilder body, string nextHint, string prevHint, string miscHint)
    {
        body.Append("\r\n")
            .Append(nextHint)
            .Append("   ")
            .Append(prevHint)
            .Append("\r\n")
            .Append(miscHint)
            .Append("\r\n");
    }

    private static string MaskMombotSecret(string value)
        => string.IsNullOrWhiteSpace(value) ? "(empty)" : new string('*', Math.Max(4, value.Trim().Length));

    private static string FormatMombotBoolDisplay(string value)
        => IsMombotTruthy(value) ? "Yes" : "No";

    private static string FormatMombotDefinedSectorDisplay(string value)
        => int.TryParse(value, out int sector) && sector > 0 ? sector.ToString() : "Not Defined";

    private static string FormatMombotHotkeyDisplay(string value)
    {
        if (string.IsNullOrEmpty(value) || value == "0")
            return "Undefined";

        return value[0] switch
        {
            '\t' => "TAB-TAB",
            '\r' => "TAB-Enter",
            '\b' => "TAB-Backspace",
            ' ' => "TAB-Spacebar",
            _ => "TAB-" + value,
        };
    }

    private static bool IsMombotTruthy(string value)
    {
        string normalized = (value ?? string.Empty).Trim();
        return string.Equals(normalized, "1", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(normalized, "true", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(normalized, "yes", StringComparison.OrdinalIgnoreCase);
    }

    private void PersistMombotVars(string value, params string[] names)
    {
        Core.TwxRuntimeContext? context = CurrentMombotRuntimeContext();
        foreach (string name in names.Where(static name => !string.IsNullOrWhiteSpace(name)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            Core.ScriptRef.SetCurrentGameVar(context, name, value);
            Core.ScriptRef.InvokeOnVariableSaved(context, name, value);
        }
    }

    private void PersistMombotBoolean(bool enabled, params string[] names)
        => PersistMombotVars(enabled ? "1" : "0", names);

    private static bool CanBindMombotHotkeyCode(IReadOnlyList<string> hotkeys, int charCode, string slotValue)
    {
        if (charCode <= 0 || charCode > hotkeys.Count)
            return false;

        string existing = hotkeys[charCode - 1];
        return string.IsNullOrWhiteSpace(existing) || existing == "0" || existing == slotValue;
    }

    private static void SetMombotHotkeyCode(IList<string> hotkeys, int charCode, string slotValue)
    {
        if (charCode >= 1 && charCode <= hotkeys.Count)
            hotkeys[charCode - 1] = slotValue;
    }

    private static void ClearMombotHotkeyCode(IList<string> hotkeys, int charCode, string slotValue)
    {
        if (charCode >= 1 && charCode <= hotkeys.Count && hotkeys[charCode - 1] == slotValue)
            hotkeys[charCode - 1] = "0";
    }

    private static bool IsMombotBubbleSector(Core.SectorData sector)
        => sector.Variables.TryGetValue("BUBBLE", out string? value) && IsMombotTruthy(value);

    private string BuildMombotMacroHelpLine()
    {
        if (_mombotMacroContext is not { } context)
            return "mombot grid: H=holo D=density S=surround X=xenter Esc=cancel";

        string line = "mombot grid: H=holo D=density S=surround X=xenter";
        if (context.AdjacentSectors.Count > 0)
        {
            string sectorKeys = string.Join(" ", context.AdjacentSectors
                .Take(10)
                .Select((sector, index) => $"{((index + 1) % 10)}={sector}"));
            line += " " + sectorKeys;
        }

        return line + " Esc=cancel";
    }

    private bool TryHandleMombotMacroKey(byte value)
    {
        if (_mombotMacroContext is not { } context)
        {
            EndMombotMacroPrompt();
            return true;
        }

        if (value >= (byte)'0' && value <= (byte)'9')
        {
            int index = value == (byte)'0' ? 9 : value - (byte)'1';
            if (index >= 0 && index < context.AdjacentSectors.Count)
            {
                int sector = context.AdjacentSectors[index];
                _ = ExecuteMombotMacroActionAsync(async macroContext =>
                {
                    if (macroContext.Surface == MombotPromptSurface.Citadel)
                        await ExecuteMombotUiCommandAsync($"pgrid {sector} scan");
                    else
                        await SendMombotServerMacroAsync(BuildMombotMoveMacro(sector));
                });
                return true;
            }
        }

        switch (char.ToUpperInvariant((char)value))
        {
            case 'H':
                _ = ExecuteMombotMacroActionAsync(macroContext =>
                    SendMombotServerMacroAsync(BuildMombotScanMacro(holo: true, macroContext)));
                return true;

            case 'D':
                _ = ExecuteMombotMacroActionAsync(macroContext =>
                    SendMombotServerMacroAsync(BuildMombotScanMacro(holo: false, macroContext)));
                return true;

            case 'S':
                _ = ExecuteMombotMacroActionAsync(_ => ExecuteMombotUiCommandAsync("surround"));
                return true;

            case 'X':
                _ = ExecuteMombotMacroActionAsync(_ => ExecuteMombotUiCommandAsync("xenter"));
                return true;
        }

        return false;
    }

    private async Task ExecuteMombotMacroActionAsync(Func<MombotGridContext, Task> action)
    {
        MombotGridContext? context = _mombotMacroContext;
        if (context == null)
        {
            _mombotMacroPromptOpen = false;
            _mombotMacroContext = null;
            RedrawMombotPrompt();
            return;
        }

        await action(context);
        if (!_mombotPromptOpen)
            return;

        if (_gameInstance == null || !_gameInstance.IsConnected)
        {
            _mombotMacroPromptOpen = false;
            _mombotMacroContext = null;
            RedrawMombotPrompt();
            return;
        }

        MombotGridContext refreshedContext = BuildMombotGridContext();
        if (refreshedContext.Surface != MombotPromptSurface.Command &&
            refreshedContext.Surface != MombotPromptSurface.Citadel)
        {
            _mombotMacroPromptOpen = false;
            _mombotMacroContext = null;
            RedrawMombotPrompt();
            return;
        }

        _mombotMacroPromptOpen = true;
        _mombotMacroContext = refreshedContext;
    }

    private void PublishMombotLocalMessage(string message)
    {
        if (_gameInstance != null)
            _gameInstance.ClientMessage("\r\n" + message + "\r\n");
        else
            _parser.Feed("\r\n" + message + "\r\n");

        if (HasMombotInteractiveState())
            RedrawMombotPrompt();
        else
            FocusActiveTerminal();

        _buffer.Dirty = true;
    }

    private bool TryInterceptMombotCommandPrompt(byte[] bytes)
    {
        if (_gameInstance == null ||
            !_mombot.Enabled ||
            _mombotPromptOpen ||
            _mombotHotkeyPromptOpen ||
            _mombotScriptPromptOpen ||
            _gameInstance.IsProxyMenuActive)
        {
            return false;
        }

        if (bytes.Length != 1 || bytes[0] != (byte)'>')
            return false;

        Core.ModInterpreter? interpreter = CurrentInterpreter;
        if (interpreter == null ||
            interpreter.HasKeypressInputWaiting ||
            interpreter.IsAnyScriptWaitingForInput())
        {
            return false;
        }

        MombotPromptSurface surface = GetMombotPromptSurface();
        if (_gameInstance.IsConnected && surface == MombotPromptSurface.Unknown)
            return false;

        BeginMombotPrompt();
        return true;
    }

    private bool TryInterceptMombotHotkeyAccess(byte[] bytes)
    {
        if (_gameInstance == null ||
            !_mombot.Enabled ||
            _mombotHotkeyPromptOpen ||
            _mombotScriptPromptOpen ||
            _gameInstance.IsProxyMenuActive)
        {
            return false;
        }

        if (bytes.Length != 1 || bytes[0] != 0x09)
            return false;

        Core.ModInterpreter? interpreter = CurrentInterpreter;
        if (interpreter == null ||
            interpreter.HasKeypressInputWaiting ||
            interpreter.IsAnyScriptWaitingForInput())
        {
            return false;
        }

        BeginMombotHotkeyPrompt();
        return true;
    }

    private MombotPromptSurface GetMombotPromptSurface()
    {
        string promptVar = ReadCurrentMombotVar(string.Empty, "$PLAYER~CURRENT_PROMPT");
        if (string.Equals(promptVar, "Command", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Command;
        if (string.Equals(promptVar, "Citadel", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Citadel;
        if (string.Equals(promptVar, "Planet", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Planet;
        if (string.Equals(promptVar, "Computer", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Computer;

        Core.TwxRuntimeContext? context = CurrentMombotRuntimeContext();
        string currentLine = Core.ScriptRef.GetCurrentLine(context).Trim();
        string currentAnsi = Core.ScriptRef.GetCurrentAnsiLine(context);
        if (currentLine.StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Command;
        if (currentLine.StartsWith("Planet command (", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Planet;
        if (currentLine.StartsWith("Computer command [TL=", StringComparison.OrdinalIgnoreCase))
            return MombotPromptSurface.Computer;
        if (currentLine.Contains("Citadel", StringComparison.OrdinalIgnoreCase) ||
            currentLine.Contains("<Enter Citadel>", StringComparison.OrdinalIgnoreCase) ||
            currentAnsi.Contains("Citadel", StringComparison.OrdinalIgnoreCase))
        {
            return MombotPromptSurface.Citadel;
        }

        return MombotPromptSurface.Unknown;
    }

    private MombotGridContext BuildMombotGridContext()
    {
        int currentSector = Core.ScriptRef.GetCurrentSector(CurrentMombotRuntimeContext());
        IReadOnlyList<int> adjacentSectors = _sessionDb?.GetSector(currentSector)?.Warp
            .Where(warp => warp > 0)
            .Select(warp => (int)warp)
            .Distinct()
            .ToArray()
            ?? Array.Empty<int>();

        return new MombotGridContext(
            GetMombotPromptSurface(),
            currentSector,
            adjacentSectors,
            ParseGameVarInt(ReadCurrentMombotVar("0", "$PLANET~PLANET")),
            _gameInstance?.IsConnected == true,
            _state.Photon);
    }

    private static int ParseGameVarInt(string value)
        => int.TryParse(value, out int parsed) ? parsed : 0;

    private async Task ExecuteMombotHotkeySelectionAsync(string commandOrAction)
    {
        if (string.IsNullOrWhiteSpace(commandOrAction))
        {
            EndMombotHotkeyPrompt();
            return;
        }

        EndMombotHotkeyPrompt();

        if (commandOrAction.StartsWith(":", StringComparison.Ordinal))
        {
            await ExecuteMombotHotkeyActionAsync(commandOrAction);
            return;
        }

        await ExecuteMombotHotkeyCommandAsync(commandOrAction);
    }

    private async Task ExecuteMombotHotkeyActionAsync(string actionRef)
    {
        string normalized = actionRef.Trim().ToLowerInvariant();
        switch (normalized)
        {
            case ":user_interface~script_access":
                BeginMombotScriptPrompt();
                return;

            case ":menus~preferencesmenu":
                BeginMombotPreferencesMenu();
                return;

            case ":internal_commands~twarpswitch":
                ResetMombotPromptState();
                _parser.Feed("\r\x1b[K");
                _buffer.Dirty = true;
                BeginMombotPrompt("twarp ");
                return;

            case ":internal_commands~mowswitch":
                ResetMombotPromptState();
                _parser.Feed("\r\x1b[K");
                _buffer.Dirty = true;
                BeginMombotPrompt("mow ", NormalizeMombotMowHotkeyCommand);
                return;

            case ":internal_commands~stopmodules":
                await ExecuteMombotHotkeyCommandAsync("stopmodules");
                EnsureEmbeddedMombotClientAudible();
                ApplyMombotExecutionRefresh();
                return;

            case ":internal_commands~autocap":
            case ":internal_commands~autocapture":
                await ExecuteMombotHotkeyCommandAsync("cap");
                return;

            case ":internal_commands~autokill":
                await ExecuteMombotHotkeyCommandAsync("kill furb silent");
                return;

            case ":internal_commands~autorefurb":
                await ExecuteMombotHotkeyCommandAsync("refurb");
                return;

            case ":internal_commands~hkill":
            case ":holo_kill":
                await ExecuteMombotHotkeyCommandAsync("hkill");
                return;

            case ":internal_commands~htorp":
            case ":holotorp":
                await ExecuteMombotHotkeyCommandAsync("htorp");
                return;

            case ":internal_commands~surround":
                await ExecuteMombotHotkeyCommandAsync("surround");
                return;

            case ":internal_commands~xenter":
            case ":internal_commands~exit":
                await ExecuteMombotHotkeyCommandAsync("xenter");
                return;

            case ":internal_commands~clear":
                await ExecuteMombotHotkeyCommandAsync("clear");
                return;

            case ":internal_commands~kit":
                await ExecuteMombotHotkeyCommandAsync("macro_kit");
                return;

            case ":internal_commands~dock_shopper":
                await ExecuteMombotHotkeyCommandAsync("dock_shopper");
                return;

            case ":internal_commands~fotonswitch":
                await ExecuteMombotHotkeyCommandAsync(ResolveMombotPhotonHotkeyCommand());
                return;
        }

        await ExecuteMombotHotkeyInternalActionAsync(actionRef);
    }

    private async Task<bool> ExecuteMombotRemoteInputAsync(string input)
    {
        if (!_mombot.Enabled)
            return false;

        await ExecuteMombotUiCommandAsync(input);
        return true;
    }

    private async Task<Core.NativeBotClientInputResult> ExecuteMombotRemoteHotkeyAsync(byte keyByte)
    {
        if (!_mombot.Enabled)
            return Core.NativeBotClientInputResult.NotHandled;

        if (keyByte == (byte)'?')
        {
            await ExecuteMombotUiCommandAsync("help");
            return Core.NativeBotClientInputResult.Handled;
        }

        if (keyByte >= (byte)'0' && keyByte <= (byte)'9')
        {
            await ExecuteMombotHotkeyScriptAsync(keyByte == (byte)'0' ? 10 : keyByte - (byte)'0');
            return Core.NativeBotClientInputResult.Handled;
        }

        if (keyByte == 0x09)
        {
            if (TryResolveMombotHotkeyCommand(0x09, out string? tabCommandOrAction) &&
                !string.IsNullOrWhiteSpace(tabCommandOrAction))
            {
                return await ExecuteMombotRemoteHotkeySelectionAsync(tabCommandOrAction);
            }

            await ExecuteMombotUiCommandAsync("stopmodules");
            return Core.NativeBotClientInputResult.Handled;
        }

        if (TryResolveMombotHotkeyCommand(keyByte, out string? commandOrAction) &&
            !string.IsNullOrWhiteSpace(commandOrAction))
        {
            return await ExecuteMombotRemoteHotkeySelectionAsync(commandOrAction);
        }

        return Core.NativeBotClientInputResult.Handled;
    }

    private async Task<Core.NativeBotClientInputResult> ExecuteMombotRemoteHotkeySelectionAsync(string commandOrAction)
    {
        if (string.IsNullOrWhiteSpace(commandOrAction))
            return Core.NativeBotClientInputResult.Handled;

        if (commandOrAction.StartsWith(":", StringComparison.Ordinal))
            return await ExecuteMombotRemoteHotkeyActionAsync(commandOrAction);

        await ExecuteMombotUiCommandAsync(commandOrAction);
        return Core.NativeBotClientInputResult.Handled;
    }

    private async Task<Core.NativeBotClientInputResult> ExecuteMombotRemoteHotkeyActionAsync(string actionRef)
    {
        string normalized = actionRef.Trim().ToLowerInvariant();
        switch (normalized)
        {
            case ":internal_commands~twarpswitch":
                return Core.NativeBotClientInputResult.StartPrompt("twarp ");

            case ":internal_commands~mowswitch":
                return Core.NativeBotClientInputResult.StartPrompt("mow ");

            case ":internal_commands~stopmodules":
                await ExecuteMombotUiCommandAsync("stopmodules");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~autocap":
            case ":internal_commands~autocapture":
                await ExecuteMombotUiCommandAsync("cap");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~autokill":
                await ExecuteMombotUiCommandAsync("kill furb silent");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~autorefurb":
                await ExecuteMombotUiCommandAsync("refurb");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~hkill":
            case ":holo_kill":
                await ExecuteMombotUiCommandAsync("hkill");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~htorp":
            case ":holotorp":
                await ExecuteMombotUiCommandAsync("htorp");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~surround":
                await ExecuteMombotUiCommandAsync("surround");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~xenter":
            case ":internal_commands~exit":
                await ExecuteMombotUiCommandAsync("xenter");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~clear":
                await ExecuteMombotUiCommandAsync("clear");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~kit":
                await ExecuteMombotUiCommandAsync("macro_kit");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~dock_shopper":
                await ExecuteMombotUiCommandAsync("dock_shopper");
                return Core.NativeBotClientInputResult.Handled;

            case ":internal_commands~fotonswitch":
                await ExecuteMombotUiCommandAsync(ResolveMombotPhotonHotkeyCommand());
                return Core.NativeBotClientInputResult.Handled;

            case ":user_interface~script_access":
                PublishMombotLocalMessage("Remote Mombot script access uses TAB-1 through TAB-0 for configured hotkey scripts.");
                return Core.NativeBotClientInputResult.Handled;

            case ":menus~preferencesmenu":
                PublishMombotLocalMessage("Mombot preferences are available in the host MTC window.");
                return Core.NativeBotClientInputResult.Handled;
        }

        PublishMombotLocalMessage($"Mombot could not execute remote hotkey action {actionRef}: no native mapping is defined for this action.");
        ApplyMombotExecutionRefresh();
        return Core.NativeBotClientInputResult.Handled;
    }

    private string ResolveMombotPhotonHotkeyCommand()
    {
        string mode = ReadCurrentMombotVar(string.Empty, "$BOT~MODE");
        return string.Equals(mode, "Foton", StringComparison.OrdinalIgnoreCase)
            ? "foton off"
            : "foton on p";
    }

    private async Task ExecuteMombotHotkeyCommandAsync(string command)
    {
        ResetMombotPromptState();
        _parser.Feed("\r\x1b[K");
        _buffer.Dirty = true;
        await ExecuteMombotUiCommandAsync(command);
    }

    private async Task ExecuteMombotHotkeyInternalActionAsync(string actionRef)
    {
        ResetMombotPromptState();
        _parser.Feed("\r\x1b[K");
        _buffer.Dirty = true;
        PublishMombotLocalMessage($"Mombot could not execute hotkey action {actionRef}: no native mapping is defined for this action.");
        ApplyMombotExecutionRefresh();
        await Task.CompletedTask;
    }

    private async Task ExecuteMombotHotkeyScriptAsync(int slot)
    {
        IReadOnlyList<MombotHotkeyScriptEntry> scripts = _mombotHotkeyScripts.Count > 0
            ? _mombotHotkeyScripts
            : LoadMombotHotkeyScripts();

        MombotHotkeyScriptEntry? selected = scripts.FirstOrDefault(entry => entry.Slot == slot);
        if (selected == null)
        {
            ResetMombotPromptState();
            _parser.Feed("\r\x1b[K");
            _buffer.Dirty = true;
            PublishMombotLocalMessage($"No Mombot hotkey script is configured for slot {slot % 10}.");
            return;
        }

        string scriptPath = selected.LoadReference;
        string resolvedPath = ResolveMombotFilePath(scriptPath);

        ResetMombotPromptState();
        _parser.Feed("\r\x1b[K");
        _buffer.Dirty = true;

        if (!File.Exists(resolvedPath))
        {
            PublishMombotLocalMessage(
                $"{scriptPath} does not exist in the configured Mombot script path. Check {ReadCurrentMombotVar("hotkey_scripts.cfg", "$SCRIPT_FILE")}.");
            return;
        }

        if (!_mombot.TryLoadScript(scriptPath, out string? error))
        {
            PublishMombotLocalMessage($"Mombot could not load {scriptPath}: {error}");
            return;
        }

        PublishMombotLocalMessage($"Mombot loaded script {selected.DisplayName} ({scriptPath}).");
        ApplyMombotExecutionRefresh();
        await Task.CompletedTask;
    }

    private bool TryResolveMombotHotkeyCommand(byte keyByte, out string? commandOrAction)
    {
        commandOrAction = null;

        MombotHotkeyConfigData config = LoadMombotHotkeyConfigData();
        IReadOnlyList<string> hotkeys = config.Hotkeys;
        if (keyByte == 0 || keyByte > hotkeys.Count)
            return false;

        string slotValue = hotkeys[keyByte - 1].Trim();
        if (!int.TryParse(slotValue, out int slot) || slot <= 0)
            return false;

        if (slot > config.CustomCommands.Length)
            return false;

        string entry = config.CustomCommands[slot - 1].Trim();
        if (string.IsNullOrWhiteSpace(entry) || entry == "0")
            return false;

        commandOrAction = entry;
        return true;
    }

    private IReadOnlyList<MombotHotkeyScriptEntry> LoadMombotHotkeyScripts()
    {
        string filePath = ResolveMombotCurrentFilePath("$SCRIPT_FILE");
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            return Array.Empty<MombotHotkeyScriptEntry>();

        var scripts = new List<MombotHotkeyScriptEntry>();
        try
        {
            int slot = 1;
            foreach (string rawLine in File.ReadLines(filePath))
            {
                if (slot > 10)
                    break;

                string line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                int quoteIndex = line.IndexOf('"');
                if (quoteIndex <= 0)
                    continue;

                string loadReference = NormalizeMombotHotkeyScriptReference(line[..quoteIndex].Trim());
                string displayName = line[quoteIndex..].Trim().Trim('"').Trim();
                if (string.IsNullOrWhiteSpace(loadReference))
                    continue;

                scripts.Add(new MombotHotkeyScriptEntry(
                    slot,
                    loadReference,
                    string.IsNullOrWhiteSpace(displayName) ? Path.GetFileNameWithoutExtension(loadReference) : displayName));
                slot++;
            }
        }
        catch
        {
            return Array.Empty<MombotHotkeyScriptEntry>();
        }

        return scripts;
    }

    private string NormalizeMombotHotkeyScriptReference(string loadReference)
    {
        if (string.IsNullOrWhiteSpace(loadReference))
            return string.Empty;

        string normalized = loadReference.Trim().Replace('\\', '/');
        string directPath = ResolveMombotFilePath(normalized);
        if (File.Exists(directPath))
            return normalized;

        if (!normalized.StartsWith("scripts/", StringComparison.OrdinalIgnoreCase))
        {
            string prefixed = "scripts/" + normalized.TrimStart('/');
            if (File.Exists(ResolveMombotFilePath(prefixed)))
                return prefixed;
        }

        return normalized;
    }

    private string ResolveMombotCurrentFilePath(string currentVarName)
    {
        string relativePath = ReadCurrentMombotVar(string.Empty, currentVarName);
        return string.IsNullOrWhiteSpace(relativePath)
            ? string.Empty
            : ResolveMombotFilePath(relativePath);
    }

    private string ResolveMombotFilePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return string.Empty;

        string normalized = path.Replace('/', Path.DirectorySeparatorChar);
        if (Path.IsPathRooted(normalized))
            return Path.GetFullPath(normalized);

        string programDir = CurrentInterpreter?.ProgramDir ?? GetEffectiveProxyProgramDir(GetEffectiveProxyScriptDirectory());
        return Path.GetFullPath(Path.Combine(programDir, normalized));
    }

    private void PublishMombotScriptPromptList(IReadOnlyList<MombotHotkeyScriptEntry> scripts)
    {
        if (scripts.Count == 0)
            return;

        _parser.Feed("\r\x1b[K");
        foreach (MombotHotkeyScriptEntry script in scripts)
        {
            string slotLabel = script.Slot == 10 ? "0" : script.Slot.ToString();
            _parser.Feed($"\r\n\x1b[1;33m{slotLabel})\x1b[0m {script.DisplayName}");
        }

        _parser.Feed("\r\n");
        _buffer.Dirty = true;
        FocusActiveTerminal();
    }

    private string BuildMombotScanMacro(bool holo, MombotGridContext context)
    {
        string macro = context.Surface == MombotPromptSurface.Citadel ? "q q z n " : string.Empty;
        macro += holo ? "szhzn* " : "sdz* ";

        if (context.Surface == MombotPromptSurface.Citadel && context.PlanetNumber > 0)
            macro += $"l {context.PlanetNumber}*  c  ";

        return macro;
    }

    private string BuildMombotMoveMacro(int sector)
    {
        int starDock = _sessionDb?.DBHeader.StarDock ?? 0;
        string macro = $"m {sector}*";

        if (sector <= 10 || sector == starDock)
            return macro;

        int shipMaxAttack = ParseGameVarInt(ReadCurrentMombotVar("0", "$SHIP~SHIP_MAX_ATTACK"));
        int attackCount = shipMaxAttack > 0
            ? Math.Min(_state.Fighters, shipMaxAttack)
            : 0;
        if (attackCount > 0)
            macro += $"za{attackCount}* * ";

        int surroundFigs = ParseGameVarInt(ReadCurrentMombotVar("0", "$PLAYER~SURROUNDFIGS"));
        if (surroundFigs > 0)
            macro += $"f  z  {surroundFigs}* z  c  d  *  ";

        int surroundLimp = ParseGameVarInt(ReadCurrentMombotVar("0", "$PLAYER~SURROUNDLIMP"));
        if (surroundLimp > 0)
            macro += $"  H  2  Z  {surroundLimp}*  Z C  *  ";

        int surroundMine = ParseGameVarInt(ReadCurrentMombotVar("0", "$PLAYER~SURROUNDMINE"));
        if (surroundMine > 0)
            macro += $"  H  1  Z  {surroundMine}*  Z C  *  ";

        return macro;
    }

    private void RememberMombotHistory(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return;

        string trimmed = input.Trim();
        if (_mombotCommandHistory.Count > 0 &&
            string.Equals(_mombotCommandHistory[^1], trimmed, StringComparison.Ordinal))
        {
            return;
        }

        _mombotCommandHistory.Add(trimmed);
        if (_mombotCommandHistory.Count > MombotCommandHistoryLimit)
            _mombotCommandHistory.RemoveAt(0);
    }

    private void ApplyMombotExecutionRefresh()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(ApplyMombotExecutionRefresh, DispatcherPriority.Normal);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        RefreshMombotUi();
        UpdateTemporaryMacroControls();
        RefreshStatusBar();
        RebuildProxyMenu();
        _buffer.Dirty = true;
        FocusActiveTerminal();
    }

    private void ExecuteMombotLocalInput(string input)
    {
        RecordMombotCommandHistory(input);
        EnsureEmbeddedMombotClientAudible();

        try
        {
            _mombot.TryExecuteLocalInput(input, out _);
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.Mombot] Local command failed for '{input}': {ex}\n");
            Core.GlobalModules.FlushDebugLog();
            PublishMombotLocalMessage($"mombot: command failed: {ex.Message}");
        }

        ApplyMombotExecutionRefresh();
    }

    private void RecordMombotCommandHistory(string input)
    {
        string trimmed = (input ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            return;

        RememberMombotHistory(trimmed);
        string existing = ReadCurrentMombotVar(
            string.Empty,
            "$BOT~HISTORYSTRING",
            "$HISTORYSTRING");

        string updated = trimmed + "<<|HS|>>" + existing;
        PersistMombotVars(
            updated,
            "$BOT~HISTORYSTRING",
            "$HISTORYSTRING");
    }

    private void EnsureMombotCommandHistoryLoaded()
    {
        string history = ReadCurrentMombotVar(
            string.Empty,
            "$BOT~HISTORYSTRING",
            "$HISTORYSTRING");

        if (string.IsNullOrWhiteSpace(history))
            return;

        string[] entries = history.Split("<<|HS|>>", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (entries.Length == 0)
            return;

        _mombotCommandHistory.Clear();

        // Mombot stores history newest-first; native prompt recall keeps oldest-to-newest.
        for (int i = entries.Length - 1; i >= 0; i--)
            RememberMombotHistory(entries[i]);
    }

    private async Task SendMombotServerMacroAsync(string macro)
    {
        if (_gameInstance == null || !_gameInstance.IsConnected)
        {
            PublishMombotLocalMessage("This Mombot action requires an active game connection.");
            return;
        }

        if (string.IsNullOrWhiteSpace(macro))
            return;

        await _gameInstance.SendToServerAsync(System.Text.Encoding.ASCII.GetBytes(TranslateMombotBurstText(macro)));
        FocusActiveTerminal();
    }

    private static string TranslateMombotBurstText(string text)
        => text.Replace("*", "\r", StringComparison.Ordinal);

    private async Task ExecuteMombotUiCommandAsync(string input)
    {
        await Task.Yield();

        if (_gameInstance == null)
        {
            PublishMombotLocalMessage("Mombot controls are only available while the embedded proxy is running.");
            return;
        }

        if (!_mombot.Enabled && !string.Equals(input, "bot", StringComparison.OrdinalIgnoreCase))
        {
            PublishMombotLocalMessage("Enable Mombot first.");
            return;
        }

        if (string.Equals(input.Trim(), "refresh", StringComparison.OrdinalIgnoreCase))
            _mombotStartupDataGatherPending = false;

        ExecuteMombotLocalInput(input);
    }

    private Task ShowMombotCommandPromptAsync(string initialValue = "")
    {
        BeginMombotPrompt(initialValue);
        return Task.CompletedTask;
    }
}
