/*
Copyright (C) 2005  Remco Mulder, 2026 Matt Mosley

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/

using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TWXProxy.Core
{
    public partial class ScriptRef
    {
        private static GameInstance? ActiveGameInstance
        {
            get => GlobalModules.CurrentContext.ActiveGameInstance;
            set => GlobalModules.CurrentContext.ActiveGameInstance = value;
        }

        private static GameInstance? _activeGameInstance
        {
            get => ActiveGameInstance;
            set => ActiveGameInstance = value;
        }

        #region Network Command Implementation

        private static CmdAction CmdConnect_Impl(object script, CmdParam[] parameters)
        {
            // CMD: connect
            // Initiate connection to the game server
            GameInstance? gameInstance = ActiveGameInstance;
            GlobalModules.DebugLog($"[CONNECT] called, gameInstance={((gameInstance == null) ? "NULL" : "set")}, isConnected={gameInstance?.IsConnected}\n");

            if (gameInstance == null)
            {
                GlobalModules.DebugLog($"[CONNECT] ERROR: No active game instance\n");
                Console.WriteLine("[Script] CONNECT: No active game instance");
                return CmdAction.None;
            }

            if (gameInstance.IsConnected)
            {
                GlobalModules.DebugLog($"[CONNECT] Already connected, skipping\n");
                Console.WriteLine($"[Script] CONNECT: Already connected to server");
                return CmdAction.None;
            }

            GlobalModules.DebugLog($"[CONNECT] Firing async ConnectToServerAsync\n");
            GlobalModules.FlushDebugLog();
            try
            {
                // Run connection asynchronously - scripts don't wait for completion
                TwxRuntimeContext context = GlobalModules.CurrentContext;
                Task.Run(async () =>
                {
                    try
                    {
                        using var _ = GlobalModules.UseRuntimeContext(context);
                        GlobalModules.DebugLog($"[CONNECT] ConnectToServerAsync starting\n");
                        await gameInstance.ConnectToServerAsync();
                        GlobalModules.DebugLog($"[CONNECT] ConnectToServerAsync completed successfully\n");
                        GlobalModules.FlushDebugLog();
                    }
                    catch (Exception ex)
                    {
                        GlobalModules.DebugLog($"[CONNECT] FAILED: {ex.Message}\n");
                        GlobalModules.FlushDebugLog();
                        try
                        {
                            await gameInstance.SendToLocalAsync(Encoding.ASCII.GetBytes($"\r\nConnection failed: {ex.Message}\r\n"), broadcastDeaf: true);
                        }
                        catch
                        {
                            Console.WriteLine($"[Script] CONNECT failed: {ex.Message}");
                        }

                        if (gameInstance.AutoReconnect)
                        {
                            gameInstance.StartReconnectIfNeeded();
                        }
                        else if (GetActiveInterpreter() is ModInterpreter interpreter)
                        {
                            interpreter.ProgramEvent("Failed to Connect.", string.Empty, false);
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[CONNECT] OUTER ERROR: {ex.Message}\n");
                Console.WriteLine($"[Script] CONNECT error: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdDisconnect_Impl(object script, CmdParam[] parameters)
        {
            // CMD: disconnect [disable]
            // Close connection to the game server
            // Optional parameter to disable auto-reconnect

            GameInstance? gameInstance = ActiveGameInstance;
            if (gameInstance == null)
            {
                Console.WriteLine("[Script] DISCONNECT: No active game instance");
                return CmdAction.None;
            }

            if (!gameInstance.IsConnected)
            {
                Console.WriteLine("[Script] DISCONNECT: Not connected to server");
                return CmdAction.None;
            }

            try
            {
                // The optional "disable" parameter disables auto-reconnect (TWX 2.x behavior)
                if (parameters.Length > 0 && parameters[0].Value.Equals("1", StringComparison.OrdinalIgnoreCase))
                    gameInstance.AutoReconnect = false;

                // Disconnect from server only — do NOT call StopAsync() which would
                // shut down the entire proxy (listener, all tasks, local connection).
                GlobalModules.DebugLog($"[Script.DISCONNECT] DISCONNECT command executed!\n{System.Environment.StackTrace}\n");
                GlobalModules.FlushDebugLog();
                TwxRuntimeContext context = GlobalModules.CurrentContext;
                Task.Run(async () =>
                {
                    try
                    {
                        using var _ = GlobalModules.UseRuntimeContext(context);
                        GlobalModules.DebugLog($"[Script.DISCONNECT] DisconnectFromServerAsync starting\n");
                        await gameInstance.DisconnectFromServerAsync();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Script] DISCONNECT failed: {ex.Message}");
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] DISCONNECT error: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdProcessIn_Impl(object script, CmdParam[] parameters)
        {
            // CMD: processin <processType> <text>
            // TWX27 semantics:
            //   processType=1 -> process globally for all scripts
            //   processType=0 -> process locally for the current script only
            // Older C# builds accidentally implemented the reversed shape
            // `processin <text> <force>`, so accept that form too for safety.
            string text;
            bool globalProcess;

            if (parameters.Length >= 2
                && TryConvertBoolean(parameters[0], out bool processType)
                && !TryConvertBoolean(parameters[1], out _))
            {
                globalProcess = processType;
                text = parameters[1].Value;
            }
            else
            {
                text = parameters[0].Value;
                globalProcess = parameters.Length > 1 && TryConvertBoolean(parameters[1], out bool legacyForce)
                    ? legacyForce
                    : false;
            }

            if (script is not Script currentScript)
            {
                Console.WriteLine("[Script] PROCESSIN: Script instance unavailable");
                return CmdAction.None;
            }

            try
            {
                if (globalProcess)
                {
                    currentScript.Controller.TextEvent(text, true);
                    currentScript.Controller.TextLineEvent(text, true);
                }
                else
                {
                    currentScript.SetCurrentTextContext(text, ScriptRef.GetCurrentAnsiLine());
                    currentScript.TextEvent(text, true);
                    currentScript.SetCurrentTextContext(text, ScriptRef.GetCurrentAnsiLine());
                    currentScript.TextLineEvent(text, true);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] PROCESSIN error: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static bool TryConvertBoolean(CmdParam parameter, out bool value)
        {
            try
            {
                ConvertToBoolean(parameter, out value);
                return true;
            }
            catch
            {
                value = false;
                return false;
            }
        }

        private static CmdAction CmdProcessOut_Impl(object script, CmdParam[] parameters)
        {
            // CMD: processout <text>
            // Inject data into the outgoing client data stream

            GameInstance? gameInstance = ActiveGameInstance;
            if (gameInstance == null)
            {
                Console.WriteLine("[Script] PROCESSOUT: No active game instance");
                return CmdAction.None;
            }

            if (!gameInstance.IsConnected)
            {
                Console.WriteLine("[Script] PROCESSOUT: Not connected to server");
                return CmdAction.None;
            }

            string text = parameters[0].Value;

            try
            {
                // Add CRLF if not present
                if (!text.EndsWith("\r\n") && !text.EndsWith("\n"))
                {
                    text += "\r\n";
                }

                // Send to server as if local client typed it
                var data = Encoding.ASCII.GetBytes(text);
                TwxRuntimeContext context = GlobalModules.CurrentContext;

                Task.Run(async () =>
                {
                    try
                    {
                        using var _ = GlobalModules.UseRuntimeContext(context);
                        await gameInstance.SendToServerAsync(data);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Script] PROCESSOUT failed: {ex.Message}");
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] PROCESSOUT error: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdAutoHaggle_Impl(object script, CmdParam[] parameters)
        {
            GameInstance? gameInstance = ActiveGameInstance;
            if (gameInstance == null)
            {
                Console.WriteLine("[Script] AUTOHAGGLE: No active game instance");
                return CmdAction.None;
            }

            string mode = parameters.Length > 0 ? parameters[0].Value.Trim() : string.Empty;
            if (string.IsNullOrWhiteSpace(mode))
            {
                Console.WriteLine("[Script] AUTOHAGGLE: Expected 'on' or 'off'");
                return CmdAction.None;
            }

            bool? enabled = mode.ToLowerInvariant() switch
            {
                "on" => true,
                "1" => true,
                "true" => true,
                "yes" => true,
                "off" => false,
                "0" => false,
                "false" => false,
                "no" => false,
                _ => null
            };

            if (enabled == null)
            {
                Console.WriteLine($"[Script] AUTOHAGGLE: Unknown mode '{mode}'");
                return CmdAction.None;
            }

            gameInstance.SetNativeHaggleEnabled(enabled.Value, NativeHaggleChangeSource.Script);
            GlobalModules.DebugLog($"[AUTOHAGGLE] Script set native haggle {(enabled.Value ? "ON" : "OFF")}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdQuikStats_Impl(object script, CmdParam[] parameters)
        {
            GameInstance? gameInstance = ActiveGameInstance;
            if (gameInstance == null)
            {
                Console.WriteLine("[Script] QUIKSTATS: No active game instance");
                return CmdAction.None;
            }

            if (!gameInstance.IsConnected)
            {
                Console.WriteLine("[Script] QUIKSTATS: Not connected to server");
                return CmdAction.None;
            }

            using var updateReceived = new ManualResetEventSlim(false);
            Action<ShipStatus>? statusHandler = null;
            statusHandler = _ =>
            {
                updateReceived.Set();
            };
            static bool IsSlashTerminalLine(string line)
            {
                if (string.IsNullOrEmpty(line) || !line.Contains('\u00B3'))
                    return false;

                return (line.Contains("Aln ", StringComparison.Ordinal) && line.Contains("Exp ", StringComparison.Ordinal)) ||
                       line.Contains("Ship ", StringComparison.Ordinal) ||
                       (line.Contains("Exp ", StringComparison.Ordinal) && line.Contains("Corp ", StringComparison.Ordinal));
            }
            EventHandler<DataReceivedEventArgs>? serverHandler = null;
            var serverLineBuf = new StringBuilder();
            var serverAnsiLineBuf = new StringBuilder();
            bool serverScriptInAnsi = false;

            serverHandler = (_, e) =>
            {
                if (ActiveGameInstance == null || updateReceived.IsSet)
                    return;

                string ansiChunk = AnsiCodes.PrepareScriptAnsiText(e.Text);
                string plainChunk = AnsiCodes.StripANSIStateful(ansiChunk, ref serverScriptInAnsi);

                if (ansiChunk.Length == 0 && plainChunk.Length == 0)
                    return;

                serverLineBuf.Append(plainChunk);
                serverAnsiLineBuf.Append(ansiChunk);

                string buffered = serverLineBuf.ToString();
                string bufferedAnsi = serverAnsiLineBuf.ToString();
                int searchPos = 0;
                int lastProcessedPos = 0;
                int ansiSearchPos = 0;
                int lastAnsiProcessedPos = 0;

                while (searchPos < buffered.Length)
                {
                    int crPos = buffered.IndexOf('\r', searchPos);
                    if (crPos == -1)
                    {
                        string remainder = buffered[lastProcessedPos..];
                        string remainderAnsi = bufferedAnsi[lastAnsiProcessedPos..];

                        serverLineBuf.Clear();
                        serverLineBuf.Append(remainder);
                        serverAnsiLineBuf.Clear();
                        serverAnsiLineBuf.Append(remainderAnsi);

                        if (!string.IsNullOrWhiteSpace(remainder))
                        {
                            string strippedRemainder = AnsiCodes.NormalizeTerminalText(remainder.TrimEnd('\r'));
                            if (!string.IsNullOrWhiteSpace(strippedRemainder))
                            {
                                gameInstance.FeedShipStatusLine(strippedRemainder);
                                if (IsSlashTerminalLine(strippedRemainder))
                                    updateReceived.Set();
                            }
                        }

                        return;
                    }

                    int ansiCrPos = bufferedAnsi.IndexOf('\r', ansiSearchPos);
                    if (ansiCrPos == -1)
                        break;

                    string lineForScript = buffered[lastProcessedPos..crPos];
                    string lineStripped = AnsiCodes.NormalizeTerminalText(lineForScript);
                    if (!string.IsNullOrWhiteSpace(lineStripped))
                    {
                        gameInstance.FeedShipStatusLine(lineStripped);
                        if (IsSlashTerminalLine(lineStripped))
                            updateReceived.Set();
                    }

                    searchPos = crPos + 1;
                    lastProcessedPos = searchPos;
                    ansiSearchPos = ansiCrPos + 1;
                    lastAnsiProcessedPos = ansiSearchPos;
                }

                if (lastProcessedPos >= buffered.Length)
                {
                    serverLineBuf.Clear();
                    string ansiRemainder = lastAnsiProcessedPos < bufferedAnsi.Length
                        ? bufferedAnsi[lastAnsiProcessedPos..]
                        : string.Empty;
                    serverAnsiLineBuf.Clear();
                    if (ansiRemainder.Length > 0)
                        serverAnsiLineBuf.Append(ansiRemainder);
                }
            };

            try
            {
                gameInstance.ShipStatusUpdated += statusHandler;
                gameInstance.ServerDataReceived += serverHandler;
                gameInstance.SendToServerAsync(Encoding.ASCII.GetBytes("/")).GetAwaiter().GetResult();

                if (!updateReceived.Wait(3000))
                    GlobalModules.DebugLog("[QUIKSTATS] Timed out waiting for ship status refresh after '/'\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Script] QUIKSTATS error: {ex.Message}");
            }
            finally
            {
                if (statusHandler != null)
                    gameInstance.ShipStatusUpdated -= statusHandler;
                if (serverHandler != null)
                    gameInstance.ServerDataReceived -= serverHandler;
            }

            return CmdAction.None;
        }

        #endregion

        #region Network Access Helper

        /// <summary>
        /// Set the active game instance for script commands
        /// This should be called when a game instance is started
        /// </summary>
        public static void SetActiveGameInstance(GameInstance? gameInstance)
        {
            ActiveGameInstance = gameInstance;
        }

        public static void SetActiveGameInstance(TwxRuntimeContext? context, GameInstance? gameInstance)
        {
            (context ?? GlobalModules.CurrentContext).ActiveGameInstance = gameInstance;
        }

        #endregion
    }
}
