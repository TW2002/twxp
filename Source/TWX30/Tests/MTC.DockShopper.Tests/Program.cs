using Avalonia;
using Avalonia.Controls;
using Avalonia.Headless;
using Avalonia.Input.Platform;
using Avalonia.Interactivity;
using Avalonia.Media.Imaging;
using Avalonia.Themes.Fluent;
using Avalonia.Threading;
using Avalonia.VisualTree;
using MTC;

AppBuilder.Configure<TestApp>().UseSkia().WithInterFont()
    .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false })
    .SetupWithoutStarting();
using var stop = new CancellationTokenSource(TimeSpan.FromSeconds(30));
Exception? failure = null;
bool completed = false;
Dispatcher.UIThread.Post(async () =>
{
    var window = new DockShopperWindow([]);
    try
    {
        window.Show();
        await Task.Delay(100, stop.Token);
        var copy = window.GetVisualDescendants().OfType<Button>().Single(b => Equals(b.Content, "Copy"));
        var preview = window.GetVisualDescendants().OfType<TextBlock>().Single(t => t.Text?.StartsWith("lsd ") == true);
        var scanner = window.GetVisualDescendants().OfType<ComboBox>().First();
        string initial = preview.Text!;
        foreach (int width in new[] { 690, 620 })
        {
            window.Width = width;
            if (width == 620)
                scanner.SelectedIndex = 1;
            await Task.Delay(100, stop.Token);
            string expected = preview.Text!;
            if (width == 620 && expected == initial)
                throw new Exception("Changing the order did not update the preview");
            copy.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
            await Task.Delay(100, stop.Token);
            string? actual = await ClipboardExtensions.TryGetTextAsync(window.Clipboard!);
            if (actual != expected || !Equals(copy.Content, "Copied"))
                throw new Exception("Copy did not place the current full LSD command on the clipboard");
            if (window.Result != null || !window.IsVisible)
                throw new Exception("Copy must not submit an order or close the shopper");
            Point previewOrigin = preview.TranslatePoint(default, window)!.Value;
            Point copyOrigin = copy.TranslatePoint(default, window)!.Value;
            if (previewOrigin.X + preview.Bounds.Width > copyOrigin.X ||
                copyOrigin.X + copy.Bounds.Width > window.Bounds.Width)
                throw new Exception("Copy overlaps the preview or leaves the window");
            using var bitmap = new RenderTargetBitmap(new PixelSize((int)window.Bounds.Width, (int)window.Bounds.Height));
            bitmap.Render(window);
            bitmap.Save(Path.Combine(Path.GetTempPath(), $"mtc-dock-shopper-copy-{width}.png"));
            await Task.Delay(950, stop.Token);
            if (!copy.IsEnabled || !Equals(copy.Content, "Copy"))
                throw new Exception("Copy did not reset for another use");
            Console.WriteLine($"PASS width {width}: exact clipboard contents, updated order, feedback reset, no submission, no overlap");
        }
        completed = true;
    }
    catch (Exception ex) { failure = ex; }
    finally { window.Close(); stop.Cancel(); }
});
Dispatcher.UIThread.MainLoop(stop.Token);
if (!completed)
{
    Console.Error.WriteLine(failure ?? new TimeoutException("Dock shopper test timed out"));
    Environment.ExitCode = 1;
}

sealed class TestApp : Application
{
    public override void Initialize() => Styles.Add(new FluentTheme());
}
