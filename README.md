# FullDock

FullDock is a Docker-first full-stack template for Next.js 16, React 19, FastAPI, PostgreSQL, and Redis.

It is designed as a stable, security-hardened infrastructure baseline for internal or public open-source projects.

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS v4
- **Backend**: FastAPI, SQLAlchemy 2, Alembic, Pydantic v2
- **Services**: PostgreSQL, Redis
- **Local Workflow**: Docker Compose + Makefile commands
- **Auth**: JWT access + refresh flow with login throttling, session revocation, and social OAuth (Google/GitHub)
- **CI & Security**: GitHub Actions pipeline for automated secret scanning (`gitleaks`), Python syntax verification, and TypeScript typechecking

## Quick Start (First 5 Minutes)

1.  **Clone & Setup:**
    ```bash
    git clone <your-repo> FullDock && cd FullDock
    cp .env.example .env.development
    ```
2.  **Verify Environment:**
    ```bash
    make doctor
    ```
3.  **Launch Stack:**
    ```bash
    make dev
    ```
4.  **Configure Auth:**
    ```bash
    make auth
    ```
5.  **Run Database Bootstrap:**
    ```bash
    make migrate
    ```

- API docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`

## Core Commands

```bash
make dev
make dev REBUILD=1
# backward-compatible alias:
make dev-build
make down
make logs
make auth
make migrate
make migrate-create name=example_change
make doctor
make disk-usage
make prune-safe
make setup-prod-env
```

## Security Defaults & CI

Implemented in the current template:
- Automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`) featuring strict secret scanning via `gitleaks`
- Production fail-fast checks for weak or missing secrets
- Production CORS validation
- Login throttling & refresh token rotation
- Session revocation (`logout` and `logout-all`)
- Auth event logging & HTTPS-aware cookie handling

## OAuth Configuration

1.  **Provision Secrets:** Populate `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in `.env.development`.
2.  **Run Migration:** Ensure the OAuth database table exists:
    ```bash
    make migrate
    ```
3.  **Use Provider URLs:** The backend handles social login via:
    - `http://localhost:8000/api/v1/oauth/google`
    - `http://localhost:8000/api/v1/oauth/github`
4.  **Behavior:** Upon successful login, the backend writes secure cookies, and the frontend automatically synchronizes.
5.  **Unified Experience:** The UI features a single `ProfileDropdown` trigger for all authenticated users. Administrative tools like the "Dashboard" are dynamically integrated into the dropdown based on the `is_superuser` role.

Recommended production entrypoint:

```bash
docker compose -f docker/docker-compose.https.yml up -d --build
```

## Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Knowledge Base](./docs/KNOWLEDGE_BASE.md)

## Roadmap

- [ ] Add a longer guided tutorial for first-time setup.
- [ ] Integrated auth tests (login throttling, refresh rotation).
- [x] GitHub Actions CI/CD security pipeline (`gitleaks`, typecheck, syntax checks).
- [ ] Standardized MTU settings for Linux networking.

## Project Structure

```text
frontend/   Next.js 16 app
backend/    FastAPI app
docker/     Compose files and Dockerfiles
scripts/    Setup and maintenance helpers
docs/       Integration docs
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

GNU GPL v3.0
