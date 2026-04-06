# Setup Guide

Step-by-step setup for `vadim-project-template` and projects generated from it.

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
git clone <your-fork-or-repo-url> vadim-project-template
cd vadim-project-template
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

## Create a New Project From VPT

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
cd /path/to/vadim-project-template
make newpro
cd ../ondeck
make dev
make auth
```

## Shared Base-Image Reuse

Generated projects inherit:

```bash
PROJECT_SLUG=vpt-core
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

If you are integrating an older generated project, check that its frontend auth flow matches the current VPT refresh-token behavior.

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

If `make dev` fails early:

```bash
make doctor
make logs
```

If ports are already in use:

```bash
lsof -i :3000
lsof -i :8000
lsof -i :5432
lsof -i :6379
```

If you need a clean local reset:

```bash
make down
make clean-all
make dev
make auth
```

If frontend changes are not reflected after dependency or Dockerfile updates:

```bash
make dev-build
```

## Additional Reading

- [README](./README.md)
- [VPT Open Source Readiness Plan](./docs/VPT_OPEN_SOURCE_READINESS_PLAN.md)
- [OnDeck Integration Review](./docs/ONDECK_INTEGRATION_REVIEW.md)
