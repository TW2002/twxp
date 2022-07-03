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
// This unit controls all processing and recording of data

unit
  Process;

interface

uses
  Core,
  Observer,
  SysUtils,
  DataBase,
  StrUtils,
  INIFiles,
  Classes;

type
  TSectorPosition = (spNormal, spPorts, spPlanets, spShips, spMines, spTraders);
  TDisplay = (dNone, dSector, dDensity, dWarpLane, dCIM, dPortCIM, dPort, dPortCR, dWarpCIM, dFigScan);
  TFigScanType = (fstPersonal, fstCorp);

  TModExtractor = class(TTWXModule, IModExtractor)
  private
    FCurrentSectorIndex,
    FPortSectorIndex,
    FFigScanSector	: Integer;
    FSectorPosition     : TSectorPosition;
    FCurrentDisplay     : TDisplay;
    FLastWarp           : Integer;
    FSectorSaved        : Boolean;
    FCurrentTrader      : TTrader;
    FCurrentShip        : TShip;
    FCurrentMessage,
    FTWGSVer,
    FTW2002Ver          : string;
    FTWGSType           : integer;
    FTraderList,
    FShipList,
    FPlanetList         : TList;

    FCurrentLine,
    FCurrentANSILine,
    FRawANSILine        : string;
    FCurrentSector      : TSector;
    FInAnsi             : Boolean;
    FMenuKey            : Char;

    // MB - Addeded in 2.06
    FCurrentTurns,
    FCurrentCredits,
    FCurrentFighters,
    FCurrentShields,
    FCurrentTotalHolds,
    FCurrentOreHolds,
    FCurrentOrgHolds,
    FCurrentEquHolds,
    FCurrentColHolds,
    FCurrentPhotons,
    FCurrentArmids,
    FCurrentLimpets,
    FCurrentGenTorps,
    FCurrentTwarpType,
    FCurrentCloaks,
    FCurrentBeacons,
    FCurrentAtomics,
    FCurrentCorbomite,
    FCurrentEprobes,
    FCurrentMineDisr,
    FCurrentAlignment,
    FCurrentExperience,
    FCurrentCorp,
    FCurrentShipNumber     : Integer;
    FCurrentPsychicProbe,
    FCurrentPlanetScanner  : Boolean;
    FCurrentScanType       : Word;
    FCurrentShipClass      : String;

    procedure SectorCompleted;
    procedure ResetSectorLists;
    procedure ProcessPrompt(Line : string);
    procedure AddWarp(SectNum, Warp : Integer);
    procedure ProcessWarpLine(Line : String);
    procedure ProcessCIMLine(Line : String);
    procedure ProcessQuickStats(Line : String);
    procedure ProcessSectorLine(Line : String);
    procedure ProcessLine(Line : String);
    procedure ProcessPortLine(Line : String);
    procedure ProcessFigScanLine(Line : String);
    procedure ResetFigDatabase;

  protected
    function GetMenuKey: Char;
    procedure SetMenuKey(Value: Char);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;
    procedure StripANSI(var S : string);

    procedure Reset;
    procedure ProcessInBound(var InData : string);
    function ProcessOutBound(OutData : string; ClientIndex : Byte) : Boolean;

    property CurrentLine: string read FCurrentLine write FCurrentLine;
    property CurrentANSILine: string read FCurrentANSILine write FCurrentANSILine;
    property RawANSILine: string read FRawANSILine write FRawANSILine;
    property CurrentSector: integer read FCurrentSectorIndex;

    // MB - Addeded in 2.06
    property TWGSType: integer read FTWGSType;
    property TWGSVer: string read FTWGSVer;
    property TW2002Ver: string read FTW2002Ver;

    property CurrentTurns: integer read FCurrentTurns;
    property CurrentCredits: integer read FCurrentCredits;
    property CurrentFighters: integer read FCurrentFighters;
    property CurrentShields: integer read FCurrentShields;
    property CurrentTotalHolds: integer read FCurrentTotalHolds;
    property CurrentOreHolds: integer read FCurrentOreHolds;
    property CurrentOrgHolds: integer read FCurrentOrgHolds;
    property CurrentEquHolds: integer read FCurrentEquHolds;
    property CurrentColHolds: integer read FCurrentColHolds;
    property CurrentPhotons: integer read FCurrentPhotons;
    property CurrentArmids: integer read FCurrentArmids;
    property CurrentLimpets: integer read FCurrentLimpets;
    property CurrentGenTorps: integer read FCurrentGenTorps;
    property CurrentTwarpType: integer read FCurrentTwarpType;
    property CurrentCloaks: integer read FCurrentCloaks;
    property CurrentBeacons: integer read FCurrentBeacons;
    property CurrentAtomics: integer read FCurrentAtomics;
    property CurrentCorbomite: integer read FCurrentCorbomite;
    property CurrentEprobes: integer read FCurrentEprobes;
    property CurrentMineDisr: integer read FCurrentMineDisr;
    property CurrentAlignment: integer read FCurrentAlignment;
    property CurrentExperience: integer read FCurrentExperience;
    property CurrentCorp: integer read FCurrentCorp;
    property CurrentShipNumber: integer read FCurrentShipNumber;
    property CurrentPsychicProbe: Boolean read FCurrentPsychicProbe;
    property CurrentPlanetScanner: Boolean read FCurrentPlanetScanner;
    property CurrentScanType: Word    read FCurrentScanType;
    property CurrentShipClass: String  read FCurrentShipClass;

  published
    property MenuKey: Char read GetMenuKey write SetMenuKey;
  end;

implementation

uses
  Global,
  Utility,
  Ansi;


procedure TModExtractor.AfterConstruction;
begin
  inherited;

  // Create lists to store ships, traders and planets
  FShipList := TList.Create;
  FTraderList := TList.Create;
  FPlanetList := TList.Create;

  MenuKey := '$';

  FTWGSType := 0;
  FTWGSVer := '';
  FTW2002Ver := '';
end;

procedure TModExtractor.BeforeDestruction;
begin
  ResetSectorLists;

  FShipList.Free;
  FTraderList.Free;
  FPlanetList.Free;

  inherited;
end;

procedure TModExtractor.Reset;
begin
  // Reset state values

  CurrentLine := '';
  CurrentANSILine := '';
  RawANSILine := '';
  FInAnsi := FALSE;
  ResetSectorLists;


end;

function TModExtractor.GetMenuKey: Char;
begin
  Result := FMenuKey;
end;

procedure TModExtractor.SetMenuKey(Value: Char);
begin
  FMenuKey := Value;
end;


// ********************************************************************
// Process inbound data



procedure TModExtractor.ResetSectorLists;
begin
  // Reset all ship, planet and trader lists

  while (FShipList.Count > 0) do
  begin
    FreeMem(FShipList[0], SizeOf(TShip));
    FShipList.Delete(0);
  end;

  while (FPlanetList.Count > 0) do
  begin
    FreeMem(FPlanetList[0], SizeOf(TPlanet));
    FPlanetList.Delete(0);
  end;

  while (FTraderList.Count > 0) do
  begin
    FreeMem(FTraderList[0], SizeOf(TTrader));
    FTraderList.Delete(0);
  end;
end;

procedure TModExtractor.SectorCompleted;
var
  I,
  WarpIndex : Integer;
begin
  if (FCurrentSectorIndex = 0) then
    Exit;

  FCurrentSector.UpDate := Now;
  FCurrentSector.Explored := etHolo;
  FSectorSaved := TRUE;
  WarpIndex := 0;

  for I := 1 to 6 do
    if (FCurrentSector.Warp[I] = 0) then
    begin
      WarpIndex := I;
      Break;
    end;

  if (WarpIndex = 0) then
    FCurrentSector.Warps := 0
  else if (FCurrentSector.Warp[WarpIndex] = 0) then
    FCurrentSector.Warps := WarpIndex - 1
  else
    FCurrentSector.Warps := 6;

  TWXDatabase.SaveSector(FCurrentSector, FCurrentSectorIndex, FShipList, FTraderList, FPlanetList);
  ResetSectorLists;
end;

procedure TModExtractor.ProcessPrompt(Line : string);
begin
  // This procedure checks command prompts.  It is called from both
  // processline and processinbound, as it can come in as part of
  // a large packet or still be waiting for the user.

  // MB - Added TWGS Version detection
  if TWXClient.BlockExtended and (Copy(Line, 1, 14) = 'TradeWars Game') then
  begin
    FTWGSType := 2;
    FTWGSVer := '2.20b';
    FTW2002Ver := '3.34';

    // MB - Sending event to Mombot, since we blocked # initially.
    TWXClient.BlockExtended := FALSE;
    TWXInterpreter.TextEvent('Selection (? for menu):', FALSE);
  end
  else if TWXClient.BlockExtended and (Copy(Line, 1, 20) = 'Trade Wars 2002 Game') then
  begin
//Trade Wars 2002 Game Server v1.03                          Copyright (C) 1998
//www.tradewars.com                                   Epic Interactive Strategy
    FTWGSType := 1;
    FTWGSVer := '1.03';
    FTW2002Ver := '3.13';

    // MB - Sending event to Mombot, since we blocked # initially.
    TWXClient.BlockExtended := FALSE;
    TWXInterpreter.TextEvent('Selection (? for menu):', FALSE);
  end
  else if (Copy(Line, 1, 12) = 'Command [TL=') then
  begin
    // Save current sector if not done already
    if not (FSectorSaved) then
      SectorCompleted;

    // Record Current Sector Index
    FCurrentSectorIndex := StrToIntSafe(Copy(Line, 24, (AnsiPos('(', Line) - 26)));

  //TODO: check database size on v screen
  //TODO: Verify Stardock location on 'v' scren matches database.
  //TODO: Veryfy game age to determin if this is a rebang

  // MB - Display 'v' screen if stardock location is unknown.
//  if (TWXDatabase.DBHeader.Stardock = 65535) then
//  begin
//    Head := TWXDatabase.DBHeader;
//    Head.Stardock := 0;
//    TWXDatabase.DBHeader := Head;
//    TWXClient.Send('vi/');
//    Sleep(500);
//  end;

    // No displays anymore, all done
    FCurrentDisplay := dNone;
    FLastWarp := 0;
  end
  else if (Copy(Line, 1, 23) = 'Probe entering sector :') or (Copy(Line, 1, 20) = 'Probe Self Destructs') then
  begin
    // mid probe - save the sector
    if not (FSectorSaved) then
      SectorCompleted;


    // No displays anymore, all done
    FCurrentDisplay := dNone;
  end
  else if (Copy(Line, 1, 21) = 'Computer command [TL=') then
  begin
    // in computer prompt, kill all displays and clear warp data
    FCurrentDisplay := dNone;
    FLastWarp := 0;

    // Record Current Sector Index to SysConstant CURRENTSECTOR
    FCurrentSectorIndex := StrToIntSafe(Copy(Line, 33, (AnsiPos('(', Line) - 35)));

  end
  else if (Copy(Line, 1, 25) = 'Citadel treasury contains') then
  begin
    // In Citadel - Save current sector if not done already
    if not (FSectorSaved) then
      SectorCompleted;

    // No displays anymore, all done
    FCurrentDisplay := dNone;
  end
  else if (Copy(Line, 1, 19) = 'Stop in this sector') or (Copy(Line, 1, 21) = 'Engage the Autopilot?') then
  begin
    // Save current sector if not done already
    if not (FSectorSaved) then
      SectorCompleted;

    // No displays anymore, all done
    FCurrentDisplay := dNone;
  end
  else if (Copy(Line, 1, 2) = ': ') then
  begin
    // at the CIM prompt
    if (FCurrentDisplay <> dCIM) then
      FCurrentDisplay := dNone;

    FLastWarp := 0;
  end;

  TWXInterpreter.TextEvent(CurrentLine, FALSE);
end;

procedure TModExtractor.AddWarp(SectNum, Warp : Integer);
var
  S     : TSector;
  I,
  X,
  Pos   : Integer;
begin
  // Used by ProcessWarpLine to add a warp to a sector

  S := TWXDatabase.LoadSector(SectNum);

  // see if the warp is already in there
  for I := 1 to 6 do
    if (S.Warp[I] = Warp) then
      Exit;

  // find where it should fit
  Pos := 7;
  for I := 1 to 6 do
    if (S.Warp[I] > Warp) or (S.Warp[I] = 0) then
    begin
      Pos := I;
      Break;
    end;

  if (Pos = 1) then
    X := 2
  else
    X := Pos;

  // move them all up one
  if (Pos < 6) then
    for I := 6 downto X do
      S.Warp[I] := S.Warp[I - 1];

  if (Pos < 7) then
    S.Warp[Pos] := Warp;

  if (S.Explored = etNo) then
  begin
    S.Constellation := '???' + ANSI_9 + ' (warp calc only)';
    S.Explored := etCalc;
    S.Update := Now;
  end;

  TWXDatabase.SaveSector(S, SectNum, nil, nil, nil);
end;

procedure TModExtractor.ProcessWarpLine(Line : String);
var
  I,
  CurSect,
  LastSect : Integer;
  //S        : String;
  Sectors : TStringList;
begin
  // A WarpLine is a line of warps plotted using the ship's computer.  Add new warps to
  // any sectors listed in the warp lane (used extensively for ZTM).
  // e.g:  3 > 300 > 5362 > 13526 > 149 > 434

  LastSect := FLastWarp;
  StripChar(Line, ')');
  StripChar(Line, '(');

  Sectors := TStringList.Create;

  Split(Line, Sectors, ' >');
  for I := 0 to (Sectors.Count - 1) do
  begin
    CurSect := StrToIntSafe(Sectors[I]);

    if (CurSect < 1) or (CurSect > TWXDatabase.DBHeader.Sectors) then
      exit;

    if (LastSect > 0) then
      AddWarp(LastSect, CurSect);

    LastSect := CurSect;
    FLastWarp := CurSect;
  end;

  {
  I := 1;
  S := GetParameter(Line, I);

  while (S <> '') do
  begin
    if (S <> '>') then
    begin
      CurSect := StrToIntSafe(S);

      if (CurSect < 1) or (CurSect > TWXDatabase.DBHeader.Sectors) then
        // doesn't look like this line is what we thought it was.
        // Best to leave it alone
        exit;

      if (LastSect > 0) then
        AddWarp(LastSect, CurSect);

      LastSect := CurSect;
      FLastWarp := CurSect;
    end;

    Inc(I);
    S := GetParameter(Line, I);
  end;
  }
end;

procedure TModExtractor.ProcessCIMLine(Line : String);
  function GetCIMValue(M : String; Num : Integer) : Integer;
  var
    S : String;
  begin
    S := GetParameter(M, Num);

    if (S = '') then
      Result := 0
    else
    try
      Result := StrToInt(S);
    except
      Result := -1;
    end;
  end;
var
  Sect   : Integer;
  S      : TSector;
  X,
  I,
  Len,
  Ore,
  Org,
  Equip,
  POre,
  POrg,
  PEquip : Integer;
  M      : String;
begin
  if (FCurrentDisplay = dWarpCIM) then
  begin
    // save warp CIM data
    Sect := GetCIMValue(Line, 1);

    if (Sect <= 0) or (Sect > TWXDatabase.DBHeader.Sectors) then
    begin
      FCurrentDisplay := dNone;
      Exit;
    end;

    S := TWXDatabase.LoadSector(Sect);

    for I := 1 to 6 do
    begin
      X := GetCIMValue(Line, I + 1);

      if (X < 0) or (X > TWXDatabase.DBHeader.Sectors) then
      begin
        FCurrentDisplay := dNone;
        Exit;
      end
      else
        S.Warp[I] := X;
    end;

    if (S.Explored = etNo) then
    begin
      S.Constellation := '???' + ANSI_9 + ' (warp calc only)';
      S.Explored := etCalc;
      S.Update := Now;
    end;

    TWXDatabase.SaveSector(S, Sect, nil, nil, nil);
  end
  else
  begin
    // save port CIM data
    Sect := GetCIMValue(Line, 1);
    Len := Length(IntToStr(TWXDatabase.DBHeader.Sectors));

    if (Sect <= 0) or (Sect > TWXDatabase.DBHeader.Sectors) or (Length(Line) < Len + 36) then
    begin
      FCurrentDisplay := dNone;
      Exit;
    end;

    M := StringReplace(Line, '-', '', [rfReplaceAll]);
    M := StringReplace(M, '%', '', [rfReplaceAll]);
    S := TWXDatabase.LoadSector(Sect);

    Ore := GetCIMValue(M, 2);
    Org := GetCIMValue(M, 4);
    Equip := GetCIMValue(M, 6);
    POre := GetCIMValue(M, 3);
    POrg := GetCIMValue(M, 5);
    PEquip := GetCIMValue(M, 7);

    if (Ore < 0) or (Org < 0) or (Equip < 0)
     or (POre < 0) or (POre > 100)
     or (POrg < 0) or (POrg > 100)
     or (PEquip < 0) or (PEquip > 100) then
    begin
      FCurrentDisplay := dNone;
      Exit;
    end;

    S.SPort.ProductAmount[ptFuelOre] := Ore;
    S.SPort.ProductAmount[ptOrganics] := Org;
    S.SPort.ProductAmount[ptEquipment] := Equip;
    S.SPort.ProductPercent[ptFuelOre] := POre;
    S.SPort.ProductPercent[ptOrganics] := POrg;
    S.SPort.ProductPercent[ptEquipment] := PEquip;
    S.SPort.UpDate := Now;

    if (S.SPort.Name = '') then
    begin
      // port not saved/seen before - get its details

      if (Line[Len + 2] = '-') then
        S.SPort.BuyProduct[ptFuelOre] := TRUE
      else
        S.SPort.BuyProduct[ptFuelOre] := FALSE;

      if (Line[Len + 14] = '-') then
        S.SPort.BuyProduct[ptOrganics] := TRUE
      else
        S.SPort.BuyProduct[ptOrganics] := FALSE;

      if (Line[Len + 26] = '-') then
        S.SPort.BuyProduct[ptEquipment] := TRUE
      else
        S.SPort.BuyProduct[ptEquipment] := FALSE;

      if (S.SPort.BuyProduct[ptFuelOre]) and (S.SPort.BuyProduct[ptOrganics]) and (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 8
      else if (S.SPort.BuyProduct[ptFuelOre]) and (S.SPort.BuyProduct[ptOrganics]) and not (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 1
      else if (S.SPort.BuyProduct[ptFuelOre]) and not (S.SPort.BuyProduct[ptOrganics]) and (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 2
      else if not (S.SPort.BuyProduct[ptFuelOre]) and (S.SPort.BuyProduct[ptOrganics]) and (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 3
      else if not (S.SPort.BuyProduct[ptFuelOre]) and not (S.SPort.BuyProduct[ptOrganics]) and (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 4
      else if not (S.SPort.BuyProduct[ptFuelOre]) and (S.SPort.BuyProduct[ptOrganics]) and not (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 5
      else if (S.SPort.BuyProduct[ptFuelOre]) and not (S.SPort.BuyProduct[ptOrganics]) and not (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 6
      else if not (S.SPort.BuyProduct[ptFuelOre]) and not (S.SPort.BuyProduct[ptOrganics]) and not (S.SPort.BuyProduct[ptEquipment]) then
        S.SPort.ClassIndex := 7;

      S.SPort.Name := '???';
    end;

    if (S.Explored = etNo) then
    begin
      S.Constellation := '???' + ANSI_9 + ' (port data/calc only)';
      S.Explored := etCalc;
      S.Update := Now;
    end;

    TWXDatabase.SaveSector(S, Sect, nil, nil, nil);
  end;
end;

procedure TModExtractor.ProcessSectorLine(Line : String);
var
  S         : String;
  I         : Integer;
  NewPlanet : PPlanet;
  NewShip   : PShip;
  NewTrader : PTrader;
begin
  if (Copy(Line, 1, 10) = 'Beacon  : ') then
  begin
    // Get beacon text
    FCurrentSector.Beacon := Copy(Line, 11, length(Line) - 10);
  end
  else if (Copy(Line, 1, 10) = 'Ports   : ') then
  begin
    // Save port data

    if (Pos('<=-DANGER-=>', Line) > 0) then
      // Port is destroyed
      FCurrentSector.SPort.Dead := TRUE
    else
    begin
      FCurrentSector.SPort.Dead := FALSE;
      FCurrentSector.SPort.BuildTime := 0;
      FCurrentSector.SPort.Name := Copy(Line, 11, Pos(', Class', Line) - 11);
      FCurrentSector.SPort.ClassIndex := StrToIntSafe(Copy(Line, Pos(', Class', Line) + 8, 1));

      if (Line[length(Line) - 3] = 'B') then
        FCurrentSector.SPort.BuyProduct[ptFuelOre] := TRUE
      else
        FCurrentSector.SPort.BuyProduct[ptFuelOre] := FALSE;

      if (Line[length(Line) - 2] = 'B') then
        FCurrentSector.SPort.BuyProduct[ptOrganics] := TRUE
      else
        FCurrentSector.SPort.BuyProduct[ptOrganics] := FALSE;

      if (Line[length(Line) - 1] = 'B') then
        FCurrentSector.SPort.BuyProduct[ptEquipment] := TRUE
      else
        FCurrentSector.SPort.BuyProduct[ptEquipment] := FALSE;
    end;

    FSectorPosition := spPorts;
  end
  else if (Copy(Line, 1, 10) = 'Planets : ') then
  begin
    // Get planet data
    NewPlanet := AllocMem(SizeOf(TPlanet));
    TWXDatabase.NULLPlanet(NewPlanet^);
    NewPlanet^.Name := Copy(Line, 11, length(Line) - 10);
    FPlanetList.Add(NewPlanet);

    FSectorPosition := spPlanets;
  end
  else if (Copy(Line, 1, 10) = 'Traders : ') then
  begin
    // Save traders
    I := Pos(', w/', Line);
    FCurrentTrader.Name := Copy(Line, 11, I - 11);
    S := Copy(Line, I + 5, Pos(' ftrs', Line) - I - 5);
    StripChar(S, ',');
    FCurrentTrader.Figs := StrToIntSafe(S);
    FSectorPosition := spTraders;
  end
  else if (Copy(Line, 1, 10) = 'Ships   : ') then
  begin
    // Save ships
    I := Pos('[Owned by]', Line);
    FCurrentShip.Name := Copy(Line, 11, I - 12);
    FCurrentShip.Owner := Copy(Line, I + 11, Pos(', w/', Line) - I - 11);
    I := Pos(', w/', Line);
    S := Copy(Line, I + 5, Pos(' ftrs,', Line) - I - 5);
    StripChar(S, ',');
    FCurrentShip.Figs := StrToIntSafe(S);
    FSectorPosition := spShips;
  end
  else if (Copy(Line, 1, 10) = 'Fighters: ') then
  begin
    // Get fig details
    S := GetParameter(Line, 2);
    StripChar(S, ',');
    FCurrentSector.Figs.Quantity := StrToIntSafe(S);
    I := GetParameterPos(Line, 3) + 1;
    FCurrentSector.Figs.Owner := Copy(Line, I, Pos(')', Line) - I);

    if (Copy(Line, length(Line) - 5, 6) = '[Toll]') then
      FCurrentSector.Figs.FigType := ftToll
    else if (Copy(Line, length(Line) - 10, 11) = '[Defensive]') then
      FCurrentSector.Figs.FigType := ftDefensive
    else
      FCurrentSector.Figs.FigType := ftOffensive;
  end
  else if (Copy(Line, 1, 10) = 'NavHaz  : ') then
  begin
    S := GetParameter(Line, 3);
    S := Copy(S, 1, length(S) - 1);
    FCurrentSector.NavHaz := StrToIntSafe(S);
  end
  else if (Copy(Line, 1, 10) = 'Mines   : ') then
  begin
    // Save mines
    FSectorPosition := spMines;
    I := GetParameterPos(Line, 7) + 1;
    S := Copy(Line, I, length(Line) - I);

    if (GetParameter(Line, 6) = 'Armid)') then
    begin
      FCurrentSector.Mines_Armid.Quantity := StrToIntSafe(GetParameter(Line, 3));
      FCurrentSector.Mines_Armid.Owner := S;
    end
    else
    begin
      FCurrentSector.Mines_Limpet.Quantity := StrToIntSafe(GetParameter(Line, 3));
      FCurrentSector.Mines_Limpet.Owner := S;
    end;
  end
  else if (Copy(Line, 1, 8) = '        ') then
  begin
    // Continue from last occurance

    if (FSectorPosition = spMines) then
    begin
      I := GetParameterPos(Line, 6) + 1;
      FCurrentSector.Mines_Limpet.Quantity := StrToIntSafe(GetParameter(Line, 2));
      FCurrentSector.Mines_Limpet.Owner := Copy(Line, I, length(Line) - I);
    end
    else if (FSectorPosition = spPorts) then
      FCurrentSector.SPort.BuildTime := StrToIntSafe(GetParameter(Line, 4))
    else if (FSectorPosition = spPlanets) then
    begin
      // Get planet data
      NewPlanet := AllocMem(SizeOf(TPlanet));
      TWXDatabase.NULLPlanet(NewPlanet^);
      NewPlanet^.Name := Copy(Line, 11, length(Line) - 10);
      FPlanetList.Add(NewPlanet);
    end
    else if (FSectorPosition = spTraders) then
    begin
      if (GetParameter(Line, 1) = 'in') then
      begin
        // Still working on one trader
        NewTrader := AllocMem(SizeOf(TTrader));
        I := GetParameterPos(Line, 2);
        NewTrader^.ShipName := Copy(Line, I, Pos('(', Line) - I - 1);
        I := Pos('(', Line);
        NewTrader^.ShipType := Copy(Line, I + 1, Pos(')', Line) - I - 1);
        NewTrader^.Name := FCurrentTrader.Name;
        NewTrader^.Figs := FCurrentTrader.Figs;
        FTraderList.Add(NewTrader);
      end
      else
      begin
        // New trader
        I := Pos(', w/', Line);
        FCurrentTrader.Name := Copy(Line, 11, I - 11);
        S := Copy(Line, I + 5, Pos(' ftrs', Line) - I - 5);
        StripChar(S, ',');
        FCurrentTrader.Figs := StrToIntSafe(S);
      end;
    end
    else if (FSectorPosition = spShips) then
    begin
      if (Copy(Line, 12, 1) = '(') then
      begin
        // Get the rest of the ship info
        NewShip := AllocMem(SizeOf(TShip));
        NewShip^.Name := FCurrentShip.Name;
        NewShip^.Owner := FCurrentShip.Owner;
        NewShip^.Figs := FCurrentShip.Figs;
        NewShip^.ShipType := Copy(Line, 13, Pos(')', Line) - 13);
        FShipList.Add(NewShip);
      end
      else
      begin
        // New ship
        I := Pos('[Owned by]', Line);
        FCurrentShip.Name := Copy(Line, 11, I - 12);
        FCurrentShip.Owner := Copy(Line, I + 11, Pos(', w/', Line) - I - 11);
        I := Pos(', w/', Line);
        S := Copy(Line, I + 5, Pos(' ftrs,', Line) - I - 5);
        StripChar(S, ',');
        FCurrentShip.Figs := StrToIntSafe(S);
        FSectorPosition := spShips;
      end;
    end;
  end
  else if (Copy(Line, 9, 1) = ':') then
    FSectorPosition := spNormal
  else if (Copy(Line, 1, 20) = 'Warps to Sector(s) :') then
  begin
    StripChar(Line, '(');
    StripChar(Line, ')');

    // Get sector warps
    FCurrentSector.Warp[1] := StrToIntSafe(GetParameter(Line, 5));
    FCurrentSector.Warp[2] := StrToIntSafe(GetParameter(Line, 7));
    FCurrentSector.Warp[3] := StrToIntSafe(GetParameter(Line, 9));
    FCurrentSector.Warp[4] := StrToIntSafe(GetParameter(Line, 11));
    FCurrentSector.Warp[5] := StrToIntSafe(GetParameter(Line, 13));
    FCurrentSector.Warp[6] := StrToIntSafe(GetParameter(Line, 15));

    // sector done
    if not (FSectorSaved) then
      SectorCompleted;

    // No displays anymore, all done
    FCurrentDisplay := dNone;
    FSectorPosition := spNormal;
  end;
end;

// MB - Parse QuickStats added in 2.06
// Sect 1?Turns 1,600?Creds 10,000?Figs 30?Shlds 0?Hlds 40?Ore 0?Org 0?Equ 0
// Col 0?Phot 0?Armd 0?Lmpt 0?GTorp 0?TWarp No?Clks 0?Beacns 0?AtmDt 0?Crbo 0
// EPrb 0?MDis 0?PsPrb No?PlScn No?LRS None,Dens,Holo?Aln 0?Exp 0?Ship 1 MerCru
procedure TModExtractor.ProcessQuickStats(Line : String);
var
  I      : Integer;
  Values,
  Parts  : TStringList;
begin
  if (Copy(line,1,1) = ' ') then
  begin
    Values := TStringList.Create;
    Parts  := TStringList.Create;

    Split(Copy(Line,2,Length(Line)-1), Values, '³');
    for I := 0 to (Values.Count - 1) do
    begin
      Parts.Clear;
      Split(Values[I], Parts, ' ');
      if (Parts.Count = 2) then
      begin
        if Parts[0] = 'Turns' then
        begin
          // No corp is displayed if player is not a member of a corp
          FCurrentCorp := 0;
          FCurrentTurns := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        end
        else if Parts[0] = 'Creds' then
          FCurrentCredits := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'Figs' then
          FCurrentFighters := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'Shlds' then
          FCurrentShields := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'Crbo' then
          FCurrentCorbomite := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'Hlds' then
          FCurrentTotalHolds := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Ore' then
          FCurrentOreHolds := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Org' then
          FCurrentOrgHolds := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Equ' then
          FCurrentEquHolds := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Col' then
          FCurrentColHolds := StrToIntSafe(Parts[1])

        else if Parts[0] = 'Phot' then
          FCurrentPhotons := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Armd' then
          FCurrentArmids := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Lmpt' then
          FCurrentLimpets := StrToIntSafe(Parts[1])
        else if Parts[0] = 'GTorp' then
          FCurrentGenTorps := StrToIntSafe(Parts[1])

        else if Parts[0] = 'Clks' then
          FCurrentCloaks := StrToIntSafe(Parts[1])
        else if Parts[0] = 'Beacns' then
          FCurrentBeacons := StrToIntSafe(Parts[1])
        else if Parts[0] = 'AtmDt' then
          FCurrentAtomics := StrToIntSafe(Parts[1])
        else if Parts[0] = 'EPrb' then
          FCurrentEprobes := StrToIntSafe(Parts[1])
        else if Parts[0] = 'MDis' then
          FCurrentMineDisr := StrToIntSafe(Parts[1])

        else if Parts[0] = 'Aln' then
          FCurrentAlignment := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'Exp' then
          FCurrentExperience := StrToIntSafe(stringreplace(Parts[1],',','',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'Corp' then
          FCurrentCorp := StrToIntSafe(Parts[1])

        else if Parts[0] = 'TWarp' then
          FCurrentTwarpType := StrToIntSafe(stringreplace(Parts[1],'No','0',
                                        [rfReplaceAll, rfIgnoreCase]))
        else if Parts[0] = 'PsPrb' then
          FCurrentPsychicProbe := Parts[1] = 'Yes'
        else if Parts[0] = 'PlScn' then
          FCurrentPlanetScanner := Parts[1] = 'Yes'

        else if Parts[0] = 'LRS' then
        begin
          if Parts[1] = 'None' then
            FCurrentScanType := 0
          else if Parts[1] = 'Dens' then
            FCurrentScanType := 1
          else if Parts[1] = 'Holo' then
            FCurrentScanType := 2;
        end;
      end;
      if parts.Count > 2 then
      begin
        if Parts[0] = 'Ship' then
        begin
          FCurrentShipNumber := StrToIntSafe(Parts[1]);
          FCurrentShipClass  := Parts[2];
        end;
      end;
    end;
  end;
end;


procedure TModExtractor.ProcessPortLine(Line : String);
var
  PortClass,
  StatFuel,
  StatOrg,
  StatEquip : String;
  QtyFuel,
  QtyOrg,
  QtyEquip,
  PercFuel,
  PercOrg,
  PercEquip : Integer;
begin
  // Process a line after Docking... or from a CR report
  // By including the space after 'for' we avoid the problem with CR reports on Class 0's
  if (Copy(Line, 1, 20) = 'Commerce report for ') then
  begin
    // Get the Port Name
    FCurrentSector.SPort.Name := Copy(Line, 21, AnsiPos(':', Line) - 21);
  end
  else if (Copy(Line, 1, 8) = 'Fuel Ore') and (Copy(Line, 33, 1) = '%') then
  begin
    // Grab the data from the Fuel Ore line in the Port Report
    Line := StringReplace(Line, '%', '', [rfReplaceAll]);
    StatFuel := GetParameter(Line, 3);
    QtyFuel := StrToIntSafe(GetParameter(Line, 4));
    PercFuel := StrToIntSafe(GetParameter(Line, 5));
    if (StatFuel = 'Buying') then
      FCurrentSector.SPort.BuyProduct[ptFuelOre] := TRUE
    else
      FCurrentSector.SPort.BuyProduct[ptFuelOre] := FALSE;
    FCurrentSector.SPort.ProductAmount[ptFuelOre] := QtyFuel;
    FCurrentSector.SPort.ProductPercent[ptFuelOre] := PercFuel;
  end
  else if (Copy(Line, 1, 8) = 'Organics') and (Copy(Line, 33, 1) = '%') then
  begin
    // Grab the data from the Organics line in the Port Report
    Line := StringReplace(Line, '%', '', [rfReplaceAll]);
    StatOrg := GetParameter(Line, 2);
    QtyOrg := StrToIntSafe(GetParameter(Line, 3));
    PercOrg := StrToIntSafe(GetParameter(Line, 4));
    if (StatOrg = 'Buying') then
      FCurrentSector.SPort.BuyProduct[ptOrganics] := TRUE
    else
      FCurrentSector.SPort.BuyProduct[ptOrganics] := FALSE;
    FCurrentSector.SPort.ProductAmount[ptOrganics] := QtyOrg;
    FCurrentSector.SPort.ProductPercent[ptOrganics] := PercOrg;
  end
  else if (Copy(Line, 1, 9) = 'Equipment') and (Copy(Line, 33, 1) = '%') then
  begin
    // Grab the data from the Equipment line in the Port Report
    Line := StringReplace(Line, '%', '', [rfReplaceAll]);
    StatEquip := GetParameter(Line, 2);
    QtyEquip := StrToIntSafe(GetParameter(Line, 3));
    PercEquip := StrToIntSafe(GetParameter(Line, 4));
    if (StatEquip = 'Buying') then
      FCurrentSector.SPort.BuyProduct[ptEquipment] := TRUE
    else
      FCurrentSector.SPort.BuyProduct[ptEquipment] := FALSE;
    FCurrentSector.SPort.ProductAmount[ptEquipment] := QtyEquip;
    FCurrentSector.SPort.ProductPercent[ptEquipment] := PercEquip;

    // All Products have been seen, so process the data
    // Timestamp the Port data
    FCurrentSector.SPort.UpDate := Now;

    // Only determine the class if it's unknown (-1)
    if not (FCurrentSector.SPort.ClassIndex > 0) then
    begin
      if (FCurrentSector.SPort.BuyProduct[ptFuelOre]) then PortClass := 'B' else PortClass := 'S';
      if (FCurrentSector.SPort.BuyProduct[ptOrganics]) then PortClass := PortClass + 'B' else PortClass := PortClass + 'S';
      if (FCurrentSector.SPort.BuyProduct[ptEquipment]) then PortClass := PortClass + 'B' else PortClass := PortClass + 'S';

      if (PortClass = 'BBS') then FCurrentSector.SPort.ClassIndex := 1
      else if (PortClass = 'BSB') then FCurrentSector.SPort.ClassIndex := 2
      else if (PortClass = 'SBB') then FCurrentSector.SPort.ClassIndex := 3
      else if (PortClass = 'SSB') then FCurrentSector.SPort.ClassIndex := 4
      else if (PortClass = 'SBS') then FCurrentSector.SPort.ClassIndex := 5
      else if (PortClass = 'BSS') then FCurrentSector.SPort.ClassIndex := 6
      else if (PortClass = 'SSS') then FCurrentSector.SPort.ClassIndex := 7
      else if (PortClass = 'BBB') then FCurrentSector.SPort.ClassIndex := 8;
    end;

    if (FCurrentSector.Explored = etNo) then
    begin
    // We're updating the Port data for a previously unseen sector.
      FCurrentSector.Constellation := '???' + ANSI_9 + ' (port data/calc only)';
      FCurrentSector.Explored := etCalc;
    end;

    // That's all of the product info, so save it now
    FCurrentSector.SPort.UpDate := Now;
    TWXDatabase.SaveSector(FCurrentSector, FPortSectorIndex, nil, nil, nil);
  end;
end;

procedure TModExtractor.ProcessFigScanLine(Line : String);
var
  SectorNum, FigQty, Code, Multiplier : Integer;
  SFigAmount, SFigType, SFigOwner : String;
  Sect  : TSector;
  TMB : Char;
begin
  // process and record the Fig Scan Info.  specifically parse and record this line:
  //    940           1       Personal    Defensive            N/A
  //                10T Total
  if (Copy(Line,1,20) = 'No fighters deployed') then
  begin
    ResetFigDatabase();
  end;  // no fighters in G list anymore, have to reset database.

  Val(GetParameter(Line,1), SectorNum, Code);
  if (Code <> 0) then
    Exit;

  Sect := TWXDatabase.LoadSector(SectorNum);
  SFigOwner := GetParameter(Line,3);
  if (SFigOwner = 'Personal') then
    Sect.Figs.Owner := 'yours'
  else
    Sect.Figs.Owner := 'belong to your Corp';

  // work on figuring out how many fighters are displayed
  SFigAmount := GetParameter(Line,2);
  StringReplace(SFigAmount, ',', '', []);
  Val(SFigAmount, FigQty, Code);
  if Code <> 0 then
  begin
    Multiplier := 0;
    TMB := SFigAmount[Code];
    case TMB of
      'T' : Multiplier := 1000;
      'M' : Multiplier := 1000000;
      'B' : Multiplier := 1000000000;
    end;
    // Approximate figs
    FigQty := FigQty * Multiplier;
    // See if previously recorded fig amount is within the margin of rounding
    if (Sect.Figs.Quantity < (FigQty - Multiplier div 2)) or (Sect.Figs.Quantity > (FigQty + Multiplier div 2)) then
      Sect.Figs.Quantity := FigQty;
  end
  else
    Sect.Figs.Quantity := FigQty;

  // pull fig type from the FigScan line
  SFigType := GetParameter(Line,4);
  // Get Fig Type, then assign the right FigType value
  if (SFigType = 'Defensive') then
  begin
    Sect.Figs.FigType := ftDefensive;
  end
  else if (SFigType = 'Toll') then
  begin
    Sect.Figs.FigType := ftToll;
  end
  else
  begin
    Sect.Figs.FigType := ftOffensive;
  end;

  // save the change.
  TWXDatabase.SaveSector(Sect,SectorNum,nil,nil,nil);
end;  // ProcessFigScanLine(String)

procedure TModExtractor.ResetFigDatabase;
var
  i : Integer;
  Sect : TSector;
begin
  // reset fighter owner, type, and quantity for sectors where our figs are thought to be
  for i:= 11 to TWXDatabase.DBHeader.Sectors do
  begin
    if (i <> TWXDatabase.DBHeader.Stardock) then
    begin
      Sect := TWXDatabase.LoadSector(i);
      Sect.Figs.Quantity := 0;
      if (Sect.Figs.Owner = 'yours') or (Sect.Figs.Owner = 'belong to your Corp') then
      begin
        Sect.Figs.Owner := '';
        Sect.Figs.FigType := ftNone;
        Sect.Figs.Quantity := 0;
        TWXDatabase.SaveSector(Sect,i,nil,nil,nil);
      end
    end;
  end;
end;

procedure TModExtractor.ProcessLine(Line : String);
var
  S,
  X       : String;
  I       : Integer;
  Sect    : TSector;
  INI     : TINIFile;
begin
  // Every line is passed to this procedure to be processed and recorded
  if (FCurrentMessage <> '') then
  begin
    if (Line <> '') then
    begin
      if (FCurrentMessage = 'Figs') then
        TWXGUI.AddToHistory(htFighter, TimeToStr(Time) + '  ' + StripChars(Line))
      else if (FCurrentMessage = 'Comp') then
        TWXGUI.AddToHistory(htComputer, TimeToStr(Time) + '  ' + StripChars(Line))
      else
        TWXGUI.AddToHistory(htMsg, TimeToStr(Time) + '  ' + StripChars(Line));

      FCurrentMessage := '';
    end;
  end
  else if (Copy(Line, 1, 2) = 'R ') or (Copy(Line, 1, 2) = 'F ') then
    TWXGUI.AddToHistory(htMsg, TimeToStr(Time) + '  ' + StripChars(Line))
  else if (Copy(Line, 1, 2) = 'P ') then
  begin
    if (GetParameter(Line, 2) <> 'indicates') then
      TWXGUI.AddToHistory(htMsg, TimeToStr(Time) + '  ' + StripChars(Line))
  end
  else if (Copy(Line, 1, 26) = 'Incoming transmission from') or (Copy(Line, 1, 28) = 'Continuing transmission from') then
  begin
    // Transmission with ansi off
    I := GetParameterPos(Line, 4);

    if (Copy(Line, Length(Line) - 9, 10) = 'comm-link:') then
    begin
      // Fedlink
      FCurrentMessage := 'F ' + Copy(Line, I, Pos(' on Federation', Line) - I) + ' ';
    end
    else if (GetParameter(Line, 5) = 'Fighters:') then
    begin
      // Fighters
      FCurrentMessage := 'Figs';
    end
    else if (GetParameter(Line, 5) = 'Computers:') then
    begin
      // Computer
      FCurrentMessage := 'Comp';
    end
    else if (Pos(' on channel ', Line) <> 0) then
    begin
      // Radio
      FCurrentMessage := 'R ' + Copy(Line, I, Pos(' on channel ', Line) - I) + ' ';
    end
    else
    begin
      // hail
      FCurrentMessage := 'P ' + Copy(Line, I, Length(Line) - I) + ' ';
    end
  end
  else if (Copy(Line, 1, 31) = 'Deployed Fighters Report Sector') then
    TWXGUI.AddToHistory(htFighter, TimeToStr(Time) + '  ' + Copy(Line, 19, Length(Line)))
  else if (Copy(Line, 1, 20) = 'Shipboard Computers ') then
    TWXGUI.AddToHistory(htComputer, TimeToStr(Time) + '  ' + Copy(Line, 21, Length(Line)))
  else if (Copy(Line, 14, 8) = 'StarDock') and (Copy(Line, 37, 6) = 'sector') then
  begin
  // Capture Stardock from the 'V' Screen.  Beacon & Constellation are assumed,
  //   but will be updated when the sector is finally visited.
    I := StrToIntSafe(Copy(Line, 44, AnsiPos('.', Line) - 44));
    if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
    begin
      if ((TWXDatabase.DBHeader.StarDock = 0) or (TWXDatabase.DBHeader.StarDock = 65535)) then
      begin
        Sect.Constellation := 'The Federation';
        Sect.Beacon := 'FedSpace, FedLaw Enforced';
        Sect := TWXDatabase.LoadSector(I);
        Sect.SPort.Dead := FALSE;
        Sect.SPort.BuildTime := 0;
        Sect.SPort.Name := 'Stargate Alpha I';
        Sect.SPort.ClassIndex := 9;
        Sect.Explored := etCalc;
        Sect.Update := Now;
        TWXDatabase.SaveSector(Sect, I, nil, nil, nil);

        // MB - Store the stardoc sector in config file.
        INI := TINIFile.Create(TWXGUI.ProgramDir + '\' + StripFileExtension(TWXDatabase.DatabaseName) + '.cfg');
        try
          INI.WriteString('Variables', '$STARDOCK', inttostr(I));
        finally
          INI.Free;
        end;

      end;
    end;
  end
  else if (Copy(Line, 1, 19) = 'The shortest path (') or (Copy(Line, 1, 7) = '  TO > ') then
  begin
    FCurrentDisplay := dWarpLane;
    FLastWarp := 0;
  end
  else if (FCurrentDisplay = dWarpLane) then
    ProcessWarpLine(Line)
  else if (FCurrentDisplay = dWarpCIM) or (FCurrentDisplay = dPortCIM) then
    ProcessCIMLine(Line)
  else if (FCurrentDisplay = dCIM) then
  begin
    // find out what kind of CIM this is
    if (Length(Line) > 2) then
    begin
      if (Line[Length(Line) - 1] = '%') then
      begin
        TWXDatabase.LastPortCIM := Now;
        FCurrentDisplay := dPortCIM;
      end
      else
        FCurrentDisplay := dWarpCIM;

      ProcessCIMLine(Line);
    end;
  end
  else if (ContainsText(Line, '³')) or (Copy(Line, 1, 5) = ' Ship') then
  begin
    // MB - Process QuickStats Line
    ProcessQuickStats(Line);
  end
  else if (Copy(Line, 1, 10) = 'Sector  : ') then
  begin
    // Check if this is a probe or holoscan (no warp pickup)
    if not (FSectorSaved) then
      SectorCompleted;

    // Begin recording of sector data
    FCurrentDisplay := dSector;
    FSectorSaved := FALSE;

    // Clear sector variables
    TWXDatabase.NULLSector(FCurrentSector);

    FCurrentSectorIndex := StrToIntSafe(GetParameter(Line, 3));
    I := GetParameterPos(Line, 5);
    FCurrentSector.Constellation := Copy(Line, I, length(Line) - I + 1);
  end
  else if (FCurrentDisplay = dSector) then
    ProcessSectorLine(Line)
  else if (FCurrentDisplay = dPort) then
    ProcessPortLine(Line)
  else if (Copy(Line, 1, 10) = 'Docking...') then // Normal Port Report
  begin
    if not (FSectorSaved) then
      SectorCompleted;
    FCurrentDisplay := dPort;
    FPortSectorIndex := FCurrentSectorIndex;
    FCurrentSector := TWXDatabase.LoadSector(FPortSectorIndex);
    FSectorSaved := FALSE;
  end
  else if (FCurrentDisplay = dPortCR) then
    ProcessPortLine(Line)
  else if (Copy(Line, 1, 28) = 'What sector is the port in? ') then // Computer Port Report
  begin
    FCurrentDisplay := dPortCR;
    I := AnsiPos(#93, Line);
    if (Length(Line) <> I + 1) then
        FPortSectorIndex := StrToIntSafe(Copy(Line, I + 1, Length(Line) - I))
    else
      FPortSectorIndex := FCurrentSectorIndex;

      FCurrentSector := TWXDatabase.LoadSector(FPortSectorIndex);
  end
  else if (Copy(Line, 27, 16) = 'Relative Density') then
  begin
    // A density scanner is being used - lets grab some data
    FCurrentDisplay := dDensity;
  end
  else if (FCurrentDisplay = dDensity) and (Copy(Line, 1, 6) = 'Sector') then
  begin
    // Save all density data into sector database
    X := Line;
    StripChar(X, '(');
    StripChar(X, ')');
    I := StrToIntSafe(GetParameter(X, 2));
    Sect := TWXDatabase.LoadSector(I);
    S := GetParameter(X, 4);
    StripChar(S, ',');
    Sect.Density := StrToIntSafe(S);

    if (GetParameter(X, 13) = 'Yes') then
      // Sector has Anomaly
      Sect.Anomaly := TRUE
    else
      Sect.Anomaly := FALSE;

    S := GetParameter(X, 10);
    S := Copy(S, 1, length(S) - 1);
    Sect.NavHaz := StrToIntSafe(S);

    Sect.Warps := StrToIntSafe(GetParameter(X, 7));

    if (Sect.Explored in [etNo, etCalc]) then
    begin
      // Sector hasn't been scanned or seen before
      Sect.Constellation := '???' + ANSI_9 + ' (Density only)';
      Sect.Explored := etDensity;
      Sect.Update := Now;
    end;

    TWXDatabase.SaveSector(Sect, I, nil, nil, nil);
  end
  else if (Copy(Line, 1, 2) = ': ') then
  begin
    // begin CIM download
    FCurrentDisplay := dCIM;
  end
  else if (Copy(Line,18,23) = 'Deployed  Fighter  Scan') then
  begin
    FCurrentDisplay := dFigScan;
    FFigScanSector := 0;
    //TFigScanType := fstPersonal;
  end // end 'Deployed Fighter Scan' text line
  else if (FCurrentDisplay = dFigScan) then
  begin
    ProcessFigScanLine(Line);
  end;

  TWXInterpreter.TextLineEvent(Line, FALSE);
  ProcessPrompt(Line);

  // Reactivate script triggers
  TWXInterpreter.ActivateTriggers;
end;

procedure TModExtractor.StripANSI(var S : String);
var
  I    : Integer;
  X    : String;
begin
  // Remove ANSI codes from text
  X := '';

  // Remove bells
  StripChar(S, #7);

  // mb - need to convert quicktexts, so they can be removed.
  S := TWXServer.ApplyQuickText(S);

  for I := 1 to length(S) do
  begin
    if (S[I] = #27) then
      FInAnsi := TRUE;

    if (FInAnsi = FALSE) then
      X := X + S[I];

    if ((Byte(S[I]) >= 65) and (Byte(S[I]) <= 90)) or ((Byte(S[I]) >= 97) and (Byte(S[I]) <= 122)) then
      FInAnsi := FALSE;
  end;

  S := X;
end;

procedure TModExtractor.ProcessInBound(var InData : String);
var
  X        : Integer;
  I        : Integer;
  S,
  ANSIS,
  ANSILine,
  Line     : string;
begin
  S := InData;
  RawANSILine := InData;

  // Remove null chars
  StripChar(S, #0);

  // strip the ANSI
  AnsiS := S;
  // Remove bells
  StripANSI(S);

  TWXLog.DoLogData(S, InData);

  // Remove linefeed
  StripChar(S, #10);
  StripChar(AnsiS, #10);

  // MB - Process autotext
  //TWXInterpreter.AutoTextEvent(S, FALSE);

  // Form and process lines out of data
  I := 1;
  Line := CurrentLine + S;
  AnsiLine := CurrentANSILine + AnsiS;

  while (I <= Length(Line)) do
  begin
    if (Line[I] = #13) then
    begin
      // find the matching carriage return in the ansi line
      X := 1;

      if (Length(ANSILine) > 0) then
        while (ANSILine[X] <> #13) and (X < Length(ANSILine)) do
          Inc(X);

      CurrentLine := Copy(Line, 1, I - 1);
      CurrentANSILine := Copy(ANSILine, 1, X);
      // MB - Process autotext
      //TWXInterpreter.AutoTextEvent(CurrentLine, FALSE);
      ProcessLine(CurrentLine);

      if (I < Length(Line)) then
      begin
        Line := Copy(Line, I + 1, Length(Line) - I);
        ANSILine := Copy(ANSILine, X + 1, Length(ANSILine) - X);
      end
      else
      begin
        Line := '';
        ANSILine := '';
        Break;
      end;

      I := 0;
    end;

    Inc(I);
  end;

  // Process what we have left
  CurrentLine := Line;
  CurrentANSILine := ANSILine;

  // MB - Process autotext for prompts only, otherwise they
  //      get fired twice on the same event.
  TWXInterpreter.AutoTextEvent(CurrentLine, FALSE);

  ProcessPrompt(CurrentLine);
end;



// ********************************************************************
// Process outbound data



function TModExtractor.ProcessOutBound(OutData : string; ClientIndex : Byte) : Boolean;
begin
  Result := TRUE;

  if (OutData[1] = MenuKey) and (TWXMenu.CurrentMenu = nil) then
  begin
    // Activate menu

    if not (TWXClient.Connected) then
    begin
      // User trying to access database while not connected

      if not (TWXDatabase.DataBaseOpen) then
        TWXServer.ClientMessage(endl + ANSI_12 + 'Warning: This database is corrupt or does not exist.  No data is available.' + ANSI_7 + endl);
    end;

    TWXMenu.OpenMenu('TWX_MAIN', ClientIndex);

    // run the rest of the text through the menus
    if (Length(OutData) > 1) then
      ProcessOutBound(Copy(OutData, 2, Length(OutData)), ClientIndex);

    Result := FALSE;
  end
  else if (TWXMenu.CurrentMenu <> nil) then
  begin
    if (TWXMenu.CurrentMenu.Name = 'TWX_SCRIPT') and (OutData[1] = #27) then
      // Cancel any active variable dumps if Escape is pressed
      TWXServer.StopVarDump
    else if (OutData[1] = MenuKey) then
      // De-activate menu
      TWXMenu.CloseMenu(TRUE)
    else
      // Send commands to menu
      TWXMenu.MenuText(OutData, ClientIndex);

    Result := FALSE;
  end;

  // don't return a value if trigger had this key
  if (Result) and (OutData <> '') then
    Result := not TWXInterpreter.TextOutEvent(OutData, nil);
end;

end.



