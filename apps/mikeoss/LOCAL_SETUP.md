# MikeOSS Fully Local Setup

This edition runs MikeOSS locally with:

- Next.js frontend
- Express backend
- Supabase local Auth/Postgres/Storage managed by Supabase CLI

No hosted Supabase or Cloudflare R2 is required for local app storage.

Run the commands in this file from `apps/mikeoss/`. From the repository root,
use `npm run setup` and `npm run dev:mikeoss` as described in `../../README.md`.

## Prerequisites

- macOS or Linux
- Node.js 20+
- npm
- Docker Desktop
- Supabase CLI

Install Supabase CLI on macOS:

```bash
brew install supabase/tap/supabase
```

Use Supabase CLI as the user-facing control plane. Docker Desktop is still
required, but only as the runtime for the local Supabase containers. The
recommended path is `supabase start`, `supabase db reset`, and
`supabase status`, not manually starting Docker containers.

## 1. Install From `apps/mikeoss/`

```bash
npm install --prefix backend
npm install --prefix frontend
```

## 2. Create Local Env Files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

The checked-in examples are configured for the default Supabase local ports:

- API/Auth: `http://127.0.0.1:54321`
- Postgres: `127.0.0.1:54322`
- Studio: `http://127.0.0.1:54323`
- Inbucket email UI: `http://127.0.0.1:54324`

Copy the local keys printed by:

```bash
supabase status
```

Use:

- `API URL` for `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `service_role key` for `SUPABASE_SECRET_KEY`
- local S3 access/secret keys for `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`

## 3. Start Local Supabase

Start Docker Desktop first, then use Supabase CLI:

```bash
supabase start
supabase db reset
```

The included `supabase/seed.sql` creates a private local Storage bucket named `mike`.

If your Supabase CLI does not print S3 credentials, create local storage credentials from Supabase Studio at `http://127.0.0.1:54323`, then place them in `backend/.env`.

Create a private storage bucket named `mike` in Supabase Studio if it does not already exist.

If the CLI prints different local keys later, update:

- `backend/.env`
- `frontend/.env.local`

## 4. Start MikeOSS

In one terminal:

```bash
npm run dev --prefix backend
```

In another terminal:

```bash
npm run dev --prefix frontend -- -p 3002
```

Open:

```text
http://localhost:3002
```

Sign up with a local test account. Email confirmation is disabled in the local Supabase config.

## Useful Checks

Backend:

```bash
curl http://localhost:3001/health
```

Supabase Auth:

```bash
curl http://127.0.0.1:54321/auth/v1/settings
```

## Privacy Notes

Before publishing or sharing a fork:

- Do not commit `backend/.env`
- Do not commit `frontend/.env.local`
- Do not commit `node_modules`, `.next`, `dist`, or local uploads
- Run `git status --ignored` and inspect all untracked files
