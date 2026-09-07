"""
config.py — MRPL MCP Server configuration.

All runtime settings are read from environment variables with sensible
defaults so the server works out-of-the-box without any setup.
"""

import os
from pathlib import Path

# ─── Server ──────────────────────────────────────────────────────────────────

HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
PORT: int = int(os.getenv("MCP_PORT", "8000"))
SERVER_ID: str = "mrpl-mcp-server"
SERVER_VERSION: str = "1.0"

# ─── File system ─────────────────────────────────────────────────────────────

# Where all tool output files are written
OUTPUT_DIR: Path = Path(
    os.getenv("MRPL_OUTPUT_DIR", str(Path.home() / ".mrpl_workbench" / "output"))
)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Timeouts ────────────────────────────────────────────────────────────────

DEFAULT_TOOL_TIMEOUT: int = int(os.getenv("TOOL_TIMEOUT", "30"))   # seconds
MAX_TOOL_TIMEOUT: int = int(os.getenv("MAX_TOOL_TIMEOUT", "120"))  # seconds

# ─── Knowledge Base (pgvector) ───────────────────────────────────────────────

KB_DSN: str = os.getenv(
    "KB_DSN",
    "postgresql://postgres:mrpl_secret@localhost:5432/mrpl_kb",
)
KB_TABLE: str = os.getenv("KB_TABLE", "documents")
KB_EMBEDDING_MODEL: str = os.getenv("KB_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
KB_DEFAULT_TOP_K: int = int(os.getenv("KB_DEFAULT_TOP_K", "5"))
KB_DEFAULT_SIMILARITY: float = float(os.getenv("KB_DEFAULT_SIMILARITY", "0.5"))

# ─── Docker sandbox ──────────────────────────────────────────────────────────

SANDBOX_IMAGE: str = os.getenv("SANDBOX_IMAGE", "mrpl-sandbox:latest")
SANDBOX_NETWORK: str = os.getenv("SANDBOX_NETWORK", "none")  # no egress

# ─── Vision / OCR ────────────────────────────────────────────────────────────

# Prefer PaddleOCR; fall back to pytesseract if not installed
OCR_BACKEND: str = os.getenv("OCR_BACKEND", "auto")   # "paddleocr" | "tesseract" | "auto"
PADDLE_USE_GPU: bool = os.getenv("PADDLE_USE_GPU", "false").lower() == "true"

# ─── Extraction ──────────────────────────────────────────────────────────────

# If set, extract_structured will call a local vLLM endpoint instead of regex
LOCAL_LLM_URL: str = os.getenv("LOCAL_LLM_URL", "")   # e.g. http://localhost:8080
