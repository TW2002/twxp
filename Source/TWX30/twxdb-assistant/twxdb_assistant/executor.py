from __future__ import annotations

import importlib.util
import json
from collections import Counter, deque
from pathlib import Path
from typing import Any, Iterable

from .schema import fields_for, field_name, valid_field
from .paths import resolve_games_dir, resolve_list_dir, resolve_query_helper


QUERY_HELPER = resolve_query_helper()
GAMES_DIR = resolve_games_dir()
LIST_DIR = resolve_list_dir()
ALLOWED_ENTITIES = {
    "header", "sectors", "ports", "planets", "fighters", "mines",
    "deadends", "ships", "traders", "users", "players", "vars",
}
ALLOWED_OPS = {"=", "!=", "<", "<=", ">", ">=", "contains", "in", "truthy", "falsy"}


class PlanError(ValueError):
    pass


def _load_helper():
    spec = importlib.util.spec_from_file_location("twxdb_query", QUERY_HELPER)
    if spec is None or spec.loader is None:
        raise PlanError(f"Unable to load XDB helper: {QUERY_HELPER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _as_plan(plan: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(plan, str):
        try:
            plan = json.loads(plan)
        except json.JSONDecodeError as exc:
            raise PlanError(f"Invalid JSON plan: {exc}") from exc
    if not isinstance(plan, dict):
        raise PlanError("Plan must be a JSON object")
    if plan.get("v", 1) != 1:
        raise PlanError("Only query-plan version 1 is supported")
    return plan


def _truthy(value: Any) -> bool:
    if value is None or value is False:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    return str(value).strip().lower() not in {"", "0", "false", "no", "none", "null"}


def _field(row: dict[str, Any], path: str) -> Any:
    value: Any = row
    parts = path.split('.')
    for index, part in enumerate(parts):
        if isinstance(value, dict):
            remaining='.'.join(parts[index:])
            if remaining in value:return value[remaining]
            matches=[k for k in value if str(k).casefold()==remaining.casefold()]
            if len(matches)==1:return value[matches[0]]
            matches=[k for k in value if str(k).casefold()==part.casefold()]
            value=value[part] if part in value else value[matches[0]] if len(matches)==1 else None
        elif isinstance(value, list) and part.isdigit():
            value=value[int(part)] if int(part)<len(value) else None
        else:return None
    return value


def _coerce_pair(actual: Any, expected: Any) -> tuple[Any, Any]:
    if actual is None or expected is None:return actual,expected
    if isinstance(actual, bool):
        if str(expected).strip().lower() not in {'true','false','1','0'}:raise PlanError('Boolean filters require true or false')
        return actual, _truthy(expected)
    if isinstance(actual, (int, float)) and not isinstance(actual, bool):
        try:
            return actual, float(expected)
        except (TypeError, ValueError):
            return actual, expected
    if isinstance(actual,str) and isinstance(expected,(int,float)) and not isinstance(expected,bool):
        try:return float(actual.replace(',','')),expected
        except ValueError:return actual,expected
    return actual, expected


def _matches(row: dict[str, Any], condition: dict[str, Any]) -> bool:
    field = condition.get("field")
    op = condition.get("op", "=")
    if not isinstance(field, str) or op not in ALLOWED_OPS:
        raise PlanError(f"Invalid filter condition: {condition!r}")
    actual = _field(row, field)
    expected = condition.get("value")
    if op == "truthy":
        return _truthy(actual)
    if op == "falsy":
        return not _truthy(actual)
    if op == "contains":
        if isinstance(actual,(list,dict)):return expected in actual
        return actual is not None and str(expected).lower() in str(actual).lower()
    if op == "in":
        if not isinstance(expected, list):
            raise PlanError("The 'in' operator requires a list value")
        return actual in expected
    actual, expected = _coerce_pair(actual, expected)
    if op == '=':return actual == expected
    if op == '!=':return actual != expected
    if actual is None or expected is None:return False
    try:
        if op == '<':return actual < expected
        if op == '<=':return actual <= expected
        if op == '>':return actual > expected
        if op == '>=':return actual >= expected
    except TypeError:return False
    return False


def _matches_all(row: dict[str, Any], conditions: Iterable[dict[str, Any]]) -> bool:
    return all(_matches(row, condition) for condition in conditions)


def _resolve_list(name: str) -> Path:
    candidate = Path(name).expanduser()
    if not candidate.is_absolute():
        candidate = LIST_DIR / candidate
    candidate = candidate.resolve()
    root = LIST_DIR.resolve()
    if candidate != root and root not in candidate.parents:
        raise PlanError(f"Source lists must be under the configured TWX directory: {root}")
    if not candidate.is_file():
        raise PlanError(f"Source list not found: {candidate}")
    return candidate


def _read_sector_list(name: str) -> list[int]:
    result: list[int] = []
    for raw in _resolve_list(name).read_text(encoding="utf-8", errors="replace").splitlines():
        text = raw.strip()
        if text.isdigit():
            result.append(int(text))
    return result


def _row_sector(row: dict[str, Any], list_match: str) -> int | None:
    if list_match == "deepest":
        return row.get("deepest")
    if list_match == "door":
        return row.get("door")
    value = row.get("sector")
    return value if isinstance(value, int) else None


def _apply_source_list(rows: list[dict[str, Any]], plan: dict[str, Any]) -> list[dict[str, Any]]:
    name = plan.get("source_list")
    if not name:
        return rows
    values = _read_sector_list(str(name))
    order = {sector: index for index, sector in enumerate(values)}
    match = str(plan.get("list_match", "sector"))
    result: list[dict[str, Any]] = []
    for row in rows:
        if match == "member":
            members = row.get("sectors", [])
            positions = [order[value] for value in members if value in order]
            if not positions:
                continue
            copied = dict(row)
            copied["list_order"] = min(positions)
            result.append(copied)
            continue
        sector = _row_sector(row, match)
        if sector not in order:
            continue
        copied = dict(row)
        copied["list_order"] = order[sector]
        result.append(copied)
    return result


def _apply_neighbor_filter(
    rows: list[dict[str, Any]],
    sectors: dict[int, dict[str, Any]],
    neighbor: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    if not neighbor:
        return rows
    direction = neighbor.get("direction", "out")
    if direction not in {"out", "in", "either"}:
        raise PlanError("Neighbor direction must be out, in, or either")
    minimum = int(neighbor.get("min", 1))
    maximum = neighbor.get("max")
    maximum = None if maximum is None else int(maximum)
    conditions = neighbor.get("where", [])
    result: list[dict[str, Any]] = []
    for row in rows:
        sector_number = row.get("sector")
        if not isinstance(sector_number, int) or sector_number not in sectors:
            continue
        sector = sectors[sector_number]
        neighbors: list[int] = []
        if direction in {"out", "either"}:
            neighbors.extend(sector.get("warps", []))
        if direction in {"in", "either"}:
            neighbors.extend(sector.get("warps_in", []))
        count = 0
        for target in dict.fromkeys(neighbors):
            target_row = sectors.get(target)
            if target_row is not None and _matches_all(target_row, conditions):
                count += 1
        if count >= minimum and (maximum is None or count <= maximum):
            copied = dict(row)
            copied["matching_neighbor_count"] = count
            result.append(copied)
    return result


def _sort_rows(rows: list[dict[str, Any]], fields: list[Any]) -> None:
    for item in reversed(fields):
        if isinstance(item, str):
            field, descending = item, False
        elif isinstance(item, dict):
            field = str(item.get("field", "sector"))
            descending = str(item.get("direction", "asc")).lower() == "desc"
        else:
            raise PlanError(f"Invalid sort specification: {item!r}")
        known=[row for row in rows if _field(row,field) is not None]
        unknown=[row for row in rows if _field(row,field) is None]
        def key(row):
            value=_field(row,field)
            if isinstance(value,(int,float)):return (0,value)
            if isinstance(value,str):return (1,value)
            return (2,json.dumps(value,sort_keys=True))
        rows[:]=sorted(known,key=key,reverse=descending)+unknown


def _project(row: dict[str, Any], fields: list[str]) -> dict[str, Any]:
    return {field: _field(row, field) for field in fields}


def _execute_query(plan: dict[str, Any], db: dict[str, Any], helper: Any, *, unbounded: bool = False) -> dict[str, Any]:
    entity = str(plan.get("entity", "sectors")).lower()
    if entity not in ALLOWED_ENTITIES:
        raise PlanError(f"Unsupported entity: {entity}")
    rows = helper.item_rows(db, entity)
    schema=fields_for(entity, rows)
    if plan.get("source_list"):schema["list_order"]=["integer"]
    if plan.get("neighbor"):schema["matching_neighbor_count"]=["integer"]
    def column(name):
        if not isinstance(name,str):raise PlanError('Field names must be strings')
        name=field_name(entity,name)
        if not valid_field(name,schema):raise PlanError(f"Unknown field {name!r} for {entity}. Use describe_twxdb_schema for valid fields; no query was executed.")
        return name
    plan=dict(plan)
    if plan.get('select'):plan['select']=[column(f) for f in plan['select']]
    plan['where']=[dict(c,field=column(c.get('field'))) for c in plan.get('where',[])]
    plan['sort']=[column(f) if isinstance(f,str) else dict(f,field=column(f.get('field'))) for f in plan.get('sort',[])]
    for key in ('aggregate_field','group_by'):
        if key in plan:plan[key]=column(plan[key])
    rows = _apply_source_list(rows, plan)
    rows = [row for row in rows if _matches_all(row, plan.get("where", []))]
    sector_rows = {row["sector"]: row for row in helper.item_rows(db, "sectors")}
    neighbor=plan.get('neighbor')
    if neighbor:
        neighbor=dict(neighbor);sector_schema=fields_for('sectors',sector_rows.values());conditions=[]
        for condition in neighbor.get('where',[]):
            name=field_name('sectors',condition.get('field',''))
            if not valid_field(name,sector_schema):raise PlanError(f'Unknown neighbor sector field: {name}')
            conditions.append(dict(condition,field=name))
        neighbor['where']=conditions
    rows = _apply_neighbor_filter(rows, sector_rows, neighbor)

    sort_fields = plan.get("sort", [])
    if sort_fields:
        _sort_rows(rows, sort_fields)
    total_count = len(rows)

    aggregate = plan.get("aggregate", "rows")
    unknown_count=0
    if aggregate == "count":
        value: Any = len(rows)
    elif aggregate == "sum":
        field = str(plan.get("aggregate_field", "fighter_qty"))
        values=[_field(row,field) for row in rows]
        sentinel=entity=='planets' and field in {'level','fighters','fuel','org','equ','fuel_colonists','org_colonists','equ_colonists','construction_days'}
        known=[v for v in values if v is not None and not (sentinel and v==-1)]
        unknown_count=len(values)-len(known)
        if any(not isinstance(v,(int,float)) or isinstance(v,bool) for v in known):raise PlanError('Sum requires a numeric field')
        value = sum(known)
    elif aggregate == "group_count":
        field = str(plan.get("group_by"))
        value = dict(sorted(Counter(str(_field(row, field)) for row in rows).items()))
    elif aggregate == "rows":
        select = plan.get("select")
        value = [_project(row, select) for row in rows] if select else rows
        if plan.get('distinct'):
            seen=set();value=[r for r in value if not (json.dumps(r,sort_keys=True) in seen or seen.add(json.dumps(r,sort_keys=True)))]
        total_count=len(value)
        offset=max(0,int(plan.get('offset',0)));limit=total_count if unbounded else min(5000,max(1,int(plan.get('limit',100))))
        value=value[offset:offset+limit]
    else:
        raise PlanError(f"Unsupported aggregate: {aggregate}")
    result={"game": plan["game"], "op": "query", "entity": entity, "count": len(value) if isinstance(value,list) else len(rows), "result": value}
    if aggregate=='sum':result.update(unknown_count=unknown_count,complete=unknown_count==0)
    if aggregate=='rows':
        result.update(total_count=total_count,offset=offset,has_more=offset+len(value)<total_count,next_offset=offset+len(value) if offset+len(value)<total_count else None)
    return result


def _resolve_sector(value: Any, header: dict[str, Any]) -> int:
    aliases = {
        "stardock": "stardock",
        "dock": "stardock",
        "alpha": "alpha_centauri",
        "alpha_centauri": "alpha_centauri",
        "rylos": "rylos",
        "terra": None,
    }
    if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
        return int(value)
    key = str(value).lower().replace(" ", "_")
    compact = key.replace("_", "")
    if compact.startswith("sector") and compact[6:].isdigit():
        return int(compact[6:])
    if compact.startswith("#") and compact[1:].isdigit():
        return int(compact[1:])
    if key == "terra":
        return 1
    header_key = aliases.get(key)
    if header_key:
        return int(header[header_key])
    raise PlanError(f"Unknown sector reference: {value!r}")


def _execute_path(plan: dict[str, Any], db: dict[str, Any]) -> dict[str, Any]:
    start = _resolve_sector(plan.get("from"), db["header"])
    destination = _resolve_sector(plan.get("to"), db["header"])
    avoid = {_resolve_sector(value, db["header"]) for value in plan.get("avoid", [])}
    queue: deque[int] = deque([start])
    previous: dict[int, int | None] = {start: None}
    while queue:
        current = queue.popleft()
        if current == destination:
            break
        for target in db["sectors"].get(current, {}).get("warps", []):
            if target in avoid or target in previous:
                continue
            previous[target] = current
            queue.append(target)
    if destination not in previous:
        route: list[int] = []
    else:
        route = []
        current: int | None = destination
        while current is not None:
            route.append(current)
            current = previous[current]
        route.reverse()
    return {
        "game": plan["game"], "op": "path", "from": start, "to": destination,
        "found": bool(route), "hops": max(0, len(route) - 1) if route else None, "route": route,
    }


def execute_plan(plan: str | dict[str, Any], *, unbounded: bool = False) -> dict[str, Any]:
    plan = _as_plan(plan)
    op = str(plan.get("op", "query")).lower()
    if op == "unsupported":
        return {"op": "unsupported", "reason": plan.get("reason", "unsupported question")}
    game = plan.get("game")
    if not isinstance(game, str) or not game.strip():
        raise PlanError("Plan requires a game name")
    if Path(game).name!=game or game in (".","..") or "\\" in game:raise PlanError("Game must be an XDB basename")
    xdb = GAMES_DIR / f"{game}.xdb"
    if not xdb.is_file():
        raise PlanError(f"Game database not found: {xdb}")
    helper = _load_helper()
    db = helper.load_xdb(xdb)
    if op == "query":
        result = _execute_query(plan, db, helper, unbounded=unbounded)
    elif op == "path":
        result = _execute_path(plan, db)
    else:
        raise PlanError(f"Unsupported operation: {op}")
    result["xdb_mtime"] = db["mtime_iso"]
    return result


def describe_schema(game: str, entity: str | None = None) -> dict[str, Any]:
    from .schema import ROOTS
    if Path(game).name!=game or game in ('.','..') or '\\' in game:raise PlanError('Game must be an XDB basename')
    helper=_load_helper();db=helper.load_xdb(GAMES_DIR / (game+'.xdb'))
    names=[entity] if entity else list(ROOTS)
    entities={}
    for name in names:
        if name not in ROOTS:raise PlanError('Unknown entity: '+str(name))
        rows=helper.item_rows(db,name)
        entities[name]={'record_count':len(rows),'fields':fields_for(name,rows)}
    return {'game':game,'xdb_version':db['header']['version'],'xdb_mtime':db['mtime_iso'],'entities':entities,
        'notes':['Fields with null values are unknown, not zero. Planet quantities of -1 mean not observed.',
                 'users and players are derived from observed names and ownership; they are not a complete account database.',
                 'Use numeric array indexes in field paths (warps.0, ships.0.owner). Dynamic variables use vars.NAME.',
                 'Ports use amount.equ/buy.equ/pct.equ; planets use equ. Sector planet_count counts planets, not equipment.',
                 'Queries return up to 100 records by default, maximum 5000. Follow next_offset while has_more is true.']}
