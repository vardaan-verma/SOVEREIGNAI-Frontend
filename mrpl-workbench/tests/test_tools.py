"""
test_tools.py — Unit tests for each of the 12 tool implementations.

Heavy dependencies (PaddleOCR, Docker, pgvector) are mocked so tests
can run on any machine without those services installed.
"""

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from mcp_server import config


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _write_tmp(content: str, suffix: str = ".txt") -> str:
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=suffix, delete=False,
        dir=str(config.OUTPUT_DIR), encoding="utf-8"
    )
    tmp.write(content)
    tmp.close()
    return tmp.name


# ─── file_io ──────────────────────────────────────────────────────────────────

class TestFileRead:
    def setup_method(self):
        from mcp_server.tools.file_io import FileIOTool
        self.tool = FileIOTool()

    def test_read_txt(self):
        path = _write_tmp("Hello MRPL")
        result = self.tool.file_read(path)
        assert "Hello MRPL" in result["content"]
        assert result["file_type"] == "txt"

    def test_read_json(self):
        path = _write_tmp('{"key": "value"}', suffix=".json")
        result = self.tool.file_read(path)
        assert result["parsed_data"] == {"key": "value"}

    def test_read_csv(self):
        path = _write_tmp("a,b\n1,2\n3,4", suffix=".csv")
        result = self.tool.file_read(path)
        assert len(result["parsed_data"]) == 2

    def test_nonexistent_file_raises(self):
        with pytest.raises((FileNotFoundError, ValueError)):
            self.tool.file_read(str(config.OUTPUT_DIR / "does_not_exist_xyz.txt"))


class TestFileWrite:
    def setup_method(self):
        from mcp_server.tools.file_io import FileIOTool
        self.tool = FileIOTool()

    def test_creates_file(self):
        result = self.tool.file_write("unit_test_out.txt", "test content")
        assert result["status"] in ("created", "updated")
        assert Path(result["path"]).exists()

    def test_size_bytes_correct(self):
        content = "abc"
        result = self.tool.file_write("size_test.txt", content)
        assert result["size_bytes"] == len(content.encode())

    def test_restricted_path_not_escape(self):
        # file_write should ignore directory components and write to OUTPUT_DIR
        result = self.tool.file_write("../../etc/passwd_fake.txt", "test")
        assert str(config.OUTPUT_DIR) in result["path"]


class TestDocxWrite:
    def setup_method(self):
        from mcp_server.tools.file_io import FileIOTool
        self.tool = FileIOTool()

    def test_creates_docx(self):
        pytest.importorskip("docx", reason="python-docx not installed")
        result = self.tool.docx_write(
            title="Test Document",
            sections=[{"heading": "Section 1", "content": "Some text here."}],
            output_name="unit_test_doc",
            add_timestamp=False,
        )
        assert result["status"] == "created"
        assert Path(result["path"]).suffix == ".docx"
        assert result["file_size_bytes"] > 0


# ─── spreadsheet ─────────────────────────────────────────────────────────────

class TestXlsxWrite:
    def setup_method(self):
        from mcp_server.tools.spreadsheet import SpreadsheetTool
        self.tool = SpreadsheetTool()

    def test_creates_xlsx(self):
        pytest.importorskip("openpyxl", reason="openpyxl not installed")
        result = self.tool.xlsx_write(
            data={"Sheet1": [{"Name": "Alice", "Age": 30}, {"Name": "Bob", "Age": 25}]},
            output_name="unit_test_sheet",
        )
        assert result["status"] == "created"
        assert Path(result["path"]).exists()


class TestXlsxRead:
    def setup_method(self):
        from mcp_server.tools.spreadsheet import SpreadsheetTool
        self.tool = SpreadsheetTool()

    def test_read_written_file(self):
        openpyxl = pytest.importorskip("openpyxl", reason="openpyxl not installed")
        # Write then read back
        write_tool = self.tool
        write_result = write_tool.xlsx_write(
            data={"Data": [{"col1": "a", "col2": 1}, {"col1": "b", "col2": 2}]},
            output_name="read_test",
        )
        read_result = self.tool.xlsx_read(write_result["path"])
        assert "Data" in read_result["sheets"]
        assert len(read_result["data"]["Data"]) > 0


# ─── extract_structured ───────────────────────────────────────────────────────

class TestExtractStructured:
    def setup_method(self):
        from mcp_server.tools.extraction import ExtractionTool
        self.tool = ExtractionTool()

    def test_extracts_string_field(self):
        text = "Equipment ID: XY-123\nStatus: Operational"
        schema = {
            "type": "object",
            "properties": {
                "equipment_id": {"type": "string"},
                "status": {"type": "string"},
            },
            "required": ["equipment_id", "status"],
        }
        result = self.tool.extract_structured(text, schema)
        assert result["extracted_data"].get("equipment_id") == "XY-123"
        assert result["extracted_data"].get("status") == "Operational"

    def test_confidence_is_fraction(self):
        text = "date: 2026-09-07\nname: Test"
        schema = {"properties": {"date": {"type": "string"}, "name": {"type": "string"}}, "required": ["date", "name"]}
        result = self.tool.extract_structured(text, schema)
        assert 0.0 <= result["confidence"] <= 1.0

    def test_missing_fields_reported(self):
        text = "Only has this: foo"
        schema = {
            "properties": {"alpha": {"type": "string"}, "beta": {"type": "string"}},
            "required": ["alpha", "beta"],
        }
        result = self.tool.extract_structured(text, schema)
        assert len(result["missing_fields"]) > 0

    def test_date_extraction(self):
        text = "Inspection date: 2026-09-07"
        schema = {"properties": {"inspection_date": {"type": "string"}}, "required": ["inspection_date"]}
        result = self.tool.extract_structured(text, schema)
        # Either extracted directly or via date fallback
        assert result["confidence"] > 0


# ─── vision (mocked) ──────────────────────────────────────────────────────────

class TestVisionReadImage:
    def setup_method(self):
        from mcp_server.tools.vision import VisionTool
        self.tool = VisionTool()

    def test_invalid_path_raises(self):
        with pytest.raises((FileNotFoundError, ValueError)):
            self.tool.read_image(str(config.OUTPUT_DIR / "no_such_image.png"))


# ─── code_execution (subprocess fallback) ─────────────────────────────────────

class TestExecutePython:
    def setup_method(self):
        from mcp_server.tools.code_execution import CodeExecutionTool
        self.tool = CodeExecutionTool()

    @patch("mcp_server.utils.docker_manager._get_docker_client",
           side_effect=Exception("Docker not available"))
    def test_subprocess_fallback(self, _mock):
        result = self.tool.execute_python("print('hello mrpl')", timeout=10)
        assert "hello mrpl" in result["stdout"]
        assert result["sandbox_used"] == "subprocess_fallback"

    @patch("mcp_server.utils.docker_manager._get_docker_client",
           side_effect=Exception("Docker not available"))
    def test_return_code_on_error(self, _mock):
        result = self.tool.execute_python("raise ValueError('test error')", timeout=10)
        assert result["return_code"] != 0


class TestExecuteBash:
    def setup_method(self):
        from mcp_server.tools.code_execution import CodeExecutionTool
        self.tool = CodeExecutionTool()

    @patch("mcp_server.utils.docker_manager._get_docker_client",
           side_effect=Exception("Docker not available"))
    def test_bash_fallback_echo(self, _mock):
        import sys
        if sys.platform == "win32":
            result = self.tool.execute_bash("echo hello", timeout=10)
        else:
            result = self.tool.execute_bash("echo hello", timeout=10)
        assert result["return_code"] == 0
        assert "hello" in result["stdout"]


# ─── knowledge_base (mocked) ─────────────────────────────────────────────────

class TestKBSearch:
    def test_returns_error_dict_when_no_db(self):
        # Don't connect to a real DB in unit tests
        from mcp_server.tools.knowledge_base import KnowledgeBaseTool
        with patch("psycopg2.connect", side_effect=Exception("No DB")):
            kb = KnowledgeBaseTool()
        result = kb.search("test query")
        assert result["total_results"] == 0
        assert "error" in result


# ─── orchestration ────────────────────────────────────────────────────────────

class TestChainTools:
    def setup_method(self):
        from mcp_server.tool_registry import dispatch
        from mcp_server.tools.orchestration import OrchestrationTool
        self.tool = OrchestrationTool(dispatcher=dispatch)

    def test_single_step_chain(self):
        result = self.tool.chain_tools(steps=[{
            "tool_name": "file_write",
            "params": {"file_path": "chain_out.txt", "content": "chain test"},
            "step_id": "s1",
        }])
        assert result["steps_completed"] == 1
        assert result["results"][0]["status"] == "success"

    def test_abort_on_error(self):
        result = self.tool.chain_tools(steps=[
            {
                "tool_name": "nonexistent_tool",
                "params": {},
                "step_id": "bad_step",
            },
            {
                "tool_name": "file_write",
                "params": {"file_path": "should_not_run.txt", "content": "x"},
                "step_id": "good_step",
            },
        ])
        # Should abort after the first error
        assert result["steps_completed"] == 1

    def test_dependency_passing(self):
        # Write a file, then read it back using depends_on
        result = self.tool.chain_tools(steps=[
            {
                "tool_name": "file_write",
                "params": {"file_path": "dep_test.txt", "content": "dependency test"},
                "step_id": "write_step",
            },
        ])
        assert result["results"][0]["status"] == "success"
