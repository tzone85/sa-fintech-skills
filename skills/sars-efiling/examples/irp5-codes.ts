// Typed registry of the most common IRP5 / IT3(a) source codes.
//
// Source: SARS Guide for Codes Applicable to Employees' Tax Certificates 2026
// (https://www.sars.gov.za/guide-for-codes-applicable-to-employees-tax-certificates-2026/)
// retrieved 2026-06-07.
//
// This is NOT exhaustive — it covers the codes that appear in roughly 95% of
// SME payslips. Consult the SARS guide for the full list, lump-sum codes,
// and deduction codes (4xxx).

export type IrpCategory =
  | "income"
  | "allowance"
  | "fringe-benefit"
  | "lump-sum";

export interface IrpCode {
  /** Local-source code (RSA). */
  readonly local: string;
  /** Foreign-source equivalent (always `local` + 50 for 36xx range, + 50 for 37xx, etc.). */
  readonly foreign: string;
  readonly category: IrpCategory;
  readonly description: string;
  /**
   * Year of assessment this code is effective from. SARS rationalises codes
   * regularly; older codes get folded into newer mains and should not be used
   * for new certificates.
   */
  readonly effectiveFrom: number;
  /** Optional human-readable note about rationalisation rules. */
  readonly note?: string;
}

export const IRP5_CODES = [
  {
    local: "3601",
    foreign: "3651",
    category: "income",
    description: "Income — basic salary / wages (Main code from 2013)",
    effectiveFrom: 2013,
    note: "Codes 3603 / 3610 must be incorporated into 3601 from 2013 onwards.",
  },
  {
    local: "3602",
    foreign: "3652",
    category: "income",
    description: "Income — non-taxable (e.g. reimbursive amounts under threshold)",
    effectiveFrom: 2013,
  },
  {
    local: "3605",
    foreign: "3655",
    category: "income",
    description: "Annual payment (bonus, leave pay-out, 13th cheque)",
    effectiveFrom: 2013,
  },
  {
    local: "3606",
    foreign: "3656",
    category: "income",
    description: "Commission",
    effectiveFrom: 2013,
  },
  {
    local: "3607",
    foreign: "3657",
    category: "income",
    description: "Overtime",
    effectiveFrom: 2020,
    note: "From 2020 year of assessment. Incorporate into 3601 for 2010–2019.",
  },
  {
    local: "3615",
    foreign: "3665",
    category: "income",
    description: "Director's fees (RSA-resident director)",
    effectiveFrom: 2003,
    note: "Applicable from 2003 to 2018 years of assessment.",
  },
  {
    local: "3701",
    foreign: "3751",
    category: "allowance",
    description: "Travel allowance",
    effectiveFrom: 2013,
  },
  {
    local: "3702",
    foreign: "3752",
    category: "allowance",
    description: "Reimbursive travel allowance (taxable portion)",
    effectiveFrom: 2013,
  },
  {
    local: "3703",
    foreign: "3753",
    category: "allowance",
    description: "Reimbursive travel allowance (non-taxable portion)",
    effectiveFrom: 2013,
  },
  {
    local: "3713",
    foreign: "3763",
    category: "allowance",
    description: "Other taxable allowances (catch-all — see SARS guide for incorporation rules)",
    effectiveFrom: 2013,
    note: "Codes 3706, 3710, 3711, 3712 must be incorporated into 3713.",
  },
  {
    local: "3801",
    foreign: "3851",
    category: "fringe-benefit",
    description: "General taxable fringe benefit (umbrella code)",
    effectiveFrom: 2013,
    note: "Codes 3803, 3804, 3807 etc must be incorporated into 3801.",
  },
  {
    local: "3802",
    foreign: "3852",
    category: "fringe-benefit",
    description: "Use of motor vehicle (general)",
    effectiveFrom: 2013,
  },
  {
    local: "3810",
    foreign: "3860",
    category: "fringe-benefit",
    description: "Medical aid contributions paid by employer",
    effectiveFrom: 2013,
  },
] as const satisfies ReadonlyArray<IrpCode>;

export type IrpLocalCode = (typeof IRP5_CODES)[number]["local"];

export function findIrpCode(code: string): IrpCode | undefined {
  return IRP5_CODES.find((c) => c.local === code || c.foreign === code);
}

export function isKnownIrpCode(code: string): boolean {
  return findIrpCode(code) !== undefined;
}
