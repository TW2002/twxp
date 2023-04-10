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
unit FormScript;

interface

uses
  Forms, Graphics, Controls, Classes;

type
  // TScriptWindow: Small documentation window that can be created by scripts.
  TScriptWindow = class(TForm)
    procedure FormKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
    procedure FormKeyUp(Sender: TObject; var Key: Word; Shift: TShiftState);

  private
    FWindowName, FTextContent, FFontName: string;
    FFontSize, FPenWidth, FWindowScale: Integer;
    FForeGround, FBackground, FPenColor, FBrushColor: TColor;
    FFontStyle: TFontStyles;
    FBrushStyle: TBrushStyle;
    FAlignment, FMargin: string;
    FBackgroundImage: string;
    FTileImage, FStretchImaage: Boolean;

    procedure SetTextContent(Value : string);
  protected
    procedure Paint; override;
    //procedure KeyDown; override;
    //procedure FormKeyUp; override;

  public
    constructor Create(AWindowName, Title : string; SizeX, SizeY : Integer; OnTop, Scale : Boolean); reintroduce;
    procedure Position(Alignment, Margin : string );
    procedure Style(ForeGround, Background : string );
    procedure Font(FontName, FontStyle : string; FontSize: Integer);
    procedure Image(ImageName: string; TileImage, StretchImaage: Boolean);
    procedure Draw(Shape: string; Params: array of Integer);
    procedure Append(Text: string);
    procedure Clear ();

    property WindowName : string read FWindowName write FWindowName;
    property TextContent : string read FTextContent write SetTextContent;
  end;

implementation

uses
  SysUtils, Utility, Types, inifiles;

function StrToFontStyle (S: string) : tFontStyles;
const
  Names: Array[0..3] of string = ('BOLD', 'ITALIC', 'UNDERLINE', 'STRIKEOUT');
  //Styles: Array[0..3] of tFontStyle = (fsBold, fsItalic, fsUnderline, fsStrikeout);
var
  I: Integer;
begin
  result := [];

  for I := 0 to 3 do
  begin
    if (pos(Names[I], uppercase(S)) > 0) then
    //if (uppercase(S) = Names[I]) then
      result := result + [TFontStyle(I)];
  end;
end;

function StringToBrushStyle (S: string) : TBrushStyle;
const
  Names: Array[0..7] of string = ('SOLID', 'CLEAR', 'HORIZONTAL', 'VERTICAL', 'FDIAGONAL', 'BDIAGONAL', 'CROSS', 'DiagCross');
var
  I: Integer;
begin

  for I := 0 to 3 do
    if (pos(Names[I], uppercase(S)) > 0) then
      result := TBrushStyle(I);

end;

procedure TScriptWindow.FormKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
begin
  //if Key = VK_F1 then
  //begin

  // This is not firing. I do not think the canvas can receivee focus.
    FBackground := clBlack;
    Paint;
  //end;
end;

procedure TScriptWindow.FormKeyUp(Sender: TObject; var Key: Word; Shift: TShiftState);
begin

end;

constructor TScriptWindow.Create(AWindowName, Title : string; SizeX, SizeY : Integer; OnTop, Scale : Boolean);
var
  IniFile: TIniFile;
  S: string;
//  KBHook: HHook;
//   cx, cy : integer;
begin
  inherited CreateNew(nil);

  KeyPreview := True;


  //KBHook := SetWindowsHookEx(WH_KEYBOARD,
//            {callback >} @KeyboardHookProc,
//                           HInstance,
//                           GetCurrentThreadId()) ;

  WindowName := AWindowName;
  Caption := Title;
  BorderStyle := bsSizeable;
  Color := clRed;

  IniFile := TIniFile.Create(GetCurrentDir + '\twxp.cfg');
  try
    FForeGround := StringToColor(IniFile.ReadString('Window Style', 'Foreground', 'clBlack'));
    FBackground := StringToColor(IniFile.ReadString('Window Style', 'Background', 'clWhite'));
    FFontName   := IniFile.ReadString('Window Style', 'FontName', 'Lucida Console');
    FFontStyle  := StrToFontStyle(IniFile.ReadString('Window Style', 'FontStyle', 'fsBold'));
    FFontSize   := StrToInt(IniFile.ReadString('Window Style', 'FontSize', '9'));

    if Scale then
      FWindowScale := StrToInt(IniFile.ReadString('Window Style', 'Scale', '100'))
    else
      FWindowScale := 100;

    FPenWidth   := StringToColor(IniFile.ReadString('Window Style', 'PenWidth', '3'));
    FPenColor   := StringToColor(IniFile.ReadString('Window Style', 'PenColor', 'clBlack'));
    FBrushStyle := StringToBrushStyle(IniFile.ReadString('Window Style', 'BrushStyle', 'bsSolid'));
    FBrushColor := StringToColor(IniFile.ReadString('Window Style', 'BrushColor', 'clWhite'));

    FAlignment  := IniFile.ReadString('Window Style', 'Alignment', '');;
    FMargin     := IniFile.ReadString('Window Style', 'Margin', '');
  finally
  end;
    IniFile.Free;

  Width := (SizeX * FWindowScale) div 100;
  Height := (SizeY * FWindowScale) div 100;

  DoubleBuffered := TRUE;
  FormStyle := fsStayOnTop;
  Show();

  // mb - this was not woeking, because you have to show the window first.
  //Left := (Screen.Width div 2) - (Width div 2);
  //Top := (Screen.Height div 2) - (Height div 2);
  Position (FAlignment, FMargin);
  if (OnTop <> true) then
    FormStyle := fsNormal;
end;

procedure TScriptWindow.Position(Alignment, Margin : string);
var
  W, H : Integer;
  R : TRect ;
  A : string;
  M : TStringList;
  MLeft, MTop, MRight, MBottom: Integer;
begin
  //R := GetWorkareaRect();
  Self.Monitor;
  R := Monitor.WorkAreaRect;
  W := (R.Right - R.Left);
  H := (R.Bottom - R.Top);

  A := uppercase(Alignment);
  if (Margin = '') or (Margin = '0') then
    Margin := FMargin;


  M := TStringList.Create;
  Split(Margin, M, ' ');

  if (M.Count = 1) then
  begin
    MLeft := StrToInt(M[0]);
    MTop := StrToInt(M[0]);
    MRight := StrToInt(M[0]);
    MBottom := StrToInt(M[0])
  end
  else if (M.Count = 4) then
  begin
    MLeft := StrToInt(M[0]);
    MTop := StrToInt(M[1]);
    MRight := StrToInt(M[2]);
    MBottom := StrToInt(M[3])
  end
  else
  begin
    MLeft := 0;
    MTop := 0;
    MRight := 0;
    MBottom := 0
  end;


  if (pos('LEFT', A) > 0) then
    Left := Mleft
  else if (pos('RIGHT', A) > 0) then
    Left := (W - MRight) - Width
  else
    Left := (W div 2) - (Width div 2);

  if (pos('TOP', A) > 0) then
    Top := MTop
  else if (pos('BOT', A) > 0) then
    Top := (H - MBottom) - Height
  else
    Top := (H div 2) - (Height div 2);

end;

procedure TScriptWindow.Style(ForeGround, Background: string);
begin

  FForeGround := StringToColor(ForeGround);
  if Background <> '' then
    FBackground := StringToColor(Background);

  Paint;
end;

procedure TScriptWindow.Font(FontName, FontStyle : string; FontSize: Integer);
begin
  if FontName <> '' then
    FFontName := FontName;
  if FontSize <> 0 then
    FFontSize := FontSize;
  if FontStyle <> '' then
    FFontStyle  := StrToFontStyle(FontStyle);

  Paint;
end;

procedure TScriptWindow.Image(ImageName: string; TileImage, StretchImaage: Boolean);
begin
//TODO
//ImageName: string; TileImage, StretchImaage: Boolean
//FBackgroundImage
end;


procedure TScriptWindow.Draw (Shape: string; Params: array of Integer);
begin
//DrawSTYLE PEN COLOR WIDTH
// TODO Text, Line, Rect, FRect, Ellipse, Fill
end;

procedure TScriptWindow.Append (Text: string);
begin
  Text := StringReplace(Text, #10, '', [rfReplaceAll]);
  FTextContent := FTextContent + Text;
  Paint;
end;

procedure TScriptWindow.Clear ();
begin
  FTextContent := '';
  Paint;
end;

procedure TScriptWindow.SetTextContent(Value : string);
begin
  FTextContent := StringReplace(Value, #10, '', [rfReplaceAll]);
  FTextContent := Value;
  Paint;
end;

procedure TScriptWindow.Paint;
//const
  //Colors: array[boolean] of TColor = (clMoneyGreen, clSkyBlue);
  //Colors: array[Integer] of TColor = ($000000, $000080), $008000, $800000);
var
  I, Line, Run, X , Y: Integer;
  Lines, Runs: TStringList;
  S, Code: string;
  Color: TColor;
begin
  inherited;

  Lines := TStringList.Create;
  Runs := TStringList.Create;

  with Canvas do
  begin

    Font.Color := FForeGround;
    Font.Name := FFontName;
    Font.Size := FFontSize;
    Font.Style := FFontStyle;

    Pen.Width := FPenWidth;
    Pen.Color := FPenColor;
    Brush.Style := FBrushStyle;
    Brush.Color := FBackground;;
    FillRect(Rect(0, 0, Width, Height));

    try

      S := StringReplace(FTextContent, #13, ' ' + #13, [rfReplaceAll]);
      ExtractStrings([#13], [], PChar(S), Lines);
      for Line := 0 to Lines.Count - 1 do
      Begin
        x := 6;
        y := 6 + Line * TextHeight('A');

        //S := StringReplace(Lines[Line], #10 + '~', '~', [rfReplaceAll]);
        S := '!' + Lines[Line];
        Runs.Clear;
        ExtractStrings(['~'], [], PChar(S), Runs);
        for Run := 0 to Runs.Count - 1 do
        Begin
          //if (pos(Runs[Run], '~') = 0) then
          //begin
          code := copy(Runs[Run],1 ,1);

          if (Code = 'a') then
            Font.Color := $000000  // Black
          else if (Code = 'b') then
            Font.Color := $0000BB // Red
          else if (Code = 'c') then
            Font.Color := $008000  // Green
          else if (Code = 'd') then
            Font.Color := $00BBBB  // Yellow
          else if (Code = 'e') then
            Font.Color := $BB4040  // Blue
          else if (Code = 'f') then
            Font.Color := $BB00BB  // Magenta
          else if (Code = 'g') then
            Font.Color := $BBBB00  // Cyan
          else if (Code = 'h') then
            Font.Color := $A0A0A0  // Dark White (aka Light Grey)
          else if (Code = 'A') then
            Font.Color := $606060  // Light Black (aka Dark Grey)
          else if (Code = 'B') then
            Font.Color := $4040FF  // Red
          else if (Code = 'C') then
            Font.Color := $00C000  // Green
          else if (Code = 'D') then
            Font.Color := $00FFFF  // Yellow
          else if (Code = 'E') then
            Font.Color := $FF4040  // Blue
          else if (Code = 'F') then
            Font.Color := $FF00FF  // Magenta
          else if (Code = 'G') then
            Font.Color := $FFFF00  // Cyan
          else if (Code = 'H') then
            Font.Color := $FFFFFF  // White
          else if (Code = 'i') then
            Brush.Color := $000000  // Black BackGround
          else if (Code = 'j') then
            Brush.Color := $0000BB // Red BackGround
          else if (Code = 'k') then
            Brush.Color := $008000  // Green BackGround
          else if (Code = 'l') then
            Brush.Color := $00BBBB  // Yellow BackGround
          else if (Code = 'm') then
            Brush.Color := $BB4040  // Blue BackGround
          else if (Code = 'n') then
            Brush.Color := $BB00BB  // Magenta BackGround
          else if (Code = 'o') then
            Brush.Color := $BBBB00  // Cyan BackGround
          else if (Code = 'p') then
            Brush.Color := $A0A0A0  // White BackGround
          else if (Code = '0') then
          Begin
            // reset colors
            Font.Color := FForeGround;
            Brush.Color := FBackground;;
          End;

          S := copy(Runs[Run], 2);
          if (s <> '') and (S <> ' ') then
          TextOut(x, y, S);
          x := x + TextWidth(S);

        end;
      End;

    finally
      Lines.Free;
      Runs.Free;
    end;
  end;

// MB - This quit working, then I  wrote the above and it started working again
//  for I := 1 to Length(FTextContent) do
//  begin
//    if (FTextContent[I] = #13) then
//    begin
//      Canvas.TextOut(0, Line * (Canvas.Font.Size + 6), Copy(FTextContent, Column, I - Column));
//      Inc(Line);
//       Column := I + 1;
//    end;
//  end;
end;

end.
