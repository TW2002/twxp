using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

/// <summary>
/// Host/port connection dialog.
/// Usage: <c>var ok = await new ConnectDialog(host, port).ShowDialog&lt;bool&gt;(owner);</c>
/// </summary>
public class ConnectDialog : Window
{
    public string HostName { get; private set; } = string.Empty;
    public int    Port     { get; private set; } = 2002;

    private static readonly IBrush BgPanel  = new SolidColorBrush(Color.FromRgb(30,  30,  30));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(170, 170, 170));

    public ConnectDialog(string defaultHost = "", int defaultPort = 2002)
    {
        Title                 = "Connect to Game Server";
        Width                 = 380;
        Height                = 180;
        CanResize             = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background            = BgPanel;

        var txtHost = new TextBox
        {
            Text        = defaultHost,
            Watermark   = "e.g. play.eisonline.net",
            Background  = new SolidColorBrush(Color.FromRgb(20, 20, 20)),
            Foreground  = FgNormal,
            BorderBrush = new SolidColorBrush(Color.FromRgb(70, 70, 70)),
        };

        var txtPort = new TextBox
        {
            Text        = defaultPort.ToString(),
            Width       = 80,
            Background  = new SolidColorBrush(Color.FromRgb(20, 20, 20)),
            Foreground  = FgNormal,
            BorderBrush = new SolidColorBrush(Color.FromRgb(70, 70, 70)),
        };

        var btnConnect = new Button
        {
            Content             = "Connect",
            HorizontalAlignment = HorizontalAlignment.Stretch,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };

        var btnCancel = new Button
        {
            Content             = "Cancel",
            HorizontalAlignment = HorizontalAlignment.Stretch,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };

        btnConnect.Click += (_, _) =>
        {
            HostName = txtHost.Text?.Trim() ?? string.Empty;
            if (!int.TryParse(txtPort.Text?.Trim(), out int p)) p = 2002;
            Port = p;
            Close(true);
        };

        btnCancel.Click += (_, _) => Close(false);

        var btnRow = new Grid { Margin = new Thickness(0, 8, 0, 0) };
        btnRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        btnRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(8) });
        btnRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        Grid.SetColumn(btnConnect, 0);
        Grid.SetColumn(btnCancel,  2);
        btnRow.Children.Add(btnConnect);
        btnRow.Children.Add(btnCancel);

        MakeLabel(out var lblHost, "Host:");
        MakeLabel(out var lblPort, "Port:");

        var hostRow = new Grid { Margin = new Thickness(0, 0, 0, 6) };
        hostRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(50) });
        hostRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        Grid.SetColumn(lblHost, 0); Grid.SetColumn(txtHost, 1);
        hostRow.Children.Add(lblHost); hostRow.Children.Add(txtHost);

        var portRow = new Grid();
        portRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(50) });
        portRow.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        Grid.SetColumn(lblPort, 0); Grid.SetColumn(txtPort, 1);
        portRow.Children.Add(lblPort); portRow.Children.Add(txtPort);

        Content = new StackPanel
        {
            Margin   = new Thickness(20),
            Spacing  = 0,
            Children = { hostRow, portRow, btnRow },
        };
    }

    private static void MakeLabel(out TextBlock tb, string text)
    {
        tb = new TextBlock
        {
            Text                  = text,
            Foreground            = new SolidColorBrush(Color.FromRgb(170, 170, 170)),
            VerticalAlignment     = VerticalAlignment.Center,
            Margin                = new Thickness(0, 0, 8, 0),
        };
    }
}
