#!/bin/bash

# setup-local-auth.sh
# Sets up local development authentication

set -e

echo "🔧 setup-local-auth"
echo "📋 Checking services"

ENV_FILE=".env.development"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Missing $ENV_FILE"
    exit 1
fi

read_env_var() {
    local key="$1"
    grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d'=' -f2-
}

ADMIN_EMAIL="$(read_env_var ADMIN_EMAIL)"
ADMIN_PASSWORD="$(read_env_var ADMIN_PASSWORD)"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in $ENV_FILE"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker not running"
    exit 1
fi

# Check if development environment is running
if ! curl -s http://localhost:8000/health >/dev/null 2>&1; then
    make dev > /dev/null 2>&1 &
    sleep 30
fi
echo "📋 Testing authentication"

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ API failed to start"
    exit 1
fi

# Test login
response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${ADMIN_EMAIL}&password=${ADMIN_PASSWORD}")

if echo "$response" | grep -q "access_token"; then
    echo "📋 Testing endpoints"
    
    # Extract token for testing
    token=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    visitors=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8000/api/v1/metrics/visitors" 2>/dev/null || echo "")
    sessions=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8000/api/v1/metrics/sessions" 2>/dev/null || echo "")
    projects=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8000/api/v1/metrics/projects" 2>/dev/null || echo "")

    endpoint_count=0
    if echo "$visitors" | grep -q "total"; then endpoint_count=$((endpoint_count + 1)); fi
    if echo "$sessions" | grep -q "active"; then endpoint_count=$((endpoint_count + 1)); fi
    if echo "$projects" | grep -q "total"; then endpoint_count=$((endpoint_count + 1)); fi

    if [ $endpoint_count -ge 1 ]; then
        echo "✅ Success ($endpoint_count/3 endpoints tested successfully)"
    else
        echo "⚠️  Authentication works but endpoints may still be initializing"
    fi
    echo "📋 Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
    echo "🌐 http://localhost:3000 | 🔧 http://localhost:8000/docs"
else
    echo "❌ Authentication failed: $response"
    exit 1
fi
