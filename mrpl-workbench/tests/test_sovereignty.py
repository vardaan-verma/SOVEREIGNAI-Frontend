"""
test_sovereignty.py — Prove that ALL tool calls result in network_calls_total = 0.

This is the critical sovereignty test: after running every available tool,
the /status endpoint must still report zero external API calls.
"""

import pytest
from fastapi.testclient import TestClient

from mcp_server.main import app
from mcp_server.utils.audit_logger import audit_logger

client = TestClient(app)


class TestSovereignty:
    """All tool calls must leave network_calls_total == 0."""

    def _reset_logger(self):
        """Clear audit log between sub-tests (for isolation)."""
        audit_logger._records.clear()
        audit_logger._network_calls_total = 0

    def _call(self, tool_name: str, params: dict, exec_id: str):
        return client.post("/call_tool", json={
            "tool_name": tool_name,
            "params": params,
            "execution_id": exec_id,
        }).json()

    def _assert_zero_external_calls(self):
        status = client.get("/status").json()
        assert status["network_calls_total"] == 0, (
            f"SOVEREIGNTY VIOLATION: {status['network_calls_total']} external calls detected!"
        )
        assert status["external_apis_called"] == [], (
            f"External APIs called: {status['external_apis_called']}"
        )

    def test_file_write_zero_network(self):
        self._call("file_write", {"file_path": "sov_test.txt", "content": "test"}, "sov_fw")
        self._assert_zero_external_calls()

    def test_file_read_zero_network(self):
        # Write first
        self._call("file_write", {"file_path": "sov_read.txt", "content": "read me"}, "sov_fw2")
        import os
        from mcp_server import config
        path = str(config.OUTPUT_DIR / "sov_read.txt")
        self._call("file_read", {"file_path": path}, "sov_fr")
        self._assert_zero_external_calls()

    def test_extract_structured_zero_network(self):
        self._call(
            "extract_structured",
            {"text": "Equipment: XY-123\nStatus: OK", "schema": {"properties": {"equipment": {"type": "string"}}}},
            "sov_ext",
        )
        self._assert_zero_external_calls()

    def test_execute_python_zero_network(self):
        self._call(
            "execute_python",
            {"code": "print(1+1)", "timeout": 10},
            "sov_py",
        )
        self._assert_zero_external_calls()

    def test_execute_bash_zero_network(self):
        self._call(
            "execute_bash",
            {"command": "echo sovereignty", "timeout": 10},
            "sov_bash",
        )
        self._assert_zero_external_calls()

    def test_chain_tools_zero_network(self):
        self._call(
            "chain_tools",
            {"steps": [
                {"tool_name": "file_write", "params": {"file_path": "chain_sov.txt", "content": "chained"}, "step_id": "c1"},
                {"tool_name": "extract_structured",
                 "params": {"text": "value: test", "schema": {"properties": {"value": {"type": "string"}}}},
                 "step_id": "c2"},
            ]},
            "sov_chain",
        )
        self._assert_zero_external_calls()

    def test_get_execution_log_reports_zero_external(self):
        log = client.get("/execution_log").json()
        assert log["external_calls"] == 0
        assert log["total_network_calls"] == 0

    def test_every_logged_record_is_internal_only(self):
        """Every single record in the audit log must have internal_only=True."""
        # Generate a few calls
        for i in range(3):
            self._call(
                "file_write",
                {"file_path": f"sov_bulk_{i}.txt", "content": str(i)},
                f"sov_bulk_{i}",
            )
        log = client.get("/execution_log?limit=100").json()
        for record in log["executions"]:
            assert record["internal_only"] is True, (
                f"Record {record['execution_id']} has internal_only=False!"
            )
            assert record["network_calls_made"] == 0, (
                f"Record {record['execution_id']} has network_calls_made="
                f"{record['network_calls_made']}!"
            )

    def test_unknown_tool_still_zero_network(self):
        """Even error responses must not cause external calls."""
        self._call("this_tool_does_not_exist", {}, "sov_unknown")
        self._assert_zero_external_calls()

    def test_sovereignty_after_many_calls(self):
        """Run 20 tool calls in a row and verify sovereignty is maintained."""
        for i in range(20):
            self._call(
                "file_write",
                {"file_path": f"stress_{i}.txt", "content": f"call {i}"},
                f"stress_{i}",
            )
        self._assert_zero_external_calls()
