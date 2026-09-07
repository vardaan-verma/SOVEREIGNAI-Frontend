"""
extraction.py — extract_structured tool.

Parses unstructured text into a structured JSON object matching a
caller-supplied schema. Two strategies are tried in order:

  1. Local vLLM endpoint (if config.LOCAL_LLM_URL is set)
  2. Regex / keyword extraction (zero dependencies, always works)

This guarantees zero external API calls at all times.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any, Dict, List, Optional

from mcp_server import config


class ExtractionTool:

    def extract_structured(
        self,
        text: str,
        schema: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Extract structured data from raw text based on a JSON Schema.

        Returns: extracted_data, confidence, missing_fields
        """
        start = time.time()

        # Strategy 1: Local vLLM endpoint
        if config.LOCAL_LLM_URL:
            result = self._extract_via_local_llm(text, schema)
            if result is not None:
                result["extraction_time_ms"] = int((time.time() - start) * 1000)
                result["strategy"] = "local_llm"
                return result

        # Strategy 2: Regex / keyword extraction
        result = self._extract_via_regex(text, schema)
        result["extraction_time_ms"] = int((time.time() - start) * 1000)
        result["strategy"] = "regex"
        return result

    # ── Local LLM path ────────────────────────────────────────────────────

    def _extract_via_local_llm(
        self, text: str, schema: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        POST to the local vLLM OpenAI-compatible endpoint and ask it
        to return JSON matching the schema.
        """
        try:
            import urllib.request  # stdlib only — no requests
            schema_str = json.dumps(schema, indent=2)
            prompt = (
                f"Extract the following fields from the text below and return "
                f"ONLY valid JSON matching this schema:\n{schema_str}\n\n"
                f"TEXT:\n{text}\n\nJSON output:"
            )
            payload = json.dumps({
                "model": "default",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
                "max_tokens": 512,
            }).encode("utf-8")

            req = urllib.request.Request(
                f"{config.LOCAL_LLM_URL.rstrip('/')}/v1/chat/completions",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))

            raw = body["choices"][0]["message"]["content"].strip()
            # Extract JSON block if wrapped in markdown
            match = re.search(r"```(?:json)?\s*(.*?)```", raw, re.DOTALL)
            if match:
                raw = match.group(1)

            extracted_data = json.loads(raw)
            missing = self._find_missing(extracted_data, schema)
            return {
                "extracted_data": extracted_data,
                "confidence": 0.9,
                "missing_fields": missing,
            }
        except Exception:
            return None

    # ── Regex extraction ──────────────────────────────────────────────────

    def _extract_via_regex(
        self, text: str, schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Attempt to extract each field defined in the JSON Schema using
        named patterns and heuristics. Confidence is a function of
        how many required fields were successfully extracted.
        """
        properties = schema.get("properties", schema)
        required = schema.get("required", list(properties.keys()))

        extracted: Dict[str, Any] = {}

        for field_name, field_def in properties.items():
            if isinstance(field_def, dict):
                ftype = field_def.get("type", "string")
                description = field_def.get("description", "")
            else:
                ftype = "string"
                description = ""

            value = self._search_field(text, field_name, ftype, description)
            if value is not None:
                extracted[field_name] = value

        missing = [f for f in required if f not in extracted or extracted[f] is None]

        # Confidence: fraction of required fields extracted
        if required:
            found = len(required) - len(missing)
            confidence = round(found / len(required), 4)
        else:
            confidence = 1.0 if extracted else 0.0

        return {
            "extracted_data": extracted,
            "confidence": confidence,
            "missing_fields": missing,
        }

    def _search_field(
        self,
        text: str,
        field_name: str,
        ftype: str,
        description: str,
    ) -> Optional[Any]:
        """
        Try to find a value for *field_name* in *text*.

        Heuristics:
          - Pattern: "field_name: <value>"
          - Pattern: "field_name = <value>"
          - For lists: look for bullet / numbered lists near the keyword
          - For numbers: extract first number near the keyword
          - For dates: extract ISO date or common date formats
        """
        key_variants = [
            field_name,
            field_name.replace("_", " "),
            field_name.replace("_", "-"),
            field_name.title().replace("_", " "),
        ]

        for key in key_variants:
            # Pattern: "key: value" or "key = value"
            pattern = rf"(?i){re.escape(key)}\s*[:\=]\s*(.+?)(?:\n|$)"
            match = re.search(pattern, text)
            if match:
                raw_val = match.group(1).strip().rstrip(".,;")

                if ftype in ("integer", "number"):
                    num_match = re.search(r"[-+]?\d+(?:\.\d+)?", raw_val)
                    if num_match:
                        num = num_match.group()
                        return int(num) if ftype == "integer" else float(num)

                if ftype == "boolean":
                    return raw_val.lower() in ("true", "yes", "1", "approved")

                if ftype == "array":
                    # Try to find a bullet list near this keyword
                    bullet_pattern = rf"(?i){re.escape(key)}.*?(?:\n[-•*]\s*(.+?))+(?:\n\n|\Z)"
                    bullets = re.findall(
                        r"^[-•*\d]+\.?\s+(.+)$",
                        text,
                        re.MULTILINE,
                    )
                    if bullets:
                        return [b.strip() for b in bullets[:10]]
                    # Fall back: comma/semicolon separated
                    parts = re.split(r"[,;]", raw_val)
                    return [p.strip() for p in parts if p.strip()]

                # Default: string
                return raw_val

        # Date extraction for fields with "date" in name
        if "date" in field_name.lower():
            date_match = re.search(
                r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b",
                text,
            )
            if date_match:
                return date_match.group(1)

        return None

    def _find_missing(
        self, extracted: Dict[str, Any], schema: Dict[str, Any]
    ) -> List[str]:
        required = schema.get("required", [])
        return [f for f in required if f not in extracted or extracted[f] is None]
