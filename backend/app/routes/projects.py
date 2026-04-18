from __future__ import annotations
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.models import ProjectRecord, UploadResponse, ProjectListResponse
from app.services import storage
from app.services.file_parsers import extract_text, infer_medium, infer_title, infer_last_touched
from app.services.text_analysis import analyze_text
from app.fixtures.mock_analysis import get_fixture_for_filename

import uuid
def nanoid(size=10): return uuid.uuid4().hex[:size]

router = APIRouter(prefix="/projects", tags=["projects"])

NON_TEXT_EXTS = {"mp3", "wav", "aiff", "flac", "m4a", "jpg", "jpeg", "png", "gif", "webp", "tiff"}


@router.post("/upload", response_model=UploadResponse)
async def upload_projects(files: List[UploadFile] = File(...)):
    created = []
    for f in files:
        filename = f.filename or "untitled.txt"
        content = await f.read()
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        project_id = f"proj_{nanoid(8)}"
        now = datetime.now(timezone.utc).isoformat()

        # non-text: use mock fixture
        if ext in NON_TEXT_EXTS:
            fixture = get_fixture_for_filename(filename)
            if fixture:
                rec = {
                    "id": project_id,
                    "title": infer_title(filename) or fixture["title"],
                    "medium": fixture["medium"],
                    "raw_text": "",
                    "word_count": 0,
                    "last_touched": infer_last_touched(filename) or "",
                    "uploaded_at": now,
                    "source_filename": filename,
                    "dropout_percent": fixture["dropout_percent"],
                    "emotional_arc_data": fixture["emotional_arc_data"],
                    "closest_arc": fixture["closest_arc"],
                    "arc_correlation": fixture["arc_correlation"],
                    "vitals": fixture["vitals"],
                    "pre_computed_autopsy": {
                        "project_id": project_id,
                        "cause_of_death": fixture["cause_of_death"],
                        "diagnosis_prose": fixture["diagnosis_prose"],
                        "generated_at": now,
                    },
                }
            else:
                continue
        else:
            text = extract_text(filename, content)
            if not text.strip():
                raise HTTPException(400, f"could not extract text from {filename}")

            medium = infer_medium(filename, text)
            title = infer_title(filename)
            last_touched = infer_last_touched(filename) or ""
            analysis = analyze_text(text, medium)

            rec = {
                "id": project_id,
                "title": title,
                "medium": medium,
                "raw_text": text,
                "word_count": analysis["word_count"],
                "last_touched": last_touched,
                "uploaded_at": now,
                "source_filename": filename,
                "dropout_percent": analysis["dropout_percent"],
                "emotional_arc_data": analysis["emotional_arc_data"],
                "closest_arc": analysis["closest_arc"],
                "arc_correlation": analysis["arc_correlation"],
                "vitals": analysis["vitals"],
                "pre_computed_autopsy": None,
            }

        storage.save("projects", project_id, rec)
        created.append(ProjectRecord(**rec))

    return UploadResponse(projects=created)


@router.get("", response_model=ProjectListResponse)
def list_projects():
    raw = storage.list_all("projects")
    projects = []
    for r in raw:
        try:
            projects.append(ProjectRecord(**r))
        except Exception:
            pass
    return ProjectListResponse(projects=projects)


@router.get("/{project_id}", response_model=ProjectRecord)
def get_project(project_id: str):
    rec = storage.load("projects", project_id)
    if not rec:
        raise HTTPException(404, "project not found")
    return ProjectRecord(**rec)


@router.delete("/{project_id}")
def delete_project(project_id: str):
    if not storage.delete("projects", project_id):
        raise HTTPException(404, "project not found")
    storage.delete("autopsies", project_id)
    return {"deleted": project_id}
