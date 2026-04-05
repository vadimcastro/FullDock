# Auth Production Hardening Plan

Last updated: 2026-04-05  
Scope: `vadim-project-template`

## Current Status
All planned auth hardening phases are implemented.

## Completed
- [x] Production fail-fast validation for weak/missing secrets and unsafe CORS.
- [x] Login abuse protection with Redis-backed counters and temporary lockouts.
- [x] Token lifecycle hygiene:
  - access token TTL
  - refresh token rotation
  - revoke support (`logout`, `logout-all`)
  - revoke checkpoint checks in auth dependencies
- [x] Transport/network hardening:
  - production DB/Redis not publicly exposed by default
  - TLS/reverse-proxy path documented and wired
  - production security headers enabled
  - HTTPS-aware cookie behavior
- [x] Auth observability:
  - structured `auth_event` logs
  - IP + user-agent hash metadata
  - basic operator playbook in docs

## Confirmed Command Surface
- `make auth` is the single local auth setup command.

## Remaining Follow-Ups (Optional)
- [ ] Add compatibility notes for projects still using legacy token assumptions.
- [ ] Add automated auth integration tests for login throttling + refresh/revoke paths.
- [ ] Add a simple log filter snippet for quick auth incident triage.
