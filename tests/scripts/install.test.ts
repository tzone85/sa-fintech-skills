import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { detectRuntime, runInstall } from "../../scripts/install.ts";

const TMP = "tmp-install-test";

function freshTmp(): string {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  return TMP;
}

describe("detectRuntime", () => {
  beforeEach(() => freshTmp());
  afterEach(() => rmSync(TMP, { recursive: true, force: true }));

  it("detects cursor when .cursor/ exists", () => {
    mkdirSync(join(TMP, ".cursor"));
    expect(detectRuntime(TMP)).toBe("cursor");
  });

  it("detects copilot when .github/ exists and no .cursor/", () => {
    mkdirSync(join(TMP, ".github"));
    expect(detectRuntime(TMP)).toBe("copilot");
  });

  it("detects codex when AGENTS.md exists and no .cursor/ or .github/", () => {
    writeFileSync(join(TMP, "AGENTS.md"), "");
    expect(detectRuntime(TMP)).toBe("codex");
  });

  it("detects claude when .claude/ exists", () => {
    mkdirSync(join(TMP, ".claude"));
    expect(detectRuntime(TMP)).toBe("claude");
  });

  it("returns null when nothing matches", () => {
    expect(detectRuntime(TMP)).toBeNull();
  });
});

describe("runInstall", () => {
  beforeEach(() => freshTmp());
  afterEach(() => rmSync(TMP, { recursive: true, force: true }));

  it("installs cursor artefacts when --runtime cursor", async () => {
    const result = await runInstall({ runtime: "cursor", cwd: TMP });
    expect(result.runtime).toBe("cursor");
    expect(existsSync(join(TMP, ".cursor/rules/popia.mdc"))).toBe(true);
    expect(result.filesWritten.length).toBeGreaterThan(0);
  });

  it("installs codex AGENTS.md when --runtime codex", async () => {
    const result = await runInstall({ runtime: "codex", cwd: TMP });
    expect(result.runtime).toBe("codex");
    const agents = readFileSync(join(TMP, "AGENTS.md"), "utf8");
    expect(agents).toContain("popia");
  });

  it("throws when runtime cannot be detected and not passed", async () => {
    await expect(runInstall({ cwd: TMP })).rejects.toThrow(/could not detect runtime/);
  });

  it("throws on invalid runtime", async () => {
    await expect(
      runInstall({ runtime: "bogus" as never, cwd: TMP }),
    ).rejects.toThrow(/unknown runtime/);
  });
});
