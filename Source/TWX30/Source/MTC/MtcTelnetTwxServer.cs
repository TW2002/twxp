using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core = TWXProxy.Core;

namespace MTC;

internal sealed class MtcTelnetTwxServer : Core.ITWXServer
{
    private readonly TelnetClient _telnet;
    private readonly Action<string> _localOutput;
    private readonly Func<bool> _isConnected;
    private readonly Func<Task> _connectToServerAsync;
    private readonly Func<Task> _disconnectFromServerAsync;
    private readonly Func<byte[], Task>? _sendToServerAsync;
    private readonly List<(string Search, string Replace)> _quickTexts = new();
    private readonly Dictionary<string, Core.BotConfig> _botConfigs = new(StringComparer.OrdinalIgnoreCase);
    private Core.ClientType _clientType = Core.ClientType.Standard;

    public MtcTelnetTwxServer(
        TelnetClient telnet,
        Action<string> localOutput,
        Func<bool>? isConnected = null,
        Func<Task>? connectToServerAsync = null,
        Func<Task>? disconnectFromServerAsync = null,
        Func<byte[], Task>? sendToServerAsync = null)
    {
        _telnet = telnet;
        _localOutput = localOutput;
        _isConnected = isConnected ?? (() => _telnet.IsConnected);
        _connectToServerAsync = connectToServerAsync ?? (() => Task.CompletedTask);
        _disconnectFromServerAsync = disconnectFromServerAsync ?? (() =>
        {
            _telnet.Disconnect();
            return Task.CompletedTask;
        });
        _sendToServerAsync = sendToServerAsync;
    }

    public bool AllowLerkers { get; set; } = true;
    public bool AcceptExternal { get; set; } = true;
    public string ExternalAddress { get; set; } = string.Empty;
    public bool BroadCastMsgs { get; set; } = true;
    public bool LocalEcho { get; set; } = true;
    public bool IsConnected => _isConnected();
    public int ClientCount => 1;
    public string ActiveBotName { get; set; } = string.Empty;

    public void Broadcast(string message) => Broadcast(message, broadcastDeaf: false);

    public void Broadcast(string message, bool broadcastDeaf)
    {
        if (_clientType == Core.ClientType.Deaf && !broadcastDeaf)
            return;

        _localOutput(ApplyQuickText(message ?? string.Empty));
    }

    public void BroadcastLiteral(string message) => BroadcastLiteral(message, broadcastDeaf: false);

    public void BroadcastLiteral(string message, bool broadcastDeaf)
    {
        if (_clientType == Core.ClientType.Deaf && !broadcastDeaf)
            return;

        _localOutput(message ?? string.Empty);
    }

    public void ClientMessage(string message) => _localOutput(message ?? string.Empty);

    public Task ConnectToServerAsync() => _connectToServerAsync();

    public Task DisconnectFromServerAsync() => _disconnectFromServerAsync();

    public Task SendToServerAsync(byte[] data)
    {
        if (data.Length == 0)
            return Task.CompletedTask;

        if (_sendToServerAsync != null)
            return _sendToServerAsync(data);

        if (_telnet.IsConnected)
            _telnet.SendRaw(data);

        return Task.CompletedTask;
    }

    public void AddQuickText(string key, string value)
    {
        if (string.IsNullOrEmpty(key))
            return;

        _quickTexts.RemoveAll(item => string.Equals(item.Search, key, StringComparison.OrdinalIgnoreCase));
        _quickTexts.Add((key, value ?? string.Empty));
    }

    public void ClearQuickText(string? key = null)
    {
        if (string.IsNullOrEmpty(key))
        {
            _quickTexts.Clear();
            return;
        }

        _quickTexts.RemoveAll(item => string.Equals(item.Search, key, StringComparison.OrdinalIgnoreCase));
    }

    public Core.ClientType GetClientType(int index)
        => index == 0 ? _clientType : Core.ClientType.Rejected;

    public void SetClientType(int index, Core.ClientType type)
    {
        if (index == 0)
            _clientType = type;
    }

    public void RegisterBot(string botName, string scriptFile, string description = "")
    {
        if (string.IsNullOrWhiteSpace(botName))
            return;

        RegisterOrUpdateBotConfig(new Core.BotConfig
        {
            Alias = botName.Trim(),
            Name = botName.Trim(),
            ScriptFile = scriptFile ?? string.Empty,
            ScriptFiles = string.IsNullOrWhiteSpace(scriptFile)
                ? new List<string>()
                : new List<string> { scriptFile },
            Description = description ?? string.Empty,
        });
    }

    public void RegisterOrUpdateBotConfig(Core.BotConfig config)
    {
        if (string.IsNullOrWhiteSpace(config.Name))
            return;

        _botConfigs[config.Name.Trim()] = config;
        if (!string.IsNullOrWhiteSpace(config.Alias))
            _botConfigs[config.Alias.Trim()] = config;
    }

    public void UnregisterBot(string botName)
    {
        if (string.IsNullOrWhiteSpace(botName))
            return;

        _botConfigs.Remove(botName.Trim());
    }

    public List<string> GetBotList()
        => _botConfigs.Values
            .Select(bot => bot.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    public Core.BotConfig? GetBotConfig(string botName)
    {
        if (string.IsNullOrWhiteSpace(botName))
            return null;

        return _botConfigs.TryGetValue(botName.Trim(), out Core.BotConfig? config)
            ? config
            : null;
    }

    public object? GetActiveBot() => null;

    private string ApplyQuickText(string message)
    {
        if (_quickTexts.Count == 0 || string.IsNullOrEmpty(message))
            return message;

        string result = message;
        foreach ((string search, string replace) in _quickTexts)
            result = result.Replace(search, replace, StringComparison.OrdinalIgnoreCase);

        return result;
    }
}
