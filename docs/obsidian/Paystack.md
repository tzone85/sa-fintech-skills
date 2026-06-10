---
tags: [skill, payments, sa-fintech-skills]
created: 2026-06-10
---

# Paystack skill

Canonical source: [`skills/paystack/SKILL.md`](../../skills/paystack/SKILL.md)

Teaches agents to wire backends to Paystack for **South African card payments**
— init, verify, webhooks, splits — without the production-breaking gotchas.

## The rules that matter

- Amounts are in **cents** (`R150.00` → `15000`); set `currency: "ZAR"`
  explicitly or some accounts default to NGN.
- `initialize` success ≠ customer paid. Only `GET /transaction/verify/:reference`
  with `status === "success"` + amount + currency checks is fulfilment-safe.
- Webhook `x-paystack-signature` is **HMAC-SHA-512** over the raw body with the
  secret key; compare with `crypto.timingSafeEqual`, never `===`.
- Prefer `express.raw()` on the webhook route — re-serialising `req.body` is a
  brittle hash source.

## Verification

- Fixture round-trip in `scripts/smoke/paystack.ts` (offline, every CI run)
- Live test-mode init when `PAYSTACK_TEST_SECRET_KEY` is configured — runs
  nightly, see [[Operations Runbook]]

Related: [[PayFast]] (the other ZA gateway) · [[Home]]
