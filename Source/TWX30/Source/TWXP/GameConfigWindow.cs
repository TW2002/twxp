using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Platform.Storage;

namespace TWXP;

internal sealed class GameConfigWindow : Window
{
    private readonly GameConfig _baseConfig;
    private readonly bool _isNew;

    private readonly TextBox _nameBox;
    private readonly TextBox _hostBox;
    private readonly TextBox _portBox;
    private readonly TextBox _listenPortBox;
    private readonly TextBox _commandKeyBox;
    private readonly TextBox _sectorsBox;
    private readonly TextBox _scriptDirectoryBox;
    private readonly CheckBox _autoConnectCheck;
    private readonly CheckBox _autoReconnectCheck;
    private readonly TextBox _reconnectDelayBox;
    private readonly CheckBox _nativeHaggleCheck;
    private readonly CheckBox _useCacheCheck;
    private readonly CheckBox _localEchoCheck;
    private readonly TextBox _bubbleSizeBox;
    private readonly CheckBox _useLoginCheck;
    private readonly CheckBox _useRLoginCheck;
    private readonly TextBox _loginScriptBox;
    private readonly TextBox _loginNameBox;
    private readonly TextBox _passwordBox;
    private readonly TextBox _gameLetterBox;
    private readonly StackPanel _loginDetailsPanel;
    private readonly CheckBox _logEnabledCheck;
    private readonly CheckBox _logAnsiCheck;
    private readonly CheckBox _logAnsiCompanionCheck;
    private readonly CheckBox _logBinaryCheck;
    private readonly CheckBox _notifyPlayCutsCheck;
    private readonly TextBox _maxPlayDelayBox;
    private readonly CheckBox _acceptExternalCheck;
    private readonly CheckBox _allowLerkersCheck;
    private readonly CheckBox _broadcastMessagesCheck;
    private readonly CheckBox _streamingModeCheck;
    private readonly TextBox _externalAddressBox;
    private readonly TextBox _lerkerAddressBox;

    public GameConfig? ResultConfig { get; private set; }
    public bool DeleteRequested { get; private set; }

    public GameConfigWindow(GameConfig config, bool isNew)
    {
        _baseConfig = GameConfigCloner.Clone(config);
        _isNew = isNew;

        Title = isNew ? "Add Game" : $"Edit Game - {config.Name}";
        Width = 620;
        Height = 860;
        MinWidth = 520;
        MinHeight = 620;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        _nameBox = CreateTextBox(config.Name, "Enter game name");
        _hostBox = CreateTextBox(config.Host, "localhost");
        _portBox = CreateTextBox(config.Port.ToString(), "23");
        _listenPortBox = CreateTextBox(config.ListenPort.ToString(), "2300");
        _commandKeyBox = CreateTextBox(config.CommandChar.ToString(), "$");
        _sectorsBox = CreateTextBox(config.Sectors.ToString(), "1000");
        _scriptDirectoryBox = CreateTextBox(config.ScriptDirectory ?? string.Empty, "scripts");
        _autoConnectCheck = CreateCheckBox(config.AutoConnect, "Auto-connect on startup");
        _autoReconnectCheck = CreateCheckBox(config.AutoReconnect, "Auto-reconnect to the server");
        _reconnectDelayBox = CreateTextBox(config.ReconnectDelaySeconds.ToString(), "5");
        _nativeHaggleCheck = CreateCheckBox(config.NativeHaggleEnabled, "Enable native haggle by default");
        _useCacheCheck = CreateCheckBox(config.UseCache, "Use database cache");
        _localEchoCheck = CreateCheckBox(config.LocalEcho, "Enable local echo");
        _bubbleSizeBox = CreateTextBox(config.BubbleSize.ToString(), TWXProxy.Core.ModBubble.DefaultMaxBubbleSize.ToString());
        _useLoginCheck = CreateCheckBox(config.UseLogin, "Run login script after connect");
        _useRLoginCheck = CreateCheckBox(config.UseRLogin, "Use RLogin handshake");
        _loginScriptBox = CreateTextBox(config.LoginScript, "0_Login.cts");
        _loginNameBox = CreateTextBox(config.LoginName, "Trader name");
        _passwordBox = CreateTextBox(config.Password, "Password");
        _gameLetterBox = CreateTextBox(config.GameLetter, "A");
        _logEnabledCheck = CreateCheckBox(config.LogEnabled, "Enable session logging");
        _logAnsiCheck = CreateCheckBox(config.LogAnsi, "Store ANSI in logs");
        _logAnsiCompanionCheck = CreateCheckBox(config.LogAnsiCompanion, "Write ANSI companion log");
        _logBinaryCheck = CreateCheckBox(config.LogBinary, "Write binary capture files");
        _notifyPlayCutsCheck = CreateCheckBox(config.NotifyPlayCuts, "Notify when playback is shortened");
        _maxPlayDelayBox = CreateTextBox(config.MaxPlayDelay.ToString(), "10000");
        _acceptExternalCheck = CreateCheckBox(config.AcceptExternal, "Accept external connections");
        _allowLerkersCheck = CreateCheckBox(config.AllowLerkers, "Allow lerkers");
        _broadcastMessagesCheck = CreateCheckBox(config.BroadcastMessages, "Broadcast proxy messages");
        _streamingModeCheck = CreateCheckBox(config.StreamingMode, "Streaming mode");
        _externalAddressBox = CreateTextBox(config.ExternalAddress, "Optional external address");
        _lerkerAddressBox = CreateTextBox(config.LerkerAddress, "Optional lerker address");

        _loginDetailsPanel = new StackPanel
        {
            Spacing = 10,
            IsVisible = config.UseLogin || config.UseRLogin,
            Children =
            {
                BuildField("Login Script", _loginScriptBox),
                BuildField("Username", _loginNameBox),
                BuildField("Password", _passwordBox),
                BuildField("Game Letter", _gameLetterBox),
            },
        };

        _useLoginCheck.IsCheckedChanged += (_, _) => UpdateLoginDetailsVisibility();
        _useRLoginCheck.IsCheckedChanged += (_, _) => UpdateLoginDetailsVisibility();

        var browseScriptButton = new Button { Content = "Browse…" };
        browseScriptButton.Click += async (_, _) => await BrowseScriptDirectoryAsync();

        var scriptRow = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto),
            },
            ColumnSpacing = 8,
        };
        Grid.SetColumn(_scriptDirectoryBox, 0);
        Grid.SetColumn(browseScriptButton, 1);
        scriptRow.Children.Add(_scriptDirectoryBox);
        scriptRow.Children.Add(browseScriptButton);

        var saveButton = new Button { Content = "Save", MinWidth = 110 };
        saveButton.Click += async (_, _) => await SaveAsync();

        var cancelButton = new Button { Content = "Cancel", MinWidth = 110 };
        cancelButton.Click += (_, _) => Close(false);

        var buttonRow = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Spacing = 10,
            HorizontalAlignment = HorizontalAlignment.Left,
            Children = { saveButton, cancelButton },
        };

        if (!isNew)
        {
            var deleteButton = new Button { Content = "Delete Game", MinWidth = 130 };
            deleteButton.Click += async (_, _) => await DeleteAsync();
            buttonRow.Children.Add(deleteButton);
        }

        var contentPanel = new StackPanel
        {
            Margin = new Thickness(18),
            Spacing = 14,
            Children =
            {
                BuildField("Game Name", _nameBox),
                BuildSectionHeader("Game Settings"),
                BuildField("Host", _hostBox),
                BuildField("Port", _portBox),
                BuildField("Listen Port", _listenPortBox),
                BuildField("Proxy Menu Key", _commandKeyBox),
                BuildField("Sectors", _sectorsBox),
                BuildField("Script Directory (Global)", scriptRow, "Applies to all games in TWXP."),
                _autoConnectCheck,
                _autoReconnectCheck,
                BuildField("Reconnect Delay (seconds)", _reconnectDelayBox),
                _nativeHaggleCheck,
                _useCacheCheck,
                _localEchoCheck,
                BuildField("Bubble Size", _bubbleSizeBox),
                BuildSectionHeader("Login Automation"),
                _useLoginCheck,
                _useRLoginCheck,
                _loginDetailsPanel,
                BuildSectionHeader("Logging"),
                _logEnabledCheck,
                _logAnsiCheck,
                _logAnsiCompanionCheck,
                _logBinaryCheck,
                _notifyPlayCutsCheck,
                BuildField("Maximum Playback Delay (ms)", _maxPlayDelayBox),
                BuildSectionHeader("Proxy / External"),
                _acceptExternalCheck,
                _allowLerkersCheck,
                _broadcastMessagesCheck,
                _streamingModeCheck,
                BuildField("External Address", _externalAddressBox),
                BuildField("Lerker Address", _lerkerAddressBox),
                buttonRow,
            },
        };

        Content = new ScrollViewer
        {
            Content = contentPanel,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
        };
    }

    private async Task BrowseScriptDirectoryAsync()
    {
        IStorageProvider? storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null)
            return;

        string startPath = Directory.Exists(_scriptDirectoryBox.Text)
            ? _scriptDirectoryBox.Text!
            : Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        IStorageFolder? startFolder = await storage.TryGetFolderFromPathAsync(startPath);
        IReadOnlyList<IStorageFolder> folders = await storage.OpenFolderPickerAsync(new FolderPickerOpenOptions
        {
            Title = "Select Scripts Directory",
            SuggestedStartLocation = startFolder,
            AllowMultiple = false,
        });

        if (folders.Count > 0)
            _scriptDirectoryBox.Text = folders[0].Path.LocalPath;
    }

    private void UpdateLoginDetailsVisibility()
    {
        _loginDetailsPanel.IsVisible = _useLoginCheck.IsChecked == true || _useRLoginCheck.IsChecked == true;
    }

    private async Task SaveAsync()
    {
        string name = (_nameBox.Text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            await DialogHelpers.ShowMessageAsync(this, "Save Game", "Game name is required.");
            return;
        }

        GameConfig next = GameConfigCloner.Clone(_baseConfig);
        next.Name = name;
        next.Host = NormalizeText(_hostBox.Text, "localhost");
        next.Port = ParseInt(_portBox.Text, 23, 1);
        next.ListenPort = ParseInt(_listenPortBox.Text, 2300, 1);
        next.CommandChar = NormalizeCommandChar(_commandKeyBox.Text);
        next.Sectors = ParseInt(_sectorsBox.Text, 1000, 1);
        next.ScriptDirectory = NormalizeOptionalText(_scriptDirectoryBox.Text);
        next.AutoConnect = _autoConnectCheck.IsChecked == true;
        next.AutoReconnect = _autoReconnectCheck.IsChecked == true;
        next.ReconnectDelaySeconds = ParseInt(_reconnectDelayBox.Text, 5, 1);
        next.NativeHaggleEnabled = _nativeHaggleCheck.IsChecked == true;
        next.UseCache = _useCacheCheck.IsChecked != false;
        next.LocalEcho = _localEchoCheck.IsChecked != false;
        next.BubbleSize = ParseInt(_bubbleSizeBox.Text, TWXProxy.Core.ModBubble.DefaultMaxBubbleSize, 1);
        next.UseLogin = _useLoginCheck.IsChecked == true;
        next.UseRLogin = _useRLoginCheck.IsChecked == true;
        next.LoginScript = NormalizeText(_loginScriptBox.Text, "0_Login.cts");
        next.LoginName = NormalizeOptionalText(_loginNameBox.Text) ?? string.Empty;
        next.Password = NormalizeOptionalText(_passwordBox.Text) ?? string.Empty;
        next.GameLetter = NormalizeGameLetter(_gameLetterBox.Text);
        next.LogEnabled = _logEnabledCheck.IsChecked != false;
        next.LogAnsi = _logAnsiCheck.IsChecked == true;
        next.LogAnsiCompanion = _logAnsiCompanionCheck.IsChecked == true;
        next.LogBinary = _logBinaryCheck.IsChecked == true;
        next.NotifyPlayCuts = _notifyPlayCutsCheck.IsChecked != false;
        next.MaxPlayDelay = ParseInt(_maxPlayDelayBox.Text, 10000, 1);
        next.AcceptExternal = _acceptExternalCheck.IsChecked != false;
        next.AllowLerkers = _allowLerkersCheck.IsChecked != false;
        next.BroadcastMessages = _broadcastMessagesCheck.IsChecked != false;
        next.StreamingMode = _streamingModeCheck.IsChecked == true;
        next.ExternalAddress = NormalizeOptionalText(_externalAddressBox.Text) ?? string.Empty;
        next.LerkerAddress = NormalizeOptionalText(_lerkerAddressBox.Text) ?? string.Empty;

        ResultConfig = next;
        Close(true);
    }

    private async Task DeleteAsync()
    {
        if (_isNew)
            return;

        bool confirmed = await DialogHelpers.ShowConfirmAsync(
            this,
            "Delete Game",
            $"Remove '{_baseConfig.Name}' and delete its game data file?",
            "Delete",
            "Cancel");

        if (!confirmed)
            return;

        DeleteRequested = true;
        ResultConfig = null;
        Close(true);
    }

    private static StackPanel BuildField(string label, Control control, string? helpText = null)
    {
        var panel = new StackPanel
        {
            Spacing = 6,
            Children =
            {
                new TextBlock { Text = label, FontWeight = FontWeight.SemiBold },
                control,
            },
        };

        if (!string.IsNullOrWhiteSpace(helpText))
        {
            panel.Children.Add(new TextBlock
            {
                Text = helpText,
                Opacity = 0.75,
                FontSize = 12,
                TextWrapping = TextWrapping.Wrap,
            });
        }

        return panel;
    }

    private static TextBlock BuildSectionHeader(string text)
    {
        return new TextBlock
        {
            Text = text,
            FontSize = 18,
            FontWeight = FontWeight.Bold,
            Margin = new Thickness(0, 10, 0, 0),
        };
    }

    private static TextBox CreateTextBox(string? value, string? watermark)
    {
        return new TextBox
        {
            Text = value ?? string.Empty,
            Watermark = watermark,
        };
    }

    private static CheckBox CreateCheckBox(bool value, string label)
    {
        return new CheckBox
        {
            IsChecked = value,
            Content = label,
        };
    }

    private static int ParseInt(string? text, int fallback, int minValue)
    {
        if (!int.TryParse(text, out int value))
            value = fallback;

        return Math.Max(minValue, value);
    }

    private static string NormalizeText(string? value, string fallback)
    {
        string trimmed = value?.Trim() ?? string.Empty;
        return string.IsNullOrWhiteSpace(trimmed) ? fallback : trimmed;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        string trimmed = value?.Trim() ?? string.Empty;
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static char NormalizeCommandChar(string? value)
    {
        string trimmed = value?.Trim() ?? string.Empty;
        return string.IsNullOrWhiteSpace(trimmed) ? '$' : trimmed[0];
    }

    private static string NormalizeGameLetter(string? value)
    {
        string trimmed = value?.Trim() ?? string.Empty;
        return string.IsNullOrWhiteSpace(trimmed)
            ? string.Empty
            : trimmed[..1].ToUpperInvariant();
    }
}
