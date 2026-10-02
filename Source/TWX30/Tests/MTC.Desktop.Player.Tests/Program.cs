using Avalonia;
using Avalonia.Threading;
using MTC;

// Separate process with ephemeral preferences; never load or save user prefs.
string temporary = Path.Combine(Path.GetTempPath(), "mtc-desktop-player-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(temporary);
AppPaths.SetConfiguredProgramDir(temporary);
var preferences = new EphemeralPreferences
{
    ProgramDirectory = temporary,
    ScriptsDirectory = Path.Combine(temporary, "scripts"),
    UpdateChecksEnabled = false,
};
typeof(AppPreferences).GetProperty(nameof(AppPreferences.HasConfiguredSharedPaths))!.SetValue(preferences, true);
Directory.CreateDirectory(preferences.ScriptsDirectory);
AppBuilder.Configure<App>().UsePlatformDetect().WithInterFont().SetupWithoutStarting();
using var stop = new CancellationTokenSource();
Exception? failure = null;
Dispatcher.UIThread.Post(async () =>
{
    MainWindow? window = null;
    try
    {
        window = new MainWindow(preferences) { Title = "Isolated TradeWars model test" };
        window.Show();
        await Dispatcher.UIThread.InvokeAsync(() => { }, DispatcherPriority.Background);
        if (!window.IsVisible) throw new Exception("Test window was not shown");
        Console.WriteLine("PASS: real MTC window initialized with isolated, non-persistent preferences");
        if (args.Contains("--deck"))
            await CommandDeckTests.Run(window);
        else
            await DesktopGame.Run(window, temporary);
    }
    catch (Exception error) { failure = error; }
    finally { window?.Close(); stop.Cancel(); }
});
Dispatcher.UIThread.MainLoop(stop.Token);
if (failure != null) { Console.Error.WriteLine(failure); Environment.ExitCode = 1; }
try { Directory.Delete(temporary, recursive: true); } catch (IOException) { }

sealed class EphemeralPreferences : AppPreferences
{
    public override void Save() { }
}
