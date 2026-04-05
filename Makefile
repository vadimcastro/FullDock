# {{PROJECT_NAME}} Makefile
# Standalone project commands

PROJECT_NAME ?= $(notdir $(CURDIR))
PROJECT_SLUG ?= vpt-core
COMPOSE = COMPOSE_PROJECT_NAME=$(PROJECT_NAME) docker compose
FRONTEND_IMAGE = $(PROJECT_NAME)-frontend:latest
API_IMAGE = $(PROJECT_NAME)-api:latest
ULTRA_FRONTEND_IMAGE = $(PROJECT_SLUG)-frontend-base:latest
ULTRA_API_IMAGE = $(PROJECT_SLUG)-backend-base:latest

.PHONY: dev dev-build dev-fast dev-ultra dev-debug build-base prod down logs clean clean-all \
	migrate migrate-create auth setup-prod-env newpro help doctor disk-usage prune-safe cleanup-legacy-images

dev:
	@echo "Starting development environment..."
	@if docker image inspect $(ULTRA_FRONTEND_IMAGE) >/dev/null 2>&1 && docker image inspect $(ULTRA_API_IMAGE) >/dev/null 2>&1; then \
		echo "Using shared base images: $(PROJECT_SLUG)-*"; \
	else \
		echo "Base images missing. Building once for PROJECT_SLUG=$(PROJECT_SLUG)..."; \
		PROJECT_SLUG=$(PROJECT_SLUG) ./scripts/build-base-images.sh; \
	fi
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml -f docker-compose.dev.ultra.yml up

dev-fast:
	@echo "Starting fast development environment..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml up

dev-build:
	@echo "Rebuilding and starting development environment..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml up --build

dev-ultra:
	@echo "Starting ultra development environment..."
	@if docker image inspect $(ULTRA_FRONTEND_IMAGE) >/dev/null 2>&1 && docker image inspect $(ULTRA_API_IMAGE) >/dev/null 2>&1; then \
		echo "Using shared ultra base images: $(PROJECT_SLUG)-*"; \
	else \
		echo "Ultra base images missing. Building base images for PROJECT_SLUG=$(PROJECT_SLUG)..."; \
		PROJECT_SLUG=$(PROJECT_SLUG) ./scripts/build-base-images.sh; \
	fi
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml -f docker-compose.dev.ultra.yml up

dev-debug:
	@echo "Starting development environment with debug logs..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml up 2>&1 | tee debug.log

build-base:
	@echo "Building base images..."
	PROJECT_SLUG=$(PROJECT_SLUG) ./scripts/build-base-images.sh

prod:
	@echo "Starting production environment..."
	docker compose -f docker/docker-compose.prod.yml up --build -d

down:
	@echo "Stopping containers..."
	-cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml down --remove-orphans
	-cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml -f docker-compose.dev.ultra.yml down --remove-orphans
	-COMPOSE_PROJECT_NAME=$(PROJECT_NAME) docker compose -f docker/docker-compose.prod.yml down

logs:
	@echo "Showing logs..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml logs -f

clean:
	@echo "Cleaning Docker resources..."
	docker system prune -f

clean-all:
	@echo "Removing local volumes for a fresh start..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml down -v --remove-orphans
	COMPOSE_PROJECT_NAME=$(PROJECT_NAME) docker compose -f docker/docker-compose.prod.yml down -v

doctor:
	@echo "Running environment preflight checks..."
	PROJECT_NAME=$(PROJECT_NAME) PROJECT_SLUG=$(PROJECT_SLUG) ./scripts/docker-doctor.sh

disk-usage:
	@echo "Inspecting Docker disk usage..."
	PROJECT_NAME=$(PROJECT_NAME) PROJECT_SLUG=$(PROJECT_SLUG) ./scripts/docker-disk-usage.sh

prune-safe:
	@echo "Pruning unused Docker artifacts (safe mode)..."
	./scripts/docker-prune-safe.sh

cleanup-legacy-images:
	@echo "Removing legacy base/app image tags..."
	./scripts/cleanup-legacy-images.sh

migrate:
	@echo "Running migrations..."
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml exec api alembic upgrade head

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: Migration name not provided. Use 'make migrate-create name=your_migration_name'"; \
		exit 1; \
	fi
	@echo "Creating migration: $(name)"
	cd docker && $(COMPOSE) -f docker-compose.dev.fast.yml exec api alembic revision --autogenerate -m "$(name)"

auth:
	@echo "Setting up local development authentication..."
	./scripts/setup-local-auth.sh

setup-prod-env:
	@echo "Setting up production environment..."
	./scripts/setup-production-env.sh

newpro:
	@echo "Launching interactive fast project creation..."
	./init-project-fast.sh

help:
	@echo "Available commands:"
	@echo "  make dev                     - Start with shared base images (default)"
	@echo "  make dev-build               - Rebuild app images, then start fast stack"
	@echo "  make dev-ultra               - Start with ultra overrides"
	@echo "  make prod                    - Start production stack"
	@echo "  make down                    - Stop all stacks"
	@echo "  make logs                    - Tail development logs"
	@echo "  make doctor                  - Preflight checks (docker/env/ports)"
	@echo "  make disk-usage              - Show Docker image/volume/cache usage"
	@echo "  make prune-safe              - Safe Docker cleanup (containers/images/cache)"
	@echo "  make cleanup-legacy-images   - Remove legacy VPT image tags"
	@echo "  make migrate                 - Run Alembic migrations"
	@echo "  make migrate-create name=X   - Create Alembic migration"
	@echo "  make auth                    - Validate local auth using .env credentials"
	@echo "  make setup-prod-env          - Configure production env file"
	@echo "  make newpro                  - Create a new project from this template"
