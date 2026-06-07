// Paystack smoke — exercises the test-mode init endpoint when
// PAYSTACK_TEST_SECRET_KEY is configured. Skipped (not failed) in
// environments without the secret, so PR runs from forks still go green.

import type { SmokeResult } from "./popia.ts";
import { verifySignature } from "../../skills/paystack/examples/verify-webhook.ts";
import { readFileSync } from "node:fs";

const VALID_FIXTURE = "skills/paystack/fixtures/webhook-valid.json";
const INVALID_FIXTURE = "skills/paystack/fixtures/webhook-invalid-sig.json";
const FIXTURE_SECRET = "sk_test_paystack_skill_fixture_secret_2026";

interface Fixture {
  signature: string;
  body: unknown;
}

function loadFixture(path: string): Fixture {
  return JSON.parse(readFileSync(path, "utf8")) as Fixture;
}

export async function smokePaystack(): Promise<SmokeResult> {
  const reasons: string[] = [];

  // Offline portion: signature fixture round-trip.
  const valid = loadFixture(VALID_FIXTURE);
  const invalid = loadFixture(INVALID_FIXTURE);
  const rawValid = JSON.stringify(valid.body);
  const rawInvalid = JSON.stringify(invalid.body);

  const validResult = verifySignature(rawValid, valid.signature, FIXTURE_SECRET);
  if (!validResult.valid) {
    reasons.push(`webhook-valid.json fixture failed verify: ${validResult.reason}`);
  }
  const invalidResult = verifySignature(
    rawInvalid,
    invalid.signature,
    FIXTURE_SECRET,
  );
  if (invalidResult.valid) {
    reasons.push("webhook-invalid-sig.json fixture should not verify");
  }

  // Live portion: only if the test secret is available.
  const liveSecret = process.env.PAYSTACK_TEST_SECRET_KEY;
  if (!liveSecret) {
    return {
      skill: "paystack",
      ok: reasons.length === 0,
      reasons,
      skipped: false,
    };
  }
  if (!liveSecret.startsWith("sk_test_")) {
    reasons.push("PAYSTACK_TEST_SECRET_KEY must be a sk_test_… key");
    return { skill: "paystack", ok: false, reasons };
  }

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liveSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "smoke@sa-fintech-skills.example",
        amount: 10000,
        currency: "ZAR",
        reference: `smoke-${Date.now()}`,
      }),
    });
    if (!res.ok) {
      reasons.push(`paystack init returned HTTP ${res.status}`);
    } else {
      const json = (await res.json()) as { status?: boolean; data?: { authorization_url?: string } };
      if (json.status !== true || !json.data?.authorization_url) {
        reasons.push("paystack init response missing status:true or authorization_url");
      }
    }
  } catch (err) {
    reasons.push(`paystack init threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { skill: "paystack", ok: reasons.length === 0, reasons };
}
