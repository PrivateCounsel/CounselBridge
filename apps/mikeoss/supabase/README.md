# Local Supabase

Mike can run against a local Supabase stack for development and portable testing.

## Prerequisites

- Docker Desktop
- Supabase CLI

Install the CLI with Homebrew:

```bash
brew install supabase/tap/supabase
```

Start Docker Desktop, then run from the repository root:

```bash
supabase start
supabase db reset
```

The initial database schema lives in:

```text
supabase/migrations/20260511000000_initial_schema.sql
```

## Local Env

After `supabase start`, copy the local API URL, anon key, and service role key printed by the CLI.

Use the local API URL for:

```bash
SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

Use the printed `anon key` for:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

Use the printed `service_role key` for:

```bash
SUPABASE_SECRET_KEY=...
```

Set these in:

- `backend/.env`
- `frontend/.env.local`

When using real local Supabase auth, disable the temporary auth bypass:

```bash
LOCAL_AUTH_BYPASS=false
NEXT_PUBLIC_LOCAL_AUTH_BYPASS=false
```

## Notes

Local Supabase handles authentication and Postgres data locally. File storage still depends on the app's R2/S3-compatible storage settings unless a local S3-compatible service, such as MinIO, is configured separately.
