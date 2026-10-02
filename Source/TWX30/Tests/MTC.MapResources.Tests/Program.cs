using System.Collections;
using System.Reflection;
using System.Security.Cryptography;
using Avalonia;
using Avalonia.Headless;
using Avalonia.Themes.Fluent;
using MTC;
using SkiaSharp;
using Core = TWXProxy.Core;

AppBuilder.Configure<TestApp>().UseSkia().WithInterFont()
    .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false })
    .SetupWithoutStarting();

const BindingFlags PrivateInstance = BindingFlags.Instance | BindingFlags.NonPublic;
const BindingFlags PrivateStatic = BindingFlags.Static | BindingFlags.NonPublic;
var map = new TacticalMapControl(() => 1, () => null);
Type tacticalType = typeof(TacticalMapControl);
object snapshot = tacticalType.GetField("_lastSnapshot", PrivateInstance)!.GetValue(map)!;
var positions = (Dictionary<int, SKPoint>)snapshot.GetType().GetProperty("Positions")!.GetValue(snapshot)!;
positions[1] = new SKPoint(60, 90);
positions[2] = new SKPoint(180, 90);
var sectors = (Dictionary<int, Core.SectorData?>)snapshot.GetType().GetProperty("Sectors")!.GetValue(snapshot)!;
sectors[1] = new Core.SectorData();
sectors[1]!.Warp[0] = 2;
sectors[2] = new Core.SectorData();
tacticalType.GetField("_hoveredSectorNumber", PrivateInstance)!.SetValue(map, 1);
tacticalType.GetField("_hoveredSectorPopupText", PrivateInstance)!.SetValue(map, "Sector 1\nTest hover popup");

Type classicType = tacticalType.Assembly.GetType("MTC.MapWindow")!;
var classic = (Avalonia.Controls.Window)Activator.CreateInstance(classicType,
    new object?[] { (Func<int>)(() => 1), (Func<Core.ModDatabase?>)(() => null), null })!;
classicType.GetField("_positions", PrivateInstance)!.SetValue(classic, positions);
classicType.GetField("_sectorCache", PrivateInstance)!.SetValue(classic, sectors);
classicType.GetField("_depthCache", PrivateInstance)!.SetValue(classic, new Dictionary<int, int> { [1] = 0, [2] = 1 });

using var bitmap = new SKBitmap(640, 480);
using var canvas = new SKCanvas(bitmap);
var draws = new (string Name, Action Draw)[]
{
    ("backdrop", () => tacticalType.GetMethod("DrawBackdrop", PrivateInstance)!.Invoke(map, [canvas, 640f, 480f])),
    ("edges", () => tacticalType.GetMethod("DrawEdges", PrivateStatic)!.Invoke(null, [canvas, snapshot])),
    ("hover", () => tacticalType.GetMethod("DrawSectorHoverPopup", PrivateInstance)!.Invoke(map, [canvas, 640f, 480f])),
    ("legend", () => tacticalType.GetMethod("DrawOverlayLegend", PrivateStatic)!.Invoke(null, [canvas, 640f, 480f, snapshot])),
    ("classic", () => classicType.GetMethod("Draw", PrivateInstance)!.Invoke(classic, [canvas, 640f, 480f])),
};

// Inspect SkiaSharp's native-handle registry only in this isolated test process.
Type registryType = typeof(SKObject).Assembly.GetType("SkiaSharp.HandleDictionary")!;
var registry = (IDictionary)registryType.GetField("instances", PrivateStatic)!.GetValue(null)!;
object registryLock = registryType.GetField("instancesLock", PrivateStatic)!.GetValue(null)!;
Type lockType = typeof(SKObject).Assembly.GetType("SkiaSharp.Internals.IPlatformLock")!;
int CountResources()
{
    lockType.GetMethod("EnterReadLock")!.Invoke(registryLock, null);
    try
    {
        return registry.Values.Cast<WeakReference>().Count(reference =>
            reference.Target is SKShader or SKPathEffect or SKImageFilter);
    }
    finally { lockType.GetMethod("ExitReadLock")!.Invoke(registryLock, null); }
}

bool failed = false;
foreach (var (name, draw) in draws)
{
    void Frame()
    {
        canvas.Save();
        try { canvas.Clear(SKColors.Black); draw(); canvas.Flush(); }
        finally { canvas.Restore(); }
    }
    Frame();
    GC.Collect();
    GC.WaitForPendingFinalizers();
    GC.Collect();
    if (!GC.TryStartNoGCRegion(64 * 1024 * 1024))
        throw new Exception("Could not pause GC for deterministic disposal test");
    int before;
    int after;
    try
    {
        before = CountResources();
        for (int frame = 0; frame < 100; frame++) Frame();
        after = CountResources();
    }
    finally { GC.EndNoGCRegion(); }
    Console.WriteLine($"{name}: outstanding resources {before} -> {after} after 100 frames without GC");
    failed |= after != before;
    using var image = SKImage.FromBitmap(bitmap);
    using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
    Console.WriteLine($"{name}: pixels SHA256 {Convert.ToHexString(SHA256.HashData(bitmap.Bytes))}");
    using var output = File.Create(Path.Combine(Path.GetTempPath(), $"mtc-map-resource-{name}.png"));
    encoded.SaveTo(output);
}
classic.Close();
if (failed)
{
    Console.Error.WriteLine("FAIL: map draw paths left native resources waiting for finalization");
    Environment.ExitCode = 1;
}
else Console.WriteLine("PASS: no tracked shader/filter/path-effect growth in five map draw paths before GC");

sealed class TestApp : Application
{
    public override void Initialize() => Styles.Add(new FluentTheme());
}
