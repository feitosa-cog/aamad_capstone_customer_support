#!/usr/bin/env bash
set -euo pipefail

# Run the backend API from the repository root.
# Usage: bash run_api.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$ROOT_DIR/agentic_customer_support"
SRC_DIR="$PACKAGE_DIR/src"

# Activate venv if available
if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.venv/bin/activate"
fi

export PYTHONPATH="$SRC_DIR"

if [ -x "$ROOT_DIR/.venv/bin/uvicorn" ]; then
  exec "$ROOT_DIR/.venv/bin/uvicorn" agentic_customer_support.api.app:app --host 127.0.0.1 --port 8000 --reload
else
  exec uvicorn agentic_customer_support.api.app:app --host 127.0.0.1 --port 8000 --reload
fi
