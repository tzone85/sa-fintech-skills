---
tags: [skill, payments, sa-fintech-skills]
created: 2026-06-10
---

# PayFast skill

Canonical source: [`skills/payfast/SKILL.md`](../../skills/payfast/SKILL.md)

PayFast is form-post + ITN callback, not REST. The MD5 signing algorithm is
the #1 integration failure, and the one agents most reliably hallucinate.

## The rules that matter

- **Field order is NOT alphabetical** — it's the documented
  attributes-description order (`merchant_id, merchant_key, return_url, …`).
- **URL-encode with PHP semantics**: spaces become `+`, not `%20`.
  `encodeURIComponent` alone will mismatch.
- **Empty fields are skipped**, values are trimmed before encoding.
- ITN validation is **four steps**, all required: signature, source IP,
  payment data, server confirm — signature alone is not enough.

## Verification

- Fixture ITN bodies (valid + tampered) verified by `scripts/smoke/payfast.ts`
  on every CI run. No programmatic sandbox init exists, so the signing
  algorithm is the high-value offline check.

Related: [[Paystack]] · [[Home]]
