using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private string _lastGameAgentShipStatusSignature = string.Empty;
    private DateTime _lastGameAgentShipStatusUtc = DateTime.MinValue;
    private string _lastGameAgentServerEventSignature = string.Empty;
    private DateTime _lastGameAgentServerEventUtc = DateTime.MinValue;

    private void OpenGameAgentWindow()
    {
        try
        {
            var owner = ActiveMtcTab;
            if (owner?.GameAgentWindow is { IsVisible: true } existing)
            {
                owner.GameAgent.Activate(GetGameAgentGameName());
                existing.Activate();
                existing.Focus();
                return;
            }

            _gameAgent.SetGameName(GetGameAgentGameName());
            var window = new GameAgentWindow(
                () => ExecuteInOptionalMtcTabSession(owner, BuildGameAgentContextSnapshot),
                (command, requireApproval) => ExecuteInOptionalMtcTabSessionAsync(owner, () => SendMtcRpcCommandAsync(command, requireApproval)),
                command => ExecuteInOptionalMtcTabSessionAsync(owner, () => ExecuteGameAgentMombotCommandAsync(command)),
                _appPrefs);
            window.Closed += (_, _) =>
            {
                if (owner != null && ReferenceEquals(owner.GameAgentWindow, window))
                {
                    owner.GameAgentWindow = null;
                    owner.GameAgent.Deactivate();
                }
            };
            if (owner != null)
            {
                owner.GameAgentWindow = window;
                owner.GameAgent.Activate(GetGameAgentGameName());
            }
            ShowMtcTabOwnedWindow(owner, window, activate: false);
        }
        catch (Exception ex)
        {
            var owner = ActiveMtcTab;
            if (owner != null)
            {
                owner.GameAgentWindow = null;
                owner.GameAgent.Deactivate();
            }
            _ = ShowMessageAsync("Game Agent", $"Could not open Game Agent:\n{ex.Message}");
        }
    }

    private async Task OpenGameAgentReplayWindowAsync()
    {
        var owner = ActiveMtcTab;
        string? path = await PickProxyOpenPathAsync(
            "Open Game Agent Event Log",
            "Game Agent Events",
            "*.jsonl");
        RebindMtcTabSessionAfterAwait(owner);
        if (string.IsNullOrWhiteSpace(path))
            return;

        owner?.GameAgentReplayWindow?.Close();
        var window = new GameAgentReplayWindow(path);
        window.Closed += (_, _) =>
        {
            if (owner != null && ReferenceEquals(owner.GameAgentReplayWindow, window))
                owner.GameAgentReplayWindow = null;
        };
        if (owner != null)
            owner.GameAgentReplayWindow = window;
        ShowMtcTabOwnedWindow(owner, window, activate: false);
    }

    private Task<MtcRpcActionResult> ExecuteGameAgentMombotCommandAsync(string command)
        => InvokeMtcRpcUiAsync(() =>
        {
            string input = (command ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(input))
                return Task.FromResult(MtcRpcActionResult.Fail("Mombot command is required."));

            MTC.mombot.mombotStatusSnapshot snapshot = _mombot.GetStatusSnapshot();
            if (!snapshot.Enabled)
                return Task.FromResult(MtcRpcActionResult.Fail("Native MTC Mombot is not enabled; mombot commands are unavailable."));
            if (!snapshot.AcceptSelfCommands)
                return Task.FromResult(MtcRpcActionResult.Fail("Native MTC Mombot is not accepting local/self commands."));

            try
            {
                ExecuteMombotLocalInput(input);
                return Task.FromResult(MtcRpcActionResult.Ok("Mombot command submitted through the native MTC mombot dispatcher.", new Dictionary<string, string>
                {
                    ["command"] = input,
                }));
            }
            catch (Exception ex)
            {
                return Task.FromResult(MtcRpcActionResult.Fail(ex.Message));
            }
        });

    private async Task ConfigureGameAgentAsync()
    {
        var window = new GameAgentConfigWindow(_appPrefs);
        bool saved = await window.ShowDialog<bool>(this);
        if (saved)
        {
            foreach (var tab in _mtcTabs)
            {
                tab.GameAgentWindow?.Close();
                tab.GameAgentWindow = null;
                tab.GameAgent.Deactivate();
            }
        }
    }

    private GameAgentContextSnapshot BuildGameAgentContextSnapshot()
    {
        _gameAgent.SetGameName(GetGameAgentGameName());
        GameAgentBotSnapshot bot = BuildGameAgentBotSnapshot();
        string[] onlinePlayers = BuildGameAgentOnlinePlayersSnapshot();
        IReadOnlyList<Core.RunningScriptInfo> runningScripts = BuildGameAgentRunningScriptsSnapshot();

        return _gameAgent.BuildContextSnapshot(
            _state,
            _sessionDb,
            bot,
            onlinePlayers,
            runningScripts);
    }

    private GameAgentBotSnapshot BuildGameAgentBotSnapshot()
    {
        try
        {
            MTC.mombot.mombotStatusSnapshot snapshot = _mombot.GetStatusSnapshot();
            return new GameAgentBotSnapshot
            {
                NativeMombotRunning = _mombot.Enabled,
                ExternalBotName = _gameInstance?.ActiveBotName ?? string.Empty,
                BotName = snapshot.BotName,
                TeamName = snapshot.TeamName,
                Mode = snapshot.Mode,
                LastLoadedModule = snapshot.LastLoadedModule,
                WatcherAttached = snapshot.WatcherAttached,
                AcceptsSelfCommands = snapshot.AcceptSelfCommands,
                AcceptsSubspaceCommands = snapshot.AcceptSubspaceCommands,
                AcceptsPrivateCommands = snapshot.AcceptPrivateCommands,
            };
        }
        catch
        {
            return new GameAgentBotSnapshot
            {
                NativeMombotRunning = false,
                ExternalBotName = _gameInstance?.ActiveBotName ?? string.Empty,
            };
        }
    }

    private string[] BuildGameAgentOnlinePlayersSnapshot()
    {
        try
        {
            return _onlinePlayers.ToArray();
        }
        catch
        {
            return [];
        }
    }

    private IReadOnlyList<Core.RunningScriptInfo> BuildGameAgentRunningScriptsSnapshot()
    {
        try
        {
            return Core.ProxyGameOperations.GetRunningScripts(CurrentInterpreter);
        }
        catch
        {
            return [];
        }
    }

    private void ObserveGameAgentServerLine(string plainText, string ansiText, bool isPrompt)
    {
        if (!IsGameAgentServerObservationEnabled())
            return;

        string normalized = NormalizeGameAgentText(plainText);
        if (string.IsNullOrWhiteSpace(normalized))
            return;

        string signature = string.Concat(isPrompt ? "prompt|" : "line|", _state.Sector, "|", normalized);
        DateTime now = DateTime.UtcNow;
        if (string.Equals(signature, _lastGameAgentServerEventSignature, StringComparison.Ordinal) &&
            (now - _lastGameAgentServerEventUtc).TotalMilliseconds < 1000)
        {
            return;
        }

        _lastGameAgentServerEventSignature = signature;
        _lastGameAgentServerEventUtc = now;

        _gameAgent.SetGameName(GetGameAgentGameName());
        _gameAgent.Record(new GameAgentEvent
        {
            GameName = GetGameAgentGameName(),
            Kind = isPrompt ? GameAgentEventKind.ServerPrompt : GameAgentEventKind.ServerLine,
            PlainText = normalized,
            AnsiText = ansiText ?? string.Empty,
            CurrentSector = _state.Sector,
            PromptSurface = isPrompt ? ResolveGameAgentPromptSurface(normalized) : string.Empty,
        });
    }

    private bool IsGameAgentServerObservationEnabled()
        => IsGameAgentActiveForCurrentTab();

    private bool IsGameAgentActiveForCurrentTab()
    {
        var owner = ResolveCurrentMtcTabContext();
        return IsGameAgentWindowActive(owner) && owner!.GameAgent.IsActive;
    }

    private static bool IsGameAgentWindowActive(MtcTabPrototype? owner)
        => owner?.GameAgentWindow is { IsVisible: true };

    private void ObserveGameAgentClientInput(byte[] bytes)
    {
        if (!IsGameAgentActiveForCurrentTab())
            return;

        if (bytes.Length == 0)
            return;

        bool redact = !_state.Connected && LooksLikeSensitiveLoginInput(bytes);
        string text = redact
            ? "[redacted while disconnected]"
            : FormatGameAgentInput(bytes);

        if (string.IsNullOrWhiteSpace(text))
            return;

        _gameAgent.SetGameName(GetGameAgentGameName());
        _gameAgent.Record(new GameAgentEvent
        {
            GameName = GetGameAgentGameName(),
            Kind = GameAgentEventKind.ClientInput,
            PlainText = text,
            CurrentSector = _state.Sector,
            Metadata = new Dictionary<string, string>
            {
                ["bytes"] = bytes.Length.ToString(),
                ["redacted"] = redact ? "true" : "false",
            },
        });
    }

    private void ObserveGameAgentConnectionChanged(bool connected)
    {
        if (!IsGameAgentActiveForCurrentTab())
            return;

        _gameAgent.SetGameName(GetGameAgentGameName());
        _gameAgent.Record(new GameAgentEvent
        {
            GameName = GetGameAgentGameName(),
            Kind = connected ? GameAgentEventKind.Connected : GameAgentEventKind.Disconnected,
            PlainText = connected ? "Connected" : "Disconnected",
            CurrentSector = _state.Sector,
            Metadata = new Dictionary<string, string>
            {
                ["host"] = _state.Host,
                ["port"] = _state.Port.ToString(),
                ["embeddedProxy"] = _state.EmbeddedProxy ? "true" : "false",
            },
        });
    }

    private void ObserveGameAgentCurrentSectorChanged(int sector)
    {
        if (!IsGameAgentActiveForCurrentTab())
            return;

        _gameAgent.SetGameName(GetGameAgentGameName());
        _gameAgent.Record(new GameAgentEvent
        {
            GameName = GetGameAgentGameName(),
            Kind = GameAgentEventKind.CurrentSectorChanged,
            PlainText = $"Current sector changed to {sector}",
            CurrentSector = sector,
        });
    }

    private void ObserveGameAgentShipStatus(Core.ShipStatus status)
    {
        if (!IsGameAgentActiveForCurrentTab())
            return;

        string signature = string.Join('|',
            status.CurrentSector,
            status.Credits,
            status.Fighters,
            status.Shields,
            status.HoldsEmpty,
            status.TotalHolds,
            status.ShipName,
            status.ShipType);

        DateTime now = DateTime.UtcNow;
        if (string.Equals(signature, _lastGameAgentShipStatusSignature, StringComparison.Ordinal))
            return;

        if (_lastGameAgentShipStatusUtc != DateTime.MinValue &&
            (now - _lastGameAgentShipStatusUtc).TotalMilliseconds < 500)
        {
            return;
        }

        _lastGameAgentShipStatusSignature = signature;
        _lastGameAgentShipStatusUtc = now;

        _gameAgent.SetGameName(GetGameAgentGameName());
        _gameAgent.Record(new GameAgentEvent
        {
            GameName = GetGameAgentGameName(),
            Kind = GameAgentEventKind.ShipStatus,
            PlainText = $"Ship status updated: sector {status.CurrentSector}, credits {status.Credits:N0}, fighters {status.Fighters:N0}, shields {status.Shields:N0}",
            CurrentSector = status.CurrentSector > 0 ? status.CurrentSector : _state.Sector,
            Metadata = new Dictionary<string, string>
            {
                ["turns"] = status.Turns.ToString(),
                ["credits"] = status.Credits.ToString(),
                ["fighters"] = status.Fighters.ToString(),
                ["shields"] = status.Shields.ToString(),
                ["holdsEmpty"] = status.HoldsEmpty.ToString(),
                ["holdsTotal"] = status.TotalHolds.ToString(),
                ["shipName"] = status.ShipName ?? string.Empty,
                ["shipType"] = status.ShipType ?? string.Empty,
            },
        });
    }

    private string GetGameAgentGameName()
    {
        string name = _embeddedGameName ?? _state.GameName;
        if (string.IsNullOrWhiteSpace(name))
            name = DeriveGameName();

        return Core.SharedPaths.SanitizeFileComponent(name);
    }

    private static bool LooksLikeAgentPrompt(string line)
    {
        string normalized = NormalizeGameAgentText(line);
        if (string.IsNullOrWhiteSpace(normalized))
            return false;

        return normalized.Contains("(?=Help)?", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Citadel command", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Computer command", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Corporate command", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Planet command", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Port command", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("Sub-space radio", StringComparison.OrdinalIgnoreCase) ||
               normalized.EndsWith("Your choice?", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveGameAgentPromptSurface(string line)
    {
        string normalized = NormalizeGameAgentText(line);
        if (normalized.StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase))
            return "Command";

        int commandIndex = normalized.IndexOf(" command", StringComparison.OrdinalIgnoreCase);
        if (commandIndex > 0)
            return normalized[..commandIndex].Trim();

        if (normalized.StartsWith("Sub-space radio", StringComparison.OrdinalIgnoreCase))
            return "Sub-space radio";

        return normalized.Length <= 80 ? normalized : normalized[..80];
    }

    private static string NormalizeGameAgentText(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        return Core.AnsiCodes.NormalizeTerminalText(text)
            .Replace("\r", string.Empty, StringComparison.Ordinal)
            .TrimEnd('\n');
    }

    private static bool LooksLikeSensitiveLoginInput(byte[] bytes)
    {
        if (bytes.Length > 64)
            return true;

        string text = Encoding.Latin1.GetString(bytes).Trim();
        if (text.Length == 0)
            return false;

        return !text.Contains(' ', StringComparison.Ordinal) &&
               text.Any(char.IsLetterOrDigit) &&
               text.Length >= 3;
    }

    private static string FormatGameAgentInput(byte[] bytes)
    {
        string text = NormalizeGameAgentText(Encoding.Latin1.GetString(bytes));
        if (!string.IsNullOrWhiteSpace(text))
            return text;

        if (bytes.Any(value => value == (byte)'\r' || value == (byte)'\n'))
            return "<ENTER>";

        if (bytes.Length == 1 && bytes[0] == 0x1B)
            return "<ESC>";

        return Convert.ToHexString(bytes);
    }
}
