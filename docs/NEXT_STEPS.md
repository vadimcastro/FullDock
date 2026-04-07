# Next Steps — v2.1.7 Tracker

## v2.1.6 Summary (Released: April 7, 2026)

`v2.1.6` delivered stability + hardening across data integrity, settings UX, and security posture:
- linked prompt integrity migration (`0007_prompt_linked_integrity`)
- linked prompt ownership/self-link constraints + query index
- transactional settings layout endpoints (tabs/categories/title)
- strict server-side layout payload validation
- settings UI state isolation (draft state + commit semantics)
- debounced settings sync to reduce write churn
- structured backend error payloads with request IDs
- sync diagnostics in UI (`error code`, `message`, `request id`)
- write-rate limits for prompt/settings mutation endpoints
- OAuth callback state-cookie validation
- expanded backend smoke coverage for layout + linked-prompt validation

## v2.1.7 Goal

Focus `v2.1.7` on release engineering maturity, deeper observability, and targeted regression automation.

## v2.1.7 Planned Work

### P0 (Release Readiness)

- [ ] Add deterministic release gate command (`make release-check`)
- [ ] Add explicit API rate-limit behavior test script
- [ ] Add focused UI regression checks for settings edge interactions
- [ ] Finalize v2.1.7 release notes/changelog template

### P1 (Operational Visibility)

- [ ] Add lightweight metrics counters for settings/layout/sync failure classes
- [ ] Standardize request-id logging format across API endpoints
- [ ] Add operator-friendly sync failure taxonomy mapping (code -> remediation)

### P2 (Quality and Maintainability)

- [ ] Expand transactional guarantees for prompt reorder/multi-update flows
- [ ] Add stricter docs/version consistency check in release gate
- [ ] Add optional profiling check for settings render churn regressions

## Efficiency and Security Review

What improved in v2.1.6:
- reduced redundant settings sync calls and UI reflow churn
- moved critical queue/link invariants closer to DB enforcement
- improved failure diagnostics and traceability with request IDs

Remaining risks to address in v2.1.7:
- release process still relies on manual command sequencing
- limited automated UI regression coverage for dynamic settings paths
- observability is improved but not yet metricized for operations dashboards

## Recommended Execution Order

1. `make release-check` + scripted API rate-limit assertions
2. UI regression checks for settings interaction paths
3. metrics counters + request-id log normalization
4. changelog/release-note automation polish
