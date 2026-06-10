---
tags: [skill, tax, sa-fintech-skills]
created: 2026-06-10
---

# SARS eFiling skill

Canonical source: [`skills/sars-efiling/SKILL.md`](../../skills/sars-efiling/SKILL.md)

Reference-backed tax workflows — SARS has no public eFiling sandbox, so every
claim cites a SARS-published guide URL pinned (with retrieval date) in the
skill frontmatter.

## The rules that matter

- VAT is **15%** (since 2018-04-01). The proposed 15.5%/16% increases were
  reversed by the 2025 Rates Bill — agents trained mid-2025 get this wrong.
- VAT registration thresholds change 1 April 2026: compulsory R1m → **R2.3m**,
  voluntary R50k → **R120k**.
- Zero-rated (0%, still reported) ≠ exempt (outside VAT) — don't conflate.
- IRP5 source codes come in local/foreign pairs (3601 → 3651); older codes are
  rationalised into main codes per year of assessment.
- VAT maths uses **banker's rounding** to 2dp (`shared/za-primitives/vat.ts`).

## Verification

- Pure-function tests on the VAT primitive and code registries; smoke run in
  `scripts/smoke/sars.ts` every CI run.
- Source URLs are pinned with `retrieved:` dates — re-check them when the
  nightly drift job or a budget speech says rates moved (see
  [[Operations Runbook]]).

Related: [[POPIA]] · [[Home]]
