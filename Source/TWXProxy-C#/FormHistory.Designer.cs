namespace FormHistory
{
  partial class TfrmHistory
    {
        public System.Windows.Forms.TextBox memMsgHistory;
        public System.Windows.Forms.Panel pnlHistory;
        public System.Windows.Forms.RadioButton rbMessages;
        public System.Windows.Forms.Button btnClose;
        public System.Windows.Forms.RadioButton rbFighters;
        public System.Windows.Forms.RadioButton rbComputer;
        public System.Windows.Forms.Button btnClear;
        public System.Windows.Forms.TextBox memFigHistory;
        public System.Windows.Forms.RichTextBox memComHistory;
        public System.Windows.Forms.MainMenu mnuHistory;
        public System.Windows.Forms.MenuItem View1;
        public System.Windows.Forms.MenuItem miFont;
        public System.Windows.Forms.MenuItem miColour;
        public System.Windows.Forms.FontDialog fntHistory;
        public System.Windows.Forms.ColorDialog clrHistory;
        private System.ComponentModel.Container components = null;
        private System.Windows.Forms.ToolTip toolTip1 = null;

        // Clean up any resources being used.
        protected override void Dispose(bool disposing)
        {
            if(disposing)
            {
                if(components != null)
                {
                    components.Dispose();
                }
            }
            base.Dispose(disposing);
        }

#region Windows Form Designer generated code
        private void InitializeComponent()
        {
            System.Resources.ResourceManager resources = new System.Resources.ResourceManager(this.GetType());
            this.components = new System.ComponentModel.Container();
            this.toolTip1 = new System.Windows.Forms.ToolTip(this.components);
            this.memMsgHistory = new System.Windows.Forms.TextBox();
            this.pnlHistory = new System.Windows.Forms.Panel();
            this.rbMessages = new System.Windows.Forms.RadioButton();
            this.btnClose = new System.Windows.Forms.Button();
            this.rbFighters = new System.Windows.Forms.RadioButton();
            this.rbComputer = new System.Windows.Forms.RadioButton();
            this.btnClear = new System.Windows.Forms.Button();
            this.memFigHistory = new System.Windows.Forms.TextBox();
            this.memComHistory = new System.Windows.Forms.RichTextBox();
            this.mnuHistory = new System.Windows.Forms.MainMenu();
            this.View1 = new System.Windows.Forms.MenuItem();
            this.miFont = new System.Windows.Forms.MenuItem();
            this.miColour = new System.Windows.Forms.MenuItem();
            this.fntHistory = new System.Windows.Forms.FontDialog();
            this.clrHistory = new System.Windows.Forms.ColorDialog();
            this.SuspendLayout();
            this.Location  = new System.Drawing.Point(192, 127);
            this.ClientSize  = new System.Drawing.Size(540, 365);
            this.Font  = new System.Drawing.Font("MS Sans Serif", 8F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point ,((byte)(1)));
            this.Resize += new System.EventHandler(this.FormResize);
            this.Menu = mnuHistory;
            this.AutoScroll = true;
            this.Name = "frmHistory";
            this.Text = "History";
            this.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.memMsgHistory.Size  = new System.Drawing.Size(532, 288);
            this.memMsgHistory.Location  = new System.Drawing.Point(0, 0);
            this.memMsgHistory.Font  = new System.Drawing.Font("MS Sans Serif", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point ,((byte)(0)));
            this.memMsgHistory.Dock = System.Windows.Forms.DockStyle.Fill;
            this.memMsgHistory.Multiline = true;
            this.memMsgHistory.ReadOnly = true;
            this.memMsgHistory.TabIndex = 0;
            this.memMsgHistory.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.memMsgHistory.Name = "memMsgHistory";
            this.memMsgHistory.Enabled = true;
            this.memMsgHistory.BackColor = System.Drawing.Color.Black;
            this.pnlHistory.Size  = new System.Drawing.Size(532, 31);
            this.pnlHistory.Location  = new System.Drawing.Point(0, 288);
            this.pnlHistory.SuspendLayout();
            this.pnlHistory.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.pnlHistory.TabIndex = 1;
            this.pnlHistory.Enabled = true;
            this.pnlHistory.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.pnlHistory.Name = "pnlHistory";
            this.rbMessages.Size  = new System.Drawing.Size(73, 17);
            this.rbMessages.Location  = new System.Drawing.Point(8, 8);
            this.rbMessages.TabIndex = 0;
            this.rbMessages.Click += new System.EventHandler(this.rbClick);
            this.rbMessages.Text = "Messages";
            this.rbMessages.Checked = true;
            this.rbMessages.TabStop = true;
            this.rbMessages.Name = "rbMessages";
            this.rbMessages.Enabled = true;
            this.btnClose.Size  = new System.Drawing.Size(81, 25);
            this.btnClose.Location  = new System.Drawing.Point(448, 3);
            this.btnClose.Text = "&Close";
            this.btnClose.Click += new System.EventHandler(this.btnCloseClick);
            this.btnClose.TabIndex = 1;
            this.btnClose.Name = "btnClose";
            this.btnClose.Enabled = true;
            this.btnClose.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.rbFighters.Size  = new System.Drawing.Size(89, 17);
            this.rbFighters.Location  = new System.Drawing.Point(104, 8);
            this.rbFighters.TabIndex = 2;
            this.rbFighters.Text = "Fighters";
            this.rbFighters.Enabled = true;
            this.rbFighters.Click += new System.EventHandler(this.rbClick);
            this.rbFighters.Name = "rbFighters";
            this.rbComputer.Size  = new System.Drawing.Size(89, 17);
            this.rbComputer.Location  = new System.Drawing.Point(200, 8);
            this.rbComputer.TabIndex = 3;
            this.rbComputer.Text = "Computer";
            this.rbComputer.Enabled = true;
            this.rbComputer.Click += new System.EventHandler(this.rbClick);
            this.rbComputer.Name = "rbComputer";
            this.btnClear.Size  = new System.Drawing.Size(81, 25);
            this.btnClear.Location  = new System.Drawing.Point(364, 3);
            this.btnClear.Text = "C&lear";
            this.btnClear.Click += new System.EventHandler(this.btnClearClick);
            this.btnClear.TabIndex = 4;
            this.btnClear.Name = "btnClear";
            this.btnClear.Enabled = true;
            this.btnClear.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.memFigHistory.Size  = new System.Drawing.Size(532, 288);
            this.memFigHistory.Location  = new System.Drawing.Point(0, 0);
            this.memFigHistory.Font  = new System.Drawing.Font("MS Sans Serif", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point ,((byte)(0)));
            this.memFigHistory.Visible = false;
            this.memFigHistory.Dock = System.Windows.Forms.DockStyle.Fill;
            this.memFigHistory.Multiline = true;
            this.memFigHistory.ReadOnly = true;
            this.memFigHistory.TabIndex = 2;
            this.memFigHistory.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.memFigHistory.Name = "memFigHistory";
            this.memFigHistory.Enabled = true;
            this.memFigHistory.BackColor = System.Drawing.Color.Black;
            this.memComHistory.Size  = new System.Drawing.Size(532, 288);
            this.memComHistory.Location  = new System.Drawing.Point(0, 0);
            this.memComHistory.Font  = new System.Drawing.Font("MS Sans Serif", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point ,((byte)(1)));
            this.memComHistory.Visible = false;
            this.memComHistory.Dock = System.Windows.Forms.DockStyle.Fill;
            this.memComHistory.ReadOnly = true;
            this.memComHistory.TabIndex = 3;
            this.memComHistory.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.memComHistory.Name = "memComHistory";
            this.memComHistory.Enabled = true;
            this.memComHistory.BackColor = System.Drawing.Color.Black;
            this.fntHistory.Font  = new System.Drawing.Font("MS Sans Serif", 8F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point ,((byte)(1)));
            this.fntHistory.MinSize = 0;
            this.fntHistory.MaxSize = 0;
            this.pnlHistory.Controls.Add(rbMessages);
            this.pnlHistory.Controls.Add(btnClose);
            this.pnlHistory.Controls.Add(rbFighters);
            this.pnlHistory.Controls.Add(rbComputer);
            this.pnlHistory.Controls.Add(btnClear);
            this.pnlHistory.ResumeLayout(false);
            this.Controls.Add(memMsgHistory);
            this.Controls.Add(pnlHistory);
            this.Controls.Add(memFigHistory);
            this.Controls.Add(memComHistory);
            this.mnuHistory.Name = "mnuHistory";
            this.View1.Text = "&View";
            this.View1.ShowShortcut = true;
            this.View1.Name = "View1";
            this.miFont.Text = "&Font...";
            this.miFont.ShowShortcut = true;
            this.miFont.Click += new System.EventHandler(this.miFontClick);
            this.miFont.Name = "miFont";
            this.miColour.Text = "Colour...";
            this.miColour.ShowShortcut = true;
            this.miColour.Click += new System.EventHandler(this.miColourClick);
            this.miColour.Name = "miColour";
            this.View1.MenuItems.Add(miFont);
            this.View1.MenuItems.Add(miColour);
            this.mnuHistory.MenuItems.Add(View1);
            this.ResumeLayout(false);
        }
#endregion

    }
}
