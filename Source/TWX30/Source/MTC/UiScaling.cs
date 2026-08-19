using System;
using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.LogicalTree;

namespace MTC;

public partial class MainWindow
{
    private const double DefaultShellFontSize = 13.0;
    private const double DefaultClassicSidebarWidth = 200.0;
    private readonly Dictionary<object, double> _uiBaseFontSizes = new();

    private double CurrentUiScale =>
        Math.Clamp(_terminalFontSize / TerminalControl.DefaultFontSize, 0.82, 1.55);

    private double UiSize(double value)
        => Math.Round(value * CurrentUiScale, 1, MidpointRounding.AwayFromZero);

    private double UiFontSize(double value)
        => Math.Round(value * CurrentUiScale, 1, MidpointRounding.AwayFromZero);

    private Thickness UiThickness(double uniform)
        => new(UiSize(uniform));

    private Thickness UiThickness(double left, double top, double right, double bottom)
        => new(UiSize(left), UiSize(top), UiSize(right), UiSize(bottom));

    private CornerRadius UiCornerRadius(double uniform)
        => new(UiSize(uniform));

    private double ScaledClassicSidebarWidth => UiSize(DefaultClassicSidebarWidth);
    private double ScaledNotesPanelWidth => UiSize(NotesPanelWidth);

    private void ApplyUiScaleToMainWindow()
    {
        double scale = CurrentUiScale;

        FontSize = UiFontSize(DefaultShellFontSize);
        MinWidth = UiSize(800);
        MinHeight = UiSize(500);
        if (Width < MinWidth)
            Width = MinWidth;
        if (Height < MinHeight)
            Height = MinHeight;

        _menuBar.FontSize = DefaultShellFontSize;
        _statusBar.Height = UiSize(34);
        _statusBarContent.Spacing = UiSize(8);
        _statusBarContent.Margin = UiThickness(8, 0, 8, 0);
        _statusText.FontSize = 13;
        _statusText.Margin = UiThickness(6, 0, 0, 0);
        _statusTerminalSizeText.FontSize = 12;
        _statusTerminalSizeText.Margin = UiThickness(10, 0, 10, 0);
        ApplyScaledFixedUiDimensions();

        ApplyUiFontScale(_menuBarHost, scale);
        ApplyUiFontScale(_shellHost, scale);
        ApplyUiFontScale(_statusBar, scale);
    }

    private void ApplyScaledFixedUiDimensions()
    {
        _menuFontSizeDecreaseButton.Width = UiSize(22);
        _menuFontSizeDecreaseButton.Height = UiSize(22);
        _menuFontSizeDecreaseButton.Padding = UiThickness(1);
        _menuFontSizeIncreaseButton.Width = UiSize(22);
        _menuFontSizeIncreaseButton.Height = UiSize(22);
        _menuFontSizeIncreaseButton.Padding = UiThickness(1);
        _menuFontSizeFrame.Padding = UiThickness(5, 2, 5, 2);

        if (_terminalRecordButton != null)
        {
            _terminalRecordButton.Width = UiSize(30);
            _terminalRecordButton.Height = UiSize(30);
            _terminalRecordButton.MinWidth = UiSize(30);
        }

        ApplyToolbarIconButtonDimensions(_statusMacrosButton);
        ApplyToolbarIconButtonDimensions(_statusMapButton);
        ApplyToolbarIconButtonDimensions(_statusCommButton);
        ApplyToolbarIconButtonDimensions(_statusBotButton);
        ApplyToolbarIconButtonDimensions(_statusStopAllButton);
        ApplyToolbarIconButtonDimensions(_statusHaggleButton);

        _statusLivePausedButton.MinWidth = UiSize(56);
        _statusLivePausedButton.Height = UiSize(20);
        _statusLivePausedButton.Padding = UiThickness(4, 1, 4, 1);
        _statusRedAlertButton.MinWidth = UiSize(84);
        _statusRedAlertButton.Height = UiSize(20);
        _statusRedAlertButton.Padding = UiThickness(6, 1, 6, 1);

        foreach (Border frame in new[]
                 {
                     _statusMacrosFrame,
                     _statusMapFrame,
                     _statusStopAllFrame,
                     _statusCommFrame,
                     _statusBotFrame,
                     _statusHaggleFrame,
                 })
        {
            frame.Padding = UiThickness(3, 2, 3, 2);
            frame.CornerRadius = UiCornerRadius(8);
        }

        _statusLivePausedFrame.Padding = UiThickness(4, 2, 4, 2);
        _statusLivePausedFrame.CornerRadius = UiCornerRadius(8);
        _statusRedAlertFrame.Padding = UiThickness(4, 2, 4, 2);
        _statusRedAlertFrame.CornerRadius = UiCornerRadius(8);
    }

    private void ApplyToolbarIconButtonDimensions(Button button)
    {
        var width = UiSize(28);
        button.Width = width;
        button.MinWidth = 0;
        button.MaxWidth = width;
        button.Height = UiSize(20);
        button.Padding = UiThickness(2, 1, 2, 1);
    }

    private void ApplyUiFontScale(Control root, double scale)
    {
        ApplyUiFontScaleToControl(root, scale);
        foreach (ILogical descendant in root.GetLogicalDescendants())
        {
            if (descendant is Control control)
                ApplyUiFontScaleToControl(control, scale);
        }
    }

    private void ApplyUiFontScaleToControl(Control control, double scale)
    {
        if (control is TerminalControl)
            return;

        switch (control)
        {
            case TextBlock textBlock:
                if (textBlock.IsSet(TextBlock.FontSizeProperty))
                    ScaleFontSize(textBlock, textBlock.FontSize, size => textBlock.FontSize = size, scale);
                break;
            case TemplatedControl templated:
                if (templated.IsSet(TemplatedControl.FontSizeProperty))
                    ScaleFontSize(templated, templated.FontSize, size => templated.FontSize = size, scale);
                break;
        }
    }

    private void ScaleFontSize(object key, double currentSize, Action<double> apply, double scale)
    {
        if (currentSize <= 0 || double.IsNaN(currentSize) || double.IsInfinity(currentSize))
            return;

        if (!_uiBaseFontSizes.TryGetValue(key, out double baseSize))
        {
            baseSize = currentSize;
            _uiBaseFontSizes[key] = baseSize;
        }

        apply(Math.Round(baseSize * scale, 1, MidpointRounding.AwayFromZero));
    }
}
