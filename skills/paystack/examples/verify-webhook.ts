// Verify a Paystack webhook with timing-safe HMAC-SHA-512 comparison.
//
// Two routes here:
//   verifySignature(rawBody, header, secret) — works on the raw request body.
//     Use this when your framework gives you the bytes (express.raw, fastify
//     onSend, native http req).
//
//   verifyParsedBody(parsed, header, secret) — works after JSON parsing.
//     Less robust because key ordering / whitespace must match exactly. The
//     Paystack docs use this pattern but it can break silently if the parser
//     re-encodes differently. Prefer the raw form.

import { createHmac, timingSafeEqual } from "node:crypto";

const SIG_HEADER = "x-paystack-signature";

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

function hmacHex(secret: string, body: string | Buffer): string {
  return createHmac("sha512", secret).update(body).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

export function verifySignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string,
): VerifyResult {
  if (!signatureHeader) {
    return { valid: false, reason: `missing ${SIG_HEADER} header` };
  }
  if (!secret.startsWith("sk_")) {
    return { valid: false, reason: "secret must be a Paystack secret key" };
  }
  const expected = hmacHex(secret, rawBody);
  return safeEqualHex(expected, signatureHeader)
    ? { valid: true }
    : { valid: false, reason: "signature mismatch" };
}

export function verifyParsedBody(
  parsedBody: unknown,
  signatureHeader: string | undefined,
  secret: string,
): VerifyResult {
  return verifySignature(JSON.stringify(parsedBody), signatureHeader, secret);
}

// Minimal Express-style handler. Mount with express.raw on this route only.
//
//   app.post('/webhooks/paystack', express.raw({type: 'application/json'}), handler);
//
// Returning 200 fast is important — Paystack retries non-2xx responses.
export interface WebhookHandlerOptions {
  secret: string;
  /** Called with the parsed event on a verified-good payload. */
  onEvent: (event: PaystackEvent) => Promise<void> | void;
}

export interface PaystackEvent {
  event: string;
  data: Record<string, unknown>;
}

export function makeHandler(opts: WebhookHandlerOptions) {
  return async function handler(
    req: {
      body: Buffer | string;
      headers: Record<string, string | string[] | undefined>;
    },
    res: { status: (n: number) => { send: (s: string) => void } },
  ) {
    const sig = req.headers[SIG_HEADER];
    const result = verifySignature(
      req.body,
      typeof sig === "string" ? sig : undefined,
      opts.secret,
    );
    if (!result.valid) {
      res.status(401).send(result.reason ?? "invalid signature");
      return;
    }
    const raw: string = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : String(req.body);
    const event = JSON.parse(raw) as PaystackEvent;
    await opts.onEvent(event);
    res.status(200).send("ok");
  };
}
