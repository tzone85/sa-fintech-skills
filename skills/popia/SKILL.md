---
name: popia
description: Audit SA code for POPIA compliance — PII handling, consent flags, data residency, and DSAR endpoint requirements.
metadata:
  targets: [claude, cursor, copilot, codex, gemini]
---

# POPIA compliance skill

Use when the user is writing code that stores, transmits, or processes South African personal information. POPIA (Protection of Personal Information Act, 4 of 2013) treats ID numbers, biometrics, financial data, and contact info as personal information. Any handler must record lawful basis, capture consent where required, and respect data-subject access requests (DSAR).

## Triggers

- "popia"
- "PII"
- "consent flag"
- "data residency"
- "DSAR"
- "south african id"
- "personal information"

## Examples

Working example: [`examples/consent-flag.ts`](./examples/consent-flag.ts) — a request handler that records consent before storing an SA ID number.

Wrong example with explanation: [`examples/anti-pattern.ts`](./examples/anti-pattern.ts) — stores ID number with no consent record. Smoke test asserts the PII detector flags this file.

## Common mistakes

- Storing SA ID numbers in plain columns with no `consent_at` / `consent_source` audit fields. The Information Regulator considers this a §11 violation.
- Treating consent as a single boolean. POPIA requires *purpose-specific* consent — a user consenting to marketing has not consented to credit-bureau queries.
- Logging PII into shared observability platforms (Datadog, Sentry) without scrubbing. Logs are processing under POPIA.
- Using US-region storage for SA customer data without a §72 transborder safeguard. Default to ZA regions where available.
- Building a DSAR endpoint that only returns a subset (e.g. profile but not transaction history). The data subject is entitled to *all* personal information.
