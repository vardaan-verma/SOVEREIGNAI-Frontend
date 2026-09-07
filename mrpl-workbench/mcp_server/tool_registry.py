"""
tool_registry.py — Central registry mapping every tool name to its handler
and JSON Schemas (input + output).

All 12 tools are registered here. POST /call_tool, GET /tools, and
POST /initialize all read from this single source of truth.
"""

from __future__ import annotations

from typing import Any, Callable, Dict

# ── Tool instances (lazy-initialised) ────────────────────────────────────────
from mcp_server.tools.vision import VisionTool
from mcp_server.tools.file_io import FileIOTool
from mcp_server.tools.knowledge_base import KnowledgeBaseTool
from mcp_server.tools.code_execution import CodeExecutionTool
from mcp_server.tools.spreadsheet import SpreadsheetTool
from mcp_server.tools.extraction import ExtractionTool
from mcp_server.tools.orchestration import OrchestrationTool

_vision = VisionTool()
_file_io = FileIOTool()
_kb = KnowledgeBaseTool()
_code = CodeExecutionTool()
_sheet = SpreadsheetTool()
_extract = ExtractionTool()


# ── Registry definition ───────────────────────────────────────────────────────
# Each entry: { handler, description, input_schema, output_schema }

_REGISTRY: Dict[str, Dict[str, Any]] = {

    # ── Vision / OCR ──────────────────────────────────────────────────────
    "vision_read_pdf": {
        "handler": _vision.read_pdf,
        "description": "Read scanned PDF and extract text via OCR (PaddleOCR / pytesseract). Returns confidence scores per page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path":      {"type": "string",  "description": "Absolute path to PDF file"},
                "extract_text":   {"type": "boolean", "description": "Extract OCR text (default: true)", "default": True},
                "extract_images": {"type": "boolean", "description": "Extract embedded images (default: false)", "default": False},
            },
            "required": ["file_path"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "text":                {"type": "string"},
                "num_pages":           {"type": "integer"},
                "confidence":          {"type": "number"},
                "per_page_confidence": {"type": "array"},
                "images_extracted":    {"type": "integer"},
                "extraction_time_ms":  {"type": "integer"},
                "backend_used":        {"type": "string"},
            },
        },
    },

    "vision_read_image": {
        "handler": _vision.read_image,
        "description": "Read an image file (PNG, JPG, BMP), extract text and detect engineering diagrams.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path":       {"type": "string",  "description": "Path to image file"},
                "detect_diagrams": {"type": "boolean", "description": "Detect engineering diagrams (default: true)", "default": True},
            },
            "required": ["file_path"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "text":               {"type": "string"},
                "confidence":         {"type": "number"},
                "diagrams_detected":  {"type": "array"},
                "shapes":             {"type": "array"},
                "extraction_time_ms": {"type": "integer"},
            },
        },
    },

    # ── File I/O ──────────────────────────────────────────────────────────
    "file_read": {
        "handler": _file_io.file_read,
        "description": "Read any text, JSON, or CSV file from the user's directory.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to file (absolute or relative to cwd)"},
                "encoding":  {"type": "string", "description": "File encoding (default: utf-8)", "default": "utf-8"},
            },
            "required": ["file_path"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "content":   {"type": "string"},
                "file_type": {"type": "string"},
                "size_bytes":{"type": "integer"},
                "encoding":  {"type": "string"},
                "num_lines": {"type": "integer"},
            },
        },
    },

    "file_write": {
        "handler": _file_io.file_write,
        "description": "Write text content to a file in the output directory (~/.mrpl_workbench/output/).",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Filename (saved in output dir)"},
                "content":   {"type": "string", "description": "Text content to write"},
                "format":    {"type": "string", "enum": ["txt", "json", "csv", "md"], "default": "txt"},
            },
            "required": ["file_path", "content"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "path":       {"type": "string"},
                "status":     {"type": "string"},
                "size_bytes": {"type": "integer"},
                "created_at": {"type": "string"},
            },
        },
    },

    "docx_write": {
        "handler": _file_io.docx_write,
        "description": "Create a formatted .docx Word document with titled sections, tables, and lists.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title":         {"type": "string", "description": "Document title"},
                "sections":      {
                    "type": "array",
                    "description": "List of section objects",
                    "items": {
                        "type": "object",
                        "properties": {
                            "heading": {"type": "string"},
                            "content": {"type": ["string", "array"]},
                            "type":    {"type": "string", "enum": ["text", "table", "list"], "default": "text"},
                        },
                    },
                },
                "output_name":   {"type": "string", "description": "Output filename (without .docx)"},
                "add_timestamp": {"type": "boolean", "default": True},
            },
            "required": ["title", "sections", "output_name"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "path":            {"type": "string"},
                "pages":           {"type": "integer"},
                "status":          {"type": "string"},
                "file_size_bytes": {"type": "integer"},
            },
        },
    },

    # ── Knowledge Base ────────────────────────────────────────────────────
    "kb_search": {
        "handler": _kb.search,
        "description": "Semantic search over internal SOPs, correspondence, and specifications using pgvector.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query":                {"type": "string",  "description": "Natural-language search query"},
                "top_k":                {"type": "integer", "description": "Max results to return", "default": 5},
                "similarity_threshold": {"type": "number",  "description": "Min similarity (0-1)", "default": 0.5},
            },
            "required": ["query"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "document_id":    {"type": "string"},
                            "title":          {"type": "string"},
                            "excerpt":        {"type": "string"},
                            "relevance_score":{"type": "number"},
                            "source":         {"type": "string"},
                        },
                    },
                },
                "total_results": {"type": "integer"},
            },
        },
    },

    # ── Code Execution ────────────────────────────────────────────────────
    "execute_python": {
        "handler": _code.execute_python,
        "description": "Run Python code in an isolated Docker sandbox (network disabled, timeout-protected).",
        "input_schema": {
            "type": "object",
            "properties": {
                "code":         {"type": "string",  "description": "Python source code to execute"},
                "timeout":      {"type": "integer", "description": "Timeout in seconds (default: 30)", "default": 30},
                "requirements": {"type": "array",   "description": "Python packages to install", "items": {"type": "string"}},
            },
            "required": ["code"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "stdout":           {"type": "string"},
                "stderr":           {"type": "string"},
                "return_code":      {"type": "integer"},
                "execution_time_ms":{"type": "integer"},
                "timeout_occurred": {"type": "boolean"},
            },
        },
    },

    "execute_bash": {
        "handler": _code.execute_bash,
        "description": "Run a bash command in an isolated Docker sandbox (no sudo, no system files).",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string",  "description": "Bash command to execute"},
                "timeout": {"type": "integer", "description": "Timeout in seconds (default: 30)", "default": 30},
            },
            "required": ["command"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "stdout":      {"type": "string"},
                "stderr":      {"type": "string"},
                "return_code": {"type": "integer"},
            },
        },
    },

    # ── Spreadsheets ──────────────────────────────────────────────────────
    "xlsx_read": {
        "handler": _sheet.xlsx_read,
        "description": "Read an Excel .xlsx file — extract data, headers, and formulas from all or one sheet.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path":  {"type": "string", "description": "Path to .xlsx file"},
                "sheet_name": {"type": "string", "description": "Specific sheet to read (default: all sheets)"},
            },
            "required": ["file_path"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "sheets":   {"type": "array"},
                "data":     {"type": "object"},
                "headers":  {"type": "object"},
                "formulas": {"type": "object"},
            },
        },
    },

    "xlsx_write": {
        "handler": _sheet.xlsx_write,
        "description": "Write data to a new Excel .xlsx file with multiple sheets and automatic formatting.",
        "input_schema": {
            "type": "object",
            "properties": {
                "data":        {"type": "object", "description": "{ sheet_name: [ row, ... ] }"},
                "output_name": {"type": "string", "description": "Output filename (without .xlsx)"},
                "sheets":      {"type": "array",  "description": "Optional per-sheet formatting definitions"},
            },
            "required": ["data", "output_name"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "path":            {"type": "string"},
                "status":          {"type": "string"},
                "file_size_bytes": {"type": "integer"},
            },
        },
    },

    # ── Data Extraction ───────────────────────────────────────────────────
    "extract_structured": {
        "handler": _extract.extract_structured,
        "description": "Parse unstructured text into a structured JSON object matching a caller-supplied schema (regex + optional local LLM).",
        "input_schema": {
            "type": "object",
            "properties": {
                "text":   {"type": "string", "description": "Raw text to extract from"},
                "schema": {"type": "object", "description": "JSON Schema defining the target structure"},
            },
            "required": ["text", "schema"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "extracted_data": {"type": "object"},
                "confidence":     {"type": "number"},
                "missing_fields": {"type": "array"},
            },
        },
    },

    # ── Orchestration ─────────────────────────────────────────────────────
    # NOTE: chain_tools and get_execution_log are added in _build_orchestration()
    # after the registry is fully constructed (to avoid circular deps).
}


def _build_orchestration() -> None:
    """
    Add orchestration tools which need a reference to the dispatch function.
    Called once at startup by main.py after _REGISTRY is defined.
    """
    orch = OrchestrationTool(dispatcher=dispatch)

    _REGISTRY["chain_tools"] = {
        "handler": orch.chain_tools,
        "description": "Run a multi-step workflow of tool calls in sequence, with optional dependency chaining.",
        "input_schema": {
            "type": "object",
            "properties": {
                "steps": {
                    "type": "array",
                    "description": "Ordered list of tool call steps",
                    "items": {
                        "type": "object",
                        "properties": {
                            "tool_name":  {"type": "string"},
                            "params":     {"type": "object"},
                            "step_id":    {"type": "string"},
                            "depends_on": {"type": "string"},
                        },
                    },
                },
            },
            "required": ["steps"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "results":        {"type": "array"},
                "execution_log":  {"type": "array"},
                "total_time_ms":  {"type": "integer"},
            },
        },
    }

    _REGISTRY["get_execution_log"] = {
        "handler": orch.get_execution_log,
        "description": "Retrieve the full audit trail of all tool calls, proving zero external API calls.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit":       {"type": "integer", "description": "Max records to return (default: 100)", "default": 100},
                "tool_filter": {"type": "string",  "description": "Filter by tool name (optional)"},
            },
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "executions":          {"type": "array"},
                "total_external_calls":{"type": "integer"},
            },
        },
    }


# ── Public API ────────────────────────────────────────────────────────────────

def get_all_tools() -> list:
    """Return list of ToolDefinition-compatible dicts for all registered tools."""
    from mcp_server.models import ToolDefinition
    return [
        ToolDefinition(
            name=name,
            description=entry["description"],
            input_schema=entry["input_schema"],
            output_schema=entry["output_schema"],
        )
        for name, entry in _REGISTRY.items()
    ]


def dispatch(tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Invoke the handler for *tool_name* with **params.

    Raises KeyError if tool_name is not registered.
    All other exceptions propagate to the caller (main.py handles them).
    """
    entry = _REGISTRY[tool_name]
    handler: Callable = entry["handler"]
    return handler(**params)


def is_registered(tool_name: str) -> bool:
    return tool_name in _REGISTRY


# Initialise orchestration tools immediately when this module is imported
_build_orchestration()
