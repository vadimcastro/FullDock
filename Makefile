.PHONY: dev prod down clean migrate logs format help auth-setup setup-local-auth health health-docker health-containers health-api
# Development commands
dev:
	@echo "Starting development environment..."
	cd docker && docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
dev-debug:
	@echo "Starting development environment with debug logs..."
	cd docker && docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build 2>&1 | tee debug.log
# Production commands
prod:
	@echo "Starting production environment..."
	docker compose -f docker/docker-compose.prod.yml up --build -d
prod-rebuild:
	@echo "Rebuilding and starting production environment..."
	docker compose -f docker/docker-compose.prod.yml down && docker compose -f docker/docker-compose.prod.yml build --no-cache && docker compose -f docker/docker-compose.prod.yml up -d
deploy:
	@echo "🚀 Pulling latest code and deploying..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Using branch: $(branch)"; \
		git pull origin $(branch); \
		GIT_BRANCH=$(branch) GIT_COMMIT_HASH=$$(git rev-parse HEAD) GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" make down && GIT_BRANCH=$(branch) GIT_COMMIT_HASH=$$(git rev-parse HEAD) GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" make prod; \
	else \
		echo "📡 Using branch: $$(git branch --show-current)"; \
		git pull origin $$(git branch --show-current); \
		GIT_BRANCH=$$(git branch --show-current) GIT_COMMIT_HASH=$$(git rev-parse HEAD) GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" make down && GIT_BRANCH=$$(git branch --show-current) GIT_COMMIT_HASH=$$(git rev-parse HEAD) GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" make prod; \
	fi
deploy-rebuild:
	@echo "🚀 Pulling latest code and rebuilding..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Using branch: $(branch)"; \
		git pull origin $(branch); \
		GIT_BRANCH=$(branch) GIT_COMMIT_HASH=$$(git rev-parse HEAD) GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" make prod-rebuild; \
	else \
		echo "📡 Using branch: $$(git branch --show-current)"; \
		git pull origin $$(git branch --show-current); \
		GIT_BRANCH=$$(git branch --show-current) GIT_COMMIT_HASH=$$(git rev-parse HEAD) GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" make prod-rebuild; \
	fi
# Git commands
pull:
	@echo "🔄 Pulling latest code..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Using branch: $(branch)"; \
		git pull origin $(branch); \
	else \
		echo "📡 Using branch: $$(git branch --show-current)"; \
		git pull origin $$(git branch --show-current); \
	fi
clean-branches:
	@echo "🧹 Cleaning local branches (keeping master)..."
	@current_branch=$$(git branch --show-current); \
	if [ "$$current_branch" != "master" ]; then \
		echo "⚠️  Currently on branch: $$current_branch"; \
		echo "   Switching to master first..."; \
		git checkout master; \
	fi
	@echo "🗑️  Deleting merged branches..."
	@git branch --merged master | grep -v '^\*\|master' | xargs -n 1 -r git branch -d || true
	@echo "🗑️  Deleting unmerged branches (excluding current)..."
	@git branch | grep -v '^\*\|master' | xargs -n 1 -r git branch -D || true
	@echo "✅ Local branch cleanup complete!"
droplet-clean-branches:
	@echo "🧹 Cleaning droplet branches (keeping master)..."
	@ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && \
		current_branch=$$(git branch --show-current); \
		if [ "$$current_branch" != "master" ]; then \
			echo "⚠️  Currently on branch: $$current_branch"; \
			echo "   Switching to master first..."; \
			git checkout master; \
		fi && \
		echo "🗑️  Deleting merged branches..." && \
		git branch --merged master | grep -v "^\*\|master" | xargs -n 1 -r git branch -d || true && \
		echo "🗑️  Deleting unmerged branches..." && \
		git branch | grep -v "^\*\|master" | xargs -n 1 -r git branch -D || true && \
		echo "✅ Droplet branch cleanup complete!"'


# Droplet management
droplet:
	@echo "Connecting to DigitalOcean Droplet..."
	ssh {{DROPLET_ALIAS}}
droplet-logs:
	@echo "Viewing API logs on droplet..."
	ssh {{DROPLET_ALIAS}} "docker logs docker-api-1 | tail -20"
droplet-force-rebuild:
	@echo "Force rebuilding on droplet..."
	ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && docker compose -f docker/docker-compose.prod.yml down && docker system prune -f && docker compose -f docker/docker-compose.prod.yml build --no-cache && docker compose -f docker/docker-compose.prod.yml up -d"
droplet-clean-rebuild:
	@echo "🧹 Clean rebuilding on droplet (clears all caches)..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Using branch: $(branch)"; \
		ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && git fetch origin && git checkout $(branch) && git pull origin $(branch) && docker compose -f docker/docker-compose.prod.yml down && docker system prune -af && docker builder prune -af && docker compose -f docker/docker-compose.prod.yml build --no-cache --pull && docker compose -f docker/docker-compose.prod.yml up -d'; \
	else \
		LOCAL_BRANCH=$$(git branch --show-current); \
		echo "📡 Using branch: $$LOCAL_BRANCH"; \
		ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && git fetch origin && git checkout $$LOCAL_BRANCH && git pull origin $$LOCAL_BRANCH && docker compose -f docker/docker-compose.prod.yml down && docker system prune -af && docker builder prune -af && docker compose -f docker/docker-compose.prod.yml build --no-cache --pull && docker compose -f docker/docker-compose.prod.yml up -d"; \
	fi
	@echo "✅ Clean rebuild complete!"
	@echo "🌐 Frontend: http://{{PRODUCTION_IP}}:3000"
	@echo "🔧 API: http://{{PRODUCTION_IP}}:8000"
droplet-debug:
	@echo "Running debug commands on droplet..."
	ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && echo '=== Container Status ===' && docker ps && echo '=== API Logs ===' && docker logs docker-api-1 | tail -10 && echo '=== Environment Check ===' && docker exec -it docker-api-1 printenv | grep -E '(ENVIRONMENT|POSTGRES_DB)' && echo '=== CORS Middleware ===' && docker logs docker-api-1 | grep -i 'Adding CORS middleware'"
droplet-deploy:
	@echo "🚀 Starting automated droplet deployment..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Deploying branch: $(branch)"; \
		ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && git fetch origin && git checkout $(branch) && git pull origin $(branch) && export GIT_BRANCH=$(branch) && export GIT_COMMIT_HASH=$$(git rev-parse HEAD) && export GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" && export GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" && docker compose -f docker/docker-compose.prod.yml down && docker compose -f docker/docker-compose.prod.yml up --build -d'; \
	else \
		LOCAL_BRANCH=$$(git branch --show-current); \
		echo "📡 Deploying branch: $$LOCAL_BRANCH"; \
		ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && git fetch origin && git checkout $$LOCAL_BRANCH && git pull origin $$LOCAL_BRANCH && export GIT_BRANCH=$$LOCAL_BRANCH && export GIT_COMMIT_HASH=\$$(git rev-parse HEAD) && export GIT_COMMIT_MESSAGE=\"\$$(git log -1 --pretty=%B)\" && export GIT_COMMIT_DATE=\"\$$(git log -1 --format=%ci)\" && docker compose -f docker/docker-compose.prod.yml down && docker compose -f docker/docker-compose.prod.yml up --build -d"; \
	fi
	@echo "✅ Deployment complete!"
	@echo "🌐 Frontend: http://{{PRODUCTION_IP}}:3000"
	@echo "🔧 API: http://{{PRODUCTION_IP}}:8000"
	@echo "📊 Check logs: ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && docker compose -f docker/docker-compose.prod.yml logs -f'"
droplet-status:
	@echo "Checking droplet status..."
	ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && docker compose -f docker/docker-compose.prod.yml ps && docker logs docker-api-1 | tail -5"
droplet-deep-clean:
	@echo "🧹 Starting comprehensive droplet maintenance..."
	@echo "📊 Before cleanup:"
	@ssh {{DROPLET_ALIAS}} 'df -h | head -2'
	@echo ""
	@echo "🐳 Cleaning Docker system..."
	@ssh {{DROPLET_ALIAS}} 'docker system prune -af && docker volume prune -f && docker builder prune -af'
	@echo "📝 Cleaning logs..."
	@ssh {{DROPLET_ALIAS}} 'journalctl --vacuum-time=7d && docker container prune -f'
	@echo "🔄 Updating system packages..."
	@ssh {{DROPLET_ALIAS}} 'apt update && apt upgrade -y && apt autoremove -y && apt autoclean'
	@echo "📊 After cleanup:"
	@ssh {{DROPLET_ALIAS}} 'df -h | head -2 && echo "=== Docker Usage ===" && docker system df'
	@echo "✅ Deep clean complete!"
droplet-disk-usage:
	@echo "💾 Checking droplet disk usage..."
	@ssh {{DROPLET_ALIAS}} 'df -h && echo "=== Docker Usage ===" && docker system df'
droplet-quick-deploy:
	@echo "⚡ Quick deployment to droplet (uses cache)..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Using branch: $(branch)"; \
		ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && git fetch origin && git checkout $(branch) && git pull origin $(branch) && export GIT_BRANCH=$(branch) && export GIT_COMMIT_HASH=$$(git rev-parse HEAD) && export GIT_COMMIT_MESSAGE="$$(git log -1 --pretty=%B)" && export GIT_COMMIT_DATE="$$(git log -1 --format=%ci)" && docker compose -f docker/docker-compose.prod.yml up --build -d'; \
	else \
		LOCAL_BRANCH=$$(git branch --show-current); \
		echo "📡 Using branch: $$LOCAL_BRANCH"; \
		ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && git fetch origin && git checkout $$LOCAL_BRANCH && git pull origin $$LOCAL_BRANCH && export GIT_BRANCH=$$LOCAL_BRANCH && export GIT_COMMIT_HASH=\$$(git rev-parse HEAD) && export GIT_COMMIT_MESSAGE=\"\$$(git log -1 --pretty=%B)\" && export GIT_COMMIT_DATE=\"\$$(git log -1 --format=%ci)\" && docker compose -f docker/docker-compose.prod.yml up --build -d"; \
	fi
	@echo "⚡ Quick deployment complete!"
	@echo "🌐 Frontend: http://{{PRODUCTION_IP}}:3000"
	@echo "🔧 API: http://{{PRODUCTION_IP}}:8000"
droplet-quick-rebuild:
	@echo "🚀 Quick rebuild on droplet (partial cache clear)..."
	@if [ -n "$(branch)" ]; then \
		echo "📡 Using branch: $(branch)"; \
		ssh {{DROPLET_ALIAS}} 'cd {{PROJECT_NAME}} && git fetch origin && git checkout $(branch) && git pull origin $(branch) && docker compose -f docker/docker-compose.prod.yml down && docker image prune -f && docker compose -f docker/docker-compose.prod.yml build && docker compose -f docker/docker-compose.prod.yml up -d'; \
	else \
		LOCAL_BRANCH=$$(git branch --show-current); \
		echo "📡 Using branch: $$LOCAL_BRANCH"; \
		ssh {{DROPLET_ALIAS}} "cd {{PROJECT_NAME}} && git fetch origin && git checkout $$LOCAL_BRANCH && git pull origin $$LOCAL_BRANCH && docker compose -f docker/docker-compose.prod.yml down && docker image prune -f && docker compose -f docker/docker-compose.prod.yml build && docker compose -f docker/docker-compose.prod.yml up -d"; \
	fi
	@echo "🚀 Quick rebuild complete!"
	@echo "🌐 Frontend: http://{{PRODUCTION_IP}}:3000"
	@echo "🔧 API: http://{{PRODUCTION_IP}}:8000"
setup-prod-env:
	@echo "Setting up production environment..."
	./scripts/setup-production-env.sh
setup-local-auth:
	@echo "Setting up local development authentication..."
	./scripts/setup-local-auth.sh
auth-setup: setup-local-auth
# Database commands
migrate:
	@echo "Running migrations..."
	docker compose exec api alembic upgrade head
migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: Migration name not provided. Use 'make migrate-create name=your_migration_name'"; \
		exit 1; \
	fi
	@echo "Creating new migration: $(name)"
	docker compose exec api alembic revision --autogenerate -m "$(name)"
# Cleanup commands
down:
	@echo "Stopping containers..."
	@if docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml ps -q 2>/dev/null | grep -q .; then \
		echo "Stopping development containers..."; \
		cd docker && docker compose -f docker-compose.yml -f docker-compose.dev.yml down; \
	elif docker compose -f docker/docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then \
		echo "Stopping production containers..."; \
		docker compose -f docker/docker-compose.prod.yml down; \
	else \
		echo "No containers running"; \
	fi
clean:
	@echo "Cleaning up development environment..."
	docker system prune -f
	rm -rf frontend/.next frontend/node_modules
clean-all: clean
	@echo "Removing volumes and rebuilding..."
	@if docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml ps -q 2>/dev/null | grep -q .; then \
		cd docker && docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v; \
	else \
		docker compose -f docker/docker-compose.prod.yml down -v; \
	fi
# Utility commands
logs:
	@echo "Showing logs..."
	docker compose logs -f
format:
	@echo "Formatting code..."
	cd frontend && npm run format
	cd backend && black .
# Help command
help:
	@echo "🚀 {{PROJECT_NAME}} Development Commands"
	@echo ""
	@echo "📱 Development:"
	@echo "  make dev                    - Start development environment"
	@echo "  make dev-debug              - Start with debug logging"
	@echo "  make format                 - Format code (Prettier + Black)"
	@echo "  make setup-local-auth       - Configure local authentication"
	@echo "  make logs                   - Show container logs"
	@echo "  make clean                  - Clean up environment"
	@echo ""
	@echo "🏠 Local Production:"
	@echo "  make prod                   - Start production environment locally"
	@echo "  make prod-rebuild           - Rebuild production environment locally"
	@echo "  make deploy                 - Deploy locally"
	@echo "  make deploy-rebuild         - Deploy with rebuild locally"
	@echo ""
	@echo "☁️ Droplet:"
	@echo "  make droplet                - SSH into production server"
	@echo "  make droplet-deploy         - Deploy current branch to production"
	@echo "  make droplet-deploy branch=X- Deploy specific branch to production"
	@echo "  make droplet-quick-deploy   - ⚡ Quick deploy (uses cache for testing)"
	@echo "  make droplet-quick-rebuild  - 🚀 Quick rebuild (partial cache clear)"
	@echo "  make droplet-clean-rebuild  - Clean rebuild on droplet"
	@echo "  make droplet-clean-rebuild branch=X - Clean rebuild specific branch"
	@echo "  make droplet-force-rebuild  - Force rebuild on droplet"
	@echo "  make droplet-status         - Check production status"
	@echo "  make droplet-logs           - View droplet API logs"
	@echo "  make droplet-debug          - Debug droplet status"
	@echo "  make droplet-deep-clean     - Comprehensive maintenance (cleanup + logs + updates)"
	@echo "  make droplet-disk-usage     - Check disk usage and Docker stats"
	@echo ""
	@echo "🔄 Git:"
	@echo "  make pull                   - Pull latest code (current branch)"
	@echo "  make pull branch=X          - Pull from specific branch"
	@echo "  make clean-branches         - Delete all non-master branches locally"
	@echo "  make droplet-clean-branches - Delete all non-master branches on droplet"
	@echo ""
	@echo "🗄️ Database:"
	@echo "  make migrate                - Run migrations"
	@echo "  make migrate-create name=X  - Create new migration"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make down                   - Stop containers"
	@echo "  make clean                  - Clean up environment"
	@echo ""
	@echo "⚙️ Setup:"
	@echo "  make setup-prod-env         - Set up production environment"
	@echo "  make setup-local-auth       - Configure local authentication"
	@echo ""
	@echo "🏥 Health Checks:"
	@echo "  make health                 - Comprehensive system health check"
	@echo "  make health-docker          - Docker installation & daemon check"
	@echo "  make health-containers      - Running containers status"
	@echo "  make health-api             - API endpoints availability"

# Health check commands
health:
	@echo "🏥 Running comprehensive health check..."
	@./scripts/docker-health.sh && health
health-docker:
	@echo "🐳 Checking Docker health..."
	@./scripts/docker-health.sh && health_docker
health-containers:
	@echo "📦 Checking container health..."
	@./scripts/docker-health.sh && health_containers
health-api:
	@echo "🌐 Checking API health..."
	@./scripts/docker-health.sh && health_api