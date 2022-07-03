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
// This unit controls all hard coded menus send to the client

unit
  Menu;

interface

uses
  Core,
  Classes,
  Extctrls,
  Script,
  ScriptCmp,
  Windows,
  SysUtils;

type
  TMenuEvent = procedure(ClientIndex : Byte) of object;
  EMenuException = class(Exception);

  TTWXMenuItem = class;

  // TModMenu - controls all menus
  TModMenu = class(TTWXModule, ITWXGlobals)
  private
    MainMenu,
    ScriptMenu,
    ScriptMenuKey,
    FCurrentMenu   : TTWXMenuItem;
    LastBurst      : string;
    FInputScript   : TScript;
    InputScriptVar : TVarParam;
    MenuItemList   : TList;
    FHelpMode      : Boolean;
    FProgramDir    : string;
    FSandboxGame   : string;

    // menu commands:
    procedure miBurst(ClientIndex : Byte);
    procedure miBurst2(ClientIndex : Byte);
    procedure miBurstRepeat(ClientIndex : Byte);
    procedure miBurstEdit(ClientIndex : Byte);
    procedure miConnect(ClientIndex : Byte);
    procedure miStopScript(ClientIndex : Byte);
    procedure miToggleDeaf(ClientIndex : Byte);
    procedure miStreamingMode(ClientIndex : Byte);
    procedure miShowClients(ClientIndex : Byte);
    procedure miExit(ClientIndex : Byte);

    procedure miLoad(ClientIndex : Byte);
    procedure miLoad2(ClientIndex : Byte);
    procedure miLoadLast(ClientIndex : Byte);
    procedure miDumpVars(ClientIndex : Byte);
    procedure miDumpVars2(ClientIndex : Byte);
    procedure miDumpTriggers(ClientIndex : Byte);
    procedure miListActive(ClientIndex : Byte);
    procedure miListDirectory(ClientIndex : Byte);
    procedure miKill(ClientIndex : Byte);
    procedure miKill2(ClientIndex : Byte);

    procedure miShowSector(ClientIndex : Byte);
    procedure miShowSector2(ClientIndex : Byte);
    procedure miShowFigs(ClientIndex : Byte);
    procedure miShowMines(ClientIndex : Byte);
    procedure miShowDensity(ClientIndex : Byte);
    procedure miShowDensity2(ClientIndex : Byte);
    procedure miShowDensity3(ClientIndex : Byte);
    procedure miShowAnomaly(ClientIndex : Byte);
    procedure miShowTraders(ClientIndex : Byte);
    procedure miPlotCourse(ClientIndex : Byte);
    procedure miPlotCourse2(ClientIndex : Byte);
    procedure miPlotCourse3(ClientIndex : Byte);
    procedure miHoloscan(ClientIndex : Byte);
    procedure miHoloscan2(ClientIndex : Byte);
    procedure miShowTotal(ClientIndex : Byte);
    procedure miShowBubbles(ClientIndex : Byte);
    procedure miShowBubble(ClientIndex : Byte);
    procedure miShowBubble2(ClientIndex : Byte);
    procedure miShowBubble3(ClientIndex : Byte);
    procedure miShowBackdoors(ClientIndex : Byte);
    procedure miShowBackdoors2(ClientIndex : Byte);

    procedure miShowPort(ClientIndex : Byte);
    procedure miShowPort2(ClientIndex : Byte);
    procedure miShowClassPort(ClientIndex : Byte);
    procedure miListPorts(ClientIndex : Byte);
    procedure miListUpgradedPorts(ClientIndex : Byte);

    procedure miListenPort(ClientIndex : Byte);
    procedure miListenPort2(ClientIndex : Byte);
    procedure miBubbleSize(ClientIndex : Byte);
    procedure miBubbleSize2(ClientIndex : Byte);
    procedure miReconnect(ClientIndex : Byte);
    procedure miLog(ClientIndex : Byte);
    procedure miLogAnsi(ClientIndex : Byte);
    procedure miAcceptExternal(ClientIndex : Byte);
    procedure miCache(ClientIndex : Byte);
    procedure miRecording(ClientIndex : Byte);
    procedure miMenuKey(ClientIndex : Byte);
    procedure miMenuKey2(ClientIndex : Byte);
    procedure miLocalEcho(ClientIndex : Byte);

    procedure miDatabaseCreate(ClientIndex : Byte);
    procedure miDatabaseCreate2(ClientIndex : Byte);
    procedure miDatabaseCreate3(ClientIndex : Byte);
    procedure miDatabaseEdit(ClientIndex : Byte);
    procedure miDatabaseEdit2(ClientIndex : Byte);
    procedure miDatabaseEdit3(ClientIndex : Byte);
    procedure miDatabaseEdit4(ClientIndex : Byte);
    procedure miDatabaseEdit5(ClientIndex : Byte);
    procedure miDatabaseEdit6(ClientIndex : Byte);
    procedure miDatabaseEdit7(ClientIndex : Byte);
    procedure miDatabaseEdit8(ClientIndex : Byte);
    procedure miDatabaseEdit9(ClientIndex : Byte);
    procedure miDatabaseDelete(ClientIndex : Byte);
    procedure miDatabaseDelete2(ClientIndex : Byte);
    procedure miDatabaseList(ClientIndex : Byte);
    procedure miDatabaseSelect(ClientIndex : Byte);
    procedure miDatabaseSelect2(ClientIndex : Byte);
    procedure miDatabaseView(ClientIndex : Byte);
    procedure miDatabaseView2(ClientIndex : Byte);

    procedure miScriptInputActivate(ClientIndex : Byte);
    procedure ScriptLineComplete(ClientIndex : Byte);

  protected
    { ITWXGlobals }
    function GetProgramDir: string;
    procedure SetProgramDir(const Value: string);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;
    procedure StateValuesLoaded; override;

    function AddCustomMenu(Parent, Name, Title, Reference, Prompt : string; HotKey : Char; CloseActivate : Boolean; ScriptOwner : TScript) : TTWXMenuItem;
    procedure LinkMenu(Item : TTWXMenuItem);
    procedure UnlinkMenu(Item : TTWXMenuItem);
    procedure OpenMenu(MenuName : string; ClientIndex : Byte); // do NOT call with mtNone
    procedure OpenMenuItem(Item : TTWXMenuItem; ClientIndex : Byte; LastMenuName : string);
    procedure CloseMenu(TerminateScript : Boolean);
    procedure MenuText(Text : string; ClientIndex : Byte);
    function GetPrompt : string;
    procedure BeginScriptInput(Script : TScript; VarParam : TVarParam; SingleKey : Boolean);
    procedure ApplySetup;
    function GetMenuByName(MenuName : string) : TTWXMenuItem;

    property HelpMode : Boolean read FHelpMode write FHelpMode;
    property SandboxGame : string read FSandboxGame write FSandboxGame;

  published
    property CurrentMenu : TTWXMenuItem read FCurrentMenu;
    property InputScript : TScript read FInputScript;
  end;

  // an option within a menu
  TTWXMenuItem = class(TObject)
  public
    constructor Create(Owner : TModMenu; Name : string; OnActivate : TMenuEvent; Title, Prmpt : String; Key : Char); overload;
    constructor Create(Owner : TModMenu; Name, Title, Prmpt : string; Key : Char); overload;
    destructor Destroy; override;

    procedure MenuKey(Key : Char; ClientIndex : Byte);
    procedure AddItem(Item : TTWXMenuItem);
    procedure RemoveItem(Item : TTWXMenuItem);
    procedure AddParam(P : Pointer);
    procedure DumpOptions;
    procedure SetOptions(OpExit, OpList, OpHelp : Boolean);
    function GetParam(Index : Integer) : Pointer;
    function GetPrompt : string;
    function GetMenuItemCount : Integer;

  protected
    FName,
    FValue,
    FPrompt,
    FLine,
    FReference,
    FTitle,
    FHelp           : string;
    FOnLineComplete,
    FOnActivate     : TMenuEvent; // activated by process unit
    FHotKey         : Char;
    FController     : TModMenu;
    MenuParams,
    MenuItems       : TList;
    FParentMenu     : TTWXMenuItem;
    FOpExit,
    FOpList,
    FOpHelp,
    FCloseActivate,
    FClearLine,
    FIsCustom,
    FScriptMacrosOn : Boolean;
    FScriptOwner    : TScript;

  published
    property OnLineComplete : TMenuEvent read FOnLineComplete write FOnLineComplete;
    property OnActivate : TMenuEvent read FOnActivate write FOnActivate;
    property Title : string read FTitle write FTitle;
    property HotKey : Char read FHotKey write FHotKey;
    property Line : string read FLine write FLine;
    property ParentMenu : TTWXMenuItem read FParentMenu write FParentMenu;
    property ScriptMacrosOn : Boolean read FScriptMacrosOn write FScriptMacrosOn;
    property Name : string read FName write FName;
    property CloseActivate : Boolean read FCloseActivate write FCloseActivate;
    property Reference : string read FReference write FReference;
    property Controller : TModMenu read FController write FController;
    property ScriptOwner : TScript read FScriptOwner write FScriptOwner;
    property IsCustom : Boolean read FIsCustom write FIsCustom;
    property MenuItemCount : Integer read GetMenuItemCount;
    property Value : string read FValue write FValue;
    property Help : string read FHelp write FHelp;
    property ClearLine : Boolean read FClearLine write FClearLine;
  end;

implementation

uses
  Utility,
  Database,
  Forms,
  Global,
  Bubble,
  TCP,
//  Windows,
  Ansi;

const
  MENU_DARK = ANSI_2;
  MENU_MID = ANSI_10;
  MENU_LIGHT = ANSI_15;


procedure DumpHeapStatus;
var
  HeapStatus : THeapStatus;
begin
  HeapStatus := GetHeapStatus;

  TWXServer.Broadcast(endl + endl + ANSI_15 + 'Memory heap status: ' + endl + ANSI_7);
  TWXServer.Broadcast(endl + 'Total address space: ' + IntToStr(HeapStatus.TotalAddrSpace));
  TWXServer.Broadcast(endl + 'Total uncommitted: ' + IntToStr(HeapStatus.TotalUncommitted));
  TWXServer.Broadcast(endl + 'Total committed: ' + IntToStr(HeapStatus.TotalCommitted));
  TWXServer.Broadcast(endl + 'Total allocated: ' + IntToStr(HeapStatus.TotalAllocated));
  TWXServer.Broadcast(endl + 'Total free: ' + IntToStr(HeapStatus.TotalFree));
  TWXServer.Broadcast(endl + 'Free small: ' + IntToStr(HeapStatus.FreeSmall));
  TWXServer.Broadcast(endl + 'Free big: ' + IntToStr(HeapStatus.FreeBig));
  TWXServer.Broadcast(endl + 'Unused: ' + IntToStr(HeapStatus.Unused));
  TWXServer.Broadcast(endl + 'Overhead: ' + IntToStr(HeapStatus.Overhead));
  TWXServer.Broadcast(endl + 'Heap error code: ' + IntToStr(HeapStatus.HeapErrorCode) + endl + endl);
end;

procedure DumpScriptCmdStatus;
begin
  TWXServer.Broadcast(endl + endl + ANSI_15 + 'Script cmd status: ' + endl + ANSI_7);
  TWXServer.Broadcast(endl + 'sys_check: ' + IntToStr(TWXInterpreter.ScriptRef.FindCmd('SYS_CHECK')));
  TWXServer.Broadcast(endl + 'sys_fail: ' + IntToStr(TWXInterpreter.ScriptRef.FindCmd('SYS_FAIL')));
  TWXServer.Broadcast(endl + 'sys_kill: ' + IntToStr(TWXInterpreter.ScriptRef.FindCmd('SYS_KILL')));
  TWXServer.Broadcast(endl + 'sys_nop: ' + IntToStr(TWXInterpreter.ScriptRef.FindCmd('SYS_NOP')) + endl + endl);
end;

function ColourPlanet(S : String) : String;
var
  X : String;
begin
  // Make a nice pretty ANSI planet

  if (GetParameter(S, 1) = '<<<<') then
    // Shielded planet...
    X := ANSI_12 + '<<<< ' + ANSI_2 + '(' + ANSI_14 + Copy(S, 7, 1) + ANSI_2 + ') ' + ANSI_1 + Copy(S, 10, length(S) - 25) + ANSI_12 + ' >>>> ' + ANSI_2 + '(Shielded)'
  else
    // Non shielded planet...
    X := ANSI_2 + '(' + ANSI_14 + Copy(S, 2, 1) + ANSI_2 + ') ' + Copy(S, 5, length(S) - 4);

  Result := X;
end;

procedure DisplayPort(S: TSector; Index: Integer);
begin
  TWXServer.Broadcast(ANSI_14 + 'Commerce report for ' + ANSI_11 + S.SPort.Name + ANSI_15 + ' (sector ' +
   IntToStr(Index) + ') ' + ANSI_14 + ': ' + TimeToStr(S.SPort.Update) + ' ' + DateToStr(S.SPort.Update)
   + endl + endl
   + ANSI_2 + ' Items     Status  Trading % of max' + endl
   + ANSI_5 + ' -----     ------  ------- --------' + endl
   + ANSI_11 + 'Fuel Ore   ' + ANSI_2);

  if (S.SPort.BuyProduct[ptFuelOre]) then
    TWXServer.Broadcast('Buying   ')
  else
    TWXServer.Broadcast('Selling  ');

  TWXServer.Broadcast(ANSI_11 + GetSpace(5 - Length(IntToStr(S.SPort.ProductAmount[ptFuelOre]))) + IntToStr(S.SPort.ProductAmount[ptFuelOre])
   + '    ' + ANSI_2 + GetSpace(3 - Length(IntToStr(S.SPort.ProductPercent[ptFuelOre])))
   + IntToStr(S.SPort.ProductPercent[ptFuelOre]) + ANSI_12 + '%' + endl
   + ANSI_11 + 'Organics   ' + ANSI_2);

  if (S.SPort.BuyProduct[ptOrganics]) then
    TWXServer.Broadcast('Buying   ')
  else
    TWXServer.Broadcast('Selling  ');

  TWXServer.Broadcast(ANSI_11 + GetSpace(5 - Length(IntToStr(S.SPort.ProductAmount[ptOrganics]))) + IntToStr(S.SPort.ProductAmount[ptOrganics])
   + '    ' + ANSI_2 + GetSpace(3 - Length(IntToStr(S.SPort.ProductPercent[ptOrganics])))
   + IntToStr(S.SPort.ProductPercent[ptOrganics]) + ANSI_12 + '%' + endl
   + ANSI_11 + 'Equipment  ' + ANSI_2);

  if (S.SPort.BuyProduct[ptEquipment]) then
    TWXServer.Broadcast('Buying   ')
  else
    TWXServer.Broadcast('Selling  ');

  TWXServer.Broadcast(ANSI_11 + GetSpace(5 - Length(IntToStr(S.SPort.ProductAmount[ptEquipment]))) + IntToStr(S.SPort.ProductAmount[ptEquipment])
   + '    ' + ANSI_2 + GetSpace(3 - Length(IntToStr(S.SPort.ProductPercent[ptEquipment])))
   + IntToStr(S.SPort.ProductPercent[ptEquipment]) + ANSI_12 + '%' + endl + endl + endl);
end;

procedure DisplayPortSummary(S: TSector; Index: Integer);
var
  SectColour,
  SIndex,
  PClass,
  POre,
  POrg,
  PEquip,
  POreClr,
  POrgClr,
  PEquipClr,
  Update     : String;
  POreLen,
  POrgLen,
  PEquipLen  : Integer;
begin
  if (S.SPort.UpDate < TWXDatabase.DBHeader.LastPortCIM) then
    SectColour := ANSI_12 // not updated within 24 hours
  else
    SectColour := ANSI_11;

  SIndex := IntToStr(Index);

  if (S.SPort.BuyProduct[ptFuelOre]) then
    PClass := PClass + ANSI_2 + 'B'
  else
    PClass := PClass + ANSI_11 + 'S';

  if (S.SPort.BuyProduct[ptOrganics]) then
    PClass := PClass + ANSI_2 + 'B'
  else
    PClass := PClass + ANSI_11 + 'S';

  if (S.SPort.BuyProduct[ptEquipment]) then
    PClass := PClass + ANSI_2 + 'B'
  else
    PClass := PClass + ANSI_11 + 'S';

  POre := IntToStr(S.SPort.ProductAmount[ptFuelOre]);
  POrg := IntToStr(S.SPort.ProductAmount[ptOrganics]);
  PEquip := IntToStr(S.SPort.ProductAmount[ptEquipment]);

  POreLen := Length(IntToStr(S.SPort.ProductPercent[ptFuelOre])) + 10;
  POrgLen := Length(IntToStr(S.SPort.ProductPercent[ptOrganics])) + 10;
  PEquipLen := Length(IntToStr(S.SPort.ProductPercent[ptEquipment])) + 10;

  if (S.SPort.ProductAmount[ptFuelOre] * (100 / (S.SPort.ProductPercent[ptFuelOre] + 1)) >= 10000) then
    POreClr := ANSI_10
  else
    POreClr := ANSI_2;

  if (S.SPort.ProductAmount[ptOrganics] * (100 / (S.SPort.ProductPercent[ptOrganics] + 1)) >= 10000) then
    POrgClr := ANSI_10
  else
    POrgClr := ANSI_2;

  if (S.SPort.ProductAmount[ptEquipment] * (100 / (S.SPort.ProductPercent[ptEquipment] + 1)) >= 10000) then
    PEquipClr := ANSI_10
  else
    PEquipClr := ANSI_2;

  if (S.SPort.ProductPercent[ptFuelOre] < 100) then
    POre := POre + GetSpace(6 - Length(POre)) + ANSI_2 + '(' + ANSI_6 + IntToStr(S.SPort.ProductPercent[ptFuelOre]) + '%' + ANSI_2 + ')'
  else
    POre := POre + GetSpace(6 - Length(POre)) + ANSI_2 + '(' + ANSI_14 + IntToStr(S.SPort.ProductPercent[ptFuelOre]) + '%' + ANSI_2 + ')';

  if (S.SPort.ProductPercent[ptOrganics] < 100) then
    POrg := POrg + GetSpace(6 - Length(POrg)) + ANSI_2 + '(' + ANSI_6 + IntToStr(S.SPort.ProductPercent[ptOrganics]) + '%' + ANSI_2 + ')'
  else
    POrg := POrg + GetSpace(6 - Length(POrg)) + ANSI_2 + '(' + ANSI_14 + IntToStr(S.SPort.ProductPercent[ptOrganics]) + '%' + ANSI_2 + ')';

  if (S.SPort.ProductPercent[ptEquipment] < 100) then
    PEquip := PEquip + GetSpace(6 - Length(PEquip)) + ANSI_2 + '(' + ANSI_6 + IntToStr(S.SPort.ProductPercent[ptEquipment]) + '%' + ANSI_3 + ')'
  else
    PEquip := PEquip + GetSpace(6 - Length(PEquip)) + ANSI_2 + '(' + ANSI_14 + IntToStr(S.SPort.ProductPercent[ptEquipment]) + '%' + ANSI_3 + ')';

  if (S.SPort.UpDate = 0) then
    Update := ANSI_4 + 'Not Updated'
  else
    Update := DateToStr(S.SPort.UpDate) + ' ' + TimeToStr(S.SPort.UpDate);

  TWXServer.Broadcast(SectColour + SIndex + GetSpace(7 - Length(SIndex)) + PClass + GetSpace(3) + ANSI_2
   + POreClr + POre + GetSpace(14 - POreLen) + POrgClr + POrg + GetSpace(14 - POrgLen) + PEquipClr + PEquip
   + GetSpace(14 - PEquipLen) + Update
   + endl);
end;

procedure DisplaySector(S: TSector; Index: Integer);
var
  I               : Integer;
  PromptDisplayed : Boolean;
  SectItems,
  Backdoors       : TList;
begin
  TWXServer.Broadcast(endl + ANSI_3 + 'Last seen on ' + ANSI_11 + DateToStr(S.UpDate) + ANSI_3 + ' at ' + ANSI_11 + TimeToSTr(S.UpDate) + endl + endl);

  if (S.Constellation = 'uncharted space.') then
    S.Constellation := ANSI_1 + 'uncharted space.'
  else
    S.Constellation := ANSI_10 + S.Constellation;

  TWXServer.Broadcast(ANSI_10 + 'Sector  ' + ANSI_14 + ': ' + ANSI_11 + IntToStr(Index) + ANSI_2 + ' in ' + S.Constellation + endl);

  if (S.Density > -1) then
  begin
    if (S.Anomaly) then
      TWXServer.Broadcast(ANSI_5 + 'Density ' + ANSI_14 + ': ' + ANSI_11 + Segment(S.Density) + ANSI_9 + ' (Anomaly)' + endl)
    else
      TWXServer.Broadcast(ANSI_5 + 'Density ' + ANSI_14 + ': ' + ANSI_11 + Segment(S.Density) + endl)
  end;

  if (S.Beacon <> '') then
    TWXServer.Broadcast(ANSI_5 + 'Beacon  ' + ANSI_14 + ': ' + ANSI_4 + S.Beacon + endl);

  if (S.SPort.Name <> '') and (S.SPort.Dead = FALSE) then
  begin
    TWXServer.Broadcast(ANSI_5 + 'Ports   ' + ANSI_14 + ': ' + ANSI_11 + S.SPort.Name + ANSI_14 + ', ' + ANSI_5 + 'Class ' + ANSI_11 + IntToStr(S.SPort.ClassIndex) + ANSI_5 + ' (');

    if (S.SPort.ClassIndex = 0) or (S.SPort.ClassIndex = 9) then
      TWXServer.Broadcast(ANSI_11 + 'Special')
    else
    begin
      if (S.SPort.BuyProduct[ptFuelOre]) then
        TWXServer.Broadcast(ANSI_2 + 'B')
      else
        TWXServer.Broadcast(ANSI_11 + 'S');

      if (S.SPort.BuyProduct[ptOrganics]) then
        TWXServer.Broadcast(ANSI_2 + 'B')
      else
        TWXServer.Broadcast(ANSI_11 + 'S');

      if (S.SPort.BuyProduct[ptEquipment]) then
        TWXServer.Broadcast(ANSI_2 + 'B')
      else
        TWXServer.Broadcast(ANSI_11 + 'S');
    end;

    TWXServer.Broadcast(ANSI_5 + ')' + endl);

    if (S.SPort.BuildTime > 0) then
      TWXServer.Broadcast(ANSI_14 + '           (Under Construction - ' + IntToStr(S.SPort.BuildTime) + ' days left' + endl)
  end;

  // Search through the planet database for planets and display them
  PromptDisplayed := FALSE;
  SectItems := TWXDatabase.GetSectorItems(itPlanet, S);

  while (SectItems.Count > 0) do
  begin
    if (PromptDisplayed) then
      TWXServer.Broadcast(ANSI_14 + '          ')
    else
    begin
      TWXServer.Broadcast(ANSI_5 + 'Planets ' + ANSI_14 + ': ');
      PromptDisplayed := TRUE;
    end;

    TWXServer.Broadcast(ANSI_7 + ColourPlanet(TPlanet(SectItems.Items[0]^).Name) + endl);
    FreeMem(SectItems[0]);
    SectItems.Delete(0);
  end;

  SectItems.Free;

  // show traders
  PromptDisplayed := FALSE;
  SectItems := TWXDatabase.GetSectorItems(itTrader, S);

  while (SectItems.Count > 0) do
  begin
    if (PromptDisplayed) then
      TWXServer.Broadcast(ANSI_14 + '          ')
    else
    begin
      TWXServer.Broadcast(ANSI_5 + 'Traders ' + ANSI_14 + ': ');
      PromptDisplayed := TRUE;
    end;

    TWXServer.Broadcast(ANSI_11 + TTrader(SectItems.Items[0]^).Name + ANSI_14 + ',' + ANSI_2 + ' w/ ' + ANSI_14 + Segment(TTrader(SectItems.Items[0]^).Figs) + ANSI_2 + ' ftrs' + ANSI_14 + ',' + endl);
    TWXServer.Broadcast(ANSI_2 + '           in ' + ANSI_3 + TTrader(SectItems.Items[0]^).ShipName + ANSI_2 + ' (' + ANSI_7 + TTrader(SectItems.Items[0]^).ShipType + ANSI_2 + ')' + endl);
    FreeMem(SectItems[0]);
    SectItems.Delete(0);
  end;

  SectItems.Free;

  // show ships
  PromptDisplayed := FALSE;
  SectItems := TWXDatabase.GetSectorItems(itShip, S);

  while (SectItems.Count > 0) do
  begin
    if (PromptDisplayed) then
      TWXServer.Broadcast(ANSI_14 + '          ')
    else
    begin
      TWXServer.Broadcast(ANSI_5 + 'Ships   ' + ANSI_14 + ': ');
      PromptDisplayed := TRUE;
    end;

    TWXServer.Broadcast(ANSI_11 + TShip(SectItems.Items[0]^).Name + ANSI_5 + ' [' + ANSI_4 + 'Owned by' + ANSI_5 + '] ' + ANSI_5 + TShip(SectItems.Items[0]^).Owner + ANSI_14 + ',' + ANSI_2 + ' w/ ' + ANSI_14 + Segment(TShip(SectItems.Items[0]^).Figs) + ANSI_2 + ' ftrs' + ANSI_14 + ',' + endl);
    TWXServer.Broadcast(ANSI_2 + '           (' + ANSI_7 + TShip(SectItems.Items[0]^).ShipType + ANSI_2 + ')' + endl);
    FreeMem(SectItems[0]);
    SectItems.Delete(0);
  end;

  SectItems.Free;

  if (S.Figs.Quantity > 0) then
  begin
    TWXServer.Broadcast(ANSI_5 + 'Fighters' + ANSI_14 + ': ' + ANSI_11 + Segment(S.Figs.Quantity) + ANSI_5 + ' (' + S.Figs.Owner + ') ' + ANSI_6);

    if (S.Figs.FigType = ftToll) then
      TWXServer.Broadcast('[Toll]')
    else if (S.Figs.FigType = ftDefensive) then
      TWXServer.Broadcast('[Defensive]')
    else
      TWXServer.Broadcast('[Offensive]');

    TWXServer.Broadcast(endl);
  end;

  if (S.Navhaz > 0) then
    TWXServer.Broadcast(ANSI_5 + 'NavHaz  ' + ANSI_14 + ': ' + ANSI_12 + IntToStr(S.NavHaz) + ANSI_5 + '%' + ANSI_1 + ' (' + ANSI_3 + 'Space Debris/Asteroids' + ANSI_1 + ')' + endl);

  if (S.Mines_Armid.Quantity > 0) then
  begin
    TWXServer.Broadcast(ANSI_5 + 'Mines   ' + ANSI_14 + ': ' + ANSI_12 + IntToStr(S.Mines_Armid.Quantity) + ANSI_5 + ' (' + ANSI_2 + 'Type ' + ANSI_14 + '1' + ANSI_2 + ' Armid' + ANSI_5 + ') (' + S.Mines_Armid.Owner + ')' + endl);

    if (S.Mines_Limpet.Quantity > 0) then
      TWXServer.Broadcast('        ' + ANSI_14 + ': ' + ANSI_12 + IntToStr(S.Mines_Limpet.Quantity) + ANSI_5 + ' (' + ANSI_2 + 'Type ' + ANSI_14 + '2' + ANSI_2 + ' Limpet' + ANSI_5 + ') (' + S.Mines_Limpet.Owner + ')' + endl);
  end
  else if (S.Mines_Limpet.Quantity > 0) then
    TWXServer.Broadcast(ANSI_5 + 'Mines   ' + ANSI_14 + ': ' + ANSI_12 + IntToStr(S.Mines_Limpet.Quantity) + ANSI_5 + ' (' + ANSI_2 + 'Type ' + ANSI_14 + '2' + ANSI_2 + ' Limpet' + ANSI_5 + ') (' + S.Mines_Limpet.Owner + ')' + endl);

  TWXServer.Broadcast(ANSI_10 + 'Warps to Sector(s) ' + ANSI_14 + ':  ');

  if (S.Warp[1] > 0) then
    TWXServer.Broadcast(ANSI_11 + IntToStr(S.Warp[1]));

  for I := 2 to 6 do
  begin
    if (S.Warp[I] > 0) then
      TWXServer.Broadcast(ANSI_2 + ' - ' + ANSI_11 + IntToStr(S.Warp[I]))
    else
      Break;
  end;

  BackDoors := TWXDatabase.GetBackDoors(S, Index);

  if (BackDoors.Count > 0) then
    TWXServer.Broadcast(ANSI_4 + '  (backdoors)' + ANSI_7);

  FreeList(BackDoors, 2);
  TWXServer.Broadcast(endl + endl + endl);
end;


// ***************************************************************
// TModMenu implementation


procedure TModMenu.AfterConstruction;
var
  DatabaseMenu,
  SetupMenu,
  SptMenu,
  DataMenu,
  PortMenu,
  Menu         : TTWXMenuItem;
begin
  // called by program initialisation
  inherited;

  // menu item list
  MenuItemList := TList.Create;

  // base menus
  MainMenu := TTWXMenuItem.Create(Self, 'TWX_MAIN', 'Main menu', 'Main', #0);
  MainMenu.ScriptMacrosOn := TRUE;
  SptMenu := TTWXMenuItem.Create(Self, 'TWX_SCRIPT', 'Script menu', 'Script', 'S');
  DataMenu := TTWXMenuItem.Create(Self, 'TWX_DATA', 'Data menu', 'Data', 'D');
  PortMenu := TTWXMenuItem.Create(Self, 'TWX_PORT', 'Port menu', 'Port', 'P');
  SetupMenu := TTWXMenuItem.Create(Self, 'TWX_SETUP', 'Setup menu', 'Setup', 'T');
  DatabaseMenu := TTWXMenuItem.Create(Self, 'TWX_DATABASE', 'Database control menu', 'Database', 'D');

  // base menu help text
  SptMenu.Help := 'The script menu contains all the options that allow you to control scripts.';
  DataMenu.Help := 'The data menu contains options that allow you to query the currently selected game database.';
  PortMenu.Help := 'The port menu contains options that allow you to run port-related queries on the currently selected game database.';
  SetupMenu.Help := 'The setup menu reflects all the options in the program Setup Form.  Here you can configure the program just the way you need it.';
  DatabaseMenu.Help := 'The database menu allows you to select and configure TWX Proxy Databases.';

  // script inputs
  ScriptMenu := TTWXMenuItem.Create(Self, 'TWX_SCRIPTTEXT', miScriptInputActivate, '', '', #0);
  ScriptMenuKey := TTWXMenuItem.Create(Self, 'TWX_SCRIPTKEY', miScriptInputActivate, '', '', #0);

  ScriptMenu.ClearLine := FALSE;
  ScriptMenuKey.ClearLine := FALSE;

  // Build hard-coded menu options

  // setup menu options
  with (SetupMenu) do
  begin
    AddItem(DatabaseMenu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LISTENPORT', miListenPort, 'Listen port', 'Port', 'P');
    Menu.Help := 'The listening port is the network port that TWX Proxy will listen on for its telnet clients.  Usually this should be set to 23, unless you are running some other kind of telnet server.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_BUBBLESIZE', miBubbleSize, 'Max bubble size', 'Bubble size', 'B');
    Menu.Help := 'The bubble size is the max size possible of bubbles that are calculated in the data menu.  A higher number of sectors will give you more information on large bubbles, but the calculation will take much longer.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_RECONNECT', miReconnect, 'Auto reconnect', 'Reconnect', 'R');
    Menu.Help := 'If this option is enabled, TWX Proxy will automatically reconnect to the server 3 seconds after it'
      + ' is disconnected.  This is an excellent feature if you are running scripts while you are away from the keyboard, as most scripts are able to resume when they log you back in.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LOG', miLog, 'Logging', 'Logging', 'L');
    Menu.Help := 'If logging is enabled, TWX Proxy will log all game data to a .log file for you to view later.  Scripts are able to turn logging off so that the log file doesn''t get too big.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LOGANSI', miLogAnsi, 'Log ANSI', 'Log ANSI', 'A');
    Menu.Help := 'If ANSI logging is enabled, TWX Proxy will log ANSI codes along with other data logged.  This could be useful if you have some sort of ANSI viewer - as you could view your logs in full colour.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_ACCEPTEXTERNAL', miAcceptExternal, 'Accept external connects', 'External', 'X');
    Menu.Help := 'If accept external connections is enabled, people from outside your computer will be able to connect to TWX Proxy and see things the same way that you do.  Note that they will be locked in view only mode if they connect from outside your local network.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_CACHE', miCache, 'Database cache', 'Cache', 'C');
    Menu.Help := 'If the database cache is turned on, TWX Proxy will store a copy of the selected database in memory, allowing it to access it very quickly.  Turning this off will save you some memory, at the expense of performance.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_RECORDING', miRecording, 'Recording', 'Recording', 'E');
    Menu.Help := 'If recording is turned on, TWX Proxy will try to record everything it sees directly into the selected database.  If this is disabled, all data will be ignored.  Note that most scripts require recording to be enabled to function properly.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_MENUKEY', miMenuKey, 'Terminal menu key', 'Key', 'K');
    Menu.Help := 'The terminal menu key is the key that you need to press to access this menu.  You can set this to any key on the keyboard.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LOCALECHO', miLocalEcho, 'Local echo', 'Local echo', 'H');
    Menu.Help := 'If local echo is enabled, all keypresses that you send to the remove server will be echoed back to your terminal.  This is especially useful if you want to use TWX Proxy for MUDs.';
    AddItem(Menu);
  end;

  // main menu options
  with (MainMenu) do
  begin
    AddItem(SptMenu);
    AddItem(DataMenu);
    AddItem(PortMenu);
    AddItem(SetupMenu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_BURST', miBurst, 'Send burst', 'Burst', 'B');
    Menu.Help := 'The burst option lets you send one block of text straight to the remote server in one ''burst''.  This is basically a one-shot macro - it allows you to move as fast as the game allows you to do so.  '
      + 'To send an ENTER in a burst, use the * character, i.e, to deploy a toll fighter: f1*ct';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_REPEATBURST', miBurstRepeat, 'Repeat last burst', 'Burst', 'R');
    Menu.Help := 'The repeat burst option repeats the last burst you sent to the remote server.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_EDITBURST', miBurstEdit, 'Edit/Send last burst', 'Burst', 'E');
    Menu.Help := 'The edit burst option opens up the last burst you sent, so that you can change it before sending it again.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_CONNECT', miConnect, 'Connect/Disconnect from server', '', 'C');
    Menu.Help := 'This option will immediately connect or disconnect you from the remote server.  The remote server address is configured in the database setup menu, under setup.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_STOPALLFAST', miStopScript, 'Stop all scripts', '', 'Z');
    Menu.Help := 'This option will immediately terminate all active non-system scripts.  Remember this option for if you ever run a script that gets out of control.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_TOGGLEDEAF', miToggleDeaf, 'Toggle deaf client', '', '=');
    Menu.Help := 'Deafs clients are telnet terminals that don''t receive anything from the remote server.  This option will '
      + 'turn your connected terminal into a ''deaf'' terminal.  This is great if you have a fast-paced script running in the background and you want to query your database.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_STREAMINGMODE', miStreamingMode, 'Enable Streaming Mode', '', '/');
    Menu.Help := 'Enables streaming mode for this client. This will '
      + 'allow you to share your screan without revealing your location or the location of your assets.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWCLIENTS', miShowClients, 'Show all clients', '', '-');
    Menu.Help := 'This option will show all telnet terminals connected to TWX Proxy, along with their IP addresses.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_EXIT', miExit, 'Exit Program', '', 'X');
    Menu.Help := 'This option will immediately shut down TWX Proxy, disconnecting from the remote server.';
    AddItem(Menu);
  end;

  // script menu options
  with (SptMenu) do
  begin
//    Menu := TTWXMenuItem.Create(Self, 'TWX_LOADBOT', miLoadBot, 'Bot Load / Switch', 'Bot Load / Switch', 'B');
//    Menu.Help := 'This option will load / switch the active Bot. This will also terminate ALL active scripts.';
//    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LOADSCRIPT', miLoad, 'Load script', 'Load Script', 'S');
    Menu.Help := 'The load script option will load and begin execution of a TWX Proxy script.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LOADLASTSCRIPT', miLoadLast, 'Load last script', '', 'L');
    Menu.Help := 'This option will reload the last script you executed.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_STOPALL', miStopScript, 'Stop all scripts', '', 'X');
    Menu.Help := 'This option will immediately terminate all active non-system scripts.  Remember this option for if you ever run a script that gets out of control.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DUMPSCRIPTVARS', miDumpVars, 'Dump script variables', '', 'V');
    Menu.Help := 'This option will move through every active script, showing variables and their values.  This is a very useful debugging tool - but it can take a while if you have lots of variables in your scripts.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DUMPSCRIPTTRIGGERS', miDumpTriggers, 'Dump all script triggers', '', 'T');
    Menu.Help := 'This option will move through every active script, showing all active triggers.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LISTACTIVE', miListActive, 'List active scripts', '', 'I');
    Menu.Help := 'This option will list all the scripts you currently have running, along with the IDs.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LISTDIRECTORY', miListDirectory, 'List script directory', '', 'D');
    Menu.Help := 'This option will list all the scripts in your \scripts folder.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_KILL', miKill, 'Kill script by ID', 'Kill', 'K');
    Menu.Help := 'This option will take the ID number of any script you have running and immediately terminate it.';
    AddItem(Menu);
  end;

  // data menu options
  with (DataMenu) do
  begin
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWSECTOR', miShowSector, 'Display sector as last seen', 'Sector', 'D');
    Menu.Help := 'This option will display a sector as TWX Proxy last saw it.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWFIGS', miShowFigs, 'Show all sectors with foreign fighters', '', 'F');
    Menu.Help := 'This option will show all the sectors TWX Proxy has seen with enemy fighters in them.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWMINES', miShowMines, 'Show all sectors with mines', '', 'M');
    Menu.Help := 'This option will show all the sectors TWX Proxy has seen with mines in them.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWDENSITY', miShowDensity, 'Show all sectors by density comparison', 'Density', 'S');
    Menu.Help := 'This option will show all sectors that match a particular density range.  Note that this can only show sectors that have been density scanned before.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWANOM', miShowAnomaly, 'Show all sectors with Anomaly', '', 'A');
    Menu.Help := 'This option will show all the sectors that have been picked up with an Anomaly by density scans.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWTRADERS', miShowTraders, 'Show all sectors with traders', '', 'R');
    Menu.Help := 'This option will show all the sectors have been seen with other traders in them.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_PLOTCOURSE', miPlotCourse, 'Plot warp course', 'Sector', 'C');
    Menu.Help := 'This option will allow you to plot a warp course between two sectors, internally within TWX Proxy.  Note that you need to have at least a semi-completed ZTM for this option to work properly.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_HOLOSCAN', miHoloscan, 'Simulate holo scan', 'Sector', 'H');
    Menu.Help := 'This option will simulate a holo-scan from a certain sector.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_TOTALSCANNED', miShowTotal, 'Show total sectors scanned', '', 'T');
    Menu.Help := 'This option will show a ratio of how many sectors have been explored, scanned, etc.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWBUBBLES', miShowBubbles, 'Show bubbles found', '', 'B');
    Menu.Help := 'This option will calculate and list all the bubbles found within a game.  Note that this bubble list is a reflection of how accurate your ZTM.  If ZTM hasn''t been done yet, your bubble list will likely be very inaccurate.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWBUBBLE', miShowBubble, 'Show bubble details', 'Sector', 'Z');
    Menu.Help := 'This option will calculate a single bubble, you only need to know the gate and a sector within the bubble.  You need to have visited the bubble or have a fairly accurate ZTM for this option to work properly.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWBACKDOORS', miShowBackdoors, 'Show backdoors to specific sector', 'Sector', '-');
    Menu.Help := 'This option will show all the backdoors TWX Proxy knows about to a certain sector.';
    AddItem(Menu);
  end;

  // port menu options
  with (PortMenu) do
  begin
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWPORT', miShowPort, 'Show port details as last seen', 'Sector', 'D');
    Menu.Help := 'This option will show a particular port as it was reported in your last port CIM check.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_SHOWSPECIALPORT', miShowClassPort, 'Show all class 0/9 port sectors', '', '0');
    Menu.Help := 'This option will display the sectors of all class 0 or stardock ports that TWX Proxy has seen.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LISTPORTS', miListPorts, 'List all ports', '', 'L');
    Menu.Help := 'This option will show a summary of all the ports TWX Proxy has seen.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_LISTUPGRADEDPORTS', miListUpgradedPorts, 'List all heavily upgraded ports', '', 'U');
    Menu.Help := 'This option will show a summary of all ports that have been upgraded to a max of 10,000 or more in any one product category.';
    AddItem(Menu);
  end;

  // game menu options
  with (DatabaseMenu) do
  begin
    Menu := TTWXMenuItem.Create(Self, 'TWX_DATABASE_CREATE', miDatabaseCreate, 'Create database', '', 'C');
    Menu.Help := 'This option will create a new database, with details that you enter.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DATABASE_EDIT', miDatabaseEdit, 'Edit database', '', 'E');
    Menu.Help := 'This option will edit the details of an existing database.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DATABASE_DELETE', miDatabaseDelete, 'Delete database', '', 'D');
    Menu.Help := 'This option will permanently delete an existing database.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DATABASE_SELECT', miDatabaseSelect, 'Select active database', 'Name', 'S');
    Menu.Help := 'This option can be used to change the selected database.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DATABASE_LIST', miDatabaseList, 'List databases', '', 'L');
    Menu.Help := 'This option will list all the databases TWX Proxy knows about.';
    AddItem(Menu);
    Menu := TTWXMenuItem.Create(Self, 'TWX_DATABASE_VIEW', miDatabaseView, 'View database details', '', 'V');
    Menu.Help := 'This option will display the details of a particular database.';
    AddItem(Menu);
  end;
end;

procedure TModMenu.BeforeDestruction;
begin
  // free up menu items
  while (MenuItemList.Count > 0) do
     TTWXMenuItem(MenuItemList[0]).Free;

  MenuItemList.Free;

  inherited;
end;

procedure TModMenu.StateValuesLoaded;
begin
  // this is called when all modules have been fully initialised

  // grab the setup from the other modules to where we can access it
  ApplySetup;
end;

function TModMenu.GetProgramDir: string;
begin
  Result := FProgramDir;
end;

procedure TModMenu.SetProgramDir(const Value: string);
begin
  FProgramDir := Value;
end;

function TModMenu.AddCustomMenu(Parent, Name, Title, Reference, Prompt : string; HotKey : Char; CloseActivate : Boolean; ScriptOwner : TScript) : TTWXMenuItem;
begin
  Result := TTWXMenuItem.Create(Self, Name, Title, Prompt, HotKey);
  Result.Reference := UpperCase(Reference);
  Result.CloseActivate := CloseActivate;
  Result.ScriptOwner := ScriptOwner;
  Result.IsCustom := TRUE;

  if (Parent <> '') then
    GetMenuByName(Parent).AddItem(Result);
end;

procedure TModMenu.LinkMenu(Item : TTWXMenuItem);
begin
  // add menu item to menu list
  MenuItemList.Add(Item);
end;

procedure TModMenu.UnlinkMenu(Item : TTWXMenuItem);
begin
  // remove menu item from menu list
  MenuItemList.Remove(Item);
end;

procedure TModMenu.OpenMenu(MenuName : string; ClientIndex : Byte); // do NOT call with mtNone
var
  LastMenuName : string;
begin
  if (FCurrentMenu <> nil) then
    LastMenuName := FCurrentMenu.Name
  else
    LastMenuName := '';

  OpenMenuItem(GetMenuByName(MenuName), ClientIndex, LastMenuName);
end;

procedure TModMenu.CloseMenu(TerminateScript : Boolean);
var
  Menu : TTWXMenuItem;
begin
  CurrentMenu.Line := '';
  Menu := FCurrentMenu;
  FCurrentMenu := nil;

  if (TerminateScript) then
  begin
    if (Menu.ScriptOwner <> nil) then
      TWXInterpreter.StopByHandle(Menu.ScriptOwner) // terminate parent script
    else if (Menu = ScriptMenu) or (Menu = ScriptMenuKey) then
      TWXInterpreter.StopByHandle(InputScript);
  end;

  if (TWXClient.Connected) and (TWXExtractor.CurrentANSILine <> '') then
    TWXServer.Broadcast(#13 + ANSI_CLEARLINE + TWXExtractor.CurrentANSILine)
  else
    TWXServer.Broadcast(#13 + ANSI_CLEARLINE);
end;

procedure TModMenu.MenuText(Text : string; ClientIndex : Byte);
var
  I : Integer;
begin
  // break the text down into individual characters and process separately
  for I := 1 to Length(Text) do
    if (CurrentMenu <> nil) then
      CurrentMenu.MenuKey(Text[I], ClientIndex)
    else
      Break;
end;

procedure TModMenu.OpenMenuItem(Item : TTWXMenuItem; ClientIndex : Byte; LastMenuName : string);
  procedure CallComplete;
  begin
    if not (Assigned(Item.OnLineComplete)) and (Item.MenuItems.Count = 0) and (FCurrentMenu <> nil) and (Item.ParentMenu <> nil) and (Item = FCurrentMenu) then
      OpenMenuItem(Item.ParentMenu, ClientIndex, FCurrentMenu.Name) // go back to parent menu
    else if (FCurrentMenu <> nil) and (FCurrentMenu = Item) then  // menu may have been closed in activation procedure
    begin
      if (LastMenuName = '') or not (Item.ClearLine) then
        TWXServer.Broadcast(GetPrompt)
      else
        TWXServer.Broadcast(#13 + ANSI_CLEARLINE + GetPrompt); // go over existing menu prompt
    end;
  end;
var
  GotoFailed,
  ShowPrompt : Boolean;
begin
  FCurrentMenu := Item;

  if (Item.MenuItemCount > 0) and (Item.ScriptOwner <> nil) then
  begin
    Item.DumpOptions; // display options when menu is shown (if an in-script menu)
    ShowPrompt := TRUE;
  end
  else
    ShowPrompt := FALSE;

  if (Item.Reference <> '') then
  begin
    if (Item.Reference[1] = ':') and (Item.ScriptOwner <> nil) then
    begin
      GotoFailed := FALSE;

      try
        Item.ScriptOwner.GotoLabel(Item.Reference);
      except
        on E : EScriptError do
        begin
          TWXServer.Broadcast(ANSI_15 + 'Script run-time error (menu activation): ' + ANSI_7 + E.Message + endl);
          Item.ScriptOwner.Controller.StopByHandle(Item.ScriptOwner);
          GotoFailed := TRUE;
        end;
      else
        TWXServer.Broadcast(ANSI_15 + 'Unknown script run-time error (menu activation)' + ANSI_7 + endl);
        Item.ScriptOwner.Controller.StopByHandle(Item.ScriptOwner);
        GotoFailed := TRUE;
      end;

      if not (GotoFailed) then
        if (Item.ScriptOwner.Execute) then
        begin
          // script was self-terminated, close the menu with it
          if (FCurrentMenu <> nil) then
            CloseMenu(FALSE);

          Exit;
        end;
    end
    else
      TWXInterpreter.Load(FetchScript(Item.Reference, FALSE), TRUE);

    if (Item.CloseActivate) then
      CloseMenu(FALSE)
    else
      CallComplete;
  end
  else if (Assigned(Item.OnActivate)) then
  begin
    // call menu's activation procedure
    Item.OnActivate(ClientIndex);
    CallComplete;
  end
  else if (LastMenuName <> '') and not (ShowPrompt) and (Item.ClearLine) then
    TWXServer.Broadcast(#13 + ANSI_CLEARLINE + GetPrompt) // go over existing menu prompt
  else if ((TWXExtractor.CurrentLine = '') and not (ShowPrompt)) or not (Item.ClearLine) then
    TWXServer.Broadcast(GetPrompt)
  else if not (ShowPrompt) then
    TWXServer.Broadcast(endl + GetPrompt); // don't go over text received from server
end;

function TModMenu.GetPrompt : String;
begin
  Result := CurrentMenu.GetPrompt;
end;

procedure TModMenu.BeginScriptInput(Script : TScript; VarParam : TVarParam; SingleKey : Boolean);
begin
  FInputScript := Script;
  InputScriptVar := VarParam;

  if (SingleKey) then
    OpenMenu('TWX_SCRIPTKEY', 0)
  else
    OpenMenu('TWX_SCRIPTTEXT', 0);
end;

procedure TModMenu.ApplySetup;
  function BoolToStr(B : Boolean) : string;
  begin
    if (B) then
      Result := 'ON'
    else
      Result := 'OFF';
  end;
begin
  // set items in setup menu to match this program setup
  //GetMenuByName('TWX_LISTENPORT').Value := IntToStr(TWXDatabase.ListenPort);
  GetMenuByName('TWX_BUBBLESIZE').Value := IntToStr(TWXBubble.MaxBubbleSize);
  GetMenuByName('TWX_RECONNECT').Value := BoolToStr(TWXClient.Reconnect);
  GetMenuByName('TWX_LOG').Value := BoolToStr(TWXLog.LogEnabled);
  GetMenuByName('TWX_LOGANSI').Value := BoolToStr(TWXLog.LogANSI);
  GetMenuByName('TWX_ACCEPTEXTERNAL').Value := BoolToStr(TWXServer.AcceptExternal);
  GetMenuByName('TWX_CACHE').Value := BoolToStr(TWXDatabase.UseCache);
  GetMenuByName('TWX_RECORDING').Value := BoolToStr(TWXDatabase.Recording);
  GetMenuByName('TWX_MENUKEY').Value := TWXExtractor.MenuKey;
  GetMenuByName('TWX_LOCALECHO').Value := BoolToStr(TWXServer.LocalEcho);
end;

function TModMenu.GetMenuByName(MenuName : string) : TTWXMenuItem;
var
  I : Integer;
begin
  Result := nil;

  if (MenuItemList.Count > 0) then
    for I := 0 to MenuItemList.Count - 1 do
      if (TTWXMenuItem(MenuItemList[I]).Name = MenuName) then
      begin
        Result := TTWXMenuItem(MenuItemList[I]);
        Break;
      end;

  if (Result = nil) then
    raise EMenuException.Create('Cannot find menu ''' + MenuName + '''');


  // MB - this is no longer a setting, but stored in database header
  if (MenuName = 'TWX_LISTENPORT') then
    Result.Value := IntToStr(TWXDatabase.ListenPort);
end;


// ***************************************************************
// TModMenu: Menu event implementation


procedure TModMenu.miBurst(ClientIndex : Byte);
begin
  // set for when input is complete
  CurrentMenu.OnLineComplete := miBurst2;
end;

procedure TModMenu.miBurst2(ClientIndex : Byte);
begin
  // throw burst to server
  TWXClient.Send(StringReplace(CurrentMenu.Line, '*', #13, [rfReplaceAll]));
  LastBurst := CurrentMenu.Line;
  CloseMenu(FALSE);
end;

procedure TModMenu.miBurstRepeat(ClientIndex : Byte);
begin
  TWXClient.Send(StringReplace(LastBurst, '*', #13, [rfReplaceAll]));
end;

procedure TModMenu.miBurstEdit(ClientIndex : Byte);
begin
  CurrentMenu.Line := LastBurst;
  CurrentMenu.OnLineComplete := miBurst2;
end;

procedure TModMenu.miConnect(ClientIndex : Byte);
begin
  CloseMenu(FALSE);
  if TWXGUI.Connected then
     TWXClient.Disconnect
  else
    TWXClient.ConnectNow;
end;

procedure TModMenu.miStopScript(ClientIndex : Byte);
begin
  CloseMenu(FALSE);
  TWXServer.ClientMessage('Stopping all non-system scripts');
  TWXInterpreter.StopAll(FALSE);
end;

procedure TModMenu.miToggleDeaf(ClientIndex : Byte);
begin
  if (ClientIndex > TWXServer.ClientCount - 1) then
    Exit;

  if (TWXServer.ClientTypes[ClientIndex] = ctStandard) then
  begin
    TWXServer.ClientMessage('Client ' + IntToStr(ClientIndex) + ' is now deaf');
    TWXServer.ClientTypes[ClientIndex] := ctDeaf;
  end
  else
  begin
    TWXServer.ClientMessage('Client ' + IntToStr(ClientIndex) + ' is no longer deaf');
    TWXServer.ClientTypes[ClientIndex] := ctStandard;
  end;
end;

procedure TModMenu.miStreamingMode(ClientIndex : Byte);
begin
  if (ClientIndex > TWXServer.ClientCount - 1) then
    Exit;

  TWXServer.ClientMessage('Client ' + IntToStr(ClientIndex) + ' is now in Streaming Mode');
  TWXServer.ClientTypes[ClientIndex] := ctStream;
end;

procedure TModMenu.miShowClients(ClientIndex : Byte);
var
  I  : Integer;
  M1,
  M2 : String;
begin
  TWXServer.Broadcast(#13 + MENU_LIGHT + '#   Address:        Type:' + endl + endl);

  for I := 0 to TWXServer.ClientCount - 1 do
  begin
    M1 := IntToStr(I);
    M2 := M1 + GetSpace(4 - Length(M1));
    M1 := TWXServer.ClientAddresses[I];
    M2 := M2 + M1 + GetSpace(16 - Length(M1));

    if (TWXServer.ClientTypes[I] = ctStandard) then
      M1 := 'STANDARD'
    else if (TWXServer.ClientTypes[I] = ctMute) then
      M1 := 'VIEW ONLY'
    else if (TWXServer.ClientTypes[I] = ctDeaf) then
      M1 := 'DEAF'
    else if (TWXServer.ClientTypes[I] = ctStream) then
      M1 := 'STREAMING';

    M2 := M2 + M1 + endl;
    TWXServer.Broadcast(M2);
  end;

  TWXServer.Broadcast(endl);
end;

procedure TModMenu.miExit(ClientIndex : Byte);
begin
  // exit program
  Application.Terminate;
end;


// --------------------
// Script menu


procedure TModMenu.miLoad(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miLoad2;
end;

procedure TModMenu.miLoad2(ClientIndex : Byte);
var
  ScriptName : String;
begin
  ScriptName := CurrentMenu.Line;
  CloseMenu(FALSE);

  TWXInterpreter.Load(FetchScript(ScriptName, FALSE), FALSE);
end;

procedure TModMenu.miLoadLast(ClientIndex : Byte);
begin
  if (TWXInterpreter.LastScript = '') then
  begin
    CloseMenu(FALSE);
    TWXServer.ClientMessage('You have loaded no scripts this session.');
  end
  else
  begin
    CloseMenu(FALSE);
    TWXInterpreter.Load(TWXInterpreter.LastScript, FALSE);
  end;
end;

procedure TModMenu.miDumpVars(ClientIndex : Byte);
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter a full or partial variable name to search for (or blank to list them all)' + endl);
  CurrentMenu.OnLineComplete := miDumpVars2;
end;

procedure TModMenu.miDumpVars2(ClientIndex : Byte);
begin
  TWXInterpreter.DumpVars(CurrentMenu.Line);
  TWXServer.Broadcast(endl);
end;

procedure TModMenu.miDumpTriggers(ClientIndex : Byte);
begin
  TWXInterpreter.DumpTriggers;
  TWXServer.Broadcast(endl);
end;

procedure TModMenu.miListActive(ClientIndex : Byte);
var
  I : Integer;
begin
  // list all active scripts

  if (TWXInterpreter.Count > 0) then
  begin
    TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'ID' + #9 + 'File' + endl + endl);

    for I := 0 to TWXInterpreter.Count - 1 do
      TWXServer.Broadcast(MENU_MID + IntToStr(I) + #9 + MENU_DARK + TWXInterpreter.Scripts[I].Cmp.ScriptFile + endl);
  end
  else
    TWXServer.Broadcast(endl + endl + 'No scripts are active');

  TWXServer.Broadcast(endl);
end;

procedure TModMenu.miListDirectory(ClientIndex : Byte);
var
  SearchRec : TSearchRec;
  HighLight : Boolean;
begin
  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Listing contents of script directory' + endl + endl);

  if (FindFirst('scripts\*.*', faAnyFile, SearchRec) = 0) then
  begin
    repeat
      HighLight := FALSE;

      if (Length(SearchRec.Name) > 4) then
        if (UpperCase(Copy(SearchRec.Name, Length(SearchRec.Name) - 2, 3)) = '.TS')
          or (UpperCase(Copy(SearchRec.Name, Length(SearchRec.Name) - 3, 4)) = '.CTS') then
          HighLight := TRUE;

      if (HighLight) then
        TWXServer.Broadcast(MENU_MID + SearchRec.Name + endl)
      else
        TWXServer.Broadcast(MENU_DARK + SearchRec.Name + endl);
    until (FindNext(SearchRec) <> 0);

    TWXServer.Broadcast(endl);
    FindClose(SearchRec);
  end;
end;

procedure TModMenu.miKill(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miKill2;
end;

procedure TModMenu.miKill2(ClientIndex : Byte);
var
  I : Integer;
begin
  try
    I := StrToInt(CurrentMenu.Line);
  except
    I := -1;
  end;

  if (I < 0) or (I >= TWXInterpreter.Count) then
    TWXServer.ClientMessage('Bad script ID')
  else
    TWXInterpreter.Stop(I);
end;


// ------------------
// Data menu


procedure TModMenu.miShowSector(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miShowSector2;
end;

procedure TModMenu.miShowSector2(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  I := StrToIntSafe(CurrentMenu.Line);

  if (I < 1) or (I > TWXDatabase.DBHeader.Sectors) then
  begin
    TWXServer.Broadcast(endl + MENU_LIGHT + 'That is not a valid sector' + endl + endl);
  end
  else
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Explored = etNo) then
      TWXServer.Broadcast(endl + MENU_LIGHT + 'That sector has not been recorded' + endl + endl)
    else
    begin
      // Display this sector
      DisplaySector(S, I);
    end;
  end;
end;

procedure TModMenu.miShowFigs(ClientIndex : Byte);
var
  S : TSector;
  I : Integer;
begin
  // Scan through sectors showing sectors with fighters in them
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Showing all sectors with foreign fighters in them...' + endl + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Figs.Quantity > 0) and (S.Figs.Owner <> 'belong to your Corp') and (S.Figs.Owner <> 'yours') and (S.Explored <> etNo) then
      DisplaySector(S, I);
  end;
  
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Completed.' + endl + endl);
end;

procedure TModMenu.miShowMines(ClientIndex : Byte);
var
  S : TSector;
  I : Integer;
begin
  // Scan through sectors showing sectors with mines in them
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Showing all sectors with mines in them...' + endl + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Mines_Armid.Quantity > 0) and (S.Explored <> etNo) then
      DisplaySector(S, I);
  end;

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Completed.' + endl + endl);
end;

procedure TModMenu.miShowDensity(ClientIndex : Byte);
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter the lowest density to display' + endl + endl);
  CurrentMenu.OnLineComplete := miShowDensity2;
end;

procedure TModMenu.miShowDensity2(ClientIndex : Byte);
var
  I : ^Integer;
begin
  I := AllocMem(SizeOf(Integer));
  I^ := StrToIntSafe(CurrentMenu.Line);
  CurrentMenu.AddParam(I);

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter the highest density to display' + endl + endl);
  CurrentMenu.OnLineComplete := miShowDensity3;
end;

procedure TModMenu.miShowDensity3(ClientIndex : Byte);
var
  X,
  I : Integer;
  S : TSector;
begin
  I := StrToIntSafe(CurrentMenu.Line);

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Showing all sectors within the specified density range' + endl);

  for X := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(X);

    if (S.Density <= I) and (S.Density >= Integer(CurrentMenu.GetParam(0)^)) then
      DisplaySector(S, X);
  end;

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Completed.' + endl + endl);
end;

procedure TModMenu.miShowAnomaly(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Showing all sectors with Anomaly' + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Anomaly) and (S.Explored <> etNo) then
      DisplaySector(S, I);
  end;

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Completed.' + endl + endl);
end;

procedure TModMenu.miShowTraders(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Showing sectors with traders' + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Traders > 0) and (S.Explored > etNo) then
      DisplaySector(S, I);
  end;

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Completed.' + endl + endl);
end;

procedure TModMenu.miPlotCourse(ClientIndex : Byte);
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'From:' + endl + endl);
  CurrentMenu.OnLineComplete := miPlotCourse2;
end;

procedure TModMenu.miPlotCourse2(ClientIndex : Byte);
var
  I : ^Integer;
begin
  I := AllocMem(SizeOf(Integer));
  I^ := StrToIntSafe(CurrentMenu.Line);
  CurrentMenu.AddParam(I);
  
  TWXServer.Broadcast(endl + MENU_LIGHT + 'To:' + endl + endl);
  CurrentMenu.OnLineComplete := miPlotCourse3;
end;

procedure TModMenu.miPlotCourse3(ClientIndex : Byte);
var
  WarpFrom,
  I        : Integer;
  Lane     : TList;
begin
  I := StrToIntSafe(CurrentMenu.Line);
  WarpFrom := Integer(CurrentMenu.GetParam(0)^);

  if (I < 1) or (I > TWXDatabase.DBHeader.Sectors) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'That is not a valid sector' + endl)
  else
  begin
    try
      Lane := TWXDatabase.PlotWarpCourse(WarpFrom, I);
      TWXServer.Broadcast(endl);

      if (Lane.Count = 0) then
        TWXServer.Broadcast(endl + MENU_LIGHT + 'Insufficient mapping data to plot warp course.' + endl)
      else
      begin
        TWXServer.Broadcast(endl + MENU_LIGHT + 'Warp lane from ' + MENU_MID + IntToStr(WarpFrom)
         + MENU_LIGHT + ' to ' + MENU_MID + IntToStr(I) + MENU_LIGHT + ' (' + IntToStr(Lane.Count - 1)
         + ' hops):' + endl + endl + ANSI_7);
        for I := Lane.Count - 1 downto 0 do
        begin
          TWXServer.Broadcast(IntToStr(Word(Lane[I]^)));

          if (I > 0) then
            TWXServer.Broadcast(' > ');

          // This List's memory is persistent, and no longer needs freeing
          //FreeMem(Lane[I]);
          Lane.Delete(I);
        end;

        TWXServer.Broadcast(endl + endl);
      end;

      Lane.Free;
    except
      TWXServer.Broadcast(endl + MENU_LIGHT + 'Error while mapping warp course' + endl);
    end;
  end;
end;

procedure TModMenu.miHoloscan(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miHoloscan2;
end;

procedure TModMenu.miHoloscan2(ClientIndex : Byte);
var
  I,
  X : Integer;
  S,
  L : TSector;
begin
  I := StrToIntSafe(CurrentMenu.Line);

  if (I < 1) or (I > TWXDatabase.DBHeader.Sectors) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'That is not a valid sector' + endl)
  else
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Explored = etNo) then
      TWXServer.Broadcast(endl + MENU_LIGHT + 'That sector has not been recorded' + endl)
    else
    begin
      // Display sectors
      for X := 1 to 6 do
        if (S.Warp[X] > 0) then
        begin
          L := TWXDatabase.LoadSector(S.Warp[X]);

          if (L.Explored <> etNo) then
            DisplaySector(L, S.Warp[X]);
        end;
    end;
  end;
end;

procedure TModMenu.miShowTotal(ClientIndex : Byte);
var
  I,
  Holo,
  Density,
  Calc,
  Scanned : Integer;
  S       : TSector;
begin
  // Show the number of sectors seen or scanned
  if (TWXDatabase.DBHeader.Sectors > 0) then
  begin
    TWXServer.Broadcast(endl + MENU_LIGHT + 'Querying database...' + endl);
    Holo := 0;
    Density := 0;
    Calc := 0;
    Scanned := 0;

    for I := 1 to TWXDatabase.DBHeader.Sectors do
    begin
      S := TWXDatabase.LoadSector(I);

      if (S.Explored = etHolo) then
      begin
        Inc(Holo);
        Inc(Scanned);

        if (S.Density > -1) then
          Inc(Density);
      end
      else if (S.Explored = etDensity) then
      begin
        Inc(Density);
        Inc(Scanned);
      end
      else if (S.Explored = etCalc) then
        Inc(Calc);
    end;

    TWXServer.Broadcast(endl + MENU_LIGHT + 'Scanned Sector Summary' +
                    endl +
                    endl + MENU_LIGHT + 'Visual/holo: ' + MENU_MID + IntToStr(Holo) + ' (' + IntToStr(Holo * 100 DIV TWXDatabase.DBHeader.Sectors) + '%)' +
                    endl + MENU_LIGHT + 'Density: ' + MENU_MID + IntToStr(Density) + ' (' + IntToStr(Density * 100 DIV TWXDatabase.DBHeader.Sectors) + '%)' +
                    endl + MENU_LIGHT + 'Calculation: ' + MENU_MID + IntToStr(Calc) + ' (' + IntToStr(Calc * 100 DIV TWXDatabase.DBHeader.Sectors) + '%)' +
                    endl + MENU_LIGHT + 'Total scanned: ' + MENU_MID + IntToStr(Scanned) + ' (' + IntToStr(Scanned * 100 DIV TWXDatabase.DBHeader.Sectors) + '%)' +
                    endl + MENU_LIGHT + 'Total accounted for: ' + MENU_MID + IntToStr(Scanned + Calc) + ' (' + IntToStr((Scanned + Calc) * 100 DIV TWXDatabase.DBHeader.Sectors) + '%)' +
                    endl + endl);
  end
  else
    TWXServer.Broadcast(endl + MENU_LIGHT + 'No sectors to compute.' + endl);

{$IFNDEF RELEASE}
  DumpHeapStatus;
  DumpScriptCmdStatus;
{$ENDIF}

end;

procedure TModMenu.miShowBubbles(ClientIndex : Byte);
begin
  // Look for bubbles
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Calculating bubbles, please wait...' + endl);
  TWXBubble.DumpBubbles;
  TWXServer.Broadcast(endl);
end;

procedure TModMenu.miShowBubble(ClientIndex : Byte);
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter bubble gateway sector' + endl);
  CurrentMenu.OnLineComplete := miShowBubble2;
end;

procedure TModMenu.miShowBubble2(ClientIndex : Byte);
var
  I : ^Integer;
begin
  I := AllocMem(SizeOf(Integer));
  I^ := StrToIntSafe(CurrentMenu.Line);
  CurrentMenu.AddParam(I);
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter a sector within the bubble' + endl);
  CurrentMenu.OnLineComplete := miShowBubble3;
end;

procedure TModMenu.miShowBubble3(ClientIndex : Byte);
var
  BubbleGate,
  I          : Integer;
  Lane       : TList;
begin
  I := StrToIntSafe(CurrentMenu.Line);
  BubbleGate := Integer(CurrentMenu.GetParam(0)^);

  if (I < 1) or (I > TWXDatabase.DBHeader.Sectors) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'That is not a valid sector' + endl)
  else
  begin
    // find interior sector
    try
      Lane := TWXDatabase.PlotWarpCourse(BubbleGate, I);

      if (Lane.Count = 0) then
        TWXServer.Broadcast(endl + MENU_LIGHT + 'Insufficient warp data to map bubble interior' + endl)
      else
      begin
        TWXServer.Broadcast(endl + endl);
        TWXBubble.ShowBubble(BubbleGate, Word(Lane.Items[Lane.Count - 2]^));
      end;

      FreeList(Lane, 2);
    except
      TWXServer.Broadcast(endl + MENU_LIGHT + 'Error while mapping bubble (insufficient warp data?)' + endl);
    end;
  end;
end;

procedure TModMenu.miShowBackdoors(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miShowBackdoors2;
end;

procedure TModMenu.miShowBackdoors2(ClientIndex : Byte);
var
  I    : Integer;
  Index: Integer;
  Lane : TList;
  S    : TSector;
begin
  I := StrToIntSafe(CurrentMenu.Line);

  if (I < 1) or (I > TWXDatabase.DBHeader.Sectors) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'That is not a valid sector' + endl)
  else
  begin
    TWXServer.Broadcast(endl + MENU_LIGHT + 'Displaying all backdoors to sector ' + CurrentMenu.Line + endl);
    S := TWXDatabase.LoadSector(I);

    Lane := TWXDatabase.GetBackDoors(S, I);

    for I := 0 to Lane.Count - 1 do
    begin
      Index := Word(Lane.Items[I]^);
      DisplaySector(TWXDatabase.LoadSector(Index), Index);
    end;

    FreeList(Lane, 2);
  end;
end;


// ----------------------
// Port menu


procedure TModMenu.miShowPort(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miShowPort2;
end;

procedure TModMenu.miShowPort2(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  I := StrToIntSafe(CurrentMenu.Line);

  if (I < 1) or (I > TWXDatabase.DBHeader.Sectors) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'That is not a valid sector' + endl)
  else
  begin
    S := TWXDatabase.LoadSector(I);
    if (S.SPort.Name = '') then
      TWXServer.Broadcast(endl + MENU_LIGHT + 'That port has not been recorded or does not exist' + endl)
    else if (S.SPort.Update = 0) then
      TWXServer.Broadcast(endl + MENU_LIGHT + 'That port has not been recorded' + endl)
    else
    begin
      // Display this sector
      DisplayPort(S, I);
    end;
  end;
end;

procedure TModMenu.miShowClassPort(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Showing all sectors with class 0 or 9 ports...' + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.SPort.Name <> '') and ((S.SPort.ClassIndex = 0) or (S.SPort.ClassIndex = 9)) then
      DisplaySector(S, I);
  end;

  TWXServer.Broadcast(endl + MENU_LIGHT + 'Completed.' + endl);
end;

procedure TModMenu.miListPorts(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Sector Class Fuel Ore     Organics     Equipment    Updated'
                          + endl + '-------------------------------------------------------------'
                          + endl + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.SPort.Name <> '') and (S.SPort.ClassIndex > 0) and (S.SPort.ClassIndex < 9) then
      DisplayPortSummary(S, I);
  end;

  if (TWXDatabase.DBHeader.LastPortCIM = 0) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'No port CIM check has taken place.' + endl + 'You can do port/warp CIM checks by pressing ^ inside the game' + endl + endl)
  else
    TWXServer.Broadcast(endl + MENU_LIGHT + 'Last port CIM check took place on ' + Day[DayOfWeek(TWXDatabase.DBHeader.LastPortCIM)] + ' ' + DateToStr(TWXDatabase.DBHeader.LastPortCIM) + ' at ' + TimeToStr(TWXDatabase.DBHeader.LastPortCIM) + endl
                                   + 'Ports in red were not updated in the last CIM check' + endl + endl);
end;

procedure TModMenu.miListUpgradedPorts(ClientIndex : Byte);
var
  I : Integer;
  S : TSector;
begin
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Sector Class Fuel Ore     Organics     Equipment    Updated'
                          + endl + '-------------------------------------------------------------'
                          + endl + endl);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.SPort.Name <> '') and (S.SPort.ClassIndex > 0) and (S.SPort.ClassIndex < 9)
     and ((S.SPort.ProductAmount[ptFuelOre] * (100 / (S.SPort.ProductPercent[ptFuelOre] + 1)) >= 10000)
     or (S.SPort.ProductAmount[ptOrganics] * (100 / (S.SPort.ProductPercent[ptOrganics] + 1)) >= 10000)
     or (S.SPort.ProductAmount[ptEquipment] * (100 / (S.SPort.ProductPercent[ptEquipment] + 1)) >= 10000)) then
      DisplayPortSummary(S, I);
  end;

  if (TWXDatabase.DBHeader.LastPortCIM = 0) then
    TWXServer.Broadcast(endl + MENU_LIGHT + 'No port CIM check has taken place.' + endl + 'You can do port/warp CIM checks by pressing ^ inside the game' + endl + endl)
  else
    TWXServer.Broadcast(endl + MENU_LIGHT + 'Last port CIM check took place on ' + Day[DayOfWeek(TWXDatabase.DBHeader.LastPortCIM)] + ' ' + DateToStr(TWXDatabase.DBHeader.LastPortCIM) + ' at ' + TimeToStr(TWXDatabase.DBHeader.LastPortCIM) + endl
                                   + 'Ports in red were not updated in the last CIM check' + endl + endl);
end;


// ----------------------
// Setup menu


procedure TModMenu.miListenPort(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miListenPort2;
end;

procedure TModMenu.miListenPort2(ClientIndex : Byte);
begin
  // MB - Moved to Database
  //TWXServer.ListenPort := StrToIntSafe(CurrentMenu.Line);
  //TWXServer.Activate;
  TWXDatabase.ListenPort := StrToIntSafe(CurrentMenu.Line);
  CurrentMenu.Value := IntToStr(TWXServer.ListenPort);
end;

procedure TModMenu.miBubbleSize(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miBubbleSize2;
end;

procedure TModMenu.miBubbleSize2(ClientIndex : Byte);
begin
  TWXBubble.MaxBubbleSize := StrToIntSafe(CurrentMenu.Line);
  CurrentMenu.Value := IntToStr(TWXBubble.MaxBubbleSize);
end;

procedure TModMenu.miReconnect(ClientIndex : Byte);
begin
  TWXClient.Reconnect := not TWXClient.Reconnect;

  if (TWXClient.Reconnect) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Auto reconnect is now ' + MENU_MID + CurrentMenu.Value);
end;

procedure TModMenu.miLog(ClientIndex : Byte);
begin
  TWXLog.LogEnabled := not TWXLog.LogEnabled;

  if (TWXLog.LogEnabled) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Logging of data is now ' + MENU_MID + CurrentMenu.Value);
end;

procedure TModMenu.miLogAnsi(ClientIndex : Byte);
begin
  TWXLog.LogANSI := not TWXLog.LogANSI;

  if (TWXLog.LogANSI) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Logging of ANSI data is now ' + MENU_MID + CurrentMenu.Value);
end;

procedure TModMenu.miAcceptExternal(ClientIndex : Byte);
begin
  TWXServer.AcceptExternal := not TWXServer.AcceptExternal;

  if (TWXServer.AcceptExternal) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Accept external connections is now ' + MENU_MID + CurrentMenu.Value);
end;

procedure TModMenu.miCache(ClientIndex : Byte);
begin
  TWXDatabase.UseCache := not TWXDatabase.UseCache;

  if (TWXDatabase.UseCache) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Database cache is now ' + MENU_MID + CurrentMenu.Value);
end;

procedure TModMenu.miRecording(ClientIndex : Byte);
begin
  TWXDatabase.Recording := not TWXDatabase.Recording;

  if (TWXDatabase.Recording) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Data recording is now ' + MENU_MID + CurrentMenu.Value);
end;

procedure TModMenu.miMenuKey(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := miMenuKey2;
end;

procedure TModMenu.miMenuKey2(ClientIndex : Byte);
begin
  if (CurrentMenu.Line <> '') then
  begin
    TWXExtractor.MenuKey := CurrentMenu.Line[1];
    CurrentMenu.Value := TWXExtractor.MenuKey;
  end;
end;

procedure TModMenu.miLocalEcho(ClientIndex : Byte);
begin
  TWXServer.LocalEcho := not TWXServer.LocalEcho;

  if (TWXServer.LocalEcho) then
    CurrentMenu.Value := 'ON'
  else
    CurrentMenu.Value := 'OFF';

  TWXServer.ClientMessage('Local echo is now ' + MENU_MID + CurrentMenu.Value);
end;


// ----------------------
// Database menu


procedure TModMenu.miDatabaseCreate(ClientIndex : Byte);
begin
  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter new database name' + endl);

  CurrentMenu.OnLineComplete := miDatabaseCreate2;
end;

procedure TModMenu.miDatabaseCreate2(ClientIndex : Byte);
var
  Name : ^PChar;
begin
  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter new database size (in sectors)' + endl);
  Name := AllocMem(SizeOf(PChar));
  Name^ := StrNew(PChar(CurrentMenu.Line));

  CurrentMenu.AddParam(Name);
  CurrentMenu.OnLineComplete := miDatabaseCreate3;
end;

procedure TModMenu.miDatabaseCreate3(ClientIndex : Byte);
var
  Head     : PDataHeader;
  Name     : string;
  NameChar : ^PChar;
begin
  NameChar := CurrentMenu.GetParam(0);
  SetString(Name, NameChar^, StrLen(NameChar^));
  StrDispose(NameChar^);

  Head := GetBlankHeader;
  Head.Sectors := StrToIntSafe(CurrentMenu.Line);

  if (Head.Sectors = 0) then
    Head.Sectors := 5000;

  if (Pos('.', Name) = 0) then
    Name := Name + '.xdb';

  TWXServer.Broadcast(endl);
  TWXDatabase.CreateDatabase('data\' + Name, Head^);
  TWXServer.Broadcast(endl);
  FreeMem(Head);
end;

procedure TModMenu.miDatabaseEdit(ClientIndex : Byte);
begin
  miDatabaseList(ClientIndex);
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter database name' + endl);

  CurrentMenu.OnLineComplete := miDatabaseEdit2;
end;

procedure TModMenu.miDatabaseEdit2(ClientIndex : Byte);
var
  C : ^PChar;
begin
  C := AllocMem(SizeOf(PChar));
  C^ := StrNew(PChar(CurrentMenu.Line));
  CurrentMenu.AddParam(C);

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter new server address (blank for no change)' + endl);
  CurrentMenu.OnLineComplete := miDatabaseEdit3;
end;

procedure TModMenu.miDatabaseEdit3(ClientIndex : Byte);
var
  C : ^PChar;
begin
  C := AllocMem(SizeOf(PChar));
  C^ := StrNew(PChar(CurrentMenu.Line));
  CurrentMenu.AddParam(C);

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter new server port (blank for no change)' + endl);
  CurrentMenu.OnLineComplete := miDatabaseEdit4;
end;

procedure TModMenu.miDatabaseEdit4(ClientIndex : Byte);
var
  I : ^Integer;
begin
  I := AllocMem(SizeOf(Integer));
  I^ := StrToIntSafe(CurrentMenu.Line);
  CurrentMenu.AddParam(I);

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Use login script? (' + MENU_MID + 'Y' + MENU_LIGHT + '/'
    + MENU_MID + 'N' + MENU_LIGHT + ')' + endl);
  CurrentMenu.OnLineComplete := miDatabaseEdit5;
end;

procedure TModMenu.miDatabaseEdit5(ClientIndex : Byte);
var
  FileOpen : Boolean;
  F        : File;
  Name,
  Address  : string;
  Head     : TDataHeader;
begin
  if (UpperCase(CurrentMenu.Line) = 'Y') then
  begin
    TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter login script name (blank for no change)' + endl);
    CurrentMenu.OnLineComplete := miDatabaseEdit6;
  end
  else
  begin
    // write changes to database
    FileOpen := FALSE;

    try
      SetString(Name, PChar(CurrentMenu.GetParam(0)^), StrLen(PChar(CurrentMenu.GetParam(0)^)));
      SetString(Address, PChar(CurrentMenu.GetParam(1)^), StrLen(PChar(CurrentMenu.GetParam(1)^)));

      if (Pos('.', Name) = 0) then
        Name := Name + '.xdb';

      Name := 'data\' + Name;

      AssignFile(F, Name);
      Reset(F, 1);
      BlockRead(F, Head, SizeOf(TDataHeader));

      Head.UseLogin := FALSE;

      if (Address <> '') then
        Head.Address := Address;

      if (Integer(CurrentMenu.GetParam(2)^) <> 0) then
        Head.ServerPort := Integer(CurrentMenu.GetParam(2)^);

      Seek(F, 0);
      BlockWrite(F, Head, SizeOf(TDataHeader));
      TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Changes saved to database: ' + Name + endl + endl);
    except
      TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Unable to save changes to database: ' + Name + endl + endl);
    end;

    if (FileOpen) then
      CloseFile(F);
  end;
end;

procedure TModMenu.miDatabaseEdit6(ClientIndex : Byte);
var
  C : ^PChar;
begin
  C := AllocMem(SizeOf(PChar));
  C^ := StrNew(PChar(CurrentMenu.Line));
  CurrentMenu.AddParam(C);

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter login name (blank for no change)' + endl);
  CurrentMenu.OnLineComplete := miDatabaseEdit7;
end;

procedure TModMenu.miDatabaseEdit7(ClientIndex : Byte);
var
  C : ^PChar;
begin
  C := AllocMem(SizeOf(PChar));
  C^ := StrNew(PChar(CurrentMenu.Line));
  CurrentMenu.AddParam(C);

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter login password (blank for no change)' + endl);
  CurrentMenu.OnLineComplete := miDatabaseEdit8;
end;

procedure TModMenu.miDatabaseEdit8(ClientIndex : Byte);
var
  C : ^PChar;
begin
  C := AllocMem(SizeOf(PChar));
  C^ := StrNew(PChar(CurrentMenu.Line));
  CurrentMenu.AddParam(C);

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Enter game letter (blank for no change)' + endl);
  CurrentMenu.OnLineComplete := miDatabaseEdit9;
end;

procedure TModMenu.miDatabaseEdit9(ClientIndex : Byte);
var
  FileOpen    : Boolean;
  F           : File;
  Name,
  Address,
  LoginScript,
  LoginName,
  Password    : string;
  Head        : TDataHeader;
begin
  // write changes to database
  FileOpen := FALSE;

  try
    SetString(Name, PChar(CurrentMenu.GetParam(0)^), StrLen(PChar(CurrentMenu.GetParam(0)^)));
    SetString(Address, PChar(CurrentMenu.GetParam(1)^), StrLen(PChar(CurrentMenu.GetParam(1)^)));
    SetString(LoginScript, PChar(CurrentMenu.GetParam(3)^), StrLen(PChar(CurrentMenu.GetParam(3)^)));
    SetString(LoginName, PChar(CurrentMenu.GetParam(4)^), StrLen(PChar(CurrentMenu.GetParam(4)^)));
    SetString(Password, PChar(CurrentMenu.GetParam(5)^), StrLen(PChar(CurrentMenu.GetParam(5)^)));

    if (Pos('.', Name) = 0) then
      Name := Name + '.xdb';

    Name := 'data\' + Name;

    AssignFile(F, Name);
    Reset(F, 1);
    BlockRead(F, Head, SizeOf(TDataHeader));

    Head.UseLogin := TRUE;

    if (Address <> '') then
      Head.Address := Address;

    if (Integer(CurrentMenu.GetParam(2)^) <> 0) then
      Head.ServerPort := Integer(CurrentMenu.GetParam(2)^);

    if (LoginScript <> '') then
      Head.LoginScript := LoginScript;

    if (LoginName <> '') then
      Head.LoginName := LoginName;

    if (Password <> '') then
      Head.Password := Password;

    if (CurrentMenu.Line <> '') then
      Head.Game := CurrentMenu.Line[1];

    Seek(F, 0);
    BlockWrite(F, Head, SizeOf(TDataHeader));
    TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Changes saved to database: ' + Name + endl + endl);
  except
    TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Unable to save changes to database: ' + Name + endl + endl);
  end;

  if (FileOpen) then
    CloseFile(F);
end;

procedure TModMenu.miDatabaseDelete(ClientIndex : Byte);
begin
  miDatabaseList(ClientIndex);
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter database name' + endl);

  CurrentMenu.OnLineComplete := miDatabaseDelete2;
end;

procedure TModMenu.miDatabaseDelete2(ClientIndex : Byte);
var
  Name : string;
begin
  Name := CurrentMenu.Line;

  if (Pos('.', Name) = 0) then
    Name := Name + '.xdb';

  Name := 'data\' + Name;

  if (UpperCase(Name) = UpperCase(TWXDatabase.DatabaseName)) then
    TWXDatabase.CloseDatabase;

  SetCurrentDir(FProgramDir);

  if (FileExists(Name)) then
  begin
    TWXServer.ClientMessage(endl + endl + 'Deleting database: ' + ANSI_7 + Name + endl);
    SysUtils.DeleteFile(Name);
  end;

  Name := StripFileExtension(Name) + '.cfg';

  if (FileExists(Name)) then
    SysUtils.DeleteFile(Name);
end;

procedure TModMenu.miDatabaseSelect(ClientIndex : Byte);
begin
  miDatabaseList(ClientIndex);
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter database name' + endl);

  CurrentMenu.OnLineComplete := miDatabaseSelect2;
end;

procedure TModMenu.miDatabaseSelect2(ClientIndex : Byte);
var
  Name : string;
begin
  // attempt to open database by name

  Name := CurrentMenu.Line;

  if (Pos('.', Name) = 0) then
    Name := Name + '.xdb';

  TWXDatabase.CloseDatabase;
  TWXDatabase.OpenDatabase('data\' + Name);
  CloseMenu(FALSE);
end;

procedure TModMenu.miDatabaseList(ClientIndex : Byte);
var
  S        : TSearchRec;
  FileOpen,
  Errored  : Boolean;
  Head     : TDataHeader;
  F        : File;
  Sectors,
  Col,
  Name     : string;
begin
  // display all items in 'data\' directory

  SetCurrentDir(FProgramDir);
  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Name                Sectors   Server' + endl + endl);

  if (FindFirst('data\*.xdb', faAnyFile, S) = 0) then
  begin
    repeat
      Errored := FALSE;
      FileOpen := FALSE;

      try
        AssignFile(F, 'data\' + S.Name);
        Reset(F, 1);
        FileOpen := TRUE;
        BlockRead(F, Head, SizeOf(TDataHeader));
      except
        Errored := TRUE;
      end;

      if (FileOpen) then
        CloseFile(F);

      if not (Errored) and (Head.ProgramName = 'TWX DATABASE') and (Head.Version = DATABASE_VERSION) then
      begin
        Name := StripFileExtension(S.Name);
        Sectors := IntToStr(Head.Sectors);

        if (UpperCase('data\' + Name + '.xdb') = UpperCase(TWXDatabase.DatabaseName)) and (TWXDatabase.DataBaseOpen) then
          Col := MENU_MID
        else
          Col := MENU_DARK;

        TWXServer.Broadcast(Col + Name + GetSpace(20 - Length(Name)) + MENU_DARK
          + Sectors + GetSpace(10 - Length(Sectors)) + Head.Address + endl);
      end;
    until (FindNext(S) <> 0);

    FindClose(S);
  end;

  TWXServer.Broadcast(endl);
end;

procedure TModMenu.miDatabaseView(ClientIndex : Byte);
begin
  miDatabaseList(ClientIndex);
  TWXServer.Broadcast(endl + MENU_LIGHT + 'Enter database name' + endl);

  CurrentMenu.OnLineComplete := miDatabaseView2;
end;

procedure TModMenu.miDatabaseView2(ClientIndex : Byte);
var
  F        : file;
  UseLogin,
  Name     : string;
  Errored,
  FileOpen : Boolean;
  Head     : TDataHeader;
begin
  Name := CurrentMenu.Line;

  if (Pos('.', Name) = 0) then
    Name := Name + '.xdb';

  Name := 'data\' + Name;

  // probe database header
  FileOpen := FALSE;
  Errored := FALSE;

  try
    AssignFile(F, Name);
    Reset(F, 1);
    FileOpen := TRUE;
    BlockRead(F, Head, SizeOf(Head));
  except
    Errored := TRUE;
  end;

  if (FileOpen) then
    CloseFile(F);

  if (Errored) then
  begin
    TWXServer.Broadcast(endl + endl + 'Unable to open this database.' + endl);
    Exit;
  end;

  // display database details
  if (Head.UseLogin) then
    UseLogin := 'YES'
  else
    UseLogin := 'NO';

  TWXServer.Broadcast(endl + endl + MENU_LIGHT + 'Details for TWX Proxy database ''' + MENU_MID + Name + MENU_LIGHT + ''':' + endl + endl);
  TWXServer.Broadcast(MENU_MID + 'Size: ' + MENU_DARK + IntToStr(Head.Sectors) + endl);
  TWXServer.Broadcast(MENU_MID + 'Server: ' + MENU_DARK + Head.Address + endl);
  TWXServer.Broadcast(MENU_MID + 'Port: ' + MENU_DARK + IntToStr(Head.ServerPort) + endl);
  TWXServer.Broadcast(MENU_MID + 'Use login script: ' + MENU_DARK + UseLogin + endl);

  if (Head.UseLogin) then
  begin
    TWXServer.Broadcast(MENU_MID + 'Login script: ' + MENU_DARK + Head.LoginScript + endl);
    TWXServer.Broadcast(MENU_MID + 'Login name: ' + MENU_DARK + Head.LoginName + endl);
    TWXServer.Broadcast(MENU_MID + 'Login password: ' + MENU_DARK + Head.Password + endl);
    TWXServer.Broadcast(MENU_MID + 'Login game: ' + MENU_DARK + Head.Game + endl);
  end;

  TWXServer.Broadcast(endl);
end;



// ----------------------
// Script inputs


procedure TModMenu.miScriptInputActivate(ClientIndex : Byte);
begin
  CurrentMenu.OnLineComplete := ScriptLineComplete;
end;

procedure TModMenu.ScriptLineComplete(ClientIndex : Byte);
var
  InputLine : string;
begin
  InputLine := CurrentMenu.Line;
  CloseMenu(FALSE);
  InputScript.InputCompleted(InputLine, InputScriptVar);
end;



// ***************************************************************
// TTWXMenuItem implementation


constructor TTWXMenuItem.Create(Owner : TModMenu; Name : string; OnActivate : TMenuEvent; Title, Prmpt : String; Key : Char);
begin
  inherited Create;

  FController := Owner;
  FTitle := Title;
  FHotKey := Key;
  FOnActivate := OnActivate;
  FPrompt := Prmpt;
  FLine := '';
  FReference := '';
  FScriptMacrosOn := FALSE;
  FName := Name;
  FScriptOwner := nil;
  FIsCustom := FALSE;
  FClearLine := TRUE;
  FOpExit := TRUE;
  FOpHelp := TRUE;
  FOpList := TRUE;
  MenuParams := TList.Create;
  MenuItems := TList.Create;
  Owner.LinkMenu(Self);
end;

constructor TTWXMenuItem.Create(Owner : TModMenu; Name, Title, Prmpt : String; Key : Char);
begin
  // alternative constructor for menu without activation procedure
  inherited Create;

  FController := Owner;
  FTitle := Title;
  FHotKey := Key;
  FPrompt := Prmpt;
  FLine := '';
  FReference := '';
  FScriptMacrosOn := FALSE;
  FName := Name;
  FIsCustom := FALSE;
  FScriptOwner := nil;
  FClearLine := TRUE;
  FOpExit := TRUE;
  FOpHelp := TRUE;
  FOpList := TRUE;
  MenuParams := TList.Create;
  MenuItems := TList.Create;
  Owner.LinkMenu(Self);
end;

destructor TTWXMenuItem.Destroy;
var
  I : Integer;
begin
  for I := 0 to MenuItems.Count - 1 do
    TTWXMenuItem(MenuItems[I]).ParentMenu := nil;

  MenuItems.Free;

  while (MenuParams.Count > 0) do
  begin
    FreeMem(MenuParams[0]);
    MenuParams.Delete(0);
  end;

  MenuParams.Free;

  // unlink from controller list
  Controller.UnlinkMenu(Self);

  // remove from parent list
  if (FParentMenu <> nil) then
    FParentMenu.RemoveItem(Self);

  inherited;
end;

function MenuSortFunc(Item1, Item2 : Pointer) : Integer;
begin
  if (TTWXMenuItem(Item1).HotKey = TTWXMenuItem(Item2).HotKey) then
    Result := 0
  else if (Byte(TTWXMenuItem(Item1).HotKey) < Byte(TTWXMenuItem(Item2).HotKey)) then
    Result := -1
  else
    Result := 1;
end;

procedure TTWXMenuItem.DumpOptions;
var
  I    : Integer;
  Item : TTWXMenuItem;
begin
  // show all menu options
  TWXServer.Broadcast(ANSI_CLEARLINE + #13 + MENU_LIGHT + FTitle + ':' + endl);

  if (FOpList) then
    TWXServer.Broadcast(ANSI_15 + '?' + ANSI_7 + ' - Command list' + endl);

  if (FOpHelp) then
    TWXServer.Broadcast(ANSI_15 + '+' + ANSI_7 + ' - Help on command' + endl);

  if (FOpExit) then
  begin
    if (ParentMenu = nil) and (ScriptOwner <> nil) then
      TWXServer.Broadcast(ANSI_15 + 'Q' + ANSI_7 + ' - Terminate script' + endl)
    else
      TWXServer.Broadcast(ANSI_15 + 'Q' + ANSI_7 + ' - Exit menu' + endl);
  end;

  // sort menu options by their hotkey
  if (MenuItems.Count > 1) then
    MenuItems.Sort(MenuSortFunc);

  for I := 0 to MenuItems.Count - 1 do
  begin
    Item := TTWXMenuItem(MenuItems.Items[I]); 

    TWXServer.Broadcast(MENU_MID + Item.HotKey + MENU_DARK + ' - ' + Item.Title);

    if (Item.Value <> '') then
    begin
      // display menu item value
      TWXServer.Broadcast(GetSpace(25 - Length(Item.Title)) + MENU_LIGHT + StringReplace(Item.Value, #13, '*', [rfReplaceAll]));
    end;

    TWXServer.Broadcast(endl);
  end;

  TWXServer.Broadcast(endl + GetPrompt);
end;

procedure TTWXMenuItem.SetOptions(OpExit, OpList, OpHelp : Boolean);
begin
  FOpExit := OpExit;
  FOpList := OpList;
  FOpHelp := OpHelp;  
end;

procedure TTWXMenuItem.AddItem(Item : TTWXMenuItem);
begin
  // add menu item to list
  MenuItems.Add(Item);

  Item.ParentMenu := Self;
end;

procedure TTWXMenuItem.RemoveItem(Item : TTWXMenuItem);
begin
  // remove item from list
  MenuItems.Remove(Item);
end;

procedure TTWXMenuItem.AddParam(P : Pointer);
begin
  // save menu parameter in list
  MenuParams.Add(P);
end;

function TTWXMenuItem.GetParam(Index : Integer) : Pointer;
begin
  // get stored parameter by index
  Result := MenuParams.Items[Index];
end;

procedure TTWXMenuItem.MenuKey(Key : Char; ClientIndex : Byte);
var
  I           : Integer;
  LastLineSub : TMenuEvent;
  Found       : Boolean;
begin
  if not (Assigned(FOnLineComplete)) then
  begin
    // non text menu option


    if (Key = '?') then
      DumpOptions
    else if (Controller.HelpMode) then
    begin
      // display help text for selected option
      Found := FALSE;

      for I := 0 to MenuItems.Count - 1 do
        if (TTWXMenuItem(MenuItems.Items[I]).HotKey = UpCase(Key)) then
        begin
          if (TTWXMenuItem(MenuItems.Items[I]).Help <> '') then
            Found := TRUE;
            
          Break;
        end;

      if (Found) then
        TWXServer.ClientMessage('Help for option ''' + UpCase(Key) + ''':' + endl + endl + MENU_MID
          + WordWrap(TTWXMenuItem(MenuItems.Items[I]).Help) + endl)
      else
        TWXServer.ClientMessage('No help is available for this option');

      Controller.HelpMode := FALSE;
    end
    else if (Key = '+') then
    begin
      // enter help mode
      TWXServer.ClientMessage('Select the option you need help on');
      Controller.HelpMode := TRUE;
    end
    else if ((Key = 'Q') or (Key = 'q')) then
    begin
      if (Assigned(ParentMenu)) then
        // go back to parent menu
        Controller.OpenMenuItem(ParentMenu, ClientIndex, FName)
      else
        Controller.CloseMenu(TRUE);
    end
    else
    begin
      Found := FALSE;

      for I := 0 to MenuItems.Count - 1 do
        if (TTWXMenuItem(MenuItems.Items[I]).HotKey = UpCase(Key)) then
        begin
          Controller.OpenMenuItem(MenuItems.Items[I], ClientIndex, FName);
          Found := TRUE;
          Break;
        end;

      if not (Found) and (Byte(Key) >= 48) and (Byte(Key) <= 57) and (FScriptMacrosOn) then
      begin
        Controller.CloseMenu(FALSE);
        TWXInterpreter.Load(FetchScript(Key, FALSE), FALSE);
      end
    end;
  end
  else
  begin
    // hack for singlekey script inputs
    if (FName = 'TWX_SCRIPTKEY') then
    begin
      Controller.CloseMenu(FALSE);
      Controller.InputScript.InputCompleted(Key, TWXMenu.InputScriptVar);
      Exit;
    end;

    // echo the key pressed
    if (Key <> #8) then
      TWXServer.Broadcast(Key);

    // Check for backspace
    if (Key = #8) then
    begin
      if (Length(Line) > 0) then
      begin
        Line := Copy(Line, 1, Length(Line) - 1);
        TWXServer.Broadcast(#8 + ' ' + #8);
      end;
    end
    else if (Ord(Key) >= 32) then
      Line := Line + Key
    else if (Key = #13) then
    begin
      // input line completed
      if (Assigned(FOnLineComplete)) then
      begin
        LastLineSub := FOnLineComplete;
        FOnLineComplete := nil;

        // call line completed handler
        LastLineSub(ClientIndex);

        FLine := '';

        if (Controller.CurrentMenu = Self) and (FName <> 'TWX_SCRIPTTEXT') then
        begin
          // menu has not branched
          
          if not (Assigned(FOnLineComplete)) then
          begin
            // option is completed - purge parameters and return to parent menu

            while (MenuParams.Count > 0) do
            begin
              FreeMem(MenuParams.Items[0]);
              MenuParams.Delete(0);
            end;

            if (Assigned(FParentMenu)) then
            begin
              if (Controller.CurrentMenu <> nil) then
                Controller.OpenMenuItem(FParentMenu, ClientIndex, FName)
            end
            else
              Controller.CloseMenu(FALSE);
          end
          else
            TWXServer.Broadcast(GetPrompt);
        end;
      end
      else
        Controller.CloseMenu(FALSE); // menu function not properly implemented?
    end;
  end;
end;

function TTWXMenuItem.GetPrompt : String;
begin
  Result := MENU_LIGHT + FPrompt + MENU_MID + '> ' + ANSI_7 + FLine;
end;

function TTWXMenuItem.GetMenuItemCount : Integer;
begin
  Result := MenuItems.Count;
end;

end.

