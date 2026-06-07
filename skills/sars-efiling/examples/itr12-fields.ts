// Minimal ITR12 (Personal Income Tax Return) field map for SME payroll inputs.
//
// SARS publishes the ITR12 schema as a PDF. There is no public REST endpoint
// for ITR12 submission — production paths submit via SARS e@syFile or the
// authenticated eFiling portal. This map captures the field names a typical
// SME payroll integration needs to set when generating the upload payload.
//
// Source: SARS personal income tax / ITR12 guides — pinned in
// skills/sars-efiling/SKILL.md frontmatter.

import { IRP5_CODES, type IrpCode } from "./irp5-codes.ts";

export interface Itr12IncomeLine {
  /** IRP5 source code, e.g. "3601" for salary. */
  sourceCode: string;
  /** Rand amount in cents to avoid float rounding. */
  amountCents: number;
}

export interface Itr12Section {
  taxpayerRef: string; // 10-digit SARS taxpayer reference
  yearOfAssessment: number; // e.g. 2026
  incomeLines: Itr12IncomeLine[];
  paye: number; // Rand cents
}

export function buildItr12Payload(section: Itr12Section): Record<string, unknown> {
  return {
    return_type: "ITR12",
    year_of_assessment: section.yearOfAssessment,
    taxpayer_ref: section.taxpayerRef,
    income: section.incomeLines.map((line) => ({
      code: line.sourceCode,
      amount: line.amountCents / 100,
      code_label: lookupCodeLabel(line.sourceCode),
    })),
    paye_paid: section.paye / 100,
  };
}

function lookupCodeLabel(code: string): string {
  const entry: IrpCode | undefined = IRP5_CODES.find(
    (c) => c.local === code || c.foreign === code,
  );
  return entry?.description ?? "unknown source code";
}
