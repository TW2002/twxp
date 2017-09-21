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
// This unit controls all database access.

unit
  DataBase;

interface

uses
  Core,
  Classes,
  SysUtils;

const
  // Version for 2.03 is 7
  // Version for 2.04 is 8
  DATABASE_VERSION = 8;

  Day : array[1..7] of string = ('Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat');

type
  // Enumerated types
  TFighterType = (ftToll, ftDefensive, ftOffensive, ftNone);
  TSectorExploredType = (etNo, etCalc, etDensity, etHolo);
  TProductType = (ptFuelOre, ptOrganics, ptEquipment);

  // Exceptions
  EDatabaseError = class(Exception);

  // database records
  TDataHeader = record
    ProgramName : string[12];
    Version     : Byte;
    Sectors,
    StarDock,
    AlphaCentauri,
    Rylos       : Word;
    Address,
    Description : string[40];
    ServerPort,
    Port        : Word;
    LoginScript : string[255];
    Password,
    LoginName   : string[40];
    Game        : Char;
    UseLogin    : Boolean;
    RobFactor,
    StealFactor : Byte;
    LastPortCIM : TDateTime;
  end;
  PDataHeader = ^TDataHeader;

  TSpaceObject = record
    Quantity : LongInt;
    Owner    : string[40];
    FigType  : TFighterType;
  end;
  PTrader = ^TTrader;
  TTrader = record
    Name,
    ShipType,
    ShipName    : string[40];
    Figs        : LongInt;
    NextTrader  : LongInt;
  end;
  PShip = ^TShip;
  TShip = record
    Name,
    Owner,
    ShipType    : string[40];
    Figs        : LongInt;
    NextShip    : LongInt;
  end;
  TPort = record
    Name           : string[40];
    Dead           : Boolean;
    BuildTime,
    ClassIndex     : Byte;
    BuyProduct     : array[TProductType] of Boolean;
    ProductPercent : array[TProductType] of Byte;
    ProductAmount  : array[TProductType] of Word;
    UpDate         : TDateTime;
  end;
  PSector = ^TSector;
  TSector = record
//    Index         : Word;
    Warp          : array[1..6] of Word;
    SPort         : TPort;
    NavHaz        : Byte;
    Figs,
    Mines_Armid,
    Mines_Limpet  : TSpaceObject;
    Constellation,
    Beacon        : string[40];
    UpDate        : TDateTime;
    Anomaly       : Boolean;
    Density       : LongInt;
    Warps         : Byte;
    Explored      : TSectorExploredType;
    Ships,
    Traders,
    Planets,
    Vars          : LongInt;
  end;
  PPlanet = ^TPlanet;
  TPlanet = record
    Name       : string[40];
    NextPlanet : LongInt;
  end;
  PWarpIn = ^TWarpIn;
  TWarpIn = record
    Origin     : Word;
    NextWarpIn : PWarpIn;
  end;

  TSectorVar = record
    VarName: string[10];
    Value: string[40];
    NextVar: LongInt;
  end;
  PSectorVar = ^TSectorVar;

  TSectorItem = (itPlanet, itTrader, itShip);

  TEmptyRecordGroup = record
    RecordSize   : Word;
    EmptyRecords : array of Integer;
  end;

  TModDatabase = class(TTWXModule, IModDatabase, ITWXGlobals)
  private
    CacheAllocated,
    FRecording,
    FUseCache,
    FDataBaseOpen     : Boolean;
    FListenPort       : Word;
    FDataFilename     : string;
    DataFile          : File;
    DataCache,
    SectorWarpCache   : Pointer;
    DBSize,
    CacheSize         : Integer;
    EmptyRecordGroups : array of TEmptyRecordGroup;
    FDBHeader         : TDataHeader;
    FProgramDir       : string;
    EPWarpCache,
    Que,
    ReverseArray,
    SectorAsWord      : array of Word;
    VoidArray,
    CheckedArray      : array of Byte;

    procedure AddSectorVar(SectorIndex: Integer; SectorVar: PSectorVar);
    procedure FindSectorVar(SectorIndex: Integer; const VarName: string; var SectorVar: PSectorVar; var Index: Integer);
//    function LoadSectorVar(SectorIndex: Integer; VarName: string) : PSectorVar;
    procedure DeleteSectorVar(SectorIndex: Integer; const VarName: string);
    procedure AddWarpIn(Sect, Origin : Word);
    function GetEmptyRecord(Size : Integer) : Integer;
    procedure CacheEmptyRecords;
    procedure CacheEmptyRecord(Index : Integer; Size : Word);
    procedure ReadRecordList(List : TList; FirstPos : Integer);
    function WriteRecordList(List : TList; RecordSize : Word) : Integer;
    procedure PurgeRecordList(FirstPos : Integer);
    procedure WriteRecord(Rec : Pointer; Pos, Next : Integer; Size : Word);
    procedure ReadData(Data : Pointer; Index, Size : Integer);
    procedure WriteData(Data : Pointer; Index, Size : Integer);
    procedure OpenCache;
    procedure CloseCache;
    function GetLastPortCIM: TDateTime;
    procedure SetLastPortCIM(const Value: TDateTime);
    function GetServerPort: Word;
    procedure SetServerPort(Value: Word);

  protected

    { ITWXGlobals }
    function GetProgramDir: string;
    procedure SetProgramDir(const Value: string);

    { IModDatabase }
    function GetDatabaseName: string;
    procedure SetDatabaseName(const Value: string);
    function GetUseCache: Boolean;
    procedure SetUseCache(Value: Boolean);
    function GetRecording: Boolean;
    procedure SetRecording(Value: Boolean);

  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;

    // DB control methods
    procedure OpenDataBase(Filename : string);
    procedure CloseDataBase;
    procedure CreateDatabase(Filename : string; Head : TDataHeader);

    // main storage/retrieval methods
    procedure SaveSector(S: TSector; Index: Integer; ShipList: TList = nil; TraderList: TList = nil; PlanetList: TList = nil);
    function LoadSector(I : Integer) : TSector;
    procedure UpdateWarps(SectIndex : Integer);
    function GetSectorItems(ItemType : TSectorItem; Sector : TSector) : TList;
    function GetWarpsIn(Sect : Integer) : TList;
    function GetBackDoors(S: TSector; SectorIndex: Integer) : TList;
    procedure ClearPlotArrays;
    function QueArrayToStringList : TStringList;
    procedure CoursesToTLists(var CourseLists : array of TList);
    function PlotWarpCourse(FromSect, ToSect : Integer) : TList;
    procedure WriteHeader;
    procedure DumpData;
    procedure SetSectorVar(SectorIndex: Integer; const VarName, VarValue: string);
    function GetSectorVar(SectorIndex: Integer; const VarName: string): string;
    function ListSectorVars(SectorIndex: Integer) : TStringList;
    procedure SetVoid(SectorIndex : Integer);
    procedure UnsetVoid(SectorIndex : Integer);
    procedure UnsetAllVoids;
    function VoidList : TList;
    function ListDatabases : TStringList;

    // null item retrieval
    procedure NULLSector(var Sector : TSector);
    procedure NULLPlanet(var Planet : TPlanet);
    procedure NULLTrader(var Trader : TTrader);
    procedure NULLShip(var Ship : TShip);

    property Sectors[Index : Integer] : TSector read LoadSector;
    property DataBaseOpen : Boolean read FDataBaseOpen;
    property DBHeader: TDataHeader read FDBHeader;
    property LastPortCIM: TDateTime read GetLastPortCIM write SetLastPortCIM;

  published
    property DatabaseName: string read GetDatabaseName write SetDatabaseName;
    property UseCache: Boolean read GetUseCache write SetUseCache;
    property Recording: Boolean read GetRecording write SetRecording;
    property ServerPort: Word read GetServerPort write SetServerPort;
  end;

function GetBlankHeader : PDataHeader;

implementation

uses
  Global,
  Utility,
  Windows,
  Forms,
  Ansi,
  Dialogs;

type
  TWarpItem = class(TObject)
  public
    Index     : Word;
    Parent    : TWarpItem;
  end;

function WarpsTo(Source: TSector; DestIndex: Integer) : Boolean;
begin
  WarpsTo := (Source.Warp[1] = DestIndex)
    or (Source.Warp[2] = DestIndex)
    or (Source.Warp[3] = DestIndex)
    or (Source.Warp[4] = DestIndex)
    or (Source.Warp[5] = DestIndex)
    or (Source.Warp[6] = DestIndex);
end;

function GetBlankHeader : PDataHeader;
begin
  Result := AllocMem(SizeOf(TDataHeader));

  ZeroMemory(Result, SizeOf(TDataHeader));

  Result^.ProgramName := 'TWX DATABASE';
  Result^.Version := DATABASE_VERSION;
  Result^.Address := '<Server>';
  Result^.Port := 23;
  Result^.ServerPort := 23;
end;



// ***********************************************************
// Public Implementation


procedure TModDatabase.AfterConstruction;
begin
  inherited;

  // initialise variables
  FDatabaseOpen := FALSE;
  SectorWarpCache := nil;
  FUseCache := True;
  FRecording := True;
end;

procedure TModDatabase.BeforeDestruction;
begin
  // ensure database is closed
  CloseDataBase;

  inherited;
end;

function TModDatabase.GetProgramDir: string;
begin
  Result := FProgramDir;
end;

procedure TModDatabase.SetProgramDir(const Value: string);
begin
  FProgramDir := Value;
end;



// ---------------------------
// DB control methods

procedure TModDatabase.OpenDataBase(Filename : string);
var
  WarpCount,
  I,
  X,
  Index     : Integer;
  S         : TSector;
begin
  if (DataBaseOpen) then
    Exit;

  TWXServer.Broadcast(endl + ANSI_15 + 'Loading database: ' + ANSI_7 + Filename + endl);
  FDataFilename := Filename;
  SetCurrentDir(FProgramDir);

  // Open database
  AssignFile(DataFile, Filename);

{$I-}
  Reset(DataFile, 1);

  if (IOResult <> 0) then
  begin
    TWXServer.Broadcast(endl + ANSI_12 + 'Warning: This database does not exist.  No data will be saved/retrieved' + ANSI_7 + endl);
    CloseDatabase;
    Exit;
  end;
{$I+}

  // Check database validity and version number
  Seek(DataFile, 0);
  BlockRead(DataFile, FDBHeader, SizeOf(TDataHeader));

  if (DBHeader.ProgramName <> 'TWX DATABASE') then
  begin
    TWXServer.Broadcast(endl + ANSI_12 + 'Warning: This database has been corrupted, no data will be saved/retrieved' + ANSI_7 + endl);
    CloseDatabase;
    Exit;
  end;

  if (DBHeader.Version <> DATABASE_VERSION) then
  begin
    TWXServer.Broadcast(endl + ANSI_12 + 'Warning: Database version ' + IntToStr(DBHeader.Version) + ', expected version ' + IntToStr(DATABASE_VERSION) + ', no data will be saved/retrieved' + ANSI_7 + endl);
    CloseDatabase;
    Exit;
  end;

  FListenPort := DBHeader.ServerPort; // EP - Listening Port persists here now

  if (UseCache) then
    OpenCache
  else
    CloseCache;

  FDatabaseOpen := TRUE;
  DBSize := FileSize(DataFile);

  // cache empty record indexes
  CacheEmptyRecords;

  // construct sector warp cache
  SectorWarpCache := AllocMem(DBHeader.Sectors * 4);
  WarpCount := 0;

  // create persistent structures used by getCourse
  SetLength(EPWarpCache, (DBHeader.Sectors + 1) * 7);
  SetLength(Que, DBHeader.Sectors + 1);
  SetLength(ReverseArray, DBHeader.Sectors + 1);
  SetLength(VoidArray, DBHeader.Sectors + 1);
  SetLength(CheckedArray, DBHeader.Sectors + 1);
  SetLength(SectorAsWord, DBHeader.Sectors + 1);

  for I := 1 to DBHeader.Sectors do
  begin
    SectorAsWord[I] := I;
    S := LoadSector(I);
    Index := I * 7;

    for X := 1 to 6 do
      if (S.Warp[X] > 0) then
      begin
        Inc(WarpCount);
        AddWarpIn(S.Warp[X], I);
        // Sector 1's warp count occupies [7], and it's warps occupy [8] - [13]
        // Add one to the warp count
        Inc(EPWarpCache[Index]);
        EPWarpCache[Index + X] := S.Warp[X];
      end
      else
        Break;
  end;

  TWXLog.DatabaseChanged;

  TWXServer.Broadcast(endl + ANSI_15 + 'Database successfully loaded - ' + IntToStr(DBHeader.Sectors) + ' sectors, ' + IntToStr(WarpCount) + ' warps' + endl);

  TWXGUI.DatabaseName := StripFileExtension(ShortFilename(Filename));
end;

procedure TModDatabase.CloseDataBase;
var
  W,
  Last     : PWarpIn;
  P        : Pointer;
  I,
  CacheEnd : Integer;
begin
  if not (FDatabaseOpen) then
    Exit;

{$I-}
  CloseFile(DataFile);
{$I+}
  FDatabaseOpen := FALSE;

  // deconstruct sector warp cache
  P := SectorWarpCache;
  CacheEnd := Integer(P) + DBHeader.Sectors * 4;

  while (Integer(P) < CacheEnd) do
  begin
    W := PWarpIn(P^);

    while (W <> nil) do
    begin
      Last := W;
      W := W^.NextWarpIn;
      FreeMem(Last);
    end;

    P := Pointer(Integer(P) + SizeOf(Pointer));
  end;

  // purge old empty record caches
  if (Length(EmptyRecordGroups) > 0) then
    for I := 0 to Length(EmptyRecordGroups) - 1 do
      SetLength(EmptyRecordGroups[I].EmptyRecords, 0);

  SetLength(EmptyRecordGroups, 0);

  // purge persistent arrays used for course plotting
  SetLength(EPWarpCache, 0);
  SetLength(Que, 0);
  SetLength(ReverseArray, 0);
  SetLength(VoidArray, 0);
  SetLength(CheckedArray, 0);

  FreeMem(SectorWarpCache);
  CloseCache;
  FDataFilename := '';
end;

procedure TModDatabase.CreateDatabase(Filename : string; Head : TDataHeader);
var
  I        : Integer;
  Sect     : TSector;
  F        : File;
  FileOpen : Boolean;
begin
  // Make a database - it doesn't exist
  TWXServer.Broadcast(endl + ANSI_15 + 'Creating database: ' + ANSI_7 + Filename + ANSI_15 + ' (' + IntToStr(Head.Sectors) + ')' + ANSI_7 + endl);
  SetCurrentDir(FProgramDir);

  FileOpen := FALSE;

  try
    AssignFile(F, Filename);
    ReWrite(F, 1);
    FileOpen := TRUE;
    BlockWrite(F, Head, SizeOf(TDataHeader));
    NULLSector(Sect);

    for I := 0 to Head.Sectors do
      BlockWrite(F, Sect, SizeOf(Sect));
  finally
    if (FileOpen) then
      CloseFile(F);
  end;
end;

// ---------------------------
// main storage/retrieval methods

procedure TModDatabase.SaveSector(S: TSector; Index: Integer; ShipList: TList = nil; TraderList: TList = nil; PlanetList: TList = nil);
var
  Sect    : TSector;
  I,
  J,
  X       : Integer;
  Bad,
  Found   : Boolean;
  WarpsIn : TList;
  Product : TProductType;
begin
  // Save this sector to file if set to record data

  if (Recording) and (DatabaseOpen) then
  begin
    Bad := (Index < 1) or (Index > DBHeader.Sectors);
    I := 1;

    while not Bad and (I <= 6) do
    begin
      if (S.Warp[I] > DBHeader.Sectors) then
        Bad := True;

      Inc(I);
    end;

    if Bad then
    begin
      SetForegroundWindow(Application.Handle);
      TWXServer.ClientMessage('Unable to store sector ''' + IntToStr(Index) + ''', closing database.');
      CloseDatabase;
      Exit;
    end;

    ReadData(@Sect, Index * SizeOf(TSector) + SizeOf(TDataHeader), SizeOf(Sect));

    // If this sector has been probed, recall warps if seen before
    if (S.Warp[1] = 0) and (Sect.Warp[1] <> 0) then
      S.Warp := Sect.Warp;

    // Don't go over density or Anomaly readings unless this is a density scan
    if (S.Density = -1) then
    begin
      S.Density := Sect.Density;
      S.Anomaly := Sect.Anomaly;
    end;

    // Don't go over port details unless they are specified
    if (S.SPort.UpDate = 0) then
    begin
      S.SPort.Update := Sect.SPort.UpDate;

      for Product := Low(TProductType) to High(TProductType) do
      begin
        S.SPort.ProductAmount[Product] := Sect.SPort.ProductAmount[Product];
        S.SPort.ProductPercent[Product] := Sect.SPort.ProductPercent[Product];
      end;
    end;

    // save stardock details if this sector has it
    if (S.SPort.ClassIndex = 9) and (Sect.SPort.ClassIndex <> 9) then
    begin
      FDBHeader.StarDock := Index;
      WriteHeader;
    end;

    // save Alpha Centauri and Rylos details if this sector has them
    if (S.SPort.ClassIndex = 0) then
    begin
      if (S.SPort.Name = 'Alpha Centauri') then
      begin
        FDBHeader.AlphaCentauri := Index;
        WriteHeader;
      end
      else if (S.SPort.Name = 'Rylos') then
      begin
        FDBHeader.Rylos := Index;
        WriteHeader;
      end;
    end;

    // save sector parameters if any exist
    if (S.Vars = 0)  and (Sect.Vars <> 0) then
      S.Vars := Sect.Vars;
    // -1 is returned when the last sector param is deleted
    if (S.Vars = -1) then
      S.Vars := 0;

    // update sector warp count
    S.Warps := 6;

    for I := 1 to 6 do
      if (S.Warp[I] = 0) then
      begin
        S.Warps := I - 1;
        Break;
      end;

    // Purge old ship, trader and planet data
    if (ShipList <> nil) then
    begin
      PurgeRecordList(Sect.Ships);
      // Write the ships to file
      S.Ships := WriteRecordList(ShipList, SizeOf(TShip));
    end;

    if (TraderList <> nil) then
    begin
      PurgeRecordList(Sect.Traders);
      // Write the traders to file
      S.Traders := WriteRecordList(TraderList, SizeOf(TTrader));
    end;

    if (PlanetList <> nil) then
    begin
      PurgeRecordList(Sect.Planets);
      // Write the planets to file
      S.Planets := WriteRecordList(PlanetList, SizeOf(TPlanet));
    end;

    // write sector to database
    WriteData(@S, Index * SizeOf(TSector) + SizeOf(TDataHeader), SizeOf(TSector));

    // Update sector warp cache with new specs (if need be)
    J := Index * 7; // Pointer to update the EPWarpCache
    for I := 1 to 6 do
      if (S.Warp[I] > 0) then
      begin
        EPWarpCache[J] := I;   // Update warp count
        EPWarpCache[J + I] := S.Warp[I]; // Update warp

        WarpsIn := GetWarpsIn(S.Warp[I]);

        // see if its in there already
        X := 0;
        Found := FALSE;

        while (X < WarpsIn.Count) do
        begin
          if (TWarpIn(WarpsIn.Items[X]^).Origin = Index) then
          begin
            Found := TRUE;
            Break;
          end;

          Inc(X);
        end;

        WarpsIn.Free;

        if not (Found) then
          AddWarpIn(S.Warp[I], Index);
      end
      else
        Break;
  end;
end;

function TModDatabase.LoadSector(I : Integer) : TSector;
begin
  if (I <= 0) or (I > DBHeader.Sectors) then
    raise EDatabaseError.Create('Unable to load sector: ' + IntToStr(I));

  if not (DatabaseOpen) then
    // no database or database is corrupt - load a blank sector
    NULLSector(Result)
  else
    ReadData(@Result, I * SizeOf(TSector) + SizeOf(TDataHeader), SizeOf(TSector));
end;

procedure TModDatabase.UpdateWarps(SectIndex : Integer);
var
  I : Integer;
  S : TSector;
begin
  // find out how many warps there are going out of this sector
  S := LoadSector(SectIndex);

  I := 1;

  while (I <= 6) do
  begin
    if (S.Warp[I] = 0) then
      Break;

    Inc(I);
  end;

  S.Warps := I;
  SaveSector(S, SectIndex, nil, nil, nil);
end;

function TModDatabase.GetSectorItems(ItemType : TSectorItem; Sector : TSector) : TList;
begin
  Result := TList.Create;

  if not (DatabaseOpen) then
    // no database or database is corrupt
    Exit;

  if (ItemType = itPlanet) then
    ReadRecordList(Result, Sector.Planets)
  else if (ItemType = itTrader) then
    ReadRecordList(Result, Sector.Traders)
  else if (ItemType = itShip) then
    ReadRecordList(Result, Sector.Ships);
end;

function TModDatabase.GetWarpsIn(Sect : Integer) : TList;
var
  W : PWarpIn;
begin
  Result := TList.Create;

  if not (DatabaseOpen) then
    Exit;

  W := PWarpIn(Pointer(Integer(SectorWarpCache) + (Sect - 1) * 4)^);

  while (W <> nil) do
  begin
    Result.Add(W);
    W := W^.NextWarpIn;
  end;
end;

function TModDatabase.GetBackDoors(S: TSector; SectorIndex: Integer) : TList;
var
  I       : Integer;
  W       : PWarpIn;
  Sect    : ^Word;
  WarpsIn : TList;
begin
  WarpsIn := GetWarpsIn(SectorIndex);
  Result := TList.Create;

  if not (DatabaseOpen) then
    // no database or database is corrupt
    Exit;

  I := 0;

  while (I < WarpsIn.Count) do
  begin
    W := PWarpIn(WarpsIn.Items[I]);

    if not (WarpsTo(S, W^.Origin)) then
    begin
      Sect := AllocMem(SizeOf(Word));
      Sect^ := W^.Origin;
      Result.Add(Sect);
    end;

    Inc(I);
  end;

  WarpsIn.Free;
end;

procedure TModDatabase.ClearPlotArrays;
begin
  ZeroMemory(@Que[0], (DBHeader.Sectors + 1) * SizeOf(Word));
  ZeroMemory(@ReverseArray[0], (DBHeader.Sectors + 1) * SizeOf(Word));
end;

function TModDatabase.QueArrayToStringList : TStringList;
var
  I : Integer;
begin
  Result := TStringList.Create;
  for I := 1 to Que[0] do
    Result.Add(IntToStr(Que[I]));

end;

procedure TModDatabase.CoursesToTLists(var CourseLists : array of TList); // Size = DBHeader.Sectors
var
  I : Integer;
  Reverse : Word;
begin
  for I := 0 to DBHeader.Sectors - 1 do begin
    CourseLists[I] := TList.Create;
    CourseLists[I].Add(@SectorAsWord[I + 1]);
    Reverse := ReverseArray[I + 1];
    while (Reverse > 0) do begin
      CourseLists[I].Add(@SectorAsWord[Reverse]);
      Reverse := ReverseArray[Reverse];
    end;
  end;
end;

function TModDatabase.PlotWarpCourse(FromSect, ToSect : Integer) : TList;
var
  Top,
  Bottom,
  PFocusWarp,
  Count       : ^Word;
  Focus,
  Adjacent,
  I           : Word;
  CacheIndex  : Integer;
begin
  Result := TList.Create;
  CopyMemory(@CheckedArray[1], @VoidArray[1], DBHeader.Sectors);
  CheckedArray[FromSect] := 1;
  ReverseArray[FromSect] := 0;
  Count := @Que[0]; // Use the first element of Que to track it's current count
  Count^ := 1;
  Top := @Que[1];
  Top^ := FromSect;
  Bottom := Top;
  while (Integer(Bottom) <= Integer(Top)) do begin
    Focus := Bottom^;
    CacheIndex := Focus * 7;
    PFocusWarp := @EPWarpCache[CacheIndex + 1];
    for I := 1 to EPWarpCache[CacheIndex] do begin
      Adjacent := PFocusWarp^;
      if not (Adjacent > 0) then Break;
      if (CheckedArray[Adjacent] = 0) then begin
        ReverseArray[Adjacent] := Focus;
        if (Adjacent = ToSect) then begin
          while (Adjacent > 0) do begin
            // There's a persistent array, SectorAsWord, where the Value
            // matches the Index (Eg. SectorAsWord[100] = 100)
            Result.Add(@SectorAsWord[Adjacent]);
            Adjacent := ReverseArray[Adjacent];
          end;
          Exit;
        end;
        CheckedArray[Adjacent] := 1;
        Inc(Top);
        Top^ := Adjacent;
        Inc(Count^);
      end;
      Inc(PFocusWarp);
    end;
    Inc(Bottom);
  end;
end;

procedure TModDatabase.SetVoid(SectorIndex : Integer);
begin
  VoidArray[SectorIndex] := 1;
end;

procedure TModDatabase.UnsetVoid(SectorIndex : Integer);
begin
  VoidArray[SectorIndex] := 0;
end;

procedure TModDatabase.UnsetAllVoids;
var
  I    : Integer;
begin
  For I := 0 to DBHeader.Sectors do // iterates SECTORS + 1 times
    VoidArray[I] := 0;
end;

function TModDatabase.VoidList : TList;
var
  I : Word;
begin
  Result := TList.Create;
  For I := 1 to DBHeader.Sectors do // So we start at 1 instead of zero
    if (VoidArray[I] = 1) then
      Result.Add(@SectorAsWord[I]);
end;

procedure TModDatabase.WriteHeader;
begin
  if not (DatabaseOpen) then
    // no database or database is corrupt
    Exit;

  // update the DB header in file and cache
  WriteData(@DBHeader, 0, SizeOf(TDataHeader));
end;

procedure TModDatabase.DumpData;
var
  Next,
  Pos   : Integer;
  Size  : Word;
  InUse : Byte;
  InUseStr : string;
begin
  // dump stored records

  Pos := SizeOf(TSector) * (DBHeader.Sectors + 1) + SizeOf(TDataHeader);

  while (Pos < DBSize) do
  begin
    ReadData(@Size, Pos, 2);
    ReadData(@InUse, Pos + 2, 1);
    ReadData(@Next, Pos + 3, 4);

    if (InUse <> 0) then
      InUseStr := 'YES'
    else
      InUseStr := 'NO';

    TWXServer.Broadcast(endl + ANSI_15 + 'In use: ' + ANSI_14 + InUseStr);
    TWXServer.Broadcast(endl + ANSI_15 + 'Size: ' + ANSI_14 + IntToStr(Size));
    TWXServer.Broadcast(endl + ANSI_15 + 'Next: ' + ANSI_14 + IntToStr(Next) + endl);

    Inc(Pos, Size + 7);
  end;
end;

procedure TModDatabase.SetSectorVar(SectorIndex: Integer; const VarName, VarValue: string);
var
  SectorVar: PSectorVar;
  VarOffset: Integer;
begin
  if (VarValue = '') then
    DeleteSectorVar(SectorIndex, VarName)
  else begin
    FindSectorVar(SectorIndex, VarName, SectorVar, VarOffset);
    if Assigned(SectorVar) then begin
      try
        // Record already exists - write over the Value part of it
        SectorVar.Value := VarValue;
        // 7 Bytes record overhead + 10 bytes var name in record
        WriteRecord(SectorVar, VarOffset, 0, SizeOf(TSectorVar));
      finally
        FreeMem(SectorVar);
      end;
    end
    else begin
      // Record doesn't exist - create a new one
      SectorVar := AllocMem(SizeOf(TSectorVar));
      try
        SectorVar.VarName := VarName;
        SectorVar.Value := VarValue;
        AddSectorVar(SectorIndex, SectorVar);
      finally
        FreeMem(SectorVar);
      end;
    end;
  end;
end;

function TModDatabase.GetSectorVar(SectorIndex: Integer; const VarName: string): string;
var
  SectorVar: PSectorVar;
  VarOffset: Integer;
begin
  // return value of this sector variable
  FindSectorVar(SectorIndex, VarName, SectorVar, VarOffset);

  if Assigned(SectorVar) then begin
    try
      Result := SectorVar.Value;
    finally
      FreeMem(SectorVar);
    end;
  end
  else
    Result := '';
end;

// ---------------------------
// null item retrieval


procedure TModDatabase.NULLSector(var Sector : TSector);
begin
  ZeroMemory(@Sector, SizeOf(Sector));

  Sector.Density := -1;
end;

procedure TModDatabase.NULLPlanet(var Planet : TPlanet);
begin
  ZeroMemory(@Planet, SizeOf(Planet));
end;

procedure TModDatabase.NULLTrader(var Trader : TTrader);
begin
  ZeroMemory(@Trader, SizeOf(Trader));
end;

procedure TModDatabase.NULLShip(var Ship : TShip);
begin
  ZeroMemory(@Ship, SizeOf(Ship));
end;


// ***********************************************************
// Protected Implementation


procedure TModDatabase.AddSectorVar(SectorIndex: Integer; SectorVar: PSectorVar);
const
  RecordSize = SizeOf(TSectorVar);
var
  RecPos,
  LastRecord,
  ThisRecord : Integer;
  S: TSector;
  PSecVar : PSectorVar;
begin
  // seek the end of the sector variable list for this sector and add the variable
  ThisRecord := Sectors[SectorIndex].Vars;
  if (ThisRecord = 0) then begin
    // update sector directly (no variables yet)
    RecPos := GetEmptyRecord(RecordSize);
    S := LoadSector(SectorIndex);
    S.Vars := RecPos;
    SaveSector(S, SectorIndex);
    WriteRecord(SectorVar, RecPos, 0, RecordSize);
  end
  else begin
    PSecVar := AllocMem(RecordSize);
    try
      // Find the first record in the list where .NextVar is empty
      repeat
        ReadData(PSecVar, ThisRecord + 7, RecordSize);
        LastRecord := ThisRecord;
        ThisRecord := PSecVar.NextVar;
      until (ThisRecord = 0);
      // Now add this Var to the end of the list
      RecPos := GetEmptyRecord(RecordSize);
      PSecVar.NextVar := RecPos;
      WriteRecord(SectorVar, RecPos, 0, RecordSize);
      // And update the NextVar field in the previous record
      WriteRecord(PSecVar, LastRecord, 0, RecordSize);
    finally
      FreeMem(PSecVar);
    end;
  end;
end;

procedure TModDatabase.FindSectorVar(SectorIndex: Integer; const VarName: string; var SectorVar: PSectorVar; var Index: Integer);
const
  RecordSize = SizeOf(TSectorVar);
var
  NextRecord : Integer;
begin
  // Locate a sector variable of the specific name within the database, returning
  // a pointer to a record representing it in memory, and the index of its position
  // within the database.
  NextRecord := Sectors[SectorIndex].Vars;
  Index := 0;
  SectorVar := AllocMem(RecordSize);
  try
    while (NextRecord > 0) do
    begin
      ReadData(SectorVar, NextRecord + 7, RecordSize);
      if (SectorVar.VarName = VarName) then begin
        Index := NextRecord;
        Break;
      end;
      NextRecord := SectorVar.NextVar;
    end;
  finally
    if (Index = 0) then begin
      FreeMem(SectorVar);
      SectorVar := nil;
    end;
  end;
end;

function TModDatabase.ListDatabases: TStringList;
var
  S        : TSearchRec;
  FileOpen,
  Errored  : Boolean;
  Head     : TDataHeader;
  F        : File;
  Sectors,
  Name     : string;
begin
  // display all items in 'data\' directory
  Result := TStringList.Create;
  SetCurrentDir(FProgramDir);
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
        Result.Add(Name + '(' + Sectors + ')' + endl)
      end;
    until (FindNext(S) <> 0);
    SysUtils.FindClose(S);
  end;
end;

function TModDatabase.ListSectorVars(SectorIndex : Integer) : TStringList;
const
  RecordSize = SizeOf(TSectorVar);
var
  NextRecord : Integer;
  SectorVar : PSectorVar;
  I : Integer;
begin
  Result := TStringList.Create;
  NextRecord := Sectors[SectorIndex].Vars;
  SectorVar := AllocMem(RecordSize);
  try
    I := 0;
    while (NextRecord > 0) do begin
      Inc(I);
      if (I > 13) then
        Break;
      ReadData(SectorVar, NextRecord + 7, RecordSize);
      if (SectorVar.VarName <> '') then begin
        Result.Add(SectorVar.VarName);
      end;
      NextRecord := SectorVar.NextVar;
    end;
  finally
    FreeMem(SectorVar);
  end;
end;

procedure TModDatabase.DeleteSectorVar(SectorIndex: Integer; const VarName: string);
const
  RecordSize = SizeOf(TSectorVar);
var
  LastRecord,
  ThisRecord,
  NextRecord: Integer;
  S: TSector;
  SectorVar: PSectorVar;
  InUse : Byte;
begin
  // Find the sector var with a matching name and unlink it from the list,
  // flagging it as inactive.
  ThisRecord := Sectors[SectorIndex].Vars;
  LastRecord := 0;

  SectorVar := AllocMem(RecordSize);
  try
    while (ThisRecord <> 0) do begin
      ReadData(SectorVar, ThisRecord + 7, RecordSize);
      if (SectorVar.VarName = VarName) then begin
        if (LastRecord = 0) then begin
          // This sector is root, update it
          NextRecord := SectorVar.NextVar;
          if (NextRecord = 0) then
            NextRecord := -1;
          S := LoadSector(SectorIndex);
          S.Vars := NextRecord;
          SaveSector(S, SectorIndex);
        end
        else begin
          // We need to tag this record as empty
          InUse := 0;
          WriteData(@InUse, ThisRecord + 2, 1);
          // Now link before and after Vars
          NextRecord := SectorVar.NextVar;
          // The following would replace the next 3 lines: WriteRecord(@NextRecord, LastRecord + 57, 4);
          ReadData(SectorVar, LastRecord + 7, RecordSize);
          SectorVar.NextVar := NextRecord;
          WriteRecord(SectorVar, LastRecord, 0, RecordSize);
          Break;
        end;
      end;
      LastRecord := ThisRecord;
      ThisRecord := SectorVar.NextVar;
    end;
  finally
    FreeMem(SectorVar);
  end;
end;

procedure TModDatabase.AddWarpIn(Sect, Origin : Word);
var
  P : Pointer;
  W : PWarpIn;
begin
  W := AllocMem(SizeOf(TWarpIn));
  W^.Origin := Origin;

  // hook the new warp into this sector's warpin list
  P := Pointer(Integer(SectorWarpCache) + (Sect - 1) * SizeOf(Pointer));
  W^.NextWarpIn := PWarpIn(P^);
  Pointer(P^) := W;
end;

function TModDatabase.GetEmptyRecord(Size : Integer) : Integer;
var
  I : Integer;
begin
  // EP - Looks like we need to plug in some data, so look for a record slot of the right size
  Result := DBSize;
  I := 0;

  while (I < Length(EmptyRecordGroups)) do begin
    if (EmptyRecordGroups[I].RecordSize = Size) then begin
      if (Length(EmptyRecordGroups[I].EmptyRecords) > 0) then begin
        Result := EmptyRecordGroups[I].EmptyRecords[Length(EmptyRecordGroups[I].EmptyRecords) - 1]; // Grab the last one in this array
        SetLength(EmptyRecordGroups[I].EmptyRecords, Length(EmptyRecordGroups[I].EmptyRecords) - 1); // Shorten the array by 1
      end;
      Break; // EP - If Result wasn't set just now, use DBSize, set earlier.
    end;
    Inc(I);
  end;
end;

procedure TModDatabase.CacheEmptyRecords;
var
  Pos   : Integer;
  Size  : Word;
  InUse : Byte;
begin
  // go through and find all empty records, storing them.

  Pos := SizeOf(TSector) * (DBHeader.Sectors + 1) + SizeOf(TDataHeader);

  while (Pos < DBSize) do
  begin
    ReadData(@Size, Pos, 2);
    ReadData(@InUse, Pos + 2, 1);

    if (InUse = 0) then
      CacheEmptyRecord(Pos, Size);

    Inc(Pos, Size + 7);
  end;
end;

procedure TModDatabase.CacheEmptyRecord(Index : Integer; Size : Word);
var
  I     : Integer;
  Found : Boolean;
begin
  // loop through record cache lists, add record to a list matching its size

  Found := FALSE;
  I := 0;

  while (I < Length(EmptyRecordGroups)) do
  begin
    if (EmptyRecordGroups[I].RecordSize = Size) then
    begin
      Found := TRUE;
      Break;
    end;

    Inc(I);
  end;

  if not (Found) then
  begin
    I := Length(EmptyRecordGroups);
    SetLength(EmptyRecordGroups, I + 1);
    EmptyRecordGroups[I].RecordSize := Size;
  end;

  SetLength(EmptyRecordGroups[I].EmptyRecords, Length(EmptyRecordGroups[I].EmptyRecords) + 1);
  EmptyRecordGroups[I].EmptyRecords[Length(EmptyRecordGroups[I].EmptyRecords) - 1] := Index;
end;

procedure TModDatabase.ReadRecordList(List : TList; FirstPos : Integer);
var
  NextRecord : Integer;
  RecordSize : Word;
  Rec        : Pointer;
begin
  NextRecord := FirstPos;

  while (NextRecord <> 0) do
  begin
    ReadData(@RecordSize, NextRecord, 2);
    Rec := AllocMem(RecordSize);
    ReadData(Rec, NextRecord + 7, RecordSize);
    List.Add(Rec);
    ReadData(@NextRecord, NextRecord + 3, 4);
  end;
end;

function TModDatabase.WriteRecordList(List : TList; RecordSize : Word) : Integer;
var
  I,
  Pos,
  LastPos : Integer;
begin
  Result := 0;

  if (List <> nil) then
    if (List.Count > 0) then
    begin
      LastPos := 0;

      for I := List.Count - 1 downto 0 do
      begin
        // Find the nearest zeroed record (or EOF)
        Pos := GetEmptyRecord(RecordSize);

        // Write it in
        WriteRecord(List[I], Pos, LastPos, RecordSize);
        LastPos := Pos;
      end;

      Result := LastPos;
    end;
end;

procedure TModDatabase.PurgeRecordList(FirstPos : Integer);
var
  NextRecord : Integer;
  InUse      : Byte;
  Size       : Word;
begin
  NextRecord := FirstPos;
  InUse := 0;

  while (NextRecord <> 0) do
  begin
    ReadData(@Size, NextRecord, 2);
    CacheEmptyRecord(NextRecord, Size);
    WriteData(@InUse, NextRecord + 2, 1);
    ReadData(@NextRecord, NextRecord + 3, 4);
  end;
end;

procedure TModDatabase.WriteRecord(Rec : Pointer; Pos, Next : Integer; Size : Word);
var
  InUse : Byte;
begin                            // Comments by EP
  WriteData(@Size, Pos, 2);      // The first 2 bytes of a record hold the record size

  InUse := 1;
  WriteData(@InUse, Pos + 2, 1); // The third byte is a boolean for the InUse property
  WriteData(@Next, Pos + 3, 4);  // Bytes 4 through 7 hold an Integer pointing to the next record (for ships, planets, traders, but no longer for Sector Parameters)
  WriteData(Rec, Pos + 7, Size); // Total overhead = 7 bytes, so the data begins at byte 8
end;

procedure TModDatabase.ReadData(Data : Pointer; Index, Size : Integer);
begin
  if (UseCache) then
    // cache enabled - read data directly from data cache
    CopyMemory(Data, Pointer(Integer(DataCache) + Index), Size)
  else
  begin
    // cache disabled - read data from file
    Seek(DataFile, Index);
    BlockRead(DataFile, Data^, Size);
  end;
end;

procedure TModDatabase.WriteData(Data : Pointer; Index, Size : Integer);
var
  DataIndex   : Pointer;
  CurDatabase : string;
begin
  if (UseCache) then
  begin
    if (Index + Size > CacheSize) then
    begin
      // increase cache size
      try
        Inc(CacheSize, 50000);
        ReallocMem(DataCache, CacheSize);
      except
        UseCache := FALSE;
        CurDatabase := FDataFilename;
        TWXServer.ClientMessage('Not enough free memory available for cache extensions - database cache disabled');
        CloseDataBase;
        OpenDatabase(CurDatabase);
        WriteData(Data, Index, Size);
        Exit;
      end;
    end;

    DataIndex := Pointer(Integer(DataCache) + Index);

    // compare memory with cached data
    if not (CompareMem(DataIndex, Data, Size)) then
    begin
      // data is different - update data cache and file
      CopyMemory(DataIndex, Data, Size);
      Seek(DataFile, Index);
      BlockWrite(DataFile, Data^, Size);
      DBSize := FileSize(DataFile);
    end;
  end
  else
  begin
    // write data directly to file
    Seek(DataFile, Index);
    BlockWrite(DataFile, Data^, Size);
    DBSize := FileSize(DataFile);
  end;
end;

procedure TModDatabase.OpenCache;
begin
  // load the database into cache

  if (CacheAllocated) then
    CloseCache;

  try
    CacheSize := FileSize(DataFile) + 50000;
    DataCache := AllocMem(CacheSize);
    CacheAllocated := TRUE;
    Seek(DataFile, 0);
    BlockRead(DataFile, DataCache^, FileSize(DataFile));
  except
    TWXServer.Broadcast(endl + ANSI_12 + 'Error while caching database, database cache has been disabled' + ANSI_7 + endl);
    UseCache := False;
  end;
end;

procedure TModDatabase.CloseCache;
begin
  // release data cache

  if not (CacheAllocated) then
    Exit;

  FreeMem(DataCache, CacheSize);
  CacheSize := 0;
  CacheAllocated := FALSE;
end;

function TModDatabase.GetDatabaseName: string;
begin
  Result := FDataFilename; 
end;

procedure TModDatabase.SetDatabaseName(const Value: string);
begin
  if (Value <> FDataFilename) then
  begin
    CloseDatabase;
    OpenDatabase(Value);
  end;
end;

function TModDatabase.GetUseCache: Boolean;
begin
  Result := FUseCache;
end;

procedure TModDatabase.SetUseCache(Value: Boolean);
begin
  if (FUseCache <> Value) then
  begin
    FUseCache := Value;

    if (FUseCache) then
      OpenCache
    else
      CloseCache;
  end;
end;

function TModDatabase.GetRecording: Boolean;
begin
  Result := FRecording; 
end;

procedure TModDatabase.SetRecording(Value: Boolean);
begin
  FRecording := Value;
  TWXGUI.Recording := Value;
end;

function TModDatabase.GetServerPort: Word;
begin
  Result := FListenPort;
end;

procedure TModDatabase.SetServerPort(Value: Word);
begin
  FListenPort := Value;
  FDBHeader.ServerPort := Value;
end;

function TModDatabase.GetLastPortCIM: TDateTime;
begin
  Result := DBHeader.LastPortCIM;
end;

procedure TModDatabase.SetLastPortCIM(const Value: TDateTime);
begin
  FDBHeader.LastPortCIM := Value;
end;

end.
