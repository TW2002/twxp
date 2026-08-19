# TWX30 Path Manifest

This is the current managed path surface for `Core`, `MTC`, and `TWXP`.

## Terms

- `<programdir>`: shared TWX program directory used by both apps.
  - Default on macOS/Linux: `~/twx`
  - Default on Windows: `C:\twxproxy`
- `<scriptsdir>`: shared default scripts directory.
  - Default: `<programdir>/scripts`
  - Can be overridden, but is still shared between MTC and TWXP.
- `<appdatadir>`: bootstrap and legacy-migration root.
  - macOS: `~/Library/twxproxy`
  - Windows: `%LOCALAPPDATA%\twxproxy`
  - Linux: `${XDG_DATA_HOME:-~/.local/share}/twxproxy`

## Shared Runtime Paths

| Path pattern | Read / Write | Purpose | Notes |
| --- | --- | --- | --- |
| `<programdir>/config.twx` | read + write | Unified shared config file | Holds `SharedPaths`, `MtcPrefs`, `TwxpPrefs`, and `TwxpCfg` sections. |
| `<programdir>/games/<game>.json` | read + write | Per-game config/metadata | Shared by both apps. |
| `<programdir>/games/<game>.xdb` | read + write | Per-game database | Shared by both apps. |
| `<programdir>/games/<game>.xdb.tmp` | write | Temporary file used during atomic database saves | Renamed into `.xdb` after save. |
| `<programdir>/logs/YYYY-MM-DD <identity>.log` | write | Text session log | Used by shared logging/capture code. |
| `<programdir>/logs/YYYY-MM-DD <identity>.cap` | write | Binary capture log | Used when binary capture logging is enabled. |
| `<programdir>/logs/mtc_debug.log` | write | MTC debug log before a game is selected | Lives in `logs` now. |
| `<programdir>/logs/<gamename>_debug.log` | write | Active game debug log | Used by MTC and TWXP after a game is known. |
| `<programdir>/logs/mtc_haggle_debug.log` | write | MTC native port haggle debug log | MTC-specific. |
| `<programdir>/logs/mtc_neg_debug.log` | write | MTC planet negotiation debug log | MTC-specific. |
| `<programdir>/modules/*.dll` | read | Expansion modules | Loaders scan the main modules directory. |
| `<programdir>/modules/*/*.dll` | read | Expansion modules in one-level subfolders | Supported by module discovery. |
| `<programdir>/modules/data/<Host>/<Game>/<Module>/...` | read + write | Expansion module state | This is the new module-state root. |
| `<scriptsdir>/**` | read | Scripts, quick-load files, bot script targets | Defaults under `<programdir>/scripts`, but may point elsewhere. |

## Bootstrap And Remaining App-Data Paths

These remain outside `<programdir>` on purpose.

| Path pattern | Read / Write | Purpose | Notes |
| --- | --- | --- | --- |
| Windows registry `HKCU\Software\TWXProxy\TWX30\ProgramDir` | read + write | Windows programdir bootstrap | Falls back to `HKLM` for reads. |
| `<appdatadir>/programdir.txt` | read + write | Non-Windows programdir bootstrap | This stays in app-data because it cannot live under `<programdir>`. |

## Legacy / Migration Paths Still Checked

These are not the new home for runtime data, but the code still looks at them for migration or backward compatibility.

| Path pattern | Read / Write | Purpose | Notes |
| --- | --- | --- | --- |
| `<appdatadir>/games/*` | read | Legacy shared game files | Migrated forward into `<programdir>/games`. |
| `<appdatadir>/modules/*.dll` | read | Legacy shared module drop location | Still scanned as a compatibility fallback. |
| `<appdatadir>/modules/*/*.dll` | read | Legacy shared module subfolders | Compatibility fallback. |
| `<programdir>/twxp.cfg` | read | Legacy TWXP INI config | Imported into `<programdir>/config.twx` under `TwxpCfg` when found. |
| `<appdatadir>/twxp.cfg` | read | Legacy app-data TWXP INI config | Also imported into `config.twx` when found. |
| `<appdatadir>/prefs.xml` | read | Legacy shared MTC prefs file | Read only for migration into `config.twx`. |
| MTC legacy app root `/Library/MTC`, `%LOCALAPPDATA%\MTC`, or XDG `mtc` equivalent | read | Legacy MTC-only database location | Old path: `<legacy-mtc-appdir>/databases/<game>.xdb`. |
| TWXP legacy app root `/Library/Application Support/twxproxy`, MAUI app-data equivalent, `%LOCALAPPDATA%\twxproxy`, or XDG equivalent | read | Legacy TWXP-only config registry location | Old path: `<legacy-twxp-appdir>/gameconfigs.json`. |
| `<appdatadir>/databases/<game>.xdb` | read | Legacy shared database location | Still checked so older databases can move into `<programdir>/games`. |

## User-Selected And Variable File Paths

These are path families the apps can access based on user actions or script commands.

| Path pattern | Read / Write | Purpose | Notes |
| --- | --- | --- | --- |
| Any user-picked `.json`, `.xdb`, `.mtc` file | read | Import/open game configuration or database data | MTC and TWXP can import from arbitrary locations chosen in the UI. |
| Any user-picked `.txt`, `.twx`, `.cap`, `.ts`, `.cts` file | read | Imports, playback, script loading, capture playback | User-selected through dialogs. |
| Any user-picked export destination | write | Bubble exports and other exports | TWXP also offers document-style export destinations outside `<programdir>`. |
| Relative script file paths | read + write | Script command filesystem access | Relative paths resolve against `GlobalModules.ProgramDir`. |
| Absolute script file paths | read + write | Script command filesystem access | Scripts can operate on arbitrary absolute filesystem paths. |
| `<programdir>/data/<name>.xdb` | read + write | Legacy script database commands | `copydatabase` / `createdatabase` still target `ProgramDir/data`. |
| `<programdir>/data/<name>.cfg` | read + write | Legacy bot/script sidecar config | Used by older script/database flows. |
| `<programdir>/data/<name>/...` | read + write | Legacy script data directory | Still used by older script/database features. |
| `globals.json` | read + write | Global variable persistence | Defaults to current working/persistence path unless relocated. |
| `progvars.json` | read + write | Program variable persistence | Defaults to current working/persistence path unless relocated. |
| `<app-base>/credentials.json` | read + write | Credential persistence | Moves if `SetPersistencePath()` is called. |

## Special / Miscellaneous Paths

| Path pattern | Read / Write | Purpose | Notes |
| --- | --- | --- | --- |
| `${TMPDIR}/mtc_dock_icon.png` | write | Temporary macOS dock icon asset | MTC only, macOS only. |
| `/tmp/twxp_debug.log` | write | Core fallback debug log | Used only if app-specific paths are not assigned. |
| `/tmp/twxp_haggle_debug.log` | write | Core fallback haggle debug log | Same fallback behavior. |
| `/tmp/twxp_neg_debug.log` | write | Core fallback planet negotiation debug log | Same fallback behavior. |
| `/tmp/twxproxy_debug.log` | write | Ad-hoc script debug dump path | Used by internal debug code paths. |
| `<programdir>/<database>_Bubbles.txt` | write | Legacy bubble dump output | Produced by `ModBubble.DumpBubbles()`. |

## Current Storage Intent

- Shared runtime state should live under `<programdir>`.
- `programdir.txt` stays in `<appdatadir>` as the non-Windows bootstrap locator.
- Module state now lives under `<programdir>/modules/data`.
- `twxp.cfg` content belongs in `<programdir>/config.twx` under the `TwxpCfg` section.
- App-data is now primarily for bootstrap and one-time migration compatibility, not normal day-to-day storage.
