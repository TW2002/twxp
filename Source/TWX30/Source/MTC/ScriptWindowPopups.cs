using Avalonia.Controls;
using Avalonia.Threading;
using TWXProxy.Core;

namespace MTC;

// Alternate presentation of the same per-tab windows; scripts keep their handles.
internal sealed class ScriptWindowPopups : IDisposable
{
    private readonly DockedScriptWindows _windows;
    private readonly Action<Window> _register;
    private readonly Dictionary<IScriptWindow, ScriptPopupWindow> _popups = [];
    private volatile bool _enabled;
    private bool _disposed;
    private int _queued;

    public ScriptWindowPopups(DockedScriptWindows windows, Action<Window> register)
    {
        _windows = windows;
        _register = register;
        _windows.Changed += QueueRefresh;
    }

    public void SetEnabled(bool enabled)
    {
        _enabled = enabled;
        Refresh();
    }

    private void QueueRefresh()
    {
        if (!_enabled || Interlocked.Exchange(ref _queued, 1) != 0) return;
        Dispatcher.UIThread.Post(() =>
        {
            Interlocked.Exchange(ref _queued, 0);
            if (!_disposed) Refresh();
        });
    }

    private void Refresh()
    {
        var entries = _enabled && !_disposed ? _windows.Snapshot() : [];
        foreach (var pair in _popups.ToArray())
        {
            if (entries.Any(e => e.Window == pair.Key)) continue;
            _popups.Remove(pair.Key);
            pair.Value.Close();
        }
        foreach (var entry in entries)
        {
            var handle = entry.Window;
            if (!_popups.TryGetValue(handle, out var popup))
            {
                popup = new ScriptPopupWindow(handle.Name, handle.Title, handle.Width, handle.Height, handle.OnTop);
                _popups.Add(handle, popup);
                popup.Closed += (_, _) =>
                {
                    if (_popups.Remove(handle)) handle.Hide();
                };
                _register(popup);
                popup.SetContent(entry.Text);
                popup.Show();
            }
            else popup.SetContent(entry.Text);
        }
    }

    public void Dispose()
    {
        _disposed = true;
        _enabled = false;
        _windows.Changed -= QueueRefresh;
        Refresh();
    }
}
