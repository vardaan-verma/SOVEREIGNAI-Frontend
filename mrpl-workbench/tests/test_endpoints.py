"""
test_endpoints.py — Integration tests for all 5 HTTP endpoints.

Uses FastAPI's built-in TestClient (via httpx) so no real server is needed.
"""

import pytest
from fastapi.testclient import TestClient

from mcp_server.main import app

client = TestClient(app)


# ── POST /initialize ──────────────────────────────────────────────────────────

class TestInitialize:
    def test_returns_server_id(self):
        resp = client.post("/initialize", json={"agent_id": "test-agent", "version": "1.0"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["server_id"] == "mrpl-mcp-server"
        assert body["version"] == "1.0"

    def test_returns_tools_list(self):
        resp = client.post("/initialize", json={"agent_id": "test-agent"})
        tools = resp.json()["tools"]
        assert isinstance(tools, list)
        assert len(tools) >= 12  # at least all 12 spec tools

    def test_each_tool_has_required_fields(self):
        tools = client.post("/initialize", json={"agent_id": "t"}).json()["tools"]
        for tool in tools:
            assert "name" in tool
            assert "description" in tool
            assert "input_schema" in tool
            assert "output_schema" in tool

    def test_missing_agent_id_returns_422(self):
        resp = client.post("/initialize", json={})
        assert resp.status_code == 422


# ── POST /call_tool ───────────────────────────────────────────────────────────

class TestCallTool:
    def test_unknown_tool_returns_error(self):
        resp = client.post("/call_tool", json={
            "tool_name": "nonexistent_tool",
            "params": {},
            "execution_id": "test_err_1",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "error"
        assert "not found" in body["error"].lower()

    def test_network_calls_always_zero(self):
        resp = client.post("/call_tool", json={
            "tool_name": "file_write",
            "params": {"file_path": "test_nc.txt", "content": "hello"},
            "execution_id": "nc_test",
        })
        assert resp.json()["network_calls"] == 0

    def test_file_write_success(self):
        resp = client.post("/call_tool", json={
            "tool_name": "file_write",
            "params": {"file_path": "endpoint_test.txt", "content": "MRPL test"},
            "execution_id": "fw_test_1",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"
        assert body["result"]["status"] in ("created", "updated")
        assert body["result"]["size_bytes"] > 0

    def test_response_has_execution_id(self):
        resp = client.post("/call_tool", json={
            "tool_name": "file_write",
            "params": {"file_path": "id_check.txt", "content": "x"},
            "execution_id": "my_exec_id_42",
        })
        assert resp.json()["execution_id"] == "my_exec_id_42"

    def test_missing_required_param_returns_error(self):
        resp = client.post("/call_tool", json={
            "tool_name": "file_write",
            "params": {"file_path": "no_content.txt"},  # missing "content"
            "execution_id": "err_missing",
        })
        body = resp.json()
        assert body["status"] == "error"


# ── GET /tools ────────────────────────────────────────────────────────────────

class TestGetTools:
    def test_returns_200(self):
        resp = client.get("/tools")
        assert resp.status_code == 200

    def test_tools_key_present(self):
        body = client.get("/tools").json()
        assert "tools" in body

    def test_all_12_tools_registered(self):
        tools = client.get("/tools").json()["tools"]
        names = {t["name"] for t in tools}
        expected = {
            "vision_read_pdf", "vision_read_image",
            "file_read", "file_write", "docx_write",
            "kb_search",
            "execute_python", "execute_bash",
            "xlsx_read", "xlsx_write",
            "extract_structured",
            "chain_tools", "get_execution_log",
        }
        assert expected.issubset(names), f"Missing tools: {expected - names}"


# ── GET /status ───────────────────────────────────────────────────────────────

class TestGetStatus:
    def test_returns_200(self):
        assert client.get("/status").status_code == 200

    def test_status_is_healthy(self):
        body = client.get("/status").json()
        assert body["status"] == "healthy"

    def test_network_calls_total_zero(self):
        body = client.get("/status").json()
        assert body["network_calls_total"] == 0

    def test_external_apis_empty(self):
        body = client.get("/status").json()
        assert body["external_apis_called"] == []

    def test_tools_available_count(self):
        body = client.get("/status").json()
        assert body["tools_available"] >= 12

    def test_uptime_is_positive(self):
        body = client.get("/status").json()
        assert body["uptime_seconds"] > 0


# ── GET /execution_log ────────────────────────────────────────────────────────

class TestExecutionLog:
    def test_returns_200(self):
        assert client.get("/execution_log").status_code == 200

    def test_executions_is_list(self):
        body = client.get("/execution_log").json()
        assert isinstance(body["executions"], list)

    def test_external_calls_always_zero(self):
        body = client.get("/execution_log").json()
        assert body["external_calls"] == 0

    def test_limit_query_param(self):
        # Generate some executions
        for i in range(5):
            client.post("/call_tool", json={
                "tool_name": "file_write",
                "params": {"file_path": f"log_test_{i}.txt", "content": str(i)},
                "execution_id": f"log_{i}",
            })

        body = client.get("/execution_log?limit=3").json()
        assert len(body["executions"]) <= 3

    def test_tool_filter_query_param(self):
        body = client.get("/execution_log?tool_filter=file_write").json()
        for rec in body["executions"]:
            assert rec["tool_name"] == "file_write"
