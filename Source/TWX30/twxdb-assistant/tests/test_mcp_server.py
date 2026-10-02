from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from twxdb_assistant.mcp_server import TOOLS, call_tool, handle_message


class McpServerTests(unittest.TestCase):
    def test_initialize_adopts_client_protocol_version(self):
        response = handle_message({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {"protocolVersion": "2025-06-18"},
        })
        self.assertEqual(response["result"]["protocolVersion"], "2025-06-18")
        self.assertTrue(response["result"]["capabilities"]["tools"])

    def test_lists_natural_language_query_tool(self):
        response = handle_message({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        self.assertEqual(response["result"]["tools"], TOOLS)
        self.assertIn("query_twxdb", {tool["name"] for tool in TOOLS})

    def test_executes_supplied_plan(self):
        plan = {"v": 1, "op": "path", "game": "abandoned_stardock_b", "from": 1, "to": "stardock"}
        result = call_tool("execute_twxdb_plan", {"plan": plan})
        self.assertFalse(result["isError"])
        self.assertTrue(result["structuredContent"]["answer"]["found"])

    @patch("twxdb_assistant.mcp_server.PLANNER.plan")
    def test_plans_and_executes_natural_language_question(self, plan):
        plan.return_value = {
            "v": 1,
            "op": "query",
            "game": "abandoned_stardock_b",
            "entity": "sectors",
            "where": [{"field": "sector", "op": "=", "value": 1}],
            "select": ["sector"],
        }
        result = call_tool("query_twxdb", {"game": "abandoned_stardock_b", "question": "show sector 1"})
        self.assertFalse(result["isError"])
        self.assertEqual(result["structuredContent"]["answer"]["result"], [{"sector": 1}])

    @patch("twxdb_assistant.mcp_server.PLANNER.plan")
    def test_saves_sector_list_from_question_suffix(self, plan):
        plan.return_value = {
            "v": 1,
            "op": "query",
            "game": "abandoned_stardock_b",
            "entity": "sectors",
            "where": [{"field": "sector", "op": "in", "value": [1, 2]}],
            "select": ["sector"],
            "sort": ["sector"],
        }
        with tempfile.TemporaryDirectory() as temporary:
            with patch.dict(os.environ, {"TWX_LIST_DIR": temporary}, clear=False):
                result = call_tool(
                    "query_twxdb",
                    {
                        "game": "abandoned_stardock_b",
                        "question": "show sectors 1 and 2 and save the output to mygrid.list",
                    },
                )
            output = Path(temporary) / "mygrid.list"
            self.assertFalse(result["isError"])
            self.assertEqual(plan.call_args.args[1], "show sectors 1 and 2")
            self.assertEqual(output.read_text(encoding="ascii"), "1\n2\n")
            self.assertEqual(result["structuredContent"]["saved_file"]["count"], 2)

    @patch("twxdb_assistant.mcp_server.PLANNER.plan")
    def test_rejects_output_outside_program_directory(self, plan):
        plan.return_value = {"v": 1, "op": "query", "game": "abandoned_stardock_b", "entity": "sectors"}
        with tempfile.TemporaryDirectory() as temporary:
            with patch.dict(os.environ, {"TWX_LIST_DIR": temporary}, clear=False):
                result = call_tool(
                    "query_twxdb",
                    {
                        "game": "abandoned_stardock_b",
                        "question": "show sectors",
                        "output_file": "../outside.list",
                    },
                )
        self.assertTrue(result["isError"])
        self.assertIn("configured TWX directory", result["content"][0]["text"])

    def test_recognizes_equivalent_output_directives(self):
        from twxdb_assistant.mcp_server import _split_output_directive

        for suffix in (
            "write the data to mygrid.list",
            "output to mygrid.list",
            "export the results as mygrid.list",
            "store the list in mygrid.list",
            "put the output in mygrid.list",
        ):
            with self.subTest(suffix=suffix):
                question, filename = _split_output_directive(f"show my sectors and {suffix}", None)
                self.assertEqual(question, "show my sectors")
                self.assertEqual(filename, "mygrid.list")

        question, filename = _split_output_directive(
            "show my sectors and output to ignored.list",
            "explicit.list",
        )
        self.assertEqual(question, "show my sectors")
        self.assertEqual(filename, "explicit.list")


if __name__ == "__main__":
    unittest.main()
