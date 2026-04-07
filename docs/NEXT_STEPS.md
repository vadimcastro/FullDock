# Next Steps — Post v2.1.5

## v2.1.5 Summary

`v2.1.5` delivered the core workflow and settings stabilization release:
- Prompt lifecycle normalized across `queued`, `on-deck`, `needs-edit`, `forked`, `complete`
- Atomic prompt transitions with queue correctness and promotion behavior
- Robust settings UX for ordering, visibility, naming, and model tab management
- Dynamic model tab icon inheritance and custom tab support
- Cloud sync status alignment between backend state and UI indicators
- Migration hardening for legacy/untracked schemas (`0005`/`0006` idempotency)
- Release validation coverage expanded across build/import/smoke/persistence/schema checks

## v2.1.6 Roadmap (Recommended)

Focus for `v2.1.6`: production hardening over feature expansion.

1. Data integrity and consistency
- Add DB-level ownership/FK constraint strategy for `linked_prompt_id`.
- Add transactional reorder endpoints for model tabs and prompt categories.
- Enforce strict server-side validation for all user-provided tab titles and ordering payloads.

2. Reliability and observability
- Introduce structured error telemetry and request correlation IDs.
- Add sync failure reason codes surfaced in UI (not only generic sync error states).
- Add automated post-deploy migration/schema verifier in release pipeline.

3. Performance and compute efficiency
- Reduce full settings-object re-renders by splitting settings state updates by section.
- Debounce/batch settings writes where rapid drag/toggle events occur.
- Cache stable settings responses and avoid redundant refetches after local optimistic updates.

4. Security and production readiness
- Add stricter OAuth callback validation and provider error-path coverage.
- Enforce production cookie/security headers review (HSTS, SameSite, secure flags across environments).
- Add rate limits for high-frequency write endpoints beyond auth flows.
- Add audit trail for settings mutations that affect layout/visibility semantics.

5. Developer velocity and maintainability
- Consolidate duplicated style tokens/button variants into a single action-button system.
- Add targeted UI tests for settings add/delete/toggle/reorder regressions.
- Add API tests for transition invariants and reorder conflict handling.

## Extracted Next Steps (Consolidated)

From current project docs, open items are now unified here:
- DB-level FK/ownership constraints for linked prompt relationships.
- Transaction-safe ordering APIs for tabs/categories.
- Production runbook integration for schema verification after deploy.
- Stronger observability, structured errors, and actionable sync diagnostics.
- Security hardening pass for OAuth/cookies/headers/rate-limited write paths.
- UI stability hardening for dynamic settings edits (add/delete/reorder without jump/glitch).

## Critical Review: What To Improve

What is working well:
- Core prompt transitions are now coherent and substantially safer.
- Migration recovery path for legacy DB states is practical and operator-friendly.
- Settings UX direction is strong and user-centric.

Where time/compute is likely being wasted:
- Excessive re-render/refetch churn after settings mutations.
- Repeated full-page settings reflow for localized actions.
- Release checks run mostly as manual command bundles instead of one deterministic gate.

Production-readiness gaps:
- Missing deep telemetry for failure triage.
- Limited automated coverage for dynamic settings UX edge cases.
- Partial reliance on app-layer invariants that should also be DB-enforced.

Security/elegance assessment:
- Security baseline is solid for local/prototype stage (JWT rotation, revocation, auth logging, fail-fast secrets).
- Not yet fully production-hardened until endpoint rate limits, stricter OAuth/cookie posture, and expanded auditability are completed.
- Architecture is directionally elegant, but backend invariants and UI state isolation should be tightened to reduce operational risk.

## Suggested Execution Order

1. DB invariants + transactional reorder APIs.
2. Settings UI state isolation to eliminate add/delete/reorder glitches.
3. Observability and sync diagnostics.
4. Security hardening sweep + regression tests.
5. CI/release gate unification (`make release-check` style pipeline).
