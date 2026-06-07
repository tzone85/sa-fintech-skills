import { describe, it, expect } from "vitest";
import {
  smokePopia,
  smokePayfast,
  smokeSars,
  runAllSmokes,
} from "../../scripts/smoke-test.ts";
import { smokePaystack } from "../../scripts/smoke/paystack.ts";

describe("smokePopia", () => {
  it("returns ok=true with no reasons", () => {
    const r = smokePopia();
    expect(r.skill).toBe("popia");
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});

describe("smokePayfast", () => {
  it("verifies valid ITN fixture, rejects tampered", () => {
    const r = smokePayfast();
    expect(r.skill).toBe("payfast");
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});

describe("smokeSars", () => {
  it("validates VAT worked examples + IRP5 registry", () => {
    const r = smokeSars();
    expect(r.skill).toBe("sars-efiling");
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});

describe("smokePaystack (offline portion)", () => {
  it("verifies signed fixture + rejects tampered", async () => {
    delete process.env.PAYSTACK_TEST_SECRET_KEY;
    const r = await smokePaystack();
    expect(r.skill).toBe("paystack");
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});

describe("runAllSmokes", () => {
  it("aggregates all 4 smokes", async () => {
    delete process.env.PAYSTACK_TEST_SECRET_KEY;
    const results = await runAllSmokes();
    expect(results).toHaveLength(4);
    const skills = results.map((r) => r.skill).sort();
    expect(skills).toEqual(["payfast", "paystack", "popia", "sars-efiling"]);
    for (const r of results) expect(r.ok).toBe(true);
  });
});
