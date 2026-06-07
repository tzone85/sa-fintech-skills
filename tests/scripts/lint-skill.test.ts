import { describe, it, expect } from 'vitest';
import { lintSkill } from '../../scripts/lint-skill.ts';

function valid(over = {}): string {
  return `---
name: popia
description: ${'POPIA compliance skill for SA code — PII, consent, residency.'.padEnd(60, ' ')}
metadata:
  targets: [claude, cursor, copilot, codex, gemini]
---

# POPIA

## Triggers

- "popia"
- "PII handling"
- "consent flag"

## Examples

See [examples](./examples/consent-flag.ts).

## Common mistakes

Storing ID numbers without consent flag.
`;
}

describe('lintSkill', () => {
  it('passes a valid skill', () => {
    const result = lintSkill(valid());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when triggers section absent', () => {
    const src = valid().replace(/## Triggers[\s\S]*?(?=## )/, '');
    const result = lintSkill(src);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/Triggers/);
  });

  it('fails when fewer than 3 triggers', () => {
    const src = valid().replace(/- "PII handling"\n- "consent flag"\n/, '');
    const result = lintSkill(src);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/at least 3 trigger/i);
  });

  it('fails when description too short', () => {
    const src = valid().replace(/description: .*/, 'description: short');
    const result = lintSkill(src);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/description/);
  });
});
