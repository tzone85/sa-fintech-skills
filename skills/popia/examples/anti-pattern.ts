// WRONG: stores SA ID number with no consent record.
// POPIA §11 requires a lawful basis — usually consent — captured at the moment
// of processing. A column-only model with no consent_at / consent_source breaks
// audit. The PII detector flags this file by spotting an SA-ID-shaped literal
// or column name without a sibling consent field.

export function storeIdNumber(idNumber: string): { saIdNumber: string } {
  return { saIdNumber: idNumber };
}
