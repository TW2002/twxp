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
 program
  PreComp;

// Pack2 script pre-compilation and encryption utility

{$APPTYPE CONSOLE}

uses
  SysUtils,
  Classes,
  Encryptor;

var
  Scpt      : TStringList;
  ExtnIndex,
  I,
  J         : Integer;
  Remove    : Boolean;
  Cryptor   : TEncryptor;
  InFile,
  OutFile,
  S         : string;
  F         : File;

begin
  if (ParamCount < 1) then
  begin
    WriteLn('Usage: PRECOMP infile [outfile]');
    WriteLn;
    Exit;
  end;

  Scpt := TStringList.Create;
  Cryptor := TEncryptor.Create(nil);

  try
    InFile := ParamStr(1);
    OutFile := ParamStr(2);
    Scpt.LoadFromFile(InFile);

    if (OutFile = '') then
    begin
      ExtnIndex := -1;

      for I := 1 to Length(InFile) do
      begin
        if (InFile[I] = '.') then
        begin
          ExtnIndex := I;
          Break;
        end;
      end;

      if (ExtnIndex = -1) then
        OutFile := InFile + '.inc'
      else
        OutFile := Copy(InFile, 1, ExtnIndex - 1) + '.inc';
    end;

    // remove comments and tabulation
    if (Scpt.Count > 0) then
    begin
      I := 0;

      while (I < Scpt.Count) do
      begin
        if (Length(Scpt[I]) > 0) then
        begin
          J := 1;

          while (J < Length(Scpt[I])) and (Scpt[I][J] = ' ') do
            Inc(J);

          if (J < Length(Scpt[I])) then
            Scpt[I] := Copy(Scpt[I], J, Length(Scpt[I]));
        end;

        Remove := FALSE;

        if (Length(Scpt[I]) >= 1) then
        begin
          if (Copy(Scpt[I], 1, 1) = '#') then
            Remove := TRUE;
        end
        else
          Remove := TRUE;

        if (Remove) then
          Scpt.Delete(I)
        else
          Inc(I);
      end;
    end;

    with (Cryptor) do
    begin
      ChunkKey := 210;
      ChunkSize := 25;
      Key := '195,23,85,11,77';
      Shift := 14;
      ShiftKey := 78;
    end;

    S := Scpt.Text;
    Cryptor.Encrypt(S);
    Scpt.Text := S;

    AssignFile(F, OutFile);
    ReWrite(F, 1);
    BlockWrite(F, PChar(S)^, Length(S));
    CloseFile(F);

  finally
    Scpt.Free;
    Cryptor.Free;
  end;

  WriteLn('Precompilation and encryption complete for file: ' + InFile);
end.
