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
program TWXProxy;

{%TogetherDiagram 'ModelSupport_TWXProxy\default.txaPackage'}

uses
  Forms,
  Classes,
  Windows,
  SysUtils,
  Dialogs,
  FileCtrl,
  FormMain in 'FormMain.pas' {frmMain},
  FormSetup in 'FormSetup.pas' {frmSetup},
  Process in 'Process.pas',
  Script in 'Script.pas',
  Menu in 'Menu.pas',
  Database in 'Database.pas',
  Utility in 'Utility.pas',
  FormHistory in 'FormHistory.pas' {frmHistory},
  Bubble in 'Bubble.pas',
  Log in 'Log.pas',
  ScriptCmd in 'ScriptCmd.pas',
  TWXExport in 'TWXExport.pas',
  ScriptCmp in 'ScriptCmp.pas',
  Ansi in 'Ansi.pas',
  ScriptRef in 'ScriptRef.pas',
  FormAbout in 'FormAbout.pas' {frmAbout},
  TCP in 'TCP.pas',
  FormScript in 'FormScript.pas',
  core in 'core.pas',
  Global in 'Global.pas',
  Persistence in 'Persistence.pas',
  GUI in 'GUI.pas',
  Observer in 'Observer.pas',
  Messages;

{$R *.RES}

type
  TModuleClass = class of TTWXModule;
  TModuleType = (mtDatabase, mtBubble, mtExtractor, mtMenu, mtServer, mtInterpreter, mtClient, mtLog, mtGUI);

  // TMessageHandler: This class exists only because the Application.OnMessage has
  // to be implmented as a property on an object.
  TMessageHandler = class(TObject)
  public
    procedure OnApplicationMessage(var Msg: TMsg; var Handled: Boolean);
  end;

const
  // ModuleClasses: Must line up with TModuleType for constructors to work properly
  ModuleClasses: array[TModuleType] of TModuleClass = (TModDatabase, TModBubble, TModExtractor, TModMenu, TModServer, TModInterpreter, TModClient, TModLog, TModGUI);

var
  PersistenceManager: TPersistenceManager;
  MessageHandler: TMessageHandler;
  ProgramDir: string;

function ModuleFactory(Module: TModuleType): TTWXModule;
var
  Globals: ITWXGlobals;
begin
  Result := ModuleClasses[Module].Create(Application, PersistenceManager);

  if (Result.GetInterface(ITWXGlobals, Globals)) then
  begin
    // set globals for this module
    Globals.ProgramDir := ProgramDir;
  end;

  // Not ideal.  This completely breaks the idea behind the factory method.  Having
  // all of these objects existing in a global scope destroys the modularity of
  // the application but is unfortunately necessary because of their current
  // interdependency.  The vision was to have each module abstracted through the
  // use of interfaces - I just never had time to pull this off.
  case Module of
    mtMenu: TWXMenu               := Result as TModMenu;
    mtDatabase: TWXDatabase       := Result as TModDatabase;
    mtLog: TWXLog                 := Result as TModLog;
    mtExtractor: TWXExtractor     := Result as TModExtractor;
    mtInterpreter: TWXInterpreter := Result as TModInterpreter;
    mtServer: TWXServer           := Result as TModServer;
    mtClient: TWXClient           := Result as TModClient;
    mtBubble: TWXBubble           := Result as TModBubble;
    mtGUI: TWXGUI                 := Result as TModGUI;
  end;
end;
{$HINTS OFF}
procedure InitProgram;
var
  I,
  Sectors   : Integer;
  DBName,
  Usage,
  Switch    : string;
  NewDB     : Boolean;
  ModuleType: TModuleType;
  S         : TSearchRec;
begin
  ReportMemoryLeaksOnShutdown := DebugHook <> 0;  // EP - Enables new mem-manager to report leaks if Debug=TRUE
  Randomize;
  ProgramDir := GetCurrentDir;

  MessageHandler := TMessageHandler.Create;
  Application.OnMessage := MessageHandler.OnApplicationMessage;

  // Create dirs if they aren't there
  if not (DirectoryExists(ProgramDir + '\data')) then
    CreateDir(ProgramDir + '\data');

  if not (DirectoryExists(ProgramDir + '\scripts')) then
    CreateDir(ProgramDir + '\scripts');

  if not (DirectoryExists(ProgramDir + '\logs')) then
    CreateDir(ProgramDir + '\logs');

  PersistenceManager := TPersistenceManager.Create(Application);
  PersistenceManager.OutputFile := 'TWXSetup.dat';

  // call object constructors
  for ModuleType := Low(TModuleType) to High(TModuleType) do
    ModuleFactory(ModuleType);

  PersistenceManager.LoadStateValues;

  // check command line values
  I := 1;
  while (I <= ParamCount) do   
  begin
    Usage := 'Usage:/ntwxproxy /p <port#> /dblist';
    Switch := UpperCase(ParamStr(I));
    //WriteLn(Switch + endl);

    if (Copy(Switch, 1, 2) = '/P') and (Length(Switch) > 2) then
    begin
      TWXServer.ListenPort := StrToIntSafe(Copy(Switch, 3, Length(Switch)));
    end

    // EP - New Switches
    // Single Parameters
    else if (Switch = '/DBLIST') then
    begin
      // List Database Files
      WriteLn('You specified /dblist' + endl);
      //Exit;
      SetCurrentDir(ProgramDir);
      if (FindFirst('data\*.xdb', faAnyFile, S) = 0) then
      begin
        repeat
          WriteLn(S.Name);
        until (FindNext(S) <> 0);
        FindClose(S);
      end;
      Exit;
    end

    // Multiple Parameters
    else if (ParamCount > I) then
    begin
      Inc(I);
      // Alternate syntax for listening port, e.g. "twxproxy /p 2002"
      if Switch = '/P' then
      begin
        TWXServer.ListenPort := StrToIntSafe(ParamStr(I));
      end
      else if Switch = '/DBCREATE' then // Create a new Database
      begin
        // Get Database Name
        DBName := ParamStr(I);
        NewDB := TRUE;
      end
      else if Switch = '/SECTORS' then
      begin
        try
          Sectors := StrToIntSafe(ParamStr(I));
          NewDB := TRUE;
        except
          TWXServer.Broadcast(Usage);
        end;
      end
      else if Switch = '/SCRIPT' then
      begin
        // Launch the specified script
      end;
    end; // End Multi-Parameters
  Inc(I);
  end; // End While (I <= ParamCount)
end;
{$HINTS ON}
procedure FinaliseProgram;
begin
  PersistenceManager.SaveStateValues;

  // More hacks ... force a destruction order using global variables to prevent
  // AVs on exit (some modules have extra processing on shutdown)
  // Note that modules not freed here are owned by the application object anyway -
  // so they will be freed implicitly.
  TWXInterpreter.Free;
  TWXGUI.Free;
  TWXClient.Free;
  TWXServer.Free;
  TWXLog.Free;
  TWXMenu.Free;
  TWXDatabase.Free;
  TWXBubble.Free;
  TWXExtractor.Free;

  MessageHandler.Free;
end;

procedure TMessageHandler.OnApplicationMessage(var Msg: TMsg; var Handled: Boolean);
var
  NotificationEvent: TNotificationEvent;
begin
  if (Msg.Message = WM_USER) and (Msg.wParam <> 47806) then
  begin
    if (Msg.wParam = 47806) then //47806 = $BABE, still unsure what the cause is
    begin
      Dispose(Pointer(Msg.wParam)); // There appears to be no side effects to dismissing it
    end
    else
    begin
      // Dispatch message to the object its meant for
      NotificationEvent := TNotificationEvent(Pointer(Msg.wParam)^);
      NotificationEvent(Pointer(Msg.lParam));
      Dispose(Pointer(Msg.wParam));
    end;

    Handled := True;
  end;
end;

begin
//{$IFNDEF RELEASE}
//  MemChk;
//{$ENDIF}

  Application.Initialize;
  Application.Title := 'TWX Proxy';
  SetCurrentDir(ExtractFilePath(Application.ExeName));
  InitProgram;
  // EP - The Server ListenPort is persisted by the database now, so load from there
  if TWXDatabase.DataBaseOpen then
    TWXServer.ListenPort := TWXDatabase.DBHeader.ServerPort
  else
    TWXServer.ListenPort := 23;

  TWXServer.Activate;

  try
    // we don't use the TApplication message loop, as it requires a main form
    repeat
      Application.HandleMessage
    until Application.Terminated;
  finally
    FinaliseProgram;
  end;
end.
