// Initialise a Paystack transaction for a South African merchant.
//
// Two things you MUST get right:
//   1. amount is in cents, not rand (R150.00 → 15000)
//   2. currency is "ZAR" explicit — default depends on integration

import { vatExclToIncl } from "../../../shared/za-primitives/vat.ts";

const PAYSTACK_API = "https://api.paystack.co";

export interface InitOptions {
  email: string;
  /** Rand value (e.g. 150 for R150.00). Convert to cents internally. */
  amountRand: number;
  reference: string;
  callbackUrl: string;
  /** Optional split routing for marketplaces. */
  subaccount?: string;
}

export interface InitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

function randToCents(rand: number): number {
  if (!Number.isFinite(rand) || rand < 0) {
    throw new Error("amountRand must be a non-negative finite number");
  }
  return Math.round(rand * 100);
}

export async function initialiseTransaction(
  secretKey: string,
  opts: InitOptions,
): Promise<InitResponse> {
  if (!secretKey.startsWith("sk_")) {
    throw new Error("secretKey must be a Paystack secret key (sk_test_… or sk_live_…)");
  }

  const body = {
    email: opts.email,
    amount: randToCents(opts.amountRand),
    currency: "ZAR",
    reference: opts.reference,
    callback_url: opts.callbackUrl,
    ...(opts.subaccount ? { subaccount: opts.subaccount } : {}),
  };

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`paystack init failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as InitResponse;
}

// Example: initialise a R1500 (incl-VAT) checkout for a customer.
export async function example(): Promise<string> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not configured");

  const grossRand = vatExclToIncl(1304.35); // R1304.35 + 15% VAT = R1500
  const result = await initialiseTransaction(secret, {
    email: "buyer@example.co.za",
    amountRand: grossRand,
    reference: `ord-${Date.now()}`,
    callbackUrl: "https://your-domain.example.co.za/checkout/return",
  });
  return result.data.authorization_url;
}
