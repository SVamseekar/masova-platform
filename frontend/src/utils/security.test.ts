import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  checkPasswordStrength,
  secureStorage,
  maskEmail,
  maskPhoneNumber,
  maskCreditCard,
  validateInput,
  isValidReturnUrl,
  getSavedReturnUrl,
  clearReturnUrl,
  saveReturnUrl,
  getDefaultDashboard,
  RateLimiter,
  ConnectionMonitor,
} from './security';

// DOMPurify is an external dependency; mock it
vi.mock('dompurify', () => ({
  default: {
    sanitize: (dirty: string, _config: any) => dirty.replace(/<script.*?<\/script>/gi, ''),
  },
}));

describe('sanitizeInput', () => {
  it('removes angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<');
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('>');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
  });

  it('removes event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).not.toContain('onclick=');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('returns empty string for null-like input', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.in')).toBe(true);
    expect(isValidEmail('first.last@sub.domain.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@no-local.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts valid phone numbers', () => {
    expect(isValidPhone('+91-9876543210')).toBe(true);
    expect(isValidPhone('555-0123')).toBe(true);
    expect(isValidPhone('(123) 456-7890')).toBe(true);
    expect(isValidPhone('+1 800 555 0123')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('+++')).toBe(false);
  });
});

describe('checkPasswordStrength', () => {
  it('returns weak for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.strength).toBe('weak');
    expect(result.score).toBe(0);
    expect(result.feedback).toContain('Password is required');
  });

  it('returns weak for short simple password', () => {
    const result = checkPasswordStrength('abc');
    expect(result.strength).toBe('weak');
  });

  it('returns medium for moderately complex password', () => {
    const result = checkPasswordStrength('Hello123');
    expect(result.strength).toBe('medium');
  });

  it('returns strong for complex password', () => {
    const result = checkPasswordStrength('MyStr0ng!Pass#2024');
    expect(result.strength).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it('provides feedback for missing criteria', () => {
    const result = checkPasswordStrength('lowercaseonly');
    expect(result.feedback).toContain('Add uppercase letters');
    expect(result.feedback).toContain('Add numbers');
    expect(result.feedback).toContain('Add special characters');
  });

  it('gives extra point for passwords >= 12 characters', () => {
    const short = checkPasswordStrength('Abcdef1!');
    const long = checkPasswordStrength('Abcdefghijkl1!');
    expect(long.score).toBeGreaterThan(short.score);
  });
});

describe('secureStorage', () => {
  beforeEach(() => {
    vi.mocked(sessionStorage.getItem).mockReturnValue(null);
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {});
    vi.mocked(sessionStorage.removeItem).mockImplementation(() => {});
    vi.mocked(sessionStorage.clear).mockImplementation(() => {});
  });

  it('sets item in sessionStorage', () => {
    secureStorage.setItem('key', 'value');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('key', 'value');
  });

  it('gets item from sessionStorage', () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue('stored-value');
    expect(secureStorage.getItem('key')).toBe('stored-value');
  });

  it('removes item from sessionStorage', () => {
    secureStorage.removeItem('key');
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('key');
  });

  it('clears all sessionStorage', () => {
    secureStorage.clear();
    expect(sessionStorage.clear).toHaveBeenCalled();
  });

  it('handles errors gracefully in setItem', () => {
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {
      throw new Error('Storage full');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    secureStorage.setItem('key', 'value');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('returns null on getItem error', () => {
    vi.mocked(sessionStorage.getItem).mockImplementation(() => {
      throw new Error('Access denied');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(secureStorage.getItem('key')).toBeNull();

    errorSpy.mockRestore();
  });
});

describe('maskEmail', () => {
  it('masks the middle of the username', () => {
    expect(maskEmail('john@example.com')).toBe('j**n@example.com');
  });

  it('masks short usernames', () => {
    expect(maskEmail('ab@example.com')).toBe('**@example.com');
  });

  it('returns input when no @ sign', () => {
    expect(maskEmail('invalid')).toBe('invalid');
  });

  it('returns empty/null input unchanged', () => {
    expect(maskEmail('')).toBe('');
    expect(maskEmail(null as any)).toBe(null);
  });
});

describe('maskPhoneNumber', () => {
  it('masks all but last 4 digits', () => {
    expect(maskPhoneNumber('9876543210')).toBe('******3210');
  });

  it('returns short numbers unchanged', () => {
    expect(maskPhoneNumber('123')).toBe('123');
  });

  it('returns empty input unchanged', () => {
    expect(maskPhoneNumber('')).toBe('');
  });
});

describe('maskCreditCard', () => {
  it('masks all but last 4 digits', () => {
    expect(maskCreditCard('4111111111111111')).toBe('************1111');
  });

  it('returns short numbers unchanged', () => {
    expect(maskCreditCard('123')).toBe('123');
  });
});

describe('validateInput', () => {
  it('validates email type', () => {
    expect(validateInput('user@example.com', 'email')).toBe(true);
    expect(validateInput('invalid', 'email')).toBe(false);
  });

  it('validates phone type', () => {
    expect(validateInput('+91-9876543210', 'phone')).toBe(true);
    expect(validateInput('abc', 'phone')).toBe(false);
  });

  it('validates url type', () => {
    expect(validateInput('https://example.com', 'url')).toBe(true);
    expect(validateInput('not-a-url', 'url')).toBe(false);
  });

  it('validates alphanumeric type', () => {
    expect(validateInput('Hello 123', 'alphanumeric')).toBe(true);
    expect(validateInput('Hello@123', 'alphanumeric')).toBe(false);
  });
});

describe('RateLimiter', () => {
  it('allows requests within the limit', () => {
    const limiter = new RateLimiter();
    expect(limiter.isAllowed('test', 3, 60000)).toBe(true);
    expect(limiter.isAllowed('test', 3, 60000)).toBe(true);
    expect(limiter.isAllowed('test', 3, 60000)).toBe(true);
  });

  it('blocks requests exceeding the limit', () => {
    const limiter = new RateLimiter();
    limiter.isAllowed('test', 2, 60000);
    limiter.isAllowed('test', 2, 60000);

    expect(limiter.isAllowed('test', 2, 60000)).toBe(false);
  });

  it('resets specific key', () => {
    const limiter = new RateLimiter();
    limiter.isAllowed('test', 1, 60000);
    expect(limiter.isAllowed('test', 1, 60000)).toBe(false);

    limiter.reset('test');
    expect(limiter.isAllowed('test', 1, 60000)).toBe(true);
  });

  it('tracks separate keys independently', () => {
    const limiter = new RateLimiter();
    limiter.isAllowed('a', 1, 60000);

    expect(limiter.isAllowed('a', 1, 60000)).toBe(false);
    expect(limiter.isAllowed('b', 1, 60000)).toBe(true);
  });
});

describe('isValidReturnUrl', () => {
  it('accepts valid internal paths', () => {
    expect(isValidReturnUrl('/dashboard')).toBe(true);
    expect(isValidReturnUrl('/manager/orders')).toBe(true);
    expect(isValidReturnUrl('/menu?category=pizza')).toBe(true);
  });

  it('rejects null and empty values', () => {
    expect(isValidReturnUrl(null)).toBe(false);
    expect(isValidReturnUrl('')).toBe(false);
  });

  it('rejects external URLs', () => {
    expect(isValidReturnUrl('https://evil.com')).toBe(false);
    expect(isValidReturnUrl('http://evil.com')).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isValidReturnUrl('//evil.com')).toBe(false);
  });

  it('rejects login paths to prevent redirect loops', () => {
    expect(isValidReturnUrl('/login')).toBe(false);
    expect(isValidReturnUrl('/staff-login')).toBe(false);
    expect(isValidReturnUrl('/customer-login')).toBe(false);
  });

  it('accepts login paths with extra path segments', () => {
    expect(isValidReturnUrl('/login-help')).toBe(true);
  });
});

describe('getSavedReturnUrl', () => {
  it('returns valid saved URL', () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue('/dashboard');
    expect(getSavedReturnUrl()).toBe('/dashboard');
  });

  it('returns null for invalid saved URL', () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue('https://evil.com');
    expect(getSavedReturnUrl()).toBeNull();
  });

  it('returns null when no URL is saved', () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue(null);
    expect(getSavedReturnUrl()).toBeNull();
  });

  it('returns null and warns on storage error', () => {
    vi.mocked(sessionStorage.getItem).mockImplementation(() => {
      throw new Error('Access denied');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(getSavedReturnUrl()).toBeNull();

    warnSpy.mockRestore();
  });
});

describe('clearReturnUrl', () => {
  it('removes returnUrl from sessionStorage', () => {
    clearReturnUrl();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('returnUrl');
  });
});

describe('saveReturnUrl', () => {
  it('saves a valid URL and returns true', () => {
    expect(saveReturnUrl('/dashboard')).toBe(true);
    expect(sessionStorage.setItem).toHaveBeenCalledWith('returnUrl', '/dashboard');
  });

  it('rejects invalid URLs and returns false', () => {
    expect(saveReturnUrl('https://evil.com')).toBe(false);
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('getDefaultDashboard', () => {
  it('returns /manager for MANAGER', () => {
    expect(getDefaultDashboard('MANAGER')).toBe('/manager');
  });

  it('returns /manager for ASSISTANT_MANAGER', () => {
    expect(getDefaultDashboard('ASSISTANT_MANAGER')).toBe('/manager');
  });

  it('returns /kitchen for STAFF', () => {
    expect(getDefaultDashboard('STAFF')).toBe('/kitchen');
  });

  it('returns /kitchen for KITCHEN_STAFF', () => {
    expect(getDefaultDashboard('KITCHEN_STAFF')).toBe('/kitchen');
  });

  it('returns /driver for DRIVER', () => {
    expect(getDefaultDashboard('DRIVER')).toBe('/driver');
  });

  it('returns /menu for CUSTOMER', () => {
    expect(getDefaultDashboard('CUSTOMER')).toBe('/menu');
  });

  it('returns / for unknown type', () => {
    expect(getDefaultDashboard('UNKNOWN')).toBe('/');
  });

  it('handles case-insensitive input', () => {
    expect(getDefaultDashboard('manager')).toBe('/manager');
    expect(getDefaultDashboard('driver')).toBe('/driver');
  });
});

describe('ConnectionMonitor', () => {
  it('starts in healthy state', () => {
    const monitor = new ConnectionMonitor();
    expect(monitor.isHealthy()).toBe(true);
    expect(monitor.getFailureCount()).toBe(0);
  });

  it('start method returns immediately (health check disabled)', () => {
    const monitor = new ConnectionMonitor();
    monitor.start('http://localhost:8080');
    expect(monitor.isHealthy()).toBe(true);
  });

  it('stop resets failure count', () => {
    const monitor = new ConnectionMonitor();
    monitor.stop();
    expect(monitor.getFailureCount()).toBe(0);
  });
});
