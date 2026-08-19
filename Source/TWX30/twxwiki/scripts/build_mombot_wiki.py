#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import shutil
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


WIKI_DIR = Path(__file__).resolve().parents[1]
TIDDLERS_DIR = WIKI_DIR / "tiddlers"
GENERATED_DIR = TIDDLERS_DIR / "generated-mombot"

DEFAULT_HELP_DIR = Path("/Users/mosleym/twx/scripts/mombot/help")
DEFAULT_COMMANDS_DIR = Path("/Users/mosleym/twx/scripts/mombot/commands")
DEFAULT_MODES_DIR = Path("/Users/mosleym/twx/scripts/mombot/modes")
DEFAULT_DAEMONS_DIR = Path("/Users/mosleym/twx/scripts/mombot/daemons")
DEFAULT_STARTUPS_DIR = Path("/Users/mosleym/twx/scripts/mombot/startups")
DEFAULT_SKIP_FILE = WIKI_DIR / "skip-topics.txt"

CATEGORY_INFO = {
    "general": {
        "title": "General",
        "order": 10,
        "blurb": "Login, bot control, transport, setup, and everyday utility commands.",
    },
    "offense": {
        "title": "Offense",
        "order": 20,
        "blurb": "Attack, photon, capture, and offensive combat topics.",
    },
    "defense": {
        "title": "Defense",
        "order": 30,
        "blurb": "SaveMe, evac, hazard, and defensive behavior topics.",
    },
    "resource": {
        "title": "Resource",
        "order": 40,
        "blurb": "Buying, refurbing, ship sales, and resource-management helpers.",
    },
    "data": {
        "title": "Data",
        "order": 50,
        "blurb": "Scans, reports, lists, history, and data-query tools.",
    },
    "cashing": {
        "title": "Cashing",
        "order": 60,
        "blurb": "Steal, rob, trade, bust, and other money-making modes.",
    },
    "grid": {
        "title": "Grid",
        "order": 70,
        "blurb": "Grid, mine, limp, wall, and deployment workflows.",
    },
    "daemon": {
        "title": "Daemons",
        "order": 80,
        "blurb": "Background helpers and long-running service scripts.",
    },
    "startup": {
        "title": "Startups",
        "order": 90,
        "blurb": "Startup and auto-loader scripts.",
    },
    "reference": {
        "title": "Reference",
        "order": 100,
        "blurb": "Imported help topics that do not map cleanly to a live command or mode file.",
    },
}

HELP_ALIASES = {
    "photon": "foton",
}

SPECIAL_CATEGORY_GUESSES = {
    "0": "data",
    "about": "reference",
    "bot": "general",
    "help": "general",
    "listall": "general",
}

KIND_LABELS = {
    "command": "Command",
    "mode": "Mode",
    "daemon": "Daemon",
    "startup": "Startup",
}


@dataclass(frozen=True)
class SourceRef:
    kind: str
    category: str
    path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import live Mombot help into the local TiddlyWiki workspace and optionally build the single-file HTML."
    )
    parser.add_argument("--wiki-dir", type=Path, default=WIKI_DIR)
    parser.add_argument("--help-dir", type=Path, default=DEFAULT_HELP_DIR)
    parser.add_argument("--commands-dir", type=Path, default=DEFAULT_COMMANDS_DIR)
    parser.add_argument("--modes-dir", type=Path, default=DEFAULT_MODES_DIR)
    parser.add_argument("--daemons-dir", type=Path, default=DEFAULT_DAEMONS_DIR)
    parser.add_argument("--startups-dir", type=Path, default=DEFAULT_STARTUPS_DIR)
    parser.add_argument(
        "--skip-file",
        type=Path,
        default=DEFAULT_SKIP_FILE,
        help="Plain text file of topic names to exclude from the generated wiki; one name per line.",
    )
    parser.add_argument("--skip-build", action="store_true", help="Only refresh tiddlers; do not render the HTML output.")
    return parser.parse_args()


def tw_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S000")


def slugify(value: str) -> str:
    pieces = []
    for char in value:
        if char.isalnum():
            pieces.append(char)
        else:
            pieces.append("_")
    slug = "".join(pieces).strip("_")
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug or "tiddler"


def tid_path(root: Path, title: str) -> Path:
    return root / f"{slugify(title)}.tid"


def write_tid(path: Path, title: str, body: str, tags: Iterable[str] = (), extra_fields: dict[str, str] | None = None) -> None:
    stamp = tw_timestamp()
    lines = [
        f"created: {stamp}",
        f"modified: {stamp}",
        f"title: {title}",
        "type: text/vnd.tiddlywiki",
    ]
    tag_list = " ".join(tags).strip()
    if tag_list:
        lines.append(f"tags: {tag_list}")
    if extra_fields:
        for key, value in extra_fields.items():
            lines.append(f"{key}: {value}")
    path.write_text("\n".join(lines) + "\n\n" + body.rstrip() + "\n", encoding="utf-8")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n").rstrip()


def normalize_topic_name(value: str) -> str:
    return HELP_ALIASES.get(value.strip().lower(), value.strip().lower())


def load_skip_names(path: Path) -> set[str]:
    if not path.exists():
        return set()

    skip_names: set[str] = set()
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        skip_names.add(normalize_topic_name(line))
    return skip_names


def first_summary_line(text: str) -> str:
    for raw_line in text.splitlines():
        line = " ".join(raw_line.split())
        if not line:
            continue
        if line.startswith("<<<<") and line.endswith(">>>>"):
            continue
        return line
    return ""


def category_title(slug: str) -> str:
    return CATEGORY_INFO.get(slug, {"title": slug.title()})["title"]


def category_order(slug: str) -> int:
    return CATEGORY_INFO.get(slug, {"order": 999})["order"]


def scan_sources(root: Path, kind: str) -> dict[str, list[SourceRef]]:
    results: dict[str, list[SourceRef]] = defaultdict(list)
    if not root.exists():
        return results

    for path in sorted(root.rglob("*.cts")):
        if path.name.startswith(".") or path.name == "placeholder.file":
            continue
        if kind in {"command", "mode"} and "include" in {part.lower() for part in path.parts}:
            continue
        category = path.parent.name.lower() if kind in {"command", "mode"} else kind
        results[path.stem.lower()].append(SourceRef(kind=kind, category=category, path=path))

    return results


def build_entry_body(
    display_name: str,
    categories: list[str],
    sources: list[SourceRef],
    help_path: Path | None,
    help_text: str | None,
) -> str:
    kinds = sorted({ref.kind for ref in sources}, key=lambda item: KIND_LABELS.get(item, item))
    lines = [f"! {display_name}", ""]

    if help_text:
        summary = first_summary_line(help_text)
        if summary:
            lines.append(summary)
            lines.append("")

    lines.append("''Categories:'' " + ", ".join(category_title(category) for category in categories))
    lines.append("''Kinds:'' " + (", ".join(KIND_LABELS.get(kind, kind.title()) for kind in kinds) if kinds else "Help Topic"))

    if sources:
        source_summaries = []
        for ref in sources:
            source_summaries.append(f"{KIND_LABELS.get(ref.kind, ref.kind.title())} ({category_title(ref.category)})")
        lines.append("''Source matches:'' " + ", ".join(source_summaries))
    else:
        lines.append("''Source matches:'' No direct command, mode, startup, or daemon match was found.")

    lines.append("")
    lines.append("!! Help")
    if help_text:
        lines.append("<pre>")
        lines.append(html.escape(help_text))
        lines.append("</pre>")
    else:
        lines.append("No live help file was found for this topic. The entry is here because a matching live script or mode exists.")

    if sources and not help_text:
        lines.append("")
        lines.append("!! Gap Notice")
        lines.append("A live script or mode exists for this topic, but the live Mombot help folder does not currently include a matching help file.")

    lines.append("")
    lines.append("!! Maintenance")
    lines.append("This tiddler is generated from the live Mombot tree. Put your own long-form notes in separate guide tiddlers so future imports do not overwrite them.")
    return "\n".join(lines)


def build_category_body(title: str, blurb: str, entries: list[dict[str, object]]) -> str:
    lines = [f"! {title}", "", blurb, "", "!! Command List", ""]
    quick_links: list[str] = []
    for entry in entries:
        display = str(entry["display"])
        entry_title = str(entry["title"])
        label = display.lower()
        if label == entry_title:
            quick_links.append(f"[[{entry_title}]]")
        else:
            quick_links.append(f"[[{label}|{entry_title}]]")

    wrapped_links: list[str] = []
    current_line: list[str] = []
    current_len = 0
    for link in quick_links:
        addition = len(link) + (1 if current_line else 0)
        if current_line and current_len + addition > 110:
            wrapped_links.append(" ".join(current_line))
            current_line = [link]
            current_len = len(link)
        else:
            current_line.append(link)
            current_len += addition
    if current_line:
        wrapped_links.append(" ".join(current_line))

    lines.extend(wrapped_links)
    lines.extend(["", f"Topics: {len(entries)}", "", "!! Detailed List", ""])
    for entry in entries:
        summary = entry["summary"] or "Help topic"
        lines.append(f"* [[{entry['title']}]] - {summary}")
    return "\n".join(lines)


def build_directory_body(category_counts: list[tuple[str, int]], entries: list[dict[str, object]], missing_help_count: int) -> str:
    lines = [
        "! Mombot Directory",
        "",
        f"Topics: {len(entries)}",
        f"Topics missing live help: {missing_help_count}",
        "",
        "!! Browse by Category",
    ]
    for category_slug, count in category_counts:
        lines.append(f"* [[Mombot Category: {category_title(category_slug)}]] ({count})")

    lines.extend(["", "!! All Topics"])
    for entry in entries:
        category_names = ", ".join(category_title(slug) for slug in entry["categories"])
        summary = entry["summary"] or "Help topic"
        lines.append(f"* [[{entry['title']}]] - {category_names} - {summary}")
    return "\n".join(lines)


def seed_manual_tiddlers(tiddlers_dir: Path) -> None:
    seeds = {
        "Mombot Wiki Home": """! Mombot Wiki Home

Replace this opening section with your own overview for the people who will use this wiki.

This wiki is built from the live Mombot help folder and then mixed with editable guide pages. Use the search box in the wiki chrome to search for any command name, phrase, or string across imported help and your own notes.

!! Browse by Category
* [[Mombot Category: General]]
* [[Mombot Category: Offense]]
* [[Mombot Category: Defense]]
* [[Mombot Category: Resource]]
* [[Mombot Category: Data]]
* [[Mombot Category: Cashing]]
* [[Mombot Category: Grid]]
* [[Mombot Category: Daemons]]
* [[Mombot Category: Startups]]
* [[Mombot Category: Reference]]

!! Guides You Can Edit
* [[Using Mombot]]
* [[Native Bot Guide]]
* [[Other Bot Notes]]
* [[Maintaining the Mombot Wiki]]
* [[Mombot Commands]]

!! Full Index
* [[Mombot Directory]]
""",
        "Using Mombot": """! Using Mombot

Use this page for the general Mombot walkthrough you want to keep alongside the imported help.

Suggested sections:
* Basic command syntax
* Logging into your own bot vs someone else's bot
* Common startup flow
* Category-by-category quick picks
* Proxy-specific notes or caveats
""",
        "Native Bot Guide": """! Native Bot Guide

Use this page for notes about the native bot.

Suggested sections:
* What the native bot is for
* Command syntax and common workflows
* Differences from Mombot
* Proxy/runtime behavior that matters in TWX30
""",
        "Other Bot Notes": """! Other Bot Notes

Use this page for anything that does not belong strictly to Mombot or the native bot.

Ideas:
* Game-specific bot conventions
* Older bot packs
* Team workflows
* Known compatibility notes
""",
        "Maintaining the Mombot Wiki": """! Maintaining the Mombot Wiki

The editable source for this wiki lives in the local TiddlyWiki workspace.

Mombot help tiddlers are regenerated into the `generated-mombot` folder inside that workspace.

To refresh the help content and rebuild the single-file HTML:

{{{
python3 twxwiki/scripts/build_mombot_wiki.py
}}}

Notes:
* Edit the guide pages outside `generated-mombot` if you do not want reruns to overwrite them.
* The built single-file HTML is written to the wiki output folder as `mombot-wiki.html`.
""",
    }

    for title, body in seeds.items():
        path = tid_path(tiddlers_dir, title)
        if not path.exists():
            write_tid(path, title, body, tags=("guide", "mombot"))


def main() -> int:
    args = parse_args()

    wiki_dir = args.wiki_dir.resolve()
    tiddlers_dir = wiki_dir / "tiddlers"
    generated_dir = tiddlers_dir / "generated-mombot"
    generated_dir.mkdir(parents=True, exist_ok=True)

    for old_file in generated_dir.glob("*.tid"):
        old_file.unlink()

    help_files = {path.stem.lower(): path for path in sorted(args.help_dir.glob("*.txt"))}
    sources_by_name: dict[str, list[SourceRef]] = defaultdict(list)
    skip_names = load_skip_names(args.skip_file.resolve())
    for root, kind in (
        (args.commands_dir, "command"),
        (args.modes_dir, "mode"),
        (args.daemons_dir, "daemon"),
        (args.startups_dir, "startup"),
    ):
        for name, refs in scan_sources(root, kind).items():
            canonical_name = HELP_ALIASES.get(name, name)
            sources_by_name[canonical_name].extend(refs)

    all_names = sorted(set(help_files) | set(sources_by_name))
    entries: list[dict[str, object]] = []
    missing_help_count = 0

    for name in all_names:
        help_key = HELP_ALIASES.get(name, name)
        help_path = help_files.get(help_key)
        help_text = read_text(help_path) if help_path else None
        sources = sorted(
            sources_by_name.get(name, []),
            key=lambda ref: (category_order(ref.category), KIND_LABELS.get(ref.kind, ref.kind), str(ref.path)),
        )

        display_name = (help_path.stem if help_path else (sources[0].path.stem if sources else name)).lower()
        if normalize_topic_name(name) in skip_names or normalize_topic_name(display_name) in skip_names:
            continue
        categories = sorted({ref.category for ref in sources}, key=category_order)
        if not categories:
            categories = [SPECIAL_CATEGORY_GUESSES.get(name, "reference")]

        summary = first_summary_line(help_text) if help_text else "Topic without live help text."
        entry_title = display_name
        entry_body = build_entry_body(display_name, categories, sources, help_path, help_text)
        tags = ["mombot", "topic"]
        tags.extend(f"cat-{category}" for category in categories)
        tags.extend(f"kind-{kind}" for kind in sorted({ref.kind for ref in sources}))
        if not help_text:
            tags.append("missing-help")
            missing_help_count += 1

        write_tid(
            tid_path(generated_dir, entry_title),
            entry_title,
            entry_body,
            tags=tags,
            extra_fields={"caption": display_name},
        )

        entries.append(
            {
                "key": name,
                "title": entry_title,
                "display": display_name,
                "summary": summary,
                "categories": categories,
            }
        )

    entries.sort(key=lambda entry: str(entry["display"]).lower())

    category_counts: list[tuple[str, int]] = []
    for category_slug in sorted(
        {slug for entry in entries for slug in entry["categories"]},
        key=category_order,
    ):
        category_entries = [entry for entry in entries if category_slug in entry["categories"]]
        category_counts.append((category_slug, len(category_entries)))
        info = CATEGORY_INFO.get(category_slug, {"title": category_slug.title(), "blurb": "Imported topics."})
        write_tid(
            tid_path(generated_dir, f"Mombot Category: {info['title']}"),
            f"Mombot Category: {info['title']}",
            build_category_body(info["title"], info["blurb"], category_entries),
            tags=("mombot", "category"),
        )

    write_tid(
        tid_path(generated_dir, "Mombot Directory"),
        "Mombot Directory",
        build_directory_body(category_counts, entries, missing_help_count),
        tags=("mombot", "directory"),
    )

    seed_manual_tiddlers(tiddlers_dir)

    if args.skip_build:
        print(f"Imported {len(entries)} Mombot topics into {generated_dir}")
        return 0

    subprocess.run(
        ["tiddlywiki", str(wiki_dir), "--build", "index"],
        check=True,
        cwd=wiki_dir,
    )

    output_dir = wiki_dir / "output"
    index_html = output_dir / "index.html"
    named_html = output_dir / "mombot-wiki.html"
    if index_html.exists():
        shutil.copyfile(index_html, named_html)

    print(f"Imported {len(entries)} Mombot topics into {generated_dir}")
    print(f"Built wiki output at {named_html if named_html.exists() else index_html}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(f"Build failed: {exc}", file=sys.stderr)
        raise SystemExit(exc.returncode)
