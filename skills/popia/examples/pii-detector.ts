import { readFileSync } from "node:fs";

// SA ID number = 13 digits, Luhn-checksummable. Loose match: 13-digit literal.
const SA_ID_RE = /\b\d{13}\b|saIdNumber|sa_id_number/;
const CONSENT_HINTS = ["consent", "lawfulBasis", "lawful_basis"];

export interface DetectorFinding {
  file: string;
  line: number;
  reason: string;
}

export function detect(path: string): DetectorFinding[] {
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const findings: DetectorFinding[] = [];

  const hasConsent = CONSENT_HINTS.some((hint) =>
    content.toLowerCase().includes(hint.toLowerCase()),
  );

  lines.forEach((line, idx) => {
    if (SA_ID_RE.test(line) && !hasConsent) {
      findings.push({
        file: path,
        line: idx + 1,
        reason:
          "SA ID reference without matching consent field in same module",
      });
    }
  });

  return findings;
}
