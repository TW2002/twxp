{
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
}
unit TCP;

interface

uses
  SysUtils,
  Classes,
  ScktComp,
  //OverbyteICSTnCnx,
  ExtCtrls,
  //OverbyteICSWSocket,
  Core;

const
  OP_SB   = #250;
  OP_WILL = #251;
  OP_WONT = #252;
  OP_DO   = #253;
  OP_DONT = #254;

type
  TClientType = (ctStandard, ctDeaf, ctUnauthorised, ctMute);

  TTelnetSocket = class(TTWXModule)
  type
    TFunc = (None, IAC, Op, Sub, Command, Done); // EP - Set here to persist between receives
  private
    FOptionSent : array[0..255] of Boolean;
    function ProcessTelnet(S : string; Socket : TCustomWinSocket) : string;
  end;

  TTelnetServerSocket = class(TTelnetSocket)
  private
    tcpServer : TServerSocket;
  end;

  TTelnetClientSocket = class(TTelnetSocket)
  private
    tcpClient : TClientSocket;
  end;

  TModServer = class(TTelnetServerSocket, IModServer)
  private
    FClientTypes     : array[0..255] of TClientType;
    FClientEchoMarks : array[0..255] of Boolean;
    FCurrentClient   : Integer;
    FBufferOut       : TStringList;
    FBufTimer        : TTimer;
    FAcceptExternal  : Boolean;
    FBroadCastMsgs   : Boolean;
    FLocalEcho       : Boolean;

  private
    function GetClientType(Index : Integer) : TClientType;
    procedure SetClientType(Index : Integer; Value : TClientType);
    function GetClientCount : Integer;
    function GetClientAddress(Index : Integer) : string;
    function GetSocketIndex(S : TCustomWinSocket) : Integer;
    function GetListenPort: Word;
    procedure SetListenPort(Value: Word);

    { IModServer }
    function GetAcceptExternal: Boolean;
    procedure SetAcceptExternal(Value: Boolean);
    function GetBroadCastMsgs: Boolean;
    procedure SetBroadCastMsgs(Value: Boolean);
    function GetLocalEcho: Boolean;
    procedure SetLocalEcho(Value: Boolean);

  protected
    procedure tcpServerClientConnect(Sender: TObject; Socket: TCustomWinSocket);
    procedure tcpServerClientDisconnect(Sender: TObject; Socket: TCustomWinSocket);
    procedure tcpServerClientError(Sender: TObject; Socket: TCustomWinSocket;
      ErrorEvent: TErrorEvent; var ErrorCode: Integer);
    procedure tcpServerClientRead(Sender: TObject; Socket: TCustomWinSocket);
    procedure OnBufTimer(Sender : TObject);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;

    procedure Broadcast(Text : string; AMarkEcho : Boolean = TRUE; BroadcastDeaf : Boolean = TRUE; Buffered : Boolean = FALSE);
    procedure ClientMessage(MessageText : string);
    procedure AddBuffer(Text : string);
    procedure StopVarDump;
    procedure NotifyScriptLoad;
    procedure NotifyScriptStop;

    property ClientTypes[Index : Integer] : TClientType read GetClientType write SetClientType;
    property ClientCount : Integer read GetClientCount;
    property ClientAddresses[Index : Integer] : string read GetClientAddress;

    procedure Activate;
    procedure Deactivate;

  published
    property ListenPort: Word read GetListenPort write SetListenPort;
    property AcceptExternal: Boolean read GetAcceptExternal write SetAcceptExternal;
    property BroadCastMsgs: Boolean read GetBroadCastMsgs write SetBroadCastMsgs;
    property LocalEcho: Boolean read GetLocalEcho write SetLocalEcho;
  end;

  TModClient = class(TTelnetClientSocket, IModClient)
  private
    tmrReconnect    : TTimer;
    FReconnect,
    FUserDisconnect,
    FConnecting,
    FSendPending    : Boolean;
    FBytesSent      : Integer;
    FUnsentString   : String;

  protected
    procedure tcpClientOnConnect(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnDisconnect(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnRead(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnWrite(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnError(Sender: TObject; Socket: TCustomWinSocket; ErrorEvent: TErrorEvent; var ErrorCode: Integer);
    procedure tmrReconnectTimer(Sender: TObject);

    function GetConnected : Boolean;

    { IModClient }
    function GetReconnect: Boolean;
    procedure SetReconnect(Value: Boolean);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;

    procedure Send(Text : string);
    procedure Connect(IsReconnect : Boolean = FALSE);
    procedure Disconnect;

    property Connected : Boolean read GetConnected;

  published
    property Reconnect: Boolean read GetReconnect write SetReconnect;
  end;

implementation

uses
  Global,
  Ansi,
  Utility,
  Dialogs;


// ***************** TModServer Implementation *********************



procedure TModServer.AfterConstruction;
begin
  inherited;

  tcpServer := TServerSocket.Create(Self);

  with (tcpServer) do
  begin
    OnClientConnect := tcpServerClientConnect;
    OnClientDisconnect := tcpServerClientDisconnect;
    OnClientRead := tcpServerClientRead;
    OnClientError := tcpServerClientError;
  end;

  FBufferOut := TStringList.Create;
  FBufTimer := TTimer.Create(Self);
  FBufTimer.OnTimer := OnBufTimer;
  FBufTimer.Interval := 1;
  FBufTimer.Enabled := FALSE;

  // set defaults
 //tcpServer.Port := 23;
 BroadCastMsgs := True;
end;

procedure TModServer.BeforeDestruction;
begin
  tcpServer.Free;
  FBufferOut.Free;
  FBufTimer.Free;

  inherited;
end;

procedure TModServer.Broadcast(Text : string; AMarkEcho : Boolean = TRUE; BroadcastDeaf : Boolean = TRUE; Buffered : Boolean = FALSE);
var
  I : Integer;
begin
  if (Length(Text) = 0) then
    Exit;

  if not (Buffered) and (FBufferOut.Count > 0) then
  begin
    // we still have data going out of the buffer, add to it for a later broadcast
    FBufferOut.Add(Text);
    Exit;
  end;

  for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
    if (BroadcastDeaf) or (ClientTypes[I] <> ctDeaf) then
    begin
      if (AMarkEcho) and (FClientEchoMarks[I]) then
        tcpServer.Socket.Connections[I].SendText(#255 + #0 + Text + #255 + #1)
      else
        tcpServer.Socket.Connections[I].SendText(Text);
    end;
end;

procedure TModServer.ClientMessage(MessageText : string);
begin
  if (TWXMenu.CurrentMenu <> nil) then
    Broadcast(#13 + ANSI_CLEARLINE + endl + ANSI_15 + MessageText + ANSI_7 + endl + TWXMenu.GetPrompt)
  else if (TWXClient.Connected) and (Length(TWXExtractor.CurrentLine) > 0) then
    Broadcast(#13 + ANSI_CLEARLINE + endl + ANSI_15 + MessageText + ANSI_7 + endl + endl + TWXExtractor.CurrentANSILine)
  else
    Broadcast(endl + ANSI_15 + MessageText + ANSI_7 + endl);
end;

procedure TModServer.AddBuffer(Text : string);
begin
  // add text to outgoing buffer
  FBufferOut.Append(Text);
  FBufTimer.Enabled := TRUE;
end;

procedure TModServer.StopVarDump;
var
  I : Integer;
  Found : Boolean;
begin
  // Find the index of 'Variable Dump Complete.'
  FBufTimer.Enabled := FALSE;
  Found := FALSE;
  for I := FBufferOut.Count - 1 downto 0 do
  begin
    if Found = TRUE then
      FBufferOut.Delete(I)
    else if (Pos('Variable Dump Complete.', FBufferOut[I]) > 0) then
    begin
      Found := TRUE;
      FBufferOut.Delete(I);
    end;
  end;
  FBufTimer.Enabled := TRUE;
end;

procedure TModServer.NotifyScriptLoad;
var
  I : Integer;
begin
  if (tcpServer.Socket.ActiveConnections > 0) then
    for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
      if (FClientEchoMarks[I]) then
        tcpServer.Socket.Connections[I].SendText(#255 + #2);
end;

procedure TModServer.NotifyScriptStop;
var
  I : Integer;
begin
  if (tcpServer.Socket.ActiveConnections > 0) then
    for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
      if (FClientEchoMarks[I]) then
        tcpServer.Socket.Connections[I].SendText(#255 + #3);
end;

procedure TModServer.tcpServerClientConnect(Sender: TObject;
  Socket: TCustomWinSocket);
const
  T_WILL = #255 + #251;
  T_WONT = #255 + #252;
  T_DO = #255 + #253;
  T_DONT = #255 + #254;
var
  LocalClient : Boolean;
  SktIndex    : Integer;
begin
  if (Socket.RemoteAddress = '127.0.0.1') or (Copy(Socket.RemoteAddress, 1, 8) = '192.168.') or (Copy(Socket.RemoteAddress, 1, 3) = '10.') then
    LocalClient := TRUE
  else
    LocalClient := FALSE;

  if (not AcceptExternal) and (Socket.RemoteAddress <> '127.0.0.1') then
  begin
    // User not allowed
    Socket.Close;
  end
  else
  begin
    // send telnet stuff - AYT
    Socket.SendText(#255 + OP_DO + #246);

    if (BroadCastMsgs) then
    begin
      ClientMessage(ANSI_7 + 'Active connection detected from: ' + ANSI_15 + Socket.RemoteAddress);
    end;

    SktIndex := GetSocketIndex(Socket);

    if (LocalClient) then
      FClientTypes[SktIndex] := ctStandard
    else
      FClientTypes[SktIndex] := ctMute;

    FClientEchoMarks[SktIndex] := FALSE;

    // Broadcast confirmation to client
    Socket.SendText(endl + ANSI_7 +
                      'TWX Proxy Server ' + ANSI_15 + 'v' + ProgramVersion + ANSI_7 + endl +
                      '(' + ReleaseVersion + ')' + endl + endl +
                      'There are currently ' + ANSI_15 + IntToStr(tcpServer.Socket.ActiveConnections) + ANSI_7 + ' active telnet connections' + endl);

    if (TWXClient.Connected) then
      Socket.SendText('You are connected to server: ' + ANSI_15 + TWXDatabase.DBHeader.Address + endl + ANSI_7)
    else
      Socket.SendText('No server connections detected' + endl);

    if (TWXLog.LogFileOpen) then
      Socket.SendText(endl + 'You are logging to file: ' + ANSI_15 + TWXLog.LogFilename + ANSI_7 + endl + endl);

    if (LocalClient) then
    begin
      Socket.SendText('Press ' + ANSI_15 + TWXExtractor.MenuKey + ANSI_7 + ' to activate terminal menu' + endl + endl);

      if (AcceptExternal) then
        Socket.SendText(ANSI_12 + 'WARNING: ' + ANSI_15 +
                                  'With external connections enabled,' + endl +
                                  'you are open to foreign users connecting' + endl +
                                  'to your machine and monitoring data.' + endl + endl);
    end
    else
      Socket.SendText(ANSI_15 + 'You are locked in view only mode' + ANSI_7 + endl + endl);

    TWXInterpreter.ProgramEvent('Client connected', '', FALSE);
  end;
end;

procedure TModServer.tcpServerClientDisconnect(Sender: TObject;
  Socket: TCustomWinSocket);
var
  I,
  Index : Integer;
begin
  Index := GetSocketIndex(Socket);

  // remove client from list
  for I := Index to 254 do
  begin
    FClientTypes[I] := FClientTypes[I + 1];
    FClientEchoMarks[I] := FClientEchoMarks[I + 1];
  end;

  TWXInterpreter.ProgramEvent('Client disconnected', '', FALSE);

  // manual client message to all sockets except the one disconnecting
  for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
    if (tcpServer.Socket.Connections[I] <> Socket) then
      tcpServer.Socket.Connections[I].SendText(endl + ANSI_7 + 'Connection lost from: ' + ANSI_15 + Socket.RemoteAddress + ANSI_7 + endl);
end;

procedure TModServer.tcpServerClientError(Sender: TObject;
  Socket: TCustomWinSocket; ErrorEvent: TErrorEvent;
  var ErrorCode: Integer);
begin
  // Disable error message
  ErrorCode := 0;
end;

procedure TModServer.tcpServerClientRead(Sender: TObject;
  Socket: TCustomWinSocket);
var
  InStr,
  InString : string;
  I        : Integer;
  Last     : Char;
begin
  // terminate any logs that are playing
  TWXLog.EndPlayLog;

  // Read data from server socket
  InStr := Socket.ReceiveText;

  // remove any null characters after #13
  InString := '';
  Last := #0;
  if (Length(InStr) > 0) then
    for I := 1 to Length(InStr) do
    begin
      if not ((Last = #13) and ((InStr[I] = #0) or (InStr[I] = #10))) then
        InString := InString + InStr[I];

      Last := InStr[I];
    end;

  // process telnet commands
  InString := ProcessTelnet(InString, Socket);

  if (InString = '') then
    Exit;

  FCurrentClient := GetSocketIndex(Socket);

  if (ClientTypes[FCurrentClient] = ctMute) then
    Exit; // mute clients can't talk

  // Process data for telnet commands
  if (TWXExtractor.ProcessOutBound(InString, FCurrentClient)) and (TWXClient.Connected) then
  begin
    TWXClient.Send(InString);

    if (LocalEcho) then
      Socket.SendText(InString);
  end;
end;

procedure TModServer.OnBufTimer(Sender : TObject);
begin
  if (FBufferOut.Count > 0) then
  begin
    Broadcast(FBufferOut[0], TRUE, TRUE, TRUE);
    FBufferOut.Delete(0);
  end
  else
    FBufTimer.Enabled := FALSE;
end;

function TModServer.GetClientType(Index : Integer) : TClientType;
begin
  Result := FClientTypes[Index];  
end;

function TModServer.GetClientCount : Integer;
begin
  Result := tcpServer.Socket.ActiveConnections;
end;

function TModServer.GetClientAddress(Index : Integer) : string;
begin
  Result := tcpServer.Socket.Connections[Index].RemoteAddress;
end;

procedure TModServer.SetClientType(Index : Integer; Value : TClientType);
begin
  FClientTypes[Index] := Value;
end;

function TModServer.GetSocketIndex(S : TCustomWinSocket) : Integer;
var
  I     : Integer;
  Found : Boolean;
begin
  Found := FALSE;

  for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
    if (tcpServer.Socket.Connections[I] = S) then
    begin
      Found := TRUE;
      Break;
    end;

  if (Found) then
    Result := I
  else
    Result := -1;
end;

procedure TModServer.SetListenPort(Value : Word);
begin
  //TWXDatabase.DBHeader.ServerPort := Value;
  TWXDatabase.ServerPort := Value;
  if (tcpServer.Port <> Value) then
  begin
    tcpServer.Close;
    tcpServer.Port := Value;
  end;

  // The server is no longer set active here, but requires a call to Activate
  {try
    tcpServer.Active := TRUE;
  except
    MessageDlg('Unable to bind a listening socket on port ' + IntToStr(Value) + endl + 'You will need to change it before you can connect to TWX Proxy.', mtWarning, [mbOk], 0);
    tcpServer.Active := FALSE;
  end;}
end;

function TModServer.GetListenPort : Word;
begin
  Result := tcpServer.Port;
end;

procedure TModServer.Activate;
begin
  if not tcpServer.Active then
  begin
    try
      tcpServer.Active := TRUE;  
    except
      MessageDlg('Unable to bind a listening socket on port ' + IntToStr(tcpServer.Port) + '.' + endl + 'You will need to change it before you can connect to TWX Proxy.', mtWarning, [mbOk], 0);
      tcpServer.Active := FALSE;
    end;  
  end;
end;

procedure TModServer.Deactivate;
begin
  tcpServer.Active := FALSE;
end;

function TModServer.GetAcceptExternal: Boolean;
begin
  Result := FAcceptExternal;
end;

procedure TModServer.SetAcceptExternal(Value: Boolean);
begin
  FAcceptExternal := Value;
end;

function TModServer.GetBroadCastMsgs: Boolean;
begin
  Result := FBroadCastMsgs;
end;

procedure TModServer.SetBroadCastMsgs(Value: Boolean);
begin
  FBroadCastMsgs := Value;
end;

function TModServer.GetLocalEcho: Boolean;
begin
  Result := FLocalEcho;
end;

procedure TModServer.SetLocalEcho(Value: Boolean);
begin
  FLocalEcho := Value;
end;


// ***************** TModClient Implementation *********************


procedure TModClient.AfterConstruction;
begin
  inherited;

  FConnecting := FALSE;
  FUserDisconnect := FALSE;

  tcpClient := TClientSocket.Create(Self);

  with (tcpClient) do
  begin
    Port := 23;
    OnConnect := tcpClientOnConnect;
    OnDisconnect := tcpClientOnDisconnect;
    OnRead := tcpClientOnRead;
    OnError := tcpClientOnError;
    OnWrite := tcpClientOnWrite;
  end;

  tmrReconnect := TTimer.Create(Self);

  with (tmrReconnect) do
  begin
    Enabled := FALSE;
    Interval := 3000;
    OnTimer := tmrReconnectTimer;
  end;
end;

procedure TModClient.BeforeDestruction;
begin
  tcpClient.Free;

  inherited;
end;

procedure TModClient.Send(Text : string);
begin
  if (Connected) and (Text <> '') then
  begin
    FUnsentString := FUnsentString + Text;
    FBytesSent := tcpClient.Socket.SendText(FUnsentString);
    //if FBytesSent <> Length(Text) then
    if FBytesSent <> Length(FUnsentString) then
    begin
      FSendPending := TRUE;
      FUnsentString := Copy(FUnsentString, FBytesSent + 1, Length(FUnsentString) - FBytesSent);
    end
    else
    begin
      FSendPending := FALSE;
      FUnsentString := '';
    end;
  end;
end;

procedure TModClient.Connect(IsReconnect : Boolean = FALSE);
begin
  if (Connected) or (FConnecting) or ((tmrReconnect.Enabled) and not (IsReconnect)) then
  begin
    Disconnect;
    Exit;
  end;

  // See if we're allowed to connect
  if not (TWXDatabase.DatabaseOpen) then
  begin
    TWXServer.ClientMessage('You must have an uncorrupted database selected to connect to a server');
    Exit;
  end;

  tcpClient.Port := TWXDatabase.DBHeader.Port;
  tcpClient.Host := TWXDatabase.DBHeader.Address;

  // Broadcast operation
  TWXServer.Broadcast(chr(13) + ANSI_CLEARLINE + endl + ANSI_15 + 'Attempting to connect to: ' + ANSI_7 + TWXDatabase.DBHeader.Address + ':' + IntToStr(TWXDatabase.DBHeader.Port) + ANSI_7 + endl);

  try
    FConnecting := TRUE;
    tcpClient.Open;

    // Update menu options
    TWXGUI.Connected := True;
  except
    if (Reconnect) then
    begin
      TWXServer.ClientMessage('Connection failure - retrying in 3 seconds...');
      tmrReconnect.Enabled := TRUE;
      FUserDisconnect := FALSE;
      tcpClient.Close;
    end
    else
      TWXServer.ClientMessage('Connection failure');

    TWXInterpreter.ProgramEvent('Connection lost', '', FALSE);
    FConnecting := FALSE;
  end;
end;

procedure TModClient.Disconnect;
begin
  // Broadcast operation
  if (Connected) and not (FConnecting) then
    TWXServer.ClientMessage('Disconnecting from server...')
  else
    TWXServer.ClientMessage('Connect cancelled.');

  // Make sure it doesn't try to reconnect
  FUserDisconnect := TRUE;
  tmrReconnect.Enabled := FALSE;
  FConnecting := FALSE;

  // Deactivate client - disconnect from server
  tcpClient.Close;
end;

procedure TModClient.tcpClientOnConnect(Sender: TObject; ScktComp: TCustomWinSocket);
begin
  // We are now connected

  TWXExtractor.Reset;
  FUserDisconnect := FALSE;
  FConnecting := FALSE;

  // Send Are You There
  ScktComp.SendText(#255 + OP_DO + #246);

  // Broadcast event
  TWXServer.ClientMessage('Connection accepted');

  TWXInterpreter.ProgramEvent('Connection accepted', '', FALSE);

  // manual event - trigger login script
  if (TWXDatabase.DBHeader.UseLogin) then
    TWXInterpreter.Load(FetchScript(TWXDatabase.DBHeader.LoginScript, FALSE), FALSE);
end;

procedure TModClient.tcpClientOnDisconnect(Sender: TObject; ScktComp: TCustomWinSocket);
begin
  // No longer connected

  TWXGUI.Connected := False;

  // Reconnect if supposed to
  if (Reconnect) and not (FUserDisconnect) then
  begin
    TWXServer.ClientMessage('Connection lost - reconnecting in 3 seconds...');
    tmrReconnect.Enabled := TRUE;
  end
  else
    TWXServer.ClientMessage('Connection lost.');

  FUserDisconnect := FALSE;
  TWXInterpreter.ProgramEvent('Connection lost', '', FALSE);
end;

procedure TModClient.tcpClientOnRead(Sender: TObject; ScktComp: TCustomWinSocket);
var
  InString,
  NewString,
  XString  : string;
  BufSize : integer;
  Buffer : array[0..255] of char;
begin
  InString := '';
  // Read from client socket
  BufSize := ScktComp.ReceiveBuf(Buffer, 256);
  while BufSize > 0 do begin
    //InString := InString + Copy(Buffer, 1, BufSize);
    SetString(NewString, Buffer, BufSize);
    InString := InString + NewString;
    BufSize := ScktComp.ReceiveBuf(Buffer, 256);
  end;

  XString := ProcessTelnet(InString, ScktComp);

  if (TWXMenu.CurrentMenu <> nil) then
    // menu prompt
    XString := chr(13) + ANSI_CLEARLINE + ANSI_MOVEUP + XString + endl + TWXMenu.GetPrompt;

  // Broadcast data to clients
  TWXServer.BroadCast(XString, FALSE, FALSE);

  // Process data for active scripts
  TWXExtractor.ProcessInBound(InString);
end;

procedure TModClient.tcpClientOnWrite(Sender: TObject; ScktComp: TCustomWinSocket);
begin
  // EP - The socket has just signalled that it's now available to send
  if FSendPending then
    Send(FUnsentString);
end;

procedure TModClient.tcpClientOnError(Sender: TObject; Socket: TCustomWinSocket; ErrorEvent: TErrorEvent; var ErrorCode: Integer);
begin
  TWXGui.Connected := FALSE;

  if (Reconnect) then
  begin
    TWXServer.ClientMessage('Connection failure - retrying in 3 seconds...');
    tmrReconnect.Enabled := TRUE;
    FUserDisconnect := FALSE;
    tcpClient.Close;
  end
  else
  begin
    TWXServer.ClientMessage('Connection failure');
    // EP - Only show the dialog if Reconnect = FALSE
    MessageDlg('Error trying to connect to host ' + tcpClient.Host + ' on port ' + IntToStr(tcpClient.Port) + '.', mtWarning, [mbOk], 0);
  end;

  TWXInterpreter.ProgramEvent('Connection lost', '', FALSE);
  FConnecting := FALSE;

  // Disable error message
  ErrorCode := 0;
end;

procedure TModClient.tmrReconnectTimer(Sender: TObject);
begin
  tmrReconnect.Enabled := FALSE;

  if not (Connected) then
    Connect(TRUE);
end;

function TModClient.GetConnected : Boolean;
begin
  //Result := tcpClient.IsConnected;
  Result := tcpClient.Active;
end;

function TModClient.GetReconnect: Boolean;
begin
  Result := FReconnect;
end;

procedure TModClient.SetReconnect(Value: Boolean);
begin
  FReconnect := Value;
end;

{ TTelnetSocket }

function TTelnetSocket.ProcessTelnet(S: string; Socket: TCustomWinSocket): string;
var
  //SktIndex,
  I          : Integer;
  Retn       : string;
  TNOp       : Char;
  Func       : TFunc;
  SentThisOp : Boolean;

  procedure TransmitOp(Func : Char; OpCode : Byte);
  begin
    if not (FOptionSent[OpCode]) then
    begin
      FOptionSent[OpCode] := TRUE;
      Socket.SendText(#255 + Char(Func) + Char(OpCode));

      if (OpCode = Byte(S[I])) then
        SentThisOp := TRUE;
    end;
  end;

begin
  // process and remove telnet commands
  Retn := '';
  Func := None;
  TNOp := #0;

  for I := 1 to Length(S) do
  begin
    if (S[I] = #255) then
    begin
      if (Func = None) then
        Func := IAC
      else if (Func = IAC) then
        Func := None // two datamarks = #255 sent to server
      else if (Func = Op) or (Func = Command) then
        Func := Done;
    end
    else
    begin
      if (Func = IAC) then
      begin
        if (S[I] = OP_SB) then
          Func := Sub
        else if (S[I] = OP_DO) or (S[I] = OP_DONT) or (S[I] = OP_WILL) or (S[I] = OP_WONT) then
        begin
          Func := Op;
          TNOp := S[I];
        end
        else
          Func := Done;
      end
      else if (Func = Op) then
      begin
        Func := Command;
        SentThisOp := FALSE;

        // negotiate operations
        if (S[I] = #246) then
        begin
          // send telnet stuff - Suppress GA, Transmit Binary, Echo
          TransmitOp(OP_WILL, 3);
          TransmitOp(OP_WILL, 0);
          TransmitOp(OP_WILL, 1);
          Func := Done; // EP
        end
        else if (TNOp = OP_DO) then
        begin
          if (S[I] = #25) or (S[I] = #1) or (S[I] = #3) or (S[I] = #0) or (S[I] = #200) then
          begin
            TransmitOp(OP_WILL, Byte(S[I]));

            //if (S[I] = #200) then
              //FClientEchoMarks[SktIndex] := TRUE;
          end
          else
            TransmitOp(OP_WONT, Byte(S[I]));
          Func := Done; // EP
        end
        else if (TNOp = OP_WILL) then
        begin
          if (S[I] = #3) // suppress goahead
            or (S[I] = #0) // transmit binary
            or (S[I] = #1) // local echo
            then
            TransmitOp(OP_DO, Byte(S[I]))
          else
            TransmitOp(OP_DONT, Byte(S[I]));
          Func := Done; // EP
        end
        else if (TNOp = OP_DONT) then
        begin
          if (S[I] = #200) then
          begin
            // don't TWX Echo Mark
            //FClientEchoMarks[SktIndex] := FALSE;
            TransmitOp(OP_WONT, 200);
          end
          else
            TransmitOp(OP_WONT, Byte(S[I])); // EP
          Func := Done; // EP
        end
        else if (TNOp = OP_WONT) then // EP - This was missing from the server function
        begin
          // Just ignore it - EP
          Func := Done; // EP
        end;

        if (FOptionSent[Byte(S[I])]) and not (SentThisOp) then
          FOptionSent[Byte(S[I])] := FALSE;
      end // end (Function = Op)
      else if (Func = Sub) then
      begin
        if (S[I] = #240) then
          Func := Done; // EP
      end
      else if (Func = Command) then
        Func := Done; // EP - Some unknown command?
    end;

    if (Func = Done) then
      Func := None
    else if (Func = None) then
      Retn := Retn + S[I];
  end;

  Result := Retn;
end;

end.
