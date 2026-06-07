// WRONG patterns for PayFast signing. Each block explains why it produces a
// signature that PayFast will reject (or worse: accept a tampered ITN).

import { createHash } from "node:crypto";

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. Using encodeURIComponent without the "+" substitution.              │
// │    PHP urlencode emits "+" for spaces. JS encodeURIComponent emits     │
// │    "%20". The hashes will never match.                                 │
// └─────────────────────────────────────────────────────────────────────────┘

export function badEncode(value: string): string {
  // BAD: spaces become %20 instead of +.
  return encodeURIComponent(value);
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. Sorting fields alphabetically. The API-signature endpoint uses      │
// │    that. The form-post / ITN flow does NOT.                            │
// └─────────────────────────────────────────────────────────────────────────┘

export function badSort(form: Record<string, string>): string {
  // BAD: alphabetical Object.keys + sort. Use the documented attribute order
  // (merchant_id, merchant_key, return_url, ... — see form-signature.ts).
  return Object.keys(form)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(form[k]).replace(/%20/g, "+")}`)
    .join("&");
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. Including empty string fields. PayFast's algorithm skips them; if   │
// │    you emit `cell_number=&` when the buyer left it blank, the hash    │
// │    will differ from PayFast's.                                         │
// └─────────────────────────────────────────────────────────────────────────┘

export function badIncludeEmpty(form: Record<string, string>): string {
  const order = ["merchant_id", "merchant_key", "name_first", "cell_number"];
  // BAD: emits `cell_number=` when the value is "".
  return order.map((k) => `${k}=${form[k] ?? ""}`).join("&");
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. Accepting an ITN that only passes signature verification.           │
// │    The PayFast docs require FOUR checks: signature + IP + validate     │
// │    round-trip + idempotency. Skipping any of them is exploitable.      │
// └─────────────────────────────────────────────────────────────────────────┘

export async function badAcceptItn(_signatureOk: boolean): Promise<boolean> {
  // BAD: marks the order paid the moment the signature checks out.
  // CORRECT: signature pass → source-IP check against PayFast's published
  // ranges → POST body back to /eng/query/validate and expect "VALID" →
  // confirm the m_payment_id maps to an open order with matching
  // amount_gross AND has not already been marked paid.
  return _signatureOk;
}

// Helper for the smoke test — produces a tampered signature that should be
// rejected by a correct verifier.
export function tamperedMd5(input: string): string {
  return createHash("md5")
    .update(input + "tampered")
    .digest("hex");
}
