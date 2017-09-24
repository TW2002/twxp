namespace FormAbout
{
  partial class TfrmAbout
    {
        public System.Windows.Forms.PictureBox Image1;
        public System.Windows.Forms.GroupBox Shape1;
        public System.Windows.Forms.Label lbVersion;
        public System.Windows.Forms.Label Label1;
        public System.Windows.Forms.Button btnOK;
        public System.Windows.Forms.Button btnLicense;
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
            this.Image1 = new System.Windows.Forms.PictureBox();
            this.Shape1 = new System.Windows.Forms.GroupBox();
            this.lbVersion = new System.Windows.Forms.Label();
            this.Label1 = new System.Windows.Forms.Label();
            this.btnOK = new System.Windows.Forms.Button();
            this.btnLicense = new System.Windows.Forms.Button();
            this.SuspendLayout();
            this.Location  = new System.Drawing.Point(371, 348);
            this.ClientSize  = new System.Drawing.Size(202, 152);
            this.Font  = new System.Drawing.Font("MS Sans Serif", 8F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point ,((byte)(1)));
            this.AutoScroll = true;
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "frmAbout";
            this.Text = "About";
            this.BackColor = System.Drawing.Color.Black;
            ((System.ComponentModel.ISupportInitialize)(this.Image1)).BeginInit();
            this.Image1.Size  = new System.Drawing.Size(256, 224);
            this.Image1.Location  = new System.Drawing.Point(0, 0);
            this.Image1.Enabled = true;
            this.Image1.Name = "Image1";
            this.Shape1.Size  = new System.Drawing.Size(202, 152);
            this.Shape1.Location  = new System.Drawing.Point(0, 0);
            this.Shape1.Enabled = true;
            this.Shape1.Name = "Shape1";
            this.lbVersion.Size  = new System.Drawing.Size(103, 13);
            this.lbVersion.Location  = new System.Drawing.Point(48, 8);
            this.lbVersion.Font  = new System.Drawing.Font("MS Sans Serif", 8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point ,((byte)(1)));
            this.lbVersion.Text = "TWX Proxy vX.XX";
            this.lbVersion.Name = "lbVersion";
            this.lbVersion.Enabled = true;
            this.lbVersion.BackColor = System.Drawing.Color.Black;
            this.Label1.Size  = new System.Drawing.Size(177, 13);
            this.Label1.Location  = new System.Drawing.Point(16, 24);
            this.Label1.Font  = new System.Drawing.Font("MS Sans Serif", 8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point ,((byte)(1)));
            this.Label1.Text = "© Remco Mulder (\"Xide\") 2002";
            this.Label1.Name = "Label1";
            this.Label1.Enabled = true;
            this.Label1.BackColor = System.Drawing.Color.Black;
            this.btnOK.Size  = new System.Drawing.Size(89, 25);
            this.btnOK.Location  = new System.Drawing.Point(104, 120);
            this.btnOK.Text = "&Close";
            this.btnOK.Click += new System.EventHandler(this.btnOKClick);
            this.btnOK.TabIndex = 0;
            this.btnOK.Name = "btnOK";
            this.btnOK.Enabled = true;
            this.btnOK.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.btnLicense.Size  = new System.Drawing.Size(89, 25);
            this.btnLicense.Location  = new System.Drawing.Point(8, 120);
            this.btnLicense.Text = "&License";
            this.btnLicense.Click += new System.EventHandler(this.btnLicenseClick);
            this.btnLicense.TabIndex = 1;
            this.btnLicense.Name = "btnLicense";
            this.btnLicense.Enabled = true;
            this.btnLicense.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.Controls.Add(Image1);
            this.Controls.Add(Shape1);
            this.Controls.Add(lbVersion);
            this.Controls.Add(Label1);
            this.Controls.Add(btnOK);
            this.Controls.Add(btnLicense);
            ((System.ComponentModel.ISupportInitialize)(this.Image1)).EndInit();
            this.ResumeLayout(false);
        }
#endregion

    }
}
