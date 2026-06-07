import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runBuild } from "./build.ts";
import { ALL_TARGETS, type RuntimeTarget } from "./lib/runtime-config.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface InstallOptions {
  runtime?: RuntimeTarget;
  cwd?: string;
  skillsGlob?: string;
  version?: string;
}

export interface InstallResult {
  runtime: RuntimeTarget;
  filesWritten: string[];
}

export function detectRuntime(cwd: string): RuntimeTarget | null {
  if (existsSync(join(cwd, ".cursor"))) return "cursor";
  if (existsSync(join(cwd, ".github"))) return "copilot";
  if (existsSync(join(cwd, "AGENTS.md"))) return "codex";
  if (existsSync(join(cwd, ".claude-plugin")) || existsSync(join(cwd, ".claude"))) {
    return "claude";
  }
  return null;
}

function copyTree(srcDir: string, dstDir: string, written: string[]): void {
  for (const entry of readdirSync(srcDir)) {
    const src = join(srcDir, entry);
    const dst = join(dstDir, entry);
    if (statSync(src).isDirectory()) {
      mkdirSync(dst, { recursive: true });
      copyTree(src, dst, written);
    } else {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      written.push(dst);
    }
  }
}

export async function runInstall(opts: InstallOptions = {}): Promise<InstallResult> {
  const cwd = opts.cwd ?? process.cwd();
  const runtime = opts.runtime ?? detectRuntime(cwd);

  if (!runtime) {
    throw new Error(
      "could not detect runtime — pass --runtime <claude|cursor|copilot|codex|gemini>",
    );
  }
  if (!ALL_TARGETS.includes(runtime)) {
    throw new Error(`unknown runtime "${runtime}"; valid: ${ALL_TARGETS.join(", ")}`);
  }

  const distDir = join(PACKAGE_ROOT, "dist");
  if (!existsSync(join(distDir, runtime))) {
    await runBuild({
      version: opts.version ?? "0.0.1-alpha",
      skillsGlob: opts.skillsGlob ?? join(PACKAGE_ROOT, "skills/*/SKILL.md"),
      distDir,
    });
  }

  const src = join(distDir, runtime);
  const written: string[] = [];
  copyTree(src, cwd, written);

  return { runtime, filesWritten: written };
}

/* v8 ignore start — CLI entry, exercised via subprocess */
function parseArgs(argv: string[]): { command: string; runtime?: RuntimeTarget } {
  const [command = "install", ...rest] = argv;
  const out: { command: string; runtime?: RuntimeTarget } = { command };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--runtime" && rest[i + 1]) {
      out.runtime = rest[i + 1] as RuntimeTarget;
      i++;
    }
  }
  return out;
}

async function main() {
  const { command, runtime } = parseArgs(process.argv.slice(2));

  if (command === "doctor") {
    const detected = detectRuntime(process.cwd());
    console.log(
      detected
        ? `detected runtime: ${detected}`
        : "no runtime detected — run install with --runtime <name>",
    );
    process.exit(0);
  }

  if (command !== "install" && command !== "update") {
    console.error("usage: sa-fintech-skills <install|update|doctor> [--runtime <name>]");
    process.exit(2);
  }

  try {
    const result = await runInstall({ runtime });
    console.log(`installed sa-fintech-skills for ${result.runtime}`);
    for (const f of result.filesWritten) console.log(`  ${f}`);
    process.exit(0);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
/* v8 ignore stop */
