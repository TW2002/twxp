using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Templates;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Threading;

namespace MTC;

public partial class MainWindow
{
    private ContentControl? _scriptWindowSidebarHost;
    private Grid? _scriptWindowWorkspace;
    private ScrollViewer? _scriptWindowWorkspaceScroll;
    private bool _scriptWindowResizeQueued;
    private double _scriptWindowExtraWidth;
    private double _scriptWindowAddedWidth;
    private double _scriptWindowOverflowWidth;
    private double _scriptWindowConsoleWidth;
    private IDisposable? _scriptWindowWidthTimer;
    private Thumb? _notesWidthGrip;
    private double _defaultNotesPaneWidth;
    private bool _manualNotesResize;

    private void ApplyScriptWindowPreferences()
    {
        foreach (var tab in _mtcTabs)
            tab.ScriptWindowPopups?.SetEnabled(!_appPrefs.ScriptWindowsInsideMtc);
        RefreshScriptWindowSidebar();
    }

    private Control BuildScriptWindowWorkspace(Control main)
    {
        var workspace = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto,Auto") };
        _scriptWindowWorkspace = workspace;
        _scriptWindowSidebarHost = new ContentControl();
        var host = _scriptWindowSidebarHost;
        workspace.Children.Add(main);
        var grip = new Thumb
        {
            Width = UiSize(10),
            Cursor = new Cursor(StandardCursorType.SizeWestEast),
            Template = new FuncControlTemplate<Thumb>((_, _) => new Border
            {
                Background = HudEdge, Width = UiSize(2),
                HorizontalAlignment = HorizontalAlignment.Center,
            }),
        };
        _notesWidthGrip = grip;
        ToolTip.SetTip(grip, "Resize Notes and script windows");
        grip.DragDelta += (_, e) => ResizeNotesPane(e.Vector.X);
        grip.DragCompleted += (_, _) => _appPrefs.Save();
        Grid.SetColumn(grip, 1);
        workspace.Children.Add(grip);
        Grid.SetColumn(host, 2);
        workspace.Children.Add(host);
        var scroll = new ScrollViewer
        {
            Content = workspace,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Disabled,
        };
        _scriptWindowWorkspaceScroll = scroll;
        scroll.SizeChanged += (_, _) =>
        {
            QueueScriptWindowResize();
            ScheduleScriptConsoleWidthRefresh();
        };
        scroll.AttachedToVisualTree += (_, _) => QueueScriptWindowResize();
        RefreshScriptWindowSidebar();
        return scroll;
    }

    private void RefreshScriptWindowSidebar()
    {
        if (_useCommandDeckSkin)
        {
            ActiveMtcTab?.ScriptWindowPopups?.SetEnabled(!_appPrefs.ScriptWindowsInsideMtc);
            RefreshCommandDeckSidebars();
            return;
        }
        if (_scriptWindowSidebarHost == null) return;
        ActiveMtcTab?.ScriptWindowPopups?.SetEnabled(!_appPrefs.ScriptWindowsInsideMtc);
        if (_scriptWindowSidebarHost.Content is ScriptWindowSidebar previous)
            previous.RequiredWidthChanged -= QueueScriptWindowResize;
        Control? content = null;
        if (ActiveMtcTab is { } tab)
        {
            var windows = _appPrefs.ScriptWindowsInsideMtc ? tab.ScriptWindows : new DockedScriptWindows();
            var notes = ShouldShowNotesPanel() ? BuildNotesPanel() : null;
            var palette = new ScriptWindowPalette(HudFrame, HudEdge, HudHeaderAlt, HudAccent, HudText);
            content = new ScriptWindowSidebar(windows, notes, _appPrefs.ScriptWindowsAboveNotes,
                    ScaledNotesPanelWidth, UiSize(1), palette, _appPrefs.ScriptWindowsInsideMtc);
        }
        _scriptWindowSidebarHost.Content = content;
        if (content != null) ApplyUiFontScale(content, CurrentUiScale);
        if (_scriptWindowSidebarHost.Content is ScriptWindowSidebar sidebar)
        {
            sidebar.SetAvailableWidth(double.PositiveInfinity);
            if (_defaultNotesPaneWidth <= 0)
                _defaultNotesPaneWidth = Math.Max(NotesPanelWidth, GetScriptWindowConsoleWidth() / 3 / UiSize(1));
            sidebar.SetNotesWidth(UiSize(_appPrefs.NotesPaneWidth > 0 ? _appPrefs.NotesPaneWidth : _defaultNotesPaneWidth));
            sidebar.SetWindowWidthLimit(GetScriptWindowConsoleWidth() / 3);
            sidebar.RequiredWidthChanged += QueueScriptWindowResize;
        }
        QueueScriptWindowResize();
        ScheduleScriptConsoleWidthRefresh();
    }

    private void ResizeNotesPane(double horizontalDelta)
    {
        double current = _scriptWindowSidebarHost?.Content switch
        {
            ScriptWindowSidebar sidebar => sidebar.NotesWidth,
            _ => 0,
        };
        if (current <= 0) return;
        // Beside mode has two equally sized columns; the grip moves their shared edge.
        double columns = _scriptWindowSidebarHost?.Content is ScriptWindowSidebar &&
            _appPrefs.ScriptWindowsInsideMtc && !_appPrefs.ScriptWindowsAboveNotes && ShouldShowNotesPanel() ? 2 : 1;
        double width = Math.Clamp(current - horizontalDelta / columns, UiSize(120), UiSize(1200));
        double growth = (width - current) * columns;
        double available = Math.Max(0, (_scriptWindowWorkspaceScroll?.Bounds.Width ?? 0) -
            (_scriptWindowSidebarHost?.Bounds.Width ?? 0) - UiSize(10) - UiSize(320));
        if (growth > available) width = current + available / columns;
        _appPrefs.NotesPaneWidth = width / UiSize(1);
        _manualNotesResize = true;
        if (_scriptWindowSidebarHost?.Content is ScriptWindowSidebar sidebarView)
            sidebarView.SetNotesWidth(width);
        ResizeForScriptWindows();
        ScheduleScriptConsoleWidthRefresh();
    }

    private void ScheduleScriptConsoleWidthRefresh()
    {
        _scriptWindowWidthTimer?.Dispose();
        if (_useCommandDeckSkin) return;
        _scriptWindowWidthTimer = DispatcherTimer.RunOnce(() =>
        {
            if (!IsVisible) return;
            TerminalControl? terminal = _useCommandDeckSkin && ActiveMtcTab is { } tab &&
                _deckTerminalControls.TryGetValue(tab.Id, out var deckTerminal) ? deckTerminal : _termCtrl;
            if (terminal == null) return;
            var start = terminal.TranslatePoint(default, this);
            var end = terminal.TranslatePoint(new Point(terminal.Bounds.Width, 0), this);
            if (start == null || end == null || end.Value.X <= start.Value.X) return;
            double width = end.Value.X - start.Value.X;
            if (Math.Abs(width - _scriptWindowConsoleWidth) <= 1) return;
            _scriptWindowConsoleWidth = width;
            QueueScriptWindowResize();
        }, TimeSpan.FromMilliseconds(80));
    }

    private double GetScriptWindowConsoleWidth()
    {
        if (_scriptWindowConsoleWidth > 0) return _scriptWindowConsoleWidth;
        return Math.Max(180, Width - ScaledClassicSidebarWidth - ScaledNotesPanelWidth - UiSize(80));
    }

    private void QueueScriptWindowResize()
    {
        if (_scriptWindowResizeQueued) return;
        _scriptWindowResizeQueued = true;
        Dispatcher.UIThread.Post(ResizeForScriptWindows, DispatcherPriority.Loaded);
    }

    private void ResizeForScriptWindows()
    {
        _scriptWindowResizeQueued = false;
        if (_useCommandDeckSkin) return;
        bool manualResize = _manualNotesResize;
        _manualNotesResize = false;
        if (_scriptWindowWorkspaceScroll is not { } scroll || _scriptWindowWorkspace is not { } workspace)
            return;

        var sidebar = _scriptWindowSidebarHost?.Content as ScriptWindowSidebar;
        if (_scriptWindowExtraWidth == 0 && sidebar?.RequiredWidth <= sidebar?.BaselineWidth && _termCtrl?.Bounds.Width > 0)
            _scriptWindowConsoleWidth = _termCtrl.Bounds.Width;
        sidebar?.SetWindowWidthLimit(GetScriptWindowConsoleWidth() / 3);
        double gap = UiSize(10);
        double required = sidebar?.RequiredWidth ?? 0;
        double baseline = sidebar?.BaselineWidth ?? 0;
        double extra = Math.Max(0, required + (required > 0 ? gap : 0) - baseline - (baseline > 0 ? gap : 0));
        if (manualResize)
        {
            // A divider drag redistributes the existing workspace, never the OS window.
            _scriptWindowExtraWidth = extra;
            _scriptWindowAddedWidth = Math.Min(_scriptWindowAddedWidth, extra);
            _scriptWindowOverflowWidth = 0;
        }
        else if (Math.Abs(extra - _scriptWindowExtraWidth) > .01)
        {
            double baseWidth = Math.Max(MinWidth, Width - _scriptWindowAddedWidth);
            double added = 0;
            if (WindowState == WindowState.Normal)
            {
                var screen = Screens.ScreenFromWindow(this) ?? Screens.Primary;
                double limit = screen != null ? screen.WorkingArea.Width / screen.Scaling - 24 : baseWidth + extra;
                double target = Math.Max(baseWidth, Math.Min(baseWidth + extra, limit));
                added = target - baseWidth;
                Width = target;
                if (screen != null && added > 0)
                {
                    int right = screen.WorkingArea.Right - (int)Math.Ceiling((target + 12) * screen.Scaling);
                    Position = new PixelPoint(Math.Max(screen.WorkingArea.X, Math.Min(Position.X, right)), Position.Y);
                }
            }
            _scriptWindowExtraWidth = extra;
            _scriptWindowAddedWidth = added;
            _scriptWindowOverflowWidth = extra - added;
        }
        if (_notesWidthGrip != null)
            _notesWidthGrip.IsVisible = required > 0;
        workspace.MinWidth = required + (required > 0 ? gap : 0) + UiSize(320);

        // At the screen edge keep the existing console/panel widths, exposing the
        // extra columns through scrolling instead of asking the star column to shrink.
        workspace.Width = Math.Max(0, scroll.Bounds.Width + _scriptWindowOverflowWidth);
    }
}
