#!/usr/bin/env bash
set -euo pipefail

echo "Checking MikeOSS local services..."

check() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 3 "$url" >/dev/null; then
    echo "ok   $name $url"
  else
    echo "miss $name $url"
  fi
}

check "backend" "http://localhost:3001/health"
check "frontend" "http://localhost:3002"
check "supabase" "http://127.0.0.1:54321/auth/v1/settings"
