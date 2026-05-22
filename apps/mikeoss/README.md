# MikeOSS Local

## Modified AGPL Copy Notice

This directory contains a modified copy of MikeOSS / Mike from
`Just-Mike-It/mike`, baseline commit
`469ee4adeca12d7cd9c1506c84b1e25f4859ae15`.

Modifications are maintained by Private Counsel for the CounselBridge project,
2026. See `../../CHANGES-FROM-MIKE.md` for the dated change log and
file-by-file summary. This modified copy is distributed under AGPL-3.0-only.

This repository packages the modified MikeOSS app for local testing:

- Next.js frontend
- Express backend
- Local Supabase Auth/Postgres/Storage managed by Supabase CLI

The application preserves much of the upstream MikeOSS interface and
document-workspace experience because it is a modified MikeOSS distribution.

No hosted Supabase or Cloudflare R2 is required for local app storage.

## AI And Confidentiality Warning

CounselBridge forwards user requests, chat history, document text, and related
outputs to Claude Legal-style workflow references and the configured Claude
model/API provider. It does not filter, redact, or remove confidential,
privileged, client, or sensitive information before sending that data to the
model provider.

Claude or any other model provider may produce incomplete, incorrect,
fabricated, or outdated output. Do not rely on generated legal analysis without
independent verification and review by a licensed attorney. Do not submit
confidential, privileged, client, or sensitive information to Claude or any
model provider unless you have reviewed the provider's terms, data-retention
practices, confidentiality commitments, privacy and security documentation, and
any enterprise or professional-use agreement that applies to your account.

Supabase CLI is the recommended way to start and manage the local Supabase
Docker containers. Start Docker Desktop first, then use `supabase start`,
`supabase db reset`, and `supabase status`.

Run the commands in this file from `apps/mikeoss/`. From the repository root,
prefer the root `README.md` and `npm run setup`.

## Quick Start

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
supabase start
supabase db reset
npm run dev:backend
npm run dev:frontend
```

Open:

```text
http://localhost:3002
```

See `LOCAL_SETUP.md` for complete local Supabase and Storage setup instructions.

## Checks

```bash
npm run build:backend
npm run build:frontend
```

## Privacy

Before publishing:

- Do not commit `backend/.env`
- Do not commit `frontend/.env.local`
- Do not commit `node_modules`, `.next`, `dist`, or local uploads
- Run `git status --ignored` and inspect all untracked files
