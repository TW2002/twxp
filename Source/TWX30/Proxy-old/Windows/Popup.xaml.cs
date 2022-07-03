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
    public partial class Popup : Window
    {
        public Popup()
        {
            InitializeComponent();
        }

        private void GridMouseDown(object sender, MouseButtonEventArgs e)
        {
            try
            {
                DragMove();
            }
            catch { }
        }

        private void ConnectButtonClick(object sender, RoutedEventArgs e)
        {

        }

        private void SettingsButtonClick(object sender, RoutedEventArgs e)
        {
            Window setup = new Setup();
            setup.ShowDialog();
        }

        private void ExitButtonClick(object sender, RoutedEventArgs e)
        {
            this.Close();
            Application.Current.Shutdown();
        }

        private void DabaseComBoxSelectionChanged(object sender, SelectionChangedEventArgs e)
        {

        }

        private void ScriptsButtonClick(object sender, RoutedEventArgs e)
        {

        }

        private void DataButtonClick(object sender, RoutedEventArgs e)
        {

        }

        private void HelpButtonClick(object sender, RoutedEventArgs e)
        {

        }
    }
}
