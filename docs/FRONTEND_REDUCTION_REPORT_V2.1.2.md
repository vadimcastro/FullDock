# Frontend Reduction Report — v2.1.2

**Date:** 2026-04-06  
**Branch:** `preDeck`

## Outcome

`v2.1.2` cleanup is complete and the runtime surface is now OnDeck-only.

- Removed legacy feature surfaces (`/dashboard`, `/resume`, template wrappers/components).
- Removed duplicate root `src/` frontend tree.
- Kept only active frontend routes and imported component graph.
- Aligned backend to frontend-used APIs only.
- Added reset-password flow (request + confirm) across frontend/backend.

## Runtime Surface (Post-Cleanup)

- Active app routes:
  - `/`
  - `/reset-password`
  - `/_not-found`
- `frontend/src` JS/TS files: **34**
- Unreachable files from entrypoint graph: **0**

## Removed Surface Summary

- Legacy route files/components tied to dashboard/resume/protected-layout flows.
- Unused layout/action utility files (`navbar`, `footer`, profile/action menu artifacts, duplicate settings modal/toaster/tabs/mobile helpers).
- Duplicate root `src/` tree (73 JS/TS files).

## Backend Alignment

Frontend-consumed API groups retained:

- `/api/v1/auth/*`
- `/api/v1/oauth/*`
- `/api/v1/prompts/*`
- `/api/v1/settings/*`

Removed as unused by current frontend:

- metrics router/modules
- duplicate/orphan auth endpoint module under `api/v1/endpoints`
- unused shared deps module

## Validation

- Local backend compile check: pass
- Local frontend dependency install (`npm ci`): pass
- Local frontend production build (`npm run build`): pass (network permitting for font fetch)
- Reset-password flow validation: pass (request, confirm, old-password reject, new-password login)
- GitHub CI (`preDeck`) frontend + backend jobs: pass

## Notes

- Next.js may warn about multiple lockfiles (root + `frontend/`); currently non-blocking.
- Production domain placeholders remain intentionally environment-specific.
