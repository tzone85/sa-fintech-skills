import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emitGemini } from "../../../scripts/emitters/gemini.ts";
import { loadAllSkills, loadSkill } from "./load-all-skills.ts";

describe("emitGemini", () => {
  it("emits manifest matching golden", async () => {
    const result = emitGemini(await loadAllSkills(), { version: "0.0.0" });
    const manifest = result.files.find((f) => f.path === "skills.json");
    expect(manifest).toBeDefined();
    const golden = readFileSync("tests/golden/gemini/skills.expected", "utf8");
    expect(manifest!.content).toBe(golden);
  });

  it("emits per-skill body file", () => {
    const result = emitGemini([loadSkill("popia")], { version: "0.0.0" });
    expect(
      result.files.find((f) => f.path === "skills/popia.md"),
    ).toBeDefined();
  });
});
