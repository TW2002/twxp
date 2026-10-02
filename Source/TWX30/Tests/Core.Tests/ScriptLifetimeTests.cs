using TWXProxy.Core;

internal static class ScriptLifetimeTests
{
    public static void ConcurrentStopsPreserveOtherScript(bool prepared)
    {
        string previousProgramDirectory = GlobalModules.ProgramDir;
        string directory = Path.Combine(Path.GetTempPath(), "twx-stop-race-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        File.WriteAllText(Path.Combine(directory, "stop.ts"), "pause\n");
        File.WriteAllText(Path.Combine(directory, "retry.ts"), """
            setdelaytrigger retry :retry 100
            pause
            :retry
            setvar $probe 1
            setdelaytrigger retry :retry 100
            pause
            """);
        var context = new TwxRuntimeContext("concurrent-stop-test");
        using var scope = GlobalModules.UseRuntimeContext(context);
        GlobalModules.ProgramDir = directory;
        GlobalModules.DebugMode = false;
        using var interpreter = new ModInterpreter { RuntimeContext = context, ProgramDir = directory, ScriptDirectory = directory };
        Script? retry = null;
        try
        {
            interpreter.Load(Path.Combine(directory, "stop.ts"), true);
            var stopped = interpreter.GetScript(0)!;
            var observer = new RetryObserver();
            interpreter.LoadAtLabel(Path.Combine(directory, "retry.ts"), true, string.Empty, script =>
            {
                retry = script;
                script.PreferPreparedExecution = prepared;
                script.ExecutionObserver = observer;
            });
            // Hold disposal until both callers have selected the same script.
            var gate = typeof(Script).GetField("_triggerLock",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.GetValue(stopped)!;
            Exception? firstError = null, secondError = null;
            var first = new Thread(() => { try { interpreter.Stop(0); } catch (Exception ex) { firstError = ex; } });
            var second = new Thread(() => { try { interpreter.StopByHandle(stopped); } catch (Exception ex) { secondError = ex; } });
            bool blocked;
            lock (gate)
            {
                first.Start();
                second.Start();
                blocked = SpinWait.SpinUntil(() =>
                    (first.ThreadState & ThreadState.WaitSleepJoin) != 0 &&
                    (second.ThreadState & ThreadState.WaitSleepJoin) != 0, TimeSpan.FromSeconds(3));
            }
            if (!first.Join(3000) || !second.Join(3000))
                throw new InvalidOperationException("Concurrent stops deadlocked.");
            if (!blocked || firstError != null || secondError != null)
                throw new InvalidOperationException($"Stop race failed: blocked={blocked}, errors={firstError} / {secondError}");
            if (interpreter.Count != 1 || !ReferenceEquals(interpreter.GetScript(0), retry))
                throw new InvalidOperationException("Concurrent stops removed the unrelated retry script.");
            int before = Volatile.Read(ref observer.Count);
            if (!SpinWait.SpinUntil(() => Volatile.Read(ref observer.Count) > before, TimeSpan.FromSeconds(3)))
                throw new InvalidOperationException("The remaining script's timer stopped working.");
            interpreter.StopByHandle(retry!);
            SpinWait.SpinUntil(() => !retry!.IsExecuting, TimeSpan.FromSeconds(3));
            before = Volatile.Read(ref observer.Count);
            Thread.Sleep(250);
            if (interpreter.Count != 0 || retry!.GetTriggerSnapshot().Count != 0 || Volatile.Read(ref observer.Count) != before)
                throw new InvalidOperationException("Stopped retry script still executes or retains triggers.");
        }
        finally
        {
            retry?.Dispose();
            interpreter.StopAll(true);
            GlobalModules.ProgramDir = previousProgramDirectory;
            Directory.SetCurrentDirectory(AppContext.BaseDirectory);
            Directory.Delete(directory, true);
        }
    }

    private sealed class RetryObserver : Script.IExecutionObserver
    {
        public int Count;
        public void OnCommandExecuted(bool prepared, ushort commandId, string commandName, int paramCount,
            int dynamicParamCount, int rawOffset, long elapsedTicks)
        {
            if (commandName == "SETVAR")
                Interlocked.Increment(ref Count);
        }
    }

    public static void StopDuringCallback(bool prepared)
    {
        string previousProgramDirectory = GlobalModules.ProgramDir;
        string directory = Path.Combine(Path.GetTempPath(), "twx-script-lifetime-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        string path = Path.Combine(directory, "retry.ts");
        File.WriteAllText(path, """
            :entry
            setdelaytrigger start :start 25
            pause
            :start
            setvar $barrier 1
            :retry
            setdelaytrigger retry :retry 25
            echo "STOPPED_SCRIPT_EXECUTED"
            pause
            """);
        var context = new TwxRuntimeContext("script-lifetime-test");
        using var scope = GlobalModules.UseRuntimeContext(context);
        GlobalModules.ProgramDir = directory;
        GlobalModules.DebugMode = false;
        using var interpreter = new ModInterpreter { RuntimeContext = context, ProgramDir = directory, ScriptDirectory = directory };
        using var observer = new CallbackBarrier();
        Script? script = null;
        try
        {
            interpreter.LoadAtLabel(path, true, "entry", loaded =>
            {
                loaded.PreferPreparedExecution = prepared;
                loaded.ExecutionObserver = observer;
                script = loaded;
            });
            if (!observer.Reached.Wait(TimeSpan.FromSeconds(3)))
                throw new InvalidOperationException("Timer callback did not reach the barrier.");

            interpreter.StopByHandle(script!);
            if (interpreter.Count != 0)
                throw new InvalidOperationException("Stopped script is still listed.");
            observer.Release.Set();
            if (!SpinWait.SpinUntil(() => !script!.IsExecuting, TimeSpan.FromSeconds(3)))
                throw new InvalidOperationException("Stopped callback did not exit.");

            Thread.Sleep(150);
            if (observer.CommandsAfterBarrier != 0 || script!.GetTriggerSnapshot().Count != 0)
                throw new InvalidOperationException($"Stopped script executed {observer.CommandsAfterBarrier} further commands and retained {script!.GetTriggerSnapshot().Count} triggers.");

            // A retained handle (including a queued callback) must not resurrect any trigger kind.
            script.SetDelayTrigger("late-delay", "retry", 25);
            script.SetTextTrigger("late-text", "retry", "READY");
            script.SetTextLineTrigger("late-line", "retry", "READY");
            script.SetTextStartTrigger("late-start", "retry", "READY");
            script.SetTextStartLineTrigger("late-start-line", "retry", "READY");
            script.SetTextOutTrigger("late-out", "retry", "READY");
            script.SetAutoTrigger("late-auto", "READY", "/", 0);
            script.SetEventTrigger("late-event", "retry", "TIME HIT", "");
            script.Resume();
            script.Execute();
            script.Dispose();
            Thread.Sleep(75);
            if (script.GetTriggerSnapshot().Count != 0 || observer.CommandsAfterBarrier != 0)
                throw new InvalidOperationException("Disposed script was resurrected through a retained handle.");
        }
        finally
        {
            observer.Release.Set();
            script?.RequestForceStop();
            SpinWait.SpinUntil(() => script?.IsExecuting != true, TimeSpan.FromSeconds(3));
            script?.KillAllTriggers();
            interpreter.StopAll(true);
            GlobalModules.ProgramDir = previousProgramDirectory;
            Directory.SetCurrentDirectory(AppContext.BaseDirectory);
            Directory.Delete(directory, recursive: true);
        }
    }

    private sealed class CallbackBarrier : Script.IExecutionObserver, IDisposable
    {
        public ManualResetEventSlim Reached { get; } = new();
        public ManualResetEventSlim Release { get; } = new();
        public int CommandsAfterBarrier;

        public void OnCommandExecuted(bool prepared, ushort commandId, string commandName, int paramCount,
            int dynamicParamCount, int rawOffset, long elapsedTicks)
        {
            if (commandName == "SETVAR")
            {
                Reached.Set();
                if (!Release.Wait(TimeSpan.FromSeconds(5)))
                    throw new TimeoutException("Script callback was not released.");
            }
            else if (Reached.IsSet)
                Interlocked.Increment(ref CommandsAfterBarrier);
        }

        public void Dispose()
        {
            Reached.Dispose();
            Release.Dispose();
        }
    }
}
