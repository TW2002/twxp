using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using System.Windows.Forms;
using Core;
using Global;
using Utility;
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
 // This unit controls all database access.
namespace DataBase
{
    // Exceptions
    public class EDatabaseError: Exception
    {
        //@ Constructor auto-generated 
        public EDatabaseError(String message)
            :base(message)
        {
        }
        //@ Constructor auto-generated 
        public EDatabaseError(String message, Exception innerException)
            :base(message, innerException)
        {
        }
    } // end EDatabaseError

    // database records
    public struct TDataHeader
    {
        public string[] ProgramName;
        public byte Version;
        public ushort Sectors;
        public ushort StarDock;
        public ushort AlphaCentauri;
        public ushort Rylos;
        public string[] Address;
        public string[] Description;
        public ushort ServerPort;
        public ushort Port;
        public string[] LoginScript;
        public string[] Password;
        public string[] LoginName;
        public char Game;
        public bool UseLogin;
        public byte RobFactor;
        public byte StealFactor;
        public DateTime LastPortCIM;
    } // end TDataHeader

    public struct TSpaceObject
    {
        public int Quantity;
        public string[] Owner;
        public TFighterType FigType;
    } // end TSpaceObject

    public struct TTrader
    {
        public string[] Name;
        public string[] ShipType;
        public string[] ShipName;
        public int Figs;
        public int NextTrader;
    } // end TTrader

    public struct TShip
    {
        public string[] Name;
        public string[] Owner;
        public string[] ShipType;
        public int Figs;
        public int NextShip;
    } // end TShip

    public struct TPort
    {
        public string[] Name;
        public bool Dead;
        public byte BuildTime;
        public byte ClassIndex;
        public bool[] BuyProduct;
        public byte[] ProductPercent;
        public ushort[] ProductAmount;
        public DateTime UpDate;
    } // end TPort

    public struct TSector
    {
        // Index         : Word;
        public ushort[] Warp;
        public TPort SPort;
        public byte NavHaz;
        public TSpaceObject Figs;
        public TSpaceObject Mines_Armid;
        public TSpaceObject Mines_Limpet;
        public string[] Constellation;
        public string[] Beacon;
        public DateTime UpDate;
        public bool Anomaly;
        public int Density;
        public byte Warps;
        public TSectorExploredType Explored;
        public int Ships;
        public int Traders;
        public int Planets;
        public int Vars;
    } // end TSector

    public struct TPlanet
    {
        public string[] Name;
        public int NextPlanet;
    } // end TPlanet

    public struct TWarpIn
    {
        public ushort Origin;
        public TWarpIn NextWarpIn;
    } // end TWarpIn

    public struct TSectorVar
    {
        public string VarName;
        public string[] Value;
        public int NextVar;
    } // end TSectorVar

    public struct TEmptyRecordGroup
    {
        public ushort RecordSize;
        public int[] EmptyRecords;
    } // end TEmptyRecordGroup

    public class TModDatabase: TTWXModule, IModDatabase, ITWXGlobals
    {
        public TSector Sectors[int Index]
        {
          get {
            return LoadSector(Index);
          }
        }
        public bool DataBaseOpen
        {
          get {
            return FDataBaseOpen;
          }
        }
        public TDataHeader DBHeader
        {
          get {
            return FDBHeader;
          }
        }
        public DateTime LastPortCIM
        {
          get {
            return GetLastPortCIM();
          }
          set {
            SetLastPortCIM(value);
          }
        }
        public string DatabaseName
        {
          get {
            return GetDatabaseName();
          }
          set {
            SetDatabaseName(value);
          }
        }
        public bool UseCache
        {
          get {
            return GetUseCache();
          }
          set {
            SetUseCache(value);
          }
        }
        public bool Recording
        {
          get {
            return GetRecording();
          }
          set {
            SetRecording(value);
          }
        }
        public ushort ServerPort
        {
          get {
            return GetServerPort();
          }
          set {
            SetServerPort(value);
          }
        }
        private bool CacheAllocated = false;
        private bool FRecording = false;
        private bool FUseCache = false;
        private bool FDataBaseOpen = false;
        private ushort FListenPort = 0;
        private string FDataFilename = String.Empty;
        private System.IO.File DataFile = null;
        private object DataCache = null;
        private object SectorWarpCache = null;
        private int DBSize = 0;
        private int CacheSize = 0;
        private TEmptyRecordGroup[] EmptyRecordGroups;
        private TDataHeader FDBHeader = null;
        private string FProgramDir = String.Empty;
        private ushort[] EPWarpCache;
        private ushort[] Que;
        private ushort[] ReverseArray;
        private ushort[] SectorAsWord;
        private byte[] VoidArray;
        private byte[] CheckedArray;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        // ***********************************************************
        // Public Implementation
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            // initialise variables
            FDataBaseOpen = false;
            SectorWarpCache = null;
            FUseCache = true;
            FRecording = true;
        }

        public override void BeforeDestruction()
        {
            // ensure database is closed
            CloseDataBase();
            base.BeforeDestruction();
        }

        // ITWXGlobals
        protected string GetProgramDir()
        {
            string result;
            result = FProgramDir;
            return result;
        }

        protected void SetProgramDir(string Value)
        {
            FProgramDir = Value;
        }

        // DB control methods
        // ---------------------------
        // DB control methods
        public void OpenDataBase(string Filename)
        {
            int WarpCount;
            int I;
            int X;
            int Index;
            TSector S;
            if (DataBaseOpen)
            {
                return;
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Loading database: " + Ansi.Units.Ansi.ANSI_7 + Filename + Core.Units.Core.endl);
            FDataFilename = Filename;
            Environment.CurrentDirectory = FProgramDir;
            // Open database
            DataFile = new FileInfo(Filename);
            StreamReader _R_0 = DataFile.OpenText();
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_12 + "Warning: This database does not exist.  No data will be saved/retrieved" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                CloseDataBase();
                return;
            }
            // Check database validity and version number
            _R_0.BaseStream.Seek(0, SeekOrigin.Begin);
            //@ Unsupported function or procedure: 'BlockRead'
            BlockRead(DataFile, FDBHeader, sizeof(TDataHeader));
            if ((DBHeader.ProgramName != "TWX DATABASE"))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_12 + "Warning: This database has been corrupted, no data will be saved/retrieved" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                CloseDataBase();
                return;
            }
            if ((DBHeader.Version != Units.DataBase.DATABASE_VERSION))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_12 + "Warning: Database version " + (DBHeader.Version).ToString() + ", expected version " + (Units.DataBase.DATABASE_VERSION).ToString() + ", no data will be saved/retrieved" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                CloseDataBase();
                return;
            }
            FListenPort = DBHeader.ServerPort;
            // EP - Listening Port persists here now
            if (UseCache)
            {
                OpenCache();
            }
            else
            {
                CloseCache();
            }
            FDataBaseOpen = true;
            DBSize = _R_0.BaseStream.Length;
            // cache empty record indexes
            CacheEmptyRecords();
            // construct sector warp cache
            //@ Unsupported function or procedure: 'AllocMem'
            SectorWarpCache = AllocMem(DBHeader.Sectors * 4);
            WarpCount = 0;
            // create persistent structures used by getCourse
            EPWarpCache = new ushort[(DBHeader.Sectors + 1) * 7];
            Que = new ushort[DBHeader.Sectors + 1];
            ReverseArray = new ushort[DBHeader.Sectors + 1];
            VoidArray = new byte[DBHeader.Sectors + 1];
            CheckedArray = new byte[DBHeader.Sectors + 1];
            SectorAsWord = new ushort[DBHeader.Sectors + 1];
            for (I = 1; I <= DBHeader.Sectors; I ++ )
            {
                SectorAsWord[I] = I;
                S = Sectors[I];
                Index = I * 7;
                for (X = 1; X <= 6; X ++ )
                {
                    if ((S.Warp[X] > 0))
                    {
                        WarpCount ++;
                        AddWarpIn(S.Warp[X], I);
                        // Sector 1's warp count occupies [7], and it's warps occupy [8] - [13]
                        // Add one to the warp count
                        EPWarpCache[Index] ++;
                        EPWarpCache[Index + X] = S.Warp[X];
                    }
                    else
                    {
                        break;
                    }
                }
            }
            Global.Units.Global.TWXLog.DatabaseChanged();
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Database successfully loaded - " + (DBHeader.Sectors).ToString() + " sectors, " + (WarpCount).ToString() + " warps" + Core.Units.Core.endl);
            Global.Units.Global.TWXGUI.DatabaseName = Utility.Units.Utility.StripFileExtension(Utility.Units.Utility.ShortFilename(Filename));
        }

        public void CloseDataBase()
        {
            TWarpIn W;
            TWarpIn Last;
            object P;
            int I;
            int CacheEnd;
            if (!FDataBaseOpen)
            {
                return;
            }
            _R_0.Close();
            FDataBaseOpen = false;
            // deconstruct sector warp cache
            P = SectorWarpCache;
            CacheEnd = (int)P + DBHeader.Sectors * 4;
            while (((int)P < CacheEnd))
            {
                W = ((P) as TWarpIn);
                while ((W != null))
                {
                    Last = W;
                    W = W.NextWarpIn;
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(Last);
                }
                P = ((int)P + sizeof(object) as object);
            }
            // purge old empty record caches
            if ((EmptyRecordGroups.Length > 0))
            {
                for (I = 0; I < EmptyRecordGroups.Length; I ++ )
                {
                    EmptyRecordGroups[I].EmptyRecords = new int[0];
                }
            }
            EmptyRecordGroups = new TEmptyRecordGroup[0];
            // purge persistent arrays used for course plotting
            EPWarpCache = new ushort[0];
            Que = new ushort[0];
            ReverseArray = new ushort[0];
            VoidArray = new byte[0];
            CheckedArray = new byte[0];
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(SectorWarpCache);
            CloseCache();
            FDataFilename = "";
        }

        public void CreateDatabase(string Filename, TDataHeader Head)
        {
            int I;
            TSector Sect;
            System.IO.File F;
            bool FileOpen;
            // Make a database - it doesn't exist
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Creating database: " + Ansi.Units.Ansi.ANSI_7 + Filename + Ansi.Units.Ansi.ANSI_15 + " (" + (Head.Sectors).ToString() + ')' + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
            Environment.CurrentDirectory = FProgramDir;
            FileOpen = false;
            try {
                F = new FileInfo(Filename);
                _W_0 = F.CreateText();
                FileOpen = true;
                //@ Unsupported function or procedure: 'BlockWrite'
                BlockWrite(F, Head, sizeof(TDataHeader));
                NULLSector(ref Sect);
                for (I = 0; I <= Head.Sectors; I ++ )
                {
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Sect, sizeof(Sect));
                }
            } finally {
                if (FileOpen)
                {
                    _W_0.Close();
                }
            }
        }

        // main storage/retrieval methods
        // ---------------------------
        // main storage/retrieval methods
        public void SaveSector(TSector S, int Index, ArrayList ShipList, ArrayList TraderList, ArrayList PlanetList)
        {
            TSector Sect;
            int I;
            int J;
            int X;
            bool Bad;
            bool Found;
            ArrayList WarpsIn;
            TProductType Product;
            // Save this sector to file if set to record data
            if (Recording && DataBaseOpen)
            {
                Bad = (Index < 1) || (Index > DBHeader.Sectors);
                I = 1;
                while (!Bad && (I <= 6))
                {
                    if ((S.Warp[I] > DBHeader.Sectors))
                    {
                        Bad = true;
                    }
                    I ++;
                }
                if (Bad)
                {
                    //@ Unsupported property or method(C): 'Handle'
                    //@ Unsupported function or procedure: 'SetForegroundWindow'
                    SetForegroundWindow(Application.Handle);
                    Global.Units.Global.TWXServer.ClientMessage("Unable to store sector \'" + (Index).ToString() + "\', closing database.");
                    CloseDataBase();
                    return;
                }
                ReadData(Sect, Index * sizeof(TSector) + sizeof(TDataHeader), sizeof(Sect));
                // If this sector has been probed, recall warps if seen before
                if ((S.Warp[1] == 0) && (Sect.Warp[1] != 0))
                {
                    S.Warp = Sect.Warp;
                }
                // Don't go over density or Anomaly readings unless this is a density scan
                if ((S.Density ==  -1))
                {
                    S.Density = Sect.Density;
                    S.Anomaly = Sect.Anomaly;
                }
                // Don't go over port details unless they are specified
                if ((S.SPort.UpDate == 0))
                {
                    S.SPort.UpDate = Sect.SPort.UpDate;
                    //@ Unsupported function: 'Low'
                    //@ Unsupported function: 'High'
                    for (Product = Low(TProductType); Product <= High(TProductType); Product ++ )
                    {
                        S.SPort.ProductAmount[Product] = Sect.SPort.ProductAmount[Product];
                        S.SPort.ProductPercent[Product] = Sect.SPort.ProductPercent[Product];
                    }
                }
                // save stardock details if this sector has it
                if ((S.SPort.ClassIndex == 9) && (Sect.SPort.ClassIndex != 9))
                {
                    FDBHeader.StarDock = Index;
                    WriteHeader();
                }
                // save Alpha Centauri and Rylos details if this sector has them
                if ((S.SPort.ClassIndex == 0))
                {
                    if ((S.SPort.Name == "Alpha Centauri"))
                    {
                        FDBHeader.AlphaCentauri = Index;
                        WriteHeader();
                    }
                    else if ((S.SPort.Name == "Rylos"))
                    {
                        FDBHeader.Rylos = Index;
                        WriteHeader();
                    }
                }
                // save sector parameters if any exist
                if ((S.Vars == 0) && (Sect.Vars != 0))
                {
                    S.Vars = Sect.Vars;
                }
                // -1 is returned when the last sector param is deleted
                if ((S.Vars ==  -1))
                {
                    S.Vars = 0;
                }
                // update sector warp count
                S.Warps = 6;
                for (I = 1; I <= 6; I ++ )
                {
                    if ((S.Warp[I] == 0))
                    {
                        S.Warps = I - 1;
                        break;
                    }
                }
                // Purge old ship, trader and planet data
                if ((ShipList != null))
                {
                    PurgeRecordList(Sect.Ships);
                    // Write the ships to file
                    S.Ships = WriteRecordList(ShipList, sizeof(TShip));
                }
                if ((TraderList != null))
                {
                    PurgeRecordList(Sect.Traders);
                    // Write the traders to file
                    S.Traders = WriteRecordList(TraderList, sizeof(TTrader));
                }
                if ((PlanetList != null))
                {
                    PurgeRecordList(Sect.Planets);
                    // Write the planets to file
                    S.Planets = WriteRecordList(PlanetList, sizeof(TPlanet));
                }
                // write sector to database
                WriteData(S, Index * sizeof(TSector) + sizeof(TDataHeader), sizeof(TSector));
                // Update sector warp cache with new specs (if need be)
                J = Index * 7;
                // Pointer to update the EPWarpCache
                for (I = 1; I <= 6; I ++ )
                {
                    if ((S.Warp[I] > 0))
                    {
                        EPWarpCache[J] = I;
                        // Update warp count
                        EPWarpCache[J + I] = S.Warp[I];
                        // Update warp
                        WarpsIn = GetWarpsIn(S.Warp[I]);
                        // see if its in there already
                        X = 0;
                        Found = false;
                        while ((X < WarpsIn.Count))
                        {
                            if ((((WarpsIn[X]) as TWarpIn).Origin == Index))
                            {
                                Found = true;
                                break;
                            }
                            X ++;
                        }
                        //@ Unsupported property or method(C): 'Free'
                        WarpsIn.Free;
                        if (!Found)
                        {
                            AddWarpIn(S.Warp[I], Index);
                        }
                    }
                    else
                    {
                        break;
                    }
                }
            }
        }

        public void SaveSector(TSector S, int Index)
        {
            SaveSector(S, Index, null);
        }

        public void SaveSector(TSector S, int Index, ArrayList ShipList)
        {
            SaveSector(S, Index, ShipList, null);
        }

        public void SaveSector(TSector S, int Index, ArrayList ShipList, ArrayList TraderList)
        {
            SaveSector(S, Index, ShipList, TraderList, null);
        }

        public TSector LoadSector(int I)
        {
            TSector result;
            if ((I <= 0) || (I > DBHeader.Sectors))
            {
                throw new EDatabaseError("Unable to load sector: " + (I).ToString());
            }
            if (!DataBaseOpen)
            {
                // no database or database is corrupt - load a blank sector
                NULLSector(ref result);
            }
            else
            {
                ReadData(result, I * sizeof(TSector) + sizeof(TDataHeader), sizeof(TSector));
            }
            return result;
        }

        public void UpdateWarps(int SectIndex)
        {
            int I;
            TSector S;
            // find out how many warps there are going out of this sector
            S = Sectors[SectIndex];
            I = 1;
            while ((I <= 6))
            {
                if ((S.Warp[I] == 0))
                {
                    break;
                }
                I ++;
            }
            S.Warps = I;
            SaveSector(S, SectIndex, null, null, null);
        }

        public ArrayList GetSectorItems(TSectorItem ItemType, TSector Sector)
        {
            ArrayList result;
            result = new ArrayList();
            if (!DataBaseOpen)
            {
                // no database or database is corrupt
                return result;
            }
            if ((ItemType == TSectorItem.itPlanet))
            {
                ReadRecordList(result, Sector.Planets);
            }
            else if ((ItemType == TSectorItem.itTrader))
            {
                ReadRecordList(result, Sector.Traders);
            }
            else if ((ItemType == TSectorItem.itShip))
            {
                ReadRecordList(result, Sector.Ships);
            }
            return result;
        }

        public ArrayList GetWarpsIn(int Sect)
        {
            ArrayList result;
            TWarpIn W;
            result = new ArrayList();
            if (!DataBaseOpen)
            {
                return result;
            }
            W = ((((int)SectorWarpCache + (Sect - 1) * 4 as object)) as TWarpIn);
            while ((W != null))
            {
                result.Add(W);
                //@ Unsupported property or method(D): 'NextWarpIn'
                W = W.NextWarpIn;
            }
            return result;
        }

        public ArrayList GetBackDoors(TSector S, int SectorIndex)
        {
            ArrayList result;
            int I;
            TWarpIn W;
            ushort Sect;
            ArrayList WarpsIn;
            WarpsIn = GetWarpsIn(SectorIndex);
            result = new ArrayList();
            if (!DataBaseOpen)
            {
                // no database or database is corrupt
                return result;
            }
            I = 0;
            while ((I < WarpsIn.Count))
            {
                W = ((WarpsIn[I]) as TWarpIn);
                if (!(Units.DataBase.WarpsTo(S, W.Origin)))
                {
                    //@ Unsupported function or procedure: 'AllocMem'
                    Sect = AllocMem(sizeof(ushort));
                    Sect = W.Origin;
                    result.Add(Sect);
                }
                I ++;
            }
            //@ Unsupported property or method(C): 'Free'
            WarpsIn.Free;
            return result;
        }

        public void ClearPlotArrays()
        {
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(Que[0], (DBHeader.Sectors + 1) * sizeof(ushort));
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(ReverseArray[0], (DBHeader.Sectors + 1) * sizeof(ushort));
        }

        public List<string> QueArrayToStringList()
        {
            List<string> result;
            int I;
            result = new List<string>();
            for (I = 1; I <= Que[0]; I ++ )
            {
                result.Add((Que[I]).ToString());
            }
            return result;
        }

        public void CoursesToTLists(ref ArrayList[] CourseLists)
        {
            // Size = DBHeader.Sectors
            int I;
            ushort Reverse;
            for (I = 0; I < DBHeader.Sectors; I ++ )
            {
                CourseLists[I] = new ArrayList();
                CourseLists[I].Add(SectorAsWord[I + 1]);
                Reverse = ReverseArray[I + 1];
                while ((Reverse > 0))
                {
                    CourseLists[I].Add(SectorAsWord[Reverse]);
                    Reverse = ReverseArray[Reverse];
                }
            }
        }

        public ArrayList PlotWarpCourse(int FromSect, int ToSect)
        {
            ArrayList result;
            ushort Top;
            ushort Bottom;
            ushort PFocusWarp;
            ushort Count;
            ushort Focus;
            ushort Adjacent;
            ushort I;
            int CacheIndex;
            result = new ArrayList();
            //@ Undeclared identifier(3): 'CopyMemory'
            CopyMemory(CheckedArray[1], VoidArray[1], DBHeader.Sectors);
            CheckedArray[FromSect] = 1;
            ReverseArray[FromSect] = 0;
            Count = Que[0];
            // Use the first element of Que to track it's current count
            Count = 1;
            Top = Que[1];
            Top = FromSect;
            Bottom = Top;
            while ((Bottom <= Top))
            {
                Focus = Bottom;
                CacheIndex = Focus * 7;
                PFocusWarp = EPWarpCache[CacheIndex + 1];
                for (I = 1; I <= EPWarpCache[CacheIndex]; I ++ )
                {
                    Adjacent = PFocusWarp;
                    if (!(Adjacent > 0))
                    {
                        break;
                    }
                    if ((CheckedArray[Adjacent] == 0))
                    {
                        ReverseArray[Adjacent] = Focus;
                        if ((Adjacent == ToSect))
                        {
                            while ((Adjacent > 0))
                            {
                                // There's a persistent array, SectorAsWord, where the Value
                                // matches the Index (Eg. SectorAsWord[100] = 100)
                                result.Add(SectorAsWord[Adjacent]);
                                Adjacent = ReverseArray[Adjacent];
                            }
                            return result;
                        }
                        CheckedArray[Adjacent] = 1;
                        Top ++;
                        Top = Adjacent;
                        Count ++;
                    }
                    PFocusWarp ++;
                }
                Bottom ++;
            }
            return result;
        }

        public void SetVoid(int SectorIndex)
        {
            VoidArray[SectorIndex] = 1;
        }

        public void UnsetVoid(int SectorIndex)
        {
            VoidArray[SectorIndex] = 0;
        }

        public void UnsetAllVoids()
        {
            int I;
            for (I = 0; I <= DBHeader.Sectors; I ++ )
            {
                // iterates SECTORS + 1 times
                VoidArray[I] = 0;
            }
        }

        public ArrayList VoidList()
        {
            ArrayList result;
            ushort I;
            result = new ArrayList();
            for (I = 1; I <= DBHeader.Sectors; I ++ )
            {
                // So we start at 1 instead of zero
                if ((VoidArray[I] == 1))
                {
                    result.Add(SectorAsWord[I]);
                }
            }
            return result;
        }

        public void WriteHeader()
        {
            if (!DataBaseOpen)
            {
                // no database or database is corrupt
                return;
            }
            // update the DB header in file and cache
            WriteData(DBHeader, 0, sizeof(TDataHeader));
        }

        public void DumpData()
        {
            int Next;
            int Pos;
            ushort Size;
            byte InUse;
            string InUseStr;
            // dump stored records
            Pos = sizeof(TSector) * (DBHeader.Sectors + 1) + sizeof(TDataHeader);
            while ((Pos < DBSize))
            {
                ReadData(Size, Pos, 2);
                ReadData(InUse, Pos + 2, 1);
                ReadData(Next, Pos + 3, 4);
                if ((InUse != 0))
                {
                    InUseStr = "YES";
                }
                else
                {
                    InUseStr = "NO";
                }
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "In use: " + Ansi.Units.Ansi.ANSI_14 + InUseStr);
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Size: " + Ansi.Units.Ansi.ANSI_14 + (Size).ToString());
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Next: " + Ansi.Units.Ansi.ANSI_14 + (Next).ToString() + Core.Units.Core.endl);
                Pos += Size + 7;
            }
        }

        public void SetSectorVar(int SectorIndex, string VarName, string VarValue)
        {
            TSectorVar SectorVar;
            int VarOffset;
            if ((VarValue == ""))
            {
                DeleteSectorVar(SectorIndex, VarName);
            }
            else
            {
                FindSectorVar(SectorIndex, VarName, ref SectorVar, ref VarOffset);
                if ((SectorVar != null))
                {
                    try {
                        // Record already exists - write over the Value part of it
                        SectorVar.Value = VarValue;
                        // 7 Bytes record overhead + 10 bytes var name in record
                        WriteRecord(SectorVar, VarOffset, 0, sizeof(TSectorVar));
                    } finally {
                        //@ Unsupported function or procedure: 'FreeMem'
                        FreeMem(SectorVar);
                    }
                }
                else
                {
                    // Record doesn't exist - create a new one
                    //@ Unsupported function or procedure: 'AllocMem'
                    SectorVar = AllocMem(sizeof(TSectorVar));
                    try {
                        SectorVar.VarName = VarName;
                        SectorVar.Value = VarValue;
                        AddSectorVar(SectorIndex, SectorVar);
                    } finally {
                        //@ Unsupported function or procedure: 'FreeMem'
                        FreeMem(SectorVar);
                    }
                }
            }
        }

        public string GetSectorVar(int SectorIndex, string VarName)
        {
            string result;
            TSectorVar SectorVar;
            int VarOffset;
            // return value of this sector variable
            FindSectorVar(SectorIndex, VarName, ref SectorVar, ref VarOffset);
            if ((SectorVar != null))
            {
                try {
                    result = SectorVar.Value;
                } finally {
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(SectorVar);
                }
            }
            else
            {
                result = "";
            }
            return result;
        }

        // null item retrieval
        // ---------------------------
        // null item retrieval
        public void NULLSector(ref object Sector)
        {
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(Sector, sizeof(Sector));
            //@ Unsupported property or method(D): 'Density'
            Sector.Density =  -1;
        }

        public void NULLPlanet(ref object Planet)
        {
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(Planet, sizeof(Planet));
        }

        public void NULLTrader(ref object Trader)
        {
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(Trader, sizeof(Trader));
        }

        public void NULLShip(ref object Ship)
        {
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(Ship, sizeof(Ship));
        }

        // ***********************************************************
        // Protected Implementation
        private void AddSectorVar(int SectorIndex, TSectorVar SectorVar)
        {
            const int RecordSize = sizeof(TSectorVar);
            int RecPos;
            int LastRecord;
            int ThisRecord;
            TSector S;
            TSectorVar PSecVar;
            // seek the end of the sector variable list for this sector and add the variable
            ThisRecord = Sectors[SectorIndex].Vars;
            if ((ThisRecord == 0))
            {
                // update sector directly (no variables yet)
                RecPos = GetEmptyRecord(RecordSize);
                S = Sectors[SectorIndex];
                S.Vars = RecPos;
                SaveSector(S, SectorIndex);
                WriteRecord(SectorVar, RecPos, 0, RecordSize);
            }
            else
            {
                //@ Unsupported function or procedure: 'AllocMem'
                PSecVar = AllocMem(RecordSize);
                try {
                    do
                    {
                    // Find the first record in the list where .NextVar is empty
                        ReadData(PSecVar, ThisRecord + 7, RecordSize);
                        LastRecord = ThisRecord;
                        ThisRecord = PSecVar.NextVar;
                    } while (!((ThisRecord == 0)));
                    // Now add this Var to the end of the list
                    RecPos = GetEmptyRecord(RecordSize);
                    PSecVar.NextVar = RecPos;
                    WriteRecord(SectorVar, RecPos, 0, RecordSize);
                    // And update the NextVar field in the previous record
                    WriteRecord(PSecVar, LastRecord, 0, RecordSize);
                } finally {
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(PSecVar);
                }
            }
        }

        private void FindSectorVar(int SectorIndex, string VarName, ref TSectorVar SectorVar, ref int Index)
        {
            const int RecordSize = sizeof(TSectorVar);
            int NextRecord;
            // Locate a sector variable of the specific name within the database, returning
            // a pointer to a record representing it in memory, and the index of its position
            // within the database.
            NextRecord = Sectors[SectorIndex].Vars;
            Index = 0;
            //@ Unsupported function or procedure: 'AllocMem'
            SectorVar = AllocMem(RecordSize);
            try {
                while ((NextRecord > 0))
                {
                    ReadData(SectorVar, NextRecord + 7, RecordSize);
                    if ((SectorVar.VarName == VarName))
                    {
                        Index = NextRecord;
                        break;
                    }
                    NextRecord = SectorVar.NextVar;
                }
            } finally {
                if ((Index == 0))
                {
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(SectorVar);
                    SectorVar = null;
                }
            }
        }

        public List<string> ListDatabases()
        {
            List<string> result;
            TSearchRec S;
            bool FileOpen;
            bool Errored;
            TDataHeader Head;
            System.IO.File F;
            string Sectors;
            string Name;
            // display all items in 'data\' directory
            result = new List<string>();
            Environment.CurrentDirectory = FProgramDir;
            //@ Unsupported function or procedure: 'FindFirst'
            if ((FindFirst("data\\*.xdb", 0x0000003f, S) == 0))
            {
                do
                {
                    Errored = false;
                    FileOpen = false;
                    try {
                        //@ Unsupported property or method(C): 'Name'
                        F = new FileInfo("data\\" + S.Name);
                        StreamReader _R_1 = F.OpenText();
                        FileOpen = true;
                        //@ Unsupported function or procedure: 'BlockRead'
                        BlockRead(F, Head, sizeof(TDataHeader));
                    }
                    catch {
                        Errored = true;
                    }
                    if (FileOpen)
                    {
                        _W_0.Close();
                    }
                    if (!Errored && (Head.ProgramName == "TWX DATABASE") && (Head.Version == Units.DataBase.DATABASE_VERSION))
                    {
                        //@ Unsupported property or method(C): 'Name'
                        Name = Utility.Units.Utility.StripFileExtension(S.Name);
                        Sectors = (Head.Sectors).ToString();
                        result.Add(Name + '(' + Sectors + ')' + Core.Units.Core.endl);
                    }
                    //@ Unsupported function or procedure: 'FindNext'
                } while (!((FindNext(S) != 0)));
                //@ Unsupported function or procedure: 'FindClose'
                FindClose(S);
            }
            return result;
        }

        public List<string> ListSectorVars(int SectorIndex)
        {
            List<string> result;
            const int RecordSize = sizeof(TSectorVar);
            int NextRecord;
            TSectorVar SectorVar;
            int I;
            result = new List<string>();
            NextRecord = Sectors[SectorIndex].Vars;
            //@ Unsupported function or procedure: 'AllocMem'
            SectorVar = AllocMem(RecordSize);
            try {
                I = 0;
                while ((NextRecord > 0))
                {
                    I ++;
                    if ((I > 13))
                    {
                        break;
                    }
                    ReadData(SectorVar, NextRecord + 7, RecordSize);
                    if ((SectorVar.VarName != ""))
                    {
                        result.Add(SectorVar.VarName);
                    }
                    NextRecord = SectorVar.NextVar;
                }
            } finally {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(SectorVar);
            }
            return result;
        }

        // function LoadSectorVar(SectorIndex: Integer; VarName: string) : PSectorVar;
        private void DeleteSectorVar(int SectorIndex, string VarName)
        {
            const int RecordSize = sizeof(TSectorVar);
            int LastRecord;
            int ThisRecord;
            int NextRecord;
            TSector S;
            TSectorVar SectorVar;
            byte InUse;
            // Find the sector var with a matching name and unlink it from the list,
            // flagging it as inactive.
            ThisRecord = Sectors[SectorIndex].Vars;
            LastRecord = 0;
            //@ Unsupported function or procedure: 'AllocMem'
            SectorVar = AllocMem(RecordSize);
            try {
                while ((ThisRecord != 0))
                {
                    ReadData(SectorVar, ThisRecord + 7, RecordSize);
                    if ((SectorVar.VarName == VarName))
                    {
                        if ((LastRecord == 0))
                        {
                            // This sector is root, update it
                            NextRecord = SectorVar.NextVar;
                            if ((NextRecord == 0))
                            {
                                NextRecord =  -1;
                            }
                            S = Sectors[SectorIndex];
                            S.Vars = NextRecord;
                            SaveSector(S, SectorIndex);
                        }
                        else
                        {
                            // We need to tag this record as empty
                            InUse = 0;
                            WriteData(InUse, ThisRecord + 2, 1);
                            // Now link before and after Vars
                            NextRecord = SectorVar.NextVar;
                            // The following would replace the next 3 lines: WriteRecord(@NextRecord, LastRecord + 57, 4);
                            ReadData(SectorVar, LastRecord + 7, RecordSize);
                            SectorVar.NextVar = NextRecord;
                            WriteRecord(SectorVar, LastRecord, 0, RecordSize);
                            break;
                        }
                    }
                    LastRecord = ThisRecord;
                    ThisRecord = SectorVar.NextVar;
                }
            } finally {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(SectorVar);
            }
        }

        private void AddWarpIn(ushort Sect, ushort Origin)
        {
            object P;
            TWarpIn W;
            //@ Unsupported function or procedure: 'AllocMem'
            W = AllocMem(sizeof(TWarpIn));
            W.Origin = Origin;
            // hook the new warp into this sector's warpin list
            P = ((int)SectorWarpCache + (Sect - 1) * sizeof(object) as object);
            W.NextWarpIn = ((P) as TWarpIn);
            (P as object) = W;
        }

        private int GetEmptyRecord(int Size)
        {
            int result;
            int I;
            // EP - Looks like we need to plug in some data, so look for a record slot of the right size
            result = DBSize;
            I = 0;
            while ((I < EmptyRecordGroups.Length))
            {
                if ((EmptyRecordGroups[I].RecordSize == Size))
                {
                    if ((EmptyRecordGroups[I].EmptyRecords.Length > 0))
                    {
                        result = EmptyRecordGroups[I].EmptyRecords[EmptyRecordGroups[I].EmptyRecords.Length - 1];
                        // Grab the last one in this array
                        EmptyRecordGroups[I].EmptyRecords = new int[EmptyRecordGroups[I].EmptyRecords.Length - 1];
                    // Shorten the array by 1
                    }
                    break;
                // EP - If Result wasn't set just now, use DBSize, set earlier.
                }
                I ++;
            }
            return result;
        }

        private void CacheEmptyRecords()
        {
            int Pos;
            ushort Size;
            byte InUse;
            // go through and find all empty records, storing them.
            Pos = sizeof(TSector) * (DBHeader.Sectors + 1) + sizeof(TDataHeader);
            while ((Pos < DBSize))
            {
                ReadData(Size, Pos, 2);
                ReadData(InUse, Pos + 2, 1);
                if ((InUse == 0))
                {
                    CacheEmptyRecord(Pos, Size);
                }
                Pos += Size + 7;
            }
        }

        private void CacheEmptyRecord(int Index, ushort Size)
        {
            int I;
            bool Found;
            // loop through record cache lists, add record to a list matching its size
            Found = false;
            I = 0;
            while ((I < EmptyRecordGroups.Length))
            {
                if ((EmptyRecordGroups[I].RecordSize == Size))
                {
                    Found = true;
                    break;
                }
                I ++;
            }
            if (!Found)
            {
                I = EmptyRecordGroups.Length;
                EmptyRecordGroups = new TEmptyRecordGroup[I + 1];
                EmptyRecordGroups[I].RecordSize = Size;
            }
            EmptyRecordGroups[I].EmptyRecords = new int[EmptyRecordGroups[I].EmptyRecords.Length + 1];
            EmptyRecordGroups[I].EmptyRecords[EmptyRecordGroups[I].EmptyRecords.Length - 1] = Index;
        }

        private void ReadRecordList(ArrayList List, int FirstPos)
        {
            int NextRecord;
            ushort RecordSize;
            object Rec;
            NextRecord = FirstPos;
            while ((NextRecord != 0))
            {
                ReadData(RecordSize, NextRecord, 2);
                //@ Unsupported function or procedure: 'AllocMem'
                Rec = AllocMem(RecordSize);
                ReadData(Rec, NextRecord + 7, RecordSize);
                List.Add(Rec);
                ReadData(NextRecord, NextRecord + 3, 4);
            }
        }

        private int WriteRecordList(ArrayList List, ushort RecordSize)
        {
            int result;
            int I;
            int Pos;
            int LastPos;
            result = 0;
            if ((List != null))
            {
                if ((List.Count > 0))
                {
                    LastPos = 0;
                    for (I = List.Count - 1; I >= 0; I-- )
                    {
                        // Find the nearest zeroed record (or EOF)
                        Pos = GetEmptyRecord(RecordSize);
                        // Write it in
                        WriteRecord(List[I], Pos, LastPos, RecordSize);
                        LastPos = Pos;
                    }
                    result = LastPos;
                }
            }
            return result;
        }

        private void PurgeRecordList(int FirstPos)
        {
            int NextRecord;
            byte InUse;
            ushort Size;
            NextRecord = FirstPos;
            InUse = 0;
            while ((NextRecord != 0))
            {
                ReadData(Size, NextRecord, 2);
                CacheEmptyRecord(NextRecord, Size);
                WriteData(InUse, NextRecord + 2, 1);
                ReadData(NextRecord, NextRecord + 3, 4);
            }
        }

        private void WriteRecord(object Rec, int Pos, int Next, ushort Size)
        {
            byte InUse;
            // Comments by EP
            WriteData(Size, Pos, 2);
            // The first 2 bytes of a record hold the record size
            InUse = 1;
            WriteData(InUse, Pos + 2, 1);
            // The third byte is a boolean for the InUse property
            WriteData(Next, Pos + 3, 4);
            // Bytes 4 through 7 hold an Integer pointing to the next record (for ships, planets, traders, but no longer for Sector Parameters)
            WriteData(Rec, Pos + 7, Size);
            // Total overhead = 7 bytes, so the data begins at byte 8

        }

        private void ReadData(object Data, int Index, int Size)
        {
            if (UseCache)
            {
                // cache enabled - read data directly from data cache
                //@ Undeclared identifier(3): 'CopyMemory'
                CopyMemory(Data, ((int)DataCache + Index as object), Size);
            }
            else
            {
                // cache disabled - read data from file
                _R_0.BaseStream.Seek(Index, SeekOrigin.Begin);
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(DataFile, Data, Size);
            }
        }

        private void WriteData(object Data, int Index, int Size)
        {
            object DataIndex;
            string CurDatabase;
            if (UseCache)
            {
                if ((Index + Size > CacheSize))
                {
                    // increase cache size
                    try {
                        CacheSize += 50000;
                        //@ Unsupported function or procedure: 'ReallocMem'
                        ReallocMem(DataCache, CacheSize);
                    }
                    catch {
                        UseCache = false;
                        CurDatabase = FDataFilename;
                        Global.Units.Global.TWXServer.ClientMessage("Not enough free memory available for cache extensions - database cache disabled");
                        CloseDataBase();
                        OpenDataBase(CurDatabase);
                        WriteData(Data, Index, Size);
                        return;
                    }
                }
                DataIndex = ((int)DataCache + Index as object);
                // compare memory with cached data
                //@ Unsupported function or procedure: 'CompareMem'
                if (!(CompareMem(DataIndex, Data, Size)))
                {
                    // data is different - update data cache and file
                    //@ Undeclared identifier(3): 'CopyMemory'
                    CopyMemory(DataIndex, Data, Size);
                    _R_0.BaseStream.Seek(Index, SeekOrigin.Begin);
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(DataFile, Data, Size);
                    DBSize = _R_0.BaseStream.Length;
                }
            }
            else
            {
                // write data directly to file
                _R_0.BaseStream.Seek(Index, SeekOrigin.Begin);
                //@ Unsupported function or procedure: 'BlockWrite'
                BlockWrite(DataFile, Data, Size);
                DBSize = _R_0.BaseStream.Length;
            }
        }

        private void OpenCache()
        {
            // load the database into cache
            if (CacheAllocated)
            {
                CloseCache();
            }
            try {
                CacheSize = _R_0.BaseStream.Length + 50000;
                //@ Unsupported function or procedure: 'AllocMem'
                DataCache = AllocMem(CacheSize);
                CacheAllocated = true;
                _R_0.BaseStream.Seek(0, SeekOrigin.Begin);
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(DataFile, DataCache, _R_0.BaseStream.Length);
            }
            catch {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_12 + "Error while caching database, database cache has been disabled" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                UseCache = false;
            }
        }

        private void CloseCache()
        {
            // release data cache
            if (!CacheAllocated)
            {
                return;
            }
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(DataCache, CacheSize);
            CacheSize = 0;
            CacheAllocated = false;
        }

        // IModDatabase
        protected string GetDatabaseName()
        {
            string result;
            result = FDataFilename;
            return result;
        }

        protected void SetDatabaseName(string Value)
        {
            if ((Value != FDataFilename))
            {
                CloseDataBase();
                OpenDataBase(Value);
            }
        }

        protected bool GetUseCache()
        {
            bool result;
            result = FUseCache;
            return result;
        }

        protected void SetUseCache(bool Value)
        {
            if ((FUseCache != Value))
            {
                FUseCache = Value;
                if (FUseCache)
                {
                    OpenCache();
                }
                else
                {
                    CloseCache();
                }
            }
        }

        protected bool GetRecording()
        {
            bool result;
            result = FRecording;
            return result;
        }

        protected void SetRecording(bool Value)
        {
            FRecording = Value;
            Global.Units.Global.TWXGUI.Recording = Value;
        }

        private ushort GetServerPort()
        {
            ushort result;
            result = FListenPort;
            return result;
        }

        private void SetServerPort(ushort Value)
        {
            FListenPort = Value;
            FDBHeader.ServerPort = Value;
        }

        private DateTime GetLastPortCIM()
        {
            DateTime result;
            result = DBHeader.LastPortCIM;
            return result;
        }

        private void SetLastPortCIM(DateTime Value)
        {
            FDBHeader.LastPortCIM = Value;
        }

    } // end TModDatabase

    public class TWarpItem
    {
        public ushort Index = 0;
        public TWarpItem Parent = null;
    } // end TWarpItem

    // Version for 2.03 is 7
    // Version for 2.04 is 8
    // Enumerated types
    public enum TFighterType
    {
        ftToll,
        ftDefensive,
        ftOffensive,
        ftNone
    } // end TFighterType

    public enum TSectorExploredType
    {
        etNo,
        etCalc,
        etDensity,
        etHolo
    } // end TSectorExploredType

    public enum TProductType
    {
        ptFuelOre,
        ptOrganics,
        ptEquipment
    } // end TProductType

    public enum TSectorItem
    {
        itPlanet,
        itTrader,
        itShip
    } // end TSectorItem

}

namespace DataBase.Units
{
    public class DataBase
    {
        // Version for 2.03 is 7
        // Version for 2.04 is 8
        public const int DATABASE_VERSION = 8;
        public static string[] Day = {"Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"};
        public static bool WarpsTo(TSector Source, int DestIndex)
        {
            bool result;
            result = (Source.Warp[1] == DestIndex) || (Source.Warp[2] == DestIndex) || (Source.Warp[3] == DestIndex) || (Source.Warp[4] == DestIndex) || (Source.Warp[5] == DestIndex) || (Source.Warp[6] == DestIndex);
            return result;
        }

        public static TDataHeader GetBlankHeader()
        {
            TDataHeader result;
            //@ Unsupported function or procedure: 'AllocMem'
            result = AllocMem(sizeof(TDataHeader));
            //@ Undeclared identifier(3): 'ZeroMemory'
            ZeroMemory(result, sizeof(TDataHeader));
            //@ Unsupported property or method(D): 'ProgramName'
            result.ProgramName = "TWX DATABASE";
            //@ Unsupported property or method(D): 'Version'
            result.Version = DATABASE_VERSION;
            //@ Unsupported property or method(D): 'Address'
            result.Address = "<Server>";
            //@ Unsupported property or method(D): 'Port'
            result.Port = 23;
            //@ Unsupported property or method(D): 'ServerPort'
            result.ServerPort = 23;
            return result;
        }

    } // end DataBase

}

