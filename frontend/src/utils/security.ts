/**
 * Security utilities for frontend
 * Phase 14: Security Hardening - Frontend security
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

/**
 * Check password strength
 */
export interface PasswordStrength {
  score: number;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (!password || password.length === 0) {
    return { score: 0, strength: 'weak', feedback: ['Password is required'] };
  }

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  // Contains lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Contains digit
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  // Contains special character
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters');
  }

  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

  return { score, strength, feedback };
}

/**
 * Secure token storage using sessionStorage (more secure than localStorage)
 */
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },

  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = secureStorage.getItem('csrf_token');
  return storedToken === token;
}

/**
 * Set CSRF token in headers
 */
export function getCSRFHeaders(): Record<string, string> {
  const token = secureStorage.getItem('csrf_token');
  if (!token) {
    const newToken = generateCSRFToken();
    secureStorage.setItem('csrf_token', newToken);
    return { 'X-CSRF-TOKEN': newToken };
  }
  return { 'X-CSRF-TOKEN': token };
}

/**
 * Mask sensitive data
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;

  const [username, domain] = email.split('@');
  if (username.length <= 2) return `**@${domain}`;

  return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
}

/**
 * Prevent clickjacking by checking if page is in iframe
 */
export function preventClickjacking(): void {
  if (window.self !== window.top) {
    window.top!.location = window.self.location;
  }
}

/**
 * Content Security Policy meta tag helper
 */
export function setCSP(): void {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.masova.com",
  ].join('; ');
  document.head.appendChild(meta);
}

/**
 * Secure form submission
 */
export function secureFormSubmit(
  url: string,
  data: Record<string, any>,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getCSRFHeaders(),
    },
    body: JSON.stringify(data),
    credentials: 'same-origin',
    mode: 'cors',
  });
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Input validation
 */
export function validateInput(
  value: string,
  type: 'email' | 'phone' | 'url' | 'alphanumeric'
): boolean {
  switch (type) {
    case 'email':
      return isValidEmail(value);
    case 'phone':
      return isValidPhone(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'alphanumeric':
      return /^[a-zA-Z0-9\s]+$/.test(value);
    default:
      return false;
  }
}

/**
 * Session timeout handler
 */
export class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private readonly timeoutDuration: number;

  constructor(timeoutMinutes: number = 30) {
    this.timeoutDuration = timeoutMinutes * 60 * 1000;
    this.setupActivityListeners();
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, () => this.resetTimeout(), true);
    });
  }

  private resetTimeout(): void {
    this.lastActivity = Date.now();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => this.onTimeout(), this.timeoutDuration);
  }

  private onTimeout(): void {
    // Trigger session timeout - redirect to login
    secureStorage.clear();
    window.location.href = '/login?timeout=true';
  }

  start(): void {
    this.resetTimeout();
  }

  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
