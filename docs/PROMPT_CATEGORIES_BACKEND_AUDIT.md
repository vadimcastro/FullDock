# Prompt Categories Backend Audit & Remediation Plan (2026-04-07)

## Objective

Validate that prompt category/list updates in TypeScript are fully backed by persistent backend storage, migrations, and operational safety.

## Summary

- Frontend category behavior is implemented for `queued`, `on-deck`, `needs-edit`, `forked`, `complete`.
- Backend persists required fields for list/category rendering (`status`, `order`, `linked_prompt_id`, `title`).
- Migration execution is now split by DB state: tracked DBs run `alembic upgrade head`; untracked bootstrap DBs use `create_all` + `stamp head`.
- Validation tooling status mismatch (`completed` vs `complete`) is fixed in smoke tests.
- Repository migration tracking was fixed by removing Alembic revision ignore rules from `.gitignore`.

## Evidence Matrix

| Concern | Frontend | Backend | DB/Migration | Status |
|---|---|---|---|---|
| Prompt category enum | `frontend/src/lib/types.ts` | `backend/app/schemas/prompt.py` | DB check constraint in `0004_prompt_status_indexes` | Complete |
| Category list rendering | `frontend/src/components/model-view.tsx` | N/A | N/A | Complete |
| Category transitions | `frontend/src/hooks/use-prompts.ts` | `PATCH /api/v1/prompts/{id}` demotes competing `on-deck` | Not fully transactional across multi-step flows | Partial |
| Title persistence | `use-prompts` mapTo/from backend | `models/schemas prompt.py` | `0003` adds `prompts.title` | Complete if migration applied |
| Settings display controls | `use-settings.tsx` + preferences UI | `user_setting` model/schema | `0003` adds `font_scale`, `show_prompt_titles` | Complete if migration applied |
| Migration safety on upgrade | N/A | startup script | tracked DBs now run `alembic upgrade head` | Partial |
| CI status contract | Smoke script now writes `complete` | status typing and DB check constraint added | `0004` enforces valid status values | Complete |

## Gaps (Detailed)

1. Migration reliability (reduced, not eliminated):
   - Bootstrap databases still rely on `create_all` + `stamp head` due legacy migration baseline shape.
   - Existing Alembic-tracked DBs now correctly run `upgrade head`.

2. Status contract drift:
   - Fixed for current smoke regression path; keep contract checks in CI to prevent reintroduction.

3. Missing invariants (partially addressed):
   - Backend now demotes competing `on-deck` prompts on create/update.
   - Multi-step lifecycle transitions are still client-orchestrated and non-transactional.

4. Remaining schema constraints:
   - `linked_prompt_id` is not constrained as FK.

## Strategic Plan

### Phase 1: Immediate Safety

Status: Implemented in current patch set.

1. Update startup migration flow to run `alembic upgrade head`.
2. Replace smoke test `completed` with `complete`.
3. Merge typed status schema (`Literal`) to reject invalid statuses at API boundary.

### Phase 2: Data Integrity

Status: Partially implemented in current patch set.

1. Add DB-level status constraint (`CHECK` or enum) via Alembic migration.
2. Add index set for prompt list/query patterns:
   - `prompts(user_id)`
   - `prompts(user_id, model_id, order)`
   - `prompts(user_id, model_id, status)`
3. Add optional FK for `linked_prompt_id` if cross-user semantics are constrained.

### Phase 3: List Management Hardening

Status: Partially implemented.

1. Add transactional endpoint for category transitions (promote/demote atomically).
2. Enforce single `on-deck` invariant server-side.
   - Current patch demotes competing `on-deck` on create/update when target status is `on-deck`.

### Phase 4: Validation + Docs

1. Extend smoke/persistence coverage for `forked`, `title`, invalid-status rejection.
2. Add migration verification checks in CI and deployment runbooks.
3. Keep canonical status values documented in README + setup + knowledge base.

## Success Criteria

- No schema drift between model definitions and live DB after upgrade.
- Status values are canonical and validated across API, DB, and tests.
- Backend can deterministically manage category/list invariants without relying only on frontend sequencing.
