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
  Windows,
  Classes,
  ScktComp,
  //OverbyteICSTnCnx,
  ExtCtrls,
  //OverbyteICSWSocket,
  Database,
  Core;

const
  OP_SB   = #250;
  OP_WILL = #251;
  OP_WONT = #252;
  OP_DO   = #253;
  OP_DONT = #254;

type
  TClientType = (ctStandard, ctDeaf, ctRejected, ctMute);
  TDisplayMode = (ctSilent, ctQuiet, ctNormal, ctVerbose);

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

  TQuickText = class
  private
    Search : string;
    Replace : string;
  end;


  TModServer = class(TTelnetServerSocket, IModServer)
  private
    FClientTypes     : array[0..255] of TClientType;
    FClientEchoMarks : array[0..255] of Boolean;
    FCurrentClient   : Integer;
    FBufferOut       : TStringList;
    FBufTimer        : TTimer;
    FAllowLerkers    : Boolean;
    FAcceptExternal  : Boolean;
    FExternalAddress : String;
    FBroadCastMsgs   : Boolean;
    FLocalEcho       : Boolean;

    // MB - Strings to hold TW2002 color codes and user color codes
    SystemQuickText,
    UserQuickText     : TList ;


  private
    function GetClientType(Index : Integer) : TClientType;
    procedure SetClientType(Index : Integer; Value : TClientType);
    function GetClientCount : Integer;
    function GetClientAddress(Index : Integer) : string;
    function GetSocketIndex(S : TCustomWinSocket) : Integer;
    function GetListenPort: Word;
    procedure SetListenPort(Value: Word);

    { IModServer }
    function GetAllowLerkers: Boolean;
    procedure SetAllowLerkers(Value: Boolean);
    function GetAcceptExternal: Boolean;
    procedure SetAcceptExternal(Value: Boolean);
    function GetExternalAddress: String;
    procedure SetExternalAddress(Value: String);
    function GetBroadCastMsgs: Boolean;
    procedure SetBroadCastMsgs(Value: Boolean);
    function GetLocalEcho: Boolean;
    procedure SetLocalEcho(Value: Boolean);
    procedure AddSystemQuickText(Search, Replace : string);

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

    procedure Broadcast(Text : string; AMarkEcho : Boolean = TRUE; BroadcastDeaf : Boolean = FALSE; Buffered : Boolean = FALSE);
    procedure ClientMessage(MessageText : string);
    procedure AddBuffer(Text : string);
    procedure StopVarDump;
    procedure NotifyScriptLoad;
    procedure NotifyScriptStop;

    procedure AddQuickText(Search, Replace : string);
    procedure ClearQuickText(Search : string = '');
    function ApplyQuickText(Text : string) : string;

    property ClientTypes[Index : Integer] : TClientType read GetClientType write SetClientType;
    property ClientCount : Integer read GetClientCount;
    property ClientAddresses[Index : Integer] : string read GetClientAddress;

    procedure Activate;
    procedure Deactivate;

  published
    property ListenPort: Word read GetListenPort write SetListenPort;
    property AllowLerkers: Boolean read GetAllowLerkers write SetAllowLerkers;
    property AcceptExternal: Boolean read GetAcceptExternal write SetAcceptExternal;
    property ExternalAddress: String read GetExternalAddress write SetExternalAddress;
    property BroadCastMsgs: Boolean read GetBroadCastMsgs write SetBroadCastMsgs;
    property LocalEcho: Boolean read GetLocalEcho write SetLocalEcho;
  end;

  TModClient = class(TTelnetClientSocket, IModClient)
  private
    tmrIdle,
    tmrReconnect    : TTimer;
    FFirstConnect,
    FReconnect,
    FUserDisconnect,
    FConnecting,
    FSendPending,
    FBlockExtended  : Boolean;
    FBytesSent,
    FReconnectDelay,
    FReconnectTock,
    FreconnectCount : Integer;
    FUnsentString   : String;
    IdleMinutes     : Integer;

  protected
    procedure tcpClientOnConnect(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnDisconnect(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnRead(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnWrite(Sender: TObject; ScktComp: TCustomWinSocket);
    procedure tcpClientOnError(Sender: TObject; Socket: TCustomWinSocket; ErrorEvent: TErrorEvent; var ErrorCode: Integer);
    procedure tmrReconnectTimer(Sender: TObject);
    procedure tmrIdleTimer(Sender: TObject);

    function GetConnected : Boolean;

    { IModClient }
    function GetReconnect: Boolean;
    procedure SetReconnect(Value: Boolean);
    function GetReconnectDelay: Integer;
    procedure SetReconnectDelay(Value: Integer);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;

    procedure Send(Text : string);
    procedure Connect();
    procedure ConnectNow();
    procedure Disconnect;
    procedure CloseClient;

    property Connected : Boolean read GetConnected;

  published
    property Reconnect: Boolean read GetReconnect write SetReconnect;
    property ReconnectDelay: Integer read GetReconnectDelay write SetReconnectDelay;
    property BlockExtended: Boolean read FBlockExtended write FBlockExtended;
    property UserDisconnect: Boolean read FUserDisconnect write FUserDisconnect;
  end;

implementation

uses
  Global,
  Ansi,
  Utility,
  StrUtils,
  Dialogs,
  inifiles;


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
 BroadCastMsgs := True;

  // mb - Cleate lists for quicktext
  SystemQuickText := TList.Create;
  UserQuickText := Tlist.Create;

  // initialize system quicktexts
  AddSystemQuickText('~a', '^[0;30m');
  AddSystemQuickText('~b', '^[0;31m');
  AddSystemQuickText('~c', '^[0;32m');
  AddSystemQuickText('~d', '^[0;33m');
  AddSystemQuickText('~e', '^[0;34m');
  AddSystemQuickText('~f', '^[0;35m');
  AddSystemQuickText('~g', '^[0;36m');
  AddSystemQuickText('~h', '^[0;37m');
  AddSystemQuickText('~A', '^[1;30m');
  AddSystemQuickText('~B', '^[1;31m');
  AddSystemQuickText('~C', '^[1;32m');
  AddSystemQuickText('~D', '^[1;33m');
  AddSystemQuickText('~E', '^[1;34m');
  AddSystemQuickText('~F', '^[1;35m');
  AddSystemQuickText('~G', '^[1;36m');
  AddSystemQuickText('~H', '^[1;37m');
  AddSystemQuickText('~i', '^[1;30m');
  AddSystemQuickText('~j', '^[41m');
  AddSystemQuickText('~k', '^[42m');
  AddSystemQuickText('~l', '^[43m');
  AddSystemQuickText('~m', '^[44m');
  AddSystemQuickText('~n', '^[45m');
  AddSystemQuickText('~o', '^[46m');
  AddSystemQuickText('~p', '^[47m');
  AddSystemQuickText('~!', '^[2J^[H');
  AddSystemQuickText('~@', chr(13) + '^[0m^[0K');
  AddSystemQuickText('~0', '^[0m');
  AddSystemQuickText('~1', '^[0m^[1;36m');
  AddSystemQuickText('~2', '^[0m^[1;33m');
  AddSystemQuickText('~3', '^[0m^[35m');
  AddSystemQuickText('~4', '^[0m^[44m');
  AddSystemQuickText('~5', '^[0m^[32m');
  AddSystemQuickText('~6', '^[0m^[1;5;31m');
  AddSystemQuickText('~7', '^[0m^[1;37m');
  AddSystemQuickText('~8', '^[0m^[1;5;31m');
  AddSystemQuickText('~9', '^[0m^[30;47m');
  AddSystemQuickText('~q', '^[0m^[5;34m');
  AddSystemQuickText('~r', '^[0m^[34m');
  AddSystemQuickText('~s', '^[0m^[30;41m');
  AddSystemQuickText('~I', '^[0;34;47m');
  AddSystemQuickText('~J', '^[31;47m');
  AddSystemQuickText('~K', '^[1;33;44m');

end;

procedure TModServer.BeforeDestruction;
begin
  tcpServer.Free;
  FBufferOut.Free;
  FBufTimer.Free;

  while (SystemQuickText.Count > 0) do
  begin
    TQuickText(SystemQuickText[0]).Free;
    SystemQuickText.Delete(0);
  end;
  SystemQuickText.Free;

  while (UserQuickText.Count > 0) do
  begin
    TQuickText(UserQuickText[0]).Free;
    UserQuickText.Delete(0);
  end;
  UserQuickText.Free;

  inherited;
end;

function TModServer.ApplyQuickText(Text : string) : string;
var
  QuickText : TQuickText;
  I : Integer;
begin
    for I := 0 to UserQuickText.Count - 1 do
    begin
      Text := stringreplace(Text, TQuickText(UserQuickText[I]).Search,
              TQuickText(UserQuickText[I]).Replace, [rfReplaceAll]);
    end;

    for I := 0 to SystemQuickText.Count - 1 do
    begin
      Text := stringreplace(Text, TQuickText(SystemQuickText[I]).Search,
              TQuickText(SystemQuickText[I]).Replace, [rfReplaceAll]);
    end;

    result := stringreplace(Text, '^[', chr(27) + '[', [rfReplaceAll]);
end;

procedure TModServer.AddSystemQuickText(Search, Replace : string);
var
  NewText : TQuickText;
begin
  // build new Syhstem QuickText
  NewText := TQuickText.Create;
  NewText.Search  := Search;
  NewText.Replace := Replace;

  SystemQuickText.Add(NewText);
end;

procedure TModServer.AddQuickText(Search, Replace : string);
var
  NewText : TQuickText;
begin
  // build new User QuickText
  NewText := TQuickText.Create;
  NewText.Search  := Search;
  NewText.Replace := ApplyQuickText(Replace);

  UserQuickText.Add(NewText);
end;

procedure TModServer.ClearQuickText(Search : string = '');
var
  NewText : TQuickText;
  I : Integer;
begin
  if (Search = '') then
    begin
       while (UserQuickText.Count > 0) do
    begin
      TQuickText(UserQuickText[0]).Free;
      UserQuickText.Delete(0);
    end;
  end
  else
  begin
    for I := 0 to UserQuickText.Count - 1 do
    begin
      if TQuickText(UserQuickText[I]).Search = Search then
      begin
        TQuickText(UserQuickText[I]).Free;
        UserQuickText.Delete(I);
        break;
      end;
    end;
  end;
end;

procedure TModServer.Broadcast(Text : string; AMarkEcho : Boolean = TRUE; BroadcastDeaf : Boolean = FALSE; Buffered : Boolean = FALSE);
var
  I : Integer;
begin
  if (Length(Text) = 0) then
    Exit;

  Text := ApplyQuickText(Text);

  if not (Buffered) and (FBufferOut.Count > 0) then
  begin
    // we still have data going out of the buffer, add to it for a later broadcast
    FBufferOut.Add(Text);
    Exit;
  end;

  for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
    if (BroadcastDeaf) or (ClientTypes[I] <> ctDeaf) then
    begin
      try
      if (AMarkEcho) and (FClientEchoMarks[I]) then
        tcpServer.Socket.Connections[I].SendText(#255 + #0 + Text + #255 + #1)
      else
        tcpServer.Socket.Connections[I].SendText(Text);
      except
        OutputDebugString(PChar('Unexpected error sending broadcast message'));
      end;
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
    Begin
      if (FClientEchoMarks[I]) then
        tcpServer.Socket.Connections[I].SendText(#255 + #3);

      // MB - Clear the Deaf flag if there are no other scripts running.
      if (TWXInterpreter.Count = 0) then
        TWXServer.ClientTypes[I] := ctStandard;
    End;
end;

procedure TModServer.tcpServerClientConnect(Sender: TObject;
  Socket: TCustomWinSocket);
const
  T_WILL = #255 + #251;
  T_WONT = #255 + #252;
  T_DO = #255 + #253;
  T_DONT = #255 + #254;
var
  IniFile       : TIniFile;
  LocalClient   : Boolean;
  Index         : Integer;
  RemoteAddress,
  Address,
  TempAddress   : String;
  AddressList   : TStringList;
begin
  IniFile := TIniFile.Create(TWXGUI.ProgramDir + '\twxp.cfg');

  RemoteAddress := Socket.RemoteAddress;
  AddressList := TStringList.Create;
  Index := GetSocketIndex(Socket);

  if (RemoteAddress = '127.0.0.1') or
  (Copy(RemoteAddress, 1, 8) = '192.168.') or
  (Copy(RemoteAddress, 1, 3) = '10.')
  then
    LocalClient := TRUE
  else
    LocalClient := FALSE;

   try
     ExtractStrings([' '],[], pchar(ExternalAddress), AddressList);

     for Address in AddressList do
     begin
        TempAddress := stringreplace(Address, '.*', '',[rfReplaceAll, rfIgnoreCase]);
        if (Copy(RemoteAddress,1,length(TempAddress)) = TempAddress)
        then
          LocalClient := TRUE
     end;
   finally
     AddressList.Free;
   end;

  if (not AcceptExternal) and (not AllowLerkers) and (RemoteAddress <> '127.0.0.1') then
    begin
      // User not allowed
      Socket.SendText(ANSI_12 + 'External connections are disabled. Goodbye!');
      Sleep(500);
      FClientTypes[Index] := ctRejected;
      Socket.Close();
      if (BroadCastMsgs) then
        Broadcast(endl + ANSI_12 + 'Remote connection rejected from: ' + ANSI_14 + RemoteAddress + endl);
      exit;
    end
  else if ((AcceptExternal) or (AllowLerkers)) and (not LocalClient) then
    begin
      Socket.SendText(ANSI_12 + 'Lerkers are not welcome here. Goodbye!');
      Sleep(500);
      FClientTypes[Index] := ctRejected;
      Socket.Close();
      if (BroadCastMsgs) then
        Broadcast(endl + ANSI_12 + 'Remote connection rejected from: ' + ANSI_14 + RemoteAddress + endl);
      exit;
    end;

  Socket.SendText(endl + ANSI_13 + 'TWX Proxy Server ' + ANSI_11 + 'v' +
                  ProgramVersion + chr(ReleaseNumber + 96) + ANSI_7 + ' (' + ReleaseVersion + ')' + endl);

  if (BroadCastMsgs) then
    Broadcast(endl + ANSI_2 + 'Active connection detected from: ' + ANSI_14 + RemoteAddress + endl + endl)
  else
    Socket.SendText(endl + ANSI_2 + 'Active connection detected from: ' + ANSI_14 + RemoteAddress + endl);


  begin
    // Send Telnet "Are you there"
    Socket.SendText(#255 + OP_DO + #246);
    FClientEchoMarks[Index] := FALSE;

    if (ReleaseVersion = 'Alpha') then
      Socket.SendText(ANSI_11 + 'NOTICE: ' + ANSI_13 +
                      'Alpha releases have not had sufficent testing, and may' + endl +
                      'be unstable. Please do not distribute, and use at your own risk.' + endl);

    if (ReleaseVersion = 'Beta') then
      Socket.SendText(endl + ANSI_11 + 'NOTICE: ' + ANSI_13 +
                      'Beta releases are generally considered stable, but may have' + endl +
                      'unresolved issues. Use at your own risk.' + endl);

    if (AcceptExternal) or (AllowLerkers) then
      Socket.SendText(endl + ANSI_12 + 'WARNING: ' + ANSI_14 +
                      'With External Connections and/or Allow Lerkers enabled,' + endl +
                      'you are open to foreign users monitoring data remotely.' + endl);

    Socket.SendText(endl);
    try
      if IniFile.ReadString('TWX Proxy', 'UpdateAvailable', 'False') = 'True' then
      begin
        Socket.SendText(ANSI_15 +
          'An updated verion of TWX Proxy is available. To download please visit: ' + endl +
          'https://github.com/MicroBlaster/TWXProxy/wiki' + endl + endl + ANSI_7);
      end;
    finally
      IniFile.Free;
    end;

    if TWXDatabase.DataBaseOpen then
      Socket.SendText(ANSI_10 + 'Using Database ' + ANSI_14 + TWXDatabase.DatabaseName + ANSI_10 + ' w/ ' +
                      ANSI_14 + IntToStr(TWXDatabase.DBHeader.Sectors) + ANSI_10 + ' sectors and ' +
                      ANSI_14 + IntToStr(TWXDatabase.WarpCount) + ANSI_10 + ' warps' + endl);

    if (TWXLog.LogFileOpen) then
      Socket.SendText(ANSI_10 + 'You are logging to file: ' + ANSI_14 + TWXLog.LogFilename + endl);

    Socket.SendText(endl + ANSI_13 + 'There are currently ' + ANSI_11 + IntToStr(tcpServer.Socket.ActiveConnections) +
                           ANSI_13 + ' active telnet connections' + endl);

    if (TWXClient.Connected) then
      Socket.SendText(ANSI_13 + 'You are connected to server: ' + ANSI_11 + TWXDatabase.DBHeader.Address + endl + ANSI_7)
    else
      Socket.SendText(ANSI_11 + 'No' + ANSI_13 + ' server connections detected' + endl);

    if ((LocalClient) and (AcceptExternal)) or (RemoteAddress = '127.0.0.1')then
    begin
      FClientTypes[Index] := ctStandard;
      Socket.SendText(endl + ANSI_2 + 'Press ' + ANSI_14 + TWXExtractor.MenuKey + ANSI_2 + ' to activate terminal menu' + endl + endl);
    end
    else
    begin
      FClientTypes[Index] := ctMute;
      Socket.SendText(ANSI_12 + 'You are locked in view only mode' + ANSI_7 + endl + endl);
    end;

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

  // manual client message to all sockets except the one disconnecting
  if (FClientTypes[Index] <> ctRejected) then
    for I := 0 to tcpServer.Socket.ActiveConnections - 1 do
      if (tcpServer.Socket.Connections[I] <> Socket) then
        tcpServer.Socket.Connections[I].SendText( endl + ANSI_7 + 'Connection lost from: ' + ANSI_15 + Socket.RemoteAddress + ANSI_7 + endl);

  // remove client from list
  for I := Index to 254 do
  begin
    FClientTypes[I] := FClientTypes[I + 1];
    FClientEchoMarks[I] := FClientEchoMarks[I + 1];
  end;

  TWXInterpreter.ProgramEvent('Client disconnected', '', FALSE);

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

  // TODO Process ANSI response for cursor position, screen size, scroll region, etc...

  // Ignore ANSI/VT100 Status report
  if ContainsText(InString, #27 + '[0n') then
    InString := StringReplace(InString, #27 + '[0n', '', [rfReplaceAll, rfIgnoreCase]);


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
    Broadcast(FBufferOut[0], TRUE, FALSE, TRUE);
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
  if (tcpServer.Port <> Value) then
  begin
    tcpServer.Close;
    TWXDatabase.ListenPort := Value;
    try
      tcpServer.Port := TWXDatabase.ListenPort;
      //tcpServer.Active := TRUE;
    except
      MessageDlg('Unable to bind a listening socket on port ' + IntToStr(tcpServer.Port) + '.' + endl + 'You will need to change it before you can connect to TWX Proxy.', mtWarning, [mbOk], 0);
      tcpServer.Active := FALSE;
    end;
end;
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
      tcpServer.Port := TWXDatabase.ListenPort;
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

function TModServer.GetAllowLerkers: Boolean;
begin
  Result := FAllowLerkers;
end;

procedure TModServer.SetAllowLerkers(Value: Boolean);
begin
  FAllowLerkers := Value;
end;

function TModServer.GetAcceptExternal: Boolean;
begin
  Result := FAcceptExternal;
end;

procedure TModServer.SetAcceptExternal(Value: Boolean);
begin
  FAcceptExternal := Value;
end;

function TModServer.GetExternalAddress: String;
begin
  Result := FExternalAddress;
end;

procedure TModServer.SetExternalAddress(Value: String);
begin
  FExternalAddress := Value;
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
  FReconnectDelay := 15;
  FFirstConnect := TRUE;
  FReconnectTock := -1;
  FReconnectCount := 0;
  FBlockExtended := FALSE;

  tmrReconnect := TTimer.Create(Self);
  with (tmrReconnect) do
  begin
    Enabled := FALSE;
    Interval := 1000;
    OnTimer := tmrReconnectTimer;
  end;

  tmrIdle := TTimer.Create(Self);
  with (tmrIdle) do
  begin
    Enabled := FALSE;
    Interval := 60 * 1000;
    OnTimer := tmrIdleTimer;
  end;

end;

procedure TModClient.BeforeDestruction;
begin
  CloseClient();
  inherited;
end;

procedure TModClient.Send(Text : string);
var
  I: Integer;
  S: String;
begin
  if (Connected) and (Text <> '') then
  begin
    S := '';

    // MB - Strip extended characters and # from string, until TWGS version is detected.
    //      TWGS converts any extended character sent to the login prompt to '#', so
    //      this should help login when stray kepalive/sentinal scripts are running.
    if FBlockExtended then
    begin
      for I := 0 to Length(Text) do
        if ((Text[I] >= #32) and (Text[I] <= #128) and (Text[I] <> '#')) or (Text[I] = #8) or (Text[I] = #13) then
          S := S + Text[I];
    end
    else
    begin
      S := Text;
    end;

    FUnsentString := FUnsentString + S;
    try
      FBytesSent := tcpClient.Socket.SendText(FUnsentString);
    except
      OutputDebugString(PChar('Unexpected error in SendText'));
    end;
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
    if (Text <> #27) then
      IdleMinutes := 0;
  end;
end;

procedure TModClient.Connect();
begin
  // MB - Allow a faster reconnect if it is the first request after a disconnect.
  if FFirstConnect then
  begin
    FFirstConnect := FALSE;
    tmrReconnect.Enabled := TRUE;
    FReconnectTock := 1;
  end;

  // MB - This function only enables the reconnect timer, so that
  //      extra connect commands from Mombot will be ignored.
  if (not Connected) and (not FConnecting) and (FReconnectTock < 0) then
  begin
    tmrReconnect.Enabled := TRUE;
    FReconnectTock := 3;
  end;
end;

procedure TModClient.ConnectNow();
begin
  if (Connected or FConnecting) or (tcpClient <> nil) then
    CloseClient();

  // See if we're allowed to connect
  if not (TWXDatabase.DatabaseOpen) then
  begin
    TWXServer.ClientMessage('Please create a database before attempting to connect to a server.');
    FUserDisconnect := TRUE;
    Exit;
  end;

  FUserDisconnect := FALSE;
  FConnecting := TRUE;
  FBlockExtended := TRUE;

  // MB - Moved socket creation here, to ensure there are no unflushed buffers.
  tcpClient := TClientSocket.Create(Self);
  with (tcpClient) do
  begin
    OnConnect := tcpClientOnConnect;
    OnDisconnect := tcpClientOnDisconnect;
    OnRead := tcpClientOnRead;
    OnError := tcpClientOnError;
    OnWrite := tcpClientOnWrite;

    Port := TWXDatabase.DBHeader.ServerPort;
    Host := TWXDatabase.DBHeader.Address;
  end;

  FreconnectCount := FreconnectCount + 1;

  // Broadcast operation
  TWXServer.Broadcast(#13 + #27 + '[A' + #27 + '[K' + ANSI_13 + 'Attempting to connect to: ' +
                      ANSI_14 + tcpClient.Host + ANSI_13 + ':' + ANSI_14 + IntToStr(tcpClient.Port) +
                      ANSI_13 + ' (' + ANSI_12 + IntToStr(FreconnectCount) + ANSI_13 + ')' + ANSI_15 + endl + #27 + '[K');

  // MB - No need for an exception trap here. It will callback onError instead of throwing an exception.
  tcpClient.Open;
end;

procedure TModClient.Disconnect;
begin
  TWXExtractor.CurrentLine := '';
  TWXServer.ClientMessage(ANSI_12 + 'Disconnecting from server...');

  // Make sure it doesn't try to reconnect
  FUserDisconnect := TRUE;
  tmrReconnect.Enabled := FALSE;
  FReconnectTock := -1;
  FreconnectCount := 0;
  FConnecting := FALSE;

  // Deactivate client - disconnect from server
  CloseClient;
end;

procedure TModClient.CloseClient;
begin
  try
    if tcpClient <> nil then
    begin
      tcpClient.Close;
      tcpClient.Free;
      tcpClient := nil;
    end;
  except
    // MB - It is normal for this exception to be thrown if the client is already disconnected.
    TWXServer.ClientMessage('Unexpected error while closing connection.');
  end;
  Sleep(500);
end;

procedure TModClient.tcpClientOnConnect(Sender: TObject; ScktComp: TCustomWinSocket);
begin
  // MB - Clear the buffer to prevent ##### being sent to the login prompt
  FSendPending := FALSE;
  FUnsentString := '';

  // We are now connected
  TWXGUI.Connected := True;

  TWXExtractor.Reset;
  FConnecting := FALSE;

  try
    // Send Initial Handshake
    if TWXDatabase.DBHeader.UseRlogin then
      ScktComp.SendText(#0 + TWXDatabase.DBHeader.LoginName + #0 + #0 + #0)
    else
      ScktComp.SendText(#255 + OP_DO + #246);
  except
    OutputDebugString(PChar('Unexpected error sending telnet handshake'));
  end;

  // Broadcast event
  TWXServer.Broadcast( endl + ANSI_10 + 'Connection accepted. ' + ANSI_13 + '(' + ANSI_11 + DateTimeToStr(Now)+ ANSI_13 + ')' + endl);

  TWXInterpreter.ProgramEvent('Connection accepted', '', FALSE);
  TWXLog.WriteLog(endl + endl + '--------------------------------------------------------------------------------' +
                  endl + 'Connection accepted. (' + DateTimeToStr(Now) + ')' + endl);

  // Enable the idle timer.
  tmrIdle.Enabled := TRUE;
  IdleMinutes := 0;

  // manual event - trigger login script
  if (TWXDatabase.DBHeader.UseLogin) then
  begin
    TWXInterpreter.StopAll(FALSE);
    TWXInterpreter.Load(FetchScript(TWXGUI.ProgramDir + '\scripts\' + TWXDatabase.DBHeader.LoginScript, FALSE), TRUE);
  end;
end;

procedure TModClient.tcpClientOnDisconnect(Sender: TObject; ScktComp: TCustomWinSocket);
begin
  // No longer connected
  TWXGUI.Connected := False;
  FreconnectCount := 0;

  if FConnecting then
  begin
    if (Reconnect) and not (FUserDisconnect) then
    begin
      if FReconnectDelay < 3 then
        FReconnectDelay := 3;

      TWXServer.Broadcast( ANSI_12 +'Connect Canceled. ' + ANSI_10 + 'Reconnecting in ' + ANSI_11 + IntToStr(FReconnectdelay) + ANSI_10 + ' seconds...');
      tmrReconnect.Enabled := TRUE;
      FReconnectTock := FReconnectDelay;
    end
    else
    begin
      TWXServer.Broadcast( ANSI_12 + 'Connect Canceled.');
      TWXInterpreter.ProgramEvent('Connect Canceled.', '', FALSE);
      tmrReconnect.Enabled := FALSE;
      FReconnectTock := -1;
    end;
    FConnecting := FALSE;
    FFirstConnect := FALSE;
  end
  else
  begin
    // Reconnect if supposed to
    if (Reconnect) and not (FUserDisconnect) then
    begin
      TWXServer.Broadcast( endl + endl + ANSI_12 + 'Connection lost.' + ANSI_13 + '(' + ANSI_11 + DateTimeToStr(Now)+ ANSI_13 + ')' + endl);
      TWXServer.Broadcast( ANSI_10 + 'Reconnecting in ' + ANSI_11 + '3' + ANSI_10 + ' seconds...');
      tmrReconnect.Enabled := TRUE;
      FReconnectTock := 3;
    end
    else
    begin
      TWXServer.Broadcast( endl + endl + ANSI_12 + 'Connection lost. ' + ANSI_13 + '(' + ANSI_11 + DateTimeToStr(Now)+ ANSI_13 + ')' + endl + endl);
      FFirstConnect := TRUE;
    end;

    TWXInterpreter.ProgramEvent('Connection Lost', '', FALSE);
    TWXLog.WriteLog(endl + 'Connection lost. (' + DateTimeToStr(Now) + ')');
  end;
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

  if ErrorEvent = eeConnect then
  begin
    if (Reconnect) then
    begin
      if FReconnectDelay < 3 then
        FReconnectDelay := 3;

      TWXServer.Broadcast( ANSI_12 +'Failed to Connect. ' + ANSI_10 + 'Reconnecting in ' + ANSI_11 + IntToStr(FReconnectdelay) + ANSI_10 + ' seconds...');
      tmrReconnect.Enabled := TRUE;
      FReconnectTock := FReconnectDelay;
    end
    else
    begin
      TWXServer.Broadcast( ANSI_12 + 'Failed to Connect.');
      TWXInterpreter.ProgramEvent('Failed to Connect.', '', FALSE);
      tmrReconnect.Enabled := FALSE;
      FReconnectTock := -1;
    end;
    FConnecting := FALSE;
    FFirstConnect := FALSE;
    CloseClient();
  end
  else
  begin
    OutputDebugString(PChar('Unexpected Client Socket Error received. Error Code ') + ErrorCode);
  end;

  // Disable error message
  ErrorCode := 0;
end;

procedure TModClient.tmrIdleTimer(Sender: TObject);
begin
  IdleMinutes := IdleMinutes + 1;

  if (IdleMinutes > 1) then
  begin

    // MB - Timeout a connection that is stuck in Connecting State
    if (FConnecting = TRUE) then
      ConnectNow();

    // MB - ReEnable the log file.
    if TWXLog.LogEnabled and (not TWXLog.LogData) then
    begin
      TWXLog.LogData := TRUE;
      //TWXServer.ClientMessage(endl + 'Logging renabled. (' + DateTimeToStr(Now) + ')' + endl);
      TWXLog.WriteLog(endl + endl + 'Logging renabled. (' + DateTimeToStr(Now) + ')' + endl + endl);
    end;

    // MB - Reverse keepalive for remote clients.
    if TWXServer.AllowLerkers or TWXServer.AcceptExternal then
      TWXServer.Broadcast(#27 + '[5n');  // Send ANSI/VT100 terminal status request
  end;
end;

procedure TModClient.tmrReconnectTimer(Sender: TObject);
begin
  FReconnectTock := FReconnectTock - 1;
  if FReconnectTock <= 0 then
  begin
    tmrReconnect.Enabled := FALSE;
    FReconnectTock := -1;
    if not FUserDisconnect then
      ConnectNow();
  end;
end;

function TModClient.GetConnected : Boolean;
begin
  //Result := tcpClient.IsConnected;
  try
    if tcpClient = nil then
      Result := FALSE
    else
      Result := tcpClient.Active;
  except
    Result := False;
  end;
end;

function TModClient.GetReconnect: Boolean;
begin
  Result := FReconnect;
end;

procedure TModClient.SetReconnect(Value: Boolean);
begin
  FReconnect := Value;
end;

function TModClient.GetReconnectDelay: Integer;
begin
  Result := FReconnectDelay;
end;

procedure TModClient.SetReconnectDelay(Value: Integer);
begin
  If Value < 3 then
    FReconnectDelay := 3
  else
    FReconnectDelay := Value;
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
    try
      Socket.SendText(#255 + Char(Func) + Char(OpCode));
    except
      OutputDebugString(PChar('Unexpected error sending telnet response'));
    end;

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
