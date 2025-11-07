# {{PROJECT_NAME}} Makefile
# Project-specific configuration for vadimOS

# Project variables for vadimOS.mk
PROJECT_NAME = {{PROJECT_NAME}}
DROPLET_ALIAS = {{DROPLET_ALIAS}}
PRODUCTION_IP = {{PRODUCTION_IP}}

# Include universal vadimOS commands
include ../vadimOS/vadimOS.mk

# Project-specific PHONY targets
.PHONY: dev-fast auth-setup auth-setup-fast

# =============================================================================
# TEMPLATE-SPECIFIC COMMANDS
# =============================================================================

dev-fast:
	@echo "⚡ Starting FAST development environment..."
	cd docker && docker compose -f docker-compose.dev.fast.yml up --build

# =============================================================================
# TEMPLATE-SPECIFIC AUTH SETUP
# =============================================================================

setup-local-auth:
	@echo "Setting up local development authentication..."
	./scripts/setup-local-auth.sh

setup-local-auth-fast:
	@echo "Setting up local development authentication (fast mode)..."
	./scripts/setup-local-auth-fast.sh

auth-setup: setup-local-auth-fast

auth-setup-fast: setup-local-auth-fast