"""
orchestration.py — chain_tools and get_execution_log tools.

chain_tools runs a list of tool call steps in order, passing the
output of one step as available context for the next. All calls
go through the same tool dispatcher used by POST /call_tool.

get_execution_log is a thin wrapper over the global audit_logger.
"""

from __future__ import annotations

import time
from typing import Any, Callable, Dict, List, Optional

from mcp_server.utils.audit_logger import audit_logger


class OrchestrationTool:
    """
    Orchestration tools. The *dispatcher* callable must be injected
    at construction time to avoid circular imports with tool_registry.
    """

    def __init__(self, dispatcher: Callable[[str, Dict[str, Any]], Dict[str, Any]]) -> None:
        """
        dispatcher(tool_name, params) → result dict
        This will be set to tool_registry.dispatch() by main.py.
        """
        self._dispatch = dispatcher

    # ── chain_tools ───────────────────────────────────────────────────────

    def chain_tools(self, steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute a sequence of tool calls in dependency order.

        Each step shape:
          {
            "tool_name": str,
            "params": dict,
            "step_id": str (optional, for depends_on references),
            "depends_on": str (optional, step_id whose output is merged into params)
          }

        The output of a step is stored by step_id and can be referenced
        in subsequent steps via depends_on. When depends_on is set, the
        previous step's result dict is merged into the current step's params
        under the key "previous_result".

        Returns: results (list), execution_log (list), total_time_ms
        """
        chain_start = time.time()
        results: List[Dict[str, Any]] = []
        step_outputs: Dict[str, Any] = {}
        exec_log: List[Dict[str, Any]] = []

        for idx, step in enumerate(steps):
            tool_name = step.get("tool_name", "")
            params = dict(step.get("params", {}))
            step_id = step.get("step_id", f"step_{idx}")
            depends_on = step.get("depends_on")

            # Inject previous result if requested
            if depends_on and depends_on in step_outputs:
                params["previous_result"] = step_outputs[depends_on]

            step_start = time.time()
            status = "success"
            result: Optional[Dict[str, Any]] = None
            error: Optional[str] = None

            try:
                result = self._dispatch(tool_name, params)
            except Exception as exc:
                status = "error"
                error = str(exc)

            elapsed = int((time.time() - step_start) * 1000)

            entry = {
                "step_id": step_id,
                "tool_name": tool_name,
                "status": status,
                "execution_time_ms": elapsed,
                "result": result,
                "error": error,
            }
            results.append(entry)
            exec_log.append(entry)

            if result:
                step_outputs[step_id] = result

            if status == "error":
                # Abort chain on first error
                break

        return {
            "results": results,
            "execution_log": exec_log,
            "total_time_ms": int((time.time() - chain_start) * 1000),
            "steps_completed": len(results),
            "steps_total": len(steps),
        }

    # ── get_execution_log ─────────────────────────────────────────────────

    def get_execution_log(
        self,
        limit: int = 100,
        tool_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Return the global audit log entries.

        Returns: executions, total_external_calls (always 0)
        """
        logs = audit_logger.get_logs(limit=limit, tool_filter=tool_filter)
        # Alias total_network_calls → total_external_calls for spec compatibility
        logs["total_external_calls"] = logs.get("total_network_calls", 0)
        return logs
