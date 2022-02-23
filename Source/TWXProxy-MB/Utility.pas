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
// This unit controls all utility functions used by the other units

unit
  Utility;

interface

uses
  Classes;

function GetSpace(I : Integer) : AnsiString;
function AsterixToEnter(S : AnsiString) : AnsiString;
function GetParameter(S : AnsiString; Parameter : Word) : AnsiString;
function GetParameterPos(S : AnsiString; Parameter : Integer) : Integer;
function Segment(I : Integer) : AnsiString;
function IsIn(S, X : AnsiString) : Boolean;
function StrToIntSafe(S : AnsiString) : Integer;
function StripChar(var S : AnsiString; C : AnsiChar) : AnsiString;
function ShortFilename(S : AnsiString) : AnsiString;
function StripFileExtension(S : Ansistring) : Ansistring;
function GetDirectory(S : AnsiString) : AnsiString;
function FetchScript(S : AnsiString; Include : Boolean) : AnsiString;
procedure Replace(var S : AnsiString; A, B : AnsiChar);
procedure CompleteFileName(var S : AnsiString; X : AnsiString);
function GetTelnetLogin(InStr : AnsiString) : AnsiString;
function StripChars(S : AnsiString) : AnsiString;
procedure FreeList(List : TList; MemSize : Integer);
procedure SetFileExtension(var Filename : AnsiString; Extension : AnsiString);
function WordWrap(S : Ansistring) : Ansistring;
function IsIpAddress(Addr : Ansistring) : Boolean;
function rdtsc : Int64;
procedure ReverseTList(var List : TList);
procedure Split(const Line : Ansistring; var Strings : TStringList; const Delimiters : Ansistring = ''); // default string parameter should be blank

implementation

uses
  SysUtils;

procedure SetFileExtension(var Filename : AnsiString; Extension : AnsiString);
begin
  // ensure the filename has an extention.  If not, make one
  if (Pos('.', String(Filename)) = 0) then
    Filename := Filename + Extension;
end;

function GetSpace(I : Integer) : AnsiString;
var
  X : Integer;
begin
  Result := '';

  for X := 1 to I do
    Result := Result + ' ';
end;

function StripChars(S : AnsiString) : AnsiString;
var
  I : Integer;
begin
  Result := '';

  // remove all unusual characters from line
  for I := 1 to Length(S) do
    if (Byte(S[I]) >= 32) and (Byte(S[I]) < 127) then
      Result := Result + S[I];
end;

function GetTelnetLogin(InStr : AnsiString) : AnsiString;
var
  I,
  X    : Integer;
  Retn : AnsiString;
begin
  // get telnet commands from this line
  X := 0;
  Retn := '';

  for I := 1 to Length(InStr) do
  begin
    if (X > 0) then
      Dec(X);

    if (InStr[I] = #255) then
      X := 3;

    if (X > 0) then
      Retn := Retn + InStr[I];
  end;

  GetTelnetLogin := Retn;
end;

function Generate(Name, Base : AnsiString) : AnsiString;
var
  I    : Integer;
  Key,
  A,
  B    : Byte;
  Retn : AnsiString;
begin
  Retn := '';
  Key := $5A;
  B := $9F;

  for I := 1 to Length(Name) do
    Key := ((Key xor Byte(Name[I])) * I) xor 127 xor Byte(Name[2]);

  for I := 1 to Length(Base) do
  begin
    A := Byte(Base[I]);
    A := A xor Key xor B * I;
    B := A;

    A := A DIV 8;

    if (A < 10) then
      A := A + 48
    else
      A := A + 55;

    Retn := Retn + AnsiChar(A);
  end;

  Result := Retn;
end;

function FetchScript(S : AnsiString; Include : Boolean) : AnsiString;
var
  NameList : array[1..6] of Ansistring;
  Limit,
  I        : Integer;
begin
  I := 1;

  while (I <= 5) do
  begin
    NameList[I] := S;
    Inc(I, 2);
  end;

  I := 2;

  while (I <= 6) do
  begin
    NameList[I] := 'scripts\' + S;
    Inc(I, 2);
  end;

  CompleteFileName(NameList[1], 'ts');
  CompleteFileName(NameList[2], 'ts');
  CompleteFileName(NameList[3], 'cts');
  CompleteFileName(NameList[4], 'cts');
  CompleteFileName(NameList[5], 'inc');
  CompleteFileName(NameList[6], 'inc');

  if (Include) then
    Limit := 6
  else
    Limit := 4;

  Result := S;

  for I := 1 to Limit do
    if (FileExists(String(NameList[I]))) then
    begin
      Result := NameList[I];
      Break;
    end;
end;

procedure CompleteFileName(var S : AnsiString; X : AnsiString);
var
  I : Integer;
begin
  // add an extention to the filename if there isn't one
  for I := length(S) downto 1 do
  begin
    if (S[I] = '.') then
      exit;
    if (S[I] = '\') then
      break;
  end;

  S := S + '.' + X;
end;

procedure Replace(var S : AnsiString; A, B : AnsiChar);
var
  I : Integer;
  N : AnsiString;
begin
  N := '';

  for I := 1 to Length(S) do
    if (S[I] = A) then
      N := N + B
    else
      N := N + S[I];

  S := N;
end;

function ShortFilename(S : AnsiString) : AnsiString;
var
  I : Integer;
begin
  // take the directories out of the filename
  for I := length(S) downto 1 do
    if (S[I] = '\') then
      break;

  ShortFilename := Copy(S, I + 1, length(S));
end;

function StripFileExtension(S : Ansistring) : Ansistring;
var
  I : Integer;
begin
  // take the extension out of the filename (if its there)
  for I := length(S) downto 1 do
    if (S[I] = '.') then
    begin
      Result := Copy(S, 1, I - 1);
      Exit;
    end;

  Result := S;
end;

function StrToIntSafe(S : AnsiString) : Integer;
var
  ErrorC,
  Value  : Integer;
begin
  Val(String(S), Value, ErrorC);

  if (ErrorC <> 0) then
    Value := 0;

  StrToIntSafe := Value;
end;

function AsterixToEnter(S : AnsiString) : AnsiString;
var
  X : AnsiString;
  I : Integer;
begin
  for I := 1 to length(S) do
    if (S[I] = '*') then
    begin
      X := X + chr(13);
      X := X + chr(10);
    end
    else
      X := X + S[I];

  AsterixToEnter := X;
end;

function Segment(I : Integer) : AnsiString;
var
  X, C : Integer;
  M, O : AnsiString;
begin
  // Moving from the right side, add commas every 3rd digit
  M := AnsiString(IntToStr(I));
  O := '';
  C := -1;

  for X := 0 to length(M) - 1 do
  begin
    Inc(C);
    if (C = 3) then
    begin
      C := 0;
      O := ',' + O;
    end;
    O := M[length(M) - X] + O;
  end;

  Segment := O;
end;

function GetDirectory(S : AnsiString) : AnsiString;
var
  I    : Integer;
  Retn : AnsiString;
begin
  // gets the directory out of the passed filename

  Retn := '';
  for I := Length(S) downto 1 do
  begin
    if (S[I] = '\') then
    begin
      Retn := Copy(S, 1, I - 1);
      Break;
    end;
  end;

  GetDirectory := Retn;
end;

function StripChar(var S : AnsiString; C : AnsiChar) : AnsiString;
var
  I : Integer;
  X : AnsiString;
begin
  // Remove character from string
  X := '';

  for I := 1 to length(S) do
    if (S[I] <> AnsiChar(C)) then X := X + S[I];

  S := X;
  StripChar := X;
end;

function IsIn(S, X : AnsiString) : Boolean;
begin
  if (S = '') then
    IsIn := TRUE
  else
  begin
    if (Pos(S, X) > 0) then
      IsIn := TRUE
    else
      IsIn := FALSE;
  end;
end;

function GetParameter(S : AnsiString; Parameter : Word) : AnsiString;
var
  I, P : Integer;
  retn : AnsiString;
  Last : AnsiChar;
begin
  // Get text parameter
  if (S = '') then
  begin
    GetParameter := '';
    Exit;
  end;

  P := 1;
  Last := ' ';
  retn := '';

  for I := 1 to length(S) do
  begin
    if (P = Parameter) and (S[I] <> ' ') and (S[I] <> #9) then
      retn := retn + S[I];

    if ((S[I] = ' ') or (S[I] = #9)) and (Last <> ' ') and (Last <> #9) then
    begin
      Inc(P);
      if (P > Parameter) then
        break;
    end;

    Last := S[I];
  end;

  GetParameter := retn;
end;

function GetParameterPos(S : AnsiString; Parameter : Integer) : Integer;
var
  I, P : Integer;
  Last : AnsiChar;
begin
  // Get text parameter
  P := 1;
  Last := ' ';

  for I := 1 to length(S) do
  begin
    if (S[I] = ' ') and (Last <> ' ') then
      Inc(P);

    if (P = Parameter) then
      break;

    Last := S[I];
  end;

  GetParameterPos := I + 1;
end;

procedure FreeList(List : TList; MemSize : Integer);
begin
  // remove all items and free list
  while (List.Count > 0) do
  begin
    FreeMem(List[0], MemSize);
    List.Delete(0);
  end;

  List.Free;
end;

function WordWrap(S : Ansistring) : Ansistring;
var
  I,
  J,
  Col : Integer;
begin
  // word-wrap value to max 60 characters
  Col := 1;
  for I := 1 to Length(S) do
  begin
    if (S[I] = #13) then
      Col := 0
    else
      Inc(Col);

    if (Col > 60) and (S[I] = ' ') then
    begin
      for J := I to Length(S) do
        if (S[J] <> ' ') then
        begin
          Insert(#13 + #10, S, J);
          Col := 0;
          Break;
        end;
    end;
  end;

  Result := S;
end;

function IsIpAddress(Addr : Ansistring) : Boolean;
var
  I,
  Dots : Integer;
begin
  Result := TRUE;
  Dots := 0;

  for I := 1 to Length(Addr) do
  begin
    if (Addr[I] = '.') then
      Inc(Dots)
    else if (Byte(Addr[I]) < 48) or (Byte(Addr[I]) > 57) then
    begin
      Result := FALSE;
      Break;
    end;
  end;

  if (Dots <> 3) then
    Result := FALSE;
end;

function rdtsc : Int64;
asm
  rdtsc
end;

procedure ReverseTList(var List : TList);
// This procedure flips a lists' order, primarily for course lists
var
  I,
  J : Integer;
begin
  J := List.Count div 2;
  for I := 1 to J do
    List.Exchange(I - 1, List.Count - I);
end;

procedure Split(const Line : Ansistring; var Strings : TStringList; const Delimiters : Ansistring = ''); // default string parameter should be blank
var
  Separators,
  WhiteSpace : set of AnsiChar; // set of Char
  I : Integer;
begin
  if (Delimiters <> '') then // Delimiters were specified
  begin
    Separators := [];
    for I := 1 to Length(Delimiters) do
      Separators := Separators + [Delimiters[I]];
  end
  else
    Separators := [#9, #32]; // Tab and Space, if omitted

  WhiteSpace := [];
  ExtractStrings(Separators, WhiteSpace, PChar(@Line[1]), TStrings(Strings));
end;

end.
