using System;
using System.Threading;
using System.Threading.Tasks;
using TWXProxy.Core;

namespace SampleObserverModule;

public sealed class SampleObserverModule : IExpansionModule
{
    private ExpansionModuleContext? _context;

    public string Id => "sample-observer";
    public string DisplayName => "Sample Observer";
    public ExpansionHostTargets SupportedHosts => ExpansionHostTargets.Any;

    public Task InitializeAsync(ExpansionModuleContext context, CancellationToken cancellationToken)
    {
        _context = context;
        context.GameInstance.Connected += OnConnected;
        context.GameInstance.Disconnected += OnDisconnected;
        context.GameInstance.ServerDataReceived += OnServerDataReceived;
        context.Log($"Initialized for {context.HostName} game '{context.GameName}'.");
        return Task.CompletedTask;
    }

    public Task ShutdownAsync(CancellationToken cancellationToken)
    {
        if (_context != null)
        {
            _context.GameInstance.Connected -= OnConnected;
            _context.GameInstance.Disconnected -= OnDisconnected;
            _context.GameInstance.ServerDataReceived -= OnServerDataReceived;
            _context.Log("Shutdown complete.");
            _context = null;
        }

        return Task.CompletedTask;
    }

    private void OnConnected(object? sender, EventArgs e)
    {
        _context?.Log("Connected event received.");
    }

    private void OnDisconnected(object? sender, DisconnectEventArgs e)
    {
        _context?.Log($"Disconnected event received: {e.Reason}");
    }

    private void OnServerDataReceived(object? sender, DataReceivedEventArgs e)
    {
        if (_context == null || e.Data.Length == 0)
            return;

        string text = e.Text.Replace("\r", "\\r", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);
        _context.Log($"Observed {e.Data.Length} server byte(s): '{text}'");
    }
}
