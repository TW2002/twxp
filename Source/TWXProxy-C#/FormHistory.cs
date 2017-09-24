using System;
using System.Windows.Forms;
using System.Collections.Specialized;
using Core;
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
namespace FormHistory
{
    public partial class TfrmHistory: Form
    {
        public TfrmHistory()
        {
            InitializeComponent();
        }

        public void FormShow(Object Sender)
        {
            // centre on screen
            //@ Unsupported property or method(C): 'Width'
            this.Left = (Screen.PrimaryScreen.Width / 2) - (this.Width / 2);
            //@ Unsupported property or method(C): 'Height'
            this.Top = (Screen.PrimaryScreen.Height / 2) - (this.Height / 2);
            clrHistory.Color = memMsgHistory.BackColor;
            fntHistory.Font = memMsgHistory.Font;
        }

        public void btnCloseClick(System.Object Sender, System.EventArgs _e1)
        {
            this.Close();
        }

        public void FormResize(System.Object Sender, System.EventArgs _e1)
        {
            btnClose.Left = this.Width - btnClose.Width - 11;
            btnClear.Left = btnClose.Left - btnClear.Width - 2;
        }

        public void miFontClick(System.Object Sender, System.EventArgs _e1)
        {
            if ((fntHistory.ShowDialog()))
            {
                memFigHistory.Font = fntHistory.Font;
                memComHistory.Font = fntHistory.Font;
                memMsgHistory.Font = fntHistory.Font;
            }
        }

        public void miColourClick(System.Object Sender, System.EventArgs _e1)
        {
            if ((clrHistory.ShowDialog()))
            {
                memFigHistory.BackColor = clrHistory.Color;
                memComHistory.BackColor = clrHistory.Color;
                memMsgHistory.BackColor = clrHistory.Color;
            }
        }

        public void rbClick(System.Object Sender, System.EventArgs _e1)
        {
            if ((rbMessages.Checked))
            {
                memMsgHistory.Visible = true;
                memComHistory.Visible = false;
                memFigHistory.Visible = false;
            }
            else if ((rbFighters.Checked))
            {
                memMsgHistory.Visible = false;
                memComHistory.Visible = false;
                memFigHistory.Visible = true;
            }
            else if ((rbComputer.Checked))
            {
                memMsgHistory.Visible = false;
                memComHistory.Visible = true;
                memFigHistory.Visible = false;
            }
        }

        public void btnClearClick(System.Object Sender, System.EventArgs _e1)
        {
            string ConfirmMessage;
            if ((rbMessages.Checked))
            {
                ConfirmMessage = "message";
            }
            else if ((rbFighters.Checked))
            {
                ConfirmMessage = "fighter";
            }
            else if ((rbComputer.Checked))
            {
                ConfirmMessage = "computer";
            }
            if ((MessageBox.Show("Clear " + ConfirmMessage + " history?", Application.ProductName, System.Windows.Forms.MessageBoxButtons.YesNo| System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Question) == System.Windows.Forms.DialogResult.Yes))
            {
                if ((rbMessages.Checked))
                {
                    memMsgHistory.Clear();
                }
                else if ((rbFighters.Checked))
                {
                    memFigHistory.Clear();
                }
                else if ((rbComputer.Checked))
                {
                    memComHistory.Clear();
                }
            }
        }

        // Public declarations
        public void AddToHistory(THistoryType HistoryType, string Value)
        {
            StringDictionary Strings;
            switch(HistoryType)
            {
                case Core.THistoryType.htFighter:
                    Strings = memFigHistory.Lines;
                    break;
                case Core.THistoryType.htComputer:
                    Strings = memComHistory.Lines;
                    break;
                case Core.THistoryType.htMsg:
                    Strings = memMsgHistory.Lines;
                    break;
                default:
                    return;
                    break;
            // Shouldn't happen.
            }
            if ((Strings.Count >= 65533))
            {
                Strings.Clear();
            }
            Strings.Add(Value);
        }

    } // end TfrmHistory

}

