using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Platform;

namespace MTC.mombot;

internal sealed class mombotNativeConfigDialog : Window
{
    private static readonly IBrush BgWindow = new SolidColorBrush(Color.FromRgb(30, 30, 30));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(30, 30, 30));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(20, 20, 20));
    private static readonly IBrush BgButton = new SolidColorBrush(Color.FromRgb(55, 55, 55));
    private static readonly IBrush Border = new SolidColorBrush(Color.FromRgb(0xC8, 0xC8, 0xC8));
    private static readonly IBrush InputBorder = new SolidColorBrush(Color.FromRgb(70, 70, 70));
    private static readonly IBrush FgNormal = new SolidColorBrush(Color.FromRgb(170, 170, 170));
    private static readonly IBrush FgLabel = new SolidColorBrush(Color.FromRgb(200, 200, 200));
    private static readonly FontFamily MonoFont = new("Cascadia Code, Menlo, Consolas, Courier New, monospace");

    public global::MTC.BotConfigDialogResult? Result { get; private set; }

    public mombotNativeConfigDialog(
        string title,
        global::MTC.BotConfigDialogResult defaults,
        IReadOnlyList<string>? postLoginScripts = null)
    {
        Title = title;
        Width = 980;
        Height = 760;
        MinWidth = 920;
        MinHeight = 640;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgWindow;

        var txtName = BuildTextBox(defaults.Name, "MomBot");
        var txtDescription = BuildTextBox(defaults.Description, "Built-in native Mombot runtime");
        txtName.IsEnabled = false;
        txtDescription.IsEnabled = false;
        var txtBotName = BuildTextBox(defaults.NameVar, "MomBot");
        var txtCommsName = BuildTextBox(defaults.CommsVar, "MomBot");
        var txtServerName = BuildTextBox(defaults.ServerName, "server name");
        var txtLoginName = BuildTextBox(defaults.LoginName, "login name");
        var txtPassword = BuildTextBox(defaults.Password, "password");
        txtPassword.PasswordChar = '*';
        var txtGameLetter = BuildTextBox(defaults.GameLetter, "B");
        txtGameLetter.MaxLength = 1;
        txtGameLetter.Width = 96;
        txtGameLetter.HorizontalAlignment = HorizontalAlignment.Left;
        var txtLoginScript = BuildTextBox(defaults.LoginScript, "disabled");
        var txtTheme = BuildTextBox(defaults.Theme, "7|[MOMBOT]|~D|~G|~B|~C");
        txtTheme.MinWidth = 0;
        var txtSubspace = BuildTextBox(defaults.Subspace, "0");
        txtSubspace.MaxLength = 5;
        txtSubspace.Width = 120;
        txtSubspace.HorizontalAlignment = HorizontalAlignment.Left;

        string[] scriptOptions = BuildPostLoginScriptOptions(postLoginScripts);
        var chkRunPostLoginScript = new CheckBox
        {
            Content = "Run Postlogin Script",
            IsChecked = defaults.RunPostLoginScript,
            Foreground = FgNormal,
            VerticalAlignment = VerticalAlignment.Center,
        };
        var cboPostLoginScript = BuildComboBox(scriptOptions);
        cboPostLoginScript.SelectedItem = ResolvePostLoginScriptSelection(defaults, scriptOptions);
        var txtCustomPostLoginScript = BuildTextBox(defaults.PostLoginScript, "custom script path");

        var startupMoveOptions = new[]
        {
            new StartupMoveOption("none", "No startup mow"),
            new StartupMoveOption("dock", "Mow to Dock"),
            new StartupMoveOption("backdoor", "Mow to Backdoor"),
        };
        var cboStartupMove = BuildComboBox(startupMoveOptions);
        cboStartupMove.SelectedItem = startupMoveOptions.FirstOrDefault(option =>
            string.Equals(option.Value, NormalizeStartupMove(defaults.StartupMove), StringComparison.OrdinalIgnoreCase)) ?? startupMoveOptions[0];

        var chkCreateOrJoinCorp = new CheckBox
        {
            Content = "Create or Join Corp",
            IsChecked = defaults.CreateOrJoinCorp,
            Foreground = FgNormal,
            VerticalAlignment = VerticalAlignment.Center,
        };
        var corpModeOptions = new[]
        {
            new CorpModeOption(true, "Create Corp"),
            new CorpModeOption(false, "Join Corp"),
        };
        var cboCorpMode = BuildComboBox(corpModeOptions);
        cboCorpMode.SelectedItem = corpModeOptions.First(option => option.Create == defaults.CreateCorp);
        var txtCorpName = BuildTextBox(defaults.CorpName, "corp name");
        var txtCorpPassword = BuildTextBox(defaults.CorpPassword, "corp password");
        txtCorpPassword.PasswordChar = '*';

        var chkAutoStart = new CheckBox
        {
            Content = "Auto Start",
            IsChecked = defaults.AutoStart,
            Foreground = FgNormal,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var btnSave = new Button
        {
            Content = "Save",
            MinWidth = 88,
            Background = BgButton,
            Foreground = FgNormal,
            BorderBrush = InputBorder,
            Margin = new Thickness(0, 0, 10, 0),
        };

        var btnCancel = new Button
        {
            Content = "Cancel",
            MinWidth = 88,
            Background = BgButton,
            Foreground = FgNormal,
            BorderBrush = InputBorder,
        };

        btnSave.Click += (_, _) =>
        {
            Result = new global::MTC.BotConfigDialogResult(
                defaults.Alias,
                defaults.Name,
                defaults.Script,
                defaults.Description,
                chkAutoStart.IsChecked == true,
                txtBotName.Text?.Trim() ?? string.Empty,
                txtCommsName.Text?.Trim() ?? string.Empty,
                txtServerName.Text?.Trim() ?? string.Empty,
                txtLoginName.Text?.Trim() ?? string.Empty,
                NormalizeGameLetter(txtGameLetter.Text),
                txtLoginScript.Text?.Trim() ?? string.Empty,
                txtTheme.Text?.Trim() ?? string.Empty,
                Password: txtPassword.Text ?? string.Empty,
                RunPostLoginScript: chkRunPostLoginScript.IsChecked == true,
                PostLoginScript: GetSelectedPostLoginScript(cboPostLoginScript, txtCustomPostLoginScript),
                CustomPostLoginScript: string.Equals(cboPostLoginScript.SelectedItem as string, "Custom", StringComparison.OrdinalIgnoreCase),
                StartupMove: (cboStartupMove.SelectedItem as StartupMoveOption)?.Value ?? "none",
                CreateOrJoinCorp: chkCreateOrJoinCorp.IsChecked == true,
                CreateCorp: (cboCorpMode.SelectedItem as CorpModeOption)?.Create ?? false,
                CorpName: chkCreateOrJoinCorp.IsChecked == true ? txtCorpName.Text?.Trim() ?? string.Empty : string.Empty,
                CorpPassword: chkCreateOrJoinCorp.IsChecked == true ? txtCorpPassword.Text ?? string.Empty : string.Empty,
                Subspace: NormalizeSubspace(txtSubspace.Text));
            Close(true);
        };

        btnCancel.Click += (_, _) => Close(false);

        Control nameCell = BuildFieldCell("Name", txtName);
        nameCell.IsEnabled = false;
        Control descriptionCell = BuildFieldCell("Description", txtDescription);
        descriptionCell.IsEnabled = false;
        Control postLoginScriptPicker = BuildPairRow(
            BuildFieldCell("Script", cboPostLoginScript),
            BuildFieldCell("Custom", txtCustomPostLoginScript));
        Control corpDetails = BuildPairRow(
            BuildFieldCell("Corp Name", txtCorpName),
            BuildFieldCell("Corp Password", txtCorpPassword));

        void RefreshNativeOptionVisibility()
        {
            bool runPostLogin = chkRunPostLoginScript.IsChecked == true;
            cboPostLoginScript.IsEnabled = runPostLogin;
            bool customPostLogin = runPostLogin && string.Equals(cboPostLoginScript.SelectedItem as string, "Custom", StringComparison.OrdinalIgnoreCase);
            txtCustomPostLoginScript.IsVisible = customPostLogin;
            txtCustomPostLoginScript.IsEnabled = customPostLogin;
            bool corpEnabled = chkCreateOrJoinCorp.IsChecked == true;
            cboCorpMode.IsEnabled = corpEnabled;
            corpDetails.IsVisible = corpEnabled;
            txtCorpName.IsEnabled = corpEnabled;
            txtCorpPassword.IsEnabled = corpEnabled;
        }

        chkRunPostLoginScript.IsCheckedChanged += (_, _) => RefreshNativeOptionVisibility();
        cboPostLoginScript.SelectionChanged += (_, _) => RefreshNativeOptionVisibility();
        chkCreateOrJoinCorp.IsCheckedChanged += (_, _) => RefreshNativeOptionVisibility();
        RefreshNativeOptionVisibility();

        Content = new ScrollViewer
        {
            Background = BgPanel,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = new StackPanel
            {
                Margin = new Thickness(10),
                Spacing = 0,
                Children =
                {
                    new Border
                    {
                        Background = BgPanel,
                        BorderBrush = InputBorder,
                        BorderThickness = new Thickness(1),
                        Padding = new Thickness(12),
                        Child = new StackPanel
                        {
                            Spacing = 10,
                            Children =
                            {
                                BuildHeaderImage(),
                                new TextBlock
                                {
                                    Text = "Native MomBot login defaults and after-login actions. Scheduled login time is selected from Bot -> Start Bot.",
                                    Foreground = FgNormal,
                                    TextWrapping = TextWrapping.Wrap,
                                },
                                BuildSectionHeader("New Game Defaults"),
                                BuildPairRow(
                                    BuildFieldCell("BBS Login", txtServerName),
                                    BuildFieldCell("Trader Alias", txtLoginName)),
                                BuildPairRow(
                                    BuildFieldCell("Password", txtPassword),
                                    BuildFieldCell("Game Letter", txtGameLetter)),
                                BuildSectionHeader("After Login Options"),
                                BuildPairRow(
                                    BuildFieldCell("Movement", cboStartupMove),
                                    BuildFieldCell("Subspace", txtSubspace)),
                                BuildPairRow(
                                    BuildFieldCell("Postlogin", chkRunPostLoginScript),
                                    BuildFieldCell("Corporation", chkCreateOrJoinCorp)),
                                postLoginScriptPicker,
                                BuildPairRow(
                                    BuildFieldCell("Corp Action", cboCorpMode),
                                    corpDetails),
                                BuildSectionHeader("Native MomBot"),
                                BuildPairRow(nameCell, descriptionCell),
                                BuildPairRow(
                                    BuildFieldCell("Bot Name", txtBotName),
                                    BuildFieldCell("Comms Name", txtCommsName)),
                                BuildPairRow(
                                    BuildFieldCell("Auto Start", chkAutoStart),
                                    BuildFieldCell("Login Script", txtLoginScript)),
                                BuildFullWidthCell("Theme", txtTheme),
                                new StackPanel
                                {
                                    Orientation = Orientation.Horizontal,
                                    HorizontalAlignment = HorizontalAlignment.Right,
                                    Margin = new Thickness(0, 4, 0, 0),
                                    Children = { btnSave, btnCancel },
                                },
                            },
                        },
                    },
                },
            },
        };

        txtBotName.AttachedToVisualTree += (_, _) => txtBotName.Focus();
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
            MinWidth = 200,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = InputBorder,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
    }

    private static ComboBox BuildComboBox(System.Collections.IEnumerable items)
    {
        return new ComboBox
        {
            ItemsSource = items,
            MinWidth = 0,
            Background = BgInput,
            Foreground = FgNormal,
            BorderBrush = InputBorder,
            HorizontalAlignment = HorizontalAlignment.Stretch,
        };
    }

    private sealed class StartupMoveOption
    {
        public StartupMoveOption(string value, string label)
        {
            Value = value;
            Label = label;
        }

        public string Value { get; }
        public string Label { get; }
        public override string ToString() => Label;
    }

    private sealed class CorpModeOption
    {
        public CorpModeOption(bool create, string label)
        {
            Create = create;
            Label = label;
        }

        public bool Create { get; }
        public string Label { get; }
        public override string ToString() => Label;
    }

    private static string NormalizeGameLetter(string? value)
    {
        string normalized = (value ?? string.Empty).Trim();
        return string.IsNullOrEmpty(normalized) ? string.Empty : normalized[..1].ToUpperInvariant();
    }

    private static string NormalizeStartupMove(string? value)
    {
        string normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        return normalized is "dock" or "backdoor" ? normalized : "none";
    }

    private static string NormalizeSubspace(string? value)
    {
        string digits = new((value ?? string.Empty).Where(char.IsDigit).Take(5).ToArray());
        return digits;
    }

    private static string[] BuildPostLoginScriptOptions(IReadOnlyList<string>? scripts)
    {
        var options = new List<string> { "Custom" };
        if (scripts != null)
        {
            options.AddRange(scripts
                .Where(script => !string.IsNullOrWhiteSpace(script))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(script => script, StringComparer.OrdinalIgnoreCase));
        }

        return options.ToArray();
    }

    private static string ResolvePostLoginScriptSelection(global::MTC.BotConfigDialogResult defaults, string[] options)
    {
        if (!defaults.CustomPostLoginScript && !string.IsNullOrWhiteSpace(defaults.PostLoginScript))
        {
            string? match = options.FirstOrDefault(option =>
                string.Equals(option, defaults.PostLoginScript, StringComparison.OrdinalIgnoreCase));
            if (match != null)
                return match;
        }

        return "Custom";
    }

    private static string GetSelectedPostLoginScript(ComboBox combo, TextBox customTextBox)
    {
        string selected = combo.SelectedItem as string ?? string.Empty;
        return string.Equals(selected, "Custom", StringComparison.OrdinalIgnoreCase)
            ? customTextBox.Text?.Trim() ?? string.Empty
            : selected.Trim();
    }

    private static Image BuildHeaderImage()
    {
        using var stream = AssetLoader.Open(new Uri("avares://MTC/mombot/mombot.png"));
        var bitmap = new Bitmap(stream);

        return new Image
        {
            Source = bitmap,
            Stretch = Stretch.Uniform,
            HorizontalAlignment = HorizontalAlignment.Left,
            Width = 760,
            MaxWidth = 760,
            MaxHeight = 135,
            Margin = new Thickness(0, 0, 0, 6),
        };
    }

    private static Control BuildFieldCell(string label, Control editor)
    {
        return new StackPanel
        {
            Spacing = 6,
            Children =
            {
                new TextBlock
                {
                    Text = label,
                    Foreground = FgLabel,
                    FontWeight = FontWeight.SemiBold,
                },
                editor,
            },
        };
    }

    private static Control BuildPairRow(Control left, Control right)
    {
        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,*"),
            ColumnSpacing = 14,
        };

        Grid.SetColumn(left, 0);
        Grid.SetColumn(right, 1);
        grid.Children.Add(left);
        grid.Children.Add(right);
        return grid;
    }

    private static Control BuildFullWidthCell(string label, Control editor)
    {
        return new StackPanel
        {
            Spacing = 6,
            Children =
            {
                new TextBlock
                {
                    Text = label,
                    Foreground = FgLabel,
                    FontWeight = FontWeight.SemiBold,
                },
                editor,
            },
        };
    }

    private static Control BuildSectionHeader(string label)
    {
        return new TextBlock
        {
            Text = label,
            Foreground = FgLabel,
            FontWeight = FontWeight.Bold,
            Margin = new Thickness(0, 10, 0, 0),
        };
    }
}
