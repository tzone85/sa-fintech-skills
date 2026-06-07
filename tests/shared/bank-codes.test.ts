import { describe, it, expect } from "vitest";
import {
  isValidBranchCode,
  parseBranchCode,
  BANK_REGISTRY,
} from "../../shared/za-primitives/bank-codes.ts";

describe("isValidBranchCode", () => {
  it("accepts 6 digits", () => {
    expect(isValidBranchCode("250655")).toBe(true);
    expect(isValidBranchCode("000000")).toBe(true);
  });

  it("rejects non-6-digit", () => {
    expect(isValidBranchCode("12345")).toBe(false);
    expect(isValidBranchCode("1234567")).toBe(false);
    expect(isValidBranchCode("")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isValidBranchCode("12345A")).toBe(false);
    expect(isValidBranchCode("123 456")).toBe(false);
  });
});

describe("parseBranchCode", () => {
  it("returns null on invalid input", () => {
    expect(parseBranchCode("abc")).toBeNull();
  });

  it("returns a branded code on valid input", () => {
    const code = parseBranchCode("250655");
    expect(code).toBe("250655");
  });
});

describe("BANK_REGISTRY", () => {
  it("is an empty readonly registry pending verified PASA sourcing", () => {
    // Intentionally empty in v0.1.0 — codes will land via a research-tracked
    // follow-up PR with citations. See bank-codes.ts header comment.
    expect(BANK_REGISTRY).toEqual({});
  });
});
