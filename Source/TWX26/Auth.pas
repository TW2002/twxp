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
unit Auth;

// Registration Key Authentication

interface

uses
  Observer,
  Core,
  SysUtils,
  Classes,
  ScktComp,
  Registry;

type
  TUpgradeResult = (urSuccess, urInvalid, urUsed, urFailed, urUnknown);
  TUpgradeDoneEvent = procedure(Result : TUpgradeResult; NewUser, NewKey : string) of object;
  TAuthOperation = (aoAuthenticate, aoKeyUpgrade);

  TModAuth = class(TTWXModule, IModAuth)
  private
    FUseBackup       : Boolean;
    FAuthKey         : Word;
    FSocket          : TClientSocket;
    FAuthLine,
    FUpgradeUser,
    FUpgradeKey,
    FAuthedUser,
    FAuthedKey,
    FUserName,
    FUserReg,
    FAuthMsg         : string;
    FChecksum        : Integer;
    FOnUpgradeDone   : TUpgradeDoneEvent;
    FOperation       : TAuthOperation;
    FAuthenticate    : Boolean;
    FUseAuthProxy    : Boolean;
    FProxyAddress    : string;
    FProxyPort       : Word;
    FSubject         : ISubject;

    procedure SetSocket;
    procedure OnFSocketError(Sender : TObject; Socket : TCustomWinSocket;
      ErrorEvent : TErrorEvent; var ErrorCode : Integer);
    procedure OnFSocketRead(Sender : TObject; Socket : TCustomWinSocket);
    procedure OnFSocketConnect(Sender : TObject; Socket : TCustomWinSocket);
//    procedure OnFSocketLookupFailure(Sender : TObject);

    procedure AuthFailure;
    procedure CalcChecksum;
    function Encode(Value : string; Key : Byte) : string;

  protected
    { IModAuth }
    function GetAuthenticate: Boolean;
    procedure SetAuthenticate(Value: Boolean);
    function GetUserName: string;
    procedure SetUserName(const Value: string);
    function GetUserReg: string;
    procedure SetUserReg(const Value: string);
    function GetUseAuthProxy: Boolean;
    procedure SetUseAuthProxy(Value: Boolean);
    function GetProxyAddress: string;
    procedure SetProxyAddress(const Value: string);
    function GetProxyPort: Word;
    procedure SetProxyPort(Value: Word);

  public
    procedure AfterConstruction; override;

    procedure DoAuthenticate;
    procedure UpgradeKey(OnUpgradeDone : TUpgradeDoneEvent; const UpgradeUser, UpgradeKey: string);

    property Key : Word read FAuthKey;
    property AuthMsg : string read FAuthMsg;
    property Subject: ISubject read FSubject;
    property AuthKey: Word read FAuthKey write FAuthKey;

  published
    property UserName: string read GetUserName write SetUserName;
    property UserReg: string read GetUserReg write SetUserReg;
    property UseAuthProxy: Boolean read GetUseAuthProxy write SetUseAuthProxy;
    property ProxyAddress: string read GetProxyAddress write SetProxyAddress;
    property ProxyPort: Word read GetProxyPort write SetProxyPort;
    property Authenticate: Boolean read GetAuthenticate write SetAuthenticate;
  end;

implementation

uses
  Global,
  Windows,
  ANSI,
  Forms,
  Utility;

procedure TModAuth.AfterConstruction;
begin
  inherited;

  FSubject := TSubject.Create(Self);
  SetSocket;

  CalcChecksum;

  // set defaults
  ProxyPort := 8080;
end;

procedure TModAuth.SetSocket;
begin
  FSocket := TClientSocket.Create(Self);

  with (FSocket) do
  begin
    OnError := OnFSocketError;
    OnRead := OnFSocketRead;
    OnConnect := OnFSocketConnect;
//    Socket.OnLookupFailure := OnFSocketLookupFailure;
  end;
end;

procedure TModAuth.DoAuthenticate;
begin
  if not Authenticate or (FSocket.Active) then
    Exit;

  if (UseAuthProxy) then
  begin
    if (IsIpAddress(ProxyAddress)) then
      FSocket.Address := ProxyAddress
    else
      FSocket.Host := ProxyAddress;

    FSocket.Port := ProxyPort;
  end
  else
  begin
    if (FUseBackup) then
    begin
      FSocket.Host := 'twxproxy.dnsalias.com'
    end
    else
      FSocket.Host := 'www.twxproxy.com';

    FSocket.Port := 80;
  end;

  FOperation := aoAuthenticate;

  // authenticate with web server
  try
    if (FUseBackup) then
      TWXServer.ClientMessage(ANSI_11 + 'AUTHENTICATION: ' + ANSI_15 +
        'Attempting to connect to backup authentication server.')
    else
      TWXServer.ClientMessage(ANSI_11 + 'AUTHENTICATION: ' + ANSI_15 +
        'Attempting to connect to authentication server.');

    FSocket.Open;
  except
    AuthFailure;
  end;
end;

procedure TModAuth.OnFSocketError(Sender : TObject; Socket : TCustomWinSocket;
  ErrorEvent : TErrorEvent; var ErrorCode : Integer);
begin
  Socket.Close;
  ErrorCode := 0;

  if (FOperation = aoAuthenticate) then
    AuthFailure
  else
    FOnUpgradeDone(urFailed, '', '');
end;

procedure TModAuth.OnFSocketRead(Sender : TObject; Socket : TCustomWinSocket);
  procedure ProcessAuthLine(Line : string);
  var
    AuthStr,
    S       : string;
    Z,
    B1,
    B2      : Byte;
    I,
    J       : Integer;
    KeySaved: Boolean;
  begin
    if (Length(Line) < 6) then
      Exit;

//    TWXServer.Broadcast(Line + endl);

    if (Copy(Line, 1, 5) = 'AUTH:') then
    begin
      // extract and decode authentication
      I := 1;
      S := Copy(Line, 6, Length(Line));
      AuthStr := '';
      KeySaved := False;

      while (I < Length(S)) do
      begin
        B1 := (Byte(S[I]) - 65);
        B2 := (Byte(S[I + 1]) - 65);

        // remove extra encryption
        B1 := B1 xor 6;
        B2 := B2 xor 11;

        // decrypt by user/key

        for J := 1 to Length(FUserName) do
        begin
          Z := Byte(FUserName[J]);
          B1 := B1 xor (Z xor (Z shr 4 shl 4));
        end;

        for J := 1 to Length(FUserReg) do
        begin
          Z := Byte(FUserReg[J]);
          B2 := B2 xor (Z xor (Z shr 4 shl 4));
        end;

        // merge and append
        AuthStr := AuthStr + Char((B1 shl 4) xor B2);

        Inc(I, 2);
      end;

      J := -1;
      for I := 1 to Length(AuthStr) do
        if (AuthStr[I] = '_') then
        begin
          J := I;
          Break;
        end;

      if (I < Length(AuthStr)) then
        // extract auth message
        FAuthMsg := Copy(AuthStr, I + 1, Length(AuthStr));

      if (J >= 2) then
      begin
        if (FOperation = aoAuthenticate) then
        begin
          // save script key
          FAuthKey := StrToInt(Copy(AuthStr, 1, J - 1));
          KeySaved := True;
        end
        else
          // extract new user ID and key from authentication string
          FOnUpgradeDone(urSuccess, Copy(AuthStr, 1, J - 1), Copy(AuthStr, J + 1, Length(AuthStr)));
      end
      else if (FOperation = aoKeyUpgrade) then
      begin
        // key upgrade failed, give reason

        if (AuthStr = 'USED') then
          FOnUpgradeDone(urUsed, '', '')
        else if (AuthStr = 'INVALID') then
          FOnUpgradeDone(urInvalid, '', '')
        else
          FOnUpgradeDone(urUnknown, '', '');
      end;

      // we can now disconnect from the HTTP server
      Socket.Close;

      FAuthedUser := FUserName;
      FAuthedKey := FUserReg;

      if KeySaved then
      begin
        TWXServer.ClientMessage(ANSI_11 + 'AUTHENTICATION: ' + ANSI_15 +
          'Connected to authentication server.');

        // issue notification that we've authenticated
        Subject.NotifyObservers(ntAuthenticationDone);
      end
      else
        TWXServer.ClientMessage(ANSI_11 + 'AUTHENTICATION: ' + ANSI_15 +
          'Authentication protocol failure, your user/key has not been entered correctly.');
    end;
  end;
var
  I : Integer;
begin
  // search for authentication details

  FAuthLine := FAuthLine + StringReplace(Socket.ReceiveText, #10, '', [rfReplaceAll]);
  I := 1;

  while (I <= Length(FAuthLine)) do
  begin
    if (FAuthLine[I] = #13) then
    begin
      ProcessAuthLine(Copy(FAuthLine, 1, I - 1));

      if (I = Length(FAuthLine)) then
        FAuthLine := ''
      else
        FAuthLine := Copy(FAuthLine, I + 1, Length(FAuthLine));

      I := 0;
    end;

    Inc(I);    
  end;
end;

procedure TModAuth.OnFSocketConnect(Sender : TObject; Socket : TCustomWinSocket);
var
  AuthOp  : Char;
  IDKey1,
  IDKey2,
  AuthKey : Byte;
  Reg     : TRegistry;
  RegPtr  : Pointer;
  User,
  Key,
  AuthSrv,
  RegVal  : string;
  I       : Integer;
begin
  if (FOperation = aoAuthenticate) then
  begin
    User := FUserName;
    Key := FUserReg;
    AuthKey := $1D;
    AuthOp := '0';
  end
  else // Upgrade
  begin
    User := FUpgradeUser;
    Key := FUpgradeKey;
    AuthKey := $72;
    AuthOp := '1';
  end;

  Reg := TRegistry.Create;
  Reg.RootKey := HKEY_LOCAL_MACHINE;
  IDKey1 := 30;
  IDKey2 := 20;

  if (Reg.OpenKey('\Hardware\Description\System', FALSE)) then
  begin
    RegPtr := AllocMem(1000);                  
    Reg.ReadBinaryData('SystemBiosVersion', RegPtr^, 1000);
    SetString(RegVal, PChar(RegPtr), StrLen(RegPtr));

    for I := 1 to Length(RegVal) do
      IDKey1 := IDKey1 xor Byte(RegVal[I]);

    Reg.ReadBinaryData('VideoBiosVersion', RegPtr^, 1000);
    SetString(RegVal, PChar(RegPtr), StrLen(RegPtr));
    FreeMem(RegPtr, 1000);

    for I := 1 to Length(RegVal) do
      IDKey2 := IDKey2 xor Byte(RegVal[I]);
  end;

  Reg.Free;

  if (FUseBackup) then
    AuthSrv := 'twxproxy.dnsalias.com'
  else
    AuthSrv := 'www.twxproxy.com';

  Socket.SendText(
    'GET /auth.php?a0=' + AuthOp + '&a1=' + Encode(IntToStr(FCheckSum) + '!' + ProgramVersion + '!' + User + '!' + IntToStr(IDKey1) + IntToStr(IDKey2) + '!' + Key, AuthKey) + ' HTTP/1.1' + endl +
    'Accept: */*' + endl +
    'Accept-Language: en-nz' + endl +
    'Accept-Encoding: gzip, deflate' + endl +
    'User-Agent: TWX Proxy' + endl +
    'Host: ' + AuthSrv + endl +
    'Cache-Control: no-cache' + endl +
    'Connection: Keep-Alive' + endl + endl
    );
end;

{
procedure TModAuth.OnFSocketLookupFailure(Sender : TObject);
begin
  FSocket.Free;
  SetSocket;

  AuthFailure;
end;
}

procedure TModAuth.AuthFailure;
begin
  if (FUseBackup) then
  begin
    // show authenication failure
    TWXServer.ClientMessage(ANSI_12 + 'AUTHENTICATION: ' + ANSI_15 +
      'Unable to connect to the authentication server.  Check your connection and try again.');

    FUseBackup := FALSE;
    FSubject.NotifyObservers(ntAuthenticationFailed);
  end
  else
  begin
    // try to connect to backup server
    TWXServer.ClientMessage(ANSI_12 + 'AUTHENTICATION: ' + ANSI_15 +
      'Unable to connect to the authentication server.');

    FUseBackup := TRUE;

    DoAuthenticate;
  end;
end;

procedure TModAuth.CalcChecksum;
var
  I,
  Cnt    : Integer;
  Handle : Int64;
  Err    : Cardinal;
begin
  FChecksum := 0;

  Handle := CreateFile(
    PChar(Application.ExeName),
    GENERIC_READ,
    FILE_SHARE_READ,
    nil,
    OPEN_EXISTING,
    FILE_ATTRIBUTE_ARCHIVE,
    0
    );

  if (Handle = INVALID_HANDLE_VALUE) then
    Halt; // can't check file = shut down immediately

  repeat
    I := 0;
    Cnt := FileRead(Handle, I, 4);

    FChecksum := FChecksum xor I;
  until (Cnt < 4);

  Err := GetLastError;

  if (Err <> ERROR_HANDLE_EOF) and (Err <> 0) then
    Halt; // error checking file = shut down immediately

  FileClose(Handle);
end;

function TModAuth.Encode(Value : string; Key : Byte) : string;
var
  I    : Integer;
  Last,
  A,
  B    : Byte;
begin
  Result := '';
  Last := Key;

  for I := 1 to Length(Value) do
  begin
    // split (bitwise) into two bytes
    A := (Byte(Value[I]) xor Last) shr 4;
    B := (Byte(Value[I]) xor Last) xor (A shl 4);

    // convert to uppercase alpha
    Result := Result + Char(65 + A) + Char(65 + B);
    Last := B;
  end;
end;

procedure TModAuth.UpgradeKey(OnUpgradeDone : TUpgradeDoneEvent; const UpgradeUser, UpgradeKey: string);
begin
  // begin key upgrade process
  FOnUpgradeDone := OnUpgradeDone;
  FOperation := aoKeyUpgrade;
  FUpgradeUser := UpgradeUser;
  FUpgradeKey := UpgradeKey;

  if (FSocket.Active) then
    FSocket.Close;

  if (UseAuthProxy) then
  begin
    if (IsIpAddress(ProxyAddress)) then
      FSocket.Address := ProxyAddress
    else
      FSocket.Host := ProxyAddress;

    FSocket.Port := ProxyPort;
  end
  else
  begin
    FSocket.Host := 'www.twxproxy.com';
    FSocket.Port := 80;
  end;

  // connect to web server
  try
    FSocket.Open;
  except
    FOnUpgradeDone(urFailed, '', '');
  end;
end;

function TModAuth.GetAuthenticate: Boolean;
begin
  Result := FAuthenticate;
end;

procedure TModAuth.SetAuthenticate(Value: Boolean);
begin
  if (FAuthenticate <> Value) then
  begin
    FAuthenticate := Value;

    if (FAuthenticate) then
      DoAuthenticate;
  end
  else if FAuthenticate and ((FUserName <> FAuthedUser) or (FUserReg <> FAuthedKey)) then
    // We count on FAuthenticate being set AFTER the user details, this way if the
    // user details change, the program will try to reauthenticate itself.
    DoAuthenticate;
end;

function TModAuth.GetUserName: string;
begin
  Result := FUserName;
end;

procedure TModAuth.SetUserName(const Value: string);
begin
  FUserName := Value;
end;

function TModAuth.GetUserReg: string;
begin
  Result := FUserReg;
end;

procedure TModAuth.SetUserReg(const Value: string);
begin
  FUserReg := Value;
end;

function TModAuth.GetUseAuthProxy: Boolean;
begin
  Result := FUseAuthProxy;
end;

procedure TModAuth.SetUseAuthProxy(Value: Boolean);
begin
  FUseAuthProxy := Value;
end;

function TModAuth.GetProxyAddress: string;
begin
  Result := FProxyAddress;
end;

procedure TModAuth.SetProxyAddress(const Value: string);
begin
  FProxyAddress := Value;
end;

function TModAuth.GetProxyPort: Word;
begin
  Result := FProxyPort;
end;

procedure TModAuth.SetProxyPort(Value: Word);
begin
  FProxyPort := Value;
end;

end.
