from __future__ import annotations

import json
import os
import re
import socket
import subprocess
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from .executor import PlanError
from .prompt import SYSTEM_PROMPT


def extract_plan(text: str) -> dict[str, Any]:
    clean = text.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\s*", "", clean)
        clean = re.sub(r"\s*```$", "", clean)
    decoder = json.JSONDecoder()
    for index, char in enumerate(clean):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(clean[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    raise PlanError(f"Model did not return a JSON query plan: {text[:240]!r}")


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


@contextmanager
def local_server(model: Path, executable: Path | None = None) -> Iterator[str]:
    port = _free_port()
    server = executable or Path(os.environ.get("TWXDB_LLAMA_SERVER", "llama-server"))
    process = subprocess.Popen(
        [str(server), "-m", str(model), "--host", "127.0.0.1", "--port", str(port), "-c", "4096", "-np", "1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        cwd=str(server.parent) if server.parent != Path(".") else None,
    )
    health = f"http://127.0.0.1:{port}/health"
    try:
        for _ in range(120):
            if process.poll() is not None:
                raise PlanError("llama-server exited while loading the GGUF")
            try:
                with urllib.request.urlopen(health, timeout=1) as response:
                    if response.status == 200:
                        break
            except (OSError, urllib.error.URLError):
                time.sleep(0.25)
        else:
            raise PlanError("llama-server did not become healthy")
        yield f"http://127.0.0.1:{port}/v1/chat/completions"
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def request_plan(
    endpoint: str,
    game: str,
    question: str,
    model_name: str | None = None,
) -> dict[str, Any]:
    from .query_plans import deterministic_plan, validate_question_plan
    known=deterministic_plan(game,question)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Game: {game}\nQuestion: {question}"},
    ]
    if known is not None:
        messages[1]["content"] += "\nSchema-validated interpretation of this exact question: " + json.dumps(known, separators=(",", ":")) + "\nReturn this plan unchanged if it answers the question. Do not change the game, fields, IDs, filters, or limits."
    body: dict[str, Any] = {
        "messages": messages,
        "temperature": 0,
        "max_tokens": 420,
        "stream": False,
    }
    if model_name:
        body["model"] = model_name
    payload = json.dumps(body).encode()
    request = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json"})
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise PlanError(f"Inference server returned HTTP {exc.code}: {detail}") from exc
    text = result["choices"][0]["message"]["content"]
    # The SLM always interprets natural language once. A complete recognized grammar
    # supplies a safe fallback if the small model changes a constraint or emits bad JSON.
    # Never silently substitute a guessed plan for an unrecognized question.
    correction = None
    game_binding = None
    try:
        plan = extract_plan(text)
        # Database selection is caller-owned routing, not a model decision.
        # Bind it before validating semantics; retain any model discrepancy in
        # diagnostics without allowing it to redirect the query.
        if plan.get('game') != game:
            game_binding = {'requested': game, 'generated': plan.get('game'),
                            'status': 'missing' if not plan.get('game') else 'mismatch'}
        plan = {**plan, 'game': game}
        if known is None:
            plan = validate_question_plan(game, question, plan)
        elif plan != known:
            correction = "The SLM changed the schema-validated interpretation; exact fields and constraints were retained."
            plan = known
    except PlanError as exc:
        if known is None:
            exc.planner_diagnostics = {'requested_game': game, 'generated_plan': text[:2000],
                                       'game_binding': game_binding, 'model_requests': 1,
                                       'query_executed': False}
            raise
        correction = str(exc)
        plan = known
    return {**plan, "_planner": {"model_used": True, "model_requests": 1,
        "source": "validated_interpretation" if correction else "slm",
        "correction": correction, "game_binding": game_binding,
        "seconds": round(time.monotonic()-started, 3)}}


def plan_question(
    game: str,
    question: str,
    model: Path | None = None,
    server_url: str | None = None,
    server_model: str | None = None,
) -> dict[str, Any]:
    if server_url:
        endpoint = server_url.rstrip("/")
        if not endpoint.endswith("/v1/chat/completions"):
            endpoint += "/v1/chat/completions"
        return request_plan(endpoint, game, question, model_name=server_model)
    if model is None:
        raise PlanError("Provide --model or --server-url")
    if not model.is_file():
        raise PlanError(f"GGUF model not found: {model}")
    with local_server(model) as endpoint:
        return request_plan(endpoint, game, question)
