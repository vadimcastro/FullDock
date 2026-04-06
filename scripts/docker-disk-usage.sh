#!/bin/bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-$(basename "$(pwd)")}"
PROJECT_SLUG="${PROJECT_SLUG:-fulldock-core}"

echo "Docker disk usage summary"
echo "========================="
docker system df
echo
echo "Detailed image list"
echo "-------------------"
docker image ls --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'
echo
echo "Relevant images (project/slug/legacy)"
echo "-------------------------------------"
docker image ls --format '{{.Repository}}:{{.Tag}} {{.Size}}' | \
  grep -E "(${PROJECT_NAME}|${PROJECT_SLUG}|docker-api|docker-frontend)" || true
echo
echo "Top volumes by size"
echo "-------------------"
docker system df -v | awk '
  BEGIN {print_flag=0}
  /^Local Volumes space usage:/ {print_flag=1; next}
  /^Build cache usage:/ {print_flag=0}
  print_flag==1 {print}
' | sed '/^$/d'
