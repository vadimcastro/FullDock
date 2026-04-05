#!/bin/bash
# scripts/build-base-images.sh
# Build optimized base images for faster testing

set -e

PROJECT_SLUG="${PROJECT_SLUG:-vpt-core}"
FRONTEND_IMAGE="${PROJECT_SLUG}-frontend-base:latest"
BACKEND_IMAGE="${PROJECT_SLUG}-backend-base:latest"

echo "🏗️ Building ${PROJECT_SLUG} base images for ultra-fast testing..."

# Build frontend base image with pre-installed dependencies
echo "📦 Building frontend base image..."
docker build -t "${FRONTEND_IMAGE}" -f docker/base/Dockerfile.frontend.base .

# Build backend base image too
echo "📦 Building backend base image..."
docker build -t "${BACKEND_IMAGE}" -f docker/Dockerfile .

echo "✅ Base images built successfully!"
echo "💡 Use 'make dev-ultra' for lightning-fast test project startup"

# Show image sizes
echo "📊 Image sizes:"
docker images | grep "${PROJECT_SLUG}-.*-base" || true
