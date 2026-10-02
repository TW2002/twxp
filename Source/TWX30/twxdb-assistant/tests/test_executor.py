from __future__ import annotations

import unittest
import os
import tempfile
from pathlib import Path
from unittest.mock import patch

from twxdb_assistant.executor import PlanError, execute_plan
from twxdb_assistant.paths import resolve_games_dir, resolve_list_dir, resolve_program_dir
from twxdb_assistant.planner import extract_plan


class ExecutorIntegrationTests(unittest.TestCase):
    GAME = "abandoned_stardock_b"

    def test_deadends_follow_source_list_order(self):
        result = execute_plan({
            "v": 1,
            "op": "query",
            "game": self.GAME,
            "entity": "deadends",
            "source_list": "abandoned_b.list",
            "list_match": "deepest",
            "select": ["deepest", "max_depth", "door", "list_order"],
            "sort": ["list_order"],
        })
        self.assertEqual(result["count"], 15)
        self.assertEqual(result["result"][0]["deepest"], 9711)
        self.assertEqual(result["result"][0]["max_depth"], 3)

    def test_path_resolves_stardock_alias(self):
        result = execute_plan({"v": 1, "op": "path", "game": self.GAME, "from": 1, "to": "stardock"})
        self.assertTrue(result["found"])
        self.assertEqual(result["route"][0], 1)
        self.assertEqual(result["route"][-1], 6543)
        self.assertEqual(result["hops"], len(result["route"]) - 1)

    def test_path_resolves_sector_prefix(self):
        result = execute_plan({
            "v": 1,
            "op": "path",
            "game": self.GAME,
            "from": "sector1",
            "to": "stardock",
        })
        self.assertTrue(result["found"])
        self.assertEqual(result["route"][0], 1)

    def test_neighbor_direction_is_respected(self):
        out_result = execute_plan({
            "v": 1, "op": "query", "game": self.GAME, "entity": "sectors",
            "where": [{"field": "sector", "op": "=", "value": 1}],
            "neighbor": {"direction": "out", "where": [], "min": 1},
            "select": ["sector", "matching_neighbor_count"],
        })
        self.assertEqual(out_result["count"], 1)
        self.assertGreater(out_result["result"][0]["matching_neighbor_count"], 0)

    def test_rejects_unknown_game(self):
        with self.assertRaises(PlanError):
            execute_plan({"v": 1, "op": "query", "game": "not_a_real_game", "entity": "sectors"})

    def test_extracts_json_from_model_fence(self):
        self.assertEqual(
            extract_plan('```json\n{"v":1,"op":"unsupported"}\n```'),
            {"v": 1, "op": "unsupported"},
        )

    def test_shared_paths_follow_twx30_program_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            program_dir = Path(temporary) / "portable-twx"
            program_dir.mkdir()
            with patch.dict(os.environ, {"TWX30_PROGRAMDIR": str(program_dir)}, clear=False):
                self.assertEqual(resolve_program_dir(), program_dir.resolve())
                self.assertEqual(resolve_games_dir(), program_dir.resolve() / "games")
                self.assertEqual(resolve_list_dir(), program_dir.resolve())

    def test_shared_paths_honor_configured_program_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            bootstrap_dir = Path(temporary) / "bootstrap"
            configured_dir = Path(temporary) / "configured"
            bootstrap_dir.mkdir()
            configured_dir.mkdir()
            (bootstrap_dir / "config.twx").write_text(
                "<TwxProxyConfig><SharedPaths><ProgramDirectory>"
                + str(configured_dir)
                + "</ProgramDirectory></SharedPaths></TwxProxyConfig>",
                encoding="utf-8",
            )
            with patch.dict(os.environ, {"TWX30_PROGRAMDIR": str(bootstrap_dir)}, clear=False):
                self.assertEqual(resolve_program_dir(), configured_dir.resolve())


if __name__ == "__main__":
    unittest.main()
