using System;
using System.IO;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Platform.Storage;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private void ObserveTerminalOutputBytesForRecording(byte[] data, int offset, int length)
    {
        _terminalRecorder?.RecordOutput(data, offset, length);
    }

    private void RecordTerminalInputForRecording(byte[] bytes)
    {
        _terminalRecorder?.RecordInput(bytes);
    }

    private void RecordTerminalResizeForRecording(int columns, int rows)
    {
        _terminalRecorder?.RecordResize(columns, rows);
    }

    private Button BuildTerminalRecordButton()
    {
        _terminalRecordButton = new Button
        {
            Width = 30,
            Height = 30,
            MinWidth = 30,
            Padding = new Thickness(0),
            Margin = new Thickness(0, 3, 0, 3),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Background = Brushes.Transparent,
            BorderBrush = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Focusable = false,
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
        };
        _terminalRecordButton.Click += async (_, _) =>
        {
            try
            {
                await ToggleTerminalRecordingAsync();
            }
            finally
            {
                PostToCurrentMtcTabSession(FocusActiveTerminal, DispatcherPriority.Input);
            }
        };
        UpdateTerminalRecordButton();
        return _terminalRecordButton;
    }

    private async Task ToggleTerminalRecordingAsync()
    {
        if (_terminalRecorder != null)
        {
            await StopTerminalRecordingAsync(showSavedMessage: true);
            return;
        }

        try
        {
            StartTerminalRecording();
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Recording Failed", ex.Message);
        }
    }

    private void StartTerminalRecording()
    {
        AppPaths.EnsureDirectories();
        string gameName = DeriveGameName();
        _terminalRecorder = TerminalSessionRecorder.Start(
            AppPaths.ProgramDir,
            gameName,
            _state.Host,
            _state.Port,
            _buffer.Columns,
            _buffer.Rows);
        _terminalRecorder.RecordResize(_buffer.Columns, _buffer.Rows);
        UpdateTerminalRecordButton();
    }

    private async Task StopTerminalRecordingAsync(bool showSavedMessage)
    {
        TerminalSessionRecorder? recorder = _terminalRecorder;
        if (recorder == null)
            return;

        _terminalRecorder = null;
        UpdateTerminalRecordButton();
        string path = recorder.FilePath;

        try
        {
            await recorder.StopAsync();
            if (showSavedMessage)
            {
                _parser.Feed($"\x1b[1;36m[Recording saved: {path}]\x1b[0m\r\n");
                _buffer.Dirty = true;
            }
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.Recording] failed to stop recording: {ex}\n");
            if (showSavedMessage)
                await ShowMessageAsync("Recording Failed", ex.Message);
        }
        finally
        {
            recorder.Dispose();
        }
    }

    private void UpdateTerminalRecordButton()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(UpdateTerminalRecordButton, DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (_terminalRecordButton == null)
            return;

        bool active = _terminalRecorder != null;
        _terminalRecordButton.Content = BuildRecordButtonGlyph(active);
        ToolTip.SetTip(_terminalRecordButton, active ? "Stop terminal recording" : "Start terminal recording");
    }

    private static Control BuildRecordButtonGlyph(bool active)
    {
        var red = new SolidColorBrush(Color.FromRgb(235, 40, 40));
        var glow = new SolidColorBrush(Color.FromArgb(48, 235, 40, 40));
        var frame = new Grid
        {
            Width = 24,
            Height = 24,
        };

        frame.Children.Add(new Border
        {
            Width = 24,
            Height = 24,
            CornerRadius = new CornerRadius(12),
            Background = active ? glow : Brushes.Transparent,
            BorderBrush = new SolidColorBrush(Color.FromArgb(active ? (byte)150 : (byte)95, 235, 40, 40)),
            BorderThickness = new Thickness(1.3),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        });

        frame.Children.Add(new Border
        {
            Width = active ? 11 : 13,
            Height = active ? 11 : 13,
            CornerRadius = active ? new CornerRadius(2) : new CornerRadius(7),
            Background = red,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        });

        return frame;
    }

    private async Task OnOpenTerminalRecordingAsync()
    {
        var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null)
            return;

        AppPaths.EnsureDirectories();
        var programFolder = await storage.TryGetFolderFromPathAsync(AppPaths.ProgramDir)
            ?? await GetHomeFolderAsync(storage);
        var files = await storage.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title = "Open MTC Recording",
            SuggestedStartLocation = programFolder,
            AllowMultiple = false,
            FileTypeFilter =
            [
                new FilePickerFileType("MTC Recording") { Patterns = [$"*{TerminalRecordingFormat.Extension}", $"*{TerminalRecordingFormat.LegacyExtension}"] },
                new FilePickerFileType("All Files") { Patterns = ["*"] },
            ],
        });

        if (files.Count == 0)
            return;

        string path = files[0].Path.LocalPath;
        try
        {
            TerminalRecording recording = await TerminalRecording.LoadAsync(path);
            var owner = ActiveMtcTab;
            if (owner?.RecordingPlaybackWindow != null)
            {
                owner.RecordingPlaybackWindow.Close();
                owner.RecordingPlaybackWindow = null;
            }

            var window = new TerminalRecordingPlaybackWindow(path, recording);
            window.Closed += (_, _) =>
            {
                if (owner != null && ReferenceEquals(owner.RecordingPlaybackWindow, window))
                    owner.RecordingPlaybackWindow = null;
            };
            if (owner != null)
                owner.RecordingPlaybackWindow = window;
            ShowMtcTabOwnedWindow(owner, window);
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Open Recording Failed", ex.Message);
        }
    }
}
