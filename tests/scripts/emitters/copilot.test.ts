import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emitCopilot } from "../../../scripts/emitters/copilot.ts";
import { loadAllSkills } from "./load-all-skills.ts";

describe("emitCopilot", () => {
  it("produces single instructions file matching golden", async () => {
    const result = emitCopilot(await loadAllSkills(), { version: "0.0.0" });
    const file = result.files.find(
      (f) => f.path === ".github/copilot-instructions.md",
    );
    expect(file).toBeDefined();
    const golden = readFileSync("tests/golden/copilot/skills.expected", "utf8");
    expect(file!.content).toBe(golden);
  });
});
