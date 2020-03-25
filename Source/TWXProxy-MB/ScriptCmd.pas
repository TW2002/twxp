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
// This unit contains the implementation for all script commands

{
EP's To Do:
Make boolean tests on the same line occur from left to right, and exit at the first fail
Add Array Insert / Delete or Remove... maybe Copy, Null

Elapsed <var> <TDateTime> <TDateTime>
Absolute <inputVar> <outputVar>
}

unit
  ScriptCmd;

interface

uses
  ScriptRef;

procedure BuildSysConstList(ScriptRef : TScriptRef);
procedure BuildCommandList(ScriptRef : TScriptRef);

implementation

uses
  Global,
  Core,
  Classes,
  SysUtils,
  Menu,
  DataBase,
  Utility,
  MMSystem,
  Script,
  Ansi,
  TCP,
  INIFiles,
  ScriptCmp,
  FormScript,
  Windows,
  Math;

const
  SCSectorParameterError = 'Sector parameter name cannot be longer than 10 characters';
  SCSectorParameterValueError = 'Sector parameter value cannot be longer than 40 characters';

//var - Changed to Const in the TruncFloat and UpdateParam procedures
  // EP - These vars are used to speed up TextToFloat & FloatToText conversions
  //LastPrecision : Extended = 0;
  //LastMultiplier : Extended = 1;
  //CharBuffer : array[0..64] of Char;
  //PCharBuffer : PChar = @CharBuffer;
var
  // EP - These are for improving the speed of repetitive Read commands
  LastReadFilename : String;
  //LastReadModTime : Integer;
  LastReadModTime : Int64;
  LastReadStrings : TStringList;

  // EP - To speed up Float -> String and String -> Float conversions - Set with cmdSetPrecision
  SetPrecision : Integer = 0;
  LastPrecision : Integer = 0;
  LastMultiplier : Extended = 1;
  MaxFloatVariance : Extended = 0; // EP: Effectively half of the next decimal beyond Precision, aka Epsilon



function RaiseToPower(const Value : Extended; const Power : Integer) : Extended;
var
  I : Integer;
begin
  if Power = 0 then
    Result := 1
  else
  begin
    Result := Value; // Power = 1
    for I := 2 to Power do
      Result := Result * Value;

  end;
end;

procedure UpdatePrecision(const Precision : Integer);
begin
  if Precision <> LastPrecision then
  begin
    LastPrecision := Precision;
    LastMultiplier := RaiseToPower(10, Precision);
    MaxFloatVariance := 0.5 / LastMultiplier;
  end;
end;
(*
function RoundFloat(const F : Extended; Precision : Integer = 0) : Extended; // Using a default parameter
begin
  if Precision = 0 then
    Result := Trunc(F) // Want to replace with a dedicated Trunc() function
  else
  begin
    UpdatePrecision(Precision);
    Result := Round(F * LastMultiplier) / LastMultiplier;
  end;
end;
*)
function NearEqual(const F1, F2 : Extended; Precision : Integer) : Boolean; // Using a default parameter
begin
  // This is to compare floating point numbers for equality
  // An absolute difference of <= (0.5 / 10^Precision) will be considered equal
  UpdatePrecision(Precision);
  Result := Abs(F1 - F2) <= MaxFloatVariance;
end;

procedure UpdateParam(Param : TCmdParam; const Value : Extended; const Precision : Integer);
begin
  if Precision = 0 then
    Param.DecValue := Int(Value)
  else
    Param.DecValue := Value;

  Param.SigDigits := Precision; // EP - This will be needed for the FloatToText conversion
end;

procedure ConvertToNumber(const S : string; var N : Integer);
begin
  try
    N := Round(StrToFloat(S));
  except
    raise EScriptError.Create('''' + S + ''' is not a number');
  end;
end;

procedure ConvertToBoolean(const Param : TCmdParam; var B : Boolean);
begin
  if (Param.IsNumeric) then
  begin
    if (Param.DecValue = 0) then
      B := FALSE
    else if (Param.DecValue = 1) then
      B := TRUE
    else
      raise EScriptError.Create('Value must be either 0 or 1 (cannot be "' + Param.Value + '")');
  end
  else
  begin
    if (Param.Value = '0') then
      B := FALSE
    else if (Param.Value = '1') then
      B := TRUE
    else
      raise EScriptError.Create('Value must be either 0 or 1 (cannot be "' + Param.Value + '")');
  end;
end;

function ConvertBoolToString(const B : Boolean) : string;
begin
  if (B) then
    Result := '1'
  else
    Result := '0';
end;

procedure CheckSector(Index : Integer);
begin
  if (Index <= 0) or (Index > TWXDatabase.DBHeader.Sectors) then
    raise EScriptError.Create('Sector index out of bounds');
end;

{ procedure Split(const Line : string; var Strings : TStringList; const Delimiters : string = ''); // default string parameter should be blank
var
  Separators,
  WhiteSpace : set of Char; // set of Char
  I : Integer;
begin
  if (Delimiters <> '') then // Delimiters were specified
  begin
    Separators := [];
    for I := 1 to Length(Delimiters) do
      Separators := Separators + [Delimiters[I]];
  end
  else
    Separators := [#9, #32]; // Tab and Space, if omitted

  WhiteSpace := [];
  ExtractStrings(Separators, WhiteSpace, @Line[1], TStrings(Strings));
end; }

// *****************************************************************************
//                         SCRIPT COMMAND IMPLEMENTATION
// *****************************************************************************

function CmdAdd(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F1,
  F2 : Extended;
begin
  // CMD: add var <value>
  // add a value to a variable

  F1 := Params[0].DecValue;
  F2 := Params[1].DecValue;
  UpdateParam(Params[0], F1 + F2, TScript(Script).DecimalPrecision);

  Result := caNone;
end;

function CmdAddMenu(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  LabelName : string;
begin
  // CMD: addMenu <parent> <name> <description> <hotkey> <reference> <prompt> <closeMenu>

  if (Length(Params[3].Value) <> 1) then
    raise EScriptError.Create('Bad menu hotkey');

  LabelName := Params[4].Value;

  if (LabelName <> '') then
    TScript(Script).Cmp.ExtendLabelName(LabelName, TScript(Script).ExecScript);

  TScript(Script).AddMenu(TWXMenu.AddCustomMenu(UpperCase(Params[0].Value),
    UpperCase(Params[1].Value), Params[2].Value, LabelName, Params[5].Value,
    UpCase(Params[3].Value[1]), (Params[6].Value = '1'), TScript(Script)));

  Result := caNone;
end;

function CmdAnd(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  B1,
  B2 : Boolean;
begin
  // CMD: and var <value>

  ConvertToBoolean(Params[0], B1);
  ConvertToBoolean(Params[1], B2);

  Params[0].Value := ConvertBoolTostring(B1 and B2);
  Result := caNone;
end;

function CmdBranch(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: branch <value> <label>
  // goto <label> if <value> <> 1

  //if (Params[0].Value <> '1') then
  //  TScript(Script).GotoLabel(Params[1].Value);
  //if NearEqual(Params[0].DecValue, 1, 1) then // Calling NearEqual calls UpdatePrecision and breaks things
  if (Params[0].DecValue = 1) or (Round(Params[0].DecValue) = 1) then // Should short-circuit

  else
    TScript(Script).GotoLabel(Params[1].Value);

  Result := caNone;
end;

function CmdClearAllAvoids(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: clearAllAvoids
  TWXDatabase.UnsetAllVoids;
  Result := caNone;
end;

function CmdClearAvoid(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: clearAvoid <Sector>
  try
    TWXDatabase.UnsetVoid(StrToInt(Params[0].Value));
  except
    raise EScriptError.Create('''' + Params[0].Value + ''' is not a Sector number');
  end;
  Result := caNone;
end;

function CmdClientMessage(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: ClientMessage <value>

  TWXServer.ClientMessage(Params[0].Value);
  Result := caNone;
end;

function CmdCloseMenu(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: closeMenu

  TWXMenu.CloseMenu(FALSE);

  Result := caNone;
end;

function CmdConnect(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: connect

  if not (TWXClient.Connected) then
    TWXClient.Connect;

  Result := caNone;
end;

function CmdCutLengths(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Lengths,
  Strings : TStringList;
  I,
  IntLength,
  Position : Integer;
  S : string;
begin
  // CMD: cutLengths <value> array <lengths1,length2,...>

  Lengths := TStringList.Create;
  Strings := TStringList.Create;
  try
    Split(Params[2].Value, Lengths, ',');
    Position := 1;
    I := 0;
    while (I < Lengths.Count) and (Position < Length(Params[0].Value)) do
    begin
      IntLength := StrToInt(Lengths[I]);
      S := Copy(Params[0].Value, Position, IntLength);
      Strings.Add(S);
      Inc(Position, IntLength);
      Inc(I);
    end;
    Params[1].Value := IntToStr(Strings.Count);
    TVarParam(Params[1]).SetArrayFromStrings(Strings);
  finally
    Lengths.Free;
    Strings.Free;
  end;

  Result := caNone;
end;

function CmdCutText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  V1,
  V2 : Integer;
begin
  // CMD: cutText <value> var <start> <length>

  ConvertToNumber(Params[2].Value, V1);
  ConvertToNumber(Params[3].Value, V2);

  if (V1 > Length(Params[0].Value)) then
    raise EScriptError.Create('CutText: Start position beyond End Of Line');

  Params[1].Value := Copy(Params[0].Value, V1, V2);
  Result := caNone;
end;

function CmdDelete(Script : TObject; Params : array of TCmdParam) : TCmdAction;
{$HINTS OFF} // display 'Value assigned to 'I' never used'
var
  F : File;
begin
  // CMD: delete <filename>

  // EP - Safety: Make sure the target is not in a parent directory
  if (Copy(Params[0].Value, 0, 3) <> '..\') then
  begin
    AssignFile(F, Params[0].Value);

    {$I-}
    Erase(F);
    {$I+}

  end;

  Result := caNone;
{$HINTS ON}
end;

function CmdDisconnect(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: disconnect {disable}
  // {disable} - Will disable reconnects if true
  if (TWXClient.Connected) then
  begin

    // mb - Hard disconnect if param[1] = True - other wise
    // soft disconnect with reconnect allowed.
    if (Length(Params) > 0) then
      TWXClient.Disconnect
    else
      TWXClient.CloseClient;
  end;
  Result := caNone;
end;

function CmdDivide(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F1,
  F2 : Extended;
begin
  // CMD: divide var <value>
  // divide variable by a value

  F2 := Params[1].DecValue;
  if (F2 = 0) then
    raise EScriptError.Create('Division by zero');
  F1 := Params[0].DecValue;
  UpdateParam(Params[0], F1 / F2, TScript(Script).DecimalPrecision);

  Result := caNone;
end;

function CmdEcho(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  EchoText : string;
  I        : Integer;
begin
  // CMD: echo <values...>

  // string together the parameters and echo to all terms
  for I := 0 to Length(Params) - 1 do
    EchoText := EchoText + Params[I].Value;

  // #13 on its own will warp the terminal display - add a linefeed with it
  TWXServer.Broadcast(StringReplace(EchoText, #13, #13 + #10, [rfReplaceAll]),TRUE,TRUE);

  Result := caNone;
end;

function CmdFileExists(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: fileExists var <filename>

  if (FileExists(Params[1].Value)) then
    Params[0].Value := '1'
  else
    Params[0].Value := '0';

  Result := caNone;
end;

function CmdFormat(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  OutVar : TDateTime;
  //Float1 : Extended;
begin
  // CMD: format InputVar OutputVar CONSTANT
  
  if (Params[2].Value = 'CURRENCY') then // ($4,567.22)
  begin
    try
      Params[1].Value := FloatToStrF(Params[0].DecValue, ffCurrency, TScript(Script).DecimalPrecision, 2);
    except on E: Exception do
      // Broadcast the exception
      raise EScriptError.Create('Invalid Currency value');
    end;
  end;
  if (Params[2].Value = 'NUMBER') then // (4,567.(PRECISION))
  begin
    try
      Params[1].Value := FloatToStrF(Params[0].DecValue, ffNumber, 19, TScript(Script).DecimalPrecision); // Unsure if the 19 sig digits is ideal
      { Alternately
      Float1 := Params[0].DecValue;
      Params[1].Value := Format('%n', [Float1]); // This command needs Precision decimals
      }
    except on E: Exception do
      raise EScriptError.Create('Invalid Number value');
    end;
  end;
  if (Params[2].Value = 'DATETIMETOSTR') then
  begin
    try
      Params[1].Value := DateTimeToStr(Params[0].DecValue);
    except on E: Exception do
      // Broadcast the exception
      raise EScriptError.Create('Invalid DateTime value');
    end;
  end;
  if (Params[2].Value = 'STRTODATETIME') then
  begin
    try
      OutVar := StrToDateTime(Params[0].Value);
      UpdateParam(Params[1], OutVar, 15);
    except on E: Exception do
      raise EScriptError.Create('Invalid String value for DateTime conversion');
    end;
  end;

  Result := caNone;
end;

function CmdGetAllCourses(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I,
  StartSect : Integer;
  Course : TList;
  CourseArrays : array of TList;
begin
  // CMD: getAllCourses <2-DimensionArrayName> <StartingSector>
  ConvertToNumber(Params[1].Value, StartSect);
  CheckSector(StartSect);
  SetLength(CourseArrays, TWXDatabase.DBHeader.Sectors);
  // This line is necessary to populate the Database's ReverseArray
  Course := TWXDatabase.PlotWarpCourse(StartSect, 0);
  try
    TWXDatabase.CoursesToTLists(CourseArrays);
    for I := 0 to TWXDatabase.DBHeader.Sectors - 1 do
      ReverseTList(CourseArrays[I]);
    // end
    TVarParam(Params[0]).SetMultiArraysFromLists(CourseArrays);
  finally
    Course.Free;
    for I := 0 to Length(CourseArrays) - 1 do
      CourseArrays[I].Free;
    // end
  end;
  Result := caNone;
end;

function CmdGetCharCode(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getCharCode <char> resultVar

  if (Length(Params[0].Value) <> 1) then
    raise EScriptError.Create('Bad character');

  Params[1].Value := IntToStr(Byte(Char(Params[0].Value[1])));

  Result := caNone;
end;

function CmdGetConsoleInput(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getConsoleInput var [singleKey?]

  TScript(Script).Locked := TRUE;
  TWXMenu.BeginScriptInput(TScript(Script), TVarParam(Params[0]), (Length(Params) = 2));
  Result := caPause;
end;

function CmdGetCourse(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Course   : TList;
  FromSect,
  ToSect   : Integer;
begin
  // CMD: getCourse varspec <fromSector> <toSector>

  ConvertToNumber(Params[1].Value, FromSect);
  ConvertToNumber(Params[2].Value, ToSect);

  CheckSector(FromSect);
  CheckSector(ToSect);

  Course := TWXDatabase.PlotWarpCourse(FromSect, ToSect);


  try
    Params[0].Value := IntToStr(Course.Count - 1);

    if (Course.Count > 0) then begin
      // Need to reverse the lists order
      ReverseTList(Course);
      TVarParam(Params[0]).SetArrayFromList(Course);
    end;

  finally
    Course.Free
  end;

  Result := caNone;
end;

function CmdGetDate(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getDate var

  if (Length(Params) = 2) then
    Params[0].Value := FormatDateTime(Params[1].Value, Now)
  else
    Params[0].Value := DateToStr(Now);

  Result := caNone;
end;

function CmdGetDirList(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  SearchRec : TSearchRec;
  Mask : String;
  List : TStringList;
begin
  // CMD: getDirList varArray <FileMask>

  if (Length(Params) = 1) then
    Mask := '*'
  else begin
    // EP - Need to make sure Mask doesn't contain "..", so only subdirs can be enumerated
    Mask := Params[1].Value;
  end;
  List := TStringList.Create;
  try
    if SysUtils.FindFirst(Mask, faDirectory, SearchRec) = 0 then begin // and not faDirectory
      repeat
        if (SearchRec.Attr and faDirectory) = faDirectory then
          if (SearchRec.Name <> '.') and (SearchRec.Name <> '..') then
            List.Add(SearchRec.Name);
      until SysUtils.FindNext(SearchRec) <> 0;
      SysUtils.FindClose(SearchRec);
    end;
    TVarParam(Params[0]).SetArrayFromStrings(List);
    Params[0].Value := IntToStr(List.Count);
  finally
    List.Free;
  end;
  Result := caNone;
end;

function CmdGetDistance(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Course   : TList;
  FromSect,
  ToSect   : Integer;
begin
  // CMD: getDistance var <fromSector> <toSector>

  ConvertToNumber(Params[1].Value, FromSect);
  ConvertToNumber(Params[2].Value, ToSect);

  CheckSector(FromSect);
  CheckSector(ToSect);

  Course := TWXDatabase.PlotWarpCourse(FromSect, ToSect);

  try
    Params[0].Value := IntToStr(Course.Count - 1);
  finally
    Course.Free;
  end;

  Result := caNone;
end;

function CmdGetFileList(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  SearchRec : TSearchRec;
  Mask : String;
  List : TStringList;
begin
  // CMD: getFileList varArray <FileMask>

  if (Length(Params) = 1) then
    Mask := '*'
  else begin
    Mask := Params[1].Value;
    Replace(Mask, #13, #42);
  end;
  List := TStringList.Create;
  try
    if SysUtils.FindFirst(Mask, faAnyFile and not faDirectory, SearchRec) = 0 then begin // and not faDirectory
      repeat
        List.Add(SearchRec.Name);
      until SysUtils.FindNext(SearchRec) <> 0;
      SysUtils.FindClose(SearchRec);
    end;
    TVarParam(Params[0]).SetArrayFromStrings(List);
    Params[0].Value := IntToStr(List.Count);
  finally
    List.Free;
  end;
  Result := caNone;
end;

function CmdGetInput(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getInput var <prompt>

  TWXServer.Broadcast(endl + ANSI_15 + Params[1].Value + endl);
  TScript(Script).Locked := TRUE;
  TWXMenu.BeginScriptInput(TScript(Script), TVarParam(Params[0]), FALSE);
  Result := caPause;
end;

function CmdGetLength(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getLength <text> var

  Params[1].Value := IntToStr(Length(Params[0].Value));
  Result := caNone;
end;

function CmdGetMenuValue(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getMenuValue <menuName> var

  try
    Params[1].Value := TWXMenu.GetMenuByName(UpperCase(Params[0].Value)).Value;
  except
    on E : Exception do
      raise EScriptError.Create(E.Message);
  end;

  Result := caNone;
end;

function CmdGetNearestWarps(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  StartSect : Integer;
  StrList : TStringList;
  CourseList : TList;
begin
  // CMD: getNearestWarps <ArrayName> <StartingSector>
  ConvertToNumber(Params[1].Value, StartSect);
  CheckSector(StartSect);
  CourseList := TWXDatabase.PlotWarpCourse(StartSect, 0);
  try
    StrList := TWXDatabase.QueArrayToStringList;
    try
      Params[0].Value := IntToStr(StrList.Count);
      if (StrList.Count > 0) then begin
        TVarParam(Params[0]).SetArrayFromStrings(StrList);
      end;
    finally
      StrList.Free;
    end;
  finally
    CourseList.Free;
  end;
  Result := caNone;
end;

function CmdGetOutText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getOutText var

  Params[0].Value := TScript(Script).OutText;
  Result := caNone;
end;

function CmdGetRnd(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  RndMin,
  RndMax : Integer;
begin
  // CMD: getRnd var <lowestValue> <highestValue>

  ConvertToNumber(Params[1].Value, RndMin);
  ConvertToNumber(Params[2].Value, RndMax);
  Params[0].Value := IntToStr(Trunc(Random(RndMax + 1 - RndMin) + RndMin));
  Result := caNone;
end;

function CmdGetScriptVersion(Script : TObject; Params : array of TCmdParam) : TCmdAction;
type
  ShortHdr = record
    ProgramName : string[10];
    Version     : Word;
  end;
var
  F : File;
  Hdr : ShortHdr;
begin
  // CMD: getScriptVersion <fileName> var
  if not (FileExists(Params[0].Value)) then
  begin
    raise EScriptError.Create('File ''' + Params[0].Value + ''' not found');
    Exit;
  end
  else
  begin
    AssignFile(F, Params[0].Value);
    Reset(F, 1);

    BlockRead(F, Hdr, SizeOf(Hdr));
    if (Hdr.ProgramName <> 'TWX SCRIPT') then begin
      CloseFile(F);
      raise EScriptError.Create('File is not a compiled TWX script');
      Exit;
    end;

    Params[1].Value := IntToStr(Hdr.Version);
    CloseFile(F);
  end;

  Result := caNone;
end;

function CmdGetSector(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I,
  Index   : Integer;
  S       : TSector;
  Items   : TList;
  VarName : string;
begin
  // CMD: getSector <index> var

  ConvertToNumber(Params[0].Value, Index);

  // MB - Ignore invalid call with index of zero
  if (index = 0) then begin
    Result := caNone;
    exit
  end;

  CheckSector(Index);

  S := TWXDatabase.LoadSector(Index);
  VarName := TVarParam(Params[1]).Name;
  Result := caNone;

  with (Script as TScript) do
  begin
    if (S.Explored = etNo) then
      SetVariable(VarName + '.EXPLORED', 'NO', '')
    else if (S.Explored = etCalc) then
      SetVariable(VarName + '.EXPLORED', 'CALC', '')
    else if (S.Explored = etDensity) then
      SetVariable(VarName + '.EXPLORED', 'DENSITY', '')
    else if (S.Explored = etHolo) then
      SetVariable(VarName + '.EXPLORED', 'YES', '');

    SetVariable(VarName + '.INDEX', IntToStr(Index), '');
    SetVariable(VarName + '.BEACON', S.Beacon, '');
    SetVariable(VarName + '.CONSTELLATION', S.Constellation, '');
    SetVariable(VarName + '.ARMIDMINES.QUANTITY', IntToStr(S.Mines_Armid.Quantity), '');
    SetVariable(VarName + '.LIMPETMINES.QUANTITY', IntToStr(S.Mines_Limpet.Quantity), '');
    SetVariable(VarName + '.ARMIDMINES.OWNER', S.Mines_Armid.Owner, '');
    SetVariable(VarName + '.LIMPETMINES.OWNER', S.Mines_Limpet.Owner, '');
    SetVariable(VarName + '.FIGS.QUANTITY', IntToStr(S.Figs.Quantity), '');
    SetVariable(VarName + '.FIGS.OWNER', S.Figs.Owner, '');
    SetVariable(VarName + '.WARPS', IntToStr(S.Warps), '');
    SetVariable(VarName + '.DENSITY', IntToStr(S.Density), '');
    SetVariable(VarName + '.NAVHAZ', IntToStr(S.NavHaz), '');

    for I := 1 to 6 do
      SetVariable(VarName + '.WARP', IntToStr(S.Warp[I]), IntToStr(I));

    SetVariable(VarName + '.UPDATED', DateToStr(S.Update) + ' ' + TimeToStr(S.Update), '');
    SetVariable(VarName + '.PORT.NAME', S.SPort.Name, '');

    if (S.Figs.FigType = ftToll) then
      SetVariable(VarName + '.FIGS.TYPE', 'TOLL', '')
    else if (S.Figs.FigType = ftDefensive) then
      SetVariable(VarName + '.FIGS.TYPE', 'DEFENSIVE', '')
    else
      SetVariable(VarName + '.FIGS.TYPE', 'OFFENSIVE', '');

    // MB - Added mispelled paramter for backwards compatability
    if (S.Anomaly) then begin
      SetVariable(VarName + '.ANOMALY', 'YES', '');
      SetVariable(VarName + '.ANOMOLY', 'YES', '')
    end
    else begin
      SetVariable(VarName + '.ANOMALY', 'NO', '');
      SetVariable(VarName + '.ANOMOLY', 'NO', '');
    end;

    if (S.SPort.Name = '') then
    begin
      SetVariable(VarName + '.PORT.CLASS', '0', '');
      SetVariable(VarName + '.PORT.EXISTS', '0', '');
    end
    else
    begin
      SetVariable(VarName + '.PORT.CLASS', IntToStr(S.SPort.ClassIndex), '');
      SetVariable(VarName + '.PORT.EXISTS', '1', '');
      SetVariable(VarName + '.PORT.BUILDTIME', IntToStr(S.SPort.BuildTime), '');
      SetVariable(VarName + '.PORT.PERC_ORE', IntToStr(S.SPort.ProductPercent[ptFuelOre]), '');
      SetVariable(VarName + '.PORT.PERC_ORG', IntToStr(S.SPort.ProductPercent[ptOrganics]), '');
      SetVariable(VarName + '.PORT.PERC_EQUIP', IntToStr(S.SPort.ProductPercent[ptEquipment]), '');
      SetVariable(VarName + '.PORT.ORE', IntToStr(S.SPort.ProductAmount[ptFuelOre]), '');
      SetVariable(VarName + '.PORT.ORG', IntToStr(S.SPort.ProductAmount[ptOrganics]), '');
      SetVariable(VarName + '.PORT.EQUIP', IntToStr(S.SPort.ProductAmount[ptEquipment]), '');
      SetVariable(VarName + '.PORT.UPDATED', DateToStr(S.SPort.Update) + ' ' + TimeToStr(S.SPort.Update), '');

      if (S.SPort.BuyProduct[ptFuelOre]) then
        SetVariable(VarName + '.PORT.BUY_ORE', 'YES', '')
      else
        SetVariable(VarName + '.PORT.BUY_ORE', 'NO', '');

      if (S.SPort.BuyProduct[ptOrganics]) then
        SetVariable(VarName + '.PORT.BUY_ORG', 'YES', '')
      else
        SetVariable(VarName + '.PORT.BUY_ORG', 'NO', '');

      if (S.SPort.BuyProduct[ptEquipment]) then
        SetVariable(VarName + '.PORT.BUY_EQUIP', 'YES', '')
      else
        SetVariable(VarName + '.PORT.BUY_EQUIP', 'NO', '');
    end;

    // set planet variables
    Items := TWXDatabase.GetSectorItems(itPlanet, S);
    SetVariable(VarName + '.PLANETS', IntToStr(Items.Count), '');
    I := 0;

    while (Items.Count > 0) do
    begin
      Inc(I);
      SetVariable(VarName + '.PLANET', TPlanet(Items[0]^).Name, IntToStr(I));
      FreeMem(Items[0]);
      Items.Delete(0);
    end;

    Items.Free;

    // set trader variables
    Items := TWXDatabase.GetSectorItems(itTrader, S);
    SetVariable(VarName + '.TRADERS', IntToStr(Items.Count), '');
    I := 0;

    while (Items.Count > 0) do
    begin
      Inc(I);
      SetVariable(VarName + '.TRADER.NAME', TTrader(Items[0]^).Name, IntToStr(I));
      SetVariable(VarName + '.TRADER.SHIP', TTrader(Items[0]^).ShipType, IntToStr(I));
      SetVariable(VarName + '.TRADER.SHIPNAME', TTrader(Items[0]^).ShipName, IntToStr(I));
      SetVariable(VarName + '.TRADER.FIGS', IntToStr(TTrader(Items[0]^).Figs), IntToStr(I));
      FreeMem(Items.Items[0]);
      Items.Delete(0);
    end;

    Items.Free;

    // set ship variables
    Items := TWXDatabase.GetSectorItems(itShip, S);
    SetVariable(VarName + '.SHIPS', IntToStr(Items.Count), '');
    I := 0;

    while (Items.Count > 0) do
    begin
      Inc(I);
      SetVariable(VarName + '.SHIP.NAME', TShip(Items[0]^).Name, IntToStr(I));
      SetVariable(VarName + '.SHIP.SHIP', TShip(Items[0]^).ShipType, IntToStr(I));
      SetVariable(VarName + '.SHIP.OWNER', TShip(Items[0]^).Owner, IntToStr(I));
      SetVariable(VarName + '.SHIP.FIGS', IntToStr(TTrader(Items[0]^).Figs), IntToStr(I));
      FreeMem(Items.Items[0]);
      Items.Delete(0);
    end;

    Items.Free;

    // set backdoors
    if (S.Explored <> etNo) then
    begin
      Items := TWXDatabase.GetBackDoors(S, Index);
      I := 0;

      while (Items.Count > 0) do
      begin
        Inc(I);
        SetVariable(VarName + '.BACKDOOR', IntToStr(Word(Items[0]^)), IntToStr(I));
        FreeMem(Items[0]);
        Items.Delete(0);
      end;

      Items.Free;
    end;
  end;
end;

function CmdGetSectorParameter(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Index: Integer;
begin
  // CMD: getSectorParameter <sectorIndex> <parameterName> var

  ConvertToNumber(Params[0].Value, Index);

  // MB - Ignore invalid call with index of zero
  if (index = 0) then begin
    Result := caNone;
    exit
  end;

  CheckSector(Index);

  if (Length(Params[1].Value) > 10) then
  begin
     TWXServer.Broadcast('SCSectorParameterError:' + IntToStr(Length(Params[1].Value)) + ':' + Params[1].Value);
     raise EScriptError.Create(SCSectorParameterError);
  end;

  try
    Params[2].Value := TWXDatabase.GetSectorVar(Index, Params[1].Value);
  except
    if ((index = 2) and (Params[1].Value = 'FIG_COUNT')) then begin
      Result := caNone;
      exit
    end
    else begin
      TWXServer.Broadcast('SCSectorParameterDatabaseError:' + Params[1].Value + ':' + Params[2].Value);
      raise EScriptError.Create(SCSectorParameterError);
    end;
  end;

  if (Length(Params[2].Value) > 40) then
  begin
    TWXServer.Broadcast('SCSectorParameterValueError:' + IntToStr(Length(Params[2].Value)) + ':' + Params[2].Value);
    raise EScriptError.Create(SCSectorParameterValueError);
  end;

  Result := caNone;
end;

function CmdGetText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  S,
  Line,
  StartStr,
  EndStr   : string;
  StartPos,
  EndPos   : Integer;
begin
  // CMD: getText <line> var <startValue> <endValue>

  Line := Params[0].Value;
  StartStr := Params[2].Value;
  EndStr := Params[3].Value;

  if (StartStr = '') then
    StartPos := 1
  else
    StartPos := Pos(StartStr, Line);

  if (StartPos = 0) then
  begin
    Params[1].Value := '';
    Result := caNone;
    Exit;
  end;

  Inc(StartPos, Length(StartStr));
  Line := Copy(Line, StartPos, Length(Line) - StartPos + 1);

  if (EndStr = '') then
    EndPos := Length(Line) + 1
  else
    EndPos := Pos(EndStr, Line);

  if (EndPos > 0) then
  begin
    S := Copy(Line, 1, EndPos - 1);
    Params[1].Value := S;
  end
  else
    Params[1].Value := '';

  Result := caNone;
end;

function CmdGetTime(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getTime var [<format>]

  if (Length(Params) = 2) then
    Params[0].Value := FormatDateTime(Params[1].Value, Now)
  else
    Params[0].Value := TimeToStr(Now);

  Result := caNone;
end;

function CmdGetTimer(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  Params[0].Value := IntToStr(Utility.rdtsc);
  {
  Params[0].Value := IntToStr(Utility.rdtsc);
  Params[0].IsNumeric := FALSE; // EP - I could've done a float->str conversion, but we'll wait till we use it
  }
  Result := caNone;
end;

function CmdGetWord(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I : Integer;
begin
  // CMD: getWord <line> var <index> <default>

  ConvertToNumber(Params[2].Value, I);
  Params[1].Value := GetParameter(Params[0].Value, I);

  if (Params[1].Value = '') then
  begin
    if (Length(Params) > 3) then
      Params[1].Value := Params[3].Value
    else
      Params[1].Value := '0';
  end;

  Result := caNone;
end;

function CmdGetWordCount(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I, WordCount : Integer;
  Line : String;
  Last : Char;
begin
  // CMD: getWordCount <text> storageVar
  // EP: Ideally add CmdTextToArray command to speed up line parsing.

  WordCount := 0;
  Last := ' ';

  Line := Params[0].Value;
  for I := 1 to length(Line) do
  begin
    if (Line[I] <> ' ') and (Line[I] <> #9) then // If it isn't white space
      if (Last = ' ') or (Last = #9) then        // but previously was
        Inc(WordCount);                          // then it's a new word

    Last := Line[I];
  end;
  Params[1].Value := IntToStr(WordCount);

  Result := caNone;
end;

function CmdGetWordPos(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: getWordPos <text> storageVar <subString>

  Params[1].Value := IntToStr(Pos(Params[2].Value, Params[0].Value));
  Result := caNone;
end;

function CmdGosub(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: gosub <label>

  TScript(Script).Gosub(Params[0].Value);
  Result := caNone;
end;

function CmdGoto(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: goto <label>

  TScript(Script).GotoLabel(Params[0].Value);
  Result := caNone;
end;

function CmdHalt(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: halt

  Result := caStop;
end;

function CmdIsEqual(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Bool: Boolean;
begin
  // CMD: isEqual var <value1> <value2>
  // var = 1 if <value1> = <value2> else var = 0

  // MB - Only do a numeric comparision if both arguments are numeric
  if (Params[1].IsNumeric and Params[2].IsNumeric) then
  begin
    try
      // The difference must be within MaxFloatVariance to be considered equal
      Bool := Abs(Params[1].DecValue - Params[2].DecValue) <= MaxFloatVariance;
      Params[0].SetBool(Bool);
    except on E: EScriptError do
      // Float comparison failed,
      Params[0].SetBool(False);
    end;
  end
  else
    Params[0].SetBool(AnsiSameStr(Params[1].Value, Params[2].Value));


  Result := caNone;
end;

function CmdIsGreater(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Bool : Boolean;
begin
  // CMD: isGreater var <value1> <value2>
  // var = 1 if <value1> > <value2> else var = 0

  Bool := ((Params[1].DecValue - MaxFloatVariance) > Params[2].DecValue);
  Params[0].SetBool(Bool);

  Result := caNone;
end;

function CmdIsGreaterEqual(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Bool : Boolean;
begin
  // CMD: isGreaterEqual var <value1> <value2>
  // var = 1 if <value1> >= <value2> else var = 0

  Bool := ((Params[1].DecValue - MaxFloatVariance) >= Params[2].DecValue)
    or (Abs(Params[1].DecValue - Params[2].DecValue) <= MaxFloatVariance);
  Params[0].SetBool(Bool);

  Result := caNone;
end;

function CmdIsLesser(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Bool : Boolean;
begin
  // CMD: isLesser var <value1> <value2>
  // var = 1 if <value1> < <value2> else var = 0

  Bool := ((Params[1].DecValue + MaxFloatVariance) < Params[2].DecValue);
  Params[0].SetBool(Bool);

  Result := caNone;
end;

function CmdIsLesserEqual(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Bool : Boolean;
begin
  // CMD: isLesserEqual var <value1> <value2>
  // var = 1 if <value1> <= <value2> else var = 0

  // .01 <= .0099, and MaxVariance = .005 (Precision = 2), these should evaluate equal
  //Bool := (Params[1].DecValue - Params[2].DecValue) <= MaxFloatVariance;
  Bool := ((Params[1].DecValue + MaxFloatVariance) <= Params[2].DecValue)
    or (Abs(Params[1].DecValue - Params[2].DecValue) <= MaxFloatVariance);
  Params[0].SetBool(Bool);

  Result := caNone;
end;

function CmdIsNotEqual(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Bool : Boolean;
begin
  // CMD: isNotEqual var <value1> <value2>
  // var = 1 if <value1> <> <value2> else var = 0

  try
    Bool := Abs(Params[1].DecValue - Params[2].DecValue) > MaxFloatVariance;
    Params[0].SetBool(Bool);
  except on E: EScriptError do
    // Float comparison failed, try string comparison
    Params[0].SetBool(AnsiSameStr(Params[1].Value, Params[2].Value) = false);
  end;

  Result := caNone;
end;

function CmdIsNumber(Script : TObject; Params : array of TCmdParam) : TCmdAction;
{$HINTS OFF} // Disable 'Value assigned to F is never used'
var
  F : Extended;
begin
  try
    F := Params[1].DecValue;
    Params[0].DecValue := 1;
  except on E: Exception do
    Params[0].DecValue := 0;
  end;

  Result := caNone;
end;
{$HINTS ON}

function CmdKillAllTriggers(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: killAllTriggers

  TScript(Script).KillAllTriggers;
  Result := caNone;
end;

function CmdKillTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: killTrigger <name>

  TScript(Script).KillTrigger(Params[0].Value);
  Result := caNone;
end;

function CmdKillWindow(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Window : TScriptWindow;
begin
  // CMD: killWindow <windowName>

  Window := TScript(Script).FindWindow(Params[0].Value);
  TScript(Script).RemoveWindow(Window);
  Window.Free;

  Result := caNone;
end;

function CmdListActiveScripts(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I : Integer;
  Scripts : TStringList;
begin
  // CMD: listActiveScripts <ArrayName>
  Scripts := TStringList.Create;
  try
    for I := 0 to TWXInterpreter.Count - 1 do begin
      Scripts.Add(TWXInterpreter.Scripts[I].ScriptName);
      TVarParam(Params[0]).SetArrayFromStrings(Scripts);
      Params[0].Value := IntToStr(Scripts.Count);
    end;
  finally
    Scripts.Free;
  end;
  Result := caNone;
end;

function CmdListAvoids(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Avoids : TList;
begin
  // CMD: listAvoids <ArrayName>
  Avoids := TWXDatabase.VoidList;
  try
    TVarParam(Params[0]).SetArrayFromList(Avoids);
    Params[0].Value := IntToStr(Avoids.Count);
  finally
    Avoids.Free;
  end;
  Result := caNone;
end;

function CmdListSectorParameters(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I : Integer;
  ParamList : TStringList;
begin
  // CMD: listSectorParameters <SectorIndex> <ArrayName>
  ConvertToNumber(Params[0].Value, I);
  ParamList := TWXDatabase.ListSectorVars(I);
  try
    TVarParam(Params[1]).SetArrayFromStrings(ParamList);
    Params[1].Value := IntToStr(ParamList.Count);
  finally
    ParamList.Free;
  end;
  Result := caNone;
end;

function CmdLoad(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: load <scriptName>

  TWXInterpreter.Load(FetchScript(Params[0].Value, FALSE), TRUE);

  // MB - if the script ending is switchbot, then kill parent.
  if Pos('switchbot', LowerCase(Params[0].Value)) > 0 then
    Result := caStop
  else
    Result := caNone;
end;

function CmdLoadVar(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  INI : TINIFile;
begin
  // CMD: loadVar var

  INI := TINIFile.Create(TScript(Script).ProgramDir + '\' + StripFileExtension(TWXDatabase.DatabaseName) + '.cfg');

  try
    Params[0].Value := INI.ReadString('Variables', TVarParam(Params[0]).Name, '0');
  finally
    INI.Free;
  end;

  Result := caNone;
end;

function CmdLogging(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: logging <value>

  TWXLog.LogData := (UpperCase(Params[0].Value) = 'ON') or (Params[0].Value = '1');

  Result := caNone;
end;

function CmdLowerCase(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: lowerCase var

  Params[0].Value := LowerCase(Params[0].Value);
  Result := caNone;
end;

function CmdMakeDir(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: MakeDir <directory name>

  if (Copy(Params[0].Value, 0, 3) <> '..\') then
  begin
    CreateDir(Params[0].Value);
  end;

  Result := caNone;
end;

function CmdMergeText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: mergeText <value1> <value2> var
  // Concatenate two values and store the result

  Params[2].Value := Params[0].Value + Params[1].Value;

  Result := caNone;
end;

function CmdMultiply(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F1,
  F2 : Extended;
begin
  // CMD: multiply var <value>
  // multiply a variable by a value

  F1 := Params[0].DecValue;
  F2 := Params[1].DecValue;
  UpdateParam(Params[0], F1 * F2, TScript(Script).DecimalPrecision);
  {
  F1 := ConvertToFloat(Params[0]);
  F2 := ConvertToFloat(Params[1]);
  UpdateParam(Params[0], F1 * F2, TScript(Script).DecimalPrecision);
  }
  Result := caNone;
end;

function CmdOpenMenu(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: openMenu <name> [<pause>]
  // Eg: openMenu TWX_SHOWSPECIALPORT FALSE
  try
    TWXMenu.OpenMenu(UpperCase(Params[0].Value), 0);
  except
    on E : Exception do
      raise EScriptError.Create(E.Message);
  end;

  if (Length(Params) > 1) and (Params[1].Value = '0') then
    Result := caNone
  else
    Result := caPause;
end;

function CmdOr(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  B1,
  B2 : Boolean;
begin
  // CMD: or var <value>

  ConvertToBoolean(Params[0], B1);
  ConvertToBoolean(Params[1], B2);

  Params[0].Value := ConvertBoolToString(B1 or B2);
  Result := caNone;
end;

function CmdPadLeft(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I   : Integer;
  Pad : string;
begin
  // CMD: padLeft var <value>
  // add spaces to the left of a variable

  Pad := '';
  for I := Length(Params[0].Value) to Trunc(Params[1].DecValue - 1) do
  begin
    Pad := ' ' + Pad;
  end;

  Params[0].Value := Pad + Params[0].Value;

  Result := caNone;
end;

function CmdPadRight(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I   : Integer;
  Pad : string;
begin
  // CMD: padRight var <value>
  // add spaces to the right of a variable

  Pad := '';
  for I := Length(Params[0].Value) to Trunc(Params[1].DecValue - 1) do
  begin
    Pad := ' ' + Pad;
  end;

  Params[0].Value := Params[0].Value + Pad;

  Result := caNone;
end;

function CmdPause(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: pause

  Result := caPause;
end;

function CmdProcessIn(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: processIn processType <text>

  if (Params[0].Value = '1') then
  begin
    // process globally for all scripts
    TScript(Script).Controller.TextEvent(Params[1].Value, TRUE);
    TScript(Script).Controller.TextLineEvent(Params[1].Value, TRUE);
  end
  else
  begin
    // process locally only
    TScript(Script).TextEvent(Params[1].Value, TRUE);
    TScript(Script).TextLineEvent(Params[1].Value, TRUE);
  end;

  Result := caNone;
end;

function CmdProcessOut(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: processOut <text>

  if not (TWXInterpreter.TextOutEvent(Params[0].Value, TScript(Script))) then
    TWXClient.Send(Params[0].Value);

  Result := caNone;
end;
{$HINTS OFF}
function CmdRead(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
{ Declared in Unit Var list:
  LastFileRead : String;
  LastFileModified : TFileTime;
  LastFileStrings : TStringArray;
}
  Line,
  FileDate  : Integer;
  LastReadFileData : WIN32_FILE_ATTRIBUTE_DATA;
begin
  // CMD: read <file> storageVar <line>
  if (GetFileAttributesEx(PChar(Params[0].Value), GetFileExInfoStandard, @LastReadFileData)) then
  begin
    // If the file name or timestamp has changed, update the constants
    if (Params[0].Value <> LastReadFilename) or (Int64(LastReadFileData.ftLastWriteTime) <> LastReadModTime) then
    begin
      LastReadFilename := Params[0].Value;
      LastReadModTime := Int64(LastReadFileData.ftLastWriteTime);
      if not Assigned(LastReadStrings) then
        LastReadStrings := TStringList.Create;  // Destroyed in the Unit's Finalize section
      LastReadStrings.LoadFromFile(Params[0].Value);
    end;

    ConvertToNumber(Params[2].Value, Line);
    if (Line > LastReadStrings.Count) then
      Params[1].Value := 'EOF'
    else
      Params[1].Value := LastReadStrings[Line - 1];

  end
  else
    raise EScriptError.Create('File ''' + Params[0].Value + ''' not found');

  Result := caNone;
end;
{$HINTS ON}

function CmdReadToArray(Script : TObject; Params : array of TCmdParam) : TCmdAction;
// CMD: readToArray <file> <storageArray>
var
  fileData: TStringList;
begin
  if not (FileExists(Params[0].Value)) then
  begin
    raise EScriptError.Create('File ''' + Params[0].Value + ''' not found');
    Exit;
  end;
  fileData := TStringList.Create;
  try
    fileData.LoadFromFile(Params[0].Value);
    TVarParam(Params[1]).SetArrayFromStrings(fileData);
    Params[1].Value := IntToStr(fileData.Count);
  finally
    fileData.Free;
  end;
  Result := caNone;
end;

function CmdRemoveDir(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: RemoveDir <directory name>

  // EP - Safety: Make sure the target is not in a parent directory
  if (Copy(Params[0].Value, 0, 3) <> '..\') then
  begin
    RemoveDir(Params[0].Value);
  end;

  Result := caNone;
end;

function CmdRename(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: rename <oldfile> <newfile>

  if not (RenameFile(Params[0].Value, Params[1].Value)) then
    EScriptError.Create('Cannot rename file ''' + Params[0].Value + '''');

  Result := caNone;
end;

function CmdReplaceText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: replaceText var <oldText> <newText>

  Params[0].Value := StringReplace(Params[0].Value, Params[1].Value, Params[2].Value, [rfReplaceAll]);

  Result := caNone;
end;

function CmdReqRecording(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: reqRecording

  if (TWXDatabase.Recording) then
    Result := caNone
  else
  begin
    TWXServer.ClientMessage('This script requires recording to be enabled');
    Result := caStop;
  end;
end;

function CmdReturn(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: return

  TScript(Script).Return;
  Result := caNone;
end;

function CmdRound(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F,
  Fraction,
  Point5,
  Factor : Extended;
  Precision : Integer;
  //CW : Word;
begin
  // CMD: round var <precision>

  //CW := Default8087CW;
  Set8087CW(Default8087CW);

  if (Length(Params) < 2) then begin
    Precision := 0;
    Factor := 1;
  end
  else begin
    Precision := Trunc(Params[1].DecValue);
    Factor := RaiseToPower(10, Precision);
  end;

  F := Params[0].DecValue * Factor;
  //F := Round(F) / Factor;
  Fraction := Frac(F);
  Point5 := 0.5 - 1E-17; // add a little fuzz factor
  // 1E-19
  if (Fraction >= Point5) then
    F := (Int(F) + 1) / Factor
  else
    F := Int(F) / Factor;

  UpdateParam(Params[0], F, Precision);

  Result := caNone;
end;

function CmdSaveVar(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  INI : TINIFile;
begin
  // CMD: saveVar var

  // MB - This is a patch for a Mombot 3.1044 / 3.1045 incorrectly storing
  //      $MULTIPLE_PHOTONS as a string instead of bool.
  if (TVarParam(Params[0]).Name = '$MULTIPLE_PHOTONS') then
    if (Params[0].Value = 'True') then
      Params[0].Value := '1'
    else
      Params[0].Value := '0';

  INI := TINIFile.Create(TScript(Script).ProgramDir + '\' + StripFileExtension(TWXDatabase.DatabaseName) + '.cfg');

  try
    INI.WriteString('Variables', TVarParam(Params[0]).Name, Params[0].Value);
  finally
    INI.Free;
  end;

  Result := caNone;
end;

function CmdSend(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  SendText : string;
  I        : Integer;
begin
  // CMD: send <values...>

  // string together the parameters and echo to all terms
  for I := 0 to Length(Params) - 1 do
    SendText := SendText + Params[I].Value;

  TWXClient.Send(SendText);
  Result := caNone;
end;

function CmdSetArray(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I,
  ValInt     : Integer;
  Dimensions : array of Integer;
begin
  // CMD: setArray var <dimensions...>

  SetLength(Dimensions, Length(Params) - 1);

  for I := 1 to Length(Params) - 1 do
  begin
    ConvertToNumber(Params[I].Value, ValInt);
    Dimensions[I - 1] := ValInt;
  end;

  TVarParam(Params[0]).SetArray(Dimensions);
  Result := caNone;
end;

function CmdSetAvoid(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: setAvoid <Sector>
  try
    TWXDatabase.SetVoid(StrToInt(Params[0].Value));
  except
    raise EScriptError.Create('''' + Params[0].Value + ''' is not a Sector number');
  end;
  Result := caNone;
end;

function CmdSetDelayTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Value : Integer;
begin
  // CMD: setDelayTrigger <name> <label> <tics>

  ConvertToNumber(Params[2].Value, Value);
  TScript(Script).SetDelayTrigger(Params[0].Value, Params[1].Value, Value);
  Result := caNone;
end;

function CmdSetEventTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Param : string;
begin
  // CMD: setEventTrigger <name> <label> <event> [<parameter>]

  if (Length(Params) < 4) then
    Param := ''
  else
    Param := Params[3].Value;

  TScript(Script).SetEventTrigger(Params[0].Value, Params[1].Value, Params[2].Value, Param);
  Result := caNone;
end;

function CmdSetMenuHelp(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: setMenuHelp <menuName> <helpText>

  try
    TWXMenu.GetMenuByName(UpperCase(Params[0].Value)).Help := StringReplace(Params[1].Value, #13, endl, [rfReplaceAll]);
  except
    on E : Exception do
      raise EScriptError.Create(E.Message);
  end;

  Result := caNone;
end;

function CmdSetMenuKey(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  S : string;
begin
  // CMD: setMenuKey <value>

  S := Params[0].Value;
  TWXExtractor.MenuKey := S[1];
  TWXMenu.GetMenuByName('TWX_MENUKEY').Value := TWXExtractor.MenuKey;

  Result := caNone;
end;

function CmdSetMenuValue(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: setMenuValue <menuName> <value>

  try
    TWXMenu.GetMenuByName(UpperCase(Params[0].Value)).Value := Params[1].Value;
  except
    on E : Exception do
      raise EScriptError.Create(E.Message);
  end;

  Result := caNone;
end;

function CmdSetMenuOptions(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  MenuItem : TTWXMenuItem;
begin
  // CMD: setMenuOptions <menuName> <Q> <?> <+>

  try
    MenuItem := TWXMenu.GetMenuByName(UpperCase(Params[0].Value));
  except
    on E : Exception do
      raise EScriptError.Create(E.Message);
  end;

  MenuItem.SetOptions((Params[1].Value = '1'), (Params[2].Value = '1'), (Params[3].Value = '1'));

  Result := caNone;
end;

function CmdSetPrecision(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  V1 : Integer;
begin
  // CMD: setPrecision <value>

  ConvertToNumber(Params[0].Value, V1);
  TScript(Script).DecimalPrecision := V1;
  // EP
  LastPrecision := SetPrecision;
  SetPrecision := V1;
  LastMultiplier := IntPower(10, SetPrecision);
  if SetPrecision = 0 then
    MaxFloatVariance := 0
  else
    MaxFloatVariance := 0.5/LastMultiplier; // EP: Effectively half of the next decimal beyond Precision

  Result := caNone;
end;

function CmdSetProgVar(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: setProgVar <varName> <value>

  Result := caNone;
end;

function CmdSetSectorParameter(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Index: Integer;
begin
  // CMD: setSectorParameter <sectorIndex> <parameterName> <value>

  ConvertToNumber(Params[0].Value, Index);
  CheckSector(Index);

  if (Length(Params[1].Value) > 10) then
    raise EScriptError.Create(SCSectorParameterError);

  if (Length(Params[2].Value) > 40) then
    raise EScriptError.Create(SCSectorParameterValueError);

  TWXDatabase.SetSectorVar(Index, Params[1].Value, Params[2].Value);
  Result := caNone;
end;

function CmdSetTextLineTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Value : string;
begin
  // CMD: setTextLineTrigger <name> <label> [<value>]

  if (Length(Params) < 3) then
    Value := ''
  else
    Value := Params[2].Value;

  TScript(Script).SetTextLineTrigger(Params[0].Value, Params[1].Value, Value);
  Result := caNone;
end;

function CmdSetTextOutTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Value : string;
begin
  // CMD: setTextOutTrigger <name> <label> [<value>]

  if (Length(Params) < 3) then
    Value := ''
  else
    Value := Params[2].Value;

  TScript(Script).SetTextOutTrigger(Params[0].Value, Params[1].Value, Value);
  Result := caNone;
end;

function CmdSetTextTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Value : string;
begin
  // CMD: setTextTrigger <name> <label> [<value>]

  if (Length(Params) < 3) then
    Value := ''
  else
    Value := Params[2].Value;

  TScript(Script).SetTextTrigger(Params[0].Value, Params[1].Value, Value);
  Result := caNone;
end;

{$HINTS OFF}
function CmdSetVar(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F : Extended;
begin
  // CMD: setVar var <value>

  if Params[1].IsNumeric = TRUE then
    //Params[0].DecValue := Params[1].DecValue
    //UpdateParam(Params[0], Params[1].DecValue, TScript(Script).DecimalPrecision) // this way Precision is captured
    UpdateParam(Params[0], Params[1].DecValue, Params[1].SigDigits)
  else
    Params[0].Value := Params[1].Value;
  
  Result := caNone;
end;
{$HINTS ON}

function CmdSetWindowContents(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: setWindowContents <windowName> <value>

  TScriptWindow(TScript(Script).FindWindow(Params[0].Value)).TextContent := Params[1].Value;

  Result := caNone;
end;

function CmdSound(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: sound <filename>

  PlaySound(PChar(Params[0].Value), 0, SND_NODEFAULT);
  Result := caNone;
end;

function CmdSplitText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Delims : string;
  Strings : TStringList;
begin
  // CMD: splitText <text> varArray {delims}
  if (Length(Params) > 2) then // Delimiters were specified
    Delims := Params[2].Value
  else
    Delims := ''; // blank delims defaults to Space and Tab

  Strings := TStringList.Create;
  try
    Split(Params[0].Value, Strings, Delims);
    Params[1].Value := IntToStr(Strings.Count);
    TVarParam(Params[1]).SetArrayFromStrings(Strings);
  finally
    Strings.Free;
  end;

  Result := caNone;
end;

function CmdStop(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I    : Integer;
  Name : string;
begin
  // CMD: stop <scriptName>
  Name := UpperCase(ShortFilename(StripFileExtension(Params[0].Value)));
  Result := caNone;

  for I := 0 to TWXInterpreter.Count - 1 do
    if (UpperCase(ShortFilename(StripFileExtension(TWXInterpreter.Scripts[I].Cmp.ScriptFile))) = Name) then
    begin
      if (TWXInterpreter.Scripts[I] = Script) then
        Result := caStop
      else
        TWXInterpreter.Stop(I);

      Break;
    end;
end;

function CmdStripText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I       : Integer;
  RemText,
  Value   : string;
begin
  // CMD: stripText var <value>

  Value := Params[0].Value;
  RemText := Params[1].Value;

  I := 1;
  while (I <= Length(Value)) do
  begin
    if (Copy(Value, I, Length(RemText)) = RemText) then
    begin
      Delete(Value, I, Length(RemText));
      I := 0;
    end;

    Inc(I);
  end;

  Params[0].Value := Value;
  Result := caNone;
end;

function CmdSubtract(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F1,
  F2 : Extended;
begin
  // CMD: subtract var <value>
  // subtract a value from a variable

  F1 := Params[0].DecValue;
  F2 := Params[1].DecValue;
  UpdateParam(Params[0], F1 - F2, TScript(Script).DecimalPrecision);

  Result := caNone;
end;

function CmdSys_Check(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  X : array of TCmdParam;
begin
  // CMD: sys_check

  SetLength(X, 0); // to correct strange compiler problem!?

  Result := caNone;
end;

function CmdSys_Fail(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: sys_fail

  TWXServer.ClientMessage('Unable to access subroutine - ' + ANSI_12 + 'Authentication failure.');

  Result := caStop;
end;

function CmdSys_NoAuth(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: sys_noAuth
   Result := caNone;
end;

function CmdSys_Kill(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: sys_kill

  Halt; // will throw exceptions on exit - gives the user an impression of a serious bug out

  Result := caStop;
end;

function CmdSys_Nop(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: sys_nop

  Result := caNone;
end;

function CmdSys_ShowMsg(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: sys_showMsg

  Result := caNone;
end;

function CmdSystemScript(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: systemScript

  TScript(Script).System := TRUE;

  Result := caNone;
end;

function CmdTrim(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD trim var

  Params[0].Value := Trim(Params[0].Value);

  Result := caNone;
end;

function CmdTruncate(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: truncate var

  UpdateParam(Params[0], Params[0].DecValue, 0);

  Result := caNone;
end;

function CmdUpperCase(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: upperCase var

  Params[0].Value := UpperCase(Params[0].Value);

  Result := caNone;
end;

function CmdWaitFor(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: waitFor <value>

  TScript(Script).WaitText := Params[0].Value;
  TScript(Script).WaitForActive := TRUE;

  Result := caPause;
end;

function CmdWindow(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Window : TScriptWindow;
  SizeX,
  SizeY  : Integer;
begin
  // CMD: window <windowName> <sizeX> <sizeY> <title> [<ontop>]

  ConvertToNumber(Params[1].Value, SizeX);
  ConvertToNumber(Params[2].Value, SizeY);

  Window := TScriptWindow.Create(
    Params[0].Value,
    Params[3].Value,
    SizeX,
    SizeY,
    (Length(Params) = 5)
    );

  TScript(Script).AddWindow(Window);
  Window.Show;

  Result := caNone;
end;

function CmdWrite(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F : TextFile;
begin
  // CMD: write <file> <value>

  SetCurrentDir(TScript(Script).ProgramDir);
  AssignFile(F, Params[0].Value);

{$I-}
  Append(F);

  if (IOResult <> 0) then
    ReWrite(F);

  if (IOResult <> 0) then
    raise EScriptError.Create('Unable to write to file ''' + Params[0].Value + '''');
{$I+}

  WriteLn(F, Params[1].Value);
  CloseFile(F);

  Result := caNone;
end;

function CmdXor(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  B1,
  B2 : Boolean;
begin
  // CMD: xor var <value>

  ConvertToBoolean(Params[0], B1);
  ConvertToBoolean(Params[1], B2);

  Params[0].Value := ConvertBoolTostring(B1 xor B2);
  Result := caNone;
end;

// *****************************************************************************
//                      COMMANDS ADDED FOR 2.06
// *****************************************************************************

function CmdGetDeafClients(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I          : integer;
begin
  Params[0].DecValue := 0;

  for I := 0 to TWXServer.ClientCount - 1 do
  begin
    if TWXServer.ClientTypes[I] = ctDeaf then
       Params[0].DecValue := 1
  end;

  Result := caNone;
end;


function CmdSetDeafClients(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I : Integer;
begin
  if (Length(Params) > 0) and (Params[0].Value = '0') then
  begin
    if (TWXServer.ClientCount > 0) then
    begin
      for I := 0 to TWXServer.ClientCount - 1 do
      begin
        if TWXServer.ClientTypes[I] = ctDeaf then
          TWXServer.ClientTypes[I] := ctStandard
      end
    end
  end
  else
  begin
    if (TWXServer.ClientCount > 0) then
    begin
      for I := 0 to TWXServer.ClientCount - 1 do
      begin
        if TWXServer.ClientTypes[I] = ctStandard then
          TWXServer.ClientTypes[I] := ctDeaf
      end
    end;
  end;

  Result := caNone;
end;

function CmdSaveGlobal(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Found : Boolean;
  I     : Integer;
  Data  : TStringList;
  Param   : TVarParam;
  Indexes : TStringArray;
begin
  Found := False;

  if TVarParam(Params[0]).ArraySize > 0 then
  begin
    Data :=  TStringList.Create;

    for I := 1 to TVarParam(Params[0]).ArraySize do
    begin
      SetLength(Indexes, 1);
      Indexes[0] := IntToStr(I);

      Data.Add(TVarParam(Params[0]).GetIndexVar(Indexes).Value)
    end;
  end;

  // Search for an existing item and update if found
  for I := 0 to TWXGlobalVars.Count - 1 do
  begin
    if TGlobalVarItem(TWXGlobalVars[I]).Name = TVarParam(Params[0]).Name then
    begin
      if TVarParam(Params[0]).ArraySize > 0 then
      begin
        TGlobalVarItem(TWXGlobalVars[I]).Value := '';
        TGlobalVarItem(TWXGlobalVars[I]).Data := Data;
      end
      else
        TGlobalVarItem(TWXGlobalVars[I]).Value := Params[0].Value;
      Found := True;
    end;
  end;

  // Create a new item if no items were found
  if not Found then
    if TVarParam(Params[0]).ArraySize > 0 then
      TWXGlobalVars.Add(TGlobalVarItem.Create(TVarParam(Params[0]).Name, Data))
    else
      TWXGlobalVars.Add(TGlobalVarItem.Create(TVarParam(Params[0]).Name, Params[0].Value));

  Result := caNone;
end;

function CmdLoadGlobal(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  I : Integer;
begin
  // Search for an existing item and return value
  for I := 0 to TWXGlobalVars.Count - 1 do
  begin
    if TGlobalVarItem(TWXGlobalVars[I]).Name = TVarParam(Params[0]).Name then
    begin
      if TGlobalVarItem(TWXGlobalVars[I]).ArrayCount > 0 then
        TVarParam(Params[0]).SetArrayFromStrings(TGlobalVarItem(TWXGlobalVars[I]).Data)
      else
        Params[0].Value := TGlobalVarItem(TWXGlobalVars[I]).Value;
    end;
  end;

  Result := caNone;
end;

function CmdClearGlobal(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin

  TWXGlobalVars.Clear;

  Result := caNone;
end;

function CmdSwitchBot(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
   IniFile     : TIniFile;
   BotScript,
   NextBot,
   Section     : String;
   BotList,
   ScriptList,
   SectionList : TStringList;
   I : Integer;
begin
  IniFile := TIniFile.Create(TWXGUI.ProgramDir + '\twxp.cfg');
  NextBot := '';

  if (Length(Params) = 1) and (Params[0].Value <> '') and (Params[0].Value <> '0') then
  begin
  try
    SectionList := TStringList.Create;
    ScriptList := TStringList.Create;
   try
      IniFile.ReadSections(SectionList);
      for Section in SectionList do
      begin
        if (Pos('bot:', LowerCase(Section)) = 1) and
           (Pos(LowerCase(Params[0].Value), LowerCase(Section)) > 0)then
        begin
          BotScript  := IniFile.ReadString(Section, 'Script', '');

          ExtractStrings([','], [], PChar(BotScript), ScriptList);
          if FileExists (TWXGUI.ProgramDir + '\scripts\' + ScriptList[0]) then
            NextBot := BotScript;
        end;
      end;
    finally
      SectionList.Free;
      ScriptList.Free;
    end;
  finally
    IniFile.Free;
  end;
  end
  else
  begin
  try
    SectionList := TStringList.Create;
    ScriptList := TStringList.Create;
    BotList := TStringList.Create;
    try
      IniFile.ReadSections(SectionList);
      for Section in SectionList do
      begin
        if (Pos('bot:', LowerCase(Section)) = 1) then
        begin
          BotScript  := IniFile.ReadString(Section, 'Script', '');

          ExtractStrings([','], [], PChar(BotScript), ScriptList);
          if FileExists (TWXGUI.ProgramDir + '\scripts\' + ScriptList[0]) then
          begin
            BotList.add(BotScript);
          end;
        end;
      end;

      for I := 0 to BotList.Count - 1 do
      begin
        if Pos(LowerCase(BotList[I]), LowerCase(TWXInterpreter.ActiveBotScript)) > 0 then
        begin
          if I < BotList.Count -1 then
            NextBot := BotList[I + 1]
          else
            NextBot := BotList[0];
        end;
      end;
    finally
      SectionList.Free;
      ScriptList.Free;
      BotList.Free;
    end;
  finally
    IniFile.Free;
  end;

  end;

  // Load the selected bot
  if (NextBot <> '') then
    TWXInterpreter.SwitchBot(NextBot, FALSE);

  Result := caNone;
end;

function CmdStripANSI(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  S: String;
begin
  // CMD: CmdStripANSI textVar ansiVar
  // removes ANSI from a variable.
  S := Params[1].Value;
  TWXExtractor.StripANSI(S);

  Params[0].Value := S;

  Result := caNone;
end;

function CmdSetAutoTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Value : Integer;
begin
  // CMD: setTextLineTrigger <name> <label> [<value>]

  // mb - set default lifecycle to 1 if not present
  if (Length(Params) < 4) then
    Value := 1
  else
    Value := Floor(Params[3].DecValue);

  TScript(Script).SetAutoTrigger(Params[0].Value, Params[1].Value, Params[2].Value, Value);
  Result := caNone;
end;

function CmdSetAutoLineTrigger(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  Value : Integer;
begin
  // CMD: setTextLineTrigger <name> <label> [<value>]

  // mb - set default lifecycle to 1 if not present
  //if (Length(Params) < 4) then
  //  Value := 1
  //else
  //  Value := Floor(Params[3].DecValue);

  //TScript(Script).SetAutoTrigger(Params[0].Value, Params[1].Value, Params[2].Value, Value);
  Result := caNone;
end;

function CmdReqVersion(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  CurrentVer,
  RequiredVer : Integer;
begin
  CurrentVer := StrToIntDef(StringReplace(ProgramVersion, '.', '', [rfReplaceAll]),0);
  RequiredVer := StrToIntDef(StringReplace(Params[0].Value, '.', '', [rfReplaceAll]),0);

  if CurrentVer >= RequiredVer then
    Result := caNone
  else
  begin
    TWXServer.ClientMessage('This script requires TWX Proxy version ' + Params[0].Value + ' or later to run.');
    Result := caStop;
  end;
end;

function CmdSortArray(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin

  Result := caNone;
end;

function CmdModulas(Script : TObject; Params : array of TCmdParam) : TCmdAction;
var
  F1,
  F2 : integer;
begin
  // CMD: moduals var <value>
  // Get the remainder from variable divided by a value

  F2 := floor(Params[1].DecValue);
  if (F2 = 0) then
    raise EScriptError.Create('Division by zero');
  F1 := floor(Params[0].DecValue);
  UpdateParam(Params[0], F1 mod F2, TScript(Script).DecimalPrecision);

  Result := caNone;
end;



function CmdAddQuickText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  // CMD: CmdAddQuickText {search} {replace}
  // Sets user defined QuickTexts for use with echo, and getText.
  // {search} - Text to search for.
  // {replace} - Text to replace found text.

  TWXServer.AddQuickText(Params[0].Value, Params[1].Value);

  Result := caNone;
end;

function CmdClearQuickText(Script : TObject; Params : array of TCmdParam) : TCmdAction;
begin
  if Length(Params) > 0 then
    TWXServer.ClearQuickText(Params[0].Value)
  else
    TWXServer.ClearQuickText();

  Result := caNone;
end;




// *****************************************************************************
//                      SCRIPT SYSTEM CONST IMPLEMENTATION
// *****************************************************************************

function SCAlphaCentauri(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXDatabase.DBHeader.AlphaCentauri);
end;

function SCAnsi_0(Indexes : TStringArray) : string;
begin
  Result := ANSI_0;
end;

function SCAnsi_1(Indexes : TStringArray) : string;
begin
  Result := ANSI_1;
end;

function SCAnsi_2(Indexes : TStringArray) : string;
begin
  Result := ANSI_2;
end;

function SCAnsi_3(Indexes : TStringArray) : string;
begin
  Result := ANSI_3;
end;

function SCAnsi_4(Indexes : TStringArray) : string;
begin
  Result := ANSI_4;
end;

function SCAnsi_5(Indexes : TStringArray) : string;
begin
  Result := ANSI_5;
end;

function SCAnsi_6(Indexes : TStringArray) : string;
begin
  Result := ANSI_6;
end;

function SCAnsi_7(Indexes : TStringArray) : string;
begin
  Result := ANSI_7;
end;

function SCAnsi_8(Indexes : TStringArray) : string;
begin
  Result := ANSI_8;
end;

function SCAnsi_9(Indexes : TStringArray) : string;
begin
  Result := ANSI_9;
end;

function SCAnsi_10(Indexes : TStringArray) : string;
begin
  Result := ANSI_10;
end;

function SCAnsi_11(Indexes : TStringArray) : string;
begin
  Result := ANSI_11;
end;

function SCAnsi_12(Indexes : TStringArray) : string;
begin
  Result := ANSI_12;
end;

function SCAnsi_13(Indexes : TStringArray) : string;
begin
  Result := ANSI_13;
end;

function SCAnsi_14(Indexes : TStringArray) : string;
begin
  Result := ANSI_14;
end;

function SCAnsi_15(Indexes : TStringArray) : string;
begin
  Result := ANSI_15;
end;

function SCConnected(Indexes : TStringArray) : string;
begin
  if (TWXClient.Connected) then
    Result := '1'
  else
    Result := '0';
end;

function SCCurrentANSILine(Indexes : TStringArray) : string;
begin
  Result := TWXExtractor.CurrentANSILine;
end;

function SCCurrentLine(Indexes : TStringArray) : string;
begin
  Result := TWXExtractor.CurrentLine;
end;

function SCCurrentSector(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentSector);
end;

function SCDate(Indexes : TStringArray) : string;
begin
  Result := DateToStr(Now);
end;

function SCFalse(Indexes : TStringArray) : string;
begin
  Result := '0';
end;

function SCGame(Indexes : TStringArray) : string;
begin
  Result := TWXDatabase.DBHeader.Game;
end;

function SCGameName(Indexes : TStringArray) : string;
begin
  Result := StripFileExtension(ShortFileName(TWXDatabase.DatabaseName));
end;

function SCLicenseName(Indexes : TStringArray) : string;
begin
  Result := 'User'
end;

function SCLoginName(Indexes : TStringArray) : string;
begin
  Result := TWXDatabase.DBHeader.LoginName;
end;

function SCPassword(Indexes : TStringArray) : string;
begin
  Result := TWXDatabase.DBHeader.Password;
end;

function SCPort_Class(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.CLASS[sector]');

  Try
    ConvertToNumber(Indexes[0], SectIndex);
    CheckSector(SectIndex);

    if (TWXDatabase.Sectors[SectIndex].SPort.Name = '') then
      Result := '-1'
    else
        Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ClassIndex);
  Except
      // MB - Ignore this error and report no port found
      Result := '-1';
      EScriptError.Create('Invalid Sector Index (' + Indexes[0] + ')');
  End;

end;

function SCPort_BuildTime(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.BUILDTIME[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.BuildTime);
end;

function SCPort_BuyFuel(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.BUYFUEL[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  if (TWXDatabase.Sectors[SectIndex].SPort.BuyProduct[ptFuelOre]) then
    Result := '1'
  else
    Result := '0';
end;

function SCPort_BuyOrg(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.BUYORG[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  if (TWXDatabase.Sectors[SectIndex].SPort.BuyProduct[ptOrganics]) then
    Result := '1'
  else
    Result := '0';
end;

function SCPort_BuyEquip(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.BUYEQUIP[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  if (TWXDatabase.Sectors[SectIndex].SPort.BuyProduct[ptEquipment]) then
    Result := '1'
  else
    Result := '0';
end;

function SCPort_Equip(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.EQUIPMENT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ProductAmount[ptEquipment]);
end;

function SCPort_Exists(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.EXISTS[sector]');

  Try
    ConvertToNumber(Indexes[0], SectIndex);
    CheckSector(SectIndex);

    if (TWXDatabase.Sectors[SectIndex].SPort.Name = '') then begin
      Result := '0';
    end else begin
      Result := '1';
    end;
  Except
      Result := '0';
      EScriptError.Create('Invalid Sector Index (' + Indexes[0] + ')');
  End;


end;

function SCPort_Fuel(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.FUEL[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ProductAmount[ptFuelOre]);
end;

function SCPort_Name(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.NAME[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := TWXDatabase.Sectors[SectIndex].SPort.Name;
end;

function SCPort_Org(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.ORGANICS[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ProductAmount[ptOrganics]);
end;

function SCPort_PercentFuel(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.PERCENTORE[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ProductPercent[ptFuelOre]);
end;

function SCPort_PercentOrg(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.PERCENTORG[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ProductPercent[ptOrganics]);
end;

function SCPort_PercentEquip(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for PORT.PERCENTEQUIP[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].SPort.ProductPercent[ptEquipment]);
end;

function SCPort_Updated(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.UPDATED[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := DateTimeToStr(TWXDatabase.Sectors[SectIndex].SPort.UpDate);
end;

function SCRawPacket(Indexes : TStringArray) : string;
begin
  Result := TWXExtractor.RawANSILine;
end;

function SCRylos(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXDatabase.DBHeader.Rylos);
end;

function SCSector_Anomaly(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.Anomaly[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(Byte(TWXDatabase.Sectors[SectIndex].Anomaly));
end;

function SCSector_BackdoorCount(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
  WarpsIn   : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.BACKDOORCOUNT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  WarpsIn := TWXDatabase.GetBackdoors(TWXDatabase.LoadSector(SectIndex), SectIndex);
  Result := IntToStr(WarpsIn.Count);

  while (WarpsIn.Count > 0) do
  begin
    FreeMem(WarpsIn[0]);
    WarpsIn.Delete(0);
  end;

  WarpsIn.Free;
end;

function SCSector_Backdoors(Indexes : TStringArray) : string;
var
  SectIndex,
  WarpIndex : Integer;
  WarpsIn   : TList;
begin
  if (Length(Indexes) < 2) then
    raise EScriptError.Create('Invalid parameters for SECTOR.BACKDOORS[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  ConvertToNumber(Indexes[1], WarpIndex);
  CheckSector(SectIndex);

  WarpsIn := TWXDatabase.GetBackdoors(TWXDatabase.LoadSector(SectIndex), SectIndex);

  if (WarpIndex < 1) or (WarpIndex > WarpsIn.Count) then
    Result := '0'
  else
    Result := IntToStr(TWarpIn(WarpsIn[WarpIndex - 1]^).Origin);

  while (WarpsIn.Count > 0) do
  begin
    FreeMem(WarpsIn[0]);
    WarpsIn.Delete(0);
  end;

  WarpsIn.Free;
end;

function SCSector_Beacon(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.BEACON[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := TWXDatabase.Sectors[SectIndex].Beacon;
end;

function SCSector_Constellation(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.CONSTELLATION[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := TWXDatabase.Sectors[SectIndex].Constellation;
end;

function SCSector_Density(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.DENSITY[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].Density);
end;

function SCSector_Explored(Indexes : TStringArray) : string;
var
  Explored  : TSectorExploredType;
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.EXPLORED[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Explored := TWXDatabase.Sectors[SectIndex].Explored;

  case (Explored) of
    etNo      : Result := 'NO';
    etCalc    : Result := 'CALC';
    etDensity : Result := 'DENSITY';
    etHolo    : Result := 'YES';
  end;
end;

function SCSector_Figs_Owner(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.FIGS.OWNER[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := TWXDatabase.Sectors[SectIndex].Figs.Owner;
end;

function SCSector_Figs_Quantity(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.FIGS.QUANTITY[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].Figs.Quantity);
end;

function SCSector_Figs_Type(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.FIGS.TYPE[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  if (TWXDatabase.Sectors[SectIndex].Figs.Quantity > 0) then begin
    if (TWXDatabase.Sectors[SectIndex].Figs.FigType = ftToll) then
      Result := 'Toll'
    else if (TWXDatabase.Sectors[SectIndex].Figs.FigType = ftOffensive) then
      Result := 'Offensive'
    else if (TWXDatabase.Sectors[SectIndex].Figs.FigType = ftDefensive) then
      Result := 'Defensive'
    else
      Result := 'None';
  end;
end;

function SCSector_Limpets_Owner(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.LIMPETS.OWNER[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := TWXDatabase.Sectors[SectIndex].Mines_Limpet.Owner;
end;

function SCSector_Limpets_Quantity(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.LIMPETS.QUANTITY[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].Mines_Limpet.Quantity);
end;

function SCSector_Mines_Owner(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.MINES.OWNER[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := TWXDatabase.Sectors[SectIndex].Mines_Armid.Owner;
end;

function SCSector_Mines_Quantity(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.MINES.QUANTITY[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].Mines_Armid.Quantity);
end;

function SCSector_NavHaz(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.NAVHAZ[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].NavHaz);
end;

function SCSector_PlanetCount(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
  ItemList  : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.PLANETCOUNT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  ItemList := TWXDatabase.GetSectorItems(itPlanet, TWXDatabase.LoadSector(SectIndex));
  Result := IntToStr(ItemList.Count);
  FreeList(ItemList, SizeOf(TPlanet));
end;

function SCSector_Planets(Indexes : TStringArray) : string;
var
  PlanetIndex,
  SectIndex   : Integer;
  ItemList    : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.PLANETS[sector][planetIndex]');

  ConvertToNumber(Indexes[0], SectIndex);
  ConvertToNumber(Indexes[1], PlanetIndex);
  CheckSector(SectIndex);

  ItemList := TWXDatabase.GetSectorItems(itPlanet, TWXDatabase.LoadSector(SectIndex));

  if ((PlanetIndex > ItemList.Count) or (PlanetIndex < 1)) then
    Result := '0'
  else
    Result := TPlanet(ItemList[PlanetIndex - 1]^).Name;

  FreeList(ItemList, SizeOf(TPlanet));
end;

function SCSector_Ships(Indexes : TStringArray) : string;
var
  ShipIndex,
  SectIndex   : Integer;
  ItemList    : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.SHIPS[sector][shipIndex]');

  ConvertToNumber(Indexes[0], SectIndex);
  ConvertToNumber(Indexes[1], ShipIndex);
  CheckSector(SectIndex);

  ItemList := TWXDatabase.GetSectorItems(itShip, TWXDatabase.LoadSector(SectIndex));

  if ((ShipIndex > ItemList.Count) or (ShipIndex < 1)) then
    Result := '0'
  else
    Result := TShip(ItemList[ShipIndex - 1]^).Name;

  FreeList(ItemList, SizeOf(TShip));
end;

function SCSector_ShipCount(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
  ItemList  : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.SHIPCOUNT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  ItemList := TWXDatabase.GetSectorItems(itShip, TWXDatabase.LoadSector(SectIndex));
  Result := IntToStr(ItemList.Count);
  FreeList(ItemList, SizeOf(TShip));
end;

function SCSector_Traders(Indexes : TStringArray) : string;
var
  TraderIndex,
  SectIndex   : Integer;
  ItemList    : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.TRADERS[sector][traderIndex]');

  ConvertToNumber(Indexes[0], SectIndex);
  ConvertToNumber(Indexes[1], TraderIndex);
  CheckSector(SectIndex);

  ItemList := TWXDatabase.GetSectorItems(itTrader, TWXDatabase.LoadSector(SectIndex));

  if ((TraderIndex > ItemList.Count) or (TraderIndex < 1)) then
    Result := '0'
  else
    Result := TTrader(ItemList[TraderIndex - 1]^).Name;

  FreeList(ItemList, SizeOf(TTrader));
end;

function SCSector_TraderCount(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
  ItemList  : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.TRADERCOUNT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  ItemList := TWXDatabase.GetSectorItems(itTrader, TWXDatabase.LoadSector(SectIndex));
  Result := IntToStr(ItemList.Count);
  FreeList(ItemList, SizeOf(TTrader));
end;

function SCSector_Updated(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.UPDATED[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := DateTimeToStr(TWXDatabase.Sectors[SectIndex].Update);
end;

function SCSector_WarpCount(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.WARPCOUNT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  Result := IntToStr(TWXDatabase.Sectors[SectIndex].Warps);
end;

function SCSector_Warps(Indexes : TStringArray) : string;
var
  SectIndex,
  WarpIndex : Integer;
begin
  if (Length(Indexes) < 2) then
    raise EScriptError.Create('Invalid parameters for SECTOR.WARPS[sector][warpIndex]');

  ConvertToNumber(Indexes[0], SectIndex);
  ConvertToNumber(Indexes[1], WarpIndex);
  CheckSector(SectIndex);

  if (WarpIndex < 1) or (WarpIndex > 6) then
    Result := '0'
  else
    Result := IntToStr(TWXDatabase.Sectors[SectIndex].Warp[WarpIndex]);
end;

function SCSector_WarpInCount(Indexes : TStringArray) : string;
var
  SectIndex : Integer;
  WarpsIn   : TList;
begin
  if (Length(Indexes) < 1) then
    raise EScriptError.Create('Invalid parameters for SECTOR.WARPINCOUNT[sector]');

  ConvertToNumber(Indexes[0], SectIndex);
  CheckSector(SectIndex);

  WarpsIn := TWXDatabase.GetWarpsIn(SectIndex);
  Result := IntToStr(WarpsIn.Count);
  WarpsIn.Free;
end;

function SCSector_WarpsIn(Indexes : TStringArray) : string;
var
  SectIndex,
  WarpIndex : Integer;
  WarpsIn   : TList;
begin
  if (Length(Indexes) < 2) then
    raise EScriptError.Create('Invalid parameters for SECTOR.WARPSIN[sector][warpIndex]');

  ConvertToNumber(Indexes[0], SectIndex);
  ConvertToNumber(Indexes[1], WarpIndex);
  CheckSector(SectIndex);

  WarpsIn := TWXDatabase.GetWarpsIn(SectIndex);

  if (WarpIndex < 1) or (WarpIndex > WarpsIn.Count) then
    Result := '0'
  else
    Result := IntToStr(TWarpIn(WarpsIn[WarpIndex - 1]^).Origin);

  WarpsIn.Free;
end;

function SCSectors(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXDatabase.DBHeader.Sectors);
end;

function SCStardock(Indexes : TStringArray) : string;
var
  Sector : integer;
begin
  Sector := StrToInt(TWXDatabase.DBHeader.StarDock);
  if Sector = 65535 then
    Sector = 0;
  Result := Sector;
end;

function SCTime(Indexes : TStringArray) : string;
begin
  Result := TimeToStr(Now);
end;

function SCTrue(Indexes : TStringArray) : string;
begin
  Result := '1';
end;

function SCcurrentTurns(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentTurns);
end;

function SCCurrentCredits(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentCredits)
end;

function SCCurrentFighters(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentFighters)
end;

function SCCurrentShields(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentShields)
end;

function SCCurrentTotalHolds(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentTotalHolds)
end;

function SCCurrentOreHolds(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentOreHolds)
end;

function SCCurrentOrgHolds(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentOrgHolds)
end;

function SCCurrentEquHolds(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentEquHolds)
end;

function SCCurrentColHolds(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentColHolds)
end;

function SCCurrentEmptyHolds(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentTotalHolds -
                     TWXExtractor.CurrentOreHolds -
                     TWXExtractor.CurrentOrgHolds -
                     TWXExtractor.CurrentEquHolds -
                     TWXExtractor.CurrentColHolds)
end;

function SCCurrentPhotons(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentPhotons)
end;

function SCCurrentArmids(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentArmids)
end;

function SCCurrentLimpets(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentLimpets)
end;

function SCCurrentGenTorps(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentGenTorps)
end;

function SCCurrentTwarpType(Indexes : TStringArray) : string;
begin
  if TWXExtractor.CurrentTwarpType = 0 then
    Result := 'No'
else
    Result := IntToStr(TWXExtractor.CurrentTwarpType)
end;

function SCCurrentCloaks(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentCloaks)
end;

function SCCurrentBeacons(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentBeacons)
end;

function SCCurrentAtomics(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentAtomics)
end;

function SCCurrentCorbomite(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentCorbomite)
end;

function SCCurrentEprobes(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentEprobes)
end;

function SCCurrentMineDisr(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentMineDisr)
end;

function SCCurrentPsychicProbe(Indexes : TStringArray) : string;
begin
  if TWXExtractor.CurrentPsychicProbe then
      Result := 'Yes'
  else
      Result := 'No'
end;

function SCCurrentPlanetScanner(Indexes : TStringArray) : string;
begin
  if TWXExtractor.CurrentPlanetScanner then
      Result := 'Yes'
  else
      Result := 'No'
end;

function SCCurrentScanType(Indexes : TStringArray) : string;
begin
  if TWXExtractor.CurrentScanType = 0 then
      Result := 'None'
  else if TWXExtractor.CurrentScanType = 1 then
      Result := 'Dens'
  else if TWXExtractor.CurrentScanType = 2 then
      Result := 'Holo'
end;

function SCCurrentAlignment(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentAlignment)
end;

function SCCurrentExperience(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentExperience)
end;

function SCCurrentCorp(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentCorp)
end;

function SCCurrentShipNumber(Indexes : TStringArray) : string;
begin
  Result := IntToStr(TWXExtractor.CurrentShipNumber)
end;

function SCCurrentShipClass(Indexes : TStringArray) : string;
begin
  Result := TWXExtractor.CurrentShipClass
end;

function SCCurrentQuickStats(Indexes : TStringArray) : string;
begin

 Result := Format(
   'SECT  = %-11s|HLD = %-4s|FIGS = %-6s|ARMID = %-4s|TWARP = %s'+#13+
   'TURNS = %-11s|ORE = %-4s|SHLD = %-6s|LMPIT = %-4s|PLSCN = %s'+#13+
   'CREDS = %-11s|ORG = %-4s|PHOT = %-6s|GTORP = %-4s|LRS   = %s'+#13+
   'ALN   = %-11s|EQU = %-4s|CRBO = %-6s|ATMDT = %-4s|PSPRB = %s'+#13+
   'EXP   = %-11s|COL = %-4s|MDIS = %-6s|BEACN = %-4s|EPRB  = %s'+#13+
   'SHIP  = %-4s '+#13,
  [SCCurrentSector(Indexes),
  SCCurrentTotalHolds(Indexes),
  SCCurrentFighters(Indexes),
  SCCurrentArmids(Indexes),
  SCCurrentTwarpType(Indexes),

  SCCurrentTurns(Indexes),
  SCCurrentOreHolds(Indexes),
  SCCurrentShields(Indexes),
  SCCurrentLimpets(Indexes),
  SCCurrentPlanetScanner(Indexes),

  SCCurrentCredits(Indexes),
  SCCurrentOrgHolds(Indexes),
  SCCurrentPhotons(Indexes),
  SCCurrentGenTorps(Indexes),
  SCCurrentScanType(Indexes),

  SCCurrentAlignment(Indexes),
  SCCurrentEquHolds(Indexes),
  SCCurrentCorbomite(Indexes),
  SCCurrentAtomics(Indexes),
  SCCurrentPsychicProbe(Indexes),

  SCCurrentExperience(Indexes),
  SCCurrentColHolds(Indexes),
  SCCurrentMineDisr(Indexes),
  SCCurrentBeacons(Indexes),
  SCCurrentEprobes(Indexes),

  SCCurrentShipNumber(Indexes)]);
end;

function SCCurrentQS(Indexes : TStringArray) : string;
begin

//TURNS:CRED:FIGS:SHLD:CARBO:PHOT:ALN:EXP:CORP:SHIP:Class:HLDS:ORE:ORG:EQU:COL
Result := Format('%s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s',
 [SCCurrentTurns(Indexes),
  SCCurrentCredits(Indexes),
  SCCurrentFighters(Indexes),
  SCCurrentShields(Indexes),
  SCCurrentCorbomite(Indexes),
  SCCurrentPhotons(Indexes),
  SCCurrentAlignment(Indexes),
  SCCurrentExperience(Indexes),
  SCCurrentCorp(Indexes),
  SCCurrentShipNumber(Indexes),
  SCCurrentShipClass(Indexes),
  SCCurrentTotalHolds(Indexes),
  SCCurrentOreHolds(Indexes),
  SCCurrentOrgHolds(Indexes),
  SCCurrentEquHolds(Indexes),
  SCCurrentColHolds(Indexes)]);
end;

function SCCurrentQSALL(Indexes : TStringArray) : string;
begin
//Armd:Lmpt:GTorp:AtmDt:TWarp:Clks:Beacns:EPrb:MDis:PsPrb:PlScn:LRS
Result := Format('%s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s %s',
 [SCCurrentTurns(Indexes),
  SCCurrentCredits(Indexes),
  SCCurrentFighters(Indexes),
  SCCurrentShields(Indexes),
  SCCurrentCorbomite(Indexes),
  SCCurrentPhotons(Indexes),
  SCCurrentAlignment(Indexes),
  SCCurrentExperience(Indexes),
  SCCurrentCorp(Indexes),
  SCCurrentShipNumber(Indexes),
  SCCurrentShipClass(Indexes),
  SCCurrentTotalHolds(Indexes),
  SCCurrentOreHolds(Indexes),
  SCCurrentOrgHolds(Indexes),
  SCCurrentEquHolds(Indexes),
  SCCurrentColHolds(Indexes),
  SCCurrentArmids(Indexes),
  SCCurrentLimpets(Indexes),
  SCCurrentGenTorps(Indexes),
  SCCurrentAtomics(Indexes),
  SCCurrentTwarpType(Indexes),
  SCCurrentCloaks(Indexes),
  SCCurrentBeacons(Indexes),
  SCCurrentEprobes(Indexes),
  SCCurrentMineDisr(Indexes),
  SCCurrentPsychicProbe(Indexes),
  SCCurrentPlanetScanner(Indexes),
  SCCurrentScanType(Indexes)]);
end;

function SCActiveBot(Indexes : TStringArray) : string;
begin
  Result := TWXInterpreter.ActiveBot;
end;

function SCActiveBotScript(Indexes : TStringArray) : string;
begin
  Result := TWXInterpreter.ActiveBotScript;
end;

function SCTWXVersion(Indexes : TStringArray) : string;
begin
  Result := ProgramVersion + Chr(ReleaseNumber + 96);
end;

function SCTWGSTYPE(Indexes : TStringArray) : string;
begin
  Result := inttostr(TWXExtractor.TWGSType);
end;

function SCTWGSVer(Indexes : TStringArray) : string;
begin
  Result := TWXExtractor.TWGSVer;
end;

function SCTW2002Ver(Indexes : TStringArray) : string;
begin
  Result := TWXExtractor.TW2002Ver;
end;

// *****************************************************************************
//                             LIST BUILDER METHODS
// *****************************************************************************

procedure BuildSysConstList(ScriptRef : TScriptRef);
begin
  with (ScriptRef) do
  begin
    AddSysConstant('ANSI_0', SCAnsi_0);
    AddSysConstant('ANSI_1', SCAnsi_1);
    AddSysConstant('ANSI_2', SCAnsi_2);
    AddSysConstant('ANSI_3', SCAnsi_3);
    AddSysConstant('ANSI_4', SCAnsi_4);
    AddSysConstant('ANSI_5', SCAnsi_5);
    AddSysConstant('ANSI_6', SCAnsi_6);
    AddSysConstant('ANSI_7', SCAnsi_7);
    AddSysConstant('ANSI_8', SCAnsi_8);
    AddSysConstant('ANSI_9', SCAnsi_9);
    AddSysConstant('ANSI_10', SCAnsi_10);
    AddSysConstant('ANSI_11', SCAnsi_11);
    AddSysConstant('ANSI_12', SCAnsi_12);
    AddSysConstant('ANSI_13', SCAnsi_13);
    AddSysConstant('ANSI_14', SCAnsi_14);
    AddSysConstant('ANSI_15', SCAnsi_15);
    AddSysConstant('CONNECTED', SCConnected);
    AddSysConstant('CURRENTANSILINE', SCCurrentANSILine);
    AddSysConstant('CURRENTLINE', SCCurrentLine);
    AddSysConstant('DATE', SCDate);
    AddSysConstant('FALSE', SCFalse);
    AddSysConstant('GAME', SCGame);
    AddSysConstant('GAMENAME', SCGameName);
    AddSysConstant('LICENSENAME', SCLicenseName);
    AddSysConstant('LOGINNAME', SCLoginName);
    AddSysConstant('PASSWORD', SCPassword);
    AddSysConstant('PORT.CLASS', SCPort_Class);
    AddSysConstant('PORT.BUYFUEL', SCPort_BuyFuel);
    AddSysConstant('PORT.BUYORG', SCPort_BuyOrg);
    AddSysConstant('PORT.BUYEQUIP', SCPort_BuyEquip);
    AddSysConstant('PORT.EXISTS', SCPort_Exists);
    AddSysConstant('PORT.FUEL', SCPort_Fuel);
    AddSysConstant('PORT.NAME', SCPort_Name);
    AddSysConstant('PORT.ORG', SCPort_Org);
    AddSysConstant('PORT.EQUIP', SCPort_Equip);
    AddSysConstant('PORT.PERCENTFUEL', SCPort_PercentFuel);
    AddSysConstant('PORT.PERCENTORG', SCPort_PercentOrg);
    AddSysConstant('PORT.PERCENTEQUIP', SCPort_PercentEquip);
    AddSysConstant('SECTOR.ANOMOLY', SCSector_Anomaly);
    AddSysConstant('SECTOR.BACKDOORCOUNT', SCSector_BackDoorCount);
    AddSysConstant('SECTOR.BACKDOORS', SCSector_BackDoors);
    AddSysConstant('SECTOR.DENSITY', SCSector_Density);
    AddSysConstant('SECTOR.EXPLORED', SCSector_Explored);
    AddSysConstant('SECTOR.FIGS.OWNER', SCSector_Figs_Owner);
    AddSysConstant('SECTOR.FIGS.QUANTITY', SCSector_Figs_Quantity);
    AddSysConstant('SECTOR.LIMPETS.OWNER', SCSector_Limpets_Owner);
    AddSysConstant('SECTOR.LIMPETS.QUANTITY', SCSector_Limpets_Quantity);
    AddSysConstant('SECTOR.MINES.OWNER', SCSector_Mines_Owner);
    AddSysConstant('SECTOR.MINES.QUANTITY', SCSector_Mines_Quantity);
    AddSysConstant('SECTOR.NAVHAZ', SCSector_Navhaz);
    AddSysConstant('SECTOR.PLANETCOUNT', SCSector_PlanetCount);
    AddSysConstant('SECTOR.PLANETS', SCSector_Planets);
    AddSysConstant('SECTOR.SHIPCOUNT', SCSector_ShipCount);
    AddSysConstant('SECTOR.SHIPS', SCSector_Ships);
    AddSysConstant('SECTOR.TRADERCOUNT', SCSector_TraderCount);
    AddSysConstant('SECTOR.TRADERS', SCSector_Traders);
    AddSysConstant('SECTOR.UPDATED', SCSector_Updated);
    AddSysConstant('SECTOR.WARPCOUNT', SCSector_WarpCount);
    AddSysConstant('SECTOR.WARPS', SCSector_Warps);
    AddSysConstant('SECTOR.WARPSIN', SCSector_WarpsIn);
    AddSysConstant('SECTOR.WARPINCOUNT', SCSector_WarpInCount);
    AddSysConstant('SECTORS', SCSectors);
    AddSysConstant('STARDOCK', SCStardock);
    AddSysConstant('TIME', SCTime);
    AddSysConstant('TRUE', SCTrue);
    // SysConstants added in 2.04
    AddSysConstant('ALPHACENTAURI', SCAlphaCentauri);
    AddSysConstant('CURRENTSECTOR', SCCurrentSector);
    AddSysConstant('RYLOS', SCRylos);
    // Added in 2.04a
    AddSysConstant('PORT.BUILDTIME', SCPort_BuildTime);
    AddSysConstant('PORT.UPDATED', SCPort_Updated);
    AddSysConstant('RAWPACKET', SCRAWPACKET);
    AddSysConstant('SECTOR.BEACON', SCSector_Beacon);
    AddSysConstant('SECTOR.CONSTELLATION', SCSector_Constellation);
    AddSysConstant('SECTOR.FIGS.TYPE', SCSector_Figs_Type);
    AddSysConstant('SECTOR.ANOMALY', SCSector_Anomaly);

    // Added in 2.06
    AddSysConstant('CURRENTTURNS', SCCurrentTurns);
    AddSysConstant('CURRENTCREDITS', SCCurrentCredits);
    AddSysConstant('CURRENTFIGHTERS', SCCurrentFighters);
    AddSysConstant('CURRENTSHIELDS', SCCurrentShields);
    AddSysConstant('CURRENTTOTALHOLDS', SCCurrentTotalHolds);
    AddSysConstant('CURRENTOREHOLDS', SCCurrentOreHolds);
    AddSysConstant('CURRENTORGHOLDS', SCCurrentOrgHolds);
    AddSysConstant('CURRENTEQUHOLDS', SCCurrentEquHolds);
    AddSysConstant('CURRENTCOLHOLDS', SCCurrentColHolds);
    AddSysConstant('CURRENTEMPTYHOLDS', SCCurrentEmptyHolds);
    AddSysConstant('CURRENTPHOTONS', SCCurrentPhotons);
    AddSysConstant('CURRENTARMIDS', SCCurrentArmids);
    AddSysConstant('CURRENTLIMPETS', SCCurrentLimpets);
    AddSysConstant('CURRENTGENTORPS', SCCurrentGenTorps);
    AddSysConstant('CURRENTTWARPTYPE', SCCurrentTwarpType);
    AddSysConstant('CURRENTCLOAKS', SCCurrentCloaks);
    AddSysConstant('CURRENTBEACONS', SCCurrentBeacons);
    AddSysConstant('CURRENTATOMICS', SCCurrentAtomics);
    AddSysConstant('CURRENTCORBOMITE', SCCurrentCorbomite);
    AddSysConstant('CURRENTEPROBES', SCCurrentEprobes);
    AddSysConstant('CURRENTMINEDISR', SCCurrentMineDisr);
    AddSysConstant('CURRENTPSYCHICPROBE', SCCurrentPsychicProbe);
    AddSysConstant('CURRENTPLANETSCANNER', SCCurrentPlanetScanner);
    AddSysConstant('CURRENTSCANTYPE', SCCurrentScanType);
    AddSysConstant('CURRENTALIGNMENT', SCCurrentAlignment);
    AddSysConstant('CURRENTEXPERIENCE', SCCurrentExperience);
    AddSysConstant('CURRENTCORP', SCCurrentCorp);
    AddSysConstant('CURRENTSHIPNUMBER', SCCurrentShipNumber);
    AddSysConstant('CURRENTSHIPCLASS', SCCurrentShipClass);
    AddSysConstant('CURRENTANSIQUICKSTATS',SCCurrentQuickStats);
    AddSysConstant('CURRENTQUICKSTATS',SCCurrentQuickStats);
    AddSysConstant('CURRENTQS',SCCurrentQS);
    AddSysConstant('CURRENTQSALL',SCCurrentQSALL);
    AddSysConstant('ACTIVEBOT',SCActiveBot);
    AddSysConstant('ACTIVEBOTSCRIPT',SCActiveBotScript);
    AddSysConstant('VERSION',SCTWXVersion);
    AddSysConstant('TWGSTYPE',SCTWGSTYPE);
    AddSysConstant('TWGSVER',SCTWGSVer);
    AddSysConstant('TW2002VER',SCTW2002Ver);
  end;
end;

procedure BuildCommandList(ScriptRef : TScriptRef);
begin
  with (ScriptRef) do
  begin
    AddCommand('ADD', 2, 2, CmdAdd, [pkVar, pkValue], pkValue);
    AddCommand('ADDMENU', 7, 7, CmdAddMenu, [pkValue, pkValue, pkValue, pkValue, pkValue, pkValue], pkValue);
    AddCommand('AND', 2, 2, CmdAnd, [pkVar, pkValue], pkValue);
    AddCommand('BRANCH', 2, 2, CmdBranch, [pkValue, pkValue], pkValue);
    AddCommand('CLIENTMESSAGE', 1, 1, CmdClientMessage, [pkValue], pkValue);
    AddCommand('CLOSEMENU', 0, 0, CmdCloseMenu, [], pkValue);
    AddCommand('CONNECT', 0, 0, CmdConnect, [], pkValue);
    AddCommand('CUTTEXT', 4, 4, CmdCutText, [pkValue, pkVar, pkValue, pkValue], pkValue);
    AddCommand('DELETE', 1, 1, CmdDelete, [pkValue], pkValue);
    AddCommand('DISCONNECT', 0, 1, CmdDisconnect, [], pkValue);

    AddCommand('DIVIDE', 2, 2, CmdDivide, [pkVar, pkValue], pkValue);
    AddCommand('ECHO', 1, -1, CmdEcho, [pkValue], pkValue);
    AddCommand('FILEEXISTS', 2, 2, CmdFileExists, [pkVar, pkValue], pkValue);
    AddCommand('GETCHARCODE', 2, 2, CmdGetCharCode, [pkValue, pkVar], pkValue);
    AddCommand('GETCONSOLEINPUT', 1, 2, CmdGetConsoleInput, [pkVar, pkValue], pkValue);
    AddCommand('GETCOURSE', 3, 3, CmdGetCourse, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('GETDATE', 1, 1, CmdGetDate, [pkVar], pkValue);
    AddCommand('GETDISTANCE', 3, 3, CmdGetDistance, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('GETINPUT', 2, 3, CmdGetInput, [pkVar, pkValue], pkValue);
    AddCommand('GETLENGTH', 2, 2, CmdGetLength, [pkValue, pkVar], pkValue);

    AddCommand('GETMENUVALUE', 2, 2, CmdGetMenuValue, [pkValue, pkValue], pkValue);
    AddCommand('GETOUTTEXT', 1, 1, CmdGetOutText, [pkVar], pkValue);
    AddCommand('GETRND', 3, 3, CmdGetRnd, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('GETSECTOR', 2, 2, CmdGetSector, [pkValue, pkVar], pkValue);
    AddCommand('GETSECTORPARAMETER', 3, 3, CmdGetSectorParameter, [pkValue, pkValue, pkVar], pkValue);
    AddCommand('GETTEXT', 4, 4, CmdGetText, [pkValue, pkVar, pkValue, pkValue], pkValue);
    AddCommand('GETTIME', 1, 2, CmdGetTime, [pkVar, pkValue], pkValue);
    AddCommand('GOSUB', 1, 1, CmdGosub, [pkValue], pkValue);
    AddCommand('GOTO', 1, 1, CmdGoto, [pkValue], pkValue);
    AddCommand('GETWORD', 3, 4, CmdGetWord, [pkValue, pkVar, pkValue], pkValue);

    AddCommand('GETWORDPOS', 3, 3, CmdGetWordPos, [pkValue, pkVar, pkValue], pkValue);
    AddCommand('HALT', 0, 0, CmdHalt, [], pkValue);
    AddCommand('ISEQUAL', 3, 3, CmdIsEqual, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('ISGREATER', 3, 3, CmdIsGreater, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('ISGREATEREQUAL', 3, 3, CmdIsGreaterEqual, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('ISLESSER', 3, 3, CmdIsLesser, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('ISLESSEREQUAL', 3, 3, CmdIsLesserEqual, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('ISNOTEQUAL', 3, 3, CmdIsNotEqual, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('ISNUMBER', 2, 2, CmdIsNumber, [pkVar, pkValue], pkValue);
    AddCommand('KILLWINDOW', 1, 1, CmdKillWindow, [pkValue], pkValue);

    AddCommand('KILLALLTRIGGERS', 0, 0, CmdKillAllTriggers, [], pkValue);
    AddCommand('KILLTRIGGER', 1, 1, CmdKillTrigger, [pkValue], pkValue);
    AddCommand('LOAD', 1, 1, CmdLoad, [pkValue], pkValue);
    AddCommand('LOADVAR', 1, 1, CmdLoadVar, [pkVar], pkValue);
    AddCommand('LOGGING', 1, 1, CmdLogging, [pkValue], pkValue);
    AddCommand('LOWERCASE', 1, 1, CmdLowerCase, [pkVar], pkValue);
    AddCommand('MERGETEXT', 3, 3, CmdMergeText, [pkValue, pkValue, pkVar], pkValue);
    AddCommand('MULTIPLY', 2, 2, CmdMultiply, [pkVar, pkValue], pkValue);
    AddCommand('OPENMENU', 1, 2, CmdOpenMenu, [pkValue, pkValue], pkValue);
    AddCommand('OR', 2, 2, CmdOr, [pkVar, pkValue], pkValue);

    AddCommand('PAUSE', 0, 0, CmdPause, [], pkValue);
    AddCommand('PROCESSIN', 2, 2, CmdProcessIn, [pkValue, pkValue], pkValue);
    AddCommand('PROCESSOUT', 1, 1, CmdProcessOut, [pkValue], pkValue);
    AddCommand('READ', 3, 3, CmdRead, [pkValue, pkVar, pkValue], pkValue);
    AddCommand('RENAME', 2, 2, CmdRename, [pkValue, pkValue], pkValue);
    AddCommand('REPLACETEXT', 3, 3, CmdReplaceText, [pkVar, pkValue, pkValue], pkValue);
    AddCommand('REQRECORDING', 0, 0, CmdReqRecording, [], pkValue);
    AddCommand('RETURN', 0, 0, CmdReturn, [], pkValue);
    AddCommand('ROUND', 1, 2, CmdRound, [pkVar, pkValue], pkValue);
    AddCommand('SAVEVAR', 1, 1, CmdSaveVar, [pkVar], pkValue);

    AddCommand('SEND', 1, -1, CmdSend, [pkValue], pkValue);
    AddCommand('SETARRAY', 2, -1, CmdSetArray, [pkVar, pkValue], pkValue);
    AddCommand('SETDELAYTRIGGER', 3, 3, CmdSetDelayTrigger, [pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETEVENTTRIGGER', 3, 4, CmdSetEventTrigger, [pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETMENUHELP', 2, 2, CmdSetMenuHelp, [pkValue, pkValue], pkValue);
    AddCommand('SETMENUVALUE', 2, 2, CmdSetMenuValue, [pkValue, pkValue], pkValue);
    AddCommand('SETMENUOPTIONS', 4, 4, CmdSetMenuOptions, [pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETPRECISION', 1, 1, CmdSetPrecision, [pkValue], pkValue);
    AddCommand('SETPROGVAR', 2, 2, CmdSetProgVar, [pkValue, pkValue], pkValue);
    AddCommand('SETSECTORPARAMETER', 3, 3, CmdSetSectorParameter, [pkValue, pkValue, pkValue], pkValue);

    AddCommand('SETTEXTLINETRIGGER', 2, 3, CmdSetTextLineTrigger, [pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETTEXTOUTTRIGGER', 2, 3, CmdSetTextOutTrigger, [pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETTEXTTRIGGER', 2, 3, CmdSetTextTrigger, [pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETVAR', 2, 2, CmdSetVar, [pkVar, pkValue], pkValue);
    AddCommand('SETWINDOWCONTENTS', 2, 2, CmdSetWindowContents, [pkValue, pkValue], pkValue);
    AddCommand('SOUND', 1, 1, CmdSound, [pkValue], pkValue);
    AddCommand('STOP', 1, 1, CmdStop, [pkValue], pkValue);
    AddCommand('STRIPTEXT', 2, 2, CmdStripText, [pkVar, pkValue], pkValue);
    AddCommand('SUBTRACT', 2, 2, CmdSubtract, [pkVar, pkValue], pkValue);
    AddCommand('SYS_CHECK', 0, 0, CmdSys_Check, [pkValue], pkValue);

    AddCommand('SYS_FAIL', 0, 0, CmdSys_Fail, [pkValue], pkValue);
    AddCommand('SYS_KILL', 0, 0, CmdSys_Kill, [pkValue], pkValue);
    AddCommand('SYS_NOAUTH', 0, 0, CmdSys_NoAuth, [pkValue], pkValue);
    AddCommand('SYS_NOP', 0, 0, CmdSys_Nop, [pkValue], pkValue);
    AddCommand('SYS_SHOWMSG', 0, 0, CmdSys_ShowMsg, [pkValue], pkValue);
    AddCommand('SYSTEMSCRIPT', 0, 0, CmdSystemScript, [], pkValue);
    AddCommand('UPPERCASE', 1, 1, CmdUpperCase, [pkVar], pkValue);
    AddCommand('XOR', 2, 2, CmdXor, [pkVar, pkValue], pkValue);
    AddCommand('WAITFOR', 1, 1, CmdWaitFor, [pkValue], pkValue);
    AddCommand('WINDOW', 4, 5, CmdWindow, [pkValue, pkValue, pkValue, pkValue, pkValue], pkValue);

    AddCommand('WRITE', 2, 2, CmdWrite, [pkValue, pkValue], pkValue);
    // Commands added for 2.04beta
    AddCommand('GETTIMER', 1, 1, CmdGetTimer, [pkVar], pkValue);
    AddCommand('READTOARRAY', 2, 2, CmdReadToArray, [pkValue, pkValue], pkValue);
    // Commands added for 2.04final
    AddCommand('CLEARALLAVOIDS', 0, 0, CmdClearAllAvoids, [], pkValue);
    AddCommand('CLEARAVOID', 1, 1, CmdClearAvoid, [pkValue], pkValue);
    AddCommand('GETALLCOURSES', 2, 2, CmdGetAllCourses, [pkVar, pkValue], pkValue);
    AddCommand('GETFILELIST', 1, 2, CmdGetFileList, [pkVar, pkValue], pkValue);
    AddCommand('GETNEARESTWARPS', 2, 2, CmdGetNearestWarps, [pkVar, pkValue], pkValue);
    AddCommand('GETSCRIPTVERSION', 2, 2, CmdGetScriptVersion, [pkValue, pkVar], pkValue);
    AddCommand('LISTACTIVESCRIPTS', 1, 1, CmdListActiveScripts, [pkVar], pkValue);

    AddCommand('LISTAVOIDS', 1, 1, CmdListAvoids, [pkVar], pkValue);
    AddCommand('LISTSECTORPARAMETERS', 2, 2, CmdListSectorParameters, [pkValue, pkVar], pkValue);
    AddCommand('SETAVOID', 1, 1, CmdSetAvoid, [pkValue], pkValue);
    // Commands added for 2.05beta
    AddCommand('CUTLENGTHS', 3, 3, CmdCutLengths, [pkValue, pkVar, pkValue], pkValue);
    AddCommand('FORMAT', 3, 3, CmdFormat, [pkValue, pkVar, pkValue], pkValue);
    AddCommand('GETDIRLIST', 1, 2, CmdGetDirList, [pkVar, pkValue], pkValue);
    AddCommand('GETWORDCOUNT', 2, 2, CmdGetWordCount, [pkValue, pkVar], pkValue);
    AddCommand('MAKEDIR', 1, 1, CmdMakeDir, [pkValue], pkValue);
    AddCommand('PADLEFT', 2, 2, CmdPadLeft, [pkVar, pkValue], pkValue);
    AddCommand('PADRIGHT', 2, 2, CmdPadRight, [pkVar, pkValue], pkValue);

    AddCommand('REMOVEDIR', 1, 1, CmdRemoveDir, [pkValue], pkValue);
    AddCommand('SETMENUKEY', 1, 1, CmdSetMenuKey, [pkValue], pkValue);
    AddCommand('SPLITTEXT', 2, 3, CmdSplitText, [pkValue, pkVar], pkValue);
    AddCommand('TRIM', 1, 1, CmdTrim, [pkVar], pkValue);
    AddCommand('TRUNCATE', 1, 1, CmdTruncate, [pkVar], pkValue);

    // Commands added for 2.06
    AddCommand('GETDEAFCLIENTS', 1, 1, CmdGetDeafClients, [pkValue], pkValue);
    AddCommand('SETDEAFCLIENTS', 0, 1, CmdSetDeafClients, [pkValue], pkValue);

    AddCommand('SAVEGLOBAL', 1, 1, CmdSaveGlobal, [pkValue], pkValue);
    AddCommand('LOADGLOBAL', 1, 1, CmdLoadGlobal, [pkValue], pkValue);
    AddCommand('CLEARGLOBAL', 0, 0, CmdClearGlobal, [], pkValue);

    AddCommand('SWITCHBOT', 0, 1, CmdSwitchBot, [pkValue], pkValue);
    AddCommand('STRIPANSI', 2, 2, CmdStripANSI, [pkValue, pkValue], pkValue);
    AddCommand('SETAUTOTRIGGER', 3, 4, CmdSetAutoTrigger, [pkValue, pkValue, pkValue, pkValue], pkValue);
    AddCommand('SETAUTOTEXTTRIGGER', 3, 4, CmdSetAutoTrigger, [pkValue, pkValue, pkValue, pkValue], pkValue);
    AddCommand('REQVERSION', 1, 1, CmdReqVersion, [pkValue], pkValue);
    AddCommand('SORTARRAY', 1, 1, CmdSortArray, [pkValue], pkValue);
    AddCommand('MODULAS', 1, 1, CmdModulas, [pkValue], pkValue);

    AddCommand('SETQUICKTEXT', 2, 2, CmdAddQuickText, [pkValue], pkValue);
    AddCommand('CLEARQUICKTEXT', 1, 0, CmdClearQuickText, [pkValue], pkValue);

//    AddCommand('COPYDATABASE', 1, 1, CmdCopyDatabase, [pkValue], pkValue);
//    AddCommand('CREATEDATABASE', 1, 1, CmdCreateDatabase, [pkValue], pkValue);
//    AddCommand('DELETEDATABASE', 1, 1, CmdDeleteDatabase, [pkValue], pkValue);
//    AddCommand('EDITDATABASE', 1, 1, CmdEditDatabase, [pkValue], pkValue);
//    AddCommand('LISTDATABASES', 1, 1, CmdListDatabases, [pkValue], pkValue);
//    AddCommand('LOADDATABASE', 1, 1, CmdLoadDatabase, [pkValue], pkValue);



    //    AddCommand('', 1, 1, Cmd, [pkValue], pkValue);
    // GETGAMESETTINGS CmdGotoPrompt ??? Switchboard ??? Maybe

  end;
end;

initialization
  SetRoundMode(rmDown); // EP - We want all floats rounded down (truncated).

finalization
  LastReadStrings.Free;
end.

