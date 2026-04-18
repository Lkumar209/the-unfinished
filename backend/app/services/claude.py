"""The three Claude calls. Each has a narrow, specific job.

When ANTHROPIC_API_KEY is unset or "placeholder", all calls return realistic
mock responses so the full UI can be exercised without a live key. Swap in a
real key and every call goes to claude-sonnet-4-6 with no other changes needed.
"""
from __future__ import annotations
import json
import logging
import os
import time
from datetime import date, timedelta

import anthropic
from dotenv import load_dotenv

from app.prompts import (
    AUTOPSY_SYSTEM, AUTOPSY_USER,
    PATTERN_SYSTEM, PATTERN_USER,
    REENTRY_SYSTEM, REENTRY_USER,
    GUTENDEX_SYSTEM, GUTENDEX_USER,
    GUTENDEX_PASSAGE_USER,
)
from app.services.text_analysis import excerpt

load_dotenv()

logger = logging.getLogger(__name__)
MODEL = "claude-sonnet-4-6"

_client: anthropic.Anthropic | None = None


def _api_key() -> str:
    return os.getenv("ANTHROPIC_API_KEY", "")


def _mock_mode() -> bool:
    key = _api_key()
    return not key or key.lower() in ("placeholder", "sk-ant-...", "")


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=_api_key())
    return _client


# ---- mock responses keyed to each call type ----

def _mock_autopsy(project: dict) -> dict:
    title = project.get("title", "untitled")
    medium = project.get("medium", "novel")
    dropout = project.get("dropout_percent", 38)
    arc = project.get("closest_arc", "man in a hole")

    causes = {
        "novel": ("midpoint collapse", "the novel dies in the descent"),
        "screenplay": ("bridge avoidance", "the second act is a hallway the protagonist refuses to enter"),
        "song": ("bridge avoidance", "two verses, no bridge; the song wants to mean something"),
        "painting": ("resolution refusal", "the ground is established but the figure has no face"),
    }
    cod, lead = causes.get(medium, causes["novel"])

    prose = (
        f'{lead}. "{title}" stops at {dropout}% — right at the moment the {medium} would have had to commit '
        f"to what it is actually about. the vocabulary thinned in the final section, sentence length dropped, "
        f"and the work retreated into abstraction where it needed to become most specific. the emotional arc "
        f"tracked closest to {arc}, which means the fall was underway but the climb never started; "
        f"you stopped at the bottom of the hole.\n\n"
        f"this is not a plot problem or a craft problem in the technical sense. it is a stance problem: "
        f"the {medium} reached the moment it would have had to say something true and particular, "
        f"and you stopped writing the day before that sentence was due."
    )
    return {"cause_of_death": cod, "diagnosis_prose": prose}


def _mock_pattern(projects: list[dict], autopsies: list[dict]) -> dict:
    n = len(projects)
    mediums = list({p["medium"] for p in projects})
    dropouts = [p["dropout_percent"] for p in projects]
    median = sorted(dropouts)[len(dropouts) // 2] if dropouts else 36
    best = min(projects, key=lambda p: abs(p["dropout_percent"] - median))

    prose = (
        f"you don't have a {mediums[0]} problem"
        + (f", a {mediums[1]} problem" if len(mediums) > 1 else "")
        + (f", and a {mediums[2]} problem" if len(mediums) > 2 else "")
        + f". you have one problem, {n} times.\n\n"
        "every project dies at the same place — the moment the work stops being about "
        "what happened and has to become about what it meant. you are very good at "
        "setting things up. you abandon them the week you would have had to commit "
        "to what they are about."
    )
    return {
        "signature_name": "the midpoint disease",
        "signature_prose": prose,
        "shared_symptom": "interiority collapse",
        "best_revival_candidate_id": best["id"],
    }


def _mock_reentry(project: dict, autopsy: dict, pattern: dict) -> dict:
    today = date.today()
    days_until_sunday = (6 - today.weekday()) % 7 or 7
    next_sunday = today + timedelta(days=days_until_sunday)
    sunday_str = next_sunday.strftime("%B %d").lower().lstrip("0")

    title = project.get("title", "untitled")
    medium = project.get("medium", "novel")
    cod = autopsy.get("cause_of_death", "midpoint collapse")
    pattern_name = pattern.get("signature_name", "the midpoint disease")

    obstacle = (
        f'you stopped writing "{title}" the week it would have had to become about something. '
        f"the {medium} was built; the structure was in place; and then you stopped at the exact "
        f"moment the work required a claim. this is not a coincidence. this is {pattern_name}."
    )
    the_ask = (
        f"write the one scene where the {medium}'s central character says something true "
        f"about what they want — not what they need, not what they fear, but what they want. "
        f"they do not have to be right. they have to be willing to say it."
    )
    return {
        "obstacle_prose": obstacle,
        "scope": f"one scene · two pages · ~600 words",
        "due": f"sunday · {sunday_str}",
        "the_ask": the_ask,
        "three_angles": [
            "they say it to a stranger who cannot judge them — someone on a train, a waiting room, a wrong number.",
            "they write it in a message they do not send. the scene is the drafting and the deleting.",
            "they say it out loud, alone, to no one. the scene is the room listening.",
        ],
        "why_breaks_pattern": (
            f"it forces the interiority that {cod} names as the missing element, "
            "inside a container small enough to finish in a single sitting."
        ),
        "why_succeeds_even_if": (
            "a bad scene still reveals what the character wants. a blank page does not. "
            "the worst version of this scene is still more information than you have now."
        ),
    }


# ---- real Claude call machinery ----

def _call(system: str, user: str, max_tokens: int, temperature: float) -> str:
    client = _get_client()
    for attempt in range(3):
        try:
            logger.info("[claude] calling %s, attempt %d, ~%d chars input", MODEL, attempt + 1, len(user))
            start = time.time()
            resp = client.messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            elapsed = time.time() - start
            text = resp.content[0].text
            logger.info("[claude] response in %.1fs, %d output tokens", elapsed, resp.usage.output_tokens)
            return text
        except anthropic.RateLimitError:
            wait = 2 ** attempt
            logger.warning("[claude] rate limit, waiting %ds", wait)
            time.sleep(wait)
        except Exception as e:
            logger.error("[claude] error: %s", e)
            raise
    raise RuntimeError("claude: exceeded retry limit")


def _parse_json(text: str, system: str, user: str, max_tokens: int, temperature: float) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning("[claude] json parse failed: %s — retrying", e)
        retry_user = user + f"\n\nYour previous response was not valid JSON. Error: {e}. Try again, returning only a JSON object."
        text2 = _call(system, retry_user, max_tokens, temperature)
        cleaned2 = text2.strip()
        if cleaned2.startswith("```"):
            lines2 = cleaned2.split("\n")
            cleaned2 = "\n".join(lines2[1:-1]) if len(lines2) > 2 else cleaned2
        return json.loads(cleaned2)


# ---- public API ----

def generate_autopsy(project: dict) -> dict:
    """Forensic pathologist: reads a single work and names its cause of death."""
    if _mock_mode():
        logger.info("[claude] mock mode — returning placeholder autopsy for %r", project.get("title"))
        return _mock_autopsy(project)

    vitals = project.get("vitals", [])
    vital_map = {v["label"]: v["value"] for v in vitals}
    medium = project.get("medium", "novel")

    user = AUTOPSY_USER.format(
        medium=medium,
        title=project["title"],
        closest_arc=project.get("closest_arc", "unknown"),
        arc_r=project.get("arc_correlation", 0),
        dropout_pct=project.get("dropout_percent", 40),
        vocab_delta=vital_map.get("vocabulary richness", vital_map.get("lexical density", vital_map.get("scene count", "n/a"))),
        sent_delta=vital_map.get("sentence length", vital_map.get("line length", vital_map.get("scene length", "n/a"))),
        para_delta=vital_map.get("paragraph length", vital_map.get("action lines", vital_map.get("image specificity", "n/a"))),
        dial_delta=vital_map.get("dialogue ratio", vital_map.get("dialogue density", vital_map.get("rhyme regularity", "n/a"))),
        opening=excerpt(project.get("raw_text", ""), 500),
        ending=excerpt(project.get("raw_text", ""), 500, from_end=True),
    )
    text = _call(AUTOPSY_SYSTEM, user, max_tokens=1000, temperature=0.7)
    result = _parse_json(text, AUTOPSY_SYSTEM, user, max_tokens=1000, temperature=0.7)
    return {
        "cause_of_death": result.get("cause_of_death", "unknown"),
        "diagnosis_prose": result.get("diagnosis_prose", ""),
    }


def generate_pattern(projects: list[dict], autopsies: list[dict]) -> dict:
    """Detective: finds the one pattern across all autopsies."""
    if _mock_mode():
        logger.info("[claude] mock mode — returning placeholder pattern for %d projects", len(projects))
        return _mock_pattern(projects, autopsies)

    autopsy_map = {a["project_id"]: a for a in autopsies}
    mediums = set(p["medium"] for p in projects)
    project_lines = []
    for i, p in enumerate(projects, 1):
        a = autopsy_map.get(p["id"], {})
        cod = a.get("cause_of_death", "unknown")
        prose = a.get("diagnosis_prose", "")[:200]
        line = (
            f'{i}. {p["title"]} ({p["medium"]}) — dropout at {p["dropout_percent"]}%, '
            f'arc {p.get("closest_arc", "unknown")}, cause: {cod}\n'
            f'   Diagnosis excerpt: "{prose}"'
        )
        project_lines.append(line)

    user = PATTERN_USER.format(
        n=len(projects),
        m=len(mediums),
        project_list="\n".join(project_lines),
    )
    text = _call(PATTERN_SYSTEM, user, max_tokens=1500, temperature=0.6)
    result = _parse_json(text, PATTERN_SYSTEM, user, max_tokens=1500, temperature=0.6)
    return {
        "signature_name": result.get("signature_name", "the midpoint disease"),
        "signature_prose": result.get("signature_prose", ""),
        "shared_symptom": result.get("shared_symptom", ""),
        "best_revival_candidate_id": result.get("best_revival_candidate_id", projects[0]["id"] if projects else ""),
    }


def generate_reentry(project: dict, autopsy: dict, pattern: dict) -> dict:
    """Physical therapist: prescribes the smallest thing that breaks the pattern."""
    if _mock_mode():
        logger.info("[claude] mock mode — returning placeholder reentry for %r", project.get("title"))
        return _mock_reentry(project, autopsy, pattern)

    today = date.today()
    days_until_sunday = (6 - today.weekday()) % 7 or 7
    next_sunday = today + timedelta(days=days_until_sunday)
    sunday_str = next_sunday.strftime("%B %d").lower().lstrip("0")

    user = REENTRY_USER.format(
        title=project["title"],
        medium=project.get("medium", "novel"),
        cause_of_death=autopsy.get("cause_of_death", "unknown"),
        pattern_name=pattern.get("signature_name", "the pattern"),
        signature_prose=pattern.get("signature_prose", "")[:300],
        opening=excerpt(project.get("raw_text", ""), 500),
        ending=excerpt(project.get("raw_text", ""), 500, from_end=True),
        today=today.strftime("%B %d, %Y"),
        sunday=sunday_str,
    )
    text = _call(REENTRY_SYSTEM, user, max_tokens=2000, temperature=0.75)
    result = _parse_json(text, REENTRY_SYSTEM, user, max_tokens=2000, temperature=0.75)
    return {
        "obstacle_prose": result.get("obstacle_prose", ""),
        "scope": result.get("scope", "one scene · two pages · ~600 words"),
        "due": result.get("due", f"sunday · {sunday_str}"),
        "the_ask": result.get("the_ask", ""),
        "three_angles": result.get("three_angles", []),
        "why_breaks_pattern": result.get("why_breaks_pattern", ""),
        "why_succeeds_even_if": result.get("why_succeeds_even_if", ""),
    }


def suggest_gutendex_work(pattern_name: str, medium: str, the_ask: str) -> dict | None:
    """Suggests a Gutenberg work for the literary precedent section."""
    if _mock_mode():
        return None  # literary precedent section simply omitted in mock mode

    user = GUTENDEX_USER.format(pattern_name=pattern_name, medium=medium, the_ask=the_ask)
    try:
        text = _call(GUTENDEX_SYSTEM, user, max_tokens=300, temperature=0.5)
        return _parse_json(text, GUTENDEX_SYSTEM, user, max_tokens=300, temperature=0.5)
    except Exception as e:
        logger.warning("[claude] gutendex suggestion failed: %s", e)
        return None


def write_adaptation_note(author: str, work: str, chapter: str, passage: str, medium: str, the_ask: str) -> str:
    """Writes the adaptation note for a literary precedent."""
    if _mock_mode():
        return ""

    user = GUTENDEX_PASSAGE_USER.format(
        author=author, work=work, chapter=chapter,
        passage=passage[:1000], medium=medium, the_ask=the_ask,
    )
    try:
        return _call(GUTENDEX_SYSTEM, user, max_tokens=300, temperature=0.6)
    except Exception as e:
        logger.warning("[claude] adaptation note failed: %s", e)
        return ""
