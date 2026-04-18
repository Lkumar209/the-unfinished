"""JSON file storage. Single-user demo — no locking needed."""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage"))


def _path(subdir: str, key: str) -> Path:
    return STORAGE_DIR / subdir / f"{key}.json"


def save(subdir: str, key: str, data: dict) -> None:
    p = _path(subdir, key)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def load(subdir: str, key: str) -> Optional[dict]:
    p = _path(subdir, key)
    if not p.exists():
        return None
    return json.loads(p.read_text())


def list_all(subdir: str) -> list[dict]:
    d = STORAGE_DIR / subdir
    if not d.exists():
        return []
    results = []
    for f in sorted(d.glob("*.json"), key=lambda x: x.stat().st_mtime):
        try:
            results.append(json.loads(f.read_text()))
        except Exception:
            pass
    return results


def delete(subdir: str, key: str) -> bool:
    p = _path(subdir, key)
    if p.exists():
        p.unlink()
        return True
    return False


def latest(subdir: str) -> Optional[dict]:
    d = STORAGE_DIR / subdir
    if not d.exists():
        return None
    files = sorted(d.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True)
    if not files:
        return None
    return json.loads(files[0].read_text())
