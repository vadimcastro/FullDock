# OnDeck Integration Review

**Last updated:** 2026-04-06  
**Current release baseline:** `v2.0.0` (integrated)  
**Today target release:** `v2.1.0` (in planning/implementation)  
**Checkpoint status:** `v2.1.1` (smoke+persistence testing complete)

---

## Review Scope (Completed)

This review reconciles:

- Docs: `README.md`, `docs/SETUP_GUIDE.md`, `docs/KNOWLEDGE_BASE.md`, this file
- Recent commits on `preDeck`:
  - `9a0d952` - auth/settings sync fixes + global UI sound effects
  - `36b99ce` - infra checkpoint: tabs/settings/oauth/cloud-sync stabilization
  - `517f142` - Docker network and frontend mount reliability fixes
  - `995aedd` - full OnDeck 2.0.0 standalone port and Docker simplification
- Current working tree state (no tracked unstaged/staged code changes at review time)

---

## Goal Status

| Goal | Status | Notes |
|---|---|---|
| Port original OnDeck UX to OnDeck standalone stack | ✅ Complete | Frontend components/hooks ported and running on Next.js 16 + React 19 |
| Replace local-only persistence with backend sync | ✅ Complete | Prompt/settings APIs wired via `use-prompts` + `use-settings` |
| Auth hardening and session control | ✅ Complete | JWT access/refresh, refresh rotation, login throttling, session revocation |
| OAuth provider login | ✅ Complete (config-gated) | Backend routes and frontend buttons present; requires provider credentials |
| Docker developer reliability | ✅ Complete (baseline) | Single dev compose, optimized Dockerfiles, ECONNRESET/ENOENT fixes landed |
| UI interaction feedback | ✅ Complete (new) | Global WebAudio sound cues + preference toggle shipped in `9a0d952` |
| Release confidence gates (tests/CI/checklists) | ⚠️ Partial | Manual validation exists; automation and release checklist need tightening for `v2.1.0` |

---

## Latest Implemented Features (Since Initial 2.0.0 Cut)

### Auth/Settings State Sync Correctness
- `use-settings` now derives cloud auth state from `AuthContext` as the source of truth.
- Theme/accent application moved to dedicated effect keyed to `settings` state, reducing stale UI state risk.
- `updateSettings` now async/await-compatible in context type and UI consumers.

### Cloud Sync UX and Auth Surface
- Cloud sync connection checks now use `cloudSync.isConnected` instead of only legacy state fields.
- OAuth action buttons in auth modal were updated for consistent foreground contrast in light/dark themes.
- Connected-user display now uses `cloudSync.user?.email` fallback-safe rendering.

### UI Sound System
- Added centralized `frontend/src/lib/sound-effects.ts` WebAudio helpers.
- Integrated sound cues into:
  - Tab switching (`on-deck-app.tsx`)
  - Prompt actions (copy, complete, needs-edit, retry, delete) in `prompt-card.tsx`
  - Preferences interactions (`preferences-view.tsx`)
- Added permission-aware notifications toggle handling with user feedback messaging.

### Push Notifications
- Notifications toggle now has permission-gated behavior in Preferences.
- Unsupported browsers and denied permissions are surfaced to users with inline status messaging.
- Setting persists via the standard settings sync flow once granted.

---

## Known Gaps / Risks Entering v2.1.0

1. No automated release pipeline yet (lint/test/build gates on push/PR).
2. Limited explicit end-to-end regression coverage for auth + cloud sync + prompt lifecycle.
3. OAuth depends on environment credential correctness and callback URL alignment.
4. `v2.1.0` scope is not yet locked to a dated acceptance checklist.

---

## Next Steps — v2.1.0 (Execution Plan For Today)

### Must-Ship Scope (Locked for Today)

- Auth flow stability: `register`, `login`, `refresh`, `logout`, `logout-all`, `/auth/me`.
- Prompt lifecycle stability: create, update, status transitions, delete, reorder, post-restart persistence.
- Settings/cloud sync stability: theme/accent/notifications/sound/autosave persist and sync correctly.
- OAuth readiness: Google and GitHub login redirect/callback flow validated in local environment.
- Release quality gate: CI workflow added and passing before tag.

### Acceptance Criteria

- All smoke tests pass without manual DB repair steps.
- `/docs` reflects OnDeck branding and correct route surfaces.
- No non-intentional template/generic references in active app/docs/config.
- `v2.1.0` release notes section is present before tagging.

1. **Lock release scope and acceptance criteria**
   - Define must-ship items for `v2.1.0` and freeze non-critical additions.
   - Produce a checklist covering auth, prompts CRUD, sync, and settings persistence.

2. **Run and document full smoke test pass**
   - Verify: register/login/logout/logout-all, prompt CRUD/reorder/status transitions, settings sync, cloud sync reconnect.
   - Validate persistence after container restart (`make down && make dev`).
   - Record pass/fail notes directly in this doc under a test evidence section.

3. **Finalize OAuth readiness**
   - Confirm Google/GitHub credentials and callback URLs in `.env.development`.
   - Verify both providers end in authenticated app state with synced user context.

4. **Add minimum CI quality gate**
   - Add GitHub Actions workflow for frontend install/lint/build and backend dependency install/basic import or test command.
   - Require green CI before tagging `v2.1.0`.

5. **Publish release notes and version bumps**
   - Update docs + `frontend/package.json` version to `2.1.0` when checklist is green.
   - Add concise changelog section summarizing delta from `2.0.0` to `2.1.0`.

6. **Tag and cut release candidate**
   - Create `v2.1.0-rc` tag after CI + smoke tests.
   - Promote to `v2.1.0` only after final verification sign-off.

7. **Stale reference cleanup pass (one more repo-wide review)**
   - Re-scan for template placeholders, legacy naming, and outdated slug references in docs, frontend labels, API metadata, and scripts.
   - Confirm `/docs` title and metadata are OnDeck-branded.
   - Keep domain/deployment placeholders only where intentionally environment-specific.

## Stale Reference Sweep Status (2026-04-06)

- Completed across docs, backend config, frontend fallbacks, env examples, and operational scripts.
- `/docs` branding now resolves to `OnDeck API`.
- Remaining placeholders are intentionally environment-specific in production domain/nginx files.

## Smoke + Persistence Testing Evidence (2026-04-06)

Runtime target: `http://localhost:8000`

- PASS `register` (`POST /api/v1/auth/register`)
- PASS `login` (`POST /api/v1/auth/login`)
- PASS `auth_me` (`GET /api/v1/auth/me`)
- PASS `refresh` (`POST /api/v1/auth/refresh`)
- PASS `settings_get` (`GET /api/v1/settings/`)
- PASS `settings_post` (`POST /api/v1/settings/`)
- PASS `prompts_create` (`POST /api/v1/prompts/`)
- PASS `prompts_list` (`GET /api/v1/prompts/`)
- PASS `prompts_patch` (`PATCH /api/v1/prompts/{id}`)
- PASS `prompts_delete` (`DELETE /api/v1/prompts/{id}`)
- PASS `logout` (`POST /api/v1/auth/logout`)
- PASS `logout_all` (`POST /api/v1/auth/logout-all`)
- PASS `oauth_google_get` (`GET /api/v1/oauth/google`) returned redirect `307`
- PASS `oauth_github_get` (`GET /api/v1/oauth/github`) returned `400` (provider credentials not configured)

Notes:
- API docs branding check: `<title>OnDeck API - Swagger UI</title>` confirmed.
- Container restart persistence check: PASS using isolated compose project (`ondeckpersist`) on alternate host port `18000`.
- Persistence evidence: created prompt `persist-3426418835c8`, executed `down`/`up` restart (without volume deletion during verification), relogin/list confirmed `PERSISTENCE_FOUND=True`.

## CI Gate Status (2026-04-06)

- Added workflow: `.github/workflows/ci.yml`
- Jobs:
  - `Frontend Install and Build` (`npm ci`, `npm run build`)
  - `Backend Install and Import Check` (`pip install -r requirements-minimal.txt`, import check, compileall)

## v2.1.0 Release Notes Draft

### Added
- Push notification permission-aware settings behavior documented and validated.
- Global CI quality gate via GitHub Actions (`frontend lint/build`, backend install/import checks).

### Changed
- Standardized OnDeck branding/defaults across API metadata, frontend fallback labels, scripts, and env examples.
- Updated OAuth route references to `/api/v1/oauth/{provider}` across docs.

### Fixed
- Removed stale template/generic references that leaked into runtime/docs surfaces (including `/docs` metadata).
