using System.Net;
using System.Net.Sockets;
using System.Text;
using MTC;

internal static class PromptTransportTests
{
    internal static async Task Run()
    {
        string[] prompts =
        [
            "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D]",
            "Enter your choice [T] ?",
            "How many holds of Fuel Ore do you want to buy [20]?",
            "How many holds of Equipment do you want to sell [1,200]?",
            "Your offer [1,230] ?",
            "Do you want to make this jump blind?",
        ];
        foreach (string prompt in prompts)
        {
            if (!GameAgentPromptClassifier.IsEconomicPrompt(prompt))
                throw new Exception("Economic prompt not observed: " + prompt);
            if (GameAgentPromptClassifier.IsEconomicPrompt(prompt + " x"))
                throw new Exception("Echoed economic response classified as a fresh prompt");
        }

        string[] missionPrompts = [
            "Attack Zar Nox's Scout (123-40) (Y/N) [N]?",
            "How many fighters do you wish to use (0 to 250) [0]?",
            "<Shipyards> Your option (?) ?", "What do you want to name this ship? (30 chars)",
            "[---------------------------------------]", "Choose which ship to beam to (Q=Quit)",
            "Choose which ship to sell (Q=Quit)", "Still interested ?",
            "Which planet type are you interested in (?=List) ?",
            "How many Genesis Torpedoes do you want (Max 15) [0] ?",
            "How many Atomic Detonators do you want (Max 5) [0] ?",
            "Planetary Attack Command [Q]",
            "<DANGER> Are you sure you want to do this?",
            "(1)Ore, (2)Org or (3)Equipment Production?",
            "How many groups of Colonists do you want to leave ([30] on board) ?",
        ];
        foreach (string prompt in missionPrompts)
        {
            if (!GameAgentPromptClassifier.IsMissionPrompt(prompt) || GameAgentPromptClassifier.IsMissionPrompt(prompt + " x"))
                throw new Exception("Mission prompt or echo misclassified: " + prompt);
        }

        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        int port = ((IPEndPoint)listener.LocalEndpoint).Port;
        var buffer = new TerminalBuffer();
        using var client = new TelnetClient(buffer, new AnsiParser(buffer));
        var partialSeen = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var completeSeen = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        int classified = 0;
        client.TextLineAnsiReceived += (_, text) =>
        {
            if (text == "Select (H)olo Scan") partialSeen.TrySetResult();
            if (GameAgentPromptClassifier.IsEconomicPrompt(text))
            {
                Interlocked.Increment(ref classified);
                completeSeen.TrySetResult();
            }
        };
        Task connect = client.ConnectAsync("127.0.0.1", port);
        using TcpClient peer = await listener.AcceptTcpClientAsync();
        await connect;
        NetworkStream stream = peer.GetStream();
        await stream.WriteAsync(Encoding.ASCII.GetBytes("Select (H)olo Scan"));
        await partialSeen.Task.WaitAsync(TimeSpan.FromSeconds(3));
        if (classified != 0) throw new Exception("Partial scan prompt classified as complete");
        await stream.WriteAsync(Encoding.ASCII.GetBytes(" or (D)ensity Scan or (Q)uit? [D]"));
        await completeSeen.Task.WaitAsync(TimeSpan.FromSeconds(3));
        if (classified != 1) throw new Exception("Fragmented prompt did not produce one complete observation");
        client.SendRaw([(byte)'h']);
        byte[] received = new byte[64];
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        int count = await stream.ReadAsync(received, timeout.Token);
        if (count != 1 || received[0] != 'h') throw new Exception("Telnet changed atomic model input");
        Console.WriteLine("PASS: MTC Telnet preserves fragmented economic prompt and exact response bytes");
    }
}
