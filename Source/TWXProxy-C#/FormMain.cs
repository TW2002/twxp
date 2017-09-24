using System;
using System.Windows.Forms;
using System.ComponentModel;
using System.IO;
using System.Collections;
using Bubble;
using DataBase;
using Core;
using Script;
using Global;
using GUI;
using Utility;
using TWXExport;
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
 // This unit controls the interface (frmMain)
namespace FormMain
{
    // TrayIcon,
    // Encryptor,
    // OverbyteICSTnCnx,
    public class TScriptMenuItem: MenuItem
    {
        public TScript Script
        {
          get {
            return FScript;
          }
          set {
            FScript = value;
          }
        }
        private TScript FScript = null;
        //@ Constructor auto-generated 
        public TScriptMenuItem(String text)
            :base(text)
        {
        }
        //@ Constructor auto-generated 
        public TScriptMenuItem(String text, EventHandler onClick)
            :base(text, onClick)
        {
        }
        //@ Constructor auto-generated 
        public TScriptMenuItem(String text, EventHandler onClick, Shortcut shortcut)
            :base(text, onClick, shortcut)
        {
        }
        //@ Constructor auto-generated 
        public TScriptMenuItem(String text, MenuItem[] items)
            :base(text, items)
        {
        }
        //@ Constructor auto-generated 
        public TScriptMenuItem(MenuMerge mergeType, Int32 mergeOrder, Shortcut shortcut, String text, EventHandler onClick, EventHandler onPopup, EventHandler onSelect, MenuItem[] items)
            :base(mergeType, mergeOrder, shortcut, text, onClick, onPopup, onSelect, items)
        {
        }
    } // end TScriptMenuItem

    public class TfrmMain: Form
    {
        public string DatabaseName
        {
          get {
            return GetDatabaseName();
          }
          set {
            SetDatabaseName(value);
          }
        }
        public OpenFileDialog OpenDialog = null;
        public ContextMenu mnuPopup = null;
        public MenuItem miExit = null;
        public MenuItem miView = null;
        public MenuItem miStop = null;
        public MenuItem miLoad = null;
        public MenuItem miData = null;
        public MenuItem miRecording = null;
        public MenuItem N2 = null;
        public MenuItem miSetup = null;
        public MenuItem miHistory = null;
        public MenuItem N3 = null;
        public MenuItem miConnect = null;
        public Timer tmrHideForm = null;
        public MenuItem miHelp = null;
        public ImageList imageList = null;
        public MenuItem N1 = null;
        public MenuItem miExport = null;
        public MenuItem N4 = null;
        public MenuItem miImport = null;
        public SaveFileDialog SaveDialog = null;
        public MenuItem N5 = null;
        public MenuItem miExportBubble = null;
        public MenuItem miExportDeadend = null;
        public TTrayIcon trayIcon = null;
        // Encryptor: TEncryptor;
        public MenuItem N6 = null;
        public MenuItem miExportTWX = null;
        public MenuItem miImportTWX = null;
        public MenuItem miHelpScript = null;
        public MenuItem miHelpAbout = null;
        public MenuItem miHelpPack2 = null;
        public MenuItem miPlayLog = null;
        private bool LoadingScript = false;
        private string FDatabaseName = String.Empty;
        private string FProgramDir = String.Empty;
        // *******************************************************
        // TfrmMain implementation
        //Constructor  Create( AOwner)
        public TfrmMain(object AOwner) : base(AOwner)
        {
            this.Top =  -100;
            FProgramDir = ((TModGUI)this.Owner).ProgramDir;
            LoadingScript = false;
            miStop.Visible = false;
        }
        private void SetDatabaseName(string Value)
        {
            FDatabaseName = Value;
            //@ Unsupported property or method(C): 'Hint'
            trayIcon.Hint = "TWX Proxy: " + Value;
        }

        private string GetDatabaseName()
        {
            string result;
            result = FDatabaseName;
            return result;
        }

        // ************************************************************************
        // Menu Functions
        public void miSetupClick(Object Sender)
        {
            // Load up setup form
            ((TModGUI)this.Owner).ShowForm(GUI.TGUIFormType.gfSetup);
        }

        public void miExitClick(Object Sender)
        {
            // Exit program
            //@ Unsupported property or method(C): 'Terminate'
            Application.Terminate;
        }

        public void miConnectClick(Object Sender)
        {
            Global.Units.Global.TWXClient.Connect();
        }

        public void miDisconnectClick(Object Sender)
        {
            Global.Units.Global.TWXClient.Disconnect();
        }

        public void miRecordingClick(Object Sender)
        {
            Global.Units.Global.TWXDatabase.Recording = !Global.Units.Global.TWXDatabase.Recording;
        }

        public void miReloadClick(Object Sender)
        {
            string FileName;
            // Reload this script
            FileName = ((Sender) as MenuItem).Text;
            Utility.Units.Utility.StripChar(ref FileName, '&');
            Global.Units.Global.TWXInterpreter.Load("scripts\\" + FileName, false);
        }

        public void miLoadClick(Object Sender)
        {
            string Filename;
            if (LoadingScript)
            {
                //@ Unsupported property or method(C): 'Handle'
                //@ Unsupported function or procedure: 'SetForegroundWindow'
                SetForegroundWindow(Application.Handle);
                return;
            }
            OpenDialog.InitialDirectory = FProgramDir + "\\Scripts\\";
            OpenDialog.Filter = "TW script (*.ts, *.cts)|*.ts;*.cts";
            OpenDialog.FileName = "script.ts";
            //@ Unsupported property or method(C): 'Titile'
            OpenDialog.Titile = "Load Script";
            LoadingScript = true;
            if ((OpenDialog.ShowDialog()))
            {
                Filename = OpenDialog.FileName;
                Utility.Units.Utility.CompleteFileName(ref Filename, "ts");
                Global.Units.Global.TWXInterpreter.Load(Filename, false);
            }
            // Reset current directory
            Environment.CurrentDirectory = FProgramDir;
            LoadingScript = false;
        }

        public void miHistoryClick(Object Sender)
        {
            ((TModGUI)this.Owner).ShowForm(GUI.TGUIFormType.gfHistory);
        }

        public void miExportClick(Object Sender)
        {
            System.IO.Stream F;
            int I;
            TSector S;
            string Filename;
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                MessageBox.Show("You do not have a database selected, or it is invalid and needs to be rebuilt.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return;
            }
            // Export warp data to a text file
            //@ Unsupported property or method(C): 'Titile'
            SaveDialog.Titile = "Select export file";
            SaveDialog.FileName = "warpspec.txt";
            SaveDialog.Filter = "Text file (*.txt)|*.txt";
            SaveDialog.InitialDirectory = FProgramDir;
            if ((SaveDialog.ShowDialog()))
            {
                Filename = SaveDialog.FileName;
                Utility.Units.Utility.CompleteFileName(ref Filename, "txt");
                if ((File.Exists(Filename)))
                {
                    if ((MessageBox.Show(Filename + '\r' + "This file already exists." + '\r' + '\r' + "Replace existing file?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Warning) == System.Windows.Forms.DialogResult.No))
                    {
                        return;
                    }
                }
                F = new FileInfo(Filename);
                _W_0 = F.CreateText();
                //@ Unsupported function or procedure: 'IOResult'
                if ((IOResult != 0))
                {
                    MessageBox.Show("Unable to open file for export", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                }
                else
                {
                    for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                    {
                        S = Global.Units.Global.TWXDatabase.Sectors[I];
                        if ((S.Warp[1] > 0))
                        {
                            _W_0.Write((I).ToString() + Utility.Units.Utility.GetSpace((Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length + 1 - (I).ToString().Length) + (S.Warp[1]).ToString());
                            if ((S.Warp[2] > 0))
                            {
                                _W_0.Write(Utility.Units.Utility.GetSpace((Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length + 1 - (S.Warp[1]).ToString().Length) + (S.Warp[2]).ToString());
                            }
                            if ((S.Warp[3] > 0))
                            {
                                _W_0.Write(Utility.Units.Utility.GetSpace((Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length + 1 - (S.Warp[2]).ToString().Length) + (S.Warp[3]).ToString());
                            }
                            if ((S.Warp[4] > 0))
                            {
                                _W_0.Write(Utility.Units.Utility.GetSpace((Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length + 1 - (S.Warp[3]).ToString().Length) + (S.Warp[4]).ToString());
                            }
                            if ((S.Warp[5] > 0))
                            {
                                _W_0.Write(Utility.Units.Utility.GetSpace((Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length + 1 - (S.Warp[4]).ToString().Length) + (S.Warp[5]).ToString());
                            }
                            if ((S.Warp[6] > 0))
                            {
                                _W_0.Write(Utility.Units.Utility.GetSpace((Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString().Length + 1 - (S.Warp[5]).ToString().Length) + (S.Warp[6]).ToString());
                            }
                            _W_0.Write(Core.Units.Core.endl);
                        }
                    }
                    _W_0.Close();
                    MessageBox.Show("Warp data successfully exported");
                }
            }
        }

        public void miPlayLogClick(Object Sender)
        {
            // play back a log file
            OpenDialog.InitialDirectory = FProgramDir + "\\Logs\\";
            OpenDialog.Filter = "Binary capture files (*.cap)|*.cap|All files (*.*)|*.*";
            OpenDialog.FileName = "";
            //@ Unsupported property or method(C): 'Titile'
            OpenDialog.Titile = "Play Capture File";
            if ((OpenDialog.ShowDialog()))
            {
                Global.Units.Global.TWXLog.BeginPlayLog(OpenDialog.FileName);
            }
        }

        public void AddWarp(ref TSector S, ushort W)
        {
            bool WarpExists;
            int I;
            // Add warp to sector if its not in there
            WarpExists = false;
            for (I = 1; I <= 6; I ++ )
            {
                if ((S.Warp[I] == W))
                {
                    WarpExists = true;
                }
            }
            if (!WarpExists)
            {
                if ((S.Warp[1] == 0))
                {
                    S.Warp[1] = W;
                }
                else if ((S.Warp[2] == 0))
                {
                    S.Warp[2] = W;
                }
                else if ((S.Warp[3] == 0))
                {
                    S.Warp[3] = W;
                }
                else if ((S.Warp[4] == 0))
                {
                    S.Warp[4] = W;
                }
                else if ((S.Warp[5] == 0))
                {
                    S.Warp[5] = W;
                }
                else if ((S.Warp[6] == 0))
                {
                    S.Warp[6] = W;
                }
            }
        }

        public void SetToolTip(string ToolTip)
        {
            //@ Unsupported property or method(C): 'Hint'
            trayIcon.Hint = ToolTip;
        }

        public void miImportClick(Object Sender)
        {
            System.IO.Stream F;
            TSector S;
            string DB;
            string Line;
            int I;
            int X;
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                MessageBox.Show("You do not have a database selected, or it is invalid and needs to be rebuilt.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return;
            }
            // Import warp data from a text file
            //@ Unsupported property or method(C): 'Titile'
            OpenDialog.Titile = "Select export file";
            OpenDialog.FileName = "warpspec.txt";
            OpenDialog.Filter = "Text file (*.txt)|*.txt";
            OpenDialog.InitialDirectory = FProgramDir;
            if ((OpenDialog.ShowDialog()))
            {
                F = new FileInfo(OpenDialog.FileName);
                _R_1 = F.OpenText();
                //@ Unsupported function or procedure: 'IOResult'
                if ((IOResult != 0))
                {
                    MessageBox.Show("Unable to open file for import", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                }
                else
                {
                    while (!(_W_0.BaseStream.Position >= _W_0.BaseStream.Length))
                    {
                        Line = _R_1.ReadLine();
                        X = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 1));
                        if ((X == 0))
                        {
                            MessageBox.Show("Error importing warp data - corrupt?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                            _W_0.Close();
                            return;
                        }
                        S = Global.Units.Global.TWXDatabase.Sectors[X];
                        I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 2));
                        if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                        {
                            AddWarp(ref S, I);
                            I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 3));
                            if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                            {
                                AddWarp(ref S, I);
                                I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 4));
                                if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                                {
                                    AddWarp(ref S, I);
                                    I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 5));
                                    if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                                    {
                                        AddWarp(ref S, I);
                                        I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 6));
                                        if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                                        {
                                            AddWarp(ref S, I);
                                            I = Utility.Units.Utility.StrToIntSafe(Utility.Units.Utility.GetParameter(Line, 7));
                                            if ((I > 0) && (I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors))
                                            {
                                                AddWarp(ref S, I);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if ((S.Explored == DataBase.TSectorExploredType.etNo))
                        {
                            S.Explored = DataBase.TSectorExploredType.etCalc;
                        }
                        Global.Units.Global.TWXDatabase.SaveSector(S, X, null, null, null);
                        Global.Units.Global.TWXDatabase.UpdateWarps(X);
                    }
                    _W_0.Close();
                    // reload database
                    DB = Global.Units.Global.TWXDatabase.DatabaseName;
                    Global.Units.Global.TWXDatabase.CloseDataBase();
                    Global.Units.Global.TWXDatabase.OpenDataBase(DB);
                    MessageBox.Show("Warp data successfully imported.");
                }
            }
        }

        public void miExportBubbleClick(Object Sender)
        {
            System.IO.Stream F;
            string Filename;
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                MessageBox.Show("You do not have a database selected, or it is invalid and needs to be rebuilt.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return;
            }
            // Export bubble list to a text file
            //@ Unsupported property or method(C): 'Titile'
            SaveDialog.Titile = "Select export file";
            SaveDialog.FileName = "bubbles.txt";
            SaveDialog.Filter = "Text file (*.txt)|*.txt";
            SaveDialog.InitialDirectory = FProgramDir;
            if ((SaveDialog.ShowDialog()))
            {
                Filename = SaveDialog.FileName;
                Utility.Units.Utility.CompleteFileName(ref Filename, "txt");
                if ((File.Exists(Filename)))
                {
                    if ((MessageBox.Show(Filename + '\r' + "This file already exists." + '\r' + '\r' + "Replace existing file?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Warning) == System.Windows.Forms.DialogResult.No))
                    {
                        return;
                    }
                }
                F = new FileInfo(Filename);
                _W_0 = F.CreateText();
                //@ Unsupported function or procedure: 'IOResult'
                if ((IOResult != 0))
                {
                    MessageBox.Show("Unable to open file", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    return;
                }
                try {
                    Global.Units.Global.TWXBubble.ExportBubbles(ref F);
                }
                catch {
                    MessageBox.Show("Error exporting bubble list", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    _W_0.Close();
                }
                _W_0.Close();
                MessageBox.Show("Bubble list successfully exported");
            }
        }

        public void miExportDeadendClick(Object Sender)
        {
            System.IO.Stream F;
            int I;
            TSector S;
            string Filename;
            ArrayList WarpsIn;
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                MessageBox.Show("You do not have a database selected, or it is invalid and needs to be rebuilt.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return;
            }
            // Export deadend list to a text file
            //@ Unsupported property or method(C): 'Titile'
            SaveDialog.Titile = "Select export file";
            SaveDialog.FileName = "deadends.txt";
            SaveDialog.Filter = "Text file (*.txt)|*.txt";
            SaveDialog.InitialDirectory = FProgramDir;
            if ((SaveDialog.ShowDialog()))
            {
                Filename = SaveDialog.FileName;
                Utility.Units.Utility.CompleteFileName(ref Filename, "txt");
                if ((File.Exists(Filename)))
                {
                    if ((MessageBox.Show(Filename + '\r' + "This file already exists." + '\r' + '\r' + "Replace existing file?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Warning) == System.Windows.Forms.DialogResult.No))
                    {
                        return;
                    }
                }
                F = new FileInfo(Filename);
                _W_0 = F.CreateText();
                //@ Unsupported function or procedure: 'IOResult'
                if ((IOResult != 0))
                {
                    MessageBox.Show("Unable to open file", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    return;
                }
                for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    S = Global.Units.Global.TWXDatabase.Sectors[I];
                    WarpsIn = Global.Units.Global.TWXDatabase.GetWarpsIn(I);
                    if ((WarpsIn.Count == 1) && (S.Warp[1] > 0))
                    {
                        _W_0.WriteLine((I).ToString());
                        //@ Unsupported function or procedure: 'IOResult'
                        if ((IOResult != 0))
                        {
                            MessageBox.Show("Error exporting dead end list", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                            _W_0.Close();
                            return;
                        }
                    }
                    //@ Unsupported property or method(C): 'Free'
                    WarpsIn.Free;
                }
                _W_0.Close();
                MessageBox.Show("Dead end list successfully exported");
            }
        }

        public void miExportTWXClick(Object Sender)
        {
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                MessageBox.Show("You do not have a database selected, or it is invalid and needs to be rebuilt.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return;
            }
            // Export TWX file from active database
            //@ Unsupported property or method(C): 'Titile'
            SaveDialog.Titile = "Select export file";
            SaveDialog.FileName = Global.Units.Global.TWXDatabase.DatabaseName + ".twx";
            SaveDialog.Filter = "Trade wars export file (*.twx)|*.twx";
            SaveDialog.InitialDirectory = FProgramDir;
            if ((SaveDialog.ShowDialog()))
            {
                if ((File.Exists(SaveDialog.FileName)))
                {
                    if ((MessageBox.Show(SaveDialog.FileName + '\r' + "This file already exists." + '\r' + '\r' + "Replace existing file?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Warning) == System.Windows.Forms.DialogResult.No))
                    {
                        return;
                    }
                }
                try {
                    TWXExport.Units.TWXExport.ExportTWXFile(SaveDialog.FileName);
                }
                catch {
                    MessageBox.Show("An error occured while attempting to export data from the selected database", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    return;
                }
                MessageBox.Show("Database export successful", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Information);
            }
        }

        public void miImportTWXClick(Object Sender)
        {
            bool Errored;
            bool KeepRecent;
            string DB;
            // import data from TWX file into active database
            if (!(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                MessageBox.Show("You do not have a database selected, or it is invalid and needs to be rebuilt.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return;
            }
            //@ Unsupported property or method(C): 'Titile'
            OpenDialog.Titile = "Select import file";
            OpenDialog.FileName = Global.Units.Global.TWXDatabase.DatabaseName + ".twx";
            OpenDialog.Filter = "Trade wars export file (*.twx)|*.twx";
            OpenDialog.InitialDirectory = FProgramDir;
            if ((OpenDialog.ShowDialog()))
            {
                KeepRecent = (MessageBox.Show("Do you want to keep existing data within the selected database if this data is found to be more up to date than data being imported over it?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Question) == System.Windows.Forms.DialogResult.Yes);
                Errored = false;
                try {
                    TWXExport.Units.TWXExport.ImportTWXFile(OpenDialog.FileName, KeepRecent);
                }
                catch {
                    MessageBox.Show("An error occured while attempting to import data from the selected file", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                    Errored = true;
                }
                if (!Errored)
                {
                    // reload database
                    DB = Global.Units.Global.TWXDatabase.DatabaseName;
                    Global.Units.Global.TWXDatabase.CloseDataBase();
                    Global.Units.Global.TWXDatabase.OpenDataBase(DB);
                }
            }
        }

        public void miHelpAboutClick(Object Sender)
        {
            ((TModGUI)this.Owner).ShowForm(GUI.TGUIFormType.gfAbout);
        }

        public void miHelpScriptClick(Object Sender)
        {
            //@ Undeclared identifier(3): 'SW_NORMAL'
            //@ Undeclared identifier(3): 'ShellExecute'
            ShellExecute(0, null, ("script.html" as string), null, null, SW_NORMAL);
        }

        public void miHelpPack2Click(Object Sender)
        {
            //@ Undeclared identifier(3): 'SW_NORMAL'
            //@ Undeclared identifier(3): 'ShellExecute'
            ShellExecute(0, null, ("pack2.html" as string), null, null, SW_NORMAL);
        }

        // ************************************************************************
        // Other
        public void trayIconDblClick(Object Sender)
        {
            //@ Unsupported property or method(C): 'Handle'
            //@ Unsupported function or procedure: 'SetForegroundWindow'
            SetForegroundWindow(Application.Handle);
            //@ Unsupported property or method(C): 'Default'
            if ((miLoad.Default))
            {
                miLoadClick(Sender);
            }
            //@ Unsupported property or method(C): 'Default'
            else if ((miConnect.Default))
            {
                miConnectClick(Sender);
            }
        }

        public void tmrHideFormTimer(Object Sender)
        {
            this.Hide();
            this.Enabled = false;
        }

        public void trayIconClick(Object Sender)
        {
            //@ Unsupported property or method(C): 'Handle'
            //@ Unsupported function or procedure: 'SetForegroundWindow'
            SetForegroundWindow(Application.Handle);
        }

        public void AddScriptMenu(TScript Script)
        {
            TScriptMenuItem MenuItem;
            MenuItem = new TScriptMenuItem(this);
            MenuItem.Text = Script.ScriptName;
            MenuItem.Click = OnScriptMenuItemClick;
            MenuItem.Script = Script;
            //@ Unsupported property or method(A): 'Add'
            miStop.Add(MenuItem);
            miStop.Enabled = true;
            miStop.Visible = true;
        }

        public void RemoveScriptMenu(TScript Script)
        {
            int I;
            for (I = 0; I < miStop.MenuItems.Count; I ++ )
            {
                if ((((miStop.MenuItems[I]) as TScriptMenuItem).Script == Script))
                {
                    //@ Unsupported property or method(C): 'Free'
                    miStop.MenuItems[I].Free;
                    break;
                }
            }
            miStop.Enabled = (miStop.MenuItems.Count > 0);
            miStop.Visible = (miStop.MenuItems.Count > 0);
        }

        private void OnScriptMenuItemClick(Object Sender)
        {
            Global.Units.Global.TWXInterpreter.StopByHandle(((Sender) as TScriptMenuItem).Script);
        }

    } // end TfrmMain

}

