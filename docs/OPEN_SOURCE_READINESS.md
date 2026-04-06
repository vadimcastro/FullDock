# VPT Open Source Readiness Plan

**Last updated:** 2026-04-06  
**Status:** High-end infrastructure baseline with Unified Auth UI and stable OAuth.

## General Philosophy

VPT is designed to be a "boring" but rock-solid foundation. We prioritize:
- **Portability:** No runtime dependencies on external repos.
- **Safety:** Hardened auth, secret validation, and secure defaults.
- **Developer UX:** Clean `make` interface and fast initialization.

---

## Remaining OAuth Steps

OAuth is partially implemented but requires a few final manual steps to be "full-stack" ready in generated projects:

1.  **Database Migration:** Run the migration specifically for OAuth accounts:
    ```bash
    docker compose -f docker/docker-compose.dev.fast.yml exec api alembic upgrade head
    ```
2.  **Secret Configuration:** Add your provider credentials to `.env.development`:
    - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
    - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
3.  **Frontend Controls:** Add login buttons to `frontend/src/components/auth/LoginModal.tsx` that redirect directly to the backend:
    - `Google`: `{API_URL}/api/v1/auth/oauth/google`
    - `GitHub`: `{API_URL}/api/v1/auth/oauth/github`
    *Note: The backend handles the callback and writes JWT cookies, which `AuthContext` automatically resumes.*
4.  **Dependency Pin:** Ensure `httpx==0.28.1` is maintained in `requirements-minimal.txt` to avoid build failures with non-existent newer versions.

---

## Future Goals (The Road to 1.0)

### Priority 1: Docs & Onboarding
- [x] Align `README.md` and `SETUP_GUIDE.md` with the very latest command surface.
- [x] Remove internal/personal references and migrate `CLAUDE.md` to `docs/KNOWLEDGE_BASE.md`.
- [ ] Create a "first 5 minutes" guide for external developers.

### Priority 2: Validation & Hygiene
- [ ] Generate a fresh sample project and verify every command in the docs works literally.
- [x] Audit frontend production build for image size (investigate "slimmer" node images).
- [ ] Ensure generated projects do not inherit internal template planning docs.

### Priority 3: Docker Optimization & Reliability
- [x] Implement BuildKit cache mounts for `pip` and `npm` to speed up rebuilds.
- [ ] Create pre-built base images (`vadim-base-py`, `vadim-base-node`) to eliminate the "pip install" bottleneck for new projects.
- [ ] Standardize MTU settings in `docker-compose` to prevent Linux-specific networking stalls.

### Priority 4: Automated Testing
- [ ] Implement integrated auth tests for: login throttling, refresh rotation, and session revocation.
- [ ] Add basic CI/CD examples for GitHub Actions.

## Completed Milestones (Summary)

- **Decoupling:** Standalone repo status achieved; no runtime sibling dependencies.
- **Hardening:** Login throttling, refresh rotation, secure cookies, and secret validation implemented.
- **Initializer:** `init-project-fast.sh` is now the canonical stable initializer.
- **Hygiene:** Conservative cleanup tools (`make prune-safe`, `make disk-usage`) are standard.
