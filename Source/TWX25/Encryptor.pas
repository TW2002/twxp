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
unit
  Encryptor;

interface

uses
  Classes, Sysutils;

type
  EEncryptError = class(Exception);

  TEncryptor = class(TComponent)
  protected
    { Protected declarations }
    FKey                : String;
    FShift              : Integer;
    FShiftKey,
    FChunkSize,
    FScrambleSeed       : Byte;
  public
    { Public declarations }
    procedure Encrypt(var Target : String);
    procedure Decrypt(var Target : String);
    procedure ConvertKey(var Key : String);
  published
    { Published declarations }
    property Key : String Read FKey Write FKey;
    property Shift : Integer Read FShift Write FShift default 5;
    property ShiftKey : Byte Read FShiftKey Write FShiftKey default 50;
    property ChunkSize : Byte Read FChunkSize Write FChunkSize default 18;
    property ChunkKey : Byte Read FScrambleSeed Write FScrambleSeed;
  end;

procedure Register;

implementation

procedure Register;
begin
  RegisterComponents('Samples', [TEncryptor]);
end;

procedure TEncryptor.ConvertKey(var Key : String);
var
  S       : String;
  I       : Integer;
  KeyChar : String;
begin
  KeyChar := '';

  for I := 1 to Length(Key) do
  begin
    if (Key[I] = ',') then
    begin
      try
        S := S + Char(StrToInt(KeyChar));
        KeyChar := '';
      except
        raise EEncryptError.Create('Bad encryption key format');
      end;
    end
    else
      KeyChar := KeyChar + Key[I];
  end;

  try
    S := S + Char(StrToInt(KeyChar));
  except
    raise EEncryptError.Create('Bad encryption key format');
  end;

  Key := S;
end;

procedure TEncryptor.Encrypt(var Target : String);
var
  Chunks,
  I,
  X,
  ChunkStart : Integer;
  J,
  B,
  C,
  ChunkKey,
  Last,
  CheckSum   : Byte;
  S,
  Key,
  Chunk      : String;
  P          : ^Char;
begin
  // Encode string
  S := '';
  Last := $18;
  CheckSum := $F0;
  Key := FKey;
  ConvertKey(Key);

  for I := 1 to Length(Target) do
  begin
    B := Ord(Target[I]);
    CheckSum := CheckSum xor B;
    C := B;

    for X := 1 to Length(Key) do
      B := B xor Ord(Key[X]);

    if (I mod FShift = 0) then
      // apply shift
      B := B xor FShiftKey;

    B := B xor Last;

    Last := C;
    S := S + Chr(B);
  end;

  // add checksum
  S := S + Char(CheckSum);

  // Scramble string
  Target := '';
  Chunks := Length(S) DIV FChunkSize;

  if (Chunks * FChunkSize < Length(S)) then
    Chunks := Chunks + 1;

  for I := 1 to Chunks do
  begin
    ChunkStart := (I - 1) * FChunkSize + 1;

    if (ChunkStart + FChunkSize - 1 > Length(S)) then
      X := Length(S) - ChunkStart + 1
    else
      X := FChunkSize;

    Chunk := Copy(S, ChunkStart, X);
    ChunkKey := Byte(Chunk[1]);

    // record index of chunk and encrypt it -
    // do this by accessing 32-bit chunk index in memory and
    // encrypting it at low level
    P := @I;
    for J := 1 to SizeOf(Integer) do
    begin
      Chunk := Char(Byte(P^) xor FScrambleSeed xor ChunkKey xor J) + Chunk;
      P := Pointer(Integer(P) + 1);
    end;

    if (Random < 0.5) or (X < FChunkSize) then
      Target := Target + Chunk
    else
      Target := Chunk + Target;
  end;
end;

procedure TEncryptor.Decrypt(var Target : String);
var
  I,
  X,
  ChunkIndex : Integer;
  J,
  B,
  ChunkKey,
  CheckSum,
  Last       : Byte;
  S,
  Chunk,
  Key,
  ChunkIdx   : String;
  P          : Pointer;
begin
  // Unscramble string
  I := 1;
  X := 1;
  Key := FKey;
  ConvertKey(Key);

  while (I < Length(Target)) do
  begin
    // search for a chunk with the index we're looking for (X)

    // get this chunk
    Chunk := Copy(Target, I, FChunkSize + SizeOf(Integer));

    if (Length(Chunk) < SizeOf(Integer) + 1) then
      // invalid chunk - unscramble failed
      Raise EEncryptError.Create('Decryption failure');

    // decode the chunk index
    ChunkKey := Byte(Chunk[5]);
    P := PChar(Chunk);
    ChunkIdx := '';
    for J := 1 to SizeOf(Integer) do
    begin
      Byte(P^) := Byte(P^) xor (5 - J) xor ChunkKey xor FScrambleSeed;
      ChunkIdx := Char(P^) + ChunkIdx;
      P := Pointer(Integer(P) + 1);
    end;

    ChunkIndex := Integer(Pointer(ChunkIdx)^);

    if (ChunkIndex = X) then
    begin
      S := S + Copy(Chunk, SizeOf(Integer) + 1, Length(Chunk));
      I := 1;
      Inc(X);
    end
    else
      I := I + Length(Chunk);
  end;

  if (S = '') then
    Raise EEncryptError.Create('Decryption failure');

  // Decode string
  Last := $18;
  Target := '';
  CheckSum := $F0;

  for I := 1 to Length(S) - 1 do
  begin
    B := Ord(S[I]);

    B := B xor Last;

    if (I mod FShift = 0) then
      // apply shift
      B := B xor FShiftKey;

    for X := Length(Key) downto 1 do
      B := B xor Ord(Key[X]);

    Target := Target + Char(B);
    CheckSum := CheckSum xor B;
    Last := B;
  end;

  if (CheckSum <> Byte(S[Length(S)])) then
    Raise EEncryptError.Create('Decryption failure');
end;

end.
