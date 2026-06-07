import { detect } from "../../skills/popia/examples/pii-detector.ts";

const ANTI = "skills/popia/examples/anti-pattern.ts";
const CONSENT = "skills/popia/examples/consent-flag.ts";

export interface SmokeResult {
  skill: string;
  ok: boolean;
  reasons: string[];
  skipped?: boolean;
}

export function smokePopia(): SmokeResult {
  const antiFindings = detect(ANTI);
  const consentFindings = detect(CONSENT);
  const reasons: string[] = [];
  if (antiFindings.length === 0)
    reasons.push("expected anti-pattern.ts to be flagged");
  if (consentFindings.length > 0)
    reasons.push("expected consent-flag.ts to be clean");
  return { skill: "popia", ok: reasons.length === 0, reasons };
}
