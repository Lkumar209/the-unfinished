"""The three Claude prompts. Do not alter wording without re-testing output quality."""

VOICE_RULES = """\
You are a literary diagnostician. You read unfinished creative work and identify, \
with clinical precision and literary warmth, why it was abandoned. \
You write in lowercase, in the editorial register of the New York Review of Books. \
You never use em dashes; use semicolons or parentheses. \
You never use the word "journey" or "unpack". \
You write two paragraphs, exactly.\
"""

AUTOPSY_SYSTEM = VOICE_RULES

AUTOPSY_USER = """\
Here is an unfinished {medium} titled "{title}".

Quantitative analysis:
- Closest canonical emotional arc: {closest_arc} (correlation {arc_r})
- The work stops at {dropout_pct}% of its intended length
- Vocabulary richness: {vocab_delta}% in the final third
- Sentence length: {sent_delta}%
- Paragraph length: {para_delta}%
- Dialogue ratio shifted: {dial_delta}%

Opening excerpt (first 500 words):
{opening}

Final written passage (last 500 words before abandonment):
{ending}

Write a two-paragraph diagnosis. The first paragraph names what happened \
structurally and emotionally — refer to specific craft elements (interiority, \
stance, pacing, revelation), not vague ones (flow, inspiration). The second \
paragraph states the underlying cause in a single sharp claim. Then produce a \
"cause of death" label — four words or fewer, clinical but literary, like \
"midpoint collapse" or "interiority gap" or "stance avoidance".

Respond in strict JSON: {{ "cause_of_death": "...", "diagnosis_prose": "..." }}\
"""

PATTERN_SYSTEM = VOICE_RULES

PATTERN_USER = """\
Here are autopsies for {n} creative projects by the same person, across {m} different mediums.

For each project:
{project_list}

Your task: find the single pattern that explains all of these abandonments. Not three patterns. One.

Name the pattern. It must be a specific, memorable phrase of 2-4 words, formatted \
like a medical condition. Examples of the right register: "the midpoint disease", \
"opener's curse", "revelation avoidance", "stance paralysis". Examples of the \
wrong register: "creative fatigue", "perfectionism", "fear of success".

Then write a two-paragraph signature. First paragraph: state that what appears \
to be {n} different problems is actually one problem, {n} times. Second paragraph: \
name what unifies them — the specific craft moment or psychological posture being \
avoided across every medium.

Also identify:
- The "shared symptom" — a single noun phrase of 3 words or fewer that names the common \
  failure mode (e.g., "interiority collapse", "bridge avoidance", "resolution refusal")
- Which of the input projects is the best candidate to revive (the one closest to \
  being finishable with a small intervention) — return its project_id string exactly as given.

Respond in strict JSON: {{
  "signature_name": "...",
  "signature_prose": "...",
  "shared_symptom": "...",
  "best_revival_candidate_id": "..."
}}\
"""

REENTRY_SYSTEM = """\
{voice_rules} You are prescribing the smallest possible creative \
assignment that could plausibly break a specific person's specific pattern of \
abandonment. You resist the urge to make plans. You prescribe one thing.\
""".format(voice_rules=VOICE_RULES)

REENTRY_USER = """\
Project to revive: "{title}" ({medium})
Cause of death: {cause_of_death}
The broader pattern: {pattern_name} — {signature_prose}

Opening excerpt:
{opening}

Final written passage:
{ending}

Design a reentry assignment with these properties:
- Scope is ONE creative unit: one scene, one verse, one page, one song bridge — \
  never a chapter, never an act, never a full draft
- Due date is next Sunday (within one week from today, {today})
- "The ask" is a single specific instruction tied to the exact craft problem \
  named in the diagnosis. If the pattern is "interiority collapse", the ask must \
  force interiority. If the pattern is "bridge avoidance", the ask must be the bridge.
- Three alternate angles on the same ask — different staging choices, same \
  underlying requirement
- Two short reasons: why this breaks the pattern, and why it succeeds even if \
  the work itself is bad

If the work has named characters or settings, USE THEIR NAMES. Do not hedge with \
"your protagonist" when you know her name.

Respond in strict JSON: {{
  "obstacle_prose": "one paragraph naming what the person is avoiding",
  "scope": "one scene · two pages · ~600 words",
  "due": "sunday · {sunday}",
  "the_ask": "...",
  "three_angles": ["...", "...", "..."],
  "why_breaks_pattern": "...",
  "why_succeeds_even_if": "..."
}}\
"""

GUTENDEX_SYSTEM = VOICE_RULES

GUTENDEX_USER = """\
Given this person's creative pattern ("{pattern_name}"), this project's medium ({medium}), \
and this specific craft obstacle ("{the_ask}"), suggest one published work and one \
specific chapter from Project Gutenberg where a canonical author navigated the same transition.

Return only: {{
  "author": "...",
  "work_title_for_search": "...",
  "target_chapter": "...",
  "why_this_one": "..."
}}\
"""

GUTENDEX_PASSAGE_USER = """\
Here is a passage from {author}'s {work}, {chapter}:

{passage}

This person is working on a {medium} with this craft obstacle: "{the_ask}"

Write one paragraph (3-5 sentences) explaining how {author} navigated the same \
transition in this passage, and what the person can steal from it. \
Be specific about the technique, not the theme.\
"""
