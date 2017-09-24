using System;
using System.Windows.Forms;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using Core;
using Observer;
using ScriptCmp;
using ScriptRef;
using FormScript;
using Global;
using Utility;
using Menu;
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
 // This unit controls scripts
namespace Script
{
    // TScript: A physical script in memory.  Controlled by TModInterpreter - do not construct
    // from outside TModInterpreter class.
    public class TScript: Component, IObserver, 
    {
        public bool System
        {
          get {
            return FSystem;
          }
          set {
            FSystem = value;
          }
        }
        public bool TriggersActive
        {
          get {
            return FTriggersActive;
          }
          set {
            FTriggersActive = value;
          }
        }
        public bool LogData
        {
          get {
            return FLogData;
          }
          set {
            FLogData = value;
          }
        }
        public bool Locked
        {
          get {
            return FLocked;
          }
          set {
            FLocked = value;
          }
        }
        public bool WaitForActive
        {
          get {
            return FWaitForActive;
          }
          set {
            FWaitForActive = value;
          }
        }
        public string WaitText
        {
          get {
            return FWaitText;
          }
          set {
            FWaitText = value;
          }
        }
        public string OutText
        {
          get {
            return FOutText;
          }
        }
        public bool Silent
        {
          get {
            return FSilent;
          }
          set {
            FSilent = value;
          }
        }
        public TModInterpreter Controller
        {
          get {
            return tscOwner;
          }
        }
        public int ExecScript
        {
          get {
            return ExecScriptID;
          }
        }
        public TScriptCmp Cmp
        {
          get {
            return FCmp;
          }
        }
        public int DecimalPrecision
        {
          get {
            return FDecimalPrecision;
          }
          set {
            FDecimalPrecision = value;
          }
        }
        public string ProgramDir
        {
          get {
            return GetProgramDir();
          }
        }
        public string ScriptName
        {
          get {
            return GetScriptName();
          }
        }
        private object CodePos = null;
        private ArrayList WindowList = null;
        private ArrayList MenuItemList = null;
        private ArrayList[] FTriggers;
        private bool FWaitingForAuth = false;
        private bool FTriggersActive = false;
        private bool FLogData = false;
        private bool FLocked = false;
        private bool FWaitForActive = false;
        private bool FSilent = false;
        private bool FSystem = false;
        private string FWaitText = String.Empty;
        private string FOutText = String.Empty;
        private TScriptCmp FCmp = null;
        private TModInterpreter tscOwner = null;
        private int FDecimalPrecision = 0;
        private int ExecScriptID = 0;
        private Stack SubStack = null;
        private object CmdParams;
        // ***************************************************************
        // TScript implementation
        //Constructor  Create( Owner)
        public TScript(object Owner) : base(Owner)
        {
            TTriggerType TriggerType;
            FLogData = true;
            tscOwner = Owner;
            FCmp = new TScriptCmp(tscOwner.ScriptRef);
            FWaitForActive = false;
            SubStack = new Stack();
            CmdParams = new TCmdParam[20];
            // EP - Make CmdParams array for each script loaded
            WindowList = new ArrayList();
            MenuItemList = new ArrayList();
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (TriggerType = Low(TTriggerType); TriggerType <= High(TTriggerType); TriggerType ++ )
            {
                FTriggers[TriggerType] = new ArrayList();
            }
        }
        //@ Destructor  Destroy()
        ~TScript()
        {
            TTriggerType TriggerType;
            // free up menu items
            while ((MenuItemList.Count > 0))
            {
                if ((MenuItemList[0] == Global.Units.Global.TWXMenu.CurrentMenu))
                {
                    Global.Units.Global.TWXMenu.CloseMenu(false);
                }
                //@ Unsupported property or method(C): 'Free'
                ((TTWXMenuItem)(MenuItemList[0])).Free;
                MenuItemList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            MenuItemList.Free;
            // free up script windows
            while ((WindowList.Count > 0))
            {
                //@ Unsupported property or method(C): 'Free'
                ((TScriptWindow)(WindowList[0])).Free;
                WindowList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            WindowList.Free;
            // free up trigger lists
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (TriggerType = Low(TTriggerType); TriggerType <= High(TTriggerType); TriggerType ++ )
            {
                while ((FTriggers[TriggerType].Count > 0))
                {
                    FreeTrigger(FTriggers[TriggerType][0]);
                    FTriggers[TriggerType].RemoveAt(0);
                }
                //@ Unsupported property or method(C): 'Free'
                FTriggers[TriggerType].Free;
            }
            // free up sub stack
            while ((SubStack.Count > 0))
            {
                SubStack.Pop();
            }
            //@ Unsupported property or method(C): 'Free'
            SubStack.Free;
            if ((Global.Units.Global.TWXMenu.CurrentMenu != null))
            {
                if (((Global.Units.Global.TWXMenu.CurrentMenu.Name == "TWX_SCRIPTTEXT") || (Global.Units.Global.TWXMenu.CurrentMenu.Name == "TWX_SCRIPTKEY")) && (Global.Units.Global.TWXMenu.InputScript == this))
                {
                    Global.Units.Global.TWXMenu.CloseMenu(false);
                }
            }
            //@ Unsupported property or method(C): 'Free'
            FCmp.Free;
            CmdParams = new TCmdParam[0];
            // EP - Clear CmdParams array
            //@ Unsupported property or method(D): 'Destroy'
            base.Destroy;
        }
        // IObserver
        protected void Notify(TNotificationType NoteType)
        {
            if (FWaitingForAuth)
            {
                switch(NoteType)
                {
                    case Observer.TNotificationType.ntAuthenticationDone:
                        FWaitingForAuth = false;
                        Execute();
                        break;
                    case Observer.TNotificationType.ntAuthenticationFailed:
                        // Looks like we won't be authenticated - self terminate.
                        FWaitingForAuth = false;
                        SelfTerminate();
                        break;
                }
            }
        }

        private void NotifyTerminate(object Param)
        {
            Controller.StopByHandle(this);
        }

        private void SelfTerminate()
        {
            // Send a notification message to self to start termination
            // Somehow, it seems that sometimes this notification isn't handled before TWX terminates
            Core.Units.Core.PostNotification(NotifyTerminate, null);
        }

        private string GetProgramDir()
        {
            string result;
            result = Controller.ProgramDir;
            return result;
        }

        private string GetScriptName()
        {
            string result;
            result = Utility.Units.Utility.ShortFilename(Cmp.ScriptFile);
            return result;
        }

        public void GetFromFile(string Filename, bool Compile)
        {
            if (Compile)
            {
                FCmp.CompileFromFile(Filename, "");
            }
            else
            {
                FCmp.LoadFromFile(Filename);
            }
            CodePos = FCmp.Code;
            // always start at beginning of script

        }

        private void FreeTrigger(TTrigger Trigger)
        {
            Trigger.Name = "";
            Trigger.Value = "";
            Trigger.Param = "";
            Trigger.LabelName = "";
            if ((Trigger.Timer != null))
            {
                //@ Unsupported property or method(C): 'Free'
                Trigger.Timer.Free;
            }
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(Trigger);
        }

        private bool CheckTriggers(ArrayList TriggerList, string Text, bool TextOutTrigger, bool ForceTrigger, ref bool Handled)
        {
            bool result;
            int I;
            string LabelName;
            // check through textLineTriggers for matches with Text
            result = false;
            Handled = false;
            if ((!TextOutTrigger && !ForceTrigger && !FTriggersActive || FLocked))
            {
                return result;
            }
            // triggers are not enabled or locked in stasis (waiting on menu?)
            I = 0;
            while ((I < TriggerList.Count))
            {
                if ((Text.IndexOf(((TriggerList[I]) as TTrigger).Value) > 0) || (((TriggerList[I]) as TTrigger).Value == ""))
                {
                    // remove this trigger and enact it
                    Handled = true;
                    LabelName = ((TriggerList[I]) as TTrigger).LabelName;
                    FreeTrigger(TriggerList[I]);
                    TriggerList.RemoveAt(I);
                    try {
                        GotoLabel(LabelName);
                    }
                    // script is not in execution - so we need to do error handling for gotos outside execute loop
                    catch(EScriptError E) {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Script run-time error (trigger activation): " + Ansi.Units.Ansi.ANSI_7 + E.Message + Core.Units.Core.endl);
                        SelfTerminate();
                        result = true;
                    }
                    catch {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Unknown script run-time error (trigger activation)" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                        SelfTerminate();
                        result = true;
                    }
                    if (!result)
                    {
                        FTriggersActive = false;
                        if ((Execute()))
                        {
                            // script was self-terminated
                            result = true;
                        }
                    }
                    if (result)
                    {
                        return result;
                    }
                    break;
                }
                else
                {
                    I ++;
                }
            }
            return result;
        }

        private bool TriggerExists(string Name)
        {
            bool result;
            int I;
            ArrayList TriggerList;
            TTriggerType TriggerType;
            // check through all trigger lists to see if this trigger name is in use
            result = false;
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (TriggerType = Low(TTriggerType); TriggerType <= High(TTriggerType); TriggerType ++ )
            {
                TriggerList = FTriggers[TriggerType];
                if ((TriggerList.Count > 0))
                {
                    for (I = 0; I < TriggerList.Count; I ++ )
                    {
                        if ((((TriggerList[I]) as TTrigger).Name == Name))
                        {
                            result = true;
                            break;
                        }
                    }
                }
                if (result)
                {
                    break;
                }
            }
            return result;
        }

        public bool TextOutEvent(string Text, ref bool Handled)
        {
            bool result;
            FOutText = Text;
            // check through textOut triggers for matches with text
            result = CheckTriggers(FTriggers[TTriggerType.ttTextOut], Text, true, false, ref Handled);
            return result;
        }

        public bool TextLineEvent(string Text, bool ForceTrigger)
        {
            bool result;
            bool Handled;
            // check through lineTriggers for matches with Text
            result = CheckTriggers(FTriggers[TTriggerType.ttTextLine], Text, false, ForceTrigger, ref Handled);
            return result;
        }

        public bool TextEvent(string Text, bool ForceTrigger)
        {
            bool result;
            bool Handled;
            // check waitfor
            if (FWaitForActive)
            {
                if ((Text.IndexOf(FWaitText) > 0))
                {
                    FTriggersActive = false;
                    FWaitForActive = false;
                    result = Execute();
                    return result;
                }
            }
            // check through textTriggers for matches with Text
            result = CheckTriggers(FTriggers[TTriggerType.ttText], Text, false, ForceTrigger, ref Handled);
            return result;
        }

        public bool ProgramEvent(string EventName, string MatchText, bool Exclusive)
        {
            bool result;
            int I;
            string LabelName;
            EScriptError E;
            // check through EventTriggers for matches with Text
            result = false;
            I = 0;
            while ((I < FTriggers[TTriggerType.ttEvent].Count))
            {
                E = ((FTriggers[TTriggerType.ttEvent][I]) as TTrigger);
                //@ Unsupported property or method(C): 'Value'
                //@ Unsupported property or method(C): 'Param'
                //@ Unsupported property or method(C): 'Param'
                //@ Unsupported property or method(C): 'Param'
                if ((E.Value == EventName) && (((!Exclusive && (MatchText.IndexOf(E.Param) > 0)) || (Exclusive && (E.Param == MatchText))) || (MatchText == "") || (E.Param == "")))
                {
                    // remove this trigger and enact it
                    //@ Unsupported property or method(C): 'LabelName'
                    LabelName = E.LabelName;
                    FreeTrigger(FTriggers[TTriggerType.ttEvent][I]);
                    FTriggers[TTriggerType.ttEvent].RemoveAt(I);
                    try {
                        GotoLabel(LabelName);
                    }
                    // script is not in execution - so we need to do error handling for gotos outside execute loop
                    catch(EScriptError E) {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Script run-time error (trigger activation): " + Ansi.Units.Ansi.ANSI_7 + E.Message + Core.Units.Core.endl);
                        SelfTerminate();
                        result = true;
                    }
                    catch {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Unknown script run-time error (trigger activation): " + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                        SelfTerminate();
                        result = true;
                    }
                    if (!result)
                    {
                        FTriggersActive = false;
                        if ((Execute()))
                        {
                            // script was self-terminated
                            result = true;
                        }
                    }
                    break;
                }
                else
                {
                    I ++;
                }
            }
            return result;
        }

        public bool EventActive(string EventName)
        {
            bool result;
            int I;
            // check for events matching this event name
            result = false;
            if ((FTriggers[TTriggerType.ttEvent].Count > 0))
            {
                for (I = 0; I < FTriggers[TTriggerType.ttEvent].Count; I ++ )
                {
                    if ((((FTriggers[TTriggerType.ttEvent][I]) as TTrigger).Value == EventName))
                    {
                        result = true;
                        break;
                    }
                }
            }
            return result;
        }

        private void DelayTimerEvent(Object Sender)
        {
            string LabelName;
            bool Term;
            LabelName = ((Sender) as TDelayTimer).DelayTrigger.LabelName;
            Term = false;
            // remove the trigger and its timer
            FTriggers[TTriggerType.ttDelay].Remove(((Sender) as TDelayTimer).DelayTrigger);
            FreeTrigger(((Sender) as TDelayTimer).DelayTrigger);
            try {
                GotoLabel(LabelName);
            }
            // script is not in execution - so we need to do error handling for gotos outside execute loop
            catch(EScriptError E) {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Script run-time error (delay trigger activation): " + Ansi.Units.Ansi.ANSI_7 + E.Message + Core.Units.Core.endl);
                SelfTerminate();
                Term = true;
            }
            catch {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Unknown script run-time error (delay trigger activation)" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                SelfTerminate();
                Term = true;
            }
            if (!Term)
            {
                Execute();
            }
        }

        private object CreateTrigger(string Name, string LabelName, string Value)
        {
            object result;
            Cmp.ExtendName(ref Name, ExecScriptID);
            Cmp.ExtendLabelName(ref LabelName, ExecScriptID);
            if ((TriggerExists(Name)))
            {
                throw new EScriptError("Trigger already exists: \'" + Name + '\'');
            }
            //@ Unsupported function or procedure: 'AllocMem'
            result = AllocMem(sizeof(TTrigger));
            result.Name = Name;
            result.LabelName = LabelName;
            result.Value = Value;
            result.Timer = null;
            return result;
        }

        public TScriptWindow FindWindow(string WindowName)
        {
            TScriptWindow result;
            int I;
            // find the window (ugly code)
            result = null;
            for (I = 0; I < WindowList.Count; I ++ )
            {
                if ((((TScriptWindow)(WindowList[I])).WindowName == WindowName))
                {
                    result = ((TScriptWindow)(WindowList[I]));
                    break;
                }
            }
            if ((result == null))
            {
                throw new EScriptError("Window not found: " + WindowName);
            }
            return result;
        }

        public void SetTextLineTrigger(string Name, string LabelName, string Value)
        {
            FTriggers[TTriggerType.ttTextLine].Add(CreateTrigger(Name, LabelName, Value));
        }

        public void SetTextOutTrigger(string Name, string LabelName, string Value)
        {
            FTriggers[TTriggerType.ttTextOut].Add(CreateTrigger(Name, LabelName, Value));
        }

        public void SetTextTrigger(string Name, string LabelName, string Value)
        {
            FTriggers[TTriggerType.ttText].Add(CreateTrigger(Name, LabelName, Value));
        }

        public void SetEventTrigger(string Name, string LabelName, string Value, string Param)
        {
            TTrigger Trigger;
            Cmp.ExtendName(ref Name, ExecScriptID);
            Cmp.ExtendLabelName(ref LabelName, ExecScriptID);
            if ((TriggerExists(Name)))
            {
                throw new EScriptError("Trigger already exists: \'" + Name + '\'');
            }
            //@ Unsupported function or procedure: 'AllocMem'
            Trigger = AllocMem(sizeof(TTrigger));
            Trigger.Name = Name;
            Trigger.LabelName = LabelName;
            Trigger.Value = Value.ToUpper();
            Trigger.Param = Param;
            Trigger.Timer = null;
            if ((Trigger.Value == "TIME HIT"))
            {
                Controller.CountTimerEvent();
            }
            FTriggers[TTriggerType.ttEvent].Add(Trigger);
        }

        public void SetDelayTrigger(string Name, string LabelName, int Value)
        {
            TTrigger Trigger;
            Cmp.ExtendName(ref Name, ExecScriptID);
            Cmp.ExtendLabelName(ref LabelName, ExecScriptID);
            if ((TriggerExists(Name)))
            {
                throw new EScriptError("Trigger already exists: \'" + Name + '\'');
            }
            //@ Unsupported function or procedure: 'AllocMem'
            Trigger = AllocMem(sizeof(TTrigger));
            Trigger.Name = Name;
            Trigger.LabelName = LabelName;
            Trigger.Timer = new TDelayTimer(this);
            Trigger.Timer.DelayTrigger = Trigger;
            Trigger.Timer.Interval = Value;
            Trigger.Timer.Tick = DelayTimerEvent;
            Trigger.Timer.Enabled = true;
            FTriggers[TTriggerType.ttDelay].Add(Trigger);
        }

        public void KillTrigger(string Name)
        {
            int I;
            bool Found;
            ArrayList TriggerList;
            TTriggerType TriggerType;
            Cmp.ExtendName(ref Name, ExecScriptID);
            Found = false;
            // locate and dispose of this trigger
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (TriggerType = Low(TTriggerType); TriggerType <= High(TTriggerType); TriggerType ++ )
            {
                TriggerList = FTriggers[TriggerType];
                if ((TriggerList.Count > 0))
                {
                    for (I = 0; I < TriggerList.Count; I ++ )
                    {
                        if ((((TriggerList[I]) as TTrigger).Name == Name))
                        {
                            if ((TriggerType == TTriggerType.ttEvent) && (((TriggerList[I]) as TTrigger).Value == "TIME HIT"))
                            {
                                Controller.UnCountTimerEvent();
                            }
                            FreeTrigger(TriggerList[I]);
                            TriggerList.RemoveAt(I);
                            Found = true;
                            break;
                        }
                    }
                }
                if (Found)
                {
                    break;
                }
            }
        }

        public void KillAllTriggers()
        {
            TTriggerType TriggerType;
            ArrayList TriggerList;
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (TriggerType = Low(TTriggerType); TriggerType <= High(TTriggerType); TriggerType ++ )
            {
                TriggerList = FTriggers[TriggerType];
                while ((TriggerList.Count > 0))
                {
                    if ((TriggerType == TTriggerType.ttEvent) && (((TriggerList[0]) as TTrigger).Value == "TIME HIT"))
                    {
                        Controller.UnCountTimerEvent();
                    }
                    FreeTrigger(TriggerList[0]);
                    TriggerList.RemoveAt(0);
                }
            }
        }

        public void InputCompleted(string InputText, TVarParam VarParam)
        {
            // input has just been completed into a menu this script called for
            VarParam.Value = InputText;
            // unlock script and resume execution
            FLocked = false;
            Execute();
        }

        public void SetVariable(string VarName, string Value, string Index)
        {
            int I;
            TVarParam Param;
            string[] Indexes;
            // find a variable with a name that matches VarName and set its value
            // this method exists for compatibility with older scripts only
            Cmp.ExtendName(ref VarName, ExecScriptID);
            if ((Cmp.ParamCount > 0))
            {
                for (I = 0; I < Cmp.ParamCount; I ++ )
                {
                    if ((Cmp.__Params[I] is TVarParam))
                    {
                        if ((((TVarParam)(Cmp.__Params[I])).Name == VarName))
                        {
                            if ((Index == ""))
                            {
                                Indexes = new string[0];
                            }
                            else
                            {
                                Indexes = new string[1];
                                Indexes[0] = Index;
                            }
                            Param = ((TVarParam)(Cmp.__Params[I])).GetIndexVar(Indexes);
                            Param.Value = Value;
                            break;
                        }
                    }
                }
            }
        }

        public void AddMenu(object MenuItem)
        {
            // add menu item to internal list
            MenuItemList.Add(MenuItem);
        }

        // return true if script was terminated
        public void DumpVars(string SearchName)
        {
            int I;
            TVarParam VarParam;
            ArrayList Sorted;
            // call all variable dump procedures
            SearchName = SearchName.ToUpper();
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Variable dump for script: " + Ansi.Units.Ansi.ANSI_7 + Cmp.ScriptFile + Core.Units.Core.endl + Core.Units.Core.endl);
            Sorted = new ArrayList();
            try {
                for (I = 0; I < Cmp.ParamCount; I ++ )
                {
                    if ((((Cmp.__Params[I]) as Object) is TVarParam))
                    {
                        Sorted.Add(Cmp.__Params[I]);
                    }
                }
                Sorted.Sort(Units.Script.CompareVars);
                for (I = 0; I < Sorted.Count; I ++ )
                {
                    VarParam = ((TVarParam)(Sorted[I]));
                    if ((SearchName == "") || (VarParam.Name.ToUpper().IndexOf(SearchName) > 0))
                    {
                        VarParam.Dump("");
                    }
                }
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Sorted.Free;
            }
        }

        public void DumpTriggers()
        {
            int J;
            TTrigger T;
            TTriggerType TriggerType;
            ArrayList TriggerList;
            // dump all triggers
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Trigger dump for script: " + Ansi.Units.Ansi.ANSI_7 + Cmp.ScriptFile + Core.Units.Core.endl + Core.Units.Core.endl);
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (TriggerType = Low(TTriggerType); TriggerType <= High(TTriggerType); TriggerType ++ )
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "  " + Units.Script.TriggerNameMap[TriggerType] + " Triggers:" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                TriggerList = FTriggers[TriggerType];
                if ((TriggerType == TTriggerType.ttDelay))
                {
                    for (J = 0; J < TriggerList.Count; J ++ )
                    {
                        T = TriggerList[J];
                        Global.Units.Global.TWXServer.Broadcast("    " + T.Name + " = [" + T.LabelName + ", " + (T.Timer.Interval).ToString() + ']' + Core.Units.Core.endl);
                    }
                }
                else
                {
                    for (J = 0; J < TriggerList.Count; J ++ )
                    {
                        T = TriggerList[J];
                        Global.Units.Global.TWXServer.Broadcast("    " + T.Name + " = [" + T.LabelName + ", \"" + T.Value + "\", \"" + T.Param + "\"]" + Core.Units.Core.endl);
                    }
                }
            }
            if (FWaitForActive)
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "  Waiting For: " + Ansi.Units.Ansi.ANSI_7 + '\"' + WaitText + '\"' + Core.Units.Core.endl);
            }
        }

        // ***************************************************************
        // Script interpretation
        // function TScript.ReadCode(var CodeRef : Pointer; ReadSize : Byte) : Pointer;
        // begin
        // // increment CodeRef by ReadSize and return its original value.  Shorthand function
        // // used to read command parameters from compiled script byte code.
        // 
        // Result := CodeRef;
        // CodeRef := Pointer(Integer(CodeRef) + ReadSize);
        // end;
        private byte ReadByte(ref object CodeRef)
        {
            byte result;
            result = (byte)CodeRef;
            CodeRef = ((int)CodeRef + sizeof(byte) as object);
            return result;
        }

        private char ReadChar(ref object CodeRef)
        {
            char result;
            result = (char)CodeRef;
            CodeRef = ((int)CodeRef + sizeof(char) as object);
            return result;
        }

        private ushort ReadWord(ref object CodeRef)
        {
            ushort result;
            result = (ushort)CodeRef;
            CodeRef = ((int)CodeRef + sizeof(ushort) as object);
            return result;
        }

        private int ReadInteger(ref object CodeRef)
        {
            int result;
            result = (int)CodeRef;
            CodeRef = ((int)CodeRef + sizeof(int) as object);
            return result;
        }

        private string[] ReadIndexValues(ref object CodeRef, byte IndexCount)
        {
            string[] result;
            // IndexCount : Byte;
            int ParamType;
            int I;
            // read an index list from the byte code and into a string list
            // IndexCount := ReadByte(CodeRef);
            result = new string[IndexCount];
            for (I = 0; I < IndexCount; I ++ )
            {
                ParamType = ReadByte(ref CodeRef);
                if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_CONST))
                {
                    // 32-bit constant reference
                    //@ Unsupported property or method(D): 'Value'
                    result[I] = Cmp.__Params[ReadInteger(ref CodeRef)].Value;
                }
                else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_VAR))
                {
                    // 32-bit variable reference - may be indexed
                    result[I] = SeekVariable(ref CodeRef).Value;
                }
                else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_SYSCONST))
                {
                    // 16-bit system constant reference - may be indexed
                    result[I] = GetSysConstValue(ref CodeRef);
                }
                else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_PROGVAR))
                {
                // 32-bit program variable reference
                }
                else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_CHAR))
                {
                    result[I] = ReadChar(ref CodeRef);
                }
            }
            return result;
        }

        private string GetSysConstValue(ref object CodeRef)
        {
            string result;
            ushort ConstRef;
            string[] IndexValues;
            byte IndexCount;
            ConstRef = ReadWord(ref CodeRef);
            IndexCount = ReadByte(ref CodeRef);
            IndexValues = ReadIndexValues(ref CodeRef, IndexCount);
            result = Cmp.ScriptRef.SysConsts[ConstRef].Read(IndexValues);
            return result;
        }

        private TVarParam SeekVariable(ref object CodeRef)
        {
            TVarParam result;
            string[] IndexValues;
            int VarRef;
            byte IndexCount;
            // construct a variable index list and retrieve the variable from this code reference
            VarRef = ReadInteger(ref CodeRef);
            IndexCount = ReadByte(ref CodeRef);
            if ((IndexCount == 0))
            {
                result = ((TVarParam)(Cmp.__Params[VarRef]));
            }
            else
            {
                IndexValues = ReadIndexValues(ref CodeRef, IndexCount);
                result = ((TVarParam)(Cmp.__Params[VarRef])).GetIndexVar(IndexValues);
            }
            return result;
        }

        public void ProcessCmd_AppendTempValue(string Value)
        {
            TCmdParam TempParam;
            // make a temporary param to pass the value
            ParamCount ++;
            if (ParamCount > ArrayLength)
            {
                CmdParams = new TCmdParam[ParamCount + 10];
                ArrayLength = ParamCount + 10;
            }
            TempParam = new TCmdParam();
            TempParam.Value = Value;
            TempParam.IsTemporary = true;
            CmdParams[ParamCount - 1] = TempParam;
        }

        public void ProcessCmd_AppendValue(TCmdParam CmdParam)
        {
            ParamCount ++;
            if (ParamCount > ArrayLength)
            {
                CmdParams = new TCmdParam[ParamCount + 10];
                // EP - Bump it up in blocks
                ArrayLength = ParamCount + 10;
            }
            CmdParams[ParamCount - 1] = CmdParam;
        }

        private TCmdAction ProcessCmd(TScriptCmd Cmd, ref object CmdValues)
        {
            TCmdAction result;
            // 
            // Note on passing to script commands:
            // 
            // All TScriptCmdHandlers accept values as array of type TCmdParam.  This allows them to access
            // both the values and the references of the object containing them.  Because of this, SysConsts
            // and chars must be built up and passed as temporary TConstParams.
            byte CodeByte;
            byte ParamType;
            // CmdParams : array of TCmdParam; // EP - Now declared globally to persist, for performance - SCRATCH THAT
            int CodeInt;
            int ParamCount;
            object Ptr;
            int RealCount;
            int I;
            int ArrayLength;
            ArrayLength = CmdParams.Length;
            // EP - Just do this once here
            // parse the byte code of this command and return an updated pointer to end of command.
            result = ScriptRef.caNone;
            ParamCount = 0;
            try {
                while (true)
                {
                    ParamType = ReadByte(ref CmdValues);
                    if ((ParamType == 0))
                    {
                        // EP - Low-level hack so that Length(CmdParams) will return a fake array size
                        Ptr = (CmdParams as object);
                        (int)Ptr -= 1;
                        RealCount = (int)Ptr;
                        // EP - Preserve actual length of dynamic array
                        (int)Ptr = ParamCount;
                        // EP - Fake the length
                        result = Cmd.onCmd(this, CmdParams);
                        (int)Ptr = RealCount;
                        // EP - Set length back to actual length
                        (int)Ptr ++;
                        break;
                    }
                    else
                    {
                        if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_VAR))
                        {
                            // 32-bit variable reference
                            ProcessCmd_AppendValue(SeekVariable(ref CmdValues));
                        }
                        else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_CONST))
                        {
                            // 32-bit constant reference
                            CodeInt = ReadInteger(ref CmdValues);
                            ProcessCmd_AppendValue(Cmp.__Params[CodeInt]);
                        }
                        else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_SYSCONST))
                        {
                            // 16-bit system constant reference
                            ProcessCmd_AppendTempValue(GetSysConstValue(ref CmdValues));
                        }
                        else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_CHAR))
                        {
                            // 8-bit character code
                            CodeByte = ReadByte(ref CmdValues);
                            ProcessCmd_AppendTempValue((char)(CodeByte));
                        }
                        else if ((ParamType == ScriptCmp.Units.ScriptCmp.PARAM_PROGVAR))
                        {
                        // 32-bit program variable reference
                        }
                    }
                }
            } finally {
                for (I = 0; I < ParamCount; I ++ )
                {
                    if ((CmdParams[I] != null) && ((TCmdParam)(CmdParams[I])).IsTemporary)
                    {
                        //@ Unsupported property or method(C): 'Free'
                        ((TCmdParam)(CmdParams[I])).Free;
                    }
                }
            // SetLength(CmdParams, 0); // EP - This should no longer be needed
            }
            return result;
        }

        public bool Execute()
        {
            bool result;
            // return true if script was terminated
            TCmdAction CmdAction;
            ushort Line;
            ushort Cmd;
            Line = 0;
            ExecScriptID = 0;
            try {
                // execute code from CodePos
                if ((Cmp.CodeSize == 0) || ((int)CodePos - ((int)Cmp.Code) >= Cmp.CodeSize))
                {
                    CmdAction = ScriptRef.TCmdAction.caStop;
                }
                else
                {
                    do
                    {
                        // fetch script ID
                        ExecScriptID = ReadByte(ref CodePos);
                        // fetch line number
                        Line = ReadWord(ref CodePos);
                        // fetch command from code
                        Cmd = ReadWord(ref CodePos);
                        // read and execute command
                        CmdAction = ProcessCmd(Cmp.ScriptRef.Cmds[Cmd], ref CodePos);
                        if (((int)CodePos - ((int)Cmp.Code) >= Cmp.CodeSize) && (CmdAction != ScriptRef.TCmdAction.caPause))
                        {
                            CmdAction = ScriptRef.TCmdAction.caStop;
                        }
                    // reached end of compiled code
                    } while (!((CmdAction != ScriptRef.caNone)));
                }
                ExecScriptID = 0;
            }
            catch(EScriptError E) {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Script run-time error in \'" + Cmp.IncludeScripts[ExecScriptID] + "\': " + Ansi.Units.Ansi.ANSI_7 + E.Message + ", line " + (Line).ToString() + Core.Units.Core.endl);
                CmdAction = ScriptRef.TCmdAction.caStop;
            }
            catch {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Unknown script run-time error \'" + Cmp.IncludeScripts[ExecScriptID] + "\': " + Ansi.Units.Ansi.ANSI_7 + ", line " + (Line).ToString() + Core.Units.Core.endl);
                CmdAction = ScriptRef.TCmdAction.caStop;
            }
            result = false;
            if ((CmdAction == ScriptRef.TCmdAction.caStop))
            {
                SelfTerminate();
                result = true;
            }
            return result;
        }

        public void GotoLabel(string L)
        {
            bool Error;
            int I;
            // seek label with name L
            Error = false;
            if ((L.Length < 2))
            {
                Error = true;
            }
            else if ((L[1] != ':'))
            {
                Error = true;
            }
            if (Error)
            {
                throw new EScriptError("Bad goto label \'" + L + '\'');
            }
            L = L.Substring(2 - 1 ,L.Length).ToUpper();
            Cmp.ExtendName(ref L, ExecScriptID);
            if ((Cmp.LabelCount > 0))
            {
                for (I = 0; I < Cmp.LabelCount; I ++ )
                {
                    if ((Cmp.Labels[I].Name == L))
                    {
                        CodePos = (((int)Cmp.Code) + Cmp.Labels[I].Location as object);
                        return;
                    }
                }
            }
            throw new EScriptError("Goto label not found \'" + L + '\'');
        }

        public void Gosub(string LabelName)
        {
            SubStack.Push(CodePos);
            GotoLabel(LabelName);
        }

        public void __Return()
        {
            if ((SubStack.Count == 0))
            {
                throw new EScriptError("Return without gosub");
            }
            CodePos = SubStack.Pop();
        }

        public void AddWindow(object Window)
        {
            WindowList.Add(Window);
        }

        public void RemoveWindow(object Window)
        {
            //@ Unsupported property or method(C): 'Free'
            Window.Free;
            WindowList.Remove(Window);
        }

    } // end TScript

    public class TDelayTimer: Timer
    {
        public object DelayTrigger
        {
          get {
            return FDelayTrigger;
          }
          set {
            FDelayTrigger = value;
          }
        }
        protected TTrigger FDelayTrigger = null;
        //@ Constructor auto-generated 
        public TDelayTimer(IContainer container)
            :base(container)
        {
        }
    } // end TDelayTimer

    public struct TTrigger
    {
        public string Name;
        public string Value;
        public string LabelName;
        public string Param;
        public TDelayTimer Timer;
    } // end TTrigger

    // TModInterpreter: Encapsulation for all script interpretation within the program.
    public class TModInterpreter: TTWXModule, ITWXGlobals
    {
        public int Count
        {
          get {
            return GetCount();
          }
        }
        public string LastScript
        {
          get {
            return FLastScript;
          }
        }
        public bool LogData
        {
          get {
            return GetLogData();
          }
        }
        public MenuItem ScriptMenu
        {
          get {
            return FScriptMenu;
          }
          set {
            FScriptMenu = value;
          }
        }
        public object ScriptRef
        {
          get {
            return FScriptRef;
          }
        }
        public string ProgramDir
        {
          get {
            return GetProgramDir();
          }
        }
        public TScript this[int Index]
        {
          get {
            return GetScript(Index);
          }
        }
        public object AutoRun
        {
          get {
            return GetAutoRun();
          }
        }
        public string AutoRunText
        {
          get {
            return GetAutoRunText();
          }
          set {
            SetAutoRunText(value);
          }
        }
        private ArrayList ScriptList = null;
        private string FLastScript = String.Empty;
        private MenuItem FScriptMenu = null;
        private TScriptRef FScriptRef = null;
        private List<string> FAutoRun = null;
        private Timer FtmrTime = null;
        private int FTimerEventCount = 0;
        private string FProgramDir = String.Empty;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        // var
        // CmdParams : array of TCmdParam; // EP - Persists to avoid constant SetLength calls, dramatically improving script execution
        // Bah, can't do it here, as it breaks when LOAD is called, since it's global.
        // ***************************************************************
        // TModInterpreter implementation
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            ScriptList = new ArrayList();
            FLastScript = "";
            FScriptRef = new TScriptRef();
            FtmrTime = new Timer(this);
            FtmrTime.Enabled = false;
            FtmrTime.Interval = 1000;
            FtmrTime.Tick = OntmrTimeTimer;
        }

        public override void BeforeDestruction()
        {
            // free up scripts
            StopAll(true);
            //@ Unsupported property or method(C): 'Free'
            ScriptList.Free;
            //@ Unsupported property or method(C): 'Free'
            FScriptRef.Free;
            //@ Unsupported property or method(C): 'Free'
            FAutoRun.Free;
            base.BeforeDestruction();
        }

        public override void StateValuesLoaded()
        {
            int I;
            // this is called when all modules have been fully initialised
            // load up our auto run scripts
            //@ Unsupported property or method(D): 'Count'
            for (I = 0; I < AutoRun.Count; I ++ )
            {
                Load(AutoRun[I], false);
            }
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

        private void OntmrTimeTimer(Object Sender)
        {
            ProgramEvent("Time hit", DateTime.Now.ToString(), true);
        }

        public void CountTimerEvent()
        {
            FTimerEventCount ++;
            FtmrTime.Enabled = true;
        }

        public void UnCountTimerEvent()
        {
            FTimerEventCount -= 1;
            Debug.Assert((FTimerEventCount >= 0), "Timer uncount without count");
            if ((FTimerEventCount <= 0))
            {
                FtmrTime.Enabled = false;
            }
        }

        public void Load(string Filename, bool Silent)
        {
            TScript Script;
            bool Error;
            Environment.CurrentDirectory = FProgramDir;
            Script = new TScript(this);
            Script.Silent = Silent;
            ScriptList.Add(Script);
            FLastScript = Filename;
            Error = true;
            if ((Filename.ToUpper().Substring(Filename.Length - 3 - 1 ,4) == ".CTS"))
            {
                if (!Silent)
                {
                    Global.Units.Global.TWXServer.ClientMessage("Loading script: " + Ansi.Units.Ansi.ANSI_7 + Filename);
                }
                try {
                    //@ Unsupported property or method(B): 'GetFromFile'
                    Script.GetFromFile(Filename, false);
                    Error = false;
                }
                catch(Exception E) {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Script load error: " + Ansi.Units.Ansi.ANSI_7 + E.Message + Core.Units.Core.endl + Core.Units.Core.endl);
                    Stop(Count - 1);
                }
            }
            else
            {
                if (!Silent)
                {
                    Global.Units.Global.TWXServer.ClientMessage("Loading and compiling script: " + Ansi.Units.Ansi.ANSI_7 + Filename);
                }
                FLastScript = Filename;
                try {
                    //@ Unsupported property or method(B): 'GetFromFile'
                    Script.GetFromFile(Filename, true);
                    Error = false;
                }
                catch(Exception E) {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Script compilation error: " + Ansi.Units.Ansi.ANSI_7 + E.Message + Core.Units.Core.endl + Core.Units.Core.endl);
                    Stop(Count - 1);
                }
            }
            if (!Error)
            {
                ProgramEvent("SCRIPT LOADED", Filename, true);
                Global.Units.Global.TWXServer.NotifyScriptLoad();
                // add menu option for script
                Global.Units.Global.TWXGUI.AddScriptMenu(Script);
                //@ Unsupported property or method(D): 'Execute'
                Script.Execute;
            }
        }

        public void Stop(int Index)
        {
            string ScriptName;
            TScript Script;
            // broadcast termination message
            if (!(this[Index].Silent))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Script terminated: " + Ansi.Units.Ansi.ANSI_7 + this[Index].Cmp.ScriptFile + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            Script = this[Index];
            ScriptName = Script.Cmp.ScriptFile;
            // remove stop menu option from interface
            Global.Units.Global.TWXGUI.RemoveScriptMenu(Script);
            // free the script
            //@ Unsupported property or method(C): 'Free'
            Script.Free;
            // remove script from list
            ScriptList.RemoveAt(Index);
            // trigger program event
            ProgramEvent("SCRIPT STOPPED", ScriptName, true);
            Global.Units.Global.TWXServer.NotifyScriptStop();
        }

        public void StopByHandle(object Script)
        {
            Stop(ScriptList.IndexOf(Script));
        }

        public void StopAll(bool StopSysScripts)
        {
            int I;
            // terminate all scripts
            I = 0;
            while ((I < ScriptList.Count))
            {
                if (StopSysScripts || !(((ScriptList[I]) as TScript).System))
                {
                    Stop(I);
                }
                else
                {
                    I ++;
                }
            }
        }

        public void ProgramEvent(string EventName, string MatchText, bool Exclusive)
        {
            int I;
            // trigger all matching program events in active scripts
            EventName = EventName.ToUpper();
            I = 0;
            while ((I < ScriptList.Count))
            {
                if (!(this[I].ProgramEvent(EventName, MatchText, Exclusive)))
                {
                    I ++;
                }
            }
        }

        public bool TextOutEvent(string Text, TScript StartScript)
        {
            bool result;
            int I;
            bool Handled;
            // trigger matching text out triggers in active scripts
            I = 0;
            // find starting script
            if ((StartScript != null))
            {
                while ((I < ScriptList.Count))
                {
                    if ((this[I] == StartScript))
                    {
                        I ++;
                        break;
                    }
                    I ++;
                }
            }
            result = false;
            // loop through scripts and trigger off any text out triggers
            while ((I < ScriptList.Count))
            {
                if (!(this[I].TextOutEvent(Text, ref Handled)))
                {
                    I ++;
                }
                if (Handled)
                {
                    result = true;
                    break;
                }
            }
            return result;
        }

        public void TextEvent(string Text, bool ForceTrigger)
        {
            int I;
            // trigger matching text triggers in active scripts
            I = 0;
            while ((I < ScriptList.Count))
            {
                if (!(this[I].TextEvent(Text, ForceTrigger)))
                {
                    I ++;
                }
            }
        }

        public void TextLineEvent(string Text, bool ForceTrigger)
        {
            int I;
            // trigger matching textline triggers in active scripts
            I = 0;
            while ((I < ScriptList.Count))
            {
                if (!(this[I].TextLineEvent(Text, ForceTrigger)))
                {
                    I ++;
                }
            }
        }

        public bool EventActive(string EventName)
        {
            bool result;
            int I;
            // check if any scripts hold matching event triggers
            result = false;
            I = 0;
            while ((I < ScriptList.Count))
            {
                if ((this[I].EventActive(EventName)))
                {
                    result = true;
                    break;
                }
                else
                {
                    I ++;
                }
            }
            return result;
        }

        private TScript GetScript(int Index)
        {
            TScript result;
            // retrieve a script from the scriptlist
            result = ScriptList[Index];
            return result;
        }

        private int GetCount()
        {
            int result;
            // retrieve the script count
            result = ScriptList.Count;
            return result;
        }

        private bool GetLogData()
        {
            bool result;
            int I;
            // check all scripts for logging settings
            result = true;
            for (I = 0; I < Count; I ++ )
            {
                if (!(this[I].LogData))
                {
                    result = false;
                    break;
                }
            }
            return result;
        }

        public void ActivateTriggers()
        {
            int I;
            // all text related triggers are deactivated for the rest of the line after they activate.
            // this is to prevent double triggering.
            // turn them back on.
            if ((Count > 0))
            {
                for (I = 0; I < Count; I ++ )
                {
                    this[I].TriggersActive = true;
                }
            }
        }

        public void DumpVars(string SearchName)
        {
            int I;
            if ((SearchName == ""))
            {
                Global.Units.Global.TWXServer.ClientMessage("Dumping all script variables");
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("Dumping all script variables containing \'" + SearchName + '\'');
            }
            // dump variables in all scripts
            if ((Count > 0))
            {
                for (I = 0; I < Count; I ++ )
                {
                    this[I].DumpVars(SearchName);
                }
            }
            Global.Units.Global.TWXServer.ClientMessage("Variable Dump Complete.");
        }

        public void DumpTriggers()
        {
            int I;
            // dump triggers in all scripts
            if ((Count > 0))
            {
                for (I = 0; I < Count; I ++ )
                {
                    this[I].DumpTriggers();
                }
            }
        }

        private List<string> GetAutoRun()
        {
            List<string> result;
            if (!(FAutoRun != null))
            {
                FAutoRun = new List<string>();
            }
            result = FAutoRun;
            return result;
        }

        private string GetAutoRunText()
        {
            string result;
            //@ Unsupported property or method(D): 'Text'
            result = AutoRun.Text;
            return result;
        }

        private void SetAutoRunText(string Value)
        {
            //@ Unsupported property or method(D): 'Text'
            AutoRun.Text = Value;
        }

    } // end TModInterpreter

    public enum TTriggerType
    {
        ttText,
        ttTextLine,
        ttTextOut,
        ttDelay,
        ttEvent
    } // end TTriggerType

}

namespace Script.Units
{
    public class Script
    {
        public static string[] TriggerNameMap = {"Text", "Text-Line", "Text-Out", "Delay", "Event"};
        public static int CompareVars(object Item1, object Item2)
        {
            int result;
            if ((((TVarParam)(Item1)).Name == ((TVarParam)(Item2)).Name))
            {
                result = 0;
            }
            else if ((((TVarParam)(Item1)).Name < ((TVarParam)(Item2)).Name))
            {
                result =  -1;
            }
            else
            {
                result = 1;
            }
            return result;
        }

    } // end Script

}

