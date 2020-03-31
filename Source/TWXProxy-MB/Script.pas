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
// This unit controls scripts

unit
  Script;

{
***************** Notes:

Standard compiled command specification:
  ScriptID:Byte|LineNumber:Word|CmdID:Word|Params|0:Byte

  'Params' is a series of command parameters specified as:
  Type:Byte|Value

  'Type:Byte' can be one of the following:
    - PARAM_VAR : User variable prefix (see below)
    - PARAM_CONST : Compiler string constant prefix
    - PARAM_SYSCONST : Read only system value
    - PARAM_PROGVAR : Program variable
    - PARAM_CHAR : Character code

  'Value' can be one of the following:
    - A 16-bit listed system constant reference (from TModInterpreter.SysConsts[]) type PARAM_SYSCONST
    - A 32-bit listed variable/constant reference (from TScript.Params[]) type PARAM_CONCAT
    - A 32-bit global-listed program variable reference type PARAM_VAR/PARAM_CONST
    - An 8-bit character code type PARAM_CHAR

  If 'Type:Byte' is equal to PARAM_VAR or PARAM_SYSCONST, the full parameter is instead
  specified as:
  PARAM_VAR:Byte|Ref:Word/Integer|IndexCount:Byte

  The IndexCount is the number of values the variable or sysconst has been indexed by.  These
  values are specified using the above methods and can therefore be indexed in the
  same way.  Any variable not indexed must have an IndexCount of zero.

  I.e. compiled indexed variable:

  PARAM_VAR:Byte|VarRef:Integer|1:Byte|PARAM_CONST:Byte|ConstRef:Integer

}

interface

uses
  Core,
  SysUtils,
  Classes,
  ExtCtrls,
  Contnrs,
  Menus,
  Messages,
  Observer,
  ScriptCmp,
  ScriptRef,
  FormScript,
  inifiles;

type
  TScript = class;
  PTrigger = ^TTrigger;

  TDelayTimer = class(TTimer) // extended timer to hold its delaytrigger
  protected
    FDelayTrigger : PTrigger;
  public
    property DelayTrigger : PTrigger read FDelayTrigger write FDelayTrigger;
  end;

  TTrigger = record
    Name,
    Value,
    LabelName,
    Response,
    Param     : string;
    LifeCycle : Integer;
    Timer     : TDelayTimer;
  end;

  TTriggerType = (ttText, ttTextLine, ttTextOut, ttDelay, ttEvent, ttTextAuto);

  // TModInterpreter: Encapsulation for all script interpretation within the program.
  TModInterpreter = class(TTWXModule, ITWXGlobals)
  private
    ScriptList: TList;
    FScriptMenu: TMenuItem;
    FScriptRef: TScriptRef;
    FAutoRun: TStringList;
    FtmrTime: TTimer;
    FTimerEventCount: Integer;
    FLastScript,
    FActiveBot,
    FActiveBotScript,
    FProgramDir: string;

    function GetScript(Index : Integer) : TScript;
    function GetCount : Integer;
    function GetAutoRun: TStringList;
    function GetAutoRunText: string;
    procedure SetAutoRunText(Value: string);
    procedure OntmrTimeTimer(Sender: TObject);

  protected
    { ITWXGlobals }
    function GetProgramDir: string;
    procedure SetProgramDir(const Value: string);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;
    procedure StateValuesLoaded; override;

    procedure Load(Filename : string; Silent : Boolean);
    procedure Stop(Index : Integer);
    procedure StopByHandle(Script : TScript);
    procedure StopAll(StopSysScripts : Boolean);
    procedure SwitchBot(ScriptName : String; StopBotScripts : Boolean);
    procedure ProgramEvent(EventName, MatchText : string; Exclusive : Boolean);
    function TextOutEvent(Text : string; StartScript : TScript) : Boolean;
    procedure TextEvent(Text : string; ForceTrigger : Boolean);
    procedure TextLineEvent(Text : string; ForceTrigger : Boolean);
    procedure AutoTextEvent(Text : string; ForceTrigger : Boolean);
    function EventActive(EventName : string) : Boolean;
    procedure ActivateTriggers;
    procedure DumpVars(const SearchName : string);
    procedure DumpTriggers;
    procedure CountTimerEvent;
    procedure UnCountTimerEvent;

    property Count : Integer read GetCount;
    property LastScript : string read FLastScript;
    property ActiveBot : string read FActiveBot;
    property ActiveBotScript   : string read FActiveBotScript;
    property ScriptMenu : TMenuItem read FScriptMenu write FScriptMenu;
    property ScriptRef : TScriptRef read FScriptRef;
    property ProgramDir: string read GetProgramDir;

    property Scripts[Index : Integer] : TScript read GetScript; default;
    property AutoRun: TStringList read GetAutoRun;

  published
    property AutoRunText: string read GetAutoRunText write SetAutoRunText;
  end;

  // TScript: A physical script in memory.  Controlled by TModInterpreter - do not construct
  // from outside TModInterpreter class.
  TScript = class(TComponent, IObserver)
  private
    CodePos            : Pointer;
    WindowList,
    MenuItemList       : TList;
    FTriggers          : array[TTriggerType] of TList;
    FWaitingForAuth,
    FTriggersActive,
    FLocked,
    FWaitForActive,
    FSilent,
    FSystem            : Boolean;
    FWaitText,
    FOutText           : string;
    FCmp               : TScriptCmp;
    tscOwner           : TModInterpreter;
    FDecimalPrecision,
    ExecScriptID       : Integer;
    SubStack           : TStack;
    CmdParams          : array of TCmdParam;

    function ReadByte(var CodeRef : Pointer) : Byte;
    function ReadChar(var CodeRef : Pointer) : Char;
    function ReadWord(var CodeRef : Pointer) : Word;
    function ReadInteger(var CodeRef : Pointer) : Integer;
    function ReadIndexValues(var CodeRef : Pointer; IndexCount : Byte) : TStringArray;
    function SeekVariable(var CodeRef : Pointer) : TVarParam;
    function GetSysConstValue(var CodeRef : Pointer) : string;
    function ProcessCmd(Cmd : TScriptCmd; var CmdValues : Pointer) : TCmdAction;
    function TriggerExists(Name : string) : Boolean;
    function CheckTriggers(TriggerList : TList; const Text : string; TextOutTrigger, ForceTrigger : Boolean; var Handled : Boolean) : Boolean;
    function CreateTrigger(Name, LabelName, Value : string) : PTrigger;
    function GetProgramDir: string;
    function GetScriptName: string;
    procedure DelayTimerEvent(Sender : TObject);
    procedure FreeTrigger(Trigger : PTrigger);
    procedure NotifyTerminate(Param: Pointer);
    procedure SelfTerminate;

  protected
    { IObserver }
    procedure Notify(NoteType: TNotificationType);
  public
    constructor Create(Owner : TModInterpreter); reintroduce;
    destructor Destroy; override;

    procedure GetFromFile(const Filename : string; Compile : Boolean);

    function Execute : Boolean; // return true if script was terminated
    procedure DumpVars(SearchName : string);
    procedure DumpTriggers;
    procedure AddMenu(MenuItem : TObject);
    procedure GotoLabel(L : string);
    function TextLineEvent(const Text : string; ForceTrigger : Boolean) : Boolean;
    function AutoTextEvent(const Text : string; ForceTrigger : Boolean) : Boolean;
    function TextEvent(const Text : string; ForceTrigger : Boolean) : Boolean;
    function TextOutEvent(const Text : string; var Handled : Boolean) : Boolean;
    function ProgramEvent(EventName, MatchText : string; Exclusive : Boolean) : Boolean;
    function EventActive(EventName : string) : Boolean;
    procedure SetAutoTrigger(Name, Value, Response : String; LifeCycle : Integer);
    procedure SetTextLineTrigger(Name, LabelName, Value : string);
    procedure SetTextOutTrigger(Name, LabelName, Value : string);
    procedure SetTextTrigger(Name, LabelName, Value : string);
    procedure SetEventTrigger(Name, LabelName, Value, Param : string);
    procedure SetDelayTrigger(Name, LabelName : string; Value : Integer);
    procedure KillTrigger(Name : string);
    procedure KillAllTriggers;
    procedure InputCompleted(InputText : string; VarParam : TVarParam);
    procedure SetVariable(VarName, Value, Index : string);
    procedure Gosub(LabelName : string);
    procedure Return;
    procedure AddWindow(Window : TScriptWindow);
    procedure RemoveWindow(Window : TScriptWindow);
    function FindWindow(WindowName : string) : TScriptWindow;

    property System : Boolean read FSystem write FSystem;
    property TriggersActive : Boolean read FTriggersActive write FTriggersActive;
    property Locked : Boolean read FLocked write FLocked;
    property WaitForActive : Boolean read FWaitForActive write FWaitForActive;
    property WaitText : string read FWaitText write FWaitText;
    property OutText : string read FOutText;
    property Silent : Boolean read FSilent write FSilent;
    property Controller : TModInterpreter read tscOwner;
    property ExecScript : Integer read ExecScriptID;
    property Cmp : TScriptCmp read FCmp;
    property DecimalPrecision : Integer read FDecimalPrecision write FDecimalPrecision;
    property ProgramDir: string read GetProgramDir;
    property ScriptName: string read GetScriptName;
  end;

implementation

uses
  Global,
  Utility,
  Menu,
  Forms,
  Windows,
  Ansi;

const
  TriggerNameMap: array[TTriggerType] of string = ('Text', 'Text-Line', 'Text-Out', 'Delay', 'Event', 'Text-Auto');

//var
  // CmdParams : array of TCmdParam; // EP - Persists to avoid constant SetLength calls, dramatically improving script execution
  // Bah, can't do it here, as it breaks when LOAD is called, since it's global.


// ***************************************************************
// TModInterpreter implementation


procedure TModInterpreter.AfterConstruction;
begin
  inherited;

  ScriptList := TList.Create;
  FLastScript := '';
  FScriptRef := TScriptRef.Create;
  FtmrTime := TTimer.Create(Self);

  with FtmrTime do
  begin
    Enabled := False;
    Interval := 1000;
    OnTimer := OntmrTimeTimer;
  end;
end;

procedure TModInterpreter.BeforeDestruction;
begin
  // free up scripts
  StopAll(TRUE);
  ScriptList.Free;
  FScriptRef.Free;
  FAutoRun.Free;

  inherited;
end;

procedure TModInterpreter.StateValuesLoaded;
var
  I: Integer;
begin
  // this is called when all modules have been fully initialised

  // load up our auto run scripts
  for I := 0 to AutoRun.Count - 1 do
    Load(AutoRun[I], False);
end;

function TModInterpreter.GetProgramDir: string;
begin
  Result := FProgramDir;
end;

procedure TModInterpreter.SetProgramDir(const Value: string);
begin
  FProgramDir := Value;
end;

procedure TModInterpreter.OntmrTimeTimer(Sender: TObject);
begin
  ProgramEvent('Time hit', TimeToStr(Now), True);
end;

procedure TModInterpreter.CountTimerEvent;
begin
  Inc(FTimerEventCount);
  FtmrTime.Enabled := True;
end;

procedure TModInterpreter.UnCountTimerEvent;
begin
  Dec(FTimerEventCount);

  Assert((FTimerEventCount >= 0), 'Timer uncount without count');

  if (FTimerEventCount <= 0) then
    FtmrTime.Enabled := False;
end;

procedure TModInterpreter.Load(Filename : string; Silent : Boolean);
var
  Script : TScript;
  Error  : Boolean;
  I      : Integer;
begin
  // MB - Cleanup extra backslashes
  Filename := StringReplace(Filename, '\\', '\', [rfReplaceAll]);

  // MB - Stop script if it is already running
  I := 0;
  while (I < TWXInterpreter.Count) do
    if (TWXInterpreter.Scripts[I].Cmp.ScriptFile = Filename) then
      TWXInterpreter.Stop(I)
    else
      Inc(I);


  if (TWXInterpreter.Count > 0) then
    for I := 0 to TWXInterpreter.Count - 1 do
      if (TWXInterpreter.Scripts[I].Cmp.ScriptFile = Filename) then
        TWXInterpreter.Stop(I);

  SetCurrentDir(FProgramDir);
  Script := TScript.Create(Self);
  Script.Silent := Silent;
  ScriptList.Add(Script);

  FLastScript := Filename;
  Error := TRUE;

  // MB - Allow reconnect after manual disconnect when launching a script
  TWXClient.UserDisconnect := FALSE;

  if (Copy(UpperCase(Filename), Length(Filename) - 3, 4) = '.CTS') then
  begin
    if not (Silent) then
      TWXServer.ClientMessage('Loading script: ' + ANSI_7 + Filename);

    try
      Script.GetFromFile(Filename, FALSE);
      Error := FALSE;
    except
      on E : Exception do
      begin
        TWXServer.Broadcast(endl + ANSI_15 + 'Script load error: ' + ANSI_7 + E.Message + endl + endl);
        Stop(Count - 1);
      end;
    end;
  end
  else
  begin
    if not (Silent) then
      TWXServer.ClientMessage('Loading and compiling script: ' + ANSI_7 + Filename);

    FLastScript := Filename;

    try
      Script.GetFromFile(Filename, TRUE);
      Error := FALSE;
    except
      on E : Exception do
      begin
        TWXServer.Broadcast(endl + ANSI_15 + 'Script compilation error: ' + ANSI_7 + E.Message + endl + endl);
        Stop(Count - 1);
      end
    end;
  end;

  if not (Error) then
  begin
    ProgramEvent('SCRIPT LOADED', Filename, TRUE);
    TWXServer.NotifyScriptLoad;

    // add menu option for script
    TWXGUI.AddScriptMenu(Script);

    Script.Execute;
  end;
end;

procedure TModInterpreter.Stop(Index : Integer);
var
  ScriptName : string;
  Script: TScript;
begin
  // broadcast termination message
  if not (Scripts[Index].Silent) then
    TWXServer.Broadcast(endl + ANSI_15 + 'Script terminated: ' + ANSI_7 + Scripts[Index].Cmp.ScriptFile + endl + endl);

  Script := Scripts[Index];
  ScriptName := Script.Cmp.ScriptFile;

  // remove stop menu option from interface
  TWXGUI.RemoveScriptMenu(Script);

  // free the script
  Script.Free;

  // remove script from list
  ScriptList.Delete(Index);

  // trigger program event
  ProgramEvent('SCRIPT STOPPED', ScriptName, TRUE);

  TWXServer.NotifyScriptStop;
end;

procedure TModInterpreter.StopByHandle(Script : TScript);
begin
  Stop(ScriptList.IndexOf(Script));
end;

procedure TModInterpreter.StopAll(StopSysScripts : Boolean);
var
  I : Integer;
begin
  // terminate all scripts
  I := 0;

  while (I < ScriptList.Count) do
  begin
    if (StopSysScripts) or not (TScript(ScriptList.Items[I]).System)
    then
      Stop(I)
    else
      Inc(I);
  end;
end;

procedure TModInterpreter.SwitchBot(ScriptName : String; StopBotScripts : Boolean);
var
   I : Integer;
   IniFile     : TIniFile;
   Script,
   BotScript,
   Section     : String;
   SectionList,
   ScriptList  : TStringList;
begin
  IniFile := TIniFile.Create(TWXGUI.ProgramDir + '\twxp.cfg');
  ScriptList := TStringList.Create;

  if (ScriptName <> '') then
  begin
    // Kill all running scripts, including system scripts
    // Use StopBotScripts = False from switchbot command to
    // preent killing the active bot and throwing exceptions
    try
      I := 0;
      while (I < TWXInterpreter.Count) do
       if (Pos('authorise', LowerCase(Scripts[I].ScriptName)) = 0) and
         ((Pos('bot', LowerCase(Scripts[I].ScriptName)) = 0) or
         (StopBotScripts = True))
      then
        TWXInterpreter.Stop(I)
      else
        Inc(I);

    finally

    end;

    // Load the selected bot files(S)
    try
     ExtractStrings([','], [], PChar(ScriptName), ScriptList);
     for script in ScriptList do
     begin
       if (pos('scripts\', LowerCase(script)) > 0) then
         Load(script, FALSE)
       else
         Load('scripts\' + script, FALSE);
     end;
      FActiveBotScript := ScriptName;

      // MB - Get the activescript name from the ini file.
      begin
      try
        SectionList := TStringList.Create;
       try
          IniFile.ReadSections(SectionList);
          for Section in SectionList do
          begin
            BotScript  := IniFile.ReadString(Section, 'Script', '');
            if (Pos(LowerCase(ScriptName), LowerCase(BotScript)) = 1) then
            begin
              FActiveBot := IniFile.ReadString(Section, 'Name', '');
            end;
          end;
        finally
          SectionList.Free;
        end;
      finally
      IniFile.Free;
      end;
    end

    finally
      ScriptList.free();
    end;
  end;
end;

procedure TModInterpreter.ProgramEvent(EventName, MatchText : string; Exclusive : Boolean);
var
  I : Integer;
begin
  // trigger all matching program events in active scripts

  EventName := UpperCase(EventName);
  I := 0;

  while (I < ScriptList.Count) do
    if not (Scripts[I].ProgramEvent(EventName, MatchText, Exclusive)) then
      Inc(I);
end;

function TModInterpreter.TextOutEvent(Text : string; StartScript : TScript) : Boolean;
var
  I       : Integer;
  Handled : Boolean;
begin
  // trigger matching text out triggers in active scripts

  I := 0;

  // find starting script
  if (StartScript <> nil) then
    while (I < ScriptList.Count) do
    begin
      if (Scripts[I] = StartScript) then
      begin
        Inc(I);
        Break;
      end;

      Inc(I);
    end;

  Result := FALSE;

  // loop through scripts and trigger off any text out triggers
  while (I < ScriptList.Count) do
  begin
    if not (Scripts[I].TextOutEvent(Text, Handled)) then
      Inc(I);

    if (Handled) then
    begin
      Result := TRUE;
      Break;
    end;
  end;
end;

procedure TModInterpreter.TextEvent(Text : string; ForceTrigger : Boolean);
var
  I : Integer;
begin
  // trigger matching text triggers in active scripts
  I := 0;

  while (I < ScriptList.Count) do
    if not (Scripts[I].TextEvent(Text, ForceTrigger)) then
      Inc(I);
end;

procedure TModInterpreter.TextLineEvent(Text : string; ForceTrigger : Boolean);
var
  I : Integer;
begin
  // trigger matching textline triggers in active scripts
  I := 0;

  while (I < ScriptList.Count) do
    if not (Scripts[I].TextLineEvent(Text, ForceTrigger)) then
      Inc(I);
end;

procedure TModInterpreter.AutoTextEvent(Text : string; ForceTrigger : Boolean);
var
  I : Integer;
begin
  // trigger matching textline triggers in active scripts
  I := 0;

  while (I < ScriptList.Count) do
    if not (Scripts[I].AutoTextEvent(Text, ForceTrigger)) then
      Inc(I);
end;

function TModInterpreter.EventActive(EventName : string) : Boolean;
var
  I : Integer;
begin
  // check if any scripts hold matching event triggers
  Result := FALSE;
  I := 0;

  while (I < ScriptList.Count) do
    if (Scripts[I].EventActive(EventName)) then
    begin
      Result := TRUE;
      Break;
    end
    else
      Inc(I);
end;

function TModInterpreter.GetScript(Index : Integer) : TScript;
begin
  // retrieve a script from the scriptlist
  Result := ScriptList.Items[Index];
end;

function TModInterpreter.GetCount : Integer;
begin
  // retrieve the script count
  Result := ScriptList.Count;
end;

procedure TModInterpreter.ActivateTriggers;
var
  I : Integer;
begin
  // all text related triggers are deactivated for the rest of the line after they activate.
  // this is to prevent double triggering.
  // turn them back on.

  if (Count > 0) then
    for I := 0 to Count - 1 do
      Scripts[I].TriggersActive := TRUE;
end;

procedure TModInterpreter.DumpVars(const SearchName : string);
var
  I : Integer;
begin
  if (SearchName = '') then
    TWXServer.ClientMessage('Dumping all script variables')
  else
    TWXServer.ClientMessage('Dumping all script variables containing ''' + SearchName + '''');

  // dump variables in all scripts
  if (Count > 0) then
    for I := 0 to Count - 1 do
      Scripts[I].DumpVars(SearchName);

  TWXServer.ClientMessage('Variable Dump Complete.');
end;

procedure TModInterpreter.DumpTriggers;
var
  I : Integer;
begin
  // dump triggers in all scripts
  if (Count > 0) then
    for I := 0 to Count - 1 do
      Scripts[I].DumpTriggers;
end;

function TModInterpreter.GetAutoRun: TStringList;
begin
  if not Assigned(FAutoRun) then
    FAutoRun := TStringList.Create;

  Result := FAutoRun;
end;

function TModInterpreter.GetAutoRunText: string;
begin
  Result := AutoRun.Text;
end;

procedure TModInterpreter.SetAutoRunText(Value: string);
begin
  AutoRun.Text := Value;
end;

// ***************************************************************
// TScript implementation


constructor TScript.Create(Owner : TModInterpreter);
var
  TriggerType: TTriggerType;
begin
  inherited Create(Owner);

  tscOwner := Owner;
  FCmp := TScriptCmp.Create(tscOwner.ScriptRef);
  FWaitForActive := FALSE;
  SubStack := TStack.Create;
  SetLength(CmdParams, 20); // EP - Make CmdParams array for each script loaded
  WindowList := TList.Create;
  MenuItemList := TList.Create;

  for TriggerType := Low(TTriggerType) to High(TTriggerType) do
    FTriggers[TriggerType] := TList.Create;
end;

destructor TScript.Destroy;
var
  TriggerType: TTriggerType;
begin
  // free up menu items
  while (MenuItemList.Count > 0) do
  begin
    if (MenuItemList[0] = TWXMenu.CurrentMenu) then
      TWXMenu.CloseMenu(FALSE);

    TTWXMenuItem(MenuItemList[0]).Free;
    MenuItemList.Delete(0);
  end;

  MenuItemList.Free;

  // free up script windows
  while (WindowList.Count > 0) do
  begin
    TScriptWindow(WindowList[0]).Free;
    WindowList.Delete(0);
  end;

  WindowList.Free;

  // free up trigger lists
  for TriggerType := Low(TTriggerType) to High(TTriggerType) do
  begin
    while (FTriggers[TriggerType].Count > 0) do
    begin
      FreeTrigger(FTriggers[TriggerType][0]);
      FTriggers[TriggerType].Delete(0);
    end;

    FTriggers[TriggerType].Free;
  end;

  // free up sub stack
  while (Substack.Count > 0) do
    SubStack.Pop;

  SubStack.Free;

  if (TWXMenu.CurrentMenu <> nil) then
    if ((TWXMenu.CurrentMenu.Name = 'TWX_SCRIPTTEXT') or (TWXMenu.CurrentMenu.Name = 'TWX_SCRIPTKEY')) and (TWXMenu.InputScript = Self) then
      TWXMenu.CloseMenu(FALSE);

  FCmp.Free;

  SetLength(CmdParams, 0); // EP - Clear CmdParams array

  inherited Destroy;
end;

procedure TScript.Notify(NoteType: TNotificationType);
begin
  if (FWaitingForAuth) then
    case NoteType of
      ntAuthenticationDone  : begin
                                FWaitingForAuth := False;
                                Execute;
                              end;
      ntAuthenticationFailed: begin
                                // Looks like we won't be authenticated - self terminate.
                                FWaitingForAuth := False;
                                SelfTerminate;
                              end;
    end;
end;

procedure TScript.NotifyTerminate(Param: Pointer);
begin
  Controller.StopByHandle(Self);
end;

procedure TScript.SelfTerminate;
begin
  // Send a notification message to self to start termination
  // Somehow, it seems that sometimes this notification isn't handled before TWX terminates
  PostNotification(NotifyTerminate, nil);
end;

function TScript.GetProgramDir: string;
begin
  Result := Controller.ProgramDir;
end;

function TScript.GetScriptName: string;
begin
  Result := ShortFilename(Cmp.ScriptFile);
end;

procedure TScript.GetFromFile(const Filename : string; Compile : Boolean);
begin
  if (Compile) then
    FCmp.CompileFromFile(Filename, '')
  else
    FCmp.LoadFromFile(Filename);

  CodePos := FCmp.Code; // always start at beginning of script
end;

procedure TScript.FreeTrigger(Trigger : PTrigger);
begin
  Trigger^.Name := '';
  Trigger^.Value := '';
  Trigger^.Param := '';
  Trigger^.LabelName := '';
  Trigger^.Response := '';

  if (Trigger^.Timer <> nil) then
    Trigger^.Timer.Free;

  FreeMem(Trigger);
end;

function TScript.CheckTriggers(TriggerList : TList; const Text : string; TextOutTrigger, ForceTrigger : Boolean; var Handled : Boolean) : Boolean;
var
  LifeCycle,
  I         : Integer;
  LabelName,
  Response  : string;
begin
  // check through textLineTriggers for matches with Text
  Result := FALSE;
  Handled := FALSE;

  if (not (TextOutTrigger) and not (ForceTrigger) and not ((FTriggersActive)) or (FLocked)) then
    Exit; // triggers are not enabled or locked in stasis (waiting on menu?)

  I := 0;

  while (I < TriggerList.Count) do
  begin

    if (Pos(TTrigger(TriggerList[I]^).Value, Text) > 0) or (TTrigger(TriggerList[I]^).Value = '') then
    begin
    if (TTrigger(TriggerList[I]^).Name = '09') then
Response  := TTrigger(TriggerList[I]^).Response;


      // mb - save triger values
      LifeCycle := TTrigger(TriggerList[I]^).LifeCycle;
      LabelName := TTrigger(TriggerList[I]^).LabelName;
      Response  := TTrigger(TriggerList[I]^).Response;

      // mb - new lifecycle option, currently only on AutoTrigger
      if LifeCycle > 0 then
      begin
        TTrigger(TriggerList[I]^).LifeCycle := LifeCycle - 1;
        if TTrigger(TriggerList[I]^).LifeCycle = 0 then
        begin
          Handled := TRUE;

          // remove this trigger
          FreeTrigger(TriggerList[I]);
          TriggerList.Delete(I);
        end;

      end;


      if Length(Response) > 0 then
      begin
        // mb - handle new autotrigger type
        Sleep(250);
        TWXClient.Send(Response);
        exit;
        //Result := TRUE;
      end
      else
      begin
        // remove this trigger and enact it
        //Handled := TRUE;
        //LabelName := TTrigger(TriggerList[I]^).LabelName;

        //FreeTrigger(TriggerList[I]);
        //TriggerList.Delete(I);

        try
          GotoLabel(LabelName);
        except
          // script is not in execution - so we need to do error handling for gotos outside execute loop
          on E : EScriptError do
          begin
            TWXServer.Broadcast(ANSI_15 + 'Script run-time error (trigger activation): ' + ANSI_7 + E.Message + endl);
            SelfTerminate;
            Result := TRUE;
          end;
        else
          TWXServer.Broadcast(ANSI_15 + 'Unknown script run-time error (trigger activation)' + ANSI_7 + endl);
          SelfTerminate;
          Result := TRUE;
        end;
      end;

      if not (Result) then
      begin
        FTriggersActive := FALSE;

        if (Execute) then
          // script was self-terminated
          Result := TRUE;
      end;

      if (Result) then
        Exit;

      Break;
    end
    else
      Inc(I);
  end;
end;

function TScript.TriggerExists(Name : string) : Boolean;
var
  I: Integer;
  TriggerList: TList;
  TriggerType: TTriggerType;
begin
  // check through all trigger lists to see if this trigger name is in use

  Result := False;

  for TriggerType := Low(TTriggerType) to High(TTriggerType) do
  begin
    TriggerList := FTriggers[TriggerType];

    if (TriggerList.Count > 0) then
      for I := 0 to TriggerList.Count - 1 do
        if (TTrigger(TriggerList[I]^).Name = Name) then
        begin
          Result := True;
          Break;
        end;

    if Result then
      Break;
  end;
end;

function TScript.TextOutEvent(const Text : string; var Handled : Boolean) : Boolean;
begin
  FOutText := Text;

  // check through textOut triggers for matches with text
  Result := CheckTriggers(FTriggers[ttTextOut], Text, TRUE, FALSE, Handled);
end;

function TScript.TextLineEvent(const Text : string; ForceTrigger : Boolean) : Boolean;
var
  Handled : Boolean;
begin
  // check through lineTriggers for matches with Text
  Result := CheckTriggers(FTriggers[ttTextLine], Text, FALSE, ForceTrigger, Handled);
end;

function TScript.AutoTextEvent(const Text : string; ForceTrigger : Boolean) : Boolean;
var
  Handled : Boolean;
begin
  // check through autoTriggers for matches with Text
  Result := CheckTriggers(FTriggers[ttTextAuto], Text, FALSE, ForceTrigger, Handled);
end;

function TScript.TextEvent(const Text : string; ForceTrigger : Boolean) : Boolean;
var
  Handled : Boolean;
begin
  // check waitfor
  if (FWaitForActive) then
    if (Pos(FWaitText, Text) > 0) then
    begin
      FTriggersActive := FALSE;
      FWaitForActive := FALSE;
      Result := Execute;

      Exit;
    end;

  // check through textTriggers for matches with Text
  Result := CheckTriggers(FTriggers[ttText], Text, FALSE, ForceTrigger, Handled);
end;

function TScript.ProgramEvent(EventName, MatchText : string; Exclusive : Boolean) : Boolean;
var
  I         : Integer;
  LabelName : string;
  E         : TTrigger;
begin
  // check through EventTriggers for matches with Text
  Result := FALSE;

  I := 0;

  while (I < FTriggers[ttEvent].Count) do
  begin
    E := TTrigger(FTriggers[ttEvent][I]^);

    if (E.Value = EventName) and ((((not Exclusive) and (Pos(E.Param, MatchText) > 0)) or ((Exclusive) and (E.Param = MatchText))) or (MatchText = '') or (E.Param = '')) then
    begin
      // remove this trigger and enact it
      LabelName := E.LabelName;
      FreeTrigger(FTriggers[ttEvent][I]);
      FTriggers[ttEvent].Delete(I);

      try
        GotoLabel(LabelName);
      except
        // script is not in execution - so we need to do error handling for gotos outside execute loop
        on E : EScriptError do
        begin
          TWXServer.Broadcast(ANSI_15 + 'Script run-time error (trigger activation): ' + ANSI_7 + E.Message + endl);
          SelfTerminate;
          Result := TRUE;
        end;
      else
        TWXServer.Broadcast(ANSI_15 + 'Unknown script run-time error (trigger activation): ' + ANSI_7 + endl);
        SelfTerminate;
        Result := TRUE;
      end;

      if not (Result) then
      begin
        FTriggersActive := FALSE;

        if (Execute) then
          // script was self-terminated
          Result := TRUE;
      end;

      Break;
    end
    else
      Inc(I);
  end;
end;

function TScript.EventActive(EventName : string) : Boolean;
var
  I : Integer;
begin
  // check for events matching this event name
  Result := FALSE;

  if (FTriggers[ttEvent].Count > 0) then
    for I := 0 to FTriggers[ttEvent].Count - 1 do
      if (TTrigger(FTriggers[ttEvent][I]^).Value = EventName) then
      begin
        Result := TRUE;
        Break;
      end;
end;

procedure TScript.DelayTimerEvent(Sender : TObject);
var
  LabelName : string;
  Term      : Boolean;
begin
  LabelName := TDelayTimer(Sender).DelayTrigger.LabelName;
  Term := FALSE;

  // remove the trigger and its timer
  FTriggers[ttDelay].Remove(TDelayTimer(Sender).DelayTrigger);
  FreeTrigger(TDelayTimer(Sender).DelayTrigger);

  try
    GotoLabel(LabelName);
  except
    // script is not in execution - so we need to do error handling for gotos outside execute loop
    on E : EScriptError do
    begin
      TWXServer.Broadcast(ANSI_15 + 'Script run-time error (delay trigger activation): ' + ANSI_7 + E.Message + endl);
      SelfTerminate;
      Term := TRUE;
    end;
  else
    TWXServer.Broadcast(ANSI_15 + 'Unknown script run-time error (delay trigger activation)' + ANSI_7 + endl);
    SelfTerminate;
    Term := TRUE;
  end;

  if not (Term) then
    Execute;
end;

function TScript.CreateTrigger(Name, LabelName, Value : String) : PTrigger;
begin
  Cmp.ExtendName(Name, ExecScriptID);
  Cmp.ExtendLabelName(LabelName, ExecScriptID);

  if (TriggerExists(Name)) then
    raise EScriptError.Create('Trigger already exists: ''' + Name + '''');

  Result := AllocMem(SizeOf(TTrigger));
  Result.Name := Name;
  Result.LabelName := LabelName;
  Result.Response := '';
  Result.Value := Value;
  Result.Timer := nil;
  // mb - default lifecycle is single response / no repeat
  Result.LifeCycle := 1;
end;

function TScript.FindWindow(WindowName : string) : TScriptWindow;
var
  I : Integer;
begin
  // find the window (ugly code)

  Result := nil;

  for I := 0 to WindowList.Count - 1 do
    if (TScriptWindow(WindowList[I]).WindowName = WindowName) then
    begin
      Result := TScriptWindow(WindowList[I]);
      Break;
    end;

  if (Result = nil) then
    raise EScriptError.Create('Window not found: ' + WindowName);
end;

procedure TScript.SetAutoTrigger(Name, Value, Response : String; LifeCycle : Integer);
var
  Trigger : PTrigger;
begin
  // mb - doto - do I need this for autotriggers?
  //Cmp.ExtendName(Name, ExecScriptID);
  //Cmp.ExtendLabelName(LabelName, ExecScriptID);

  if (TriggerExists(Name)) then
    raise EScriptError.Create('Trigger already exists: ''' + Name + '''');

  Trigger := AllocMem(SizeOf(TTrigger));
  Trigger.Name := Name;
  Trigger.LabelName := '';
  Trigger.Response := Response;
  Trigger.Value := Value;
  //Trigger.Param := Param;
  Trigger.Timer := nil;
  Trigger.LifeCycle := LifeCycle;

  FTriggers[ttTextAuto].Add(Trigger);
end;

procedure TScript.SetTextLineTrigger(Name, LabelName, Value : String);
begin
  FTriggers[ttTextLine].Add(CreateTrigger(Name, LabelName, Value));
end;

procedure TScript.SetTextOutTrigger(Name, LabelName, Value : String);
begin
  FTriggers[ttTextOut].Add(CreateTrigger(Name, LabelName, Value));
end;

procedure TScript.SetTextTrigger(Name, LabelName, Value : String);
begin
  FTriggers[ttText].Add(CreateTrigger(Name, LabelName, Value));
end;

procedure TScript.SetEventTrigger(Name, LabelName, Value, Param : string);
var
  Trigger : PTrigger;
begin
  Cmp.ExtendName(Name, ExecScriptID);
  Cmp.ExtendLabelName(LabelName, ExecScriptID);

  if (TriggerExists(Name)) then
    raise EScriptError.Create('Trigger already exists: ''' + Name + '''');

  Trigger := AllocMem(SizeOf(TTrigger));
  Trigger.Name := Name;
  Trigger.LabelName := LabelName;
  Trigger.Response := '';
  Trigger.Value := UpperCase(Value);
  Trigger.Param := Param;
  Trigger.Timer := nil;
  Trigger.LifeCycle := 1;

  if (Trigger.Value = 'TIME HIT') then
    Controller.CountTimerEvent;

  FTriggers[ttEvent].Add(Trigger);
end;

procedure TScript.SetDelayTrigger(Name, LabelName : string; Value : Integer);
var
  Trigger : PTrigger;
begin
  Cmp.ExtendName(Name, ExecScriptID);
  Cmp.ExtendLabelName(LabelName, ExecScriptID);

  if (TriggerExists(Name)) then
    raise EScriptError.Create('Trigger already exists: ''' + Name + '''');

  Trigger := AllocMem(SizeOf(TTrigger));
  Trigger.Name := Name;
  Trigger.LabelName := LabelName;
  Trigger.Timer := TDelayTimer.Create(Self);
  Trigger.Timer.DelayTrigger := Trigger;
  Trigger.Timer.Interval := Value;
  Trigger.Timer.OnTimer := DelayTimerEvent;
  Trigger.Timer.Enabled := TRUE;

  FTriggers[ttDelay].Add(Trigger);
end;

procedure TScript.KillTrigger(Name : string);
var
  I: Integer;
  Found: Boolean;
  TriggerList: TList;
  TriggerType: TTriggerType;
begin
  Cmp.ExtendName(Name, ExecScriptID);

  Found := False;

  // locate and dispose of this trigger
  for TriggerType := Low(TTriggerType) to High(TTriggerType) do
  begin
    TriggerList := FTriggers[TriggerType];

    if (TriggerList.Count > 0) then
      for I := 0 to TriggerList.Count - 1 do
        if (TTrigger(TriggerList[I]^).Name = Name) then
        begin
          if (TriggerType = ttEvent) and (TTrigger(TriggerList[I]^).Value = 'TIME HIT') then
            Controller.UnCountTimerEvent;

          FreeTrigger(TriggerList[I]);
          TriggerList.Delete(I);
          Found := True;
          Break;
        end;

    if Found then
      Break;
  end;
end;

procedure TScript.KillAllTriggers;
var
  TriggerType: TTriggerType;
  TriggerList: TList;
begin
  for TriggerType := Low(TTriggerType) to High(TTriggerType) do
  begin
    TriggerList := FTriggers[TriggerType];

    while (TriggerList.Count > 0) do
    begin
      if (TriggerType = ttEvent) and (TTrigger(TriggerList[0]^).Value = 'TIME HIT') then
        Controller.UnCountTimerEvent;

      FreeTrigger(TriggerList[0]);
      TriggerList.Delete(0);
    end;
  end;
end;

procedure TScript.InputCompleted(InputText : string; VarParam : TVarParam);
begin
  // input has just been completed into a menu this script called for
  VarParam.Value := InputText;

  // unlock script and resume execution
  FLocked := FALSE;
  Execute;  
end;

procedure TScript.SetVariable(VarName, Value, Index : string);
var
  I       : Integer;
  Param   : TVarParam;
  Indexes : TStringArray;
begin
  // find a variable with a name that matches VarName and set its value
  // this method exists for compatibility with older scripts only

  Cmp.ExtendName(VarName, ExecScriptID);

  if (Cmp.ParamCount > 0) then
    for I := 0 to Cmp.ParamCount - 1 do
      if (Cmp.Params[I] is TVarParam) then
        if (TVarParam(Cmp.Params[I]).Name = VarName) then
        begin
          if (Index = '') then
            SetLength(Indexes, 0)
          else
          begin
            SetLength(Indexes, 1);
            Indexes[0] := Index;
          end;

          Param := TVarParam(Cmp.Params[I]).GetIndexVar(Indexes);
          Param.Value := Value;
          Break;
        end;
end;

procedure TScript.AddMenu(MenuItem : TObject);
begin
  // add menu item to internal list
  MenuItemList.Add(MenuItem);
end;

function CompareVars(Item1: Pointer; Item2: Pointer): Integer;
begin
  if (TVarParam(Item1).Name = TVarParam(Item2).Name) then
    Result := 0
  else if (TVarParam(Item1).Name < TVarParam(Item2).Name) then
    Result := -1
  else
    Result := 1;
end;

procedure TScript.DumpVars(SearchName : string);
var
  I        : Integer;
  VarParam : TVarParam;
  Sorted   : TList;
begin
  // call all variable dump procedures

  SearchName := UpperCase(SearchName);

  TWXServer.Broadcast(endl + ANSI_15 + 'Variable dump for script: ' + ANSI_7 + Cmp.ScriptFile + endl + endl);
  Sorted := TList.Create;

  try
    for I := 0 to Cmp.ParamCount - 1 do
      if (TObject(Cmp.Params[I]) is TVarParam) then
        Sorted.Add(Cmp.Params[I]);

    Sorted.Sort(CompareVars);

    for I := 0 to Sorted.Count - 1 do
    begin
      VarParam := TVarParam(Sorted[I]);

      if (SearchName = '') or (Pos(SearchName, UpperCase(VarParam.Name)) > 0) then
        VarParam.Dump('');
    end;
  finally
    Sorted.Free;
  end;
end;

procedure TScript.DumpTriggers;
var
  J: Integer;
  T: ^TTrigger;
  TriggerType: TTriggerType;
  TriggerList: TList;
begin
  // dump all triggers

  TWXServer.Broadcast(endl + ANSI_15 + 'Trigger dump for script: ' + ANSI_7 + Cmp.ScriptFile + endl + endl);

  for TriggerType := Low(TTriggerType) to High(TTriggerType) do
  begin
    TWXServer.Broadcast(ANSI_15 + '  ' + TriggerNameMap[TriggerType] + ' Triggers:' + ANSI_7 + endl);

    TriggerList := FTriggers[TriggerType];

    if (TriggerType = ttDelay) then
    begin
      for J := 0 to TriggerList.Count - 1 do
      begin
        T := TriggerList[J];
        TWXServer.Broadcast('    ' + T.Name + ' = [' + T.LabelName + ', ' + IntToStr(T.Timer.Interval) + ']' + endl);
      end;
    end
    else
    begin
      for J := 0 to TriggerList.Count - 1 do
      begin
        T := TriggerList[J];
        TWXServer.Broadcast('    ' + T.Name + ' = [' + T.LabelName + ', "' + T.Value + '", "' + T.Param + '"]' + endl);
      end;
    end;
  end;

  if (FWaitForActive) then
    TWXServer.Broadcast(ANSI_15 + '  Waiting For: ' + ANSI_7 + '"' + WaitText + '"' + endl);
end;


// ***************************************************************
// Script interpretation


{function TScript.ReadCode(var CodeRef : Pointer; ReadSize : Byte) : Pointer;
begin
  // increment CodeRef by ReadSize and return its original value.  Shorthand function
  // used to read command parameters from compiled script byte code.

  Result := CodeRef;
  CodeRef := Pointer(Integer(CodeRef) + ReadSize);
end;}

function TScript.ReadByte(var CodeRef : Pointer) : Byte;
begin
  Result := Byte(CodeRef^);
  CodeRef := Pointer(Integer(CodeRef) + SizeOf(Byte));
end;

function TScript.ReadChar(var CodeRef : Pointer) : Char;
begin
  Result := Char(CodeRef^);
  CodeRef := Pointer(Integer(CodeRef) + SizeOf(Char));
end;

function TScript.ReadWord(var CodeRef : Pointer) : Word;
begin
  Result := Word(CodeRef^);
  CodeRef := Pointer(Integer(CodeRef) + SizeOf(Word));
end;

function TScript.ReadInteger(var CodeRef : Pointer) : Integer;
begin
  Result := Integer(CodeRef^);
  CodeRef := Pointer(Integer(CodeRef) + SizeOf(Integer));
end;

function TScript.ReadIndexValues(var CodeRef : Pointer; IndexCount : Byte) : TStringArray;
var
  ParamType,
  //IndexCount : Byte;
  I          : Integer;
begin
  // read an index list from the byte code and into a string list

  //IndexCount := ReadByte(CodeRef);
    SetLength(Result, IndexCount);
  for I := 0 to IndexCount - 1 do
  begin
    ParamType := ReadByte(CodeRef);
    if (ParamType = PARAM_CONST) then
      // 32-bit constant reference
      Result[I] := Cmp.Params[ReadInteger(CodeRef)].Value
    else if (ParamType = PARAM_VAR) then
      // 32-bit variable reference - may be indexed
      Result[I] := SeekVariable(CodeRef).Value
    else if (ParamType = PARAM_SYSCONST) then
      // 16-bit system constant reference - may be indexed
      Result[I] := GetSysConstValue(CodeRef)
    else if (ParamType = PARAM_PROGVAR) then
    begin
      // 32-bit program variable reference
    end
    else if (ParamType = PARAM_CHAR) then
      Result[I] := ReadChar(CodeRef);
  end;
end;

function TScript.GetSysConstValue(var CodeRef : Pointer) : string;
var
  ConstRef    : Word;
  IndexValues : TStringArray;
  IndexCount : Byte;
begin
  ConstRef := ReadWord(CodeRef);
  IndexCount := ReadByte(CodeRef);
  IndexValues := ReadIndexValues(CodeRef, IndexCount);
  Result := Cmp.ScriptRef.SysConsts[ConstRef].Read(IndexValues);
end;

function TScript.SeekVariable(var CodeRef : Pointer) : TVarParam;
var
  IndexValues : TStringArray;
  VarRef      : Integer;
  IndexCount : Byte;
begin
  // construct a variable index list and retrieve the variable from this code reference

  VarRef := ReadInteger(CodeRef);
  IndexCount := ReadByte(CodeRef);
  if (IndexCount = 0) then
    Result := TVarParam(Cmp.Params[VarRef])
  else
  begin
    IndexValues := ReadIndexValues(CodeRef, IndexCount);
    Result := TVarParam(Cmp.Params[VarRef]).GetIndexVar(IndexValues);
  end;
end;

function TScript.ProcessCmd(Cmd : TScriptCmd; var CmdValues : Pointer) : TCmdAction;
{
  Note on passing to script commands:

  All TScriptCmdHandlers accept values as array of type TCmdParam.  This allows them to access
  both the values and the references of the object containing them.  Because of this, SysConsts
  and chars must be built up and passed as temporary TConstParams.
}
var
  CodeByte,
  ParamType : Byte;
  //CmdParams : array of TCmdParam; // EP - Now declared globally to persist, for performance - SCRATCH THAT
  CodeInt   : Integer;
  ParamCount : Integer;
  Ptr : Pointer;
  RealCount : Integer;
  I: Integer;
  ArrayLength : Integer;


  procedure AppendTempValue(const Value : string);
  var
    TempParam : TCmdParam;
  begin
    // make a temporary param to pass the value
    Inc(ParamCount);
    if ParamCount > ArrayLength then
    begin
      SetLength(CmdParams, ParamCount + 10);
      ArrayLength := ParamCount + 10;
    end;

    TempParam := TCmdParam.Create;
    TempParam.Value := Value;
    TempParam.IsTemporary := True;
    CmdParams[ParamCount - 1] := TempParam;
  end;
  procedure AppendValue(CmdParam : TCmdParam);
  begin
    Inc(ParamCount);
    if ParamCount > ArrayLength then
    begin
      SetLength(CmdParams, ParamCount + 10); // EP - Bump it up in blocks
      ArrayLength := ParamCount + 10;
    end;
    CmdParams[ParamCount - 1] := CmdParam;
  end;
begin
  ArrayLength := Length(CmdParams); // EP - Just do this once here
  // parse the byte code of this command and return an updated pointer to end of command.
  Result := ScriptRef.caNone;
  ParamCount := 0;

  try
    while (TRUE) do
    begin
      ParamType := ReadByte(cmdValues);
      if (ParamType = 0) then
      begin
        // EP - Low-level hack so that Length(CmdParams) will return a fake array size
        Ptr := Pointer(CmdParams);
        Dec(PLongint(Ptr));
        RealCount := PLongint(Ptr)^; // EP - Preserve actual length of dynamic array
        PLongint(Ptr)^ := ParamCount; // EP - Fake the length
        Result := Cmd.onCmd(Self, CmdParams);
        PLongint(Ptr)^ := RealCount; // EP - Set length back to actual length
        Inc(PLongint(Ptr));
        Break;
      end
      else
      begin
        if (ParamType = PARAM_VAR) then
        begin
          // 32-bit variable reference
          AppendValue(SeekVariable(CmdValues));
        end
        else if (ParamType = PARAM_CONST) then
        begin
          // 32-bit constant reference
          CodeInt := ReadInteger(CmdValues);
          AppendValue(Cmp.Params[CodeInt]);
        end
        else if (ParamType = PARAM_SYSCONST) then
        begin
          // 16-bit system constant reference
          AppendTempValue(GetSysConstValue(CmdValues));
        end
        else if (ParamType = PARAM_CHAR) then
        begin
          // 8-bit character code
          CodeByte := ReadByte(CmdValues);
          AppendTempValue(Chr(CodeByte));
        end
        else if (ParamType = PARAM_PROGVAR) then
        begin
          // 32-bit program variable reference
        end
      end;
    end;
  finally
    for I := 0 to ParamCount - 1 do
      if (CmdParams[I] <> nil) AND TCmdParam(CmdParams[I]).IsTemporary then
        TCmdParam(CmdParams[I]).Free;
    // SetLength(CmdParams, 0); // EP - This should no longer be needed
  end;
end;

function TScript.Execute : Boolean; // return true if script was terminated
var
  CmdAction : TCmdAction;
  Line,
  Cmd       : Word;
begin
  Line := 0;
  ExecScriptID := 0;
  try
    // execute code from CodePos
    if (Cmp.CodeSize = 0) or (Integer(CodePos) - Integer(Cmp.Code) >= Cmp.CodeSize) then
      CmdAction := caStop
    else
    repeat
      // fetch script ID
      ExecScriptID := ReadByte(CodePos);
      // fetch line number
      Line := ReadWord(CodePos);
      // fetch command from code
      Cmd := ReadWord(CodePos);
      // read and execute command
      CmdAction := ProcessCmd(Cmp.ScriptRef.Cmds[Cmd], CodePos);
      if (Integer(CodePos) - Integer(Cmp.Code) >= Cmp.CodeSize) and (CmdAction <> caPause) then
        CmdAction := caStop; // reached end of compiled code
    until (CmdAction <> ScriptRef.caNone);
    ExecScriptID := 0;
  except
    on E : EScriptError do
    begin
      TWXServer.Broadcast(ANSI_15 + 'Script run-time error in ''' + Cmp.IncludeScripts[ExecScriptID] + ''': ' + ANSI_7 + E.Message + ', line ' + IntToStr(Line) + ', cmd ' + IntToStr(Cmd) + endl);
      CmdAction := caStop;
    end;
  else
    TWXServer.Broadcast(ANSI_15 + 'Unknown script run-time error ''' + Cmp.IncludeScripts[ExecScriptID] + ''': ' + ANSI_7 + ', line ' + IntToStr(Line) + endl);
    CmdAction := caStop;
  end;
  Result := FALSE;
  if (CmdAction = caStop) then
  begin
    SelfTerminate;
    Result := TRUE;
  end;
end;

procedure TScript.GotoLabel(L : string);
var
  Error : Boolean;
  I     : Integer;
begin
  // seek label with name L
  Error := FALSE;

  if (Length(L) < 2) then
    Error := TRUE
  else if (L[1] <> ':') then
    Error := TRUE;

  if (Error) then
    raise EScriptError.Create('Bad goto label ''' + L + '''');

  L := UpperCase(Copy(L, 2, Length(L)));
  Cmp.ExtendName(L, ExecScriptID);

  if (Cmp.LabelCount > 0) then
    for I := 0 to Cmp.LabelCount - 1 do
    begin
      if (Cmp.Labels[I].Name = L) then
      begin
        CodePos := Pointer(Integer(Cmp.Code) + Cmp.Labels[I].Location);
        Exit;
      end;
    end;

  raise EScriptError.Create('Goto label not found ''' + L + '''');
end;

procedure TScript.Gosub(LabelName : String);
begin
  SubStack.Push(CodePos);
  GotoLabel(LabelName);
end;

procedure TScript.Return;
begin
  if (SubStack.Count = 0) then
    raise EScriptError.Create('Return without gosub');

  CodePos := SubStack.Pop;
end;

procedure TScript.AddWindow(Window : TScriptWindow);
begin
  WindowList.Add(Window);
end;

procedure TScript.RemoveWindow(Window : TScriptWindow);
begin
  Window.Free;
  WindowList.Remove(Window);
end;

end.
