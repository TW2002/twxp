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
// This unit is responsible for logging data recieved from the server.

unit
  Log;

interface

uses
  SysUtils,
  Classes,
  ExtCtrls,
  Core;

type
  PLogEntry = ^TLogEntry;
  TLogEntry = packed record
    Timestamp: Cardinal;
    EntrySize: Word;
    Entry: Byte; // Implicit entry stored at end of record (defined by dynamically allocated size)
  end;

  TModLog = class(TTWXModule, IModLog, ITWXGlobals)
  private
    FProgramDir     : string;
    FLogFilename    : string;
    FLogFileOpen    : Boolean;
    FLogFile        : file;
    FPlayLogFile    : file;
    FLastLog        : TDateTime;
    FLogEnabled     : Boolean;
    FLogData        : Boolean;
    FLogANSI        : Boolean;
    FBinaryLogs     : Boolean;
    FPlayingLog     : Boolean;
    FLogTimer       : TTimer;
    FNextLogEntry   : PLogEntry; // pointer to next log entry to be played
    FLastPlayTime   : Cardinal;
    FMaxPlayDelay   : Cardinal;
    FNotifyPlayCuts : Boolean;

    function GetLogName: string;
    function GetLogTimer: TTimer;
    function GetNextLogEntry: PLogEntry;
    procedure OpenLog(Filename: string);
    procedure CloseLog;
    procedure LogBinary(const Data: string);
    procedure LogTimerTimer(Sender: TObject);

  protected
    { ITWXGlobals }
    procedure SetProgramDir(const Value: string);
    function GetProgramDir: string;

    { IModLog }
    function GetLogEnabled: Boolean;
    procedure SetLogEnabled(Value: Boolean);
    function GetLogData: Boolean;
    procedure SetLogData(Value: Boolean);
    function GetLogANSI: Boolean;
    procedure SetLogANSI(Value: Boolean);
    function GetBinaryLogs: Boolean;
    procedure SetBinaryLogs(Value: Boolean);

    property LogTimer: TTimer read GetLogTimer;
  public
    procedure AfterConstruction; override;
    procedure BeforeDestruction; override;
    procedure WriteLog(const Data: string);
    procedure DoLogData(const Data: string; const ANSIData: string);
    procedure DatabaseChanged;
    procedure BeginPlayLog(const Filename: string);
    procedure EndPlayLog;

    property LogFilename : string read FLogFilename;
    property LogFileOpen : Boolean read FLogFileOpen;
    property PlayingLog: Boolean read FPlayingLog;
  published
    property BinaryLogs: Boolean read GetBinaryLogs write SetBinaryLogs;
    property LogANSI: Boolean read GetLogANSI write SetLogANSI;
    property LogData: Boolean read GetLogData write SetLogData;
    property LogEnabled: Boolean read GetLogEnabled write SetLogEnabled;
    property MaxPlayDelay: Cardinal read FMaxPlayDelay write FMaxPlayDelay;
    property NotifyPlayCuts: Boolean read FNotifyPlayCuts write FNotifyPlayCuts;
  end;

implementation

uses
  Global,
  ANSI,
  Utility,
  Dialogs,
  Windows;

procedure TModLog.AfterConstruction;
begin
  inherited;

  // set defaults
  FLogEnabled := True;
  FLogData := True;
  FNotifyPlayCuts := True;
  FMaxPlayDelay := 10000;
end;

procedure TModLog.BeforeDestruction;
begin
  // ensure log file is closed
  CloseLog;
  
  FLogTimer.Free;

  if Assigned(FNextLogEntry) then
    FreeMem(FNextLogEntry);

  inherited;
end;

procedure TModLog.LogTimerTimer(Sender: TObject);
var
  Text: string;
begin
  // show the cached entry, then cache the next one
  SetString(Text, PChar(@(FNextLogEntry.Entry)), FNextLogEntry.EntrySize);
  TWXServer.Broadcast(Text);
  FreeMem(FNextLogEntry);
  FNextLogEntry := GetNextLogEntry;
end;

function TModLog.GetNextLogEntry: PLogEntry;
var
  Buf: Pointer;
  X: Cardinal;
begin
  if (FilePos(FPlayLogFile) + SizeOf(TLogEntry) >= FileSize(FPlayLogFile)) then
  begin
    // At end of log file
    EndPlayLog;
    Result := nil;
  end
  else
  begin
    // Read the entry header
    Result := AllocMem(SizeOf(TLogEntry));
    BlockRead(FPlayLogFile, Result^, SizeOf(TLogEntry) - 1);

    // Read the rest of the entry now that we know its size
    if (Result.EntrySize = 0) then
    begin
      // This is a dud frame.  Skip straight to the next record
      FreeMem(Result);
      Result := GetNextLogEntry;
      LogTimer.Interval := 1;
    end
    else
    begin
      ReAllocMem(Result, SizeOf(TLogEntry) + Result.EntrySize - 1);
      Buf := Pointer(Integer(Result) + SizeOf(TLogEntry) - 1);
      BlockRead(FPlayLogFile, Buf^, Result.EntrySize);

      // Set the timer to play it
      if (FLastPlayTime = 0) then
        LogTimer.Interval := 1
      else
      begin
        if (FLastPlayTime = Result.Timestamp) then
          X := 1
        else if (FLastPlayTime > Result.Timestamp) then
          X := Result.Timestamp + (High(X) - FLastPlayTime)
        else
          X := Result.Timestamp - FLastPlayTime;

        if (X > MaxPlayDelay) then begin
          LogTimer.Interval := 5000;

          if NotifyPlayCuts then
            TWXServer.ClientMessage('PLAYBACK: Long delay of ' + IntToStr(X div 1000) + 's cut to 5s');
        end else
          LogTimer.Interval := X;
      end;

      FLastPlayTime := Result.Timestamp;
    end;

    LogTimer.Enabled := True;
  end;
end;

procedure TModLog.BeginPlayLog(const Filename: string);
begin
  if (PlayingLog) then
    Exit;

  SetCurrentDir(FProgramDir);

  AssignFile(FPlayLogFile, Filename);
  {$I-}
  Reset(FPlayLogFile, 1);

  if (IOResult <> 0) then
    TWXServer.ClientMessage('Unable to open capture file ''' + LogFileName + ''' for play.')
  else
  begin
    TWXServer.ClientMessage('Beginning playback of capture file: ' + ANSI_7 + Filename + endl + ANSI_15 + 'Press any key to terminate.');
    FPlayingLog := True;

    if Assigned(FNextLogEntry) then
      FreeMem(FNextLogEntry);

    FNextLogEntry := GetNextLogEntry; // starts log timer
  end;
  {$I+}
end;

procedure TModLog.EndPlayLog;
begin
  if (FPlayingLog) then begin
    FPlayingLog := False;
    FLastPlayTime := 0;
    LogTimer.Enabled := False;
    CloseFile(FPlayLogFile);
    TWXServer.ClientMessage('Playback of capture file completed.');
  end;
end;

function TModLog.GetLogName: string;
begin
  Result := 'logs\' + DateToStr(Date) + ' ' + StripFileExtension(ShortFileName(TWXDatabase.DatabaseName));
  Replace(Result, '/', '-');
  Replace(Result, ':', '-');

  if FBinaryLogs then
    Result := Result + '.cap'
  else
    Result := Result + '.log';
end;

function TModLog.GetLogTimer: TTimer;
begin
  if not Assigned(FLogTimer) then begin
    FLogTimer := TTimer.Create(Self);

    with FLogTimer do
    begin
      OnTimer := LogTimerTimer;
      Interval := 1;
      Enabled := False;
    end;
  end;

  Result := FLogTimer;
end;

procedure TModLog.OpenLog(Filename: string);
begin
  if (LogFileOpen) or not (TWXDatabase.DatabaseOpen) then
    Exit;

  SetCurrentDir(FProgramDir);
  FLogFileName := Filename;

  AssignFile(FLogFile, LogFileName);
  {$I-}
  Reset(FLogFile, 1);

  if (IOResult <> 0) then
    ReWrite(FLogFile, 1);

  // MB - Ignore reslut 2 ??? caused by mombot.
  if (IOResult <> 0) and (IOResult <> 2) then
  begin
    TWXServer.ClientMessage('Unable to open log file - logging has been disabled. ' + endl +
                             'File: ' + LogFileName + '        IOResult: = ' + IntToStr(IOResult));
    LogData := FALSE;
  end
  else
  begin
    LogData := TRUE;
    FLogFileOpen := TRUE;
    FLastLog := Now;
  end;
  {$I+}
end;

procedure TModLog.CloseLog;
begin
  if not (LogFileOpen) then
    Exit;

  {$I-}
  CloseFile(FLogFile);
  FLogFileOpen := FALSE;
  {$I+}
end;

procedure TModLog.LogBinary(const Data: string);
var
  LogEntry: PLogEntry;
  Size: Integer;
begin
  // log timestamp along with packet
  Size := SizeOf(TLogEntry) + Length(Data) - 1;
  LogEntry := AllocMem(Size);
  LogEntry.Timestamp := GetTickCount;
  LogEntry.EntrySize := Length(Data);
  CopyMemory(@(LogEntry^.Entry), Pointer(Data), Length(Data));
  BlockWrite(FLogFile, LogEntry^, Size);
  FreeMem(LogEntry);
end;

procedure TModLog.WriteLog(const Data: string);
begin
  if LogEnabled then
  begin
    // Make sure the log file is open.
    if not LogFileOpen then
      OpenLog(GetLogName)
    else if (Trunc(Now) <> Trunc(FLastLog)) then
    begin
      // next day - open the next log
      CloseLog;
      OpenLog(GetLogName);
    end;

    {$I-}
    Seek(FLogFile, FileSize(FLogFile));
    BlockWrite(FLogFile, PChar(Data)^, Length(Data));
    {$I+}

  end;
end;


procedure TModLog.DoLogData(const Data: string; const ANSIData: string);
var
  I: Integer;
begin
  if LogData and LogEnabled then
  begin
    // Making sure the log file is open.
    if not LogFileOpen then
      OpenLog(GetLogName)
    else if (Trunc(Now) <> Trunc(FLastLog)) then
    begin
      // next day - open the next log
      CloseLog;
      OpenLog(GetLogName);
    end;

    {$I-}
    Seek(FLogFile, FileSize(FLogFile));

    if (FBinaryLogs) then
    begin
      if (LogANSI) then
        LogBinary(ANSIData)
      else
        LogBinary(Data);
    end
    else
    begin
      if (LogANSI) then
        BlockWrite(FLogFile, PChar(ANSIData)^, Length(ANSIData), I)
      else
        BlockWrite(FLogFile, PChar(Data)^, Length(Data), I);
    end;

    if (IOResult <> 0) then
    begin
      // MB - This error seems to be non-fatal - We may need to re-visit this, but for now I am going to ignore it.
      // TWXServer.ClientMessage('TWX Proxy has encountered an error logging data sent from the server.  ' + endl + 'This could be due to insufficient disk space or the log file is in use.  Logging has been disabled.');
      // LogData := FALSE;
    end;

    {$I+}
  end;
end;

procedure TModLog.DatabaseChanged;
var
  Filename: string;
begin
  if (LogEnabled) then
  begin
    Filename := GetLogName;

    if (Filename <> FLogFileName) then
    begin
      CloseLog;
      OpenLog(Filename);
    end;
  end;
end;

function TModLog.GetLogData: Boolean;
begin
  Result := FLogData;
end;

procedure TModLog.SetLogData(Value: Boolean);
begin
  FLogData := Value;
end;

function TModLog.GetLogEnabled: Boolean;
begin
  Result := FLogEnabled;
end;

procedure TModLog.SetLogEnabled(Value: Boolean);
begin
  if (FLogEnabled <> Value) then
  begin
    FLogEnabled := Value;

    if (Value) then
      OpenLog(GetLogName)
    else
      CloseLog;
  end;
end;

function TModLog.GetLogANSI: Boolean;
begin
  Result := FLogANSI;
end;

procedure TModLog.SetLogANSI(Value: Boolean);
begin
  FLogANSI := Value;
end;

function TModLog.GetBinaryLogs: Boolean;
begin
  Result := FBinaryLogs;
end;

procedure TModLog.SetBinaryLogs(Value: Boolean);
begin
  FBinaryLogs := Value;
end;

procedure TModLog.SetProgramDir(const Value: string);
begin
  FProgramDir := Value;
end;

function TModLog.GetProgramDir: string;
begin
  Result := FProgramDir;
end;

end.
