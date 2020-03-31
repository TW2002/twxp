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
unit Core;

// Used by all modules.

interface

uses
  SysUtils,
  Classes,
  Windows;

const
  ProgramVersion = '2.6.05';
  ReleaseNumber = 1;
  ReleaseVersion = 'Alpha';
  SetupFile = 'TWXS.dat';

  endl = #13 + #10;

type
  TTWXModule = class;
  THistoryType = (htFighter, htComputer, htMsg);
  TNotificationEvent = procedure(Param: Pointer) of object;

  // IPersistenceController: Implemented on an object able to manage the persistence
  // of other objects.
  IPersistenceController = interface
    ['{D0CE5334-5567-4CA2-B4FF-FF38D658F82B}']
    procedure RegisterModule(Module : TTWXModule);
    procedure UnregisterModule(Module : TTWXModule);
  end;

  // TTWXModule: Superclass for all TWX Proxy modules
  TTWXModule = class(TComponent)
  private
    PersistenceController : IPersistenceController;
  protected
    procedure WriteToStream(Stream: TStream; const Value: string);
    function ReadFromStream(Stream: TStream): string;
  public
    constructor Create(AOwner : TComponent; const APersistenceController : IPersistenceController = nil); reintroduce; virtual;
    destructor Destroy; override;

    procedure GetStateValues(Values : TStream); virtual;
    procedure SetStateValues(Values : TStream); virtual;

    procedure StateValuesLoaded; virtual;
  end;

  ITWXGlobals = interface
    ['{EA12D75A-A526-4571-A35F-108B2CBE0A6B}']
    function GetProgramDir: string;
    procedure SetProgramDir(const Value: string);

    property ProgramDir: string read GetProgramDir write SetProgramDir;
  end;

  IMessageListener = interface
    ['{70DEB088-4D82-4620-88B9-CA08ED82BD8C}']
    procedure AcceptMessage(Param: Pointer);
  end;


  // These interface were originally intended to provide abstraction between
  // the major program modules.  Unfortunately this abstraction was never
  // completed.  Many of them stand unused.

  IModDatabase = interface
    ['{8430ECA9-9754-44D6-87B9-B6A247E1A1E5}']
    function GetDatabaseName: string;
    procedure SetDatabaseName(const Value: string);
    function GetUseCache: Boolean;
    procedure SetUseCache(Value: Boolean);
    function GetRecording: Boolean;
    procedure SetRecording(Value: Boolean);

    property DatabaseName: string read GetDatabaseName write SetDatabaseName;
    property UseCache: Boolean read GetUseCache write SetUseCache;
    property Recording: Boolean read GetRecording write SetRecording;
  end;

  IModExtractor = interface
    ['{342885A8-F7A8-46EE-9913-7AE9C1DBBA7F}']
    function GetMenuKey: Char;
    procedure SetMenuKey(Value: Char);

    property MenuKey: Char read GetMenuKey write SetMenuKey;
  end;

  IModGUI = interface
    ['{5E9A2B77-382D-4179-808F-BFB509D4EF0A}']
    procedure ShowWarning(WarningText : string);

    procedure SetSelectedGame(const Value : string);
    function GetSelectedGame : string;
    procedure SetToProgramDir;

    property SelectedGame : string read GetSelectedGame write SetSelectedGame;
  end;

  IModServer = interface
    ['{03567FC6-F30E-4277-8946-012F613BF4E1}']
//    function GetListenPort: Word;
//    procedure SetListenPort(Value: Word);
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
//    procedure Activate; // EP - SetListenPort no longer activates the server

    property LocalEcho: Boolean read GetLocalEcho write SetLocalEcho;
    //property ListenPort: Word read GetListenPort write SetListenPort;
    property AllowLerkers: Boolean read GetAllowLerkers write SetAllowLerkers;
    property AcceptExternal: Boolean read GetAcceptExternal write SetAcceptExternal;
    property ExternalAddress: Boolean read GetAllowLerkers write SetAllowLerkers;
    property BroadCastMsgs: Boolean read GetBroadCastMsgs write SetBroadCastMsgs;
  end;

  IModClient = interface
    ['{4784805A-CF37-45E4-9E1C-D5D1BA98CA1E}']
    function GetReconnect: Boolean;
    procedure SetReconnect(Value: Boolean);

    property Reconnect: Boolean read GetReconnect write SetReconnect;
  end;

  IModMenu = interface
    ['{0F207F95-444D-4CF6-88C7-E2C49CD99FCD}']
  end;

  IModInterpreter = interface
    ['{C1F218BC-E9D9-4A90-8D35-69920A691044}']
  end;

  IModCompiler = interface
    ['{78B31BA0-AFC0-4FBD-85C5-C659BEF44720}']
  end;

  IModLog = interface
    ['{CE71BF11-293B-43DA-AFFA-00B8F11AD412}']
    function GetLogData: Boolean;
    procedure SetLogData(Value: Boolean);
    function GetLogANSI: Boolean;
    procedure SetLogANSI(Value: Boolean);

    property LogData: Boolean read GetLogData write SetLogData;
    property LogANSI: Boolean read GetLogANSI write SetLogANSI;
  end;

  IModAuth = interface
    ['{2824C5D5-B10A-4A45-BCE3-CAB6958AF453}']
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

    property Authenticate: Boolean read GetAuthenticate write SetAuthenticate;
    property UserName: string read GetUserName write SetUserName;
    property UserReg: string read GetUserReg write SetUserReg;
    property UseAuthProxy: Boolean read GetUseAuthProxy write SetUseAuthProxy;
    property ProxyAddress: string read GetProxyAddress write SetProxyAddress;
    property ProxyPort: Word read GetProxyPort write SetProxyPort;
  end;

  IModBubble = interface
    ['{097585F4-42B2-4241-B023-3AA914095C11}']
    function GetMaxBubbleSize: Integer;
    procedure SetMaxBubbleSize(Value: Integer);

    property MaxBubbleSize: Integer read GetMaxBubbleSize write SetMaxBubbleSize;
  end;


procedure PostNotification(Event: TNotificationEvent; Param: Pointer);

implementation

uses
  Messages,
  Forms,
  Persistence;


procedure PostNotification(Event: TNotificationEvent; Param: Pointer);
var
  PEvent: ^TNotificationEvent;
begin
  New(PEvent);
  CopyMemory(PEvent, @@Event, SizeOf(TNotificationEvent));
  PostMessage(Application.Handle, WM_USER, Integer(PEvent), Integer(Param));
end;

constructor TTWXModule.Create(AOwner : TComponent; const APersistenceController : IPersistenceController = nil);
begin
  inherited Create(AOwner);

  if (APersistenceController <> nil) then
  begin
    // register us with persistence controller
    PersistenceController := APersistenceController;
    PersistenceController.RegisterModule(Self);
  end;
end;

destructor TTWXModule.Destroy;
begin
  if (PersistenceController <> nil) then
  begin
    // unregister us with persistence controller
    PersistenceController.UnregisterModule(Self);
  end;

  inherited;
end;

procedure TTWXModule.WriteToStream(Stream: TStream; const Value: string);
var
  Len: Integer;
begin
  Len := Length(Value);

  Stream.Write(Len, 4);
  Stream.Write(PChar(Value)^, Len);
end;

function TTWXModule.ReadFromStream(Stream: TStream): string;
var
  Len: Integer;
  Buf: PChar;
begin
  Stream.Read(Len, 4);

  Buf := AllocMem(Len + 1);

  try
    Stream.Read(Buf^, Len);
    SetString(Result, Buf, Len);
  finally
    FreeMem(Buf);
  end;
end;

procedure TTWXModule.GetStateValues(Values : TStream);
begin
  Values.WriteComponent(Self);
end;

procedure TTWXModule.SetStateValues(Values : TStream);
begin
  Values.ReadComponent(Self);
end;

procedure TTWXModule.StateValuesLoaded;
begin
  // can be overridden in decending classes
end;

end.
