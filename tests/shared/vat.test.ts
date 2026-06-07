import { describe, it, expect } from "vitest";
import {
  VAT_RATE,
  vatExclToIncl,
  vatInclToExcl,
  vatAmount,
  roundCents,
} from "../../shared/za-primitives/vat.ts";

describe("VAT_RATE", () => {
  it("is 0.15 (15%, effective 2018-04-01 per SARS VAT guide)", () => {
    expect(VAT_RATE).toBe(0.15);
  });
});

describe("vatExclToIncl", () => {
  it("R100.00 excl → R115.00 incl", () => {
    expect(vatExclToIncl(100)).toBe(115);
  });
  it("R1.23 excl → R1.41 incl (rounding)", () => {
    expect(vatExclToIncl(1.23)).toBe(1.41);
  });
  it("R0 excl → R0 incl", () => {
    expect(vatExclToIncl(0)).toBe(0);
  });
});

describe("vatInclToExcl", () => {
  it("R115.00 incl → R100.00 excl", () => {
    expect(vatInclToExcl(115)).toBe(100);
  });
  it("R1.00 incl → R0.87 excl (SARS worked example)", () => {
    // 1 / 1.15 = 0.86956... → bankers' rounding to 2dp → 0.87
    expect(vatInclToExcl(1)).toBe(0.87);
  });
});

describe("vatAmount", () => {
  it("VAT in R115.00 incl is R15.00", () => {
    expect(vatAmount(115)).toBe(15);
  });
  it("VAT in R1.00 incl is R0.13", () => {
    expect(vatAmount(1)).toBe(0.13);
  });
});

describe("roundCents (banker's rounding)", () => {
  it("0.125 → 0.12 (round half to even)", () => {
    expect(roundCents(0.125)).toBe(0.12);
  });
  it("0.135 → 0.14 (round half to even)", () => {
    expect(roundCents(0.135)).toBe(0.14);
  });
  it("0.126 → 0.13 (round half up)", () => {
    expect(roundCents(0.126)).toBe(0.13);
  });
  it("0.124 → 0.12 (round half down)", () => {
    expect(roundCents(0.124)).toBe(0.12);
  });
});
