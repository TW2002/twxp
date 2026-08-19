using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

internal sealed class TerminalRecordingPlaybackWindow : Window
{
    private readonly TerminalRecording _recording;
    private readonly TerminalBuffer _buffer;
    private readonly AnsiParser _parser;
    private readonly TerminalControl _terminal;
    private readonly Button _playPauseButton;
    private readonly Button _restartButton;
    private readonly ComboBox _speedCombo;
    private readonly ProgressBar _progress;
    private readonly TextBlock _statusText;
    private readonly TextBlock _inputText;
    private CancellationTokenSource? _playbackSource;
    private int _eventIndex;
    private bool _playing;
    private long _playbackPositionMilliseconds;

    private const int PlaybackStatusTickMilliseconds = 100;

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgPanelAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush Text = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush Muted = new SolidColorBrush(Color.FromRgb(126, 170, 180));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));

    public string RecordingPath { get; }

    public TerminalRecordingPlaybackWindow(string recordingPath, TerminalRecording recording)
    {
        RecordingPath = recordingPath;
        _recording = recording;
        _buffer = new TerminalBuffer(
            Math.Max(80, recording.Header.Columns),
            Math.Max(24, recording.Header.Rows));
        _parser = new AnsiParser(_buffer);
        _terminal = new TerminalControl(_buffer)
        {
            IsConnected = false,
        };

        Title = $"MTC Recording - {Path.GetFileName(recordingPath)}";
        Width = 1080;
        Height = 700;
        MinWidth = 780;
        MinHeight = 460;
        Background = BgWin;
        FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace");

        _playPauseButton = BuildButton("Play", primary: true);
        _playPauseButton.Click += async (_, _) => await TogglePlaybackAsync();

        _restartButton = BuildButton("Restart", primary: false);
        _restartButton.Click += (_, _) => RestartPlayback();

        _speedCombo = new ComboBox
        {
            Width = 96,
            Height = 32,
            ItemsSource = new[] { "0.5x", "1x", "2x", "4x", "8x" },
            SelectedIndex = 1,
            VerticalAlignment = VerticalAlignment.Center,
        };

        _progress = new ProgressBar
        {
            Minimum = 0,
            Maximum = Math.Max(1, GetDurationMilliseconds()),
            Height = 8,
            VerticalAlignment = VerticalAlignment.Center,
        };

        _statusText = new TextBlock
        {
            Foreground = Muted,
            FontSize = 12,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _inputText = new TextBlock
        {
            Foreground = Muted,
            FontSize = 12,
            VerticalAlignment = VerticalAlignment.Center,
            TextTrimming = TextTrimming.CharacterEllipsis,
        };

        var toolbar = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("Auto,Auto,Auto,*,Auto"),
            ColumnSpacing = 8,
            Margin = new Thickness(12, 10, 12, 8),
            Children =
            {
                _playPauseButton.WithColumn(0),
                _restartButton.WithColumn(1),
                _speedCombo.WithColumn(2),
                _progress.WithColumn(3),
                _statusText.WithColumn(4),
            },
        };

        var metadata = new TextBlock
        {
            Text = BuildMetadataText(recordingPath, recording.Header),
            Foreground = Muted,
            FontSize = 12,
            Margin = new Thickness(12, 0, 12, 8),
            TextWrapping = TextWrapping.Wrap,
        };

        var inputBar = new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(10, 6),
            Margin = new Thickness(12, 8, 12, 12),
            Child = _inputText,
        };

        var terminalFrame = new Border
        {
            Background = BgPanelAlt,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(14),
            Padding = new Thickness(8),
            Margin = new Thickness(12, 0, 12, 0),
            Child = BuildTerminalScrollHost(_terminal),
        };

        var root = new DockPanel
        {
            LastChildFill = true,
            Children =
            {
                toolbar.WithDock(Dock.Top),
                metadata.WithDock(Dock.Top),
                inputBar.WithDock(Dock.Bottom),
                terminalFrame,
            },
        };
        Content = root;

        Closed += (_, _) => StopPlayback();
        ResetTerminal();
        UpdateStatus();
    }

    private static Control BuildTerminalScrollHost(TerminalControl terminal)
    {
        var scroll = new ScrollViewer
        {
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Content = terminal,
        };

        void SyncTerminalSurfaceSize()
        {
            Rect bounds = scroll.Bounds;
            if (bounds.Width <= 0 || bounds.Height <= 0)
                return;

            terminal.SetViewportPixelSize(bounds.Width, bounds.Height);
        }

        scroll.SizeChanged += (_, _) => SyncTerminalSurfaceSize();
        terminal.AttachedToVisualTree += (_, _) => SyncTerminalSurfaceSize();
        return scroll;
    }

    private static Button BuildButton(string text, bool primary)
    {
        var button = new Button
        {
            Content = text,
            Height = 32,
            MinWidth = 90,
            Padding = new Thickness(14, 4),
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
            Background = primary ? Accent : BgPanel,
            Foreground = primary ? Brushes.Black : Text,
            BorderBrush = primary ? Accent : Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
        };
        return button;
    }

    private static string BuildMetadataText(string recordingPath, TerminalRecordingHeader header)
    {
        string created = DateTimeOffset.TryParse(header.CreatedUtc, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTimeOffset parsed)
            ? parsed.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)
            : header.CreatedUtc;

        return $"File: {recordingPath}   Game: {header.Game}   Server: {header.Host}:{header.Port}   Created: {created}   Size: {header.Columns}x{header.Rows}";
    }

    private async Task TogglePlaybackAsync()
    {
        if (_playing)
        {
            StopPlayback();
            UpdateStatus();
            return;
        }

        _playing = true;
        _playPauseButton.Content = "Pause";
        _playPauseButton.Background = BgPanel;
        _playPauseButton.Foreground = Text;
        _playbackSource = new CancellationTokenSource();
        try
        {
            await PlayAsync(_playbackSource.Token);
        }
        finally
        {
            _playing = false;
            _playbackSource?.Dispose();
            _playbackSource = null;
            _playPauseButton.Content = _eventIndex >= _recording.Events.Count ? "Play" : "Play";
            _playPauseButton.Background = Accent;
            _playPauseButton.Foreground = Brushes.Black;
            UpdateStatus();
        }
    }

    private async Task PlayAsync(CancellationToken cancellationToken)
    {
        long previousTimestamp = _eventIndex > 0 && _eventIndex <= _recording.Events.Count
            ? _recording.Events[_eventIndex - 1].T
            : 0;
        if (_eventIndex < _recording.Events.Count)
            previousTimestamp = Math.Min(_recording.Events[_eventIndex].T, Math.Max(previousTimestamp, _playbackPositionMilliseconds));
        else
            previousTimestamp = Math.Max(previousTimestamp, _playbackPositionMilliseconds);

        double speed = GetPlaybackSpeed();
        int eventsSinceYield = 0;

        while (_eventIndex < _recording.Events.Count)
        {
            cancellationToken.ThrowIfCancellationRequested();

            TerminalRecordingEvent evt = _recording.Events[_eventIndex];
            long delayMs = Math.Max(0, evt.T - previousTimestamp);
            if (delayMs > 0)
            {
                await DelayPlaybackWithStatusAsync(previousTimestamp, evt.T, speed, cancellationToken);
            }

            ApplyEvent(evt);
            previousTimestamp = evt.T;
            _eventIndex++;

            eventsSinceYield++;
            if (eventsSinceYield >= 64)
            {
                eventsSinceYield = 0;
                await Dispatcher.UIThread.InvokeAsync(() => { }, DispatcherPriority.Background);
            }
        }
    }

    private async Task DelayPlaybackWithStatusAsync(long fromMilliseconds, long toMilliseconds, double speed, CancellationToken cancellationToken)
    {
        long spanMilliseconds = Math.Max(0, toMilliseconds - fromMilliseconds);
        if (spanMilliseconds <= 0)
            return;

        int adjustedDelayMilliseconds = Math.Max(1, (int)Math.Round(spanMilliseconds / speed));
        long startedAt = Stopwatch.GetTimestamp();

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            double elapsedRealMilliseconds = Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds;
            long elapsedPlaybackMilliseconds = Math.Min(
                spanMilliseconds,
                Math.Max(0, (long)Math.Round(elapsedRealMilliseconds * speed)));
            SetPlaybackPosition(fromMilliseconds + elapsedPlaybackMilliseconds);

            int remainingDelayMilliseconds = adjustedDelayMilliseconds - (int)Math.Round(elapsedRealMilliseconds);
            if (remainingDelayMilliseconds <= 0)
                break;

            await Task.Delay(Math.Min(PlaybackStatusTickMilliseconds, remainingDelayMilliseconds), cancellationToken);
        }

        SetPlaybackPosition(toMilliseconds);
    }

    private void ApplyEvent(TerminalRecordingEvent evt)
    {
        switch (evt.Kind)
        {
            case "output":
                if (!string.IsNullOrWhiteSpace(evt.Data))
                {
                    byte[] bytes = Convert.FromBase64String(evt.Data);
                    _parser.Feed(bytes, bytes.Length);
                    _buffer.Dirty = true;
                }
                break;
            case "input":
                _inputText.Text = string.IsNullOrWhiteSpace(evt.Data)
                    ? string.Empty
                    : $"Input: {FormatInputBytes(Convert.FromBase64String(evt.Data))}";
                break;
            case "resize":
                if (evt.Columns is > 0 && evt.Rows is > 0)
                    _buffer.Resize(evt.Columns.Value, evt.Rows.Value);
                break;
        }

        SetPlaybackPosition(evt.T);
    }

    private void RestartPlayback()
    {
        StopPlayback();
        _eventIndex = 0;
        SetPlaybackPosition(0);
        _inputText.Text = string.Empty;
        ResetTerminal();
        UpdateStatus();
    }

    private void ResetTerminal()
    {
        _buffer.Reset();
        _buffer.Dirty = true;
    }

    private void StopPlayback()
    {
        _playbackSource?.Cancel();
    }

    private void UpdateStatus()
    {
        long duration = GetDurationMilliseconds();
        long current = Math.Clamp(_playbackPositionMilliseconds, 0, duration);
        _statusText.Text = $"{FormatDuration(current)} / {FormatDuration(duration)}";
    }

    private void SetPlaybackPosition(long milliseconds)
    {
        long duration = GetDurationMilliseconds();
        _playbackPositionMilliseconds = Math.Clamp(milliseconds, 0, duration);
        _progress.Value = Math.Min(_progress.Maximum, _playbackPositionMilliseconds);
        UpdateStatus();
    }

    private long GetDurationMilliseconds()
        => _recording.Events.Count == 0 ? 0 : Math.Max(0, _recording.Events[^1].T);

    private double GetPlaybackSpeed()
    {
        string selected = _speedCombo.SelectedItem?.ToString() ?? "1x";
        selected = selected.TrimEnd('x', 'X');
        return double.TryParse(selected, NumberStyles.Float, CultureInfo.InvariantCulture, out double speed)
            ? Math.Clamp(speed, 0.1, 32.0)
            : 1.0;
    }

    private static string FormatDuration(long milliseconds)
    {
        TimeSpan span = TimeSpan.FromMilliseconds(Math.Max(0, milliseconds));
        return span.TotalHours >= 1
            ? span.ToString(@"h\:mm\:ss", CultureInfo.InvariantCulture)
            : span.ToString(@"m\:ss", CultureInfo.InvariantCulture);
    }

    private static string FormatInputBytes(byte[] bytes)
    {
        if (bytes.Length == 0)
            return string.Empty;

        var builder = new StringBuilder(bytes.Length);
        foreach (byte value in bytes)
        {
            builder.Append(value switch
            {
                0x0D => "[Enter]",
                0x09 => "[Tab]",
                0x08 => "[Backspace]",
                >= 32 and <= 126 => ((char)value).ToString(),
                _ => $"[0x{value:X2}]",
            });
        }

        return builder.ToString();
    }
}
