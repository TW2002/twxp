using System;
using System.Net.Sockets;
using System.Collections.Generic;
using System.Windows.Forms;
using Core;
using Global;
using Ansi;
using Utility;
 // 
 // Copyright (C) 2005  Remco Mulder
 // 
 // This program is free software; you can redistribute it and/or modify
 // it under the terms of the GNU General Public License as published by
 // the Free Software Foundation; either version 2 of the License, or
 // (at your option) any later version.
 // 
 // This program is distributed in the hope that it will be useful,
 // but WITHOUT ANY WARRANTY; without even the implied warranty of
 // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 // GNU General Public License for more details.
 // 
 // You should have received a copy of the GNU General Public License
 // along with this program; if not, write to the Free Software
 // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 // 
 // For source notes please refer to Notes.txt
 // For license terms please refer to GPL.txt.
 // 
 // These files should be stored in the root of the compression you
 // received this source in.
namespace TCP
{
    public class TTelnetSocket: TTWXModule
    {
        private bool[] FOptionSent;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        public void ProcessTelnet_TransmitOp(char Func, byte OpCode)
        {
            if (!FOptionSent[OpCode])
            {
                FOptionSent[OpCode] = true;
                Socket.Send('ÿ' + (char)Func + (char)OpCode);
                if ((OpCode == ((byte)S[I])))
                {
                    SentThisOp = true;
                }
            }
        }

        // TTelnetSocket
        private string ProcessTelnet(string S, Socket Socket)
        {
            string result;
            // SktIndex,
            int I;
            string Retn;
            char TNOp;
            TFunc Func;
            bool SentThisOp;
            // process and remove telnet commands
            Retn = "";
            Func = TFunc.None;
            TNOp = '\0';
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] == 'ÿ'))
                {
                    if ((Func == TFunc.None))
                    {
                        Func = TFunc.IAC;
                    }
                    else if ((Func == TFunc.IAC))
                    {
                        // two datamarks = #255 sent to server
                        Func = TFunc.None;
                    }
                    else if ((Func == TFunc.Op) || (Func == TFunc.Command))
                    {
                        Func = TFunc.Done;
                    }
                }
                else
                {
                    if ((Func == TFunc.IAC))
                    {
                        if ((S[I] == Units.TCP.OP_SB))
                        {
                            Func = TFunc.Sub;
                        }
                        else if ((S[I] == Units.TCP.OP_DO) || (S[I] == Units.TCP.OP_DONT) || (S[I] == Units.TCP.OP_WILL) || (S[I] == Units.TCP.OP_WONT))
                        {
                            Func = TFunc.Op;
                            TNOp = S[I];
                        }
                        else
                        {
                            Func = TFunc.Done;
                        }
                    }
                    else if ((Func == TFunc.Op))
                    {
                        Func = TFunc.Command;
                        SentThisOp = false;
                        // negotiate operations
                        if ((S[I] == 'ö'))
                        {
                            // send telnet stuff - Suppress GA, Transmit Binary, Echo
                            ProcessTelnet_TransmitOp(Units.TCP.OP_WILL, 3);
                            ProcessTelnet_TransmitOp(Units.TCP.OP_WILL, 0);
                            ProcessTelnet_TransmitOp(Units.TCP.OP_WILL, 1);
                            Func = TFunc.Done;
                        // EP
                        }
                        else if ((TNOp == Units.TCP.OP_DO))
                        {
                            if ((S[I] == '') || (S[I] == "\01") || (S[I] == "\03") || (S[I] == '\0') || (S[I] == 'È'))
                            {
                                ProcessTelnet_TransmitOp(Units.TCP.OP_WILL, ((byte)S[I]));
                            // if (S[I] = #200) then
                            // FClientEchoMarks[SktIndex] := TRUE;
                            }
                            else
                            {
                                ProcessTelnet_TransmitOp(Units.TCP.OP_WONT, ((byte)S[I]));
                            }
                            Func = TFunc.Done;
                        // EP
                        }
                        else if ((TNOp == Units.TCP.OP_WILL))
                        {
                            // suppress goahead
                            // transmit binary
                            // local echo
                            if ((S[I] == "\03") || (S[I] == '\0') || (S[I] == "\01"))
                            {
                                ProcessTelnet_TransmitOp(Units.TCP.OP_DO, ((byte)S[I]));
                            }
                            else
                            {
                                ProcessTelnet_TransmitOp(Units.TCP.OP_DONT, ((byte)S[I]));
                            }
                            Func = TFunc.Done;
                        // EP
                        }
                        else if ((TNOp == Units.TCP.OP_DONT))
                        {
                            if ((S[I] == 'È'))
                            {
                                // don't TWX Echo Mark
                                // FClientEchoMarks[SktIndex] := FALSE;
                                ProcessTelnet_TransmitOp(Units.TCP.OP_WONT, 200);
                            }
                            else
                            {
                                ProcessTelnet_TransmitOp(Units.TCP.OP_WONT, ((byte)S[I]));
                            }
                            // EP
                            Func = TFunc.Done;
                        // EP
                        }
                        else if ((TNOp == Units.TCP.OP_WONT))
                        {
                            // EP - This was missing from the server function
                            // Just ignore it - EP
                            Func = TFunc.Done;
                        // EP
                        }
                        if ((FOptionSent[((byte)S[I])]) && !SentThisOp)
                        {
                            FOptionSent[((byte)S[I])] = false;
                        }
                    // end (Function = Op)
                    }
                    else if ((Func == TFunc.Sub))
                    {
                        if ((S[I] == 'ð'))
                        {
                            Func = TFunc.Done;
                        }
                    // EP
                    }
                    else if ((Func == TFunc.Command))
                    {
                        Func = TFunc.Done;
                    }
                // EP - Some unknown command?
                }
                if ((Func == TFunc.Done))
                {
                    Func = TFunc.None;
                }
                else if ((Func == TFunc.None))
                {
                    Retn = Retn + S[I];
                }
            }
            result = Retn;
            return result;
        }

        public enum TFunc
        {
            None,
            IAC,
            Op,
            Sub,
            Command,
            Done
        } // end TFunc

    } // end TTelnetSocket

    public class TTelnetServerSocket: TTelnetSocket
    {
        private Socket tcpServer = null;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
    } // end TTelnetServerSocket

    public class TTelnetClientSocket: TTelnetSocket
    {
        private Socket tcpClient = null;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
    } // end TTelnetClientSocket

    public class TModServer: TTelnetServerSocket, IModServer
    {
        public TClientType ClientTypes[int Index]
        {
          get {
            return GetClientType(Index);
          }
          set {
            SetClientType(Index, value);
          }
        }
        public int ClientCount
        {
          get {
            return GetClientCount();
          }
        }
        public string ClientAddresses[int Index]
        {
          get {
            return GetClientAddress(Index);
          }
        }
        public ushort ListenPort
        {
          get {
            return GetListenPort();
          }
          set {
            SetListenPort(value);
          }
        }
        public bool AcceptExternal
        {
          get {
            return GetAcceptExternal();
          }
          set {
            SetAcceptExternal(value);
          }
        }
        public bool BroadCastMsgs
        {
          get {
            return GetBroadCastMsgs();
          }
          set {
            SetBroadCastMsgs(value);
          }
        }
        public bool LocalEcho
        {
          get {
            return GetLocalEcho();
          }
          set {
            SetLocalEcho(value);
          }
        }
        private TClientType[] FClientTypes;
        private bool[] FClientEchoMarks;
        private int FCurrentClient = 0;
        private List<string> FBufferOut = null;
        private Timer FBufTimer = null;
        private bool FAcceptExternal = false;
        private bool FBroadCastMsgs = false;
        private bool FLocalEcho = false;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        // ***************** TModServer Implementation *********************
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            this.tcpServer = new Socket(this);
            Socket _wvar1 = (this.tcpServer);
            //@ Unsupported property or method(C): 'OnClientConnect'
            _wvar1.OnClientConnect = tcpServerClientConnect;
            //@ Unsupported property or method(C): 'OnClientDisconnect'
            _wvar1.OnClientDisconnect = tcpServerClientDisconnect;
            //@ Unsupported property or method(C): 'OnClientRead'
            _wvar1.OnClientRead = tcpServerClientRead;
            //@ Unsupported property or method(C): 'OnClientError'
            _wvar1.OnClientError = tcpServerClientError;
            FBufferOut = new List<string>();
            FBufTimer = new Timer(this);
            FBufTimer.Tick = OnBufTimer;
            FBufTimer.Interval = 1;
            FBufTimer.Enabled = false;
            // set defaults
            // tcpServer.Port := 23;
            BroadCastMsgs = true;
        }

        public override void BeforeDestruction()
        {
            //@ Unsupported property or method(C): 'Free'
            this.tcpServer.Free;
            //@ Unsupported property or method(C): 'Free'
            FBufferOut.Free;
            //@ Unsupported property or method(C): 'Free'
            FBufTimer.Free;
            base.BeforeDestruction();
        }

        public void Broadcast(string Text, bool AMarkEcho, bool BroadcastDeaf, bool Buffered)
        {
            int I;
            if ((Text.Length == 0))
            {
                return;
            }
            if (!Buffered && (FBufferOut.Count > 0))
            {
                // we still have data going out of the buffer, add to it for a later broadcast
                FBufferOut.Add(Text);
                return;
            }
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(D): 'ActiveConnections'
            for (I = 0; I < this.tcpServer.Socket.ActiveConnections; I ++ )
            {
                if (BroadcastDeaf || (ClientTypes[I] != TClientType.ctDeaf))
                {
                    if (AMarkEcho && FClientEchoMarks[I])
                    {
                        //@ Unsupported property or method(C): 'Socket'
                        //@ Unsupported property or method(B): 'Connections'
                        //@ Unsupported property or method(B): 'SendText'
                        this.tcpServer.Socket.Connections[I].SendText('ÿ' + '\0' + Text + 'ÿ' + "\01");
                    }
                    else
                    {
                        //@ Unsupported property or method(C): 'Socket'
                        //@ Unsupported property or method(B): 'Connections'
                        //@ Unsupported property or method(B): 'SendText'
                        this.tcpServer.Socket.Connections[I].SendText(Text);
                    }
                }
            }
        }

        public void Broadcast(string Text)
        {
            Broadcast(Text, true);
        }

        public void Broadcast(string Text, bool AMarkEcho)
        {
            Broadcast(Text, AMarkEcho, true);
        }

        public void Broadcast(string Text, bool AMarkEcho, bool BroadcastDeaf)
        {
            Broadcast(Text, AMarkEcho, BroadcastDeaf, false);
        }

        public void ClientMessage(string MessageText)
        {
            if ((Global.Units.Global.TWXMenu.CurrentMenu != null))
            {
                Broadcast('\r' + Ansi.Units.Ansi.ANSI_CLEARLINE + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + MessageText + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl + Global.Units.Global.TWXMenu.GetPrompt());
            }
            else if ((Global.Units.Global.TWXClient.Connected) && (Global.Units.Global.TWXExtractor.CurrentLine.Length > 0))
            {
                Broadcast('\r' + Ansi.Units.Ansi.ANSI_CLEARLINE + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + MessageText + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl + Core.Units.Core.endl + Global.Units.Global.TWXExtractor.CurrentANSILine);
            }
            else
            {
                Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + MessageText + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
            }
        }

        public void AddBuffer(string Text)
        {
            // add text to outgoing buffer
            //@ Unsupported property or method(A): 'Append'
            FBufferOut.Append(Text);
            FBufTimer.Enabled = true;
        }

        public void StopVarDump()
        {
            int I;
            bool Found;
            // Find the index of 'Variable Dump Complete.'
            FBufTimer.Enabled = false;
            Found = false;
            for (I = FBufferOut.Count - 1; I >= 0; I-- )
            {
                if (Found == true)
                {
                    FBufferOut.Remove(I);
                }
                else if ((FBufferOut[I].IndexOf("Variable Dump Complete.") > 0))
                {
                    Found = true;
                    FBufferOut.Remove(I);
                }
            }
            FBufTimer.Enabled = true;
        }

        public void NotifyScriptLoad()
        {
            int I;
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(D): 'ActiveConnections'
            if ((this.tcpServer.Socket.ActiveConnections > 0))
            {
                //@ Unsupported property or method(C): 'Socket'
                //@ Unsupported property or method(D): 'ActiveConnections'
                for (I = 0; I < this.tcpServer.Socket.ActiveConnections; I ++ )
                {
                    if (FClientEchoMarks[I])
                    {
                        //@ Unsupported property or method(C): 'Socket'
                        //@ Unsupported property or method(B): 'Connections'
                        //@ Unsupported property or method(B): 'SendText'
                        this.tcpServer.Socket.Connections[I].SendText('ÿ' + "\02");
                    }
                }
            }
        }

        public void NotifyScriptStop()
        {
            int I;
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(D): 'ActiveConnections'
            if ((this.tcpServer.Socket.ActiveConnections > 0))
            {
                //@ Unsupported property or method(C): 'Socket'
                //@ Unsupported property or method(D): 'ActiveConnections'
                for (I = 0; I < this.tcpServer.Socket.ActiveConnections; I ++ )
                {
                    if (FClientEchoMarks[I])
                    {
                        //@ Unsupported property or method(C): 'Socket'
                        //@ Unsupported property or method(B): 'Connections'
                        //@ Unsupported property or method(B): 'SendText'
                        this.tcpServer.Socket.Connections[I].SendText('ÿ' + "\03");
                    }
                }
            }
        }

        protected void tcpServerClientConnect(Object Sender, Socket Socket)
        {
            const char T_WILL = 'ÿ' + 'û';
            const char T_WONT = 'ÿ' + 'ü';
            const char T_DO = 'ÿ' + 'ý';
            const char T_DONT = 'ÿ' + 'þ';
            bool LocalClient;
            int SktIndex;
            //@ Unsupported property or method(C): 'RemoteAddress'
            //@ Unsupported property or method(C): 'RemoteAddress'
            //@ Unsupported function or procedure: 'Copy'
            //@ Unsupported property or method(C): 'RemoteAddress'
            //@ Unsupported function or procedure: 'Copy'
            if ((Socket.RemoteAddress == "127.0.0.1") || (Copy(Socket.RemoteAddress, 1, 8) == "192.168.") || (Copy(Socket.RemoteAddress, 1, 3) == "10."))
            {
                LocalClient = true;
            }
            else
            {
                LocalClient = false;
            }
            //@ Unsupported property or method(C): 'RemoteAddress'
            if (!AcceptExternal && (Socket.RemoteAddress != "127.0.0.1"))
            {
                // User not allowed
                Socket.Close();
            }
            else
            {
                // send telnet stuff - AYT
                Socket.Send('ÿ' + Units.TCP.OP_DO + 'ö');
                if (BroadCastMsgs)
                {
                    //@ Unsupported property or method(C): 'RemoteAddress'
                    ClientMessage(Ansi.Units.Ansi.ANSI_7 + "Active connection detected from: " + Ansi.Units.Ansi.ANSI_15 + Socket.RemoteAddress);
                }
                SktIndex = GetSocketIndex(Socket);
                if (LocalClient)
                {
                    FClientTypes[SktIndex] = TClientType.ctStandard;
                }
                else
                {
                    FClientTypes[SktIndex] = TClientType.ctMute;
                }
                FClientEchoMarks[SktIndex] = false;
                // Broadcast confirmation to client
                //@ Unsupported property or method(C): 'Socket'
                //@ Unsupported property or method(D): 'ActiveConnections'
                Socket.Send(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_7 + "TWX Proxy Server " + Ansi.Units.Ansi.ANSI_15 + 'v' + Core.Units.Core.ProgramVersion + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl + '(' + Core.Units.Core.ReleaseVersion + ')' + Core.Units.Core.endl + Core.Units.Core.endl + "There are currently " + Ansi.Units.Ansi.ANSI_15 + (this.tcpServer.Socket.ActiveConnections).ToString() + Ansi.Units.Ansi.ANSI_7 + " active telnet connections" + Core.Units.Core.endl);
                if ((Global.Units.Global.TWXClient.Connected))
                {
                    Socket.Send("You are connected to server: " + Ansi.Units.Ansi.ANSI_15 + Global.Units.Global.TWXDatabase.DBHeader.Address + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_7);
                }
                else
                {
                    Socket.Send("No server connections detected" + Core.Units.Core.endl);
                }
                if ((Global.Units.Global.TWXLog.LogFileOpen))
                {
                    Socket.Send(Core.Units.Core.endl + "You are logging to file: " + Ansi.Units.Ansi.ANSI_15 + Global.Units.Global.TWXLog.LogFilename + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl + Core.Units.Core.endl);
                }
                if (LocalClient)
                {
                    Socket.Send("Press " + Ansi.Units.Ansi.ANSI_15 + Global.Units.Global.TWXExtractor.MenuKey + Ansi.Units.Ansi.ANSI_7 + " to activate terminal menu" + Core.Units.Core.endl + Core.Units.Core.endl);
                    if (AcceptExternal)
                    {
                        Socket.Send(Ansi.Units.Ansi.ANSI_12 + "WARNING: " + Ansi.Units.Ansi.ANSI_15 + "With external connections enabled," + Core.Units.Core.endl + "you are open to foreign users connecting" + Core.Units.Core.endl + "to your machine and monitoring data." + Core.Units.Core.endl + Core.Units.Core.endl);
                    }
                }
                else
                {
                    Socket.Send(Ansi.Units.Ansi.ANSI_15 + "You are locked in view only mode" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl + Core.Units.Core.endl);
                }
                Global.Units.Global.TWXInterpreter.ProgramEvent("Client connected", "", false);
            }
        }

        protected void tcpServerClientDisconnect(Object Sender, Socket Socket)
        {
            int I;
            int Index;
            Index = GetSocketIndex(Socket);
            // remove client from list
            for (I = Index; I <= 254; I ++ )
            {
                FClientTypes[I] = FClientTypes[I + 1];
                FClientEchoMarks[I] = FClientEchoMarks[I + 1];
            }
            Global.Units.Global.TWXInterpreter.ProgramEvent("Client disconnected", "", false);
            // manual client message to all sockets except the one disconnecting
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(D): 'ActiveConnections'
            for (I = 0; I < this.tcpServer.Socket.ActiveConnections; I ++ )
            {
                //@ Unsupported property or method(C): 'Socket'
                //@ Unsupported property or method(B): 'Connections'
                if ((this.tcpServer.Socket.Connections[I] != Socket))
                {
                    //@ Unsupported property or method(C): 'Socket'
                    //@ Unsupported property or method(B): 'Connections'
                    //@ Unsupported property or method(C): 'RemoteAddress'
                    //@ Unsupported property or method(B): 'SendText'
                    this.tcpServer.Socket.Connections[I].SendText(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_7 + "Connection lost from: " + Ansi.Units.Ansi.ANSI_15 + Socket.RemoteAddress + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                }
            }
        }

        protected void tcpServerClientError(Object Sender, Socket Socket, TErrorEvent ErrorEvent, ref int ErrorCode)
        {
            // Disable error message
            ErrorCode = 0;
        }

        protected void tcpServerClientRead(Object Sender, Socket Socket)
        {
            string InStr;
            string InString;
            int I;
            char Last;
            // terminate any logs that are playing
            Global.Units.Global.TWXLog.EndPlayLog();
            // Read data from server socket
            InStr = Socket.Receive();
            // remove any null characters after #13
            InString = "";
            Last = '\0';
            if ((InStr.Length > 0))
            {
                for (I = 1; I <= InStr.Length; I ++ )
                {
                    if (!((Last == '\r') && ((InStr[I] == '\0') || (InStr[I] == '\n'))))
                    {
                        InString = InString + InStr[I];
                    }
                    Last = InStr[I];
                }
            }
            // process telnet commands
            InString = this.ProcessTelnet(InString, Socket);
            if ((InString == ""))
            {
                return;
            }
            FCurrentClient = GetSocketIndex(Socket);
            if ((ClientTypes[FCurrentClient] == TClientType.ctMute))
            {
                return;
            }
            // mute clients can't talk
            // Process data for telnet commands
            if ((Global.Units.Global.TWXExtractor.ProcessOutBound(InString, FCurrentClient)) && (Global.Units.Global.TWXClient.Connected))
            {
                Global.Units.Global.TWXClient.Send(InString);
                if (LocalEcho)
                {
                    Socket.Send(InString);
                }
            }
        }

        protected void OnBufTimer(Object Sender)
        {
            if ((FBufferOut.Count > 0))
            {
                Broadcast(FBufferOut[0], true, true, true);
                FBufferOut.Remove(0);
            }
            else
            {
                FBufTimer.Enabled = false;
            }
        }

        private TClientType GetClientType(int Index)
        {
            TClientType result;
            result = FClientTypes[Index];
            return result;
        }

        private int GetClientCount()
        {
            int result;
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(D): 'ActiveConnections'
            result = this.tcpServer.Socket.ActiveConnections;
            return result;
        }

        private string GetClientAddress(int Index)
        {
            string result;
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(B): 'Connections'
            //@ Unsupported property or method(D): 'RemoteAddress'
            result = this.tcpServer.Socket.Connections[Index].RemoteAddress;
            return result;
        }

        private void SetClientType(int Index, TClientType Value)
        {
            FClientTypes[Index] = Value;
        }

        private int GetSocketIndex(Socket S)
        {
            int result;
            int I;
            bool Found;
            Found = false;
            //@ Unsupported property or method(C): 'Socket'
            //@ Unsupported property or method(D): 'ActiveConnections'
            for (I = 0; I < this.tcpServer.Socket.ActiveConnections; I ++ )
            {
                //@ Unsupported property or method(C): 'Socket'
                //@ Unsupported property or method(B): 'Connections'
                if ((this.tcpServer.Socket.Connections[I] == S))
                {
                    Found = true;
                    break;
                }
            }
            if (Found)
            {
                result = I;
            }
            else
            {
                result =  -1;
            }
            return result;
        }

        private void SetListenPort(ushort Value)
        {
            // TWXDatabase.DBHeader.ServerPort := Value;
            Global.Units.Global.TWXDatabase.ServerPort = Value;
            //@ Unsupported property or method(C): 'Port'
            if ((this.tcpServer.Port != Value))
            {
                this.tcpServer.Close();
                //@ Unsupported property or method(C): 'Port'
                this.tcpServer.Port = Value;
            }
            // The server is no longer set active here, but requires a call to Activate
            // try
            // tcpServer.Active := TRUE;
            // except
            // MessageDlg('Unable to bind a listening socket on port ' + IntToStr(Value) + endl + 'You will need to change it before you can connect to TWX Proxy.', mtWarning, [mbOk], 0);
            // tcpServer.Active := FALSE;
            // end;

        }

        private ushort GetListenPort()
        {
            ushort result;
            //@ Unsupported property or method(C): 'Port'
            result = this.tcpServer.Port;
            return result;
        }

        public void Activate()
        {
            //@ Unsupported property or method(C): 'Active'
            if (!this.tcpServer.Active)
            {
                try {
                    //@ Unsupported property or method(C): 'Active'
                    this.tcpServer.Active = true;
                }
                catch {
                    //@ Unsupported property or method(C): 'Port'
                    MessageBox.Show("Unable to bind a listening socket on port " + (this.tcpServer.Port).ToString() + '.' + Core.Units.Core.endl + "You will need to change it before you can connect to TWX Proxy.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Warning);
                    //@ Unsupported property or method(C): 'Active'
                    this.tcpServer.Active = false;
                }
            }
        }

        public void Deactivate()
        {
            //@ Unsupported property or method(C): 'Active'
            this.tcpServer.Active = false;
        }

        // IModServer
        private bool GetAcceptExternal()
        {
            bool result;
            result = FAcceptExternal;
            return result;
        }

        private void SetAcceptExternal(bool Value)
        {
            FAcceptExternal = Value;
        }

        private bool GetBroadCastMsgs()
        {
            bool result;
            result = FBroadCastMsgs;
            return result;
        }

        private void SetBroadCastMsgs(bool Value)
        {
            FBroadCastMsgs = Value;
        }

        private bool GetLocalEcho()
        {
            bool result;
            result = FLocalEcho;
            return result;
        }

        private void SetLocalEcho(bool Value)
        {
            FLocalEcho = Value;
        }

    } // end TModServer

    public class TModClient: TTelnetClientSocket, IModClient
    {
        public bool Connected
        {
          get {
            return GetConnected();
          }
        }
        public bool Reconnect
        {
          get {
            return GetReconnect();
          }
          set {
            SetReconnect(value);
          }
        }
        private Timer tmrReconnect = null;
        private bool FReconnect = false;
        private bool FUserDisconnect = false;
        private bool FConnecting = false;
        private bool FSendPending = false;
        private int FBytesSent = 0;
        private string FUnsentString = String.Empty;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        // ***************** TModClient Implementation *********************
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            FConnecting = false;
            FUserDisconnect = false;
            this.tcpClient = new Socket(this);
            Socket _wvar1 = (this.tcpClient);
            //@ Unsupported property or method(C): 'Port'
            _wvar1.Port = 23;
            //@ Unsupported property or method(C): 'OnConnect'
            _wvar1.OnConnect = tcpClientOnConnect;
            //@ Unsupported property or method(C): 'OnDisconnect'
            _wvar1.OnDisconnect = tcpClientOnDisconnect;
            //@ Unsupported property or method(C): 'OnRead'
            _wvar1.OnRead = tcpClientOnRead;
            //@ Unsupported property or method(C): 'OnError'
            _wvar1.OnError = tcpClientOnError;
            //@ Unsupported property or method(C): 'OnWrite'
            _wvar1.OnWrite = tcpClientOnWrite;
            tmrReconnect = new Timer(this);
            tmrReconnect.Enabled = false;
            tmrReconnect.Interval = 3000;
            tmrReconnect.Tick = tmrReconnectTimer;
        }

        public override void BeforeDestruction()
        {
            //@ Unsupported property or method(C): 'Free'
            this.tcpClient.Free;
            base.BeforeDestruction();
        }

        public void Send(string Text)
        {
            if (Connected && (Text != ""))
            {
                FUnsentString = FUnsentString + Text;
                //@ Unsupported property or method(C): 'Socket'
                //@ Unsupported property or method(B): 'SendText'
                FBytesSent = this.tcpClient.Socket.SendText(FUnsentString);
                // if FBytesSent <> Length(Text) then
                if (FBytesSent != FUnsentString.Length)
                {
                    FSendPending = true;
                    FUnsentString = FUnsentString.Substring(FBytesSent + 1 - 1 ,FUnsentString.Length - FBytesSent);
                }
                else
                {
                    FSendPending = false;
                    FUnsentString = "";
                }
            }
        }

        public void Connect(bool IsReconnect)
        {
            if (Connected || FConnecting || ((tmrReconnect.Enabled) && !IsReconnect))
            {
                Disconnect();
                return;
            }
            // See if we're allowed to connect
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                Global.Units.Global.TWXServer.ClientMessage("You must have an uncorrupted database selected to connect to a server");
                return;
            }
            //@ Unsupported property or method(C): 'Port'
            this.tcpClient.Port = Global.Units.Global.TWXDatabase.DBHeader.Port;
            //@ Unsupported property or method(C): 'Host'
            this.tcpClient.Host = Global.Units.Global.TWXDatabase.DBHeader.Address;
            // Broadcast operation
            Global.Units.Global.TWXServer.Broadcast((char)(13) + Ansi.Units.Ansi.ANSI_CLEARLINE + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Attempting to connect to: " + Ansi.Units.Ansi.ANSI_7 + Global.Units.Global.TWXDatabase.DBHeader.Address + ':' + (Global.Units.Global.TWXDatabase.DBHeader.Port).ToString() + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
            try {
                FConnecting = true;
                //@ Unsupported property or method(C): 'Open'
                this.tcpClient.Open;
                // Update menu options
                Global.Units.Global.TWXGUI.Connected = true;
            }
            catch {
                if (Reconnect)
                {
                    Global.Units.Global.TWXServer.ClientMessage("Connection failure - retrying in 3 seconds...");
                    tmrReconnect.Enabled = true;
                    FUserDisconnect = false;
                    this.tcpClient.Close();
                }
                else
                {
                    Global.Units.Global.TWXServer.ClientMessage("Connection failure");
                }
                Global.Units.Global.TWXInterpreter.ProgramEvent("Connection lost", "", false);
                FConnecting = false;
            }
        }

        public void Connect()
        {
            Connect(false);
        }

        public void Disconnect()
        {
            // Broadcast operation
            if (Connected && !FConnecting)
            {
                Global.Units.Global.TWXServer.ClientMessage("Disconnecting from server...");
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("Connect cancelled.");
            }
            // Make sure it doesn't try to reconnect
            FUserDisconnect = true;
            tmrReconnect.Enabled = false;
            FConnecting = false;
            // Deactivate client - disconnect from server
            this.tcpClient.Close();
        }

        protected void tcpClientOnConnect(Object Sender, Socket ScktComp)
        {
            // We are now connected
            Global.Units.Global.TWXExtractor.Reset();
            FUserDisconnect = false;
            FConnecting = false;
            // Send Are You There
            ScktComp.Send('ÿ' + Units.TCP.OP_DO + 'ö');
            // Broadcast event
            Global.Units.Global.TWXServer.ClientMessage("Connection accepted");
            Global.Units.Global.TWXInterpreter.ProgramEvent("Connection accepted", "", false);
            // manual event - trigger login script
            if ((Global.Units.Global.TWXDatabase.DBHeader.UseLogin))
            {
                Global.Units.Global.TWXInterpreter.Load(Utility.Units.Utility.FetchScript(Global.Units.Global.TWXDatabase.DBHeader.LoginScript, false), false);
            }
        }

        protected void tcpClientOnDisconnect(Object Sender, Socket ScktComp)
        {
            // No longer connected
            Global.Units.Global.TWXGUI.Connected = false;
            // Reconnect if supposed to
            if (Reconnect && !FUserDisconnect)
            {
                Global.Units.Global.TWXServer.ClientMessage("Connection lost - reconnecting in 3 seconds...");
                tmrReconnect.Enabled = true;
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("Connection lost.");
            }
            FUserDisconnect = false;
            Global.Units.Global.TWXInterpreter.ProgramEvent("Connection lost", "", false);
        }

        protected void tcpClientOnRead(Object Sender, Socket ScktComp)
        {
            string InString;
            string NewString;
            string XString;
            int BufSize;
            char[] Buffer = new char[255 + 1];
            InString = "";
            // Read from client socket
            BufSize = ScktComp.Receive(Buffer, 256);
            while (BufSize > 0)
            {
                // InString := InString + Copy(Buffer, 1, BufSize);
                //@ Unsupported function or procedure: 'SetString'
                SetString(NewString, Buffer, BufSize);
                InString = InString + NewString;
                BufSize = ScktComp.Receive(Buffer, 256);
            }
            XString = this.ProcessTelnet(InString, ScktComp);
            if ((Global.Units.Global.TWXMenu.CurrentMenu != null))
            {
                // menu prompt
                XString = (char)(13) + Ansi.Units.Ansi.ANSI_CLEARLINE + Ansi.Units.Ansi.ANSI_MOVEUP + XString + Core.Units.Core.endl + Global.Units.Global.TWXMenu.GetPrompt();
            }
            // Broadcast data to clients
            Global.Units.Global.TWXServer.Broadcast(XString, false, false);
            // Process data for active scripts
            Global.Units.Global.TWXExtractor.ProcessInBound(ref InString);
        }

        protected void tcpClientOnWrite(Object Sender, Socket ScktComp)
        {
            // EP - The socket has just signalled that it's now available to send
            if (FSendPending)
            {
                Send(FUnsentString);
            }
        }

        protected void tcpClientOnError(Object Sender, Socket Socket, TErrorEvent ErrorEvent, ref int ErrorCode)
        {
            Global.Units.Global.TWXGUI.Connected = false;
            if (Reconnect)
            {
                Global.Units.Global.TWXServer.ClientMessage("Connection failure - retrying in 3 seconds...");
                tmrReconnect.Enabled = true;
                FUserDisconnect = false;
                this.tcpClient.Close();
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("Connection failure");
                // EP - Only show the dialog if Reconnect = FALSE
                //@ Unsupported property or method(C): 'Host'
                //@ Unsupported property or method(C): 'Port'
                MessageBox.Show(Convert.ToString("Error trying to connect to host " + this.tcpClient.Host + " on port " + (this.tcpClient.Port).ToString() + '.'), Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Warning);
            }
            Global.Units.Global.TWXInterpreter.ProgramEvent("Connection lost", "", false);
            FConnecting = false;
            // Disable error message
            ErrorCode = 0;
        }

        protected void tmrReconnectTimer(Object Sender)
        {
            tmrReconnect.Enabled = false;
            if (!Connected)
            {
                Connect(true);
            }
        }

        protected bool GetConnected()
        {
            bool result;
            // Result := tcpClient.IsConnected;
            //@ Unsupported property or method(C): 'Active'
            result = this.tcpClient.Active;
            return result;
        }

        // IModClient
        protected bool GetReconnect()
        {
            bool result;
            result = FReconnect;
            return result;
        }

        protected void SetReconnect(bool Value)
        {
            FReconnect = Value;
        }

    } // end TModClient

    // OverbyteICSTnCnx,
    // OverbyteICSWSocket,
    public enum TClientType
    {
        ctStandard,
        ctDeaf,
        ctUnauthorised,
        ctMute
    } // end TClientType

}

namespace TCP.Units
{
    public class TCP
    {
        // OverbyteICSTnCnx,
        // OverbyteICSWSocket,
        public const char OP_SB = 'ú';
        public const char OP_WILL = 'û';
        public const char OP_WONT = 'ü';
        public const char OP_DO = 'ý';
        public const char OP_DONT = 'þ';
    } // end TCP

}

