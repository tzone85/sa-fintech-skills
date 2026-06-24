import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runBuild } from "../../scripts/build.ts";

const TMP = "tmp-cli-test";
const CLI = resolve("bin/cli.mjs");

function run(args: string[], cwd: string): { stdout: string; status: number } {
  try {
    const stdout = execFileSync("node", [CLI, ...args], { cwd, encoding: "utf8" });
    return { stdout, status: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { stdout: `${err.stdout ?? ""}${err.stderr ?? ""}`, status: err.status ?? 1 };
  }
}

describe("bin/cli.mjs", () => {
  beforeAll(async () => {
    // The published tarball ships dist/ prebuilt; tests recreate that state.
    if (!existsSync("dist/cursor")) {
      await runBuild({ version: "0.0.0", skillsGlob: "skills/*/SKILL.md" });
    }
  });

  beforeEach(() => {
    if (existsSync(TMP)) rmSync(TMP, { recursive: true });
    mkdirSync(TMP, { recursive: true });
  });
  afterEach(() => rmSync(TMP, { recursive: true, force: true }));

  it("doctor reports no runtime in empty dir", () => {
    const { stdout, status } = run(["doctor"], TMP);
    expect(status).toBe(0);
    expect(stdout).toMatch(/no runtime detected/);
  });

  it("doctor detects cursor", () => {
    mkdirSync(join(TMP, ".cursor"));
    const { stdout, status } = run(["doctor"], TMP);
    expect(status).toBe(0);
    expect(stdout).toMatch(/detected runtime: cursor/);
  });

  it("install --runtime cursor copies dist artefacts", () => {
    const { stdout, status } = run(["install", "--runtime", "cursor"], TMP);
    expect(status).toBe(0);
    expect(stdout).toMatch(/installed sa-fintech-skills for cursor/);
    expect(existsSync(join(TMP, ".cursor/rules/popia.mdc"))).toBe(true);
  });

  it("install --runtime codex writes AGENTS.md", () => {
    const { status } = run(["install", "--runtime", "codex"], TMP);
    expect(status).toBe(0);
    const agents = readFileSync(join(TMP, "AGENTS.md"), "utf8");
    expect(agents).toContain("popia");
  });

  it("install fails with guidance when runtime undetectable", () => {
    const { stdout, status } = run(["install"], TMP);
    expect(status).toBe(1);
    expect(stdout).toMatch(/could not detect runtime/);
  });

  it("rejects unknown runtime", () => {
    const { stdout, status } = run(["install", "--runtime", "bogus"], TMP);
    expect(status).toBe(1);
    expect(stdout).toMatch(/unknown runtime/);
  });

  it("rejects unknown command with usage", () => {
    const { stdout, status } = run(["frobnicate"], TMP);
    expect(status).toBe(2);
    expect(stdout).toMatch(/usage: sa-fintech-skills/);
  });
});
