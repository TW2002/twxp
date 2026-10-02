namespace MTC;

// One automatic opportunity per connection, not one per visit to Command.
internal sealed class OpenTwMapProbe
{
    private readonly object _sync = new();
    private bool _sawGamePrompt;
    private bool _automaticEligible;
    private bool _pending;
    private bool _commandReady;
    private bool _unsupported;
    private long _requestId;

    public bool CommandReady { get { lock (_sync) return _commandReady; } }
    public bool Unsupported { get { lock (_sync) return _unsupported; } }

    public void Reset()
    {
        lock (_sync)
            _sawGamePrompt = _automaticEligible = _pending = _commandReady = _unsupported = false;
    }

    public bool ObserveLine(string line, bool openTwDetected, out bool skippedAtLogin)
    {
        skippedAtLogin = false;
        ReadOnlySpan<char> prompt = line.AsSpan().Trim();
        lock (_sync)
        {
            if (_pending && prompt.Equals("Display Menu?", StringComparison.OrdinalIgnoreCase))
            {
                _pending = false;
                _unsupported = true;
                _commandReady = false;
                return true;
            }

            bool command = prompt.StartsWith("Command [", StringComparison.Ordinal);
            bool other = prompt.StartsWith("Citadel command (", StringComparison.OrdinalIgnoreCase) ||
                prompt.StartsWith("Planet command (", StringComparison.OrdinalIgnoreCase);
            if (command || other)
            {
                _commandReady = command;
                if (!_sawGamePrompt)
                {
                    _sawGamePrompt = true;
                    _automaticEligible = command && openTwDetected;
                    skippedAtLogin = openTwDetected && !command;
                }
            }
            return false;
        }
    }

    public bool TryBeginRequest(bool manual, out long requestId)
    {
        lock (_sync)
        {
            requestId = _requestId;
            if (!_commandReady || _pending || _unsupported || (!manual && !_automaticEligible))
                return false;
            _automaticEligible = false;
            _pending = true;
            requestId = ++_requestId;
            return true;
        }
    }

    public bool Complete(long? requestId = null)
    {
        lock (_sync)
        {
            if (requestId.HasValue && requestId != _requestId)
                return false;
            bool pending = _pending;
            _pending = false;
            return pending;
        }
    }
}
