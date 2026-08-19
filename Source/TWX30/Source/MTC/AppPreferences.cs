using System.Globalization;
using System.Xml.Linq;
using Core = TWXProxy.Core;

namespace MTC;

/// <summary>
/// Lightweight application-level preferences (not per-connection).
/// Persisted in <programdir>/config.twx under the MtcPrefs section, with
/// shared program/scripts paths stored in the SharedPaths section.
/// </summary>
public class AppPreferences
{
    public const int MaxRecentFiles = 10;
    public const int CurrentCommandDeckLayoutVersion = 6;
    public const int CurrentMainWindowGeometryVersion = 1;
    public const int DefaultScrollbackLines = TerminalBuffer.DefaultScrollbackLines;
    public const int DefaultPreparedScriptCacheLimitKb = (int)(Core.GlobalModules.DefaultPreparedScriptCacheLimitBytes / 1024);
    public const int DefaultMombotHotkeyPrewarmLimitKb = (int)(Core.GlobalModules.DefaultMombotHotkeyPrewarmLimitBytes / 1024);
    public const int DefaultLocalInputResponseTimeoutSeconds = Core.GameInstance.DefaultLocalInputResponseTimeoutSeconds;
    public const int DefaultGameIdleKeepaliveIntervalSeconds = Core.GameInstance.DefaultGameIdleKeepaliveIntervalSeconds;
    public const string UpdateLaneStable = "stable";
    public const string UpdateLaneBeta = "beta";
    public const string UpdateLaneDev = "dev";
    public const string UpdateCadenceManual = "manual";
    public const string UpdateCadenceStartup = "startup";
    public const string UpdateCadenceDaily = "daily";
    public const string UpdateCadenceWeekly = "weekly";
    public const string DefaultUpdateManifestUrl = "https://sourceforge.net/projects/twx30/files/mtc-updates.json/download";

    public sealed class MacroBinding
    {
        public string Hotkey { get; set; } = string.Empty;
        public string Macro { get; set; } = string.Empty;
    }

    public sealed class DeckPanelLayout
    {
        public string PanelId { get; set; } = string.Empty;
        public double Left { get; set; }
        public double Top { get; set; }
        public double Width { get; set; }
        public double BodyHeight { get; set; }
        public int ZIndex { get; set; }
        public bool Closed { get; set; }
        public bool Minimized { get; set; }
    }

    public sealed class StatusPanelSectionPreference
    {
        public string Id { get; set; } = string.Empty;
        public bool Visible { get; set; } = true;
        public int Order { get; set; }
        public bool OnlineAutoRefreshEnabled { get; set; } = DefaultOnlineAutoRefreshEnabled;
        public int OnlineRefreshIntervalSeconds { get; set; } = DefaultOnlineRefreshIntervalSeconds;
    }

    public sealed class ProxyServerPreference
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Host { get; set; } = "127.0.0.1";
        public int ManagementPort { get; set; } = 2099;
        public string SecurityToken { get; set; } = string.Empty;

        public string DisplayName
        {
            get
            {
                string name = string.IsNullOrWhiteSpace(Name) ? "Proxy Server" : Name.Trim();
                string host = string.IsNullOrWhiteSpace(Host) ? "127.0.0.1" : Host.Trim();
                int port = NormalizeTcpPort(ManagementPort, 2099);
                return $"{name} ({host}:{port})";
            }
        }

        public override string ToString() => DisplayName;
    }

    public const string StatusPanelTrader = "trader";
    public const string StatusPanelOnline = "online";
    public const string StatusPanelHolds = "holds"; // legacy-only; folded into Ship Info
    public const string StatusPanelShipInfo = "ship";
    public const bool DefaultOnlineAutoRefreshEnabled = false;
    public const int DefaultOnlineRefreshIntervalSeconds = 60;
    public static readonly int[] OnlineRefreshIntervalSecondOptions = [30, 60, 120, 300];

    private static readonly string[] DefaultStatusPanelSectionOrder =
    [
        StatusPanelTrader,
        StatusPanelOnline,
        StatusPanelShipInfo,
    ];

    public List<string> RecentFiles { get; } = [];
    public List<MacroBinding> MacroBindings { get; } = [];
    public List<ProxyServerPreference> ProxyServers { get; } = [];
    public Dictionary<string, DeckPanelLayout> CommandDeckPanels { get; }
        = new(StringComparer.OrdinalIgnoreCase);
    public List<StatusPanelSectionPreference> StatusPanelSections { get; } = [];

    public string ProgramDirectory { get; set; } = string.Empty;
    public string ScriptsDirectory { get; set; } = string.Empty;
    public bool HasConfiguredSharedPaths { get; private set; }

    public bool DebugLoggingEnabled { get; set; }
    public bool VerboseDebugLogging { get; set; }
    public bool ScriptTraceDebugLogging { get; set; }
    public bool AutoRecorderDebugLogging { get; set; } = true;
    public bool TriggerDebugLogging { get; set; }
    public bool DebugPortHaggleEnabled { get; set; }
    public bool DebugPlanetHaggleEnabled { get; set; }
    public bool EnableRedAlertMode { get; set; } = true;
    public bool ShowHaggleDetails { get; set; }
    public bool ShowBottomBar { get; set; } = true;
    public bool ShowCommWindow { get; set; }
    public double ClassicCommWindowHeight { get; set; } = 140;
    public double DeckCommWindowHeight { get; set; } = 150;
    public bool ShowNotesPanel { get; set; }
    public double TerminalFontSize { get; set; } = TerminalControl.DefaultFontSize;
    public int ScrollbackLines { get; set; } = DefaultScrollbackLines;
    public bool PreparedVmEnabled { get; set; } = true;
    public bool ScriptInfiniteLoopProtectionEnabled { get; set; } = true;
    public bool StaleConnectionProbeEnabled { get; set; } = true;
    public int StaleConnectionProbeTimeoutSeconds { get; set; } = DefaultLocalInputResponseTimeoutSeconds;
    public bool GameIdleKeepaliveEnabled { get; set; } = true;
    public int GameIdleKeepaliveIntervalSeconds { get; set; } = DefaultGameIdleKeepaliveIntervalSeconds;
    public bool DisableScriptWindowStayInFront { get; set; }
    public bool PythonScriptsEnabled { get; set; } = true;
    public string PythonInterpreterPath { get; set; } = "auto";
    public bool PythonExposeJsonRpcToken { get; set; }
    public bool VmMetricsEnabled { get; set; }
    public bool PerformanceMonitoringEnabled { get; set; }
    public bool UpdateChecksEnabled { get; set; } = true;
    public string UpdateLane { get; set; } = UpdateLaneBeta;
    public string UpdateCadence { get; set; } = UpdateCadenceDaily;
    public string UpdateManifestUrl { get; set; } = DefaultUpdateManifestUrl;
    public DateTimeOffset? UpdateLastCheckUtc { get; set; }
    public int PreparedScriptCacheLimitKb { get; set; } = DefaultPreparedScriptCacheLimitKb;
    public int MombotHotkeyPrewarmLimitKb { get; set; } = DefaultMombotHotkeyPrewarmLimitKb;
    public string PortHaggleMode { get; set; } = TWXProxy.Core.NativeHaggleModes.Default;
    public string PlanetHaggleMode { get; set; } = TWXProxy.Core.NativeHaggleModes.DefaultPlanet;
    public bool CommandDeckSkinEnabled { get; set; }
    public int CommandDeckLayoutVersion { get; set; }
    public int MainWindowGeometryVersion { get; set; }
    public string LastNativeMombotBotName { get; set; } = string.Empty;
    public bool HasMainWindowPosition { get; private set; }
    public int MainWindowX { get; private set; }
    public int MainWindowY { get; private set; }
    public bool HasMainWindowSize { get; private set; }
    public double MainWindowWidth { get; private set; }
    public double MainWindowHeight { get; private set; }
    public string GameAgentProvider { get; set; } = "lmstudio";
    public string GameAgentLmStudioEndpoint { get; set; } = "http://127.0.0.1:1234/v1/chat/completions";
    public int GameAgentLmStudioPort { get; set; } = 1234;
    public int GameAgentOllamaPort { get; set; } = 11434;
    public string GameAgentOpenAiApiKey { get; set; } = string.Empty;
    public string GameAgentAnthropicApiKey { get; set; } = string.Empty;
    public int GameAgentContextLimitCharacters { get; set; } = 32768;
    public Dictionary<string, string> GameAgentProviderModels { get; } = new(StringComparer.OrdinalIgnoreCase);
    public bool JsonRpcEnabled { get; set; }
    public string JsonRpcBindAddress { get; set; } = "127.0.0.1";
    public int JsonRpcPort { get; set; } = 7623;
    public string JsonRpcAuthToken { get; set; } = GenerateJsonRpcAuthToken();
    public string JsonRpcApprovalLevel { get; set; } = MtcRpcApprovalLevels.ApproveActions;

    private static string LegacySharedPrefsPath()
        => Path.Combine(AppPaths.AppDataDir, "prefs.xml");

    private static string LegacyDefaultPath()
        => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".config",
            "MTC",
            "prefs.xml");

    public bool AddRecent(string path)
    {
        if (RecentFiles.Count > 0 &&
            string.Equals(RecentFiles[0], path, StringComparison.OrdinalIgnoreCase))
            return false;

        RecentFiles.RemoveAll(existing =>
            string.Equals(existing, path, StringComparison.OrdinalIgnoreCase));
        RecentFiles.Insert(0, path);
        while (RecentFiles.Count > MaxRecentFiles)
            RecentFiles.RemoveAt(RecentFiles.Count - 1);
        return true;
    }

    public bool TryGetDeckPanelLayout(string panelId, out DeckPanelLayout layout)
        => CommandDeckPanels.TryGetValue(panelId, out layout!);

    public void SetDeckPanelLayout(string panelId, double left, double top, double width, double bodyHeight, int zIndex, bool closed, bool minimized)
    {
        CommandDeckPanels[panelId] = new DeckPanelLayout
        {
            PanelId = panelId,
            Left = left,
            Top = top,
            Width = width,
            BodyHeight = bodyHeight,
            ZIndex = zIndex,
            Closed = closed,
            Minimized = minimized,
        };
    }

    public void Save()
    {
        try
        {
            EnsureStatusPanelSections();

            if (CommandDeckLayoutVersion < CurrentCommandDeckLayoutVersion)
                CommandDeckLayoutVersion = CurrentCommandDeckLayoutVersion;

            ProgramDirectory = NormalizeDirectoryValue(ProgramDirectory);
            if (string.IsNullOrWhiteSpace(ProgramDirectory))
                ProgramDirectory = Core.SharedPaths.ResolveProgramDir(ScriptsDirectory);

            ScriptsDirectory = NormalizeDirectoryValue(ScriptsDirectory);
            if (string.IsNullOrWhiteSpace(ScriptsDirectory))
                ScriptsDirectory = Core.SharedPathSettingsStore.GetDefaultScriptsDirectory(ProgramDirectory);

            ScrollbackLines = NormalizeScrollbackLines(ScrollbackLines);
            Core.SharedPathSettingsStore.Save(ProgramDirectory, ScriptsDirectory);
            string configPath = Core.SharedPaths.GetConfigFilePath(ProgramDirectory);
            var document = Core.SharedConfigFile.LoadOrCreate(configPath);

            var section = new XElement(
                Core.SharedConfigFile.MtcPrefsSectionName,
                new XElement("DebugLoggingEnabled", DebugLoggingEnabled),
                new XElement("VerboseDebugLogging", VerboseDebugLogging),
                new XElement("ScriptTraceDebugLogging", ScriptTraceDebugLogging),
                new XElement("AutoRecorderDebugLogging", AutoRecorderDebugLogging),
                new XElement("TriggerDebugLogging", TriggerDebugLogging),
                new XElement("DebugPortHaggleEnabled", DebugPortHaggleEnabled),
                new XElement("DebugPlanetHaggleEnabled", DebugPlanetHaggleEnabled),
                new XElement("EnableRedAlertMode", EnableRedAlertMode),
                new XElement("ShowHaggleDetails", ShowHaggleDetails),
                new XElement("ShowBottomBar", ShowBottomBar),
                new XElement("ShowCommWindow", ShowCommWindow),
                new XElement("ClassicCommWindowHeight", ClassicCommWindowHeight.ToString(CultureInfo.InvariantCulture)),
                new XElement("DeckCommWindowHeight", DeckCommWindowHeight.ToString(CultureInfo.InvariantCulture)),
                new XElement("ShowNotesPanel", ShowNotesPanel),
                new XElement("TerminalFontSize", TerminalFontSize.ToString(CultureInfo.InvariantCulture)),
                new XElement("ScrollbackLines", NormalizeScrollbackLines(ScrollbackLines)),
                new XElement("PreparedVmEnabled", PreparedVmEnabled),
                new XElement("ScriptInfiniteLoopProtectionEnabled", ScriptInfiniteLoopProtectionEnabled),
                new XElement("StaleConnectionProbeEnabled", StaleConnectionProbeEnabled),
                new XElement("StaleConnectionProbeTimeoutSeconds", NormalizeNetworkWatchdogSeconds(StaleConnectionProbeTimeoutSeconds, DefaultLocalInputResponseTimeoutSeconds)),
                new XElement("GameIdleKeepaliveEnabled", GameIdleKeepaliveEnabled),
                new XElement("GameIdleKeepaliveIntervalSeconds", NormalizeNetworkWatchdogSeconds(GameIdleKeepaliveIntervalSeconds, DefaultGameIdleKeepaliveIntervalSeconds)),
                new XElement("DisableScriptWindowStayInFront", DisableScriptWindowStayInFront),
                new XElement("PythonScriptsEnabled", PythonScriptsEnabled),
                new XElement("PythonInterpreterPath", NormalizePythonInterpreterPath(PythonInterpreterPath)),
                new XElement("PythonExposeJsonRpcToken", PythonExposeJsonRpcToken),
                new XElement("VmMetricsEnabled", VmMetricsEnabled),
                new XElement("PerformanceMonitoringEnabled", PerformanceMonitoringEnabled),
                new XElement("Updates",
                    new XElement("Enabled", UpdateChecksEnabled),
                    new XElement("Lane", NormalizeUpdateLane(UpdateLane)),
                    new XElement("Cadence", NormalizeUpdateCadence(UpdateCadence)),
                    new XElement("ManifestUrl", NormalizeUpdateManifestUrl(UpdateManifestUrl)),
                    UpdateLastCheckUtc.HasValue
                        ? new XElement("LastCheckUtc", UpdateLastCheckUtc.Value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture))
                        : null),
                new XElement("PreparedScriptCacheLimitKb", PreparedScriptCacheLimitKb),
                new XElement("MombotHotkeyPrewarmLimitKb", MombotHotkeyPrewarmLimitKb),
                new XElement("PortHaggleMode", PortHaggleMode),
                new XElement("PlanetHaggleMode", PlanetHaggleMode),
                new XElement("CommandDeckSkinEnabled", CommandDeckSkinEnabled),
                new XElement("CommandDeckLayoutVersion", CommandDeckLayoutVersion),
                new XElement("MainWindowGeometryVersion", MainWindowGeometryVersion),
                new XElement("LastNativeMombotBotName", LastNativeMombotBotName),
                HasMainWindowPosition || HasMainWindowSize
                    ? new XElement("MainWindowPosition",
                        HasMainWindowPosition
                            ? new XAttribute("X", MainWindowX.ToString(CultureInfo.InvariantCulture))
                            : null,
                        HasMainWindowPosition
                            ? new XAttribute("Y", MainWindowY.ToString(CultureInfo.InvariantCulture))
                            : null,
                        HasMainWindowSize
                            ? new XAttribute("Width", MainWindowWidth.ToString(CultureInfo.InvariantCulture))
                            : null,
                        HasMainWindowSize
                            ? new XAttribute("Height", MainWindowHeight.ToString(CultureInfo.InvariantCulture))
                            : null)
                    : null,
                new XElement("GameAgent",
                    new XElement("Provider", NormalizeGameAgentProvider(GameAgentProvider)),
                    new XElement("LmStudioEndpoint", NormalizeGameAgentEndpoint(GameAgentLmStudioEndpoint)),
                    new XElement("LmStudioPort", NormalizeGameAgentPort(GameAgentLmStudioPort, 1234)),
                    new XElement("OllamaPort", NormalizeGameAgentPort(GameAgentOllamaPort, 11434)),
                    new XElement("OpenAiApiKey", GameAgentOpenAiApiKey),
                    new XElement("AnthropicApiKey", GameAgentAnthropicApiKey),
                    new XElement("ContextLimitCharacters", NormalizeGameAgentContextLimit(GameAgentContextLimitCharacters)),
                    new XElement("ProviderModels",
                        GameAgentProviderModels
                            .Where(pair => !string.IsNullOrWhiteSpace(pair.Key) &&
                                           !string.IsNullOrWhiteSpace(pair.Value))
                            .OrderBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                            .Select(pair => new XElement("Model",
                                new XAttribute("Provider", NormalizeGameAgentProvider(pair.Key)),
                                pair.Value.Trim())))),
                new XElement("RecentFiles", RecentFiles.Select(path => new XElement("File", path))),
                new XElement("ProxyServers",
                    ProxyServers
                        .Where(server => !string.IsNullOrWhiteSpace(server.Host))
                        .OrderBy(server => server.Name, StringComparer.OrdinalIgnoreCase)
                        .ThenBy(server => server.Host, StringComparer.OrdinalIgnoreCase)
                        .Select(server => new XElement("Server",
                            new XAttribute("Id", string.IsNullOrWhiteSpace(server.Id) ? Guid.NewGuid().ToString() : server.Id),
                            new XAttribute("Name", server.Name ?? string.Empty),
                            new XAttribute("Host", server.Host ?? string.Empty),
                            new XAttribute("ManagementPort", NormalizeTcpPort(server.ManagementPort, 2099)),
                            new XAttribute("SecurityToken", server.SecurityToken ?? string.Empty)))),
                new XElement("Macros",
                    MacroBindings
                        .Where(binding => !string.IsNullOrWhiteSpace(binding.Hotkey) &&
                                          !string.IsNullOrWhiteSpace(binding.Macro))
                        .Select(binding => new XElement(
                            "Macro",
                            new XAttribute("Hotkey", NormalizeMacroHotkey(binding.Hotkey)),
                            binding.Macro))),
                new XElement("CommandDeckPanels",
                    CommandDeckPanels.Values
                        .OrderBy(layout => layout.PanelId, StringComparer.OrdinalIgnoreCase)
                        .Select(layout => new XElement("Panel",
                            new XAttribute("Id", layout.PanelId),
                            new XAttribute("Left", layout.Left.ToString(CultureInfo.InvariantCulture)),
                            new XAttribute("Top", layout.Top.ToString(CultureInfo.InvariantCulture)),
                            new XAttribute("Width", layout.Width.ToString(CultureInfo.InvariantCulture)),
                            new XAttribute("BodyHeight", layout.BodyHeight.ToString(CultureInfo.InvariantCulture)),
                            new XAttribute("ZIndex", layout.ZIndex),
                            new XAttribute("Closed", layout.Closed),
                            new XAttribute("Minimized", layout.Minimized)))),
                new XElement("StatusPanelSections",
                    StatusPanelSections
                        .OrderBy(section => section.Order)
                        .ThenBy(section => GetDefaultStatusPanelSectionIndex(section.Id))
                        .Select(section => new XElement("Section",
                            new XAttribute("Id", NormalizeStatusPanelSectionId(section.Id)),
                            new XAttribute("Visible", section.Visible),
                            new XAttribute("Order", section.Order),
                            string.Equals(NormalizeStatusPanelSectionId(section.Id), StatusPanelOnline, StringComparison.OrdinalIgnoreCase)
                                ? new XAttribute("OnlineAutoRefreshEnabled", section.OnlineAutoRefreshEnabled)
                                : null,
                            string.Equals(NormalizeStatusPanelSectionId(section.Id), StatusPanelOnline, StringComparison.OrdinalIgnoreCase)
                                ? new XAttribute("OnlineRefreshIntervalSeconds", NormalizeOnlineRefreshIntervalSeconds(section.OnlineRefreshIntervalSeconds))
                                : null)))
            );

            Core.SharedConfigFile.ReplaceSection(document, Core.SharedConfigFile.MtcPrefsSectionName, section);
            Core.SharedConfigFile.Save(document, configPath);
            HasConfiguredSharedPaths = true;
        }
        catch
        {
            // Best-effort persistence.
        }
    }

    public static AppPreferences Load()
    {
        var prefs = new AppPreferences();

        try
        {
            Core.SharedPathSettings sharedPaths = Core.SharedPathSettingsStore.Load();
            prefs.ProgramDirectory = NormalizeDirectoryValue(sharedPaths.ProgramDirectory);
            prefs.ScriptsDirectory = NormalizeDirectoryValue(sharedPaths.ScriptsDirectory);
            prefs.HasConfiguredSharedPaths = sharedPaths.IsConfigured;

            string configPath = Core.SharedPaths.GetConfigFilePath(prefs.ProgramDirectory);
            XDocument document;
            if (File.Exists(configPath))
            {
                document = XDocument.Load(configPath);
            }
            else
            {
                document = LoadLegacyDocument();
            }

            XElement? root = Core.SharedConfigFile.GetSection(document, Core.SharedConfigFile.MtcPrefsSectionName);
            if (root == null)
                return prefs;

            if (bool.TryParse((string?)root.Element("DebugLoggingEnabled"), out bool debugEnabled))
                prefs.DebugLoggingEnabled = debugEnabled;
            if (bool.TryParse((string?)root.Element("VerboseDebugLogging"), out bool verboseEnabled))
                prefs.VerboseDebugLogging = verboseEnabled;
            if (bool.TryParse((string?)root.Element("ScriptTraceDebugLogging"), out bool scriptTraceEnabled))
                prefs.ScriptTraceDebugLogging = scriptTraceEnabled;
            if (bool.TryParse((string?)root.Element("AutoRecorderDebugLogging"), out bool autoRecorderEnabled))
                prefs.AutoRecorderDebugLogging = autoRecorderEnabled;
            if (bool.TryParse((string?)root.Element("TriggerDebugLogging"), out bool triggerDebugEnabled))
                prefs.TriggerDebugLogging = triggerDebugEnabled;
            if (bool.TryParse((string?)root.Element("DebugPortHaggleEnabled"), out bool debugPortHaggleEnabled))
                prefs.DebugPortHaggleEnabled = debugPortHaggleEnabled;
            if (bool.TryParse((string?)root.Element("DebugPlanetHaggleEnabled"), out bool debugPlanetHaggleEnabled))
                prefs.DebugPlanetHaggleEnabled = debugPlanetHaggleEnabled;
            if (bool.TryParse((string?)root.Element("EnableRedAlertMode"), out bool enableRedAlertMode))
                prefs.EnableRedAlertMode = enableRedAlertMode;
            if (bool.TryParse((string?)root.Element("ShowHaggleDetails"), out bool showHaggleDetails))
                prefs.ShowHaggleDetails = showHaggleDetails;
            if (bool.TryParse((string?)root.Element("ShowBottomBar"), out bool showBottomBar))
                prefs.ShowBottomBar = showBottomBar;
            if (bool.TryParse((string?)root.Element("ShowCommWindow"), out bool showCommWindow))
                prefs.ShowCommWindow = showCommWindow;
            if (double.TryParse((string?)root.Element("ClassicCommWindowHeight"), NumberStyles.Float, CultureInfo.InvariantCulture, out double classicCommWindowHeight))
                prefs.ClassicCommWindowHeight = classicCommWindowHeight;
            if (double.TryParse((string?)root.Element("DeckCommWindowHeight"), NumberStyles.Float, CultureInfo.InvariantCulture, out double deckCommWindowHeight))
                prefs.DeckCommWindowHeight = deckCommWindowHeight;
            if (bool.TryParse((string?)root.Element("ShowNotesPanel"), out bool showNotesPanel))
                prefs.ShowNotesPanel = showNotesPanel;
            if (double.TryParse((string?)root.Element("TerminalFontSize"), NumberStyles.Float, CultureInfo.InvariantCulture, out double terminalFontSize))
                prefs.TerminalFontSize = NormalizeTerminalFontSize(terminalFontSize);
            if (int.TryParse((string?)root.Element("ScrollbackLines"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int scrollbackLines))
                prefs.ScrollbackLines = NormalizeScrollbackLines(scrollbackLines);
            if (bool.TryParse((string?)root.Element("PreparedVmEnabled"), out bool preparedVmEnabled))
                prefs.PreparedVmEnabled = preparedVmEnabled;
            if (bool.TryParse((string?)root.Element("ScriptInfiniteLoopProtectionEnabled"), out bool scriptInfiniteLoopProtectionEnabled))
                prefs.ScriptInfiniteLoopProtectionEnabled = scriptInfiniteLoopProtectionEnabled;
            if (bool.TryParse((string?)root.Element("StaleConnectionProbeEnabled"), out bool staleConnectionProbeEnabled))
                prefs.StaleConnectionProbeEnabled = staleConnectionProbeEnabled;
            if (int.TryParse((string?)root.Element("StaleConnectionProbeTimeoutSeconds"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int staleConnectionProbeTimeoutSeconds))
                prefs.StaleConnectionProbeTimeoutSeconds = NormalizeNetworkWatchdogSeconds(staleConnectionProbeTimeoutSeconds, DefaultLocalInputResponseTimeoutSeconds);
            if (bool.TryParse((string?)root.Element("GameIdleKeepaliveEnabled"), out bool gameIdleKeepaliveEnabled))
                prefs.GameIdleKeepaliveEnabled = gameIdleKeepaliveEnabled;
            if (int.TryParse((string?)root.Element("GameIdleKeepaliveIntervalSeconds"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int gameIdleKeepaliveIntervalSeconds))
                prefs.GameIdleKeepaliveIntervalSeconds = NormalizeNetworkWatchdogSeconds(
                    gameIdleKeepaliveIntervalSeconds == 45 ? DefaultGameIdleKeepaliveIntervalSeconds : gameIdleKeepaliveIntervalSeconds,
                    DefaultGameIdleKeepaliveIntervalSeconds);
            if (bool.TryParse((string?)root.Element("DisableScriptWindowStayInFront"), out bool disableScriptWindowStayInFront))
                prefs.DisableScriptWindowStayInFront = disableScriptWindowStayInFront;
            if (bool.TryParse((string?)root.Element("PythonScriptsEnabled"), out bool pythonScriptsEnabled))
                prefs.PythonScriptsEnabled = pythonScriptsEnabled;
            prefs.PythonInterpreterPath = NormalizePythonInterpreterPath((string?)root.Element("PythonInterpreterPath"));
            if (bool.TryParse((string?)root.Element("PythonExposeJsonRpcToken"), out bool pythonExposeJsonRpcToken))
                prefs.PythonExposeJsonRpcToken = pythonExposeJsonRpcToken;
            if (bool.TryParse((string?)root.Element("VmMetricsEnabled"), out bool vmMetricsEnabled))
                prefs.VmMetricsEnabled = vmMetricsEnabled;
            if (bool.TryParse((string?)root.Element("PerformanceMonitoringEnabled"), out bool performanceMonitoringEnabled))
                prefs.PerformanceMonitoringEnabled = performanceMonitoringEnabled;
            XElement? updates = root.Element("Updates");
            if (updates != null)
            {
                if (bool.TryParse((string?)updates.Element("Enabled"), out bool updatesEnabled))
                    prefs.UpdateChecksEnabled = updatesEnabled;
                prefs.UpdateLane = NormalizeUpdateLane((string?)updates.Element("Lane"));
                prefs.UpdateCadence = NormalizeUpdateCadence((string?)updates.Element("Cadence"));
                prefs.UpdateManifestUrl = NormalizeUpdateManifestUrl((string?)updates.Element("ManifestUrl"));
                prefs.UpdateLastCheckUtc = ParseUpdateLastCheckUtc((string?)updates.Element("LastCheckUtc"));
            }
            if (int.TryParse((string?)root.Element("PreparedScriptCacheLimitKb"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int preparedCacheLimitKb))
                prefs.PreparedScriptCacheLimitKb = NormalizeMemoryLimitKb(preparedCacheLimitKb, DefaultPreparedScriptCacheLimitKb);
            if (int.TryParse((string?)root.Element("MombotHotkeyPrewarmLimitKb"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int hotkeyPrewarmLimitKb))
                prefs.MombotHotkeyPrewarmLimitKb = NormalizeMemoryLimitKb(hotkeyPrewarmLimitKb, DefaultMombotHotkeyPrewarmLimitKb);
            if (bool.TryParse((string?)root.Element("CommandDeckSkinEnabled"), out bool commandDeckEnabled))
                prefs.CommandDeckSkinEnabled = commandDeckEnabled;
            if (int.TryParse((string?)root.Element("CommandDeckLayoutVersion"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int commandDeckLayoutVersion))
                prefs.CommandDeckLayoutVersion = commandDeckLayoutVersion;
            if (int.TryParse((string?)root.Element("MainWindowGeometryVersion"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int mainWindowGeometryVersion))
                prefs.MainWindowGeometryVersion = mainWindowGeometryVersion;
            prefs.LastNativeMombotBotName = ((string?)root.Element("LastNativeMombotBotName") ?? string.Empty).Trim();
            XElement? mainWindowPosition = root.Element("MainWindowPosition");
            if (mainWindowPosition != null)
            {
                if (int.TryParse((string?)mainWindowPosition.Attribute("X"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int mainWindowX) &&
                    int.TryParse((string?)mainWindowPosition.Attribute("Y"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int mainWindowY))
                {
                    prefs.SetMainWindowPosition(mainWindowX, mainWindowY);
                }

                if (double.TryParse((string?)mainWindowPosition.Attribute("Width"), NumberStyles.Float, CultureInfo.InvariantCulture, out double mainWindowWidth) &&
                    double.TryParse((string?)mainWindowPosition.Attribute("Height"), NumberStyles.Float, CultureInfo.InvariantCulture, out double mainWindowHeight))
                {
                    prefs.SetMainWindowSize(mainWindowWidth, mainWindowHeight);
                }
            }

            XElement? gameAgent = root.Element("GameAgent");
            if (gameAgent != null)
            {
                prefs.GameAgentProvider = NormalizeGameAgentProvider((string?)gameAgent.Element("Provider"));
                prefs.GameAgentLmStudioEndpoint = NormalizeGameAgentEndpoint((string?)gameAgent.Element("LmStudioEndpoint"));
                if (int.TryParse((string?)gameAgent.Element("LmStudioPort"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int lmStudioPort))
                    prefs.GameAgentLmStudioPort = NormalizeGameAgentPort(lmStudioPort, 1234);
                if (int.TryParse((string?)gameAgent.Element("OllamaPort"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int ollamaPort))
                    prefs.GameAgentOllamaPort = NormalizeGameAgentPort(ollamaPort, 11434);
                prefs.GameAgentOpenAiApiKey = ((string?)gameAgent.Element("OpenAiApiKey") ?? string.Empty).Trim();
                prefs.GameAgentAnthropicApiKey = ((string?)gameAgent.Element("AnthropicApiKey") ?? string.Empty).Trim();
                if (int.TryParse((string?)gameAgent.Element("ContextLimitCharacters"), NumberStyles.Integer, CultureInfo.InvariantCulture, out int contextLimit))
                    prefs.GameAgentContextLimitCharacters = NormalizeGameAgentContextLimit(contextLimit);

                foreach (XElement model in gameAgent.Element("ProviderModels")?.Elements("Model") ?? Enumerable.Empty<XElement>())
                {
                    string provider = NormalizeGameAgentProvider((string?)model.Attribute("Provider"));
                    string value = ((string?)model ?? string.Empty).Trim();
                    if (!string.IsNullOrWhiteSpace(value))
                        prefs.GameAgentProviderModels[provider] = value;
                }
            }

            string? portHaggleMode = (string?)root.Element("PortHaggleMode");
            string? planetHaggleMode = (string?)root.Element("PlanetHaggleMode");
            string? legacyNativeHaggleMode = (string?)root.Element("NativeHaggleMode");
            prefs.PortHaggleMode = TWXProxy.Core.NativeHaggleModes.Normalize(
                string.IsNullOrWhiteSpace(portHaggleMode) ? legacyNativeHaggleMode : portHaggleMode);
            prefs.PlanetHaggleMode = string.IsNullOrWhiteSpace(planetHaggleMode)
                ? TWXProxy.Core.NativeHaggleModes.DefaultPlanet
                : TWXProxy.Core.NativeHaggleModes.Normalize(planetHaggleMode);

            foreach (XElement element in root.Element("RecentFiles")?.Elements("File")
                                   ?? Enumerable.Empty<XElement>())
            {
                string? path = ResolveRecentFilePath((string?)element, prefs.ProgramDirectory);
                if (!string.IsNullOrWhiteSpace(path))
                    prefs.RecentFiles.Add(path);
            }

            foreach (XElement server in root.Element("ProxyServers")?.Elements("Server")
                                      ?? Enumerable.Empty<XElement>())
            {
                string host = ((string?)server.Attribute("Host") ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(host))
                    continue;

                prefs.ProxyServers.Add(new ProxyServerPreference
                {
                    Id = string.IsNullOrWhiteSpace((string?)server.Attribute("Id"))
                        ? Guid.NewGuid().ToString()
                        : ((string?)server.Attribute("Id") ?? string.Empty).Trim(),
                    Name = ((string?)server.Attribute("Name") ?? string.Empty).Trim(),
                    Host = host,
                    ManagementPort = NormalizeTcpPort(ParseInt(server.Attribute("ManagementPort"), 2099), 2099),
                    SecurityToken = ((string?)server.Attribute("SecurityToken") ?? string.Empty).Trim(),
                });
            }

            foreach (XElement element in root.Element("Macros")?.Elements("Macro")
                                   ?? Enumerable.Empty<XElement>())
            {
                string hotkey = NormalizeMacroHotkey((string?)element.Attribute("Hotkey"));
                string macro = (string?)element ?? string.Empty;
                if (string.IsNullOrWhiteSpace(macro))
                    continue;

                prefs.MacroBindings.Add(new MacroBinding
                {
                    Hotkey = hotkey,
                    Macro = macro,
                });
            }

            foreach (XElement panel in root.Element("CommandDeckPanels")?.Elements("Panel")
                                   ?? Enumerable.Empty<XElement>())
            {
                string? panelId = (string?)panel.Attribute("Id");
                if (string.IsNullOrWhiteSpace(panelId))
                    continue;

                prefs.CommandDeckPanels[panelId] = new DeckPanelLayout
                {
                    PanelId = panelId,
                    Left = ParseDouble(panel.Attribute("Left")),
                    Top = ParseDouble(panel.Attribute("Top")),
                    Width = ParseDouble(panel.Attribute("Width")),
                    BodyHeight = ParseDouble(panel.Attribute("BodyHeight")),
                    ZIndex = ParseInt(panel.Attribute("ZIndex")),
                    Closed = ParseBool(panel.Attribute("Closed")),
                    Minimized = ParseBool(panel.Attribute("Minimized")),
                };
            }

            foreach (XElement section in root.Element("StatusPanelSections")?.Elements("Section")
                                      ?? Enumerable.Empty<XElement>())
            {
                string id = NormalizeStatusPanelSectionId((string?)section.Attribute("Id"));
                if (string.IsNullOrWhiteSpace(id))
                    continue;

                prefs.StatusPanelSections.Add(new StatusPanelSectionPreference
                {
                    Id = id,
                    Visible = ParseBool(section.Attribute("Visible"), defaultValue: true),
                    Order = ParseInt(section.Attribute("Order")),
                    OnlineAutoRefreshEnabled = string.Equals(id, StatusPanelOnline, StringComparison.OrdinalIgnoreCase) &&
                        ParseBool(section.Attribute("OnlineAutoRefreshEnabled"), DefaultOnlineAutoRefreshEnabled),
                    OnlineRefreshIntervalSeconds = NormalizeOnlineRefreshIntervalSeconds(
                        ParseInt(section.Attribute("OnlineRefreshIntervalSeconds"), DefaultOnlineRefreshIntervalSeconds)),
                });
            }

            prefs.EnsureStatusPanelSections();

            string? legacyScriptsDirectory = NormalizeDirectoryValue((string?)root.Element("ScriptsDirectory"));
            if (!string.IsNullOrWhiteSpace(legacyScriptsDirectory) &&
                !prefs.HasConfiguredSharedPaths)
            {
                prefs.ScriptsDirectory = legacyScriptsDirectory;
                prefs.ProgramDirectory = Core.SharedPaths.ResolveProgramDir(legacyScriptsDirectory);
                prefs.HasConfiguredSharedPaths = true;
            }
        }
        catch
        {
            // Ignore corrupt prefs.
        }

        return prefs;
    }

    public bool SetMainWindowPosition(int x, int y)
    {
        if (HasMainWindowPosition && MainWindowX == x && MainWindowY == y)
            return false;

        HasMainWindowPosition = true;
        MainWindowX = x;
        MainWindowY = y;
        return true;
    }

    public bool SetMainWindowSize(double width, double height)
    {
        if (width < 400 || height < 300 || double.IsNaN(width) || double.IsNaN(height) ||
            double.IsInfinity(width) || double.IsInfinity(height))
        {
            return false;
        }

        if (HasMainWindowSize &&
            Math.Abs(MainWindowWidth - width) < 0.5 &&
            Math.Abs(MainWindowHeight - height) < 0.5)
        {
            return false;
        }

        HasMainWindowSize = true;
        MainWindowWidth = width;
        MainWindowHeight = height;
        return true;
    }

    public IReadOnlyList<StatusPanelSectionPreference> GetOrderedStatusPanelSections()
    {
        EnsureStatusPanelSections();
        return StatusPanelSections
            .OrderBy(section => section.Order)
            .ThenBy(section => GetDefaultStatusPanelSectionIndex(section.Id))
            .Select(section => new StatusPanelSectionPreference
            {
                Id = section.Id,
                Visible = section.Visible,
                Order = section.Order,
                OnlineAutoRefreshEnabled = section.OnlineAutoRefreshEnabled,
                OnlineRefreshIntervalSeconds = NormalizeOnlineRefreshIntervalSeconds(section.OnlineRefreshIntervalSeconds),
            })
            .ToList();
    }

    public void SetStatusPanelSections(IEnumerable<StatusPanelSectionPreference> sections)
    {
        StatusPanelSections.Clear();

        int order = 0;
        foreach (StatusPanelSectionPreference section in sections ?? Enumerable.Empty<StatusPanelSectionPreference>())
        {
            string normalizedId = NormalizeStatusPanelSectionId(section.Id);
            if (string.IsNullOrWhiteSpace(normalizedId) ||
                string.Equals(normalizedId, StatusPanelHolds, StringComparison.OrdinalIgnoreCase))
                continue;

            if (StatusPanelSections.Any(existing => string.Equals(existing.Id, normalizedId, StringComparison.OrdinalIgnoreCase)))
                continue;

            StatusPanelSections.Add(new StatusPanelSectionPreference
            {
                Id = normalizedId,
                Visible = section.Visible,
                Order = order++,
                OnlineAutoRefreshEnabled = string.Equals(normalizedId, StatusPanelOnline, StringComparison.OrdinalIgnoreCase) &&
                    section.OnlineAutoRefreshEnabled,
                OnlineRefreshIntervalSeconds = NormalizeOnlineRefreshIntervalSeconds(section.OnlineRefreshIntervalSeconds),
            });
        }

        EnsureStatusPanelSections();
    }

    public static string GetStatusPanelSectionLabel(string id)
        => NormalizeStatusPanelSectionId(id) switch
        {
            StatusPanelTrader => "Trader",
            StatusPanelOnline => "Online",
            StatusPanelHolds => "Holds",
            StatusPanelShipInfo => "Ship Info",
            _ => id,
        };

    private static XDocument LoadLegacyDocument()
    {
        foreach (string legacyPath in new[] { LegacySharedPrefsPath(), LegacyDefaultPath() })
        {
            try
            {
                if (File.Exists(legacyPath))
                    return XDocument.Load(legacyPath);
            }
            catch
            {
            }
        }

        return Core.SharedConfigFile.CreateEmptyDocument();
    }

    public static int NormalizeMemoryLimitKb(int value, int defaultValue)
        => value > 0 ? value : defaultValue;

    public static int NormalizeTcpPort(int value, int defaultValue)
        => value is >= 1 and <= 65535 ? value : defaultValue;

    public static int NormalizeNetworkWatchdogSeconds(int value, int defaultValue)
        => value is >= 5 and <= 600 ? value : defaultValue;

    public static int NormalizeOnlineRefreshIntervalSeconds(int value)
        => OnlineRefreshIntervalSecondOptions.Contains(value)
            ? value
            : DefaultOnlineRefreshIntervalSeconds;

    public static double NormalizeTerminalFontSize(double value)
        => double.IsNaN(value) || double.IsInfinity(value)
            ? TerminalControl.DefaultFontSize
            : Math.Clamp(value, 8.0, 40.0);

    public static int NormalizeScrollbackLines(int value)
        => TerminalBuffer.NormalizeScrollbackLines(value);

    public static string NormalizeGameAgentProvider(string? value)
    {
        string provider = (value ?? string.Empty).Trim().ToLowerInvariant();
        return provider switch
        {
            "local" => "local",
            "local-observer" => "local",
            "ollama" => "ollama",
            "openai" => "openai",
            "anthropic" => "anthropic",
            "lmstudio" => "lmstudio",
            "lm-studio" => "lmstudio",
            _ => "lmstudio",
        };
    }

    public static string NormalizeGameAgentEndpoint(string? value)
        => string.IsNullOrWhiteSpace(value)
            ? "http://127.0.0.1:1234/v1/chat/completions"
            : value.Trim();

    public static int NormalizeGameAgentContextLimit(int value)
    {
        const int min = 16384;
        const int max = 262144;
        const int step = 16384;
        if (value < min || value > max)
            return min;
        int offset = value - min;
        return min + (offset / step * step);
    }

    public static int NormalizeGameAgentPort(int value, int defaultValue)
        => value >= 1 && value <= 65535 ? value : defaultValue;

    public static int NormalizeJsonRpcPort(int value)
        => value is >= 1024 and <= 65535 ? value : 7623;

    public static string NormalizeJsonRpcBindAddress(string? value)
    {
        string normalized = (value ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(normalized) ? "127.0.0.1" : normalized;
    }

    public static string NormalizeJsonRpcAuthToken(string? value)
    {
        string normalized = (value ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(normalized) ? GenerateJsonRpcAuthToken() : normalized;
    }

    public static string NormalizePythonInterpreterPath(string? value)
    {
        string normalized = (value ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(normalized) ? "auto" : normalized;
    }

    public static string NormalizeUpdateLane(string? value)
    {
        string normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        return normalized switch
        {
            UpdateLaneStable => UpdateLaneStable,
            UpdateLaneBeta => UpdateLaneBeta,
            UpdateLaneDev => UpdateLaneDev,
            _ => UpdateLaneBeta,
        };
    }

    public static string NormalizeUpdateCadence(string? value)
    {
        string normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        return normalized switch
        {
            UpdateCadenceManual => UpdateCadenceManual,
            UpdateCadenceStartup => UpdateCadenceStartup,
            UpdateCadenceDaily => UpdateCadenceDaily,
            UpdateCadenceWeekly => UpdateCadenceWeekly,
            _ => UpdateCadenceDaily,
        };
    }

    public static string NormalizeUpdateManifestUrl(string? value)
    {
        string normalized = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            return DefaultUpdateManifestUrl;

        return normalized.Replace(
            "sourceforge.net/projects/TWX30/",
            "sourceforge.net/projects/twx30/",
            StringComparison.OrdinalIgnoreCase);
    }

    public static DateTimeOffset? ParseUpdateLastCheckUtc(string? value)
    {
        if (DateTimeOffset.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out DateTimeOffset parsed))
        {
            return parsed.ToUniversalTime();
        }

        return null;
    }

    public void EnsureJsonRpcAuthToken()
    {
        JsonRpcAuthToken = NormalizeJsonRpcAuthToken(JsonRpcAuthToken);
    }

    public static string GenerateJsonRpcAuthToken()
        => Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLowerInvariant() +
           Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLowerInvariant();

    private static string? ResolveRecentFilePath(string? path, string programDirectory)
    {
        if (string.IsNullOrWhiteSpace(path))
            return null;

        string normalized = NormalizeDirectoryValue(path);
        if (File.Exists(normalized))
            return normalized;

        string gamesDir = Path.Combine(programDirectory, "games");
        string candidate = Path.Combine(gamesDir, Path.GetFileName(normalized));
        if (File.Exists(candidate))
            return candidate;

        string legacyCandidate = Path.Combine(Core.SharedPaths.LegacyGamesDir, Path.GetFileName(normalized));
        return File.Exists(legacyCandidate) ? legacyCandidate : null;
    }

    private static string NormalizeDirectoryValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        try
        {
            return Path.GetFullPath(value.Trim())
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }
        catch
        {
            return value.Trim();
        }
    }

    private static string NormalizeMacroHotkey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "F1";

        string normalized = value.Trim().ToUpperInvariant();
        return normalized is "F1" or "F2" or "F3" or "F4" or "F5" or "F6" or "F7" or "F8" or "F9" or "F10" or "F11"
            ? normalized
            : "F1";
    }

    private void EnsureStatusPanelSections()
    {
        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var normalizedSections = new List<StatusPanelSectionPreference>();
        bool legacyHoldsVisible = false;

        foreach (StatusPanelSectionPreference section in StatusPanelSections)
        {
            string normalizedId = NormalizeStatusPanelSectionId(section.Id);
            if (string.IsNullOrWhiteSpace(normalizedId) || !seenIds.Add(normalizedId))
                continue;

            if (string.Equals(normalizedId, StatusPanelHolds, StringComparison.OrdinalIgnoreCase))
            {
                legacyHoldsVisible |= section.Visible;
                seenIds.Remove(normalizedId);
                continue;
            }

            normalizedSections.Add(new StatusPanelSectionPreference
            {
                Id = normalizedId,
                Visible = section.Visible,
                Order = section.Order,
                OnlineAutoRefreshEnabled = string.Equals(normalizedId, StatusPanelOnline, StringComparison.OrdinalIgnoreCase) &&
                    section.OnlineAutoRefreshEnabled,
                OnlineRefreshIntervalSeconds = NormalizeOnlineRefreshIntervalSeconds(section.OnlineRefreshIntervalSeconds),
            });
        }

        StatusPanelSectionPreference? shipSection = normalizedSections.FirstOrDefault(section =>
            string.Equals(section.Id, StatusPanelShipInfo, StringComparison.OrdinalIgnoreCase));
        if (shipSection != null && legacyHoldsVisible)
            shipSection.Visible = true;

        foreach (string defaultId in DefaultStatusPanelSectionOrder)
        {
            if (seenIds.Add(defaultId))
            {
                normalizedSections.Add(new StatusPanelSectionPreference
                {
                    Id = defaultId,
                    Visible = true,
                    Order = int.MaxValue,
                    OnlineAutoRefreshEnabled = DefaultOnlineAutoRefreshEnabled,
                    OnlineRefreshIntervalSeconds = DefaultOnlineRefreshIntervalSeconds,
                });
            }
        }

        StatusPanelSections.Clear();
        int order = 0;
        foreach (StatusPanelSectionPreference section in normalizedSections
                     .OrderBy(section => section.Order)
                     .ThenBy(section => GetDefaultStatusPanelSectionIndex(section.Id)))
        {
            section.Order = order++;
            StatusPanelSections.Add(section);
        }
    }

    private static string NormalizeStatusPanelSectionId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string normalized = value.Trim().ToLowerInvariant();
        return normalized switch
        {
            StatusPanelTrader => StatusPanelTrader,
            StatusPanelOnline => StatusPanelOnline,
            StatusPanelHolds => StatusPanelHolds,
            StatusPanelShipInfo => StatusPanelShipInfo,
            _ => string.Empty,
        };
    }

    private static int GetDefaultStatusPanelSectionIndex(string? id)
    {
        string normalizedId = NormalizeStatusPanelSectionId(id);
        int index = Array.IndexOf(DefaultStatusPanelSectionOrder, normalizedId);
        return index >= 0 ? index : int.MaxValue;
    }

    private static double ParseDouble(XAttribute? attribute)
        => double.TryParse(attribute?.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out double value)
            ? value
            : 0;

    private static int ParseInt(XAttribute? attribute)
        => int.TryParse(attribute?.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int value)
            ? value
            : 0;

    private static int ParseInt(XAttribute? attribute, int defaultValue)
        => int.TryParse(attribute?.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int value)
            ? value
            : defaultValue;

    private static bool ParseBool(XAttribute? attribute)
        => bool.TryParse(attribute?.Value, out bool value) && value;

    private static bool ParseBool(XAttribute? attribute, bool defaultValue)
        => attribute == null
            ? defaultValue
            : bool.TryParse(attribute.Value, out bool value)
                ? value
                : defaultValue;
}
