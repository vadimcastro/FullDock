# Next Steps — v2.1.8 Tracker

## v2.1.7 Summary (Released: April 7, 2026)

`v2.1.7` delivered release automation and observability groundwork on top of v2.1.6 hardening:
- deterministic release gate (`make release-check`)
- frontend settings regression contract check (`scripts/ci_frontend_settings_contract.py`)
- API write-rate limit regression check (`scripts/ci_rate_limit.py`)
- lightweight operational metrics counters (`ops_metrics`)
- request-id aware error/status tracking reflected in health diagnostics
- expanded docs and workflow alignment to release automation

## v2.1.8 Goal

Focus `v2.1.8` on deeper observability, release-note/changelog automation, and additional quality gates.

## v2.1.8 Planned Work

### P0 (Release Readiness)

- [ ] Finalize v2.1.8 release notes/changelog template
- [ ] Add docs/version consistency assertion in release gate
- [ ] Add optional `release-check` dry-run mode for local iteration

### P1 (Operational Visibility)

- [ ] Extend metrics counters for sync-failure taxonomy buckets
- [ ] Add request-id search guidance/runbook snippets for incident triage
- [ ] Add operator mapping table (error code -> probable cause -> remediation)

### P2 (Quality and Maintainability)

- [ ] Expand transactional guarantees for prompt reorder/multi-update flows
- [ ] Add optional profiling check for settings render churn regressions
- [ ] Add targeted API assertions for metric counter behavior

## Efficiency and Security Review

What improved in v2.1.7:
- release validation is now scriptable and repeatable
- rate-limit behavior has explicit regression coverage
- operations now have lightweight counters for failure visibility

Remaining risks to address in v2.1.8:
- observability is useful but still shallow for production dashboards
- release notes/changelog process is still partly manual
- transaction guarantees for some multi-step prompt operations can be strengthened

## Recommended Execution Order

1. release-note/changelog template + docs/version gate
2. sync taxonomy metrics + triage runbook mapping
3. prompt transactional guarantee expansion
4. profiling and metric assertion coverage
