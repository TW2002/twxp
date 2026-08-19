using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Platform.Storage;

namespace MTC;

internal sealed class ProxyManagementWindow : Window
{
    private static readonly IBrush BgWin = new SolidColorBrush(Color.FromRgb(8, 14, 20));
    private static readonly IBrush BgPanel = new SolidColorBrush(Color.FromRgb(14, 33, 42));
    private static readonly IBrush BgInput = new SolidColorBrush(Color.FromRgb(7, 28, 36));
    private static readonly IBrush Edge = new SolidColorBrush(Color.FromRgb(57, 112, 128));
    private static readonly IBrush FgText = new SolidColorBrush(Color.FromRgb(222, 238, 242));
    private static readonly IBrush FgMuted = new SolidColorBrush(Color.FromRgb(142, 195, 205));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(0, 212, 201));

    private readonly AppPreferences _preferences;
    private readonly Action _savePreferences;
    private readonly ListBox _serversList = new();
    private readonly ListBox _gamesList = new();
    private readonly TextBlock _status = new();
    private readonly TextBox _nameBox = BuildTextBox();
    private readonly TextBox _hostBox = BuildTextBox("127.0.0.1");
    private readonly TextBox _portBox = BuildTextBox("2099");
    private readonly TextBox _tokenBox = BuildTextBox();
    private readonly TextBox _gameNameBox = BuildTextBox("game");
    private readonly TextBox _gameHostBox = BuildTextBox("localhost");
    private readonly TextBox _gamePortBox = BuildTextBox("23");
    private readonly TextBox _gameListenPortBox = BuildTextBox("2023");
    private readonly TextBox _gameSectorsBox = BuildTextBox(ConnectionProfile.DefaultSectors.ToString());
    private IReadOnlyList<ProxyManagedGame> _games = [];

    public ProxyManagementWindow(AppPreferences preferences, Action savePreferences)
    {
        _preferences = preferences;
        _savePreferences = savePreferences;
        Title = "Manage Proxy Server";
        Width = 980;
        Height = 680;
        MinWidth = 820;
        MinHeight = 560;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        Background = BgWin;

        _serversList.MinWidth = 260;
        _serversList.SelectionChanged += (_, _) => LoadSelectedServer();
        _gamesList.MinHeight = 260;

        _status.Foreground = FgMuted;
        _status.TextWrapping = TextWrapping.Wrap;

        Content = new Border
        {
            Padding = new Thickness(14),
            Child = BuildLayout(),
        };

        RefreshServers();
        if (_preferences.ProxyServers.Count > 0)
            _serversList.SelectedIndex = 0;
    }

    private Control BuildLayout()
    {
        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("300,*"),
            ColumnSpacing = 12,
        };

        Control servers = BuildServersPanel();
        Grid.SetColumn(servers, 0);
        grid.Children.Add(servers);
        Control games = BuildGamesPanel();
        Grid.SetColumn(games, 1);
        grid.Children.Add(games);
        return grid;
    }

    private Control BuildServersPanel()
    {
        var addButton = BuildButton("Add", false);
        addButton.Click += (_, _) =>
        {
            var server = new AppPreferences.ProxyServerPreference
            {
                Name = "Proxy Server",
                Host = "127.0.0.1",
                ManagementPort = 2099,
            };
            _preferences.ProxyServers.Add(server);
            _savePreferences();
            RefreshServers();
            _serversList.SelectedItem = server;
        };

        var removeButton = BuildButton("Remove", false);
        removeButton.Click += (_, _) =>
        {
            if (_serversList.SelectedItem is not AppPreferences.ProxyServerPreference server)
                return;
            _preferences.ProxyServers.Remove(server);
            _savePreferences();
            RefreshServers();
            SetStatus("Proxy server removed.");
        };

        var saveButton = BuildButton("Save", true);
        saveButton.Click += (_, _) => SaveSelectedServer();

        var testButton = BuildButton("Test", false);
        testButton.Click += async (_, _) => await TestSelectedServerAsync();

        return BuildSection("Servers",
            _serversList,
            BuildRow("Name", _nameBox),
            BuildRow("Host", _hostBox),
            BuildRow("Mgmt port", _portBox),
            BuildRow("Token", _tokenBox),
            new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Spacing = 8,
                HorizontalAlignment = HorizontalAlignment.Right,
                Children = { addButton, removeButton, testButton, saveButton },
            },
            _status);
    }

    private Control BuildGamesPanel()
    {
        var refreshButton = BuildButton("Refresh", false);
        refreshButton.Click += async (_, _) => await RefreshGamesAsync();
        var startButton = BuildButton("Start", true);
        startButton.Click += async (_, _) => await StartSelectedGameAsync();
        var stopButton = BuildButton("Stop", false);
        stopButton.Click += async (_, _) => await StopSelectedGameAsync();
        var deleteButton = BuildButton("Delete", false);
        deleteButton.Click += async (_, _) => await DeleteSelectedGameAsync();
        var uploadScriptButton = BuildButton("Upload Script", false);
        uploadScriptButton.Click += async (_, _) => await UploadFileAsync(scriptFile: true);
        var uploadConfigButton = BuildButton("Upload Config", false);
        uploadConfigButton.Click += async (_, _) => await UploadFileAsync(scriptFile: false);
        var createButton = BuildButton("Create Game", true);
        createButton.Click += async (_, _) => await CreateGameAsync();

        return BuildSection("Games",
            new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Spacing = 8,
                HorizontalAlignment = HorizontalAlignment.Right,
                Children = { refreshButton, startButton, stopButton, deleteButton, uploadScriptButton, uploadConfigButton },
            },
            _gamesList,
            BuildSection("Create",
                BuildRow("Name", _gameNameBox),
                BuildRow("Host", _gameHostBox),
                BuildRow("Server port", _gamePortBox),
                BuildRow("Proxy port", _gameListenPortBox),
                BuildRow("Sectors", _gameSectorsBox),
                new StackPanel
                {
                    HorizontalAlignment = HorizontalAlignment.Right,
                    Children = { createButton },
                }));
    }

    private void RefreshServers()
    {
        _serversList.ItemsSource = null;
        _serversList.ItemsSource = _preferences.ProxyServers;
    }

    private void LoadSelectedServer()
    {
        if (_serversList.SelectedItem is not AppPreferences.ProxyServerPreference server)
            return;

        _nameBox.Text = server.Name;
        _hostBox.Text = server.Host;
        _portBox.Text = AppPreferences.NormalizeTcpPort(server.ManagementPort, 2099).ToString();
        _tokenBox.Text = server.SecurityToken;
        _gamesList.ItemsSource = null;
        _games = [];
    }

    private void SaveSelectedServer()
    {
        if (_serversList.SelectedItem is not AppPreferences.ProxyServerPreference server)
            return;

        server.Name = _nameBox.Text?.Trim() ?? string.Empty;
        server.Host = string.IsNullOrWhiteSpace(_hostBox.Text) ? "127.0.0.1" : _hostBox.Text.Trim();
        server.ManagementPort = int.TryParse(_portBox.Text?.Trim(), out int port)
            ? AppPreferences.NormalizeTcpPort(port, 2099)
            : 2099;
        server.SecurityToken = _tokenBox.Text?.Trim() ?? string.Empty;
        _savePreferences();
        RefreshServers();
        _serversList.SelectedItem = server;
        SetStatus("Proxy server saved.");
    }

    private async Task TestSelectedServerAsync()
    {
        SaveSelectedServer();
        if (!TryGetClient(out ProxyManagementClient? client))
            return;

        try
        {
            await client!.PingAsync();
            SetStatus("Management connection OK.");
        }
        catch (Exception ex)
        {
            SetStatus($"Connection failed: {ex.Message}");
        }
    }

    private async Task RefreshGamesAsync()
    {
        SaveSelectedServer();
        if (!TryGetClient(out ProxyManagementClient? client))
            return;

        try
        {
            _games = await client!.ListGamesAsync();
            _gamesList.ItemsSource = _games.Select(game => game.Display).ToArray();
            SetStatus($"Loaded {_games.Count} game(s).");
        }
        catch (Exception ex)
        {
            SetStatus($"Refresh failed: {ex.Message}");
        }
    }

    private async Task StartSelectedGameAsync()
    {
        ProxyManagedGame? game = SelectedGame();
        if (game == null || !TryGetClient(out ProxyManagementClient? client))
            return;

        try
        {
            await client!.StartGameAsync(game.Id);
            await RefreshGamesAsync();
            SetStatus($"Started {game.Name}.");
        }
        catch (Exception ex)
        {
            SetStatus($"Start failed: {ex.Message}");
        }
    }

    private async Task StopSelectedGameAsync()
    {
        ProxyManagedGame? game = SelectedGame();
        if (game == null || !TryGetClient(out ProxyManagementClient? client))
            return;

        try
        {
            await client!.StopGameAsync(game.Id);
            await RefreshGamesAsync();
            SetStatus($"Stopped {game.Name}.");
        }
        catch (Exception ex)
        {
            SetStatus($"Stop failed: {ex.Message}");
        }
    }

    private async Task DeleteSelectedGameAsync()
    {
        ProxyManagedGame? game = SelectedGame();
        if (game == null || !TryGetClient(out ProxyManagementClient? client))
            return;

        try
        {
            await client!.DeleteGameAsync(game.Id);
            await RefreshGamesAsync();
            SetStatus($"Deleted {game.Name}.");
        }
        catch (Exception ex)
        {
            SetStatus($"Delete failed: {ex.Message}");
        }
    }

    private async Task CreateGameAsync()
    {
        if (!TryGetClient(out ProxyManagementClient? client))
            return;

        if (!int.TryParse(_gamePortBox.Text?.Trim(), out int serverPort) ||
            !int.TryParse(_gameListenPortBox.Text?.Trim(), out int listenPort) ||
            !int.TryParse(_gameSectorsBox.Text?.Trim(), out int sectors))
        {
            SetStatus("Enter valid numeric ports and sector count.");
            return;
        }

        if (!GameSizeLimits.IsValidSectorCount(sectors))
        {
            SetStatus($"Enter a sector count from {GameSizeLimits.RangeDisplay}.");
            return;
        }

        var request = new ProxyManagedGameCreateRequest
        {
            Name = _gameNameBox.Text?.Trim() ?? string.Empty,
            Host = string.IsNullOrWhiteSpace(_gameHostBox.Text) ? "localhost" : _gameHostBox.Text.Trim(),
            Port = serverPort,
            ListenPort = listenPort,
            Sectors = sectors,
        };
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            SetStatus("Enter a game name.");
            return;
        }

        try
        {
            await client!.CreateGameAsync(request);
            await RefreshGamesAsync();
            SetStatus($"Created {request.Name}.");
        }
        catch (Exception ex)
        {
            SetStatus($"Create failed: {ex.Message}");
        }
    }

    private async Task UploadFileAsync(bool scriptFile)
    {
        if (!TryGetClient(out ProxyManagementClient? client))
            return;

        IStorageProvider? storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null)
            return;

        var files = await storage.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title = scriptFile ? "Upload Script" : "Upload Config",
            AllowMultiple = false,
            FileTypeFilter =
            [
                new FilePickerFileType(scriptFile ? "Scripts" : "Config Files")
                {
                    Patterns = scriptFile ? ["*.ts", "*.cts", "*.py"] : ["*.txt", "*.cfg", "*.twx", "*.json"],
                },
                new FilePickerFileType("All Files") { Patterns = ["*"] },
            ],
        });
        if (files.Count == 0)
            return;

        string localPath = files[0].Path.LocalPath;
        string remotePath = Path.GetFileName(localPath);
        byte[] content = await File.ReadAllBytesAsync(localPath);

        try
        {
            if (scriptFile)
                await client!.UploadScriptAsync(remotePath, content);
            else
                await client!.UploadConfigAsync(remotePath, content);
            SetStatus($"Uploaded {remotePath}.");
        }
        catch (Exception ex)
        {
            SetStatus($"Upload failed: {ex.Message}");
        }
    }

    private bool TryGetClient(out ProxyManagementClient? client)
    {
        client = null;
        if (_serversList.SelectedItem is not AppPreferences.ProxyServerPreference server)
        {
            SetStatus("Select a proxy server.");
            return false;
        }

        client = new ProxyManagementClient(server);
        return true;
    }

    private ProxyManagedGame? SelectedGame()
    {
        int index = _gamesList.SelectedIndex;
        if (index < 0 || index >= _games.Count)
        {
            SetStatus("Select a game.");
            return null;
        }

        return _games[index];
    }

    private void SetStatus(string text)
        => _status.Text = text;

    private static Border BuildSection(string title, params Control[] children)
    {
        var stack = new StackPanel { Spacing = 8 };
        stack.Children.Add(new TextBlock
        {
            Text = title,
            Foreground = Accent,
            FontWeight = FontWeight.Bold,
            FontSize = 16,
        });
        foreach (Control child in children)
            stack.Children.Add(child);

        return new Border
        {
            Background = BgPanel,
            BorderBrush = Edge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(12),
            Child = stack,
        };
    }

    private static Grid BuildRow(string label, Control input)
    {
        var grid = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("92,*"),
            ColumnSpacing = 8,
        };
        var text = new TextBlock
        {
            Text = label,
            Foreground = FgMuted,
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(input, 1);
        grid.Children.Add(text);
        grid.Children.Add(input);
        return grid;
    }

    private static TextBox BuildTextBox(string text = "")
        => new()
        {
            Text = text,
            MinHeight = 30,
            Background = BgInput,
            Foreground = FgText,
            BorderBrush = Edge,
        };

    private static Button BuildButton(string text, bool primary)
        => new()
        {
            Content = text,
            MinHeight = 30,
            Padding = new Thickness(12, 4),
            Background = primary ? Accent : BgInput,
            Foreground = primary ? Brushes.Black : FgText,
            BorderBrush = Edge,
        };
}
