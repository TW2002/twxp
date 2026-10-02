# Event-driven model integration

`mtc.subscribe` streams `mtc.event` notifications over authenticated WebSocket.
Each subscription client now receives a monotonically increasing `sequence`
field on notifications, starting at 1. A missing number indicates dropped
events and clients should stop acting and re-observe. `rpc.discover` advertises
`eventSequence: true`. Do not infer prompt completeness from event kind alone;
`ServerPrompt` may describe a partial line or echoed input.

The experimental player is in `tradewars-player/`. Keep the MTC Game Agent window
open and recording; current event recording is gated by its active state.
New non-redacted `ClientInput` events include `metadata.inputHex`, preserving
bytes that normalized `plainText` cannot represent faithfully.

The server-observation duplicate filter resets when client input is observed.
An identical prompt arriving less than one second after a response is a new
response opportunity, rather than a duplicate render of the previous prompt.

Standalone Telnet observations recognize complete scan choices, port choices,
commodity quantities, price offers and navigation confirmations as prompts.
The player still validates full grammar; the observation label itself does
not authorize an action. Partial scan text is not classified as a full choice.

`mtc.getContext` also includes `turns`, `fuelOre`, `organics`, `equipment`,
and `colonists`, alongside credits and holds. These are the current client
GameState values, not a fresh server query. A resource-sensitive controller
must request and observe ship status before relying on them. The experimental
`models/trader-v1` policy requests quickstats before Command-level economic
decisions and rejects older RPC snapshots missing its required cargo fields.

## Guarded response

`mtc.sendPromptCommand` checks the game and exact latest prompt after approval,
in the UI dispatch that sends the response:

```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "mtc.sendPromptCommand",
  "params": {
    "gameName": "the-game-name",
    "prompt": "Command [TL=00:00:00]:[123] (?=Help)? :",
    "promptTimestamp": "2026-09-07T23:00:00.0000000+00:00",
    "command": "s",
    "appendEnter": false
  }
}
```

Take `prompt` and `promptTimestamp` verbatim from the event. Changes to the game,
observer, connection, latest server output or intervening client input reject
the action with `-32007`. Already-consumed prompt timestamps are rejected as
well, even if an earlier command's outcome is uncertain. This is not a general
transaction across the remote server; it guards local prompt dispatch.

Single-character menu commands generally use `appendEnter: false`. A numeric
destination uses `appendEnter: true`. A literal CR (`"command": "\r"`) is
accepted for Enter. Existing `mtc.sendCommand` behavior is unchanged.

The existing permission levels still apply: read-only denies, approve-actions
asks, full-automation sends directly. A client should not retry a timed-out
game command; observe new state instead.

Validation:

```sh
dotnet run --project Tests/MTC.Rpc.Tests/MTC.Rpc.Tests.csproj -c Release
```

With the player's local Python environment installed, exercise the actual
trained model through MTC's TelnetClient, prompt classifier, JSON-RPC server
and guarded command handler against an isolated loopback peer:

```sh
dotnet run --project Tests/MTC.Rpc.Tests/MTC.Rpc.Tests.csproj -c Release -- --player-transport
```

This runs ten scan-prompt round trips and writes measurements to
`tradewars-player/outputs/mtc-component-transport.json`. It does not launch a
desktop window or use the user's active connection. The bridge supplies a
fixture context, so the result excludes MainWindow dispatch, ship-state
parsing and remote game latency. It is a component test, not live-game proof.

The same option also runs an actual-engine ship-state test. Build
`tradewars-player/lab/OpenTwEnvironment.csproj` first. The test buys cargo in
the disposable engine, requests quickstats, encodes the response as CP437,
and sends it through MTC's TelnetClient and ShipInfoParser. It checks the
GameAgent context's sector, credits, turns, holds and commodity fields against
engine truth. `tradewars-player/outputs/mtc-ship-transport.json` records the
result. This verifies state parsing separately from the scan-response test;
neither test exercises MainWindow dispatch.

A continuous game test joins those components around the actual OpenTW engine:

```sh
dotnet run --project Tests/MTC.Rpc.Tests/MTC.Rpc.Tests.csproj -c Release -- --player-game
```

It uses a temporary XDB and observer log directory, actual AutoRecorder and
ShipInfoParser updates, GameAgentRuntime snapshots, and a trained policy over
guarded RPC. Engine internals supply evaluation outcomes only; model context
comes from parsed Telnet output. The loop checks 100 actions, movement and cash
profit. Results are in `tradewars-player/outputs/mtc-continuous-game.json`.
The test bridge replaces MainWindow dispatch, so this is stronger component
integration evidence without claiming a desktop live-game run.

The player preserves the scan origin while TWX CURRENTSECTOR visits holo
preview sectors. It also discards queued prompt observations superseded by the
latest RPC snapshot before inference. The guarded send still performs its
final timestamp check, and uncertain sends are not retried.
