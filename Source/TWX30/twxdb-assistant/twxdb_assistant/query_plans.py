"""Deterministic, bounded grammar for record/field lookups and numeric comparisons.

Do not ignore unparsed qualifiers. Unsupported forms go to the schema-guided
planner, with equipment questions rejected rather than accepting a wrong plan.
"""
from __future__ import annotations
import re
from .schema import ROOTS, fields_for, field_name, valid_field
from .executor import PlanError

ENTITY = r'(header|sectors?|planets?|ports?|traders?|ships?|fighters?|mines?|deadends?|users?|players?|vars|variables?)'
ALIASES={'variable':'vars','variables':'vars','var':'vars','header':'header'}
def entity_name(word):return ALIASES.get(word,word if word.endswith('s') else word+'s')
def base(game,entity):return {'v':1,'op':'query','game':game,'entity':entity,'where':[],'aggregate':'rows'}
def field(entity,text):
    name=field_name(entity,re.sub(r'^(?:the|their|its)\s+','',text.strip()))
    if not valid_field(name,fields_for(entity)):raise PlanError(f"Unknown requested field {text!r} for {entity}. Call describe_twxdb_schema for available fields. The requested information has not been obtained.")
    return name

def numeric(text):
    m=re.fullmatch(r'([\d,]+(?:\.\d+)?)\s*(million|billion|thousand|[kmb])?',text.strip())
    if not m:raise PlanError('Invalid numeric quantity')
    value=float(m[1].replace(',',''))*{'million':1e6,'m':1e6,'billion':1e9,'b':1e9,'thousand':1e3,'k':1e3,None:1}[m[2]]
    return int(value) if value.is_integer() else value

PREFIX=r'(?:please\s+)?(?:what (?:is|are|about)|show(?: me)?|get|give me|list|tell me)\s+'
def deterministic_plan(game,question):
    q=question.strip().lower().rstrip('?.!')
    q=re.sub(r'^using (?:the )?twxdb (?:tool|helper),?\s*','',q)
    q=re.sub(r'\b(?:in|for|from)\s+`?'+re.escape(game.lower())+r'`?(?:\s+game)?\b','',q)
    q=re.sub(r'\s+',' ',q).strip()
    # Match the complete request: never discard extra filters or an unknown
    # expansion of the acronym. MSL membership is the saved MSLSEC marker.
    msl=r'(?:msls?|major space lanes?)'
    if (re.fullmatch(PREFIX+r'(?:a list of\s+)?(?:(?:all|the|every known)\s+)?'+msl+r'\s+sectors?',q)
        or re.fullmatch(PREFIX+r'(?:a list of\s+)?(?:(?:all|the)\s+)?sectors\s+(?:(?:that are|which are)\s+)?(?:in|marked)\s+'+msl,q)
        or re.fullmatch(r'(?:which|what) sectors are (?:in|marked)\s+'+msl,q)):
        p=base(game,'sectors')
        p.update(where=[{'field':'mslsec','op':'truthy'}],select=['sector'],sort=['sector'])
        return p
    m=re.fullmatch(r'how (?:much|many)\s+(.+?)\s+(?:(?:is|are)(?: there)?\s+)?(?:on|in|at)\s+(?:the\s+)?'+ENTITY+r'\s+(?:(?:id|number)\s*|#\s*)?(\d+)',q)
    if m:q=f'what is {m[1]} for {m[2]} {m[3]}'
    # A complete record exposes every field, including nested objects and lists.
    m=re.fullmatch(PREFIX+r'(?:(?:all (?:fields|values|columns|details|information)|everything)(?:\s+(?:for|about|of))?\s+)?(?:the\s+)?'+ENTITY+r'\s+(?:(?:with\s+)?(?:id|number)\s*|#\s*)?(\d+)',q)
    if m:
        entity=entity_name(m[1]);p=base(game,entity)
        if entity not in ('planets','sectors','ports','fighters','mines'):raise PlanError('This entity is identified by sector and index or name, not a global numeric ID. Use the schema and query_twxdb_records.')
        p['where']=[{'field':'id' if entity=='planets' else 'sector','op':'=','value':int(m[2])}];return p
    # Any documented field of a numbered entity, not just equipment.
    m=re.fullmatch(PREFIX+r'(?:the\s+)?(.+?)\s+(?:for|of|on|in)\s+(?:the\s+)?'+ENTITY+r'\s+(?:(?:with\s+)?(?:id|number)\s*|#\s*)?(\d+)(?:\s+on ?board)?',q)
    if m:
        requested,word,number=m.groups();entity=entity_name(word);p=base(game,entity)
        if entity not in ('planets','sectors','ports','fighters','mines'):raise PlanError('Use sector and index or name for this entity; use query_twxdb_records.')
        identity='id' if entity=='planets' else 'sector';p['where']=[{'field':identity,'op':'=','value':int(number)}]
        if requested not in ('all fields','all columns','all values','all details','everything'):
            requested=re.sub(r'\s+on ?board$','',requested)
            columns=[field(entity,f) for f in re.split(r',\s*|\s+and\s+',requested)]
            p['select']=list(dict.fromkeys([identity,'sector']+columns))
        return p
    m=re.fullmatch(PREFIX+r'(?:the\s+)?(.+?)\s+(?:for|of|on|in)\s+(?:the\s+)?'+ENTITY+r'(?:\s+in sector\s+#?(\d+))?',q)
    if m:
        requested,word,sector=m.groups();entity=entity_name(word);p=base(game,entity)
        if sector:p['where']=[{'field':'sector','op':'=','value':int(sector)}]
        if requested not in ('all fields','all columns','all values','all details','everything'):
            p['select']=[field(entity,f) for f in re.split(r',\s*|\s+and\s+',requested)]
        return p
    # Largest/smallest observed value, preserving unknown (-1) as unknown.
    m=re.fullmatch(r'(?:which|what)\s+'+ENTITY+r'\s+(?:has|with)\s+(?:the\s+)?(most|highest|largest|least|lowest|smallest)(?:\s+(?:amount|count)\s+of)?\s+(.+?)(?:\s+on ?board)?',q)
    if m:
        entity=entity_name(m[1]);column=field(entity,m[3]);p=base(game,entity)
        p.update(select=list(dict.fromkeys([c for c in ('id','name','sector') if c in ROOTS[entity].split()]+[column])),where=[{'field':column,'op':'>=','value':0}],sort=[{'field':column,'direction':'asc' if m[2] in ('least','lowest','smallest') else 'desc'}],limit=1);return p
    # Planet resource threshold, optionally returning a unique sector list.
    op=r'(more than|greater than|over|at least|less than|under|at most|>=|<=|>|<|=)'
    number=r'([\d,]+(?:\.\d+)?\s*(?:million|billion|thousand|[kmb])?)'
    m=re.fullmatch(r'(?:show(?: me)?|give me|list|tell me what)\s+(?:a list of\s+)?(?:the\s+)?(sectors|planets)(?:\s+that (?:have|contain))?(?:\s+with)?(?:\s+planets(?:\s+with)?)?\s+'+op+r'\s*'+number+r'\s+(equipment|equ|equip|fuel|fuel ore|organics|org)(?:\s+on ?board|\s+on any planet)?',q)
    if m:
        target,comparison,amount,product=m.groups();p=base(game,'planets')
        p['where']=[{'field':field('planets',product),'op':{'more than':'>','greater than':'>','over':'>','at least':'>=','less than':'<','under':'<','at most':'<='}.get(comparison,comparison),'value':numeric(amount)},{'field':field('planets',product),'op':'>=','value':0}]
        p.update(select=['sector'] if target=='sectors' else ['id','sector',field('planets',product)],sort=['sector','id'],distinct=target=='sectors');return p
    m=re.fullmatch(PREFIX+r'(?:all\s+)?'+ENTITY+r'\s+(?:where|with)\s+([\w. ]+?)\s*(>=|<=|!=|=|>|<|contains)\s*(.+)',q)
    if m:
        entity=entity_name(m[1]);column=field(entity,m[2]);value=m[4]
        import json
        if value.startswith(('"',"'")):
            quoted=re.findall(r'[\"\'](.+?)[\"\']',question)
            if not quoted:raise PlanError('Unterminated quoted value')
            value=quoted[-1]
        else:
            try:value=json.loads(value)
            except ValueError:
                try:value=numeric(value)
                except PlanError:raise PlanError('Use a quoted string or a numeric/boolean/null value for the filter; compound filters require query_twxdb_records.')
        p=base(game,entity);p['where']=[{'field':column,'op':m[3],'value':value}];return p
    # Generic typed record access in natural language, including named records.
    m=re.fullmatch(PREFIX+r'(?:all\s+)?'+ENTITY+r'(?:\s+in sector\s+#?(\d+))?',q)
    if m:
        p=base(game,entity_name(m[1]));
        if m[2]:p['where']=[{'field':'sector','op':'=','value':int(m[2])}]
        return p
    m=re.fullmatch(PREFIX+r'(?:all\s+)?'+ENTITY+r'\s+(?:named|with name)\s+[\"\'](.+)[\"\']',q)
    if m:
        p=base(game,entity_name(m[1]));p['where']=[{'field':'name','op':'=','value':re.findall(r'[\"\'](.+?)[\"\']',question)[-1]}];return p
    return None

def validate_question_plan(game,question,plan):
    if not plan.get('game'):raise PlanError(f'Planner omitted the game; expected {game!r}. No query was executed.')
    if plan.get('game')!=game:raise PlanError(f'Planner game mismatch: expected {game!r}, received {plan.get("game")!r}. No query was executed.')
    if plan.get('op')=='unsupported':return plan
    entity=plan.get('entity')
    if plan.get('op')!='query' or entity not in ROOTS:return plan
    # Reject semantic omissions as well as invalid column names. A syntactically
    # valid plan is not evidence that the requested field/record was queried.
    q=question.lower()
    where=plan.get('where',[])
    reference=re.search(r'\bplanet\s+(?:(?:with\s+)?(?:id|number)\s*|#\s*)?(\d+)\b',q)
    if reference and (entity!='planets' or not any(c.get('field')=='id' and ((c.get('op','=')=='=' and c.get('value')==int(reference[1])) or (c.get('op')=='in' and int(reference[1]) in c.get('value',[]))) for c in where)):
        raise PlanError('Planner did not select the requested planet ID. No query was executed. Use query_twxdb_records with the documented id field.')
    columns=plan.get('select')
    if columns:
        selected={field_name(entity,c) for c in columns}
        requested=set()
        # Entity names and identity words are not requested measurements.
        candidates=set(ROOTS[entity].split())-{'entity','id','sector','name','type','class','game','index','sources','path','note','number','port','ships','traders','vars'}
        from .schema import ALIASES
        candidates.update(ALIASES)
        for phrase in candidates:
            if re.search(r'(?<![\w.])'+re.escape(phrase.replace('_',' '))+r'(?![\w.])',q) or re.search(r'(?<![\w.])'+re.escape(phrase)+r'(?![\w.])',q):
                name=field_name(entity,phrase)
                if valid_field(name,fields_for(entity)):requested.add(name)
        referenced={field_name(entity,c.get('field','')) for c in where}
        if plan.get('aggregate') in ('count','sum','group_count'):selected|=referenced|{plan.get('aggregate_field'),plan.get('group_by')}
        missing=requested-selected
        if missing:raise PlanError('Planner omitted requested fields: '+', '.join(sorted(missing))+'. No answer was obtained; use query_twxdb_records with these fields.')
    if re.search(r'\bplanet',q) and re.search(r'\b(equipment|equip|equ)\b',q):
        # Complex planet-resource phrasing must not be guessed by the tiny model.
        raise PlanError('This planet equipment question could not be translated reliably. Information was not obtained. Use query_twxdb_records with entity=planets and field=equ. Do not retry paraphrases.')
    return plan
