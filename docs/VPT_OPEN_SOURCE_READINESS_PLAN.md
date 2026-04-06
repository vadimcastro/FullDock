# VPT Open Source Readiness Plan

Last updated: 2026-04-05
Scope: current state of `vadim-project-template` and the remaining work required before wider open-source use and OnDeck integration

## Purpose

This document replaces:
- `AUTH_PROD_HARDENING_PLAN.md`
- `VPT_BLOAT_REDUNDANCY_AUDIT.md`
- `CROSS_PROJECT_REFACTOR_PLAN.md`

Those earlier docs were useful during implementation, but they had started to drift from the actual codebase. This file is now the single source of truth for VPT readiness and follow-up work.

## Current Assessment

VPT is already in good shape as a reusable Docker-first full-stack template.

Strong areas today:
- standalone repo with no runtime dependency on sibling projects
- consistent local workflow centered on `make dev`, `make auth`, and `make newpro`
- generated projects inherit shared base-image reuse via `PROJECT_SLUG`
- production config validation and auth hardening are implemented
- Docker hygiene tooling exists: `make doctor`, `make disk-usage`, `make prune-safe`, `make cleanup-legacy-images`
- `init-project.sh` now acts only as a backward-compatible shim to the canonical fast initializer

Main remaining work:
- keep onboarding docs tightly aligned with the actual command surface
- remove stale/internal references from secondary docs and generated artifacts
- make beginner vs advanced workflow clearer
- validate a clean generated project as the public reference example

## Completed Work

### Runtime and Repo Decoupling
- [x] VPT operates as a standalone repo
- [x] no active runtime dependency on sibling-repo `.mk` files
- [x] generated projects are self-contained after `make newpro`

### Development Workflow
- [x] `make dev`, `make dev-build`, `make dev-ultra`, and `make down` are present and wired
- [x] `make auth` is the single local auth setup command
- [x] shared base-image reuse is implemented through `PROJECT_SLUG`
- [x] Docker preflight and hygiene commands exist and are usable

### Initializer State
- [x] `init-project-fast.sh` is the canonical initializer
- [x] `init-project.sh` is reduced to a compatibility wrapper, so functional consolidation is complete

### Auth and Production Hardening
- [x] production startup fails fast on weak or missing secrets
- [x] production startup fails on unsafe CORS configuration
- [x] login throttling is implemented
- [x] refresh token rotation is implemented
- [x] refresh-session revocation is implemented
- [x] `logout` and `logout-all` are implemented
- [x] auth event logging exists
- [x] HTTPS-aware cookie behavior is supported in the frontend auth layer

### Storage and Docker Hygiene
- [x] repo footprint is small
- [x] image and build-cache cleanup tooling exists
- [x] steady-state storage cost is mostly explained by persistent Docker volumes rather than source bloat

## Remaining Work

### Priority 1: Public-Facing Documentation
- [x] keep `README.md` and `SETUP_GUIDE.md` as the primary source for new users
- [x] add a short "first run expectations" section showing what users should see after `make dev` and `make auth`
- [x] keep all commands generic and copy-pasteable for external users
- [ ] continue removing personal/internal references from secondary docs such as `CLAUDE.md`

### Priority 2: Open-Source Readiness Validation
- [ ] generate a fresh sample project from the current template and verify the docs literally
- [ ] confirm that no manual edits are required after project creation
- [ ] confirm the generated project does not retain template-only planning artifacts

### Priority 3: UX and Complexity Cleanup
- [x] regroup `make help` output into beginner vs advanced sections
- [ ] review whether all current compose variants still earn their maintenance cost
- [ ] consider a slimmer frontend production output path if image size becomes a real issue

### Priority 4: Confidence and Testing
- [ ] add automated auth integration coverage for throttling, refresh rotation, and revoke flows
- [ ] add a short auth log-triage snippet to docs for operators

## What Was Removed From the Old Docs

These items were removed as active plan work because they are already implemented:
- `make doctor`
- shared base-image reuse via `PROJECT_SLUG`
- auth production hardening phases
- initializer consolidation as a behavioral concern
- standalone repo/runtime decoupling

These items were removed as separate documents because they are now better treated as ongoing maintenance guidance:
- Docker disk hygiene observations
- historical audit commentary about earlier legacy image cleanup

## Operating Baseline

Recommended local maintenance loop:
- before first run on a new machine: `make doctor`
- day-to-day development: `make dev`
- first-time local auth setup: `make auth`
- periodic disk inspection: `make disk-usage`
- periodic cleanup: `make prune-safe`
- after major image/tag migrations: `make cleanup-legacy-images`

## First Run Expectations

After cloning the template, creating `.env.development`, and running `make dev`, the team should observe:
- Docker Compose printing `Creating ...` for `postgres`, `redis`, `api`, and `frontend` containers, followed by `Starting ... done`.
- The frontend logs ending with `next dev -H 0.0.0.0 -p 3000` and eventual `ready - started server`.
- The backend logs showing FastAPI startup lines and `✅ All services started successfully` (from `docker-compose` healthchecks).

After `make auth`, expect:
- the admin user reported in the output with email/username matching `.env.development`.
- `Logged in as <email>` or equivalent confirmation before the command exits.
- A `make auth` run that completes without asking for additional prompts, confirming the templates behave as documented.

## Decision Rules

Use these rules to keep VPT healthy as it approaches open-source release:

### Add to VPT only if it is
- reusable across multiple projects
- understandable from docs alone
- safe by default
- cheaper to maintain in the template than in downstream projects

### Keep out of VPT if it is
- product-specific
- personal-site-specific
- deployment-provider-specific without a strong default story
- hard to explain to first-time users

## Relationship to OnDeck

VPT should remain the canonical home for:
- infra conventions
- auth/session hardening
- setup commands
- generated project scaffolding
- public onboarding docs

OnDeck should consume those capabilities rather than redefining them locally.

See `docs/ONDECK_INTEGRATION_REVIEW.md` for the project-by-project integration plan.

## Exit Criteria

VPT is ready for broader open-source exposure when:
- primary docs are current and minimal
- a fresh generated project works from documented commands
- no critical internal assumptions remain in onboarding
- remaining TODOs are clearly optional improvements rather than release blockers
