// SARS VAT calculation example.
//
// Source: SARS VAT page (https://www.sars.gov.za/types-of-tax/value-added-tax/)
// retrieved 2026-06-07 — rate confirmed at 15% (the proposed 15.5%/16%
// increases in the 2025/2026 budget were reversed by clause 13 of the Rates
// Bill).
//
// This module is a thin convenience layer over the shared primitive.

import {
  VAT_RATE,
  vatExclToIncl,
  vatInclToExcl,
  vatAmount,
} from "../../../shared/za-primitives/vat.ts";

export interface InvoiceLine {
  description: string;
  excl: number;
}

export interface InvoiceTotals {
  excl: number;
  vat: number;
  incl: number;
  rate: number;
}

/** Sum invoice lines and produce excl / VAT / incl totals at the current SARS rate. */
export function totalsForLines(lines: InvoiceLine[]): InvoiceTotals {
  const excl = lines.reduce((sum, l) => sum + l.excl, 0);
  const incl = vatExclToIncl(excl);
  return {
    excl,
    vat: vatAmount(incl),
    incl,
    rate: VAT_RATE,
  };
}

/** Worked example from a typical SA SME invoice. */
export function example(): InvoiceTotals {
  return totalsForLines([
    { description: "Spring Skill Pack — Pro license", excl: 1000 },
    { description: "Setup / onboarding", excl: 250 },
  ]);
}

export { VAT_RATE, vatExclToIncl, vatInclToExcl, vatAmount };
