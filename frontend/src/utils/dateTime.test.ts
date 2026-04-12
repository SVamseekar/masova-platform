import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatTime, formatDate, getElapsedTime, formatDateLocale } from './dateTime';

describe('formatTime', () => {
  it('formats a Date object to time string', () => {
    const date = new Date('2024-06-15T14:30:00');
    const result = formatTime(date);
    // en-IN 12-hour format
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(am|pm|AM|PM)/i);
  });

  it('formats an ISO string to time string', () => {
    const result = formatTime('2024-06-15T09:05:00');
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(am|pm|AM|PM)/i);
  });
});

describe('formatDate', () => {
  it('formats a Date object to date string in en-IN locale', () => {
    const date = new Date('2024-06-15T00:00:00');
    const result = formatDate(date);
    // en-IN format is dd/mm/yyyy
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('formats an ISO string to date string', () => {
    const result = formatDate('2024-01-01T00:00:00');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('getElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns minutes for elapsed time less than 60 minutes', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
    const result = getElapsedTime(thirtyMinutesAgo);
    expect(result).toBe('30m');
  });

  it('returns hours and minutes for elapsed time >= 60 minutes', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const ninetyMinutesAgo = new Date(now - 90 * 60 * 1000);
    const result = getElapsedTime(ninetyMinutesAgo);
    expect(result).toBe('1h 30m');
  });

  it('returns 0m for current time', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const result = getElapsedTime(new Date(now));
    expect(result).toBe('0m');
  });

  it('handles string input', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const result = getElapsedTime(fiveMinutesAgo);
    expect(result).toBe('5m');
  });

  it('returns hours and minutes for multi-hour durations', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    const result = getElapsedTime(threeHoursAgo);
    expect(result).toBe('3h 0m');
  });
});

describe('formatDateLocale', () => {
  it('formats date in German locale — DD.MM.YYYY', () => {
    const result = formatDateLocale('2026-04-11', 'de-DE');
    expect(result).toMatch(/11[.\-/]04[.\-/]2026/);
  });

  it('formats date in French locale', () => {
    const result = formatDateLocale('2026-04-11', 'fr-FR');
    expect(result).toMatch(/11/);
    expect(result).toMatch(/04/);
    expect(result).toMatch(/2026/);
  });

  it('formats date in en-IN locale — same as existing formatDate', () => {
    const result = formatDateLocale('2026-04-11', 'en-IN');
    const existing = formatDate('2026-04-11');
    expect(result).toBe(existing);
  });

  it('falls back to en-IN when locale is null', () => {
    const result = formatDateLocale('2026-04-11', null);
    const expected = formatDate('2026-04-11');
    expect(result).toBe(expected);
  });

  it('falls back to en-IN when locale is undefined', () => {
    const result = formatDateLocale('2026-04-11', undefined);
    const expected = formatDate('2026-04-11');
    expect(result).toBe(expected);
  });
});
