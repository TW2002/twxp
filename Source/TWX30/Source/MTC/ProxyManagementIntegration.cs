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
    {
        client = null;
        if (string.IsNullOrWhiteSpace(_state.RemoteProxyServerId))
            return false;

        AppPreferences.ProxyServerPreference? server = _appPrefs.ProxyServers.FirstOrDefault(candidate =>
            string.Equals(candidate.Id, _state.RemoteProxyServerId, StringComparison.OrdinalIgnoreCase));
        if (server == null)
            return false;

        client = new ProxyManagementClient(server);
        return true;
    }

    private bool IsManagedRemoteProxyGame()
        => !_state.EmbeddedProxy &&
           !string.IsNullOrWhiteSpace(_state.RemoteProxyServerId) &&
           !string.IsNullOrWhiteSpace(_state.RemoteProxyGameId) &&
           TryGetCurrentProxyManagementClient(out _);

    private async Task<bool> TryRunManagedRemoteScriptAsync(string relativePath)
    {
        if (!IsManagedRemoteProxyGame() || !TryGetCurrentProxyManagementClient(out ProxyManagementClient? client))
            return false;

        await client!.RunScriptAsync(_state.RemoteProxyGameId, relativePath);
        return true;
    }

    private async Task<bool> EnsureManagedRemoteProxyTerminalConnectedAsync(ProxyManagementClient client)
    {
        if (!IsManagedRemoteProxyGame())
            return false;

        await client.StartGameAsync(_state.RemoteProxyGameId);
        if (_telnet.IsConnected)
            return true;

        _parser.Feed($"\x1b[1;36m[Connecting to remote proxy game: {_state.Host}:{_state.Port}]\x1b[0m\r\n");
        _buffer.Dirty = true;
        if (!await ConnectDirectTelnetAsync(reconnectIfConnected: false))
            return false;

        await Task.Delay(500);
        if (_telnet.IsConnected)
            return true;

        _parser.Feed("\x1b[1;31m[Remote proxy game disconnected before bot start]\x1b[0m\r\n");
        _buffer.Dirty = true;
        return false;
    }
}
