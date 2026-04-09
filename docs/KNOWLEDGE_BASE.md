# FullDock Knowledge Base

**Project:** FullDock  
**Description:** Docker-first infrastructure for Next.js, FastAPI, PostgreSQL, and Redis.

## 🏗️ Architectural Patterns

### 1. Dual-Purpose Template
FullDock is designed to be both a fast-start repo for new apps and a stable baseline for complex downstream projects (like `ondeck`).

### 2. Standalone & Decoupled
Each project generated from FullDock is completely self-contained. There are no runtime dependencies on sibling repositories or shared parent directories.

### 3. Docker-First Workflow
- **Development:** `make dev` starts the stack with hot-reloading.
- **Rebuild Control:** `make dev REBUILD=1` forces image rebuilds when dependencies or Dockerfiles change.
- **Hygiene:** Tooling is provided for safe cleanup and disk monitoring (`make prune-safe`, `make disk-usage`).

### 4. Hardened Security
- **Auth:** JWT access/refresh rotation with session revocation and login throttling.
- **Secrets:** Production startup fails fast on weak or missing secrets.
- **CORS:** Strict validation in production mode.

### 5. Unified, Role-Aware UI
- **Single Entry Point:** Authentication actions are consolidated into a single `ProfileDropdown` to maintain a clean navbar.
- **Role Elevation:** The UI dynamically adapts based on the `is_superuser` flag, showing/hiding sensitive administrative links (like the Dashboard) within the unified menu.
- **Consistent UX:** Premium styling is applied to the auth trigger for all authenticated users, regardless of role.

---

## 🔧 Core Commands Reference

| Command | Description |
|---------|-------------|
| `make dev` | Start development stack (standard) |
| `make dev REBUILD=1` | Force rebuild of app images |
| `make dev-build` | Backward-compatible alias for `make dev REBUILD=1` |
| `make auth` | Configure/verify local authentication |
| `make migrate` | Run database migrations inside Docker |
| `make migrate-create name=X` | Generate a new Alembic migration |
| `make doctor` | Run environment preflight checks |
| `make newpro` | Interactive initializer for new projects |
| `make setup-prod-env` | Scaffold a production `.env` file |

---

## 🎯 Development Values

- **Fail Fast:** Clear errors over silent failures.
- **Efficiency:** Minimize context switching between tools.
- **Consistency:** Same commands work across all FullDock-derived projects.
- **Documentation as Code:** Keep guides in sync with the CLI surface.

---

## OAuth Implementation Guide

FullDock supports Google and GitHub OAuth out of the box. 

1.  **Secrets:** Define client IDs/secrets in `.env.development`.
2.  **Migration:** Run `make migrate` to create the `oauth_accounts` table.
3.  **Flow:** Backend handles the handshake and writes secure cookies; Frontend `AuthContext` picks them up automatically.
4.  **Local Testing:** Use `http://localhost:8000/api/v1/oauth/{provider}/callback` as the redirect URI in your provider console.
