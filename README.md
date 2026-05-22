# CounselBridge

**Project name:** CounselBridge  
**Organization:** Private Counsel  
**Authors:** Private Counsel  
**Copyright:** Copyright (c) 2026 Private Counsel  
**License:** GNU Affero General Public License v3.0

CounselBridge is an AGPL-3.0 public-use integration project that vendors an
adapted copy of the MikeOSS / Mike legal document assistant under
`apps/mikeoss/` and connects that MikeOSS workspace experience to Claude
Legal-style workflows.

MikeOSS / Mike remains an upstream third-party project. CounselBridge adds the
Private Counsel integration layer, workflow registry, documentation, setup
scripts, and related modifications. CounselBridge is not affiliated with or
endorsed by MikeOSS / Mike, Anthropic, or Claude for Legal. See `NOTICE` and
`CHANGES-FROM-MIKE.md` for third-party attribution and modification details.
CounselBridge preserves much of the MikeOSS interface and document-workspace
experience because it is a modified distribution of MikeOSS / Mike.

CounselBridge is a software tool, not a law firm. It does not provide legal
advice, does not create an attorney-client relationship, and all outputs should
be reviewed by a licensed attorney before use.

## AI And Confidentiality Warning

CounselBridge forwards user requests, chat history, document text, and related
outputs to Claude Legal-style workflow references and the configured Claude
model/API provider. It does not filter, redact, or remove confidential,
privileged, client, or sensitive information before sending that data to the
model provider.

Claude or any other model provider may produce incomplete, incorrect,
fabricated, or outdated output, including hallucinated legal citations,
quotations, and reasoning. Users must independently verify all authorities and
have a licensed attorney review any output before relying on it.

Do not submit confidential, privileged, client, or sensitive information to
Claude or any model provider unless you have reviewed the provider's terms,
data-retention practices, confidentiality commitments, privacy and security
documentation, and any enterprise or professional-use agreement that applies to
your account. Model-provider terms may not give the same protection as an
attorney-client relationship, attorney work-product doctrine, a protective
order, or a negotiated confidentiality agreement. This project does not make
confidentiality, privilege, non-disclosure, data-security, or non-retention
guarantees for third-party APIs.

This workspace starts with a modified copy of MikeOSS and CounselBridge design
documents focused on Claude Legal-style workflows.

## Repository Layout

```text
apps/
  mikeoss/                 Clean MikeOSS application copy
docs/
  PROJECT_PLAN.md          Detailed plan for review
  PROJECT_CONTEXT.md       Short context file for future contributors/agents
references/
  README.md                Notes for external references such as Claude for Legal
services/
  counselbridge-gateway/   Standalone Claude Legal-style gateway scaffold
  README.md                Integration service notes
```

## Quick Start

Prerequisites:

- Node.js 20+
- npm
- Docker Desktop
- Supabase CLI
- git
- LibreOffice for DOCX/PDF conversion used by MikeOSS upload and download flows

CounselBridge uses **Supabase CLI** to manage the local Supabase stack. Docker
Desktop must be running because the Supabase CLI starts and manages the required
local Docker containers for Auth, Postgres, Storage, Studio, and related
services. Users should not need to run Docker containers manually.

Install Supabase CLI on macOS:

```bash
brew install supabase/tap/supabase
brew install --cask libreoffice
```

Clone and set up:

```bash
git clone https://github.com/PrivateCounsel/CounselBridge.git
cd CounselBridge
npm run setup
```

To also install the optional Claude for Legal reference checkout after reviewing
its upstream license and attribution terms:

```bash
npm run setup:with-claude-legal
```

## Optional Claude for Legal Reference Checkout

CounselBridge does not bundle or redistribute Claude for Legal plugin files.

To enable Claude Legal-style workflow references, users may separately clone
Anthropic's Claude for Legal repository, if it is publicly available or if they
otherwise have access:

```bash
git clone https://github.com/anthropics/claude-for-legal.git references/claude-for-legal
```

Claude for Legal is a third-party Anthropic project licensed under Apache-2.0.
CounselBridge reads the local checkout as optional workflow reference material.
CounselBridge is not affiliated with or endorsed by Anthropic or Claude for
Legal.

If the public URL is unavailable, CounselBridge still runs with its built-in
workflow registry. Users with a local checkout can point MikeOSS at it with
`CLAUDE_LEGAL_ROOT`.

Start local Supabase through the Supabase CLI:

```bash
cd apps/mikeoss
supabase start
supabase db reset
supabase status
```

Copy the printed local Supabase values into:

- `apps/mikeoss/backend/.env`
- `apps/mikeoss/frontend/.env.local`

Then start the app from the repository root:

```bash
npm run dev:mikeoss
```

Open:

```text
http://localhost:3002
```

After the services are running, check local endpoints:

```bash
npm run check:mikeoss
```

Detailed local setup notes are in `apps/mikeoss/LOCAL_SETUP.md`.

## Version 1 Goal

Give users the familiar MikeOSS document/chat experience while using Claude Legal-style workflows behind the scenes.

MikeOSS should remain the primary UI:

- projects
- document upload and review
- chat interface
- generated downloadable documents
- user/session management

The Claude integration should live behind a clean service boundary so MikeOSS does not become a tangled agent runtime.

## Current V1 Code Path

The first runnable path is gated behind MikeOSS backend environment variables:

```text
COUNSELBRIDGE_ENABLED=false
COUNSELBRIDGE_ROUTE_ALL=false
COUNSELBRIDGE_CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_LEGAL_ROOT=../../../references/claude-for-legal
```

Set `COUNSELBRIDGE_ENABLED=true` after configuring `ANTHROPIC_API_KEY` or user
Claude credentials in MikeOSS. When enabled, MikeOSS project chat routes
CounselBridge workflow requests through a generic Claude Legal plugin adapter.
The adapter reads the uploaded/project document, applies a workflow registry,
routes the selected MikeOSS workflow to a local Claude Legal reference checkout
when present, and produces a chat response plus a downloadable Word memo using
MikeOSS's existing document-card UI.

The MikeOSS workflow list now exposes Claude Legal plugin workflows directly:

- `Claude Legal - Commercial Review`
- `Claude Legal - Corporate`
- `Claude Legal - Litigation`
- `Claude Legal - Employment`
- `Claude Legal - Privacy`
- `Claude Legal - AI Governance`
- `Claude Legal - IP`
- `Claude Legal - Product`
- `Claude Legal - Regulatory`
- `Claude Legal - Legal Clinic`
- `Claude Legal - Law Student`

The list also includes focused workflows for common document-review tests:

- `Claude Legal - NDA Review`
- `Claude Legal - Vendor Agreement Review`
- `Claude Legal - SaaS MSA Review`
- `Claude Legal - DPA Review`

These workflows do not call a separate Claude plugin runtime yet. CounselBridge reads Claude Legal plugin and skill files from a local reference checkout, injects the selected plugin instructions into the Claude call, and normalizes the output back into MikeOSS chat events and downloadable documents. The third-party reference checkout is intentionally ignored by git and should be installed locally after reviewing its license and attribution requirements.

For authentication, the v1 MikeOSS path uses the Claude key already supported by MikeOSS account settings, or the backend `ANTHROPIC_API_KEY`. The key stays server-side; it should not be placed in frontend code.

The standalone gateway scaffold lives at:

```text
services/counselbridge-gateway/
```

That service is the intended long-term boundary. The in-backend adapter exists so the MikeOSS experience can be tested immediately.

## Public-Use Intent

This project is intended for public deposit and reuse. It should be kept clean, documented, and free of private keys, private documents, model weights, generated local data, and machine-specific runtime files.
