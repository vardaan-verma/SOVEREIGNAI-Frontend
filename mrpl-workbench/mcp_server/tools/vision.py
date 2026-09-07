"""
vision.py — vision_read_pdf and vision_read_image tools.

OCR backend priority:
  1. PaddleOCR  (if installed + OCR_BACKEND != "tesseract")
  2. pytesseract (fallback for Windows dev environments)
  3. pypdf text layer only (last resort, no OCR)

All processing is local — zero network calls.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict, List

from mcp_server import config
from mcp_server.utils.validation import validate_path


# ─── OCR backend detection ────────────────────────────────────────────────────

def _detect_backend() -> str:
    backend = config.OCR_BACKEND.lower()
    if backend in ("paddleocr", "tesseract"):
        return backend

    # auto-detect
    try:
        from paddleocr import PaddleOCR  # noqa: F401
        return "paddleocr"
    except ImportError:
        pass
    try:
        import pytesseract  # noqa: F401
        return "tesseract"
    except ImportError:
        pass
    return "pypdf"


_BACKEND: str = _detect_backend()


# ─── PaddleOCR helpers ────────────────────────────────────────────────────────

_paddle_ocr_instance = None

def _get_paddle_ocr():
    global _paddle_ocr_instance
    if _paddle_ocr_instance is None:
        from paddleocr import PaddleOCR
        _paddle_ocr_instance = PaddleOCR(use_gpu=config.PADDLE_USE_GPU, show_log=False)
    return _paddle_ocr_instance


def _ocr_image_with_paddle(image_path: str) -> tuple[str, float]:
    """Return (text, avg_confidence) for a single image using PaddleOCR."""
    ocr = _get_paddle_ocr()
    result = ocr.ocr(image_path, cls=True)
    lines: List[str] = []
    confidences: List[float] = []
    if result:
        for page in result:
            if page:
                for line in page:
                    if line and len(line) >= 2:
                        text_info = line[1]
                        if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                            lines.append(str(text_info[0]))
                            confidences.append(float(text_info[1]))
    text = "\n".join(lines)
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    return text, avg_conf


# ─── Tesseract helpers ────────────────────────────────────────────────────────

def _ocr_image_with_tesseract(image_path: str) -> tuple[str, float]:
    """Return (text, confidence) using pytesseract."""
    import pytesseract  # type: ignore
    from PIL import Image  # type: ignore
    img = Image.open(image_path)
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    words = [w for w, c in zip(data["text"], data["conf"]) if int(c) > 0 and w.strip()]
    confs = [int(c) / 100 for c in data["conf"] if int(c) > 0]
    text = " ".join(words)
    avg_conf = sum(confs) / len(confs) if confs else 0.0
    return text, avg_conf


# ─── PDF-to-images helper ─────────────────────────────────────────────────────

def _pdf_to_images(pdf_path: str) -> List[str]:
    """
    Convert a PDF to a list of temporary image paths.

    Tries pdf2image first, falls back to pypdf text extraction.
    Returns [] if nothing works so callers can degrade gracefully.
    """
    tmp_paths: List[str] = []
    try:
        from pdf2image import convert_from_path  # type: ignore
        import tempfile, os
        pages = convert_from_path(pdf_path, dpi=200)
        tmp_dir = tempfile.mkdtemp(prefix="mrpl_vision_")
        for i, page in enumerate(pages):
            img_path = os.path.join(tmp_dir, f"page_{i}.png")
            page.save(img_path, "PNG")
            tmp_paths.append(img_path)
    except Exception:
        pass
    return tmp_paths


def _extract_text_with_pypdf(pdf_path: str) -> tuple[str, int]:
    """Extract raw text layer from PDF (no OCR)."""
    try:
        import pypdf  # type: ignore
        reader = pypdf.PdfReader(pdf_path)
        pages_text = []
        for page in reader.pages:
            pages_text.append(page.extract_text() or "")
        return "\n".join(pages_text), len(reader.pages)
    except Exception:
        return "", 0


# ─── Public tool class ────────────────────────────────────────────────────────

class VisionTool:

    # ── vision_read_pdf ───────────────────────────────────────────────────

    def read_pdf(
        self,
        file_path: str,
        extract_text: bool = True,
        extract_images: bool = False,
    ) -> Dict[str, Any]:
        """
        Read a scanned PDF and extract text using the available OCR backend.

        Returns schema:
          text, num_pages, confidence, per_page_confidence,
          images_extracted, extraction_time_ms, backend_used
        """
        start = time.time()
        resolved = validate_path(file_path, must_exist=True)

        if not extract_text:
            return {
                "text": "",
                "num_pages": 0,
                "confidence": 0.0,
                "per_page_confidence": [],
                "images_extracted": 0,
                "extraction_time_ms": 0,
                "backend_used": "none",
            }

        # 1. Try full OCR path
        if _BACKEND in ("paddleocr", "tesseract"):
            image_paths = _pdf_to_images(str(resolved))

            if image_paths:
                all_texts: List[str] = []
                per_page_conf: List[float] = []

                for img_path in image_paths:
                    try:
                        if _BACKEND == "paddleocr":
                            text, conf = _ocr_image_with_paddle(img_path)
                        else:
                            text, conf = _ocr_image_with_tesseract(img_path)
                        all_texts.append(text)
                        per_page_conf.append(round(conf, 4))
                    except Exception as exc:
                        all_texts.append(f"[OCR error on page: {exc}]")
                        per_page_conf.append(0.0)
                    finally:
                        try:
                            Path(img_path).unlink(missing_ok=True)
                        except Exception:
                            pass

                full_text = "\n\n".join(all_texts)
                avg_conf = sum(per_page_conf) / len(per_page_conf) if per_page_conf else 0.0

                return {
                    "text": full_text,
                    "num_pages": len(image_paths),
                    "confidence": round(avg_conf, 4),
                    "per_page_confidence": per_page_conf,
                    "images_extracted": 0,
                    "extraction_time_ms": int((time.time() - start) * 1000),
                    "backend_used": _BACKEND,
                }

        # 2. Fallback — pypdf text layer extraction
        text, num_pages = _extract_text_with_pypdf(str(resolved))
        return {
            "text": text,
            "num_pages": num_pages,
            "confidence": 1.0 if text.strip() else 0.0,
            "per_page_confidence": [1.0] * num_pages,
            "images_extracted": 0,
            "extraction_time_ms": int((time.time() - start) * 1000),
            "backend_used": "pypdf_text_only",
        }

    # ── vision_read_image ─────────────────────────────────────────────────

    def read_image(
        self,
        file_path: str,
        detect_diagrams: bool = True,
    ) -> Dict[str, Any]:
        """
        Read an image file (PNG, JPG, BMP) and extract text + detect shapes.

        Returns schema: text, confidence, diagrams_detected, shapes
        """
        start = time.time()
        resolved = validate_path(file_path, must_exist=True)

        text = ""
        confidence = 0.0
        diagrams: List[str] = []
        shapes: List[Dict[str, Any]] = []

        try:
            if _BACKEND == "paddleocr":
                text, confidence = _ocr_image_with_paddle(str(resolved))
            elif _BACKEND == "tesseract":
                text, confidence = _ocr_image_with_tesseract(str(resolved))
            else:
                # no OCR backend — return empty
                text = "[No OCR backend available. Install paddleocr or pytesseract.]"
                confidence = 0.0
        except Exception as exc:
            text = f"[OCR error: {exc}]"
            confidence = 0.0

        # Basic diagram detection: look for engineering keywords in text
        if detect_diagrams and text:
            diagram_keywords = [
                "flow", "diagram", "schematic", "P&ID", "P&I",
                "valve", "pump", "heat exchanger", "vessel", "pipeline",
            ]
            found = [kw for kw in diagram_keywords if kw.lower() in text.lower()]
            diagrams = found

        return {
            "text": text,
            "confidence": round(confidence, 4),
            "diagrams_detected": diagrams,
            "shapes": shapes,
            "extraction_time_ms": int((time.time() - start) * 1000),
            "backend_used": _BACKEND,
        }
