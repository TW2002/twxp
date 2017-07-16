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
unit Bubble;

interface

uses
  SysUtils,
  Core,
  Database,
  Classes,
  Script; // EP - Not sure this reference is needed.

type
  TModBubble = class(TTWXModule, IModBubble)
  private
    FBubbleSize,
    FDeepestDepth,
    FDeepestPoint,
    FTotalBubbles,
    FGappedBubbles,
    FMaxBubbleSize  : Integer;
    FBubblesCovered,
    FAreaCovered    : Pointer;
    FBubbleList     : TList;
    FTargetFile     : ^TextFile;

    function IsClosedArea(Area: TSector; AreaIndex: Integer; Last, Depth : Word) : Boolean;
    function TestBubble(Gate, Interior : Word; var Deepest : Word; var Gapped : Boolean) : Integer;
    procedure WriteBubbles(UseFile : Boolean);

  protected
    { IModBubble }
    function GetMaxBubbleSize: Integer;
    procedure SetMaxBubbleSize(Value: Integer);

  public
    procedure AfterConstruction; override;
    procedure DumpBubbles;
    procedure ShowBubble(Gate, Interior : Word);
    procedure ExportBubbles(var F : TextFile);

  published
    property MaxBubbleSize: Integer read GetMaxBubbleSize write SetMaxBubbleSize;
  end;


implementation

uses
  Global,
  Utility,
  Ansi,
  TCP;

type
  TBubble = record
    Gate,
    Deepest,
    Size    : Word;
    Gapped  : Boolean;
  end;

procedure TModBubble.AfterConstruction;
begin
  inherited;

  // set defaults
  MaxBubbleSize := 25;
end;

function TModBubble.IsClosedArea(Area: TSector; AreaIndex: Integer; Last, Depth : Word) : Boolean;
var
  I         : Integer;
  S         : TSector;
begin
  if (FBubbleSize > FMaxBubbleSize) or (Area.Explored = etNo) then
  begin
    Result := FALSE;
    Exit;
  end;

  if (Depth > FDeepestDepth) then
  begin
    FDeepestPoint := AreaIndex;
    FDeepestDepth := Depth;
  end;

  Byte(Pointer(Integer(FAreaCovered) + AreaIndex - 1)^) := 1;

  Result := TRUE;

  for I := 1 to 6 do
  begin
    if (Area.Warp[I] = 0) then
      Break
    else if (Area.Warp[I] <> Last) and (Byte(Pointer(Integer(FAreaCovered) + Area.Warp[I] - 1)^) = 0) and (Area.Explored <> etNo) then
    begin
      S := TWXDatabase.LoadSector(Area.Warp[I]);

      // see if it warps into here
      if (S.Warp[1] = AreaIndex)
       or (S.Warp[2] = AreaIndex)
       or (S.Warp[3] = AreaIndex)
       or (S.Warp[4] = AreaIndex)
       or (S.Warp[5] = AreaIndex)
       or (S.Warp[6] = AreaIndex) then
      begin
        Inc(FBubbleSize);

        if not (IsClosedArea(S, Area.Warp[I], AreaIndex, Depth + 1)) then
        begin
          Result := FALSE;
          Break;
        end;
      end;
    end;
  end;
end;

function TModBubble.TestBubble(Gate, Interior : Word; var Deepest : Word; var Gapped : Boolean) : Integer;
var
  Area      : TSector;
  PSource,
  PDest     : Pointer;
  AreaIndex : Integer;
  PEnd      : Integer;
  BackDoors : TList;
begin
  FBubbleSize := 0;
  FDeepestDepth := 0;
  Area := TWXDatabase.LoadSector(Interior);
  FAreaCovered := AllocMem(TWXDatabase.DBHeader.Sectors);
  Gapped := FALSE;

  if not (IsClosedArea(Area, Interior, Gate, 0)) then
    Result := -1
  else
  begin
    // copy the area covered to the bubbles covered
    PSource := FAreaCovered;
    PDest := FBubblesCovered;
    PEnd := Integer(FAreaCovered) + TWXDatabase.DBHeader.Sectors;

    while (Integer(PSource) < PEnd) do
    begin
      if (Byte(PSource^) = 1) then
      begin
        // check for backdoors without the GetBackdoors routine (for speed purposes)
        if not (Gapped) then
        begin
          AreaIndex := Integer(PSource) - Integer(FAreaCovered) + 1;
          Area := TWXDatabase.LoadSector(AreaIndex);
          BackDoors := TWXDatabase.GetBackDoors(Area, AreaIndex);

          if (BackDoors.Count > 0) then
            Gapped := TRUE;

          FreeList(BackDoors, 2);
        end;

        Byte(PDest^) := 1;
      end;

      Integer(PSource) := Integer(PSource) + 1;
      Integer(PDest) := Integer(PDest) + 1;
    end;

    Result := FBubbleSize + 1;
  end;

  FreeMem(FAreaCovered);
  Deepest := FDeepestPoint;
end;

function SortList(Item1, Item2 : Pointer) : Integer;
begin
  Result := TBubble(Item1^).Deepest - TBubble(Item2^).Deepest;
end;

procedure TModBubble.WriteBubbles(UseFile : Boolean);
var
  I        : Integer;
  S        : TSector;
  SGapped  : Boolean;
  SDeepest,
  SSize,
  SGate    : String;

  procedure CheckBubble(Interior : Word);
  var
    Gapped  : Boolean;
    Deepest : Word;
    Size    : Integer;
    Bubble  : ^TBubble;
  begin
    Size := TestBubble(I, Interior, Deepest, Gapped);

    if (Size > 1) then
    begin
      Bubble := AllocMem(SizeOf(TBubble));
      Bubble^.Gate := I;
      Bubble^.Deepest := Deepest;
      Bubble^.Size := Size;
      Bubble^.Gapped := Gapped;
      FBubbleList.Add(Bubble);
    end;
  end;

begin
  FBubbleList := TList.Create;
  FTotalBubbles := 0;
  FGappedBubbles := 0;
  FBubblesCovered := AllocMem(TWXDatabase.DBHeader.Sectors);

  for I := 1 to TWXDatabase.DBHeader.Sectors do
  begin
    S := TWXDatabase.LoadSector(I);

    if (S.Warp[2] > 0) and (Byte(Pointer(Integer(FBubblesCovered) + I - 1)^) = 0) then
    begin
      CheckBubble(S.Warp[1]);
      CheckBubble(S.Warp[2]);

      if (S.Warp[3] > 0) then
        CheckBubble(S.Warp[3]);
      if (S.Warp[4] > 0) then
        CheckBubble(S.Warp[4]);
      if (S.Warp[5] > 0) then
        CheckBubble(S.Warp[5]);
      if (S.Warp[6] > 0) then
        CheckBubble(S.Warp[6]);
    end;
  end;

  if (UseFile) then
    FBubbleList.Sort(SortList);

  // Show bubbles that aren't parts of bubbles
  for I := 0 to FBubbleList.Count - 1 do
  begin
    if (Byte(Pointer(Integer(FBubblesCovered) + TBubble(FBubbleList.Items[I]^).Gate - 1)^) = 0) then
    begin
      SGate := IntToStr(TBubble(FBubbleList.Items[I]^).Gate);
      SDeepest := IntToStr(TBubble(FBubbleList.Items[I]^).Deepest);
      SSize := IntToStr(TBubble(FBubbleList.Items[I]^).Size);
      SGapped := TBubble(FBubbleList.Items[I]^).Gapped;

      if (UseFile) then
        WriteLn(FTargetFile^, SDeepest + ' ' + SSize)
      else
      begin
        Inc(FTotalBubbles);

        if (SGapped) then
        begin
          Inc(FGappedBubbles);
          TWXServer.Broadcast(ANSI_4 + 'Gate: ' + ANSI_12 + SGate + ANSI_4 + GetSpace(10 - Length(SGate)) + 'Deepest: ' + ANSI_12 + SDeepest + ANSI_4 + GetSpace(10 - Length(SDeepest)) + 'Size: ' + ANSI_12 + SSize + endl)
        end
        else
          TWXServer.Broadcast(ANSI_3 + 'Gate: ' + ANSI_11 + SGate + ANSI_3 + GetSpace(10 - Length(SGate)) + 'Deepest: ' + ANSI_11 + SDeepest + ANSI_3 + GetSpace(10 - Length(SDeepest)) + 'Size: ' + ANSI_11 + SSize + endl);
      end;
    end;
  end;

  FreeMem(FBubblesCovered);

  while (FBubbleList.Count > 0) do
  begin
    FreeMem(FBubbleList.Items[0]);
    FBubbleList.Delete(0);
  end;

  FBubbleList.Free;
end;

procedure TModBubble.DumpBubbles;
var
  F : TextFile;
  FileName : String;
begin
  // EP - Previously just 'WriteBubbles(False);'
  //FileName := TWXInterpreter.ProgramDir + '\' + TWXDatabase.DatabaseName + '_Bubbles.txt';
  FileName := TWXGUI.ProgramDir + '\' + TWXDatabase.DatabaseName + '_Bubbles.txt';
  AssignFile(F, FileName);
  {$I-}
  ReWrite(F);

  if (IOResult <> 0) then
    WriteBubbles(False)
  else
  begin
    ExportBubbles(F);
    CloseFile(F);
  end;
  // EP - End

  TWXServer.Broadcast(endl + ANSI_15 + 'Completed - ' + IntToStr(FTotalBubbles - FGappedBubbles) + ' solid bubbles, ' + IntToStr(FGappedBubbles) + ' gapped bubbles (total of ' + IntToStr(FTotalBubbles) + ' bubbles)' + endl
                + 'Bubbles shown in red are gapped (broken by at least one backdoor)' + endl);
end;

procedure TModBubble.ExportBubbles(var F : TextFile);
begin
  FTargetFile := @F;
  WriteBubbles(True);
end;

procedure TModBubble.ShowBubble(Gate, Interior : Word);
var
  Area      : TSector;
  Col,
  I         : Integer;
  BackDoors,
  Gaps      : TList;
begin
  FBubbleSize := 0;
  FDeepestDepth := 0;
  Area := TWXDatabase.LoadSector(Interior);
  FAreaCovered := AllocMem(TWXDatabase.DBHeader.Sectors);
  Gaps := TList.Create;

  if (IsClosedArea(Area, Interior, Gate, 0)) then
  begin
    TWXServer.Broadcast(ANSI_9 + 'Gate: ' + ANSI_11 + IntToStr(Gate) + endl
                  + ANSI_9 + 'Size: ' + ANSI_11 + IntToStr(FBubbleSize + 1) + endl
                  + ANSI_9 + 'Deepest Sector: ' + ANSI_11 + IntToStr(FDeepestPoint) + endl
                  + ANSI_9 + 'Interior: ' + ANSI_11);

    Col := 1;

    for I := 1 to TWXDatabase.DBHeader.Sectors do
      if (Byte(Pointer(Integer(FAreaCovered) + I - 1)^) = 1) then
      begin
        Inc(Col);
        TWXServer.Broadcast(IntToStr(I) + GetSpace(6 - Length(IntToStr(I))));

        if (Col >= 8) then
        begin
          TWXServer.Broadcast(endl + '          ');
          Col := 1;
        end;

        BackDoors := TWXDatabase.GetBackDoors(TWXDatabase.LoadSector(I), I);

        while (BackDoors.Count > 0) do
        begin
          Gaps.Add(BackDoors.Items[0]);
          BackDoors.Delete(0);
        end;

        BackDoors.Free;
      end;

    if (Gaps.Count > 0) then
    begin
      TWXServer.Broadcast(endl + ANSI_9 + 'Back Doors: ' + ANSI_12);

      while (Gaps.Count > 0) do
      begin
         TWXServer.Broadcast(IntToStr(Word(Gaps.Items[0]^)) + ' ');
         FreeMem(Gaps[0]);
         Gaps.Delete(0);
      end;
    end;
  end
  else
    TWXServer.Broadcast(ANSI_15 + 'No bubble found.');

  TWXServer.Broadcast(endl + endl);
  FreeMem(FAreaCovered);
  Gaps.Free;
end;

function TModBubble.GetMaxBubbleSize: Integer;
begin
  Result := FMaxBubbleSize;
end;

procedure TModBubble.SetMaxBubbleSize(Value: Integer);
begin
  FMaxBubbleSize := Value;
end;

end.

