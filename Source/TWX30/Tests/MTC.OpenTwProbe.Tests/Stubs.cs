using System.Text;

// Only dependencies are stubbed; tests execute the production probe and integration methods.
namespace Avalonia.Threading
{
    public enum DispatcherPriority { Background }
    public sealed class Dispatcher
    {
        public static Dispatcher UIThread { get; } = new();
        public void Post(Action action, DispatcherPriority priority) => action();
    }
}

namespace TWXProxy.Core
{
    public sealed class ModDatabase { public bool IsOpen => true; }
    public static class GlobalModules { public static void DebugLog(string text) { } }
}

namespace MTC
{
    public sealed record OpenTwMapDescriptor(int SectorCount);
    public sealed record OpenTwMapSyncResult(bool NotModified, bool Applied, int SectorCount);
    public sealed class OpenTwMapSynchronizer(IEnumerable<string> allowedHosts) : IDisposable
    {
        public Task<OpenTwMapSyncResult> SynchronizeAsync(OpenTwMapDescriptor descriptor,
            TWXProxy.Core.ModDatabase database, CancellationToken cancellationToken, Func<bool> canCommit)
            => Task.FromException<OpenTwMapSyncResult>(new IOException("fixture: map API unavailable"));
        public void Dispose() { }
    }
    public sealed class Gate
    {
        public bool? Result;
        public void Reset() => Result = null;
        public void MarkOpenTwDetected() { }
        public void Complete(bool result) => Result ??= result;
        public Task<bool> WaitBeforeAutomaticStartAsync(TimeSpan timeout) => Task.FromResult(Result ?? false);
    }
    public sealed class FrameFilter
    {
        public event Action<OpenTwMapDescriptor>? DescriptorReceived;
        public string Filter(string text) => text;
    }
    public sealed class Transport
    {
        public bool IsConnected => true;
        public List<string> Sent { get; } = [];
        public Func<string, string>? ApplicationDataFilter;
        public Task SendToServerAsync(byte[] bytes) { Sent.Add(Encoding.ASCII.GetString(bytes)); return Task.CompletedTask; }
        public void SendRaw(byte[] bytes) => Sent.Add(Encoding.ASCII.GetString(bytes));
    }
    public sealed class State { public string Host => "fixture.invalid"; public bool Connected => true; }
    public sealed class MenuItem { public string? Header; public bool IsEnabled; }
    public partial class MainWindow
    {
        private sealed class MtcTabPrototype
        {
            public int Id = 1;
            public Transport Telnet { get; } = new();
            public Transport? GameInstance { get; } = new();
            public FrameFilter TerminalMapFrameFilter { get; } = new();
            public FrameFilter ScriptMapFrameFilter { get; } = new();
            public OpenTwMapProbe OpenTwMapProbe { get; } = new();
            public Gate OpenTwInitialSyncGate { get; } = new();
            public CancellationTokenSource? OpenTwMapSyncCancellation;
            public long OpenTwConnectionGeneration;
            public bool OpenTwServerDetected, OpenTwCommandReady;
            public string OpenTwMapSyncStatus = "";
            public int OpenTwMapSyncRunning;
            public TWXProxy.Core.ModDatabase? SessionDb { get; } = new();
            public State State { get; } = new();
        }
        private int _activeMtcTabId = 1;
        private readonly MenuItem _openTwMapStatusMenuItem = new(), _openTwMapRefreshMenuItem = new();
        private MtcTabPrototype? PeekCurrentMtcTabContext() => null;
        private MtcTabPrototype? ActiveMtcTab => null;
        private void RequestStatusBarRefresh() { }
    }
}
