#!/bin/bash
cd /app

# First, ensure the database exists
echo "Checking if database exists..."
python3 -c "
import psycopg2
import os
import sys

db_name = os.getenv('POSTGRES_DB', 'template')
db_user = os.getenv('POSTGRES_USER', 'postgres')
db_password = os.getenv('POSTGRES_PASSWORD', 'password')
db_host = os.getenv('POSTGRES_HOST', 'db')

try:
    # Connect to PostgreSQL server (not to specific database)
    conn = psycopg2.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database='postgres'  # Connect to default postgres database
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute(f\"SELECT 1 FROM pg_database WHERE datname = '{db_name}'\")
    exists = cursor.fetchone()
    
    if not exists:
        print(f'Creating database {db_name}...')
        cursor.execute(f'CREATE DATABASE \"{db_name}\"')
        print(f'Database {db_name} created successfully!')
    else:
        print(f'Database {db_name} already exists.')
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'Error checking/creating database: {e}')
    sys.exit(1)
"

# Migration strategy:
# - Existing DBs tracked by Alembic: apply upgrades.
# - Fresh DBs without Alembic tracking: apply full Alembic migration chain.
# - Legacy pre-Alembic DBs without version table but with app tables: stamp head.
echo "Determining migration strategy..."
DB_MIGRATION_MODE=$(python3 -c "
import sys
sys.path.append('/app')
from app.db.base import engine
from sqlalchemy import inspect

inspector = inspect(engine)
has_version = inspector.has_table('alembic_version')
if has_version:
    print('tracked')
else:
    # Legacy schema fingerprint: tables exist but DB is not Alembic-tracked.
    legacy_tables = {'users', 'prompts', 'user_settings', 'oauth_accounts'}
    existing = set(inspector.get_table_names())
    print('legacy_untracked' if existing.intersection(legacy_tables) else 'fresh_untracked')
")

if [ -d "alembic" ] && [ -f "alembic/env.py" ]; then
  if [ "$DB_MIGRATION_MODE" = "tracked" ]; then
    echo "Alembic version table found. Applying migrations..."
    alembic upgrade head
  elif [ "$DB_MIGRATION_MODE" = "fresh_untracked" ]; then
    echo "Fresh untracked DB detected. Running full Alembic migration chain..."
    alembic upgrade head
  elif [ "$DB_MIGRATION_MODE" = "legacy_untracked" ]; then
    echo "Legacy untracked DB detected. Stamping Alembic head without schema replay..."
    alembic stamp head
  else
    echo "Unknown migration mode: $DB_MIGRATION_MODE"
    exit 1
  fi
else
  echo "Alembic not configured; migration-first startup requires Alembic."
  exit 1
fi

# Initialize database with admin user
echo "Initializing database..."
python3 /app/scripts/init_db.py

echo "Migration complete!"
