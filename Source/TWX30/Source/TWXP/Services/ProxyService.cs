using TWXP.Models;
using TWXProxy.Core;

namespace TWXP.Services;

public interface IProxyService
{
    event EventHandler<GameStatusChangedEventArgs>? StatusChanged;
    
    Task<bool> StartGameAsync(GameConfig config);
    Task StopGameAsync(string gameId);
    Task ResetGameAsync(string gameId);
    GameStatus GetGameStatus(string gameId);
    Task ConnectAutoStartGamesAsync(IEnumerable<GameConfig> configs);
    Task<IReadOnlyList<RunningScriptInfo>> GetRunningScriptsAsync(string gameId);
    Task LoadScriptAsync(string gameId, string scriptPath);
    Task SwitchBotAsync(string gameId, string botName);
    Task ReloadBotConfigsAsync(string gameId);
    Task StopScriptAsync(string gameId, int scriptId);
    Task StopAllScriptsAsync(string gameId, bool includeSystemScripts);
    Task<HistorySnapshot> GetHistoryAsync(string gameId);
    Task ClearHistoryAsync(string gameId, HistoryType? type = null);
    Task ExportWarpsAsync(string gameId, string outputPath);
    Task<int> ImportWarpsAsync(string gameId, string inputPath);
    Task ExportBubblesAsync(string gameId, string outputPath);
    Task ExportDeadendsAsync(string gameId, string outputPath);
    Task ExportTwxAsync(string gameId, string outputPath);
    Task<TwxImportResult> ImportTwxAsync(string gameId, string inputPath, bool keepRecent);
    Task<bool> BeginLogPlaybackAsync(string gameId, string capturePath);
}

public class GameStatusChangedEventArgs : EventArgs
{
    public string GameId { get; set; } = string.Empty;
    public GameStatus Status { get; set; }
    public string? Message { get; set; }
}

public class ProxyService : IProxyService
{
    private readonly Dictionary<string, ProxyGameInstance> _runningGames = new();
    private readonly IGameConfigService _configService;
    private readonly bool _suppressConsoleOutput;
    private readonly bool _basicDebugLogging;

    public ProxyService(
        IGameConfigService configService,
        bool suppressConsoleOutput = false,
        bool basicDebugLogging = false)
    {
        _configService = configService;
        _suppressConsoleOutput = suppressConsoleOutput;
        _basicDebugLogging = basicDebugLogging;
    }

    public event EventHandler<GameStatusChangedEventArgs>? StatusChanged;

    public async Task<bool> StartGameAsync(GameConfig config)
    {
        if (_runningGames.TryGetValue(config.Id, out ProxyGameInstance? runningInstance))
        {
            ApplyLiveGameConfig(runningInstance, config);
            return false;
        }

        var runtimeContext = new TwxRuntimeContext($"twxp-{config.Id}");
        if (_basicDebugLogging)
        {
            runtimeContext.DebugMode = true;
            runtimeContext.VerboseDebugMode = false;
            runtimeContext.TriggerDebugMode = false;
            runtimeContext.ScriptTraceDebugMode = false;
            runtimeContext.AutoRecorderDebugMode = false;
            runtimeContext.VariablePersistenceDebugMode = false;
        }
        if (string.Equals(
                Environment.GetEnvironmentVariable("OPENTW_TWX_TRIGGER_DEBUG"),
                "1",
                StringComparison.Ordinal))
        {
            runtimeContext.DebugMode = true;
            runtimeContext.VerboseDebugMode = true;
            runtimeContext.TriggerDebugMode = true;
        }
        GameFileLock? gameFileLock = null;
        try
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(runtimeContext);
            NotifyStatusChanged(config.Id, GameStatus.Starting);
            string configPath = ResolveGameDataFilePath(config);
            string dbPath = ResolveDatabasePath(config);
            gameFileLock = GameFileLock.Acquire("TWXP standalone proxy", configPath, dbPath);

            // Switch debug log to per-game file before anything else logs for this game
            AppPaths.EnsureDirectories();
            TWXProxy.Core.GlobalModules.DebugLogPath = AppPaths.DebugLogPathForGame(config.Name);
            TWXProxy.Core.GlobalModules.InitializeDebugLog();

            // Create script interpreter for this game
            var interpreter = new TWXProxy.Core.ModInterpreter();
            
            // Use the top-level scripts directory from the registry when configured.
            string configuredScriptsDirectory = await _configService.GetScriptsDirectoryAsync();
            string scriptDirectory = string.IsNullOrWhiteSpace(configuredScriptsDirectory)
                ? (string.IsNullOrWhiteSpace(config.ScriptDirectory)
                    ? AppPaths.DefaultScriptDir
                    : config.ScriptDirectory)
                : configuredScriptsDirectory;
            config.ScriptDirectory = scriptDirectory;
            Directory.CreateDirectory(scriptDirectory);
            
            // ProgramDir stays anchored to the configured TWX program directory
            // even when scripts are redirected elsewhere.
            string programDir = AppPaths.ProgramDir;
            interpreter.ProgramDir = programDir;
            GlobalModules.ProgramDir = programDir;
            interpreter.ScriptDirectory = scriptDirectory;
            
            // Initialize the menu manager for this game
            GlobalModules.TWXMenu = new MenuManager(runtimeContext);
            WriteConsole("[ProxyService] Initialized MenuManager");
            
            // Create the actual network game instance
            var gameInstance = new TWXProxy.Core.GameInstance(
                config.Name,
                config.Host,
                config.Port,
                config.ListenPort,
                config.CommandChar,
                interpreter,
                scriptDirectory,
                runtimeContext
            );
            gameInstance.Logger.LogDirectory = AppPaths.LogsDir;
            gameInstance.Logger.SetLogIdentity(config.Name);
            gameInstance.AutoReconnect = config.AutoReconnect;
            gameInstance.ReconnectDelayMs = Math.Max(1, config.ReconnectDelaySeconds) * 1000;
            gameInstance.LocalEcho = config.LocalEcho;
            gameInstance.Verbose = !_suppressConsoleOutput;
            gameInstance.AcceptExternal = config.AcceptExternal;
            gameInstance.AllowLerkers = config.AllowLerkers;
            gameInstance.ExternalAddress = config.ExternalAddress ?? string.Empty;
            gameInstance.BroadCastMsgs = config.BroadcastMessages;
            gameInstance.Logger.LogEnabled = config.LogEnabled;
            gameInstance.Logger.LogData = config.LogEnabled;
            gameInstance.Logger.LogANSI = config.LogAnsi;
            gameInstance.Logger.LogAnsiCompanion = config.LogAnsiCompanion;
            gameInstance.Logger.BinaryLogs = config.LogBinary;
            gameInstance.Logger.NotifyPlayCuts = config.NotifyPlayCuts;
            gameInstance.Logger.MaxPlayDelay = config.MaxPlayDelay;
            gameInstance.SetNativeHaggleEnabled(config.NativeHaggleEnabled, TWXProxy.Core.NativeHaggleChangeSource.Config);
            string portHaggleMode = await _configService.GetPortHaggleModeAsync();
            string planetHaggleMode = await _configService.GetPlanetHaggleModeAsync();
            if (string.IsNullOrWhiteSpace(portHaggleMode) && !string.IsNullOrWhiteSpace(config.NativeHaggleMode))
                portHaggleMode = TWXProxy.Core.NativeHaggleModes.Normalize(config.NativeHaggleMode);
            gameInstance.SetNativeHaggleModes(portHaggleMode, planetHaggleMode);
            gameInstance.NativeHaggleChanged += (enabled, source) =>
            {
                if (source != TWXProxy.Core.NativeHaggleChangeSource.User)
                    return;

                if (config.NativeHaggleEnabled == enabled)
                    return;

                config.NativeHaggleEnabled = enabled;
                _ = _configService.SaveConfigAsync(config);
            };
            
            // Create and wire up a file-backed database so sector/port data is
            // persisted across sessions.  The autosave timer in ModDatabase writes
            // to disk every 60 s; CloseDatabase() does a final save on shutdown.
            var sessionDb = new TWXProxy.Core.ModDatabase();
            try
            {
                string legacyDbPath = AppPaths.LegacyDatabasePathForGame(config.Name);

                Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
                if (!File.Exists(dbPath) && File.Exists(legacyDbPath) && !PathsEqual(dbPath, legacyDbPath))
                {
                    File.Copy(legacyDbPath, dbPath, overwrite: false);
                    TWXProxy.Core.GlobalModules.DebugLog(
                        $"[ProxyService] Migrated legacy database '{legacyDbPath}' -> '{dbPath}'\n");
                }

                TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] DatabaseDir={AppPaths.DatabaseDir}\n");
                TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] dbPath={dbPath}\n");
                TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] dbPath exists={File.Exists(dbPath)}\n");

                if (File.Exists(dbPath))
                {
                    sessionDb.OpenDatabase(dbPath);
                    sessionDb.UseCache = config.UseCache;
                    // Sync all runtime-owned header fields, including login automation settings.
                    var header = sessionDb.DBHeader;
                    var updates = BuildHeader(config);
                    bool headerDirty = header.Sectors != updates.Sectors ||
                                       header.Address != updates.Address ||
                                       header.ServerPort != updates.ServerPort ||
                                       header.ListenPort != updates.ListenPort ||
                                       header.CommandChar != updates.CommandChar ||
                                       header.Description != updates.Description ||
                                       header.UseLogin != updates.UseLogin ||
                                       header.UseRLogin != updates.UseRLogin ||
                                       header.LoginScript != updates.LoginScript ||
                                       header.LoginName != updates.LoginName ||
                                       header.Password != updates.Password ||
                                       header.Game != updates.Game;
                    header.Sectors = updates.Sectors;
                    header.Address = updates.Address;
                    header.ServerPort = updates.ServerPort;
                    header.ListenPort = updates.ListenPort;
                    header.CommandChar = updates.CommandChar;
                    header.Description = updates.Description;
                    header.UseLogin = updates.UseLogin;
                    header.UseRLogin = updates.UseRLogin;
                    header.LoginScript = updates.LoginScript;
                    header.LoginName = updates.LoginName;
                    header.Password = updates.Password;
                    header.Game = updates.Game;
                    sessionDb.ReplaceHeader(header);
                    if (headerDirty)
                        sessionDb.SaveDatabase();
                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Opened existing database: {dbPath}\n");
                }
                else
                {
                    sessionDb.CreateDatabase(dbPath, BuildHeader(config));
                    sessionDb.UseCache = config.UseCache;
                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Created new database: {dbPath} ({config.Sectors} sectors)\n");
                }

                gameInstance.Logger.SetLogIdentity(dbPath);
            }
            catch (Exception dbEx)
            {
                TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] DATABASE ERROR: {dbEx}\n");
            }
            TWXProxy.Core.ScriptRef.SetActiveDatabase(runtimeContext, sessionDb);
            TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Database ready for {config.Name}\n");
            TWXProxy.Core.GlobalModules.FlushDebugLog();

            // Load previously saved variables, but exclude session-startup flags.
            // $gfile_chk controls auto-connect; $doRelog controls the relog machine.
            // Both should always start as '0' so the user must press Z each session.
            config.Variables = new Dictionary<string, string>(
                config.Variables ?? new Dictionary<string, string>(),
                StringComparer.OrdinalIgnoreCase);

            var varsToLoad = new Dictionary<string, string>(config.Variables, StringComparer.OrdinalIgnoreCase);
            varsToLoad.Remove("$gfile_chk");
            varsToLoad.Remove("$doRelog");
            TWXProxy.Core.ScriptRef.LoadVarsForGame(runtimeContext, varsToLoad);

            // When savevar is called, persist the value into the game's data file,
            // but skip the session-startup flags so they never survive across launches.
            TWXProxy.Core.ScriptRef.SetOnVariableSaved(runtimeContext, (varName, value) =>
            {
                if (string.Equals(varName, "$gfile_chk", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(varName, "$doRelog",   StringComparison.OrdinalIgnoreCase))
                    return;
                config.Variables[varName] = value;
                _configService.RequestVariablesSave(config);
            });

            // Create proxy instance early so we can reference it in event handlers
            var proxyInstance = new ProxyGameInstance
            {
                Config = config,
                GameInstance = gameInstance,
                Interpreter = interpreter,
                Database = sessionDb,
                RuntimeContext = runtimeContext,
                FileLock = gameFileLock,
                Status = GameStatus.Running,
                ServerLineBuffer = new System.Text.StringBuilder(),
                ServerAnsiLineBuffer = new System.Text.StringBuilder()
            };
            gameFileLock = null;
            
            // Hook up server data handler to set CURRENTLINE/CURRENTANSILINE
            gameInstance.ServerDataReceived += (sender, e) =>
            {
                using var eventScope = GlobalModules.UseRuntimeContext(proxyInstance.RuntimeContext);
                lock (proxyInstance.ServerDataSync)
                {
                    proxyInstance.PendingServerData.Enqueue((e.Text, e.Data.ToArray()));
                    if (proxyInstance.ProcessingServerData)
                        return;

                    proxyInstance.ProcessingServerData = true;
                    try
                    {
                        while (proxyInstance.PendingServerData.Count > 0)
                        {
                (string text, byte[] data) = proxyInstance.PendingServerData.Dequeue();
                // Process server data for line detection

                if (TWXProxy.Core.GlobalModules.VerboseDebugMode)
                {
                    var hexDump = string.Join(" ", data.Select(b => b.ToString("X2")));
                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] RAW {data.Length}B: {hexDump}\n");
                }
                
                string ansiChunk = TWXProxy.Core.AnsiCodes.PrepareScriptAnsiText(text);
                bool scriptInAnsi = proxyInstance.ScriptInAnsi;
                string plainChunk = TWXProxy.Core.AnsiCodes.StripANSIStateful(ansiChunk, ref scriptInAnsi);
                proxyInstance.ScriptInAnsi = scriptInAnsi;

                // Add to line buffers. This mirrors Pascal's extractor more closely:
                // keep the ANSI and stripped streams in step across packet boundaries.
                proxyInstance.ServerLineBuffer.Append(plainChunk);
                proxyInstance.ServerAnsiLineBuffer.Append(ansiChunk);
                
                // Extract and process all complete lines
                string buffered = proxyInstance.ServerLineBuffer.ToString();
                string bufferedAnsi = proxyInstance.ServerAnsiLineBuffer.ToString();
                int searchPos = 0;
                int ansiSearchPos = 0;
                int lastProcessedPos = 0;
                int lastAnsiProcessedPos = 0;
                
                while (searchPos < buffered.Length)
                {
                    // TW2002 sends "text\r ESC[0m \n next-line-text..." — split on \r (CR),
                    // matching Pascal's ProcessLine behavior.  After a \r, the bytes up to the
                    // next \r form the next line's content; any \n (LF) bytes in that content
                    // are stripped.  This means the ESC[0m reset that TW2002 places between
                    // \r and \n becomes the START of the next line's CURRENTANSILINE, which is
                    // exactly what the Pascal bytecode's getwordpos needles expect.
                    int crPos = buffered.IndexOf('\r', searchPos);
                    
                    if (crPos == -1)
                    {
                        // No complete \r-terminated line — keep remainder in buffer (prompt/partial)
                        string remainder = buffered.Substring(lastProcessedPos);
                        string remainderAnsi = bufferedAnsi.Substring(lastAnsiProcessedPos);
                        proxyInstance.ServerLineBuffer.Clear();
                        proxyInstance.ServerLineBuffer.Append(remainder);
                        proxyInstance.ServerAnsiLineBuffer.Clear();
                        proxyInstance.ServerAnsiLineBuffer.Append(remainderAnsi);
                        
                        // Set the partial line as CURRENTLINE and fire triggers on it
                        if (!string.IsNullOrEmpty(remainder))
                        {
                            string remainderForAnsi = remainderAnsi;
                            string scriptRemainder = remainder;
                            string strippedRemainder = TWXProxy.Core.AnsiCodes.NormalizeTerminalText(
                                scriptRemainder.TrimEnd('\r'));
                            TWXProxy.Core.GlobalModules.GlobalAutoRecorder.ProcessPrompt(strippedRemainder, remainderForAnsi);
                            if (TWXProxy.Core.GlobalModules.GlobalAutoRecorder.CurrentSector > 0)
                                TWXProxy.Core.ScriptRef.SetCurrentSector(TWXProxy.Core.GlobalModules.GlobalAutoRecorder.CurrentSector);
                            TWXProxy.Core.ScriptRef.SetCurrentAnsiLine(remainderForAnsi);
                            TWXProxy.Core.ScriptRef.SetCurrentLine(scriptRemainder);

                            // Fire triggers for partial lines (prompts) too
                            if (TWXProxy.Core.GlobalModules.TWXInterpreter is TWXProxy.Core.ModInterpreter interpreter)
                            {
                                if (TWXProxy.Core.GlobalModules.VerboseDebugMode)
                                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Processing partial line (prompt): '{strippedRemainder}'\n");
                                // Restore CURRENTLINE to the actual prompt before firing
                                TWXProxy.Core.ScriptRef.SetCurrentLine(scriptRemainder);
                                bool nativeHaggleResponded = gameInstance.ProcessNativeHaggleLine(strippedRemainder);
                                if (TWXProxy.Core.GlobalModules.VerboseDebugMode)
                                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Calling Text Event on prompt...\n");
                                // Pascal partial prompt flow is AutoTextEvent(CurrentLine), then
                                // ProcessPrompt(CurrentLine), which calls TextEvent(CurrentLine).
                                // Pascal does NOT call TextLineEvent or ActivateTriggers here —
                                // those only happen after a full \r-terminated line in ProcessLine.
                                interpreter.DispatchPartialLine(scriptRemainder, remainderForAnsi, false);
                                if (nativeHaggleResponded)
                                {
                                    proxyInstance.ServerLineBuffer.Clear();
                                }
                            }
                            else
                            {
                                bool nativeHaggleResponded = gameInstance.ProcessNativeHaggleLine(strippedRemainder);
                                if (nativeHaggleResponded)
                                {
                                    proxyInstance.ServerLineBuffer.Clear();
                                }
                            }
                        }
                        break;
                    }
                    
                    // Extract the line content from lastProcessedPos up to (but not including) the \r.
                    // The segment may begin with \n and/or ESC[0m bytes carried over from the previous
                    // line's "text\r ESC[0m \n" terminator — strip \n (LF) bytes to concatenate them.
                    int lineStart = lastProcessedPos;
                    int lineLength = crPos - lastProcessedPos;
                    int ansiCrPos = bufferedAnsi.IndexOf('\r', ansiSearchPos);
                    if (ansiCrPos == -1)
                        break;

                    string rawLine = buffered.Substring(lineStart, lineLength);
                    string line = bufferedAnsi.Substring(lastAnsiProcessedPos, ansiCrPos - lastAnsiProcessedPos + 1);
                    string scriptLine = rawLine;
                    
                    // Pascal fires ProcessLine (and thus TextLineEvent) on every \r, including blank lines.
                    // A blank \r\n line must reach TextLineEvent("") — e.g. PlayerInfo's :line handler
                    // exits when a blank line arrives after the status bar data.  Only skip AutoRecorder.
                    {
                        // Set CURRENTANSILINE (with ANSI codes; \n already stripped above)
                        TWXProxy.Core.ScriptRef.SetCurrentAnsiLine(line);
                        
                        // Set CURRENTLINE (stripped of ANSI codes)
                        string strippedLine = TWXProxy.Core.AnsiCodes.NormalizeTerminalText(
                            TWXProxy.Core.AnsiCodes.StripANSI(line).TrimEnd('\r'));
                        TWXProxy.Core.ScriptRef.SetCurrentLine(strippedLine);
                        
                        if (TWXProxy.Core.GlobalModules.VerboseDebugMode)
                            TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Processing line: '{strippedLine}'\n");
                        gameInstance.FeedShipStatusLine(strippedLine);
                        
                        // Update sector database from game text before firing script triggers (non-blank only)
                        if (!string.IsNullOrEmpty(strippedLine))
                        {
                            TWXProxy.Core.GlobalModules.GlobalAutoRecorder.RecordLine(strippedLine, line);
                            if (TWXProxy.Core.GlobalModules.GlobalAutoRecorder.CurrentSector > 0)
                                TWXProxy.Core.ScriptRef.SetCurrentSector(TWXProxy.Core.GlobalModules.GlobalAutoRecorder.CurrentSector);
                        }

                        gameInstance.History.ProcessLine(strippedLine);
                        gameInstance.ProcessNativeHaggleLine(strippedLine);

                        // Fire text triggers and text line triggers for scripts (all lines, including blank)
                        if (TWXProxy.Core.GlobalModules.TWXInterpreter is TWXProxy.Core.ModInterpreter interpreter)
                        {
                            // Pascal dispatch order for complete lines: TextLineEvent first, then TextEvent.
                            // (Pascal ProcessLine calls TextLineEvent, then ProcessPrompt calls TextEvent with the same line.)
                            if (TWXProxy.Core.GlobalModules.VerboseDebugMode)
                                TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Dispatching complete script line...\n");
                            interpreter.DispatchCompleteLine(scriptLine, line, false);
                        }
                    }
                    
                    // Move past the \r (the \n that follows, if any, will be part of the next
                    // line's content and will be stripped by the .Replace("\n","") above)
                    searchPos = crPos + 1;
                    lastProcessedPos = searchPos;
                    ansiSearchPos = ansiCrPos + 1;
                    lastAnsiProcessedPos = ansiSearchPos;
                }
                
                // If we processed all lines, clear the buffer
                    if (lastProcessedPos >= buffered.Length)
                    {
                        proxyInstance.ServerLineBuffer.Clear();
                        string ansiRemainder = lastAnsiProcessedPos < bufferedAnsi.Length
                            ? bufferedAnsi.Substring(lastAnsiProcessedPos)
                            : string.Empty;
                        proxyInstance.ServerAnsiLineBuffer.Clear();
                        if (ansiRemainder.Length > 0)
                            proxyInstance.ServerAnsiLineBuffer.Append(ansiRemainder);
                    }
                        }
                    }
                    finally
                    {
                        proxyInstance.ProcessingServerData = false;
                    }
                }
            };
            
            // Hook up event handlers
            gameInstance.Connected += (sender, e) =>
            {
                using var eventScope = GlobalModules.UseRuntimeContext(proxyInstance.RuntimeContext);
                NotifyStatusChanged(config.Id, GameStatus.Running, "Connected to server");
            };
            
            gameInstance.Disconnected += (sender, e) =>
            {
                using var eventScope = GlobalModules.UseRuntimeContext(proxyInstance.RuntimeContext);
                // Don't change status - still running and accepting connections
                System.Diagnostics.Debug.WriteLine($"[{config.Name}] Server disconnected: {e.Reason}");
                // Fire 'Connection Lost' program event so scripts can react (re-register their triggers, etc.)
                if (TWXProxy.Core.GlobalModules.TWXInterpreter is TWXProxy.Core.ModInterpreter interpD)
                {
                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] Firing ProgramEvent 'Connection Lost'\n");
                    interpD.ProgramEvent("Connection Lost", "", false);
                }
            };
            
            // Hook up clear input buffer handler
            gameInstance.ClearInputBufferRequested += (sender, e) =>
            {
                using var eventScope = GlobalModules.UseRuntimeContext(proxyInstance.RuntimeContext);
                proxyInstance.InputBuffer = string.Empty;
                WriteConsole("[ProxyService] InputBuffer cleared for GETINPUT");
            };
            
            // Hook up local data handler to process GETINPUT responses
            // The event fires byte-by-byte, so we accumulate into lines
            gameInstance.LocalDataReceived += (sender, e) =>
            {
                using var eventScope = GlobalModules.UseRuntimeContext(proxyInstance.RuntimeContext);
                string text = e.Text;
                if (TWXProxy.Core.GlobalModules.VerboseDebugMode)
                    TWXProxy.Core.GlobalModules.DebugLog($"[ProxyService] LocalDataReceived: {e.Data.Length} bytes\n");
                
                // Handle backspace (8) or DEL (127)
                if (e.Data.Length == 1 && (e.Data[0] == 8 || e.Data[0] == 127))
                {
                    if (proxyInstance.InputBuffer.Length > 0)
                    {
                        proxyInstance.InputBuffer = proxyInstance.InputBuffer.Substring(0, proxyInstance.InputBuffer.Length - 1);
                        WriteConsole($"[ProxyService] Backspace - buffer now: '{proxyInstance.InputBuffer}'");
                    }
                    return;
                }
                
                // Accumulate characters
                proxyInstance.InputBuffer += text;
                
                // Keypress mode: fire immediately on any single printable character
                // (empty-prompt getInput — e.g. menu choices — expects no Enter key).
                if (TWXProxy.Core.GlobalModules.TWXInterpreter is TWXProxy.Core.ModInterpreter interpKP
                    && interpKP.HasKeypressInputWaiting
                    && proxyInstance.InputBuffer.Length > 0)
                {
                    string key = proxyInstance.InputBuffer;
                    proxyInstance.InputBuffer = string.Empty;
                    WriteConsole($"[ProxyService] Keypress mode - firing LocalInputEvent immediately: '{key}'");
                    interpKP.LocalInputEvent(key);
                    return;
                }
                
                // In connected mode with no getConsoleInput waiting: discard the buffer.
                // Characters typed by the user are forwarded directly to the game server
                // by Network.cs and don't need to accumulate here.  Allowing them to pile
                // up causes a stale LIE dump (waiting=False) when '\r' eventually arrives.
                if (gameInstance.IsConnected
                    && TWXProxy.Core.GlobalModules.TWXInterpreter is TWXProxy.Core.ModInterpreter interpConn
                    && !interpConn.IsAnyScriptWaitingForInput())
                {
                    proxyInstance.InputBuffer = string.Empty;
                    return;
                }
                
                // Check if we have a complete line (ended with \r or \n)
                if (proxyInstance.InputBuffer.Contains('\r') || proxyInstance.InputBuffer.Contains('\n'))
                {
                    // Extract the line
                    string line = proxyInstance.InputBuffer.TrimEnd('\r', '\n');
                    proxyInstance.InputBuffer = string.Empty; // Clear buffer

                    WriteConsole($"[ProxyService] Complete line received: '{line}', passing to interpreter");
                    interpreter.LocalInputEvent(line);
                }
            };
            
            // Start the game instance (starts listening, waits for $c to connect to server)
            await gameInstance.StartAsync();
            
            // Set this as the active game instance for script commands
            TWXProxy.Core.ScriptRef.SetActiveGameInstance(runtimeContext, gameInstance);
            WriteConsole($"[ProxyService] Set active game instance for {config.Name}");

            proxyInstance.ModuleHost = await ExpansionModuleHost.CreateAsync(new ExpansionModuleHostOptions
            {
                HostTargets = ExpansionHostTargets.Twxp,
                HostName = "TWXP",
                GameName = config.Name,
                ProgramDir = programDir,
                ScriptDirectory = scriptDirectory,
                ModuleDataRootDirectory = AppPaths.ModuleDataDir,
                ModuleDirectories = new[]
                {
                    AppPaths.ModulesDir,
                    TWXProxy.Core.SharedPaths.LegacyModulesDir,
                },
                GameInstance = gameInstance,
                Interpreter = interpreter,
                Database = sessionDb,
            });

            // Add to running games collection
            _runningGames[config.Id] = proxyInstance;
            
            NotifyStatusChanged(config.Id, GameStatus.Running);
            return true;
        }
        catch (Exception ex)
        {
            gameFileLock?.Dispose();
            NotifyStatusChanged(config.Id, GameStatus.Error, ex.Message);
            return false;
        }
    }

    public async Task StopGameAsync(string gameId)
    {
        if (_runningGames.TryGetValue(gameId, out var instance))
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
            NotifyStatusChanged(gameId, GameStatus.Stopped);
            
            // Clear the active game instance for script commands
            TWXProxy.Core.ScriptRef.SetActiveGameInstance(instance.RuntimeContext, null);

            // Close the database — this stops the autosave timer and does a
            // final synchronous write to disk before we clear the reference.
            instance.Database.CloseDatabase();
            TWXProxy.Core.ScriptRef.SetActiveDatabase(instance.RuntimeContext, null);
            TWXProxy.Core.ScriptRef.SetOnVariableSaved(instance.RuntimeContext, null);
            await _configService.FlushVariablesAsync(instance.Config);
            WriteConsole($"[ProxyService] Saved and closed database for {instance.Config.Name}");
            
            // Clear the menu manager
            GlobalModules.TWXMenu = null;
            
            // Stop the game instance (stops listening, closes connections)
            await instance.GameInstance.StopAsync();
            if (instance.ModuleHost != null)
                await instance.ModuleHost.DisposeAsync();
            instance.GameInstance.Dispose();
            instance.FileLock.Dispose();
            
            _runningGames.Remove(gameId);
        }
    }

    public async Task ResetGameAsync(string gameId)
    {
        if (_runningGames.TryGetValue(gameId, out var instance))
        {
            await StopGameAsync(gameId);
            await Task.Delay(100);
            await StartGameAsync(instance.Config);
        }
    }

    public GameStatus GetGameStatus(string gameId)
    {
        return _runningGames.TryGetValue(gameId, out var instance)
            ? instance.Status
            : GameStatus.Stopped;
    }

    public async Task ConnectAutoStartGamesAsync(IEnumerable<GameConfig> configs)
    {
        var autoStartConfigs = configs.Where(c => c.AutoConnect);
        foreach (var config in autoStartConfigs)
        {
            await StartGameAsync(config);
        }
    }

    public Task<IReadOnlyList<RunningScriptInfo>> GetRunningScriptsAsync(string gameId)
    {
        if (_runningGames.TryGetValue(gameId, out var instance))
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
            return Task.FromResult(ProxyGameOperations.GetRunningScripts(instance.Interpreter));
        }

        return Task.FromResult<IReadOnlyList<RunningScriptInfo>>(Array.Empty<RunningScriptInfo>());
    }

    public Task LoadScriptAsync(string gameId, string scriptPath)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            throw new InvalidOperationException("Game is not running.");

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        ProxyGameOperations.LoadScript(instance.Interpreter, scriptPath);
        return Task.CompletedTask;
    }

    public Task SwitchBotAsync(string gameId, string botName)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            throw new InvalidOperationException("Game is not running.");

        if (string.IsNullOrWhiteSpace(botName))
            throw new InvalidOperationException("Bot name is required.");

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        instance.Interpreter.SwitchBot(string.Empty, botName, stopBotScripts: true);
        return Task.CompletedTask;
    }

    public async Task ReloadBotConfigsAsync(string gameId)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            return;

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        string scriptDirectory = instance.Config.ScriptDirectory ?? string.Empty;
        if (string.IsNullOrWhiteSpace(scriptDirectory))
            scriptDirectory = await _configService.GetScriptsDirectoryAsync();
        string programDir = AppPaths.ProgramDir;
        instance.GameInstance.ReloadBotConfigs(programDir, scriptDirectory, includeNative: false);
    }

    public Task StopScriptAsync(string gameId, int scriptId)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            throw new InvalidOperationException("Game is not running.");

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        if (!ProxyGameOperations.StopScriptById(instance.Interpreter, scriptId))
            throw new InvalidOperationException($"Script {scriptId} was not found.");

        return Task.CompletedTask;
    }

    public Task StopAllScriptsAsync(string gameId, bool includeSystemScripts)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            throw new InvalidOperationException("Game is not running.");

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        ProxyGameOperations.StopAllScripts(instance.Interpreter, includeSystemScripts);
        return Task.CompletedTask;
    }

    public Task<HistorySnapshot> GetHistoryAsync(string gameId)
    {
        if (_runningGames.TryGetValue(gameId, out var instance))
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
            return Task.FromResult(instance.GameInstance.History.GetSnapshot());
        }

        return Task.FromResult(new HistorySnapshot(Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>()));
    }

    public Task ClearHistoryAsync(string gameId, HistoryType? type = null)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            throw new InvalidOperationException("Game is not running.");

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        instance.GameInstance.History.Clear(type);
        return Task.CompletedTask;
    }

    public Task ExportWarpsAsync(string gameId, string outputPath)
    {
        return WithDatabaseAsync(gameId, database =>
        {
            ProxyGameOperations.ExportWarps(database, outputPath);
            return Task.CompletedTask;
        });
    }

    public async Task<int> ImportWarpsAsync(string gameId, string inputPath)
    {
        int imported = 0;
        await WithDatabaseAsync(gameId, database =>
        {
            imported = ProxyGameOperations.ImportWarps(database, inputPath);
            return Task.CompletedTask;
        });
        return imported;
    }

    public async Task ExportBubblesAsync(string gameId, string outputPath)
    {
        int bubbleSize = await GetBubbleSizeAsync(gameId);
        await WithDatabaseAsync(gameId, database =>
        {
            ProxyGameOperations.ExportBubbles(database, outputPath, bubbleSize);
            return Task.CompletedTask;
        });
    }

    public Task ExportDeadendsAsync(string gameId, string outputPath)
    {
        return WithDatabaseAsync(gameId, database =>
        {
            ProxyGameOperations.ExportDeadends(database, outputPath);
            return Task.CompletedTask;
        });
    }

    public Task ExportTwxAsync(string gameId, string outputPath)
    {
        return WithDatabaseAsync(gameId, database =>
        {
            ProxyGameOperations.ExportTwx(database, outputPath);
            return Task.CompletedTask;
        });
    }

    public async Task<TwxImportResult> ImportTwxAsync(string gameId, string inputPath, bool keepRecent)
    {
        TwxImportResult result = new(0, 0, false, 0);
        await WithDatabaseAsync(gameId, database =>
        {
            result = ProxyGameOperations.ImportTwx(database, inputPath, keepRecent);
            return Task.CompletedTask;
        });
        return result;
    }

    public Task<bool> BeginLogPlaybackAsync(string gameId, string capturePath)
    {
        if (!_runningGames.TryGetValue(gameId, out var instance))
            throw new InvalidOperationException("Game is not running.");

        using var runtimeScope = GlobalModules.UseRuntimeContext(instance.RuntimeContext);
        return Task.FromResult(instance.GameInstance.Logger.BeginPlayLog(capturePath));
    }

    private void NotifyStatusChanged(string gameId, GameStatus status, string? message = null)
    {
        if (_runningGames.TryGetValue(gameId, out var instance))
        {
            instance.Status = status;
        }

        StatusChanged?.Invoke(this, new GameStatusChangedEventArgs
        {
            GameId = gameId,
            Status = status,
            Message = message
        });
    }

    private void WriteConsole(string message)
    {
        if (!_suppressConsoleOutput)
            Console.WriteLine(message);
    }

    private static void ApplyLiveGameConfig(ProxyGameInstance instance, GameConfig config)
    {
        instance.Config.AutoReconnect = config.AutoReconnect;
        instance.Config.ReconnectDelaySeconds = config.ReconnectDelaySeconds;
        instance.Config.LocalEcho = config.LocalEcho;
        instance.Config.AcceptExternal = config.AcceptExternal;
        instance.Config.AllowLerkers = config.AllowLerkers;
        instance.Config.ExternalAddress = config.ExternalAddress ?? string.Empty;
        instance.Config.LerkerAddress = config.LerkerAddress ?? string.Empty;
        instance.Config.BroadcastMessages = config.BroadcastMessages;
        instance.Config.LogEnabled = config.LogEnabled;
        instance.Config.LogAnsi = config.LogAnsi;
        instance.Config.LogAnsiCompanion = config.LogAnsiCompanion;
        instance.Config.LogBinary = config.LogBinary;
        instance.Config.NotifyPlayCuts = config.NotifyPlayCuts;
        instance.Config.MaxPlayDelay = config.MaxPlayDelay;

        instance.GameInstance.AutoReconnect = config.AutoReconnect;
        instance.GameInstance.ReconnectDelayMs = Math.Max(1, config.ReconnectDelaySeconds) * 1000;
        instance.GameInstance.LocalEcho = config.LocalEcho;
        instance.GameInstance.AcceptExternal = config.AcceptExternal;
        instance.GameInstance.AllowLerkers = config.AllowLerkers;
        instance.GameInstance.ExternalAddress = config.ExternalAddress ?? string.Empty;
        instance.GameInstance.BroadCastMsgs = config.BroadcastMessages;
        instance.GameInstance.Logger.LogEnabled = config.LogEnabled;
        instance.GameInstance.Logger.LogData = config.LogEnabled;
        instance.GameInstance.Logger.LogANSI = config.LogAnsi;
        instance.GameInstance.Logger.LogAnsiCompanion = config.LogAnsiCompanion;
        instance.GameInstance.Logger.BinaryLogs = config.LogBinary;
        instance.GameInstance.Logger.NotifyPlayCuts = config.NotifyPlayCuts;
        instance.GameInstance.Logger.MaxPlayDelay = config.MaxPlayDelay;
    }

    private static TWXProxy.Core.DataHeader BuildHeader(GameConfig config) => new()
    {
        ProgramName  = "TWX PROXY",
        Sectors      = config.Sectors,
        Address      = config.Host,
        ServerPort   = (ushort)config.Port,
        ListenPort   = (ushort)config.ListenPort,
        CommandChar  = config.CommandChar,
        Description  = config.Name,
        UseLogin     = config.UseLogin,
        UseRLogin    = config.UseRLogin,
        LoginScript  = string.IsNullOrWhiteSpace(config.LoginScript) ? "0_Login.cts" : config.LoginScript,
        LoginName    = config.LoginName ?? string.Empty,
        Password     = config.Password ?? string.Empty,
        Game         = string.IsNullOrWhiteSpace(config.GameLetter) ? '\0' : char.ToUpperInvariant(config.GameLetter[0]),
    };

    private static bool PathsEqual(string left, string right)
    {
        return string.Equals(Path.GetFullPath(left), Path.GetFullPath(right), StringComparison.OrdinalIgnoreCase);
    }

    private async Task<GameConfig> GetRequiredConfigAsync(string gameId)
    {
        var config = await _configService.GetConfigAsync(gameId);
        if (config == null)
            throw new InvalidOperationException($"Game '{gameId}' was not found.");
        return config;
    }

    private async Task WithDatabaseAsync(string gameId, Func<TWXProxy.Core.ModDatabase, Task> action)
    {
        if (_runningGames.TryGetValue(gameId, out var running))
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(running.RuntimeContext);
            await action(running.Database);
            return;
        }

        GameConfig config = await GetRequiredConfigAsync(gameId);
        using var gameLock = GameFileLock.Acquire(
            "TWXP detached database access",
            ResolveGameDataFilePath(config),
            ResolveDatabasePath(config));
        using var database = OpenDetachedDatabase(config);
        await action(database);
        database.SaveDatabase();
    }

    private ModDatabase OpenDetachedDatabase(GameConfig config)
    {
        string dbPath = ResolveDatabasePath(config);

        Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

        var database = new ModDatabase();
        if (File.Exists(dbPath))
        {
            database.OpenDatabase(dbPath);
            database.UseCache = config.UseCache;
            var header = database.DBHeader;
            var updates = BuildHeader(config);
            bool headerDirty = header.Sectors != updates.Sectors ||
                               header.Address != updates.Address ||
                               header.ServerPort != updates.ServerPort ||
                               header.ListenPort != updates.ListenPort ||
                               header.CommandChar != updates.CommandChar ||
                               header.Description != updates.Description ||
                               header.UseLogin != updates.UseLogin ||
                               header.UseRLogin != updates.UseRLogin ||
                               header.LoginScript != updates.LoginScript ||
                               header.LoginName != updates.LoginName ||
                               header.Password != updates.Password ||
                               header.Game != updates.Game;
            header.Sectors = updates.Sectors;
            header.Address = updates.Address;
            header.ServerPort = updates.ServerPort;
            header.ListenPort = updates.ListenPort;
            header.CommandChar = updates.CommandChar;
            header.Description = updates.Description;
            header.UseLogin = updates.UseLogin;
            header.UseRLogin = updates.UseRLogin;
            header.LoginScript = updates.LoginScript;
            header.LoginName = updates.LoginName;
            header.Password = updates.Password;
            header.Game = updates.Game;
            database.ReplaceHeader(header);
            if (headerDirty)
                database.SaveDatabase();
        }
        else
        {
            database.CreateDatabase(dbPath, BuildHeader(config));
            database.UseCache = config.UseCache;
        }

        return database;
    }

    private async Task<int> GetBubbleSizeAsync(string gameId)
    {
        if (_runningGames.TryGetValue(gameId, out var running))
        {
            using var runtimeScope = GlobalModules.UseRuntimeContext(running.RuntimeContext);
            return Math.Max(1, running.Config.BubbleSize);
        }

        return Math.Max(1, (await GetRequiredConfigAsync(gameId)).BubbleSize);
    }

    private static string ResolveGameDataFilePath(GameConfig config)
    {
        return string.IsNullOrWhiteSpace(config.GameDataFilePath)
            ? AppPaths.GameDataFileFor(config.Name)
            : config.GameDataFilePath;
    }

    private static string ResolveDatabasePath(GameConfig config)
    {
        // Use the explicit DatabasePath from config only if it is an absolute
        // non-legacy path. Relative paths are resolved against the process cwd,
        // which can silently land data in the wrong place.
        string sharedDbPath = AppPaths.DatabasePathForGame(config.Name);
        string legacyDbPath = AppPaths.LegacyDatabasePathForGame(config.Name);
        bool hasAbsoluteConfigPath = !string.IsNullOrWhiteSpace(config.DatabasePath)
            && Path.IsPathRooted(config.DatabasePath);
        bool usesLegacyDefaultPath = hasAbsoluteConfigPath
            && PathsEqual(config.DatabasePath, legacyDbPath);

        return hasAbsoluteConfigPath && !usesLegacyDefaultPath
            ? config.DatabasePath
            : sharedDbPath;
    }

    private class ProxyGameInstance
    {
        public required GameConfig Config { get; init; }
        public required TWXProxy.Core.GameInstance GameInstance { get; init; }
        public required TWXProxy.Core.ModInterpreter Interpreter { get; init; }
        public required TWXProxy.Core.ModDatabase Database { get; init; }
        public required TwxRuntimeContext RuntimeContext { get; init; }
        public required GameFileLock FileLock { get; init; }
        public ExpansionModuleHost? ModuleHost { get; set; }
        public GameStatus Status { get; set; }
        public string InputBuffer { get; set; } = string.Empty;
        public required System.Text.StringBuilder ServerLineBuffer { get; init; }
        public required System.Text.StringBuilder ServerAnsiLineBuffer { get; init; }
        public object ServerDataSync { get; } = new();
        public Queue<(string Text, byte[] Data)> PendingServerData { get; } = new();
        public bool ProcessingServerData { get; set; }
        public bool ScriptInAnsi { get; set; }
    }
}
