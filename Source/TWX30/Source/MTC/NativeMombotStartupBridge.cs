using System;
using System.Collections.Generic;
using System.Threading;
using TWXProxy.Core;

namespace MTC;

internal static class NativeMombotStartupBridge
{
    // 0 = idle, 1 = running, 2 = running with another pass requested.
    public static bool RequestStartupWatch(ref int state)
    {
        while (true)
        {
            int current = Volatile.Read(ref state);
            if (current == 2)
                return false;
            if (current == 1)
            {
                if (Interlocked.CompareExchange(ref state, 2, 1) == 1)
                    return false;
                continue;
            }
            if (Interlocked.CompareExchange(ref state, 1, 0) == 0)
                return true;
        }
    }

    public static bool FinishStartupWatchPass(ref int state)
    {
        if (Interlocked.CompareExchange(ref state, 0, 1) == 1)
            return false;
        return Interlocked.CompareExchange(ref state, 1, 2) == 2;
    }

    public static bool ShouldQueueUserCommand(
        string? input,
        bool startupDataGatherRunning,
        bool refreshScriptLoaded)
    {
        if (!startupDataGatherRunning && !refreshScriptLoaded)
            return false;

        string command = GetCommandName(input);
        return command.Length > 0 && !IsImmediateManagementCommand(command);
    }

    public static bool ShouldClearQueuedUserCommands(string? input)
    {
        string command = GetCommandName(input);
        return string.Equals(command, "stop", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(command, "stopall", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(command, "stopmodules", StringComparison.OrdinalIgnoreCase);
    }

    public static bool CanTakeExclusiveServerControl(IReadOnlyList<RunningScriptInfo> runningScripts)
    {
        foreach (RunningScriptInfo script in runningScripts)
        {
            if (script.IsSystemScript || IsStartupControlScript(script.Reference) || IsStartupControlScript(script.Name))
                continue;

            return false;
        }

        return true;
    }

    public static bool ShouldAbortStartupRefreshOnDisconnect(
        bool startupDataGatherRunning,
        bool refreshScriptLoaded)
        => startupDataGatherRunning && refreshScriptLoaded;

    public static string ToScriptBoolean(bool value)
        => value ? "1" : "0";

    public static string ResolveStartupMove(
        string? botMowToDock,
        string? botMowToDockLower,
        string? startMowOption,
        string? botMowToDockBackdoor,
        string? botMowToDockBackdoorUpper)
    {
        string normalizedStartMowOption = NormalizeMombotValue(startMowOption);
        bool backdoor = string.Equals(normalizedStartMowOption, "backdoor", StringComparison.OrdinalIgnoreCase) ||
                        IsTruthy(botMowToDockBackdoor) ||
                        IsTruthy(botMowToDockBackdoorUpper);
        bool mowToDock = backdoor ||
                         IsTruthy(botMowToDock) ||
                         IsTruthy(botMowToDockLower);

        if (!mowToDock)
            return "none";

        return backdoor ? "backdoor" : "dock";
    }

    public static string ResolveDockMowDestination(bool mowToDock, string? stardock, string? savedDestination)
    {
        if (!mowToDock)
            return string.Empty;

        string normalizedStardock = NormalizeDefinedSector(stardock);
        if (!string.IsNullOrEmpty(normalizedStardock))
            return normalizedStardock;

        string normalizedSavedDestination = NormalizeDefinedSector(savedDestination);
        return normalizedSavedDestination == "1" ? string.Empty : normalizedSavedDestination;
    }

    public static void ApplyRelogCommandContext(IDictionary<string, string> vars)
    {
        ArgumentNullException.ThrowIfNull(vars);

        SetVars(vars, "relog", "$BOT~COMMAND", "$bot~command", "$command");
        SetVars(vars, "relog", "$SWITCHBOARD~COMMAND", "$switchboard~command");
        SetVars(vars, string.Empty, "$BOT~COMMAND_TYPED", "$bot~command_typed", "$command_typed");
        SetVars(vars, string.Empty, "$BOT~USER_COMMAND_LINE", "$bot~user_command_line", "$USER_COMMAND_LINE", "$user_command_line");
        SetVars(vars, string.Empty, "$SWITCHBOARD~USER_COMMAND_LINE", "$switchboard~user_command_line");
        SetVars(vars, "1", "$BOT~COMMAND_LINES", "$bot~command_lines");
        SetVars(vars, "relog", "$BOT~COMMAND_LINES[1]", "$bot~command_lines[1]");
        SetVars(vars, "1", "$BOT~SELF_COMMAND", "$SWITCHBOARD~SELF_COMMAND", "$switchboard~self_command", "$bot~self_command", "$self_command");
        SetVars(vars, "0", "$BOT~ONLY_HELP", "$bot~only_help", "$only_help", "$SWITCHBOARD~ONLY_HELP", "$switchboard~only_help");
        SetVars(vars, "self", "$BOT~COMMAND_CALLER", "$bot~command_caller", "$command_caller");
        SetVars(vars, "0", "$BOT~PARMS");

        for (int index = 1; index <= 8; index++)
            SetVars(vars, string.Empty, $"$BOT~PARM{index}", $"$bot~parm{index}", $"$parm{index}");
    }

    private static void SetVars(IDictionary<string, string> vars, string value, params string[] names)
    {
        foreach (string name in names)
            vars[name] = value;
    }

    private static bool IsStartupControlScript(string? scriptReference)
    {
        string normalized = (scriptReference ?? string.Empty).Replace('\\', '/').TrimEnd('/');
        int separator = normalized.LastIndexOf('/');
        string leaf = separator >= 0 ? normalized[(separator + 1)..] : normalized;

        return string.Equals(leaf, "refresh.cts", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(leaf, "relog.cts", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(leaf, "mombot.cts", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsImmediateManagementCommand(string command)
        => string.Equals(command, "bot", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(command, "listall", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(command, "stop", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(command, "stopall", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(command, "stopmodules", StringComparison.OrdinalIgnoreCase);

    private static string GetCommandName(string? input)
    {
        string normalized = (input ?? string.Empty).Trim();
        int separator = normalized.IndexOfAny([' ', '\t', '\r', '\n']);
        return separator >= 0 ? normalized[..separator] : normalized;
    }

    private static bool IsTruthy(string? value)
    {
        string normalized = NormalizeMombotValue(value);
        return string.Equals(normalized, "1", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(normalized, "true", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(normalized, "yes", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeMombotValue(string? value)
        => (value ?? string.Empty).Trim();

    private static string NormalizeDefinedSector(string? value)
    {
        string normalized = NormalizeMombotValue(value);
        if (!int.TryParse(normalized, out int sector) || sector <= 0 || sector == ushort.MaxValue)
            return string.Empty;

        return sector.ToString();
    }
}
