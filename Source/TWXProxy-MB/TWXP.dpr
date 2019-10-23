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
program TWXP;



{%TogetherDiagram 'ModelSupport_TWXP\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Global\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Process\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Bubble\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Core\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\ScriptCmd\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\TWXExport\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Script\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Utility\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\TWXProxy\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\FormHistory\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\DataBase\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\TCP\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\ScriptCmp\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\FormSetup\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Menu\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\FormScript\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\FormAbout\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\FormMain\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Ansi\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\GUI\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Observer\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Persistence\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\ScriptRef\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\Log\default.txaPackage'}
{%TogetherDiagram 'ModelSupport_TWXP\default.txvpck'}

uses
  Forms,
  Classes,
  Windows,
  SysUtils,
  Dialogs,
  FileCtrl,
  inifiles,
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
  Messages,
  Encryptor in 'Encryptor.pas';

//FormChangeIcon in 'FormChangeIcon.pas' {frmChangeIcon};

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
// MB - Moved to global, so that we can save object states in Setup Form
//  PersistenceManager: TPersistenceManager;
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

  TWXGlobalVars := TList.Create;

  MessageHandler := TMessageHandler.Create;
  Application.OnMessage := MessageHandler.OnApplicationMessage;

  // Create dirs if they aren't there
  if not (DirectoryExists(ProgramDir + '\data')) then
    CreateDir(ProgramDir + '\data');

  if not (DirectoryExists(ProgramDir + '\scripts')) then
    CreateDir(ProgramDir + '\scripts');

  if not (DirectoryExists(ProgramDir + '\logs')) then
    CreateDir(ProgramDir + '\logs');

  // TODO: Register .xdb with proxy. May require Win32 API call.
  // TODO: Set TWXProxy as the devault Telnet application in the registry.

  PersistenceManager := TPersistenceManager.Create(Application);
  PersistenceManager.OutputFile := 'TWXS.dat';

  // call object constructors
  for ModuleType := Low(TModuleType) to High(TModuleType) do
    ModuleFactory(ModuleType);

  PersistenceManager.LoadStateValues;
  TWXGUI.DatabaseName := '';

  // check command line values
  I := 1;
  while (I <= ParamCount) do
  begin
    Usage := 'Usage:/ntwxp [database] /p <port#> /dblist';
    Switch := UpperCase(ParamStr(I));
    //WriteLn(Switch + endl);

    // MB - Set Database name from first paramater
    //      for windows file association.
    if (Copy(Switch, 1, 1) <> '/') and (Length(Switch) > 0) then
    begin
      TWXGUI.DatabaseName := StripFileExtension(ShortFilename(Switch));
    end
    else if (Copy(Switch, 1, 2) = '/P') and (Length(Switch) > 2) then
    begin
      TWXDatabase.ListenPort := StrToIntSafe(Copy(Switch, 3, Length(Switch)));
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
        TWXDatabase.ListenPort := StrToIntSafe(ParamStr(I));
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
var
  ObjectName : String;
  I          : Integer;
begin
  try
    // MB - Save the current database name.
    TWXGUI.DatabaseName := StripFileExtension(ShortFilename(TWXDatabase.DatabaseName));

    // MB - Close database before saving module states to prevent unhandled exception
    TWXDatabase.CloseDatabase;

    PersistenceManager.SaveStateValues;
  except
    TWXServer.ClientMessage('Errror - Unable to save program state.');
  end;

  TWXServer.ClientMessage('TWXProxy is shutting down. Goodbye!');
  Sleep(500);

  // More hacks ... force a destruction order using global variables to prevent
  // AVs on exit (some modules have extra processing on shutdown)
  // Note that modules not freed here are owned by the application object anyway -
  // so they will be freed implicitly.
  try
    ObjectName := 'TWXInterpreter';
    TWXInterpreter.Free;
    ObjectName := 'TWXGUI';
    TWXGUI.Free;
    ObjectName := 'TWXClient';
    TWXClient.Free;
    ObjectName := 'TWXServer';
    TWXServer.Free;
    ObjectName := 'TWXLog';
    TWXLog.Free;
    ObjectName := 'TWXMenu';
    TWXMenu.Free;
    ObjectName := 'TWXDatabase';
    TWXDatabase.Free;
    ObjectName := 'TWXBubble';
    TWXBubble.Free;
    ObjectName := 'TWXExtractor';
    TWXExtractor.Free;

  except
    // MB - Trying to localize crash when closing.
    MessageDlg('Exception occured trying to free ' + ObjectName, mtError, [mbOK], 0);
  end;

  for I := 0 to TWXGlobalVars.Count - 1 do
    TGlobalVarItem(TWXGlobalVars[I]).Destroy;
  TWXGlobalVars.Free;

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

procedure CreateConfig();
var
   IniFile     : TIniFile;
   BotName,
   Script,
   Section     : String;
   SectionList : TStringList;
begin
  ProgramDir := GetCurrentDir;

  if not fileexists(ProgramDir + '\twxp.cfg') then
  begin
    IniFile := TIniFile.Create(ProgramDir + '\twxp.cfg');

    try
      IniFile.WriteString('TWX Proxy', 'Upgrade', '1939.1939.1939.1939.1939');

      IniFile.WriteString('Bot:Mom', 'Name', 'Mind Over Matter Bot');
      IniFile.WriteString('Bot:Mom', 'Script', 'Mombot\mombot.cts');
      IniFile.WriteString('Bot:1045', 'Name', 'Legacy Mombot 3.1045');
      IniFile.WriteString('Bot:1045', 'Script', 'Mombot3\__mom_bot3_1045.cts');
      IniFile.WriteString('Bot:1044', 'Name', 'Legacy Mombot 3.1044');
      IniFile.WriteString('Bot:1044', 'Script', 'Mombot3\__mom_bot3_1044.ts');
      IniFile.WriteString('Bot:Qu', 'Name', 'Quantum Qubot');
      IniFile.WriteString('Bot:Qu', 'Script', 'Quantum\Qubot.cts');
      IniFile.WriteString('Bot:Zed', 'Name', 'Zed Bot Unleashed');
      IniFile.WriteString('Bot:Zed', 'Script', 'z-authorise.cts,z-bot.cts');

      IniFile.WriteString('QuickLoad', '1_', 'Xide Pack1');
      IniFile.WriteString('QuickLoad', '2_', 'Xide Pack2');
      IniFile.WriteString('QuickLoad', 'Al_', 'Alexio');
      IniFile.WriteString('QuickLoad', 'end_', 'Ender');
      IniFile.WriteString('QuickLoad', 'ep_', 'ElderProphit');
      IniFile.WriteString('QuickLoad', 'ck_', 'Cherokee');
      IniFile.WriteString('QuickLoad', 'dny_', 'Dynarri');
      IniFile.WriteString('QuickLoad', 'Kaus_', 'Kaus');
      IniFile.WriteString('QuickLoad', 'ls_', 'Lonestar');
      IniFile.WriteString('QuickLoad', 'oz_', 'Ozz');
      IniFile.WriteString('QuickLoad', 'ph_', 'Parrothead');
      IniFile.WriteString('QuickLoad', 'pro_', 'Promethies');
      IniFile.WriteString('QuickLoad', 'ram_', 'Rammer');
      IniFile.WriteString('QuickLoad', 'rin_', 'Rincrast');
      IniFile.WriteString('QuickLoad', 'vid_', 'Vid Kid');
      IniFile.WriteString('QuickLoad', 'wild_', 'Wildstar');
      IniFile.WriteString('QuickLoad', 'z_', 'Zed / Archie');
    finally
      IniFile.Free;
    end;
  end;
end;

var
  S          : TSearchRec;
  fileDate   : Integer;
  dbFile     : string;
  HFileRes   : HFILE;
begin
//{$IFNDEF RELEASE}
//  MemChk;
//{$ENDIF}

  Application.Initialize;
  Application.Title := 'TWX Proxy';
  //Application.CreateForm(TfrmChangeIcon, FormChangeIcon);
  SetCurrentDir(ExtractFilePath(Application.ExeName));
  CreateConfig();
  InitProgram;

  if TWXGUI.DatabaseName <> '' then
    TWXDatabase.OpenDataBase( 'data\' + TWXGUI.DatabaseName + '.xdb')
  else
  begin
    dbFile := '';
    fileDate := 0;

    // MB - Load the last databse that isn't open
    if (FindFirst('data\*.xdb', faAnyfile, S) = 0) then
    begin
    repeat
      // MB - Check to see if the file is open
      HFileRes := CreateFile(PChar('data\' + S.Name),GENERIC_READ or GENERIC_WRITE,0,nil,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,0);
      if HFileRes <>  INVALID_HANDLE_VALUE then
      Begin
        // MB - set the file name if it is newer
        if FileAge('data\' + S.Name) > fileDate then
        Begin
          fileDate := FileAge('data\' + S.Name);
          dbFile := 'data\' + S.Name;
        End;
        CloseHandle(HFileRes);
      End;
    until (FindNext(S) <> 0);
    end;

    if dbFile <> '' then
      TWXDatabase.OpenDataBase(dbFile);
  end;

  if TWXDatabase.DataBaseOpen then
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
