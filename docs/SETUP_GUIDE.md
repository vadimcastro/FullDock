# Setup Guide — OnDeck (v2.1.6 Released)

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
- Current head: `0007_prompt_linked_integrity`

Quick schema verification:

```bash
make migrate
python3 scripts/verify_prompt_schema.py
```

## Release Validation Checklist

```bash
cd frontend && npx tsc --noEmit
cd ..
python3 -m compileall backend/app backend/alembic/versions scripts
make migrate
python3 scripts/ci_backend_smoke.py http://127.0.0.1:8000
```

Optional persistence validation:

```bash
python3 scripts/ci_backend_persistence.py create http://127.0.0.1:8000 /tmp/state.json
python3 scripts/ci_backend_persistence.py verify http://127.0.0.1:8000 /tmp/state.json
```

## Troubleshooting

- If frontend deps look stale: `make clean-all && make dev-build`
- If migration drift appears: run `make migrate` then `python3 scripts/verify_prompt_schema.py`
- If auth/cloud-sync behaves unexpectedly: verify API health at `/health` and inspect API logs via `make logs-api`
- If local port conflicts occur (e.g., `5432` busy): stop duplicate compose projects before running `make dev-build`

## Reference Docs

- Project summary: [../README.md](../README.md)
- Technical reference: [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md)
- Next release tracker: [NEXT_STEPS.md](NEXT_STEPS.md)
