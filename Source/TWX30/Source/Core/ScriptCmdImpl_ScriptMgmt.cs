/*
Copyright (C) 2005  Remco Mulder, 2026 Matt Mosley

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TWXProxy.Core
{
    public partial class ScriptRef
    {
        private static ModInterpreter? GetActiveInterpreter()
        {
            return GlobalModules.CurrentContext.ActiveInterpreter ?? (GlobalModules.TWXInterpreter as ModInterpreter);
        }

        private static GameInstance? GetActiveGameInstance()
        {
            return ActiveGameInstance ?? (GlobalModules.CurrentContext.TWXServer as GameInstance);
        }

        private static bool ScriptReferenceMatches(ModInterpreter interpreter, Script? scriptObj, string requestedName)
        {
            if (scriptObj == null)
                return false;

            string loadedName = scriptObj.LoadEventName ?? scriptObj.Compiler?.ScriptFile ?? scriptObj.ScriptName;
            return ModInterpreter.ScriptReferencesMatch(loadedName, requestedName, interpreter.ProgramDir, interpreter.ScriptDirectory);
        }

        private static BotConfig? FindNativeBotConfig(ITWXServer? server)
        {
            if (server == null)
                return null;

            if (!string.IsNullOrWhiteSpace(server.ActiveBotName))
            {
                BotConfig? activeConfig = server.GetBotConfig(server.ActiveBotName);
                if (ProxyMenuCatalog.IsNativeBotConfig(activeConfig))
                    return activeConfig;
            }

            foreach (string botName in server.GetBotList())
            {
                BotConfig? config = server.GetBotConfig(botName);
                if (ProxyMenuCatalog.IsNativeBotConfig(config))
                    return config;
            }

            return null;
        }

        private static bool TryResolveNativeBotScriptReference(
            ModInterpreter? interpreter,
            string requestedName,
            out GameInstance? gameInstance,
            out BotConfig? nativeConfig,
            out string nativeLeafName)
        {
            gameInstance = GetActiveGameInstance();
            nativeConfig = null;
            nativeLeafName = string.Empty;

            if (interpreter == null || gameInstance == null || string.IsNullOrWhiteSpace(requestedName))
                return false;

            nativeConfig = FindNativeBotConfig(gameInstance);
            if (nativeConfig == null || string.IsNullOrWhiteSpace(nativeConfig.ScriptFile))
                return false;

            string configuredReference = Utility.NormalizePathSeparators(nativeConfig.ScriptFile.Trim());
            nativeLeafName = Path.GetFileName(configuredReference);
            if (string.IsNullOrWhiteSpace(nativeLeafName))
                nativeLeafName = "mombot.cts";

            string prefixedReference = configuredReference.StartsWith("scripts/", StringComparison.OrdinalIgnoreCase)
                ? configuredReference
                : "scripts/" + configuredReference;

            if (ModInterpreter.ScriptReferencesMatch(requestedName, configuredReference, interpreter.ProgramDir, interpreter.ScriptDirectory) ||
                ModInterpreter.ScriptReferencesMatch(requestedName, prefixedReference, interpreter.ProgramDir, interpreter.ScriptDirectory))
            {
                return true;
            }

            string requestedLeaf = ModInterpreter.GetScriptReferenceLeaf(requestedName);
            return !string.IsNullOrWhiteSpace(requestedLeaf) &&
                   requestedLeaf.Equals(nativeLeafName, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsNativeBotRunning(GameInstance? gameInstance, BotConfig? nativeConfig)
        {
            if (gameInstance == null || nativeConfig == null || string.IsNullOrWhiteSpace(gameInstance.ActiveBotName))
                return false;

            BotConfig? activeConfig = gameInstance.GetBotConfig(gameInstance.ActiveBotName);
            return ProxyMenuCatalog.IsNativeBotConfig(activeConfig) &&
                   string.Equals(activeConfig?.Name, nativeConfig.Name, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsAnyNativeBotRunning(GameInstance? gameInstance)
        {
            if (gameInstance == null || string.IsNullOrWhiteSpace(gameInstance.ActiveBotName))
                return false;

            BotConfig? activeConfig = gameInstance.GetBotConfig(gameInstance.ActiveBotName);
            return ProxyMenuCatalog.IsNativeBotConfig(activeConfig);
        }

        #region Script Management Command Implementation

        private static CmdAction CmdLoadScript_Impl(object script, CmdParam[] parameters)
        {
            // CMD: load <filename>
            // Load and execute a script file
            var interpreter = GetActiveInterpreter();
            if (interpreter == null)
            {
                GlobalModules.DebugLog("[LOAD] No active interpreter\n");
                return CmdAction.None;
            }

            string filename = parameters[0].Value;
            GlobalModules.DebugLog($"[LOAD] Loading script '{filename}'\n");

            try
            {
                if (TryResolveNativeBotScriptReference(interpreter, filename, out GameInstance? gameInstance, out BotConfig? nativeConfig, out string nativeLeafName) &&
                    gameInstance?.NativeBotActivator != null &&
                    nativeConfig != null)
                {
                    if (IsNativeBotRunning(gameInstance, nativeConfig))
                    {
                        GlobalModules.DebugLog($"[LOAD] Native bot '{nativeConfig.Name}' already running for '{nativeLeafName}'\n");
                        return CmdAction.None;
                    }

                    GlobalModules.DebugLog(
                        $"[LOAD] Ignoring implicit native bot start for '{filename}'. Use Bot -> Start or NATIVEBOT START instead.\n");
                    return CmdAction.None;
                }

                if (GetActiveGameInstance() is GameInstance activeGameInstance &&
                    activeGameInstance.NativeBotScriptRedirector != null)
                {
                    string? redirectedReference = activeGameInstance.NativeBotScriptRedirector(filename);
                    if (!string.IsNullOrWhiteSpace(redirectedReference) &&
                        !ModInterpreter.ScriptReferencesMatch(filename, redirectedReference, interpreter.ProgramDir, interpreter.ScriptDirectory))
                    {
                        GlobalModules.DebugLog($"[LOAD] Redirecting native bot module '{filename}' -> '{redirectedReference}'\n");
                        filename = redirectedReference;
                    }
                }

                interpreter.Load(filename, false);
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[LOAD] Failed: {ex.Message}\n");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdUnloadScript_Impl(object script, CmdParam[] parameters)
        {
            // CMD: stop <filename>
            // Stop a running script by filename
            var interpreter = GetActiveInterpreter();
            if (interpreter == null)
            {
                GlobalModules.DebugLog("[STOP] No active interpreter\n");
                return CmdAction.None;
            }

            string filename = parameters[0].Value;
            GlobalModules.DebugLog($"[STOP] Stopping script '{filename}'\n");

            try
            {
                if (TryResolveNativeBotScriptReference(interpreter, filename, out GameInstance? gameInstance, out BotConfig? nativeConfig, out string nativeLeafName) &&
                    IsNativeBotRunning(gameInstance, nativeConfig) &&
                    gameInstance?.NativeBotStopper != null &&
                    nativeConfig != null)
                {
                    GlobalModules.DebugLog($"[STOP] Redirecting '{filename}' to native bot stop '{nativeConfig.Name}'\n");
                    gameInstance.NativeBotStopper(nativeConfig.Name);
                    return CmdAction.None;
                }

                // Find script by filename and stop it
                for (int i = interpreter.Count - 1; i >= 0; i--)
                {
                    var scriptObj = interpreter.GetScript(i);
                    if (ScriptReferenceMatches(interpreter, scriptObj, filename))
                    {
                        if (scriptObj == null)
                            continue;

                        GlobalModules.DebugLog($"[STOP] Found and stopping script at index {i}: '{scriptObj.ScriptName}'\n");
                        interpreter.Stop(i);
                    }
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[STOP] Failed: {ex.Message}\n");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdNativeBot(object script, CmdParam[] parameters)
        {
            string action = parameters[0].Value.Trim().ToUpperInvariant();
            GameInstance? gameInstance = GetActiveGameInstance();
            BotConfig? nativeConfig = FindNativeBotConfig(gameInstance);

            if (gameInstance == null || nativeConfig == null)
            {
                GlobalModules.DebugLog($"[NATIVEBOT] Ignored action '{action}' because no native bot is available.\n");
                return CmdAction.None;
            }

            switch (action)
            {
                case "START":
                    if (IsNativeBotRunning(gameInstance, nativeConfig))
                    {
                        GlobalModules.DebugLog($"[NATIVEBOT] Start ignored; native bot '{nativeConfig.Name}' is already running.\n");
                        return CmdAction.None;
                    }

                    if (gameInstance.NativeBotActivator == null)
                    {
                        GlobalModules.DebugLog($"[NATIVEBOT] Start ignored; no activator is registered for '{nativeConfig.Name}'.\n");
                        return CmdAction.None;
                    }

                    GlobalModules.DebugLog($"[NATIVEBOT] Starting native bot '{nativeConfig.Name}'.\n");
                    gameInstance.NativeBotActivator(nativeConfig, string.Empty);
                    return CmdAction.None;

                case "STOP":
                    if (!IsNativeBotRunning(gameInstance, nativeConfig))
                    {
                        GlobalModules.DebugLog($"[NATIVEBOT] Stop ignored; native bot '{nativeConfig.Name}' is not running.\n");
                        return CmdAction.None;
                    }

                    if (gameInstance.NativeBotStopper == null)
                    {
                        GlobalModules.DebugLog($"[NATIVEBOT] Stop ignored; no stopper is registered for '{nativeConfig.Name}'.\n");
                        return CmdAction.None;
                    }

                    GlobalModules.DebugLog($"[NATIVEBOT] Stopping native bot '{nativeConfig.Name}'.\n");
                    gameInstance.NativeBotStopper(nativeConfig.Name);
                    return CmdAction.None;

                case "REBOOT":
                    if (gameInstance.NativeBotRebooter != null)
                    {
                        GlobalModules.DebugLog($"[NATIVEBOT] Rebooting native bot '{nativeConfig.Name}'.\n");
                        gameInstance.NativeBotRebooter(nativeConfig.Name);
                        return CmdAction.None;
                    }

                    GlobalModules.DebugLog($"[NATIVEBOT] Reboot fallback for '{nativeConfig.Name}'.\n");
                    if (IsNativeBotRunning(gameInstance, nativeConfig))
                        gameInstance.NativeBotStopper?.Invoke(nativeConfig.Name);
                    else
                        gameInstance.NativeBotActivator?.Invoke(nativeConfig, string.Empty);
                    return CmdAction.None;

                default:
                    throw new ScriptException("NATIVEBOT action must be START, STOP, or REBOOT");
            }
        }

        private static CmdAction CmdIsScriptLoaded_Impl(object script, CmdParam[] parameters)
        {
            // CMD: isscriptloaded var <filename>
            // Check if a script is currently loaded

            if (parameters[0] is VarParam varParam)
            {
                string filename = parameters[1].Value;
                bool loaded = false;

                ModInterpreter? interpreter = GetActiveInterpreter();
                if (interpreter != null)
                {
                    for (int i = 0; i < interpreter.Count; i++)
                    {
                        var scriptObj = interpreter.GetScript(i);
                        if (ScriptReferenceMatches(interpreter, scriptObj, filename))
                        {
                            loaded = true;
                            break;
                        }
                    }

                    if (!loaded &&
                        TryResolveNativeBotScriptReference(interpreter, filename, out GameInstance? gameInstance, out BotConfig? nativeConfig, out _) &&
                        IsNativeBotRunning(gameInstance, nativeConfig))
                    {
                        loaded = true;
                    }
                }

                varParam.Value = loaded ? "1" : "0";
            }

            return CmdAction.None;
        }

        private static CmdAction CmdPauseScript_Impl(object script, CmdParam[] parameters)
        {
            // CMD: pausescript <filename>
            // Pause a running script

            ModInterpreter? interpreter = GetActiveInterpreter();
            if (interpreter == null)
            {
                Console.WriteLine("[Script] PAUSESCRIPT: No active interpreter");
                return CmdAction.None;
            }

            string filename = parameters[0].Value;

            try
            {
                for (int i = 0; i < interpreter.Count; i++)
                {
                    var scriptObj = interpreter.GetScript(i);
                    if (ScriptReferenceMatches(interpreter, scriptObj, filename))
                    {
                        if (scriptObj == null)
                            continue;

                        scriptObj.Pause();
                        Console.WriteLine($"[Script] PAUSESCRIPT: Paused {filename}");
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] PAUSESCRIPT failed: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdResumeScript_Impl(object script, CmdParam[] parameters)
        {
            // CMD: resumescript <filename>
            // Resume a paused script

            ModInterpreter? interpreter = GetActiveInterpreter();
            if (interpreter == null)
            {
                Console.WriteLine("[Script] RESUMESCRIPT: No active interpreter");
                return CmdAction.None;
            }

            string filename = parameters[0].Value;

            try
            {
                for (int i = 0; i < interpreter.Count; i++)
                {
                    var scriptObj = interpreter.GetScript(i);
                    if (ScriptReferenceMatches(interpreter, scriptObj, filename))
                    {
                        if (scriptObj == null)
                            continue;

                        scriptObj.Resume();
                        Console.WriteLine($"[Script] RESUMESCRIPT: Resumed {filename}");
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] RESUMESCRIPT failed: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetLoadedScripts_Impl(object script, CmdParam[] parameters)
        {
            // CMD: getloadedscripts var
            // Get list of all currently loaded scripts

            if (parameters[0] is VarParam varParam)
            {
                var scriptNames = new List<string>();

                ModInterpreter? interpreter = GetActiveInterpreter();
                if (interpreter != null)
                {
                    for (int i = 0; i < interpreter.Count; i++)
                    {
                        var scriptObj = interpreter.GetScript(i);
                        if (scriptObj != null && !string.IsNullOrEmpty(scriptObj.ScriptName))
                        {
                            scriptNames.Add(scriptObj.ScriptName);
                        }
                    }

                    if (TryResolveNativeBotScriptReference(interpreter, "mombot.cts", out GameInstance? gameInstance, out BotConfig? nativeConfig, out string nativeLeafName) &&
                        IsNativeBotRunning(gameInstance, nativeConfig) &&
                        !scriptNames.Any(name => string.Equals(name, nativeLeafName, StringComparison.OrdinalIgnoreCase)))
                    {
                        scriptNames.Add(nativeLeafName);
                    }
                }

                parameters[0].Value = scriptNames.Count.ToString();
                varParam.SetArrayFromStrings(scriptNames);
            }

            return CmdAction.None;
        }

        private static CmdAction CmdStopAllScripts_Impl(object script, CmdParam[] parameters)
        {
            // CMD: stopallscripts
            // Stop all running scripts (except system scripts)

            ModInterpreter? interpreter = GetActiveInterpreter();
            if (interpreter == null)
            {
                Console.WriteLine("[Script] STOPALLSCRIPTS: No active interpreter");
                return CmdAction.None;
            }

            try
            {
                interpreter.StopAll(false); // false = don't stop system scripts
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] STOPALLSCRIPTS failed: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdGetScriptName_Impl(object script, CmdParam[] parameters)
        {
            // CMD: getscriptname var
            // Get the name of the current script

            if (parameters[0] is VarParam varParam)
            {
                if (script is Script scriptObj)
                {
                    varParam.Value = scriptObj.ScriptName ?? string.Empty;
                }
                else
                {
                    varParam.Value = string.Empty;
                }
            }

            return CmdAction.None;
        }

        #endregion

        #region Script Management Helper

        /// <summary>
        /// Set the active script interpreter for script management commands
        /// This should be called when the interpreter is initialized
        /// </summary>
        public static void SetActiveInterpreter(ModInterpreter? interpreter)
        {
            GlobalModules.CurrentContext.ActiveInterpreter = interpreter;
        }

        public static void SetVarOnActiveScripts(string varName, string value)
        {
            ModInterpreter? interpreter = GetActiveInterpreter();
            if (interpreter == null || string.IsNullOrWhiteSpace(varName))
                return;

            for (int i = 0; i < interpreter.Count; i++)
            {
                Script? scriptObj = interpreter.GetScript(i);
                scriptObj?.SetScriptVarIgnoreCase(varName, value);
            }
        }

        #endregion
    }
}
