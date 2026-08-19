using TWXProxy.Core;

var tests = new (string Name, Action Body)[]
{
    ("Destroyed star port notice clears PORT.EXISTS in current sector", DestroyedStarPortNoticeClearsPortExists),
    ("Destroyed port display clears PORT.EXISTS and keeps dead marker", DestroyedPortDisplayClearsPortExists),
    ("Setting BUSTED stamps current bust date", SettingBustedStampsCurrentBustDate),
    ("AutoRecorder sudden bust records dated bust", AutoRecorderSuddenBustRecordsDatedBust),
    ("AutoRecorder fake bust phrase records fake bust", AutoRecorderFakeBustPhraseRecordsFakeBust),
    ("AutoRecorder busted announcement preserves dated bust fields", AutoRecorderBustedAnnouncementPreservesDatedBustFields),
    ("ClearBustsBefore clears only previous dated busts", ClearBustsBeforeClearsOnlyPreviousDatedBusts),
    ("Ship status parser publishes latest slash sector and fighters", ShipStatusParserPublishesLatestSlashSectorAndFighters),
    ("Script constants use latest slash ship status", ScriptConstantsUseLatestSlashShipStatus),
    ("AutoRecorder prompt restores current sector after holo sector display", AutoRecorderPromptRestoresCurrentSectorAfterHoloSectorDisplay),
    ("Disabled debug categories do not construct interpolated messages", DisabledDebugCategoriesSkipInterpolation),
    ("Disabled debug categories allocate no interpolated messages", DisabledDebugCategoriesAllocateNothing),
    ("Comma-formatted TWGS values are numeric", CommaFormattedTwxValuesAreNumeric),
    ("Nested script loads preserve configured script root", NestedScriptLoadsPreserveConfiguredScriptRoot),
    ("Delay-triggered halt removes script and emits stop event", DelayTriggeredHaltRemovesScriptAndEmitsStopEvent),
    ("Prompt probe rearms line trigger after partial prompt handler", PromptProbeRearmsLineTriggerAfterPartialPromptHandler),
    ("Prompt probe fires only once across partial and complete views of one line", PromptProbeFiresOnlyOncePerLine),
    ("Distinct prompt probes can fire on one unterminated line", DistinctPromptProbesFireOnOneLine),
    ("GETSECTOR refreshes flat warp array fields", GetSectorRefreshesFlatWarpArrayFields),
    ("GETSECTOR refreshes namespaced self target warp fields", GetSectorRefreshesNamespacedSelfTargetWarpFields),
    ("GETSECTOR namespaced record warp fields stay stable", GetSectorNamespacedRecordWarpFieldsStayStable),
    ("SECTOR.WARPS uses current dynamic index after GETSECTOR", SectorWarpsUsesCurrentDynamicIndexAfterGetSector),
    ("AutoRecorder records warps above UInt16 range", AutoRecorderRecordsWarpsAboveUInt16Range),
    ("Stale database handle cannot overwrite reset database", StaleDatabaseHandleCannotOverwriteResetDatabase),
    ("Sector parameter scans count as watchdog activity", SectorParameterScansCountAsWatchdogActivity),
    ("High-volume local loops do not trip watchdog", HighVolumeLocalLoopsDoNotTripWatchdog),
    ("Top-level return terminates without a script error", TopLevelReturnTerminatesWithoutScriptError),
    ("Game file lock inspection reports stale PID", GameFileLockInspectionReportsStalePid),
    ("Game file lock stale removal deletes lock", GameFileLockStaleRemovalDeletesLock),
    ("Game idle keepalive uses ANSI status response bytes", GameIdleKeepaliveUsesAnsiStatusResponseBytes),
    ("Game idle keepalive reaches server socket", GameIdleKeepaliveReachesServerSocket),
    ("Proxy accepts external clients by default", ProxyAcceptsExternalClientsByDefault),
    ("New clients do not enter streaming mode automatically", NewClientsDoNotEnterStreamingModeAutomatically),
    ("Variable reset clears pending saves and stale backup", VariableResetClearsPendingSavesAndStaleBackup),
};

int failed = 0;
foreach ((string name, Action body) in tests)
{
    try
    {
        body();
        Console.WriteLine($"PASS {name}");
    }
    catch (Exception ex)
    {
        failed++;
        Console.Error.WriteLine($"FAIL {name}: {ex}");
    }
}

return failed == 0 ? 0 : 1;

static void DestroyedStarPortNoticeClearsPortExists()
{
    using var fixture = DatabaseFixture.Create();
    SeedLivePort(fixture.Database, 3554);

    var recorder = new AutoRecorder();
    recorder.RecordLine("Command [TL=00:00:00]:[3554] (?=Help)? : ");
    recorder.RecordLine("You destroyed the Star Port!");

    AssertDestroyedPort(fixture.Database, 3554);
}

static void GameIdleKeepaliveUsesAnsiStatusResponseBytes()
{
    if (GameInstance.DefaultGameIdleKeepaliveIntervalSeconds != 30)
        throw new InvalidOperationException($"Expected default keepalive interval 30 seconds, got {GameInstance.DefaultGameIdleKeepaliveIntervalSeconds}.");

    var field = typeof(GameInstance).GetField(
        "GameIdleKeepaliveBytes",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
    if (field?.GetValue(null) is not byte[] bytes)
        throw new InvalidOperationException("Could not inspect GameIdleKeepaliveBytes.");

    byte[] expected = [(byte)'\x1B', (byte)'[', (byte)'0', (byte)'n'];
    if (!bytes.SequenceEqual(expected))
    {
        string actual = string.Join(" ", bytes.Select(b => b.ToString("X2")));
        throw new InvalidOperationException($"Expected ANSI status response bytes 1B 5B 30 6E, got {actual}.");
    }
}

static void GameIdleKeepaliveReachesServerSocket()
{
    RunGameIdleKeepaliveReachesServerSocketAsync().GetAwaiter().GetResult();
}

static async Task RunGameIdleKeepaliveReachesServerSocketAsync()
{
    byte[] expected = [(byte)'\x1B', (byte)'[', (byte)'0', (byte)'n'];
    using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
    listener.Start();
    int port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;

    using var game = new GameInstance("keepalive-socket-test", "127.0.0.1", port, 0)
    {
        GameIdleKeepaliveIntervalSeconds = 5,
    };
    using var clientOutput = new MemoryStream();
    using var clientInput = new BlockingReadStream();
    game.ConnectDirectClient(clientOutput, clientInput);

    Task<System.Net.Sockets.TcpClient> acceptTask = listener.AcceptTcpClientAsync();
    await game.ConnectToServerAsync();

    using System.Net.Sockets.TcpClient serverClient = await acceptTask;
    await using System.Net.Sockets.NetworkStream serverStream = serverClient.GetStream();

    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(8));
    var received = new List<byte>();
    byte[] buffer = new byte[64];

    while (!cts.IsCancellationRequested)
    {
        int read;
        try
        {
            read = await serverStream.ReadAsync(buffer, cts.Token);
        }
        catch (OperationCanceledException)
        {
            break;
        }

        if (read <= 0)
            break;

        for (int i = 0; i < read; i++)
            received.Add(buffer[i]);

        if (ContainsSequence(received, expected))
            return;
    }

    string actual = string.Join(" ", received.Select(b => b.ToString("X2")));
    throw new InvalidOperationException($"Expected keepalive sequence 1B 5B 30 6E to reach server socket, got {actual}.");
}

static bool ContainsSequence(IReadOnlyList<byte> data, IReadOnlyList<byte> sequence)
{
    if (sequence.Count == 0 || data.Count < sequence.Count)
        return false;

    for (int i = 0; i <= data.Count - sequence.Count; i++)
    {
        bool match = true;
        for (int j = 0; j < sequence.Count; j++)
        {
            if (data[i + j] != sequence[j])
            {
                match = false;
                break;
            }
        }

        if (match)
            return true;
    }

    return false;
}

static void VariableResetClearsPendingSavesAndStaleBackup()
{
    string dir = Path.Combine(Path.GetTempPath(), "twx-var-reset-" + Guid.NewGuid().ToString("N"));
    string path = Path.Combine(dir, "variables.json");
    string backupPath = path + ".bak";

    try
    {
        Directory.CreateDirectory(dir);
        File.WriteAllText(path, "{\"$ZTMMAX\":\"100000\"}");
        File.WriteAllText(backupPath, "{\"$ZTMMAX\":\"100000\"}");

        var store = new DebouncedGameVariableStore(TimeSpan.FromMilliseconds(25));
        store.RequestSave(path, new Dictionary<string, string> { ["$ZTMMAX"] = "100000" }, backupPath);
        store.ResetAsync(path, new Dictionary<string, string>(), backupPath).GetAwaiter().GetResult();

        if (File.Exists(backupPath))
            throw new InvalidOperationException("Expected reset to remove the stale variables backup before the next load.");

        Dictionary<string, string> variables = GameVariableStore.LoadAsync(path, backupPath).GetAwaiter().GetResult();
        if (variables.ContainsKey("$ZTMMAX"))
            throw new InvalidOperationException("Expected reset variables to stay empty after a pending stale save.");

        Dictionary<string, string> backupVariables = GameVariableStore.LoadAsync(backupPath).GetAwaiter().GetResult();
        if (backupVariables.ContainsKey("$ZTMMAX"))
            throw new InvalidOperationException("Expected any recreated backup to contain reset variables, not stale variables.");
    }
    finally
    {
        if (Directory.Exists(dir))
            Directory.Delete(dir, recursive: true);
    }
}

static void NewClientsDoNotEnterStreamingModeAutomatically()
{
    using var game = new GameInstance("stream-test", "127.0.0.1", 23, 0);
    game.StreamEnabled = true;

    var method = typeof(GameInstance).GetMethod(
        "DetermineClientType",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
        ?? throw new InvalidOperationException("Could not inspect DetermineClientType.");

    object? result = method.Invoke(game, new object[] { "203.0.113.25", false });
    if (result is not ClientType type)
        throw new InvalidOperationException("DetermineClientType did not return a client type.");

    if (type != ClientType.Mute)
        throw new InvalidOperationException($"Expected non-standard clients to default to VIEW ONLY, got {type}.");
}

static void ProxyAcceptsExternalClientsByDefault()
{
    using var game = new GameInstance("accept-external-test", "127.0.0.1", 23, 0);

    if (!game.AcceptExternal)
        throw new InvalidOperationException("Expected AcceptExternal to default to true.");
}

static void DestroyedPortDisplayClearsPortExists()
{
    using var fixture = DatabaseFixture.Create();
    SeedLivePort(fixture.Database, 3554);

    var recorder = new AutoRecorder();
    recorder.RecordLine("Sector  : 3554 in uncharted space.");
    recorder.RecordLine("Ports   : Scanners indicate massive debris and heavy");

    AssertDestroyedPort(fixture.Database, 3554);
}

static void SeedLivePort(ModDatabase database, int sectorNumber)
{
    SectorData sector = database.GetSector(sectorNumber)
        ?? throw new InvalidOperationException($"Sector {sectorNumber} was not created.");

    sector.SectorPort = new Port
    {
        Name = "Existing Port",
        ClassIndex = 4,
        Dead = false,
        Update = DateTime.Now.AddDays(-1),
    };
    database.SaveSector(sector);
}

static void AssertDestroyedPort(ModDatabase database, int sectorNumber)
{
    SectorData sector = database.GetSector(sectorNumber)
        ?? throw new InvalidOperationException($"Sector {sectorNumber} was not found.");

    if (sector.SectorPort == null)
        throw new InvalidOperationException("Expected a dead port marker, got no port record.");

    if (!sector.SectorPort.Dead)
        throw new InvalidOperationException("Expected destroyed port to be marked dead.");

    if (!string.IsNullOrEmpty(sector.SectorPort.Name))
        throw new InvalidOperationException($"Expected PORT.EXISTS false via empty port name, got '{sector.SectorPort.Name}'.");

    if (sector.SectorPort.ClassIndex != 0)
        throw new InvalidOperationException($"Expected port class to be cleared, got {sector.SectorPort.ClassIndex}.");
}

static void SettingBustedStampsCurrentBustDate()
{
    using var fixture = DatabaseFixture.Create();

    fixture.Database.SetSectorVar(1234, DatabaseConstants.BustParameterName, "true");

    string busted = fixture.Database.GetSectorVar(1234, DatabaseConstants.BustParameterName);
    if (!string.Equals(busted, "true", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException($"Expected BUSTED=true, got '{busted}'.");

    string bustDate = fixture.Database.GetSectorVar(1234, DatabaseConstants.BustDateParameterName);
    string today = DateTime.Now.ToString("yyyy-MM-dd");
    if (!string.Equals(bustDate, today, StringComparison.Ordinal))
        throw new InvalidOperationException($"Expected BUSTDATE={today}, got '{bustDate}'.");
}

static void AutoRecorderSuddenBustRecordsDatedBust()
{
    using var fixture = DatabaseFixture.Create();

    var recorder = new AutoRecorder();
    recorder.RecordLine("Command [TL=00:00:00]:[2468] (?=Help)? : ");
    recorder.RecordLine("Suddenly you're Busted!");

    string busted = fixture.Database.GetSectorVar(2468, DatabaseConstants.BustParameterName);
    if (busted != "1")
        throw new InvalidOperationException($"Expected BUSTED=1, got '{busted}'.");

    string bustDate = fixture.Database.GetSectorVar(2468, DatabaseConstants.BustDateParameterName);
    string today = DateTime.Now.ToString("yyyy-MM-dd");
    if (!string.Equals(bustDate, today, StringComparison.Ordinal))
        throw new InvalidOperationException($"Expected BUSTDATE={today}, got '{bustDate}'.");
}

static void AutoRecorderFakeBustPhraseRecordsFakeBust()
{
    using var fixture = DatabaseFixture.Create();

    var recorder = new AutoRecorder();
    recorder.RecordLine("Command [TL=00:00:00]:[2468] (?=Help)? : ");
    recorder.RecordLine("(You suddenly remember that you were caught stealing here before)");

    string busted = fixture.Database.GetSectorVar(2468, DatabaseConstants.BustParameterName);
    if (busted != "1")
        throw new InvalidOperationException($"Expected BUSTED=1, got '{busted}'.");

    string fakeBust = fixture.Database.GetSectorVar(2468, DatabaseConstants.FakeBustParameterName);
    if (fakeBust != "1")
        throw new InvalidOperationException($"Expected FAKEBUST=1, got '{fakeBust}'.");
}

static void AutoRecorderBustedAnnouncementPreservesDatedBustFields()
{
    using var fixture = DatabaseFixture.Create();

    string today = DateTime.Now.ToString("yyyy-MM-dd");
    fixture.Database.SetSectorVar(3210, DatabaseConstants.BustParameterName, "1");
    fixture.Database.SetSectorVar(3210, DatabaseConstants.FakeBustParameterName, "1");
    fixture.Database.SetSectorVar(3210, DatabaseConstants.BustDateParameterName, today);

    var recorder = new AutoRecorder();
    recorder.RecordLine("R <SS>[Busted:3210]<SS>");

    if (fixture.Database.GetSectorVar(3210, DatabaseConstants.BustParameterName) != "1" ||
        fixture.Database.GetSectorVar(3210, DatabaseConstants.FakeBustParameterName) != "1" ||
        fixture.Database.GetSectorVar(3210, DatabaseConstants.BustDateParameterName) != today)
    {
        throw new InvalidOperationException("Expected subspace busted announcement to preserve MTC dated bust fields.");
    }
}

static void ClearBustsBeforeClearsOnlyPreviousDatedBusts()
{
    using var fixture = DatabaseFixture.Create();

    fixture.Database.SetSectorVar(101, DatabaseConstants.BustParameterName, "1");
    fixture.Database.SetSectorVar(101, DatabaseConstants.FakeBustParameterName, "1");
    fixture.Database.SetSectorVar(101, DatabaseConstants.BustDateParameterName, DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd"));

    fixture.Database.SetSectorVar(102, DatabaseConstants.BustParameterName, "1");
    fixture.Database.SetSectorVar(102, DatabaseConstants.FakeBustParameterName, "1");
    fixture.Database.SetSectorVar(102, DatabaseConstants.BustDateParameterName, DateTime.Now.ToString("yyyy-MM-dd"));

    fixture.Database.SetSectorVar(103, DatabaseConstants.BustParameterName, "1");
    fixture.Database.SetSectorVar(103, DatabaseConstants.BustDateParameterName, string.Empty);

    int cleared = fixture.Database.ClearBustsBefore(DateTime.Now);
    if (cleared != 1)
        throw new InvalidOperationException($"Expected to clear 1 old bust, cleared {cleared}.");

    if (!string.IsNullOrEmpty(fixture.Database.GetSectorVar(101, DatabaseConstants.BustParameterName)) ||
        !string.IsNullOrEmpty(fixture.Database.GetSectorVar(101, DatabaseConstants.FakeBustParameterName)) ||
        !string.IsNullOrEmpty(fixture.Database.GetSectorVar(101, DatabaseConstants.BustDateParameterName)))
    {
        throw new InvalidOperationException("Expected previous-day bust fields to be cleared.");
    }

    if (fixture.Database.GetSectorVar(102, DatabaseConstants.BustParameterName) != "1")
        throw new InvalidOperationException("Expected today's dated bust to remain.");

    if (fixture.Database.GetSectorVar(103, DatabaseConstants.BustParameterName) != "1")
        throw new InvalidOperationException("Expected undated bust to remain.");
}

static void ShipStatusParserPublishesLatestSlashSectorAndFighters()
{
    var parser = new ShipInfoParser();
    ShipStatus? last = null;
    parser.Updated += status => last = CloneStatus(status);

    FeedLoggedSlashStatusToParser(parser, sector: 12016, fighters: 253480);
    FeedLoggedSlashStatusToParser(parser, sector: 8822, fighters: 253471);

    if (last == null)
        throw new InvalidOperationException("Expected slash parser to publish a ship status update.");

    if (last.CurrentSector != 8822)
        throw new InvalidOperationException($"Expected current sector 8822, got {last.CurrentSector}.");

    if (last.Fighters != 253471)
        throw new InvalidOperationException($"Expected fighters 253471, got {last.Fighters}.");
}

static void ScriptConstantsUseLatestSlashShipStatus()
{
    var context = new TwxRuntimeContext("script-constants-slash-status-test");
    using var scope = GlobalModules.UseRuntimeContext(context);
    using var game = new GameInstance(
        "script-constants-slash-status-test",
        "127.0.0.1",
        0,
        0,
        runtimeContext: context);
    ScriptRef.SetActiveGameInstance(context, game);

    try
    {
        FeedLoggedSlashStatusToGame(game, sector: 12016, fighters: 253480);
        FeedLoggedSlashStatusToGame(game, sector: 8822, fighters: 253471);

        var scriptRef = new ScriptRef();
        string currentFighters = ReadSysConst(scriptRef, "CURRENTFIGHTERS");

        if (currentFighters != "253471")
            throw new InvalidOperationException($"Expected CURRENTFIGHTERS=253471, got {currentFighters}.");
    }
    finally
    {
        ScriptRef.SetActiveGameInstance(context, null);
    }
}

static void AutoRecorderPromptRestoresCurrentSectorAfterHoloSectorDisplay()
{
    using var fixture = DatabaseFixture.Create();

    var recorder = GlobalModules.CurrentContext.AutoRecorder;
    recorder.ResetState("core-test");
    recorder.RecordLine("Command [TL=00:00:00]:[12016] (?=Help)? : ");
    recorder.RecordLine("Sector  : 12016 in uncharted space.");
    recorder.RecordLine("Sector  : 13592 in uncharted space.");
    recorder.RecordLine("Sector  : 8822 in uncharted space.");
    recorder.ProcessPrompt("Command [TL=00:00:00]:[8822] (?=Help)? : ");

    if (recorder.CurrentSector != 8822)
        throw new InvalidOperationException($"Expected AutoRecorder current sector 8822, got {recorder.CurrentSector}.");

    if (ScriptRef.GetCurrentSector() != 8822)
        throw new InvalidOperationException($"Expected CURRENTSECTOR source 8822, got {ScriptRef.GetCurrentSector()}.");
}

static void FeedLoggedSlashStatusToParser(ShipInfoParser parser, int sector, int fighters)
{
    parser.FeedLine($" Sect {sector}\u00B3Turns 0\u00B3Creds 37,710,864\u00B3Figs {fighters:N0}\u00B3Shlds 0\u00B3Hlds 230\u00B3Ore 230");
    parser.FeedLine(" Org 0\u00B3Equ 0\u00B3Col 0\u00B3Phot 0\u00B3Armd 255\u00B3Lmpt 255\u00B3GTorp 15\u00B3TWarp 2\u00B3Clks 0\u00B3Beacns 0");
    parser.FeedLine(" AtmDt 15\u00B3Crbo 14,000\u00B3EPrb 0\u00B3MDis 40\u00B3PsPrb No\u00B3PlScn Yes\u00B3LRS Holo");
    parser.FeedLine(" Aln -2,943,163\u00B3Exp 2,385,446\u00B3Corp 5\u00B3Ship 75 Some Ship");
}

static void FeedLoggedSlashStatusToGame(GameInstance game, int sector, int fighters)
{
    game.FeedShipStatusLine($" Sect {sector}\u00B3Turns 0\u00B3Creds 37,710,864\u00B3Figs {fighters:N0}\u00B3Shlds 0\u00B3Hlds 230\u00B3Ore 230");
    game.FeedShipStatusLine(" Org 0\u00B3Equ 0\u00B3Col 0\u00B3Phot 0\u00B3Armd 255\u00B3Lmpt 255\u00B3GTorp 15\u00B3TWarp 2\u00B3Clks 0\u00B3Beacns 0");
    game.FeedShipStatusLine(" AtmDt 15\u00B3Crbo 14,000\u00B3EPrb 0\u00B3MDis 40\u00B3PsPrb No\u00B3PlScn Yes\u00B3LRS Holo");
    game.FeedShipStatusLine(" Aln -2,943,163\u00B3Exp 2,385,446\u00B3Corp 5\u00B3Ship 75 Some Ship");
}

static string ReadSysConst(ScriptRef scriptRef, string name)
{
    int index = scriptRef.FindSysConst(name);
    if (index < 0)
        throw new InvalidOperationException($"System constant {name} was not found.");

    return scriptRef.GetSysConst(index).Read(Array.Empty<string>());
}

static ShipStatus CloneStatus(ShipStatus status) => new()
{
    CurrentSector = status.CurrentSector,
    Fighters = status.Fighters,
};

static void DisabledDebugCategoriesSkipInterpolation()
{
    TwxRuntimeContext context = GlobalModules.CurrentContext;
    bool originalDebug = context.DebugMode;
    bool originalTrigger = context.TriggerDebugMode;
    bool originalScriptTrace = context.ScriptTraceDebugMode;
    bool originalPersistence = context.VariablePersistenceDebugMode;
    bool originalAutoRecorder = context.AutoRecorderDebugMode;
    bool originalPortHaggle = GlobalModules.PortHaggleDebugMode;
    bool originalPlanetHaggle = GlobalModules.PlanetHaggleDebugMode;

    try
    {
        context.DebugMode = false;
        context.TriggerDebugMode = false;
        context.ScriptTraceDebugMode = false;
        context.VariablePersistenceDebugMode = false;
        context.AutoRecorderDebugMode = false;
        GlobalModules.PortHaggleDebugMode = false;
        GlobalModules.PlanetHaggleDebugMode = false;

        var probe = new InterpolationProbe();
        GlobalModules.DebugLog($"debug {probe}");
        GlobalModules.TriggerDebugLog($"trigger {probe}");
        GlobalModules.ScriptTraceDebugLog($"trace {probe}");
        GlobalModules.VariablePersistenceDebugLog($"persistence {probe}");
        GlobalModules.AutoRecorderDebugLog($"recorder {probe}");
        GlobalModules.PortHaggleDebug($"port {probe}");
        GlobalModules.PlanetHaggleDebug($"planet {probe}");

        if (probe.FormatCount != 0)
            throw new InvalidOperationException($"Disabled logging formatted {probe.FormatCount} values.");
    }
    finally
    {
        context.DebugMode = originalDebug;
        context.TriggerDebugMode = originalTrigger;
        context.ScriptTraceDebugMode = originalScriptTrace;
        context.VariablePersistenceDebugMode = originalPersistence;
        context.AutoRecorderDebugMode = originalAutoRecorder;
        GlobalModules.PortHaggleDebugMode = originalPortHaggle;
        GlobalModules.PlanetHaggleDebugMode = originalPlanetHaggle;
    }
}

static void DisabledDebugCategoriesAllocateNothing()
{
    TwxRuntimeContext context = GlobalModules.CurrentContext;
    bool originalDebug = context.DebugMode;
    bool originalTrigger = context.TriggerDebugMode;
    bool originalScriptTrace = context.ScriptTraceDebugMode;
    bool originalPersistence = context.VariablePersistenceDebugMode;
    bool originalAutoRecorder = context.AutoRecorderDebugMode;

    try
    {
        context.DebugMode = false;
        context.TriggerDebugMode = false;
        context.ScriptTraceDebugMode = false;
        context.VariablePersistenceDebugMode = false;
        context.AutoRecorderDebugMode = false;

        LogDisabledIteration(0);
        long before = GC.GetAllocatedBytesForCurrentThread();
        for (int i = 0; i < 10_000; i++)
            LogDisabledIteration(i);
        long allocated = GC.GetAllocatedBytesForCurrentThread() - before;

        if (allocated != 0)
            throw new InvalidOperationException($"Disabled interpolated logging allocated {allocated} bytes.");
    }
    finally
    {
        context.DebugMode = originalDebug;
        context.TriggerDebugMode = originalTrigger;
        context.ScriptTraceDebugMode = originalScriptTrace;
        context.VariablePersistenceDebugMode = originalPersistence;
        context.AutoRecorderDebugMode = originalAutoRecorder;
    }
}

static void LogDisabledIteration(int value)
{
    GlobalModules.DebugLog($"debug {value}");
    GlobalModules.TriggerDebugLog($"trigger {value}");
    GlobalModules.ScriptTraceDebugLog($"trace {value}");
    GlobalModules.VariablePersistenceDebugLog($"persistence {value}");
    GlobalModules.AutoRecorderDebugLog($"recorder {value}");
}

static void CommaFormattedTwxValuesAreNumeric()
{
    var integer = new CmdParam { Value = "1,000" };
    if (integer.DecValue != 1000d)
        throw new InvalidOperationException($"Expected 1,000 to coerce to 1000, got {integer.DecValue}.");

    var signedDecimal = new CmdParam { Value = "-2,943,163.5" };
    if (signedDecimal.DecValue != -2943163.5d)
    {
        throw new InvalidOperationException(
            $"Expected -2,943,163.5 to coerce to -2943163.5, got {signedDecimal.DecValue}.");
    }
}

static void NestedScriptLoadsPreserveConfiguredScriptRoot()
{
    string originalDirectory = Directory.GetCurrentDirectory();
    string directory = Path.Combine(Path.GetTempPath(), "twx-script-root-tests", Guid.NewGuid().ToString("N"));
    string botDirectory = Path.Combine(directory, "mombot");
    string moduleDirectory = Path.Combine(botDirectory, "Modes", "Resource");
    Directory.CreateDirectory(moduleDirectory);
    File.WriteAllText(Path.Combine(botDirectory, "mombot.ts"), "pause\n");
    File.WriteAllText(Path.Combine(moduleDirectory, "colo.ts"), "halt\n");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load("scripts/mombot/mombot.ts", silent: true);

        if (!string.Equals(interpreter.ScriptDirectory, directory, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Expected configured script root '{directory}', got '{interpreter.ScriptDirectory}'.");
        }

        string expected = Path.Combine(moduleDirectory, "colo.ts");
        string actual = interpreter.ResolveScriptPath("scripts/mombot/Modes/Resource/colo.ts");
        if (!string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Expected nested module '{expected}', got '{actual}'.");
    }
    finally
    {
        Directory.SetCurrentDirectory(originalDirectory);
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void DelayTriggeredHaltRemovesScriptAndEmitsStopEvent()
{
    string directory = Path.Combine(Path.GetTempPath(), "twx-delay-stop-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "stopped.txt");
    string listenerPath = Path.Combine(directory, "listener.ts");
    string delayedPath = Path.Combine(directory, "delayed.ts");
    File.WriteAllText(listenerPath, $$"""
setvar $result_file "{{resultPath}}"
seteventtrigger stopped :stopped "SCRIPT STOPPED"
pause

:stopped
settextlinetrigger ready :ready "READY"
pause

:ready
write $result_file "stopped"
halt
""");
    File.WriteAllText(delayedPath, """
setdelaytrigger done :done 25
pause

:done
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load(listenerPath, silent: true);
        interpreter.Load(delayedPath, silent: true);

        DateTime deadline = DateTime.UtcNow.AddSeconds(2);
        while (interpreter.Count != 1 && DateTime.UtcNow < deadline)
            Thread.Sleep(10);

        if (interpreter.Count != 1)
            throw new InvalidOperationException($"Expected the delayed script to stop, found {interpreter.Count} scripts.");

        interpreter.DispatchCompleteLine("READY", "READY", forceTrigger: false);

        while (!File.Exists(resultPath) && DateTime.UtcNow < deadline)
            Thread.Sleep(10);

        if (!File.Exists(resultPath))
            throw new InvalidOperationException("Expected SCRIPT STOPPED listener to run after the delayed halt.");

        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected both scripts to be removed, found {interpreter.Count} running.");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void PromptProbeRearmsLineTriggerAfterPartialPromptHandler()
{
    string directory = Path.Combine(Path.GetTempPath(), "twx-prompt-probe-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "marker.txt");
    string scriptPath = Path.Combine(directory, "marker.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $result_file "{{resultPath}}"
settexttrigger prompt :prompt "Command prompt"
pause

:prompt
settextlinetrigger marker :marker #145&#8
pause

:marker
write $result_file "marker"
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load(scriptPath, silent: true);
        interpreter.DispatchPartialLine("Command prompt", "Command prompt", forceTrigger: false);
        interpreter.DispatchCompleteLine(
            "Command prompt \u0091\b/",
            "Command prompt \u0091\b/",
            forceTrigger: false);

        if (!File.Exists(resultPath))
            throw new InvalidOperationException("Expected the marker line trigger to fire after the partial prompt handler.");

        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected the marker script to stop, found {interpreter.Count} running.");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void PromptProbeFiresOnlyOncePerLine()
{
    string directory = Path.Combine(Path.GetTempPath(), "twx-prompt-probe-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "marker.txt");
    string scriptPath = Path.Combine(directory, "marker.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $result_file "{{resultPath}}"
settexttrigger prompt :first #145&#8
pause

:first
settexttrigger prompt :second #145&#8
pause

:second
write $result_file currentline
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load(scriptPath, silent: true);
        interpreter.DispatchPartialLine(
            "Planet command (?=help) [D] \u0091\b",
            "Planet command (?=help) [D] \u0091\b",
            forceTrigger: false);
        interpreter.DispatchCompleteLine(
            "Planet command (?=help) [D] \u0091\bC",
            "Planet command (?=help) [D] \u0091\bC",
            forceTrigger: false);

        if (File.Exists(resultPath))
            throw new InvalidOperationException("The rearmed probe matched the marker already consumed on the same line.");

        interpreter.DispatchCompleteLine(
            "Citadel command (?=help) \u0091\b",
            "Citadel command (?=help) \u0091\b",
            forceTrigger: false);

        if (!File.Exists(resultPath))
            throw new InvalidOperationException("Expected the rearmed probe to match the next prompt line.");

        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected the marker script to stop, found {interpreter.Count} running.");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void AutoRecorderRecordsWarpsAboveUInt16Range()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    using var fixture = DatabaseFixture.Create(sectors: 100000);

    var recorder = new AutoRecorder();
    recorder.RecordLine("Sector  : 54801 in uncharted space.");
    recorder.RecordLine("Warps to Sector(s) :  3634 - 17405 - 69793");

    SectorData sector = fixture.Database.GetSector(54801)
        ?? throw new InvalidOperationException("Expected sector 54801 to exist.");

    int[] warps = sector.Warp.Where(warp => warp > 0).ToArray();
    int[] expected = [3634, 17405, 69793];
    if (!warps.SequenceEqual(expected))
        throw new InvalidOperationException($"Expected warps [{string.Join(",", expected)}], got [{string.Join(",", warps)}].");
}

static void GetSectorRefreshesFlatWarpArrayFields()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    using var fixture = DatabaseFixture.Create(sectors: 100000);

    SeedWarps(fixture.Database, 58762, 4973, 32721, 48980, 54878, 69014, 70319);
    SeedWarps(fixture.Database, 69014, 16736, 17193, 30493, 58762, 62690, 71958);

    string directory = Path.Combine(Path.GetTempPath(), "twx-getsector-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "getsector.txt");
    string scriptPath = Path.Combine(directory, "getsector.ts");
    File.WriteAllText(scriptPath, $$"""
getsector 58762 $sector
write "{{resultPath}}" $sector.warps
write "{{resultPath}}" $sector.warp[1]
setvar $i 1
write "{{resultPath}}" $sector.warp[$i]
getsector 69014 $sector
write "{{resultPath}}" $sector.warps
write "{{resultPath}}" $sector.warp[1]
write "{{resultPath}}" $sector.warp[$i]
write "{{resultPath}}" sector.warps[69014][1]
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };
        ScriptRef.SetActiveDatabase(interpreter.RuntimeContext, fixture.Database);

        interpreter.Load(scriptPath, silent: true);

        string[] actual = File.Exists(resultPath)
            ? File.ReadAllLines(resultPath)
            : Array.Empty<string>();
        string[] expected =
        [
            "6",
            "4973",
            "4973",
            "6",
            "16736",
            "16736",
            "16736",
        ];

        if (!actual.SequenceEqual(expected))
            throw new InvalidOperationException($"Expected [{string.Join(",", expected)}], got [{string.Join(",", actual)}].");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void GetSectorRefreshesNamespacedSelfTargetWarpFields()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    using var fixture = DatabaseFixture.Create(sectors: 100000);

    SeedWarps(fixture.Database, 58762, 4973, 32721, 48980, 54878, 69014, 70319);
    SeedWarps(fixture.Database, 69014, 16736, 17193, 30493, 58762, 62690, 71958);

    string directory = Path.Combine(Path.GetTempPath(), "twx-getsector-self-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "getsector-self.txt");
    string scriptPath = Path.Combine(directory, "getsector-self.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $move~cursector 58762
getsector $move~cursector $move~cursector
setvar $i 1
write "{{resultPath}}" $move~cursector.warp[$i]
setvar $move~cursector 69014
getsector $move~cursector $move~cursector
write "{{resultPath}}" $move~cursector.warp[$i]
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };
        ScriptRef.SetActiveDatabase(interpreter.RuntimeContext, fixture.Database);

        interpreter.Load(scriptPath, silent: true);

        string[] actual = File.Exists(resultPath)
            ? File.ReadAllLines(resultPath)
            : Array.Empty<string>();
        string[] expected =
        [
            "4973",
            "16736",
        ];

        if (!actual.SequenceEqual(expected))
            throw new InvalidOperationException($"Expected [{string.Join(",", expected)}], got [{string.Join(",", actual)}].");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void GetSectorNamespacedRecordWarpFieldsStayStable()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    using var fixture = DatabaseFixture.Create(sectors: 100000);

    SeedWarps(fixture.Database, 16069, 29459, 34358, 49110);
    SeedWarps(fixture.Database, 29459, 16069, 16173, 18786, 32651, 34792, 41647);

    string directory = Path.Combine(Path.GetTempPath(), "twx-getsector-record-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "getsector-record.txt");
    string scriptPath = Path.Combine(directory, "getsector-record.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $portcheck~sector 16069
setvar $portcheck~i 1
getsector $portcheck~sector $portcheck~sectorinfo
write "{{resultPath}}" $portcheck~sectorinfo.warps
write "{{resultPath}}" $portcheck~sectorinfo.warp[$portcheck~i]
setvar $portcheck~sector 29459
setvar $portcheck~i 6
getsector $portcheck~sector $portcheck~sectorinfo
write "{{resultPath}}" $portcheck~sectorinfo.warps
write "{{resultPath}}" $portcheck~sectorinfo.warp[$portcheck~i]
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };
        ScriptRef.SetActiveDatabase(interpreter.RuntimeContext, fixture.Database);

        interpreter.Load(scriptPath, silent: true);

        string[] actual = File.Exists(resultPath)
            ? File.ReadAllLines(resultPath)
            : Array.Empty<string>();
        string[] expected =
        [
            "3",
            "29459",
            "6",
            "41647",
        ];

        if (!actual.SequenceEqual(expected))
            throw new InvalidOperationException($"Expected [{string.Join(",", expected)}], got [{string.Join(",", actual)}].");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void SectorWarpsUsesCurrentDynamicIndexAfterGetSector()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    using var fixture = DatabaseFixture.Create(sectors: 100000);

    SeedWarps(fixture.Database, 58762, 4973, 32721, 48980, 54878, 69014, 70319);
    SeedWarps(fixture.Database, 4043, 6967, 14343, 17193, 48876, 50947, 72677);
    SeedWarps(fixture.Database, 70319, 4164, 9028, 12229, 12389, 49884, 58762);

    string directory = Path.Combine(Path.GetTempPath(), "twx-sector-warps-dynamic-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "sector-warps-dynamic.txt");
    string scriptPath = Path.Combine(directory, "sector-warps-dynamic.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $move~cursector 58762
setvar $move~i 6
getsector $move~cursector $move~cursector
setvar $candidate sector.warps[$move~cursector][$move~i]
write "{{resultPath}}" $candidate
setvar $move~cursector 4043
setvar $move~i 5
getsector $move~cursector $move~cursector
setvar $candidate sector.warps[$move~cursector][$move~i]
write "{{resultPath}}" $candidate
setvar $move~cursector 70319
setvar $move~i 1
getsector $move~cursector $move~cursector
setvar $candidate sector.warps[$move~cursector][$move~i]
write "{{resultPath}}" $candidate
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };
        ScriptRef.SetActiveDatabase(interpreter.RuntimeContext, fixture.Database);

        interpreter.Load(scriptPath, silent: true);

        string[] actual = File.Exists(resultPath)
            ? File.ReadAllLines(resultPath)
            : Array.Empty<string>();
        string[] expected =
        [
            "70319",
            "50947",
            "4164",
        ];

        if (!actual.SequenceEqual(expected))
            throw new InvalidOperationException($"Expected [{string.Join(",", expected)}], got [{string.Join(",", actual)}].");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void SeedWarps(ModDatabase database, int sectorNumber, params int[] warps)
{
    SectorData sector = database.GetSector(sectorNumber)
        ?? throw new InvalidOperationException($"Sector {sectorNumber} was not created.");

    Array.Clear(sector.Warp);
    for (int i = 0; i < warps.Length && i < sector.Warp.Length; i++)
        sector.Warp[i] = warps[i];
    database.SaveSector(sector);
}

static void StaleDatabaseHandleCannotOverwriteResetDatabase()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    string directory = Path.Combine(Path.GetTempPath(), "twx-core-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string dbPath = Path.Combine(directory, "game.xdb");

    try
    {
        var stale = new ModDatabase();
        stale.CreateDatabase(dbPath, new DataHeader { Sectors = 100000, CommandChar = '$' });

        SectorData staleSector = stale.GetSector(54801)
            ?? throw new InvalidOperationException("Expected stale sector to exist.");
        staleSector.Warp[0] = 3634;
        staleSector.Warp[1] = 17405;
        staleSector.Warp[2] = 69793;
        stale.SaveSector(staleSector);
        stale.SaveDatabase();

        var reset = new ModDatabase();
        reset.CreateDatabase(dbPath, new DataHeader { Sectors = 100000, CommandChar = '$' });
        reset.CloseDatabase();

        stale.CloseDatabase();

        var fresh = new ModDatabase();
        fresh.OpenDatabase(dbPath);
        SectorData freshSector = fresh.GetSector(54801)
            ?? throw new InvalidOperationException("Expected fresh sector to exist.");
        int[] warps = freshSector.Warp.Where(warp => warp > 0).ToArray();
        fresh.CloseDatabase();

        if (warps.Length != 0)
            throw new InvalidOperationException($"Expected reset sector to have no warps, got [{string.Join(",", warps)}].");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void DistinctPromptProbesFireOnOneLine()
{
    string directory = Path.Combine(Path.GetTempPath(), "twx-prompt-probe-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "marker.txt");
    string scriptPath = Path.Combine(directory, "marker.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $result_file "{{resultPath}}"
settexttrigger prompt :first #145&#8
pause

:first
settexttrigger prompt :second #145&#8
pause

:second
write $result_file currentline
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load(scriptPath, silent: true);
        interpreter.DispatchPartialLine(
            "Planet command (?=help) [D] \u0091\b",
            "Planet command (?=help) [D] \u0091\b",
            forceTrigger: false);
        interpreter.DispatchPartialLine(
            "Planet command (?=help) [D] \u0091\b\u0091\b",
            "Planet command (?=help) [D] \u0091\b\u0091\b",
            forceTrigger: false);

        if (!File.Exists(resultPath))
            throw new InvalidOperationException("Expected the second distinct probe to fire on the same partial line.");

        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected the marker script to stop, found {interpreter.Count} running.");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void SectorParameterScansCountAsWatchdogActivity()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    using var fixture = DatabaseFixture.Create();
    string directory = Path.Combine(Path.GetTempPath(), "twx-sector-parameter-watchdog-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "complete.txt");
    string scriptPath = Path.Combine(directory, "sector-parameter-scan.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $i 1
while ($i <= sectors)
    setvar $repeat 1
    while ($repeat <= 100)
        setvar $scratch $i
        add $repeat 1
    end
    setsectorparameter $i "FIGSEC" false
    add $i 1
end
write "{{resultPath}}" "complete"
halt
""");

    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };
        ScriptRef.SetActiveDatabase(interpreter.RuntimeContext, fixture.Database);

        interpreter.Load(scriptPath, silent: true);

        if (!File.Exists(resultPath))
            throw new InvalidOperationException("Expected the long sector parameter scan to complete.");
        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected the scan script to stop, found {interpreter.Count} running.");
    }
    finally
    {
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void HighVolumeLocalLoopsDoNotTripWatchdog()
{
    Directory.SetCurrentDirectory(AppContext.BaseDirectory);
    string directory = Path.Combine(Path.GetTempPath(), "twx-watchdog-local-loop-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string resultPath = Path.Combine(directory, "complete.txt");
    string scriptPath = Path.Combine(directory, "local-loop.ts");
    File.WriteAllText(scriptPath, $$"""
setvar $i 0
while ($i < 2000000)
    add $i 1
end
write "{{resultPath}}" "complete"
halt
""");

    bool originalProtection = GlobalModules.ScriptInfiniteLoopProtectionEnabled;
    GlobalModules.ScriptInfiniteLoopProtectionEnabled = true;
    try
    {
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load(scriptPath, silent: true);

        if (!File.Exists(resultPath))
            throw new InvalidOperationException("Expected the high-volume local loop to complete.");
        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected the local loop script to stop, found {interpreter.Count} running.");
    }
    finally
    {
        GlobalModules.ScriptInfiniteLoopProtectionEnabled = originalProtection;
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void TopLevelReturnTerminatesWithoutScriptError()
{
    string directory = Path.Combine(Path.GetTempPath(), "twx-top-level-return-tests", Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(directory);
    string scriptPath = Path.Combine(directory, "top-level-return.ts");
    File.WriteAllText(scriptPath, "goto :done\n\n:done\nreturn\n");

    TextWriter originalOut = Console.Out;
    using var output = new StringWriter();
    try
    {
        Console.SetOut(output);
        using var interpreter = new ModInterpreter
        {
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        interpreter.Load(scriptPath, silent: true);

        if (interpreter.Count != 0)
            throw new InvalidOperationException($"Expected top-level return to stop the script, found {interpreter.Count} running.");
        if (output.ToString().Contains("Return without gosub", StringComparison.Ordinal))
            throw new InvalidOperationException("Top-level return emitted a script error.");
    }
    finally
    {
        Console.SetOut(originalOut);
        try { Directory.Delete(directory, recursive: true); } catch { }
    }
}

static void GameFileLockInspectionReportsStalePid()
{
    using var fixture = LockFixture.Create();
    GameFileLock.Info info = GameFileLock.TryInspect(fixture.LockFilePath)
        ?? throw new InvalidOperationException("Expected lock metadata to be readable.");

    if (info.Pid != int.MaxValue)
        throw new InvalidOperationException($"Expected stale PID {int.MaxValue}, got {info.Pid}.");

    if (info.IsProcessRunning)
        throw new InvalidOperationException("Expected fake PID to be reported as not running.");

    if (!string.Equals(Path.GetFullPath(fixture.ConfigPath), info.ConfigPath, StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected configPath metadata to round-trip.");
}

static void GameFileLockStaleRemovalDeletesLock()
{
    using var fixture = LockFixture.Create();
    if (!GameFileLock.TryRemoveIfStale(fixture.LockFilePath))
        throw new InvalidOperationException("Expected stale lock deletion to return true.");

    if (File.Exists(fixture.LockFilePath))
        throw new InvalidOperationException("Expected stale lock file to be deleted.");
}

sealed class InterpolationProbe
{
    public int FormatCount { get; private set; }

    public override string ToString()
    {
        FormatCount++;
        return "probe";
    }
}

sealed class BlockingReadStream : Stream
{
    public override bool CanRead => true;
    public override bool CanSeek => false;
    public override bool CanWrite => false;
    public override long Length => 0;
    public override long Position
    {
        get => 0;
        set => throw new NotSupportedException();
    }

    public override void Flush()
    {
    }

    public override int Read(byte[] buffer, int offset, int count)
    {
        Thread.Sleep(Timeout.Infinite);
        return 0;
    }

    public override async Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
    {
        await Task.Delay(Timeout.Infinite, cancellationToken);
        return 0;
    }

    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
}

sealed class DatabaseFixture : IDisposable
{
    private readonly string _directory;

    private DatabaseFixture(string directory, ModDatabase database)
    {
        _directory = directory;
        Database = database;
    }

    public ModDatabase Database { get; }

    public static DatabaseFixture Create(int sectors = 5000)
    {
        string directory = Path.Combine(Path.GetTempPath(), "twx-core-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);

        var database = new ModDatabase();
        database.CreateDatabase(Path.Combine(directory, "game.xdb"), new DataHeader
        {
            Sectors = sectors,
            CommandChar = '$',
        });
        ScriptRef.SetActiveDatabase(database);

        return new DatabaseFixture(directory, database);
    }

    public void Dispose()
    {
        ScriptRef.SetActiveDatabase(null);
        try { Database.CloseDatabase(); } catch { }
        try { Directory.Delete(_directory, recursive: true); } catch { }
    }
}

sealed class LockFixture : IDisposable
{
    private readonly string _directory;

    private LockFixture(string directory, string configPath, string lockFilePath)
    {
        _directory = directory;
        ConfigPath = configPath;
        LockFilePath = lockFilePath;
    }

    public string ConfigPath { get; }
    public string LockFilePath { get; }

    public static LockFixture Create()
    {
        string directory = Path.Combine(Path.GetTempPath(), "twx-core-lock-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        string configPath = Path.Combine(directory, "game.json");
        string databasePath = Path.Combine(directory, "game.xdb");
        string lockFilePath = GameFileLock.GetLockFilePath(configPath);

        File.WriteAllText(configPath, "{}");
        File.WriteAllText(lockFilePath, """
{
  "owner": "test",
  "pid": 2147483647,
  "processName": "missing-process",
  "configPath": "__CONFIG__",
  "databasePath": "__DATABASE__",
  "acquiredUtc": "2026-08-08T00:00:00.0000000+00:00"
}
""".Replace("__CONFIG__", EscapeJson(configPath), StringComparison.Ordinal)
   .Replace("__DATABASE__", EscapeJson(databasePath), StringComparison.Ordinal));

        return new LockFixture(directory, configPath, lockFilePath);
    }

    private static string EscapeJson(string value)
        => value.Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("\"", "\\\"", StringComparison.Ordinal);

    public void Dispose()
    {
        try { Directory.Delete(_directory, recursive: true); } catch { }
    }
}
