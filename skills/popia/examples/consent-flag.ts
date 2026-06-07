export interface ConsentRecord {
  subjectId: string;
  purpose: "kyc" | "marketing" | "credit-bureau";
  consentAt: string; // ISO timestamp
  consentSource: "web-form" | "ussd" | "paper";
}

export interface PiiRecord {
  saIdNumber: string;
  consent: ConsentRecord;
}

export function storeSubject(
  idNumber: string,
  consent: ConsentRecord,
): PiiRecord {
  if (consent.purpose !== "kyc") {
    throw new Error("storing SA ID requires kyc-purpose consent");
  }
  return { saIdNumber: idNumber, consent };
}
