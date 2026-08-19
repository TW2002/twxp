using Avalonia;
using TWXProxy.Core;
using TWXP;

if (args.Any(arg => string.Equals(arg, "-d", StringComparison.OrdinalIgnoreCase)))
{
    await TWXP.Headless.HeadlessProxyHost.RunAsync(args);
    return;
}

Console.SetOut(TextWriter.Null);

AppPaths.EnsureDirectories();
GlobalModules.ProgramDir = AppPaths.ProgramDir;
GlobalModules.DebugLogPath = Path.Combine(AppPaths.LogsDir, "twxp_debug.log");
GlobalModules.ConfigureDatabaseCorrectionLogging(Path.Combine(AppPaths.LogsDir, "twxp_db_errors.log"), false);
GlobalModules.InitializeDebugLog();

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

AppBuilder.Configure<App>()
    .UsePlatformDetect()
    .WithInterFont()
    .LogToTrace()
    .StartWithClassicDesktopLifetime(args);
