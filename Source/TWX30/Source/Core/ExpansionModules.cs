using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TWXProxy.Core;

[Flags]
public enum ExpansionHostTargets
{
    None = 0,
    Mtc = 1,
    Twxp = 2,
    Any = Mtc | Twxp,
}

public interface IExpansionModule
{
    string Id { get; }
    string DisplayName { get; }
    ExpansionHostTargets SupportedHosts { get; }
    Task InitializeAsync(ExpansionModuleContext context, CancellationToken cancellationToken);
    Task ShutdownAsync(CancellationToken cancellationToken);
}

public sealed class ExpansionModuleContext
{
    internal ExpansionModuleContext(
        ExpansionModuleHostOptions options,
        string moduleId,
        string moduleAssemblyPath,
        string moduleDataDirectory)
    {
        HostTargets = options.HostTargets;
        HostName = options.HostName;
        GameName = options.GameName;
        ProgramDir = options.ProgramDir;
        ScriptDirectory = options.ScriptDirectory;
        GameInstance = options.GameInstance;
        Interpreter = options.Interpreter;
        Database = options.Database;
        ModuleId = moduleId;
        ModuleAssemblyPath = moduleAssemblyPath;
        ModuleDirectory = Path.GetDirectoryName(moduleAssemblyPath) ?? Directory.GetCurrentDirectory();
        ModuleDataDirectory = moduleDataDirectory;
    }

    public ExpansionHostTargets HostTargets { get; }
    public string HostName { get; }
    public string GameName { get; }
    public string ProgramDir { get; }
    public string ScriptDirectory { get; }
    public GameInstance GameInstance { get; }
    public ModInterpreter? Interpreter { get; }
    public ModDatabase? Database { get; }
    public string ModuleId { get; }
    public string ModuleAssemblyPath { get; }
    public string ModuleDirectory { get; }
    public string ModuleDataDirectory { get; }

    public Task SendMessageAsync(string message) => GameInstance.SendMessageAsync(message);

    public Task SendToServerAsync(string text, CancellationToken cancellationToken = default)
    {
        byte[] payload = Encoding.ASCII.GetBytes(text);
        return GameInstance.SendToServerAsync(payload);
    }

    public void Log(string message)
    {
        GlobalModules.DebugLog($"[Module:{ModuleId}] {message}\n");
    }
}

public sealed class ExpansionModuleHostOptions
{
    public ExpansionHostTargets HostTargets { get; init; }
    public string HostName { get; init; } = string.Empty;
    public string GameName { get; init; } = string.Empty;
    public string ProgramDir { get; init; } = string.Empty;
    public string ScriptDirectory { get; init; } = string.Empty;
    public string ModuleDataRootDirectory { get; init; } = SharedPaths.GetModuleDataRootDir();
    public IEnumerable<string> ModuleDirectories { get; init; } = Array.Empty<string>();
    public required GameInstance GameInstance { get; init; }
    public ModInterpreter? Interpreter { get; init; }
    public ModDatabase? Database { get; init; }
}

public sealed class LoadedExpansionModuleInfo
{
    public required string Id { get; init; }
    public required string DisplayName { get; init; }
    public required string AssemblyPath { get; init; }
    public required string TypeName { get; init; }
}

public sealed class ExpansionModuleBinding<T> where T : class
{
    public required T Module { get; init; }
    public required ExpansionModuleContext Context { get; init; }
    public required LoadedExpansionModuleInfo Info { get; init; }
}

public sealed class ExpansionModuleHost : IAsyncDisposable, IDisposable
{
    private sealed class LoadedExpansionModule
    {
        public required IExpansionModule Module { get; init; }
        public required ExpansionModuleContext Context { get; init; }
        public required ExpansionModuleLoadContext LoadContext { get; init; }
        public required string AssemblyPath { get; init; }
        public required string TypeName { get; init; }
    }

    private sealed class ExpansionModuleLoadContext : AssemblyLoadContext
    {
        private readonly AssemblyDependencyResolver _resolver;
        private readonly string _sharedAssemblyName;

        public ExpansionModuleLoadContext(
            string loadAssemblyPath,
            string dependencyResolverAssemblyPath,
            string sharedAssemblyName)
            : base($"TWXModule:{Path.GetFileNameWithoutExtension(loadAssemblyPath)}", isCollectible: true)
        {
            _resolver = new AssemblyDependencyResolver(dependencyResolverAssemblyPath);
            _sharedAssemblyName = sharedAssemblyName;
        }

        protected override Assembly? Load(AssemblyName assemblyName)
        {
            if (string.Equals(assemblyName.Name, _sharedAssemblyName, StringComparison.OrdinalIgnoreCase))
                return null;

            string? path = _resolver.ResolveAssemblyToPath(assemblyName);
            return path == null ? null : LoadFromAssemblyPath(path);
        }

        protected override nint LoadUnmanagedDll(string unmanagedDllName)
        {
            string? path = _resolver.ResolveUnmanagedDllToPath(unmanagedDllName);
            return path == null ? nint.Zero : LoadUnmanagedDllFromPath(path);
        }
    }

    private readonly ExpansionModuleHostOptions _options;
    private readonly List<LoadedExpansionModule> _loadedModules = new();
    private readonly List<LoadedExpansionModuleInfo> _loadedInfos = new();
    private bool _disposed;

    private ExpansionModuleHost(ExpansionModuleHostOptions options)
    {
        _options = options;
    }

    public IReadOnlyList<LoadedExpansionModuleInfo> LoadedModules => _loadedInfos;

    public IReadOnlyList<ExpansionModuleBinding<T>> GetModules<T>() where T : class
    {
        return _loadedModules
            .Where(loaded => loaded.Module is T)
            .Select(loaded => new ExpansionModuleBinding<T>
            {
                Module = (T)loaded.Module,
                Context = loaded.Context,
                Info = _loadedInfos.First(info =>
                    string.Equals(info.AssemblyPath, loaded.AssemblyPath, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(info.TypeName, loaded.TypeName, StringComparison.Ordinal)),
            })
            .ToList();
    }

    public static async Task<ExpansionModuleHost> CreateAsync(
        ExpansionModuleHostOptions options,
        CancellationToken cancellationToken = default)
    {
        var host = new ExpansionModuleHost(options);
        await host.LoadModulesAsync(cancellationToken);
        return host;
    }

    public void Dispose()
    {
        DisposeAsync().AsTask().GetAwaiter().GetResult();
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
            return;

        _disposed = true;

        for (int i = _loadedModules.Count - 1; i >= 0; i--)
        {
            LoadedExpansionModule loaded = _loadedModules[i];
            try
            {
                await loaded.Module.ShutdownAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[Module:{loaded.Context.ModuleId}] Shutdown failed: {ex.Message}\n");
            }

            if (loaded.Module is IAsyncDisposable asyncDisposable)
            {
                try { await asyncDisposable.DisposeAsync(); } catch { }
            }
            else if (loaded.Module is IDisposable disposable)
            {
                try { disposable.Dispose(); } catch { }
            }

            loaded.LoadContext.Unload();
        }

        _loadedModules.Clear();
        _loadedInfos.Clear();
    }

    private async Task LoadModulesAsync(CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(_options.ModuleDataRootDirectory);

        foreach (string assemblyPath in EnumerateCandidateAssemblies(_options.ModuleDirectories))
        {
            cancellationToken.ThrowIfCancellationRequested();

            ExpansionModuleLoadContext? loadContext = null;
            bool loadedAny = false;

            try
            {
                string loadAssemblyPath = CreateShadowCopy(assemblyPath);
                loadContext = new ExpansionModuleLoadContext(
                    loadAssemblyPath,
                    assemblyPath,
                    typeof(ExpansionModuleHost).Assembly.GetName().Name ?? "TWXProxy");

                Assembly assembly = loadContext.LoadFromAssemblyPath(loadAssemblyPath);
                foreach (Type type in GetModuleTypes(assembly))
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    if (Activator.CreateInstance(type) is not IExpansionModule module)
                        continue;

                    if ((_options.HostTargets & module.SupportedHosts) == 0)
                    {
                        if (module is IDisposable disposable)
                            disposable.Dispose();
                        continue;
                    }

                    string moduleId = string.IsNullOrWhiteSpace(module.Id)
                        ? type.FullName ?? type.Name
                        : module.Id;
                    string safeModuleId = SharedPaths.SanitizeFileComponent(moduleId);
                    string safeHost = SharedPaths.SanitizeFileComponent(_options.HostName);
                    string safeGame = SharedPaths.SanitizeFileComponent(_options.GameName);
                    string moduleDataDir = Path.Combine(_options.ModuleDataRootDirectory, safeHost, safeGame, safeModuleId);
                    Directory.CreateDirectory(moduleDataDir);

                    var context = new ExpansionModuleContext(_options, moduleId, assemblyPath, moduleDataDir);
                    await module.InitializeAsync(context, cancellationToken);

                    loadedAny = true;
                    _loadedModules.Add(new LoadedExpansionModule
                    {
                        Module = module,
                        Context = context,
                        LoadContext = loadContext,
                        AssemblyPath = assemblyPath,
                        TypeName = type.FullName ?? type.Name,
                    });
                    _loadedInfos.Add(new LoadedExpansionModuleInfo
                    {
                        Id = moduleId,
                        DisplayName = string.IsNullOrWhiteSpace(module.DisplayName) ? moduleId : module.DisplayName,
                        AssemblyPath = assemblyPath,
                        TypeName = type.FullName ?? type.Name,
                    });

                    GlobalModules.DebugLog($"[Module:{moduleId}] Loaded from {assemblyPath}\n");
                }
            }
            catch (BadImageFormatException)
            {
                // Ignore non-.NET DLLs.
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[ModuleHost] Failed to load {assemblyPath}: {ex.Message}\n");
            }
            finally
            {
                if (!loadedAny && loadContext != null)
                    loadContext.Unload();
            }
        }
    }

    private string CreateShadowCopy(string assemblyPath)
    {
        string shadowRoot = Path.Combine(_options.ModuleDataRootDirectory, ".shadow");
        Directory.CreateDirectory(shadowRoot);
        TryPruneShadowCopies(shadowRoot);

        string fileName = Path.GetFileNameWithoutExtension(assemblyPath);
        string extension = Path.GetExtension(assemblyPath);
        string stamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff", System.Globalization.CultureInfo.InvariantCulture);
        string shadowPath = Path.Combine(shadowRoot, $"{fileName}.{stamp}.{Guid.NewGuid():N}{extension}");
        File.Copy(assemblyPath, shadowPath, overwrite: false);
        return shadowPath;
    }

    private static void TryPruneShadowCopies(string shadowRoot)
    {
        try
        {
            var directory = new DirectoryInfo(shadowRoot);
            FileInfo[] files = directory.GetFiles("*.dll")
                .OrderByDescending(file => file.LastWriteTimeUtc)
                .ToArray();

            foreach (FileInfo file in files.Skip(64))
            {
                try { file.Delete(); } catch { }
            }
        }
        catch
        {
            // Shadow copies are disposable cache files; failing to prune is harmless.
        }
    }

    private static IEnumerable<string> EnumerateCandidateAssemblies(IEnumerable<string> moduleDirectories)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (string directory in moduleDirectories.Where(path => !string.IsNullOrWhiteSpace(path)))
        {
            string fullDirectory;
            try
            {
                fullDirectory = Path.GetFullPath(directory);
            }
            catch
            {
                continue;
            }

            if (!Directory.Exists(fullDirectory))
                continue;

            foreach (string assembly in Directory.EnumerateFiles(fullDirectory, "*.dll", SearchOption.TopDirectoryOnly))
            {
                if (seen.Add(assembly))
                    yield return assembly;
            }

            foreach (string childDir in Directory.EnumerateDirectories(fullDirectory))
            {
                foreach (string assembly in Directory.EnumerateFiles(childDir, "*.dll", SearchOption.TopDirectoryOnly))
                {
                    if (seen.Add(assembly))
                        yield return assembly;
                }
            }
        }
    }

    private static IEnumerable<Type> GetModuleTypes(Assembly assembly)
    {
        IEnumerable<Type> types;
        try
        {
            types = assembly.GetTypes();
        }
        catch (ReflectionTypeLoadException ex)
        {
            types = ex.Types.Where(type => type != null)!;
        }

        return types.Where(type =>
            type != null &&
            type.IsClass &&
            !type.IsAbstract &&
            type.GetConstructor(Type.EmptyTypes) != null &&
            typeof(IExpansionModule).IsAssignableFrom(type));
    }
}
