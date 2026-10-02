using System.Reflection;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Presenters;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Avalonia.VisualTree;
using MTC;

AppBuilder.Configure<App>().UsePlatformDetect().WithInterFont().SetupWithoutStarting();
using var stop = new CancellationTokenSource(TimeSpan.FromSeconds(30));
Exception? failure = null;
bool completed = false;
string artifacts = Path.Combine(Path.GetTempPath(), "mtc-quickmacro-test-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(artifacts);
Dispatcher.UIThread.Post(async () =>
{
    Window? window = null;
    try
    {
        var sent = new List<(string Macro, int Count)>();
        string macro = string.Concat(Enumerable.Repeat("c p t y15504* q x 40* q 15504** t 29** a25000* a25000* l 234* cbn6732*y l 62* m nt* q x 36* ", 12));
        foreach (double scale in new[] { 1.0, 1.5 })
        {
            var overlay = new QuickMacroPlayOverlay(macro, 760 * scale, 84 * scale, 11.5 * scale,
                (text, count) => { sent.Add((text, count)); return Task.FromResult<string?>(null); }, () => { }, () => { });
            window = new Window { Title = "Isolated quick macro test", Width = 800 * scale, Height = 240 * scale, Content = overlay, ShowActivated = false };
            window.Show();
            await Task.Delay(200, stop.Token);
            var editor = overlay.GetVisualDescendants().OfType<TextBox>().First(t => t.Text == macro);
            var countBox = overlay.GetVisualDescendants().OfType<TextBox>().First(t => t != editor);
            var presenter = editor.GetVisualDescendants().OfType<TextPresenter>().Single();
            var scroll = editor.GetVisualDescendants().OfType<ScrollViewer>().Single();
            async Task Check(string name, int caretIndex)
            {
                editor.CaretIndex = caretIndex;
                editor.SelectionStart = caretIndex;
                editor.SelectionEnd = caretIndex;
                await Task.Delay(120, stop.Token);
                Rect caret = (Rect)typeof(TextPresenter).GetMethod("GetCursorRectangle", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(presenter, null)!;
                Point caretCenter = presenter.TranslatePoint(new Point(caret.X, caret.Center.Y), scroll)!.Value;
                Console.WriteLine($"{name} scale={scale}: viewport={scroll.Viewport}, line={editor.LineHeight}, caretY={caretCenter.Y}, offset={scroll.Offset.Y}, index={editor.CaretIndex}, length={editor.Text!.Length}");
                if (Math.Abs(scroll.Viewport.Height - editor.LineHeight * 3) > 1 ||
                    Math.Abs(caretCenter.Y - scroll.Bounds.Height / 2) > 1.5)
                    throw new Exception($"Editor must show three complete rows with caret centered: caret={caret}, presenter={presenter.Bounds}, alignment={presenter.VerticalAlignment}, extent={scroll.Extent}");
                using var bitmap = new RenderTargetBitmap(new PixelSize((int)window!.Bounds.Width, (int)window.Bounds.Height));
                bitmap.Render(window);
                bitmap.Save(Path.Combine(artifacts, $"{scale}-{name}.png"));
            }
            await Check("first", 0);
            await Check("middle", macro.Length / 2);
            await Check("last", macro.Length);
            if (editor.Text != macro) throw new Exception("Navigation altered the macro text");
            editor.RaiseEvent(new TextInputEventArgs { RoutedEvent = InputElement.TextInputEvent, Text = "added*" });
            await Check("typing", editor.CaretIndex);
            if (overlay.MacroText != macro + "added*") throw new Exception($"Editing altered macro text: expected length {macro.Length + 6}, actual {overlay.MacroText.Length}, caret {editor.CaretIndex}, tail '{overlay.MacroText[^Math.Min(30, overlay.MacroText.Length)..]}'");
            overlay.Width = overlay.MinWidth = overlay.MaxWidth = 550 * scale;
            await Check("resized", editor.CaretIndex);
            editor.RaiseEvent(new KeyEventArgs { RoutedEvent = InputElement.KeyDownEvent, Key = Key.Up });
            await Check("up", editor.CaretIndex);
            countBox.Text = "2";
            var play = overlay.GetVisualDescendants().OfType<Button>().First();
            for (int i = 0; i < 2; i++) play.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
            if (sent.Count != (scale == 1 ? 2 : 4) || sent[^1] != (macro + "added*", 2))
                throw new Exception("Repeated play did not preserve edited macro and count");
            editor.Text = string.Concat(Enumerable.Repeat("a25000*", 200));
            await Check("unbroken", editor.Text.Length / 2);
            editor.Text = "q x 36*";
            await Check("short", editor.Text.Length);
            window.Close();
            window = null;
        }
        completed = true;
        Console.WriteLine("PASS three-row caret centering, resize, editing and repeat playback. Screenshots: " + artifacts);
    }
    catch (Exception ex) { failure = ex; }
    finally { window?.Close(); stop.Cancel(); }
});
Dispatcher.UIThread.MainLoop(stop.Token);
if (!completed) { Console.Error.WriteLine(failure ?? new TimeoutException("Quick macro test timed out")); Environment.ExitCode = 1; }
