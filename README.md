# OnDeck

High-fidelity AI prompt queue management across models.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · FastAPI · PostgreSQL · Redis · Docker

## Release Status

- `v2.1.5` released (April 7, 2026)
- `v2.1.6` released (April 7, 2026)
- `v2.1.7` released (April 7, 2026)
- `v2.1.8` planned (observability depth + release automation polish)

## v2.1.7 Highlights

- DB integrity for linked prompts (`0007_prompt_linked_integrity`)
- Transactional settings layout APIs (model tabs/categories/title)
- Settings UI stabilization for drag/add/delete/title-edit flows
- Debounced settings sync to reduce write churn
- Structured backend error payloads + request ID propagation
- Write-rate limiting for prompt/settings mutation endpoints
- OAuth callback state-cookie validation
- Expanded backend smoke coverage + passing release checks

## Quick Start

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

## Core Commands

```bash
make dev
make dev-build
make down
make clean-all
make logs
make logs-frontend
make logs-api
```

```bash
make migrate
make migrate-create name=add_x
make shell-api
make shell-db
make doctor
make release-check
```

## Validation Commands

```bash
cd frontend && npx tsc --noEmit
cd ..
python3 -m compileall backend/app backend/alembic/versions scripts
make migrate
python3 scripts/ci_backend_smoke.py http://127.0.0.1:8000
```

## Docs

- Setup and operations: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)
- Technical reference: [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md)
- Next release tracker: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

## Security Baseline

Implemented baseline:
- JWT access + refresh rotation
- Login throttling and lockout
- Session revocation (`logout`, `logout-all`)
- Auth event logging
- Production fail-fast checks for weak/missing secrets
- Write-rate limits for prompt/settings mutation paths
- OAuth callback state validation

Future hardening and automation are tracked in [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).

## License

MIT
