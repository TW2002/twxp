using System;
using System.Windows.Forms;
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
namespace FormLicense
{
    public partial class TfrmLicense: Form
    {
        public TfrmLicense()
        {
            InitializeComponent();
        }

        public void btnOKClick(System.Object Sender, System.EventArgs _e1)
        {
            this.Close();
        }

        public void FormCreate(System.Object Sender, System.EventArgs _e1)
        {
            //@ Unsupported property or method(C): 'Width'
            this.Left = (Screen.PrimaryScreen.Width / 2) - (this.Width / 2);
            //@ Unsupported property or method(C): 'Height'
            this.Top = (Screen.PrimaryScreen.Height / 2) - (this.Height / 2);
        }

    } // end TfrmLicense

}

