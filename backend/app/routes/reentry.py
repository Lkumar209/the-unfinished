from __future__ import annotations
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.models import ReentryRecord, ReentryRequest, LiteraryPrecedent
from app.services import storage
from app.services.claude import generate_reentry, suggest_gutendex_work, write_adaptation_note
from app.services.gutendex import fetch_passage

import uuid
def nanoid(size=10): return uuid.uuid4().hex[:size]

router = APIRouter(prefix="/reentry", tags=["reentry"])


@router.post("", response_model=ReentryRecord)
def run_reentry(req: ReentryRequest):
    project = storage.load("projects", req.project_id)
    if not project:
        raise HTTPException(404, "project not found")

    pattern = storage.load("patterns", req.pattern_id)
    if not pattern:
        raise HTTPException(404, "pattern not found")

    autopsy = storage.load("autopsies", req.project_id)
    if not autopsy and project.get("pre_computed_autopsy"):
        autopsy = project["pre_computed_autopsy"]
    if not autopsy:
        raise HTTPException(422, "autopsy not generated for this project")

    result = generate_reentry(project, autopsy, pattern)

    literary_precedent = None
    if req.enable_gutendex:
        suggestion = suggest_gutendex_work(
            pattern_name=pattern["signature_name"],
            medium=project["medium"],
            the_ask=result["the_ask"],
        )
        if suggestion:
            passage = fetch_passage(
                author=suggestion.get("author", ""),
                work_title=suggestion.get("work_title_for_search", ""),
                chapter_hint=suggestion.get("target_chapter", ""),
            )
            if passage:
                adaptation_note = write_adaptation_note(
                    author=suggestion["author"],
                    work=suggestion.get("work_title_for_search", ""),
                    chapter=suggestion.get("target_chapter", ""),
                    passage=passage,
                    medium=project["medium"],
                    the_ask=result["the_ask"],
                )
                literary_precedent = LiteraryPrecedent(
                    author=suggestion["author"],
                    work=suggestion.get("work_title_for_search", ""),
                    chapter=suggestion.get("target_chapter", ""),
                    passage=passage[:500],
                    adaptation_note=adaptation_note,
                )

    now = datetime.now(timezone.utc).isoformat()
    rec = ReentryRecord(
        id=f"reentry_{nanoid(8)}",
        project_id=req.project_id,
        pattern_id=req.pattern_id,
        obstacle_prose=result["obstacle_prose"],
        scope=result["scope"],
        due=result["due"],
        the_ask=result["the_ask"],
        three_angles=result["three_angles"],
        why_breaks_pattern=result["why_breaks_pattern"],
        why_succeeds_even_if=result["why_succeeds_even_if"],
        literary_precedent=literary_precedent,
        generated_at=now,
    )
    storage.save("reentry", rec.id, rec.model_dump())
    return rec
