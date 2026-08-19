using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input.Platform;

namespace MTC;

internal static class ClipboardHelper
{
    public static Task<bool> TrySetTextAsync(Control control, string text)
        => TrySetTextAsync(TopLevel.GetTopLevel(control)?.Clipboard, text);

    public static async Task<bool> TrySetTextAsync(IClipboard? clipboard, string text)
    {
        if (clipboard != null)
        {
            try
            {
                await clipboard.SetTextAsync(text);
                string? roundTrip = await ClipboardExtensions.TryGetTextAsync(clipboard);
                if (ClipboardTextMatches(roundTrip, text))
                    return true;
            }
            catch
            {
                // Fall through to platform fallback below.
            }
        }

        if (OperatingSystem.IsWindows())
            return await TrySetWindowsClipboardFallbackAsync(text);

        return false;
    }

    private static bool ClipboardTextMatches(string? actual, string expected)
    {
        if (string.IsNullOrEmpty(actual))
            return false;

        return NormalizeClipboardText(actual) == NormalizeClipboardText(expected);
    }

    private static string NormalizeClipboardText(string text)
        => text.Replace("\r\n", "\n").Replace('\r', '\n');

    private static async Task<bool> TrySetWindowsClipboardFallbackAsync(string text)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c clip",
                UseShellExecute = false,
                RedirectStandardInput = true,
                CreateNoWindow = true,
                StandardInputEncoding = Encoding.Unicode,
            };

            using var process = new Process { StartInfo = startInfo };
            if (!process.Start())
                return false;

            string clipboardText = text.Replace("\n", "\r\n");
            await process.StandardInput.WriteAsync(clipboardText);
            await process.StandardInput.FlushAsync();
            process.StandardInput.Close();
            await process.WaitForExitAsync();
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}
