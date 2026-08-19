using System;
using System.Collections.Generic;
using System.Linq;

namespace TWXProxy.Core;

public sealed record HistorySnapshot(
    IReadOnlyList<string> Messages,
    IReadOnlyList<string> Fighters,
    IReadOnlyList<string> Computer);

public sealed class ProxyHistoryBuffer
{
    private const int MaxEntries = 65533;

    private readonly object _sync = new();
    private readonly List<string> _messages = new();
    private readonly List<string> _fighters = new();
    private readonly List<string> _computer = new();
    private string _currentMessage = string.Empty;

    public event Action? Changed;

    public void ProcessLine(string line)
    {
        string cleanLine = line ?? string.Empty;
        string timestamp = DateTime.Now.ToString("T");

        lock (_sync)
        {
            if (!string.IsNullOrEmpty(_currentMessage))
            {
                if (!string.IsNullOrEmpty(cleanLine))
                {
                    if (_currentMessage.Equals("Figs", StringComparison.OrdinalIgnoreCase))
                        AddLineInternal(_fighters, timestamp + "  " + Utility.StripChars(cleanLine));
                    else if (_currentMessage.Equals("Comp", StringComparison.OrdinalIgnoreCase))
                        AddLineInternal(_computer, timestamp + "  " + Utility.StripChars(cleanLine));
                    else
                        AddLineInternal(_messages, timestamp + "  " + Utility.StripChars(cleanLine));

                    _currentMessage = string.Empty;
                    OnChanged();
                }
                return;
            }

            if (cleanLine.StartsWith("R ", StringComparison.Ordinal) || cleanLine.StartsWith("F ", StringComparison.Ordinal))
            {
                AddLineInternal(_messages, timestamp + "  " + Utility.StripChars(cleanLine));
                OnChanged();
                return;
            }

            if (cleanLine.StartsWith("P ", StringComparison.Ordinal))
            {
                if (!Utility.GetParameter(cleanLine, 2).Equals("indicates", StringComparison.OrdinalIgnoreCase))
                {
                    AddLineInternal(_messages, timestamp + "  " + Utility.StripChars(cleanLine));
                    OnChanged();
                }
                return;
            }

            if (cleanLine.StartsWith("Incoming transmission from", StringComparison.Ordinal)
                || cleanLine.StartsWith("Continuing transmission from", StringComparison.Ordinal))
            {
                int nameStart = Utility.GetParameterPos(cleanLine, 4);
                if (cleanLine.EndsWith("comm-link:", StringComparison.Ordinal))
                {
                    int federationIndex = cleanLine.IndexOf(" on Federation", StringComparison.Ordinal);
                    if (nameStart > 0 && federationIndex > nameStart)
                        _currentMessage = "F " + cleanLine.Substring(nameStart - 1, federationIndex - (nameStart - 1)) + " ";
                }
                else if (Utility.GetParameter(cleanLine, 5).Equals("Fighters:", StringComparison.OrdinalIgnoreCase))
                {
                    _currentMessage = "Figs";
                }
                else if (Utility.GetParameter(cleanLine, 5).Equals("Computers:", StringComparison.OrdinalIgnoreCase))
                {
                    _currentMessage = "Comp";
                }
                else if (cleanLine.Contains(" on channel ", StringComparison.Ordinal))
                {
                    int channelIndex = cleanLine.IndexOf(" on channel ", StringComparison.Ordinal);
                    if (nameStart > 0 && channelIndex > nameStart)
                        _currentMessage = "R " + cleanLine.Substring(nameStart - 1, channelIndex - (nameStart - 1)) + " ";
                }
                else if (nameStart > 0 && nameStart - 1 < cleanLine.Length)
                {
                    _currentMessage = "P " + cleanLine[(nameStart - 1)..] + " ";
                }

                return;
            }

            if (cleanLine.StartsWith("Deployed Fighters Report Sector", StringComparison.Ordinal))
            {
                AddLineInternal(_fighters, timestamp + "  " + cleanLine.Substring(Math.Min(18, cleanLine.Length)));
                OnChanged();
                return;
            }

            if (cleanLine.StartsWith("Shipboard Computers ", StringComparison.Ordinal))
            {
                AddLineInternal(_computer, timestamp + "  " + cleanLine.Substring(Math.Min(20, cleanLine.Length)));
                OnChanged();
            }
        }
    }

    public HistorySnapshot GetSnapshot()
    {
        lock (_sync)
        {
            return new HistorySnapshot(
                _messages.ToArray(),
                _fighters.ToArray(),
                _computer.ToArray());
        }
    }

    public void Clear(HistoryType? type = null)
    {
        lock (_sync)
        {
            if (type == null || type == HistoryType.Msg)
                _messages.Clear();
            if (type == null || type == HistoryType.Fighter)
                _fighters.Clear();
            if (type == null || type == HistoryType.Computer)
                _computer.Clear();
            _currentMessage = string.Empty;
        }

        OnChanged();
    }

    private static void AddLineInternal(ICollection<string> lines, string value)
    {
        if (lines is List<string> list && list.Count >= MaxEntries)
            list.Clear();

        lines.Add(value);
    }

    private void OnChanged() => Changed?.Invoke();
}
