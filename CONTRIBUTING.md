# Contributing

Pre-v0.1.0 — not accepting external PRs for code yet. Issues + content suggestions welcome, especially:

- **PayFast / SARS / Paystack behaviour you've hit in production** — quirks, undocumented limits, error responses, sandbox gotchas. These are exactly what AI agents lack.
- **POPIA edge cases your legal team has lawyered** — specific §11 / §72 scenarios with cited rulings.
- **A runtime we haven't covered** — link to its skill-loading mechanism and we'll consider an emitter.
- **A misclassification by the POPIA detector** — false positive or false negative, with the file content.

## How to run locally

```
nvm use            # node 22
npm install
npm test           # 39 tests
npm run lint:skills
npm run build      # emits dist/<runtime>/
npm run smoke      # POPIA static analyser
```

## Adding a skill (when PRs open)

Each skill is one directory under `skills/`:

```
skills/<name>/SKILL.md
skills/<name>/examples/<positive>.ts
skills/<name>/examples/anti-pattern.ts
skills/<name>/fixtures/*.json     # optional
```

`SKILL.md` must have YAML frontmatter with `name`, `description` (60-200 chars), and `metadata.targets` (subset of claude/cursor/copilot/codex/gemini). Body must contain literal H2 sections `## Triggers` (≥ 3 phrases), `## Examples`, `## Common mistakes`.

Run `npm run lint:skills` before committing.

## Adding an emitter

For a new runtime (e.g. windsurf):

1. Add the literal to `ALL_TARGETS` in `scripts/lib/runtime-config.ts`.
2. Add a cap to `RUNTIME_CAPS` (TypeScript will require this).
3. Create `scripts/emitters/<runtime>.ts` following the existing pattern.
4. Wire it into `EMITTERS` in `scripts/build.ts`.
5. Add a golden under `tests/golden/<runtime>/popia.expected` (regenerate via the same `npx tsx -e` snippet pattern from existing emitters).
6. Add test under `tests/scripts/emitters/<runtime>.test.ts`.
7. Update `detectRuntime` in `scripts/install.ts` if there's a marker file/dir.

## TDD is required

Every change must land with a failing test first, then implementation. Coverage threshold is 80% statements/lines/functions and enforced in CI.

## Commit style

Conventional commits: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`, `docs: ...`, `refactor: ...`, `ci: ...`, `test: ...`.
