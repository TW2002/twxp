#!/usr/bin/env python3
"""
Overnight monitor for tabbed MTC performance investigations.

The script samples the running MTC process with ps(1), reads new rows from
mtc_perf.log, and writes correlated snapshots that make it easier to spot:

- high CPU without matching active-tab terminal/render work
- inactive tabs doing display/render/panel/status work
- display/session backlog growth
- memory growth over a long run
- periodic .NET runtime counter spikes, when dotnet-counters is available

It is intentionally out-of-process so instrumentation cannot slow gameplay.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any


DEFAULT_PROGRAM_DIR = Path.home() / "twx"
DEFAULT_LOG_DIR = DEFAULT_PROGRAM_DIR / "logs"
DEFAULT_PERF_LOG = DEFAULT_LOG_DIR / "mtc_perf.log"

SNAPSHOT_FIELDS = [
    "time",
    "pid",
    "process_found",
    "cpu_pct",
    "mem_pct",
    "rss_mb",
    "vsz_mb",
    "stat",
    "etime",
    "perf_rows",
    "active_tabs",
    "inactive_tabs",
    "active_display_feed_chunks",
    "active_display_drain_count",
    "active_terminal_render",
    "active_terminal_redraw_run",
    "active_panels_info_refresh",
    "active_state_changed",
    "active_ui_runs",
    "active_ui_posts",
    "inactive_display_feed_chunks",
    "inactive_display_drain_count",
    "inactive_terminal_render",
    "inactive_terminal_redraw_run",
    "inactive_panels_info_refresh",
    "inactive_status_refresh",
    "inactive_ui_runs",
    "inactive_ui_posts",
    "max_active_display_chunks",
    "max_active_display_bytes",
    "max_inactive_display_chunks",
    "max_inactive_display_bytes",
    "max_display_drain_flag",
    "max_sessionlog_drain_flag",
    "sessionlog_empty_false_tabs",
    "rss_growth_mb",
    "warnings",
]

RUNTIME_FIELDS = [
    "time",
    "pid",
    "csv",
    "working_set_mb_last",
    "alloc_mb_s_avg",
    "alloc_mb_s_max",
    "cpu_time_s_s_avg",
    "cpu_time_s_s_max",
    "queue_len_last",
    "queue_len_max",
    "work_items_s_avg",
    "lock_contentions_s_avg",
    "gc_pause_s_s_avg",
]

NATIVE_MEMORY_FIELDS = [
    "time",
    "pid",
    "vm_allocate_resident_mb",
    "vm_allocate_dirty_mb",
    "graphics_owned_resident_mb",
    "ioaccelerator_graphics_resident_mb",
    "iosurface_resident_mb",
    "malloc_resident_mb",
]


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def parse_number(value: str) -> Any:
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)
    return value


def run_text(args: list[str], timeout: float = 10.0) -> str:
    result = subprocess.run(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        timeout=timeout,
        check=False,
    )
    return result.stdout


def process_elapsed_seconds(pid: int) -> int | None:
    output = run_text(["ps", "-p", str(pid), "-o", "etime="])
    value = output.strip()
    if not value:
        return None

    days = 0
    if "-" in value:
        day_text, value = value.split("-", 1)
        if not day_text.isdigit():
            return None
        days = int(day_text)

    parts = value.split(":")
    if len(parts) == 2:
        hours = 0
        minutes, seconds = parts
    elif len(parts) == 3:
        hours, minutes, seconds = parts
    else:
        return None

    if not all(part.isdigit() for part in (str(hours), minutes, seconds)):
        return None

    return days * 86400 + int(hours) * 3600 + int(minutes) * 60 + int(seconds)


def discover_mtc_pid() -> int | None:
    for args in (["pgrep", "-x", "MTC"], ["pgrep", "-f", r"/MTC($| )"]):
        if shutil.which(args[0]) is None:
            continue
        output = run_text(args)
        pids = []
        for line in output.splitlines():
            line = line.strip()
            if not line.isdigit():
                continue
            pid = int(line)
            if pid == os.getpid():
                continue
            pids.append(pid)
        if pids:
            # Use the newest process by elapsed runtime. PID order is not reliable
            # after long-running sessions or PID reuse.
            ranked = [
                (elapsed, pid)
                for pid in pids
                if (elapsed := process_elapsed_seconds(pid)) is not None
            ]
            if ranked:
                return min(ranked)[1]
            return max(pids)
    return None


@dataclass
class ProcessStats:
    pid: int
    found: bool
    cpu_pct: float = 0.0
    mem_pct: float = 0.0
    rss_mb: float = 0.0
    vsz_mb: float = 0.0
    stat: str = ""
    etime: str = ""
    command: str = ""


def read_process_stats(pid: int | None) -> ProcessStats:
    if pid is None:
        return ProcessStats(pid=0, found=False)

    output = run_text([
        "ps",
        "-p",
        str(pid),
        "-o",
        "pid=,ppid=,stat=,%cpu=,%mem=,rss=,vsz=,etime=,command=",
    ])
    line = output.strip()
    if not line:
        return ProcessStats(pid=pid, found=False)

    parts = line.split(None, 8)
    if len(parts) < 8:
        return ProcessStats(pid=pid, found=False)

    command = parts[8] if len(parts) >= 9 else ""
    return ProcessStats(
        pid=safe_int(parts[0], pid),
        found=True,
        stat=parts[2],
        cpu_pct=safe_float(parts[3]),
        mem_pct=safe_float(parts[4]),
        rss_mb=safe_float(parts[5]) / 1024.0,
        vsz_mb=safe_float(parts[6]) / 1024.0,
        etime=parts[7],
        command=command,
    )


class PerfTail:
    def __init__(self, path: Path, start_at_end: bool) -> None:
        self.path = path
        self.offset = 0
        if start_at_end and path.exists():
            self.offset = path.stat().st_size

    def read_new_lines(self) -> list[str]:
        if not self.path.exists():
            return []

        size = self.path.stat().st_size
        if size < self.offset:
            self.offset = 0

        with self.path.open("r", encoding="utf-8", errors="replace") as handle:
            handle.seek(self.offset)
            lines = handle.readlines()
            self.offset = handle.tell()
        return lines


def parse_perf_line(line: str) -> dict[str, Any] | None:
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 2:
        return None

    record: dict[str, Any] = {"timestamp": parts[0]}
    for part in parts[1:]:
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        record[key] = parse_number(value)
    return record


def metric(record: dict[str, Any], name: str) -> int:
    return safe_int(record.get(name), 0)


@dataclass
class PerfSummary:
    rows: int = 0
    active_tabs: set[int] = field(default_factory=set)
    inactive_tabs: set[int] = field(default_factory=set)
    active: dict[str, int] = field(default_factory=dict)
    inactive: dict[str, int] = field(default_factory=dict)
    per_tab: dict[int, dict[str, Any]] = field(default_factory=dict)
    max_active_display_chunks: int = 0
    max_active_display_bytes: int = 0
    max_inactive_display_chunks: int = 0
    max_inactive_display_bytes: int = 0
    max_display_drain_flag: int = 0
    max_sessionlog_drain_flag: int = 0
    sessionlog_empty_false_tabs: set[int] = field(default_factory=set)


def add_counter(target: dict[str, int], key: str, value: int) -> None:
    if value:
        target[key] = target.get(key, 0) + value


def summarize_perf(lines: list[str], pid: int | None) -> tuple[PerfSummary, list[dict[str, Any]]]:
    summary = PerfSummary()
    records: list[dict[str, Any]] = []

    for line in lines:
        record = parse_perf_line(line)
        if record is None:
            continue
        if pid is not None and safe_int(record.get("pid")) not in (0, pid):
            continue

        records.append(record)
        summary.rows += 1
        tab_id = safe_int(record.get("tab"), -1)
        active = safe_int(record.get("active")) == 1
        if tab_id >= 0:
            (summary.active_tabs if active else summary.inactive_tabs).add(tab_id)

        bucket = summary.active if active else summary.inactive
        for key, value in record.items():
            if not isinstance(value, int):
                continue
            if key in {"pid", "tab", "active", "elapsed_ms"}:
                continue
            add_counter(bucket, key, value)

        display_chunks = metric(record, "display_chunks")
        display_bytes = metric(record, "display_bytes")
        if active:
            summary.max_active_display_chunks = max(summary.max_active_display_chunks, display_chunks)
            summary.max_active_display_bytes = max(summary.max_active_display_bytes, display_bytes)
        else:
            summary.max_inactive_display_chunks = max(summary.max_inactive_display_chunks, display_chunks)
            summary.max_inactive_display_bytes = max(summary.max_inactive_display_bytes, display_bytes)

        summary.max_display_drain_flag = max(summary.max_display_drain_flag, metric(record, "display_drain"))
        summary.max_sessionlog_drain_flag = max(summary.max_sessionlog_drain_flag, metric(record, "sessionlog_drain"))
        if str(record.get("sessionlog_empty", "1")) == "0" and tab_id >= 0:
            summary.sessionlog_empty_false_tabs.add(tab_id)

        if tab_id >= 0:
            tab = summary.per_tab.setdefault(
                tab_id,
                {
                    "tab": tab_id,
                    "title": record.get("title", ""),
                    "game": record.get("game", ""),
                    "active": active,
                    "rows": 0,
                    "latest_display_chunks": 0,
                    "latest_display_bytes": 0,
                    "counters": {},
                },
            )
            tab["active"] = active
            tab["title"] = record.get("title", tab.get("title", ""))
            tab["game"] = record.get("game", tab.get("game", ""))
            tab["rows"] += 1
            tab["latest_display_chunks"] = display_chunks
            tab["latest_display_bytes"] = display_bytes
            counters = tab["counters"]
            for key, value in record.items():
                if isinstance(value, int) and key not in {"pid", "tab", "active", "elapsed_ms"}:
                    counters[key] = counters.get(key, 0) + value

    return summary, records


def sum_prefix(counters: dict[str, int], prefix: str) -> int:
    return sum(value for key, value in counters.items() if key.startswith(prefix))


def warning_list(
    process: ProcessStats,
    perf: PerfSummary,
    first_rss_mb: float | None,
    previous_rss_mb: float | None,
    cpu_warn: float,
    rss_growth_warn_mb: float,
) -> list[str]:
    warnings: list[str] = []

    if not process.found:
        warnings.append("process-not-found")
        return warnings

    if perf.rows == 0:
        warnings.append("no-new-perf-rows")

    if process.cpu_pct >= cpu_warn:
        warnings.append(f"high-cpu-{process.cpu_pct:.1f}")

    active_render_work = (
        perf.active.get("display.feed.chunks", 0)
        + perf.active.get("display.drain.count", 0)
        + perf.active.get("terminal.redraw.run", 0)
        + perf.active.get("terminal.render", 0)
    )
    if process.cpu_pct >= cpu_warn and active_render_work < 20:
        warnings.append("high-cpu-with-low-active-render")

    inactive_render_work = (
        perf.inactive.get("display.feed.chunks", 0)
        + perf.inactive.get("display.drain.count", 0)
        + perf.inactive.get("terminal.redraw.run", 0)
        + perf.inactive.get("terminal.render", 0)
    )
    if inactive_render_work > 0:
        warnings.append(f"inactive-render-work-{inactive_render_work}")

    inactive_panel_work = (
        perf.inactive.get("panels.info.refresh", 0)
        + perf.inactive.get("status.refresh", 0)
        + perf.inactive.get("menus.rebuild", 0)
    )
    if inactive_panel_work > 0:
        warnings.append(f"inactive-ui-refresh-{inactive_panel_work}")

    if perf.max_inactive_display_bytes > 2_000_000:
        warnings.append(f"inactive-display-backlog-{perf.max_inactive_display_bytes}")

    if previous_rss_mb is not None and process.rss_mb - previous_rss_mb > 128:
        warnings.append(f"rss-jump-{process.rss_mb - previous_rss_mb:.0f}mb")

    if first_rss_mb is not None and process.rss_mb - first_rss_mb > rss_growth_warn_mb:
        warnings.append(f"rss-growth-{process.rss_mb - first_rss_mb:.0f}mb")

    return warnings


def snapshot_row(
    timestamp: str,
    process: ProcessStats,
    perf: PerfSummary,
    first_rss_mb: float | None,
    warnings: list[str],
) -> dict[str, Any]:
    active_ui_runs = sum_prefix(perf.active, "ui.run.")
    active_ui_posts = sum_prefix(perf.active, "ui.post.")
    inactive_ui_runs = sum_prefix(perf.inactive, "ui.run.")
    inactive_ui_posts = sum_prefix(perf.inactive, "ui.post.")
    rss_growth = process.rss_mb - first_rss_mb if first_rss_mb is not None and process.found else 0

    return {
        "time": timestamp,
        "pid": process.pid,
        "process_found": 1 if process.found else 0,
        "cpu_pct": f"{process.cpu_pct:.1f}",
        "mem_pct": f"{process.mem_pct:.1f}",
        "rss_mb": f"{process.rss_mb:.1f}",
        "vsz_mb": f"{process.vsz_mb:.1f}",
        "stat": process.stat,
        "etime": process.etime,
        "perf_rows": perf.rows,
        "active_tabs": " ".join(str(tab) for tab in sorted(perf.active_tabs)),
        "inactive_tabs": " ".join(str(tab) for tab in sorted(perf.inactive_tabs)),
        "active_display_feed_chunks": perf.active.get("display.feed.chunks", 0),
        "active_display_drain_count": perf.active.get("display.drain.count", 0),
        "active_terminal_render": perf.active.get("terminal.render", 0),
        "active_terminal_redraw_run": perf.active.get("terminal.redraw.run", 0),
        "active_panels_info_refresh": perf.active.get("panels.info.refresh", 0),
        "active_state_changed": perf.active.get("state.changed", 0),
        "active_ui_runs": active_ui_runs,
        "active_ui_posts": active_ui_posts,
        "inactive_display_feed_chunks": perf.inactive.get("display.feed.chunks", 0),
        "inactive_display_drain_count": perf.inactive.get("display.drain.count", 0),
        "inactive_terminal_render": perf.inactive.get("terminal.render", 0),
        "inactive_terminal_redraw_run": perf.inactive.get("terminal.redraw.run", 0),
        "inactive_panels_info_refresh": perf.inactive.get("panels.info.refresh", 0),
        "inactive_status_refresh": perf.inactive.get("status.refresh", 0),
        "inactive_ui_runs": inactive_ui_runs,
        "inactive_ui_posts": inactive_ui_posts,
        "max_active_display_chunks": perf.max_active_display_chunks,
        "max_active_display_bytes": perf.max_active_display_bytes,
        "max_inactive_display_chunks": perf.max_inactive_display_chunks,
        "max_inactive_display_bytes": perf.max_inactive_display_bytes,
        "max_display_drain_flag": perf.max_display_drain_flag,
        "max_sessionlog_drain_flag": perf.max_sessionlog_drain_flag,
        "sessionlog_empty_false_tabs": " ".join(str(tab) for tab in sorted(perf.sessionlog_empty_false_tabs)),
        "rss_growth_mb": f"{rss_growth:.1f}",
        "warnings": ",".join(warnings),
    }


def append_csv(path: Path, fieldnames: list[str], row: dict[str, Any]) -> None:
    exists = path.exists()
    with path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        if not exists:
            writer.writeheader()
        writer.writerow(row)


def append_jsonl(path: Path, value: dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(value, sort_keys=True) + "\n")


def write_warning(path: Path, timestamp: str, row: dict[str, Any]) -> None:
    warnings = row.get("warnings", "")
    if not warnings:
        return
    with path.open("a", encoding="utf-8") as handle:
        handle.write(
            f"{timestamp} pid={row['pid']} cpu={row['cpu_pct']} rss={row['rss_mb']} "
            f"warnings={warnings} active_feed={row['active_display_feed_chunks']} "
            f"inactive_feed={row['inactive_display_feed_chunks']} "
            f"inactive_render={row['inactive_terminal_render']} inactive_panels={row['inactive_panels_info_refresh']}\n"
        )


def find_dotnet_counters(explicit: str | None) -> str | None:
    if explicit:
        return explicit if Path(explicit).exists() else None

    candidates = [
        Path.home() / ".dotnet" / "tools" / "dotnet-counters",
        shutil.which("dotnet-counters"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return None


def collect_runtime_counters(
    tool: str,
    pid: int,
    out_dir: Path,
    duration_seconds: int,
) -> Path | None:
    path = out_dir / f"runtime_{pid}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    args = [
        tool,
        "collect",
        "--process-id",
        str(pid),
        "--duration",
        f"00:00:{duration_seconds:02d}",
        "--output",
        str(path),
        "--format",
        "csv",
        "System.Runtime",
    ]
    try:
        result = subprocess.run(
            args,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=duration_seconds + 20,
            check=False,
        )
        if result.returncode == 0 and path.exists():
            return path
    except Exception:
        return None
    return None


def memory_megabytes(value: str) -> float:
    match = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)([KMG]?)", value.strip())
    if match is None:
        return 0.0

    amount = float(match.group(1))
    return amount * {"": 1.0 / 1024.0 / 1024.0, "K": 1.0 / 1024.0, "M": 1.0, "G": 1024.0}[match.group(2)]


def collect_native_memory_summary(pid: int) -> dict[str, Any] | None:
    """Return a compact vmmap summary without retaining the verbose report."""
    if shutil.which("vmmap") is None:
        return None

    try:
        report = run_text(["vmmap", str(pid)], timeout=20.0)
    except Exception:
        return None

    prefixes = {
        "VM_ALLOCATE": "vm_allocate",
        "owned unmapped (graphics)": "graphics_owned",
        "IOAccelerator (graphics)": "ioaccelerator_graphics",
        "IOSurface": "iosurface",
    }
    values = {key: 0.0 for key in prefixes.values()}
    values["malloc"] = 0.0

    for line in report.splitlines():
        for prefix, key in prefixes.items():
            if not line.startswith(prefix):
                continue
            if prefix == "VM_ALLOCATE" and line.startswith("VM_ALLOCATE ("):
                continue
            columns = line[len(prefix):].split()
            if len(columns) >= 3:
                values[key] = memory_megabytes(columns[1])
                if key == "vm_allocate":
                    values["vm_allocate_dirty"] = memory_megabytes(columns[2])
            break
        else:
            if re.match(r"MALLOC_(?:LARGE|SMALL|TINY)\s+", line):
                columns = line.split()
                if len(columns) >= 3:
                    values["malloc"] += memory_megabytes(columns[2])

    return {
        "time": now_iso(),
        "pid": pid,
        "vm_allocate_resident_mb": f"{values['vm_allocate']:.1f}",
        "vm_allocate_dirty_mb": f"{values.get('vm_allocate_dirty', 0.0):.1f}",
        "graphics_owned_resident_mb": f"{values['graphics_owned']:.1f}",
        "ioaccelerator_graphics_resident_mb": f"{values['ioaccelerator_graphics']:.1f}",
        "iosurface_resident_mb": f"{values['iosurface']:.1f}",
        "malloc_resident_mb": f"{values['malloc']:.1f}",
    }


def average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def summarize_runtime_csv(path: Path, pid: int) -> dict[str, Any]:
    values: dict[str, list[float]] = {
        "working_set": [],
        "queue": [],
        "work_items": [],
        "alloc": [],
        "gc_pause": [],
        "lock_contentions": [],
    }
    cpu_by_time: dict[str, float] = {}

    with path.open("r", encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = row.get("Counter Name", "")
            timestamp = row.get("Timestamp", "")
            value = safe_float(row.get("Mean/Increment"))
            if name.startswith("dotnet.process.memory.working_set"):
                values["working_set"].append(value / 1024.0 / 1024.0)
            elif name.startswith("dotnet.thread_pool.queue.length"):
                values["queue"].append(value)
            elif name.startswith("dotnet.thread_pool.work_item.count"):
                values["work_items"].append(value)
            elif name.startswith("dotnet.gc.heap.total_allocated"):
                values["alloc"].append(value / 1024.0 / 1024.0)
            elif name.startswith("dotnet.gc.pause.time"):
                values["gc_pause"].append(value)
            elif name.startswith("dotnet.monitor.lock_contentions"):
                values["lock_contentions"].append(value)
            elif name.startswith("dotnet.process.cpu.time"):
                cpu_by_time[timestamp] = cpu_by_time.get(timestamp, 0.0) + value

    cpu_values = list(cpu_by_time.values())
    return {
        "time": now_iso(),
        "pid": pid,
        "csv": str(path),
        "working_set_mb_last": f"{values['working_set'][-1]:.1f}" if values["working_set"] else "",
        "alloc_mb_s_avg": f"{average(values['alloc']):.1f}",
        "alloc_mb_s_max": f"{max(values['alloc']) if values['alloc'] else 0:.1f}",
        "cpu_time_s_s_avg": f"{average(cpu_values):.3f}",
        "cpu_time_s_s_max": f"{max(cpu_values) if cpu_values else 0:.3f}",
        "queue_len_last": f"{values['queue'][-1]:.0f}" if values["queue"] else "",
        "queue_len_max": f"{max(values['queue']) if values['queue'] else 0:.0f}",
        "work_items_s_avg": f"{average(values['work_items']):.1f}",
        "lock_contentions_s_avg": f"{average(values['lock_contentions']):.1f}",
        "gc_pause_s_s_avg": f"{average(values['gc_pause']):.4f}",
    }


def maybe_sample_process(pid: int, out_dir: Path, seconds: int) -> Path | None:
    if shutil.which("sample") is None:
        return None
    path = out_dir / f"sample_{pid}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    try:
        subprocess.run(
            ["sample", str(pid), str(seconds), "-file", str(path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=seconds + 15,
            check=False,
        )
        return path if path.exists() else None
    except Exception:
        return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Monitor MTC process stats against mtc_perf.log.")
    parser.add_argument("--pid", type=int, help="Specific MTC PID to monitor. Defaults to newest MTC process.")
    parser.add_argument("--perf-log", type=Path, default=DEFAULT_PERF_LOG, help=f"Perf log path. Default: {DEFAULT_PERF_LOG}")
    parser.add_argument("--out-dir", type=Path, help="Output directory. Default: ~/twx/logs/mtc_perf_watch_<timestamp>")
    parser.add_argument("--interval", type=int, default=60, help="Seconds between snapshots. Default: 60")
    parser.add_argument("--duration-hours", type=float, default=8.0, help="How long to run. Default: 8")
    parser.add_argument("--include-existing-perf", action="store_true", help="Start reading mtc_perf.log from the beginning.")
    parser.add_argument("--runtime-counters-every", type=int, default=0, help="Collect dotnet-counters every N minutes. Default: disabled")
    parser.add_argument("--runtime-counters-duration", type=int, default=10, help="dotnet-counters collection seconds. Default: 10")
    parser.add_argument("--dotnet-counters", help="Path to dotnet-counters. Default: ~/.dotnet/tools/dotnet-counters or PATH")
    parser.add_argument("--native-memory-every", type=int, default=0, help="Write a compact vmmap summary every N minutes. Default: disabled")
    parser.add_argument("--cpu-warn", type=float, default=75.0, help="CPU percent warning threshold. Default: 75")
    parser.add_argument("--rss-growth-warn-mb", type=float, default=512.0, help="RSS growth warning threshold. Default: 512 MB")
    parser.add_argument("--sample-on-warning", action="store_true", help="Run macOS sample(1) when severe warnings repeat.")
    parser.add_argument("--sample-seconds", type=int, default=5, help="sample(1) duration. Default: 5")
    parser.add_argument("--once", action="store_true", help="Take one snapshot and exit.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = args.out_dir or (DEFAULT_LOG_DIR / f"mtc_perf_watch_{timestamp}")
    out_dir.mkdir(parents=True, exist_ok=True)

    snapshot_csv = out_dir / "snapshots.csv"
    details_jsonl = out_dir / "details.jsonl"
    warnings_log = out_dir / "warnings.log"
    runtime_csv = out_dir / "runtime_summary.csv"
    native_memory_csv = out_dir / "native_memory.csv"
    monitor_log = out_dir / "monitor.log"

    perf_tail = PerfTail(args.perf_log, start_at_end=not args.include_existing_perf)
    dotnet_counters = find_dotnet_counters(args.dotnet_counters)
    runtime_every_seconds = args.runtime_counters_every * 60
    next_runtime_at = time.monotonic() + runtime_every_seconds if runtime_every_seconds > 0 else float("inf")
    native_memory_every_seconds = args.native_memory_every * 60
    next_native_memory_at = time.monotonic() + native_memory_every_seconds if native_memory_every_seconds > 0 else float("inf")
    next_sample_allowed_at = 0.0
    ending_at = datetime.now() + timedelta(hours=args.duration_hours)
    fixed_pid = args.pid
    current_pid = fixed_pid or discover_mtc_pid()
    first_rss_mb: float | None = None
    previous_rss_mb: float | None = None
    stop = False

    def request_stop(_signum: int, _frame: Any) -> None:
        nonlocal stop
        stop = True

    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)

    with monitor_log.open("a", encoding="utf-8") as handle:
        handle.write(f"{now_iso()} start pid={current_pid or ''} perf_log={args.perf_log} out_dir={out_dir}\n")
        if runtime_every_seconds > 0:
            handle.write(f"{now_iso()} dotnet_counters={dotnet_counters or 'not-found'} every={args.runtime_counters_every}m\n")
        if native_memory_every_seconds > 0:
            handle.write(f"{now_iso()} native_memory=vmmap-summary every={args.native_memory_every}m\n")

    while not stop:
        started = time.monotonic()
        if fixed_pid is None:
            stats = read_process_stats(current_pid)
            if not stats.found:
                current_pid = discover_mtc_pid()
        stats = read_process_stats(current_pid)

        if stats.found and first_rss_mb is None:
            first_rss_mb = stats.rss_mb

        new_perf_lines = perf_tail.read_new_lines()
        perf_summary, perf_records = summarize_perf(new_perf_lines, stats.pid if stats.found else current_pid)
        timestamp_str = now_iso()
        warnings = warning_list(
            stats,
            perf_summary,
            first_rss_mb,
            previous_rss_mb,
            args.cpu_warn,
            args.rss_growth_warn_mb,
        )
        row = snapshot_row(timestamp_str, stats, perf_summary, first_rss_mb, warnings)
        append_csv(snapshot_csv, SNAPSHOT_FIELDS, row)
        append_jsonl(
            details_jsonl,
            {
                "time": timestamp_str,
                "process": stats.__dict__,
                "warnings": warnings,
                "perf": {
                    "rows": perf_summary.rows,
                    "active_tabs": sorted(perf_summary.active_tabs),
                    "inactive_tabs": sorted(perf_summary.inactive_tabs),
                    "active": perf_summary.active,
                    "inactive": perf_summary.inactive,
                    "per_tab": perf_summary.per_tab,
                    "records": perf_records[-20:],
                },
            },
        )
        write_warning(warnings_log, timestamp_str, row)
        if stats.found:
            previous_rss_mb = stats.rss_mb

        severe_warning = any(
            item.startswith("high-cpu") or item.startswith("inactive-render") or item.startswith("rss-growth")
            for item in warnings
        )
        if args.sample_on_warning and severe_warning and stats.found and time.monotonic() >= next_sample_allowed_at:
            sample_path = maybe_sample_process(stats.pid, out_dir, args.sample_seconds)
            with monitor_log.open("a", encoding="utf-8") as handle:
                handle.write(f"{timestamp_str} sample_on_warning={sample_path or 'failed'} warnings={','.join(warnings)}\n")
            next_sample_allowed_at = time.monotonic() + 15 * 60

        if runtime_every_seconds > 0 and stats.found and time.monotonic() >= next_runtime_at:
            if dotnet_counters:
                runtime_path = collect_runtime_counters(
                    dotnet_counters,
                    stats.pid,
                    out_dir,
                    max(1, args.runtime_counters_duration),
                )
                if runtime_path:
                    runtime_row = summarize_runtime_csv(runtime_path, stats.pid)
                    append_csv(runtime_csv, RUNTIME_FIELDS, runtime_row)
                    with monitor_log.open("a", encoding="utf-8") as handle:
                        handle.write(
                            f"{runtime_row['time']} runtime pid={stats.pid} "
                            f"cpu_s_s_avg={runtime_row['cpu_time_s_s_avg']} "
                            f"alloc_mb_s_avg={runtime_row['alloc_mb_s_avg']} "
                            f"queue_max={runtime_row['queue_len_max']} csv={runtime_path}\n"
                        )
                else:
                    with monitor_log.open("a", encoding="utf-8") as handle:
                        handle.write(f"{now_iso()} runtime collection failed pid={stats.pid}\n")
            next_runtime_at = time.monotonic() + runtime_every_seconds

        if native_memory_every_seconds > 0 and stats.found and time.monotonic() >= next_native_memory_at:
            native_memory_row = collect_native_memory_summary(stats.pid)
            if native_memory_row:
                append_csv(native_memory_csv, NATIVE_MEMORY_FIELDS, native_memory_row)
                with monitor_log.open("a", encoding="utf-8") as handle:
                    handle.write(
                        f"{native_memory_row['time']} native_memory pid={stats.pid} "
                        f"vm_allocate_resident_mb={native_memory_row['vm_allocate_resident_mb']} "
                        f"graphics_owned_resident_mb={native_memory_row['graphics_owned_resident_mb']}\n"
                    )
            else:
                with monitor_log.open("a", encoding="utf-8") as handle:
                    handle.write(f"{now_iso()} native_memory collection failed pid={stats.pid}\n")
            next_native_memory_at = time.monotonic() + native_memory_every_seconds

        if args.once or datetime.now() >= ending_at:
            break

        sleep_for = max(1.0, args.interval - (time.monotonic() - started))
        time.sleep(sleep_for)

    with monitor_log.open("a", encoding="utf-8") as handle:
        handle.write(f"{now_iso()} stop\n")

    print(out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
