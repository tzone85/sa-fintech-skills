// PayFast smoke — fixture signature verification only. PayFast has a
// sandbox payment form but no programmatic init endpoint; the signing
// algorithm is the high-value thing to verify offline.

import type { SmokeResult } from "./popia.ts";
import {
  parseItnBody,
  verifyItnSignature,
} from "../../skills/payfast/examples/itn-verify.ts";
import { readFileSync } from "node:fs";

const VALID = "skills/payfast/fixtures/itn-valid.txt";
const INVALID = "skills/payfast/fixtures/itn-invalid-sig.txt";
const PASSPHRASE = "jt7NOE43FZPn";

export function smokePayfast(): SmokeResult {
  const reasons: string[] = [];

  const validBody = readFileSync(VALID, "utf8").trim();
  const invalidBody = readFileSync(INVALID, "utf8").trim();

  const valid = verifyItnSignature(parseItnBody(validBody), PASSPHRASE);
  if (!valid.valid) {
    reasons.push(`itn-valid.txt failed verify: ${valid.reason}`);
  }
  const invalid = verifyItnSignature(parseItnBody(invalidBody), PASSPHRASE);
  if (invalid.valid) {
    reasons.push("itn-invalid-sig.txt should not verify");
  }

  return { skill: "payfast", ok: reasons.length === 0, reasons };
}
