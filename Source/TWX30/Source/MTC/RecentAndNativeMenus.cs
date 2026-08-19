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
    /// <summary>Adds path to recent list, persists prefs, rebuilds the Recent submenu.</summary>
    private void AddToRecentAndSave(string path)
    {
        if (IsGeneratedPlaceholderRecentPath(path))
            return;

        if (!_appPrefs.AddRecent(path))
            return;

        _appPrefs.Save();
        RebuildRecentMenu();
    }

    private void PersistOpenMtcTabsToRecents()
    {
        if (_boundMtcTab is not null)
            CaptureMtcTabSession(_boundMtcTab);

        var openTabPaths = _mtcTabs
            .Where(tab => tab.IsLiveSession &&
                          !string.IsNullOrWhiteSpace(tab.CurrentProfilePath) &&
                          !IsGeneratedPlaceholderRecentPath(tab.CurrentProfilePath))
            .OrderBy(tab => tab.Id == _activeMtcTabId ? 0 : 1)
            .ThenBy(tab => _mtcTabs.IndexOf(tab))
            .Select(tab => tab.CurrentProfilePath!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        bool changed = false;
        for (int i = openTabPaths.Length - 1; i >= 0; i--)
            changed |= _appPrefs.AddRecent(openTabPaths[i]);

        if (changed)
            _appPrefs.Save();
    }

    /// <summary>Rebuilds the items inside the Recent submenu from <see cref="_appPrefs"/>.</summary>
    private void RebuildRecentMenu(bool force = false)
    {
        RecordMtcPerf(ActiveMtcTab, force ? "menu.recent.rebuild.force" : "menu.recent.rebuild");
        if (MtcPerfSwitches.DisableMenus)
        {
            RecordMtcSubsystemSkipped(ActiveMtcTab, "menus");
            return;
        }

        if ((_recentMenuOpen || AreSharedMenusOpen) && !force)
        {
            _recentMenuRebuildPending = true;
            _viewClearRecents.IsEnabled = _appPrefs.RecentFiles.Count > 0;
            return;
        }

        _recentMenuRebuildPending = false;
        int removed = _appPrefs.RecentFiles.RemoveAll(path => IsGeneratedPlaceholderRecentPath(path));
        if (removed > 0)
            _appPrefs.Save();

        var items = new List<object>();
        foreach (var path in _appPrefs.RecentFiles)
        {
            if (IsRecentGameOpenInAnotherProcess(path))
                continue;

            var p    = path;  // capture
            var name = Path.GetFileNameWithoutExtension(p);
            if (string.IsNullOrWhiteSpace(name))
                name = Path.GetFileName(p);
            var item = new MenuItem { Header = EscapeMenuHeaderText(name) };
            ToolTip.SetTip(item, p);
            item.Click += (_, _) =>
            {
                var owner = ActiveMtcTab;
                _ = ExecuteInOptionalMtcTabSessionAsync(owner, () => OpenRecentAsync(p));
            };
            items.Add(item);
        }
        if (items.Count == 0)
            items.Add(new MenuItem { Header = "(none)", IsEnabled = false });

        _recentMenu.ItemsSource = items;
        _viewClearRecents.IsEnabled = _appPrefs.RecentFiles.Count > 0;
        RequestNativeAppMenuRefresh();
    }

    private static bool IsRecentGameOpenInAnotherProcess(string path)
    {
        if (string.IsNullOrWhiteSpace(path) ||
            !Path.GetExtension(path).Equals(".json", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        try
        {
            string lockFilePath = Core.GameFileLock.GetLockFilePath(path);
            Core.GameFileLock.Info? info = Core.GameFileLock.TryInspect(lockFilePath);
            if (info?.Pid is not int pid || !info.IsProcessRunning)
                return false;

            return pid != Environment.ProcessId;
        }
        catch
        {
            return false;
        }
    }

    private void OnRecentMenuOpened()
    {
        _recentMenuOpen = true;
        RebuildRecentMenu(force: true);
    }

    private void OnRecentMenuClosed()
    {
        _recentMenuOpen = false;
        QueueDeferredSharedMenuFlush();
    }

    private bool AreSharedMenusOpen => _openSharedMenus.Count > 0;

    private void TrackSharedMenuOpenState(MenuItem menuItem, Action? opened = null, Action? closed = null)
    {
        menuItem.PropertyChanged += (_, e) =>
        {
            if (e.Property != MenuItem.IsSubMenuOpenProperty)
                return;

            if (menuItem.IsSubMenuOpen)
            {
                _openSharedMenus.Add(menuItem);
                opened?.Invoke();
            }
            else
            {
                _openSharedMenus.Remove(menuItem);
                closed?.Invoke();
                QueueDeferredSharedMenuFlush();
            }
        };
    }

    private void QueueDeferredSharedMenuFlush()
    {
        Dispatcher.UIThread.Post(FlushDeferredSharedMenuRefreshes, DispatcherPriority.Background);
    }

    private void FlushDeferredSharedMenuRefreshes()
    {
        if (!Dispatcher.UIThread.CheckAccess())
        {
            Dispatcher.UIThread.Post(FlushDeferredSharedMenuRefreshes, DispatcherPriority.Background);
            return;
        }

        if (AreSharedMenusOpen)
            return;

        if (_recentMenuRebuildPending)
            RebuildRecentMenu(force: true);

        if (_proxyMenuRebuildPending)
        {
            _proxyMenuRebuildPending = false;
            RebuildProxyMenu(force: true);
        }

        if (_scriptsMenuRebuildPending)
        {
            _scriptsMenuRebuildPending = false;
            RebuildScriptsMenu(force: true);
        }

        if (_aiMenuRebuildPending)
        {
            _aiMenuRebuildPending = false;
            RebuildAiMenu(force: true);
        }

        if (_nativeMenuRefreshPending)
        {
            _nativeMenuRefreshPending = false;
            RequestNativeAppMenuRefresh(force: true);
            RequestNativeDockMenuRefresh(force: true);
        }

        if (_tabStripRefreshPending)
        {
            _tabStripRefreshPending = false;
            RefreshMtcTabStrip(force: true);
        }

        if (_focusTerminalAfterSharedMenuClose)
        {
            _focusTerminalAfterSharedMenuClose = false;
            FocusActiveTerminal();
        }
    }

    private void RequestNativeAppMenuRefresh(bool force = false)
    {
        if (!OperatingSystem.IsMacOS())
            return;

        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(() => RequestNativeAppMenuRefresh(force), DispatcherPriority.Background);
            return;
        }

        if (force)
        {
            RefreshNativeAppMenu(force: true);
            return;
        }

        if (Interlocked.Exchange(ref _nativeAppMenuRefreshScheduled, 1) == 1)
            return;

        Dispatcher.UIThread.Post(() =>
        {
            Interlocked.Exchange(ref _nativeAppMenuRefreshScheduled, 0);
            RefreshNativeAppMenu();
        }, DispatcherPriority.Background);
    }

    private void RequestNativeDockMenuRefresh(bool force = false)
    {
        if (!OperatingSystem.IsMacOS())
            return;

        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(() => RequestNativeDockMenuRefresh(force), DispatcherPriority.Background);
            return;
        }

        if (force)
        {
            RefreshNativeDockMenu(force: true);
            return;
        }

        if (Interlocked.Exchange(ref _nativeDockMenuRefreshScheduled, 1) == 1)
            return;

        Dispatcher.UIThread.Post(() =>
        {
            Interlocked.Exchange(ref _nativeDockMenuRefreshScheduled, 0);
            RefreshNativeDockMenu();
        }, DispatcherPriority.Background);
    }

    private void RefreshNativeAppMenu(bool force = false)
    {
        if (!OperatingSystem.IsMacOS())
            return;

        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(() => RefreshNativeAppMenu(force), DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (AreSharedMenusOpen && !force)
        {
            _nativeMenuRefreshPending = true;
            return;
        }

        if (!_nativeAppMenuReady)
            return;

        int signature = BuildNativeAppMenuSignature();
        if (!force && _nativeAppMenuAttached && _nativeAppMenuSignatureValid && signature == _nativeAppMenuSignature)
            return;

        _nativeAppMenuSignature = signature;
        _nativeAppMenuSignatureValid = true;

        _nativeAppMenu.Items.Clear();
        foreach (object? item in _menuBar.Items)
        {
            if (item is MenuItem menuItem && !menuItem.IsVisible)
                continue;

            NativeMenuItemBase? nativeItem = ConvertToNativeMenuItem(item);
            if (nativeItem != null)
                _nativeAppMenu.Add(nativeItem);
        }

        if (!_nativeAppMenuAttached)
        {
            NativeMenu.SetMenu(this, _nativeAppMenu);
            _nativeAppMenuAttached = true;
        }
    }

    private void RefreshNativeDockMenu(bool force = false)
    {
        if (!OperatingSystem.IsMacOS())
            return;

        if (!Dispatcher.UIThread.CheckAccess())
        {
            PostToCurrentMtcTabSession(() => RefreshNativeDockMenu(force), DispatcherPriority.Background);
            return;
        }

        if (!PrepareMtcTabVisualRefresh())
            return;

        if (AreSharedMenusOpen && !force)
        {
            _nativeMenuRefreshPending = true;
            return;
        }

        if (!_nativeAppMenuReady)
            return;

        int signature = BuildNativeDockMenuSignature();
        if (!force && _nativeDockMenuAttached && _nativeDockMenuSignatureValid && signature == _nativeDockMenuSignature)
            return;

        _nativeDockMenuSignature = signature;
        _nativeDockMenuSignatureValid = true;

        _nativeDockMenu.Items.Clear();
        AddDockRoot(_scriptsMenu, "_Scripts");
        AddDockRoot(_proxyMenu, "_Proxy");
        AddDockRoot(_botMenu, "_Bot");
        AddDockRoot(_quickMenu, "_Quick");
        AddDockRoot(_toolsMenu, "_Tools");
        AddDockRoot(_aiMenu, "_Chat");

        if (!_nativeDockMenuAttached)
        {
            NativeDock.SetMenu(this, _nativeDockMenu);
            _nativeDockMenuAttached = true;
        }
    }

    private int BuildNativeAppMenuSignature()
    {
        var hash = new HashCode();
        hash.Add("app");
        AppendNativeMenuItemsSignature(ref hash, _menuBar.Items, 0);
        return hash.ToHashCode();
    }

    private int BuildNativeDockMenuSignature()
    {
        var hash = new HashCode();
        hash.Add("dock");
        AppendNativeMenuItemSignature(ref hash, _scriptsMenu, 0);
        AppendNativeMenuItemSignature(ref hash, _proxyMenu, 0);
        AppendNativeMenuItemSignature(ref hash, _botMenu, 0);
        AppendNativeMenuItemSignature(ref hash, _quickMenu, 0);
        AppendNativeMenuItemSignature(ref hash, _toolsMenu, 0);
        AppendNativeMenuItemSignature(ref hash, _aiMenu, 0);
        return hash.ToHashCode();
    }

    private static void AppendNativeMenuItemsSignature(ref HashCode hash, IEnumerable? items, int depth)
    {
        if (depth > 12)
        {
            hash.Add("max-depth");
            return;
        }

        if (items == null)
        {
            hash.Add("null-items");
            return;
        }

        int count = 0;
        foreach (object? item in items)
        {
            count++;
            switch (item)
            {
                case null:
                    hash.Add("null");
                    break;
                case Separator:
                    hash.Add("separator");
                    break;
                case MenuItem menuItem:
                    AppendNativeMenuItemSignature(ref hash, menuItem, depth);
                    break;
                default:
                    hash.Add("object");
                    hash.Add(item.GetType().FullName);
                    hash.Add(item.ToString());
                    break;
            }
        }

        hash.Add(count);
    }

    private static void AppendNativeMenuItemSignature(ref HashCode hash, MenuItem menuItem, int depth)
    {
        hash.Add("menu-item");
        hash.Add(menuItem.Header?.ToString() ?? string.Empty);
        hash.Add(menuItem.IsVisible);
        hash.Add(menuItem.IsEnabled);
        hash.Add(menuItem.ToggleType);
        hash.Add(menuItem.IsChecked);
        AppendNativeMenuItemsSignature(ref hash, GetNativeMenuItemChildren(menuItem), depth + 1);
    }

    private static IEnumerable? GetNativeMenuItemChildren(MenuItem menuItem)
    {
        if (menuItem.ItemsSource is IEnumerable source && source is not string)
            return source;

        return menuItem.Items;
    }

    private void AddDockRoot(MenuItem sourceMenu, string header)
    {
        if (!sourceMenu.IsVisible)
            return;

        var dockRoot = new MenuItem
        {
            Header = header,
            ItemsSource = sourceMenu.ItemsSource,
            IsEnabled = sourceMenu.IsEnabled,
            IsVisible = sourceMenu.IsVisible,
        };

        NativeMenuItemBase? nativeItem = ConvertToNativeMenuItem(dockRoot);
        if (nativeItem != null)
            _nativeDockMenu.Add(nativeItem);
    }

    private static NativeMenuItemBase? ConvertToNativeMenuItem(object? item)
    {
        if (item is Separator)
            return new NativeMenuItemSeparator();

        if (item is not MenuItem menuItem)
            return null;

        var nativeItem = new NativeMenuItem
        {
            Header = NormalizeNativeMenuHeader(menuItem.Header?.ToString()),
            IsEnabled = menuItem.IsEnabled,
            IsVisible = menuItem.IsVisible,
        };

        var children = GetMenuChildren(menuItem)
            .Select(ConvertToNativeMenuItem)
            .Where(child => child != null)
            .Cast<NativeMenuItemBase>()
            .ToList();

        if (children.Count > 0)
        {
            var submenu = new NativeMenu();
            foreach (NativeMenuItemBase child in children)
                submenu.Add(child);
            nativeItem.Menu = submenu;
        }
        else
        {
            nativeItem.Click += (_, _) =>
                menuItem.RaiseEvent(new Avalonia.Interactivity.RoutedEventArgs(MenuItem.ClickEvent));
        }

        return nativeItem;
    }

    private static IEnumerable<object?> GetMenuChildren(MenuItem menuItem)
    {
        if (menuItem.ItemsSource is IEnumerable source)
        {
            foreach (object? item in source)
                yield return item;
            yield break;
        }

        foreach (object? item in menuItem.Items)
            yield return item;
    }

    private static string NormalizeNativeMenuHeader(string? header)
    {
        if (string.IsNullOrWhiteSpace(header))
            return string.Empty;

        var sb = new System.Text.StringBuilder(header.Length);
        for (int i = 0; i < header.Length; i++)
        {
            if (header[i] != '_')
            {
                sb.Append(header[i]);
                continue;
            }

            if (i + 1 < header.Length && header[i + 1] == '_')
            {
                sb.Append('_');
                i++;
            }
        }

        return sb.ToString();
    }

    private static string EscapeMenuHeaderText(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        return text.Replace("_", "__");
    }

    /// <summary>Opens a recently used game config or database directly (no file picker, no connect).</summary>
    private async Task OpenRecentAsync(string path)
    {
        try
        {
            _menuBar.Close();
            if (!File.Exists(path))
            {
                await ShowMessageAsync("File Not Found",
                    $"The file\n{path}\nno longer exists.\n\nIt will be removed from the recent list.");
                _appPrefs.RecentFiles.Remove(path);
                _appPrefs.Save();
                RebuildRecentMenu();
                return;
            }

            await OpenPathAsync(path, addToRecent: true, allowReplaceConnectedTab: true);
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.OpenRecent] failed path='{path}': {ex}\n");
            Core.GlobalModules.FlushDebugLog();
            await ShowMessageAsync("Open Recent Failed", ex.Message);
        }
    }

}
