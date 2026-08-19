using System;
using System.Collections.Generic;
using System.IO;
using Core = TWXProxy.Core;

namespace MTC.mombot;

internal sealed record mombotCommandContext(
    string CommandLine,
    string CommandName,
    IReadOnlyList<string> Parameters,
    bool SelfCommand = false,
    string Route = "",
    string UserName = "",
    string TypedCommandName = "",
    string TypedParameterLine = "",
    bool TrustedSelfCommand = false);

internal sealed class mombotCompatContext
{
    private const string DefaultValidPrompts =
        "Command <Underground> Do How Corporate Citadel Planet Computer Terra <StarDock> <FedPolice> <Tavern> <Libram <Galactic <Hardware <Shipyards>";

    private readonly Core.TwxRuntimeContext _runtimeContext;

    public mombotCompatContext(Core.TwxRuntimeContext? runtimeContext = null)
    {
        _runtimeContext = runtimeContext ?? Core.GlobalModules.CurrentContext;
    }

    public IReadOnlyDictionary<string, string> BuildVariableSnapshot(
        Core.ModDatabase? database,
        mombotConfig config,
        mombotSettings settings,
        mombotCommandContext context,
        string? lastLoadedModule = null,
        string? userCommandLineOverride = null)
    {
        string scriptRootRelative = GetScriptRootRelative(config.ScriptRoot);
        string mode = ReadCurrentAny("General", "$BOT~MODE", "$bot~mode", "$mode");
        string homeSector = ReadCurrentAny("0", "$MAP~HOME_SECTOR", "$MAP~home_sector", "$BOT~HOME_SECTOR", "$home_sector");
        string safeShip = ReadCurrentAny("0", "$BOT~SAFE_SHIP", "$bot~safe_ship", "$safe_ship");
        string safePlanet = ReadCurrentAny("0", "$BOT~SAFE_PLANET", "$bot~safe_planet", "$safe_planet");
        string botIsDeaf = ReadCurrentAny("0", "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");
        string silentRunning = ReadCurrentAny("0", "$BOT~SILENT_RUNNING", "$bot~silent_running", "$silent_running");
        string loginUserName = ReadCurrentAny(string.Empty, "$BOT~USERNAME", "$username");
        string serverName = ReadCurrentAny(string.Empty, "$BOT~SERVERNAME", "$servername");
        string gameLetter = ReadCurrentAny(string.Empty, "$BOT~LETTER", "$letter", "$LETTER");
        string botName = ReadCurrentAny(settings.BotName, "$BOT~BOT_NAME", "$SWITCHBOARD~BOT_NAME", "$SWITCHBOARD~bot_name", "$bot~bot_name", "$bot_name");
        string teamName = ReadCurrentAny(settings.TeamName, "$BOT~BOT_TEAM_NAME", "$BOT~bot_team_name", "$bot~bot_team_name", "$bot_team_name");
        string subspace = ReadCurrentAny(settings.SubspaceChannel.ToString(), "$BOT~SUBSPACE", "$bot~subspace", "$subspace");
        string botPassword = ReadCurrentAny(settings.BotPassword, "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password");
        string loginPassword = ReadCurrentAny(settings.LoginPassword, "$BOT~PASSWORD", "$password");
        string lastModule = lastLoadedModule ?? ReadCurrentAny(string.Empty, "$BOT~LAST_LOADED_MODULE", "$LAST_LOADED_MODULE");
        string unlimitedGame = ReadCurrentAny("0", "$PLAYER~UNLIMITEDGAME", "$PLAYER~unlimitedGame", "$unlimitedGame");
        string stardock = ReadCurrentSectorAny(FormatSector(database?.DBHeader.StarDock), "$STARDOCK", "$MAP~STARDOCK", "$MAP~stardock", "$BOT~STARDOCK", "$stardock");
        string rylos = ReadCurrentAny(FormatSector(database?.DBHeader.Rylos), "$MAP~RYLOS", "$MAP~rylos", "$BOT~RYLOS", "$rylos");
        string alphaCentauri = ReadCurrentAny(FormatSector(database?.DBHeader.AlphaCentauri), "$MAP~ALPHA_CENTAURI", "$MAP~alpha_centauri", "$BOT~ALPHA_CENTAURI", "$alpha_centauri");
        string backdoor = ReadCurrentAny("0", "$MAP~BACKDOOR", "$MAP~backdoor", "$backdoor");
        string botTurnLimit = ReadCurrentAny("0", "$BOT~BOT_TURN_LIMIT", "$bot~bot_turn_limit", "$bot_turn_limit");
        string validPrompts = ReadCurrentNonZeroAny(DefaultValidPrompts, "$BOT~VALIDPROMPTS", "$bot~validPrompts");
        string planetFile = ReadCurrentAny(string.Empty, "$PLANET~PLANET_FILE", "$PLANET~planet_file", "$planet~planet_file");
        string shipCapFile = ReadCurrentAny(string.Empty, "$SHIP~CAP_FILE", "$SHIP~cap_file", "$ship~cap_file");
        string planetNumber = ReadCurrentAny("0", "$PLANET~PLANET", "$planet~planet");
        string folder = ReadCurrentAny(string.Empty, "$folder");
        string offenseCapping = ReadCurrentAny("0", "$PLAYER~offenseCapping", "$offenseCapping");
        string defenderCapping = ReadCurrentAny("0", "$PLAYER~defenderCapping");
        string cappingAliens = ReadCurrentAny("0", "$PLAYER~cappingAliens", "$cappingAliens");
        string photonDuration = ReadCurrentAny("0", "$GAME~PHOTON_DURATION", "$GAME~photon_duration");
        string portMax = ReadCurrentAny("0", "$GAME~PORT_MAX", "$GAME~port_max");
        string settingsOverride = CommandHasOverride(context) ? "1" : "0";
        string dropOffensive = ReadCurrentAny("0", "$PLAYER~DROPOFFENSIVE", "$PLAYER~dropOffensive");
        string dropToll = ReadCurrentAny("0", "$PLAYER~DROPTOLL", "$PLAYER~dropToll");
        string currentSector = ReadCurrentAny(FormatSector((ushort)Core.ScriptRef.GetCurrentSector(_runtimeContext)), "$PLAYER~CURRENT_SECTOR", "$player~current_sector");
        string currentPrompt = ReadCurrentAny("Undefined", "$PLAYER~CURRENT_PROMPT");
        string startingLocation = ReadCurrentAny(currentPrompt, "$PLAYER~startingLocation", "$bot~startingLocation");
        string majorVersion = ReadCurrentAny("5", "$BOT~MAJOR_VERSION", "$bot~major_version", "$major_version");
        string minorVersion = ReadCurrentAny("0beta", "$BOT~MINOR_VERSION", "$bot~minor_version", "$minor_version");
        string gconfigFile = ReadCurrentAny(string.Empty, "$gconfig_file");
        string botUsersFile = ReadCurrentAny(string.Empty, "$BOT_USER_FILE");
        string figFile = ReadCurrentAny(string.Empty, "$FIG_FILE");
        string figCountFile = ReadCurrentAny(string.Empty, "$FIG_COUNT_FILE");
        string limpetFile = ReadCurrentAny(string.Empty, "$LIMP_FILE");
        string limpetCountFile = ReadCurrentAny(string.Empty, "$LIMP_COUNT_FILE");
        string armidFile = ReadCurrentAny(string.Empty, "$ARMID_FILE");
        string armidCountFile = ReadCurrentAny(string.Empty, "$ARMID_COUNT_FILE");
        string bustFile = ReadCurrentAny(string.Empty, "$BUST_FILE");
        string scriptFile = ReadCurrentAny(string.Empty, "$SCRIPT_FILE");
        string timerFile = ReadCurrentAny(string.Empty, "$timer_file");
        string mcicFile = ReadCurrentAny(string.Empty, "$MCIC_FILE");
        string gameSettingsFile = ReadCurrentAny(string.Empty, "$GAME~GAME_SETTINGS_FILE");
        string aliasesFile = ReadCurrentAny(string.Empty, "$aliases_file");
        string mombotConfigFile = ReadCurrentAny(string.Empty, "$mombot_config_file", "$hotkeys_file", "$custom_keys_file", "$custom_commands_file");
        string folderConfigFile = ReadCurrentAny(string.Empty, "$mombot_folder_config");
        string defaultBotDirectory = ReadCurrentAny(scriptRootRelative, "$bot~default_bot_directory", "$default_bot_directory");

        if (string.IsNullOrWhiteSpace(teamName))
            teamName = botName;

        if (string.IsNullOrWhiteSpace(botPassword) && !string.IsNullOrWhiteSpace(subspace) && subspace != "0")
            botPassword = subspace;

        planetFile = ResolveBotFilePath(planetFile, folder, "planets.cfg");
        shipCapFile = ResolveBotFilePath(shipCapFile, folder, "ships.cfg");

        var vars = new Dictionary<string, string>(StringComparer.Ordinal)
        {
        };

        SetVars(vars, context.CommandName, "$BOT~COMMAND", "$bot~command", "$command");
        SetVars(vars, context.CommandName, "$SWITCHBOARD~COMMAND", "$switchboard~command");
        SetVars(
            vars,
            string.Equals(context.TypedCommandName, context.CommandName, StringComparison.OrdinalIgnoreCase)
                ? string.Empty
                : context.TypedCommandName,
            "$BOT~COMMAND_TYPED",
            "$bot~command_typed",
            "$command_typed");
        string userCommandLine = userCommandLineOverride ?? context.TypedParameterLine;
        string playerOverride = settingsOverride;
        string onlyHelp = IsOnlyHelpCommand(context) ? "1" : "0";
        SetVars(vars, userCommandLine, "$BOT~USER_COMMAND_LINE", "$bot~user_command_line", "$USER_COMMAND_LINE", "$user_command_line");
        SetVars(vars, userCommandLine, "$SWITCHBOARD~USER_COMMAND_LINE", "$switchboard~user_command_line");
        SetVars(vars, "1", "$BOT~COMMAND_LINES", "$bot~command_lines");
        SetVars(vars, context.CommandLine, "$BOT~COMMAND_LINES[1]", "$bot~command_lines[1]");
        SetVars(vars, botName, "$BOT~BOT_NAME", "$SWITCHBOARD~BOT_NAME", "$SWITCHBOARD~bot_name", "$bot~bot_name", "$bot_name", "$bot~name");
        SetVars(vars, context.SelfCommand ? "1" : "0", "$BOT~SELF_COMMAND", "$SWITCHBOARD~SELF_COMMAND", "$switchboard~self_command", "$bot~self_command", "$self_command");
        SetVars(vars, onlyHelp, "$BOT~ONLY_HELP", "$bot~only_help", "$only_help", "$SWITCHBOARD~ONLY_HELP", "$switchboard~only_help");
        SetVars(vars, teamName, "$BOT~BOT_TEAM_NAME", "$BOT~bot_team_name", "$bot~bot_team_name", "$bot_team_name");
        SetVars(vars, subspace, "$BOT~SUBSPACE", "$bot~subspace", "$subspace");
        SetVars(vars, botPassword, "$BOT~BOT_PASSWORD", "$bot~bot_password", "$bot_password");
        SetVars(vars, loginPassword, "$BOT~PASSWORD", "$password");
        SetVars(vars, string.IsNullOrWhiteSpace(mode) ? "General" : mode, "$BOT~MODE", "$bot~mode", "$mode");
        SetVars(vars, string.IsNullOrWhiteSpace(mode) ? "General" : mode, "$SWITCHBOARD~MODE", "$switchboard~mode");
        SetVars(vars, context.Route, "$USER_INTERFACE~ROUTING");
        SetVars(vars, loginUserName, "$BOT~USERNAME", "$username");
        SetVars(vars, serverName, "$BOT~SERVERNAME", "$servername");
        SetVars(vars, gameLetter, "$BOT~LETTER", "$letter", "$LETTER");
        SetVars(vars, string.IsNullOrWhiteSpace(context.UserName) ? "self" : context.UserName, "$BOT~COMMAND_CALLER", "$bot~command_caller", "$command_caller");
        SetVars(vars, context.Parameters.Count.ToString(), "$BOT~PARMS");
        SetVars(vars, defaultBotDirectory, "$bot~default_bot_directory", "$default_bot_directory");
        SetVars(vars, scriptRootRelative, "$bot~mombot_directory", "$BOT~MOMBOT_DIRECTORY", "$mombot_directory");
        SetVars(vars, lastModule, "$BOT~LAST_LOADED_MODULE", "$LAST_LOADED_MODULE");
        SetVars(vars, stardock, "$STARDOCK", "$MAP~STARDOCK", "$MAP~stardock", "$BOT~STARDOCK", "$stardock");
        SetVars(vars, rylos, "$MAP~RYLOS", "$MAP~rylos", "$BOT~RYLOS", "$rylos");
        SetVars(vars, alphaCentauri, "$MAP~ALPHA_CENTAURI", "$MAP~alpha_centauri", "$BOT~ALPHA_CENTAURI", "$alpha_centauri");
        SetVars(vars, backdoor, "$MAP~BACKDOOR", "$MAP~backdoor", "$backdoor");
        SetVars(vars, homeSector, "$MAP~HOME_SECTOR", "$MAP~home_sector", "$BOT~HOME_SECTOR", "$home_sector");
        SetVars(vars, currentSector, "$PLAYER~CURRENT_SECTOR", "$player~current_sector");
        SetVars(vars, currentPrompt, "$PLAYER~CURRENT_PROMPT");
        SetVars(vars, startingLocation, "$PLAYER~startingLocation", "$bot~startingLocation");
        SetVars(vars, safeShip, "$BOT~SAFE_SHIP", "$bot~safe_ship", "$safe_ship");
        SetVars(vars, safePlanet, "$BOT~SAFE_PLANET", "$bot~safe_planet", "$safe_planet");
        SetVars(vars, botIsDeaf, "$BOT~BOTISDEAF", "$BOT~botIsDeaf", "$bot~botIsDeaf", "$botIsDeaf");
        SetVars(vars, silentRunning, "$BOT~SILENT_RUNNING", "$bot~silent_running", "$silent_running", "$SWITCHBOARD~SILENT_RUNNING", "$switchboard~silent_running");
        SetVars(vars, botTurnLimit, "$BOT~BOT_TURN_LIMIT", "$bot~bot_turn_limit", "$bot_turn_limit");
        SetVars(vars, validPrompts, "$BOT~VALIDPROMPTS", "$bot~validPrompts");
        SetVars(vars, unlimitedGame, "$PLAYER~UNLIMITEDGAME", "$PLAYER~unlimitedGame", "$unlimitedGame");
        SetVars(vars, planetFile, "$PLANET~PLANET_FILE", "$PLANET~planet_file", "$planet~planet_file");
        SetVars(vars, shipCapFile, "$SHIP~CAP_FILE", "$SHIP~cap_file", "$ship~cap_file");
        SetVars(vars, shipCapFile, "$cap_file");
        SetVars(vars, planetFile, "$planet_file");
        SetVars(vars, planetNumber, "$PLANET~PLANET", "$planet~planet");
        SetVars(vars, folder, "$folder");
        SetVars(vars, offenseCapping, "$PLAYER~offenseCapping", "$offenseCapping");
        SetVars(vars, defenderCapping, "$PLAYER~defenderCapping");
        SetVars(vars, cappingAliens, "$PLAYER~cappingAliens", "$cappingAliens");
        SetVars(vars, majorVersion, "$BOT~MAJOR_VERSION", "$bot~major_version", "$major_version");
        SetVars(vars, minorVersion, "$BOT~MINOR_VERSION", "$bot~minor_version", "$minor_version");
        SetVars(vars, gconfigFile, "$gconfig_file");
        SetVars(vars, botUsersFile, "$BOT_USER_FILE");
        SetVars(vars, figFile, "$FIG_FILE");
        SetVars(vars, figCountFile, "$FIG_COUNT_FILE");
        SetVars(vars, limpetFile, "$LIMP_FILE");
        SetVars(vars, limpetCountFile, "$LIMP_COUNT_FILE");
        SetVars(vars, armidFile, "$ARMID_FILE");
        SetVars(vars, armidCountFile, "$ARMID_COUNT_FILE");
        SetVars(vars, bustFile, "$BUST_FILE");
        SetVars(vars, scriptFile, "$SCRIPT_FILE");
        SetVars(vars, timerFile, "$timer_file");
        SetVars(vars, mcicFile, "$MCIC_FILE");
        SetVars(vars, gameSettingsFile, "$GAME~GAME_SETTINGS_FILE");
        SetVars(vars, aliasesFile, "$aliases_file");
        SetVars(vars, mombotConfigFile, "$mombot_config_file");
        SetVars(vars, mombotConfigFile, "$hotkeys_file");
        SetVars(vars, mombotConfigFile, "$custom_keys_file");
        SetVars(vars, mombotConfigFile, "$custom_commands_file");
        SetVars(vars, folderConfigFile, "$mombot_folder_config");
        SetVars(vars, photonDuration, "$GAME~PHOTON_DURATION", "$game~photon_duration");
        SetVars(vars, portMax, "$GAME~PORT_MAX", "$GAME~port_max", "$game~port_max");
        SetVars(vars, settingsOverride, "$SETTINGS~OVERRIDE", "$settings~override");
        SetVars(vars, playerOverride, "$PLAYER~OVERRIDE", "$player~override");
        SetVars(vars, dropOffensive, "$PLAYER~DROPOFFENSIVE", "$PLAYER~dropOffensive");
        SetVars(vars, dropToll, "$PLAYER~DROPTOLL", "$PLAYER~dropToll");

        for (int i = 0; i < 8; i++)
        {
            string rawValue = i < context.Parameters.Count ? context.Parameters[i] : string.Empty;
            SetVars(vars, rawValue, $"$BOT~PARM{i + 1}", $"$bot~parm{i + 1}");
            // Preserve missing params as empty strings. Older scripts often use
            // isNumber / empty checks to detect omitted arguments, and forcing
            // "0" here changes that behavior.
            SetVars(vars, rawValue, $"$parm{i + 1}");
        }

        return vars;
    }

    private static bool IsOnlyHelpCommand(mombotCommandContext context)
    {
        if (context.Parameters.Count == 0)
            return false;

        string first = context.Parameters[0]?.Trim() ?? string.Empty;
        return string.Equals(first, "help", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(first, "?", StringComparison.OrdinalIgnoreCase);
    }

    public void ApplyToSession(
        Core.ModInterpreter? interpreter,
        Core.ModDatabase? database,
        mombotConfig config,
        mombotSettings settings,
        mombotCommandContext context,
        string? lastLoadedModule = null,
        string? userCommandLineOverride = null)
    {
        IReadOnlyDictionary<string, string> vars = BuildVariableSnapshot(
            database,
            config,
            settings,
            context,
            lastLoadedModule,
            userCommandLineOverride);
        ApplyVariableSnapshot(interpreter, vars);
    }

    public void ApplyVariableSnapshot(
        Core.ModInterpreter? interpreter,
        IReadOnlyDictionary<string, string> vars)
    {
        foreach ((string name, string value) in vars)
            Core.ScriptRef.SetCurrentGameVar(_runtimeContext, name, value);

        if (interpreter == null)
            return;

        for (int i = 0; i < interpreter.Count; i++)
        {
            Core.Script? script = interpreter.GetScript(i);
            if (script == null)
                continue;

            foreach ((string name, string value) in vars)
                script.SetScriptVarIgnoreCase(name, value);
        }
    }

    public void ApplyVariableSnapshotToScript(
        Core.Script? script,
        IReadOnlyDictionary<string, string> vars)
    {
        if (script == null)
            return;

        foreach ((string name, string value) in vars)
            script.SetScriptVarIgnoreCase(name, value);
    }

    private static string GetScriptRootRelative(string scriptRoot)
    {
        if (string.IsNullOrWhiteSpace(scriptRoot))
            return "mombot";

        string normalized = scriptRoot
            .Replace('\\', '/')
            .Trim()
            .Trim('/');
        if (normalized.StartsWith("scripts/", StringComparison.OrdinalIgnoreCase))
            normalized = normalized["scripts/".Length..];
        else if (string.Equals(normalized, "scripts", StringComparison.OrdinalIgnoreCase))
            normalized = string.Empty;

        return string.IsNullOrWhiteSpace(normalized) ? "mombot" : normalized;
    }

    private string ReadCurrentAny(string fallback, params string[] names)
    {
        foreach (string name in names)
        {
            string value = Core.ScriptRef.GetCurrentGameVar(_runtimeContext, name, string.Empty);
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return fallback;
    }

    private string ReadCurrentNonZeroAny(string fallback, params string[] names)
    {
        foreach (string name in names)
        {
            string value = Core.ScriptRef.GetCurrentGameVar(_runtimeContext, name, string.Empty);
            if (!string.IsNullOrWhiteSpace(value) &&
                !string.Equals(value.Trim(), "0", StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }
        }

        return fallback;
    }

    private static bool CommandHasOverride(mombotCommandContext context)
    {
        foreach (string parameter in context.Parameters)
        {
            if (string.Equals(parameter, "override", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(parameter, "overide", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private string ReadCurrentSectorAny(string fallback, params string[] names)
    {
        string? firstNonEmpty = null;
        foreach (string name in names)
        {
            string value = Core.ScriptRef.GetCurrentGameVar(_runtimeContext, name, string.Empty);
            if (string.IsNullOrWhiteSpace(value))
                continue;

            firstNonEmpty ??= value;
            if (IsDefinedSectorValue(value))
                return value;
        }

        return IsDefinedSectorValue(fallback) ? fallback : (firstNonEmpty ?? fallback);
    }

    private static bool IsDefinedSectorValue(string? value)
    {
        if (!int.TryParse(value, out int sector))
            return false;

        return sector > 0 && sector != ushort.MaxValue;
    }

    private static void SetVars(IDictionary<string, string> vars, string value, params string[] names)
    {
        foreach (string name in names)
        {
            if (!string.IsNullOrWhiteSpace(name))
                vars[name] = value;
        }
    }

    private static string ResolveBotFilePath(string currentValue, string folder, string fileName)
    {
        if (!string.IsNullOrWhiteSpace(currentValue) &&
            !string.Equals(currentValue, "0", StringComparison.OrdinalIgnoreCase))
        {
            return currentValue;
        }

        if (string.IsNullOrWhiteSpace(folder) ||
            string.Equals(folder, "0", StringComparison.OrdinalIgnoreCase))
        {
            return currentValue;
        }

        return Path.Combine(
                folder.Replace('\\', Path.DirectorySeparatorChar).Replace('/', Path.DirectorySeparatorChar),
                fileName)
            .Replace('\\', '/');
    }

    private static string FormatSector(ushort? sector)
    {
        if (!sector.HasValue)
            return "0";

        ushort value = sector.Value;
        return value == 0 || value == ushort.MaxValue ? "0" : value.ToString();
    }
}
