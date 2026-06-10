# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-06-10

### Added

- Skills: `paystack` (HMAC-SHA-512 webhook verify, ZAR init, splits),
  `payfast` (form-post MD5 signature in documented order, ITN four-step
  validation), `sars-efiling` (15% VAT, IRP5 source codes, ITR12 fields) —
  joining `popia` from the alpha.
- Shared ZA primitives: `validate-sa-id` (Luhn + DOB + citizenship), `vat`
  (banker's rounding), `bank-codes` (format validator + PASA registry).
- `npx sa-fintech-skills <install|update|doctor>` CLI (`bin/cli.mjs`) —
  dependency-free runtime auto-detection + artefact copy from the packaged
  `dist/`.
- Nightly drift cron (`.github/workflows/nightly-drift.yml`): daily fresh
  `npm ci` + dependency audit + full verify (live Paystack sandbox smoke when
  `PAYSTACK_TEST_SECRET_KEY` is configured); auto-files a `drift`-labelled
  issue on failure; manually triggerable via `workflow_dispatch`.
- Release pipeline: npm publish with OIDC provenance on `v*` tags, GitHub
  Release with generated notes, guarded plugin-marketplace auto-PR.
- Obsidian-ready documentation vault under `docs/obsidian/`.
- `prepublishOnly` guard runs the full verify suite before any publish.

### Security

- CI hardening: deny-all default permissions, actions pinned to commit SHAs,
  `persist-credentials: false`, harden-runner egress audit.
- CodeQL (`security-and-quality`) and OSSF Scorecard on weekly schedules.

## [0.0.1-alpha.0] — 2026-06-08

### Added

- Canonical `SKILL.md` format, linter, and token budgets per runtime.
- Five emitters (Claude, Cursor, Copilot, Codex, Gemini) with golden tests.
- POPIA skill with runnable examples and PII-detector smoke test.

[Unreleased]: https://github.com/tzone85/sa-fintech-skills/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tzone85/sa-fintech-skills/compare/v0.0.1-alpha.0...v0.1.0
[0.0.1-alpha.0]: https://github.com/tzone85/sa-fintech-skills/releases/tag/v0.0.1-alpha.0
