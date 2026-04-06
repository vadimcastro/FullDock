# OnDeck 2.0.0 — Knowledge Base

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 (OKLCH) · FastAPI · PostgreSQL · Redis · Docker

---

## Current Status Snapshot (2026-04-06)

- `v2.0.0` integration baseline is complete on OnDeck infrastructure.
- Latest implemented deltas:
  - Auth/settings state sync correctness updates
  - Local storage to cloud sync flow stabilization on login
  - Global UI sound effects (`frontend/src/lib/sound-effects.ts`) wired into tabs/cards/preferences
  - Cloud-sync auth rendering now keyed to `AuthContext` (`cloudSync.isConnected`)
- `v2.1.0` work planning is tracked in `docs/ONDECK_INTEGRATION_REVIEW.md`.

---

## Architecture

### Frontend (`frontend/src/`)

| Path | Purpose |
|---|---|
| `app/layout.tsx` | Root layout — Geist font, ThemeProvider, Providers |
| `app/page.tsx` | Entry → renders `<OnDeckApp />` |
| `components/on-deck-app.tsx` | Main app shell |
| `components/model-tabs.tsx` | AI model tab navigation |
| `components/model-view.tsx` | Per-model prompt queue view |
| `components/prompt-card.tsx` | Individual prompt card (CRUD) |
| `components/preferences-view.tsx` | Theme + accent color settings panel |
| `components/settings-modal.tsx` | Settings dialog |
| `components/cloud-sync.tsx` | Backend sync status surface |
| `components/theme-provider.tsx` | next-themes wrapper |
| `components/ui/` | 13 Shadcn/Radix UI primitives |
| `hooks/use-prompts.ts` | Prompt CRUD → syncs to `/api/v1/prompts` |
| `hooks/use-settings.tsx` | Theme/accent → syncs to `/api/v1/settings` |
| `hooks/use-mobile.ts` | Responsive breakpoint hook |
| `lib/types.ts` | `Prompt`, `AIModel`, `PromptStatus` types |
| `lib/settings-types.ts` | `Settings`, `AccentColor`, `ACCENT_COLORS` |
| `lib/api/protected.ts` | Authenticated API client |
| `styles/globals.css` | Full OKLCH design system |

### Backend (`backend/app/`)

| Path | Purpose |
|---|---|
| `api/v1/endpoints/prompts.py` | Prompt CRUD endpoints |
| `api/v1/endpoints/settings.py` | User settings endpoints |
| `api/v1/auth.py` | JWT + OAuth auth flow |
| `api/v1/oauth.py` | OAuth provider redirects/callbacks |
| `models/prompt.py` | SQLAlchemy `Prompt` model |
| `models/user_setting.py` | SQLAlchemy `UserSetting` model |
| `schemas/prompt.py` | Pydantic prompt schemas |

### Docker (`docker/`)

| File | Purpose |
|---|---|
| `docker-compose.dev.yml` | **Single dev compose** — all services |
| `docker-compose.prod.yml` | Production stack |
| `frontend/Dockerfile.dev` | 2-stage: deps cached in image layer |
| `frontend/Dockerfile.prod` | 3-stage: minimal standalone runtime |
| `Dockerfile` | API (Python 3.11 slim) |

---

## Key Design Decisions

### No node_modules Volume
`node_modules` is baked into the Docker image layer (not a named volume). This eliminates the stale-cache problem where new npm packages would be missing after `package.json` updates. `make dev-build` always produces a clean, reproducible dependency set.

### OKLCH Design Tokens
The entire color system uses OKLCH for perceptually uniform colors. Model-specific accents live as CSS custom properties:
- `--claude-accent` → warm orange
- `--gpt-accent` → teal
- `--grok-accent` → purple
- `--gemini-accent` → blue

### Backend-Synced Hooks
`usePrompts` and `useSettings` talk directly to the FastAPI backend via `useProtectedApi`. Optimistic updates keep the UI responsive; errors trigger a re-fetch.

### Push Notifications
Notification preference is handled in `frontend/src/components/preferences-view.tsx`:
- Requests browser permission when the toggle is enabled.
- Reverts to `off` when permission is denied/unsupported.
- Persists state through `useSettings` to `/api/v1/settings`.

---

## Commands Reference

| Command | Description |
|---|---|
| `make dev` | Start stack (cached images) |
| `make dev-build` | Rebuild images + start |
| `make down` | Stop all containers |
| `make clean-all` | Stop + remove volumes |
| `make logs` | Tail all logs |
| `make logs-frontend` | Frontend logs |
| `make logs-api` | API logs |
| `make migrate` | Run Alembic migrations |
| `make migrate-create name=X` | Generate migration |
| `make shell-api` | sh into API container |
| `make shell-db` | psql into database |
| `make doctor` | Preflight environment check |
| `make prod` | Start production stack |

---

## Auth Flow

1. Client POSTs credentials → `/api/v1/auth/login`
2. Backend sets `accessToken` + `refreshToken` cookies
3. `useProtectedApi` attaches cookies on every request
4. On 401, refresh token is used automatically
5. `logout-all` revokes all sessions in Redis

## OAuth Flow

1. Frontend redirects to `/api/v1/oauth/{provider}`
2. Backend exchanges code, upserts user in Postgres
3. Issues same JWT pair as email/password flow
4. Session management is identical from there

---

## Adding a New npm Package

```bash
# 1. Add to frontend/package.json
# 2. Regenerate lockfile
cd frontend && npm install --package-lock-only --legacy-peer-deps
# 3. Rebuild Docker image to bake in new deps
cd .. && make dev-build
```

## Adding a Backend API Endpoint

```bash
# 1. Create router in backend/app/api/v1/new_feature.py
# 2. Register in backend/app/main.py
# 3. If schema change: make migrate-create name=add_new_feature
# 4. make migrate
```
