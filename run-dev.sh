#!/usr/bin/env bash
# Dual Development Server Launcher: FastAPI Backend + Next.js Frontend

set -e

echo "================================================================="
echo "Kinga Binti — Community Narrative Monitor (Narok & Kajiado Counties)"
echo "================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-activate venv inside script if present
if [ -f "${ROOT_DIR}/backend/venv/bin/activate" ]; then
  source "${ROOT_DIR}/backend/venv/bin/activate"
elif [ -f "${ROOT_DIR}/venv/bin/activate" ]; then
  source "${ROOT_DIR}/venv/bin/activate"
fi

if [ -x "${ROOT_DIR}/backend/venv/bin/python" ]; then 
  PYTHON_BIN="${ROOT_DIR}/backend/venv/bin/python"
elif [ -x "${ROOT_DIR}/venv/bin/python" ]; then
  PYTHON_BIN="${ROOT_DIR}/venv/bin/python"
else 
  PYTHON_BIN="python3"
fi

export PYTHONPATH="${ROOT_DIR}:${ROOT_DIR}/backend"
cd "${ROOT_DIR}"

# Kill anything stale on our ports
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT:-8000}/tcp" 2>/dev/null || true
fi

# 1. Start FastAPI backend in background
echo "[1/2] Launching FastAPI Backend on http://${HOST:-127.0.0.1}:${PORT:-8000}... (override with HOST/PORT)"
"${PYTHON_BIN}" -m uvicorn backend.app.main:app --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}" --reload --reload-exclude 'backend/narratives_meta.db' --reload-exclude 'backend/narratives_docs.json' --reload-exclude 'backend/*.db' --reload-exclude 'backend/*.json' &
BACKEND_PID=$!

trap "echo 'Stopping servers...'; kill $BACKEND_PID 2>/dev/null || true; exit 0" SIGINT SIGTERM EXIT

# Wait until backend answers healthcheck (longer timeout for first model download)
echo "Waiting for backend health (first run may download ~1GB model, can take 5-10 min)..."
for i in $(seq 1 600); do
  if curl -sf "http://${HOST:-127.0.0.1}:${PORT:-8000}/api/health" >/dev/null 2>&1 || curl -sf "http://${HOST:-127.0.0.1}:${PORT:-8000}/docs" >/dev/null 2>&1; then
    echo "Backend is up."
    break
  fi
  if [ "$i" -eq 600 ]; then
    echo "ERROR: backend did not answer after 600s. Check logs above." >&2
    exit 1
  fi
  sleep 1
done

# 2. Start Next.js frontend (skip upgrade prompt)
echo "[2/2] Launching Next.js Frontend on http://localhost:3000..."
cd "${ROOT_DIR}/frontend"
# Run dev without interactive upgrade prompt
npm run dev -- --no-interactive 2>/dev/null || npm run dev

wait $BACKEND_PID