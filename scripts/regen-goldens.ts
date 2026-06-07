import { runBuild } from "./build.ts";
import { existsSync, rmSync, copyFileSync, mkdirSync } from "node:fs";

if (existsSync("dist")) rmSync("dist", { recursive: true });
await runBuild({ version: "0.0.0", skillsGlob: "skills/*/SKILL.md" });

const skills = ["popia", "paystack", "payfast", "sars-efiling"];
for (const s of skills) {
  mkdirSync("tests/golden/claude", { recursive: true });
  mkdirSync("tests/golden/cursor", { recursive: true });
  copyFileSync(`dist/claude/skills/${s}/SKILL.md`, `tests/golden/claude/${s}.expected`);
  copyFileSync(`dist/cursor/.cursor/rules/${s}.mdc`, `tests/golden/cursor/${s}.expected`);
}
mkdirSync("tests/golden/copilot", { recursive: true });
mkdirSync("tests/golden/codex", { recursive: true });
mkdirSync("tests/golden/gemini", { recursive: true });
copyFileSync("dist/copilot/.github/copilot-instructions.md", "tests/golden/copilot/skills.expected");
copyFileSync("dist/codex/AGENTS.md", "tests/golden/codex/skills.expected");
copyFileSync("dist/gemini/skills.json", "tests/golden/gemini/skills.expected");
console.log("regenerated all 11 goldens at version 0.0.0");
