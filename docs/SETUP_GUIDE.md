# Setup Guide

Step-by-step setup for `FullDock` and projects generated from it.

## Prerequisites

- Docker Desktop or Docker Engine with Compose plugin
- Git
- `make`

Verify the basics:

```bash
docker --version
docker compose version
git --version
make --version
```

## First Run in the Template Repo

```bash
git clone <your-fork-or-repo-url> FullDock
cd FullDock
cp .env.example .env.development
make doctor
make dev
make auth
```

Expected local URLs:
- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## What `make doctor` Checks

- Docker is installed
- Docker daemon is reachable
- Docker Compose plugin is available
- `.env.development` exists
- `PROJECT_SLUG` is configured or falls back safely
- common local ports are free or clearly reported

Run it before the first `make dev` on a new machine.

## Create a New Project From FullDock

From the template root:

```bash
make newpro
```

The initializer asks for:
- project name
- display name
- description
- admin email, username, and display name
- development password
- optional production IP, domain, and SSH alias
- target directory

By default the generated project is created as a sibling directory of the template repo.

Example:

```bash
cd /path/to/FullDock
make newpro
cd ../ondeck
make dev
make auth
```

## Shared Base-Image Reuse

Generated projects inherit:

```bash
PROJECT_SLUG=fulldock-core
```

That lets multiple projects reuse shared Docker base images:
- `${PROJECT_SLUG}-frontend-base:latest`
- `${PROJECT_SLUG}-backend-base:latest`

Behavior:
- first project on a machine builds the shared base images
- later projects with the same `PROJECT_SLUG` reuse them automatically

## Daily Development Workflow

```bash
make dev
make logs
make down
```

Use these when needed:

```bash
make dev-build
make dev-ultra
make migrate
make migrate-create name=add_feature_x
```

## Authentication Notes

Local auth setup:

```bash
make auth
```

Current template auth behavior includes:
- access + refresh tokens
- refresh token rotation
- session revoke support
- login throttling
- **Unified UI**: Consolidates all account and admin actions into a single `ProfileDropdown`.
- **Role Awareness**: Dynamically adjusts visibility of administrative links (e.g., Dashboard) based on your role.

If you are integrating an older generated project, check that its frontend auth flow matches the current FullDock refresh-token behavior.

## Production Setup

Generate a production env scaffold:

```bash
make setup-prod-env
```

Recommended production runtime:

```bash
docker compose -f docker/docker-compose.https.yml up -d --build
```

Production safeguards currently enforced:
- `SECRET_KEY` must exist and be strong
- `ADMIN_PASSWORD` must be strong
- `POSTGRES_PASSWORD` must be strong
- `CORS_ORIGINS` must be explicit and production-safe

## OAuth Configuration

1.  **Provision Secrets:** Populate `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in `.env.development` or `.env.production.local`.
2.  **Run Migration:** The backend requires a specific table for OAuth accounts. Run this once your API service is healthy:
    ```bash
    make migrate
    ```
    *Note: This executes `alembic upgrade head` inside the container.*
3.  **Frontend Integration:** The backend exposes provider-specific redirect endpoints:
    - `http://localhost:8000/api/v1/auth/oauth/google`
    - `http://localhost:8000/api/v1/auth/oauth/github`
4.  **Behavior:** Upon successful login, the backend writes `accessToken` and `refreshToken` cookies. The frontend `ProfileDropdown` then provides a unified command center for both standard users and administrators.
5.  **Dashboard Access:** For Administrators (`is_superuser: true`), the Dashboard link is conveniently located inside the user profile dropdown to maintain a clean navigation bar.

## Maintenance Commands

Check local Docker usage:

```bash
make disk-usage
```

Conservative cleanup:

```bash
make prune-safe
```

Legacy image-tag cleanup after migrations:

```bash
make cleanup-legacy-images
```

## Troubleshooting

- **HTTPX Version Errors:** If `make dev-build` fails with "cannot find distribution for httpx", check `backend/requirements-minimal.txt`. It must be pinned to `httpx==0.28.1`. Versions like `0.29.x` or `0.30.0` do not have stable releases on PyPI as of early 2026.
- **Port Conflicts:** If `make dev` fails early, ports might be in use:
  ```bash
  lsof -i :3000
  lsof -i :8000
  lsof -i :5432
  lsof -i :6379
  ```
- **Clean Reset:** If you need a total local reset:
  ```bash
  make down
  make clean-all
  make dev
  make auth
  ```

## Additional Reading

- [README](../README.md)
- [Knowledge Base](./KNOWLEDGE_BASE.md)
