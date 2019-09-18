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
unit Global;

interface

uses
  GUI,
  Classes,
  Bubble,
  Menu,
  Database,
  Log,
  Process,
  Script,
  TCP,
  Persistence;

type
  TGlobalVarItem = class(TObject)
  public
    constructor Create(Name, Value : String); overload;
    constructor Create(Name : String; Data : TStringList);  overload;
    destructor Destroy(); override;

  protected
    FName, FValue : string;
    FArray        : TStringList;
    FArrayCount   : Integer;

  published
    property Name : string read FName write FName;
    property Value : string read FValue write FValue;
    property Data : TStringList read FArray write FArray;
    property ArrayCount : Integer read FArrayCount write FArrayCount;
  end;

// Module variables:
var
  TWXMenu           : TModMenu;
  TWXDatabase       : TModDatabase;
  TWXLog            : TModLog;
  TWXExtractor      : TModExtractor;
  TWXInterpreter    : TModInterpreter;
  TWXServer         : TModServer;
  TWXClient         : TModClient;
  TWXBubble         : TModBubble;
  TWXGUI            : TModGUI;
  PersistenceManager: TPersistenceManager;

  TWXGlobalVars     : TList;
implementation

constructor TGlobalVarItem.Create(Name, Value : String);
begin
  FName  := Name;
  FValue := Value;
  FArrayCount := 0;
end;

constructor TGlobalVarItem.Create(Name : String; Data : TStringList);
begin
  FName  := Name;
  FValue := '';

  //FArray := TStringList.Create;
  FArray := Data;
  FArrayCount := Data.Count;
end;

destructor TGlobalVarItem.Destroy();
begin
  Data.Free;
end;



end.
