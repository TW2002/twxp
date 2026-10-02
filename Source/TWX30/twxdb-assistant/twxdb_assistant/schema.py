"""Queryable XDB fields. Null/unknown data is distinct from an invalid column."""
from __future__ import annotations
import re
from typing import Any

DEADEND = 'deadend deadend_door deadend_deepest deadend_size deadend_depth'
ROOTS = {
 'header': 'entity program version sectors stardock alpha_centauri rylos address description server_port listen_port login_script password login_name game icon_file use_rlogin use_login rob_factor steal_factor last_port_cim_ticks command_char opentw_universe_id opentw_topology_hash opentw_topology_synced_ticks path mtime mtime_iso',
 'sectors': 'entity sector warps warps_in warp_count warp_in_count explored density anomaly navhaz constellation beacon updated_ticks figsec mslsec busted fighter_qty fighter_owner fighter_type friendly fighters armids limpets port ships ship_count traders trader_count sector_planet_names sector_planet_name_count planet_ids planet_names planet_count vars',
 'planets': 'entity id name sector last_sector observed_order owner level shielded fighters fuel org equ fuel_colonists org_colonists equ_colonists construction_known construction_type construction_days construction_underway sector_figsec sector_mslsec sector_fighters has_sector_record note',
 'ports': 'entity sector name dead build class type buy amount pct updated_ticks figsec mslsec busted fighter_qty fighter_owner fighter_type friendly fighters planet_count',
 'fighters': 'entity sector qty owner figtype type friendly figsec mslsec busted port_exists planet_count warps warps_in warp_count warp_in_count',
 'mines': 'entity kind sector qty owner figtype friendly figsec mslsec port_exists planet_count',
 'deadends': 'entity door deepest max_depth sectors size depth_by_sector',
 'ships': 'entity sector index name owner type fighters figsec mslsec port_exists planet_count',
 'traders': 'entity sector index name type ship fighters display_label figsec mslsec port_exists planet_count',
 'users': 'entity name sources sectors sector_count friendly total_fighters',
 'vars': 'entity sector name value',
}
ROOTS['players'] = ROOTS['users']
PRODUCTS = {'equipment':'equ','equip':'equ','equ':'equ','organics':'org','organic':'org','org':'org','fuel ore':'fuel','fuelore':'fuel','ore':'fuel','fuel':'fuel'}
ALIASES = {'planet id':'id','planet number':'id','sector number':'sector','citadel level':'level','nav hazard':'navhaz','navigation hazard':'navhaz','shield status':'shielded','fighter count':'fighters','equipment count':'equ','equipment amount':'equ','amount of equipment':'equ','equipment quantity':'equ','equipment colonists':'equ_colonists','organics colonists':'org_colonists','fuel ore colonists':'fuel_colonists','number of warps':'warp_count','port equipment':'port.amount.equ','port fuel ore':'port.amount.fuel','port organics':'port.amount.org','equipment onboard':'equ',**PRODUCTS}

def fields_for(entity: str, rows=()) -> dict[str, list[str]]:
    if entity not in ROOTS: raise ValueError(f'Unknown entity: {entity}')
    fields={k:set() for k in ROOTS[entity].split()}
    if entity not in ('header','vars','users','players','deadends'):
        fields.update({k:set() for k in DEADEND.split()})
    def add(path,value):
        kind='null' if value is None else 'boolean' if isinstance(value,bool) else 'integer' if isinstance(value,int) else 'number' if isinstance(value,float) else 'object' if isinstance(value,dict) else 'array' if isinstance(value,list) else 'string'
        fields.setdefault(path,set()).add(kind)
        if isinstance(value,dict):
            if path in ('vars','sources','depth_by_sector'): fields.setdefault(path+'.*',set()).add('string' if path=='vars' else 'integer');return
            for key,item in value.items(): add(path+'.'+str(key),item)
        elif isinstance(value,list):
            for item in value:add(path+'.[]',item)
    for row in rows:
        for key,value in row.items():add(key,value)
    space='qty owner figtype'
    for prefix in ('fighters','armids','limpets') if entity=='sectors' else ('sector_fighters',) if entity=='planets' else ('fighters',) if entity=='ports' else ():
        for key in space.split():fields.setdefault(prefix+'.'+key,set())
    if entity=='sectors':
        fields.setdefault('fighters.type',set());fields.setdefault('fighters.friendly',set())
        fields.setdefault('vars.*',set()).add('string')
        for kind,keys in [('ships','name owner type fighters'),('traders','name type ship fighters display_label')]:
            for key in keys.split():fields.setdefault(kind+'.[].'+key,set())
    if entity in ('ports','sectors'):
        prefix='' if entity=='ports' else 'port.'
        for key in 'name dead build class type updated_ticks buy pct amount'.split():fields.setdefault(prefix+key,set())
        for key in ('buy','pct','amount'):
            for product in ('fuel','org','equ'):fields.setdefault(prefix+key+'.'+product,set())
    for key in ('warps','warps_in','planet_ids','planet_names','sector_planet_names','sectors'):
        if key in fields:fields.setdefault(key+'.[]',set())
    if entity in ('users','players'):fields.setdefault('sources.*',set())
    if entity=='deadends':fields.setdefault('depth_by_sector.*',set())
    return {key:sorted(value) or ['unknown'] for key,value in sorted(fields.items())}

def field_name(entity: str, name: str) -> str:
    if name.strip().lower()=='fighter count' and entity in ('ports','sectors','fighters','mines'):return 'fighter_qty' if entity in ('ports','sectors') else 'qty'
    if name.startswith('vars.') or name.startswith('sources.'):return name
    text=name.strip().lower().replace(' ', '_')
    alias=ALIASES.get(name.strip().lower())
    if alias: text=alias
    if entity=='ports' and text in ('equ','org','fuel'):text='amount.'+text
    if entity=='sectors' and text=='fighters':return 'fighters'
    parts=text.split('.')
    parts=[PRODUCTS.get(part,part) for part in parts]
    return '.'.join(parts)

def valid_field(field: str, fields: dict) -> bool:
    if field in fields:return True
    indexed=re.sub(r'(?<=\.)\d+(?=\.|$)','[]',field)
    if indexed in fields:return True
    return any(key.endswith('.*') and field.startswith(key[:-1]) and len(field)>len(key)-1 for key in fields)
