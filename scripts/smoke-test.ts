import { smokePopia } from "./smoke/popia.ts";
import { smokePaystack } from "./smoke/paystack.ts";
import { smokePayfast } from "./smoke/payfast.ts";
import { smokeSars } from "./smoke/sars.ts";

export {
  smokePopia,
  smokePaystack,
  smokePayfast,
  smokeSars,
};

export async function runAllSmokes() {
  return Promise.all([
    Promise.resolve(smokePopia()),
    smokePaystack(),
    Promise.resolve(smokePayfast()),
    Promise.resolve(smokeSars()),
  ]);
}

/* v8 ignore start — CLI entry */
async function main() {
  const results = await runAllSmokes();
  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`${r.skill}: OK${r.skipped ? " (skipped)" : ""}`);
    } else {
      failed++;
      console.error(`${r.skill}: FAIL`);
      for (const reason of r.reasons) console.error(`  - ${reason}`);
    }
  }
  process.exit(failed === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
/* v8 ignore stop */
