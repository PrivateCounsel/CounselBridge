# Security Policy

Do not open public issues containing secrets, private client data, privileged
documents, or vulnerability details.

For now, report security concerns privately to the repository maintainers for
the `PrivateCounsel/CounselBridge` GitHub repository.

CounselBridge is a self-hosted integration. Operators are responsible for
rotating any exposed API keys, Supabase keys, S3-compatible storage credentials,
and download-token or encryption secrets.

CounselBridge forwards user requests, chat history, document text, and related
outputs to Claude Legal-style workflow references and the configured Claude
model/API provider. It does not filter, redact, or remove confidential,
privileged, client, or sensitive information before sending that data to the
model provider. Do not submit such information to Claude or any model provider
unless you have reviewed the applicable provider terms, data-retention
practices, confidentiality commitments, privacy and security documentation, and
any enterprise or professional-use agreement for your account. Model outputs
may be inaccurate or fabricated and require independent verification and
licensed-attorney review.
