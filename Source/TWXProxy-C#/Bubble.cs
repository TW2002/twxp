using System;
using System.Collections;
using System.IO;
using Core;
using DataBase;
using Script;
using Global;
using Utility;
using Ansi;
using TCP;
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
namespace Bubble
{
    // EP - Not sure this reference is needed.
    public class TModBubble: TTWXModule, IModBubble
    {
        public int MaxBubbleSize
        {
          get {
            return GetMaxBubbleSize();
          }
          set {
            SetMaxBubbleSize(value);
          }
        }
        private int FBubbleSize = 0;
        private int FDeepestDepth = 0;
        private int FDeepestPoint = 0;
        private int FTotalBubbles = 0;
        private int FGappedBubbles = 0;
        private int FMaxBubbleSize = 0;
        private object FBubblesCovered = null;
        private object FAreaCovered = null;
        private ArrayList FBubbleList = null;
        private System.IO.Stream FTargetFile = null;
        public TTWXModule(Component AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            // set defaults
            MaxBubbleSize = 25;
        }

        private bool IsClosedArea(TSector Area, int AreaIndex, ushort Last, ushort Depth)
        {
            bool result;
            int I;
            TSector S;
            if ((FBubbleSize > FMaxBubbleSize) || (Area.Explored == DataBase.TSectorExploredType.etNo))
            {
                result = false;
                return result;
            }
            if ((Depth > FDeepestDepth))
            {
                FDeepestPoint = AreaIndex;
                FDeepestDepth = Depth;
            }
            ((byte)((int)FAreaCovered + AreaIndex - 1 as object)) = 1;
            result = true;
            for (I = 1; I <= 6; I ++ )
            {
                if ((Area.Warp[I] == 0))
                {
                    break;
                }
                else if ((Area.Warp[I] != Last) && (((byte)((int)FAreaCovered + Area.Warp[I] - 1 as object)) == 0) && (Area.Explored != DataBase.TSectorExploredType.etNo))
                {
                    S = Global.Units.Global.TWXDatabase.Sectors[Area.Warp[I]];
                    // see if it warps into here
                    if ((S.Warp[1] == AreaIndex) || (S.Warp[2] == AreaIndex) || (S.Warp[3] == AreaIndex) || (S.Warp[4] == AreaIndex) || (S.Warp[5] == AreaIndex) || (S.Warp[6] == AreaIndex))
                    {
                        FBubbleSize ++;
                        if (!(IsClosedArea(S, Area.Warp[I], AreaIndex, Depth + 1)))
                        {
                            result = false;
                            break;
                        }
                    }
                }
            }
            return result;
        }

        private int TestBubble(ushort Gate, ushort Interior, ref ushort Deepest, ref bool Gapped)
        {
            int result;
            TSector Area;
            object PSource;
            object PDest;
            int AreaIndex;
            int PEnd;
            ArrayList BackDoors;
            FBubbleSize = 0;
            FDeepestDepth = 0;
            Area = Global.Units.Global.TWXDatabase.Sectors[Interior];
            //@ Unsupported function or procedure: 'AllocMem'
            FAreaCovered = AllocMem(Global.Units.Global.TWXDatabase.DBHeader.Sectors);
            Gapped = false;
            if (!(IsClosedArea(Area, Interior, Gate, 0)))
            {
                result =  -1;
            }
            else
            {
                // copy the area covered to the bubbles covered
                PSource = FAreaCovered;
                PDest = FBubblesCovered;
                PEnd = (int)FAreaCovered + Global.Units.Global.TWXDatabase.DBHeader.Sectors;
                while (((int)PSource < PEnd))
                {
                    if (((byte)PSource == 1))
                    {
                        // check for backdoors without the GetBackdoors routine (for speed purposes)
                        if (!Gapped)
                        {
                            AreaIndex = (int)PSource - (int)FAreaCovered + 1;
                            Area = Global.Units.Global.TWXDatabase.Sectors[AreaIndex];
                            BackDoors = Global.Units.Global.TWXDatabase.GetBackDoors(Area, AreaIndex);
                            if ((BackDoors.Count > 0))
                            {
                                Gapped = true;
                            }
                            Utility.Units.Utility.FreeList(BackDoors, 2);
                        }
                        (byte)PDest = 1;
                    }
                    (int)PSource = (int)PSource + 1;
                    (int)PDest = (int)PDest + 1;
                }
                result = FBubbleSize + 1;
            }
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(FAreaCovered);
            Deepest = FDeepestPoint;
            return result;
        }

        public void WriteBubbles_CheckBubble(ushort Interior)
        {
            bool Gapped;
            ushort Deepest;
            int Size;
            TBubble Bubble;
            Size = TestBubble(I, Interior, ref Deepest, ref Gapped);
            if ((Size > 1))
            {
                //@ Unsupported function or procedure: 'AllocMem'
                Bubble = AllocMem(sizeof(TBubble));
                Bubble.Gate = I;
                Bubble.Deepest = Deepest;
                Bubble.Size = Size;
                Bubble.Gapped = Gapped;
                FBubbleList.Add(Bubble);
            }
        }

        private void WriteBubbles(bool UseFile)
        {
            int I;
            TSector S;
            bool SGapped;
            string SDeepest;
            string SSize;
            string SGate;
            FBubbleList = new ArrayList();
            FTotalBubbles = 0;
            FGappedBubbles = 0;
            //@ Unsupported function or procedure: 'AllocMem'
            FBubblesCovered = AllocMem(Global.Units.Global.TWXDatabase.DBHeader.Sectors);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Warp[2] > 0) && (((byte)((int)FBubblesCovered + I - 1 as object)) == 0))
                {
                    WriteBubbles_CheckBubble(S.Warp[1]);
                    WriteBubbles_CheckBubble(S.Warp[2]);
                    if ((S.Warp[3] > 0))
                    {
                        WriteBubbles_CheckBubble(S.Warp[3]);
                    }
                    if ((S.Warp[4] > 0))
                    {
                        WriteBubbles_CheckBubble(S.Warp[4]);
                    }
                    if ((S.Warp[5] > 0))
                    {
                        WriteBubbles_CheckBubble(S.Warp[5]);
                    }
                    if ((S.Warp[6] > 0))
                    {
                        WriteBubbles_CheckBubble(S.Warp[6]);
                    }
                }
            }
            if (UseFile)
            {
                FBubbleList.Sort(Units.Bubble.SortList);
            }
            // Show bubbles that aren't parts of bubbles
            for (I = 0; I < FBubbleList.Count; I ++ )
            {
                if ((((byte)((int)FBubblesCovered + ((FBubbleList[I]) as TBubble).Gate - 1 as object)) == 0))
                {
                    SGate = (((FBubbleList[I]) as TBubble).Gate).ToString();
                    SDeepest = (((FBubbleList[I]) as TBubble).Deepest).ToString();
                    SSize = (((FBubbleList[I]) as TBubble).Size).ToString();
                    SGapped = ((FBubbleList[I]) as TBubble).Gapped;
                    if (UseFile)
                    {
                        FTargetFile.WriteLine(SDeepest + ' ' + SSize);
                    }
                    else
                    {
                        FTotalBubbles ++;
                        if (SGapped)
                        {
                            FGappedBubbles ++;
                            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_4 + "Gate: " + Ansi.Units.Ansi.ANSI_12 + SGate + Ansi.Units.Ansi.ANSI_4 + Utility.Units.Utility.GetSpace(10 - SGate.Length) + "Deepest: " + Ansi.Units.Ansi.ANSI_12 + SDeepest + Ansi.Units.Ansi.ANSI_4 + Utility.Units.Utility.GetSpace(10 - SDeepest.Length) + "Size: " + Ansi.Units.Ansi.ANSI_12 + SSize + Core.Units.Core.endl);
                        }
                        else
                        {
                            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_3 + "Gate: " + Ansi.Units.Ansi.ANSI_11 + SGate + Ansi.Units.Ansi.ANSI_3 + Utility.Units.Utility.GetSpace(10 - SGate.Length) + "Deepest: " + Ansi.Units.Ansi.ANSI_11 + SDeepest + Ansi.Units.Ansi.ANSI_3 + Utility.Units.Utility.GetSpace(10 - SDeepest.Length) + "Size: " + Ansi.Units.Ansi.ANSI_11 + SSize + Core.Units.Core.endl);
                        }
                    }
                }
            }
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(FBubblesCovered);
            while ((FBubbleList.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(FBubbleList[0]);
                FBubbleList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            FBubbleList.Free;
        }

        public void DumpBubbles()
        {
            System.IO.Stream F;
            string FileName;
            // EP - Previously just 'WriteBubbles(False);'
            // FileName := TWXInterpreter.ProgramDir + '\' + TWXDatabase.DatabaseName + '_Bubbles.txt';
            FileName = Global.Units.Global.TWXGUI.ProgramDir + '\\' + Global.Units.Global.TWXDatabase.DatabaseName + "_Bubbles.txt";
            F = new FileInfo(FileName);
            StreamWriter _W_0 = F.CreateText();
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                WriteBubbles(false);
            }
            else
            {
                ExportBubbles(ref F);
                _W_0.Close();
            }
            // EP - End
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Completed - " + (FTotalBubbles - FGappedBubbles).ToString() + " solid bubbles, " + (FGappedBubbles).ToString() + " gapped bubbles (total of " + (FTotalBubbles).ToString() + " bubbles)" + Core.Units.Core.endl + "Bubbles shown in red are gapped (broken by at least one backdoor)" + Core.Units.Core.endl);
        }

        public void ExportBubbles(ref System.IO.Stream F)
        {
            FTargetFile = F;
            WriteBubbles(true);
        }

        public void ShowBubble(ushort Gate, ushort Interior)
        {
            TSector Area;
            int Col;
            int I;
            ArrayList BackDoors;
            ArrayList Gaps;
            FBubbleSize = 0;
            FDeepestDepth = 0;
            Area = Global.Units.Global.TWXDatabase.Sectors[Interior];
            //@ Unsupported function or procedure: 'AllocMem'
            FAreaCovered = AllocMem(Global.Units.Global.TWXDatabase.DBHeader.Sectors);
            Gaps = new ArrayList();
            if ((IsClosedArea(Area, Interior, Gate, 0)))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_9 + "Gate: " + Ansi.Units.Ansi.ANSI_11 + (Gate).ToString() + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_9 + "Size: " + Ansi.Units.Ansi.ANSI_11 + (FBubbleSize + 1).ToString() + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_9 + "Deepest Sector: " + Ansi.Units.Ansi.ANSI_11 + (FDeepestPoint).ToString() + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_9 + "Interior: " + Ansi.Units.Ansi.ANSI_11);
                Col = 1;
                for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    if ((((byte)((int)FAreaCovered + I - 1 as object)) == 1))
                    {
                        Col ++;
                        Global.Units.Global.TWXServer.Broadcast((I).ToString() + Utility.Units.Utility.GetSpace(6 - (I).ToString().Length));
                        if ((Col >= 8))
                        {
                            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "          ");
                            Col = 1;
                        }
                        BackDoors = Global.Units.Global.TWXDatabase.GetBackDoors(Global.Units.Global.TWXDatabase.Sectors[I], I);
                        while ((BackDoors.Count > 0))
                        {
                            Gaps.Add(BackDoors[0]);
                            BackDoors.RemoveAt(0);
                        }
                        //@ Unsupported property or method(C): 'Free'
                        BackDoors.Free;
                    }
                }
                if ((Gaps.Count > 0))
                {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_9 + "Back Doors: " + Ansi.Units.Ansi.ANSI_12);
                    while ((Gaps.Count > 0))
                    {
                        Global.Units.Global.TWXServer.Broadcast((((ushort)Gaps[0])).ToString() + ' ');
                        //@ Unsupported function or procedure: 'FreeMem'
                        FreeMem(Gaps[0]);
                        Gaps.RemoveAt(0);
                    }
                }
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "No bubble found.");
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl);
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(FAreaCovered);
            //@ Unsupported property or method(C): 'Free'
            Gaps.Free;
        }

        // IModBubble
        protected int GetMaxBubbleSize()
        {
            int result;
            result = FMaxBubbleSize;
            return result;
        }

        protected void SetMaxBubbleSize(int Value)
        {
            FMaxBubbleSize = Value;
        }

    } // end TModBubble

    public struct TBubble
    {
        public ushort Gate;
        public ushort Deepest;
        public ushort Size;
        public bool Gapped;
    } // end TBubble

}

namespace Bubble.Units
{
    public class Bubble
    {
        public static int SortList(object Item1, object Item2)
        {
            int result;
            result = ((Item1) as TBubble).Deepest - ((Item2) as TBubble).Deepest;
            return result;
        }

    } // end Bubble

}

