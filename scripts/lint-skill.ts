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
