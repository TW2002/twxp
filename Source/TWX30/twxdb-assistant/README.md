# TWXDB Assistant

TWXDB Assistant is a small, portable language-model experiment for answering
natural-language questions about TWX30 game databases.

The model does **not** memorize changing game state and does not attempt to
decode the binary `.xdb` format. It translates a question into a constrained
JSON query plan. A deterministic executor loads the current `.xdb` through
`Source/Tools/twxdb-query.py`, validates the plan, executes graph/database
operations, and formats the result. This separation keeps quantities,
ownership, routes, and planet locations authoritative while allowing a very
small model to handle the language.

## Model target

- Base: `mlx-community/SmolLM2-135M-Instruct` (Apache-2.0)
- Training: MLX LoRA on Apple Silicon
- Deliverable: fused GGUF plus Q4, Q5, and Q8 quantized GGUFs
- Runtime: any GGUF-capable engine can test the planner; the included CLI can
  combine a llama.cpp-compatible model with the live XDB executor.

## Layout

- `twxdb_assistant/`: validated query-plan executor and CLI
- `scripts/extract_chat_questions.py`: streams this Codex task and extracts
  TradeWars/XDB questions without loading the 1+ GB task log into memory
- `scripts/build_dataset.py`: deterministic supervised examples and held-out
  splits based on real question forms and TWX semantics
- `scripts/evaluate_model.py`: exact semantic-plan evaluation
- `scripts/train.sh`: MLX LoRA training
- `scripts/export.sh`: fuse, export F16 GGUF, and quantize
- `data/`: generated train/valid/test JSONL
- `artifacts/`: adapters, fused model, GGUFs, and evaluation reports

## Query-plan contract

The planner emits one JSON object. The common operation is:

```json
{"v":1,"op":"query","game":"microblaster_network_s","entity":"sectors","where":[{"field":"figsec","op":"truthy"},{"field":"fighter_qty","op":"<","value":1000000},{"field":"mslsec","op":"falsy"}],"neighbor":{"direction":"out","where":[{"field":"figsec","op":"falsy"}],"min":1},"select":["sector","fighter_qty"],"sort":["sector"],"aggregate":"rows"}
```

Supported operations are `query`, `path`, and `unsupported`. `query` supports
sectors, fighters, planets, ports, mines, deadends, ships, traders, users, and
header rows; field filters; directed neighboring-sector predicates; source
list intersection; grouping; counts; projections; sorting; and limits.

## Reproducible workflow

```bash
cd twxdb-assistant
python3 scripts/extract_chat_questions.py
python3 scripts/build_dataset.py
python3 -m unittest discover -s tests -v
scripts/train.sh
scripts/export.sh
python3 scripts/evaluate_model.py --model artifacts/twxdb-assistant-q4_k_m.gguf
```

Ask a live question with the recommended Q4 model:

```bash
python3 -m twxdb_assistant.cli ask \
  --model artifacts/twxdb-assistant-q4_k_m.gguf \
  --game abandoned_stardock_b \
  "give me the deadends in abandoned_b.list in file order with their depth"
```

`--server-url` can target another OpenAI-compatible local inference engine
instead of launching `llama-server`. Use `--server-model` when that endpoint,
including LM Studio, requires a model identifier.

Run a plan directly:

```bash
python3 -m twxdb_assistant.cli execute \
  '{"v":1,"op":"query","game":"abandoned_stardock_b","entity":"deadends","source_list":"abandoned_b.list","list_match":"deepest","select":["deepest","max_depth"],"sort":["list_order"]}'
```

The GGUF itself is a portable planner. Live database access still requires the
deterministic executor (or an equivalent implementation of the documented
plan contract); a generic inference engine cannot read a local XDB merely by
loading model weights.

## MCP server

The bundled stdio MCP server makes the planner and executor available to Song,
LM Studio, and other MCP hosts. It exposes:

- `query_twxdb`: accepts a game name and natural-language question, invokes the
  planner, then executes the validated plan against the current XDB.
- `execute_twxdb_plan`: executes an existing Planner v1 JSON object.
- `list_twx_games`: lists available XDB game names and modification times.

The TWX30 installer payload is self-contained. It includes a private CPython
runtime, a pinned CPU `llama-server`, the Q4 planner, the XDB reader, and the
MCP implementation. Users do not need Python, Homebrew, llama.cpp, or a source
checkout. The default installation is:

```text
<programdir>/tools/twxdb-assistant/
```

The server starts the bundled Q4 planner on first use and keeps it loaded. A
stdio MCP host can launch it directly on macOS or Linux:

```json
{
  "command": "<programdir>/tools/twxdb-assistant/twxdb-mcp",
  "args": []
}
```

On Windows, use the private runtime directly when a host cannot execute `.cmd`
launchers:

```json
{
  "command": "<programdir>\\tools\\twxdb-assistant\\runtime\\python\\python.exe",
  "args": ["<programdir>\\tools\\twxdb-assistant\\app\\twxdb-mcp.py"]
}
```

The persistent, localhost-only Streamable HTTP transport is available at:

```text
http://127.0.0.1:8765/mcp
```

Start it with **Tools > Start TWXDB Assistant MCP Server** in MTC or run
`twxdb-mcp --http`. The macOS and Windows installers also offer **Start TWXDB
Assistant at Login** as an unchecked subfeature. Linux installs a disabled
`twxdb-assistant.service` user unit; set `TWXDB_AUTOSTART=1` while installing,
or enable that unit later, to opt in.

### Writing sector lists

`query_twxdb` accepts an `output_file` argument. It also recognizes an output
directive at the end of a natural-language question, including:

- `save the output to mygrid.list`
- `write the data to mygrid.list`
- `output to mygrid.list`
- `export the results as mygrid.list`

Relative output names are written under the configured TWX program directory,
one sector per line. The result reports the absolute saved path and row count.
Paths outside the TWX directory are rejected.

### Path discovery

No installed path is compiled into the assistant. It resolves `<programdir>`
in this order:

1. `TWX30_PROGRAMDIR` or `TWX_PROGRAM_DIR`.
2. The TWX30 Windows registry entry, or the macOS/Linux `programdir.txt`
   locator used by `SharedPaths`.
3. Its installed location when it is under
   `<programdir>/tools/twxdb-assistant`.
4. The platform's normal TWX30 default program directory.

If `<programdir>/config.twx` contains
`SharedPaths/ProgramDirectory`, that configured path is authoritative. XDBs
are read from `<programdir>/games`, and relative source/output lists use
`<programdir>`. Environment overrides remain available for advanced setups:

Optional environment variables:

- `TWX30_PROGRAMDIR`: override the configured TWX program directory.
- `TWX_GAMES_DIR`: override the XDB directory.
- `TWX_LIST_DIR`: override the source/output list directory.
- `TWXDB_MODEL`: alternate local GGUF path.
- `TWXDB_LLAMA_SERVER`: alternate `llama-server` executable.
- `TWXDB_PLANNER_URL`: OpenAI-compatible server base URL or chat-completions
  endpoint, such as `http://localhost:1234` for LM Studio.
- `TWXDB_PLANNER_MODEL`: model identifier to send to the configured endpoint.
- `TWXDB_MCP_PORT`: alternate loopback HTTP port; default `8765`.

For Song, add either the stdio command or HTTP endpoint in **Configuration >
MCP Servers**, enable auto-connect, and test the connection. The tools then
appear to any Song model with tool use enabled. The MCP protocol is host-neutral.

## Building installer payloads

Build one relocatable payload before building its platform installer:

```bash
python3 twxdb-assistant/scripts/build_portable.py --rid osx-arm64
```

Supported RIDs are `osx-arm64`, `osx-x64`, `linux-x64`, `win-x64`, and
`win-arm64`. Output goes to `bin/<rid>/twxdb-assistant`. The builder downloads
only pinned Python and llama.cpp release archives, verifies their SHA-256
digests, verifies the model checksum, and emits a complete `manifest.json`.
Set `TWXDB_MODEL_SOURCE` or pass `--model` in release automation when the Q4
artifact is stored outside `twxdb-assistant/artifacts`.

`Source/build-sourceforge-bundles.sh` builds this payload automatically for
each requested RID. The Windows MSI builder does the same before staging WiX.

## Reliable field queries (1.2)

The MCP server exposes `describe_twxdb_schema` and `query_twxdb_records` alongside
`query_twxdb` and `execute_twxdb_plan`. Every queryable value is available through
the record API; omitting `select` returns all fields, including nested objects,
arrays and sector variables. Schema discovery returns field names/types for all
12 entities, including empty record sets. The complete static field catalog is
also embedded in `tools/list`, so Song receives it immediately on connection,
without reading a database or invoking the planner. Dynamic variable keys and
per-game observed types remain available through `describe_twxdb_schema`.
Use numeric array indexes such as
`ships.0.owner`; arbitrary sector variables use `vars.NAME`.

Planet equipment is `equ`; port equipment is `amount.equ`, and the port buy/sell
flag and percentage are `buy.equ` / `pct.equ`. These are distinct from a sector's
`planet_count`. Every natural-language `query_twxdb` call invokes the small planner
model once. Recognized planet IDs, resource thresholds, greatest/least values,
complete record lookups and explicit field queries supply a schema-validated
interpretation to the model. If the small model changes those exact constraints,
the validated interpretation is retained and `_planner.correction` explains why.
Unrecognized questions use the model plan with validation and can be unsupported; there is no claim that arbitrary natural language
is guaranteed to translate. Unknown columns are errors, never successful empty
results. The returned query plan makes field selection inspectable.

For example, `query_twxdb` with `What is the equipment count for planet #22?`
selects `id`, `sector`, and `equ` for planet ID 22. The response includes a compact
`answer_text` alongside the data. `query_twxdb_records` can express every field
filter/projection using the discovered schema, without a language model.

Rows are paginated: default 100, maximum 5,000; follow `next_offset` while
`has_more` is true. `total_count` is the complete matching count. Count/sum operate
on all matched rows, regardless of page size. Sums of unobserved planet quantities
exclude the unknown sentinel and report `unknown_count` and `complete=false`.
An unknown value is not zero. Saved sector-list exports use the full result.
`users` and `players` are derived observations of names/ownership, not an account
or player-statistics table; facts absent from the XDB remain unavailable.

The reader is checked against independent .NET BinaryWriter fixtures for versions
10–19, including Unicode header characters, all serialized record fields,
32-bit warps, construction status, and colonists. Truncated/invalid data produces
an error rather than silently dropping the planet table. Mines expose `figtype`.

Run the exhaustive field projection audit with:

```sh
TWX30_PROGRAMDIR=/path/to/twx PYTHONPATH=. python3 scripts/audit_query_coverage.py GAME --output audit.json
python3 -m unittest discover -s tests -v
python3 scripts/verify_packaged_mcp.py /path/to/twxdb-mcp --game GAME --output mcp-check.json
```

Audit reports contain counts/schema names, not record values or header credentials.
The packaged MCP check includes the requested planet-22 equipment result.
