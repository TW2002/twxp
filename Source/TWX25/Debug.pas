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
unit Debug;

interface

uses
  Windows,
  Messages,
  SysUtils,
  Classes,
  Graphics,
  Controls,
  Forms,
  Dialogs,
  StdCtrls,
  Script;

type
  TfrmDebug = class(TForm)
    Label1: TLabel;
    cbScripts: TComboBox;
    lbTriggers: TListBox;
    Label2: TLabel;
    Label3: TLabel;
    Label4: TLabel;
    Label5: TLabel;
    procedure cbScriptsChange(Sender: TObject);
    procedure FormShow(Sender: TObject);
  private
    { Private declarations }
  public
  end;

var
  frmDebug: TfrmDebug;

implementation

{$R *.DFM}

function GetSpace(Count : Integer) : String;
var
  I : Integer;
  X : String;
begin
  if (Count < 1) then
  begin
    GetSpace := '';
    Exit;
  end;

  for I := 1 to Count do
    X := X + ' ';

  GetSpace := X;
end;

function GetTriggerTypeAlias(TriggerType : Integer) : String;
begin
{  if (TriggerType = TRIGGER_TEXT) then
    GetTriggerTypeAlias := 'TEXT'
  else if (TriggerType = TRIGGER_TEXTLINE) then
    GetTriggerTypeAlias := 'TEXTLINE'
  else if (TriggerType = TRIGGER_EVENT) then
    GetTriggerTypeAlias := 'EVENT'
  else if (TriggerType = TRIGGER_DELAY) then
    GetTriggerTypeAlias := 'DELAY'
  else}
    GetTriggerTypeAlias := 'UNKNOWN';
end;

procedure TfrmDebug.cbScriptsChange(Sender: TObject);
var
  I        : Integer;
  T        : TTrigger;
  S        : TScript;
  TrigType : String;
begin
  lbTriggers.Items.Clear;

  if (cbScripts.Items.Count = 0) then
    Exit;

  // show triggers in this script
  S := ScriptList.Items[cbScripts.ItemIndex];

  // don't show encrypted script triggers
  if (S.Encrypted) then
    Exit;

  if (S.WaitFor <> '') then
    lbTriggers.Items.Add('N/A               LINEAR   Line ' + IntToStr(S.LineNumber) + GetSpace(13 - Length(IntToStr(S.LineNumber))) + S.WaitFor);

  for I := 0 to S.TriggerList.Count - 1 do
  begin
    T := TTrigger(S.TriggerList.Items[I]^);
    TrigType := GetTriggerTypeAlias(T.TriggerType);
    lbTriggers.Items.Add(T.Name + GetSpace(18 - Length(T.Name)) + TrigType + GetSpace(9 - Length(TrigType)) + T.GotoLabel + GetSpace(18 - Length(T.GotoLabel)) + T.Value);
  end;
end;

procedure TfrmDebug.FormShow(Sender: TObject);
var
  I : Integer;
  S : TScript;
begin
  // update combo box
  cbScripts.Items.Clear;
  for I := 0 to ScriptList.Count - 1 do
  begin
    S := ScriptList.Items[I];
    cbScripts.Items.Add(S.GetName);
  end;

  if (cbScripts.Items.Count > 0) then
    cbScripts.ItemIndex := 0;

  cbScriptsChange(Sender);
end;

end.
