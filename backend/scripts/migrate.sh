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
# - Untracked DBs (bootstrap/template): create tables from models, then stamp head.
echo "Determining migration strategy..."
HAS_ALEMBIC_VERSION=$(python3 -c "
import sys
sys.path.append('/app')
from app.db.base import engine
from sqlalchemy import inspect

inspector = inspect(engine)
print('1' if inspector.has_table('alembic_version') else '0')
")

if [ -d "alembic" ] && [ -f "alembic/env.py" ]; then
  if [ \"$HAS_ALEMBIC_VERSION\" = \"1\" ]; then
    echo "Alembic version table found. Applying migrations..."
    alembic upgrade head
  else
    echo "Alembic version table not found. Bootstrapping schema from models..."
    python3 -c "
import sys
sys.path.append('/app')
from app.db.base import Base, engine
from sqlalchemy import inspect

print('Creating all tables...')
Base.metadata.create_all(bind=engine)
inspector = inspect(engine)
print(f'📋 Tables in database: {inspector.get_table_names()}')
"
    echo "Stamping current schema as Alembic head for bootstrap database..."
    alembic stamp head
  fi
else
  echo "Alembic not configured; creating tables from models only..."
  python3 -c "
import sys
sys.path.append('/app')
from app.db.base import Base, engine

Base.metadata.create_all(bind=engine)
print('✅ Tables created successfully (no Alembic).')
"
fi

# Initialize database with admin user
echo "Initializing database..."
python3 /app/scripts/init_db.py

echo "Migration complete!"
