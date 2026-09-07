"""
error_handler.py — Standardised error response builder.

All tools and endpoints call make_error_response() so that every error
is logged and returned in the exact schema the spec requires.
"""

from __future__ import annotations

import traceback
from typing import Any, Dict, Optional

from mcp_server.models import ToolCallResponse, utc_now


def make_error_response(
    *,
    execution_id: str,
    tool_name: str,
    error: Exception | str,
    execution_time_ms: int = 0,
) -> ToolCallResponse:
    """
    Build a ToolCallResponse with status='error'.

    Includes the exception message (but NOT a full traceback) in the
    'error' field to avoid leaking internal implementation details.
    """
    if isinstance(error, Exception):
        error_msg = f"{type(error).__name__}: {error}"
    else:
        error_msg = str(error)

    return ToolCallResponse(
        execution_id=execution_id,
        status="error",
        tool_name=tool_name,
        result=None,
        error=error_msg,
        execution_time_ms=execution_time_ms,
        network_calls=0,
    )


def format_exception(exc: Exception) -> str:
    """Return a short exception description suitable for logging."""
    return f"{type(exc).__name__}: {exc}"
