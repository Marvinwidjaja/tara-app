/** Normalize a phone number to E.164 (+15551234567). Returns null if it doesn't look valid. */
export function normalizePhone(input: string) {
  const cleaned = input.replace(/^whatsapp:/i, '').replace(/[^\d+]/g, '');
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  return /^\+[1-9]\d{7,14}$/.test(withPlus) ? withPlus : null;
}
