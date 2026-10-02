using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using MTC;
using TWXProxy.Core;

internal static class ShipTransportTests
{
    internal static async Task Run()
    {
        DirectoryInfo? root = new(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "tradewars-player"))) root = root.Parent;
        if (root == null) throw new Exception("Cannot locate engine lab");
        string player = Path.Combine(root.FullName, "tradewars-player");
        var start = new ProcessStartInfo("dotnet") { RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true };
        start.ArgumentList.Add(Path.Combine(player, "lab/bin/Release/net8.0/OpenTwEnvironment.dll"));
        using Process engine = Process.Start(start) ?? throw new Exception("Cannot start isolated engine");
        async Task<JsonElement> Request(object request)
        {
            await engine.StandardInput.WriteLineAsync(JsonSerializer.Serialize(request));
            await engine.StandardInput.FlushAsync();
            string line = await engine.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10)) ?? throw new Exception("Engine exited");
            using var doc = JsonDocument.Parse(line);
            if (doc.RootElement.TryGetProperty("error", out _)) throw new Exception(line);
            return doc.RootElement.Clone();
        }
        try
        {
            await Request(new { method = "reset", scenario = "trade", seed = 314000 });
            foreach (string command in new[] { "p", "t", "", "" }) await Request(new { method = "step", command });
            JsonElement result = await Request(new { method = "step", command = "/" });
            JsonElement expected = result.GetProperty("context");
            if (expected.GetProperty("fuelOre").GetInt32() == 0) throw new Exception("Engine fixture did not buy cargo");
            using var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            var buffer = new TerminalBuffer();
            using var client = new TelnetClient(buffer, new AnsiParser(buffer));
            var parser = new ShipInfoParser();
            var updated = new TaskCompletionSource<ShipStatus>(TaskCreationOptions.RunContinuationsAsynchronously);
            parser.Updated += status => updated.TrySetResult(parser.CurrentStatus);
            client.TextLineReceived += parser.FeedLine;
            Task connect = client.ConnectAsync("127.0.0.1", ((IPEndPoint)listener.LocalEndpoint).Port);
            using TcpClient peer = await listener.AcceptTcpClientAsync();
            await connect;
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            byte[] wire = Encoding.GetEncoding(437).GetBytes(result.GetProperty("text").GetString()!);
            // Split within a quickstats token, as a TCP stream is free to do.
            await peer.GetStream().WriteAsync(wire.AsMemory(0, 9));
            await peer.GetStream().WriteAsync(wire.AsMemory(9));
            ShipStatus parsed = await updated.Task.WaitAsync(TimeSpan.FromSeconds(5));
            var state = new GameState { GameName = "isolated-ship-transport", Connected = true,
                Sector = parsed.CurrentSector, Credits = parsed.Credits, Turns = parsed.Turns,
                HoldsTotal = parsed.TotalHolds, HoldsEmpty = parsed.HoldsEmpty,
                FuelOre = parsed.FuelOre, Organics = parsed.Organics, Equipment = parsed.Equipment,
                Colonists = parsed.Colonists };
            using var observer = new GameAgentRuntime();
            GameAgentContextSnapshot snapshot = observer.BuildContextSnapshot(state, null);
            var actual = new { currentSector = snapshot.CurrentSector, credits = snapshot.Credits,
                turns = snapshot.Turns, holdsTotal = snapshot.HoldsTotal, holdsEmpty = snapshot.HoldsEmpty,
                fuelOre = snapshot.FuelOre, organics = snapshot.Organics, equipment = snapshot.Equipment };
            JsonElement fields = JsonSerializer.SerializeToElement(actual);
            foreach (JsonProperty field in fields.EnumerateObject())
                if (field.Value.GetInt64() != expected.GetProperty(field.Name).GetInt64())
                    throw new Exception("Parsed MTC context differs from engine for " + field.Name);
            File.WriteAllText(Path.Combine(player, "outputs/mtc-ship-transport.json"), JsonSerializer.Serialize(new
            {
                source = "Actual OpenTW quickstats after cargo purchase, encoded as CP437 through MTC TelnetClient and ShipInfoParser",
                fields = actual,
                limitation = "Context builder verified without MainWindow dispatch or live game connection",
            }, new JsonSerializerOptions { WriteIndented = true }));
            Console.WriteLine("PASS: actual engine quickstats survive CP437 Telnet and populate MTC cargo/turn context exactly");
        }
        finally
        {
            engine.StandardInput.Close();
            try { await engine.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5)); }
            catch (TimeoutException) { engine.Kill(); await engine.WaitForExitAsync(); }
        }
    }
}
