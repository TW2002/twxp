using System.Text;

namespace MTC;

/// <summary>
/// VT100/ANSI escape-sequence parser.  Feed raw bytes (after telnet has
/// stripped IAC sequences) in via <see cref="Feed(byte[],int)"/> and the
/// parser writes decoded characters + attributes directly into the
/// <see cref="TerminalBuffer"/>.
/// </summary>
public class AnsiParser
{
    private static readonly char[] Cp437Glyphs = BuildCp437GlyphTable();

    // ── Parser state machine ───────────────────────────────────────────────
    private enum State
    {
        Ground,         // normal text
        Escape,         // received ESC
        CsiEntry,       // received ESC [
        CsiParam,       // accumulating CSI parameter bytes
        OscString,      // inside OSC (ESC ]) – ignored but consumed
        DcsEntry,       // inside DCS (ESC P) – ignored
        SosEntry,       // inside SOS/PM/APC (ESC X / ^ / _) – ignored
    }

    private enum LegacyPromptClearState
    {
        None,
        Saw255D,
        Saw255D255B,
    }

    private enum PromptScrubState
    {
        None,
        SawLeft,
        SawSpaces,
        SawSecondLeft,
    }

    private enum LegacyInlineTokenState
    {
        None,
        SemicolonT,
        BraceToken,
    }

    private enum LegacyInlineControlResult
    {
        Reprocess,
        Consumed,
    }

    private readonly TerminalBuffer _buf;
    private State    _state      = State.Ground;
    private string   _csiParam   = "";
    private char     _csiIntermediate = '\0';
    private byte?    _pendingUtf8Latin1Lead;
    private bool     _pendingPromptProbeByte;
    private LegacyPromptClearState _legacyPromptClearState;
    private PromptScrubState _promptScrubState;
    private int _promptScrubRow = -1;
    private int _promptScrubSpaces;
    private bool _clearPromptLineOnNextPrintable;
    private LegacyInlineTokenState _legacyInlineTokenState;
    private readonly StringBuilder _legacyInlineToken = new();
    private int _legacySemicolonSeparators;
    private int _legacySemicolonCurrentDigits;
    private int _legacyInlineRecoveryBudget;
    private bool _pendingLegacyTextMarker;
    private bool _suppressNextLegacyTextMarker;

    // Saved cursor
    private int _savedRow, _savedCol;

    // Attribute state
    private bool _bold;
    private int  _fgIndex = 7;
    private int  _bgIndex = 0;
    private bool _fgIs256;
    // 256/true-color accumulation state
    private bool _nextIsFgColor, _nextIsBgColor;
    private int  _colorStage; // 0=waiting for type, 1=waiting for index

    public AnsiParser(TerminalBuffer buffer)
    {
        _buf = buffer;
        ApplyAttributes();
    }

    public Action<byte[], int, int>? RawBytesObserved { get; set; }

    // ── Public feed API ────────────────────────────────────────────────────

    public void Feed(byte[] data, int length)
        => Feed(data, length, observeRawBytes: true);

    public void FeedVisualSnapshot(byte[] data, int length)
        => Feed(data, length, observeRawBytes: false);

    public void ResetState()
    {
        _state = State.Ground;
        _csiParam = string.Empty;
        _csiIntermediate = '\0';
        _pendingUtf8Latin1Lead = null;
        _pendingPromptProbeByte = false;
        _legacyPromptClearState = LegacyPromptClearState.None;
        ResetPromptScrub();
        _clearPromptLineOnNextPrintable = false;
        ResetLegacyInlineToken();
        _legacyInlineRecoveryBudget = 0;
        _pendingLegacyTextMarker = false;
        _suppressNextLegacyTextMarker = false;
        _savedRow = 0;
        _savedCol = 0;
        _colorStage = 0;
        ResetAttributes();
    }

    private void Feed(byte[] data, int length, bool observeRawBytes)
    {
        if (observeRawBytes)
            RawBytesObserved?.Invoke(data, 0, length);

        for (int i = 0; i < length; i++)
        {
            byte b = data[i];

            if (_pendingUtf8Latin1Lead is byte lead)
            {
                _pendingUtf8Latin1Lead = null;
                if (TryDecodeUtf8Latin1Byte(lead, b, out byte decoded))
                {
                    ProcessByte(decoded);
                    continue;
                }

                ProcessByte(lead);
            }

            if (IsUtf8Latin1Lead(b))
            {
                if (i + 1 >= length)
                {
                    _pendingUtf8Latin1Lead = b;
                    continue;
                }

                if (TryDecodeUtf8Latin1Byte(b, data[i + 1], out byte decoded))
                {
                    ProcessByte(decoded);
                    i++;
                    continue;
                }
            }

            ProcessByte(b);
        }
    }

    public void Feed(string text)
    {
        if (RawBytesObserved != null && text.Length > 0)
        {
            var data = new byte[text.Length];
            for (int i = 0; i < text.Length; i++)
                data[i] = (byte)text[i];
            RawBytesObserved.Invoke(data, 0, data.Length);
        }

        FlushPendingUtf8Latin1Lead();
        foreach (char c in text)
            ProcessByte((byte)c);
    }

    private void FlushPendingUtf8Latin1Lead()
    {
        if (_pendingUtf8Latin1Lead is not byte lead)
            return;

        _pendingUtf8Latin1Lead = null;
        ProcessByte(lead);
    }

    private static bool IsUtf8Latin1Lead(byte b)
        => b is 0xC2 or 0xC3;

    private static bool TryDecodeUtf8Latin1Byte(byte lead, byte trail, out byte value)
    {
        value = 0;
        if (!IsUtf8Latin1Lead(lead) || trail < 0x80 || trail > 0xBF)
            return false;

        int codePoint = ((lead & 0x1F) << 6) | (trail & 0x3F);
        if (codePoint < 0x80 || codePoint > 0xFF)
            return false;

        value = (byte)codePoint;
        return true;
    }

    // ── Main dispatch ──────────────────────────────────────────────────────

    private void ProcessByte(byte b)
    {
        if (_legacyPromptClearState != LegacyPromptClearState.None &&
            _state == State.Ground &&
            b != 0x1B)
        {
            FlushPendingLegacyPromptClear();
        }

        if (_promptScrubState != PromptScrubState.None &&
            _state == State.Ground &&
            b != 0x1B &&
            HandlePromptScrubGroundByte(b))
        {
            return;
        }

        if (_pendingPromptProbeByte)
        {
            _pendingPromptProbeByte = false;
            if (b == 0x08)
                return;

            // #145 is a TWX/Mombot prompt probe, not terminal text. Suppress the
            // probe itself even when a server/client does not pair it with BS.
        }

        if (_state == State.Ground &&
            HandleLegacyInlineControlByte(b) == LegacyInlineControlResult.Consumed)
        {
            return;
        }

        char c = (char)b;

        switch (_state)
        {
            case State.Ground:
                // Mombot uses #145#8 as a non-visual prompt probe. Preserve it for the
                // script/runtime side, but never let the terminal render or backspace it.
                if (b == 0x91)
                {
                    _pendingPromptProbeByte = true;
                    return;
                }

                if (b == 0x1B) { _state = State.Escape; return; }
                HandleControlChar(b);
                break;

            case State.Escape:
                if (TryRecoverFromMalformedEscapeControlChar(b))
                    break;

                if (_legacyPromptClearState != LegacyPromptClearState.None && b != (byte)'[')
                    FlushPendingLegacyPromptClear();

                _state = State.Ground;
                switch (b)
                {
                    case (byte)'[': _state = State.CsiEntry; _csiParam = ""; _csiIntermediate = '\0'; break;
                    case (byte)']': _state = State.OscString; break;
                    case (byte)'P': _state = State.DcsEntry;  break;
                    case (byte)'X':
                    case (byte)'^':
                    case (byte)'_': _state = State.SosEntry; break;
                    case (byte)'7': SaveCursor();    break;
                    case (byte)'8': RestoreCursor(); break;
                    case (byte)'c': _buf.Reset();    ApplyAttributes(); break;
                    case (byte)'M': _buf.ScrollDown(); break;  // reverse index
                    default:
                        ProcessByteAfterIgnoredEscape(b);
                        break;
                }
                break;

            case State.CsiEntry:
            case State.CsiParam:
                if (TryRecoverFromMalformedEscapeControlChar(b))
                    break;

                _state = State.CsiParam;
                if (b >= 0x30 && b <= 0x3F)          // parameter / subparam bytes
                {
                    _csiParam += c;
                }
                else if (b >= 0x20 && b <= 0x2F)     // intermediate bytes
                {
                    _csiIntermediate = c;
                }
                else if (b >= 0x40 && b <= 0x7E)     // final byte → dispatch
                {
                    DispatchCsi(_csiParam, _csiIntermediate, c);
                    _state = State.Ground;
                }
                break;

            case State.OscString:
                if (b == 0x07 || b == 0x1B) _state = State.Ground;  // BEL or ESC terminates
                break;

            case State.DcsEntry:
            case State.SosEntry:
                if (b == 0x1B) _state = State.Escape;  // ESC \ terminates (ST)
                break;
        }
    }

    private bool TryRecoverFromMalformedEscapeControlChar(byte b)
    {
        if (b is not (0x08 or 0x09 or 0x0A or 0x0B or 0x0C or 0x0D))
            return false;

        _state = State.Ground;
        if (_legacyPromptClearState != LegacyPromptClearState.None)
            FlushPendingLegacyPromptClear();

        HandleControlChar(b);
        return true;
    }

    private void ProcessByteAfterIgnoredEscape(byte b)
    {
        if (b == 0x1B)
        {
            _state = State.Escape;
            return;
        }

        HandleControlChar(b);
    }

    private void HandleControlChar(byte b)
    {
        switch (b)
        {
            case 0x00: break;          // NUL – ignore
            case 0x07: break;          // BEL – ignore
            case 0x08: _clearPromptLineOnNextPrintable = false; _buf.BackSpace(); break;
            case 0x09: ClearPromptLineBeforeOverwriteIfNeeded(); _buf.Tab(); break;
            case 0x0A:                 // LF
            case 0x0B:                 // VT
            case 0x0C: _clearPromptLineOnNextPrintable = false; _buf.LineFeed(); break;  // FF
            case 0x0D:
                _clearPromptLineOnNextPrintable = IsPromptLine(_buf.GetLineText(_buf.CursorRow));
                _buf.CarriageReturn();
                break;
            default:
                if (b >= 0x20)
                    WritePrintableByte(b);
                break;
        }
    }

    private LegacyInlineControlResult HandleLegacyInlineControlByte(byte b)
    {
        if (_legacyInlineRecoveryBudget > 0)
            _legacyInlineRecoveryBudget--;

        if (_legacyInlineTokenState != LegacyInlineTokenState.None)
            return ContinueLegacyInlineToken(b);

        if (_pendingLegacyTextMarker)
        {
            _pendingLegacyTextMarker = false;
            if (IsLegacyBoxDrawingBoundary(b))
                return LegacyInlineControlResult.Reprocess;

            WritePrintableByte((byte)'t');
        }

        if (_suppressNextLegacyTextMarker)
        {
            _suppressNextLegacyTextMarker = false;
            if (b == (byte)'t')
            {
                RefreshLegacyInlineRecoveryBudget();
                return LegacyInlineControlResult.Consumed;
            }
        }

        if (b == (byte)';')
        {
            StartLegacySemicolonToken();
            return LegacyInlineControlResult.Consumed;
        }

        if (b == (byte)'0' && _buf.CursorCol <= 1)
        {
            StartLegacyBraceToken();
            return LegacyInlineControlResult.Consumed;
        }

        if (b == (byte)'t' &&
            (_legacyInlineRecoveryBudget > 0 || _buf.CursorCol <= 2))
        {
            _pendingLegacyTextMarker = true;
            return LegacyInlineControlResult.Consumed;
        }

        return LegacyInlineControlResult.Reprocess;
    }

    private LegacyInlineControlResult ContinueLegacyInlineToken(byte b)
    {
        return _legacyInlineTokenState switch
        {
            LegacyInlineTokenState.SemicolonT => ContinueLegacySemicolonToken(b),
            LegacyInlineTokenState.BraceToken => ContinueLegacyBraceToken(b),
            _ => LegacyInlineControlResult.Reprocess,
        };
    }

    private void StartLegacySemicolonToken()
    {
        _legacyInlineTokenState = LegacyInlineTokenState.SemicolonT;
        _legacyInlineToken.Clear();
        _legacyInlineToken.Append(';');
        _legacySemicolonSeparators = 0;
        _legacySemicolonCurrentDigits = 0;
    }

    private LegacyInlineControlResult ContinueLegacySemicolonToken(byte b)
    {
        if (b >= (byte)'0' && b <= (byte)'9')
        {
            if (_legacySemicolonCurrentDigits >= 3)
            {
                FlushPendingLegacyInlineToken();
                return LegacyInlineControlResult.Reprocess;
            }

            _legacyInlineToken.Append((char)b);
            _legacySemicolonCurrentDigits++;
            return LegacyInlineControlResult.Consumed;
        }

        if (b == (byte)';')
        {
            if (_legacySemicolonCurrentDigits == 0 || _legacySemicolonSeparators >= 1)
            {
                FlushPendingLegacyInlineToken();
                return LegacyInlineControlResult.Reprocess;
            }

            _legacyInlineToken.Append(';');
            _legacySemicolonSeparators++;
            _legacySemicolonCurrentDigits = 0;
            return LegacyInlineControlResult.Consumed;
        }

        if (b == (byte)'t' && _legacySemicolonCurrentDigits > 0)
        {
            ResetLegacyInlineToken();
            _suppressNextLegacyTextMarker = true;
            RefreshLegacyInlineRecoveryBudget();
            return LegacyInlineControlResult.Consumed;
        }

        FlushPendingLegacyInlineToken();
        return LegacyInlineControlResult.Reprocess;
    }

    private void StartLegacyBraceToken()
    {
        _legacyInlineTokenState = LegacyInlineTokenState.BraceToken;
        _legacyInlineToken.Clear();
        _legacyInlineToken.Append('0');
    }

    private LegacyInlineControlResult ContinueLegacyBraceToken(byte b)
    {
        string current = _legacyInlineToken.ToString();

        if (b < 0x20 || b == 0x1B)
        {
            if (current == "01}")
            {
                ResetLegacyInlineToken();
                RefreshLegacyInlineRecoveryBudget();
            }
            else
            {
                FlushPendingLegacyInlineToken();
            }

            return LegacyInlineControlResult.Reprocess;
        }

        if (current == "01}" && b != (byte)'{')
        {
            ResetLegacyInlineToken();
            RefreshLegacyInlineRecoveryBudget();
            return LegacyInlineControlResult.Reprocess;
        }

        _legacyInlineToken.Append((char)b);
        string token = _legacyInlineToken.ToString();

        if (token == "01}{NK}{")
        {
            ResetLegacyInlineToken();
            RefreshLegacyInlineRecoveryBudget();
            return LegacyInlineControlResult.Consumed;
        }

        if ("01}{NK}{".StartsWith(token, StringComparison.Ordinal) ||
            "01}".StartsWith(token, StringComparison.Ordinal))
        {
            return LegacyInlineControlResult.Consumed;
        }

        FlushPendingLegacyInlineToken();
        return LegacyInlineControlResult.Consumed;
    }

    private void FlushPendingLegacyInlineToken()
    {
        if (_legacyInlineToken.Length == 0)
        {
            ResetLegacyInlineToken();
            return;
        }

        string token = _legacyInlineToken.ToString();
        ResetLegacyInlineToken();
        foreach (char ch in token)
            WritePrintableByte((byte)ch);
    }

    private void ResetLegacyInlineToken()
    {
        _legacyInlineTokenState = LegacyInlineTokenState.None;
        _legacyInlineToken.Clear();
        _legacySemicolonSeparators = 0;
        _legacySemicolonCurrentDigits = 0;
    }

    private void RefreshLegacyInlineRecoveryBudget()
        => _legacyInlineRecoveryBudget = Math.Max(_legacyInlineRecoveryBudget, 4096);

    private static bool IsLegacyBoxDrawingBoundary(byte b)
        => b is 0xB3 or 0xBA or 0xBB or 0xBC or 0xC8 or 0xC9 or 0xCC or 0xCD or 0xD9 or 0xDA;

    private void WritePrintableByte(byte b)
    {
        ClearPromptLineBeforeOverwriteIfNeeded();
        _buf.WriteChar(Cp437Glyphs[b]);  // printable DOS/ANSI glyph
    }

    private void ClearPromptLineBeforeOverwriteIfNeeded()
    {
        if (!_clearPromptLineOnNextPrintable)
            return;

        _clearPromptLineOnNextPrintable = false;
        _buf.EraseLine(_buf.CursorRow, 0, _buf.Columns - 1);
        _buf.CarriageReturn();
    }

    private static bool IsPromptLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return false;

        string trimmed = line.TrimStart();
        return trimmed.StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase) ||
               trimmed.StartsWith("Computer command [TL=", StringComparison.OrdinalIgnoreCase) ||
               trimmed.StartsWith("Corporate command [TL=", StringComparison.OrdinalIgnoreCase) ||
               trimmed.StartsWith("Citadel command", StringComparison.OrdinalIgnoreCase) ||
               trimmed.StartsWith("Planet command", StringComparison.OrdinalIgnoreCase) ||
               trimmed.StartsWith("Settings command", StringComparison.OrdinalIgnoreCase);
    }

    private static char[] BuildCp437GlyphTable()
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        var encoding = Encoding.GetEncoding(437);
        var table = new char[256];

        for (int i = 0; i < table.Length; i++)
            table[i] = encoding.GetChars([(byte)i])[0];

        return table;
    }

    // ── CSI dispatch ───────────────────────────────────────────────────────

    private void DispatchCsi(string param, char intermediate, char finalChar)
    {
        int[] ps = ParseParams(param);

        if (_legacyPromptClearState != LegacyPromptClearState.None)
        {
            if (_legacyPromptClearState == LegacyPromptClearState.Saw255D &&
                IsLegacySingleParam(ps, param, 255) &&
                finalChar == 'B')
            {
                _legacyPromptClearState = LegacyPromptClearState.Saw255D255B;
                return;
            }

            if (_legacyPromptClearState == LegacyPromptClearState.Saw255D255B &&
                IsLegacyEraseToEndOfLine(ps, param) &&
                finalChar == 'K')
            {
                ApplyLegacyPromptClear();
                _legacyPromptClearState = LegacyPromptClearState.None;
                return;
            }

            FlushPendingLegacyPromptClear();
        }

        if (IsLegacySingleParam(ps, param, 255) && finalChar == 'D')
        {
            _legacyPromptClearState = LegacyPromptClearState.Saw255D;
            return;
        }

        if (_promptScrubState != PromptScrubState.None)
        {
            if (finalChar == 'D' &&
                IsSinglePositiveParam(ps, param) &&
                _promptScrubState is PromptScrubState.SawLeft or PromptScrubState.SawSpaces &&
                _buf.CursorRow == _promptScrubRow)
            {
                _promptScrubState = PromptScrubState.SawSecondLeft;
            }
            else
            {
                ResetPromptScrub();
            }
        }
        else if (finalChar == 'D' &&
                 IsSinglePositiveParam(ps, param) &&
                 LooksLikeTwPromptLine(_buf.CursorRow))
        {
            _promptScrubState = PromptScrubState.SawLeft;
            _promptScrubRow = _buf.CursorRow;
            _promptScrubSpaces = 0;
        }

        switch (finalChar)
        {
            // Cursor movement
            case 'A': _buf.MoveCursorRelative(-(P(ps, 0, 1)), 0); break;
            case 'B': _buf.MoveCursorRelative( P(ps, 0, 1),  0); break;
            case 'C': _buf.MoveCursorRelative(0,  P(ps, 0, 1)); break;
            case 'D': _buf.MoveCursorRelative(0, -P(ps, 0, 1)); break;
            case 'E': _buf.SetCursor(_buf.CursorRow + P(ps, 0, 1), 0); break;
            case 'F': _buf.SetCursor(_buf.CursorRow - P(ps, 0, 1), 0); break;
            case 'G': _buf.SetCursor(_buf.CursorRow, P(ps, 0, 1) - 1); break;

            // Cursor position  CSI row ; col H  (1-based)
            case 'H':
            case 'f':
                _buf.SetCursor(P(ps, 0, 1) - 1, P(ps, 1, 1) - 1);
                break;

            // Erase in display
            case 'J':
                switch (P(ps, 0, 0))
                {
                    case 0: _buf.EraseDisplay(_buf.CursorRow + 1); _buf.EraseLine(_buf.CursorRow, _buf.CursorCol, _buf.Columns - 1); break;
                    case 1: _buf.EraseDisplay(0, _buf.CursorRow - 1); _buf.EraseLine(_buf.CursorRow, 0, _buf.CursorCol); break;
                    case 2:
                    case 3: _buf.EraseDisplay(); break;
                }
                break;

            // Erase in line
            case 'K':
                switch (P(ps, 0, 0))
                {
                    case 0: _buf.EraseLine(_buf.CursorRow, _buf.CursorCol, _buf.Columns - 1); break;
                    case 1: _buf.EraseLine(_buf.CursorRow, 0, _buf.CursorCol); break;
                    case 2: _buf.EraseLine(_buf.CursorRow, 0, _buf.Columns - 1); break;
                }
                break;

            // Scroll up / down
            case 'S': _buf.ScrollUp(P(ps, 0, 1));   break;
            case 'T': _buf.ScrollDown(P(ps, 0, 1));  break;

            // Insert / delete characters
            case '@': _buf.InsertChars(P(ps, 0, 1)); break;
            case 'P': _buf.DeleteChars(P(ps, 0, 1)); break;

            // Insert / delete lines
            case 'L':
                for (int i = 0; i < P(ps, 0, 1); i++) _buf.ScrollDown();
                break;
            case 'M':
                for (int i = 0; i < P(ps, 0, 1); i++) _buf.ScrollUp();
                break;

            // Scroll region   CSI top ; bottom r  (1-based)
            case 'r':
                _buf.SetScrollRegion(P(ps, 0, 1) - 1, P(ps, 1, _buf.Rows) - 1);
                _buf.SetCursor(0, 0);
                break;

            // Save / restore cursor (ANSI extension)
            case 's': SaveCursor();    break;
            case 'u': RestoreCursor(); break;

            // SGR – Select Graphic Rendition
            case 'm': ApplySgr(ps); break;

            // Show/hide cursor (private mode with ?)
            case 'h':
            case 'l':
                if (param.StartsWith('?') && P(ps, 0, 0) == 25)
                    _buf.CursorVisible = (finalChar == 'h');
                break;

            // Device Attributes / reports – respond with nothing (client-side only)
            default: break;
        }
    }

    // ── SGR ────────────────────────────────────────────────────────────────

    private void ApplySgr(int[] ps)
    {
        if (ps.Length == 0) { ResetAttributes(); return; }

        int i = 0;
        while (i < ps.Length)
        {
            int p = ps[i];

            // 256-color / truecolor continuation
            if (_nextIsFgColor || _nextIsBgColor)
            {
                if (_colorStage == 0)
                {
                    // p should be 5 (256-color) or 2 (truecolor)
                    if (p == 5) { _colorStage = 1; i++; continue; }
                    // truecolor (38;2;r;g;b) – consume next 3
                    if (p == 2 && i + 3 < ps.Length)
                    {
                        var tc = new TermColor((byte)ps[i + 1], (byte)ps[i + 2], (byte)ps[i + 3]);
                        if (_nextIsFgColor) _buf.CurrentFg = tc;
                        else               _buf.CurrentBg = tc;
                        i += 4;
                        _nextIsFgColor = _nextIsBgColor = false; _colorStage = 0;
                        continue;
                    }
                    _nextIsFgColor = _nextIsBgColor = false; _colorStage = 0;
                }
                else if (_colorStage == 1)
                {
                    var c256 = AnsiColor.ToColor(p);
                    if (_nextIsFgColor) _buf.CurrentFg = c256;
                    else               _buf.CurrentBg = c256;
                    _nextIsFgColor = _nextIsBgColor = false; _colorStage = 0;
                    i++; continue;
                }
            }

            switch (p)
            {
                case 0:  ResetAttributes(); break;
                case 1:  _bold = true;  AdjustBold(); break;
                case 2:  _bold = false; AdjustBold(); break;  // dim
                case 22: _bold = false; AdjustBold(); break;
                case 5:  // slow blink
                case 6:  // rapid blink (treat same as slow)
                    _buf.CurrentBlink = true; break;
                case 25: _buf.CurrentBlink = false; break;
                // 3/4/7/8 – italic/underline/reverse/conceal – mostly ignore for TW
                case 7:  // reverse video
                    (_buf.CurrentFg, _buf.CurrentBg) = (_buf.CurrentBg, _buf.CurrentFg);
                    break;
                case 27: ApplyAttributes(); break;   // reverse off

                // Standard fg 30-37
                case int n when n >= 30 && n <= 37:
                    _fgIndex = n - 30 + (_bold ? 8 : 0);
                    _fgIs256 = false;
                    _buf.CurrentFg = AnsiColor.ToColor(_fgIndex);
                    break;

                // 256-color fg
                case 38:
                    _nextIsFgColor = true; _colorStage = 0;
                    break;

                // Default fg
                case 39:
                    _fgIndex = 7; _fgIs256 = false;
                    _buf.CurrentFg = AnsiColor.ToColor(7);
                    break;

                // Standard bg 40-47
                case int n when n >= 40 && n <= 47:
                    _bgIndex = n - 40;
                    _buf.CurrentBg = AnsiColor.ToColor(_bgIndex);
                    break;

                // 256-color bg
                case 48:
                    _nextIsBgColor = true; _colorStage = 0;
                    break;

                // Default bg
                case 49:
                    _bgIndex = 0;
                    _buf.CurrentBg = AnsiColor.ToColor(0);
                    break;

                // Bright fg 90-97
                case int n when n >= 90 && n <= 97:
                    _fgIndex = n - 90 + 8;
                    _fgIs256 = false;
                    _buf.CurrentFg = AnsiColor.ToColor(_fgIndex);
                    break;

                // Bright bg 100-107
                case int n when n >= 100 && n <= 107:
                    _bgIndex = n - 100 + 8;
                    _buf.CurrentBg = AnsiColor.ToColor(_bgIndex);
                    break;
            }
            i++;
        }
    }

    private void ResetAttributes()
    {
        _bold = false;
        _fgIndex = 7; _bgIndex = 0;
        _fgIs256 = false;
        _nextIsFgColor = _nextIsBgColor = false;
        _buf.CurrentBlink = false;
        ApplyAttributes();
    }

    private void ApplyAttributes()
    {
        _buf.CurrentFg = AnsiColor.ToColor(_bold ? Math.Min(_fgIndex | 8, 15) : _fgIndex);
        _buf.CurrentBg = AnsiColor.ToColor(_bgIndex);
    }

    private void AdjustBold()
    {
        if (!_fgIs256)
            _buf.CurrentFg = AnsiColor.ToColor(_bold ? Math.Min(_fgIndex | 8, 15) : (_fgIndex & 7));
    }

    // ── Cursor save/restore ────────────────────────────────────────────────

    private void SaveCursor()
    {
        _savedRow = _buf.CursorRow;
        _savedCol = _buf.CursorCol;
    }

    private void RestoreCursor() => _buf.SetCursor(_savedRow, _savedCol);

    private void FlushPendingLegacyPromptClear()
    {
        switch (_legacyPromptClearState)
        {
            case LegacyPromptClearState.Saw255D:
                _buf.MoveCursorRelative(0, -255);
                break;
            case LegacyPromptClearState.Saw255D255B:
                _buf.MoveCursorRelative(0, -255);
                _buf.MoveCursorRelative(255, 0);
                break;
        }

        _legacyPromptClearState = LegacyPromptClearState.None;
    }

    private void ApplyLegacyPromptClear()
    {
        _buf.SetCursor(_buf.Rows - 1, 0);
        _buf.EraseLine(_buf.CursorRow, 0, _buf.Columns - 1);
    }

    private bool HandlePromptScrubGroundByte(byte b)
    {
        if (_buf.CursorRow != _promptScrubRow)
        {
            ResetPromptScrub();
            return false;
        }

        if (b == 0x20 && _promptScrubState is PromptScrubState.SawLeft or PromptScrubState.SawSpaces)
        {
            _promptScrubState = PromptScrubState.SawSpaces;
            _promptScrubSpaces++;
            return false;
        }

        if (b == 0x0D && _promptScrubState == PromptScrubState.SawSecondLeft && _promptScrubSpaces >= 4)
        {
            _buf.EraseLine(_promptScrubRow, 0, _buf.Columns - 1);
            ResetPromptScrub();
            HandleControlChar(b);
            return true;
        }

        ResetPromptScrub();
        return false;
    }

    private void ResetPromptScrub()
    {
        _promptScrubState = PromptScrubState.None;
        _promptScrubRow = -1;
        _promptScrubSpaces = 0;
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static bool IsLegacySingleParam(int[] ps, string rawParam, int value)
    {
        string normalized = rawParam.TrimStart('?');
        if (normalized.Contains(';', StringComparison.Ordinal))
            return false;

        return ps.Length == 1 && ps[0] == value;
    }

    private static bool IsSinglePositiveParam(int[] ps, string rawParam)
    {
        string normalized = rawParam.TrimStart('?');
        return !normalized.Contains(';', StringComparison.Ordinal) &&
               ps.Length == 1 &&
               ps[0] > 0 &&
               ps[0] < 255;
    }

    private bool LooksLikeTwPromptLine(int row)
    {
        if (row < 0 || row >= _buf.Rows)
            return false;

        var line = new StringBuilder(_buf.Columns);
        for (int c = 0; c < _buf.Columns; c++)
            line.Append(_buf[row, c].Char);

        string text = line.ToString().TrimEnd();
        return text.StartsWith("Command [", StringComparison.Ordinal) ||
               text.StartsWith("Computer command [", StringComparison.Ordinal) ||
               (text.StartsWith('<') && text.Contains(">", StringComparison.Ordinal) && text.Contains("?=", StringComparison.Ordinal));
    }

    private static bool IsLegacyEraseToEndOfLine(int[] ps, string rawParam)
    {
        string normalized = rawParam.TrimStart('?');
        return string.IsNullOrEmpty(normalized) || (ps.Length == 1 && ps[0] == 0);
    }

    private static int[] ParseParams(string s)
    {
        if (string.IsNullOrEmpty(s)) return [0];
        var parts = s.TrimStart('?').Split(';');
        var result = new int[parts.Length];
        for (int i = 0; i < parts.Length; i++)
            int.TryParse(parts[i], out result[i]);
        return result;
    }

    /// <summary>Returns parameter at <paramref name="idx"/> or <paramref name="def"/> if missing / zero.</summary>
    private static int P(int[] ps, int idx, int def)
        => (idx < ps.Length && ps[idx] != 0) ? ps[idx] : def;
}
