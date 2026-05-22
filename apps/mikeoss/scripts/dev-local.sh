#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from backend/.env.example"
fi

if [[ ! -f frontend/.env.local ]]; then
  cp frontend/.env.local.example frontend/.env.local
  echo "Created frontend/.env.local from frontend/.env.local.example"
fi

if command -v supabase >/dev/null 2>&1; then
  supabase start
else
  echo "Supabase CLI not found. CounselBridge uses Supabase CLI to manage local Supabase Docker containers." >&2
  echo "Install with: brew install supabase/tap/supabase" >&2
  echo "Docker Desktop must be running when you later run supabase start." >&2
  exit 1
fi

echo
echo "Start the backend in another terminal:"
echo "  npm run dev --prefix backend"
echo
echo "Start the frontend in another terminal:"
echo "  npm run dev --prefix frontend -- -p 3002"
