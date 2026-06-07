import { describe, it, expect } from 'vitest';
import { smokePopia } from '../../scripts/smoke-test.ts';

describe('smokePopia', () => {
  it('flags anti-pattern.ts', () => {
    const result = smokePopia();
    expect(result.flagged).toContain('skills/popia/examples/anti-pattern.ts');
  });

  it('does NOT flag consent-flag.ts', () => {
    const result = smokePopia();
    expect(result.flagged).not.toContain('skills/popia/examples/consent-flag.ts');
  });

  it('overall ok=true when expectations hold', () => {
    const result = smokePopia();
    expect(result.ok).toBe(true);
  });
});
