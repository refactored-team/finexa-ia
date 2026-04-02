/** País para selector de teléfono (E.164). `dial` sin +. */
export type PhoneCountry = {
  iso: string;
  name: string;
  flag: string;
  /** Código sin + (ej. México 52). */
  dial: string;
  /** Límite de dígitos nacionales (sin código de país). */
  maxNationalDigits: number;
};

/** México por defecto. Lista ordenada para mostrar en el modal (México primero). */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'MX', name: 'México', flag: '🇲🇽', dial: '52', maxNationalDigits: 10 },
  { iso: 'AR', name: 'Argentina', flag: '🇦🇷', dial: '54', maxNationalDigits: 11 },
  { iso: 'US', name: 'Estados Unidos', flag: '🇺🇸', dial: '1', maxNationalDigits: 10 },
  { iso: 'CO', name: 'Colombia', flag: '🇨🇴', dial: '57', maxNationalDigits: 10 },
  { iso: 'ES', name: 'España', flag: '🇪🇸', dial: '34', maxNationalDigits: 9 },
  { iso: 'CL', name: 'Chile', flag: '🇨🇱', dial: '56', maxNationalDigits: 9 },
  { iso: 'PE', name: 'Perú', flag: '🇵🇪', dial: '51', maxNationalDigits: 9 },
  { iso: 'BR', name: 'Brasil', flag: '🇧🇷', dial: '55', maxNationalDigits: 11 },
  { iso: 'UY', name: 'Uruguay', flag: '🇺🇾', dial: '598', maxNationalDigits: 8 },
  { iso: 'EC', name: 'Ecuador', flag: '🇪🇨', dial: '593', maxNationalDigits: 9 },
  { iso: 'BO', name: 'Bolivia', flag: '🇧🇴', dial: '591', maxNationalDigits: 8 },
  { iso: 'PY', name: 'Paraguay', flag: '🇵🇾', dial: '595', maxNationalDigits: 9 },
  { iso: 'CR', name: 'Costa Rica', flag: '🇨🇷', dial: '506', maxNationalDigits: 8 },
  { iso: 'GT', name: 'Guatemala', flag: '🇬🇹', dial: '502', maxNationalDigits: 8 },
  { iso: 'HN', name: 'Honduras', flag: '🇭🇳', dial: '504', maxNationalDigits: 8 },
  { iso: 'SV', name: 'El Salvador', flag: '🇸🇻', dial: '503', maxNationalDigits: 8 },
  { iso: 'PA', name: 'Panamá', flag: '🇵🇦', dial: '507', maxNationalDigits: 8 },
  { iso: 'VE', name: 'Venezuela', flag: '🇻🇪', dial: '58', maxNationalDigits: 10 },
];

export const DEFAULT_PHONE_COUNTRY_ISO = 'MX';

export function getDefaultPhoneCountry(): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.iso === DEFAULT_PHONE_COUNTRY_ISO) ?? PHONE_COUNTRIES[0];
}

/** Ordena por longitud de prefijo descendente para hacer match correcto (+598 antes que +5). */
const byDialLengthDesc = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

export function buildE164(country: PhoneCountry, nationalDigits: string): string {
  const raw = nationalDigits.replace(/\D/g, '').slice(0, country.maxNationalDigits);
  if (!raw) return '';
  return `+${country.dial}${raw}`;
}

/**
 * Intenta separar E.164 en país + parte nacional. Si no matchea, devuelve default MX y dígitos sin +.
 */
export function parseE164ToCountryAndNational(
  value: string,
): { country: PhoneCountry; national: string } {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return { country: getDefaultPhoneCountry(), national: '' };
  }
  for (const c of byDialLengthDesc) {
    if (digits.startsWith(c.dial) && digits.length > c.dial.length) {
      return {
        country: c,
        national: digits.slice(c.dial.length).slice(0, c.maxNationalDigits),
      };
    }
    if (digits.startsWith(c.dial)) {
      return { country: c, national: '' };
    }
  }
  return { country: getDefaultPhoneCountry(), national: digits.slice(0, 15) };
}
