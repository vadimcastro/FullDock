# VPT Bloat and Redundancy Audit

Last updated: 2026-04-05  
Scope: `vadim-project-template` runtime/storage complexity

## Executive Summary
`vadim-project-template` source repo is lightweight, and Docker artifact bloat has been substantially reduced.  
Biggest remaining cost is inactive local volumes (mostly per-project dependency/data volumes), not source files or image/cache drift.

## Current Measured Footprint

### Source Repository (small)
- Repo size on disk: `1.5M`
- File count: `158`

### Local Docker Footprint (post-cleanup)
From `docker system df`:
- Images: `0B`
- Build cache: `0B`
- Containers: `0B`
- Local volumes: `992.1MB` (`100%` reclaimable currently)

## Redundancy Findings

### 1) Frontend dependency duplication per project
Each project keeps its own `node_modules` volume; expected but expensive for multiple repos.

Impact:
- Largest steady-state storage driver across many projects.

### 2) Volume lifecycle hygiene depends on operator habits
Volumes persist by design and survive normal container churn.

Impact:
- Disk can still grow quietly over time unless `make disk-usage` and pruning are used periodically.

### 3) Template complexity (code/docs/scripts) is moderate, not extreme
- `Makefile` is reasonable (~110 lines).
- Main complexity debt is documentation/planning sprawl, not runtime architecture.

## Efficiency Score (0–100)
**89 / 100**

### Why not higher
- Per-project volumes (especially frontend dependencies) still add up in multi-repo workflows.
- Some complexity remains in dev-mode variants and supporting documentation.

### Why not lower
- Source repo is compact.
- Core commands are streamlined (`make dev`, `make auth`, `make newpro`).
- New maintenance commands now make storage management explicit and repeatable.
- Legacy image/cache bloat has been actively cleaned to zero.

## Recommended Improvements (Priority Order)

### High Impact, Low Risk
1. Keep one shared base-image namespace (`PROJECT_SLUG=vpt-core`) for all template-derived apps by default.
2. Use a lightweight recurring hygiene loop: `make doctor`, `make disk-usage`, and `make prune-safe`.
3. Keep `make cleanup-legacy-images` in release checklists after major naming/migration changes.

### Medium Impact
4. Reduce frontend image/runtime footprint further (Next standalone output + slimmer final stage).
5. Add optional volume-targeted cleanup helpers for local-only caches (`npm`, stale dev volumes).
6. Periodically review whether all dev compose variants are still necessary or can be consolidated.

### Cleanup / Complexity Hygiene
7. Keep one canonical initializer path and document it clearly in `SETUP_GUIDE`.
8. Archive historical planning docs under `docs/archive/` to keep root focused.

## Suggested Operational Baseline
- Weekly: run `make disk-usage`.
- Biweekly/monthly: run `make prune-safe`.
- Per release: run `make cleanup-legacy-images` and verify shared slug defaults.

## Practical Bottom Line
VPT is not source-bloated; post-cleanup it is operationally lean with manageable storage tradeoffs.  
For FOSS readiness, maintain disciplined volume hygiene and keep the shared base-image workflow as the default path.
