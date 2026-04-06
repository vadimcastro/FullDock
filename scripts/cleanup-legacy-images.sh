#!/bin/bash
set -euo pipefail

echo "Cleaning legacy image tags"
echo "=========================="
echo "Targets:"
echo "- legacy-frontend-base:latest"
echo "- legacy-backend-base:latest"
echo "- docker-api:latest"
echo "- docker-frontend:latest"
echo

for image in \
  "legacy-frontend-base:latest" \
  "legacy-backend-base:latest" \
  "docker-api:latest" \
  "docker-frontend:latest"; do
  if docker image inspect "$image" >/dev/null 2>&1; then
    echo "Removing $image"
    docker image rm "$image" >/dev/null || true
  else
    echo "Skipping $image (not present)"
  fi
done

echo
echo "Remaining base images:"
docker image ls --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep -E '(fulldock-core-.*-base|vpt-core-.*-base)' || true
