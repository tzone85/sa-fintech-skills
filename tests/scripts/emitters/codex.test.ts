import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitCodex } from '../../../scripts/emitters/codex.ts';
import { parseSkill } from '../../../scripts/lib/parse-skill.ts';

describe('emitCodex', () => {
  it('produces AGENTS.md matching golden', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitCodex([{ source, parsed }], { version: '0.0.0' });

    const file = result.files.find(f => f.path === 'AGENTS.md');
    expect(file).toBeDefined();
    const golden = readFileSync('tests/golden/codex/skills.expected', 'utf8');
    expect(file!.content).toBe(golden);
  });
});
