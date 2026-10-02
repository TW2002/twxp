using System.Reflection;
using System.Runtime.CompilerServices;
using Avalonia.Controls;
using Avalonia;
using Avalonia.Headless;
using Avalonia.Threading;
using MTC;

// Console regression only: no application startup, window construction,
// process launch, game socket, or desktop automation.
AppBuilder.Configure<Application>().UseHeadless(new AvaloniaHeadlessPlatformOptions()).SetupWithoutStarting();
// This console does not run a UI message loop; do not capture its context in awaits.
SynchronizationContext.SetSynchronizationContext(null);
var main = typeof(MainWindow);
var tabType = main.GetNestedType("MtcTabPrototype", BindingFlags.NonPublic)!;
var tab = RuntimeHelpers.GetUninitializedObject(tabType);
var agentType = main.Assembly.GetType("MTC.GameAgentRuntime")!;
var agent = Activator.CreateInstance(agentType, nonPublic: true)!;
tabType.GetProperty("GameAgent")!.SetValue(tab, agent);
var windowType = main.Assembly.GetType("MTC.GameAgentWindow")!;
var window = (Window)RuntimeHelpers.GetUninitializedObject(windowType);
tabType.GetProperty("GameAgentWindow")!.SetValue(tab, window);
var gate = main.GetMethod("IsGameAgentWindowActive", BindingFlags.NonPublic | BindingFlags.Static)!;

async Task Check(bool active)
{
    await Task.Run(() =>
    {
        if (Dispatcher.UIThread.CheckAccess())
            throw new Exception("Regression must run off the UI thread");
        try
        {
            _ = window.IsVisible;
            throw new Exception("The old visibility read unexpectedly succeeded");
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("invalid thread")) { }
        if ((bool)gate.Invoke(null, [tab])! != active)
            throw new Exception("Observation gate lost the recorder's active state");
    });
}

try
{
    await Check(false);
    agentType.GetMethod("Activate")!.Invoke(agent, ["thread-gate-test"]);
    await Check(true);
    agentType.GetMethod("Deactivate")!.Invoke(agent, null);
    await Check(false);
    Console.WriteLine("PASS: actual MTC background observer gate tracks active/inactive lifetime without reading Avalonia visibility");
}
finally
{
    ((IDisposable)agent).Dispose();
}
