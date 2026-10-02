#!/usr/bin/env python3
"""Query TWX30 .xdb game databases for script/debugging work.

This intentionally mirrors the TWX30 Core Database.cs binary layout instead of
scraping logs. It is meant for quick, repeatable answers to questions like
"how many ports match this script's criteria?" or "what is FIGSEC in sector X?"
"""

from __future__ import annotations

import argparse
import json
import os
import struct
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any



def resolve_program_dir() -> Path:
    override = os.environ.get("TWX30_PROGRAMDIR") or os.environ.get("TWX_PROGRAM_DIR")
    if override:
        candidate = Path(override).expanduser()
    elif os.name == "nt":
        candidate = _windows_program_dir() or Path("C:/twxproxy")
    else:
        if sys.platform == "darwin":
            locator = Path.home() / "Library" / "twxproxy" / "programdir.txt"
        else:
            data_home = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
            locator = data_home / "twxproxy" / "programdir.txt"
        try:
            stored = locator.read_text(encoding="utf-8-sig").strip()
        except OSError:
            stored = ""
        candidate = Path(stored).expanduser() if stored else Path.home() / "twxproxy"

    candidate = candidate.resolve()
    try:
        root = ET.parse(candidate / "config.twx").getroot()
        configured = root.findtext("./SharedPaths/ProgramDirectory", "").strip()
        return Path(configured).expanduser().resolve() if configured else candidate
    except (OSError, ET.ParseError):
        return candidate


def _windows_program_dir() -> Path | None:
    try:
        import winreg

        for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
            try:
                with winreg.OpenKey(hive, r"Software\TWXProxy\TWX30") as key:
                    value, _ = winreg.QueryValueEx(key, "ProgramDir")
                if value:
                    return Path(value).expanduser()
            except OSError:
                continue
    except (ImportError, OSError):
        pass
    return None


DEFAULT_GAMES_DIR = Path(os.environ.get("TWX_GAMES_DIR", resolve_program_dir() / "games")).expanduser()

PRODUCTS = {
    "fuel": 0,
    "ore": 0,
    "fuelore": 0,
    "org": 1,
    "organics": 1,
    "equ": 2,
    "equip": 2,
    "equipment": 2,
}

PRODUCT_NAMES = ("fuel", "org", "equ")
QUERY_ENTITIES = (
    "header",
    "sectors",
    "ports",
    "planets",
    "fighters",
    "mines",
    "deadends",
    "ships",
    "traders",
    "users",
    "players",
    "vars",
)
FRIENDLY_FIGHTER_OWNERS = {"yours", "belong to your Corp"}
FIGTYPE_NAMES = {
    0: "offensive",
    1: "defensive",
    2: "toll",
}


class XdbReader:
    def __init__(self, data: bytes) -> None:
        self.data = data
        self.pos = 0

    def read_7bit_int(self) -> int:
        value = 0
        for index in range(5):
            byte = self.read_u8()
            if index == 4 and byte > 7:
                raise ValueError("Invalid 7-bit encoded string length in XDB")
            value |= (byte & 0x7f) << (index * 7)
            if not byte & 0x80:return value
        raise ValueError("Invalid 7-bit encoded string length in XDB")

    def read_string(self) -> str:
        length = self.read_7bit_int()
        if length > len(self.data)-self.pos:raise EOFError("Truncated XDB string")
        raw = self.data[self.pos:self.pos+length]
        self.pos += length
        return raw.decode("utf-8", errors="strict")

    def read_count(self) -> int:
        count=self.read_i32()
        if count < 0 or count > len(self.data)-self.pos:raise ValueError("Invalid record/list count in XDB")
        return count

    def read_bool(self) -> bool:
        return bool(self.read_struct("<?"))

    def read_u8(self) -> int:
        return int(self.read_struct("<B"))

    def read_u16(self) -> int:
        return int(self.read_struct("<H"))

    def read_warp(self, version: int) -> int:
        return self.read_i32() if version >= 16 else self.read_u16()

    def read_i32(self) -> int:
        return int(self.read_struct("<i"))

    def read_i64(self) -> int:
        return int(self.read_struct("<q"))

    def read_char(self) -> str:
        first = self.read_u8()
        size = 1 if first < 128 else 2 if 0xc2 <= first <= 0xdf else 3 if 0xe0 <= first <= 0xef else 4 if 0xf0 <= first <= 0xf4 else 0
        if not size:raise ValueError("Invalid UTF-8 character in XDB header")
        return bytes([first]+[self.read_u8() for _ in range(size-1)]).decode('utf-8')

    def read_struct(self, fmt: str) -> Any:
        size = struct.calcsize(fmt)
        if self.pos + size > len(self.data):
            raise EOFError("Unexpected end of XDB")
        value = struct.unpack_from(fmt, self.data, self.pos)[0]
        self.pos += size
        return value


def truthy(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, (dict, list, set, tuple)):
        return len(value) > 0
    text = str(value).strip().lower()
    if text in {"", "0", "false", "no", "n", "none", "null"}:
        return False
    return True


def product_index(name: str | None) -> int | None:
    if name is None:
        return None
    key = name.lower()
    if key not in PRODUCTS:
        raise SystemExit(f"Unknown product '{name}'")
    return PRODUCTS[key]


def product_display(index: int) -> str:
    return PRODUCT_NAMES[index]


def field_key(name: str) -> str:
    return name.replace("_", "").replace("-", "").lower()


def get_var(sector: dict[str, Any], name: str) -> str:
    expected = name.lower()
    for key, value in sector["vars"].items():
        if key.lower() == expected:
            return value
    return ""


def port_type(port: dict[str, Any] | None) -> str:
    if port is None:
        return "---"
    return "".join("B" if port["buy"][idx] else "S" for idx in range(3))


def figtype_name(value: Any) -> str:
    try:
        return FIGTYPE_NAMES.get(int(value), str(value))
    except (TypeError, ValueError):
        return str(value)


def is_friendly_owner(owner: Any) -> bool:
    return str(owner or "").strip() in FRIENDLY_FIGHTER_OWNERS


def read_space_object(reader: XdbReader) -> dict[str, Any]:
    return {
        "qty": reader.read_i32(),
        "owner": reader.read_string(),
        "figtype": reader.read_u8(),
    }


def read_port(reader: XdbReader) -> dict[str, Any]:
    port = {
        "name": reader.read_string(),
        "dead": reader.read_bool(),
        "build": reader.read_u8(),
        "class": reader.read_u8(),
        "buy": [],
        "pct": [],
        "amount": [],
        "updated_ticks": 0,
    }
    for _ in range(3):
        port["buy"].append(reader.read_bool())
        port["pct"].append(reader.read_u8())
        port["amount"].append(reader.read_u16())
    port["updated_ticks"] = reader.read_i64()
    return port


def read_ship(reader: XdbReader) -> dict[str, Any]:
    return {
        "name": reader.read_string(),
        "owner": reader.read_string(),
        "type": reader.read_string(),
        "fighters": reader.read_i32(),
    }


def read_trader(reader: XdbReader, version: int = 0) -> dict[str, Any]:
    trader = {
        "name": reader.read_string(),
        "type": reader.read_string(),
        "ship": reader.read_string(),
        "fighters": reader.read_i32(),
    }
    trader["display_label"] = ""
    if version >= 15:
        trader["display_label"] = reader.read_string()
    return trader


def read_header(reader: XdbReader) -> dict[str, Any]:
    header = {
        "program": reader.read_string(),
        "version": reader.read_u8(),
        "sectors": reader.read_i32(),
        "stardock": reader.read_u16(),
        "alpha_centauri": reader.read_u16(),
        "rylos": reader.read_u16(),
        "address": reader.read_string(),
        "description": reader.read_string(),
        "server_port": reader.read_u16(),
        "listen_port": reader.read_u16(),
        "login_script": reader.read_string(),
        "password": reader.read_string(),
        "login_name": reader.read_string(),
        "game": reader.read_char(),
        "icon_file": reader.read_string(),
        "use_rlogin": reader.read_bool(),
        "use_login": reader.read_bool(),
        "rob_factor": reader.read_u8(),
        "steal_factor": reader.read_u8(),
        "last_port_cim_ticks": reader.read_i64(),
        "command_char": "",
        "opentw_universe_id": "",
        "opentw_topology_hash": "",
        "opentw_topology_synced_ticks": 0,
    }
    if header["version"] >= 11:
        header["command_char"] = reader.read_char()
    if header["version"] >= 17:
        header["opentw_universe_id"] = reader.read_string()
        header["opentw_topology_hash"] = reader.read_string()
        header["opentw_topology_synced_ticks"] = reader.read_i64()
    return header


def read_sector(reader: XdbReader, version: int = 0) -> dict[str, Any]:
    sector = {
        "number": reader.read_i32(),
        "warps": [reader.read_warp(version) for _ in range(6)],
        "port": None,
        "navhaz": 0,
        "fighters": {},
        "armids": {},
        "limpets": {},
        "constellation": "",
        "beacon": "",
        "updated_ticks": 0,
        "anomaly": False,
        "density": 0,
        "warp_count": 0,
        "explored": 0,
        "ships": [],
        "traders": [],
        "planet_names": [],
        "vars": {},
        "warps_in": [],
    }
    if reader.read_bool():
        sector["port"] = read_port(reader)
    sector["navhaz"] = reader.read_u8()
    sector["fighters"] = read_space_object(reader)
    sector["armids"] = read_space_object(reader)
    sector["limpets"] = read_space_object(reader)
    sector["constellation"] = reader.read_string()
    sector["beacon"] = reader.read_string()
    sector["updated_ticks"] = reader.read_i64()
    sector["anomaly"] = reader.read_bool()
    sector["density"] = reader.read_i32()
    sector["warp_count"] = reader.read_u8()
    sector["explored"] = reader.read_u8()
    sector["ships"] = [read_ship(reader) for _ in range(reader.read_count())]
    sector["traders"] = [read_trader(reader, version) for _ in range(reader.read_count())]
    sector["planet_names"] = [reader.read_string() for _ in range(reader.read_count())]
    sector["vars"] = {
        reader.read_string(): reader.read_string() for _ in range(reader.read_count())
    }
    sector["warps_in"] = [
        reader.read_warp(version) for _ in range(reader.read_count())
    ]
    sector["warps"] = [warp for warp in sector["warps"] if warp > 0]
    return sector


def read_planet(reader: XdbReader, version: int) -> dict[str, Any]:
    planet_id = reader.read_i32()
    name = reader.read_string()
    last_sector = reader.read_i32()
    observed_order = reader.read_i32()
    owner = reader.read_string()
    level = reader.read_i32()
    has_shielded = reader.read_bool()
    shielded = reader.read_bool()
    planet = {
        "id": planet_id,
        "name": name,
        "last_sector": last_sector,
        "observed_order": observed_order,
        "owner": owner,
        "level": level,
        "shielded": shielded if has_shielded else None,
        "fighters": reader.read_i32(),
        "fuel": reader.read_i32(),
        "org": reader.read_i32(),
        "equ": reader.read_i32(),
        "fuel_colonists": -1,
        "org_colonists": -1,
        "equ_colonists": -1,
        "construction_known": False,
        "construction_type": "",
        "construction_days": -1,
        "construction_underway": False,
    }
    if version >= 18:
        planet["construction_known"] = reader.read_bool()
        planet["construction_type"] = reader.read_string()
        planet["construction_days"] = reader.read_i32()
        planet["construction_underway"] = (
            planet["construction_known"]
            and bool(planet["construction_type"])
            and planet["construction_days"] >= 0
        )
    if version >= 19:
        planet["fuel_colonists"] = reader.read_i32()
        planet["org_colonists"] = reader.read_i32()
        planet["equ_colonists"] = reader.read_i32()
    return planet


def linked_neighbors(sector: dict[str, Any]) -> list[int]:
    neighbors: list[int] = []
    for warp in sector["warps"]:
        if warp > 0 and warp not in neighbors:
            neighbors.append(warp)
    for warp in sector["warps_in"]:
        if warp > 0 and warp not in neighbors:
            neighbors.append(warp)
    return neighbors


def try_build_deadend(
    terminal_sector: int,
    neighbor_index: dict[int, list[int]],
    max_size: int,
) -> dict[str, Any] | None:
    path: list[int] = []
    seen: set[int] = set()
    current = terminal_sector
    previous = 0

    while True:
        current_neighbors = neighbor_index.get(current, [])
        if not path:
            if len(current_neighbors) != 1:
                return None
        elif len(current_neighbors) != 2:
            return None

        if current in seen:
            return None
        seen.add(current)
        path.append(current)
        if len(path) > max_size:
            return None

        next_sector = 0
        for neighbor in current_neighbors:
            if neighbor == previous:
                continue
            if next_sector:
                return None
            next_sector = neighbor

        if not next_sector or next_sector in seen:
            return None

        next_neighbors = neighbor_index.get(next_sector, [])
        if len(next_neighbors) == 2:
            previous = current
            current = next_sector
            continue

        has_outside_neighbor = any(
            neighbor != current and neighbor not in seen
            for neighbor in next_neighbors
        )
        if not has_outside_neighbor:
            return None

        sectors = list(reversed(path))
        depth_by_sector = {
            sector_number: index + 1
            for index, sector_number in enumerate(sectors)
        }
        return {
            "entity": "deadend",
            "door": next_sector,
            "deepest": terminal_sector,
            "size": len(path),
            "max_depth": len(path),
            "sectors": sectors,
            "depth_by_sector": depth_by_sector,
        }


def build_deadends(
    sectors: dict[int, dict[str, Any]],
    max_size: int = 500,
) -> list[dict[str, Any]]:
    neighbor_index = {
        sector_number: linked_neighbors(sector)
        for sector_number, sector in sectors.items()
    }
    candidates: list[dict[str, Any]] = []
    for sector_number, neighbors in neighbor_index.items():
        if len(neighbors) != 1:
            continue
        deadend = try_build_deadend(sector_number, neighbor_index, max_size)
        if deadend is not None:
            candidates.append(deadend)

    accepted: list[dict[str, Any]] = []
    covered: set[int] = set()
    for candidate in sorted(candidates, key=lambda row: (-row["size"], row["door"], row["deepest"])):
        if all(sector in covered for sector in candidate["sectors"]):
            continue
        accepted.append(candidate)
        covered.update(candidate["sectors"])
    return sorted(accepted, key=lambda row: (row["door"], row["deepest"]))


def build_deadend_sector_index(deadends: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    index: dict[int, dict[str, Any]] = {}
    for deadend in deadends:
        for sector in deadend["sectors"]:
            index[sector] = deadend
    return index


def load_xdb(path: Path) -> dict[str, Any]:
    reader = XdbReader(path.read_bytes())
    header = read_header(reader)
    if header["version"] > 19:
        raise ValueError(
            f"XDB version {header['version']} is newer than this reader supports (19). "
            "Update the TWXDB Assistant package before querying this database."
        )
    mtime = path.stat().st_mtime
    sector_record_count = reader.read_count()
    sectors = {}
    for _ in range(sector_record_count):
        sector = read_sector(reader, header["version"])
        if sector["number"] in sectors:raise ValueError("Duplicate sector ID in XDB")
        sectors[sector["number"]] = sector

    planets = {}
    if header["version"] >= 10:
        planet_count = reader.read_i32()
        if planet_count < 0 or planet_count > len(reader.data)-reader.pos:
            raise ValueError("Invalid planet count in XDB")
        for _ in range(planet_count):
            planet = read_planet(reader, header["version"])
            if planet['id'] in planets:raise ValueError("Duplicate planet ID in XDB")
            planets[planet["id"]] = planet
    if reader.pos != len(reader.data):raise ValueError("Unread trailing bytes in XDB; database layout is not fully understood")

    planets_by_sector: dict[int, list[dict[str, Any]]] = {}
    for planet in planets.values():
        sector_number = planet.get("last_sector")
        if isinstance(sector_number, int) and sector_number > 0:
            planets_by_sector.setdefault(sector_number, []).append(planet)
    for planet_list in planets_by_sector.values():
        planet_list.sort(
            key=lambda item: (
                item.get("observed_order") or 10**9,
                item.get("id") or 0,
            )
        )

    deadends = build_deadends(sectors)
    deadend_by_sector = build_deadend_sector_index(deadends)

    return {
        "path": str(path),
        "mtime": mtime,
        "mtime_iso": datetime.fromtimestamp(mtime).isoformat(timespec="seconds"),
        "header": header,
        "sectors": sectors,
        "planets": planets,
        "planets_by_sector": planets_by_sector,
        "deadends": deadends,
        "deadend_by_sector": deadend_by_sector,
    }


def resolve_xdb(args: argparse.Namespace) -> Path:
    if args.xdb:
        return Path(args.xdb).expanduser()
    if args.game:
        return DEFAULT_GAMES_DIR / f"{args.game}.xdb"
    raise SystemExit("Provide --game NAME or --xdb PATH")


def sector_to_row(sector: dict[str, Any]) -> dict[str, Any]:
    port = sector["port"]
    row = {
        "sector": sector["number"],
        "figsec": get_var(sector, "FIGSEC"),
        "busted": get_var(sector, "BUSTED"),
        "warps": sector["warps"],
        "warps_in": sector["warps_in"],
        "fighters": sector["fighters"],
        "vars": sector["vars"],
        "port": None,
    }
    if port is not None:
        row["port"] = {
            "name": port["name"],
            "class": port["class"],
            "type": port_type(port),
            "buy": {
                product_display(idx): port["buy"][idx] for idx in range(3)
            },
            "amount": {
                product_display(idx): port["amount"][idx] for idx in range(3)
            },
            "pct": {
                product_display(idx): port["pct"][idx] for idx in range(3)
            },
        }
    return row


def product_map(values: list[Any]) -> dict[str, Any]:
    return {product_display(idx): values[idx] for idx in range(3)}


def authoritative_planets_in_sector(db: dict[str, Any], sector_number: int) -> list[dict[str, Any]]:
    return db["planets_by_sector"].get(sector_number, [])


def deadend_membership(db: dict[str, Any], sector_number: int) -> dict[str, Any]:
    deadend = db["deadend_by_sector"].get(sector_number)
    if deadend is None:
        return {
            "deadend": False,
            "deadend_door": 0,
            "deadend_deepest": 0,
            "deadend_size": 0,
            "deadend_depth": 0,
        }
    return {
        "deadend": True,
        "deadend_door": deadend["door"],
        "deadend_deepest": deadend["deepest"],
        "deadend_size": deadend["size"],
        "deadend_depth": deadend["depth_by_sector"].get(sector_number, 0),
    }


def sector_query_row(db: dict[str, Any], sector: dict[str, Any]) -> dict[str, Any]:
    port = sector["port"]
    planets = authoritative_planets_in_sector(db, sector["number"])
    deadend = deadend_membership(db, sector["number"])
    row: dict[str, Any] = {
        "entity": "sector",
        "sector": sector["number"],
        **deadend,
        "warps": sector["warps"],
        "warps_in": sector["warps_in"],
        "warp_count": sector["warp_count"],
        "warp_in_count": len(sector["warps_in"]),
        "explored": sector["explored"],
        "density": sector["density"],
        "anomaly": sector["anomaly"],
        "navhaz": sector["navhaz"],
        "constellation": sector["constellation"],
        "beacon": sector["beacon"],
        "updated_ticks": sector["updated_ticks"],
        "figsec": get_var(sector, "FIGSEC"),
        "mslsec": get_var(sector, "MSLSEC"),
        "busted": get_var(sector, "BUSTED"),
        "fighter_qty": sector["fighters"].get("qty", 0),
        "fighter_owner": sector["fighters"].get("owner", ""),
        "fighter_type": figtype_name(sector["fighters"].get("figtype")),
        "friendly": is_friendly_owner(sector["fighters"].get("owner")),
        "fighters": {
            **sector["fighters"],
            "type": figtype_name(sector["fighters"].get("figtype")),
            "friendly": is_friendly_owner(sector["fighters"].get("owner")),
        },
        "armids": sector["armids"],
        "limpets": sector["limpets"],
        "port": None,
        "ships": sector["ships"],
        "ship_count": len(sector["ships"]),
        "traders": sector["traders"],
        "trader_count": len(sector["traders"]),
        "sector_planet_names": sector["planet_names"],
        "sector_planet_name_count": len(sector["planet_names"]),
        "planet_ids": [planet["id"] for planet in planets],
        "planet_names": [planet["name"] for planet in planets],
        "planet_count": len(planets),
        "vars": sector["vars"],
    }
    if port is not None:
        row["port"] = {
            "name": port["name"],
            "dead": port["dead"],
            "build": port["build"],
            "class": port["class"],
            "type": port_type(port),
            "buy": product_map(port["buy"]),
            "amount": product_map(port["amount"]),
            "pct": product_map(port["pct"]),
            "updated_ticks": port["updated_ticks"],
        }
    return row


def planet_query_row(db: dict[str, Any], planet: dict[str, Any]) -> dict[str, Any]:
    sector_number = planet["last_sector"]
    sector = db["sectors"].get(sector_number)
    deadend = deadend_membership(db, sector_number)
    return {
        "entity": "planet",
        "id": planet["id"],
        "name": planet["name"],
        "sector": sector_number,
        "last_sector": sector_number,
        "observed_order": planet["observed_order"],
        "owner": planet["owner"],
        "level": planet["level"],
        "shielded": planet["shielded"],
        "fighters": planet["fighters"],
        "fuel": planet["fuel"],
        "org": planet["org"],
        "equ": planet["equ"],
        "fuel_colonists": planet.get("fuel_colonists", -1),
        "org_colonists": planet.get("org_colonists", -1),
        "equ_colonists": planet.get("equ_colonists", -1),
        "construction_known": planet.get("construction_known", False),
        "construction_type": planet.get("construction_type", ""),
        "construction_days": planet.get("construction_days", -1),
        "construction_underway": planet.get("construction_underway", False),
        "sector_figsec": get_var(sector, "FIGSEC") if sector else "",
        "sector_mslsec": get_var(sector, "MSLSEC") if sector else "",
        "sector_fighters": sector["fighters"] if sector else {},
        **deadend,
        "has_sector_record": sector is not None,
        "note": "current sector comes from the XDB planet table last_sector field",
    }


def port_query_row(db: dict[str, Any], sector: dict[str, Any]) -> dict[str, Any]:
    port = sector["port"]
    if port is None:
        raise ValueError("sector has no port")
    return {
        "entity": "port",
        "sector": sector["number"],
        **deadend_membership(db, sector["number"]),
        "name": port["name"],
        "dead": port["dead"],
        "build": port["build"],
        "class": port["class"],
        "type": port_type(port),
        "buy": product_map(port["buy"]),
        "amount": product_map(port["amount"]),
        "pct": product_map(port["pct"]),
        "updated_ticks": port["updated_ticks"],
        "figsec": get_var(sector, "FIGSEC"),
        "mslsec": get_var(sector, "MSLSEC"),
        "busted": get_var(sector, "BUSTED"),
        "fighter_qty": sector["fighters"].get("qty", 0),
        "fighter_owner": sector["fighters"].get("owner", ""),
        "fighter_type": figtype_name(sector["fighters"].get("figtype")),
        "friendly": is_friendly_owner(sector["fighters"].get("owner")),
        "fighters": sector["fighters"],
        "planet_count": len(authoritative_planets_in_sector(db, sector["number"])),
    }


def fighter_query_row(db: dict[str, Any], sector: dict[str, Any]) -> dict[str, Any]:
    fighters = sector["fighters"]
    return {
        "entity": "fighter",
        "sector": sector["number"],
        **deadend_membership(db, sector["number"]),
        "qty": fighters.get("qty", 0),
        "owner": fighters.get("owner", ""),
        "figtype": fighters.get("figtype", 0),
        "type": figtype_name(fighters.get("figtype")),
        "friendly": is_friendly_owner(fighters.get("owner")),
        "figsec": get_var(sector, "FIGSEC"),
        "mslsec": get_var(sector, "MSLSEC"),
        "busted": get_var(sector, "BUSTED"),
        "port_exists": sector["port"] is not None,
        "planet_count": len(authoritative_planets_in_sector(db, sector["number"])),
        "warps": sector["warps"],
        "warps_in": sector["warps_in"],
        "warp_count": sector["warp_count"],
        "warp_in_count": len(sector["warps_in"]),
    }


def mine_query_rows(db: dict[str, Any], sector: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for kind, key in (("armid", "armids"), ("limpet", "limpets")):
        mines = sector[key]
        rows.append({
            "entity": "mine",
            "kind": kind,
            "sector": sector["number"],
            **deadend_membership(db, sector["number"]),
            "qty": mines.get("qty", 0),
            "figtype": mines.get("figtype", 0),
            "owner": mines.get("owner", ""),
            "friendly": is_friendly_owner(mines.get("owner")),
            "figsec": get_var(sector, "FIGSEC"),
            "mslsec": get_var(sector, "MSLSEC"),
            "port_exists": sector["port"] is not None,
            "planet_count": len(authoritative_planets_in_sector(db, sector["number"])),
        })
    return rows


def add_user_source(
    users: dict[str, dict[str, Any]],
    name: str,
    source: str,
    sector: int,
    qty: int | None = None,
) -> None:
    clean = str(name or "").strip()
    if not clean:
        return
    row = users.setdefault(clean, {
        "entity": "user",
        "name": clean,
        "sources": {},
        "sectors": set(),
        "sector_count": 0,
        "total_fighters": 0,
    })
    row["sources"][source] = row["sources"].get(source, 0) + 1
    if sector > 0:
        row["sectors"].add(sector)
    if qty is not None and qty > 0:
        row["total_fighters"] += qty


def user_query_rows(db: dict[str, Any]) -> list[dict[str, Any]]:
    users: dict[str, dict[str, Any]] = {}
    for sector in db["sectors"].values():
        sector_number = sector["number"]
        for trader in sector["traders"]:
            add_user_source(users, trader.get("name", ""), "trader", sector_number, trader.get("fighters"))
        for ship in sector["ships"]:
            add_user_source(users, ship.get("owner", ""), "ship_owner", sector_number, ship.get("fighters"))
        fighters = sector["fighters"]
        add_user_source(users, fighters.get("owner", ""), "sector_fighters", sector_number, fighters.get("qty"))
        armids = sector["armids"]
        add_user_source(users, armids.get("owner", ""), "armids", sector_number, armids.get("qty"))
        limpets = sector["limpets"]
        add_user_source(users, limpets.get("owner", ""), "limpets", sector_number, limpets.get("qty"))
    for planet in db["planets"].values():
        add_user_source(
            users,
            planet.get("owner", ""),
            "planet_owner",
            planet.get("last_sector", 0),
            planet.get("fighters"),
        )

    rows: list[dict[str, Any]] = []
    for row in users.values():
        sectors = sorted(row["sectors"])
        rows.append({
            **row,
            "sources": dict(sorted(row["sources"].items())),
            "sectors": sectors,
            "sector_count": len(sectors),
            "friendly": is_friendly_owner(row["name"]),
        })
    return sorted(rows, key=lambda item: item["name"].lower())


def item_rows(db: dict[str, Any], entity: str) -> list[dict[str, Any]]:
    entity_key = entity.lower()
    rows: list[dict[str, Any]] = []
    if entity_key == "header":
        return [{
            "entity": "header",
            **db["header"],
            "path": db["path"],
            "mtime": db["mtime"],
            "mtime_iso": db["mtime_iso"],
        }]
    if entity_key == "sectors":
        return [sector_query_row(db, sector) for sector in db["sectors"].values()]
    if entity_key == "ports":
        return [port_query_row(db, sector) for sector in db["sectors"].values() if sector["port"] is not None]
    if entity_key == "planets":
        return [planet_query_row(db, planet) for planet in db["planets"].values()]
    if entity_key == "deadends":
        return db["deadends"]
    if entity_key == "fighters":
        return [fighter_query_row(db, sector) for sector in db["sectors"].values()]
    if entity_key == "mines":
        for sector in db["sectors"].values():
            rows.extend(mine_query_rows(db, sector))
        return rows
    if entity_key in {"users", "players"}:
        return user_query_rows(db)
    if entity_key == "ships":
        for sector in db["sectors"].values():
            for index, ship in enumerate(sector["ships"], start=1):
                rows.append({
                    "entity": "ship",
                    "sector": sector["number"],
                    "index": index,
                    **deadend_membership(db, sector["number"]),
                    "figsec": get_var(sector, "FIGSEC"),
                    "mslsec": get_var(sector, "MSLSEC"),
                    "port_exists": sector["port"] is not None,
                    "planet_count": len(authoritative_planets_in_sector(db, sector["number"])),
                    **ship,
                })
        return rows
    if entity_key == "traders":
        for sector in db["sectors"].values():
            for index, trader in enumerate(sector["traders"], start=1):
                rows.append({
                    "entity": "trader",
                    "sector": sector["number"],
                    "index": index,
                    **deadend_membership(db, sector["number"]),
                    "figsec": get_var(sector, "FIGSEC"),
                    "mslsec": get_var(sector, "MSLSEC"),
                    "port_exists": sector["port"] is not None,
                    "planet_count": len(authoritative_planets_in_sector(db, sector["number"])),
                    **trader,
                })
        return rows
    if entity_key == "vars":
        for sector in db["sectors"].values():
            for name, value in sector["vars"].items():
                rows.append({"entity": "var", "sector": sector["number"], "name": name, "value": value})
        return rows
    raise SystemExit(f"Unknown entity '{entity}'")


def resolve_field(row: Any, field: str) -> Any:
    value = row
    for part in field.split("."):
        if isinstance(value, dict):
            exact = value.get(part)
            if exact is not None or part in value:
                value = exact
                continue
            wanted = field_key(part)
            found = None
            matched = False
            for key, item in value.items():
                if field_key(str(key)) == wanted:
                    found = item
                    matched = True
                    break
            if not matched:
                return None
            value = found
        elif isinstance(value, list):
            try:
                value = value[int(part)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    return value


def comparable(value: Any) -> Any:
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, (int, float)):
        return value
    text = str(value).replace(",", "").strip()
    if text == "":
        return ""
    try:
        return int(text)
    except ValueError:
        try:
            return float(text)
        except ValueError:
            return str(value).strip()


def sort_key(value: Any) -> tuple[int, Any]:
    normalized = comparable(value)
    if normalized is None:
        return (3, "")
    if isinstance(normalized, bool):
        return (0, int(normalized))
    if isinstance(normalized, (int, float)):
        return (1, normalized)
    return (2, str(normalized).lower())


def parse_where(raw: str) -> tuple[str, str, str | None]:
    text = raw.strip()
    if not text:
        raise SystemExit("Empty --where condition")
    if text.startswith("!"):
        return text[1:], "falsy", None
    for op in (">=", "<=", "!=", "~", "=", ">", "<"):
        if op in text:
            field, expected = text.split(op, 1)
            return field.strip(), op, expected.strip()
    return text, "truthy", None


def condition_matches(row: dict[str, Any], raw: str) -> bool:
    field, op, expected = parse_where(raw)
    actual = resolve_field(row, field)
    if op == "truthy":
        return truthy(actual)
    if op == "falsy":
        return actual is None or not truthy(actual)
    if op == "~":
        return expected is not None and expected.lower() in str(actual or "").lower()
    if expected is None:
        return False

    left = comparable(actual)
    right = comparable(expected)
    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        if op == "=":
            return left == right
        if op == "!=":
            return left != right
        if op == ">":
            return left > right
        if op == "<":
            return left < right
        if op == ">=":
            return left >= right
        if op == "<=":
            return left <= right

    left_text = "" if left is None else str(left)
    right_text = str(right)
    if op == "=":
        return left_text.lower() == right_text.lower()
    if op == "!=":
        return left_text.lower() != right_text.lower()
    if op in {">", "<", ">=", "<="}:
        return False
    raise SystemExit(f"Unknown --where operator in '{raw}'")


def apply_query_args(
    rows: list[dict[str, Any]],
    args: argparse.Namespace,
    apply_limit: bool = True,
) -> list[dict[str, Any]]:
    for raw in args.where or []:
        rows = [row for row in rows if condition_matches(row, raw)]
    if args.sort:
        rows.sort(
            key=lambda row: sort_key(resolve_field(row, args.sort)),
            reverse=args.desc,
        )
    elif all("sector" in row for row in rows):
        rows.sort(key=lambda row: comparable(row["sector"]))
    if apply_limit and args.limit is not None:
        rows = rows[: args.limit]
    return rows


def project_rows(rows: list[dict[str, Any]], fields: str | None) -> list[dict[str, Any]]:
    if not fields:
        return rows
    wanted = [field.strip() for field in fields.split(",") if field.strip()]
    return [{field: resolve_field(row, field) for field in wanted} for row in rows]


def group_rows(rows: list[dict[str, Any]], group_by: str) -> list[dict[str, Any]]:
    groups: dict[str, dict[str, Any]] = {}
    for row in rows:
        value = resolve_field(row, group_by)
        key = json.dumps(value, sort_keys=True) if isinstance(value, (dict, list)) else str(value)
        group = groups.setdefault(key, {"group": value, "count": 0, "sectors": []})
        group["count"] += 1
        sector = row.get("sector")
        if isinstance(sector, int):
            group["sectors"].append(sector)
    return sorted(
        (
            {
                **group,
                "sectors": sorted(set(group["sectors"])),
                "sector_count": len(set(group["sectors"])),
            }
            for group in groups.values()
        ),
        key=lambda item: (-item["count"], sort_key(item["group"])),
    )


def cmd_query(db: dict[str, Any], args: argparse.Namespace) -> None:
    rows = apply_query_args(item_rows(db, args.entity), args, apply_limit=not args.group_by)
    if args.group_by:
        groups = group_rows(rows, args.group_by)
        if args.limit is not None:
            groups = groups[: args.limit]
        emit(project_rows(groups, args.fields), args)
        return
    if args.count:
        emit({"count": len(rows), "path": db["path"], "mtime": db["mtime"], "mtime_iso": db["mtime_iso"]}, args)
        return
    if args.one_per_line:
        values = [resolve_field(row, args.one_per_line) for row in rows]
        emit_lines(values, args)
        return
    emit(project_rows(rows, args.fields), args)


def cmd_planets(db: dict[str, Any], args: argparse.Namespace) -> None:
    rows = item_rows(db, "planets")
    if args.corp:
        rows = [row for row in rows if "your Corp" in str(row["owner"])]
    if args.owner:
        rows = [row for row in rows if args.owner.lower() in str(row["owner"]).lower()]
    if args.sector is not None:
        rows = [row for row in rows if row["sector"] == args.sector]
    if args.min_level is not None:
        rows = [row for row in rows if comparable(row["level"]) >= args.min_level]
    if args.max_level is not None:
        rows = [row for row in rows if comparable(row["level"]) <= args.max_level]
    if args.shielded:
        rows = [row for row in rows if row["shielded"] is True]
    if args.unshielded:
        rows = [row for row in rows if row["shielded"] is False]
    for product in ("fuel", "org", "equ", "fuel_colonists", "org_colonists", "equ_colonists", "fighters"):
        min_value = getattr(args, f"min_{product}")
        max_value = getattr(args, f"max_{product}")
        if min_value is not None:
            rows = [row for row in rows if comparable(row[product]) >= min_value]
        if max_value is not None:
            rows = [row for row in rows if comparable(row[product]) <= max_value]
    rows = apply_query_args(rows, args, apply_limit=not args.group_by)
    if args.group_by:
        groups = group_rows(rows, args.group_by)
        if args.limit is not None:
            groups = groups[: args.limit]
        emit(project_rows(groups, args.fields), args)
        return
    if args.count:
        emit({"count": len(rows), "path": db["path"], "mtime": db["mtime"], "mtime_iso": db["mtime_iso"]}, args)
        return
    if args.one_per_line:
        emit_lines([resolve_field(row, args.one_per_line) for row in rows], args)
        return
    emit(project_rows(rows, args.fields), args)


def flatten_paths(value: Any, prefix: str = "") -> list[str]:
    if isinstance(value, dict):
        if value and all(str(key).isdigit() for key in value):
            return []
        paths: list[str] = []
        for key, item in sorted(value.items()):
            path = f"{prefix}.{key}" if prefix else str(key)
            paths.append(path)
            paths.extend(flatten_paths(item, path))
        return paths
    return []


def cmd_fields(db: dict[str, Any], args: argparse.Namespace) -> None:
    rows = item_rows(db, args.entity)
    paths: set[str] = set()
    sample_count = len(rows) if args.sample <= 0 else args.sample
    for row in rows[:sample_count]:
        paths.update(flatten_paths(row))
    emit_lines(sorted(paths), args)


def emit_lines(values: list[Any], args: argparse.Namespace) -> None:
    text = "\n".join("" if value is None else str(value) for value in values)
    if args.output:
        Path(args.output).expanduser().write_text(text + ("\n" if text else ""), encoding="utf-8")
        print(f"wrote {len(values)} rows to {Path(args.output).expanduser()}")
    else:
        print(text)


def cmd_summary(db: dict[str, Any], args: argparse.Namespace) -> None:
    sectors = db["sectors"]
    port_count = sum(1 for sector in sectors.values() if sector["port"] is not None)
    figsec_count = sum(1 for sector in sectors.values() if truthy(get_var(sector, "FIGSEC")))
    data = {
        "path": db["path"],
        "mtime": db["mtime"],
        "mtime_iso": db["mtime_iso"],
        "header": db["header"],
        "sector_records": len(sectors),
        "ports": port_count,
        "figsec": figsec_count,
        "fig_count_var": get_var(sectors.get(2, {"vars": {}}), "FIG_COUNT"),
        "planets": len(db["planets"]),
    }
    emit(data, args)


def cmd_sector(db: dict[str, Any], args: argparse.Namespace) -> None:
    rows = []
    for sector_number in args.sectors:
        sector = db["sectors"].get(sector_number)
        if sector is None:
            rows.append({"sector": sector_number, "missing": True})
        else:
            rows.append(sector_to_row(sector))
    emit(rows, args)


def parse_param_filter(raw: str) -> tuple[str, str | None]:
    if "=" in raw:
        name, value = raw.split("=", 1)
        return name, value
    return raw, None


def port_matches(sector: dict[str, Any], args: argparse.Namespace) -> bool:
    port = sector["port"]
    if port is None:
        return False
    if args.require_figsec and not truthy(get_var(sector, "FIGSEC")):
        return False
    if args.no_figsec and truthy(get_var(sector, "FIGSEC")):
        return False
    if args.not_busted and truthy(get_var(sector, "BUSTED")):
        return False
    if args.classes:
        classes = {int(value) for value in args.classes.split(",") if value}
        if port["class"] not in classes:
            return False
    for raw_filter in args.param or []:
        name, expected = parse_param_filter(raw_filter)
        actual = get_var(sector, name)
        if expected is None:
            if not truthy(actual):
                return False
        elif actual.lower() != expected.lower():
            return False

    idx = product_index(args.product)
    if idx is not None:
        if args.buys and not port["buy"][idx]:
            return False
        if args.sells and port["buy"][idx]:
            return False
        if port["amount"][idx] < args.min_amount:
            return False
        if args.max_amount is not None and port["amount"][idx] > args.max_amount:
            return False
        if port["pct"][idx] < args.min_pct:
            return False
        if args.max_pct is not None and port["pct"][idx] > args.max_pct:
            return False
    return True


def cmd_ports(db: dict[str, Any], args: argparse.Namespace) -> None:
    rows = []
    idx = product_index(args.product)
    for sector in db["sectors"].values():
        if not port_matches(sector, args):
            continue
        row = sector_to_row(sector)
        if idx is not None and row["port"] is not None:
            row["selected_product"] = product_display(idx)
            row["selected_amount"] = sector["port"]["amount"][idx]
            row["selected_pct"] = sector["port"]["pct"][idx]
            row["selected_buys"] = sector["port"]["buy"][idx]
        rows.append(row)

    if args.sort == "amount" and idx is not None:
        rows.sort(key=lambda row: row["selected_amount"], reverse=args.desc)
    elif args.sort == "pct" and idx is not None:
        rows.sort(key=lambda row: row["selected_pct"], reverse=args.desc)
    else:
        rows.sort(key=lambda row: row["sector"], reverse=args.desc)

    if args.limit is not None:
        rows = rows[: args.limit]
    emit(rows, args)


def cmd_params(db: dict[str, Any], args: argparse.Namespace) -> None:
    rows = []
    for sector in db["sectors"].values():
        if args.name:
            value = get_var(sector, args.name)
            if args.present and value == "":
                continue
            if args.value is not None and value.lower() != args.value.lower():
                continue
            if value == "" and not args.show_empty:
                continue
            rows.append({"sector": sector["number"], args.name: value})
        elif sector["vars"]:
            rows.append({"sector": sector["number"], "vars": sector["vars"]})
    rows.sort(key=lambda row: row["sector"])
    if args.limit is not None:
        rows = rows[: args.limit]
    emit(rows, args)


def emit(data: Any, args: argparse.Namespace) -> None:
    output_path = getattr(args, "output", None)
    if args.json:
        text = json.dumps(data, indent=2, sort_keys=True)
        if output_path:
            Path(output_path).expanduser().write_text(text + "\n", encoding="utf-8")
            print(f"wrote {len(data) if isinstance(data, list) else 1} rows to {Path(output_path).expanduser()}")
        else:
            print(text)
        return

    if isinstance(data, dict):
        lines = [f"{key}: {value}" for key, value in data.items()]
        text = "\n".join(lines)
        if output_path:
            Path(output_path).expanduser().write_text(text + "\n", encoding="utf-8")
            print(f"wrote 1 rows to {Path(output_path).expanduser()}")
        else:
            print(text)
        return

    if not data:
        print("0 rows")
        return

    lines = []
    for row in data:
        if "port" in row and "entity" not in row:
            port = row["port"]
            if port is None:
                lines.append(f"{row['sector']:5d} port=none figsec={row['figsec']}")
                continue
            selected = ""
            if "selected_product" in row:
                selected = (
                    f" {row['selected_product']}={row['selected_amount']} "
                    f"{row['selected_pct']}% buys={row['selected_buys']}"
                )
            lines.append(
                f"{row['sector']:5d} {port['type']} class={port['class']} "
                f"figsec={row['figsec']} busted={row['busted']}{selected}"
            )
        else:
            lines.append(str(row))
    text = "\n".join(lines)
    if output_path:
        Path(output_path).expanduser().write_text(text + "\n", encoding="utf-8")
        print(f"wrote {len(data)} rows to {Path(output_path).expanduser()}")
    else:
        print(text)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game", help="Game name, e.g. mba_s")
    parser.add_argument("--xdb", help="Path to a .xdb file")
    parser.add_argument("--json", action="store_true", help="Emit JSON")

    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_json_option(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument(
            "--json",
            action="store_true",
            default=argparse.SUPPRESS,
            help="Emit JSON",
        )

    def add_output_option(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument("--output", help="Write output to this path")

    def add_query_options(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument(
            "--where",
            action="append",
            help=(
                "Filter rows. Forms: field=value, field!=value, field>N, "
                "field>=N, field<N, field<=N, field~text, field, !field"
            ),
        )
        subparser.add_argument("--fields", help="Comma-separated field projection")
        subparser.add_argument("--sort", help="Sort by field path")
        subparser.add_argument("--desc", action="store_true")
        subparser.add_argument("--limit", type=int)
        subparser.add_argument("--group-by", help="Group filtered rows by field path")
        subparser.add_argument("--count", action="store_true", help="Only emit row count")
        subparser.add_argument("--one-per-line", help="Emit one field value per line")
        add_output_option(subparser)

    summary_parser = subparsers.add_parser("summary", help="Show database summary")
    add_json_option(summary_parser)
    add_output_option(summary_parser)

    sector_parser = subparsers.add_parser("sector", help="Show sectors")
    sector_parser.add_argument("sectors", nargs="+", type=int)
    add_json_option(sector_parser)
    add_output_option(sector_parser)

    ports_parser = subparsers.add_parser("ports", help="Filter port records")
    ports_parser.add_argument("--product", choices=sorted(PRODUCTS))
    ports_parser.add_argument("--buys", action="store_true", help="Port buys product")
    ports_parser.add_argument("--sells", action="store_true", help="Port sells product")
    ports_parser.add_argument("--min-amount", type=int, default=0)
    ports_parser.add_argument("--max-amount", type=int)
    ports_parser.add_argument("--min-pct", type=int, default=0)
    ports_parser.add_argument("--max-pct", type=int)
    ports_parser.add_argument("--require-figsec", action="store_true")
    ports_parser.add_argument("--no-figsec", action="store_true")
    ports_parser.add_argument("--not-busted", action="store_true")
    ports_parser.add_argument("--classes", help="Comma-separated class list")
    ports_parser.add_argument("--param", action="append", help="Require param or param=value")
    ports_parser.add_argument("--sort", choices=("sector", "amount", "pct"), default="sector")
    ports_parser.add_argument("--desc", action="store_true")
    ports_parser.add_argument("--limit", type=int)
    add_json_option(ports_parser)
    add_output_option(ports_parser)

    params_parser = subparsers.add_parser("params", help="Show sector parameters")
    params_parser.add_argument("--name", help="Parameter name, e.g. FIGSEC")
    params_parser.add_argument("--value", help="Only rows where name equals value")
    params_parser.add_argument("--present", action="store_true", help="Only rows where name exists")
    params_parser.add_argument("--show-empty", action="store_true")
    params_parser.add_argument("--limit", type=int)
    add_json_option(params_parser)
    add_output_option(params_parser)

    planets_parser = subparsers.add_parser(
        "planets",
        help="Filter planet records using authoritative planet-table last_sector",
    )
    planets_parser.add_argument("--corp", action="store_true", help="Owner contains 'your Corp'")
    planets_parser.add_argument("--owner", help="Owner text contains value")
    planets_parser.add_argument("--sector", type=int, help="Current planet last_sector")
    planets_parser.add_argument("--min-level", type=int)
    planets_parser.add_argument("--max-level", type=int)
    planets_parser.add_argument("--shielded", action="store_true")
    planets_parser.add_argument("--unshielded", action="store_true")
    for product in ("fuel", "org", "equ", "fuel_colonists", "org_colonists", "equ_colonists", "fighters"):
        option_product = product.replace("_", "-")
        planets_parser.add_argument(f"--min-{option_product}", dest=f"min_{product}", type=int)
        planets_parser.add_argument(f"--max-{option_product}", dest=f"max_{product}", type=int)
    add_query_options(planets_parser)
    add_json_option(planets_parser)

    query_parser = subparsers.add_parser(
        "query",
        help="Generic XDB query over header, sectors, ports, planets, ships, traders, or vars",
    )
    query_parser.add_argument(
        "entity",
        choices=QUERY_ENTITIES,
    )
    add_query_options(query_parser)
    add_json_option(query_parser)

    fields_parser = subparsers.add_parser(
        "fields",
        help="List available field paths for an entity",
    )
    fields_parser.add_argument(
        "entity",
        choices=QUERY_ENTITIES,
    )
    fields_parser.add_argument("--sample", type=int, default=0, help="Rows to sample; 0 means all")
    add_output_option(fields_parser)

    return parser


def main(argv: list[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    xdb_path = resolve_xdb(args)
    if not xdb_path.exists():
        parser.error(f"XDB not found: {xdb_path}")

    db = load_xdb(xdb_path)
    if args.command == "summary":
        cmd_summary(db, args)
    elif args.command == "sector":
        cmd_sector(db, args)
    elif args.command == "ports":
        cmd_ports(db, args)
    elif args.command == "params":
        cmd_params(db, args)
    elif args.command == "planets":
        cmd_planets(db, args)
    elif args.command == "query":
        cmd_query(db, args)
    elif args.command == "fields":
        cmd_fields(db, args)
    else:
        parser.error(f"Unknown command: {args.command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
