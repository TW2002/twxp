using System.Collections;
using System.Reflection;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Media.Imaging;
using Avalonia.VisualTree;
using MTC;

internal static class WindowSizingTests
{
    private const BindingFlags Private = BindingFlags.Instance | BindingFlags.NonPublic;
    private static object? Call(MainWindow w, string name, params object[] args) => typeof(MainWindow).GetMethod(name, Private)!.Invoke(w, args);
    private static T Field<T>(MainWindow w, string name) => (T)typeof(MainWindow).GetField(name, Private)!.GetValue(w)!;
    private static void Near(double actual, double expected, string message)
    {
        if (Math.Abs(actual - expected) > 2) throw new Exception($"{message}: {actual} != {expected}");
    }

    public static async Task Run(string directory)
    {
        AppPaths.SetConfiguredProgramDir(directory);
        var prefs = new EphemeralPreferences { ProgramDirectory = directory, ScriptsDirectory = Path.Combine(directory, "scripts"), UpdateChecksEnabled = false, ShowNotesPanel = true };
        if (!prefs.ScriptWindowsInsideMtc || !prefs.ScriptWindowsAboveNotes) throw new Exception("Wrong defaults");
        typeof(AppPreferences).GetProperty(nameof(AppPreferences.HasConfiguredSharedPaths))!.SetValue(prefs, true);
        var w = new MainWindow(prefs) { Width = 1400, Height = 800, ShowActivated = false };
        try
        {
            w.Show();
            var tab = Field<IEnumerable>(w, "_mtcTabs").Cast<object>().First();
            var host = (DockedScriptWindows)tab.GetType().GetProperty("ScriptWindows")!.GetValue(tab)!;
            ((GameState)tab.GetType().GetProperty("State")!.GetValue(tab)!).GameName = "geometry_test";
            tab.GetType().GetProperty("NotesPanelVisible")!.SetValue(tab, true);
            Call(w, "RefreshScriptWindowSidebar");
            await Task.Delay(220);
            foreach (bool split in new[] { true, false })
            {
                prefs.ScriptWindowsAboveNotes = split;
                Call(w, "ApplyScriptWindowPreferences");
                await Task.Delay(150);
                double console = Field<TerminalControl>(w, "_termCtrl").Bounds.Width;
                double original = w.Bounds.Width;
                double notesWidth = w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single().GetVisualDescendants().OfType<TextBox>().Single().Bounds.Width;
                var popup = host.CreateWindow("large", "Very wide window", 3000, 400);
                popup.TextContent = new string('X', 500);
                popup.Show();
                await Task.Delay(220);
                double after = Field<TerminalControl>(w, "_termCtrl").Bounds.Width;
                Near(after, console, "Opening a script window changed console width");
                var side = w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single();
                var text = side.GetVisualDescendants().OfType<SelectableTextBlock>().Single();
                var body = text.GetVisualAncestors().OfType<ScrollViewer>().First();
                if (body.Bounds.Width > console / 3 + 1 || body.Extent.Width <= body.Viewport.Width)
                    throw new Exception("One-third width cap or horizontal scrolling missing");
                Near(w.Bounds.Width, original, "Opening a report resized the reserved workspace");
                Near(side.GetVisualDescendants().OfType<TextBox>().Single().Bounds.Width, notesWidth, "Opening a report changed Notes width");
                double expanded = w.Bounds.Width;
                for (int i = 0; i < 20; i++) popup.TextContent = "refresh " + i;
                await Task.Delay(100);
                Near(w.Bounds.Width, expanded, "Content updates repeatedly grew outer window");
                int originalTab = (int)tab.GetType().GetProperty("Id")!.GetValue(tab)!;
                Call(w, "CreateStagedMtcTab");
                await Task.Delay(150);
                Call(w, "ActivateMtcTab", originalTab);
                await Task.Delay(200);
                Near(w.Bounds.Width, expanded, "Tab switch accumulated expansion");
                side = w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single();
                text = side.GetVisualDescendants().OfType<SelectableTextBlock>().Single();
                body = text.GetVisualAncestors().OfType<ScrollViewer>().First();
                double paneWidth = side.NotesWidth;
                double requestedOuterWidth = w.Width - 120;
                w.Width -= 120;
                await Task.Delay(350);
                Near(w.Bounds.Width, requestedOuterWidth, "Auto-sizing fought the user's outer resize");
                Near(side.NotesWidth, paneWidth, "Outer resize changed the independent Notes width");
                console = Field<TerminalControl>(w, "_termCtrl").Bounds.Width;
                if (body.Bounds.Width > console / 3 + 1) throw new Exception("Cap did not follow manual resize");
                var grip = Field<Thumb>(w, "_notesWidthGrip");
                grip.RaiseEvent(new VectorEventArgs { RoutedEvent = Thumb.DragDeltaEvent, Vector = new Vector(60, 0) });
                grip.RaiseEvent(new VectorEventArgs { RoutedEvent = Thumb.DragCompletedEvent });
                await Task.Delay(250);
                Near(w.Bounds.Width, requestedOuterWidth, "Notes divider resized the OS window");
                Near(side.NotesWidth, paneWidth - (split ? 60 : 30), "Notes divider failed to resize the pane");
                paneWidth = side.NotesWidth;
                double afterDragConsole = Field<TerminalControl>(w, "_termCtrl").Bounds.Width;
                if (afterDragConsole <= console + 1) throw new Exception($"Divider did not return width to the console: {console} -> {afterDragConsole}");
                console = afterDragConsole;
                for (int i = 0; i < 20; i++) popup.TextContent = "After manual resize " + i;
                Call(w, "RefreshScriptWindowSidebar");
                await Task.Delay(250);
                side = w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single();
                Near(side.NotesWidth, paneWidth, "Sidebar rebuild forgot manual Notes width");
                Near(w.Bounds.Width, requestedOuterWidth, "Refresh undid the user's outer resize");
                using (var image = new RenderTargetBitmap(new PixelSize((int)w.Bounds.Width, (int)w.Bounds.Height)))
                {
                    image.Render(w);
                    image.Save(Path.Combine(directory, split ? "notes-resized-above.png" : "notes-resized-beside.png"));
                }
                original -= 120;
                prefs.ScriptWindowsInsideMtc = false;
                Call(w, "ApplyScriptWindowPreferences");
                await Task.Delay(200);
                var popups = ((IEnumerable)tab.GetType().GetProperty("AuxiliaryWindows")!.GetValue(tab)!).Cast<Window>().OfType<ScriptPopupWindow>().ToArray();
                if (popups.Length != 1 || !popups[0].IsVisible || popups[0].Topmost || popups[0].ShowActivated)
                    throw new Exception("Outside mode did not use the non-focus-stealing popup");
                prefs.ScriptWindowsInsideMtc = true;
                Call(w, "ApplyScriptWindowPreferences");
                await Task.Delay(200);
                if (popups[0].IsVisible || host.Snapshot().Length != 1) throw new Exception("Moving inside lost script handle or left popup");
                Near(Field<TerminalControl>(w, "_termCtrl").Bounds.Width, console, "Returning inside changed console width");
                popup.Dispose();
                await Task.Delay(150);
                double stableNotes = w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single().GetVisualDescendants().OfType<TextBox>().Single().Bounds.Width;
                double stableWidth = w.Bounds.Width;
                popup = host.CreateWindow("small", "Small report", 80, 150);
                popup.Show();
                await Task.Delay(180);
                Near(w.Bounds.Width, stableWidth, "Small report resized outer window");
                Near(w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single().GetVisualDescendants().OfType<TextBox>().Single().Bounds.Width, stableNotes, "Small report resized Notes");
                popup.Dispose();
                await Task.Delay(180);
                Near(w.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single().GetVisualDescendants().OfType<TextBox>().Single().Bounds.Width, stableNotes, "Closing report resized Notes");
            }
            prefs.ScriptWindowsAboveNotes = false;
            Call(w, "ApplyScriptWindowPreferences");
            var screen = w.Screens.ScreenFromWindow(w)!;
            w.Width = screen.WorkingArea.Width / screen.Scaling - 24;
            await Task.Delay(200);
            double edgeConsole = Field<TerminalControl>(w, "_termCtrl").Bounds.Width;
            var edge = host.CreateWindow("edge", "Screen edge", 4000, 200);
            edge.Show();
            await Task.Delay(250);
            Near(Field<TerminalControl>(w, "_termCtrl").Bounds.Width, edgeConsole, "Screen edge squeezed console");
            var scroll = Field<ScrollViewer>(w, "_scriptWindowWorkspaceScroll");
            edge.Dispose();
            await Task.Delay(120);
            w.WindowState = WindowState.Maximized;
            await Task.Delay(200);
            double maximizedConsole = Field<TerminalControl>(w, "_termCtrl").Bounds.Width;
            var maximized = host.CreateWindow("max", "Maximized", 3000, 200);
            maximized.Show();
            await Task.Delay(200);
            Near(Field<TerminalControl>(w, "_termCtrl").Bounds.Width, maximizedConsole, "Maximized window squeezed console");
            maximized.Dispose();
            Console.WriteLine("PASS stable reserved Notes/report widths, preserved console width, one-third cap, scrollbars, defaults, and live inside/outside migration.");
        }
        finally { w.Close(); }
    }
    private sealed class EphemeralPreferences : AppPreferences { public override void Save() { } }
}
