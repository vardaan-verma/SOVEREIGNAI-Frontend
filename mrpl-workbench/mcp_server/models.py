"""
models.py — Pydantic v2 request and response models for the MRPL MCP Server.

Every HTTP endpoint and every tool call uses these models so that
validation, serialisation, and OpenAPI documentation are all automatic.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ─── Initialize ──────────────────────────────────────────────────────────────

class InitializeRequest(BaseModel):
    agent_id: str = Field(..., description="Unique identifier of the calling agent")
    version: str = Field("1.0", description="Agent protocol version")


class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]


class InitializeResponse(BaseModel):
    server_id: str
    version: str
    tools: List[ToolDefinition]


# ─── Call Tool ───────────────────────────────────────────────────────────────

class ToolCallRequest(BaseModel):
    tool_name: str = Field(..., description="Name of the tool to execute")
    params: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")
    execution_id: str = Field(..., description="Unique ID for this execution (caller-generated)")


class ToolCallResponse(BaseModel):
    execution_id: str
    status: str                           # "success" | "error"
    tool_name: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: int = 0
    network_calls: int = Field(0, description="Always 0 — on-premises only")


# ─── Tools list ──────────────────────────────────────────────────────────────

class ToolsResponse(BaseModel):
    tools: List[ToolDefinition]


# ─── Status ──────────────────────────────────────────────────────────────────

class LastExecution(BaseModel):
    tool_name: str
    timestamp: str
    success: bool


class StatusResponse(BaseModel):
    status: str                               # "healthy" | "degraded"
    uptime_seconds: float
    tools_available: int
    network_calls_total: int = 0
    external_apis_called: List[str] = Field(default_factory=list)
    last_tool_execution: Optional[LastExecution] = None


# ─── Execution Log ───────────────────────────────────────────────────────────

class ExecutionRecord(BaseModel):
    execution_id: str
    timestamp: str
    tool_name: str
    params: Dict[str, Any] = Field(default_factory=dict)
    status: str
    execution_time_ms: int = 0
    network_calls_made: int = 0
    internal_only: bool = True


class ExecutionLogResponse(BaseModel):
    executions: List[ExecutionRecord]
    total_executions: int
    external_calls: int = 0
    total_network_calls: int = 0


# ─── Shared helper ───────────────────────────────────────────────────────────

def utc_now() -> str:
    """Return current UTC time as ISO-8601 string."""
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
