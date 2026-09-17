/**
 * Staff create-form validation for DE / EU demo stores (not India-only).
 * Pure helpers — unit-tested without DOM.
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
 */
export function isValidStaffPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s()./-]+$/.test(trimmed)) return false;
  const digits = phoneDigitCount(trimmed);
  return digits >= 8 && digits <= 15;
}

/**
 * Optional postal / ZIP. EU formats vary (DE 5-digit, NL `1234 AB`, UK mixed).
 * Empty is valid (address fields optional). When present: 3–12 alphanumerics with space/hyphen.
 */
export function isValidPostalCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true;
  if (trimmed.length < 3 || trimmed.length > 12) return false;
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{1,11}$/.test(trimmed);
}

export type StaffCreateFieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  pincode?: string;
};

export function validateStaffCreateForm(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  pincode: string;
}): StaffCreateFieldErrors {
  const errors: StaffCreateFieldErrors = {};
  if (!input.name.trim()) errors.name = 'Name is required';
  if (!input.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!input.phone.trim()) errors.phone = 'Phone is required';
  else if (!isValidStaffPhone(input.phone)) {
    errors.phone = 'Enter a valid phone (8–15 digits, +country code allowed)';
  }
  if (!input.password) errors.password = 'Password is required';
  else if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (!isValidPostalCode(input.pincode)) {
    errors.pincode = 'Enter a valid postal code (3–12 characters)';
  }
  return errors;
}
