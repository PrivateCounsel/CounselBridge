#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIKEOSS_DIR="$ROOT_DIR/apps/mikeoss"
WITH_CLAUDE_LEGAL=0

for arg in "$@"; do
  case "$arg" in
    --with-claude-legal)
      WITH_CLAUDE_LEGAL=1
      ;;
    -h|--help)
      cat <<'HELP'
Usage: ./scripts/setup.sh [--with-claude-legal]

Installs CounselBridge dependencies and creates local env files.

Options:
  --with-claude-legal   Clone the optional Claude for Legal reference checkout
                        into references/claude-for-legal.
HELP
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

need_cmd npm
need_cmd git
if ! command -v supabase >/dev/null 2>&1; then
  cat <<'SUPABASE'
Supabase CLI was not found.

CounselBridge uses Supabase CLI to manage the local Supabase Docker containers.
Install it before starting the local app. On macOS:

  brew install supabase/tap/supabase

Docker Desktop must also be running when you later run `supabase start`.

SUPABASE
  exit 1
fi

echo "Installing MikeOSS backend dependencies..."
npm install --prefix "$MIKEOSS_DIR/backend"

echo "Installing MikeOSS frontend dependencies..."
npm install --prefix "$MIKEOSS_DIR/frontend"

if [[ -f "$ROOT_DIR/services/counselbridge-gateway/package.json" ]]; then
  echo "Installing CounselBridge gateway scaffold dependencies..."
  npm install --prefix "$ROOT_DIR/services/counselbridge-gateway"
fi

if [[ ! -f "$MIKEOSS_DIR/backend/.env" ]]; then
  cp "$MIKEOSS_DIR/backend/.env.example" "$MIKEOSS_DIR/backend/.env"
  echo "Created apps/mikeoss/backend/.env"
fi

if [[ ! -f "$MIKEOSS_DIR/frontend/.env.local" ]]; then
  cp "$MIKEOSS_DIR/frontend/.env.local.example" "$MIKEOSS_DIR/frontend/.env.local"
  echo "Created apps/mikeoss/frontend/.env.local"
fi

if [[ "$WITH_CLAUDE_LEGAL" == "1" ]]; then
  if [[ -d "$ROOT_DIR/references/claude-for-legal/.git" ]]; then
    echo "Claude for Legal reference checkout already exists."
  else
    echo "Cloning Claude for Legal reference checkout..."
    if ! git clone https://github.com/anthropics/claude-for-legal.git "$ROOT_DIR/references/claude-for-legal"; then
      cat <<'CLAUDE_LEGAL'
Claude for Legal reference checkout was not cloned.

The public upstream URL may change or may require access. CounselBridge can run
without this optional checkout; Claude Legal workflows will simply use the
built-in CounselBridge routing prompts. If you have a local checkout, set
CLAUDE_LEGAL_ROOT in apps/mikeoss/backend/.env.
CLAUDE_LEGAL
    fi
  fi
else
  cat <<'NOTE'

Claude for Legal reference files are optional but recommended for CounselBridge workflows.
After reviewing the upstream license and attribution terms, install them with:

  npm run setup:with-claude-legal

or:

  git clone https://github.com/anthropics/claude-for-legal.git references/claude-for-legal

NOTE
fi

cat <<'DONE'
Setup complete.

Next steps:
  1. Install Supabase CLI if it is not installed.
  2. Start Docker Desktop.
  3. From apps/mikeoss, run: supabase start && supabase db reset
  4. Copy local Supabase keys from: supabase status
  5. Update apps/mikeoss/backend/.env and apps/mikeoss/frontend/.env.local.
  6. Run: npm run dev:mikeoss

Detailed instructions: apps/mikeoss/LOCAL_SETUP.md
DONE
