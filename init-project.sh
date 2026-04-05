#!/bin/bash

# Backward-compatible entry point.
# Use the fast standalone initializer for all new projects.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/init-project-fast.sh" "$@"
