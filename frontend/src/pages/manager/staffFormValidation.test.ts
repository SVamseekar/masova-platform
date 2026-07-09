import { describe, it, expect } from 'vitest';
import {
  isValidStaffPhone,
  isValidPostalCode,
  phoneDigitCount,
  validateStaffCreateForm,
} from './staffFormValidation';

describe('staffFormValidation', () => {
  describe('isValidStaffPhone', () => {
    it('accepts DE mobile with country code', () => {
      expect(isValidStaffPhone('+49 170 1234567')).toBe(true);
    });

    it('accepts local DE without +', () => {
      expect(isValidStaffPhone('030 12345678')).toBe(true);
    });

    it('rejects India-only 10-digit assumption as exclusive (still accepts 10 digits)', () => {
      expect(isValidStaffPhone('9876543210')).toBe(true);
    });

    it('rejects too short', () => {
      expect(isValidStaffPhone('12345')).toBe(false);
    });

    it('rejects letters', () => {
      expect(isValidStaffPhone('call-me')).toBe(false);
    });

    it('rejects empty', () => {
      expect(isValidStaffPhone('')).toBe(false);
      expect(isValidStaffPhone('   ')).toBe(false);
    });
  });

  describe('isValidPostalCode', () => {
    it('allows empty (optional)', () => {
      expect(isValidPostalCode('')).toBe(true);
    });

    it('accepts DE 5-digit', () => {
      expect(isValidPostalCode('10115')).toBe(true);
    });

    it('accepts NL with space', () => {
      expect(isValidPostalCode('1012 AB')).toBe(true);
    });

    it('rejects too short', () => {
      expect(isValidPostalCode('12')).toBe(false);
    });
  });

  describe('phoneDigitCount', () => {
    it('counts digits only', () => {
      expect(phoneDigitCount('+49 170-123')).toBe(8);
    });
  });

  describe('validateStaffCreateForm', () => {
    it('returns no errors for valid EU staff', () => {
      const errors = validateStaffCreateForm({
        name: 'Ada Berlin',
        email: 'ada@example.com',
        phone: '+49 170 1234567',
        password: 'Demo@12',
        pincode: '10115',
      });
      expect(errors).toEqual({});
    });

    it('flags invalid phone with message', () => {
      const errors = validateStaffCreateForm({
        name: 'Ada',
        email: 'ada@example.com',
        phone: '123',
        password: 'Demo@12',
        pincode: '',
      });
      expect(errors.phone).toMatch(/8–15 digits/i);
    });
  });
});
