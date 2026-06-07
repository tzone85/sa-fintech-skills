// WRONG patterns for Paystack integration — each block explains why it fails
// and the smoke test asserts these would not pass signature verification or
// would charge the wrong amount.

import { createHmac } from "node:crypto";

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. Comparing signatures with === leaks timing information.              │
// └─────────────────────────────────────────────────────────────────────────┘

export function unsafeCompare(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  // BAD: `===` short-circuits character-by-character; an attacker can probe
  // the response time to recover the signature one byte at a time. Use
  // crypto.timingSafeEqual on equal-length Buffers instead.
  return expected === signature;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. Treating "amount" as rand instead of cents undercharges by 100x.    │
// └─────────────────────────────────────────────────────────────────────────┘

export function badAmount(orderRand: number): { amount: number; currency: string } {
  return {
    // BAD: R150.00 becomes 150 cents = R1.50 charged to the customer.
    // CORRECT: Math.round(orderRand * 100).
    amount: orderRand,
    currency: "ZAR",
  };
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. Omitting currency lets Paystack default to the integration's       │
// │    currency — which for some SA accounts is still NGN.                 │
// └─────────────────────────────────────────────────────────────────────────┘

export function missingCurrency(emailcents: { email: string; cents: number }) {
  // BAD: silent NGN charges on accounts whose primary currency is NGN.
  return {
    email: emailcents.email,
    amount: emailcents.cents,
    // currency intentionally absent
  };
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. Treating initialize's status:"success" as "the customer paid".      │
// └─────────────────────────────────────────────────────────────────────────┘

interface InitResponse {
  status: boolean;
  data: { authorization_url: string; reference: string };
}

export function fulfillOnInit(initResponse: InitResponse): boolean {
  // BAD: status:true just means the init request succeeded. The customer is
  // about to be redirected and may abandon. ALWAYS re-verify via
  // GET /transaction/verify/:reference before fulfillment.
  return initResponse.status === true;
}
