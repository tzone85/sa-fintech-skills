// WRONG SARS patterns we keep seeing in agent output. Each block names the
// correct replacement.

import { vatExclToIncl } from "../../../shared/za-primitives/vat.ts";

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. Hardcoding VAT at 14%.                                              │
// │    Rate changed to 15% on 2018-04-01. The proposed 15.5% / 16% raises  │
// │    in 2025/2026 were reversed.                                         │
// └─────────────────────────────────────────────────────────────────────────┘

export function badVatRate(excl: number): number {
  // BAD: 14% rate from before 2018-04-01.
  return excl * 1.14;
}

export function correctVatRate(excl: number): number {
  return vatExclToIncl(excl);
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. Reporting code 3603 / 3610 on a 2026 certificate.                   │
// │    These have been rationalised into 3601 from 2013 onwards.           │
// └─────────────────────────────────────────────────────────────────────────┘

export function badRationalisedCode(): string {
  // BAD: SARS rejects 3603 on a 2026 IRP5.
  return "3603";
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. Treating zero-rated and exempt supplies as the same.                │
// │    Zero-rated supplies still appear on VAT201 at 0%; exempt supplies   │
// │    don't appear and the vendor can't claim input tax against them.     │
// └─────────────────────────────────────────────────────────────────────────┘

export function badZeroVsExempt(): boolean {
  // BAD: collapses two distinct VAT treatments.
  return true; // returning "they are the same"
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. Hardcoding the compulsory VAT registration threshold.               │
// │    Threshold changes by budget cycle. From 1 April 2026 it moves from   │
// │    R1m to R2.3m (compulsory) and R50k to R120k (voluntary).            │
// └─────────────────────────────────────────────────────────────────────────┘

export function badThreshold(annualTurnover: number): boolean {
  // BAD: stale threshold; valid before 2026-04-01 only.
  return annualTurnover >= 1_000_000;
}
