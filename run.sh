#!/usr/bin/env bash
# AgroRotate — one-command launcher for Git Bash / WSL / macOS / Linux.
# Starts the local API, waits for it, then runs the web app and opens the browser.
# Ctrl+C stops both processes.
set -euo pipefail

cd "$(dirname "$0")"

API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-5173}"
API_PID=""

cleanup() {
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js was not found on PATH."
  echo "Install Node.js 18 or newer from https://nodejs.org then run this script again."
  exit 1
fi

echo "AgroRotate — v5 evidence build"
echo "Node.js $(node -v)"

if [ ! -d node_modules ]; then
  echo "Installing dependencies, this runs only once..."
  npm install
fi

if ! curl -fsS "http://127.0.0.1:${API_PORT}/api/v1/health" >/dev/null 2>&1; then
  echo "Starting local API on http://127.0.0.1:${API_PORT} ..."
  PORT="$API_PORT" node server/index.mjs >/tmp/agrorotate-api.log 2>&1 &
  API_PID=$!
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS "http://127.0.0.1:${API_PORT}/api/v1/health" >/dev/null 2>&1; then break; fi
    sleep 0.5
  done
  if ! curl -fsS "http://127.0.0.1:${API_PORT}/api/v1/health" >/dev/null 2>&1; then
    echo "[WARN] API did not answer on ${API_PORT}. The app still works offline."
    echo "       See /tmp/agrorotate-api.log"
    API_PID=""
  fi
else
  echo "Local API already running on port ${API_PORT}, reusing it."
fi

echo "Starting web app on http://127.0.0.1:${WEB_PORT} ..."
echo "Press Ctrl+C to stop."
npm run dev -- --port "$WEB_PORT" --open
