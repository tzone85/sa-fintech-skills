// SA bank branch codes primitive.
//
// PASA (Payments Association of South Africa) maintains the canonical list
// of universal branch codes — single codes per bank that route to any branch.
// The list changes when banks merge, rebrand, or transfer customer bases
// (e.g. Mercantile → Capitec absorption, Grindrod → African Bank).
//
// Scope for v0.1.0:
//   - Branch-code FORMAT validation (6 digits) is the high-value primitive
//     for any payment integration — catches user typos at the API boundary
//     regardless of which bank.
//   - Bank-name-to-code MAPPING is deliberately empty. Shipping a stale or
//     inaccurate mapping would defeat the project's mission. The mapping
//     lands via a follow-up PR with per-bank citations from each bank's
//     official site or a PASA-published table, retrieved within the
//     release window.

const BRANCH_CODE_RE = /^\d{6}$/;

declare const branchCodeBrand: unique symbol;
export type BankBranchCode = string & { readonly [branchCodeBrand]: true };

export function isValidBranchCode(value: unknown): value is BankBranchCode {
  return typeof value === "string" && BRANCH_CODE_RE.test(value);
}

export function parseBranchCode(value: string): BankBranchCode | null {
  return isValidBranchCode(value) ? value : null;
}

export interface BankRecord {
  readonly name: string;
  readonly universal: BankBranchCode;
  readonly swift?: string;
  /** ISO 8601 date the code was last verified against a primary source. */
  readonly verifiedAt: string;
  /** URL the verification was made against. */
  readonly source: string;
}

/**
 * Map of bank slug → bank record. Intentionally empty for v0.1.0 — entries
 * land via PRs with citations. Consumers should treat an absent bank as
 * "unknown" rather than assume coverage.
 */
export const BANK_REGISTRY: Readonly<Record<string, BankRecord>> = Object.freeze({});
