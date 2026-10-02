import io
import json
import unittest
from unittest.mock import patch

from twxdb_assistant import planner, mcp_server
from twxdb_assistant.query_plans import deterministic_plan, validate_question_plan


class MslRegressionTests(unittest.TestCase):
    game = 'microblaster_network_s'
    question = 'using the twxdb helper, give me a list of sectors in microblaster_network_s that are in MSLs'

    def request(self, question, reply):
        stream = io.BytesIO(json.dumps({'choices': [{'message': {'content': reply}}]}).encode())
        with patch('urllib.request.urlopen', return_value=stream) as http:
            result = planner.request_plan('http://fixture/v1/chat/completions', self.game, question)
            self.assertEqual(http.call_count, 1)
            return result

    def test_exact_request_and_supported_synonyms_preserve_membership(self):
        for question in [self.question, 'List sectors in microblaster_network_s that are in MSLs',
                         'List all MSL sectors', 'which sectors are marked MSL?',
                         'give me every known major space lane sector']:
            with self.subTest(question=question):
                plan = deterministic_plan(self.game, question)
                self.assertEqual(plan['where'], [{'field': 'mslsec', 'op': 'truthy'}])
                self.assertEqual(plan['game'], self.game)
                self.assertEqual(plan['select'], ['sector'])

    def test_bad_model_output_cannot_change_exact_msl_query(self):
        for reply in ['not json', '{}', '{"op":"unsupported"}',
                      '{"game":"another_game","op":"query","entity":"planets"}']:
            with self.subTest(reply=reply):
                plan = self.request(self.question, reply)
                info = plan.pop('_planner')
                self.assertEqual(plan, deterministic_plan(self.game, self.question))
                self.assertEqual(info['source'], 'validated_interpretation')
                self.assertEqual(info['model_requests'], 1)

    def test_game_is_caller_owned_even_for_unrecognized_questions(self):
        for value in [None, 'other_game']:
            result = self.request('Give me three density readings for comparison.', json.dumps({
                'op': 'query', 'game': value, 'entity': 'sectors', 'select': ['density'], 'limit': 3}))
            self.assertEqual(result['game'], self.game)
            self.assertEqual(result['_planner']['game_binding']['status'], 'missing' if value is None else 'mismatch')
            self.assertEqual(result['_planner']['game_binding']['generated'], value)

    def test_extra_constraints_and_invented_expansion_are_not_silently_dropped(self):
        for question in ['list all MSL sectors with more than 500 fighters',
                         'list sectors in MSLs (Mission Shaped Locations)',
                         'list all non-MSL sectors']:
            self.assertIsNone(deterministic_plan(self.game, question))

    def test_validator_distinguishes_missing_and_mismatched_game(self):
        for plan, message in [({}, 'omitted'), ({'game': 'other'}, 'mismatch')]:
            with self.assertRaisesRegex(planner.PlanError, message):
                validate_question_plan(self.game, 'query', plan)

    def test_unsupported_without_game_is_not_misreported_as_game_error(self):
        result = self.request('Explain the docking accident.', '{"op":"unsupported","reason":"Not in the database"}')
        self.assertEqual(result['op'], 'unsupported')
        self.assertEqual(result['game'], self.game)

    def test_invalid_plan_has_diagnostics_and_never_executes(self):
        stream = io.BytesIO(json.dumps({'choices': [{'message': {'content': 'bad plan'}}]}).encode())
        with patch.object(mcp_server.PLANNER, '_get_endpoint', return_value='http://fixture'), \
             patch('urllib.request.urlopen', return_value=stream), \
             patch.object(mcp_server, 'execute_plan') as execute:
            result = mcp_server.call_tool('query_twxdb', {'game': self.game, 'question': 'Explain the docking accident.'})
            self.assertTrue(result['isError'])
            details = json.loads(result['content'][0]['text'])['planner_diagnostics']
            self.assertEqual(details['generated_plan'], 'bad plan')
            self.assertFalse(details['query_executed'])
            execute.assert_not_called()


if __name__ == '__main__':
    unittest.main()
