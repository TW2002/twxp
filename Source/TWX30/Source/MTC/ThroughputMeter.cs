using System.Diagnostics;
using System.Threading;

namespace MTC;

internal readonly record struct ThroughputSample(long Bytes, long Lines, double Seconds)
{
    public long BytesPerSecond => Seconds > 0 ? (long)Math.Round(Bytes / Seconds) : 0;
    public long LinesPerSecond => Seconds > 0 ? (long)Math.Round(Lines / Seconds) : 0;
}

internal sealed class ThroughputMeter
{
    private long _pendingBytes;
    private long _pendingLines;
    private long _lastSampleTimestamp = Stopwatch.GetTimestamp();

    public void Add(long bytes, long lines)
    {
        if (bytes != 0)
            Interlocked.Add(ref _pendingBytes, bytes);
        if (lines != 0)
            Interlocked.Add(ref _pendingLines, lines);
    }

    public ThroughputSample SampleAndReset()
    {
        long now = Stopwatch.GetTimestamp();
        long previous = Interlocked.Exchange(ref _lastSampleTimestamp, now);
        long bytes = Interlocked.Exchange(ref _pendingBytes, 0);
        long lines = Interlocked.Exchange(ref _pendingLines, 0);
        double seconds = previous == 0
            ? 1.0
            : Math.Max((now - previous) / (double)Stopwatch.Frequency, 0.001);
        return new ThroughputSample(bytes, lines, seconds);
    }
}
