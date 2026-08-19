using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Input.Platform;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Threading;

namespace MTC;

/// <summary>
/// Dialog for creating or editing a connection profile.
/// Usage: <c>var ok = await new NewConnectionDialog(profile).ShowDialog&lt;bool&gt;(owner);</c>
/// If <c>ok</c> is true, <see cref="Result"/> contains the validated profile.
/// </summary>
public class NewConnectionDialog : Window
{
    /// <summary>Set when the user clicks OK. Contains the validated connection settings.</summary>
    public ConnectionProfile? Result { get; private set; }

    /// <summary>True when the profile was created from the Auto Setup flow and should start native Mombot.</summary>
    public bool AutoSetupRequested { get; private set; }

    private enum AutoSetupView
    {
        Recommended,
        ByServer,
        ByDate,
        ByPlayers,
    }

    private sealed class AutoServerOption
    {
        public AutoServerOption(TwcrawlServerSummary server) => Server = server;
        public TwcrawlServerSummary Server { get; }
        public override string ToString() => Server.Name;
    }

    private sealed class AutoAfterLoginOption
    {
        public AutoAfterLoginOption(string value, string label)
        {
            Value = value;
            Label = label;
        }

        public string Value { get; }
        public string Label { get; }
        public override string ToString() => Label;
    }

    private sealed class ProxyServerOption
    {
        public ProxyServerOption(string id, string label)
        {
            Id = id;
            Label = label;
        }

        public string Id { get; }
        public string Label { get; }
        public override string ToString() => Label;
    }

    private sealed class ProxyGameOption
    {
        public ProxyGameOption(ProxyManagedGame game, AppPreferences.ProxyServerPreference server)
        {
            Game = game;
            Server = server;
        }

        public ProxyManagedGame Game { get; }
        public AppPreferences.ProxyServerPreference Server { get; }
        public override string ToString()
            => $"{Game.Name}  :{Game.ListenPort}  {Game.Status}";
    }

    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgCard = new SolidColorBrush(Color.FromRgb(16, 53, 67));
    private static readonly IBrush BgCardAlt = new SolidColorBrush(Color.FromRgb(10, 43, 53));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(7, 28, 36));
    private static readonly IBrush TableHeaderBg = new SolidColorBrush(Color.FromRgb(12, 35, 44));
    private static readonly IBrush TableHeaderEdge = new SolidColorBrush(Color.FromRgb(34, 78, 91));
    private static readonly IBrush TableHeaderText = new SolidColorBrush(Color.FromRgb(166, 211, 220));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush InnerEdge = new SolidColorBrush(Color.FromRgb(23, 81, 94));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(142, 195, 205));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));
    private static readonly IBrush AccentHot = new SolidColorBrush(Color.FromRgb(255, 193, 74));
    private static readonly IBrush AccentInk = new SolidColorBrush(Color.FromRgb(8, 26, 30));
    private static readonly IBrush ErrorText = new SolidColorBrush(Color.FromRgb(255, 106, 106));
    private static readonly IBrush WarnText = new SolidColorBrush(Color.FromRgb(255, 226, 88));
    private static readonly IBrush BadText = new SolidColorBrush(Color.FromRgb(255, 95, 95));
    private const double FieldLabelWidth = 92;

    private readonly bool _allowAutoSetup;
    private readonly IReadOnlyList<AppPreferences.ProxyServerPreference> _proxyServers;
    private bool _autoSetupLoaded;
    private CancellationTokenSource? _autoLoadCts;
    private readonly Dictionary<AutoSetupView, Button> _autoSetupViewButtons = new();
    private IReadOnlyList<TwcrawlServerSummary> _autoServers = Array.Empty<TwcrawlServerSummary>();
    private IReadOnlyList<TwcrawlGameSummary> _autoGames = Array.Empty<TwcrawlGameSummary>();
    private AutoSetupView _autoSetupView = AutoSetupView.Recommended;
    private StackPanel? _serverListPanel;
    private TextBlock? _autoStatusText;
    private TextBlock? _autoValidationText;
    private TextBlock? _selectedGameText;
    private TextBox? _autoUsernameBox;
    private TextBox? _autoPasswordBox;
    private TextBox? _autoBotNameBox;
    private ComboBox? _autoServerPicker;
    private string? _selectedAutoServerId;
    private ComboBox? _autoAfterLoginCombo;
    private TextBox? _autoBotCommandBox;
    private TextBox? _autoMacroBox;
    private Control? _autoBotCommandRow;
    private Control? _autoMacroRow;
    private TwcrawlGameSummary? _selectedAutoGame;

    public NewConnectionDialog(
        ConnectionProfile? defaults = null,
        bool allowAutoSetup = true,
        IReadOnlyList<AppPreferences.ProxyServerPreference>? proxyServers = null)
    {
        _allowAutoSetup = allowAutoSetup && defaults == null;
        _proxyServers = proxyServers ?? Array.Empty<AppPreferences.ProxyServerPreference>();
        Title = defaults == null ? "New Connection" : "Edit Connection";
        Width = _allowAutoSetup ? 1160 : 500;
        Height = _allowAutoSetup ? 760 : double.NaN;
        SizeToContent = _allowAutoSetup ? SizeToContent.Manual : SizeToContent.Height;
        MinHeight = 200;
        MinWidth = _allowAutoSetup ? 980 : 500;
        CanResize = _allowAutoSetup;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgWin;

        var profile = defaults ?? new ConnectionProfile();
        Control manualSetup = BuildManualSetup(profile);

        Control content = _allowAutoSetup
            ? BuildTabbedContent(manualSetup, BuildAutoSetup())
            : manualSetup;

        Content = new Border
        {
            Padding = new Thickness(14),
            Child = content,
        };

        if (_allowAutoSetup)
        {
            Opened += async (_, _) =>
            {
                if (_autoSetupLoaded)
                    return;
                _autoSetupLoaded = true;
                await ReloadAutoServersAsync();
            };
            Closed += (_, _) => _autoLoadCts?.Cancel();
        }
    }

    private static Control BuildTabbedContent(Control manualSetup, Control autoSetup)
    {
        return new TabControl
        {
            ItemsSource = new[]
            {
                new TabItem { Header = "Manual Setup", Content = manualSetup },
                new TabItem { Header = BuildAutoSetupTabHeader(), Content = autoSetup },
            },
        };
    }

    private static Control BuildAutoSetupTabHeader()
    {
        return new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 7,
            VerticalAlignment = VerticalAlignment.Center,
            Children =
            {
                new TextBlock
                {
                    Text = "Auto Setup",
                    VerticalAlignment = VerticalAlignment.Center,
                },
                new Border
                {
                    Background = new SolidColorBrush(Color.FromRgb(150, 16, 28)),
                    BorderBrush = new SolidColorBrush(Color.FromRgb(255, 120, 130)),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(4),
                    Padding = new Thickness(5, 1),
                    VerticalAlignment = VerticalAlignment.Center,
                    Child = new TextBlock
                    {
                        Text = "NEW",
                        Foreground = Brushes.White,
                        FontSize = 8,
                        FontWeight = FontWeight.Bold,
                        LineHeight = 9,
                        VerticalAlignment = VerticalAlignment.Center,
                    },
                },
            },
        };
    }

    private Control BuildManualSetup(ConnectionProfile profile)
    {
        int initialSectors = profile.Sectors > 0 ? profile.Sectors : ConnectionProfile.DefaultSectors;

        var txtName = CreateTextBox(profile.Name, "rogue_t", width: 250);
        var txtServer = CreateTextBox(profile.Server, "hostname or IP address", width: 250);
        var txtPort = CreateTextBox(profile.Port.ToString(), width: 88);
        var txtSectors = CreateTextBox(initialSectors.ToString(), ConnectionProfile.DefaultSectors.ToString(), width: 108);
        var txtListenPort = CreateTextBox(
            (profile.ListenPort > 0 ? profile.ListenPort : ConnectionProfile.DefaultListenPort).ToString(),
            ConnectionProfile.DefaultListenPort.ToString(),
            width: 88);
        var txtLoginScript = CreateTextBox(string.IsNullOrWhiteSpace(profile.LoginScript) ? "0_Login.cts" : profile.LoginScript, width: 250);
        var txtLoginName = CreateTextBox(profile.LoginName, width: 250);
        var txtPassword = CreateTextBox(profile.Password, width: 250);
        var txtGameLetter = CreateTextBox(profile.GameLetter, width: 88);
        IReadOnlyList<TwEditOption> editOptions = TwEditCatalogService.LoadOptions();
        var cboEdit = new ComboBox
        {
            ItemsSource = editOptions,
            SelectedItem = editOptions.FirstOrDefault(option =>
                string.Equals(option.Id, profile.EditId, StringComparison.OrdinalIgnoreCase)) ?? editOptions[0],
            Width = 250,
            MinHeight = 30,
            FontSize = 13,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
        };
        var btnViewEdit = BuildSmallButton("View Edit");
        var editPicker = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Children = { cboEdit, btnViewEdit },
        };

        var cboProtocol = new ComboBox
        {
            ItemsSource = new[] { "Telnet", "Rlogin" },
            SelectedIndex = profile.Protocol == TwProtocol.Rlogin ? 1 : 0,
            Width = 86,
            MinHeight = 30,
            FontSize = 13,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
        };

        var chkEmbedded = CreateCheckBox("Run embedded proxy (enables .ts/.cts scripts)", profile.EmbeddedProxy);
        var chkListenForConnections = CreateCheckBox("Listen for connections", profile.ListenForConnections);
        var chkStandaloneProxy = CreateCheckBox("Connect to standalone TWX proxy on this machine", profile.LocalTwxProxy);
        var proxyServerOptions = new List<ProxyServerOption> { new(string.Empty, "None") };
        proxyServerOptions.AddRange(_proxyServers.Select(server => new ProxyServerOption(server.Id, server.DisplayName)));
        var cboProxyServer = new ComboBox
        {
            ItemsSource = proxyServerOptions,
            SelectedItem = proxyServerOptions.FirstOrDefault(option =>
                string.Equals(option.Id, profile.RemoteProxyServerId, StringComparison.OrdinalIgnoreCase)) ?? proxyServerOptions[0],
            Width = 250,
            MinHeight = 30,
            FontSize = 13,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
        };
        var txtRemoteProxyGameId = CreateTextBox(profile.RemoteProxyGameId, "remote game id", width: 250);
        var cboRemoteProxyGame = new ComboBox
        {
            ItemsSource = Array.Empty<ProxyGameOption>(),
            Width = 250,
            MinHeight = 30,
            FontSize = 13,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
        };
        var btnRefreshRemoteGames = BuildSmallButton("Refresh");
        var remoteGameStatus = new TextBlock
        {
            Foreground = FgMuted,
            FontSize = 12,
            TextWrapping = TextWrapping.Wrap,
            IsVisible = false,
        };
        var remoteGamePicker = new StackPanel
        {
            Spacing = 5,
            Children =
            {
                new StackPanel
                {
                    Orientation = Orientation.Horizontal,
                    Spacing = 8,
                    Children = { cboRemoteProxyGame, btnRefreshRemoteGames },
                },
                remoteGameStatus,
            },
        };
        var chkAutoReconnect = CreateCheckBox("Auto-reconnect on disconnect", profile.AutoReconnect);
        var chkUseLogin = CreateCheckBox("Run login script after connect", profile.UseLogin);
        var chkUseRLogin = CreateCheckBox("Use RLogin handshake", profile.UseRLogin);

        var validationText = BuildValidationText();

        var connectionFields = BuildConnectionFieldsGrid(txtName, txtServer, cboProtocol, txtPort, txtSectors);
        var editRow = BuildRow("Edit:", editPicker);
        var proxyServerRow = BuildRow("Proxy server:", cboProxyServer);
        var proxyGameIdRow = BuildRow("Proxy game:", remoteGamePicker);
        var listenPortRow = BuildRow("Listen port:", txtListenPort);
        var loginScriptRow = BuildRow("Login script:", txtLoginScript);
        var loginNameRow = BuildRow("Username:", txtLoginName);
        var passwordRow = BuildRow("Password:", txtPassword);
        var gameLetterRow = BuildRow("Game letter:", txtGameLetter);

        var connectionSection = BuildSection("Game & Server", connectionFields, editRow);
        var proxySection = BuildSection("Proxy Mode", proxyServerRow, proxyGameIdRow, chkEmbedded, chkListenForConnections, listenPortRow, chkStandaloneProxy, chkAutoReconnect);
        var loginSection = BuildSection("Login Automation", chkUseLogin, chkUseRLogin, loginScriptRow, loginNameRow, passwordRow, gameLetterRow);

        void SetValidation(string? message)
        {
            validationText.Text = message ?? string.Empty;
            validationText.IsVisible = !string.IsNullOrWhiteSpace(message);
        }

        void SetRemoteStatus(string? message, IBrush? brush = null)
        {
            remoteGameStatus.Text = message ?? string.Empty;
            remoteGameStatus.Foreground = brush ?? FgMuted;
            remoteGameStatus.IsVisible = !string.IsNullOrWhiteSpace(message);
        }

        void ApplyRemoteGameSelection()
        {
            if (cboRemoteProxyGame.SelectedItem is not ProxyGameOption selected)
                return;

            txtRemoteProxyGameId.Text = selected.Game.Id;
            if (string.IsNullOrWhiteSpace(txtName.Text))
                txtName.Text = selected.Game.Name;
            txtServer.Text = selected.Server.Host;
            txtPort.Text = selected.Game.ListenPort.ToString();
        }

        async Task RefreshRemoteGamesAsync(bool preserveSelection = true)
        {
            if (cboProxyServer.SelectedItem is not ProxyServerOption proxyOption ||
                string.IsNullOrWhiteSpace(proxyOption.Id))
            {
                cboRemoteProxyGame.ItemsSource = Array.Empty<ProxyGameOption>();
                cboRemoteProxyGame.SelectedItem = null;
                SetRemoteStatus(null);
                return;
            }

            AppPreferences.ProxyServerPreference? server = _proxyServers.FirstOrDefault(item =>
                string.Equals(item.Id, proxyOption.Id, StringComparison.OrdinalIgnoreCase));
            if (server == null)
            {
                SetRemoteStatus("Proxy server settings were not found.", BadText);
                return;
            }

            string previousGameId = preserveSelection
                ? txtRemoteProxyGameId.Text?.Trim() ?? string.Empty
                : string.Empty;
            SetRemoteStatus("Loading remote games...");
            btnRefreshRemoteGames.IsEnabled = false;
            try
            {
                IReadOnlyList<ProxyManagedGame> games = await new ProxyManagementClient(server).ListGamesAsync();
                var options = games
                    .OrderBy(game => game.Name, StringComparer.OrdinalIgnoreCase)
                    .Select(game => new ProxyGameOption(game, server))
                    .ToArray();
                cboRemoteProxyGame.ItemsSource = options;
                ProxyGameOption? selected = !string.IsNullOrWhiteSpace(previousGameId)
                    ? options.FirstOrDefault(option => string.Equals(option.Game.Id, previousGameId, StringComparison.OrdinalIgnoreCase))
                    : null;
                selected ??= options.FirstOrDefault(option =>
                    string.Equals(option.Game.Id, profile.RemoteProxyGameId, StringComparison.OrdinalIgnoreCase));
                selected ??= options.FirstOrDefault();
                cboRemoteProxyGame.SelectedItem = selected;
                ApplyRemoteGameSelection();
                SetRemoteStatus(options.Length == 0 ? "No games are configured on this proxy server." : null, WarnText);
            }
            catch (Exception ex)
            {
                cboRemoteProxyGame.ItemsSource = Array.Empty<ProxyGameOption>();
                cboRemoteProxyGame.SelectedItem = null;
                SetRemoteStatus($"Unable to load remote games: {ex.Message}", BadText);
            }
            finally
            {
                btnRefreshRemoteGames.IsEnabled = true;
            }
        }

        void RefreshModeVisibility()
        {
            bool embedded = chkEmbedded.IsChecked == true;
            bool remoteProxy = cboProxyServer.SelectedItem is ProxyServerOption option && !string.IsNullOrWhiteSpace(option.Id);
            bool showDetails = embedded && (chkUseLogin.IsChecked == true || chkUseRLogin.IsChecked == true);

            chkEmbedded.IsEnabled = !remoteProxy;
            proxyGameIdRow.IsVisible = remoteProxy;
            chkStandaloneProxy.IsVisible = !embedded && !remoteProxy;
            chkAutoReconnect.IsVisible = embedded;
            chkListenForConnections.IsVisible = embedded;
            listenPortRow.IsVisible = embedded && chkListenForConnections.IsChecked == true;
            loginSection.IsVisible = embedded;
            loginScriptRow.IsVisible = showDetails;
            loginNameRow.IsVisible = showDetails;
            passwordRow.IsVisible = showDetails;
            gameLetterRow.IsVisible = showDetails;
        }

        chkEmbedded.IsCheckedChanged += (_, _) => RefreshModeVisibility();
        cboProxyServer.SelectionChanged += (_, _) =>
        {
            if (cboProxyServer.SelectedItem is ProxyServerOption option && !string.IsNullOrWhiteSpace(option.Id))
            {
                chkEmbedded.IsChecked = false;
                chkStandaloneProxy.IsChecked = false;
            }
            RefreshModeVisibility();
            _ = RefreshRemoteGamesAsync(preserveSelection: false);
        };
        cboRemoteProxyGame.SelectionChanged += (_, _) => ApplyRemoteGameSelection();
        btnRefreshRemoteGames.Click += async (_, _) => await RefreshRemoteGamesAsync();
        chkListenForConnections.IsCheckedChanged += (_, _) => RefreshModeVisibility();
        chkUseLogin.IsCheckedChanged += (_, _) => RefreshModeVisibility();
        chkUseRLogin.IsCheckedChanged += (_, _) => RefreshModeVisibility();
        RefreshModeVisibility();
        if (!string.IsNullOrWhiteSpace(profile.RemoteProxyServerId))
            _ = RefreshRemoteGamesAsync();
        void RefreshEditButton()
        {
            btnViewEdit.IsEnabled = (cboEdit.SelectedItem as TwEditOption)?.Edit != null;
        }

        cboEdit.SelectionChanged += (_, _) => RefreshEditButton();
        btnViewEdit.Click += async (_, _) =>
        {
            if ((cboEdit.SelectedItem as TwEditOption)?.Edit is { } edit)
                await new TwEditViewDialog(edit).ShowDialog(this);
        };
        RefreshEditButton();

        WireDialogClipboard(txtName);
        WireDialogClipboard(txtServer);
        WireDialogClipboard(txtPort);
        WireDialogClipboard(txtSectors);
        WireDialogClipboard(txtListenPort);
        WireDialogClipboard(txtRemoteProxyGameId);
        WireDialogClipboard(txtLoginScript);
        WireDialogClipboard(txtLoginName);
        WireDialogClipboard(txtPassword);
        WireDialogClipboard(txtGameLetter);

        var btnOk = BuildActionButton("Save", primary: true);
        var btnCancel = BuildActionButton("Cancel", primary: false);

        btnOk.Click += (_, _) =>
        {
            SetValidation(null);

            string name = txtName.Text?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(name))
            {
                SetValidation("Enter a game name.");
                txtName.Focus();
                return;
            }

            string server = txtServer.Text?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(server))
            {
                SetValidation("Enter the game server host name or IP address.");
                txtServer.Focus();
                return;
            }

            if (!int.TryParse(txtPort.Text?.Trim(), out int portVal) || portVal is < 1 or > 65535)
            {
                SetValidation("Enter a valid TCP port from 1 to 65535.");
                txtPort.Focus();
                return;
            }

            if (!int.TryParse(txtSectors.Text?.Trim(), out int sectors) || !GameSizeLimits.IsValidSectorCount(sectors))
            {
                SetValidation($"Enter a sector count from {GameSizeLimits.RangeDisplay}.");
                txtSectors.Focus();
                return;
            }

            bool embeddedProxy = chkEmbedded.IsChecked == true;
            string remoteProxyServerId = (cboProxyServer.SelectedItem as ProxyServerOption)?.Id ?? string.Empty;
            bool remoteProxySelected = !string.IsNullOrWhiteSpace(remoteProxyServerId);
            if (remoteProxySelected)
            {
                ApplyRemoteGameSelection();
                if (cboRemoteProxyGame.SelectedItem is not ProxyGameOption)
                {
                    SetValidation("Select a remote proxy game.");
                    cboRemoteProxyGame.Focus();
                    return;
                }
            }
            bool listenForConnections = embeddedProxy && chkListenForConnections.IsChecked == true;
            int listenPort = profile.ListenPort > 0 ? profile.ListenPort : ConnectionProfile.DefaultListenPort;
            bool listenPortValid = int.TryParse(txtListenPort.Text?.Trim(), out int parsedListenPort) &&
                                   parsedListenPort is >= 1 and <= ushort.MaxValue;
            if (listenPortValid)
                listenPort = parsedListenPort;
            else if (listenForConnections)
            {
                SetValidation("Enter a valid listen port from 1 to 65535.");
                txtListenPort.Focus();
                return;
            }

            Result = new ConnectionProfile
            {
                Name = name,
                Server = server,
                Port = portVal,
                Protocol = cboProtocol.SelectedIndex == 1 ? TwProtocol.Rlogin : TwProtocol.Telnet,
                LocalTwxProxy = !remoteProxySelected && chkStandaloneProxy.IsChecked == true,
                RemoteProxyServerId = remoteProxyServerId,
                RemoteProxyGameId = remoteProxySelected
                    ? (string.IsNullOrWhiteSpace(txtRemoteProxyGameId.Text) ? name : txtRemoteProxyGameId.Text.Trim())
                    : string.Empty,
                EmbeddedProxy = embeddedProxy,
                AutoReconnect = chkAutoReconnect.IsChecked == true,
                ListenForConnections = listenForConnections,
                ListenPort = listenPort,
                Sectors = sectors,
                UseLogin = chkUseLogin.IsChecked == true,
                UseRLogin = chkUseRLogin.IsChecked == true,
                LoginScript = string.IsNullOrWhiteSpace(txtLoginScript.Text) ? "0_Login.cts" : txtLoginScript.Text.Trim(),
                LoginName = txtLoginName.Text?.Trim() ?? string.Empty,
                Password = txtPassword.Text ?? string.Empty,
                GameLetter = string.IsNullOrWhiteSpace(txtGameLetter.Text)
                    ? string.Empty
                    : txtGameLetter.Text.Trim().Substring(0, 1).ToUpperInvariant(),
                EditId = (cboEdit.SelectedItem as TwEditOption)?.Id ?? string.Empty,
                LoginSettingsConfigured = chkEmbedded.IsChecked == true,
                ScrollbackLines = profile.ScrollbackLines,
            };
            AutoSetupRequested = false;
            Close(true);
        };

        btnCancel.Click += (_, _) => Close(false);

        var btnRow = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 10,
            Children = { btnCancel, btnOk },
        };

        return new StackPanel
        {
            Spacing = 10,
            Children =
            {
                connectionSection,
                proxySection,
                loginSection,
                validationText,
                btnRow,
            },
        };
    }

    private Control BuildAutoSetup()
    {
        _autoStatusText = new TextBlock
        {
            Text = "Loading active TradeWars servers from twcrawl...",
            Foreground = FgMuted,
            FontSize = 13,
            IsVisible = true,
        };
        _autoValidationText = BuildValidationText();
        _selectedGameText = new TextBlock
        {
            Text = "Select a game above, then enter your first-login account information.",
            Foreground = FgMuted,
            FontSize = 13,
            TextWrapping = TextWrapping.Wrap,
        };
        _autoUsernameBox = CreateTextBox(string.Empty, "username", width: 180);
        _autoPasswordBox = CreateTextBox(string.Empty, "password", width: 180);
        _autoPasswordBox.PasswordChar = '*';
        _autoBotNameBox = CreateTextBox(GetRememberedAutoBotName(), "bot name", width: 50);
        var afterLoginOptions = new[]
        {
            new AutoAfterLoginOption("nothing", "Nothing"),
            new AutoAfterLoginOption("command", "Run Command"),
            new AutoAfterLoginOption("macro", "Fire Macro"),
            new AutoAfterLoginOption("terra", "Land on Terra"),
        };
        _autoAfterLoginCombo = new ComboBox
        {
            ItemsSource = afterLoginOptions,
            SelectedIndex = 0,
            Width = 165,
            MinHeight = 30,
            FontSize = 13,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
        };
        _autoBotCommandBox = CreateTextBox(string.Empty, "bot command", width: 310);
        _autoMacroBox = CreateTextBox(string.Empty, "macro", width: 310);
        _autoBotCommandRow = BuildAutoInlineRow("Bot command", _autoBotCommandBox);
        _autoMacroRow = BuildAutoInlineRow("Macro", _autoMacroBox);
        _autoBotCommandRow.IsVisible = false;
        _autoMacroRow.IsVisible = false;

        WireDialogClipboard(_autoUsernameBox);
        WireDialogClipboard(_autoPasswordBox);
        WireDialogClipboard(_autoBotNameBox);
        WireDialogClipboard(_autoBotCommandBox);
        WireDialogClipboard(_autoMacroBox);

        _autoAfterLoginCombo.SelectionChanged += (_, _) => RefreshAutoAfterLoginFields();

        var reloadButton = BuildActionButton("Refresh Data", primary: false);
        reloadButton.Click += async (_, _) => await ReloadAutoServersAsync();

        _serverListPanel = new StackPanel { Spacing = 8 };
        var serverScroll = new ScrollViewer
        {
            Content = _serverListPanel,
            VerticalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = Avalonia.Controls.Primitives.ScrollBarVisibility.Disabled,
        };

        var goButton = BuildActionButton("GO", primary: true);
        goButton.Click += (_, _) => SubmitAutoSetup();

        var header = new Grid { ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) } };
        Grid.SetColumn(_autoStatusText, 0);
        Grid.SetColumn(reloadButton, 1);
        header.Children.Add(_autoStatusText);
        header.Children.Add(reloadButton);

        var viewTabs = BuildAutoSetupViewTabs();

        var credentialsGrid = new Grid
        {
            ColumnSpacing = 10,
            RowSpacing = 6,
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Auto),
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto),
            },
        };
        credentialsGrid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
        credentialsGrid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
        credentialsGrid.RowDefinitions.Add(new RowDefinition(GridLength.Auto));

        AddInlineLabel(credentialsGrid, 0, 0, "Username");
        AddInlineControl(credentialsGrid, 0, 1, _autoUsernameBox);
        AddInlineLabel(credentialsGrid, 0, 2, "Password");
        AddInlineControl(credentialsGrid, 0, 3, _autoPasswordBox);
        AddInlineLabel(credentialsGrid, 0, 4, "Bot");
        AddInlineControl(credentialsGrid, 0, 5, _autoBotNameBox);
        AddInlineLabel(credentialsGrid, 0, 6, "After login");
        AddInlineControl(credentialsGrid, 0, 7, _autoAfterLoginCombo);
        Grid.SetRow(goButton, 0);
        Grid.SetColumn(goButton, 9);
        credentialsGrid.Children.Add(goButton);

        Grid.SetRow(_autoBotCommandRow, 1);
        Grid.SetColumn(_autoBotCommandRow, 0);
        Grid.SetColumnSpan(_autoBotCommandRow, 10);
        credentialsGrid.Children.Add(_autoBotCommandRow);
        Grid.SetRow(_autoMacroRow, 1);
        Grid.SetColumn(_autoMacroRow, 0);
        Grid.SetColumnSpan(_autoMacroRow, 10);
        credentialsGrid.Children.Add(_autoMacroRow);

        Grid.SetColumn(_selectedGameText, 0);
        Grid.SetColumnSpan(_selectedGameText, 10);
        Grid.SetRow(_selectedGameText, 2);
        credentialsGrid.Children.Add(_selectedGameText);

        var bottom = BuildSection(
            "Create and Login",
            credentialsGrid,
            _autoValidationText);

        var grid = new Grid
        {
            RowSpacing = 10,
            RowDefinitions =
            {
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
                new RowDefinition(new GridLength(1, GridUnitType.Star)),
                new RowDefinition(GridLength.Auto),
            },
        };
        Grid.SetRow(header, 0);
        Grid.SetRow(viewTabs, 1);
        Grid.SetRow(serverScroll, 2);
        Grid.SetRow(bottom, 3);
        grid.Children.Add(header);
        grid.Children.Add(viewTabs);
        grid.Children.Add(serverScroll);
        grid.Children.Add(bottom);

        RefreshAutoAfterLoginFields();
        return grid;
    }

    private static string GetRememberedAutoBotName()
    {
        try
        {
            string remembered = AppPreferences.Load().LastNativeMombotBotName.Trim();
            return string.IsNullOrWhiteSpace(remembered) ? "mombot" : remembered;
        }
        catch
        {
            return "mombot";
        }
    }

    private Control BuildAutoSetupViewTabs()
    {
        _autoSetupViewButtons.Clear();
        var panel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            Margin = new Thickness(0, 0, 0, 2),
        };

        AddAutoSetupViewButton(panel, AutoSetupView.Recommended, "Recommended");
        AddAutoSetupViewButton(panel, AutoSetupView.ByServer, "By Server");
        AddAutoSetupViewButton(panel, AutoSetupView.ByDate, "By Date");
        AddAutoSetupViewButton(panel, AutoSetupView.ByPlayers, "By Players");
        RefreshAutoSetupViewTabs();
        return panel;
    }

    private void AddAutoSetupViewButton(StackPanel panel, AutoSetupView view, string text)
    {
        var button = BuildSmallButton(text);
        button.MinWidth = 102;
        button.Padding = new Thickness(12, 6);
        button.Click += (_, _) =>
        {
            if (_autoSetupView == view)
                return;
            _autoSetupView = view;
            _selectedAutoGame = null;
            if (_selectedGameText != null)
            {
                _selectedGameText.Text = "Select a game above, then enter your first-login account information.";
                _selectedGameText.Foreground = FgMuted;
            }
            RefreshAutoSetupViewTabs();
            RefreshAutoSetupGameList();
        };
        _autoSetupViewButtons[view] = button;
        panel.Children.Add(button);
    }

    private void RefreshAutoSetupViewTabs()
    {
        foreach ((AutoSetupView view, Button button) in _autoSetupViewButtons)
        {
            bool selected = view == _autoSetupView;
            button.Background = selected ? Accent : BgCardAlt;
            button.BorderBrush = selected ? AccentHot : InnerEdge;
            button.Foreground = selected ? AccentInk : FgText;
        }
    }

    private static Control BuildAutoInlineRow(string label, Control input)
    {
        var row = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 8,
            VerticalAlignment = VerticalAlignment.Center,
        };
        row.Children.Add(new TextBlock
        {
            Text = label,
            Foreground = FgText,
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
            Width = 92,
            VerticalAlignment = VerticalAlignment.Center,
        });
        row.Children.Add(input);
        return row;
    }

    private void RefreshAutoAfterLoginFields()
    {
        string selectedAction = (_autoAfterLoginCombo?.SelectedItem as AutoAfterLoginOption)?.Value ?? "nothing";
        if (_autoBotCommandRow != null)
            _autoBotCommandRow.IsVisible = string.Equals(selectedAction, "command", StringComparison.OrdinalIgnoreCase);
        if (_autoMacroRow != null)
            _autoMacroRow.IsVisible = string.Equals(selectedAction, "macro", StringComparison.OrdinalIgnoreCase);
    }

    private async Task ReloadAutoServersAsync()
    {
        _autoLoadCts?.Cancel();
        _autoLoadCts = new CancellationTokenSource();
        CancellationToken token = _autoLoadCts.Token;

        if (_serverListPanel == null || _autoStatusText == null)
            return;

        _serverListPanel.Children.Clear();
        _autoStatusText.Text = "Loading active TradeWars servers from twcrawl...";
        _autoStatusText.Foreground = FgMuted;
        _autoStatusText.IsVisible = true;
        SetAutoValidation(null);

        try
        {
            IReadOnlyList<TwcrawlServerSummary> servers = await TwcrawlDiscoveryClient.FetchActiveServersAsync(token);
            if (token.IsCancellationRequested)
                return;

            _autoServers = servers;
            _autoGames = servers.SelectMany(server => server.GameList).ToArray();
            RefreshAutoSetupGameList();

            _autoStatusText.Text = servers.Count == 0 ? "No active servers were reported by twcrawl." : string.Empty;
            _autoStatusText.Foreground = servers.Count == 0 ? WarnText : FgMuted;
            _autoStatusText.IsVisible = servers.Count == 0;
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            _autoStatusText.Text = "Unable to load twcrawl data.";
            _autoStatusText.Foreground = BadText;
            SetAutoValidation(ex.Message);
        }
    }

    private void RefreshAutoSetupGameList()
    {
        if (_serverListPanel == null)
            return;

        _serverListPanel.Children.Clear();
        if (_autoServers.Count == 0)
        {
            _serverListPanel.Children.Add(new TextBlock
            {
                Text = "No games are available yet.",
                Foreground = FgMuted,
                FontSize = 13,
            });
            return;
        }

        switch (_autoSetupView)
        {
            case AutoSetupView.ByServer:
                BuildByServerGameList(_serverListPanel);
                break;
            case AutoSetupView.ByDate:
                BuildFlatGameList(
                    _serverListPanel,
                    _autoGames.OrderBy(DaysSortKey).ThenBy(game => game.ServerName).ThenBy(game => game.Letter),
                    includeServerName: true);
                break;
            case AutoSetupView.ByPlayers:
                BuildFlatGameList(
                    _serverListPanel,
                    _autoGames.OrderByDescending(game => game.Players).ThenBy(DaysSortKey).ThenBy(game => game.ServerName),
                    includeServerName: true);
                break;
            default:
                BuildFlatGameList(_serverListPanel, BuildRecommendedGames(), includeServerName: true);
                break;
        }
    }

    private void BuildByServerGameList(StackPanel target)
    {
        var pickerPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 10,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 4),
        };

        pickerPanel.Children.Add(new TextBlock
        {
            Text = "Choose Server",
            Foreground = FgText,
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
            VerticalAlignment = VerticalAlignment.Center,
        });

        var options = _autoServers.Select(server => new AutoServerOption(server)).ToArray();
        int selectedIndex = 0;
        if (!string.IsNullOrWhiteSpace(_selectedAutoServerId))
        {
            int existingIndex = Array.FindIndex(options, option =>
                string.Equals(option.Server.ServerId, _selectedAutoServerId, StringComparison.OrdinalIgnoreCase));
            if (existingIndex >= 0)
                selectedIndex = existingIndex;
        }
        _autoServerPicker = new ComboBox
        {
            ItemsSource = options,
            SelectedIndex = selectedIndex,
            Width = 290,
            MinHeight = 30,
            FontSize = 13,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
        };
        _autoServerPicker.SelectionChanged += (_, _) =>
        {
            if (_autoServerPicker.SelectedItem is AutoServerOption selectedServer)
                _selectedAutoServerId = selectedServer.Server.ServerId;
            RefreshAutoSetupGameList();
        };
        pickerPanel.Children.Add(_autoServerPicker);
        target.Children.Add(pickerPanel);

        TwcrawlServerSummary server = ((_autoServerPicker.SelectedItem as AutoServerOption) ?? options[selectedIndex]).Server;
        _selectedAutoServerId = server.ServerId;
        BuildFlatGameList(target, server.GameList, includeServerName: false);
    }

    private void BuildFlatGameList(StackPanel target, IEnumerable<TwcrawlGameSummary> games, bool includeServerName)
    {
        target.Children.Add(BuildGameHeaderRow());
        int count = 0;
        foreach (TwcrawlGameSummary game in games)
        {
            target.Children.Add(BuildGameRow(game, includeServerName));
            count++;
        }

        if (count == 0)
        {
            target.Children.Add(new Border
            {
                Background = BgCardAlt,
                BorderBrush = InnerEdge,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(6),
                Padding = new Thickness(10, 8),
                Child = new TextBlock
                {
                    Text = "No games matched this view.",
                    Foreground = FgMuted,
                    FontSize = 13,
                },
            });
        }
    }

    private IEnumerable<TwcrawlGameSummary> BuildRecommendedGames()
    {
        const int recommendedCount = 10;
        TwcrawlGameSummary[] candidates = _autoGames
            .Where(IsRecommendedGameCandidate)
            .ToArray();
        if (candidates.Length == 0)
            return Array.Empty<TwcrawlGameSummary>();

        int maxPlayers = Math.Max(1, candidates.Max(game => game.Players));
        int maxYoungDays = Math.Max(1, Math.Min(90, candidates
            .Where(game => DaysSortKey(game) < 90)
            .Select(DaysSortKey)
            .DefaultIfEmpty(90)
            .Max()));

        IOrderedEnumerable<TwcrawlGameSummary> SortRecommended(IEnumerable<TwcrawlGameSummary> games) =>
            games.OrderBy(game => RecommendedScore(game, maxPlayers, maxYoungDays))
                .ThenBy(game => game.ServerName)
                .ThenBy(game => game.Letter);

        TwcrawlGameSummary[] youngGames = SortRecommended(candidates.Where(game => DaysSortKey(game) < 90))
            .Take(recommendedCount)
            .ToArray();
        if (youngGames.Length >= recommendedCount)
            return youngGames;

        return youngGames
            .Concat(SortRecommended(candidates.Where(game => DaysSortKey(game) >= 90))
                .Take(recommendedCount - youngGames.Length))
            .ToArray();
    }

    private static bool IsRecommendedGameCandidate(TwcrawlGameSummary game)
        => !ContainsWord(game.Name, "Test");

    private static bool ContainsWord(string? value, string word)
    {
        if (string.IsNullOrWhiteSpace(value) || string.IsNullOrWhiteSpace(word))
            return false;

        int index = 0;
        while ((index = value.IndexOf(word, index, StringComparison.OrdinalIgnoreCase)) >= 0)
        {
            int end = index + word.Length;
            bool leftBoundary = index == 0 || !char.IsLetterOrDigit(value[index - 1]);
            bool rightBoundary = end >= value.Length || !char.IsLetterOrDigit(value[end]);
            if (leftBoundary && rightBoundary)
                return true;

            index = end;
        }

        return false;
    }

    private static double RecommendedScore(TwcrawlGameSummary game, int maxPlayers, int maxDays)
    {
        double playerPenalty = 1.0 - Math.Clamp(game.Players / (double)maxPlayers, 0.0, 1.0);
        double dayPenalty = Math.Clamp(DaysSortKey(game) / (double)maxDays, 0.0, 1.0);

        // Player count carries most of the ranking weight; warning/time penalties still keep bad candidates down.
        return (playerPenalty * 0.75) +
               (dayPenalty * 0.25) +
               (WarningScore(game) * 1.5) +
               (IsUnlimitedTime(game.Time) ? 0 : 1.0);
    }

    private static int WarningScore(TwcrawlGameSummary game)
    {
        int score = QualityPenalty(TwcrawlDiscoveryClient.ClassifyLatency(game.Latency)) +
                    QualityPenalty(TwcrawlDiscoveryClient.ClassifyShipDelay(game.ShipDelay));
        if (!IsUnlimitedTime(game.Time))
            score += 1;
        return score;
    }

    private static int QualityPenalty(TwcrawlQuality quality)
        => quality switch
        {
            TwcrawlQuality.Bad => 2,
            TwcrawlQuality.Warn => 1,
            _ => 0,
        };

    private static int DaysSortKey(TwcrawlGameSummary game)
        => game.DaysOpen ?? int.MaxValue;

    private static bool IsUnlimitedTime(string? time)
        => string.Equals((time ?? string.Empty).Trim(), "Unlimited", StringComparison.OrdinalIgnoreCase);

    private static string BuildAutoGameDisplayName(TwcrawlGameSummary game, bool includeServerName)
    {
        string gameName = $"{game.Letter} - {game.Name}";
        return includeServerName ? $"{game.ServerName} {gameName}" : gameName;
    }

    private Control BuildGameHeaderRow()
    {
        var grid = BuildGameRowGrid();
        AddGameHeader(grid, 0, "Game");
        AddGameHeader(grid, 1, "Days");
        AddGameHeader(grid, 2, "Turns");
        AddGameHeader(grid, 3, "Sectors");
        AddGameHeader(grid, 4, "Players");
        AddGameHeader(grid, 5, "Warnings");
        AddGameHeader(grid, 6, "Details");
        AddGameHeader(grid, 7, "Select");
        return new Border
        {
            Background = TableHeaderBg,
            BorderBrush = TableHeaderEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(5),
            Padding = new Thickness(8, 4),
            Child = grid,
        };
    }

    private Control BuildGameRow(TwcrawlGameSummary game, bool includeServerName)
    {
        var grid = BuildGameRowGrid();

        AddGameText(grid, 0, BuildAutoGameDisplayName(game, includeServerName), FgText, FontWeight.SemiBold, HorizontalAlignment.Left);
        AddGameText(grid, 1, game.DaysOpen?.ToString() ?? "-", FgMuted, FontWeight.Normal);
        AddGameText(grid, 2, EmptyDash(game.Turns), FgMuted, FontWeight.Normal);
        AddGameText(grid, 3, game.Sectors.ToString("N0"), FgMuted, FontWeight.Normal);
        AddGameText(grid, 4, game.Players.ToString("N0"), FgMuted, FontWeight.Normal);

        var warningPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 4,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };
        AddWarningLabel(warningPanel, "LATENCY", TwcrawlDiscoveryClient.ClassifyLatency(game.Latency));
        AddWarningLabel(warningPanel, "MOVE DELAY", TwcrawlDiscoveryClient.ClassifyShipDelay(game.ShipDelay));
        if (!IsUnlimitedTime(game.Time))
            AddWarningLabel(warningPanel, "TIME LIMIT", TwcrawlQuality.Warn);
        Grid.SetColumn(warningPanel, 5);
        grid.Children.Add(warningPanel);

        var details = BuildSmallButton("View Details");
        details.Click += async (_, _) => await OpenGameDetailsAsync(game);
        Grid.SetColumn(details, 6);
        grid.Children.Add(details);

        var select = BuildSmallButton("Select Game", primary: true);
        select.Click += (_, _) => SelectAutoGame(game);
        Grid.SetColumn(select, 7);
        grid.Children.Add(select);

        return new Border
        {
            Background = BgCardAlt,
            BorderBrush = InnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(8, 5),
            Child = grid,
        };
    }

    private static Grid BuildGameRowGrid()
    {
        return new Grid
        {
            ColumnSpacing = 10,
            ColumnDefinitions =
            {
                new ColumnDefinition(new GridLength(3.2, GridUnitType.Star)),
                new ColumnDefinition(new GridLength(58)),
                new ColumnDefinition(new GridLength(100)),
                new ColumnDefinition(new GridLength(78)),
                new ColumnDefinition(new GridLength(65)),
                new ColumnDefinition(new GridLength(190)),
                new ColumnDefinition(new GridLength(90)),
                new ColumnDefinition(new GridLength(96)),
            },
        };
    }

    private void SelectAutoGame(TwcrawlGameSummary game)
    {
        _selectedAutoGame = game;
        string suggestedName = TwcrawlDiscoveryClient.BuildSuggestedGameName(game);
        if (_selectedGameText != null)
        {
            _selectedGameText.Text =
                $"Selected {game.ServerName} game {game.Letter}: {game.Name}. Game will be saved as '{suggestedName}' and opened through the embedded proxy.";
            _selectedGameText.Foreground = FgText;
        }

        SetAutoValidation(null);
        Dispatcher.UIThread.Post(() => _autoUsernameBox?.Focus(), DispatcherPriority.Input);
    }

    private void SubmitAutoSetup()
    {
        SetAutoValidation(null);
        if (_selectedAutoGame == null)
        {
            SetAutoValidation("Select a game first.");
            return;
        }

        string username = _autoUsernameBox?.Text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(username))
        {
            SetAutoValidation("Enter the username to create or log into.");
            _autoUsernameBox?.Focus();
            return;
        }

        string password = _autoPasswordBox?.Text ?? string.Empty;
        if (string.IsNullOrEmpty(password))
        {
            SetAutoValidation("Enter the password for this game.");
            _autoPasswordBox?.Focus();
            return;
        }

        string botName = _autoBotNameBox?.Text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(botName))
            botName = "mombot";

        string afterLoginAction = (_autoAfterLoginCombo?.SelectedItem as AutoAfterLoginOption)?.Value ?? "nothing";
        string botCommand = string.Empty;
        string macroAfterLogin = string.Empty;
        if (string.Equals(afterLoginAction, "command", StringComparison.OrdinalIgnoreCase))
        {
            botCommand = _autoBotCommandBox?.Text?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(botCommand))
            {
                SetAutoValidation("Enter the bot command to run after login.");
                _autoBotCommandBox?.Focus();
                return;
            }
        }
        else if (string.Equals(afterLoginAction, "macro", StringComparison.OrdinalIgnoreCase))
        {
            macroAfterLogin = _autoMacroBox?.Text?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(macroAfterLogin))
            {
                SetAutoValidation("Enter the macro to fire after login.");
                _autoMacroBox?.Focus();
                return;
            }
        }
        else if (string.Equals(afterLoginAction, "terra", StringComparison.OrdinalIgnoreCase))
        {
            macroAfterLogin = "pt";
        }

        if (!TwcrawlDiscoveryClient.TryParseTelnetEndpoint(_selectedAutoGame.ServerTelnet, out string host, out int port))
        {
            SetAutoValidation($"Unable to parse telnet endpoint '{_selectedAutoGame.ServerTelnet}'.");
            return;
        }

        Result = new ConnectionProfile
        {
            Name = TwcrawlDiscoveryClient.BuildSuggestedGameName(_selectedAutoGame),
            Server = host,
            Port = port,
            Protocol = TwProtocol.Telnet,
            LocalTwxProxy = true,
            EmbeddedProxy = true,
            AutoReconnect = false,
            ListenForConnections = false,
            ListenPort = ConnectionProfile.DefaultListenPort,
            Sectors = _selectedAutoGame.Sectors > 0 ? _selectedAutoGame.Sectors : ConnectionProfile.DefaultSectors,
            UseLogin = false,
            UseRLogin = false,
            LoginScript = "0_Login.cts",
            LoginName = username,
            Password = password,
            GameLetter = _selectedAutoGame.Letter,
            LoginSettingsConfigured = true,
            AutoSetupBotName = botName,
            AutoSetupAfterLoginAction = afterLoginAction,
            AutoSetupBotCommand = botCommand,
            AutoSetupMacroAfterLogin = macroAfterLogin,
        };
        AutoSetupRequested = true;
        Close(true);
    }

    private async Task OpenGameDetailsAsync(TwcrawlGameSummary game)
    {
        Uri uri = TwcrawlDiscoveryClient.BuildDetailsUri(game);
        try
        {
            var launcher = TopLevel.GetTopLevel(this)?.Launcher;
            if (launcher != null && await launcher.LaunchUriAsync(uri))
                return;
        }
        catch
        {
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = uri.ToString(),
                UseShellExecute = true,
            });
        }
        catch (Exception ex)
        {
            SetAutoValidation($"Unable to open details page: {ex.Message}");
        }
    }

    private void SetAutoValidation(string? message)
    {
        if (_autoValidationText == null)
            return;

        _autoValidationText.Text = message ?? string.Empty;
        _autoValidationText.IsVisible = !string.IsNullOrWhiteSpace(message);
    }

    private static TextBlock BuildValidationText()
    {
        return new TextBlock
        {
            Foreground = ErrorText,
            FontSize = 12,
            IsVisible = false,
            TextWrapping = TextWrapping.Wrap,
        };
    }

    private static TextBox CreateTextBox(string? text, string? watermark = null, double width = double.NaN)
    {
        return new TextBox
        {
            Text = text ?? string.Empty,
            Watermark = watermark,
            Width = double.IsNaN(width) ? double.NaN : width,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = InnerEdge,
            CaretBrush = Accent,
            FontSize = 13,
            MinHeight = 30,
            Padding = new Thickness(8, 4),
        };
    }

    private static CheckBox CreateCheckBox(string text, bool isChecked)
    {
        return new CheckBox
        {
            Content = text,
            IsChecked = isChecked,
            Foreground = FgText,
            FontSize = 13,
            Margin = new Thickness(0, 1, 0, 1),
        };
    }

    private static Border BuildSection(string title, params Control[] children)
    {
        var body = new StackPanel { Spacing = 7 };
        body.Children.Add(new TextBlock
        {
            Text = title,
            Foreground = Accent,
            FontSize = 15,
            FontWeight = FontWeight.SemiBold,
        });

        foreach (Control child in children)
            body.Children.Add(child);

        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12),
            Child = body,
        };
    }

    private static Button BuildActionButton(string text, bool primary)
    {
        return new Button
        {
            Content = text,
            MinWidth = 86,
            Padding = new Thickness(12, 6),
            Background = primary ? Accent : BgCardAlt,
            BorderBrush = primary ? AccentHot : InnerEdge,
            Foreground = primary ? AccentInk : FgText,
            FontSize = 13,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };
    }

    private static Button BuildSmallButton(string text, bool primary = false)
    {
        return new Button
        {
            Content = text,
            MinWidth = 76,
            Padding = new Thickness(8, 4),
            Background = primary ? Accent : BgCard,
            BorderBrush = primary ? AccentHot : InnerEdge,
            Foreground = primary ? AccentInk : FgText,
            FontSize = 12,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };
    }

    private static Grid BuildRow(string labelText, Control input)
    {
        var grid = new Grid { Margin = new Thickness(0, 1, 0, 1) };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(FieldLabelWidth) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

        var lbl = new TextBlock
        {
            Text = labelText,
            Foreground = FgText,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 8, 0),
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
        };

        Grid.SetColumn(lbl, 0);
        Grid.SetColumn(input, 1);
        grid.Children.Add(lbl);
        grid.Children.Add(input);
        return grid;
    }

    private static Grid BuildConnectionFieldsGrid(
        TextBox txtName,
        TextBox txtServer,
        ComboBox cboProtocol,
        TextBox txtPort,
        TextBox txtSectors)
    {
        var grid = new Grid
        {
            Margin = new Thickness(0, 1, 0, 1),
            RowSpacing = 7,
        };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(FieldLabelWidth) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        for (int i = 0; i < 4; i++)
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

        AddConnectionField(grid, 0, "Game name:", txtName, spanInput: true);
        AddConnectionField(grid, 1, "Server:", txtServer, spanInput: true);
        AddConnectionField(grid, 2, "Protocol:", cboProtocol);
        AddSecondaryConnectionField(grid, 2, "Port:", txtPort);
        AddConnectionField(grid, 3, "Sectors:", txtSectors);
        return grid;
    }

    private static void AddConnectionField(Grid grid, int row, string labelText, Control input, bool spanInput = false)
    {
        var label = new TextBlock
        {
            Text = labelText,
            Foreground = FgText,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 8, 0),
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
        };

        input.HorizontalAlignment = HorizontalAlignment.Left;
        Grid.SetRow(label, row);
        Grid.SetColumn(label, 0);
        Grid.SetRow(input, row);
        Grid.SetColumn(input, 1);
        if (spanInput)
            Grid.SetColumnSpan(input, 3);
        grid.Children.Add(label);
        grid.Children.Add(input);
    }

    private static void AddSecondaryConnectionField(Grid grid, int row, string labelText, Control input)
    {
        var label = new TextBlock
        {
            Text = labelText,
            Foreground = FgText,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(18, 0, 6, 0),
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
        };

        input.HorizontalAlignment = HorizontalAlignment.Left;
        Grid.SetRow(label, row);
        Grid.SetColumn(label, 2);
        Grid.SetRow(input, row);
        Grid.SetColumn(input, 3);
        grid.Children.Add(label);
        grid.Children.Add(input);
    }

    private static void AddInlineLabel(Grid grid, int row, int column, string text)
    {
        var label = new TextBlock
        {
            Text = text,
            Foreground = FgText,
            VerticalAlignment = VerticalAlignment.Center,
            FontSize = 13,
            FontWeight = FontWeight.SemiBold,
        };
        Grid.SetRow(label, row);
        Grid.SetColumn(label, column);
        grid.Children.Add(label);
    }

    private static void AddInlineControl(Grid grid, int row, int column, Control control)
    {
        Grid.SetRow(control, row);
        Grid.SetColumn(control, column);
        grid.Children.Add(control);
    }

    private static void AddHeaderText(Grid grid, int column, string text, IBrush foreground, FontWeight weight)
    {
        var block = new TextBlock
        {
            Text = text,
            Foreground = foreground,
            FontWeight = weight,
            FontSize = 13,
            TextTrimming = TextTrimming.CharacterEllipsis,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(block, column);
        grid.Children.Add(block);
    }

    private static void AddGameHeader(Grid grid, int column, string text)
    {
        AddGameText(
            grid,
            column,
            text,
            TableHeaderText,
            FontWeight.SemiBold,
            column == 0 ? HorizontalAlignment.Left : HorizontalAlignment.Center);
    }

    private static void AddGameText(
        Grid grid,
        int column,
        string text,
        IBrush foreground,
        FontWeight weight,
        HorizontalAlignment alignment = HorizontalAlignment.Center)
    {
        var block = new TextBlock
        {
            Text = text,
            Foreground = foreground,
            FontWeight = weight,
            FontSize = 12,
            TextTrimming = TextTrimming.CharacterEllipsis,
            HorizontalAlignment = alignment,
            TextAlignment = alignment == HorizontalAlignment.Left ? TextAlignment.Left : TextAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(block, column);
        grid.Children.Add(block);
    }

    private static void AddWarningLabel(StackPanel panel, string label, TwcrawlQuality quality)
    {
        if (quality is not (TwcrawlQuality.Warn or TwcrawlQuality.Bad))
            return;

        panel.Children.Add(new Border
        {
            Background = quality == TwcrawlQuality.Bad
                ? new SolidColorBrush(Color.FromRgb(74, 12, 18))
                : new SolidColorBrush(Color.FromRgb(70, 58, 8)),
            BorderBrush = quality == TwcrawlQuality.Bad ? BadText : WarnText,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(4, 0),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Child = new TextBlock
            {
                Text = label,
                Foreground = quality == TwcrawlQuality.Bad ? BadText : WarnText,
                FontSize = 9,
                FontWeight = FontWeight.Bold,
                LineHeight = 10,
                VerticalAlignment = VerticalAlignment.Center,
            },
        });
    }

    private static string EmptyDash(string value)
        => string.IsNullOrWhiteSpace(value) ? "-" : value;

    private static void WireDialogClipboard(TextBox textBox)
    {
        textBox.KeyDown += async (_, e) =>
        {
            if (!e.KeyModifiers.HasFlag(KeyModifiers.Control))
                return;

            switch (e.Key)
            {
                case Key.A:
                {
                    string current = textBox.Text ?? string.Empty;
                    textBox.SelectionStart = 0;
                    textBox.SelectionEnd = current.Length;
                    textBox.CaretIndex = current.Length;
                    e.Handled = true;
                    break;
                }

                case Key.C:
                {
                    string selected = textBox.SelectedText ?? string.Empty;
                    if (selected.Length > 0)
                        await ClipboardHelper.TrySetTextAsync(textBox, selected);
                    e.Handled = true;
                    break;
                }

                case Key.X:
                {
                    string selected = textBox.SelectedText ?? string.Empty;
                    if (selected.Length > 0)
                    {
                        if (await ClipboardHelper.TrySetTextAsync(textBox, selected))
                            ReplaceSelection(textBox, string.Empty);
                    }
                    e.Handled = true;
                    break;
                }

                case Key.V:
                {
                    var clipboard = TopLevel.GetTopLevel(textBox)?.Clipboard;
                    if (clipboard != null)
                    {
                        string? pasted = await ClipboardExtensions.TryGetTextAsync(clipboard);
                        if (!string.IsNullOrEmpty(pasted))
                            ReplaceSelection(textBox, pasted);
                    }
                    e.Handled = true;
                    break;
                }
            }
        };
    }

    private static void ReplaceSelection(TextBox textBox, string replacement)
    {
        string current = textBox.Text ?? string.Empty;
        int start = Math.Min(textBox.SelectionStart, textBox.SelectionEnd);
        int end = Math.Max(textBox.SelectionStart, textBox.SelectionEnd);
        start = Math.Clamp(start, 0, current.Length);
        end = Math.Clamp(end, 0, current.Length);

        string updated = current.Substring(0, start) + replacement + current.Substring(end);
        int caret = start + replacement.Length;
        textBox.Text = updated;
        textBox.SelectionStart = caret;
        textBox.SelectionEnd = caret;
        textBox.CaretIndex = caret;
    }
}
