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
unit GUI;

// All references from backend modules to GUI forms must pass through this module

interface

uses
  Classes,
  Core,
  Dialogs,
  Script,
  Forms,
  FormSetup,
  FormAbout,
  FormLicense,
  FormMain,
  FormHistory,
  FormScript;

type
  TGUIFormType = (gfMain, gfSetup, gfAbout, gfLicense, gfHistory);
  TGUIFormClass = class of TForm;

  TModGUI = class(TTWXModule, ITWXGlobals)
  private
    FProgramDir: string;
    FDatabaseName: string;
    FStartupScripts: TStringList;
    FGUIForms: array[TGUIFormType] of TForm;
    FConnected: Boolean;
    FFirstLoad: Boolean;

    function GetConnected: Boolean;
    procedure SetConnected(Value: Boolean);
    function GUIFormFactory(GUIFormType: TGUIFormType): TForm;
    function GetFormEnabled(FormType: TGUIFormType): Boolean;
    procedure SetFormEnabled(FormType: TGUIFormType; Enabled: Boolean);
    procedure SetDatabaseName(const Value: string);
    function GetDatabaseName: String;
    procedure SetStartupScripts(const Value: TStringList);
    function GetStartupScripts: TStringList;
    procedure SetTrayHint(const Value: string);
    function GetRecording: Boolean;
    procedure SetRecording(Value: Boolean);
  protected
    { ITWXGlobals }
    function GetProgramDir: string;
    procedure SetProgramDir(const Value: string);

    property GUIForms[TGUIFormType: TGUIFormType]: TForm read GUIFormFactory;
  public
    procedure LoadTrayIcon(const Value: string);
    procedure AfterConstruction; override;
    procedure ShowForm(FormType: TGUIFormType);
    procedure AddToHistory(HistoryType: THistoryType; const Value: string);
    procedure AddScriptMenu(Script: TScript);
    procedure RemoveScriptMenu(Script: TScript);
    procedure StateValuesLoaded; override;

    property Connected: Boolean read GetConnected write SetConnected;
    property FormEnabled[FormType: TGUIFormType]: Boolean read GetFormEnabled write SetFormEnabled;
    property ProgramDir: string read GetProgramDir write SetProgramDir;
    property Recording: Boolean read GetRecording write SetRecording;
  published
    property DatabaseName: string read GetDatabaseName write SetDatabaseName;
    property StartupScripts: TStringList read GetStartupScripts write SetStartupScripts;
    property TrayHint: string write SetTrayHint;
    property FirstLoad: Boolean read FFirstLoad write FFirstLoad;
  end;

const
  TGUIForms: array[TGUIFormType] of TGUIFormClass = (TfrmMain, TfrmSetup, TfrmAbout,TfrmLicense, TfrmHistory);

implementation

function TModGUI.GUIFormFactory(GUIFormType: TGUIFormType): TForm;
begin
  if not Assigned(FGUIForms[GUIFormType]) then
    FGUIForms[GUIFormType] := TGUIForms[GUIFormType].Create(Self);

  Result := FGUIForms[GUIFormType];
end;

function TModGUI.GetProgramDir: string;
begin
  Result := FProgramDir;
end;

procedure TModGUI.SetProgramDir(const Value: string);
begin
  FProgramDir := Value;
end;

procedure TModGUI.AfterConstruction;
begin
  inherited;

  // set defaults
  FirstLoad := True;
end;

procedure TModGUI.ShowForm(FormType: TGUIFormType);
begin
  GUIForms[FormType].Show;
end;

procedure TModGUI.SetFormEnabled(FormType: TGUIFormType; Enabled: Boolean);
begin
  GUIForms[FormType].Enabled := Enabled;
end;

function TModGUI.GetFormEnabled(FormType: TGUIFormType): Boolean;
begin
  Result := GUIForms[FormType].Enabled;
end;

procedure TModGUI.SetDatabaseName(const Value : string);
begin
  FDatabaseName := Value;
  //TfrmMain(GUIForms[gfMain]).DatabaseName := Value;
end;

function TModGUI.GetDatabaseName: String;
begin
  Result := FDatabaseName;
end;

procedure TModGUI.SetStartupScripts(const Value : TStringList);
begin
  FStartupScripts := Value;
  //TfrmMain(GUIForms[gfMain]).DatabaseName := Value;
end;

function TModGUI.GetStartupScripts: TStringList;
begin
  Result := FStartupScripts;
end;

procedure TModGUI.SetTrayHint(const Value : string);
begin
  TfrmMain(GUIForms[gfMain]).TrayHint := Value;
  TfrmMain(GUIForms[gfMain]).Caption := DatabaseName;
end;

procedure TModGUI.LoadTrayIcon(const Value : string);
begin
  TfrmMain(GUIForms[gfMain]).LoadTrayIcon(Value);
end;


function TModGUI.GetRecording: Boolean;
begin
  Result := TfrmMain(GUIForms[gfMain]).miRecording.Checked;
end;

procedure TModGUI.SetRecording(Value: Boolean);
begin
  TfrmMain(GUIForms[gfMain]).miRecording.Checked := Value;
end;


function TModGUI.GetConnected: Boolean;
begin
  Result := FConnected;
end;

procedure TModGUI.SetConnected(Value: Boolean);
begin
  if (Value <> FConnected) then
  begin
    FConnected := Value;
  end;
end;

procedure TModGUI.AddToHistory(HistoryType: THistoryType; const Value: string);
begin
  // add this stuff to the history form
  TfrmHistory(GUIForms[gfHistory]).AddToHistory(HistoryType, Value);
end;

procedure TModGUI.AddScriptMenu(Script: TScript);
begin
  TfrmMain(GUIForms[gfMain]).AddScriptMenu(Script);
end;

procedure TModGUI.RemoveScriptMenu(Script: TScript);
begin
  TfrmMain(GUIForms[gfMain]).RemoveScriptMenu(Script);
end;

procedure TModGUI.StateValuesLoaded;
begin
  // show main form
  ShowForm(gfMain);

  if (FirstLoad) then
  begin
    // Give the user a welcome message
    MessageDlg('Welcome to TWX Proxy 2.06!  This helper is designed to work in' + endl +
               'conjunction with your favorite Tradewars Helper or Telnet' + endl +
               'Terminal. It does not provide a terminal window, so you should' + endl +
               'read the Getting Started section of the wiki before continuing' + endl +
               '(https://github.com/MicroBlaster/TWXProxy/wiki).' + endl + endl +
               'You will need to create a new database before connecting' + endl +
               'to a server.', mtInformation, [mbOk], 0);

    // MB - License is displayed and accested in the setup progrsm, no need to display it here.
    //ShowForm(gfLicense);

    ShowForm(gfSetup);
    FirstLoad := False;
  end;

end;

end.
