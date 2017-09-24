using System;
using System.Windows.Forms;
using System.Collections;
using System.IO;
using Core;
using DataBase;
using Global;
using Utility;
using GUI;
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
namespace FormSetup
{
    public partial class TfrmSetup: Form
    {
        private ArrayList DataLinkList = null;
        private bool FAuthenticate = false;
        private string FProgramDir = String.Empty;
        public TfrmSetup()
        {
            InitializeComponent();
        }

        public override void AfterConstruction()
        {
            base.AfterConstruction();
            FProgramDir = ((TModGUI)this.Owner).ProgramDir;
            btnUpgrade.Visible = false;
        }

        public void FormShow(Object Sender)
        {
            // centre on screen
            //@ Unsupported property or method(C): 'Width'
            this.Left = (Screen.PrimaryScreen.Width / 2) - (this.Width / 2);
            //@ Unsupported property or method(C): 'Height'
            this.Height = (Screen.PrimaryScreen.Height / 2) - (this.Height / 2);
            tbLoginScript.Enabled = false;
            tbLoginName.Enabled = false;
            tbPassword.Enabled = false;
            tbGame.Enabled = false;
            FAuthenticate = false;
            // EP - Temp Win7 Dialog workaround
            //@ Undeclared identifier(3): 'Win32MajorVersion'
            if (Win32MajorVersion > 5)
            {
                //@ Undeclared identifier(3): 'ofOldStyleDialog'
                OpenDialog.options = new object[] {ofOldStyleDialog};
            }
            // populate form from system setup
            tbBubbleSize.Text = (Global.Units.Global.TWXBubble.MaxBubbleSize).ToString();
            cbCache.Checked = Global.Units.Global.TWXDatabase.UseCache;
            tbListenPort.Text = (Global.Units.Global.TWXServer.ListenPort).ToString();
            cbReconnect.Checked = Global.Units.Global.TWXClient.Reconnect;
            cbLog.Checked = Global.Units.Global.TWXLog.LogData;
            cbLogANSI.Checked = Global.Units.Global.TWXLog.LogANSI;
            cbLogBinary.Checked = Global.Units.Global.TWXLog.BinaryLogs;
            cbNotifyLogDelay.Checked = Global.Units.Global.TWXLog.NotifyPlayCuts;
            tbShortenDelay.Text = (Global.Units.Global.TWXLog.MaxPlayDelay / 1000).ToString();
            cbBroadcast.Checked = Global.Units.Global.TWXServer.BroadCastMsgs;
            cbLocalEcho.Checked = Global.Units.Global.TWXServer.LocalEcho;
            tbMenuKey.Text = Global.Units.Global.TWXExtractor.MenuKey;
            // load up auto run scripts
            lbAutoRun.Items.Clear();
            //@ Unsupported property or method(A): 'Assign'
            lbAutoRun.Items.Assign(Global.Units.Global.TWXInterpreter.AutoRun);
            // build list of data headers from databases in data\ folder
            DataLinkList = new ArrayList();
            UpdateGameList(Global.Units.Global.TWXDatabase.DatabaseName);
        }

        public void FormHide(Object Sender)
        {
            while ((DataLinkList.Count > 0))
            {
                ((DataLinkList[0]) as TDatabaseLink).Filename = "";
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(DataLinkList[0]);
                DataLinkList.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            DataLinkList.Free;
        }

        private void UpdateGameList(string SelectName)
        {
            int Found;
            TSearchRec S;
            TDatabaseLink Link;
            System.IO.File F;
            bool Errored;
            bool FileOpen;
            // free up old database headers
            while ((DataLinkList.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(DataLinkList[0]);
                DataLinkList.RemoveAt(0);
            }
            // load database headers into memory
            SelectName = SelectName.ToUpper();
            //@ Unsupported property or method(C): 'Clear'
            cbGames.Clear;
            Found =  -1;
            Environment.CurrentDirectory = FProgramDir;
            //@ Unsupported function or procedure: 'FindFirst'
            if ((FindFirst("data\\*.xdb", 0x0000003f, S) == 0))
            {
                do
                {
                    //@ Unsupported function or procedure: 'AllocMem'
                    Link = AllocMem(sizeof(TDatabaseLink));
                    Link.Modified = false;
                    Link.__New = false;
                    //@ Unsupported property or method(C): 'Name'
                    Link.Filename = "data\\" + S.Name;
                    Errored = false;
                    FileOpen = false;
                    try {
                        F = new FileInfo(Link.Filename);
                        _R_1 = F.OpenText();
                        FileOpen = true;
                        //@ Unsupported function or procedure: 'BlockRead'
                        BlockRead(F, Link.DataHeader, sizeof(TDataHeader));
                    }
                    catch {
                        Errored = true;
                    }
                    if (FileOpen)
                    {
                        _W_0.Close();
                    }
                    if (Errored || (Link.DataHeader.ProgramName != "TWX DATABASE") || (Link.DataHeader.Version != DataBase.Units.DataBase.DATABASE_VERSION))
                    {
                        //@ Unsupported function or procedure: 'FreeMem'
                        FreeMem(Link);
                    }
                    else
                    {
                        if ((Link.Filename.ToUpper() == SelectName))
                        {
                            //@ Unsupported property or method(C): 'Name'
                            Found = cbGames.Items.Add(Utility.Units.Utility.StripFileExtension(S.Name));
                        }
                        else
                        {
                            //@ Unsupported property or method(C): 'Name'
                            //@ Unsupported property or method(A): 'Append'
                            cbGames.Items.Append(Utility.Units.Utility.StripFileExtension(S.Name));
                        }
                        DataLinkList.Add(Link);
                    }
                    //@ Unsupported function or procedure: 'FindNext'
                } while (!((FindNext(S) != 0)));
                //@ Unsupported function or procedure: 'FindClose'
                FindClose(S);
                cbGames.SelectedIndex = Found;
            }
            //@ Unsupported property or method(A): 'OnChange'
            cbGames.OnChange(this);
        }

        public void btnOKMainClick(System.Object Sender, System.EventArgs _e1)
        {
            int I;
            System.IO.File F;
            bool FileOpen;
            // validate and save setup from form into programsetup
            if ((tmrReg.Enabled))
            {
                MessageBox.Show("You must write your registration down first!", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Warning);
                return;
            }
            // click cancel if its there
            if ((btnCancel.Enabled))
            {
                btnCancelClick(Sender);
            }
            // write database headers back to file (if modified)
            if ((DataLinkList.Count > 0))
            {
                for (I = 0; I < DataLinkList.Count; I ++ )
                {
                    if ((((DataLinkList[I]) as TDatabaseLink).Modified))
                    {
                        FileOpen = false;
                        try {
                            F = new FileInfo(((DataLinkList[I]) as TDatabaseLink).Filename);
                            _R_1 = F.OpenText();
                            FileOpen = true;
                            //@ Unsupported function or procedure: 'BlockWrite'
                            BlockWrite(F, ((DataLinkList[I]) as TDatabaseLink).DataHeader, sizeof(TDataHeader));
                        }
                        catch {
                            MessageBox.Show("An error occured while trying to update the database \'" + ((DataLinkList[I]) as TDatabaseLink).Filename + "\', no changes were made.", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                        }
                        if (FileOpen)
                        {
                            _W_0.Close();
                        }
                        Global.Units.Global.TWXDatabase.CloseDataBase();
                    }
                }
            }
            // copy form settings into program setup
            Global.Units.Global.TWXBubble.MaxBubbleSize = Utility.Units.Utility.StrToIntSafe(tbBubbleSize.Text);
            if ((tbMenuKey.Text.Length == 0))
            {
                Global.Units.Global.TWXExtractor.MenuKey = ' ';
            }
            else
            {
                Global.Units.Global.TWXExtractor.MenuKey = tbMenuKey.Text[1];
            }
            Global.Units.Global.TWXDatabase.UseCache = cbCache.Checked;
            if ((cbGames.SelectedIndex ==  -1))
            {
                // no database selected
                Global.Units.Global.TWXDatabase.CloseDataBase();
            }
            else
            {
                Global.Units.Global.TWXDatabase.DatabaseName = ((DataLinkList[cbGames.SelectedIndex]) as TDatabaseLink).Filename;
            }
            //@ Unsupported property or method(B): 'Assign'
            Global.Units.Global.TWXInterpreter.AutoRun.Assign(lbAutoRun.Items);
            Global.Units.Global.TWXLog.LogANSI = cbLogANSI.Checked && cbLog.Checked;
            Global.Units.Global.TWXLog.BinaryLogs = cbLogBinary.Checked && cbLog.Checked;
            Global.Units.Global.TWXLog.LogData = cbLog.Checked;
            Global.Units.Global.TWXLog.NotifyPlayCuts = cbNotifyLogDelay.Checked;
            try {
                Global.Units.Global.TWXLog.MaxPlayDelay = Convert.ToInt32(tbShortenDelay.Text) * 1000;
            }
            catch {
                Global.Units.Global.TWXLog.MaxPlayDelay = 10;
            }
            Global.Units.Global.TWXServer.ListenPort = Utility.Units.Utility.StrToIntSafe(tbListenPort.Text);
            Global.Units.Global.TWXServer.Activate();
            Global.Units.Global.TWXServer.AcceptExternal = cbAcceptExternal.Checked;
            Global.Units.Global.TWXServer.BroadCastMsgs = cbBroadcast.Checked;
            Global.Units.Global.TWXServer.LocalEcho = cbLocalEcho.Checked;
            Global.Units.Global.TWXClient.Reconnect = cbReconnect.Checked;
            // setup has changed, so update terminal menu
            Global.Units.Global.TWXMenu.ApplySetup();
            this.Close();
        }

        public void btnCancelMainClick(System.Object Sender, System.EventArgs _e1)
        {
            this.Close();
        }

        public void tbMenuKeyChange(System.Object Sender, System.EventArgs _e1)
        {
            if ((tbMenuKey.Text.Length > 1))
            {
                tbMenuKey.Text = tbMenuKey.Text[1];
            }
        }

        public void cbGamesChange(System.Object Sender, System.EventArgs _e1)
        {
            TDataHeader Head;
            if ((cbGames.SelectedIndex < 0))
            {
                return;
            }
            Head = (((DataLinkList[cbGames.SelectedIndex]) as TDatabaseLink).DataHeader);
            if ((cbGames.SelectedIndex >  -1))
            {
                tbDescription.Text = cbGames.Text;
                tbSectors.Text = (Head.Sectors).ToString();
                tbHost.Text = Head.Address;
                tbPort.Text = (Head.Port).ToString();
                cbUseLogin.Checked = Head.UseLogin;
                tbLoginScript.Text = Head.LoginScript;
                tbLoginName.Text = Head.LoginName;
                tbPassword.Text = Head.Password;
                tbGame.Text = Head.Game;
            }
            else
            {
                tbDescription.Text = "";
                tbHost.Text = "";
                tbPort.Text = "";
                tbSectors.Text = "";
                cbUseLogin.Checked = false;
                tbLoginScript.Text = "";
                tbLoginName.Text = "";
                tbPassword.Text = "";
                tbGame.Text = "";
            }
        }

        public void btnSaveClick(System.Object Sender, System.EventArgs _e1)
        {
            string Error;
            string S;
            Control Focus;
            ushort Port;
            ushort Sectors;
            int I;
            TDataHeader Head;
            bool DoCreate;
            // verify values
            S = tbDescription.Text;
            Utility.Units.Utility.StripChar(ref S, ';');
            Utility.Units.Utility.StripChar(ref S, ':');
            Utility.Units.Utility.StripChar(ref S, '?');
            tbDescription.Text = S;
            S = tbGame.Text;
            Utility.Units.Utility.StripChar(ref S, ' ');
            if ((S.Length > 0))
            {
                tbGame.Text = S[1];
            }
            else
            {
                tbGame.Text = "";
            }
            Error = "";
            Focus = this;
            if ((tbDescription.Text == ""))
            {
                Error = "You must enter a valid name";
                Focus = tbDescription;
            }
            else if ((tbHost.Text == ""))
            {
                Error = "You must enter a valid host";
                Focus = tbHost;
            }
            //@ Unsupported function or procedure: 'Val'
            Val(tbPort.Text, Port, I);
            if ((I != 0))
            {
                Error = "You must enter a valid port number";
                Focus = tbPort;
            }
            //@ Unsupported function or procedure: 'Val'
            Val(tbSectors.Text, Sectors, I);
            if ((I != 0))
            {
                Error = "You must enter a valid number of sectors";
                Focus = tbSectors;
            }
            // see if this name is in use
            if (!(Units.FormSetup.Edit))
            {
                for (I = 0; I < cbGames.Items.Count; I ++ )
                {
                    //@ Unsupported property or method(A): 'Strings'
                    if ((cbGames.Items.Strings[I].ToUpper() == tbDescription.Text.ToUpper()))
                    {
                        Error = "This name is already in use";
                        Focus = tbDescription;
                    }
                }
            }
            if ((Error != ""))
            {
                MessageBox.Show(Error, Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                Focus.Focus();
                return;
            }
            tbDescription.Enabled = false;
            tbHost.Enabled = false;
            tbPort.Enabled = false;
            tbSectors.Enabled = false;
            cbUseLogin.Enabled = false;
            tbLoginScript.Enabled = false;
            tbLoginName.Enabled = false;
            tbPassword.Enabled = false;
            tbGame.Enabled = false;
            btnAdd.Enabled = true;
            btnDelete.Enabled = true;
            btnEdit.Enabled = true;
            btnSave.Enabled = false;
            btnCancel.Enabled = false;
            if ((Units.FormSetup.Edit))
            {
                ((DataLinkList[cbGames.SelectedIndex]) as TDatabaseLink).Modified = true;
                Head = (((DataLinkList[cbGames.SelectedIndex]) as TDatabaseLink).DataHeader);
            }
            else
            {
                Head = DataBase.Units.DataBase.GetBlankHeader();
            }
            Head.Address = tbHost.Text;
            Head.Sectors = Sectors;
            Head.Port = Port;
            Head.UseLogin = cbUseLogin.Checked;
            Head.LoginName = tbLoginName.Text;
            Head.Password = tbPassword.Text;
            if ((tbGame.Text.Length > 0))
            {
                Head.Game = tbGame.Text[1];
            }
            else
            {
                Head.Game = ' ';
            }
            Head.LoginScript = tbLoginScript.Text;
            if (!(Units.FormSetup.Edit))
            {
                // create new database
                Environment.CurrentDirectory = FProgramDir;
                S = "data\\" + tbDescription.Text + ".xdb";
                DoCreate = true;
                if ((File.Exists(S)))
                {
                    if ((MessageBox.Show(S + '\r' + "This database already exists." + '\r' + '\r' + "Replace existing file?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Warning) == System.Windows.Forms.DialogResult.No))
                    {
                        DoCreate = false;
                    }
                }
                if (DoCreate)
                {
                    try {
                        Global.Units.Global.TWXDatabase.CreateDatabase(S, Head);
                    }
                    catch {
                        MessageBox.Show("An error occured while trying to create the database", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                        //@ Unsupported property or method(A): 'OnChange'
                        cbGames.OnChange(this);
                        return;
                    }
                    UpdateGameList("data\\" + tbDescription.Text + ".xdb");
                    ((DataLinkList[cbGames.SelectedIndex]) as TDatabaseLink).__New = true;
                }
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Head);
            }
        }

        public void btnAddClick(System.Object Sender, System.EventArgs _e1)
        {
            tbDescription.Enabled = true;
            tbHost.Enabled = true;
            tbPort.Enabled = true;
            tbSectors.Enabled = true;
            cbUseLogin.Enabled = true;
            tbDescription.Text = "New Game";
            tbHost.Text = "";
            tbPort.Text = "23";
            tbSectors.Text = "5000";
            cbUseLogin.Checked = false;
            tbLoginScript.Text = "1_Login.ts";
            tbLoginName.Text = "";
            tbPassword.Text = "";
            tbGame.Text = "";
            cbUseLoginClick(Sender);
            tbDescription.Focus();
            btnSave.Enabled = true;
            btnCancel.Enabled = true;
            btnAdd.Enabled = false;
            btnEdit.Enabled = false;
            btnDelete.Enabled = false;
            Units.FormSetup.Edit = false;
        }

        public void btnEditClick(System.Object Sender, System.EventArgs _e1)
        {
            tbHost.Enabled = true;
            tbPort.Enabled = true;
            cbUseLogin.Enabled = true;
            cbUseLoginClick(Sender);
            tbHost.Focus();
            btnSave.Enabled = true;
            btnCancel.Enabled = true;
            btnAdd.Enabled = false;
            btnEdit.Enabled = false;
            btnDelete.Enabled = false;
            Units.FormSetup.Edit = true;
        }

        public void btnDeleteClick(System.Object Sender, System.EventArgs _e1)
        {
            int Result;
            System.IO.File F;
            string S;
            if ((cbGames.SelectedIndex >  -1))
            {
                Result = MessageBox.Show("Are you sure you want to delete this database?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Warning);
                if ((Result == System.Windows.Forms.DialogResult.No))
                {
                    return;
                }
                S = "data\\" + cbGames.Text + ".xdb";
                // delete selected database and refresh headers held in memory
                if ((S.ToUpper() == Global.Units.Global.TWXDatabase.DatabaseName.ToUpper()))
                {
                    // close the current database
                    Global.Units.Global.TWXDatabase.CloseDataBase();
                }
                Global.Units.Global.TWXServer.ClientMessage("Deleting database: " + Ansi.Units.Ansi.ANSI_7 + S);
                Environment.CurrentDirectory = FProgramDir;
                F = new FileInfo(S);
                F.Delete();
                try {
                    F = new FileInfo("data\\" + cbGames.Text + ".cfg");
                    F.Delete();
                }
                catch {
                // don't throw an error if couldn't delete .cfg file
                }
                UpdateGameList("");
            }
        }

        public void cbUseLoginClick(System.Object Sender, System.EventArgs _e1)
        {
            if ((cbUseLogin.Checked))
            {
                tbLoginScript.Enabled = true;
                tbLoginName.Enabled = true;
                tbPassword.Enabled = true;
                tbGame.Enabled = true;
            }
            else
            {
                tbLoginScript.Enabled = false;
                tbLoginName.Enabled = false;
                tbPassword.Enabled = false;
                tbGame.Enabled = false;
            }
        }

        public void btnCancelClick(System.Object Sender, System.EventArgs _e1)
        {
            tbDescription.Enabled = false;
            tbHost.Enabled = false;
            tbPort.Enabled = false;
            tbSectors.Enabled = false;
            cbUseLogin.Enabled = false;
            tbLoginScript.Enabled = false;
            tbLoginName.Enabled = false;
            tbPassword.Enabled = false;
            tbGame.Enabled = false;
            btnAdd.Enabled = true;
            btnDelete.Enabled = true;
            btnEdit.Enabled = true;
            btnSave.Enabled = false;
            btnCancel.Enabled = false;
            //@ Unsupported property or method(A): 'OnChange'
            cbGames.OnChange(Sender);
        }

        public void btnAddAutoRunClick(System.Object Sender, System.EventArgs _e1)
        {
            OpenDialog.InitialDirectory = FProgramDir + "\\Scripts\\";
            if ((OpenDialog.ShowDialog()))
            {
                //@ Unsupported property or method(A): 'Append'
                lbAutoRun.Items.Append(OpenDialog.FileName);
            }
            Environment.CurrentDirectory = FProgramDir;
        }

        public void btnRemoveAutoRunClick(System.Object Sender, System.EventArgs _e1)
        {
            if ((lbAutoRun.SelectedIndex >  -1) && (lbAutoRun.SelectedIndex < lbAutoRun.Items.Count))
            {
                //@ Unsupported property or method(A): 'Delete'
                lbAutoRun.Items.Delete(lbAutoRun.SelectedIndex);
            }
        }

        public void PageControlChanging(Object Sender, ref bool AllowChange)
        {
            if ((tmrReg.Enabled))
            {
                MessageBox.Show("You must write your registration down first!", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Warning);
                AllowChange = false;
            }
        }

        // Note: the original parameters are Object Sender, ref TCloseAction Action
        public void FormClose(System.Object Sender, System.EventArgs _e1)
        {
            if ((tmrReg.Enabled))
            {
                MessageBox.Show("You must write your registration down first!", Application.ProductName, System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Warning);
                //@ Undeclared identifier(3): 'caNone'
                Action = caNone;
                return;
            }
        }

        public void tmrRegTimer(System.Object Sender, System.EventArgs _e1)
        {
            tmrReg.Enabled = false;
        }

        public void tbUserChange(System.Object Sender, System.EventArgs _e1)
        {
            FAuthenticate = false;
        }

    } // end TfrmSetup

    public struct TDatabaseLink
    {
        public TDataHeader DataHeader;
        public bool __New;
        public bool Modified;
        public string Filename;
    } // end TDatabaseLink

}

namespace FormSetup.Units
{
    public class FormSetup
    {
        public static bool Edit = false;
    } // end FormSetup

}

