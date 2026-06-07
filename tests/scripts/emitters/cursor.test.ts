import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitCursor } from '../../../scripts/emitters/cursor.ts';
import { parseSkill } from '../../../scripts/lib/parse-skill.ts';

describe('emitCursor', () => {
  it('emits .mdc matching golden', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitCursor([{ source, parsed }], { version: '0.0.0' });

    const file = result.files.find(f => f.path === '.cursor/rules/popia.mdc');
    expect(file).toBeDefined();

    const golden = readFileSync('tests/golden/cursor/popia.expected', 'utf8');
    expect(file!.content).toBe(golden);
  });

  it('skips skills not targeting cursor', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    parsed.frontmatter.metadata.targets = ['claude'];
    const result = emitCursor([{ source, parsed }], { version: '0.0.0' });
    expect(result.files).toHaveLength(0);
  });
});
