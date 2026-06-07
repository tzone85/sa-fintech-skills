import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emitCursor } from "../../../scripts/emitters/cursor.ts";
import { loadSkill } from "./load-all-skills.ts";

describe("emitCursor", () => {
  for (const name of ["popia", "paystack", "payfast", "sars-efiling"] as const) {
    it(`emits ${name}.mdc matching golden`, () => {
      const skill = loadSkill(name);
      const result = emitCursor([skill], { version: "0.0.0" });
      const file = result.files.find(
        (f) => f.path === `.cursor/rules/${name}.mdc`,
      );
      expect(file).toBeDefined();
      const golden = readFileSync(
        `tests/golden/cursor/${name}.expected`,
        "utf8",
      );
      expect(file!.content).toBe(golden);
    });
  }

  it("skips skills not targeting cursor", () => {
    const skill = loadSkill("popia");
    skill.parsed.frontmatter.metadata.targets = ["claude"];
    const result = emitCursor([skill], { version: "0.0.0" });
    expect(result.files).toHaveLength(0);
  });
});
