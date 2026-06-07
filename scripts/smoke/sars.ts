// SARS smoke — pure-function tests against SARS-published worked examples.
// No live API.

import type { SmokeResult } from "./popia.ts";
import {
  vatExclToIncl,
  vatInclToExcl,
  vatAmount,
} from "../../shared/za-primitives/vat.ts";
import {
  isKnownIrpCode,
} from "../../skills/sars-efiling/examples/irp5-codes.ts";

interface WorkedExample {
  describe: string;
  excl: number;
  incl: number;
  vat: number;
}

const VAT_EXAMPLES: WorkedExample[] = [
  { describe: "R100 excl → R115 incl", excl: 100, incl: 115, vat: 15 },
  { describe: "R1304.35 excl → R1500 incl (rounded)", excl: 1304.35, incl: 1500, vat: 195.65 },
];

export function smokeSars(): SmokeResult {
  const reasons: string[] = [];

  for (const ex of VAT_EXAMPLES) {
    const incl = vatExclToIncl(ex.excl);
    if (incl !== ex.incl) {
      reasons.push(`${ex.describe}: vatExclToIncl gave ${incl}, expected ${ex.incl}`);
    }
    const excl = vatInclToExcl(ex.incl);
    if (Math.abs(excl - ex.excl) > 0.02) {
      reasons.push(`${ex.describe}: vatInclToExcl gave ${excl}, expected ~${ex.excl}`);
    }
    const v = vatAmount(ex.incl);
    if (Math.abs(v - ex.vat) > 0.02) {
      reasons.push(`${ex.describe}: vatAmount gave ${v}, expected ~${ex.vat}`);
    }
  }

  // IRP5 registry smoke — every documented code must be findable.
  const mustExist = ["3601", "3605", "3701", "3801"];
  for (const code of mustExist) {
    if (!isKnownIrpCode(code)) {
      reasons.push(`IRP5 code ${code} should be in the registry`);
    }
  }

  return { skill: "sars-efiling", ok: reasons.length === 0, reasons };
}
