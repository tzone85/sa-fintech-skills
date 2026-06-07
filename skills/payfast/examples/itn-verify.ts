// Verify a PayFast ITN (Instant Transaction Notification).
//
// PayFast posts the ITN to your notify_url after a payment completes. The
// posted body is form-urlencoded. Verification requires four checks (see
// SKILL.md "ITN four-step validation"); this module covers steps 1 (sig
// verify) and 3 (validate-endpoint round-trip). Steps 2 (source IP) and 4
// (DB sanity / idempotency) are application-specific and live in your
// handler.

import { createHash, timingSafeEqual } from "node:crypto";
import { phpUrlEncode } from "./form-signature.ts";

export interface ItnFields {
  /** All POST fields in the ORDER they arrived (do not re-sort). */
  ordered: ReadonlyArray<readonly [string, string]>;
}

export type Environment = "sandbox" | "live";

const VALIDATE_URLS: Record<Environment, string> = {
  sandbox: "https://sandbox.payfast.co.za/eng/query/validate",
  live: "https://www.payfast.co.za/eng/query/validate",
};

function buildSignatureFromOrdered(
  ordered: ReadonlyArray<readonly [string, string]>,
  passphrase?: string,
): string {
  const parts: string[] = [];
  for (const [key, raw] of ordered) {
    if (key === "signature") continue; // sig field is not part of its own input
    const value = (raw ?? "").trim();
    if (value === "") continue;
    parts.push(`${key}=${phpUrlEncode(value)}`);
  }
  let body = parts.join("&");
  if (passphrase && passphrase.length > 0) {
    body += `&passphrase=${phpUrlEncode(passphrase.trim())}`;
  }
  return createHash("md5").update(body).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

export interface ItnVerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Step 1: verify the signature carried in the ITN POST body. Pass the fields
 * in the order they arrived (parse the form-urlencoded body preserving
 * order — e.g. `new URLSearchParams(raw)`).
 */
export function verifyItnSignature(
  itn: ItnFields,
  passphrase?: string,
): ItnVerifyResult {
  const provided = itn.ordered.find(([k]) => k === "signature")?.[1];
  if (!provided) return { valid: false, reason: "missing signature field" };
  const expected = buildSignatureFromOrdered(itn.ordered, passphrase);
  return safeEqualHex(expected, provided)
    ? { valid: true }
    : { valid: false, reason: "signature mismatch" };
}

/**
 * Step 3: round-trip the received body back to PayFast's validate endpoint.
 * Returns true if PayFast responds with `VALID`.
 */
export async function validateWithPayFast(
  rawBody: string,
  env: Environment,
): Promise<boolean> {
  const res = await fetch(VALIDATE_URLS[env], {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: rawBody,
  });
  if (!res.ok) return false;
  const text = (await res.text()).trim();
  return text === "VALID";
}

/**
 * Parse a raw form-urlencoded body into ordered entries. Use this on the
 * raw request bytes before any framework re-orders the keys.
 */
export function parseItnBody(rawBody: string): ItnFields {
  const params = new URLSearchParams(rawBody);
  const ordered: Array<[string, string]> = [];
  for (const [k, v] of params) ordered.push([k, v]);
  return { ordered };
}
