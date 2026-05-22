# CounselBridge Project Plan

**Project name:** CounselBridge  
**Organization:** Private Counsel  
**Authors:** Private Counsel  
**Intended status:** Public-use project and internal Private Counsel working tool  
**Version:** Public release implementation status v0.2
**Date:** May 22, 2026

## Implementation Status

This document began as a planning draft. The public release scope is narrower
than the original gateway concept:

- Shipped service scaffold: `services/counselbridge-gateway/`
- Shipped gateway port: `3101`
- Shipped gateway endpoint: `POST /v1/workflows/nda-review`
- Authoritative Version 1 integration: MikeOSS backend
  `apps/mikeoss/backend/src/lib/counselbridge.ts`
- Optional Claude for Legal reference checkout:
  `references/claude-for-legal/`, excluded from git

The earlier OpenAI-compatible gateway design using port `8090`,
`/v1/chat/completions`, and `services/claude-legal-gateway/` is deferred. It is
not the current public release behavior.

## 1. Executive Summary

CounselBridge will integrate Claude Legal-style workflows into the MikeOSS legal document assistant while preserving the MikeOSS user experience. Users should continue to interact with MikeOSS as a legal workspace: upload documents, organize projects, chat about matters, request document drafts, and download generated files. Behind the scenes, legal-analysis requests will be routed through a clean Claude-oriented service layer.

Version 1 focuses on Claude Legal-style workflow routing. This keeps the public
release focused, easier to publish, and easier for users to run.

The current release keeps MikeOSS as the user-facing application and document
workspace. Claude workflow logic is implemented primarily through the MikeOSS
backend CounselBridge adapter, with a small gateway scaffold retained for
future service-boundary work.

## 2. Goals

1. Preserve the MikeOSS user experience.
2. Route legal-assistant requests through Claude Legal-style workflows.
3. Keep the integration clean enough for public release.
4. Make the codebase understandable to future contributors.
5. Avoid committing private credentials, private documents, generated local data, or model weights.
6. Create a foundation that can later support additional workflow backends.

## 3. Non-Goals For Version 1

1. No extra model-serving runtime.
2. No local statute/case-law database integration.
3. No CourtListener integration.
4. No docket search.
5. No automatic legal citation verification beyond what the configured Claude workflow can support.
6. No heavy rewrite of the MikeOSS frontend.
7. No direct import of third-party Claude Legal repository content until license/provenance review is complete.

## 4. Proposed Repository Structure

```text
CounselBridge/
  README.md
  apps/
    mikeoss/
      frontend/
      backend/
      supabase/
      docs/
  services/
    counselbridge-gateway/
      src/
      docs/
      tests/
  references/
    README.md
    claude-for-legal/        # optional, read-only, after review
  docs/
    PROJECT_PLAN.md
    PROJECT_CONTEXT.md
    ARCHITECTURE.md
    INTEGRATION_SPEC.md
    SECURITY_AND_PRIVACY.md
    THIRD_PARTY_NOTICES.md
```

The initial workspace already includes:

```text
apps/mikeoss/
docs/
references/
services/
```

## 5. Project Name

Recommended public project name:

```text
CounselBridge
```

Recommended repository slug:

```text
counselbridge
```

Short internal name:

```text
CounselBridge
```

Rationale:

- Clear that Private Counsel is the publisher.
- Clear that the project combines Claude workflows with MikeOSS.
- Avoids implying that the project is an official Anthropic or MikeOSS distribution.

## 6. High-Level Architecture

Version 1 target architecture:

```text
User
  -> MikeOSS frontend
    -> MikeOSS backend
      -> CounselBridge Gateway
        -> Claude API / Claude Legal workflow layer
```

The CounselBridge Gateway should be the boundary where agent behavior lives.

MikeOSS responsibilities:

- authentication
- project/document workspace
- document upload/download
- chat UI
- generated-document cards
- user-facing history
- frontend rendering

CounselBridge Gateway responsibilities:

- request classification
- workflow selection
- Claude provider calls
- legal task planning
- sequential or swarm-style Claude workflows
- timeout/retry policy
- structured run logs
- final answer synthesis
- OpenAI-compatible or MikeOSS-compatible output

## 7. Why A Gateway Instead Of More MikeOSS Patches

MikeOSS already has a complex chat/tool pipeline. Adding agent logic directly inside it increases risk. A gateway lets us:

- keep MikeOSS mostly unchanged
- iterate on agents independently
- expose multiple strategies behind model IDs
- document and test legal workflows separately
- later support additional workflow backends without rewriting the UI
- publish a cleaner project

The gateway may later expose OpenAI-compatible endpoints:

```text
GET  /health
GET  /v1/models
POST /v1/chat/completions
```

This is not the current shipped path. The shipped path routes selected MikeOSS
workflows through `apps/mikeoss/backend/src/lib/counselbridge.ts`.

## 8. Claude Legal Reference Strategy

There is an Anthropic open-source project named `anthropics/claude-for-legal`, described as reference agents, skills, and data connectors for legal workflows.

Plan:

1. Treat it as a reference, not a runtime dependency at first.
2. Clone it into `references/claude-for-legal/` only after review.
3. Review license, notices, and content provenance.
4. Extract architectural patterns and workflow concepts.
5. Copy or adapt content only if license-compatible and documented.
6. Preserve third-party notices in `docs/THIRD_PARTY_NOTICES.md`.

We should avoid presenting this project as an official Claude Legal product. It should be described as a Private Counsel integration that can use Claude and may be informed by open-source Claude-for-Legal patterns.

## 9. Gateway Model/Workflow IDs

Current implemented scaffold:

```text
POST /v1/workflows/nda-review
```

Current MikeOSS adapter:

```text
COUNSELBRIDGE_ENABLED=true
COUNSELBRIDGE_CLAUDE_MODEL=claude-sonnet-4-6
```

The MikeOSS adapter now uses a generic workflow registry. The default public workflow should be commercial review, not NDA review:

```text
builtin-counselbridge-claude-legal-commercial-review
```

This workflow loads the Claude Legal commercial plugin profile plus the `review` routing skill. It treats downstream skills such as `nda-review`, `vendor-agreement-review`, and `saas-msa-review` as route candidates. The memo must disclose the route selected and whether a fully configured playbook or downstream skill was available.

The specific NDA workflow remains available as a narrower option:

```text
builtin-counselbridge-claude-legal-nda-review
```

This avoids making CounselBridge an NDA tool. NDA review is one registered workflow under a broader plugin-runner approach.

Version 1 gateway should expose:

Implementation status: this subsection is deferred design context. The public
Version 1 release does not expose these gateway modes; it uses the MikeOSS
backend adapter as the authoritative runtime.

```text
claude-legal
claude-legal-sequential
claude-legal-swarm
claude-legal-drafter
claude-legal-reviewer
```

Recommended default:

```text
claude-legal-sequential
```

Why sequential first:

- easier to debug
- deterministic enough for early users
- lower cost than broad swarm
- produces cleaner logs
- avoids overengineering before we have workflows tuned

Swarm can be added as an advanced strategy:

```text
issue worker
authority/checklist worker
drafting worker
skeptical reviewer
final synthesis
```

## 10. Version 1 Workflows

Start with three practical workflows. Each workflow should be represented as registry metadata rather than hard-coded request handling:

### 10.1 Legal Analysis Workflow

Purpose:

- issue splitting
- rule/authority checklist
- practical conclusion
- weakness/risk review

Stages:

1. classify request
2. identify jurisdiction/practice area
3. divide issues
4. identify authority categories to check
5. draft practical answer
6. critique for overclaiming/missing facts
7. synthesize final answer

Output requirements:

- no invented citations
- clear distinction between known law and authority to verify
- practical conclusion
- assumptions and missing facts

### 10.2 Document Drafting Workflow

Purpose:

- produce downloadable legal documents through MikeOSS

Stages:

1. identify document type
2. identify jurisdiction and parties/placeholders
3. outline clauses
4. draft full text
5. review for missing provisions
6. return final document text in a format MikeOSS can convert to DOCX

Initial document types:

- NDA
- demand letter
- short legal memo
- employment restriction analysis memo

### 10.3 Document Review Workflow

Purpose:

- review uploaded contracts or legal documents in MikeOSS
- route the document type before applying specialized review logic

Stages:

1. summarize document
2. identify key clauses
3. flag risks
4. suggest revisions
5. produce concise client-ready report

Version 1 can rely on MikeOSS document extraction/context. The gateway receives the context included by MikeOSS and does not yet fetch documents itself.

Implemented first workflow:

- generic commercial review backed by the Claude Legal `commercial-legal` plugin profile and `review` skill
- route candidates include NDA, vendor agreement, SaaS MSA/order form, DPA, SLA, amendment, and mixed commercial package
- output is a MikeOSS-native downloadable Word memo
- fallback path still creates a memo but marks the Claude/structured-output gap

## 11. Data Flow

Implementation status: the OpenAI-compatible gateway flow below is deferred
design context. The public Version 1 runtime routes through
`apps/mikeoss/backend/src/lib/counselbridge.ts` and returns MikeOSS-native
events directly from the MikeOSS backend.

Initial minimal data flow:

```text
MikeOSS builds chat/document context
  -> sends OpenAI-compatible chat request to gateway
  -> gateway runs Claude workflow
  -> gateway returns OpenAI-compatible chat response
  -> MikeOSS renders normal assistant message
  -> MikeOSS existing docx fallback/generation handles document output
```

Later improved data flow:

```text
MikeOSS sends structured request envelope
  -> gateway receives user message, documents, project metadata
  -> gateway returns structured agent events
  -> MikeOSS renders agent progress, evidence, and final output
```

Version 1 should start with OpenAI-compatible format to minimize MikeOSS patches.

## 12. Public Release Standards

Before public deposit:

1. No `.env` files committed.
2. No private documents.
3. No generated DOCX/PDF files unless sample fixtures are explicitly public.
4. No local Supabase data.
5. No node_modules.
6. No model weights.
7. No private API keys in examples.
8. Clear license declaration.
9. Clear third-party notices.
10. Clear setup instructions.

Recommended root files:

```text
LICENSE
README.md
CONTRIBUTING.md
SECURITY.md
docs/THIRD_PARTY_NOTICES.md
docs/SECURITY_AND_PRIVACY.md
```

## 13. Security And Privacy

Version 1 is not fully local. User content sent through Claude workflows may be sent to Anthropic depending on configuration.

The UI and documentation must make this clear:

- Version 1: Claude/API-based.
- Future version: local/hybrid.
- Do not use Version 1 for confidential production data unless the user has appropriate Anthropic/API contractual protections.
- Users must configure their own API keys.
- The project should not ship with keys.

Gateway should implement:

- request size limits
- timeout limits
- explicit provider configuration
- no request logging by default
- redacted structured logs when enabled
- clear errors for missing keys

## 14. Configuration Design

Current gateway scaffold environment variables:

```bash
PORT=3101
ANTHROPIC_API_KEY=
COUNSELBRIDGE_CLAUDE_MODEL=claude-sonnet-4-6
```

MikeOSS backend environment:

```bash
COUNSELBRIDGE_ENABLED=false
COUNSELBRIDGE_ROUTE_ALL=false
COUNSELBRIDGE_CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_LEGAL_ROOT=../../../references/claude-for-legal
```

## 15. Testing Plan

### 15.1 Gateway Unit Tests

Test:

- request classification
- workflow selection
- timeout handling
- retry handling
- missing API key handling
- OpenAI-compatible response shape
- streaming response shape

### 15.2 Workflow Tests

Golden prompts:

```text
Analyze whether a California employee non-solicitation clause is enforceable.
```

```text
Draft a fuller mutual NDA as a downloadable Word document.
```

```text
Review this contract excerpt and identify risky indemnity language.
```

### 15.3 MikeOSS Integration Tests

Verify:

- MikeOSS can call gateway.
- model picker path works.
- streaming completes.
- generated document card still appears.
- failures show useful errors.
- no spinner remains after `[DONE]`.

## 16. Milestones

### Milestone 0: Planning Workspace

Status: started.

Deliverables:

- clean project folder
- clean MikeOSS copy
- project plan
- context document

### Milestone 1: Gateway Scaffold

Deliverables:

- `services/counselbridge-gateway`
- `/health`
- `POST /v1/workflows/nda-review`
- Anthropic provider adapter
- single-workflow scaffold response

### Milestone 2: MikeOSS CounselBridge Adapter

Deliverables:

- workflow registry in `apps/mikeoss/backend/src/lib/counselbridge.ts`
- Claude Legal-style reference prompt loading
- generated DOCX artifact normalization back into MikeOSS chat

### Milestone 3: MikeOSS Integration

Deliverables:

- minimal MikeOSS env setup
- optional model labels
- setup docs
- browser smoke tests

### Milestone 4: Public Release Cleanup

Deliverables:

- security/privacy docs
- third-party notices
- license review
- setup guide
- clean git status
- no secrets

### Milestone 5: Optional Claude Legal Reference Import

Deliverables:

- clone/review `anthropics/claude-for-legal`
- summarize useful patterns
- decide whether to adapt any workflows
- document license/provenance

## 17. Open Design Questions

1. Should the gateway use direct Anthropic Messages API or a higher-level Claude agent framework?
2. Should MikeOSS expose explicit workflow labels like `Claude Legal` and `Claude Legal Drafting`?
3. How much agent progress should Version 1 show in the UI?
4. Should document drafting return plain text for MikeOSS DOCX fallback, or should the gateway call a document-generation tool directly?
5. Should workflow prompts be YAML/JSON files for easier public contribution?
6. Should there be a strict no-citation mode unless verified source tools are available?

## 18. Recommended Immediate Next Steps

1. Review this project plan.
2. Decide whether to clone `anthropics/claude-for-legal` into `references/` for inspection only.
3. Create `docs/ARCHITECTURE.md`.
4. Keep `services/counselbridge-gateway/` documented as a scaffold.
5. Expand tests around the MikeOSS CounselBridge adapter.
6. Decide whether the next gateway iteration should be OpenAI-compatible or
   workflow-specific.
7. Add the first broader legal-analysis workflow beyond document review.

## 19. Review Checklist

Before coding starts, confirm:

- project name is acceptable
- authorship line is correct
- organization name is correct
- Version 1 workflow scope is clear
- gateway-first architecture is approved
- public-release standards are acceptable
- Claude-for-Legal reference strategy is acceptable
