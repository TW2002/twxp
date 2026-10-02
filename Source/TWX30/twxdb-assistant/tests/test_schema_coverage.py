from __future__ import annotations
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from twxdb_assistant import executor, mcp_server
from twxdb_assistant.schema import ROOTS, fields_for
from twxdb_assistant.query_plans import deterministic_plan, validate_question_plan

FIXTURES=Path(__file__).parent/'Fixtures'/'Xdb'

class SchemaCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.helper=executor._load_helper();cls.db=cls.helper.load_xdb(FIXTURES/'v19.xdb')
    def execute(self,entity,**options):
        return executor._execute_query({'game':'fixture','entity':entity,**options},self.db,self.helper)
    def test_binarywriter_versions_and_every_raw_record_field(self):
        for version in range(10,20):
            with self.subTest(version=version):
                db=self.helper.load_xdb(FIXTURES/f'v{version}.xdb');h=db['header'];sector=db['sectors'][42];planet=db['planets'][22]
                expected_header={'program':'TWX30','version':version,'sectors':100000,'stardock':6543,'alpha_centauri':11,'rylos':12,'address':'fixture.invalid','description':'Fixture café','server_port':2002,'listen_port':2300,'login_script':'login.ts','password':'fixture-only-password','login_name':'Fixture user','game':'Ω','icon_file':'fixture.ico','use_rlogin':True,'use_login':False,'rob_factor':3,'steal_factor':4,'last_port_cim_ticks':637000000000000000,'command_char':'§' if version>=11 else '', 'opentw_universe_id':'universe-fixture' if version>=17 else '', 'opentw_topology_hash':'hash-fixture' if version>=17 else '', 'opentw_topology_synced_ticks':638000000000000000 if version>=17 else 0}
                self.assertEqual(h,expected_header)
                expected_planet={'id':22,'name':'Planet café','last_sector':42,'observed_order':1,'owner':'Planet Corp','level':6,'shielded':True,'fighters':7654,'fuel':3000000,'org':4000000,'equ':2000000,'fuel_colonists':111 if version>=19 else -1,'org_colonists':222 if version>=19 else -1,'equ_colonists':333 if version>=19 else -1,'construction_known':version>=18,'construction_type':'Citadel' if version>=18 else '', 'construction_days':8 if version>=18 else -1,'construction_underway':version>=18}
                self.assertEqual(planet,expected_planet)
                expected_sector={'number':42,'warps':[70000 if version>=16 else 43],'warps_in':[70000 if version>=16 else 43], 'port':{'name':'Port café','dead':False,'build':2,'class':3,'buy':[True,False,True],'pct':[30,31,32],'amount':[12000,12001,12002],'updated_ticks':639000000000000000},'navhaz':7,'fighters':{'qty':1234,'owner':'Corp fighters','figtype':2},'armids':{'qty':17,'owner':'Corp armids','figtype':2},'limpets':{'qty':23,'owner':'Corp limpets','figtype':2},'constellation':'Constellation Ω','beacon':'Beacon §','updated_ticks':637123456789000000,'anomaly':True,'density':987,'warp_count':1,'explored':2,'ships':[{'name':'Ship café','owner':'Owner café','type':'Merchant Cruiser','fighters':3456}],'traders':[{'name':'Trader café','type':'Scout','ship':'Trader ship','fighters':4567,'display_label':'Admiral Trader café [7]' if version>=15 else ''}],'planet_names':['Display planet'],'vars':{'FIGSEC':'1','MSLSEC':'0','Custom.Mixed.Name':'Saved value'}}
                self.assertEqual(sector,expected_sector)
    def test_all_entities_and_all_observed_fields_round_trip(self):
        for entity in ROOTS:
            with self.subTest(entity=entity):
                raw=self.helper.item_rows(self.db,entity)
                self.assertEqual(self.execute(entity)['result'],raw)
                for row in raw:
                    for key,value in row.items():
                        self.assertEqual(executor._field(row,key),value)
                for key in fields_for(entity,raw):
                    if '*' in key or '[]' in key:continue
                    answer=self.execute(entity,select=[key])['result']
                    self.assertEqual([r[key] for r in answer],[executor._field(r,key) for r in raw])
    def test_nested_arrays_dynamic_variables_and_entity_semantics(self):
        self.assertEqual(self.execute('sectors',select=['ships.0.owner','vars.Custom.Mixed.Name'])['result'][0],{'ships.0.owner':'Owner café','vars.Custom.Mixed.Name':'Saved value'})
        self.assertEqual(self.execute('planets',select=['equipment'])['result'][0]['equ'],2000000)
        self.assertEqual(self.execute('ports',select=['equipment','buy.equipment'])['result'][0],{'amount.equ':12002,'buy.equ':True})
        self.assertEqual(self.execute('traders')['result'][0]['fighters'],4567)
        self.assertEqual(self.execute('mines')['result'][0]['figtype'],2)
    def test_unknown_fields_fail_before_filter_even_without_rows(self):
        for entity in ROOTS:
            for clause in ({'select':['pct.']},{'where':[{'field':'nonexistent','op':'=','value':0}]},{'sort':['wrong']},{'aggregate':'sum','aggregate_field':'wrong'}):
                with self.subTest(entity=entity,clause=clause),self.assertRaises(executor.PlanError):self.execute(entity,**clause)
        empty={**self.db,'planets':{}}
        with self.assertRaises(executor.PlanError):executor._execute_query({'game':'x','entity':'planets','select':['nonsense']},empty,self.helper)
    def test_null_is_not_zero_and_equality_is_not_lost_to_ordering_type_errors(self):
        self.assertFalse(executor._matches({'v':False},{'field':'v','op':'=','value':None}))
        self.assertTrue(executor._matches({'v':None},{'field':'v','op':'=','value':None}))
        self.assertTrue(executor._matches({'v':'Corp'},{'field':'v','op':'!=','value':None}))
        self.assertFalse(executor._matches({'v':None},{'field':'v','op':'>','value':0}))
        self.assertEqual(self.execute('planets',where=[{'field':'shielded','op':'=','value':None}])['result'][0]['id'],23)
    def test_pagination_and_aggregates_do_not_claim_full_result(self):
        first=self.execute('planets',limit=1);second=self.execute('planets',offset=first['next_offset'],limit=1)
        self.assertTrue(first['has_more']);self.assertEqual(first['total_count'],2);self.assertFalse(second['has_more']);self.assertNotEqual(first['result'],second['result'])
        self.assertEqual(self.execute('planets',aggregate='count',limit=1)['result'],2)
        summed=self.execute('planets',aggregate='sum',aggregate_field='equ');self.assertEqual(summed['result'],2000000);self.assertEqual(summed['unknown_count'],1);self.assertFalse(summed['complete'])
    def test_truncated_planet_table_is_an_error_not_zero_planets(self):
        with tempfile.TemporaryDirectory() as root:
            bad=Path(root)/'bad.xdb';bad.write_bytes((FIXTURES/'v19.xdb').read_bytes()[:-4])
            with self.assertRaises(EOFError):self.helper.load_xdb(bad)
    def test_exact_user_questions_call_planner_once_and_keep_correct_resource(self):
        questions=[
            'What is the equipment count for planet #22 in microblaster_network_s?',
            'What is the equipment count for planet with ID 22 in microblaster_network_s?',
            'Get the equipment amount for planet ID 22 in microblaster_network_s',
            'what planet has the most equipment on board?',
            'using the twxdb tool, give me a list of sectors in microblaster_network_s that have planets with more than 1 million equipment on board',
            'show me sectors with greater than 1 million equ on any planet']
        with patch.object(mcp_server.PLANNER,'_get_endpoint',return_value='fixture-endpoint'), patch('twxdb_assistant.mcp_server.request_plan',side_effect=lambda endpoint,game,question,**kw: deterministic_plan(game,question)) as request:
            for question in questions:
                with self.subTest(question=question):
                    plan=mcp_server.PLANNER.plan('microblaster_network_s',question)
                    result=executor._execute_query(plan,self.db,self.helper)
                    self.assertEqual(result['result'][0].get('equ',2000000),2000000);self.assertEqual(result['result'][0]['sector'],42)
            self.assertEqual(request.call_count,len(questions))
    def test_all_schema_fields_available_as_direct_natural_lookups(self):
        for entity in ROOTS:
            for column in fields_for(entity):
                if '*' in column or '[]' in column:continue
                with self.subTest(entity=entity,column=column):
                    plan=deterministic_plan('fixture',f'What is {column} for {entity}?')
                    self.assertIsNotNone(plan);self.assertIn(column,plan['select'])
    def test_friendly_fields_and_generic_entity_filters(self):
        for question,entity,column in [('how much equipment is on planet #22?','planets','equ'),('what is equipment colonists for planet 22?','planets','equ_colonists'),('what is port equipment for sector 42?','sectors','port.amount.equ'),('which trader has the most fighters?','traders','fighters')]:
            with self.subTest(question=question):
                plan=deterministic_plan('fixture',question);self.assertEqual(plan['entity'],entity);self.assertIn(column,plan['select'])
                self.assertTrue(executor._execute_query(plan,self.db,self.helper)['result'])
        plan=deterministic_plan('fixture','show traders with name = "Trader café"');self.assertEqual(executor._execute_query(plan,self.db,self.helper)['count'],2)
        plan=deterministic_plan('fixture','show sectors with vars.FIGSEC = 1');self.assertEqual(executor._execute_query(plan,self.db,self.helper)['count'],2)
    def test_unknown_or_unrepresentable_question_returns_error_not_empty_success(self):
        with patch.object(executor,'GAMES_DIR',FIXTURES):
            result=mcp_server.call_tool('query_twxdb',{'game':'v19','question':'what is fake_field for planet 22?'})
            self.assertTrue(result['isError']);self.assertIn('Unknown requested field',result['content'][0]['text'])
        with patch.object(mcp_server.PLANNER,'plan',return_value={'v':1,'op':'unsupported','game':'v19','reason':'The requested data is unavailable'}):
            result=mcp_server.call_tool('query_twxdb',{'game':'v19','question':'an unsupported question'})
            self.assertTrue(result['isError']);self.assertIn('unavailable',result['content'][0]['text'])
    def test_fallback_planner_cannot_omit_requested_field_or_change_planet_id(self):
        plan={'game':'fixture','op':'query','entity':'planets','where':[{'field':'id','op':'=','value':22}],'select':['id','name','sector']}
        with self.assertRaisesRegex(executor.PlanError,'omitted requested fields'):validate_question_plan('fixture','Tell me the owner of planet #22',plan)
        with self.assertRaisesRegex(executor.PlanError,'planet ID'):validate_question_plan('fixture','Tell me about planet #23',plan)
        good={**plan,'select':['id','owner']};self.assertEqual(validate_question_plan('fixture','Tell me the owner of planet #22',good),good)
    def test_mcp_schema_and_record_tools_and_rejected_unknown_column(self):
        with patch.object(executor,'GAMES_DIR',FIXTURES):
            schema=mcp_server.call_tool('describe_twxdb_schema',{'game':'v19'})
            self.assertFalse(schema['isError']);self.assertEqual(set(schema['structuredContent']['entities']),set(ROOTS))
            result=mcp_server.call_tool('query_twxdb_records',{'game':'v19','entity':'planets','select':['equ'],'where':[{'field':'id','value':22}]})
            self.assertFalse(result['isError']);self.assertEqual(result['structuredContent']['answer']['result'],[{'equ':2000000}])
            result=mcp_server.call_tool('query_twxdb_records',{'game':'v19','entity':'planets','select':['pct.']})
            self.assertTrue(result['isError']);self.assertIn('Unknown field',result['content'][0]['text'])
