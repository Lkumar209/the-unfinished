"""Gutendex API integration. Fails gracefully — caller gets None on any error."""
from __future__ import annotations
import logging
import re
from functools import lru_cache

import httpx

logger = logging.getLogger(__name__)
BASE = "https://gutendex.com/books"
TIMEOUT = 5.0


@lru_cache(maxsize=32)
def _search(query: str) -> dict | None:
    try:
        resp = httpx.get(BASE, params={"search": query}, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None
    except Exception as e:
        logger.warning("[gutendex] search failed for %r: %s", query, e)
        return None


def fetch_passage(author: str, work_title: str, chapter_hint: str) -> str | None:
    """Fetch a passage near the chapter_hint from the first matching Gutenberg book."""
    book = _search(f"{work_title} {author}")
    if not book:
        return None

    formats = book.get("formats", {})
    text_url = (
        formats.get("text/plain; charset=us-ascii")
        or formats.get("text/plain; charset=utf-8")
        or formats.get("text/plain")
    )
    if not text_url:
        logger.warning("[gutendex] no plain text URL for %r", work_title)
        return None

    try:
        resp = httpx.get(text_url, timeout=10.0)
        resp.raise_for_status()
        full_text = resp.text
    except Exception as e:
        logger.warning("[gutendex] text fetch failed: %s", e)
        return None

    return _extract_chapter(full_text, chapter_hint)


def _extract_chapter(text: str, chapter_hint: str) -> str:
    """Find chapter_hint in text and return ~200 words around it."""
    # try to find the chapter heading
    pattern = re.escape(chapter_hint)
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        # try just the number
        num = re.search(r"\d+", chapter_hint)
        if num:
            m = re.search(rf"\bchapter\s+{num.group()}\b", text, re.IGNORECASE)
    if not m:
        # return first 200 words as fallback
        return " ".join(text.split()[:200])

    start = m.end()
    words = text[start:start + 2000].split()
    return " ".join(words[:200])


# Pittsburgh writing groups fallback fixture
PITTSBURGH_PLACES = [
    {"name": "carnegie library writers' circle", "details": "thursdays 7pm · squirrel hill · 2.1 mi · all mediums welcome"},
    {"name": "white whale bookstore — first draft night", "details": "sundays 5pm · bloomfield · 1.4 mi · short prose, read aloud"},
    {"name": "ace hotel lobby write-in", "details": "tuesdays 6pm · east liberty · 2.8 mi · quiet, free, no signup"},
]
