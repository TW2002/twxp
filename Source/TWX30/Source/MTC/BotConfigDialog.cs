using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;

namespace MTC;

internal sealed record BotConfigDialogResult(
    string Alias,
    string Name,
    string Script,
    string Description,
    bool AutoStart,
    string NameVar,
    string CommsVar,
    string ServerName,
    string LoginName,
    string GameLetter,
    string LoginScript,
    string Theme,
    string Password = "",
    bool RunPostLoginScript = false,
    string PostLoginScript = "",
    bool CustomPostLoginScript = false,
    string StartupMove = "none",
    bool CreateOrJoinCorp = false,
    bool CreateCorp = false,
    string CorpName = "",
    string CorpPassword = "",
    string Subspace = "");

internal sealed class BotConfigDialog : Window
{
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(30, 30, 30));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(20, 20, 20));
    private static readonly IBrush BdInput = new SolidColorBrush(Color.FromRgb(70, 70, 70));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(170, 170, 170));
    private static readonly IBrush FgLabel = new SolidColorBrush(Color.FromRgb(200, 200, 200));
    private static readonly IBrush BgButton = new SolidColorBrush(Color.FromRgb(55, 55, 55));

    public BotConfigDialogResult? Result { get; private set; }

    public BotConfigDialog(string title, BotConfigDialogResult defaults, bool isNative)
    {
        Title = title;
        Width = 640;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgPanel;

        var txtAlias = BuildTextBox(defaults.Alias, "mombot47");
        txtAlias.IsEnabled = !isNative;
        var txtName = BuildTextBox(defaults.Name, "MomBot4");
        var txtScript = BuildTextBox(defaults.Script, "mombot/mombot.cts");
        txtScript.IsEnabled = !isNative;
        var txtDescription = BuildTextBox(defaults.Description, "bot description");
        var chkAutoStart = new CheckBox
        {
            Content = "Auto Start",
            IsChecked = defaults.AutoStart,
            Foreground = FgNormal,
            VerticalAlignment = VerticalAlignment.Center,
        };
        var txtNameVar = BuildTextBox(defaults.NameVar, "BotName");
        var txtCommsVar = BuildTextBox(defaults.CommsVar, "BotComms");
        var txtLoginScript = BuildTextBox(defaults.LoginScript, "0_Login.cts");
        var txtTheme = BuildTextBox(defaults.Theme, "5|[MOMBOT]|~D|~G");

        var btnSave = new Button
        {
            Content = "Save",
            MinWidth = 88,
            Background = BgButton,
            Foreground = FgNormal,
            Margin = new Thickness(0, 0, 8, 0),
        };
        var btnCancel = new Button
        {
            Content = "Cancel",
            MinWidth = 88,
            Background = BgButton,
            Foreground = FgNormal,
        };

        btnSave.Click += (_, _) =>
        {
            Result = new BotConfigDialogResult(
                txtAlias.Text?.Trim() ?? string.Empty,
                txtName.Text?.Trim() ?? string.Empty,
                txtScript.Text?.Trim() ?? string.Empty,
                txtDescription.Text?.Trim() ?? string.Empty,
                chkAutoStart.IsChecked == true,
                txtNameVar.Text?.Trim() ?? string.Empty,
                txtCommsVar.Text?.Trim() ?? string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                txtLoginScript.Text?.Trim() ?? string.Empty,
                txtTheme.Text?.Trim() ?? string.Empty);
            Close(true);
        };
        btnCancel.Click += (_, _) => Close(false);

        Control scriptRow = BuildRow("Script(s):", txtScript);
        scriptRow.IsEnabled = !isNative;

        Content = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = new StackPanel
            {
                Margin = new Thickness(20),
                Spacing = 12,
                Children =
                {
                    new TextBlock
                    {
                        Text = isNative
                            ? "Native Mombot uses the built-in runtime. These values are stored in TwxpCfg alongside external bots."
                            : "These values are stored in TwxpCfg and used by the shared Bot menu.",
                        Foreground = FgNormal,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    BuildRow("Alias:", txtAlias),
                    BuildRow("Name:", txtName),
                    scriptRow,
                    isNative
                        ? new TextBlock
                        {
                            Text = "Script path is managed by the native runtime and does not need to be configured here.",
                            Foreground = FgNormal,
                            Margin = new Thickness(122, -6, 0, 0),
                            TextWrapping = TextWrapping.Wrap,
                        }
                        : new Control { IsVisible = false },
                    BuildRow("Description:", txtDescription),
                    BuildRow("Startup:", chkAutoStart),
                    BuildRow("Name Var:", txtNameVar),
                    BuildRow("Comms Var:", txtCommsVar),
                    BuildRow("Login Script:", txtLoginScript),
                    BuildRow("Theme:", txtTheme),
                    new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        HorizontalAlignment = HorizontalAlignment.Right,
                        Margin = new Thickness(0, 12, 0, 0),
                        Children = { btnSave, btnCancel },
                    },
                },
            },
        };

        Control initialFocus = isNative ? txtName : txtAlias;
        initialFocus.AttachedToVisualTree += (_, _) => initialFocus.Focus();
        KeyDown += (_, e) =>
        {
            if (e.Key == Key.Escape)
            {
                e.Handled = true;
                Close(false);
            }
        };
    }

    private static TextBox BuildTextBox(string? value, string watermark)
    {
        return new TextBox
        {
            Text = value ?? string.Empty,
            Watermark = watermark,
            MinWidth = 380,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = BdInput,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
    }

    private static Control BuildRow(string label, Control editor)
    {
        var grid = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(new GridLength(1, GridUnitType.Star)),
            },
            ColumnSpacing = 12,
        };

        var labelBlock = new TextBlock
        {
            Text = label,
            Foreground = FgLabel,
            VerticalAlignment = VerticalAlignment.Center,
            Width = 110,
        };

        Grid.SetColumn(labelBlock, 0);
        Grid.SetColumn(editor, 1);
        grid.Children.Add(labelBlock);
        grid.Children.Add(editor);
        return grid;
    }
}
