# OnDeck 2.1.2

High-fidelity AI prompt queue management system — built on a hardened full-stack infrastructure.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · FastAPI · PostgreSQL · Redis · Docker

---

## Release Status

- `v2.0.0` is integrated and running on OnDeck infrastructure.
- `v2.1.1` checkpoint: smoke+persistence testing completed, CI workflow added, and `/docs` branding verified.
- `v2.1.2` cleanup complete: legacy dashboard/resume/template UI removed, duplicate root `src/` tree removed, reset-password flow implemented.
- Latest implemented changes (April 6, 2026):
  - Auth/settings state synchronization hardening
  - Local-to-cloud sync stabilization on login
  - Global UI interaction sound effects with user toggle
  - OAuth button polish + cloud-sync auth state fixes
- Latest validation passes:
  - GitHub CI: backend import/compile job pass + frontend `npm ci`/`npm run build` pass
  - Local: reset-password request/confirm flow pass; old password rejected/new password accepted
- Current cleanup details are tracked in `docs/ONDECK_INTEGRATION_REVIEW.md` (Frontend Reduction Synopsis section).

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
- [Integration Review](./docs/ONDECK_INTEGRATION_REVIEW.md)

---

## License

MIT
