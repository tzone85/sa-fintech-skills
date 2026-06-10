---
tags: [operations, runbook, sa-fintech-skills]
created: 2026-06-10
---

# Operations Runbook

How the project runs itself, and what to do when it pages you.

## Scheduled jobs (GitHub Actions cron)

All schedules fire from `main` only — GitHub ignores `schedule` triggers on
other branches. Each can also be fired manually from the Actions tab where
`workflow_dispatch` is listed.

| Workflow | Schedule (UTC) | What it does | Manual trigger |
|---|---|---|---|
| `nightly-drift.yml` | daily 03:30 (05:30 SAST) | fresh `npm ci` → `npm audit --audit-level=high` → full verify incl. live Paystack smoke when secret set; files/updates a `drift`-labelled issue on failure | ✓ `workflow_dispatch` |
| `codeql.yml` | Mon 05:23 | security-and-quality static analysis, JS/TS + actions | on PR too |
| `scorecard.yml` | Mon 04:17 | OSSF Scorecard supply-chain posture | on branch-protection change |

> [!warning] GitHub auto-disables schedules on repos with no commit activity
> for 60 days. Any commit re-arms them; a monthly release cadence keeps them
> alive.

### When nightly drift fails

1. Open the run linked from the auto-filed `drift` issue.
2. `npm audit` step failed → a new advisory landed; Dependabot will usually
   have a PR — merge it or pin around it.
3. Smoke step failed with the live secret set → Paystack sandbox behaviour
   changed; update `skills/paystack/` content + fixtures, regenerate goldens.
4. Anything else → toolchain rot (new Node 22.x, npm regression); reproduce
   locally with `npm ci && npm run verify`.
5. Close the `drift` issue once a green run completes.

## Secrets & variables

| Name | Kind | Used by | Notes |
|---|---|---|---|
| `PAYSTACK_TEST_SECRET_KEY` | repo secret | nightly drift | optional; `sk_test_…` only — smoke refuses live keys |
| `MARKETPLACE_PR_TOKEN` | repo secret | marketplace-pr | unset until Anthropic registry is stable |
| `MARKETPLACE_REPO` | repo variable | marketplace-pr | registry slug, e.g. `anthropics/claude-plugins` |

npm publishing uses **OIDC trusted publishing** — no npm token stored anywhere.

## Release process

1. Branch from `main`, bump `version` in `package.json`, update `CHANGELOG.md`.
2. PR → CI `verify` must pass → merge.
3. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. `release.yml` runs verify again, publishes to npm with provenance, creates
   the GitHub Release with generated notes.
5. `marketplace-pr.yml` fires after Release (currently guarded `if: false`).

Pre-flight for the **first** publish: see [[Launch Checklist]].

## Local commands

| Command | Purpose |
|---|---|
| `npm run verify` | the whole gate: typecheck + lint + tests + build + smoke |
| `npm run drift` equivalent | `npm ci && npm run audit:high && npm run verify` — exactly what the nightly cron runs |
| `npm run goldens:update` | deliberately re-freeze emitter outputs |
| `node bin/cli.mjs doctor` | test runtime detection in any directory |

Related: [[Architecture]] · [[Launch Checklist]] · [[Home]]
