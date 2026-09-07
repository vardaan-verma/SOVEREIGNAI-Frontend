"""
file_io.py — file_read, file_write, and docx_write tools.

All writes are restricted to config.OUTPUT_DIR.
All reads are validated through the path validator.
Zero external calls — 100% local.
"""

from __future__ import annotations

import csv
import io
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from mcp_server import config
from mcp_server.utils.validation import validate_path


class FileIOTool:

    # ── file_read ─────────────────────────────────────────────────────────

    def file_read(
        self,
        file_path: str,
        encoding: str = "utf-8",
    ) -> Dict[str, Any]:
        """
        Read any plain-text, JSON, or CSV file.

        Returns: content, file_type, size_bytes, encoding, num_lines
        """
        start = time.time()
        resolved = validate_path(file_path, must_exist=True)
        suffix = resolved.suffix.lower()

        raw = resolved.read_bytes()
        size_bytes = len(raw)

        try:
            text = raw.decode(encoding)
        except UnicodeDecodeError:
            # Try utf-8-sig (BOM) then latin-1
            for enc in ("utf-8-sig", "latin-1"):
                try:
                    text = raw.decode(enc)
                    encoding = enc
                    break
                except UnicodeDecodeError:
                    continue
            else:
                text = raw.decode("latin-1", errors="replace")
                encoding = "latin-1"

        # For CSV, also parse into structured data
        parsed: Optional[Any] = None
        if suffix == ".json":
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                parsed = None
        elif suffix == ".csv":
            try:
                reader = csv.DictReader(io.StringIO(text))
                parsed = list(reader)
            except Exception:
                parsed = None

        result: Dict[str, Any] = {
            "content": text,
            "file_type": suffix.lstrip(".") if suffix else "txt",
            "size_bytes": size_bytes,
            "encoding": encoding,
            "num_lines": text.count("\n") + 1,
            "read_time_ms": int((time.time() - start) * 1000),
        }
        if parsed is not None:
            result["parsed_data"] = parsed

        return result

    # ── file_write ────────────────────────────────────────────────────────

    def file_write(
        self,
        file_path: str,
        content: str,
        format: str = "txt",
    ) -> Dict[str, Any]:
        """
        Write text content to a file inside config.OUTPUT_DIR.

        Returns: path, status, size_bytes, created_at
        """
        start = time.time()

        # Force the write into OUTPUT_DIR (never raw absolute paths)
        safe_name = Path(file_path).name
        if not safe_name:
            safe_name = "output.txt"

        # Add extension if missing
        if "." not in safe_name:
            safe_name = f"{safe_name}.{format}"

        dest = config.OUTPUT_DIR / safe_name
        dest.parent.mkdir(parents=True, exist_ok=True)

        existing = dest.exists()
        encoded = content.encode("utf-8")
        dest.write_bytes(encoded)

        return {
            "path": str(dest),
            "status": "updated" if existing else "created",
            "size_bytes": len(encoded),
            "created_at": datetime.utcnow().isoformat() + "Z",
            "write_time_ms": int((time.time() - start) * 1000),
        }

    # ── docx_write ────────────────────────────────────────────────────────

    def docx_write(
        self,
        title: str,
        sections: List[Dict[str, Any]],
        output_name: str,
        add_timestamp: bool = True,
    ) -> Dict[str, Any]:
        """
        Create a formatted .docx file with headings and sections.

        Section object shape:
          { "heading": str, "content": str, "type": "text" | "table" | "list" }

        Returns: path, pages, status, file_size_bytes
        """
        start = time.time()

        try:
            from docx import Document  # type: ignore
            from docx.shared import Pt, RGBColor  # type: ignore
            from docx.enum.text import WD_ALIGN_PARAGRAPH  # type: ignore
        except ImportError:
            raise RuntimeError(
                "python-docx is not installed. Run: pip install python-docx"
            )

        doc = Document()

        # ── Title ──
        title_para = doc.add_heading(title, level=0)
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

        # ── Timestamp ──
        if add_timestamp:
            ts = doc.add_paragraph(
                f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
            )
            ts.alignment = WD_ALIGN_PARAGRAPH.CENTER

        doc.add_paragraph("")  # spacer

        # ── Sections ──
        for section in sections:
            heading = section.get("heading", "")
            content = section.get("content", "")
            sec_type = section.get("type", "text")

            if heading:
                doc.add_heading(heading, level=1)

            if sec_type == "table" and isinstance(content, list):
                # content is expected to be list-of-dicts
                if content:
                    headers = list(content[0].keys())
                    table = doc.add_table(rows=1, cols=len(headers))
                    table.style = "Table Grid"
                    hdr_cells = table.rows[0].cells
                    for i, h in enumerate(headers):
                        hdr_cells[i].text = str(h)
                    for row_data in content:
                        row_cells = table.add_row().cells
                        for i, h in enumerate(headers):
                            row_cells[i].text = str(row_data.get(h, ""))
            elif sec_type == "list" and isinstance(content, list):
                for item in content:
                    doc.add_paragraph(str(item), style="List Bullet")
            else:
                doc.add_paragraph(str(content))

        # ── Save ──
        safe_name = output_name.replace(" ", "_")
        if add_timestamp:
            ts_str = datetime.utcnow().strftime("%Y-%m-%d")
            safe_name = f"{safe_name}_{ts_str}"

        dest = config.OUTPUT_DIR / f"{safe_name}.docx"
        config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        doc.save(str(dest))

        file_size = dest.stat().st_size
        # Rough page estimate (docx doesn't have built-in page count)
        page_estimate = max(1, len(sections) // 3 + 1)

        return {
            "path": str(dest),
            "pages": page_estimate,
            "status": "created",
            "file_size_bytes": file_size,
            "write_time_ms": int((time.time() - start) * 1000),
        }
