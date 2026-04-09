# {{PROJECT_NAME}} Makefile
# Standalone project commands

PROJECT_NAME ?= $(notdir $(CURDIR))
PROJECT_NAME_SAFE ?= $(shell printf '%s' "$(PROJECT_NAME)" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9_-]+/-/g')
COMPOSE = COMPOSE_PROJECT_NAME=$(PROJECT_NAME_SAFE) docker compose
REBUILD ?= 0

.PHONY: dev dev-build dev-fast dev-debug prod down logs clean clean-all \
	migrate migrate-create db auth setup-prod-env help doctor disk-usage prune-safe

dev:
	@echo "Starting development environment..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml up $(if $(filter 1 true yes,$(REBUILD)),--build,)

dev-fast:
	@echo "Starting fast development environment..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml up

dev-build:
	@echo "dev-build is deprecated. Use 'make dev REBUILD=1'."
	@$(MAKE) dev REBUILD=1

dev-debug:
	@echo "Starting development environment with debug logs..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml up 2>&1 | tee debug.log

prod:
	@echo "Starting production environment..."
	docker compose -f docker/docker-compose.prod.yml up --build -d

down:
	@echo "Stopping containers..."
	-cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml down --remove-orphans
	-COMPOSE_PROJECT_NAME=$(PROJECT_NAME_SAFE) docker compose -f docker/docker-compose.prod.yml down

logs:
	@echo "Showing logs..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml logs -f

clean:
	@echo "Cleaning Docker resources..."
	docker system prune -f

clean-all:
	@echo "Removing local volumes for a fresh start..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml down -v --remove-orphans
	COMPOSE_PROJECT_NAME=$(PROJECT_NAME_SAFE) docker compose -f docker/docker-compose.prod.yml down -v

doctor:
	@echo "Running environment preflight checks..."
	PROJECT_NAME=$(PROJECT_NAME) ./scripts/docker-doctor.sh

disk-usage:
	@echo "Inspecting Docker disk usage..."
	PROJECT_NAME=$(PROJECT_NAME) ./scripts/docker-disk-usage.sh

prune-safe:
	@echo "Pruning unused Docker artifacts (safe mode)..."
	./scripts/docker-prune-safe.sh

migrate:
	@echo "Running migrations..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml exec api /app/scripts/migrate.sh

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: Migration name not provided. Use 'make migrate-create name=your_migration_name'"; \
		exit 1; \
	fi
	@echo "Creating migration: $(name)"
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml exec api alembic revision --autogenerate -m "$(name)"

db: migrate

db: migrate

auth:
	@echo "Setting up local development authentication..."
	./scripts/setup-local-auth.sh

setup-prod-env:
	@echo "Setting up production environment..."
	./scripts/setup-production-env.sh

help:
	@echo "Available commands (grouped)"
	@echo "Core:"
	@echo "  make dev                     - Start dev stack (reuse cached images)"
	@echo "  make dev REBUILD=1           - Rebuild images, then start dev stack"
	@echo "  make dev-build               - Backward-compatible alias for REBUILD=1"
	@echo "  make down                    - Stop all stacks"
	@echo "  make logs                    - Tail development logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  make doctor                  - Preflight checks (docker/env/ports)"
	@echo "  make disk-usage              - Show Docker image/volume/cache usage"
	@echo "  make prune-safe              - Safe Docker cleanup (containers/images/cache)"
	@echo "  make migrate                 - Run Alembic migrations"
	@echo "  make db                      - Alias for migrate (FastAPI/Alembic)"
	@echo "  make migrate-create name=X   - Create Alembic migration"
	@echo ""
	@echo "Project setup:"
	@echo "  make auth                    - Validate local auth using .env credentials"
	@echo "  make setup-prod-env          - Configure production env file"
