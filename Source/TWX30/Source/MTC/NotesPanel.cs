using System;
using System.IO;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

public partial class MainWindow
{
    private const double NotesPanelWidth = 218;
    private readonly MenuItem _viewNotes = new() { Header = "_Notes", IsEnabled = false };
    private TextBox? _notesTextBox;
    private TextBlock? _notesHeaderText;
    private TextBlock? _notesStatusText;
    private DispatcherTimer? _notesSaveTimer;
    private bool _notesPanelVisible;
    private bool _notesLoading;
    private bool _notesApplyingText;
    private bool _notesDirty;
    private string? _notesGameName;
    private string? _notesFilePath;

    private bool NotesTabOwnsVisibleControls(MtcTabPrototype tab)
        => Dispatcher.UIThread.CheckAccess() && tab.Id == _activeMtcTabId;

    private void CaptureNotesState(MtcTabPrototype tab)
    {
        bool ownsVisibleControls = NotesTabOwnsVisibleControls(tab);

        if (!ownsVisibleControls)
        {
            tab.NotesPanelVisible = _notesPanelVisible;
            return;
        }

        tab.NotesPanelVisible = _notesPanelVisible;
        tab.NotesLoading = _notesLoading;
        tab.NotesDirty = _notesDirty;
        tab.NotesGameName = _notesGameName;
        tab.NotesFilePath = _notesFilePath;

        if (_notesTextBox != null)
            tab.NotesText = _notesTextBox.Text ?? string.Empty;

        if (_notesStatusText != null)
            tab.NotesStatus = _notesStatusText.Text ?? tab.NotesStatus;
    }

    private void BindNotesState(MtcTabPrototype tab)
    {
        if (!NotesTabOwnsVisibleControls(tab))
            return;

        _notesPanelVisible = tab.NotesPanelVisible;
        _notesLoading = tab.NotesLoading;
        _notesDirty = tab.NotesDirty;
        _notesGameName = tab.NotesGameName;
        _notesFilePath = tab.NotesFilePath;

        if (_notesTextBox != null)
        {
            bool previousLoading = _notesLoading;
            _notesLoading = true;
            try
            {
                if (!string.Equals(_notesTextBox.Text, tab.NotesText, StringComparison.Ordinal))
                {
                    _notesApplyingText = true;
                    try
                    {
                        _notesTextBox.Text = tab.NotesText;
                    }
                    finally
                    {
                        _notesApplyingText = false;
                    }
                }
            }
            finally
            {
                _notesLoading = previousLoading;
            }
        }

        if (_notesStatusText != null)
            _notesStatusText.Text = tab.NotesStatus;

        UpdateNotesHeader();
    }

    private MtcTabPrototype? ResolveNotesTabOwner()
    {
        if (_asyncMtcTabContext.Value is { } asyncTab)
            return asyncTab;

        if (Dispatcher.UIThread.CheckAccess())
            return ActiveMtcTab;

        return ResolveCurrentMtcTabContext();
    }

    private void SaveAllTabNotesNow()
    {
        var restore = ResolveNotesTabOwner();
        if (ActiveMtcTab is { } activeTab)
            CaptureNotesState(activeTab);

        foreach (var tab in _mtcTabs.ToArray())
            SaveTabNotesNow(tab);

        if (restore is not null && NotesTabOwnsVisibleControls(restore))
            EnsureMtcTabSessionBound(restore);
    }

    private bool ShouldShowNotesPanel()
        => _notesPanelVisible && TryResolveNotesGameName(out _);

    private bool TryResolveNotesGameName(out string gameName)
    {
        string candidate =
            !string.IsNullOrWhiteSpace(_embeddedGameName)
                ? _embeddedGameName!
                : !string.IsNullOrWhiteSpace(_embeddedGameConfig?.Name)
                    ? _embeddedGameConfig!.Name
                    : _state.GameName;

        gameName = NormalizeGameName(candidate);
        return !string.IsNullOrWhiteSpace(gameName);
    }

    private void ToggleNotesPanel()
    {
        if (!TryResolveNotesGameName(out _))
        {
            RefreshNotesMenuState();
            return;
        }

        if (_notesPanelVisible)
            SaveCurrentNotesNow();

        _notesPanelVisible = !_notesPanelVisible;
        _appPrefs.ShowNotesPanel = _notesPanelVisible;
        _appPrefs.Save();
        ApplySelectedSkinSafe();
        RefreshNotesMenuState();

        if (_notesPanelVisible)
            PostToCurrentMtcTabSession(() => _notesTextBox?.Focus(), DispatcherPriority.Input);
    }

    private void RefreshNotesMenuState()
    {
        RecordMtcPerf(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "notes.menu.refresh");
        if (MtcPerfSwitches.DisableNotes)
        {
            RecordMtcSubsystemSkipped(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "notes");
            return;
        }

        if (!Dispatcher.UIThread.CheckAccess())
        {
            RecordMtcUiPost(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "notes.menu.refresh", DispatcherPriority.Background);
            PostToCurrentMtcTabSession(RefreshNotesMenuState, DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        bool hasGame = TryResolveNotesGameName(out _);
        _viewNotes.IsEnabled = hasGame;
        _viewNotes.Icon = hasGame && _notesPanelVisible
            ? new TextBlock { Text = "●", Foreground = HudAccentOk }
            : null;
    }

    private void UpdateNotesForActiveGame()
    {
        RecordMtcPerf(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "notes.update");
        if (MtcPerfSwitches.DisableNotes)
        {
            RecordMtcSubsystemSkipped(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "notes");
            return;
        }

        if (!Dispatcher.UIThread.CheckAccess())
        {
            RecordMtcUiPost(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "notes.update", DispatcherPriority.Background);
            PostToCurrentMtcTabSession(UpdateNotesForActiveGame, DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        bool hasGame = TryResolveNotesGameName(out _);
        if (!hasGame)
        {
            SaveCurrentNotesNow();
            _notesGameName = null;
            _notesFilePath = null;
            _notesTextBox = null;
            RefreshNotesMenuState();
            return;
        }

        if (_notesPanelVisible && _notesTextBox == null)
        {
            ApplySelectedSkinSafe();
            RefreshNotesMenuState();
            return;
        }

        if (_notesPanelVisible && _notesTextBox != null)
            LoadNotesForActiveGame();

        RefreshNotesMenuState();
    }

    private Control BuildNotesPanel()
    {
        if (ActiveMtcTab is { } activeTab)
        {
            EnsureMtcTabSessionBound(activeTab);
            CaptureNotesState(activeTab);
        }

        TextBox? previousTextBox = _notesTextBox;
        string? previousGameName = _notesGameName;
        string? previousFilePath = _notesFilePath;
        string previousText = previousTextBox?.Text ?? string.Empty;
        string previousStatus = _notesStatusText?.Text ?? string.Empty;
        bool previousDirty = _notesDirty;

        _notesHeaderText = new TextBlock
        {
            Foreground = HudAccent,
            FontSize = 15,
            FontWeight = FontWeight.Bold,
            Text = "Notes",
        };

        _notesStatusText = new TextBlock
        {
            Foreground = HudMuted,
            FontSize = 10,
            TextWrapping = TextWrapping.Wrap,
        };

        _notesTextBox = new TextBox
        {
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            FontFamily = new FontFamily("Cascadia Code, Menlo, Consolas, Courier New, monospace"),
            FontSize = 12,
            Background = Brushes.Black,
            Foreground = HudText,
            CaretBrush = HudAccent,
            BorderBrush = HudInnerEdge,
            BorderThickness = new Thickness(1),
            HorizontalAlignment = HorizontalAlignment.Stretch,
            VerticalAlignment = VerticalAlignment.Stretch,
            MinHeight = 0,
        };
        ScrollViewer.SetVerticalScrollBarVisibility(_notesTextBox, ScrollBarVisibility.Auto);
        ScrollViewer.SetHorizontalScrollBarVisibility(_notesTextBox, ScrollBarVisibility.Disabled);
        _notesTextBox.TextChanged += (_, _) => QueueNotesSave();
        _notesTextBox.LostFocus += (_, _) => SaveCurrentNotesNow();

        var body = new Grid
        {
            RowDefinitions =
            {
                new RowDefinition { Height = GridLength.Auto },
                new RowDefinition { Height = new GridLength(8) },
                new RowDefinition { Height = new GridLength(1, GridUnitType.Star) },
                new RowDefinition { Height = GridLength.Auto },
            },
        };
        body.Children.Add(_notesHeaderText);
        Grid.SetRow(_notesTextBox, 2);
        body.Children.Add(_notesTextBox);
        Grid.SetRow(_notesStatusText, 3);
        body.Children.Add(_notesStatusText);

        var panel = new Border
        {
            Width = ScaledNotesPanelWidth,
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1.5),
            CornerRadius = UiCornerRadius(16),
            Padding = UiThickness(10),
            Child = body,
        };

        if (!TryRestoreRebuiltNotesPanel(previousGameName, previousFilePath, previousText, previousStatus, previousDirty))
            LoadNotesForActiveGame(forceReloadCurrentPath: true);

        return panel;
    }

    private bool TryRestoreRebuiltNotesPanel(
        string? previousGameName,
        string? previousFilePath,
        string previousText,
        string previousStatus,
        bool previousDirty)
    {
        if (_notesTextBox == null ||
            string.IsNullOrWhiteSpace(previousFilePath) ||
            !TryResolveNotesGameName(out string gameName))
        {
            return false;
        }

        string path = AppPaths.NotesPathForGame(gameName);
        if (ActiveMtcTab is { } activeTab &&
            string.Equals(activeTab.NotesFilePath, path, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(activeTab.NotesGameName, gameName, StringComparison.OrdinalIgnoreCase))
        {
            BindNotesState(activeTab);
            return true;
        }

        if (!string.Equals(previousFilePath, path, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(previousGameName, gameName, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        _notesLoading = true;
        try
        {
            _notesGameName = gameName;
            _notesFilePath = path;
            _notesTextBox.Text = previousText;
            _notesDirty = previousDirty;
            if (_notesStatusText != null && !string.IsNullOrWhiteSpace(previousStatus))
                _notesStatusText.Text = previousStatus;
        }
        finally
        {
            _notesLoading = false;
            UpdateNotesHeader();
        }

        return true;
    }

    private void LoadNotesForActiveGame(bool forceReloadCurrentPath = false)
    {
        if (_notesTextBox == null || !TryResolveNotesGameName(out string gameName))
            return;

        string path = AppPaths.NotesPathForGame(gameName);
        if (!forceReloadCurrentPath &&
            string.Equals(_notesFilePath, path, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(_notesGameName, gameName, StringComparison.OrdinalIgnoreCase))
        {
            UpdateNotesHeader();
            return;
        }

        SaveCurrentNotesNow();

        _notesLoading = true;
        try
        {
            _notesGameName = gameName;
            _notesFilePath = path;
            _notesTextBox.Text = File.Exists(path) ? File.ReadAllText(path) : string.Empty;
            _notesDirty = false;
        }
        catch (Exception ex)
        {
            _notesTextBox.Text = string.Empty;
            _notesDirty = false;
            if (_notesStatusText != null)
                _notesStatusText.Text = $"Could not load notes: {ex.Message}";
        }
        finally
        {
            _notesLoading = false;
            UpdateNotesHeader();
        }
    }

    private void QueueNotesSave()
    {
        if (_notesLoading || _notesApplyingText || _notesTextBox == null)
            return;

        string notesText = _notesTextBox.Text ?? string.Empty;
        var owner = ResolveNotesTabOwner();
        if (owner is not null && NotesTabOwnsVisibleControls(owner))
        {
            owner.NotesPanelVisible = _notesPanelVisible;
            owner.NotesLoading = _notesLoading;
            owner.NotesDirty = true;
            owner.NotesGameName = _notesGameName;
            owner.NotesFilePath = _notesFilePath;
            owner.NotesText = notesText;
            owner.NotesStatus = "Unsaved changes...";
        }

        if (string.IsNullOrWhiteSpace(_notesFilePath))
            return;

        _notesDirty = true;
        _notesSaveTimer ??= CreateNotesSaveTimer();
        _notesSaveTimer.Stop();
        _notesSaveTimer.Start();
        if (_notesStatusText != null)
            _notesStatusText.Text = "Unsaved changes...";
    }

    private DispatcherTimer CreateNotesSaveTimer()
    {
        var timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(700) };
        timer.Tick += (_, _) =>
        {
            timer.Stop();
            SaveCurrentNotesNow();
        };
        return timer;
    }

    private void SaveCurrentNotesNow()
    {
        if (!_notesDirty || string.IsNullOrWhiteSpace(_notesFilePath))
            return;

        var owner = ResolveNotesTabOwner();
        bool ownsVisibleControls = owner is not null && NotesTabOwnsVisibleControls(owner);
        string notesText = ownsVisibleControls && _notesTextBox != null
            ? _notesTextBox.Text ?? string.Empty
            : owner?.NotesText ?? _notesTextBox?.Text ?? string.Empty;
        string status;

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_notesFilePath)!);
            File.WriteAllText(_notesFilePath, notesText);
            _notesDirty = false;
            status = $"Saved to {Path.GetFileName(_notesFilePath)}";
            if (ownsVisibleControls && _notesStatusText != null)
                _notesStatusText.Text = status;
        }
        catch (Exception ex)
        {
            status = $"Save failed: {ex.Message}";
            if (ownsVisibleControls && _notesStatusText != null)
                _notesStatusText.Text = status;
        }

        if (owner is not null)
        {
            owner.NotesPanelVisible = _notesPanelVisible;
            owner.NotesLoading = _notesLoading;
            owner.NotesDirty = _notesDirty;
            owner.NotesGameName = _notesGameName;
            owner.NotesFilePath = _notesFilePath;
            owner.NotesStatus = status;
            if (ownsVisibleControls)
                owner.NotesText = notesText;
        }
    }

    private void SaveTabNotesNow(MtcTabPrototype tab)
    {
        if (NotesTabOwnsVisibleControls(tab))
        {
            SaveCurrentNotesNow();
            return;
        }

        if (!tab.NotesDirty || string.IsNullOrWhiteSpace(tab.NotesFilePath))
            return;

        string status;
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(tab.NotesFilePath)!);
            File.WriteAllText(tab.NotesFilePath, tab.NotesText ?? string.Empty);
            tab.NotesDirty = false;
            status = $"Saved to {Path.GetFileName(tab.NotesFilePath)}";
        }
        catch (Exception ex)
        {
            status = $"Save failed: {ex.Message}";
        }

        tab.NotesStatus = status;
    }

    private void UpdateNotesHeader()
    {
        if (_notesHeaderText != null)
            _notesHeaderText.Text = string.IsNullOrWhiteSpace(_notesGameName)
                ? "Notes"
                : $"Notes: {_notesGameName}";

        if (_notesStatusText != null && !_notesDirty)
            _notesStatusText.Text = string.IsNullOrWhiteSpace(_notesFilePath)
                ? "Open a game to edit notes."
                : _notesFilePath;
    }
}
