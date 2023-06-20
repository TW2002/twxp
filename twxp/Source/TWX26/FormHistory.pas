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
unit FormHistory;

interface

uses
  Core,
  Windows,
  Messages,
  SysUtils,
  Classes,
  Graphics,
  Controls,
  Forms,
  Dialogs,
  StdCtrls,
  ExtCtrls,
  Menus,
  ComCtrls;

type
  TfrmHistory = class(TForm)
    memMsgHistory: TMemo;
    pnlHistory: TPanel;
    rbMessages: TRadioButton;
    btnClose: TButton;
    mnuHistory: TMainMenu;
    View1: TMenuItem;
    miFont: TMenuItem;
    fntHistory: TFontDialog;
    clrHistory: TColorDialog;
    miColour: TMenuItem;
    rbFighters: TRadioButton;
    rbComputer: TRadioButton;
    memFigHistory: TMemo;
    memComHistory: TRichEdit;
    btnClear: TButton;
    procedure FormShow(Sender: TObject);
    procedure btnCloseClick(Sender: TObject);
    procedure FormResize(Sender: TObject);
    procedure miFontClick(Sender: TObject);
    procedure miColourClick(Sender: TObject);
    procedure rbClick(Sender: TObject);
    procedure btnClearClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
    procedure AddToHistory(HistoryType: THistoryType; const Value: string);
  end;

implementation

{$R *.DFM}

procedure TfrmHistory.FormShow(Sender: TObject);
begin
  // centre on screen
  Left := (Screen.Width DIV 2) - (Width DIV 2);
  Top := (Screen.Height DIV 2) - (Height DIV 2);

  clrHistory.Color := memMsgHistory.Color;
  fntHistory.Font := memMsgHistory.Font;
end;

procedure TfrmHistory.btnCloseClick(Sender: TObject);
begin
  Close;
end;

procedure TfrmHistory.FormResize(Sender: TObject);
begin
  btnClose.Left := Width - btnClose.Width - 11;
  btnClear.Left := btnClose.Left - btnClear.Width - 2;
end;

procedure TfrmHistory.miFontClick(Sender: TObject);
begin
  if (fntHistory.Execute) then
  begin
    memFigHistory.Font := fntHistory.Font;
    memComHistory.Font := fntHistory.Font;
    memMsgHistory.Font := fntHistory.Font;
  end;
end;

procedure TfrmHistory.miColourClick(Sender: TObject);
begin
  if (clrHistory.Execute) then
  begin
    memFigHistory.Color := clrHistory.Color;
    memComHistory.Color := clrHistory.Color;
    memMsgHistory.Color := clrHistory.Color;
  end;
end;

procedure TfrmHistory.rbClick(Sender: TObject);
begin
  if (rbMessages.Checked) then
  begin
    memMsgHistory.Visible := TRUE;
    memComHistory.Visible := FALSE;
    memFigHistory.Visible := FALSE;
  end
  else if (rbFighters.Checked) then
  begin
    memMsgHistory.Visible := FALSE;
    memComHistory.Visible := FALSE;
    memFigHistory.Visible := TRUE;
  end
  else if (rbComputer.Checked) then
  begin
    memMsgHistory.Visible := FALSE;
    memComHistory.Visible := TRUE;
    memFigHistory.Visible := FALSE;
  end;
end;

procedure TfrmHistory.btnClearClick(Sender: TObject);
var
  ConfirmMessage : string;
begin
  if (rbMessages.Checked) then
    ConfirmMessage := 'message'
  else if (rbFighters.Checked) then
    ConfirmMessage := 'fighter'
  else if (rbComputer.Checked) then
    ConfirmMessage := 'computer';

  if (MessageDlg('Clear ' + ConfirmMessage + ' history?', mtConfirmation, [mbYes, mbNo], 0) = mrYes) then
  begin
    if (rbMessages.Checked) then
      memMsgHistory.Clear
    else if (rbFighters.Checked) then
      memFigHistory.Clear
    else if (rbComputer.Checked) then
      memComHistory.Clear;
  end;
end;

procedure TfrmHistory.AddToHistory(HistoryType: THistoryType; const Value: string);
var
  Strings: TStrings;
begin
  case HistoryType of
    htFighter  : Strings := memFigHistory.Lines;
    htComputer : Strings := memComHistory.Lines;
    htMsg      : Strings := memMsgHistory.Lines;
  else
    Exit; // Shouldn't happen.
  end;

  if (Strings.Count >= 65533) then
    Strings.Clear;

  Strings.Add(Value);
end;

end.
