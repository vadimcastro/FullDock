# vadim-project-template

Docker-first full-stack template for Next.js, FastAPI, PostgreSQL, and Redis.

It is designed for two jobs:
- start a new app quickly with sane defaults
- act as the stable infrastructure baseline for downstream projects such as `ondeck`

## Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic
- Services: PostgreSQL, Redis
- Local workflow: Docker Compose + Makefile commands
- Auth: JWT access + refresh flow with login throttling and session revocation
- UI: Unified, role-aware account management with premium styling

## Quick Start

```bash
git clone <your-fork-or-repo-url> vadim-project-template
cd vadim-project-template
cp .env.example .env.development
make doctor
make dev
make auth
```

Default local URLs:
- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Create a New Project

```bash
make newpro
```

The initializer:
- asks for project metadata and admin defaults
- copies the template into a sibling directory
- replaces template placeholders
- removes template git history and initializer scripts from the generated project

After creation:

```bash
cd ../your-project
make dev
make auth
```

## Core Commands

```bash
make dev
make dev-build
make dev-ultra
make down
make logs
make auth
make migrate
make migrate-create name=example_change
make doctor
make disk-usage
make prune-safe
make cleanup-legacy-images
make setup-prod-env
make newpro
```

## Shared Base Images

VPT can reuse shared Docker base images across multiple generated projects.

- `PROJECT_SLUG` defaults to `vpt-core`
- `make dev` and `make dev-ultra` look for:
  - `${PROJECT_SLUG}-frontend-base:latest`
  - `${PROJECT_SLUG}-backend-base:latest`
- first use on a machine builds them automatically
- later projects with the same `PROJECT_SLUG` reuse them

Use a different `PROJECT_SLUG` only if you intentionally want isolated base images.

## Security Defaults

Implemented in the current template:
- production fail-fast checks for weak or missing secrets
- production CORS validation
- login throttling
- refresh token rotation
- refresh-session revocation
- `logout` and `logout-all`
- auth event logging
- HTTPS-aware cookie handling in the frontend auth flow

## OAuth Configuration

1.  **Provision Secrets:** Populate `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in `.env.development`.
2.  **Run Migration:** Ensure the OAuth database table exists:
    ```bash
    make migrate
    ```
3.  **Use Provider URLs:** The backend handles social login via:
    - `http://localhost:8000/api/v1/auth/oauth/google`
    - `http://localhost:8000/api/v1/auth/oauth/github`
4.  **Behavior:** Upon successful login, the backend writes secure cookies, and the frontend automatically synchronizes.
5.  **Unified Experience:** The UI features a single `ProfileDropdown` trigger (premium "Blue") for all authenticated users. Administrative tools like the "Dashboard" are dynamically integrated into the dropdown based on the `is_superuser` role.

Recommended production entrypoint:

```bash
docker compose -f docker/docker-compose.https.yml up -d --build
```

## Documentation

- [Setup Guide](./SETUP_GUIDE.md)
- [VPT Open Source Readiness Plan](./docs/OPEN_SOURCE_READINESS.md)
- [OnDeck Integration Review](./docs/ONDECK_INTEGRATION_REVIEW.md)

## Project Structure

```text
frontend/   Next.js app
backend/    FastAPI app
docker/     Compose files and Dockerfiles
scripts/    setup and maintenance helpers
docs/       roadmap and integration docs
```

## Troubleshooting

- **Dependency Errors:** If `make dev-build` fails with `httpx` distribution errors, ensure you are using `httpx==0.28.1` in `backend/requirements-minimal.txt`.
- **Infrastructure:** If the stack does not come up cleanly:
  ```bash
  make doctor
  make logs
  make down
  make dev-build
  ```
- **Storage:** If Docker storage grows too much:
  ```bash
  make disk-usage
  make prune-safe
  ```

## License

MIT
