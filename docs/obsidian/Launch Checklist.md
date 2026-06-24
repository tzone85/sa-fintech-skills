---
tags: [launch, checklist, sa-fintech-skills]
created: 2026-06-10
---

# Launch Checklist — v0.1.0

Code is ready (85 tests green, 0 audit vulns, CLI wired). What remains is
account plumbing and the button-press, in order:

## One-time setup (≈30 min, do once)

- [ ] **npm trusted publisher**: on npmjs.com, claim the `sa-fintech-skills`
      package name and configure GitHub Actions OIDC trusted publishing for
      `tzone85/sa-fintech-skills` / `release.yml`. Without this the publish
      step fails — there is deliberately no `NPM_TOKEN` secret.
- [ ] (Optional) add repo secret `PAYSTACK_TEST_SECRET_KEY` (`sk_test_…`) so
      the nightly cron exercises the live sandbox.

## Ship

- [ ] Merge the production-readiness branch into `main`.
- [ ] Manually fire **Nightly drift** once from the Actions tab
      (`workflow_dispatch`) and confirm a green run — this proves the cron
      end-to-end before trusting the schedule.
- [ ] `git tag v0.1.0 && git push origin v0.1.0` → release workflow publishes
      to npm with provenance + creates the GitHub Release.
- [ ] Smoke the consumer path from a clean directory:
      `npx sa-fintech-skills@latest install --runtime cursor`.

## Announce (same day)

- [ ] README install section flips from "after v0.1.0 ships" to live.
- [ ] Post where ZA devs actually are: ZATech Slack (#fintech, #ai),
      r/southafrica dev threads, X/LinkedIn, Paystack & PayFast developer
      communities.
- [ ] Ask three real users for the first GitHub issues — drift reports from
      production are the moat.

Related: [[Operations Runbook]] · [[Roadmap]] · [[Home]]
