#!/usr/bin/env python3
"""Exercise the actual self-contained stdio MCP launcher with its real small planner and no GUI."""
import argparse,json,os,subprocess,time,selectors
from pathlib import Path

def main():
    parser=argparse.ArgumentParser();parser.add_argument('launcher');parser.add_argument('--game',default='microblaster_network_s');parser.add_argument('--output',required=True);args=parser.parse_args()
    env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
    process=subprocess.Popen([args.launcher],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
    sequence=0
    def rpc(method,params):
        nonlocal sequence;sequence+=1
        process.stdin.write(json.dumps({'jsonrpc':'2.0','id':sequence,'method':method,'params':params})+'\n');process.stdin.flush()
        with selectors.DefaultSelector() as selected:
            selected.register(process.stdout,selectors.EVENT_READ)
            if not selected.select(30):raise RuntimeError('MCP response timed out')
        result=json.loads(process.stdout.readline());assert result.get('id')==sequence,result
        if 'error' in result:raise RuntimeError(str(result['error']))
        return result['result']
    def tool(name,arguments):return rpc('tools/call',{'name':name,'arguments':arguments})
    try:
        initialized=rpc('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'TWXDB regression','version':'1'}})
        tools=rpc('tools/list',{})['tools'];catalog=next(t for t in tools if t['name']=='query_twxdb_records')['description'];assert 'equ_colonists' in catalog and 'ships.[].owner' in catalog and 'port.amount.equ' in catalog
        assert {'query_twxdb','query_twxdb_records','describe_twxdb_schema'} <= {t['name'] for t in tools}
        start=time.monotonic();answer=tool('query_twxdb',{'game':args.game,'question':f'What is the equipment count for planet #22 in {args.game}?'})
        assert not answer['isError'],answer
        result=answer['structuredContent'];row=result['answer']['result'][0];assert row['id']==22 and isinstance(row['equ'],int),row
        assert result['plan']['where']==[{'field':'id','op':'=','value':22}]
        lookup={'question':'equipment for planet #22','mcp_calls':1,'seconds':round(time.monotonic()-start,3),'answer_text':result['answer_text'],'data':row,'planner':result['plan']['_planner']}
        assert lookup['planner']['model_used'] and lookup['planner']['model_requests']==1
        # Reproduce the exact MSL incident through the real installed planner.
        question=f'using the twxdb helper, give me a list of sectors in {args.game} that are in MSLs'
        msl=tool('query_twxdb',{'game':args.game,'question':question})
        assert not msl['isError'],msl
        msl=msl['structuredContent'];plan=msl['plan'];page=msl['answer']
        assert plan['game']==args.game and plan['where']==[{'field':'mslsec','op':'truthy'}],plan
        assert plan['_planner']['model_used'] and plan['_planner']['model_requests']==1
        # Independently inspect saved XDB flags, not the planner or query executor.
        import sys
        install=Path(args.launcher).resolve().parent
        sys.path.insert(0,str(install/'app'))
        from twxdb_assistant import twxdb_query
        from twxdb_assistant.paths import resolve_games_dir
        db=twxdb_query.load_xdb(resolve_games_dir()/(args.game+'.xdb'))
        expected=sorted(n for n,sector in db['sectors'].items() if twxdb_query.truthy(twxdb_query.get_var(sector,'MSLSEC')))
        actual=[r['sector'] for r in page['result']]
        assert actual==expected[:len(actual)] and page['total_count']==len(expected)
        assert page['has_more']==(len(actual)<len(expected))
        msl_lookup={'question':question,'mcp_calls':1,'planner':plan['_planner'],
            'returned_count':len(actual),'total_count':len(expected),'has_more':page['has_more'],
            'matches_saved_MSLSEC_flags':True}
        schema=tool('describe_twxdb_schema',{'game':args.game})['structuredContent'];coverage={}
        for entity,description in schema['entities'].items():
            data=tool('query_twxdb_records',{'game':args.game,'entity':entity,'limit':1})
            assert not data['isError'],(entity,data)
            payload=data['structuredContent']['answer'];assert payload['count']<=1
            coverage[entity]={'total_count':payload['total_count'],'schema_fields':len(description['fields']),'status':'pass'}
        bad=tool('query_twxdb_records',{'game':args.game,'entity':'planets','select':['pct.']});assert bad['isError']
        report={'server':initialized['serverInfo'],'planet_lookup':lookup,'msl_lookup':msl_lookup,'entities':coverage,'unknown_column_rejected':True,'status':'pass'}
        Path(args.output).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
    finally:
        process.stdin.close()
        try:process.wait(timeout=5)
        except subprocess.TimeoutExpired:process.terminate();process.wait(timeout=5)
if __name__=='__main__':main()
