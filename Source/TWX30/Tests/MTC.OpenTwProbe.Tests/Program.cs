using MTC;

await MainWindow.TestAsync();

namespace MTC
{
    public partial class MainWindow
    {
        public static async Task TestAsync()
        {
            var window = new MainWindow();
            var tab = new MtcTabPrototype();
            const string command = "Command [TL=00:00:00]:[4115] (?=Help)? : ";
            void Line(string line) => window.ObserveOpenTwMapSyncLine(tab, line);
            void Reset()
            {
                window.ResetOpenTwMapSync(tab);
                tab.GameInstance!.Sent.Clear();
            }
            void Check(bool condition, string message)
            {
                if (!condition) throw new Exception(message);
            }
            void LiftOff()
            {
                Line("Citadel command (?=help) Q");
                Line("Planet command (?=help) [D] Q");
                Line(command);
            }

            Reset();
            Line(command);
            Check(tab.GameInstance!.Sent.Count == 0, "TWGS must not be probed");
            Line("OpenTW");
            Line(command);
            Check(tab.GameInstance.Sent.Count == 0, "Late detection must not reopen login opportunity");
            Console.WriteLine("PASS TWGS and late detection do not trigger a probe");

            Reset();
            Line("Welcome to OpenTW");
            for (int i = 0; i < 20; i++) LiftOff();
            Check(tab.GameInstance.Sent.Count == 0, "Citadel login followed by q q sent a delayed probe");
            Check(tab.OpenTwInitialSyncGate.Result == true, "Skipped probe blocked startup");
            window.RequestOpenTwMapDescriptor(tab, manual: true);
            Check(tab.GameInstance.Sent.SequenceEqual(["+"]), "Explicit refresh should still work at Command");
            Console.WriteLine("PASS Citadel login never probes on later q q; manual refresh works");

            Reset();
            Line("OpenTW");
            Line(command);
            Line(command);
            Check(tab.GameInstance.Sent.SequenceEqual(["+"]), "Duplicate prompt repeated the probe");
            Line("R somebody Display Menu?");
            Check(tab.GameInstance.Sent.Count == 1, "Responded to quoted menu text");
            Line("Display Men");
            Check(tab.GameInstance.Sent.Count == 1, "Responded to an incomplete prompt");
            Line("Display Menu? ");
            Line("Display Menu? ");
            Check(tab.GameInstance.Sent.SequenceEqual(["+", "n"]), "Unsupported prompt must get exactly one n");
            Check(tab.OpenTwMapSyncStatus == "not supported", "Unsupported status was lost");
            for (int i = 0; i < 20; i++) LiftOff();
            window.RequestOpenTwMapDescriptor(tab, manual: true);
            Check(tab.GameInstance.Sent.SequenceEqual(["+", "n"]), "Unsupported server was probed again");
            Check(tab.OpenTwInitialSyncGate.Result == true, "Unsupported map blocked normal startup");
            Console.WriteLine("PASS one login probe, one n, no repeated probe on q q or duplicate menu");

            Reset();
            Line("OpenTW");
            Line(command);
            window.BeginOpenTwMapSynchronization(tab, new OpenTwMapDescriptor(5000));
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            while (Volatile.Read(ref tab.OpenTwMapSyncRunning) != 0)
                await Task.Delay(5, timeout.Token);
            Check(tab.OpenTwMapSyncStatus.StartsWith("failed:"), "Fixture must exercise a download failure");
            for (int i = 0; i < 20; i++) LiftOff();
            Line("Display Menu?");
            Check(tab.GameInstance.Sent.SequenceEqual(["+"]), "Failure rearmed probe or answered an unrelated menu");
            window.RequestOpenTwMapDescriptor(tab, manual: true);
            Check(tab.GameInstance.Sent.SequenceEqual(["+", "+"]), "Explicit retry after download failure blocked");
            Console.WriteLine("PASS failed downloads do not retry automatically or answer unrelated prompts");

            var probe = new OpenTwMapProbe();
            probe.ObserveLine(command, true, out _);
            Check(probe.TryBeginRequest(false, out long oldRequest), "Initial request blocked");
            Check(probe.Complete(oldRequest), "Timeout did not complete pending request");
            Check(!probe.TryBeginRequest(false, out _), "Timeout rearmed automatic probe");
            Check(!probe.ObserveLine("Display Menu?", true, out _), "Expired probe answered unrelated menu");
            probe.Reset();
            probe.ObserveLine(command, true, out _);
            Check(probe.TryBeginRequest(false, out long newRequest), "Reconnect did not reset opportunity");
            Check(!probe.Complete(oldRequest), "Old timeout cleared new connection's request");
            Check(probe.Complete(newRequest), "New request was lost");
            window.CancelOpenTwMapSync(tab);
            Console.WriteLine("PASS timeout and reconnect isolate request lifetimes");
        }
    }
}
