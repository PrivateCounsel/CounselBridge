# CounselBridge Gateway

This is the standalone service boundary for CounselBridge.

Implementation status: the authoritative Version 1 runtime is the MikeOSS
backend adapter at `apps/mikeoss/backend/src/lib/counselbridge.ts`. This
gateway is a single-workflow NDA preview scaffold for future service-boundary
work.

The current endpoint implements a commercial NDA review workflow and returns:

- normalized workflow status
- chat-ready markdown
- a base64 DOCX artifact
- source and verification metadata

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

The service listens on `HOST` or `127.0.0.1`, and `PORT` or `3101`.

## Authentication

For local/self-hosted use, the simplest path is bring-your-own-key:

1. Set `ANTHROPIC_API_KEY` in the gateway environment, or
2. Send a per-request key using `x-anthropic-api-key` or `Authorization: Bearer <key>`.

Do not expose a shared server key in browser code. In the MikeOSS integration, the frontend should send requests to the MikeOSS backend, and the backend should call CounselBridge using either the server key or the user's encrypted Claude API key.

OAuth / workload identity can be added later for enterprise deployments, but BYOK is the clean v1 default for a public self-hosted project.

## Endpoint

`POST /v1/workflows/nda-review`

```json
{
  "message": "Review this NDA and produce a downloadable Word memo.",
  "documents": [
    {
      "id": "doc_123",
      "filename": "mutual-nda.docx",
      "text": "..."
    }
  ],
  "matterId": "matter_abc",
  "userRole": "attorney",
  "jurisdiction": "California"
}
```

Response:

```json
{
  "status": "completed",
  "workflow": "commercial.nda-review",
  "answerMarkdown": "...",
  "artifacts": [
    {
      "type": "docx",
      "filename": "CounselBridge NDA Review Memo.docx",
      "contentBase64": "..."
    }
  ],
  "sources": [],
  "verification": {
    "researchConnectorUsed": false,
    "warnings": []
  }
}
```

## Notes

This service is intentionally separate from MikeOSS. It should own legal workflow selection, Claude prompt packaging, verification metadata, and artifact production. MikeOSS should own projects, documents, chat UI, and storage.
