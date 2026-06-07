// SA ID number format: YYMMDD SSSS C A Z (13 digits)
//   YYMMDD — date of birth
//   SSSS   — sequence, women < 5000 ≤ men
//   C      — citizenship (0 = SA citizen, 1 = permanent resident)
//   A      — historical race classification, now always 8 (we accept any digit)
//   Z      — Luhn check digit over the 12 preceding digits
//
// Luhn variant (SA Home Affairs spec):
//   odd-positioned digits (1, 3, 5, 7, 9, 11, counted from the left)
//     contribute as standalone values
//   even-positioned digits (2, 4, 6, 8, 10, 12) are concatenated into a
//     single number, multiplied by 2, then the digits of the product are summed
//   total mod 10 = 0 — check digit makes that true

export type Gender = "male" | "female";
export type Citizenship = "sa" | "permanent-resident";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  dob?: Date;
  gender?: Gender;
  citizenship?: Citizenship;
}

const ID_LENGTH = 13;
const DIGITS_RE = /^\d{13}$/;
const BODY_DIGITS_RE = /^\d{12}$/;

function sumDigits(n: number): number {
  let sum = 0;
  let x = n;
  while (x > 0) {
    sum += x % 10;
    x = Math.floor(x / 10);
  }
  return sum;
}

export function computeCheckDigit(body12: string): string {
  if (!BODY_DIGITS_RE.test(body12)) {
    throw new Error("computeCheckDigit expects a 12-digit numeric string");
  }
  let oddSum = 0;
  let evenConcat = "";
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      // positions 1, 3, 5, 7, 9, 11 (1-indexed) → indices 0, 2, 4, 6, 8, 10
      oddSum += Number(body12[i]);
    } else {
      evenConcat += body12[i];
    }
  }
  const evenSum = sumDigits(Number(evenConcat) * 2);
  const total = oddSum + evenSum;
  const check = (10 - (total % 10)) % 10;
  return String(check);
}

function parseDob(yymmdd: string): Date | null {
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  // SA IDs span 1900s and 2000s. Convention: years >= cutoff → 1900s, else 2000s.
  // We use 30 as the cutoff (anyone with YY > 30 was born in 19YY for now).
  // This is an approximation; SARS recommends checking against age elsewhere.
  const fullYear = yy > 30 ? 1900 + yy : 2000 + yy;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  const d = new Date(Date.UTC(fullYear, mm - 1, dd));
  if (
    d.getUTCFullYear() !== fullYear ||
    d.getUTCMonth() !== mm - 1 ||
    d.getUTCDate() !== dd
  ) {
    return null; // rolled over (e.g. Feb 30 → Mar 2)
  }
  return d;
}

export function validateSaId(id: string): ValidationResult {
  if (typeof id !== "string" || id.length !== ID_LENGTH) {
    return { valid: false, reason: "id must be exactly 13 characters long" };
  }
  if (!DIGITS_RE.test(id)) {
    return { valid: false, reason: "id must contain only digits" };
  }

  const dob = parseDob(id.slice(0, 6));
  if (!dob) {
    return { valid: false, reason: "invalid date of birth — check month/day" };
  }

  const sequence = Number(id.slice(6, 10));
  const gender: Gender = sequence >= 5000 ? "male" : "female";

  const citizenDigit = id[10];
  if (citizenDigit !== "0" && citizenDigit !== "1") {
    return {
      valid: false,
      reason: "invalid citizenship digit — must be 0 (SA) or 1 (permanent resident)",
    };
  }
  const citizenship: Citizenship =
    citizenDigit === "0" ? "sa" : "permanent-resident";

  const expectedCheck = computeCheckDigit(id.slice(0, 12));
  if (expectedCheck !== id[12]) {
    return { valid: false, reason: "invalid Luhn checksum" };
  }

  return { valid: true, dob, gender, citizenship };
}

export interface BuildSaIdOptions {
  year: number;
  month: number;
  day: number;
  gender: Gender;
  citizen: Citizenship;
  sequenceOffset?: number; // 0..999 within the gender range; default 0 (women → 4000, men → 5000)
}

export function buildSaId(opts: BuildSaIdOptions): string {
  const yy = String(opts.year % 100).padStart(2, "0");
  const mm = String(opts.month).padStart(2, "0");
  const dd = String(opts.day).padStart(2, "0");
  const offset = Math.max(0, Math.min(999, opts.sequenceOffset ?? 0));
  const seqBase = opts.gender === "male" ? 5000 : 4000;
  const sequence = String(seqBase + offset).padStart(4, "0");
  const c = opts.citizen === "sa" ? "0" : "1";
  const a = "8";
  const body = yy + mm + dd + sequence + c + a;
  return body + computeCheckDigit(body);
}
