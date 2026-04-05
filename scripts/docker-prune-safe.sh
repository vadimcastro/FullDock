#!/bin/bash
set -euo pipefail

echo "Safe Docker prune (non-destructive defaults)"
echo "============================================"
echo "Will remove:"
echo "- dangling/unreferenced images"
echo "- old build cache (older than 7 days)"
echo "- stopped containers"
echo

docker system df
echo

docker container prune -f >/dev/null || true
docker image prune -f >/dev/null || true
docker builder prune -f --filter "until=168h" >/dev/null || true

echo
echo "After prune:"
docker system df
echo
echo "Done."
