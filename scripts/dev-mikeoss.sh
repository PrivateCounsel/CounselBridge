#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIKEOSS_DIR="$ROOT_DIR/apps/mikeoss"

if [[ ! -f "$MIKEOSS_DIR/backend/.env" || ! -f "$MIKEOSS_DIR/frontend/.env.local" ]]; then
  echo "Missing env files. Run npm run setup first." >&2
  exit 1
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting MikeOSS backend on http://localhost:3001"
npm run dev --prefix "$MIKEOSS_DIR/backend" &
BACKEND_PID=$!

echo "Starting MikeOSS frontend on http://localhost:3002"
npm run dev --prefix "$MIKEOSS_DIR/frontend" -- -p 3002 &
FRONTEND_PID=$!

echo
echo "CounselBridge MikeOSS is starting."
echo "Open: http://localhost:3002"
echo "Press Ctrl-C to stop both processes."

wait "$BACKEND_PID" "$FRONTEND_PID"
