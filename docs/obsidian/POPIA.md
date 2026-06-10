---
tags: [skill, compliance, sa-fintech-skills]
created: 2026-06-10
---

# POPIA skill

Canonical source: [`skills/popia/SKILL.md`](../../skills/popia/SKILL.md)

Audits SA code for POPIA (Protection of Personal Information Act, 4 of 2013)
compliance: PII handling, consent capture, data residency, DSAR endpoints.

## The rules that matter

- Storing SA ID numbers needs `consent_at` / `consent_source` audit fields —
  a bare column is a **§11 violation**.
- Consent is **purpose-specific**, not one boolean: marketing consent ≠
  credit-bureau consent.
- Logging PII to shared observability (Datadog, Sentry) without scrubbing is
  processing under POPIA.
- US-region storage of SA customer data needs a **§72 transborder safeguard**;
  default to ZA regions.
- A DSAR endpoint must return *all* personal information, not just the profile.

## Verification

- `skills/popia/examples/pii-detector.ts` is a real static analyser; the smoke
  test asserts it flags `anti-pattern.ts` and clears `consent-flag.ts`.

Related: [[SARS eFiling]] · [[Home]]
