/**
 * Customer-facing form validation for multi-market stores (DE demo + India legacy).
 * Pure helpers — unit-tested without DOM.
 *
 * Do not use India-only 10-digit mobile rules for DE/EUR demo stores.
 */

/** Digits only (for length checks). */
export function phoneDigitCount(phone: string): number {
  return (phone.match(/\d/g) || []).length;
}

/**
 * Accepts E.164-ish and local formats:
 * - optional leading +
 * - spaces, dashes, parentheses allowed
 * - 8–15 digits total (ITU-T E.164 max is 15)
 *
 * Covers DE (+49… / 0170…), India 10-digit mobiles, and most EU locals.
 */
export function isValidCustomerPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s()./-]+$/.test(trimmed)) return false;
  const digits = phoneDigitCount(trimmed);
  return digits >= 8 && digits <= 15;
}

/**
 * Required postal / ZIP when present on forms.
 * EU formats vary (DE 5-digit, NL `1234 AB`, UK mixed). India PIN is 6 digits.
 */
export function isValidCustomerPostal(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (trimmed.length < 3 || trimmed.length > 12) return false;
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{1,11}$/.test(trimmed);
}

/** True when store is treated as non-India (explicit country code, e.g. DE). */
export function isEuOrInternationalStore(countryCode?: string | null): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() !== 'IN';
}

export function phonePlaceholder(countryCode?: string | null): string {
  if (isEuOrInternationalStore(countryCode)) {
    return '+49 170 1234567';
  }
  return '10-digit mobile number';
}

export function postalPlaceholder(countryCode?: string | null): string {
  if (isEuOrInternationalStore(countryCode)) {
    return countryCode?.toUpperCase() === 'DE' ? '10115' : 'Postal / ZIP code';
  }
  return '6-digit PIN code';
}

export function postalFieldLabel(countryCode?: string | null): string {
  if (isEuOrInternationalStore(countryCode)) {
    return countryCode?.toUpperCase() === 'DE' ? 'Postal Code (PLZ)' : 'Postal / ZIP Code';
  }
  return 'ZIP / PIN Code';
}

export function phoneErrorMessage(countryCode?: string | null): string {
  if (isEuOrInternationalStore(countryCode)) {
    return 'Enter a valid phone (8–15 digits, +country code allowed)';
  }
  return 'Enter a valid phone number (10-digit mobile or +country code)';
}

export function postalErrorMessage(countryCode?: string | null): string {
  if (isEuOrInternationalStore(countryCode)) {
    return countryCode?.toUpperCase() === 'DE'
      ? 'Enter a valid German postal code (e.g. 10115)'
      : 'Enter a valid postal / ZIP code (3–12 characters)';
  }
  return 'Enter a valid PIN / ZIP code (3–12 characters)';
}

/** Default country name for address forms when saving. */
export function defaultAddressCountry(countryCode?: string | null): string {
  const code = (countryCode ?? 'IN').toUpperCase();
  if (code === 'DE') return 'Germany';
  if (code === 'IN') return 'India';
  return code;
}

/**
 * Normalize phone for API: keep leading + for E.164; strip other non-digits.
 * Avoids turning +49170… into 49170… incorrectly for EU gateways that expect +.
 */
export function normalizePhoneForApi(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }
  return trimmed.replace(/\D/g, '');
}

/** Extract 4–10 digit postal from a Google Places–style address string. */
export function extractPostalFromAddressParts(parts: string[]): string {
  for (let i = parts.length - 1; i >= 0; i--) {
    const match = parts[i]?.match(/\b(\d{4,10})\b/);
    if (match) return match[1];
  }
  return '';
}
