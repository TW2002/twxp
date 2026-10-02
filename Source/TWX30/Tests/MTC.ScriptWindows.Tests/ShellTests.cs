using System.Collections;
using System.Reflection;
using Avalonia.Controls;
using Avalonia.Media.Imaging;
using Avalonia;
using Avalonia.VisualTree;
using MTC;
using TWXProxy.Core;

internal static class ShellTests
{
    private const BindingFlags Private = BindingFlags.Instance | BindingFlags.NonPublic;
    private static object? Call(MainWindow window, string method, params object[] args)
        => typeof(MainWindow).GetMethod(method, Private)!.Invoke(window, args);
    private static T Field<T>(MainWindow window, string name)
        => (T)typeof(MainWindow).GetField(name, Private)!.GetValue(window)!;
    private static T Property<T>(object tab, string name) => (T)tab.GetType().GetProperty(name)!.GetValue(tab)!;

    public static async Task Run(string directory)
    {
        AppPaths.SetConfiguredProgramDir(directory);
        var prefs = new EphemeralPreferences
        {
            ProgramDirectory = directory,
            ScriptsDirectory = Path.Combine(directory, "scripts"),
            UpdateChecksEnabled = false,
            ShowNotesPanel = true,
            TerminalFontSize = 20,
        };
        typeof(AppPreferences).GetProperty(nameof(AppPreferences.HasConfiguredSharedPaths))!.SetValue(prefs, true);
        Directory.CreateDirectory(prefs.ScriptsDirectory);
        var window = new MainWindow(prefs) { Title = "Isolated MTC dock test", Width = 1400, Height = 800, ShowActivated = false };
        try
        {
            window.Show();
            Call(window, "CreateStagedMtcTab");
            object[] tabs = Field<IEnumerable>(window, "_mtcTabs").Cast<object>().ToArray();
            foreach (var tab in tabs)
            {
                int id = Property<int>(tab, "Id");
                Property<GameState>(tab, "State").GameName = "dock_test_" + id;
                var host = Property<DockedScriptWindows>(tab, "ScriptWindows");
                if (!ReferenceEquals(Property<TwxRuntimeContext>(tab, "RuntimeContext").ScriptWindowFactory, host))
                    throw new Exception("Tab does not own its runtime's window host");
                var report = host.CreateWindow("same_name", "Test report " + id, 310, 200);
                report.TextContent = "CONTENT OF TAB " + id;
                report.Show();
                tab.GetType().GetProperty("NotesPanelVisible")!.SetValue(tab, true);
            }
            foreach (bool deck in new[] { false, true })
            {
                Call(window, "SetSkin", deck);
                foreach (bool split in new[] { false, true })
                {
                    Call(window, "SetTerminalFontSize", split ? 18.0 : 20.0);
                    prefs.ScriptWindowsAboveNotes = split;
                    Call(window, "RefreshScriptWindowSidebar");
                    foreach (var tab in tabs)
                    {
                        int id = Property<int>(tab, "Id");
                        Call(window, "ActivateMtcTab", id);
                        await Task.Delay(180);
                        Control sidebar = deck
                            ? window.GetVisualDescendants().OfType<CommandDeckScriptWindows>().Single()
                            : window.GetVisualDescendants().OfType<ScriptWindowSidebar>().Single();
                        var texts = sidebar.GetVisualDescendants().OfType<SelectableTextBlock>().ToArray();
                        if (deck ? texts.Length != tabs.Length || tabs.Any(t => !texts.Any(text => text.Text == "CONTENT OF TAB " + Property<int>(t, "Id")))
                            : texts.Single().Text != "CONTENT OF TAB " + id)
                            throw new Exception("Actual shell displays the wrong report ownership");
                        var notes = Field<TextBox>(window, "_notesTextBox");
                        var content = texts.First();
                        if (content.FontFamily != notes.FontFamily || Math.Abs(content.FontSize - notes.FontSize) > .01)
                            throw new Exception($"Script text font differs from Notes: {content.FontSize} vs {notes.FontSize}");
                        if (!string.IsNullOrEmpty(notes.Text) && notes.Text != "Notes belong to " + id)
                            throw new Exception("Notes leaked between tabs");
                        if (sidebar.Bounds.Right > window.Bounds.Width || notes.Bounds.Height <= 0)
                            throw new Exception("Sidebar or notes outside visible bounds");
                        notes.Text = "Notes belong to " + id;
                        using var bitmap = new RenderTargetBitmap(new PixelSize((int)window.Bounds.Width, (int)window.Bounds.Height));
                        bitmap.Render(window);
                        bitmap.Save(Path.Combine(directory, $"shell-{deck}-{split}-{id}.png"));
                    }
                }
            }
            Console.WriteLine("PASS actual MTC tab host wiring, tab switches and both layouts in Classic and Command Deck.");
        }
        finally { window.Close(); }
    }

    private sealed class EphemeralPreferences : AppPreferences { public override void Save() { } }
}
