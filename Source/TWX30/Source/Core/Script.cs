/*
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
*/

// This unit controls scripts

/*
***************** Notes:

Standard compiled command specification:
  ScriptID:Byte|LineNumber:Word|CmdID:Word|Params|0:Byte

  'Params' is a series of command parameters specified as:
  Type:Byte|Value

  'Type:Byte' can be one of the following:
    - PARAM_VAR : User variable prefix (see below)
    - PARAM_CONST : Compiler string constant prefix
    - PARAM_SYSCONST : Read only system value
    - PARAM_PROGVAR : Program variable
    - PARAM_CHAR : Character code

  'Value' can be one of the following:
    - A 16-bit listed system constant reference (from TModInterpreter.SysConsts[]) type PARAM_SYSCONST
    - A 32-bit listed variable/constant reference (from TScript.Params[]) type PARAM_CONCAT
    - A 32-bit global-listed program variable reference type PARAM_VAR/PARAM_CONST
    - An 8-bit character code type PARAM_CHAR

  If 'Type:Byte' is equal to PARAM_VAR or PARAM_SYSCONST, the full parameter is instead
  specified as:
  PARAM_VAR:Byte|Ref:Word/Integer|IndexCount:Byte

  The IndexCount is the number of values the variable or sysconst has been indexed by.  These
  values are specified using the above methods and can therefore be indexed in the
  same way.  Any variable not indexed must have an IndexCount of zero.

  I.e. compiled indexed variable:

  PARAM_VAR:Byte|VarRef:Integer|1:Byte|PARAM_CONST:Byte|ConstRef:Integer
*/

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using Timer = System.Timers.Timer;

namespace TWXProxy.Core
{
    #region Trigger Types and Classes

    public enum TriggerType
    {
        Text,
        TextLine,
        TextOut,
        Delay,
        Event,
        TextAuto
    }

    public enum PauseReason
    {
        None,
        Command,      // From script 'pause' command - wait for trigger/event
        OpenMenu,     // From OPENMENU - menu handler can unpause
        Input,        // From GETINPUT - wait for user input
        Auth          // From authentication - wait for auth complete
    }

    public class DelayTimer : Timer
    {
        public Trigger? DelayTrigger { get; set; }
    }

    public class Trigger
    {
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string LabelName { get; set; } = string.Empty;
        public string Response { get; set; } = string.Empty;
        public string Param { get; set; } = string.Empty;
        public int LifeCycle { get; set; }
        public DelayTimer? Timer { get; set; }
        public bool IsCancelled { get; set; }
    }

    internal static class ScriptDiagnosticOutput
    {
        public static void Write(string message)
        {
            GlobalModules.TWXServer?.BroadcastLiteral(message);
        }

        public static void Write(ITWXServer? server, string message)
        {
            server?.BroadcastLiteral(message);
        }
    }

    #endregion

    #region ModInterpreter - Script Manager

    /// <summary>
    /// TModInterpreter: Encapsulation for all script interpretation within the program.
    /// </summary>
    public class ModInterpreter : TWXModule, ITWXGlobals, IObserver
    {
        private List<Script> _scriptList;
        private object? _scriptMenu;
        private ScriptRef? _scriptRef;
        private List<string> _autoRun;
        private Timer _tmrTime;
        private int _timerEventCount;
        private readonly object _scriptEventLock = new();
        private readonly Queue<Action> _pendingScriptEvents = new();
        private bool _processingScriptEvent;
        private string _lastScript = string.Empty;
        private string _activeBot = string.Empty;
        private string _activeBotScript = string.Empty;
        private string _activeBotNameVar = string.Empty;
        private string _activeCommsVar = string.Empty;
        private string _activeLoginScript = string.Empty;
        private string _activeBotTag = string.Empty;
        private readonly HashSet<string> _activeBotThemeKeys = new(StringComparer.Ordinal);
        private readonly HashSet<Script> _menuInterruptedScripts = new();
#pragma warning disable CS0649 // Field is never assigned to
        private int _activeBotTagLength;
#pragma warning restore CS0649
        private string _programDir = string.Empty;
        private string _scriptDirectory = string.Empty;

        public TwxRuntimeContext RuntimeContext { get; set; } = GlobalModules.CurrentContext;

        public ModInterpreter(IPersistenceController? persistenceController = null)
            : base(persistenceController)
        {
            _scriptList = new List<Script>();
            _autoRun = new List<string>();
            _tmrTime = new Timer(1000);
            _tmrTime.Elapsed += OnTimerElapsed;
            _tmrTime.Enabled = false;
            _scriptRef = new ScriptRef();
        }

        public override void Dispose()
        {
            StopAll(true);
            _scriptList.Clear();
            _tmrTime?.Dispose();
            base.Dispose();
        }

        public override void StateValuesLoaded()
        {
            // This is called when all modules have been fully initialised
            // Load up our auto run scripts
            foreach (var script in _autoRun)
            {
                Load(script, false);
            }
        }

        private void OnTimerElapsed(object? sender, ElapsedEventArgs e)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ProgramEvent("Time hit", ScriptTimeFormatter.Format(DateTime.Now), true);
        }

        public void CountTimerEvent()
        {
            _timerEventCount++;
            _tmrTime.Enabled = true;
        }

        public void UnCountTimerEvent()
        {
            _timerEventCount--;
            System.Diagnostics.Debug.Assert(_timerEventCount >= 0, "Timer uncount without count");

            if (_timerEventCount <= 0)
                _tmrTime.Enabled = false;
        }

        /// <summary>
        /// Normalises path separators (Windows '\' → OS separator) then walks each
        /// directory component with a case-insensitive search so scripts written for
        /// Windows work unchanged on macOS/Linux.  Returns the best-matching path it
        /// can find; if nothing matches the normalised path is returned as-is so the
        /// caller gets a meaningful FileNotFoundException.
        /// </summary>
        private static string ResolveFilePath(string filename, string baseDir)
        {
            // Normalise all backslashes to the OS separator
            filename = filename.Replace('\\', Path.DirectorySeparatorChar);

            // If already absolute and exists, we're done
            if (Path.IsPathRooted(filename) && File.Exists(filename))
                return filename;

            // Make absolute relative to baseDir when not rooted
            string candidate = Path.IsPathRooted(filename)
                ? filename
                : Path.Combine(baseDir, filename);

            if (File.Exists(candidate))
                return candidate;

            // Case-insensitive walk: resolve each path segment independently
            string[] parts = candidate.Replace('/', Path.DirectorySeparatorChar)
                                       .Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries);

            // Reconstruct from the root
            string current = Path.IsPathRooted(candidate)
                ? candidate.Substring(0, candidate.IndexOf(parts[0], StringComparison.Ordinal))
                : string.Empty;
            if (string.IsNullOrEmpty(current)) current = Path.GetPathRoot(candidate) ?? string.Empty;

            foreach (string part in parts)
            {
                if (!Directory.Exists(current))
                    return candidate; // can't traverse further, give up

                // Find a child (file or directory) matching this segment case-insensitively
                string? match = Directory.EnumerateFileSystemEntries(current)
                    .FirstOrDefault(e => string.Equals(Path.GetFileName(e), part, StringComparison.OrdinalIgnoreCase));

                current = match ?? Path.Combine(current, part);
            }

            return current;
        }

        private static bool IsScriptsRootRelativePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return false;

            string normalized = Utility.NormalizePathSeparators(path.Trim());
            string[] parts = normalized.Split(
                new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                StringSplitOptions.RemoveEmptyEntries);

            return parts.Length > 0 &&
                   parts[0].Equals("scripts", StringComparison.OrdinalIgnoreCase);
        }

        private static string ResolveRelativeScriptReference(string filename, string baseDir, string? scriptDirectory)
        {
            string normalized = Utility.NormalizePathSeparators(filename.Trim());
            if (Path.IsPathRooted(normalized))
                return normalized;

            if (IsScriptsRootRelativePath(normalized))
            {
                string[] parts = normalized.Split(
                    new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                    StringSplitOptions.RemoveEmptyEntries);

                string scriptsRoot = !string.IsNullOrWhiteSpace(scriptDirectory)
                    ? scriptDirectory
                    : (Path.GetFileName(baseDir).Equals("scripts", StringComparison.OrdinalIgnoreCase)
                        ? baseDir
                        : Path.Combine(baseDir, "scripts"));

                if (parts.Length == 1)
                    return scriptsRoot;

                return Path.Combine(new[] { scriptsRoot }.Concat(parts.Skip(1)).ToArray());
            }

            string root = !string.IsNullOrWhiteSpace(scriptDirectory)
                ? scriptDirectory
                : baseDir;

            return Path.Combine(root, normalized);
        }

        internal static string NormalizeScriptReference(string filename, string baseDir, string? scriptDirectory = null)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return string.Empty;

            string normalized = Utility.NormalizePathSeparators(filename.Trim());
            if (!Path.IsPathRooted(normalized))
                normalized = ResolveRelativeScriptReference(normalized, baseDir, scriptDirectory);

            try
            {
                normalized = Path.GetFullPath(normalized);
            }
            catch
            {
                // Keep the normalized value if GetFullPath rejects the input.
            }

            return normalized;
        }

        internal static string GetScriptReferenceLeaf(string filename)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return string.Empty;

            return Path.GetFileName(Utility.NormalizePathSeparators(filename.Trim()));
        }

        internal static bool ScriptReferencesMatch(string? left, string? right, string baseDir, string? scriptDirectory = null)
        {
            if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
                return false;

            string leftFull = NormalizeScriptReference(left, baseDir, scriptDirectory);
            string rightFull = NormalizeScriptReference(right, baseDir, scriptDirectory);
            if (leftFull.Equals(rightFull, StringComparison.OrdinalIgnoreCase))
                return true;

            string leftLeaf = GetScriptReferenceLeaf(left);
            string rightLeaf = GetScriptReferenceLeaf(right);
            return !string.IsNullOrEmpty(leftLeaf) &&
                   leftLeaf.Equals(rightLeaf, StringComparison.OrdinalIgnoreCase);
        }

        public void Load(string filename, bool silent)
        {
            LoadInternal(filename, silent, null, null);
        }

        public void LoadAtLabel(string filename, bool silent, string entryLabel)
        {
            LoadInternal(filename, silent, entryLabel, null);
        }

        public void LoadAtLabel(string filename, bool silent, string entryLabel, Action<Script>? beforeExecute)
        {
            LoadInternal(filename, silent, entryLabel, beforeExecute);
        }

        public void LoadAtSubroutine(string filename, bool silent, string entryLabel, Action<Script>? beforeExecute)
        {
            LoadInternal(
                filename,
                silent,
                null,
                script =>
                {
                    beforeExecute?.Invoke(script);
                    script.GosubFromMenu(entryLabel);
                });
        }

        private void LoadInternal(string filename, bool silent, string? entryLabel, Action<Script>? beforeExecute)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            GlobalModules.DebugLog($"[ModInterpreter.Load] Starting load of '{filename}', silent={silent}\n");
            string eventScriptName = filename;

            // Normalise separators and resolve case-insensitively so scripts written
            // on Windows (with backslashes and arbitrary casing) work on macOS/Linux.
            filename = ResolveFilePath(NormalizeScriptReference(filename, _programDir, _scriptDirectory), _programDir);
            if (string.IsNullOrWhiteSpace(_scriptDirectory) || !Directory.Exists(_scriptDirectory))
                _scriptDirectory = ResolveScriptRoot(filename, _scriptDirectory);

            // MB - Stop script if it is already running
            int i = 0;
            while (i < Count)
            {
                var runningScript = _scriptList[i];
                string runningScriptName = runningScript.LoadEventName ?? runningScript.Compiler?.ScriptFile ?? runningScript.ScriptName;
                if (ScriptReferencesMatch(runningScriptName, filename, _programDir, _scriptDirectory))
                    Stop(i);
                else
                    i++;
            }

            GlobalModules.DebugLog($"[ModInterpreter.Load] Program dir: {_programDir}\n");
            Directory.SetCurrentDirectory(_programDir);
            var script = new Script(this);
            script.Silent = silent;
            script.LoadEventName = eventScriptName;
            _scriptList.Add(script);

            _lastScript = filename;
            bool error = true;

            // Allow reconnect after manual disconnect when launching a script
            // TWXClient.UserDisconnect = false;

            string extension = Path.GetExtension(filename).ToUpperInvariant();
            GlobalModules.DebugLog($"[ModInterpreter.Load] Extension: '{extension}'\n");

            if (extension == ".CTS" || extension == ".TWX")
            {
                if (!silent)
                {
                    // TWXServer.ClientMessage("Loading script: " + AnsiCodes.ANSI_7 + filename);
                }

                try
                {
                    GlobalModules.DebugLog($"[ModInterpreter.Load] Calling script.GetFromFile for .CTS file\n");
                    script.GetFromFile(filename, false);
                    GlobalModules.DebugLog($"[ModInterpreter.Load] GetFromFile completed successfully\n");
                    error = false;
                }
                catch (Exception ex)
                {
                    GlobalModules.DebugLog($"[ModInterpreter.Load] Loading script failed for '{filename}': {ex}\n");
                    GlobalModules.FlushDebugLog();
                    ScriptDiagnosticOutput.Write($"\r\n[ERROR] Loading script failed: {ex.Message}\r\n");
                    Console.WriteLine($"[ERROR] Loading script failed: {ex.Message}\r\n{ex.StackTrace}");
                    Stop(Count - 1);
                    throw; // Rethrow so caller knows it failed
                }
            }
            else
            {
                if (!silent)
                {
                    // TWXServer.ClientMessage("Loading and compiling script: " + AnsiCodes.ANSI_7 + filename);
                }

                _lastScript = filename;

                try
                {
                    GlobalModules.DebugLog($"[ModInterpreter.Load] Calling script.GetFromFile for .TS file (compile=true)\n");
                    script.GetFromFile(filename, true);
                    GlobalModules.DebugLog($"[ModInterpreter.Load] GetFromFile completed successfully\n");
                    error = false;
                }
                catch (Exception ex)
                {
                    GlobalModules.DebugLog($"[ModInterpreter.Load] Compiling script failed for '{filename}': {ex}\n");
                    GlobalModules.FlushDebugLog();
                    ScriptDiagnosticOutput.Write($"\r\n[ERROR] Compiling script failed: {ex.Message}\r\n");
                    Console.WriteLine($"[ERROR] Compiling script failed: {ex.Message}\r\n{ex.StackTrace}");
                    // TWXServer.Broadcast($"\r\n{AnsiCodes.ANSI_15}Script compilation error: {AnsiCodes.ANSI_7}{ex.Message}\r\n\r\n");
                    Stop(Count - 1);
                }
            }

            GlobalModules.DebugLog($"[ModInterpreter.Load] Error flag: {error}\n");

            if (!error)
            {
                if (!string.IsNullOrWhiteSpace(entryLabel))
                {
                    try
                    {
                        script.GotoLabel(entryLabel);
                    }
                    catch (Exception ex)
                    {
                        GlobalModules.DebugLog(
                            $"[ModInterpreter.Load] Failed to jump to entry label '{entryLabel}' in '{filename}': {ex.Message}\n");
                        Stop(Count - 1);
                        throw new Exception($"Entry label '{entryLabel}' not found in script '{filename}'", ex);
                    }
                }

                beforeExecute?.Invoke(script);

                ProgramEvent("SCRIPT LOADED", eventScriptName, true);
                if (GlobalModules.TWXServer is GameInstance gameServer)
                    gameServer.NotifyScriptLoad();

                // Add menu option for script
                // TWXGUI.AddScriptMenu(script);

                try
                {
                    var server = GlobalModules.TWXServer;
                    GlobalModules.DebugLog($"[DEBUG] About to execute script. TWXServer is {(server == null ? "NULL" : "set")}\n");
                    Console.WriteLine($"[ModInterpreter] Executing script: {filename}, TWXServer={server != null}");

                    // Keep executing the script until it actually pauses or completes
                    // This handles cases where the script returns from Execute() but should continue
                    bool completed = false;
                    int iterations = 0;
                    const int maxIterations = 1000; // Safety limit to prevent infinite loops

                    Console.WriteLine($"[ModInterpreter] Starting execution loop, script.Paused={script.Paused}");
                    GlobalModules.DebugLog($"[DEBUG] Starting execution loop, script.Paused={script.Paused}\n");

                    while (!completed && iterations < maxIterations)
                    {
                        Console.WriteLine($"[ModInterpreter] Loop iteration {iterations + 1}, calling Execute()...");
                        completed = script.Execute();
                        iterations++;

                        Console.WriteLine($"[ModInterpreter] Execute() returned: {completed}, script.Paused={script.Paused}");
                        GlobalModules.DebugLog($"[DEBUG] Iteration {iterations}: completed={completed}, paused={script.Paused}\n");

                        // If script is paused (waiting for input, trigger, etc.), stop looping
                        if (script.Paused)
                        {
                            Console.WriteLine($"[ModInterpreter] Script paused after {iterations} iterations");
                            GlobalModules.DebugLog($"[DEBUG] Script PAUSED after {iterations} iterations\n");
                            break;
                        }

                        // If Execute() returned true (completed), we're done
                        if (completed)
                        {
                            Console.WriteLine($"[ModInterpreter] Script completed after {iterations} iterations");
                            GlobalModules.DebugLog($"[DEBUG] Script COMPLETED after {iterations} iterations\n");
                            break;
                        }

                        // Otherwise, the script has more work to do - continue looping
                        Console.WriteLine($"[ModInterpreter] Script iteration {iterations} - continuing...");
                        GlobalModules.DebugLog($"[DEBUG] Continuing to iteration {iterations + 1}...\n");
                    }

                    if (completed && !script.Paused && _scriptList.Contains(script))
                        StopByHandle(script);

                    if (iterations >= maxIterations)
                    {
                        Console.WriteLine($"[ModInterpreter] WARNING: Script hit max iterations ({maxIterations}) - may be in infinite loop");
                        ScriptDiagnosticOutput.Write(server, $"\r\n[WARNING] Script hit execution limit - check for infinite loops\r\n");
                    }

                    GlobalModules.DebugLog($"[DEBUG] Script execution {(completed ? "completed" : "paused")}.\n");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ModInterpreter] Script execution error: {ex.Message}\r\n{ex.StackTrace}");
                    ScriptDiagnosticOutput.Write($"\r\nScript execution error: {ex.Message}\r\n");
                }
            }
        }

        private static string ResolveScriptRoot(string filename, string currentScriptDirectory)
        {
            if (!string.IsNullOrWhiteSpace(currentScriptDirectory) &&
                Directory.Exists(currentScriptDirectory) &&
                Path.GetFileName(currentScriptDirectory).Equals("scripts", StringComparison.OrdinalIgnoreCase))
            {
                return Path.GetFullPath(currentScriptDirectory);
            }

            string fileDirectory = Path.GetDirectoryName(Path.GetFullPath(filename)) ?? Directory.GetCurrentDirectory();
            string? candidate = fileDirectory;
            string? includeRoot = null;

            while (!string.IsNullOrEmpty(candidate))
            {
                if (Path.GetFileName(candidate).Equals("scripts", StringComparison.OrdinalIgnoreCase))
                {
                    return candidate;
                }

                if (includeRoot is null && Directory.Exists(Path.Combine(candidate, "include")))
                    includeRoot = candidate;

                string? parent = Path.GetDirectoryName(candidate);
                if (string.IsNullOrEmpty(parent) || string.Equals(parent, candidate, StringComparison.Ordinal))
                    break;
                candidate = parent;
            }

            if (includeRoot is not null)
                return includeRoot;

            if (!string.IsNullOrWhiteSpace(currentScriptDirectory) && Directory.Exists(currentScriptDirectory))
                return Path.GetFullPath(currentScriptDirectory);

            return fileDirectory;
        }

        public string ResolveScriptPath(string scriptName)
        {
            if (string.IsNullOrWhiteSpace(scriptName))
                scriptName = "0_Login.cts";

            string fullPath = NormalizeScriptReference(scriptName, _programDir, _scriptDirectory);

            string resolved = ResolveFilePath(fullPath, _programDir);
            if (!string.IsNullOrEmpty(Path.GetExtension(resolved)))
                return resolved;

            string ctsPath = resolved + ".cts";
            if (File.Exists(ctsPath))
                return ctsPath;

            string tsPath = resolved + ".ts";
            if (File.Exists(tsPath))
                return tsPath;

            return ctsPath;
        }

        public void Stop(int index)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            var script = _scriptList[index];
            // Match Pascal: ProgramEvent('SCRIPT STOPPED', Script.Cmp.ScriptFile, TRUE)
            string scriptName = script.LoadEventName ?? script.Compiler?.ScriptFile ?? string.Empty;

            GlobalModules.DebugLog($"[Script.Stop] Stopping script[{index}]='{scriptName}', remaining after={_scriptList.Count - 1}\n");
            GlobalModules.FlushDebugLog();

            // Broadcast termination message
            if (!script.Silent)
            {
                // TWXServer.Broadcast($"\r\n{AnsiCodes.ANSI_15}Script terminated: {AnsiCodes.ANSI_7}{scriptName}\r\n\r\n");
            }

            // Remove stop menu option from interface
            // TWXGUI.RemoveScriptMenu(script);

            // Free the script
            script.Dispose();

            // Remove script from list
            _scriptList.RemoveAt(index);

            GlobalModules.DebugLog($"[Script.Stop] Script removed, _scriptList.Count={_scriptList.Count}, firing ProgramEvent SCRIPT STOPPED\n");
            GlobalModules.FlushDebugLog();

            // Trigger program event
            ProgramEvent("SCRIPT STOPPED", scriptName, true);

            if (GlobalModules.TWXServer is GameInstance gameServer)
                gameServer.NotifyScriptStop();
        }

        public void StopByHandle(Script script)
        {
            int index = _scriptList.IndexOf(script);
            if (index >= 0)
                Stop(index);
        }

        private bool IsScriptStillAtIndex(int index, Script script)
        {
            return index >= 0 &&
                   index < _scriptList.Count &&
                   ReferenceEquals(_scriptList[index], script);
        }

        public void StopAll(bool stopSysScripts)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            // Terminate all scripts
            int i = 0;

            while (i < _scriptList.Count)
            {
                if (stopSysScripts || !_scriptList[i].System)
                    Stop(i);
                else
                    i++;
            }
        }

        public void ForceStopAll(bool stopSysScripts)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            for (int i = _scriptList.Count - 1; i >= 0; i--)
            {
                Script script = _scriptList[i];
                if (!stopSysScripts && script.System)
                    continue;

                script.RequestForceStop();

                if (!script.IsExecuting && IsScriptStillAtIndex(i, script))
                    Stop(i);
            }
        }

        public void ForceStopInterruptible()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            for (int i = _scriptList.Count - 1; i >= 0; i--)
            {
                Script script = _scriptList[i];
                if (script.System && !script.IsBot)
                    continue;

                script.RequestForceStop();

                if (!script.IsExecuting && IsScriptStillAtIndex(i, script))
                    Stop(i);
            }
        }

        public void SwitchBot(string scriptName, string botName, bool stopBotScripts)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ITWXServer? server = GlobalModules.TWXServer;
            if (server == null)
            {
                Console.WriteLine("[SwitchBot] Server not available");
                return;
            }

            string lastBotName = GetActiveBotName();
            BotConfig? botConfig = !string.IsNullOrWhiteSpace(scriptName)
                ? server.GetBotConfig(scriptName)
                : null;
            string requestedBotName = botName;

            if (botConfig == null && string.IsNullOrWhiteSpace(scriptName) && !string.IsNullOrWhiteSpace(botName))
            {
                BotConfig? namedConfig = server.GetBotConfig(botName);
                if (namedConfig != null)
                {
                    botConfig = namedConfig;
                    requestedBotName = string.Empty;
                }
            }

            botConfig ??= ResolveNextBotConfig(server);
            if (botConfig == null)
            {
                Console.WriteLine("[SwitchBot] No bot configurations are available");
                return;
            }

            if (stopBotScripts &&
                server is GameInstance stopGameInstance &&
                !string.IsNullOrWhiteSpace(server.ActiveBotName))
            {
                BotConfig? activeConfig = server.GetBotConfig(server.ActiveBotName);
                if (ProxyMenuCatalog.IsNativeBotConfig(activeConfig))
                    stopGameInstance.NativeBotStopper?.Invoke(activeConfig?.Name ?? server.ActiveBotName);
            }

            if (stopBotScripts)
            {
                for (int index = _scriptList.Count - 1; index >= 0; index--)
                {
                    if (_scriptList[index].IsBot)
                        Stop(index);
                }
            }

            ActivateBotContext(botConfig, requestedBotName, lastBotName);

            if (ProxyMenuCatalog.IsNativeBotConfig(botConfig))
            {
                if (server is not GameInstance gameInstance || gameInstance.NativeBotActivator == null)
                {
                    ClearActiveBotContext(botConfig.Name);
                    Console.WriteLine($"[SwitchBot] Native bot '{botConfig.Name}' is not available in this host");
                    return;
                }

                if (!gameInstance.NativeBotActivator(botConfig, requestedBotName))
                {
                    ClearActiveBotContext(botConfig.Name);
                    Console.WriteLine($"[SwitchBot] Failed to start native bot '{botConfig.Name}'");
                }
                else
                {
                    Console.WriteLine($"[SwitchBot] Switched to native bot '{botConfig.Name}'");
                }

                return;
            }

            foreach (string scriptFile in GetBotScripts(botConfig))
                StartBot(botConfig.Name, scriptFile);

            Console.WriteLine($"[SwitchBot] Switched to bot '{botConfig.Name}' with script '{_activeBotScript}'");
        }

        public void ActivateBotContext(BotConfig botConfig, string requestedBotName = "", string? lastBotName = null)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            string previousBotName = lastBotName ?? GetActiveBotName();

            _activeBot = botConfig.Name;
            _activeBotScript = string.Join(",", GetBotScripts(botConfig));
            _activeBotNameVar = botConfig.NameVar ?? string.Empty;
            _activeCommsVar = botConfig.CommsVar ?? string.Empty;
            _activeLoginScript = botConfig.LoginScript ?? string.Empty;

            ApplyBotTheme(botConfig);

            if (string.IsNullOrWhiteSpace(requestedBotName))
            {
                string currentBotName = GetActiveBotName();
                if ((string.IsNullOrWhiteSpace(currentBotName) || currentBotName == "0") &&
                    !string.IsNullOrWhiteSpace(previousBotName) &&
                    previousBotName != "0")
                {
                    requestedBotName = previousBotName;
                }
            }

            if (!string.IsNullOrWhiteSpace(requestedBotName))
                PersistActiveBotName(requestedBotName);

            if (GlobalModules.TWXServer != null)
                GlobalModules.TWXServer.ActiveBotName = botConfig.Name;
        }

        public void ClearActiveBotContext(string? botName = null)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (!string.IsNullOrWhiteSpace(botName) &&
                !string.Equals(_activeBot, botName, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(GetActiveBotName(), botName, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            ClearBotTheme();
            _activeBot = string.Empty;
            _activeBotScript = string.Empty;
            _activeBotNameVar = string.Empty;
            _activeCommsVar = string.Empty;
            _activeLoginScript = string.Empty;

            if (GlobalModules.TWXServer != null &&
                (string.IsNullOrWhiteSpace(botName) ||
                 string.Equals(GlobalModules.TWXServer.ActiveBotName, botName, StringComparison.OrdinalIgnoreCase)))
            {
                GlobalModules.TWXServer.ActiveBotName = string.Empty;
            }
        }

        public void StartBot(string botName, string scriptFile)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            if (string.IsNullOrWhiteSpace(scriptFile))
            {
                Console.WriteLine($"[StartBot] Error: No script file specified for bot '{botName}'");
                return;
            }

            string resolvedScriptPath = ResolveScriptPath(scriptFile);
            var existingBot = FindBotScript(botName, resolvedScriptPath);
            if (existingBot != null)
                return;

            Directory.SetCurrentDirectory(_programDir);
            var script = new Script(this)
            {
                System = true,
                Silent = true,
                IsBot = true,
                BotName = botName,
            };
            _scriptList.Add(script);

            try
            {
                string extension = Path.GetExtension(resolvedScriptPath).ToUpperInvariant();
                bool compile = extension == ".TS";
                script.GetFromFile(resolvedScriptPath, compile);
                script.Execute();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[StartBot] Error loading bot '{botName}': {ex.Message}");
                _scriptList.Remove(script);
                script.Dispose();
            }
        }

        public void StopBot(string botName)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ITWXServer? server = GlobalModules.TWXServer;
            BotConfig? botConfig = server?.GetBotConfig(botName);
            string resolvedBotName = botConfig?.Name ?? botName;
            bool stoppedAny = false;

            if (ProxyMenuCatalog.IsNativeBotConfig(botConfig) &&
                server is GameInstance gameInstance &&
                gameInstance.NativeBotStopper != null)
            {
                stoppedAny = gameInstance.NativeBotStopper(resolvedBotName);
            }

            for (int index = _scriptList.Count - 1; index >= 0; index--)
            {
                if (_scriptList[index].IsBot &&
                    _scriptList[index].BotName.Equals(resolvedBotName, StringComparison.OrdinalIgnoreCase))
                {
                    Stop(index);
                    stoppedAny = true;
                }
            }

            if (stoppedAny)
                ClearActiveBotContext(resolvedBotName);

            if (!stoppedAny)
                Console.WriteLine($"[StopBot] Bot '{resolvedBotName}' not found");
        }

        public Script? FindBot(string botName)
        {
            return _scriptList.FirstOrDefault(s => s.IsBot && s.BotName.Equals(botName, StringComparison.OrdinalIgnoreCase));
        }

        private Script? FindBotScript(string botName, string scriptFile)
        {
            return _scriptList.FirstOrDefault(script =>
                script.IsBot &&
                script.BotName.Equals(botName, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(
                    Path.GetFullPath(script.Compiler?.ScriptFile ?? string.Empty),
                    Path.GetFullPath(scriptFile),
                    StringComparison.OrdinalIgnoreCase));
        }

        public Script? GetActiveBot()
        {
            return !string.IsNullOrEmpty(_activeBot) ? FindBot(_activeBot) : null;
        }

        public void StartAllBots()
        {
            ITWXServer? server = GlobalModules.TWXServer;
            if (server == null)
                return;

            foreach (string botName in server.GetBotList())
            {
                BotConfig? botConfig = server.GetBotConfig(botName);
                if (botConfig?.AutoStart != true)
                    continue;

                if (ProxyMenuCatalog.IsNativeBotConfig(botConfig))
                {
                    if (server is GameInstance gameInstance && gameInstance.NativeBotActivator != null)
                        gameInstance.NativeBotActivator(botConfig, string.Empty);
                    continue;
                }

                foreach (string scriptFile in GetBotScripts(botConfig))
                    StartBot(botConfig.Name, scriptFile);
            }
        }

        private BotConfig? ResolveNextBotConfig(ITWXServer server)
        {
            List<string> botNames = server.GetBotList();
            if (botNames.Count == 0)
                return null;

            if (string.IsNullOrWhiteSpace(_activeBotScript))
                return server.GetBotConfig(botNames[0]);

            for (int index = 0; index < botNames.Count; index++)
            {
                BotConfig? candidate = server.GetBotConfig(botNames[index]);
                if (candidate == null)
                    continue;

                if (!BotMatchesActiveScript(candidate))
                    continue;

                int nextIndex = index < botNames.Count - 1 ? index + 1 : 0;
                return server.GetBotConfig(botNames[nextIndex]);
            }

            return server.GetBotConfig(botNames[0]);
        }

        private static IReadOnlyList<string> GetBotScripts(BotConfig config)
        {
            if (config.ScriptFiles.Count > 0)
                return config.ScriptFiles;

            if (!string.IsNullOrWhiteSpace(config.ScriptFile))
                return new[] { config.ScriptFile };

            return Array.Empty<string>();
        }

        private bool BotMatchesActiveScript(BotConfig config)
        {
            string activeScript = _activeBotScript ?? string.Empty;
            if (string.IsNullOrWhiteSpace(activeScript))
                return false;

            foreach (string script in GetBotScripts(config))
            {
                if (!string.IsNullOrWhiteSpace(script) &&
                    activeScript.Contains(script, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        private void ApplyBotTheme(BotConfig config)
        {
            ClearBotTheme();

            if (string.IsNullOrWhiteSpace(config.Theme) || GlobalModules.TWXServer == null)
                return;

            string[] parts = config.Theme.Split('|', StringSplitOptions.None);
            if (parts.Length <= 1)
                return;

            _activeBotTagLength = int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out int tagLength)
                ? tagLength
                : 0;
            _activeBotTag = parts[1];

            for (int index = 2; index < parts.Length; index++)
            {
                string key = "~" + (index - 1).ToString(CultureInfo.InvariantCulture);
                GlobalModules.TWXServer.AddQuickText(key, parts[index]);
                _activeBotThemeKeys.Add(key);
            }
        }

        private void ClearBotTheme()
        {
            ITWXServer? server = GlobalModules.TWXServer;
            if (server != null)
            {
                foreach (string key in _activeBotThemeKeys)
                    server.ClearQuickText(key);
            }

            _activeBotThemeKeys.Clear();
            _activeBotTag = string.Empty;
            _activeBotTagLength = 0;
        }

        public List<Script> GetRunningBots()
        {
            // Get all currently running bot scripts
            return _scriptList.Where(s => s.IsBot).ToList();
        }

        public bool HasInterruptibleScripts()
        {
            return _scriptList.Any(static s => !s.System || s.IsBot);
        }

        public bool IsAnyScriptWaitingForInput()
        {
            // Check if any script is waiting for user input (GETINPUT)
            return _scriptList.Any(s => s.WaitingForInput);
        }

        public void PauseForMenuInterrupt()
        {
            _menuInterruptedScripts.Clear();

            foreach (Script script in _scriptList)
            {
                if ((script.System && !script.IsBot) || script.Paused)
                    continue;

                script.Pause();
                _menuInterruptedScripts.Add(script);
            }
        }

        public void ResumeAfterMenuInterrupt()
        {
            if (_menuInterruptedScripts.Count == 0)
                return;

            foreach (Script script in _menuInterruptedScripts.ToArray())
            {
                if (_scriptList.Contains(script) && script.Paused)
                    script.Resume();
            }

            _menuInterruptedScripts.Clear();
        }

        public void ProgramEvent(string eventName, string matchText, bool exclusive)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            // Trigger all matching program events in active scripts
            eventName = eventName.ToUpperInvariant();
            int i = 0;

            while (i < _scriptList.Count)
            {
                Script script = _scriptList[i];
                bool completed = script.ProgramEvent(eventName, matchText, exclusive);

                if (completed)
                {
                    StopByHandle(script);
                }
                else if (IsScriptStillAtIndex(i, script))
                {
                    i++;
                }
            }
        }

        public void HandleConnectionAccepted()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            ModDatabase? db = ScriptRef.GetActiveDatabase();
            DataHeader? header = db?.DBHeader;
            GlobalModules.DebugLog($"[ModInterpreter.HandleConnectionAccepted] useLogin={header?.UseLogin}, loginScript='{header?.LoginScript}', activeDb={(db != null ? db.DatabaseName : "<none>")}\n");

            ProgramEvent("Connection accepted", string.Empty, false);

            if (header == null || !header.UseLogin)
                return;

            string configuredScript = string.IsNullOrWhiteSpace(header.LoginScript)
                ? "0_Login.cts"
                : header.LoginScript;
            bool defaultLoginScript =
                configuredScript.IndexOf("0_", StringComparison.OrdinalIgnoreCase) >= 0 ||
                configuredScript.IndexOf("0_login", StringComparison.OrdinalIgnoreCase) >= 0;

            if (ActiveLoginDisabled)
            {
                GlobalModules.DebugLog("[ModInterpreter.HandleConnectionAccepted] Active login script disabled; skipping login script load\n");
                return;
            }

            string loginScript = !defaultLoginScript && !string.IsNullOrWhiteSpace(ActiveLoginScript)
                ? ActiveLoginScript
                : configuredScript;

            try
            {
                StopAll(false);
                GlobalModules.DebugLog($"[ModInterpreter.HandleConnectionAccepted] Loading login script '{loginScript}'\n");
                Load(ResolveScriptPath(loginScript), true);
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[ModInterpreter.HandleConnectionAccepted] Failed to load login script '{loginScript}': {ex}\n");
                ScriptDiagnosticOutput.Write($"\r\n[ERROR] Login script failed: {ex.Message}\r\n");
            }
        }

        public bool LocalInputEvent(string inputText)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            // Handle input from local client - pass to all scripts waiting for input.
            // Returns true if any script was waiting for input and consumed the text.
            bool consumed = false;
            int i = 0;
            while (i < _scriptList.Count)
            {
                Script script = _scriptList[i];
                if (script.WaitingForInput)
                {
                    bool completed = script.LocalInputEvent(inputText);
                    if (completed)
                        StopByHandle(script);
                    consumed = true;
                    break; // only one script gets the input
                }
                if (IsScriptStillAtIndex(i, script))
                    i++;
            }
            return consumed;
        }

        /// <summary>
        /// Returns true if any running script is in keypress-input-waiting mode
        /// (getInput with empty prompt — expects a single character without Enter).
        /// ProxyService uses this to fire LocalInputEvent immediately on each char.
        /// </summary>
        public bool HasKeypressInputWaiting =>
            _scriptList.Any(s => s.WaitingForInput && s.KeypressMode);

        public bool HasEchoingKeypressInputWaiting =>
            _scriptList.Any(s => s.WaitingForInput && s.KeypressMode && s.EchoKeypressInput);

        internal void RunSerializedScriptEvent(Action action)
        {
            lock (_scriptEventLock)
            {
                _pendingScriptEvents.Enqueue(action);
                if (_processingScriptEvent)
                    return;

                _processingScriptEvent = true;
                try
                {
                    while (_pendingScriptEvents.Count > 0)
                        _pendingScriptEvents.Dequeue()();
                }
                finally
                {
                    _processingScriptEvent = false;
                }
            }
        }

        internal T RunSerializedScriptEvent<T>(Func<T> action)
        {
            lock (_scriptEventLock)
            {
                return action();
            }
        }

        public bool TextOutEvent(string text, Script? startScript)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            return RunSerializedScriptEvent(() =>
            {
                GlobalModules.TriggerDebugLog($"[ModInterpreter.TextOutEvent] Text='{text}', scriptCount={_scriptList.Count}\n");
                // Trigger matching text out triggers in active scripts
                int i = 0;

                // Find starting script
                if (startScript != null)
                {
                    while (i < _scriptList.Count)
                    {
                        if (_scriptList[i] == startScript)
                        {
                            i++;
                            break;
                        }
                        i++;
                    }
                }

                bool result = false;

                // Loop through scripts and trigger off any text out triggers
                while (i < _scriptList.Count)
                {
                    Script script = _scriptList[i];
                    bool handled = false;
                    bool completed = script.TextOutEvent(text, ref handled);
                    if (completed)
                    {
                        StopByHandle(script);
                    }
                    else if (IsScriptStillAtIndex(i, script))
                    {
                        i++;
                    }

                    if (handled)
                    {
                        result = true;
                        break;
                    }
                }

                return result;
            });
        }

        public void TextEvent(string text, bool forceTrigger)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RunSerializedScriptEvent(() => TextEventCore(text, forceTrigger));
        }

        private void TextEventCore(string text, bool forceTrigger)
        {
            // Trigger matching text triggers in active scripts
            // [ModInterpreter.TextEvent] per-line logging removed — too high-frequency.
            string currentAnsiLine = ScriptRef.GetGlobalCurrentAnsiLine();
            int i = 0;

            while (i < _scriptList.Count)
            {
                Script script = _scriptList[i];
                script.SetCurrentTextContext(text, currentAnsiLine);
                bool completed = script.TextEvent(
                    text,
                    ShouldForcePromptProbe(script, text, forceTrigger));
                if (completed)
                    StopByHandle(script);
                else if (IsScriptStillAtIndex(i, script))
                    i++;
            }
        }

        public void TextLineEvent(string text, bool forceTrigger)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RunSerializedScriptEvent(() => TextLineEventCore(text, forceTrigger));
        }

        private void TextLineEventCore(string text, bool forceTrigger)
        {
            // Trigger matching textline triggers in active scripts
            GlobalModules.TriggerDebugLog($"[ModInterpreter.TextLineEvent] Text='{text}', scriptCount={_scriptList.Count}\n");
            string currentAnsiLine = ScriptRef.GetGlobalCurrentAnsiLine();
            int i = 0;

            while (i < _scriptList.Count)
            {
                Script script = _scriptList[i];
                script.SetCurrentTextContext(text, currentAnsiLine);
                bool completed = script.TextLineEvent(
                    text,
                    ShouldForcePromptProbe(script, text, forceTrigger));
                if (completed)
                    StopByHandle(script);
                else if (IsScriptStillAtIndex(i, script))
                    i++;
            }
        }

        public void AutoTextEvent(string text, bool forceTrigger)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RunSerializedScriptEvent(() => AutoTextEventCore(text, forceTrigger));
        }

        private void AutoTextEventCore(string text, bool forceTrigger)
        {
            // Trigger matching auto text triggers in active scripts
            string currentAnsiLine = ScriptRef.GetGlobalCurrentAnsiLine();
            int i = 0;

            while (i < _scriptList.Count)
            {
                Script script = _scriptList[i];
                script.SetCurrentTextContext(text, currentAnsiLine);
                bool completed = script.AutoTextEvent(
                    text,
                    ShouldForcePromptProbe(script, text, forceTrigger));
                if (completed)
                    StopByHandle(script);
                else if (IsScriptStillAtIndex(i, script))
                    i++;
            }
        }

        public void DispatchCompleteLine(string text, string ansiText, bool forceTrigger)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RunSerializedScriptEvent(() =>
            {
                ScriptRef.SetCurrentAnsiLine(ansiText);
                ScriptRef.SetCurrentLine(text);
                TextLineEventCore(text, forceTrigger);

                ScriptRef.SetCurrentAnsiLine(ansiText);
                ScriptRef.SetCurrentLine(text);
                TextEventCore(text, forceTrigger);

                ActivateTriggersCore();
            });
        }

        public void DispatchPartialLine(string text, string ansiText, bool forceTrigger)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RunSerializedScriptEvent(() =>
            {
                // Match Pascal TWX ProcessInBound for prompts/partial lines:
                // AutoTextEvent(CurrentLine), then ProcessPrompt(CurrentLine), which
                // calls TextEvent(CurrentLine). TextLineEvent and ActivateTriggers are
                // reserved for CR-terminated lines handled by DispatchCompleteLine.
                //
                // The TWX27 LIB~SYNC primitive uses #145/#8 as an out-of-band probe.
                // It must bypass same-line trigger suppression or a handler that sends
                // the probe from a partial prompt can never observe the immediate echo.
                ScriptRef.SetCurrentAnsiLine(ansiText);
                ScriptRef.SetCurrentLine(text);
                AutoTextEventCore(text, forceTrigger);

                ScriptRef.SetCurrentAnsiLine(ansiText);
                ScriptRef.SetCurrentLine(text);
                TextEventCore(text, forceTrigger);
            });
        }

        private static bool ShouldForcePromptProbe(Script script, string text, bool forceTrigger)
        {
            return forceTrigger ||
                Script.CountPromptProbes(text) > script.PromptProbesHandledOnCurrentLine;
        }

        public bool EventActive(string eventName)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            // Check if any scripts hold matching event triggers
            foreach (var script in _scriptList)
            {
                if (script.EventActive(eventName))
                    return true;
            }
            return false;
        }

        public void ActivateTriggers()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            RunSerializedScriptEvent(ActivateTriggersCore);
        }

        private void ActivateTriggersCore()
        {
            // All text related triggers are deactivated for the rest of the line after they activate.
            // This is to prevent double triggering. Turn them back on.
            // Pascal TWX does not resume script execution here; it only re-enables triggers.
            foreach (var script in _scriptList)
            {
                script.TriggersActive = true;
                script.ResetPromptProbeForNextLine();
            }

            CleanupTerminatedScripts();
        }

        private void CleanupTerminatedScripts()
        {
            // Clean up scripts that have fully terminated: no more code to run, not paused,
            // and no pending triggers or waitFor.  This handles scripts that exited via
            // "halt" (CmdAction.Stop sets _codePos = code.Length → HasCode = false) as well
            // as scripts that ran to the natural end of their bytecode.
            int i = _scriptList.Count - 1;
            while (i >= 0)
            {
                if (i >= _scriptList.Count)
                {
                    i = _scriptList.Count - 1;
                    continue;
                }

                var s = _scriptList[i];
                if (!s.HasCode && !s.Paused && !s.HasActiveTriggers)
                {
                    GlobalModules.DebugLog($"[ActivateTriggers] Cleaning up terminated script '{s.ScriptName}' (HasCode=false, no triggers)\n");
                    StopByHandle(s);
                }

                i = Math.Min(i - 1, _scriptList.Count - 1);
            }
        }

        public void DumpVars(string searchName)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            var server = GlobalModules.Server;
            if (server == null)
                return;

            if (string.IsNullOrEmpty(searchName))
                server.BroadcastLiteral("Dumping all script variables\r\n");
            else
                server.BroadcastLiteral($"Dumping all script variables containing '{searchName}'\r\n");

            // Dump variables in all scripts
            foreach (var script in _scriptList)
            {
                script.DumpVars(searchName);
            }

            server.BroadcastLiteral("Variable dump complete.\r\n");
        }

        public void DumpTriggers()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(RuntimeContext);
            // Dump triggers in all scripts
            foreach (var script in _scriptList)
            {
                script.DumpTriggers();
            }
        }

        // Properties
        public int Count => _scriptList.Count;
        public string LastScript => _lastScript;
        public string ActiveBot => _activeBot;
        public string ActiveBotDir => GetActiveBotDir();
        public string ActiveBotScript => _activeBotScript;
        public string ActiveBotName => GetActiveBotName();
        public string ActiveBotTag => _activeBotTag;
        public int ActiveBotTagLength => _activeBotTagLength;
        public bool ActiveLoginDisabled => _activeLoginScript.Equals("disabled", StringComparison.OrdinalIgnoreCase);
        public string ActiveLoginScript => ActiveLoginDisabled ? string.Empty : _activeLoginScript;
        public object? ScriptMenu { get => _scriptMenu; set => _scriptMenu = value; }
        public ScriptRef? ScriptRef => _scriptRef;
        public string ProgramDir { get => _programDir; set => _programDir = value; }
        public string ScriptDirectory { get => _scriptDirectory; set => _scriptDirectory = value; }
        public Script this[int index] => _scriptList[index];
        public List<string> AutoRun => _autoRun;
        public string AutoRunText
        {
            get => string.Join(Environment.NewLine, _autoRun);
            set => _autoRun = new List<string>(value.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries));
        }

        public Script? GetScript(int index)
        {
            if (index >= 0 && index < _scriptList.Count)
                return _scriptList[index];
            return null;
        }

        public string GetProgVar(string progVarName)
        {
            // Program variables are stored in a static dictionary in ScriptRef
            // They are global proxy settings accessible by name
            return ScriptRef.GetProgVar(progVarName);
        }

        public void SetProgVar(string progVarName, string value)
        {
            // Set program variable in the static dictionary
            ScriptRef.SetProgVar(progVarName, value);
        }

        public string GetConfiguredBotName(BotConfig config)
        {
            if (config == null || string.IsNullOrWhiteSpace(config.NameVar))
                return string.Empty;

            if (!IsFileBackedBotValue(config.NameVar))
            {
                string? cfgPath = GetBotStateConfigPath();
                if (string.IsNullOrWhiteSpace(cfgPath))
                    return string.Empty;

                return ReadIniValue(cfgPath, "Variables", config.NameVar, "0");
            }

            string filePath = ResolveBotValueFilePath(config.NameVar);
            if (!File.Exists(filePath))
                return string.Empty;

            try
            {
                return File.ReadLines(filePath).FirstOrDefault() ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private string GetActiveBotDir()
        {
            if (string.IsNullOrWhiteSpace(_activeBotScript))
                return string.Empty;

            string firstScript = _activeBotScript
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(firstScript))
                return string.Empty;

            string resolved = ResolveScriptPath(firstScript);
            string directory = Path.GetDirectoryName(resolved) ?? string.Empty;
            return directory.Replace(_programDir, string.Empty, StringComparison.OrdinalIgnoreCase);
        }

        private string GetActiveBotName()
        {
            return GetConfiguredBotName(new BotConfig { NameVar = _activeBotNameVar });
        }

        private bool IsFileBackedBotValue(string valueName)
        {
            return valueName.StartsWith("FILE:", StringComparison.OrdinalIgnoreCase);
        }

        private string ResolveBotValueFilePath(string valueName)
        {
            string fileName = valueName["FILE:".Length..];
            ModDatabase? db = ScriptRef.GetActiveDatabase();
            string gameName = Path.GetFileNameWithoutExtension(db?.DatabasePath ?? db?.DatabaseName ?? string.Empty);
            fileName = fileName.Replace("{GAME}", gameName, StringComparison.OrdinalIgnoreCase);
            return Path.GetFullPath(Utility.ResolvePlatformPath(fileName, _programDir));
        }

        private string? GetBotStateConfigPath()
        {
            ModDatabase? db = ScriptRef.GetActiveDatabase();
            string? dbPath = db?.DatabasePath;
            if (string.IsNullOrWhiteSpace(dbPath))
                return null;
            return Path.ChangeExtension(dbPath, ".cfg");
        }

        private void PersistActiveBotName(string botName)
        {
            if (string.IsNullOrWhiteSpace(_activeBotNameVar) || string.IsNullOrWhiteSpace(botName))
                return;

            if (!IsFileBackedBotValue(_activeBotNameVar))
            {
                string? cfgPath = GetBotStateConfigPath();
                if (!string.IsNullOrWhiteSpace(cfgPath))
                    WriteIniValue(cfgPath, "Variables", _activeBotNameVar, botName);
                return;
            }

            if (!string.IsNullOrWhiteSpace(_activeCommsVar))
            {
                string? cfgPath = GetBotStateConfigPath();
                if (!string.IsNullOrWhiteSpace(cfgPath))
                    WriteIniValue(cfgPath, "Variables", _activeCommsVar, botName);
            }

            string filePath = ResolveBotValueFilePath(_activeBotNameVar);
            string? directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);
            File.WriteAllLines(filePath, new[] { botName, string.Empty });
        }

        private static string ReadIniValue(string path, string section, string key, string fallback)
        {
            path = Utility.ResolvePlatformPath(path);
            foreach ((string sectionName, Dictionary<string, string> values) in ReadIniSections(path))
            {
                if (!sectionName.Equals(section, StringComparison.OrdinalIgnoreCase))
                    continue;

                return values.TryGetValue(key, out string? value) ? value : fallback;
            }

            return fallback;
        }

        private static void WriteIniValue(string path, string section, string key, string value)
        {
            path = Utility.ResolvePlatformPath(path);
            var sections = ReadIniSections(path);
            Dictionary<string, string>? values = null;

            for (int index = 0; index < sections.Count; index++)
            {
                if (!sections[index].SectionName.Equals(section, StringComparison.OrdinalIgnoreCase))
                    continue;

                values = sections[index].Values;
                break;
            }

            if (values == null)
            {
                values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                sections.Add((section, values));
            }

            values[key] = value;

            string? directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            using var writer = new StreamWriter(path, false, Encoding.UTF8);
            foreach ((string sectionName, Dictionary<string, string> sectionValues) in sections)
            {
                writer.Write('[');
                writer.Write(sectionName);
                writer.WriteLine(']');
                foreach ((string entryKey, string entryValue) in sectionValues)
                    writer.WriteLine($"{entryKey}={entryValue}");
                writer.WriteLine();
            }
        }

        private static List<(string SectionName, Dictionary<string, string> Values)> ReadIniSections(string path)
        {
            path = Utility.ResolvePlatformPath(path);
            var sections = new List<(string SectionName, Dictionary<string, string> Values)>();
            if (!File.Exists(path))
                return sections;

            Dictionary<string, string>? currentValues = null;

            foreach (string rawLine in File.ReadLines(path))
            {
                string line = rawLine.Trim();
                if (line.Length == 0 || line.StartsWith(";", StringComparison.Ordinal) || line.StartsWith("#", StringComparison.Ordinal))
                    continue;

                if (line.StartsWith("[", StringComparison.Ordinal) && line.EndsWith("]", StringComparison.Ordinal))
                {
                    string sectionName = line[1..^1].Trim();
                    currentValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    sections.Add((sectionName, currentValues));
                    continue;
                }

                if (currentValues == null)
                    continue;

                int equalsIndex = line.IndexOf('=');
                if (equalsIndex <= 0)
                    continue;

                string key = line[..equalsIndex].Trim();
                string value = line[(equalsIndex + 1)..].Trim();
                currentValues[key] = value;
            }

            return sections;
        }

        // IObserver implementation
        public void Notify(NotificationType noteType)
        {
            // Handle notifications if needed
        }
    }

    #endregion

    #region Script - Individual Script Instance

    /// <summary>
    /// TScript: A physical script in memory. Controlled by TModInterpreter - do not construct
    /// from outside TModInterpreter class.
    /// </summary>
    public class Script : IObserver, IDisposable
    {
        public interface IExecutionObserver
        {
            void OnCommandExecuted(
                bool prepared,
                ushort commandId,
                string commandName,
                int paramCount,
                int dynamicParamCount,
                int rawOffset,
                long elapsedTicks);
        }

        private sealed class ArithmeticVarPlan
        {
            public required VarParam BaseVar { get; init; }
            public required char Operator { get; init; }
            public required double RightValue { get; init; }
        }

        private int _codePos;
        private List<IScriptWindow> _windowList;
        private List<object> _menuItemList;
        private Dictionary<TriggerType, List<Trigger>> _triggers;
        private readonly object _triggerLock = new();
        private bool _waitingForAuth;
        private bool _waitForActive;
        private bool _waitingForInput;
        private bool _keypressMode;         // true when waiting for a single keypress (empty prompt)
        private bool _echoKeypressInput;
        private CmdParam? _inputVarParam;
        private string? _suppressNextNestedKeypressValue;
#pragma warning disable CS0169 // Field is never used
        private bool _silent;
        private bool _system;
#pragma warning restore CS0169
        private bool _paused;
        private PauseReason _pausedReason = PauseReason.None;
        private bool _forceStopRequested;
        private bool _isExecuting;
        private int _executionWatchdogActivityCounter;
        private bool _lastLineHandled;
        private int _promptProbesHandledOnCurrentLine;
        private int _lastCodePos = -1;
        private int _loopCounter = 0;
        private DateTime _lastLoopCheck = DateTime.MinValue;
        private const int MAX_LOOP_ITERATIONS = 50;  // Max iterations before warning
        private const int MIN_COMMANDS_PER_NO_IO_WATCHDOG_CHECK = 10_000_000;
        private const int EXECUTION_WATCHDOG_CHECK_MASK = 0xFFFF;
        private static readonly TimeSpan MAX_EXECUTION_SLICE_DURATION = TimeSpan.FromSeconds(60);
        private bool _resetLoopDetectionOnNextExecute;
        private bool _enableVariableDebug = false;  // Toggle for [VAR] output
        private string _waitText = string.Empty;
        private string _outText = string.Empty;
        private string _currentTextLine = string.Empty;
        private string _currentAnsiTextLine = string.Empty;
        private bool _hasCurrentTextContext;
        private ScriptCmp? _cmp;
        private ModInterpreter _owner;
#pragma warning disable CS0169 // Field is never used
        private int _decimalPrecision;
#pragma warning restore CS0169
#pragma warning disable CS0649 // Field is never assigned to
        private int _execScriptID;
#pragma warning restore CS0649
        private int _currentSourceScriptID;
        private int _currentSourceLineNumber;
        private int _currentSourceRawOffset = -1;
        private Stack<int> _subStack;
        private Stack<int> _nonResumingMenuHandlerDepths;
        private List<CmdParam> _cmdParams;
        private Dictionary<int, CmdParam[]> _dispatchParamCache;
        private CmdParam?[] _scratchParams;
        private Dictionary<string, ProgVarParam> _progVarCache;
        private Dictionary<string, ArithmeticVarPlan?> _arithVarCache;
        private Stack<string[]> _preparedSingleIndexBuffers;
        private Stack<string[]> _preparedDoubleIndexBuffers;
        private Dictionary<int, Stack<string[]>> _preparedIndexBufferCache;
        private string _libCmdName = string.Empty;
        private List<string> _libCmdLoaded;
        public Script(ModInterpreter owner)
        {
            _owner = owner;
            _cmp = new ScriptCmp(owner.ScriptRef, owner.ScriptDirectory);
            _waitForActive = false;
            _waitingForInput = false;
            _keypressMode = false;
            _echoKeypressInput = false;
            _inputVarParam = null;
            _subStack = new Stack<int>();
            _nonResumingMenuHandlerDepths = new Stack<int>();
            _cmdParams = new List<CmdParam>(20);
            _dispatchParamCache = new Dictionary<int, CmdParam[]>();
            _scratchParams = Array.Empty<CmdParam?>();
            _progVarCache = new Dictionary<string, ProgVarParam>(StringComparer.OrdinalIgnoreCase);
            _arithVarCache = new Dictionary<string, ArithmeticVarPlan?>(StringComparer.OrdinalIgnoreCase);
            _preparedSingleIndexBuffers = new Stack<string[]>();
            _preparedDoubleIndexBuffers = new Stack<string[]>();
            _preparedIndexBufferCache = new Dictionary<int, Stack<string[]>>();
            _windowList = new List<IScriptWindow>();
            _menuItemList = new List<object>();
            _libCmdLoaded = new List<string>();
            PreferPreparedExecution = GlobalModules.PreferPreparedVm;

            _triggers = new Dictionary<TriggerType, List<Trigger>>();
            foreach (TriggerType triggerType in Enum.GetValues(typeof(TriggerType)))
            {
                _triggers[triggerType] = new List<Trigger>();
            }
        }

        internal bool HasCurrentTextContext => _hasCurrentTextContext;
        internal string CurrentTextLine => _currentTextLine;
        internal string CurrentAnsiTextLine => _currentAnsiTextLine;

        internal void SetCurrentTextContext(string line, string ansiLine)
        {
            _currentTextLine = line ?? string.Empty;
            _currentAnsiTextLine = ansiLine ?? string.Empty;
            _hasCurrentTextContext = true;
        }

        public void Dispose()
        {
            if (GlobalModules.DebugMode)
            {
                string triggerSummary;
                lock (_triggerLock)
                {
                    triggerSummary = string.Join(", ",
                        Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>()
                            .Select(triggerType => $"{triggerType}={_triggers[triggerType].Count}"));
                }
                GlobalModules.DebugLog($"[Script.Dispose] script='{ScriptName}' persistenceId='{PersistenceId}' paused={_paused} pauseReason={_pausedReason} waitForActive={_waitForActive} waitText='{_waitText}' waitingInput={_waitingForInput} subDepth={_subStack.Count} triggers=[{triggerSummary}]\n");
            }

            if (GlobalModules.TWXLog is IModLog log)
                log.ClearScriptLoggingOverride(this);

            if (_menuItemList.Count > 0 && GlobalModules.TWXMenu != null)
                GlobalModules.TWXMenu.RemoveScriptMenus(this);

            // Free up menu items
            while (_menuItemList.Count > 0)
            {
                _menuItemList.RemoveAt(0);
            }

            // Free up script windows
            while (_windowList.Count > 0)
            {
                _windowList[0].Dispose();
                _windowList.RemoveAt(0);
            }

            // Free up trigger lists
            lock (_triggerLock)
            {
                foreach (var triggerType in Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>())
                {
                    while (_triggers[triggerType].Count > 0)
                    {
                        FreeTrigger(_triggers[triggerType][0]);
                        _triggers[triggerType].RemoveAt(0);
                    }
                }
            }

            // Free up sub stack
            _subStack.Clear();
            _nonResumingMenuHandlerDepths.Clear();

            _cmdParams.Clear();

            // Clear this script's in-memory var cache so stale savevar values
            // don't carry over if the same script is reloaded in this session.
            ScriptRef.ClearVarsForScript(PersistenceId);

            GlobalModules.DebugLog($"[Script.Dispose] script='{ScriptName}' dispose complete\n");
        }

        public void Notify(NotificationType noteType)
        {
            if (_waitingForAuth)
            {
                switch (noteType)
                {
                    case NotificationType.AuthenticationDone:
                        _waitingForAuth = false;
                        Execute();
                        break;
                    case NotificationType.AuthenticationFailed:
                        _waitingForAuth = false;
                        SelfTerminate();
                        break;
                }
            }
        }

        private void SelfTerminate()
        {
            // Send a notification message to self to start termination
            _owner.StopByHandle(this);
        }

        private bool ShouldAbortForForceStop()
        {
            if (!_forceStopRequested)
                return false;

            _paused = false;
            _pausedReason = PauseReason.None;
            _waitForActive = false;
            _waitingForAuth = false;
            _waitingForInput = false;
            _keypressMode = false;
            _echoKeypressInput = false;
            _inputVarParam = null;
            _waitText = string.Empty;
            _resetLoopDetectionOnNextExecute = true;
            return true;
        }

        public void GetFromFile(string filename, bool compile)
        {
            if (_cmp == null)
                throw new Exception("Script compiler not initialized");

            if (compile)
            {
                _cmp.CompileFromFile(filename, string.Empty);
                CompileLib();
            }
            else
            {
                _cmp.LoadFromFile(filename);
                CompileLib();
            }

            if (PreferPreparedExecution)
                _cmp.PrepareForExecution();

            _codePos = 0; // always start at beginning of script
            TriggersActive = true; // Enable triggers when script loads
        }

        private void FreeTrigger(Trigger trigger)
        {
            trigger.IsCancelled = true;
            trigger.Timer?.Dispose();
            trigger.Timer = null;
        }

        private bool CheckTriggers(List<Trigger> triggerList, string text, bool textOutTrigger, bool forceTrigger, ref bool handled)
        {
            // Check through triggers for matches with Text
            bool result = false;
            handled = false;
            bool matched = false;
            int lifeCycle = 0;
            string labelName = string.Empty;
            string response = string.Empty;
            string currentAnsiLine = !textOutTrigger && HasCurrentTextContext
                ? CurrentAnsiTextLine
                : ScriptRef.GetGlobalCurrentAnsiLine();

            int triggerCount;
            lock (_triggerLock)
                triggerCount = triggerList.Count;

            GlobalModules.TriggerDebugLog($"[CheckTriggers] Text='{text}', triggerCount={triggerCount}, TriggersActive={TriggersActive}, Locked={Locked}, textOut={textOutTrigger}, force={forceTrigger}\n");

            if ((!textOutTrigger && !forceTrigger && !TriggersActive) || Locked)
            {
                GlobalModules.TriggerDebugLog($"[CheckTriggers] BLOCKED: TriggersActive={TriggersActive}, Locked={Locked}\n");
                return false; // triggers are not enabled or locked in stasis (waiting on menu?)
            }

            lock (_triggerLock)
            {
                int i = 0;

                while (i < triggerList.Count)
                {
                    Trigger trigger = triggerList[i];
                    GlobalModules.TriggerDebugLog($"[CheckTriggers] Checking trigger {i}: value='{trigger.Value}', label='{trigger.LabelName}'\n");
                    if (text.Contains(trigger.Value) || string.IsNullOrEmpty(trigger.Value))
                    {
                        _lastLineHandled = true;
                        matched = true;
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] MATCH! Trigger {i} matched\n");
                        // Save trigger values before any handler code can mutate the list.
                        lifeCycle = trigger.LifeCycle;
                        labelName = trigger.LabelName;
                        response = trigger.Response;

                        // New lifecycle option
                        if (lifeCycle > 0)
                        {
                            trigger.LifeCycle = lifeCycle - 1;
                            if (trigger.LifeCycle == 0)
                            {
                                handled = true;
                                FreeTrigger(trigger);
                                triggerList.RemoveAt(i);
                            }
                        }

                        break;
                    }
                    else
                    {
                        i++;
                    }
                }
            }

            if (matched)
            {
                if (!string.IsNullOrEmpty(response))
                {
                    // Handle autotrigger response - send the compiled bytes as-is.
                    // Pascal TWX sends the response directly; source '*' characters have
                    // already been serialized to carriage returns (#13) by the compiler.
                    string output = response;

                    if (GlobalModules.TWXDatabase is ModDatabase database)
                    {
                        // Convert string to bytes (Latin1 encoding to preserve high-byte chars like chr(145)).
                        byte[] data = Encoding.Latin1.GetBytes(output);

                        // Blocking send to preserve script send order.
                        database.SendToServerAsync(data).GetAwaiter().GetResult();
                    }

                    return result;
                }
                else
                {
                    try
                    {
                        // Set CURRENTLINE to the text that triggered this handler
                        // This allows the handler to parse the triggering line
                        string currentLine = textOutTrigger ? NormalizeTextOutCurrentLine(text) : text;
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] Setting CURRENTLINE to '{currentLine}'\n");
                        SetCurrentTextContext(currentLine, currentAnsiLine);
                        ScriptRef.SetCurrentLine(currentLine);
                        ScriptRef.SetCurrentAnsiLine(currentAnsiLine);
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] Calling GotoLabel('{labelName}')\n");

                        GotoLabel(labelName);
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] GotoLabel succeeded, result={result}\n");
                    }
                    catch (Exception ex)
                    {
                        // Script is not in execution - error handling for gotos outside execute loop
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] GotoLabel FAILED: {ex.Message}\n");
                        // TWXServer.Broadcast($"{AnsiCodes.ANSI_15}Script run-time error (trigger activation): {AnsiCodes.ANSI_7}{ex.Message}\r\n");
                        SelfTerminate();
                        result = true;
                    }
                }

                if (!result)
                {
                    GlobalModules.TriggerDebugLog($"[CheckTriggers] Calling Execute() to run handler\n");
                    TriggersActive = false;

                    // Save the current pause state before running the handler.
                    // We must clear _paused so that Execute() can actually run the handler
                    // code (it returns immediately when _paused is true).
                    bool wasPaused = _paused;
                    PauseReason savedPauseReason = _pausedReason;
                    _paused = false;
                    _pausedReason = PauseReason.None;

                    // For PERSISTENT triggers (LifeCycle == 0) that fire while the outer
                    // code is mid-waitOn, the handler must NOT permanently overwrite the
                    // instruction pointer or the waitFor state.  The handler's variable
                    // side-effects are still useful, but the outer execution position must
                    // be restored afterwards so that the outer waitOn resumes correctly.
                    // NOTE: SetTextLineTrigger uses LifeCycle = 1 (one-shot) to match the
                    // original Pascal TWX where all triggers are removed before firing.
                    // This path is only relevant for any future LifeCycle = 0 triggers.
                    bool outerWaitActive = _waitForActive;   // true when mid-waitOn
                    int savedCodePos = _codePos;
                    string savedWaitText = _waitText;

                    if (Execute())
                    {
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] Execute() returned true (script terminated)\n");
                        result = true; // script was self-terminated
                    }
                    else
                    {
                        GlobalModules.TriggerDebugLog($"[CheckTriggers] Execute() returned false (handler completed)\n");
                        bool handlerPaused = _paused; // did the handler itself pause (e.g. its own waitOn)?

                        if (handlerPaused && lifeCycle == 0 && outerWaitActive)
                        {
                            // Persistent trigger (LifeCycle==0) fired while the outer script
                            // was mid-waitOn.  Restore the pre-trigger IP and waitFor state
                            // so the outer waitOn resumes from the correct bytecode spot.
                            GlobalModules.TriggerDebugLog($"[CheckTriggers] Persistent trigger fired mid-waitOn; restoring outer IP and waitFor state\n");
                            _codePos = savedCodePos;
                            _waitForActive = outerWaitActive;  // true
                            _waitText = savedWaitText;
                            _paused = true;
                            _pausedReason = savedPauseReason;
                        }
                        else if (handlerPaused)
                        {
                            // Handler registered its own waitOn/pause and paused.
                            // Leave the handler's pause as the effective state.
                            GlobalModules.TriggerDebugLog($"[CheckTriggers] Handler paused itself (new waitOn); leaving handler pause in place\n");
                        }
                        else if (wasPaused)
                        {
                            // Handler completed without pausing.
                            if (lifeCycle > 0)
                            {
                                // One-shot trigger (waitOn): the outer pause is consumed by
                                // this trigger firing.  Script continues from here.
                                GlobalModules.TriggerDebugLog($"[CheckTriggers] One-shot trigger satisfied outer pause — script continues\n");
                                // _paused already false — nothing to do
                            }
                            else
                            {
                                // Persistent trigger (setTextLineTrigger): handler ran to
                                // completion without setting its own waitOn.  Restore the
                                // outer pause so the main script keeps waiting.
                                GlobalModules.TriggerDebugLog($"[CheckTriggers] Persistent trigger handler done; restoring outer pause\n");
                                _paused = true;
                                _pausedReason = savedPauseReason;
                                _resetLoopDetectionOnNextExecute = true;
                            }
                        }
                        // If !wasPaused: script was not paused before, nothing to restore.
                    }
                }

                if (result)
                {
                    GlobalModules.TriggerDebugLog($"[CheckTriggers] Returning true from CheckTriggers\n");
                    return result;
                }
            }

            GlobalModules.TriggerDebugLog($"[CheckTriggers] Finished checking all triggers, returning {result}\n");
            return result;
        }

        private static string NormalizeTextOutCurrentLine(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            var builder = new StringBuilder(text.Length);
            foreach (char ch in text)
            {
                if (ch == '\b' || ch == (char)127)
                {
                    if (builder.Length > 0)
                        builder.Length--;
                    continue;
                }

                if (ch == '\r' || ch == '\n')
                    continue;

                builder.Append(ch);
            }

            return builder.ToString();
        }

        private bool TriggerExists(string name)
        {
            lock (_triggerLock)
            {
                // Check through all trigger lists to see if this trigger name is in use
                foreach (var triggerType in Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>())
                {
                    var triggerList = _triggers[triggerType];
                    if (triggerList.Any(t => t.Name == name))
                        return true;
                }
                return false;
            }
        }

        public bool TextOutEvent(string text, ref bool handled)
        {
            _lastLineHandled = false;
            _outText = text;
            // Check through textOut triggers for matches with text
            return CheckTriggers(_triggers[TriggerType.TextOut], text, true, false, ref handled);
        }

        public bool TextLineEvent(string text, bool forceTrigger)
        {
            _lastLineHandled = false;
            // Pascal TextLineEvent only checks TextLine triggers — no waitFor/waitOn check here.
            // (waitFor/waitOn is handled exclusively in TextEvent.)
            // Check through lineTriggers for matches with Text
            bool handled = false;
            bool completed = CheckTriggers(_triggers[TriggerType.TextLine], text, false, forceTrigger, ref handled);
            RememberPromptProbeMatch(text, handled);
            return completed;
        }

        public bool AutoTextEvent(string text, bool forceTrigger)
        {
            _lastLineHandled = false;
            // Check through autoTriggers for matches with Text
            bool handled = false;
            bool completed = CheckTriggers(_triggers[TriggerType.TextAuto], text, false, forceTrigger, ref handled);
            RememberPromptProbeMatch(text, handled);
            return completed;
        }

        public bool TextEvent(string text, bool forceTrigger)
        {
            _lastLineHandled = false;
            // [Script.TextEvent] per-line logging removed — too high-frequency.
            // Check waitfor
            if (_waitForActive)
            {
                if (text.Contains(_waitText))
                {
                    _lastLineHandled = true;
                    TriggersActive = false;
                    _waitForActive = false;
                    // Unpause if paused (WAITFOR/WAITON paused the script)
                    if (_paused)
                    {
                        _paused = false;
                        _pausedReason = PauseReason.None;
                    }
                    ScriptRef.SetCurrentLine(text);
                    ScriptRef.SetCurrentAnsiLine(CurrentAnsiTextLine);

                    return Execute();
                }
            }

            // Check through textTriggers for matches with Text
            bool handled = false;
            bool completed = CheckTriggers(_triggers[TriggerType.Text], text, false, forceTrigger, ref handled);
            RememberPromptProbeMatch(text, handled);
            return completed;
        }

        private void RememberPromptProbeMatch(string text, bool handled)
        {
            if (handled)
                _promptProbesHandledOnCurrentLine = CountPromptProbes(text);
        }

        internal static int CountPromptProbes(string text)
        {
            int count = 0;
            int searchStart = 0;
            while ((searchStart = text.IndexOf("\u0091\b", searchStart, StringComparison.Ordinal)) >= 0)
            {
                count++;
                searchStart += 2;
            }

            return count;
        }

        public bool ProgramEvent(string eventName, string matchText, bool exclusive)
        {
            // SetEventTrigger stores Value as ToUpperInvariant(), so match case-insensitively
            string eventNameUpper = eventName.ToUpperInvariant();

            // Check through EventTriggers for matches with Text
            if (eventNameUpper == "SCRIPT STOPPED")
            {
                int eventCount;
                lock (_triggerLock)
                    eventCount = _triggers[TriggerType.Event].Count(t => t.Value == "SCRIPT STOPPED");
                GlobalModules.DebugLog($"[Script.ProgramEvent] Script='{ScriptName}' received SCRIPT STOPPED, eventTriggerCount={eventCount}\n");
                GlobalModules.FlushDebugLog();
            }

            int triggerCount;
            lock (_triggerLock)
                triggerCount = _triggers[TriggerType.Event].Count;
            GlobalModules.DebugLog($"[Script.ProgramEvent] Script='{ScriptName}' event='{eventNameUpper}' triggerCount={triggerCount}\n");
            GlobalModules.FlushDebugLog();

            bool result = false;
            bool matched = false;
            string labelName = string.Empty;

            lock (_triggerLock)
            {
                int i = 0;

                while (i < _triggers[TriggerType.Event].Count)
                {
                    var trigger = _triggers[TriggerType.Event][i];

                    bool matchFound = trigger.Value == eventNameUpper &&
                        ((!exclusive && matchText.Contains(trigger.Param)) ||
                         (exclusive && trigger.Param == matchText) ||
                         string.IsNullOrEmpty(matchText) ||
                         string.IsNullOrEmpty(trigger.Param));

                    if (matchFound)
                    {
                        matched = true;
                        GlobalModules.DebugLog($"[Script.ProgramEvent] MATCHED trigger='{trigger.Name}' label='{trigger.LabelName}'\n");
                        GlobalModules.FlushDebugLog();

                        // Remove this trigger and enact it
                        labelName = trigger.LabelName;
                        FreeTrigger(trigger);
                        _triggers[TriggerType.Event].RemoveAt(i);
                        break;
                    }
                    else
                    {
                        i++;
                    }
                }
            }

            if (matched)
            {
                try
                {
                    GotoLabel(labelName);
                }
                catch (Exception)
                {
                    // Script is not in execution - error handling for gotos outside execute loop
                    SelfTerminate();
                    result = true;
                }

                if (!result)
                {
                    TriggersActive = false;

                    // Clear _paused so Execute() can actually run the handler
                    // (Execute returns immediately when _paused is true).
                    bool wasPaused = _paused;
                    PauseReason savedPauseReason = _pausedReason;
                    _paused = false;
                    _pausedReason = PauseReason.None;

                    if (Execute())
                    {
                        result = true; // script was self-terminated
                    }
                    else if (_paused)
                    {
                        // Program events are not part of a text-line dispatch, so there is
                        // no later ActivateTriggers call to arm triggers installed by the
                        // event handler before its PAUSE. Child-script completion handlers
                        // commonly send a command and wait on the very next server line.
                        TriggersActive = true;
                    }
                    else if (wasPaused && !_paused)
                    {
                        // Handler ran to completion without re-pausing; restore original pause
                        // so the outer PAUSE loop continues where it left off.
                        _paused = true;
                        _pausedReason = savedPauseReason;
                        _resetLoopDetectionOnNextExecute = true;
                    }
                }
            }

            return result;
        }

        public bool EventActive(string eventName)
        {
            // Check for events matching this event name
            lock (_triggerLock)
                return _triggers[TriggerType.Event].Any(t => t.Value == eventName);
        }

        private void DelayTimerEvent(object? sender, ElapsedEventArgs e)
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(_owner.RuntimeContext);

            if (sender is not DelayTimer timer)
                return;

            _owner.RunSerializedScriptEvent(() => DelayTimerEventCore(timer));
        }

        private void DelayTimerEventCore(DelayTimer timer)
        {
            string labelName;
            bool term = false;

            lock (_triggerLock)
            {
                Trigger? trigger = timer.DelayTrigger;
                if (trigger == null || trigger.IsCancelled)
                    return;

                int triggerIndex = _triggers[TriggerType.Delay].IndexOf(trigger);
                if (triggerIndex < 0)
                    return;

                labelName = trigger.LabelName;

                // Remove the trigger and its timer before running the handler.
                _triggers[TriggerType.Delay].RemoveAt(triggerIndex);
                FreeTrigger(trigger);
            }

            try
            {
                GotoLabel(labelName);
            }
            catch (Exception)
            {
                // Script is not in execution - error handling for gotos outside execute loop
                // TWXServer.Broadcast($"{AnsiCodes.ANSI_15}Script run-time error (delay trigger activation): {AnsiCodes.ANSI_7}{ex.Message}\r\n");
                SelfTerminate();
                term = true;
            }

            if (!term)
            {
                // Unpause the script so delay trigger can resume execution
                _paused = false;
                if (Execute())
                    _owner.StopByHandle(this);
            }
        }

        private Trigger CreateTrigger(string name, string labelName, string value)
        {
            if (_cmp != null)
            {
                _cmp.ExtendName(ref name, _execScriptID);
                _cmp.ExtendLabelName(ref labelName, _execScriptID);
            }

            if (TriggerExists(name))
                throw new Exception($"Trigger already exists: '{name}'");

            return new Trigger
            {
                Name = name,
                LabelName = labelName,
                Response = string.Empty,
                Value = value,
                Timer = null,
                LifeCycle = 1 // default lifecycle is single response / no repeat
            };
        }

        public void SetAutoTrigger(string name, string value, string response, int lifeCycle)
        {
            lock (_triggerLock)
            {
                if (TriggerExists(name))
                    throw new Exception($"Trigger already exists: '{name}'");

                var trigger = new Trigger
                {
                    Name = name,
                    LabelName = string.Empty,
                    Response = response,
                    Value = value,
                    Timer = null,
                    LifeCycle = lifeCycle
                };

                _triggers[TriggerType.TextAuto].Add(trigger);
            }
        }

        public void SetTextLineTrigger(string name, string labelName, string value)
        {
            lock (_triggerLock)
            {
                KillTrigger(name); // upsert: replace any existing trigger with this name
                var trigger = CreateTrigger(name, labelName, value);
                // LifeCycle = 1 (one-shot, default from CreateTrigger): matches Pascal behavior where
                // all triggers are unconditionally removed before their handler runs.  "Persistence"
                // in scripts like InfoQuick's :line loop is achieved by the handler re-registering
                // the trigger itself, exactly as in the original Pascal TWX.
                _triggers[TriggerType.TextLine].Add(trigger);
            }
        }

        public void SetTextOutTrigger(string name, string labelName, string value)
        {
            lock (_triggerLock)
            {
                KillTrigger(name); // upsert: replace any existing trigger with this name
                var trigger = CreateTrigger(name, labelName, value);
                // LifeCycle = 1 (one-shot): matches Pascal behavior.
                _triggers[TriggerType.TextOut].Add(trigger);
            }
        }

        public void SetTextTrigger(string name, string labelName, string value)
        {
            lock (_triggerLock)
            {
                // Upsert: remove any existing trigger with this name first.
                // In the original Pascal TWX, re-registering a waitOn is valid and simply
                // replaces the old entry (e.g. when a persistent handler re-issues the same waitOn).
                KillTrigger(name);
                var trigger = CreateTrigger(name, labelName, value);
                _triggers[TriggerType.Text].Add(trigger);
            }
        }

        public void SetEventTrigger(string name, string labelName, string value, string param)
        {
            if (_cmp != null)
            {
                _cmp.ExtendName(ref name, _execScriptID);
                _cmp.ExtendLabelName(ref labelName, _execScriptID);
            }

            GlobalModules.TriggerDebugLog($"[SETEVENTTRIGGER] name='{name}' label='{labelName}' event='{value}' param='{param}'\n");

            lock (_triggerLock)
            {
                if (TriggerExists(name))
                    throw new Exception($"Trigger already exists: '{name}'");

                var trigger = new Trigger
                {
                    Name = name,
                    LabelName = labelName,
                    Response = string.Empty,
                    Value = value.ToUpperInvariant(),
                    Param = param,
                    Timer = null,
                    LifeCycle = 1
                };

                if (trigger.Value == "TIME HIT")
                    _owner.CountTimerEvent();

                _triggers[TriggerType.Event].Add(trigger);
            }
        }

        public void SetDelayTrigger(string name, string labelName, int value)
        {
            if (_cmp != null)
            {
                _cmp.ExtendName(ref name, _execScriptID);
                _cmp.ExtendLabelName(ref labelName, _execScriptID);
            }

            lock (_triggerLock)
            {
                if (TriggerExists(name))
                    throw new Exception($"Trigger already exists: '{name}'");

                var trigger = new Trigger
                {
                    Name = name,
                    LabelName = labelName,
                    Response = string.Empty,
                    Value = string.Empty,
                    Param = string.Empty,
                    LifeCycle = 1
                };

                var timer = new DelayTimer
                {
                    Interval = value,
                    DelayTrigger = trigger,
                    AutoReset = false
                };

                timer.Elapsed += DelayTimerEvent;
                trigger.Timer = timer;
                _triggers[TriggerType.Delay].Add(trigger);
                timer.Start();
            }
        }

        public void KillTrigger(string name)
        {
            if (_cmp != null)
                _cmp.ExtendName(ref name, _execScriptID);

            lock (_triggerLock)
            {
                // Remove trigger by name from all trigger lists
                foreach (var triggerType in Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>())
                {
                    var triggerList = _triggers[triggerType];
                    for (int i = 0; i < triggerList.Count; i++)
                    {
                        if (triggerList[i].Name == name)
                        {
                            if (triggerList[i].Value == "TIME HIT")
                                _owner.UnCountTimerEvent();

                            FreeTrigger(triggerList[i]);
                            triggerList.RemoveAt(i);
                            return;
                        }
                    }
                }
            }
        }

        public void KillAllTriggers()
        {
            lock (_triggerLock)
            {
                // Remove all triggers
                foreach (var triggerType in Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>())
                {
                    var triggerList = _triggers[triggerType];
                    while (triggerList.Count > 0)
                    {
                        if (triggerList[0].Value == "TIME HIT")
                            _owner.UnCountTimerEvent();

                        FreeTrigger(triggerList[0]);
                        triggerList.RemoveAt(0);
                    }
                }
            }
        }

        /// <summary>
        /// Pascal TWX compiler convention: a VarParam named "$foo+1" or "$foo-2" represents
        /// an arithmetic expression on $foo.  The Pascal interpreter evaluated these inline;
        /// our C# interpreter must do the same.  Finds the operator position in the name,
        /// returning -1 if the name is a plain variable name.
        /// </summary>
        private static int FindArithOpInVarName(string name)
        {
            // Name always starts with '$'; operator must be preceded by at least one identifier char.
            if (string.IsNullOrEmpty(name) || name[0] != '$')
                return -1;
            for (int i = 2; i < name.Length; i++)
            {
                char c = name[i];
                if (c == '+' || c == '-' || c == '*' || c == '/')
                    return i;
                if (!(char.IsLetterOrDigit(c) || c == '_'))
                    return -1;   // unexpected char before any operator
            }
            return -1;
        }

        /// <summary>
        /// If <paramref name="param"/> is a VarParam whose name encodes an arithmetic
        /// expression (Pascal TWX convention, e.g. "$commandLength+1"), evaluate it
        /// now using the current value of the base variable in the ParamList and return
        /// a fresh read-only CmdParam holding the result.  Otherwise returns null.
        /// </summary>
        private CmdParam? EvaluateArithExprVar(VarParam param)
        {
            if (!_arithVarCache.TryGetValue(param.Name, out ArithmeticVarPlan? plan))
            {
                int opIdx = FindArithOpInVarName(param.Name);
                if (opIdx < 0)
                {
                    _arithVarCache[param.Name] = null;
                    return null;
                }

                string baseVarName = param.Name.Substring(0, opIdx);
                char op = param.Name[opIdx];
                string rhsStr = param.Name.Substring(opIdx + 1);

                if (!double.TryParse(rhsStr, NumberStyles.Float, CultureInfo.InvariantCulture, out double rhs))
                {
                    _arithVarCache[param.Name] = null;
                    return null;
                }

                VarParam? baseVar = null;
                foreach (var p in (_cmp?.ParamList ?? Enumerable.Empty<CmdParam>()))
                {
                    if (p is VarParam vp &&
                        string.Equals(vp.Name, baseVarName, StringComparison.OrdinalIgnoreCase))
                    {
                        baseVar = vp;
                        break;
                    }
                }

                if (baseVar == null)
                {
                    _arithVarCache[param.Name] = null;
                    return null;
                }

                plan = new ArithmeticVarPlan
                {
                    BaseVar = baseVar,
                    Operator = op,
                    RightValue = rhs
                };
                _arithVarCache[param.Name] = plan;
            }

            if (plan == null)
                return null;

            double.TryParse(plan.BaseVar.Value,
                            NumberStyles.Float,
                            CultureInfo.InvariantCulture,
                            out double baseVal);

            double result = plan.Operator switch
            {
                '+' => baseVal + plan.RightValue,
                '-' => baseVal - plan.RightValue,
                '*' => baseVal * plan.RightValue,
                '/' when plan.RightValue != 0 => baseVal / plan.RightValue,
                _ => baseVal
            };

            GlobalModules.DebugLog(
                $"[ArithVar] '{param.Name}': {plan.BaseVar.Name}={baseVal} {plan.Operator} {plan.RightValue} = {result}\n");

            long intResult = (long)result;
            string valStr = (result == intResult)
                ? intResult.ToString()
                : result.ToString("R", CultureInfo.InvariantCulture);
            return new CmdParam { Value = valStr };
        }

        private void SkipArrayIndexes(byte[] code, ref int codePos)
        {
            // Read index count
            if (codePos >= code.Length)
                return;

            byte indexCount = code[codePos++];

            // For each index, read: type byte + data (format matches TWX decompiler)
            for (int i = 0; i < indexCount; i++)
            {
                if (codePos >= code.Length)
                    return;

                byte indexType = code[codePos++];

                if (indexType == ScriptConstants.PARAM_CONST)
                {
                    // 32-bit parameter ID
                    codePos += 4;
                }
                else if (indexType == ScriptConstants.PARAM_VAR || indexType == ScriptConstants.PARAM_PROGVAR)
                {
                    // 32-bit variable ID + recursively skip its indexes
                    codePos += 4;
                    SkipArrayIndexes(code, ref codePos);
                }
                else if (indexType == ScriptConstants.PARAM_SYSCONST)
                {
                    // 16-bit sysconst ID + recursively skip its indexes
                    codePos += 2;
                    SkipArrayIndexes(code, ref codePos);
                }
                else if (indexType == ScriptConstants.PARAM_CHAR)
                {
                    // 1-byte character code
                    codePos += 1;
                }
            }
        }

        private CmdParam EvaluateArrayIndexes(byte[] code, ref int codePos, CmdParam baseParam)
        {
            var server = GlobalModules.TWXServer;

            // Read index count
            if (codePos >= code.Length)
                return baseParam;

            byte indexCount = code[codePos++];

            if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[EvaluateArrayIndexes] indexCount={indexCount}, baseParam type={baseParam.GetType().Name}\n");

            if (indexCount == 0)
                return baseParam;  // Not an array reference

            // Only VarParam supports arrays
            if (!(baseParam is VarParam varParam))
            {
                // Not an array type, but we still need to skip the index bytecode
                for (int i = 0; i < indexCount; i++)
                {
                    if (codePos >= code.Length)
                        break;

                    byte indexType = code[codePos++];

                    if (indexType == ScriptConstants.PARAM_CONST)
                        codePos += 4;
                    else if (indexType == ScriptConstants.PARAM_VAR || indexType == ScriptConstants.PARAM_PROGVAR)
                    {
                        codePos += 4;
                        SkipArrayIndexes(code, ref codePos);
                    }
                    else if (indexType == ScriptConstants.PARAM_SYSCONST)
                    {
                        codePos += 2;
                        SkipArrayIndexes(code, ref codePos);
                    }
                    else if (indexType == ScriptConstants.PARAM_CHAR)
                        codePos += 1;
                }
                return baseParam;
            }

            // Evaluate each index dimension
            var indexes = new List<string>();

            for (int i = 0; i < indexCount; i++)
            {
                if (codePos >= code.Length)
                    return baseParam;

                byte indexType = code[codePos++];

                string indexValue = "";

                if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[EvalIndex {i}] indexType={indexType}\n");

                if (indexType == ScriptConstants.PARAM_CONST)
                {
                    // 32-bit parameter ID
                    int paramID = BitConverter.ToInt32(code, codePos);
                    codePos += 4;

                    if (paramID >= 0 && paramID < (_cmp?.ParamList.Count ?? 0))
                    {
                        indexValue = _cmp!.ParamList[paramID].Value;
                        if (indexValue.Length >= 2 && indexValue[0] == '"' && indexValue[^1] == '"')
                            indexValue = indexValue.Substring(1, indexValue.Length - 2);
                        if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[EvalIndex {i}] CONST paramID={paramID}, value='{indexValue}'\n");
                    }
                }
                else if (indexType == ScriptConstants.PARAM_VAR)
                {
                    // 32-bit variable ID
                    int paramID = BitConverter.ToInt32(code, codePos);
                    codePos += 4;

                    if (paramID >= 0 && paramID < (_cmp?.ParamList.Count ?? 0))
                    {
                        var indexParam = _cmp!.ParamList[paramID];
                        if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[EvalIndex {i}] VAR paramID={paramID}, before recursion value='{indexParam.Value}'\n");
                        // Check for Pascal arithmetic expression in var name (e.g. "$courseLength+1")
                        if (indexParam is VarParam vpIdx)
                        {
                            var arithResult = EvaluateArithExprVar(vpIdx);
                            if (arithResult != null)
                            {
                                SkipArrayIndexes(code, ref codePos);
                                indexValue = arithResult.Value;
                                if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[EvalIndex {i}] ArithExpr result='{indexValue}'\n");
                                indexes.Add(indexValue);
                                continue;
                            }
                        }
                        // Recursively evaluate if this index is itself an array
                        indexParam = EvaluateArrayIndexes(code, ref codePos, indexParam);
                        indexValue = indexParam.Value;
                        if (indexValue.Length >= 2 && indexValue[0] == '"' && indexValue[^1] == '"')
                            indexValue = indexValue.Substring(1, indexValue.Length - 2);
                        if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[EvalIndex {i}] VAR after recursion value='{indexValue}'\n");
                    }
                    else
                    {
                        // Skip nested indexes if param not found
                        SkipArrayIndexes(code, ref codePos);
                    }
                }
                else if (indexType == ScriptConstants.PARAM_PROGVAR)
                {
                    // 32-bit parameter ID
                    int paramID = BitConverter.ToInt32(code, codePos);
                    codePos += 4;

                    if (paramID >= 0 && paramID < (_cmp?.ParamList.Count ?? 0))
                    {
                        var nameParam = _cmp!.ParamList[paramID];
                        string progVarName = nameParam is VarParam vp ? vp.Name : nameParam.Value;
                        var progVarParam = new ProgVarParam(progVarName, _owner);
                        // Recursively evaluate if this index is itself an array
                        progVarParam = EvaluateArrayIndexes(code, ref codePos, progVarParam) as ProgVarParam ?? progVarParam;
                        indexValue = progVarParam.Value;
                        if (indexValue.Length >= 2 && indexValue[0] == '"' && indexValue[^1] == '"')
                            indexValue = indexValue.Substring(1, indexValue.Length - 2);
                    }
                    else
                    {
                        // Skip nested indexes if param not found
                        SkipArrayIndexes(code, ref codePos);
                    }
                }
                else if (indexType == ScriptConstants.PARAM_SYSCONST)
                {
                    // 16-bit sysconst ID
                    ushort constID = BitConverter.ToUInt16(code, codePos);
                    codePos += 2;

                    // Evaluate sysconst (skip nested indexes)
                    SkipArrayIndexes(code, ref codePos);

                    if (_owner.ScriptRef != null)
                    {
                        var sysConst = ResolveRuntimeSysConst(constID);
                        if (sysConst != null)
                        {
                            indexValue = sysConst.Read(Array.Empty<string>());
                        }
                    }
                }
                else if (indexType == ScriptConstants.PARAM_CHAR)
                {
                    // 1-byte character code
                    byte charCode = code[codePos++];
                    indexValue = ((char)charCode).ToString();
                }

                indexes.Add(indexValue);
            }

            // Get the indexed array element
            try
            {
                if (GlobalModules.VerboseDebugMode) GlobalModules.DebugLog($"[GetIndexVar] Getting element with indexes: [{string.Join(", ", indexes)}]\n");

                var result = varParam.GetIndexVar(indexes.ToArray());

                string traceName = varParam.Name ?? string.Empty;
                bool traceSectorLookup =
                    traceName.IndexOf("CURSECTOR", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    traceName.IndexOf("THISSECTOR", StringComparison.OrdinalIgnoreCase) >= 0;
                if (traceSectorLookup && indexes.Count > 0)
                {
                    GlobalModules.DebugLog($"[ARRAY TRACE] base='{traceName}' indexes=[{string.Join(", ", indexes)}] resultName='{(result as VarParam)?.Name ?? result.Value}' resultValue='{result.Value}'\n");
                }

                if (GlobalModules.VerboseDebugMode && result is VarParam resultVp)
                {
                    GlobalModules.DebugLog($"[GetIndexVar] Result: '{resultVp.Name}' = '{resultVp.Value}'\n");
                }

                return result;
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog(
                    $"[Array Access Error] base='{varParam.Name}' indexes=[{string.Join(", ", indexes)}] message='{ex.Message}'\n");
                if (!ShouldSuppressArrayAccessError(ex.Message, indexes))
                {
                    ScriptDiagnosticOutput.Write($"[Array Access Error] {ex.Message}\r\n");
                }
                return baseParam;  // Return base param if index fails
            }
        }

        /// <summary>
        /// Reads the array-index section that follows a PARAM_SYSCONST in the bytecode,
        /// evaluates each index expression, and returns the resulting string values.
        /// Replaces the old SkipArrayIndexes call for sysconsts so that indexed sysconsts
        /// like PORT.CLASS[$CurSector] can receive the actual evaluated index values.
        /// </summary>
        private string[] EvaluateSysConstIndexes(byte[] code, ref int codePos)
        {
            if (codePos >= code.Length)
                return Array.Empty<string>();

            byte indexCount = code[codePos++];
            if (indexCount == 0)
                return Array.Empty<string>();

            var indexes = new List<string>(indexCount);

            for (int i = 0; i < indexCount; i++)
            {
                if (codePos >= code.Length)
                    break;

                byte indexType = code[codePos++];
                string indexValue = "";

                if (indexType == ScriptConstants.PARAM_CONST)
                {
                    int paramID = BitConverter.ToInt32(code, codePos);
                    codePos += 4;
                    if (paramID >= 0 && paramID < _cmp!.ParamList.Count)
                        indexValue = _cmp.ParamList[paramID].Value;
                }
                else if (indexType == ScriptConstants.PARAM_VAR)
                {
                    int paramID = BitConverter.ToInt32(code, codePos);
                    codePos += 4;
                    if (paramID >= 0 && paramID < _cmp!.ParamList.Count)
                    {
                        var param = _cmp.ParamList[paramID];
                        // Check for Pascal arithmetic expression in var name (e.g. "$step+1")
                        if (param is VarParam vpIdx)
                        {
                            var arithResult = EvaluateArithExprVar(vpIdx);
                            if (arithResult != null)
                            {
                                SkipArrayIndexes(code, ref codePos);
                                indexValue = arithResult.Value;
                                indexes.Add(indexValue);
                                continue;
                            }
                        }
                        param = EvaluateArrayIndexes(code, ref codePos, param);
                        indexValue = param.Value;
                    }
                    else
                        SkipArrayIndexes(code, ref codePos);
                }
                else if (indexType == ScriptConstants.PARAM_PROGVAR)
                {
                    int paramID = BitConverter.ToInt32(code, codePos);
                    codePos += 4;
                    if (paramID >= 0 && paramID < _cmp!.ParamList.Count)
                    {
                        var nameParam = _cmp.ParamList[paramID];
                        string progVarName = nameParam is VarParam vp ? vp.Name : nameParam.Value;
                        var progVar = new ProgVarParam(progVarName, _owner);
                        var evalResult = EvaluateArrayIndexes(code, ref codePos, progVar);
                        indexValue = evalResult.Value;
                    }
                    else
                        SkipArrayIndexes(code, ref codePos);
                }
                else if (indexType == ScriptConstants.PARAM_SYSCONST)
                {
                    ushort innerConstID = BitConverter.ToUInt16(code, codePos);
                    codePos += 2;
                    SkipArrayIndexes(code, ref codePos);   // nested sysconst – don't recurse infinitely
                    if (_owner.ScriptRef != null)
                    {
                        var innerConst = ResolveRuntimeSysConst(innerConstID);
                        if (innerConst != null)
                            indexValue = innerConst.Read(Array.Empty<string>());
                    }
                }
                else if (indexType == ScriptConstants.PARAM_CHAR)
                {
                    if (codePos < code.Length)
                        indexValue = ((char)code[codePos++]).ToString();
                }

                indexes.Add(indexValue);
            }

            return indexes.ToArray();
        }

        private static string NormalizePreparedIndexValue(string value)
        {
            return value.Length >= 2 && value[0] == '"' && value[^1] == '"'
                ? value.Substring(1, value.Length - 2)
                : value;
        }

        private void ClearCurrentSourceLocation()
        {
            _currentSourceScriptID = 0;
            _currentSourceLineNumber = 0;
            _currentSourceRawOffset = -1;
        }

        private void SetCurrentSourceLocation(int scriptId, int lineNumber, int rawOffset)
        {
            _currentSourceScriptID = scriptId;
            _currentSourceLineNumber = lineNumber;
            _currentSourceRawOffset = rawOffset;
        }

        private string FormatCurrentSourceLocation()
        {
            if (_cmp == null)
                return string.Empty;

            string compiledScriptName = _cmp.GetCompiledScriptDisplayName();
            string sourceName = _cmp.GetSourceDisplayName(_currentSourceScriptID);
            bool hasCompiledName = !string.IsNullOrWhiteSpace(compiledScriptName);
            bool hasIncludeName = !string.IsNullOrWhiteSpace(sourceName) &&
                                  !string.Equals(sourceName, compiledScriptName, StringComparison.OrdinalIgnoreCase);

            if (hasCompiledName)
            {
                if (hasIncludeName && _currentSourceLineNumber > 0)
                    return $"{compiledScriptName} ({sourceName}) line {_currentSourceLineNumber}: ";

                if (hasIncludeName)
                    return $"{compiledScriptName} ({sourceName}): ";

                if (_currentSourceLineNumber > 0)
                    return $"{compiledScriptName} line {_currentSourceLineNumber}: ";

                return $"{compiledScriptName}: ";
            }

            if (!string.IsNullOrWhiteSpace(sourceName) && _currentSourceLineNumber > 0)
                return $"{sourceName} line {_currentSourceLineNumber}: ";

            if (!string.IsNullOrWhiteSpace(sourceName))
                return $"{sourceName}: ";

            if (_currentSourceRawOffset >= 0)
                return $"at byte offset {_currentSourceRawOffset}: ";

            return string.Empty;
        }

        private string FormatScriptErrorMessage(string message)
        {
            string location = FormatCurrentSourceLocation();
            return string.IsNullOrEmpty(location)
                ? message
                : location + message;
        }

        private CmdParam GetScratchParam(int slotIndex, string value)
        {
            if (slotIndex >= _scratchParams.Length)
            {
                int newSize = _scratchParams.Length == 0 ? 8 : _scratchParams.Length;
                while (newSize <= slotIndex)
                    newSize *= 2;

                Array.Resize(ref _scratchParams, newSize);
            }

            CmdParam scratch = _scratchParams[slotIndex] ??= new CmdParam();
            scratch.Value = value;
            return scratch;
        }

        private void RecordVmExecutionMetrics(bool prepared, bool completed, int commandsExecuted, int resolvedParamCount, long startTimestamp)
        {
            LastExecutionUsedPrepared = prepared;
            LastExecutionCompleted = completed;
            LastExecutionCommandCount = commandsExecuted;
            LastExecutionResolvedParamCount = resolvedParamCount;
            LastExecutionTicks = startTimestamp == 0 ? 0 : Stopwatch.GetTimestamp() - startTimestamp;

            if (GlobalModules.EnableVmMetrics)
            {
                double elapsedMs = startTimestamp == 0 ? 0 : LastExecutionTicks * 1000.0 / Stopwatch.Frequency;
                GlobalModules.VmMetricLog($"[VM EXEC] mode={(prepared ? "prepared" : "raw")} script='{ScriptName}' completed={(completed ? 1 : 0)} commands={commandsExecuted} resolvedParams={resolvedParamCount} elapsedMs={elapsedMs:F3} codePos={_codePos}\n");
            }
        }

        internal void MarkExecutionWatchdogActivity()
        {
            unchecked
            {
                _executionWatchdogActivityCounter++;
            }
        }

        private void CheckExecutionWatchdog(
            int commandsExecuted,
            ref int watchdogCommandBaseline,
            ref long watchdogStartTimestamp,
            ref int watchdogActivityCounter)
        {
            if (!GlobalModules.ScriptInfiniteLoopProtectionEnabled)
                return;

            int currentActivityCounter = _executionWatchdogActivityCounter;
            if (currentActivityCounter != watchdogActivityCounter)
            {
                watchdogActivityCounter = currentActivityCounter;
                watchdogCommandBaseline = commandsExecuted;
                watchdogStartTimestamp = Stopwatch.GetTimestamp();
                return;
            }

            int commandsSinceActivity = commandsExecuted - watchdogCommandBaseline;
            if (commandsSinceActivity < MIN_COMMANDS_PER_NO_IO_WATCHDOG_CHECK)
                return;

            if ((commandsSinceActivity & EXECUTION_WATCHDOG_CHECK_MASK) != 0)
                return;

            TimeSpan elapsed = Stopwatch.GetElapsedTime(watchdogStartTimestamp);
            if (elapsed >= MAX_EXECUTION_SLICE_DURATION)
            {
                throw new ScriptException(
                    $"Script '{ScriptName}' appears to be spinning without server I/O or pause " +
                    $"({commandsSinceActivity:N0} commands in {elapsed.TotalSeconds:F1}s).");
            }
        }

        private CmdParam[] GetDispatchParamBuffer(int paramCount)
        {
            if (!_dispatchParamCache.TryGetValue(paramCount, out var buffer))
            {
                buffer = new CmdParam[paramCount];
                _dispatchParamCache[paramCount] = buffer;
            }

            return buffer;
        }

        private ProgVarParam GetOrCreatePreparedProgVar(string progVarName)
        {
            if (!_progVarCache.TryGetValue(progVarName, out var progVar))
            {
                progVar = new ProgVarParam(progVarName, _owner);
                _progVarCache[progVarName] = progVar;
            }

            return progVar;
        }

        private static CmdParam GetOrCreatePreparedRuntimeParam(PreparedParam param)
        {
            param.RuntimeParam ??= new CmdParam();
            return param.RuntimeParam;
        }

        private ProgVarParam GetOrCreatePreparedRuntimeProgVar(PreparedParam param)
        {
            if (param.RuntimeParam is not ProgVarParam progVar)
            {
                progVar = new ProgVarParam(param.ProgVarName, _owner);
                param.RuntimeParam = progVar;
            }

            return progVar;
        }

        private ScriptSysConst? ResolveRuntimeSysConst(ushort sysConstId)
        {
            ScriptRef? scriptRef = _owner.ScriptRef;
            if (scriptRef == null)
                return null;

            if (sysConstId >= scriptRef.SysConstCount)
            {
                if (GlobalModules.VerboseDebugMode)
                {
                    GlobalModules.DebugLog($"[SYSCONST] Missing runtime sysconst id={sysConstId} knownCount={scriptRef.SysConstCount} script='{ScriptName}'\n");
                }

                return null;
            }

            return scriptRef.GetSysConst(sysConstId);
        }

        private static CmdParam[] GetOrCreatePreparedDispatchParams(PreparedInstruction instruction)
        {
            if (instruction.Params.Length == 0)
                return Array.Empty<CmdParam>();

            instruction.RuntimeDispatchParams ??= new CmdParam[instruction.Params.Length];
            return instruction.RuntimeDispatchParams;
        }

        private void InitializePreparedDirectParams(PreparedInstruction instruction, CmdParam[] dispatchParams)
        {
            for (int i = 0; i < instruction.Params.Length; i++)
            {
                PreparedParam param = instruction.Params[i];
                if (!param.IsDirectReference)
                    continue;

                switch (param.ParamType)
                {
                    case ScriptConstants.PARAM_CONST:
                    case ScriptConstants.PARAM_CHAR:
                        {
                            CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                            runtimeParam.Value = param.LiteralValue;
                            dispatchParams[i] = runtimeParam;
                            break;
                        }

                    case ScriptConstants.PARAM_VAR:
                        dispatchParams[i] = param.CompiledParam ?? GetOrCreatePreparedRuntimeParam(param);
                        break;

                    case ScriptConstants.PARAM_PROGVAR:
                        dispatchParams[i] = GetOrCreatePreparedRuntimeProgVar(param);
                        break;

                    case ScriptConstants.PARAM_SYSCONST:
                        if (param.Indexes.Length == 0 &&
                            param.SysConst != null &&
                            (string.Equals(param.SysConst.Name, "TRUE", StringComparison.Ordinal) ||
                             string.Equals(param.SysConst.Name, "FALSE", StringComparison.Ordinal) ||
                             param.SysConst.Name.StartsWith("ANSI_", StringComparison.Ordinal)))
                        {
                            CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                            runtimeParam.Value = param.SysConst.Read(Array.Empty<string>());
                            dispatchParams[i] = runtimeParam;
                        }
                        break;
                }
            }

            instruction.DirectParamsInitialized = true;
        }

        private string[] RentPreparedIndexBuffer(int count)
        {
            if (count == 1)
            {
                return _preparedSingleIndexBuffers.Count > 0
                    ? _preparedSingleIndexBuffers.Pop()
                    : new string[1];
            }

            if (count == 2)
            {
                return _preparedDoubleIndexBuffers.Count > 0
                    ? _preparedDoubleIndexBuffers.Pop()
                    : new string[2];
            }

            if (!_preparedIndexBufferCache.TryGetValue(count, out var buffers))
            {
                buffers = new Stack<string[]>();
                _preparedIndexBufferCache[count] = buffers;
            }

            return buffers.Count > 0
                ? buffers.Pop()
                : new string[count];
        }

        private void ReturnPreparedIndexBuffer(string[] buffer, int count)
        {
            switch (count)
            {
                case 1:
                    buffer[0] = string.Empty;
                    _preparedSingleIndexBuffers.Push(buffer);
                    return;

                case 2:
                    buffer[0] = string.Empty;
                    buffer[1] = string.Empty;
                    _preparedDoubleIndexBuffers.Push(buffer);
                    return;

                default:
                    Array.Clear(buffer, 0, count);
                    _preparedIndexBufferCache[count].Push(buffer);
                    return;
            }
        }

        private static bool ShouldSuppressArrayAccessError(string message, IEnumerable<string> indexValues)
        {
            if (string.IsNullOrEmpty(message))
            {
                return false;
            }

            return message.IndexOf("Static array index '0' is out of range", StringComparison.OrdinalIgnoreCase) >= 0 &&
                   indexValues.Any(index => string.Equals(index, "0", StringComparison.Ordinal));
        }

        private void FillPreparedIndexBuffer(PreparedParam[] indexes, string[] buffer)
        {
            switch (indexes.Length)
            {
                case 1:
                    buffer[0] = EvaluatePreparedIndexValue(indexes[0]);
                    return;

                case 2:
                    buffer[0] = EvaluatePreparedIndexValue(indexes[0]);
                    buffer[1] = EvaluatePreparedIndexValue(indexes[1]);
                    return;

                default:
                    for (int i = 0; i < indexes.Length; i++)
                        buffer[i] = EvaluatePreparedIndexValue(indexes[i]);
                    return;
            }
        }

        private string EvaluatePreparedArithmeticValue(PreparedParam param)
        {
            if (!param.HasArithmeticExpression || param.ArithmeticBaseVar == null)
                return string.Empty;

            double.TryParse(
                param.ArithmeticBaseVar.Value,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out double baseVal);

            double rhs = param.ArithmeticRightValue;
            double result = param.ArithmeticOperator switch
            {
                '+' => baseVal + rhs,
                '-' => baseVal - rhs,
                '*' => baseVal * rhs,
                '/' when rhs != 0 => baseVal / rhs,
                _ => baseVal
            };

            long intResult = (long)result;
            return result == intResult
                ? intResult.ToString()
                : result.ToString("R", CultureInfo.InvariantCulture);
        }

        private string EvaluatePreparedIndexValue(PreparedParam param)
        {
            switch (param.ParamType)
            {
                case ScriptConstants.PARAM_CONST:
                    return NormalizePreparedIndexValue(param.LiteralValue);

                case ScriptConstants.PARAM_VAR:
                    if (param.HasArithmeticExpression)
                        return NormalizePreparedIndexValue(EvaluatePreparedArithmeticValue(param));

                    if (param.CompiledParam != null)
                    {
                        return NormalizePreparedIndexValue(EvaluatePreparedArrayIndexes(param.Indexes, param.CompiledParam).Value);
                    }
                    return string.Empty;

                case ScriptConstants.PARAM_PROGVAR:
                    if (param.ProgVarName.Length > 0)
                    {
                        var progVar = GetOrCreatePreparedProgVar(param.ProgVarName);
                        return NormalizePreparedIndexValue(EvaluatePreparedArrayIndexes(param.Indexes, progVar).Value);
                    }
                    return string.Empty;

                case ScriptConstants.PARAM_SYSCONST:
                    {
                        ScriptSysConst? sysConst = param.SysConst ?? ResolveRuntimeSysConst(param.SysConstId);
                        if (sysConst == null)
                            return string.Empty;

                        if (param.Indexes.Length == 0)
                            return NormalizePreparedIndexValue(sysConst.Read(Array.Empty<string>()));

                        string[] indexValues = RentPreparedIndexBuffer(param.Indexes.Length);
                        try
                        {
                            FillPreparedIndexBuffer(param.Indexes, indexValues);
                            return NormalizePreparedIndexValue(sysConst.Read(indexValues));
                        }
                        finally
                        {
                            ReturnPreparedIndexBuffer(indexValues, param.Indexes.Length);
                        }
                    }

                case ScriptConstants.PARAM_CHAR:
                    return param.LiteralValue;

                default:
                    return string.Empty;
            }
        }

        private CmdParam EvaluatePreparedArrayIndexes(PreparedParam[] indexes, CmdParam baseParam)
        {
            if (indexes.Length == 0)
                return baseParam;

            if (baseParam is not VarParam varParam)
                return baseParam;

            string[] indexValues = RentPreparedIndexBuffer(indexes.Length);

            try
            {
                FillPreparedIndexBuffer(indexes, indexValues);
                var result = varParam.GetIndexVar(indexValues);

                string traceName = varParam.Name ?? string.Empty;
                bool traceSectorLookup =
                    traceName.IndexOf("CURSECTOR", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    traceName.IndexOf("THISSECTOR", StringComparison.OrdinalIgnoreCase) >= 0;
                if (GlobalModules.VerboseDebugMode && traceSectorLookup)
                {
                    GlobalModules.DebugLog($"[ARRAY TRACE] base='{traceName}' indexes=[{string.Join(", ", indexValues)}] resultName='{(result as VarParam)?.Name ?? result.Value}' resultValue='{result.Value}'\n");
                }

                return result;
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog(
                    $"[Array Access Error] base='{varParam.Name}' indexes=[{string.Join(", ", indexValues)}] message='{ex.Message}'\n");
                if (!ShouldSuppressArrayAccessError(ex.Message, indexValues))
                {
                    ScriptDiagnosticOutput.Write($"[Array Access Error] {ex.Message}\r\n");
                }
                return baseParam;
            }
            finally
            {
                ReturnPreparedIndexBuffer(indexValues, indexes.Length);
            }
        }

        private CmdParam EvaluatePreparedParam(PreparedParam param)
        {
            switch (param.ParamType)
            {
                case ScriptConstants.PARAM_CONST:
                    {
                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = param.LiteralValue;
                        return runtimeParam;
                    }

                case ScriptConstants.PARAM_VAR:
                    if (param.HasArithmeticExpression)
                    {
                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = EvaluatePreparedArithmeticValue(param);
                        return runtimeParam;
                    }

                    if (param.Indexes.Length == 0 && param.CompiledParam != null)
                        return param.CompiledParam;

                    if (param.CompiledParam != null)
                    {
                        return EvaluatePreparedArrayIndexes(param.Indexes, param.CompiledParam);
                    }
                    {
                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = string.Empty;
                        return runtimeParam;
                    }

                case ScriptConstants.PARAM_PROGVAR:
                    if (param.ProgVarName.Length > 0)
                    {
                        var progVar = GetOrCreatePreparedRuntimeProgVar(param);
                        return EvaluatePreparedArrayIndexes(param.Indexes, progVar);
                    }
                    {
                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = string.Empty;
                        return runtimeParam;
                    }

                case ScriptConstants.PARAM_SYSCONST:
                    {
                        ScriptSysConst? sysConst = param.SysConst ?? ResolveRuntimeSysConst(param.SysConstId);
                        if (sysConst == null)
                        {
                            CmdParam missingParam = GetOrCreatePreparedRuntimeParam(param);
                            missingParam.Value = string.Empty;
                            return missingParam;
                        }

                        string constValue;
                        if (param.Indexes.Length == 0)
                        {
                            constValue = sysConst.Read(Array.Empty<string>());
                        }
                        else
                        {
                            string[] indexValues = RentPreparedIndexBuffer(param.Indexes.Length);
                            try
                            {
                                FillPreparedIndexBuffer(param.Indexes, indexValues);
                                constValue = sysConst.Read(indexValues);
                            }
                            finally
                            {
                                ReturnPreparedIndexBuffer(indexValues, param.Indexes.Length);
                            }
                        }

                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = constValue;
                        return runtimeParam;
                    }

                case ScriptConstants.PARAM_CHAR:
                    {
                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = param.LiteralValue;
                        return runtimeParam;
                    }

                default:
                    {
                        CmdParam runtimeParam = GetOrCreatePreparedRuntimeParam(param);
                        runtimeParam.Value = string.Empty;
                        return runtimeParam;
                    }
            }
        }

        private void LoadPreparedParamsIntoLegacyBuffer(PreparedInstruction instruction)
        {
            _cmdParams.Clear();

            PreparedParam[] parameters = instruction.Params;
            for (int i = 0; i < parameters.Length; i++)
                _cmdParams.Add(EvaluatePreparedParam(parameters[i]));
        }

        private bool ExecuteLegacyParsed(PreparedScriptProgram prepared)
        {
            var server = GlobalModules.TWXServer;
            IExecutionObserver? observer = ExecutionObserver;
            long metricsStart = GlobalModules.EnableVmMetrics ? Stopwatch.GetTimestamp() : 0;
            long executionWatchdogStart = Stopwatch.GetTimestamp();
            int executionWatchdogCommandBaseline = 0;
            int executionWatchdogActivityCounter = _executionWatchdogActivityCounter;
            int commandsExecuted = 0;
            int resolvedParamCount = 0;
            _isExecuting = true;
            Script? previousExecutingScript = ScriptRef.GetExecutingScript();
            ScriptRef.SetExecutingScript(this);

            bool Finish(bool completed)
            {
                _execScriptID = 0;
                ClearCurrentSourceLocation();
                _isExecuting = false;
                ScriptRef.SetExecutingScript(previousExecutingScript);
                RecordVmExecutionMetrics(false, completed, commandsExecuted, resolvedParamCount, metricsStart);
                if (completed && _forceStopRequested)
                    _owner.StopByHandle(this);
                return completed;
            }

            if (ShouldAbortForForceStop())
            {
                _codePos = prepared.CodeLength;
                return Finish(true);
            }

            _execScriptID = 0;
            ClearCurrentSourceLocation();

            if (_codePos >= prepared.CodeLength)
                return Finish(true);

            if (!prepared.TryGetInstructionIndex(_codePos, out int instructionIndex))
            {
                if (_codePos == prepared.CodeLength)
                    return Finish(true);

                throw new Exception($"Legacy parser could not locate prepared instruction for code position {_codePos}");
            }

            byte[] code = _cmp?.Code ?? Array.Empty<byte>();

            try
            {
                while (instructionIndex < prepared.Instructions.Length)
                {
                    if (ShouldAbortForForceStop())
                    {
                        _codePos = prepared.CodeLength;
                        return Finish(true);
                    }

                    PreparedInstruction instruction = prepared.Instructions[instructionIndex];
                    _execScriptID = instruction.ScriptId;
                    SetCurrentSourceLocation(instruction.ScriptId, instruction.LineNumber, instruction.RawOffset);
                    _codePos = instruction.RawEndOffset;

                    if (instruction.IsLabel)
                    {
                        if (_codePos >= prepared.CodeLength)
                            return Finish(true);

                        instructionIndex = instruction.NextInstructionIndex;
                        continue;
                    }

                    ushort cmdID = instruction.CommandId;
                    ScriptCmd? cmd = instruction.Command;
                    string commandName = instruction.CommandName;

                    LoadPreparedParamsIntoLegacyBuffer(instruction);

                    if (GlobalModules.VerboseDebugMode && commandName == "GOTO" && _cmdParams.Count > 0)
                    {
                        string ns = _cmp?.GetScriptNamespace(_execScriptID) ?? string.Empty;
                        GlobalModules.DebugLog($"[Execute/GOTO] raw='{_cmdParams[0].Value}' execScriptID={_execScriptID} ns='{ns}' codePos={_codePos}\n");
                    }

                    if (_owner.ScriptRef == null)
                        throw new Exception("ScriptRef not initialized");

                    if (cmd == null)
                    {
                        if (cmdID >= _owner.ScriptRef.CmdCount)
                            ScriptDiagnosticOutput.Write(server, $"Warning: Command ID {cmdID} not found (max={_owner.ScriptRef.CmdCount - 1}), skipping\r\n");

                        goto NextInstruction;
                    }

                    if (_cmdParams.Count < cmd.MinParams)
                    {
                        var dbg = new System.Text.StringBuilder();
                        dbg.AppendLine($"ERROR: Command '{commandName}' (ID={cmdID}) requires at least {cmd.MinParams} parameters, but only {_cmdParams.Count} were provided.");
                        dbg.AppendLine($"  RawOffset={instruction.RawOffset}, RawEndOffset={instruction.RawEndOffset}, ScriptID={instruction.ScriptId}, Line={instruction.LineNumber}");
                        dbg.AppendLine($"  CodeLength={prepared.CodeLength}");
                        for (int pi = 0; pi < _cmdParams.Count; pi++)
                            dbg.AppendLine($"  Param[{pi}] = '{_cmdParams[pi].Value}'");

                        if (code.Length > 0)
                        {
                            int dumpStart = Math.Max(0, instruction.RawOffset);
                            int dumpLen = Math.Min(40, code.Length - dumpStart);
                            if (dumpLen > 0)
                                dbg.AppendLine($"  Bytes [{dumpStart}..{dumpStart + dumpLen - 1}]: {BitConverter.ToString(code, dumpStart, dumpLen)}");
                        }

                        File.AppendAllText("/tmp/twxproxy_debug.log", dbg.ToString());
                        goto NextInstruction;
                    }

                    if (commandName == "RETURN")
                    {
                        commandsExecuted++;
                        CheckExecutionWatchdog(commandsExecuted, ref executionWatchdogCommandBaseline, ref executionWatchdogStart, ref executionWatchdogActivityCounter);
                        if (GlobalModules.VerboseDebugMode)
                            GlobalModules.DebugLog($"[Execute] RETURN - popping substack (depth={_subStack.Count}, codePos={_codePos})\n");
                        long returnStart = observer != null ? Stopwatch.GetTimestamp() : 0;
                        Return();
                        if (observer != null)
                        {
                            observer.OnCommandExecuted(
                                false,
                                cmdID,
                                commandName,
                                _cmdParams.Count,
                                -1,
                                instruction.RawOffset,
                                Stopwatch.GetTimestamp() - returnStart);
                        }
                        if (GlobalModules.VerboseDebugMode)
                            GlobalModules.DebugLog($"[Execute] RETURN completed, new codePos={_codePos}, continuing execution\n");
                        goto NextInstruction;
                    }

                    if (cmd.OnCmd == null)
                        throw new Exception($"Command {commandName} has no handler");

                    if (GlobalModules.VerboseDebugMode)
                        GlobalModules.DebugLog($"[Dispatch] CMD={commandName} paramCount={_cmdParams.Count}\n");

                    CmdAction action;
                    long commandStart = observer != null ? Stopwatch.GetTimestamp() : 0;
                    try
                    {
                        CmdParam[] dispatchParams = GetDispatchParamBuffer(_cmdParams.Count);
                        for (int i = 0; i < _cmdParams.Count; i++)
                            dispatchParams[i] = _cmdParams[i];

                        commandsExecuted++;
                        CheckExecutionWatchdog(commandsExecuted, ref executionWatchdogCommandBaseline, ref executionWatchdogStart, ref executionWatchdogActivityCounter);
                        resolvedParamCount += _cmdParams.Count;
                        action = cmd.OnCmd(this, dispatchParams);
                    }
                    catch (Exception ex)
                    {
                        GlobalModules.DebugLog($"[Dispatch] EXCEPTION in {commandName}: {ex.Message}\n");
                        throw new ScriptException($"Error executing command '{commandName}': {ex.Message}", ex);
                    }

                    if (observer != null)
                    {
                        observer.OnCommandExecuted(
                            false,
                            cmdID,
                            commandName,
                            _cmdParams.Count,
                            -1,
                            instruction.RawOffset,
                            Stopwatch.GetTimestamp() - commandStart);
                    }

                    switch (action)
                    {
                        case CmdAction.Stop:
                            _codePos = prepared.CodeLength;
                            return Finish(true);

                        case CmdAction.Pause:
                            _paused = true;
                            if (_pausedReason == PauseReason.None)
                                _pausedReason = PauseReason.Command;
                            _resetLoopDetectionOnNextExecute = true;
                            if (GlobalModules.VerboseDebugMode)
                                GlobalModules.DebugLog($"[PAUSED_BY] cmd='{commandName}' id={cmdID}\n");
                            return Finish(false);

                        case CmdAction.Auth:
                            _waitingForAuth = true;
                            _pausedReason = PauseReason.Auth;
                            _resetLoopDetectionOnNextExecute = true;
                            return Finish(false);
                    }

                NextInstruction:
                    if (_codePos >= prepared.CodeLength)
                        return Finish(true);

                    if (_codePos == instruction.RawEndOffset)
                    {
                        instructionIndex = instruction.NextInstructionIndex;
                        continue;
                    }

                    if (!prepared.TryGetInstructionIndex(_codePos, out instructionIndex))
                        throw new Exception($"Legacy parser could not locate prepared instruction for code position {_codePos}");
                }

                return Finish(true);
            }
            catch (ScriptException ex)
            {
                string formattedMessage = FormatScriptErrorMessage(ex.Message);
                string msg = $"[Script.ExecuteLegacyParsed] Script exception at pos {_codePos}: {formattedMessage}";
                Console.WriteLine(msg);
                GlobalModules.DebugLog(msg + "\n");
                if (ex.InnerException != null)
                {
                    string innerMsg = $"[Script.ExecuteLegacyParsed] Inner: {ex.InnerException.Message}";
                    Console.WriteLine(innerMsg);
                    GlobalModules.DebugLog(innerMsg + "\n");
                }
                ScriptDiagnosticOutput.Write($"\r\n[Script error] {formattedMessage}\r\n");
                _codePos = prepared.CodeLength;
                return Finish(true);
            }
            catch (Exception ex)
            {
                string formattedMessage = FormatScriptErrorMessage(ex.Message);
                string msg = $"[Script.ExecuteLegacyParsed] Unexpected exception at pos {_codePos}: {formattedMessage}";
                Console.WriteLine(msg);
                Console.WriteLine($"[Script.ExecuteLegacyParsed] Stack trace: {ex.StackTrace}");
                GlobalModules.DebugLog(msg + "\n");
                ScriptDiagnosticOutput.Write($"\r\n[Script error] {formattedMessage}\r\n");
                _codePos = prepared.CodeLength;
                return Finish(true);
            }
        }

        private bool ExecutePrepared(PreparedScriptProgram prepared)
        {
            var server = GlobalModules.TWXServer;
            IExecutionObserver? observer = ExecutionObserver;
            long metricsStart = GlobalModules.EnableVmMetrics ? Stopwatch.GetTimestamp() : 0;
            long executionWatchdogStart = Stopwatch.GetTimestamp();
            int executionWatchdogCommandBaseline = 0;
            int executionWatchdogActivityCounter = _executionWatchdogActivityCounter;
            int commandsExecuted = 0;
            int resolvedParamCount = 0;
            _isExecuting = true;
            Script? previousExecutingScript = ScriptRef.GetExecutingScript();
            ScriptRef.SetExecutingScript(this);

            bool Finish(bool completed)
            {
                _execScriptID = 0;
                ClearCurrentSourceLocation();
                _isExecuting = false;
                ScriptRef.SetExecutingScript(previousExecutingScript);
                RecordVmExecutionMetrics(true, completed, commandsExecuted, resolvedParamCount, metricsStart);
                if (completed && _forceStopRequested)
                    _owner.StopByHandle(this);
                return completed;
            }

            if (ShouldAbortForForceStop())
            {
                _codePos = prepared.CodeLength;
                return Finish(true);
            }

            _execScriptID = 0;
            ClearCurrentSourceLocation();

            if (_codePos >= prepared.CodeLength)
                return Finish(true);

            if (!prepared.TryGetInstructionIndex(_codePos, out int instructionIndex))
            {
                if (_codePos == prepared.CodeLength)
                    return Finish(true);

                throw new Exception($"Prepared instruction not found for code position {_codePos}");
            }

            try
            {
                while (instructionIndex < prepared.Instructions.Length)
                {
                    if (ShouldAbortForForceStop())
                    {
                        _codePos = prepared.CodeLength;
                        return Finish(true);
                    }

                    PreparedInstruction instruction = prepared.Instructions[instructionIndex];
                    _execScriptID = instruction.ScriptId;
                    SetCurrentSourceLocation(instruction.ScriptId, instruction.LineNumber, instruction.RawOffset);
                    _codePos = instruction.RawEndOffset;

                    if (instruction.IsLabel)
                    {
                        if (_codePos >= prepared.CodeLength)
                            return Finish(true);

                        instructionIndex = instruction.NextInstructionIndex;
                        continue;
                    }

                    ushort cmdID = instruction.CommandId;
                    string commandName = instruction.CommandName;

                    if (instruction.Handler == null)
                    {
                        if (_owner.ScriptRef != null && cmdID >= _owner.ScriptRef.CmdCount)
                            ScriptDiagnosticOutput.Write(server, $"Warning: Command ID {cmdID} not found (max={_owner.ScriptRef.CmdCount - 1}), skipping\r\n");

                        goto NextInstruction;
                    }

                    CmdParam[] dispatchParams = GetOrCreatePreparedDispatchParams(instruction);
                    if (!instruction.DirectParamsInitialized)
                        InitializePreparedDirectParams(instruction, dispatchParams);

                    if (instruction.DynamicParamIndexes.Length == 0)
                    {
                        // All params are direct live references; nothing to refresh here.
                    }
                    else
                    {
                        for (int i = 0; i < instruction.DynamicParamIndexes.Length; i++)
                        {
                            int paramIndex = instruction.DynamicParamIndexes[i];
                            dispatchParams[paramIndex] = EvaluatePreparedParam(instruction.Params[paramIndex]);
                        }

                        resolvedParamCount += instruction.DynamicParamIndexes.Length;
                    }

                    if (GlobalModules.VerboseDebugMode && instruction.IsGotoCommand && instruction.Params.Length > 0)
                    {
                        string ns = _cmp?.GetScriptNamespace(_execScriptID) ?? string.Empty;
                        GlobalModules.DebugLog($"[Execute/GOTO] raw='{dispatchParams[0].Value}' execScriptID={_execScriptID} ns='{ns}' codePos={_codePos}\n");
                    }

                    if (instruction.Params.Length < instruction.MinParams)
                    {
                        var dbg = new System.Text.StringBuilder();
                        dbg.AppendLine($"ERROR: Command '{commandName}' (ID={cmdID}) requires at least {instruction.MinParams} parameters, but only {instruction.Params.Length} were provided.");
                        dbg.AppendLine($"  RawOffset={instruction.RawOffset}, RawEndOffset={instruction.RawEndOffset}, ScriptID={instruction.ScriptId}, Line={instruction.LineNumber}");
                        File.AppendAllText("/tmp/twxproxy_debug.log", dbg.ToString());
                        goto NextInstruction;
                    }

                    if (instruction.IsReturnCommand)
                    {
                        commandsExecuted++;
                        CheckExecutionWatchdog(commandsExecuted, ref executionWatchdogCommandBaseline, ref executionWatchdogStart, ref executionWatchdogActivityCounter);
                        if (GlobalModules.VerboseDebugMode)
                            GlobalModules.DebugLog($"[Execute] RETURN - popping substack (depth={_subStack.Count}, codePos={_codePos})\n");
                        long returnStart = observer != null ? Stopwatch.GetTimestamp() : 0;
                        Return();
                        if (observer != null)
                        {
                            observer.OnCommandExecuted(
                                true,
                                cmdID,
                                commandName,
                                instruction.Params.Length,
                                instruction.DynamicParamIndexes.Length,
                                instruction.RawOffset,
                                Stopwatch.GetTimestamp() - returnStart);
                        }
                        if (GlobalModules.VerboseDebugMode)
                            GlobalModules.DebugLog($"[Execute] RETURN completed, new codePos={_codePos}, continuing execution\n");
                        goto NextInstruction;
                    }

                    if (GlobalModules.VerboseDebugMode)
                        GlobalModules.DebugLog($"[Dispatch] CMD={commandName} paramCount={instruction.Params.Length}\n");

                    CmdAction action;
                    long commandStart = observer != null ? Stopwatch.GetTimestamp() : 0;
                    try
                    {
                        commandsExecuted++;
                        CheckExecutionWatchdog(commandsExecuted, ref executionWatchdogCommandBaseline, ref executionWatchdogStart, ref executionWatchdogActivityCounter);
                        action = instruction.Handler(this, dispatchParams);
                    }
                    catch (Exception ex)
                    {
                        GlobalModules.DebugLog($"[Dispatch] EXCEPTION in {commandName}: {ex.Message}\n");
                        throw new ScriptException($"Error executing command '{commandName}': {ex.Message}", ex);
                    }

                    if (observer != null)
                    {
                        observer.OnCommandExecuted(
                            true,
                            cmdID,
                            commandName,
                            instruction.Params.Length,
                            instruction.DynamicParamIndexes.Length,
                            instruction.RawOffset,
                            Stopwatch.GetTimestamp() - commandStart);
                    }

                    switch (action)
                    {
                        case CmdAction.Stop:
                            _codePos = prepared.CodeLength;
                            return Finish(true);

                        case CmdAction.Pause:
                            _paused = true;
                            if (_pausedReason == PauseReason.None)
                                _pausedReason = PauseReason.Command;
                            _resetLoopDetectionOnNextExecute = true;
                            if (GlobalModules.VerboseDebugMode)
                                GlobalModules.DebugLog($"[PAUSED_BY] cmd='{commandName}' id={cmdID}\n");
                            return Finish(false);

                        case CmdAction.Auth:
                            _waitingForAuth = true;
                            _pausedReason = PauseReason.Auth;
                            _resetLoopDetectionOnNextExecute = true;
                            return Finish(false);
                    }

                NextInstruction:
                    if (_codePos >= prepared.CodeLength)
                    {
                        return Finish(true);
                    }

                    if (_codePos == instruction.RawEndOffset)
                    {
                        instructionIndex = instruction.NextInstructionIndex;
                        continue;
                    }

                    if (!prepared.TryGetInstructionIndex(_codePos, out instructionIndex))
                        throw new Exception($"Prepared instruction not found for code position {_codePos}");
                }

                return Finish(true);
            }
            catch (ScriptException ex)
            {
                string formattedMessage = FormatScriptErrorMessage(ex.Message);
                string msg = $"[Script.ExecutePrepared] Script exception at pos {_codePos}: {formattedMessage}";
                Console.WriteLine(msg);
                GlobalModules.DebugLog(msg + "\n");
                if (ex.InnerException != null)
                {
                    string innerMsg = $"[Script.ExecutePrepared] Inner: {ex.InnerException.Message}";
                    Console.WriteLine(innerMsg);
                    GlobalModules.DebugLog(innerMsg + "\n");
                }
                ScriptDiagnosticOutput.Write($"\r\n[Script error] {formattedMessage}\r\n");
                _codePos = prepared.CodeLength;
                return Finish(true);
            }
            catch (Exception ex)
            {
                string formattedMessage = FormatScriptErrorMessage(ex.Message);
                string msg = $"[Script.ExecutePrepared] Unexpected exception at pos {_codePos}: {formattedMessage}";
                Console.WriteLine(msg);
                Console.WriteLine($"[Script.ExecutePrepared] Stack trace: {ex.StackTrace}");
                GlobalModules.DebugLog(msg + "\n");
                ScriptDiagnosticOutput.Write($"\r\n[Script error] {formattedMessage}\r\n");
                _codePos = prepared.CodeLength;
                return Finish(true);
            }
        }

        public bool Execute()
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(_owner.RuntimeContext);
            var server = GlobalModules.TWXServer;
            IExecutionObserver? observer = ExecutionObserver;
            long metricsStart = GlobalModules.EnableVmMetrics ? Stopwatch.GetTimestamp() : 0;
            long executionWatchdogStart = Stopwatch.GetTimestamp();
            int executionWatchdogCommandBaseline = 0;
            int executionWatchdogActivityCounter = _executionWatchdogActivityCounter;
            int commandsExecuted = 0;
            int resolvedParamCount = 0;
            _isExecuting = true;
            Script? previousExecutingScript = null;
            bool restoreExecutingScript = false;

            bool Finish(bool completed)
            {
                _execScriptID = 0;
                ClearCurrentSourceLocation();
                _isExecuting = false;
                if (restoreExecutingScript)
                    ScriptRef.SetExecutingScript(previousExecutingScript);
                RecordVmExecutionMetrics(false, completed, commandsExecuted, resolvedParamCount, metricsStart);
                if (completed && _forceStopRequested)
                    _owner.StopByHandle(this);
                return completed;
            }

            if (ShouldAbortForForceStop())
            {
                _codePos = _cmp?.Code.Length ?? _codePos;
                return Finish(true);
            }

            if (_resetLoopDetectionOnNextExecute)
            {
                _lastCodePos = -1;
                _loopCounter = 0;
                _lastLoopCheck = DateTime.MinValue;
                _resetLoopDetectionOnNextExecute = false;
            }

            // Loop detection: check if we're repeatedly hitting the same code position
            if (_codePos == _lastCodePos && (DateTime.Now - _lastLoopCheck).TotalMilliseconds < 100)
            {
                _loopCounter++;
                if (_loopCounter >= MAX_LOOP_ITERATIONS)
                {
                    GlobalModules.DebugLog($"[LOOPWARN] Script '{ScriptName}' repeated code position {_codePos} {_loopCounter} times in rapid succession\n");
                    _loopCounter = 0;  // Reset counter after warning
                }
            }
            else
            {
                _loopCounter = 0;  // Reset if we've moved or enough time passed
            }
            _lastCodePos = _codePos;
            _lastLoopCheck = DateTime.Now;

            // Don't execute if paused
            if (_paused)
            {
                return Finish(false);
            }

            if (_cmp == null)
            {
                return Finish(true); // No script loaded
            }

            ScriptCmp cmp = _cmp;
            ClearCurrentSourceLocation();

            if (PreferPreparedExecution)
            {
                PreparedScriptProgram? prepared = cmp.PrepareForExecution();
                if (prepared != null)
                    return ExecutePrepared(prepared);
            }
            else
            {
                PreparedScriptProgram? prepared = cmp.PrepareForExecution();
                if (prepared != null)
                    return ExecuteLegacyParsed(prepared);
            }

            byte[] code = cmp.Code;

            if (code.Length == 0 || _codePos >= code.Length)
            {
                return Finish(true); // No code or reached end
            }

            _execScriptID = 0;
            previousExecutingScript = ScriptRef.GetExecutingScript();
            restoreExecutingScript = true;
            ScriptRef.SetExecutingScript(this);

            try
            {
                // All supported compiled-script versions (2–7) currently use the same bytecode format:
                // ScriptID:Byte|LineNumber:Word|CmdID:Word|Params|0:Byte
                bool isOldFormat = true;

                // Execute bytecode until we hit a pause, stop, or end
                while (_codePos < code.Length)
                {
                    if (ShouldAbortForForceStop())
                    {
                        _codePos = code.Length;
                        return Finish(true);
                    }

                    ushort cmdID;
                    ushort lineNumber = 0;

                    if (isOldFormat)
                    {
                        // Old format: ScriptID + LineNumber + CmdID
                        if (_codePos + 5 > code.Length)
                            return Finish(true); // End of script

                        byte scriptID = code[_codePos++];
                        _execScriptID = scriptID;
                        lineNumber = BitConverter.ToUInt16(code, _codePos);
                        _codePos += 2;
                        cmdID = BitConverter.ToUInt16(code, _codePos);
                        _codePos += 2;
                        SetCurrentSourceLocation(scriptID, lineNumber, _codePos - 5);

                        // [Execute] per-instruction logging removed — too high-frequency.
                    }
                    else
                    {
                        // New format: PARAM_CMD + CmdID
                        byte paramType = code[_codePos++];
                        if (paramType != ScriptConstants.PARAM_CMD)
                            throw new Exception($"Expected command at position {_codePos - 1}, got param type {paramType}");

                        if (_codePos >= code.Length)
                            return Finish(true); // End of script

                        cmdID = code[_codePos++];
                    }

                    // Check for label (cmdID = 255)
                    if (cmdID == 255)
                    {
                        // Skip label ID
                        if (_codePos + 4 > code.Length)
                            return Finish(true);
                        _codePos += 4;
                        continue;
                    }

                    // Record where this command's params start (for error diagnostics)
                    int cmdStartPos = _codePos;

                    // Read parameters
                    _cmdParams.Clear();
                    int paramCount = 0;
                    while (_codePos < code.Length)
                    {
                        byte paramType = code[_codePos];

                        // For old format, params are terminated by 0 byte, not PARAM_CMD
                        if (isOldFormat && paramType == 0)
                        {
                            _codePos++; // Skip terminator
                            break;
                        }

                        if (paramType == ScriptConstants.PARAM_CMD)
                            break; // Next command

                        _codePos++;
                        paramCount++;

                        // All versions use ParamList references; only command header format differs
                        if (paramType == ScriptConstants.PARAM_CONST || paramType == ScriptConstants.PARAM_VAR)
                        {
                            // Read 32-bit parameter ID
                            if (_codePos + 4 > code.Length)
                                return Finish(true);

                            int paramID = BitConverter.ToInt32(code, _codePos);
                            _codePos += 4;

                            // For older file versions, parameters might be embedded differently
                            // Create a placeholder if parameter doesn't exist
                            if (paramID < 0 || paramID >= cmp.ParamList.Count)
                            {
                                ScriptDiagnosticOutput.Write(server, $"Warning: Parameter ID {paramID} not found in list (count={cmp.ParamList.Count}), using empty string\r\n");
                                Console.WriteLine($"Warning: Parameter ID {paramID} not found in ParamList (count={cmp.ParamList.Count})");

                                // Skip array index data if it's a VAR type
                                if (paramType == ScriptConstants.PARAM_VAR)
                                {
                                    SkipArrayIndexes(code, ref _codePos);
                                }

                                var placeholder = GetScratchParam(_cmdParams.Count, string.Empty);
                                _cmdParams.Add(placeholder);
                            }
                            else
                            {
                                CmdParam param = cmp.ParamList[paramID];

                                // Evaluate array subscripts if this is a variable
                                if (paramType == ScriptConstants.PARAM_VAR)
                                {
                                    // Pascal TWX convention: variable names like "$foo+1" represent
                                    // arithmetic expressions; evaluate them against the base var now.
                                    if (param is VarParam vpArith)
                                    {
                                        var arithResult = EvaluateArithExprVar(vpArith);
                                        if (arithResult != null)
                                        {
                                            // Skip the (zero) index count bytes and add the computed value.
                                            SkipArrayIndexes(code, ref _codePos);
                                            _cmdParams.Add(arithResult);
                                            goto nextParam;
                                        }
                                    }

                                    if (GlobalModules.VerboseDebugMode && param is VarParam vp)
                                    {
                                        GlobalModules.DebugLog($"[PreEval] VAR param '{vp.Name}' = '{vp.Value}', paramID={paramID}, objID={param.GetHashCode():X8}, about to eval array indexes\n");
                                    }

                                    param = EvaluateArrayIndexes(code, ref _codePos, param);

                                    if (GlobalModules.VerboseDebugMode && param is VarParam vp2)
                                    {
                                        GlobalModules.DebugLog($"[PostEval] VAR param '{vp2.Name}' = '{vp2.Value}', paramID={paramID}, objID={param.GetHashCode():X8}\n");
                                    }
                                }

                                if (paramType == ScriptConstants.PARAM_CONST)
                                {
                                    // Pascal passes per-command parameter values, so mutating a
                                    // constant parameter during execution must not rewrite the
                                    // shared compiled ParamList entry for later commands.
                                    _cmdParams.Add(GetScratchParam(_cmdParams.Count, param.Value));
                                }
                                else
                                {
                                    _cmdParams.Add(param);
                                }

                                // Debug: show variable names for PARAM_VAR (only if enabled)
                                if (_enableVariableDebug && paramType == ScriptConstants.PARAM_VAR && param is VarParam varParam)
                                {
                                    ScriptDiagnosticOutput.Write(server, $"  [VAR {paramID}] = {varParam.Name} (value='{varParam.Value}')\r\n");
                                }
                            }
                        }
                        else if (paramType == ScriptConstants.PARAM_SYSCONST)
                        {
                            // System constant - read 2-byte ID and lookup
                            if (_codePos + 2 > code.Length)
                                return Finish(true);

                            ushort constID = BitConverter.ToUInt16(code, _codePos);
                            _codePos += 2;

                            // Evaluate array indexes so indexed sysconsts like PORT.CLASS[$CurSector]
                            // receive the actual runtime index values.
                            string[] sysConstIndexValues = EvaluateSysConstIndexes(code, ref _codePos);

                            if (_owner.ScriptRef == null)
                                throw new Exception("ScriptRef not initialized");

                            var sysConst = ResolveRuntimeSysConst(constID);
                            string constValue = sysConst?.Read(sysConstIndexValues) ?? string.Empty;
                            var constParam = GetScratchParam(_cmdParams.Count, constValue);
                            _cmdParams.Add(constParam);
                        }
                        else if (paramType == ScriptConstants.PARAM_PROGVAR)
                        {
                            // Program variable - read from ParamList like other params
                            if (_codePos + 4 > code.Length)
                                return Finish(true);

                            int paramID = BitConverter.ToInt32(code, _codePos);
                            _codePos += 4;

                            // Skip array index data using proper format (type + data per index)
                            SkipArrayIndexes(code, ref _codePos);

                            if (_owner.ScriptRef == null)
                                throw new Exception("ScriptRef not initialized");

                            // Get the parameter containing the program variable name
                            string progVarName = "";
                            if (paramID >= 0 && paramID < cmp.ParamList.Count)
                            {
                                var param = cmp.ParamList[paramID];
                                progVarName = param is VarParam vp ? vp.Name : param.Value;
                            }

                            // Create a ProgVarParam that reads/writes to storage automatically
                            var progVarParam = GetOrCreatePreparedProgVar(progVarName);
                            _cmdParams.Add(progVarParam);
                        }
                        else if (paramType == ScriptConstants.PARAM_CHAR)
                        {
                            if (_codePos >= code.Length)
                                return Finish(true);

                            byte charCode = code[_codePos++];
                            var charParam = GetScratchParam(_cmdParams.Count, ((char)charCode).ToString());
                            _cmdParams.Add(charParam);
                        }
                        else
                        {
                            // Unknown parameter type - this indicates either:
                            // 1. Unimplemented parameter type
                            // 2. Bytecode misalignment 
                            // 3. Corrupted script file
                            ScriptDiagnosticOutput.Write(server, $"ERROR: Unknown parameter type {paramType} (0x{paramType:X2}, ASCII:'{(char)paramType}') at position {_codePos - 1}\r\n");
                            ScriptDiagnosticOutput.Write(server, $"  Current command ID: {cmdID}\r\n");
                            ScriptDiagnosticOutput.Write(server, $"  Parameters read so far: {paramCount - 1}\r\n");

                            int prevStart = Math.Max(0, _codePos - 17);
                            int prevLen = Math.Min(16, _codePos - 1 - prevStart);
                            if (prevLen > 0)
                                ScriptDiagnosticOutput.Write(server, $"  Previous {prevLen} bytes: {BitConverter.ToString(code, prevStart, prevLen)}\r\n");

                            int nextLen = Math.Min(16, code.Length - _codePos);
                            if (nextLen > 0)
                                ScriptDiagnosticOutput.Write(server, $"  Next {nextLen} bytes: {BitConverter.ToString(code, _codePos, nextLen)}\r\n");

                            // This is a fatal error - we cannot safely continue
                            throw new Exception($"Unknown parameter type {paramType} (0x{paramType:X2}, ASCII:'{(char)paramType}') at position {_codePos - 1}. Cannot safely parse remaining bytecode.");
                        }
                    nextParam:;  // jump target used by arithmetic-expression variable evaluation
                    }

                    if (_owner.ScriptRef == null)
                        throw new Exception("ScriptRef not initialized");

                    // Execute command (with bounds checking for compatibility)
                    if (cmdID >= _owner.ScriptRef.CmdCount)
                    {
                        ScriptDiagnosticOutput.Write(server, $"Warning: Command ID {cmdID} not found (max={_owner.ScriptRef.CmdCount - 1}), skipping\r\n");
                        continue; // Skip unknown commands for version compatibility
                    }

                    var cmd = _owner.ScriptRef.GetCmd(cmdID);
                    string commandName = cmd.Name;

                    if (GlobalModules.VerboseDebugMode && commandName == "GOTO" && _cmdParams.Count > 0)
                    {
                        string ns = _cmp?.GetScriptNamespace(_execScriptID) ?? string.Empty;
                        GlobalModules.DebugLog($"[Execute/GOTO] raw='{_cmdParams[0].Value}' execScriptID={_execScriptID} ns='{ns}' codePos={_codePos}\n");
                    }

                    // Validate minimum parameter count before executing
                    if (_cmdParams.Count < cmd.MinParams)
                    {
                        var _dbgSb = new System.Text.StringBuilder();
                        _dbgSb.AppendLine($"ERROR: Command '{commandName}' (ID={cmdID}) requires at least {cmd.MinParams} parameters, but only {_cmdParams.Count} were provided.");
                        int dumpStart = Math.Max(0, cmdStartPos - 20);
                        int dumpLen = Math.Min(40, code.Length - dumpStart);
                        _dbgSb.AppendLine($"  Code pos: cmdStart={cmdStartPos}, current={_codePos}, total={code.Length}");
                        _dbgSb.AppendLine($"  Bytes [{dumpStart}..{dumpStart + dumpLen - 1}]: {BitConverter.ToString(code, dumpStart, dumpLen)}");
                        for (int pi = 0; pi < _cmdParams.Count; pi++)
                            _dbgSb.AppendLine($"  Param[{pi}] = '{_cmdParams[pi].Value}'");
                        if (_codePos < code.Length)
                        {
                            int nextLen = Math.Min(10, code.Length - _codePos);
                            _dbgSb.AppendLine($"  Next {nextLen} bytes at {_codePos}: {BitConverter.ToString(code, _codePos, nextLen)}");
                        }
                        File.AppendAllText("/tmp/twxproxy_debug.log", _dbgSb.ToString());
                        continue;
                    }

                    // Handle RETURN before dispatch - stack/flow is maintained by Script itself.
                    if (commandName == "RETURN")
                    {
                        commandsExecuted++;
                        CheckExecutionWatchdog(commandsExecuted, ref executionWatchdogCommandBaseline, ref executionWatchdogStart, ref executionWatchdogActivityCounter);
                        if (GlobalModules.VerboseDebugMode)
                            GlobalModules.DebugLog($"[Execute] RETURN - popping substack (depth={_subStack.Count}, codePos={_codePos})\n");
                        long returnStart = observer != null ? Stopwatch.GetTimestamp() : 0;
                        Return();
                        if (observer != null)
                        {
                            observer.OnCommandExecuted(
                                false,
                                cmdID,
                                commandName,
                                _cmdParams.Count,
                                -1,
                                cmdStartPos - 5,
                                Stopwatch.GetTimestamp() - returnStart);
                        }
                        if (GlobalModules.VerboseDebugMode)
                            GlobalModules.DebugLog($"[Execute] RETURN completed, new codePos={_codePos}, continuing execution\n");
                        continue;
                    }

                    if (cmd.OnCmd == null)
                        throw new Exception($"Command {commandName} has no handler");

                    if (GlobalModules.VerboseDebugMode)
                        GlobalModules.DebugLog($"[Dispatch] CMD={commandName} paramCount={_cmdParams.Count}\n");
                    CmdAction action;
                    long commandStart = observer != null ? Stopwatch.GetTimestamp() : 0;
                    try
                    {
                        CmdParam[] dispatchParams = GetDispatchParamBuffer(_cmdParams.Count);
                        for (int i = 0; i < _cmdParams.Count; i++)
                            dispatchParams[i] = _cmdParams[i];

                        commandsExecuted++;
                        CheckExecutionWatchdog(commandsExecuted, ref executionWatchdogCommandBaseline, ref executionWatchdogStart, ref executionWatchdogActivityCounter);
                        resolvedParamCount += _cmdParams.Count;
                        action = cmd.OnCmd(this, dispatchParams);
                    }
                    catch (Exception ex)
                    {
                        GlobalModules.DebugLog($"[Dispatch] EXCEPTION in {commandName}: {ex.Message}\n");
                        throw new ScriptException($"Error executing command '{commandName}': {ex.Message}", ex);
                    }

                    if (observer != null)
                    {
                        observer.OnCommandExecuted(
                            false,
                            cmdID,
                            commandName,
                            _cmdParams.Count,
                            -1,
                            cmdStartPos - 5,
                            Stopwatch.GetTimestamp() - commandStart);
                    }

                    // Handle command actions
                    switch (action)
                    {
                        case CmdAction.Stop:
                            // Fast-forward _codePos to end so that HasCode becomes false.
                            // This prevents ActivateTriggers from calling Execute() again
                            // on the remaining bytecode after a "halt" command — which was
                            // the cause of the "No safe options!" infinite loop where halt
                            // fired but ActivateTriggers immediately re-ran the code after
                            // halt (send bestWarp, goto :Move, re-register triggers, loop).
                            _codePos = code.Length;
                            return Finish(true); // Terminate script

                        case CmdAction.Pause:
                            _paused = true;
                            if (_pausedReason == PauseReason.None)
                                _pausedReason = PauseReason.Command;
                            _resetLoopDetectionOnNextExecute = true;
                            if (GlobalModules.VerboseDebugMode)
                                GlobalModules.DebugLog($"[PAUSED_BY] cmd='{commandName}' id={cmdID}\n");
                            return Finish(false); // Pause execution

                        case CmdAction.Auth:
                            _waitingForAuth = true;
                            _pausedReason = PauseReason.Auth;
                            _resetLoopDetectionOnNextExecute = true;
                            return Finish(false); // Wait for authentication

                        case CmdAction.None:
                        default:
                            // Continue execution
                            break;
                    }
                }

                return Finish(true); // Reached end of script
            }
            catch (ScriptException ex)
            {
                // Script-level error — log and terminate the script gracefully.
                // Do NOT re-throw: propagating a ScriptException out of Execute() causes it
                // to bubble up through TextEvent → Network.ReadFromServerAsync, where it is
                // mistaken for a server I/O error and fires a spurious Disconnected event.
                string formattedMessage = FormatScriptErrorMessage(ex.Message);
                string msg = $"[Script.Execute] Script exception at pos {_codePos}: {formattedMessage}";
                Console.WriteLine(msg);
                GlobalModules.DebugLog(msg + "\n");
                if (ex.InnerException != null)
                {
                    string innerMsg = $"[Script.Execute] Inner: {ex.InnerException.Message}";
                    Console.WriteLine(innerMsg);
                    GlobalModules.DebugLog(innerMsg + "\n");
                }
                ScriptDiagnosticOutput.Write($"\r\n[Script error] {formattedMessage}\r\n");
                _codePos = code.Length; // terminate this script
                return Finish(true);
            }
            catch (Exception ex)
            {
                // Unexpected exception — log, notify, and terminate the script gracefully.
                string formattedMessage = FormatScriptErrorMessage(ex.Message);
                string msg = $"[Script.Execute] Unexpected exception at pos {_codePos}: {formattedMessage}";
                Console.WriteLine(msg);
                Console.WriteLine($"[Script.Execute] Stack trace: {ex.StackTrace}");
                GlobalModules.DebugLog(msg + "\n");
                ScriptDiagnosticOutput.Write($"\r\n[Script error] {formattedMessage}\r\n");
                _codePos = code.Length; // terminate this script
                return Finish(true);
            }
        }

        private string NormalizeLabelLookup(string label)
        {
            if (_cmp == null)
                return label;

            string normalized = label ?? string.Empty;
            if (string.IsNullOrEmpty(normalized))
                throw new ScriptException($"Bad goto label '{label}'");

            if (!normalized.StartsWith(':'))
                normalized = ":" + normalized;

            if (normalized.Length < 2)
                throw new ScriptException($"Bad goto label '{label}'");

            normalized = normalized.ToUpperInvariant();

            // Labels should only ever use label namespacing rules.  Do not run them
            // through generic name handling, which is intended for variables and
            // values and should never interpret pieces of a label token.
            if (!normalized.Contains('~'))
                _cmp.ExtendLabelName(ref normalized, _execScriptID);
            else if (normalized.StartsWith(":~", StringComparison.Ordinal))
                normalized = ":" + normalized.Substring(2);

            return normalized.Substring(1);
        }

        public void GotoLabel(string label)
        {
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.DebugLog($"[GotoLabel] Attempting to goto label '{label}'\n");

            if (_cmp == null)
                throw new Exception("No script loaded");

            string normalized = NormalizeLabelLookup(label);
            int labelPos = _cmp.FindLabel(normalized);

            if (labelPos < 0)
            {
                GlobalModules.DebugLog($"[GotoLabel] ERROR: Label '{label}' normalized='{normalized}' execScriptID={_execScriptID} not found in script\n");

                string ns = _cmp.GetScriptNamespace(_execScriptID);
                if (!string.IsNullOrEmpty(ns))
                {
                    string prefix = ns + "~";
                    var nsLabels = _cmp.LabelList
                        .Where(l => l.Name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                        .Select(l => l.Name)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .Take(20)
                        .ToList();

                    GlobalModules.DebugLog($"[GotoLabel] Namespace '{ns}' sample labels ({nsLabels.Count}): {string.Join(", ", nsLabels)}\n");
                }

                string suffix = normalized;
                int tilde = normalized.IndexOf('~');
                if (tilde >= 0 && tilde + 1 < normalized.Length)
                    suffix = normalized.Substring(tilde + 1);

                var suffixLabels = _cmp.LabelList
                    .Where(l => l.Name.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
                    .Select(l => l.Name)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(20)
                    .ToList();
                GlobalModules.DebugLog($"[GotoLabel] Suffix '{suffix}' sample labels ({suffixLabels.Count}): {string.Join(", ", suffixLabels)}\n");

                throw new ScriptException($"Label '{label}' not found");
            }

            if (GlobalModules.VerboseDebugMode)
                GlobalModules.DebugLog($"[GotoLabel] Found label '{normalized}' at position {labelPos}\n");
            _codePos = labelPos;
        }

        public bool LabelExists(string label)
        {
            if (_cmp == null)
                return false;

            try
            {
                string normalized = NormalizeLabelLookup(label);
                return _cmp.FindLabel(normalized) >= 0;
            }
            catch (ScriptException)
            {
                return false;
            }
        }

        public void Gosub(string labelName)
        {
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.DebugLog($"[GOSUB] Called with label '{labelName}'\n");
            // Push current position and jump to label
            _subStack.Push(_codePos);
            GotoLabel(labelName);
        }

        public void GosubFromMenu(string labelName, bool resumeAfterMenu = false)
        {
            // Menu handlers fall into two groups:
            // - config/input handlers that should return to the menu runtime
            // - "start/execute" handlers that close the menu and resume the script
            if (resumeAfterMenu)
            {
                // Pascal menu "start" items run inside the existing `gosub :menu`
                // frame. They should jump into the script body and let the eventual
                // RETURN unwind the original menu call, not push a fresh return point
                // at the current paused code position (which can be EOF-adjacent).
                GotoLabel(labelName);
                return;
            }
            else
            {
                // When calling GOSUB from menu (not from bytecode), push a safe return position
                // that will cause Execute() to stop immediately when RETURN is hit.
                _nonResumingMenuHandlerDepths.Push(_subStack.Count);
                if (_cmp != null && _cmp.Code != null)
                {
                    _subStack.Push(_cmp.Code.Length);
                }
                else
                {
                    _subStack.Push(_codePos);
                }
            }
            GotoLabel(labelName);
        }

        public void Return()
        {
            if (_subStack.Count == 0)
            {
                if (_cmp?.Code != null)
                    _codePos = _cmp.Code.Length;
                return;
            }

            int returnPos = _subStack.Pop();
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.DebugLog($"[RETURN] Restoring codePos={returnPos}, remainingDepth={_subStack.Count}\n");
            _codePos = returnPos;
            CleanupCompletedMenuHandlerDepths();
        }

        public bool CompletePendingNonResumingMenuHandler()
        {
            if (_nonResumingMenuHandlerDepths.Count == 0)
                return false;

            int targetDepth = _nonResumingMenuHandlerDepths.Pop();
            while (_subStack.Count > targetDepth)
                _subStack.Pop();

            if (_cmp?.Code != null)
                _codePos = _cmp.Code.Length;

            GlobalModules.DebugLog(
                $"[MENU_HANDLER] Finalized non-resuming handler targetDepth={targetDepth} remainingDepth={_subStack.Count} codePos={_codePos}\n");
            CleanupCompletedMenuHandlerDepths();
            return true;
        }

        private void CleanupCompletedMenuHandlerDepths()
        {
            while (_nonResumingMenuHandlerDepths.Count > 0 &&
                   _subStack.Count <= _nonResumingMenuHandlerDepths.Peek())
            {
                _nonResumingMenuHandlerDepths.Pop();
            }
        }

        public void DumpVars(string searchName)
        {
            var server = GlobalModules.Server;
            if (server == null || _cmp == null)
                return;

            string scriptName = _cmp.ScriptFile;
            server.BroadcastLiteral($"\r\n{AnsiCodes.ANSI_15}Variables for {AnsiCodes.ANSI_7}{scriptName}{AnsiCodes.ANSI_15}\r\n");

            bool found = false;
            foreach (var param in _cmp.ParamList.OfType<VarParam>().OrderBy(p => p.Name, StringComparer.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrEmpty(searchName) &&
                    param.Name.IndexOf(searchName, StringComparison.OrdinalIgnoreCase) < 0)
                {
                    continue;
                }

                found = true;
                param.Dump("  ");
            }

            if (!found)
                server.BroadcastLiteral($"  {AnsiCodes.ANSI_8}No matching variables.\r\n");
        }

        public void DumpTriggers()
        {
            var server = GlobalModules.Server;
            if (server == null)
                return;

            server.BroadcastLiteral($"\r\n{AnsiCodes.ANSI_15}Triggers for {AnsiCodes.ANSI_7}{ScriptName}{AnsiCodes.ANSI_15}\r\n");

            bool found = false;
            lock (_triggerLock)
            {
                foreach (var triggerType in Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>())
                {
                    var triggerList = _triggers[triggerType];
                    if (triggerList.Count > 0)
                    {
                        found = true;
                        server.BroadcastLiteral($"  {AnsiCodes.ANSI_11}{triggerType}{AnsiCodes.ANSI_15}\r\n");
                        foreach (var trigger in triggerList)
                        {
                            server.BroadcastLiteral(
                                $"    {AnsiCodes.ANSI_7}{trigger.Name}{AnsiCodes.ANSI_15} = {AnsiCodes.ANSI_7}{trigger.Value}{AnsiCodes.ANSI_15}\r\n");
                        }
                    }
                }
            }

            if (!found)
                server.BroadcastLiteral($"  {AnsiCodes.ANSI_8}No active triggers.\r\n");
        }

        public IReadOnlyList<ScriptVariableInfo> GetVariableSnapshot()
        {
            var variables = new List<ScriptVariableInfo>();
            if (_cmp == null)
                return variables;

            foreach (var param in _cmp.ParamList.OfType<VarParam>())
            {
                AppendVariableSnapshot(variables, param, param.Name, 0);
            }

            return variables;
        }

        public IReadOnlyList<ScriptTriggerInfo> GetTriggerSnapshot()
        {
            var triggers = new List<ScriptTriggerInfo>();

            foreach (var triggerType in Enum.GetValues(typeof(TriggerType)).Cast<TriggerType>())
            {
                Trigger[] snapshot;
                lock (_triggerLock)
                {
                    snapshot = _triggers[triggerType].ToArray();
                }

                foreach (var trigger in snapshot)
                {
                    triggers.Add(new ScriptTriggerInfo(
                        triggerType,
                        trigger.Name,
                        trigger.Value,
                        trigger.LabelName,
                        trigger.Response,
                        trigger.Param,
                        trigger.LifeCycle));
                }
            }

            return triggers;
        }

        private static void AppendVariableSnapshot(
            List<ScriptVariableInfo> variables,
            VarParam param,
            string displayName,
            int depth)
        {
            string value;
            try
            {
                value = param.Value;
            }
            catch (Exception ex)
            {
                value = $"<error: {ex.Message}>";
            }

            variables.Add(new ScriptVariableInfo(
                displayName,
                value,
                param.Vars.Count > 0,
                depth));

            foreach (var child in param.Vars)
            {
                AppendVariableSnapshot(
                    variables,
                    child,
                    BuildIndexedVariableName(displayName, child.Name),
                    depth + 1);
            }
        }

        private static string BuildIndexedVariableName(string parentName, string childName)
        {
            if (string.IsNullOrWhiteSpace(parentName))
                return childName;

            if (int.TryParse(childName, out _))
                return $"{parentName}[{childName}]";

            string escaped = childName.Replace("\"", "\\\"");
            return $"{parentName}[\"{escaped}\"]";
        }

        public void SetVariable(string varName, string value, string index)
        {
            // Set a script variable (would require variable storage implementation)
            // Placeholder
        }

        public void InputCompleted(string inputText, object varParam)
        {
            // Input has just been completed - set the variable and resume execution
            if (varParam is CmdParam param)
            {
                param.Value = inputText;
            }

            // Unlock script and resume execution
            Locked = false;
            Execute();
        }

        /// <summary>
        /// Find a top-level named VarParam by name and set its value.
        /// Used to inject state (e.g. $doRelog=1) from calling code.
        /// </summary>
        public bool SetScriptVar(string varName, string value)
        {
            if (_cmp == null) return false;
            foreach (var param in _cmp.ParamList)
            {
                if (param is VarParam vp && vp.Name == varName && vp.Vars.Count == 0)
                {
                    string old = vp.Value;
                    vp.Value = value;
                    GlobalModules.DebugLog($"[FORCEVAR] {varName}: '{old}' -> '{value}'\n");
                    return true;
                }
            }
            return false;
        }

        public bool SetScriptVarIgnoreCase(string varName, string value)
        {
            if (_cmp == null) return false;
            foreach (var param in _cmp.ParamList)
            {
                if (param is VarParam vp &&
                    vp.Vars.Count == 0 &&
                    string.Equals(vp.Name, varName, StringComparison.OrdinalIgnoreCase))
                {
                    string old = vp.Value;
                    vp.Value = value;
                    GlobalModules.DebugLog($"[FORCEVAR] {vp.Name}: '{old}' -> '{value}'\n");
                    return true;
                }
            }

            return false;
        }

        public bool LocalInputEvent(string text)
        {
            // Handle input from local client (for GETINPUT command)
            string pname = (_inputVarParam is ProgVarParam pvp) ? $"PV:{pvp.Name}"
                         : (_inputVarParam is VarParam ivp) ? $"V:{ivp.Name}" : "null";
            GlobalModules.DebugLog($"[LIE] waiting={_waitingForInput} kpm={_keypressMode} var={pname} text='{text.TrimEnd('\r', '\n')}'\n");
            if (_waitingForInput && _inputVarParam != null)
            {
                string trimmed = text.TrimEnd('\r', '\n');

                // If the previous single-key handler opened another immediate
                // single-key wait (for example Mombot Tab-~ opening the
                // preferences menu), do not let the same physical keypress
                // satisfy both waits. The user should have to press the next
                // key explicitly.
                if (_keypressMode &&
                    _suppressNextNestedKeypressValue != null &&
                    string.Equals(trimmed, _suppressNextNestedKeypressValue, StringComparison.Ordinal))
                {
                    GlobalModules.DebugLog($"[LIE] Suppressing duplicated nested keypress '{trimmed}'\n");
                    _suppressNextNestedKeypressValue = null;
                    return false;
                }

                _suppressNextNestedKeypressValue = null;
                Console.WriteLine($"[Script.LocalInputEvent] Received input: '{text}', storing and resuming");

                // Store the input in the variable
                _inputVarParam.Value = trimmed;

                // When a credential variable is set via line-input (not keypress), persist it.
                if (!_keypressMode && _inputVarParam is VarParam credVp)
                {
                    string credName = credVp.Name;
                    if (credName == "$username" || credName == "$password" || credName == "$letter")
                    {
                        ScriptRef.TrackCredential(credName, trimmed);
                        GlobalModules.DebugLog($"[CRED] Saved {credName}='{trimmed}'\n");
                    }
                }

                // When Z is pressed in single-key mode (config menu), force the relog
                // flag into both the current script and the transient per-game loadvar
                // cache so the separately loaded relog script sees it.
                if (trimmed.Equals("Z", StringComparison.OrdinalIgnoreCase) && _keypressMode)
                {
                    SetScriptVar("$doRelog", "1");
                    SetScriptVar("$BOT~DORELOG", "1");
                    ScriptRef.SetCurrentGameVar("$doRelog", "1");
                    ScriptRef.SetCurrentGameVar("$BOT~DORELOG", "1");
                    GlobalModules.DebugLog("[Z-KEY] Set relog flags to '1' for current and next script\n");
                }

                // Clear waiting state
                _waitingForInput = false;
                _keypressMode = false;
                _echoKeypressInput = false;
                _inputVarParam = null;
                Locked = false;

                // Unpause the script before resuming
                _paused = false;

                // Resume script execution with continuation loop
                GlobalModules.DebugLog("[LocalInputEvent] Resuming script after input\n");
                bool completed = false;
                int iterations = 0;
                const int maxIterations = 1000;

                while (!completed && iterations < maxIterations)
                {
                    completed = Execute();
                    iterations++;

                    if (_paused || completed)
                        break;
                }

                // After script input completes, match TWX27 menu flow: GETINPUT /
                // GETCONSOLEINPUT uses a transient script-input menu. When that
                // input is answered, the previous script menu is not resurrected
                // implicitly; scripts that want the menu back open it themselves.
                if (GlobalModules.TWXMenu is MenuManager menuMgr)
                {
                    if (completed || _waitingForInput)
                    {
                        menuMgr.ClearSuspendedMenu();
                    }
                    else if (!completed && menuMgr.IsMenuOpen())
                    {
                        Console.WriteLine($"[Script.LocalInputEvent] Menu open after handler, re-pausing");
                        _paused = true;
                        _resetLoopDetectionOnNextExecute = true;

                        if (menuMgr.HasSuspendedMenu)
                            menuMgr.ClearSuspendedMenu();
                    }
                    else if (menuMgr.HasSuspendedMenu)
                    {
                        menuMgr.ClearSuspendedMenu();
                    }
                }

                // When a keypress handler immediately opens another keypress
                // wait, suppress the same key from satisfying that new wait.
                if (!completed && _waitingForInput && _keypressMode)
                {
                    _suppressNextNestedKeypressValue = trimmed;
                    GlobalModules.DebugLog($"[LIE] Nested keypress wait armed; suppressing repeated key '{trimmed}' once\n");
                }

                return completed;
            }

            Console.WriteLine($"[Script.LocalInputEvent] Not waiting for input or inputVarParam is null");
            return false;
        }

        public void AddMenu(object menuItem)
        {
            _menuItemList.Add(menuItem);
        }

        public void AddWindow(IScriptWindow window)
        {
            _windowList.Add(window);
        }

        public void RemoveWindow(IScriptWindow window)
        {
            window.Dispose();
            _windowList.Remove(window);
        }

        public IScriptWindow? FindWindow(string windowName)
        {
            // Find window by name
            foreach (var window in _windowList)
            {
                if (window.Name.Equals(windowName, StringComparison.OrdinalIgnoreCase))
                {
                    return window;
                }
            }
            return null;
        }

        public void CompileLib()
        {
            // Compile library commands (complex implementation)
            // Placeholder
        }

        public void GetLibCmd(List<string> scriptText, string command)
        {
            // Get library command implementation (complex implementation)
            // Placeholder
        }

        // Properties
        public bool System { get; set; }
        public bool IsBot { get; set; }
        public string BotName { get; set; } = string.Empty;
        public bool TriggersActive { get; set; }
        public bool Locked { get; set; }
        // These properties wrap the private backing fields used by TextLineEvent/TextEvent,
        // so that CmdWaitFor/CmdWaitOn (in ScriptCmdImpl.cs) and the text-matching loop
        // both operate on the same state.
        public bool WaitForActive
        {
            get => _waitForActive;
            set => _waitForActive = value;
        }
        public string WaitText
        {
            get => _waitText;
            set => _waitText = value;
        }

        public void SetWaitingForInput(CmdParam varParam, bool keypressMode = false, bool echoKeypressInput = false)
        {
            Locked = true;
            _waitingForInput = true;
            _keypressMode = keypressMode;
            _echoKeypressInput = echoKeypressInput;
            _inputVarParam = varParam;
            _resetLoopDetectionOnNextExecute = true;
        }
        public string OutText => _outText;
        public bool Silent { get; set; }
        public bool Paused { get => _paused; set => _paused = value; }
        public PauseReason PausedReason { get => _pausedReason; set => _pausedReason = value; }
        public bool WaitingForInput => _waitingForInput;
        public bool WaitingForAuth => _waitingForAuth;
        public bool KeypressMode => _keypressMode;
        public bool EchoKeypressInput => _echoKeypressInput;
        public bool IsExecuting => _isExecuting;
        public bool LastLineHandled => _lastLineHandled;
        internal int PromptProbesHandledOnCurrentLine => _promptProbesHandledOnCurrentLine;
        internal void ResetPromptProbeForNextLine() => _promptProbesHandledOnCurrentLine = 0;
        public int SubStackDepth => _subStack.Count;
        public ModInterpreter Controller => _owner;
        public int ExecScript => _execScriptID;
        public object? Cmp => _cmp;
        public ScriptCmp? Compiler => _cmp;
        /// <summary>True when a script is loaded and has not yet run past end-of-bytecode.</summary>
        public bool HasCode => _cmp != null && _cmp.Code.Length > 0 && _codePos < _cmp.Code.Length;

        /// <summary>
        /// True when the script has any registered triggers or an active waitFor/waitOn.
        /// Used by ActivateTriggers to decide whether a code-exhausted script should be
        /// kept alive (it still needs to respond to events) or cleaned up.
        /// </summary>
        public bool HasActiveTriggers
        {
            get
            {
                lock (_triggerLock)
                    return _waitForActive || _triggers.Values.Any(list => list.Count > 0);
            }
        }
        public string? LoadEventName { get; set; }
        public bool PreferPreparedExecution { get; set; } = false;
        public IExecutionObserver? ExecutionObserver { get; set; }
        public long LastExecutionTicks { get; private set; }
        public int LastExecutionCommandCount { get; private set; }
        public int LastExecutionResolvedParamCount { get; private set; }
        public bool LastExecutionUsedPrepared { get; private set; }
        public bool LastExecutionCompleted { get; private set; }
        public int DecimalPrecision { get; set; }
        public string ProgramDir => _owner.ProgramDir;
        public string ScriptName => Path.GetFileName(_cmp?.ScriptFile ?? string.Empty);
        public string PersistenceId
        {
            get
            {
                if (_cmp != null && _cmp.IncludeScriptCount > 0)
                    return _cmp.GetIncludeScript(0);

                return ScriptName;
            }
        }

        /// <summary>
        /// Pause the script execution
        /// </summary>
        public void Pause()
        {
            _paused = true;
            _resetLoopDetectionOnNextExecute = true;
        }

        public void RequestForceStop()
        {
            _forceStopRequested = true;
            _paused = false;
            _pausedReason = PauseReason.None;
            _waitForActive = false;
            _waitingForAuth = false;
            _waitingForInput = false;
            _keypressMode = false;
            _echoKeypressInput = false;
            _inputVarParam = null;
            _waitText = string.Empty;
            _resetLoopDetectionOnNextExecute = true;
        }

        /// <summary>
        /// Resume the script execution
        /// </summary>
        public void Resume()
        {
            _paused = false;
            // If script was waiting for something, try to execute again
            if (!_waitForActive && !_waitingForAuth)
            {
                Execute();
            }
        }
    }

    #endregion
}
