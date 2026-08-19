# Core TWX Proxy Changes from TWX27 to 3.0 beta1

This document summarizes the major Core TWX Proxy changes between the TWX27 Pascal codebase and the current 3.0 beta1 Core. It is intentionally limited to Core functionality: the proxy runtime, script compiler/decompiler/runtime, database, auto-recorder, networking, command processing, logging, and optional Core extension points.

It does not cover app-specific behavior, native client windows, MTC UI features, TWXP UI features, or other application-layer changes except where an app relies on a shared Core capability.

## Compatibility Goal

The primary design goal for 3.0 beta1 is TWX27 compatibility. Existing `.ts` and `.cts` scripts should continue to compile, load, decompile, and run without requiring script-visible behavior changes. Where Core functionality was extended, the intent was to add capability without changing the meaning of older commands.

The practical compatibility rules are:

- Existing script commands, command parity, compiled command IDs, and system constant ordering are treated as compatibility-sensitive.
- Existing `.cts` files remain loadable, including older Pascal-era compiled script formats.
- Existing script-visible parsing behavior, trigger behavior, ANSI handling, and database state are preserved or corrected toward TWX27 behavior.
- New features are additive whenever possible.
- Known behavioral differences are tracked as compatibility notes rather than treated as intentional replacements for TWX27 behavior.

## High-Level Summary

TWX30 Core is a C#/.NET rewrite of the classic TWX Proxy Core. Most of the visible capability is deliberately the same as TWX27: scripts run, triggers fire, game data is recorded, proxy/client modes exist, and databases persist game state. The major changes are mostly internal modernization, stronger compatibility handling, better diagnostics, faster runtime paths, richer database recording, and optional extensions that do not replace legacy script behavior.

## Shared C# Core Runtime

TWX27 split much of its behavior across the Pascal application and script runtime. TWX30 moves the shared behavior into a reusable Core library.

What changed:

- The proxy engine, script system, database, auto-recorder, ANSI handling, pathing, and shared configuration now live in a common Core.
- Multiple hosts can use the same Core behavior instead of re-implementing proxy logic.
- Core services expose events for server data, local/client data, connection state, client type changes, ship status updates, and diagnostics.

Why:

- A shared Core makes compatibility fixes apply everywhere.
- It reduces drift between different clients or launch modes.
- It makes the codebase easier to test, reason about, and extend without changing script semantics.

Compatibility impact:

- This is intended to be invisible to scripts. The same script commands and runtime behaviors are preserved where possible.

## Script Compiler, Decompiler, and Runtime

The script toolchain was rebuilt around compatibility with TWX27 compiled scripts while adding safer diagnostics and faster execution paths.

What changed:

- `.ts` source scripts and `.cts` compiled scripts remain supported.
- Older Pascal compiled script headers and legacy script encryption are supported.
- The compiler preserves the legacy command table contract so existing `.cts` command IDs are not shifted.
- Include handling, source loading, and compiled output handling were rebuilt for the C# runtime.
- A prepared execution path and script caching were added so scripts can run faster without changing bytecode semantics.
- The raw interpreter path remains the behavior reference for compatibility.

Why:

- Many live scripts are old `.cts` files or depend on Pascal-era behavior.
- Keeping compiled compatibility avoids forcing users to rebuild or edit old scripts.
- Prepared execution and caching improve performance while keeping the classic bytecode behavior as the compatibility oracle.

Compatibility impact:

- Existing scripts should continue to run.
- Runtime optimization is intended to be internal only, not a script-visible behavior change.

## Script Command Compatibility and Additive Commands

The TWX30 Core command table keeps the TWX27 command surface intact and adds a small number of commands at the end of the table rather than changing existing command IDs.

Additive commands in beta1 include:

- `AUTOHAGGLE`: toggles the native haggle engine from scripts.
- `DIAGLOG`: writes script diagnostics directly to the debug log.
- `DIAGMODE`: toggles broader diagnostic mode.
- `GETCOURSES`: returns all shortest directed courses between two sectors without changing the older `GETCOURSE` API.
- `NATIVEBOT`: provides a Core script hook for starting, stopping, or rebooting a registered native bot integration.
- `QUIKSTATS`: sends `/` and waits for ship status parsing to refresh script-visible status values.
- `WAITON`: provides a wait helper routed through the same runtime behavior as `WAITFOR`; the compiler also supports it as a macro-style trigger/pause shorthand.

Why:

- These commands support newer workflows, diagnostics, native haggle, and route analysis without redefining older commands.
- `GETCOURSES` exists specifically so richer route behavior can be added without overloading or changing the meaning of `GETCOURSE`.
- `QUIKSTATS` gives scripts a consistent way to refresh current ship status without hand-rolling the same wait logic.

Compatibility impact:

- Existing command behavior is intended to remain unchanged.
- New commands are opt-in.

## Numeric and Expression Handling

TWX30 keeps legacy expression behavior but fixes an important source compatibility issue around signed numeric literals.

What changed:

- Signed numeric literals such as `-60` are accepted in places where scripts naturally use negative values.
- Legacy subtraction forms such as `(0 - 60)`, `($i -1)`, and `$i -1` continue to work.

Why:

- Old Pascal syntax often used `(0 - n)` because bare negative literals were limited or unreliable.
- Newer scripts naturally use negative values for things like MCIC thresholds.
- Supporting both forms improves script readability without breaking old source.

Compatibility impact:

- This is an extension, not a removal of old behavior.

## Trigger, Input, and ANSI Handling

TWX scripts are highly sensitive to exactly what the proxy exposes through `CURRENTLINE`, `CURRENTANSILINE`, text triggers, line triggers, and inbound processing. TWX30 hardened this area to better match TWX27 behavior.

What changed:

- ANSI stripping is stateful across packet boundaries.
- Script-visible ANSI lines preserve the bytes scripts need for `CURRENTANSILINE` checks.
- ANSI removal now handles more CSI escape sequences than simple color resets.
- Terminal text normalization handles backspaces and destructive edits while preserving ANSI where scripts need it.
- Inbound processing paths were adjusted to preserve old script expectations such as `PROCESSIN 1 <text>` and valid server/proxy lines that older scripts consume.

Why:

- Many old scripts identify aliens, prompts, game state, or display transitions by exact line text or ANSI coloring.
- Packet boundaries can split ANSI sequences; if stripping is not stateful, garbage leaks into `CURRENTLINE` or valid ANSI disappears from `CURRENTANSILINE`.
- Better parity here prevents false triggers, missed triggers, and script-visible corruption.

Compatibility impact:

- These changes are compatibility fixes, not intended behavior changes.

## Networking and Proxy Engine

The Core proxy engine was modernized while preserving the classic client/server model and client types.

What changed:

- The server connection is asynchronous and event-driven.
- Outbound sends to the game server are queued and serialized to preserve command order.
- Local/client output is deferred around server-data dispatch so script output and prompt/menu output do not corrupt game data handling.
- Telnet negotiation is handled in Core.
- Client types such as standard, deaf, mute, rejected, and stream are preserved.
- Auto-reconnect and stale connection watchdog behavior exist in Core.

Why:

- The proxy needs to handle live server traffic, scripts, local commands, reconnects, and multiple client modes without blocking.
- Queued sends and deferred output reduce race conditions and packet interleaving bugs.
- Keeping client types in Core preserves the classic TWX model while allowing different hosts to share it.

Compatibility impact:

- Scripts should see the same server data ordering and client-mode behavior they expect from TWX27.
- The implementation is different, but the visible contract is intended to remain the same.

## Database and Auto-Recorder

The Core database and auto-recorder were expanded and made more robust while keeping the classic TWX sector database model.

What changed:

- The database now stores richer sector state, including ports, mines, fighters, ships, traders, planets, density, anomalies, beacons, constellations, and warp relationships.
- Planet records are keyed by registry ID and can track their last observed sector.
- Trader records preserve the display heading so alien race headings such as `Ferrengi:` or `SubterFu:` are not collapsed into generic trader data.
- Inbound warp data and path graph caches are maintained for faster route and backdoor queries.
- The auto-recorder parses sector scans, holo scans, CIM data, fig scans, port reports, planet information, and related game displays.
- Database load/save behavior includes locking and auto-save handling.
- Older TWX database formats are still read where supported.

Why:

- Scripts rely heavily on database state being accurate and current.
- Planet movement, alien displays, upgraded ports, fig ownership, and inbound route selection need more accurate state than a simple sector snapshot.
- Caches improve performance for scripts that repeatedly query routes or sector relationships.

Compatibility impact:

- Existing database-oriented script commands should still expose the expected values.
- Added internal fields improve recording and query quality without requiring old scripts to know about them.

## Pathing and Course Queries

Pathing remains based on the directed TradeWars warp graph, with additional support for richer route analysis.

What changed:

- Core pathing supports directed shortest-path searches, Pascal-style breadth-first behavior where needed, inbound warp queries, backdoor queries, and all-shortest-course queries.
- `GETCOURSES` was added for scripts that need all shortest valid routes.
- `GETCOURSE` retains the older scalar/array command contract.

Why:

- Modern scripts often need more than one valid shortest route.
- Inbound route and backdoor calculations are expensive without cached graph support.
- Adding `GETCOURSES` avoids changing the older `GETCOURSE` interface.

Compatibility impact:

- Valid directed courses remain the goal.
- Exact equal-length route tie choice is one of the areas tracked for TWX27 parity because optimized pathing can choose a different valid shortest route than Pascal breadth-first ordering.

## Logging, Diagnostics, and Script-Scoped Log Control

TWX30 adds more diagnostic controls while avoiding global preference changes from scripts.

What changed:

- `DIAGLOG` and `DIAGMODE` provide explicit diagnostic tools.
- Script `LOGGING` behavior is script-scoped rather than acting as a global logging preference toggle.
- Debug logging is available for parser, runtime, connection, and script issues.

Why:

- Beta compatibility work requires precise logging around triggers, ANSI, packet boundaries, parser state, and script runtime decisions.
- Script-scoped log suppression lets noisy scripts quiet their own output without unexpectedly changing the user's global logging state.

Compatibility impact:

- `LOGGING` is a known behavior difference from TWX27 and is documented as such.
- Diagnostic additions are opt-in.

## Native Haggle Engine

TWX30 Core includes optional native haggle support.

What changed:

- Core can run built-in haggle strategies such as EP/clamp-style haggling, enhanced server-derived haggling, blend heuristic haggling, baseline haggling, and Cherokee-style planet haggling.
- Scripts can toggle native haggle with `AUTOHAGGLE`.

Why:

- Native haggle can reduce repeated script-side negotiation logic.
- It provides a central place for improved haggling behavior while still allowing classic script haggles to run when native haggle is off.

Compatibility impact:

- Native haggle is optional.
- It should not replace script haggle behavior unless explicitly enabled.

## Optional Core Extension Points

TWX30 Core includes an optional module framework.

What changed:

- Modules can observe game events, inspect database state, send commands, and provide optional behavior through shared Core interfaces.

Why:

- Extensions can be added without hard-coding them into the proxy runtime.
- Core stays reusable while optional behavior remains isolated.

Compatibility impact:

- Modules are additive and should not alter classic script behavior unless intentionally enabled.

## Shared Paths and Persistence

TWX30 Core centralizes file and path handling.

What changed:

- Shared paths exist for program files, game databases, logs, configuration, modules, and generated files.
- Paths are platform-aware for macOS, Windows, and Linux-style environments.

Why:

- The same Core can run under different hosts and operating systems.
- Centralizing paths reduces accidental divergence in database, log, script, and module locations.

Compatibility impact:

- Script-visible behavior should not depend on app-specific path decisions.
- Core path handling mainly affects where shared runtime artifacts live.

## Known Compatibility Notes in beta1

These are the main known or accepted Core compatibility notes in the current beta line:

- `LOGGING` is script-scoped rather than a global preference toggle.
- `REQRECORDING` is currently stubbed.
- `SOUND` is currently stubbed.
- `DISCONNECT` only disables reconnect when the optional parameter is explicitly `1`.
- Signed negative literals are accepted as an extension.
- Empty-string numeric comparison behavior is tracked as a known difference in some greater/less comparisons.
- Equal-length `GETCOURSE` route tie choices remain an area to watch for TWX27 parity.

## What Should Not Have Changed

The following are intended to remain compatible with TWX27:

- Loading and running `.ts` and `.cts` scripts.
- Decompiling compiled scripts for editing.
- Existing script command names and old command IDs.
- Existing trigger families and pause/wait behavior.
- Existing variable, array, label, and include semantics.
- Existing database-oriented script commands and sector constants.
- Existing client type concepts such as deaf, mute, and stream clients.
- Existing script-driven game interaction patterns.

In short, TWX30 Core is intended to be a compatibility-preserving modernization. The visible changes should mostly be additive tools, safer diagnostics, faster internals, richer recording, and fixes that move behavior closer to TWX27 where the C# runtime initially drifted.

## Related Documents

- `README.md`
- `Source/README.md`
- `Source/SCRIPT_COMMAND_COMPAT_NOTES.md`
- `docs/haggle-modes.md`
- `docs/expansion-modules.md`
- `docs/vm-optimization-design.md`
