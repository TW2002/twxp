using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using Core = TWXProxy.Core;

namespace MTC.mombot;

internal enum mombotDispatchKind
{
    Invalid,
    Native,
    Script,
    Unsupported,
}

internal sealed record mombotDispatchResult(
    bool Success,
    mombotDispatchKind Kind,
    string CanonicalCommand,
    string Message,
    string? ScriptReference = null);

internal sealed record mombotStatusSnapshot(
    bool Enabled,
    bool AutoStart,
    bool IsAttached,
    bool WatcherEnabled,
    bool WatcherAttached,
    bool AcceptSelfCommands,
    bool AcceptSubspaceCommands,
    bool AcceptPrivateCommands,
    string BotName,
    string TeamName,
    int SubspaceChannel,
    int CurrentSector,
    string Mode,
    string ScriptRoot,
    string LastLoadedModule,
    IReadOnlyList<string> AuthorizedUsers);

internal sealed record mombotResolvedModule(
    string ScriptReference,
    string FullPath,
    string Category,
    string Type,
    bool Hidden);

internal sealed record mombotPrewarmModule(
    string CommandName,
    string ScriptPath);

internal sealed record mombotTransientModeRestore(
    string ParentMode,
    string ParentLastLoadedModule);

internal sealed class mombotService
{
    private static readonly string[] WarmModuleCommands =
    {
        "cap",
        "kill",
        "refurb",
        "hkill",
        "htorp",
        "surround",
        "xenter",
        "macro_kit",
        "dock_shopper",
        "kazi",
        "ldrop",
    };

    private static readonly Dictionary<string, (string Category, string Type)> PreloadModuleMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["macro_kit"] = ("Commands", "Defense"),
            ["dock_shopper"] = ("Commands", "Resource"),
            ["kazi"] = ("Commands", "Offense"),
            ["ldrop"] = ("Modes", "Offense"),
        };

    private Core.GameInstance? _gameInstance;
    private Core.ModDatabase? _database;
    private Core.ModInterpreter? _interpreter;
    private mombotConfig _config = new();
    private readonly HashSet<string> _authorizedUsers = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, string> _commandAliases = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, mombotTransientModeRestore> _transientModeRestores = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _outboundLineLock = new();
    private readonly StringBuilder _outboundLineBuffer = new();
    private readonly Core.TwxRuntimeContext _runtimeContext;

    public mombotService(Core.TwxRuntimeContext? runtimeContext = null)
    {
        _runtimeContext = runtimeContext ?? Core.GlobalModules.CurrentContext;
        Watcher = new mombotWatcher(_runtimeContext);
        Compat = new mombotCompatContext(_runtimeContext);
    }

    public mombotConfig Config => _config;
    public mombotWatcher Watcher { get; }
    public mombotCompatContext Compat { get; }
    public bool IsAttached => _gameInstance != null;
    public bool Enabled => _config.Enabled;
    public IReadOnlyList<mombotInternalCommandGroup> InternalCommandGroups => mombotCatalog.InternalCommandGroups;
    public IReadOnlyList<mombotHotkeyBinding> DefaultHotkeys => mombotCatalog.DefaultHotkeys;
    public IReadOnlyList<mombotMenuSurface> MenuSurfaces => mombotCatalog.MenuSurfaces;
    public IReadOnlyList<mombotCommandSpec> InitialCommands => mombotCatalog.InitialCommands;
    public mombotSettings Settings => mombotSettings.Load(_runtimeContext);

    internal static IReadOnlyList<string> BuildDefaultAliasConfigFileLines()
    {
        return new[]
        {
            "# mombot command aliases",
            "# format: alias[,alias...]=real command",
            string.Empty,
            "?=help",
            "l=land",
            "x=xport",
            "qss=status",
            "d=dep",
            "w=with",
            "k=keep",
            "sec=sector",
            "sect=sector",
            "secto=sector",
            "exit=xenter",
            "cn=cn9",
            "emx=reset",
            "finder=find",
            "pinfo=pscan",
            "parm=param",
            "params=param",
            "parms=param",
            "shipstore=storeship",
            "holotorp=htorp",
            "logout=logoff",
            "loguo=logoff",
            "m=mow",
            "p=pwarp",
            "t=twarp",
            "b=bwarp",
            "massupgrade=upgrade",
            "corp_info=corpinfo",
            "setparms=setparam",
            "plimp,climp,pmine,cmine=deploy",
            "mines=deploy",
            "pe,ped,pel,pelk,pex,pxe,pxed,pxedx,pxel,pxelk,pxex=invader",
            "photon=foton",
        };
    }

    public void AttachSession(
        Core.GameInstance? gameInstance,
        Core.ModDatabase? database,
        Core.ModInterpreter? interpreter,
        mombotConfig? config)
    {
        _gameInstance = gameInstance;
        _database = database;
        _interpreter = interpreter;
        _config = config ?? new mombotConfig();
        _config.Enabled = false;
        NormalizeConfig();
        ReloadCommandAliases();
        ResetAuthorizedUsers();
        SyncWatcherState();
    }

    public void DetachSession()
    {
        Watcher.Detach();
        _authorizedUsers.Clear();
        _gameInstance = null;
        _database = null;
        _interpreter = null;
    }

    public void ApplyConfig(mombotConfig? config)
    {
        bool wasEnabled = _config.Enabled;
        string previousScriptRoot = _config.ScriptRoot ?? string.Empty;
        _config = config ?? new mombotConfig();
        NormalizeConfig();
        ReloadCommandAliases();
        ResetAuthorizedUsers();
        SyncWatcherState();
        if (!wasEnabled && _config.Enabled)
            ArmRelogFlagsIfEnabled();

        bool scriptRootChanged = !string.Equals(previousScriptRoot, _config.ScriptRoot ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        if (_config.Enabled && (_interpreter != null || _gameInstance != null))
            WarmPreparedHotkeyModules(forceRefresh: scriptRootChanged);
    }

    public IReadOnlyList<Core.RunningScriptInfo> GetRunningScripts()
    {
        return Core.ProxyGameOperations.GetRunningScripts(_interpreter);
    }

    public string BuildModulePath(string category, string type, string commandName, bool hidden = false)
    {
        if (hidden)
            return Path.Combine(_config.ScriptRoot, "preload", $"_{commandName}.cts");

        string fileName = hidden ? $"_{commandName}.cts" : $"{commandName}.cts";
        return Path.Combine(_config.ScriptRoot, category, type, fileName);
    }

    public bool TryLoadScript(string scriptPath, out string? error)
    {
        error = null;
        if (_interpreter == null)
        {
            error = "No active interpreter.";
            return false;
        }

        try
        {
            Core.ProxyGameOperations.LoadScript(_interpreter, scriptPath);
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    public bool TryLoadScriptAtLabel(string scriptPath, string entryLabel, out string? error)
    {
        return TryLoadScriptAtLabel(scriptPath, entryLabel, null, out error);
    }

    public bool TryLoadScriptAtLabel(
        string scriptPath,
        string entryLabel,
        IReadOnlyDictionary<string, string>? initialVars,
        out string? error)
    {
        error = null;
        if (_interpreter == null)
        {
            error = "No active interpreter.";
            return false;
        }

        try
        {
            _interpreter.LoadAtLabel(
                scriptPath,
                false,
                entryLabel,
                script =>
                {
                    if (initialVars == null || initialVars.Count == 0)
                        return;

                    foreach ((string name, string value) in initialVars)
                        script.SetScriptVarIgnoreCase(name, value);
                });
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    public bool TryLoadScriptAtSubroutine(
        string scriptPath,
        string entryLabel,
        IReadOnlyDictionary<string, string>? initialVars,
        out string? error)
    {
        error = null;
        if (_interpreter == null)
        {
            error = "No active interpreter.";
            return false;
        }

        try
        {
            _interpreter.LoadAtSubroutine(
                scriptPath,
                false,
                entryLabel,
                script =>
                {
                    if (initialVars == null || initialVars.Count == 0)
                        return;

                    foreach ((string name, string value) in initialVars)
                        script.SetScriptVarIgnoreCase(name, value);
                });
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    public void WarmPreparedHotkeyModules(bool forceRefresh = false)
    {
        if (_interpreter == null)
            return;

        foreach (string command in WarmModuleCommands)
        {
            if (!TryResolveCommandScriptReference(command, out mombotResolvedModule? module) || module == null)
                continue;

            var moduleInfo = new FileInfo(module.FullPath);
            long hotkeyPrewarmLimitBytes = Core.GlobalModules.MombotHotkeyPrewarmLimitBytes;
            if (moduleInfo.Exists && moduleInfo.Length > hotkeyPrewarmLimitBytes)
            {
                Core.GlobalModules.DebugLog(
                    $"[mombot] hotkey prewarm skipped for '{module.FullPath}': script is {moduleInfo.Length} bytes, over {hotkeyPrewarmLimitBytes} byte memory cap\n");
                continue;
            }

            if (!Core.ScriptCmp.PrewarmCompiledScript(
                    module.FullPath,
                    _interpreter.ScriptRef,
                    _interpreter.ScriptDirectory,
                    forceRefresh,
                    out string? error))
            {
                if (!string.IsNullOrWhiteSpace(error))
                    Core.GlobalModules.DebugLog($"[mombot] hotkey prewarm skipped for '{module.FullPath}': {error}\n");
                continue;
            }

            Core.GlobalModules.DebugLog($"[mombot] hotkey prewarmed '{module.FullPath}'\n");
        }
    }

    public IReadOnlyList<mombotPrewarmModule> GetPrewarmModules()
    {
        var modules = new List<mombotPrewarmModule>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (string command in WarmModuleCommands)
        {
            if (!TryResolveCommandScriptReference(command, out mombotResolvedModule? module) || module == null)
                continue;

            string fullPath = Path.GetFullPath(module.FullPath);
            if (!seen.Add(fullPath))
                continue;

            modules.Add(new mombotPrewarmModule(command, fullPath));
        }

        return modules;
    }

    public bool TryLoadInstalledScriptAtLabel(string relativeReference, string entryLabel, out string? scriptReference, out string? error)
    {
        return TryLoadInstalledScriptAtLabel(relativeReference, entryLabel, null, out scriptReference, out error);
    }

    public bool TryLoadInstalledScriptAtLabel(
        string relativeReference,
        string entryLabel,
        IReadOnlyDictionary<string, string>? initialVars,
        out string? scriptReference,
        out string? error)
    {
        scriptReference = null;
        error = null;

        if (!TryResolveExplicitScriptReference(relativeReference, out string? reference, out _))
        {
            error = $"Unable to locate '{relativeReference}' in the configured Mombot script root.";
            return false;
        }

        scriptReference = reference;
        return TryLoadScriptAtLabel(reference!, entryLabel, initialVars, out error);
    }

    public bool TryLoadInstalledScriptAtSubroutine(
        string relativeReference,
        string entryLabel,
        IReadOnlyDictionary<string, string>? initialVars,
        out string? scriptReference,
        out string? error)
    {
        scriptReference = null;
        error = null;

        if (!TryResolveExplicitScriptReference(relativeReference, out string? reference, out _))
        {
            error = $"Unable to locate '{relativeReference}' in the configured Mombot script root.";
            return false;
        }

        scriptReference = reference;
        return TryLoadScriptAtSubroutine(reference!, entryLabel, initialVars, out error);
    }

    public bool StopScriptByName(string scriptName)
    {
        return Core.ProxyGameOperations.StopScriptByName(_interpreter, scriptName);
    }

    public IReadOnlyList<string> GetStartupScriptReferences()
    {
        string? scriptRoot = GetAbsoluteScriptRoot();
        if (string.IsNullOrWhiteSpace(scriptRoot))
            return Array.Empty<string>();

        var startupReferences = new List<string>();
        startupReferences.AddRange(EnumerateStartupScriptReferences(
            Path.Combine(scriptRoot, "startups"),
            SearchOption.TopDirectoryOnly));
        startupReferences.AddRange(EnumerateStartupScriptReferences(
            Path.Combine(scriptRoot, "local", "startups"),
            SearchOption.AllDirectories));

        return startupReferences
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public void StopAllNonSystemScripts()
    {
        Core.ProxyGameOperations.StopAllScripts(_interpreter, includeSystemScripts: false);
    }

    public void HandleObservedScriptStop()
    {
        if (!Enabled)
            return;

        if (TryRestoreTransientMode())
            return;

        string lastLoadedModule = GetSessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
        if (string.IsNullOrWhiteSpace(lastLoadedModule))
            return;

        if (IsScriptCurrentlyLoaded(lastLoadedModule))
            return;

        if (!IsModeScriptReference(lastLoadedModule))
            return;

        ApplySessionVar("$BOT~MODE", "General");
        ApplySessionVar("$bot~mode", "General");
        ApplySessionVar("$mode", "General");
    }

    private bool TryRestoreTransientMode()
    {
        if (_transientModeRestores.Count == 0)
            return false;

        foreach (string transientModule in _transientModeRestores.Keys.ToArray())
        {
            if (IsScriptCurrentlyLoaded(transientModule))
                continue;

            if (TryRestoreTransientMode(transientModule))
                return true;
        }

        return false;
    }

    private bool TryRestoreTransientMode(string transientModule)
    {
        if (!_transientModeRestores.Remove(transientModule, out mombotTransientModeRestore? restore))
            return false;

        if (!IsScriptCurrentlyLoaded(restore.ParentLastLoadedModule))
            return false;

        string restoredMode = string.IsNullOrWhiteSpace(restore.ParentMode)
            ? "General"
            : restore.ParentMode;

        ApplySessionVar("$BOT~MODE", restoredMode);
        ApplySessionVar("$bot~mode", restoredMode);
        ApplySessionVar("$mode", restoredMode);
        ApplySessionVar("$BOT~LAST_LOADED_MODULE", restore.ParentLastLoadedModule);
        ApplySessionVar("$LAST_LOADED_MODULE", restore.ParentLastLoadedModule);
        return true;
    }

    public bool TryResolveInitialCommand(string input, out mombotCommandSpec? command, out string canonical)
    {
        canonical = NormalizeConfiguredCommandAlias(mombotCatalog.NormalizeCommandName(input));
        return mombotCatalog.TryGetCommandSpec(canonical, out command);
    }

    public mombotStatusSnapshot GetStatusSnapshot()
    {
        mombotSettings settings = Settings;
        string mode = GetSessionVar("$BOT~MODE", "General");
        string lastLoadedModule = GetSessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);

        return new mombotStatusSnapshot(
            Enabled: _config.Enabled,
            AutoStart: _config.AutoStart,
            IsAttached: IsAttached,
            WatcherEnabled: _config.WatcherEnabled,
            WatcherAttached: Watcher.IsAttached,
            AcceptSelfCommands: _config.AcceptSelfCommands,
            AcceptSubspaceCommands: _config.AcceptSubspaceCommands,
            AcceptPrivateCommands: _config.AcceptPrivateCommands,
            BotName: settings.BotName,
            TeamName: settings.TeamName,
            SubspaceChannel: settings.SubspaceChannel,
            CurrentSector: GetCurrentSector(),
            Mode: string.IsNullOrWhiteSpace(mode) ? "General" : mode,
            ScriptRoot: _config.ScriptRoot,
            LastLoadedModule: lastLoadedModule,
            AuthorizedUsers: _authorizedUsers
                .OrderBy(user => user, StringComparer.OrdinalIgnoreCase)
                .ToArray());
    }

    public bool TryExecuteLocalInput(string input, out IReadOnlyList<mombotDispatchResult> results)
    {
        results = Array.Empty<mombotDispatchResult>();
        if (string.IsNullOrWhiteSpace(input))
            return false;

        string trimmed = input.Trim();
        if (TryParseLocalSelfCommand(trimmed, out mombotCommandContext? context) && context != null)
        {
            if (context.CommandLine.Length == 0)
            {
                mombotSettings settings = Settings;
                PublishMessage($"mombot: you are logged into this bot. Use {settings.BotName} help for commands.");
                return true;
            }

            mombotCommandContext dispatchContext = NormalizeDispatchContext(
                context.CommandName,
                context.Parameters,
                selfCommand: true,
                route: "local",
                userName: "self",
                trustedSelfCommand: context.TrustedSelfCommand,
                typedParameterLine: context.TypedParameterLine);
            results = new[] { ExecuteCommandContext(dispatchContext) };
            return true;
        }

        results = ExecuteCommandLine(trimmed, selfCommand: true, route: "local", userName: "self");
        return true;
    }

    public bool ObserveServerLine(string line, bool observeWatcher = true)
    {
        if (!Enabled || string.IsNullOrWhiteSpace(line))
            return false;

        bool watcherHandled = false;
        if (observeWatcher && Watcher.IsAttached)
            watcherHandled = Watcher.ObserveServerLine(line);

        if (TryHandlePageLogin(line))
            return true;

        if (!TryParseIncomingCommand(line, out mombotCommandContext? context))
            return watcherHandled;

        if (context == null)
            return watcherHandled;

        if (context.CommandLine.Length == 0)
        {
            return watcherHandled;
        }

        mombotCommandContext dispatchContext = NormalizeDispatchContext(
            context.CommandName,
            context.Parameters,
            context.SelfCommand,
            context.Route,
            context.UserName,
            context.TrustedSelfCommand,
            context.TypedParameterLine);

        if (!IsAuthorized(dispatchContext))
            return watcherHandled;

        if (IsBlockedRemoteControlCommand(dispatchContext))
            return watcherHandled;

        ExecuteCommandContext(dispatchContext);

        return true;
    }

    public void ObserveOutboundText(string text)
    {
        if (!Enabled || string.IsNullOrEmpty(text))
            return;

        List<string> completeLines = new();
        lock (_outboundLineLock)
        {
            foreach (char ch in text)
            {
                if (ch == '\r' || ch == '\n')
                {
                    if (_outboundLineBuffer.Length > 0)
                    {
                        completeLines.Add(_outboundLineBuffer.ToString());
                        _outboundLineBuffer.Clear();
                    }
                    continue;
                }

                if (ch == '\b' || ch == 127)
                {
                    if (_outboundLineBuffer.Length > 0)
                        _outboundLineBuffer.Length--;
                    continue;
                }

                _outboundLineBuffer.Append(ch);
                if (_outboundLineBuffer.Length > 4096)
                    _outboundLineBuffer.Clear();
            }
        }

        foreach (string line in completeLines)
            ObserveCompletedOutboundLine(line);
    }

    private void ObserveCompletedOutboundLine(string line)
    {
        if (!TryParseTrustedOutboundSelfCommand(line, out mombotCommandContext? context) || context == null)
            return;

        if (context.CommandLine.Length == 0)
            return;

        mombotCommandContext dispatchContext = NormalizeDispatchContext(
            context.CommandName,
            context.Parameters,
            context.SelfCommand,
            context.Route,
            context.UserName,
            context.TrustedSelfCommand,
            context.TypedParameterLine);
        ExecuteCommandContext(dispatchContext);
    }

    public IReadOnlyList<mombotDispatchResult> ExecuteCommandLine(
        string input,
        bool selfCommand = true,
        string route = "self",
        string userName = "self",
        bool trustedSelfCommand = false)
    {
        var results = new List<mombotDispatchResult>();
        foreach (string segment in SplitCommandSegments(input))
            results.Add(ExecuteSingleCommand(segment, selfCommand, route, userName, trustedSelfCommand));

        return results;
    }

    private mombotDispatchResult ExecuteSingleCommand(
        string input,
        bool selfCommand,
        string route,
        string userName,
        bool trustedSelfCommand)
    {
        if (string.IsNullOrWhiteSpace(input))
            return new mombotDispatchResult(false, mombotDispatchKind.Invalid, string.Empty, "Empty mombot command.");

        List<string> words = GetWords(input);
        if (words.Count == 0)
        {
            string emptyMessage = "mombot: Empty mombot command.";
            PublishMessage(emptyMessage);
            return new mombotDispatchResult(false, mombotDispatchKind.Invalid, string.Empty, emptyMessage);
        }

        string rawCommand = NormalizeRawCommandToken(words[0]);
        List<string> rawParameters = words.Skip(1).ToList();
        string typedParameterLine = BuildTypedParameterLine(words, 1);
        mombotCommandContext dispatchContext = NormalizeDispatchContext(
            rawCommand,
            rawParameters,
            selfCommand,
            route,
            userName,
            trustedSelfCommand,
            typedParameterLine);
        return ExecuteCommandContext(dispatchContext);
    }

    private mombotDispatchResult ExecuteCommandContext(mombotCommandContext dispatchContext)
    {
        EnsureLocalSelfCommandAudible(dispatchContext);
        ApplyDispatchContextVars(dispatchContext);
        string canonical = dispatchContext.CommandName;

        if (ShouldHandleNatively(canonical))
        {
            mombotCatalog.TryGetCommandSpec(canonical, out mombotCommandSpec? nativeCommand);
            mombotCommandSpec effectiveCommand = nativeCommand ?? new mombotCommandSpec(
                canonical,
                mombotCommandKind.Internal,
                $":INTERNAL_COMMANDS~{canonical}",
                "Native mombot management command.");
            return ExecuteNative(effectiveCommand, dispatchContext);
        }

        if (TryExecuteResolvedModule(dispatchContext, out mombotDispatchResult resolved))
            return resolved;

        string message = $"mombot: {FormatModeName(canonical)} is not a valid command.";
        PublishMessage(message);
        return new mombotDispatchResult(false, mombotDispatchKind.Invalid, canonical, message);
    }

    private void EnsureLocalSelfCommandAudible(mombotCommandContext context)
    {
        if (!context.SelfCommand || !string.Equals(context.Route, "local", StringComparison.OrdinalIgnoreCase))
            return;

        ApplySessionVar("$BOT~BOTISDEAF", "0");
        ApplySessionVar("$BOT~botIsDeaf", "0");
        ApplySessionVar("$bot~botIsDeaf", "0");
        ApplySessionVar("$botIsDeaf", "0");
    }

    private bool ShouldHandleNatively(string canonical)
    {
        return string.Equals(canonical, "bot", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(canonical, "stop", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(canonical, "stopall", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(canonical, "stopmodules", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(canonical, "listall", StringComparison.OrdinalIgnoreCase);
    }

    private bool TryExecuteResolvedModule(mombotCommandContext context, out mombotDispatchResult result)
    {
        result = default!;

        if (!TryResolveCommandScriptReference(context.CommandName, out mombotResolvedModule? module) || module == null)
            return false;

        string currentLastLoadedModule = GetSessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
        bool isMode = string.Equals(module.Category, "Modes", StringComparison.OrdinalIgnoreCase);
        bool helpRequested = HasHelpParameter(context.Parameters);
        // Bot scripts can send "'bot helper" and wait for the helper's switchboard reply.
        // Treat that own-subspace dispatch as transient so it does not kill the caller.
        bool transientModeCommand = isMode && !helpRequested && IsTrustedOwnSubspaceCommand(context);
        bool replaceActiveMode = isMode && !helpRequested && !transientModeCommand;
        bool modeOffRequested = isMode &&
                                !helpRequested &&
                                context.Parameters.Any(parameter => string.Equals(parameter, "off", StringComparison.OrdinalIgnoreCase));
        string moduleUserCommandLine = BuildModuleUserCommandLine(context);
        mombotTransientModeRestore? transientRestore = null;

        if (modeOffRequested)
        {
            if (!string.IsNullOrWhiteSpace(currentLastLoadedModule))
                StopScriptByName(currentLastLoadedModule);

            ApplySessionVar("$BOT~MODE", "General");
            ApplySessionVar("$bot~mode", "General");
            ApplySessionVar("$mode", "General");
            ApplySessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
            ApplySessionVar("$LAST_LOADED_MODULE", string.Empty);
            Compat.ApplyToSession(
                _interpreter,
                _database,
                _config,
                Settings,
                context,
                lastLoadedModule: string.Empty,
                userCommandLineOverride: moduleUserCommandLine);

            string stopMessage = $"{FormatModeName(context.CommandName)} mode is now off.";
            PublishMessage(stopMessage);
            result = new mombotDispatchResult(true, mombotDispatchKind.Native, context.CommandName, stopMessage);
            return true;
        }

        if (replaceActiveMode && !string.IsNullOrWhiteSpace(currentLastLoadedModule))
            StopScriptByName(currentLastLoadedModule);

        if (transientModeCommand)
        {
            bool hasExistingTransient = _transientModeRestores.TryGetValue(module.ScriptReference, out transientRestore);
            bool moduleIsCurrentParent = string.Equals(module.ScriptReference, currentLastLoadedModule, StringComparison.OrdinalIgnoreCase);
            if (hasExistingTransient || !moduleIsCurrentParent)
                StopScriptByName(module.ScriptReference);

            transientRestore ??= new mombotTransientModeRestore(
                GetSessionVar("$BOT~MODE", "General"),
                currentLastLoadedModule);
        }

        string effectiveLastLoadedModule = replaceActiveMode || transientModeCommand
            ? module.ScriptReference
            : currentLastLoadedModule;

        if (replaceActiveMode || transientModeCommand)
        {
            string modeName = FormatModeName(context.CommandName);

            if (transientModeCommand)
            {
                if (transientRestore != null)
                    _transientModeRestores[module.ScriptReference] = transientRestore;
            }

            ApplySessionVar("$BOT~MODE", modeName);
            ApplySessionVar("$bot~mode", modeName);
            ApplySessionVar("$mode", modeName);
            ApplySessionVar("$BOT~LAST_LOADED_MODULE", module.ScriptReference);
            ApplySessionVar("$LAST_LOADED_MODULE", module.ScriptReference);
        }

        IReadOnlyDictionary<string, string> initialVars = Compat.BuildVariableSnapshot(
            _database,
            _config,
            Settings,
            context,
            lastLoadedModule: effectiveLastLoadedModule,
            userCommandLineOverride: moduleUserCommandLine);
        Compat.ApplyVariableSnapshot(_interpreter, initialVars);

        if (!transientModeCommand)
            StopScriptByName(module.ScriptReference);
        if (!TryLoadScriptAtLabel(module.ScriptReference, string.Empty, initialVars, out string? error))
        {
            if (transientModeCommand)
                TryRestoreTransientMode(module.ScriptReference);
            string message = $"mombot: failed to load '{module.ScriptReference}': {error}";
            PublishMessage(message);
            result = new mombotDispatchResult(false, mombotDispatchKind.Script, context.CommandName, message, module.ScriptReference);
            return true;
        }

        result = new mombotDispatchResult(true, mombotDispatchKind.Script, context.CommandName, string.Empty, module.ScriptReference);
        return true;
    }

    private static string BuildModuleUserCommandLine(mombotCommandContext context)
    {
        return context.TypedParameterLine;
    }

    private static bool IsTrustedOwnSubspaceCommand(mombotCommandContext context)
    {
        return context.TrustedSelfCommand &&
               !context.SelfCommand &&
               string.Equals(context.Route, "subspace", StringComparison.OrdinalIgnoreCase);
    }

    private mombotDispatchResult ExecuteNative(mombotCommandSpec command, mombotCommandContext context)
    {
        string canonical = context.CommandName;

        switch (canonical.ToLowerInvariant())
        {
            case "stopall":
                StopAllNonSystemScripts();
                SetSessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
                SetSessionVar("$BOT~MODE", "General");
                return PublishNativeResult(canonical, "mombot stopped all non-system scripts.");

            case "stop":
                return ExecuteStop(context);

            case "stopmodules":
                return ExecuteStopModules(canonical);

            case "listall":
                return ExecuteListAll(canonical);

            case "bot":
                return ExecuteBotStatus(canonical);

            case "logoff":
                return PublishUnsupported(canonical, "mombot leaves logoff/logout script-backed for now because it is a server-interactive flow.");

            default:
                return PublishUnsupported(canonical, $"mombot does not have a native handler for '{canonical}' yet.");
        }
    }

    private mombotDispatchResult ExecuteStop(mombotCommandContext context)
    {
        string selector = context.Parameters.FirstOrDefault() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(selector))
        {
            string lastLoaded = GetSessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
            if (!string.IsNullOrWhiteSpace(lastLoaded) && StopScriptByName(lastLoaded))
            {
                SetSessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
                return PublishNativeResult(context.CommandName, $"mombot stopped {lastLoaded}.");
            }

            return PublishUnsupported(context.CommandName, "mombot stop needs a script name or an active last-loaded module.");
        }

        IReadOnlyList<Core.RunningScriptInfo> running = GetRunningScripts();
        int stopped = 0;
        foreach (Core.RunningScriptInfo script in running)
        {
            string loadedName = script.Name ?? string.Empty;
            string leaf = Path.GetFileNameWithoutExtension(loadedName);
            if (!loadedName.StartsWith(selector, StringComparison.OrdinalIgnoreCase) &&
                !leaf.StartsWith(selector, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (StopScriptByName(loadedName))
                stopped++;
        }

        if (stopped == 0)
            return PublishUnsupported(context.CommandName, $"mombot could not find a script starting with '{selector}'.");

        return PublishNativeResult(context.CommandName, $"mombot stopped {stopped} script(s) matching '{selector}'.");
    }

    private mombotDispatchResult ExecuteStopModules(string canonical)
    {
        StopAllNonSystemScripts();

        ApplySessionVar("$BOT~MODE", "General");
        ApplySessionVar("$bot~mode", "General");
        ApplySessionVar("$mode", "General");
        ApplySessionVar("$BOT~LAST_LOADED_MODULE", string.Empty);
        ApplySessionVar("$LAST_LOADED_MODULE", string.Empty);
        ApplySessionVar("$BOT~BOTISDEAF", "0");
        ApplySessionVar("$BOT~botIsDeaf", "0");
        ApplySessionVar("$bot~botIsDeaf", "0");
        ApplySessionVar("$botIsDeaf", "0");

        return PublishNativeResult(canonical, "mombot reset to General mode, undeafened the client, and stopped all non-system scripts.");
    }

    private mombotDispatchResult ExecuteListAll(string canonical)
    {
        IReadOnlyList<string> scriptNames = GetListAllScriptNames();
        string message = BuildListAllMessage(scriptNames);

        // Script-bot listall forces switchboard output to subspace in normal use.
        // Match that behavior instead of printing a local-only native status block.
        SendSwitchboardStyleSubspaceMessage(message);

        return new mombotDispatchResult(true, mombotDispatchKind.Native, canonical, $"mombot listed {scriptNames.Count} active script(s).");
    }

    private IReadOnlyList<string> GetListAllScriptNames()
    {
        var scriptNames = new List<string>();
        foreach (Core.RunningScriptInfo script in GetRunningScripts())
        {
            if (!string.IsNullOrWhiteSpace(script.Name))
                scriptNames.Add(script.Name);
        }

        if (Enabled && !scriptNames.Any(name => string.Equals(name, "mombot.cts", StringComparison.OrdinalIgnoreCase)))
            scriptNames.Add("mombot.cts");

        return scriptNames;
    }

    private static string BuildListAllMessage(IReadOnlyList<string> scriptNames)
    {
        var parts = new List<string>
        {
            " Current script(s) loaded",
            "--------------------------",
        };

        foreach (string scriptName in scriptNames)
            parts.Add("   " + scriptName);

        return string.Join("*", parts) + "*";
    }

    private void SendSwitchboardStyleSubspaceMessage(string message)
    {
        if (_gameInstance == null || !_gameInstance.IsConnected)
        {
            PublishMessage(message.Replace("*", "\r\n", StringComparison.Ordinal));
            return;
        }

        string mode = GetSessionVar("$BOT~MODE", "General");
        if (string.IsNullOrWhiteSpace(mode))
            mode = "General";

        string botName = Settings.BotName;
        if (string.IsNullOrWhiteSpace(botName))
            botName = "mombot";

        string switchboardMessage = "'*[" + mode + "] {" + botName + "} - * " + message + "*";
        string serverText = switchboardMessage.Replace("*", "\r", StringComparison.Ordinal);
        _gameInstance.SendToServerAsync(System.Text.Encoding.ASCII.GetBytes(serverText)).GetAwaiter().GetResult();
    }

    private mombotDispatchResult ExecuteBotStatus(string canonical)
    {
        mombotStatusSnapshot snapshot = GetStatusSnapshot();
        PublishMessage($"mombot: enabled={snapshot.Enabled} attached={snapshot.IsAttached} watcher={snapshot.WatcherEnabled}/{snapshot.WatcherAttached} sector={snapshot.CurrentSector}");
        PublishMessage($"mombot: botname={snapshot.BotName} team={snapshot.TeamName} subspace={snapshot.SubspaceChannel} mode={snapshot.Mode}");
        PublishMessage($"mombot: self={snapshot.AcceptSelfCommands} subspaceCmds={snapshot.AcceptSubspaceCommands} private={snapshot.AcceptPrivateCommands} authUsers={snapshot.AuthorizedUsers.Count}");
        PublishMessage($"mombot: scriptRoot={snapshot.ScriptRoot}");
        return new mombotDispatchResult(true, mombotDispatchKind.Native, canonical, "mombot displayed bot status.");
    }

    private mombotDispatchResult PublishNativeResult(string canonical, string message)
    {
        PublishMessage(message);
        return new mombotDispatchResult(true, mombotDispatchKind.Native, canonical, message);
    }

    private mombotDispatchResult PublishUnsupported(string canonical, string message)
    {
        PublishMessage(message);
        return new mombotDispatchResult(false, mombotDispatchKind.Unsupported, canonical, message);
    }

    private void PublishMessage(string message)
    {
        _gameInstance?.ClientMessage("\r\n" + message + "\r\n");
    }

    private string GetSessionVar(string name, string fallback = "")
        => Core.ScriptRef.GetCurrentGameVar(_runtimeContext, name, fallback);

    private void SetSessionVar(string name, string value)
        => Core.ScriptRef.SetCurrentGameVar(_runtimeContext, name, value);

    private int GetCurrentSector()
        => Core.ScriptRef.GetCurrentSector(_runtimeContext);

    private void ApplySessionVar(string name, string value)
    {
        SetSessionVar(name, value);

        if (_interpreter == null)
            return;

        for (int i = 0; i < _interpreter.Count; i++)
        {
            Core.Script? script = _interpreter.GetScript(i);
            script?.SetScriptVarIgnoreCase(name, value);
        }
    }

    private void ApplyDispatchContextVars(mombotCommandContext context)
    {
        string selfValue = context.SelfCommand ? "1" : "0";
        string caller = string.IsNullOrWhiteSpace(context.UserName) ? "self" : context.UserName;

        ApplySessionVar("$BOT~SELF_COMMAND", selfValue);
        ApplySessionVar("$SWITCHBOARD~SELF_COMMAND", selfValue);
        ApplySessionVar("$switchboard~self_command", selfValue);
        ApplySessionVar("$bot~self_command", selfValue);
        ApplySessionVar("$self_command", selfValue);

        ApplySessionVar("$BOT~COMMAND_CALLER", caller);
        ApplySessionVar("$bot~command_caller", caller);
        ApplySessionVar("$command_caller", caller);
    }

    private void NormalizeConfig()
    {
        if (string.IsNullOrWhiteSpace(_config.ScriptRoot))
            _config.ScriptRoot = "scripts/mombot";

        _config.WatcherEnabled = _config.Enabled;
    }

    private void SyncWatcherState()
    {
        _config.WatcherEnabled = _config.Enabled;
        if (_config.Enabled && _gameInstance != null)
            Watcher.Attach(_gameInstance, _database);
        else
            Watcher.Detach();
    }

    private void ArmRelogFlagsIfEnabled()
    {
        if (!_config.Enabled)
            return;

        SetSessionVar("$doRelog", "1");
        SetSessionVar("$BOT~DORELOG", "1");
        Core.GlobalModules.DebugLog("[mombot] Armed relog flags in current-game var cache ($doRelog=1, $BOT~DORELOG=1)\n");
    }

    private bool TryResolveExplicitScriptReference(string source, out string? scriptReference, out string? fullPath)
    {
        scriptReference = null;
        fullPath = null;
        if (string.IsNullOrWhiteSpace(source))
            return false;

        string relative = source
            .Replace('\\', Path.DirectorySeparatorChar)
            .Replace('/', Path.DirectorySeparatorChar);

        string resolvedFullPath;
        if (Path.IsPathRooted(relative))
        {
            resolvedFullPath = Path.GetFullPath(relative);
        }
        else
        {
            string? scriptRoot = GetAbsoluteScriptRoot();
            resolvedFullPath = !string.IsNullOrWhiteSpace(scriptRoot)
                ? Path.GetFullPath(Path.Combine(scriptRoot, relative))
                : ResolveAgainstProgramDirectory(relative);
        }

        if (!File.Exists(resolvedFullPath))
            return false;

        fullPath = resolvedFullPath;
        scriptReference = BuildLoadReference(resolvedFullPath);
        return true;
    }

    private bool TryResolveCommandScriptReference(string canonical, out mombotResolvedModule? module)
    {
        module = null;

        if (!IsSafeCommandModuleName(canonical))
            return false;

        string? scriptRoot = GetAbsoluteScriptRoot();
        if (!string.IsNullOrWhiteSpace(scriptRoot) &&
            Directory.Exists(scriptRoot) &&
            TryResolveLocalModuleCandidate(scriptRoot, canonical, out module))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(scriptRoot) &&
            Directory.Exists(scriptRoot) &&
            TryResolvePreloadModuleCandidate(scriptRoot, canonical, out module))
        {
            return true;
        }

        if (mombotCatalog.TryGetCommandSpec(canonical, out mombotCommandSpec? commandSpec) &&
            commandSpec?.Kind == mombotCommandKind.Module &&
            TryResolveExplicitScriptReference(commandSpec.Source, out string? explicitReference, out string? explicitFullPath))
        {
            ParseModuleSource(commandSpec.Source, out string category, out string type, out bool hidden);
            module = new mombotResolvedModule(explicitReference!, explicitFullPath!, category, type, hidden);
            return true;
        }

        if (string.IsNullOrWhiteSpace(scriptRoot) || !Directory.Exists(scriptRoot))
            return false;

        foreach (string category in mombotCatalog.Categories)
        {
            if (string.Equals(category, "Daemons", StringComparison.OrdinalIgnoreCase))
            {
                if (TryResolveModuleCandidate(scriptRoot, category, string.Empty, canonical, out module))
                    return true;

                continue;
            }

            foreach (string type in mombotCatalog.Types)
            {
                if (TryResolveModuleCandidate(scriptRoot, category, type, canonical, out module))
                    return true;
            }
        }

        return false;
    }

    private static bool IsSafeCommandModuleName(string canonical)
    {
        if (string.IsNullOrWhiteSpace(canonical))
            return false;

        foreach (char value in canonical)
        {
            if (char.IsControl(value) ||
                value is '/' or '\\' or ':' or '*' or '?' or '"' or '<' or '>' or '|')
            {
                return false;
            }
        }

        return canonical.IndexOfAny(Path.GetInvalidFileNameChars()) < 0;
    }

    private bool TryResolveLocalModuleCandidate(
        string scriptRoot,
        string canonical,
        out mombotResolvedModule? module)
    {
        module = null;

        string localRoot = Path.Combine(scriptRoot, "local");
        if (!TryResolveExistingDirectory(localRoot, out string resolvedLocalRoot))
            return false;

        if (TryResolveLegacyLocalModuleCandidate(resolvedLocalRoot, canonical, out module))
            return true;

        foreach (string category in mombotCatalog.Categories)
        {
            if (TryResolveCategorizedLocalModuleCandidate(resolvedLocalRoot, category, canonical, out module))
                return true;
        }

        return false;
    }

    private bool TryResolveLegacyLocalModuleCandidate(
        string localRoot,
        string canonical,
        out mombotResolvedModule? module)
    {
        module = null;

        string hiddenCandidate = Path.Combine(localRoot, "_" + canonical + ".cts");
        if (TryResolveExistingFile(hiddenCandidate, out string hiddenPath))
        {
            module = new mombotResolvedModule(
                BuildLoadReference(hiddenPath),
                Path.GetFullPath(hiddenPath),
                "Local",
                string.Empty,
                true);
            return true;
        }

        string visibleCandidate = Path.Combine(localRoot, canonical + ".cts");
        if (!TryResolveExistingFile(visibleCandidate, out string visiblePath))
            return false;

        module = new mombotResolvedModule(
            BuildLoadReference(visiblePath),
            Path.GetFullPath(visiblePath),
            "Local",
            string.Empty,
            false);
        return true;
    }

    private bool TryResolveCategorizedLocalModuleCandidate(
        string localRoot,
        string category,
        string canonical,
        out mombotResolvedModule? module)
    {
        module = null;

        string categoryRoot = Path.Combine(localRoot, category.ToLowerInvariant());
        if (!TryResolveExistingDirectory(categoryRoot, out string resolvedCategoryRoot))
            return false;

        foreach (string fileName in new[] { "_" + canonical + ".cts", canonical + ".cts" })
        {
            string? match = Directory
                .EnumerateFiles(resolvedCategoryRoot, "*.cts", SearchOption.AllDirectories)
                .Where(path => string.Equals(Path.GetFileName(path), fileName, StringComparison.OrdinalIgnoreCase))
                .OrderBy(path => Path.GetRelativePath(resolvedCategoryRoot, path), StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault();
            if (string.IsNullOrWhiteSpace(match))
                continue;

            string relativePath = Path.GetRelativePath(resolvedCategoryRoot, match);
            string type = ResolveLocalCategoryType(category, relativePath);
            bool hidden = Path.GetFileName(match).StartsWith("_", StringComparison.OrdinalIgnoreCase);
            module = new mombotResolvedModule(
                BuildLoadReference(match),
                Path.GetFullPath(match),
                category,
                type,
                hidden);
            return true;
        }

        return false;
    }

    private static string ResolveLocalCategoryType(string category, string relativePath)
    {
        if (string.Equals(category, "Daemons", StringComparison.OrdinalIgnoreCase))
            return string.Empty;

        string? directory = Path.GetDirectoryName(relativePath);
        if (string.IsNullOrWhiteSpace(directory))
            return string.Empty;

        string normalized = directory
            .Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar)
            .Trim(Path.DirectorySeparatorChar);
        if (string.IsNullOrWhiteSpace(normalized))
            return string.Empty;

        string firstSegment = normalized
            .Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(firstSegment))
            return string.Empty;

        return mombotCatalog.Types.FirstOrDefault(type =>
                   string.Equals(type, firstSegment, StringComparison.OrdinalIgnoreCase))
               ?? string.Empty;
    }

    private IEnumerable<string> EnumerateStartupScriptReferences(string startupRoot, SearchOption searchOption)
    {
        if (!Directory.Exists(startupRoot))
            return Enumerable.Empty<string>();

        return Directory
            .EnumerateFiles(startupRoot, "*.cts", searchOption)
            .OrderBy(path => Path.GetRelativePath(startupRoot, path), StringComparer.OrdinalIgnoreCase)
            .Select(path => BuildLoadReference(Path.GetFullPath(path)));
    }

    private bool TryResolvePreloadModuleCandidate(
        string scriptRoot,
        string canonical,
        out mombotResolvedModule? module)
    {
        module = null;

        if (!PreloadModuleMap.TryGetValue(canonical, out (string Category, string Type) location))
            return false;

        string directory = Path.Combine(scriptRoot, "preload");
        if (!TryResolveExistingDirectory(directory, out string resolvedDirectory))
            return false;

        string hiddenCandidate = Path.Combine(resolvedDirectory, "_" + canonical + ".cts");
        if (!TryResolveExistingFile(hiddenCandidate, out string hiddenPath))
            return false;

        module = new mombotResolvedModule(
            BuildLoadReference(hiddenPath),
            Path.GetFullPath(hiddenPath),
            location.Category,
            location.Type,
            true);
        return true;
    }

    private bool TryResolveModuleCandidate(
        string scriptRoot,
        string category,
        string type,
        string canonical,
        out mombotResolvedModule? module)
    {
        module = null;

        string directory = string.IsNullOrWhiteSpace(type)
            ? Path.Combine(scriptRoot, category.ToLowerInvariant())
            : Path.Combine(scriptRoot, category.ToLowerInvariant(), type.ToLowerInvariant());
        if (!TryResolveExistingDirectory(directory, out string resolvedDirectory))
            return false;

        string hiddenCandidate = Path.Combine(resolvedDirectory, "_" + canonical + ".cts");
        if (TryResolveExistingFile(hiddenCandidate, out string hiddenPath))
        {
            module = new mombotResolvedModule(
                BuildLoadReference(hiddenPath),
                Path.GetFullPath(hiddenPath),
                category,
                type,
                true);
            return true;
        }

        string visibleCandidate = Path.Combine(resolvedDirectory, canonical + ".cts");
        if (!TryResolveExistingFile(visibleCandidate, out string visiblePath))
            return false;

        module = new mombotResolvedModule(
            BuildLoadReference(visiblePath),
            Path.GetFullPath(visiblePath),
            category,
            type,
            false);
        return true;
    }

    private static void ParseModuleSource(string source, out string category, out string type, out bool hidden)
    {
        string normalized = source.Replace('\\', '/').Trim('/');
        string[] parts = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        category = parts.Length > 0 ? parts[0] : "Commands";
        type = parts.Length > 1 ? parts[1] : string.Empty;
        string fileName = parts.Length > 0 ? parts[^1] : string.Empty;
        hidden = fileName.StartsWith("_", StringComparison.OrdinalIgnoreCase);
    }

    private string? GetAbsoluteScriptRoot()
    {
        if (string.IsNullOrWhiteSpace(_config.ScriptRoot))
            return null;

        if (Path.IsPathRooted(_config.ScriptRoot))
            return Path.GetFullPath(_config.ScriptRoot);

        string normalized = _config.ScriptRoot
            .Replace('\\', Path.DirectorySeparatorChar)
            .Replace('/', Path.DirectorySeparatorChar)
            .Trim()
            .Trim(Path.DirectorySeparatorChar);
        string scriptsToken = "scripts" + Path.DirectorySeparatorChar;
        if (string.Equals(normalized, "scripts", StringComparison.OrdinalIgnoreCase))
            return GetScriptsDirectory();

        if (normalized.StartsWith(scriptsToken, StringComparison.OrdinalIgnoreCase))
            return Path.GetFullPath(Path.Combine(GetScriptsDirectory(), normalized[scriptsToken.Length..]));

        return Path.GetFullPath(Path.Combine(GetProgramDirectory(), normalized));
    }

    private static bool TryResolveExistingDirectory(string directory, out string resolved)
    {
        resolved = directory;
        if (Directory.Exists(directory))
        {
            resolved = Path.GetFullPath(directory);
            return true;
        }

        string? parent = Path.GetDirectoryName(directory);
        string leaf = Path.GetFileName(directory);
        if (string.IsNullOrWhiteSpace(parent) ||
            string.IsNullOrWhiteSpace(leaf) ||
            !TryResolveExistingDirectory(parent, out string resolvedParent))
        {
            return false;
        }

        try
        {
            string? match = Directory
                .EnumerateDirectories(resolvedParent)
                .FirstOrDefault(path => string.Equals(Path.GetFileName(path), leaf, StringComparison.OrdinalIgnoreCase));
            if (string.IsNullOrWhiteSpace(match))
                return false;

            resolved = Path.GetFullPath(match);
            return true;
        }
        catch
        {
            resolved = directory;
            return false;
        }
    }

    private static bool TryResolveExistingFile(string filePath, out string resolved)
    {
        resolved = filePath;
        if (File.Exists(filePath))
        {
            resolved = Path.GetFullPath(filePath);
            return true;
        }

        string? directory = Path.GetDirectoryName(filePath);
        string fileName = Path.GetFileName(filePath);
        if (string.IsNullOrWhiteSpace(directory) ||
            string.IsNullOrWhiteSpace(fileName) ||
            !TryResolveExistingDirectory(directory, out string resolvedDirectory))
        {
            return false;
        }

        try
        {
            string? match = Directory
                .EnumerateFiles(resolvedDirectory)
                .FirstOrDefault(path => string.Equals(Path.GetFileName(path), fileName, StringComparison.OrdinalIgnoreCase));
            if (string.IsNullOrWhiteSpace(match))
                return false;

            resolved = Path.GetFullPath(match);
            return true;
        }
        catch
        {
            resolved = filePath;
            return false;
        }
    }

    private string? GetAliasConfigPath()
    {
        string? scriptRoot = GetAbsoluteScriptRoot();
        if (string.IsNullOrWhiteSpace(scriptRoot))
            return null;

        return Path.Combine(scriptRoot, "aliases.cfg");
    }

    private void ReloadCommandAliases()
    {
        _commandAliases.Clear();
        LoadCommandAliasesFromLines(BuildDefaultAliasConfigFileLines(), _commandAliases);

        string? filePath = GetAliasConfigPath();
        if (!string.IsNullOrWhiteSpace(filePath) &&
            TryLoadCommandAliasesFromFile(filePath, out Dictionary<string, string>? loaded) &&
            loaded != null)
        {
            foreach ((string alias, string canonical) in loaded)
                _commandAliases[alias] = canonical;
        }
    }

    private static void LoadCommandAliasesFromLines(IEnumerable<string> lines, Dictionary<string, string> aliases)
    {
        foreach (string rawLine in lines)
        {
            string line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) ||
                line.StartsWith("#", StringComparison.Ordinal) ||
                line.StartsWith(";", StringComparison.Ordinal))
            {
                continue;
            }

            int separator = line.IndexOf('=');
            if (separator <= 0 || separator >= line.Length - 1)
                continue;

            string aliasList = line[..separator].Trim();
            string canonical = mombotCatalog.NormalizeCommandName(line[(separator + 1)..].Trim());
            if (string.IsNullOrWhiteSpace(aliasList) || string.IsNullOrWhiteSpace(canonical))
                continue;

            foreach (string aliasCandidate in aliasList.Split(','))
            {
                string alias = mombotCatalog.NormalizeCommandName(aliasCandidate.Trim());
                if (string.IsNullOrWhiteSpace(alias))
                    continue;

                aliases[alias] = canonical;
            }
        }
    }

    private static bool TryLoadCommandAliasesFromFile(string filePath, out Dictionary<string, string>? aliases)
    {
        aliases = null;
        try
        {
            if (!File.Exists(filePath))
                return false;

            var loaded = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (string rawLine in File.ReadLines(filePath))
            {
                string line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) ||
                    line.StartsWith("#", StringComparison.Ordinal) ||
                    line.StartsWith(";", StringComparison.Ordinal))
                {
                    continue;
                }

                int separator = line.IndexOf('=');
                if (separator <= 0 || separator >= line.Length - 1)
                    continue;

                string aliasList = line[..separator].Trim();
                string canonical = mombotCatalog.NormalizeCommandName(line[(separator + 1)..].Trim());
                if (string.IsNullOrWhiteSpace(aliasList) || string.IsNullOrWhiteSpace(canonical))
                    continue;

                foreach (string aliasCandidate in aliasList.Split(','))
                {
                    string alias = mombotCatalog.NormalizeCommandName(aliasCandidate.Trim());
                    if (string.IsNullOrWhiteSpace(alias))
                        continue;

                    loaded[alias] = canonical;
                }
            }

            aliases = loaded;
            return true;
        }
        catch
        {
            aliases = null;
            return false;
        }
    }

    private string NormalizeConfiguredCommandAlias(string commandName)
    {
        string normalized = string.IsNullOrWhiteSpace(commandName)
            ? string.Empty
            : commandName.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            return string.Empty;

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        while (_commandAliases.TryGetValue(normalized, out string? mapped) &&
               !string.IsNullOrWhiteSpace(mapped) &&
               seen.Add(normalized))
        {
            normalized = mombotCatalog.NormalizeCommandName(mapped);
        }

        return normalized;
    }

    private string ResolveAgainstProgramDirectory(string path)
    {
        return Path.IsPathRooted(path)
            ? Path.GetFullPath(path)
            : Path.GetFullPath(Path.Combine(GetProgramDirectory(), path));
    }

    private string BuildLoadReference(string fullPath)
    {
        string programDirectory = Path.GetFullPath(GetProgramDirectory());
        string candidate = Path.GetFullPath(fullPath);
        string prefix = programDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;

        if (candidate.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return Path.GetRelativePath(programDirectory, candidate).Replace('\\', '/');

        return candidate;
    }

    private string GetProgramDirectory()
    {
        if (!string.IsNullOrWhiteSpace(_interpreter?.ProgramDir))
            return _interpreter.ProgramDir;

        return Directory.GetCurrentDirectory();
    }

    private string GetScriptsDirectory()
    {
        if (!string.IsNullOrWhiteSpace(_interpreter?.ScriptDirectory))
            return Path.GetFullPath(_interpreter.ScriptDirectory);

        return Path.GetFullPath(Path.Combine(GetProgramDirectory(), "scripts"));
    }

    private bool IsModeScriptPath(string? fullPath)
    {
        string? scriptRoot = GetAbsoluteScriptRoot();
        if (string.IsNullOrWhiteSpace(fullPath) ||
            string.IsNullOrWhiteSpace(scriptRoot) ||
            !Path.IsPathRooted(fullPath))
        {
            return false;
        }

        string relativePath = Path.GetRelativePath(scriptRoot, fullPath);
        string[] segments = relativePath.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (segments.Length == 0)
            return false;

        if (string.Equals(segments[0], "modes", StringComparison.OrdinalIgnoreCase))
            return true;

        return segments.Length > 1 &&
               string.Equals(segments[0], "local", StringComparison.OrdinalIgnoreCase) &&
               string.Equals(segments[1], "modes", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsModeScriptReference(string scriptReference)
    {
        if (string.IsNullOrWhiteSpace(scriptReference))
            return false;

        if (TryResolveExplicitScriptReference(scriptReference, out _, out string? fullPath) &&
            IsModeScriptPath(fullPath))
        {
            return true;
        }

        string normalized = scriptReference.Replace('\\', '/').Trim().TrimStart('/');
        return normalized.StartsWith("scripts/mombot/modes/", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("modes/", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("scripts/mombot/local/modes/", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("local/modes/", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsScriptCurrentlyLoaded(string scriptReference)
    {
        if (_interpreter == null || string.IsNullOrWhiteSpace(scriptReference))
            return false;

        string normalizedReference = scriptReference.Replace('\\', '/').Trim();
        string fileName = Path.GetFileName(normalizedReference);

        return Core.ProxyGameOperations
            .GetRunningScripts(_interpreter)
            .Any(script =>
                script.Reference.Replace('\\', '/').EndsWith(normalizedReference, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(Path.GetFileName(script.Reference.Replace('\\', '/')), fileName, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(script.Name, scriptReference, StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasHelpParameter(IReadOnlyList<string> parameters)
    {
        return parameters.Any(parameter =>
            string.Equals(parameter, "help", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(parameter, "?", StringComparison.OrdinalIgnoreCase));
    }

    private static string FormatModeName(string commandName)
    {
        if (string.IsNullOrWhiteSpace(commandName))
            return "General";

        if (commandName.Length == 1)
            return commandName.ToUpperInvariant();

        return char.ToUpperInvariant(commandName[0]) + commandName[1..];
    }

    private bool TryHandlePageLogin(string line)
    {
        if (!_config.AcceptPrivateCommands || !TryParseFixedWidthCommand(line, 'P', out string userName, out string payload))
            return false;

        mombotSettings settings = Settings;
        if (string.IsNullOrWhiteSpace(settings.BotPassword) || settings.SubspaceChannel <= 0)
            return false;

        string loginToken = $"{settings.BotName}:{settings.BotPassword}:{settings.SubspaceChannel}";
        if (payload.IndexOf(loginToken, StringComparison.OrdinalIgnoreCase) < 0)
            return false;

        if (!string.IsNullOrWhiteSpace(userName))
        {
            _authorizedUsers.Add(userName);
            PersistAuthorizedUsers();
        }

        PublishMessage($"mombot: user verified - {userName}");
        return true;
    }

    private bool TryParseIncomingCommand(string line, out mombotCommandContext? context)
    {
        context = null;

        // ObserveServerLine is only called after a CR-terminated server line.
        // Keep completed self-quote commands here; filtering partial composition
        // belongs in the line-framing layer, not by removing this command path.
        if (_config.AcceptSelfCommands)
        {
            foreach (string targetName in GetOwnCommandTargets(includeAll: true))
            {
                if (TryParseOwnCommand(
                    line,
                    targetName,
                    selfCommand: false,
                    route: "subspace",
                    userName: "self",
                    trustedSelfCommand: true,
                    out context))
                {
                    return true;
                }
            }
        }

        if (_config.AcceptSubspaceCommands)
        {
            foreach (string targetName in GetOwnCommandTargets(includeAll: true))
            {
                if (TryParseRemoteCommand(line, 'R', targetName, "subspace", out context))
                    return true;
            }
        }

        if (_config.AcceptPrivateCommands)
        {
            foreach (string targetName in GetOwnCommandTargets(includeAll: true))
            {
                if (TryParseRemoteCommand(line, 'P', targetName, "private", out context))
                    return true;
            }
        }

        return false;
    }

    private bool TryParseLocalSelfCommand(string line, out mombotCommandContext? context)
    {
        context = null;
        if (string.IsNullOrWhiteSpace(line))
            return false;

        foreach (string targetName in GetOwnCommandTargets(includeAll: true))
        {
            if (TryParseOwnCommand(line, targetName, out context))
                return true;
        }

        return false;
    }

    private bool TryParseTrustedOutboundSelfCommand(string line, out mombotCommandContext? context)
    {
        context = null;
        if (!_config.AcceptSelfCommands || string.IsNullOrWhiteSpace(line))
            return false;

        foreach (string targetName in GetOwnCommandTargets(includeAll: true))
        {
            if (TryParseOwnCommand(
                line,
                targetName,
                selfCommand: false,
                route: "subspace",
                userName: "self",
                trustedSelfCommand: true,
                out context))
            {
                return true;
            }
        }

        return false;
    }

    private IReadOnlyList<string> GetOwnCommandTargets(bool includeAll)
    {
        mombotSettings settings = Settings;
        var targets = new List<string>();

        AddCommandTarget(targets, GetSessionVar("$SWITCHBOARD~BOT_NAME", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$SWITCHBOARD~bot_name", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$BOT~BOT_NAME", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$bot~bot_name", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$bot_name", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$bot~name", string.Empty));
        AddCommandTarget(targets, settings.BotName);

        AddCommandTarget(targets, GetSessionVar("$BOT~BOT_TEAM_NAME", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$BOT~bot_team_name", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$bot~bot_team_name", string.Empty));
        AddCommandTarget(targets, GetSessionVar("$bot_team_name", string.Empty));
        AddCommandTarget(targets, settings.TeamName);

        if (includeAll)
            AddCommandTarget(targets, "all");

        return targets;
    }

    private static void AddCommandTarget(List<string> targets, string? value)
    {
        string target = value?.Trim() ?? string.Empty;
        if (target.Length == 0 || string.Equals(target, "0", StringComparison.OrdinalIgnoreCase))
            return;

        if (!targets.Any(existing => string.Equals(existing, target, StringComparison.OrdinalIgnoreCase)))
            targets.Add(target);
    }

    private static bool TryParseOwnCommand(string line, string targetName, out mombotCommandContext? context)
        => TryParseOwnCommand(line, targetName, selfCommand: true, route: "self", userName: "self", trustedSelfCommand: true, out context);

    private static bool TryParseOwnCommand(
        string line,
        string targetName,
        bool selfCommand,
        string route,
        string userName,
        bool trustedSelfCommand,
        out mombotCommandContext? context)
    {
        context = null;
        if (string.IsNullOrWhiteSpace(targetName))
            return false;

        string prefix = "'" + targetName;
        if (!line.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        string remainder = line[prefix.Length..].TrimStart();
        if (string.IsNullOrWhiteSpace(remainder))
        {
            context = new mombotCommandContext(string.Empty, string.Empty, Array.Empty<string>(), selfCommand, route, userName, string.Empty, string.Empty, trustedSelfCommand);
            return true;
        }

        List<string> words = GetWords(remainder);
        if (words.Count == 0)
            return false;

        string commandName = words[0];
        List<string> parameters = words.Skip(1).Take(8).ToList();
        string typedParameterLine = BuildTypedParameterLine(words, 1);
        context = new mombotCommandContext(
            BuildNormalizedCommandLine(commandName, parameters),
            commandName,
            parameters,
            selfCommand,
            route,
            userName,
            string.Empty,
            typedParameterLine,
            trustedSelfCommand);
        return true;
    }

    private static bool TryParseRemoteCommand(string line, char routePrefix, string targetName, string route, out mombotCommandContext? context)
    {
        context = null;
        if (!TryParseFixedWidthCommand(line, routePrefix, out string userName, out string payload))
            return false;

        List<string> words = GetWords(payload);
        if (words.Count == 0 || !string.Equals(words[0], targetName, StringComparison.OrdinalIgnoreCase))
            return false;

        if (words.Count == 1)
            return false;

        string commandName = words[1];
        List<string> parameters = words.Skip(2).Take(8).ToList();
        string typedParameterLine = BuildTypedParameterLine(words, 2);
        string normalized = BuildNormalizedCommandLine(commandName, parameters);
        context = new mombotCommandContext(normalized, commandName, parameters, false, route, userName, string.Empty, typedParameterLine);
        return true;
    }

    private static bool TryParseFixedWidthCommand(string line, char routePrefix, out string userName, out string payload)
    {
        userName = string.Empty;
        payload = string.Empty;

        if (string.IsNullOrWhiteSpace(line) || line.Length < 2 || char.ToUpperInvariant(line[0]) != routePrefix)
            return false;

        userName = line.Length > 2
            ? line.Substring(2, Math.Min(6, Math.Max(0, line.Length - 2))).Trim()
            : string.Empty;

        payload = line.Length > 9 ? line[9..].Trim() : string.Empty;
        return !string.IsNullOrWhiteSpace(payload);
    }

    private bool IsAuthorized(mombotCommandContext context)
    {
        if (context.SelfCommand || context.TrustedSelfCommand)
            return true;

        if (_authorizedUsers.Count == 0)
            return true;

        return !string.IsNullOrWhiteSpace(context.UserName) && _authorizedUsers.Contains(context.UserName);
    }

    private static bool IsBlockedRemoteControlCommand(mombotCommandContext context)
    {
        if (context.SelfCommand || context.TrustedSelfCommand)
            return false;

        return string.Equals(context.CommandName, "bot", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(context.CommandName, "relog", StringComparison.OrdinalIgnoreCase);
    }

    private void ResetAuthorizedUsers()
    {
        _authorizedUsers.Clear();
        foreach (string user in _config.AuthorizedUsers)
        {
            string trimmed = user?.Trim() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(trimmed))
                _authorizedUsers.Add(trimmed);
        }

        foreach (string user in LoadAuthorizedUsersFromStorage())
            _authorizedUsers.Add(user);
    }

    private static IEnumerable<string> SplitCommandSegments(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            yield break;

        foreach (string segment in input.Split('|'))
        {
            string trimmed = segment.Trim();
            if (!string.IsNullOrWhiteSpace(trimmed))
                yield return trimmed;
        }
    }

    private static List<string> GetWords(string input)
    {
        return input
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)
            .ToList();
    }

    private static string BuildTypedParameterLine(IReadOnlyList<string> words, int parameterStartIndex)
    {
        return words.Count <= parameterStartIndex
            ? string.Empty
            : string.Join(" ", words.Skip(parameterStartIndex));
    }

    private mombotCommandContext NormalizeDispatchContext(
        string commandName,
        IReadOnlyList<string> rawParameters,
        bool selfCommand,
        string route,
        string userName,
        bool trustedSelfCommand,
        string typedParameterLine)
    {
        string typedCommandName = string.IsNullOrWhiteSpace(commandName)
            ? string.Empty
            : commandName.Trim();
        string normalizedCommand = typedCommandName;
        var typedParameters = rawParameters.Take(8).ToList();
        var parameters = typedParameters.ToList();

        ApplyStockCommandRewrites(ref normalizedCommand, parameters);
        normalizedCommand = NormalizeConfiguredCommandAlias(mombotCatalog.NormalizeCommandName(normalizedCommand));
        ExpandStockParameterAliases(parameters);
        ApplyTravelCommandRewrites(ref normalizedCommand, parameters);
        normalizedCommand = NormalizeConfiguredCommandAlias(mombotCatalog.NormalizeCommandName(normalizedCommand));

        string normalizedLine = BuildNormalizedCommandLine(normalizedCommand, parameters);
        return new mombotCommandContext(
            normalizedLine,
            normalizedCommand,
            parameters,
            selfCommand,
            route,
            userName,
            typedCommandName,
            typedParameterLine,
            trustedSelfCommand);
    }

    private static string BuildNormalizedCommandLine(string canonical, IReadOnlyList<string> parameters)
    {
        return parameters.Count == 0
            ? canonical
            : canonical + " " + string.Join(" ", parameters);
    }

    private void ApplyStockCommandRewrites(ref string commandName, List<string> parameters)
    {
        if (MatchesCommand(commandName, "create"))
        {
            string firstParameter = GetParameter(parameters, 0);
            commandName = IsPortOrPlanetTarget(firstParameter) ? firstParameter : "port";
            InsertParameterAtFront(parameters, "create");
            return;
        }

        if (MatchesAnyCommand(commandName, "kill", "destroy", "blow"))
        {
            string firstParameter = GetParameter(parameters, 0);
            if (IsPortOrPlanetTarget(firstParameter))
            {
                commandName = firstParameter;
                if (parameters.Count == 0)
                    parameters.Add("kill");
                else
                    parameters[0] = "kill";
            }
            else
            {
                commandName = "kill";
            }

            return;
        }

        if (MatchesCommand(commandName, "max"))
        {
            string firstParameter = GetParameter(parameters, 0);
            commandName = IsPortOrPlanetTarget(firstParameter) ? firstParameter : "port";
            InsertParameterAtFront(parameters, "upgrade");
            return;
        }

        if (MatchesAnyCommand(commandName, "f", "fde", "ufde", "nf", "uf", "de", "fp", "fup", "nfup"))
        {
            InsertParameterAtFront(parameters, commandName);
            commandName = "find";
        }
    }

    private void ExpandStockParameterAliases(List<string> parameters)
    {
        for (int index = 0; index < parameters.Count; index++)
        {
            string parameter = parameters[index];
            if (string.IsNullOrWhiteSpace(parameter))
                continue;

            if (string.Equals(parameter, "s", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ReadCurrentSectorAny(FormatSector(_database?.DBHeader.StarDock), "$STARDOCK", "$MAP~STARDOCK", "$MAP~stardock", "$BOT~STARDOCK", "$stardock");
            else if (string.Equals(parameter, "r", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ReadCurrentAny(FormatSector(_database?.DBHeader.Rylos), "$MAP~RYLOS", "$MAP~rylos", "$BOT~RYLOS", "$rylos");
            else if (string.Equals(parameter, "a", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ReadCurrentAny(FormatSector(_database?.DBHeader.AlphaCentauri), "$MAP~ALPHA_CENTAURI", "$MAP~alpha_centauri", "$BOT~ALPHA_CENTAURI", "$alpha_centauri");
            else if (string.Equals(parameter, "h", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ReadCurrentAny("0", "$MAP~HOME_SECTOR", "$MAP~home_sector", "$BOT~HOME_SECTOR", "$home_sector");
            else if (string.Equals(parameter, "b", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ReadCurrentAny("0", "$MAP~BACKDOOR", "$MAP~backdoor", "$backdoor");
            else if (string.Equals(parameter, "x", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ReadCurrentAny("0", "$BOT~SAFE_SHIP", "$bot~safe_ship", "$safe_ship");
            else if (string.Equals(parameter, "l", StringComparison.OrdinalIgnoreCase))
                parameters[index] = ResolveSafePlanetSectorAlias();
        }
    }

    private void ApplyTravelCommandRewrites(ref string commandName, List<string> parameters)
    {
        if (!MatchesAnyCommand(commandName, "mow", "twarp", "bwarp", "pwarp", "smow", "moveship", "m", "t", "b", "p"))
            return;

        // Match the original script-bot command-processing order: stock sector
        // aliases are expanded for parameters first, then travel-style commands
        // get their special "planet <id>" -> sector rewrite.
        RewriteTravelPlanetTarget(parameters);
    }

    private void RewriteTravelPlanetTarget(List<string> parameters)
    {
        if (parameters.Count < 2)
            return;

        if (!string.Equals(parameters[0], "planet", StringComparison.OrdinalIgnoreCase))
            return;

        string resolvedSector = ResolvePlanetSector(parameters[1]);
        if (!string.IsNullOrWhiteSpace(resolvedSector))
            parameters[0] = resolvedSector;
    }

    private string ResolveSafePlanetSectorAlias()
    {
        string safePlanet = ReadCurrentAny("0", "$BOT~SAFE_PLANET", "$bot~safe_planet", "$safe_planet");
        if (string.IsNullOrWhiteSpace(safePlanet) || safePlanet == "0")
            return "l";

        string resolvedSector = ResolvePlanetSector(safePlanet);
        return string.IsNullOrWhiteSpace(resolvedSector) ? "l" : resolvedSector;
    }

    private string ResolvePlanetSector(string planetIdToken)
    {
        if (_database == null || string.IsNullOrWhiteSpace(planetIdToken))
            return string.Empty;

        if (!int.TryParse(planetIdToken, NumberStyles.Integer, CultureInfo.InvariantCulture, out int planetId) || planetId <= 0)
            return string.Empty;

        string sectorFromParameter = _database.GetSectorVar(planetId, "PSECTOR");
        if (!string.IsNullOrWhiteSpace(sectorFromParameter))
            return sectorFromParameter;

        int lastSector = _database.GetPlanet(planetId)?.LastSector ?? 0;
        return lastSector > 0
            ? lastSector.ToString(CultureInfo.InvariantCulture)
            : string.Empty;
    }

    private static bool IsPortOrPlanetTarget(string value)
    {
        return string.Equals(value, "port", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(value, "planet", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetParameter(IReadOnlyList<string> parameters, int index)
    {
        return index >= 0 && index < parameters.Count ? parameters[index] : string.Empty;
    }

    private static void InsertParameterAtFront(List<string> parameters, string value)
    {
        parameters.Insert(0, value);
        if (parameters.Count > 8)
            parameters.RemoveAt(8);
    }

    private static bool MatchesCommand(string commandName, string expected)
    {
        return string.Equals(commandName, expected, StringComparison.OrdinalIgnoreCase);
    }

    private static bool MatchesAnyCommand(string commandName, params string[] expected)
    {
        return expected.Any(candidate => string.Equals(commandName, candidate, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeRawCommandToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return string.Empty;

        string normalized = token.Trim();
        int splitIndex = normalized.IndexOf(' ');
        if (splitIndex >= 0)
            normalized = normalized[..splitIndex];

        if (normalized.EndsWith(".cts", StringComparison.OrdinalIgnoreCase))
            normalized = normalized[..^4];
        else if (normalized.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
            normalized = normalized[..^3];

        return normalized;
    }

    private string ReadCurrentAny(string fallback, params string[] names)
    {
        foreach (string name in names)
        {
            string value = GetSessionVar(name, string.Empty);
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return fallback;
    }

    private string ReadCurrentSectorAny(string fallback, params string[] names)
    {
        string? firstNonEmpty = null;
        foreach (string name in names)
        {
            string value = GetSessionVar(name, string.Empty);
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
        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int sector))
            return false;

        return sector > 0 && sector != ushort.MaxValue;
    }

    private static string FormatSector(ushort? sector)
    {
        if (!sector.HasValue)
            return "0";

        ushort value = sector.Value;
        return value == 0 || value == ushort.MaxValue ? "0" : value.ToString(CultureInfo.InvariantCulture);
    }

    private IReadOnlyList<string> LoadAuthorizedUsersFromStorage()
    {
        string? botUsersFile = GetBotUsersFilePath();
        if (string.IsNullOrWhiteSpace(botUsersFile) || !File.Exists(botUsersFile))
            return Array.Empty<string>();

        return File.ReadLines(botUsersFile)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private void PersistAuthorizedUsers()
    {
        string? botUsersFile = GetBotUsersFilePath();
        if (string.IsNullOrWhiteSpace(botUsersFile))
            return;

        string? directory = Path.GetDirectoryName(botUsersFile);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        File.WriteAllLines(
            botUsersFile,
            _authorizedUsers
                .OrderBy(user => user, StringComparer.OrdinalIgnoreCase)
                .ToArray());
    }

    private string? GetBotUsersFilePath()
    {
        string? storageDirectory = GetGameStorageDirectory();
        if (string.IsNullOrWhiteSpace(storageDirectory))
            return null;

        return Path.Combine(storageDirectory, "bot_users.lst");
    }

    private string? GetGameStorageDirectory()
    {
        string gameName = Path.GetFileNameWithoutExtension(_database?.DatabasePath ?? _database?.DatabaseName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(gameName))
            return null;

        return Path.Combine(GetProgramDirectory(), "games", gameName);
    }

    private static string ExpandNumericSuffix(string token)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length < 2)
            return token;

        char suffix = char.ToLowerInvariant(token[^1]);
        long multiplier = suffix switch
        {
            'k' => 1_000L,
            'm' => 1_000_000L,
            'b' => 1_000_000_000L,
            _ => 0L,
        };
        if (multiplier == 0L)
            return token;

        string numericPortion = token[..^1];
        if (!long.TryParse(numericPortion, NumberStyles.Integer, CultureInfo.InvariantCulture, out long parsed))
            return token;

        return (parsed * multiplier).ToString(CultureInfo.InvariantCulture);
    }
}
