using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

internal sealed record CacheDisplayEntry(
    string Name,
    string Subtitle,
    string Kind,
    long Bytes);

internal sealed record CacheWindowSnapshot(
    IReadOnlyList<CacheDisplayEntry> PreloadEntries,
    IReadOnlyList<CacheDisplayEntry> VmEntries,
    long PreloadBytes,
    long VmBytes)
{
    public long TotalBytes => PreloadBytes + VmBytes;
}

internal sealed class CacheWindow : Window
{
    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgCardAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush ColText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush ColMuted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush ColAccent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush ColAccentHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush ColSuccess = new SolidColorBrush(Color.FromRgb(116, 239, 164));

    private readonly Func<CacheWindowSnapshot> _snapshotProvider;
    private readonly DispatcherTimer _refreshTimer;
    private readonly TextBlock _preloadTotalText;
    private readonly TextBlock _vmTotalText;
    private readonly TextBlock _overallTotalText;
    private readonly StackPanel _preloadEntriesHost;
    private readonly StackPanel _vmEntriesHost;

    public CacheWindow(Func<CacheWindowSnapshot> snapshotProvider)
    {
        _snapshotProvider = snapshotProvider;

        Title = "Cache";
        Width = 900;
        Height = 680;
        MinWidth = 760;
        MinHeight = 520;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _preloadTotalText = BuildMetricValueText();
        _vmTotalText = BuildMetricValueText();
        _overallTotalText = BuildMetricValueText(primary: true);
        _preloadEntriesHost = new StackPanel { Spacing = 8 };
        _vmEntriesHost = new StackPanel { Spacing = 8 };

        var refreshButton = BuildActionButton("Refresh", primary: true);
        refreshButton.Click += (_, _) => RefreshSnapshot();

        var closeButton = BuildActionButton("Close", primary: false);
        closeButton.Click += (_, _) => Close();

        var actionRow = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 10,
            Children = { refreshButton, closeButton }
        };

        var summaryGrid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,*,*"),
            ColumnSpacing = 12,
        };
        AddSummaryCard(summaryGrid, 0, "Preload Cache", "Native Mombot hotkey prewarm", _preloadTotalText, ColAccent);
        AddSummaryCard(summaryGrid, 1, "VM Script Cache", "All other cached VM scripts", _vmTotalText, ColSuccess);
        AddSummaryCard(summaryGrid, 2, "Total Cache", "Combined live cache footprint", _overallTotalText, ColAccentHot);

        var sectionScroll = new ScrollViewer
        {
            VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
            Content = new StackPanel
            {
                Spacing = 14,
                Children =
                {
                    BuildSectionCard(
                        "Preload Cache",
                        "Prewarmed native Mombot modules currently resident in cache.",
                        _preloadEntriesHost),
                    BuildSectionCard(
                        "VM Script Cache",
                        "Source and compiled script cache entries that are currently available to the VM.",
                        _vmEntriesHost),
                }
            }
        };

        var rootGrid = new Grid
        {
            RowDefinitions = new RowDefinitions("Auto,Auto,*,Auto"),
            RowSpacing = 14,
            Children =
            {
                BuildHeader(),
                summaryGrid,
                sectionScroll,
                actionRow
            }
        };
        Grid.SetRow(summaryGrid, 1);
        Grid.SetRow(sectionScroll, 2);
        Grid.SetRow(actionRow, 3);

        Content = new Border
        {
            Background = BgWin,
            Padding = new Thickness(18),
            Child = rootGrid
        };

        _refreshTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _refreshTimer.Tick += (_, _) => RefreshSnapshot();
        Opened += (_, _) =>
        {
            RefreshSnapshot();
            _refreshTimer.Start();
        };
        Closed += (_, _) => _refreshTimer.Stop();
    }

    private Control BuildHeader()
    {
        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(18, 14),
            Child = new StackPanel
            {
                Spacing = 4,
                Children =
                {
                    new TextBlock
                    {
                        Text = "CACHE",
                        Foreground = ColAccent,
                        FontSize = 26,
                        FontWeight = FontWeight.Bold,
                    },
                    new TextBlock
                    {
                        Text = "Approx. managed memory held by live preload and VM script caches.",
                        Foreground = ColMuted,
                        FontSize = 12,
                    }
                }
            }
        };
    }

    private static TextBlock BuildMetricValueText(bool primary = false)
    {
        return new TextBlock
        {
            Foreground = primary ? ColAccentHot : ColText,
            FontSize = primary ? 24 : 22,
            FontWeight = FontWeight.Bold,
        };
    }

    private static Button BuildActionButton(string label, bool primary)
    {
        return new Button
        {
            Content = label,
            Padding = new Thickness(16, 8),
            Background = primary ? ColAccent : BgCardAlt,
            BorderBrush = primary ? ColAccentHot : Edge,
            BorderThickness = new Thickness(1.5),
            Foreground = primary ? BgWin : ColText,
            CornerRadius = new CornerRadius(12),
            FontWeight = FontWeight.SemiBold,
            MinWidth = 120,
        };
    }

    private static void AddSummaryCard(Grid grid, int column, string title, string subtitle, TextBlock valueText, IBrush accent)
    {
        var titleText = new TextBlock
        {
            Text = title,
            Foreground = accent,
            FontSize = 14,
            FontWeight = FontWeight.SemiBold,
        };

        var subtitleText = new TextBlock
        {
            Text = subtitle,
            Foreground = ColMuted,
            FontSize = 11,
            TextWrapping = TextWrapping.Wrap,
        };

        var card = new Border
        {
            Background = BgPanel,
            BorderBrush = InnerEdge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(16),
            Padding = new Thickness(16, 14),
            Child = new StackPanel
            {
                Spacing = 6,
                Children = { titleText, valueText, subtitleText }
            }
        };

        Grid.SetColumn(card, column);
        grid.Children.Add(card);
    }

    private static Border BuildSectionCard(string title, string subtitle, StackPanel host)
    {
        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(18),
            Padding = new Thickness(16),
            Child = new StackPanel
            {
                Spacing = 12,
                Children =
                {
                    new StackPanel
                    {
                        Spacing = 3,
                        Children =
                        {
                            new TextBlock
                            {
                                Text = title,
                                Foreground = ColAccent,
                                FontSize = 18,
                                FontWeight = FontWeight.Bold,
                            },
                            new TextBlock
                            {
                                Text = subtitle,
                                Foreground = ColMuted,
                                FontSize = 11,
                                TextWrapping = TextWrapping.Wrap,
                            }
                        }
                    },
                    host
                }
            }
        };
    }

    private void RefreshSnapshot()
    {
        CacheWindowSnapshot snapshot = _snapshotProvider();

        _preloadTotalText.Text = FormatBytes(snapshot.PreloadBytes);
        _vmTotalText.Text = FormatBytes(snapshot.VmBytes);
        _overallTotalText.Text = FormatBytes(snapshot.TotalBytes);

        PopulateEntries(_preloadEntriesHost, snapshot.PreloadEntries, "No prewarmed scripts are currently cached.");
        PopulateEntries(_vmEntriesHost, snapshot.VmEntries, "No VM script cache entries are currently resident.");
    }

    private static void PopulateEntries(StackPanel host, IReadOnlyList<CacheDisplayEntry> entries, string emptyMessage)
    {
        host.Children.Clear();

        if (entries.Count == 0)
        {
            host.Children.Add(new Border
            {
                Background = BgCardAlt,
                BorderBrush = InnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(14, 12),
                Child = new TextBlock
                {
                    Text = emptyMessage,
                    Foreground = ColMuted,
                    FontStyle = FontStyle.Italic,
                }
            });
            return;
        }

        foreach (CacheDisplayEntry entry in entries)
        {
            var kindTag = new Border
            {
                Background = BgCardAlt,
                BorderBrush = InnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(999),
                Padding = new Thickness(8, 2),
                Child = new TextBlock
                {
                    Text = entry.Kind,
                    Foreground = ColMuted,
                    FontSize = 10,
                    FontWeight = FontWeight.SemiBold,
                }
            };

            var bytesText = new TextBlock
            {
                Text = FormatBytes(entry.Bytes),
                Foreground = ColText,
                FontSize = 18,
                FontWeight = FontWeight.Bold,
                HorizontalAlignment = HorizontalAlignment.Right,
                TextAlignment = TextAlignment.Right,
            };

            var metaGrid = new Grid
            {
                ColumnDefinitions = new ColumnDefinitions("Auto,*"),
                ColumnSpacing = 8,
                Children = { kindTag }
            };
            Grid.SetColumn(kindTag, 0);

            if (!string.IsNullOrWhiteSpace(entry.Subtitle))
            {
                var subtitle = new TextBlock
                {
                    Text = entry.Subtitle,
                    Foreground = ColMuted,
                    FontSize = 11,
                    TextTrimming = TextTrimming.CharacterEllipsis,
                };
                Grid.SetColumn(subtitle, 1);
                metaGrid.Children.Add(subtitle);
            }

            host.Children.Add(new Border
            {
                Background = BgCard,
                BorderBrush = InnerEdge,
                BorderThickness = new Thickness(1.25),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(14, 12),
                Child = new Grid
                {
                    ColumnDefinitions = new ColumnDefinitions("*,Auto"),
                    ColumnSpacing = 12,
                    Children =
                    {
                        new StackPanel
                        {
                            Spacing = 6,
                            Children =
                            {
                                new TextBlock
                                {
                                    Text = entry.Name,
                                    Foreground = ColAccent,
                                    FontSize = 18,
                                    FontWeight = FontWeight.SemiBold,
                                },
                                metaGrid,
                            }
                        },
                        bytesText
                    }
                }
            });
            Grid.SetColumn(bytesText, 1);
        }
    }

    private static string FormatBytes(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB"];
        double value = Math.Max(0, bytes);
        int unitIndex = 0;
        while (value >= 1024 && unitIndex < units.Length - 1)
        {
            value /= 1024;
            unitIndex++;
        }

        return unitIndex == 0
            ? $"{value:0} {units[unitIndex]}"
            : $"{value:0.0} {units[unitIndex]}";
    }
}
