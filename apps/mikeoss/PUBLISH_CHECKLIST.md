# Publish Checklist

Use this before pushing the repo to GitHub.

## Expected Shape

This repo should be a fork-ready local edition, not a patch package. A user should be able to:

1. Clone this repo.
2. Read `README.md` and `LOCAL_SETUP.md`.
3. Start local Supabase.
4. Start the backend and frontend.
5. Start only the services documented in the root README and `LOCAL_SETUP.md`.

## Do Not Publish

Confirm these are absent:

- `apps/mikeoss/backend/.env`
- `apps/mikeoss/frontend/.env.local`
- `references/claude-for-legal/`
- `node_modules/`
- `.next/`
- `dist/`
- uploaded documents
- private API keys

## Commands

```bash
find . -maxdepth 6 -type f \( -name '.env' -o -name '.env.local' \) -print
rg 'sk-|AIza|BEGIN PRIVATE|sb_secret_|cloudflarestorage|r2.cloudflarestorage' .
git status --ignored
```
