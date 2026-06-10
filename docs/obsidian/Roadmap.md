---
tags: [roadmap, sa-fintech-skills]
created: 2026-06-10
---

# Roadmap

What's worth doing after v0.1.0 ships, roughly in order of leverage.

## Near term

- **Link-drift checker** — skills pin upstream doc URLs with `retrieved:`
  dates; a nightly step that HEAD-checks them would catch upstream doc moves.
  (Deliberately not shipped blind: needs validation from an environment with
  open egress.)
- **Yoco skill** — third major ZA gateway, repeatedly requested context.
- **Marketplace auto-PR** — flip the `if: false` guard in
  `marketplace-pr.yml` once the Anthropic plugin registry is stable.

## Medium term

- **Ozow / Stitch / SnapScan** skills — EFT + QR rails.
- **VAT 2026 threshold automation** — the R2.3m/R120k registration thresholds
  land 1 April 2026; keep `sars-efiling` content versioned by year of
  assessment.
- **Per-runtime install analytics** — count `npx` installs by runtime flag to
  learn where users actually are.

## Signals to watch

- GitHub issues labelled `drift` (see [[Operations Runbook]])
- Paystack/PayFast changelogs after each SA budget speech (VAT rate risk)
- Anthropic plugin marketplace GA announcement

Related: [[Launch Checklist]] · [[Home]]
