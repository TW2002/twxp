using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;

namespace MTC.mombot;

internal sealed record mombotInternalCommandGroup(
    string Type,
    IReadOnlyList<string> Commands);

internal sealed record mombotHotkeyBinding(
    string KeyDisplay,
    string ActionRef);

internal sealed record mombotMenuSurface(
    string Name,
    string SourceLabel,
    string Purpose);

internal enum mombotCommandKind
{
    Internal,
    Module
}

internal sealed record mombotCommandSpec(
    string Name,
    mombotCommandKind Kind,
    string Source,
    string Description,
    IReadOnlyList<string>? Aliases = null,
    bool ServerInteractive = false);

internal static class mombotCatalog
{
    private static readonly ReadOnlyCollection<string> _categories = Array.AsReadOnly(new[]
    {
        "Modes",
        "Commands",
        "Daemons",
    });

    private static readonly ReadOnlyCollection<string> _types = Array.AsReadOnly(new[]
    {
        "General",
        "Defense",
        "Offense",
        "Resource",
        "Grid",
        "Cashing",
        "Data",
    });

    private static readonly ReadOnlyCollection<mombotInternalCommandGroup> _internalCommandGroups =
        Array.AsReadOnly(new[]
        {
            new mombotInternalCommandGroup("General", Array.AsReadOnly(new[]
            {
                "stopall", "stop", "listall", "reset", "emq", "bot", "relog", "tow",
                "refresh", "login", "logoff", "unlock", "lift", "with", "dep",
                "callin", "about", "cn", "extern", "twarp", "bwarp", "pwarp",
                "relog", "help", "switchbot", "stopmodules",
            })),
            new mombotInternalCommandGroup("Defense", Array.AsReadOnly(Array.Empty<string>())),
            new mombotInternalCommandGroup("Offense", Array.AsReadOnly(new[]
            {
                "hkill", "kill", "htorp",
            })),
            new mombotInternalCommandGroup("Resource", Array.AsReadOnly(new[]
            {
                "refurb", "scrub",
            })),
            new mombotInternalCommandGroup("Grid", Array.AsReadOnly(new[]
            {
                "surround", "exit", "xenter", "mow",
            })),
            new mombotInternalCommandGroup("Cashing", Array.AsReadOnly(Array.Empty<string>())),
            new mombotInternalCommandGroup("Data", Array.AsReadOnly(new[]
            {
                "find", "pscan", "sector", "storeship", "setvar", "getvar",
            })),
        });

    private static readonly ReadOnlyCollection<string> _doubledCommands = Array.AsReadOnly(new[]
    {
        "parm",
        "params",
        "parms",
        "qss",
        "sec",
        "sect",
        "secto",
        "cn9",
        "logout",
        "emx",
        "smow",
        "port",
        "shipstore",
        "finder",
        "xenter",
        "status",
        "pinfo",
        "holotorp",
    });

    private static readonly ReadOnlyCollection<mombotHotkeyBinding> _defaultHotkeys =
        Array.AsReadOnly(new[]
        {
            new mombotHotkeyBinding("K", ":INTERNAL_COMMANDS~autokill"),
            new mombotHotkeyBinding("C", ":INTERNAL_COMMANDS~autocap"),
            new mombotHotkeyBinding("R", ":INTERNAL_COMMANDS~autorefurb"),
            new mombotHotkeyBinding("S", ":INTERNAL_COMMANDS~surround"),
            new mombotHotkeyBinding("H", ":INTERNAL_COMMANDS~htorp"),
            new mombotHotkeyBinding("T", ":INTERNAL_COMMANDS~twarpswitch"),
            new mombotHotkeyBinding("P", ":INTERNAL_COMMANDS~kit"),
            new mombotHotkeyBinding("Q", ":USER_INTERFACE~script_access"),
            new mombotHotkeyBinding("L", ":INTERNAL_COMMANDS~hkill"),
            new mombotHotkeyBinding("Tab", ":INTERNAL_COMMANDS~stopModules"),
            new mombotHotkeyBinding("D", ":INTERNAL_COMMANDS~kit"),
            new mombotHotkeyBinding("X", ":INTERNAL_COMMANDS~xenter"),
            new mombotHotkeyBinding("M", ":INTERNAL_COMMANDS~mowswitch"),
            new mombotHotkeyBinding("F", ":INTERNAL_COMMANDS~fotonswitch"),
            new mombotHotkeyBinding("Z", ":INTERNAL_COMMANDS~clear"),
            new mombotHotkeyBinding("~", ":MENUS~preferencesMenu"),
            new mombotHotkeyBinding("B", ":INTERNAL_COMMANDS~dock_shopper"),
        });

    private static readonly ReadOnlyCollection<mombotMenuSurface> _menuSurfaces =
        Array.AsReadOnly(new[]
        {
            new mombotMenuSurface("Wait For Command", ":BOT~WAIT_FOR_COMMAND", "Idle loop, routing triggers, and bot supervision hub."),
            new mombotMenuSurface("Preferences", ":MENUS~PREFERENCESMENU", "Primary multi-page configuration menu with hotkeys and location variables."),
            new mombotMenuSurface("Grid Prompt", ":USER_INTERFACE~GRIDPROMPT", "Single-key adjacent grid menu used for holo, density, and surround actions."),
            new mombotMenuSurface("Script Access", ":USER_INTERFACE~script_access", "Hotkey-driven script launcher sourced from hotkey script config."),
            new mombotMenuSurface("Fast Stop", "TWX_STOPALLFAST", "Confirmation menu used by internal stop-all helpers."),
        });

    private static readonly ReadOnlyCollection<mombotCommandSpec> _initialCommands =
        Array.AsReadOnly(new[]
        {
            new mombotCommandSpec("stopall", mombotCommandKind.Internal, ":INTERNAL_COMMANDS~stopall", "Stop all bot-controlled scripts."),
            new mombotCommandSpec("stop", mombotCommandKind.Internal, ":INTERNAL_COMMANDS~stop", "Stop the current bot module."),
            new mombotCommandSpec("listall", mombotCommandKind.Internal, ":INTERNAL_COMMANDS~listall", "List active bot and module scripts."),
            new mombotCommandSpec("relog", mombotCommandKind.Module, "commands/general/relog.cts", "Perform relog/recovery flow via script.", ServerInteractive: true),
            new mombotCommandSpec("refresh", mombotCommandKind.Module, "commands/general/refresh.cts", "Refresh cached bot state from the live game."),
            new mombotCommandSpec("reset", mombotCommandKind.Module, "commands/general/reset.cts", "Reset bot context via script."),
            new mombotCommandSpec("bot", mombotCommandKind.Internal, ":INTERNAL_COMMANDS~bot", "Bot shell/control command."),
            new mombotCommandSpec("login", mombotCommandKind.Module, "commands/general/login.cts", "Login helper command should stay script-backed.", ServerInteractive: true),
            new mombotCommandSpec("logoff", mombotCommandKind.Module, "commands/general/logoff.cts", "Log off the current session via script.", ServerInteractive: true),
            new mombotCommandSpec("cn9", mombotCommandKind.Module, "commands/general/cn9.cts", "CN helper command should stay script-backed.", new[] { "cn" }, ServerInteractive: true),
            new mombotCommandSpec("help", mombotCommandKind.Module, "commands/general/help.cts", "Display command help."),

            new mombotCommandSpec("find", mombotCommandKind.Module, "commands/data/find.cts", "Find sectors/targets using bot search helpers.", new[] { "finder" }),
            new mombotCommandSpec("pscan", mombotCommandKind.Module, "commands/data/pscan.cts", "Planet or player scan helper.", new[] { "pinfo" }),
            new mombotCommandSpec("sector", mombotCommandKind.Module, "commands/data/sector.cts", "Sector information helper.", new[] { "sec", "sect", "secto" }),
            new mombotCommandSpec("param", mombotCommandKind.Module, "commands/data/param.cts", "Parameter helper command.", new[] { "parm", "params", "parms" }),
            new mombotCommandSpec("setvar", mombotCommandKind.Module, "commands/data/setvar.cts", "Set a shared bot variable."),
            new mombotCommandSpec("getvar", mombotCommandKind.Module, "commands/data/getvar.cts", "Read a shared bot variable."),

            new mombotCommandSpec("status", mombotCommandKind.Module, "commands/data/status.cts", "Show bot or game status.", new[] { "qss" }),
            new mombotCommandSpec("port", mombotCommandKind.Module, "commands/general/port.cts", "Port helper/build/upgrade command.", ServerInteractive: true),
            new mombotCommandSpec("lsd", mombotCommandKind.Module, "modes/resource/lsd.cts", "Run LoneStar Dock Shopper order.", ServerInteractive: true),
            new mombotCommandSpec("storeship", mombotCommandKind.Module, "commands/data/storeship.cts", "Ship store helper.", new[] { "shipstore" }, ServerInteractive: true),
            new mombotCommandSpec("xenter", mombotCommandKind.Module, "commands/grid/xenter.cts", "Cross-enter helper command should stay script-backed.", ServerInteractive: true),
            new mombotCommandSpec("htorp", mombotCommandKind.Module, "commands/offense/htorp.cts", "Holotorp command surface.", new[] { "holotorp" }, ServerInteractive: true),
        });

    public static IReadOnlyList<string> Categories => _categories;
    public static IReadOnlyList<string> Types => _types;
    public static IReadOnlyList<mombotInternalCommandGroup> InternalCommandGroups => _internalCommandGroups;
    public static IReadOnlyList<string> DoubledCommands => _doubledCommands;
    public static IReadOnlyList<mombotHotkeyBinding> DefaultHotkeys => _defaultHotkeys;
    public static IReadOnlyList<mombotMenuSurface> MenuSurfaces => _menuSurfaces;
    public static IReadOnlyList<mombotCommandSpec> InitialCommands => _initialCommands;

    public static IReadOnlyList<string> AllInternalCommands =>
        _internalCommandGroups
            .SelectMany(group => group.Commands)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(command => command, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    public static string NormalizeCommandName(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        string normalized = input.Trim();
        int splitIndex = normalized.IndexOf(' ');
        if (splitIndex >= 0)
            normalized = normalized[..splitIndex];

        if (normalized.EndsWith(".cts", StringComparison.OrdinalIgnoreCase))
            normalized = normalized[..^4];
        else if (normalized.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
            normalized = normalized[..^3];

        return normalized.ToLowerInvariant();
    }

    public static bool TryGetCommandSpec(string canonical, out mombotCommandSpec? command)
    {
        command = _initialCommands.FirstOrDefault(item =>
            string.Equals(item.Name, canonical, StringComparison.OrdinalIgnoreCase));
        return command != null;
    }

    public static bool IsInternalCommand(string input)
    {
        string canonical = NormalizeCommandName(input);
        return !string.IsNullOrWhiteSpace(canonical) &&
               AllInternalCommands.Contains(canonical, StringComparer.OrdinalIgnoreCase);
    }

    public static bool TryResolveInitialCommand(string input, out mombotCommandSpec? command, out string canonical)
    {
        canonical = NormalizeCommandName(input);
        return TryGetCommandSpec(canonical, out command);
    }
}
