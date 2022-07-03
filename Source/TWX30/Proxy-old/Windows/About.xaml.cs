using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace TWX3
{
    /// <summary>
    /// Interaction logic for License.xaml
    /// </summary>
    public partial class About : Window
    {
        public About()
        {
            InitializeComponent();
        }

        private void LicenseLinkClick(object sender, MouseButtonEventArgs e)
        {
            this.Hide();

            Window license = new License();
            license.ShowDialog();

            this.Close();
        }

        private void OkButtonClick(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void GridMouseDown(object sender, MouseButtonEventArgs e)
        {
            try
            {
                DragMove();
            }
            catch { }
        }
    }
}
