# sa-fintech-skills — Plan B (v0.1.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v0.1.0 — three fintech skills (Paystack, PayFast, SARS) backed by real API research (not training data), shared ZA primitives, npm publish via OIDC provenance, and an auto-PR to the Claude plugin marketplace.

**Architecture:** Same canonical-source → 5-emitter pipeline that Plan A established. New surface: `shared/za-primitives/` (pure modules imported by skill examples and smoke tests), three skill directories under `skills/`, two new GitHub workflows (`release.yml` + `marketplace-pr.yml`), and 15 new golden files (3 skills × 5 emitters).

**Tech Stack additions:**
- For Paystack/PayFast sandbox smokes — `undici` (Node 22 built-in `fetch`, no extra dep) hitting real test endpoints
- For npm publish provenance — `actions/setup-node` with registry auth + `npm publish --provenance`
- For marketplace PR — `gh` CLI inside the release workflow

**Spec:** [`../specs/2026-06-07-sa-fintech-skills-design.md`](../specs/2026-06-07-sa-fintech-skills-design.md)
**Predecessor:** [`./2026-06-07-sa-fintech-skills-foundation.md`](./2026-06-07-sa-fintech-skills-foundation.md) — Plan A (shipped as v0.0.1-alpha.0)

**Branch:** `feature/plan-b` — all PB tasks land here, single PR back to `main` at the end.

---

## What's already shipped from the "Plan B preview"

During the production-ready push the following Plan B items landed early on `main`:

| Item | Where | Commit |
|---|---|---|
| `scripts/install.ts` — runtime auto-detect CLI | `main` | `54fd97e` |
| GitHub Actions CI workflow | `main` | `0e39562` (initial), `ab1f752` (hardened) |
| `package.json` npm metadata (keywords, files, repository, bugs, homepage) | `main` | `e89305a` |

So Plan B's *remaining* scope is: fintech skill content + shared primitives + smoke tests + publish pipeline.

---

## Research discipline (non-negotiable)

The project's value collapses if we ship hallucinated API behaviour. For Paystack, PayFast, and SARS skills, every claim in a `SKILL.md` must be backed by one of:

- A linked, dated section in the API provider's documentation.
- A piece of code that round-trips against the provider's sandbox in the smoke tier.
- A pure-function reference implementation derived from a SARS published guide URL pinned in the skill frontmatter.

**No SKILL.md ships with content the implementer "remembers" or "is pretty sure about." If a behaviour cannot be cited or sandboxed, it does not land in v0.1.0.**

Use the `context7` MCP server (`mcp__plugin_context7_context7__query-docs`) and `firecrawl-scrape` to fetch live docs before authoring each skill body. Each skill body must include a "Source citations" footer linking the docs URLs + retrieval dates used.

---

## File map

| Path | Responsibility | Task |
|---|---|---|
| `shared/za-primitives/validate-sa-id.ts` | SA ID number validator (Luhn + DOB + citizenship digit) | PB1 |
| `shared/za-primitives/vat.ts` | VAT 15% incl/excl, banker's rounding | PB2 |
| `shared/za-primitives/bank-codes.ts` | SA bank branch code lookup | PB3 |
| `tests/shared/*.test.ts` | Table-driven primitive tests | PB1–PB3 |
| `skills/paystack/SKILL.md` | Canonical Paystack skill | PB4 |
| `skills/paystack/examples/*.ts` | webhook verify (HMAC SHA-512), init transaction, split payment | PB4 |
| `skills/paystack/fixtures/*.json` | Sample webhook payloads with valid + invalid signatures | PB4 |
| `skills/payfast/SKILL.md` | Canonical PayFast skill | PB5 |
| `skills/payfast/examples/*.ts` | Form-post MD5 signature, ITN signature verify | PB5 |
| `skills/payfast/fixtures/*` | ITN POST bodies | PB5 |
| `skills/sars-efiling/SKILL.md` | Canonical SARS skill | PB6 |
| `skills/sars-efiling/examples/*.ts` | VAT calc, IRP5 code lookup, ITR12 field map | PB6 |
| `scripts/smoke-test.ts` (extended) | Per-skill smoke dispatch | PB7 |
| `scripts/smoke/paystack.ts` | Hit Paystack test mode, assert response shape | PB7 |
| `scripts/smoke/payfast.ts` | Hit PayFast sandbox, verify ITN signature on fixture | PB7 |
| `scripts/smoke/sars.ts` | Pure-function tests vs worked SARS examples | PB7 |
| `tests/golden/<runtime>/{paystack,payfast,sars-efiling}.expected` | 15 new golden files | PB8 |
| `.github/workflows/release.yml` | Tag-triggered npm publish with OIDC provenance | PB9 |
| `.github/workflows/marketplace-pr.yml` | Auto-open PR against Claude plugin marketplace registry | PB10 |
| `package.json` (version bump 0.1.0, prepack script) | Publish prep | PB11 |

---

## Task 1: `validate-sa-id.ts` (TDD)

**Files:**
- Create: `shared/za-primitives/validate-sa-id.ts`
- Test: `tests/shared/validate-sa-id.test.ts`

SA ID number is 13 digits: `YYMMDD SSSS C A Z`:
- `YYMMDD` — date of birth
- `SSSS` — sequence, women < 5000 < men
- `C` — citizenship (0 = SA citizen, 1 = permanent resident)
- `A` — usually 8 (was race classification pre-1980, deprecated)
- `Z` — Luhn check digit over the preceding 12 digits

Reference: South African Department of Home Affairs ID specification. Use SARS-published test IDs (search "SARS test ID number" for documented samples) — never invent real-looking IDs.

- [ ] **Step 1: Failing tests** with table of `[id, expectedValid, expectedReason]` cases covering:
  - valid male SA citizen
  - valid female SA citizen
  - valid permanent resident
  - invalid Luhn checksum
  - invalid DOB (e.g. month 13)
  - too short / too long
  - non-digit characters
- [ ] **Step 2: Run, expect fail**
- [ ] **Step 3: Implement** returning `{ valid: boolean; reason?: string; dob?: Date; gender?: 'male' | 'female'; citizenship?: 'sa' | 'permanent-resident' }`
- [ ] **Step 4: Run, expect pass**
- [ ] **Step 5: Commit:** `feat(primitives): validate-sa-id with Luhn + DOB + citizenship`

---

## Task 2: `vat.ts` (TDD)

**Files:**
- Create: `shared/za-primitives/vat.ts`
- Test: `tests/shared/vat.test.ts`

SA VAT is 15% (since 2018-04-01). Common operations:
- `vatExclToIncl(excl: number): number` → `excl * 1.15`
- `vatInclToExcl(incl: number): number` → `incl / 1.15`
- `vatAmount(incl: number): number` → `incl - vatInclToExcl(incl)`

Use banker's rounding (round half to even) at 2 decimal places — SARS-aligned. Cite the SARS VAT guide URL in the JSDoc.

- [ ] **Step 1: Failing tests** for incl/excl/amount with worked SARS examples
- [ ] **Step 2: Run, expect fail**
- [ ] **Step 3: Implement** with explicit `Math.round`-with-tie-break helper
- [ ] **Step 4: Run, expect pass**
- [ ] **Step 5: Commit:** `feat(primitives): vat 15% with banker's rounding`

---

## Task 3: `bank-codes.ts` (TDD)

**Files:**
- Create: `shared/za-primitives/bank-codes.ts`
- Test: `tests/shared/bank-codes.test.ts`

Standard SA universal branch codes (PASA-published). Map of `{ bankName: { universal: string, swift?: string } }` covering Absa, FNB, Nedbank, Standard Bank, Capitec, Investec, African Bank, Bidvest Bank, Discovery Bank, TymeBank.

- [ ] **Step 1: Failing tests** for lookup by name + verify-branch-code function
- [ ] **Step 2: Run, expect fail**
- [ ] **Step 3: Implement** as readonly `as const` map
- [ ] **Step 4: Run, expect pass**
- [ ] **Step 5: Commit:** `feat(primitives): bank-codes — SA universal branch codes`

---

## Task 4: Paystack skill (research-backed)

**Files:**
- Create: `skills/paystack/SKILL.md`
- Create: `skills/paystack/examples/init-transaction.ts`
- Create: `skills/paystack/examples/verify-webhook.ts`
- Create: `skills/paystack/examples/anti-pattern.ts`
- Create: `skills/paystack/fixtures/webhook-valid.json`
- Create: `skills/paystack/fixtures/webhook-invalid-sig.json`

**Before authoring the SKILL.md body**, run the following research steps and capture URLs + retrieval dates in the skill frontmatter:

1. `mcp__plugin_context7_context7__resolve-library-id` → `paystack`
2. `mcp__plugin_context7_context7__query-docs` → fetch the webhook-signing, transactions/initialize, and split-payment sections
3. `firecrawl-scrape` `https://paystack.com/docs/payments/webhooks/` and `https://paystack.com/docs/api/transaction/`

Canonical content the skill must teach:
- HMAC-SHA-512 signature over the raw request body using the secret key as the HMAC key. The signature is in the `x-paystack-signature` header. Constant-time compare.
- Webhooks use **raw body** — Express `body-parser` JSON parsing destroys the signature. Use `express.raw({ type: 'application/json' })` for the webhook route only.
- Transaction initialize: amount is in **kobo for NGN, cents for ZAR** (i.e. multiply by 100). Currency must be set explicitly to `ZAR` for SA merchants.
- Split payment recipients: `subaccount` field on initialize, or use the `transaction_split` resource.

`## Common mistakes` section must include:
- "Using parsed JSON body for HMAC verify — signature mismatch every time"
- "Forgetting `currency: 'ZAR'` — Paystack defaults to NGN for some accounts"
- "Treating `status: 'success'` from initialize as completed payment — that's just the init success, the customer hasn't paid yet"
- "Not checking `data.status === 'success'` from the verify endpoint before fulfilment"

- [ ] **Step 1: Research** (record URLs in a scratch note, don't commit)
- [ ] **Step 2: Author SKILL.md** with research footer linking sources + retrieval date
- [ ] **Step 3: Write examples** — three real TS snippets that compile + typecheck
- [ ] **Step 4: Write fixtures** — generate valid + tampered webhook payloads using a known test secret
- [ ] **Step 5: Run** `npm run lint:skills` — expect `OK skills/paystack/SKILL.md`
- [ ] **Step 6: Run** `npx tsc --noEmit` — expect 0
- [ ] **Step 7: Commit:** `feat(paystack): SKILL.md + init/verify/anti-pattern examples + fixtures`

---

## Task 5: PayFast skill (research-backed)

**Files:**
- Create: `skills/payfast/SKILL.md`
- Create: `skills/payfast/examples/form-signature.ts`
- Create: `skills/payfast/examples/itn-verify.ts`
- Create: `skills/payfast/examples/anti-pattern.ts`
- Create: `skills/payfast/fixtures/itn-valid.txt`
- Create: `skills/payfast/fixtures/itn-invalid-sig.txt`

PayFast documentation is notoriously inconsistent. Research the following:

1. `firecrawl-scrape` `https://developers.payfast.co.za/docs#integration_methods` and `https://developers.payfast.co.za/docs#itn`
2. Verify against the PHP reference implementation linked from the docs.

Canonical content:
- Form-post signature: concatenate non-empty fields in the documented order, URL-encode values with `+` for spaces (NOT `%20`), append `&passphrase=<urlencoded-passphrase>` if set, MD5 hash the result.
- The order-of-fields rule is the #1 trap. The fields must be ordered as they appear in the PayFast docs reference table — NOT alphabetically, NOT in form-input order. Pin the documented order in `examples/form-signature.ts` and explain why in a comment.
- ITN signature verify: same algorithm, signature is in `signature` field of the POST body.
- Sandbox host is `sandbox.payfast.co.za`, live is `www.payfast.co.za`. Use the `m_payment_id` field as your idempotency key.

`## Common mistakes`:
- "URL-encoding spaces as `%20` instead of `+` — sig mismatch"
- "Sorting fields alphabetically — sig mismatch"
- "Forgetting to drop empty fields before hashing — sig mismatch"
- "Trusting the ITN POST without verifying signature AND validating against PayFast's `validate` endpoint AND checking source IP against PayFast's published range"

- [ ] **Step 1: Research**
- [ ] **Step 2: Author SKILL.md** with citations
- [ ] **Step 3: Examples + fixtures**
- [ ] **Step 4: Lint + typecheck**
- [ ] **Step 5: Commit:** `feat(payfast): SKILL.md + form-sig/ITN-verify/anti-pattern + fixtures`

---

## Task 6: SARS skill (reference-backed)

**Files:**
- Create: `skills/sars-efiling/SKILL.md`
- Create: `skills/sars-efiling/examples/vat-calc.ts`
- Create: `skills/sars-efiling/examples/irp5-codes.ts`
- Create: `skills/sars-efiling/examples/itr12-fields.ts`
- Create: `skills/sars-efiling/examples/anti-pattern.ts`

No SARS sandbox exists for eFiling. The skill must instead cite the SARS-published guide URLs (PDF or HTML) and provide pure-function reference implementations.

Research:
1. `firecrawl-scrape` https://www.sars.gov.za/types-of-tax/value-added-tax/ for VAT
2. `firecrawl-scrape` the IRP5/IT3 codes reference at https://www.sars.gov.za/businesses-and-employers/pay-as-you-earn-paye/irp5-codes/
3. `firecrawl-scrape` ITR12 field reference

Canonical content:
- VAT 15% calc → delegate to `shared/za-primitives/vat.ts`
- IRP5 source codes — top 20 most common codes (`3601` Income, `3605` Annual payment, `3713` Subsistence, etc.) with categories
- ITR12 form field map — at least cover income + deductions sections, link to the full guide
- IT3(b) interest certificate skeleton — explain the fields, do not generate a full PDF

`## Common mistakes`:
- "Calling 14% VAT — rate changed to 15% on 2018-04-01"
- "Using a Personal Income Tax IRP5 code on a corporate payslip"
- "Generating IT3(b) without the section 1 declaration block — SARS rejects"

- [ ] **Step 1: Research + cite**
- [ ] **Step 2: Author SKILL.md**
- [ ] **Step 3: Examples (TS only — no live API)**
- [ ] **Step 4: Lint + typecheck**
- [ ] **Step 5: Commit:** `feat(sars): SKILL.md + VAT/IRP5/ITR12 examples`

---

## Task 7: Smoke tests for fintech skills

**Files:**
- Modify: `scripts/smoke-test.ts` (dispatch to per-skill smoke modules)
- Create: `scripts/smoke/paystack.ts` — hits Paystack test-mode with `PAYSTACK_TEST_SECRET_KEY` env var
- Create: `scripts/smoke/payfast.ts` — verifies ITN fixture signatures + tests sandbox URL reachability
- Create: `scripts/smoke/sars.ts` — pure-function tests for VAT against SARS worked examples
- Test: `tests/scripts/smoke/*.test.ts`

`scripts/smoke-test.ts` becomes:

```ts
import { smokePopia } from './smoke/popia.ts'; // refactor existing into smoke/popia.ts
import { smokePaystack } from './smoke/paystack.ts';
import { smokePayfast } from './smoke/payfast.ts';
import { smokeSars } from './smoke/sars.ts';

const results = await Promise.all([
  smokePopia(),
  smokePaystack(),
  smokePayfast(),
  smokeSars(),
]);
```

**Network access:**
- Paystack smoke skipped if `PAYSTACK_TEST_SECRET_KEY` not set (CI uses repo secret)
- PayFast smoke is signature-fixture only (no API call needed for the algorithm verify)
- SARS smoke is fully offline

CI's `npm run smoke` will skip the live-API portions when secrets are absent (e.g. in PR runs from forks).

- [ ] **Step 1: Refactor** existing `smokePopia` into `scripts/smoke/popia.ts`
- [ ] **Step 2: Implement** per-skill smoke modules
- [ ] **Step 3: Wire** dispatcher
- [ ] **Step 4: Add** `PAYSTACK_TEST_SECRET_KEY` as a repo secret (manual step — flag in PR description)
- [ ] **Step 5: Commit:** `feat: per-skill smoke tier with sandbox checks`

---

## Task 8: Per-emitter goldens for 3 new skills

**Files:**
- Create: 15 golden files at `tests/golden/<runtime>/{paystack,payfast,sars-efiling}.expected`

Use the same `npx tsx -e` pattern from Plan A T6 to generate each. Once generated, every subsequent body edit on a skill will require `npm run goldens:update` to refresh.

Also add:
- `scripts/build.ts --check` mode that compares `dist/` against committed goldens and exits non-zero on drift.
- `npm run goldens:update` script that regenerates all goldens (use cautiously, requires manual review of diff).

- [ ] **Step 1: Add** `--check` flag handling to `build.ts`
- [ ] **Step 2: Add** `goldens:update` npm script
- [ ] **Step 3: Generate** all 15 goldens
- [ ] **Step 4: Add** golden coverage tests (one per skill × runtime)
- [ ] **Step 5: Commit:** `test(goldens): paystack + payfast + sars-efiling across 5 runtimes`

---

## Task 9: npm publish workflow

**Files:**
- Create: `.github/workflows/release.yml`

Triggered on `git push` of tags matching `v*`. Publishes to npm with OIDC provenance — no long-lived NPM_TOKEN needed; npm trusts the workflow identity via GitHub OIDC.

Key requirements:
- `permissions: { contents: read, id-token: write }` (id-token for OIDC)
- `actions/setup-node@<sha>` with `registry-url: 'https://registry.npmjs.org'`
- `npm ci`, `npm run verify`, `npm run build` to populate `dist/` for the package
- `npm publish --provenance --access public`
- All actions pinned to SHAs (already a project policy)
- Concurrency group prevents racing tags

Prerequisite (manual, called out in PR description):
- Link the GitHub repo to the npm package via `npm access grant ...` or the npm UI's trusted-publisher config.

- [ ] **Step 1: Write workflow**
- [ ] **Step 2: Add `prepack` script** to package.json that runs `npm run build` so the published tarball includes a fresh `dist/`
- [ ] **Step 3: Dry-run** with `npm pack` locally, verify tarball contents match the `files` allowlist
- [ ] **Step 4: Commit:** `ci(release): npm publish with OIDC provenance on tag`

---

## Task 10: Plugin marketplace auto-PR

**Files:**
- Create: `.github/workflows/marketplace-pr.yml`

Triggered after a successful release workflow run. Opens a PR against the Claude plugin marketplace registry (Anthropic-hosted) with the updated `marketplace.json`.

Mechanism:
- Use `gh` CLI with a fine-grained PAT scoped only to public repo read + PR open on the marketplace registry.
- PAT stored as repo secret `MARKETPLACE_PR_TOKEN`.
- Workflow checks out `dist/claude/.claude-plugin/marketplace.json`, opens a PR with a templated body + the manifest diff.

If Anthropic hasn't published a stable registry by v0.1.0, this task degrades to "skip, publish manually" — note explicitly in the PR description. The workflow file can still land with a guard that no-ops gracefully.

- [ ] **Step 1: Check** if a stable marketplace registry URL exists at v0.1.0 time
- [ ] **Step 2: If yes** — implement the auto-PR workflow
- [ ] **Step 3: If no** — write a stub workflow with `if: false` and a TODO + README note
- [ ] **Step 4: Commit:** `ci(release): marketplace auto-PR (or stub)`

---

## Task 11: v0.1.0 release

**Files:**
- Modify: `package.json` — bump `version` to `0.1.0`
- Modify: `README.md` — flip status row to "v0.1.0 shipped"
- Update: Obsidian `README.md` mirror

- [ ] **Step 1: Bump version** in `package.json`
- [ ] **Step 2: Update READMEs** (repo + Obsidian)
- [ ] **Step 3: Run** `npm run verify` — expect 0 vulns + all tests green
- [ ] **Step 4: Open** PR `feature/plan-b` → `main`, wait for CI green, squash-merge
- [ ] **Step 5: Tag** `v0.1.0` on `main`, push the tag
- [ ] **Step 6: Verify** release workflow publishes to npm + marketplace-pr workflow opens (or stub no-ops)
- [ ] **Step 7: Verify** `npx sa-fintech-skills@0.1.0 install --runtime cursor` in a tmp dir
- [ ] **Step 8: Create** GitHub Release notes calling out Paystack/PayFast/SARS skills + Sandbox smoke + provenance
- [ ] **Step 9: Commit:** `chore: bump 0.1.0 + release notes`

---

## Plan B done — what's shipped

After Task 11, `main` carries v0.1.0 — POPIA + Paystack + PayFast + SARS skills across all five runtimes, npm-installable with provenance, with a Claude plugin marketplace listing (or documented stub).

`feature/plan-b` is deleted after the final squash-merge.

## Out of scope for v0.1.0

Deliberately deferred to v0.2.0 or beyond:

- More skills (Yoco, Ozow, Stitch, SARS PAYE, SARS UIF, etc.)
- Eval harness for agent behaviour after skill load (would become `sa-fintech-evals` sibling repo)
- A web docs site (GitHub README is enough until v1)
- Multi-language examples (TS-only for v0.1.0)
- Self-hosted plugin marketplace mirror
- Paid `sa-fintech-pro` tier (Plan C, hypothetical)
