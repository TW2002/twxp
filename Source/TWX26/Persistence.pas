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
unit Persistence;

interface

uses
  SysUtils,
  Windows,
  Dialogs,
  Contnrs,
  Classes,
  Core;

type
  TPersistenceManager = class(TComponent, IPersistenceController)
  private
    FModuleList : TObjectList;
    FOutputFile : string;

    function ReadStringFromStream(Stream: TStream): string;
    procedure ApplyStateValues(const ClassTag: string; StateStream: TStream);
    procedure ProcessStateValues(StateStream: TStream);
    procedure ReportStateLoaded;
    function CalcChecksum(Stream: TMemoryStream): Integer;
  protected
    { IPersistenceController }
    procedure RegisterModule(Module : TTWXModule);
    procedure UnregisterModule(Module : TTWXModule);

  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;

    procedure SaveStateValues;
    function LoadStateValues: Boolean;

    property OutputFile : string read FOutputFile write FOutputFile;
  end;

implementation

constructor TPersistenceManager.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);

  FModuleList := TObjectList.Create(FALSE);
end;

destructor TPersistenceManager.Destroy;
begin
  FModuleList.Free;

  inherited;
end;

procedure TPersistenceManager.RegisterModule(Module : TTWXModule);
begin
  FModuleList.Add(Module);
end;

procedure TPersistenceManager.UnregisterModule(Module : TTWXModule);
begin
  FModuleList.Remove(Module);
end;

procedure TPersistenceManager.SaveStateValues;
var
  OutFile      : file;
  I            : Integer;
  ModuleValues : TMemoryStream;
  OutputValues : TMemoryStream;
  Module       : TTWXModule;
  ClassTag     : string;
  Checksum     : Integer;
  DataSize     : Integer;
  //ModuleNames  : array of String;
begin
  // Stream the state of each module to file

  OutputValues := TMemoryStream.Create;
  ModuleValues := TMemoryStream.Create;


  try
    for I := 0 to FModuleList.Count - 1 do
    begin
      Module := (FModuleList[I] as TTWXModule);

      //ModuleNames = ('mtDatabase', 'mtBubble', 'mtExtractor', 'mtMenu', 'mtServer', 'mtInterpreter', 'mtClient', 'mtLog', 'mtGUI');
      OutputDebugString(PChar('Saving Module #' + IntToStr(i) ));

      // MB - Skipping mtMenu because it is throwing exceptions.
      if (i <> 3) then
      begin
        Module.GetStateValues(ModuleValues);
        OutputDebugString(PChar('Module size:' + IntToStr(ModuleValues.Size) ));

        if (ModuleValues.Size > 0) then
        begin
          ModuleValues.Seek(0, soFromBeginning);
          ClassTag := Module.Classname;
          DataSize := Length(ClassTag);
          OutputValues.Write(DataSize, 4);
          OutputValues.Write(PChar(ClassTag)^, DataSize);
          OutputValues.CopyFrom(ModuleValues, ModuleValues.Size);
          ModuleValues.Clear;
        end;
      end;
    end;
  except
    MessageDlg('Exception occured saving module states.', mtError, [mbOK], 0);
    exit;
//  finally
  end;

  // calculate checksum
  Checksum := CalcChecksum(OutputValues);

  AssignFile(OutFile, OutputFile);
  ReWrite(OutFile, 1);

  try
    // write size and checksum to file
    DataSize := OutputValues.Size + 8;
    BlockWrite(OutFile, DataSize, 4);
    BlockWrite(OutFile, Checksum, 4);

    // write stream to file
    OutputValues.Seek(0, soFromBeginning);
    BlockWrite(OutFile, OutputValues.Memory^, OutputValues.Size);
  finally
    CloseFile(OutFile);
  end;

  OutputValues.Free;
  ModuleValues.Free;

end;

function TPersistenceManager.CalcChecksum(Stream: TMemoryStream): Integer;
var
  I: Integer;
begin
  Stream.Seek(0, soFromBeginning);
  Result := 0;

  while (Stream.Position < Stream.Size) do
  begin
    I := 0;
    Stream.Read(I, 4);
    Result := Result xor I;
  end;
end;

procedure TPersistenceManager.ApplyStateValues(const ClassTag: string; StateStream: TStream);
var
  I: Integer;
  Pos: Integer;
begin
  // find all modules with a matching classname and apply their state to them

  Pos := StateStream.Position;

  for I := 0 to FModuleList.Count - 1 do
    if (FModuleList[I].Classname = ClassTag) then
    begin
      if (StateStream.Position <> Pos) then
        StateStream.Seek(Pos, soFromBeginning); // return to where we started

      // MB - Don't load the TCP saved state (4)
      // if I <> 4 then
        TTWXModule(FModuleList[I]).SetStateValues(StateStream);
    end;
end;

procedure TPersistenceManager.ProcessStateValues(StateStream: TStream);
var
  ClassTag: string;
begin
  StateStream.Seek(0, soFromBeginning);

  while (StateStream.Position < StateStream.Size) do
  begin
    ClassTag := ReadStringFromStream(StateStream);
    ApplyStateValues(ClassTag, StateStream);
  end;
end;

procedure TPersistenceManager.ReportStateLoaded;
var
  I: Integer;
begin
  // iterate through modules and report that their state has been loaded

  for I := 0 to FModuleList.Count - 1 do
    TTWXModule(FModuleList[I]).StateValuesLoaded;
end;

function TPersistenceManager.LoadStateValues: Boolean;
var
  InputFile: file;
  Size: Integer;
  RecordedSize: Integer;
  Checksum: Integer;
  InStream: TMemoryStream;
  Buf: Pointer;
begin
{$I-}
  // Load the state of each module from file

  Result := False;
  AssignFile(InputFile, OutputFile);
  Reset(InputFile, 1);

  if (IOResult = 0) then
  try
    Size := FileSize(InputFile);

    if (Size > 8) then
    begin
      // make sure the file is as big as its supposed to be
      BlockRead(InputFile, RecordedSize, 4);

      if (RecordedSize = Size) then
      begin
        // get checksum
        BlockRead(InputFile, Checksum, 4);

        // now grab the rest
        InStream := TMemoryStream.Create;
        Dec(Size, 8);

        try
          Buf := AllocMem(Size);

          try
            BlockRead(InputFile, Buf^, Size);
            InStream.Write(Buf^, Size);
          finally
            FreeMem(Buf, Size);
          end;

          if (CalcChecksum(InStream) = Checksum) then
            // input OK - extract values from it
            ProcessStateValues(InStream);

        finally
          InStream.Free;
        end;
      end;

      Result := True;
    end;
  finally
    CloseFile(InputFile);
  end;
  
  ReportStateLoaded;

{$I+}
end;

function TPersistenceManager.ReadStringFromStream(Stream: TStream): string;
var
  Len: Integer;
  Buf: PChar;
begin
  Stream.Read(Len, 4);

  Buf := AllocMem(Len + 1);
  Stream.Read(Buf^, Len);
  SetString(Result, Buf, Len);
  FreeMem(Buf);
end;

end.
