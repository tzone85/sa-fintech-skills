import { encode } from 'gpt-tokenizer';
import { RUNTIME_CAPS, type RuntimeTarget } from './runtime-config.ts';

export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

export interface BudgetResult {
  ok: boolean;
  tokens: number;
  cap: number;
  runtime: RuntimeTarget;
}

export function checkBudget(text: string, runtime: RuntimeTarget): BudgetResult {
  const tokens = countTokens(text);
  const cap = RUNTIME_CAPS[runtime];
  return { ok: tokens <= cap, tokens, cap, runtime };
}
