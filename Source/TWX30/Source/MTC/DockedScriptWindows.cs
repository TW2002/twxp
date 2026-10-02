using TWXProxy.Core;

namespace MTC;

// A factory belongs to one runtime context, never to the currently selected tab.
internal sealed class DockedScriptWindows : IScriptWindowFactory
{
    private readonly object _sync = new();
    private readonly List<DockedWindow> _visible = [];
    private DockedWindow? _active;
    public event Action? Changed;

    internal sealed record Entry(IScriptWindow Window, string Text, bool Active);

    public Entry[] Snapshot()
    {
        lock (_sync)
            return _visible.Select(w => new Entry(w, w.Content, ReferenceEquals(w, _active))).ToArray();
    }

    public IScriptWindow CreateWindow(string name, string title, int width, int height, bool onTop = false)
        => new DockedWindow(this, name, title, width, height, onTop);

    public void Select(IScriptWindow window)
    {
        lock (_sync)
        {
            if (window is not DockedWindow candidate || !_visible.Contains(candidate) || candidate == _active)
                return;
            _active = candidate;
        }
        Changed?.Invoke();
    }

    private sealed class DockedWindow(DockedScriptWindows owner, string name, string title, int width, int height, bool onTop) : IScriptWindow
    {
        public string Name => name;
        public string Title => string.IsNullOrWhiteSpace(title) ? name : title;
        public int Width => width;
        public int Height => height;
        public bool OnTop => onTop;
        internal string Content = string.Empty;
        private bool _visible;
        private bool _disposed;
        public bool IsVisible { get { lock (owner._sync) return _visible; } }
        public string TextContent
        {
            get { lock (owner._sync) return Content; }
            set
            {
                bool notify;
                lock (owner._sync)
                {
                    if (_disposed || Content == value) return;
                    Content = value ?? string.Empty;
                    notify = _visible;
                }
                if (notify) owner.Changed?.Invoke();
            }
        }

        public void Show()
        {
            lock (owner._sync)
            {
                if (_disposed || _visible) return;
                _visible = true;
                owner._visible.Add(this);
                owner._active = this;
            }
            owner.Changed?.Invoke();
        }

        public void Hide() => Remove(dispose: false);
        public void Dispose() => Remove(dispose: true);

        private void Remove(bool dispose)
        {
            lock (owner._sync)
            {
                _disposed |= dispose;
                if (!_visible) return;
                _visible = false;
                owner._visible.Remove(this);
                if (owner._active == this) owner._active = owner._visible.LastOrDefault();
            }
            owner.Changed?.Invoke();
        }
    }
}
