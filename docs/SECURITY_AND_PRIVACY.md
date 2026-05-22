# Security And Privacy

CounselBridge is intended for self-hosted use. Operators are responsible for
their deployment environment, access controls, and provider credentials.

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

## Publication Rules

- Do not commit `.env`, `.env.local`, uploaded documents, generated exports, or
  provider API keys.
- Do not vendor the optional Claude for Legal checkout.
- Use placeholders in all example environment files.

## Runtime Rules

- API keys must stay server-side or in encrypted user-key storage.
- Browser code must not contain shared provider keys.
- Generated legal outputs are drafts and require attorney review.
- Uploaded documents should be treated as confidential user data.
- Operators should decide which model providers, if any, are appropriate for
  privileged or confidential legal work.

## Local Development

Local Supabase is managed by the Supabase CLI. Storage credentials in example
files are placeholders for the local S3-compatible storage endpoint.
