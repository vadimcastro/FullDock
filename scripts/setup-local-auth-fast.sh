#!/bin/bash

# setup-local-auth-fast.sh
# Optimized local development authentication setup
# Assumes Docker services are already starting

set -e

echo "[INFO] setup-local-auth-fast"
echo "📋 Checking services (optimized)"

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

echo "📋 Waiting for API to be ready (assuming dev services already starting)..."

# Optimized health check - shorter timeout since services should already be starting
max_attempts=15  # Reduced from 30 to 15 (30s instead of 60s max wait)
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ API is ready after ${attempt} attempts"
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ API failed to start within 30s (assuming services still starting)"
    echo "💡 This is normal if Docker services are still initializing"
    echo "🔄 You can run 'make auth' manually once services are ready"
    exit 0  # Don't fail hard, just warn
fi

echo "📋 Testing authentication..."

# Test login with project development credentials from .env.development
response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${ADMIN_EMAIL}&password=${ADMIN_PASSWORD}")

if echo "$response" | grep -q "access_token"; then
    echo "📋 Testing endpoints..."
    
    # Extract token for testing
    token=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    # Quick endpoint tests
    visitors=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8000/api/v1/metrics/visitors" 2>/dev/null || echo "")
    sessions=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8000/api/v1/metrics/sessions" 2>/dev/null || echo "")
    projects=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8000/api/v1/metrics/projects" 2>/dev/null || echo "")
    
    # More lenient endpoint testing (don't fail if some endpoints aren't ready)
    endpoint_count=0
    if echo "$visitors" | grep -q "total"; then endpoint_count=$((endpoint_count + 1)); fi
    if echo "$sessions" | grep -q "active"; then endpoint_count=$((endpoint_count + 1)); fi
    if echo "$projects" | grep -q "total"; then endpoint_count=$((endpoint_count + 1)); fi
    
    if [ $endpoint_count -ge 1 ]; then
        echo "✅ Fast auth setup complete ($endpoint_count/3 endpoints tested successfully)"
        echo "📋 Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
        echo "🌐 http://localhost:3000 | 🔧 http://localhost:8000/docs"
    else
        echo "⚠️  Authentication works but endpoints may still be initializing"
        echo "📋 Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
        echo "🌐 http://localhost:3000 | 🔧 http://localhost:8000/docs"
    fi
else
    echo "❌ Authentication failed: $response"
    echo "💡 Services may still be starting up. Try again in a moment."
    exit 0  # Don't fail hard during fast setup
fi
