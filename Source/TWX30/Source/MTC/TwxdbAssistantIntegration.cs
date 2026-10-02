using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace MTC;

public partial class MainWindow
{
    private const string TwxdbAssistantHealthUrl = "http://127.0.0.1:8765/health";
    private const string TwxdbAssistantMcpUrl = "http://127.0.0.1:8765/mcp";

    private async Task OnToolsStartTwxdbAssistantAsync()
    {
        if (await IsTwxdbAssistantRunningAsync())
        {
            await ShowMessageAsync("TWXDB Assistant", $"The MCP server is already running.\n\nEndpoint: {TwxdbAssistantMcpUrl}");
            return;
        }

        string assistantDirectory = Path.Combine(AppPaths.ProgramDir, "tools", "twxdb-assistant");
        ProcessStartInfo? startInfo = BuildTwxdbAssistantStartInfo(assistantDirectory);
        if (startInfo == null)
        {
            await ShowMessageAsync(
                "TWXDB Assistant",
                $"TWXDB Assistant is not installed in the configured TWX program directory.\n\nExpected: {assistantDirectory}");
            return;
        }

        try
        {
            startInfo.WorkingDirectory = assistantDirectory;
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
            startInfo.Environment["TWX30_PROGRAMDIR"] = AppPaths.ProgramDir;
            Process.Start(startInfo);

            for (int attempt = 0; attempt < 40; attempt++)
            {
                await Task.Delay(250);
                if (await IsTwxdbAssistantRunningAsync())
                {
                    await ShowMessageAsync("TWXDB Assistant", $"The MCP server is running.\n\nEndpoint: {TwxdbAssistantMcpUrl}");
                    return;
                }
            }

            await ShowMessageAsync(
                "TWXDB Assistant",
                "The MCP process was started, but its health endpoint did not become ready. Check the TWX logs directory for startup errors.");
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("TWXDB Assistant", $"Could not start the MCP server.\n\n{ex.Message}");
        }
    }

    private static ProcessStartInfo? BuildTwxdbAssistantStartInfo(string assistantDirectory)
    {
        string appScript = Path.Combine(assistantDirectory, "app", "twxdb-mcp.py");
        if (OperatingSystem.IsWindows())
        {
            string python = Path.Combine(assistantDirectory, "runtime", "python", "pythonw.exe");
            if (!File.Exists(python))
                python = Path.Combine(assistantDirectory, "runtime", "python", "python.exe");
            if (!File.Exists(python) || !File.Exists(appScript))
                return null;
            var info = new ProcessStartInfo(python);
            info.ArgumentList.Add(appScript);
            info.ArgumentList.Add("--http");
            return info;
        }

        string launcher = Path.Combine(assistantDirectory, "twxdb-mcp");
        if (!File.Exists(launcher))
            return null;
        var unixInfo = new ProcessStartInfo(launcher);
        unixInfo.ArgumentList.Add("--http");
        return unixInfo;
    }

    private static async Task<bool> IsTwxdbAssistantRunningAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(500) };
            using HttpResponseMessage response = await client.GetAsync(TwxdbAssistantHealthUrl);
            if (!response.IsSuccessStatusCode)
                return false;
            string body = await response.Content.ReadAsStringAsync();
            using JsonDocument document = JsonDocument.Parse(body);
            return document.RootElement.TryGetProperty("server", out JsonElement server)
                && server.TryGetProperty("name", out JsonElement name)
                && string.Equals(name.GetString(), "twxdb-assistant", StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }
}
