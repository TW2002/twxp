using System.Net.Sockets;
using System.Text;
using System.Text.Json;

namespace MTC;

internal sealed class ProxyManagementClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly AppPreferences.ProxyServerPreference _server;

    public ProxyManagementClient(AppPreferences.ProxyServerPreference server)
    {
        _server = server;
    }

    public Task<ProxyManagementResponse> PingAsync(CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "ping",
        }, cancellationToken);

    public async Task<IReadOnlyList<ProxyManagedGame>> ListGamesAsync(CancellationToken cancellationToken = default)
    {
        ProxyManagementResponse response = await SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "listGames",
        }, cancellationToken);
        return response.Result.Deserialize<List<ProxyManagedGame>>(JsonOptions) ?? [];
    }

    public async Task<IReadOnlyList<ProxyManagedScript>> ListScriptsAsync(string? gameId, CancellationToken cancellationToken = default)
    {
        ProxyManagementResponse response = await SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "listScripts",
            ["gameId"] = gameId ?? string.Empty,
        }, cancellationToken);
        return response.Result.Deserialize<List<ProxyManagedScript>>(JsonOptions) ?? [];
    }

    public async Task<IReadOnlyList<ProxyManagedBotConfig>> ListBotConfigsAsync(CancellationToken cancellationToken = default)
    {
        ProxyManagementResponse response = await SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "listBotConfigs",
        }, cancellationToken);
        return response.Result.Deserialize<List<ProxyManagedBotConfig>>(JsonOptions) ?? [];
    }

    public Task<ProxyManagementResponse> StartGameAsync(string gameId, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "startGame",
            ["gameId"] = gameId,
        }, cancellationToken);

    public Task<ProxyManagementResponse> StopGameAsync(string gameId, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "stopGame",
            ["gameId"] = gameId,
        }, cancellationToken);

    public Task<ProxyManagementResponse> DeleteGameAsync(string gameId, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "deleteGame",
            ["gameId"] = gameId,
        }, cancellationToken);

    public Task<ProxyManagementResponse> CreateGameAsync(ProxyManagedGameCreateRequest game, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "createGame",
            ["game"] = game,
        }, cancellationToken);

    public Task<ProxyManagementResponse> RunScriptAsync(string gameId, string path, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "runScript",
            ["gameId"] = gameId,
            ["path"] = path,
        }, cancellationToken);

    public Task<ProxyManagementResponse> StopScriptAsync(string gameId, int scriptId, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "stopScript",
            ["gameId"] = gameId,
            ["scriptId"] = scriptId,
        }, cancellationToken);

    public Task<ProxyManagementResponse> SendBotCommandAsync(string gameId, string botName, CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "switchBot",
            ["gameId"] = gameId,
            ["botName"] = botName,
        }, cancellationToken);

    public Task<ProxyManagementResponse> SaveBotConfigAsync(
        string gameId,
        ProxyManagedBotConfig bot,
        CancellationToken cancellationToken = default)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = "saveBotConfig",
            ["gameId"] = gameId,
            ["bot"] = bot,
        }, cancellationToken);

    public async Task<ProxyManagementResponse> UploadScriptAsync(string relativePath, byte[] content, CancellationToken cancellationToken = default)
        => await UploadFileAsync("uploadScript", relativePath, content, cancellationToken);

    public async Task<ProxyManagementResponse> UploadConfigAsync(string relativePath, byte[] content, CancellationToken cancellationToken = default)
        => await UploadFileAsync("uploadConfig", relativePath, content, cancellationToken);

    private Task<ProxyManagementResponse> UploadFileAsync(
        string action,
        string relativePath,
        byte[] content,
        CancellationToken cancellationToken)
        => SendAsync(new Dictionary<string, object?>
        {
            ["action"] = action,
            ["path"] = relativePath,
            ["contentBase64"] = Convert.ToBase64String(content),
        }, cancellationToken);

    private async Task<ProxyManagementResponse> SendAsync(
        Dictionary<string, object?> request,
        CancellationToken cancellationToken)
    {
        request["token"] = _server.SecurityToken ?? string.Empty;
        using var client = new TcpClient();
        await client.ConnectAsync(_server.Host, AppPreferences.NormalizeTcpPort(_server.ManagementPort, 2099), cancellationToken);
        await using NetworkStream stream = client.GetStream();
        await using var writer = new StreamWriter(stream, new UTF8Encoding(false), leaveOpen: true)
        {
            AutoFlush = true,
            NewLine = "\n",
        };
        using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);

        string json = JsonSerializer.Serialize(request, JsonOptions);
        await writer.WriteLineAsync(json.AsMemory(), cancellationToken);
        string? responseLine = await reader.ReadLineAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(responseLine))
            throw new InvalidOperationException("Proxy management server returned an empty response.");

        ProxyManagementResponse? response = JsonSerializer.Deserialize<ProxyManagementResponse>(responseLine, JsonOptions);
        if (response == null)
            throw new InvalidOperationException("Proxy management server returned an invalid response.");
        if (!response.Ok)
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(response.Error) ? "Proxy management command failed." : response.Error);
        return response;
    }
}

internal sealed class ProxyManagementResponse
{
    public bool Ok { get; set; }
    public string Action { get; set; } = string.Empty;
    public JsonElement Result { get; set; }
    public string? Error { get; set; }
}

internal sealed class ProxyManagedGame
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public int ListenPort { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ScriptDirectory { get; set; }

    public string Display => $"{Name}  :{ListenPort}  {Status}";
}

internal sealed class ProxyManagedScript
{
    public string Path { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime ModifiedUtc { get; set; }
}

internal sealed class ProxyManagedBotConfig
{
    public string SectionName { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Script { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool AutoStart { get; set; }
    public string NameVar { get; set; } = string.Empty;
    public string CommsVar { get; set; } = string.Empty;
    public string LoginScript { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
}

internal sealed class ProxyManagedGameCreateRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 23;
    public int ListenPort { get; set; } = 2023;
    public int Sectors { get; set; } = ConnectionProfile.DefaultSectors;
    public char CommandChar { get; set; } = '$';
}
