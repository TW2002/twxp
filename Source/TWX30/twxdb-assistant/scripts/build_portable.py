#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import stat
import sys
import tarfile
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path


PYTHON_RELEASE = "20260901"
PYTHON_VERSION = "3.12.14"
LLAMA_RELEASE = "b10090"
MODEL_NAME = "twxdb-assistant-q4_k_m.gguf"
MODEL_SHA256 = "a9617279d0b7a4700e9fe2d416151e8c67f9ff9064671eded9127ce4d3872600"

RUNTIMES = {
    "osx-arm64": {
        "python": (
            "cpython-3.12.14+20260901-aarch64-apple-darwin-install_only_stripped.tar.gz",
            "81a359f1cfadd4da11766534c5913791cea55f26e1bb902cacd2a531bb1e4b2b",
        ),
        "llama": (
            "llama-b10090-bin-macos-arm64.tar.gz",
            "46ae2b232c0cd75b9cb3cf26c06f3e01524f1c62038603d71ee2250a2c504b3f",
        ),
        "windows": False,
    },
    "osx-x64": {
        "python": (
            "cpython-3.12.14+20260901-x86_64-apple-darwin-install_only_stripped.tar.gz",
            "65b195c9cedc1fef6767f044f9822069adbd1bd9204d424ece4628776fdc04bb",
        ),
        "llama": (
            "llama-b10090-bin-macos-x64.tar.gz",
            "e13982d57894e2faddd52da55add8fbd63810b037763fee7d8ee287e9ca8b279",
        ),
        "windows": False,
    },
    "linux-x64": {
        "python": (
            "cpython-3.12.14+20260901-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz",
            "72748da13197c1fb161e3afeef20a6a385ff24f2165e6e2758e47008e7faba4c",
        ),
        "llama": (
            "llama-b10090-bin-ubuntu-x64.tar.gz",
            "07368c47ab8202002390a8550c699615574e2d6015549493a4c635e336f87675",
        ),
        "windows": False,
    },
    "win-arm64": {
        "python": (
            "cpython-3.12.14+20260901-aarch64-pc-windows-msvc-install_only_stripped.tar.gz",
            "72f4713d056a17961bdba7b43be82a878035040fa1eee30cfd5e43b91a2852d9",
        ),
        "llama": (
            "llama-b10090-bin-win-cpu-arm64.zip",
            "b839c2c408f43078cc626e390b7efaff188992a0090b6e2d32a5f1d7abe62291",
        ),
        "windows": True,
    },
    "win-x64": {
        "python": (
            "cpython-3.12.14+20260901-x86_64-pc-windows-msvc-install_only_stripped.tar.gz",
            "7c45c9622400d578709a9b2cddbe8124cc21d382409d9f13406d706d28e31b14",
        ),
        "llama": (
            "llama-b10090-bin-win-cpu-x64.zip",
            "def4bbe62d8b602788c411f40536877d5ae622ed393b98633a568f66dfc855b1",
        ),
        "windows": True,
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(url: str, destination: Path, expected: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_file() and sha256(destination) == expected:
        print(f"Using cached {destination.name}")
        return
    temporary = destination.with_suffix(destination.suffix + ".part")
    temporary.unlink(missing_ok=True)
    print(f"Downloading {url}")
    with urllib.request.urlopen(url) as response, temporary.open("wb") as output:
        shutil.copyfileobj(response, output)
    actual = sha256(temporary)
    if actual != expected:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Checksum mismatch for {destination.name}: {actual} != {expected}")
    temporary.replace(destination)


def _safe_destination(root: Path, member: str) -> Path:
    destination = (root / member).resolve()
    root = root.resolve()
    if destination != root and root not in destination.parents:
        raise RuntimeError(f"Archive path escapes destination: {member}")
    return destination


def extract_archive(archive: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    if archive.name.endswith(".zip"):
        with zipfile.ZipFile(archive) as bundle:
            for member in bundle.infolist():
                _safe_destination(destination, member.filename)
            bundle.extractall(destination)
        return
    with tarfile.open(archive, "r:*") as bundle:
        members = [
            member for member in bundle.getmembers()
            if not member.name.startswith("python/share/terminfo/")
        ]
        for member in members:
            _safe_destination(destination, member.name)
        try:
            bundle.extractall(destination, members=members, filter="fully_trusted")
        except TypeError:
            bundle.extractall(destination, members=members)


def copy_app(project_root: Path, output: Path) -> None:
    app_dir = output / "app"
    package_dir = app_dir / "twxdb_assistant"
    shutil.copytree(
        project_root / "twxdb_assistant",
        package_dir,
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
    )
    shutil.copy2(project_root / "scripts" / "twxdb-mcp.py", app_dir / "twxdb-mcp.py")
    shutil.copy2(project_root.parent / "Source" / "Tools" / "twxdb-query.py", package_dir / "twxdb_query.py")


def copy_llama_runtime(extracted: Path, output: Path, windows: bool) -> None:
    destination = output / "runtime" / "llama"
    destination.mkdir(parents=True)
    server_name = "llama-server.exe" if windows else "llama-server"
    servers = list(extracted.rglob(server_name))
    if len(servers) != 1:
        raise RuntimeError(f"Expected one {server_name} in llama.cpp archive, found {len(servers)}")
    source_dir = servers[0].parent
    names = {server_name}
    for candidate in source_dir.iterdir():
        lower = candidate.name.lower()
        if lower.endswith((".dll", ".dylib", ".so")) or ".so." in lower:
            names.add(candidate.name)
    for name in sorted(names):
        source = source_dir / name
        target = destination / name
        if source.is_symlink():
            target.symlink_to(os.readlink(source))
        elif source.is_file():
            shutil.copy2(source, target)
    if not windows:
        (destination / server_name).chmod((destination / server_name).stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def write_launchers(output: Path, windows: bool) -> None:
    if windows:
        (output / "twxdb-mcp.cmd").write_text(
            "@echo off\r\n"
            "set \"TWXDB_INSTALL_ROOT=%~dp0\"\r\n"
            "\"%~dp0runtime\\python\\python.exe\" \"%~dp0app\\twxdb-mcp.py\" %*\r\n",
            encoding="ascii",
        )
        (output / "twxdb-mcp-http.vbs").write_text(
            "Option Explicit\r\n"
            "Dim shell, fso, root, python, script, command\r\n"
            "Set shell = CreateObject(\"WScript.Shell\")\r\n"
            "Set fso = CreateObject(\"Scripting.FileSystemObject\")\r\n"
            "root = fso.GetParentFolderName(WScript.ScriptFullName)\r\n"
            "python = fso.BuildPath(root, \"runtime\\python\\pythonw.exe\")\r\n"
            "If Not fso.FileExists(python) Then python = fso.BuildPath(root, \"runtime\\python\\python.exe\")\r\n"
            "script = fso.BuildPath(root, \"app\\twxdb-mcp.py\")\r\n"
            "command = Chr(34) & python & Chr(34) & \" \" & Chr(34) & script & Chr(34) & \" --http\"\r\n"
            "shell.Run command, 0, False\r\n",
            encoding="ascii",
        )
        return
    launcher = output / "twxdb-mcp"
    launcher.write_text(
        "#!/bin/sh\n"
        "set -eu\n"
        "ROOT=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)\n"
        "export TWXDB_INSTALL_ROOT=\"$ROOT\"\n"
        "exec \"$ROOT/runtime/python/bin/python3\" \"$ROOT/app/twxdb-mcp.py\" \"$@\"\n",
        encoding="ascii",
    )
    launcher.chmod(0o755)


def write_manifest(output: Path, rid: str) -> None:
    files = {}
    paths: list[Path] = []
    for root, directories, names in os.walk(output, followlinks=False):
        root_path = Path(root)
        paths.extend(root_path / name for name in directories if (root_path / name).is_symlink())
        paths.extend(root_path / name for name in names)
    for path in sorted(paths):
        relative = str(path.relative_to(output))
        if path.is_symlink():
            files[relative] = {"symlink": os.readlink(path)}
        elif path.name != "manifest.json":
            files[relative] = {"sha256": sha256(path), "size": path.stat().st_size}
    manifest = {
        "format": 1,
        "component": "TWXDB Assistant",
        "rid": rid,
        "python": {"version": PYTHON_VERSION, "release": PYTHON_RELEASE},
        "llama_cpp": {"release": LLAMA_RELEASE},
        "model": {"file": f"model/{MODEL_NAME}", "sha256": MODEL_SHA256},
        "files": files,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def build(args: argparse.Namespace) -> Path:
    project_root = Path(__file__).resolve().parents[1]
    repo_root = project_root.parent
    runtime = RUNTIMES[args.rid]
    output = Path(args.output).expanduser().resolve() if args.output else repo_root / "bin" / args.rid / "twxdb-assistant"
    cache = Path(args.cache_dir).expanduser().resolve()
    model = Path(args.model).expanduser().resolve() if args.model else project_root / "artifacts" / MODEL_NAME

    if not model.is_file():
        raise RuntimeError(f"Planner model not found: {model}; pass --model or set TWXDB_MODEL_SOURCE")
    actual_model_hash = sha256(model)
    if actual_model_hash != MODEL_SHA256:
        raise RuntimeError(f"Planner model checksum mismatch: {actual_model_hash} != {MODEL_SHA256}")

    python_name, python_hash = runtime["python"]
    llama_name, llama_hash = runtime["llama"]
    python_url = (
        "https://github.com/astral-sh/python-build-standalone/releases/download/"
        f"{PYTHON_RELEASE}/{urllib.parse.quote(python_name)}"
    )
    llama_url = f"https://github.com/ggml-org/llama.cpp/releases/download/{LLAMA_RELEASE}/{llama_name}"
    python_archive = cache / python_name
    llama_archive = cache / llama_name
    download(python_url, python_archive, python_hash)
    download(llama_url, llama_archive, llama_hash)

    temporary = Path(tempfile.mkdtemp(prefix=f"twxdb-assistant-{args.rid}-"))
    try:
        payload = temporary / "payload"
        payload.mkdir()
        copy_app(project_root, payload)
        (payload / "model").mkdir()
        shutil.copy2(model, payload / "model" / MODEL_NAME)
        shutil.copy2(project_root / "artifacts" / "MODEL_CARD.md", payload / "MODEL_CARD.md")
        shutil.copy2(project_root / "THIRD_PARTY_NOTICES.md", payload / "THIRD_PARTY_NOTICES.md")
        shutil.copy2(project_root / "README.md", payload / "README.md")

        extract_archive(python_archive, payload / "runtime")
        python_executable = payload / "runtime" / "python" / ("python.exe" if runtime["windows"] else "bin/python3")
        if not python_executable.is_file():
            raise RuntimeError(f"Python runtime did not contain {python_executable.relative_to(payload)}")

        llama_extract = temporary / "llama"
        extract_archive(llama_archive, llama_extract)
        copy_llama_runtime(llama_extract, payload, bool(runtime["windows"]))
        write_launchers(payload, bool(runtime["windows"]))
        write_manifest(payload, args.rid)

        if output.exists():
            shutil.rmtree(output)
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(payload), str(output))
    finally:
        shutil.rmtree(temporary, ignore_errors=True)
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a self-contained TWXDB Assistant payload")
    parser.add_argument("--rid", choices=sorted(RUNTIMES), required=True)
    parser.add_argument("--output", help="output directory; defaults to bin/<rid>/twxdb-assistant")
    parser.add_argument(
        "--cache-dir",
        default=os.environ.get("TWXDB_BUILD_CACHE", "~/.cache/twx30/twxdb-assistant"),
        help="verified runtime download cache",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("TWXDB_MODEL_SOURCE"),
        help="Q4 planner GGUF; defaults to artifacts/twxdb-assistant-q4_k_m.gguf",
    )
    return parser.parse_args()


def main() -> int:
    try:
        output = build(parse_args())
    except (OSError, RuntimeError, urllib.error.URLError) as exc:
        print(f"build_portable.py: {exc}", file=sys.stderr)
        return 1
    print(f"Built TWXDB Assistant payload: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
