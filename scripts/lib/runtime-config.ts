export const ALL_TARGETS = [
  "claude",
  "cursor",
  "copilot",
  "codex",
  "gemini",
] as const;
export type RuntimeTarget = (typeof ALL_TARGETS)[number];

// Conservative per-runtime body-token caps. Tighten or relax after v0.1.0
// once we measure real-world failures. See spec §8.
export const RUNTIME_CAPS: Record<RuntimeTarget, number> = {
  claude: 8000,
  cursor: 2000,
  copilot: 6000,
  codex: 10000,
  gemini: 8000,
};
