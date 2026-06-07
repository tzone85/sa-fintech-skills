import { describe, it, expect } from 'vitest';
import { parseSkill } from '../../scripts/lib/parse-skill.ts';

const validSource = `---
name: popia
description: Audit SA code for POPIA compliance
metadata:
  targets: [claude, cursor]
---

# POPIA

Intro paragraph.

## Triggers

- "popia"
- "PII"
- "consent"

## Examples

See \`examples/consent-flag.ts\`.

## Common mistakes

Storing ID numbers without consent flag.
`;

describe('parseSkill', () => {
  it('parses frontmatter and body sections', () => {
    const parsed = parseSkill(validSource);
    expect(parsed.frontmatter.name).toBe('popia');
    expect(parsed.frontmatter.description).toBe('Audit SA code for POPIA compliance');
    expect(parsed.frontmatter.metadata.targets).toEqual(['claude', 'cursor']);
    expect(parsed.sections.triggers).toContain('"popia"');
    expect(parsed.sections.examples).toContain('consent-flag.ts');
    expect(parsed.sections.commonMistakes).toContain('ID numbers');
    expect(parsed.body).toContain('# POPIA');
  });

  it('throws on missing frontmatter', () => {
    expect(() => parseSkill('# just a body\n')).toThrow(/frontmatter/i);
  });

  it('throws on missing required name', () => {
    const src = `---\ndescription: x\n---\n# body\n`;
    expect(() => parseSkill(src)).toThrow(/name/);
  });

  it('returns null section when H2 missing', () => {
    const src = `---\nname: x\ndescription: y\nmetadata: { targets: [claude] }\n---\n# x\n\n## Triggers\n- a\n`;
    const parsed = parseSkill(src);
    expect(parsed.sections.triggers).toBeTruthy();
    expect(parsed.sections.examples).toBeNull();
    expect(parsed.sections.commonMistakes).toBeNull();
  });
});
