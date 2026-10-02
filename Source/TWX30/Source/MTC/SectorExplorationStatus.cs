using Avalonia.Controls;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private readonly TextBlock _sectorExplorationText = new();
    private Core.ModDatabase? _sectorExplorationDatabase;
    private long _sectorExplorationStamp = -1;
    private long _sectorExplorationNextRefresh;
    private bool _sectorExplorationRefreshRunning;
    private bool _sectorExplorationClosed;

    private void InitializeSectorExplorationStatus()
    {
        var timer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = TimeSpan.FromSeconds(2)
        };
        timer.Tick += (_, _) => RefreshSectorExplorationStatus();
        Opened += (_, _) => { timer.Start(); RefreshSectorExplorationStatus(); };
        Closed += (_, _) => { _sectorExplorationClosed = true; timer.Stop(); };
    }

    private async void RefreshSectorExplorationStatus()
    {
        if (_sectorExplorationClosed || _useCommandDeckSkin)
            return;

        var owner = ActiveMtcTab;
        var database = owner is { IsLiveSession: true } ? owner.SessionDb : null;
        if (!ReferenceEquals(database, _sectorExplorationDatabase))
        {
            _sectorExplorationDatabase = database;
            _sectorExplorationStamp = -1;
            _sectorExplorationNextRefresh = 0;
            _sectorExplorationText.Text = string.Empty;
        }
        if (database is not { IsOpen: true } || database.DBHeader.Sectors <= 0)
        {
            _sectorExplorationText.Text = string.Empty;
            _sectorExplorationText.IsVisible = false;
            _sectorExplorationStamp = -1;
            return;
        }
        if (_sectorExplorationRefreshRunning || _sectorExplorationStamp == database.ChangeStamp ||
            Environment.TickCount64 < _sectorExplorationNextRefresh)
            return;

        _sectorExplorationRefreshRunning = true;
        _sectorExplorationNextRefresh = Environment.TickCount64 + 2000;
        long stamp = database.ChangeStamp;
        try
        {
            // Count off-thread and reuse the result until the game database changes.
            var summary = await Task.Run(() => SectorExplorationSummary.Read(database));
            if (_sectorExplorationClosed || !ReferenceEquals(owner, ActiveMtcTab) ||
                !ReferenceEquals(database, owner?.SessionDb) || database.ChangeStamp != stamp)
                return;

            _sectorExplorationStamp = stamp;
            _sectorExplorationText.Text = summary.Text;
            _sectorExplorationText.IsVisible = summary.Total > 0;
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC] Sector exploration summary failed: {ex.Message}\n");
        }
        finally
        {
            _sectorExplorationRefreshRunning = false;
        }
    }
}
