using System.Reflection;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using MTC;
using TWXProxy.Core;

string temp = Path.Combine(Path.GetTempPath(), "mtc-sector-fixture-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(temp);
AppPaths.SetConfiguredProgramDir(temp);
var prefs = new TestPreferences { ProgramDirectory = temp, ScriptsDirectory = Path.Combine(temp, "scripts"), UpdateChecksEnabled = false };
typeof(AppPreferences).GetProperty(nameof(AppPreferences.HasConfiguredSharedPaths))!.SetValue(prefs, true);
Directory.CreateDirectory(prefs.ScriptsDirectory);
AppBuilder.Configure<App>().UsePlatformDetect().WithInterFont().SetupWithoutStarting();
using var stop = new CancellationTokenSource(TimeSpan.FromSeconds(40));
Exception? failure = null;
const BindingFlags flags = BindingFlags.Instance | BindingFlags.NonPublic;
Dispatcher.UIThread.Post(async () =>
{
    MainWindow? window = null;
    using var db = new ModDatabase();
    try
    {
        window = (MainWindow)Activator.CreateInstance(typeof(MainWindow), flags, null, [prefs], null)!;
        window.Title = "Isolated MTC sector summary test";
        window.Show();
        db.CreateDatabase(Path.Combine(temp, "test.xdb"), new DataHeader { Sectors = 12000 });
        db.SaveSectorsBulk(Enumerable.Range(1, 8160).Select(n => new SectorData { Number = n, Explored = ExploreType.Yes }));
        object owner = typeof(MainWindow).GetProperty("ActiveMtcTab", flags)!.GetValue(window)!;
        owner.GetType().GetProperty("SessionDb")!.SetValue(owner, db);
        typeof(MainWindow).GetField("_sessionDb", flags)!.SetValue(window, db);
        var label = (TextBlock)typeof(MainWindow).GetField("_sectorExplorationText", flags)!.GetValue(window)!;
        typeof(MainWindow).GetMethod("RefreshSectorExplorationStatus", flags)!.Invoke(window, null);
        while (label.Text != "68% Explored") await Task.Delay(50, stop.Token);
        foreach (int width in new[] { 1600, 1100, 800 })
        {
            window.Width = width;
            window.Height = 700;
            await Task.Delay(350, stop.Token);
            var point = label.TranslatePoint(default, window)!.Value;
            Console.WriteLine($"width={width}, actual={window.Bounds.Width}, label={point} size={label.Bounds.Size}");
            if (point.X < 0 || point.X + label.Bounds.Width > window.Bounds.Width + 1)
                throw new Exception("Sector summary extends outside window");
            if (point.Y < window.Bounds.Height - 40)
                throw new Exception("Exploration percentage must be in the bottom status bar");
            var status = (TextBlock)typeof(MainWindow).GetField("_statusText", flags)!.GetValue(window)!;
            var statusPoint = status.TranslatePoint(default, window)!.Value;
            if (point.X < statusPoint.X + status.Bounds.Width)
                throw new Exception("Exploration percentage must follow the existing status text");
            using var bitmap = new RenderTargetBitmap(new PixelSize((int)window.Bounds.Width, (int)window.Bounds.Height));
            bitmap.Render(window);
            string screenshot = Path.Combine(temp, $"{width}.png");
            bitmap.Save(screenshot);
            Console.WriteLine("Screenshot: " + screenshot);
        }
        db.ResetSectors();
        while (label.Text != "0% Explored") await Task.Delay(50, stop.Token);
        owner.GetType().GetProperty("SessionDb")!.SetValue(owner, null);
        typeof(MainWindow).GetField("_sessionDb", flags)!.SetValue(window, null);
        typeof(MainWindow).GetMethod("RefreshSectorExplorationStatus", flags)!.Invoke(window, null);
        if (label.IsVisible || label.Text != "") throw new Exception("Summary leaked after removing game");
        Console.WriteLine("PASS real window: summary, resize, reset and cleared game");
    }
    catch (Exception ex) { failure = ex; }
    finally { window?.Close(); db.CloseDatabase(); stop.Cancel(); }
});
Dispatcher.UIThread.MainLoop(stop.Token);
if (failure != null) { Console.Error.WriteLine(failure); Environment.ExitCode = 1; }

sealed class TestPreferences : AppPreferences { public override void Save() { } }
