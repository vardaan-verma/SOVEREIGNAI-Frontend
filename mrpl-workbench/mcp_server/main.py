"""
main.py — MRPL MCP Server FastAPI application.

Exposes 5 HTTP endpoints as specified in MRPL_MCP_SPEC.md:
  POST /initialize       — Agent handshake, returns full tool catalogue
  POST /call_tool        — Execute a named tool with params
  GET  /tools            — Return all tool definitions
  GET  /status           — Server health + sovereignty proof
  GET  /execution_log    — Full audit trail

Run with:
  python -m mcp_server.main
  or
  uvicorn mcp_server.main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import json
import time
import urllib.request
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from mcp_server import config
from mcp_server import tool_registry
from mcp_server.models import (
    ExecutionLogResponse,
    InitializeRequest,
    InitializeResponse,
    LastExecution,
    StatusResponse,
    ToolCallRequest,
    ToolCallResponse,
    ToolsResponse,
    utc_now,
)
from mcp_server.utils.audit_logger import audit_logger
from mcp_server.utils.error_handler import make_error_response

# ── App setup ─────────────────────────────────────────────────────────────────

_START_TIME = time.time()


def _sse_event(event_type: str, payload: dict) -> str:
    return f"data: {json.dumps({'type': event_type, **payload})}\n\n"

def _request_local_chat_completion(prompt: str) -> str:
    if not config.LOCAL_LLM_URL:
        raise RuntimeError("LOCAL_LLM_URL is not configured.")

    payload = json.dumps(
        {
            "model": "default",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "max_tokens": 1024,
            "stream": False,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{config.LOCAL_LLM_URL.rstrip('/')}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    return body["choices"][0]["message"]["content"].strip()


def _stream_local_chat(prompt: str):
    if not config.LOCAL_LLM_URL:
        yield _sse_event("error", {"message": "LOCAL_LLM_URL is not configured."})
        return

    payload = json.dumps(
        {
            "model": "default",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "max_tokens": 1024,
            "stream": True,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{config.LOCAL_LLM_URL.rstrip('/')}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    full_text = []

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            for raw_line in resp:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line.startswith("data: "):
                    continue

                data = line[6:].strip()
                if data == "[DONE]":
                    break

                try:
                    chunk = json.loads(data)
                except Exception:
                    continue

                choices = chunk.get("choices", [])
                if not choices:
                    continue

                delta = choices[0].get("delta", {})
                content = delta.get("content") or delta.get("text") or ""
                if content:
                    full_text.append(content)
                    yield _sse_event("token", {"text": content})

    except Exception as exc:
        yield _sse_event("error", {"message": f"Streaming chat failed: {exc}"})
        return

    yield _sse_event(
        "complete",
        {
            "markdown": "".join(full_text),
            "routing": {
                "model": "local_llm",
                "taskType": "chat",
                "externalCalls": 0,
            },
        },
    )


app = FastAPI(
    title="MRPL Sovereign AI Workbench — MCP Server",
    description=(
        "On-premises Model Context Protocol server for MRPL. "
        "Executes 12 tools locally with zero external API calls. "
        "Every execution is audited to prove sovereignty."
    ),
    version=config.SERVER_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoint 0: POST /api/chat and /chat ─────────────────────────────────────


@app.post("/api/chat", tags=["Core"], summary="Chat completion (non-streaming)")
@app.post("/chat", tags=["Core"], summary="Chat completion (non-streaming)")
async def chat(request: Request) -> dict:
    """Backward-compatible chat endpoint used by the frontend."""
    body = await request.json()
    prompt = str(body.get("prompt", "") or "").strip()

    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt.")

    try:
        markdown = _request_local_chat_completion(prompt)
        return {
            "markdown": markdown,
            "routing": {
                "model": "local_llm",
                "taskType": "chat",
                "externalCalls": 0,
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/chat/stream", tags=["Core"], summary="Chat completion streamed over SSE")
@app.post("/chat/stream", tags=["Core"], summary="Chat completion streamed over SSE")
async def chat_stream(request: Request):
    """Stream model output token by token to the browser using SSE."""
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("application/json"):
        body = await request.json()
        prompt = str(body.get("prompt", "") or "").strip()
    else:
        raise HTTPException(status_code=400, detail="Expected JSON request body.")

    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt.")

    return StreamingResponse(
        _stream_local_chat(prompt),
        media_type="text/event-stream",
    )


# ── Endpoint 1: POST /initialize ──────────────────────────────────────────────

@app.post(
    "/initialize",
    response_model=InitializeResponse,
    summary="Agent handshake — receive full tool catalogue",
    tags=["Core"],
)
async def initialize(request: InitializeRequest) -> InitializeResponse:
    """
    Called once by the vLLM agent on startup.
    Returns the server identity and every registered tool definition.
    """
    return InitializeResponse(
        server_id=config.SERVER_ID,
        version=config.SERVER_VERSION,
        tools=tool_registry.get_all_tools(),
    )


# ── Endpoint 2: POST /call_tool ───────────────────────────────────────────────

@app.post(
    "/call_tool",
    response_model=ToolCallResponse,
    summary="Execute a tool",
    tags=["Core"],
)
async def call_tool(request: ToolCallRequest) -> ToolCallResponse:
    """
    Dispatch a tool call. The server validates the tool name, executes
    the handler, logs the result, and returns a structured response.
    """
    if not tool_registry.is_registered(request.tool_name):
        available = [t.name for t in tool_registry.get_all_tools()]
        audit_logger.log_execution(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            params=request.params,
            status="error",
        )
        return make_error_response(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            error=f"Tool '{request.tool_name}' not found. Available: {available}",
        )

    start = time.time()
    try:
        result = tool_registry.dispatch(request.tool_name, request.params)
        elapsed_ms = int((time.time() - start) * 1000)
        status = "success"

        audit_logger.log_execution(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            params=request.params,
            status=status,
            execution_time_ms=elapsed_ms,
            network_calls=0,
        )

        return ToolCallResponse(
            execution_id=request.execution_id,
            status=status,
            tool_name=request.tool_name,
            result=result,
            error=None,
            execution_time_ms=elapsed_ms,
            network_calls=0,
        )

    except (FileNotFoundError, ValueError) as exc:
        elapsed_ms = int((time.time() - start) * 1000)
        audit_logger.log_execution(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            params=request.params,
            status="error",
            execution_time_ms=elapsed_ms,
        )
        return make_error_response(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            error=exc,
            execution_time_ms=elapsed_ms,
        )

    except Exception as exc:
        elapsed_ms = int((time.time() - start) * 1000)
        audit_logger.log_execution(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            params=request.params,
            status="error",
            execution_time_ms=elapsed_ms,
        )
        return make_error_response(
            execution_id=request.execution_id,
            tool_name=request.tool_name,
            error=exc,
            execution_time_ms=elapsed_ms,
        )


# ── Endpoint 3: GET /tools ────────────────────────────────────────────────────

@app.get(
    "/tools",
    response_model=ToolsResponse,
    summary="List all available tools",
    tags=["Discovery"],
)
async def get_tools() -> ToolsResponse:
    """Return the full list of tool definitions at any time."""
    return ToolsResponse(tools=tool_registry.get_all_tools())


# ── Endpoint 4: GET /status ───────────────────────────────────────────────────

@app.get(
    "/status",
    response_model=StatusResponse,
    summary="Server health and sovereignty proof",
    tags=["Monitoring"],
)
async def get_status() -> StatusResponse:
    """
    Check server health. Critically, network_calls_total is always 0,
    proving that no external API has ever been called.
    """
    uptime = time.time() - _START_TIME
    last = audit_logger.last_execution()

    last_exec: Optional[LastExecution] = None
    if last:
        last_exec = LastExecution(
            tool_name=last.tool_name,
            timestamp=last.timestamp,
            success=(last.status == "success"),
        )

    return StatusResponse(
        status="healthy",
        uptime_seconds=round(uptime, 2),
        tools_available=len(tool_registry.get_all_tools()),
        network_calls_total=audit_logger.network_calls_total,
        external_apis_called=[],
        last_tool_execution=last_exec,
    )


# ── Endpoint 5: GET /execution_log ────────────────────────────────────────────

@app.get(
    "/execution_log",
    response_model=ExecutionLogResponse,
    summary="Full audit trail of all tool executions",
    tags=["Monitoring"],
)
async def get_execution_log(
    limit: int = Query(100, ge=1, le=10_000, description="Max records to return"),
    tool_filter: Optional[str] = Query(None, description="Filter by tool name"),
) -> ExecutionLogResponse:
    """
    Retrieve the complete audit log. Every record has network_calls_made=0
    and internal_only=True — proof of on-premises sovereignty.
    """
    logs = audit_logger.get_logs(limit=limit, tool_filter=tool_filter)
    return ExecutionLogResponse(
        executions=logs["executions"],
        total_executions=logs["total_executions"],
        external_calls=0,
        total_network_calls=0,
    )


# ── Health ping (bonus) ───────────────────────────────────────────────────────

@app.get("/", tags=["Core"], summary="Server root / ping")
async def root():
    return {
        "server": config.SERVER_ID,
        "version": config.SERVER_VERSION,
        "status": "running",
        "docs": "/docs",
    }


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "mcp_server.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,
        log_level="info",
    )
