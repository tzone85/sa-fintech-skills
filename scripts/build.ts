import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { glob } from 'node:fs/promises';
import { parseSkill } from './lib/parse-skill.ts';
import { ALL_TARGETS } from './lib/runtime-config.ts';
import { emitClaude } from './emitters/claude.ts';
import { emitCursor } from './emitters/cursor.ts';
import { emitCopilot } from './emitters/copilot.ts';
import { emitCodex } from './emitters/codex.ts';
import { emitGemini } from './emitters/gemini.ts';
import type { SkillInput, EmitResult } from './emitters/types.ts';

const EMITTERS = {
  claude: emitClaude,
  cursor: emitCursor,
  copilot: emitCopilot,
  codex: emitCodex,
  gemini: emitGemini,
} as const;

export interface BuildOptions {
  version: string;
  skillsGlob: string;
  distDir?: string;
}

export async function runBuild(opts: BuildOptions): Promise<void> {
  const distDir = opts.distDir ?? 'dist';
  if (existsSync(distDir)) rmSync(distDir, { recursive: true });

  const skills: SkillInput[] = [];
  for await (const path of glob(opts.skillsGlob)) {
    const source = readFileSync(path, 'utf8');
    skills.push({ source, parsed: parseSkill(source) });
  }

  for (const runtime of ALL_TARGETS) {
    const result: EmitResult = EMITTERS[runtime](skills, { version: opts.version });
    for (const file of result.files) {
      const out = join(distDir, runtime, file.path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, file.content);
    }
  }
}

/* v8 ignore start — CLI entry, exercised end-to-end in Plan B */
async function main() {
  const version = process.env.npm_package_version ?? '0.0.0';
  await runBuild({ version, skillsGlob: 'skills/*/SKILL.md' });
  console.log(`built dist/ for version ${version}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
/* v8 ignore stop */
