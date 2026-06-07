import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emitClaude } from "../../../scripts/emitters/claude.ts";
import { parseSkill } from "../../../scripts/lib/parse-skill.ts";

describe("emitClaude", () => {
  it("emits SKILL.md matching golden", () => {
    const source = readFileSync("skills/popia/SKILL.md", "utf8");
    const parsed = parseSkill(source);
    const result = emitClaude([{ source, parsed }], { version: "0.0.0" });

    const skillFile = result.files.find(
      (f) => f.path === "skills/popia/SKILL.md",
    );
    expect(skillFile).toBeDefined();

    const golden = readFileSync("tests/golden/claude/popia.expected", "utf8");
    expect(skillFile!.content).toBe(golden);
  });

  it("emits marketplace.json listing each skill", () => {
    const source = readFileSync("skills/popia/SKILL.md", "utf8");
    const parsed = parseSkill(source);
    const result = emitClaude([{ source, parsed }], { version: "0.0.0" });

    const manifest = result.files.find(
      (f) => f.path === ".claude-plugin/marketplace.json",
    );
    expect(manifest).toBeDefined();
    const parsedManifest = JSON.parse(manifest!.content);
    expect(parsedManifest.skills).toContainEqual(
      expect.objectContaining({ name: "popia" }),
    );
  });
});
