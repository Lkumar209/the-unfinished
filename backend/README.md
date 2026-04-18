# the unfinished — backend

FastAPI backend for quantitative and AI-powered analysis of abandoned creative work.

## Setup

```bash
cd backend

# create virtualenv
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# install dependencies
pip install -e ".[test]"

# copy env file and fill in your keys
cp .env.example .env
```

Your `.env` needs at minimum:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Run in dev

From the `backend/` directory:
```bash
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/api/health`

## Run the full stack

From the project root (requires two terminals):
```bash
# terminal 1 — backend
cd backend && uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
npm run dev
```

Or with a single command (requires `concurrently`):
```bash
npm install -D concurrently
npx concurrently "cd backend && uvicorn app.main:app --reload --port 8000" "npm run dev"
```

## Run tests

```bash
cd backend
pytest tests/ -v
```

## API reference

All endpoints prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | health check |
| POST | `/api/projects/upload` | upload files (multipart) |
| GET | `/api/projects` | list all projects |
| GET | `/api/projects/{id}` | single project |
| DELETE | `/api/projects/{id}` | delete project + autopsy |
| POST | `/api/projects/{id}/autopsy` | generate Claude diagnosis |
| GET | `/api/projects/{id}/autopsy` | get cached autopsy |
| POST | `/api/pattern` | cross-project pattern analysis |
| GET | `/api/pattern/latest` | latest pattern report |
| POST | `/api/reentry` | generate reentry plan |

## Storage

All data persisted as JSON files under `storage/`:
```
storage/
├── projects/    {project_id}.json
├── autopsies/   {project_id}.json
├── patterns/    {pattern_id}.json
└── reentry/     {reentry_id}.json
```

To reset everything: `rm -rf storage/*/`

## Seeding test data

Drop .txt files into a staging folder and run:
```bash
curl -X POST http://localhost:8000/api/projects/upload \
  -F "files=@my_novel.txt" \
  -F "files=@my_screenplay.fdx"
```

Then trigger autopsies:
```bash
curl -X POST http://localhost:8000/api/projects/proj_abc123/autopsy
```

## Non-text files

Audio (.mp3, .wav) and image (.jpg, .png) uploads are accepted and return
pre-computed mock autopsies from `app/fixtures/mock_analysis.py`. The mock
data is hand-written to match Claude output quality. During demo, mix real
text files with these mock files for a multi-domain graveyard.
