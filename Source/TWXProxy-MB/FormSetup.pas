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
unit FormSetup;

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
  ComCtrls,
  ExtCtrls,
  Database;

type
  TDatabaseLink = record
    DataHeader : TDataHeader;
    New,
    Modified   : Boolean;
    Filename   : string;
  end;

  TfrmSetup = class(TForm)
    PageControl: TPageControl;
    tabServer: TTabSheet;
    btnOKMain: TButton;
    tabProgram: TTabSheet;
    cbAcceptExternal: TCheckBox;
    cbBroadcast: TCheckBox;
    Label2: TLabel;
    tbListenPort: TEdit;
    Label11: TLabel;
    tbMenuKey: TEdit;
    Panel1: TPanel;
    Label12: TLabel;
    Label3: TLabel;
    Label1: TLabel;
    tbHost: TEdit;
    tbPort: TEdit;
    tbSectors: TEdit;
    cbGames: TComboBox;
    btnAdd: TButton;
    btnDelete: TButton;
    btnEdit: TButton;
    Label13: TLabel;
    tbLoginScript: TEdit;
    cbUseLogin: TCheckBox;
    tbLoginName: TEdit;
    Label14: TLabel;
    tbPassword: TEdit;
    Label15: TLabel;
    tbGame: TEdit;
    Label16: TLabel;
    Label17: TLabel;
    tbDescription: TEdit;
    btnSave: TButton;
    btnCancel: TButton;
    cbReconnect: TCheckBox;
    tabUser: TTabSheet;
    Label18: TLabel;
    memHint2: TMemo;
    Label19: TLabel;
    cbCache: TCheckBox;
    tbBubbleSize: TEdit;
    Label10: TLabel;
    tabAutoRun: TTabSheet;
    lbAutoRun: TListBox;
    memHint3: TMemo;
    btnAddAutoRun: TButton;
    btnRemoveAutoRun: TButton;
    OpenDialog: TOpenDialog;
    btnCancelMain: TButton;
    cbLocalEcho: TCheckBox;
    Label4: TLabel;
    Label5: TLabel;
    btnUpgrade: TButton;
    tmrReg: TTimer;
    tabProxy: TTabSheet;
    Label6: TLabel;
    Label7: TLabel;
    Label8: TLabel;
    tabLogging: TTabSheet;
    cbLog: TCheckBox;
    cbLogANSI: TCheckBox;
    cbLogBinary: TCheckBox;
    cbNotifyLogDelay: TCheckBox;
    Label9: TLabel;
    tbShortenDelay: TEdit;
    Label20: TLabel;
    procedure FormHide(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure btnOKMainClick(Sender: TObject);
    procedure tbMenuKeyChange(Sender: TObject);
    procedure cbGamesChange(Sender: TObject);
    procedure btnAddClick(Sender: TObject);
    procedure btnSaveClick(Sender: TObject);
    procedure btnDeleteClick(Sender: TObject);
    procedure cbUseLoginClick(Sender: TObject);
    procedure btnEditClick(Sender: TObject);
    procedure btnCancelClick(Sender: TObject);

    procedure btnAddAutoRunClick(Sender: TObject);
    procedure btnRemoveAutoRunClick(Sender: TObject);
    procedure btnCancelMainClick(Sender: TObject);
    procedure PageControlChanging(Sender: TObject;
      var AllowChange: Boolean);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure tmrRegTimer(Sender: TObject);
    procedure tbUserChange(Sender: TObject);


  private
    DataLinkList  : TList;
    FAuthenticate : Boolean;
    FProgramDir   : string;

    procedure UpdateGameList(SelectName : string);
  public
    procedure AfterConstruction; override;

  end;

implementation

{$R *.DFM}

uses
  Global,
  Utility,
  GUI,
  Ansi;

var
  Edit : Boolean;

procedure TfrmSetup.AfterConstruction;
begin
  inherited;

  FProgramDir := (Owner as TModGUI).ProgramDir;
  btnUpgrade.Visible := false;
end;

procedure TfrmSetup.FormShow(Sender: TObject);
begin
  // centre on screen
  Left := (Screen.Width DIV 2) - (Width DIV 2);
  Height := (Screen.Height DIV 2) - (Height DIV 2);

  tbLoginScript.Enabled := FALSE;
  tbLoginName.Enabled := FALSE;
  tbPassword.Enabled := FALSE;
  tbGame.Enabled := FALSE;
  FAuthenticate := FALSE;
  // EP - Temp Win7 Dialog workaround
  if Win32MajorVersion > 5 then
    OpenDialog.Options := [ofOldStyleDialog];

  // populate form from system setup
  tbBubbleSize.Text := IntToStr(TWXBubble.MaxBubbleSize);
  cbCache.Checked := TWXDatabase.UseCache;
  tbListenPort.Text := IntToStr(TWXServer.ListenPort);
  cbReconnect.Checked := TWXClient.Reconnect;
  cbLog.Checked := TWXLog.LogData;
  cbLogANSI.Checked := TWXLog.LogANSI;
  cbLogBinary.Checked := TWXLog.BinaryLogs;
  cbNotifyLogDelay.Checked := TWXLog.NotifyPlayCuts;
  tbShortenDelay.Text := IntToStr(TWXLog.MaxPlayDelay div 1000);
  cbBroadCast.Checked := TWXServer.BroadCastMsgs;
  cbLocalEcho.Checked := TWXServer.LocalEcho;
  tbMenuKey.Text := TWXExtractor.MenuKey;

  // load up auto run scripts
  lbAutoRun.Items.Clear;
  lbAutoRun.Items.Assign(TWXInterpreter.AutoRun);

  // build list of data headers from databases in data\ folder
  DataLinkList := TList.Create;

  UpdateGameList(TWXDatabase.DatabaseName);
end;

procedure TfrmSetup.FormHide(Sender: TObject);
begin
  while (DataLinkList.Count > 0) do
  begin
    TDatabaseLink(DataLinkList[0]^).Filename := '';
    FreeMem(DataLinkList[0]);
    DataLinkList.Delete(0);
  end;

  DataLinkList.Free;
end;

procedure TfrmSetup.UpdateGameList(SelectName : string);
var
  Found    : Integer;
  S        : TSearchRec;
  Link     : ^TDatabaseLink;
  F        : File;
  Errored,
  FileOpen : Boolean;
begin
  // free up old database headers
  while (DataLinkList.Count > 0) do
  begin
    FreeMem(DataLinkList[0]);
    DataLinkList.Delete(0);
  end;

  // load database headers into memory
  SelectName := UpperCase(SelectName);
  cbGames.Clear;
  Found := -1;

  SetCurrentDir(FProgramDir);

  if (FindFirst('data\*.xdb', faAnyfile, S) = 0) then
  begin
    repeat
      Link := AllocMem(SizeOf(TDatabaseLink));
      Link^.Modified := FALSE;
      Link^.New := FALSE;
      Link^.Filename := 'data\' + S.Name;
      Errored := FALSE;

      FileOpen := FALSE;
      
      try
        AssignFile(F, Link^.Filename);
        Reset(F, 1);
        FileOpen := TRUE;
        BlockRead(F, Link^.DataHeader, SizeOf(TDataHeader));
      except
        Errored := TRUE;
      end;

      if (FileOpen) then
        CloseFile(F);

      if (Errored) or (Link^.DataHeader.ProgramName <> 'TWX DATABASE') or (Link^.DataHeader.Version <> DATABASE_VERSION) then
        FreeMem(Link)
      else
      begin
        if (UpperCase(Link^.Filename) = SelectName) then
          Found := cbGames.Items.Add(StripFileExtension(S.Name))
        else
          cbGames.Items.Append(StripFileExtension(S.Name));

        DataLinkList.Add(Link);
      end;
    until (FindNext(S) <> 0);

    FindClose(S);

    cbGames.ItemIndex := Found;
  end;

  cbGames.OnChange(Self);
end;

procedure TfrmSetup.btnOKMainClick(Sender: TObject);
var
  I         : Integer;
  F         : File;
  FileOpen  : Boolean;
begin
  // validate and save setup from form into programsetup

  if (tmrReg.Enabled) then
  begin
    MessageDlg('You must write your registration down first!', mtWarning, [mbOK], 0);
    Exit;
  end;

  // click cancel if its there
  if (btnCancel.Enabled) then
    btnCancelClick(Sender);

  // write database headers back to file (if modified)
  if (DataLinkList.Count > 0) then
    for I := 0 to DataLinkList.Count - 1 do
      if (TDatabaseLink(DataLinkList[I]^).Modified) then
      begin
        FileOpen := FALSE;

        try
          AssignFile(F, TDatabaseLink(DataLinkList[I]^).Filename);
          Reset(F, 1);
          FileOpen := TRUE;
          BlockWrite(F, TDatabaseLink(DataLinkList[I]^).DataHeader, SizeOf(TDataHeader));
        except
          MessageDlg('An error occured while trying to update the database '''
            + TDatabaseLink(DataLinkList[I]^).Filename + ''', no changes were made.', mtError,
            [mbOk], 0);
        end;

        if (FileOpen) then
          CloseFile(F);

        TWXDatabase.CloseDatabase;
      end;

  // copy form settings into program setup
  TWXBubble.MaxBubbleSize := StrToIntSafe(tbBubbleSize.Text);

  if (Length(tbMenuKey.Text) = 0) then
    TWXExtractor.MenuKey := ' '
  else
    TWXExtractor.MenuKey := tbMenuKey.Text[1];

  TWXDatabase.UseCache := cbCache.Checked;

  if (cbGames.ItemIndex = -1) then
    TWXDatabase.CloseDatabase // no database selected
  else
    TWXDatabase.DatabaseName := TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).Filename;


  TWXInterpreter.AutoRun.Assign(lbAutoRun.Items);

  TWXLog.LogANSI := cbLogANSI.Checked and cbLog.Checked;
  TWXLog.BinaryLogs := cbLogBinary.Checked and cbLog.Checked;
  TWXLog.LogData := cbLog.Checked;
  TWXLog.NotifyPlayCuts := cbNotifyLogDelay.Checked;

  try
    TWXLog.MaxPlayDelay := StrToInt(tbShortenDelay.Text) * 1000;
  except
    TWXLog.MaxPlayDelay := 10;
  end;

  TWXServer.ListenPort := StrToIntSafe(tbListenPort.Text);
  TWXServer.Activate;
  TWXServer.AcceptExternal := cbAcceptExternal.Checked;
  TWXServer.BroadCastMsgs := cbBroadCast.Checked;
  TWXServer.LocalEcho := cbLocalEcho.Checked;
  TWXClient.Reconnect := cbReconnect.Checked;

  // setup has changed, so update terminal menu
  TWXMenu.ApplySetup;

  Close;
end;

procedure TfrmSetup.btnCancelMainClick(Sender: TObject);
begin
  Close;
end;

procedure TfrmSetup.tbMenuKeyChange(Sender: TObject);
begin
  if (Length(tbMenuKey.Text) > 1) then
    tbMenuKey.Text := tbMenuKey.Text[1];
end;

procedure TfrmSetup.cbGamesChange(Sender: TObject);
var
  Head : PDataHeader;
begin
  if (cbGames.ItemIndex < 0) then
    Exit;

  Head := @(TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).DataHeader);

  if (cbGames.ItemIndex > -1) then
  begin
    tbDescription.Text := cbGames.Text;
    tbSectors.Text := IntToStr(Head^.Sectors);
    tbHost.Text := Head^.Address;
    tbPort.Text := IntToStr(Head^.Port);
    cbUseLogin.Checked := Head^.UseLogin;
    tbLoginScript.Text := Head^.LoginScript;
    tbLoginName.Text := Head^.LoginName;
    tbPassword.Text := Head^.Password;
    tbGame.Text := Head^.Game;
  end
  else
  begin
    tbDescription.Text := '';
    tbHost.Text := '';
    tbPort.Text := '';
    tbSectors.Text := '';
    cbUseLogin.Checked := FALSE;
    tbLoginScript.Text := '';
    tbLoginName.Text := '';
    tbPassword.Text := '';
    tbGame.Text := '';
  end;
end;

procedure TfrmSetup.btnSaveClick(Sender: TObject);
var
  Error,
  S        : string;
  Focus    : TWinControl;
  Port,
  Sectors  : Word;
  I        : Integer;
  Head     : PDataHeader;
  DoCreate : Boolean;
begin
  // verify values
  S := tbDescription.Text;
  StripChar(S, ';');
  StripChar(S, ':');
  StripChar(S, '?');
  tbDescription.Text := S;
  S := tbGame.Text;
  StripChar(S, ' ');

  if (Length(S) > 0) then
    tbGame.Text := S[1]
  else
    tbGame.Text := '';

  Error := '';
  Focus := Self;

  if (tbDescription.Text = '') then
  begin
    Error := 'You must enter a valid name';
    Focus := tbDescription;
  end
  else if (tbHost.Text = '') then
  begin
    Error := 'You must enter a valid host';
    Focus := tbHost;
  end;

  Val(tbPort.Text, Port, I);
  if (I <> 0) then
  begin
    Error := 'You must enter a valid port number';
    Focus := tbPort;
  end;

  Val(tbSectors.Text, Sectors, I);
  if (I <> 0) then
  begin
    Error := 'You must enter a valid number of sectors';
    Focus := tbSectors;
  end;

  // see if this name is in use
  if not (Edit) then
    for I := 0 to cbGames.Items.Count - 1 do
      if (UpperCase(cbGames.Items.Strings[I]) = UpperCase(tbDescription.Text)) then
      begin
        Error := 'This name is already in use';
        Focus := tbDescription;
      end;

  if (Error <> '') then
  begin
    MessageDlg(Error, mtError, [mbOk], 0);
    Focus.SetFocus;
    Exit;
  end;

  tbDescription.Enabled := FALSE;
  tbHost.Enabled := FALSE;
  tbPort.Enabled := FALSE;
  tbSectors.Enabled := FALSE;
  cbUseLogin.Enabled := FALSE;

  tbLoginScript.Enabled := FALSE;
  tbLoginName.Enabled := FALSE;
  tbPassword.Enabled := FALSE;
  tbGame.Enabled := FALSE;

  btnAdd.Enabled := TRUE;
  btnDelete.Enabled := TRUE;
  btnEdit.Enabled := TRUE;

  btnSave.Enabled := FALSE;
  btnCancel.Enabled := FALSE;

  if (Edit) then
  begin
    TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).Modified := TRUE;
    Head := @(TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).DataHeader)
  end
  else
    Head := GetBlankHeader;

  Head^.Address := tbHost.Text;
  Head^.Sectors := Sectors;
  Head^.Port := Port;
  Head^.UseLogin := cbUseLogin.Checked;
  Head^.LoginName := tbLoginName.Text;
  Head^.Password := tbPassword.Text;

  if (Length(tbGame.Text) > 0) then
    Head^.Game := tbGame.Text[1]
  else
    Head^.Game := ' ';

  Head^.LoginScript := tbLoginScript.Text;

  if not (Edit) then
  begin
    // create new database

    SetCurrentDir(FProgramDir);
    S := 'data\' + tbDescription.Text + '.xdb';
    DoCreate := TRUE;

    if (FileExists(S)) then
      if (MessageDlg(S + #13 + 'This database already exists.' + #13 + #13 + 'Replace existing file?', mtWarning, [mbYes, mbNo], 0) = mrNo) then
        DoCreate := FALSE;

    if (DoCreate) then
    begin
      try
        TWXDatabase.CreateDatabase(S, Head^);
      except
        MessageDlg('An error occured while trying to create the database', mtError, [mbOK], 0);
        cbGames.OnChange(Self);
        Exit;
      end;

      UpdateGameList('data\' + tbDescription.Text + '.xdb');
      TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).New := TRUE;
    end;

    FreeMem(Head);
  end;
end;

procedure TfrmSetup.btnAddClick(Sender: TObject);
begin
  tbDescription.Enabled := TRUE;
  tbHost.Enabled := TRUE;
  tbPort.Enabled := TRUE;
  tbSectors.Enabled := TRUE;
  cbUseLogin.Enabled := TRUE;

  tbDescription.Text := 'New Game';
  tbHost.Text := '';
  tbPort.Text := '23';
  tbSectors.Text := '5000';
  cbUseLogin.Checked := FALSE;
  tbLoginScript.Text := '1_Login.ts';
  tbLoginName.Text := '';
  tbPassword.Text := '';
  tbGame.Text := '';
  cbUseLoginClick(Sender);
  tbDescription.SetFocus;

  btnSave.Enabled := TRUE;
  btnCancel.Enabled := TRUE;
  btnAdd.Enabled := FALSE;
  btnEdit.Enabled := FALSE;
  btnDelete.Enabled := FALSE;

  Edit := FALSE;
end;

procedure TfrmSetup.btnEditClick(Sender: TObject);
begin
  tbHost.Enabled := TRUE;
  tbPort.Enabled := TRUE;
  cbUseLogin.Enabled := TRUE;
  cbUseLoginClick(Sender);

  tbHost.SetFocus;

  btnSave.Enabled := TRUE;
  btnCancel.Enabled := TRUE;
  btnAdd.Enabled := FALSE;
  btnEdit.Enabled := FALSE;
  btnDelete.Enabled := FALSE;

  Edit := TRUE;
end;

procedure TfrmSetup.btnDeleteClick(Sender: TObject);
var
  Result : Integer;
  F      : File;
  S      : string;
begin
  if (cbGames.ItemIndex > -1) then
  begin
    Result := MessageDlg('Are you sure you want to delete this database?', mtWarning, [mbYes, mbNo], 0);
    
    if (Result = mrNo) then
      Exit;

    S := 'data\' + cbGames.Text + '.xdb';

    // delete selected database and refresh headers held in memory
    if (UpperCase(S) = UpperCase(TWXDatabase.DatabaseName)) then
      // close the current database
      TWXDatabase.CloseDataBase;

    TWXServer.ClientMessage('Deleting database: ' + ANSI_7 + S);
    SetCurrentDir(FProgramDir);
    AssignFile(F, S);
    Erase(F);

    try
      AssignFile(F, 'data\' + cbGames.Text + '.cfg');
      Erase(F);
    except
      // don't throw an error if couldn't delete .cfg file
    end;

    UpdateGameList('');
  end;
end;

procedure TfrmSetup.cbUseLoginClick(Sender: TObject);
begin
  if (cbUseLogin.Checked) then
  begin
    tbLoginScript.Enabled := TRUE;
    tbLoginName.Enabled := TRUE;
    tbPassword.Enabled := TRUE;
    tbGame.Enabled := TRUE;
  end
  else
  begin
    tbLoginScript.Enabled := FALSE;
    tbLoginName.Enabled := FALSE;
    tbPassword.Enabled := FALSE;
    tbGame.Enabled := FALSE;
  end;
end;

procedure TfrmSetup.btnCancelClick(Sender: TObject);
begin
  tbDescription.Enabled := FALSE;
  tbHost.Enabled := FALSE;
  tbPort.Enabled := FALSE;
  tbSectors.Enabled := FALSE;
  cbUseLogin.Enabled := FALSE;

  tbLoginScript.Enabled := FALSE;
  tbLoginName.Enabled := FALSE;
  tbPassword.Enabled := FALSE;
  tbGame.Enabled := FALSE;

  btnAdd.Enabled := TRUE;
  btnDelete.Enabled := TRUE;
  btnEdit.Enabled := TRUE;

  btnSave.Enabled := FALSE;
  btnCancel.Enabled := FALSE;

  cbGames.OnChange(Sender);
end;

procedure TfrmSetup.btnAddAutoRunClick(Sender: TObject);
begin
  OpenDialog.InitialDir := FProgramDir + '\Scripts\';

  if (OpenDialog.Execute) then
  begin
    lbAutoRun.Items.Append(OpenDialog.Filename);  
  end;

  SetCurrentDir(FProgramDir);
end;

procedure TfrmSetup.btnRemoveAutoRunClick(Sender: TObject);
begin
  if (lbAutoRun.ItemIndex > -1) and (lbAutoRun.ItemIndex < lbAutoRun.Items.Count) then
    lbAutoRun.Items.Delete(lbAutoRun.ItemIndex);
end;

procedure TfrmSetup.PageControlChanging(Sender: TObject; var AllowChange: Boolean);
begin
  if (tmrReg.Enabled) then
  begin
    MessageDlg('You must write your registration down first!', mtWarning, [mbOK], 0);

    AllowChange := FALSE;
  end;
end;

procedure TfrmSetup.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  if (tmrReg.Enabled) then
  begin
    MessageDlg('You must write your registration down first!', mtWarning, [mbOK], 0);
    Action := caNone;
    Exit;
  end;
end;

procedure TfrmSetup.tmrRegTimer(Sender: TObject);
begin
  tmrReg.Enabled := FALSE;
end;

procedure TfrmSetup.tbUserChange(Sender: TObject);
begin
  FAuthenticate := FALSE;
end;

end.
