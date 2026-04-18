"""File text extraction. Handles .txt, .docx, .pdf, .fdx. Others return empty."""
from __future__ import annotations
import logging
import re

logger = logging.getLogger(__name__)


def extract_text(filename: str, content: bytes) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "txt":
        return _from_txt(content)
    if ext == "docx":
        return _from_docx(content)
    if ext == "pdf":
        return _from_pdf(content)
    if ext == "fdx":
        return _from_fdx(content)

    logger.warning("unsupported file type: %s — no text extracted", filename)
    return ""


def _from_txt(content: bytes) -> str:
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace")


def _from_docx(content: bytes) -> str:
    try:
        import io
        from docx import Document

        doc = Document(io.BytesIO(content))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        logger.warning("docx parse failed: %s", e)
        return ""


def _from_pdf(content: bytes) -> str:
    try:
        import io
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)
    except Exception as e:
        logger.warning("pdf parse failed: %s", e)
        return ""


def _from_fdx(content: bytes) -> str:
    """Final Draft XML — extract dialogue and action paragraphs."""
    try:
        import xml.etree.ElementTree as ET

        root = ET.fromstring(content)
        parts = []
        for elem in root.iter("Paragraph"):
            ptype = elem.get("Type", "")
            if ptype in ("Action", "Dialogue", "Character", "Transition", "Scene Heading"):
                text = "".join(t for t in elem.itertext()).strip()
                if text:
                    parts.append(text)
        return "\n\n".join(parts)
    except Exception as e:
        logger.warning("fdx parse failed: %s", e)
        return ""


def infer_medium(filename: str, text: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    lower_name = filename.lower()

    # extension hard rules
    if ext == "fdx":
        return "screenplay"
    if ext in ("mp3", "wav", "aiff", "flac", "m4a"):
        return "song"
    if ext in ("jpg", "jpeg", "png", "gif", "webp"):
        return "painting"

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    word_count = len(text.split())

    # screenplay: scene headings are unambiguous
    scene_headings = len(re.findall(r"\b(INT\.|EXT\.)\s", text))
    if scene_headings >= 3:
        return "screenplay"

    # song detection — require actual song structure, not just short length:
    # short average line length + either chorus/verse markers or high repetition
    if lines:
        avg_line_words = sum(len(l.split()) for l in lines) / len(lines)
        has_song_markers = bool(re.search(
            r"\b(chorus|verse|bridge|pre-chorus|outro|hook|refrain)\b",
            text, re.IGNORECASE
        ))
        # count how many lines appear 2+ times (chorus repetition)
        line_counts = {}
        for l in lines:
            if len(l.split()) >= 3:
                line_counts[l.lower()] = line_counts.get(l.lower(), 0) + 1
        repeated_lines = sum(1 for c in line_counts.values() if c >= 2)
        is_song_structure = avg_line_words < 7 and (has_song_markers or repeated_lines >= 2)
        if is_song_structure and word_count < 2000:
            return "song"

    return "novel"


def infer_title(filename: str) -> str:
    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    # replace underscores/hyphens with spaces, strip numbers at start
    title = re.sub(r"[_\-]+", " ", base).strip()
    title = re.sub(r"^\d+\s*", "", title)
    return title.lower() or "untitled"


def infer_last_touched(filename: str) -> str:
    """Extract date from filename if present, else return empty string."""
    months = {
        "jan": "jan", "feb": "feb", "mar": "mar", "apr": "apr",
        "may": "may", "jun": "jun", "jul": "jul", "aug": "aug",
        "sep": "sep", "oct": "oct", "nov": "nov", "dec": "dec",
    }
    for abbr in months:
        if abbr in filename.lower():
            # look for a 4-digit year nearby
            m = re.search(r"(\d{4})", filename)
            year = m.group(1) if m else ""
            return f"{abbr} {year}".strip()
    return ""
