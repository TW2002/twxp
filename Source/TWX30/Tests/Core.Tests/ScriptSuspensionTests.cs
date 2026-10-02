using TWXProxy.Core;

internal static class ScriptSuspensionTests
{
    public static void SerializesProgramEvents()
    {
        string directory = Path.Combine(Path.GetTempPath(), "twx-script-event-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        string marker = Path.Combine(directory, "event.txt");

        File.WriteAllText(Path.Combine(directory, "worker.ts"), $"""
seteventtrigger lost :lost "CONNECTION LOST"
pause
:lost
write "{marker}" "fired"
halt
""");

        var context = new TwxRuntimeContext("script-event-test");
        using var scope = GlobalModules.UseRuntimeContext(context);
        using var interpreter = new ModInterpreter
        {
            RuntimeContext = context,
            ProgramDir = directory,
            ScriptDirectory = directory,
        };

        try
        {
            interpreter.Load(Path.Combine(directory, "worker.ts"), silent: true);
            var eventLockField = typeof(ModInterpreter).GetField(
                "_scriptEventLock",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            object eventLock = eventLockField?.GetValue(interpreter)
                ?? throw new InvalidOperationException("Could not inspect the interpreter event gate.");

            Task dispatchTask;
            lock (eventLock)
            {
                dispatchTask = Task.Run(() =>
                    interpreter.DispatchProgramEvent("Connection Lost", string.Empty, exclusive: false));
                Thread.Sleep(50);
                Check(!File.Exists(marker), "Program event bypassed the active script event gate.");
            }
            dispatchTask.GetAwaiter().GetResult();

            Check(File.Exists(marker), "Queued program event did not run after the active callback completed.");
        }
        finally
        {
            interpreter.StopAll(true);
            Directory.Delete(directory, recursive: true);
        }
    }

    public static void GameInstanceDispatchesConnectionLost()
    {
        GameInstanceDispatchesConnectionLostAsync().GetAwaiter().GetResult();
    }

    private static async Task GameInstanceDispatchesConnectionLostAsync()
    {
        string directory = Path.Combine(Path.GetTempPath(), "twx-network-event-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        string marker = Path.Combine(directory, "event.txt");

        File.WriteAllText(Path.Combine(directory, "worker.ts"), $"""
seteventtrigger lost :lost "CONNECTION LOST"
pause
:lost
write "{marker}" "fired"
halt
""");

        using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();
        int port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;

        var context = new TwxRuntimeContext("network-event-test");
        using var scope = GlobalModules.UseRuntimeContext(context);
        using var interpreter = new ModInterpreter
        {
            RuntimeContext = context,
            ProgramDir = directory,
            ScriptDirectory = directory,
        };
        using var game = new GameInstance(
            "network-event-test",
            "127.0.0.1",
            port,
            0,
            interpreter: interpreter,
            runtimeContext: context);

        try
        {
            interpreter.Load(Path.Combine(directory, "worker.ts"), silent: true);
            await game.StartAsync();
            Task<System.Net.Sockets.TcpClient> acceptTask = listener.AcceptTcpClientAsync();
            await game.ConnectToServerAsync();
            using System.Net.Sockets.TcpClient serverClient = await acceptTask;

            await game.DisconnectFromServerAsync();

            Check(File.Exists(marker), "Core network disconnect did not dispatch Connection Lost to the script interpreter.");
        }
        finally
        {
            interpreter.StopAll(true);
            Directory.Delete(directory, recursive: true);
        }
    }

    private static void Check(bool condition, string message)
    {
        if (!condition)
            throw new InvalidOperationException(message);
    }
}
