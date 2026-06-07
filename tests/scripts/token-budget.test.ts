import { describe, it, expect } from 'vitest';
import { countTokens, checkBudget } from '../../scripts/lib/token-budget.ts';
import { RUNTIME_CAPS } from '../../scripts/lib/runtime-config.ts';

describe('countTokens', () => {
  it('returns non-zero count for text', () => {
    expect(countTokens('hello world')).toBeGreaterThan(0);
  });
  it('returns 0 for empty string', () => {
    expect(countTokens('')).toBe(0);
  });
});

describe('checkBudget', () => {
  it('passes when under cap', () => {
    const result = checkBudget('short', 'copilot');
    expect(result.ok).toBe(true);
    expect(result.tokens).toBeLessThan(RUNTIME_CAPS.copilot);
  });

  it('fails when over cap', () => {
    const huge = 'word '.repeat(20000);
    const result = checkBudget(huge, 'cursor');
    expect(result.ok).toBe(false);
    expect(result.tokens).toBeGreaterThan(RUNTIME_CAPS.cursor);
  });
});
