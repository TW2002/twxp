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
    /// Interaction logic for Welcome.xaml
    /// </summary>
    public partial class License : Window
    {
        public License()
        {
            InitializeComponent();

            LicenseTextBox.Text = "MIT License\n\nCopyright(c) 2019 MicroBlaster and Shadow\n\n" +

                                  "Permission is hereby granted, free of charge, to any person obtaining a copy " +
                                  "of this software and associated documentation files(the \"Software\"), to deal " +
                                  "in the Software without restriction, including without limitation the rights " +
                                  "to use, copy, modify, merge, publish, distribute, sublicense, and//or sell " +
                                  "copies of the Software, and to permit persons to whom the Software is " +
                                  "furnished to do so, subject to the following conditions:\n\n" +

                                  "The above copyright notice and this permission notice shall be included in all " +
                                  "copies or substantial portions of the Software.\n\n" +

                                  "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR " +
                                  "OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, " +
                                  "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE " +
                                  "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER " +
                                  "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, " +
                                  "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE " +
                                  "SOFTWARE.";
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
