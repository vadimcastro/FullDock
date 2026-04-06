# Setup Guide — OnDeck 2.0.0

## Prerequisites

- Docker Engine + Compose plugin
- `make`
- Git

```bash
docker --version
docker compose version
make --version
```

---

## First Run

```bash
git clone <repo-url> && cd FullDock
cp .env.example .env.development
# Edit .env.development with your secrets
make doctor        # preflight check
make dev-build     # builds images and starts all services
```

Services:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Daily Workflow

```bash
make dev           # Start (fast — uses cached Docker images)
make down          # Stop everything
make logs          # Tail all logs
make logs-frontend # Frontend only
make logs-api      # API only
```

**After changing `package.json` or Python deps:**
```bash
make dev-build     # Rebuilds images with new deps baked in
```

**Full clean reset** (removes all data volumes):
```bash
make clean-all && make dev-build
```

---

## Docker Architecture

OnDeck uses a **single, simple compose setup**:

| File | Purpose |
|---|---|
| `docker/docker-compose.dev.yml` | Development stack |
| `docker/docker-compose.prod.yml` | Production stack |
| `docker/frontend/Dockerfile.dev` | Dev frontend (2-stage, deps cached in image layer) |
| `docker/frontend/Dockerfile.prod` | Prod frontend (3-stage, minimal standalone runner) |
| `docker/Dockerfile` | API (Python/FastAPI) |

**Key design decision:** `node_modules` lives inside the Docker image layer, **not** in a named volume. This means:
- No stale cache issues when adding new npm packages
- `make dev-build` always gives you a clean, consistent dependency set
- `make dev` is fast because Docker layer caching handles the `npm install` step

---

## Database / Migrations

```bash
make migrate                         # Apply all pending migrations
make migrate-create name=add_column  # Generate new migration from models
make shell-db                        # Direct psql session
```

Migrations run automatically on container startup via `scripts/migrate.sh`.

---

## Authentication

Local admin credentials come from `.env.development`:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

Auth features:
- JWT access + refresh token rotation
- Login throttling (rate-limited)
- Session revocation (`/auth/logout`, `/auth/logout-all`)
- Auth event logging

---

## OAuth Setup

1. Add to `.env.development`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```
2. Run `make migrate` (creates `oauth_accounts` table)
3. Provider redirect URIs:
   - `http://localhost:8000/api/v1/auth/oauth/google`
   - `http://localhost:8000/api/v1/auth/oauth/github`

---

## Production

```bash
# Requires .env.production.local with strong secrets
make prod
```

Production safeguards:
- `SECRET_KEY` must be strong
- `ADMIN_PASSWORD` must be strong
- `POSTGRES_PASSWORD` must be set
- CORS origins must be explicit

---

## Troubleshooting

| Problem | Fix |
|---|---|
| New npm package not found | `make clean-all && make dev-build` |
| Port conflicts | `lsof -i :3000`, `:8000`, `:5432`, `:6379` |
| DB out of sync | `make migrate` |
| Full reset | `make clean-all && make dev-build` |
| Environment check | `make doctor` |

---

## All Commands

```bash
make dev                          # Start with cached images
make dev-build                    # Rebuild images + start
make down                         # Stop all services
make clean-all                    # Stop + delete all volumes
make logs                         # All logs
make logs-frontend                # Frontend logs
make logs-api                     # API logs
make migrate                      # Run migrations
make migrate-create name=X        # Create migration
make shell-api                    # sh in API container
make shell-db                     # psql in DB container
make shell-frontend               # sh in frontend container
make prod                         # Production stack
make doctor                       # Preflight check
make clean                        # docker system prune
make help                         # Full command list
```
