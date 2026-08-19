using System.Diagnostics;
using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed class MtcUpdateDialog : Window
{
    private static readonly FontFamily MonoFont = new("Cascadia Code, Menlo, Consolas, Courier New, monospace");
    private static readonly IBrush WindowBg = new SolidColorBrush(Color.FromRgb(0, 13, 19));
    private static readonly IBrush PanelBg = new SolidColorBrush(Color.FromRgb(0, 52, 60));
    private static readonly IBrush PanelBgDark = new SolidColorBrush(Color.FromRgb(0, 31, 38));
    private static readonly IBrush Border = new SolidColorBrush(Color.FromRgb(0, 150, 165));
    private static readonly IBrush Cyan = new SolidColorBrush(Color.FromRgb(0, 230, 220));
    private static readonly IBrush Text = new SolidColorBrush(Color.FromRgb(220, 244, 247));
    private static readonly IBrush Muted = new SolidColorBrush(Color.FromRgb(146, 190, 197));
    private static readonly IBrush Warning = new SolidColorBrush(Color.FromRgb(255, 178, 35));
    private static readonly IBrush Error = new SolidColorBrush(Color.FromRgb(255, 70, 95));
    private static readonly IBrush ButtonBg = new SolidColorBrush(Color.FromRgb(0, 205, 195));
    private static readonly IBrush GhostButtonBg = new SolidColorBrush(Color.FromRgb(0, 38, 45));

    private readonly TextBlock _actionStatus = new();

    public MtcUpdateDialog(MtcUpdateCheckResult result, string platformKey)
    {
        Title = result.Status == MtcUpdateCheckStatus.UpdateAvailable
            ? "MTC Update Available"
            : "MTC Update";
        Width = 700;
        MinWidth = 600;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = WindowBg;
        FontFamily = MonoFont;

        Content = new Border
        {
            Background = WindowBg,
            BorderBrush = Border,
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(22),
            Child = BuildContent(result, platformKey),
        };
    }

    private Control BuildContent(MtcUpdateCheckResult result, string platformKey)
    {
        var root = new StackPanel { Spacing = 16 };

        var statusBrush = StatusBrush(result.Status);
        root.Children.Add(new DockPanel
        {
            LastChildFill = true,
            Children =
            {
                BuildStatusPill(result.Status, statusBrush),
                new TextBlock
                {
                    Text = HeaderText(result.Status),
                    Foreground = Cyan,
                    FontSize = 28,
                    FontWeight = FontWeight.Bold,
                    VerticalAlignment = VerticalAlignment.Center,
                },
            },
        });

        root.Children.Add(new TextBlock
        {
            Text = MessageText(result),
            Foreground = Text,
            FontSize = 15,
            TextWrapping = TextWrapping.Wrap,
        });

        root.Children.Add(new Border
        {
            Background = PanelBg,
            BorderBrush = Border,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(14),
            Child = BuildDetails(result, platformKey),
        });

        if (!string.IsNullOrWhiteSpace(result.DownloadUrl) || !string.IsNullOrWhiteSpace(result.NotesUrl))
        {
            root.Children.Add(new Border
            {
                Background = PanelBgDark,
                BorderBrush = Border,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(12),
                Child = new TextBlock
                {
                    Text = BuildLinkText(result),
                    Foreground = Muted,
                    FontSize = 12,
                    TextWrapping = TextWrapping.Wrap,
                },
            });
        }

        _actionStatus.Foreground = Error;
        _actionStatus.FontSize = 12;
        _actionStatus.TextWrapping = TextWrapping.Wrap;
        _actionStatus.IsVisible = false;
        root.Children.Add(_actionStatus);

        root.Children.Add(BuildButtons(result));
        return root;
    }

    private static Control BuildStatusPill(MtcUpdateCheckStatus status, IBrush brush)
    {
        var label = status switch
        {
            MtcUpdateCheckStatus.UpdateAvailable => "UPDATE",
            MtcUpdateCheckStatus.UpToDate => "CURRENT",
            MtcUpdateCheckStatus.Failed => "FAILED",
            _ => "SKIPPED",
        };

        var pill = new Border
        {
            Background = brush,
            CornerRadius = new CornerRadius(999),
            Padding = new Thickness(12, 5),
            Margin = new Thickness(14, 0, 0, 0),
            Child = new TextBlock
            {
                Text = label,
                Foreground = status == MtcUpdateCheckStatus.Failed ? Brushes.White : Brushes.Black,
                FontSize = 12,
                FontWeight = FontWeight.Bold,
            },
        };
        DockPanel.SetDock(pill, Dock.Right);
        return pill;
    }

    private static Control BuildDetails(MtcUpdateCheckResult result, string platformKey)
    {
        var grid = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(new GridLength(1, GridUnitType.Star)),
            },
            RowDefinitions =
            {
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
            },
        };

        AddDetailRow(grid, 0, "Current", MtcVersion.DisplayVersion);
        AddDetailRow(grid, 1, "Available", result.DisplayVersion ?? result.AvailableVersion ?? "-");
        AddDetailRow(grid, 2, "Platform", platformKey);
        AddDetailRow(grid, 3, "Package", string.IsNullOrWhiteSpace(result.AssetName) ? "-" : result.AssetName);

        return grid;
    }

    private Control BuildButtons(MtcUpdateCheckResult result)
    {
        var buttons = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 10,
        };

        if (!string.IsNullOrWhiteSpace(result.NotesUrl))
        {
            var notes = BuildGhostButton("Release Notes");
            notes.Click += (_, _) => OpenExternalUrl(result.NotesUrl!, "release notes");
            buttons.Children.Add(notes);
        }

        if (result.Status == MtcUpdateCheckStatus.UpdateAvailable)
        {
            var download = BuildPrimaryButton("Download Installer");
            download.IsEnabled = !string.IsNullOrWhiteSpace(result.DownloadUrl);
            download.Click += (_, _) =>
            {
                try
                {
                    MtcUpdateService.OpenDownload(result);
                    Close(true);
                }
                catch (Exception ex)
                {
                    ShowActionError($"Unable to open download: {ex.Message}");
                }
            };
            buttons.Children.Add(download);
        }

        var close = BuildGhostButton(result.Status == MtcUpdateCheckStatus.UpdateAvailable ? "Later" : "Close");
        close.Click += (_, _) => Close(false);
        buttons.Children.Add(close);

        return buttons;
    }

    private static void AddDetailRow(Grid grid, int row, string label, string value)
    {
        var labelBlock = new TextBlock
        {
            Text = $"{label}:",
            Foreground = Muted,
            FontSize = 13,
            Margin = new Thickness(0, 4, 18, 4),
        };
        Grid.SetRow(labelBlock, row);
        Grid.SetColumn(labelBlock, 0);
        grid.Children.Add(labelBlock);

        var valueBlock = new TextBlock
        {
            Text = value,
            Foreground = label == "Available" ? Warning : Text,
            FontSize = 13,
            FontWeight = label == "Available" ? FontWeight.Bold : FontWeight.Normal,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 4),
        };
        Grid.SetRow(valueBlock, row);
        Grid.SetColumn(valueBlock, 1);
        grid.Children.Add(valueBlock);
    }

    private static Button BuildPrimaryButton(string text)
        => new()
        {
            Content = text,
            Background = ButtonBg,
            Foreground = Brushes.Black,
            BorderBrush = Warning,
            BorderThickness = new Thickness(1),
            Padding = new Thickness(18, 8),
            MinWidth = 150,
        };

    private static Button BuildGhostButton(string text)
        => new()
        {
            Content = text,
            Background = GhostButtonBg,
            Foreground = Text,
            BorderBrush = Border,
            BorderThickness = new Thickness(1),
            Padding = new Thickness(16, 8),
            MinWidth = 110,
        };

    private static string HeaderText(MtcUpdateCheckStatus status)
        => status switch
        {
            MtcUpdateCheckStatus.UpdateAvailable => "MTC Update Available",
            MtcUpdateCheckStatus.UpToDate => "MTC Is Up To Date",
            MtcUpdateCheckStatus.Failed => "Update Check Failed",
            _ => "Update Check Skipped",
        };

    private static string MessageText(MtcUpdateCheckResult result)
        => result.Status == MtcUpdateCheckStatus.UpdateAvailable
            ? $"{result.Message} Download the installer when you are ready. MTC will not install it automatically."
            : result.Message;

    private static string BuildLinkText(MtcUpdateCheckResult result)
    {
        var lines = new List<string>();
        if (!string.IsNullOrWhiteSpace(result.DownloadUrl))
            lines.Add($"Download: {result.DownloadUrl}");
        if (!string.IsNullOrWhiteSpace(result.NotesUrl))
            lines.Add($"Release notes: {result.NotesUrl}");
        return string.Join(Environment.NewLine, lines);
    }

    private static IBrush StatusBrush(MtcUpdateCheckStatus status)
        => status switch
        {
            MtcUpdateCheckStatus.UpdateAvailable => Warning,
            MtcUpdateCheckStatus.Failed => Error,
            MtcUpdateCheckStatus.UpToDate => ButtonBg,
            _ => Muted,
        };

    private void OpenExternalUrl(string url, string label)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            ShowActionError($"Unable to open {label}: {ex.Message}");
        }
    }

    private void ShowActionError(string message)
    {
        _actionStatus.Text = message;
        _actionStatus.IsVisible = true;
    }
}
