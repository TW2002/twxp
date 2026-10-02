using System.Collections;
using System.Reflection;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Media.Imaging;
using Avalonia.VisualTree;
using MTC;

internal static class CommandDeckTests
{
    private const BindingFlags Private = BindingFlags.Instance | BindingFlags.NonPublic;
    private static object? Call(MainWindow window, string name, params object[] args)
        => typeof(MainWindow).GetMethod(name, Private)!.Invoke(window, args);
    private static T Field<T>(MainWindow window, string name)
        => (T)typeof(MainWindow).GetField(name, Private)!.GetValue(window)!;

    public static async Task Run(MainWindow window)
    {
        window.Width = 1000;
        window.Height = 700;
        await Task.Delay(250);
        double width = window.Bounds.Width, height = window.Bounds.Height;
        PixelPoint position = window.Position;
        for (int index = 0; index < 3; index++)
            Call(window, "CreateStagedMtcTab");

        var inputs = new Dictionary<int, string>();
        foreach (object tab in Field<IEnumerable>(window, "_mtcTabs"))
        {
            Type type = tab.GetType();
            int id = (int)type.GetProperty("Id")!.GetValue(tab)!;
            type.GetProperty("Title")!.SetValue(tab, $"Test game {id}");
            var state = (GameState)type.GetProperty("State")!.GetValue(tab)!;
            state.GameName = $"deck_test_{id}";
            type.GetProperty("TerminalInputHandler")!.SetValue(tab, (Action<byte[]>)(bytes => inputs[id] = System.Text.Encoding.ASCII.GetString(bytes)));
            var buffer = (TerminalBuffer)type.GetProperty("Buffer")!.GetValue(tab)!;
            var parser = new AnsiParser(buffer);
            parser.Feed($"\x1b[1;36mTest game {id}\r\n\x1b[32mSector  : {id * 100}\r\n\x1b[35mCommand [TL=00:00:00]:[{id * 100}] (?=Help)? :");
        }

        Call(window, "SetSkin", true);
        await Task.Delay(900);
        if (window.WindowState != WindowState.Normal)
            throw new Exception("Deck must remain a normal window");
        var screen = window.Screens.ScreenFromWindow(window)!;
        var host = Field<Grid>(window, "_deckWorkspaceHost");
        double requiredWidth = Field<double>(window, "_deckWorkspaceMinimumWidth") + window.Bounds.Width - host.Bounds.Width;
        double expectedWidth = Math.Min(requiredWidth, screen.WorkingArea.Width / screen.Scaling - 24);
        if (Math.Abs(window.Bounds.Width - expectedWidth) > 3)
            throw new Exception($"Deck did not size to its normal-size grid: actual={window.Bounds.Width}, expected={expectedWidth}");

        void CheckTiles(int total, int visible)
        {
            var consoles = Field<Dictionary<int, CommandDeckConsole>>(window, "_commandDeckConsoles");
            if (consoles.Count != total || consoles.Values.Count(console => console.IsVisible) != visible)
                throw new Exception($"Expected {total} consoles with {visible} visible, got {consoles.Count} with {consoles.Values.Count(console => console.IsVisible)} visible");
            var shown = consoles.Values.Where(console => console.IsVisible).ToArray();
            foreach (var panel in shown)
            {
                if (!panel.IsEffectivelyVisible) throw new Exception("Console is not visible");
                Point topLeft = panel.TranslatePoint(default, window)!.Value;
                var bounds = new Rect(topLeft, panel.Bounds.Size);
                foreach (var other in shown.Where(other => other != panel))
                {
                    Point otherTopLeft = other.TranslatePoint(default, window)!.Value;
                    if (bounds.Intersects(new Rect(otherTopLeft, other.Bounds.Size)))
                        throw new Exception("Overlapping deck consoles");
                }
                Point bottomRight = panel.TranslatePoint(new Point(panel.Bounds.Width, panel.Bounds.Height), window)!.Value;
                if (topLeft.X < 0 || topLeft.Y < 0 || bottomRight.X > window.Bounds.Width || bottomRight.Y > window.Bounds.Height)
                    throw new Exception($"Console outside window: {topLeft} {bottomRight}");
            }
        }
        CheckTiles(4, 4);
        var terminals = Field<Dictionary<int, TerminalControl>>(window, "_deckTerminalControls");
        int firstId = terminals.Keys.First();
        terminals[firstId].SendInput!(System.Text.Encoding.ASCII.GetBytes("test"));
        await Task.Delay(150);
        if (Field<int>(window, "_activeMtcTabId") != firstId || inputs.GetValueOrDefault(firstId) != "test")
            throw new Exception("Tile input did not target its owning tab");
        CheckTiles(4, 4);
        string screenshot = Path.Combine(Path.GetTempPath(), "mtc-command-deck-four-tabs.png");
        using (var bitmap = new RenderTargetBitmap(new PixelSize((int)window.Bounds.Width, (int)window.Bounds.Height)))
        {
            bitmap.Render(window);
            bitmap.Save(screenshot);
        }
        Call(window, "CreateStagedMtcTab");
        await Task.Delay(350);
        CheckTiles(5, 1);
        int added = Field<int>(window, "_activeMtcTabId");
        await (Task)Call(window, "CloseMtcTabAsync", added)!;
        await Task.Delay(350);
        CheckTiles(4, 4);
        window.Width = 1200;
        window.Height = 800;
        await Task.Delay(350);
        CheckTiles(4, 4);
        Call(window, "SizeWindowForCommandDeck");
        await Task.Delay(350);
        CheckTiles(4, 4);
        Call(window, "SetSkin", false);
        await Task.Delay(350);
        if (Math.Abs(window.Bounds.Width - width) > 2 || Math.Abs(window.Bounds.Height - height) > 2 || window.Position != position)
            throw new Exception("Classic window geometry was not restored");
        Console.WriteLine("PASS command deck expands, tiles all tabs without overlap, routes input, retiles after add/close, restores classic bounds. Screenshot: " + screenshot);
    }
}
