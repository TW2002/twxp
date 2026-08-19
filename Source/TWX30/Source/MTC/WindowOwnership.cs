using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Avalonia.Controls;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    private readonly object _ownedWindowSync = new();
    private readonly List<Window> _ownedChildWindows = [];
    private readonly object _ownedProcessSync = new();
    private readonly List<Process> _ownedChildProcesses = [];
    private bool _mainWindowClosing;

    private void RegisterOwnedChildWindow(Window? window)
    {
        if (window == null || ReferenceEquals(window, this))
            return;

        lock (_ownedWindowSync)
        {
            if (_ownedChildWindows.Contains(window))
                return;

            _ownedChildWindows.Add(window);
        }

        window.Closed += OnOwnedChildWindowClosed;
    }

    private void ShowOwnedChildWindow(Window window, bool activate = true)
    {
        RegisterOwnedChildWindow(window);
        window.Show(this);

        if (activate)
            window.Activate();
    }

    private void OnOwnedChildWindowClosed(object? sender, EventArgs e)
    {
        if (sender is not Window window)
            return;

        lock (_ownedWindowSync)
            _ownedChildWindows.Remove(window);
    }

    private void CloseOwnedChildWindows()
    {
        Window[] windows;
        lock (_ownedWindowSync)
        {
            windows = _ownedChildWindows.ToArray();
            _ownedChildWindows.Clear();
        }

        foreach (Window window in windows.Reverse())
        {
            try
            {
                if (!ReferenceEquals(window, this))
                    window.Close();
            }
            catch (Exception ex)
            {
                Core.GlobalModules.DebugLog($"[MTC.WindowOwnership] failed to close child window: {ex.Message}\n");
            }
        }
    }

    private void ApplyScriptWindowStayInFrontPreference()
    {
        if (!_appPrefs.DisableScriptWindowStayInFront)
            return;

        Window[] windows;
        lock (_ownedWindowSync)
            windows = _ownedChildWindows.ToArray();

        foreach (Window window in windows)
        {
            if (window is ScriptPopupWindow scriptWindow)
                scriptWindow.Topmost = false;
        }
    }

    private void RegisterOwnedChildProcess(Process? process)
    {
        if (process == null)
            return;

        lock (_ownedProcessSync)
            _ownedChildProcesses.Add(process);

        try
        {
            process.EnableRaisingEvents = true;
            process.Exited += (_, _) =>
            {
                lock (_ownedProcessSync)
                    _ownedChildProcesses.Remove(process);
            };
        }
        catch
        {
            // Some platform process handles do not allow Exited wiring; shutdown cleanup still checks the list.
        }
    }

    private void StopOwnedChildProcesses()
    {
        Process[] processes;
        lock (_ownedProcessSync)
        {
            processes = _ownedChildProcesses.ToArray();
            _ownedChildProcesses.Clear();
        }

        foreach (Process process in processes)
        {
            try
            {
                if (!process.HasExited)
                {
                    bool closeRequested = false;
                    try
                    {
                        closeRequested = process.CloseMainWindow();
                    }
                    catch
                    {
                        closeRequested = false;
                    }

                    if (closeRequested)
                    {
                        try
                        {
                            if (process.WaitForExit(1500))
                                continue;
                        }
                        catch
                        {
                            // Fall through to hard termination below.
                        }
                    }

                    if (!process.HasExited)
                        process.Kill(entireProcessTree: true);
                }
            }
            catch (Exception ex)
            {
                Core.GlobalModules.DebugLog($"[MTC.WindowOwnership] failed to stop child process pid={SafeProcessId(process)}: {ex.Message}\n");
            }
            finally
            {
                process.Dispose();
            }
        }
    }

    private static int SafeProcessId(Process process)
    {
        try
        {
            return process.Id;
        }
        catch
        {
            return 0;
        }
    }
}
