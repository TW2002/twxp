using System.Globalization;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Platform.Storage;
using Core = TWXProxy.Core;

namespace MTC;

/// <summary>
/// Application-wide preferences dialog.
/// Usage: <c>var saved = await new PreferencesDialog(prefs, debugPrefs, jsonRpcPrefs, gameConfig, gameName).ShowDialog&lt;bool&gt;(owner);</c>
/// The caller's app preferences, per-game debug preferences, per-game RPC preferences, and per-game log preferences
/// are updated in-place when the user clicks Save, and the dialog returns <c>true</c>.
/// </summary>
internal class PreferencesDialog : Window
{
    // ── Colors (match MainWindow dark chrome) ─────────────────────────────
    private static readonly IBrush BgPanel    = new SolidColorBrush(Color.FromRgb(23,  25,  28));
    private static readonly IBrush BgSection  = new SolidColorBrush(Color.FromRgb(31,  34,  38));
    private static readonly IBrush BgInput    = new SolidColorBrush(Color.FromRgb(18,  20,  23));
    private static readonly IBrush BdInput    = new SolidColorBrush(Color.FromRgb(74,  81,  92));
    private static readonly IBrush BdSection  = new SolidColorBrush(Color.FromRgb(49,  55,  64));
    private static readonly IBrush Accent     = new SolidColorBrush(Color.FromRgb(104, 176, 196));
    private static readonly IBrush FgNormal   = new SolidColorBrush(Color.FromRgb(206, 211, 218));
    private static readonly IBrush FgLabel    = new SolidColorBrush(Color.FromRgb(236, 239, 243));
    private static readonly IBrush FgMuted    = new SolidColorBrush(Color.FromRgb(145, 153, 164));
    private static readonly IBrush BgButton   = new SolidColorBrush(Color.FromRgb(52,  58,  66));
    private static readonly IBrush BgPrimary  = new SolidColorBrush(Color.FromRgb(57,  117, 135));

    private static readonly MemoryLimitOption[] MemoryLimitOptions =
    {
        new("128 KB", 128),
        new("256 KB", 256),
        new("384 KB", 384),
        new("512 KB", 512),
        new("768 KB", 768),
        new("1 MB", 1024),
    };

    private static readonly RpcApprovalOption[] RpcApprovalOptions =
    {
        new("Approve actions", MtcRpcApprovalLevels.ApproveActions),
        new("Read-only", MtcRpcApprovalLevels.ReadOnly),
        new("Full automation", MtcRpcApprovalLevels.FullAutomation),
    };

    private static readonly UpdateOption[] UpdateLaneOptions =
    {
        new("Beta", AppPreferences.UpdateLaneBeta),
        new("Stable", AppPreferences.UpdateLaneStable),
        new("Dev", AppPreferences.UpdateLaneDev),
    };

    private static readonly UpdateOption[] UpdateCadenceOptions =
    {
        new("Daily", AppPreferences.UpdateCadenceDaily),
        new("Manual only", AppPreferences.UpdateCadenceManual),
        new("Every startup", AppPreferences.UpdateCadenceStartup),
        new("Weekly", AppPreferences.UpdateCadenceWeekly),
    };

    public PreferencesDialog(
        AppPreferences prefs,
        EmbeddedMtcDebugConfig debugPrefs,
        EmbeddedMtcJsonRpcConfig jsonRpcPrefs,
        EmbeddedGameConfig? gameConfig,
        string? gameName)
    {
        Title                 = "Preferences";
        Width                 = 720;
        Height                = 620;
        MinWidth              = 620;
        MinHeight             = 480;
        CanResize             = true;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background            = BgPanel;

        string defaultProgramDir = string.IsNullOrWhiteSpace(prefs.ProgramDirectory)
            ? Core.SharedPaths.GetDefaultProgramDir()
            : prefs.ProgramDirectory;
        string defaultScriptsDir = string.IsNullOrWhiteSpace(prefs.ScriptsDirectory)
            ? Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(defaultProgramDir)
            : prefs.ScriptsDirectory;

        var txtProgramDir = BuildPathTextBox(defaultProgramDir, "path to TWX program directory");
        var txtScripts = BuildPathTextBox(defaultScriptsDir, "path to scripts folder");

        var btnBrowseProgramDir = BuildBrowseButton();
        btnBrowseProgramDir.Click += async (_, _) =>
        {
            var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
            if (storage == null) return;

            string currentProgramDir = Directory.Exists(txtProgramDir.Text)
                ? txtProgramDir.Text!
                : Core.SharedPaths.GetDefaultProgramDir();
            string previousDefaultScripts = Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(currentProgramDir);

            var startFolder = await storage.TryGetFolderFromPathAsync(currentProgramDir);
            var folders = await storage.OpenFolderPickerAsync(new FolderPickerOpenOptions
            {
                Title                  = "Select TWX Program Directory",
                SuggestedStartLocation = startFolder,
                AllowMultiple          = false,
            });

            if (folders.Count == 0)
                return;

            string selectedProgramDir = folders[0].Path.LocalPath;
            txtProgramDir.Text = selectedProgramDir;

            if (string.IsNullOrWhiteSpace(txtScripts.Text) ||
                string.Equals(txtScripts.Text, previousDefaultScripts, StringComparison.OrdinalIgnoreCase))
            {
                txtScripts.Text = Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(selectedProgramDir);
            }
        };

        var btnBrowse = BuildBrowseButton();
        btnBrowse.Click += async (_, _) =>
        {
            var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
            if (storage == null) return;

            // Start in the current scripts dir (or home if it doesn't exist).
            var startPath = Directory.Exists(txtScripts.Text)
                ? txtScripts.Text!
                : Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var startFolder = await storage.TryGetFolderFromPathAsync(startPath);

            var folders = await storage.OpenFolderPickerAsync(new FolderPickerOpenOptions
            {
                Title                  = "Select Scripts Directory",
                SuggestedStartLocation = startFolder,
                AllowMultiple          = false,
            });

            if (folders.Count > 0)
                txtScripts.Text = folders[0].Path.LocalPath;
        };

        var programDirRow = BuildPathInputRow(txtProgramDir, btnBrowseProgramDir);
        var scriptsRow = BuildPathInputRow(txtScripts, btnBrowse);

        var chkDebug = BuildCheckBox("Enable debug logging", debugPrefs.DebugLoggingEnabled);
        var chkVerbose = BuildCheckBox("Enable verbose parameter debug logging", debugPrefs.VerboseDebugLogging);
        var chkScriptTrace = BuildCheckBox("Enable script VM trace logging (huge)", debugPrefs.ScriptTraceDebugLogging);
        var chkVariablePersistenceDebug = BuildCheckBox("Debug savevar/loadvar logging (very noisy)", debugPrefs.VariablePersistenceDebugLogging);
        var chkAutoRecorderDebug = BuildCheckBox("Enable AutoRecorder debug logging", debugPrefs.AutoRecorderDebugLogging);
        var chkTriggerDebug = BuildCheckBox("Enable trigger debug logging (very noisy)", debugPrefs.TriggerDebugLogging);
        var chkDebugDatabaseChanges = BuildCheckBox("Debug Database Changes", debugPrefs.DebugDatabaseChanges);
        var chkDebugPortHaggle = BuildCheckBox("Debug port haggle to mtc_haggle_debug.log", debugPrefs.DebugPortHaggleEnabled);
        var chkDebugPlanetHaggle = BuildCheckBox("Debug planet haggle to mtc_neg_debug.log", debugPrefs.DebugPlanetHaggleEnabled);
        var logPrefs = gameConfig ?? new EmbeddedGameConfig();
        var chkCreateGameLogs = BuildCheckBox("Create game logs", logPrefs.LogEnabled);
        var chkCreateAnsiGameLogs = BuildCheckBox("Create ANSI game logs", logPrefs.LogAnsiCompanion);
        var chkEnableRedAlertMode = BuildCheckBox("Enable Red Alert Mode", prefs.EnableRedAlertMode);
        var chkPreparedVm = BuildCheckBox("Use prepared VM", prefs.PreparedVmEnabled);
        var chkScriptInfiniteLoopProtection = BuildCheckBox("Infinite loop protection", prefs.ScriptInfiniteLoopProtectionEnabled);
        var chkStaleConnectionProbe = BuildCheckBox("Stale connection probe", prefs.StaleConnectionProbeEnabled);
        var txtStaleConnectionProbeTimeout = BuildPathTextBox(
            AppPreferences.NormalizeNetworkWatchdogSeconds(
                prefs.StaleConnectionProbeTimeoutSeconds,
                AppPreferences.DefaultLocalInputResponseTimeoutSeconds).ToString(CultureInfo.InvariantCulture),
            AppPreferences.DefaultLocalInputResponseTimeoutSeconds.ToString(CultureInfo.InvariantCulture));
        txtStaleConnectionProbeTimeout.Width = 90;
        txtStaleConnectionProbeTimeout.HorizontalAlignment = HorizontalAlignment.Left;
        var chkGameIdleKeepalive = BuildCheckBox("Game idle keepalive", prefs.GameIdleKeepaliveEnabled);
        var txtGameIdleKeepaliveInterval = BuildPathTextBox(
            AppPreferences.NormalizeNetworkWatchdogSeconds(
                prefs.GameIdleKeepaliveIntervalSeconds,
                AppPreferences.DefaultGameIdleKeepaliveIntervalSeconds).ToString(CultureInfo.InvariantCulture),
            AppPreferences.DefaultGameIdleKeepaliveIntervalSeconds.ToString(CultureInfo.InvariantCulture));
        txtGameIdleKeepaliveInterval.Width = 90;
        txtGameIdleKeepaliveInterval.HorizontalAlignment = HorizontalAlignment.Left;
        var chkDisableScriptWindowStayInFront = BuildCheckBox("Ignore stay-in-front for script popup windows", prefs.DisableScriptWindowStayInFront);
        var chkPythonScripts = BuildCheckBox("Enable Python scripts in the Scripts menu", prefs.PythonScriptsEnabled);
        var chkPythonExposeRpcToken = BuildCheckBox("Expose JSON-RPC bearer token to Python scripts", prefs.PythonExposeJsonRpcToken);
        var txtPythonInterpreter = BuildPathTextBox(
            AppPreferences.NormalizePythonInterpreterPath(prefs.PythonInterpreterPath),
            "auto");
        var chkVmMetrics = BuildCheckBox("Log VM metrics", prefs.VmMetricsEnabled);
        var chkPerformanceMonitoring = BuildCheckBox("Enable MTC performance monitoring when MTC_PERF_ENABLE_LOG=1", prefs.PerformanceMonitoringEnabled);
        var chkUpdateChecks = BuildCheckBox("Check for MTC updates", prefs.UpdateChecksEnabled);
        var cboUpdateLane = BuildUpdateOptionComboBox(
            UpdateLaneOptions,
            AppPreferences.NormalizeUpdateLane(prefs.UpdateLane));
        var cboUpdateCadence = BuildUpdateOptionComboBox(
            UpdateCadenceOptions,
            AppPreferences.NormalizeUpdateCadence(prefs.UpdateCadence));
        var txtUpdateManifestUrl = BuildPathTextBox(
            AppPreferences.NormalizeUpdateManifestUrl(prefs.UpdateManifestUrl),
            AppPreferences.DefaultUpdateManifestUrl);
        void UpdateUpdateControlState()
        {
            bool enabled = chkUpdateChecks.IsChecked == true;
            cboUpdateLane.IsEnabled = enabled;
            cboUpdateCadence.IsEnabled = enabled;
            txtUpdateManifestUrl.IsEnabled = enabled;
        }
        chkUpdateChecks.IsCheckedChanged += (_, _) => UpdateUpdateControlState();
        UpdateUpdateControlState();

        var cboPreparedCacheLimit = BuildMemoryLimitComboBox(
            prefs.PreparedScriptCacheLimitKb,
            AppPreferences.DefaultPreparedScriptCacheLimitKb);
        var cboHotkeyPrewarmLimit = BuildMemoryLimitComboBox(
            prefs.MombotHotkeyPrewarmLimitKb,
            AppPreferences.DefaultMombotHotkeyPrewarmLimitKb);
        var txtScrollbackLines = BuildPathTextBox(
            AppPreferences.NormalizeScrollbackLines(prefs.ScrollbackLines).ToString(CultureInfo.InvariantCulture),
            AppPreferences.DefaultScrollbackLines.ToString(CultureInfo.InvariantCulture));
        txtScrollbackLines.Width = 120;
        txtScrollbackLines.HorizontalAlignment = HorizontalAlignment.Left;
        bool hasGame = gameConfig != null && !string.IsNullOrWhiteSpace(gameName);
        string initialJsonRpcToken = AppPreferences.NormalizeJsonRpcAuthToken(jsonRpcPrefs.AuthToken);
        var chkJsonRpc = BuildCheckBox("Enable JSON-RPC 2.0 server for this game", hasGame && jsonRpcPrefs.Enabled);
        var txtJsonRpcBind = BuildPathTextBox(
            AppPreferences.NormalizeJsonRpcBindAddress(jsonRpcPrefs.BindAddress),
            "127.0.0.1");
        var txtJsonRpcPort = BuildPathTextBox(
            AppPreferences.NormalizeJsonRpcPort(jsonRpcPrefs.Port).ToString(),
            "7623");
        txtJsonRpcPort.Width = 110;
        txtJsonRpcPort.HorizontalAlignment = HorizontalAlignment.Left;
        var txtJsonRpcToken = BuildPathTextBox(
            initialJsonRpcToken,
            "bearer token");
        var btnRegenerateRpcToken = new Button
        {
            Content = "Regenerate",
            Background = BgButton,
            Foreground = FgNormal,
            Margin = new Thickness(8, 0, 0, 0),
        };
        btnRegenerateRpcToken.Click += (_, _) => txtJsonRpcToken.Text = AppPreferences.GenerateJsonRpcAuthToken();
        var cboJsonRpcApproval = BuildRpcApprovalComboBox(jsonRpcPrefs.ApprovalLevel);
        Control[] jsonRpcControls =
        {
            txtJsonRpcBind,
            txtJsonRpcPort,
            txtJsonRpcToken,
            btnRegenerateRpcToken,
            cboJsonRpcApproval,
        };
        void UpdateJsonRpcControlState()
        {
            chkJsonRpc.IsEnabled = hasGame;
            bool enabled = hasGame && chkJsonRpc.IsChecked == true;
            foreach (Control control in jsonRpcControls)
                control.IsEnabled = enabled;
        }
        chkJsonRpc.IsCheckedChanged += (_, _) => UpdateJsonRpcControlState();
        UpdateJsonRpcControlState();

        chkDebug.IsCheckedChanged += (_, _) =>
        {
            bool debugEnabled = chkDebug.IsChecked == true;
            chkVerbose.IsEnabled = debugEnabled;
            chkScriptTrace.IsEnabled = debugEnabled;
            chkVariablePersistenceDebug.IsEnabled = debugEnabled;
            chkAutoRecorderDebug.IsEnabled = debugEnabled;
            chkTriggerDebug.IsEnabled = debugEnabled;
            chkDebugDatabaseChanges.IsEnabled = debugEnabled;
            if (!debugEnabled)
            {
                chkVerbose.IsChecked = false;
                chkScriptTrace.IsChecked = false;
                chkVariablePersistenceDebug.IsChecked = false;
                chkAutoRecorderDebug.IsChecked = false;
                chkTriggerDebug.IsChecked = false;
                chkDebugDatabaseChanges.IsChecked = false;
            }
        };
        chkVerbose.IsEnabled = chkDebug.IsChecked == true;
        chkScriptTrace.IsEnabled = chkDebug.IsChecked == true;
        chkVariablePersistenceDebug.IsEnabled = chkDebug.IsChecked == true;
        chkAutoRecorderDebug.IsEnabled = chkDebug.IsChecked == true;
        chkTriggerDebug.IsEnabled = chkDebug.IsChecked == true;
        chkDebugDatabaseChanges.IsEnabled = chkDebug.IsChecked == true;

        chkCreateGameLogs.IsCheckedChanged += (_, _) =>
        {
            bool gameLogsEnabled = chkCreateGameLogs.IsChecked == true;
            chkCreateAnsiGameLogs.IsEnabled = gameLogsEnabled;
            if (!gameLogsEnabled)
                chkCreateAnsiGameLogs.IsChecked = false;
        };
        chkCreateAnsiGameLogs.IsEnabled = chkCreateGameLogs.IsChecked == true;

        var storageSection = BuildSection(
            "Storage",
            "Shared folders used by the desktop client and script runtime.",
            BuildField("Program directory", programDirRow, "Base TWX program data location."),
            BuildField("Scripts directory", scriptsRow, "Live script tree used for Mombot and custom scripts."));

        var diagnosticsSection = BuildSection(
            "Diagnostics",
            string.IsNullOrWhiteSpace(gameName)
                ? "Logging controls for the currently selected game."
                : $"Logging controls for game '{gameName}'.",
            BuildCheckGroup(chkCreateGameLogs, chkCreateAnsiGameLogs),
            BuildCheckGroup(chkDebug, chkVerbose, chkScriptTrace, chkVariablePersistenceDebug, chkAutoRecorderDebug, chkTriggerDebug, chkDebugDatabaseChanges, chkDebugPortHaggle, chkDebugPlanetHaggle));

        var appDiagnosticsSection = BuildSection(
            "Application Diagnostics",
            "Global process instrumentation for MTC. Requires MTC_PERF_ENABLE_LOG=1 and should stay off during normal play.",
            BuildCheckGroup(chkPerformanceMonitoring));

        var updatesSection = BuildSection(
            "Updates",
            "Global MTC update checks. Downloads open the platform installer instead of replacing the running app.",
            BuildCheckGroup(chkUpdateChecks),
            BuildTwoColumnRow(
                BuildField("Lane", cboUpdateLane, "Beta tracks normal test builds; stable can be used for GA releases."),
                BuildField("Check cadence", cboUpdateCadence, "Manual checks are still available under About.")),
            BuildField("Manifest URL", txtUpdateManifestUrl, "JSON manifest URL. SourceForge and GitHub-hosted manifests both work."));

        var alertsSection = BuildSection(
            "Alerts",
            "Safety switches that change how aggressively MTC reacts.",
            BuildCheckGroup(chkEnableRedAlertMode));

        var runtimeSection = BuildSection(
            "Runtime",
            "Global terminal and script runtime behavior.",
            BuildCheckGroup(chkPreparedVm, chkScriptInfiniteLoopProtection, chkDisableScriptWindowStayInFront, chkVmMetrics, chkPythonScripts, chkPythonExposeRpcToken),
            BuildCheckGroup(chkStaleConnectionProbe, chkGameIdleKeepalive),
            BuildTwoColumnRow(
                BuildField(
                    "Stale probe timeout",
                    txtStaleConnectionProbeTimeout,
                    "Seconds to wait after local input before treating a silent server as stale. Default 60."),
                BuildField(
                    "Idle keepalive interval",
                    txtGameIdleKeepaliveInterval,
                    "Seconds of no client-to-server traffic before sending a telnet NOP anti-idle keepalive. Default 30.")),
            BuildField(
                "Python interpreter",
                txtPythonInterpreter,
                "Use auto to detect Python, or enter a command/full path such as py -3."),
            BuildField(
                "Scrollback lines",
                txtScrollbackLines,
                $"Global terminal scrollback retained for every game. Use 0 to disable; max {TerminalBuffer.MaximumScrollbackLines.ToString("N0", CultureInfo.InvariantCulture)}."),
            BuildMemoryLimitRow("Prepared cache retention", cboPreparedCacheLimit),
            BuildMemoryLimitRow("Mombot hotkey prewarm cap", cboHotkeyPrewarmLimit));

        var integrationsSection = BuildSection(
            "Integrations",
            hasGame
                ? $"Local JSON-RPC 2.0 access for game '{gameName}'."
                : "Open or create a game before enabling JSON-RPC access.",
            BuildCheckGroup(chkJsonRpc),
            BuildTwoColumnRow(
                BuildField("Bind address", txtJsonRpcBind, "Use 127.0.0.1 unless remote access is intentional."),
                BuildField("Port", txtJsonRpcPort, "HTTP POST and WebSocket JSON-RPC port.")),
            BuildField("Approval level", cboJsonRpcApproval, "Controls whether RPC actions are blocked, approved locally, or automated."),
            BuildField("Bearer token", BuildTokenRow(txtJsonRpcToken, btnRegenerateRpcToken), "Use Authorization: Bearer <token>, or ?token=<token> for WebSocket clients."));

        var btnSave = new Button
        {
            Content             = "Save",
            MinWidth            = 88,
            Background          = BgPrimary,
            Foreground          = FgLabel,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin              = new Thickness(0, 0, 8, 0),
        };

        var btnCancel = new Button
        {
            Content    = "Cancel",
            MinWidth   = 88,
            Background = BgButton,
            Foreground = FgNormal,
        };

        btnSave.Click += (_, _) =>
        {
            prefs.ProgramDirectory = txtProgramDir.Text?.Trim()
                ?? Core.SharedPaths.GetDefaultProgramDir();
            prefs.ScriptsDirectory = string.IsNullOrWhiteSpace(txtScripts.Text)
                ? Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(prefs.ProgramDirectory)
                : txtScripts.Text.Trim();
            debugPrefs.DebugLoggingEnabled = chkDebug.IsChecked == true;
            debugPrefs.VerboseDebugLogging = debugPrefs.DebugLoggingEnabled && chkVerbose.IsChecked == true;
            debugPrefs.ScriptTraceDebugLogging = debugPrefs.DebugLoggingEnabled && chkScriptTrace.IsChecked == true;
            debugPrefs.VariablePersistenceDebugLogging = debugPrefs.DebugLoggingEnabled && chkVariablePersistenceDebug.IsChecked == true;
            debugPrefs.AutoRecorderDebugLogging = debugPrefs.DebugLoggingEnabled && chkAutoRecorderDebug.IsChecked == true;
            debugPrefs.TriggerDebugLogging = debugPrefs.DebugLoggingEnabled && chkTriggerDebug.IsChecked == true;
            debugPrefs.DebugDatabaseChanges = debugPrefs.DebugLoggingEnabled && chkDebugDatabaseChanges.IsChecked == true;
            debugPrefs.DebugPortHaggleEnabled = chkDebugPortHaggle.IsChecked == true;
            debugPrefs.DebugPlanetHaggleEnabled = chkDebugPlanetHaggle.IsChecked == true;
            if (gameConfig != null)
            {
                gameConfig.LogEnabled = chkCreateGameLogs.IsChecked == true;
                gameConfig.LogAnsiCompanion = gameConfig.LogEnabled && chkCreateAnsiGameLogs.IsChecked == true;
                gameConfig.LogAnsi = false;
            }
            prefs.EnableRedAlertMode = chkEnableRedAlertMode.IsChecked == true;
            prefs.PreparedVmEnabled = chkPreparedVm.IsChecked == true;
            prefs.ScriptInfiniteLoopProtectionEnabled = chkScriptInfiniteLoopProtection.IsChecked == true;
            prefs.StaleConnectionProbeEnabled = chkStaleConnectionProbe.IsChecked == true;
            prefs.StaleConnectionProbeTimeoutSeconds = AppPreferences.NormalizeNetworkWatchdogSeconds(
                int.TryParse(txtStaleConnectionProbeTimeout.Text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int staleProbeTimeoutSeconds)
                    ? staleProbeTimeoutSeconds
                    : AppPreferences.DefaultLocalInputResponseTimeoutSeconds,
                AppPreferences.DefaultLocalInputResponseTimeoutSeconds);
            prefs.GameIdleKeepaliveEnabled = chkGameIdleKeepalive.IsChecked == true;
            prefs.GameIdleKeepaliveIntervalSeconds = AppPreferences.NormalizeNetworkWatchdogSeconds(
                int.TryParse(txtGameIdleKeepaliveInterval.Text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int gameIdleKeepaliveIntervalSeconds)
                    ? gameIdleKeepaliveIntervalSeconds
                    : AppPreferences.DefaultGameIdleKeepaliveIntervalSeconds,
                AppPreferences.DefaultGameIdleKeepaliveIntervalSeconds);
            prefs.DisableScriptWindowStayInFront = chkDisableScriptWindowStayInFront.IsChecked == true;
            prefs.PythonScriptsEnabled = chkPythonScripts.IsChecked == true;
            prefs.PythonInterpreterPath = AppPreferences.NormalizePythonInterpreterPath(txtPythonInterpreter.Text);
            prefs.PythonExposeJsonRpcToken = chkPythonExposeRpcToken.IsChecked == true;
            prefs.VmMetricsEnabled = chkVmMetrics.IsChecked == true;
            prefs.PerformanceMonitoringEnabled = chkPerformanceMonitoring.IsChecked == true;
            prefs.UpdateChecksEnabled = chkUpdateChecks.IsChecked == true;
            prefs.UpdateLane = GetUpdateOptionValue(cboUpdateLane, AppPreferences.UpdateLaneBeta);
            prefs.UpdateCadence = GetUpdateOptionValue(cboUpdateCadence, AppPreferences.UpdateCadenceDaily);
            prefs.UpdateManifestUrl = AppPreferences.NormalizeUpdateManifestUrl(txtUpdateManifestUrl.Text);
            prefs.PreparedScriptCacheLimitKb = GetMemoryLimitKb(
                cboPreparedCacheLimit,
                AppPreferences.DefaultPreparedScriptCacheLimitKb);
            prefs.MombotHotkeyPrewarmLimitKb = GetMemoryLimitKb(
                cboHotkeyPrewarmLimit,
                AppPreferences.DefaultMombotHotkeyPrewarmLimitKb);
            prefs.ScrollbackLines = AppPreferences.NormalizeScrollbackLines(
                int.TryParse(txtScrollbackLines.Text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int scrollbackLines)
                    ? scrollbackLines
                    : AppPreferences.DefaultScrollbackLines);
            if (hasGame)
            {
                jsonRpcPrefs.Enabled = chkJsonRpc.IsChecked == true;
                jsonRpcPrefs.BindAddress = AppPreferences.NormalizeJsonRpcBindAddress(txtJsonRpcBind.Text);
                jsonRpcPrefs.Port = AppPreferences.NormalizeJsonRpcPort(
                    int.TryParse(txtJsonRpcPort.Text, out int jsonRpcPort) ? jsonRpcPort : 7623);
                jsonRpcPrefs.AuthToken = AppPreferences.NormalizeJsonRpcAuthToken(txtJsonRpcToken.Text);
                jsonRpcPrefs.ApprovalLevel = cboJsonRpcApproval.SelectedItem is RpcApprovalOption rpcApproval
                    ? MtcRpcApprovalLevels.Normalize(rpcApproval.Value)
                    : MtcRpcApprovalLevels.ApproveActions;
            }
            prefs.Save();
            Close(true);
        };

        btnCancel.Click += (_, _) => Close(false);

        var buttons = new StackPanel
        {
            Orientation         = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin              = new Thickness(0, 4, 0, 0),
            Children            = { btnSave, btnCancel },
        };

        var tabs = new TabControl
        {
            Background = BgPanel,
            Foreground = FgNormal,
            Items =
            {
                BuildTabItem("General", storageSection, alertsSection, runtimeSection),
                BuildTabItem("Diagnostics", appDiagnosticsSection, diagnosticsSection),
                BuildTabItem("Updates", updatesSection),
                BuildTabItem("RPC", integrationsSection),
            },
        };

        Content = new Grid
        {
            Margin   = new Thickness(18),
            RowDefinitions =
            {
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = new GridLength(1, GridUnitType.Star) },
                new RowDefinition { Height = GridLength.Auto },
            },
            Children =
            {
                new StackPanel
                {
                    Spacing = 2,
                    Children =
                    {
                        new TextBlock
                        {
                            Text = "MTC Preferences",
                            Foreground = FgLabel,
                            FontSize = 22,
                            FontWeight = FontWeight.SemiBold,
                        },
                        new TextBlock
                        {
                            Text = "Tune paths, diagnostics, runtime behavior, and per-game RPC integrations.",
                            Foreground = FgMuted,
                            Margin = new Thickness(0, 0, 0, 8),
                        },
                    },
                },
                tabs,
                buttons,
            },
        };
        Grid.SetRow(tabs, 1);
        Grid.SetRow(buttons, 2);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private static TabItem BuildTabItem(string title, params Control[] sections)
    {
        var content = new StackPanel
        {
            Spacing = 12,
            Margin = new Thickness(0, 12, 8, 4),
        };
        foreach (Control section in sections)
            content.Children.Add(section);

        return new TabItem
        {
            Header = new TextBlock
            {
                Text = title,
                Foreground = FgLabel,
                FontWeight = FontWeight.SemiBold,
                Padding = new Thickness(10, 4),
            },
            Content = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                Content = content,
            },
        };
    }

    private static TextBox BuildPathTextBox(string value, string watermark)
    {
        return new TextBox
        {
            Text                = value,
            Watermark           = watermark,
            Background          = BgInput,
            Foreground          = FgNormal,
            BorderBrush         = BdInput,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
    }

    private static Button BuildBrowseButton()
    {
        return new Button
        {
            Content    = "Browse…",
            Background = BgButton,
            Foreground = FgNormal,
            Margin     = new Thickness(8, 0, 0, 0),
        };
    }

    private static Grid BuildPathInputRow(TextBox input, Button browseButton)
    {
        var row = new Grid();
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        Grid.SetColumn(input, 0);
        Grid.SetColumn(browseButton, 1);
        row.Children.Add(input);
        row.Children.Add(browseButton);
        return row;
    }

    private static CheckBox BuildCheckBox(string label, bool isChecked)
    {
        return new CheckBox
        {
            Content = label,
            IsChecked = isChecked,
            Foreground = FgNormal,
        };
    }

    private static StackPanel BuildCheckGroup(params CheckBox[] checkBoxes)
    {
        var group = new StackPanel
        {
            Spacing = 4,
        };

        foreach (var checkBox in checkBoxes)
            group.Children.Add(checkBox);

        return group;
    }

    private static Border BuildSection(string title, string description, params Control[] children)
    {
        var body = new StackPanel
        {
            Spacing = 10,
        };

        body.Children.Add(new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = new GridLength(3) },
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
            },
            Children =
            {
                new Border
                {
                    Background = Accent,
                    CornerRadius = new CornerRadius(3),
                    Margin = new Thickness(0, 2, 10, 0),
                },
                BuildSectionHeader(title, description),
            },
        });

        foreach (var child in children)
            body.Children.Add(child);

        return new Border
        {
            Background = BgSection,
            BorderBrush = BdSection,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(14),
            Child = body,
        };
    }

    private static StackPanel BuildSectionHeader(string title, string description)
    {
        var header = new StackPanel
        {
            Spacing = 2,
            Children =
            {
                new TextBlock
                {
                    Text = title,
                    Foreground = FgLabel,
                    FontSize = 15,
                    FontWeight = FontWeight.SemiBold,
                },
                new TextBlock
                {
                    Text = description,
                    Foreground = FgMuted,
                    TextWrapping = TextWrapping.Wrap,
                },
            },
        };

        Grid.SetColumn(header, 1);
        return header;
    }

    private static StackPanel BuildField(string label, Control input, string help)
    {
        return new StackPanel
        {
            Spacing = 4,
            Children =
            {
                new TextBlock
                {
                    Text = label,
                    Foreground = FgNormal,
                    FontWeight = FontWeight.SemiBold,
                },
                input,
                new TextBlock
                {
                    Text = help,
                    Foreground = FgMuted,
                    FontSize = 11,
                    TextWrapping = TextWrapping.Wrap,
                },
            },
        };
    }

    private static ComboBox BuildMemoryLimitComboBox(int selectedKb, int defaultKb)
    {
        var combo = new ComboBox
        {
            ItemsSource          = MemoryLimitOptions,
            Background           = BgInput,
            Foreground           = FgNormal,
            BorderBrush          = BdInput,
            Width                = 120,
            HorizontalAlignment  = HorizontalAlignment.Right,
        };

        combo.SelectedItem = FindMemoryLimitOption(selectedKb)
            ?? FindMemoryLimitOption(defaultKb)
            ?? MemoryLimitOptions[0];

        return combo;
    }

    private static Grid BuildMemoryLimitRow(string label, ComboBox input)
    {
        var row = new Grid
        {
            Margin = new Thickness(0, 2, 0, 0),
        };
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var lbl = new TextBlock
        {
            Text = label,
            Foreground = FgNormal,
            VerticalAlignment = VerticalAlignment.Center,
        };

        Grid.SetColumn(lbl, 0);
        Grid.SetColumn(input, 1);
        row.Children.Add(lbl);
        row.Children.Add(input);
        return row;
    }

    private static Grid BuildTwoColumnRow(Control left, Control right)
    {
        var row = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
                new ColumnDefinition { Width = new GridLength(14) },
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) },
            },
        };
        Grid.SetColumn(left, 0);
        Grid.SetColumn(right, 2);
        row.Children.Add(left);
        row.Children.Add(right);
        return row;
    }

    private static Grid BuildTokenRow(TextBox tokenBox, Button regenerateButton)
    {
        var row = new Grid();
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        Grid.SetColumn(tokenBox, 0);
        Grid.SetColumn(regenerateButton, 1);
        row.Children.Add(tokenBox);
        row.Children.Add(regenerateButton);
        return row;
    }

    private static ComboBox BuildRpcApprovalComboBox(string selectedValue)
    {
        var combo = new ComboBox
        {
            ItemsSource = RpcApprovalOptions,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            Width = 220,
            HorizontalAlignment = HorizontalAlignment.Left,
        };

        string normalized = MtcRpcApprovalLevels.Normalize(selectedValue);
        combo.SelectedItem = RpcApprovalOptions.FirstOrDefault(option =>
            string.Equals(option.Value, normalized, StringComparison.OrdinalIgnoreCase)) ?? RpcApprovalOptions[0];
        return combo;
    }

    private static ComboBox BuildUpdateOptionComboBox(UpdateOption[] options, string selectedValue)
    {
        var combo = new ComboBox
        {
            ItemsSource = options,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            MinWidth = 170,
            HorizontalAlignment = HorizontalAlignment.Left,
        };

        combo.SelectedItem = options.FirstOrDefault(option =>
            string.Equals(option.Value, selectedValue, StringComparison.OrdinalIgnoreCase)) ?? options[0];
        return combo;
    }

    private static int GetMemoryLimitKb(ComboBox combo, int defaultValue)
    {
        return combo.SelectedItem is MemoryLimitOption option
            ? option.Kilobytes
            : defaultValue;
    }

    private static string GetUpdateOptionValue(ComboBox combo, string defaultValue)
    {
        return combo.SelectedItem is UpdateOption option
            ? option.Value
            : defaultValue;
    }

    private static MemoryLimitOption? FindMemoryLimitOption(int kilobytes)
    {
        foreach (var option in MemoryLimitOptions)
        {
            if (option.Kilobytes == kilobytes)
                return option;
        }

        return null;
    }

    private sealed class MemoryLimitOption
    {
        public MemoryLimitOption(string label, int kilobytes)
        {
            Label = label;
            Kilobytes = kilobytes;
        }

        public string Label { get; }
        public int Kilobytes { get; }

        public override string ToString() => Label;
    }

    private sealed class RpcApprovalOption
    {
        public RpcApprovalOption(string label, string value)
        {
            Label = label;
            Value = value;
        }

        public string Label { get; }
        public string Value { get; }

        public override string ToString() => Label;
    }

    private sealed class UpdateOption
    {
        public UpdateOption(string label, string value)
        {
            Label = label;
            Value = value;
        }

        public string Label { get; }
        public string Value { get; }

        public override string ToString() => Label;
    }
}
