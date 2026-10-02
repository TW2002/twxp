import io,json,unittest
from unittest.mock import patch
from twxdb_assistant import planner,mcp_server
from twxdb_assistant.schema import ROOTS,fields_for
from twxdb_assistant.query_plans import deterministic_plan

class PlannerDiscoveryTests(unittest.TestCase):
    def request(self,question,reply):
        stream=io.BytesIO(json.dumps({'choices':[{'message':{'content':reply}}]}).encode())
        with patch('urllib.request.urlopen',return_value=stream) as http:
            result=planner.request_plan('http://localhost/v1/chat/completions','fixture',question)
            self.assertEqual(http.call_count,1)
            payload=json.loads(http.call_args.args[0].data)
            self.assertIn(question,payload['messages'][1]['content'])
            self.assertTrue(result['_planner']['model_used'])
            return result
    def test_known_question_still_uses_slm(self):
        q='What is the equipment count for planet #22?'
        expected=deterministic_plan('fixture',q)
        result=self.request(q,json.dumps(expected))
        self.assertEqual(result.pop('_planner')['source'],'slm')
        self.assertEqual(result,expected)
    def test_slm_wrong_id_or_missing_field_cannot_regress_known_question(self):
        q='What is the equipment count for planet #22?'
        for reply in ['not json',json.dumps({'game':'fixture','op':'query','entity':'planets','where':[{'field':'id','value':23}],'select':['name']})]:
            with self.subTest(reply=reply):
                result=self.request(q,reply)
                self.assertEqual(result.pop('_planner')['source'],'validated_interpretation')
                self.assertEqual(result,deterministic_plan('fixture',q))
    def test_unrecognized_question_uses_model_plan_without_replacement(self):
        plan={'game':'fixture','op':'query','entity':'sectors','select':['density'],'limit':3}
        result=self.request('Give me three density readings for comparison.',json.dumps(plan))
        self.assertEqual(result.pop('_planner')['source'],'slm');self.assertEqual(result,plan)
    def test_unrecognized_question_does_not_get_a_guessed_fallback(self):
        with self.assertRaises(planner.PlanError):self.request('Explain the docking accident.', 'not json')
    def test_every_static_field_is_advertised_without_reading_a_game_or_starting_model(self):
        with patch.object(mcp_server.PLANNER,'_get_endpoint',side_effect=AssertionError('discovery must not load model')), patch('twxdb_assistant.mcp_server.describe_schema',side_effect=AssertionError('discovery must not read game')):
            result=mcp_server.handle_message({'id':1,'method':'tools/list'})['result']['tools']
        tool=next(t for t in result if t['name']=='query_twxdb_records')
        lines=tool['description'].splitlines()
        for entity in ROOTS:
            line=next(line for line in lines if line.startswith(entity+': '))
            self.assertEqual(set(line.split(': ',1)[1].split(', ')),set(fields_for(entity)))
        self.assertEqual(tool['inputSchema']['properties']['sort']['items']['properties']['direction']['enum'],['asc','desc'])
if __name__=='__main__':unittest.main()
