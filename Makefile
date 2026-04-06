# OnDeck 2.0.0 — Makefile

PROJECT_NAME  = OnDeck
PROJECT_SLUG  = ondeck
COMPOSE       = COMPOSE_PROJECT_NAME=$(PROJECT_SLUG) docker compose
DEV_COMPOSE   = $(COMPOSE) -f docker/docker-compose.dev.yml
PROD_COMPOSE  = $(COMPOSE) -f docker/docker-compose.prod.yml

.PHONY: dev dev-build down logs clean clean-all \
        migrate migrate-create shell-api shell-db \
        help doctor

# ──────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────

dev:
	@echo "▶ Starting OnDeck 2.0.0 dev environment..."
	$(DEV_COMPOSE) up

dev-build:
	@echo "▶ Rebuilding images and starting OnDeck 2.0.0..."
	$(DEV_COMPOSE) up --build

down:
	@echo "▶ Stopping all containers..."
	-$(DEV_COMPOSE) down --remove-orphans
	-$(PROD_COMPOSE) down --remove-orphans

clean-all:
	@echo "▶ Removing containers + volumes (fresh start)..."
	$(DEV_COMPOSE) down -v --remove-orphans

logs:
	$(DEV_COMPOSE) logs -f

logs-frontend:
	$(DEV_COMPOSE) logs -f frontend

logs-api:
	$(DEV_COMPOSE) logs -f api

# ──────────────────────────────────────────────
# Database / Migrations
# ──────────────────────────────────────────────

migrate:
	$(DEV_COMPOSE) exec api alembic upgrade head

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: provide migration name: make migrate-create name=add_column"; \
		exit 1; \
	fi
	$(DEV_COMPOSE) exec api alembic revision --autogenerate -m "$(name)"

# ──────────────────────────────────────────────
# Shells
# ──────────────────────────────────────────────

shell-api:
	$(DEV_COMPOSE) exec api sh

shell-db:
	$(DEV_COMPOSE) exec db psql -U postgres ondeck

shell-frontend:
	$(DEV_COMPOSE) exec frontend sh

# ──────────────────────────────────────────────
# Production
# ──────────────────────────────────────────────

prod:
	@echo "▶ Starting production environment..."
	$(PROD_COMPOSE) up --build -d

# ──────────────────────────────────────────────
# Maintenance
# ──────────────────────────────────────────────

clean:
	docker system prune -f

doctor:
	@echo "▶ Docker:"; docker info --format 'Client: {{.ClientInfo.Version}}  Server: {{.ServerVersion}}' 2>/dev/null || echo "  Docker unreachable"
	@echo "▶ Node:  $(shell node -v 2>/dev/null || echo 'not found')"
	@echo "▶ npm:   $(shell npm -v 2>/dev/null || echo 'not found')"
	@echo "▶ Env:   $(shell [ -f .env.development ] && echo '.env.development ✓' || echo '.env.development MISSING')"

# ──────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────

help:
	@echo ""
	@echo "OnDeck 2.0.0 — available commands"
	@echo ""
	@echo "  Development:"
	@echo "    make dev                        Start (uses cached images)"
	@echo "    make dev-build                  Rebuild images + start"
	@echo "    make down                       Stop all containers"
	@echo "    make clean-all                  Stop + remove volumes (fresh start)"
	@echo "    make logs                       Tail all logs"
	@echo "    make logs-frontend / logs-api   Tail one service"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate                    Run pending Alembic migrations"
	@echo "    make migrate-create name=X      Auto-generate a migration"
	@echo ""
	@echo "  Shells:"
	@echo "    make shell-api                  sh inside api container"
	@echo "    make shell-db                   psql inside db container"
	@echo "    make shell-frontend             sh inside frontend container"
	@echo ""
	@echo "  Production:"
	@echo "    make prod                       Start production stack"
	@echo ""
	@echo "  Maintenance:"
	@echo "    make doctor                     Preflight environment check"
	@echo "    make clean                      docker system prune"
	@echo ""
