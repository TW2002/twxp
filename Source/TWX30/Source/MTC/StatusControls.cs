using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Avalonia;
using Avalonia.Platform;
using Avalonia.Platform.Storage;
using SkiaSharp;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private void ConfigureStatusModeSelector()
    {
        ConfigureStatusMacrosButton();
        ConfigureStatusMapButton();
        ConfigureStatusStopAllButton();
        ConfigureStatusCommButton();
        ConfigureStatusBotButton();
        ConfigureStatusDockShopperButton();
        ConfigureStatusHaggleButton();
        ConfigureStatusToggleButton();
        ConfigureStatusRedAlertButton();

        _statusMacrosFrame.Padding = new Thickness(3, 2);
        _statusMacrosFrame.CornerRadius = new CornerRadius(8);
        _statusMacrosFrame.Child = _statusMacrosButton;

        _statusMapFrame.Padding = new Thickness(3, 2);
        _statusMapFrame.CornerRadius = new CornerRadius(8);
        _statusMapFrame.Child = _statusMapButton;

        _statusStopAllFrame.Padding = new Thickness(3, 2);
        _statusStopAllFrame.CornerRadius = new CornerRadius(8);
        _statusStopAllFrame.Child = _statusStopAllButton;

        _statusCommFrame.Padding = new Thickness(3, 2);
        _statusCommFrame.CornerRadius = new CornerRadius(8);
        _statusCommFrame.Child = _statusCommButton;

        _statusBotFrame.Padding = new Thickness(3, 2);
        _statusBotFrame.CornerRadius = new CornerRadius(8);
        _statusBotFrame.Child = _statusBotButton;

        _statusDockShopperFrame.Padding = new Thickness(3, 2);
        _statusDockShopperFrame.CornerRadius = new CornerRadius(8);
        _statusDockShopperFrame.Child = _statusDockShopperButton;

        _statusHaggleFrame.Padding = new Thickness(3, 2);
        _statusHaggleFrame.CornerRadius = new CornerRadius(8);
        _statusHaggleFrame.Child = _statusHaggleButton;

        _statusLivePausedFrame.Padding = new Thickness(4, 2);
        _statusLivePausedFrame.CornerRadius = new CornerRadius(8);
        _statusLivePausedFrame.Child = _statusLivePausedButton;

        _statusRedAlertFrame.Padding = new Thickness(4, 2);
        _statusRedAlertFrame.CornerRadius = new CornerRadius(8);
        _statusRedAlertFrame.Child = _statusRedAlertButton;

        UpdateTerminalLiveSelector();
    }

    private void ConfigureStatusMacrosButton()
    {
        _statusMacrosButton.MinWidth = 0;
        _statusMacrosButton.Width = 28;
        _statusMacrosButton.Height = 20;
        _statusMacrosButton.Padding = new Thickness(2, 1);
        _statusMacrosButton.Focusable = false;
        _statusMacrosButton.VerticalAlignment = VerticalAlignment.Center;
        _statusMacrosButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusMacrosButton.Content = BuildStatusMacrosIcon();
        ToolTip.SetTip(_statusMacrosButton, "Open macro settings");
        _statusMacrosButton.Click += (_, _) =>
        {
            _ = OnMacrosAsync();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusMacrosButton.PointerEntered += (_, _) =>
        {
            _statusMacrosHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusMacrosButton.PointerExited += (_, _) =>
        {
            _statusMacrosHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private Control BuildStatusMacrosIcon()
    {
        _statusMacrosLineTop = BuildStatusMacrosLine(new Thickness(1, 2, 5, 0), 10);
        _statusMacrosLineMiddle = BuildStatusMacrosLine(new Thickness(1, 0, 5, 0), 12);
        _statusMacrosLineBottom = BuildStatusMacrosLine(new Thickness(1, 0, 5, 2), 8);
        _statusMacrosPlay = new Avalonia.Controls.Shapes.Path
        {
            Width = 5.5,
            Height = 6.5,
            Stretch = Stretch.Fill,
            Data = Geometry.Parse("M 0,0 L 5.5,3.25 L 0,6.5 Z"),
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 1, 0),
            IsHitTestVisible = false,
        };

        return new Grid
        {
            Width = 18,
            Height = 16,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                new StackPanel
                {
                    Spacing = 2,
                    HorizontalAlignment = HorizontalAlignment.Left,
                    VerticalAlignment = VerticalAlignment.Center,
                    Children =
                    {
                        _statusMacrosLineTop,
                        _statusMacrosLineMiddle,
                        _statusMacrosLineBottom,
                    },
                },
                _statusMacrosPlay,
            },
        };
    }

    private static Border BuildStatusMacrosLine(Thickness margin, double width)
    {
        return new Border
        {
            Width = width,
            Height = 2,
            CornerRadius = new CornerRadius(1),
            Margin = margin,
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Center,
            IsHitTestVisible = false,
        };
    }

    private void ConfigureStatusMapButton()
    {
        _statusMapButton.MinWidth = 0;
        _statusMapButton.Width = 28;
        _statusMapButton.Height = 20;
        _statusMapButton.Padding = new Thickness(2, 1);
        _statusMapButton.Focusable = false;
        _statusMapButton.VerticalAlignment = VerticalAlignment.Center;
        _statusMapButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusMapButton.Content = BuildStatusMapIcon();
        ToolTip.SetTip(_statusMapButton, "Open map window");
        _statusMapButton.Click += (_, _) =>
        {
            OnViewMap();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusMapButton.PointerEntered += (_, _) =>
        {
            _statusMapHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusMapButton.PointerExited += (_, _) =>
        {
            _statusMapHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private Control BuildStatusMapIcon()
    {
        _statusMapPanelLeft = new Border
        {
            Width = 4.5,
            Height = 12,
            CornerRadius = new CornerRadius(1.4, 0.8, 0.8, 1.4),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Center,
            RenderTransform = new SkewTransform(-8, 0),
            Margin = new Thickness(0, 0, 0, 0),
        };

        _statusMapPanelCenter = new Border
        {
            Width = 5,
            Height = 12,
            CornerRadius = new CornerRadius(0.8),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };

        _statusMapPanelRight = new Border
        {
            Width = 4.5,
            Height = 12,
            CornerRadius = new CornerRadius(0.8, 1.4, 1.4, 0.8),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
            RenderTransform = new SkewTransform(8, 0),
            Margin = new Thickness(0, 0, 0, 0),
        };

        _statusMapRoute = new Avalonia.Controls.Shapes.Path
        {
            Width = 16,
            Height = 12,
            Stretch = Stretch.Fill,
            StrokeThickness = 1.1,
            Data = Geometry.Parse("M 2,9 L 6,5 L 10,7 L 14,3"),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            IsHitTestVisible = false,
        };

        _statusMapNodeA = BuildStatusMapNode(new Thickness(1, 8, 0, 0), HorizontalAlignment.Left);
        _statusMapNodeB = BuildStatusMapNode(new Thickness(0, 4, 0, 0), HorizontalAlignment.Center);
        _statusMapNodeC = BuildStatusMapNode(new Thickness(0, 2, 1, 0), HorizontalAlignment.Right);

        return new Grid
        {
            Width = 18,
            Height = 16,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                new Grid
                {
                    Width = 15,
                    Height = 12,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    Children =
                    {
                        _statusMapPanelLeft,
                        _statusMapPanelCenter,
                        _statusMapPanelRight,
                    },
                },
                _statusMapRoute,
                _statusMapNodeA,
                _statusMapNodeB,
                _statusMapNodeC,
            },
        };
    }

    private static Border BuildStatusMapNode(Thickness margin, HorizontalAlignment alignment)
    {
        return new Border
        {
            Width = 2.8,
            Height = 2.8,
            CornerRadius = new CornerRadius(1.4),
            HorizontalAlignment = alignment,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = margin,
            IsHitTestVisible = false,
        };
    }

    private void ConfigureStatusStopAllButton()
    {
        _statusStopAllButton.MinWidth = 0;
        _statusStopAllButton.Width = 28;
        _statusStopAllButton.Height = 20;
        _statusStopAllButton.Padding = new Thickness(2, 1);
        _statusStopAllButton.Focusable = false;
        _statusStopAllButton.VerticalAlignment = VerticalAlignment.Center;
        _statusStopAllButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusStopAllButton.Content = BuildStatusStopAllIcon();
        ToolTip.SetTip(_statusStopAllButton, "Force stop active scripts and modes");
        _statusStopAllButton.Click += (_, _) =>
        {
            _ = OnProxyForceStopInterruptibleScriptsAsync();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusStopAllButton.PointerEntered += (_, _) =>
        {
            _statusStopAllHovered = true;
            RefreshStatusBar();
        };
        _statusStopAllButton.PointerExited += (_, _) =>
        {
            _statusStopAllHovered = false;
            RefreshStatusBar();
        };
    }

    private Control BuildStatusStopAllIcon()
    {
        _statusStopAllSign = new Avalonia.Controls.Shapes.Path
        {
            Width = 15,
            Height = 15,
            Stretch = Stretch.Fill,
            StrokeThickness = 1.1,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Data = Geometry.Parse("M 5,0 L 10,0 L 15,5 L 15,10 L 10,15 L 5,15 L 0,10 L 0,5 Z"),
        };

        _statusStopAllLabel = new TextBlock
        {
            Text = "STOP",
            FontSize = 4.8,
            FontWeight = FontWeight.Bold,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, -0.5, 0, 0),
        };

        return new Grid
        {
            Width = 18,
            Height = 18,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                _statusStopAllSign,
                _statusStopAllLabel,
            },
        };
    }

    private void ConfigureStatusCommButton()
    {
        _statusCommButton.MinWidth = 0;
        _statusCommButton.Width = 28;
        _statusCommButton.Height = 20;
        _statusCommButton.Padding = new Thickness(2, 1);
        _statusCommButton.Focusable = false;
        _statusCommButton.VerticalAlignment = VerticalAlignment.Center;
        _statusCommButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusCommButton.Content = BuildStatusCommIcon();
        ToolTip.SetTip(_statusCommButton, "Toggle Comm Window");
        _statusCommButton.Click += (_, _) =>
        {
            ToggleCommWindow();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusCommButton.PointerEntered += (_, _) =>
        {
            _statusCommHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusCommButton.PointerExited += (_, _) =>
        {
            _statusCommHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private void ConfigureStatusBotButton()
    {
        _statusBotButton.MinWidth = 0;
        _statusBotButton.Width = 28;
        _statusBotButton.Height = 20;
        _statusBotButton.Padding = new Thickness(2, 1);
        _statusBotButton.Focusable = false;
        _statusBotButton.VerticalAlignment = VerticalAlignment.Center;
        _statusBotButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusBotButton.Content = BuildStatusBotIcon();
        ToolTip.SetTip(_statusBotButton, "Start or stop native MomBot");
        _statusBotButton.Click += async (_, _) =>
        {
            await ToggleNativeMombotFromToolbarAsync();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusBotButton.PointerEntered += (_, _) =>
        {
            _statusBotHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusBotButton.PointerExited += (_, _) =>
        {
            _statusBotHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private void ConfigureStatusDockShopperButton()
    {
        _statusDockShopperButton.MinWidth = 0;
        _statusDockShopperButton.Width = 28;
        _statusDockShopperButton.Height = 20;
        _statusDockShopperButton.Padding = new Thickness(2, 1);
        _statusDockShopperButton.Focusable = false;
        _statusDockShopperButton.VerticalAlignment = VerticalAlignment.Center;
        _statusDockShopperButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusDockShopperButton.Content = BuildStatusDockShopperIcon();
        ToolTip.SetTip(_statusDockShopperButton, "Open Dock Shopper");
        _statusDockShopperButton.Click += async (_, _) =>
        {
            await ShowDockShopperAsync();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusDockShopperButton.PointerEntered += (_, _) =>
        {
            _statusDockShopperHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusDockShopperButton.PointerExited += (_, _) =>
        {
            _statusDockShopperHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private Control BuildStatusCommIcon()
    {
        _statusCommFlap = new Border
        {
            Width = 10,
            Height = 5,
            CornerRadius = new CornerRadius(4, 4, 2, 2),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, -1),
        };

        _statusCommIndicator = new Border
        {
            Width = 4,
            Height = 4,
            CornerRadius = new CornerRadius(2),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 1),
        };

        _statusCommBody = new Border
        {
            Width = 16,
            Height = 11,
            CornerRadius = new CornerRadius(3),
            BorderThickness = new Thickness(1),
            Child = new StackPanel
            {
                Spacing = 1,
                Margin = new Thickness(2, 1, 2, 1),
                Children =
                {
                    _statusCommIndicator,
                    BuildStatusCommGrilleLine(9),
                    BuildStatusCommGrilleLine(9),
                    BuildStatusCommGrilleLine(8),
                },
            },
        };

        return new StackPanel
        {
            Spacing = 0,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                _statusCommFlap,
                _statusCommBody,
            },
        };
    }

    private Control BuildStatusBotIcon()
    {
        _statusBotAntenna = new Border
        {
            Width = 1.5,
            Height = 3,
            CornerRadius = new CornerRadius(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 0, 0, -1),
        };

        _statusBotAntennaTip = new Border
        {
            Width = 3,
            Height = 3,
            CornerRadius = new CornerRadius(1.5),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Top,
        };

        _statusBotEyeLeft = new Border
        {
            Width = 2.4,
            Height = 2.4,
            CornerRadius = new CornerRadius(1.2),
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
        };

        _statusBotEyeRight = new Border
        {
            Width = 2.4,
            Height = 2.4,
            CornerRadius = new CornerRadius(1.2),
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
        };

        var eyes = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition { Width = GridLength.Auto },
                new ColumnDefinition { Width = new GridLength(3) },
                new ColumnDefinition { Width = GridLength.Auto },
            },
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                _statusBotEyeLeft,
                _statusBotEyeRight,
            },
        };
        Grid.SetColumn(_statusBotEyeRight, 2);

        _statusBotHead = new Border
        {
            Width = 12,
            Height = 8,
            CornerRadius = new CornerRadius(2),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Padding = new Thickness(2, 0),
            Child = eyes,
        };

        _statusBotBody = new Border
        {
            Width = 9,
            Height = 4,
            CornerRadius = new CornerRadius(1.5),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 1, 0, 0),
        };

        return new StackPanel
        {
            Spacing = 0,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                _statusBotAntennaTip,
                _statusBotAntenna,
                _statusBotHead,
                _statusBotBody,
            },
        };
    }

    private static Control BuildStatusDockShopperIcon()
    {
        return new Grid
        {
            Width = 18,
            Height = 16,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                new Avalonia.Controls.Shapes.Path
                {
                    Name = "CartBasket",
                    Width = 16,
                    Height = 10,
                    Stretch = Stretch.Fill,
                    StrokeThickness = 1.25,
                    Data = Geometry.Parse("M 2,1 L 4,1 L 5.2,8 L 14,8 L 16,3 L 5,3"),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Top,
                    Margin = new Thickness(0, 1, 0, 0),
                    IsHitTestVisible = false,
                },
                new Avalonia.Controls.Shapes.Path
                {
                    Name = "CartCargo",
                    Width = 9,
                    Height = 4,
                    Stretch = Stretch.Fill,
                    StrokeThickness = 1,
                    Data = Geometry.Parse("M 0,4 L 2,0 L 7,0 L 9,4"),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Top,
                    Margin = new Thickness(3, 4, 0, 0),
                    IsHitTestVisible = false,
                },
                new Border
                {
                    Name = "CartWheelLeft",
                    Width = 3.2,
                    Height = 3.2,
                    CornerRadius = new CornerRadius(1.6),
                    HorizontalAlignment = HorizontalAlignment.Left,
                    VerticalAlignment = VerticalAlignment.Bottom,
                    Margin = new Thickness(5, 0, 0, 0),
                    IsHitTestVisible = false,
                },
                new Border
                {
                    Name = "CartWheelRight",
                    Width = 3.2,
                    Height = 3.2,
                    CornerRadius = new CornerRadius(1.6),
                    HorizontalAlignment = HorizontalAlignment.Right,
                    VerticalAlignment = VerticalAlignment.Bottom,
                    Margin = new Thickness(0, 0, 2, 0),
                    IsHitTestVisible = false,
                },
            },
        };
    }

    private static Border BuildStatusCommGrilleLine(double width)
    {
        return new Border
        {
            Width = width,
            Height = 1,
            CornerRadius = new CornerRadius(1),
            Background = new SolidColorBrush(Color.Parse("#B7D5DF")),
            HorizontalAlignment = HorizontalAlignment.Center,
            Opacity = 0.9,
        };
    }

    private void ConfigureStatusHaggleButton()
    {
        _statusHaggleButton.MinWidth = 0;
        _statusHaggleButton.Width = 28;
        _statusHaggleButton.Height = 20;
        _statusHaggleButton.Padding = new Thickness(2, 1);
        _statusHaggleButton.Focusable = false;
        _statusHaggleButton.VerticalAlignment = VerticalAlignment.Center;
        _statusHaggleButton.HorizontalAlignment = HorizontalAlignment.Center;
        _statusHaggleButton.Content = BuildStatusHaggleIcon();
        ToolTip.SetTip(_statusHaggleButton, "Toggle native haggle");
        _statusHaggleButton.Click += (_, _) =>
        {
            OnHaggleToggleRequested();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusHaggleButton.PointerEntered += (_, _) =>
        {
            _statusHaggleHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusHaggleButton.PointerExited += (_, _) =>
        {
            _statusHaggleHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private Control BuildStatusHaggleIcon()
    {
        _statusHaggleSpark = new Border
        {
            Width = 3,
            Height = 3,
            CornerRadius = new CornerRadius(1.5),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 0, 0, 0),
        };

        _statusHaggleStem = new Border
        {
            Width = 1.5,
            Height = 8,
            CornerRadius = new CornerRadius(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 2, 0, 0),
        };

        _statusHaggleBeam = new Border
        {
            Width = 12,
            Height = 1.6,
            CornerRadius = new CornerRadius(1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 4.5, 0, 0),
        };

        _statusHaggleLeftLink = new Border
        {
            Width = 1.2,
            Height = 3.6,
            CornerRadius = new CornerRadius(0.8),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(3.2, 5.7, 0, 0),
        };

        _statusHaggleRightLink = new Border
        {
            Width = 1.2,
            Height = 3.6,
            CornerRadius = new CornerRadius(0.8),
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 5.7, 3.2, 0),
        };

        _statusHaggleLeftPan = new Border
        {
            Width = 5.6,
            Height = 2.6,
            CornerRadius = new CornerRadius(1.3),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(1.1, 9.4, 0, 0),
        };

        _statusHaggleRightPan = new Border
        {
            Width = 5.6,
            Height = 2.6,
            CornerRadius = new CornerRadius(1.3),
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(0, 9.4, 1.1, 0),
        };

        _statusHaggleBase = new Border
        {
            Width = 8,
            Height = 2.1,
            CornerRadius = new CornerRadius(1.1),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Bottom,
            Margin = new Thickness(0, 0, 0, 1.2),
        };

        return new Grid
        {
            Width = 18,
            Height = 16,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                _statusHaggleSpark,
                _statusHaggleStem,
                _statusHaggleBeam,
                _statusHaggleLeftLink,
                _statusHaggleRightLink,
                _statusHaggleLeftPan,
                _statusHaggleRightPan,
                _statusHaggleBase,
            },
        };
    }

    private void ConfigureStatusToggleButton()
    {
        _statusLivePausedButton.MinWidth = 56;
        _statusLivePausedButton.Height = 20;
        _statusLivePausedButton.Padding = new Thickness(4, 1);
        _statusLivePausedButton.Focusable = false;
        _statusLivePausedButton.FontSize = 11;
        _statusLivePausedButton.FontWeight = FontWeight.SemiBold;
        _statusLivePausedButton.VerticalAlignment = VerticalAlignment.Center;
        _statusLivePausedButton.Click += (_, _) =>
        {
            SetTerminalLivePaused(!_terminalLivePaused);
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
        _statusLivePausedButton.PointerEntered += (_, _) =>
        {
            _statusLivePausedHovered = true;
            UpdateTerminalLiveSelector();
        };
        _statusLivePausedButton.PointerExited += (_, _) =>
        {
            _statusLivePausedHovered = false;
            UpdateTerminalLiveSelector();
        };
    }

    private void ConfigureStatusRedAlertButton()
    {
        _statusRedAlertButton.MinWidth = 84;
        _statusRedAlertButton.Height = 20;
        _statusRedAlertButton.Padding = new Thickness(6, 1);
        _statusRedAlertButton.Focusable = false;
        _statusRedAlertButton.FontSize = 10.5;
        _statusRedAlertButton.FontWeight = FontWeight.Bold;
        _statusRedAlertButton.VerticalAlignment = VerticalAlignment.Center;
        ToolTip.SetTip(_statusRedAlertButton, "Clear active red alert");
        _statusRedAlertButton.Click += (_, _) =>
        {
            if (_redAlertEnabled)
                ClearRedAlert();
            PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
        };
    }

    private void UpdateTerminalLiveSelector()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(UpdateTerminalLiveSelector, DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        bool enabled = _gameInstance != null;
        bool remoteProxyScripts = CanUseRemoteProxyScripts();
        bool haggleAvailable = enabled || remoteProxyScripts || (!_state.EmbeddedProxy && _telnet.IsConnected);
        bool haggleSelected = enabled
            ? _gameInstance?.NativeHaggleEnabled == true
            : !remoteProxyScripts && _standaloneNativeHaggle.Enabled;
        BotRuntimeState botRuntime = GetBotRuntimeState();
        bool nativeBotAvailable = enabled && (botRuntime.NativeRunning || IsNativeMombotConfiguredForStart());
        MTC.mombot.mombotStatusSnapshot botSnapshot = _mombot.GetStatusSnapshot();
        bool dockShopperAvailable = enabled && botSnapshot.Enabled && botSnapshot.AcceptSelfCommands;
        ApplyStatusToggleFrameStyle(_statusMacrosFrame, true);
        ApplyStatusToggleFrameStyle(_statusMapFrame, true);
        ApplyStatusToggleFrameStyle(_statusCommFrame, true);
        ApplyStatusToggleFrameStyle(_statusBotFrame, nativeBotAvailable);
        ApplyStatusToggleFrameStyle(_statusDockShopperFrame, dockShopperAvailable);
        ApplyStatusToggleFrameStyle(_statusHaggleFrame, haggleAvailable);
        ApplyStatusToggleFrameStyle(_statusLivePausedFrame, enabled);
        ApplyStatusToggleFrameStyle(_statusRedAlertFrame, _appPrefs.EnableRedAlertMode);
        _statusRedAlertFrame.IsVisible = _appPrefs.EnableRedAlertMode && _redAlertEnabled;

        ApplyStatusMacrosButtonStyle(_statusMacrosButton, ActiveMtcTab?.MacroSettingsDialog is { IsVisible: true });
        ApplyStatusMapButtonStyle(_statusMapButton, ActiveMtcTab?.MapWindow is { IsVisible: true });
        ApplyStatusCommButtonStyle(_statusCommButton, _commWindowVisible);
        ApplyStatusBotButtonStyle(_statusBotButton, selected: botRuntime.NativeRunning, nativeBotAvailable);
        ApplyStatusDockShopperButtonStyle(_statusDockShopperButton, dockShopperAvailable);
        ApplyStatusHaggleButtonStyle(_statusHaggleButton, selected: haggleSelected, haggleAvailable);
        ToolTip.SetTip(_statusBotButton,
            nativeBotAvailable
                ? "Start or stop native MomBot"
                : "Configure native MomBot before starting");
        ToolTip.SetTip(_statusHaggleButton,
            !haggleAvailable
                ? "Native haggle unavailable"
                : remoteProxyScripts
                    ? "Toggle native haggle in standalone proxy"
                    : (haggleSelected ? "Disable native haggle" : "Enable native haggle"));
        ToolTip.SetTip(_statusDockShopperButton,
            dockShopperAvailable
                ? "Open Dock Shopper"
                : "Enable native Mombot before shopping");
        _statusLivePausedButton.Content = enabled && _statusLivePausedHovered
            ? (_terminalLivePaused ? "RESUME" : "PAUSE")
            : (_terminalLivePaused ? "PAUSED" : "LIVE");
        ApplyStatusModeButtonStyle(_statusLivePausedButton, paused: _terminalLivePaused, enabled);
        ApplyStatusRedAlertButtonStyle(_statusRedAlertButton, _redAlertEnabled);
    }

    private void ApplyStatusToggleFrameStyle(Border frame, bool enabled)
    {
        frame.Background = HudFrame;
        frame.BorderBrush = HudInnerEdge;
        frame.BorderThickness = new Thickness(1);
        frame.Opacity = enabled ? 1.0 : 0.55;
    }

    private void ApplyStatusStopAllButtonStyle(Button button, bool enabled)
    {
        button.IsEnabled = enabled;
        button.Background = enabled
            ? (_statusStopAllHovered ? new SolidColorBrush(Color.Parse("#291617")) : HudFrame)
            : HudFrame;
        button.BorderBrush = enabled
            ? (_statusStopAllHovered ? new SolidColorBrush(Color.Parse("#8D3B3B")) : HudInnerEdge)
            : HudInnerEdge;
        button.BorderThickness = new Thickness(1);
        button.Foreground = Brushes.Transparent;

        if (_statusStopAllSign != null)
        {
            _statusStopAllSign.Fill = enabled
                ? (_statusStopAllHovered ? new SolidColorBrush(Color.Parse("#F04438")) : new SolidColorBrush(Color.Parse("#C81E1E")))
                : new SolidColorBrush(Color.Parse("#5D3030"));
            _statusStopAllSign.Stroke = enabled
                ? (_statusStopAllHovered ? new SolidColorBrush(Color.Parse("#FFE0DB")) : new SolidColorBrush(Color.Parse("#FFD0C7")))
                : HudInnerEdge;
        }

        if (_statusStopAllLabel != null)
        {
            _statusStopAllLabel.Foreground = enabled ? Brushes.White : HudMuted;
            _statusStopAllLabel.Opacity = enabled ? 1.0 : 0.72;
        }
    }

    private void ApplyStatusHaggleButtonStyle(Button button, bool selected, bool enabled)
    {
        button.IsEnabled = enabled;
        button.Background = selected
            ? new SolidColorBrush(Color.Parse("#F5C158"))
            : (_statusHaggleHovered ? HudHeaderAlt : HudFrame);
        button.BorderBrush = selected
            ? new SolidColorBrush(Color.Parse("#FFE19B"))
            : (_statusHaggleHovered ? HudAccent : HudInnerEdge);
        button.BorderThickness = new Thickness(1);
        button.Foreground = Brushes.Transparent;

        Color lineColor = selected
            ? Color.Parse("#6A4710")
            : (_statusHaggleHovered ? Color.Parse("#CFEAF3") : Color.Parse("#7F97A1"));
        Color panFillColor = selected
            ? Color.Parse("#FFF2C9")
            : (_statusHaggleHovered ? Color.Parse("#243845") : Color.Parse("#17242D"));
        Color panBorderColor = selected
            ? Color.Parse("#8A5F18")
            : (_statusHaggleHovered ? Color.Parse("#9FC0CB") : Color.Parse("#6B8590"));
        Color sparkColor = selected
            ? Color.Parse("#FFF9E7")
            : (_statusHaggleHovered ? Color.Parse("#F1D58A") : Color.Parse("#7F8E95"));
        Color baseColor = selected
            ? Color.Parse("#7E5617")
            : (_statusHaggleHovered ? Color.Parse("#A7D8E4") : Color.Parse("#6B818B"));

        if (_statusHaggleSpark != null)
            _statusHaggleSpark.Background = new SolidColorBrush(sparkColor);
        if (_statusHaggleBeam != null)
            _statusHaggleBeam.Background = new SolidColorBrush(lineColor);
        if (_statusHaggleStem != null)
            _statusHaggleStem.Background = new SolidColorBrush(lineColor);
        if (_statusHaggleLeftLink != null)
            _statusHaggleLeftLink.Background = new SolidColorBrush(lineColor);
        if (_statusHaggleRightLink != null)
            _statusHaggleRightLink.Background = new SolidColorBrush(lineColor);
        if (_statusHaggleBase != null)
            _statusHaggleBase.Background = new SolidColorBrush(baseColor);

        if (_statusHaggleLeftPan != null)
        {
            _statusHaggleLeftPan.Background = new SolidColorBrush(panFillColor);
            _statusHaggleLeftPan.BorderBrush = new SolidColorBrush(panBorderColor);
        }

        if (_statusHaggleRightPan != null)
        {
            _statusHaggleRightPan.Background = new SolidColorBrush(panFillColor);
            _statusHaggleRightPan.BorderBrush = new SolidColorBrush(panBorderColor);
        }
    }

    private void ApplyStatusMacrosButtonStyle(Button button, bool selected)
    {
        button.IsEnabled = true;
        button.Background = selected
            ? new SolidColorBrush(Color.Parse("#5CD5FF"))
            : (_statusMacrosHovered ? HudHeaderAlt : HudFrame);
        button.BorderBrush = selected
            ? HudAccentHot
            : (_statusMacrosHovered ? HudAccent : HudInnerEdge);
        button.BorderThickness = new Thickness(1);

        Color lineColor = selected
            ? Color.Parse("#E8FBFF")
            : (_statusMacrosHovered ? Color.Parse("#A7F1FF") : Color.Parse("#7CD0DE"));
        Color playColor = selected
            ? Color.Parse("#FFE28A")
            : (_statusMacrosHovered ? Color.Parse("#DDFBFF") : Color.Parse("#B7D5DF"));

        if (_statusMacrosLineTop != null)
            _statusMacrosLineTop.Background = new SolidColorBrush(lineColor);
        if (_statusMacrosLineMiddle != null)
            _statusMacrosLineMiddle.Background = new SolidColorBrush(lineColor);
        if (_statusMacrosLineBottom != null)
            _statusMacrosLineBottom.Background = new SolidColorBrush(lineColor);
        if (_statusMacrosPlay != null)
            _statusMacrosPlay.Fill = new SolidColorBrush(playColor);
    }

    private void ApplyStatusCommButtonStyle(Button button, bool selected)
    {
        button.IsEnabled = true;
        button.Background = selected
            ? new SolidColorBrush(Color.Parse("#5CD5FF"))
            : (_statusCommHovered ? HudHeaderAlt : HudFrame);
        button.BorderBrush = selected
            ? HudAccentHot
            : (_statusCommHovered ? HudAccent : HudInnerEdge);
        button.BorderThickness = new Thickness(1);

        if (_statusCommFlap != null)
        {
            _statusCommFlap.Background = new SolidColorBrush(selected
                ? Color.Parse("#F7E4A5")
                : (_statusCommHovered ? Color.Parse("#E4C57B") : Color.Parse("#BE9952")));
            _statusCommFlap.BorderBrush = new SolidColorBrush(selected
                ? Color.Parse("#FFF4D0")
                : Color.Parse("#7D6031"));
        }

        if (_statusCommBody != null)
        {
            _statusCommBody.Background = new SolidColorBrush(selected
                ? Color.Parse("#1B3A54")
                : (_statusCommHovered ? Color.Parse("#253644") : Color.Parse("#1A232C")));
            _statusCommBody.BorderBrush = new SolidColorBrush(selected
                ? Color.Parse("#8CE6FF")
                : Color.Parse("#6E8794"));
        }

        if (_statusCommIndicator != null)
        {
            _statusCommIndicator.Background = selected
                ? HudAccentOk
                : new SolidColorBrush(Color.Parse("#3A5360"));
        }
    }

    private void ApplyStatusDockShopperButtonStyle(Button button, bool enabled)
    {
        button.IsEnabled = enabled;
        button.Background = _statusDockShopperHovered ? HudHeaderAlt : HudFrame;
        button.BorderBrush = _statusDockShopperHovered ? HudAccent : HudInnerEdge;
        button.BorderThickness = new Thickness(1);
        button.Foreground = Brushes.Transparent;

        if (button.Content is not Grid icon)
            return;

        Color stroke = enabled
            ? (_statusDockShopperHovered ? Color.Parse("#A7F1FF") : Color.Parse("#7CD0DE"))
            : Color.Parse("#536872");
        Color fill = enabled
            ? (_statusDockShopperHovered ? Color.Parse("#FFE28A") : Color.Parse("#BE9952"))
            : Color.Parse("#536872");
        var strokeBrush = new SolidColorBrush(stroke);
        var fillBrush = new SolidColorBrush(fill);

        foreach (Control child in icon.Children)
        {
            switch (child)
            {
                case Avalonia.Controls.Shapes.Path path:
                    path.Stroke = strokeBrush;
                    path.Fill = Brushes.Transparent;
                    break;
                case Border wheel:
                    wheel.Background = fillBrush;
                    break;
            }
        }
    }

    private void ApplyStatusMapButtonStyle(Button button, bool selected)
    {
        button.IsEnabled = true;
        button.Background = selected
            ? new SolidColorBrush(Color.Parse("#5CD5FF"))
            : (_statusMapHovered ? HudHeaderAlt : HudFrame);
        button.BorderBrush = selected
            ? HudAccentHot
            : (_statusMapHovered ? HudAccent : HudInnerEdge);
        button.BorderThickness = new Thickness(1);

        Color panelBorder = selected
            ? Color.Parse("#E8FBFF")
            : (_statusMapHovered ? Color.Parse("#9DC3CF") : Color.Parse("#7894A0"));
        Color leftFill = selected
            ? Color.Parse("#103D56")
            : (_statusMapHovered ? Color.Parse("#1A3240") : Color.Parse("#152733"));
        Color centerFill = selected
            ? Color.Parse("#12384E")
            : (_statusMapHovered ? Color.Parse("#18303C") : Color.Parse("#13242D"));
        Color rightFill = selected
            ? Color.Parse("#153246")
            : (_statusMapHovered ? Color.Parse("#1A2D38") : Color.Parse("#14222A"));
        Color routeColor = selected
            ? Color.Parse("#FFE28A")
            : (_statusMapHovered ? Color.Parse("#A7F1FF") : Color.Parse("#6CC7D7"));
        Color nodeColor = selected
            ? Color.Parse("#FFF5C5")
            : (_statusMapHovered ? Color.Parse("#DDFBFF") : Color.Parse("#9FD9E4"));

        if (_statusMapPanelLeft != null)
        {
            _statusMapPanelLeft.Background = new SolidColorBrush(leftFill);
            _statusMapPanelLeft.BorderBrush = new SolidColorBrush(panelBorder);
        }

        if (_statusMapPanelCenter != null)
        {
            _statusMapPanelCenter.Background = new SolidColorBrush(centerFill);
            _statusMapPanelCenter.BorderBrush = new SolidColorBrush(panelBorder);
        }

        if (_statusMapPanelRight != null)
        {
            _statusMapPanelRight.Background = new SolidColorBrush(rightFill);
            _statusMapPanelRight.BorderBrush = new SolidColorBrush(panelBorder);
        }

        if (_statusMapRoute != null)
            _statusMapRoute.Stroke = new SolidColorBrush(routeColor);

        if (_statusMapNodeA != null)
            _statusMapNodeA.Background = new SolidColorBrush(nodeColor);
        if (_statusMapNodeB != null)
            _statusMapNodeB.Background = new SolidColorBrush(nodeColor);
        if (_statusMapNodeC != null)
            _statusMapNodeC.Background = new SolidColorBrush(nodeColor);
    }

    private void ApplyStatusBotButtonStyle(Button button, bool selected, bool enabled)
    {
        button.IsEnabled = enabled;
        button.Background = selected
            ? new SolidColorBrush(Color.Parse("#1EF0AE"))
            : (_statusBotHovered ? HudHeaderAlt : HudFrame);
        button.BorderBrush = selected
            ? HudAccentHot
            : (_statusBotHovered ? HudAccent : HudInnerEdge);
        button.BorderThickness = new Thickness(1);

        Color shellColor = selected
            ? Color.Parse("#083327")
            : (_statusBotHovered ? Color.Parse("#A7D8E4") : Color.Parse("#89A2AC"));
        Color headFillColor = selected
            ? Color.Parse("#C8FFF0")
            : (_statusBotHovered ? Color.Parse("#173342") : Color.Parse("#112530"));
        Color eyeColor = selected
            ? Color.Parse("#0ACB86")
            : (_statusBotHovered ? Color.Parse("#7CEFFF") : Color.Parse("#4E7D89"));
        Color antennaTipColor = selected
            ? Color.Parse("#FFF1C2")
            : (_statusBotHovered ? Color.Parse("#DCE8ED") : Color.Parse("#8FA2AB"));

        if (_statusBotHead != null)
        {
            _statusBotHead.Background = new SolidColorBrush(headFillColor);
            _statusBotHead.BorderBrush = new SolidColorBrush(shellColor);
        }

        if (_statusBotBody != null)
        {
            _statusBotBody.Background = new SolidColorBrush(headFillColor);
            _statusBotBody.BorderBrush = new SolidColorBrush(shellColor);
        }

        if (_statusBotEyeLeft != null)
            _statusBotEyeLeft.Background = new SolidColorBrush(eyeColor);
        if (_statusBotEyeRight != null)
            _statusBotEyeRight.Background = new SolidColorBrush(eyeColor);
        if (_statusBotAntenna != null)
            _statusBotAntenna.Background = new SolidColorBrush(shellColor);
        if (_statusBotAntennaTip != null)
            _statusBotAntennaTip.Background = new SolidColorBrush(antennaTipColor);
    }

    private void ApplyStatusModeButtonStyle(Button button, bool paused, bool enabled)
    {
        button.IsEnabled = enabled;
        button.Background = paused ? HudAccentWarn : HudAccentOk;
        button.BorderBrush = paused ? HudAccentHot : HudAccent;
        button.BorderThickness = new Thickness(1);
        button.Foreground = HudAccentInk;
    }

    private void ApplyStatusRedAlertButtonStyle(Button button, bool enabled)
    {
        button.IsEnabled = enabled;
        button.Background = enabled
            ? new SolidColorBrush(Color.FromRgb(196, 28, 36))
            : new SolidColorBrush(Color.FromRgb(55, 61, 68));
        button.BorderBrush = enabled
            ? new SolidColorBrush(Color.FromRgb(255, 208, 208))
            : new SolidColorBrush(Color.FromRgb(103, 112, 122));
        button.BorderThickness = new Thickness(1);
        button.Foreground = enabled ? Brushes.White : new SolidColorBrush(Color.FromRgb(176, 184, 190));
        button.Content = "RED ALERT";
    }

    private void SetRedAlertVars(string value)
        => PersistMombotVars(value, "$BOT~REDALERT", "$BOT~redalert", "$bot~redalert", "$redalert");

    private void ApplyRedAlertPreference()
    {
        if (_appPrefs.EnableRedAlertMode)
        {
            SyncRedAlertFromMombotVar();
            return;
        }

        if (IsMombotTruthy(ReadCurrentMombotVar("FALSE", "$BOT~REDALERT", "$BOT~redalert", "$bot~redalert", "$redalert")))
            SetRedAlertVars("FALSE");

        SetRedAlertEnabled(false);
    }

    private void SyncRedAlertFromMombotVar()
    {
        bool requested = IsMombotTruthy(ReadCurrentMombotVar("FALSE", "$BOT~REDALERT", "$BOT~redalert", "$bot~redalert", "$redalert"));
        if (!_appPrefs.EnableRedAlertMode)
        {
            if (requested)
                SetRedAlertVars("FALSE");

            SetRedAlertEnabled(false);
            return;
        }

        SetRedAlertEnabled(requested);
    }

    internal void TriggerRedAlert()
    {
        if (!_appPrefs.EnableRedAlertMode)
        {
            SetRedAlertVars("FALSE");
            SetRedAlertEnabled(false);
            return;
        }

        RestartRedAlertTimer();
        SetRedAlertVars("TRUE");
        SetRedAlertEnabled(true);
    }

    internal void ClearRedAlert()
    {
        StopCurrentRedAlertTimer();
        SetRedAlertVars("FALSE");
        SetRedAlertEnabled(false);
    }

    private void SetRedAlertEnabled(bool enabled)
    {
        bool effectiveEnabled = _appPrefs.EnableRedAlertMode && enabled;
        var owner = ResolveCurrentMtcTabContext();
        bool tabStateChanged = owner is not null && owner.RedAlertEnabled != effectiveEnabled;

        if (_redAlertEnabled == effectiveEnabled)
        {
            if (owner is not null)
                owner.RedAlertEnabled = effectiveEnabled;
            if (tabStateChanged)
                RefreshMtcTabStrip(force: true);
            if (PrepareMtcTabVisualRefresh())
                ApplyVisibleRedAlertUi();
            return;
        }

        _redAlertEnabled = effectiveEnabled;
        if (owner is not null)
            owner.RedAlertEnabled = effectiveEnabled;
        if (_redAlertEnabled)
            RestartRedAlertTimer();
        else
            StopCurrentRedAlertTimer();

        if (tabStateChanged)
            RefreshMtcTabStrip(force: true);

        if (!PrepareMtcTabVisualRefresh())
            return;

        ApplyVisibleRedAlertUi();
        RefreshStatusBar();
        RequestInfoPanelsRefresh(force: true);
        _buffer.Dirty = true;
        _termCtrl?.InvalidateVisual();
        _deckTermCtrl?.InvalidateVisual();
    }

    private void ApplyVisibleRedAlertUi()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(ApplyVisibleRedAlertUi, DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        ApplyRedAlertPalette(IsLiveMtcTabActive() && _redAlertEnabled);
        Background = BgWindow;
        _statusRedAlertFrame.IsVisible = _appPrefs.EnableRedAlertMode && _redAlertEnabled;
        ApplyStatusRedAlertButtonStyle(_statusRedAlertButton, _appPrefs.EnableRedAlertMode && _redAlertEnabled);
        UpdateTerminalLiveSelector();
    }

    private void RestartRedAlertTimer()
    {
        var owner = ResolveCurrentMtcTabContext();
        if (owner is not null)
        {
            DispatcherTimer timer = owner.RedAlertTimer ??= new DispatcherTimer { Interval = TimeSpan.FromSeconds(30) };
            if (!owner.RedAlertTimerWired)
            {
                timer.Tick += (_, _) => ExecuteInOptionalMtcTabSession(owner, ClearRedAlert);
                owner.RedAlertTimerWired = true;
            }

            timer.Stop();
            timer.Start();
            return;
        }

        // Red alert is per live tab. If there is no owning tab, do not fall
        // back to the shared bootstrap timer and risk clearing the active tab.
    }

    private void StopCurrentRedAlertTimer()
    {
        var owner = ResolveCurrentMtcTabContext();
        if (owner?.RedAlertTimer is not null)
        {
            owner.RedAlertTimer.Stop();
            return;
        }

        _redAlertTimer.Stop();
    }

}
