#!/bin/bash
# scripts/build-base-images.sh
# Build optimized base images for faster testing

set -e

PROJECT_SLUG="${PROJECT_SLUG:-fulldock-core}"
FRONTEND_IMAGE="${PROJECT_SLUG}-frontend-base:latest"
BACKEND_IMAGE="${PROJECT_SLUG}-backend-base:latest"

echo "[BUILD] Building ${PROJECT_SLUG} base images..."

# Build frontend base image with pre-installed dependencies
echo "📦 Building frontend base image..."
docker build -t "${FRONTEND_IMAGE}" -f docker/base/Dockerfile.frontend.base .

# Build backend base image too
echo "📦 Building backend base image..."
docker build -t "${BACKEND_IMAGE}" -f docker/Dockerfile .

echo "[DONE] Base images built successfully!"
echo "[INFO] Use 'make dev-ultra' for lightning-fast test project startup"

# Show image sizes
echo "📊 Image sizes:"
docker images | grep "${PROJECT_SLUG}-.*-base" || true
