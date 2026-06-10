---
tags: [overview, sa-fintech-skills]
created: 2026-06-10
---

# Project Overview

A curated, version-pinned **skill pack for AI coding agents** — Claude Code,
Cursor, Copilot, Codex, Gemini — covering South African fintech: Paystack,
PayFast, POPIA, and SARS. One canonical source, five runtimes, MIT-licensed.

## The problem

AI training data is thin on SA fintech. Unassisted agents:

- write PayFast signatures that skip the URL-encode-before-MD5 step (silent ITN failures in production)
- ship POPIA §11 violations by skipping consent capture
- default Paystack to USD instead of ZAR
- invent SARS field codes that don't exist

## The fix

Each skill is one `SKILL.md` — triggers, runnable examples, and an explicit
"common mistakes" block — that the agent loads automatically when the work
matches. A build step fans the canonical source out to every runtime (see
[[Architecture]]).

## Who it's for

- Indie devs and startup engineers shipping ZA payment flows
- Compliance-aware teams handling SA personal information
- Anyone touching SARS eFiling, IRP5, VAT, or IT3(b)

## State (2026-06-10)

| | |
|---|---|
| Version | 0.1.0 staged — not yet on npm (see [[Launch Checklist]]) |
| Skills | [[Paystack]] · [[PayFast]] · [[POPIA]] · [[SARS eFiling]] |
| Primitives | `validate-sa-id` · `vat` (banker's rounding) · `bank-codes` |
| Quality | 85 tests · 0 npm audit vulns · CodeQL + Scorecard + nightly drift cron |
| Install | `/plugin install tzone85/sa-fintech-skills` or `npx sa-fintech-skills install` |
