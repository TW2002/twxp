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
  Forms;

type
  // TScriptWindow: Small documentation window that can be created by scripts.
  TScriptWindow = class(TForm)
  private
    FWindowName,
    FTextContent : string;

    procedure SetTextContent(Value : string);
  protected
    procedure Paint; override;
  public
    constructor Create(AWindowName, Title : string; SizeX, SizeY : Integer; OnTop : Boolean); reintroduce;

    property WindowName : string read FWindowName write FWindowName;
    property TextContent : string read FTextContent write SetTextContent;
  end;

implementation

uses
  SysUtils,
  Graphics,
  Classes;

constructor TScriptWindow.Create(AWindowName, Title : string; SizeX, SizeY : Integer; OnTop : Boolean);
begin
  inherited CreateNew(nil);

  Caption := Title;
  Width := SizeX;
  Height := SizeY;
  Left := (Screen.Width div 2) - (Width div 2);
  Top := (Screen.Height div 2) - (Height div 2);
  BorderStyle := bsSizeable;
  Color := clWhite;
  Canvas.Brush.Color := clWhite;
  Canvas.Pen.Color := clBlack;
  Canvas.Font.Color := clBlack;
  Canvas.Font.Size := 9;
  Canvas.Font.Name := 'Lucida Console';
  Canvas.Font.Style := [fsBold];
  DoubleBuffered := TRUE;

  if (OnTop) then
    FormStyle := fsStayOnTop;

  WindowName := AWindowName;
end;

procedure TScriptWindow.SetTextContent(Value : string);
begin
  FTextContent := StringReplace(Value, #10, '', [rfReplaceAll]);
  Paint;
end;

procedure TScriptWindow.Paint;
var
  Line,
  I,
  X    : Integer;
begin
  inherited;

  Canvas.Brush.Style := bsSolid;
  Canvas.Brush.Color := clWhite;
  Canvas.FillRect(Rect(0, 0, Width, Height));
  Line := 0;
  X := 1;

  for I := 1 to Length(FTextContent) do
  begin
    if (FTextContent[I] = #13) then
    begin
      Canvas.TextOut(0, Line * (Canvas.Font.Size + 6), Copy(FTextContent, X, I - X));
      Inc(Line);
      X := I + 1;
    end;
  end;
end;

end.
