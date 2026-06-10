#!/usr/bin/env node
// npx entry point. Dependency-free on purpose: consumers run this from the
// published tarball where dist/ is prebuilt by prepack, so we only need to
// detect the runtime and copy files — no TypeScript loader required.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
  realpathSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALL_TARGETS = ["claude", "cursor", "copilot", "codex", "gemini"];

export function detectRuntime(cwd) {
  if (existsSync(join(cwd, ".cursor"))) return "cursor";
  if (existsSync(join(cwd, ".github"))) return "copilot";
  if (existsSync(join(cwd, "AGENTS.md"))) return "codex";
  if (existsSync(join(cwd, ".claude-plugin")) || existsSync(join(cwd, ".claude"))) {
    return "claude";
  }
  return null;
}

function copyTree(srcDir, dstDir, written) {
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

export function runInstall({ runtime, cwd }) {
  const target = runtime ?? detectRuntime(cwd);
  if (!target) {
    throw new Error(
      "could not detect runtime — pass --runtime <claude|cursor|copilot|codex|gemini>",
    );
  }
  if (!ALL_TARGETS.includes(target)) {
    throw new Error(`unknown runtime "${target}"; valid: ${ALL_TARGETS.join(", ")}`);
  }

  const src = join(PACKAGE_ROOT, "dist", target);
  if (!existsSync(src)) {
    throw new Error(
      `dist/${target} not found — in a git checkout run "npm run build" first ` +
        "(published packages ship dist/ prebuilt)",
    );
  }

  const written = [];
  copyTree(src, cwd, written);
  return { runtime: target, filesWritten: written };
}

function parseArgs(argv) {
  const [command = "install", ...rest] = argv;
  const out = { command };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--runtime" && rest[i + 1]) {
      out.runtime = rest[i + 1];
      i++;
    }
  }
  return out;
}

function main() {
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
    const result = runInstall({ runtime, cwd: process.cwd() });
    console.log(`installed sa-fintech-skills for ${result.runtime}`);
    for (const f of result.filesWritten) console.log(`  ${f}`);
    process.exit(0);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

// npx executes the bin via a node_modules/.bin symlink, so argv[1] must be
// realpath-resolved before comparing against import.meta.url.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  main();
}
