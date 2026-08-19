# TWX30 — GitHub Copilot Instructions

## Project Overview

TWX30 is a **C#/.NET 8+ rewrite of TWXProxy**, originally a Delphi/Pascal proxy for the BBS door game **TradeWars 2002**. It includes a compiler, decompiler, terminal UI client, and full proxy engine — all maintaining compatibility with the original TWX script format.

---

## Repository Layout

```
Source/
  Core/           → Class library (TWXProxy.csproj, net10.0) — no UI dependencies
  MTC/            → Avalonia terminal UI client (MAUI target; macOS/Windows Catalyst)
  TWXC/           → CLI compiler: .ts source → .cts bytecode
  TWXD/           → CLI decompiler: .cts bytecode → .ts source
  TWXP/           → Server/proxy management UI (Avalonia/MAUI)
```

## Solution Files

- **TWXProxy.sln** — master solution
- **TWXProxy.csproj** — Core class library (compiled into MTC, TWXC, TWXD, TWXP)
- Build: `./build-mtc.sh` produces `Source/MTC/publish/osx-arm64/MTC`

---

## Core Architecture

### Script Engine (`Core/Script.cs`, `Core/ScriptCmd.cs`)

- `ModInterpreter` — manages up to 20 concurrently-running scripts
- `Script` — individual script instance: compiled bytecode array (`CmdParam[] _code`), instruction pointer (`_codePos`), variable table, trigger lists
- `Trigger` — event handler; types: `Text`, `TextLine`, `TextOut`, `Delay`, `Event`, `TextAuto`
- `PauseReason` enum — why a script is paused: `Command`, `OpenMenu`, `Input`, `Auth`
- Scripts are compiled from `.ts` → `.cts` on first load if the source is newer

### Compiler (`Core/ScriptCmp.cs`)

Pipeline: tokenize `.ts` → parse → code-gen → emit `.cts` binary.

**Binary format (`.cts`) — 24-byte Pascal header, then sections in order:**
```
Header (24 bytes — Pascal TScriptFileHeader, default Win32 alignment):
  offset  0    : ShortString length byte (10 = 0x0A)
  offset  1-10 : "TWX SCRIPT" (10 ASCII chars, no null)
  offset 11    : 1 alignment pad byte
  offset 12-13 : Version (uint16, little-endian)
  offset 14-15 : 2 alignment pad bytes
  offset 16-19 : DescSize (int32, little-endian)
  offset 20-23 : CodeSize (int32, little-endian)
Description block (DescSize bytes)
Code block     (CodeSize bytes)
Parameters     (repeated until terminator byte 0x00):
  type byte (1=TCmdParam/const, 2=TVarParam/var)
  value: int32 length + XOR-113 encrypted bytes
  name (type=2 vars only): int32 length + XOR-113 encrypted bytes
Terminator     (0x00)
Includes       (repeated until int32 length == 0):
  int32 length + raw ASCII name bytes
Labels         (until EOF):
  int32 location + int32 length + raw ASCII name bytes
```
Current version = 6.

**Param list (`_paramList`) and deduplication:**
- `List<CmdParam> _paramList` — global table for the whole script file
- `FindOrCreateVariable(string varName)` — case-insensitive linear search; returns existing index or appends new `VarParam`
- **All temp variable sites must use `FindOrCreateVariable()`, not `_paramList.Add()` directly**, so that names like `$$_t1` used on every source line resolve to the same parameter slot instead of creating a new entry each time

**Per-line temp var counters (reset each source line):**
- `_sysVarCount` — resets to 0 at start of `CompileParamLine(string line, ...)` (the per-line entry point). Used for `$$N` temp vars in `CompileTree`
- `_ifLabelCount` — **never** resets; provides globally-unique branch label names (`::N`). Do NOT use for temp var names.
- Matching Pascal: `SysVarCount := 0` at `ScriptCmp.pas` line 1767 (per-line reset); Pascal names temp vars `$$1`, `$$2`... which deduplicate via `FindOrCreate`

**New Pascal-style expression tree compiler (as of commit 25aeca1):**
- `CompileParamLine(string)` — operator-linking tokenizer: after `ConvertOps`+`ConvertConditions`, operator chars have `linked=true` and accumulate INTO the current token. `$a >= $b` → after pre-processing → one token `$a<OP_GE>$b` → `BreakDown` handles it.
- `BreakDown(string)` — static; strips outer parens, splits on operator precedence groups:
  - Group1 = `=<>&` + sentinel chars (comparisons/logical/concat — lowest priority, split first)
  - Group2 = `+-` (additive)
  - Group3 = `*/%` (multiplicative — highest priority, split last)
- `CompileTree(ExprNode, lineNumber, scriptID)` — emits opcodes for the expression tree; uses `$$N` temp vars
- `CompileParam(string, lineNumber, scriptID)` — calls BreakDown+CompileTree then `CompileParameter`; used in `CompileCommand` loop
- `CompileParamToVar(string, lineNumber, scriptID)` — like CompileParam but returns the result var name; used in `HandleWhile`/`HandleIf`/`HandleElseIf`
- `WriteArrayIndexes` — runs each array index through `CompileParamToVar` so `$arr[($i+1)]` compiles the index to opcodes instead of storing `($i+1)` as PARAM_CONST
- PARAM_CONST bare identifiers (trigger names etc.) are uppercased to match Pascal's implicit ToUpperCase behaviour

**Result of unified expression-tree compiler on `momtest.ts` (11,657 lines):**
```
Old pipeline: 645,618 B  (17,932 params — expression fragments as PARAM_CONST)
New compiler: 567,653 B  (13,896 params)
Pascal orig:  566,594 B  (13,882 params)
Delta: 0.19% vs Pascal
```

### Parameters (`Core/ScriptCmd.cs`)

Five parameter types:
| Type | Constant | Description |
|---|---|---|
| `PARAM_VAR` | 1 | User variable (optionally array-indexed) |
| `PARAM_CONST` | 2 | Compiler string constant |
| `PARAM_SYSCONST` | 3 | Read-only system constant |
| `PARAM_PROGVAR` | 4 | Program variable (game state) |
| `PARAM_CHAR` | 5 | Literal ASCII character code |

Key classes:
- `CmdParam` — base param: `Value` (string), `DecValue` (double), `SigDigits`, `IsNumeric`
- `VarParam : CmdParam` — user variable with array `_vars` list
- `ProgVarParam : CmdParam` — read-only system program variable

### Command Set (`Core/ScriptCmdImpl*.cs`)

153 total commands, split across implementation files:
- **ScriptCmdImpl.cs** — arithmetic, comparison, logic, string ops, control flow, I/O
- **ScriptCmdImpl_Arrays.cs** — `SETARRAY`, `SORT` and array indexing
- **ScriptCmdImpl_Database.cs** — `GETSECTOR`, `GETSECTORPARAMETER`, `GETPORT`, `LOADGLOBAL`, `SAVEGLOBAL`, `CLEARGLOBALS`
- **ScriptCmdImpl_Network.cs** — `CONNECT`, `DISCONNECT`, `READ`, `WRITE`, `SEND`, `PROCESSIN`, `PROCESSOUT`
- **ScriptCmdImpl_ScriptMgmt.cs** — `HALT`, `STOP`, `PAUSE`, `DELAY`, `ECHO`, `WINDOW`, `LOGGING`, `SYSTEMSCRIPT`
- **ScriptCmdImpl_Triggers.cs** — `SETTEXTTRIGGER`, `SETTEXTLINETRIGGER`, `SETTEXTOUTTRIGGER`, `SETDELAYTRIGGER`, `SETEVENTTRIGGER`, `KILLTRIGGER`, `KILLALLTRIGGERS`
- **ScriptCmdImpl_VarPersistence.cs** — `LOADGLOBAL`, `SAVEGLOBAL`, `CLEARGLOBALS`

### Script Variable Persistence (`Core/ScriptCmdImpl_VarPersistence.cs`)

`_scriptVars` is a **static dictionary** (`Dictionary<string, Dictionary<string, string>>`) keyed by script name, surviving individual script restarts. This means variables saved with `SAVEGLOBAL` / `LOADGLOBAL` persist across runs in the same proxy session.

Lifecycle cleanup:
- `ClearVarsForScript(string scriptId)` — called from `Script.Dispose()` to clear one script's entries on `HALT`/`STOP`
- `ClearAllScriptVars()` — called from `Network.StopAsync()` when the proxy shuts down to fully flush the static dict

Both methods must be kept in sync with any refactoring of `_scriptVars`.

### AutoRecorder (`Core/AutoRecorder.cs`)

Parses live game server output line-by-line to keep the sector database current.

Key state:
```csharp
int  _currentSector        // current sector from "Command [TL]:" prompt
bool _inHoloScan           // inside Holographic scan display
bool _inWarpLane           // inside Frontier map path output
bool _inPortReport         // inside Commerce report
bool _inCIM                // inside Computer Information Menu download
```

**Critical invariant:** `_inWarpLane` must be cleared when a `Sector  : NNNN` header line is seen (i.e., we've arrived and the warp-lane traversal is done). This was a historical bug — fixed in TWX30.

Event fired: `CurrentSectorChanged` — raised when sector changes via prompt.

### Network / Proxy (`Core/Network.cs`)

`GameInstance` — core proxy class:
- Accepts local client connections (`TcpListener`)
- Relays to game server (`TcpClient`)
- Two async tasks: `_serverReadTask` (server→client) and `_localReadTask` (client→server)
- `_directMode` — true when embedded inside MTC (pipe instead of TCP)
- `_inCommandMode` — true when in `**COMMAND**` mode (scripts intercept traffic)

Traffic flow:
```
LocalClient → [command-mode check] → GameServer
GameServer  → [AutoRecorder] → [trigger firing] → LocalClient
```

Telnet: RFC 854, handles WILL/WONT/DO/DONT; advertises terminal type "ANSI"; NAWS negotiation.

### Menu System (`Core/Menu.cs`)

`ModMenu` handles the in-proxy `**COMMAND**` mode UI: data display, script management, and user prompts.

Key types:
- `InputMode` enum — current interactive state: `None`, `MainMenu`, `DataMenu`, `ScriptMenu`, `DataResetConfirm`, `Input`, `Auth`
- `HandleDataMenuAsync` — processes keystrokes in the data sub-menu
- `ProcessCollectedInputAsync` — dispatches multi-char confirmation inputs (e.g., "YES" to reset)

**Data menu 'R' (Reset sectors):** Prompts for "YES" confirmation, then calls `GlobalModules.Database.ResetSectors()`. Implemented via `InputMode.DataResetConfirm`.

### Database (`Core/Database.cs`)

In-memory sector graph with persistence.

```csharp
class Sector {
    int          Number;
    List<int>    Warps;        // adjacent sectors
    List<Port>   Ports;        // up to 3 ports per sector
    List<Planet> Planets;
    List<Fighter> Fighters;
    List<Mine>   Mines;
    int          NavHazPercent;
    DateTime     Updated;
    string       Anomaly;
}
```

`ResetSectors()` — clears `_sectors`, `_planets`, `_maxSectorSeen`, repopulates with blank `SectorData`, and saves. Exposed on `ITWXDatabase` interface in `Core.cs`.

---

## TWX Script Language (`.ts` / `.cts`)

### Syntax

```twx
# Comment  (also // style)
systemscript          // Mark as auto-load

setvar $count 0
setvar $result ($a + $b)

setarray $grid 10 20           // 10×20 2-D array
setvar $grid(2,3) "hello"
setvar $x $grid(2,3)

:loop
    setvar $count ($count + 1)
    if ($count < 100)
        goto :loop
    end

:mysub
    echo "in sub"
    return

gosub :mysub
halt
```

### Triggers

```twx
settexttrigger     myT :label "match text"      // anywhere in input
settextlinetrigger myT :label "match text"      // on a complete line
settextouttrigger  myT :label "text to output"  // on outgoing text
setdelaytrigger    myT 5000   :label            // after N milliseconds
seteventtrigger    myT "TIME HIT" :label        // on game event string
killtrigger myT
killalltriggers
```

### Control Flow

| Command | Description |
|---|---|
| `goto :label` | Unconditional jump |
| `gosub :label` | Call subroutine (push return) |
| `return` | Return from subroutine |
| `pause` | Suspend until trigger fires |
| `halt` | Stop this script |
| `stop` | Stop all scripts |
| `delay N` | Sleep N milliseconds |
| `getinput $var` | Pause for user keyboard input |

### String Commands

`mergetext`, `replacetext`, `striptext`, `getword`, `getwordpos`, `getlength`, `getwordcount`, `cuttext`, `format`, `padleft`, `padright`, `trim`, `truncate`, `splittext`, `uppercase`, `lowercase`

### Variable Prefix Convention

- `$variable` — global script variable
- `%variable` — local scope (cleared per trigger invocation)
- `$SYSCONST` — read-only system constant (ALL CAPS)

### Key System Constants

```
CONNECTED, CURRENTLINE, CURRENTANSILINE, DATE, TIME, FALSE, TRUE
GAME, GAMENAME, LICENSENAME, LOGINNAME, PASSWORD
CURRENTSECTOR, SECTORS
PORT.CLASS, PORT.ORG, PORT.EQUIP, PORT.FUEL, PORT.EXISTS, PORT.UPDATED
SECTOR.WARPS, SECTOR.WARPCOUNT, SECTOR.DENSITY, SECTOR.EXPLORED
SECTOR.FIGS.OWNER, SECTOR.FIGS.QUANTITY, SECTOR.FIGS.TYPE
SECTOR.MINES.OWNER, SECTOR.MINES.QUANTITY, SECTOR.NAVHAZ
STARDOCK, ALPHACENTAURI, RYLOS
```

### Operators

- Arithmetic: `+` `-` `*` `/` `%`
- Comparison: `=` `<>` `<` `>` `<=` `>=`
- Logic: `&` (AND) `|` (OR) `^` (XOR) `~` (NOT)
- Concatenation: `"Hello " & $name & "!"` (inside expressions)
- Character literals: `#13` (CR), `#10` (LF), `#27` (ESC), `#32` (space)

### Decimal Precision

Pascal TWX defaults `DecimalPrecision = 0`, meaning **all numeric output is rounded to the nearest integer** unless a script calls `SETPRECISION N`.

C# implementation:
- `CmdParam._sigDigits` — byte field tracking display precision for that parameter
- `Script.DecimalPrecision` — int property set by `SETPRECISION`; default 0
- `CmdParam.Value` getter: when `_sigDigits == 0` and the value has a fractional part, formats as `Math.Round(_decValue, MidpointRounding.AwayFromZero).ToString()` — **not** the raw double
- All arithmetic commands (`CmdAdd`, `CmdSubtract`, `CmdMultiply`, `CmdDivide`, `CmdModulus`) set `SigDigits = (byte)script.DecimalPrecision` on the result so `SETPRECISION` actually affects output
- `_decValue` always retains full IEEE-754 precision; rounding only affects the string representation retrieved via `Value`

---

## MTC Terminal Application (`Source/MTC/`)

Avalonia-based cross-platform terminal UI.

Key classes:
- `MainWindow` — top-level; owns `TelnetClient`, `TerminalBuffer`, `AnsiParser`, `TerminalControl`, `GameState`
- `TelnetClient` — RFC 854 telnet + basic option negotiation
- `TerminalBuffer` — 80×24 character grid with ANSI attributes
- `AnsiParser` — parses SGR escape codes
- `TerminalControl` — Avalonia Canvas renderer for the terminal grid
- `GameState` — parsed ship status (sector, turns, credits, holds, equipment)
- `ConnectionProfile` — saved connection credentials (host, port, login)

Layout: left sidebar (165 px) with ship status + 80×24 ANSI terminal + status bar.

Connection modes:
1. **Remote** — TCP to a running proxy server
2. **Embedded** — launches `GameInstance` inline (pipe mode, no TCP listener)
3. **Listener** — MTC accepts incoming game-server connections

---

## TWXD Decompiler (`Source/TWXD/`)

`ScriptDecompiler.cs` reverses `.cts` → `.ts`:
1. Read 24-byte Pascal header (`ReadScriptFileHeader` from `ScriptCmp.cs`)
2. Load description, code block, parameter table, include list, label table
3. Parse bytecode: command ID → name lookup → format parameters
4. Emit readable `.ts` source

`OriginalCommandNames[]` — 153 entries mapping command byte → name string.

**Key decompiler design decisions (bugs fixed):**

**ELSEIF / ConLabel tracking:** Pascal emits a `ConLabel` at two positions for ELSEIF: once at the else-start and again at the END position. When `ELSEIF` processing removes `ConLabel_outer` from `branchLabels`, it reappears at end position unmatched — which made the decompiler think the next `if` was a `while`. Fix: `HashSet<string> elseifConsumedLabels` tracks and silently consumes the reappearing outer ConLabel.

**MERGETEXT decompilation:** The decompiler builds a SETVAR expression by joining parts. Must use `&` as separator — **not** a space — to produce valid `.ts` source: `tempVars[dest] = $"{exp1}&{exp2}"`.

**`NeedsQuotes()` quoting rules:**
- `#N` (character literal) — only unquoted when `#` is followed immediately by digits; standalone `#` must be quoted
- `:label` — only unquoted when `Length > 1`; bare `:` must be quoted
- String with embedded spaces, operators, or special chars → quote it
- Already-quoted strings (`"..."`) → leave alone

---

## Build & Install

Publish self-contained single-file binaries for macOS arm64:
```sh
# Compiler
Source/build-twxc.sh    # produces local bin/osx-arm64/twxc and installs it to /usr/local/bin/twxc

# Decompiler
Source/build-twxd.sh    # produces local bin/osx-arm64/twxd

# MTC terminal client
Source/build-mtc.sh     # produces local bin/osx-arm64/MTC

# TWXP standalone proxy
Source/build-twxp.sh    # produces local bin/osx-arm64/twxp
```

`bin/` is generated output and must not be committed to GitHub. Publish release binaries through
`Source/publish-sourceforge-bundles.sh --rebuild`, which packages MTC, TWXP, TWXC, and TWXD and uploads
the platform packages to SourceForge (`twx30-osx-*.pkg`, `twx30-win-x64.zip`, and Linux `.deb`/`.rpm`
all-in-one plus split component packages). macOS installers provide UI choices; Linux choices are split
packages because APT/RPM installs are not interactive.

Verify after install: `twxc ~/twx/scripts/somescript.ts` and check `.cts` output size.

---

## Conventions & Patterns

- **Debug logging**: `GlobalModules.DebugLog(...)` writes to `/tmp/mtc_debug.log`
- **Null safety**: prefer `is null` / `is not null` over `== null`
- **Async**: use `CancellationToken` throughout network code; avoid `Thread.Sleep`
- **Parser regex**: compiled `static readonly Regex` fields at class level
- **Event naming**: `PascalCase`, delegate signature `(object sender, EventArgs e)`
- **CRLF**: game server uses `\r\n`; strip/split with care (use `TrimEnd('\r')` on lines)
- **Sector numbers**: always `int`; sector 0 is invalid/unknown
- **Encoding**: ASCII/Latin-1 for game traffic (not UTF-8)

---

## TradeWars 2002 Domain Knowledge

TradeWars 2002 is a space-trading BBS door game. Key concepts:

| Term | Meaning |
|---|---|
| **Sector** | Numbered location in space (1–65535 typical) |
| **Warp** | One-way corridor between sectors |
| **Port** | Trading post in a sector; buys/sells Fuel, Organics, Equipment |
| **Warp Lane** | Multi-hop path computed by Frontier Map (FM command) |
| **Holo Scan** | Holographic scanner — reveals nearby sectors |
| **Density Scan** | Shows fighter/mine counts around current sector (D command) |
| **CIM** | Computer Information Menu — bulk sector data download |
| **Stardock** | Federation headquarters sector |
| **Alpha Centauri** | Starting sector for new traders |
| **Turns** | Limited resource consumed by movement and actions |
| **Fighters** | Combat units deployed to defend sectors/ships |
| **Mines** | Defensive weapons placed in sectors |
| **NavHaz** | Navigation hazard percentage in a sector |
| **Command prompt** | `Command [TL={turns}]:[{sector}] (?=Help)?:` |
| **FM transwarp** | Frontier Map automated multi-hop warp sequence |
| **Surround** | Script technique: send multiple commands in one TCP packet |

### Common Game Output Patterns (for AutoRecorder regex)

```
Sector  : 1234             ← current sector header (D display)
Command [TL=500]:[1234] (?=Help)?:   ← command prompt
  Warps to Sector(s) :  1 2 3        ← warp list
  TO > 1234                          ← FM transwarp hop
The shortest path (N warps):         ← FM path header
Long Range Scan                      ← HoloScan start
```

---

## Development Notes

- When modifying AutoRecorder, test with real game traffic captures; regex changes can silently break sector update logic.
- Trigger dispatch happens on the network receive thread; keep trigger handlers short and non-blocking.
- Array variables use a flat `List<VarParam>` internally; multi-dimensional indexing is computed arithmetically from dimensions.
- The `.cts` file version must be bumped if the bytecode format changes (ScriptCmp.cs emit + ScriptDecompiler.cs read both need updates).
- MTC uses Avalonia's dispatcher (`Dispatcher.UIThread.InvokeAsync`) for all terminal UI updates from network threads.

### Script Lifecycle & Stop Order

When stopping a script (`HALT`, `STOP`, or proxy shutdown), the correct sequence matters:

1. `ModInterpreter.StopAll(cleanupTriggers: true)` — fires trigger cleanup on all running scripts
2. `ScriptRef.ClearAllScriptVars()` — flushes the static `_scriptVars` dict
3. `CloseConnections()` — tears down TCP

`StopBot()` in `ModInterpreter` routes through `Stop(index)` rather than calling `Dispose()` directly, to ensure trigger cleanup callbacks run in the right order.

`Script.Dispose()` calls `ScriptRef.ClearVarsForScript(ScriptName)` to clean that script's entries from the static dict even on individual halt.

### Trigger Cleanup on Kill/Stop

All triggers registered by a script must be cleaned up when that script stops. `KILLTRIGGER` and `KILLALLTRIGGERS` do this explicitly; `HALT`/`STOP`/proxy-shutdown must also call `KillAllTriggers()` on each script. Failure causes ghost triggers that fire on a dead script's label, throwing null-ref exceptions.

### Menu System Confirmation Pattern

For destructive menu operations (e.g., resetting all sector data), use the `InputMode.DataResetConfirm` pattern:
1. Set `_inputMode = InputMode.DataResetConfirm` and send the prompt
2. Accumulate keystrokes in `_collectedInput`
3. In `ProcessCollectedInputAsync`, compare against `"YES"` (case-insensitive) and execute or cancel

### AutoRecorder Warp Recording

Warp data is captured automatically from live game output. `RecordLine` is called by the proxy for every non-blank server line. `_rxWarps` matches `"Warps to Sector(s) :"` and `ParseWarpsLine` replaces all warp slots for the current sector. No extra recording step is needed when entering a new sector.

`_inWarpLane` must be cleared when a `Sector  : NNNN` header is seen — the warp lane traversal is complete at that point. Leaving it set causes subsequent sector lines to be silently swallowed as warp-lane output (historical bug, fixed).

---

## Compiler & Decompiler Round-Trip Verification

The gold standard test: decompile a Pascal-compiled `.cts`, recompile with `twxc`, and verify the output file size is within ~2% of the Pascal original. Larger deviations indicate a structural bloat bug.

Quick CTS file analysis with Python (sizes, param counts):
```python
import struct

def parse_params(data, offset):
    params = []
    while offset < len(data):
        ptype = data[offset]; offset += 1
        if ptype == 0: break
        length = struct.unpack_from('<i', data, offset)[0]; offset += 4
        val = data[offset:offset+length]; offset += length
        if ptype == 2:
            length2 = struct.unpack_from('<i', data, offset)[0]; offset += 4
            name = data[offset:offset+length2]; offset += length2
            params.append(('var', name, val))
        else:
            params.append(('const', val, None))
    return params, offset

with open('script.cts', 'rb') as f: data = f.read()
desc_size = struct.unpack_from('<i', data, 16)[0]
code_size = struct.unpack_from('<i', data, 20)[0]
offset = 24 + desc_size + code_size
params, after = parse_params(data, offset)
nvars = sum(1 for p in params if p[0]=='var')
nconsts = sum(1 for p in params if p[0]=='const')
xk = 0x51  # XOR key 113
for p in params[:10]:  # decode first 10
    val = bytes(b ^ xk for b in p[1]).decode('latin-1')
    name = bytes(b ^ xk for b in p[2]).decode('latin-1') if p[2] else ''
    print(f'{p[0]}: {name!r} = {val[:40]!r}')
```

Decryption: all param strings are XOR-encrypted with key **113** (0x71). To read names/values: `bytes(b ^ 113 for b in encrypted_bytes).decode('latin-1')`.

Temp var naming conventions (for diagnosing bloat):
- `$$_t1`, `$$_t2` … — condition/arithmetic temporaries (per-line, deduplicated)
- `%_concat1`, `%_temp1` … — concatenation intermediates (per-line, deduplicated)
- `$$1`, `$$2` … — Pascal's equivalent temp names in `.cts.orig` files
- Any `$$__condN` or `$$__mathN` names → old pre-fix naming; indicates stale binary
