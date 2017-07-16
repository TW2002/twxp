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
unit ScriptWindow;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs, Script, Utility;

type
  TfrmScriptWindow = class(TForm)
  public
    Script    : TScript;
    Name,
    Contents  : String;

    procedure onFormPaint(Sender : TObject);
  end;

var
  frmScriptWindow: TfrmScriptWindow;

implementation

{$R *.DFM}

procedure TfrmScriptWindow.onFormPaint(Sender : TObject);
var
  Line,
  I,
  X    : Integer;
begin
  Canvas.Brush.Style := bsSolid;
  Canvas.Brush.Color := clWhite;
  Canvas.FillRect(Rect(0, 0, Width, Height));
  Line := 0;
  X := 1;
  StripChar(Contents, #10);

  for I := 1 to Length(Contents) do
  begin
    if (Contents[I] = #13) then
    begin
      Canvas.TextOut(0, Line * (Canvas.Font.Size + 6), Copy(Contents, X, I - X));
      Inc(Line);
      X := I + 1;
    end;
  end;
end;

end.
