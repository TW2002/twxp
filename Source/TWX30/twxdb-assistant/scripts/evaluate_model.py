#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[1]


def extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        return value if isinstance(value, dict) else None
    return None


def normalize(value: Any, key: str = "") -> Any:
    if isinstance(value, dict):
        return {name: normalize(item, name) for name, item in sorted(value.items()) if name != "reason"}
    if isinstance(value, list):
        items = [normalize(item) for item in value]
        if key == "where":
            items.sort(key=lambda item: json.dumps(item, sort_keys=True))
        return items
    return value


def mlx_generator(model_path: str, adapter_path: str | None) -> Callable[[list[dict[str, str]]], str]:
    from mlx_lm import generate, load
    from mlx_lm.sample_utils import make_sampler

    model, tokenizer = load(model_path, adapter_path=adapter_path)
    sampler = make_sampler(temp=0.0)

    def run(messages: list[dict[str, str]]) -> str:
        prompt = tokenizer.apply_chat_template(messages, add_generation_prompt=True, tokenize=False)
        return generate(model, tokenizer, prompt=prompt, max_tokens=420, sampler=sampler, verbose=False)

    return run


class LlamaServer:
    def __init__(self, model: str, port: int = 18081):
        self.url = f"http://127.0.0.1:{port}/v1/chat/completions"
        self.process = subprocess.Popen(
            ["llama-server", "-m", model, "--host", "127.0.0.1", "--port", str(port), "-c", "2048", "-np", "1"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        health = f"http://127.0.0.1:{port}/health"
        for _ in range(120):
            if self.process.poll() is not None:
                raise RuntimeError("llama-server exited during startup")
            try:
                with urllib.request.urlopen(health, timeout=1) as response:
                    if response.status == 200:
                        break
            except (OSError, urllib.error.URLError):
                time.sleep(0.25)
        else:
            self.close()
            raise RuntimeError("llama-server did not become healthy")

    def generate(self, messages: list[dict[str, str]]) -> str:
        body = json.dumps({"messages": messages, "temperature": 0, "max_tokens": 420, "stream": False}).encode()
        request = urllib.request.Request(self.url, data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(request, timeout=60) as response:
            value = json.load(response)
        return value["choices"][0]["message"]["content"]

    def close(self) -> None:
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate TWXDB planner semantic accuracy")
    parser.add_argument("--model", required=True)
    parser.add_argument("--adapter")
    parser.add_argument("--split", default="test", choices=["train", "valid", "test"])
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--output")
    args = parser.parse_args()

    examples = [json.loads(line) for line in (ROOT / "data" / f"{args.split}.jsonl").open()]
    if args.limit > 0:
        examples = examples[: args.limit]

    server: LlamaServer | None = None
    if args.model.endswith(".gguf"):
        server = LlamaServer(args.model)
        generate_one = server.generate
    else:
        generate_one = mlx_generator(args.model, args.adapter)

    report_rows = []
    valid = op_match = exact = 0
    try:
        for index, example in enumerate(examples, start=1):
            messages = example["messages"][:-1]
            expected = json.loads(example["messages"][-1]["content"])
            raw = generate_one(messages)
            predicted = extract_json(raw)
            is_valid = predicted is not None
            valid += int(is_valid)
            same_op = is_valid and predicted.get("op") == expected.get("op")
            op_match += int(same_op)
            same_plan = is_valid and normalize(predicted) == normalize(expected)
            exact += int(same_plan)
            report_rows.append({
                "index": index,
                "question": messages[-1]["content"],
                "expected": expected,
                "predicted": predicted,
                "raw": raw,
                "json_valid": is_valid,
                "op_match": same_op,
                "plan_exact": same_plan,
            })
            if index % 25 == 0:
                print(f"evaluated {index}/{len(examples)} exact={exact / index:.1%}")
    finally:
        if server is not None:
            server.close()

    total = len(examples)
    summary = {
        "model": args.model,
        "adapter": args.adapter,
        "split": args.split,
        "examples": total,
        "json_valid": valid / total if total else 0,
        "op_accuracy": op_match / total if total else 0,
        "plan_exact": exact / total if total else 0,
    }
    output = Path(args.output) if args.output else ROOT / "artifacts" / f"eval-{args.split}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"summary": summary, "rows": report_rows}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
