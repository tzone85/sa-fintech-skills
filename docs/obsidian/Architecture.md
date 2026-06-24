---
tags: [architecture, sa-fintech-skills]
created: 2026-06-10
---

# Architecture

One canonical source, five emitters, golden-tested outputs.

```
skills/<name>/SKILL.md          ← canonical source (YAML frontmatter + body)
        │
   scripts/lint-skill.ts        ← validates frontmatter, sections, triggers,
        │                          per-runtime token budgets
   scripts/build.ts             ← orchestrator, walks skills/
        │
        ├── emitters/claude.ts   → dist/claude/   SKILL.md + marketplace.json
        ├── emitters/cursor.ts   → dist/cursor/   .cursor/rules/<name>.mdc
        ├── emitters/copilot.ts  → dist/copilot/  .github/copilot-instructions.md
        ├── emitters/codex.ts    → dist/codex/    AGENTS.md
        └── emitters/gemini.ts   → dist/gemini/   skills.json + per-skill .md
```

Full rendered diagrams: [architecture](../diagrams/architecture.svg) ·
[data flow](../diagrams/data-flow.svg) · [release fan-out](../diagrams/release-fan-out.svg)

## Key decisions

- **SKILL.md is the only thing authors touch.** Add a skill → every runtime
  gets it; add a runtime → write one emitter, existing skills flow through.
- **Token budgets per runtime** (`scripts/lib/runtime-config.ts`): cursor 2k,
  copilot 6k, claude/gemini 8k, codex 10k. The linter fails a skill that
  exceeds the cap for any declared target.
- **Golden tests as contracts** (`tests/golden/<runtime>/`): emitter output is
  snapshot-frozen; regenerate deliberately with `npm run goldens:update`.
- **Smoke tests prove the examples** (`scripts/smoke/`): signature fixtures
  verified offline; Paystack additionally hits the live test-mode init
  endpoint when `PAYSTACK_TEST_SECRET_KEY` is set.
- **`bin/cli.mjs` is dependency-free JS** so `npx sa-fintech-skills install`
  works from the published tarball without a TypeScript loader; the tarball
  ships `dist/` prebuilt via `prepack`.

## Distribution paths

1. **npm** — `npx sa-fintech-skills install` (auto-detects runtime, copies `dist/<runtime>/` into the project)
2. **Claude plugin** — `/plugin install tzone85/sa-fintech-skills`
3. **Manual** — copy `dist/<runtime>/` after `npm run build`

See [[Operations Runbook]] for how releases fan out.
