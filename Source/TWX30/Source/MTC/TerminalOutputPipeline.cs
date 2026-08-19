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
    private static readonly TimeSpan TerminalActiveDisplayDrainDelay = TimeSpan.Zero;
    private static readonly TimeSpan TerminalCatchUpDisplayDrainDelay = TimeSpan.Zero;
    private static readonly TimeSpan TerminalActiveDisplayDrainMinInterval = TimeSpan.FromMilliseconds(8);
    private static readonly TimeSpan TerminalCatchUpDisplayDrainMinInterval = TimeSpan.FromMilliseconds(4);
    private static readonly TimeSpan SessionLogDrainDelay = TimeSpan.FromMilliseconds(150);
    private const int ActiveDisplayDrainChunkLimit = 2048;
    private const int ActiveDisplayDrainByteLimit = 2 * 1024 * 1024;
    private const double ActiveDisplayDrainMilliseconds = 14;
    private const int CatchUpDisplayDrainThreshold = 512;
    private const int CatchUpDisplayDrainChunkLimit = 4096;
    private const int CatchUpDisplayDrainByteLimit = 4 * 1024 * 1024;
    private const double CatchUpDisplayDrainMilliseconds = 16;
    private const int InactiveVisualSnapshotMaxBytes = 512 * 1024;

    private MtcTabPrototype? ResolveTerminalOwner(MtcTabPrototype? owner)
    {
        if (owner is not null)
            return owner;
        return ResolveCurrentMtcTabContext();
    }

    private void SetTerminalLivePaused(bool paused)
    {
        var owner = ResolveCurrentMtcTabContext();
        if (_gameInstance == null)
        {
            _terminalLivePaused = paused;
            if (owner is not null)
                owner.TerminalLivePaused = _terminalLivePaused;
            if (paused)
                ClearPendingTerminalOutputBacklog(owner);
            else
                ClearPausedTerminalChunks(owner);
            UpdateTerminalLiveSelector();
            return;
        }

        Core.ClientType targetType = paused ? Core.ClientType.Deaf : Core.ClientType.Standard;
        _terminalLivePaused = paused;
        if (owner is not null)
            owner.TerminalLivePaused = _terminalLivePaused;
        if (paused)
            ClearPendingTerminalOutputBacklog(owner);
        else
            ClearPausedTerminalChunks(owner);

        if (_gameInstance.GetClientType(EmbeddedLocalClientIndex) == targetType)
        {
            SyncEmbeddedTerminalClientType(targetType);
            return;
        }

        _gameInstance.SetClientType(EmbeddedLocalClientIndex, targetType);
    }

    private void ApplyEmbeddedTerminalOutputMode()
    {
        if (_gameInstance == null)
            return;

        _gameInstance.SetClientType(
            EmbeddedLocalClientIndex,
            _terminalLivePaused ? Core.ClientType.Deaf : Core.ClientType.Standard);
    }

    private bool IsEmbeddedTerminalClientDeaf()
        => IsEmbeddedTerminalClientDeaf(ResolveCurrentMtcTabContext());

    private bool IsEmbeddedTerminalClientDeaf(MtcTabPrototype? owner)
    {
        return (owner?.GameInstance ?? _gameInstance)?.GetClientType(EmbeddedLocalClientIndex) == Core.ClientType.Deaf;
    }

    private bool HasPendingSessionLogBacklog()
        => HasPendingSessionLogBacklog(ResolveCurrentMtcTabContext());

    private bool HasPendingSessionLogBacklog(MtcTabPrototype? owner)
    {
        if (!(owner?.PendingSessionLogChunks ?? _pendingSessionLogChunks).IsEmpty)
            return true;

        return owner is not null
            ? Interlocked.CompareExchange(ref owner.SessionLogDrainScheduled, 0, 0) != 0
            : Interlocked.CompareExchange(ref _sessionLogDrainScheduled, 0, 0) != 0;
    }

    private void SyncEmbeddedTerminalClientType(Core.ClientType clientType)
    {
        var owner = ResolveCurrentMtcTabContext();
        _terminalLivePaused = clientType == Core.ClientType.Deaf;
        if (owner is not null)
            owner.TerminalLivePaused = _terminalLivePaused;

        if (_terminalLivePaused)
        {
            // Script-driven deafing can happen immediately after an ECHO.  Do
            // not discard already queued display chunks here, or the progress
            // line can disappear before the UI drain paints it.  Manual pause
            // still clears the backlog in SetTerminalLivePaused before it
            // changes the client type.
            ClearPausedTerminalChunks(owner);
            ClearPendingSessionLogChunks(owner);
        }
        else
        {
            ClearPausedTerminalChunks(owner);
            FlushDeferredPanelRefreshes();
        }

        UpdateTerminalLiveSelector();
    }

    private void SyncEmbeddedTerminalClientTypeStateOnly(MtcTabPrototype? owner, Core.ClientType clientType)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        bool paused = clientType == Core.ClientType.Deaf;
        owner.TerminalLivePaused = paused;
        if (paused)
        {
            ClearPausedTerminalChunks(owner);
            ClearPendingSessionLogChunks(owner);
        }
        else
        {
            ClearPausedTerminalChunks(owner);
        }
    }

    private void ClearPendingTerminalOutputBacklog()
        => ClearPendingTerminalOutputBacklog(ResolveCurrentMtcTabContext());

    private void ClearPendingTerminalOutputBacklog(MtcTabPrototype? owner)
    {
        ClearPausedTerminalChunks(owner);
        var displayQueue = owner?.PendingDisplayChunks ?? _pendingDisplayChunks;
        while (displayQueue.TryDequeue(out PendingDisplayChunk pending))
        {
            if (owner is not null)
                DecrementPendingDisplayBacklog(owner, pending.Bytes.Length);
        }

        if (owner is not null)
        {
            Interlocked.Exchange(ref owner.PendingDisplayChunkCount, 0);
            Interlocked.Exchange(ref owner.PendingDisplayByteCount, 0);
            ClearInactiveDisplaySnapshot(owner);
        }

        ResetTerminalDisplayArtifactFilterState(owner);
        ClearPendingSessionLogChunks(owner);
        if (owner is not null)
            Interlocked.Exchange(ref owner.DisplayDrainScheduled, 0);
        else
            Interlocked.Exchange(ref _displayDrainScheduled, 0);
    }

    private void EnqueueDisplayChunk(byte[] chunk, bool force = false)
        => EnqueueDisplayChunk(ResolveCurrentMtcTabContext(), chunk, force);

    private void EnqueueDisplayChunk(MtcTabPrototype? owner, byte[] chunk, bool force = false)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        if (chunk.Length == 0)
            return;

        RecordMtcPerf(owner, "display.enqueue.chunks");
        RecordMtcPerf(owner, "display.enqueue.bytes", chunk.Length);

        if (MtcPerfSwitches.DisableTerminalRendering)
        {
            RecordMtcSubsystemSkipped(owner, "terminal-render");
            return;
        }

        bool terminalPaused = owner?.TerminalLivePaused ?? _terminalLivePaused;
        if (terminalPaused && !force)
        {
            RecordMtcPerf(owner, "display.enqueue.paused_skipped");
            return;
        }

        if (owner is not null && !ShouldRenderMtcTabTerminal(owner))
        {
            RecordMtcPerf(owner, "display.enqueue.inactive.chunks");
            RecordMtcPerf(owner, "display.enqueue.inactive.bytes", chunk.Length);
            RetainInactiveDisplaySnapshot(owner, chunk);
            return;
        }

        if (owner is not null)
        {
            Interlocked.Increment(ref owner.PendingDisplayChunkCount);
            Interlocked.Add(ref owner.PendingDisplayByteCount, chunk.Length);
        }
        (owner?.PendingDisplayChunks ?? _pendingDisplayChunks).Enqueue(new PendingDisplayChunk(chunk));

        ScheduleDisplayDrain(owner, TerminalActiveDisplayDrainDelay);
    }

    private void RetainInactiveDisplaySnapshot(MtcTabPrototype owner, byte[] chunk)
    {
        lock (owner.InactiveDisplaySnapshotSync)
        {
            if (owner.InactiveDisplaySnapshotBuffer.Length != InactiveVisualSnapshotMaxBytes)
            {
                owner.InactiveDisplaySnapshotBuffer = new byte[InactiveVisualSnapshotMaxBytes];
                owner.InactiveDisplaySnapshotStart = 0;
                owner.InactiveDisplaySnapshotLength = 0;
            }

            int copyLength = Math.Min(chunk.Length, InactiveVisualSnapshotMaxBytes);
            int sourceOffset = chunk.Length - copyLength;
            if (chunk.Length > copyLength)
            {
                RecordMtcPerf(owner, "display.enqueue.inactive.trim_oversized");
                RecordMtcPerf(owner, "display.enqueue.inactive.trim_bytes", chunk.Length - copyLength);
                owner.InactiveDisplaySnapshotStart = 0;
                owner.InactiveDisplaySnapshotLength = 0;
            }
            else
            {
                int free = InactiveVisualSnapshotMaxBytes - owner.InactiveDisplaySnapshotLength;
                if (copyLength > free)
                {
                    int droppedBytes = copyLength - free;
                    owner.InactiveDisplaySnapshotStart =
                        (owner.InactiveDisplaySnapshotStart + droppedBytes) % InactiveVisualSnapshotMaxBytes;
                    owner.InactiveDisplaySnapshotLength -= droppedBytes;
                    RecordMtcPerf(owner, "display.enqueue.inactive.trim_bytes", droppedBytes);
                }
            }

            int writeOffset =
                (owner.InactiveDisplaySnapshotStart + owner.InactiveDisplaySnapshotLength) %
                InactiveVisualSnapshotMaxBytes;
            int firstCopyLength = Math.Min(copyLength, InactiveVisualSnapshotMaxBytes - writeOffset);
            Buffer.BlockCopy(chunk, sourceOffset, owner.InactiveDisplaySnapshotBuffer, writeOffset, firstCopyLength);

            int remaining = copyLength - firstCopyLength;
            if (remaining > 0)
            {
                Buffer.BlockCopy(
                    chunk,
                    sourceOffset + firstCopyLength,
                    owner.InactiveDisplaySnapshotBuffer,
                    0,
                    remaining);
            }

            owner.InactiveDisplaySnapshotLength += copyLength;
        }

        RecordMtcPerf(owner, "display.inactive.snapshot.chunks");
        RecordMtcPerf(owner, "display.inactive.snapshot.bytes", chunk.Length);
        RecordMtcPerf(owner, "display.inactive.snapshot.deferred");
        Interlocked.Exchange(ref owner.InactiveDisplayDrainScheduled, 0);
    }

    private void ScheduleDisplayDrain(TimeSpan delay)
        => ScheduleDisplayDrain(ResolveCurrentMtcTabContext(), delay);

    private void ScheduleDisplayDrain(MtcTabPrototype? owner, TimeSpan delay)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;
        MtcTabPrototype drainOwner = owner;

        if (!ShouldRenderMtcTabTerminal(drainOwner))
        {
            RecordMtcPerf(drainOwner, "display.drain.inactive_deferred");
            return;
        }

        if (Interlocked.Exchange(ref drainOwner.DisplayDrainScheduled, 1) != 0)
            return;

        TimeSpan effectiveDelay = delay <= TimeSpan.Zero
            ? GetDisplayDrainThrottleDelay(drainOwner)
            : delay;

        if (effectiveDelay <= TimeSpan.Zero)
        {
            long postedTicks = RecordMtcUiPostStart(drainOwner, "display.drain", DispatcherPriority.Render);
            Dispatcher.UIThread.Post(() => RunScheduledDisplayDrain(drainOwner, "display.drain", postedTicks), DispatcherPriority.Render);
            return;
        }

        DispatcherTimer timer = drainOwner.DisplayDrainTimer ??= new DispatcherTimer(DispatcherPriority.Render);
        if (!drainOwner.DisplayDrainTimerWired)
        {
            timer.Tick += (_, _) =>
            {
                drainOwner.DisplayDrainTimer?.Stop();
                RunScheduledDisplayDrain(drainOwner, "display.drain.delayed");
            };
            drainOwner.DisplayDrainTimerWired = true;
        }

        RecordMtcUiPost(drainOwner, "display.drain.delayed", DispatcherPriority.Render);
        timer.Stop();
        timer.Interval = effectiveDelay;
        timer.Start();
    }

    private TimeSpan GetDisplayDrainThrottleDelay(MtcTabPrototype owner)
    {
        long lastTicks = Volatile.Read(ref owner.LastDisplayDrainTicks);
        if (lastTicks <= 0)
            return TimeSpan.Zero;

        TimeSpan elapsed = Stopwatch.GetElapsedTime(lastTicks);
        TimeSpan minInterval = Volatile.Read(ref owner.PendingDisplayChunkCount) >= CatchUpDisplayDrainThreshold
            ? TerminalCatchUpDisplayDrainMinInterval
            : TerminalActiveDisplayDrainMinInterval;

        return elapsed >= minInterval ? TimeSpan.Zero : minInterval - elapsed;
    }

    private void RunScheduledDisplayDrain(MtcTabPrototype owner, string source)
        => RunScheduledDisplayDrain(owner, source, 0);

    private void RunScheduledDisplayDrain(MtcTabPrototype owner, string source, long postedTicks)
    {
        if (!ShouldRenderMtcTabTerminal(owner))
        {
            RecordMtcPerf(owner, $"{source}.inactive_skip");
            owner.DisplayDrainTimer?.Stop();
            Interlocked.Exchange(ref owner.DisplayDrainScheduled, 0);
            return;
        }

        RecordMtcUiRun(owner, source, postedTicks);
        ExecuteInMtcTabBackgroundContext(owner, () => DrainPendingDisplayChunks(owner));
    }

    private bool HasPendingTerminalDisplayBacklog()
        => HasPendingTerminalDisplayBacklog(ResolveCurrentMtcTabContext());

    private bool HasPendingTerminalDisplayBacklog(MtcTabPrototype? owner)
    {
        if (!(owner?.PendingDisplayChunks ?? _pendingDisplayChunks).IsEmpty)
            return true;

        if (owner is not null && Volatile.Read(ref owner.InactiveDisplaySnapshotLength) > 0)
            return true;

        return owner is not null
            ? Interlocked.CompareExchange(ref owner.DisplayDrainScheduled, 0, 0) != 0
            : Interlocked.CompareExchange(ref _displayDrainScheduled, 0, 0) != 0;
    }

    private void DrainPendingDisplayChunks()
        => DrainPendingDisplayChunks(ResolveCurrentMtcTabContext());

    private void DrainPendingDisplayChunks(MtcTabPrototype? owner)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        var ownerTab = owner;

        if (!ShouldRenderMtcTabTerminal(ownerTab))
        {
            RecordMtcPerf(ownerTab, "display.drain.inactive_deferred");
            Interlocked.Exchange(ref ownerTab.DisplayDrainScheduled, 0);
            return;
        }

        if (!IsMtcTabBackgroundContext(ownerTab))
        {
            RecordMtcPerf(ownerTab, "display.drain.background_context_handoff");
            ExecuteInMtcTabBackgroundContext(ownerTab, () => DrainPendingDisplayChunks(ownerTab));
            return;
        }

        long started = Stopwatch.GetTimestamp();
        int queuedAtStart = Volatile.Read(ref ownerTab.PendingDisplayChunkCount);
        RecordMtcPerf(ownerTab, "display.drain.start");
        RecordMtcPerf(ownerTab, "display.drain.queued_start", queuedAtStart);
        bool catchUp = queuedAtStart >= CatchUpDisplayDrainThreshold;
        if (catchUp)
            RecordMtcPerf(ownerTab, "display.drain.catchup");

        int processed = DrainDisplayQueueToBuffer(
            ownerTab,
            catchUp ? CatchUpDisplayDrainChunkLimit : ActiveDisplayDrainChunkLimit,
            catchUp ? CatchUpDisplayDrainByteLimit : ActiveDisplayDrainByteLimit,
            catchUp ? CatchUpDisplayDrainMilliseconds : ActiveDisplayDrainMilliseconds,
            lockBuffer: false);
        RecordMtcPerf(ownerTab, "display.drain.processed", processed);
        RecordMtcPerfDuration(ownerTab, "display.drain", started);
        Volatile.Write(ref ownerTab.LastDisplayDrainTicks, Stopwatch.GetTimestamp());

        Interlocked.Exchange(ref ownerTab.DisplayDrainScheduled, 0);

        if (!ownerTab.PendingDisplayChunks.IsEmpty)
        {
            var nextDelay = Volatile.Read(ref ownerTab.PendingDisplayChunkCount) >= CatchUpDisplayDrainThreshold
                ? TerminalCatchUpDisplayDrainDelay
                : TerminalActiveDisplayDrainDelay;
            ScheduleDisplayDrain(ownerTab, nextDelay);
            return;
        }

        FlushDeferredPanelRefreshes();
    }

    private void RenderPendingDisplaySnapshotOnActivation(MtcTabPrototype owner)
    {
        CondensePendingDisplayChunksForInactiveTab(owner, "display.activation_condense");
        DrainInactiveDisplaySnapshotToTerminalState(owner, "display.activation_snapshot");
    }

    private void CondensePendingDisplayChunksForInactiveTab(MtcTabPrototype? owner, string source)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        int queuedChunks = Volatile.Read(ref owner.PendingDisplayChunkCount);
        long queuedBytes = Volatile.Read(ref owner.PendingDisplayByteCount);
        if (queuedChunks <= 0 && owner.PendingDisplayChunks.IsEmpty)
        {
            Interlocked.Exchange(ref owner.PendingDisplayChunkCount, 0);
            Interlocked.Exchange(ref owner.PendingDisplayByteCount, 0);
            Interlocked.Exchange(ref owner.DisplayDrainScheduled, 0);
            Interlocked.Exchange(ref owner.InactiveDisplayDrainScheduled, 0);
            return;
        }

        long started = Stopwatch.GetTimestamp();
        int condensedChunks = 0;
        long condensedBytes = 0;
        while (owner.PendingDisplayChunks.TryDequeue(out PendingDisplayChunk pending))
        {
            DecrementPendingDisplayBacklog(owner, pending.Bytes.Length);
            if (pending.Bytes.Length > 0)
            {
                RetainInactiveDisplaySnapshot(owner, pending.Bytes);
                condensedBytes += pending.Bytes.Length;
            }

            condensedChunks++;
        }

        Interlocked.Exchange(ref owner.PendingDisplayChunkCount, 0);
        Interlocked.Exchange(ref owner.PendingDisplayByteCount, 0);
        Interlocked.Exchange(ref owner.DisplayDrainScheduled, 0);
        Interlocked.Exchange(ref owner.InactiveDisplayDrainScheduled, 0);

        RecordMtcPerf(owner, $"{source}.queued_chunks", queuedChunks);
        RecordMtcPerf(owner, $"{source}.queued_bytes", queuedBytes);
        RecordMtcPerf(owner, $"{source}.condensed_chunks", condensedChunks);
        RecordMtcPerf(owner, $"{source}.condensed_bytes", condensedBytes);
        RecordMtcPerfDuration(owner, source, started);
    }

    private void DrainInactiveDisplaySnapshotToTerminalState(MtcTabPrototype owner, string source)
    {
        byte[] snapshot = TakeInactiveDisplaySnapshot(owner);
        if (snapshot.Length == 0)
            return;

        ExecuteInMtcTabBackgroundContext(owner, () =>
        {
            long started = Stopwatch.GetTimestamp();
            lock (owner.TerminalBufferSync)
            {
                using (owner.Buffer.BeginUpdate())
                {
                    owner.Parser.Feed(snapshot, snapshot.Length);
                }
            }

            RecordMtcPerf(owner, $"{source}.bytes", snapshot.Length);
            RecordMtcPerfDuration(owner, source, started);
        });
    }

    private byte[] TakeInactiveDisplaySnapshot(MtcTabPrototype owner)
    {
        lock (owner.InactiveDisplaySnapshotSync)
        {
            int length = owner.InactiveDisplaySnapshotLength;
            if (length <= 0 || owner.InactiveDisplaySnapshotBuffer.Length == 0)
                return Array.Empty<byte>();

            var snapshot = new byte[length];
            int firstCopyLength = Math.Min(length, owner.InactiveDisplaySnapshotBuffer.Length - owner.InactiveDisplaySnapshotStart);
            Buffer.BlockCopy(
                owner.InactiveDisplaySnapshotBuffer,
                owner.InactiveDisplaySnapshotStart,
                snapshot,
                0,
                firstCopyLength);

            int remaining = length - firstCopyLength;
            if (remaining > 0)
                Buffer.BlockCopy(owner.InactiveDisplaySnapshotBuffer, 0, snapshot, firstCopyLength, remaining);

            owner.InactiveDisplaySnapshotStart = 0;
            owner.InactiveDisplaySnapshotLength = 0;
            return snapshot;
        }
    }

    private static void ClearInactiveDisplaySnapshot(MtcTabPrototype owner)
    {
        lock (owner.InactiveDisplaySnapshotSync)
        {
            owner.InactiveDisplaySnapshotStart = 0;
            owner.InactiveDisplaySnapshotLength = 0;
        }
    }

    private void DrainQueuedDisplayChunksToTerminalState(MtcTabPrototype owner, string source)
    {
        if (owner.PendingDisplayChunks.IsEmpty)
        {
            Interlocked.Exchange(ref owner.DisplayDrainScheduled, 0);
            Interlocked.Exchange(ref owner.InactiveDisplayDrainScheduled, 0);
            return;
        }

        ExecuteInMtcTabBackgroundContext(owner, () =>
        {
            long started = Stopwatch.GetTimestamp();
            int queuedChunks = Volatile.Read(ref owner.PendingDisplayChunkCount);
            long queuedBytes = Volatile.Read(ref owner.PendingDisplayByteCount);
            int processedChunks = 0;
            while (!owner.PendingDisplayChunks.IsEmpty)
            {
                int processed = DrainDisplayQueueToBuffer(
                    owner,
                    int.MaxValue,
                    int.MaxValue,
                    maxMillisecondsPerPass: 0,
                    lockBuffer: true);
                if (processed <= 0)
                    break;
                processedChunks += processed;
            }

            RecordMtcPerf(owner, $"{source}.queued_chunks", queuedChunks);
            RecordMtcPerf(owner, $"{source}.queued_bytes", queuedBytes);
            RecordMtcPerf(owner, $"{source}.processed", processedChunks);
            RecordMtcPerfDuration(owner, source, started);
        });

        Interlocked.Exchange(ref owner.DisplayDrainScheduled, 0);
        Interlocked.Exchange(ref owner.InactiveDisplayDrainScheduled, 0);
    }

    private int DrainDisplayQueueToBuffer(
        MtcTabPrototype ownerTab,
        int maxChunksPerPass,
        int maxBytesPerPass,
        double maxMillisecondsPerPass,
        bool lockBuffer)
    {
        int processedChunks = 0;
        int processedBytes = 0;
        long startedAt = Stopwatch.GetTimestamp();
        var displayQueue = ownerTab.PendingDisplayChunks;
        var targetBuffer = ownerTab.Buffer;
        var targetParser = ownerTab.Parser;

        void Drain()
        {
            using (targetBuffer.BeginUpdate())
            {
                while (displayQueue.TryDequeue(out PendingDisplayChunk chunk))
                {
                    DecrementPendingDisplayBacklog(ownerTab, chunk.Bytes.Length);

                    if (chunk.Bytes.Length > 0)
                    {
                        targetParser.Feed(chunk.Bytes, chunk.Bytes.Length);
                        processedBytes += chunk.Bytes.Length;
                        RecordMtcPerf(ownerTab, "display.feed.bytes", chunk.Bytes.Length);
                    }

                    processedChunks++;

                    if (!displayQueue.IsEmpty &&
                        (processedChunks >= maxChunksPerPass ||
                         processedBytes >= maxBytesPerPass ||
                         (maxMillisecondsPerPass > 0 &&
                          Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds >= maxMillisecondsPerPass)))
                    {
                        break;
                    }
                }
            }
        }

        if (lockBuffer)
        {
            lock (ownerTab.TerminalBufferSync)
                Drain();
        }
        else
        {
            Drain();
        }

        RecordMtcPerf(ownerTab, "display.feed.chunks", processedChunks);
        RecordMtcPerf(ownerTab, "display.feed.total_bytes", processedBytes);
        RecordMtcPerfDuration(ownerTab, "display.feed", startedAt);
        return processedChunks;
    }

    private static void DecrementPendingDisplayBacklog(MtcTabPrototype ownerTab, int byteCount)
    {
        DecrementPendingDisplayChunkCount(ownerTab);
        if (byteCount <= 0)
            return;

        while (true)
        {
            long current = Volatile.Read(ref ownerTab.PendingDisplayByteCount);
            if (current <= 0)
                return;

            long next = Math.Max(0, current - byteCount);
            if (Interlocked.CompareExchange(ref ownerTab.PendingDisplayByteCount, next, current) == current)
                return;
        }
    }

    private static void DecrementPendingDisplayChunkCount(MtcTabPrototype ownerTab)
    {
        while (true)
        {
            int current = Volatile.Read(ref ownerTab.PendingDisplayChunkCount);
            if (current <= 0)
                return;

            if (Interlocked.CompareExchange(ref ownerTab.PendingDisplayChunkCount, current - 1, current) == current)
                return;
        }
    }

    private void QueueSessionLogChunk(byte[] chunk)
        => QueueSessionLogChunk(ResolveCurrentMtcTabContext(), chunk);

    private void QueueSessionLogChunk(MtcTabPrototype? owner, byte[] chunk)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        if (chunk.Length == 0)
            return;

        RecordMtcPerf(owner, "sessionlog.enqueue.chunks");
        RecordMtcPerf(owner, "sessionlog.enqueue.bytes", chunk.Length);
        if (owner is not null)
        {
            Interlocked.Increment(ref owner.PendingSessionLogChunkCount);
            Interlocked.Add(ref owner.PendingSessionLogByteCount, chunk.Length);
            owner.PendingSessionLogChunks.Enqueue(chunk);
            if (Interlocked.Exchange(ref owner.SessionLogDrainScheduled, 1) != 0)
                return;
        }
        else
        {
            _pendingSessionLogChunks.Enqueue(chunk);
            if (Interlocked.Exchange(ref _sessionLogDrainScheduled, 1) != 0)
                return;
        }

        ScheduleSessionLogDrain(owner);
    }

    private void DrainSessionLogChunks()
        => DrainSessionLogChunks(ResolveCurrentMtcTabContext());

    private void DrainSessionLogChunks(MtcTabPrototype? owner)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        if (!IsMtcTabBackgroundContext(owner))
        {
            RecordMtcPerf(owner, "sessionlog.drain.background_context_handoff");
            ExecuteInMtcTabBackgroundContext(owner, () => DrainSessionLogChunks(owner));
            return;
        }

        var logQueue = owner?.PendingSessionLogChunks ?? _pendingSessionLogChunks;
        var targetLog = owner?.SessionLog ?? _sessionLog;
        int processedChunks = 0;
        int processedBytes = 0;
        long started = Stopwatch.GetTimestamp();
        try
        {
            while (logQueue.TryDequeue(out byte[]? chunk))
            {
                if (owner is not null)
                    DecrementPendingSessionLogBacklog(owner, chunk.Length);
                targetLog.RecordServerData(chunk);
                processedChunks++;
                processedBytes += chunk.Length;
            }
        }
        finally
        {
            RecordMtcPerf(owner, "sessionlog.drain.chunks", processedChunks);
            RecordMtcPerf(owner, "sessionlog.drain.bytes", processedBytes);
            RecordMtcPerfDuration(owner, "sessionlog.drain", started);
            if (owner is not null)
            {
                Interlocked.Exchange(ref owner.SessionLogDrainScheduled, 0);
                if (!logQueue.IsEmpty &&
                    Interlocked.Exchange(ref owner.SessionLogDrainScheduled, 1) == 0)
                {
                    ScheduleSessionLogDrain(owner);
                }
            }
            else
            {
                Interlocked.Exchange(ref _sessionLogDrainScheduled, 0);
                if (!logQueue.IsEmpty &&
                    Interlocked.Exchange(ref _sessionLogDrainScheduled, 1) == 0)
                {
                    ScheduleSessionLogDrain(owner);
                }
            }
        }
    }

    private void ScheduleSessionLogDrain(MtcTabPrototype? owner)
    {
        RecordMtcPerf(owner, "sessionlog.drain.schedule");
        _ = System.Threading.Tasks.Task.Run(async () =>
        {
            try
            {
                await System.Threading.Tasks.Task.Delay(SessionLogDrainDelay).ConfigureAwait(false);
                DrainSessionLogChunks(owner);
            }
            catch
            {
                if (owner is not null)
                    Interlocked.Exchange(ref owner.SessionLogDrainScheduled, 0);
                else
                    Interlocked.Exchange(ref _sessionLogDrainScheduled, 0);
            }
        });
    }

    private void ClearPendingSessionLogChunks()
        => ClearPendingSessionLogChunks(ResolveCurrentMtcTabContext());

    private void ClearPendingSessionLogChunks(MtcTabPrototype? owner)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        var logQueue = owner?.PendingSessionLogChunks ?? _pendingSessionLogChunks;
        while (logQueue.TryDequeue(out byte[]? chunk))
        {
            if (owner is not null)
                DecrementPendingSessionLogBacklog(owner, chunk.Length);
        }

        if (owner is not null)
        {
            Interlocked.Exchange(ref owner.PendingSessionLogChunkCount, 0);
            Interlocked.Exchange(ref owner.PendingSessionLogByteCount, 0);
            Interlocked.Exchange(ref owner.SessionLogDrainScheduled, 0);
        }
        else
        {
            Interlocked.Exchange(ref _sessionLogDrainScheduled, 0);
        }
    }

    private static void DecrementPendingSessionLogBacklog(MtcTabPrototype ownerTab, int byteCount)
    {
        DecrementPendingSessionLogChunkCount(ownerTab);
        if (byteCount <= 0)
            return;

        while (true)
        {
            long current = Volatile.Read(ref ownerTab.PendingSessionLogByteCount);
            if (current <= 0)
                return;

            long next = Math.Max(0, current - byteCount);
            if (Interlocked.CompareExchange(ref ownerTab.PendingSessionLogByteCount, next, current) == current)
                return;
        }
    }

    private static void DecrementPendingSessionLogChunkCount(MtcTabPrototype ownerTab)
    {
        while (true)
        {
            int current = Volatile.Read(ref ownerTab.PendingSessionLogChunkCount);
            if (current <= 0)
                return;

            if (Interlocked.CompareExchange(ref ownerTab.PendingSessionLogChunkCount, current - 1, current) == current)
                return;
        }
    }

    private void ResetTerminalDisplayArtifactFilterState()
        => ResetTerminalDisplayArtifactFilterState(ResolveCurrentMtcTabContext());

    private void ResetTerminalDisplayArtifactFilterState(MtcTabPrototype? owner)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        object sync = owner?.TerminalDisplayArtifactSync ?? _terminalDisplayArtifactSync;
        lock (sync)
        {
            if (owner is not null)
            {
                owner.PendingTerminalSyncMarkerLeadByte = false;
                owner.PendingTerminalSyncMarkerUtf8LeadByte = false;
                return;
            }

            _pendingTerminalSyncMarkerLeadByte = false;
            _pendingTerminalSyncMarkerUtf8LeadByte = false;
        }
    }

    private void QueuePausedTerminalChunk(byte[] chunk)
        => QueuePausedTerminalChunk(ResolveCurrentMtcTabContext(), chunk);

    private void QueuePausedTerminalChunk(MtcTabPrototype? owner, byte[] chunk)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        byte[] filteredChunk = FilterTerminalDisplayArtifacts(owner, chunk);
        if (filteredChunk.Length == 0)
            return;

        var copy = new byte[filteredChunk.Length];
        Buffer.BlockCopy(filteredChunk, 0, copy, 0, filteredChunk.Length);

        if (owner is not null)
        {
            lock (owner.TerminalDisplayArtifactSync)
            {
                owner.PausedTerminalChunks.Add(copy);
                Interlocked.Increment(ref owner.PausedTerminalChunkCount);
                Interlocked.Add(ref owner.PausedTerminalByteCount, copy.Length);
            }
            return;
        }

        lock (_pausedTerminalSync)
            _pausedTerminalChunks.Add(copy);
    }

    private void ClearPausedTerminalChunks()
        => ClearPausedTerminalChunks(ResolveCurrentMtcTabContext());

    private void ClearPausedTerminalChunks(MtcTabPrototype? owner)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        if (owner is not null)
        {
            lock (owner.TerminalDisplayArtifactSync)
            {
                owner.PausedTerminalChunks.Clear();
                Interlocked.Exchange(ref owner.PausedTerminalChunkCount, 0);
                Interlocked.Exchange(ref owner.PausedTerminalByteCount, 0);
            }
            return;
        }

        lock (_pausedTerminalSync)
            _pausedTerminalChunks.Clear();
    }

    private void FlushPausedTerminalChunksToDisplay()
        => FlushPausedTerminalChunksToDisplay(ResolveCurrentMtcTabContext());

    private void FlushPausedTerminalChunksToDisplay(MtcTabPrototype? owner)
    {
        owner = ResolveTerminalOwner(owner);
        if (owner is null)
            return;

        if (!IsMtcTabBackgroundContext(owner))
        {
            ExecuteInMtcTabBackgroundContext(owner, () => FlushPausedTerminalChunksToDisplay(owner));
            return;
        }

        bool replayed = false;

        while (true)
        {
            List<byte[]> pending;
            if (owner is not null)
            {
                lock (owner.TerminalDisplayArtifactSync)
                {
                    if (owner.PausedTerminalChunks.Count == 0)
                        break;

                    pending = new List<byte[]>(owner.PausedTerminalChunks);
                    owner.PausedTerminalChunks.Clear();
                    Interlocked.Exchange(ref owner.PausedTerminalChunkCount, 0);
                    Interlocked.Exchange(ref owner.PausedTerminalByteCount, 0);
                }
            }
            else
            {
                lock (_pausedTerminalSync)
                {
                    if (_pausedTerminalChunks.Count == 0)
                        break;

                    pending = new List<byte[]>(_pausedTerminalChunks);
                    _pausedTerminalChunks.Clear();
                }
            }

            var targetBuffer = owner?.Buffer ?? _buffer;
            var targetParser = owner?.Parser ?? _parser;
            using (targetBuffer.BeginUpdate())
            {
                foreach (byte[] chunk in pending)
                {
                    targetParser.Feed(chunk, chunk.Length);
                    replayed = true;
                }
            }
        }

        if (!replayed)
            return;

        bool promptOpen = HasMombotInteractiveStateFor(owner);
        if ((owner is null || owner.Id == _activeMtcTabId) && promptOpen)
            ExecuteInOptionalMtcTabSession(owner, () => RedrawMombotPrompt());
        (owner?.Buffer ?? _buffer).Dirty = true;
    }

}
