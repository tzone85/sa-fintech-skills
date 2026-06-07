# sa-fintech-skills — Plan A (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working canonical → multi-runtime emitter pipeline plus the POPIA skill end-to-end, proving the architecture before scaling to remaining skills.

**Architecture:** Node 22 + TypeScript. Skills authored as `SKILL.md` with YAML frontmatter. A linter validates them; five emitters fan out to per-runtime artefacts under `dist/<runtime>/`. POPIA ships first because it has no external sandbox dependency — pure static analysis. Plan B (separate doc) adds Paystack, PayFast, SARS, install CLI, CI, release.

**Tech Stack:**
- Node 22 LTS, TypeScript 5.x, ESM
- `tsx` to run TS scripts
- `vitest` for tests
- `gray-matter` for frontmatter parsing
- `gpt-tokenizer` for token counting
- No bundler; scripts run directly via `tsx`

**Spec:** [`../specs/2026-06-07-sa-fintech-skills-design.md`](../specs/2026-06-07-sa-fintech-skills-design.md)

**Plan B (follow-up):** Paystack + PayFast + SARS skills, `install.ts` npx CLI, CI workflows, release to npm + plugin marketplace.

---

## File map (Plan A scope only)

| Path | Responsibility |
|---|---|
| `package.json` | Deps, scripts, ESM type |
| `tsconfig.json` | Strict TS config |
| `vitest.config.ts` | Test runner config |
| `.nvmrc` | Pin Node version |
| `scripts/lib/parse-skill.ts` | Parse `SKILL.md` → typed object |
| `scripts/lib/token-budget.ts` | Token count + per-runtime caps |
| `scripts/lib/runtime-config.ts` | Per-runtime constants in one place |
| `scripts/lint-skill.ts` | CLI: validate a SKILL.md |
| `scripts/build.ts` | CLI: emit `dist/<runtime>/` |
| `scripts/emitters/claude.ts` | Verbatim copy + marketplace.json |
| `scripts/emitters/cursor.ts` | Emit `.cursor/rules/<name>.mdc` |
| `scripts/emitters/copilot.ts` | Concat all skills → `copilot-instructions.md` |
| `scripts/emitters/codex.ts` | Concat all skills → `AGENTS.md` |
| `scripts/emitters/gemini.ts` | Emit `skills.json` manifest |
| `scripts/smoke-test.ts` | Run POPIA static analyser against examples |
| `skills/popia/SKILL.md` | Canonical POPIA skill source |
| `skills/popia/examples/consent-flag.ts` | Correct pattern |
| `skills/popia/examples/anti-pattern.ts` | Wrong pattern with comment |
| `skills/popia/examples/pii-detector.ts` | Static analyser (used by smoke) |
| `tests/scripts/parse-skill.test.ts` | Parser unit tests |
| `tests/scripts/token-budget.test.ts` | Token-budget unit tests |
| `tests/scripts/lint-skill.test.ts` | Lint integration tests |
| `tests/scripts/emitters/claude.test.ts` | Claude emitter golden test |
| `tests/scripts/emitters/cursor.test.ts` | Cursor emitter golden test |
| `tests/scripts/emitters/copilot.test.ts` | Copilot emitter golden test |
| `tests/scripts/emitters/codex.test.ts` | Codex emitter golden test |
| `tests/scripts/emitters/gemini.test.ts` | Gemini emitter golden test |
| `tests/scripts/build.test.ts` | Build orchestrator integration |
| `tests/scripts/smoke-test.test.ts` | POPIA smoke integration |
| `tests/golden/claude/popia.expected` | Claude golden output |
| `tests/golden/cursor/popia.expected` | Cursor golden output |
| `tests/golden/copilot/skills.expected` | Copilot golden output |
| `tests/golden/codex/skills.expected` | Codex golden output |
| `tests/golden/gemini/skills.expected` | Gemini golden output |

---

## Task 1: Project foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.nvmrc`

- [ ] **Step 1: Write `.nvmrc`**

```
22
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "sa-fintech-skills",
  "version": "0.0.0",
  "description": "Multi-runtime AI-agent skill pack for South African fintech APIs",
  "type": "module",
  "license": "MIT",
  "repository": "github:tzone85/sa-fintech-skills",
  "engines": { "node": ">=22" },
  "scripts": {
    "lint:skills": "tsx scripts/lint-skill.ts skills/*/SKILL.md",
    "build": "tsx scripts/build.ts",
    "smoke": "tsx scripts/smoke-test.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "gpt-tokenizer": "^2.5.0",
    "gray-matter": "^4.0.3",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false
  },
  "include": ["scripts/**/*", "tests/**/*", "shared/**/*", "skills/**/examples/**/*"]
}
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['scripts/**/*.ts', 'shared/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, statements: 80 }
    }
  }
});
```

- [ ] **Step 5: Install deps and verify**

Run: `npm install`
Run: `npx tsc --noEmit`
Expected: no output, exit 0.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "chore: scaffold node + typescript + vitest"
```

---

## Task 2: `parse-skill.ts` library (TDD)

**Files:**
- Create: `scripts/lib/parse-skill.ts`
- Test: `tests/scripts/parse-skill.test.ts`

The parser reads a `SKILL.md` from disk and returns a typed `ParsedSkill` with frontmatter + body sections. It must extract literal `## Triggers`, `## Examples`, `## Common mistakes` H2 blocks.

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/parse-skill.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`
Expected: FAIL with "Cannot find module .../parse-skill.ts".

- [ ] **Step 3: Implement `parse-skill.ts`**

Create `scripts/lib/parse-skill.ts`:

```ts
import matter from 'gray-matter';

export type RuntimeTarget = 'claude' | 'cursor' | 'copilot' | 'codex' | 'gemini';

export interface SkillFrontmatter {
  name: string;
  description: string;
  metadata: {
    targets: RuntimeTarget[];
  };
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  sections: {
    triggers: string | null;
    examples: string | null;
    commonMistakes: string | null;
  };
}

const REQUIRED_SECTIONS = ['Triggers', 'Examples', 'Common mistakes'] as const;

function extractSection(body: string, heading: string): string | null {
  const re = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |\\Z)`, 'mi');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

export function parseSkill(source: string): ParsedSkill {
  const parsed = matter(source);
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error('SKILL.md: missing YAML frontmatter');
  }
  const fm = parsed.data as Partial<SkillFrontmatter>;
  if (!fm.name) throw new Error('SKILL.md: frontmatter missing required key "name"');
  if (!fm.description) throw new Error('SKILL.md: frontmatter missing required key "description"');
  if (!fm.metadata?.targets?.length) {
    throw new Error('SKILL.md: frontmatter missing required key "metadata.targets"');
  }

  return {
    frontmatter: fm as SkillFrontmatter,
    body: parsed.content,
    sections: {
      triggers: extractSection(parsed.content, 'Triggers'),
      examples: extractSection(parsed.content, 'Examples'),
      commonMistakes: extractSection(parsed.content, 'Common mistakes')
    }
  };
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/parse-skill.ts tests/scripts/parse-skill.test.ts
git commit -m "feat(lib): parse-skill — frontmatter + section extractor"
```

---

## Task 3: `token-budget.ts` library (TDD)

**Files:**
- Create: `scripts/lib/runtime-config.ts`
- Create: `scripts/lib/token-budget.ts`
- Test: `tests/scripts/token-budget.test.ts`

Defines per-runtime token caps in one place. `runtime-config.ts` owns constants; `token-budget.ts` counts and compares.

Spec §8 flags exact caps as TBC at implementation time. Plan A uses conservative defaults below; revisit before v0.1.0 ships.

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/token-budget.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `runtime-config.ts`**

Create `scripts/lib/runtime-config.ts`:

```ts
import type { RuntimeTarget } from './parse-skill.ts';

// Conservative per-runtime body-token caps. Tighten or relax after v0.1.0
// once we measure real-world failures. See spec §8.
export const RUNTIME_CAPS: Record<RuntimeTarget, number> = {
  claude: 8000,
  cursor: 2000,
  copilot: 6000,
  codex: 10000,
  gemini: 8000
};

export const ALL_TARGETS: RuntimeTarget[] = ['claude', 'cursor', 'copilot', 'codex', 'gemini'];
```

- [ ] **Step 4: Implement `token-budget.ts`**

Create `scripts/lib/token-budget.ts`:

```ts
import { encode } from 'gpt-tokenizer';
import { RUNTIME_CAPS } from './runtime-config.ts';
import type { RuntimeTarget } from './parse-skill.ts';

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
```

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test`
Expected: all tests pass (parse + budget).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/runtime-config.ts scripts/lib/token-budget.ts tests/scripts/token-budget.test.ts
git commit -m "feat(lib): token-budget + per-runtime caps"
```

---

## Task 4: `lint-skill.ts` CLI (TDD)

**Files:**
- Create: `scripts/lint-skill.ts`
- Test: `tests/scripts/lint-skill.test.ts`

Runs frontmatter + section + budget + trigger-count + link checks. Exits 0 on success, 1 on failure with diagnostic message to stderr.

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/lint-skill.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test -- lint-skill`
Expected: module-not-found.

- [ ] **Step 3: Implement `lint-skill.ts`**

Create `scripts/lint-skill.ts`:

```ts
import { readFileSync } from 'node:fs';
import { parseSkill } from './lib/parse-skill.ts';
import { checkBudget } from './lib/token-budget.ts';

export interface LintResult {
  ok: boolean;
  errors: string[];
}

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function lintSkill(source: string): LintResult {
  const errors: string[] = [];

  let parsed;
  try {
    parsed = parseSkill(source);
  } catch (e) {
    return { ok: false, errors: [(e as Error).message] };
  }

  const { frontmatter, body, sections } = parsed;

  if (!NAME_RE.test(frontmatter.name)) {
    errors.push(`name must be kebab-case, got "${frontmatter.name}"`);
  }
  if (frontmatter.description.length < 60 || frontmatter.description.length > 200) {
    errors.push(`description must be 60-200 chars (got ${frontmatter.description.length})`);
  }

  if (!sections.triggers) errors.push('body missing literal "## Triggers" section');
  if (!sections.examples) errors.push('body missing literal "## Examples" section');
  if (!sections.commonMistakes) errors.push('body missing literal "## Common mistakes" section');

  if (sections.triggers) {
    const triggerCount = (sections.triggers.match(/^- /gm) ?? []).length;
    if (triggerCount < 3) {
      errors.push(`Triggers section needs at least 3 trigger phrases (got ${triggerCount})`);
    }
  }

  for (const runtime of frontmatter.metadata.targets) {
    const budget = checkBudget(body, runtime);
    if (!budget.ok) {
      errors.push(
        `body exceeds ${runtime} cap (${budget.tokens} > ${budget.cap} tokens); ` +
        `drop ${runtime} from metadata.targets or shrink body`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('usage: lint-skill <SKILL.md> [...more]');
    process.exit(2);
  }
  let failed = 0;
  for (const path of args) {
    const src = readFileSync(path, 'utf8');
    const result = lintSkill(src);
    if (result.ok) {
      console.log(`OK  ${path}`);
    } else {
      failed++;
      console.error(`FAIL ${path}`);
      for (const err of result.errors) console.error(`  - ${err}`);
    }
  }
  process.exit(failed === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lint-skill.ts tests/scripts/lint-skill.test.ts
git commit -m "feat: lint-skill CLI with frontmatter + section + budget + trigger checks"
```

---

## Task 5: POPIA skill content

**Files:**
- Create: `skills/popia/SKILL.md`
- Create: `skills/popia/examples/consent-flag.ts`
- Create: `skills/popia/examples/anti-pattern.ts`
- Create: `skills/popia/examples/pii-detector.ts`

POPIA skill is body + 2 example files (correct + wrong) + the detector module that smoke-test imports.

- [ ] **Step 1: Write `skills/popia/SKILL.md`**

```markdown
---
name: popia
description: Audit SA code for POPIA compliance — PII handling, consent flags, data residency, and DSAR endpoint requirements.
metadata:
  targets: [claude, cursor, copilot, codex, gemini]
---

# POPIA compliance skill

Use when the user is writing code that stores, transmits, or processes South African personal information. POPIA (Protection of Personal Information Act, 4 of 2013) treats ID numbers, biometrics, financial data, and contact info as personal information. Any handler must record lawful basis, capture consent where required, and respect data-subject access requests (DSAR).

## Triggers

- "popia"
- "PII"
- "consent flag"
- "data residency"
- "DSAR"
- "south african id"
- "personal information"

## Examples

Working example: [`examples/consent-flag.ts`](./examples/consent-flag.ts) — a request handler that records consent before storing an SA ID number.

Wrong example with explanation: [`examples/anti-pattern.ts`](./examples/anti-pattern.ts) — stores ID number with no consent record. Smoke test asserts the PII detector flags this file.

## Common mistakes

- Storing SA ID numbers in plain columns with no `consent_at` / `consent_source` audit fields. The Information Regulator considers this a §11 violation.
- Treating consent as a single boolean. POPIA requires *purpose-specific* consent — a user consenting to marketing has not consented to credit-bureau queries.
- Logging PII into shared observability platforms (Datadog, Sentry) without scrubbing. Logs are processing under POPIA.
- Using US-region storage for SA customer data without a §72 transborder safeguard. Default to ZA regions where available.
- Building a DSAR endpoint that only returns a subset (e.g. profile but not transaction history). The data subject is entitled to *all* personal information.
```

- [ ] **Step 2: Write `skills/popia/examples/consent-flag.ts`** (correct pattern)

```ts
export interface ConsentRecord {
  subjectId: string;
  purpose: 'kyc' | 'marketing' | 'credit-bureau';
  consentAt: string; // ISO timestamp
  consentSource: 'web-form' | 'ussd' | 'paper';
}

export interface PiiRecord {
  saIdNumber: string;
  consent: ConsentRecord;
}

export function storeSubject(idNumber: string, consent: ConsentRecord): PiiRecord {
  if (consent.purpose !== 'kyc') {
    throw new Error('storing SA ID requires kyc-purpose consent');
  }
  return { saIdNumber: idNumber, consent };
}
```

- [ ] **Step 3: Write `skills/popia/examples/anti-pattern.ts`** (wrong pattern with explanation)

```ts
// WRONG: stores SA ID number with no consent record.
// POPIA §11 requires a lawful basis — usually consent — captured at the moment
// of processing. A column-only model with no consent_at / consent_source breaks
// audit. The PII detector flags this file by spotting an SA-ID-shaped literal
// or column name without a sibling consent field.

export function storeIdNumber(idNumber: string): { saIdNumber: string } {
  return { saIdNumber: idNumber };
}
```

- [ ] **Step 4: Write `skills/popia/examples/pii-detector.ts`** (static analyser used by smoke)

```ts
import { readFileSync } from 'node:fs';

// SA ID number = 13 digits, Luhn-checksummable. Loose match: 13-digit literal.
const SA_ID_RE = /\b\d{13}\b|saIdNumber|sa_id_number/;
const CONSENT_HINTS = ['consent', 'lawfulBasis', 'lawful_basis'];

export interface DetectorFinding {
  file: string;
  line: number;
  reason: string;
}

export function detect(path: string): DetectorFinding[] {
  const content = readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const findings: DetectorFinding[] = [];

  const hasConsent = CONSENT_HINTS.some(hint => content.toLowerCase().includes(hint.toLowerCase()));

  lines.forEach((line, idx) => {
    if (SA_ID_RE.test(line) && !hasConsent) {
      findings.push({
        file: path,
        line: idx + 1,
        reason: 'SA ID reference without matching consent field in same module'
      });
    }
  });

  return findings;
}
```

- [ ] **Step 5: Run the lint against the new skill**

Run: `npm run lint:skills`
Expected: `OK skills/popia/SKILL.md`

- [ ] **Step 6: Commit**

```bash
git add skills/popia/
git commit -m "feat(popia): canonical SKILL.md + examples + detector"
```

---

## Task 6: Claude emitter (TDD + golden)

**Files:**
- Create: `scripts/emitters/claude.ts`
- Create: `tests/scripts/emitters/claude.test.ts`
- Create: `tests/golden/claude/popia.expected`

Claude emits two files per skill: `dist/claude/skills/<name>/SKILL.md` (verbatim source minus emitter-only frontmatter) plus a top-level `dist/claude/.claude-plugin/marketplace.json` listing all skills.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/emitters/claude.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitClaude } from '../../../scripts/emitters/claude.ts';
import { parseSkill } from '../../../scripts/lib/parse-skill.ts';

describe('emitClaude', () => {
  it('emits SKILL.md matching golden', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitClaude([{ source, parsed }], { version: '0.0.0' });

    const skillFile = result.files.find(f => f.path === 'skills/popia/SKILL.md');
    expect(skillFile).toBeDefined();

    const golden = readFileSync('tests/golden/claude/popia.expected', 'utf8');
    expect(skillFile!.content).toBe(golden);
  });

  it('emits marketplace.json listing each skill', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitClaude([{ source, parsed }], { version: '0.0.0' });

    const manifest = result.files.find(f => f.path === '.claude-plugin/marketplace.json');
    expect(manifest).toBeDefined();
    const parsedManifest = JSON.parse(manifest!.content);
    expect(parsedManifest.skills).toContainEqual(
      expect.objectContaining({ name: 'popia' })
    );
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`
Expected: module-not-found + missing golden.

- [ ] **Step 3: Implement `scripts/emitters/claude.ts`**

```ts
import type { ParsedSkill } from '../lib/parse-skill.ts';

export interface SkillInput {
  source: string;
  parsed: ParsedSkill;
}

export interface EmittedFile {
  path: string;
  content: string;
}

export interface EmitOptions {
  version: string;
}

export interface EmitResult {
  files: EmittedFile[];
}

const VERSION_HEADER = (v: string) => `# sa-fintech-skills@${v}\n`;

export function emitClaude(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const files: EmittedFile[] = [];

  for (const { source, parsed } of skills) {
    if (!parsed.frontmatter.metadata.targets.includes('claude')) continue;
    files.push({
      path: `skills/${parsed.frontmatter.name}/SKILL.md`,
      content: VERSION_HEADER(opts.version) + source
    });
  }

  const manifest = {
    name: 'sa-fintech-skills',
    version: opts.version,
    skills: skills
      .filter(s => s.parsed.frontmatter.metadata.targets.includes('claude'))
      .map(s => ({
        name: s.parsed.frontmatter.name,
        description: s.parsed.frontmatter.description,
        path: `skills/${s.parsed.frontmatter.name}/SKILL.md`
      }))
  };

  files.push({
    path: '.claude-plugin/marketplace.json',
    content: JSON.stringify(manifest, null, 2) + '\n'
  });

  return { files };
}
```

- [ ] **Step 4: Generate the golden by running emitter once and freezing output**

Run: `npx tsx -e "import {emitClaude} from './scripts/emitters/claude.ts'; import {parseSkill} from './scripts/lib/parse-skill.ts'; import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'; const src = readFileSync('skills/popia/SKILL.md','utf8'); const r = emitClaude([{source:src, parsed:parseSkill(src)}], {version:'0.0.0'}); mkdirSync('tests/golden/claude', {recursive:true}); writeFileSync('tests/golden/claude/popia.expected', r.files.find(f=>f.path.endsWith('popia/SKILL.md')).content);"`

Inspect: `cat tests/golden/claude/popia.expected`
Expected: starts with `# sa-fintech-skills@0.0.0` then verbatim SKILL.md source.

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test`
Expected: 2 emitter tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/emitters/claude.ts tests/scripts/emitters/claude.test.ts tests/golden/claude/popia.expected
git commit -m "feat(emitter): claude — SKILL.md verbatim + marketplace.json"
```

---

## Task 7: Cursor emitter (TDD + golden)

**Files:**
- Create: `scripts/emitters/cursor.ts`
- Create: `tests/scripts/emitters/cursor.test.ts`
- Create: `tests/golden/cursor/popia.expected`

Cursor `.mdc` format: frontmatter with `description` + `globs` + `alwaysApply`, then body. Default to `alwaysApply: false` and `globs: ['**/*.ts', '**/*.py']` so the rule activates on relevant files but doesn't drown the context window.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/emitters/cursor.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`
Expected: module-not-found.

- [ ] **Step 3: Implement `scripts/emitters/cursor.ts`**

```ts
import type { SkillInput, EmitOptions, EmitResult, EmittedFile } from './claude.ts';

const DEFAULT_GLOBS = ['**/*.ts', '**/*.tsx', '**/*.py', '**/*.js'];

export function emitCursor(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const files: EmittedFile[] = [];

  for (const { parsed } of skills) {
    if (!parsed.frontmatter.metadata.targets.includes('cursor')) continue;

    const fm = [
      '---',
      `description: ${parsed.frontmatter.description}`,
      `globs: ${JSON.stringify(DEFAULT_GLOBS)}`,
      'alwaysApply: false',
      `# sa-fintech-skills@${opts.version}`,
      '---',
      ''
    ].join('\n');

    files.push({
      path: `.cursor/rules/${parsed.frontmatter.name}.mdc`,
      content: fm + parsed.body
    });
  }

  return { files };
}
```

- [ ] **Step 4: Generate the golden**

Run: `npx tsx -e "import {emitCursor} from './scripts/emitters/cursor.ts'; import {parseSkill} from './scripts/lib/parse-skill.ts'; import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'; const src = readFileSync('skills/popia/SKILL.md','utf8'); const r = emitCursor([{source:src, parsed:parseSkill(src)}], {version:'0.0.0'}); mkdirSync('tests/golden/cursor', {recursive:true}); writeFileSync('tests/golden/cursor/popia.expected', r.files[0].content);"`

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test`
Expected: cursor tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/emitters/cursor.ts tests/scripts/emitters/cursor.test.ts tests/golden/cursor/popia.expected
git commit -m "feat(emitter): cursor — .mdc with globs + alwaysApply:false"
```

---

## Task 8: Copilot emitter (TDD + golden)

**Files:**
- Create: `scripts/emitters/copilot.ts`
- Create: `tests/scripts/emitters/copilot.test.ts`
- Create: `tests/golden/copilot/skills.expected`

Copilot wants a single `.github/copilot-instructions.md`. Emitter concatenates all targeted skills under H2 headings, prepended with version header and intro paragraph.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/emitters/copilot.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitCopilot } from '../../../scripts/emitters/copilot.ts';
import { parseSkill } from '../../../scripts/lib/parse-skill.ts';

describe('emitCopilot', () => {
  it('produces single instructions file matching golden', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitCopilot([{ source, parsed }], { version: '0.0.0' });

    const file = result.files.find(f => f.path === '.github/copilot-instructions.md');
    expect(file).toBeDefined();
    const golden = readFileSync('tests/golden/copilot/skills.expected', 'utf8');
    expect(file!.content).toBe(golden);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`

- [ ] **Step 3: Implement `scripts/emitters/copilot.ts`**

```ts
import type { SkillInput, EmitOptions, EmitResult } from './claude.ts';

export function emitCopilot(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const eligible = skills.filter(s => s.parsed.frontmatter.metadata.targets.includes('copilot'));
  if (eligible.length === 0) return { files: [] };

  const parts: string[] = [
    `<!-- sa-fintech-skills@${opts.version} -->`,
    '# SA fintech skills',
    '',
    'When the user is writing code that touches South African payment APIs (Paystack, PayFast), POPIA personal information, or SARS tax workflows, apply the skill below whose triggers best match.',
    ''
  ];

  for (const { parsed } of eligible) {
    parts.push(`## ${parsed.frontmatter.name}`, '');
    parts.push(`> ${parsed.frontmatter.description}`, '');
    parts.push(parsed.body.trim(), '');
  }

  return {
    files: [{
      path: '.github/copilot-instructions.md',
      content: parts.join('\n') + '\n'
    }]
  };
}
```

- [ ] **Step 4: Generate the golden**

Run: `npx tsx -e "import {emitCopilot} from './scripts/emitters/copilot.ts'; import {parseSkill} from './scripts/lib/parse-skill.ts'; import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'; const src = readFileSync('skills/popia/SKILL.md','utf8'); const r = emitCopilot([{source:src, parsed:parseSkill(src)}], {version:'0.0.0'}); mkdirSync('tests/golden/copilot', {recursive:true}); writeFileSync('tests/golden/copilot/skills.expected', r.files[0].content);"`

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test`

- [ ] **Step 6: Commit**

```bash
git add scripts/emitters/copilot.ts tests/scripts/emitters/copilot.test.ts tests/golden/copilot/skills.expected
git commit -m "feat(emitter): copilot — single instructions file with H2 per skill"
```

---

## Task 9: Codex emitter (TDD + golden)

**Files:**
- Create: `scripts/emitters/codex.ts`
- Create: `tests/scripts/emitters/codex.test.ts`
- Create: `tests/golden/codex/skills.expected`

Codex consumes `AGENTS.md` at repo root. Structure mirrors Copilot but file name + intro differ. Same H2-per-skill pattern.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/emitters/codex.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`

- [ ] **Step 3: Implement `scripts/emitters/codex.ts`**

```ts
import type { SkillInput, EmitOptions, EmitResult } from './claude.ts';

export function emitCodex(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const eligible = skills.filter(s => s.parsed.frontmatter.metadata.targets.includes('codex'));
  if (eligible.length === 0) return { files: [] };

  const parts: string[] = [
    `<!-- sa-fintech-skills@${opts.version} -->`,
    '# Agent guidance — SA fintech',
    '',
    'Project-specific instructions for any agent (Codex, Copilot CLI, Cursor, Claude Code) touching South African payment APIs, POPIA, or SARS workflows.',
    ''
  ];

  for (const { parsed } of eligible) {
    parts.push(`## ${parsed.frontmatter.name}`, '');
    parts.push(`> ${parsed.frontmatter.description}`, '');
    parts.push(parsed.body.trim(), '');
  }

  return {
    files: [{
      path: 'AGENTS.md',
      content: parts.join('\n') + '\n'
    }]
  };
}
```

- [ ] **Step 4: Generate the golden**

Run: `npx tsx -e "import {emitCodex} from './scripts/emitters/codex.ts'; import {parseSkill} from './scripts/lib/parse-skill.ts'; import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'; const src = readFileSync('skills/popia/SKILL.md','utf8'); const r = emitCodex([{source:src, parsed:parseSkill(src)}], {version:'0.0.0'}); mkdirSync('tests/golden/codex', {recursive:true}); writeFileSync('tests/golden/codex/skills.expected', r.files[0].content);"`

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test`

- [ ] **Step 6: Commit**

```bash
git add scripts/emitters/codex.ts tests/scripts/emitters/codex.test.ts tests/golden/codex/skills.expected
git commit -m "feat(emitter): codex — AGENTS.md with H2 per skill"
```

---

## Task 10: Gemini emitter (TDD + golden)

**Files:**
- Create: `scripts/emitters/gemini.ts`
- Create: `tests/scripts/emitters/gemini.test.ts`
- Create: `tests/golden/gemini/skills.expected`

Gemini consumes a JSON manifest declaring skills with descriptions + body URLs. Body itself published as separate `.md` files alongside the manifest. Emitter outputs both the manifest and per-skill markdown.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/emitters/gemini.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitGemini } from '../../../scripts/emitters/gemini.ts';
import { parseSkill } from '../../../scripts/lib/parse-skill.ts';

describe('emitGemini', () => {
  it('emits manifest matching golden', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitGemini([{ source, parsed }], { version: '0.0.0' });

    const manifest = result.files.find(f => f.path === 'skills.json');
    expect(manifest).toBeDefined();
    const golden = readFileSync('tests/golden/gemini/skills.expected', 'utf8');
    expect(manifest!.content).toBe(golden);
  });

  it('emits per-skill body file', () => {
    const source = readFileSync('skills/popia/SKILL.md', 'utf8');
    const parsed = parseSkill(source);
    const result = emitGemini([{ source, parsed }], { version: '0.0.0' });
    expect(result.files.find(f => f.path === 'skills/popia.md')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`

- [ ] **Step 3: Implement `scripts/emitters/gemini.ts`**

```ts
import type { SkillInput, EmitOptions, EmitResult, EmittedFile } from './claude.ts';

export function emitGemini(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const eligible = skills.filter(s => s.parsed.frontmatter.metadata.targets.includes('gemini'));
  const files: EmittedFile[] = [];

  const manifest = {
    name: 'sa-fintech-skills',
    version: opts.version,
    skills: eligible.map(s => ({
      name: s.parsed.frontmatter.name,
      description: s.parsed.frontmatter.description,
      body: `skills/${s.parsed.frontmatter.name}.md`
    }))
  };

  files.push({
    path: 'skills.json',
    content: JSON.stringify(manifest, null, 2) + '\n'
  });

  for (const { parsed } of eligible) {
    files.push({
      path: `skills/${parsed.frontmatter.name}.md`,
      content: `<!-- sa-fintech-skills@${opts.version} -->\n` + parsed.body
    });
  }

  return { files };
}
```

- [ ] **Step 4: Generate the golden**

Run: `npx tsx -e "import {emitGemini} from './scripts/emitters/gemini.ts'; import {parseSkill} from './scripts/lib/parse-skill.ts'; import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'; const src = readFileSync('skills/popia/SKILL.md','utf8'); const r = emitGemini([{source:src, parsed:parseSkill(src)}], {version:'0.0.0'}); mkdirSync('tests/golden/gemini', {recursive:true}); writeFileSync('tests/golden/gemini/skills.expected', r.files.find(f=>f.path==='skills.json').content);"`

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test`

- [ ] **Step 6: Commit**

```bash
git add scripts/emitters/gemini.ts tests/scripts/emitters/gemini.test.ts tests/golden/gemini/skills.expected
git commit -m "feat(emitter): gemini — manifest + per-skill body files"
```

---

## Task 11: `build.ts` orchestrator (TDD)

**Files:**
- Create: `scripts/build.ts`
- Test: `tests/scripts/build.test.ts`

Walks `skills/*/SKILL.md`, parses, dispatches to each emitter, writes `dist/<runtime>/<emitted-path>`. Idempotent — clears `dist/` first. `--check` mode skips disk write and diffs against goldens instead.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/build.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`

- [ ] **Step 3: Implement `scripts/build.ts`**

```ts
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { glob } from 'node:fs/promises';
import { parseSkill } from './lib/parse-skill.ts';
import { ALL_TARGETS } from './lib/runtime-config.ts';
import { emitClaude } from './emitters/claude.ts';
import { emitCursor } from './emitters/cursor.ts';
import { emitCopilot } from './emitters/copilot.ts';
import { emitCodex } from './emitters/codex.ts';
import { emitGemini } from './emitters/gemini.ts';
import type { SkillInput, EmitResult } from './emitters/claude.ts';

const EMITTERS = {
  claude: emitClaude,
  cursor: emitCursor,
  copilot: emitCopilot,
  codex: emitCodex,
  gemini: emitGemini
} as const;

export interface BuildOptions {
  version: string;
  skillsGlob: string;
  distDir?: string;
}

export async function runBuild(opts: BuildOptions): Promise<void> {
  const distDir = opts.distDir ?? 'dist';
  if (existsSync(distDir)) rmSync(distDir, { recursive: true });

  const skills: SkillInput[] = [];
  for await (const path of glob(opts.skillsGlob)) {
    const source = readFileSync(path, 'utf8');
    skills.push({ source, parsed: parseSkill(source) });
  }

  for (const runtime of ALL_TARGETS) {
    const result: EmitResult = EMITTERS[runtime](skills, { version: opts.version });
    for (const file of result.files) {
      const out = join(distDir, runtime, file.path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, file.content);
    }
  }
}

async function main() {
  const version = process.env.npm_package_version ?? '0.0.0';
  await runBuild({ version, skillsGlob: 'skills/*/SKILL.md' });
  console.log(`built dist/ for version ${version}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test`
Expected: all build tests pass + all emitter tests still pass.

- [ ] **Step 5: Run build manually to sanity-check on-disk output**

Run: `npm run build`
Run: `ls dist/`
Expected: `claude  codex  copilot  cursor  gemini` directories present.

- [ ] **Step 6: Commit**

```bash
git add scripts/build.ts tests/scripts/build.test.ts
git commit -m "feat: build orchestrator — walks skills/, dispatches all emitters"
```

---

## Task 12: POPIA smoke test (TDD)

**Files:**
- Create: `scripts/smoke-test.ts`
- Test: `tests/scripts/smoke-test.test.ts`

For Plan A the smoke surface is POPIA-only: run the PII detector against the two example files and assert the anti-pattern is flagged and the consent-flag example is clean. Paystack/PayFast sandbox smokes land in Plan B.

- [ ] **Step 1: Write the failing test**

Create `tests/scripts/smoke-test.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`

- [ ] **Step 3: Implement `scripts/smoke-test.ts`**

```ts
import { detect } from '../skills/popia/examples/pii-detector.ts';

const ANTI = 'skills/popia/examples/anti-pattern.ts';
const CONSENT = 'skills/popia/examples/consent-flag.ts';

export interface SmokeResult {
  ok: boolean;
  flagged: string[];
  reasons: string[];
}

export function smokePopia(): SmokeResult {
  const antiFindings = detect(ANTI);
  const consentFindings = detect(CONSENT);

  const flagged = [...antiFindings, ...consentFindings].map(f => f.file);
  const expectations = {
    antiFlagged: antiFindings.length > 0,
    consentClean: consentFindings.length === 0
  };

  const reasons: string[] = [];
  if (!expectations.antiFlagged) reasons.push('expected anti-pattern.ts to be flagged but it was not');
  if (!expectations.consentClean) reasons.push('expected consent-flag.ts to be clean but it was flagged');

  return {
    ok: expectations.antiFlagged && expectations.consentClean,
    flagged,
    reasons
  };
}

async function main() {
  const result = smokePopia();
  if (result.ok) {
    console.log('POPIA smoke: OK');
    process.exit(0);
  }
  console.error('POPIA smoke: FAIL');
  for (const r of result.reasons) console.error(`  - ${r}`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test`

- [ ] **Step 5: Run smoke manually**

Run: `npm run smoke`
Expected: `POPIA smoke: OK`, exit 0.

- [ ] **Step 6: Verify full suite green**

Run: `npm test -- --coverage`
Expected: all tests pass, coverage ≥ 80% on `scripts/lib/` and `shared/` (shared is empty in Plan A but the threshold applies to everything we have).

- [ ] **Step 7: Commit**

```bash
git add scripts/smoke-test.ts tests/scripts/smoke-test.test.ts
git commit -m "feat: POPIA smoke test — flags anti-pattern, clears consent-flag"
```

---

## Plan A done — what's shipped

After Task 12:

- `npm run lint:skills` validates SKILL.md files
- `npm run build` emits `dist/claude|cursor|copilot|codex|gemini/` from canonical source
- `npm run smoke` runs the POPIA detector against examples
- `npm test` runs full vitest suite with ≥ 80% coverage on Plan A surface
- A user can manually copy `dist/<runtime>/` contents into their own project to install POPIA in any of the 5 supported runtimes — no CLI yet, no CI, no npm publish

This is enough to push a `v0.0.1-alpha` tag, gather feedback, and decide on Plan B priorities.

## Plan B preview (to be written separately)

- Paystack skill + sandbox smoke
- PayFast skill + sandbox smoke
- SARS skill + pure-function tests
- `validate-sa-id.ts`, `vat.ts`, `bank-codes.ts` shared primitives
- `install.ts` — npx CLI with runtime detection
- `.github/workflows/{ci,nightly-drift,release}.yml`
- `package.json` `bin`/`exports` for npm publish
- v0.1.0 release: GH Release + npm + plugin marketplace auto-PR
