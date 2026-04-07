# OnDeck Integration Review

**Last updated:** 2026-04-06  
**Current release baseline:** `v2.0.0` (integrated)  
**Checkpoint status:** `v2.1.2` (OnDeck-only cleanup + reset-password implemented)

---

## Review Scope (Completed)

This review reconciles:

- Docs: `README.md`, `docs/SETUP_GUIDE.md`, `docs/KNOWLEDGE_BASE.md`, this file
- Recent commits on `preDeck`:
  - `575e693` - CI action runtime upgrades (removes Node 20 deprecation warnings)
  - `b804ee5` - remove legacy dashboard surface and align docs
  - `537dce2` - fix CI lock mismatch and frontend build dependency
  - `ee09396` - `v2.1.1` smoke+persistence docs + CI checkpoint
  - `516dcbe` - stale-reference cleanup + push-notification documentation
- Current working tree cleanup for `v2.1.2`:
  - removed legacy resume/protected/template surfaces
  - removed duplicate root `src/` tree
  - reduced backend modules to frontend-used API surface
  - implemented password reset request/confirm flow

---

## Goal Status

| Goal | Status | Notes |
|---|---|---|
| Port original OnDeck UX to standalone stack | ✅ Complete | Next.js 16 frontend running against FastAPI backend |
| Replace local-only persistence with backend sync | ✅ Complete | Prompts/settings sync via `use-prompts` + `use-settings` |
| Auth hardening and session control | ✅ Complete | JWT access/refresh rotation, throttling, revocation |
| OAuth provider login | ✅ Complete (config-gated) | Routes and frontend wiring are in place |
| OnDeck-only surface cleanup | ✅ Complete (`v2.1.2`) | Dashboard/resume/template duplicates removed |
| Reset-password capability | ✅ Complete (`v2.1.2`) | `/reset-password` + backend request/confirm endpoints |
| CI quality gate on branch pushes | ✅ Complete | Frontend build + backend import/compile checks passing |

---

## Latest Development Update (v2.1.2)

- Removed legacy dashboard and resume route/component surfaces.
- Removed duplicate root `src/` frontend tree and unreachable template artifacts.
- Removed unused backend modules/routers not consumed by current frontend (`metrics`, orphan endpoint modules).
- Implemented reset-password flow end-to-end:
  - `POST /api/v1/auth/reset-password-request`
  - `POST /api/v1/auth/reset-password-confirm`
  - frontend `/reset-password` request + token-confirm modes
- Updated CI actions to current runtime-compatible versions.

---

## Residual Risks / Watchlist

1. Root and `frontend/` lockfiles both exist; warning is non-blocking but should be rationalized.
2. Offline/restricted environments can fail `next build` when fetching Google fonts.
3. OAuth success still depends on valid provider credentials and callback configuration.
4. Continue periodic stale-reference sweep as OnDeck naming finalizes (including any remaining FullDock-era mentions).

---

## Next Steps — v2.1.3 Execution Plan

1. **Finalize OnDeck naming sweep (repo-wide)**
   - Re-scan docs, scripts, env examples, and UI text for stale template/FullDock references.
   - Keep only intentional deployment placeholders.

2. **Route and component hard-prune validation**
   - Re-run import graph check to confirm zero unreachable runtime files in `frontend/src`.
   - Remove any newly discovered non-imported UI helper remnants.

3. **Auth regression pack (including reset-password)**
   - Re-run `register/login/refresh/logout/logout-all/me`.
   - Re-run reset-password request/confirm and verify old password rejection/new password success.

4. **Persistence and sync regression pass**
   - Validate prompts/settings persistence across `down`/`up` restart.
   - Verify cloud sync/auth state remains consistent after relogin and token refresh.

5. **CI hardening follow-up**
   - Keep `preDeck` green with current workflow.
   - Add lightweight smoke script execution in CI when stable.

6. **Release prep checkpoint**
   - Publish `v2.1.3` notes with cleanup deltas and validation evidence.
   - Tag only after CI + smoke+persistence+reset-password checks are all green.

---

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
- Container restart persistence check: PASS using isolated compose project (`ondeckpersist`) on host port `18000`.
- Persistence evidence: created prompt, executed `down`/`up` restart (without volume deletion), relogin/list confirmed persistence.

---

## Password Reset Validation Evidence (2026-04-06)

- PASS `reset_request` (`POST /api/v1/auth/reset-password-request`)
- PASS `reset_confirm` (`POST /api/v1/auth/reset-password-confirm`)
- PASS old password rejected after reset
- PASS new password login succeeds

---

## CI Gate Status (2026-04-06)

- Workflow: `.github/workflows/ci.yml`
- Jobs:
  - `Frontend Install and Build` (`npm ci`, `npm run build`)
  - `Backend Install and Import Check` (`pip install`, import check, compileall)
- Current branch outcome: passing after lockfile/action updates.
