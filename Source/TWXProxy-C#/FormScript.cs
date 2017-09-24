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
namespace FormScript
{
    // TScriptWindow: Small documentation window that can be created by scripts.
    public class TScriptWindow: Form
    {
        public string WindowName
        {
          get {
            return FWindowName;
          }
          set {
            FWindowName = value;
          }
        }
        public string TextContent
        {
          get {
            return FTextContent;
          }
          set {
            SetTextContent(value);
          }
        }
        private string FWindowName = String.Empty;
        private string FTextContent = String.Empty;
        //Constructor  Create( AWindowName,  Title,  SizeX,  SizeY,  OnTop)
        public TScriptWindow(string AWindowName, string Title, int SizeX, int SizeY, bool OnTop)
        {
            //@ Unsupported property or method(A): 'CreateNew'
            base.CreateNew(null);
            this.Text = Title;
            this.Width = SizeX;
            this.Height = SizeY;
            //@ Unsupported property or method(C): 'Width'
            this.Left = (Screen.PrimaryScreen.Width / 2) - (this.Width / 2);
            //@ Unsupported property or method(C): 'Height'
            this.Top = (Screen.PrimaryScreen.Height / 2) - (this.Height / 2);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Sizable;
            this.BackColor = System.Drawing.Color.White;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Brush'
            //@ Unsupported property or method(D): 'Color'
            this.Canvas.Brush.Color = System.Drawing.Color.White;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Pen'
            //@ Unsupported property or method(D): 'Color'
            this.Canvas.Pen.Color = System.Drawing.Color.Black;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Font'
            //@ Unsupported property or method(D): 'Color'
            this.Canvas.Font.Color = System.Drawing.Color.Black;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Font'
            //@ Unsupported property or method(D): 'Size'
            this.Canvas.Font.Size = 9;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Font'
            //@ Unsupported property or method(D): 'Name'
            this.Canvas.Font.Name = "Lucida Console";
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Font'
            //@ Unsupported property or method(D): 'Style'
            this.Canvas.Font.Style = new System.Drawing.FontStyle[] {System.Drawing.FontStyle.Bold};
            this.DoubleBuffered = true;
            if (OnTop)
            {
                //@ Undeclared identifier(3): 'fsStayOnTop'
                //@ Unsupported property or method(C): 'FormStyle'
                this.FormStyle = fsStayOnTop;
            }
            WindowName = AWindowName;
        }
        private void SetTextContent(string Value)
        {
            FTextContent = Value.Replace('\n', "");
            Paint();
        }

        public override void Paint()
        {
            int Line;
            int I;
            int X;
            base.Paint();
            //@ Undeclared identifier(3): 'bsSolid'
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Brush'
            //@ Unsupported property or method(D): 'Style'
            this.Canvas.Brush.Style = bsSolid;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(D): 'Brush'
            //@ Unsupported property or method(D): 'Color'
            this.Canvas.Brush.Color = System.Drawing.Color.White;
            //@ Unsupported property or method(C): 'Canvas'
            //@ Unsupported property or method(B): 'FillRect'
            this.Canvas.FillRect(new Rectangle(0, 0, this.Width, this.Height));
            Line = 0;
            X = 1;
            for (I = 1; I <= FTextContent.Length; I ++ )
            {
                if ((TextContent[I] == '\r'))
                {
                    //@ Unsupported property or method(C): 'Canvas'
                    //@ Unsupported property or method(D): 'Font'
                    //@ Unsupported property or method(D): 'Size'
                    //@ Unsupported property or method(C): 'Canvas'
                    //@ Unsupported property or method(B): 'TextOut'
                    this.Canvas.TextOut(0, Line * (this.Canvas.Font.Size + 6), FTextContent.Substring(X - 1 ,I - X));
                    Line ++;
                    X = I + 1;
                }
            }
        }

    } // end TScriptWindow

}

