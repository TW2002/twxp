using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.Json;
using Avalonia.Threading;
using MTC;
using TWXProxy.Core;

internal static class DesktopGame
{
    internal static async Task Run(MainWindow window, string temporary)
    {
        DirectoryInfo? root = new(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "tradewars-player"))) root = root.Parent;
        if (root == null) throw new Exception("Player checkout not found");
        string player = Path.Combine(root.FullName, "tradewars-player");
        var engineStart = new ProcessStartInfo("dotnet") { RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true };
        engineStart.ArgumentList.Add(Path.Combine(player, "lab/bin/Release/net8.0/OpenTwEnvironment.dll"));
        using Process engine = Process.Start(engineStart) ?? throw new Exception("Cannot start disposable engine");
        async Task<JsonElement> Request(object request)
        {
            await engine.StandardInput.WriteLineAsync(JsonSerializer.Serialize(request));
            await engine.StandardInput.FlushAsync();
            string line = await engine.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) ?? throw new Exception("Engine exited");
            using var doc = JsonDocument.Parse(line);
            if (doc.RootElement.TryGetProperty("error", out _)) throw new Exception(line);
            return doc.RootElement.Clone();
        }
        Process? policy = null;
        Task<string>? errors = null;
        try
        {
            JsonElement result = await Request(new { method = "reset", scenario = "trade", seed = 314000 });
            using var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            using var rpcProbe = new TcpListener(IPAddress.Loopback, 0);
            rpcProbe.Start(); int rpcPort = ((IPEndPoint)rpcProbe.LocalEndpoint).Port; rpcProbe.Stop();
            const string game = "isolated_desktop_player";
            string dbPath = AppPaths.MtcStandaloneDatabasePathForGame(game);
            Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
            var database = new ModDatabase();
            database.CreateDatabase(dbPath, new DataHeader { Sectors = 100, CommandChar = '$' });
            database.CloseDatabase();
            var config = new EmbeddedGameConfig
            {
                Name = game, Host = "127.0.0.1", Port = ((IPEndPoint)listener.LocalEndpoint).Port,
                Sectors = 100, DatabasePath = dbPath, ScriptDirectory = Path.Combine(temporary, "scripts"),
                NativeHaggleEnabled = false, LocalEcho = false, UseLogin = false,
                Mtc = new EmbeddedMtcConfig
                {
                    EmbeddedProxy = false, LocalTwxProxy = false, TwxProxyDbPath = dbPath,
                    JsonRpc = new EmbeddedMtcJsonRpcConfig { Enabled = true, Port = rpcPort, AuthToken = "desktop-test", ApprovalLevel = "full-automation" },
                },
            };
            string configPath = Path.Combine(temporary, "games", game + ".json");
            File.WriteAllText(configPath, JsonSerializer.Serialize(config));
            await (Task)typeof(MainWindow).GetMethod("ApplyLoadedGameConfigAsync", BindingFlags.Instance | BindingFlags.NonPublic)!
                .Invoke(window, [config, configPath, false, false])!;
            typeof(MainWindow).GetMethod("OpenGameAgentWindow", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(window, null);
            Task<bool> connecting = (Task<bool>)typeof(MainWindow).GetMethod("ConnectDirectTelnetAsync", BindingFlags.Instance | BindingFlags.NonPublic, null, [typeof(bool)], null)!.Invoke(window, [false])!;
            using TcpClient peer = await listener.AcceptTcpClientAsync();
            peer.NoDelay = true;
            if (!await connecting) throw new Exception("MTC did not connect");
            await Dispatcher.UIThread.InvokeAsync(() => { }, DispatcherPriority.Background);
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            Encoding encoding = Encoding.GetEncoding(437);
            await peer.GetStream().WriteAsync(encoding.GetBytes(result.GetProperty("text").GetString()!));
            var start = new ProcessStartInfo(Path.Combine(player, "outputs/wheel-smoke-venv/bin/python"))
                { WorkingDirectory = temporary, RedirectStandardOutput = true, RedirectStandardError = true };
            foreach (string arg in new[] { "-m", "tw_player.cli", "run", "--game", game, "--url", $"ws://127.0.0.1:{rpcPort}/",
                         "--execute", "--max-actions", "100", "--idle-timeout", "10", "--output", Path.Combine(player, "outputs/mtc-desktop-decisions.jsonl") }) start.ArgumentList.Add(arg);
            start.Environment["MTC_RPC_TOKEN"] = "desktop-test";
            policy = Process.Start(start) ?? throw new Exception("Cannot launch packaged policy");
            Task<string> output = policy.StandardOutput.ReadToEndAsync();
            errors = policy.StandardError.ReadToEndAsync();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(45));
            var pending = new StringBuilder();
            int steps = 0;
            while (steps < 100)
            {
                byte[] one = new byte[1];
                int count = await peer.GetStream().ReadAsync(one, timeout.Token);
                if (count == 0) throw new Exception("MTC disconnected early");
                char ch = (char)one[0];
                if (char.IsAsciiDigit(ch)) { pending.Append(ch); continue; }
                if (ch != '\r') pending.Append(ch);
                string command = pending.ToString(); pending.Clear();
                result = await Request(new { method = "step", command });
                steps++;
                if (steps < 100) await peer.GetStream().WriteAsync(encoding.GetBytes(command + "\r\n" + result.GetProperty("text").GetString()));
            }
            await policy.WaitForExitAsync(timeout.Token);
            if (policy.ExitCode != 0) throw new Exception(await errors);
            await output;
            JsonElement outcome = result.GetProperty("evaluation");
            if (outcome.GetProperty("creditsDelta").GetInt64() <= 0 || outcome.GetProperty("visitedSectors").GetInt32() < 2)
                throw new Exception("Desktop model run did not trade profitably and move");
            File.WriteAllText(Path.Combine(player, "outputs/mtc-desktop-game.json"), JsonSerializer.Serialize(new
            {
                steps, outcome, model = "bundled frontier-v2-fp16 wheel",
                path = "Real MTC MainWindow, Game Agent window, normal RPC bridge, UI dispatch, terminal input, Telnet and parsers",
                limitation = "Isolated local engine with a logged-in player; not the user's active remote game",
            }, new JsonSerializerOptions { WriteIndented = true }));
            Console.WriteLine($"PASS: real MTC desktop completed 100 packaged-model actions, profit {outcome.GetProperty("creditsDelta")}");
        }
        finally
        {
            if (policy != null)
            {
                if (!policy.HasExited) { policy.Kill(entireProcessTree: true); await policy.WaitForExitAsync(); }
                if (errors != null) File.WriteAllText(Path.Combine(player, "outputs/mtc-desktop-stderr.txt"), await errors);
                policy.Dispose();
            }
            engine.StandardInput.Close();
            try { await engine.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5)); } catch (TimeoutException) { engine.Kill(); await engine.WaitForExitAsync(); }
        }
    }
}
