import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emitCodex } from "../../../scripts/emitters/codex.ts";
import { loadAllSkills } from "./load-all-skills.ts";

describe("emitCodex", () => {
  it("produces AGENTS.md matching golden", async () => {
    const result = emitCodex(await loadAllSkills(), { version: "0.0.0" });
    const file = result.files.find((f) => f.path === "AGENTS.md");
    expect(file).toBeDefined();
    const golden = readFileSync("tests/golden/codex/skills.expected", "utf8");
    expect(file!.content).toBe(golden);
  });
});
