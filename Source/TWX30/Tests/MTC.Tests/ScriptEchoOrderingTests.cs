using System.Net;
using System.Net.Sockets;
using System.Text;
using MTC;
using TWXProxy.Core;

internal static class ScriptEchoOrderingTests
{
    public static void Run(string mode) => RunAsync(mode).GetAwaiter().GetResult();

    private static async Task RunAsync(string mode)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        using var output = new CaptureStream();
        using var input = new IdleInputStream();
        using var game = new GameInstance("echo-order-test", "127.0.0.1",
            ((IPEndPoint)listener.LocalEndpoint).Port, 0);
        game.ConnectDirectClient(output, input);
        bool deaf = mode == "deaf";
        if (deaf) game.SetClientType(0, ClientType.Deaf);
        var accept = listener.AcceptTcpClientAsync(timeout.Token);
        await game.ConnectToServerAsync();
        using var server = await accept;
        using var stream = server.GetStream();
        const string echo = "figtype = Offensive\r\n";
        const string prefix = "Command [TL\x1b[";
        string suffix = "33m=00:00:00]:[10311] (?=Help)? : " + (mode == "quiet" ? "" : "\r\n");
        var prefixProcessed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var inbound = new StringBuilder();
        string InboundText() { lock (inbound) return inbound.ToString(); }
        game.ServerDataReceived += (_, e) =>
        {
            lock (inbound) inbound.Append(e.Text);
            if (!InboundText().EndsWith(prefix, StringComparison.Ordinal)) return;
            if (mode == "callback") game.Broadcast(echo, broadcastDeaf: true);
            prefixProcessed.TrySetResult();
        };

        await stream.WriteAsync(Encoding.Latin1.GetBytes(prefix), timeout.Token);
        await prefixProcessed.Task.WaitAsync(timeout.Token);
        if (mode == "literal") game.BroadcastLiteral(echo, broadcastDeaf: true);
        else if (mode == "ordinary") game.Broadcast(echo);
        else if (mode != "callback") game.Broadcast(echo, broadcastDeaf: true);
        await Task.Delay(250, timeout.Token); // The quiet-period fallback must not break ANSI either.
        if (output.Text != (deaf ? "" : prefix))
            throw new Exception("Local echo interrupted unfinished server ANSI: " + output.Text.Replace("\x1b", "<ESC>"));

        await stream.WriteAsync(Encoding.Latin1.GetBytes(suffix), timeout.Token);
        await WaitUntil(() => output.Text.Contains(echo, StringComparison.Ordinal), timeout.Token);
        if (output.Text != (deaf ? "" : prefix + suffix) + echo)
            throw new Exception("Server and script output were reordered or modified");
        await WaitUntil(() => InboundText() == prefix + suffix, timeout.Token);

        var buffer = new TerminalBuffer(100, 24);
        buffer.SetCursor(20, 0);
        var parser = new AnsiParser(buffer);
        byte[] bytes = Encoding.Latin1.GetBytes(output.Text);
        parser.Feed(bytes, bytes.Length);
        int echoRow = mode == "quiet" || deaf ? 20 : 21;
        if (buffer.CursorRow != echoRow + 1 || !buffer.GetLineText(echoRow).Contains("figtype = Offensive") ||
            !string.IsNullOrWhiteSpace(buffer.GetLineText(0)))
            throw new Exception("Echo moved the terminal cursor to the top of the screen");

        // Ordinary prompts must still be immediate, including for muted clients.
        game.SetClientType(0, ClientType.Deaf);
        game.Broadcast("menu prompt", broadcastDeaf: true);
        if (!output.Text.EndsWith("menu prompt", StringComparison.Ordinal))
            throw new Exception("Echo to a deaf client was hidden or delayed at a safe boundary");
    }

    private static async Task WaitUntil(Func<bool> ready, CancellationToken token)
    {
        while (!ready()) await Task.Delay(10, token);
    }

    private sealed class CaptureStream : MemoryStream
    {
        public string Text { get { lock (this) return Encoding.Latin1.GetString(ToArray()); } }
        public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken token)
        {
            lock (this) base.Write(buffer, offset, count);
            return Task.CompletedTask;
        }
    }

    private sealed class IdleInputStream : MemoryStream
    {
        public override async Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken token)
        {
            await Task.Delay(Timeout.Infinite, token);
            return 0;
        }
    }
}
