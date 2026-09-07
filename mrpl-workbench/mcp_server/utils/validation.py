"""
validation.py — Path security and input validation helpers.

All file-based tools must pass paths through validate_path() before
touching the filesystem. This restricts access to the configured
output directory and the current working directory only.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from mcp_server import config


# Directories that are NEVER allowed, even if they pass other checks
_FORBIDDEN_PREFIXES = [
    "/etc", "/sys", "/proc", "/dev", "/boot", "/root",
    "C:\\Windows", "C:\\System32", "C:\\Program Files",
]


def validate_path(path: str, must_exist: bool = False) -> Path:
    """
    Validate and return a resolved Path.

    Allowed roots:
      - config.OUTPUT_DIR  (~/output/)
      - Current working directory

    Raises ValueError with a descriptive message on failure.
    """
    if not path or not path.strip():
        raise ValueError("File path must not be empty.")

    p = Path(path)

    # Resolve relative paths against the output dir by default
    if not p.is_absolute():
        p = config.OUTPUT_DIR / p

    try:
        resolved = p.resolve()
    except Exception as exc:
        raise ValueError(f"Cannot resolve path '{path}': {exc}") from exc

    # Check forbidden system prefixes
    resolved_str = str(resolved)
    for prefix in _FORBIDDEN_PREFIXES:
        if resolved_str.startswith(prefix):
            raise ValueError(
                f"Access denied: path '{resolved_str}' is in a restricted area."
            )

    # Must be under an allowed root
    allowed_roots = [
        config.OUTPUT_DIR.resolve(),
        Path(os.getcwd()).resolve(),
    ]

    if not any(
        _is_subpath(resolved, root) for root in allowed_roots
    ):
        raise ValueError(
            f"Access denied: '{resolved_str}' is outside allowed directories "
            f"({', '.join(str(r) for r in allowed_roots)})."
        )

    if must_exist and not resolved.exists():
        raise FileNotFoundError(f"File not found: {resolved_str}")

    return resolved


def _is_subpath(child: Path, parent: Path) -> bool:
    """Return True if child is the same as parent or nested inside it."""
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_timeout(timeout: Optional[int], default: int = config.DEFAULT_TOOL_TIMEOUT) -> int:
    """Clamp timeout to [1, MAX_TOOL_TIMEOUT]."""
    if timeout is None:
        return default
    return max(1, min(int(timeout), config.MAX_TOOL_TIMEOUT))
