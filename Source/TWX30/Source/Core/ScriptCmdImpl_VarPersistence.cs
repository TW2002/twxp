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
using System.Text.Json;

namespace TWXProxy.Core
{
    public partial class ScriptRef
    {
        private sealed class GlobalVarEntry
        {
            public string Value { get; set; } = "0";
            public List<string>? Data { get; set; }
        }

        // Global variable storage (shared across all scripts)
        private static readonly Dictionary<string, GlobalVarEntry> _globalVars = new();

        // Program variables (internal proxy settings)
        private static readonly Dictionary<string, string> _progVars = new();

        // Per-game variable storage: loaded from GameConfig.Variables at game start;
        // updated on every savevar call and flushed to disk via OnVariableSaved.
        private static Dictionary<string, string> _currentGameVars =>
            CurrentGameVarsFor(GlobalModules.CurrentContext);

        private static Dictionary<string, string> CurrentGameVarsFor(TwxRuntimeContext? context)
            => (context ?? GlobalModules.CurrentContext).CurrentGameVars;

        /// <summary>
        /// Called whenever savevar persists a value. The delegate (set by
        /// ProxyService) writes the key/value into GameConfig.Variables and
        /// saves the game data file.
        /// </summary>
        public static Action<string, string>? OnVariableSaved
        {
            get => GlobalModules.CurrentContext.OnVariableSaved;
            set => GlobalModules.CurrentContext.OnVariableSaved = value;
        }

        public static Action<string, string>? GetOnVariableSaved(TwxRuntimeContext? context)
            => (context ?? GlobalModules.CurrentContext).OnVariableSaved;

        public static void SetOnVariableSaved(TwxRuntimeContext? context, Action<string, string>? handler)
        {
            (context ?? GlobalModules.CurrentContext).OnVariableSaved = handler;
        }

        public static void InvokeOnVariableSaved(TwxRuntimeContext? context, string name, string value)
        {
            (context ?? GlobalModules.CurrentContext).OnVariableSaved?.Invoke(name, value);
        }

        // Persistence file paths
        private static string _globalVarsPath = "globals.json";
        private static string _progVarsPath = "progvars.json";
        private static string _credentialsPath = Path.Combine(AppContext.BaseDirectory, "credentials.json");

        // Login credentials (username/password/game letter) – persisted separately
        private static readonly Dictionary<string, string> _credentials = new();

        #region Variable Persistence Implementation

        private static CmdAction CmdLoadVar_Impl(object script, CmdParam[] parameters)
        {
            // CMD: loadvar var
            // Pascal-compatible behavior: load directly from the current game's
            // persistent variable store by exact variable name.
            if (parameters[0] is VarParam varParam)
            {
                string scriptId = GetScriptId(script);
                string varName = varParam.Name;

                if (TryGetCompatibleVarValue(_currentGameVars, varName, out var gameValue, out var resolvedGameName))
                {
                    varParam.Value = gameValue;
                    GlobalModules.VariablePersistenceDebugLog($"[LOADVAR] scriptId='{scriptId}' var='{varName}' source='game-store' resolved='{resolvedGameName}' value='{gameValue}'\n");
                }
                else
                {
                    GlobalModules.VariablePersistenceDebugLog($"[LOADVAR] scriptId='{scriptId}' var='{varName}' source='miss' value='{varParam.Value}'\n");
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSaveVar_Impl(object script, CmdParam[] parameters)
        {
            // CMD: savevar var
            // Pascal-compatible behavior: persist into the current game's
            // shared variable store by exact variable name.
            if (parameters[0] is VarParam varParam)
            {
                string scriptId = GetScriptId(script);
                string varName = varParam.Name;
                string value = varParam.Value;

                GlobalModules.VariablePersistenceDebugLog($"[SAVEVAR] scriptId='{scriptId}' var='{varName}' value='{value}'\n");

                // Persist to the per-game data file via ProxyService callback.
                _currentGameVars[varName] = value;
                OnVariableSaved?.Invoke(varName, value);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdLoadGlobal_Impl(object script, CmdParam[] parameters)
        {
            // CMD: loadglobal var
            if (parameters[0] is VarParam varParam &&
                _globalVars.TryGetValue(varParam.Name, out var entry))
            {
                if (entry.Data is { Count: > 0 })
                {
                    varParam.SetArrayFromStrings(entry.Data);
                }
                else
                {
                    varParam.Value = entry.Value;
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSaveGlobal_Impl(object script, CmdParam[] parameters)
        {
            // CMD: saveglobal var
            if (parameters[0] is VarParam varParam)
            {
                if (varParam.ArraySize > 0)
                {
                    var data = new List<string>(varParam.ArraySize);
                    for (int i = 1; i <= varParam.ArraySize; i++)
                    {
                        data.Add(varParam.GetIndexVar(new[] { i.ToString() }).Value);
                    }

                    _globalVars[varParam.Name] = new GlobalVarEntry
                    {
                        Value = string.Empty,
                        Data = data
                    };
                }
                else
                {
                    _globalVars[varParam.Name] = new GlobalVarEntry
                    {
                        Value = varParam.Value,
                        Data = null
                    };
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdClearGlobals_Impl(object script, CmdParam[] parameters)
        {
            // CMD: clearglobals
            // Clear all global variables
            _globalVars.Clear();
            return CmdAction.None;
        }

        private static CmdAction CmdListGlobals_Impl(object script, CmdParam[] parameters)
        {
            // CMD: listglobals varNames varValues
            if (parameters[0] is VarParam namesVar && parameters[1] is VarParam valuesVar)
            {
                var names = _globalVars.Keys.ToList();
                var values = _globalVars.Values.Select(v => v.Data is { Count: > 0 } ? string.Empty : v.Value).ToList();

                namesVar.Value = names.Count.ToString();
                namesVar.SetArrayFromStrings(names);
                valuesVar.Value = values.Count.ToString();
                valuesVar.SetArrayFromStrings(values);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSetProgVar_Impl(object script, CmdParam[] parameters)
        {
            // CMD: setprogvar <name> <value>
            // Set program variable (internal proxy settings)
            string name = parameters[0].Value;
            string value = parameters[1].Value;

            GlobalModules.DebugLog($"[SETPROGVAR] '{name}' = '{value}'\n");
            _progVars[name] = value;
            return CmdAction.None;
        }

        private static string GetScriptId(object script)
        {
            // Extract script identifier from Script object
            if (script is Script scriptObj)
            {
                return scriptObj.PersistenceId ?? scriptObj.ScriptName ?? script.GetHashCode().ToString();
            }
            return script.GetHashCode().ToString();
        }

        private static bool TryGetCompatibleVarValue(Dictionary<string, string> vars, string varName, out string value, out string resolvedName)
        {
            if (vars.TryGetValue(varName, out value!))
            {
                resolvedName = varName;
                return true;
            }

            string? fallbackName = GetCompatibleFallbackVarName(varName);
            if (!string.IsNullOrEmpty(fallbackName) && vars.TryGetValue(fallbackName, out value!))
            {
                resolvedName = fallbackName;
                return true;
            }

            resolvedName = varName;
            value = string.Empty;
            return false;
        }

        private static string? GetCompatibleFallbackVarName(string varName)
        {
            if (string.IsNullOrWhiteSpace(varName))
                return null;

            int prefixLength = (varName[0] == '$' || varName[0] == '%') ? 1 : 0;
            int separatorIndex = varName.LastIndexOf('~');
            if (separatorIndex <= prefixLength || separatorIndex >= varName.Length - 1)
                return null;

            string prefix = prefixLength == 1 ? varName.Substring(0, 1) : string.Empty;
            string suffix = varName[(separatorIndex + 1)..];
            return prefix + suffix;
        }

        private static bool MatchesPattern(string text, string pattern)
        {
            // Simple wildcard matching (* and ?)
            if (pattern == "*") return true;

            var regexPattern = "^" + System.Text.RegularExpressions.Regex.Escape(pattern)
                .Replace("\\*", ".*")
                .Replace("\\?", ".") + "$";

            return System.Text.RegularExpressions.Regex.IsMatch(text, regexPattern,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        /// <summary>
        /// Get a program variable value by name
        /// </summary>
        public static string GetProgVar(string name)
        {
            if (_progVars.TryGetValue(name, out var value))
                return value;
            return "0"; // Match Pascal TCmdParam.Create default of '0'
        }

        /// <summary>
        /// Set a program variable value by name
        /// </summary>
        public static void SetProgVar(string name, string value)
        {
            _progVars[name] = value;
        }

        /// <summary>
        /// Load a game's persisted variables into the current-game cache.
        /// Call this when a game starts so loadvar can retrieve previously saved values.
        /// </summary>
        public static void LoadVarsForGame(Dictionary<string, string> variables)
        {
            _currentGameVars.Clear();
            foreach (var kvp in variables)
                _currentGameVars[kvp.Key] = kvp.Value;
        }

        public static void LoadVarsForGame(TwxRuntimeContext? context, Dictionary<string, string> variables)
        {
            var vars = CurrentGameVarsFor(context);
            vars.Clear();
            foreach (var kvp in variables)
                vars[kvp.Key] = kvp.Value;
        }

        /// <summary>
        /// Clear the current game's shared savevar/loadvar cache without
        /// touching persisted globals or program variables.
        /// </summary>
        public static void ClearCurrentGameVars()
        {
            _currentGameVars.Clear();
        }

        public static void ClearCurrentGameVars(TwxRuntimeContext? context)
        {
            CurrentGameVarsFor(context).Clear();
        }

        /// <summary>
        /// Inject or override a value in the current game's in-memory loadvar cache
        /// without persisting it to disk.
        /// </summary>
        public static void SetCurrentGameVar(string name, string value)
        {
            if (string.IsNullOrWhiteSpace(name))
                return;

            _currentGameVars[name] = value;
        }

        public static void SetCurrentGameVar(TwxRuntimeContext? context, string name, string value)
        {
            if (string.IsNullOrWhiteSpace(name))
                return;

            CurrentGameVarsFor(context)[name] = value;
        }

        /// <summary>
        /// Read the current game's shared savevar/loadvar value without going through a script.
        /// </summary>
        public static string GetCurrentGameVar(string name, string defaultValue = "")
        {
            if (string.IsNullOrWhiteSpace(name))
                return defaultValue;

            if (TryGetCompatibleVarValue(_currentGameVars, name, out string value, out _))
                return value;

            return defaultValue;
        }

        public static string GetCurrentGameVar(TwxRuntimeContext? context, string name, string defaultValue = "")
        {
            if (string.IsNullOrWhiteSpace(name))
                return defaultValue;

            if (TryGetCompatibleVarValue(CurrentGameVarsFor(context), name, out string value, out _))
                return value;

            return defaultValue;
        }

        /// <summary>
        /// Inject or override a global variable value in the shared loadglobal/saveglobal store.
        /// Used by non-script subsystems that need to publish script-visible global state.
        /// </summary>
        public static void SetGlobalVar(string name, string value)
        {
            if (string.IsNullOrWhiteSpace(name))
                return;

            _globalVars[name] = new GlobalVarEntry
            {
                Value = value ?? string.Empty,
                Data = null
            };
        }

        /// <summary>
        /// Remove the in-memory variable cache for a single script.
        /// Call this whenever a script is stopped or killed so its vars don't
        /// bleed across into a fresh run of the same (or another) script.
        /// </summary>
        public static void ClearVarsForScript(string scriptId)
        {
            // Pascal loadvar/savevar state is shared per game, not per script.
            GlobalModules.DebugLog($"[VARCACHE] ClearVarsForScript scriptId='{scriptId}' skipped='per-game'\n");
        }

        /// <summary>
        /// Remove the in-memory variable cache for all scripts.
        /// Call this when the proxy itself is stopped so no stale vars survive
        /// into the next session.
        /// </summary>
        public static void ClearAllScriptVars()
        {
            // No per-script loadvar/savevar cache in Pascal-compatible mode.
        }

        #endregion

        #region Persistence File Management

        /// <summary>
        /// Set the directory path where variable files are stored
        /// </summary>
        public static void SetPersistencePath(string path)
        {
            _globalVarsPath = Path.Combine(path, "globals.json");
            _progVarsPath = Path.Combine(path, "progvars.json");
            _credentialsPath = Path.Combine(path, "credentials.json");
        }

        /// <summary>
        /// Track a login credential (username, password, or game letter) and persist to disk.
        /// </summary>
        public static void TrackCredential(string name, string value)
        {
            _credentials[name] = value;
            SaveCredentialsFile();
        }

        /// <summary>
        /// Get a tracked login credential value.
        /// </summary>
        public static string GetCredential(string name)
        {
            return _credentials.TryGetValue(name, out var val) ? val : string.Empty;
        }

        /// <summary>
        /// Save credentials to disk.
        /// </summary>
        public static void SaveCredentialsFile()
        {
            try
            {
                var dir = Path.GetDirectoryName(_credentialsPath);
                if (!string.IsNullOrEmpty(dir))
                    Directory.CreateDirectory(dir);
                var json = JsonSerializer.Serialize(_credentials, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_credentialsPath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VarPersistence] Error saving credentials: {ex.Message}");
            }
        }

        /// <summary>
        /// Load credentials from disk.
        /// </summary>
        public static void LoadCredentialsFile()
        {
            try
            {
                if (File.Exists(_credentialsPath))
                {
                    var json = File.ReadAllText(_credentialsPath);
                    var loaded = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                    if (loaded != null)
                    {
                        _credentials.Clear();
                        foreach (var kvp in loaded)
                            _credentials[kvp.Key] = kvp.Value;
                        Console.WriteLine($"[VarPersistence] Loaded {_credentials.Count} credentials from {_credentialsPath}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VarPersistence] Error loading credentials: {ex.Message}");
            }
        }

        /// <summary>
        /// Load all persisted variables from disk
        /// </summary>
        public static void LoadPersistedVariables()
        {
            try
            {
                // Load global variables
                if (File.Exists(_globalVarsPath))
                {
                    var json = File.ReadAllText(_globalVarsPath);
                    var loaded = JsonSerializer.Deserialize<Dictionary<string, GlobalVarEntry>>(json);
                    if (loaded != null)
                    {
                        _globalVars.Clear();
                        foreach (var kvp in loaded)
                        {
                            _globalVars[kvp.Key] = kvp.Value;
                        }
                    }
                }

                // Load program variables
                if (File.Exists(_progVarsPath))
                {
                    var json = File.ReadAllText(_progVarsPath);
                    var loaded = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                    if (loaded != null)
                    {
                        _progVars.Clear();
                        foreach (var kvp in loaded)
                        {
                            _progVars[kvp.Key] = kvp.Value;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VarPersistence] Error loading variables: {ex.Message}");
            }
        }

        /// <summary>
        /// Save all persisted variables to disk
        /// </summary>
        public static void SavePersistedVariables()
        {
            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true };

                // Save global variables
                var globalJson = JsonSerializer.Serialize(_globalVars, options);
                File.WriteAllText(_globalVarsPath, globalJson);

                // Save program variables
                var progJson = JsonSerializer.Serialize(_progVars, options);
                File.WriteAllText(_progVarsPath, progJson);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VarPersistence] Error saving variables: {ex.Message}");
            }
        }

        #endregion
    }
}
