from __future__ import annotations

import os
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def _normalized(path: str | Path) -> Path:
    return Path(path).expanduser().resolve()


def app_data_dir() -> Path:
    home = Path.home()
    if sys.platform == "darwin":
        return home / "Library" / "twxproxy"
    if os.name == "nt":
        local = os.environ.get("LOCALAPPDATA")
        return _normalized(local) / "twxproxy" if local else home / "AppData" / "Local" / "twxproxy"
    xdg = os.environ.get("XDG_DATA_HOME")
    return _normalized(xdg) / "twxproxy" if xdg else home / ".local" / "share" / "twxproxy"


def install_root() -> Path:
    override = os.environ.get("TWXDB_INSTALL_ROOT")
    if override:
        return _normalized(override)
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]


def _windows_program_dir() -> Path | None:
    if os.name != "nt":
        return None
    try:
        import winreg

        access_modes = [winreg.KEY_READ]
        if hasattr(winreg, "KEY_WOW64_64KEY"):
            access_modes = [
                winreg.KEY_READ | winreg.KEY_WOW64_64KEY,
                winreg.KEY_READ | winreg.KEY_WOW64_32KEY,
                winreg.KEY_READ,
            ]
        for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
            for access in access_modes:
                try:
                    with winreg.OpenKey(hive, r"Software\TWXProxy\TWX30", 0, access) as key:
                        value, _ = winreg.QueryValueEx(key, "ProgramDir")
                    if value:
                        return _normalized(value)
                except OSError:
                    continue
    except (ImportError, OSError):
        pass
    return None


def _locator_program_dir() -> Path | None:
    locator = app_data_dir() / "programdir.txt"
    try:
        value = locator.read_text(encoding="utf-8-sig").strip()
        return _normalized(value) if value else None
    except (OSError, ValueError):
        return None


def _configured_program_dir(candidate: Path) -> Path:
    config = candidate / "config.twx"
    try:
        root = ET.parse(config).getroot()
        value = root.findtext("./SharedPaths/ProgramDirectory", "").strip()
        return _normalized(value) if value else candidate
    except (OSError, ET.ParseError, ValueError):
        return candidate


def _program_dir_from_install() -> Path | None:
    root = install_root()
    if root.name.lower() != "twxdb-assistant" or root.parent.name.lower() != "tools":
        return None
    return root.parent.parent


def resolve_program_dir() -> Path:
    for variable in ("TWX30_PROGRAMDIR", "TWX_PROGRAM_DIR"):
        value = os.environ.get(variable)
        if value:
            return _configured_program_dir(_normalized(value))

    candidate = _windows_program_dir() or _locator_program_dir() or _program_dir_from_install()
    if candidate is None:
        candidate = Path("C:/twxproxy") if os.name == "nt" else Path.home() / "twxproxy"
    return _configured_program_dir(candidate)


def resolve_games_dir() -> Path:
    override = os.environ.get("TWX_GAMES_DIR")
    return _normalized(override) if override else resolve_program_dir() / "games"


def resolve_list_dir() -> Path:
    override = os.environ.get("TWX_LIST_DIR")
    return _normalized(override) if override else resolve_program_dir()


def resolve_query_helper() -> Path:
    override = os.environ.get("TWXDB_QUERY_HELPER")
    if override:
        return _normalized(override)

    bundled = Path(__file__).with_name("twxdb_query.py")
    if bundled.is_file():
        return bundled

    development = Path(__file__).resolve().parents[2] / "Source" / "Tools" / "twxdb-query.py"
    return development


def resolve_model() -> Path:
    override = os.environ.get("TWXDB_MODEL")
    if override:
        return _normalized(override)

    bundled = install_root() / "model" / "twxdb-assistant-q4_k_m.gguf"
    if bundled.is_file():
        return bundled
    return Path(__file__).resolve().parents[1] / "artifacts" / "twxdb-assistant-q4_k_m.gguf"


def resolve_llama_server() -> Path:
    override = os.environ.get("TWXDB_LLAMA_SERVER")
    if override:
        return _normalized(override)

    executable = "llama-server.exe" if os.name == "nt" else "llama-server"
    bundled = install_root() / "runtime" / "llama" / executable
    if bundled.is_file():
        return bundled

    discovered = shutil.which(executable)
    if discovered:
        return _normalized(discovered)
    raise FileNotFoundError(
        "llama-server was not found in the TWXDB Assistant runtime or PATH; "
        "set TWXDB_LLAMA_SERVER to override it"
    )
