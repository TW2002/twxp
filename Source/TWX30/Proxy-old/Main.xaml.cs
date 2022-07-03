using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media.Imaging;
using TWXP;


namespace TWX3
{
    /// <summary>
    /// Interaction logic for Main.xaml
    /// </summary>
    public partial class Main : Window
    {
        System.Windows.Forms.NotifyIcon notifyicon;
        Window popup = new Popup();

        private Proxy proxy;

        public Proxy Proxy { get => proxy; set => proxy = value; }

        public Main()
        {
            InitializeComponent();

            Initialize();

            //proxy.Scripts.Load(@"scripts\zed-bot.vb");
            //proxy.Scripts.Load(@"scripts\zed-bot.cs");

            this.Hide();

            Window welcome = new Welcome();
            welcome.ShowDialog();

            Window setup = new Setup();
            setup.ShowDialog();

            Proxy = new Proxy();
            _ = proxy.StartAsync();
            proxy.Scripts.Load(@"scripts\zed-bot.cts");

            //this.Close();
        }

        private void Initialize()
        {
            TWXP.Database.DataRoot data = new TWXP.Database.DataRoot();
            data.Serialize("test.xml");
            //scripts = new Scripts();

            //Commands.CreateCommands();

            //System.Windows.Forms.NotifyIcon icon = new System.Windows.Forms.NotifyIcon();
            //Stream iconStream = Application.GetResourceStream(new Uri("pack://application:,,,/YourReferencedAssembly;component/YourPossibleSubFolder/YourResourceFile.ico")).Stream;
            //icon.Icon = new System.Drawing.Icon(iconStream);

            notifyicon = new System.Windows.Forms.NotifyIcon();
            //icon.Icon = new System.Drawing.Icon(@"C:\Projects\TradeWars\TWX-Sharp\Source\Proxy\Resources\proxy.ico");
            using (Stream iconStream = Application.GetResourceStream(new Uri("pack://application:,,,/TWX3;component/Resources/notify00.ico")).Stream)
            {
                notifyicon.Icon = new System.Drawing.Icon(iconStream, new System.Drawing.Size(16, 16));
            }

            notifyicon.MouseClick += MouseClick;
            notifyicon.DoubleClick += NotifyDoubleClick;

            notifyicon.Visible = true;
            //notifyicon.BalloonTipText = "Hello from My Kitten";
            //notifyicon.BalloonTipTitle = "Cat Talk";
            //notifyicon.BalloonTipIcon = System.Windows.Forms.ToolTipIcon.Info;
            //notifyicon.ShowBalloonTip(2000);


        }

        private void MouseClick(object sender, System.Windows.Forms.MouseEventArgs e)
        {
            if(e.Button == System.Windows.Forms.MouseButtons.Left)
            {

            }
            else
            {
                popup.Top = System.Windows.SystemParameters.PrimaryScreenHeight - popup.Height - 32;
                popup.Left = System.Windows.SystemParameters.PrimaryScreenWidth - popup.Width - 10;

                int pos = System.Windows.Forms.Control.MousePosition.X;
                if(pos < popup.Left + 20)
                {
                    popup.Left = pos - 20;
                }

                popup.Deactivated += PopupLostFocus;
                popup.ShowInTaskbar = false;
                popup.Show();
                popup.Activate();
                popup.Focus();
            }

        }

        private void PopupLostFocus(object sender, EventArgs e)
        {
            popup.Hide();
        }

        private void NotifyDoubleClick(object sender, EventArgs e)
        {

        }

        private void Execute_Click(object sender, RoutedEventArgs e)
        {
            //List<string> ts = new List<string>();
            //input.Text = "setVar meow 7\nadd meow 3\necho \"7 plus 3 equals\" meow *\n" +
            //    "setvar MyVar1 True\n" +
            //    "setvar MyVar2 True\n" +
            //    "and MyVar1 MyVar2\n" +
            //    "echo \":\" MyVar1 \":\" MyVar2 \n" +
            //    "setvar $Var1 1\n" +
            //    "setvar $Var2 1\n" +
            //    "and $Var1 $Var2\n" +
            //    "echo \":\" $Var1 \":\" $Var1 \n"


            //    ;

            proxy.Scripts.Load(@"scripts\zed-bot.cts");
            //proxy.Scripts.Compile(input.Text);

        }

        private void ApplicationClosing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            notifyicon.Visible = false;
        }
    }
}
