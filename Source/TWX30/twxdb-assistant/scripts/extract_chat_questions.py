#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import argparse
from pathlib import Path


SESSION = Path.home() / ".codex" / "sessions" / "2026" / "07" / "02" / "rollout-2026-07-02T19-55-50-019f2542-9b7b-7961-b16b-43810018707a.jsonl"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "chat_questions.txt"
KEYWORDS = re.compile(
    r"\b(sector|fig|fighter|planet|port|deadend|bubble|warp|msl|grid|xdb|cim|tl\b|"
    r"alien|mine|limpet|armid|stardock|terra|rylos|alpha|colonist|citadel|ship)\b",
    re.IGNORECASE,
)


def clean(text: str) -> str:
    text = re.sub(r"# Files mentioned by the user:.*?## My request(?: for Codex)?:", "", text, flags=re.DOTALL)
    text = re.sub(r"<image\b.*?</image>", "", text, flags=re.DOTALL)
    text = re.sub(r"<codex_internal_context.*?</codex_internal_context>", "", text, flags=re.DOTALL)
    return " ".join(text.split()).strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract TradeWars/XDB questions from a Codex JSONL task")
    parser.add_argument("--session", type=Path, default=SESSION)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    questions: list[str] = []
    with args.session.expanduser().open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            if item.get("type") != "response_item":
                continue
            payload = item.get("payload", {})
            if payload.get("type") != "message" or payload.get("role") != "user":
                continue
            parts = [part.get("text", "") for part in payload.get("content", []) if part.get("type") in {"input_text", "text"}]
            text = clean("\n".join(parts))
            if len(text) < 12 or not KEYWORDS.search(text):
                continue
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)
            questions.append(text)
    args.output.expanduser().write_text("\n".join(questions) + "\n", encoding="utf-8")
    print(f"wrote {len(questions)} questions to {args.output.expanduser()}")


if __name__ == "__main__":
    main()
