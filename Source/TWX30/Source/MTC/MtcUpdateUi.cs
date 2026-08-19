using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

public partial class MainWindow
{
    private Border BuildUpdateBanner()
    {
        _updateBannerText = new TextBlock
        {
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center,
            TextWrapping = TextWrapping.NoWrap,
        };

        _updateBannerDownloadButton = new Button
        {
            Content = "Download",
            Background = new SolidColorBrush(Color.FromRgb(0, 220, 205)),
            Foreground = Brushes.Black,
            Padding = new Thickness(12, 4),
            Margin = new Thickness(8, 0, 0, 0),
            IsEnabled = false,
        };
        _updateBannerDownloadButton.Click += (_, _) => OpenPendingMtcUpdate();

        var closeButton = new Button
        {
            Content = "x",
            Background = Brushes.Transparent,
            Foreground = Brushes.White,
            Padding = new Thickness(10, 2),
            Margin = new Thickness(6, 0, 0, 0),
        };
        closeButton.Click += (_, _) => HideMtcUpdateBanner();

        var panel = new DockPanel { LastChildFill = true };
        DockPanel.SetDock(closeButton, Dock.Right);
        DockPanel.SetDock(_updateBannerDownloadButton, Dock.Right);
        panel.Children.Add(closeButton);
        panel.Children.Add(_updateBannerDownloadButton);
        panel.Children.Add(_updateBannerText);

        return new Border
        {
            IsVisible = false,
            Background = new SolidColorBrush(Color.FromRgb(8, 76, 89)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(0, 180, 190)),
            BorderThickness = new Thickness(0, 0, 0, 1),
            Padding = new Thickness(12, 6),
            Child = panel,
        };
    }

    private void QueueStartupMtcUpdateCheck()
    {
        if (!_appPrefs.UpdateChecksEnabled || !MtcUpdateService.IsAutomaticCheckDue(_appPrefs, DateTimeOffset.UtcNow))
            return;

        _updateCheckCts?.Cancel();
        _updateCheckCts?.Dispose();
        var cts = new CancellationTokenSource();
        _updateCheckCts = cts;

        _ = Task.Run(async () =>
        {
            var result = await MtcUpdateService.CheckAsync(_appPrefs, force: false, cts.Token).ConfigureAwait(false);
            await Dispatcher.UIThread.InvokeAsync(() => PresentMtcUpdateResult(result, manual: false));
        }, cts.Token);
    }

    private async Task OnCheckForMtcUpdatesAsync(bool force)
    {
        _updateCheckCts?.Cancel();
        _updateCheckCts?.Dispose();
        var cts = new CancellationTokenSource();
        _updateCheckCts = cts;

        var result = await MtcUpdateService.CheckAsync(_appPrefs, force, cts.Token).ConfigureAwait(false);
        await Dispatcher.UIThread.InvokeAsync(() => PresentMtcUpdateResult(result, manual: true));
    }

    private void PresentMtcUpdateResult(MtcUpdateCheckResult result, bool manual)
    {
        HideMtcUpdateBanner();

        if (result.Status == MtcUpdateCheckStatus.UpdateAvailable)
        {
            _pendingMtcUpdate = result;
            ShowMtcUpdateDialog(result);
            return;
        }

        if (manual && result.Status != MtcUpdateCheckStatus.Skipped)
            ShowMtcUpdateDialog(result);
    }

    private void HideMtcUpdateBanner()
    {
        if (_updateBanner != null)
            _updateBanner.IsVisible = false;
        _pendingMtcUpdate = null;
    }

    private void OpenPendingMtcUpdate()
    {
        if (_pendingMtcUpdate == null)
            return;

        try
        {
            MtcUpdateService.OpenDownload(_pendingMtcUpdate);
        }
        catch (Exception ex)
        {
            ShowMtcUpdateDialog(new MtcUpdateCheckResult(
                MtcUpdateCheckStatus.Failed,
                $"Unable to open download: {ex.Message}",
                MtcVersion.PackageVersion));
        }
    }

    private void ShowMtcUpdateDialog(MtcUpdateCheckResult result)
    {
        if (_mtcUpdateDialogOpen)
            return;

        _mtcUpdateDialogOpen = true;
        var dialog = new MtcUpdateDialog(result, MtcUpdateService.GetCurrentPlatformKey());
        dialog.Closed += (_, _) => _mtcUpdateDialogOpen = false;
        _ = dialog.ShowDialog<bool?>(this);
    }
}
