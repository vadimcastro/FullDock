# OnDeck 2.1.5

High-fidelity AI prompt queue management system — built on a hardened full-stack infrastructure.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · FastAPI · PostgreSQL · Redis · Docker

---

## Release Status

- `v2.0.0` is integrated and running on OnDeck infrastructure.
- `v2.1.1` checkpoint: smoke+persistence testing completed, CI workflow added, and `/docs` branding verified.
- `v2.1.2` cleanup complete: legacy dashboard/resume/template UI removed, duplicate root `src/` tree removed, reset-password flow implemented.
- `v2.1.3` integration complete: final smoke regression, restart persistence, backend import/compile, and frontend production build gates passed.
- `v2.1.4` readiness complete: CI automation includes backend smoke regression + restart persistence checks and is passing.
- `v2.1.5` UI/UX polish in progress: prompt card interaction cleanup, collapsed-card action availability improvements, and direct field editing ergonomics.
- Latest implemented changes (April 6, 2026):
  - Auth/settings state synchronization hardening
  - Local-to-cloud sync stabilization on login
  - Global UI interaction sound effects with user toggle
  - OAuth button polish + cloud-sync auth state fixes
- Latest validation passes:
  - GitHub CI: frontend build + backend import/compile + backend smoke+persistence jobs passing
  - Local (2026-04-07): 18-step smoke regression pass + restart persistence pass + reset-password verification pass
- Prompt category/list backend audit (2026-04-07):
  - Frontend category UX (`queued`, `on-deck`, `needs-edit`, `forked`, `complete`) is implemented and persisted through `prompts.status`.
  - Migration flow is now hardened for tracked DBs (`alembic upgrade head`), with bootstrap fallback for untracked DBs.
  - Status normalization is aligned (`complete` canonical) and DB-level status constraint/index hardening was added in Alembic `0004`.
  - Backend now demotes competing `on-deck` prompts on create/update when a prompt is set to `on-deck`.
- Build hardening:
  - removed build-time Google font fetch dependency from App Router layout
  - set `turbopack.root` to frontend directory for workspace-root stability
  - standardized npm lockfile strategy: `frontend/package-lock.json` only
- Current cleanup, integration status, and prompt category backend remediation plan are summarized in `docs/KNOWLEDGE_BASE.md`.

---

## Quick Start

```bash
git clone <your-repo> && cd OnDeck
cp .env.example .env.development
make doctor       # preflight check
make dev-build    # first-time build (installs all deps)
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API docs:** http://localhost:8000/docs

---

## Core Commands

```bash
make dev             # Start (uses cached images)
make dev-build       # Rebuild images + start (run after any dep changes)
make down            # Stop all containers
make clean-all       # Stop + delete volumes (fresh start)
make logs            # Tail all logs
make logs-frontend   # Frontend logs only
make logs-api        # API logs only
```

```bash
make migrate                       # Run Alembic migrations
make migrate-create name=add_x     # Auto-generate migration
make shell-api                     # Shell into API container
make shell-db                      # psql into database
make doctor                        # Environment preflight check
```

```bash
make prod            # Start production stack
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.1.6, React 19.2.4, TypeScript, Tailwind CSS v4 |
| UI Library | Shadcn/ui with Radix UI primitives, OKLCH design tokens |
| Backend | FastAPI, SQLAlchemy, Alembic, Uvicorn |
| Database | PostgreSQL 15 |
| Cache/Sessions | Redis 7 |
| Auth | JWT access + refresh rotation, login throttling, session revocation |
| Docker | Single `docker-compose.dev.yml`, two-stage `Dockerfile.dev`, three-stage `Dockerfile.prod` |

---

## Project Structure

```
frontend/          Next.js 16 app (OnDeck UI)
  src/
    app/           App Router pages + layout
    components/    OnDeck runtime components + used UI primitives
    hooks/         usePrompts, useSettings
    lib/           Types, API/auth clients, sound-effects, settings types
    styles/        globals.css (OKLCH tokens)
backend/           FastAPI app
  app/
    api/v1/        prompts, settings, auth endpoints
    models/        SQLAlchemy models
    schemas/       Pydantic schemas
docker/
  Dockerfile                 API image
  docker-compose.dev.yml     Development stack
  docker-compose.prod.yml    Production stack
  frontend/
    Dockerfile.dev           Dev (2-stage, layer-cached deps)
    Dockerfile.prod          Prod (3-stage, minimal runner)
  nginx/                     nginx config for prod
scripts/                     Setup and maintenance helpers
docs/                        Guides and architecture docs
```

---

## Security

- JWT access + refresh token rotation
- Login throttling (rate-limited per IP)
- Session revocation (`logout` and `logout-all`)
- Auth event logging
- Production fail-fast on weak secrets, CORS validation
- HTTPS-aware cookie handling

## OAuth

Populate in `.env.development`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Provider endpoints:
- `http://localhost:8000/api/v1/oauth/google`
- `http://localhost:8000/api/v1/oauth/github`

## Push Notifications

- Push notifications can be toggled in `Preferences > Notifications`.
- On enable, the app requests browser `Notification` permission.
- If permission is denied or unsupported, the toggle is reverted and a status message is shown.
- Current scope is permission-aware UI/state handling; no service-worker or background push pipeline is configured yet.

---

## Troubleshooting

```bash
# Packages not found after dep changes
make clean-all && make dev-build

# Port conflicts
lsof -i :3000 && lsof -i :8000

# Full fresh reset
make clean-all && make dev-build
```

---

## Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Knowledge Base](./docs/KNOWLEDGE_BASE.md)
- [Prompt Categories Backend Audit](./docs/PROMPT_CATEGORIES_BACKEND_AUDIT.md)
- Repo handoff tutorial (new canonical OnDeck repo): see `Setup Guide -> Repo Handoff (Brother OnDeck Repo)`

---

## License

MIT
