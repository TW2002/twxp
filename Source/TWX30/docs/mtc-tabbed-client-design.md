# MTC Tabbed Client Design

## Goal

MTC should support multiple live game instances in one window through document-style tabs. Each tab must behave like a separate MTC process: independent terminal buffer, parser state, database handle, embedded proxy, script interpreter, mombot runtime, module host, log targets, recorder state, child windows, and timers.

## UI Pattern

The tab strip should be the highest application-level row, above the current menu bar and below the native window title bar. This follows the browser/document pattern users already understand while keeping MTC's existing menu model intact.

Reference patterns:

- Apple tab views present one selected pane from a small set of mutually exclusive panes.
- GNOME tabs use `Ctrl+T` for new tab, `Ctrl+W` for close tab, and keyboard shortcuts for tab switching.
- Fluent tab lists work best for closely related content-heavy areas and small-to-moderate tab counts.
- Browser-style tab bars commonly place a close affordance on each tab and a new-tab button after the last tab.

MTC-specific tab behavior:

- Active tab is visually connected to the menu/content below it.
- Inactive tabs show game name and compact connection state.
- Each tab has an `X` close button on the right side of the tab.
- A `+` button after the last tab opens a new game tab.
- `File -> New Tab` mirrors the `+` button.
- `File -> Close Tab` closes the active tab.
- `Cmd/Ctrl+T`, `Cmd/Ctrl+W`, `Ctrl+Tab`, and `Ctrl+Shift+Tab` should be supported where the platform allows them.
- Closing the last tab should either open a blank tab or close the window after confirmation if the session is active.

## Why This Needs Runtime Work First

The current MTC window is a single-session object. `MainWindow` directly owns the active `GameState`, `TerminalBuffer`, `AnsiParser`, `TelnetClient`, `GameInstance`, `ModDatabase`, module host, file lock, mombot service, timers, notes panel, terminal recorder, feature windows, and menu items.

Core also still has process-wide active state:

- `GlobalModules.TWXServer`
- `GlobalModules.TWXInterpreter`
- `GlobalModules.TWXDatabase`
- `GlobalModules.GlobalAutoRecorder`
- `ScriptRef` active database
- `ScriptRef` active game instance
- `ScriptRef` active interpreter
- `ScriptRef` current line and current ANSI line
- `ScriptRef` current game variables

A cosmetic tab strip on top of this would corrupt sessions because whichever tab last touched these globals would become the active runtime for all scripts and parser callbacks. The first implementation milestone is therefore a per-session runtime context.

## Target Architecture

### Shell Window

`MainWindow` becomes the application shell:

- Owns the tab collection and active tab id.
- Owns only app-level UI such as the top tab strip, native menu integration, and global preferences.
- Delegates menu commands to the active `MtcGameSessionHost`.
- Rebuilds menu enabled state when the active tab changes.
- Does not directly own game state, terminal state, database handles, or proxy runtime.

### Game Session Host

Each `MtcGameSessionHost` owns one live game runtime:

- `GameState`
- `TerminalBuffer`
- `AnsiParser`
- `TelnetClient`
- `GameInstance`
- `ModInterpreter`
- `ModDatabase`
- `GameFileLock`
- `ExpansionModuleHost`
- `NativeHaggleEngine`
- `GameAgentRuntime`
- `ModLog`
- Session timers
- Session child windows
- Session notes and recorder state
- A `TwxRuntimeContext`

Child and tool windows are session-owned, not shell-owned:

- Game Info, Play Macro, Quick Macro, Map, Find, History, Route, Bubbles, Script Debugger, Comm, and similar windows belong to the tab that opened them.
- Switching tabs does not move, reuse, or retarget another tab's child windows.
- If the same tool is opened from another tab, MTC creates or activates that tab's own instance.
- Closing a tab closes only that tab's child windows and associated child processes.
- Window titles should include the game/tab name when there is any chance of ambiguity.
- Modal workflows should be modal only to the owning tab/session where Avalonia permits it; they must not block input to unrelated tabs.

The host exposes:

- `Control View`
- `string DisplayName`
- `bool IsDirty`
- `bool IsConnected`
- `Activate()`
- `Deactivate()`
- `FocusTerminal()`
- `Task CloseAsync()`
- Command methods currently implemented across `MainWindow` partials.

### Runtime Context

`TwxRuntimeContext` stores the Core state that used to be singletons. Every `GameInstance`, script execution path, AutoRecorder callback, and MTC session callback must execute with the correct context bound.

The initial scaffold exists in `Source/Core/Global.cs`. The next runtime step is to pass an explicit context into `GameInstance`, `ModInterpreter`, and script execution, then wrap all async/task/thread entry points with `GlobalModules.UseRuntimeContext(context)`.

### Threading Model

- Avalonia controls stay on the UI thread.
- Each game session has independent network receive/write queues.
- Each embedded proxy has its own script interpreter and cancellation source.
- UI updates are marshaled per session to the UI thread.
- Inactive tabs continue processing network/script/database events but do not repaint visible controls except for small tab status indicators.
- Closing a tab cancels and disposes only that session.

## Implementation Phases

### Phase 1: Runtime Isolation

- Finish `TwxRuntimeContext` wiring.
- Move `ScriptRef` active database, active interpreter, active game instance, current sector, current line, current ANSI line, raw packet, and current game variables into the runtime context.
- Ensure `GameInstance` owns and binds a context.
- Ensure AutoRecorder is per context.
- Add debug assertions/logs when a script command runs without a session context.
- Verify two `GameInstance` objects can run in a test without clobbering active database, current ANSI line, or server send target.

### Phase 2: Session Extraction

- Extract session-owned fields from `MainWindow` into `MtcGameSessionHost`.
- Move connection lifecycle, game persistence, status-panel state, terminal recording, notes, game agent, mombot integration, and feature-window ownership behind the host.
- Keep `MainWindow` as the shell and active-session command router.
- Add tests or smoke harnesses for creating, switching, and closing hosts.

### Phase 3: Tab Shell UI

- Add the tab strip above the menu bar.
- Add `File -> New Tab`, `File -> Close Tab`, and `+` tab button.
- Route all menu actions to the active host.
- Rebind status bar, sidebar, notes panel, terminal, feature windows, and title when switching tabs.
- Persist open tabs only if explicitly wanted later; do not auto-reopen external windows.

## Acceptance Criteria

- Two tabs can connect to two different games with embedded proxy enabled.
- Running scripts in one tab never changes `CURRENTANSILINE`, current sector, active database, or send target in another tab.
- Debug logs, game logs, ANSI logs, recorder files, and notes are per game.
- Closing one tab stops its embedded proxy, scripts, child windows, and timers without affecting the other tabs.
- Switching tabs is immediate and shows the exact current terminal/status/map/sidebar state for that tab.
- The `+` tab button and `File -> New Tab` open equivalent blank game tabs.
- The tab `X` and `File -> Close Tab` close equivalent active tabs.
- Inactive tabs keep receiving game data and remain current when selected.
