from __future__ import annotations
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.models import AutopsyRecord
from app.services import storage
from app.services.claude import generate_autopsy

router = APIRouter(prefix="/projects", tags=["autopsy"])


@router.post("/{project_id}/autopsy", response_model=AutopsyRecord)
def run_autopsy(project_id: str, refresh: bool = Query(False)):
    project = storage.load("projects", project_id)
    if not project:
        raise HTTPException(404, "project not found")

    # return cached unless refresh requested
    if not refresh:
        cached = storage.load("autopsies", project_id)
        if cached:
            return AutopsyRecord(**cached)

    # pre-computed mock autopsy (audio/image files)
    if project.get("pre_computed_autopsy"):
        rec = project["pre_computed_autopsy"]
        rec["project_id"] = project_id
        storage.save("autopsies", project_id, rec)
        return AutopsyRecord(**rec)

    result = generate_autopsy(project)
    now = datetime.now(timezone.utc).isoformat()
    rec = {
        "project_id": project_id,
        "cause_of_death": result["cause_of_death"],
        "diagnosis_prose": result["diagnosis_prose"],
        "generated_at": now,
    }
    storage.save("autopsies", project_id, rec)
    return AutopsyRecord(**rec)


@router.get("/{project_id}/autopsy", response_model=AutopsyRecord)
def get_autopsy(project_id: str):
    rec = storage.load("autopsies", project_id)
    if not rec:
        raise HTTPException(404, "autopsy not yet generated")
    return AutopsyRecord(**rec)
