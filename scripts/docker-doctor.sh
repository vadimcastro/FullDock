#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_DEV="${ROOT_DIR}/.env.development"

echo "FullDock Doctor"
echo "================"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ docker not found in PATH"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ docker daemon not reachable"
  exit 1
fi
echo "✅ docker daemon reachable"

if ! docker compose version >/dev/null 2>&1; then
  echo "❌ docker compose plugin not available"
  exit 1
fi
echo "✅ docker compose available"

if [ ! -f "${ENV_DEV}" ]; then
  echo "❌ missing .env.development"
  exit 1
fi
echo "✅ .env.development found"

if ! grep -q '^PROJECT_SLUG=' "${ENV_DEV}"; then
  echo "[WARN] PROJECT_SLUG not set in .env.development (defaulting to fulldock-core)"
else
  echo "✅ PROJECT_SLUG configured"
fi

echo
echo "Port availability snapshot (host)"
for p in 3000 8000 5432 6379; do
  if ss -ltn "( sport = :$p )" 2>/dev/null | grep -q LISTEN; then
    echo "⚠️ port $p currently in use"
  else
    echo "✅ port $p free"
  fi
done

echo
echo "Doctor check complete."
