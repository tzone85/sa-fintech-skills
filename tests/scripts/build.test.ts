import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync, readFileSync } from 'node:fs';
import { runBuild } from '../../scripts/build.ts';

const DIST = 'dist';

describe('runBuild', () => {
  beforeEach(() => {
    if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  });

  it('writes dist files for each runtime', async () => {
    await runBuild({ version: '0.0.0', skillsGlob: 'skills/*/SKILL.md' });

    expect(existsSync(`${DIST}/claude/skills/popia/SKILL.md`)).toBe(true);
    expect(existsSync(`${DIST}/claude/.claude-plugin/marketplace.json`)).toBe(true);
    expect(existsSync(`${DIST}/cursor/.cursor/rules/popia.mdc`)).toBe(true);
    expect(existsSync(`${DIST}/copilot/.github/copilot-instructions.md`)).toBe(true);
    expect(existsSync(`${DIST}/codex/AGENTS.md`)).toBe(true);
    expect(existsSync(`${DIST}/gemini/skills.json`)).toBe(true);
  });

  it('version header present in claude output', async () => {
    await runBuild({ version: '0.1.2', skillsGlob: 'skills/*/SKILL.md' });
    const content = readFileSync(`${DIST}/claude/skills/popia/SKILL.md`, 'utf8');
    expect(content.startsWith('# sa-fintech-skills@0.1.2')).toBe(true);
  });
});
