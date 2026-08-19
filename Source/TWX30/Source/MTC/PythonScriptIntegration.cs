using System.Globalization;
using System.Text;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private async Task RunPythonScriptFromMenuAsync(string relativePath)
    {
        if (!_appPrefs.PythonScriptsEnabled)
        {
            await ShowMessageAsync("Python Scripts", "Python scripts are disabled in Preferences.");
            return;
        }

        if (_gameInstance == null)
        {
            await ShowMessageAsync("Python Scripts", "Python scripts require an embedded proxy game.");
            return;
        }

        string scriptDirectory = GetEffectiveProxyScriptDirectory();
        if (string.IsNullOrWhiteSpace(scriptDirectory) || !Directory.Exists(scriptDirectory))
        {
            await ShowMessageAsync("Python Scripts", "Scripts directory is not configured.");
            return;
        }

        string normalizedRelative = StripRelativePrefix((relativePath ?? string.Empty).Trim().Replace('\\', '/'));
        if (string.IsNullOrWhiteSpace(normalizedRelative))
        {
            await ShowMessageAsync("Python Scripts", "Python script path is empty.");
            return;
        }

        string fullPath;
        try
        {
            fullPath = Path.GetFullPath(Path.Combine(
                scriptDirectory,
                normalizedRelative.Replace('/', Path.DirectorySeparatorChar)));
            string basePath = Path.GetFullPath(scriptDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar);
            if (!fullPath.StartsWith(basePath, StringComparison.OrdinalIgnoreCase))
            {
                await ShowMessageAsync("Python Scripts", "Python script must live under the configured scripts directory.");
                return;
            }
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Python Scripts", ex.Message);
            return;
        }

        string? rpcUrl = null;
        string? rpcToken = null;
        if (_appPrefs.JsonRpcEnabled)
        {
            string bind = AppPreferences.NormalizeJsonRpcBindAddress(_appPrefs.JsonRpcBindAddress);
            int port = AppPreferences.NormalizeJsonRpcPort(_appPrefs.JsonRpcPort);
            rpcUrl = $"http://{bind}:{port}/";
            if (_appPrefs.PythonExposeJsonRpcToken)
                rpcToken = AppPreferences.NormalizeJsonRpcAuthToken(_appPrefs.JsonRpcAuthToken);
        }

        PythonScriptStartResult result = await _pythonScripts.StartAsync(new PythonScriptLaunchOptions(
            _gameInstance,
            AppPreferences.NormalizePythonInterpreterPath(_appPrefs.PythonInterpreterPath),
            scriptDirectory,
            normalizedRelative,
            fullPath,
            GetGameAgentGameName(),
            CurrentInterpreter?.ProgramDir ?? GetEffectiveProxyProgramDir(scriptDirectory),
            rpcUrl,
            rpcToken));

        if (!result.Success)
        {
            _parser.Feed($"\x1b[1;31m[Python script failed: {EscapeStatusText(result.Message)}]\x1b[0m\r\n");
            _buffer.Dirty = true;
            await ShowMessageAsync("Python Script Failed", result.Message);
            return;
        }

        _parser.Feed($"\x1b[1;36m[{EscapeStatusText(result.Message)}]\x1b[0m\r\n");
        _buffer.Dirty = true;
        RebuildScriptsMenu(force: true);
    }

    private void OnPythonScriptEvent(PythonScriptEvent evt)
    {
        string scriptName = EscapeStatusText(evt.ScriptName);
        string message = EscapeStatusText(evt.Message);
        string line = evt.Kind switch
        {
            PythonScriptEventKind.Started => $"\x1b[1;36m[Python {scriptName}: {message}]\x1b[0m\r\n",
            PythonScriptEventKind.Output => $"\x1b[36m[py {scriptName}] {message}\x1b[0m\r\n",
            PythonScriptEventKind.ErrorOutput => $"\x1b[33m[py {scriptName} stderr] {message}\x1b[0m\r\n",
            PythonScriptEventKind.Exited => $"\x1b[1;36m[Python {scriptName}: {message}]\x1b[0m\r\n",
            PythonScriptEventKind.Failed => $"\x1b[1;31m[Python {scriptName}: {message}]\x1b[0m\r\n",
            _ => $"\x1b[36m[Python {scriptName}] {message}\x1b[0m\r\n",
        };

        _parser.Feed(line);
        _buffer.Dirty = true;

        if (evt.Kind is PythonScriptEventKind.Started or PythonScriptEventKind.Exited or PythonScriptEventKind.Failed)
            RebuildScriptsMenu(force: true);
    }

    private static string EscapeStatusText(string value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        var builder = new StringBuilder(value.Length);
        foreach (char c in value)
        {
            if (c == '\t' || c >= 0x20)
                builder.Append(c == '\x1b' ? '?' : c);
            else
                builder.Append(' ');
        }

        return builder.ToString();
    }
}
