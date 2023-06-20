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
unit FormCap;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  StdCtrls, ComCtrls, ActnList, Menus, ExtCtrls, FormCapFind;

const
  SCFileExists = 'The specified file already exists!  Overwrite it?';

type
  TFindType = (ftFromStart, ftFromSelection);

  TCaptureFrame = class;
  TCaptureLine = class;
  TCapture = class;

  TfrmCap = class(TForm)
    mnuMain: TMainMenu;
    miFile: TMenuItem;
    miOpen: TMenuItem;
    alMain: TActionList;
    actOpen: TAction;
    dlgOpen: TOpenDialog;
    miEdit: TMenuItem;
    miExport: TMenuItem;
    miInsert: TMenuItem;
    miDelete: TMenuItem;
    actDelete: TAction;
    actExport: TAction;
    mnuPopup: TPopupMenu;
    Delete1: TMenuItem;
    Exportcapturefile1: TMenuItem;
    Importcapturefile1: TMenuItem;
    sbMain: TScrollBar;
    actImport: TAction;
    dlgSave: TSaveDialog;
    actFind: TAction;
    miFind: TMenuItem;
    actExportText: TAction;
    dlgSaveText: TSaveDialog;
    ExportframesasText1: TMenuItem;
    miExportText: TMenuItem;
    procedure actOpenExecute(Sender: TObject);
    procedure sbMainScroll(Sender: TObject; ScrollCode: TScrollCode;
      var ScrollPos: Integer);
    procedure FormPaint(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormMouseDown(Sender: TObject; Button: TMouseButton;
      Shift: TShiftState; X, Y: Integer);
    procedure FormMouseWheel(Sender: TObject; Shift: TShiftState;
      WheelDelta: Integer; MousePos: TPoint; var Handled: Boolean);
    procedure actExportExecute(Sender: TObject);
    procedure actSelectUpdate(Sender: TObject);
    procedure actFindExecute(Sender: TObject);
    procedure actExportTextExecute(Sender: TObject);
  private
    { Private declarations }
    FCapture: TCapture;
    FSelection: TCaptureFrame;
    FRangedSelection: TCaptureFrame;
    FFindSelection: TCaptureFrame;
    FFindForm: TfrmCapFind;

    procedure DrawFrames;
    procedure ScrollToSelection;
    function GetFrameXY(X, Y: Integer): TCaptureFrame;
    function GetLineHeight: Integer;
    function GetTopSelection: TCaptureFrame;
    function GetBotSelection: TCaptureFrame;
    function GetSelectionActive: Boolean;
    function GetFindForm: TfrmCapFind;
  protected
    property LineHeight: Integer read GetLineHeight;
    property FindForm: TfrmCapFind read GetFindForm;
  public
    function FindNextFrame(SearchText: string; FindType: TFindType): Boolean;

    property TopSelection: TCaptureFrame read GetTopSelection;
    property BotSelection: TCaptureFrame read GetBotSelection;
    property SelectionActive: Boolean read GetSelectionActive;
  end;

  TCapture = class
  private
    FFrames: array of TCaptureFrame;
    FLines: array of TCaptureLine;
    FFramesLoaded: Boolean;
    FInAnsi: Boolean;
    FFrameCount: Integer;
    FLineCount: Integer;
    FIndexedFrameCount: Integer;
    FFilename: string;
    function GetLine(Index: Integer): TCaptureLine;
    function GetFrameCount: Integer;
    function GetLineCount: Integer;
    procedure CheckFramesLoaded;
    procedure IndexFrames;
    procedure AppendFrame(Frame: TCaptureFrame);
    procedure AppendLine(Line: TCaptureLine);
  public
    constructor Create(AFilename: string);
    procedure PrintLines(Canvas: TCanvas; StartIndex: Integer);
    procedure StripANSI(var S: string);
    procedure ExportFrames(AFilename: string; StartFrame, EndFrame: TCaptureFrame; AsText: Boolean = False);
    function FindFrame(SearchText: string; StartIndex: Integer): TCaptureFrame;
    property Lines[Index: Integer]: TCaptureLine read GetLine;
    property FrameCount: Integer read GetFrameCount;
    property LineCount: Integer read GetLineCount;
    property Filename: string read FFilename;
  end;

  TCaptureFrame = class
  private
    FCapture: TCapture;
    FTimestamp: Cardinal;
    FData: string;
    FTextData: string;
    FIndex: Integer;
    FTopLine: TCaptureLine;
    procedure LoadFromStream(Stream: TStream);
  public
    constructor Create(Owner: TCapture; SourceStream: TStream);
    procedure SaveToStream(Stream: TStream; AsText: Boolean);
    property Text: string read FTextData;
    property Index: Integer read FIndex write FIndex;
    property TopLine: TCaptureLine read FTopLine write FTopLine;
  end;

  // TCaptureLine: Represents a line of text linked to a series of frames
  TCaptureLine = class
  private
    FCaptureFrames: array of TCaptureFrame;
    FFirstFrameOffset: Integer;
    FLastFrameEnd: Integer;
    FIndex: Integer;
    function GetText: string;
  public
    procedure AddFrame(Frame: TCaptureFrame);
    function FindFrame(SearchText: string): TCaptureFrame;
    procedure Draw(Canvas: TCanvas; Y: Integer);
    function GetFrame(CharIndex: Integer): TCaptureFrame;
    property Text: string read GetText;
    property FirstFrameOffset: Integer read FFirstFrameOffset write FFirstFrameOffset;
    property LastFrameEnd: Integer read FLastFrameEnd write FLastFrameEnd;
    property Index: Integer read FIndex write FIndex;
  end;

var
  frmCap: TfrmCap;

implementation

const
  FrameListDelta = 128;
  LineListDelta = 128;
  MinFrameSize = 7;
  SCCorruptFile = 'The selected file is either corrupted or not a capture file';

{$R *.DFM}

procedure TfrmCap.actOpenExecute(Sender: TObject);
begin
  if dlgOpen.Execute then
  try
    if Assigned(FCapture) then
      FCapture.Destroy;

    FCapture := TCapture.Create(dlgOpen.FileName);
    DrawFrames;
  except
    MessageDlg('Unable to open the selected file', mtError, [mbOK], 0);
  end;
end;

function TfrmCap.FindNextFrame(SearchText: string; FindType: TFindType): Boolean;
var
  SearchIndex: Integer;
begin
  // find the next frame with this search text in it

  if Assigned(FFindSelection) then begin
    SearchIndex := FFindSelection.Index;
  end else if (FindType = ftFromStart) or not Assigned(FSelection) then begin
    SearchIndex := 0;
  end else begin // FindType = ftFromSelection
    SearchIndex := FSelection.FIndex;
  end;

  FFindSelection := FCapture.FindFrame(SearchText, SearchIndex);
  Result := Assigned(FFindSelection);

  if Result then begin
    FSelection := FFindSelection;
    FRangedSelection := FFindSelection;
    ScrollToSelection;
  end;
end;

function TfrmCap.GetFindForm: TfrmCapFind;
begin
  if not Assigned(FFindForm) then begin
    FFindForm := TfrmCapFind.Create(Self);
  end;

  Result := FFindForm;
end;

constructor TCapture.Create(AFilename: string);
begin
  FFilename := AFilename;
end;

procedure TCapture.PrintLines(Canvas: TCanvas; StartIndex: Integer);
begin
  CheckFramesLoaded;
end;

function TCapture.GetLine(Index: Integer): TCaptureLine;
begin
  CheckFramesLoaded;

  Assert(Index < FLineCount, 'Line number exceeds number of indexed lines');
  Result := FLines[Index];
end;

function TCapture.GetFrameCount: Integer;
begin
  CheckFramesLoaded;

  Result := FFrameCount;
end;

function TCapture.GetLineCount: Integer;
begin
  CheckFramesLoaded;

  Result := FLineCount;
end;

procedure TCapture.CheckFramesLoaded;
var
  CapFile: TFileStream;
begin
  if not FFramesLoaded then begin
    CapFile := TFileStream.Create(FFilename, fmOpenRead or fmShareDenyWrite);

    while (CapFile.Position < CapFile.Size) do begin
      AppendFrame(TCaptureFrame.Create(Self, CapFile));
    end;

    IndexFrames;
    FFramesLoaded := True;
  end;
end;

procedure TCapture.AppendFrame(Frame: TCaptureFrame);
begin
  if (FFrameCount >= Length(FFrames)) then
    SetLength(FFrames, FFrameCount + FrameListDelta);

  FFrames[FFrameCount] := Frame;
  Frame.Index := FFrameCount;
  Inc(FFrameCount);
end;

procedure TCapture.AppendLine(Line: TCaptureLine);
begin
  if (FLineCount >= Length(FLines)) then
    SetLength(FLines, FLineCount + LineListDelta);

  FLines[FLineCount] := Line;
  Line.Index := FLineCount;
  Inc(FLineCount);
end;

procedure TCapture.IndexFrames;
var
  I: Integer;
  Frame: TCaptureFrame;
  CaptureLine: TCaptureLine;
begin
  // Index frames by their line

  CaptureLine := nil;

  while (FIndexedFrameCount < FFrameCount) do begin
    Frame := FFrames[FIndexedFrameCount];

    if not Assigned(CaptureLine) then begin
      CaptureLine := TCaptureLine.Create;
      AppendLine(CaptureLine);
    end;

    CaptureLine.AddFrame(Frame);
    Frame.TopLine := CaptureLine;

    I := 1;
    while (I <= Length(Frame.Text)) do begin
      if (Frame.Text[I] = #13) then begin
        CaptureLine.LastFrameEnd := I;

        if (I = Length(Frame.Text)) then
          CaptureLine := nil
        else begin
          CaptureLine := TCaptureLine.Create;
          CaptureLine.AddFrame(Frame);
          CaptureLine.FirstFrameOffset := I + 1;
          AppendLine(CaptureLine);
        end;
      end;

      Inc(I);
    end;

    Inc(FIndexedFrameCount);
  end;
end;

procedure TCapture.StripANSI(var S : String);
var
  I    : Integer;
  X    : String;
begin
  // Remove ANSI codes from text
  X := '';

  for I := 1 to length(S) do
  begin
    if (S[I] = #27) then
      FInAnsi := TRUE;

    if (FInAnsi = FALSE) and ((Byte(S[I]) >= 32) or (Byte(S[I]) = 13)) then
      X := X + S[I];

    if ((Byte(S[I]) >= 65) and (Byte(S[I]) <= 90)) or ((Byte(S[I]) >= 97) and (Byte(S[I]) <= 122)) then
      FInAnsi := FALSE;
  end;

  S := X;
end;

function TCapture.FindFrame(SearchText: string; StartIndex: Integer): TCaptureFrame;
var
  I: Integer;
begin
  // find the first frame matching the search text after the specified index
  // search line-by-line

  Result := nil;
  SearchText := UpperCase(SearchText);

  if (StartIndex + 1 < FrameCount) then
    for I := FFrames[StartIndex + 1].TopLine.Index to FLineCount - 1 do begin
      if (Pos(SearchText, UpperCase(FLines[I].Text)) > 0) then begin
        Result := FLines[I].FindFrame(SearchText);
        Break;
      end;
    end;
end;

procedure TCapture.ExportFrames(AFilename: string; StartFrame, EndFrame: TCaptureFrame; AsText: Boolean = False);
var
  I: Integer;
  Stream: TFileStream;
begin
  if FileExists(AFilename) then begin
    DeleteFile(AFilename);
  end;

  Stream := TFileStream.Create(AFilename, fmCreate or fmShareDenyWrite);

  try
    for I := StartFrame.Index to EndFrame.Index do begin
      FFrames[I].SaveToStream(Stream, AsText);
    end;
  finally
    Stream.Free;
  end;
end;

constructor TCaptureFrame.Create(Owner: TCapture; SourceStream: TStream);
begin
  FCapture := Owner;
  LoadFromStream(SourceStream);
end;

procedure TCaptureFrame.SaveToStream(Stream: TStream; AsText: Boolean);
var
  EntrySize: Word;
  SaveText: string;
begin
  if AsText then begin
    SaveText := StringReplace(Text, #13, #13 + #10, [rfReplaceAll]);
    Stream.Write(PChar(SaveText)^, Length(SaveText));
  end else begin
    EntrySize := Length(FData);

    with Stream do begin
      Write(FTimestamp, SizeOf(FTimestamp));
      Write(EntrySize, SizeOf(EntrySize));
      Write(PChar(FData)^, EntrySize);
    end;
  end;
end;

procedure TCaptureFrame.LoadFromStream(Stream: TStream);
var
  EntrySize: Word;
  Entry: PChar;
begin
  if (Stream.Size - Stream.Position < MinFrameSize) then
    raise Exception.Create(SCCorruptFile);

  with Stream do begin
    Read(FTimestamp, SizeOf(FTimestamp));
    Read(EntrySize, SizeOf(EntrySize));

    if (Position + EntrySize > Size) then
      raise Exception.Create(SCCorruptFile);

    GetMem(Entry, EntrySize);

    try
      Read(Entry^, EntrySize);
      SetString(FData, Entry, EntrySize);
      FTextData := FData;
      FCapture.StripANSI(FTextData);
    finally
      FreeMem(Entry);
    end;
  end;
end;

function TCaptureLine.GetText: string;
var
  I: Integer;
  J: Integer;
  Line: string;
begin
  Result := '';

  for I := 0 to Length(FCaptureFrames) - 1 do begin
    if (I = 0) then begin
      Line := Copy(FCaptureFrames[I].Text, FirstFrameOffset, 65535);
      J := Pos(#13, Line);
      if (J > 0) then
        Result := Copy(Line, 1, J)
      else
        Result := Line;
    end else begin
      J := Pos(#13, FCaptureFrames[I].Text);
      if (J > 0) then
        Result := Result + Copy(FCaptureFrames[I].Text, 1, J)
      else
        Result := Result + FCaptureFrames[I].Text;
    end;
  end;
end;

procedure TCaptureLine.AddFrame(Frame: TCaptureFrame);
begin
  SetLength(FCaptureFrames, Length(FCaptureFrames) + 1);
  FCaptureFrames[Length(FCaptureFrames) - 1] := Frame;
end;

function TCaptureLine.FindFrame(SearchText: string): TCaptureFrame;
var
  I: Integer;
begin
  // find a frame in this line that matches searchtext

  Result := nil;

  for I := 0 to Length(FCaptureFrames) - 1 do begin
    if (Pos(SearchText, UpperCase(FCaptureFrames[I].Text)) > 0) then begin
      Result := FCaptureFrames[I];
      Break;
    end;
  end;
end;

function TCaptureLine.GetFrame(CharIndex: Integer): TCaptureFrame;
var
  I: Integer;
  Len: Integer;
  Line: String;
  P: Integer;
begin
  // Calculate which frame is at CharIndex
  Result := nil;

  for I := 0 to High(FCaptureFrames) do begin
    if (I = 0) then
      Line := Copy(FCaptureFrames[I].Text, FirstFrameOffset, High(Integer))
    else
      Line := FCaptureFrames[I].Text;

    P := Pos(#13, Line);
    if (P > 0) then
      Len := P - 1
    else
      Len := Length(Line);

    if (Len >= CharIndex) then begin
      Result := FCaptureFrames[I];
      Break;
    end;

    Dec(CharIndex, Len);
  end;
end;

procedure TCaptureLine.Draw(Canvas: TCanvas; Y: Integer);
var
  I: Integer;
  J: Integer;
  X: Integer;
  Frame: TCaptureFrame;
  Line: String;
  RangeMin: Integer;
  RangeMax: Integer;
begin
  X := 0;
  if frmCap.SelectionActive then begin
    RangeMin := frmCap.TopSelection.Index;
    RangeMax := frmCap.BotSelection.Index;
  end else begin
    RangeMin := -1;
    RangeMax := -1;
  end;

  for I := 0 to High(FCaptureFrames) do begin
    Frame := FCaptureFrames[I];

    if (Frame.Index <= RangeMax) and (Frame.Index >= RangeMin) then begin
      Canvas.Brush.Color := clBlue;
    end else begin
      Canvas.Brush.Color := clBlack;
    end;

    if (I = 0) then
      Line := Copy(FCaptureFrames[I].Text, FirstFrameOffset, High(Integer))
    else
      Line := FCaptureFrames[I].Text;

    J := Pos(#13, Line);
    if (J > 0) then
      Line := Copy(Line, 1, J - 1);

    Canvas.TextOut(X, Y, Line);

    Inc(X, Length(Line) * 6);
  end;
end;

function TfrmCap.GetTopSelection: TCaptureFrame;
begin
  if (FRangedSelection.Index > FSelection.Index) then begin
    Result := FSelection;
  end else begin
    Result := FRangedSelection;
  end;
end;

function TfrmCap.GetBotSelection: TCaptureFrame;
begin
  if (FRangedSelection.Index < FSelection.Index) then begin
    Result := FSelection;
  end else begin
    Result := FRangedSelection;
  end;
end;

function TfrmCap.GetSelectionActive: Boolean;
begin
  Result := Assigned(FSelection) and Assigned(FRangedSelection);
end;

procedure TfrmCap.sbMainScroll(Sender: TObject; ScrollCode: TScrollCode;
  var ScrollPos: Integer);
begin
  DrawFrames;
end;

procedure TfrmCap.DrawFrames;
var
  I: Integer;
  Y: Integer;
  Max: Integer;
begin
  Y := 0;

  // clear canvas
  Canvas.Brush.Color := clBlack;
  Canvas.FillRect(Rect(0, 0, Width - sbMain.Width, Height));

  if Assigned(FCapture) then begin
    if (sbMain.Max <> FCapture.LineCount) then begin
      sbMain.Max := FCapture.LineCount;
      sbMain.LargeChange := Height div LineHeight;
    end;

    Max := Height div LineHeight + sbMain.Position;

    for I := sbMain.Position to FCapture.LineCount - 1 do begin
      if (I > Max) then
        Break;

      FCapture.Lines[I].Draw(Canvas, Y);
      Inc(Y, LineHeight);
    end;
  end;
end;

procedure TfrmCap.ScrollToSelection;
begin
  if (FSelection <> nil) then begin
    sbMain.Position := FSelection.TopLine.Index;
    DrawFrames;
  end;
end;

procedure TfrmCap.FormPaint(Sender: TObject);
begin
  DrawFrames;
end;

procedure TfrmCap.FormCreate(Sender: TObject);
begin
  with Canvas do begin
    Font.Name := 'Terminal';
    Font.Size := 8;
    Font.Color := clWhite;
    Pen.Color := clWhite;
    DoubleBuffered := True;
  end;
end;

function TfrmCap.GetLineHeight: Integer;
begin
  Result := Canvas.Font.Size;
end;

function TfrmCap.GetFrameXY(X, Y: Integer): TCaptureFrame;
begin
  // identify the frame by its position on the screen

  // Y = Line number
  Y := Y div LineHeight;

  // X = Char number
  X := (X div 6) + 1;

  Result := FCapture.Lines[Y].GetFrame(X);
end;

procedure TfrmCap.FormMouseDown(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Integer);
var
  Frame: TCaptureFrame;
begin
  if Assigned(FCapture) and (Button = mbLeft) then begin
    Frame := GetFrameXY(X, Y + sbMain.Position * LineHeight);

    if (ssShift in Shift) and Assigned(FSelection) then begin
      if Assigned(Frame) then
        FRangedSelection := Frame;
    end else begin
      FSelection := Frame;
      FRangedSelection := Frame;
    end;

    DrawFrames; // show selection
  end;
end;

procedure TfrmCap.FormMouseWheel(Sender: TObject; Shift: TShiftState;
  WheelDelta: Integer; MousePos: TPoint; var Handled: Boolean);
begin
  sbMain.Position := sbMain.Position + (WheelDelta div 40) * -1;
  DrawFrames;
end;

procedure TfrmCap.actExportExecute(Sender: TObject);
begin
  if dlgSave.Execute then begin
    if (not FileExists(dlgSave.Filename)) or (MessageDlg(SCFileExists, mtConfirmation, [mbYes, mbNo], 0) = mrYes) then begin
      FCapture.ExportFrames(dlgSave.Filename, TopSelection, BotSelection);
    end;
  end;
end;

procedure TfrmCap.actSelectUpdate(Sender: TObject);
begin
  TAction(Sender).Enabled := Assigned(FCapture) and SelectionActive;
end;

procedure TfrmCap.actFindExecute(Sender: TObject);
begin
  FindForm.ShowModal;
end;

procedure TfrmCap.actExportTextExecute(Sender: TObject);
begin
  if dlgSaveText.Execute then begin
    if (not FileExists(dlgSaveText.Filename)) or (MessageDlg(SCFileExists, mtConfirmation, [mbYes, mbNo], 0) = mrYes) then begin
      FCapture.ExportFrames(dlgSaveText.Filename, TopSelection, BotSelection, True);
    end;
  end;
end;

end.
