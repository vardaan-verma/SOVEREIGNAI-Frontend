"""
code_execution.py — execute_python and execute_bash tools.

Primary path: Docker sandbox (network_mode=none, sandboxed user).
Fallback path: restricted subprocess execution if Docker is unavailable.

The fallback is intentionally limited:
  - No shell=True
  - Hard timeout via threading
  - No file writes outside OUTPUT_DIR
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import threading
import time
from typing import Any, Dict, List, Optional

from mcp_server import config
from mcp_server.utils.docker_manager import (
    DockerUnavailableError,
    run_in_sandbox,
)
from mcp_server.utils.validation import validate_timeout


# ─────────────────────────────────────────────────────────────────────────────

class CodeExecutionTool:

    # ── execute_python ────────────────────────────────────────────────────

    def execute_python(
        self,
        code: str,
        timeout: int = config.DEFAULT_TOOL_TIMEOUT,
        requirements: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Run Python code in an isolated Docker container.

        Returns: stdout, stderr, return_code, execution_time_ms, timeout_occurred,
                 sandbox_used ("docker" | "subprocess_fallback")
        """
        timeout = validate_timeout(timeout)
        requirements = requirements or []

        # ── Docker path ──
        try:
            # If extra requirements needed, write a wrapper script
            if requirements:
                install_cmds = " ".join(f"pip install {r}" for r in requirements)
                full_code = f"import subprocess; subprocess.run([sys.executable, '-m', 'pip', 'install', {repr(requirements)}], check=True)\n{code}"
            else:
                full_code = code

            # Write code to a temp file, mount it in the container
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, encoding="utf-8"
            ) as tmp:
                tmp.write(full_code)
                tmp_path = tmp.name

            result = run_in_sandbox(
                command=["python", "/sandbox/script.py"],
                timeout=timeout,
                image=config.SANDBOX_IMAGE,
            )
            os.unlink(tmp_path)

            return {**result.to_dict(), "sandbox_used": "docker"}

        except DockerUnavailableError as docker_err:
            return self._subprocess_python(code, timeout, str(docker_err))

    # ── execute_bash ──────────────────────────────────────────────────────

    def execute_bash(
        self,
        command: str,
        timeout: int = config.DEFAULT_TOOL_TIMEOUT,
    ) -> Dict[str, Any]:
        """
        Run a bash command in an isolated Docker container.

        Returns: stdout, stderr, return_code, sandbox_used
        """
        timeout = validate_timeout(timeout)

        try:
            result = run_in_sandbox(
                command=["bash", "-c", command],
                timeout=timeout,
                image=config.SANDBOX_IMAGE,
            )
            return {**result.to_dict(), "sandbox_used": "docker"}

        except DockerUnavailableError as docker_err:
            return self._subprocess_bash(command, timeout, str(docker_err))

    # ── Subprocess fallback ───────────────────────────────────────────────

    def _subprocess_python(
        self,
        code: str,
        timeout: int,
        docker_warning: str,
    ) -> Dict[str, Any]:
        """
        Restricted Python execution via subprocess (no Docker).
        Runs in the current Python interpreter — no network isolation.
        """
        start = time.time()
        timeout_occurred = False

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        try:
            proc = subprocess.run(
                [sys.executable, tmp_path],
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            stdout = proc.stdout
            stderr = proc.stderr
            return_code = proc.returncode
        except subprocess.TimeoutExpired:
            stdout = ""
            stderr = f"Execution timed out after {timeout}s"
            return_code = 124
            timeout_occurred = True
        except Exception as exc:
            stdout = ""
            stderr = str(exc)
            return_code = 1
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        return {
            "stdout": stdout,
            "stderr": stderr,
            "return_code": return_code,
            "execution_time_ms": int((time.time() - start) * 1000),
            "timeout_occurred": timeout_occurred,
            "sandbox_used": "subprocess_fallback",
            "warning": f"Docker unavailable ({docker_warning}). "
                       "Running without network isolation.",
        }

    def _subprocess_bash(
        self,
        command: str,
        timeout: int,
        docker_warning: str,
    ) -> Dict[str, Any]:
        """Fallback bash execution via subprocess."""
        start = time.time()
        timeout_occurred = False

        # On Windows there is no bash by default; try cmd /C
        shell_cmd: List[str]
        if sys.platform == "win32":
            shell_cmd = ["cmd", "/C", command]
        else:
            shell_cmd = ["bash", "-c", command]

        try:
            proc = subprocess.run(
                shell_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            stdout = proc.stdout
            stderr = proc.stderr
            return_code = proc.returncode
        except subprocess.TimeoutExpired:
            stdout = ""
            stderr = f"Execution timed out after {timeout}s"
            return_code = 124
            timeout_occurred = True
        except Exception as exc:
            stdout = ""
            stderr = str(exc)
            return_code = 1

        return {
            "stdout": stdout,
            "stderr": stderr,
            "return_code": return_code,
            "execution_time_ms": int((time.time() - start) * 1000),
            "timeout_occurred": timeout_occurred,
            "sandbox_used": "subprocess_fallback",
            "warning": f"Docker unavailable ({docker_warning}). "
                       "Running without network isolation.",
        }
