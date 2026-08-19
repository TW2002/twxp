using Avalonia;
using TWXProxy.Core;

if (MTC.UnixAutoDetach.TryRelaunchDetached(args))
    return;

// MTC is a GUI application — suppress all Console output so diagnostic
// Console.WriteLine calls in Core do not leak to the terminal.
Console.SetOut(TextWriter.Null);

var prefs = MTC.AppPreferences.Load();
MTC.AppPaths.SetConfiguredProgramDir(prefs.ProgramDirectory);
GlobalModules.ProgramDir = MTC.AppPaths.ProgramDir;
GlobalModules.PreferPreparedVm = prefs.PreparedVmEnabled;
GlobalModules.EnableVmMetrics = prefs.VmMetricsEnabled;
MTC.AppPaths.EnsureDebugLogDir();
var defaultDebug = new MTC.EmbeddedMtcDebugConfig();
GlobalModules.ConfigureDebugLogging(
    MTC.AppPaths.GetDebugLogPath(),
    defaultDebug.DebugLoggingEnabled,
    defaultDebug.VerboseDebugLogging,
    defaultDebug.TriggerDebugLogging,
    defaultDebug.ScriptTraceDebugLogging,
    defaultDebug.AutoRecorderDebugLogging,
    defaultDebug.VariablePersistenceDebugLogging);
GlobalModules.ConfigureHaggleDebugLogging(
    MTC.AppPaths.GetPortHaggleDebugLogPath(),
    defaultDebug.DebugPortHaggleEnabled,
    MTC.AppPaths.GetPlanetHaggleDebugLogPath(),
    defaultDebug.DebugPlanetHaggleEnabled);
GlobalModules.ConfigureDatabaseCorrectionLogging(
    MTC.AppPaths.GetDatabaseCorrectionLogPath(),
    defaultDebug.DebugLoggingEnabled && defaultDebug.DebugDatabaseChanges);

AppDomain.CurrentDomain.UnhandledException += (_, e) =>
{
    try
    {
        GlobalModules.DebugLog($"[UnhandledException] {e.ExceptionObject}\n");
    }
    catch
    {
    }
};

TaskScheduler.UnobservedTaskException += (_, e) =>
{
    try
    {
        GlobalModules.DebugLog($"[UnobservedTaskException] {e.Exception}\n");
    }
    catch
    {
    }
};

AppBuilder.Configure<MTC.App>()
    .UsePlatformDetect()
    .WithInterFont()
    .LogToTrace()
    .StartWithClassicDesktopLifetime(args);
