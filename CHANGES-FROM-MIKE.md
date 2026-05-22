# Changes From MikeOSS / Mike

CounselBridge vendors an adapted copy of MikeOSS / Mike under `apps/mikeoss/`.

Upstream baseline used for this public release:

- Baseline commit SHA: `469ee4adeca12d7cd9c1506c84b1e25f4859ae15`

MikeOSS / Mike remains an upstream third-party project. CounselBridge is not
affiliated with or endorsed by MikeOSS / Mike.

## Added Files

- `apps/mikeoss/LICENSE`
  - Local AGPL-3.0 license copy for the vendored modified MikeOSS subtree.
- `apps/mikeoss/NOTICE`
  - Upstream MikeOSS attribution and modified-copy notice for the vendored
    subtree.
- `apps/mikeoss/.gitignore`
  - Publish-safe ignore rules for local env files, dependencies, build output,
    runtime data, uploads, model weights, and Supabase local state.
- `apps/mikeoss/LOCAL_SETUP.md`
  - Local setup instructions for running the adapted MikeOSS app.
- `apps/mikeoss/PUBLISH_CHECKLIST.md`
  - Pre-publication hygiene checklist.
- `apps/mikeoss/package.json`
  - Convenience scripts for installing, building, checking, and running the
    adapted MikeOSS app.
- `apps/mikeoss/scripts/check-local.sh`
  - Local service health checks.
- `apps/mikeoss/scripts/dev-local.sh`
  - Local setup helper for env files and Supabase startup.
- `apps/mikeoss/supabase/.gitignore`
  - Supabase local runtime ignore rules.
- `apps/mikeoss/supabase/config.toml`
  - Local Supabase configuration.
- `apps/mikeoss/supabase/migrations/20260511000000_initial_schema.sql`
  - Local Supabase schema migration.
- `apps/mikeoss/supabase/seed.sql`
  - Local seed script for required storage bucket setup.
- `apps/mikeoss/backend/src/lib/counselbridge.ts`
  - CounselBridge workflow adapter. Maps MikeOSS workflow IDs to Claude
    Legal-style plugin/skill references, calls Claude through existing MikeOSS
    API-key paths, and returns MikeOSS-native chat/document events.

## Backend Changes

- `apps/mikeoss/backend/src/index.ts`
  - Uses the adapted route set for CounselBridge publication.
  - Tightens JSON request size, requires `FRONTEND_URL` in production, and
    rate-limits tabular review regeneration routes.
- `apps/mikeoss/backend/src/lib/downloadTokens.ts`
  - Adds expiring HMAC download tokens and requires a dedicated signing secret
    in production.
- `apps/mikeoss/backend/src/lib/userApiKeys.ts`
  - Requires a dedicated user API key encryption secret in production.
- `apps/mikeoss/backend/src/lib/upload.ts`
  - Adds MIME/magic-byte validation for uploaded PDF, DOCX, and DOC files.
- `apps/mikeoss/backend/src/lib/builtinWorkflows.ts`
  - Adds CounselBridge Claude Legal workflow registrations for commercial,
    corporate, litigation, employment, privacy, AI governance, IP, product,
    regulatory, legal clinic, law student, NDA, vendor agreement, SaaS MSA, and
    DPA workflows.
- `apps/mikeoss/backend/src/routes/chat.ts`
  - Routes selected CounselBridge workflows through the CounselBridge adapter in
    general assistant chat.
  - Emits generated-document stream events only when a document exists.
- `apps/mikeoss/backend/src/routes/projectChat.ts`
  - Routes selected CounselBridge workflows through the CounselBridge adapter in
    project chat.
  - Adds `save_generated_documents` handling so generated Word documents can be
    saved to the current project or returned only as downloads.
  - Prevents empty project review flows from accidentally using unrelated
    documents.
- `apps/mikeoss/backend/src/lib/storage.ts`
  - Generalizes storage comments from Cloudflare R2-only language to
    S3-compatible storage language for local Supabase/MinIO/R2 use.

## Frontend Changes

- `apps/mikeoss/frontend/src/app/components/workflows/builtinWorkflows.ts`
  - Adds visible CounselBridge Claude Legal workflows to the workflow catalog.
- `apps/mikeoss/frontend/src/app/components/workflows/WorkflowList.tsx`
  - Labels CounselBridge workflows as `Connected by CounselBridge`.
  - Fixes workflow-page scrolling for long workflow lists.
- `apps/mikeoss/frontend/src/app/components/workflows/DisplayWorkflowModal.tsx`
  - Fixes workflow Start Chat behavior.
  - Prevents project-scoped workflows from carrying documents from another
    project.
  - Adds return-path handling when opening a workflow page from the modal.
- `apps/mikeoss/frontend/src/app/(pages)/workflows/[id]/page.tsx`
  - Adds an in-app Back button for workflow detail pages.
- `apps/mikeoss/frontend/src/app/(pages)/workflows/page.tsx`
  - Adjusts page layout to support workflow-list scrolling.
- `apps/mikeoss/frontend/src/app/(pages)/layout.tsx`
  - Adds an AGPL source-code link in the authenticated app shell.
- `apps/mikeoss/frontend/src/app/login/page.tsx`
  - Adds an AGPL source-code link and masks raw Supabase login errors.
- `apps/mikeoss/frontend/src/app/signup/page.tsx`
  - Adds an AGPL source-code link, masks raw Supabase signup errors, and raises
    the local password minimum to 12 characters.
- `apps/mikeoss/frontend/src/middleware.ts`
  - Adds server-side route guarding for protected MikeOSS pages.
- `apps/mikeoss/frontend/next.config.ts`
  - Adds baseline security headers.
- `apps/mikeoss/frontend/src/app/components/assistant/AssistantWorkflowModal.tsx`
  - Labels CounselBridge workflows as `Connected by CounselBridge`.
- `apps/mikeoss/frontend/src/app/components/assistant/ChatInput.tsx`
  - Allows workflow-only submissions.
  - Adds a `Save to project` toggle for generated documents in project chat.
- `apps/mikeoss/frontend/src/app/components/assistant/AssistantMessage.tsx`
  - Prevents stale generated-document download URLs from crashing the Next.js
    runtime.
  - Attempts to refresh document download URLs through MikeOSS when a document
    ID is available.
  - Displays inline download errors instead of throwing.
- `apps/mikeoss/frontend/src/app/hooks/useAssistantChat.ts`
  - Carries `save_generated_documents` through streaming project chat requests.
- `apps/mikeoss/frontend/src/app/lib/mikeApi.ts`
  - Adds request typing for `save_generated_documents`.
- `apps/mikeoss/frontend/src/app/components/shared/types.ts`
  - Adds shared event/message typing for `save_generated_documents`.
- `apps/mikeoss/frontend/src/lib/storage.ts`
  - Generalizes storage comments from Cloudflare R2-only language to
    S3-compatible storage language.
  - Marks server-only storage helpers with `server-only`.
- `apps/mikeoss/frontend/src/lib/supabase-server.ts`
  - Marks service-role Supabase helpers as server-only and removes the raw-token
    development fallback.

## Documentation Changes

- `apps/mikeoss/README.md`
  - Replaces the upstream deployment README with local CounselBridge/MikeOSS
    setup notes.
- `apps/mikeoss/docs/safe-local-testing.md`
  - Documents safe local testing practices.

## Third-Party Content Not Vendored

- The Claude for Legal repository is not vendored. Users may clone it locally
  under `references/claude-for-legal/` after reviewing upstream license and
  attribution terms.
