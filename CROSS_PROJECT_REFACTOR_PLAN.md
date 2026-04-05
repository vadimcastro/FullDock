# Cross-Project Refactor Plan

Last updated: 2026-04-05

## Objective
Make `vadim-project-template` (VPT) standalone, generic, and simple enough for non-technical users, then migrate `OnDeck` into this infrastructure with minimal cognitive load.

## Scope
- In scope: `vadim-project-template`, generated VPT projects (for example `ondeck`), and selective extraction from `vadimOS`.
- Out of scope: full `vadimOS` redesign, production infra migration in the same pass.

## Guiding Constraints
- No runtime dependency on sibling repositories.
- One-command local start for users: `make dev`.
- Linux and macOS compatibility for scripts.
- Keep defaults safe and obvious; hide advanced operations from default workflow.

## Status Snapshot

### Completed
- [x] VPT runtime decoupled from sibling-repo `.mk` dependencies.
- [x] Local Docker flows stabilized (`make dev`, `make dev-build`, `make dev-ultra`, `make down`).
- [x] Auth command surface simplified to `make auth`.
- [x] Template env placeholders aligned with guided `newpro` values.
- [x] Shared base-image reuse pattern implemented via `PROJECT_SLUG`.
- [x] Major brand-specific references removed from primary onboarding docs.
- [x] Auth/security hardening implemented (see `AUTH_PROD_HARDENING_PLAN.md`).
- [x] Generated project (`ondeck`) validated as working with VPT-style infra patterns.

### In Progress / Remaining
- [ ] Consolidate `init-project.sh` and `init-project-fast.sh` to one canonical initializer.
- [ ] Continue removing legacy personal references from secondary docs/files (`CLAUDE.md`, backups, legacy notes).
- [ ] Separate beginner vs advanced Make targets more cleanly in help output.
- [ ] Add `make doctor` for preflight checks (Docker, ports, env file presence).
- [ ] Add a short “first run expected output” onboarding section for non-technical users.

## Practical Next Order
1. Consolidate initializer scripts.
2. Add `make doctor` and beginner-first Make help grouping.
3. Final doc pass for non-technical onboarding clarity.
4. Regenerate a fresh sample project and verify zero manual edits required.
