using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using TWXProxy.Core;

internal static class ServerSendOrderingTests
{
    public static void Run(string path) => RunAsync(path).GetAwaiter().GetResult();

    private static async Task RunAsync(string path)
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        using var game = new GameInstance("send-order-" + path, "127.0.0.1",
            ((IPEndPoint)listener.LocalEndpoint).Port, 0);
        using var output = new MemoryStream();
        using var input = new BlockingReadStream();
        game.ConnectDirectClient(output, input);
        var accept = listener.AcceptTcpClientAsync();
        await game.ConnectToServerAsync();
        using var server = await accept;
        using var stream = server.GetStream();
        var sendLock = (SemaphoreSlim)typeof(GameInstance).GetField("_serverSendLock",
            BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(game)!;
        var observed = new List<string>();
        var completed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        bool callbackHeldSendLock = false;
        bool reentrantCallback = false;
        int callbackDepth = 0;
        game.ServerDataSent += (_, e) =>
        {
            if (++callbackDepth != 1) reentrantCallback = true;
            try
            {
                if (e.Text == "\r")
                {
                    // A bot command immediately requests quick stats; no send lock may be held here.
                    if (!sendLock.Wait(0)) callbackHeldSendLock = true;
                    else sendLock.Release();
                    game.SendToServerAsync(Encoding.Latin1.GetBytes("\u0091/")).GetAwaiter().GetResult();
                }
            }
            finally { callbackDepth--; }
        };
        game.ServerDataSent += (_, e) =>
        {
            observed.Add(e.Text);
            if (e.Text == "\u0091/") completed.TrySetResult();
        };

        await game.SendToServerAsync(Encoding.ASCII.GetBytes("'sb x 8"));
        if (path == "queued")
        {
            sendLock.Wait();
            bool notifiedBeforeWrite;
            try
            {
                await game.SendToServerAsync([13]);
                notifiedBeforeWrite = observed.Count != 1;
            }
            finally { sendLock.Release(); }
            if (notifiedBeforeWrite) throw new Exception("Queued Enter notified the bot before it was written");
        }
        else if (path == "fast")
        {
            game.TrySendToServerImmediate([13]);
        }
        else
        {
            await game.SendToServerAsync([13]);
        }

        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await completed.Task.WaitAsync(timeout.Token);
        if (callbackHeldSendLock) throw new Exception("Bot callback ran under the socket send lock");
        if (reentrantCallback) throw new Exception("Nested sends recursively dispatched observers");
        if (!observed.SequenceEqual(new[] { "'sb x 8", "\r", "\u0091/" }))
            throw new Exception("Send observers saw the command and response out of order");

        byte[] expected = Encoding.Latin1.GetBytes("'sb x 8\r\u0091/");
        byte[] received = new byte[4096];
        int length = 0;
        while (received.AsSpan(0, length).IndexOf(expected) < 0)
        {
            int count = await stream.ReadAsync(received.AsMemory(length), timeout.Token);
            if (count == 0) throw new Exception("Connection ended before ordered command arrived");
            length += count;
        }
    }
}
