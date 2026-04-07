# OnDeck 2.1.5 — Knowledge Base

## Purpose

This document is the concise technical reference for current architecture, data flow, migrations, and release behavior.

## Current State (2026-04-07)

`v2.1.5` is release-ready.

Implemented highlights:
- Prompt status contract normalized to: `queued`, `on-deck`, `needs-edit`, `forked`, `complete`
- Atomic transition endpoint: `POST /api/v1/prompts/{id}/transition`
- Queue promotion rules for `needs-edit` and `complete`
- Settings platform expanded for:
  - model tab ordering/visibility/titles
  - prompt category ordering/visibility
- Settings UI supports collapsible sections and drag ordering
- Model tabs support dynamic custom entries and family-logo inheritance
- Cloud sync UI reflects real sync status (`offline|syncing|synced|error`)

## Migration and Schema Notes

Current head:
- `0006_model_tab_titles`

Prompt table hardening:
- Check constraint: `ck_prompts_status_valid`
- Query indexes:
  - `ix_prompts_user_id`
  - `ix_prompts_user_model_order`
  - `ix_prompts_user_model_status`

User settings columns used by frontend layout system:
- `model_tab_order`
- `enabled_model_tabs`
- `model_tab_titles`
- `prompt_category_order`
- `enabled_prompt_categories`

Migration strategy:
- Fresh/tracked DBs: `alembic upgrade head`
- Legacy untracked DBs: infer nearest baseline -> `alembic stamp <revision>` -> `alembic upgrade head`
- Settings migrations (`0005`, `0006`) are idempotent for partial states

## Runtime Components

Frontend key files:
- `frontend/src/components/on-deck-app.tsx`
- `frontend/src/components/model-tabs.tsx`
- `frontend/src/components/model-view.tsx`
- `frontend/src/components/prompt-card.tsx`
- `frontend/src/components/preferences-view.tsx`
- `frontend/src/hooks/use-prompts.ts`
- `frontend/src/hooks/use-settings.tsx`

Backend key files:
- `backend/app/api/v1/endpoints/prompts.py`
- `backend/app/crud/crud_prompt.py`
- `backend/app/api/v1/endpoints/settings.py`
- `backend/app/crud/crud_user_setting.py`
- `backend/app/models/user_setting.py`

## Validation Coverage

CI workflow includes:
- Frontend install/build
- Backend install/import/compile
- Backend smoke regression
- Backend persistence restart verification
- Schema verifier script execution (`scripts/verify_prompt_schema.py`)

## Known Gaps

Roadmap and open follow-ups are intentionally centralized in [docs/NEXT_STEPS.md](NEXT_STEPS.md) to avoid drift between docs.
