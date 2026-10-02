#!/usr/bin/env python3
"""Read-only audit: compare every exposed record/value with executor projection.

The accompanying BinaryWriter fixture tests independently verify binary decoding.
Reports include counts and schema names, never game values or header credentials.
"""
import argparse,hashlib,json,time
from pathlib import Path
from types import SimpleNamespace
from twxdb_assistant import executor
from twxdb_assistant.schema import ROOTS,fields_for

def leaves(value):
    if isinstance(value,dict):return sum(leaves(v) for v in value.values())
    if isinstance(value,list):return sum(leaves(v) for v in value)
    return 1

def main():
    parser=argparse.ArgumentParser();parser.add_argument('game');parser.add_argument('--output',required=True);args=parser.parse_args()
    start=time.monotonic();helper=executor._load_helper();path=executor.GAMES_DIR/(args.game+'.xdb');db=helper.load_xdb(path)
    cache={entity:helper.item_rows(db,entity) for entity in ROOTS}
    adapter=SimpleNamespace(item_rows=lambda _,entity:cache[entity]);entities={}
    for entity,rows in cache.items():
        fields=fields_for(entity,rows);columns=sorted({k for row in rows for k in row})
        plan={'game':args.game,'entity':entity,'select':columns,'aggregate':'rows'}
        result=executor._execute_query(plan,db,adapter,unbounded=True)
        assert len(result['result'])==len(rows),(entity,'missing rows')
        count=0
        for expected,actual in zip(rows,result['result']):
            for field,value in expected.items():
                assert actual[field]==value,(entity,field,'value mismatch');count+=leaves(value)
        entities[entity]={'records':len(rows),'scalar_values_checked':count,'schema_fields':len(fields),'fields':list(fields),'status':'pass'}
    report={'game':args.game,'xdb_version':db['header']['version'],'xdb_mtime':db['mtime_iso'],'reader_sha256':hashlib.sha256(Path(helper.__file__).read_bytes()).hexdigest(),'entities':entities,'seconds':round(time.monotonic()-start,3),'status':'pass'}
    Path(args.output).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({**{k:v for k,v in report.items() if k!='entities'},'entities':{k:{f:v for f,v in r.items() if f!='fields'} for k,r in entities.items()}}))
if __name__=='__main__':main()
