import { useState, useCallback } from 'react';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
}

interface UseGeocodingReturn {
  geocode: (address: string) => Promise<GeocodingResult | null>;
  loading: boolean;
  error: string | null;
  lastResult: GeocodingResult | null;
}

const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const CACHE_KEY_PREFIX = 'geocoding_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT_MS = 1000; // Nominatim requires 1 second between requests

// Global rate limiting
let lastRequestTime = 0;

/**
 * Custom hook for geocoding addresses using Nominatim (OpenStreetMap)
 * Features:
 * - Rate limiting (respects Nominatim 1 req/sec limit)
 * - Caching (localStorage with 7-day expiry)
 * - Error handling
 * - Free, no API key required
 */
export const useGeocoding = (): UseGeocodingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GeocodingResult | null>(null);

  /**
   * Get cached result if available and not expired
   */
  const getCachedResult = (address: string): GeocodingResult | null => {
    try {
      const cacheKey = CACHE_KEY_PREFIX + address.toLowerCase().trim();
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const { result, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return result;
    } catch (err) {
      console.warn('Cache read error:', err);
      return null;
    }
  };

  /**
   * Cache geocoding result
   */
  const cacheResult = (address: string, result: GeocodingResult): void => {
    try {
      const cacheKey = CACHE_KEY_PREFIX + address.toLowerCase().trim();
      localStorage.setItem(cacheKey, JSON.stringify({
        result,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache write error:', err);
    }
  };

  /**
   * Respect rate limiting - wait if needed
   */
  const waitForRateLimit = async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
  };

  /**
   * Geocode an address to coordinates
   */
  const geocode = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    if (!address || address.trim().length < 3) {
      setError('Address too short');
      return null;
    }

    const trimmedAddress = address.trim();

    // Check cache first
    const cached = getCachedResult(trimmedAddress);
    if (cached) {
      console.log('📍 Geocoding: Using cached result for', trimmedAddress);
      setLastResult(cached);
      setError(null);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      // Respect rate limiting
      await waitForRateLimit();

      // Call Nominatim API
      const url = `${NOMINATIM_URL}/search?` + new URLSearchParams({
        format: 'json',
        q: trimmedAddress,
        limit: '1',
        addressdetails: '1',
        countrycodes: 'in', // Restrict to India for better results
      });

      console.log('📍 Geocoding:', trimmedAddress);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MaSoVa-Restaurant-Management-System/1.0' // Nominatim requires User-Agent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error('Address not found. Please check the spelling or try a more specific address.');
      }

      const location = data[0];
      const result: GeocodingResult = {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        displayName: location.display_name,
        city: location.address?.city || location.address?.town || location.address?.village,
        state: location.address?.state,
        country: location.address?.country,
      };

      console.log('✅ Geocoding successful:', result);

      // Cache the result
      cacheResult(trimmedAddress, result);

      setLastResult(result);
      setError(null);
      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to geocode address';
      console.error('❌ Geocoding error:', errorMessage);
      setError(errorMessage);
      setLastResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    geocode,
    loading,
    error,
    lastResult
  };
};

/**
 * Helper function to build address string from components
 */
export const buildAddressString = (
  street?: string,
  city?: string,
  state?: string,
  pincode?: string
): string => {
  const parts = [street, city, state, pincode, 'India']
    .filter(part => part && part.trim().length > 0);
  return parts.join(', ');
};
