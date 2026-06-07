export type RuntimeTarget = 'claude' | 'cursor' | 'copilot' | 'codex' | 'gemini';

// Conservative per-runtime body-token caps. Tighten or relax after v0.1.0
// once we measure real-world failures. See spec §8.
export const RUNTIME_CAPS: Record<RuntimeTarget, number> = {
  claude: 8000,
  cursor: 2000,
  copilot: 6000,
  codex: 10000,
  gemini: 8000,
};

export const ALL_TARGETS: RuntimeTarget[] = ['claude', 'cursor', 'copilot', 'codex', 'gemini'];
