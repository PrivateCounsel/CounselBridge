# CounselBridge Integration Spec

This document captures the current public Version 1 integration contract.

## MikeOSS Adapter

The MikeOSS backend owns user authentication, projects, documents, chat
history, and downloadable artifacts. CounselBridge logic maps selected
workflows to Claude Legal-style plugin and skill references, then returns
MikeOSS-native events.

Authoritative code:

- `apps/mikeoss/backend/src/lib/counselbridge.ts`
- `apps/mikeoss/backend/src/routes/chat.ts`

## Gateway Scaffold

The standalone scaffold is intentionally narrow:

- `GET /health`
- `POST /v1/workflows/nda-review`

It is not the authoritative Version 1 runtime. It exists to preserve a clean
future service boundary.

## Output Shape

Workflow output should include:

- chat-ready markdown
- downloadable document artifacts when requested
- source and verification metadata
- attorney-review disclaimers
