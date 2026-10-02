using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Avalonia.VisualTree;
using MTC;
using TWXProxy.Core;

string artifacts = Path.Combine(Path.GetTempPath(), "mtc-script-windows-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(artifacts);
var first = new DockedScriptWindows();
var second = new DockedScriptWindows();
var fallback = new DockedScriptWindows();
GlobalModules.ScriptWindowFactory = fallback;
string script = Path.Combine(artifacts, "windows.ts");
File.WriteAllText(script, "window report 300 250 \"Planet manager\"\nsetwindowcontents report \"Sector: 6543*Planet: #41*Status: Building\"\npause\n");
using var firstVm = Run("first", first);
using var secondVm = Run("second", second);
using var standaloneVm = Run("standalone", null);
Check(first.Snapshot().Length == 1 && second.Snapshot().Length == 1 && fallback.Snapshot().Length == 1,
    "WINDOW must resolve instance factories and preserve the standalone fallback");
var firstWindow = first.Snapshot()[0].Window;
var secondWindow = second.Snapshot()[0].Window;
firstWindow.TextContent = "FIRST TAB ONLY";
secondWindow.TextContent = "SECOND TAB ONLY";
Check(first.Snapshot()[0].Text == "FIRST TAB ONLY" && second.Snapshot()[0].Text == "SECOND TAB ONLY", "cross-tab leak");
standaloneVm.StopAll(true);
Check(fallback.Snapshot().Length == 0 && first.Snapshot().Length == 1, "script teardown crossed instances");
var extra = first.CreateWindow("report", "Ship status", 480, 300);
extra.Show();
extra.TextContent = "Ship: 41*Fighters: 25,000";
Check(first.Snapshot().Count(e => e.Active) == 1, "only one expanded window");
first.Select(firstWindow);
Check(first.Snapshot().Single(e => e.Active).Window == firstWindow, "title selection");
extra.Hide();
extra.Show();
extra.Dispose();
extra.Show();
Check(first.Snapshot().Length == 1, "disposed window resurrected");
Console.WriteLine("PASS real WINDOW/SETWINDOWCONTENTS VM routing, fallback, same-name isolation, selection, hide/show/dispose and script teardown.");

AppBuilder.Configure<App>().UsePlatformDetect().WithInterFont().SetupWithoutStarting();
using var stop = new CancellationTokenSource(TimeSpan.FromSeconds(120));
Exception? failure = null;
bool completed = false;
Dispatcher.UIThread.Post(async () =>
{
    Window? window = null;
    try
    {
        var palette = new ScriptWindowPalette(Brush.Parse("#08232d"), Brush.Parse("#16788a"),
            Brush.Parse("#063c49"), Brush.Parse("#00d4c5"), Brush.Parse("#d1e9ee"));
        foreach (bool split in new[] { false, true })
        {
            var notes = new TextBox { Text = "NOTES FOR FIRST TAB", AcceptsReturn = true, MinWidth = 0, MinHeight = 0 };
            var sidebar = new ScriptWindowSidebar(first, notes, split, 218, 1, palette);
            sidebar.SetAvailableWidth(750);
            window = new Window { Title = "Isolated MTC script window test", Width = 850, Height = 650, ShowActivated = false,
                Content = sidebar, Background = Brush.Parse("#06151c") };
            window.Show();
            await Task.Delay(150, stop.Token);
            double beforeWidth = sidebar.Width;
            var large = first.CreateWindow("large", "Resource monitor", 450, 350);
            large.Show();
            large.TextContent = "\x1b[32mResource monitor\x1b[0m*" + string.Join("*", Enumerable.Range(1, 60).Select(i => $"Planet {i,3}: Fuel 250,000  Fighters 100,000"));
            await Task.Delay(150, stop.Token);
            Check(sidebar.Width > beforeWidth, "sidebar failed to grow to requested width");
            Check(sidebar.GetVisualDescendants().OfType<SelectableTextBlock>().Single().Text!.StartsWith("Resource monitor\n"), "content format or selected content");
            var bodies = sidebar.GetVisualDescendants().OfType<SelectableTextBlock>().ToArray();
            Check(bodies.Length == 1, "multiple window bodies visible");
            var buttons = sidebar.GetVisualDescendants().OfType<Button>().Where(b => b.Content is Grid).ToArray();
            Check(buttons.Length == 2, "missing inactive title bar");
            buttons.Single(b => ((Grid)b.Content!).Children.OfType<TextBlock>().Any(t => t.Text == "Planet manager"))
                .RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
            await Task.Delay(100, stop.Token);
            Check(bodies[0].Text == "FIRST TAB ONLY", "click did not select window");
            var body = bodies[0];
            Point bodyPosition = body.TranslatePoint(default, sidebar)!.Value;
            Point notesPosition = notes.TranslatePoint(default, sidebar)!.Value;
            Check(split ? notesPosition.Y > bodyPosition.Y + body.Bounds.Height : notesPosition.X + notes.Bounds.Width <= bodyPosition.X,
                "notes overlap active script content");
            await Task.Run(() =>
            {
                for (int i = 0; i < 2000; i++) firstWindow.TextContent = "FIRST UPDATE " + i;
                secondWindow.TextContent = "SECOND UPDATED IN BACKGROUND";
            });
            await Task.Delay(100, stop.Token);
            Check(body.Text == "FIRST UPDATE 1999", "coalesced updates lost or leaked");
            Check(notes.Text == "NOTES FOR FIRST TAB", "window update changed notes");
            Save(window, split ? "split" : "beside");
            sidebar.SetAvailableWidth(330);
            window.Height = 360;
            await Task.Delay(100, stop.Token);
            Check(sidebar.Bounds.Width <= 331, "narrow sidebar overflow");
            Save(window, split ? "split-small" : "beside-small");
            var many = Enumerable.Range(0, 24).Select(i => first.CreateWindow("title" + i, "Report " + i, 240, 200)).ToArray();
            foreach (var item in many) item.Show();
            first.Select(firstWindow);
            await Task.Delay(100, stop.Token);
            Check(sidebar.GetVisualDescendants().OfType<ScrollViewer>().Any(s => s.Extent.Height > s.Viewport.Height && s.Content is StackPanel),
                "many minimized titles must scroll");
            foreach (var item in many) item.Dispose();
            // Rebind like tab activation, including an update after the old view detached.
            window.Content = new ScriptWindowSidebar(second, new TextBox { Text = "SECOND NOTES" }, split, 218, 1, palette);
            firstWindow.TextContent = "OLD TAB UPDATE";
            await Task.Delay(100, stop.Token);
            Check(window.GetVisualDescendants().OfType<SelectableTextBlock>().Single().Text == "SECOND UPDATED IN BACKGROUND", "tab rebind leak");
            window.Content = sidebar;
            await Task.Delay(100, stop.Token);
            Check(body.Text == "OLD TAB UPDATE", "returning to tab missed background content");
            large.Dispose();
            firstWindow.TextContent = "FIRST TAB ONLY";
            window.Close();
            window = null;
        }
        var bare = new ScriptWindowSidebar(first, null, true, 218, 1, palette);
        window = new Window { Content = bare, Width = 500, Height = 400, ShowActivated = false };
        window.Show();
        await Task.Delay(100, stop.Token);
        Check(bare.RowDefinitions.Count == 1 && bare.IsVisible, "hidden notes must not reserve split space");
        firstVm.StopAll(true);
        await Task.Delay(100, stop.Token);
        Check(!bare.IsVisible, "empty dock without notes must disappear");
        window.Close();
        window = null;
        Check(first.Snapshot().Length == 0 && second.Snapshot().Length == 1, "VM stop must close only its windows");
        await ShellTests.Run(artifacts);
        await WindowSizingTests.Run(artifacts);
        await DeckStackTests.Run(artifacts);
        completed = true;
        Console.WriteLine("PASS layouts, width growth/capping, title selection, burst updates, notes preservation and tab rebind. Screenshots: " + artifacts);
    }
    catch (Exception ex) { failure = ex; }
    finally { window?.Close(); stop.Cancel(); }
});
Dispatcher.UIThread.MainLoop(stop.Token);
if (!completed) { Console.Error.WriteLine(failure ?? new TimeoutException("Window test timed out")); Environment.ExitCode = 1; }

ModInterpreter Run(string name, DockedScriptWindows? host)
{
    var context = new TwxRuntimeContext(name) { ScriptWindowFactory = host };
    using var scope = GlobalModules.UseRuntimeContext(context);
    var vm = new ModInterpreter { RuntimeContext = context, ProgramDir = artifacts, ScriptDirectory = artifacts };
    vm.LoadAtLabel(script, true, string.Empty);
    return vm;
}
static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
void Save(Window window, string name)
{
    using var bitmap = new RenderTargetBitmap(new PixelSize((int)window.Bounds.Width, (int)window.Bounds.Height));
    bitmap.Render(window);
    bitmap.Save(Path.Combine(artifacts, name + ".png"));
}
