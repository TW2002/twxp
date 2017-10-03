{
Copyright (C) 2005, 2017  Remco Mulder, Elder Prophit, David McCartney

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
  Database,
  INIFiles;

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
    btnOK: TButton;
    tabProgram: TTabSheet;
    tabUser: TTabSheet;
    Label18: TLabel;
    memHint2: TMemo;
    Label19: TLabel;
    tabAutoRun: TTabSheet;
    memHint3: TMemo;
    OpenDialog: TOpenDialog;
    btnCancel: TButton;
    Label4: TLabel;
    Label5: TLabel;
    btnUpgrade: TButton;
    tmrReg: TTimer;
    tabProxy: TTabSheet;
    Label6: TLabel;
    tabLogging: TTabSheet;
    cbGames: TComboBox;
    btnAdd: TButton;
    Label22: TLabel;
    btnDelete: TButton;
    panMain: TPanel;
    btnAbout: TButton;
    panCorp: TPanel;
    panSession: TPanel;
    panStats: TPanel;
    cbDefault: TCheckBox;
    GroupBox1: TGroupBox;
    Label12: TLabel;
    tbDescription: TEdit;
    tbSectors: TEdit;
    Label17: TLabel;
    btnApply: TButton;
    Label7: TLabel;
    tbProxyAddress: TEdit;
    tbProxyPort: TEdit;
    Label8: TLabel;
    cbUseAuthProxy: TCheckBox;
    panTerminal: TPanel;
    GroupBox9: TGroupBox;
    panAutorun: TPanel;
    GroupBox11: TGroupBox;
    panLogging: TPanel;
    GroupBox16: TGroupBox;
    panLogin: TPanel;
    GroupBox17: TGroupBox;
    cc: TLabel;
    tbLoginScript: TEdit;
    Label37: TLabel;
    Label38: TLabel;
    Label9: TLabel;
    Label20: TLabel;
    cbLog: TCheckBox;
    cbLogANSI: TCheckBox;
    cbLogBinary: TCheckBox;
    cbNotifyLogDelay: TCheckBox;
    tbShortenDelay: TEdit;
    lbAutoRun: TListBox;
    cbUseLogin: TCheckBox;
    tbDefaultBot: TEdit;
    Label43: TLabel;
    btnAddAutoRun: TButton;
    btnRemoveAutoRun: TButton;
    Label11: TLabel;
    Label10: TLabel;
    cbBroadcast: TCheckBox;
    tbMenuKey: TEdit;
    cbCache: TCheckBox;
    tbBubbleSize: TEdit;
    cbLocalEcho: TCheckBox;
    panIdentity: TPanel;
    GroupBox7: TGroupBox;
    Label14: TLabel;
    Label42: TLabel;
    tbCorpPassword: TEdit;
    tbCorpName: TEdit;
    cbJoinCorp: TCheckBox;
    cbCreateCorp: TCheckBox;
    GroupBox2: TGroupBox;
    Label1: TLabel;
    Label3: TLabel;
    Label16: TLabel;
    Label2: TLabel;
    tbHost: TEdit;
    tbPort: TEdit;
    tbGame: TEdit;
    tbListenPort: TEdit;
    GroupBox5: TGroupBox;
    cbPostAction: TComboBox;
    Label36: TLabel;
    tbPostOption: TEdit;
    Label24: TLabel;
    lbPostHint: TLabel;
    GroupBox18: TGroupBox;
    Label25: TLabel;
    Label26: TLabel;
    Label27: TLabel;
    Label28: TLabel;
    Label29: TLabel;
    Label30: TLabel;
    Label31: TLabel;
    Label34: TLabel;
    Label35: TLabel;
    Label39: TLabel;
    Label40: TLabel;
    Label41: TLabel;
    Label21: TLabel;
    cbAcceptExternal: TCheckBox;
    tbRemoteAddress: TEdit;
    GroupBox4: TGroupBox;
    Label13: TLabel;
    Label15: TLabel;
    Label23: TLabel;
    Label32: TLabel;
    Label33: TLabel;
    tbLoginName: TEdit;
    tbPassword: TEdit;
    tbAlias: TEdit;
    tbPrivateGame: TEdit;
    tbPassport: TEdit;
    GroupBox15: TGroupBox;
    cbClearAvoids: TCheckBox;
    cbClearMessages: TCheckBox;
    cbReadLog: TCheckBox;
    cbStopBefore: TCheckBox;
    cbGetSettings: TCheckBox;
    cbLandOnTerra: TCheckBox;
    cbReadMessages: TCheckBox;
    Label44: TLabel;
    Label45: TLabel;
    tbShipName: TEdit;
    tbHomePlanet: TEdit;
    Label46: TLabel;
    tbSubSpace: TEdit;
    tvSetup: TTreeView;
    dtStartTime: TDateTimePicker;
    cbDelayedStart: TCheckBox;
    lbCountdown: TLabel;
    dtStartDate: TDateTimePicker;
    cbReconnect: TCheckBox;


    procedure FormHide(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure btnOKClick(Sender: TObject);
    procedure tbMenuKeyChange(Sender: TObject);
    procedure cbGamesChange(Sender: TObject);
    procedure btnAddClick(Sender: TObject);
    procedure btnDeleteClick(Sender: TObject);
    procedure btnApplyClick(Sender: TObject);
    procedure cbUseLoginClick(Sender: TObject);
    procedure btnCancelClick(Sender: TObject);
    procedure btnAddAutoRunClick(Sender: TObject);
    procedure btnRemoveAutoRunClick(Sender: TObject);
    procedure btnCancelMainClick(Sender: TObject);
    procedure tmrRegTimer(Sender: TObject);
    procedure tbUserChange(Sender: TObject);
    procedure cbAcceptExternalClick(Sender: TObject);
    procedure cbDelayedStartClick(Sender: TObject);
    procedure LoadDataConfig(Database: string);
    procedure SaveDataConfig(Database: string);
    procedure tvSetupMouseUp(Sender: TObject; Button: TMouseButton; Shift: TShiftState; X, Y: Integer);

    function ValidateConfig() : Boolean;
    procedure cbCreateCorpClick(Sender: TObject);

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

  // Enable database fields
  tbDescription.Enabled := TRUE;
  tbSectors.Enabled := TRUE;

  // Expand the TreeView Menu
  tvSetup.FullExpand;
  tvSetup.Select(tvSetup.Items[0]);
  panSession.Visible := TRUE;
  panLogin.Visible := FALSE;
  panIdentity.Visible := FALSE;
  panCorp.Visible := FALSE;
  panTerminal.Visible := FALSE;
  panLogging.Visible := FALSE;
  panAutoRun.Visible := FALSE;
  panStats.Visible := FALSE;
  tbHost.SetFocus;

  FAuthenticate := FALSE;
  // EP - Temp Win7 Dialog workaround
  if Win32MajorVersion > 5 then
    OpenDialog.Options := [ofOldStyleDialog];

  // initialize Post Action items
  cbPostAction.Items.Clear;
  cbPostAction.Items.Add('Do Nothing');
  cbPostAction.Items.Add('Mow to Location');
  cbPostAction.Items.Add('Mow to TA');
  cbPostAction.Items.Add('Xport to Ship');
  cbPostAction.Items.Add('Run a Script');

  // load up auto run scripts
  lbAutoRun.Items.Clear;
  lbAutoRun.Items.Assign(TWXInterpreter.AutoRun);

  // build list of data headers from databases in data\ folder
  DataLinkList := TList.Create;

  UpdateGameList(TWXDatabase.DatabaseName);

  // Cannont change database while connected.
  cbGames.Enabled := TRUE;
  if TWXClient.Connected then
    cbGames.Enabled := FALSE;

  btnOk.Enabled := TRUE;
  btnApply.Enabled := TRUE;
  btnCancel.Enabled := TRUE;
  btnAdd.Enabled := TRUE;
  btnDelete.Enabled := TRUE;

  if cbGames.Items.Count = 0 then
  begin
    cbDefault.Checked := TRUE;
    btnAddClick(Self);
  end
  else
  begin
    cbDefault.Checked := FALSE;
    Edit := TRUE;
  end;
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


procedure TfrmSetup.btnCancelMainClick(Sender: TObject);
begin
  Close;
end;

procedure TfrmSetup.tbMenuKeyChange(Sender: TObject);
begin
  if (Length(tbMenuKey.Text) > 1) then
    tbMenuKey.Text := tbMenuKey.Text[1];
end;

procedure TfrmSetup.cbAcceptExternalClick(Sender: TObject);
begin
  if (cbAcceptExternal.Checked) then
  begin
    tbRemoteAddress.Enabled := true;
  end
  else
  begin
    tbRemoteAddress.Enabled := false;
    tbRemoteAddress.Text := '';
  end;
end;

procedure TfrmSetup.cbCreateCorpClick(Sender: TObject);
begin
  if (cbCreateCorp.Checked) or (cbJoinCorp.Checked) then
  begin
    tbCorpName.Enabled := TRUE;
    tbCorpPassword.Enabled := TRUE;
  end
  else
  begin
    tbCorpName.Enabled := FALSE;
    tbCorpPassword.Enabled := FALSE;
  end;
end;

procedure TfrmSetup.cbDelayedStartClick(Sender: TObject);
var
  h,m,s,ms : word;
begin
  if cbDelayedStart.Checked then
  begin
    dtStartDate.Visible := TRUE;
    dtStartTime.Visible := TRUE;

    DecodeTime(now, h, m, s, ms);

    dtStartDate.Date := now;
    dtStartTime.Time := EncodeTime(h + 1,0,1,0);
  end
  else
  begin
    dtStartDate.Visible := FALSE;
    dtStartTime.Visible := FALSE;
  end;
end;

procedure TfrmSetup.cbGamesChange(Sender: TObject);
var
  Head : PDataHeader;
begin
  if (cbGames.ItemIndex < 0) then
    Exit;

  Head := @(TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).DataHeader);
  LoadDataConfig(Head^.Description);

//  if (cbGames.ItemIndex > -1) then
//  begin
//    tbDescription.Text := cbGames.Text;
//    tbSectors.Text := IntToStr(Head^.Sectors);
//    tbHost.Text := Head^.Address;
//    tbPort.Text := IntToStr(Head^.Port);
//    cbUseLogin.Checked := Head^.UseLogin;
//    tbLoginScript.Text := Head^.LoginScript;
//    tbLoginName.Text := Head^.LoginName;
//    tbPassword.Text := Head^.Password;
//    tbGame.Text := Head^.Game;
//  end;
end;

function TfrmSetup.ValidateConfig() : Boolean;
var
  Error,
  S        : string;
  Focus    : TWinControl;
  Port,
  ListenPort,
  Sectors  : Word;
  I        : Integer;
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
  if (I <> 0) and (Port > 1) and (Port < 65535) then
  begin
    Error := 'You must enter a valid port number';
    Focus := tbPort;
  end;
  tbPort.Text := IntToStr(I);

  Val(tbListenPort.Text, ListenPort, I);
  if (I <> 0) and (ListenPort > 1) and (ListenPort < 65535) then
  begin
    Error := 'You must enter a valid listen port number';
    Focus := tbListenPort;
  end;


  Val(tbSectors.Text, Sectors, I);
  if (I <> 0) and (Sectors > 100) and (Sectors < 30000) then
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
    Result := FALSE;
  end
  else
  begin
    Result := TRUE;
  end;

end;

procedure TfrmSetup.LoadDataConfig(Database: string);
var
  Filename : string;
  INI : TINIFile;
begin
  // Do not load if Database name is blank.
  if (Database = '') or (Database = 'data\.xdb') then
    exit;
   //Database := 'Default';

  Filename :=  GetCurrentDir + '\' + Copy(Database,0,Length(Database) - 4) + '.cfg';

  INI := TINIFile.Create(Filename);
  try
    // Read Session pannel from ini
    tbDescription.Text := INI.ReadString('Session', 'Description', '');
    tbSectors.Text := INI.ReadString('Session', 'Sectors', '30000');
    tbHost.Text := INI.ReadString('Session', 'Host', '');
    tbPort.Text := INI.ReadString('Session', 'Port', '2002');
    tbGame.Text := INI.ReadString('Session', 'Game', 'A');
    tbListenPort.Text := INI.ReadString('Session', 'ListenPort', IntToStr(cbGames.Items.Count + 3000));
    cbDelayedStart.Checked := INI.ReadBool('Session', 'Description', FALSE);
// TODO:
//    dtStartDate.Date := INI.ReadDate('Session','StartDate', '');
//    dtStartTime.Time := INI.ReadDate('Session','StartTime', '');

    // Read Login pannel from ini
    cbUseLogin.Checked := INI.ReadBool('Session', 'UseLogin', TRUE);
    tbLoginScript.Text := INI.ReadString('Session', 'LoginScript', 'Login.ts');
    tbDefaultBot.Text := INI.ReadString('Session', 'DefaultBot', '');
    cbReconnect.Checked := INI.ReadBool('Session', 'Reconnect', TRUE);
    cbLandOnTerra.Checked := INI.ReadBool('Session', 'LandOnTerra', TRUE);
    cbGetSettings.Checked := INI.ReadBool('Session', 'GetSettings', FALSE);
    cbStopBefore.Checked := INI.ReadBool('Session', 'StopBefore', FALSE);
    cbReadLog.Checked := INI.ReadBool('Session', 'ReadLog', FALSE);
    cbReadMessages.Checked := INI.ReadBool('Session', 'ReadMessages', FALSE);
    cbClearMessages.Checked := INI.ReadBool('Session', 'ClearMessages', FALSE);
    cbClearAvoids.Checked := INI.ReadBool('Session', 'ClearAvoids', FALSE);

    // Read Identity panel from ini
    tbLoginName.Text := INI.ReadString('Session', 'LoginName', '');
    tbPassword.Text := INI.ReadString('Session', 'Password', '');
    tbAlias.Text := INI.ReadString('Session', 'Alias', '');
    tbPassport.Text := INI.ReadString('Session', 'Passport', '');
    tbPrivateGame.Text := INI.ReadString('Session', 'PrivateGame', '');
    tbShipName.Text := INI.ReadString('Session', 'ShipName', '');
    tbHomePlanet.Text := INI.ReadString('Session', 'HomePlanet', '');
    tbSubSpace.Text := INI.ReadString('Session', 'SubSpace', '');

    // Read Corporation panel from ini
    cbCreateCorp.Checked := INI.ReadBool('Session', 'CreateCorp', FALSE);
    cbJoinCorp.Checked := INI.ReadBool('Session', 'JoinCorp', FALSE);
    tbCorpName.Text := INI.ReadString('Session', 'CorpName', '');
    tbCorpPassword.Text := INI.ReadString('Session', 'CorpPassword', '');
    cbPostAction.ItemIndex := cbPostAction.Items.IndexOf(INI.ReadString('Session', 'PostAction', 'Mow to Location'));
    tbPostOption.Text := INI.ReadString('Session', 'PostOtion', 'Stardock');

    // Read Terminal panel from ini
    tbMenuKey.Text := INI.ReadString('Terminal', 'MenuKey', '$');
    cbBroadcast.Checked := INI.ReadBool('Terminal', 'Broadcast', FALSE);
    cbCache.Checked := INI.ReadBool('Terminal', 'Cache', FALSE);
    cbLocalEcho.Checked := INI.ReadBool('Terminal', 'LocalEcho', FALSE);
    tbBubbleSize.Text := INI.ReadString('Terminal', 'BubbleSize','' );
    cbAcceptExternal.Checked := INI.ReadBool('Terminal', 'AcceptExternal', FALSE);
    tbRemoteAddress.Text := INI.ReadString('Terminal', 'RemoteAddress', '');

    // Read Logging panel from ini
    cbLog.Checked := INI.ReadBool('Terminal', 'cbLog', FALSE);
    cbLogANSI.Checked := INI.ReadBool('Terminal', 'cbLogANSI', FALSE);
    cbLogBinary.Checked := INI.ReadBool('Terminal', 'LogBinary', FALSE);
    tbShortenDelay.Text := INI.ReadString('Terminal', 'ShortenDelay', '');
    cbNotifyLogDelay.Checked := INI.ReadBool('Terminal', 'cbNotifyLogDelay', FALSE);

    //TODO: Read Auto-Run from ini


  finally
    INI.Free;
  end;

  // Update system state from form
  TWXBubble.MaxBubbleSize := StrToIntDef(tbBubbleSize.Text,30);
  TWXDatabase.UseCache := cbCache.Checked;
  TWXServer.ListenPort := StrToIntDef(tbListenPort.Text,3000);
  TWXClient.Reconnect := cbReconnect.Checked;
  TWXLog.LogData := cbLog.Checked;
  TWXLog.LogANSI := cbLogANSI.Checked;
  TWXLog.BinaryLogs := cbLogBinary.Checked;
  TWXLog.NotifyPlayCuts := cbNotifyLogDelay.Checked;
  TWXLog.MaxPlayDelay := StrToIntDef(tbShortenDelay.Text,10) * 1000;
  TWXServer.BroadCastMsgs := cbBroadCast.Checked;
  TWXServer.LocalEcho := cbLocalEcho.Checked;
  TWXExtractor.MenuKey := tbMenuKey.Text[1];
  TWXServer.AcceptExternal := cbAcceptExternal.Checked;
  TWXServer.RemoteAddress := tbRemoteAddress.Text;

  if not FileExists(Filename) then
    SaveDataConfig(Database);



end;

procedure TfrmSetup.SaveDataConfig(Database: string);
var
  INI : TINIFile;
  Filename : string;

  I         : Integer;
  F         : File;
  FileOpen  : Boolean;

  S        : string;
  Head     : PDataHeader;
  DoCreate : Boolean;
begin
  // Do not save if Database name is blank.
  if (Database = '') or (Database = 'data\.xdb') then
   Exit;

  Filename :=  GetCurrentDir + '\' + Copy(Database,0,Length(Database) - 4) + '.cfg';

  INI := TINIFile.Create(Filename);

  try
    // Write Session pannel to ini
    if not (Database  = 'Data\Default.xdb') then
    begin
      INI.WriteString('Session', 'Description', tbDescription.Text);
      INI.WriteString('Session', 'Sectors', tbSectors.Text);
      INI.WriteString('Session', 'Host', tbHost.Text);
      INI.WriteString('Session', 'Port', tbPort.Text);
      INI.WriteString('Session', 'Game', tbGame.Text);
      INI.WriteString('Session', 'ListenPort', tbListenPort.Text);
      INI.WriteBool('Session', 'DelayedStart', cbDelayedStart.Checked);
      INI.WriteDate('Session', 'StartDate', dtStartDate.Date);
      INI.WriteTime('Session', 'StartTime', dtStartTime.Time);
    end;

    // Write Login pannel to ini
    INI.WriteBool('Session', 'UseLogin', cbUseLogin.Checked);
    INI.WriteString('Session', 'LoginScript', tbLoginScript.Text);
    INI.WriteString('Session', 'DefaultBot', tbDefaultBot.Text);
    INI.WriteBool('Session', 'Reconnect', cbReconnect.Checked);
    INI.WriteBool('Session', 'LandOnTerra', cbLandOnTerra.Checked);
    INI.WriteBool('Session', 'GetSettings', cbGetSettings.Checked);
    INI.WriteBool('Session', 'StopBefore', cbStopBefore.Checked);
    INI.WriteBool('Session', 'ReadLog', cbReadLog.Checked);
    INI.WriteBool('Session', 'ReadMessages', cbReadMessages.Checked);
    INI.WriteBool('Session', 'ClearMessages', cbClearMessages.Checked);
    INI.WriteBool('Session', 'ClearAvoids', cbClearAvoids.Checked);

    // Write Identity panel to ini
    INI.WriteString('Session', 'LoginName', tbLoginName.Text);
    INI.WriteString('Session', 'Password', tbPassword.Text);
    INI.WriteString('Session', 'Alias', tbAlias.Text);
    INI.WriteString('Session', 'Passport', tbPassport.Text);
    INI.WriteString('Session', 'PrivateGame', tbPrivateGame.Text);
    INI.WriteString('Session', 'ShipName', tbShipName.Text);
    INI.WriteString('Session', 'HomePlanet', tbHomePlanet.Text);
    INI.WriteString('Session', 'SubSpace', tbSubSpace.Text);

    // Write Corporation panel to ini
    INI.WriteBool('Session', 'CreateCorp', cbCreateCorp.Checked);
    INI.WriteBool('Session', 'JoinCorp', cbJoinCorp.Checked);
    INI.WriteString('Session', 'CorpName', tbCorpName.Text);
    INI.WriteString('Session', 'CorpPassword', tbCorpPassword.Text);
    INI.WriteString('Session', 'PostAction', cbPostAction.Items[cbPostAction.ItemIndex]);
    INI.WriteString('Session', 'PostOtion', tbPostOption.Text);

    // Write Terminal panel to ini
    if not (Database  = 'Data\Default.xdb') then
    begin
    INI.WriteString('Terminal', 'MenuKey', tbMenuKey.Text);
    INI.WriteBool('Terminal', 'Broadcast', cbBroadcast.Checked);
    INI.WriteBool('Terminal', 'Cache', cbCache.Checked);
    INI.WriteBool('Terminal', 'LocalEcho', cbLocalEcho.Checked);
    INI.WriteString('Terminal', 'BubbleSize', tbBubbleSize.Text);
    INI.WriteBool('Terminal', 'AcceptExternal', cbAcceptExternal.Checked);
    INI.WriteString('Terminal', 'RemoteAddress', tbRemoteAddress.Text);

    //Write Logging panel to ini
    INI.WriteBool('Terminal', 'cbLog', cbLog.Checked);
    INI.WriteBool('Terminal', 'cbLogANSI', cbLogANSI.Checked);
    INI.WriteBool('Terminal', 'LogBinary', cbLogBinary.Checked);
    INI.WriteString('Terminal', 'ShortenDelay', tbShortenDelay.Text);
    INI.WriteBool('Terminal', 'cbNotifyLogDelay', cbNotifyLogDelay.Checked);

    end;
    //TODO: Write Auto-Run to ini



  finally
    INI.Free;
  end;

  // We don't want to create a database if just saving the default config.
  if Database  = 'Data\Default.xdb' then
    Exit;

  if (Edit) then
  begin
    TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).Modified := TRUE;
    Head := @(TDatabaseLink(DataLinkList[cbGames.ItemIndex]^).DataHeader)
  end
  else

  Head := GetBlankHeader;

  Head^.Address := tbHost.Text;
  Head^.Sectors := StrToIntDef(tbSectors.Text,30000);
  Head^.Port := StrToIntDef(tbPort.Text,2002);
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
  TWXBubble.MaxBubbleSize := StrToIntDef(tbBubbleSize.Text,30);

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
    TWXLog.MaxPlayDelay := StrToIntDef(tbShortenDelay.Text,10) * 1000;
  except
    TWXLog.MaxPlayDelay := 10;
  end;

  TWXServer.ListenPort := StrToIntDef(tbListenPort.Text,3000);
  TWXServer.Activate;
  TWXServer.AcceptExternal := cbAcceptExternal.Checked;
  TWXServer.RemoteAddress := tbRemoteAddress.Text;
  TWXServer.BroadCastMsgs := cbBroadCast.Checked;
  TWXServer.LocalEcho := cbLocalEcho.Checked;
  TWXClient.Reconnect := cbReconnect.Checked;

  // setup has changed, so update terminal menu
  TWXMenu.ApplySetup;

  // Disable database fields
  tbDescription.Enabled := TRUE;
  tbSectors.Enabled := TRUE;
  btnOk.Enabled := TRUE;
  btnApply.Enabled := TRUE;
  btnCancel.Enabled := TRUE;
  cbGames.Enabled := TRUE;

  btnAdd.Enabled := TRUE;
  btnDelete.Enabled := TRUE;

  Edit := TRUE;

end;

procedure TfrmSetup.btnAddClick(Sender: TObject);
begin
  // Enable database fields
  tbDescription.Enabled := TRUE;
  tbSectors.Enabled := TRUE;

  LoadDataConfig('Data\Default.xdb');


  tvSetup.Select(tvSetup.Items[0]);
  tbDescription.SetFocus;

  cbGames.Items.Add('<New Game>');
  cbGames.ItemIndex := cbGames.Items.Count + -1;
  cbGames.Enabled := FALSE;

  btnOk.Enabled := TRUE;
  btnApply.Enabled := TRUE;
  btnCancel.Enabled := TRUE;
  btnAdd.Enabled := FALSE;
  btnDelete.Enabled := FALSE;

  Edit := FALSE;
end;

procedure TfrmSetup.btnApplyClick(Sender: TObject);
begin
    if ValidateConfig() then
    begin
      if Edit then
      begin
        SaveDataConfig(TWXDatabase.DatabaseName);
      end
      else
      begin
        SaveDataConfig('Data\' + tbDescription.Text + '.xdb');
      end;
      if cbDefault.Checked = TRUE then
      begin
        SaveDataConfig('Data\Default.xdb');
        cbDefault.Checked := FALSE;
      end;

      // Enable database fields
      tbDescription.Enabled := FALSE;
      tbSectors.Enabled := FALSE;

      // TODO: Return focus to previous control.
      // TODO: Disable Apply button unless changes have been made.
    end;
end;

procedure TfrmSetup.btnOkClick(Sender: TObject);
begin
    if ValidateConfig() then
    begin
      if Edit then
      begin
        SaveDataConfig(TWXDatabase.DatabaseName);
      end
      else
      begin
        SaveDataConfig('Data\' + tbDescription.Text + '.xdb');
      end;
      if cbDefault.Checked = TRUE then
      begin
        SaveDataConfig('Data\Default.xdb');
      end;
      Self.Close;
    end;

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
  end
  else
  begin
    tbLoginScript.Enabled := FALSE;
  end;
end;

procedure TfrmSetup.btnCancelClick(Sender: TObject);
begin
  exit;
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


procedure TfrmSetup.tmrRegTimer(Sender: TObject);
begin
  tmrReg.Enabled := FALSE;
end;

procedure TfrmSetup.tvSetupMouseUp(Sender: TObject; Button: TMouseButton;
  Shift: TShiftState; X, Y: Integer);
begin
  panSession.Visible := FALSE;
  panLogin.Visible := FALSE;
  panIdentity.Visible := FALSE;
  panCorp.Visible := FALSE;
  panTerminal.Visible := FALSE;
  panLogging.Visible := FALSE;
  panAutoRun.Visible := FALSE;
  panStats.Visible := FALSE;

  if tvSetup.Selected.Text = 'Session' Then
    begin
      panSession.Visible := TRUE;
      tbHost.SetFocus;
    end
  else if tvSetup.Selected.Text = 'Login' Then
    begin
      panLogin.Visible := TRUE;
      cbUseLogin.SetFocus;
    end
  else if tvSetup.Selected.Text = 'Identity' Then
    begin
      panIdentity.Visible := TRUE;
      tbLoginName.SetFocus;
    end
  else if tvSetup.Selected.Text = 'Corp' Then
    begin
      panCorp.Visible := TRUE;
      cbCreateCorp.SetFocus;
    end
  else if tvSetup.Selected.Text = 'Terminal' Then
    begin
      panTerminal.Visible := TRUE;
      tbMenuKey.SetFocus;
    end
  else if tvSetup.Selected.Text = 'Logging' Then
    begin
      panLogging.Visible := TRUE;
      cbLog.SetFocus;
    end
  else if tvSetup.Selected.Text = 'AutoRun' Then
    begin
      panAutoRun.Visible := TRUE;
      lbAutoRun.SetFocus;
    end
  else if tvSetup.Selected.Text = 'Statistics' Then
    begin
      panStats.Visible := TRUE;
    end;
end;

procedure TfrmSetup.tbUserChange(Sender: TObject);
begin
  FAuthenticate := FALSE;
end;

end.
