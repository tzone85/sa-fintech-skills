// Generate the PayFast form-post signature.
//
// The algorithm is documented at developers.payfast.co.za/docs#checkout_security
// and the reference implementation is PHP. The three traps are:
//   1. Field order is the documented "attributes description" order, NOT
//      alphabetical. The PayFast docs explicitly warn against alphabetical.
//   2. urlencode() in PHP encodes spaces as "+", not "%20". JavaScript's
//      encodeURIComponent uses "%20" and will mismatch.
//   3. Empty fields are skipped — not emitted as `key=`.

import { createHash } from "node:crypto";

/**
 * Documented PayFast form-field order. The signature is built by walking
 * this list in order, skipping any field whose value is empty/undefined.
 *
 * Any field your form sends that is NOT in this list will not be signed —
 * which means PayFast will reject the post. Extend this list if PayFast adds
 * new fields and update the SKILL.md source citation.
 */
export const PAYFAST_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

export type PayFastField = (typeof PAYFAST_FIELD_ORDER)[number];

export type PayFastForm = Partial<Record<PayFastField, string | number>>;

/**
 * PHP-compatible URL encoding: spaces become "+", everything else as
 * encodeURIComponent. PayFast's PHP reference uses rawurlencode-style for
 * keys but standard urlencode (spaces → "+") for values; we match that.
 */
export function phpUrlEncode(value: string): string {
  return (
    encodeURIComponent(value)
      .replace(/%20/g, "+")
      // PHP urlencode also leaves these characters un-encoded vs. JS:
      .replace(/!/g, "%21")
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\*/g, "%2A")
      .replace(/~/g, "%7E")
  );
}

function buildSignatureString(form: PayFastForm): string {
  const parts: string[] = [];
  for (const key of PAYFAST_FIELD_ORDER) {
    const raw = form[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value === "") continue;
    parts.push(`${key}=${phpUrlEncode(value)}`);
  }
  return parts.join("&");
}

export interface SignatureOptions {
  /** The passphrase set in the PayFast Merchant Dashboard. Optional but recommended. */
  passphrase?: string;
}

/**
 * Generate the MD5 signature for a PayFast checkout form. Returns the lowercase hex digest
 * that should be set as the hidden `signature` form field.
 */
export function generateFormSignature(
  form: PayFastForm,
  opts: SignatureOptions = {},
): string {
  let body = buildSignatureString(form);
  if (opts.passphrase && opts.passphrase.length > 0) {
    body += `&passphrase=${phpUrlEncode(opts.passphrase.trim())}`;
  }
  return createHash("md5").update(body).digest("hex");
}

// Example: build a complete signed form for a R150.00 checkout.
export function exampleSignedForm(): PayFastForm & { signature: string } {
  const form: PayFastForm = {
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    return_url: "https://example.co.za/checkout/return",
    cancel_url: "https://example.co.za/checkout/cancel",
    notify_url: "https://example.co.za/api/payfast/itn",
    name_first: "Thandi",
    name_last: "Nkosi",
    email_address: "thandi@example.co.za",
    m_payment_id: "ord-123",
    amount: "150.00",
    item_name: "Pro license",
  };
  const signature = generateFormSignature(form, { passphrase: "jt7NOE43FZPn" });
  return { ...form, signature };
}
