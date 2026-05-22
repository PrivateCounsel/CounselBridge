# CounselBridge Architecture

CounselBridge is a modified MikeOSS workspace with a narrow workflow adapter.
The public Version 1 runtime keeps MikeOSS as the application shell and routes
Claude Legal-style workflows inside the MikeOSS backend.

## Runtime Components

- `apps/mikeoss/frontend/`: Next.js user interface.
- `apps/mikeoss/backend/`: Express API, document storage, chat routing, and
  CounselBridge workflow adapter.
- `apps/mikeoss/supabase/`: local Supabase schema and seed files.
- `services/counselbridge-gateway/`: standalone gateway scaffold for future
  service-boundary work.
- `references/`: optional third-party reference checkouts excluded from git.

## Version 1 Flow

```text
MikeOSS UI
  -> MikeOSS backend
    -> CounselBridge workflow registry
      -> Claude API using configured API keys
    -> MikeOSS-native chat events and downloadable documents
```

The authoritative Version 1 workflow registry is
`apps/mikeoss/backend/src/lib/counselbridge.ts`.
