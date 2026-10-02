using System.Text;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private void InitializeOpenTwMapSync(MtcTabPrototype tab)
    {
        tab.Telnet.ApplicationDataFilter = tab.TerminalMapFrameFilter.Filter;
        tab.TerminalMapFrameFilter.DescriptorReceived += descriptor =>
            BeginOpenTwMapSynchronization(tab, descriptor);
        tab.ScriptMapFrameFilter.DescriptorReceived += descriptor =>
            BeginOpenTwMapSynchronization(tab, descriptor);
    }

    private void ResetOpenTwMapSync(MtcTabPrototype tab)
    {
        tab.OpenTwMapSyncCancellation?.Cancel();
        tab.OpenTwMapSyncCancellation?.Dispose();
        tab.OpenTwMapSyncCancellation = new CancellationTokenSource();
        tab.OpenTwInitialSyncGate.Reset();
        Interlocked.Increment(ref tab.OpenTwConnectionGeneration);
        tab.OpenTwServerDetected = false;
        tab.OpenTwCommandReady = false;
        tab.OpenTwMapSyncStatus = string.Empty;
        tab.OpenTwMapProbe.Reset();
        Interlocked.Exchange(ref tab.OpenTwMapSyncRunning, 0);
        RefreshOpenTwMapUi(tab);
    }

    private void CancelOpenTwMapSync(MtcTabPrototype tab)
    {
        tab.OpenTwCommandReady = false;
        tab.OpenTwMapProbe.Complete();
        tab.OpenTwMapSyncCancellation?.Cancel();
        tab.OpenTwInitialSyncGate.Complete(false);
        if (tab.OpenTwServerDetected)
            SetOpenTwMapStatus(tab, "disconnected");
    }

    private void ObserveOpenTwMapSyncLine(MtcTabPrototype? tab, string line)
    {
        if (tab is null || string.IsNullOrWhiteSpace(line))
            return;
        if (line.Contains("OpenTW", StringComparison.OrdinalIgnoreCase))
        {
            tab.OpenTwServerDetected = true;
            tab.OpenTwInitialSyncGate.MarkOpenTwDetected();
            if (string.IsNullOrWhiteSpace(tab.OpenTwMapSyncStatus))
                SetOpenTwMapStatus(tab, "waiting for command prompt");
        }
        bool declineMenu = tab.OpenTwMapProbe.ObserveLine(line, tab.OpenTwServerDetected, out bool skippedAtLogin);
        tab.OpenTwCommandReady = tab.OpenTwMapProbe.CommandReady;
        if (declineMenu)
        {
            // Only answer a menu opened by our own outstanding '+' probe.
            SendOpenTwMapInput(tab, "n");
            tab.OpenTwInitialSyncGate.Complete(true);
            SetOpenTwMapStatus(tab, "not supported");
            Core.GlobalModules.DebugLog("[MTC.OpenTwMap] Descriptor unsupported; declined Display Menu and disabled probes for this connection.\n");
            return;
        }
        if (skippedAtLogin)
        {
            tab.OpenTwInitialSyncGate.Complete(true);
            SetOpenTwMapStatus(tab, "automatic probe skipped: login was not at Command");
        }
        if (tab.OpenTwServerDetected)
            RequestOpenTwMapDescriptor(tab, manual: false);
    }

    private void RequestOpenTwMapRefresh()
    {
        MtcTabPrototype? tab = PeekCurrentMtcTabContext() ?? ActiveMtcTab;
        if (tab is null)
            return;
        RequestOpenTwMapDescriptor(tab, manual: true);
    }

    private void RequestOpenTwMapDescriptor(MtcTabPrototype tab, bool manual)
    {
        if (!tab.OpenTwServerDetected || !tab.OpenTwCommandReady ||
            Interlocked.CompareExchange(ref tab.OpenTwMapSyncRunning, 0, 0) != 0)
            return;
        if (!tab.OpenTwMapProbe.TryBeginRequest(manual, out long requestId))
            return;

        long generation = Volatile.Read(ref tab.OpenTwConnectionGeneration);
        CancellationToken cancellationToken = tab.OpenTwMapSyncCancellation?.Token ?? CancellationToken.None;
        SetOpenTwMapStatus(tab, "requesting descriptor");
        if (!SendOpenTwMapInput(tab, "+"))
        {
            tab.OpenTwMapProbe.Complete();
            SetOpenTwMapStatus(tab, "disconnected");
            return;
        }
        Core.GlobalModules.DebugLog("[MTC.OpenTwMap] Requested authenticated OpenTW topology descriptor.\n");
        _ = ExpireOpenTwMapProbeAsync(tab, requestId, generation, cancellationToken);
    }

    private async Task ExpireOpenTwMapProbeAsync(MtcTabPrototype tab, long requestId, long generation,
        CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(10), cancellationToken).ConfigureAwait(false);
            if (Volatile.Read(ref tab.OpenTwConnectionGeneration) != generation ||
                !tab.OpenTwMapProbe.Complete(requestId))
                return;
            tab.OpenTwInitialSyncGate.Complete(false);
            SetOpenTwMapStatus(tab, "descriptor not received; automatic retry disabled");
        }
        catch (OperationCanceledException) { }
    }

    private static bool SendOpenTwMapInput(MtcTabPrototype tab, string text)
    {
        byte[] request = Encoding.ASCII.GetBytes(text);
        if (tab.GameInstance is { IsConnected: true } gameInstance)
            _ = gameInstance.SendToServerAsync(request);
        else if (tab.Telnet.IsConnected)
            tab.Telnet.SendRaw(request);
        else
            return false;
        return true;
    }

    private void BeginOpenTwMapSynchronization(MtcTabPrototype tab, OpenTwMapDescriptor descriptor)
    {
        tab.OpenTwMapProbe.Complete();
        if (Interlocked.CompareExchange(ref tab.OpenTwMapSyncRunning, 1, 0) != 0)
            return;
        Core.ModDatabase? database = tab.SessionDb;
        if (database is null || !database.IsOpen)
        {
            Interlocked.Exchange(ref tab.OpenTwMapSyncRunning, 0);
            tab.OpenTwInitialSyncGate.Complete(false);
            SetOpenTwMapStatus(tab, "failed: no open database");
            return;
        }

        long generation = Volatile.Read(ref tab.OpenTwConnectionGeneration);
        CancellationToken cancellationToken = tab.OpenTwMapSyncCancellation?.Token ?? CancellationToken.None;
        SetOpenTwMapStatus(tab, $"downloading {descriptor.SectorCount:N0} sectors");
        _ = Task.Run(async () =>
        {
            bool committed = false;
            try
            {
                using var synchronizer = new OpenTwMapSynchronizerScope(tab.State.Host);
                OpenTwMapSyncResult result = await synchronizer.Value.SynchronizeAsync(
                    descriptor,
                    database,
                    cancellationToken,
                    canCommit: () =>
                        !cancellationToken.IsCancellationRequested &&
                        Volatile.Read(ref tab.OpenTwConnectionGeneration) == generation &&
                        ReferenceEquals(tab.SessionDb, database) &&
                        database.IsOpen).ConfigureAwait(false);
                string outcome = result.NotModified
                    ? "current"
                    : result.Applied
                        ? $"current ({result.SectorCount:N0})"
                        : "not changed";
                committed = result.Applied || result.NotModified;
                SetOpenTwMapStatus(tab, outcome);
                Core.GlobalModules.DebugLog($"[MTC.OpenTwMap] Topology sync {outcome}.\n");
            }
            catch (OperationCanceledException)
            {
                SetOpenTwMapStatus(tab, "canceled");
                Core.GlobalModules.DebugLog("[MTC.OpenTwMap] Topology sync canceled before database installation.\n");
            }
            catch (Exception exception)
            {
                SetOpenTwMapStatus(tab, $"failed: {ShortStatus(exception.Message)}");
                Core.GlobalModules.DebugLog($"[MTC.OpenTwMap] Topology sync failed without changing the XDB: {exception.Message}\n");
            }
            finally
            {
                tab.OpenTwInitialSyncGate.Complete(committed);
                Interlocked.Exchange(ref tab.OpenTwMapSyncRunning, 0);
                RefreshOpenTwMapUi(tab);
            }
        });
    }

    private async Task<bool> WaitForInitialOpenTwMapSyncAsync()
    {
        MtcTabPrototype? tab = PeekCurrentMtcTabContext() ?? ActiveMtcTab;
        if (tab is null)
            return true;

        bool synchronized = await tab.OpenTwInitialSyncGate.WaitBeforeAutomaticStartAsync(
            TimeSpan.FromSeconds(2)).ConfigureAwait(true);
        if (!tab.OpenTwServerDetected)
            return synchronized;
        if (!synchronized)
        {
            Core.GlobalModules.DebugLog("[MTC.NativeBotAutoStart] OpenTW map sync did not complete; automatic bot start deferred.\n");
            return false;
        }
        return tab.State.Connected;
    }

    private void SetOpenTwMapStatus(MtcTabPrototype tab, string status)
    {
        tab.OpenTwMapSyncStatus = status;
        RefreshOpenTwMapUi(tab);
    }

    private void RefreshOpenTwMapUi(MtcTabPrototype tab)
    {
        Dispatcher.UIThread.Post(() =>
        {
            if (tab.Id != _activeMtcTabId)
                return;
            _openTwMapStatusMenuItem.Header = tab.OpenTwServerDetected
                ? $"OpenTW map: {tab.OpenTwMapSyncStatus}"
                : "OpenTW map: not detected";
            _openTwMapRefreshMenuItem.IsEnabled =
                tab.OpenTwServerDetected && tab.OpenTwCommandReady &&
                !tab.OpenTwMapProbe.Unsupported &&
                Interlocked.CompareExchange(ref tab.OpenTwMapSyncRunning, 0, 0) == 0;
            RequestStatusBarRefresh();
        }, DispatcherPriority.Background);
    }

    private static string ShortStatus(string value) =>
        value.Length <= 72 ? value : value[..69] + "...";

    private sealed class OpenTwMapSynchronizerScope : IDisposable
    {
        public OpenTwMapSynchronizer Value { get; }
        public OpenTwMapSynchronizerScope(string host) =>
            Value = new OpenTwMapSynchronizer(allowedHosts: [host]);
        public void Dispose() => Value.Dispose();
    }
}
