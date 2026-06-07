// Helper for emitter tests — load every skill the build orchestrator would
// see, in the order the same glob walker returns them. Keeps tests and
// build-emitted output in sync.

import { readFileSync } from "node:fs";
import { glob } from "node:fs/promises";
import { parseSkill } from "../../../scripts/lib/parse-skill.ts";
import type { SkillInput } from "../../../scripts/emitters/types.ts";

export async function loadAllSkills(): Promise<SkillInput[]> {
  const out: SkillInput[] = [];
  for await (const path of glob("skills/*/SKILL.md")) {
    const source = readFileSync(path, "utf8");
    out.push({ source, parsed: parseSkill(source) });
  }
  return out;
}

export function loadSkill(name: string): SkillInput {
  const path = `skills/${name}/SKILL.md`;
  const source = readFileSync(path, "utf8");
  return { source, parsed: parseSkill(source) };
}
