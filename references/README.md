# References

External projects and design references belong here only after review.

Optional reference:

- `anthropics/claude-for-legal` — reference agents, skills, and data connectors for legal workflows.

Do not commit third-party source, prompts, workflows, or assets into this
project until licensing and attribution requirements have been reviewed. Claude
for Legal is a third-party Anthropic project licensed under Apache-2.0 when
obtained from its upstream repository. If any content is incorporated, preserve
required notices and document the provenance in `docs/THIRD_PARTY_NOTICES.md`.

For local development, clone the reference repository into this folder if the
upstream URL is available or if you otherwise have access:

```bash
git clone https://github.com/anthropics/claude-for-legal.git references/claude-for-legal
```

`references/claude-for-legal/` is ignored by git so CounselBridge can use it
locally without vendoring it into the public repository. If your checkout lives
elsewhere, set `CLAUDE_LEGAL_ROOT` in `apps/mikeoss/backend/.env`.
