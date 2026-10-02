using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using MTC;

internal static class PlayerTransportTests
{
    internal static async Task Run()
    {
        DirectoryInfo? root = new(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "tradewars-player"))) root = root.Parent;
        if (root == null) throw new Exception("Cannot locate player workspace");
        string player = Path.Combine(root.FullName, "tradewars-player");
        List<double> timings = [];
        for (int trial = 0; trial < 10; trial++) timings.Add(await Trial(player, trial));
        double[] sorted = timings.Order().ToArray();
        var report = new
        {
            trials = timings.Count, promptToInputMs = timings,
            medianMs = sorted[sorted.Length / 2], maxMs = sorted[^1],
            model = "frontier-v2",
            components = "MTC TelnetClient, economic prompt classifier, MtcJsonRpcServer, prompt guard, trained Python policy",
            limitation = "Loopback scan prompt fixture and test bridge; excludes MainWindow dispatch, real-game state parsing, and remote server latency.",
        };
        File.WriteAllText(Path.Combine(player, "outputs", "mtc-component-transport.json"), JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
        Console.WriteLine($"PASS: actual trained policy returned h through MTC Telnet/RPC in {timings.Count} trials; median {report.medianMs:F2} ms, max {report.maxMs:F2} ms");
    }

    private static async Task<double> Trial(string player, int trial)
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var buffer = new TerminalBuffer();
        using var telnet = new TelnetClient(buffer, new AnsiParser(buffer));
        Task connect = telnet.ConnectAsync("127.0.0.1", ((IPEndPoint)listener.LocalEndpoint).Port);
        using TcpClient peer = await listener.AcceptTcpClientAsync();
        peer.NoDelay = true;
        await connect;
        using var rpcPort = new TcpListener(IPAddress.Loopback, 0);
        rpcPort.Start();
        int port = ((IPEndPoint)rpcPort.LocalEndpoint).Port;
        rpcPort.Stop();
        const string game = "isolated-player-transport";
        var contextRequested = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        object sync = new();
        List<GameAgentEvent> events = [];
        IReadOnlyList<GameAgentEvent> Snapshot() { lock (sync) return events.ToArray(); }
        var bridge = new MtcRpcBridge
        {
            GetContextAsync = _ =>
            {
                contextRequested.TrySetResult();
                return Task.FromResult(new GameAgentContextSnapshot
                {
                    GameName = game, Connected = telnet.IsConnected, CurrentSector = 1,
                    Turns = 250, Credits = 1000, HoldsTotal = 20, HoldsEmpty = 20,
                    RecentEvents = Snapshot(),
                });
            },
            GetRecentEventsAsync = (_, _) => Task.FromResult(Snapshot()),
            QuerySectorAsync = _ => Task.FromResult<GameAgentSectorSnapshot?>(null),
            ListScriptsAsync = () => Task.FromResult<IReadOnlyList<GameAgentRunningScriptSnapshot>>([]),
            GetDebugSettingsAsync = _ => throw new Exception("Unexpected debug read"),
            SetDebugSettingsAsync = (_, _) => throw new Exception("Unexpected debug mutation"),
            SendCommandAsync = (_, _) => throw new Exception("Unguarded command used"),
            SendPromptCommandAsync = request =>
            {
                lock (sync)
                {
                    MtcRpcPromptGuard.Validate(request, game, telnet.IsConnected, true, events);
                    string payload = request.Command + (request.AppendEnter ? "\r" : "");
                    events.Add(new GameAgentEvent { Kind = GameAgentEventKind.ClientInput, GameName = game });
                    telnet.SendRaw(Encoding.Latin1.GetBytes(payload));
                }
                return Task.FromResult(MtcRpcActionResult.Ok("Sent to isolated TCP peer"));
            },
            RunMombotCommandAsync = _ => throw new Exception("Unexpected bot action"),
            RunScriptAsync = _ => throw new Exception("Unexpected script action"),
            StopScriptAsync = (_, _) => throw new Exception("Unexpected stop action"),
            ApproveActionAsync = (_, _) => Task.FromResult(false),
        };
        using var server = new MtcJsonRpcServer(bridge);
        server.ApplyOptions(new() { Enabled = true, BindAddress = "127.0.0.1", Port = port,
            AuthToken = "isolated-test-token", ApprovalLevel = MtcRpcApprovalLevel.FullAutomation });
        telnet.TextLineAnsiReceived += (ansi, plain) =>
        {
            var evt = new GameAgentEvent { GameName = game, CurrentSector = 1, PlainText = plain,
                AnsiText = ansi, Kind = GameAgentPromptClassifier.IsEconomicPrompt(plain) ? GameAgentEventKind.ServerPrompt : GameAgentEventKind.ServerLine };
            lock (sync) events.Add(evt);
            server.PublishGameAgentEvent(evt);
        };
        var start = new ProcessStartInfo(Path.Combine(player, ".venv", "bin", "python"))
        { WorkingDirectory = player, RedirectStandardOutput = true, RedirectStandardError = true };
        foreach (string argument in new[] { "-m", "tw_player.cli", "run", "--model", "models/frontier-v2",
                     "--goal", "trade", "--game", game, "--url", $"ws://127.0.0.1:{port}/", "--execute",
                     "--max-actions", "1", "--idle-timeout", "5", "--output", $"outputs/mtc-transport-trial-{trial}.jsonl" })
            start.ArgumentList.Add(argument);
        start.Environment["MTC_RPC_TOKEN"] = "isolated-test-token";
        using Process process = Process.Start(start) ?? throw new Exception("Cannot launch model");
        Task<string> stdout = process.StandardOutput.ReadToEndAsync();
        Task<string> stderr = process.StandardError.ReadToEndAsync();
        try
        {
            await contextRequested.Task.WaitAsync(TimeSpan.FromSeconds(10));
            long sent = Stopwatch.GetTimestamp();
            await peer.GetStream().WriteAsync(Encoding.ASCII.GetBytes("Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D]"));
            byte[] response = new byte[8];
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            int count = await peer.GetStream().ReadAsync(response, timeout.Token);
            double elapsed = Stopwatch.GetElapsedTime(sent).TotalMilliseconds;
            if (count != 1 || response[0] != 'h') throw new Exception("Model response was not atomic holo input");
            await process.WaitForExitAsync(timeout.Token);
            if (process.ExitCode != 0) throw new Exception(await stderr);
            await stdout;
            return elapsed;
        }
        finally { if (!process.HasExited) { process.Kill(entireProcessTree: true); await process.WaitForExitAsync(); } }
    }
}
