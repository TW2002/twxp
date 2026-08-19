using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Avalonia;
using Avalonia.Platform;
using Avalonia.Platform.Storage;
using SkiaSharp;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    // ── Scripts menu ───────────────────────────────────────────────────────

    // Pure-data tree node — produced on the background thread, no Avalonia types.
    private sealed record ScriptNode(
        bool   IsDir,
        string Name,
        string RelPath,   // empty for dirs
        string Extension,
        IReadOnlyList<ScriptNode> Children);

    /// <summary>
    /// Rebuilds the Scripts top-level menu from the configured scripts directory.
    /// Disk scanning runs on a background thread; MenuItem objects are created
    /// on the UI thread in the continuation.
    /// </summary>
    private void RebuildScriptsMenu(bool force = false)
    {
        RecordMtcPerf(PeekCurrentMtcTabContext() ?? ActiveMtcTab, force ? "menu.scripts.rebuild.force" : "menu.scripts.rebuild");
        if (MtcPerfSwitches.DisableMenus)
        {
            RecordMtcSubsystemSkipped(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "menus");
            return;
        }

        if (!Dispatcher.UIThread.CheckAccess())
        {
            RecordMtcUiPost(PeekCurrentMtcTabContext() ?? ActiveMtcTab, "menu.scripts.rebuild", DispatcherPriority.Background);
            PostToCurrentMtcTabSession(() => RebuildScriptsMenu(force), DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (AreSharedMenusOpen && !force)
        {
            _scriptsMenuRebuildPending = true;
            _nativeMenuRefreshPending = true;
            return;
        }

        _scriptsMenuRebuildPending = false;

        var owner = CurrentMtcTabContext();
        bool canRunProxyScripts = CanRunProxyScripts();
        _scriptsMenu.IsEnabled = canRunProxyScripts;
        var reloadItem = new MenuItem { Header = "_Reload All Scripts" };
        reloadItem.Click += (_, _) => RebuildScriptsMenu(force: true);
        var stopPythonScriptsItem = new MenuItem
        {
            Header = "Stop Running _Python Scripts",
            IsEnabled = _pythonScripts.HasRunningScripts,
        };
        stopPythonScriptsItem.Click += async (_, _) =>
        {
            await ExecuteInActiveMtcTabSessionAsync(async () =>
            {
                await _pythonScripts.StopAllAsync();
                _parser.Feed("\x1b[1;36m[Stopped Python scripts]\x1b[0m\r\n");
                _buffer.Dirty = true;
                RebuildScriptsMenu(force: true);
            });
        };

        if (!canRunProxyScripts)
        {
            _scriptsMenu.ItemsSource = new List<object>
            {
                reloadItem, stopPythonScriptsItem, new Separator(),
                new MenuItem { Header = "Proxy scripts unavailable", IsEnabled = false },
            };
            RequestNativeAppMenuRefresh();
            return;
        }

        if (IsManagedRemoteProxyGame() && TryGetCurrentProxyManagementClient(out ProxyManagementClient? remoteClient))
        {
            _scriptsMenu.ItemsSource = new List<object>
            {
                reloadItem, stopPythonScriptsItem, new Separator(),
                new MenuItem { Header = "Loading remote scripts...", IsEnabled = false },
            };

            string gameId = _state.RemoteProxyGameId;
            _ = Task.Run(async () => await remoteClient!.ListScriptsAsync(gameId))
                .ContinueWith(t =>
                {
                    ExecuteInOptionalMtcTabSession(owner, () =>
                    {
                        if (!PrepareMtcTabVisualRefresh())
                            return;

                        var items = new List<object> { reloadItem, stopPythonScriptsItem, new Separator() };
                        if (t.IsFaulted)
                        {
                            items.Add(new MenuItem { Header = "Remote script list failed", IsEnabled = false });
                        }
                        else if (t.Result.Count == 0)
                        {
                            items.Add(new MenuItem { Header = "(no remote scripts found)", IsEnabled = false });
                        }
                        else
                        {
                            BuildRemoteScriptMenuItems(items, t.Result);
                        }

                        _scriptsMenu.ItemsSource = items;
                        RequestNativeAppMenuRefresh();
                    });
                }, TaskScheduler.FromCurrentSynchronizationContext());
            return;
        }

        var dir = _appPrefs.ScriptsDirectory;

        if (string.IsNullOrWhiteSpace(dir) || !Directory.Exists(dir))
        {
            var msg = !string.IsNullOrWhiteSpace(dir)
                ? "Scripts directory not found"
                : "No scripts directory configured";
            _scriptsMenu.ItemsSource = new List<object>
            {
                reloadItem, stopPythonScriptsItem, new Separator(),
                new MenuItem { Header = msg, IsEnabled = false },
            };
            RequestNativeAppMenuRefresh();
            return;
        }

        // Show placeholder while scanning
        _scriptsMenu.ItemsSource = new List<object>
        {
            reloadItem, stopPythonScriptsItem, new Separator(),
            new MenuItem { Header = "Scanning…", IsEnabled = false },
        };

        var baseDir = dir.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar, ' ');

        _ = Task.Run(() => ScanScriptNodes(baseDir, baseDir, depth: 0))
                .ContinueWith(t =>
                {
                    ExecuteInOptionalMtcTabSession(owner, () =>
                    {
                        if (!PrepareMtcTabVisualRefresh())
                            return;

                        if (t.IsFaulted)
                            return;

                        if (AreSharedMenusOpen && !force)
                        {
                            _scriptsMenuRebuildPending = true;
                            _nativeMenuRefreshPending = true;
                            return;
                        }

                        stopPythonScriptsItem.IsEnabled = _pythonScripts.HasRunningScripts;
                        var items = new List<object> { reloadItem, stopPythonScriptsItem, new Separator() };
                        if (t.Result.Count == 0)
                            items.Add(new MenuItem { Header = "(no scripts found)", IsEnabled = false });
                        else
                            BuildMenuItems(items, t.Result);

                        _scriptsMenu.ItemsSource = items;
                        RequestNativeAppMenuRefresh();
                    });
                }, TaskScheduler.FromCurrentSynchronizationContext());
    }

    /// <summary>
    /// Pure data scan — no Avalonia/UI objects created.  Safe on any thread.
    /// Directories are listed before files at every level.
    /// </summary>
    private static List<ScriptNode> ScanScriptNodes(string dir, string baseDir, int depth)
    {
        const int MaxDepth = 5;
        var nodes = new List<ScriptNode>();

        // ── Subdirectories first ───────────────────────────────────────
        if (depth < MaxDepth)
        {
            try
            {
                var subdirs = Directory
                    .EnumerateDirectories(dir)
                    .OrderBy(d => Path.GetFileName(d), StringComparer.OrdinalIgnoreCase);

                foreach (var sub in subdirs)
                {
                    if (!DirectoryHasScripts(sub, MaxDepth - depth - 1)) continue;
                    var children = ScanScriptNodes(sub, baseDir, depth + 1);
                    if (children.Count == 0) continue;
                    nodes.Add(new ScriptNode(
                        IsDir: true, Name: Path.GetFileName(sub),
                        RelPath: string.Empty, Extension: string.Empty, Children: children));
                }
            }
            catch { /* permission denied */ }
        }

        // ── Script files ───────────────────────────────────────────────
        try
        {
            var files = Directory
                .EnumerateFiles(dir, "*.ts",  SearchOption.TopDirectoryOnly)
                .Concat(Directory.EnumerateFiles(dir, "*.cts", SearchOption.TopDirectoryOnly))
                .Concat(Directory.EnumerateFiles(dir, "*.py", SearchOption.TopDirectoryOnly))
                .OrderBy(f => Path.GetFileName(f), StringComparer.OrdinalIgnoreCase);

            foreach (var fp in files)
                nodes.Add(new ScriptNode(
                    IsDir: false, Name: Path.GetFileName(fp),
                    RelPath: StripRelativePrefix(
                               Path.GetRelativePath(baseDir, fp).Replace('\\', '/')),
                    Extension: Path.GetExtension(fp),
                    Children: []));
        }
        catch { /* permission denied */ }

        return nodes;
    }

    /// <summary>
    /// Converts data nodes into MenuItem objects.  Must run on the UI thread.
    /// </summary>
    private void BuildMenuItems(List<object> target, IReadOnlyList<ScriptNode> nodes)
    {
        foreach (var node in nodes)
        {
            if (node.IsDir)
            {
                var subItems = new List<object>();
                BuildMenuItems(subItems, node.Children);
                if (subItems.Count == 0) continue;
                var sub = new MenuItem { Header = EscapeMenuHeaderText(node.Name) };
                sub.ItemsSource = subItems;
                target.Add(sub);
            }
            else
            {
                var relPath = node.RelPath;  // capture
                var item    = new MenuItem { Header = EscapeMenuHeaderText(node.Name) };
                ToolTip.SetTip(item, relPath);
                item.Click += (_, _) =>
                {
                    if (IsPythonScriptPath(relPath))
                        _ = ExecuteInActiveMtcTabSessionAsync(() => RunPythonScriptFromMenuAsync(relPath));
                    else
                        ExecuteInActiveMtcTabSession(() => SendProxyMenuCommand($"ss {relPath}"));
                };
                target.Add(item);
            }
        }
    }

    private void BuildRemoteScriptMenuItems(List<object> target, IReadOnlyList<ProxyManagedScript> scripts)
    {
        foreach (ProxyManagedScript script in scripts.OrderBy(script => script.Path, StringComparer.OrdinalIgnoreCase))
        {
            string relPath = script.Path;
            var item = new MenuItem { Header = EscapeMenuHeaderText(relPath) };
            ToolTip.SetTip(item, $"Remote proxy script: {relPath}");
            item.Click += (_, _) =>
            {
                _ = ExecuteInActiveMtcTabSessionAsync(async () =>
                {
                    try
                    {
                        await TryRunManagedRemoteScriptAsync(relPath);
                        _parser.Feed($"\x1b[1;36m[Loaded remote script: {relPath}]\x1b[0m\r\n");
                        _buffer.Dirty = true;
                    }
                    catch (Exception ex)
                    {
                        await ShowMessageAsync("Remote Script Failed", ex.Message);
                    }

                    RebuildProxyMenu();
                    FocusActiveTerminal();
                });
            };
            target.Add(item);
        }
    }

    private void SendProxyMenuCommand(string command)
    {
        char commandChar = _embeddedGameConfig?.CommandChar is { } configured && configured != '\0'
            ? configured
            : '$';
        string line = $"{commandChar}{command}\r\n";
        _termCtrl.SendInput?.Invoke(System.Text.Encoding.Latin1.GetBytes(line));
    }

    /// <summary>Strips a leading <c>./</c> produced by <see cref="Path.GetRelativePath"/>
    /// when the file is directly inside the base directory, then trims whitespace.</summary>
    private static string StripRelativePrefix(string rel)
    {
        rel = rel.Trim();
        if (rel.StartsWith("./") || rel.StartsWith(".\\"))
            rel = rel[2..].TrimStart('/', '\\');
        return rel;
    }

    /// <summary>Returns true if <paramref name="dir"/> (or any sub-dir within
    /// <paramref name="remainingDepth"/> levels) contains at least one supported script file.</summary>
    private static bool DirectoryHasScripts(string dir, int remainingDepth)
    {
        try
        {
            if (Directory.EnumerateFiles(dir, "*.ts",  SearchOption.TopDirectoryOnly).Any()) return true;
            if (Directory.EnumerateFiles(dir, "*.cts", SearchOption.TopDirectoryOnly).Any()) return true;
            if (Directory.EnumerateFiles(dir, "*.py", SearchOption.TopDirectoryOnly).Any()) return true;
            if (remainingDepth > 0)
                foreach (var sub in Directory.EnumerateDirectories(dir))
                    if (DirectoryHasScripts(sub, remainingDepth - 1)) return true;
        }
        catch { /* ignore */ }
        return false;
    }

    private static bool IsPythonScriptPath(string relPath)
        => string.Equals(Path.GetExtension(relPath), ".py", StringComparison.OrdinalIgnoreCase);

}
