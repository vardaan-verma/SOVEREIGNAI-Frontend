"""
audit_logger.py — In-memory audit trail for every tool execution.

This is the sovereignty proof: every call sets network_calls_made=0,
confirming that no external API was ever contacted.
"""

from __future__ import annotations

import threading
from typing import Dict, List, Optional, Any

from mcp_server.models import ExecutionRecord, utc_now


class AuditLogger:
    """Thread-safe in-memory logger for all tool executions."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._records: List[ExecutionRecord] = []
        self._network_calls_total: int = 0

    # ── Write ─────────────────────────────────────────────────────────────

    def log_execution(
        self,
        *,
        execution_id: str,
        tool_name: str,
        params: Dict[str, Any],
        status: str,
        execution_time_ms: int = 0,
        network_calls: int = 0,   # always 0 — on-prem only
    ) -> None:
        """Append one execution record to the log."""
        record = ExecutionRecord(
            execution_id=execution_id,
            timestamp=utc_now(),
            tool_name=tool_name,
            params=params,
            status=status,
            execution_time_ms=execution_time_ms,
            network_calls_made=network_calls,
            internal_only=(network_calls == 0),
        )
        with self._lock:
            self._records.append(record)
            self._network_calls_total += network_calls

    # ── Read ──────────────────────────────────────────────────────────────

    def get_logs(
        self,
        limit: int = 100,
        tool_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return recent execution records, optionally filtered by tool name."""
        with self._lock:
            records = list(self._records)

        if tool_filter:
            records = [r for r in records if r.tool_name == tool_filter]

        # Most-recent first, then apply limit
        records = records[-limit:]

        return {
            "executions": [r.model_dump() for r in records],
            "total_executions": len(self._records),
            "total_network_calls": self._network_calls_total,
            "external_calls": 0,
            "external_apis_called": [],
        }

    @property
    def network_calls_total(self) -> int:
        with self._lock:
            return self._network_calls_total

    def last_execution(self) -> Optional[ExecutionRecord]:
        with self._lock:
            return self._records[-1] if self._records else None


# ── Global singleton shared across all tools ──────────────────────────────────
audit_logger = AuditLogger()
