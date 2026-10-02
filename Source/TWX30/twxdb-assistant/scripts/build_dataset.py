#!/usr/bin/env python3
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SYSTEM = (
    "You are TWXDB Planner v1. Convert the user's TradeWars database question into exactly one compact JSON object, "
    "with no markdown or explanation. Use v=1. Operations: query, path, unsupported. Query entities: sectors, "
    "fighters, planets, ports, mines, deadends, ships, traders, users, header. Filters are objects with field, op, "
    "and optional value; ops are =, !=, <, <=, >, >=, contains, in, truthy, falsy. A neighbor object filters "
    "directed adjacent sectors using direction out, in, or either plus where and min/max. Use direction=in when "
    "asking which sectors can warp into the current sector. Use source_list and list_match for list files. "
    "Valid aggregates: rows, count, sum, group_count. Return unsupported for log diagnosis, script behavior, "
    "commands, or facts not available in the XDB. Always copy the Game value into game."
)
GAMES = [
    "microblaster_network_s", "thecity_e", "joes_tavern_g", "abandoned_stardock_b",
    "worldsapart_l", "pirate_s_a", "rogue_t", "thecity_a",
]


def compact(value: dict[str, Any]) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=True)


def record(game: str, question: str, plan: dict[str, Any]) -> dict[str, Any]:
    return {
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Game: {game}\nQuestion: {question}"},
            {"role": "assistant", "content": compact({"v": 1, **plan, "game": game} if plan.get("op") != "unsupported" else {"v": 1, **plan})},
        ]
    }


def query(entity: str, **kwargs: Any) -> dict[str, Any]:
    return {"op": "query", "entity": entity, **kwargs}


def cond(field: str, op: str, value: Any = None) -> dict[str, Any]:
    result: dict[str, Any] = {"field": field, "op": op}
    if op not in {"truthy", "falsy"}:
        result["value"] = value
    return result


def make_threshold_examples(split: str) -> list[dict[str, Any]]:
    phrases = {
        "train": [
            "how many non-MSL border sectors have less than {qty} of my fighters?",
            "count my border sectors outside MSL with under {qty} fighters",
            "how many attackable border sectors have fewer than {qty} friendly figs?",
        ],
        "valid": ["number of non-MSL frontier sectors below {qty} of our fighters"],
        "test": ["how many of our non-MSL edge sectors can be entered from outside and hold under {qty} figs?"],
    }[split]
    results = []
    for game in GAMES:
        for qty in [500, 250000, 375000, 550000, 1000000]:
            for phrase in phrases:
                results.append(record(game, phrase.format(qty=f"{qty:,}"), query(
                    "sectors",
                    where=[cond("figsec", "truthy"), cond("mslsec", "falsy"), cond("fighter_qty", "<", qty)],
                    neighbor={"direction": "in", "where": [cond("figsec", "falsy")], "min": 1},
                    aggregate="count",
                )))
    return results


def make_fighter_examples(split: str) -> list[dict[str, Any]]:
    list_phrases = {
        "train": [
            "list sectors where I have more than {low} but less than {high} fighters",
            "show my fig sectors between {low} and {high} fighters",
            "which sectors have over {low} and under {high} of our fighters?",
            "give me our sectors whose fighter quantity is greater than {low} and below {high}",
            "where do our fighters exceed {low} without reaching {high}?",
        ],
        "valid": ["find friendly fighter sectors in the range {low} to {high}, excluding the endpoints"],
        "test": ["give me our sectors whose fighter quantity is greater than {low} and below {high}"],
    }[split]
    exact_phrases = {
        "train": [
            "which sectors have exactly {qty} of my fighters?",
            "list our {qty}-fighter sectors",
            "where is our fighter count equal to {qty}?",
            "show sectors where friendly fighter quantity equals {qty}",
            "what sectors contain precisely {qty} of our fighters?",
        ],
        "valid": ["find friendly sectors holding precisely {qty} fighters"],
        "test": ["in which sectors does our fighter total match {qty} exactly?"],
    }[split]
    results = []
    for game in GAMES:
        for low, high in [(1, 250000), (500, 250000), (250000, 1000000)]:
            for phrase in list_phrases:
                results.append(record(game, phrase.format(low=low, high=high), query(
                    "fighters", where=[cond("friendly", "truthy"), cond("qty", ">", low), cond("qty", "<", high)],
                    select=["sector", "qty"], sort=["sector"], aggregate="rows",
                )))
        for qty in [1, 250000, 375000, 1000000]:
            for phrase in exact_phrases:
                results.append(record(game, phrase.format(qty=qty), query(
                    "fighters", where=[cond("friendly", "truthy"), cond("qty", "=", qty)],
                    select=["sector", "qty"], sort=["sector"], aggregate="rows",
                )))
    return results


def make_border_examples(split: str) -> list[dict[str, Any]]:
    friendly = {
        "train": [
            "list all non-MSL border sectors where I have a fighter",
            "show our figged sectors outside MSL that an unfigged sector can warp into",
            "give me friendly non-MSL sectors on the enemy-facing border",
        ],
        "valid": ["which of our non-MSL sectors are directly enterable from an unfigged sector?"],
        "test": ["find every non-MSL friendly fighter sector with an incoming warp from outside our grid"],
    }[split]
    enemy = {
        "train": [
            "how many enemy fighter sectors can we warp into from our grid?",
            "count hostile fig sectors adjacent by an outgoing warp from our figged sectors",
        ],
        "valid": ["number of enemy-held sectors reachable in one warp from our fighter grid"],
        "test": ["how many hostile fighter sectors have an inbound link from one of our fig sectors?"],
    }[split]
    results = []
    for game in GAMES:
        for phrase in friendly:
            results.append(record(game, phrase, query(
                "sectors", where=[cond("figsec", "truthy"), cond("mslsec", "falsy")],
                neighbor={"direction": "in", "where": [cond("figsec", "falsy")], "min": 1},
                select=["sector", "fighter_qty", "matching_neighbor_count"], sort=["sector"], aggregate="rows",
            )))
        for phrase in enemy:
            results.append(record(game, phrase, query(
                "sectors", where=[cond("friendly", "falsy"), cond("fighter_qty", ">", 0)],
                neighbor={"direction": "in", "where": [cond("figsec", "truthy")], "min": 1},
                aggregate="count",
            )))
    return results


def make_planet_examples(split: str) -> list[dict[str, Any]]:
    count_phrases = {
        "train": [
            "how many sectors have exactly {count} planets?",
            "count sectors containing {count} planets",
        ],
        "valid": ["number of sectors whose planet count equals {count}"],
        "test": ["how many sectors currently contain precisely {count} planets?"],
    }[split]
    no_planet_phrases = {
        "train": [
            "list my figged sectors with no planets",
            "where do I have a fighter but no current planet?",
            "which of our fighter sectors do not contain any planets?",
            "show sectors in our grid whose planet count is zero",
        ],
        "valid": ["show friendly fig sectors whose authoritative planet count is zero"],
        "test": ["which of our fighter sectors do not contain any planets?"],
    }[split]
    construction_phrases = {
        "train": ["list planets currently under construction", "which planets have an upgrade underway?"],
        "valid": ["show every planet with construction in progress"],
        "test": ["what planets are presently being upgraded?"],
    }[split]
    named_phrases = {
        "train": [
            "list all planets named {name}",
            "where are the {name} planets?",
            "show planet number and sector for every {name} planet",
            "find every planet whose name includes {name}",
        ],
        "valid": ["find planets whose name contains {name}"],
        "test": ["show planet number and sector for every {name} planet"],
    }[split]
    results = []
    for game in GAMES:
        for count in [0, 1, 2, 3, 4]:
            for phrase in count_phrases:
                results.append(record(game, phrase.format(count=count), query(
                    "sectors", where=[cond("planet_count", "=", count)], aggregate="count",
                )))
        for phrase in no_planet_phrases:
            results.append(record(game, phrase, query(
                "sectors", where=[cond("figsec", "truthy"), cond("planet_count", "=", 0)],
                select=["sector"], sort=["sector"], aggregate="rows",
            )))
        for phrase in construction_phrases:
            results.append(record(game, phrase, query(
                "planets", where=[cond("construction_underway", "truthy")],
                select=["id", "name", "sector", "level", "construction_type", "construction_days"],
                sort=["sector", "id"], aggregate="rows",
            )))
        for name in ["Zippity Doo Dah", "New Terra", "Fortress"]:
            for phrase in named_phrases:
                results.append(record(game, phrase.format(name=name), query(
                    "planets", where=[cond("name", "contains", name)],
                    select=["id", "name", "sector", "level"], sort=["sector", "id"], aggregate="rows",
                )))
    return results


def make_port_examples(split: str) -> list[dict[str, Any]]:
    phrases = {
        "train": [
            "list equipment-buying ports with at least {qty} equipment",
            "which ports buy equipment and have {qty} or more available?",
        ],
        "valid": ["find equipment buyers whose current equipment amount is no less than {qty}"],
        "test": ["show ports purchasing equipment with at least {qty} units recorded"],
    }[split]
    results = []
    for game in GAMES:
        for qty in [2000, 5000, 60000]:
            for phrase in phrases:
                results.append(record(game, phrase.format(qty=qty), query(
                    "ports", where=[cond("buy.equipment", "=", True), cond("amount.equipment", ">=", qty)],
                    select=["sector", "name", "class", "amount.equipment", "pct.equipment"],
                    sort=["sector"], aggregate="rows",
                )))
    return results


def make_deadend_examples(split: str) -> list[dict[str, Any]]:
    phrases = {
        "train": [
            "give me the deadends in {file} in file order with their depth",
            "list terminal deadends from {file}, starting with the first found, and show depth",
            "which deadend endpoints occur in {file}, preserving list order?",
        ],
        "valid": ["find deadend terminals in {file} and report them by their original position and depth"],
        "test": ["show the deadends contained in {file} from the beginning of the file, including each arm depth"],
    }[split]
    files = ["abandoned_b.list", "joes_g.list", "micro_s.list"]
    results = []
    for game, file_name in zip(GAMES[:3], files):
        for phrase in phrases:
            results.append(record(game, phrase.format(file=file_name), query(
                "deadends", source_list=file_name, list_match="deepest",
                select=["deepest", "max_depth", "door", "sectors", "list_order"],
                sort=["list_order"], aggregate="rows",
            )))
    return results


def make_path_examples(split: str) -> list[dict[str, Any]]:
    phrases = {
        "train": [
            "what is the path from {start} to {end}?",
            "show the directed route between {start} and {end}",
            "how many hops from {start} to {end}?",
        ],
        "valid": ["find a shortest directed course starting at {start} and ending at {end}"],
        "test": ["route me from {start} through the known warps to {end}"],
    }[split]
    pairs: list[tuple[Any, Any]] = [(1, "stardock"), ("stardock", "rylos"), ("alpha", "stardock"), (11802, 6093)]
    results = []
    for game in GAMES:
        for start, end in pairs:
            for phrase in phrases:
                results.append(record(game, phrase.format(start=start, end=end), {
                    "op": "path", "from": start, "to": end,
                }))
    return results


def make_misc_examples(split: str) -> list[dict[str, Any]]:
    unsupported = {
        "train": [
            "why did msweep stop in the last run?",
            "show me today's fighter-hit log lines",
            "why did mgrid send the wrong macro?",
            "recompile strip.cts",
        ],
        "valid": ["what happened to wsst in the latest log?", "fix the trigger bug in farm"],
        "test": ["why did the script get stuck at the planet prompt?", "what message just scrolled by?"],
    }[split]
    msl_phrases = {
        "train": [
            "list all MSL sectors",
            "which sectors are marked MSL?",
            "give me every known major space lane sector",
            "show the major space lane sectors",
        ],
        "valid": ["show sectors carrying the MSLSEC marker"],
        "test": ["give me every known major space lane sector"],
    }[split]
    results = []
    for game in GAMES:
        for phrase in unsupported:
            results.append(record(game, phrase, {"op": "unsupported", "reason": "requires logs or script analysis"}))
        for phrase in msl_phrases:
            results.append(record(game, phrase, query(
                "sectors", where=[cond("mslsec", "truthy")], select=["sector"], sort=["sector"], aggregate="rows",
            )))
    return results


def make_labeled_chat_examples(split: str) -> list[dict[str, Any]]:
    if split != "train":
        return []
    examples: list[tuple[str, str, dict[str, Any]]] = [
        (
            "abandoned_stardock_b",
            "give me a list of deadends in abandoned_b.list in abandoned_stardock_b, starting with the first found and then in order from the start, listed by depth",
            query("deadends", source_list="abandoned_b.list", list_match="deepest",
                  select=["deepest", "max_depth", "door", "sectors", "list_order"], sort=["list_order"], aggregate="rows"),
        ),
        (
            "microblaster_network_s",
            "give me a list of all non-MSL border sectors in microblaster_network_s that have less than 1 million figs",
            query("sectors", where=[cond("figsec", "truthy"), cond("mslsec", "falsy"), cond("fighter_qty", "<", 1000000)],
                  neighbor={"direction": "in", "where": [cond("figsec", "falsy")], "min": 1},
                  select=["sector", "fighter_qty"], sort=["sector"], aggregate="rows"),
        ),
        (
            "microblaster_network_s",
            "how many sectors in microblaster_network_s with enemy fighters have less than 1,000,000 enemy fighters?",
            query("fighters", where=[cond("friendly", "falsy"), cond("qty", ">", 0), cond("qty", "<", 1000000)], aggregate="count"),
        ),
        (
            "microblaster_network_s",
            "what sectors do we have fighters adjacent enemy fighters but no planets?",
            query("sectors", where=[cond("figsec", "truthy"), cond("planet_count", "=", 0)],
                  neighbor={"direction": "either", "where": [cond("friendly", "falsy"), cond("fighter_qty", ">", 0)], "min": 1},
                  select=["sector", "fighter_qty"], sort=["sector"], aggregate="rows"),
        ),
        (
            "microblaster_network_s",
            "how many msl sectors currently have my planets in them?",
            query("sectors", where=[cond("mslsec", "truthy"), cond("planet_count", ">", 0)], aggregate="count"),
        ),
        (
            "microblaster_network_s",
            "give me a list of all sectors with more than 500 and less than 250,000 of my fighters",
            query("fighters", where=[cond("friendly", "truthy"), cond("qty", ">", 500), cond("qty", "<", 250000)],
                  select=["sector", "qty"], sort=["sector"], aggregate="rows"),
        ),
        (
            "microblaster_network_s",
            "what planets in the same game have the most fuel onboard? planet # and sector",
            query("planets", where=[cond("fuel", ">", 0)], select=["id", "sector", "fuel"],
                  sort=[{"field": "fuel", "direction": "desc"}], limit=10, aggregate="rows"),
        ),
        (
            "joes_tavern_g",
            "how many sectors in joes_g.list are not yet figged in joes_tavern_g?",
            query("sectors", source_list="joes_g.list", where=[cond("figsec", "falsy")], aggregate="count"),
        ),
        (
            "joes_tavern_g",
            "give me a list of all sectors in joes_tavern_g within joes_g.list that do not have planets",
            query("sectors", source_list="joes_g.list", where=[cond("planet_count", "=", 0)],
                  select=["sector"], sort=["list_order"], aggregate="rows"),
        ),
        (
            "joes_tavern_g",
            "how many ports are known in joes_tavern_g?",
            query("ports", aggregate="count"),
        ),
        (
            "thecity_e",
            "show me all MSL sectors with more than 500 of my fighters",
            query("fighters", where=[cond("friendly", "truthy"), cond("mslsec", "truthy"), cond("qty", ">", 500)],
                  select=["sector", "qty"], sort=["sector"], aggregate="rows"),
        ),
        (
            "thecity_e",
            "can you find all sectors in thecity_e with more than 1 million of corp fighters?",
            query("fighters", where=[cond("owner", "contains", "Corp"), cond("qty", ">", 1000000)],
                  select=["sector", "qty", "owner"], sort=["sector"], aggregate="rows"),
        ),
        (
            "microblaster_network_s",
            "is 11802 in an MSL?",
            query("sectors", where=[cond("sector", "=", 11802)], select=["sector", "mslsec"], aggregate="rows"),
        ),
        (
            "abandoned_stardock_b",
            "what is happening in abandoned_stardock_b that makeplanet is suddenly failing to get genesis torpedoes?",
            {"op": "unsupported", "reason": "requires logs or script analysis"},
        ),
    ]
    return [record(game, question, plan) for game, question, plan in examples]


def make_short_form_examples(split: str) -> list[dict[str, Any]]:
    port_phrases = {
        "train": [
            "how many ports are known in {game}?",
            "how many known ports are there?",
            "count the recorded ports",
            "what is the known port count?",
            "number of ports with database records",
        ],
        "valid": ["give me the count of ports currently known to the database"],
        "test": ["what is the total number of recorded ports?"],
    }[split]
    msl_phrases = {
        "train": [
            "is {sector} in an MSL?",
            "is sector {sector} an MSL?",
            "check whether {sector} is marked MSL",
            "does sector {sector} belong to a major space lane?",
            "show the MSL status of sector {sector}",
        ],
        "valid": ["is MSLSEC set for sector {sector}?"],
        "test": ["does sector {sector} carry the MSL marker?"],
    }[split]
    results: list[dict[str, Any]] = []
    for game in GAMES:
        for phrase in port_phrases:
            results.append(record(game, phrase.format(game=game), query("ports", aggregate="count")))
        for sector in [11802, 19677, 17915, 6093]:
            for phrase in msl_phrases:
                results.append(record(game, phrase.format(sector=sector), query(
                    "sectors", where=[cond("sector", "=", sector)], select=["sector", "mslsec"], aggregate="rows",
                )))
    return results


def build(split: str) -> list[dict[str, Any]]:
    examples: list[dict[str, Any]] = []
    for builder in [
        make_threshold_examples, make_fighter_examples, make_border_examples,
        make_planet_examples, make_port_examples, make_deadend_examples,
        make_path_examples, make_misc_examples, make_labeled_chat_examples,
        make_short_form_examples,
    ]:
        examples.extend(builder(split))
    random.Random({"train": 1731, "valid": 1732, "test": 1733}[split]).shuffle(examples)
    return examples


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    counts = {}
    for split in ["train", "valid", "test"]:
        rows = build(split)
        path = DATA / f"{split}.jsonl"
        with path.open("w", encoding="utf-8") as handle:
            for row in rows:
                handle.write(json.dumps(row, ensure_ascii=True) + "\n")
        counts[split] = len(rows)
    manifest = {
        "schema": 1,
        "base_model": "mlx-community/SmolLM2-135M-Instruct",
        "system_prompt": SYSTEM,
        "sources": [
            "current Codex task questions extracted to data/chat_questions.txt",
            "/Users/mosleym/.codex/skills/twx-scripting/SKILL.md",
            "/Users/mosleym/.codex/skills/twx-scripting/references/gameplay.md",
            "/Users/mosleym/.codex/skills/tradewars/SKILL.md",
            "/Users/mosleym/.codex/skills/tradewars-gameplay/SKILL.md",
            "/Users/mosleym/Code/twxproxy/TWX30/Source/Tools/twxdb-query.py",
        ],
        "split_policy": "distinct natural-language templates by split; shared semantic plans",
        "counts": counts,
    }
    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(counts, sort_keys=True))


if __name__ == "__main__":
    main()
