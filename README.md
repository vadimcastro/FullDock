# OnDeck 2.1.5

High-fidelity AI prompt queue management across models.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · FastAPI · PostgreSQL · Redis · Docker

## Release Status

`v2.1.5` is release-ready (April 7, 2026).

This release finalizes:
- Prompt workflow hardening (`queued`, `on-deck`, `needs-edit`, `forked`, `complete`)
- Atomic status transitions (`POST /api/v1/prompts/{id}/transition`)
- Queue correctness rules (demote conflicting `on-deck`, promote next queued/forked)
- Settings UX overhaul (collapsible sections, drag ordering, model tab add/remove/toggle/rename)
- Dynamic model tab behavior (family logo inheritance + custom titles)
- Migration robustness for legacy/partial schemas
- Cloud sync status UI alignment (`offline|syncing|synced|error`)

## Quick Start

```bash
git clone <repo-url> && cd OnDeck
cp .env.example .env.development
make doctor
make dev-build
```

Services:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Core Commands

```bash
make dev
make dev-build
make down
make clean-all
make logs
make logs-frontend
make logs-api
```

```bash
make migrate
make migrate-create name=add_x
make shell-api
make shell-db
make doctor
```

## Validation Snapshot (v2.1.5)

- CI coverage includes frontend build, backend import/compile, backend smoke, persistence restart checks.
- Local release checks include:
  - `npx tsc --noEmit`
  - `python3 -m compileall backend/app`
  - `make migrate`

## Docs

- Setup: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)
- Technical reference: [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md)
- Future planning: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

## Security

Implemented:
- JWT access + refresh token rotation
- Login throttling
- Session revocation (`logout`, `logout-all`)
- Auth event logging
- Production fail-fast env checks for weak secrets

Outstanding security hardening ideas are tracked in [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).

## License

MIT
