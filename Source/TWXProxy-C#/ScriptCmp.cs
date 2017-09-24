using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using Core;
using ScriptRef;
using Utility;
using Global;
using Ansi;
using Encryptor;
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
namespace ScriptCmp
{
    // TWX Proxy 2.02 is version 1
    // TWX Proxy 2.03Beta is version 2?
    // TWX Proxy 2.03Final is version 3
    // TWX Proxy 2.04 is version 4
    // TWX Proxy 2.05 is version 5
    // User variable prefix
    // Compiler string constant prefix
    // Read only system value
    // Program variable
    // Character code
    public class EScriptError: Exception
    {
        //@ Constructor auto-generated 
        public EScriptError(String message)
            :base(message)
        {
        }
        //@ Constructor auto-generated 
        public EScriptError(String message, Exception innerException)
            :base(message, innerException)
        {
        }
    } // end EScriptError

    public struct TScriptFileHeader
    {
        // header at top of compiled script file
        public string[] ProgramName;
        public ushort Version;
        public int DescSize;
        public int CodeSize;
    } // end TScriptFileHeader

    public struct TConditionStruct
    {
        public string ConLabel;
        public string EndLabel;
        public bool IsWhile;
        public bool AtElse;
    } // end TConditionStruct

    // TVarParam: A variable within the script.  Typically referenced by its ID.  Can contain
    // a list of indexed values in the event of it being used as an array within the script.
    public class TVarParam: TCmdParam
    {
        public string Name
        {
          get {
            return FName;
          }
          set {
            FName = value;
          }
        }
        public int ArraySize
        {
          get {
            return FArraySize;
          }
          set {
            FArraySize = value;
          }
        }
        protected string FName = String.Empty;
        protected ArrayList Vars = null;
        // list of variables indexed within this variable
        protected int FArraySize = 0;
        // ***************************************************************
        // TVarParam implementation
        //Constructor  Create()
        public TVarParam() : base()
        {
            Vars = new ArrayList();
            Name = "";
            FArraySize = 0;
        }
        //@ Destructor  Destroy()
        ~TVarParam()
        {
            int I;
            // free all index element variables
            for (I = Vars.Count - 1; I >= 0; I-- )
            {
                //@ Unsupported property or method(C): 'Free'
                ((Vars[I]) as TVarParam).Free;
                // This is a recursive call
                Vars.RemoveAt(I);
            }
            //@ Unsupported property or method(C): 'Free'
            Vars.Free;
            Name = "";
            base.Destroy();
        }
        public int AddVar(object NewVar)
        {
            int result;
            // link up an index element variable
            result = Vars.Add(NewVar);
            return result;
        }

        public TVarParam GetIndexVar(string[] Indexes)
        {
            TVarParam result;
            int J;
            int I;
            string[] NextIndex;
            TVarParam NewVar;
            // move through the array of index dimensions and return a reference to the
            // variable with the specified name/index.
            if ((Indexes.Length == 0))
            {
                result = this;
                // no index to search on
                return result;
            }
            NextIndex = new string[Indexes.Length - 1];
            if ((Indexes.Length > 1))
            {
                for (J = 1; J < Indexes.Length; J ++ )
                {
                    NextIndex[J - 1] = Indexes[J];
                }
            }
            // search the index for a variable with a matching name
            if ((FArraySize > 0))
            {
                // static array - we can look up the variable directly
                I = 0;
                try {
                    I = Convert.ToInt32(Indexes[0]);
                }
                catch {
                }
                if ((I < 1) || (I > FArraySize))
                {
                    throw new EScriptError("Static array index \'" + Indexes[0] + "\' is out of range (must be 1-" + (FArraySize).ToString() + ')');
                }
                else
                {
                    result = ((Vars[I - 1]) as TVarParam).GetIndexVar(NextIndex);
                }
            }
            else
            {
                result = null;
                if ((Vars.Count > 0))
                {
                    for (I = 0; I < Vars.Count; I ++ )
                    {
                        if ((((Vars[I]) as TVarParam).Name == Indexes[0]))
                        {
                            result = ((Vars[I]) as TVarParam).GetIndexVar(NextIndex);
                            break;
                        }
                    }
                }
                if ((result == null))
                {
                    // variable not found in index - make a new one
                    NewVar = new TVarParam();
                    NewVar.Name = Indexes[0];
                    AddVar(NewVar);
                    result = NewVar.GetIndexVar(NextIndex);
                }
            }
            return result;
        }

        public void SetArray(int[] Dimensions)
        {
            int I;
            int J;
            TVarParam NewVar;
            int[] NextDimen;
            FArraySize = Dimensions[0];
            // First, let's delete any existing Vars.Items above FArraySize
            // This also deletes any of their sub-lists of TVarParams
            for (I = Vars.Count - 1; I >= FArraySize; I-- )
            {
                //@ Unsupported property or method(C): 'Free'
                ((Vars[I]) as TVarParam).Free;
                Vars.RemoveAt(I);
            }
            // build variables up until size limit
            try {
                for (I = 0; I < Dimensions[0]; I ++ )
                {
                    // See if an Item already exists
                    if (((I + 1) > Vars.Count))
                    {
                        NewVar = new TVarParam();
                        NewVar.Name = (I + 1).ToString();
                        AddVar(NewVar);
                    // NewVar is now both Vars.Count - 1, and Vars.Items[I]
                    }
                    else
                    {
                        // Okay, we are dealing with an existing TVarParam.
                        // We need to clear it, then check if it has a sub array
                        ((Vars[I]) as TVarParam).Name = (I + 1).ToString();
                        ((Vars[I]) as TVarParam).Value = '0';
                    }
                    if ((Dimensions.Length > 1) || (((Vars[I]) as TVarParam).Vars.Count > 0))
                    {
                        // We have sub-dimension, either currently existing, newly specified, or both
                        if ((Dimensions.Length == 1))
                        {
                            // We need to clear sub-dimensions, so pass a Dimension[0] of 0
                            NextDimen = new int[1];
                            NextDimen[0] = 0;
                        }
                        else
                        {
                            NextDimen = new int[Dimensions.Length - 1];
                            for (J = 1; J < Dimensions.Length; J ++ )
                            {
                                NextDimen[J - 1] = Dimensions[J];
                            }
                        }
                        // NextDimen array is now set.  Begin Recursive Call
                        ((Vars[I]) as TVarParam).SetArray(NextDimen);
                    }
                }
            }
            catch {
                throw new EScriptError("Not enough memory to set static array");
            }
        }

        public void SetArrayFromStrings(List<string> Strings)
        {
            int I;
            TVarParam NewVar;
            int[] NextDimen;
            FArraySize = Strings.Count;
            for (I = Vars.Count - 1; I >= FArraySize; I-- )
            {
                //@ Unsupported property or method(C): 'Free'
                ((Vars[I]) as TVarParam).Free;
                Vars.RemoveAt(I);
            }
            for (I = 0; I < FArraySize; I ++ )
            {
                if ((I + 1) > Vars.Count)
                {
                    NewVar = new TVarParam();
                    NewVar.Name = (I + 1).ToString();
                    NewVar.Value = Strings[I];
                    AddVar(NewVar);
                // NewVar is now both Vars.Count - 1, and Vars.Items[I]
                }
                else
                {
                    ((Vars[I]) as TVarParam).Name = (I + 1).ToString();
                    ((Vars[I]) as TVarParam).Value = Strings[I];
                    if (((Vars[I]) as TVarParam).Vars.Count > 0)
                    {
                        // We have a sub-list that needs freeing
                        NextDimen = new int[1];
                        NextDimen[0] = 0;
                        ((Vars[I]) as TVarParam).SetArray(NextDimen);
                    }
                // End If
                }
            // End If..Else
            }
            // End For

        }

        // End Procedure
        public void SetArrayFromList(ArrayList List)
        {
            int I;
            TVarParam NewVar;
            int[] NextDimen;
            FArraySize = List.Count;
            for (I = Vars.Count - 1; I >= FArraySize; I-- )
            {
                //@ Unsupported property or method(C): 'Free'
                ((Vars[I]) as TVarParam).Free;
                Vars.RemoveAt(I);
            }
            for (I = 0; I < FArraySize; I ++ )
            {
                if ((I + 1) > Vars.Count)
                {
                    NewVar = new TVarParam();
                    NewVar.Name = (I + 1).ToString();
                    NewVar.Value = (((ushort)List[I])).ToString();
                    AddVar(NewVar);
                }
                else
                {
                    ((Vars[I]) as TVarParam).Name = (I + 1).ToString();
                    ((Vars[I]) as TVarParam).Value = (((ushort)List[I])).ToString();
                    if (((Vars[I]) as TVarParam).Vars.Count > 0)
                    {
                        // We have a sub-list that needs freeing
                        NextDimen = new int[1];
                        NextDimen[0] = 0;
                        ((Vars[I]) as TVarParam).SetArray(NextDimen);
                    }
                // End If
                }
            // End If..Else
            }
            // End For

        }

        // End Procedure
        public void SetMultiArraysFromLists(ArrayList[] ListArray)
        {
            int I;
            TVarParam NewVar;
            FArraySize = ListArray.Length;
            for (I = Vars.Count - 1; I >= FArraySize; I-- )
            {
                //@ Unsupported property or method(C): 'Free'
                ((Vars[I]) as TVarParam).Free;
                Vars.RemoveAt(I);
            }
            for (I = 0; I < FArraySize; I ++ )
            {
                if ((I + 1) > Vars.Count)
                {
                    NewVar = new TVarParam();
                    NewVar.Name = (I + 1).ToString();
                    NewVar.Value = (ListArray[I].Count - 1).ToString();
                    AddVar(NewVar);
                }
                else
                {
                    ((Vars[I]) as TVarParam).Name = (I + 1).ToString();
                    ((Vars[I]) as TVarParam).Value = (ListArray[I].Count - 1).ToString();
                }
                ((Vars[I]) as TVarParam).SetArrayFromList(ListArray[I]);
            }
        }

        public void Dump(string Tab)
        {
            int I;
            // broadcast variable details to active telnet connections
            if ((Name.Length >= 2))
            {
                if ((Name.Substring(1 - 1 ,2) == "$$"))
                {
                    return;
                }
            }
            // don't dump system variables
            Global.Units.Global.TWXServer.AddBuffer(Tab + Ansi.Units.Ansi.ANSI_15 + '\"' + Ansi.Units.Ansi.ANSI_7 + Name + Ansi.Units.Ansi.ANSI_15 + "\" = \"" + Ansi.Units.Ansi.ANSI_7 + this.Value + Ansi.Units.Ansi.ANSI_15 + '\"' + Core.Units.Core.endl);
            if ((Vars.Count > 0))
            {
                // dump array contents
                if ((FArraySize > 0))
                {
                    Global.Units.Global.TWXServer.AddBuffer(Tab + Ansi.Units.Ansi.ANSI_15 + "Static array of \"" + Name + "\" (size " + (Vars.Count).ToString() + ')' + Core.Units.Core.endl);
                }
                else
                {
                    Global.Units.Global.TWXServer.AddBuffer(Tab + Ansi.Units.Ansi.ANSI_15 + "Dynamic array of \"" + Name + "\" (size " + (Vars.Count).ToString() + ')' + Core.Units.Core.endl);
                }
                for (I = 0; I < Vars.Count; I ++ )
                {
                    ((Vars[I]) as TVarParam).Dump(Tab + "  ");
                }
            }
        }

    } // end TVarParam

    // TScriptLabel: A jump label within a script.
    public class TScriptLabel
    {
        public int Location
        {
          get {
            return FLocation;
          }
          set {
            FLocation = value;
          }
        }
        public string Name
        {
          get {
            return FName;
          }
          set {
            FName = value;
          }
        }
        protected int FLocation = 0;
        protected string FName = String.Empty;
        // ***************************************************************
        // TScriptLabel implementation
        //Constructor  Create()
        public TScriptLabel() : base()
        {
            // set defaults
            Location = 0;
            Name = "";
        }
    } // end TScriptLabel

    public class TScriptCmp: Component
    {
        public object __Params[int Index]
        {
          get {
            return GetParam(Index);
          }
        }
        public TScriptLabel Labels[int Index]
        {
          get {
            return GetLabel(Index);
          }
        }
        public string IncludeScripts[int Index]
        {
          get {
            return GetIncludeScript(Index);
          }
        }
        public int ParamCount
        {
          get {
            return GetParamCount();
          }
        }
        public int LabelCount
        {
          get {
            return GetLabelCount();
          }
        }
        public object Code
        {
          get {
            return FCode;
          }
        }
        public int CodeSize
        {
          get {
            return FCodeSize;
          }
        }
        public int LineCount
        {
          get {
            return FLineCount;
          }
        }
        public int CmdCount
        {
          get {
            return FCmdCount;
          }
        }
        public TScriptRef ScriptRef
        {
          get {
            return FScriptRef;
          }
        }
        public string ScriptFile
        {
          get {
            return FScriptFile;
          }
        }
        private Stack IFStack = null;
        private ArrayList FParamList = null;
        private ArrayList FLabelList = null;
        private List<string> IncludeScriptList = null;
        private List<string> FDescription = null;
        private string FScriptFile = String.Empty;
        private object FCode = null;
        private int IFLabelCount = 0;
        private int SysVarCount = 0;
        private int WaitOnCount = 0;
        private int FLineCount = 0;
        private int FCmdCount = 0;
        private int FCodeSize = 0;
        private TScriptRef FScriptRef = null;
        // ***************************************************************
        // TScriptCmp implementation
        //Constructor  Create( ScriptRef)
        public TScriptCmp(TScriptRef ScriptRef)
        {
            FParamList = new ArrayList();
            FLabelList = new ArrayList();
            FDescription = new List<string>();
            FScriptRef = ScriptRef;
            IncludeScriptList = new List<string>();
            IFStack = new Stack();
            FLineCount = 0;
            FCmdCount = 0;
        }
        //@ Destructor  Destroy()
        ~TScriptCmp()
        {
            TConditionStruct ConStruct;
            while ((FParamList.Count > 0))
            {
                //@ Unsupported property or method(D): 'Free'
                __Params[0].Free;
                FParamList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            FParamList.Free;
            while ((FLabelList.Count > 0))
            {
                //@ Unsupported property or method(C): 'Free'
                Labels[0].Free;
                FLabelList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            FLabelList.Free;
            //@ Unsupported property or method(C): 'Free'
            FDescription.Free;
            // free up IF stack
            while ((IFStack.Count > 0))
            {
                ConStruct = IFStack.Pop();
                ConStruct.ConLabel = "";
                ConStruct.EndLabel = "";
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(ConStruct);
            }
            //@ Unsupported property or method(C): 'Free'
            IFStack.Free;
            if ((FCode != null))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(FCode, FCodeSize);
            }
            //@ Unsupported property or method(C): 'Free'
            IncludeScriptList.Free;
        }
        protected int GetParamCount()
        {
            int result;
            result = FParamList.Count;
            return result;
        }

        protected int GetLabelCount()
        {
            int result;
            result = FLabelList.Count;
            return result;
        }

        protected TCmdParam GetParam(int Index)
        {
            TCmdParam result;
            result = FParamList[Index];
            return result;
        }

        protected TScriptLabel GetLabel(int Index)
        {
            TScriptLabel result;
            result = FLabelList[Index];
            return result;
        }

        protected string GetIncludeScript(int Index)
        {
            string result;
            result = IncludeScriptList[Index];
            return result;
        }

        // ***************************************************************
        // Script compilation
        protected void AppendCode(object NewCode, byte NewCodeSize)
        {
            byte B;
            object P1;
            object P2;
            // write this data to the end of the byte-code
            //@ Unsupported function or procedure: 'ReallocMem'
            ReallocMem(FCode, FCodeSize + NewCodeSize);
            P1 = ((int)FCode + FCodeSize as object);
            P2 = NewCode;
            for (B = 1; B <= NewCodeSize; B ++ )
            {
                (byte)P1 = (byte)P2;
                P1 = ((int)P1 + 1 as object);
                P2 = ((int)P2 + 1 as object);
            }
            FCodeSize += NewCodeSize;
        }

        protected void BuildLabel(string Name, int Location)
        {
            TScriptLabel NewLabel;
            // create a new label - label's constructor will add it to label list automatically
            NewLabel = new TScriptLabel();
            NewLabel.Name = Name;
            NewLabel.Location = Location;
            FLabelList.Add(NewLabel);
        }

        public void ExtendName(ref string Name, int ScriptID)
        {
            if ((Name.IndexOf('~') == 0))
            {
                if ((ScriptID > 0))
                {
                    Name = IncludeScriptList[ScriptID] + '~' + Name;
                }
            }
            else
            {
                if ((Name != ""))
                {
                    if ((Name[1] == '~'))
                    {
                        if ((Name.Length == 1))
                        {
                            throw new EScriptError("Bad name");
                        }
                        Name = Name.Substring(2 - 1 ,Name.Length);
                    }
                }
            }
        }

        public void ExtendLabelName(ref string Name, int ScriptID)
        {
            if ((Name.IndexOf('~') == 0) && (ScriptID > 0))
            {
                Name = ':' + IncludeScriptList[ScriptID] + '~' + Name.Substring(2 - 1 ,Name.Length);
            }
        }

        protected byte IdentifyParam(string ParamName)
        {
            byte result;
            int IndexLevel;
            int I;
            string ConstName;
            // identify the type of this parameter
            // EP - See if it's a $var, %progVar,  #char, [const], or [sysConst]
            if ((ParamName[1] == '$'))
            {
                result = Units.ScriptCmp.PARAM_VAR;
            }
            else if ((ParamName[1] == '%'))
            {
                result = Units.ScriptCmp.PARAM_PROGVAR;
            }
            else if ((ParamName[1] == '#'))
            {
                result = Units.ScriptCmp.PARAM_CHAR;
            }
            else
            {
                result = Units.ScriptCmp.PARAM_CONST;
                // remove indexes from constant name (if its a constant)
                IndexLevel = 0;
                ConstName = "";
                for (I = 1; I <= ParamName.Length; I ++ )
                {
                    if ((ParamName[I] == '['))
                    {
                        IndexLevel ++;
                    }
                    else if ((ParamName[I] == ']'))
                    {
                        IndexLevel -= 1;
                    }
                    else if ((IndexLevel == 0))
                    {
                        ConstName = ConstName + ParamName[I];
                    }
                }
                // check for system constant
                if ((ScriptRef.FindSysConst(ConstName) >  -1))
                {
                    result = Units.ScriptCmp.PARAM_SYSCONST;
                }
            }
            return result;
        }

        protected string ApplyEncryption(string Value, byte Key)
        {
            string result;
            int I;
            result = "";
            if ((Value.Length > 0))
            {
                for (I = 1; I <= Value.Length; I ++ )
                {
                    result = result + ((char)((byte)Value[I]) ^ Key);
                }
            }
            return result;
        }

        protected void WriteCode(ref string CmdCode, object Code, int CodeLength)
        {
            string S;
            //@ Unsupported function or procedure: 'SetString'
            SetString(S, (Code as string), CodeLength);
            CmdCode = CmdCode + S;
        }

        // Value can be a variable name, a constant, a system constant, a program variable or a character
        public void CompileValue_QuotationError()
        {
            throw new EScriptError("Quotation syntax error");
        }

        public void CompileValue_ParamTypeError()
        {
            throw new EScriptError("Invalid command parameter type \'" + Value + '\'');
        }

        public void CompileValue_BuildIndexList(List<string> IndexList, ref string Name)
        {
            string RetnName;
            string Index;
            int I;
            int IndexDepth;
            RetnName = "";
            IndexDepth = 0;
            Index = "";
            // EP - This next routine is to verify that array variables ($array[$var[2]]) are formatted correctly
            for (I = 1; I <= Name.Length; I ++ )
            {
                if ((Name[I] == '['))
                {
                    if ((IndexDepth > 0))
                    {
                        Index = Index + Name[I];
                    }
                    IndexDepth ++;
                }
                else if ((Name[I] == ']'))
                {
                    IndexDepth -= 1;
                    if ((IndexDepth > 0))
                    {
                        Index = Index + Name[I];
                    }
                    else if ((IndexDepth < 0))
                    {
                        throw new EScriptError("Array syntax error");
                    }
                    if ((IndexDepth == 0))
                    {
                        if ((Index == ""))
                        {
                            throw new EScriptError("Expected array index specifier");
                        }
                        IndexList.Add(Index);
                        Index = "";
                    }
                }
                else if ((IndexDepth == 0))
                {
                    RetnName = RetnName + Name[I];
                }
                else
                {
                    Index = Index + Value[I];
                }
            }
            if ((IndexDepth > 0))
            {
                throw new EScriptError("Array syntax error");
            }
            Name = RetnName;
        }

        public void CompileValue_WriteIndexList(List<string> IndexList)
        {
            byte CodeByte;
            int I;
            if ((IndexList.Count > 255))
            {
                throw new EScriptError("Too many array dimensions");
            }
            CodeByte = IndexList.Count;
            WriteCode(ref CmdCode, CodeByte, 1);
            // write index count
            // loop through index list and process each index value as a separate parameter
            for (I = 0; I < IndexList.Count; I ++ )
            {
                CompileParam(IndexList[I], ref CmdCode, ScriptRef.TParamKind.pkValue, Line, ScriptID);
            }
        }

        protected void CompileValue(string Value, ref string CmdCode, TParamKind ParamKind, int Line, byte ScriptID)
        {
            byte CodeByte;
            byte PType;
            TCmdParam NewConst;
            TVarParam NewVar;
            List<string> IndexList;
            int ID;
            bool Found;
            ushort CodeWord;
            double DecValue;
            PType = 0;
            if ((Value.IndexOf('\"') > 0))
            {
                // constant - remove the quotes
                // EP - meaning we have a line, setVar $var "one".  "one" is a constant
                if ((Value[1] != '\"') || (Value[Value.Length] != '\"'))
                {
                    CompileValue_QuotationError();
                }
                Value = Value.Substring(2 - 1 ,Value.Length - 2).Replace('*', '\r');
                // EP - In the above example, Value would now contain 'one', without the quotes
                if ((Value.IndexOf('\"') > 0))
                {
                    CompileValue_QuotationError();
                }
                PType = Units.ScriptCmp.PARAM_CONST;
            }
            else
            {
                // EP - See if it's a $var, %progVar,  #char, [const], or [sysConst]
                PType = IdentifyParam(Value);
            }
            // END IF..ELSE
            // write value type to byte code
            WriteCode(ref CmdCode, PType, 1);
            if ((PType == Units.ScriptCmp.PARAM_CONST))
            {
                // write 32-bit constant reference
                if ((ParamKind != ScriptRef.TParamKind.pkValue))
                {
                    CompileValue_ParamTypeError();
                }
                NewConst = new TCmdParam();
                NewConst.Value = Value;
                // Let's just let this occur the first time DecValue is needed
                // // EP - See if it could be a number
                // if TextToFloat(PChar(Value), DecValue, fvExtended) then
                // begin
                // NewConst.DecValue := DecValue;
                // if Pos('.', Value) > 0 then
                // NewConst.SigDigits := Length(Value) - Pos('.', Value);
                // 
                // end;
                // 
                ID = FParamList.Add(NewConst);
                WriteCode(ref CmdCode, ID, 4);
            }
            else if ((PType == Units.ScriptCmp.PARAM_VAR))
            {
                // write 32-bit variable reference
                if ((Value.Length < 2))
                {
                    throw new EScriptError("Variable name expected");
                }
                if ((ScriptID > 0) && (Value.IndexOf('~') == 0))
                {
                    Value = '$' + IncludeScriptList[ScriptID] + '~' + Value.Substring(2 - 1 ,Value.Length);
                }
                if ((ParamKind != ScriptRef.TParamKind.pkValue) && (ParamKind != ScriptRef.TParamKind.pkVar))
                {
                    CompileValue_ParamTypeError();
                }
                // generate index list from variable, stripping out index specifiers
                IndexList = new List<string>();
                try {
                    CompileValue_BuildIndexList(IndexList, ref Value);
                    // see if the variable exists
                    Found = false;
                    if ((FParamList.Count > 0))
                    {
                        for (ID = 0; ID < FParamList.Count; ID ++ )
                        {
                            if ((((FParamList[ID]) as Object) is TVarParam))
                            {
                                if ((((FParamList[ID]) as TVarParam).Name == Value))
                                {
                                    Found = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!Found)
                    {
                        // build new variable
                        NewVar = new TVarParam();
                        NewVar.Name = Value;
                        // EP - See if it could be a number
                        //@ Undeclared identifier(3): 'fvExtended'
                        //@ Unsupported function or procedure: 'TextToFloat'
                        if (TextToFloat((Value as string), DecValue, fvExtended))
                        {
                            NewVar.DecValue = DecValue;
                        }
                        ID = FParamList.Add(NewVar);
                    }
                    WriteCode(ref CmdCode, ID, 4);
                    // write variable reference
                    CompileValue_WriteIndexList(IndexList);
                // write variable indexes
                } finally {
                    //@ Unsupported property or method(C): 'Free'
                    IndexList.Free;
                }
            }
            else if ((PType == Units.ScriptCmp.PARAM_SYSCONST))
            {
                // write 16-bit system constant reference
                if ((ParamKind != ScriptRef.TParamKind.pkValue))
                {
                    CompileValue_ParamTypeError();
                }
                // generate index list for this constant
                IndexList = new List<string>();
                try {
                    CompileValue_BuildIndexList(IndexList, ref Value);
                    // get the ID of this system const
                    CodeWord = ScriptRef.FindSysConst(Value);
                    WriteCode(ref CmdCode, CodeWord, 2);
                    CompileValue_WriteIndexList(IndexList);
                } finally {
                    //@ Unsupported property or method(C): 'Free'
                    IndexList.Free;
                }
            }
            else if ((PType == Units.ScriptCmp.PARAM_PROGVAR))
            {
                // write 32-bit program variable reference
                if ((ParamKind != ScriptRef.TParamKind.pkValue))
                {
                    CompileValue_ParamTypeError();
                }
            // find the program variable matching this one
            }
            else if ((PType == Units.ScriptCmp.PARAM_CHAR))
            {
                // write 8-bit character code
                if ((ParamKind != ScriptRef.TParamKind.pkValue))
                {
                    CompileValue_ParamTypeError();
                }
                if ((Value.Length < 2))
                {
                    throw new EScriptError("No character code supplied");
                }
                try {
                    ID = Convert.ToInt32(Value.Substring(2 - 1 ,Value.Length));
                }
                catch {
                    throw new EScriptError("Bad character code");
                }
                if ((ID < 0) || (ID > 255))
                {
                    throw new EScriptError("Character #" + (ID).ToString() + " does not exist");
                }
                CodeByte = ID;
                WriteCode(ref CmdCode, CodeByte, 1);
            }
        }

        protected void RecurseCmd(string[] CmdLine, int Line, byte ScriptID)
        {
            List<string> ParamLine;
            int I;
            // S         : String;
            // convert the CmdLine into a string list and throw it all back through compiler
            ParamLine = new List<string>();
            try {
                for (I = 0; I < CmdLine.Length; I ++ )
                {
                    //@ Unsupported property or method(A): 'Append'
                    ParamLine.Append(CmdLine[I]);
                }
                // Troubleshooting
                // for I := 0 to ParamLine.Count - 1 do
                // S := S + ParamLine.Strings[I] + endl;
                // S := S + endl + endl;
                // TWXServer.Broadcast(S);
                CompileParamLine(ParamLine, Line, ScriptID);
            } finally {
                //@ Unsupported property or method(C): 'Free'
                ParamLine.Free;
            }
        }

        public bool CompileParam_SplitOperator(string Equation, string Ops, ref string Value1, ref string Value2, ref char Op)
        {
            bool result;
            bool InQuote;
            int BracketLevel;
            int I;
            int J;
            // seek out the specified operator within this equation, and split the values around it
            BracketLevel = 0;
            result = false;
            InQuote = false;
            for (I = 1; I <= Equation.Length; I ++ )
            {
                if ((Equation[I] == '\"'))
                {
                    InQuote = !InQuote;
                }
                else if (!InQuote)
                {
                    if ((Equation[I] == '('))
                    {
                        BracketLevel ++;
                    }
                    else if ((Equation[I] == ')'))
                    {
                        BracketLevel -= 1;
                        if ((BracketLevel < 0))
                        {
                            throw new EScriptError("Bracket mismatch");
                        }
                    }
                    else if ((BracketLevel == 0))
                    {
                        for (J = 1; J <= Ops.Length; J ++ )
                        {
                            if ((Ops[J] == Equation[I]))
                            {
                                if ((I == 1) || (I == Equation.Length))
                                {
                                    throw new EScriptError("Operation syntax error");
                                }
                                // split into values
                                Value1 = Equation.Substring(1 - 1 ,I - 1);
                                Value2 = Equation.Substring(I + 1 - 1 ,Equation.Length);
                                Op = Ops[J];
                                // return the operator that was found
                                result = true;
                                return result;
                            }
                        }
                    }
                }
            }
            return result;
        }

        public TBranch CompileParam_BreakDown(string Equation)
        {
            TBranch result;
            char Op;
            string V1;
            string V2;
            bool Encased;
            bool Split;
            bool InQuote;
            bool TestBrackets;
            int BracketLevel;
            int I;
            //@ Unsupported function or procedure: 'AllocMem'
            result = AllocMem(sizeof(TBranch));
            try {
                do
                {
                    TestBrackets = false;
                    if ((Equation.Length > 1))
                    {
                        if ((Equation[1] == '(') && (Equation[Equation.Length] == ')'))
                        {
                            if ((Equation == "()"))
                            {
                                throw new EScriptError("Empty brackets");
                            }
                            BracketLevel = 0;
                            Encased = true;
                            InQuote = false;
                            for (I = 1; I <= Equation.Length; I ++ )
                            {
                                if ((Equation[I] == '\"'))
                                {
                                    InQuote = !InQuote;
                                }
                                else if (!InQuote)
                                {
                                    if ((Equation[I] == '('))
                                    {
                                        BracketLevel ++;
                                    }
                                    else if ((Equation[I] == ')'))
                                    {
                                        BracketLevel -= 1;
                                        if ((BracketLevel == 0) && (I != Equation.Length))
                                        {
                                            Encased = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (Encased)
                            {
                                // entire equation is encased in brackets, strip them out
                                Equation = Equation.Substring(2 - 1 ,Equation.Length - 2);
                                TestBrackets = true;
                            }
                        }
                    }
                } while (!(!TestBrackets));
                Split = true;
                if (!(CompileParam_SplitOperator(Equation, "=<>&" + Units.ScriptCmp.OP_GREATEREQUAL + Units.ScriptCmp.OP_LESSEREQUAL + Units.ScriptCmp.OP_AND + Units.ScriptCmp.OP_OR + Units.ScriptCmp.OP_XOR + Units.ScriptCmp.OP_NOTEQUAL, ref V1, ref V2, ref Op)))
                {
                    if (!(CompileParam_SplitOperator(Equation, "+-", ref V1, ref V2, ref Op)))
                    {
                        if (!(CompileParam_SplitOperator(Equation, "*/", ref V1, ref V2, ref Op)))
                        {
                            Split = false;
                        }
                    }
                }
                if (Split)
                {
                    result.Value1 = CompileParam_BreakDown(V1);
                    result.Value2 = CompileParam_BreakDown(V2);
                    result.Op = Op;
                }
                else
                {
                    // no operators left, just a value
                    result.Op = Units.ScriptCmp.OP_NONE;
                    //@ Unsupported function or procedure: 'StrNew'
                    result.Value1 = StrNew((Equation as string));
                }
            }
            // trap exceptions to free up CalcUnit
            catch(Exception E) {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(result);
                throw E;
            }
            return result;
        }

        public string CompileParam_CompileTree(TBranch Branch)
        {
            string result;
            string Value1;
            string Value2;
            // return the name of the variable containing the result of this operation
            SysVarCount ++;
            result = "$$" + (SysVarCount).ToString();
            if ((Branch.Op == Units.ScriptCmp.OP_NONE))
            {
                // its a value
                //@ Unsupported function or procedure: 'SetString'
                SetString(result, (Branch.Value1 as string), Branch.Value1.Length);
                (Branch.Value1 as string) = null ;
            }
            else
            {
                // its an operation
                Value1 = CompileParam_CompileTree(Branch.Value1);
                Value2 = CompileParam_CompileTree(Branch.Value2);
                if ((Branch.Op == '+'))
                {
                    // addition (+): add the values together
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"ADD", result, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == '-'))
                {
                    // subraction (-): subtract Value2 from Value1
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"SUBTRACT", result, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == '*'))
                {
                    // multiplication (*): multiply values together
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"MULTIPLY", result, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == '/'))
                {
                    // division (/): divide Value1 by Value2
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"DIVIDE", result, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == '&'))
                {
                    // concatenation (&): concatenate both values
                    RecurseCmd(new string[] {"MERGETEXT", Value1, Value2, result}, Line, ScriptID);
                }
                else if ((Branch.Op == '='))
                {
                    // equal test (=): set result to 1 if both values are equal, otherwise 0
                    RecurseCmd(new string[] {"ISEQUAL", result, Value1, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == '>'))
                {
                    // greater than test (>): set result to 1 if Value1 > Value2, otherwise 0
                    RecurseCmd(new string[] {"ISGREATER", result, Value1, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == '<'))
                {
                    // lesser than test (<): set result to 1 if Value1 < Value2, otherwise 0
                    RecurseCmd(new string[] {"ISLESSER", result, Value1, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == Units.ScriptCmp.OP_GREATEREQUAL))
                {
                    // greater than or equal to test (>=): set result to 1 if Value1 >= Value2, otherwise 0
                    RecurseCmd(new string[] {"ISGREATEREQUAL", result, Value1, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == Units.ScriptCmp.OP_LESSEREQUAL))
                {
                    // lesser than or equal to test (<=): set result to 1 if Value1 <= Value2, otherwise 0
                    RecurseCmd(new string[] {"ISLESSEREQUAL", result, Value1, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == Units.ScriptCmp.OP_NOTEQUAL))
                {
                    // not equal to test (<>): set result to 1 if values are not equal, otherwise 0
                    RecurseCmd(new string[] {"ISNOTEQUAL", result, Value1, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == Units.ScriptCmp.OP_AND))
                {
                    // AND boolean operator (AND)
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"AND", result, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == Units.ScriptCmp.OP_OR))
                {
                    // OR boolean operator (OR)
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"OR", result, Value2}, Line, ScriptID);
                }
                else if ((Branch.Op == Units.ScriptCmp.OP_XOR))
                {
                    // Exclusive OR boolean operator (XOR)
                    RecurseCmd(new string[] {"SETVAR", result, Value1}, Line, ScriptID);
                    RecurseCmd(new string[] {"XOR", result, Value2}, Line, ScriptID);
                }
            }
            // free up the branch
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(Branch);
            return result;
        }

        protected void CompileParam(string Param, ref string CmdCode, TParamKind ParamKind, int Line, byte ScriptID)
        {
            TBranch Root;
            string Value;
            // Param is a set of Command parameters linked by operators, i.e. ($VAR+50)&"text"
            // We need to form a binary tree of all operations to be performed
            Root = CompileParam_BreakDown(Param);
            if ((Root.Op == Units.ScriptCmp.OP_NONE))
            {
                // tree is only one value, compile it
                //@ Unsupported function or procedure: 'SetString'
                SetString(Value, (Root.Value1 as string), Root.Value1.Length);
                (Root.Value1 as string) = null ;
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Root);
                CompileValue(Value, ref CmdCode, ParamKind, Line, ScriptID);
            }
            else
            {
                if ((ParamKind == ScriptRef.TParamKind.pkVar))
                {
                    throw new EScriptError("Command parameter must be a variable");
                }
                // branch up the tree and process each operation
                CompileValue(CompileParam_CompileTree(Root), ref CmdCode, ParamKind, Line, ScriptID);
            }
        }

        protected void CompileParamLine(List<string> ParamLine, int Line, byte ScriptID)
        {
            ushort LineWord;
            ushort ID;
            int I;
            string LabelName;
            string CmdCode;
            TConditionStruct ConStruct;
            // F : TextFile; // EP
            // ParamLineString : String; // EP
            // ParamLine is a broken down list of all params in the line, including the command.
            if ((ParamLine[0][1] == ':'))
            {
                // label - record its position
                // (*
                // // EP - For capturing processed script syntax
                // SetCurrentDir('c:\temp');
                // AssignFile(F, 'TWX_Preprocessed.txt');
                // {$I-}
                // Append(F);
                // 
                // if (IOResult <> 0) then
                // ReWrite(F);
                // 
                // if (IOResult <> 0) then
                // raise EScriptError.Create('Unable to write to file c:\temp\TWX_Preprocessed.txt');
                // {$I+}
                // WriteLn(F, ParamLine[0]);
                // CloseFile(F);
                // // EP
                // *)
                if ((ParamLine.Count > 1))
                {
                    throw new EScriptError("Unnecessary parameters after label declaration");
                }
                if ((ParamLine[0].Length < 2))
                {
                    throw new EScriptError("Bad label name");
                }
                //@ Unsupported function or procedure: 'Copy'
                LabelName = Copy(ParamLine[0], 2, ParamLine[0].Length);
                if ((LabelName.IndexOf('~') == 0) && (ScriptID > 0))
                {
                    BuildLabel(IncludeScriptList[ScriptID] + '~' + LabelName, FCodeSize);
                }
                else
                {
                    BuildLabel(LabelName, FCodeSize);
                }
            }
            else
            {
                // check for macro commands
                if ((ParamLine[0] == "WHILE"))
                {
                    if ((ParamLine.Count > 2))
                    {
                        throw new EScriptError("Unnecessary parameters after WHILE macro");
                    }
                    else if ((ParamLine.Count < 2))
                    {
                        throw new EScriptError("No parameters to compare with WHILE macro");
                    }
                    // write WHILE macro
                    //@ Unsupported function or procedure: 'AllocMem'
                    ConStruct = AllocMem(sizeof(TConditionStruct));
                    ConStruct.IsWhile = true;
                    IFLabelCount ++;
                    ConStruct.ConLabel = "::" + (IFLabelCount).ToString();
                    IFLabelCount ++;
                    ConStruct.EndLabel = "::" + (IFLabelCount).ToString();
                    IFStack.Push(ConStruct);
                    //@ Unsupported property or method(D): 'ConLabel'
                    RecurseCmd(new object[] {ConStruct.ConLabel}, Line, ScriptID);
                    //@ Unsupported property or method(D): 'EndLabel'
                    RecurseCmd(new object[] {"BRANCH", ParamLine[1], ConStruct.EndLabel}, Line, ScriptID);
                }
                else if ((ParamLine[0] == "IF"))
                {
                    if ((ParamLine.Count > 2))
                    {
                        throw new EScriptError("Unnecessary parameters after IF macro");
                    }
                    else if ((ParamLine.Count < 2))
                    {
                        throw new EScriptError("No parameters to compare with IF macro");
                    }
                    // write IF macro
                    //@ Unsupported function or procedure: 'AllocMem'
                    ConStruct = AllocMem(sizeof(TConditionStruct));
                    //@ Unsupported property or method(D): 'AtElse'
                    ConStruct.AtElse = false;
                    //@ Unsupported property or method(D): 'IsWhile'
                    ConStruct.IsWhile = false;
                    IFLabelCount ++;
                    //@ Unsupported property or method(D): 'ConLabel'
                    ConStruct.ConLabel = "::" + (IFLabelCount).ToString();
                    IFLabelCount ++;
                    //@ Unsupported property or method(D): 'EndLabel'
                    ConStruct.EndLabel = "::" + (IFLabelCount).ToString();
                    IFStack.Push(ConStruct);
                    //@ Unsupported property or method(D): 'ConLabel'
                    RecurseCmd(new object[] {"BRANCH", ParamLine[1], ConStruct.ConLabel}, Line, ScriptID);
                }
                else if ((ParamLine[0] == "ELSE"))
                {
                    if ((ParamLine.Count > 1))
                    {
                        throw new EScriptError("Unnecessary parameters after ELSE macro");
                    }
                    if ((IFStack.Count == 0))
                    {
                        throw new EScriptError("ELSE without IF");
                    }
                    // write ELSE macro
                    ConStruct = IFStack.Peek();
                    //@ Unsupported property or method(D): 'IsWhile'
                    if ((ConStruct.IsWhile))
                    {
                        throw new EScriptError("Cannot use ELSE with WHILE");
                    }
                    //@ Unsupported property or method(D): 'AtElse'
                    if ((ConStruct.AtElse))
                    {
                        throw new EScriptError("IF macro syntax error");
                    }
                    //@ Unsupported property or method(D): 'AtElse'
                    ConStruct.AtElse = true;
                    //@ Unsupported property or method(D): 'EndLabel'
                    RecurseCmd(new object[] {"GOTO", ConStruct.EndLabel}, Line, ScriptID);
                    //@ Unsupported property or method(D): 'ConLabel'
                    RecurseCmd(new object[] {ConStruct.ConLabel}, Line, ScriptID);
                }
                else if ((ParamLine[0] == "ELSEIF"))
                {
                    if ((ParamLine.Count > 2))
                    {
                        throw new EScriptError("Unnecessary parameters after ELSEIF macro");
                    }
                    else if ((ParamLine.Count < 2))
                    {
                        throw new EScriptError("No parameters to compare with ELSEIF macro");
                    }
                    if ((IFStack.Count == 0))
                    {
                        throw new EScriptError("ELSEIF without IF");
                    }
                    // write ELSEIF macro
                    ConStruct = IFStack.Peek();
                    //@ Unsupported property or method(D): 'IsWhile'
                    if ((ConStruct.IsWhile))
                    {
                        throw new EScriptError("Cannot use ELSEIF with WHILE");
                    }
                    //@ Unsupported property or method(D): 'AtElse'
                    if ((ConStruct.AtElse))
                    {
                        throw new EScriptError("IF macro syntax error");
                    }
                    //@ Unsupported property or method(D): 'EndLabel'
                    RecurseCmd(new object[] {"GOTO", ConStruct.EndLabel}, Line, ScriptID);
                    //@ Unsupported property or method(D): 'ConLabel'
                    RecurseCmd(new object[] {ConStruct.ConLabel}, Line, ScriptID);
                    IFLabelCount ++;
                    //@ Unsupported property or method(D): 'ConLabel'
                    ConStruct.ConLabel = "::" + (IFLabelCount).ToString();
                    //@ Unsupported property or method(D): 'ConLabel'
                    RecurseCmd(new object[] {"BRANCH", ParamLine[1], ConStruct.ConLabel}, Line, ScriptID);
                }
                else if ((ParamLine[0] == "END"))
                {
                    if ((ParamLine.Count > 1))
                    {
                        throw new EScriptError("Unnecessary parameters after END macro");
                    }
                    if ((IFStack.Count == 0))
                    {
                        throw new EScriptError("END without IF");
                    }
                    // write END macro
                    ConStruct = IFStack.Pop();
                    //@ Unsupported property or method(D): 'IsWhile'
                    if ((ConStruct.IsWhile))
                    {
                        //@ Unsupported property or method(D): 'ConLabel'
                        RecurseCmd(new object[] {"GOTO", ConStruct.ConLabel}, Line, ScriptID);
                    }
                    else
                    {
                        //@ Unsupported property or method(D): 'ConLabel'
                        RecurseCmd(new object[] {ConStruct.ConLabel}, Line, ScriptID);
                    }
                    //@ Unsupported property or method(D): 'EndLabel'
                    RecurseCmd(new object[] {ConStruct.EndLabel}, Line, ScriptID);
                    //@ Unsupported property or method(D): 'ConLabel'
                    ConStruct.ConLabel = "";
                    //@ Unsupported property or method(D): 'EndLabel'
                    ConStruct.EndLabel = "";
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(ConStruct);
                }
                else if ((ParamLine[0] == "INCLUDE"))
                {
                    if ((ParamLine.Count > 2))
                    {
                        throw new EScriptError("Unnecessary parameters after INCLUDE macro");
                    }
                    else if ((ParamLine.Count < 2))
                    {
                        throw new EScriptError("No file name supplied for INCLUDE macro");
                    }
                    if ((ParamLine[1][1] == '\"'))
                    {
                        //@ Unsupported function or procedure: 'Copy'
                        ParamLine[1] = Copy(ParamLine[1], 2, ParamLine[1].Length - 2);
                    }
                    // include script
                    IncludeFile(ParamLine[1]);
                }
                else if ((ParamLine[0] == "WAITON"))
                {
                    // WaitOn macro - create text trigger and label
                    if ((ParamLine.Count > 2))
                    {
                        throw new EScriptError("Unnecessary parameters after WAITON macro");
                    }
                    else if ((ParamLine.Count < 2))
                    {
                        throw new EScriptError("No wait text supplied for WAITON macro");
                    }
                    WaitOnCount ++;
                    RecurseCmd(new System.Collections.Generic.List`1[] {"SETTEXTTRIGGER", "WAITON" + (WaitOnCount).ToString(), ":WAITON" + (WaitOnCount).ToString(), ParamLine[1]}, Line, ScriptID);
                    RecurseCmd(new string[] {"PAUSE"}, Line, ScriptID);
                    RecurseCmd(new string[] {":WAITON" + (WaitOnCount).ToString()}, Line, ScriptID);
                }
                else
                {
                    // identify script command
                    // (*
                    // // EP - For capturing processed script syntax
                    // SetCurrentDir('c:\temp');
                    // AssignFile(F, 'TWX_Preprocessed.txt');
                    // {$I-}
                    // Append(F);
                    // 
                    // if (IOResult <> 0) then
                    // ReWrite(F);
                    // 
                    // if (IOResult <> 0) then
                    // raise EScriptError.Create('Unable to write to file c:\temp\TWX_Preprocessed.txt');
                    // {$I+}
                    // 
                    // // EP - Code to record the actual lines to be compiled, after all preprocessing
                    // ParamLineString := ParamLine[0];
                    // for I := 1 to ParamLine.Count - 1 do
                    // ParamLineString := ParamLineString + ' ' + ParamLine[I];
                    // WriteLn(F, ParamLineString);
                    // CloseFile(F);
                    // // EP
                    // *)
                    FCmdCount ++;
                    I = ScriptRef.FindCmd(ParamLine[0]);
                    if ((I < 0))
                    {
                        // command not found, give error message
                        throw new EScriptError("Unknown command \'" + ParamLine[0] + '\'');
                    }
                    ID = I;
                    CmdCode = "";
                    LineWord = Line;
                    WriteCode(ref CmdCode, ScriptID, 1);
                    WriteCode(ref CmdCode, LineWord, 2);
                    WriteCode(ref CmdCode, ID, 2);
                    // check if we have the right number of parameters
                    if ((ParamLine.Count - 1 > ScriptRef.Cmds[ID].MaxParams) && (ScriptRef.Cmds[ID].MaxParams >  -1))
                    {
                        throw new EScriptError("Too many parameters for command \'" + ParamLine[0] + '\'');
                    }
                    else if ((ParamLine.Count - 1 < ScriptRef.Cmds[ID].MinParams))
                    {
                        throw new EScriptError("Too few parameters for command \'" + ParamLine[0] + '\'');
                    }
                    // compile the parameters independantly
                    for (I = 1; I < ParamLine.Count; I ++ )
                    {
                        CompileParam(ParamLine[I], ref CmdCode, ScriptRef.Cmds[ID].ParamKinds[I - 1], Line, ScriptID);
                    }
                    // write the command to byte code (with null termination)
                    AppendCode((CmdCode as string), CmdCode.Length + 1);
                }
            }
        }

        protected string ConvertOps(string Line)
        {
            string result;
            int I;
            string UpParam;
            string Param;
            bool InQuote;
            Param = "";
            result = "";
            InQuote = false;
            for (I = 1; I <= Line.Length; I ++ )
            {
                if ((Line[I] == '\"'))
                {
                    InQuote = !InQuote;
                }
                if ((Line[I] == ' '))
                {
                    if (!InQuote)
                    {
                        UpParam = Param.ToUpper();
                        if ((UpParam == "AND"))
                        {
                            Param = Units.ScriptCmp.OP_AND;
                        }
                        else if ((UpParam == "OR"))
                        {
                            Param = Units.ScriptCmp.OP_OR;
                        }
                        else if ((UpParam == "XOR"))
                        {
                            Param = Units.ScriptCmp.OP_XOR;
                        }
                    }
                    result = result + Param + ' ';
                    Param = "";
                }
                else
                {
                    Param = Param + Line[I];
                }
            }
            return result;
        }

        protected string ConvertConditions(string Line)
        {
            string result;
            int I;
            char C;
            char Last;
            bool InQuote;
            // convert multi-character conditions (>=, <> and <=) into single character ones
            Last = '\0';
            result = "";
            InQuote = false;
            for (I = 1; I <= Line.Length; I ++ )
            {
                C = Line[I];
                if ((C == '\"'))
                {
                    InQuote = !InQuote;
                    result = result + C;
                }
                else if ((C == '=') && !InQuote)
                {
                    if ((Last == '>'))
                    {
                        result = result + Units.ScriptCmp.OP_GREATEREQUAL;
                    }
                    else if ((Last == '<'))
                    {
                        result = result + Units.ScriptCmp.OP_LESSEREQUAL;
                    }
                    else
                    {
                        result = result + '=';
                    }
                }
                else if (((C != '>') && (C != '<')) || InQuote)
                {
                    if (((Last == '>') || (Last == '<')) && !InQuote)
                    {
                        result = result + Last + C;
                    }
                    else
                    {
                        result = result + C;
                    }
                }
                else if ((Last == '<') && (C == '>'))
                {
                    result = result + Units.ScriptCmp.OP_NOTEQUAL;
                    C = '\0';
                }
                Last = C;
            }
            return result;
        }

        protected bool IsOperator(char C)
        {
            bool result;
            if ((C == '=') || (C == '>') || (C == '<') || (C == '+') || (C == '-') || (C == '*') || (C == '/') || (C == '&') || (C == Units.ScriptCmp.OP_GREATEREQUAL) || (C == Units.ScriptCmp.OP_LESSEREQUAL) || (C == Units.ScriptCmp.OP_AND) || (C == Units.ScriptCmp.OP_OR) || (C == Units.ScriptCmp.OP_XOR) || (C == Units.ScriptCmp.OP_NOTEQUAL))
            {
                result = true;
            }
            else
            {
                result = false;
            }
            return result;
        }

        protected void CompileFromStrings(List<string> ScriptText, string ScriptName)
        {
            byte ScriptID;
            int Line;
            int I;
            string ParamStr;
            string LineText;
            char Last;
            bool Linked;
            bool InQuote;
            List<string> ParamLine;
            FLineCount = FLineCount + ScriptText.Count;
            ScriptID = IncludeScriptList.Add(ScriptName.ToUpper());
            ParamLine = new List<string>();
            Line = 1;
            try {
                try {
                    while ((Line <= ScriptText.Count))
                    {
                        Last = ' ';
                        ParamStr = "";
                        LineText = ConvertConditions(ConvertOps(ScriptText[Line - 1] + ' '));
                        InQuote = false;
                        Linked = false;
                        ParamLine.Clear();
                        if ((LineText.Length > 0))
                        {
                            for (I = 1; I <= LineText.Length; I ++ )
                            {
                                if ((LineText[I] == '#') && (ParamStr == "") && (ParamLine.Count == 0))
                                {
                                    break;
                                }
                                // its a comment
                                if ((LineText[I] == '/') && (Last == '/'))
                                {
                                    // It's an in-line comment, like this one (//)
                                    ParamStr = ParamStr.Substring(1 - 1 ,ParamStr.Length - 1);
                                    break;
                                }
                                if (!InQuote && (IsOperator(LineText[I])))
                                {
                                    if (Linked)
                                    {
                                        throw new EScriptError("Operation syntax error");
                                    }
                                    Linked = true;
                                    ParamStr = ParamStr + LineText[I];
                                }
                                else if (((LineText[I] != ' ') && (LineText[I] != "\09")) || InQuote)
                                {
                                    if (((Last == ' ') || (Last == "\09")) && !Linked && !InQuote && (ParamStr != ""))
                                    {
                                        // parameter completed
                                        //@ Unsupported property or method(A): 'Append'
                                        ParamLine.Append(ParamStr);
                                        ParamStr = "";
                                    }
                                    if (InQuote)
                                    {
                                        ParamStr = ParamStr + LineText[I];
                                    }
                                    else
                                    {
                                        ParamStr = ParamStr + Char.ToUpper(LineText[I]);
                                    }
                                    if ((LineText[I] == '\"'))
                                    {
                                        InQuote = !InQuote;
                                    }
                                    Linked = false;
                                }
                                Last = LineText[I];
                            }
                            // reset our system variable count (for operators)
                            SysVarCount = 0;
                            // complete last param
                            //@ Unsupported property or method(A): 'Append'
                            ParamLine.Append(ParamStr);
                            // compile the line
                            if (!((ParamLine.Count == 0) || ((ParamStr == "") && (ParamLine.Count == 1))))
                            {
                                CompileParamLine(ParamLine, Line, ScriptID);
                            }
                        }
                        Line ++;
                    }
                    // make sure our IF/ELSE/END blocks match up properly
                    if ((IFStack.Count != 0))
                    {
                        throw new EScriptError("IF/WHILE .. END structure mismatch");
                    }
                }
                // add a line number to the exception message
                catch(EScriptError E) {
                    throw new EScriptError(E.Message + ", line " + (Line).ToString() + " (" + IncludeScriptList[ScriptID] + ')');
                }
                catch {
                    throw new EScriptError("Unknown error, line " + (Line).ToString() + " (" + IncludeScriptList[ScriptID] + ')');
                }
            } finally {
                //@ Unsupported property or method(C): 'Free'
                ParamLine.Free;
            }
        }

        protected void IncludeFile(string Filename)
        {
            List<string> ScriptText;
            int Len;
            int I;
            string S;
            string Name;
            TEncryptor Encryptor;
            System.IO.File F;
            object Buf;
            // include more code in this script
            Name = Utility.Units.Utility.FetchScript(Filename, true).ToUpper();
            // see if its already included
            if ((IncludeScriptList.Count > 0))
            {
                for (I = 0; I < IncludeScriptList.Count; I ++ )
                {
                    if ((IncludeScriptList[I] == Name))
                    {
                        return;
                    }
                }
            }
            // already included
            ScriptText = new List<string>();
            try {
                if ((Name.Substring(Name.Length - 3 - 1 ,4) == ".INC"))
                {
                    try {
                        Encryptor = new TEncryptor(this);
                        try {
                            Encryptor.ChunkKey = 210;
                            Encryptor.ChunkSize = 25;
                            Encryptor.Key = "195,23,85,11,77";
                            Encryptor.Shift = 14;
                            Encryptor.ShiftKey = 78;
                            F = new FileInfo(Name);
                            _R_1 = F.OpenText();
                            Len = _W_0.BaseStream.Length;
                            //@ Unsupported function or procedure: 'AllocMem'
                            Buf = AllocMem(Len);
                            try {
                                //@ Unsupported function or procedure: 'BlockRead'
                                BlockRead(F, Buf, Len);
                                //@ Unsupported function or procedure: 'SetString'
                                SetString(S, (Buf as string), Len);
                            } finally {
                                //@ Unsupported function or procedure: 'FreeMem'
                                FreeMem(Buf);
                            }
                            _W_0.Close();
                            Encryptor.Decrypt(ref S);
                            //@ Unsupported property or method(C): 'Text'
                            ScriptText.Text = S;
                        } finally {
                            //@ Unsupported property or method(C): 'Free'
                            Encryptor.Free;
                        }
                    }
                    catch {
                        throw new EScriptError("Unable to include pack2 subroutine \'" + Filename + '\'');
                    }
                }
                else
                {
                    try {
                        //@ Unsupported property or method(A): 'LoadFromFile'
                        ScriptText.LoadFromFile(Name);
                    }
                    catch {
                        throw new EScriptError("Unable to process include file \'" + Filename + '\'');
                    }
                }
                CompileFromStrings(ScriptText, Utility.Units.Utility.StripFileExtension(Utility.Units.Utility.ShortFilename(Filename)));
            } finally {
                //@ Unsupported property or method(C): 'Free'
                ScriptText.Free;
            }
        }

        public void CompileFromFile(string Filename, string DescFile)
        {
            List<string> ScriptText;
            // compile this file into byte code
            FScriptFile = Filename;
            ScriptText = new List<string>();
            try {
                //@ Unsupported property or method(A): 'LoadFromFile'
                ScriptText.LoadFromFile(Filename);
                IFLabelCount = 0;
                WaitOnCount = 0;
                CompileFromStrings(ScriptText, Utility.Units.Utility.ShortFilename(Filename));
            } finally {
                //@ Unsupported property or method(C): 'Free'
                ScriptText.Free;
            }
        }

        public void WriteToFile(string Filename)
        {
            System.IO.File F;
            TScriptFileHeader Hdr;
            TCmdParam Param;
            int Pos;
            int Len;
            int I;
            byte ParamType;
            string Val;
            // write script to a file to be loaded from later
            F = new FileInfo(Filename);
            _W_0 = F.CreateText();
            Hdr.ProgramName = "TWX SCRIPT";
            Hdr.Version = Units.ScriptCmp.COMPILED_SCRIPT_VERSION;
            Hdr.CodeSize = FCodeSize;
            //@ Unsupported property or method(C): 'Text'
            Hdr.DescSize = FDescription.Text.Length;
            //@ Unsupported function or procedure: 'BlockWrite'
            BlockWrite(F, Hdr, sizeof(Hdr));
            if ((Hdr.DescSize > 0))
            {
                // write description to file
                //@ Unsupported property or method(C): 'Text'
                Val = (FDescription.Text as string);
                //@ Unsupported function or procedure: 'BlockWrite'
                BlockWrite(F, Val, Hdr.DescSize);
            }
            // write code
            //@ Unsupported function or procedure: 'BlockWrite'
            BlockWrite(F, FCode, FCodeSize);
            // write cmdParams
            if ((FParamList.Count > 0))
            {
                for (I = 0; I < FParamList.Count; I ++ )
                {
                    Param = ((TCmdParam)(FParamList[I]));
                    Val = (ApplyEncryption(Param.Value, 113) as string);
                    Len = Param.Value.Length;
                    if ((Param is TVarParam))
                    {
                        ParamType = 2;
                        // TVarParam is parameter type 2
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, ParamType, 1);
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, Len, 4);
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, Val, Len);
                        Val = (ApplyEncryption(((Param) as TVarParam).Name, 113) as string);
                        Len = ((Param) as TVarParam).Name.Length;
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, Len, 4);
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, Val, Len);
                    }
                    else
                    {
                        // TCmdParam
                        ParamType = 1;
                        // TCmdParam is parameter type 1
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, ParamType, 1);
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, Len, 4);
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(F, Val, Len);
                    }
                }
            }
            // terminate cmdParams with null value
            ParamType = 0;
            //@ Unsupported function or procedure: 'BlockWrite'
            BlockWrite(F, ParamType, 1);
            // write include script names
            if ((IncludeScriptList.Count > 0))
            {
                for (I = 0; I < IncludeScriptList.Count; I ++ )
                {
                    Val = (IncludeScriptList[I] as string);
                    Len = IncludeScriptList[I].Length;
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Len, 4);
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Val, Len);
                }
            }
            // terminal include script names with null length
            Len = 0;
            //@ Unsupported function or procedure: 'BlockWrite'
            BlockWrite(F, Len, 4);
            // write labels
            if ((FLabelList.Count > 0))
            {
                for (I = 0; I < FLabelList.Count; I ++ )
                {
                    Pos = ((FLabelList[I]) as TScriptLabel).Location;
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Pos, 4);
                    Val = (((FLabelList[I]) as TScriptLabel).Name as string);
                    Len = ((FLabelList[I]) as TScriptLabel).Name.Length;
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Len, 4);
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Val, Len);
                }
            }
            _W_0.Close();
        }

        public void AddParam(object Param)
        {
            FParamList.Add(Param);
        }

        public void LoadFromFile(string Filename)
        {
            System.IO.File F;
            TScriptFileHeader Hdr;
            int Location;
            int Len;
            TCmdParam Param;
            byte ParamType;
            string Val;
            string ValStr;
            TScriptLabel Lab;
            // load script data from file
            FScriptFile = Filename;
            if ((FCodeSize > 0))
            {
                throw new EScriptError("Code already exists - cannot load from file");
            }
            F = new FileInfo(Filename);
            _R_1 = F.OpenText();
            // read header
            //@ Unsupported function or procedure: 'BlockRead'
            BlockRead(F, Hdr, sizeof(Hdr));
            // check header
            if ((Hdr.ProgramName != "TWX SCRIPT"))
            {
                // This version is backwards compatable with the v3 compiler
                throw new EScriptError("File is not a compiled TWX script");
            }
            else if ((Hdr.Version < 2) || (Hdr.Version > Units.ScriptCmp.COMPILED_SCRIPT_VERSION))
            {
                throw new EScriptError("Script file is an incorrect version");
            }
            // skip past description
            if ((Hdr.DescSize > 0))
            {
                _R_1.BaseStream.Seek(_W_0.BaseStream.Position + Hdr.DescSize, SeekOrigin.Begin);
            }
            // read code
            //@ Unsupported function or procedure: 'AllocMem'
            FCode = AllocMem(Hdr.CodeSize);
            //@ Unsupported function or procedure: 'BlockRead'
            BlockRead(F, FCode, Hdr.CodeSize);
            FCodeSize = Hdr.CodeSize;
            // read cmdParams
            //@ Unsupported function or procedure: 'BlockRead'
            BlockRead(F, ParamType, 1);
            while ((ParamType > 0))
            {
                if ((ParamType == 1))
                {
                    // TCmdParam
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Len, 4);
                    //@ Unsupported function or procedure: 'AllocMem'
                    Val = AllocMem(Len + 1);
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Val, Len);
                    //@ Unsupported function or procedure: 'SetString'
                    SetString(ValStr, Val, Len);
                    // TWXServer.Broadcast('TCmdParam<' + ApplyEncryption(ValStr, 113) + '>' + endl);
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(Val);
                    Param = new TCmdParam();
                    Param.Value = ApplyEncryption(ValStr, 113);
                    FParamList.Add(Param);
                }
                else
                {
                    // TVarParam (2)
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Len, 4);
                    //@ Unsupported function or procedure: 'AllocMem'
                    Val = AllocMem(Len + 1);
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Val, Len);
                    //@ Unsupported function or procedure: 'SetString'
                    SetString(ValStr, Val, Len);
                    // TWXServer.Broadcast('TVarParam1<' + ApplyEncryption(ValStr, 113) + '>' + endl);
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(Val);
                    Param = new TVarParam();
                    //@ Unsupported property or method(D): 'Value'
                    Param.Value = ApplyEncryption(ValStr, 113);
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Len, 4);
                    //@ Unsupported function or procedure: 'AllocMem'
                    Val = AllocMem(Len + 1);
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Val, Len);
                    //@ Unsupported function or procedure: 'SetString'
                    SetString(ValStr, Val, Len);
                    // TWXServer.Broadcast('TVarParam2<' + ApplyEncryption(ValStr, 113) + '>' + endl);
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(Val);
                    ((Param) as TVarParam).Name = ApplyEncryption(ValStr, 113);
                    FParamList.Add(Param);
                }
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, ParamType, 1);
            }
            // read include script names
            //@ Unsupported function or procedure: 'BlockRead'
            BlockRead(F, Len, 4);
            while ((Len > 0))
            {
                //@ Unsupported function or procedure: 'AllocMem'
                Val = AllocMem(Len + 1);
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Val, Len);
                //@ Unsupported function or procedure: 'SetString'
                SetString(ValStr, Val, Len);
                // TWXServer.Broadcast('Include<' + ValStr + '>' + endl);
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Val);
                IncludeScriptList.Add(ValStr);
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Len, 4);
            }
            // read labels
            while (!((_W_0.BaseStream.Position >= _W_0.BaseStream.Length)))
            {
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Location, 4);
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Len, 4);
                //@ Unsupported function or procedure: 'AllocMem'
                Val = AllocMem(Len + 1);
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Val, Len);
                //@ Unsupported function or procedure: 'SetString'
                SetString(ValStr, Val, Len);
                // TWXServer.Broadcast('Label<' + ValStr + '>' + endl);
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Val);
                Lab = new TScriptLabel();
                Lab.Name = ValStr;
                Lab.Location = Location;
                FLabelList.Add(Lab);
            }
            _W_0.Close();
        }

    } // end TScriptCmp

    public struct TBranch
    {
        public object Value1;
        public object Value2;
        public char Op;
    } // end TBranch

}

namespace ScriptCmp.Units
{
    public class ScriptCmp
    {
        // TWX Proxy 2.02 is version 1
        // TWX Proxy 2.03Beta is version 2?
        // TWX Proxy 2.03Final is version 3
        // TWX Proxy 2.04 is version 4
        // TWX Proxy 2.05 is version 5
        public const int COMPILED_SCRIPT_VERSION = 5;
        public const int PARAM_CMD = 0;
        public const int PARAM_VAR = 1;
        // User variable prefix
        public const int PARAM_CONST = 2;
        // Compiler string constant prefix
        public const int PARAM_SYSCONST = 3;
        // Read only system value
        public const int PARAM_PROGVAR = 4;
        // Program variable
        public const int PARAM_CHAR = 5;
        // Character code
        public const char OP_GREATEREQUAL = 'æ';
        public const char OP_LESSEREQUAL = 'ç';
        public const char OP_AND = 'è';
        public const char OP_OR = 'é';
        public const char OP_XOR = 'ê';
        public const char OP_NOT = 'ë';
        public const char OP_NOTEQUAL = 'ì';
        public const char OP_NONE = '\0';
    } // end ScriptCmp

}

