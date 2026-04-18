# the unfinished

A creative diagnostics tool. Upload the novels, screenplays, songs, and paintings you never finished — it'll tell you, with evidence, exactly where and why you keep quitting.

Built at CMU · 2025

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key (or use `placeholder` to run in mock mode)

---

## Quickstart

### 1. Clone the repo

```bash
git clone https://github.com/Lkumar209/the-unfinished.git
cd the-unfinished
```

### 2. Set up the backend

```bash
cd backend

# create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# install dependencies
pip install -e ".[test]"

# configure environment
cp .env.example .env
```

Open `backend/.env` and set your API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

> **No API key?** Leave it as `ANTHROPIC_API_KEY=placeholder` — the app runs fully in mock mode with realistic pre-generated responses.

### 3. Install frontend dependencies

From the project root:

```bash
npm install
```

---

## Running the app

Open **two terminals**:

**Terminal 1 — backend**
```bash
cd backend
source .venv/bin/activate        # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend**
```bash
npm run dev
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Verify it's working

```bash
curl http://localhost:8000/api/health
# → {"status":"ok"}
```

---

## Supported file types

| Type | Extensions |
|------|-----------|
| Writing | `.txt` `.docx` `.pdf` |
| Screenplay | `.fdx` (Final Draft) |
| Audio | `.mp3` `.wav` |
| Image | `.jpg` `.jpeg` `.png` |

---

## Running tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## Reset all data

```bash
rm -rf backend/storage/*/
```
