using System;
using System.Windows.Forms;
using Core;
using Script;
using FormSetup;
using FormAbout;
using FormLicense;
using FormMain;
using FormHistory;
using FormScript;
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
namespace GUI
{
    public class TModGUI: TTWXModule, ITWXGlobals
    {
        protected Form GUIForms[TGUIFormType TGUIFormType]
        {
          get {
            return GUIFormFactory(TGUIFormType);
          }
        }
        public bool Connected
        {
          get {
            return GetConnected();
          }
          set {
            SetConnected(value);
          }
        }
        public bool FormEnabled[TGUIFormType FormType]
        {
          get {
            return GetFormEnabled(FormType);
          }
          set {
            SetFormEnabled(FormType, value);
          }
        }
        public string ProgramDir
        {
          get {
            return GetProgramDir();
          }
          set {
            SetProgramDir(value);
          }
        }
        public string DatabaseName
        {
          get {
            return FDatabaseName;
          }
          set {
            SetDatabaseName(value);
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
        public bool FirstLoad
        {
          get {
            return FFirstLoad;
          }
          set {
            FFirstLoad = value;
          }
        }
        private string FProgramDir = String.Empty;
        private string FDatabaseName = String.Empty;
        private Form[] FGUIForms;
        private bool FConnected = false;
        private bool FFirstLoad = false;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        private Form GUIFormFactory(TGUIFormType GUIFormType)
        {
            Form result;
            if (!(FGUIForms[GUIFormType] != null))
            {
                //@ Unsupported property or method(B): 'Create'
                FGUIForms[GUIFormType] = Units.GUI.TGUIForms[GUIFormType].Create(this);
            }
            result = FGUIForms[GUIFormType];
            return result;
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

        public override void AfterConstruction()
        {
            base.AfterConstruction();
            // set defaults
            FirstLoad = true;
        }

        public void ShowForm(TGUIFormType FormType)
        {
            GUIForms[FormType].Show();
        }

        private void SetFormEnabled(TGUIFormType FormType, bool Enabled)
        {
            GUIForms[FormType].Enabled = Enabled;
        }

        private bool GetFormEnabled(TGUIFormType FormType)
        {
            bool result;
            result = GUIForms[FormType].Enabled;
            return result;
        }

        private void SetDatabaseName(string Value)
        {
            ((TfrmMain)(GUIForms[TGUIFormType.gfMain])).DatabaseName = Value;
        }

        private bool GetRecording()
        {
            bool result;
            result = ((TfrmMain)(GUIForms[TGUIFormType.gfMain])).miRecording.Checked;
            return result;
        }

        private void SetRecording(bool Value)
        {
            ((TfrmMain)(GUIForms[TGUIFormType.gfMain])).miRecording.Checked = Value;
        }

        private bool GetConnected()
        {
            bool result;
            result = FConnected;
            return result;
        }

        private void SetConnected(bool Value)
        {
            if ((Value != FConnected))
            {
                FConnected = Value;
                TfrmMain _wvar1 = (((TfrmMain)(GUIForms[TGUIFormType.gfMain])));
                if (FConnected)
                {
                    //@ Unsupported property or method(C): 'Default'
                    _wvar1.miConnect.Default = false;
                    //@ Unsupported property or method(C): 'Default'
                    _wvar1.miLoad.Default = true;
                    _wvar1.miConnect.Text = "Dis&connect";
                }
                else
                {
                    _wvar1.miConnect.Text = "&Connect";
                    //@ Unsupported property or method(C): 'Default'
                    _wvar1.miConnect.Default = true;
                    //@ Unsupported property or method(C): 'Default'
                    _wvar1.miLoad.Default = false;
                }
            }
        }

        public void AddToHistory(THistoryType HistoryType, string Value)
        {
            // add this stuff to the history form
            ((TfrmHistory)(GUIForms[TGUIFormType.gfHistory])).AddToHistory(HistoryType, Value);
        }

        public void AddScriptMenu(TScript Script)
        {
            ((TfrmMain)(GUIForms[TGUIFormType.gfMain])).AddScriptMenu(Script);
        }

        public void RemoveScriptMenu(TScript Script)
        {
            ((TfrmMain)(GUIForms[TGUIFormType.gfMain])).RemoveScriptMenu(Script);
        }

        public override void StateValuesLoaded()
        {
            // show main form
            ShowForm(TGUIFormType.gfMain);
            if (FirstLoad)
            {
                // Give the user a welcome message
                MessageBox.Show("Welcome to TWX Proxy!  Be warned that this" + Core.Units.Core.endl + "helper does not function as usual helpers do," + Core.Units.Core.endl + "so it is strongly recommended that you read Readme.txt before" + Core.Units.Core.endl + "continuing.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Information);
                MessageBox.Show("You will need to create a new database before connecting to a server", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Information);
                ShowForm(TGUIFormType.gfSetup);
                ShowForm(TGUIFormType.gfLicense);
                FirstLoad = false;
            }
        }

    } // end TModGUI

    // All references from backend modules to GUI forms must pass through this module
    public enum TGUIFormType
    {
        gfMain,
        gfSetup,
        gfAbout,
        gfLicense,
        gfHistory
    } // end TGUIFormType

}

namespace GUI.Units
{
    public class GUI
    {
        public static TGUIFormClass[] TGUIForms = {TfrmMain, TfrmSetup, TfrmAbout, TfrmLicense, TfrmHistory};
    } // end GUI

}

