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
unit FormCapFind;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  StdCtrls;

type
  TfrmCapFind = class(TForm)
    tbFind: TEdit;
    Label1: TLabel;
    btnFind: TButton;
    btnCancel: TButton;
    rbFromStart: TRadioButton;
    rbFromSelection: TRadioButton;
    procedure btnFindClick(Sender: TObject);
    procedure btnCancelClick(Sender: TObject);
    procedure tbFindKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  frmCapFind: TfrmCapFind;

implementation

uses
  FormCap;

{$R *.DFM}

procedure TfrmCapFind.btnFindClick(Sender: TObject);
var
  FindType: TFindType;
begin
  if rbFromStart.Checked then begin
    FindType := ftFromStart;
  end else begin
    FindType := ftFromSelection;
  end;

  if not ((Owner as TfrmCap).FindNextFrame(tbFind.Text, FindType)) then begin
    MessageDlg('The search text you entered could not be found', mtInformation, [mbOK], 0);
  end;
end;

procedure TfrmCapFind.btnCancelClick(Sender: TObject);
begin
  Close;
end;

procedure TfrmCapFind.tbFindKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  if (Key = 13) then
    btnFindClick(btnFind)
  else if (Key = 27) then
    btnCancelClick(btnCancel);
end;

procedure TfrmCapFind.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  tbFind.Text := '';
end;

end.
