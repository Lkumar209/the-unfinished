"""Quantitative analysis: emotional arc, vital signs, dropout percent."""
from __future__ import annotations
import math
import re
from typing import Any

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

nltk.download("vader_lexicon", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

_vader = SentimentIntensityAnalyzer()

# Six canonical emotional arc shapes (40 points, y in [-1, 1])
_N = 40
_CANONICAL_ARCS: dict[str, list[float]] = {}


def _build_canonical():
    global _CANONICAL_ARCS
    pts = {}

    def x(i):
        return i / _N

    # Rags to Riches: steady rise
    pts["rags to riches"] = [2 * x(i) - 1 for i in range(_N + 1)]

    # Tragedy: rise then fall
    pts["tragedy"] = [
        math.sin(math.pi * x(i)) * 0.8 if x(i) <= 0.6 else -0.8 * (x(i) - 0.6) / 0.4
        for i in range(_N + 1)
    ]

    # Man in a Hole: fall then rise
    pts["man in a hole"] = [
        0.5 - 1.2 * math.sin(math.pi * x(i)) * 0.9
        for i in range(_N + 1)
    ]

    # Icarus: rise high, crash
    pts["icarus"] = [
        math.sin(math.pi * 0.5 * x(i) / 0.7) if x(i) <= 0.7 else math.cos(math.pi * (x(i) - 0.7) / 0.6)
        for i in range(_N + 1)
    ]

    # Cinderella: rise, fall, rise again
    pts["cinderella"] = [
        0.6 * math.sin(2 * math.pi * x(i)) + 0.2 * math.sin(math.pi * x(i))
        for i in range(_N + 1)
    ]

    # Oedipus: fall, rise, fall
    pts["oedipus"] = [
        -(0.6 * math.sin(2 * math.pi * x(i)) + 0.2 * math.sin(math.pi * x(i)))
        for i in range(_N + 1)
    ]

    _CANONICAL_ARCS = pts


_build_canonical()


def _pearson(a: list[float], b: list[float]) -> float:
    n = min(len(a), len(b))
    if n < 2:
        return 0.0
    a, b = a[:n], b[:n]
    mean_a = sum(a) / n
    mean_b = sum(b) / n
    num = sum((a[i] - mean_a) * (b[i] - mean_b) for i in range(n))
    den = math.sqrt(
        sum((a[i] - mean_a) ** 2 for i in range(n))
        * sum((b[i] - mean_b) ** 2 for i in range(n))
    )
    return num / den if den > 0 else 0.0


def _split_segments(text: str, n: int) -> list[str]:
    words = text.split()
    if not words:
        return [""] * n
    chunk = max(1, len(words) // n)
    return [" ".join(words[i * chunk : (i + 1) * chunk]) for i in range(n)]


def compute_emotional_arc(text: str) -> tuple[list[dict], str, float]:
    """Returns (arc_points, closest_arc_name, pearson_r)."""
    segments = _split_segments(text, _N)
    raw_scores = [_vader.polarity_scores(s)["compound"] for s in segments]

    # 5-window moving average smooth
    smoothed = []
    for i in range(len(raw_scores)):
        window = raw_scores[max(0, i - 2) : i + 3]
        smoothed.append(sum(window) / len(window))

    # Match against canonicals
    best_arc = "man in a hole"
    best_r = -999.0
    for name, canonical in _CANONICAL_ARCS.items():
        r = _pearson(smoothed, canonical)
        if r > best_r:
            best_r = r
            best_arc = name

    arc_points = [{"x": (i / (_N - 1)) * 100, "y": round(v, 3)} for i, v in enumerate(smoothed)]
    return arc_points, best_arc, round(best_r, 2)


def _dropout_percent(word_count: int, medium: str) -> int:
    expected = {"novel": 55000, "screenplay": 22000, "song": 400}
    exp = expected.get(medium, 55000)
    pct = int(word_count * 100 / exp)
    return max(20, min(85, pct))


def _type_token_ratio(text: str) -> float:
    words = re.findall(r"\b[a-z']+\b", text.lower())
    if not words:
        return 0.5
    return len(set(words)) / len(words)


def _mean_sentence_length(text: str) -> float:
    try:
        sents = nltk.sent_tokenize(text)
    except Exception:
        sents = text.split(".")
    if not sents:
        return 15.0
    return sum(len(s.split()) for s in sents) / len(sents)


def _dialogue_ratio(text: str) -> float:
    quoted = re.findall(r'"[^"]{5,}"', text)
    total_words = len(text.split())
    if total_words == 0:
        return 0.0
    dialogue_words = sum(len(q.split()) for q in quoted)
    return dialogue_words / total_words


def _paragraph_length(text: str) -> float:
    paras = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]
    if not paras:
        return 50.0
    return sum(len(p.split()) for p in paras) / len(paras)


def _sliding_windows(text: str, n_windows: int = 10) -> list[str]:
    words = text.split()
    if not words:
        return [""] * n_windows
    size = max(1, len(words) // n_windows)
    return [" ".join(words[i * size : (i + 1) * size]) for i in range(n_windows)]


def _trend_and_delta(values: list[float]) -> tuple[list[float], int]:
    if not values:
        return [0.5] * 16, 0
    mn, mx = min(values), max(values)
    span = mx - mn if mx != mn else 1.0
    normalized = [round((v - mn) / span, 3) for v in values]
    # Resample to 16 points for sparkline
    spark = _resample(normalized, 16)
    # Delta: compare first third vs last third
    n = len(values)
    first_third = values[: n // 3] or values[:1]
    last_third = values[-(n // 3) :] or values[-1:]
    avg_first = sum(first_third) / len(first_third)
    avg_last = sum(last_third) / len(last_third)
    if avg_first == 0:
        delta_pct = 0
    else:
        delta_pct = int((avg_last - avg_first) / abs(avg_first) * 100)
    return spark, delta_pct


def _resample(values: list[float], target: int) -> list[float]:
    if len(values) == target:
        return values
    result = []
    for i in range(target):
        idx = i * (len(values) - 1) / (target - 1)
        lo = int(idx)
        hi = min(lo + 1, len(values) - 1)
        frac = idx - lo
        result.append(round(values[lo] * (1 - frac) + values[hi] * frac, 3))
    return result


_VITAL_LABELS: dict[str, list[str]] = {
    "novel": ["vocabulary richness", "sentence length", "dialogue ratio", "paragraph length"],
    "screenplay": ["scene count", "scene length", "dialogue density", "action lines"],
    "song": ["lexical density", "line length", "rhyme regularity", "image specificity"],
}


def compute_vital_signs(text: str, medium: str) -> list[dict]:
    windows = _sliding_windows(text, 10)
    labels = _VITAL_LABELS.get(medium, _VITAL_LABELS["novel"])

    metrics: list[list[float]] = [
        [_type_token_ratio(w) for w in windows],
        [_mean_sentence_length(w) for w in windows],
        [_dialogue_ratio(w) for w in windows],
        [_paragraph_length(w) for w in windows],
    ]

    result = []
    for i, (label, values) in enumerate(zip(labels, metrics)):
        spark, delta_pct = _trend_and_delta(values)
        # Dialogue ratio going up is "bad" (writer avoiding prose), so invert the decline flag
        if i == 2:  # dialogue ratio
            decline = delta_pct > 0
            sign = "+" if delta_pct >= 0 else "−"
            val_str = f"{sign}{abs(delta_pct)}%"
        else:
            decline = delta_pct < 0
            sign = "−" if delta_pct < 0 else "+"
            val_str = f"{sign}{abs(delta_pct)}%"
        result.append({
            "label": label,
            "value": val_str,
            "decline": decline,
            "spark": spark,
        })

    return result


def analyze_text(text: str, medium: str) -> dict:
    """Run all quantitative analysis. Returns dict matching ProjectRecord fields."""
    word_count = len(text.split())
    arc_points, closest_arc, arc_r = compute_emotional_arc(text)
    dropout = _dropout_percent(word_count, medium)
    vitals = compute_vital_signs(text, medium)
    return {
        "word_count": word_count,
        "dropout_percent": dropout,
        "emotional_arc_data": arc_points,
        "closest_arc": closest_arc,
        "arc_correlation": arc_r,
        "vitals": vitals,
    }


def excerpt(text: str, n_words: int = 500, from_end: bool = False) -> str:
    words = text.split()
    if from_end:
        words = words[-n_words:]
    else:
        words = words[:n_words]
    return " ".join(words)
