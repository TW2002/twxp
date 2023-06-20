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
unit FormUpgrade;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  StdCtrls, ExtCtrls, Auth;

type
  TfrmUpgrade = class(TForm)
    memHint2: TMemo;
    pnlUpgrade: TPanel;
    lbUser: TLabel;
    lbKey: TLabel;
    tbUser: TEdit;
    tbKey: TEdit;
    btnUpgrade: TButton;
    btnCancel: TButton;
    procedure FormCreate(Sender: TObject);
    procedure btnCancelClick(Sender: TObject);
    procedure btnUpgradeClick(Sender: TObject);
    procedure FormHide(Sender: TObject);
    procedure FormShow(Sender: TObject);
  private
    { Private declarations }
    procedure UpgradeDone(Result : TUpgradeResult; NewUser, NewKey : string);
  public
    { Public declarations }
  end;

implementation

uses
  GUI,
  Global;

{$R *.DFM}

procedure TfrmUpgrade.FormCreate(Sender: TObject);
begin
  // centre on screen
  Left := (Screen.Width div 2) - (Width div 2);
  Top := (Screen.Height div 2) - (Height div 2);
end;

procedure TfrmUpgrade.btnCancelClick(Sender: TObject);
begin
  Close;
end;

procedure TfrmUpgrade.btnUpgradeClick(Sender: TObject);
begin
  // begin key upgrade process
  Enabled := FALSE;
  tbUser.Visible := FALSE;
  tbKey.Visible := FALSE;
  btnUpgrade.Visible := FALSE;
  lbUser.Visible := FALSE;
  lbKey.Visible := FALSE;
  pnlUpgrade.Caption := 'Now upgrading registration ...';
  TWXAuth.UpgradeKey(UpgradeDone, tbUser.Text, tbKey.Text);
end;

procedure TfrmUpgrade.UpgradeDone(Result : TUpgradeResult; NewUser, NewKey : string);
begin
  tbUser.Visible := TRUE;
  tbKey.Visible := TRUE;
  lbUser.Visible := TRUE;
  lbKey.Visible := TRUE;
  btnUpgrade.Visible := TRUE;
  pnlUpgrade.Caption := '';
  Enabled := TRUE;

  if (Result = urSuccess) then
  begin
    Close;
    MessageDlg('Your registration has been successfully upgraded.', mtInformation, [mbOK], 0);
    (Owner as TModGUI).ApplyNewReg(NewUser, NewKey);
    MessageDlg('Your new registration has been entered for you.  It is VITAL that you write these details down on PAPER immediately.', mtWarning, [mbOK], 0);
  end
  else if (Result = urInvalid) then
  begin
    MessageDlg('Registration upgrade failure; the user and key you entered were not identified.',
      mtError, [mbOK], 0);
  end
  else if (Result = urFailed) then
  begin
    MessageDlg('Registration upgrade failure; TWX Proxy was unable to connect to the registration server.  Check your internet connection, then try again.',
      mtError, [mbOK], 0);
  end
  else if (Result = urUsed) then
  begin
    MessageDlg(
      'Registration upgrade failure; the user and key you entered have already been used in a previous registration upgrade.',
      mtError, [mbOK], 0);
  end
  else
    MessageDlg(
      'Registration upgrade failure; the response from the registration server was not recognised.',
      mtError, [mbOK], 0);
end;

procedure TfrmUpgrade.FormHide(Sender: TObject);
begin
  (Owner as TModGUI).FormEnabled[gfSetup] := True;
end;

procedure TfrmUpgrade.FormShow(Sender: TObject);
begin
  (Owner as TModGUI).FormEnabled[gfSetup] := False;
end;

end.
