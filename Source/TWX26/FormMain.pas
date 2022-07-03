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
// This unit controls the interface (frmMain)

unit
  FormMain;

interface

uses
  Windows,
  SysUtils,
  Messages,
  DateUtils,
  Classes,
  Graphics,
  Controls,
  Forms,
  Dialogs,
  Menus,
  ScktComp,
  ExtCtrls,
  StdCtrls,
  ComCtrls,
  CommCtrl,
  //TrayIcon,
  ImgList,
  FileCtrl,
  //Encryptor,
  Bubble,
  Database,
  //OverbyteICSTnCnx,
  Core,
  Script,
  ActnList,
  Variants,
  ShellAPI,
  WinInet;

type
  TScriptMenuItem = class(TMenuItem)
  private
    FScript: TScript;
  public
    property Script: TScript read FScript write FScript;
  end;

  TQuickMenuItem = class(TMenuItem)
  private
    FScriptName: string;
  public
    property ScriptName: string read FScriptName write FScriptName;
  end;

  TfrmMain = class(TForm)
    OpenDialog: TOpenDialog;
    mnuPopup: TPopupMenu;
    miExit: TMenuItem;
    miView: TMenuItem;
    miStop: TMenuItem;
    miQuick:TMenuItem;
    miBot:  TMenuItem;
    miLoad: TMenuItem;
    miData: TMenuItem;
    miRecording: TMenuItem;
    N2: TMenuItem;
    miSetup: TMenuItem;
    miHistory: TMenuItem;
    N3: TMenuItem;
    miConnect: TMenuItem;
    tmrHideForm: TTimer;
    miHelp: TMenuItem;
    imageList: TImageList;
    N1: TMenuItem;
    miExport: TMenuItem;
    N4: TMenuItem;
    miImport: TMenuItem;
    SaveDialog: TSaveDialog;
    N5: TMenuItem;
    miExportBubble: TMenuItem;
    miExportDeadend: TMenuItem;
    trayIcon: TTrayIcon;
    //Encryptor: TEncryptor;
    N6: TMenuItem;
    miExportTWX: TMenuItem;
    miImportTWX: TMenuItem;
    miHelpScript: TMenuItem;
    miHelpAbout: TMenuItem;
    miHelpPack2: TMenuItem;
    miPlayLog: TMenuItem;
    miUpdateCheck: TMenuItem;
    miUpdateNow: TMenuItem;
    updateTimer: TTimer;
    miStopAll: TMenuItem;
    miStopAllNonSys: TMenuItem;
    miStopSys: TMenuItem;

    procedure miSetupClick(Sender: TObject);
    procedure miConnectClick(Sender: TObject);
    procedure miExitClick(Sender: TObject);
    procedure miRecordingClick(Sender: TObject);
    procedure miReloadClick(Sender: TObject);
    procedure miLoadClick(Sender: TObject);

    procedure miHistoryClick(Sender: TObject);
    procedure trayIconDblClick(Sender: TObject);
    procedure tmrHideFormTimer(Sender: TObject);
    procedure miExportClick(Sender: TObject);
    procedure miImportClick(Sender: TObject);
    procedure miExportBubbleClick(Sender: TObject);
    procedure miExportDeadendClick(Sender: TObject);
    procedure trayIconClick(Sender: TObject);
    procedure miExportTWXClick(Sender: TObject);
    procedure miImportTWXClick(Sender: TObject);
    procedure miHelpAboutClick(Sender: TObject);
    procedure miHelpScriptClick(Sender: TObject);
    procedure miHelpPack2Click(Sender: TObject);
    procedure miPlayLogClick(Sender: TObject);
    procedure popupChanged(Sender: TObject; Source: TMenuItem;
      Rebuild: Boolean);
    procedure popupShown(Sender: TObject);
    procedure miUpdateNowClick(Sender: TObject);
    procedure miUpdateCheckClick(Sender: TObject);
    procedure updateTimerTick(Sender: TObject);
    procedure miStopSysClick(Sender: TObject);
    procedure miStopAllNonSysClick(Sender: TObject);
const
  private
    LoadingScript : Boolean;
    FProgramDir   : string;

    LargeIcon: HIcon;
    SmallIcon: HIcon;
    Icon :Ticon;
    popupVisable : Boolean;

    procedure OnBotMenuItemClick(Sender: TObject);
    procedure OnQuickMenuItemClick(Sender: TObject);
    procedure OnScriptMenuItemClick(Sender: TObject);
    procedure SetTrayHint(const Value : string);
  public
    procedure LoadTrayIcon(const Value : string);
    constructor Create(AOwner : TComponent); override;

    procedure AddWarp(var S : TSector; W : Word);
    procedure SetToolTip(ToolTip : string);
    procedure LoadBotMenu();
    procedure LoadQuickMenu();
    procedure AddBotMenu(BotName: string; ScriptName: string);
    procedure AddQuickMenu(QuickName: string; ScriptName: string);
    procedure AddScriptMenu(Script: TScript);
    procedure RemoveScriptMenu(Script: TScript);

    property TrayHint: string write SetTrayHint;
  end;

implementation

uses
  Global,
  GUI,
  Utility,
  TWXExport,
  Ansi,
  Registry,
  inifiles,
  strutils;

{$R *.DFM}

// *******************************************************
// TfrmMain implementation


constructor TfrmMain.Create(AOwner : TComponent);
begin
  inherited Create(AOwner);

  Icon := TIcon.Create;

  Top := -100;
  FProgramDir := (Owner as TModGUI).ProgramDir;
  LoadingScript := FALSE;
  miStop.Visible := False;
  miStopAll.Visible := False;
  miQuick.Visible := True;
  miUpdateNow.Visible := False;

  LoadBotMenu();
  LoadQuickMenu();
end;

//function SHGetImageList(iImageList: Integer; const riid: TGUID;
//  var ppvObj: Pointer): HResult; stdcall; external shell32;

function EnumRCDataProc(hModule: HMODULE; lpszType, lpszName: PChar; lParam:
    NativeInt): BOOL; stdcall;
begin
  TStrings(lParam).Add(lpszName);
  Result := True;
end;

procedure TfrmMain.LoadBotMenu();
var
   IniFile     : TIniFile;
   BotName,
   Script,
   Section     : String;
   SectionList,
   ScriptList  : TStringList;
begin
  IniFile := TIniFile.Create(FProgramDir + '\twxp.cfg');


  try
    SectionList := TStringList.Create;
    try
      IniFile.ReadSections(SectionList);
      for Section in SectionList do
      begin
        if Pos('bot:', LowerCase(Section)) = 1 then begin
          BotName := IniFile.ReadString(Section, 'Name', '');
          Script  := IniFile.ReadString(Section, 'Script', '');

          ScriptList := TStringList.Create;
          ExtractStrings([','], [], PChar(Script), ScriptList);

          if FileExists (FProgramDir + '\scripts\' + ScriptList[0]) then
            AddBotMenu(BotName, Script);

          ScriptList.Free;
        end;
      end;
    finally
      SectionList.Free;
    end;
  finally
    IniFile.Free;
  end;
end;

procedure TfrmMain.LoadQuickMenu();
var
  IniFile    : TIniFile;
  searchDir,
  searchFile : TSearchRec;
  virtualName,
  virtualDir,
  dirName    : String;
  dirList    : TStringList;
  Item       : TMenuItem;
begin
  IniFile := TIniFile.Create(FProgramDir + '\twxp.cfg');

  dirList := TStringList.Create;
  dirList.Sorted := true;
  try
    // Process virtual directories based on 'name_' = 'virtual name' from twxp.cfg
    if findfirst(FProgramDir + '\scripts\*', faAnyFile, searchFile) = 0 then
    repeat
      // skip directories
      if not ((searchFile.attr and faDirectory) = faDirectory) then
      begin
        virtualDir := 'Misc';

        if LeftStr(searchFile.Name, 2) = '__' then
        virtualDir := '_Favorite';

        if LeftStr(searchFile.Name, 2) = 'z-' then
          virtualDir := 'Zed / Archie';

        if LeftStr(searchFile.Name,1) = '_' then
          virtualName := RightStr(searchFile.Name, Length(searchFile.Name) -1)
        else
          virtualName := searchFile.Name;

        if pos('_',virtualName) > 1 then
        begin
          virtualName := LeftStr(virtualName, pos('_',virtualName));
          virtualDir := IniFile.ReadString('QuickLoad', virtualName, 'Misc');
        end;

        if dirList.IndexOf(virtualDir) = -1 then
          dirList.add(virtualDir);

      end;
      until FindNext(searchFile) <> 0;

  finally
    FindClose(searchFile);
  end;

  try
    // Process real file directories under scripts
    if findfirst(FProgramDir + '\scripts\*', faDirectory, searchDir) = 0 then
    repeat
      // Only show directories
      if (searchDir.attr and faDirectory) = faDirectory then
      begin
        // Exclude undesired directories
        if (pos(Lowercase(searchDir.Name),'.,..,include,mombot,mombot3,Mombot4p,qubot,zedbot') = 0) then
        begin
          if findfirst(FProgramDir + '\scripts\' + searchDir.Name + '\*', faAnyFile, searchFile) = 0 then
          repeat
            // skip directories
            if not ((searchFile.attr and faDirectory) = faDirectory) then
              if dirList.IndexOf(searchDir.Name) = -1 then
                dirList.add(searchDir.Name);
          until FindNext(searchFile) <> 0;
        end;
      end;
        //then ShowMessage('Directory = '+searchResult.Name);
    until FindNext(searchDir) <> 0;
  finally
    FindClose(searchDir);
    FindClose(searchFile);
  end;

  for dirName in dirList do
  begin
      Item := TMenuItem.Create(Self);
      Item.Caption := dirName;
      miQuick.Add(Item);
  end;

  try
    // Process virtual directories based on 'name_' = 'virtual name' from twxp.cfg
    if findfirst(FProgramDir + '\scripts\*', faAnyFile, searchFile) = 0 then
    repeat
      // skip directories
      if not ((searchFile.attr and faDirectory) = faDirectory) then
      begin
        virtualDir := 'Misc';

        if LeftStr(searchFile.Name, 2) = '__' then
          virtualDir := '_Favorite';

        if LeftStr(searchFile.Name, 2) = 'z-' then
          virtualDir := 'Zed / Archie';

        if LeftStr(searchFile.Name,1) = '_' then
          virtualName := RightStr(searchFile.Name, Length(searchFile.Name) -1)
        else
          virtualName := searchFile.Name;

        if pos('_',virtualName) > 1 then
        begin
          virtualName := LeftStr(virtualName, pos('_',virtualName));
          virtualDir := IniFile.ReadString('QuickLoad', virtualName, 'Misc');
        end;

        AddQuickMenu(virtualDir + '\' + searchFile.Name, '\scripts\' + searchFile.Name);
      end;
      until FindNext(searchFile) <> 0;

  finally
    FindClose(searchFile);
  end;

  try
    // Process real file directories under scripts
    if findfirst(FProgramDir + '\scripts\*', faDirectory, searchDir) = 0 then
    repeat
      // Only show directories
      if (searchDir.attr and faDirectory) = faDirectory then
      begin
        // Exclude undesired directories
        if (pos(Lowercase(searchDir.Name),'.,..,include,mombot,mombot3,mombot4p,qubot,zedbot') = 0) then
        begin
          if findfirst(FProgramDir + '\scripts\' + searchDir.Name + '\*', faAnyFile, searchFile) = 0 then
          repeat
            // skip directories
            if not ((searchFile.attr and faDirectory) = faDirectory) then
              AddQuickMenu(searchDir.Name + '\' + searchFile.Name, '\scripts\' + searchDir.Name + '\' + searchFile.Name);
          until FindNext(searchFile) <> 0;
        end;
      end;
        //then ShowMessage('Directory = '+searchResult.Name);
    until FindNext(searchDir) <> 0;
  finally
    FindClose(searchDir);
    FindClose(searchFile);
  end;


end;


procedure TfrmMain.LoadTrayIcon(const Value : string);
var
    FileName : PChar;
    Index : Integer;
    StringList : TStringList;
begin
  //FileName := '%SystemRoot%\system32\Shell32.dll';
  FileName := 'twxp.dll';
  Index := 0;
  StringList := TStringList.Create;
  try
    ExtractStrings([':'], [], PChar(Value), StringList);

    if StringList.Count = 3 then
    begin
      FileName := Pchar(StringList[0] + ':' + StringList[1]);
      Index := StrToInt(StringList[2]);
    end
  finally
    StringList.Free;
  end;

  If ExtractIconEx( FileName, Index, LargeIcon, SmallIcon, 1) > 0 Then
  Begin;
    Icon.Handle := SmallIcon;
    trayIcon.Icon := Icon;
    trayIcon.IconIndex := Index;
    trayIcon.Refresh;
  End;
end;

procedure TfrmMain.SetTrayHint(const Value : string);
begin
  trayIcon.Hint := Value;
end;

// ************************************************************************
// Menu Functions

procedure TfrmMain.miSetupClick(Sender: TObject);
begin
  // Load up setup form

  (Owner as TModGUI).ShowForm(gfSetup);
end;

procedure TfrmMain.miExitClick(Sender: TObject);
begin
  // Exit program
  DestroyIcon(LargeIcon);
  DestroyIcon(SmallIcon);
  Icon.Free;

  Application.Terminate;
end;

procedure TfrmMain.miConnectClick(Sender: TObject);
begin
  if TWXGUI.Connected then
    TWXClient.Disconnect
  else
    TWXClient.ConnectNow;
end;

procedure TfrmMain.miRecordingClick(Sender: TObject);
begin
  TWXDatabase.Recording := not TWXDatabase.Recording;
end;

procedure TfrmMain.miReloadClick(Sender: TObject);
var
  FileName : String;
begin
  // Reload this script
  FileName := TMenuItem(Sender).Caption;
  StripChar(FileName, '&');
  TWXInterpreter.Load('scripts\' + FileName, FALSE);
end;

procedure TfrmMain.miLoadClick(Sender: TObject);
var
  Filename : String;
begin
  if (LoadingScript) then
  begin
    SetForegroundWindow(Application.Handle);
    Exit;
  end;

  OpenDialog.InitialDir := FProgramDir + '\Scripts\';
  OpenDialog.Filter := 'TW script (*.ts, *.cts)|*.ts;*.cts';
  OpenDialog.Filename := 'script.ts';
  OpenDialog.Title := 'Load Script';
  LoadingScript := TRUE;

  if (OpenDialog.Execute) then
  begin
    Filename := OpenDialog.Filename;
    CompleteFileName(Filename, 'ts');

    // MB - Catch when a user is loading a bot without
   //      using the "Load Bot" menu.
   if (Pos('bot', LowerCase(ExtractFileName(Filename))) > 0) and
      (Pos('switchbot', LowerCase(ExtractFileName(Filename))) = 0)
   then
     TWXInterpreter.SwitchBot(Filename, '', True)
   else
     TWXInterpreter.Load(Filename, False);
   end;

  // Reset current directory
  SetCurrentDir(FProgramDir);

  LoadingScript := FALSE;
end;

procedure TfrmMain.miHistoryClick(Sender: TObject);
begin
  (Owner as TModGUI).ShowForm(gfHistory);
end;

procedure TfrmMain.miExportClick(Sender: TObject);
var
  F        : TextFile;
  I        : Integer;
  S        : TSector;
  Filename : String;
begin
  if not (TWXDatabase.DataBaseOpen) then
  begin
    MessageDlg('You do not have a database selected, or it is invalid and needs to be rebuilt.', mtError, [mbOk], 0);
    Exit;
  end;

  // Export warp data to a text file
  SaveDialog.Title := 'Select export file';
  SaveDialog.FileName := 'warpspec.txt';
  SaveDialog.Filter := 'Text file (*.txt)|*.txt';
  SaveDialog.InitialDir := FProgramDir;

  if (SaveDialog.Execute) then
  begin
    Filename := SaveDialog.Filename;
    CompleteFileName(Filename, 'txt');

    if (FileExists(FileName)) then
    begin
      if (MessageDlg(FileName + #13 + 'This file already exists.' + #13 + #13 + 'Replace existing file?', mtWarning, [mbYes, mbNo], 0) = mrNo) then
        exit;
    end;

    AssignFile(F, FileName);
    {$I-}
    ReWrite(F);
    {$I+}

    if (IOResult <> 0) then
      MessageDlg('Unable to open file for export', mtError, [mbOk], 0)
    else
    begin
      // MB - write : to the beginning od the file for Swath compatablilty.
      Write(F, ':' + endl);

      for I := 1 to TWXDatabase.DBHeader.Sectors do
      begin
        S := TWXDatabase.LoadSector(I);

        if (S.Warp[1] > 0) then
        begin
          Write(F, IntToStr(I) + GetSpace(Length(IntToStr(TWXDatabase.DBHeader.Sectors)) + 1 - Length(IntToStr(I))) + IntToStr(S.Warp[1]));

          if (S.Warp[2] > 0) then
            Write(F, GetSpace(Length(IntToStr(TWXDatabase.DBHeader.Sectors)) + 1 - Length(IntToStr(S.Warp[1]))) + IntToStr(S.Warp[2]));
          if (S.Warp[3] > 0) then
            Write(F, GetSpace(Length(IntToStr(TWXDatabase.DBHeader.Sectors)) + 1 - Length(IntToStr(S.Warp[2]))) + IntToStr(S.Warp[3]));
          if (S.Warp[4] > 0) then
            Write(F, GetSpace(Length(IntToStr(TWXDatabase.DBHeader.Sectors)) + 1 - Length(IntToStr(S.Warp[3]))) + IntToStr(S.Warp[4]));
          if (S.Warp[5] > 0) then
            Write(F, GetSpace(Length(IntToStr(TWXDatabase.DBHeader.Sectors)) + 1 - Length(IntToStr(S.Warp[4]))) + IntToStr(S.Warp[5]));
          if (S.Warp[6] > 0) then
            Write(F, GetSpace(Length(IntToStr(TWXDatabase.DBHeader.Sectors)) + 1 - Length(IntToStr(S.Warp[5]))) + IntToStr(S.Warp[6]));

          Write(F, endl);
        end;
      end;

      // MB - write : to the end of the file for Swath compatablilty.
      Write(F, ':' + endl);

      CloseFile(F);
      ShowMessage('Warp data successfully exported');
    end;
  end;
end;

procedure TfrmMain.miPlayLogClick(Sender: TObject);
begin
  // play back a log file
  OpenDialog.InitialDir := FProgramDir + '\Logs\';
  OpenDialog.Filter := 'Binary capture files (*.cap)|*.cap|All files (*.*)|*.*';
  OpenDialog.Filename := '';
  OpenDialog.Title := 'Play Capture File';

  if (OpenDialog.Execute) then
    TWXLog.BeginPlayLog(OpenDialog.Filename);
end;

procedure TfrmMain.AddWarp(var S : TSector; W : Word);
var
  WarpExists : Boolean;
  I          : Integer;
begin
  // Add warp to sector if its not in there
  WarpExists := FALSE;

  for I := 1 to 6 do
    if (S.Warp[I] = W) then
      WarpExists := TRUE;

  if not (WarpExists) then
  begin
    if (S.Warp[1] = 0) then
      S.Warp[1] := W
    else if (S.Warp[2] = 0) then
      S.Warp[2] := W
    else if (S.Warp[3] = 0) then
      S.Warp[3] := W
    else if (S.Warp[4] = 0) then
      S.Warp[4] := W
    else if (S.Warp[5] = 0) then
      S.Warp[5] := W
    else if (S.Warp[6] = 0) then
      S.Warp[6] := W;
  end;
end;

procedure TfrmMain.SetToolTip(ToolTip : string);
begin
  trayIcon.Hint := ToolTip;
end;

procedure TfrmMain.miImportClick(Sender: TObject);
var
  F    : TextFile;
  S    : TSector;
  DB,
  Line : String;
  I,
  X    : Integer;
begin
  if not (TWXDatabase.DataBaseOpen) then
  begin
    MessageDlg('You do not have a database selected, or it is invalid and needs to be rebuilt.', mtError, [mbOk], 0);
    Exit;
  end;

  // Import warp data from a text file
  OpenDialog.Title := 'Select export file';
  OpenDialog.FileName := 'warpspec.txt';
  OpenDialog.Filter := 'Text file (*.txt)|*.txt';
  OpenDialog.InitialDir := FProgramDir;

  if (OpenDialog.Execute) then
  begin
    AssignFile(F, OpenDialog.FileName);
    {$I-}
    Reset(F);
    {$I+}

    if (IOResult <> 0) then
      MessageDlg('Unable to open file for import', mtError, [mbOk], 0)
    else
    begin
      while not eof(F) do
      begin
        ReadLn(F, Line);
        // MB - added for import compatability from swath - ignore ':' and blank lines
        if (Line <> ':') and (Line <> '') and (Line <> ': ENDINTERROG') then
        Begin
          X := StrToIntSafe(GetParameter(Line, 1));

          if (X = 0) then
          begin
            MessageDlg('Error importing warp data - corrupt?', mtError, [mbOk], 0);
            CloseFile(F);
             Exit;
         end;

          S := TWXDatabase.LoadSector(X);

          I := StrToIntSafe(GetParameter(Line, 2));
          if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
          begin
            AddWarp(S, I);

            I := StrToIntSafe(GetParameter(Line, 3));
            if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
            begin
              AddWarp(S, I);

              I := StrToIntSafe(GetParameter(Line, 4));
              if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
              begin
                AddWarp(S, I);

                I := StrToIntSafe(GetParameter(Line, 5));
                if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
                begin
                  AddWarp(S, I);

                  I := StrToIntSafe(GetParameter(Line, 6));
                  if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
                  begin
                    AddWarp(S, I);

                    I := StrToIntSafe(GetParameter(Line, 7));
                    if (I > 0) and (I <= TWXDatabase.DBHeader.Sectors) then
                      AddWarp(S, I);
                  end;
                end;
              end;
            end;
          end;

          if (S.Explored = etNo) then
            S.Explored := etCalc;

          TWXDatabase.SaveSector(S, X, nil, nil, nil);
          TWXDatabase.UpdateWarps(X);
        end;

      End;

      CloseFile(F);

      // reload database
      DB := TWXDatabase.DatabaseName;
      TWXDatabase.CloseDatabase;
      TWXDatabase.OpenDatabase(DB);

      ShowMessage('Warp data successfully imported.');
    end;
  end;
end;

procedure TfrmMain.miExportBubbleClick(Sender: TObject);
var
  F        : TextFile;
  Filename : String;
begin
  if not (TWXDatabase.DataBaseOpen) then
  begin
    MessageDlg('You do not have a database selected, or it is invalid and needs to be rebuilt.', mtError, [mbOk], 0);
    Exit;
  end;

  // Export bubble list to a text file
  SaveDialog.Title := 'Select export file';
  SaveDialog.FileName := 'bubbles.txt';
  SaveDialog.Filter := 'Text file (*.txt)|*.txt';
  SaveDialog.InitialDir := FProgramDir;

  if (SaveDialog.Execute) then
  begin
    Filename := SaveDialog.Filename;
    CompleteFileName(Filename, 'txt');

    if (FileExists(FileName)) then
    begin
      if (MessageDlg(FileName + #13 + 'This file already exists.' + #13 + #13 + 'Replace existing file?', mtWarning, [mbYes, mbNo], 0) = mrNo) then
        exit;
    end;

    AssignFile(F, FileName);
    {$I-}
    ReWrite(F);

    if (IOResult <> 0) then
    begin
      MessageDlg('Unable to open file', mtError, [mbOk], 0);
      Exit;
    end;

    try
      TWXBubble.ExportBubbles(F);
    except
      MessageDlg('Error exporting bubble list', mtError, [mbOk], 0);
      CloseFile(F);
    end;

    CloseFile(F);
    ShowMessage('Bubble list successfully exported');
    {$I+}
  end;
end;

procedure TfrmMain.miExportDeadendClick(Sender: TObject);
var
  F         : TextFile;
  I         : Integer;
  S         : TSector;
  Filename  : String;
  WarpsIn   : TList;
begin
  if not (TWXDatabase.DataBaseOpen) then
  begin
    MessageDlg('You do not have a database selected, or it is invalid and needs to be rebuilt.', mtError, [mbOk], 0);
    Exit;
  end;

  // Export deadend list to a text file
  SaveDialog.Title := 'Select export file';
  SaveDialog.FileName := 'deadends.txt';
  SaveDialog.Filter := 'Text file (*.txt)|*.txt';
  SaveDialog.InitialDir := FProgramDir;

  if (SaveDialog.Execute) then
  begin
    Filename := SaveDialog.Filename;
    CompleteFileName(Filename, 'txt');

    if (FileExists(FileName)) then
    begin
      if (MessageDlg(FileName + #13 + 'This file already exists.' + #13 + #13 + 'Replace existing file?', mtWarning, [mbYes, mbNo], 0) = mrNo) then
        exit;
    end;

    AssignFile(F, FileName);
    {$I-}
    ReWrite(F);

    if (IOResult <> 0) then
    begin
      MessageDlg('Unable to open file', mtError, [mbOk], 0);
      Exit;
    end;

    for I := 1 to TWXDatabase.DBHeader.Sectors do
    begin
      S := TWXDatabase.LoadSector(I);
      WarpsIn := TWXDatabase.GetWarpsIn(I);

      if (WarpsIn.Count = 1) and (S.Warp[1] > 0) then
      begin
        WriteLn(F, IntToStr(I));

        if (IOResult <> 0) then
        begin
          MessageDlg('Error exporting dead end list', mtError, [mbOk], 0);
          CloseFile(F);
          Exit;
        end;
      end;

      WarpsIn.Free;
    end;

    CloseFile(F);
    ShowMessage('Dead end list successfully exported');
    {$I+}
  end;
end;

procedure TfrmMain.miExportTWXClick(Sender: TObject);
begin
  if not (TWXDatabase.DataBaseOpen) then
  begin
    MessageDlg('You do not have a database selected, or it is invalid and needs to be rebuilt.', mtError, [mbOk], 0);
    Exit;
  end;

  // Export TWX file from active database
  SaveDialog.Title := 'Select export file';
  SaveDialog.FileName := TWXDatabase.DatabaseName + '.twx';
  SaveDialog.Filter := 'Trade wars export file (*.twx)|*.twx';
  SaveDialog.InitialDir := FProgramDir;

  if (SaveDialog.Execute) then
  begin
    if (FileExists(SaveDialog.Filename)) then
      if (MessageDlg(SaveDialog.Filename + #13 + 'This file already exists.' + #13 + #13 + 'Replace existing file?', mtWarning, [mbYes, mbNo], 0) = mrNo) then
        Exit;

    try
      ExportTWXFile(SaveDialog.Filename);
    except
      MessageDlg('An error occured while attempting to export data from the selected database', mtError, [mbOK], 0);
      Exit;
    end;

    MessageDlg('Database export successful', mtInformation, [mbOK], 0);
  end;
end;

procedure TfrmMain.miImportTWXClick(Sender: TObject);
var
  Errored,
  KeepRecent : Boolean;
  DB         : string;
begin
  // import data from TWX file into active database

  if not (TWXDatabase.DataBaseOpen) then
  begin
    MessageDlg('You do not have a database selected, or it is invalid and needs to be rebuilt.', mtError, [mbOk], 0);
    Exit;
  end;

  OpenDialog.Title := 'Select import file';
  OpenDialog.FileName := TWXDatabase.DatabaseName + '.twx';
  OpenDialog.Filter := 'Trade wars export file (*.twx)|*.twx';
  OpenDialog.InitialDir := FProgramDir;

  if (OpenDialog.Execute) then
  begin
    KeepRecent := (MessageDlg('Do you want to keep existing data within the selected database if this data is found to be more up to date than data being imported over it?', mtConfirmation, [mbYes, mbNo], 0) = mrYes);
    Errored := FALSE;

    try
      ImportTWXFile(OpenDialog.Filename, KeepRecent);
    except
      MessageDlg('An error occured while attempting to import data from the selected file', mtError, [mbOK], 0);
      Errored := TRUE;
    end;

    if not (Errored) then
    begin
      // reload database
      DB := TWXDatabase.DatabaseName;
      TWXDatabase.CloseDatabase;
      TWXDatabase.OpenDatabase(DB);
    end;
  end;
end;

procedure TfrmMain.miHelpAboutClick(Sender: TObject);
begin
  (Owner as TModGUI).ShowForm(gfAbout);
end;

procedure TfrmMain.miHelpScriptClick(Sender: TObject);
begin
  ShellExecute(0, nil, PChar('script.html'), nil, nil, SW_NORMAL);
end;

procedure TfrmMain.miHelpPack2Click(Sender: TObject);
begin
  ShellExecute(0, nil, PChar('pack2.html'), nil, nil, SW_NORMAL);
end;

procedure TfrmMain.miUpdateCheckClick(Sender: TObject);
var
  IniFile   : TIniFile;
  NetHandle : HINTERNET;
  UrlHandle : HINTERNET;
  Buffer    : array[0..1024] of Char;
  BytesRead : dWord;
  Result,
  Update    : string;
begin
  IniFile := TIniFile.Create(FProgramDir + '\twxp.cfg');

  Result := '';
  NetHandle := InternetOpen('Delphi 5.x', INTERNET_OPEN_TYPE_PRECONFIG, nil, nil, 0);

  if Assigned(NetHandle) then 
  begin
    UrlHandle := InternetOpenUrl(NetHandle, PChar('http://twxu.twfm.net'), nil, 0, INTERNET_FLAG_RELOAD, 0);

    if Assigned(UrlHandle) then
    begin
      FillChar(Buffer, SizeOf(Buffer), 0);
      repeat
        Result := Result + Buffer;
        FillChar(Buffer, SizeOf(Buffer), 0);
        InternetReadFile(UrlHandle, @Buffer, SizeOf(Buffer), BytesRead);
      until BytesRead = 0;
      InternetCloseHandle(UrlHandle);
    end
    else
      { UrlHandle is not valid. Raise an exception. }
      //raise Exception.CreateFmt('Cannot open URL %s', [Url]);

    InternetCloseHandle(NetHandle);
  end;
  //else
    { NetHandle is not valid. Raise an exception }
    //raise Exception.Create('Unable to initialize Wininet');

  if Result <> '' then
  begin
    try
      Update := IniFile.ReadString('TWX Proxy', 'Upgrade', '---');
      if (Pos(Update, Result) = 0) and (Pos('2814.2814', Result) = 0) then
      begin
        IniFile.WriteString('TWX Proxy', 'UpdateAvailable', 'True');
        miUpdateNow.Visible := True;
        TWXServer.Broadcast(endl + endl + ANSI_15 + endl +
          'An updated verion of TWX Proxy is available. To download please visit: ' + endl +
          'https://github.com/MicroBlaster/TWXProxy/wiki' + endl + endl + ANSI_7);
        if Sender <> nil then
        begin
          if Application.MessageBox('An updated verion of TWX Proxy is available.'  + endl +
          'Would you like to download it now?',
			    'Checking for Updates', MB_YESNO) = IDYES then
          ShellExecute(Handle,'open','https://github.com/MicroBlaster/TWXProxy/wiki',nil,nil, SW_SHOWNORMAL) ;
        end;
      end
      else
      begin
        IniFile.WriteString('TWX Proxy', 'UpdateAvailable', 'False');
        if Sender <> nil then
        begin
          IniFile.WriteString('TWX Proxy', 'UpdateAvailable', 'False');
          miUpdateNow.Visible := False;
          Application.MessageBox('You are running the latest version of TWX Proxy.',
			    'Checking for Updates', MB_OK)
        end;
      end;
  finally
    IniFile.Free;
  end;

  end;
end;


procedure TfrmMain.miUpdateNowClick(Sender: TObject);
begin
  miUpdateNow.Visible := False;
  ShellExecute(Handle,'open','https://github.com/MicroBlaster/TWXProxy/wiki',nil,nil, SW_SHOWNORMAL) ;
end;

// ************************************************************************
// Other


procedure TfrmMain.trayIconDblClick(Sender: TObject);
begin
  SetForegroundWindow(Application.Handle);

  if TWXGUI.Connected then
    miLoadClick(Sender)
  else
    miConnectClick(Sender)

end;

procedure TfrmMain.updateTimerTick(Sender: TObject);
var
   IniFile     : TIniFile;
   LastUpdateCheck : String;
begin
  IniFile := TIniFile.Create(FProgramDir + '\twxp.cfg');

  try
    LastUpdateCheck := IniFile.ReadString('TWX Proxy', 'LastUpdateCheck', '');
    if LastUpdateCheck <> DateTimeToStr(Date) then
    begin
      IniFile.WriteString('TWX Proxy', 'LastUpdateCheck', DateTimeToStr(Date));
      miUpdateCheckClick(nil);
    end;
  finally
    IniFile.Free;
  end;
end;

procedure TfrmMain.tmrHideFormTimer(Sender: TObject);
begin
  Hide;
  Enabled := FALSE;
end;

procedure TfrmMain.trayIconClick(Sender: TObject);
begin
  SetForegroundWindow(Application.Handle);
end;

procedure TfrmMain.AddBotMenu(BotName: string; ScriptName: string);
var
  MenuItem: TQuickMenuItem;
begin
  MenuItem := TQuickMenuItem.Create(Self);
  MenuItem.Caption := BotName;
  MenuItem.OnClick := OnBotMenuItemClick;
  MenuItem.ScriptName := ScriptName;

  miBot.Add(MenuItem);
end;

procedure TfrmMain.AddQuickMenu(QuickName: string; ScriptName: string);
var
  MenuItem: TQuickMenuItem;
  NameList : TStringList;
  Item  : TMenuItem;
begin
  NameList := TStringList.Create;
  ExtractStrings(['\'], [], PChar(QuickName), NameList);

  if NameList.Count = 2 then
  begin
    Item := miQuick.Find(NameList[0]);
    if Item = nil then
    begin
      Item := TMenuItem.Create(Self);
      Item.Caption := NameList[0];
      miQuick.Add(Item);
    end;

    MenuItem := TQuickMenuItem.Create(Self);
    MenuItem.Caption := NameList[1];
    MenuItem.OnClick := OnQuickMenuItemClick;
    MenuItem.ScriptName := ScriptName;

    Item.Add(MenuItem);
  end;
  
  NameList.Free;
end;

procedure TfrmMain.AddScriptMenu(Script: TScript);
var
  MenuItem: TScriptMenuItem;
begin
  MenuItem := TScriptMenuItem.Create(Self);
  MenuItem.Caption := Script.ScriptName;
  MenuItem.OnClick := OnScriptMenuItemClick;
  MenuItem.Script := Script;

  miStop.Add(MenuItem);
  miStop.Enabled := TRUE;
  miStop.Visible := TRUE;
  miStopAll.Enabled := TRUE;
  miStopAll.Visible := TRUE;
end;

procedure TfrmMain.RemoveScriptMenu(Script: TScript);
var
  I: Integer;
begin
  for I := 0 to miStop.Count - 1 do
    if (TScriptMenuItem(miStop.Items[I]).Script = Script) then
    begin
      miStop.Items[I].Free;
      Break;
    end;

  miStop.Enabled := (miStop.Count > 0);
  miStop.Visible := (miStop.Count > 0);
  miStopAll.Enabled := (miStop.Count > 0);
  miStopAll.Visible := (miStop.Count > 0);
end;

procedure TfrmMain.miStopAllNonSysClick(Sender: TObject);
begin
  TWXInterpreter.StopAll(False);
end;

procedure TfrmMain.miStopSysClick(Sender: TObject);
begin
  TWXInterpreter.StopAll(True);
end;

procedure TfrmMain.OnBotMenuItemClick(Sender: TObject);
begin
  // MB - Load the new bot. Load has bot detection and
  //      will close all other scripts automatically.
  TWXInterpreter.SwitchBot(TQuickMenuItem(Sender).ScriptName, '', True);
end;

procedure TfrmMain.OnQuickMenuItemClick(Sender: TObject);
begin
    TWXInterpreter.Load(FProgramDir + '\' + TQuickMenuItem(Sender).ScriptName, False)
end;


procedure TfrmMain.OnScriptMenuItemClick(Sender: TObject);
begin
  TWXInterpreter.StopByHandle(TScriptMenuItem(Sender).Script);
end;

procedure TfrmMain.popupChanged(Sender: TObject; Source: TMenuItem;
  Rebuild: Boolean);
begin
    popupVisable := false;
end;

procedure TfrmMain.popupShown(Sender: TObject);
var
  IniFile   : TIniFile;
begin
  IniFile := TIniFile.Create(FProgramDir + '\twxp.cfg');

  try
    if IniFile.ReadString('TWX Proxy', 'UpdateAvailable', '') = 'True' then
      miUpdateNow.Visible := True;
  finally
    IniFile.Free;
  end;

  // MB - Moved from GUI to prevent menu filcker cause when a server is down
  if (TWXGUI.Connected) then
  begin
    miConnect.Caption := 'Dis&connect';
    miConnect.Default := FALSE;
    miLoad.Default := TRUE;
  end
  else
  begin
    miConnect.Caption := '&Connect';
    miConnect.Default := TRUE;
    miLoad.Default := FALSE;
  end;
end;

end.
