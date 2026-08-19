#!/usr/bin/env python3
"""Query TWX30 .xdb game databases for script/debugging work.

This intentionally mirrors the TWX30 Core Database.cs binary layout instead of
scraping logs. It is meant for quick, repeatable answers to questions like
"how many ports match this script's criteria?" or "what is FIGSEC in sector X?"
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path
from typing import Any


DEFAULT_GAMES_DIR = Path("/Users/mosleym/twx/games")

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


class XdbReader:
    def __init__(self, data: bytes) -> None:
        self.data = data
        self.pos = 0

    def read_7bit_int(self) -> int:
        value = 0
        shift = 0
        while True:
            byte = self.read_u8()
            value |= (byte & 0x7F) << shift
            if (byte & 0x80) == 0:
                return value
            shift += 7
            if shift > 35:
                raise ValueError("Invalid 7-bit encoded integer in XDB")

    def read_string(self) -> str:
        length = self.read_7bit_int()
        raw = self.data[self.pos : self.pos + length]
        self.pos += length
        return raw.decode("utf-8", errors="replace")

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
        # Database.cs writes only ASCII game/command chars here.
        raw = self.data[self.pos : self.pos + 1]
        self.pos += 1
        return raw.decode("utf-8", errors="replace")

    def read_struct(self, fmt: str) -> Any:
        size = struct.calcsize(fmt)
        if self.pos + size > len(self.data):
            raise EOFError("Unexpected end of XDB")
        value = struct.unpack_from(fmt, self.data, self.pos)[0]
        self.pos += size
        return value


def truthy(value: Any) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def product_index(name: str | None) -> int | None:
    if name is None:
        return None
    key = name.lower()
    if key not in PRODUCTS:
        raise SystemExit(f"Unknown product '{name}'")
    return PRODUCTS[key]


def product_display(index: int) -> str:
    return PRODUCT_NAMES[index]


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
    }
    if header["version"] >= 11 and reader.pos < len(reader.data):
        header["command_char"] = reader.read_char()
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
    sector["ships"] = [read_ship(reader) for _ in range(reader.read_i32())]
    sector["traders"] = [read_trader(reader, version) for _ in range(reader.read_i32())]
    sector["planet_names"] = [reader.read_string() for _ in range(reader.read_i32())]
    sector["vars"] = {
        reader.read_string(): reader.read_string() for _ in range(reader.read_i32())
    }
    sector["warps_in"] = [
        reader.read_warp(version) for _ in range(reader.read_i32())
    ]
    sector["warps"] = [warp for warp in sector["warps"] if warp > 0]
    return sector


def read_planet(reader: XdbReader) -> dict[str, Any]:
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
    }
    return planet


def load_xdb(path: Path) -> dict[str, Any]:
    reader = XdbReader(path.read_bytes())
    header = read_header(reader)
    sector_record_count = reader.read_i32()
    sectors = {}
    for _ in range(sector_record_count):
        sector = read_sector(reader, header["version"])
        sectors[sector["number"]] = sector

    planets = {}
    if reader.pos < len(reader.data):
        try:
            planet_count = reader.read_i32()
            for _ in range(planet_count):
                planet = read_planet(reader)
                planets[planet["id"]] = planet
        except EOFError:
            planets = {}

    return {
        "path": str(path),
        "header": header,
        "sectors": sectors,
        "planets": planets,
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


def cmd_summary(db: dict[str, Any], args: argparse.Namespace) -> None:
    sectors = db["sectors"]
    port_count = sum(1 for sector in sectors.values() if sector["port"] is not None)
    figsec_count = sum(1 for sector in sectors.values() if truthy(get_var(sector, "FIGSEC")))
    data = {
        "path": db["path"],
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
    if args.json:
        print(json.dumps(data, indent=2, sort_keys=True))
        return

    if isinstance(data, dict):
        for key, value in data.items():
            print(f"{key}: {value}")
        return

    if not data:
        print("0 rows")
        return

    for row in data:
        if "port" in row:
            port = row["port"]
            if port is None:
                print(f"{row['sector']:5d} port=none figsec={row['figsec']}")
                continue
            selected = ""
            if "selected_product" in row:
                selected = (
                    f" {row['selected_product']}={row['selected_amount']} "
                    f"{row['selected_pct']}% buys={row['selected_buys']}"
                )
            print(
                f"{row['sector']:5d} {port['type']} class={port['class']} "
                f"figsec={row['figsec']} busted={row['busted']}{selected}"
            )
        else:
            print(row)


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

    summary_parser = subparsers.add_parser("summary", help="Show database summary")
    add_json_option(summary_parser)

    sector_parser = subparsers.add_parser("sector", help="Show sectors")
    sector_parser.add_argument("sectors", nargs="+", type=int)
    add_json_option(sector_parser)

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

    params_parser = subparsers.add_parser("params", help="Show sector parameters")
    params_parser.add_argument("--name", help="Parameter name, e.g. FIGSEC")
    params_parser.add_argument("--value", help="Only rows where name equals value")
    params_parser.add_argument("--present", action="store_true", help="Only rows where name exists")
    params_parser.add_argument("--show-empty", action="store_true")
    params_parser.add_argument("--limit", type=int)
    add_json_option(params_parser)

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
    else:
        parser.error(f"Unknown command: {args.command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
