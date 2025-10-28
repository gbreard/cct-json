const ROMANS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"
];

export function suggestNextRoman(existing: string[]): string {
  const used = new Set(existing);
  for (const r of ROMANS) {
    if (!used.has(r)) return r;
  }
  return ROMANS[ROMANS.length - 1];
}

export function isValidRoman(r: string): boolean {
  return ROMANS.includes(r);
}

export function getAllRomans(): string[] {
  return [...ROMANS];
}
