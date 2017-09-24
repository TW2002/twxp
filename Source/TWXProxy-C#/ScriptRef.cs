using System;
using System.Collections;
using System.IO;
using Utility;
using ScriptCmd;
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
namespace ScriptRef
{
    // TCmdParam: Base class for all command parameters processed within a script.  These
    // parameters are identified during script compilation and stored in a list within the
    // script.  While the compiled script is interpreted these parameters are passed to the
    // script command handling functions within the ScriptCmd unit.
    public class TCmdParam
    {
        public string Value
        {
          get {
            return GetStrValue();
          }
          set {
            SetStrValue(value);
          }
        }
        public double DecValue
        {
          get {
            return GetDecValue();
          }
          set {
            SetDecValue(value);
          }
        }
        public byte SigDigits
        {
          get {
            return FSigDigits;
          }
          set {
            FSigDigits = value;
          }
        }
        public bool IsNumeric
        {
          get {
            return FIsNumeric;
          }
        }
        // write FIsNumeric;
        public bool IsTemporary
        {
          get {
            return FIsTemporary;
          }
          set {
            FIsTemporary = value;
          }
        }
        protected string FStrValue = String.Empty;
        protected double FDecValue = 0;
        protected byte FSigDigits = 0;
        protected bool FIsNumeric = false;
        protected bool FNumChanged = false;
        protected bool FIsTemporary = false;
        // ***************************************************************
        // TCmdParam implementation
        //Constructor  Create()
        public TCmdParam() : base()
        {
            // set defaults
            FStrValue = '0';
            FDecValue = 0;
            FSigDigits = 0;
            FIsNumeric = true;
            FNumChanged = false;
            FIsTemporary = false;
        }
        //@ Destructor  Destroy()
        ~TCmdParam()
        {
            FStrValue = "";
            FDecValue = 0;
            //@ Unsupported property or method(D): 'Destroy'
            base.Destroy;
        }
        public void SetBool(bool B)
        {
            if (B)
            {
                FStrValue = '1';
                FDecValue = 1;
                FSigDigits = 0;
                FIsNumeric = true;
                FNumChanged = false;
            }
            else
            {
                FStrValue = '0';
                FDecValue = 0;
                FSigDigits = 0;
                FIsNumeric = true;
                FNumChanged = false;
            }
        }

        protected void SetStrValue(string S)
        {
            FStrValue = S;
            FIsNumeric = false;
        }

        protected string GetStrValue()
        {
            string result;
            char[] Buffer = '\0';
            // EP - Make it persist for efficiency
            int Len;
            // EP - if it is a number, then the string value needs to be determined
            if ((FIsNumeric == true) && (FNumChanged == true))
            {
                // EP: Perhaps this needs to be rounded first
                if (FSigDigits == 0)
                {
                    FStrValue = (Convert.ToInt64(FDecValue)).ToString();
                }
                else
                {
                    //@ Undeclared identifier(3): 'fvExtended'
                    //@ Undeclared identifier(3): 'ffFixed'
                    Len = Convert.ToString(Buffer);
                    //@ Unsupported function or procedure: 'SetString'
                    SetString(FStrValue, Buffer, Len);
                    FNumChanged = false;
                }
            }
            result = FStrValue;
            return result;
        }

        protected void SetDecValue(double E)
        {
            FDecValue = E;
            FIsNumeric = true;
            FNumChanged = true;
            // EP - Signals a FloatToText conversion when FStrValue is queried

        }

        protected double GetDecValue()
        {
            double result;
            double F;
            int DecPos;
            if (FIsNumeric == false)
            {
                //@ Undeclared identifier(3): 'fvExtended'
                //@ Unsupported function or procedure: 'TextToFloat'
                if (TextToFloat((FStrValue as string), F, fvExtended))
                {
                    FDecValue = F;
                    DecPos = FStrValue.IndexOf('.');
                    if (DecPos == 0)
                    {
                        FSigDigits = 0;
                    }
                    else
                    {
                        FSigDigits = FStrValue.Length - DecPos;
                    }
                    FIsNumeric = true;
                    FNumChanged = false;
                // EP - meaning FStrValue & FDecValue are sync'd
                }
                else
                {
                    throw new EScriptError('\'' + FStrValue + "\' is not a number");
                }
            }
            result = FDecValue;
            return result;
        }

    } // end TCmdParam

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

    // TScriptCmd: A built in script command.  Script commands are defined in the ScriptCmd
    // unit.  Each command has its own internal parameter processing which updates script
    // variables/triggers to allow the scripting language to function.
    public class TScriptCmd
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
        // must be stored in uppercase
        public int MinParams
        {
          get {
            return FMinParams;
          }
          set {
            FMinParams = value;
          }
        }
        public int MaxParams
        {
          get {
            return FMaxParams;
          }
          set {
            FMaxParams = value;
          }
        }
        public TParamKind DefParamKind
        {
          get {
            return FDefParamKind;
          }
          set {
            FDefParamKind = value;
          }
        }
        public TScriptCmdHandler onCmd
        {
          get {
            return FonCmd;
          }
          set {
            FonCmd = value;
          }
        }
        public TParamKind ParamKinds[int Index]
        {
          get {
            return GetParamKind(Index);
          }
        }
        protected string FName = String.Empty;
        protected int FMinParams = 0;
        protected int FMaxParams = 0;
        protected TParamKind[] FParamKinds;
        protected TScriptCmdHandler FonCmd = null;
        protected TParamKind FDefParamKind;
        // ***************************************************************
        // TScriptCmd implementation
        protected void SetParamKinds(TParamKind[] NewParamKinds)
        {
            int I;
            FParamKinds = new TParamKind[NewParamKinds.Length];
            for (I = 0; I < NewParamKinds.Length; I ++ )
            {
                FParamKinds[I] = NewParamKinds[I];
            }
        }

        protected TParamKind GetParamKind(int Index)
        {
            TParamKind result;
            if ((Index >= FParamKinds.Length))
            {
                // wasn't specified with command - just give the default
                result = DefParamKind;
            }
            else
            {
                result = FParamKinds[Index];
            }
            return result;
        }

    } // end TScriptCmd

    // TScriptSysConst: A 'system constant' within a script.  Technically similar to
    // a TScriptCmd although only returns an environment variable directly without
    // processing any parameters.
    public class TScriptSysConst
    {
        public TScriptConstHandler onRead
        {
          get {
            return FonRead;
          }
          set {
            FonRead = value;
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
        protected string FName = String.Empty;
        protected TScriptConstHandler FonRead = null;
        // ***************************************************************
        // TScriptSysConst implementation
        public string Read(string[] Indexes)
        {
            string result;
            result = onRead(Indexes);
            return result;
        }

    } // end TScriptSysConst

    // TScriptRef: An object that holds all the references to script consts/cmds
    public class TScriptRef
    {
        public TScriptCmd Cmds[int Index]
        {
          get {
            return GetScriptCmd(Index);
          }
        }
        public TScriptSysConst SysConsts[int Index]
        {
          get {
            return GetScriptSysConst(Index);
          }
        }
        private ArrayList CmdList = null;
        private ArrayList SysConstList = null;
        // ***************************************************************
        // TScriptRef implementation
        //Constructor  Create()
        public TScriptRef()
        {
            CmdList = new ArrayList();
            SysConstList = new ArrayList();
            // build up the command list
            ScriptCmd.Units.ScriptCmd.BuildCommandList(this);
            // build up system constant list
            ScriptCmd.Units.ScriptCmd.BuildSysConstList(this);
        }
        //@ Destructor  Destroy()
        ~TScriptRef()
        {
            // free up script commands
            while ((CmdList.Count > 0))
            {
                //@ Unsupported property or method(C): 'Free'
                ((CmdList[0]) as TScriptCmd).Free;
                CmdList.RemoveAt(0);
            }
            // free up system constants
            while ((SysConstList.Count > 0))
            {
                //@ Unsupported property or method(C): 'Free'
                ((SysConstList[0]) as TScriptSysConst).Free;
                SysConstList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            CmdList.Free;
            //@ Unsupported property or method(C): 'Free'
            SysConstList.Free;
        }
        public void AddCommand(string Name, int MinParams, int MaxParams, TScriptCmdHandler onCmd, TParamKind[] ParamKinds, TParamKind DefParamKind)
        {
            TScriptCmd NewCmd;
            // build new command and add it to the command list
            NewCmd = new TScriptCmd();
            NewCmd.Name = Name;
            NewCmd.MinParams = MinParams;
            NewCmd.MaxParams = MaxParams;
            NewCmd.onCmd = onCmd;
            NewCmd.DefParamKind = DefParamKind;
            NewCmd.SetParamKinds(ParamKinds);
            CmdList.Add(NewCmd);
        }

        public void AddSysConstant(string Name, TScriptConstHandler onRead)
        {
            TScriptSysConst NewConst;
            // build a new system constant and add it to the list
            NewConst = new TScriptSysConst();
            NewConst.Name = Name;
            NewConst.onRead = onRead;
            SysConstList.Add(NewConst);
        }

        protected TScriptCmd GetScriptCmd(int Index)
        {
            TScriptCmd result;
            // retrieve a command from the command list
            result = CmdList[Index];
            return result;
        }

        protected TScriptSysConst GetScriptSysConst(int Index)
        {
            TScriptSysConst result;
            // retrieve a system const from list
            result = SysConstList[Index];
            return result;
        }

        public int FindCmd(string Name)
        {
            int result;
            int I;
            result =  -1;
            Name = Name.ToUpper();
            if ((CmdList.Count > 0))
            {
                for (I = 0; I < CmdList.Count; I ++ )
                {
                    if ((((CmdList[I]) as TScriptCmd).Name == Name))
                    {
                        result = I;
                        return result;
                    }
                }
            }
            return result;
        }

        public int FindSysConst(string Name)
        {
            int result;
            int I;
            result =  -1;
            if ((SysConstList.Count > 0))
            {
                for (I = 0; I < SysConstList.Count; I ++ )
                {
                    if ((((SysConstList[I]) as TScriptCmd).Name == Name))
                    {
                        result = I;
                        return result;
                    }
                }
            }
            return result;
        }

    } // end TScriptRef

    public enum TCmdAction
    {
        caNone,
        caStop,
        caPause,
        caAuth
    } // end TCmdAction

    public delegate string TScriptConstHandler(string[] Indexes);
    public delegate void TScriptCmdHandler();
    public enum TParamKind
    {
        pkValue,
        pkVar
    } // end TParamKind

}

