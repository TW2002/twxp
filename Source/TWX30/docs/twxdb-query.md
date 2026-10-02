# TWX XDB Query Helper

`Source/Tools/twxdb-query.py` is a portable, standard-library Python helper for
answering current-state TradeWars questions from a TWX30 `.xdb` database.

Use this helper before writing ad hoc parsers. The `.xdb` is the current
database snapshot; game logs are historical evidence and can be stale after
planet moves, fighter changes, port updates, or later scans.

## Setup

The helper needs Python 3 and a TWX30 `.xdb` file.

By default it looks in `~/twx/games`. To use another location:

```bash
export TWX_GAMES_DIR=/path/to/twx/games
```

Run by game name:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s summary
```

Run by explicit file:

```bash
Source/Tools/twxdb-query.py --xdb /path/to/game.xdb summary
```

## Current-State Rule

For planet location questions, use the top-level planet table:

- `planets[].last_sector` is the current known planet location.
- `query sectors` exposes `planet_count`, `planet_ids`, and `planet_names`
  from that authoritative planet table.
- `sector_planet_names` and `sector_planet_name_count` are the lightweight
  names last seen in a sector display. They are useful display evidence, but
  they are not the best authority for current planet ID placement.

Do not group current planets by old log blocks. A planet detail page in a log
only proves where that planet was when the line was recorded.

TWX30 currently persists planet ID, name, last sector, observed order, owner,
level, shielded status, fighters, fuel ore, organics, equipment, and observed
planet construction status: `construction_known`, `construction_underway`,
`construction_type`, and `construction_days`. It does not persist planet
colonist counts.

## Commands

Summary:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s summary
```

`summary` and `--count` output include both `mtime` and `mtime_iso` so an agent
can report the freshness of the `.xdb` snapshot used for the answer.

Show specific sectors:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s sector 7029 11802
```

Filter ports:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s ports --product equ --buys --min-amount 2000 --min-pct 50
```

Filter sector parameters:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s params --name FIGSEC --value 1
```

Filter planets using current `last_sector`:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s planets --min-level 4 --shielded --fields id,name,sector,level,fighters,fuel,org,equ,construction_underway,construction_type,construction_days
```

Discover query fields:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s fields sectors
Source/Tools/twxdb-query.py --game microblaster_network_s fields planets
```

Generic query over any XDB entity:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s query sectors --where figsec=1 --where 'fighters.qty>500' --fields sector,fighters.qty,planet_count
```

Supported entities:

- `header`
- `sectors`
- `ports`
- `planets`
- `fighters`
- `mines`
- `deadends`
- `ships`
- `traders`
- `users`
- `players`
- `vars`

`users` and `players` are derived views. TWX30 does not persist a standalone
user roster in the `.xdb`; this view is built from persisted trader names, ship
owners, planet owners, sector fighter owners, and mine owners.

## Filters

Use `--where` one or more times. Field paths are dot-separated and
case-insensitive.

Supported forms:

```text
field=value
field!=value
field>N
field>=N
field<N
field<=N
field~text
field
!field
```

Examples:

```bash
# Sectors with more than three current planets.
Source/Tools/twxdb-query.py --game microblaster_network_s query sectors --where 'planet_count>3' --fields sector,planet_count,planet_ids

# Current corp/friendly fighter sectors over 500 fighters.
Source/Tools/twxdb-query.py --game microblaster_network_s query sectors --where 'fighters.owner=belong to your Corp' --where 'fighters.qty>500' --fields sector,fighters.qty

# Same question through the explicit fighters entity.
Source/Tools/twxdb-query.py --game microblaster_network_s query fighters --where friendly --where 'qty>500' --fields sector,qty,owner,type

# Enemy ports buying equipment with useful stock.
Source/Tools/twxdb-query.py --game microblaster_network_s query ports --where 'buy.equ=True' --where 'amount.equ>=2000' --fields sector,type,amount.equ,pct.equ

# Planets currently in one sector.
Source/Tools/twxdb-query.py --game microblaster_network_s planets --sector 7029 --fields id,name,sector,owner,level,shielded,fighters

# Deadends by size.
Source/Tools/twxdb-query.py --game microblaster_network_s query deadends --fields door,deepest,size,sectors --sort size --desc --limit 20

# Ports in deadends that also have friendly fighters over 250,000.
Source/Tools/twxdb-query.py --game microblaster_network_s query ports --where deadend --where friendly --where 'fighters.qty>250000' --fields sector,type,amount.fuel,amount.org,amount.equ,deadend_size

# Group non-empty fighter sectors by owner.
Source/Tools/twxdb-query.py --game microblaster_network_s query fighters --where 'qty>0' --group-by owner --fields group,count,sector_count

# Show player/user evidence derived from all persisted owner/name sources.
Source/Tools/twxdb-query.py --game microblaster_network_s query users --fields name,sources,sector_count,total_fighters --sort sector_count --desc
```

## Writing List Files

For one-sector-per-line files, use `--one-per-line` with `--output`:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s query sectors --where figsec=1 --where '!mslsec' --one-per-line sector --output ~/twx/micro_s.list
```

For JSON:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s query planets --where 'level>=4' --json --output /tmp/planets.json
```

Find planets where MTC has observed an upgrade under construction:

```bash
Source/Tools/twxdb-query.py --game microblaster_network_s query planets --where construction_underway --fields sector,id,level,construction_type,construction_days
```

## Agent Guidance

When an agent answers current game-state questions:

1. Resolve the exact game name and XDB path.
2. Report the XDB path and modification time when the answer depends on
   freshness.
3. Query the current XDB first.
4. Use logs only for timeline, causality, or fields not persisted in the XDB.
5. If using log-derived fields, reconcile planet IDs and sectors against
   `planets.last_sector` before grouping by sector.
6. If a field is not persisted, say so instead of fabricating a current value.
