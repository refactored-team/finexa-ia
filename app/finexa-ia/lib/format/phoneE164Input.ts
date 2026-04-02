/** Normaliza entrada a E.164 parcial: `+` y hasta 15 dígitos (sin espacios). */
export function normalizePhoneE164Input(next: string): string {
  const trimmed = next.trim();
  if (trimmed === '') return '';
  const digits = next.replace(/\D/g, '');
  if (digits === '') return '';
  return `+${digits.slice(0, 15)}`;
}
