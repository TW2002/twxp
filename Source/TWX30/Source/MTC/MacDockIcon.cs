using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using Avalonia.Platform;

namespace MTC;

/// <summary>
/// Sets the macOS dock icon for non-bundled single-file binaries.
/// WindowIcon only affects the window title bar; the dock icon requires AppKit calls.
/// </summary>
[SupportedOSPlatform("macos")]
static class MacDockIcon
{
    [DllImport("/usr/lib/libobjc.A.dylib", EntryPoint = "objc_getClass")]
    private static extern IntPtr GetClass(string name);

    [DllImport("/usr/lib/libobjc.A.dylib", EntryPoint = "sel_registerName")]
    private static extern IntPtr GetSel(string name);

    [DllImport("/usr/lib/libobjc.A.dylib", EntryPoint = "objc_msgSend")]
    private static extern IntPtr Send(IntPtr obj, IntPtr sel);

    [DllImport("/usr/lib/libobjc.A.dylib", EntryPoint = "objc_msgSend")]
    private static extern IntPtr Send1(IntPtr obj, IntPtr sel, IntPtr arg);

    [DllImport("/usr/lib/libobjc.A.dylib", EntryPoint = "objc_msgSend")]
    private static extern void SendVoid(IntPtr obj, IntPtr sel, IntPtr arg);

    /// <summary>
    /// Loads mtc2.png from Avalonia assets and sets it as the application dock icon.
    /// Must be called after Avalonia framework initialization is complete.
    /// </summary>
    public static void SetFromAsset()
    {
        try
        {
            // Write the embedded PNG to a temp file so NSImage can load it by path.
            var tmpPath = Path.Combine(Path.GetTempPath(), "mtc_dock_icon.png");
            using (var src = AssetLoader.Open(new Uri("avares://MTC/mtc2.png")))
            using (var dst = File.Create(tmpPath))
                src.CopyTo(dst);

            // Marshal the file path as a null-terminated UTF-8 C string.
            var pathBytes = System.Text.Encoding.UTF8.GetBytes(tmpPath + "\0");
            var pathPtr   = Marshal.AllocCoTaskMem(pathBytes.Length);
            try
            {
                Marshal.Copy(pathBytes, 0, pathPtr, pathBytes.Length);

                // NSString* pathNs = [NSString stringWithUTF8String:tmpPath]
                var pathNs = Send1(GetClass("NSString"), GetSel("stringWithUTF8String:"), pathPtr);

                // NSImage* img = [[NSImage alloc] initWithContentsOfFile:pathNs]
                var img = Send1(Send(GetClass("NSImage"), GetSel("alloc")),
                                GetSel("initWithContentsOfFile:"), pathNs);

                // [[NSApplication sharedApplication] setApplicationIconImage:img]
                var app = Send(GetClass("NSApplication"), GetSel("sharedApplication"));
                SendVoid(app, GetSel("setApplicationIconImage:"), img);
            }
            finally
            {
                Marshal.FreeCoTaskMem(pathPtr);
            }
        }
        catch
        {
            // Non-critical — default icon is an acceptable fallback.
        }
    }
}
