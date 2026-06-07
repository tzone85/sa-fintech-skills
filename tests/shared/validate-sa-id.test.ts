import { describe, it, expect } from "vitest";
import {
  validateSaId,
  computeCheckDigit,
  buildSaId,
} from "../../shared/za-primitives/validate-sa-id.ts";

// Synthetic IDs constructed via the documented algorithm. No real persons.
function syntheticId(opts: {
  year: number;
  month: number;
  day: number;
  gender: "male" | "female";
  citizen: "sa" | "permanent-resident";
}): string {
  const yy = String(opts.year % 100).padStart(2, "0");
  const mm = String(opts.month).padStart(2, "0");
  const dd = String(opts.day).padStart(2, "0");
  const sequence = opts.gender === "male" ? "5000" : "4999";
  const c = opts.citizen === "sa" ? "0" : "1";
  const a = "8";
  const body = yy + mm + dd + sequence + c + a;
  const check = computeCheckDigit(body);
  return body + check;
}

describe("computeCheckDigit", () => {
  it("returns a single decimal digit", () => {
    const d = computeCheckDigit("970505500008");
    expect(d).toMatch(/^[0-9]$/);
  });
});

describe("buildSaId", () => {
  it("produces a 13-digit string that validates", () => {
    const id = buildSaId({
      year: 1990,
      month: 1,
      day: 15,
      gender: "male",
      citizen: "sa",
    });
    expect(id).toHaveLength(13);
    expect(validateSaId(id).valid).toBe(true);
  });
});

describe("validateSaId — valid", () => {
  it("accepts a valid male SA citizen", () => {
    const id = syntheticId({
      year: 1985,
      month: 6,
      day: 12,
      gender: "male",
      citizen: "sa",
    });
    const r = validateSaId(id);
    expect(r.valid).toBe(true);
    expect(r.gender).toBe("male");
    expect(r.citizenship).toBe("sa");
    expect(r.dob).toBeInstanceOf(Date);
    expect(r.dob?.getUTCFullYear()).toBe(1985);
    expect(r.dob?.getUTCMonth()).toBe(5); // June (0-indexed)
    expect(r.dob?.getUTCDate()).toBe(12);
  });

  it("accepts a valid female SA citizen", () => {
    const id = syntheticId({
      year: 1992,
      month: 11,
      day: 3,
      gender: "female",
      citizen: "sa",
    });
    expect(validateSaId(id).valid).toBe(true);
    expect(validateSaId(id).gender).toBe("female");
  });

  it("accepts a permanent resident", () => {
    const id = syntheticId({
      year: 1978,
      month: 4,
      day: 21,
      gender: "male",
      citizen: "permanent-resident",
    });
    expect(validateSaId(id).valid).toBe(true);
    expect(validateSaId(id).citizenship).toBe("permanent-resident");
  });
});

describe("validateSaId — invalid", () => {
  it("rejects wrong Luhn checksum", () => {
    const id = syntheticId({
      year: 1985,
      month: 6,
      day: 12,
      gender: "male",
      citizen: "sa",
    });
    const tampered = id.slice(0, 12) + ((Number(id[12]) + 1) % 10).toString();
    const r = validateSaId(tampered);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/checksum/i);
  });

  it("rejects DOB month 13", () => {
    const body = "9913" + "01" + "5000" + "0" + "8"; // YY=99 MM=13 DD=01 ...
    const id = body + computeCheckDigit(body);
    const r = validateSaId(id);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/month|date|dob/i);
  });

  it("rejects DOB day 32", () => {
    const body = "9001" + "32" + "5000" + "0" + "8";
    const id = body + computeCheckDigit(body);
    const r = validateSaId(id);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/day|date|dob/i);
  });

  it("rejects DOB Feb 30", () => {
    const body = "9002" + "30" + "5000" + "0" + "8";
    const id = body + computeCheckDigit(body);
    const r = validateSaId(id);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/day|date|dob/i);
  });

  it("rejects citizenship digit 2", () => {
    const body = "9001152500028";
    const id = body.slice(0, 12) + computeCheckDigit(body.slice(0, 12));
    // override citizenship digit
    const broken = id.slice(0, 10) + "2" + id.slice(11);
    const fixed = broken.slice(0, 12) + computeCheckDigit(broken.slice(0, 12));
    const r = validateSaId(fixed);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/citizenship/i);
  });

  it("rejects too-short input", () => {
    expect(validateSaId("123456789012").valid).toBe(false);
    expect(validateSaId("123456789012").reason).toMatch(/length|13/i);
  });

  it("rejects too-long input", () => {
    expect(validateSaId("12345678901234").valid).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(validateSaId("99010150000A8").valid).toBe(false);
  });
});
