# FullDock Knowledge Base

**Project:** OnDeck 2.0.0 (FullDock Infrastructure)  
**Description:** High-fidelity prompt queue with Next.js 16, React 19, and Tailwind v4 on a FastAPI/Postgres/Redis backend.

## 🏗️ Architectural Patterns

### 1. High-Fidelity Product
OnDeck 2.0.0 is a standalone application built on the stable FullDock infrastructure. It is optimized for high-performance prompt queue management.

### 2. Standalone & Decoupled
Each project generated from FullDock is completely self-contained. There are no runtime dependencies on sibling repositories or shared parent directories.

### 3. Docker-First Workflow
- **Development:** `make dev` starts the stack with hot-reloading.
- **Base Images:** Shared base images (`PROJECT_SLUG`) are reused across projects to save build time and disk space.
- **Hygiene:** Tooling is provided for safe cleanup and disk monitoring (`make prune-safe`, `make disk-usage`).

### 4. Hardened Security
- **Auth:** JWT access/refresh rotation with session revocation and login throttling.
- **Secrets:** Production startup fails fast on weak or missing secrets.
- **CORS:** Strict validation in production mode.

### 5. Unified, Role-Aware UI
- **Single Entry Point:** Authentication actions are consolidated into a single `ProfileDropdown` to maintain a clean navbar.
- **Role Elevation:** The UI dynamically adapts based on the `is_superuser` flag, showing/hiding sensitive administrative links (like the Dashboard) within the unified menu.
- **Consistent UX**: Premium styling is applied to the auth trigger and prompt queue, utilizing **Tailwind v4 OKLCH** tokens for high-fidelity visual depth.
- **OnDeck App Layout**: The core UI is driven by the `OnDeckApp` entry point, which manages model-specific queues and synchronization.

---

## 🔧 Core Commands Reference

| Command | Description |
|---------|-------------|
| `make dev` | Start development stack (standard) |
| `make dev-ultra` | Start with shared base-image overrides |
| `make dev-build` | Force rebuild of app images |
| `make auth` | Configure/verify local authentication |
| `make migrate` | Run database migrations inside Docker |
| `make migrate-create name=X` | Generate a new Alembic migration |
| `make doctor` | Run environment preflight checks |
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
3.  **Flow:** Backend handles the handshake and writes secure cookies; Frontend `AuthContext` and `SettingsProvider` pick them up automatically.
4.  **Local Testing:** Use `http://localhost:8000/api/v1/auth/oauth/{provider}/callback` as the redirect URI in your provider console.
5.  **Data Models:** Prompts use a UUID primary key with linked reference support; Settings are scoped to the `user_id` and applied via CSS variables.
