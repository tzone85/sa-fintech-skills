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

/* v8 ignore start — CLI entry, exercised end-to-end in Plan B */
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
/* v8 ignore stop */
