# Contributing

CounselBridge vendors a modified AGPL copy of MikeOSS / Mike under
`apps/mikeoss/`. Keep modifications documented in the repository-root
`CHANGES-FROM-MIKE.md`.

Before opening a pull request:

- Do not commit `.env`, `.env.local`, local Supabase state, `node_modules`,
  `.next`, `dist`, uploaded documents, or third-party reference checkouts.
- Run backend and gateway TypeScript builds when touching those packages.
- Run frontend TypeScript checks when touching `apps/mikeoss/frontend`.
- Preserve third-party license and attribution notices.

Claude for Legal reference files must remain optional and untracked unless a
future contribution explicitly handles redistribution rights and notices.
