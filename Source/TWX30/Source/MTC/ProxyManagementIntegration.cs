namespace MTC;

public partial class MainWindow
{
    private async Task OnManageProxyServerAsync()
    {
        var window = new ProxyManagementWindow(_appPrefs, () =>
        {
            _appPrefs.Save();
            RebuildScriptsMenu(force: true);
        });
        await window.ShowDialog(this);
        _appPrefs.Save();
        RebuildScriptsMenu(force: true);
    }

    private bool TryGetCurrentProxyManagementClient(out ProxyManagementClient? client)
        => TryGetProxyManagementClient(_state.RemoteProxyServerId, out client);

    private bool TryGetProxyManagementClient(string remoteProxyServerId, out ProxyManagementClient? client)
    {
        client = null;
        if (string.IsNullOrWhiteSpace(remoteProxyServerId))
            return false;

        AppPreferences.ProxyServerPreference? server = _appPrefs.ProxyServers.FirstOrDefault(candidate =>
            string.Equals(candidate.Id, remoteProxyServerId, StringComparison.OrdinalIgnoreCase));
        if (server == null)
            return false;

        client = new ProxyManagementClient(server);
        return true;
    }

    private bool IsManagedRemoteProxyGame()
        => IsManagedRemoteProxyGame(_state);

    private bool IsManagedRemoteProxyGame(GameState? state)
        => state is not null &&
           !state.EmbeddedProxy &&
           !string.IsNullOrWhiteSpace(state.RemoteProxyServerId) &&
           !string.IsNullOrWhiteSpace(state.RemoteProxyGameId) &&
           TryGetProxyManagementClient(state.RemoteProxyServerId, out _);

    private async Task<bool> TryRunManagedRemoteScriptAsync(string relativePath)
    {
        if (!IsManagedRemoteProxyGame() || !TryGetCurrentProxyManagementClient(out ProxyManagementClient? client))
            return false;

        await client!.RunScriptAsync(_state.RemoteProxyGameId, relativePath);
        return true;
    }

    private async Task<bool> EnsureManagedRemoteProxyTerminalConnectedAsync(ProxyManagementClient client)
        => await EnsureManagedRemoteProxyTerminalConnectedAsync(ResolveCurrentMtcTabContext(), client).ConfigureAwait(false);

    private async Task<bool> EnsureManagedRemoteProxyTerminalConnectedAsync(MtcTabPrototype? owner, ProxyManagementClient client)
    {
        GameState state = owner?.State ?? _state;
        TelnetClient telnet = owner?.Telnet ?? _telnet;

        if (!IsManagedRemoteProxyGame(state))
            return false;

        await client.StartGameAsync(state.RemoteProxyGameId).ConfigureAwait(false);
        if (telnet.IsConnected)
            return true;

        PublishMombotClientOutput(owner, $"\x1b[1;36m[Connecting to remote proxy game: {state.Host}:{state.Port}]\x1b[0m\r\n");
        if (!await ConnectDirectTelnetAsync(owner, reconnectIfConnected: false).ConfigureAwait(false))
            return false;

        await Task.Delay(500).ConfigureAwait(false);
        if (telnet.IsConnected)
            return true;

        PublishMombotClientOutput(owner, "\x1b[1;31m[Remote proxy game disconnected before bot start]\x1b[0m\r\n");
        return false;
    }
}
