# Project Context

Project: **CounselBridge**  
Organization: **Private Counsel**  
Authors: **Private Counsel**

## Purpose

Build a clean public-use integration that lets users keep the MikeOSS experience while routing legal-assistant work through Claude Legal-style workflows.

## Version 1 Scope

Version 1 is Claude-based and hosted/API-based.

## Design Principle

Keep MikeOSS as the application and document workspace. Keep agent orchestration outside MikeOSS behind a gateway/service boundary.

## Initial Structure

```text
apps/mikeoss/       Clean MikeOSS copy
services/           CounselBridge gateway scaffold
docs/               Plans and project context
references/         Reviewed third-party references only
```

## Where The Code Lives

- Workflow registry and Claude Legal-style reference loading:
  `apps/mikeoss/backend/src/lib/counselbridge.ts`
- MikeOSS chat routing into CounselBridge:
  `apps/mikeoss/backend/src/routes/chat.ts`
- Frontend workflow list and metadata:
  `apps/mikeoss/frontend/src/app/components/workflows/WorkflowList.tsx`
- Standalone gateway scaffold:
  `services/counselbridge-gateway/src/index.ts`

## Required Environment Variables

Core MikeOSS local setup uses the example files in:

- `apps/mikeoss/backend/.env.example`
- `apps/mikeoss/frontend/.env.local.example`

CounselBridge-specific backend variables:

- `COUNSELBRIDGE_ENABLED`
- `COUNSELBRIDGE_ROUTE_ALL`
- `COUNSELBRIDGE_CLAUDE_MODEL`
- `CLAUDE_LEGAL_ROOT`

The standalone gateway scaffold uses:

- `ANTHROPIC_API_KEY`
- `COUNSELBRIDGE_CLAUDE_MODEL`
- `COUNSELBRIDGE_MAX_TOKENS`
- `PORT`
- `HOST`

## How To Add A Workflow

Add workflow metadata to `WORKFLOW_DEFINITIONS` in
`apps/mikeoss/backend/src/lib/counselbridge.ts`. Use a stable MikeOSS workflow
ID, map it to a Claude Legal-style plugin and skills, then confirm the frontend
workflow list displays the same ID and practice area. Keep output in
MikeOSS-native chat events and document artifacts.

## Integration Shape

```text
MikeOSS UI
  -> MikeOSS backend
    -> CounselBridge workflow registry
      -> Claude API / Claude Legal plugin references
      -> MikeOSS-native chat events and downloadable documents
```

The gateway should return normal chat/document outputs in a format MikeOSS can consume with minimal changes.

## Current Workflow Direction

CounselBridge should be a generic workflow runner, not an NDA-specific bridge. MikeOSS should list Claude Legal workflows directly. When a user selects one, CounselBridge maps that workflow ID to a Claude Legal plugin package and selected skill references, then returns MikeOSS-native chat events and downloadable documents.

Current public workflow menu:

- Claude Legal - Commercial Review
- Claude Legal - Corporate
- Claude Legal - Litigation
- Claude Legal - Employment
- Claude Legal - Privacy
- Claude Legal - AI Governance
- Claude Legal - IP
- Claude Legal - Product
- Claude Legal - Regulatory
- Claude Legal - Legal Clinic
- Claude Legal - Law Student

Focused test workflows:

- Claude Legal - NDA Review
- Claude Legal - Vendor Agreement Review
- Claude Legal - SaaS MSA Review
- Claude Legal - DPA Review
