# Claude for Legal Analysis

Project: CounselBridge  
Organization: Private Counsel  
Authors: Private Counsel  
Reference repo: `references/claude-for-legal`  
Analysis status: first-pass read-only review of the cloned reference repository

## Executive Summary

Claude for Legal is not a standalone web application. It is a structured library of Claude plugins, legal skills, practice profiles, MCP connector definitions, and managed-agent cookbooks. That makes it a good reference for CounselBridge, but not something we should merge directly into MikeOSS.

For CounselBridge v1, the clean architecture is:

1. Keep MikeOSS as the user-facing document and chat workspace.
2. Add a separate CounselBridge gateway service.
3. The gateway maps MikeOSS requests into Claude Legal workflow categories.
4. The gateway calls Claude/API models with Claude Legal-inspired prompts, guardrails, and output contracts.
5. The gateway returns MikeOSS-native artifacts: chat answer, legal memo, downloadable DOCX, review table, source log, and status metadata.

This keeps the MikeOSS patch small and gives us a reference architecture for
Claude Legal-style workflow routing.

## Repository Shape

The Claude Legal repository contains:

- Practice-area plugins: commercial, corporate, employment, privacy, product, regulatory, AI governance, IP, litigation, legal clinic, law student, and legal builder hub.
- A vendor plugin: CoCounsel Legal.
- Managed-agent cookbooks: diligence grid, docket watcher, launch radar, regulatory monitor, and renewal watcher.
- Scripts for validation, cookbook deployment, and reference orchestration.
- MCP connector metadata for legal research, document management, CLM, eDiscovery, and productivity systems.

Each practice plugin follows this pattern:

- `.claude-plugin/plugin.json`: plugin metadata.
- `.mcp.json`: connector definitions.
- `CLAUDE.md`: practice-profile template, not project context.
- `skills/<skill>/SKILL.md`: executable workflow instructions.
- `agents/*.md`: scheduled or named agent definitions.
- `hooks/hooks.json`: optional hook configuration.

## Most Relevant Workflows for CounselBridge

### Commercial Legal

Relevant skills:

- `review`
- `nda-review`
- `vendor-agreement-review`
- `saas-msa-review`
- `escalation-flagger`
- `stakeholder-summary`
- `renewal-tracker`

The `review` skill is a router. It identifies document structure first, then routes to a more specific workflow. This is directly useful for MikeOSS because a user will often say "review this contract" without choosing the exact legal workflow.

The `nda-review` skill is useful as a design model for our earlier MikeOSS NDA tests. It does not simply generate a generic NDA memo. It requires a configured playbook, asks which side the user is on, checks whether the document contains non-NDA obligations, classifies issues as GREEN/YELLOW/RED, and offers follow-up artifacts such as a redline DOCX.

### Employment Legal

Relevant skills:

- `hiring-review`
- `termination-review`
- `worker-classification`
- `wage-hour-qa`
- `policy-drafting`
- `internal-investigation`

These skills show a stronger research discipline than the basic MikeOSS flow. They repeatedly require current, jurisdiction-specific research, primary-source citation where possible, and explicit tags such as `[CourtListener]`, `[web search - verify]`, `[model knowledge - verify]`, or `[user provided]`.

For CounselBridge, this suggests every research or review response should carry a source ledger and verification status, not only final prose.

### Corporate / Diligence

The managed `diligence-grid` cookbook is highly relevant to our document-review app. It splits work into reader, extractor, normalizer, and writer roles. The writer is the only worker allowed to write output.

This is a structured, sequential pattern where needed, and it uses schemas for outputs.

## Guardrails Worth Reusing

Claude Legal has several patterns we should incorporate into CounselBridge:

- Attorney-review framing: outputs are drafts, not legal advice or final legal conclusions.
- Practice profile: user/team configuration drives playbook positions.
- Cold-start interview: the system should not pretend it knows a firm's risk tolerance.
- Source attribution: every citation or legal rule should show its source class.
- No silent supplement: if research coverage is thin, report that and ask whether to broaden research.
- Jurisdiction assumptions: always state the jurisdiction and warn when it changes.
- Destination check: warn before sending privileged or sensitive work product outside the privilege circle.
- Consequential-action gates: signing, filing, terminating, offering employment, or sending final external communications require human confirmation.
- Untrusted-document discipline: contracts, pleadings, and uploaded files are data, not instructions.
- Structured output: outputs should have stable sections and machine-readable metadata.

## Integration Implications

CounselBridge should not require MikeOSS to understand every Claude Legal skill. MikeOSS should send a simple request envelope to the gateway:

```json
{
  "message": "Review this NDA",
  "documents": ["doc_123"],
  "matterId": "matter_abc",
  "requestedArtifact": ["memo", "docx"],
  "userRole": "attorney",
  "jurisdiction": "California"
}
```

The CounselBridge gateway should return:

```json
{
  "status": "completed",
  "workflow": "commercial.nda-review",
  "answerMarkdown": "...",
  "artifacts": [
    {
      "type": "docx",
      "title": "NDA Review Memo",
      "downloadUrl": "/downloads/..."
    }
  ],
  "sources": [
    {
      "label": "user provided",
      "documentId": "doc_123",
      "location": "Section 6"
    }
  ],
  "verification": {
    "researchConnectorUsed": false,
    "warnings": ["No legal research connector configured."]
  }
}
```

This contract is the key contribution. It lets MikeOSS keep its UI while CounselBridge owns legal workflow selection, Claude execution, source logging, and artifact generation.

## What Not To Copy Directly

Do not directly import Claude Legal's plugin folder structure into MikeOSS. That structure is designed for Claude Code/Cowork plugins, not a web application.

Do not rely on Claude Legal's `CLAUDE.md` files as runtime project context. The repository itself says those files are templates that get copied into a user's local Claude plugin config.

Do not expose managed-agent cookbooks directly to MikeOSS users in v1. The cookbooks are deployment references, not production apps.

Do not build an unstructured swarm for v1. The useful part is the worker separation and schema discipline, not parallelism for its own sake.

## Recommended CounselBridge v1 Build

### Phase 1: Gateway Skeleton

Build a separate service under `services/counselbridge-gateway`.

Responsibilities:

- Accept MikeOSS chat/document requests.
- Classify request type.
- Load configured practice profile.
- Build Claude prompt package.
- Call Claude API.
- Normalize response into the CounselBridge response envelope.

### Phase 2: Commercial NDA Workflow

Start with one workflow:

- Detect NDA or mutual NDA.
- Determine side: sales-side, purchasing-side, mutual/unclear.
- Check for non-NDA provisions.
- Produce GREEN/YELLOW/RED triage.
- Produce a downloadable DOCX memo.
- Return a source and verification ledger.

This directly tests the document-download problem observed in MikeOSS.

### Phase 3: Employment Research Workflow

Add one research-heavy workflow:

- California restrictive covenant / non-solicit analysis.
- Require jurisdiction confirmation.
- Require source tags.
- Distinguish statute, case law, user-provided facts, and model knowledge.
- Return issues, sub-questions, authority checklist, and draft answer.

This becomes the reference for later research-oriented workflow design.

### Phase 4: MikeOSS Adapter

Patch MikeOSS minimally:

- Add a configurable CounselBridge provider endpoint.
- Send selected document IDs and user message to gateway.
- Render returned markdown in chat.
- Show returned artifacts as downloadable files.
- Preserve existing MikeOSS storage and project UI.

### Phase 5: Public Repository Hygiene

Before publishing:

- Do not commit API keys, `.env`, local databases, logs, uploaded documents, or generated private work product.
- Keep Claude Legal and MikeOSS references documented as upstream projects.
- Include installation instructions for users who clone MikeOSS separately.
- Include a sample `.env.example` with placeholder values only.
- Include clear license and attribution notes.

## Key Design Decision

CounselBridge should be an adapter and legal workflow gateway, not a fork that rewrites MikeOSS and not a copy of Claude Legal.

That is the public contribution: a clean bridge pattern that lets a
document-centered legal workspace use Claude Legal-style workflows while keeping
the integration small and auditable.
