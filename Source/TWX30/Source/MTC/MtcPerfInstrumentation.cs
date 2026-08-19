using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using Avalonia.Threading;

namespace MTC;

public partial class MainWindow
{
    private const string MtcPerfLogFileName = "mtc_perf.log";
    private static readonly TimeSpan MtcPerfFlushInterval = TimeSpan.FromSeconds(5);
    private static readonly int MtcPerfProcessId = Environment.ProcessId;

    private readonly object _mtcPerfRegistrationLock = new();
    private readonly List<MtcTabPerfCounters> _mtcPerfCounterSets = [];
    private Timer? _mtcPerfFlushTimer;
    private long _mtcPerfFlushRunning;

    private sealed class MtcTabPerfCounters
    {
        private readonly ConcurrentDictionary<string, long> _counters = new(StringComparer.Ordinal);
        private long _lastSnapshotTicks = Stopwatch.GetTimestamp();

        public MtcTabPerfCounters(int tabId, string title)
        {
            TabId = tabId;
            Title = title;
        }

        public int TabId { get; }
        public string Title { get; set; }
        public string GameName { get; set; } = string.Empty;

        public void Add(string name, long value = 1)
        {
            if (value == 0)
                return;

            _counters.AddOrUpdate(name, value, (_, existing) => existing + value);
        }

        public void Max(string name, long value)
        {
            _counters.AddOrUpdate(name, value, (_, existing) => Math.Max(existing, value));
        }

        public Dictionary<string, long> DrainCounters()
        {
            var snapshot = new Dictionary<string, long>(StringComparer.Ordinal);
            foreach (var key in _counters.Keys)
            {
                if (_counters.TryRemove(key, out long value) && value != 0)
                    snapshot[key] = value;
            }

            return snapshot;
        }

        public TimeSpan MarkSnapshotElapsed()
        {
            long now = Stopwatch.GetTimestamp();
            long previous = Interlocked.Exchange(ref _lastSnapshotTicks, now);
            return Stopwatch.GetElapsedTime(previous, now);
        }
    }

    private static class MtcPerfSwitches
    {
        public static readonly bool LoggingForceEnabled = IsSet("MTC_PERF_ENABLE_LOG");
        public static readonly bool LoggingDisabled = IsSet("MTC_PERF_DISABLE_LOG");
        public static readonly bool DisableTerminalRendering = IsSet("MTC_PERF_DISABLE_TERMINAL_RENDER");
        public static readonly bool DisableSidePanels = IsSet("MTC_PERF_DISABLE_SIDE_PANELS");
        public static readonly bool DisableStatusBar = IsSet("MTC_PERF_DISABLE_STATUS_BAR");
        public static readonly bool DisableMenus = IsSet("MTC_PERF_DISABLE_MENUS");
        public static readonly bool DisableNotes = IsSet("MTC_PERF_DISABLE_NOTES");
        public static readonly bool DisableAgent = IsSet("MTC_PERF_DISABLE_AGENT");
        public static readonly bool DisableRecorderUi = IsSet("MTC_PERF_DISABLE_RECORDER_UI");

        private static bool IsSet(string name)
        {
            string? value = Environment.GetEnvironmentVariable(name);
            return !string.IsNullOrWhiteSpace(value) &&
                   !string.Equals(value, "0", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(value, "false", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(value, "no", StringComparison.OrdinalIgnoreCase);
        }

        public static string Describe()
        {
            var flags = new List<string>();
            if (DisableTerminalRendering) flags.Add("terminal-render");
            if (DisableSidePanels) flags.Add("side-panels");
            if (DisableStatusBar) flags.Add("status-bar");
            if (DisableMenus) flags.Add("menus");
            if (DisableNotes) flags.Add("notes");
            if (DisableAgent) flags.Add("agent");
            if (DisableRecorderUi) flags.Add("recorder-ui");
            return flags.Count == 0 ? "none" : string.Join(",", flags);
        }
    }

    private MtcTabPerfCounters CreateMtcTabPerfCounters(int tabId, string title)
    {
        var counters = new MtcTabPerfCounters(tabId, title);
        lock (_mtcPerfRegistrationLock)
        {
            _mtcPerfCounterSets.Add(counters);
        }

        UpdateMtcPerfInstrumentationState();
        if (IsMtcPerfLoggingEnabled())
            counters.Add("tab.created");
        return counters;
    }

    private bool IsMtcPerfLoggingEnabled()
        => !MtcPerfSwitches.LoggingDisabled &&
           MtcPerfSwitches.LoggingForceEnabled &&
           _appPrefs?.PerformanceMonitoringEnabled == true;

    private void UpdateMtcPerfInstrumentationState()
    {
        lock (_mtcPerfRegistrationLock)
        {
            if (IsMtcPerfLoggingEnabled())
            {
                _mtcPerfFlushTimer ??= new Timer(
                    _ => FlushMtcPerfCounters(),
                    null,
                    MtcPerfFlushInterval,
                    MtcPerfFlushInterval);
                return;
            }

            _mtcPerfFlushTimer?.Dispose();
            _mtcPerfFlushTimer = null;
        }
    }

    private void StopMtcPerfInstrumentation()
    {
        bool flushBeforeStop = IsMtcPerfLoggingEnabled();
        _mtcPerfFlushTimer?.Dispose();
        _mtcPerfFlushTimer = null;
        if (flushBeforeStop)
            FlushMtcPerfCounters();
    }

    private void RecordMtcPerf(MtcTabPrototype? tab, string name, long value = 1)
    {
        if (!IsMtcPerfLoggingEnabled() || tab is null)
            return;

        tab.Perf.Add(name, value);
    }

    private void RecordMtcPerfDuration(MtcTabPrototype? tab, string name, long startedTicks)
    {
        if (!IsMtcPerfLoggingEnabled() || tab is null || startedTicks == 0)
            return;

        long elapsedUs = Stopwatch.GetElapsedTime(startedTicks).Ticks / 10;
        tab.Perf.Add(name + ".count");
        tab.Perf.Add(name + ".us", elapsedUs);
    }

    private long RecordMtcUiPostStart(MtcTabPrototype? tab, string source, DispatcherPriority? priority = null)
    {
        if (!IsMtcPerfLoggingEnabled() || tab is null)
            return 0;

        tab.Perf.Add("ui.post." + source);
        if (priority is { } p)
            tab.Perf.Add("ui.post.priority." + p);
        return Stopwatch.GetTimestamp();
    }

    private void RecordMtcUiPost(MtcTabPrototype? tab, string source, DispatcherPriority? priority = null)
    {
        _ = RecordMtcUiPostStart(tab, source, priority);
    }

    private void RecordMtcUiRun(MtcTabPrototype? tab, string source)
    {
        if (!IsMtcPerfLoggingEnabled() || tab is null)
            return;

        tab.Perf.Add("ui.run." + source);
    }

    private void RecordMtcUiRun(MtcTabPrototype? tab, string source, long postedTicks)
    {
        RecordMtcUiRun(tab, source);
        if (!IsMtcPerfLoggingEnabled() || tab is null || postedTicks == 0)
            return;

        long elapsedUs = Stopwatch.GetElapsedTime(postedTicks).Ticks / 10;
        string metric = "ui.latency." + source;
        tab.Perf.Add(metric + ".count");
        tab.Perf.Add(metric + ".us", elapsedUs);
        tab.Perf.Max(metric + ".max_us", elapsedUs);
    }

    private void RecordMtcSubsystemSkipped(MtcTabPrototype? tab, string subsystem)
    {
        if (!IsMtcPerfLoggingEnabled() || tab is null)
            return;

        tab.Perf.Add("diag.skipped." + subsystem);
    }

    private void FlushMtcPerfCounters()
    {
        if (!IsMtcPerfLoggingEnabled())
            return;

        if (Interlocked.Exchange(ref _mtcPerfFlushRunning, 1) != 0)
            return;

        try
        {
            MtcTabPerfCounters[] sets;
            lock (_mtcPerfRegistrationLock)
                sets = _mtcPerfCounterSets.ToArray();

            if (sets.Length == 0)
                return;

            var lines = new StringBuilder();
            string timestamp = DateTimeOffset.Now.ToString("yyyy-MM-dd HH:mm:ss.fff zzz", CultureInfo.InvariantCulture);
            int activeTabId = Volatile.Read(ref _activeMtcTabId);

            foreach (var tab in _mtcTabs.ToArray())
            {
                if (tab.Perf is null)
                    continue;

                tab.Perf.Title = tab.Title;
                tab.Perf.GameName = tab.EmbeddedGameName ?? tab.State.GameName ?? string.Empty;
            }

            foreach (var counters in sets)
            {
                var tab = _mtcTabs.FirstOrDefault(item => item.Id == counters.TabId);
                var drained = counters.DrainCounters();
                bool hasBacklog = tab is not null &&
                                  (Volatile.Read(ref tab.PendingDisplayChunkCount) > 0 ||
                                   Volatile.Read(ref tab.PendingDisplayByteCount) > 0 ||
                                   Volatile.Read(ref tab.InactiveDisplaySnapshotLength) > 0 ||
                                   Volatile.Read(ref tab.PendingSessionLogChunkCount) > 0 ||
                                   Volatile.Read(ref tab.PendingSessionLogByteCount) > 0 ||
                                   Volatile.Read(ref tab.PausedTerminalChunkCount) > 0 ||
                                   Volatile.Read(ref tab.PausedTerminalByteCount) > 0);

                if (drained.Count == 0 && !hasBacklog)
                    continue;

                TimeSpan elapsed = counters.MarkSnapshotElapsed();
                string title = counters.Title.Replace('\t', ' ').Replace('\n', ' ').Replace('\r', ' ');
                string game = counters.GameName.Replace('\t', ' ').Replace('\n', ' ').Replace('\r', ' ');
                lines.Append(timestamp)
                    .Append('\t').Append("pid=").Append(MtcPerfProcessId)
                    .Append('\t').Append("tab=").Append(counters.TabId)
                    .Append('\t').Append("active=").Append(counters.TabId == activeTabId ? "1" : "0")
                    .Append('\t').Append("title=").Append(title)
                    .Append('\t').Append("game=").Append(game)
                    .Append('\t').Append("elapsed_ms=").Append((long)elapsed.TotalMilliseconds)
                    .Append('\t').Append("switches=").Append(MtcPerfSwitches.Describe());

                if (tab is not null)
                {
                    lines.Append('\t').Append("display_chunks=").Append(Volatile.Read(ref tab.PendingDisplayChunkCount))
                        .Append('\t').Append("display_bytes=").Append(Volatile.Read(ref tab.PendingDisplayByteCount))
                        .Append('\t').Append("inactive_snapshot_bytes=").Append(Volatile.Read(ref tab.InactiveDisplaySnapshotLength))
                        .Append('\t').Append("sessionlog_chunks=").Append(Volatile.Read(ref tab.PendingSessionLogChunkCount))
                        .Append('\t').Append("sessionlog_bytes=").Append(Volatile.Read(ref tab.PendingSessionLogByteCount))
                        .Append('\t').Append("sessionlog_empty=").Append(tab.PendingSessionLogChunks.IsEmpty ? "1" : "0")
                        .Append('\t').Append("paused_chunks=").Append(Volatile.Read(ref tab.PausedTerminalChunkCount))
                        .Append('\t').Append("paused_bytes=").Append(Volatile.Read(ref tab.PausedTerminalByteCount))
                        .Append('\t').Append("scrollback_lines=").Append(tab.Buffer.ScrollbackCount)
                        .Append('\t').Append("scrollback_cells=").Append(tab.Buffer.EstimatedScrollbackCellCount)
                        .Append('\t').Append("terminal_cols=").Append(tab.Buffer.Columns)
                        .Append('\t').Append("terminal_rows=").Append(tab.Buffer.Rows)
                        .Append('\t').Append("info_post=").Append(Volatile.Read(ref tab.InfoPanelsRefreshPostScheduled))
                        .Append('\t').Append("display_drain=").Append(Volatile.Read(ref tab.DisplayDrainScheduled))
                        .Append('\t').Append("inactive_display_drain=").Append(Volatile.Read(ref tab.InactiveDisplayDrainScheduled))
                        .Append('\t').Append("sessionlog_drain=").Append(Volatile.Read(ref tab.SessionLogDrainScheduled));
                }

                foreach (var kvp in drained.OrderBy(static item => item.Key, StringComparer.Ordinal))
                    lines.Append('\t').Append(kvp.Key).Append('=').Append(kvp.Value);

                lines.AppendLine();
            }

            if (lines.Length == 0)
                return;

            string path = GetMtcPerfLogPath();
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.AppendAllText(path, lines.ToString());
        }
        catch
        {
            // Perf logging must never affect gameplay or UI responsiveness.
        }
        finally
        {
            Interlocked.Exchange(ref _mtcPerfFlushRunning, 0);
        }
    }

    private static string GetMtcPerfLogPath()
    {
        try
        {
            return Path.Combine(AppPaths.GetDebugLogDir(), MtcPerfLogFileName);
        }
        catch
        {
            string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(home, MtcPerfLogFileName);
        }
    }
}
