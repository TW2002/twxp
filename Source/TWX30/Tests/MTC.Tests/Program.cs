using System.Text;
using MTC;

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var tests = new (string Name, Action Body)[]
{
    ("Split ANSI sequence keeps ESC introducer", SplitAnsiSequenceKeepsEscIntroducer),
    ("Standalone ESC echo drops only ESC", StandaloneEscEchoDropsOnlyEsc),
    ("Native MomBot saved backdoor flag resolves startup backdoor", NativeMombotSavedBackdoorFlagResolvesStartupBackdoor),
    ("Native MomBot script booleans are numeric", NativeMombotScriptBooleansAreNumeric),
    ("Native MomBot dock move prefers StarDock over stale saved destination", NativeMombotDockMovePrefersStardock),
    ("Native MomBot dock move does not fallback to sector one", NativeMombotDockMoveDoesNotFallbackToSectorOne),
    ("Native MomBot new-game setup precedes startup move", NativeMombotNewGameSetupPrecedesStartupMove),
    ("Native MomBot mow passes destination to backdoor helper", NativeMombotMowPassesDestinationToBackdoorHelper),
    ("Native MomBot relog recognizes OpenTW server banner", NativeMombotRelogRecognizesOpenTwServerBanner),
    ("Native MomBot connectivity recognizes OpenTW server banner", NativeMombotConnectivityRecognizesOpenTwServerBanner),
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
    ("Major Space Lanes toolbar reserves summary column", MajorSpaceLanesToolbarReservesSummaryColumn),
    ("Game size allows 100,000 sectors", GameSizeAllowsOneHundredThousandSectors),
    ("Game size rejects values above 100,000 sectors", GameSizeRejectsValuesAboveOneHundredThousandSectors),
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
        !scriptWindowSource.Contains("Topmost = false", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected script popups to avoid activation and drop tab-selection topmost after being raised.");
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

    if (!tabbedSource.Contains("CanMtcTabAdoptGameIdentity", StringComparison.Ordinal) ||
        !tabbedSource.Contains("owner.GameInstance?.IsRunning == true", StringComparison.Ordinal) ||
        !tabbedSource.Contains("owner.Telnet.IsConnected", StringComparison.Ordinal) ||
        !tabbedSource.Contains("[MTC.TabIsolation] blocked", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected connected tabs to block silent game identity changes.");
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

    if (!recentSource.Contains("OpenPathAsync(path, addToRecent: true, allowReplaceConnectedTab: true)", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected File > Recent to explicitly allow confirmed connected-tab replacement.");

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

    int resetMethod = runtimeSource.IndexOf("private async Task OnResetGameAsync()", StringComparison.Ordinal);
    int identityMethod = runtimeSource.IndexOf("private void ResetEmbeddedGameIdentity", StringComparison.Ordinal);
    int storageMethod = runtimeSource.IndexOf("private void ResetMombotGameStorage", StringComparison.Ordinal);

    if (resetMethod < 0 || identityMethod < 0 || storageMethod < 0)
        throw new InvalidOperationException("Could not locate reset methods in RuntimeState.cs.");

    string resetBody = runtimeSource[resetMethod..identityMethod];
    if (!resetBody.Contains("Core.ScriptRef.SetOnVariableSaved(runtimeContext, null)", StringComparison.Ordinal) ||
        !resetBody.Contains("Core.ScriptRef.ClearCurrentGameVars(runtimeContext)", StringComparison.Ordinal) ||
        !resetBody.Contains("await GameConfigService.ResetVariablesAsync(gameName, config.Variables)", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected reset to detach variable saves, clear runtime variables, and reset variables.json.");
    }

    string identityBody = runtimeSource[identityMethod..storageMethod];
    if (identityBody.Contains("config.GameLetter = string.Empty", StringComparison.Ordinal))
        throw new InvalidOperationException("Reset must preserve the configured game letter.");

    if (!configSource.Contains("public static async Task ResetVariablesAsync", StringComparison.Ordinal) ||
        !configSource.Contains("VariableSaves.ResetAsync", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Expected MTC GameConfigService to expose debounced variable reset.");
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
        !overlaySource.Contains("Padding = new Thickness(8, 1, 6, 1)", StringComparison.Ordinal) ||
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

static void MajorSpaceLanesToolbarReservesSummaryColumn()
{
    string source = ReadRepoSource("Source", "MTC", "MajorSpaceLanesWindow.cs");

    if (!source.Contains("ColumnDefinitions = new ColumnDefinitions(\"Auto,*\")", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected Major Space Lanes toolbar to reserve a separate summary column.");

    if (!source.Contains("_summaryText.WithGridPosition(0, 1)", StringComparison.Ordinal))
        throw new InvalidOperationException("Expected Major Space Lanes summary text in the second toolbar column.");
}

static void GameSizeAllowsOneHundredThousandSectors()
{
    if (!GameSizeLimits.IsValidSectorCount(100_000))
        throw new InvalidOperationException("Expected 100,000 sectors to be accepted.");
}

static void GameSizeRejectsValuesAboveOneHundredThousandSectors()
{
    if (GameSizeLimits.IsValidSectorCount(100_001))
        throw new InvalidOperationException("Expected 100,001 sectors to be rejected.");
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
