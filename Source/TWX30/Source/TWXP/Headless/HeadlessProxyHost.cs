using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using TWXProxy.Core;
using TWXP.Models;
using TWXP.Services;

namespace TWXP.Headless;

internal sealed class HeadlessProxyHost
{
    private const string DaemonChildEnvironmentVariable = "TWXP_DAEMON_CHILD";

    private readonly string _configPath;
    private HeadlessProxyConfig _config;
    private readonly IGameConfigService _configService;
    private readonly IProxyService _proxyService;
    private readonly CancellationTokenSource _cts = new();
    private readonly SemaphoreSlim _reloadLock = new(1, 1);
    private CancellationTokenSource? _managementRestartCts;

    private HeadlessProxyHost(HeadlessProxyConfig config, string configPath)
    {
        _configPath = configPath;
        _config = NormalizeConfig(config);
        AppPaths.SetConfiguredProgramDir(_config.ProgramDir);
        AppPaths.EnsureDirectories();

        GlobalModules.ProgramDir = AppPaths.ProgramDir;
        GlobalModules.DebugLogPath = Path.Combine(AppPaths.LogsDir, "twxp_daemon_debug.log");
        GlobalModules.ConfigureDatabaseCorrectionLogging(Path.Combine(AppPaths.LogsDir, "twxp_daemon_db_errors.log"), false);
        GlobalModules.ConfigureDebugLogging(
            GlobalModules.DebugLogPath,
            enabled: true,
            verboseEnabled: false,
            triggerEnabled: false,
            scriptTraceEnabled: false,
            autoRecorderEnabled: false,
            variablePersistenceEnabled: false);
        GlobalModules.ConfigureHaggleDebugLogging(null, false, null, false);

        _configService = new GameConfigService(_config.ProgramDir, _config.ScriptsDirectory);
        _proxyService = new ProxyService(
            _configService,
            suppressConsoleOutput: true,
            basicDebugLogging: true);
    }

    public static async Task RunAsync(string[] args)
    {
        string? configPath = null;
        HeadlessProxyConfig? config = null;
        try
        {
            configPath = ResolveConfigPath(args);
            config = await LoadConfigAsync(configPath);
            config = NormalizeConfig(config);
            if (ShouldSpawnDetached(args))
            {
                SpawnDetached(args, config, configPath);
                return;
            }

            SuppressConsoleOutput();
            var host = new HeadlessProxyHost(config, configPath);
            await host.RunUntilCancelledAsync();
        }
        catch (Exception ex)
        {
            if (IsDaemonChild())
                WriteStartupFailure(config?.ProgramDir ?? AppContext.BaseDirectory, ex);
            throw;
        }
    }

    private static bool ShouldSpawnDetached(string[] args)
    {
        if (IsDaemonChild())
            return false;

        return !args.Any(arg => string.Equals(arg, "--foreground", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsDaemonChild()
        => string.Equals(Environment.GetEnvironmentVariable(DaemonChildEnvironmentVariable), "1", StringComparison.Ordinal);

    private static void SpawnDetached(string[] args, HeadlessProxyConfig config, string configPath)
    {
        AppPaths.SetConfiguredProgramDir(config.ProgramDir);
        AppPaths.EnsureDirectories();

        (string executable, List<string> childArgs) = ResolveDaemonLaunchCommand(args, configPath);
        if (string.IsNullOrWhiteSpace(executable))
            throw new InvalidOperationException("Unable to resolve TWXP executable path for daemon start.");

        ProcessStartInfo startInfo = CreateDetachedStartInfo(executable, childArgs, configPath);
        Process.Start(startInfo)?.Dispose();
    }

    private static ProcessStartInfo CreateDetachedStartInfo(
        string executable,
        IReadOnlyList<string> childArgs,
        string configPath)
    {
        string workingDirectory = Path.GetDirectoryName(configPath) ?? AppContext.BaseDirectory;

        if (OperatingSystem.IsLinux() && TryFindSetsid(out string setsidPath))
        {
            var setsidInfo = new ProcessStartInfo
            {
                FileName = setsidPath,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = workingDirectory,
            };
            setsidInfo.ArgumentList.Add(executable);
            foreach (string arg in childArgs)
                setsidInfo.ArgumentList.Add(arg);
            setsidInfo.Environment[DaemonChildEnvironmentVariable] = "1";
            return setsidInfo;
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = workingDirectory,
        };
        foreach (string arg in childArgs)
            startInfo.ArgumentList.Add(arg);
        startInfo.Environment[DaemonChildEnvironmentVariable] = "1";
        return startInfo;
    }

    private static (string Executable, List<string> Arguments) ResolveDaemonLaunchCommand(string[] args, string configPath)
    {
        string? executable = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(executable))
            executable = Environment.GetCommandLineArgs().FirstOrDefault();

        var childArgs = new List<string>();
        string? commandPath = Environment.GetCommandLineArgs().FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(commandPath) &&
            string.Equals(Path.GetExtension(commandPath), ".dll", StringComparison.OrdinalIgnoreCase))
        {
            childArgs.Add(Path.GetFullPath(commandPath));
        }

        childArgs.AddRange(WithResolvedConfigPath(args, configPath));
        return (executable ?? string.Empty, childArgs);
    }

    private static IEnumerable<string> WithResolvedConfigPath(string[] args, string configPath)
    {
        for (int i = 0; i < args.Length; i++)
        {
            yield return args[i];
            if (string.Equals(args[i], "-c", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                yield return configPath;
                i++;
            }
        }
    }

    private static bool TryFindSetsid(out string setsidPath)
    {
        foreach (string candidate in new[] { "/usr/bin/setsid", "/bin/setsid" })
        {
            if (File.Exists(candidate))
            {
                setsidPath = candidate;
                return true;
            }
        }

        setsidPath = string.Empty;
        return false;
    }

    private static void SuppressConsoleOutput()
    {
        Console.SetOut(TextWriter.Null);
        Console.SetError(TextWriter.Null);
    }

    private static void WriteStartupFailure(string programDir, Exception ex)
    {
        try
        {
            string logDir = Path.Combine(programDir, "logs");
            Directory.CreateDirectory(logDir);
            File.AppendAllText(
                Path.Combine(logDir, "twxp_daemon_startup_error.log"),
                $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {ex}\n");
        }
        catch
        {
            // Daemon startup errors must not mask the original failure.
        }
    }

    private async Task RunUntilCancelledAsync()
    {
        await ApplyConfigAsync(_config, restartManagement: false);
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            _cts.Cancel();
        };
        AppDomain.CurrentDomain.ProcessExit += (_, _) => _cts.Cancel();

        using IDisposable? signalRegistration = RegisterHangupSignal();
        try
        {
            while (!_cts.IsCancellationRequested)
            {
                using var restartCts = CancellationTokenSource.CreateLinkedTokenSource(_cts.Token);
                _managementRestartCts = restartCts;
                var managementServer = new HeadlessManagementServer(_config, _configService, _proxyService);

                GlobalModules.DebugLog($"[TWXP.Daemon] Management listening on {_config.ManagementBindAddress}:{_config.ManagementPort}\n");
                GlobalModules.FlushDebugLog();

                try
                {
                    await managementServer.RunAsync(restartCts.Token);
                }
                catch (OperationCanceledException) when (!_cts.IsCancellationRequested)
                {
                }
                finally
                {
                    if (ReferenceEquals(_managementRestartCts, restartCts))
                        _managementRestartCts = null;
                }
            }
        }
        finally
        {
            await StopRunningGamesAsync();
        }
    }

    private IDisposable? RegisterHangupSignal()
    {
        if (OperatingSystem.IsWindows())
            return null;

        return PosixSignalRegistration.Create(PosixSignal.SIGHUP, context =>
        {
            context.Cancel = true;
            _ = Task.Run(ReloadConfigFromSignalAsync);
        });
    }

    private async Task ReloadConfigFromSignalAsync()
    {
        try
        {
            GlobalModules.DebugLog($"[TWXP.Daemon] SIGHUP received; reloading {_configPath}\n");
            GlobalModules.FlushDebugLog();

            HeadlessProxyConfig reloaded = NormalizeConfig(await LoadConfigAsync(_configPath));
            await ApplyConfigAsync(reloaded, restartManagement: true);
        }
        catch (Exception ex)
        {
            GlobalModules.DebugLog($"[TWXP.Daemon] SIGHUP reload failed; keeping current configuration: {ex}\n");
            GlobalModules.FlushDebugLog();
        }
    }

    private async Task ApplyConfigAsync(HeadlessProxyConfig config, bool restartManagement)
    {
        await _reloadLock.WaitAsync(_cts.Token);
        try
        {
            _config = NormalizeConfig(config);
            AppPaths.SetConfiguredProgramDir(_config.ProgramDir);
            AppPaths.EnsureDirectories();

            GlobalModules.ProgramDir = AppPaths.ProgramDir;
            GlobalModules.ConfigureDebugLogging(
                Path.Combine(AppPaths.LogsDir, "twxp_daemon_debug.log"),
                enabled: true,
                verboseEnabled: false,
                triggerEnabled: false,
                scriptTraceEnabled: false,
                autoRecorderEnabled: false,
                variablePersistenceEnabled: false);
            GlobalModules.ConfigureDatabaseCorrectionLogging(Path.Combine(AppPaths.LogsDir, "twxp_daemon_db_errors.log"), false);
            GlobalModules.ConfigureHaggleDebugLogging(null, false, null, false);

            await _configService.SetProgramDirectoryAsync(_config.ProgramDir);
            await _configService.SetScriptsDirectoryAsync(_config.ScriptsDirectory);

            await PersistConfiguredGamesAsync(_config);
            foreach (GameConfig game in _config.Games)
            {
                if (_config.AutoStartGames || _proxyService.GetGameStatus(game.Id) != GameStatus.Stopped)
                    await _proxyService.StartGameAsync(game);
            }

            if (restartManagement)
            {
                GlobalModules.DebugLog("[TWXP.Daemon] Configuration reload complete; restarting management listener.\n");
                GlobalModules.FlushDebugLog();
                _managementRestartCts?.Cancel();
            }
        }
        finally
        {
            _reloadLock.Release();
        }
    }

    private async Task PersistConfiguredGamesAsync(HeadlessProxyConfig config)
    {
        int nextPort = Math.Max(1, config.FirstGameListenPort);
        var usedPorts = new HashSet<int>();
        foreach (GameConfig game in config.Games)
        {
            if (string.IsNullOrWhiteSpace(game.Id))
                game.Id = Guid.NewGuid().ToString();
            if (string.IsNullOrWhiteSpace(game.Name))
                game.Name = game.Id;
            if (game.ListenPort <= 0)
            {
                while (usedPorts.Contains(nextPort))
                    nextPort++;
                game.ListenPort = nextPort++;
            }
            usedPorts.Add(game.ListenPort);
            HeadlessManagementServer.ApplyGameProxyClientAuthorization(game, config.AllowedIpAddresses, string.Empty);
            await _configService.SaveConfigAsync(game);
        }
    }

    private async Task StopRunningGamesAsync()
    {
        foreach (GameConfig game in await _configService.LoadConfigsAsync())
        {
            if (_proxyService.GetGameStatus(game.Id) != GameStatus.Stopped)
                await _proxyService.StopGameAsync(game.Id);
        }
    }

    private static async Task<HeadlessProxyConfig> LoadConfigAsync(string path)
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"Headless proxy config was not found: {path}", path);

        await using FileStream stream = File.OpenRead(path);
        HeadlessProxyConfig? config = await JsonSerializer.DeserializeAsync(
            stream,
            HeadlessProxyJsonContext.Default.HeadlessProxyConfig);
        if (config == null)
            throw new InvalidOperationException($"Headless proxy config is empty or invalid: {path}");
        return config;
    }

    private static string ResolveConfigPath(string[] args)
    {
        for (int i = 0; i < args.Length; i++)
        {
            if (string.Equals(args[i], "-c", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length || args[i + 1].StartsWith("-", StringComparison.Ordinal))
                    throw new ArgumentException("Daemon mode requires a config path after -c.");
                return Path.GetFullPath(args[i + 1]);
            }
        }

        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "twxp-daemon.json"));
    }

    private static HeadlessProxyConfig NormalizeConfig(HeadlessProxyConfig config)
    {
        if (string.IsNullOrWhiteSpace(config.ProgramDir))
            config.ProgramDir = SharedPaths.GetDefaultProgramDir();
        config.ProgramDir = Path.GetFullPath(config.ProgramDir)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        if (string.IsNullOrWhiteSpace(config.ManagementBindAddress))
            config.ManagementBindAddress = "127.0.0.1";
        if (config.ManagementPort <= 0)
            config.ManagementPort = 2099;
        if (config.FirstGameListenPort <= 0)
            config.FirstGameListenPort = 2023;
        if (config.AllowedIpAddresses.Count == 0)
            config.AllowedIpAddresses.AddRange(["127.0.0.1", "::1"]);
        return config;
    }
}

internal sealed class HeadlessManagementServer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HeadlessProxyConfig _serverConfig;
    private readonly IGameConfigService _configService;
    private readonly IProxyService _proxyService;
    private readonly HashSet<string> _allowedAddresses;
    private readonly HashSet<string> _tokens;

    public HeadlessManagementServer(
        HeadlessProxyConfig serverConfig,
        IGameConfigService configService,
        IProxyService proxyService)
    {
        _serverConfig = serverConfig;
        _configService = configService;
        _proxyService = proxyService;
        _allowedAddresses = new HashSet<string>(
            serverConfig.AllowedIpAddresses.Select(NormalizeAddress).Where(value => value.Length > 0),
            StringComparer.OrdinalIgnoreCase);
        _tokens = new HashSet<string>(
            serverConfig.SecurityTokens.Where(token => !string.IsNullOrWhiteSpace(token)),
            StringComparer.Ordinal);
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        IPAddress bindAddress = IPAddress.Parse(_serverConfig.ManagementBindAddress);
        var listener = new TcpListener(bindAddress, _serverConfig.ManagementPort);
        listener.Start();
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                TcpClient client = await listener.AcceptTcpClientAsync(cancellationToken);
                _ = Task.Run(() => HandleClientAsync(client, cancellationToken), cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            GlobalModules.DebugLog($"[TWXP.Daemon] Management listener stopped unexpectedly: {ex}\n");
            GlobalModules.FlushDebugLog();
            throw;
        }
        finally
        {
            listener.Stop();
        }
    }

    private async Task HandleClientAsync(TcpClient client, CancellationToken cancellationToken)
    {
        await using NetworkStream stream = client.GetStream();
        using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);
        await using var writer = new StreamWriter(stream, new UTF8Encoding(false), leaveOpen: true)
        {
            AutoFlush = true,
            NewLine = "\n",
        };

        IPAddress? remoteIpAddress = ((IPEndPoint?)client.Client.RemoteEndPoint)?.Address;
        string remoteProxyAddress = FormatProxyAddress(remoteIpAddress);
        string remoteAddress = NormalizeAddress(remoteIpAddress);
        if (!IsAddressAllowed(remoteAddress))
        {
            await WriteResponseAsync(writer, new ManagementResponse(false, "forbidden", Error: "remote address is not allowed"));
            return;
        }

        while (!cancellationToken.IsCancellationRequested)
        {
            string? line = await reader.ReadLineAsync(cancellationToken);
            if (line == null)
                break;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            ManagementResponse response;
            try
            {
                using JsonDocument document = JsonDocument.Parse(line);
                response = await DispatchAsync(document.RootElement, remoteProxyAddress, cancellationToken);
            }
            catch (Exception ex)
            {
                response = new ManagementResponse(false, "error", Error: ex.Message);
            }

            await WriteResponseAsync(writer, response);
        }
    }

    private async Task<ManagementResponse> DispatchAsync(
        JsonElement request,
        string remoteProxyAddress,
        CancellationToken cancellationToken)
    {
        string action = GetString(request, "action");
        string token = GetString(request, "token");
        if (!IsAuthenticated(token))
            return new ManagementResponse(false, action, Error: "authentication failed");

        return action.ToLowerInvariant() switch
        {
            "ping" => new ManagementResponse(true, action, new { status = "ok" }),
            "listgames" => new ManagementResponse(true, action, await BuildGameListAsync()),
            "creategame" => await CreateGameAsync(request, remoteProxyAddress),
            "deletegame" => await DeleteGameAsync(request),
            "startgame" => await StartGameAsync(request, remoteProxyAddress),
            "stopgame" => await StopGameAsync(request),
            "listscripts" => new ManagementResponse(true, action, await BuildScriptListAsync(request)),
            "listbotconfigs" => new ManagementResponse(true, action, await BuildBotConfigListAsync()),
            "savebotconfig" => await SaveBotConfigAsync(request),
            "rscript" or "runscript" or "loadscript" => await RunScriptAsync(request),
            "listsrunning" or "listrunningscripts" => await ListRunningScriptsAsync(request),
            "stopscript" => await StopScriptAsync(request),
            "stopallscripts" => await StopAllScriptsAsync(request),
            "switchbot" => await SwitchBotAsync(request),
            "uploadscript" => await UploadFileAsync(request, scriptFile: true, cancellationToken),
            "uploadconfig" => await UploadFileAsync(request, scriptFile: false, cancellationToken),
            _ => new ManagementResponse(false, action, Error: $"unknown action '{action}'"),
        };
    }

    private async Task<object> BuildGameListAsync()
    {
        ObservableCollection<GameConfig> configs = await _configService.LoadConfigsAsync();
        return configs.Select(config => new
        {
            config.Id,
            config.Name,
            config.Host,
            config.Port,
            config.ListenPort,
            Status = _proxyService.GetGameStatus(config.Id).ToString(),
            config.ScriptDirectory,
        }).ToArray();
    }

    private async Task<ManagementResponse> CreateGameAsync(JsonElement request, string remoteProxyAddress)
    {
        if (!request.TryGetProperty("game", out JsonElement gameElement))
            return new ManagementResponse(false, "createGame", Error: "missing game");

        GameConfig? game = gameElement.Deserialize(HeadlessProxyJsonContext.Default.GameConfig);
        if (game == null)
            return new ManagementResponse(false, "createGame", Error: "invalid game");
        if (string.IsNullOrWhiteSpace(game.Id))
            game.Id = Guid.NewGuid().ToString();
        if (game.ListenPort <= 0)
            game.ListenPort = await NextListenPortAsync();
        ApplyGameProxyClientAuthorization(game, _serverConfig.AllowedIpAddresses, remoteProxyAddress);

        await _configService.SaveConfigAsync(game);
        return new ManagementResponse(true, "createGame", new { game.Id, game.Name, game.ListenPort, game.ExternalAddress });
    }

    private async Task<ManagementResponse> DeleteGameAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "deleteGame", Error: "missing gameId");
        if (_proxyService.GetGameStatus(gameId) != GameStatus.Stopped)
            await _proxyService.StopGameAsync(gameId);
        await _configService.DeleteConfigAsync(gameId);
        return new ManagementResponse(true, "deleteGame");
    }

    private async Task<ManagementResponse> StartGameAsync(JsonElement request, string remoteProxyAddress)
    {
        GameConfig? game = await FindGameAsync(GetString(request, "gameId"), GetString(request, "name"));
        if (game == null)
            return new ManagementResponse(false, "startGame", Error: "game not found");
        ApplyGameProxyClientAuthorization(game, _serverConfig.AllowedIpAddresses, remoteProxyAddress);
        await _configService.SaveConfigAsync(game);
        bool started = await _proxyService.StartGameAsync(game);
        return new ManagementResponse(true, "startGame", new
        {
            game.Id,
            game.Name,
            game.ListenPort,
            game.ExternalAddress,
            Started = started,
            Status = _proxyService.GetGameStatus(game.Id).ToString(),
        });
    }

    private async Task<ManagementResponse> StopGameAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "stopGame", Error: "missing gameId");
        if (_proxyService.GetGameStatus(gameId) != GameStatus.Stopped)
            await _proxyService.StopGameAsync(gameId);
        return new ManagementResponse(true, "stopGame");
    }

    private async Task<object> BuildScriptListAsync(JsonElement request)
    {
        GameConfig? game = await FindGameAsync(GetString(request, "gameId"), GetString(request, "name"));
        string scriptDirectory = game?.ScriptDirectory ?? await _configService.GetScriptsDirectoryAsync();
        if (string.IsNullOrWhiteSpace(scriptDirectory))
            scriptDirectory = AppPaths.DefaultScriptDir;
        if (!Directory.Exists(scriptDirectory))
            return Array.Empty<object>();

        string root = Path.GetFullPath(scriptDirectory);
        string[] extensions = [".cts", ".ts", ".py"];
        return Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
            .Where(path => extensions.Contains(Path.GetExtension(path), StringComparer.OrdinalIgnoreCase))
            .Select(path => new
            {
                Path = Path.GetRelativePath(root, path).Replace('\\', '/'),
                Size = new FileInfo(path).Length,
                ModifiedUtc = File.GetLastWriteTimeUtc(path),
            })
            .OrderBy(item => item.Path, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private async Task<object> BuildBotConfigListAsync()
    {
        string scriptDirectory = await _configService.GetScriptsDirectoryAsync();
        IReadOnlyList<BotConfig> bots = ProxyMenuCatalog.LoadBotConfigs(_serverConfig.ProgramDir, scriptDirectory, includeNative: false);
        return bots.Select(bot => new
        {
            bot.Alias,
            bot.Name,
            Script = bot.ScriptFiles.Count > 0 ? string.Join(", ", bot.ScriptFiles) : bot.ScriptFile,
            bot.Description,
            bot.AutoStart,
            bot.NameVar,
            bot.CommsVar,
            bot.LoginScript,
            bot.Theme,
        }).ToArray();
    }

    private async Task<ManagementResponse> SaveBotConfigAsync(JsonElement request)
    {
        if (!request.TryGetProperty("bot", out JsonElement botElement))
            return new ManagementResponse(false, "saveBotConfig", Error: "missing bot");

        string alias = SanitizeBotAlias(GetString(botElement, "alias"));
        if (string.Equals(alias, ProxyMenuCatalog.GetBotAlias(ProxyMenuCatalog.NativeMombotSectionName), StringComparison.OrdinalIgnoreCase))
            alias = "mombot";
        string name = GetString(botElement, "name").Trim();
        string script = NormalizeScriptList(GetString(botElement, "script"));
        if (string.IsNullOrWhiteSpace(alias))
            return new ManagementResponse(false, "saveBotConfig", Error: "missing bot alias");
        if (string.IsNullOrWhiteSpace(name))
            return new ManagementResponse(false, "saveBotConfig", Error: "missing bot name");
        if (string.IsNullOrWhiteSpace(script))
            return new ManagementResponse(false, "saveBotConfig", Error: "missing bot script");

        string sectionName = "bot:" + alias;
        string previousSectionName = GetString(botElement, "sectionName");
        List<TwxpConfigSection> sections = TwxpConfigStore.LoadSections(_serverConfig.ProgramDir).ToList();
        sections.RemoveAll(section =>
            string.Equals(section.Name, sectionName, StringComparison.OrdinalIgnoreCase) ||
            (!string.IsNullOrWhiteSpace(previousSectionName) &&
             string.Equals(section.Name, previousSectionName, StringComparison.OrdinalIgnoreCase)));

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Name"] = name,
            ["Script"] = script,
            ["Description"] = GetString(botElement, "description").Trim(),
            ["AutoStart"] = GetBool(botElement, "autoStart") ? "1" : "0",
            ["NameVar"] = GetString(botElement, "nameVar").Trim(),
            ["CommsVar"] = GetString(botElement, "commsVar").Trim(),
            ["LoginScript"] = GetString(botElement, "loginScript").Trim(),
            ["Theme"] = GetString(botElement, "theme").Trim(),
        };

        values.Remove("Native");
        sections.Add(new TwxpConfigSection(sectionName, values));
        TwxpConfigStore.SaveSections(_serverConfig.ProgramDir, sections);

        string gameId = GetString(request, "gameId");
        if (!string.IsNullOrWhiteSpace(gameId))
            await _proxyService.ReloadBotConfigsAsync(gameId);

        return new ManagementResponse(true, "saveBotConfig", new { Alias = alias, Name = name });
    }

    private async Task<ManagementResponse> RunScriptAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        string path = GetString(request, "path");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "runScript", Error: "missing gameId");
        if (string.IsNullOrWhiteSpace(path))
            return new ManagementResponse(false, "runScript", Error: "missing path");

        await _proxyService.LoadScriptAsync(gameId, path);
        return new ManagementResponse(true, "runScript", new { gameId, path });
    }

    private async Task<ManagementResponse> ListRunningScriptsAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "listRunningScripts", Error: "missing gameId");

        IReadOnlyList<TWXProxy.Core.RunningScriptInfo> scripts = await _proxyService.GetRunningScriptsAsync(gameId);
        return new ManagementResponse(true, "listRunningScripts", scripts.Select(script => new
        {
            script.Id,
            script.Name,
            script.Reference,
            script.Paused,
        }).ToArray());
    }

    private async Task<ManagementResponse> StopScriptAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        int scriptId = GetInt(request, "scriptId");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "stopScript", Error: "missing gameId");
        if (scriptId <= 0)
            return new ManagementResponse(false, "stopScript", Error: "missing scriptId");

        await _proxyService.StopScriptAsync(gameId, scriptId);
        return new ManagementResponse(true, "stopScript", new { gameId, scriptId });
    }

    private async Task<ManagementResponse> StopAllScriptsAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "stopAllScripts", Error: "missing gameId");

        bool includeSystemScripts = GetBool(request, "includeSystemScripts");
        await _proxyService.StopAllScriptsAsync(gameId, includeSystemScripts);
        return new ManagementResponse(true, "stopAllScripts", new { gameId, includeSystemScripts });
    }

    private async Task<ManagementResponse> SwitchBotAsync(JsonElement request)
    {
        string gameId = GetString(request, "gameId");
        string botName = GetString(request, "botName");
        if (string.IsNullOrWhiteSpace(gameId))
            return new ManagementResponse(false, "switchBot", Error: "missing gameId");
        if (string.IsNullOrWhiteSpace(botName))
            return new ManagementResponse(false, "switchBot", Error: "missing botName");

        await _proxyService.SwitchBotAsync(gameId, botName);
        return new ManagementResponse(true, "switchBot", new { gameId, botName });
    }

    private async Task<ManagementResponse> UploadFileAsync(JsonElement request, bool scriptFile, CancellationToken cancellationToken)
    {
        string relativePath = GetString(request, "path");
        string contentBase64 = GetString(request, "contentBase64");
        if (string.IsNullOrWhiteSpace(relativePath))
            return new ManagementResponse(false, scriptFile ? "uploadScript" : "uploadConfig", Error: "missing path");
        if (string.IsNullOrWhiteSpace(contentBase64))
            return new ManagementResponse(false, scriptFile ? "uploadScript" : "uploadConfig", Error: "missing contentBase64");

        string root = scriptFile
            ? await _configService.GetScriptsDirectoryAsync()
            : AppPaths.ProgramDir;
        if (string.IsNullOrWhiteSpace(root))
            root = scriptFile ? AppPaths.DefaultScriptDir : AppPaths.ProgramDir;

        string destination = ResolveSafeChildPath(root, relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        byte[] bytes = Convert.FromBase64String(contentBase64);
        await File.WriteAllBytesAsync(destination, bytes, cancellationToken);
        return new ManagementResponse(true, scriptFile ? "uploadScript" : "uploadConfig", new
        {
            Path = Path.GetRelativePath(root, destination).Replace('\\', '/'),
            Size = bytes.Length,
        });
    }

    private async Task<GameConfig?> FindGameAsync(string gameId, string name)
    {
        ObservableCollection<GameConfig> configs = await _configService.LoadConfigsAsync();
        if (!string.IsNullOrWhiteSpace(gameId))
            return configs.FirstOrDefault(config => string.Equals(config.Id, gameId, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(name))
            return configs.FirstOrDefault(config => string.Equals(config.Name, name, StringComparison.OrdinalIgnoreCase));
        return null;
    }

    private async Task<int> NextListenPortAsync()
    {
        ObservableCollection<GameConfig> configs = await _configService.LoadConfigsAsync();
        var used = configs.Select(config => config.ListenPort).Where(port => port > 0).ToHashSet();
        int port = Math.Max(1, _serverConfig.FirstGameListenPort);
        while (used.Contains(port))
            port++;
        return port;
    }

    private bool IsAddressAllowed(string address)
    {
        if (_allowedAddresses.Contains("*"))
            return true;
        return _allowedAddresses.Contains(address);
    }

    private bool IsAuthenticated(string token)
        => _tokens.Count > 0 && _tokens.Contains(token);

    internal static void ApplyGameProxyClientAuthorization(
        GameConfig game,
        IEnumerable<string> authorizedManagementAddresses,
        string managementClientAddress)
    {
        if (game == null)
            return;

        var addresses = new List<string>();
        AddProxyAuthorizationAddresses(addresses, game.ExternalAddress);
        foreach (string address in authorizedManagementAddresses)
            AddProxyAuthorizationAddresses(addresses, address);
        AddProxyAuthorizationAddresses(addresses, managementClientAddress);

        if (addresses.Count == 0)
            return;

        game.AcceptExternal = true;
        game.ExternalAddress = string.Join(" ", addresses);
    }

    private static void AddProxyAuthorizationAddresses(List<string> addresses, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        string[] parts = value.Split(
            [' ', ',', ';', '\t', '\r', '\n'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (string part in parts)
        {
            if (string.IsNullOrWhiteSpace(part))
                continue;
            AddUniqueAddress(addresses, part);
            if (IPAddress.TryParse(part, out IPAddress? parsed))
            {
                if (parsed.IsIPv4MappedToIPv6)
                    AddUniqueAddress(addresses, parsed.MapToIPv4().ToString());
                else if (parsed.AddressFamily == AddressFamily.InterNetwork)
                    AddUniqueAddress(addresses, parsed.MapToIPv6().ToString());
            }
        }
    }

    private static void AddUniqueAddress(List<string> addresses, string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        string trimmed = value.Trim();
        if (!addresses.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
            addresses.Add(trimmed);
    }

    private static string FormatProxyAddress(IPAddress? address)
    {
        if (address == null)
            return string.Empty;
        return address.IsIPv4MappedToIPv6 ? address.MapToIPv4().ToString() : address.ToString();
    }

    private static string ResolveSafeChildPath(string root, string relativePath)
    {
        string fullRoot = Path.GetFullPath(root)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        string fullPath = Path.GetFullPath(Path.Combine(fullRoot, relativePath));
        if (!fullPath.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(fullPath, fullRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("path escapes configured root");
        }

        return fullPath;
    }

    private static bool TryGetString(JsonElement element, string propertyName, out string value)
    {
        value = string.Empty;
        if (!element.TryGetProperty(propertyName, out JsonElement property))
            return false;
        if (property.ValueKind != JsonValueKind.String)
            return false;
        value = property.GetString() ?? string.Empty;
        return true;
    }

    private static string GetString(JsonElement element, string propertyName)
        => TryGetString(element, propertyName, out string value) ? value : string.Empty;

    private static string SanitizeBotAlias(string alias)
    {
        if (string.IsNullOrWhiteSpace(alias))
            return string.Empty;

        var builder = new StringBuilder(alias.Length);
        foreach (char ch in alias.Trim())
        {
            if (char.IsLetterOrDigit(ch) || ch == '_' || ch == '-' || ch == '.')
                builder.Append(ch);
        }

        return builder.ToString();
    }

    private static string NormalizeScriptList(string script)
    {
        if (string.IsNullOrWhiteSpace(script))
            return string.Empty;

        return string.Join(", ",
            script.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(item => item.Replace('\\', '/'))
                .Where(item => !string.IsNullOrWhiteSpace(item)));
    }

    private static int GetInt(JsonElement element, string propertyName)
        => element.TryGetProperty(propertyName, out JsonElement property) &&
           property.ValueKind == JsonValueKind.Number &&
           property.TryGetInt32(out int value)
            ? value
            : 0;

    private static bool GetBool(JsonElement element, string propertyName)
        => element.TryGetProperty(propertyName, out JsonElement property) &&
           property.ValueKind == JsonValueKind.True;

    private static string NormalizeAddress(IPAddress? address)
        => address == null ? string.Empty : NormalizeAddress(address.ToString());

    private static string NormalizeAddress(string? address)
    {
        if (string.IsNullOrWhiteSpace(address))
            return string.Empty;
        if (IPAddress.TryParse(address, out IPAddress? parsed))
            return parsed.MapToIPv6().ToString();
        return address.Trim();
    }

    private static Task WriteResponseAsync(StreamWriter writer, ManagementResponse response)
        => writer.WriteLineAsync(JsonSerializer.Serialize(response, JsonOptions));
}

internal sealed record ManagementResponse(
    bool Ok,
    string Action,
    object? Result = null,
    string? Error = null);
