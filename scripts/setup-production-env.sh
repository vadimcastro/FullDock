#!/bin/bash

# Production Environment Setup Script
# This script helps you create secure production environment configuration

set -e  # Exit on any error

echo "🔐 Production Environment Setup"
echo "==============================="
echo

# Check if production env file already exists
if [ -f ".env.production.local" ]; then
    echo "⚠️  .env.production.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Edit .env.production.local manually if needed."
        exit 1
    fi
fi

echo "🔑 Generating secure secrets..."

# Generate secrets
DB_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 48)
JWT_SECRET_KEY=$(openssl rand -base64 48)
SUGGESTED_ADMIN_PASSWORD=$(openssl rand -base64 24)

echo "✅ Secrets generated successfully!"
echo

# Get user inputs
echo "👤 Admin User Configuration:"
read -p "Admin Email [{{ADMIN_EMAIL}}]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-{{ADMIN_EMAIL}}}

echo
echo "🔒 Admin Password Options:"
echo "1) Use generated password: $SUGGESTED_ADMIN_PASSWORD"
echo "2) Enter your own password"
read -p "Choose option (1/2) [1]: " PASSWORD_OPTION
PASSWORD_OPTION=${PASSWORD_OPTION:-1}

if [ "$PASSWORD_OPTION" = "2" ]; then
    read -s -p "Enter admin password: " ADMIN_PASSWORD
    echo
    read -s -p "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
    echo
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo "❌ Passwords don't match!"
        exit 1
    fi
    if [ ${#ADMIN_PASSWORD} -lt 12 ]; then
        echo "❌ Admin password must be at least 12 characters."
        exit 1
    fi
else
    ADMIN_PASSWORD=$SUGGESTED_ADMIN_PASSWORD
fi

read -p "Admin Username [{{ADMIN_USERNAME}}]: " ADMIN_USERNAME
ADMIN_USERNAME=${ADMIN_USERNAME:-{{ADMIN_USERNAME}}}

read -p "Admin Display Name [{{ADMIN_NAME}}]: " ADMIN_NAME
ADMIN_NAME=${ADMIN_NAME:-"{{ADMIN_NAME}}"}

echo
read -p "Allowed CORS origins (comma-separated, e.g. https://app.example.com) []: " CORS_ORIGINS
if [ -z "$CORS_ORIGINS" ]; then
    echo "❌ CORS_ORIGINS is required for production setup."
    exit 1
fi

if [[ "$CORS_ORIGINS" == *"localhost"* ]] || [[ "$CORS_ORIGINS" == *"127.0.0.1"* ]] || [[ "$CORS_ORIGINS" == *"0.0.0.0"* ]] || [[ "$CORS_ORIGINS" == *"*"* ]]; then
    echo "❌ CORS_ORIGINS cannot contain localhost or wildcard values in production."
    exit 1
fi

echo
echo "📝 Creating .env.production.local..."

# Create the production environment file
cat > .env.production.local << EOF
# 🔒 PRODUCTION SECRETS - Keep this file secure!
# Generated on $(date)

# Database - Strong credentials
POSTGRES_USER={{PROJECT_NAME}}_prod
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB={{PROJECT_NAME}}_prod
POSTGRES_HOST=db

# Redis
REDIS_URL=redis://redis:6379/1

# Security - Generated unique secrets
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=14
AUTH_MAX_FAILED_ATTEMPTS=5
AUTH_FAILED_WINDOW_SECONDS=300
AUTH_LOCKOUT_SECONDS=900

# Admin User
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_NAME=$ADMIN_NAME

# Environment
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=$CORS_ORIGINS
EOF

echo "✅ .env.production.local created successfully!"
echo

echo "📝 Creating missing alembic env.py file..."

# Create the alembic env.py file if it doesn't exist
mkdir -p backend/alembic
cat > backend/alembic/env.py << 'ENVEOF'
# backend/alembic/env.py
import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Append the parent directory to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Now we can import our app modules
from app.core.config import settings
from app.db.base import Base

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

def get_url():
    return settings.DATABASE_URL

def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
ENVEOF

echo "✅ alembic env.py created successfully!"
echo

echo "🗄️ Running database migrations..."

# Check if containers are running and run migrations
if docker compose ps api >/dev/null 2>&1; then
    echo "API service found, running migrations..."
    docker compose exec -T api bash -c "cd /app && alembic upgrade head" || echo "Migrations failed, run manually after deployment"
    echo "Initializing database with admin user..."
    docker compose exec -T api python3 /app/scripts/init_db.py || echo "Database init failed, run manually after deployment"
    echo "✅ Database setup complete!"
else
    echo "⚠️  API container not running. After deployment, run:"
    echo "   docker compose exec -T api bash -c 'cd /app && alembic upgrade head'"
    echo "   docker compose exec -T api python3 /app/scripts/init_db.py"
fi
echo

# Security reminders
echo "🛡️  Security Reminders:"
echo "• Your .env.production.local file is git-ignored (secure)"
echo "• Database password: $DB_PASSWORD"
echo "• Admin password: $ADMIN_PASSWORD"
echo "• Store these passwords in your password manager!"
echo

# Show next steps
echo "🚀 Next Steps:"
echo "1. Save the passwords above in your password manager"
echo "2. Deploy your application: make deploy"
echo "3. If migrations didn't run automatically, run them manually after deployment"
echo "4. Test login at: http://{{PRODUCTION_IP}}:3000"
echo

# Offer to show the file
read -p "Do you want to review the generated .env.production.local file? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo
    echo "📄 Generated .env.production.local:"
    echo "=================================="
    cat .env.production.local
fi

echo
echo "🎉 Production environment setup complete!"
echo "Run 'make deploy' to deploy with your new secure configuration."
