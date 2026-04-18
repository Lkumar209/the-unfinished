from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field, field_validator


Medium = str


class ArcPoint(BaseModel):
    x: float
    y: float


class VitalSign(BaseModel):
    label: str
    value: str      # e.g. "−41%"
    decline: bool
    spark: list[float]  # 16 values, 0..1


class ProjectRecord(BaseModel):
    id: str
    title: str
    medium: Medium
    raw_text: str = ""
    word_count: int
    last_touched: str           # pretty: "feb 2024"
    uploaded_at: str
    source_filename: str
    # quantitative analysis — computed at upload time
    dropout_percent: int = Field(ge=0, le=100)
    emotional_arc_data: list[ArcPoint]
    closest_arc: str
    arc_correlation: float = Field(ge=-1, le=1)
    vitals: list[VitalSign]
    # flag for pre-computed autopsies (audio/image mocks)
    pre_computed_autopsy: Optional["AutopsyRecord"] = None


class AutopsyRecord(BaseModel):
    project_id: str
    cause_of_death: str
    diagnosis_prose: str
    generated_at: str


class PerProjectDropout(BaseModel):
    project_id: str
    title: str
    medium: Medium
    dropout_pct: int


class PatternRecord(BaseModel):
    id: str
    project_ids: list[str]
    signature_name: str
    signature_prose: str
    dropout_spread_pts: int
    dropout_median_pct: int
    shared_symptom: str
    shared_symptom_count: str
    best_revival_candidate_id: str = ""
    per_project_dropouts: list[PerProjectDropout]
    generated_at: str


class LiteraryPrecedent(BaseModel):
    author: str
    work: str
    chapter: str
    passage: str
    adaptation_note: str


class LocalPlace(BaseModel):
    name: str
    details: str


class ReentryRecord(BaseModel):
    id: str
    project_id: str
    pattern_id: str
    obstacle_prose: str
    scope: str
    due: str
    the_ask: str
    three_angles: list[str]
    why_breaks_pattern: str
    why_succeeds_even_if: str
    literary_precedent: Optional[LiteraryPrecedent] = None
    local_places: list[LocalPlace] = []
    generated_at: str


# ---- API request/response shapes ----

class UploadResponse(BaseModel):
    projects: list[ProjectRecord]


class ProjectListResponse(BaseModel):
    projects: list[ProjectRecord]


class PatternRequest(BaseModel):
    project_ids: list[str]


class ReentryRequest(BaseModel):
    project_id: str
    pattern_id: str
    enable_gutendex: bool = True
    enable_places: bool = False
    user_location: Optional[dict] = None
