using System;
using System.IO;
using System.Windows.Forms;
using Core;
using DataBase;
using Utility;
using Global;
using Ansi;
 // 
 // Copyright (C) 2005  Remco Mulder
 // 
 // This program is free software; you can redistribute it and/or modify
 // it under the terms of the GNU General Public License as published by
 // the Free Software Foundation; either version 2 of the License, or
 // (at your option) any later version.
 // 
 // This program is distributed in the hope that it will be useful,
 // but WITHOUT ANY WARRANTY; without even the implied warranty of
 // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 // GNU General Public License for more details.
 // 
 // You should have received a copy of the GNU General Public License
 // along with this program; if not, write to the Free Software
 // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 // 
 // For source notes please refer to Notes.txt
 // For license terms please refer to GPL.txt.
 // 
 // These files should be stored in the root of the compression you
 // received this source in.
namespace TWXExport
{
    public struct TExportHeader
    {
        public char id;
        // File ID: "TWEX"
        public int time_created;
        // Timestamp when created (See TS)
        public int ver;
        // File version (See VE)
        public int sectors;
        // Total number of sectors
        public int stardock;
        // StarDock location (-1=Unknown)
        public int cls0port_sol;
        // Class 0 port: Sol (-1=Unknown)
        public int cls0port_alpha;
        // Class 0 port: Alpha Centauri (-1=Unknown)
        public int cls0port_rylos;
        // Class 0 port: Rylos (-1=Unknown)
        public int crc32;
        // Checksum (See CH)
        public byte reserved;
    } // end TExportHeader

    public struct TExportSector
    {
        public sbyte info;
        // Sector info (See SI)
        public sbyte navhaz;
        // NavHaz percentage (0-100) (-1=Unknown)
        public short reserved2;
        // Reserved for future use (Set to 0)
        public int sector_update;
        // Timestamp from last sector update (0=Never updated) (See TS and USI)
        public int ftrs;
        // Fighters (-1=Unknown)
        public short ftr_owner;
        // Fighter owner (Reserved, set to -1)
        public sbyte ftr_type;
        // Fighter type (1=Toll, 2=Offensive, 3=Defensive, 0=Mercenary, -1=Unknown)
        public sbyte anom;
        // Anomality (0=No, 1=Yes, -1=Unknown)
        public short armids;
        // Armid mines (-1=Unknown)
        public short armid_owner;
        // Armid owner (Reserved, set to -1)
        public short limpets;
        // Limpet mines (-1=Unknown)
        public short limpet_owner;
        // Limpet owner (Reserved, set to -1)
        public int[] port_amt;
        // Port amount [FOE] (-1=Unknown)
        public sbyte[] port_per;
        // Port percentage [FOE] (0-100) (-1=Unknown)
        public sbyte warps;
        // # of warp sectors (-1=Unknown)
        public int[] warp_sect;
        // Warp sectors
        public int port_update;
        // Timestamp from last port update (0=Never updated) (See TS and USI)
        public int density;
        // Sector density (-1=Unknown)
        public sbyte reserved;
    } // end TExportSector

}

namespace TWXExport.Units
{
    public class TWXExport
    {
        public static int ConvertToCTime(DateTime DateTime)
        {
            int result;
            result = Math.Round((DateTime - 25569) * 86400);
            return result;
        }

        public static DateTime ConvertFromCTime(int CTime)
        {
            DateTime result;
            result = (CTime / 86400) + 25569;
            return result;
        }

        public static int GetCRC(object P, int ByteLen)
        {
            int result;
            // bytelen must divide by 4
            result = 0;
            while ((ByteLen > 0))
            {
                result = result ^ (int)P;
                ByteLen -= 4;
                P = ((int)P + 4 as object);
            }
            return result;
        }

        // Export of .TWX files for other helpers
        public static void ExportTWXFile(string Filename)
        {
            int Crc;
            int I;
            int J;
            System.IO.File F;
            TExportHeader Head;
            TExportSector[] Sects;
            TSector Sector;
            //@ Undeclared identifier(3): 'CopyMemory'
            CopyMemory((Head.id), ("TWEX" as string), 4);
            //@ Undeclared identifier(3): 'htonl'
            Head.time_created = htonl(ConvertToCTime(DateTime.Now));
            //@ Undeclared identifier(3): 'htonl'
            Head.ver = htonl(1);
            //@ Undeclared identifier(3): 'htonl'
            Head.sectors = htonl(Global.Units.Global.TWXDatabase.DBHeader.Sectors);
            //@ Undeclared identifier(3): 'htonl'
            Head.stardock = htonl(Global.Units.Global.TWXDatabase.DBHeader.StarDock);
            //@ Undeclared identifier(3): 'htonl'
            Head.cls0port_sol = htonl( -1);
            //@ Undeclared identifier(3): 'htonl'
            Head.cls0port_alpha = htonl( -1);
            //@ Undeclared identifier(3): 'htonl'
            Head.cls0port_rylos = htonl( -1);
            Head.crc32 = 0;
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory((Head.reserved), Head.reserved.Length);
            Crc = GetCRC(Head, sizeof(Head));
            Sects = new TExportSector[Global.Units.Global.TWXDatabase.DBHeader.Sectors];
            for (I = 0; I < Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                Sector = Global.Units.Global.TWXDatabase.Sectors[I + 1];
                if ((Sector.Explored != DataBase.TSectorExploredType.etHolo) && (Sector.SPort.ClassIndex == 0))
                {
                    Sects[I].info = 11;
                }
                else if ((Sector.SPort.Dead))
                {
                    Sects[I].info = 12;
                }
                else if ((Sector.SPort.Name == ""))
                {
                    Sects[I].info = 10;
                }
                else
                {
                    Sects[I].info = Sector.SPort.ClassIndex;
                }
                Sects[I].navhaz = Sector.NavHaz;
                Sects[I].reserved2 = 0;
                if ((Sector.UpDate == 0))
                {
                    Sects[I].sector_update = 0;
                }
                else
                {
                    //@ Undeclared identifier(3): 'htonl'
                    Sects[I].sector_update = htonl(ConvertToCTime(Sector.UpDate));
                }
                //@ Undeclared identifier(3): 'htonl'
                Sects[I].ftrs = htonl(Sector.Figs.Quantity);
                Sects[I].ftr_owner =  -1;
                if ((Sector.Figs.Quantity == 0))
                {
                    Sects[I].ftr_type =  -1;
                }
                else if ((Sector.Figs.FigType == DataBase.TFighterType.ftToll))
                {
                    Sects[I].ftr_type = 1;
                }
                else if ((Sector.Figs.FigType == DataBase.TFighterType.ftDefensive))
                {
                    Sects[I].ftr_type = 3;
                }
                else if ((Sector.Figs.FigType == DataBase.TFighterType.ftOffensive))
                {
                    Sects[I].ftr_type = 2;
                }
                if ((Sector.Density ==  -1))
                {
                    Sects[I].anom =  -1;
                }
                else if ((Sector.Anomaly))
                {
                    Sects[I].anom = 1;
                }
                else
                {
                    Sects[I].anom = 0;
                }
                //@ Undeclared identifier(3): 'htons'
                Sects[I].armids = htons(Sector.Mines_Armid.Quantity);
                Sects[I].armid_owner =  -1;
                //@ Undeclared identifier(3): 'htons'
                Sects[I].limpets = htons(Sector.Mines_Limpet.Quantity);
                Sects[I].limpet_owner =  -1;
                if ((Sector.SPort.ClassIndex == 0))
                {
                    for (J = 0; J <= 2; J ++ )
                    {
                        //@ Undeclared identifier(3): 'htonl'
                        Sects[I].port_amt[J] = htonl( -1);
                    }
                    for (J = 0; J <= 2; J ++ )
                    {
                        Sects[I].port_per[J] =  -1;
                    }
                    Sects[I].port_update = 0;
                }
                else
                {
                    //@ Undeclared identifier(3): 'htonl'
                    Sects[I].port_amt[0] = htonl(Sector.SPort.ProductAmount[DataBase.TProductType.ptFuelOre]);
                    //@ Undeclared identifier(3): 'htonl'
                    Sects[I].port_amt[1] = htonl(Sector.SPort.ProductAmount[DataBase.TProductType.ptOrganics]);
                    //@ Undeclared identifier(3): 'htonl'
                    Sects[I].port_amt[2] = htonl(Sector.SPort.ProductAmount[DataBase.TProductType.ptEquipment]);
                    Sects[I].port_per[0] = Sector.SPort.ProductPercent[DataBase.TProductType.ptFuelOre];
                    Sects[I].port_per[1] = Sector.SPort.ProductPercent[DataBase.TProductType.ptOrganics];
                    Sects[I].port_per[2] = Sector.SPort.ProductPercent[DataBase.TProductType.ptEquipment];
                    if ((Sector.SPort.UpDate == 0))
                    {
                        Sects[I].port_update = 0;
                    }
                    else
                    {
                        //@ Undeclared identifier(3): 'htonl'
                        Sects[I].port_update = htonl(ConvertToCTime(Sector.SPort.UpDate));
                    }
                }
                if ((Sector.Warps == 0))
                {
                    Sects[I].warps =  -1;
                }
                else
                {
                    Sects[I].warps = Sector.Warps;
                }
                for (J = 0; J <= 5; J ++ )
                {
                    //@ Undeclared identifier(3): 'htonl'
                    Sects[I].warp_sect[J] = htonl(Sector.Warp[J + 1]);
                }
                //@ Undeclared identifier(3): 'htonl'
                Sects[I].density = htonl(Sector.Density);
                //@ Undeclared identifier(3): 'ZeroMemory'
                ZeroMemory((Sects[I].reserved), Sects[I].reserved.Length);
                Crc = Crc ^ GetCRC(Sects[I], sizeof(TExportSector));
            }
            Head.crc32 = Crc;
            // write it all to file
            F = new FileInfo(Filename);
            _W_0 = F.CreateText();
            try {
                //@ Unsupported function or procedure: 'BlockWrite'
                BlockWrite(F, Head, sizeof(TExportHeader));
                for (I = 0; I < Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Sects[I], sizeof(TExportSector));
                }
            } finally {
                _W_0.Close();
            }
        }

        public int ImportTWXFile_BaseZero(int I)
        {
            int result;
            if ((I < 0))
            {
                result = 0;
            }
            else
            {
                result = I;
            }
            return result;
        }

        public static void ImportTWXFile(string Filename, bool KeepRecent)
        {
            System.IO.File F;
            TExportHeader Head;
            TExportSector[] Sects;
            int I;
            int J;
            int K;
            int Focus;
            int Crc;
            TSector S;
            DateTime T;
            bool Exists;
            F = new FileInfo(Filename);
            _R_1 = F.OpenText();
            try {
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Head, sizeof(TExportHeader));
                Crc = GetCRC(Head, sizeof(TExportHeader));
                //@ Undeclared identifier(3): 'ntohl'
                if ((ntohl(Head.sectors) != Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                {
                    MessageBox.Show("The currently selected database is of the wrong size (in sectors) for the file being imported.  Size of " + (Head.sectors).ToString() + " is required.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    return;
                }
                //@ Undeclared identifier(3): 'ntohl'
                if ((ntohl(Head.ver) != 1))
                {
                    //@ Undeclared identifier(3): 'ntohl'
                    MessageBox.Show("Version " + (ntohl(Head.ver)).ToString() + " is not supported.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    return;
                }
                Sects = new TExportSector[Global.Units.Global.TWXDatabase.DBHeader.Sectors];
                for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Sects[I - 1], sizeof(TExportSector));
                    Crc = Crc ^ GetCRC((Sects[I - 1]), sizeof(TExportSector));
                }
                if ((Crc != 0))
                {
                    MessageBox.Show("Error while importing this file.  It is either not a valid TWX export or it has been corrupted.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    return;
                }
                for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    S = Global.Units.Global.TWXDatabase.Sectors[I];
                    // Increment through import warps to see if they already exist
                    for (J = 1; J <= Sects[I - 1].warps; J ++ )
                    {
                        //@ Undeclared identifier(3): 'ntohl'
                        Focus = ImportTWXFile_BaseZero(ntohl(Sects[I - 1].warp_sect[J - 1]));
                        if ((Focus == 0))
                        {
                            break;
                        }
                        Exists = false;
                        for (K = 1; K <= 6; K ++ )
                        {
                            if ((S.Warps == 0) || (Focus > S.Warp[S.Warps]))
                            {
                                S.Warp[S.Warps + 1] = Focus;
                                S.Warps ++;
                                Exists = true;
                                break;
                            }
                            if ((S.Warp[K] == Focus))
                            {
                                Exists = true;
                                break;
                            }
                        }
                        if ((Exists == false))
                        {
                            // The imported warp was not known, so find where to insert it
                            K = 5;
                            while ((Focus < S.Warp[K]) || (S.Warp[K] == 0))
                            {
                                S.Warp[K + 1] = S.Warp[K];
                                K -= 1;
                                if ((K < 0))
                                {
                                    break;
                                }
                            }
                            S.Warp[K + 1] = Focus;
                        }
                    }
                    // If we have warps present, then the min Explored level is Calc
                    if ((S.Explored == DataBase.TSectorExploredType.etNo))
                    {
                        S.Explored = DataBase.TSectorExploredType.etCalc;
                    }
                    // go with the most up-to-date sector
                    //@ Undeclared identifier(3): 'ntohl'
                    if ((ImportTWXFile_BaseZero(ntohl(Sects[I - 1].sector_update)) == 0))
                    {
                        T = 0;
                    }
                    else
                    {
                        //@ Undeclared identifier(3): 'ntohl'
                        T = ConvertFromCTime(ntohl(Sects[I - 1].sector_update));
                    }
                    if ((T > S.UpDate) || !KeepRecent)
                    {
                        // import this sector into active database
                        S.Explored = DataBase.TSectorExploredType.etHolo;
                        if ((Sects[I - 1].info == 12))
                        {
                            // 12 = Port Destroyed
                            S.SPort.Dead = true;
                        }
                        else if ((Sects[I - 1].info == 10) || (Sects[I - 1].info > 12))
                        {
                            // 10 = No Port, > 12 = Under-Construction
                            S.SPort.Name = "";
                            S.SPort.ClassIndex = 0;
                            S.SPort.Dead = false;
                        }
                        else if ((Sects[I - 1].info == 11))
                        {
                            // 11 = Unexplored
                            // unexplored sector
                            //@ Undeclared identifier(3): 'ntohl'
                            if ((ntohl(Sects[I - 1].density) >= 0))
                            {
                                // if warps exist in either source, then min Explored level is Calc
                                S.Explored = DataBase.TSectorExploredType.etDensity;
                            }
                            else if ((Sects[I - 1].warps > 0) || (S.Warps > 0))
                            {
                                S.Explored = DataBase.TSectorExploredType.etCalc;
                            }
                            else
                            {
                                S.Explored = DataBase.TSectorExploredType.etNo;
                            }
                        }
                        else
                        {
                            if ((S.SPort.Name == ""))
                            {
                                S.SPort.Name = "???";
                            }
                            S.SPort.ClassIndex = Sects[I - 1].info;
                            if ((S.SPort.ClassIndex == 1))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                            }
                            else if ((S.SPort.ClassIndex == 2))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                            }
                            else if ((S.SPort.ClassIndex == 3))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                            }
                            else if ((S.SPort.ClassIndex == 4))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                            }
                            else if ((S.SPort.ClassIndex == 5))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                            }
                            else if ((S.SPort.ClassIndex == 6))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                            }
                            else if ((S.SPort.ClassIndex == 7))
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                            }
                            else
                            {
                                S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                                S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                            }
                        }
                        // Substitute zero for unknown (-1)
                        S.NavHaz = ImportTWXFile_BaseZero(Sects[I - 1].navhaz);
                        S.Figs.Owner = "Unknown";
                        //@ Undeclared identifier(3): 'ntohl'
                        S.Figs.Quantity = ntohl(Sects[I - 1].ftrs);
                        if ((Sects[I - 1].ftr_type == 1))
                        {
                            S.Figs.FigType = DataBase.TFighterType.ftToll;
                        }
                        else if ((Sects[I - 1].ftr_type == 2))
                        {
                            S.Figs.FigType = DataBase.TFighterType.ftOffensive;
                        }
                        else if ((Sects[I - 1].ftr_type == 3))
                        {
                            S.Figs.FigType = DataBase.TFighterType.ftDefensive;
                        }
                        else
                        {
                            S.Figs.FigType = DataBase.TFighterType.ftNone;
                        }
                        S.Mines_Armid.Owner = "Unknown";
                        //@ Undeclared identifier(3): 'ntohl'
                        if ((ntohl(Sects[I - 1].armids) ==  -1))
                        {
                            S.Mines_Armid.Quantity = 0;
                        }
                        else
                        {
                            //@ Undeclared identifier(3): 'ntohs'
                            S.Mines_Armid.Quantity = ntohs(Sects[I - 1].armids);
                        }
                        S.Mines_Limpet.Owner = "Unknown";
                        //@ Undeclared identifier(3): 'ntohl'
                        if ((ntohl(Sects[I - 1].limpets) ==  -1))
                        {
                            S.Mines_Limpet.Quantity = 0;
                        }
                        else
                        {
                            //@ Undeclared identifier(3): 'ntohs'
                            S.Mines_Limpet.Quantity = ntohs(Sects[I - 1].limpets);
                        }
                        //@ Unsupported function or procedure: 'Copy'
                        if ((S.Constellation == "") || (Copy(S.Constellation, 1, 3) == "???"))
                        {
                            S.Constellation = "???" + Ansi.Units.Ansi.ANSI_9 + " (data import only)";
                        }
                        S.Beacon = "";
                        S.UpDate = T;
                        if ((Sects[I - 1].anom <= 0))
                        {
                            S.Anomaly = false;
                        }
                        else
                        {
                            S.Anomaly = true;
                        }
                        //@ Undeclared identifier(3): 'ntohl'
                        S.Density = ntohl(Sects[I - 1].density);
                    }
                    //@ Undeclared identifier(3): 'ntohl'
                    if ((ImportTWXFile_BaseZero(ntohl(Sects[I - 1].port_update)) == 0))
                    {
                        T = 0;
                    }
                    else
                    {
                        //@ Undeclared identifier(3): 'ntohl'
                        T = ConvertFromCTime(ntohl(Sects[I - 1].port_update));
                    }
                    // Now import Port data based on Port Info Update Timestamp
                    if ((T > S.SPort.UpDate) || !KeepRecent)
                    {
                        S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre] = ImportTWXFile_BaseZero(Sects[I - 1].port_per[0]);
                        S.SPort.ProductPercent[DataBase.TProductType.ptOrganics] = ImportTWXFile_BaseZero(Sects[I - 1].port_per[1]);
                        S.SPort.ProductPercent[DataBase.TProductType.ptEquipment] = ImportTWXFile_BaseZero(Sects[I - 1].port_per[2]);
                        //@ Undeclared identifier(3): 'ntohl'
                        S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre] = ImportTWXFile_BaseZero(ntohl(Sects[I - 1].port_amt[0]));
                        //@ Undeclared identifier(3): 'ntohl'
                        S.SPort.ProductAmount[DataBase.TProductType.ptOrganics] = ImportTWXFile_BaseZero(ntohl(Sects[I - 1].port_amt[1]));
                        //@ Undeclared identifier(3): 'ntohl'
                        S.SPort.ProductAmount[DataBase.TProductType.ptEquipment] = ImportTWXFile_BaseZero(ntohl(Sects[I - 1].port_amt[2]));
                        S.SPort.UpDate = T;
                    }
                    Global.Units.Global.TWXDatabase.SaveSector(S, I, null, null, null);
                    Global.Units.Global.TWXDatabase.UpdateWarps(I);
                }
            } finally {
                _W_0.Close();
            }
        }

    } // end TWXExport

}

