import { describe, it, expect } from 'vitest';
import {
  isValidCustomerPhone,
  isValidCustomerPostal,
  isEuOrInternationalStore,
  phonePlaceholder,
  postalPlaceholder,
  postalFieldLabel,
  phoneErrorMessage,
  postalErrorMessage,
  defaultAddressCountry,
  normalizePhoneForApi,
  extractPostalFromAddressParts,
  phoneDigitCount,
} from './customerFormValidation';

describe('customerFormValidation', () => {
  describe('isValidCustomerPhone', () => {
    it('accepts German E.164 and local mobiles', () => {
      expect(isValidCustomerPhone('+49 170 1234567')).toBe(true);
      expect(isValidCustomerPhone('+491701234567')).toBe(true);
      expect(isValidCustomerPhone('0170 1234567')).toBe(true);
      expect(isValidCustomerPhone('030 12345678')).toBe(true);
    });

    it('accepts India 10-digit mobiles', () => {
      expect(isValidCustomerPhone('9876543210')).toBe(true);
    });

    it('rejects too short or non-numeric', () => {
      expect(isValidCustomerPhone('12345')).toBe(false);
      expect(isValidCustomerPhone('call-me')).toBe(false);
      expect(isValidCustomerPhone('')).toBe(false);
      expect(isValidCustomerPhone('   ')).toBe(false);
    });
  });

  describe('isValidCustomerPostal', () => {
    it('accepts DE PLZ and India PIN', () => {
      expect(isValidCustomerPostal('10115')).toBe(true);
      expect(isValidCustomerPostal('500001')).toBe(true);
    });

    it('accepts NL-style mixed postal', () => {
      expect(isValidCustomerPostal('1012 AB')).toBe(true);
    });

    it('rejects empty or too short', () => {
      expect(isValidCustomerPostal('')).toBe(false);
      expect(isValidCustomerPostal('12')).toBe(false);
    });
  });

  describe('market-aware copy', () => {
    it('flags DE as international store', () => {
      expect(isEuOrInternationalStore('DE')).toBe(true);
      expect(isEuOrInternationalStore('IN')).toBe(false);
      expect(isEuOrInternationalStore(null)).toBe(false);
    });

    it('uses EU phone placeholder for DE', () => {
      expect(phonePlaceholder('DE')).toBe('+49 170 1234567');
      expect(phonePlaceholder(null)).toMatch(/10-digit/i);
    });

    it('uses DE PLZ placeholder and label', () => {
      expect(postalPlaceholder('DE')).toBe('10115');
      expect(postalFieldLabel('DE')).toMatch(/PLZ/i);
      expect(postalPlaceholder(null)).toMatch(/PIN/i);
    });

    it('does not mention Indian-only phone rules for DE', () => {
      expect(phoneErrorMessage('DE')).not.toMatch(/Indian/i);
      expect(phoneErrorMessage('DE')).not.toMatch(/10-digit Indian/i);
      expect(postalErrorMessage('DE')).toMatch(/German|10115/i);
    });

    it('defaultAddressCountry maps DE → Germany', () => {
      expect(defaultAddressCountry('DE')).toBe('Germany');
      expect(defaultAddressCountry(null)).toBe('India');
    });
  });

  describe('normalizePhoneForApi', () => {
    it('keeps leading + for E.164', () => {
      expect(normalizePhoneForApi('+49 170 1234567')).toBe('+491701234567');
    });

    it('strips non-digits for local numbers', () => {
      expect(normalizePhoneForApi('0170-1234567')).toBe('01701234567'.replace(/\D/g, ''));
      expect(normalizePhoneForApi('9876543210')).toBe('9876543210');
    });
  });

  describe('extractPostalFromAddressParts', () => {
    it('finds 5-digit DE PLZ', () => {
      expect(
        extractPostalFromAddressParts(['Torstraße 1', '10115 Berlin', 'Germany'])
      ).toBe('10115');
    });

    it('finds 6-digit India PIN', () => {
      expect(
        extractPostalFromAddressParts(['MG Road', 'Hyderabad Telangana 500001', 'India'])
      ).toBe('500001');
    });
  });

  describe('phoneDigitCount', () => {
    it('counts digits only', () => {
      expect(phoneDigitCount('+49 170-123')).toBe(8);
    });
  });
});
