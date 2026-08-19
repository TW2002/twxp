using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private sealed record StartupTabRecoveryCandidate(
        string ConfigPath,
        string LockFilePath,
        string DisplayName,
        bool CanRecover);

    private bool _startupTabRecoveryChecked;

    private async Task RecoverPreviousOpenTabsOnStartupAsync()
    {
        if (_startupTabRecoveryChecked)
            return;

        _startupTabRecoveryChecked = true;

        try
        {
            IReadOnlyList<StartupTabRecoveryCandidate> candidates = FindStaleStartupTabLocks();
            if (candidates.Count == 0)
                return;

            int recoverableCount = candidates.Count(candidate => candidate.CanRecover);
            if (recoverableCount == 0)
            {
                DeleteStaleStartupTabLocks(candidates);
                return;
            }

            string message = BuildStartupTabRecoveryMessage(candidates.Where(candidate => candidate.CanRecover));
            bool recover = await ShowConfirmAsync(
                "Recover previous open tabs?",
                message,
                "Yes",
                "No");

            if (!recover)
            {
                DeleteStaleStartupTabLocks(candidates);
                return;
            }

            await RecoverStartupTabsAsync(candidates.Where(candidate => candidate.CanRecover).ToArray());
            DeleteStaleStartupTabLocks(candidates);
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.StartupRecovery] failed: {ex}\n");
            Core.GlobalModules.FlushDebugLog();
        }
    }

    private IReadOnlyList<StartupTabRecoveryCandidate> FindStaleStartupTabLocks()
    {
        var candidates = new List<StartupTabRecoveryCandidate>();
        string gamesDir = AppPaths.TwxproxyGamesDir;
        if (!Directory.Exists(gamesDir))
            return candidates;

        foreach (string lockFilePath in Directory.EnumerateFiles(gamesDir, "*.json.lock", SearchOption.TopDirectoryOnly))
        {
            Core.GameFileLock.Info? info = Core.GameFileLock.TryInspect(lockFilePath);
            if (info?.Pid == null || info.IsProcessRunning)
                continue;

            string? configPath = ResolveConfigPathForStartupLock(lockFilePath, info);
            if (string.IsNullOrWhiteSpace(configPath))
                continue;

            bool canRecover = File.Exists(configPath);
            string displayName = canRecover
                ? Path.GetFileNameWithoutExtension(configPath)
                : Path.GetFileName(lockFilePath);
            candidates.Add(new StartupTabRecoveryCandidate(
                Path.GetFullPath(configPath),
                Path.GetFullPath(lockFilePath),
                displayName,
                canRecover));
        }

        return candidates
            .GroupBy(candidate => candidate.LockFilePath, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderBy(candidate => candidate.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string? ResolveConfigPathForStartupLock(string lockFilePath, Core.GameFileLock.Info info)
    {
        string fullLockPath = Path.GetFullPath(lockFilePath);
        string companionConfigPath = fullLockPath.EndsWith(".lock", StringComparison.OrdinalIgnoreCase)
            ? fullLockPath[..^".lock".Length]
            : string.Empty;

        if (companionConfigPath.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return companionConfigPath;

        if (!string.IsNullOrWhiteSpace(info.ConfigPath) &&
            info.ConfigPath.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return Path.GetFullPath(info.ConfigPath);
        }

        return null;
    }

    private static string BuildStartupTabRecoveryMessage(IEnumerable<StartupTabRecoveryCandidate> candidates)
    {
        string[] names = candidates
            .Select(candidate => candidate.DisplayName)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Take(8)
            .ToArray();

        string suffix = names.Length == 0
            ? string.Empty
            : Environment.NewLine + Environment.NewLine + string.Join(Environment.NewLine, names.Select(name => "- " + name));

        return "MTC found game tabs that were not closed cleanly." +
               Environment.NewLine +
               Environment.NewLine +
               "Recover previous open tabs?" +
               suffix;
    }

    private async Task RecoverStartupTabsAsync(IReadOnlyList<StartupTabRecoveryCandidate> candidates)
    {
        int opened = 0;
        foreach (StartupTabRecoveryCandidate candidate in candidates)
        {
            if (opened > 0 || !IsBlankStartupLiveTab(ActiveMtcTab))
                CreateStagedMtcTab();

            MtcTabPrototype? targetTab = ActiveMtcTab;
            if (targetTab == null)
                continue;

            try
            {
                await ExecuteInOptionalMtcTabSessionAsync(targetTab, () => OpenPathAsync(candidate.ConfigPath, addToRecent: true));
                opened++;
            }
            catch (Exception ex)
            {
                Core.GlobalModules.DebugLog($"[MTC.StartupRecovery] failed config='{candidate.ConfigPath}': {ex}\n");
                Core.GlobalModules.FlushDebugLog();
                await ShowMessageAsync("Recover Tab Failed", $"Could not recover {candidate.DisplayName}:\n{ex.Message}");
            }
        }

        if (opened > 0)
            Dispatcher.UIThread.Post(() => RefreshMtcTabStrip(), DispatcherPriority.Background);
    }

    private static bool IsBlankStartupLiveTab(MtcTabPrototype? tab)
    {
        if (tab is not { IsLiveSession: true })
            return false;

        return tab.SessionDb == null &&
               tab.GameInstance == null &&
               string.IsNullOrWhiteSpace(tab.CurrentProfilePath) &&
               string.IsNullOrWhiteSpace(tab.EmbeddedGameName) &&
               !tab.State.Connected;
    }

    private static void DeleteStaleStartupTabLocks(IEnumerable<StartupTabRecoveryCandidate> candidates)
    {
        foreach (StartupTabRecoveryCandidate candidate in candidates)
            Core.GameFileLock.TryRemoveIfStale(candidate.LockFilePath);
    }
}
