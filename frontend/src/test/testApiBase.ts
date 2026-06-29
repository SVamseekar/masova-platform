/**
 * Single source of truth for MSW handler URLs and API integration tests.
 * Must match api.config.ts gateway URL used by RTK Query in CI.
 */
export const TEST_API_BASE =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api';

/** Gateway root without trailing slash — e.g. http://localhost:8080/api */
export function apiUrl(path: string): string {
  const base = TEST_API_BASE.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}