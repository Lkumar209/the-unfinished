# the unfinished

a creative diagnostics tool for people who start things and don't finish them.

upload the novels, screenplays, songs, and paintings you never finished. we'll tell you — with evidence — exactly where and why you keep quitting. then we'll give you one small thing to do about it.

**built at cmu · claude builder club x cmuai hackathon · april 2026**

---

## the problem

every creative person has a graveyard of abandoned projects. half-written novels, songs that die at the bridge, sketches turned against the wall. they were abandoned not because they were bad — but because the person got stuck, lost momentum, or lost faith.

there are hundreds of AI tools that help you start new things. nobody helps you finish the things you already cared enough to start.

the unfinished reads your creative graveyard and does something no existing tool does: it finds the *pattern* across your abandonments. not generically — it reads what you actually made, identifies where the energy drops, where the structure breaks, where the confidence falters, and tells you exactly why you keep stopping at the same place.

then it gives you one small next step. not a rewrite. not a critique. just the one thing that gets you back in motion.

**theme alignment:** the hackathon theme is *creative flourishing*. the prompt says "people who could find meaning through creative expression often don't get the chance." some of those people *did* start. they started multiple times. they just couldn't finish. the unfinished is for them.

---

## how claude is used — a global view

claude is not a wrapper in this project. it is the core analytical engine, used in five distinct capacities across the full stack. every major feature of the product depends on claude's reasoning capabilities in a way that could not be replicated with a simpler model or a rules-based system.

### 1. claude built the frontend (claude code + claude chat)

the entire react frontend was built using claude. the design system — serif-forward editorial aesthetic inspired by medium/substack, the muted rust accent palette, the lowercase voice, the hand-written SVG charts — was developed through iterative prompting with claude chat to produce a detailed frontend PRD, then executed in claude code.

**what claude generated:**
- complete react + vite + tailwind + react router application
- six screens: landing, upload, library, autopsy, pattern map, reentry plan
- custom SVG chart components (emotional arc overlay, dropout timeline, vital sign sparklines) — all hand-written SVG, no charting library
- a full design token system enforced across every component
- responsive layouts with an editorial typographic hierarchy

**why this matters:** the frontend is not a generic dashboard. it has a specific editorial voice ("a doctor who is also a novelist") that required claude to understand both design systems and prose tone simultaneously. the lowercase-everywhere convention, the monospace overlines, the generous whitespace, the clinical-but-warm copywriting — these are all claude's output, refined through conversation.

### 2. claude performs per-project creative autopsy (api call 1)

when a user uploads an unfinished creative work, the backend runs quantitative text analysis (sentiment arc, vocabulary decay, sentence complexity trends) and then passes the structured results plus excerpts of the actual work to claude sonnet via the anthropic api.

**the prompt architecture:**

```
system: You are a literary diagnostician. You read unfinished creative work and
identify, with clinical precision and literary warmth, why it was abandoned.
You write in lowercase, in the editorial register of the New York Review of Books.
You never use em dashes; use semicolons or parentheses. You never use the word
"journey" or "unpack". You write two paragraphs, exactly.
```

claude receives:
- the closest canonical emotional arc match (from the six Vermont shapes) and its correlation coefficient
- the dropout percentage (where in the intended arc the work stops)
- four vital sign deltas (vocabulary richness, sentence length, paragraph length, dialogue ratio)
- the first 500 words of the work (to understand the setup)
- the last 500 words before abandonment (to see where energy died)

claude produces:
- a two-paragraph diagnosis naming the specific craft problem (not "you lost motivation" but "you ran out of interiority; the story needs her to choose, and you haven't decided what she wants yet")
- a "cause of death" label — four words or fewer, clinical but literary (e.g., "midpoint collapse", "interiority gap", "bridge avoidance", "stance paralysis")

**why this requires claude:** the diagnosis must reference specific craft concepts (interiority, stance, revelation, pacing) and connect quantitative signals (vocabulary decay, dialogue ratio shift) to qualitative creative insights. this is genuine literary reasoning, not template-filling. a simpler model produces generic advice; claude produces diagnoses that feel like they came from a writing professor who actually read your work.

**model:** `claude-sonnet-4-6` · temperature 0.7 · max_tokens 1000

### 3. claude performs cross-project pattern synthesis (api call 2)

this is the product's core differentiator and the demo climax. after all individual autopsies are complete, all of them are fed into a single claude call. claude's job: find the one pattern that explains every abandonment.

**the prompt architecture:**

```
system: [same voice rules]

user: Here are autopsies for {N} creative projects by the same person,
across {M} different mediums.

For each project:
1. {title} ({medium}) — dropout at {pct}%, arc {arc}, cause: {cause_of_death}
   Diagnosis excerpt: "{first 200 chars of diagnosis_prose}"
2. ...

Your task: find the single pattern that explains all of these abandonments.
Not three patterns. One.
```

claude produces:
- a pattern name — a memorable 2-4 word phrase in the register of a medical condition (e.g., "the midpoint disease", "opener's curse", "revelation avoidance")
- a two-paragraph "signature" that states: what appears to be N different problems is actually one problem N times, and names the specific craft moment or psychological posture being avoided across every medium
- a "shared symptom" label (e.g., "interiority collapse")
- the best revival candidate (which project is closest to finishable with a small intervention)

**why this requires claude:** this call performs multi-document reasoning across heterogeneous creative works (novels, screenplays, songs, visual art) to identify an abstract structural pattern. the pattern must be non-obvious — not "you quit when things get hard" but "every project dies at the moment the work stops being about *what happened* and has to become about *what it meant*." this level of cross-domain creative abstraction is a capability unique to frontier models.

**model:** `claude-sonnet-4-6` · temperature 0.6 · max_tokens 1500

### 4. claude generates a targeted reentry plan (api call 3)

the highest-stakes call. claude designs a single, small, specific creative assignment that targets the exact pattern identified in the synthesis. this is where the product shifts from diagnosis to treatment.

**the prompt architecture:**

```
system: You are prescribing the smallest possible creative assignment that could
plausibly break a specific person's specific pattern of abandonment. You resist
the urge to make plans. You prescribe one thing.
```

claude receives the project's opening and closing excerpts, its cause of death, and the broader cross-project pattern. it produces:
- an obstacle statement naming what the person is specifically avoiding
- a scope constraint (one scene, one verse, one page — never a chapter)
- a due date (next sunday)
- "the ask" — a single specific instruction tied to the exact craft problem. if the pattern is "interiority collapse", the ask forces interiority. if the character has a name, claude uses it.
- three alternate angles — different staging for the same underlying requirement
- two reasons: why this breaks the pattern, and why it succeeds even if the work is bad

**example output for a novel with "interiority collapse":**

> *the ask:* "maren says one true sentence about her mother, to someone who isn't her sister. that's it. she does not have to be right. she has to be willing."
>
> *three angles:*
> 1. "a stranger on a train asks where she's going. she tells the truth."
> 2. "she calls the wrong number at 2am and keeps talking when they don't hang up."
> 3. "she writes an email she doesn't send. the scene is what she types and deletes."

**why this requires claude:** the reentry plan must be simultaneously specific to the individual work (using character names, referencing actual scenes), grounded in the diagnosed pattern (targeting the exact craft gap), and creatively generative (the three angles must be genuinely different staging choices, not rephrased versions of the same idea). this requires deep creative reasoning applied to a specific therapeutic goal.

**model:** `claude-sonnet-4-6` · temperature 0.75 · max_tokens 2000

### 5. claude generates literary precedent via gutendex (api call 4, optional)

after the reentry plan is generated, claude is called once more with the pattern name, the medium, and the craft obstacle. it suggests one published work from project gutenberg where a canonical author navigated the same structural transition. the backend then hits the gutendex api (free, no auth) to fetch the actual text, extracts the relevant passage, and passes it back through claude to produce an adaptation note.

**example output:**

> *literary precedent:* arthur conan doyle, *a study in scarlet*, chapter 4
>
> *adaptation note:* "conan doyle hit the same wall — his detective had gathered evidence but hadn't committed to a theory. he solved it by introducing a red herring that forced both the character and the reader to take a stance. you can use the same technique: introduce a piece of evidence that contradicts maren's working assumption about her mother."

**why this requires claude:** identifying structural parallels between an amateur's unfinished work and a canonical published novel — across different genres, periods, and styles — is a reasoning task that requires both literary knowledge and the ability to map abstract structural patterns onto specific texts.

---

## architecture

```
┌─────────────────┐     HTTP/JSON     ┌──────────────────┐
│  React frontend │ ────────────────► │  FastAPI backend  │
│  (Claude-built) │ ◄──────────────── │  Python 3.11+    │
└─────────────────┘                   └─────┬────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                  │ Claude API   │  │ Gutendex API │  │ Google Places│
                  │ Sonnet 4.6   │  │ (free/no auth│  │ (local       │
                  │              │  │  76k+ books) │  │  communities)│
                  └──────────────┘  └──────────────┘  └──────────────┘
```

### frontend
- react 18 + vite + typescript + tailwind css + react router
- six routes: `/` (landing), `/upload`, `/library`, `/autopsy/:id`, `/pattern`, `/reentry/:id`
- hand-written SVG charts (emotional arc, dropout timeline, vital sign sparklines)
- editorial design system: source serif 4 + inter, warm off-white palette, muted rust accent (#C24A2A)
- tanstack query for data fetching with loading states

### backend
- python fastapi, pydantic v2 models
- nltk VADER for sentiment analysis (emotional arc computation)
- anthropic python SDK for all claude calls
- httpx for gutendex api integration
- json file storage (no database — in-memory for hackathon)

### external apis
- **anthropic claude api** — four distinct calls per analysis session (autopsy, pattern, reentry, literary precedent)
- **gutendex (project gutenberg)** — free api, no auth, 76,000+ public domain books. used to find and fetch full text of published works that match the user's structural problem
- **google places** — local creative communities (writing groups, open mics, workshops) near the user, integrated into the reentry plan

---

## the analysis pipeline

```
upload files
    │
    ▼
text extraction (.txt, .docx, .pdf)
    │
    ▼
quantitative analysis (pure python, no AI)
    ├── sentiment arc: 40-segment VADER scoring → match against 6 canonical Vermont shapes
    ├── vocabulary richness: type-token ratio on sliding 10% windows
    ├── sentence length: mean per window via nltk tokenization
    ├── paragraph length: double-newline split, mean per window
    └── dialogue ratio: quoted span counting per window
    │
    ▼
claude call 1: per-project autopsy
    │ (quantitative results + text excerpts → diagnosis + cause of death)
    │
    ▼
claude call 2: cross-project pattern synthesis
    │ (all autopsies fed simultaneously → single unifying pattern)
    │
    ▼
claude call 3: reentry plan for chosen project
    │ (pattern + excerpts → targeted one-week creative assignment)
    │
    ├──► claude call 4: literary precedent (optional)
    │    └── gutendex api → fetch passage → claude adaptation note
    │
    └──► google places: local creative communities (optional)
```

---

## demo flow

1. user uploads 3-7 abandoned creative projects (text files, with optional mp3/jpg for multi-medium demonstration)
2. the tool runs quantitative analysis on each project (< 1 second per file)
3. claude generates an individual autopsy for each project (~3 seconds each)
4. claude synthesizes a cross-project pattern across all uploads (~5 seconds)
5. the pattern map screen reveals: all projects die in the same structural zone
6. user selects one project to revive
7. claude generates a specific, one-week reentry plan with three angles of approach
8. the plan includes a literary precedent from project gutenberg and local writing groups

**total time from upload to complete diagnosis: ~30 seconds for 4 projects**

---

## quickstart

### prerequisites
- python 3.11+
- node.js 18+
- an anthropic api key

### setup

```bash
git clone https://github.com/Lkumar209/the-unfinished.git
cd the-unfinished

# backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env

# frontend (from project root)
cd ..
npm install
```

### run

```bash
# terminal 1 — backend
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
npm run dev
```

open http://localhost:8080

### verify

```bash
curl http://localhost:8000/api/health
# → {"status":"ok"}
```

---

## supported file types

| type | extensions | processing |
|------|-----------|------------|
| writing | `.txt` `.docx` `.pdf` | full text extraction + live claude analysis |
| screenplay | `.fdx` | full text extraction + live claude analysis |
| audio | `.mp3` `.wav` | accepted; analysis via pre-computed fixtures for v1 |
| image | `.jpg` `.jpeg` `.png` | accepted; analysis via pre-computed fixtures for v1 |

---

## api endpoints

| method | endpoint | description |
|--------|----------|-------------|
| `POST` | `/api/projects/upload` | multipart file upload, text extraction, project creation |
| `GET` | `/api/projects` | list all uploaded projects |
| `GET` | `/api/projects/{id}` | get single project |
| `POST` | `/api/projects/{id}/autopsy` | run quantitative analysis + claude diagnosis |
| `GET` | `/api/projects/{id}/autopsy` | get cached autopsy |
| `POST` | `/api/pattern` | cross-project pattern synthesis via claude |
| `GET` | `/api/pattern/latest` | get most recent pattern report |
| `POST` | `/api/reentry` | generate targeted reentry plan via claude |

---

## claude integration summary

| integration point | what claude does | why it can't be replaced |
|---|---|---|
| **frontend generation** | built the entire react app from a detailed PRD, including custom SVG charts and editorial design system | the design required understanding both code architecture and prose tone simultaneously |
| **per-project autopsy** | reads quantitative analysis + actual text excerpts; produces a two-paragraph diagnosis naming specific craft failures | requires literary reasoning — connecting vocabulary decay metrics to "you ran out of interiority" |
| **cross-project pattern** | reads all autopsies simultaneously; finds one abstract pattern across different mediums | multi-document reasoning across heterogeneous creative works (novels + songs + paintings) |
| **reentry plan** | designs a one-week creative assignment targeting the exact diagnosed pattern | must be specific to the work (using character names), grounded in the pattern, and creatively generative |
| **literary precedent** | identifies a published work where a canonical author solved the same structural problem | requires mapping abstract structural patterns across genres, periods, and styles |

**total claude calls per full analysis session:** 4 (autopsy × N projects, pattern × 1, reentry × 1, literary precedent × 1)

---

## the research behind the product

the emotional arc analysis is grounded in real computational narrative research:

- **reagan et al. (2016), university of vermont** — analyzed 1,700+ novels from project gutenberg and identified six canonical emotional arc shapes: rags to riches, riches to rags, man in a hole, icarus, cinderella, and oedipus. our sentiment arc computation matches user work against these six shapes via pearson correlation.

- **boyd, blackburn & pennebaker (2020)** — identified three core narrative processes (staging, plot progression, cognitive tension) measurable via computational text analysis. our "vital signs" metrics (vocabulary richness decay, sentence length trends, dialogue ratio shifts) are informed by this framework.

- **kurt vonnegut's rejected thesis** — vonnegut proposed the "shapes of stories" concept for his master's thesis at the university of chicago and was rejected. he later called it his best work. we're finishing what he started.

---

## team

built at carnegie mellon university for the claude builder club x cmuai hackathon, april 2026.

---

## license

mit

---

*"the goal is not to finish everything. the goal is to understand yourself well enough to finish one thing."*
