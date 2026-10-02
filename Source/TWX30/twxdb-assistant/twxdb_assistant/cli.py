from __future__ import annotations

import argparse
import json
from pathlib import Path

from .executor import PlanError, execute_plan
from .planner import plan_question


def main() -> int:
    parser = argparse.ArgumentParser(description="Execute validated TWXDB query plans")
    subparsers = parser.add_subparsers(dest="command", required=True)
    execute = subparsers.add_parser("execute", help="Execute a JSON plan")
    execute.add_argument("plan", help="JSON text or @path/to/plan.json")
    ask = subparsers.add_parser("ask", help="Plan and execute a natural-language XDB question")
    ask.add_argument("question")
    ask.add_argument("--game", required=True)
    ask.add_argument("--model", type=Path)
    ask.add_argument("--server-url", help="OpenAI-compatible server base URL or chat-completions endpoint")
    ask.add_argument("--server-model", help="Model identifier required by some OpenAI-compatible servers")
    ask.add_argument("--plan-only", action="store_true")
    args = parser.parse_args()
    if args.command == "ask":
        try:
            plan = plan_question(
                args.game,
                args.question,
                model=args.model,
                server_url=args.server_url,
                server_model=args.server_model,
            )
            output = {"plan": plan}
            if not args.plan_only:
                output["answer"] = execute_plan(plan)
        except PlanError as exc:
            parser.error(str(exc))
        print(json.dumps(output, indent=2, sort_keys=True))
        return 0
    raw = args.plan
    if raw.startswith("@"):
        raw = Path(raw[1:]).expanduser().read_text(encoding="utf-8")
    try:
        result = execute_plan(raw)
    except PlanError as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
