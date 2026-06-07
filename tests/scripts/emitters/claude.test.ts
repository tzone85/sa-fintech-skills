import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emitClaude } from "../../../scripts/emitters/claude.ts";
import { loadSkill } from "./load-all-skills.ts";

describe("emitClaude", () => {
  for (const name of ["popia", "paystack", "payfast", "sars-efiling"] as const) {
    it(`emits ${name} SKILL.md matching golden`, () => {
      const skill = loadSkill(name);
      const result = emitClaude([skill], { version: "0.0.0" });
      const skillFile = result.files.find(
        (f) => f.path === `skills/${name}/SKILL.md`,
      );
      expect(skillFile).toBeDefined();
      const golden = readFileSync(
        `tests/golden/claude/${name}.expected`,
        "utf8",
      );
      expect(skillFile!.content).toBe(golden);
    });
  }

  it("emits marketplace.json listing each skill", () => {
    const result = emitClaude([loadSkill("popia")], { version: "0.0.0" });
    const manifest = result.files.find(
      (f) => f.path === ".claude-plugin/marketplace.json",
    );
    expect(manifest).toBeDefined();
    const parsedManifest = JSON.parse(manifest!.content) as {
      skills: { name: string }[];
    };
    expect(parsedManifest.skills).toContainEqual(
      expect.objectContaining({ name: "popia" }),
    );
  });
});
