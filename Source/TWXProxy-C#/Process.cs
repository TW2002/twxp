using System;
using System.Collections;
using System.Collections.Generic;
using Core;
using Observer;
using DataBase;
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
 // This unit controls all processing and recording of data
namespace Process
{
    public class TModExtractor: TTWXModule, IModExtractor
    {
        public string CurrentLine
        {
          get {
            return FCurrentLine;
          }
          set {
            FCurrentLine = value;
          }
        }
        public string CurrentANSILine
        {
          get {
            return FCurrentANSILine;
          }
          set {
            FCurrentANSILine = value;
          }
        }
        public string RawANSILine
        {
          get {
            return FRawANSILine;
          }
          set {
            FRawANSILine = value;
          }
        }
        public int CurrentSector
        {
          get {
            return FCurrentSectorIndex;
          }
        }
        public char MenuKey
        {
          get {
            return GetMenuKey();
          }
          set {
            SetMenuKey(value);
          }
        }
        private int FCurrentSectorIndex = 0;
        private int FPortSectorIndex = 0;
        private int FFigScanSector = 0;
        private TSectorPosition FSectorPosition;
        private TDisplay FCurrentDisplay;
        private int FLastWarp = 0;
        private bool FSectorSaved = false;
        private TTrader FCurrentTrader = null;
        private TShip FCurrentShip = null;
        private string FCurrentMessage = String.Empty;
        private ArrayList FTraderList = null;
        private ArrayList FShipList = null;
        private ArrayList FPlanetList = null;
        private string FCurrentLine = String.Empty;
        private string FCurrentANSILine = String.Empty;
        private string FRawANSILine = String.Empty;
        private TSector FCurrentSector = null;
        private bool FInAnsi = false;
        private char FMenuKey = (char)0;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            // Create lists to store ships, traders and planets
            FShipList = new ArrayList();
            FTraderList = new ArrayList();
            FPlanetList = new ArrayList();
            MenuKey = '$';
        }

        public override void BeforeDestruction()
        {
            ResetSectorLists();
            //@ Unsupported property or method(C): 'Free'
            FShipList.Free;
            //@ Unsupported property or method(C): 'Free'
            FTraderList.Free;
            //@ Unsupported property or method(C): 'Free'
            FPlanetList.Free;
            base.BeforeDestruction();
        }

        public void Reset()
        {
            // Reset state values
            CurrentLine = "";
            CurrentANSILine = "";
            RawANSILine = "";
            FInAnsi = false;
            ResetSectorLists();
        }

        protected char GetMenuKey()
        {
            char result;
            result = FMenuKey;
            return result;
        }

        protected void SetMenuKey(char Value)
        {
            FMenuKey = Value;
        }

        // ********************************************************************
        // Process inbound data
        private void ResetSectorLists()
        {
            // Reset all ship, planet and trader lists
            while ((FShipList.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(FShipList[0], sizeof(TShip));
                FShipList.RemoveAt(0);
            }
            while ((FPlanetList.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(FPlanetList[0], sizeof(TPlanet));
                FPlanetList.RemoveAt(0);
            }
            while ((FTraderList.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(FTraderList[0], sizeof(TTrader));
                FTraderList.RemoveAt(0);
            }
        }

        private void SectorCompleted()
        {
            int I;
            int WarpIndex;
            if ((FCurrentSectorIndex == 0))
            {
                return;
            }
            FCurrentSector.UpDate = DateTime.Now;
            FCurrentSector.Explored = DataBase.TSectorExploredType.etHolo;
            FSectorSaved = true;
            WarpIndex = 0;
            for (I = 1; I <= 6; I ++ )
            {
                if ((FCurrentSector.Warp[I] == 0))
                {
                    WarpIndex = I;
                    break;
                }
            }
            if ((WarpIndex == 0))
            {
                FCurrentSector.Warps = 0;
            }
            else if ((FCurrentSector.Warp[WarpIndex] == 0))
            {
                FCurrentSector.Warps = WarpIndex - 1;
            }
            else
            {
                FCurrentSector.Warps = 6;
            }
            Global.Units.Global.TWXDatabase.SaveSector(FCurrentSector, FCurrentSectorIndex, FShipList, FTraderList, FPlanetList);
            ResetSectorLists();
        }

        private void ProcessPrompt(string Line)
        {
            // This procedure checks command prompts.  It is called from both
            // processline and processinbound, as it can come in as part of
            // a large packet or still be waiting for the user.
            if ((Line.Substring(1 - 1 ,12) == "Command [TL="))
            {
                // Save current sector if not done already
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                // Record Current Sector Index
                FCurrentSectorIndex = Utility.Units.Utility.StrToIntSafe(Line.Substring(24 - 1 ,('('.IndexOf(Line) - 26)));
                // No displays anymore, all done
                FCurrentDisplay = TDisplay.dNone;
                FLastWarp = 0;
            }
            else if ((Line.Substring(1 - 1 ,23) == "Probe entering sector :") || (Line.Substring(1 - 1 ,20) == "Probe Self Destructs"))
            {
                // mid probe - save the sector
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                // No displays anymore, all done
                FCurrentDisplay = TDisplay.dNone;
            }
            else if ((Line.Substring(1 - 1 ,21) == "Computer command [TL="))
            {
                // in computer prompt, kill all displays and clear warp data
                FCurrentDisplay = TDisplay.dNone;
                FLastWarp = 0;
                // Record Current Sector Index to SysConstant CURRENTSECTOR
                FCurrentSectorIndex = Utility.Units.Utility.StrToIntSafe(Line.Substring(33 - 1 ,('('.IndexOf(Line) - 35)));
            }
            else if ((Line.Substring(1 - 1 ,25) == "Citadel treasury contains"))
            {
                // In Citadel - Save current sector if not done already
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                // No displays anymore, all done
                FCurrentDisplay = TDisplay.dNone;
            }
            else if ((Line.Substring(1 - 1 ,19) == "Stop in this sector") || (Line.Substring(1 - 1 ,21) == "Engage the Autopilot?"))
            {
                // Save current sector if not done already
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                // No displays anymore, all done
                FCurrentDisplay = TDisplay.dNone;
            }
            else if ((Line.Substring(1 - 1 ,2) == ": "))
            {
                // at the CIM prompt
                if ((FCurrentDisplay != TDisplay.dCIM))
                {
                    FCurrentDisplay = TDisplay.dNone;
                }
                FLastWarp = 0;
            }
            Global.Units.Global.TWXInterpreter.TextEvent(CurrentLine, false);
        }

        private void AddWarp(int SectNum, int Warp)
        {
            TSector S;
            int I;
            int X;
            int Pos;
            // Used by ProcessWarpLine to add a warp to a sector
            S = Global.Units.Global.TWXDatabase.Sectors[SectNum];
            // see if the warp is already in there
            for (I = 1; I <= 6; I ++ )
            {
                if ((S.Warp[I] == Warp))
                {
                    return;
                }
            }
            // find where it should fit
            Pos = 7;
            for (I = 1; I <= 6; I ++ )
            {
                if ((S.Warp[I] > Warp) || (S.Warp[I] == 0))
                {
                    Pos = I;
                    break;
                }
            }
            if ((Pos == 1))
            {
                X = 2;
            }
            else
            {
                X = Pos;
            }
            // move them all up one
            if ((Pos < 6))
            {
                for (I = 6; I >= X; I-- )
                {
                    S.Warp[I] = S.Warp[I - 1];
                }
            }
            if ((Pos < 7))
            {
                S.Warp[Pos] = Warp;
            }
            if ((S.Explored == DataBase.TSectorExploredType.etNo))
            {
                S.Constellation = "???" + Ansi.Units.Ansi.ANSI_9 + " (warp calc only)";
                S.Explored = DataBase.TSectorExploredType.etCalc;
                S.UpDate = DateTime.Now;
            }
            Global.Units.Global.TWXDatabase.SaveSector(S, SectNum, null, null, null);
        }

        private void ProcessWarpLine(string Line)
        {
            int I;
            int CurSect;
            int LastSect;
            // S        : String;
            List<string> Sectors;
            // A WarpLine is a line of warps plotted using the ship's computer.  Add new warps to
            // any sectors listed in the warp lane (used extensively for ZTM).
            // e.g:  3 > 300 > 5362 > 13526 > 149 > 434
            LastSect = FLastWarp;
            Utility.Units.Utility.StripChar(ref Line, ')');
            Utility.Units.Utility.StripChar(ref Line, '(');
            Utility.Units.Utility.Split(Line, ref Sectors, " >");
            for (I = 0; I < Sectors.Count; I ++ )
            {
                CurSect = Utility.Units.Utility.StrToIntSafe(Sectors[I]);
                if ((CurSect < 1) || (CurSect > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                {
                    return;
                }
                if ((LastSect > 0))
                {
                    AddWarp(LastSect, CurSect);
                }
                LastSect = CurSect;
                FLastWarp = CurSect;
            }
            // 
            // I := 1;
            // S := GetParameter(Line, I);
            // 
            // while (S <> '') do
            // begin
            // if (S <> '>') then
            // begin
            // CurSect := StrToIntSafe(S);
            // 
            // if (CurSect < 1) or (CurSect > TWXDatabase.DBHeader.Sectors) then
            // // doesn't look like this line is what we thought it was.
            // // Best to leave it alone
            // exit;
            // 
            // if (LastSect > 0) then
            // AddWarp(LastSect, CurSect);
            // 
            // LastSect := CurSect;
            // FLastWarp := CurSect;
            // end;
            // 
            // Inc(I);
            // S := GetParameter(Line, I);
            // end;
            // 

        }

        public int ProcessCIMLine_GetCIMValue(string M, int Num)
        {
            int result;
            string S;
            S = Utility.Units.Utility.GetParameter(M, Num);
            if ((S == ""))
            {
                result = 0;
            }
            else
            {
                try {
                    result = Convert.ToInt32(S);
                }
                catch {
                    result =  -1;
                }
            }
            return result;
        }

        private void ProcessCIMLine(string Line)
        {
            int Sect;
            TSector S;
            int X;
            int I;
            int Len;
            int Ore;
            int Org;
            int Equip;
            int POre;
            int POrg;
            int PEquip;
            string M;
            if ((FCurrentDisplay == TDisplay.dWarpCIM))
            {
                // save warp CIM data
                Sect = ProcessCIMLine_GetCIMValue(Line, 1);
                if ((Sect <= 0) || (Sect > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                {
                    FCurrentDisplay = TDisplay.dNone;
                    return;
                }
                S = Global.Units.Global.TWXDatabase.Sectors[Sect];
                for (I = 1; I <= 6; I ++ )
                {
                    X = ProcessCIMLine_GetCIMValue(Line, I + 1);
                    if ((X < 0) || (X > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                    {
                        FCurrentDisplay = TDisplay.dNone;
                        return;
                    }
                    else
                    {
                        S.Warp[I] = X;
                    }
                }
                if ((S.Explored == DataBase.TSectorExploredType.etNo))
                {
                    S.Constellation = "???" + Ansi.Units.Ansi.ANSI_9 + " (warp calc only)";
                    S.Explored = DataBase.TSectorExploredType.etCalc;
                    S.UpDate = DateTime.Now;
                }
                Global.Units.Global.TWXDatabase.SaveSector(S, Sect, null, null, null);
            }
            else
            {
                // save port CIM data
                Sect = ProcessCIMLine_GetCIMValue(Line, 1);
                Len = (Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length;
                if ((Sect <= 0) || (Sect > Global.Units.Global.TWXDatabase.DBHeader.Sectors) || (Line.Length < Len + 36))
                {
                    FCurrentDisplay = TDisplay.dNone;
                    return;
                }
                M = Line.Replace('-', "");
                M = M.Replace('%', "");
                S = Global.Units.Global.TWXDatabase.Sectors[Sect];
                Ore = ProcessCIMLine_GetCIMValue(M, 2);
                Org = ProcessCIMLine_GetCIMValue(M, 4);
                Equip = ProcessCIMLine_GetCIMValue(M, 6);
                POre = ProcessCIMLine_GetCIMValue(M, 3);
                POrg = ProcessCIMLine_GetCIMValue(M, 5);
                PEquip = ProcessCIMLine_GetCIMValue(M, 7);
                if ((Ore < 0) || (Org < 0) || (Equip < 0) || (POre < 0) || (POre > 100) || (POrg < 0) || (POrg > 100) || (PEquip < 0) || (PEquip > 100))
                {
                    FCurrentDisplay = TDisplay.dNone;
                    return;
                }
                S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre] = Ore;
                S.SPort.ProductAmount[DataBase.TProductType.ptOrganics] = Org;
                S.SPort.ProductAmount[DataBase.TProductType.ptEquipment] = Equip;
                S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre] = POre;
                S.SPort.ProductPercent[DataBase.TProductType.ptOrganics] = POrg;
                S.SPort.ProductPercent[DataBase.TProductType.ptEquipment] = PEquip;
                S.SPort.UpDate = DateTime.Now;
                if ((S.SPort.Name == ""))
                {
                    // port not saved/seen before - get its details
                    if ((Line[Len + 2] == '-'))
                    {
                        S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                    }
                    else
                    {
                        S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                    }
                    if ((Line[Len + 14] == '-'))
                    {
                        S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                    }
                    else
                    {
                        S.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                    }
                    if ((Line[Len + 26] == '-'))
                    {
                        S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                    }
                    else
                    {
                        S.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                    }
                    if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && (S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && (S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 8;
                    }
                    else if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && (S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 1;
                    }
                    else if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && (S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 2;
                    }
                    else if (!(S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && (S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && (S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 3;
                    }
                    else if (!(S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && (S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 4;
                    }
                    else if (!(S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && (S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 5;
                    }
                    else if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 6;
                    }
                    else if (!(S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]) && !(S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        S.SPort.ClassIndex = 7;
                    }
                    S.SPort.Name = "???";
                }
                if ((S.Explored == DataBase.TSectorExploredType.etNo))
                {
                    S.Constellation = "???" + Ansi.Units.Ansi.ANSI_9 + " (port data/calc only)";
                    S.Explored = DataBase.TSectorExploredType.etCalc;
                    S.UpDate = DateTime.Now;
                }
                Global.Units.Global.TWXDatabase.SaveSector(S, Sect, null, null, null);
            }
        }

        private void ProcessSectorLine(string Line)
        {
            string S;
            int I;
            TPlanet NewPlanet;
            TShip NewShip;
            TTrader NewTrader;
            if ((Line.Substring(1 - 1 ,10) == "Beacon  : "))
            {
                // Get beacon text
                FCurrentSector.Beacon = Line.Substring(11 - 1 ,Line.Length - 10);
            }
            else if ((Line.Substring(1 - 1 ,10) == "Ports   : "))
            {
                // Save port data
                if ((Line.IndexOf("<=-DANGER-=>") > 0))
                {
                    // Port is destroyed
                    FCurrentSector.SPort.Dead = true;
                }
                else
                {
                    FCurrentSector.SPort.Dead = false;
                    FCurrentSector.SPort.BuildTime = 0;
                    FCurrentSector.SPort.Name = Line.Substring(11 - 1 ,Line.IndexOf(", Class") - 11);
                    FCurrentSector.SPort.ClassIndex = Utility.Units.Utility.StrToIntSafe(Line.Substring(Line.IndexOf(", Class") + 8 - 1 ,1));
                    if ((Line[Line.Length - 3] == 'B'))
                    {
                        FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                    }
                    else
                    {
                        FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                    }
                    if ((Line[Line.Length - 2] == 'B'))
                    {
                        FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                    }
                    else
                    {
                        FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                    }
                    if ((Line[Line.Length - 1] == 'B'))
                    {
                        FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                    }
                    else
                    {
                        FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                    }
                }
                FSectorPosition = TSectorPosition.spPorts;
            }
            else if ((Line.Substring(1 - 1 ,10) == "Planets : "))
            {
                // Get planet data
                //@ Unsupported function or procedure: 'AllocMem'
                NewPlanet = AllocMem(sizeof(TPlanet));
                Global.Units.Global.TWXDatabase.NULLPlanet(ref NewPlanet);
                NewPlanet.Name = Line.Substring(11 - 1 ,Line.Length - 10);
                FPlanetList.Add(NewPlanet);
                FSectorPosition = TSectorPosition.spPlanets;
            }
            else if ((Line.Substring(1 - 1 ,10) == "Traders : "))
            {
                // Save traders
                I = Line.IndexOf(", w/");
                FCurrentTrader.Name = Line.Substring(11 - 1 ,I - 11);
                S = Line.Substring(I + 5 - 1 ,Line.IndexOf(" ftrs") - I - 5);
                Utility.Units.Utility.StripChar(ref S, ',');
                FCurrentTrader.Figs = Utility.Units.Utility.StrToIntSafe(S);
                FSectorPosition = TSectorPosition.spTraders;
            }
            else if ((Line.Substring(1 - 1 ,10) == "Ships   : "))
            {
                // Save ships
                I = Line.IndexOf("[Owned by]");
                FCurrentShip.Name = Line.Substring(11 - 1 ,I - 12);
                FCurrentShip.Owner = Line.Substring(I + 11 - 1 ,Line.IndexOf(", w/") - I - 11);
                I = Line.IndexOf(", w/");
                S = Line.Substring(I + 5 - 1 ,Line.IndexOf(" ftrs,") - I - 5);
                Utility.Units.Utility.StripChar(ref S, ',');
                FCurrentShip.Figs = Utility.Units.Utility.StrToIntSafe(S);
                FSectorPosition = TSectorPosition.spShips;
            }
            else if ((Line.Substring(1 - 1 ,10) == "Fighters: "))
            {
                // Get fig details
                S = Utility.Units.Utility.GetParameter(Line, 2);
                Utility.Units.Utility.StripChar(ref S, ',');
                FCurrentSector.Figs.Quantity = Utility.Units.Utility.StrToIntSafe(S);
                I = Utility.Units.Utility.GetParameterPos(Line, 3) + 1;
                FCurrentSector.Figs.Owner = Line.Substring(I - 1 ,Line.IndexOf(')') - I);
                if ((Line.Substring(Line.Length - 5 - 1 ,6) == "[Toll]"))
                {
                    FCurrentSector.Figs.FigType = DataBase.TFighterType.ftToll;
                }
                else if ((Line.Substring(Line.Length - 10 - 1 ,11) == "[Defensive]"))
                {
                    FCurrentSector.Figs.FigType = DataBase.TFighterType.ftDefensive;
                }
                else
                {
                    FCurrentSector.Figs.FigType = DataBase.TFighterType.ftOffensive;
                }
            }
            else if ((Line.Substring(1 - 1 ,10) == "NavHaz  : "))
            {
                S = Utility.Units.Utility.GetParameter(Line, 3);
                S = S.Substring(1 - 1 ,S.Length - 1);
                FCurrentSector.NavHaz = Utility.Units.Utility.StrToIntSafe(S);
            }
            else if ((Line.Substring(1 - 1 ,10) == "Mines   : "))
            {
                // Save mines
                FSectorPosition = TSectorPosition.spMines;
                I = Utility.Units.Utility.GetParameterPos(Line, 7) + 1;
                S = Line.Substring(I - 1 ,Line.Length - I);
                if ((Utility.Units.Utility.GetParameter(Line, 6) == "Armid)"))
                {
                    FCurrentSector.Mines_Armid.Quantity = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 3));
                    FCurrentSector.Mines_Armid.Owner = S;
                }
                else
                {
                    FCurrentSector.Mines_Limpet.Quantity = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 3));
                    FCurrentSector.Mines_Limpet.Owner = S;
                }
            }
            else if ((Line.Substring(1 - 1 ,8) == "        "))
            {
                // Continue from last occurance
                if ((FSectorPosition == TSectorPosition.spMines))
                {
                    I = Utility.Units.Utility.GetParameterPos(Line, 6) + 1;
                    FCurrentSector.Mines_Limpet.Quantity = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 2));
                    FCurrentSector.Mines_Limpet.Owner = Line.Substring(I - 1 ,Line.Length - I);
                }
                else if ((FSectorPosition == TSectorPosition.spPorts))
                {
                    FCurrentSector.SPort.BuildTime = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 4));
                }
                else if ((FSectorPosition == TSectorPosition.spPlanets))
                {
                    // Get planet data
                    //@ Unsupported function or procedure: 'AllocMem'
                    NewPlanet = AllocMem(sizeof(TPlanet));
                    Global.Units.Global.TWXDatabase.NULLPlanet(ref NewPlanet);
                    //@ Unsupported property or method(D): 'Name'
                    NewPlanet.Name = Line.Substring(11 - 1 ,Line.Length - 10);
                    FPlanetList.Add(NewPlanet);
                }
                else if ((FSectorPosition == TSectorPosition.spTraders))
                {
                    if ((Utility.Units.Utility.GetParameter(Line, 1) == "in"))
                    {
                        // Still working on one trader
                        //@ Unsupported function or procedure: 'AllocMem'
                        NewTrader = AllocMem(sizeof(TTrader));
                        I = Utility.Units.Utility.GetParameterPos(Line, 2);
                        NewTrader.ShipName = Line.Substring(I - 1 ,Line.IndexOf('(') - I - 1);
                        I = Line.IndexOf('(');
                        NewTrader.ShipType = Line.Substring(I + 1 - 1 ,Line.IndexOf(')') - I - 1);
                        NewTrader.Name = FCurrentTrader.Name;
                        NewTrader.Figs = FCurrentTrader.Figs;
                        FTraderList.Add(NewTrader);
                    }
                    else
                    {
                        // New trader
                        I = Line.IndexOf(", w/");
                        FCurrentTrader.Name = Line.Substring(11 - 1 ,I - 11);
                        S = Line.Substring(I + 5 - 1 ,Line.IndexOf(" ftrs") - I - 5);
                        Utility.Units.Utility.StripChar(ref S, ',');
                        FCurrentTrader.Figs = Utility.Units.Utility.StrToIntSafe(S);
                    }
                }
                else if ((FSectorPosition == TSectorPosition.spShips))
                {
                    if ((Line.Substring(12 - 1 ,1) == '('))
                    {
                        // Get the rest of the ship info
                        //@ Unsupported function or procedure: 'AllocMem'
                        NewShip = AllocMem(sizeof(TShip));
                        NewShip.Name = FCurrentShip.Name;
                        NewShip.Owner = FCurrentShip.Owner;
                        NewShip.Figs = FCurrentShip.Figs;
                        NewShip.ShipType = Line.Substring(13 - 1 ,Line.IndexOf(')') - 13);
                        FShipList.Add(NewShip);
                    }
                    else
                    {
                        // New ship
                        I = Line.IndexOf("[Owned by]");
                        FCurrentShip.Name = Line.Substring(11 - 1 ,I - 12);
                        FCurrentShip.Owner = Line.Substring(I + 11 - 1 ,Line.IndexOf(", w/") - I - 11);
                        I = Line.IndexOf(", w/");
                        S = Line.Substring(I + 5 - 1 ,Line.IndexOf(" ftrs,") - I - 5);
                        Utility.Units.Utility.StripChar(ref S, ',');
                        FCurrentShip.Figs = Utility.Units.Utility.StrToIntSafe(S);
                        FSectorPosition = TSectorPosition.spShips;
                    }
                }
            }
            else if ((Line.Substring(9 - 1 ,1) == ':'))
            {
                FSectorPosition = TSectorPosition.spNormal;
            }
            else if ((Line.Substring(1 - 1 ,20) == "Warps to Sector(s) :"))
            {
                Utility.Units.Utility.StripChar(ref Line, '(');
                Utility.Units.Utility.StripChar(ref Line, ')');
                // Get sector warps
                FCurrentSector.Warp[1] = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 5));
                FCurrentSector.Warp[2] = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 7));
                FCurrentSector.Warp[3] = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 9));
                FCurrentSector.Warp[4] = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 11));
                FCurrentSector.Warp[5] = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 13));
                FCurrentSector.Warp[6] = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 15));
                // sector done
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                // No displays anymore, all done
                FCurrentDisplay = TDisplay.dNone;
                FSectorPosition = TSectorPosition.spNormal;
            }
        }

        private void ProcessPortLine(string Line)
        {
            string PortClass;
            string StatFuel;
            string StatOrg;
            string StatEquip;
            int QtyFuel;
            int QtyOrg;
            int QtyEquip;
            int PercFuel;
            int PercOrg;
            int PercEquip;
            // Process a line after Docking... or from a CR report
            // By including the space after 'for' we avoid the problem with CR reports on Class 0's
            if ((Line.Substring(1 - 1 ,20) == "Commerce report for "))
            {
                // Get the Port Name
                FCurrentSector.SPort.Name = Line.Substring(21 - 1 ,':'.IndexOf(Line) - 21);
            }
            else if ((Line.Substring(1 - 1 ,8) == "Fuel Ore") && (Line.Substring(33 - 1 ,1) == '%'))
            {
                // Grab the data from the Fuel Ore line in the Port Report
                Line = Line.Replace('%', "");
                StatFuel = Utility.Units.Utility.GetParameter(Line, 3);
                QtyFuel = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 4));
                PercFuel = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 5));
                if ((StatFuel == "Buying"))
                {
                    FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = true;
                }
                else
                {
                    FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptFuelOre] = false;
                }
                FCurrentSector.SPort.ProductAmount[DataBase.TProductType.ptFuelOre] = QtyFuel;
                FCurrentSector.SPort.ProductPercent[DataBase.TProductType.ptFuelOre] = PercFuel;
            }
            else if ((Line.Substring(1 - 1 ,8) == "Organics") && (Line.Substring(33 - 1 ,1) == '%'))
            {
                // Grab the data from the Organics line in the Port Report
                Line = Line.Replace('%', "");
                StatOrg = Utility.Units.Utility.GetParameter(Line, 2);
                QtyOrg = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 3));
                PercOrg = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 4));
                if ((StatOrg == "Buying"))
                {
                    FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = true;
                }
                else
                {
                    FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptOrganics] = false;
                }
                FCurrentSector.SPort.ProductAmount[DataBase.TProductType.ptOrganics] = QtyOrg;
                FCurrentSector.SPort.ProductPercent[DataBase.TProductType.ptOrganics] = PercOrg;
            }
            else if ((Line.Substring(1 - 1 ,9) == "Equipment") && (Line.Substring(33 - 1 ,1) == '%'))
            {
                // Grab the data from the Equipment line in the Port Report
                Line = Line.Replace('%', "");
                StatEquip = Utility.Units.Utility.GetParameter(Line, 2);
                QtyEquip = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 3));
                PercEquip = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 4));
                if ((StatEquip == "Buying"))
                {
                    FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = true;
                }
                else
                {
                    FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptEquipment] = false;
                }
                FCurrentSector.SPort.ProductAmount[DataBase.TProductType.ptEquipment] = QtyEquip;
                FCurrentSector.SPort.ProductPercent[DataBase.TProductType.ptEquipment] = PercEquip;
                // All Products have been seen, so process the data
                // Timestamp the Port data
                FCurrentSector.SPort.UpDate = DateTime.Now;
                // Only determine the class if it's unknown (-1)
                if (!(FCurrentSector.SPort.ClassIndex > 0))
                {
                    if ((FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]))
                    {
                        PortClass = 'B';
                    }
                    else
                    {
                        PortClass = 'S';
                    }
                    if ((FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptOrganics]))
                    {
                        PortClass = PortClass + 'B';
                    }
                    else
                    {
                        PortClass = PortClass + 'S';
                    }
                    if ((FCurrentSector.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        PortClass = PortClass + 'B';
                    }
                    else
                    {
                        PortClass = PortClass + 'S';
                    }
                    if ((PortClass == "BBS"))
                    {
                        FCurrentSector.SPort.ClassIndex = 1;
                    }
                    else if ((PortClass == "BSB"))
                    {
                        FCurrentSector.SPort.ClassIndex = 2;
                    }
                    else if ((PortClass == "SBB"))
                    {
                        FCurrentSector.SPort.ClassIndex = 3;
                    }
                    else if ((PortClass == "SSB"))
                    {
                        FCurrentSector.SPort.ClassIndex = 4;
                    }
                    else if ((PortClass == "SBS"))
                    {
                        FCurrentSector.SPort.ClassIndex = 5;
                    }
                    else if ((PortClass == "BSS"))
                    {
                        FCurrentSector.SPort.ClassIndex = 6;
                    }
                    else if ((PortClass == "SSS"))
                    {
                        FCurrentSector.SPort.ClassIndex = 7;
                    }
                    else if ((PortClass == "BBB"))
                    {
                        FCurrentSector.SPort.ClassIndex = 8;
                    }
                }
                if ((FCurrentSector.Explored == DataBase.TSectorExploredType.etNo))
                {
                    // We're updating the Port data for a previously unseen sector.
                    FCurrentSector.Constellation = "???" + Ansi.Units.Ansi.ANSI_9 + " (port data/calc only)";
                    FCurrentSector.Explored = DataBase.TSectorExploredType.etCalc;
                }
                // That's all of the product info, so save it now
                FCurrentSector.SPort.UpDate = DateTime.Now;
                Global.Units.Global.TWXDatabase.SaveSector(FCurrentSector, FPortSectorIndex, null, null, null);
            }
        }

        private void ProcessFigScanLine(string Line)
        {
            int SectorNum;
            int FigQty;
            int Code;
            int Multiplier;
            string SFigAmount;
            string SFigType;
            string SFigOwner;
            TSector Sect;
            char TMB;
            // process and record the Fig Scan Info.  specifically parse and record this line:
            // 940           1       Personal    Defensive            N/A
            // 10T Total
            if ((Line.Substring(1 - 1 ,20) == "No fighters deployed"))
            {
                ResetFigDatabase();
            }
            // no fighters in G list anymore, have to reset database.
            //@ Unsupported function or procedure: 'Val'
            Val(Utility.Units.Utility.GetParameter(Line, 1), SectorNum, Code);
            if ((Code != 0))
            {
                return;
            }
            Sect = Global.Units.Global.TWXDatabase.Sectors[SectorNum];
            SFigOwner = Utility.Units.Utility.GetParameter(Line, 3);
            if ((SFigOwner == "Personal"))
            {
                Sect.Figs.Owner = "yours";
            }
            else
            {
                Sect.Figs.Owner = "belong to your Corp";
            }
            // work on figuring out how many fighters are displayed
            SFigAmount = Utility.Units.Utility.GetParameter(Line, 2);
            SFigAmount.Replace(',', "");
            //@ Unsupported function or procedure: 'Val'
            Val(SFigAmount, FigQty, Code);
            if (Code != 0)
            {
                Multiplier = 0;
                TMB = SFigAmount[Code];
                switch(TMB)
                {
                    case 'T':
                        Multiplier = 1000;
                        break;
                    case 'M':
                        Multiplier = 1000000;
                        break;
                    case 'B':
                        Multiplier = 1000000000;
                        break;
                }
                // Approximate figs
                FigQty = FigQty * Multiplier;
                // See if previously recorded fig amount is within the margin of rounding
                if ((Sect.Figs.Quantity < (FigQty - Multiplier / 2)) || (Sect.Figs.Quantity > (FigQty + Multiplier / 2)))
                {
                    Sect.Figs.Quantity = FigQty;
                }
            }
            else
            {
                Sect.Figs.Quantity = FigQty;
            }
            // pull fig type from the FigScan line
            SFigType = Utility.Units.Utility.GetParameter(Line, 4);
            // Get Fig Type, then assign the right FigType value
            if ((SFigType == "Defensive"))
            {
                Sect.Figs.FigType = DataBase.TFighterType.ftDefensive;
            }
            else if ((SFigType == "Toll"))
            {
                Sect.Figs.FigType = DataBase.TFighterType.ftToll;
            }
            else
            {
                Sect.Figs.FigType = DataBase.TFighterType.ftOffensive;
            }
            // save the change.
            Global.Units.Global.TWXDatabase.SaveSector(Sect, SectorNum, null, null, null);
        }

        // ProcessFigScanLine(String)
        private void ResetFigDatabase()
        {
            int i;
            TSector Sect;
            // reset fighter owner, type, and quantity for sectors where our figs are thought to be
            for (i = 11; i <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; i ++ )
            {
                if ((i != Global.Units.Global.TWXDatabase.DBHeader.StarDock))
                {
                    Sect = Global.Units.Global.TWXDatabase.Sectors[i];
                    Sect.Figs.Quantity = 0;
                    if ((Sect.Figs.Owner == "yours") || (Sect.Figs.Owner == "belong to your Corp"))
                    {
                        Sect.Figs.Owner = "";
                        Sect.Figs.FigType = DataBase.TFighterType.ftNone;
                        Sect.Figs.Quantity = 0;
                        Global.Units.Global.TWXDatabase.SaveSector(Sect, i, null, null, null);
                    }
                }
            }
        }

        private void ProcessLine(string Line)
        {
            string S;
            string X;
            int I;
            TSector Sect;
            // Every line is passed to this procedure to be processed and recorded
            if ((FCurrentMessage != ""))
            {
                if ((Line != ""))
                {
                    if ((FCurrentMessage == "Figs"))
                    {
                        Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htFighter, DateTime.Now.ToString() + "  " + Utility.Units.Utility.StripChars(Line));
                    }
                    else if ((FCurrentMessage == "Comp"))
                    {
                        Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htComputer, DateTime.Now.ToString() + "  " + Utility.Units.Utility.StripChars(Line));
                    }
                    else
                    {
                        Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htMsg, DateTime.Now.ToString() + "  " + Utility.Units.Utility.StripChars(Line));
                    }
                    FCurrentMessage = "";
                }
            }
            else if ((Line.Substring(1 - 1 ,2) == "R ") || (Line.Substring(1 - 1 ,2) == "F "))
            {
                Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htMsg, DateTime.Now.ToString() + "  " + Utility.Units.Utility.StripChars(Line));
            }
            else if ((Line.Substring(1 - 1 ,2) == "P "))
            {
                if ((Utility.Units.Utility.GetParameter(Line, 2) != "indicates"))
                {
                    Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htMsg, DateTime.Now.ToString() + "  " + Utility.Units.Utility.StripChars(Line));
                }
            }
            else if ((Line.Substring(1 - 1 ,26) == "Incoming transmission from") || (Line.Substring(1 - 1 ,28) == "Continuing transmission from"))
            {
                // Transmission with ansi off
                I = Utility.Units.Utility.GetParameterPos(Line, 4);
                if ((Line.Substring(Line.Length - 9 - 1 ,10) == "comm-link:"))
                {
                    // Fedlink
                    FCurrentMessage = "F " + Line.Substring(I - 1 ,Line.IndexOf(" on Federation") - I) + ' ';
                }
                else if ((Utility.Units.Utility.GetParameter(Line, 5) == "Fighters:"))
                {
                    // Fighters
                    FCurrentMessage = "Figs";
                }
                else if ((Utility.Units.Utility.GetParameter(Line, 5) == "Computers:"))
                {
                    // Computer
                    FCurrentMessage = "Comp";
                }
                else if ((Line.IndexOf(" on channel ") != 0))
                {
                    // Radio
                    FCurrentMessage = "R " + Line.Substring(I - 1 ,Line.IndexOf(" on channel ") - I) + ' ';
                }
                else
                {
                    // hail
                    FCurrentMessage = "P " + Line.Substring(I - 1 ,Line.Length - I) + ' ';
                }
            }
            else if ((Line.Substring(1 - 1 ,31) == "Deployed Fighters Report Sector"))
            {
                Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htFighter, DateTime.Now.ToString() + "  " + Line.Substring(19 - 1 ,Line.Length));
            }
            else if ((Line.Substring(1 - 1 ,20) == "Shipboard Computers "))
            {
                Global.Units.Global.TWXGUI.AddToHistory(Core.THistoryType.htComputer, DateTime.Now.ToString() + "  " + Line.Substring(21 - 1 ,Line.Length));
            }
            else if ((Line.Substring(14 - 1 ,8) == "StarDock") && (Line.Substring(37 - 1 ,6) == "sector"))
            {
                // Capture Stardock from the 'V' Screen.  Beacon & Constellation are assumed,
                // but will be updated when the sector is finally visited.
                I = Utility.Units.Utility.StrToIntSafe(Line.Substring(44 - 1 ,'.'.IndexOf(Line) - 44));
                if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                {
                    if ((Global.Units.Global.TWXDatabase.DBHeader.StarDock == 0))
                    {
                        Sect.Constellation = "The Federation";
                        Sect.Beacon = "FedSpace, FedLaw Enforced";
                        Sect = Global.Units.Global.TWXDatabase.Sectors[I];
                        Sect.SPort.Dead = false;
                        Sect.SPort.BuildTime = 0;
                        Sect.SPort.Name = "Stargate Alpha I";
                        Sect.SPort.ClassIndex = 9;
                        Sect.Explored = DataBase.TSectorExploredType.etCalc;
                        Sect.UpDate = DateTime.Now;
                        Global.Units.Global.TWXDatabase.SaveSector(Sect, I, null, null, null);
                    }
                }
            }
            else if ((Line.Substring(1 - 1 ,19) == "The shortest path (") || (Line.Substring(1 - 1 ,7) == "  TO > "))
            {
                FCurrentDisplay = TDisplay.dWarpLane;
                FLastWarp = 0;
            }
            else if ((FCurrentDisplay == TDisplay.dWarpLane))
            {
                ProcessWarpLine(Line);
            }
            else if ((FCurrentDisplay == TDisplay.dWarpCIM) || (FCurrentDisplay == TDisplay.dPortCIM))
            {
                ProcessCIMLine(Line);
            }
            else if ((FCurrentDisplay == TDisplay.dCIM))
            {
                // find out what kind of CIM this is
                if ((Line.Length > 2))
                {
                    if ((Line[Line.Length - 1] == '%'))
                    {
                        Global.Units.Global.TWXDatabase.LastPortCIM = DateTime.Now;
                        FCurrentDisplay = TDisplay.dPortCIM;
                    }
                    else
                    {
                        FCurrentDisplay = TDisplay.dWarpCIM;
                    }
                    ProcessCIMLine(Line);
                }
            }
            else if ((Line.Substring(1 - 1 ,10) == "Sector  : "))
            {
                // Check if this is a probe or holoscan (no warp pickup)
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                // Begin recording of sector data
                FCurrentDisplay = TDisplay.dSector;
                FSectorSaved = false;
                // Clear sector variables
                Global.Units.Global.TWXDatabase.NULLSector(ref FCurrentSector);
                FCurrentSectorIndex = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 3));
                I = Utility.Units.Utility.GetParameterPos(Line, 5);
                FCurrentSector.Constellation = Line.Substring(I - 1 ,Line.Length - I + 1);
            }
            else if ((FCurrentDisplay == TDisplay.dSector))
            {
                ProcessSectorLine(Line);
            }
            else if ((FCurrentDisplay == TDisplay.dPort))
            {
                ProcessPortLine(Line);
            }
            else if ((Line.Substring(1 - 1 ,10) == "Docking..."))
            {
                // Normal Port Report
                if (!FSectorSaved)
                {
                    SectorCompleted();
                }
                FCurrentDisplay = TDisplay.dPort;
                FPortSectorIndex = FCurrentSectorIndex;
                FCurrentSector = Global.Units.Global.TWXDatabase.Sectors[FPortSectorIndex];
                FSectorSaved = false;
            }
            else if ((FCurrentDisplay == TDisplay.dPortCR))
            {
                ProcessPortLine(Line);
            }
            else if ((Line.Substring(1 - 1 ,28) == "What sector is the port in? "))
            {
                // Computer Port Report
                FCurrentDisplay = TDisplay.dPortCR;
                I = ']'.IndexOf(Line);
                if ((Line.Length != I + 1))
                {
                    FPortSectorIndex = Utility.Units.Utility.StrToIntSafe(Line.Substring(I + 1 - 1 ,Line.Length - I));
                }
                else
                {
                    FPortSectorIndex = FCurrentSectorIndex;
                }
                FCurrentSector = Global.Units.Global.TWXDatabase.Sectors[FPortSectorIndex];
            }
            else if ((Line.Substring(27 - 1 ,16) == "Relative Density"))
            {
                // A density scanner is being used - lets grab some data
                FCurrentDisplay = TDisplay.dDensity;
            }
            else if ((FCurrentDisplay == TDisplay.dDensity) && (Line.Substring(1 - 1 ,6) == "Sector"))
            {
                // Save all density data into sector database
                X = Line;
                Utility.Units.Utility.StripChar(ref X, '(');
                Utility.Units.Utility.StripChar(ref X, ')');
                I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(X, 2));
                Sect = Global.Units.Global.TWXDatabase.Sectors[I];
                S = Utility.Units.Utility.GetParameter(X, 4);
                Utility.Units.Utility.StripChar(ref S, ',');
                Sect.Density = Utility.Units.Utility.StrToIntSafe(S);
                if ((Utility.Units.Utility.GetParameter(X, 13) == "Yes"))
                {
                    // Sector has Anomaly
                    Sect.Anomaly = true;
                }
                else
                {
                    Sect.Anomaly = false;
                }
                S = Utility.Units.Utility.GetParameter(X, 10);
                S = S.Substring(1 - 1 ,S.Length - 1);
                Sect.NavHaz = Utility.Units.Utility.StrToIntSafe(S);
                Sect.Warps = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(X, 7));
                if ((new ArrayList(new TSectorExploredType[] {DataBase.TSectorExploredType.etNo, DataBase.TSectorExploredType.etCalc}).Contains(Sect.Explored)))
                {
                    // Sector hasn't been scanned or seen before
                    Sect.Constellation = "???" + Ansi.Units.Ansi.ANSI_9 + " (Density only)";
                    Sect.Explored = DataBase.TSectorExploredType.etDensity;
                    Sect.UpDate = DateTime.Now;
                }
                Global.Units.Global.TWXDatabase.SaveSector(Sect, I, null, null, null);
            }
            else if ((Line.Substring(1 - 1 ,2) == ": "))
            {
                // begin CIM download
                FCurrentDisplay = TDisplay.dCIM;
            }
            else if ((Line.Substring(18 - 1 ,23) == "Deployed  Fighter  Scan"))
            {
                FCurrentDisplay = TDisplay.dFigScan;
                FFigScanSector = 0;
            // TFigScanType := fstPersonal;
            // end 'Deployed Fighter Scan' text line
            }
            else if ((FCurrentDisplay == TDisplay.dFigScan))
            {
                ProcessFigScanLine(Line);
            }
            Global.Units.Global.TWXInterpreter.TextLineEvent(Line, false);
            ProcessPrompt(Line);
            // Reactivate script triggers
            Global.Units.Global.TWXInterpreter.ActivateTriggers();
        }

        private void StripANSI(ref string S)
        {
            int I;
            string X;
            // Remove ANSI codes from text
            X = "";
            // Remove bells
            Utility.Units.Utility.StripChar(ref S, "\07");
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] == ''))
                {
                    FInAnsi = true;
                }
                if ((FInAnsi == false))
                {
                    X = X + S[I];
                }
                if (((((byte)S[I]) >= 65) && (((byte)S[I]) <= 90)) || ((((byte)S[I]) >= 97) && (((byte)S[I]) <= 122)))
                {
                    FInAnsi = false;
                }
            }
            S = X;
        }

        public void ProcessInBound(ref string InData)
        {
            int X;
            int I;
            string S;
            string ANSIS;
            string ANSILine;
            string Line;
            S = InData;
            RawANSILine = InData;
            // Remove null chars
            Utility.Units.Utility.StripChar(ref S, '\0');
            // strip the ANSI
            ANSIS = S;
            // Remove bells
            StripANSI(ref S);
            Global.Units.Global.TWXLog.DoLogData(S, InData);
            // Remove linefeed
            Utility.Units.Utility.StripChar(ref S, '\n');
            Utility.Units.Utility.StripChar(ref ANSIS, '\n');
            // Form and process lines out of data
            I = 1;
            Line = CurrentLine + S;
            ANSILine = CurrentANSILine + ANSIS;
            while ((I <= Line.Length))
            {
                if ((Line[I] == '\r'))
                {
                    // find the matching carriage return in the ansi line
                    X = 1;
                    if ((ANSILine.Length > 0))
                    {
                        while ((ANSILine[X] != '\r') && (X < ANSILine.Length))
                        {
                            X ++;
                        }
                    }
                    CurrentLine = Line.Substring(1 - 1 ,I - 1);
                    CurrentANSILine = ANSILine.Substring(1 - 1 ,X);
                    ProcessLine(CurrentLine);
                    if ((I < Line.Length))
                    {
                        Line = Line.Substring(I + 1 - 1 ,Line.Length - I);
                        ANSILine = ANSILine.Substring(X + 1 - 1 ,ANSILine.Length - X);
                    }
                    else
                    {
                        Line = "";
                        ANSILine = "";
                        break;
                    }
                    I = 0;
                }
                I ++;
            }
            // Process what we have left
            CurrentLine = Line;
            CurrentANSILine = ANSILine;
            ProcessPrompt(CurrentLine);
        }

        // ********************************************************************
        // Process outbound data
        public bool ProcessOutBound(string OutData, byte ClientIndex)
        {
            bool result;
            result = true;
            if ((OutData[1] == MenuKey) && (Global.Units.Global.TWXMenu.CurrentMenu == null))
            {
                // Activate menu
                if (!(Global.Units.Global.TWXClient.Connected))
                {
                    // User trying to access database while not connected
                    if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
                    {
                        Global.Units.Global.TWXServer.ClientMessage(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_12 + "Warning: This database is corrupt or does not exist.  No data is available." + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                    }
                }
                Global.Units.Global.TWXMenu.OpenMenu("TWX_MAIN", ClientIndex);
                // run the rest of the text through the menus
                if ((OutData.Length > 1))
                {
                    ProcessOutBound(OutData.Substring(2 - 1 ,OutData.Length), ClientIndex);
                }
                result = false;
            }
            else if ((Global.Units.Global.TWXMenu.CurrentMenu != null))
            {
                if ((Global.Units.Global.TWXMenu.CurrentMenu.Name == "TWX_SCRIPT") && (OutData[1] == ''))
                {
                    // Cancel any active variable dumps if Escape is pressed
                    Global.Units.Global.TWXServer.StopVarDump();
                }
                else if ((OutData[1] == MenuKey))
                {
                    // De-activate menu
                    Global.Units.Global.TWXMenu.CloseMenu(true);
                }
                else
                {
                    // Send commands to menu
                    Global.Units.Global.TWXMenu.MenuText(OutData, ClientIndex);
                }
                result = false;
            }
            // don't return a value if trigger had this key
            if (result && (OutData != ""))
            {
                result = !Global.Units.Global.TWXInterpreter.TextOutEvent(OutData, null);
            }
            return result;
        }

    } // end TModExtractor

    public enum TSectorPosition
    {
        spNormal,
        spPorts,
        spPlanets,
        spShips,
        spMines,
        spTraders
    } // end TSectorPosition

    public enum TDisplay
    {
        dNone,
        dSector,
        dDensity,
        dWarpLane,
        dCIM,
        dPortCIM,
        dPort,
        dPortCR,
        dWarpCIM,
        dFigScan
    } // end TDisplay

    public enum TFigScanType
    {
        fstPersonal,
        fstCorp
    } // end TFigScanType

}

