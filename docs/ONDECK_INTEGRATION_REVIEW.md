# OnDeck Integration Review

**Last updated:** 2026-04-06  
**Status:** ✅ Integration complete — Docker optimized

---

## What This Is

OnDeck 2.0.0 is the original OnDeck prompt queue product (formerly localStorage + Supabase) ported into a production-grade standalone application on FullDock infrastructure.

- **Original OnDeck** (`/home/westen/Desktop/OnDeck`) — UI-first, localStorage persistence, mocked cloud sync, Supabase helpers
- **OnDeck 2.0.0** (`/home/westen/Desktop/FullDock`) — same UI, replaced with FastAPI + PostgreSQL + Redis backend, JWT auth, Docker

---

## Integration Completed ✅

### Backend
- `prompts` table with SQLAlchemy model + Alembic migration
- `user_settings` table for per-user theme/accent persistence
- `/api/v1/prompts` — full CRUD (list, add, update status, reorder, delete)
- `/api/v1/settings` — GET/POST user preferences
- JWT auth with refresh rotation, login throttling, session revocation
- OAuth endpoints for Google and GitHub

### Frontend
- Upgraded to **Next.js 16.1.6**, **React 19.2.4**, **Tailwind CSS v4**
- Full OKLCH design token system (light + dark, model-specific accents)
- Ported all OnDeck components:
  - `on-deck-app.tsx`, `model-tabs.tsx`, `model-view.tsx`, `prompt-card.tsx`
  - `preferences-view.tsx`, `settings-modal.tsx`, `cloud-sync.tsx`
  - `swipe-container.tsx`, `theme-provider.tsx`
- Ported all 13 Shadcn UI primitives with Radix UI:
  - `badge`, `button`, `card`, `dialog`, `input`, `label`, `popover`
  - `radio-group`, `scroll-area`, `separator`, `switch`, `tabs`, `textarea`
- `use-prompts.ts` — backend-synced (replaces localStorage)
- `use-settings.tsx` — backend-synced (replaces localStorage)
- `use-mobile.ts` — responsive breakpoint hook

### Docker (Optimized 2026-04-06)
- Removed 5 redundant compose files (`dev.fast.yml`, `dev.ultra.yml`, `https.yml`, etc.)
- Removed base image infrastructure (`build-base-images.sh`, `Dockerfile.frontend.base`, `docker-compose.dev.ultra.yml`)
- **Single compose:** `docker/docker-compose.dev.yml`
- **Two-stage `Dockerfile.dev`:** deps baked into image layer (no node_modules volume)
- **Three-stage `Dockerfile.prod`:** minimal standalone runner
- Simplified Makefile: 5 dev targets → `dev` + `dev-build`

### package.json
All 25 Radix UI primitives + supporting packages now declared:
`class-variance-authority`, `cmdk`, `sonner`, `vaul`, `zod`, `react-hook-form`,
`@hookform/resolvers`, `embla-carousel-react`, `react-resizable-panels`,
`react-day-picker`, `date-fns`, `input-otp`, `recharts`, `tw-animate-css`

---

## Stack Comparison (Before → After)

| Surface | OnDeck (original) | OnDeck 2.0.0 |
|---|---|---|
| Persistence | `localStorage` | PostgreSQL via FastAPI |
| Auth | Mocked / Supabase | JWT + OAuth (FastAPI) |
| Sync | Fake `triggerSync` | Real backend API |
| Next.js | 16 | 16.1.6 |
| React | 19 | 19.2.4 |
| Tailwind | v4 | v4 (OKLCH tokens) |
| Docker | None | Multi-stage, single compose |
| Deployment | Vercel | Docker / self-hosted |

---

## Remaining Work 🔜

1. **Smoke Testing** — verify full prompt CRUD flow after container restart; confirm data persists in Postgres
2. **Cloud Sync UI** — wire `cloud-sync.tsx` to show real backend sync state instead of mocked indicator
3. **OAuth Credentials** — populate `GOOGLE_CLIENT_ID`/`GITHUB_CLIENT_ID` in `.env.development` to enable social login
4. **Hydration Audit** — check for React 19 SSR/hydration mismatches in Radix components
5. **CI/CD** — add GitHub Actions workflow for automated build + test on push
