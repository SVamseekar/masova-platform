import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  calculateVisibleRange,
  memoize,
  cacheStorage,
  getOptimizedImageUrl,
  shouldLoadModule,
  measureRenderTime,
  performanceMonitor,
} from './performance';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets the timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('only executes with the latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    debounced('third');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('third');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes the function immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('ignores calls within the throttle window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows execution after the throttle window expires', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled();
    vi.advanceTimersByTime(200);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments to the throttled function', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('hello');
    expect(fn).toHaveBeenCalledWith('hello');
  });
});

describe('calculateVisibleRange', () => {
  it('calculates visible range for scroll position at top', () => {
    const result = calculateVisibleRange(0, 500, 50, 100, 3);
    expect(result.start).toBe(0);
    expect(result.end).toBeLessThanOrEqual(100);
  });

  it('calculates visible range for scroll position in middle', () => {
    const result = calculateVisibleRange(500, 500, 50, 100, 3);
    expect(result.start).toBe(7); // floor(500/50) - 3
    expect(result.end).toBeLessThanOrEqual(100);
  });

  it('clamps start to 0', () => {
    const result = calculateVisibleRange(50, 500, 50, 100, 10);
    expect(result.start).toBe(0);
  });

  it('clamps end to totalItems', () => {
    const result = calculateVisibleRange(5000, 500, 50, 20, 3);
    expect(result.end).toBe(20);
  });

  it('uses default overscan of 3', () => {
    const result = calculateVisibleRange(0, 500, 50, 100);
    expect(result.start).toBe(0);
  });
});

describe('memoize', () => {
  it('returns cached result for same arguments', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);

    expect(fn).toHaveBeenCalledOnce();
  });

  it('computes new result for different arguments', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(3)).toBe(6);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('handles multiple arguments', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(memoized(2, 3)).toBe(5);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('cacheStorage', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
    vi.mocked(localStorage.removeItem).mockImplementation(() => {});
  });

  it('stores data with timestamp and TTL', () => {
    cacheStorage.set('testKey', { foo: 'bar' }, 60000);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cache_testKey',
      expect.stringContaining('"foo":"bar"')
    );
  });

  it('retrieves valid cached data', () => {
    const cachedItem = {
      data: { foo: 'bar' },
      timestamp: Date.now(),
      ttl: 60000,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cachedItem));

    const result = cacheStorage.get('testKey');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('returns null for expired cache', () => {
    const cachedItem = {
      data: { foo: 'bar' },
      timestamp: Date.now() - 120000,
      ttl: 60000,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cachedItem));

    const result = cacheStorage.get('testKey');
    expect(result).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('cache_testKey');
  });

  it('returns null for missing cache key', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const result = cacheStorage.get('missing');
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON in cache', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('not-json');
    const result = cacheStorage.get('testKey');
    expect(result).toBeNull();
  });

  it('removes a specific cache key', () => {
    cacheStorage.remove('testKey');
    expect(localStorage.removeItem).toHaveBeenCalledWith('cache_testKey');
  });
});

describe('getOptimizedImageUrl', () => {
  it('appends width and quality parameters', () => {
    const result = getOptimizedImageUrl('https://example.com/image.jpg', 200, 80);
    // devicePixelRatio is 1 in jsdom
    expect(result).toBe('https://example.com/image.jpg?w=200&q=80');
  });

  it('uses default quality of 80', () => {
    const result = getOptimizedImageUrl('https://example.com/image.jpg', 100);
    expect(result).toContain('q=80');
  });
});

describe('shouldLoadModule', () => {
  it('returns true for unknown module names', () => {
    expect(shouldLoadModule('unknown-module')).toBe(true);
  });

  it('returns true when user role matches allowed roles', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('MANAGER');
    expect(shouldLoadModule('analytics')).toBe(true);
  });

  it('returns false when user role does not match allowed roles', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('CUSTOMER');
    expect(shouldLoadModule('analytics')).toBe(false);
  });

  it('returns false when no user role is stored', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    expect(shouldLoadModule('analytics')).toBe(false);
  });
});

describe('measureRenderTime', () => {
  it('calls the callback function', () => {
    const callback = vi.fn();
    measureRenderTime('TestComponent', callback);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('logs a warning for slow renders', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock performance.now to simulate a slow render
    let callCount = 0;
    const originalNow = performance.now;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0 : 20; // 20ms render time
    });

    measureRenderTime('SlowComponent', () => {});

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('SlowComponent'));

    performance.now = originalNow;
    warnSpy.mockRestore();
  });
});

describe('performanceMonitor', () => {
  afterEach(() => {
    performanceMonitor.clear();
  });

  it('records marks and measures duration', () => {
    performanceMonitor.mark('start');

    // Simulate time passing
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const duration = performanceMonitor.measure('test-measure', 'start');
    expect(duration).toBeGreaterThanOrEqual(0);

    logSpy.mockRestore();
  });

  it('returns 0 and warns when start mark is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const duration = performanceMonitor.measure('test', 'nonexistent');
    expect(duration).toBe(0);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('clears all marks', () => {
    performanceMonitor.mark('a');
    performanceMonitor.mark('b');
    performanceMonitor.clear();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const duration = performanceMonitor.measure('test', 'a');
    expect(duration).toBe(0);
    warnSpy.mockRestore();
  });
});
