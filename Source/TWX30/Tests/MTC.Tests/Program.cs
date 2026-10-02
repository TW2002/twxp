using System.Reflection;
using System.Text;
using System.Net;
using System.Net.Sockets;
using MTC;

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var tests = new (string Name, Action Body)[]
{
    ("Native MomBot rejects server menus and fragmented command prompts", MombotPromptClassifierTests.Run),
    ("Sector exploration summary uses visited sectors and resets cleanly", SectorExplorationSummaryTests.Run),
    ("Split ANSI sequence keeps ESC introducer", SplitAnsiSequenceKeepsEscIntroducer),
    ("Standalone ESC echo drops only ESC", StandaloneEscEchoDropsOnlyEsc),
    ("Script callback echo cannot split server ANSI", () => ScriptEchoOrderingTests.Run("callback")),
    ("Timer echo cannot split server ANSI", () => ScriptEchoOrderingTests.Run("timer")),
    ("Literal echo cannot split server ANSI", () => ScriptEchoOrderingTests.Run("literal")),
    ("Ordinary broadcast cannot split server ANSI", () => ScriptEchoOrderingTests.Run("ordinary")),
    ("Deferred echo reaches deaf clients", () => ScriptEchoOrderingTests.Run("deaf")),
    ("Deferred echo flushes at a quiet prompt without newline", () => ScriptEchoOrderingTests.Run("quiet")),
    ("Native MomBot saved backdoor flag resolves startup backdoor", NativeMombotSavedBackdoorFlagResolvesStartupBackdoor),
    ("Native MomBot script booleans are numeric", NativeMombotScriptBooleansAreNumeric),
    ("Native MomBot startup waits for foreground scripts", NativeMombotStartupWaitsForForegroundScripts),
    ("Native MomBot startup retries a watch after relog stops", NativeMombotStartupWatchRetriesAfterRelogStops),
    ("Native MomBot queues user commands behind startup refresh", NativeMombotQueuesUserCommandsBehindStartupRefresh),
    ("Native MomBot disconnect aborts only an active startup refresh", NativeMombotDisconnectAbortsOnlyActiveStartupRefresh),
    ("Native MomBot dock move prefers StarDock over stale saved destination", NativeMombotDockMovePrefersStardock),
    ("Native MomBot dock move does not fallback to sector one", NativeMombotDockMoveDoesNotFallbackToSectorOne),
    ("Native MomBot new-game setup precedes startup move", NativeMombotNewGameSetupPrecedesStartupMove),
    ("Native MomBot mow passes destination to backdoor helper", NativeMombotMowPassesDestinationToBackdoorHelper),
    ("Native MomBot relog recognizes OpenTW server banner", NativeMombotRelogRecognizesOpenTwServerBanner),
    ("Native MomBot connectivity recognizes OpenTW server banner", NativeMombotConnectivityRecognizesOpenTwServerBanner),
    ("Native MomBot relog recognizes Select a game prompt", NativeMombotRelogRecognizesSelectGamePrompt),
    ("Native MomBot connectivity recognizes Select a game prompt", NativeMombotConnectivityRecognizesSelectGamePrompt),
    ("Native MomBot relog recognizes custom game menu prompts", NativeMombotRelogRecognizesCustomGameMenuPrompts),
    ("Native MomBot connectivity recognizes custom game menu prompts", NativeMombotConnectivityRecognizesCustomGameMenuPrompts),
    ("Native MomBot connectivity polls game menu prompt", NativeMombotConnectivityPollsGameMenuPrompt),
    ("Native MomBot destroyed return lands on Terra without porting", NativeMombotDestroyedReturnLandsOnTerraWithoutPorting),
    ("MomBot Tab T opens Terra kit on Terra", MombotTabTOpensTerraKitOnTerra),
    ("Bot menu resolves bot config in active tab", BotMenuResolvesBotConfigInActiveTab),
    ("MTC tab capture rejects mismatched bound globals", MtcTabCaptureRejectsMismatchedBoundGlobals),
    ("MTC connected tab blocks identity leakage", MtcConnectedTabBlocksIdentityLeakage),
    ("MTC connected tab close confirms before closing", MtcConnectedTabCloseConfirmsBeforeClosing),
    ("MTC recent can replace connected tab after confirmation", MtcRecentCanReplaceConnectedTabAfterConfirmation),
    ("MTC reset wipes variables without clearing game letter", MtcResetWipesVariablesWithoutClearingGameLetter),
    ("MTC tab popup raise does not activate or pin script windows", MtcTabPopupRaiseDoesNotActivateOrPinScriptWindows),
    ("MTC activation focus restore retries without stealing editor focus", MtcActivationFocusRestoreRetriesWithoutStealingEditorFocus),
    ("Macro settings window is modeless", MacroSettingsWindowIsModeless),
    ("Quick macro overlay keeps count editor usable", QuickMacroOverlayKeepsCountEditorUsable),
    ("Quick macro overlay edits macro text", QuickMacroOverlayEditsMacroText),
    ("Quick macro overlay supports edit shortcuts", QuickMacroOverlaySupportsEditShortcuts),
    ("Quick macro overlay play returns focus after send", QuickMacroOverlayPlayReturnsFocusAfterSend),
    ("Quick macro overlay is right aligned", QuickMacroOverlayIsRightAligned),
    ("Dock Shopper ship dropdown sizes to ship list", DockShopperShipDropdownSizesToShipList),
    ("Map window defaults to modern on macOS and Linux", MapWindowDefaultsToModernOnMacOsAndLinux),
    ("Map window view selector avoids popup controls", MapWindowViewSelectorAvoidsPopupControls),
    ("Map window opens with usable client size", MapWindowOpensWithUsableClientSize),
    ("Map windows cap live graph expansion", MapWindowsCapLiveGraphExpansion),
    ("Map render operations log Skia failures", MapRenderOperationsLogSkiaFailures),
    ("Tactical map builds snapshots off render path", TacticalMapBuildsSnapshotsOffRenderPath),
    ("Major Space Lanes toolbar reserves summary column", MajorSpaceLanesToolbarReservesSummaryColumn),
    ("MTC current sector highlights MSL sectors", MtcCurrentSectorHighlightsMslSectors),
    ("MTC preferences provide native MomBot defaults", MtcPreferencesProvideNativeMombotDefaults),
    ("Dead Ends view includes sortable Figged column", DeadEndsViewIncludesSortableFiggedColumn),
    ("Game size allows 1,000,000 sectors", GameSizeAllowsOneMillionSectors),
    ("Game size rejects values above 1,000,000 sectors", GameSizeRejectsValuesAboveOneMillionSectors),
    ("Proxy management removes servers from snapshot list", ProxyManagementRemovesServersFromSnapshotList),
    ("Proxy management form can save and test without selection", ProxyManagementFormCanSaveAndTestWithoutSelection),
    ("Proxy management client has bounded timeout", ProxyManagementClientHasBoundedTimeout),
    ("Proxy management client send does not capture sync context", ProxyManagementClientSendDoesNotCaptureSyncContext),
    ("Remote proxy native MomBot uses local config", RemoteProxyNativeMombotUsesLocalConfig),
    ("Remote proxy native MomBot stays local", RemoteProxyNativeMombotStaysLocal),
    ("Remote proxy native MomBot loads startup scripts", RemoteProxyNativeMombotLoadsStartupScripts),
    ("Remote proxy native MomBot runtime loads watcher", RemoteProxyNativeMombotRuntimeLoadsWatcher),
    ("Remote proxy native MomBot output marshals to UI tab", RemoteProxyNativeMombotOutputMarshalsToUiTab),
    ("Remote proxy native MomBot syncs prompt and intercepts input", RemoteProxyNativeMombotSyncsPromptAndInterceptsInput),
    ("Remote proxy native MomBot sends through management adapter", RemoteProxyNativeMombotSendsThroughManagementAdapter),
    ("Remote proxy native MomBot can connect through telnet adapter", RemoteProxyNativeMombotCanConnectThroughTelnetAdapter),
    ("Remote proxy native MomBot connect avoids UI dispatcher", RemoteProxyNativeMombotConnectAvoidsUiDispatcher),
    ("Remote proxy native MomBot seeds relog credentials from connection state", RemoteProxyNativeMombotSeedsRelogCredentialsFromConnectionState),
    ("Remote proxy native MomBot injects relog credentials directly", RemoteProxyNativeMombotInjectsRelogCredentialsDirectly),
    ("Native MomBot relog clears stale help command context", NativeMombotRelogClearsStaleHelpCommandContext),
    ("Remote proxy native MomBot exposes native state to scripts", RemoteProxyNativeMombotExposesNativeStateToScripts),
    ("Remote proxy native MomBot persists local variables", RemoteProxyNativeMombotPersistsLocalVariables),
    ("Native MomBot compatibility snapshot includes relog aliases", NativeMombotCompatibilitySnapshotIncludesRelogAliases),
    ("Native MomBot suppresses echoed outbound self commands", NativeMombotSuppressesEchoedOutboundSelfCommands),
    ("MTC removes the native MomBot outbound observer", MtcRemovesNativeMombotOutboundObserver),
    ("Native MomBot mode dispatch preserves child callers and replaces the full active chain", NativeMombotModeDispatchPreservesChildCallersAndReplacesActiveChain),
    ("Native MomBot relog sends configured name after loadvars", NativeMombotRelogSendsConfiguredNameAfterLoadvars),
    ("Native MomBot relog sends game letter at custom menu prompt", NativeMombotRelogSendsGameLetterAtCustomMenuPrompt),
    ("Native MomBot relog quickstats preserves the TWX marker byte", NativeMombotRelogQuickstatsPreservesMarkerByte),
    ("Native MomBot connectivity new game waits for TW menu after custom prompt", NativeMombotConnectivityNewGameWaitsForTwMenuAfterCustomPrompt),
    ("Native MomBot relog sends configured name through telnet adapter", NativeMombotRelogSendsConfiguredNameThroughTelnetAdapter),
    ("Script loadvar uses executing runtime context", ScriptLoadvarUsesExecutingRuntimeContext),
    ("Script send uses executing runtime server", ScriptSendUsesExecutingRuntimeServer),
    ("Remote proxy native MomBot handles script input locally", RemoteProxyNativeMombotHandlesScriptInputLocally),
    ("Native MomBot help does not synthesize extra game prompts", NativeMombotHelpDoesNotRestoreCachedGamePrompt),
    ("Installed mgrid help sends only TWX prompt markers", InstalledMgridHelpSendsOnlyTwxPromptMarkers),
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
        Console.Error.WriteLine($"FAIL {name}: {ex.Message}");
    }
}

return failed == 0 ? 0 : 1;

static void SplitAnsiSequenceKeepsEscIntroducer()
{
    var buffer = new TerminalBuffer(80, 10);
    var parser = new AnsiParser(buffer);

    parser.Feed(new byte[] { 0x1B }, 1);
    byte[] tail = Encoding.Latin1.GetBytes("[36mGalileo");
    parser.Feed(tail, tail.Length);

    AssertLine(buffer, 0, "Galileo");
    TerminalCell cell = buffer[0, 0];
    if (cell.Foreground.Equals(TerminalCell.Default.Foreground))
        throw new InvalidOperationException("Expected ANSI SGR to change the foreground color.");
}

static void StandaloneEscEchoDropsOnlyEsc()
{
    var buffer = new TerminalBuffer(80, 10);
    var parser = new AnsiParser(buffer);

    byte[] bytes = Encoding.Latin1.GetBytes("A");
    parser.Feed(bytes, bytes.Length);
    parser.Feed(new byte[] { 0x1B }, 1);
    bytes = Encoding.Latin1.GetBytes("B");
    parser.Feed(bytes, bytes.Length);

    AssertLine(buffer, 0, "AB");
}

static void NativeMombotSavedBackdoorFlagResolvesStartupBackdoor()
{
    string move = NativeMombotStartupBridge.ResolveStartupMove(
        botMowToDock: "true",
        botMowToDockLower: string.Empty,
        startMowOption: string.Empty,
        botMowToDockBackdoor: "true",
        botMowToDockBackdoorUpper: string.Empty);

    if (move != "backdoor")
        throw new InvalidOperationException($"Expected backdoor startup move, got '{move}'.");
}

static void NativeMombotScriptBooleansAreNumeric()
{
    if (NativeMombotStartupBridge.ToScriptBoolean(true) != "1")
        throw new InvalidOperationException("Expected true to be written as '1'.");

    if (NativeMombotStartupBridge.ToScriptBoolean(false) != "0")
        throw new InvalidOperationException("Expected false to be written as '0'.");
}

static void NativeMombotStartupWaitsForForegroundScripts()
{
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    if (!startupSource.Contains("_embeddedGameConfig?.Variables?.TryGetValue(variableName, out persistedValue!);", StringComparison.Ordinal) ||
        !startupSource.Contains("[MTC.NativeBotStart] startup data refresh={shouldRefresh}", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Startup refresh must use persisted per-game file paths and log its readiness decision.");
    }

    var automerchRunning = new[]
    {
        new TWXProxy.Core.RunningScriptInfo(
            1,
            "automerch.cts",
            "/Users/test/twx/scripts/mombot/local/modes/resource/automerch.cts",
            IsSystemScript: false,
            IsBot: false,
            Paused: true),
        new TWXProxy.Core.RunningScriptInfo(
            2,
            "watcher.cts",
            "scripts\\mombot\\startups\\watcher.cts",
            IsSystemScript: true,
            IsBot: false,
            Paused: true),
    };

    if (NativeMombotStartupBridge.CanTakeExclusiveServerControl(automerchRunning))
        throw new InvalidOperationException("Startup refresh must wait while Automerch owns the server session.");

    var startupOnly = new[]
    {
        new TWXProxy.Core.RunningScriptInfo(
            1,
            "refresh.cts",
            "scripts\\mombot\\commands\\general\\refresh.cts",
            IsSystemScript: false,
            IsBot: false,
            Paused: true),
        new TWXProxy.Core.RunningScriptInfo(
            2,
            "watcher.cts",
            "scripts\\mombot\\startups\\watcher.cts",
            IsSystemScript: true,
            IsBot: false,
            Paused: true),
    };

    if (!NativeMombotStartupBridge.CanTakeExclusiveServerControl(startupOnly))
        throw new InvalidOperationException("Startup-owned scripts must retain exclusive startup control.");
}

static void NativeMombotStartupWatchRetriesAfterRelogStops()
{
    int state = 0;
    if (!NativeMombotStartupBridge.RequestStartupWatch(ref state) || state != 1)
        throw new InvalidOperationException("The first prompt watch did not start.");
    if (NativeMombotStartupBridge.RequestStartupWatch(ref state) || state != 2)
        throw new InvalidOperationException("A script-stop watch was not retained while the prompt watch ran.");
    if (NativeMombotStartupBridge.RequestStartupWatch(ref state) || state != 2)
        throw new InvalidOperationException("Duplicate prompt events should coalesce into one follow-up pass.");
    if (!NativeMombotStartupBridge.FinishStartupWatchPass(ref state) || state != 1)
        throw new InvalidOperationException("The follow-up prompt watch was lost.");
    if (NativeMombotStartupBridge.FinishStartupWatchPass(ref state) || state != 0)
        throw new InvalidOperationException("The startup watch did not return to idle.");
    if (!NativeMombotStartupBridge.RequestStartupWatch(ref state))
        throw new InvalidOperationException("The startup watch could not run after returning to idle.");
    NativeMombotStartupBridge.FinishStartupWatchPass(ref state);
}

static void NativeMombotQueuesUserCommandsBehindStartupRefresh()
{
    if (!NativeMombotStartupBridge.ShouldQueueUserCommand(
            "automerch",
            startupDataGatherRunning: true,
            refreshScriptLoaded: true))
    {
        throw new InvalidOperationException("Automerch must wait until startup refresh releases the server session.");
    }

    if (!NativeMombotStartupBridge.ShouldQueueUserCommand(
            "merch 2000 e neg",
            startupDataGatherRunning: false,
            refreshScriptLoaded: true))
    {
        throw new InvalidOperationException("Script commands must wait while refresh.cts is still loaded.");
    }

    if (NativeMombotStartupBridge.ShouldQueueUserCommand(
            "automerch",
            startupDataGatherRunning: false,
            refreshScriptLoaded: false))
    {
        throw new InvalidOperationException("Commands must dispatch immediately when startup refresh is idle.");
    }

    if (NativeMombotStartupBridge.ShouldQueueUserCommand(
            "stopall",
            startupDataGatherRunning: true,
            refreshScriptLoaded: true))
    {
        throw new InvalidOperationException("Native stop controls must remain available during startup refresh.");
    }

    if (!NativeMombotStartupBridge.ShouldClearQueuedUserCommands("stop automerch"))
        throw new InvalidOperationException("Stop controls must cancel queued commands.");
}

static void NativeMombotDisconnectAbortsOnlyActiveStartupRefresh()
{
    if (!NativeMombotStartupBridge.ShouldAbortStartupRefreshOnDisconnect(
            startupDataGatherRunning: true,
            refreshScriptLoaded: true))
    {
        throw new InvalidOperationException("Expected an active startup refresh to be aborted on disconnect.");
    }

    if (NativeMombotStartupBridge.ShouldAbortStartupRefreshOnDisconnect(
            startupDataGatherRunning: false,
            refreshScriptLoaded: true))
    {
        throw new InvalidOperationException("A manual refresh must not be aborted by startup-refresh cleanup.");
    }

    if (NativeMombotStartupBridge.ShouldAbortStartupRefreshOnDisconnect(
            startupDataGatherRunning: true,
            refreshScriptLoaded: false))
    {
        throw new InvalidOperationException("Startup cleanup must not affect any script when refresh is not loaded.");
    }
}

static void NativeMombotDockMovePrefersStardock()
{
    string destination = NativeMombotStartupBridge.ResolveDockMowDestination(
        mowToDock: true,
        stardock: "3576",
        savedDestination: "1");

    if (destination != "3576")
        throw new InvalidOperationException($"Expected StarDock sector 3576, got '{destination}'.");
}

static void NativeMombotDockMoveDoesNotFallbackToSectorOne()
{
    string destination = NativeMombotStartupBridge.ResolveDockMowDestination(
        mowToDock: true,
        stardock: string.Empty,
        savedDestination: "1");

    if (destination != string.Empty)
        throw new InvalidOperationException($"Expected no fallback destination, got '{destination}'.");
}

static void NativeMombotNewGameSetupPrecedesStartupMove()
{
    string source = ReadMombotSource("include", "connectivity.ts");
    int resume = source.IndexOf(":connectivity~resumestartaftercorpjoin", StringComparison.OrdinalIgnoreCase);
    int deferEarlyMove = source.IndexOf(
        "if (($menus~mowdestination <> \"\") and ($connectivity~newgame <> true))",
        StringComparison.OrdinalIgnoreCase);
    int newGameSetup = source.IndexOf("if ($connectivity~newgame)", resume, StringComparison.OrdinalIgnoreCase);
    int postSetupMove = source.IndexOf(
        "if (($menus~mowdestination = \"\") or ($connectivity~newgame = true))",
        newGameSetup,
        StringComparison.OrdinalIgnoreCase);

    if (resume < 0 || deferEarlyMove < resume)
        throw new InvalidOperationException("Expected startup movement to be deferred before new-game setup.");

    if (newGameSetup < 0 || postSetupMove < newGameSetup)
        throw new InvalidOperationException("Expected startup movement to run after new-game setup.");
}

static void NativeMombotMowPassesDestinationToBackdoorHelper()
{
    string source = ReadMombotSource("modes", "grid", "mow.ts");
    int helperCall = source.IndexOf("gosub :sector~getbackdoor", StringComparison.OrdinalIgnoreCase);
    int destinationAssignment = source.LastIndexOf(
        "setvar $sector~destination $player~destination",
        helperCall,
        StringComparison.OrdinalIgnoreCase);

    if (helperCall < 0)
        throw new InvalidOperationException("Expected mow.ts to call :sector~getbackdoor.");

    if (destinationAssignment < 0)
        throw new InvalidOperationException("Expected mow.ts to set $sector~destination before calling :sector~getbackdoor.");
}

static void NativeMombotRelogRecognizesOpenTwServerBanner()
{
    string source = ReadMombotSource("commands", "general", "relog.ts");

    if (!source.Contains("settexttrigger loginsuccessful3 :continuerelog4 \"OpenTW Server\"", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected relog.ts to recognize the OpenTW server banner.");

    if (!source.Contains("killtrigger loginsuccessful3", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected relog.ts to clear the OpenTW login trigger.");
}

static void NativeMombotConnectivityRecognizesOpenTwServerBanner()
{
    string source = ReadMombotSource("include", "connectivity.ts");

    if (!source.Contains("settexttrigger loginsuccessful3 :continuerelog4v2 \"OpenTW Server\"", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected connectivity.ts to treat OpenTW as a v2-style login flow.");

    if (!source.Contains("killtrigger loginsuccessful3", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected connectivity.ts to clear the OpenTW login trigger.");
}

static void NativeMombotRelogRecognizesSelectGamePrompt()
{
    string source = ReadMombotSource("commands", "general", "relog.ts");

    if (!source.Contains("setstrigger relogselect :continuerelog5 \"Select a game\"", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected relog.ts to recognize TWGS Select a game prompt variants.");

    if (!source.Contains("killtrigger relogselect", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected relog.ts to clear the Select a game prompt trigger.");
}

static void NativeMombotConnectivityRecognizesSelectGamePrompt()
{
    string source = ReadMombotSource("include", "connectivity.ts");

    if (!source.Contains("setstrigger relog5 :continuerelog5 \"Select a game\"", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected connectivity.ts to recognize TWGS Select a game prompt variants.");

    if (source.Contains("send \"#\"&#8", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Connectivity login must not revive the old # prompt nudge.");

    if (!source.Contains("killtrigger relog5", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected connectivity.ts to clear the Select a game prompt trigger.");
}

static void NativeMombotRelogRecognizesCustomGameMenuPrompts()
{
    string source = ReadMombotSource("commands", "general", "relog.ts");

    AssertCustomGameMenuFallback(
        source,
        "$relog~",
        ":saw_game_letter_on_menu",
        ":check_first_game_menu_prompt",
        "Expected relog.ts to detect a custom sysop menu by game-letter entry and stable prompt.");
}

static void NativeMombotConnectivityRecognizesCustomGameMenuPrompts()
{
    string source = ReadMombotSource("include", "connectivity.ts");

    AssertCustomGameMenuFallback(
        source,
        "$connectivity~",
        ":connectivity~saw_game_letter_on_menu",
        ":check_first_game_menu_prompt",
        "Expected connectivity.ts to detect a custom sysop menu by game-letter entry and stable prompt.");
}

static void NativeMombotConnectivityPollsGameMenuPrompt()
{
    string source = ReadMombotSource("include", "connectivity.ts");

    if (!source.Contains("setstrigger enter :enter_game_menu \"Enter your choice\"", StringComparison.OrdinalIgnoreCase) ||
        !source.Contains("setdelaytrigger relogmenupromptcheck :check_game_menu_prompt 100", StringComparison.OrdinalIgnoreCase) ||
        !source.Contains("getwordpos $connectivity~line $connectivity~pos \"Enter your choice\"", StringComparison.OrdinalIgnoreCase) ||
        !source.Contains("goto :enter_game_menu", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Expected connectivity.ts to recover if the game menu prompt is already current.");
    }

    int enterMenu = source.IndexOf(":connectivity~enter_game_menu", StringComparison.OrdinalIgnoreCase);
    int doneRelog = source.IndexOf(":connectivity~done_do_relog", StringComparison.OrdinalIgnoreCase);
    int gameNotOpen = source.IndexOf(":connectivity~game_not_open", StringComparison.OrdinalIgnoreCase);
    string enterBody = doneRelog > enterMenu ? source[enterMenu..doneRelog] : string.Empty;
    string doneBody = gameNotOpen > doneRelog ? source[doneRelog..gameNotOpen] : string.Empty;

    if (enterMenu < 0 || !enterBody.Contains("send \"T***\"", StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Expected connectivity.ts to send T only from the game-menu branch.");

    if (doneBody.StartsWith(":connectivity~done_do_relog", StringComparison.OrdinalIgnoreCase) &&
        doneBody.Contains("send \"T***\"", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Expected already-in-game relog completion to return without sending T.");
    }
}

static void AssertCustomGameMenuFallback(
    string source,
    string variablePrefix,
    string seenLabel,
    string probeLabel,
    string errorMessage)
{
    foreach (string expected in new[]
             {
                 $"setvar {variablePrefix}saw_game_letter false",
                 $"setvar {variablePrefix}game_letter_marker $bot~letter&\" - \"",
                 $"setvar {variablePrefix}game_letter_marker \"<\"&$bot~letter&\">\"",
                 $"setvar {variablePrefix}game_letter_marker \"[\"&$bot~letter&\"]\"",
                 $"setvar {variablePrefix}game_letter_marker \"(\"&$bot~letter&\")\"",
                 $"settexttrigger relogletterdash {seenLabel}",
                 $"settexttrigger relogletterangle {seenLabel}",
                 $"settexttrigger relogletterbracket {seenLabel}",
                 $"settexttrigger relogletterparen {seenLabel}",
                 $"setdelaytrigger relogmenupromptcheck {probeLabel} 200",
                 $"if ({variablePrefix}saw_game_letter = true)",
                 $"if ({variablePrefix}line = {variablePrefix}menu_probe_line)",
                 $"if ({variablePrefix}menu_probe_count >= 3)",
                 "getwordpos " + variablePrefix + "line " + variablePrefix + "pos \"Menu\"",
                 "killtrigger relogletterdash",
                 "killtrigger relogletterangle",
                 "killtrigger relogletterbracket",
                 "killtrigger relogletterparen",
             })
    {
        if (!source.Contains(expected, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"{errorMessage} Missing '{expected}'.");
    }
}

static void NativeMombotDestroyedReturnLandsOnTerraWithoutPorting()
{
    string connectivitySource = ReadMombotSource("include", "connectivity.ts");
    string packagedConnectivitySource = ReadRepoSource("scripts", "mombot", "include", "connectivity.ts");
    string nativeStartupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string relogDialogSource = ReadRepoSource("Source", "MTC", "mombot", "mombotRelogDialog.cs");
    string newConnectionSource = ReadRepoSource("Source", "MTC", "NewConnectionDialog.cs");

    foreach ((string name, string source) in new[]
    {
        ("source connectivity.ts", connectivitySource),
        ("packaged connectivity.ts", packagedConnectivitySource),
    })
    {
        int shipPrompt = source.IndexOf("settexttrigger return_ship_confirm :return_ship_confirm \" is what you want?\"", StringComparison.OrdinalIgnoreCase);
        int sendShipName = source.IndexOf("send $bot~startshipname&\"*\"", StringComparison.OrdinalIgnoreCase);
        int shipConfirm = source.IndexOf(":connectivity~return_ship_confirm", StringComparison.OrdinalIgnoreCase);
        int terraTrigger = source.IndexOf("setstrigger return_landed_on_terra :return_landed_on_terra \"Do you wish to (L)eave or (T)ake Colonists?\"", StringComparison.OrdinalIgnoreCase);
        int sendLand = source.IndexOf("send \"YL\"", StringComparison.OrdinalIgnoreCase);
        if (shipPrompt < 0 || sendShipName < 0 || shipConfirm < 0 || terraTrigger < 0 || sendLand < 0)
        {
            throw new InvalidOperationException($"Expected {name} to wait for ship-name confirmation, then queue YL for immediate Terra landing.");
        }

        if (!(shipPrompt < sendShipName && sendShipName < shipConfirm && shipConfirm < terraTrigger && terraTrigger < sendLand))
        {
            throw new InvalidOperationException($"{name} must send YL only after the ship-name confirmation prompt is visible.");
        }

        if (source.Contains("settexttrigger return_command_prompt", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"{name} must not wait for the command prompt before landing on Terra.");

        if (source.Contains("send $bot~startshipname&\"**L\"", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"{name} must not rely on Enter accepting the ship-name confirmation prompt.");

        if (source.Contains("send $bot~startshipname&\"*L\"", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"{name} must not send L into the ship-name confirmation prompt.");

        if (source.Contains("send $bot~startshipname&\"*Y l \"", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"{name} must not confirm ship rename before sending the Terra landing command.");
    }

    if (!nativeStartupSource.Contains("landOnTerraAfterShipRename", StringComparison.Ordinal) ||
        !nativeStartupSource.Contains("UsesNativeMombotShipRenameTerraLanding(relogSettings)", StringComparison.Ordinal) ||
        !nativeStartupSource.Contains("string macro = UsesNativeMombotShipRenameTerraLanding(relogSettings)", StringComparison.Ordinal) ||
        !nativeStartupSource.Contains("[\"$menus~landonterra\"] = ToMombotScriptBoolean(landOnTerraAfterShipRename)", StringComparison.Ordinal) ||
        !nativeStartupSource.Contains("private const string NativeMombotLandOnTerraMacro = \"L\";", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected native return-after-destroyed Land on Terra to use the ship-rename landing path without arming a second macro.");
    }

    if (nativeStartupSource.Contains("? \"pt\"", StringComparison.Ordinal) ||
        relogDialogSource.Contains("? \"pt\"", StringComparison.Ordinal) ||
        newConnectionSource.Contains("macroAfterLogin = \"pt\"", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native Land on Terra must use L, not the port macro pt.");
    }
}

static void MombotTabTOpensTerraKitOnTerra()
{
    string source = ReadMombotSource("include", "internal_commands.ts");
    string packagedSource = ReadRepoSource("scripts", "mombot", "include", "internal_commands.ts");
    string macroKitSource = ReadMombotSource("preload", "_macro_kit.ts");
    string mtcSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");

    foreach ((string name, string text) in new[]
    {
        ("source internal_commands.ts", source),
        ("packaged internal_commands.ts", packagedSource),
    })
    {
        int twarpSwitch = text.IndexOf(":internal_commands~twarpswitch", StringComparison.OrdinalIgnoreCase);
        int currentPrompt = text.IndexOf("gosub :player~currentprompt", twarpSwitch, StringComparison.OrdinalIgnoreCase);
        int terraSectorCheck = text.IndexOf("(currentsector = 1) or ($player~current_sector = 1)", twarpSwitch, StringComparison.OrdinalIgnoreCase);
        int terraPromptCheck = text.IndexOf("($player~current_prompt = \"Do\") or ($player~current_prompt = \"How\")", twarpSwitch, StringComparison.OrdinalIgnoreCase);
        int macroKit = text.IndexOf("setvar $bot~user_command_line \"macro_kit\"", twarpSwitch, StringComparison.OrdinalIgnoreCase);
        int twarpInput = text.IndexOf("getinput $bot~parm1 \"Twarp To:\"", twarpSwitch, StringComparison.OrdinalIgnoreCase);
        int twarpCommand = text.IndexOf("setvar $bot~user_command_line \"twarp \"&$bot~parm1&\" \"", twarpSwitch, StringComparison.OrdinalIgnoreCase);

        if (twarpSwitch < 0 || currentPrompt < 0 || terraSectorCheck < 0 || terraPromptCheck < 0 || macroKit < 0 || twarpInput < 0 || twarpCommand < 0)
            throw new InvalidOperationException($"Expected {name} to route sector-1/Terra Tab T through macro_kit and non-Terra Tab T through twarp.");

        if (!(twarpSwitch < currentPrompt && currentPrompt < terraSectorCheck && terraSectorCheck < terraPromptCheck && terraPromptCheck < macroKit && macroKit < twarpInput && twarpInput < twarpCommand))
            throw new InvalidOperationException($"{name} must check Terra prompt before asking for a Twarp destination.");
    }

    int macroKitTerraSectorCheck = macroKitSource.IndexOf("(currentsector = 1) or ($player~current_sector = 1)", StringComparison.OrdinalIgnoreCase);
    int macroKitTerraPromptCheck = macroKitSource.IndexOf("($startinglocation = \"Do\") or ($startinglocation = \"How\")", StringComparison.OrdinalIgnoreCase);
    int macroKitTerraMenu = macroKitSource.IndexOf(":print_the__terra_menu", StringComparison.OrdinalIgnoreCase);
    int macroKitDockMenu = macroKitSource.IndexOf(":print_the_menu", StringComparison.OrdinalIgnoreCase);
    if (macroKitTerraSectorCheck < 0 || macroKitTerraPromptCheck < 0 || macroKitTerraMenu < 0 || macroKitDockMenu < 0)
        throw new InvalidOperationException("Expected _macro_kit.ts to use sector 1 and Terra prompts for Terra kit selection.");

    if (!(macroKitTerraSectorCheck < macroKitTerraMenu && macroKitTerraMenu < macroKitDockMenu))
        throw new InvalidOperationException("_macro_kit.ts must choose the Terra kit before falling through to the dock kit.");

    int nativeLocalTwarpSwitch = mtcSource.IndexOf("case \":internal_commands~twarpswitch\":", StringComparison.OrdinalIgnoreCase);
    int nativeLocalTerraCheck = mtcSource.IndexOf("if (IsMombotAtTerra())", nativeLocalTwarpSwitch, StringComparison.OrdinalIgnoreCase);
    int nativeLocalMacroKit = mtcSource.IndexOf("await ExecuteMombotHotkeyCommandAsync(\"macro_kit\")", nativeLocalTwarpSwitch, StringComparison.OrdinalIgnoreCase);
    int nativeLocalTwarpPrompt = mtcSource.IndexOf("BeginMombotPrompt(\"twarp \")", nativeLocalTwarpSwitch, StringComparison.OrdinalIgnoreCase);
    if (nativeLocalTwarpSwitch < 0 || nativeLocalTerraCheck < 0 || nativeLocalMacroKit < 0 || nativeLocalTwarpPrompt < 0 ||
        !(nativeLocalTwarpSwitch < nativeLocalTerraCheck && nativeLocalTerraCheck < nativeLocalMacroKit && nativeLocalMacroKit < nativeLocalTwarpPrompt))
    {
        throw new InvalidOperationException("Native local Tab T hotkey must route Terra/sector-1 through macro_kit before opening the twarp prompt.");
    }

    int nativeRemoteTwarpSwitch = mtcSource.IndexOf("case \":internal_commands~twarpswitch\":", nativeLocalTwarpPrompt, StringComparison.OrdinalIgnoreCase);
    int nativeRemoteTerraCheck = mtcSource.IndexOf("if (IsMombotAtTerra())", nativeRemoteTwarpSwitch, StringComparison.OrdinalIgnoreCase);
    int nativeRemoteMacroKit = mtcSource.IndexOf("await ExecuteMombotUiCommandAsync(\"macro_kit\")", nativeRemoteTwarpSwitch, StringComparison.OrdinalIgnoreCase);
    int nativeRemoteTwarpPrompt = mtcSource.IndexOf("NativeBotClientInputResult.StartPrompt(\"twarp \")", nativeRemoteTwarpSwitch, StringComparison.OrdinalIgnoreCase);
    if (nativeRemoteTwarpSwitch < 0 || nativeRemoteTerraCheck < 0 || nativeRemoteMacroKit < 0 || nativeRemoteTwarpPrompt < 0 ||
        !(nativeRemoteTwarpSwitch < nativeRemoteTerraCheck && nativeRemoteTerraCheck < nativeRemoteMacroKit && nativeRemoteMacroKit < nativeRemoteTwarpPrompt))
    {
        throw new InvalidOperationException("Native remote Tab T hotkey must route Terra/sector-1 through macro_kit before opening the twarp prompt.");
    }

    if (!mtcSource.Contains("private bool IsMombotAtTerra()", StringComparison.Ordinal) ||
        !mtcSource.Contains("GetCurrentSector(CurrentMombotRuntimeContext()) == 1", StringComparison.Ordinal) ||
        !mtcSource.Contains("ReadCurrentMombotSectorVar(\"0\", \"$PLAYER~CURRENT_SECTOR\", \"$player~current_sector\")", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native Tab T Terra detection must use script runtime sector and Mombot sector variables.");
    }
}

static void MtcTabPopupRaiseDoesNotActivateOrPinScriptWindows()
{
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");
    string scriptWindowSource = ReadRepoSource("Source", "MTC", "AvaloniaScriptWindow.cs");

    int bringMethod = tabbedSource.IndexOf("private void BringMtcTabOwnedWindowsToForeground", StringComparison.Ordinal);
    int titleMethod = tabbedSource.IndexOf("private void ApplyMtcTabOwnedWindowTitle", StringComparison.Ordinal);
    string bringBody = titleMethod > bringMethod ? tabbedSource[bringMethod..titleMethod] : tabbedSource[bringMethod..];

    if (bringBody.Contains("window.Activate()", StringComparison.Ordinal))
        throw new InvalidOperationException("Tab-owned popup raise must not activate child windows.");

    if (!bringBody.Contains("BringMtcTabOwnedWindowForwardWithoutActivation(window)", StringComparison.Ordinal) ||
        !bringBody.Contains("scriptWindow.RaiseForTabSelection()", StringComparison.Ordinal) ||
        !bringBody.Contains("window.Topmost = restoreTopmost", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tab-owned popup raise to be transient and non-activating.");
    }

    if (!scriptWindowSource.Contains("ShowActivated = false", StringComparison.Ordinal) ||
        !scriptWindowSource.Contains("public void RaiseForTabSelection()", StringComparison.Ordinal) ||
        !scriptWindowSource.Contains("Topmost = false", StringComparison.Ordinal) ||
        !scriptWindowSource.Contains("bool effectiveOnTop = false", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected script popups to avoid activation and ignore script-requested topmost.");
    }

    if (scriptWindowSource.Contains("Topmost = true", StringComparison.Ordinal) ||
        scriptWindowSource.Contains("Topmost    = onTop", StringComparison.Ordinal) ||
        scriptWindowSource.Contains("bool effectiveOnTop = onTop", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Script popups must not use native Topmost to raise or stay in front.");
    }
}

static void MtcActivationFocusRestoreRetriesWithoutStealingEditorFocus()
{
    string startupSource = ReadRepoSource("Source", "MTC", "WindowStartup.cs");
    string shellSource = ReadRepoSource("Source", "MTC", "ShellLayout.cs");

    if (!startupSource.Contains("Activated += (_, _) => RequestActiveTerminalFocusForWindowActivation();", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected window activation to use the guarded terminal focus restore path.");

    int request = shellSource.IndexOf("private void RequestActiveTerminalFocusForWindowActivation()", StringComparison.Ordinal);
    int preserve = shellSource.IndexOf("private static bool ShouldPreserveFocusedElementForActivation", StringComparison.Ordinal);
    string requestBody = preserve > request ? shellSource[request..preserve] : shellSource[request..];

    if (request < 0 ||
        !requestBody.Contains("TryFocusActiveTerminalForWindowActivation(ticket)", StringComparison.Ordinal) ||
        !requestBody.Contains("DispatcherPriority.Input", StringComparison.Ordinal) ||
        !requestBody.Contains("DispatcherPriority.Loaded", StringComparison.Ordinal) ||
        !requestBody.Contains("RetryActiveTerminalFocusAfterActivationAsync(ticket)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected activation focus restore to retry across activation/layout turns.");
    }

    string preserveBody = preserve >= 0 ? shellSource[preserve..] : string.Empty;
    if (!preserveBody.Contains("focused is TextBox or ComboBox or NumericUpDown", StringComparison.Ordinal) ||
        !preserveBody.Contains("ReferenceEquals(focused, target)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected activation focus restore to preserve active terminal and editor controls.");
    }
}

static void MtcTabCaptureRejectsMismatchedBoundGlobals()
{
    string source = ReadRepoSource("Source", "MTC", "TabbedShell.cs");
    int capture = source.IndexOf("private void CaptureMtcTabSession", StringComparison.Ordinal);
    int bind = source.IndexOf("private void BindMtcTabSession", StringComparison.Ordinal);
    string body = bind > capture ? source[capture..bind] : source[capture..];

    if (!body.Contains("if (!IsMtcTabSessionCurrentlyBound(tab))", StringComparison.Ordinal) ||
        !body.Contains("[MTC.TabIsolation] skipped capture", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tab capture to reject mismatched global session state.");
    }

    if (!source.Contains("ReferenceEquals(_state, tab.State)", StringComparison.Ordinal) ||
        !source.Contains("ReferenceEquals(_buffer, tab.Buffer)", StringComparison.Ordinal) ||
        !source.Contains("ReferenceEquals(_parser, tab.Parser)", StringComparison.Ordinal) ||
        !source.Contains("ReferenceEquals(_mombot, tab.Mombot)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tab capture guard to verify the bound tab owns the mutable session globals.");
    }
}

static void MtcConnectedTabBlocksIdentityLeakage()
{
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");
    string persistenceSource = ReadRepoSource("Source", "MTC", "GamePersistence.cs");
    string commandsSource = ReadRepoSource("Source", "MTC", "ConnectionCommands.cs");
    string startupSource = ReadRepoSource("Source", "MTC", "WindowStartup.cs");

    if (!tabbedSource.Contains("CanMtcTabAdoptGameIdentity", StringComparison.Ordinal) ||
        !tabbedSource.Contains("IsMtcTabConnectedToServer(owner)", StringComparison.Ordinal) ||
        !tabbedSource.Contains("[MTC.TabIsolation] blocked", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected connected tabs to block silent game identity changes.");
    }

    if (tabbedSource.Contains("owner.GameInstance?.IsRunning == true", StringComparison.Ordinal))
        throw new InvalidOperationException("Disconnected embedded proxy runtimes must not block tab identity replacement.");

    if (!startupSource.Contains("private bool IsMtcTabConnectedToServer", StringComparison.Ordinal) ||
        !startupSource.Contains("IsManagedRemoteProxyGame(tab.State)", StringComparison.Ordinal) ||
        !startupSource.Contains("IsManagedRemoteProxyTabConnectedToGameServer(tab)", StringComparison.Ordinal) ||
        !startupSource.Contains("currentLine.StartsWith(\"Main>\"", StringComparison.Ordinal) ||
        !startupSource.Contains("Type $c to reconnect", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected remote proxy menu tabs to be distinguished from connected game sessions.");
    }

    if (!persistenceSource.Contains("CanCurrentMtcTabAdoptGameIdentity(p.Name, \"profile\")", StringComparison.Ordinal) ||
        !persistenceSource.Contains("CanCurrentMtcTabAdoptGameIdentity(gameName, \"save-config\")", StringComparison.Ordinal) ||
        !persistenceSource.Contains("CanCurrentMtcTabAdoptGameIdentity(targetGameName, \"load-game\")", StringComparison.Ordinal) ||
        !commandsSource.Contains("CanCurrentMtcTabAdoptGameIdentity(gameName, \"sync-embedded-proxy\")", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected profile/config paths to apply the connected-tab identity guard.");
    }
}

static void MtcConnectedTabCloseConfirmsBeforeClosing()
{
    string source = ReadRepoSource("Source", "MTC", "TabbedShell.cs");

    int closeMethod = source.IndexOf("private async Task CloseMtcTabAsync", StringComparison.Ordinal);
    int confirmMethod = source.IndexOf("private async Task<bool> ConfirmCloseConnectedMtcTabAsync", StringComparison.Ordinal);
    int restoreMethod = source.IndexOf("private void RestoreActiveMtcTabContent", StringComparison.Ordinal);
    if (closeMethod < 0 || confirmMethod < 0)
        throw new InvalidOperationException("Expected tab close to use a connected-close confirmation helper.");

    string closeBody = confirmMethod > closeMethod ? source[closeMethod..confirmMethod] : source[closeMethod..];
    string confirmBody = restoreMethod > confirmMethod ? source[confirmMethod..restoreMethod] : source[confirmMethod..];

    if (!closeBody.Contains("if (!await ConfirmCloseConnectedMtcTabAsync(tab))", StringComparison.Ordinal))
        throw new InvalidOperationException("Tab close must confirm before closing a connected tab.");

    if (!confirmBody.Contains("IsMtcTabConnectedToServer(tab)", StringComparison.Ordinal) ||
        !confirmBody.Contains("BuildCloseConnectedGamesMessage([tab])", StringComparison.Ordinal) ||
        !confirmBody.Contains("ShowConfirmAsync(", StringComparison.Ordinal) ||
        !confirmBody.Contains("_mtcTabClosePromptTabIds.Add(tab.Id)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tab X close to reuse connected-game confirmation and suppress duplicate prompts.");
    }
}

static void MtcRecentCanReplaceConnectedTabAfterConfirmation()
{
    string recentSource = ReadRepoSource("Source", "MTC", "RecentAndNativeMenus.cs");
    string persistenceSource = ReadRepoSource("Source", "MTC", "GamePersistence.cs");
    string commandsSource = ReadRepoSource("Source", "MTC", "ConnectionCommands.cs");

    if (!recentSource.Contains("OpenPathAsync(path, addToRecent: true, allowReplaceConnectedTab: true)", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected File > Recent to explicitly allow confirmed connected-tab replacement.");

    if (!commandsSource.Contains("OpenPathAsync(path, addToRecent: true, allowReplaceConnectedTab: true)", StringComparison.Ordinal) ||
        CountOccurrences(commandsSource, "ApplyLoadedGameConfigAsync(config, path, addToRecent: true, allowReplaceConnectedTab: true)") < 2)
    {
        throw new InvalidOperationException("Expected File > Open, New Connection, and Save As to allow confirmed connected-tab replacement.");
    }

    if (!persistenceSource.Contains("PrepareCurrentTabForGameLoadAsync(targetGameName, allowReplaceConnectedTab)", StringComparison.Ordinal) ||
        !persistenceSource.Contains("Are you sure you want to close the connection to {currentGameName}?", StringComparison.Ordinal) ||
        !persistenceSource.Contains("DisconnectCurrentTabForGameReplacementAsync(tab)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected recent game loading to confirm and cleanly disconnect before replacing a connected tab.");
    }

    if (!persistenceSource.Contains("await StopEmbeddedAsync()", StringComparison.Ordinal) ||
        !persistenceSource.Contains("_telnet.Disconnect()", StringComparison.Ordinal) ||
        !persistenceSource.Contains("CloseMtcTabOwnedWindows(tab)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected replacement to close tab-owned windows and stop embedded or telnet sessions.");
    }
}

static void MtcResetWipesVariablesWithoutClearingGameLetter()
{
    string runtimeSource = ReadRepoSource("Source", "MTC", "RuntimeState.cs");
    string configSource = ReadRepoSource("Source", "MTC", "GameConfigService.cs");
    string notesSource = ReadRepoSource("Source", "MTC", "NotesPanel.cs");

    int resetMethod = runtimeSource.IndexOf("private async Task OnResetGameAsync()", StringComparison.Ordinal);
    int identityMethod = runtimeSource.IndexOf("private void ResetEmbeddedGameIdentity", StringComparison.Ordinal);
    int storageMethod = runtimeSource.IndexOf("private void ResetMombotGameStorage", StringComparison.Ordinal);

    if (resetMethod < 0 || identityMethod < 0 || storageMethod < 0)
        throw new InvalidOperationException("Could not locate reset methods in RuntimeState.cs.");

    string resetBody = runtimeSource[resetMethod..identityMethod];
    if (!resetBody.Contains("Core.ScriptRef.SetOnVariableSaved(runtimeContext, null)", StringComparison.Ordinal) ||
        !resetBody.Contains("Core.ScriptRef.ClearCurrentGameVars(runtimeContext)", StringComparison.Ordinal) ||
        !resetBody.Contains("await GameConfigService.ResetVariablesAsync(gameName, config.Variables)", StringComparison.Ordinal) ||
        !resetBody.Contains("ResetNotesForGame(gameName)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected reset to detach variable saves, clear runtime variables, reset variables.json, and reset notes.");
    }

    string identityBody = runtimeSource[identityMethod..storageMethod];
    if (identityBody.Contains("config.GameLetter = string.Empty", StringComparison.Ordinal))
        throw new InvalidOperationException("Reset must preserve the configured game letter.");

    if (!configSource.Contains("public static async Task ResetVariablesAsync", StringComparison.Ordinal) ||
        !configSource.Contains("VariableSaves.ResetAsync", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected MTC GameConfigService to expose debounced variable reset.");
    }

    if (!notesSource.Contains("private void ResetNotesForGame(string gameName)", StringComparison.Ordinal) ||
        !notesSource.Contains("File.Delete(path)", StringComparison.Ordinal) ||
        !notesSource.Contains("_notesSaveTimer?.Stop()", StringComparison.Ordinal) ||
        !notesSource.Contains("tab.NotesText = string.Empty", StringComparison.Ordinal) ||
        !notesSource.Contains("_notesTextBox.Text = string.Empty", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected MTC reset to clear notes from disk, tab state, and the visible notes panel.");
    }
}

static void BotMenuResolvesBotConfigInActiveTab()
{
    string source = ReadRepoSource("Source", "MTC", "BotMenus.cs");

    if (!source.Contains("StartConfiguredBotFromCurrentTabAsync", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected bot start actions to resolve config after binding the active tab.");

    if (!source.Contains("StartConfiguredNativeMombotNewGameFromCurrentTabAsync", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected native new-game actions to resolve config after binding the active tab.");

    if (!source.Contains("ConfigureBotFromCurrentTabAsync", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected bot configure actions to resolve config after binding the active tab.");

    if (source.Contains("=> StartConfiguredBotAsync(", StringComparison.Ordinal) ||
        source.Contains("=> StartConfiguredNativeMombotNewGameAsync(", StringComparison.Ordinal) ||
        source.Contains("=> ConfigureBotAsync(", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Bot menu click handlers must not capture StoredBotSection objects from a previous tab.");
    }
}

static void MacroSettingsWindowIsModeless()
{
    string source = ReadRepoSource("Source", "MTC", "RuntimeState.cs");
    int method = source.IndexOf("private Task OnMacrosAsync()", StringComparison.Ordinal);
    if (method < 0)
        throw new InvalidOperationException("Expected macro settings opener to be a non-modal task.");

    int save = source.IndexOf("private void SaveMacroBindings", method, StringComparison.Ordinal);
    string body = save > method ? source[method..save] : source[method..];

    if (body.Contains("ShowDialog", StringComparison.Ordinal))
        throw new InvalidOperationException("Macro settings must not use ShowDialog because it blocks console focus.");

    if (!body.Contains("ShowMtcTabOwnedWindow(owner, dialog, activate: false)", StringComparison.Ordinal) ||
        !body.Contains("dialog.ShowActivated = false", StringComparison.Ordinal) ||
        !body.Contains("FocusActiveTerminal();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected macro settings to open modeless without activation and return focus to the terminal.");
    }

    if (!body.Contains("dialog.Closed +=", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected modeless macro settings cleanup on Closed.");
}

static void QuickMacroOverlayKeepsCountEditorUsable()
{
    string overlaySource = ReadRepoSource("Source", "MTC", "QuickMacroPlayOverlay.cs");
    string integrationSource = ReadRepoSource("Source", "MTC", "QuickMacroOverlayIntegration.cs");

    if (!overlaySource.Contains("_countTextBox.GotFocus", StringComparison.Ordinal) ||
        !overlaySource.Contains("_countEditing = true", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected the quick macro count box to keep explicit edit focus state.");
    }

    if (!overlaySource.Contains("e.Key == Key.Enter", StringComparison.Ordinal) ||
        !overlaySource.Contains("_ = PlayAsync();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Enter in the quick macro count box to play the macro.");
    }

    if (integrationSource.Contains("RefreshQuickMacroOverlayVisibility();\n            FocusActiveTerminal();\n            return;", StringComparison.Ordinal))
        throw new InvalidOperationException("Existing quick macro overlays must not steal focus from the count box on reopen.");

    if (integrationSource.Contains("DispatcherPriority.Loaded);\n", StringComparison.Ordinal) &&
        integrationSource.Contains("FocusActiveTerminal();\n        }, DispatcherPriority.Loaded);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Quick macro overlay must not schedule delayed terminal focus after showing.");
    }
}

static void QuickMacroOverlayEditsMacroText()
{
    string overlaySource = ReadRepoSource("Source", "MTC", "QuickMacroPlayOverlay.cs");
    string integrationSource = ReadRepoSource("Source", "MTC", "QuickMacroOverlayIntegration.cs");

    if (!overlaySource.Contains("private readonly TextBox _macroTextBox", StringComparison.Ordinal) ||
        !overlaySource.Contains("public string MacroText => _macroTextBox.Text", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro overlay macro text to be editable.");
    }

    if (!overlaySource.Contains("Func<string, int, Task<string?>>", StringComparison.Ordinal) ||
        !overlaySource.Contains("await _playAsync(macroText, count)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro overlay playback to use edited macro text.");
    }

    if (!overlaySource.Contains("VerticalContentAlignment = VerticalAlignment.Center", StringComparison.Ordinal) ||
        !overlaySource.Contains("HorizontalContentAlignment = HorizontalAlignment.Left", StringComparison.Ordinal) ||
        !overlaySource.Contains("Padding = new Thickness(8, 0, 6, 0)", StringComparison.Ordinal) ||
        !overlaySource.Contains("Padding = new Thickness(2, 3)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro macro text editor content to be centered and padded inside the input.");
    }

    if (!integrationSource.Contains("PlayQuickMacroOverlayAsync(string macroText, int count)", StringComparison.Ordinal) ||
        !integrationSource.Contains("TryDecodeTemporaryMacroText(macroText", StringComparison.Ordinal) ||
        !integrationSource.Contains("PlayTemporaryMacroBurstAsync([macroBytes]", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro overlay integration to decode and play edited text.");
    }
}

static void QuickMacroOverlaySupportsEditShortcuts()
{
    string source = ReadRepoSource("Source", "MTC", "QuickMacroPlayOverlay.cs");

    if (!source.Contains("WireTextBoxClipboard(_macroTextBox)", StringComparison.Ordinal) ||
        !source.Contains("WireTextBoxClipboard(_countTextBox)", StringComparison.Ordinal) ||
        !source.Contains("using Avalonia.Input.Platform;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro text fields to wire explicit clipboard shortcuts.");
    }

    if (!source.Contains("KeyModifiers.Control", StringComparison.Ordinal) ||
        !source.Contains("KeyModifiers.Meta", StringComparison.Ordinal) ||
        !source.Contains("case Key.C:", StringComparison.Ordinal) ||
        !source.Contains("case Key.V:", StringComparison.Ordinal) ||
        !source.Contains("case Key.X:", StringComparison.Ordinal) ||
        !source.Contains("case Key.A:", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro text fields to support Ctrl/Cmd copy, paste, cut, and select-all.");
    }

    if (!source.Contains("ClipboardHelper.TrySetTextAsync(textBox, selected)", StringComparison.Ordinal) ||
        !source.Contains("ClipboardExtensions.TryGetTextAsync(clipboard)", StringComparison.Ordinal) ||
        !source.Contains("ReplaceSelection(textBox, pasted)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro clipboard shortcuts to use MTC clipboard helpers and edit the focused text box.");
    }
}

static void QuickMacroOverlayPlayReturnsFocusAfterSend()
{
    string source = ReadRepoSource("Source", "MTC", "QuickMacroPlayOverlay.cs");

    if (!source.Contains("if (_playing)", StringComparison.Ordinal) ||
        !source.Contains("_playButton.IsEnabled = false", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro Play to guard against overlapping sends.");
    }

    int finallyBlock = source.IndexOf("finally", StringComparison.Ordinal);
    int releaseGuard = source.IndexOf("_playing = false", finallyBlock, StringComparison.Ordinal);
    if (finallyBlock < 0 || releaseGuard < finallyBlock)
        throw new InvalidOperationException("Expected quick macro Play to release the playback guard in finally.");

    int playCall = source.IndexOf("await _playAsync(macroText, count)", StringComparison.Ordinal);
    int refocusCall = source.IndexOf("refocusRequested();", playCall, StringComparison.Ordinal);
    if (playCall < 0 || refocusCall < playCall)
        throw new InvalidOperationException("Expected quick macro Play to return focus only after playback starts.");
}

static void QuickMacroOverlayIsRightAligned()
{
    string source = ReadRepoSource("Source", "MTC", "QuickMacroOverlayIntegration.cs");

    if (!source.Contains("private const double QuickMacroOverlayBaseWidth = 760", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected quick macro overlay to be wide enough for the editable macro field.");

    if (!source.Contains("double rightMargin = UiSize(8)", StringComparison.Ordinal) ||
        !source.Contains("layerWidth - width - rightMargin", StringComparison.Ordinal) ||
        !source.Contains("maxLeft - rightMargin", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected quick macro overlay to right-align near the MTC window edge.");
    }
}

static void DockShopperShipDropdownSizesToShipList()
{
    string source = ReadRepoSource("Source", "MTC", "DockShopperWindow.cs");

    if (!source.Contains("_shipChoice = BuildShipCombo(_shipChoices)", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected Dock Shopper ship selector to use the ship-specific ComboBox builder.");

    if (!source.Contains("ShipChoiceDropDownRowHeight", StringComparison.Ordinal) ||
        !source.Contains("ShipChoiceDropDownPadding", StringComparison.Ordinal) ||
        !source.Contains("combo.MaxDropDownHeight = choices.Count * ShipChoiceDropDownRowHeight + ShipChoiceDropDownPadding", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Dock Shopper ship dropdown height to scale with the number of ship choices.");
    }
}

static void MapWindowDefaultsToModernOnMacOsAndLinux()
{
    string source = ReadRepoSource("Source", "MTC", "MapWindow.cs");

    if (!source.Contains("MapViewMode defaultViewMode = GetDefaultMapViewMode()", StringComparison.Ordinal) ||
        !source.Contains("OperatingSystem.IsMacOS() || OperatingSystem.IsLinux()", StringComparison.Ordinal) ||
        !source.Contains("? MapViewMode.Bubble", StringComparison.Ordinal) ||
        !source.Contains("SetMapViewMode(defaultViewMode)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected map window to default to Modern on macOS/Linux and Classic on Windows.");
    }
}

static void MapWindowViewSelectorAvoidsPopupControls()
{
    string source = ReadRepoSource("Source", "MTC", "MapWindow.cs");

    if (source.Contains("ComboBox", StringComparison.Ordinal) ||
        source.Contains("SelectionChanged", StringComparison.Ordinal) ||
        source.Contains("MapViewModeToIndex", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected map view switching to avoid Avalonia ComboBox popup controls.");
    }

    if (!source.Contains("BuildViewModeButton(\"Classic\", MapViewMode.Classic)", StringComparison.Ordinal) ||
        !source.Contains("BuildViewModeButton(\"Modern\", MapViewMode.Bubble)", StringComparison.Ordinal) ||
        !source.Contains("BuildViewModeButton(\"Hex\", MapViewMode.Hex)", StringComparison.Ordinal) ||
        !source.Contains("UpdateViewModeButtons()", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected map view switching to use direct Classic/Modern/Hex toolbar buttons.");
    }
}

static void MapWindowOpensWithUsableClientSize()
{
    string source = ReadRepoSource("Source", "MTC", "MapWindow.cs");

    if (!source.Contains("private static readonly Size DefaultClientSize = new(1100, 760)", StringComparison.Ordinal) ||
        !source.Contains("private static readonly Size MinimumClientSize = new(600, 400)", StringComparison.Ordinal) ||
        !source.Contains("ClientSize = DefaultClientSize", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected map window to set explicit default and minimum client sizes.");
    }

    if (!source.Contains("SizeToContent = SizeToContent.Manual", StringComparison.Ordinal) ||
        !source.Contains("SystemDecorations = SystemDecorations.Full", StringComparison.Ordinal) ||
        !source.Contains("TransparencyLevelHint = new[] { WindowTransparencyLevel.None }", StringComparison.Ordinal) ||
        !source.Contains("WindowStartupLocation = WindowStartupLocation.CenterScreen", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected map window to avoid platform-dependent chrome/transparency sizing.");
    }

    if (!source.Contains("EnsureUsableClientSize()", StringComparison.Ordinal) ||
        !source.Contains("ClientSize.Width < MinimumClientSize.Width", StringComparison.Ordinal) ||
        !source.Contains("MinWidth = MinimumClientSize.Width", StringComparison.Ordinal) ||
        !source.Contains("MinHeight = MinimumClientSize.Height", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected map window to reassert usable size after opening.");
    }
}

static void MapWindowsCapLiveGraphExpansion()
{
    string mapWindow = ReadRepoSource("Source", "MTC", "MapWindow.cs");
    string tacticalMap = ReadRepoSource("Source", "MTC", "TacticalMapControl.cs");

    if (!mapWindow.Contains("private const int   MaxVisibleSectors = 500", StringComparison.Ordinal) ||
        !mapWindow.Contains("if (visited.Count >= MaxVisibleSectors)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected classic map BFS to cap visible sector expansion.");
    }

    if (!tacticalMap.Contains("private const int MaxLiveSnapshotSectors = 500", StringComparison.Ordinal) ||
        !tacticalMap.Contains("if (visited.Count >= MaxLiveSnapshotSectors)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tactical map BFS to cap live snapshot expansion.");
    }
}

static void MapRenderOperationsLogSkiaFailures()
{
    string mapWindow = ReadRepoSource("Source", "MTC", "MapWindow.cs");
    string tacticalMap = ReadRepoSource("Source", "MTC", "TacticalMapControl.cs");
    string project = ReadRepoSource("Source", "MTC", "MTC.csproj");

    if (!project.Contains("<PackageReference Include=\"Avalonia.Skia\"", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected MTC to reference Avalonia.Skia explicitly.");

    if (!mapWindow.Contains("DrawFallbackSurface(context, bounds)", StringComparison.Ordinal) ||
        !mapWindow.Contains("[MapWindow] Render failed:", StringComparison.Ordinal) ||
        !mapWindow.Contains("Skia lease feature unavailable", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected classic map render failures to leave a fallback surface and log diagnostics.");
    }

    if (!tacticalMap.Contains("DrawFallbackSurface(context, bounds)", StringComparison.Ordinal) ||
        !tacticalMap.Contains("[TacticalMapControl] Render failed:", StringComparison.Ordinal) ||
        !tacticalMap.Contains("Skia lease feature unavailable", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tactical map render failures to leave a fallback surface and log diagnostics.");
    }
}

static void TacticalMapBuildsSnapshotsOffRenderPath()
{
    string source = ReadRepoSource("Source", "MTC", "TacticalMapControl.cs");

    int drawStart = source.IndexOf("internal void Draw(SKCanvas canvas, float width, float height)", StringComparison.Ordinal);
    int adjustZoomStart = source.IndexOf("public void AdjustZoom", StringComparison.Ordinal);
    string drawBody = drawStart >= 0 && adjustZoomStart > drawStart
        ? source[drawStart..adjustZoomStart]
        : string.Empty;

    if (drawStart < 0 || drawBody.Contains("BuildSnapshot(", StringComparison.Ordinal))
        throw new InvalidOperationException("Tactical map rendering must draw the last snapshot, not rebuild it inside Render.");

    if (!drawBody.Contains("RequestSnapshotRefresh()", StringComparison.Ordinal) ||
        !source.Contains("Task.Run(() => BuildSnapshot(request))", StringComparison.Ordinal) ||
        !source.Contains("private sealed record SnapshotBuildRequest", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tactical map snapshots to be built asynchronously from captured request state.");
    }

    if (!source.Contains("public void RefreshSnapshot()", StringComparison.Ordinal) ||
        !source.Contains("MarkSnapshotDirty()", StringComparison.Ordinal) ||
        !source.Contains("Interlocked.CompareExchange(ref _snapshotBuildScheduled, 1, 0)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected tactical map snapshot refreshes to be coalesced and explicitly requestable.");
    }
}

static void MajorSpaceLanesToolbarReservesSummaryColumn()
{
    string source = ReadRepoSource("Source", "MTC", "MajorSpaceLanesWindow.cs");

    if (!source.Contains("ColumnDefinitions = new ColumnDefinitions(\"Auto,*\")", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected Major Space Lanes toolbar to reserve a separate summary column.");

    if (!source.Contains("_summaryText.WithGridPosition(0, 1)", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected Major Space Lanes summary text in the second toolbar column.");
}

static void MtcCurrentSectorHighlightsMslSectors()
{
    string mainSource = ReadRepoSource("Source", "MTC", "MainWindow.cs");
    string chromeSource = ReadRepoSource("Source", "MTC", "WindowChrome.cs");
    string statusSource = ReadRepoSource("Source", "MTC", "StatusSidebar.cs");
    string shellSource = ReadRepoSource("Source", "MTC", "ShellLayout.cs");
    string dashboardSource = ReadRepoSource("Source", "MTC", "DashboardUi.cs");

    if (!mainSource.Contains("_sectorValueHighlight", StringComparison.Ordinal) ||
        !mainSource.Contains("_deckValSectorHighlight", StringComparison.Ordinal) ||
        !mainSource.Contains("_deckHudHeaderSectorHighlight", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected MTC to keep sector highlight hosts for classic and deck sector displays.");
    }

    if (!chromeSource.Contains("HudMslSectorBg", StringComparison.Ordinal) ||
        !chromeSource.Contains("HudMslSectorBorder", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected MTC to define explicit MSL sector highlight colors.");
    }

    if (!statusSource.Contains("BuildSectorHighlightHost(_valSector", StringComparison.Ordinal) ||
        !statusSource.Contains("Children = { _sectorBustIndicator, _sectorValueHighlight }", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected classic status sector value to be wrapped in the MSL highlight host.");
    }

    if (!shellSource.Contains("BuildDeckInfoChip(\"Sector\", _deckHudHeaderSectorHighlight", StringComparison.Ordinal) ||
        !shellSource.Contains("BuildDeckMetricRow(\"Sector\", _deckValSectorHighlight, _deckValSector)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected command deck sector displays to use the MSL highlight host.");
    }

    if (!dashboardSource.Contains("_sessionDb.GetSectorVar(_state.Sector, \"MSLSEC\")", StringComparison.Ordinal) ||
        !dashboardSource.Contains("ApplyCurrentSectorMslStyle(currentSectorMsl)", StringComparison.Ordinal) ||
        !dashboardSource.Contains("value.Foreground = isHighlighted ? Brushes.White", StringComparison.Ordinal) ||
        !dashboardSource.Contains("host.Background = isHighlighted ? HudMslSectorBg", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected active sector refresh to highlight MSLSEC sectors white on blue.");
    }
}

static void MtcPreferencesProvideNativeMombotDefaults()
{
    string prefsSource = ReadRepoSource("Source", "MTC", "AppPreferences.cs");
    if (!prefsSource.Contains("public string DefaultLoginName", StringComparison.Ordinal) ||
        !prefsSource.Contains("public string DefaultNativeMombotBotName", StringComparison.Ordinal) ||
        !prefsSource.Contains("new XElement(\"DefaultLoginName\"", StringComparison.Ordinal) ||
        !prefsSource.Contains("new XElement(\"DefaultNativeMombotBotName\"", StringComparison.Ordinal) ||
        !prefsSource.Contains("root.Element(\"DefaultLoginName\")", StringComparison.Ordinal) ||
        !prefsSource.Contains("root.Element(\"DefaultNativeMombotBotName\")", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected AppPreferences to persist default login and native MomBot names.");
    }

    string dialogSource = ReadRepoSource("Source", "MTC", "PreferencesDialog.cs");
    if (!dialogSource.Contains("\"New Game Defaults\"", StringComparison.Ordinal) ||
        !dialogSource.Contains("txtDefaultLoginName", StringComparison.Ordinal) ||
        !dialogSource.Contains("txtDefaultBotName", StringComparison.Ordinal) ||
        !dialogSource.Contains("prefs.DefaultLoginName = txtDefaultLoginName.Text?.Trim() ?? string.Empty;", StringComparison.Ordinal) ||
        !dialogSource.Contains("prefs.DefaultNativeMombotBotName = txtDefaultBotName.Text?.Trim() ?? string.Empty;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Preferences dialog to expose and save new-game defaults.");
    }

    string newConnectionSource = ReadRepoSource("Source", "MTC", "NewConnectionDialog.cs");
    if (!newConnectionSource.Contains("string.IsNullOrWhiteSpace(profile.LoginName) ? GetDefaultLoginName() : profile.LoginName", StringComparison.Ordinal) ||
        !newConnectionSource.Contains("_autoUsernameBox = CreateTextBox(GetDefaultLoginName()", StringComparison.Ordinal) ||
        !newConnectionSource.Contains("string configured = prefs.DefaultNativeMombotBotName.Trim();", StringComparison.Ordinal) ||
        !newConnectionSource.Contains("AppPreferences.Load().DefaultLoginName.Trim()", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected New Connection setup to seed default login and bot names.");
    }

    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    if (CountOccurrences(startupSource, "_appPrefs.DefaultLoginName") < 5 ||
        CountOccurrences(startupSource, "_appPrefs.DefaultNativeMombotBotName") < 5)
    {
        throw new InvalidOperationException("Expected native MomBot config and relog defaults to use preference defaults.");
    }
}

static void DeadEndsViewIncludesSortableFiggedColumn()
{
    string source = ReadRepoSource("Source", "MTC", "BubblesWindow.cs");

    if (!source.Contains("SortFiggedButton", StringComparison.Ordinal) ||
        !source.Contains("FinderSortMode.Figged", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Dead Ends to expose a Figged sort button and sort mode.");
    }

    if (!source.Contains("state.SortFiggedButton = AddSortHeaderCell(grid, \"Figged\", 5, state, FinderSortMode.Figged)", StringComparison.Ordinal) ||
        !source.Contains("AddHeaderCell(grid, \"Sector List\", 6)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Figged to appear after Dist to Terra and before Sector List.");
    }

    if (!source.Contains("row.Figged ? \"Yes\" : \"No\"", StringComparison.Ordinal) ||
        !source.Contains("IsAnySectorFigged(db, deadEnd.Sectors, deadEnd.Door, state)", StringComparison.Ordinal) ||
        !source.Contains("SectorOwnershipClassifier.IsFriendlyOwner(sector.Fighters.Owner, state)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Dead Ends rows to render Yes/No from friendly fig or FIGSEC data.");
    }

    if (!source.Contains("rows.OrderByDescending(row => row.Figged).ThenBy(row => row.Door)", StringComparison.Ordinal) ||
        !source.Contains("rows.OrderBy(row => row.Figged).ThenBy(row => row.Door)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Figged sorting to support yes-first and no-first order.");
    }
}

static void GameSizeAllowsOneMillionSectors()
{
    if (!GameSizeLimits.IsValidSectorCount(1_000_000))
        throw new InvalidOperationException("Expected 1,000,000 sectors to be accepted.");
}

static void GameSizeRejectsValuesAboveOneMillionSectors()
{
    if (GameSizeLimits.IsValidSectorCount(1_000_001))
        throw new InvalidOperationException("Expected 1,000,001 sectors to be rejected.");
}

static void ProxyManagementRemovesServersFromSnapshotList()
{
    string source = ReadRepoSource("Source", "MTC", "ProxyManagementWindow.cs");

    if (source.Contains("_serversList.ItemsSource = _preferences.ProxyServers;", StringComparison.Ordinal))
        throw new InvalidOperationException("Proxy server ListBox must not bind directly to the mutable preferences list.");

    if (!source.Contains("AppPreferences.ProxyServerPreference[] snapshot = _preferences.ProxyServers.ToArray();", StringComparison.Ordinal) ||
        !source.Contains("_serversList.ItemsSource = snapshot;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected proxy server ListBox to be refreshed from a stable snapshot.");
    }

    int clearSelection = source.IndexOf("_serversList.SelectedItem = null;", StringComparison.Ordinal);
    int removeAt = source.IndexOf("_preferences.ProxyServers.RemoveAt(removedIndex);", StringComparison.Ordinal);
    if (clearSelection < 0 || removeAt < 0 || clearSelection > removeAt)
        throw new InvalidOperationException("Expected proxy server removal to clear UI selection before mutating preferences.");
}

static void ProxyManagementFormCanSaveAndTestWithoutSelection()
{
    string source = ReadRepoSource("Source", "MTC", "ProxyManagementWindow.cs");

    if (!source.Contains("private bool SaveSelectedServer()", StringComparison.Ordinal) ||
        !source.Contains("var selected = _serversList.SelectedItem as AppPreferences.ProxyServerPreference;", StringComparison.Ordinal) ||
        !source.Contains("if (selected == null)", StringComparison.Ordinal) ||
        !source.Contains("_preferences.ProxyServers.Add(server);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Save to create a server from typed form fields when no list item is selected.");
    }

    if (!source.Contains("TryBuildServerFromFields(null, out server, out string error)", StringComparison.Ordinal) ||
        !source.Contains("SetStatus($\"Testing {server.DisplayName}...\");", StringComparison.Ordinal) ||
        !source.Contains("var client = new ProxyManagementClient(server);", StringComparison.Ordinal) ||
        !source.Contains("SetStatus($\"Management connection OK: {server.DisplayName}\");", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected Test to use typed form fields and report the target server.");
    }

    if (!source.Contains("private bool TryBuildServerFromFields(", StringComparison.Ordinal) ||
        !source.Contains("error = \"Enter a proxy server host.\";", StringComparison.Ordinal) ||
        !source.Contains("error = \"Enter a valid management port.\";", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected form validation before saving or testing proxy server settings.");
    }
}

static void ProxyManagementClientHasBoundedTimeout()
{
    string source = ReadRepoSource("Source", "MTC", "ProxyManagementClient.cs");

    if (!source.Contains("private static readonly TimeSpan ManagementOperationTimeout = TimeSpan.FromSeconds(10);", StringComparison.Ordinal) ||
        !source.Contains("CancellationTokenSource.CreateLinkedTokenSource(cancellationToken)", StringComparison.Ordinal) ||
        !source.Contains("timeout.CancelAfter(ManagementOperationTimeout);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected proxy management requests to have a bounded operation timeout.");
    }

    if (!source.Contains("catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)", StringComparison.Ordinal) ||
        !source.Contains("Proxy management server did not respond within", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected proxy management timeouts to report a clear failure.");
    }
}

static void RemoteProxyNativeMombotUsesLocalConfig()
{
    string source = ReadRepoSource("Source", "MTC", "BotMenus.cs");

    if (CountOccurrences(source, "bool nativeConfigured = IsNativeMombotConfiguredForStart();") < 2)
        throw new InvalidOperationException("Native MomBot start availability must use the local native configuration on remote tabs.");

    if (CountOccurrences(source, "string nativeSectionName = Core.ProxyMenuCatalog.NativeMombotSectionName;") < 2)
        throw new InvalidOperationException("Native MomBot menu actions must pass the canonical local native section name.");

    if (!source.Contains("if (IsNativeMombotSectionName(sectionName))", StringComparison.Ordinal) ||
        !source.Contains("string.Equals(sectionName, \"bot:mombot\", StringComparison.OrdinalIgnoreCase)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot config resolution must accept legacy remote mombot section names.");
    }

    if (!source.Contains("Core.ProxyMenuCatalog.NativeMombotSectionName,", StringComparison.Ordinal) ||
        source.Contains("return new StoredBotSection(\n            \"bot:mombot\"", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot placeholders must use the canonical native section name.");
    }
}

static void RemoteProxyNativeMombotStaysLocal()
{
    string source = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");

    if (!source.Contains("if (!bot.IsNative && IsManagedRemoteProxyGame()", StringComparison.Ordinal))
        throw new InvalidOperationException("Only external bots should be started through remote proxy management.");

    if (!source.Contains("if (bot.IsNative && CanUseNativeMombotThroughManagedRemoteProxy())", StringComparison.Ordinal) ||
        !source.Contains("EnsureManagedRemoteNativeMombotRuntime(bot.Config);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot should attach a local runtime when started from a managed remote tab.");
    }

    if (!source.Contains("if (managedRemote && !bot.IsNative)", StringComparison.Ordinal))
        throw new InvalidOperationException("Native MomBot configuration must be saved locally, not through remote proxy management.");
}

static void RemoteProxyNativeMombotLoadsStartupScripts()
{
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");

    int remoteStart = startupSource.IndexOf("if (bot.IsNative && CanUseNativeMombotThroughManagedRemoteProxy())", StringComparison.Ordinal);
    int embeddedGuard = startupSource.IndexOf("if (_gameInstance == null || CurrentInterpreter == null)", StringComparison.Ordinal);
    string remoteStartBody = remoteStart >= 0 && embeddedGuard > remoteStart
        ? startupSource[remoteStart..embeddedGuard]
        : string.Empty;

    if (!remoteStartBody.Contains("ArmNativeMombotStartupDataGather();", StringComparison.Ordinal) ||
        !remoteStartBody.Contains("ShowMombotStartupBanner(connected: IsNativeMombotServerConnected());", StringComparison.Ordinal) ||
        !remoteStartBody.Contains("await TryRunNativeMombotInitialSettingsAsync();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot starts must enter the normal startup gather/finalize path.");
    }

    int finalizer = startupSource.IndexOf("private async Task FinalizeNativeMombotStartupAsync()", StringComparison.Ordinal);
    int scriptLoaded = startupSource.IndexOf("private bool IsNativeMombotScriptLoaded", StringComparison.Ordinal);
    string finalizerBody = finalizer >= 0 && scriptLoaded > finalizer
        ? startupSource[finalizer..scriptLoaded]
        : string.Empty;

    if (!finalizerBody.Contains("!IsNativeMombotServerConnected()", StringComparison.Ordinal) ||
        finalizerBody.Contains("_gameInstance == null", StringComparison.Ordinal) ||
        !finalizerBody.Contains("LoadMombotStartupScripts();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot startup finalization must load startup scripts for embedded and remote sessions.");
    }

    if (!tabbedSource.Contains("ScheduleNativeMombotStartupWatch(tab);", StringComparison.Ordinal))
        throw new InvalidOperationException("Remote telnet lines must retry native MomBot startup finalization after prompts arrive.");
}

static void RemoteProxyNativeMombotRuntimeLoadsWatcher()
{
    string liveScriptRoot = "/Users/mosleym/twx/scripts/mombot";
    if (!File.Exists(Path.Combine(liveScriptRoot, "startups", "watcher.cts")))
        throw new InvalidOperationException($"Expected live watcher.cts at '{liveScriptRoot}'.");

    var context = new TWXProxy.Core.TwxRuntimeContext("mtc-remote-native-mombot-test")
    {
        DebugLogPath = Path.Combine(Path.GetTempPath(), "mtc-remote-native-mombot-test.log"),
    };

    using IDisposable _ = TWXProxy.Core.GlobalModules.UseRuntimeContext(context);
    var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = context,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    context.ActiveInterpreter = interpreter;
    context.TWXInterpreter = interpreter;

    var service = new MTC.mombot.mombotService(context);
    var config = new MTC.mombot.mombotConfig
    {
        Configured = true,
        Enabled = true,
        ScriptRoot = "scripts/mombot",
        WatcherEnabled = true,
        AcceptSelfCommands = true,
    };

    service.AttachSession(
        null,
        null,
        interpreter,
        config,
        _ => Task.CompletedTask,
        _ => { });
    service.ApplyConfig(config);

    IReadOnlyList<string> startupScripts = service.GetStartupScriptReferences();
    if (!startupScripts.Any(script => script.EndsWith("startups/watcher.cts", StringComparison.OrdinalIgnoreCase)))
        throw new InvalidOperationException("Expected native MomBot startup refs to include watcher.cts.");

    foreach (string startupScript in startupScripts)
    {
        if (!service.TryLoadScript(startupScript, out string? error))
            throw new InvalidOperationException($"Failed to load startup script '{startupScript}': {error}");
    }

    IReadOnlyList<TWXProxy.Core.RunningScriptInfo> running = service.GetRunningScripts();
    if (!running.Any(script => script.Reference.Replace('\\', '/').EndsWith("startups/watcher.cts", StringComparison.OrdinalIgnoreCase)))
        throw new InvalidOperationException("Expected watcher.cts to be present in the running script list after remote native startup.");

    interpreter.Dispose();
}

static void RemoteProxyNativeMombotOutputMarshalsToUiTab()
{
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");

    if (!startupSource.Contains("var server = new MtcTelnetTwxServer(", StringComparison.Ordinal) ||
        !startupSource.Contains("output => PublishMombotClientOutput(owner, output),", StringComparison.Ordinal) ||
        !startupSource.Contains("connectToServerAsync: () => ConnectManagedRemoteMombotProxyAsync(owner)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot output must capture the owning tab when the telnet server adapter is created.");
    }

    if (!startupSource.Contains("output => PublishMombotClientOutput(owner, output));", StringComparison.Ordinal))
        throw new InvalidOperationException("Remote native MomBot service output must use the owning tab callback.");

    int outputMethod = startupSource.IndexOf("private void PublishMombotClientOutput(MtcTabPrototype? owner, string output)", StringComparison.Ordinal);
    int nextMethod = startupSource.IndexOf("private void RefreshActiveBotContextFromConfig", StringComparison.Ordinal);
    string outputBody = outputMethod >= 0 && nextMethod > outputMethod
        ? startupSource[outputMethod..nextMethod]
        : string.Empty;

    if (!outputBody.Contains("if (!Dispatcher.UIThread.CheckAccess())", StringComparison.Ordinal) ||
        !outputBody.Contains("PostToMtcTabSession(owner, () => PublishMombotClientOutput(owner, output));", StringComparison.Ordinal) ||
        !outputBody.Contains("_parser.Feed(output ?? string.Empty);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot ECHO/CLIENTMESSAGE output must marshal to the UI tab before touching terminal state.");
    }
}

static void RemoteProxyNativeMombotSyncsPromptAndInterceptsInput()
{
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");

    if (!startupSource.Contains("SeedNativeMombotPromptFromTerminalBuffer();", StringComparison.Ordinal) ||
        !startupSource.Contains("Core.ScriptRef.SetCurrentLine(context, line);", StringComparison.Ordinal) ||
        !startupSource.Contains("SyncMombotPromptStateFromLine(line, line);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot start must seed prompt state from the visible terminal line.");
    }

    int commandInterceptor = interactionSource.IndexOf("private bool TryInterceptMombotCommandPrompt(byte[] bytes)", StringComparison.Ordinal);
    int hotkeyInterceptor = interactionSource.IndexOf("private bool TryInterceptMombotHotkeyAccess(byte[] bytes)", StringComparison.Ordinal);
    string commandBody = commandInterceptor >= 0 && hotkeyInterceptor > commandInterceptor
        ? interactionSource[commandInterceptor..hotkeyInterceptor]
        : string.Empty;
    string hotkeyBody = hotkeyInterceptor >= 0
        ? interactionSource[hotkeyInterceptor..]
        : string.Empty;

    if (!commandBody.Contains("!CanUseAttachedNativeMombotUi()", StringComparison.Ordinal) ||
        commandBody.Contains("_gameInstance == null", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot command prompt interception must not require an embedded GameInstance.");
    }

    if (!hotkeyBody.Contains("!CanUseAttachedNativeMombotUi()", StringComparison.Ordinal) ||
        hotkeyBody.Contains("_gameInstance == null", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot hotkey interception must not require an embedded GameInstance.");
    }

    if (!tabbedSource.Contains("SyncMombotPromptVarsFromLine(tab.RuntimeContext, safeStrippedLine);", StringComparison.Ordinal) ||
        !tabbedSource.Contains("SyncMombotPromptStateFromLine(safeStrippedLine, safeAnsiLine);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote telnet prompt lines must sync native MomBot prompt state.");
    }

    if (!startupSource.Contains("private async Task SendMombotServerTextAsync(string text)", StringComparison.Ordinal) ||
        !startupSource.Contains("_telnet.SendRaw(bytes);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot startup announcements must be able to send through telnet.");
    }
}

static void RemoteProxyNativeMombotSendsThroughManagementAdapter()
{
    string coreInterface = ReadRepoSource("Source", "Core", "Core.cs");
    string sendSource = ReadRepoSource("Source", "Core", "ScriptCmdImpl.cs");
    string databaseSource = ReadRepoSource("Source", "Core", "Database.cs");
    string adapterSource = ReadRepoSource("Source", "MTC", "MtcTelnetTwxServer.cs");
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");
    string serviceSource = ReadRepoSource("Source", "MTC", "mombot", "mombotService.cs");
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string managementClientSource = ReadRepoSource("Source", "MTC", "ProxyManagementClient.cs");
    string headlessSource = ReadRepoSource("Source", "TWXP", "Headless", "HeadlessProxyHost.cs");
    string proxyServiceSource = ReadRepoSource("Source", "TWXP", "Services", "ProxyService.cs");

    if (!coreInterface.Contains("Task SendToServerAsync(byte[] data);", StringComparison.Ordinal))
        throw new InvalidOperationException("Core ITWXServer must expose raw server sends for non-GameInstance script hosts.");

    if (!sendSource.Contains("ITWXServer? contextServer = runtimeContext.TWXServer;", StringComparison.Ordinal) ||
        !sendSource.Contains("contextServer.SendToServerAsync(data).GetAwaiter().GetResult();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Script SEND must use the executing runtime's TWX server adapter.");
    }

    if (!databaseSource.Contains("await GlobalModules.CurrentContext.TWXServer.SendToServerAsync(data);", StringComparison.Ordinal))
        throw new InvalidOperationException("Autotrigger database sends must fall back to the current TWX server adapter.");

    if (!adapterSource.Contains("internal sealed class MtcTelnetTwxServer : Core.ITWXServer", StringComparison.Ordinal) ||
        !adapterSource.Contains("private readonly Func<byte[], Task>? _sendToServerAsync;", StringComparison.Ordinal) ||
        !adapterSource.Contains("if (_sendToServerAsync != null)", StringComparison.Ordinal) ||
        !adapterSource.Contains("return _sendToServerAsync(data);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("MTC remote native MomBot must use direct management sends before falling back to telnet raw bytes.");
    }

    if (!startupSource.Contains("sendToServerAsync: data => SendManagedRemoteMombotServerBytesAsync(owner, data)", StringComparison.Ordinal) ||
        !startupSource.Contains("client!.SendToServerAsync(state.RemoteProxyGameId, data)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Managed remote native MomBot must route script sends through the proxy management API.");
    }

    if (!startupSource.Contains("message.Contains(\"Game server is not connected\", StringComparison.OrdinalIgnoreCase)", StringComparison.Ordinal) ||
        !startupSource.Contains("IsManagedRemoteMombotGameServerConnected(owner)", StringComparison.Ordinal) ||
        !startupSource.Contains("telnet.SendRaw(data);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Managed remote native MomBot must fall back to the owning terminal socket when management send is unavailable but the game prompt is live.");
    }

    if (!managementClientSource.Contains("public Task<ProxyManagementResponse> SendToServerAsync(string gameId, byte[] data", StringComparison.Ordinal) ||
        !managementClientSource.Contains("[\"action\"] = \"sendToServer\"", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("MTC proxy management client must expose direct sendToServer.");
    }

    if (!headlessSource.Contains("\"sendtoserver\" => await SendToServerAsync(request)", StringComparison.Ordinal) ||
        !proxyServiceSource.Contains("Task SendToServerAsync(string gameId, byte[] data);", StringComparison.Ordinal) ||
        !proxyServiceSource.Contains("return instance.GameInstance.SendToServerAsync(data);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote TWXP daemon must expose direct sendToServer to bypass client command parsing.");
    }

    if (!tabbedSource.Contains("DispatchMtcTabLocalInterpreterLine(tab, safeStrippedLine, safeAnsiLine);", StringComparison.Ordinal) ||
        !tabbedSource.Contains("interpreter.DispatchCompleteLine(strippedLine, ansiLine, forceTrigger: false);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote telnet server lines must feed the local interpreter for native MomBot triggers.");
    }

    if (!serviceSource.Contains("private Func<byte[], Task>? _sendToServerAsync;", StringComparison.Ordinal) ||
        !serviceSource.Contains("public bool IsAttached => _gameInstance != null || _sendToServerAsync != null;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("MomBot service must support attachment without an embedded GameInstance.");
    }
}

static void NativeMombotModeDispatchPreservesChildCallersAndReplacesActiveChain()
{
    string serviceSource = ReadRepoSource("Source", "MTC", "mombot", "mombotService.cs");

    if (!serviceSource.Contains("bool transientModeCommand = isMode &&", StringComparison.Ordinal) ||
        !serviceSource.Contains("hasActiveParentMode &&\n                                    IsTrustedOwnSubspaceCommand(context);", StringComparison.Ordinal) ||
        !serviceSource.Contains("if (TryRestoreTransientMode())\n            return;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot must preserve and restore an active mode around its trusted child mode command.");
    }

    if (!serviceSource.Contains("private void StopActiveModeChain(string currentLastLoadedModule)", StringComparison.Ordinal) ||
        !serviceSource.Contains("_transientModeRestores.Clear();\n        foreach (string module in modulesToStop)\n            StopScriptByName(module);", StringComparison.Ordinal) ||
        !serviceSource.Contains("if (replaceActiveMode)\n            StopActiveModeChain(currentLastLoadedModule);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("A user-started mode must clear restoration state and stop the full active parent/child mode chain.");
    }
}

static void NativeMombotSuppressesEchoedOutboundSelfCommands()
{
    var context = new TWXProxy.Core.TwxRuntimeContext("mtc-native-mombot-self-echo-test");
    using IDisposable _ = TWXProxy.Core.GlobalModules.UseRuntimeContext(context);

    var output = new List<string>();
    var service = new MTC.mombot.mombotService(context);
    var config = new MTC.mombot.mombotConfig
    {
        Configured = true,
        Enabled = true,
        AcceptSelfCommands = true,
    };

    service.AttachSession(
        null,
        null,
        null,
        config,
        _ => Task.CompletedTask,
        output.Add);
    config.Enabled = true;
    service.ApplyConfig(config);

    const string command = "'all echo_dedupe_probe";
    service.ObserveOutboundText(command + "\r");
    int afterOutbound = output.Count;
    if (afterOutbound != 1)
        throw new InvalidOperationException($"Expected one outbound dispatch, observed {afterOutbound} outputs.");

    service.ObserveServerLine(command, observeWatcher: false);
    if (output.Count != afterOutbound)
        throw new InvalidOperationException("An echoed outbound self-command was dispatched more than once.");

    service.ObserveServerLine("'all distinct_server_only_probe", observeWatcher: false);
    if (output.Count != afterOutbound + 1)
        throw new InvalidOperationException("A server-only self-command was incorrectly suppressed.");

    const string inboundFirstCommand = "'all inbound_first_dedupe_probe";
    service.ObserveServerLine(inboundFirstCommand, observeWatcher: false);
    int afterInboundFirst = output.Count;
    service.ObserveOutboundText(inboundFirstCommand + "\r");
    if (output.Count != afterInboundFirst)
        throw new InvalidOperationException("An inbound-first self-command pair was dispatched more than once.");

    const string repeatedCommand = "'all repeated_dedupe_probe";
    int beforeRepeated = output.Count;
    service.ObserveOutboundText(repeatedCommand + "\r");
    service.ObserveServerLine(repeatedCommand, observeWatcher: false);
    service.ObserveOutboundText(repeatedCommand + "\r");
    service.ObserveServerLine(repeatedCommand, observeWatcher: false);
    if (output.Count != beforeRepeated + 2)
        throw new InvalidOperationException("Two intentional self-commands were not dispatched exactly twice.");

    object dispatchIdentity = new();
    const string duplicateObserverCommand = "'all duplicate_observer_probe\r";
    int beforeDuplicateObserver = output.Count;
    service.ObserveOutboundText(duplicateObserverCommand, dispatchIdentity);
    service.ObserveOutboundText(duplicateObserverCommand, dispatchIdentity);
    if (output.Count != beforeDuplicateObserver + 1)
        throw new InvalidOperationException("A repeated outbound event identity was dispatched more than once.");
}

static void MtcRemovesNativeMombotOutboundObserver()
{
    string lifecycleSource = ReadRepoSource("Source", "MTC", "ConnectionLifecycle.cs");
    string tabSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");

    if (!lifecycleSource.Contains("gi.ServerDataSent += serverDataSentHandler;", StringComparison.Ordinal) ||
        !lifecycleSource.Contains("owningTab.Mombot.ObserveOutboundText(e.Text, e)", StringComparison.Ordinal) ||
        !lifecycleSource.Contains("serverDataSentSource.ServerDataSent -= serverDataSentHandler;", StringComparison.Ordinal) ||
        !lifecycleSource.Contains("EmbeddedServerDataSentSource.ServerDataSent -=", StringComparison.Ordinal) ||
        !tabSource.Contains("EmbeddedServerDataSentSource", StringComparison.Ordinal) ||
        !tabSource.Contains("EmbeddedServerDataSentHandler", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("MTC must route the native MomBot outbound observer through its owning tab and remove it when detached.");
    }
}

static void RemoteProxyNativeMombotCanConnectThroughTelnetAdapter()
{
    string coreInterface = ReadRepoSource("Source", "Core", "Core.cs");
    string constantsSource = ReadRepoSource("Source", "Core", "ScriptCmd.cs");
    string networkSource = ReadRepoSource("Source", "Core", "ScriptCmdImpl_Network.cs");
    string adapterSource = ReadRepoSource("Source", "MTC", "MtcTelnetTwxServer.cs");
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");

    if (!coreInterface.Contains("bool IsConnected { get; }", StringComparison.Ordinal) ||
        !coreInterface.Contains("Task ConnectToServerAsync();", StringComparison.Ordinal) ||
        !coreInterface.Contains("Task DisconnectFromServerAsync();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Core ITWXServer must expose server-side connection control.");
    }

    if (!constantsSource.Contains("GlobalModules.CurrentContext.TWXServer?.IsConnected", StringComparison.Ordinal))
        throw new InvalidOperationException("CONNECTED must read the current TWX server adapter when no GameInstance is active.");

    if (!networkSource.Contains("await server.ConnectToServerAsync();", StringComparison.Ordinal) ||
        !networkSource.Contains("await server.DisconnectFromServerAsync();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Script CONNECT/DISCONNECT must fall back to the current TWX server adapter.");
    }

    if (!adapterSource.Contains("Func<Task>? connectToServerAsync", StringComparison.Ordinal) ||
        !adapterSource.Contains("public Task ConnectToServerAsync() => _connectToServerAsync();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("MTC telnet adapter must expose connect/disconnect delegates.");
    }

    if (!startupSource.Contains("connectToServerAsync: () => ConnectManagedRemoteMombotProxyAsync(owner)", StringComparison.Ordinal) ||
        !startupSource.Contains("Encoding.ASCII.GetBytes($\"{GetManagedRemoteProxyCommandChar(owner)}c\\r\")", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot connect must signal the remote proxy's connect command.");
    }

    if (!startupSource.Contains("=> _gameInstance == null && IsManagedRemoteProxyGame();", StringComparison.Ordinal) ||
        !startupSource.Contains("if (!IsNativeMombotServerConnected())\n                await TriggerNativeMombotRelogAsync", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot start must be allowed before the remote terminal is connected and must kick relog.");
    }

    if (!interactionSource.Contains("!CanUseAttachedNativeMombotUi()", StringComparison.Ordinal) ||
        interactionSource.Contains("if (!_mombot.Enabled || _gameInstance == null || ShouldStopNativeMombotAfterDisconnect())", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot relog must not require an embedded GameInstance.");
    }
}

static void RemoteProxyNativeMombotConnectAvoidsUiDispatcher()
{
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string proxyIntegrationSource = ReadRepoSource("Source", "MTC", "ProxyManagementIntegration.cs");
    string connectionSource = ReadRepoSource("Source", "MTC", "ConnectionLifecycle.cs");
    string managementClientSource = ReadRepoSource("Source", "MTC", "ProxyManagementClient.cs");

    int connectStart = startupSource.IndexOf("private async Task ConnectManagedRemoteMombotProxyAsync", StringComparison.Ordinal);
    int disconnectStart = startupSource.IndexOf("private Task DisconnectManagedRemoteMombotProxyAsync", StringComparison.Ordinal);
    string connectBody = connectStart >= 0 && disconnectStart > connectStart
        ? startupSource[connectStart..disconnectStart]
        : string.Empty;

    if (connectBody.Length == 0)
        throw new InvalidOperationException("Expected managed remote MomBot connect helper.");

    if (connectBody.Contains("ExecuteInOptionalMtcTabSessionAsync", StringComparison.Ordinal))
        throw new InvalidOperationException("Remote native MomBot CONNECT must not dispatch through the UI tab-session wrapper.");

    foreach (string required in new[]
             {
                 "GameState state = owner?.State ?? _state;",
                 "TelnetClient telnet = owner?.Telnet ?? _telnet;",
                 "TryGetProxyManagementClient(state.RemoteProxyServerId",
                 "EnsureManagedRemoteProxyTerminalConnectedAsync(owner, client!)",
                 "telnet.SendRaw(Encoding.ASCII.GetBytes($\"{GetManagedRemoteProxyCommandChar(owner)}c\\r\"))",
             })
    {
        if (!connectBody.Contains(required, StringComparison.Ordinal))
            throw new InvalidOperationException($"Managed remote MomBot connect lost owner-aware step: {required}");
    }

    if (!proxyIntegrationSource.Contains("private bool IsManagedRemoteProxyGame(GameState? state)", StringComparison.Ordinal) ||
        !proxyIntegrationSource.Contains("private async Task<bool> EnsureManagedRemoteProxyTerminalConnectedAsync(MtcTabPrototype? owner, ProxyManagementClient client)", StringComparison.Ordinal) ||
        !proxyIntegrationSource.Contains("await ConnectDirectTelnetAsync(owner, reconnectIfConnected: false)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote proxy terminal connect must use owner-aware state and telnet.");
    }

    if (!connectionSource.Contains("private async Task<bool> ConnectDirectTelnetAsync(MtcTabPrototype? tab, bool reconnectIfConnected)", StringComparison.Ordinal) ||
        !connectionSource.Contains("TelnetClient telnet = tab?.Telnet ?? _telnet;", StringComparison.Ordinal) ||
        !connectionSource.Contains("await telnet.ConnectAsync(state.Host, state.Port).ConfigureAwait(false);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Direct telnet connect must be able to target the owning tab.");
    }

    foreach (string required in new[]
             {
                 "await client.ConnectAsync(_server.Host, AppPreferences.NormalizeTcpPort(_server.ManagementPort, 2099), operationToken).ConfigureAwait(false);",
                 "await writer.WriteLineAsync(json.AsMemory(), operationToken).ConfigureAwait(false);",
                 "await reader.ReadLineAsync(operationToken).ConfigureAwait(false);",
                 "await client!.SendToServerAsync(state.RemoteProxyGameId, data).ConfigureAwait(false);",
             })
    {
        string source = required.Contains("state.RemoteProxyGameId", StringComparison.Ordinal)
            ? startupSource
            : managementClientSource;
        if (!source.Contains(required, StringComparison.Ordinal))
            throw new InvalidOperationException($"Remote proxy management path can still capture the UI context: {required}");
    }
}

static void ProxyManagementClientSendDoesNotCaptureSyncContext()
{
    using var listener = new TcpListener(IPAddress.Loopback, 0);
    listener.Start();
    int port = ((IPEndPoint)listener.LocalEndpoint).Port;
    using var serverReady = new ManualResetEventSlim(false);
    using var stopServer = new CancellationTokenSource();

    Task serverTask = Task.Run(async () =>
    {
        using TcpClient accepted = await listener.AcceptTcpClientAsync(stopServer.Token).ConfigureAwait(false);
        await using NetworkStream stream = accepted.GetStream();
        using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);
        await using var writer = new StreamWriter(stream, new UTF8Encoding(false), leaveOpen: true)
        {
            AutoFlush = true,
            NewLine = "\n",
        };

        string? request = await reader.ReadLineAsync(stopServer.Token).ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(request))
            return;

        serverReady.Set();
        await writer.WriteLineAsync("{\"ok\":true,\"action\":\"sendToServer\",\"result\":{}}".AsMemory(), stopServer.Token)
            .ConfigureAwait(false);
    }, stopServer.Token);

    using var completed = new ManualResetEventSlim(false);
    Exception? workerError = null;
    var worker = new Thread(() =>
    {
        SynchronizationContext.SetSynchronizationContext(new NonPumpingSynchronizationContext());
        try
        {
            var client = new ProxyManagementClient(new AppPreferences.ProxyServerPreference
            {
                Name = "local-test",
                Host = "127.0.0.1",
                ManagementPort = port,
                SecurityToken = string.Empty,
            });
            client.SendToServerAsync("game", Encoding.ASCII.GetBytes("Zuul\r")).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            workerError = ex;
        }
        finally
        {
            completed.Set();
        }
    })
    {
        IsBackground = true,
    };

    worker.Start();
    if (!completed.Wait(TimeSpan.FromSeconds(3)))
        throw new InvalidOperationException("ProxyManagementClient.SendToServerAsync deadlocked under a non-pumping synchronization context.");

    stopServer.Cancel();
    try { serverTask.Wait(TimeSpan.FromSeconds(1)); } catch { }
    listener.Stop();

    if (!serverReady.IsSet)
        throw new InvalidOperationException("Proxy management test server did not receive the sendToServer request.");
    if (workerError != null)
        throw new InvalidOperationException("ProxyManagementClient.SendToServerAsync failed.", workerError);
}

static void RemoteProxyNativeMombotSeedsRelogCredentialsFromConnectionState()
{
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");
    string runtimeSource = ReadRepoSource("Source", "MTC", "RuntimeState.cs");

    if (!interactionSource.Contains("private string CurrentConfiguredRelogLoginName()", StringComparison.Ordinal) ||
        !interactionSource.Contains("_state.LoginName", StringComparison.Ordinal) ||
        !interactionSource.Contains("_sessionDb?.DBHeader.LoginName", StringComparison.Ordinal) ||
        !interactionSource.Contains("private string CurrentConfiguredRelogPassword()", StringComparison.Ordinal) ||
        !interactionSource.Contains("_state.Password", StringComparison.Ordinal) ||
        !interactionSource.Contains("private string CurrentConfiguredRelogGameLetter()", StringComparison.Ordinal) ||
        !interactionSource.Contains("NormalizeGameLetter(_state.GameLetter)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote native MomBot relog credentials must fall back to connection state and database header values.");
    }

    if (!startupSource.Contains("string configLogin = CurrentConfiguredRelogLoginName();", StringComparison.Ordinal) ||
        !startupSource.Contains("string configPassword = CurrentConfiguredRelogPassword();", StringComparison.Ordinal) ||
        !startupSource.Contains("string configGameLetter = CurrentConfiguredRelogGameLetter();", StringComparison.Ordinal) ||
        !startupSource.Contains("SetMombotCurrentVars(serverName, \"$BOT~SERVERNAME\", \"$bot~servername\", \"$servername\");", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot relog defaults and seed variables must use the current credential helper.");
    }

    if (startupSource.Contains("NormalizeMombotValue(_embeddedGameConfig?.LoginName, treatSelfAsEmpty: true)", StringComparison.Ordinal) ||
        startupSource.Contains("NormalizeMombotValue(_embeddedGameConfig?.Password)", StringComparison.Ordinal) ||
        startupSource.Contains("NormalizeGameLetter(_embeddedGameConfig?.GameLetter)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot startup must not read embedded-only credentials directly.");
    }

    if (!runtimeSource.Contains("string configLogin = CurrentConfiguredRelogLoginName();", StringComparison.Ordinal) ||
        !runtimeSource.Contains("string configPassword = CurrentConfiguredRelogPassword();", StringComparison.Ordinal) ||
        !runtimeSource.Contains("string configGameLetter = CurrentConfiguredRelogGameLetter();", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Native MomBot configuration checks must use the same current credential helper.");
    }
}

static void RemoteProxyNativeMombotInjectsRelogCredentialsDirectly()
{
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");

    if (!interactionSource.Contains("MTC.mombot.mombotRelogDialogResult relogSettings = BuildMombotRelogDefaults();", StringComparison.Ordinal) ||
        !interactionSource.Contains("IReadOnlyDictionary<string, string> initialVars = BuildNativeMombotConnectivityRelogVars(relogSettings);", StringComparison.Ordinal) ||
        !interactionSource.Contains("_mombot.TryLoadInstalledScriptAtLabel(\n                \"commands/general/relog.cts\"", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Automated native MomBot relog must launch relog.cts with explicit current-tab credentials.");
    }

    foreach (string alias in new[]
             {
                 "string bbsLoginName = FirstMeaningfulMombotValue(",
                 "[\"$bot~servername\"] = bbsLoginName",
                 "[\"$bot~username\"] = accountLoginName",
                 "[\"$bot~password\"] = loginPassword",
                 "[\"$bot~letter\"] = gameLetter",
                 "[\"$bot~startgamedelay\"] = relogSettings.DelayMinutes.ToString()",
             })
    {
        if (!startupSource.Contains(alias, StringComparison.Ordinal))
            throw new InvalidOperationException($"Relog initial vars must include alias '{alias}'.");
    }
}

static void NativeMombotRelogClearsStaleHelpCommandContext()
{
    var vars = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["$BOT~COMMAND"] = "pmgr",
        ["$bot~parm1"] = "help",
        ["$BOT~ONLY_HELP"] = "1",
        ["$BOT~USER_COMMAND_LINE"] = "mgrid help",
    };

    NativeMombotStartupBridge.ApplyRelogCommandContext(vars);

    foreach (string commandName in new[] { "$BOT~COMMAND", "$bot~command", "$command", "$SWITCHBOARD~COMMAND", "$switchboard~command" })
    {
        if (!vars.TryGetValue(commandName, out string? value) || value != "relog")
            throw new InvalidOperationException($"Relog command context did not set {commandName} to relog.");
    }

    foreach (string flagName in new[] { "$BOT~ONLY_HELP", "$bot~only_help", "$only_help", "$SWITCHBOARD~ONLY_HELP", "$switchboard~only_help" })
    {
        if (!vars.TryGetValue(flagName, out string? value) || value != "0")
            throw new InvalidOperationException($"Relog command context did not clear {flagName}.");
    }

    foreach (string lineName in new[] { "$BOT~USER_COMMAND_LINE", "$bot~user_command_line", "$USER_COMMAND_LINE", "$user_command_line", "$SWITCHBOARD~USER_COMMAND_LINE", "$switchboard~user_command_line" })
    {
        if (!vars.TryGetValue(lineName, out string? value) || value.Length != 0)
            throw new InvalidOperationException($"Relog command context did not clear {lineName}.");
    }

    for (int index = 1; index <= 8; index++)
    {
        foreach (string parmName in new[] { $"$BOT~PARM{index}", $"$bot~parm{index}", $"$parm{index}" })
        {
            if (!vars.TryGetValue(parmName, out string? value) || value.Length != 0)
                throw new InvalidOperationException($"Relog command context did not clear {parmName}.");
        }
    }

    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    if (!startupSource.Contains("NativeMombotStartupBridge.ApplyRelogCommandContext(vars);", StringComparison.Ordinal))
        throw new InvalidOperationException("Native relog variable construction does not apply the clean relog command context.");
}

static void RemoteProxyNativeMombotPersistsLocalVariables()
{
    string gamePersistenceSource = ReadRepoSource("Source", "MTC", "GamePersistence.cs");
    string startupSource = ReadRepoSource("Source", "MTC", "NativeMombotStartup.cs");
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");

    if (!gamePersistenceSource.Contains("private static void AttachGameConfigVariablePersistence", StringComparison.Ordinal) ||
        !gamePersistenceSource.Contains("GameConfigService.RequestVariablesSave(gameName, gameConfig.Variables);", StringComparison.Ordinal) ||
        !gamePersistenceSource.Contains("if (!_state.EmbeddedProxy)\n            AttachGameConfigVariablePersistence(runtimeContext, config, targetGameName);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Loaded non-embedded MTC games must persist local script variables into the game config JSON.");
    }

    if (!startupSource.Contains("AttachGameConfigVariablePersistence(runtimeContext, _embeddedGameConfig", StringComparison.Ordinal))
        throw new InvalidOperationException("Remote native MomBot runtime attach must repair variable persistence for the active tab.");

    if (!interactionSource.Contains("AttachGameConfigVariablePersistence(context, _embeddedGameConfig", StringComparison.Ordinal))
        throw new InvalidOperationException("Native MomBot UI variable writes must install config persistence before savevar callbacks.");
}

static void NativeMombotCompatibilitySnapshotIncludesRelogAliases()
{
    string compatSource = ReadRepoSource("Source", "MTC", "mombot", "mombotCompatContext.cs");

    foreach (string expected in new[]
             {
                 "ReadCurrentAny(string.Empty, \"$BOT~USERNAME\", \"$bot~username\", \"$username\")",
                 "ReadCurrentAny(string.Empty, \"$BOT~SERVERNAME\", \"$bot~servername\", \"$servername\")",
                 "ReadCurrentAny(settings.LoginPassword, \"$BOT~PASSWORD\", \"$bot~password\", \"$password\")",
                 "ReadCurrentAny(string.Empty, \"$BOT~LETTER\", \"$bot~letter\", \"$letter\", \"$LETTER\")",
                 "SetVars(vars, loginUserName, \"$BOT~USERNAME\", \"$bot~username\", \"$username\")",
                 "SetVars(vars, serverName, \"$BOT~SERVERNAME\", \"$bot~servername\", \"$servername\")",
                 "SetVars(vars, loginPassword, \"$BOT~PASSWORD\", \"$bot~password\", \"$password\")",
                 "SetVars(vars, gameLetter, \"$BOT~LETTER\", \"$bot~letter\", \"$letter\", \"$LETTER\")",
             })
    {
        if (!compatSource.Contains(expected, StringComparison.Ordinal))
            throw new InvalidOperationException($"Compatibility snapshot is missing relog alias pattern '{expected}'.");
    }
}

static void ScriptLoadvarUsesExecutingRuntimeContext()
{
    string source = ReadRepoSource("Source", "Core", "ScriptCmdImpl_VarPersistence.cs");

    if (!source.Contains("private static TwxRuntimeContext CurrentScriptContext(object script)", StringComparison.Ordinal) ||
        !source.Contains("script is Script scriptObj ? scriptObj.Controller.RuntimeContext : GlobalModules.CurrentContext", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("LOADVAR/SAVEVAR must resolve the executing script runtime context.");
    }

    if (!source.Contains("TryGetCompatibleVarValue(CurrentGameVarsFor(runtimeContext), varName", StringComparison.Ordinal) ||
        !source.Contains("CurrentGameVarsFor(runtimeContext)[varName] = value;", StringComparison.Ordinal) ||
        !source.Contains("InvokeOnVariableSaved(runtimeContext, varName, value);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("LOADVAR/SAVEVAR must not depend on the ambient global context in remote native MomBot sessions.");
    }

    var wrongContext = new TWXProxy.Core.TwxRuntimeContext("wrong-loadvar-context");
    var rightContext = new TWXProxy.Core.TwxRuntimeContext("right-loadvar-context");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(rightContext, "$bot~servername", "Zuul");
    using IDisposable _ = TWXProxy.Core.GlobalModules.UseRuntimeContext(wrongContext);

    var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = rightContext,
    };
    using var script = new TWXProxy.Core.Script(interpreter);
    var param = new TWXProxy.Core.VarParam
    {
        Name = "$bot~servername",
        Value = string.Empty,
    };

    MethodInfo loadVar = typeof(TWXProxy.Core.ScriptRef).GetMethod("CmdLoadVar_Impl", BindingFlags.NonPublic | BindingFlags.Static)
        ?? throw new InvalidOperationException("Could not locate LOADVAR implementation.");
    loadVar.Invoke(null, new object[] { script, new TWXProxy.Core.CmdParam[] { param } });

    if (!string.Equals(param.Value, "Zuul", StringComparison.Ordinal))
        throw new InvalidOperationException("LOADVAR did not read from the executing script runtime context.");
}

static void NativeMombotRelogSendsConfiguredNameAfterLoadvars()
{
    string relogPath = "/Users/mosleym/twx/scripts/mombot/commands/general/relog.cts";
    if (!File.Exists(relogPath))
        throw new InvalidOperationException($"Live relog script not found at '{relogPath}'.");

    var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("remote-relog-live-cts-test");
    var fakeServer = new CapturingTwxServer { Connected = false };
    runtimeContext.TWXServer = fakeServer;

    using var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = runtimeContext,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    runtimeContext.ActiveInterpreter = interpreter;
    runtimeContext.TWXInterpreter = interpreter;

    using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
    TWXProxy.Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~dorelog", "1");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$BOT~DORELOG", "1");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~servername", "Zuul");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$BOT~SERVERNAME", "Zuul");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~username", "Zuul");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~password", "nodana");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~letter", "D");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~mombot_directory", "mombot");

    interpreter.Load(relogPath, silent: true);

    DateTime deadline = DateTime.UtcNow.AddSeconds(3);
    while (interpreter.Count > 0 &&
           !interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Value, "Please enter your name", StringComparison.Ordinal)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (fakeServer.ConnectCount == 0)
        throw new InvalidOperationException("Relog script did not attempt to connect before the BBS name prompt.");
    if (interpreter.Count == 0 || !interpreter[0].GetTriggerSnapshot().Any(trigger =>
            string.Equals(trigger.Value, "Please enter your name", StringComparison.Ordinal)))
    {
        string triggerList = interpreter.Count == 0
            ? "<script stopped>"
            : string.Join(", ", interpreter[0].GetTriggerSnapshot().Select(trigger => trigger.Value));
        throw new InvalidOperationException($"Relog script did not arm the BBS name trigger. Active triggers: {triggerList}");
    }

    interpreter.DispatchPartialLine(
        "Please enter your name (ENTER for none):",
        "Please enter your name (ENTER for none):",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(1);
    while (!fakeServer.SentText.Contains("Zuul\r", StringComparison.Ordinal) && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (!fakeServer.SentText.Contains("Zuul\r", StringComparison.Ordinal))
        throw new InvalidOperationException($"Relog sent '{fakeServer.SentText.Replace("\r", "\\r").Replace("\n", "\\n")}' instead of the configured login name.");
}

static void NativeMombotRelogSendsGameLetterAtCustomMenuPrompt()
{
    string relogPath = "/Users/mosleym/twx/scripts/mombot/commands/general/relog.cts";
    if (!File.Exists(relogPath))
        throw new InvalidOperationException($"Live relog script not found at '{relogPath}'.");

    var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("remote-relog-custom-menu-test");
    var fakeServer = new CapturingTwxServer { Connected = false };
    runtimeContext.TWXServer = fakeServer;

    using var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = runtimeContext,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    runtimeContext.ActiveInterpreter = interpreter;
    runtimeContext.TWXInterpreter = interpreter;

    using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
    TWXProxy.Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~dorelog", "1");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$BOT~DORELOG", "1");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~servername", "Kairos Bridger");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$BOT~SERVERNAME", "Kairos Bridger");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~username", "Kairos Bridger");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~password", "parstel");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~letter", "L");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~mombot_directory", "mombot");

    interpreter.Load(relogPath, silent: true);

    DateTime deadline = DateTime.UtcNow.AddSeconds(3);
    while (interpreter.Count > 0 &&
           !interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Value, "Please enter your name", StringComparison.Ordinal)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (interpreter.Count == 0)
        throw new InvalidOperationException("Relog script stopped before the BBS name prompt.");

    interpreter.DispatchPartialLine(
        "Please enter your name (ENTER for none):",
        "Please enter your name (ENTER for none):",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(1);
    while (!fakeServer.SentText.Contains("Kairos Bridger\r", StringComparison.Ordinal) && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (!fakeServer.SentText.Contains("Kairos Bridger\r", StringComparison.Ordinal))
        throw new InvalidOperationException("Relog did not send the configured BBS name before the custom menu.");

    int afterLoginName = fakeServer.SentText.Length;
    interpreter.DispatchPartialLine(
        "TradeWars Game Server                                     Copyright (C) EIS",
        "TradeWars Game Server                                     Copyright (C) EIS",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(1);
    while (interpreter.Count > 0 &&
           !interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Value, "L - ", StringComparison.Ordinal)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (interpreter.Count == 0 ||
        !interpreter[0].GetTriggerSnapshot().Any(trigger =>
            string.Equals(trigger.Value, "L - ", StringComparison.Ordinal)))
    {
        string triggerList = interpreter.Count == 0
            ? "<script stopped>"
            : string.Join(", ", interpreter[0].GetTriggerSnapshot().Select(trigger => trigger.Value));
        throw new InvalidOperationException($"Relog did not arm custom menu game-letter trigger. Active triggers: {triggerList}");
    }

    interpreter.DispatchPartialLine(
        "³ L - Sub Zero Unlim (open/unregulated)           ³",
        "³ L - Sub Zero Unlim (open/unregulated)           ³",
        forceTrigger: true);
    deadline = DateTime.UtcNow.AddSeconds(1);
    while (interpreter.Count > 0 &&
           interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Name, "RELOGLETTERDASH", StringComparison.OrdinalIgnoreCase)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);
    interpreter.DispatchCompleteLine(string.Empty, string.Empty, forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(2);
    while (fakeServer.SentText.Length == afterLoginName && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    string sentAfterPrompt = fakeServer.SentText[afterLoginName..];
    if (!sentAfterPrompt.Contains("L", StringComparison.Ordinal))
    {
        string visible = sentAfterPrompt.Replace("\r", "\\r").Replace("\n", "\\n");
        string triggerList = interpreter.Count == 0
            ? "<script stopped>"
            : string.Join(", ", interpreter[0].GetTriggerSnapshot().Select(trigger => $"{trigger.Type}:{trigger.Name}={trigger.Value}"));
        throw new InvalidOperationException($"Relog did not send game letter L after the promptless ANSI menu; sent '{visible}'. Active triggers: {triggerList}");
    }

    int afterGameLetter = fakeServer.SentText.Length;
    interpreter.DispatchPartialLine(
        "LTrade Wars 2002 Win32 module now loading.",
        "LTrade Wars 2002 Win32 module now loading.",
        forceTrigger: false);
    Thread.Sleep(500);

    string sentAfterEchoedMainMenu = fakeServer.SentText[afterGameLetter..];
    if (sentAfterEchoedMainMenu.Contains("T", StringComparison.Ordinal))
        throw new InvalidOperationException("Relog treated the echoed custom main-menu prompt as the in-game TW menu and sent T too early.");

    interpreter.DispatchPartialLine(
        "Enter your choice:",
        "Enter your choice:",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(2);
    while (fakeServer.SentText.Length == afterGameLetter && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    string sentAtGameMenu = fakeServer.SentText[afterGameLetter..];
    if (!sentAtGameMenu.Contains("T", StringComparison.Ordinal))
    {
        string visible = sentAtGameMenu.Replace("\r", "\\r").Replace("\n", "\\n");
        throw new InvalidOperationException($"Relog did not enter the game from the TW menu after selecting L; sent '{visible}'.");
    }
}

static void NativeMombotRelogQuickstatsPreservesMarkerByte()
{
    string relogPath = "/Users/mosleym/twx/scripts/mombot/commands/general/relog.cts";
    if (!File.Exists(relogPath))
        throw new InvalidOperationException($"Live relog script not found at '{relogPath}'.");

    var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("native-relog-quickstats-marker-test");
    var fakeServer = new CapturingTwxServer();
    runtimeContext.TWXServer = fakeServer;

    using var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = runtimeContext,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    runtimeContext.ActiveInterpreter = interpreter;
    runtimeContext.TWXInterpreter = interpreter;

    using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
    TWXProxy.Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
    interpreter.LoadAtSubroutine(
        relogPath,
        silent: true,
        entryLabel: ":alldone_relog",
        beforeExecute: null);

    DateTime deadline = DateTime.UtcNow.AddSeconds(2);
    while (fakeServer.SentBytes.Count < 2 && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    byte[] sent = fakeServer.SentBytes.ToArray();
    if (sent.Length < 2 || sent[0] != 145 || sent[1] != (byte)'/')
    {
        string hex = Convert.ToHexString(sent);
        throw new InvalidOperationException($"Relog quickstats sent [{hex}] instead of [912F].");
    }
}

static void NativeMombotConnectivityNewGameWaitsForTwMenuAfterCustomPrompt()
{
    string mombotPath = "/Users/mosleym/twx/scripts/mombot/mombot.cts";
    if (!File.Exists(mombotPath))
        throw new InvalidOperationException($"Live mombot script not found at '{mombotPath}'.");

    var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("native-connectivity-custom-menu-test");
    var fakeServer = new CapturingTwxServer { Connected = false };
    runtimeContext.TWXServer = fakeServer;

    using var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = runtimeContext,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    runtimeContext.ActiveInterpreter = interpreter;
    runtimeContext.TWXInterpreter = interpreter;

    var initialVars = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["$CONNECTIVITY~NEWGAME"] = "1",
        ["$connectivity~newgame"] = "1",
        ["$BOT~BOT_NAME"] = "MomBot",
        ["$SWITCHBOARD~BOT_NAME"] = "MomBot",
        ["$bot~mombot_directory"] = "mombot",
        ["$BOT~MOMBOT_DIRECTORY"] = "mombot",
        ["$BOT~SERVERNAME"] = "Kairos Bridger",
        ["$bot~servername"] = "Kairos Bridger",
        ["$BOT~USERNAME"] = "Kairos Bridger",
        ["$bot~username"] = "Kairos Bridger",
        ["$BOT~PASSWORD"] = "parstel",
        ["$bot~password"] = "parstel",
        ["$BOT~LETTER"] = "K",
        ["$bot~letter"] = "K",
        ["$BOT~STARTSHIPNAME"] = "Mind ()ver Matter",
        ["$bot~startshipname"] = "Mind ()ver Matter",
        ["$BOT~NEWGAMEDAY1"] = "1",
        ["$bot~newgameday1"] = "1",
        ["$newGameDay1"] = "1",
        ["$BOT~NEWGAMEOLDER"] = "0",
        ["$bot~newgameolder"] = "0",
        ["$newGameOlder"] = "0",
    };

    using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
    TWXProxy.Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
    foreach ((string name, string value) in initialVars)
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, name, value);

    interpreter.LoadAtSubroutine(
        mombotPath,
        silent: true,
        entryLabel: ":CONNECTIVITY~ENTER_NEW_GAME",
        beforeExecute: script =>
        {
            foreach ((string name, string value) in initialVars)
                script.SetScriptVarIgnoreCase(name, value);
        });

    DateTime deadline = DateTime.UtcNow.AddSeconds(3);
    while (interpreter.Count > 0 &&
           !interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Value, "Please enter your name", StringComparison.Ordinal)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (interpreter.Count == 0)
        throw new InvalidOperationException("Connectivity new-game script stopped before the BBS name prompt.");

    interpreter.DispatchPartialLine(
        "Please enter your name (ENTER for none):",
        "Please enter your name (ENTER for none):",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(1);
    while (!fakeServer.SentText.Contains("Kairos Bridger\r", StringComparison.Ordinal) && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (!fakeServer.SentText.Contains("Kairos Bridger\r", StringComparison.Ordinal))
        throw new InvalidOperationException("Connectivity new-game path did not send the configured BBS login name.");

    int afterLoginName = fakeServer.SentText.Length;
    interpreter.DispatchPartialLine(
        "TradeWars Game Server                                     Copyright (C) EIS",
        "TradeWars Game Server                                     Copyright (C) EIS",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(1);
    while (interpreter.Count > 0 &&
           !interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Value, "K - ", StringComparison.Ordinal)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (interpreter.Count == 0 ||
        !interpreter[0].GetTriggerSnapshot().Any(trigger =>
            string.Equals(trigger.Value, "K - ", StringComparison.Ordinal)))
    {
        string triggerList = interpreter.Count == 0
            ? "<script stopped>"
            : string.Join(", ", interpreter[0].GetTriggerSnapshot().Select(trigger => trigger.Value));
        throw new InvalidOperationException($"Connectivity new-game path did not arm custom menu game-letter trigger. Active triggers: {triggerList}");
    }

    interpreter.DispatchPartialLine(
        "³ K - Sub Zero Trek (open/unregulated)            ³  See website for more info",
        "³ K - Sub Zero Trek (open/unregulated)            ³  See website for more info",
        forceTrigger: true);
    deadline = DateTime.UtcNow.AddSeconds(1);
    while (interpreter.Count > 0 &&
           interpreter[0].GetTriggerSnapshot().Any(trigger =>
               string.Equals(trigger.Name, "RELOGLETTERDASH", StringComparison.OrdinalIgnoreCase)) &&
           DateTime.UtcNow < deadline)
        Thread.Sleep(10);
    interpreter.DispatchCompleteLine(string.Empty, string.Empty, forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(2);
    while (fakeServer.SentText.Length == afterLoginName && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    string sentAfterCustomPrompt = fakeServer.SentText[afterLoginName..];
    if (!sentAfterCustomPrompt.Contains("K", StringComparison.Ordinal))
        throw new InvalidOperationException($"Connectivity new-game path did not send game letter K after the promptless ANSI menu; sent '{sentAfterCustomPrompt.Replace("\r", "\\r").Replace("\n", "\\n")}'.");

    int afterGameLetter = fakeServer.SentText.Length;
    interpreter.DispatchPartialLine(
        "KTrade Wars 2002 Win32 module now loading.",
        "KTrade Wars 2002 Win32 module now loading.",
        forceTrigger: false);
    Thread.Sleep(500);

    string sentAfterEchoedMainMenu = fakeServer.SentText[afterGameLetter..];
    if (sentAfterEchoedMainMenu.Contains("T", StringComparison.Ordinal))
        throw new InvalidOperationException("Connectivity new-game path treated the echoed custom main-menu prompt as the in-game TW menu and sent T too early.");

    interpreter.DispatchPartialLine(
        "Enter your choice:",
        "Enter your choice:",
        forceTrigger: false);

    deadline = DateTime.UtcNow.AddSeconds(2);
    while (fakeServer.SentText.Length == afterGameLetter && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    string sentAtGameMenu = fakeServer.SentText[afterGameLetter..];
    if (!sentAtGameMenu.Contains("T", StringComparison.Ordinal))
        throw new InvalidOperationException($"Connectivity new-game path did not enter the game from the TW menu; sent '{sentAtGameMenu.Replace("\r", "\\r").Replace("\n", "\\n")}'.");
}

static void NativeMombotRelogSendsConfiguredNameThroughTelnetAdapter()
{
    string relogPath = "/Users/mosleym/twx/scripts/mombot/commands/general/relog.cts";
    if (!File.Exists(relogPath))
        throw new InvalidOperationException($"Live relog script not found at '{relogPath}'.");

    using var listener = new TcpListener(IPAddress.Loopback, 0);
    listener.Start();
    int port = ((IPEndPoint)listener.LocalEndpoint).Port;
    var received = new StringBuilder();
    using var acceptReady = new ManualResetEventSlim(false);
    using var promptReady = new ManualResetEventSlim(false);
    using var stopServer = new CancellationTokenSource();
    Task serverTask = Task.Run(async () =>
    {
        using TcpClient client = await listener.AcceptTcpClientAsync(stopServer.Token);
        acceptReady.Set();
        await using NetworkStream stream = client.GetStream();
        if (!promptReady.Wait(TimeSpan.FromSeconds(3)))
            return;

        byte[] prompt = Encoding.Latin1.GetBytes("Please enter your name (ENTER for none):");
        await stream.WriteAsync(prompt, stopServer.Token);
        await stream.FlushAsync(stopServer.Token);

        byte[] buffer = new byte[128];
        DateTime deadline = DateTime.UtcNow.AddSeconds(3);
        while (DateTime.UtcNow < deadline && !received.ToString().Contains("Zuul\r", StringComparison.Ordinal))
        {
            if (stream.DataAvailable)
            {
                int count = await stream.ReadAsync(buffer, stopServer.Token);
                if (count <= 0)
                    break;

                received.Append(Encoding.Latin1.GetString(buffer, 0, count));
                continue;
            }

            await Task.Delay(10, stopServer.Token);
        }
    });

    try
    {
        var terminalBuffer = new TerminalBuffer(80, 25);
        var parser = new AnsiParser(terminalBuffer);
        using var telnet = new TelnetClient(terminalBuffer, parser);

        var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("remote-relog-telnet-test");
        using var interpreter = new TWXProxy.Core.ModInterpreter
        {
            RuntimeContext = runtimeContext,
            ProgramDir = "/Users/mosleym/twx",
            ScriptDirectory = "/Users/mosleym/twx/scripts",
        };
        runtimeContext.ActiveInterpreter = interpreter;
        runtimeContext.TWXInterpreter = interpreter;

        bool gameConnected = false;
        var adapter = new MtcTelnetTwxServer(
            telnet,
            _ => { },
            isConnected: () => gameConnected,
            connectToServerAsync: () =>
            {
                gameConnected = true;
                return Task.CompletedTask;
            },
            disconnectFromServerAsync: () =>
            {
                gameConnected = false;
                return Task.CompletedTask;
            });
        runtimeContext.TWXServer = adapter;

        telnet.TextLineAnsiReceived += (ansiLine, strippedLine) =>
        {
            if (strippedLine.Contains("Please enter your name", StringComparison.Ordinal))
                interpreter.DispatchPartialLine(strippedLine, ansiLine, forceTrigger: false);
            else
                interpreter.DispatchCompleteLine(strippedLine, ansiLine, forceTrigger: false);
        };

        telnet.ConnectAsync("127.0.0.1", port).GetAwaiter().GetResult();
        if (!acceptReady.Wait(TimeSpan.FromSeconds(3)))
            throw new InvalidOperationException("Loopback telnet server did not accept the client connection.");

        using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
        TWXProxy.Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~dorelog", "1");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$BOT~DORELOG", "1");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~servername", "Zuul");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$BOT~SERVERNAME", "Zuul");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~username", "Zuul");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~password", "nodana");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~letter", "D");
        TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~mombot_directory", "mombot");

        interpreter.Load(relogPath, silent: true);

        DateTime deadline = DateTime.UtcNow.AddSeconds(3);
        while (interpreter.Count > 0 &&
               !interpreter[0].GetTriggerSnapshot().Any(trigger =>
                   string.Equals(trigger.Value, "Please enter your name", StringComparison.Ordinal)) &&
               DateTime.UtcNow < deadline)
        {
            Thread.Sleep(10);
        }

        if (interpreter.Count == 0 || !interpreter[0].GetTriggerSnapshot().Any(trigger =>
                string.Equals(trigger.Value, "Please enter your name", StringComparison.Ordinal)))
        {
            throw new InvalidOperationException("Relog script did not arm the BBS name trigger before the socket prompt.");
        }

        promptReady.Set();
        deadline = DateTime.UtcNow.AddSeconds(3);
        while (!received.ToString().Contains("Zuul\r", StringComparison.Ordinal) && DateTime.UtcNow < deadline)
            Thread.Sleep(10);

        string sent = received.ToString();
        if (!sent.Contains("Zuul\r", StringComparison.Ordinal))
            throw new InvalidOperationException($"Socket-backed relog sent '{sent.Replace("\r", "\\r").Replace("\n", "\\n")}' instead of the configured login name.");
    }
    finally
    {
        stopServer.Cancel();
        try { serverTask.Wait(TimeSpan.FromSeconds(1)); } catch { }
        listener.Stop();
    }
}

static void RemoteProxyNativeMombotExposesNativeStateToScripts()
{
    var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("remote-native-state-test");
    var fakeServer = new CapturingTwxServer();
    var nativeConfig = new TWXProxy.Core.BotConfig
    {
        Alias = TWXProxy.Core.ProxyMenuCatalog.GetBotAlias(TWXProxy.Core.ProxyMenuCatalog.NativeMombotSectionName),
        Name = "MomBot",
        ScriptFile = "mombot/mombot.cts",
        ScriptFiles = new List<string> { "mombot/mombot.cts" },
        Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Native"] = "1",
        },
    };
    fakeServer.RegisterOrUpdateBotConfig(nativeConfig);
    runtimeContext.TWXServer = fakeServer;

    using var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = runtimeContext,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    runtimeContext.ActiveInterpreter = interpreter;
    runtimeContext.TWXInterpreter = interpreter;

    using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
    interpreter.ActivateBotContext(nativeConfig);
    if (!string.Equals(fakeServer.ActiveBotName, nativeConfig.Name, StringComparison.Ordinal))
        throw new InvalidOperationException("Activating native MomBot context did not mark the remote adapter active.");

    var scriptRef = new TWXProxy.Core.ScriptRef();
    int nativeConstId = scriptRef.FindSysConst("ISNATIVEBOT");
    if (nativeConstId < 0)
        throw new InvalidOperationException("ISNATIVEBOT sysconst was not registered.");

    string isNative = scriptRef.GetSysConst(nativeConstId).Read(Array.Empty<string>());
    if (isNative != "1")
        throw new InvalidOperationException($"Expected ISNATIVEBOT=1 for an active remote native MomBot, got {isNative}.");

    using var script = new TWXProxy.Core.Script(interpreter);
    MethodInfo load = typeof(TWXProxy.Core.ScriptRef).GetMethod("CmdLoadScript_Impl", BindingFlags.NonPublic | BindingFlags.Static)
        ?? throw new InvalidOperationException("Could not locate LOAD implementation.");
    load.Invoke(null, new object[] { script, new TWXProxy.Core.CmdParam[] { new() { Value = "scripts\\mombot\\mombot.cts" } } });

    if (interpreter.Count != 0)
        throw new InvalidOperationException("Implicit LOAD mombot.cts should be ignored while remote native MomBot is active.");
}

static void ScriptSendUsesExecutingRuntimeServer()
{
    var rightContext = new TWXProxy.Core.TwxRuntimeContext("right-send-context");
    var fakeServer = new CapturingTwxServer();
    rightContext.TWXServer = fakeServer;

    var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = rightContext,
    };
    using var script = new TWXProxy.Core.Script(interpreter);

    MethodInfo send = typeof(TWXProxy.Core.ScriptRef).GetMethod("CmdSend", BindingFlags.NonPublic | BindingFlags.Static)
        ?? throw new InvalidOperationException("Could not locate SEND implementation.");
    send.Invoke(null, new object[] { script, new TWXProxy.Core.CmdParam[] { new() { Value = "Zuul\r" } } });

    if (!string.Equals(fakeServer.SentText, "Zuul\r", StringComparison.Ordinal))
        throw new InvalidOperationException("SEND did not write to the executing script runtime server.");
}

static void RemoteProxyNativeMombotHandlesScriptInputLocally()
{
    string commandSource = ReadRepoSource("Source", "Core", "ScriptCmdImpl.cs");
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");
    string mainSource = ReadRepoSource("Source", "MTC", "MainWindow.cs");
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");

    if (!commandSource.Contains("else if (GlobalModules.CurrentContext.TWXServer != null)", StringComparison.Ordinal) ||
        !commandSource.Contains("scriptObj.SetWaitingForInput(parameters[0], keypressMode);", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("GETINPUT must arm script input when only a TWX server adapter is present.");
    }

    if (commandSource.Contains("GlobalModules.TWXServer?.ClientMessage($\"[GETINPUT] Using Console Mode (fallback)", StringComparison.Ordinal))
        throw new InvalidOperationException("GETINPUT console fallback diagnostics must not be rendered into MTC terminals.");

    if (!interactionSource.Contains("private bool TryHandleTelnetScriptInput(byte[] bytes)", StringComparison.Ordinal) ||
        !interactionSource.Contains("interpreter.LocalInputEvent(line);", StringComparison.Ordinal) ||
        !interactionSource.Contains("if (TryHandleTelnetScriptInput(bytes))\n            return;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("MTC terminal input must feed waiting remote-native scripts before forwarding to telnet.");
    }

    if (!mainSource.Contains("private string _telnetScriptInputBuffer = string.Empty;", StringComparison.Ordinal) ||
        !tabbedSource.Contains("public string TelnetScriptInputBuffer { get; set; } = string.Empty;", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Remote-native script input buffering must be preserved per MTC tab.");
    }
}

static void NativeMombotHelpDoesNotRestoreCachedGamePrompt()
{
    string interactionSource = ReadRepoSource("Source", "MTC", "MombotInteraction.cs");
    string tabbedSource = ReadRepoSource("Source", "MTC", "TabbedShell.cs");

    if (interactionSource.Contains("HelpPromptRestore", StringComparison.Ordinal) ||
        interactionSource.Contains("IsHelpOnlyCommandLine", StringComparison.Ordinal) ||
        tabbedSource.Contains("MombotHelpPromptRestoreTicket", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Help must not schedule a synthetic cached game prompt after script completion.");
    }

    if (!interactionSource.Contains("RecordMombotInteractiveCommandInGameLog(command);\n        ExecuteMombotLocalInput(command);", StringComparison.Ordinal))
        throw new InvalidOperationException("Interactive commands must use normal dispatch without a help-specific completion handler.");
}

static void InstalledMgridHelpSendsOnlyTwxPromptMarkers()
{
    string mgridPath = "/Users/mosleym/twx/scripts/mombot/local/modes/grid/mgrid.cts";
    if (!File.Exists(mgridPath))
        throw new InvalidOperationException($"Installed mgrid script not found at '{mgridPath}'.");

    var runtimeContext = new TWXProxy.Core.TwxRuntimeContext("installed-mgrid-help-test");
    var fakeServer = new CapturingTwxServer();
    runtimeContext.TWXServer = fakeServer;

    using var interpreter = new TWXProxy.Core.ModInterpreter
    {
        RuntimeContext = runtimeContext,
        ProgramDir = "/Users/mosleym/twx",
        ScriptDirectory = "/Users/mosleym/twx/scripts",
    };
    runtimeContext.ActiveInterpreter = interpreter;
    runtimeContext.TWXInterpreter = interpreter;

    using var scope = TWXProxy.Core.GlobalModules.UseRuntimeContext(runtimeContext);
    TWXProxy.Core.ScriptRef.ClearCurrentGameVars(runtimeContext);
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~mombot_directory", "mombot");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~command", "mgrid");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~parm1", "help");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~user_command_line", "mgrid help");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$switchboard~self_command", "1");
    TWXProxy.Core.ScriptRef.SetCurrentGameVar(runtimeContext, "$bot~silent_running", "1");

    interpreter.Load(mgridPath, silent: true);

    DateTime deadline = DateTime.UtcNow.AddSeconds(2);
    while (interpreter.Count > 0 && DateTime.UtcNow < deadline)
        Thread.Sleep(10);

    if (interpreter.Count > 0)
        throw new InvalidOperationException("Installed mgrid help did not halt after displaying help.");
    if (fakeServer.SentBytes.Count == 0 || fakeServer.SentBytes.Any(value => value != 0x91))
        throw new InvalidOperationException($"Installed mgrid help sent bytes other than TWX prompt markers: {Convert.ToHexString(fakeServer.SentBytes.ToArray())}.");
}

static int CountOccurrences(string source, string value)
{
    int count = 0;
    int index = 0;
    while ((index = source.IndexOf(value, index, StringComparison.Ordinal)) >= 0)
    {
        count++;
        index += value.Length;
    }

    return count;
}

static void AssertLine(TerminalBuffer buffer, int row, string expected)
{
    string actual = buffer.GetLineText(row);
    if (!string.Equals(actual, expected, StringComparison.Ordinal))
        throw new InvalidOperationException($"Expected line {row} to be '{expected}', got '{actual}'.");
}

static string ReadMombotSource(params string[] relativePathParts)
{
    string? sourceRoot = Environment.GetEnvironmentVariable("MOMBOT_SOURCE_ROOT");
    string root = string.IsNullOrWhiteSpace(sourceRoot)
        ? "/Users/mosleym/tw2002/mombot/mombot5.0/source"
        : sourceRoot;
    string sourcePath = Path.Combine(new[] { root }.Concat(relativePathParts).ToArray());

    if (!File.Exists(sourcePath))
        throw new InvalidOperationException($"Mombot source was not found at '{sourcePath}'.");

    return File.ReadAllText(sourcePath);
}

static string ReadRepoSource(params string[] relativePathParts)
{
    string root = AppContext.BaseDirectory;
    while (!string.IsNullOrEmpty(root) && !File.Exists(Path.Combine(root, "Source", "MTC", "MTC.csproj")))
    {
        string? parent = Directory.GetParent(root)?.FullName;
        if (string.Equals(parent, root, StringComparison.Ordinal))
            break;
        root = parent ?? string.Empty;
    }

    if (string.IsNullOrEmpty(root))
        root = "/Users/mosleym/Code/twxproxy/TWX30";

    string sourcePath = Path.Combine(new[] { root }.Concat(relativePathParts).ToArray());
    if (!File.Exists(sourcePath))
        throw new InvalidOperationException($"Repository source was not found at '{sourcePath}'.");

    return File.ReadAllText(sourcePath);
}

sealed class CapturingTwxServer : TWXProxy.Core.ITWXServer
{
    private readonly List<byte> _sent = new();
    private readonly Dictionary<string, TWXProxy.Core.BotConfig> _botConfigs = new(StringComparer.OrdinalIgnoreCase);

    public bool Connected { get; set; } = true;
    public int ConnectCount { get; private set; }
    public int DisconnectCount { get; private set; }
    public bool IsConnected => Connected;
    public int ClientCount => 0;
    public bool AllowLerkers { get; set; } = true;
    public bool AcceptExternal { get; set; } = true;
    public string ExternalAddress { get; set; } = string.Empty;
    public bool BroadCastMsgs { get; set; } = true;
    public bool LocalEcho { get; set; } = true;
    public string ActiveBotName { get; set; } = string.Empty;
    public string SentText => Encoding.Latin1.GetString(_sent.ToArray());
    public IReadOnlyList<byte> SentBytes => _sent;

    public void Broadcast(string message) { }
    public void Broadcast(string message, bool broadcastDeaf) { }
    public void BroadcastLiteral(string message) { }
    public void BroadcastLiteral(string message, bool broadcastDeaf) { }
    public void ClientMessage(string message) { }
    public Task ConnectToServerAsync()
    {
        ConnectCount++;
        Connected = true;
        return Task.CompletedTask;
    }

    public Task DisconnectFromServerAsync()
    {
        DisconnectCount++;
        Connected = false;
        return Task.CompletedTask;
    }
    public Task SendToServerAsync(byte[] data)
    {
        _sent.AddRange(data);
        return Task.CompletedTask;
    }
    public void AddQuickText(string key, string value) { }
    public void ClearQuickText(string? key = null) { }
    public TWXProxy.Core.ClientType GetClientType(int index) => TWXProxy.Core.ClientType.Standard;
    public void SetClientType(int index, TWXProxy.Core.ClientType type) { }
    public void RegisterBot(string botName, string scriptFile, string description = "")
    {
        RegisterOrUpdateBotConfig(new TWXProxy.Core.BotConfig
        {
            Alias = botName.Trim(),
            Name = botName.Trim(),
            ScriptFile = scriptFile,
            ScriptFiles = string.IsNullOrWhiteSpace(scriptFile) ? new List<string>() : new List<string> { scriptFile },
            Description = description,
        });
    }

    public void RegisterOrUpdateBotConfig(TWXProxy.Core.BotConfig config)
    {
        if (string.IsNullOrWhiteSpace(config.Name))
            return;

        _botConfigs[config.Name.Trim()] = config;
        if (!string.IsNullOrWhiteSpace(config.Alias))
            _botConfigs[config.Alias.Trim()] = config;
    }

    public void UnregisterBot(string botName)
    {
        if (!string.IsNullOrWhiteSpace(botName))
            _botConfigs.Remove(botName.Trim());
    }

    public List<string> GetBotList() => _botConfigs.Values
        .Select(bot => bot.Name)
        .Where(name => !string.IsNullOrWhiteSpace(name))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

    public TWXProxy.Core.BotConfig? GetBotConfig(string botName)
        => !string.IsNullOrWhiteSpace(botName) && _botConfigs.TryGetValue(botName.Trim(), out TWXProxy.Core.BotConfig? config)
            ? config
            : null;
    public object? GetActiveBot() => null;
    public void Dispose() { }
}

sealed class NonPumpingSynchronizationContext : SynchronizationContext
{
    public override void Post(SendOrPostCallback d, object? state)
    {
    }

    public override void Send(SendOrPostCallback d, object? state)
        => throw new InvalidOperationException("Synchronous sends are not supported by this test context.");
}
