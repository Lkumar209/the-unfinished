"""Pre-computed autopsies for non-text uploads. Indistinguishable from Claude output."""
from __future__ import annotations

# keyed by partial filename match (lowercase). First match wins.
MOCK_FIXTURES: list[dict] = [
    {
        "match": ["untitled_4", "untitled 4", "song_wip", "demo_track"],
        "medium": "song",
        "title": "untitled 4",
        "dropout_percent": 37,
        "closest_arc": "man in a hole",
        "arc_correlation": 0.71,
        "vitals": [
            {"label": "lexical density", "value": "−24%", "decline": True, "spark": [0.82, 0.79, 0.75, 0.71, 0.68, 0.65, 0.61, 0.58, 0.55, 0.52, 0.49, 0.46, 0.43, 0.41, 0.38, 0.36]},
            {"label": "line length", "value": "−18%", "decline": True, "spark": [0.78, 0.75, 0.72, 0.69, 0.66, 0.63, 0.60, 0.57, 0.55, 0.52, 0.50, 0.47, 0.44, 0.42, 0.40, 0.37]},
            {"label": "rhyme regularity", "value": "+41%", "decline": False, "spark": [0.35, 0.38, 0.42, 0.46, 0.50, 0.54, 0.57, 0.61, 0.64, 0.68, 0.71, 0.74, 0.77, 0.80, 0.83, 0.86]},
            {"label": "image specificity", "value": "−39%", "decline": True, "spark": [0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.51, 0.47, 0.43, 0.40, 0.37, 0.34, 0.31, 0.29, 0.26]},
        ],
        "emotional_arc_data": [
            {"x": i * (37 / 39), "y": round(0.5 - 1.1 * (i / 39) * (1 - i / 39) * 4 + 0.05 * ((i * 13) % 7 - 3) / 10, 3)}
            for i in range(40) if i * (37 / 39) <= 37
        ],
        "cause_of_death": "bridge avoidance",
        "diagnosis_prose": (
            "the song exists in two verses and a chorus that repeats without deepening; the structure is a loop "
            "where momentum should be a line. the vocabulary thins in the final verse (specificity drops forty "
            "percent, rhyme regularity spikes) — the hallmarks of a writer defaulting to abstraction when the "
            "concrete image fails to arrive. the bridge, which would force a tonal shift and a commitment to what "
            "the song is actually about, was never written; the song ends where it should pivot.\n\n"
            "you stopped at the moment the work required a claim. the first two verses earn the right to mean "
            "something; the bridge is where meaning has to be stated, not implied. you are very good at implication."
        ),
    },
    {
        "match": ["painting", "sketch", "canvas", "wip_art", "study_for"],
        "medium": "painting",
        "title": "untitled study",
        "dropout_percent": 41,
        "closest_arc": "icarus",
        "arc_correlation": 0.64,
        "vitals": [
            {"label": "compositional density", "value": "−31%", "decline": True, "spark": [0.80, 0.76, 0.72, 0.68, 0.64, 0.60, 0.57, 0.53, 0.50, 0.47, 0.44, 0.41, 0.38, 0.36, 0.34, 0.31]},
            {"label": "value contrast", "value": "−22%", "decline": True, "spark": [0.75, 0.72, 0.69, 0.65, 0.62, 0.59, 0.56, 0.53, 0.50, 0.48, 0.45, 0.43, 0.40, 0.38, 0.36, 0.34]},
            {"label": "edge definition", "value": "+48%", "decline": False, "spark": [0.30, 0.34, 0.38, 0.42, 0.46, 0.50, 0.54, 0.58, 0.62, 0.65, 0.68, 0.71, 0.74, 0.77, 0.80, 0.83]},
            {"label": "ground coverage", "value": "−44%", "decline": True, "spark": [0.88, 0.83, 0.78, 0.73, 0.68, 0.63, 0.59, 0.55, 0.51, 0.47, 0.43, 0.40, 0.37, 0.34, 0.31, 0.28]},
        ],
        "emotional_arc_data": [
            {"x": i * (41 / 39), "y": round(0.4 - 0.9 * abs(i / 39 - 0.5) + 0.04 * ((i * 7) % 5 - 2) / 10, 3)}
            for i in range(40) if i * (41 / 39) <= 41
        ],
        "cause_of_death": "resolution refusal",
        "diagnosis_prose": (
            "the ground is established; the mid-tones are blocked in; the light source reads correctly in the "
            "upper left quadrant. but the figure in the foreground has no face. this is not an oversight of time; "
            "it is an oversight of commitment. the edge definition increases sharply in the final sessions (the "
            "perimeter of objects becomes precise as their centers remain vague) — a familiar pattern in painters "
            "who are more comfortable with structure than with statement.\n\n"
            "the painting knows what it is about. the figure knows it too. you stopped the hour you would have "
            "had to decide what her expression is."
        ),
    },
    {
        "match": ["audio_memoir", "spoken_word", "voice_memo", "recording"],
        "medium": "song",
        "title": "voice memo (untitled)",
        "dropout_percent": 44,
        "closest_arc": "tragedy",
        "arc_correlation": 0.68,
        "vitals": [
            {"label": "lexical density", "value": "−29%", "decline": True, "spark": [0.79, 0.75, 0.71, 0.68, 0.64, 0.60, 0.57, 0.53, 0.50, 0.47, 0.44, 0.41, 0.38, 0.36, 0.33, 0.31]},
            {"label": "line length", "value": "−14%", "decline": True, "spark": [0.72, 0.70, 0.67, 0.65, 0.62, 0.60, 0.58, 0.55, 0.53, 0.51, 0.49, 0.47, 0.45, 0.43, 0.41, 0.39]},
            {"label": "rhyme regularity", "value": "+53%", "decline": False, "spark": [0.28, 0.33, 0.38, 0.43, 0.48, 0.53, 0.58, 0.62, 0.66, 0.70, 0.73, 0.76, 0.79, 0.82, 0.84, 0.87]},
            {"label": "image specificity", "value": "−47%", "decline": True, "spark": [0.90, 0.84, 0.78, 0.72, 0.67, 0.62, 0.57, 0.52, 0.48, 0.44, 0.40, 0.36, 0.33, 0.30, 0.27, 0.25]},
        ],
        "emotional_arc_data": [
            {"x": i * (44 / 39), "y": round(0.3 + 0.6 * (1 - i / 39) - 0.02 * i + 0.05 * ((i * 11) % 6 - 3) / 10, 3)}
            for i in range(40) if i * (44 / 39) <= 44
        ],
        "cause_of_death": "interiority gap",
        "diagnosis_prose": (
            "the recording documents events in precise chronological sequence; the speaker's voice is steady, "
            "controlled, even measured at the difficult moments. the rhyme regularity climbs fifty percent in "
            "the second half — pattern and formality increasing as the emotional stakes rise, which is the "
            "acoustic signature of someone using structure as a dam against feeling. the images become less "
            "specific (the grandmother's kitchen becomes 'a place I remember,' the argument becomes 'a hard "
            "conversation') exactly where they need to be most particular.\n\n"
            "you are describing what happened. you are not yet saying how it landed in you. those are different "
            "projects. this one wants to be the second one."
        ),
    },
    {
        "match": ["photo_series", "images", "visual_essay", "jpg_project"],
        "medium": "painting",
        "title": "photo series (untitled)",
        "dropout_percent": 35,
        "closest_arc": "man in a hole",
        "arc_correlation": 0.72,
        "vitals": [
            {"label": "compositional density", "value": "−26%", "decline": True, "spark": [0.76, 0.73, 0.69, 0.66, 0.63, 0.59, 0.56, 0.53, 0.50, 0.47, 0.45, 0.42, 0.39, 0.37, 0.35, 0.32]},
            {"label": "value contrast", "value": "−19%", "decline": True, "spark": [0.70, 0.67, 0.65, 0.62, 0.60, 0.57, 0.55, 0.52, 0.50, 0.48, 0.45, 0.43, 0.41, 0.39, 0.37, 0.35]},
            {"label": "edge definition", "value": "+36%", "decline": False, "spark": [0.38, 0.41, 0.44, 0.47, 0.50, 0.53, 0.56, 0.59, 0.62, 0.65, 0.67, 0.70, 0.72, 0.75, 0.77, 0.80]},
            {"label": "ground coverage", "value": "−38%", "decline": True, "spark": [0.84, 0.79, 0.75, 0.71, 0.67, 0.63, 0.59, 0.55, 0.52, 0.49, 0.45, 0.42, 0.39, 0.37, 0.34, 0.32]},
        ],
        "emotional_arc_data": [
            {"x": i * (35 / 39), "y": round(0.5 - 1.2 * (i / 39) * (1 - i / 39) * 3.5 + 0.04 * ((i * 9) % 7 - 3) / 10, 3)}
            for i in range(40) if i * (35 / 39) <= 35
        ],
        "cause_of_death": "stance avoidance",
        "diagnosis_prose": (
            "the first images are declarative — the subject is named, the relationship is clear, the light is "
            "used as argument. by the middle of the series the images become more formally elegant and less "
            "insistent; the sequence is building toward something but the photographer keeps choosing beauty "
            "over claim. the edit stops at the frame that would require a point of view about what all of this "
            "means, not just what it looks like.\n\n"
            "the series has an eye. it does not yet have a position. those are different things, and this work "
            "stops at the exact point where they must become the same."
        ),
    },
]


def get_fixture_for_filename(filename: str) -> dict | None:
    """Return the mock fixture matching this filename, or None."""
    lower = filename.lower()
    ext = lower.rsplit(".", 1)[-1] if "." in lower else ""

    # audio files get the first audio fixture
    if ext in ("mp3", "wav", "aiff", "flac", "m4a"):
        for fixture in MOCK_FIXTURES:
            if fixture["medium"] == "song":
                return fixture
        return MOCK_FIXTURES[0]

    # image files get a painting fixture
    if ext in ("jpg", "jpeg", "png", "gif", "webp", "tiff"):
        for fixture in MOCK_FIXTURES:
            if fixture["medium"] == "painting":
                return fixture
        return MOCK_FIXTURES[1]

    # match by filename keywords
    for fixture in MOCK_FIXTURES:
        for keyword in fixture["match"]:
            if keyword.lower() in lower:
                return fixture

    return None
