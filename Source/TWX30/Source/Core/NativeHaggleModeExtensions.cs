using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;

namespace TWXProxy.Core;

public enum NativeHaggleTradeKind
{
    Port,
    Planet,
}

public sealed class NativeHaggleModeInfo
{
    public NativeHaggleModeInfo(
        string id,
        string displayName,
        bool isBuiltIn,
        bool supportsPortTrades = true,
        bool supportsPlanetTrades = false)
    {
        Id = NativeHaggleModes.Normalize(id);
        DisplayName = string.IsNullOrWhiteSpace(displayName) ? Id : displayName;
        IsBuiltIn = isBuiltIn;
        SupportsPortTrades = supportsPortTrades;
        SupportsPlanetTrades = supportsPlanetTrades;
    }

    public string Id { get; }
    public string DisplayName { get; }
    public bool IsBuiltIn { get; }
    public bool SupportsPortTrades { get; }
    public bool SupportsPlanetTrades { get; }

    public bool SupportsTradeKind(NativeHaggleTradeKind tradeKind) =>
        tradeKind == NativeHaggleTradeKind.Planet ? SupportsPlanetTrades : SupportsPortTrades;
}

internal abstract class NativeHaggleModeExtension
{
    protected NativeHaggleModeExtension(
        string id,
        string displayName,
        bool supportsPortTrades = true,
        bool supportsPlanetTrades = false)
    {
        ModeInfo = new NativeHaggleModeInfo(
            id,
            displayName,
            isBuiltIn: false,
            supportsPortTrades: supportsPortTrades,
            supportsPlanetTrades: supportsPlanetTrades);
    }

    public NativeHaggleModeInfo ModeInfo { get; }
    public bool SupportsPortTrades => ModeInfo.SupportsPortTrades;
    public bool SupportsPlanetTrades => ModeInfo.SupportsPlanetTrades;

    public bool SupportsTradeKind(NativeHaggleTradeKind tradeKind) => ModeInfo.SupportsTradeKind(tradeKind);

    public abstract long ComputeBid(NativeHaggleEngine engine, NativeHaggleEngine.SessionState session, long offer);

    public virtual void OnOutcome(NativeHaggleEngine engine, NativeHaggleEngine.SessionState session, bool success, string reason)
    {
    }

    public virtual string DescribeState(NativeHaggleEngine engine, NativeHaggleEngine.SessionState session) => "modeState=n/a";
}

internal static class NativeHaggleModeCatalog
{
    private static readonly IReadOnlyList<NativeHaggleModeInfo> BuiltIns = new[]
    {
        new NativeHaggleModeInfo(NativeHaggleModes.ClampHeuristic, "EPHaggle", isBuiltIn: true, supportsPortTrades: true, supportsPlanetTrades: false),
        new NativeHaggleModeInfo(NativeHaggleModes.ServerDerived, "Enhanced Haggle", isBuiltIn: true, supportsPortTrades: true, supportsPlanetTrades: false),
        new NativeHaggleModeInfo(NativeHaggleModes.BlendHeuristic, "Blend Heuristic", isBuiltIn: true, supportsPortTrades: true, supportsPlanetTrades: false),
        new NativeHaggleModeInfo(NativeHaggleModes.Baseline, "Baseline", isBuiltIn: true, supportsPortTrades: true, supportsPlanetTrades: false),
        new NativeHaggleModeInfo(NativeHaggleModes.Aggressive, "Aggressive", isBuiltIn: true, supportsPortTrades: true, supportsPlanetTrades: true),
        new NativeHaggleModeInfo(NativeHaggleModes.CherokeePlanet, "Cherokee Planet", isBuiltIn: true, supportsPortTrades: false, supportsPlanetTrades: true),
    };

    public static IReadOnlyList<NativeHaggleModeInfo> GetBuiltIns() => BuiltIns;

    public static IReadOnlyList<NativeHaggleModeInfo> GetBuiltIns(NativeHaggleTradeKind tradeKind) =>
        BuiltIns.Where(info => info.SupportsTradeKind(tradeKind)).ToList();

    public static IReadOnlyList<NativeHaggleModeInfo> GetAvailableModes(IEnumerable<NativeHaggleModeExtension> extensions)
    {
        var modes = new List<NativeHaggleModeInfo>(BuiltIns);
        modes.AddRange(extensions
            .Select(extension => extension.ModeInfo)
            .OrderBy(info => info.DisplayName, StringComparer.OrdinalIgnoreCase));
        return modes;
    }

    public static IReadOnlyList<NativeHaggleModeInfo> GetAvailableModes(
        IEnumerable<NativeHaggleModeExtension> extensions,
        NativeHaggleTradeKind tradeKind)
    {
        return GetAvailableModes(extensions)
            .Where(info => info.SupportsTradeKind(tradeKind))
            .ToList();
    }

    public static IReadOnlyList<NativeHaggleModeInfo> GetAvailableModes(IEnumerable<NativeHaggleModeInfo> extensionModes)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var modes = new List<NativeHaggleModeInfo>(BuiltIns.Count + 4);

        foreach (NativeHaggleModeInfo mode in BuiltIns)
        {
            if (seen.Add(mode.Id))
                modes.Add(mode);
        }

        foreach (NativeHaggleModeInfo mode in extensionModes.OrderBy(info => info.DisplayName, StringComparer.OrdinalIgnoreCase))
        {
            if (seen.Add(mode.Id))
                modes.Add(mode);
        }

        return modes;
    }

    public static IReadOnlyList<NativeHaggleModeInfo> GetAvailableModes(
        IEnumerable<NativeHaggleModeInfo> extensionModes,
        NativeHaggleTradeKind tradeKind)
    {
        return GetAvailableModes(extensionModes)
            .Where(info => info.SupportsTradeKind(tradeKind))
            .ToList();
    }

    public static NativeHaggleModeInfo? GetModeInfo(string? modeId, IEnumerable<NativeHaggleModeExtension>? extensions = null)
    {
        string normalized = NativeHaggleModes.Normalize(modeId);

        NativeHaggleModeInfo? builtIn = BuiltIns.FirstOrDefault(info =>
            string.Equals(info.Id, normalized, StringComparison.OrdinalIgnoreCase));
        if (builtIn != null)
            return builtIn;

        return extensions?.Select(item => item.ModeInfo).FirstOrDefault(info =>
            string.Equals(info.Id, normalized, StringComparison.OrdinalIgnoreCase));
    }

    public static string GetDisplayName(string? modeId, IEnumerable<NativeHaggleModeExtension>? extensions = null)
    {
        string normalized = NativeHaggleModes.Normalize(modeId);
        return GetModeInfo(normalized, extensions)?.DisplayName ?? normalized;
    }
}

public static class NativeHaggleModeDiscovery
{
    private sealed class DiscoveryLoadContext : AssemblyLoadContext
    {
        private readonly AssemblyDependencyResolver _resolver;
        private readonly string _sharedAssemblyName;

        public DiscoveryLoadContext(string assemblyPath, string sharedAssemblyName)
            : base($"TWXHaggleDiscovery:{Path.GetFileNameWithoutExtension(assemblyPath)}", isCollectible: true)
        {
            _resolver = new AssemblyDependencyResolver(assemblyPath);
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

    public static IReadOnlyList<NativeHaggleModeInfo> DiscoverFromDirectories(IEnumerable<string> moduleDirectories)
    {
        var discovered = new Dictionary<string, NativeHaggleModeInfo>(StringComparer.OrdinalIgnoreCase);
        string sharedAssemblyName = typeof(NativeHaggleModeDiscovery).Assembly.GetName().Name ?? "TWXProxy";

        foreach (string assemblyPath in EnumerateCandidateAssemblies(moduleDirectories))
        {
            DiscoveryLoadContext? loadContext = null;

            try
            {
                loadContext = new DiscoveryLoadContext(assemblyPath, sharedAssemblyName);
                Assembly assembly = loadContext.LoadFromAssemblyPath(assemblyPath);

                foreach (Type type in GetLoadableTypes(assembly))
                {
                    if (!typeof(NativeHaggleModeExtension).IsAssignableFrom(type) ||
                        type.IsAbstract ||
                        type.GetConstructor(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, binder: null, Type.EmptyTypes, modifiers: null) == null)
                    {
                        continue;
                    }

                    if (Activator.CreateInstance(type, nonPublic: true) is not NativeHaggleModeExtension extension)
                        continue;

                    NativeHaggleModeInfo info = extension.ModeInfo;
                    if (!NativeHaggleModes.IsBuiltIn(info.Id))
                        discovered[info.Id] = info;

                    if (extension is IDisposable disposable)
                        disposable.Dispose();
                }
            }
            catch (BadImageFormatException)
            {
            }
            catch
            {
            }
            finally
            {
                loadContext?.Unload();
            }
        }

        return NativeHaggleModeCatalog.GetAvailableModes(discovered.Values);
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

    private static IEnumerable<Type> GetLoadableTypes(Assembly assembly)
    {
        try
        {
            return assembly.GetTypes();
        }
        catch (ReflectionTypeLoadException ex)
        {
            return ex.Types.Where(type => type != null)!;
        }
    }
}
