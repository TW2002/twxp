# JSON-RPC Debug Settings

MTC exposes the nine File -> Preferences debug switches over its existing
authenticated HTTP POST and WebSocket JSON-RPC endpoint. `rpc.discover` lists
the methods and accepted setting names.

Read settings and log locations:

```json
{"jsonrpc":"2.0","id":1,"method":"mtc.getDebugSettings"}
```

Enable additional detail:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "mtc.setDebugSettings",
  "params": {
    "settings": {
      "debugLoggingEnabled": true,
      "triggerDebugLogging": true,
      "scriptTraceDebugLogging": true
    }
  }
}
```

Supported boolean keys:

- `debugLoggingEnabled`: master debug log switch.
- `verboseDebugLogging`: verbose runtime messages.
- `scriptTraceDebugLogging`: script execution traces.
- `variablePersistenceDebugLogging`: variable load/save diagnostics.
- `autoRecorderDebugLogging`: autorecorder diagnostics.
- `triggerDebugLogging`: trigger diagnostics.
- `debugDatabaseChanges`: database correction log.
- `debugPortHaggleEnabled`: port haggle log.
- `debugPlanetHaggleEnabled`: planet haggle log.

Changes take effect immediately and are saved in the target game's preferences.
Both methods accept an optional `gameName` in `params` to select an open game tab.
Without it, the current tab is selected when the request is handled. The setter
resolves its target before approval; switching tabs during approval does not
redirect the change to the new tab. Closed or unavailable games return `-32005`.
Omitted settings remain unchanged. Pass `false` to turn a setting off. Invalid
names, non-boolean values, duplicate setting names and empty patches are rejected
with `-32602` before any changes are applied.

Both methods return `gameName`, configured `settings`, `effectiveSettings`,
`logPaths`, and `processWideSettings`. The master switch gates the ordinary debug
categories and database correction log; enable it along with a desired category.
Turning it off preserves the category selections. The two haggle switches are
independent of the master and currently affect the entire MTC process, even though
their saved preferences belong to a game. Other debug switches are runtime/tab
specific. These settings affect local MTC diagnostics, not a remote proxy's logs.

The getter is allowed in read-only mode. The setter follows the existing RPC
approval level: denied in `read-only`, prompts in `approve-actions`, and applies
directly in `full-automation`. Neither method sends game input or restarts scripts.

Verbose and script-trace logging can generate substantial output and include
sensitive script/session data. Read the existing settings before diagnostic work
and restore them afterwards using the setter.

Transport and settings tests:

```sh
dotnet run --project Tests/MTC.Rpc.Tests/MTC.Rpc.Tests.csproj
```
