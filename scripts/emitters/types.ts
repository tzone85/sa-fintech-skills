import type { ParsedSkill } from '../lib/parse-skill.ts';

export interface SkillInput {
  source: string;
  parsed: ParsedSkill;
}

export interface EmittedFile {
  path: string;
  content: string;
}

export interface EmitOptions {
  version: string;
}

export interface EmitResult {
  files: EmittedFile[];
}
