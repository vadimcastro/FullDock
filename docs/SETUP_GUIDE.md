# Setup Guide — OnDeck 2.1.5

## Prerequisites

- Docker Engine + Docker Compose plugin
- `make`
- Git

```bash
docker --version
docker compose version
make --version
```

## First Run

```bash
git clone <repo-url> && cd OnDeck
cp .env.example .env.development
make doctor
make dev-build
```

Services:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Daily Workflow

```bash
make dev
make down
make logs
make logs-frontend
make logs-api
```

After dependency changes:

```bash
make dev-build
```

Hard reset:

```bash
make clean-all && make dev-build
```

## Migrations

```bash
make migrate
make migrate-create name=add_column
make shell-db
```

Migration behavior:
- Fresh/tracked DBs: `alembic upgrade head`
- Legacy untracked DBs: infer baseline, stamp inferred revision, then upgrade to head
- Current head: `0006_model_tab_titles`

Quick schema verification:

```bash
make migrate
python3 scripts/verify_prompt_schema.py
```

Expected settings columns include:
- `model_tab_order`
- `enabled_model_tabs`
- `model_tab_titles`
- `prompt_category_order`
- `enabled_prompt_categories`

## Auth/OAuth

Configured via `.env.development`:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

OAuth endpoints:
- `http://localhost:8000/api/v1/oauth/google`
- `http://localhost:8000/api/v1/oauth/github`

## Validation Checklist (Release)

Run before release/push:

```bash
cd frontend && npx tsc --noEmit
cd ..
python3 -m compileall backend/app
make migrate
```

Optional smoke + persistence:

```bash
python3 scripts/ci_backend_smoke.py http://127.0.0.1:8000
python3 scripts/ci_backend_persistence.py create http://127.0.0.1:8000 /tmp/state.json
python3 scripts/ci_backend_persistence.py verify http://127.0.0.1:8000 /tmp/state.json
```

## Troubleshooting

- If frontend deps look stale: `make clean-all && make dev-build`
- If migration drift appears: run `make migrate` then `python3 scripts/verify_prompt_schema.py`
- If auth/cloud-sync behaves unexpectedly: verify API health at `/health` and inspect API logs via `make logs-api`

## Reference Docs

- Project summary: [../README.md](../README.md)
- Technical reference: [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md)
- Planning/roadmap: [NEXT_STEPS.md](NEXT_STEPS.md)
