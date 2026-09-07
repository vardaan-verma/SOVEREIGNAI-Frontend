"""
docker_manager.py — Lifecycle manager for Docker sandbox containers.

execute_python and execute_bash use this to spin up short-lived
containers with zero network access (network_mode="none"), capture
stdout/stderr, enforce a timeout, then automatically remove the container.

If Docker is not available the manager raises DockerUnavailableError
and the code_execution tools fall back to a restricted subprocess runner.
"""

from __future__ import annotations

import io
import time
from typing import Dict, Any, Optional

from mcp_server import config


class DockerUnavailableError(RuntimeError):
    """Raised when the Docker daemon cannot be reached."""


class SandboxResult:
    def __init__(
        self,
        stdout: str = "",
        stderr: str = "",
        return_code: int = 0,
        execution_time_ms: int = 0,
        timeout_occurred: bool = False,
    ) -> None:
        self.stdout = stdout
        self.stderr = stderr
        self.return_code = return_code
        self.execution_time_ms = execution_time_ms
        self.timeout_occurred = timeout_occurred

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stdout": self.stdout,
            "stderr": self.stderr,
            "return_code": self.return_code,
            "execution_time_ms": self.execution_time_ms,
            "timeout_occurred": self.timeout_occurred,
        }


def _get_docker_client():
    """Lazily import and return a Docker client, raising DockerUnavailableError if unavailable."""
    try:
        import docker  # type: ignore
        client = docker.from_env()
        client.ping()  # verify daemon is alive
        return client
    except ImportError:
        raise DockerUnavailableError(
            "The 'docker' Python package is not installed. "
            "Run: pip install docker"
        )
    except Exception as exc:
        raise DockerUnavailableError(
            f"Docker daemon is not reachable: {exc}. "
            "Make sure Docker Desktop (Windows) or dockerd (Linux) is running."
        )


def run_in_sandbox(
    *,
    command: list[str],
    timeout: int = config.DEFAULT_TOOL_TIMEOUT,
    image: str = config.SANDBOX_IMAGE,
) -> SandboxResult:
    """
    Run *command* inside the sandbox Docker image.

    - network_mode="none" → zero egress
    - Container is always removed after execution
    - Timeout enforced at the Docker level
    """
    client = _get_docker_client()

    start = time.time()
    timeout_occurred = False
    stdout_bytes = b""
    stderr_bytes = b""
    return_code = 0

    try:
        container = client.containers.run(
            image=image,
            command=command,
            network_mode=config.SANDBOX_NETWORK,
            detach=True,
            stdout=True,
            stderr=True,
            remove=False,   # we remove manually after capturing logs
            mem_limit="512m",
            cpu_period=100_000,
            cpu_quota=50_000,   # 50% of one CPU
        )

        try:
            result = container.wait(timeout=timeout)
            return_code = result.get("StatusCode", 0)
        except Exception:
            # Timeout or Docker wait error
            timeout_occurred = True
            return_code = 124  # standard "timed out" exit code
            try:
                container.kill()
            except Exception:
                pass

        try:
            stdout_bytes = container.logs(stdout=True, stderr=False)
            stderr_bytes = container.logs(stdout=False, stderr=True)
        except Exception:
            pass

        try:
            container.remove(force=True)
        except Exception:
            pass

    except Exception as exc:
        return SandboxResult(
            stdout="",
            stderr=str(exc),
            return_code=1,
            execution_time_ms=int((time.time() - start) * 1000),
            timeout_occurred=False,
        )

    elapsed_ms = int((time.time() - start) * 1000)
    return SandboxResult(
        stdout=stdout_bytes.decode("utf-8", errors="replace"),
        stderr=stderr_bytes.decode("utf-8", errors="replace"),
        return_code=return_code,
        execution_time_ms=elapsed_ms,
        timeout_occurred=timeout_occurred,
    )
