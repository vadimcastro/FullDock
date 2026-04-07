#!/usr/bin/env bash
set -euo pipefail

# Validates OAuth-related env vars for release readiness.
# Usage:
#   scripts/check-oauth-env.sh
#   scripts/check-oauth-env.sh path/to/.env.production.local

ENV_FILE="${1:-}"
if [ -n "$ENV_FILE" ]; then
  if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR env file not found: $ENV_FILE"
    exit 1
  fi
  # shellcheck source=/dev/null
  set -a
  . "$ENV_FILE"
  set +a
fi

failures=0

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ]; then
    echo "FAIL missing: $name"
    failures=$((failures + 1))
  else
    echo "PASS present: $name"
  fi
}

require_prefix() {
  local name="$1"
  local prefix="$2"
  local value="${!name:-}"
  if [ -n "$value" ] && [[ "$value" == "$prefix"* ]]; then
    echo "PASS format: $name starts with $prefix"
  elif [ -n "$value" ]; then
    echo "FAIL format: $name must start with $prefix"
    failures=$((failures + 1))
  fi
}

require_var GOOGLE_CLIENT_ID
require_var GOOGLE_CLIENT_SECRET
require_var GITHUB_CLIENT_ID
require_var GITHUB_CLIENT_SECRET
require_var OAUTH_REDIRECT_BASE
require_var OAUTH_POST_LOGIN_URL

require_prefix OAUTH_REDIRECT_BASE "https://"
require_prefix OAUTH_POST_LOGIN_URL "https://"

if [ "$failures" -gt 0 ]; then
  echo "OAuth env readiness check failed ($failures issue(s))."
  exit 1
fi

echo "OAuth env readiness check passed."
