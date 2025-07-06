#!/bin/bash
# scripts/build-base-images.sh
# Build optimized base images for faster testing

echo "🏗️ Building vadimOS base images for ultra-fast testing..."

# Build frontend base image with pre-installed dependencies
echo "📦 Building frontend base image..."
docker build -t vadim-frontend-base:latest -f docker/base/Dockerfile.frontend.base .

# Optionally build backend base image too
echo "📦 Building backend base image..."
docker build -t vadim-backend-base:latest -f docker/Dockerfile .

echo "✅ Base images built successfully!"
echo "💡 Use 'make dev-ultra' for lightning-fast test project startup"

# Show image sizes
echo "📊 Image sizes:"
docker images | grep "vadim-.*-base"