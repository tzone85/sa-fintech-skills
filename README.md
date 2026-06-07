# sa-fintech-skills

Multi-runtime AI-agent skill pack for South African fintech APIs.

| | |
|---|---|
| Status | design approved 2026-06-07 — implementation pending |
| License | MIT |
| Runtimes | Claude Code · Cursor · Copilot · Codex · Gemini |
| Skills (v1) | `paystack` · `payfast` · `popia` · `sars-efiling` |

## What this gives an agent

AI training data is thin on Paystack webhook signing, PayFast ITN verification, POPIA consent flags, and SARS field codes. Without help, agents hallucinate.

This pack ships canonical, version-pinned `SKILL.md` files plus runnable examples and known anti-patterns so any compatible agent gets the SA-specific rules right on the first try.

## Install (after v0.1.0 ships — currently design only)

```
# Claude Code
/plugin install tzone85/sa-fintech-skills

# Cursor / Copilot / Codex / Gemini
npx sa-fintech-skills install
```

## Spec

[`docs/superpowers/specs/2026-06-07-sa-fintech-skills-design.md`](docs/superpowers/specs/2026-06-07-sa-fintech-skills-design.md)

## Layout

```
skills/<name>/SKILL.md          canonical source
shared/za-primitives/           SA ID validate, VAT calc, bank codes
scripts/                        build + lint + smoke
dist/<runtime>/                 generated artefacts (gitignored)
tests/golden/<runtime>/         emitter output goldens
docs/                           specs, diagrams, ADRs
```

## License

MIT — see [LICENSE](LICENSE).
