#!/usr/bin/env bash
set -euo pipefail

# Helper script to run the backend API in development.
# Run from the repository root (one level above this folder):
# bash agentic_customer_support/scripts/run_api.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT_DIR/.." && pwd)"

# Ensure venv is activated if present
if [ -f "$REPO_ROOT/.venv/bin/activate" ]; then
  # shellcheck disable=SC1090
  source "$REPO_ROOT/.venv/bin/activate"
fi

export PYTHONPATH="$ROOT_DIR/src"

# Use the venv uvicorn if available
if [ -x "$REPO_ROOT/.venv/bin/uvicorn" ]; then
  exec "$REPO_ROOT/.venv/bin/uvicorn" agentic_customer_support.api.app:app --host 127.0.0.1 --port 8000 --reload
else
  exec uvicorn agentic_customer_support.api.app:app --host 127.0.0.1 --port 8000 --reload
fi
