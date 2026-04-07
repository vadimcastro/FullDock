# OnDeck Knowledge Base

## Purpose

Concise technical reference for architecture, schema state, queue semantics, settings behavior, and release validation.

## Current State (2026-04-07)

- `v2.1.5` released
- `v2.1.6` released
- `v2.1.7` queued for automation/observability improvements

## v2.1.6 Delivered

Backend/data layer:
- Linked prompt integrity migration `0007_prompt_linked_integrity`
- Constraints/indexes:
  - `ck_prompts_linked_prompt_not_self`
  - `fk_prompts_linked_prompt_owner`
  - `uq_prompts_id_user_id`
  - `ix_prompts_user_linked_prompt_id`
- Transactional layout endpoints:
  - `POST /api/v1/settings/layout/model-tabs`
  - `POST /api/v1/settings/layout/prompt-categories`
  - `POST /api/v1/settings/layout/model-tab-title`
- Server-side layout payload validation + normalized error codes
- Write-rate limiting on prompt/settings mutation endpoints
- OAuth callback state-cookie validation
- Request ID propagation via `X-Request-ID` + structured backend error payloads

Frontend state layer:
- Local draft state isolation for settings reorder/edit flows
- Commit-on-drop reorder behavior
- Commit-on-blur title updates
- Debounced settings sync writes
- Sync diagnostics shown in UI (code/message/request-id)

## Migration and Schema Notes

Current Alembic head:
- `0007_prompt_linked_integrity`

Prompt table hardening includes:
- `ck_prompts_status_valid`
- `ck_prompts_linked_prompt_not_self`
- `fk_prompts_linked_prompt_owner`
- `uq_prompts_id_user_id`
- `ix_prompts_user_id`
- `ix_prompts_user_model_order`
- `ix_prompts_user_model_status`
- `ix_prompts_user_linked_prompt_id`

Migration strategy:
- Fresh/tracked DBs: `alembic upgrade head`
- Legacy untracked DBs: infer nearest baseline -> `alembic stamp <revision>` -> `alembic upgrade head`

## Key Runtime Files

Frontend:
- `frontend/src/components/preferences-view.tsx`
- `frontend/src/components/cloud-sync.tsx`
- `frontend/src/hooks/use-settings.tsx`
- `frontend/src/lib/api/protected.ts`

Backend:
- `backend/app/main.py`
- `backend/app/api/v1/endpoints/prompts.py`
- `backend/app/api/v1/endpoints/settings.py`
- `backend/app/api/v1/oauth.py`
- `backend/app/core/write_protection.py`
- `backend/app/core/api_errors.py`
- `backend/app/crud/crud_prompt.py`
- `backend/app/crud/crud_user_setting.py`

## Validation Coverage

Release checks:
- Frontend typecheck (`npx tsc --noEmit`)
- Backend compile/import (`python3 -m compileall ...`)
- Migration to head (`make migrate`)
- Backend smoke regression (`scripts/ci_backend_smoke.py`)
- Optional persistence verification (`scripts/ci_backend_persistence.py`)
- Schema verifier (`scripts/verify_prompt_schema.py`)

## Source of Truth for Upcoming Work

All `v2.1.7` follow-ups are centralized in [docs/NEXT_STEPS.md](NEXT_STEPS.md).
