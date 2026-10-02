from __future__ import annotations

import atexit
import argparse
import json
import os
import re
import sys
import threading
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from .executor import GAMES_DIR, PlanError, execute_plan, describe_schema
from .planner import local_server, request_plan
from .paths import resolve_list_dir, resolve_llama_server, resolve_model, resolve_program_dir


SERVER_INFO = {"name": "twxdb-assistant", "version": "1.2.0"}
OUTPUT_DIRECTIVE = re.compile(
    r"(?:[,;.]?\s+(?:and\s+)?)?"
    r"(?:(?:save|write|export|store|put)(?:\s+the)?(?:\s+(?:output|results?|data|list))?"
    r"|output(?:\s+the)?(?:\s+(?:results?|data|list))?)\s*"
    r"(?:to|as|in)\s+[\"']?([^\"'\s]+)[\"']?\s*[.!]?\s*$",
    re.IGNORECASE,
)


class PlannerBackend:
    """Keep one planner endpoint alive for the lifetime of the MCP server."""

    def __init__(self) -> None:
        self.server_url = os.environ.get("TWXDB_PLANNER_URL", "").strip()
        self.server_model = os.environ.get("TWXDB_PLANNER_MODEL", "").strip() or None
        self.model = resolve_model()
        self._local_context: Any = None
        self._endpoint: str | None = None
        self._lock = threading.Lock()

    def _get_endpoint(self) -> str:
        if self.server_url:
            endpoint = self.server_url.rstrip("/")
            if not endpoint.endswith("/v1/chat/completions"):
                endpoint += "/v1/chat/completions"
            return endpoint
        if self._endpoint is None:
            with self._lock:
                if self._endpoint is None:
                    if not self.model.is_file():
                        raise PlanError(f"Planner model not found: {self.model}")
                    self._local_context = local_server(self.model, resolve_llama_server())
                    self._endpoint = self._local_context.__enter__()
        return self._endpoint

    def plan(self, game: str, question: str) -> dict[str, Any]:
        return request_plan(
            self._get_endpoint(),
            game,
            question,
            model_name=self.server_model,
        )

    def close(self) -> None:
        with self._lock:
            if self._local_context is not None:
                self._local_context.__exit__(None, None, None)
                self._local_context = None
                self._endpoint = None


PLANNER = PlannerBackend()
atexit.register(PLANNER.close)


TOOLS = [
    {
        "name":"describe_twxdb_schema",
        "description":"Describe all queryable fields and value types of the current XDB entities. Read-only. Use this once when field names are unknown; never guess columns. Numeric -1 and null can mean unobserved values.",
        "annotations":{"readOnlyHint":True,"idempotentHint":True},
        "inputSchema":{"type":"object","properties":{"game":{"type":"string"},"entity":{"type":"string"}},"required":["game"],"additionalProperties":False}
    },
    {
        "name":"query_twxdb_records",
        "description":"Read any XDB entity using exact documented fields. Omit select for all values, including nested records. Planets are keyed by id; equipment is equ. Ports use amount.equ. Returns count/total_count/has_more/next_offset. Answer directly when the required data is returned. Report unknown or errors without retrying paraphrases.",
        "annotations":{"readOnlyHint":True,"idempotentHint":True},
        "inputSchema":{"type":"object","properties":{
            "game":{"type":"string"},"entity":{"type":"string","enum":["header","sectors","planets","ports","fighters","mines","ships","traders","users","players","vars","deadends"]},
            "select":{"type":"array","items":{"type":"string"}},"where":{"type":"array","items":{"type":"object","properties":{"field":{"type":"string"},"op":{"type":"string","enum":["=","!=","<","<=",">",">=","contains","in","truthy","falsy"]},"value":{}},"required":["field"],"additionalProperties":False}},
            "sort":{"type":"array","items":{}},"limit":{"type":"integer","minimum":1,"maximum":5000},"offset":{"type":"integer","minimum":0},"distinct":{"type":"boolean"},"aggregate":{"type":"string","enum":["rows","count","sum","group_count"]},"aggregate_field":{"type":"string"},"group_by":{"type":"string"}},
            "required":["game","entity"],"additionalProperties":False}
    },
    {
        "name": "query_twxdb",
        "description": (
            "Answer a question from the current TWX30 game database. Use this tool whenever a question "
            "depends on sectors, warps, paths, fighters, planets, ports, mines, ships, traders, users, "
            "deadends, MSLs (major space lanes, sectors.mslsec / MSLSEC), or a sector-list file. Preserve abbreviations; do not invent expansions. Pass the exact game database name and the complete "
            "question. The result includes the validated query plan, answer data, and XDB timestamp. Answer directly from the result. If a field is missing or unavailable, report that; do not repeat paraphrases. Use describe_twxdb_schema and query_twxdb_records for exact field queries."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "game": {
                    "type": "string",
                    "description": "Game/XDB basename, for example microblaster_network_s",
                },
                "question": {
                    "type": "string",
                    "description": (
                        "Complete natural-language database question. It may end with a directive such as "
                        "'save the output to mygrid.list'."
                    ),
                },
                "output_file": {
                    "type": "string",
                    "description": (
                        "Optional output list filename. Relative paths are written under the configured TWX "
                        "program directory; paths outside that directory are rejected."
                    ),
                },
            },
            "required": ["game", "question"],
            "additionalProperties": False,
        },
    },
    {
        "name": "execute_twxdb_plan",
        "description": (
            "Execute an already-generated TWXDB Planner v1 JSON plan against the current XDB. "
            "Use query_twxdb instead when starting from a natural-language question."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "plan": {
                    "type": "object",
                    "description": "Validated-compatible TWXDB Planner v1 query or path plan",
                    "additionalProperties": True,
                }
            },
            "required": ["plan"],
            "additionalProperties": False,
        },
    },
    {
        "name": "list_twx_games",
        "description": "List the currently available TWX30 XDB game names and database timestamps.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
]


# tools/list is the model's menu: ship the entire static field vocabulary at
# connection time. This needs no game read and never includes database values.
from .schema import ROOTS, fields_for
FIELD_CATALOG = "\n".join(entity + ": " + ", ".join(fields_for(entity)) for entity in ROOTS)
SCHEMA_GUIDANCE = (
    "Complete field catalog by entity (dot paths select nested values):\n" + FIELD_CATALOG +
    "\n[] means an array index: use ships.0.owner or warps.0 in a query. "
    "* means a dynamic key: use vars.FIGSEC, sources.NAME, or depth_by_sector.42. "
    "Omit select to return complete nested records. Null and planet quantities -1 mean unobserved, never zero. "
    "users/players are observed ownership/name summaries, not a complete account database. "
    "For actual per-game value types and variable names, use describe_twxdb_schema. "
    "Example: query_twxdb_records(game=GAME, entity=planets, select=[id,sector,equ], "
    "where=[{field:id,op:=,value:22}]). For ports use amount.equ, buy.equ and pct.equ. "
    "Sector planet_count counts planets, not equipment. Default page 100, max 5000; follow next_offset only when needed."
)
for tool in TOOLS:
    if tool["name"] == "query_twxdb_records":
        tool["description"] += "\n" + SCHEMA_GUIDANCE
        properties = tool["inputSchema"]["properties"]
        properties["select"]["description"] = "Exact field paths from the entity catalog. Omit for all fields."
        properties["where"]["description"] = "All conditions must match. Values retain JSON types: numbers, strings, booleans; in expects an array."
        properties["sort"]["items"] = {"type":"object", "properties":{
            "field":{"type":"string"}, "direction":{"type":"string","enum":["asc","desc"]}},
            "required":["field"], "additionalProperties":False}
    elif tool["name"] == "query_twxdb":
        tool["description"] += " Natural-language questions are interpreted by the built-in small language model, then schema/intent validated. Use this when you want language interpretation; query_twxdb_records directly executes structured queries without inference."
    elif tool["name"] == "describe_twxdb_schema":
        tool["inputSchema"]["properties"]["entity"]["enum"] = list(ROOTS)


def _text_result(value: Any, *, is_error: bool = False) -> dict[str, Any]:
    if isinstance(value,dict) and isinstance(value.get('answer'),dict):
        answer=value['answer']
        if answer.get('op')=='unsupported':
            is_error=True;value={'error':answer.get('reason','This question is unsupported; no answer was obtained.')}
        elif isinstance(answer.get('result'),list):
            rows=answer['result'];total=answer.get('total_count',len(rows))
            if len(rows)==1 and len(rows[0])<=8 and all(not isinstance(v,(dict,list)) for v in rows[0].values()):
                labels={'equ':'equipment','fuel':'fuel ore','org':'organics','id':'planet ID' if answer.get('entity')=='planets' else 'id'}
                def display(key,value):
                    if value is None or (answer.get('entity')=='planets' and value==-1):return 'not observed'
                    return f'{value:,}' if isinstance(value,int) and not isinstance(value,bool) else str(value)
                value={**value,'answer_text':'; '.join(labels.get(k,k)+': '+display(k,v) for k,v in rows[0].items())}
            else:value={**value,'answer_text':f"{len(rows)} of {total} matching {answer.get('entity','records')} returned."}
            if answer.get('has_more'):value['answer_text']+=' More records are available at offset '+str(answer['next_offset'])+'.'
    text = json.dumps(value, indent=2, sort_keys=True)
    result: dict[str, Any] = {
        "content": [{"type": "text", "text": text}],
        "isError": is_error,
    }
    if not is_error and isinstance(value, dict):
        result["structuredContent"] = value
    return result


def _list_games() -> dict[str, Any]:
    games = []
    if GAMES_DIR.is_dir():
        for path in sorted(GAMES_DIR.glob("*.xdb"), key=lambda item: item.stem.lower()):
            stat = path.stat()
            games.append({
                "game": path.stem,
                "path": str(path),
                "modified_unix": stat.st_mtime,
            })
    return {
        "program_dir": str(resolve_program_dir()),
        "games_dir": str(GAMES_DIR),
        "count": len(games),
        "games": games,
    }


def _split_output_directive(question: str, explicit: Any) -> tuple[str, str | None]:
    match = OUTPUT_DIRECTIVE.search(question)
    if explicit is not None:
        if not isinstance(explicit, str) or not explicit.strip():
            raise PlanError("output_file must be a non-empty filename")
        stripped = question[:match.start()].rstrip(" ,;.") if match is not None else question
        return stripped, explicit.strip()
    if match is None:
        return question, None
    stripped = question[:match.start()].rstrip(" ,;.")
    if not stripped:
        raise PlanError("The save directive must follow a database question")
    return stripped, match.group(1)


def _output_path(name: str) -> Path:
    root = resolve_list_dir().resolve()
    candidate = Path(name).expanduser()
    if not candidate.is_absolute():
        candidate = root / candidate
    candidate = candidate.resolve()
    if candidate == root or root not in candidate.parents:
        raise PlanError(f"Output files must be under the configured TWX directory: {root}")
    return candidate


def _list_values(answer: dict[str, Any]) -> list[int]:
    if answer.get("op") == "path":
        values = answer.get("route", [])
    else:
        rows = answer.get("result")
        if not isinstance(rows, list):
            raise PlanError("Only row or path results can be saved as a sector list")
        values = []
        for row in rows:
            if isinstance(row, int):
                values.append(row)
                continue
            if not isinstance(row, dict):
                raise PlanError("The query result cannot be represented as a sector list")
            value = next((row.get(field) for field in ("sector", "deepest", "door") if isinstance(row.get(field), int)), None)
            if value is None:
                raise PlanError("The query result does not contain sector numbers")
            values.append(value)
    return list(dict.fromkeys(int(value) for value in values))


def _write_output_list(name: str, answer: dict[str, Any]) -> dict[str, Any]:
    destination = _output_path(name)
    values = _list_values(answer)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp")
    temporary.write_text("".join(f"{value}\n" for value in values), encoding="ascii")
    temporary.replace(destination)
    return {"path": str(destination), "count": len(values), "format": "sector-list"}


def call_tool(name: str, arguments: dict[str, Any] | None) -> dict[str, Any]:
    arguments = arguments or {}
    try:
        if name == "describe_twxdb_schema":return _text_result(describe_schema(arguments.get("game",""),arguments.get("entity")))
        if name == "query_twxdb_records":
            plan={**arguments,"v":1,"op":"query"}
            return _text_result({"plan":plan,"answer":execute_plan(plan)})
        if name == "list_twx_games":
            return _text_result(_list_games())
        if name == "execute_twxdb_plan":
            plan = arguments.get("plan")
            if not isinstance(plan, dict):
                raise PlanError("execute_twxdb_plan requires a plan object")
            return _text_result({"plan": plan, "answer": execute_plan(plan)})
        if name == "query_twxdb":
            game = arguments.get("game")
            question = arguments.get("question")
            if not isinstance(game, str) or not game.strip():
                raise PlanError("query_twxdb requires a game name")
            if not isinstance(question, str) or not question.strip():
                raise PlanError("query_twxdb requires a question")
            planner_question, output_file = _split_output_directive(question.strip(), arguments.get("output_file"))
            plan = PLANNER.plan(game.strip(), planner_question)
            answer = execute_plan(plan, unbounded=output_file is not None)
            value = {"plan": plan, "answer": answer}
            if output_file is not None:
                value["saved_file"] = _write_output_list(output_file, answer)
            return _text_result(value)
        raise PlanError(f"Unknown tool: {name}")
    except (OSError, PlanError, ValueError, EOFError, TypeError, KeyError) as exc:
        error = {"error": str(exc)}
        if hasattr(exc, 'planner_diagnostics'):
            error['planner_diagnostics'] = exc.planner_diagnostics
        return _text_result(error, is_error=True)


def handle_message(message: dict[str, Any]) -> dict[str, Any] | None:
    method = message.get("method")
    request_id = message.get("id")
    if request_id is None:
        return None

    if method == "initialize":
        requested_version = message.get("params", {}).get("protocolVersion", "2025-06-18")
        result = {
            "protocolVersion": requested_version,
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": SERVER_INFO,
        }
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        params = message.get("params", {})
        result = call_tool(str(params.get("name", "")), params.get("arguments"))
    else:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def run_stdio() -> int:
    for raw in sys.stdin:
        try:
            message = json.loads(raw)
            if not isinstance(message, dict):
                raise ValueError("MCP message must be a JSON object")
            response = handle_message(message)
            if response is not None:
                sys.stdout.write(json.dumps(response, separators=(",", ":")) + "\n")
                sys.stdout.flush()
        except Exception as exc:
            print(f"twxdb-assistant MCP error: {exc}", file=sys.stderr, flush=True)
    return 0


class McpHttpHandler(BaseHTTPRequestHandler):
    server_version = "TWXDB-Assistant/1.0"

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json_response(200, {"status": "ok", "server": SERVER_INFO})
            return
        self._json_response(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/mcp":
            self._json_response(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 10 * 1024 * 1024:
                raise ValueError("invalid Content-Length")
            message = json.loads(self.rfile.read(length))
            if not isinstance(message, dict):
                raise ValueError("MCP message must be a JSON object")
            response = handle_message(message)
            if response is None:
                self.send_response(202)
                self.send_header("Content-Length", "0")
                self.end_headers()
            else:
                self._json_response(200, response)
        except (json.JSONDecodeError, ValueError) as exc:
            self._json_response(
                400,
                {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(exc)}},
            )

    def _json_response(self, status: int, value: Any) -> None:
        payload = json.dumps(value, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"twxdb-assistant HTTP: {format % args}", file=sys.stderr, flush=True)


def run_http(host: str, port: int) -> int:
    if host not in {"127.0.0.1", "localhost"}:
        raise PlanError("TWXDB Assistant HTTP transport may only bind to localhost")
    server = ThreadingHTTPServer((host, port), McpHttpHandler)
    print(f"TWXDB Assistant MCP listening on http://{host}:{port}/mcp", file=sys.stderr, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="TWXDB Assistant MCP server")
    parser.add_argument("--http", action="store_true", help="serve MCP over loopback Streamable HTTP")
    parser.add_argument("--host", default=os.environ.get("TWXDB_MCP_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("TWXDB_MCP_PORT", "8765")))
    parser.add_argument("--log-file", default=os.environ.get("TWXDB_MCP_LOG"))
    args = parser.parse_args()
    if args.http:
        log_path = Path(args.log_file).expanduser() if args.log_file else resolve_program_dir() / "logs" / "twxdb-assistant.log"
        try:
            log_path.parent.mkdir(parents=True, exist_ok=True)
            sys.stderr = log_path.open("a", encoding="utf-8", buffering=1)
        except OSError as exc:
            print(f"TWXDB Assistant could not open log {log_path}: {exc}", file=sys.stderr, flush=True)
        return run_http(args.host, args.port)
    return run_stdio()


if __name__ == "__main__":
    raise SystemExit(main())
