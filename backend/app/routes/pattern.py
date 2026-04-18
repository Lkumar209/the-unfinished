from __future__ import annotations
import statistics
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.models import PatternRecord, PatternRequest, PerProjectDropout
from app.services import storage
from app.services.claude import generate_pattern, generate_autopsy

import uuid
def nanoid(size=10): return uuid.uuid4().hex[:size]

router = APIRouter(prefix="/pattern", tags=["pattern"])


@router.post("", response_model=PatternRecord)
def run_pattern(req: PatternRequest):
    projects = []
    for pid in req.project_ids:
        p = storage.load("projects", pid)
        if not p:
            raise HTTPException(404, f"project {pid} not found")
        projects.append(p)

    # auto-generate any missing autopsies
    autopsies = []
    for p in projects:
        a = storage.load("autopsies", p["id"])
        if not a and p.get("pre_computed_autopsy"):
            a = p["pre_computed_autopsy"]
            a["project_id"] = p["id"]
        if not a:
            result = generate_autopsy(p)
            a = {
                "project_id": p["id"],
                "cause_of_death": result["cause_of_death"],
                "diagnosis_prose": result["diagnosis_prose"],
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
            storage.save("autopsies", p["id"], a)
        autopsies.append(a)

    result = generate_pattern(projects, autopsies)

    dropouts = [p["dropout_percent"] for p in projects]
    median_dropout = int(statistics.median(dropouts))
    spread = max(dropouts) - min(dropouts)

    per_project = [
        PerProjectDropout(
            project_id=p["id"],
            title=p["title"],
            medium=p["medium"],
            dropout_pct=p["dropout_percent"],
        )
        for p in projects
    ]

    now = datetime.now(timezone.utc).isoformat()
    rec = {
        "id": f"pattern_{nanoid(8)}",
        "project_ids": req.project_ids,
        "signature_name": result["signature_name"],
        "signature_prose": result["signature_prose"],
        "dropout_spread_pts": spread,
        "dropout_median_pct": median_dropout,
        "shared_symptom": result["shared_symptom"],
        "shared_symptom_count": f"{len(projects)}/{len(projects)}",
        "best_revival_candidate_id": result.get("best_revival_candidate_id", projects[0]["id"]),
        "per_project_dropouts": [p.model_dump() for p in per_project],
        "generated_at": now,
    }
    storage.save("patterns", rec["id"], rec)
    return PatternRecord(**rec)


@router.get("/latest", response_model=PatternRecord)
def get_latest_pattern():
    rec = storage.latest("patterns")
    if not rec:
        raise HTTPException(404, "no pattern report generated yet")
    return PatternRecord(**rec)
