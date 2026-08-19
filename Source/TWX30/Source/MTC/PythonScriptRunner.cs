using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using Core = TWXProxy.Core;

namespace MTC;

internal enum PythonScriptEventKind
{
    Started,
    Output,
    ErrorOutput,
    Exited,
    Failed,
}

internal sealed record PythonScriptEvent(
    PythonScriptEventKind Kind,
    string ScriptName,
    string Message,
    int? ProcessId = null,
    int? ExitCode = null);

internal sealed record PythonScriptLaunchOptions(
    Core.GameInstance GameInstance,
    string InterpreterPath,
    string ScriptDirectory,
    string RelativeScriptPath,
    string FullScriptPath,
    string GameName,
    string ProgramDirectory,
    string? RpcUrl,
    string? RpcToken);

internal sealed record PythonScriptStartResult(bool Success, string Message);

internal sealed class PythonScriptRunner : IDisposable
{
    private sealed record PythonInterpreterCommand(string FileName, string[] Arguments, string DisplayName);

    private sealed record PythonInterpreterResolveResult(
        bool Success,
        PythonInterpreterCommand? Command,
        string Message);

    private sealed class RunningPythonScript
    {
        public required int Id { get; init; }
        public required string ScriptName { get; init; }
        public required Process Process { get; init; }
        public required Core.GameInstance GameInstance { get; init; }
    }

    private readonly object _sync = new();
    private readonly Dictionary<int, RunningPythonScript> _running = [];
    private int _nextId;
    private bool _disposed;

    public event Action<PythonScriptEvent>? EventRecorded;

    public bool HasRunningScripts
    {
        get
        {
            lock (_sync)
                return _running.Count > 0;
        }
    }

    public async Task<PythonScriptStartResult> StartAsync(PythonScriptLaunchOptions options)
    {
        if (_disposed)
            return new PythonScriptStartResult(false, "Python script runner is disposed.");

        PythonInterpreterResolveResult interpreterResult = ResolveInterpreter(options.InterpreterPath);
        if (!interpreterResult.Success || interpreterResult.Command == null)
            return new PythonScriptStartResult(false, interpreterResult.Message);

        PythonInterpreterCommand interpreter = interpreterResult.Command;
        string fullPath = options.FullScriptPath.Trim();
        string scriptName = Path.GetFileName(fullPath);
        if (!File.Exists(fullPath))
            return new PythonScriptStartResult(false, $"Python script not found: {options.RelativeScriptPath}");

        lock (_sync)
        {
            Core.GameInstance? existingGame = _running.Values.Select(item => item.GameInstance).FirstOrDefault();
            if (existingGame != null && !ReferenceEquals(existingGame, options.GameInstance))
                return new PythonScriptStartResult(false, "Python scripts are already running for a different game.");
        }

        int port;
        try
        {
            port = await options.GameInstance.EnsureAutomationListenerAsync(0).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            return new PythonScriptStartResult(false, $"Could not open Python automation port: {ex.Message}");
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = interpreter.FileName,
            WorkingDirectory = string.IsNullOrWhiteSpace(options.ScriptDirectory)
                ? Path.GetDirectoryName(fullPath) ?? Environment.CurrentDirectory
                : options.ScriptDirectory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        foreach (string arg in interpreter.Arguments)
            startInfo.ArgumentList.Add(arg);
        startInfo.ArgumentList.Add(fullPath);
        AddEnvironment(startInfo, options, port);

        Process? process = null;
        try
        {
            process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
            if (!process.Start())
                return new PythonScriptStartResult(false, $"Python did not start: {scriptName}");

            int id = Interlocked.Increment(ref _nextId);
            var running = new RunningPythonScript
            {
                Id = id,
                ScriptName = scriptName,
                Process = process,
                GameInstance = options.GameInstance,
            };

            lock (_sync)
            {
                _running[id] = running;
            }

            process.Exited += (_, _) => OnProcessExited(id);
            _ = PumpOutputAsync(id, process.StandardOutput, PythonScriptEventKind.Output);
            _ = PumpOutputAsync(id, process.StandardError, PythonScriptEventKind.ErrorOutput);

            Publish(new PythonScriptEvent(
                PythonScriptEventKind.Started,
                scriptName,
                $"started on 127.0.0.1:{port}",
                process.Id));
            return new PythonScriptStartResult(true, $"Started Python script: {scriptName}");
        }
        catch (Exception ex)
        {
            try { process?.Dispose(); } catch { }
            await StopAutomationListenerIfIdleAsync(options.GameInstance).ConfigureAwait(false);
            Publish(new PythonScriptEvent(PythonScriptEventKind.Failed, scriptName, ex.Message));
            return new PythonScriptStartResult(false, ex.Message);
        }
    }

    public async Task StopAllAsync()
    {
        RunningPythonScript[] scripts;
        lock (_sync)
        {
            scripts = _running.Values.ToArray();
            _running.Clear();
        }

        foreach (RunningPythonScript script in scripts)
        {
            try
            {
                if (!script.Process.HasExited)
                {
                    bool closeRequested = false;
                    try { closeRequested = script.Process.CloseMainWindow(); } catch { }
                    if (closeRequested)
                    {
                        try { await script.Process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(2)).ConfigureAwait(false); } catch { }
                    }
                    if (!script.Process.HasExited)
                        TryKill(script.Process);
                }
            }
            finally
            {
                try { script.Process.Dispose(); } catch { }
            }
        }

        foreach (Core.GameInstance gameInstance in scripts.Select(item => item.GameInstance).Distinct())
            await StopAutomationListenerIfIdleAsync(gameInstance).ConfigureAwait(false);
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        _disposed = true;
        try { StopAllAsync().GetAwaiter().GetResult(); } catch { }
    }

    private async Task PumpOutputAsync(int id, StreamReader reader, PythonScriptEventKind kind)
    {
        try
        {
            while (await reader.ReadLineAsync().ConfigureAwait(false) is { } line)
            {
                RunningPythonScript? script = GetRunningScript(id);
                if (script == null)
                    return;

                Publish(new PythonScriptEvent(kind, script.ScriptName, line, script.Process.Id));
            }
        }
        catch (Exception ex)
        {
            RunningPythonScript? script = GetRunningScript(id);
            if (script != null)
                Publish(new PythonScriptEvent(PythonScriptEventKind.Failed, script.ScriptName, ex.Message, script.Process.Id));
        }
    }

    private void OnProcessExited(int id)
    {
        RunningPythonScript? script;
        lock (_sync)
        {
            if (!_running.Remove(id, out script))
                return;
        }

        int? exitCode = null;
        try { exitCode = script.Process.ExitCode; } catch { }
        Publish(new PythonScriptEvent(
            PythonScriptEventKind.Exited,
            script.ScriptName,
            exitCode.HasValue
                ? $"exited with code {exitCode.Value.ToString(CultureInfo.InvariantCulture)}"
                : "exited",
            script.Process.Id,
            exitCode));

        try { script.Process.Dispose(); } catch { }
        _ = StopAutomationListenerIfIdleAsync(script.GameInstance);
    }

    private RunningPythonScript? GetRunningScript(int id)
    {
        lock (_sync)
            return _running.TryGetValue(id, out RunningPythonScript? script) ? script : null;
    }

    private async Task StopAutomationListenerIfIdleAsync(Core.GameInstance gameInstance)
    {
        bool hasScriptsForGame;
        lock (_sync)
            hasScriptsForGame = _running.Values.Any(item => ReferenceEquals(item.GameInstance, gameInstance));

        if (!hasScriptsForGame)
        {
            try { await gameInstance.StopAutomationListenerAsync().ConfigureAwait(false); } catch { }
        }
    }

    private static void AddEnvironment(ProcessStartInfo startInfo, PythonScriptLaunchOptions options, int port)
    {
        startInfo.Environment["MTC_HOST"] = "127.0.0.1";
        startInfo.Environment["MTC_PORT"] = port.ToString(CultureInfo.InvariantCulture);
        startInfo.Environment["MTC_PROXY_HOST"] = "127.0.0.1";
        startInfo.Environment["MTC_PROXY_PORT"] = port.ToString(CultureInfo.InvariantCulture);
        startInfo.Environment["MTC_GAME_NAME"] = options.GameName ?? string.Empty;
        startInfo.Environment["MTC_SCRIPT_DIR"] = options.ScriptDirectory ?? string.Empty;
        startInfo.Environment["MTC_SCRIPT_PATH"] = options.FullScriptPath ?? string.Empty;
        startInfo.Environment["MTC_SCRIPT_NAME"] = Path.GetFileName(options.FullScriptPath ?? string.Empty);
        startInfo.Environment["MTC_PROGRAM_DIR"] = options.ProgramDirectory ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(options.RpcUrl))
            startInfo.Environment["MTC_RPC_URL"] = options.RpcUrl!;
        if (!string.IsNullOrWhiteSpace(options.RpcToken))
            startInfo.Environment["MTC_RPC_TOKEN"] = options.RpcToken!;

        string helperPath = EnsureHelperModuleDirectory();
        string existingPythonPath = startInfo.Environment.TryGetValue("PYTHONPATH", out string? current)
            ? current ?? string.Empty
            : string.Empty;
        startInfo.Environment["PYTHONPATH"] = string.IsNullOrWhiteSpace(existingPythonPath)
            ? helperPath
            : helperPath + Path.PathSeparator + existingPythonPath;
    }

    private static string EnsureHelperModuleDirectory()
    {
        string helperPath = Path.Combine(AppPaths.AppDataDir, "python");
        Directory.CreateDirectory(helperPath);

        string targetPath = Path.Combine(helperPath, "mtc.py");
        using Stream? stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("MTC.Python.mtc.py");
        if (stream == null)
            return helperPath;

        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        byte[] bytes = memory.ToArray();
        bool write = true;
        try
        {
            if (File.Exists(targetPath))
            {
                byte[] existing = File.ReadAllBytes(targetPath);
                write = existing.Length != bytes.Length || !existing.SequenceEqual(bytes);
            }
        }
        catch
        {
            write = true;
        }

        if (write)
            File.WriteAllBytes(targetPath, bytes);

        return helperPath;
    }

    private static PythonInterpreterResolveResult ResolveInterpreter(string value)
    {
        string normalized = NormalizeInterpreterPath(value);
        if (IsAutoInterpreter(normalized))
            return ResolveAutoInterpreter();

        PythonInterpreterCommand command = BuildInterpreterCommand(normalized);
        PythonInterpreterResolveResult probe = ProbeInterpreter(command);
        return probe.Success
            ? probe
            : new PythonInterpreterResolveResult(
                false,
                null,
                $"Python interpreter did not run: {command.DisplayName}. {probe.Message}");
    }

    private static PythonInterpreterResolveResult ResolveAutoInterpreter()
    {
        PythonInterpreterCommand[] candidates = OperatingSystem.IsWindows()
            ? [
                new PythonInterpreterCommand("py", ["-3"], "py -3"),
                new PythonInterpreterCommand("python", [], "python"),
                new PythonInterpreterCommand("python3", [], "python3"),
            ]
            : [
                new PythonInterpreterCommand("python3", [], "python3"),
                new PythonInterpreterCommand("python", [], "python"),
            ];

        List<string> failures = [];
        foreach (PythonInterpreterCommand candidate in candidates)
        {
            PythonInterpreterResolveResult result = ProbeInterpreter(candidate);
            if (result.Success)
                return result;
            if (!string.IsNullOrWhiteSpace(result.Message))
                failures.Add($"{candidate.DisplayName}: {result.Message}");
        }

        string detail = failures.Count == 0 ? string.Empty : " " + string.Join(" ", failures);
        return new PythonInterpreterResolveResult(
            false,
            null,
            "Python interpreter was not found. Set Preferences > Runtime > Python interpreter to a full python.exe path or a command such as py -3." + detail);
    }

    private static PythonInterpreterResolveResult ProbeInterpreter(PythonInterpreterCommand command)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = command.FileName,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        foreach (string arg in command.Arguments)
            startInfo.ArgumentList.Add(arg);
        startInfo.ArgumentList.Add("--version");

        try
        {
            using var process = Process.Start(startInfo);
            if (process == null)
                return new PythonInterpreterResolveResult(false, null, "process did not start.");

            if (!process.WaitForExit(3000))
            {
                TryKill(process);
                return new PythonInterpreterResolveResult(false, null, "version check timed out.");
            }

            string stdout = process.StandardOutput.ReadToEnd().Trim();
            string stderr = process.StandardError.ReadToEnd().Trim();
            string output = string.IsNullOrWhiteSpace(stdout) ? stderr : stdout;
            if (process.ExitCode == 0 && output.Contains("Python", StringComparison.OrdinalIgnoreCase))
                return new PythonInterpreterResolveResult(true, command, command.DisplayName);

            string message = string.IsNullOrWhiteSpace(output)
                ? $"version check exited with code {process.ExitCode.ToString(CultureInfo.InvariantCulture)}."
                : output;
            return new PythonInterpreterResolveResult(false, null, message);
        }
        catch (Exception ex)
        {
            return new PythonInterpreterResolveResult(false, null, ex.Message);
        }
    }

    private static PythonInterpreterCommand BuildInterpreterCommand(string value)
    {
        string normalized = value.Trim();
        if (File.Exists(normalized))
            return new PythonInterpreterCommand(normalized, [], normalized);

        string[] parts = SplitCommandLine(normalized);
        if (parts.Length == 0)
            return new PythonInterpreterCommand(OperatingSystem.IsWindows() ? "py" : "python3", OperatingSystem.IsWindows() ? ["-3"] : [], "auto");

        string fileName = parts[0];
        string[] args = parts.Skip(1).ToArray();
        return new PythonInterpreterCommand(fileName, args, string.Join(" ", parts));
    }

    private static string[] SplitCommandLine(string value)
    {
        var parts = new List<string>();
        var current = new System.Text.StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < value.Length; i++)
        {
            char c = value[i];
            if (c == '"')
            {
                inQuotes = !inQuotes;
                continue;
            }

            if (char.IsWhiteSpace(c) && !inQuotes)
            {
                if (current.Length > 0)
                {
                    parts.Add(current.ToString());
                    current.Clear();
                }
                continue;
            }

            current.Append(c);
        }

        if (current.Length > 0)
            parts.Add(current.ToString());

        return parts.ToArray();
    }

    private static bool IsAutoInterpreter(string value)
        => string.IsNullOrWhiteSpace(value) ||
           value.Equals("auto", StringComparison.OrdinalIgnoreCase) ||
           value.Equals("default", StringComparison.OrdinalIgnoreCase) ||
           (OperatingSystem.IsWindows() && value.Equals("python3", StringComparison.OrdinalIgnoreCase));

    private static string NormalizeInterpreterPath(string value)
        => string.IsNullOrWhiteSpace(value) ? "auto" : value.Trim();

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited)
                process.Kill(entireProcessTree: true);
        }
        catch
        {
        }
    }

    private void Publish(PythonScriptEvent evt)
    {
        try { EventRecorded?.Invoke(evt); } catch { }
    }
}
