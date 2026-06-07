# sa-fintech-skills — design

**Status:** approved (2026-06-07)
**Author:** Thando Mini
**Repo:** `tzone85/sa-fintech-skills` · MIT
**One-line:** Multi-runtime AI-agent skill pack for South African fintech APIs (Paystack, PayFast, POPIA, SARS) with a single canonical source and per-runtime emitters.

---

## §1 Why this exists

AI training data is thin on SA-specific fintech APIs, so agents hallucinate PayFast signature schemes, miss POPIA consent flags, and invent SARS field codes. A curated, version-pinned skill pack becomes the canonical reference for any agent (Claude Code, Cursor, Copilot, Codex, Gemini) touching ZA payment or compliance code.

Wedge: zero existing coverage, real domain expertise (Sanlam + indie fintech work), small but unserved market. Funnels to paid Spring Pack and Next.js AI Pack — credibility + SEO play.

---

## §2 Architecture

One canonical `SKILL.md` per skill. Build script reads each, emits per-runtime artefacts. Single source of truth, fan-out at release time.

![architecture](../../diagrams/architecture.svg)

**Repo layout:**

```
sa-fintech-skills/
├── skills/
│   ├── paystack/SKILL.md          # canonical source
│   ├── paystack/examples/         # runnable TS + Python snippets
│   ├── paystack/fixtures/         # sample webhook payloads
│   ├── payfast/...
│   ├── popia/...
│   └── sars-efiling/...
├── shared/za-primitives/          # SA ID validate, VAT calc, bank codes
├── scripts/
│   ├── build.ts                   # canonical → per-runtime emitter
│   ├── lint-skill.ts              # frontmatter + structure check
│   └── smoke-test.ts              # invoke examples against sandboxes
├── dist/                          # generated, gitignored, CI-published
├── tests/golden/<runtime>/        # emitter output goldens
├── .github/workflows/             # lint, smoke, release
└── README.md
```

Skills declare `metadata.targets` ⊆ {claude, cursor, copilot, codex, gemini}. Skills that won't fit a runtime's token budget are filtered, not mangled.

---

## §3 Components

### 3.1 Four v1 skills

| Skill | Triggers | Surface |
|---|---|---|
| `paystack` | "paystack", "init payment", "verify webhook", "split payment" | Init transaction, HMAC-SHA-512 webhook verify, subs, split-payment recipients, ZAR gotchas |
| `payfast` | "payfast", "ITN", "subscription token" | Form-post MD5 signature, ITN verify, sandbox/live URL switch, tokenization |
| `popia` | "popia", "PII", "consent", "data residency" | Code audit for PII handling, consent flags, residency check, DSAR endpoint template |
| `sars-efiling` | "sars", "VAT", "ITR12", "tax cert" | VAT 15% rounding, IRP5 code lookup, ITR12 field map, IT3(b) cert skeleton |

Each `SKILL.md` body has `## Triggers`, `## Examples`, `## Common mistakes`. The mistakes block is non-negotiable — see §4.

### 3.2 Shared primitives — `shared/za-primitives/`

| Primitive | Used by |
|---|---|
| `validate-sa-id.ts` (Luhn + DOB + citizenship digit) | popia, paystack KYC |
| `vat.ts` (incl/excl with rounding) | paystack, sars-efiling |
| `bank-codes.ts` (branch-code lookup) | paystack, payfast |

Skills reference primitives via relative import in `examples/` only — primitives never appear in `SKILL.md` body text, so emitters don't have to inline them.

### 3.3 Build tooling — `scripts/`

| Script | Job |
|---|---|
| `lint-skill.ts` | Validate frontmatter, trigger count, per-runtime token budget |
| `build.ts` | Emit `dist/<runtime>/` from canonical sources |
| `smoke-test.ts` | Exercise `examples/` against Paystack/PayFast sandbox + static analysers |

### 3.4 Emitters — one per runtime

| Runtime | Output | Notes |
|---|---|---|
| Claude | `dist/claude/skills/<name>/SKILL.md` + `marketplace.json` | Verbatim copy + plugin manifest |
| Cursor | `dist/cursor/.cursor/rules/<name>.mdc` | Maps `description` → `globs` + `alwaysApply` |
| Copilot | `dist/copilot/.github/copilot-instructions.md` | Concatenates all skills (~6k token cap) under H2s |
| Codex | `dist/codex/AGENTS.md` | Same H2 structure as Copilot |
| Gemini | `dist/gemini/skills.json` | Manifest for `activate_skill` API |

---

## §4 Data flow

End-to-end, author edit through to user's agent applying the skill:

![data-flow](../../diagrams/data-flow.svg)

**Single CLI for non-Claude runtimes** — `npx sa-fintech-skills install` detects which runtime config is present (`.cursor/`, `.github/`, `AGENTS.md`) and writes the matching artefact. Idempotent. `--runtime <name>` forces a target when detection is ambiguous.

**Version pinning** — every generated artefact carries a header `# sa-fintech-skills@v0.3.1` so drift is greppable.

---

## §5 Error handling — three failure planes

### 5.1 Build-time (`lint-skill.ts` + `build.ts`)

| Trigger | Behaviour |
|---|---|
| Missing required frontmatter | Fail with `skill <name>: missing key 'description'` |
| Body exceeds runtime token budget | Fail listing which runtime can't carry; suggest `metadata.targets` filter |
| Trigger phrases missing | Fail — non-Claude runtimes can't lazy-load, need triggers in body |
| Emitter exception | Fail loud, never write partial `dist/` |

### 5.2 Runtime drift — external APIs move

Nightly `smoke-test.ts` cron hits Paystack/PayFast sandboxes with `examples/` snippets.

| API | Drift detection |
|---|---|
| Paystack | Sandbox webhook signature verify, init returns auth_url |
| PayFast | Sandbox ITN signature verify, form-post MD5 matches |
| POPIA | No sandbox → version-pin spec URL in frontmatter, quarterly manual review |
| SARS | No sandbox → version-pin spec URL, quarterly manual review |

Drift detected → auto `gh issue create` labelled `drift:<api>`. README links the open-issues list so users see currency before installing.

### 5.3 Agent-time — user's agent misuses skill

Each `SKILL.md` ends with `## Common mistakes` — explicit anti-patterns with reasons (e.g. "PayFast passphrase must be URL-encoded *before* MD5; agents skip this"). `examples/<name>/anti-pattern.ts` includes a deliberately-wrong variant with a comment explaining why.

No silent fallbacks. Skill never says "if signature fails, log and continue". Always: fail closed, surface to user.

### 5.4 Out of scope

- Users running stale `dist/` artefacts (mitigated by version header, not enforced)
- Forks dropping emitter targets (their problem)
- Payment-processor incidents (link processor status pages, no further help)

---

## §6 Testing — three layers, all in CI

### 6.1 Skill lint (every push)

`lint-skill.ts` asserts:

| Check | Rule |
|---|---|
| `name` | kebab-case |
| `description` | 60–200 chars |
| `metadata.targets` | subset of allowed runtimes |
| Body sections | `## Triggers`, `## Examples`, `## Common mistakes` present |
| Token budget | body + examples within per-target budget |
| Trigger phrases | ≥ 3 distinct per skill |
| Markdown links | no broken refs |

### 6.2 Smoke tests against sandboxes (nightly + on tag)

`smoke-test.ts` walks `examples/*`:

| Skill | Smoke |
|---|---|
| Paystack | test-mode init returns auth_url; webhook fixture verifies |
| PayFast | sandbox ITN fixture verifies; form-post MD5 matches expected |
| POPIA | static analyser flags expected lines, none in clean variant |
| SARS | pure-function tests vs worked examples from SARS guides |

Failure → red CI + auto-issue (see §5.2).

### 6.3 Emitter golden tests (every push)

`tests/golden/<runtime>/<skill>.expected` committed. `build.ts --check` rebuilds in memory, diffs against goldens, fails on drift. Body edits require regenerating goldens (`npm run goldens:update`), forcing author to see cross-runtime diff before merging.

### 6.4 Coverage targets

| Surface | Target |
|---|---|
| `shared/za-primitives/` | 90%+ unit coverage, table-driven SA ID cases |
| Examples | every example runs green in smoke tier |
| Emitters | 100% golden coverage; new runtime cannot ship without golden suite |

### 6.5 Out of scope for v1

Agent behaviour after loading the skill. Untestable at repo level — that's the user's eval problem. Possible sibling repo `sa-fintech-evals` later.

---

## §7 Distribution & release

### 7.1 Versioning — SemVer

| Bump | Triggers |
|---|---|
| MAJOR | skill rename, runtime removed |
| MINOR | new skill, new runtime target |
| PATCH | body edits, example fixes, drift patches |

### 7.2 Release channels

| Channel | Payload | Trigger |
|---|---|---|
| npm (`sa-fintech-skills`) | CLI installer + `dist/` bundle | `git tag v*` |
| GH Release | zipped `dist/` per runtime | same tag |
| Claude plugin marketplace | `marketplace.json` auto-PR | same tag |
| Gemini extensions index | manifest URL pinned to GH Release asset | same tag |
| Cursor / Copilot / Codex | no native marketplace — `npx sa-fintech-skills install` | n/a |

![release-fan-out](../../diagrams/release-fan-out.svg)

### 7.3 Install UX

```
npx sa-fintech-skills install              # auto-detects runtime
npx sa-fintech-skills install --runtime cursor
npx sa-fintech-skills install --skills paystack,popia
npx sa-fintech-skills update                # bumps pinned version
npx sa-fintech-skills doctor                # version + drift check
```

### 7.4 Discoverability

GitHub topics: `claude-code`, `cursor`, `copilot`, `agent-skills`, `paystack`, `payfast`, `popia`, `south-africa`, `fintech`.

README opens with one-line install per runtime + 30-second video of an agent writing a Paystack webhook verifier correctly on first try. Cross-link from `spring-skill-pack` and `nextjs-ai-skill-pack` READMEs.

### 7.5 Funnel

Free pack establishes credibility + SEO for "AI agent + SA fintech" intent. Paid packs link in as use-case examples. Future paid sibling `sa-fintech-pro` covers production-hardening (idempotency, reconciliation, settlement) behind paywall.

### 7.6 Maintenance cadence

| Cadence | Job |
|---|---|
| Weekly | triage drift issues from nightly smoke |
| Quarterly | manual POPIA + SARS regulation review (scheduled routine) |
| On regulator change | hotfix patch release |

---

## §8 Open questions for implementation phase

These do not block design approval but need answers before coding:

- Which `examples/` runtime — TS-only, or TS + Python parity? (Paystack and PayFast SDKs both, but doubles maintenance.)
- Token budget per runtime — confirm exact caps for Copilot and Codex against current docs at implementation time.
- Cursor `.mdc` `alwaysApply` vs `globs` — default to `globs` matching common payment-handler paths, or `alwaysApply: false` requiring explicit `@` reference?
- Plugin marketplace PR automation — GH App vs deploy key for cross-repo PR?

---

## §9 Glossary

| Term | Meaning |
|---|---|
| Canonical source | The single `SKILL.md` an author edits |
| Emitter | Runtime-specific code that converts canonical source to that runtime's expected file format |
| Target | A runtime declared in `metadata.targets` |
| Golden | Committed expected output of an emitter, diffed in CI |
| Drift | Detected change in external API or regulation that breaks an example |
