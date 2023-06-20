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
  TWXC;

{$APPTYPE CONSOLE}

uses
  Core,
  SysUtils,
  Script,
  ScriptCmp in 'ScriptCmp.pas',
  ScriptRef in 'ScriptRef.pas';

var
  ScptRef   : TScriptRef;
  ScptCmp   : TScriptCmp;
  CompileOK : Boolean;
  Fileout   : string;

function StripFileExtension(Filename : string) : string;
var
  I : Integer;
begin
  Result := Filename;

  for I := Length(Filename) downto 1 do
    if (Filename[I] = '.') then
      Result := Copy(Filename, 1, I - 1);
end;

begin
  if (ParamCount = 0) then
  begin
    // display program description

    WriteLn('TWXC - TWX Proxy command line script compilation utility v' + ProgramVersion);
    WriteLn('       (c) Remco Mulder ("Xide") 2002-2004');
    WriteLn;
    WriteLn('Usage: TWXC script [descfile]');
    WriteLn;
    WriteLn('script     - Filename of the script to be compiled, this is usually a .ts file.');
    WriteLn('[descfile] - Optional filename of a description text file to be included in the');
    WriteLn('             compilation.');
    WriteLn('             Description files have no effect on the operation of the script, ');
    WriteLn('             but may provide useful information to users.');
    WriteLn;
    Exit;
  end;

  ScptRef := TScriptRef.Create;
  ScptCmp := TScriptCmp.Create(ScptRef);
  CompileOK := FALSE;
  Fileout := StripFileExtension(ParamStr(1));
  WriteLn('Compiling script ''' + Fileout + ''' ...');

  try
    ScptCmp.CompileFromFile(ParamStr(1), ParamStr(2));
    CompileOK := TRUE;
  except
    on E : Exception do
    begin
      WriteLn(E.Message);
    end;
  end;

  if (CompileOK) then
  begin
    ScptCmp.WriteToFile(Fileout + '.cts');
    WriteLn('Compilation successful.');
    WriteLn;
    WriteLn('Code Size: ' + IntToStr(ScptCmp.CodeSize));
    WriteLn('Lines: ' + IntToStr(ScptCmp.LineCount));
    WriteLn('Definitions: ' + IntToStr(ScptCmp.ParamCount));
    WriteLn('Commands: ' + IntToStr(ScptCmp.CmdCount));
  end;

  ScptCmp.Free;
  ScptRef.Free;
end.
