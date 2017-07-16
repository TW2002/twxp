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
unit TWXExport;

// Export of .TWX files for other helpers

interface

uses
  Core,
  SysUtils,
  Database,
  Windows,
  Dialogs,
  Utility,
  Winsock;

procedure ExportTWXFile(Filename : string);
procedure ImportTWXFile(Filename : string; KeepRecent : Boolean);

implementation

uses
  Global,
  Ansi;

type
  TExportHeader = record
    id             : array[0..3] of Char; // File ID: "TWEX"
    time_created   : Integer; // Timestamp when created (See TS)
    ver            : Integer; // File version (See VE)
    sectors        : Integer; // Total number of sectors
    stardock       : Integer; // StarDock location (-1=Unknown)
    cls0port_sol   : Integer; // Class 0 port: Sol (-1=Unknown)
    cls0port_alpha : Integer; // Class 0 port: Alpha Centauri (-1=Unknown)
    cls0port_rylos : Integer; // Class 0 port: Rylos (-1=Unknown)
    crc32          : Integer; // Checksum (See CH)
    reserved       : array[0..219] of Byte; // Reserved for future use (Set to 0)
  end;

  TExportSector = record
    info          : ShortInt; // Sector info (See SI)
    navhaz        : ShortInt; // NavHaz percentage (0-100) (-1=Unknown)
    reserved2     : SmallInt; // Reserved for future use (Set to 0)
    sector_update : Integer; // Timestamp from last sector update (0=Never updated) (See TS and USI)
    ftrs          : Integer; // Fighters (-1=Unknown)
    ftr_owner     : SmallInt; // Fighter owner (Reserved, set to -1)
    ftr_type      : ShortInt; // Fighter type (1=Toll, 2=Offensive, 3=Defensive, 0=Mercenary, -1=Unknown)
    anom          : ShortInt; // Anomality (0=No, 1=Yes, -1=Unknown)
    armids        : SmallInt; // Armid mines (-1=Unknown)
    armid_owner   : SmallInt; // Armid owner (Reserved, set to -1)
    limpets       : SmallInt; // Limpet mines (-1=Unknown)
    limpet_owner  : SmallInt; // Limpet owner (Reserved, set to -1)
    port_amt      : array[0..2] of Integer; // Port amount [FOE] (-1=Unknown)
    port_per      : array[0..2] of ShortInt; // Port percentage [FOE] (0-100) (-1=Unknown)
    warps         : ShortInt; // # of warp sectors (-1=Unknown)
    warp_sect     : array[0..5] of Integer; // Warp sectors
    port_update   : Integer; // Timestamp from last port update (0=Never updated) (See TS and USI)
    density       : Integer; // Sector density (-1=Unknown)
    reserved      : array[0..23] of ShortInt; // Reserved for future use (Set to 0)
  end;

function ConvertToCTime(DateTime : TDateTime) : Integer;
begin
  Result := Round((DateTime - 25569) * 86400);
end;

function ConvertFromCTime(CTime : Integer) : TDateTime;
begin
  Result := (CTime / 86400) + 25569;
end;

function GetCRC(P : Pointer; ByteLen : Integer) : Integer; // bytelen must divide by 4
begin
  Result := 0;

  while (ByteLen > 0) do
  begin
    Result := Result xor Integer(P^);

    Dec(ByteLen, 4);
    P := Pointer(Integer(P) + 4);
  end;
end;

procedure ExportTWXFile(Filename : string);
var
  Crc,
  I,
  J      : Integer;
  F      : File;
  Head   : TExportHeader;
  Sects  : array of TExportSector;
  Sector : TSector;
begin
  CopyMemory(@(Head.id), PChar('TWEX'), 4);
  Head.time_created := htonl(ConvertToCTime(Now));
  Head.ver := htonl(1);
  Head.sectors := htonl(TWXDatabase.DBHeader.Sectors);
  Head.stardock := htonl(TWXDatabase.DBHeader.StarDock);
  Head.cls0port_sol := htonl(-1);
  Head.cls0port_alpha := htonl(-1);
  Head.cls0port_rylos := htonl(-1);
  Head.crc32 := 0;

  ZeroMemory(@(Head.reserved), Length(Head.reserved));
  Crc := GetCrc(@Head, SizeOf(Head));

  SetLength(Sects, TWXDatabase.DBHeader.Sectors);

  for I := 0 to TWXDatabase.DBHeader.Sectors - 1 do
  begin
    Sector := TWXDatabase.LoadSector(I + 1);

    if (Sector.Explored <> etHolo) and (Sector.SPort.ClassIndex = 0) then
      Sects[I].info := 11
    else if (Sector.SPort.Dead) then
      Sects[I].info := 12
    else if (Sector.SPort.Name = '') then
      Sects[I].info := 10
    else
      Sects[I].info := Sector.SPort.ClassIndex;

    Sects[I].navhaz := Sector.NavHaz;
    Sects[I].reserved2 := 0;

    if (Sector.UpDate = 0) then
      Sects[I].sector_update := 0
    else
      Sects[I].sector_update := htonl(ConvertToCTime(Sector.UpDate));

    Sects[I].ftrs := htonl(Sector.Figs.Quantity);
    Sects[I].ftr_owner := -1;

    if (Sector.Figs.Quantity = 0) then
      Sects[I].ftr_type := -1
    else if (Sector.Figs.FigType = ftToll) then
      Sects[I].ftr_type := 1
    else if (Sector.Figs.FigType = ftDefensive) then
      Sects[I].ftr_type := 3
    else if (Sector.Figs.FigType = ftOffensive) then
      Sects[I].ftr_type := 2;

    if (Sector.Density = -1) then
      Sects[I].anom := -1
    else if (Sector.Anomaly) then
      Sects[I].anom := 1
    else
      Sects[I].anom := 0;

    Sects[I].armids := htons(Sector.Mines_Armid.Quantity);
    Sects[I].armid_owner := -1;

    Sects[I].limpets := htons(Sector.Mines_Limpet.Quantity);
    Sects[I].limpet_owner := -1;

    if (Sector.SPort.ClassIndex = 0) then
    begin
      for J := 0 to 2 do
        Sects[I].port_amt[J] := htonl(-1);

      for J := 0 to 2 do
        Sects[I].port_per[J] := -1;

      Sects[I].port_update := 0;
    end
    else
    begin
      Sects[I].port_amt[0] := htonl(Sector.SPort.ProductAmount[ptFuelOre]);
      Sects[I].port_amt[1] := htonl(Sector.SPort.ProductAmount[ptOrganics]);
      Sects[I].port_amt[2] := htonl(Sector.SPort.ProductAmount[ptEquipment]);

      Sects[I].port_per[0] := Sector.SPort.ProductPercent[ptFuelOre];
      Sects[I].port_per[1] := Sector.SPort.ProductPercent[ptOrganics];
      Sects[I].port_per[2] := Sector.SPort.ProductPercent[ptEquipment];
      if (Sector.SPort.UpDate = 0) then
        Sects[I].port_update := 0
      else
        Sects[I].port_update := htonl(ConvertToCTime(Sector.SPort.UpDate));

    end;

    if (Sector.Warps = 0) then
      Sects[I].warps := -1
    else
      Sects[I].warps := Sector.Warps;

    for J := 0 to 5 do
      Sects[I].warp_sect[J] := htonl(Sector.Warp[J + 1]);

    Sects[I].density := htonl(Sector.Density);

    ZeroMemory(@(Sects[I].reserved), Length(Sects[I].reserved));
    Crc := Crc xor GetCrc(@(Sects[I]), SizeOf(TExportSector));
  end;

  Head.crc32 := Crc;

  // write it all to file
  AssignFile(F, Filename);
  ReWrite(F, 1);

  try
    BlockWrite(F, Head, SizeOf(TExportHeader));

    for I := 0 to TWXDatabase.DBHeader.Sectors - 1 do
      BlockWrite(F, Sects[I], SizeOf(TExportSector));
      
  finally
    CloseFile(F);
  end;
end;

procedure ImportTWXFile(Filename : string; KeepRecent : Boolean);
var
  F     : File;
  Head  : TExportHeader;
  Sects : array of TExportSector;
  I,
  J,
  K,
  Focus,
  Crc   : Integer;
  S     : TSector;
  T     : TDateTime;
  Exists : Boolean;

  function BaseZero(I : Integer) : Integer;
  begin
    if (I < 0) then
      Result := 0
    else
      Result := I;
  end;

begin
  AssignFile(F, Filename);
  Reset(F, 1);

  try
    BlockRead(F, Head, SizeOf(TExportHeader));
    Crc := GetCrc(@Head, SizeOf(TExportHeader));

    if (ntohl(Head.sectors) <> TWXDatabase.DBHeader.Sectors) then
    begin
      MessageDlg('The currently selected database is of the wrong size (in sectors) for the file being imported.  Size of ' + IntToStr(Head.sectors) + ' is required.', mtError, [mbOK], 0);
      Exit;
    end;

    if (ntohl(Head.ver) <> 1) then
    begin
      MessageDlg('Version ' + IntToStr(ntohl(Head.ver)) + ' is not supported.', mtError, [mbOK], 0);
      Exit;
    end;

    SetLength(Sects, TWXDatabase.DBHeader.Sectors);

    for I := 1 to TWXDatabase.DBHeader.Sectors do
    begin
      BlockRead(F, Sects[I - 1], SizeOf(TExportSector));
      Crc := Crc xor GetCrc(@(Sects[I - 1]), SizeOf(TExportSector));
    end;

    if (Crc <> 0) then
    begin
      MessageDlg('Error while importing this file.  It is either not a valid TWX export or it has been corrupted.', mtError, [mbOK], 0);
      Exit;
    end;

    for I := 1 to TWXDatabase.DBHeader.Sectors do
    begin
      S := TWXDatabase.LoadSector(I);

      // Increment through import warps to see if they already exist
      for J := 1 to Sects[I - 1].warps do begin
        Focus := BaseZero(ntohl(Sects[I - 1].warp_sect[J - 1]));
        if (Focus = 0) then Break;
        Exists := False;
        for K := 1 to 6 do begin
          if (S.Warps = 0) or (Focus > S.Warp[S.Warps]) then begin
            S.Warp[S.Warps + 1] := Focus;
            Inc(S.Warps);
            Exists := True;
            Break;
          end;
          if (S.Warp[K] = Focus) then begin
            Exists := True;
            Break;
          end;
        end;
        if (Exists = False) then begin
        // The imported warp was not known, so find where to insert it
          K := 5;
          while (Focus < S.Warp[K]) or (S.Warp[K] = 0) do begin
            S.Warp[K + 1] := S.Warp[K];
            Dec(K);
            if (K < 0) then Break;
          end;
          S.Warp[K + 1] := Focus;
        end;
      end;

      // If we have warps present, then the min Explored level is Calc
      if (S.Explored = etNo) then begin
        S.Explored := etCalc;
      end;

      // go with the most up-to-date sector
      if (BaseZero(ntohl(Sects[I - 1].sector_update)) = 0) then
        T := 0
      else
        T := ConvertFromCTime(ntohl(Sects[I - 1].sector_update));

      if (T > S.UpDate) or not (KeepRecent) then
      begin
        // import this sector into active database
        S.Explored := etHolo;

        if (Sects[I - 1].info = 12) then // 12 = Port Destroyed
          S.SPort.Dead := TRUE
        else if (Sects[I - 1].info = 10) or (Sects[I - 1].info > 12) then // 10 = No Port, > 12 = Under-Construction
        begin
          S.SPort.Name := '';
          S.SPort.ClassIndex := 0;
          S.SPort.Dead := FALSE;
        end
        else if (Sects[I - 1].info = 11) then // 11 = Unexplored
        begin
          // unexplored sector
          if (ntohl(Sects[I - 1].density) >= 0) then
            S.Explored := etDensity
          // if warps exist in either source, then min Explored level is Calc
          else if (Sects[I - 1].warps > 0) or (S.Warps > 0) then
            S.Explored := etCalc
          else
            S.Explored := etNo;
        end
        else
        begin
          if (S.SPort.Name = '') then
            S.SPort.Name := '???';

          S.SPort.ClassIndex := Sects[I - 1].info;

          if (S.SPort.ClassIndex = 1) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := TRUE;
            S.SPort.BuyProduct[ptOrganics] := TRUE;
            S.SPort.BuyProduct[ptEquipment] := FALSE;
          end
          else if (S.SPort.ClassIndex = 2) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := TRUE;
            S.SPort.BuyProduct[ptOrganics] := FALSE;
            S.SPort.BuyProduct[ptEquipment] := TRUE;
          end
          else if (S.SPort.ClassIndex = 3) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := FALSE;
            S.SPort.BuyProduct[ptOrganics] := TRUE;
            S.SPort.BuyProduct[ptEquipment] := TRUE;
          end
          else if (S.SPort.ClassIndex = 4) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := FALSE;
            S.SPort.BuyProduct[ptOrganics] := FALSE;
            S.SPort.BuyProduct[ptEquipment] := TRUE;
          end
          else if (S.SPort.ClassIndex = 5) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := FALSE;
            S.SPort.BuyProduct[ptOrganics] := TRUE;
            S.SPort.BuyProduct[ptEquipment] := FALSE;
          end
          else if (S.SPort.ClassIndex = 6) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := TRUE;
            S.SPort.BuyProduct[ptOrganics] := FALSE;
            S.SPort.BuyProduct[ptEquipment] := FALSE;
          end
          else if (S.SPort.ClassIndex = 7) then
          begin
            S.SPort.BuyProduct[ptFuelOre] := FALSE;
            S.SPort.BuyProduct[ptOrganics] := FALSE;
            S.SPort.BuyProduct[ptEquipment] := FALSE;
          end
          else
          begin
            S.SPort.BuyProduct[ptFuelOre] := TRUE;
            S.SPort.BuyProduct[ptOrganics] := TRUE;
            S.SPort.BuyProduct[ptEquipment] := TRUE;
          end;
        end;

        // Substitute zero for unknown (-1)
        S.NavHaz := BaseZero(Sects[I - 1].navhaz);
        S.Figs.Owner := 'Unknown';
        S.Figs.Quantity := ntohl(Sects[I - 1].ftrs);

        if (Sects[I - 1].ftr_type = 1) then
          S.Figs.FigType := ftToll
        else if (Sects[I - 1].ftr_type = 2) then
          S.Figs.FigType := ftOffensive
        else if (Sects[I - 1].ftr_type = 3) then
          S.Figs.FigType := ftDefensive
        else
          S.Figs.FigType := ftNone;

        S.Mines_Armid.Owner := 'Unknown';
        if (ntohl(Sects[I - 1].armids) = -1) then begin
          S.Mines_Armid.Quantity := 0;
        end
        else
          S.Mines_Armid.Quantity := ntohs(Sects[I - 1].armids);

        S.Mines_Limpet.Owner := 'Unknown';
        if (ntohl(Sects[I - 1].limpets) = -1) then begin
          S.Mines_Limpet.Quantity := 0;
        end
        else
          S.Mines_Limpet.Quantity := ntohs(Sects[I - 1].limpets);
        if (S.Constellation = '') or (Copy(S.Constellation, 1, 3) = '???') then
          S.Constellation := '???' + ANSI_9 + ' (data import only)';
        S.Beacon := '';
        S.UpDate := T;

        if (Sects[I - 1].anom <= 0) then
          S.Anomaly := FALSE
        else
          S.Anomaly := TRUE;

        S.Density := ntohl(Sects[I - 1].density);
      end;

      if (BaseZero(ntohl(Sects[I - 1].port_update)) = 0) then
        T := 0
      else
        T := ConvertFromCTime(ntohl(Sects[I - 1].port_update));

      // Now import Port data based on Port Info Update Timestamp
      if (T > S.SPort.UpDate) or not (KeepRecent) then
      begin
        S.SPort.ProductPercent[ptFuelOre] := BaseZero(Sects[I - 1].port_per[0]);
        S.SPort.ProductPercent[ptOrganics] := BaseZero(Sects[I - 1].port_per[1]);
        S.SPort.ProductPercent[ptEquipment] := BaseZero(Sects[I - 1].port_per[2]);
        S.SPort.ProductAmount[ptFuelOre] := BaseZero(ntohl(Sects[I - 1].port_amt[0]));
        S.SPort.ProductAmount[ptOrganics] := BaseZero(ntohl(Sects[I - 1].port_amt[1]));
        S.SPort.ProductAmount[ptEquipment] := BaseZero(ntohl(Sects[I - 1].port_amt[2]));
        S.SPort.UpDate := T;
      end;
      TWXDatabase.SaveSector(S, I, nil, nil, nil);
      TWXDatabase.UpdateWarps(I);
    end;
  finally
    CloseFile(F);
  end;
end;

end.
