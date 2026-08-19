using System.Threading;

namespace MTC;

/// <summary>
/// Lightweight RGB color value used by the terminal cell grid.
/// No dependency on any UI framework.
/// </summary>
public readonly record struct TermColor(byte R, byte G, byte B)
{
    public static readonly TermColor Black     = new(  0,   0,   0);
    public static readonly TermColor LightGray = new(170, 170, 170);
}

/// <summary>
/// A single character cell in the virtual terminal screen.
/// </summary>
public struct TerminalCell
{
    public char      Char;
    public TermColor Foreground;
    public TermColor Background;
    public bool      Blink;

    public static readonly TerminalCell Default = new()
    {
        Char       = ' ',
        Foreground = AnsiColor.ToColor(7),   // light gray
        Background = AnsiColor.ToColor(0),   // black
        Blink      = false,
    };
}

/// <summary>
/// Maps the 16 standard ANSI/VT100 color indices plus 256-color palette
/// to <see cref="TermColor"/> RGB values.
/// </summary>
public static class AnsiColor
{
    // Classic 16-color CGA/ANSI palette
    private static readonly TermColor[] Palette16 =
    [
        new(  0,   0,   0),  //  0 Black
        new(170,   0,   0),  //  1 Dark Red
        new(  0, 170,   0),  //  2 Dark Green
        new(170, 170,   0),  //  3 Dark Yellow (brown)
        new(  0,   0, 170),  //  4 Dark Blue
        new(170,   0, 170),  //  5 Dark Magenta
        new(  0, 170, 170),  //  6 Dark Cyan
        new(170, 170, 170),  //  7 Light Gray
        new( 85,  85,  85),  //  8 Dark Gray
        new(255,  85,  85),  //  9 Bright Red
        new( 85, 255,  85),  // 10 Bright Green
        new(255, 255,  85),  // 11 Bright Yellow
        new( 85,  85, 255),  // 12 Bright Blue
        new(255,  85, 255),  // 13 Bright Magenta
        new( 85, 255, 255),  // 14 Bright Cyan
        new(255, 255, 255),  // 15 White
    ];

    public static TermColor ToColor(int index)
    {
        if (index >= 0 && index < 16)
            return Palette16[index];

        // 256-color cube (indices 16-231)
        if (index >= 16 && index <= 231)
        {
            int i = index - 16;
            int b = i % 6;
            int g = (i / 6) % 6;
            int r = i / 36;
            return new TermColor(
                (byte)(r == 0 ? 0 : 55 + r * 40),
                (byte)(g == 0 ? 0 : 55 + g * 40),
                (byte)(b == 0 ? 0 : 55 + b * 40));
        }

        // Grayscale ramp (indices 232-255)
        if (index >= 232 && index <= 255)
        {
            byte v = (byte)(8 + (index - 232) * 10);
            return new TermColor(v, v, v);
        }

        return Palette16[7];
    }
}

/// <summary>
/// Virtual terminal screen buffer supporting an NxM grid of colored cells,
/// cursor tracking, scrolling, and erase operations.
/// </summary>
public class TerminalBuffer
{
    public const int DefaultScrollbackLines = 2000;
    public const int MaximumScrollbackLines = 200000;

    public int Columns { get; private set; }
    public int Rows    { get; private set; }

    private TerminalCell[,] _cells;
    private TerminalCell[,]? _resizeBackupCells;
    private int _resizeBackupColumns;
    private int _resizeBackupRows;
    private int _resizeBackupCursorCol;
    private int _resizeBackupCursorRow;
    private bool[]? _resizeBackupSoftWrappedRows;
    private bool _suppressResizeBackupInvalidation;
    private bool _pendingWrap;

    // ── Scrollback buffer ──────────────────────────────────────────────────
    /// <summary>Maximum number of lines retained in the off-screen scrollback buffer.</summary>
    private int _scrollbackLines = DefaultScrollbackLines;

    public int ScrollbackLines
    {
        get => _scrollbackLines;
        set
        {
            int normalized = NormalizeScrollbackLines(value);
            if (_scrollbackLines == normalized)
                return;

            _scrollbackLines = normalized;
            TrimScrollbackToLimit();
        }
    }

    // Lines ordered oldest → newest. Capped at ScrollbackLines entries.
    // Stored as a ring so high-output sessions do not pay List.RemoveAt(0)
    // copy costs each time the scrollback rolls over.
    private TerminalCell[]?[] _scrollback = [];
    private bool[] _scrollbackSoftWrapped = [];
    private int _scrollbackStart;
    private int _scrollbackCount;
    private long _scrollbackGeneration;
    private bool[] _softWrappedRows;

    /// <summary>Number of lines currently held in the scrollback buffer.</summary>
    public int ScrollbackCount => _scrollbackCount;

    /// <summary>Approximate retained scrollback cell count for diagnostics.</summary>
    public long EstimatedScrollbackCellCount => (long)_scrollbackCount * Math.Max(0, Columns);

    /// <summary>
    /// Monotonic count of lines appended to scrollback over the life of the buffer.
    /// Lets the UI keep a scrolled-back viewport anchored even while old lines roll off.
    /// </summary>
    public long ScrollbackGeneration => _scrollbackGeneration;

    /// <summary>
    /// Returns the cells for scrollback line <paramref name="index"/> (0 = oldest).
    /// The returned array may be shorter than <see cref="Columns"/> if the terminal
    /// was wider when the line was captured; callers must bounds-check.
    /// </summary>
    public TerminalCell[] GetScrollbackLine(int index)
    {
        if ((uint)index >= (uint)_scrollbackCount || _scrollback.Length == 0)
            throw new ArgumentOutOfRangeException(nameof(index));

        return _scrollback[PhysicalScrollbackIndex(index)] ?? [];
    }

    public static int NormalizeScrollbackLines(int value)
        => Math.Clamp(value, 0, MaximumScrollbackLines);

    public string GetLineText(int row)
    {
        if (row < 0 || row >= Rows)
            return string.Empty;

        var chars = new char[Columns];
        for (int col = 0; col < Columns; col++)
            chars[col] = _cells[row, col].Char;

        return new string(chars).TrimEnd();
    }

    public int  CursorCol    { get; set; }
    public int  CursorRow    { get; set; }
    public bool CursorVisible { get; set; } = true;

    // Scroll region (inclusive, 0-based)
    public int ScrollTop    { get; private set; }
    public int ScrollBottom { get; private set; }

    // Current attribute for new writes
    public TermColor CurrentFg    { get; set; } = AnsiColor.ToColor(7);
    public TermColor CurrentBg    { get; set; } = AnsiColor.ToColor(0);
    public bool      CurrentBlink { get; set; } = false;

    // Dirty flag – terminal views use a versioned dirty stamp so redraw requests
    // are not lost if new output arrives while a frame is being rendered.
    private long _dirtyVersion = 1;
    private long _acknowledgedDirtyVersion;
    private int _dirtyBatchDepth;
    private bool _dirtyDuringBatch;

    public event Action? DirtyRaised;

    public long DirtyVersion => Volatile.Read(ref _dirtyVersion);

    public bool Dirty
    {
        get => DirtyVersion != Volatile.Read(ref _acknowledgedDirtyVersion);
        set
        {
            if (value)
            {
                MarkDirty();
                return;
            }

            AcknowledgeDirty(DirtyVersion);
        }
    }

    public TerminalBuffer(int columns = 80, int rows = 24)
    {
        Columns      = columns;
        Rows         = rows;
        _cells       = new TerminalCell[rows, columns];
        _softWrappedRows = new bool[rows];
        ScrollTop    = 0;
        ScrollBottom = rows - 1;
        Reset();
    }

    public IDisposable BeginUpdate()
    {
        _dirtyBatchDepth++;
        return new DirtyBatch(this);
    }

    private void EndUpdate()
    {
        if (_dirtyBatchDepth <= 0)
            return;

        _dirtyBatchDepth--;
        if (_dirtyBatchDepth != 0 || !_dirtyDuringBatch)
            return;

        _dirtyDuringBatch = false;
        MarkDirty();
    }

    private void MarkDirty()
    {
        if (_dirtyBatchDepth > 0)
        {
            _dirtyDuringBatch = true;
            return;
        }

        Interlocked.Increment(ref _dirtyVersion);
        DirtyRaised?.Invoke();
    }

    private void TrimScrollbackToLimit()
    {
        int previousCount = _scrollbackCount;
        EnsureScrollbackCapacity(_scrollbackLines);
        if (_scrollbackCount != previousCount)
            MarkDirty();
    }

    private int PhysicalScrollbackIndex(int logicalIndex)
        => (_scrollbackStart + logicalIndex) % _scrollback.Length;

    private void EnsureScrollbackCapacity(int capacity)
    {
        capacity = NormalizeScrollbackLines(capacity);
        if (_scrollback.Length == capacity)
            return;

        var newScrollback = new TerminalCell[]?[capacity];
        var newSoftWrapped = new bool[capacity];
        int copyCount = Math.Min(_scrollbackCount, capacity);
        int skip = _scrollbackCount - copyCount;
        for (int i = 0; i < copyCount; i++)
        {
            int oldIndex = PhysicalScrollbackIndex(skip + i);
            newScrollback[i] = _scrollback[oldIndex];
            newSoftWrapped[i] = _scrollbackSoftWrapped[oldIndex];
        }

        _scrollback = newScrollback;
        _scrollbackSoftWrapped = newSoftWrapped;
        _scrollbackStart = 0;
        _scrollbackCount = copyCount;
    }

    private void AddScrollbackLine(TerminalCell[] line, bool softWrapped)
    {
        if (_scrollbackLines <= 0)
            return;

        EnsureScrollbackCapacity(_scrollbackLines);
        if (_scrollback.Length == 0)
            return;

        int writeIndex;
        if (_scrollbackCount < _scrollback.Length)
        {
            writeIndex = (_scrollbackStart + _scrollbackCount) % _scrollback.Length;
            _scrollbackCount++;
        }
        else
        {
            writeIndex = _scrollbackStart;
            _scrollbackStart = (_scrollbackStart + 1) % _scrollback.Length;
        }

        _scrollback[writeIndex] = line;
        _scrollbackSoftWrapped[writeIndex] = softWrapped;
        _scrollbackGeneration++;
    }

    private sealed class DirtyBatch(TerminalBuffer owner) : IDisposable
    {
        private TerminalBuffer? _owner = owner;

        public void Dispose()
        {
            TerminalBuffer? owner = _owner;
            if (owner == null)
                return;

            _owner = null;
            owner.EndUpdate();
        }
    }

    public void AcknowledgeDirty(long version)
    {
        long dirtyVersion = DirtyVersion;
        long acknowledgedVersion = Math.Min(version, dirtyVersion);
        Volatile.Write(ref _acknowledgedDirtyVersion, acknowledgedVersion);
    }

    // ── Cell access ────────────────────────────────────────────────────────

    public TerminalCell this[int row, int col] => _cells[row, col];

    public void SetCell(int row, int col, char ch, TermColor fg, TermColor bg)
    {
        InvalidateResizeBackup();
        if (row < 0 || row >= Rows || col < 0 || col >= Columns) return;
        _cells[row, col] = new TerminalCell { Char = ch, Foreground = fg, Background = bg };
        Dirty = true;
    }

    /// <summary>Writes a character at the current cursor position and advances.</summary>
    public void WriteChar(char ch)
    {
        if (_pendingWrap)
        {
            _pendingWrap = false;
            LineFeed(softWrap: true);
            CursorCol = 0;
        }

        SetCell(CursorRow, CursorCol, ch, CurrentFg, CurrentBg);
        _cells[CursorRow, CursorCol].Blink = CurrentBlink;

        if (CursorCol >= Columns - 1)
        {
            _pendingWrap = true;
        }
        else
        {
            CursorCol++;
        }
    }

    // ── Cursor movement ────────────────────────────────────────────────────

    public void SetCursor(int row, int col)
    {
        _pendingWrap = false;
        CursorRow = Math.Clamp(row, 0, Rows - 1);
        CursorCol = Math.Clamp(col, 0, Columns - 1);
    }

    public void MoveCursorRelative(int dRow, int dCol)
        => SetCursor(CursorRow + dRow, CursorCol + dCol);

    public void CarriageReturn()
    {
        _pendingWrap = false;
        CursorCol = 0;
    }

    public void LineFeed() => LineFeed(softWrap: false);

    private void LineFeed(bool softWrap)
    {
        _pendingWrap = false;
        _softWrappedRows[CursorRow] = softWrap;
        if (CursorRow >= ScrollBottom)
            ScrollUp();
        else
            CursorRow++;
    }

    public void BackSpace()
    {
        _pendingWrap = false;
        if (CursorCol > 0) CursorCol--;
    }

    public void Tab()
    {
        _pendingWrap = false;
        int next = ((CursorCol / 8) + 1) * 8;
        CursorCol = Math.Min(next, Columns - 1);
    }

    // ── Scroll operations ──────────────────────────────────────────────────

    public void SetScrollRegion(int top, int bottom)
    {
        ScrollTop    = Math.Clamp(top, 0, Rows - 1);
        ScrollBottom = Math.Clamp(bottom, 0, Rows - 1);
    }

    public void ScrollUp(int lines = 1)
    {
        InvalidateResizeBackup();
        for (int n = 0; n < lines; n++)
        {
            // Save the departing top line to the scrollback buffer (only when
            // the scroll region covers the full viewport, matching xterm behaviour).
            if (ScrollbackLines > 0 && ScrollTop == 0)
            {
                var saved = new TerminalCell[Columns];
                for (int c = 0; c < Columns; c++)
                    saved[c] = _cells[ScrollTop, c];
                AddScrollbackLine(saved, _softWrappedRows[ScrollTop]);
            }

            for (int r = ScrollTop; r < ScrollBottom; r++)
            {
                for (int c = 0; c < Columns; c++)
                    _cells[r, c] = _cells[r + 1, c];
                _softWrappedRows[r] = _softWrappedRows[r + 1];
            }
            ClearLineToDefault(ScrollBottom, 0, Columns - 1);
            _softWrappedRows[ScrollBottom] = false;
        }
        Dirty = true;
    }

    public void ScrollDown(int lines = 1)
    {
        InvalidateResizeBackup();
        for (int n = 0; n < lines; n++)
        {
            for (int r = ScrollBottom; r > ScrollTop; r--)
            {
                for (int c = 0; c < Columns; c++)
                    _cells[r, c] = _cells[r - 1, c];
                _softWrappedRows[r] = _softWrappedRows[r - 1];
            }
            ClearLineToDefault(ScrollTop, 0, Columns - 1);
            _softWrappedRows[ScrollTop] = false;
        }
        Dirty = true;
    }

    // ── Erase operations ───────────────────────────────────────────────────

    public void EraseLine(int row, int fromCol, int toCol)
    {
        InvalidateResizeBackup();
        for (int c = fromCol; c <= toCol && c < Columns; c++)
            _cells[row, c] = new TerminalCell { Char = ' ', Foreground = CurrentFg, Background = CurrentBg };
        if (fromCol <= 0 && toCol >= Columns - 1)
            _softWrappedRows[row] = false;
        Dirty = true;
    }

    private void ClearLineToDefault(int row, int fromCol, int toCol)
    {
        for (int c = Math.Max(0, fromCol); c <= toCol && c < Columns; c++)
            _cells[row, c] = TerminalCell.Default;
    }

    public void EraseDisplay(int fromRow = 0) => EraseDisplay(fromRow, Rows - 1);
    public void EraseDisplay(int fromRow, int toRow)
    {
        for (int r = fromRow; r <= toRow && r < Rows; r++)
            EraseLine(r, 0, Columns - 1);
    }

    // ── Insert / Delete ────────────────────────────────────────────────────

    public void InsertChars(int count)
    {
        InvalidateResizeBackup();
        for (int c = Columns - 1; c >= CursorCol + count; c--)
            _cells[CursorRow, c] = _cells[CursorRow, c - count];
        EraseLine(CursorRow, CursorCol, CursorCol + count - 1);
    }

    public void DeleteChars(int count)
    {
        InvalidateResizeBackup();
        for (int c = CursorCol; c < Columns - count; c++)
            _cells[CursorRow, c] = _cells[CursorRow, c + count];
        EraseLine(CursorRow, Columns - count, Columns - 1);
    }

    // ── Resize ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Resize the terminal grid, preserving as much existing content as fits.
    /// Scroll region is reset to the full new height.
    /// </summary>
    public void Resize(int columns, int rows)
    {
        if (columns == Columns && rows == Rows) return;
        columns = Math.Max(10, columns);
        rows    = Math.Max(3,  rows);

        bool shrinking = columns < Columns || rows < Rows;
        bool growing = columns > Columns || rows > Rows;

        if (shrinking && _resizeBackupCells == null)
            SaveResizeBackup();

        TerminalCell[,] sourceCells = _cells;
        bool[] sourceSoftWrappedRows = _softWrappedRows;
        int sourceColumns = Columns;
        int sourceRows = Rows;
        int sourceCursorCol = CursorCol;
        int sourceCursorRow = CursorRow;
        bool restoreFromBackup = growing && _resizeBackupCells != null;
        if (restoreFromBackup)
        {
            sourceCells = _resizeBackupCells!;
            sourceSoftWrappedRows = _resizeBackupSoftWrappedRows ?? new bool[_resizeBackupRows];
            sourceColumns = _resizeBackupColumns;
            sourceRows = _resizeBackupRows;
            sourceCursorCol = _resizeBackupCursorCol;
            sourceCursorRow = _resizeBackupCursorRow;
        }

        if (columns != sourceColumns)
        {
            (sourceCells, sourceSoftWrappedRows, sourceRows) =
                ReflowSoftWrappedRows(sourceCells, sourceSoftWrappedRows, sourceRows, sourceColumns, columns);
            sourceColumns = columns;
            sourceCursorRow = Math.Clamp(sourceCursorRow, 0, Math.Max(0, sourceRows - 1));
            sourceCursorCol = Math.Clamp(sourceCursorCol, 0, columns - 1);
        }

        var newCells = new TerminalCell[rows, columns];
        var newSoftWrappedRows = new bool[rows];
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < columns; c++)
                newCells[r, c] = TerminalCell.Default;

        int sourceRowStart = 0;
        if (rows < sourceRows)
        {
            int maxStart = sourceRows - rows;
            sourceRowStart = Math.Clamp(sourceCursorRow - rows + 1, 0, maxStart);
        }

        int copyRows = Math.Min(rows, sourceRows - sourceRowStart);
        int copyCols = Math.Min(columns, sourceColumns);
        for (int r = 0; r < copyRows; r++)
        {
            for (int c = 0; c < copyCols; c++)
                newCells[r, c] = sourceCells[sourceRowStart + r, c];
            newSoftWrappedRows[r] = sourceSoftWrappedRows[sourceRowStart + r];
        }

        _suppressResizeBackupInvalidation = true;
        _cells       = newCells;
        _softWrappedRows = newSoftWrappedRows;
        Columns      = columns;
        Rows         = rows;
        ScrollTop    = 0;
        ScrollBottom = rows - 1;
        CursorCol    = Math.Clamp(sourceCursorCol, 0, columns - 1);
        CursorRow    = Math.Clamp(sourceCursorRow - sourceRowStart, 0, rows - 1);
        _pendingWrap = false;
        _suppressResizeBackupInvalidation = false;

        if (_resizeBackupCells != null &&
            columns >= _resizeBackupColumns &&
            rows >= _resizeBackupRows)
        {
            ClearResizeBackup();
        }

        Dirty        = true;
    }

    // ── Full reset ─────────────────────────────────────────────────────────

    public void Reset()
    {
        InvalidateResizeBackup();
        for (int r = 0; r < Rows; r++)
        {
            for (int c = 0; c < Columns; c++)
                _cells[r, c] = TerminalCell.Default;
            _softWrappedRows[r] = false;
        }
        CursorCol    = 0;
        CursorRow    = 0;
        _pendingWrap = false;
        ScrollTop    = 0;
        ScrollBottom = Rows - 1;
        CurrentFg    = AnsiColor.ToColor(7);
        CurrentBg    = AnsiColor.ToColor(0);
        // Intentionally do NOT clear _scrollback here — a terminal reset (ESC c)
        // from the server should not destroy the session scroll history.
        Dirty        = true;
    }

    public void ClearAll()
    {
        _scrollback = [];
        _scrollbackSoftWrapped = [];
        _scrollbackStart = 0;
        _scrollbackCount = 0;
        _scrollbackGeneration++;
        Reset();
    }

    private void SaveResizeBackup()
    {
        _resizeBackupCells = CloneCells(_cells, Rows, Columns);
        _resizeBackupSoftWrappedRows = (bool[])_softWrappedRows.Clone();
        _resizeBackupColumns = Columns;
        _resizeBackupRows = Rows;
        _resizeBackupCursorCol = CursorCol;
        _resizeBackupCursorRow = CursorRow;
    }

    private static TerminalCell[,] CloneCells(TerminalCell[,] cells, int rows, int columns)
    {
        var clone = new TerminalCell[rows, columns];
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < columns; c++)
                clone[r, c] = cells[r, c];
        return clone;
    }

    private void ClearResizeBackup()
    {
        _resizeBackupCells = null;
        _resizeBackupSoftWrappedRows = null;
        _resizeBackupColumns = 0;
        _resizeBackupRows = 0;
        _resizeBackupCursorCol = 0;
        _resizeBackupCursorRow = 0;
    }

    private void InvalidateResizeBackup()
    {
        if (_suppressResizeBackupInvalidation)
            return;

        ClearResizeBackup();
    }

    private static (TerminalCell[,] Cells, bool[] SoftWrappedRows, int Rows) ReflowSoftWrappedRows(
        TerminalCell[,] sourceCells,
        bool[] sourceSoftWrappedRows,
        int sourceRows,
        int sourceColumns,
        int targetColumns)
    {
        var rows = new List<TerminalCell[]>();
        var softWrappedRows = new List<bool>();

        int row = 0;
        while (row < sourceRows)
        {
            bool startsSoftGroup = sourceSoftWrappedRows[row];
            if (!startsSoftGroup)
            {
                rows.Add(CopyRow(sourceCells, row, sourceColumns, targetColumns));
                softWrappedRows.Add(false);
                row++;
                continue;
            }

            var logicalLine = new List<TerminalCell>(sourceColumns * 2);
            while (row < sourceRows)
            {
                bool softWrap = sourceSoftWrappedRows[row];
                int take = softWrap ? sourceColumns : LastContentColumn(sourceCells, row, sourceColumns) + 1;
                for (int c = 0; c < take; c++)
                    logicalLine.Add(sourceCells[row, c]);

                row++;
                if (!softWrap)
                    break;
            }

            if (logicalLine.Count == 0)
            {
                rows.Add(CreateBlankRow(targetColumns));
                softWrappedRows.Add(false);
                continue;
            }

            int offset = 0;
            while (offset < logicalLine.Count)
            {
                TerminalCell[] outRow = CreateBlankRow(targetColumns);
                int take = Math.Min(targetColumns, logicalLine.Count - offset);
                for (int c = 0; c < take; c++)
                    outRow[c] = logicalLine[offset + c];

                offset += take;
                rows.Add(outRow);
                softWrappedRows.Add(offset < logicalLine.Count);
            }
        }

        if (rows.Count == 0)
        {
            rows.Add(CreateBlankRow(targetColumns));
            softWrappedRows.Add(false);
        }

        var cells = new TerminalCell[rows.Count, targetColumns];
        for (int r = 0; r < rows.Count; r++)
            for (int c = 0; c < targetColumns; c++)
                cells[r, c] = rows[r][c];

        return (cells, softWrappedRows.ToArray(), rows.Count);
    }

    private static TerminalCell[] CopyRow(TerminalCell[,] sourceCells, int row, int sourceColumns, int targetColumns)
    {
        TerminalCell[] output = CreateBlankRow(targetColumns);
        int copyCols = Math.Min(sourceColumns, targetColumns);
        for (int c = 0; c < copyCols; c++)
            output[c] = sourceCells[row, c];
        return output;
    }

    private static TerminalCell[] CreateBlankRow(int columns)
    {
        var row = new TerminalCell[columns];
        for (int c = 0; c < columns; c++)
            row[c] = TerminalCell.Default;
        return row;
    }

    private static int LastContentColumn(TerminalCell[,] cells, int row, int columns)
    {
        for (int c = columns - 1; c >= 0; c--)
        {
            if (cells[row, c].Char != ' ')
                return c;
        }

        return -1;
    }
}
