# Embedded script windows

`TwxRuntimeContext.ScriptWindowFactory` is an optional, instance-scoped
`IScriptWindowFactory`. `WINDOW` uses this factory when supplied, otherwise it
uses the existing `GlobalModules.ScriptWindowFactory`. Standalone hosts do not
need to change anything. No script command IDs or CTS versions change.

A host should install its factory before starting scripts. Each returned
`IScriptWindow` retains its original owner; do not route subsequent content
updates by whichever tab happens to be selected. `SETWINDOWCONTENTS`,
`KILLWINDOW`, and script disposal use the same window objects as before.
Factory and window methods can be called from script threads; marshal rendering
to the UI without blocking the proxy thread.

MTC installs a separate `DockedScriptWindows` factory for every tab. In Classic
mode the sidebar renders only that factory's current snapshot. New windows become
selected; other windows remain available as collapsed title bars. Closing the
selected window selects a remaining window. Script teardown removes its windows.
Identical window names in different scripts or tabs do not share state.

View > Preferences (also File > Preferences > View) controls placement and layout.
Inside MTC and above notes are the defaults; existing saved choices are retained.
Full-height windows beside notes and the old outside popup behavior are also
available. Changing placement moves existing windows without changing the script
handles or losing their contents. Outside windows retain their requested size
and the existing non-topmost, non-activating behavior.

In Classic mode, inside placement initially reserves a column approximately
one-third of the console width, even with no reports open. Notes use that same
column width. Beside-notes layout reserves a separate report column; above-notes
layout shares the column. Opening, closing, selecting, or updating reports does
not resize Notes or the outer window. Oversized content scrolls horizontally.
The divider to the left of Notes/report columns resizes them independently;
the chosen width is saved in preferences and retained across tab switches and
outer-window resizing. Console width is no longer fed back into Notes width.
The script content frame remains capped to one-third of the rendered console
width, with scrollbars for oversized output. Changing placement can adjust the
reserved space. MTC
grows outward for the reservation where possible; at the display's size limit,
horizontal workspace scrolling preserves console width. Temporary expansion is
not saved as the normal window width.

Command Deck uses an integrated three-column workspace, independent of the
Classic above/beside preference. The left inspector (250 UI-scaled pixels)
follows the input-target game; its Notes editor fills the remaining space below the
scrollable Trader, Ship/cargo, Devices and Online sections. Ship and device counts
use two label/value pairs per row, with Devices expanded by default. Ship/cargo
shows Fighters/Shields, Turns per warp/Holds, Fuel ore/Organics and
Equipment/Colonists; the ship name and free-holds count are omitted. Each left
section can minimize to its title or close; the toolbar's panel menu reopens closed
sections. These states are saved independently of game selection, and closing or
minimizing Notes never deletes its content. Reset layout restores all sections.
Tactical stays in the lower-right corner below reports, including when script
windows are set to open externally. It follows the selected game's database and
current sector, clearing the previous game's map and manual center on selection.
Superseded background snapshots cannot replace the newly selected game's map.
The right column (300
UI-scaled pixels) groups reports from every open game, including off-page games,
in stable game/opening order. Each report and game group can collapse. A jump
button explicitly selects its owning console; selecting/copying report text or
updating a report never redirects input. Both columns have independent saved
widths and do not auto-resize with content. Oversized report text scrolls, and
the report column scrolls when it fills. Both modes use Notes typography.

The center retains the 2x2 terminal layout, with deck pages beyond four games.
Every terminal keeps its own buffer and input handler. Only the active page's
consoles render; all sessions and report sources remain live. The selected
console carries an INPUT marker and the toolbar names the command target.
Each console header identifies its own host:port and Connected/Disconnected state; its
footer shows compact SD/BD/Rylos reminders, bot mode and explored percentage.
Exploration counts run off the UI thread, only for visible consoles, and are
cached by database identity/change stamp with a two-second refresh limit.
Console headers offer expand/restore and the existing confirmed close action.
The classic game-tab strip and main bottom status bar are hidden in Command Deck;
each console retains its own footer. Deck controls and paging live in the top menu
row, with the existing shortcut tools accessible through the More tools button.
Adding a game and switching
back to Classic remain available without changing connection ownership.

See `docs/prototypes/command-deck/index.html` for the approved offline prototype.

Run the isolated desktop and real-VM tests with:

```sh
dotnet run --project Tests/MTC.ScriptWindows.Tests/MTC.ScriptWindows.Tests.csproj -c Release
```

The tests use temporary files and non-persistent preferences; they do not
connect to any game or load the user's sessions.
They also verify that retired terminals are collectable after Classic tab switches
and Command Deck rebuilds. Font-scaling metadata uses weak control keys, and
detached terminals do not resubscribe to live game buffers during rebinding.
These lifetime checks do not introduce forced garbage collection in the client.
