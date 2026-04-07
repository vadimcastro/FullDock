# OnDeck 2.1.5 — Knowledge Base

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 (OKLCH) · FastAPI · PostgreSQL · Redis · Docker

---

## Current Status Snapshot (2026-04-07)

- `v2.0.0` integration baseline is complete on OnDeck infrastructure.
- `v2.1.1` checkpoint completed: smoke+persistence testing evidence captured and CI gate added.
- `v2.1.2` cleanup is implemented: legacy dashboard/resume surfaces removed, duplicate root `src/` removed, reset-password flow implemented.
- `v2.1.3` integration gate is complete: final smoke regression + restart persistence + build/import checks passed.
- `v2.1.5` implementation is near-final: backend prompt-category hardening and frontend prompt-card/model-icon polish are implemented and validated.
- Latest implemented deltas:
  - Auth/settings state sync correctness updates
  - Local storage to cloud sync flow stabilization on login
  - Global UI sound effects (`frontend/src/lib/sound-effects.ts`) wired into tabs/cards/preferences
  - Cloud-sync auth rendering now keyed to `AuthContext` (`cloudSync.isConnected`)
  - Prompt status hardening migration applied (`0003_prompt_titles_settings`, `0004_prompt_status_indexes`)
  - Prompt CRUD/server path now demotes competing `on-deck` prompts on create/update and promotes next queued/forked on `needs-edit`/`complete` transitions
  - Model logos rendered in tabs/header/empty states; completed section defaulted to collapsed
  - Preferences now support model-tab ordering/enablement/custom title and prompt-category ordering/visibility
- Latest validation:
  - GitHub CI pass (`frontend npm ci/build`, backend install/import/compile, backend smoke+persistence)
  - Local 18-step smoke regression pass, persistence pass, reset-password session invalidation, and migration idempotence verified
  - Local frontend production build pass after removing build-time Google font fetch dependency

---

## Integration Overview (Brief)

- Integration status: complete and release-ready (`v2.1.3`).
- Frontend reduction status: complete (OnDeck-only routes/components; duplicate root `src/` removed).
- Backend alignment status: complete (`auth`, `oauth`, `prompts`, `settings` APIs are the active frontend surface).
- Final validation gates completed (2026-04-07):
  - 18-step smoke regression pass (`auth`, `prompts`, `settings`, `oauth`, `reset-password`)
  - restart persistence pass (`down`/`up` without volume deletion)
  - backend compile + containerized import check pass
  - frontend `npm ci` + `npm run build` pass
- Build hardening applied:
  - removed `next/font/google` build-time dependency from root layout
  - set `turbopack.root` to frontend directory for workspace-root stability
  - removed unused root `package-lock.json`; `frontend/package-lock.json` is the single npm lockfile
- CI hardening applied for `v2.1.4` readiness:
  - added `Backend Smoke + Persistence` CI job with Postgres + Redis services
  - automated smoke regression execution via `scripts/ci_backend_smoke.py`
  - automated restart persistence verification via `scripts/ci_backend_persistence.py`
  - added OAuth env validation helper: `scripts/check-oauth-env.sh`
  - CI pipeline currently passing with all three tracks (`frontend`, `backend`, `backend_smoke`)

## Post-v2.1.3 Focus

1. Smoke regression in CI: completed and passing.
2. OAuth provider credentials/callback checks in deployment environment: pending environment-side execution (`scripts/check-oauth-env.sh`).
3. New frontend feature work: active next phase from clean baseline with green build/smoke gates required.

## v2.1.5 Progress And Next Steps

Completed in this cycle:
1. Prompt category backend storage/validation hardening is implemented.
2. Migration execution reliability is improved for Alembic-tracked environments.
3. Prompt-card/category UX requests are implemented (`complete` collapsed default + success-accent complete content).
4. Model logos replaced initials in key model UI surfaces.
5. Atomic status transition endpoint is live (`POST /api/v1/prompts/{id}/transition`) and frontend uses it for status changes.
6. CI smoke path now includes title persistence, forked-promotion flow, and invalid-status rejection checks.
7. CI now initializes DB with `alembic upgrade head` and verifies prompt schema constraints/indexes via `scripts/verify_prompt_schema.py`.

Remaining next steps:
1. Add explicit FK/ownership constraints for `linked_prompt_id` if cross-user links should be blocked at schema level.
2. Add transactional reorder/bulk transition endpoint(s) to reduce ordering race windows beyond status transitions.
3. Wire `scripts/verify_prompt_schema.py` into deployment runbooks/post-deploy health checks.

---

## Prompt Categories Overview

- Canonical prompt statuses are enforced in API + DB: `queued`, `on-deck`, `needs-edit`, `forked`, `complete`.
- DB hardening in place:
  - status check constraint: `ck_prompts_status_valid`
  - list/query indexes: `ix_prompts_user_id`, `ix_prompts_user_model_order`, `ix_prompts_user_model_status`
  - migration head: `0004_prompt_status_indexes`
- Queue transition behavior:
  - creating/updating `on-deck` demotes competing `on-deck` in same user/model thread
  - marking `on-deck` as `needs-edit` or `complete` atomically promotes next `queued|forked` prompt
  - frontend status updates use `POST /api/v1/prompts/{id}/transition`
- Layout customization:
  - model tab order and visibility are user-configurable
  - a custom model tab can be enabled and renamed
  - prompt category order/visibility are user-configurable
- Migration strategy:
  - fresh/tracked DBs: `alembic upgrade head`
  - legacy untracked DBs: stamp-only compatibility path

---

## Architecture

### Frontend (`frontend/src/`)

| Path | Purpose |
|---|---|
| `app/layout.tsx` | Root layout — ThemeProvider, Providers |
| `app/page.tsx` | Entry → renders `<OnDeckApp />` |
| `app/reset-password/page.tsx` | Reset request + token-confirm password flow |
| `components/on-deck-app.tsx` | Main app shell |
| `components/model-tabs.tsx` | AI model tab navigation |
| `components/model-view.tsx` | Per-model prompt queue view |
| `components/prompt-card.tsx` | Individual prompt card (CRUD) |
| `components/preferences-view.tsx` | Theme + accent color settings panel |
| `components/cloud-sync.tsx` | Backend sync status surface |
| `components/swipe-container.tsx` | Gesture-aware prompt card interaction wrapper |
| `components/theme-provider.tsx` | next-themes wrapper |
| `components/ui/` | Used Shadcn/Radix primitives + toast helpers |
| `hooks/use-prompts.ts` | Prompt CRUD → syncs to `/api/v1/prompts` |
| `hooks/use-settings.tsx` | Theme/accent → syncs to `/api/v1/settings` |
| `lib/types.ts` | `Prompt`, `AIModel`, `PromptStatus` types |
| `lib/settings-types.ts` | `Settings`, `AccentColor`, `ACCENT_COLORS` |
| `lib/api/protected.ts` | Authenticated API client |
| `lib/auth/AuthContext.tsx` | Session/auth source of truth for UI sync state |
| `lib/sound-effects.ts` | WebAudio interaction sound helpers |
| `styles/globals.css` | Full OKLCH design system |

### Backend (`backend/app/`)

| Path | Purpose |
|---|---|
| `api/v1/auth.py` | JWT + OAuth auth flow |
| `api/v1/oauth.py` | OAuth provider redirects/callbacks |
| `api/v1/endpoints/prompts.py` | Prompt CRUD endpoints |
| `api/v1/endpoints/settings.py` | User settings endpoints |
| `api/v1/router.py` | Active API surface (`auth`, `oauth`, `prompts`, `settings`) |
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
