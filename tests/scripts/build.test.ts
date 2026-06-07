import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBuild } from "../../scripts/build.ts";

describe("runBuild", () => {
  let dist: string;

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), "sfs-build-"));
  });

  afterEach(() => {
    if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
  });

  it("writes dist files for each runtime", async () => {
    await runBuild({
      version: "0.0.0",
      skillsGlob: "skills/*/SKILL.md",
      distDir: dist,
    });

    expect(existsSync(`${dist}/claude/skills/popia/SKILL.md`)).toBe(true);
    expect(existsSync(`${dist}/claude/.claude-plugin/marketplace.json`)).toBe(true);
    expect(existsSync(`${dist}/cursor/.cursor/rules/popia.mdc`)).toBe(true);
    expect(existsSync(`${dist}/copilot/.github/copilot-instructions.md`)).toBe(true);
    expect(existsSync(`${dist}/codex/AGENTS.md`)).toBe(true);
    expect(existsSync(`${dist}/gemini/skills.json`)).toBe(true);
  });

  it("version header present in claude output", async () => {
    await runBuild({
      version: "0.1.2",
      skillsGlob: "skills/*/SKILL.md",
      distDir: dist,
    });
    const content = readFileSync(`${dist}/claude/skills/popia/SKILL.md`, "utf8");
    expect(content.startsWith("# sa-fintech-skills@0.1.2")).toBe(true);
  });
});
