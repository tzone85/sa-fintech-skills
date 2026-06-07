# Security Policy

## Threat model

`sa-fintech-skills` ships content that AI coding agents load and apply to user code that handles **payments and personal information**. The threat surface is therefore wider than a typical npm utility:

1. **Skill content trust** — a malicious or subtly-wrong skill could cause an agent to emit broken signature verification, miss POPIA consent capture, or leak PII. Treat every change to `skills/*/SKILL.md` and `skills/*/examples/**` as security-relevant.
2. **Supply chain** — npm package, GitHub Actions, and transitive deps are all attack vectors. Production deps (`gpt-tokenizer`, `gray-matter`) are kept minimal; dev tooling is monitored via Dependabot + CodeQL + OSSF Scorecard.
3. **Repo integrity** — `main` is branch-protected; CI must pass before merge; tags are not auto-deployed anywhere yet (no npm publish until v0.1.0).

## Supported versions

Pre-v0.1.0 (alpha). Only the latest tag receives security fixes. Once v0.1.0 ships, we will adopt N-1 support for one minor cycle.

| Version | Supported |
|---|---|
| `0.0.1-alpha.x` | ✓ (current) |
| `< 0.0.1-alpha` | ✗ |

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Use GitHub's private vulnerability reporting:
**https://github.com/tzone85/sa-fintech-skills/security/advisories/new**

If you cannot use private advisories, email the maintainer at the address on the GitHub profile and include `[security][sa-fintech-skills]` in the subject.

## What to include

- Affected version + commit SHA.
- Minimal reproduction (a SKILL.md, a piece of agent output, or a sequence of CLI calls).
- The likely user impact (e.g. "agent will accept invalid PayFast ITN signatures and process spoofed payments").
- A suggested fix if you have one.

## Response targets

| Severity | Acknowledgement | Patch + advisory |
|---|---|---|
| Critical (signature bypass, PII leak, RCE via skill content) | 48 hours | 7 days |
| High (incorrect compliance guidance, broken anti-pattern detection) | 5 days | 21 days |
| Medium / Low | 14 days | next minor release |

Alpha-stage, single-maintainer — these are best-effort targets. You will get an honest update if a slip is likely.

## Out of scope

- Vulnerabilities in `vitest --ui`, `tsx`, or other dev-only tooling that are not invoked by `npm test` / `npm run build` / `npm run smoke` / `npm run lint:skills`. We surface these via Dependabot for awareness but they are not user-facing.
- Issues that require write access to `main` (you'd already be the attacker).
- POPIA / SARS / Paystack / PayFast bugs that exist independently of this skill pack — report those upstream.

## Coordinated disclosure

Public advisory and patch land together. If a critical vulnerability requires temporarily pulling a release, we will tag a hot-fix and publish the advisory at the same time.

## Hall of fame

Researchers who report verified, in-scope vulnerabilities receive credit in the advisory and on the project page (with their consent). No paid bounty programme yet.
