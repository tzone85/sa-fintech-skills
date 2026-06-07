// SA VAT primitive.
//
// VAT rate: 15% since 2018-04-01.
//   Reference: SARS VAT guide — https://www.sars.gov.za/types-of-tax/value-added-tax/
//
// Rounding: banker's rounding (round half to even) at 2 decimal places,
// matching SARS' convention for tax fractions. Floating-point arithmetic in
// JavaScript can produce values like 0.1 + 0.2 = 0.30000000000000004; we
// normalise by multiplying to integer cents before rounding.

export const VAT_RATE = 0.15;

const HALF_EPSILON = 1e-9;

export function roundCents(value: number): number {
  const cents = value * 100;
  const floor = Math.floor(cents);
  const fraction = cents - floor;

  if (Math.abs(fraction - 0.5) < HALF_EPSILON) {
    // exact half — round to even
    const rounded = floor % 2 === 0 ? floor : floor + 1;
    return rounded / 100;
  }
  return Math.round(cents) / 100;
}

export function vatExclToIncl(excl: number): number {
  return roundCents(excl * (1 + VAT_RATE));
}

export function vatInclToExcl(incl: number): number {
  return roundCents(incl / (1 + VAT_RATE));
}

export function vatAmount(incl: number): number {
  return roundCents(incl - vatInclToExcl(incl));
}
