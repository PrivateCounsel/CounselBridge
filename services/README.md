# Services

CounselBridge service scaffolds live here.

Current shipped scaffold:

```text
services/counselbridge-gateway/
```

The current gateway is a narrow workflow scaffold, not the authoritative
Version 1 runtime. It exposes:

```text
GET  /health
POST /v1/workflows/nda-review
```

The authoritative Version 1 MikeOSS integration lives in:

```text
apps/mikeoss/backend/src/lib/counselbridge.ts
```

An OpenAI-compatible gateway is deferred and should be documented separately
before it is implemented.
