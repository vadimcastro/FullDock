# Setup Guide — OnDeck 2.1.5

`v2.0.0` remains the integration baseline. `v2.1.1` through `v2.1.5` progress is summarized in `docs/KNOWLEDGE_BASE.md`.
Prompt category/list backend gap analysis and remediation plan: `docs/PROMPT_CATEGORIES_BACKEND_AUDIT.md`.

## Validation Snapshot (v2.1.5)

- Smoke+persistence testing completed for auth, settings, and prompts API flows (`v2.1.1`).
- Restart persistence validated with create -> `down`/`up` -> relogin/list verification.
- `/docs` branding validated (`OnDeck API - Swagger UI`).
- GitHub CI passes after lockfile/action-runtime fixes:
  - Frontend: `npm ci`, `npm run build`
  - Backend: `pip install`, import check, compileall
- `v2.1.2` cleanup completed:
  - Legacy dashboard/resume/template surfaces removed
  - Duplicate root `src/` tree removed
  - Reset-password request/confirm flow implemented and locally validated
- `v2.1.3` integration gate completed (2026-04-07):
  - 18-step auth/prompts/settings/oauth/reset-password smoke pass
  - restart persistence pass (`down`/`up` without volume deletion)
  - frontend build hardening for restricted environments (no Google font fetch requirement)
- `v2.1.4` readiness automation:
  - CI now includes backend smoke + restart persistence validation
  - OAuth env readiness helper available: `scripts/check-oauth-env.sh`
  - CI now passes with all quality gates (`frontend`, `backend`, `backend_smoke`)
- `v2.1.5` implementation validation (2026-04-07):
  - migration chain validated through `0004_prompt_status_indexes`
  - local smoke pass (`scripts/ci_backend_smoke.py`) with canonical `complete` status contract
  - local persistence restart pass (`scripts/ci_backend_persistence.py`)
  - frontend production build pass after model-logo and completed-card UI updates

## Prerequisites

- Docker Engine + Compose plugin
- `make`
- Git

```bash
docker --version
docker compose version
make --version
```

---

## First Run

```bash
git clone <repo-url> && cd OnDeck
cp .env.example .env.development
# Edit .env.development with your secrets
make doctor        # preflight check
make dev-build     # builds images and starts all services
```

Services:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Daily Workflow

```bash
make dev           # Start (fast — uses cached Docker images)
make down          # Stop everything
make logs          # Tail all logs
make logs-frontend # Frontend only
make logs-api      # API only
```

**After changing `package.json` or Python deps:**
```bash
make dev-build     # Rebuilds images with new deps baked in
```

**Full clean reset** (removes all data volumes):
```bash
make clean-all && make dev-build
```

---

## Docker Architecture

OnDeck uses a **single, simple compose setup**:

| File | Purpose |
|---|---|
| `docker/docker-compose.dev.yml` | Development stack |
| `docker/docker-compose.prod.yml` | Production stack |
| `docker/frontend/Dockerfile.dev` | Dev frontend (2-stage, deps cached in image layer) |
| `docker/frontend/Dockerfile.prod` | Prod frontend (3-stage, minimal standalone runner) |
| `docker/Dockerfile` | API (Python/FastAPI) |

**Key design decision:** `node_modules` lives inside the Docker image layer, **not** in a named volume. This means:
- No stale cache issues when adding new npm packages
- `make dev-build` always gives you a clean, consistent dependency set
- `make dev` is fast because Docker layer caching handles the `npm install` step

---

## Database / Migrations

```bash
make migrate                         # Apply all pending migrations
make migrate-create name=add_column  # Generate new migration from models
make shell-db                        # Direct psql session
```

### Prompt Category/List Schema Note (2026-04-07)

- Prompt list/category fields currently persisted in backend:
  - `prompts.status` (`queued`, `on-deck`, `needs-edit`, `forked`, `complete`)
  - `prompts.order`
  - `prompts.linked_prompt_id`
  - `prompts.title`
- Current startup migration script (`backend/scripts/migrate.sh`) needs hardening:
  - Alembic-tracked DBs now run `alembic upgrade head` on startup.
  - Untracked/bootstrap DBs still use `create_all` + `alembic stamp head` for initial baseline.
  - Alembic revision IDs were normalized to fit the default `alembic_version.version_num` size:
    - `0003_prompt_titles_settings`
    - `0004_prompt_status_indexes`

### Recommended Migration Verification

After startup or deployment, run:

```bash
make migrate
make shell-db
```

Then verify prompt/settings columns exist (inside `psql`):

```sql
\d prompts
\d user_settings
```

Expected recent columns include:
- `prompts.title`
- `user_settings.font_scale`
- `user_settings.show_prompt_titles`

---

## Authentication

Local admin credentials come from `.env.development`:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

Auth features:
- JWT access + refresh token rotation
- Login throttling (rate-limited)
- Session revocation (`/auth/logout`, `/auth/logout-all`)
- Auth event logging

---

## OAuth Setup

1. Add to `.env.development`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```
2. Run `make migrate` (creates `oauth_accounts` table)
3. Provider redirect URIs:
   - `http://localhost:8000/api/v1/oauth/google`
   - `http://localhost:8000/api/v1/oauth/github`

---

## Push Notifications

- Toggle path: `Preferences > Notifications`.
- Behavior:
  - If browser notifications are unsupported, setting reverts to `off`.
  - If permission is denied, setting reverts to `off`.
  - If permission is granted, setting persists via `/api/v1/settings`.
- This release includes permission/state handling only; background push delivery is out of scope for `v2.0.0`.

---

## Password Reset (Implemented)

- Request endpoint: `POST /api/v1/auth/reset-password-request`
- Confirm endpoint: `POST /api/v1/auth/reset-password-confirm`
- Frontend page: `/reset-password`
- In non-production, reset request responses include `reset_token` and `reset_url` for local verification without email infrastructure.
- Confirmed behavior:
  - request endpoint returns generic success (no user enumeration)
  - successful confirm invalidates prior sessions via `logout-all` style revocation

---

## Production

```bash
# Requires .env.production.local with strong secrets
make prod
```

Production safeguards:
- `SECRET_KEY` must be strong
- `ADMIN_PASSWORD` must be strong
- `POSTGRES_PASSWORD` must be set
- CORS origins must be explicit

---

## Repo Handoff (Brother OnDeck Repo)

Use this flow when transitioning from legacy/template history to a clean OnDeck baseline:

1. Brother renames old repo to `OnDeck-legacy` (or archives it).
2. Brother creates a new empty repo named `OnDeck`.
3. From this repo, push `preDeck` to brother's new `main`:

```bash
git remote add bro git@github.com:<bro-username>/OnDeck.git
git push bro preDeck:main
git push bro --tags
```

4. In brother's new repo settings:
   - set default branch to `main`
   - enable branch protection for `main`
   - add required repo secrets/env values

This preserves a clean history for active OnDeck development while keeping legacy history available in `OnDeck-legacy`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| New npm package not found | `make clean-all && make dev-build` |
| Port conflicts | `lsof -i :3000`, `:8000`, `:5432`, `:6379` |
| DB out of sync | `make migrate` |
| Full reset | `make clean-all && make dev-build` |
| Environment check | `make doctor` |

---

## All Commands

```bash
make dev                          # Start with cached images
make dev-build                    # Rebuild images + start
make down                         # Stop all services
make clean-all                    # Stop + delete all volumes
make logs                         # All logs
make logs-frontend                # Frontend logs
make logs-api                     # API logs
make migrate                      # Run migrations
make migrate-create name=X        # Create migration
make shell-api                    # sh in API container
make shell-db                     # psql in DB container
make shell-frontend               # sh in frontend container
make prod                         # Production stack
make doctor                       # Preflight check
make clean                        # docker system prune
make help                         # Full command list
```
