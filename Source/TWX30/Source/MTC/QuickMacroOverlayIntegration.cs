using System;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

public partial class MainWindow
{
    private const double QuickMacroOverlayBaseWidth = 760;
    private const double QuickMacroOverlayBaseHeight = 48;

    private bool IsActiveQuickMacroOverlayVisible()
        => ActiveMtcTab?.QuickMacroPlayOverlay is { IsVisible: true };

    private void ShowQuickMacroOverlay(MtcTabPrototype? owner, string macroText)
    {
        owner ??= ActiveMtcTab;
        if (owner is null)
            return;

        if (owner.QuickMacroPlayOverlay is { } existing)
        {
            existing.SetMacroText(macroText);
            existing.IsVisible = true;
            existing.ZIndex = 1100;
            RefreshQuickMacroOverlayVisibility();
            return;
        }

        var overlay = new QuickMacroPlayOverlay(
            macroText,
            UiSize(QuickMacroOverlayBaseWidth),
            UiSize(QuickMacroOverlayBaseHeight),
            UiFontSize(12.5),
            (macro, count) => ExecuteInOptionalMtcTabSessionAsync(owner, () => PlayQuickMacroOverlayAsync(macro, count)),
            () => CloseQuickMacroOverlay(owner),
            FocusActiveTerminal);

        owner.QuickMacroPlayOverlay = overlay;
        _quickMacroOverlayLayer.Children.Add(overlay);
        PositionQuickMacroOverlay(overlay);
        RefreshQuickMacroOverlayVisibility();
        FocusActiveTerminal();

        Dispatcher.UIThread.Post(() =>
        {
            PositionQuickMacroOverlay(overlay);
            RefreshQuickMacroOverlayVisibility();
        }, DispatcherPriority.Loaded);
    }

    private void CloseQuickMacroOverlay(MtcTabPrototype? owner)
    {
        if (owner?.QuickMacroPlayOverlay is not { } overlay)
            return;

        _quickMacroOverlayLayer.Children.Remove(overlay);
        owner.QuickMacroPlayOverlay = null;
        RefreshQuickMacroOverlayVisibility();
    }

    private void RefreshQuickMacroOverlayVisibility()
    {
        bool anyVisible = false;
        foreach (MtcTabPrototype tab in _mtcTabs)
        {
            if (tab.QuickMacroPlayOverlay is not { } overlay)
                continue;

            bool visible = tab.Id == _activeMtcTabId;
            overlay.IsVisible = visible;
            anyVisible |= visible;
            if (visible)
                overlay.ZIndex = 1100;
        }

        _quickMacroOverlayLayer.IsVisible = anyVisible;
        _quickMacroOverlayLayer.IsHitTestVisible = anyVisible;
    }

    private void ClampQuickMacroOverlays()
    {
        foreach (QuickMacroPlayOverlay overlay in _mtcTabs.Select(tab => tab.QuickMacroPlayOverlay).OfType<QuickMacroPlayOverlay>())
            ClampQuickMacroOverlay(overlay);
    }

    private void PositionQuickMacroOverlay(QuickMacroPlayOverlay overlay)
    {
        double width = overlay.Width;
        double height = overlay.Height;
        double layerWidth = _quickMacroOverlayLayer.Bounds.Width > 0 ? _quickMacroOverlayLayer.Bounds.Width : Bounds.Width;
        double tabStripHeight = _tabStripHost.Bounds.Height > 0 ? _tabStripHost.Bounds.Height : UiSize(42);
        double rightMargin = UiSize(8);
        double left = Math.Max(UiSize(8), layerWidth - width - rightMargin);
        double top = Math.Max(UiSize(3), (tabStripHeight - height) / 2);

        Canvas.SetLeft(overlay, left);
        Canvas.SetTop(overlay, top);
        ClampQuickMacroOverlay(overlay);
    }

    private void ClampQuickMacroOverlay(QuickMacroPlayOverlay overlay)
    {
        double layerWidth = _quickMacroOverlayLayer.Bounds.Width > 0 ? _quickMacroOverlayLayer.Bounds.Width : Bounds.Width;
        double layerHeight = _quickMacroOverlayLayer.Bounds.Height > 0 ? _quickMacroOverlayLayer.Bounds.Height : Bounds.Height;
        double maxLeft = Math.Max(0, layerWidth - overlay.Width);
        double maxTop = Math.Max(0, layerHeight - overlay.Height);
        double left = Canvas.GetLeft(overlay);
        double top = Canvas.GetTop(overlay);
        double rightMargin = UiSize(8);
        if (double.IsNaN(left))
            left = Math.Max(0, maxLeft - rightMargin);
        if (double.IsNaN(top))
        {
            double tabStripHeight = _tabStripHost.Bounds.Height > 0 ? _tabStripHost.Bounds.Height : UiSize(42);
            top = Math.Max(UiSize(3), (tabStripHeight - overlay.Height) / 2);
        }

        Canvas.SetLeft(overlay, Math.Clamp(left, 0, maxLeft));
        Canvas.SetTop(overlay, Math.Clamp(top, 0, maxTop));
    }

    private async Task<string?> PlayQuickMacroOverlayAsync(string macroText, int count)
    {
        if (_temporaryMacroRecording)
            return null;

        if (!HasActiveMacroConnection())
        {
            ShowMacroNotice("quick macro playback requires an active connection");
            return null;
        }

        if (string.IsNullOrWhiteSpace(macroText))
        {
            ShowMacroNotice("quick macro is empty");
            return null;
        }

        if (!TryDecodeTemporaryMacroText(macroText, out byte[] macroBytes, out string? decodeError))
        {
            ShowMacroNotice(decodeError ?? "quick macro is invalid");
            return null;
        }

        string? error = await PlayTemporaryMacroBurstAsync([macroBytes], Math.Clamp(count, 1, 1000));
        if (!string.IsNullOrWhiteSpace(error))
            ShowMacroNotice(error);
        return null;
    }
}
