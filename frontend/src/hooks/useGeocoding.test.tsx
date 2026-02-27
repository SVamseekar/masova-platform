import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeocoding, buildAddressString } from './useGeocoding';

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: {} } });

describe('buildAddressString', () => {
  it('joins address components with commas and appends India', () => {
    const result = buildAddressString('123 Main St', 'Hyderabad', 'Telangana', '500001');
    expect(result).toBe('123 Main St, Hyderabad, Telangana, 500001, India');
  });

  it('skips empty parts', () => {
    const result = buildAddressString('123 Main St', '', 'Telangana');
    expect(result).toBe('123 Main St, Telangana, India');
  });

  it('skips undefined parts', () => {
    const result = buildAddressString(undefined, 'Hyderabad');
    expect(result).toBe('Hyderabad, India');
  });

  it('returns only India when all parts are empty', () => {
    const result = buildAddressString();
    expect(result).toBe('India');
  });
});

describe('useGeocoding', () => {
  const mockResponse = [
    {
      lat: '17.385',
      lon: '78.4867',
      display_name: 'Hyderabad, Telangana, India',
      address: {
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
      },
    },
  ];

  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
    vi.mocked(localStorage.removeItem).mockImplementation(() => {});

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGeocoding());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toBeNull();
  });

  it('returns error for address shorter than 3 characters', async () => {
    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: any;
    await act(async () => {
      geocodeResult = await result.current.geocode('ab');
    });

    expect(geocodeResult).toBeNull();
    expect(result.current.error).toBe('Address too short');
  });

  it('returns null for empty address', async () => {
    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: any;
    await act(async () => {
      geocodeResult = await result.current.geocode('');
    });

    expect(geocodeResult).toBeNull();
  });

  it('returns cached result if available', async () => {
    const cachedData = {
      result: {
        latitude: 17.385,
        longitude: 78.4867,
        displayName: 'Cached Location',
      },
      timestamp: Date.now(),
    };

    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key.startsWith('geocoding_cache_')) {
        return JSON.stringify(cachedData);
      }
      return null;
    });

    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: any;
    await act(async () => {
      geocodeResult = await result.current.geocode('Hyderabad');
    });

    expect(geocodeResult).toEqual(cachedData.result);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches geocoding data when no cache available', async () => {
    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: any;
    await act(async () => {
      geocodeResult = await result.current.geocode('Hyderabad, India');
    });

    expect(fetch).toHaveBeenCalled();
    expect(geocodeResult).not.toBeNull();
    expect(geocodeResult.latitude).toBe(17.385);
    expect(geocodeResult.longitude).toBe(78.4867);
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: any;
    await act(async () => {
      geocodeResult = await result.current.geocode('Hyderabad, India');
    });

    expect(geocodeResult).toBeNull();
    expect(result.current.error).toContain('500');
  });

  it('handles empty API response (address not found)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: any;
    await act(async () => {
      geocodeResult = await result.current.geocode('Nonexistent Address XYZ');
    });

    expect(geocodeResult).toBeNull();
    expect(result.current.error).toContain('Address not found');
  });
});
