# OnDeck Integration Review

Last updated: 2026-04-05  
Scope: compare your brother’s `OnDeck` repo (`/home/westen/Desktop/OnDeck`) with the VPT-generated demo `ondeck` (`/home/westen/Desktop/ondeck`) so that the demo accurately absorbs the product features and no longer relies on the wrong repo.

## Key Projects

- **OnDeck (capital O)** – the existing product in `/home/westen/Desktop/OnDeck`, built with Next.js 16, a custom component library, and a lightweight Supabase helper library. It is UI-first: prompt queue management, model tabs, preferences, and a mocked cloud sync surface are implemented purely in the frontend.
- **ondeck (lowercase)** – the VPT-generated demo workspace created by `make newpro`. It already includes the full stack (Next.js + FastAPI + Postgres + Redis), auth hardening, Docker tooling, and the shared `PROJECT_SLUG` infrastructure that will be the canonical baseline for anything that ships from VPT.

## Integration Intent

- End goal: keep the OnDeck frontend exactly as it feels now but replace its persistence/auth layer with VPT’s backend infra, auth, and OAuth surface.
- That means migrating OnDeck’s custom components onto a Next.js 14 or upgraded Next.js 16 VPT shell while wiring them to the new prompt/settings schemas and backend endpoints instead of localStorage/Supabase mocks.
- Frontend dependencies (Next.js, React, Tailwind, Radix, etc.) therefore must be updated or aligned so the OnDeck UI compiles cleanly inside the template demo.

## Stack Comparison

| Surface | OnDeck (product) | ondeck (template/demo) |
| --- | --- | --- |
| Frontend framework | Next.js 16 + React 19 + Tailwind v4 + Radix UI + custom theme provider (`components/theme-provider.tsx`) | Next.js 14 + React 18 + Tailwind 3 + template UI components |
| Backend | none yet (mock sync/local storage) | FastAPI + SQLAlchemy + Redis + auth endpoints |
| Persistence | `hooks/use-prompts.ts` ➜ `localStorage`, `hooks/use-settings.tsx` ➜ local storage + accent color CSS vars | Postgres for users/metrics, Redis for sessions, Alembic migrations, Docker Compose |
| Auth/sync | Mocked auth modal (`components/cloud-sync.tsx`), settings scoped to `SettingsProvider`, Supabase helpers under `lib/supabase` for future extension | JWT + refresh token auth (`backend/app/api/v1/auth.py`), `make auth`, hardened production config, login throttling |
| Deployment | Vercel-style Next.js app controlled via `package.json` | Docker Compose with dedicated prod/dev files, shared base images, `make` commands |

## Product Feature Snapshot (`OnDeck`)

1. **On Deck Prompt Queue** – `components/on-deck-app.tsx` wires together:
   - `ModelTabs` + `SwipeContainer` for horizontal navigation across AI models (`components/model-tabs.tsx`, `components/model-view.tsx`).
   - Prompt CRUD and ordering hooks from `hooks/use-prompts.ts`, which implements `addPrompt`, `updateStatus`, `deletePrompt`, and even promotes queued prompts automatically.
   - A `PreferencesView` panel (`components/preferences-view.tsx`) that lets users configure accent colors and shuffle settings stored via the `SettingsProvider`.
2. **Cloud Sync Surface** – `components/cloud-sync.tsx` shows connection state, a mock auth dialog, and exposes a `triggerSync` button tied to `hooks/use-settings.tsx`. The hook currently fakes Supabase-backed sync state but the UI is anchored for real sync later.
3. **Settings + Theme** – `hooks/use-settings.tsx` manages theme, accent colors, and a `SettingsContext` with `triggerSync`, `signIn`, `signOut`. Accent color changes update CSS variables for `--primary` etc., and the UI uses `SettingsProvider` before rendering `Analytics`.
4. **Supabase Helpers** – `lib/supabase/{client,server,middleware}.ts` are ready for real auth/session flow and could be wired to the future backend when the product moves beyond local storage.

## Template Baseline (`ondeck`)

- Full FastAPI backend with hardened auth, login throttling, refresh-rotation, `logout` + `logout-all`, production validation, and metrics endpoints (see `backend/app/api/v1/auth.py` and `backend/app/main.py`).
- Template UI follows the Next.js App Router with `frontend/src/app` pages, dashboard components, and shared layout + providers.
- Compose/Docker commands in `Makefile` ensure `make dev`, `make auth`, `make doctor`, etc., work out of the box; shared base image logic via `PROJECT_SLUG` is in `Makefile` and `docker/docker-compose.dev.ultra.yml`.
- Generated project `ondeck` already matches the README/SETUP instructions and can be used as the canonical sample for open-source consumption.

## Integration Gaps

1. **No backend for OnDeck prompts** – VPT already has a Postgres + API stack. The integration path is to:
   - add a `prompts` table (or JSONB store) plus CRUD APIs in `backend/app/api/v1` (maybe under a new router like `/api/v1/prompts`).
   - replicate OnDeck’s `usePrompts` behavior against those APIs instead of `localStorage`.
   - preserve the auto-promotion logic and statuses (`on-deck`, `queued`, `complete`).
2. **Settings + sync** – OnDeck’s `SettingsProvider` currently writes to localStorage and mocks Supabase. VPT can expose new endpoints:
   - `GET/POST /api/v1/settings` for theme/accent preferences stored per user.
   - `POST /api/v1/sync` to trigger backend-side persistence, optionally backed by Redis or Supabase.
   - Replace `signIn`/`signOut` mocks with actual auth flows already in VPT’s `/auth` endpoints.
3. **Supabase helpers vs FastAPI** – OnDeck’s `lib/supabase` is unused. Decide whether to keep Supabase as part of the MVP (maybe to store prompts) or remove it entirely in favor of FastAPI + Postgres. Current VPT infrastructure is ready for Postgres; replicating Supabase would duplicate work unless there is a clear requirement.
4. **UI + Next.js version mismatch** – OnDeck targets Next.js 16/React 19; VPT is on Next.js 14/React 18. Either upgrade VPT’s frontend to match OnDeck (a bigger lift) or port OnDeck components into the current Next.js 14 layout with minimal rewrite. The UI uses Tailwind v4 utilities (`components/ui`). Some config may need backporting.

## Proposed Integration Steps

1. **Feature mapping**
   - Document OnDeck UI flows (`components/on-deck-app.tsx` etc.) and mark which parts are reusable in VPT vs product-specific.
   - Inventory data shapes from `hooks/use-prompts.ts` and `lib/types.ts` to define API contracts.
2. **Backend wiring**
   - Create `backend/app/api/v1/prompts.py` with endpoints mirroring `usePrompts` operations: list by model, add, update status, reorder, delete.
   - Store prompts in Postgres (accessible models via `backend/app/models/`) and persist order + status.
3. **Frontend adaptation**
   - Update `frontend/src/lib/api/protected.ts` (or add a new client) to call `/api/v1/prompts`.
   - Replace `localStorage` usage with API calls plus fallback for offline (optionally keep local cache).
   - Connect `SettingsProvider` to the new `/settings` endpoints and drop the Supabase mock.
4. **Sync surface**
   - Redesign `components/cloud-sync.tsx` to show real sync state from the backend (use VPT admin logs like `auth_event` for user actions).
   - Decide whether to keep Supabase middleware (maybe to manage Next middleware for session refresh) or remove it in favor of FastAPI session tokens.
5. **Docs & onboarding**
   - Update `docs/OPEN_SOURCE_READINESS.md` to mention OnDeck feature integration and the requirement to keep OnDeck's multi-model queue baked into the template example.
   - Document new API contracts and expected responses so future `make newpro` projects can adopt the same UI.

## OAuth & Social Login Workplan

We want the OnDeck frontend experience to keep the OAuth/social login strengths Supabase offered (provider redirects, auto user upserts, refresh-token handling, sync state), but without shipping Supabase itself. Instead, reimplement those capabilities directly in VPT’s backend, store the same metadata with Postgres/Redis, and align the frontend to the new endpoints.

Steps:
1. Define the OAuth provider configuration (`client_id`, `client_secret`, redirect URLs) in `.env.development` / `.env.production.local`. Support at least Google and GitHub to match Supabase’s social login coverage.
2. Add FastAPI endpoints under `/api/v1/auth/oauth/:provider` (e.g., `/api/v1/auth/oauth/google`) that:
   - Redirect users to the provider’s consent screen.
   - Handle the callback, exchange the code for tokens, and upsert the user in Postgres.
   - Issue the same JWT/refresh token pair used by the rest of VPT so the frontend can treat social and email/password logins the same.
3. Persist OAuth metadata in Postgres/Redis:
   - Save the provider name, provider user ID, email, and refresh token expiry so you can refresh tokens or revoke access as needed.
   - Tie the data to the `user` table so logout-all and revoke flows still work.
4. Replace the Supabase helpers (`lib/supabase`) with a small wrapper that calls the new OAuth endpoints; once everything works, remove unused Supabase artifacts.
5. Update `components/cloud-sync.tsx` + `hooks/use-settings.tsx` to show real provider-based auth buttons and to consume VPT’s `/auth` endpoints, including login, logout, and refresh flows.

## Immediate Next Moves

- Choose: port OnDeck UI into the existing Next.js 14 frontend or upgrade the template’s Next.js version (the former is faster).
- Draft prompt API schema and wire it to a new FastAPI router (call it `PromptsRouter`) before reimplementing the `usePrompts` hook.
- Align `SettingsProvider` with VPT’s auth backend instead of the Supabase stub; retire unused `lib/supabase` files if they do not serve a purpose.
- After the backend hooks are in place, regenerate `ondeck` via `make newpro` and swap in the new prompt UI so the demo matches the OnDeck experience.
