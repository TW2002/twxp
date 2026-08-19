using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Channels;

namespace MTC;

/// <summary>
/// RFC 854 telnet client.  Handles IAC byte stripping / option negotiation
/// and forwards clean application data to the <see cref="AnsiParser"/>.
///
/// Terminal-type: advertises "ANSI".
/// NAWS (Negotiate About Window Size): reports the current terminal dimensions.
/// All other options are rejected with DON'T / WON'T.
/// </summary>
public sealed class TelnetClient : IDisposable
{
    // ── Telnet constants ───────────────────────────────────────────────────
    private const byte IAC   = 255;
    private const byte DONT  = 254;
    private const byte DO    = 253;
    private const byte WONT  = 252;
    private const byte WILL  = 251;
    private const byte SB    = 250;  // sub-negotiation begin
    private const byte SE    = 240;  // sub-negotiation end
    private const byte IS    = 0;

    private const byte OPT_ECHO          = 1;
    private const byte OPT_SUPPRESS_GA  = 3;
    private const byte OPT_TERM_TYPE     = 24;
    private const byte OPT_NAWS          = 31;

    // ── State ──────────────────────────────────────────────────────────────
    private enum TelnetState { Data, Iac, Will, Wont, Do, Dont, Sb, SbIac }

    private TcpClient?  _tcp;
    private NetworkStream? _stream;
    private CancellationTokenSource? _cts;
    private Channel<byte[]>? _sendChannel;
    private Task? _sendTask;
    private int _disconnectRaised;

    private TelnetState _tstate = TelnetState.Data;
    private byte        _sbOption;
    private readonly List<byte> _sbBuffer = new();

    private readonly AnsiParser _parser;
    private readonly TerminalBuffer _buffer;

    // Window size reported via NAWS
    private int _termCols = 80;
    private int _termRows = 24;

    // Line buffering for ANSI-stripped text (feeds ShipInfoParser)
    private readonly StringBuilder _lineBuf = new();
    private static readonly Regex _rxAnsi =
        new(@"\x1B\[[0-9;]*[A-Za-z]", RegexOptions.Compiled);

    // Events
    public event Action?         Connected;
    public event Action?         Disconnected;
    public event Action<string>? Error;

    /// <summary>
    /// Fired for every ANSI-stripped line (and partial prompt lines) from the server.
    /// Use this to feed <see cref="TWXProxy.Core.ShipInfoParser"/>.
    /// </summary>
    public event Action<string>? TextLineReceived;

    /// <summary>
    /// Fired for every raw ANSI line together with its ANSI-stripped form.
    /// Includes partial prompt lines, matching <see cref="TextLineReceived"/>.
    /// </summary>
    public event Action<string, string>? TextLineAnsiReceived;

    /// <summary>
    /// Fired once per receive chunk with the raw Latin-1 decoded application data
    /// (IAC-stripped but ANSI codes still present). Use for session logging.
    /// </summary>
    public event Action<string>? AppDataDecoded;

    /// <summary>Set before connecting if the terminal size differs from 80x24.</summary>
    public void SetWindowSize(int cols, int rows) { _termCols = cols; _termRows = rows; }

    public bool IsConnected => _tcp?.Connected ?? false;

    public TelnetClient(TerminalBuffer buffer, AnsiParser parser)
    {
        _buffer = buffer;
        _parser = parser;
    }

    // ── Connect / disconnect ───────────────────────────────────────────────

    public async Task ConnectAsync(string host, int port)
    {
        Dispose();  // clean up any previous connection

        _tcp  = new TcpClient();
        _cts  = new CancellationTokenSource();

        await _tcp.ConnectAsync(host, port, _cts.Token);
        _stream = _tcp.GetStream();
        _sendChannel = Channel.CreateUnbounded<byte[]>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });
        Interlocked.Exchange(ref _disconnectRaised, 0);
        NetworkStream stream = _stream;
        CancellationToken token = _cts.Token;
        _sendTask = Task.Run(() => SendLoopAsync(stream, _sendChannel.Reader, token), token);
        Connected?.Invoke();

        _ = Task.Run(() => ReadLoopAsync(stream, token), token);
    }

    public void Disconnect()
    {
        CloseConnection(raiseDisconnected: true, disposeCts: false);
    }

    // ── Send ───────────────────────────────────────────────────────────────

    public void SendLine(string text)
    {
        if (_stream == null || !IsConnected) return;
        var data = Encoding.Latin1.GetBytes(text + "\r\n");
        SendRaw(data);
    }

    public void SendRaw(byte[] data)
    {
        Channel<byte[]>? channel = _sendChannel;
        if (channel == null || data.Length == 0 || !IsConnected)
            return;

        byte[] copy = new byte[data.Length];
        Buffer.BlockCopy(data, 0, copy, 0, data.Length);
        if (!channel.Writer.TryWrite(copy) && IsConnected)
            Error?.Invoke("Unable to queue outbound telnet data.");
    }

    // ── Read loop ──────────────────────────────────────────────────────────

    private async Task SendLoopAsync(NetworkStream stream, ChannelReader<byte[]> reader, CancellationToken token)
    {
        try
        {
            await foreach (byte[] data in reader.ReadAllAsync(token))
            {
                await stream.WriteAsync(data, 0, data.Length, token);
                await stream.FlushAsync(token);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            Error?.Invoke(ex.Message);
            CloseConnection(raiseDisconnected: true, disposeCts: false);
        }
    }

    private async Task ReadLoopAsync(NetworkStream stream, CancellationToken token)
    {
        var raw  = new byte[4096];
        var app  = new byte[4096];

        try
        {
            while (!token.IsCancellationRequested)
            {
                int n = await stream.ReadAsync(raw, token);
                if (n == 0) break;

                int appLen = ProcessTelnet(raw, n, app);
                if (appLen > 0)
                {
                    _parser.Feed(app, appLen);
                    _buffer.Dirty = true;
                    AppDataDecoded?.Invoke(Encoding.Latin1.GetString(app, 0, appLen));
                    FeedTextLines(app, appLen);
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            Error?.Invoke(ex.Message);
        }
        finally
        {
            CloseConnection(raiseDisconnected: true, disposeCts: false);
        }
    }

    // ── Text line extractor ────────────────────────────────────────────────

    /// <summary>
    /// Decodes application bytes as Latin-1, accumulates into a line buffer,
    /// strips ANSI codes from complete lines, and fires <see cref="TextLineReceived"/>.
    /// Partial lines (prompts without \n) are also fired so the parser can detect
    /// the Command prompt that terminates an "I" block.
    /// </summary>
    private void FeedTextLines(byte[] data, int length)
    {
        if (TextLineReceived == null && TextLineAnsiReceived == null) return;
        string text = Encoding.Latin1.GetString(data, 0, length);
        _lineBuf.Append(text);

        string buf = _lineBuf.ToString();
        int start = 0;

        for (int i = 0; i < buf.Length; i++)
        {
            if (buf[i] != '\n') continue;

            // Extract up to (but not including) the \n
            int lineEnd = i;
            if (lineEnd > start && buf[lineEnd - 1] == '\r') lineEnd--;
            string raw = buf[start..lineEnd];
            string stripped = _rxAnsi.Replace(raw, string.Empty).TrimEnd('\r');
            if (stripped.Length > 0)
            {
                TextLineAnsiReceived?.Invoke(raw, stripped);
                TextLineReceived?.Invoke(stripped);
            }
            start = i + 1;
        }

        // Keep unprocessed remainder; fire it as a partial line (catches prompts)
        string remainder = buf[start..];
        _lineBuf.Clear();
        if (remainder.Length > 0)
        {
            _lineBuf.Append(remainder);
            string stripped = _rxAnsi.Replace(remainder, string.Empty).TrimEnd('\r');
            if (stripped.Length > 0)
            {
                TextLineAnsiReceived?.Invoke(remainder, stripped);
                TextLineReceived?.Invoke(stripped);
            }
        }
    }

    // ── Telnet byte processor ──────────────────────────────────────────────

    /// <summary>
    /// Strips IAC sequences from <paramref name="raw"/>, responds to
    /// option negotiations, and returns the number of application-data
    /// bytes written into <paramref name="app"/>.
    /// </summary>
    private int ProcessTelnet(byte[] raw, int length, byte[] app)
    {
        int appLen = 0;

        for (int i = 0; i < length; i++)
        {
            byte b = raw[i];

            switch (_tstate)
            {
                case TelnetState.Data:
                    if (b == IAC) _tstate = TelnetState.Iac;
                    else          app[appLen++] = b;
                    break;

                case TelnetState.Iac:
                    switch (b)
                    {
                        case IAC:  app[appLen++] = IAC; _tstate = TelnetState.Data; break;
                        case WILL: _tstate = TelnetState.Will; break;
                        case WONT: _tstate = TelnetState.Wont; break;
                        case DO:   _tstate = TelnetState.Do;   break;
                        case DONT: _tstate = TelnetState.Dont; break;
                        case SB:   _tstate = TelnetState.Sb; _sbBuffer.Clear(); break;
                        default:   _tstate = TelnetState.Data; break;  // NOP / DM / etc.
                    }
                    break;

                case TelnetState.Will:
                    OnWill(b);
                    _tstate = TelnetState.Data;
                    break;

                case TelnetState.Wont:
                    _tstate = TelnetState.Data;  // acknowledge silently
                    break;

                case TelnetState.Do:
                    OnDo(b);
                    _tstate = TelnetState.Data;
                    break;

                case TelnetState.Dont:
                    _tstate = TelnetState.Data;  // acknowledge silently
                    break;

                case TelnetState.Sb:
                    if (b == IAC) _tstate = TelnetState.SbIac;
                    else { _sbOption = _sbBuffer.Count == 0 ? b : _sbOption; _sbBuffer.Add(b); }
                    break;

                case TelnetState.SbIac:
                    if (b == SE) { HandleSubneg(); _tstate = TelnetState.Data; }
                    else         { _sbBuffer.Add(IAC); _sbBuffer.Add(b); _tstate = TelnetState.Sb; }
                    break;
            }
        }

        return appLen;
    }

    // ── Option negotiation ─────────────────────────────────────────────────

    private void OnWill(byte opt)
    {
        switch (opt)
        {
            case OPT_SUPPRESS_GA: Send(DO, opt);  break;  // accept
            default:              Send(DONT, opt); break; // refuse
        }
    }

    private void OnDo(byte opt)
    {
        switch (opt)
        {
            case OPT_TERM_TYPE:
                Send(WILL, OPT_TERM_TYPE);
                break;
            case OPT_NAWS:
                Send(WILL, OPT_NAWS);
                SendNaws();
                break;
            case OPT_SUPPRESS_GA:
                Send(WILL, OPT_SUPPRESS_GA);
                break;
            default:
                Send(WONT, opt);
                break;
        }
    }

    private void HandleSubneg()
    {
        if (_sbBuffer.Count < 2) return;
        byte opt = _sbBuffer[0];

        if (opt == OPT_TERM_TYPE && _sbBuffer.Count >= 2 && _sbBuffer[1] == 1 /* SEND */)
        {
            // Server requests our terminal type
            byte[] resp = [IAC, SB, OPT_TERM_TYPE, IS, .."ANSI"u8.ToArray(), IAC, SE];
            SendRaw(resp);
        }
    }

    private void SendNaws()
    {
        // Byte-escape any 255 values
        static byte[] Esc(int v) => (byte)v == IAC ? [IAC, IAC] : [(byte)v];

        var payload = new List<byte> { IAC, SB, OPT_NAWS };
        payload.AddRange(Esc(_termCols >> 8));
        payload.AddRange(Esc(_termCols & 0xFF));
        payload.AddRange(Esc(_termRows >> 8));
        payload.AddRange(Esc(_termRows & 0xFF));
        payload.Add(IAC);
        payload.Add(SE);
        SendRaw(payload.ToArray());
    }

    private void Send(byte verb, byte opt)
    {
        byte[] buf = [IAC, verb, opt];
        SendRaw(buf);
    }

    // ── Dispose ────────────────────────────────────────────────────────────

    public void Dispose()
    {
        CloseConnection(raiseDisconnected: false, disposeCts: true);
    }

    private void CloseConnection(bool raiseDisconnected, bool disposeCts)
    {
        _sendChannel?.Writer.TryComplete();
        try { _cts?.Cancel(); } catch { }
        try { _stream?.Close(); } catch { }
        try { _tcp?.Close(); } catch { }
        try { _stream?.Dispose(); } catch { }
        try { _tcp?.Dispose(); } catch { }

        if (disposeCts)
        {
            try { _cts?.Dispose(); } catch { }
        }

        _sendChannel = null;
        _sendTask = null;
        _stream = null;
        _tcp = null;
        if (disposeCts)
            _cts = null;

        if (raiseDisconnected && Interlocked.Exchange(ref _disconnectRaised, 1) == 0)
            Disconnected?.Invoke();
    }
}
