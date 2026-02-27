import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the config module before importing axios instance
vi.mock('../config/api.config', () => ({
  default: {
    BASE_URL: 'http://localhost:8080/api',
    TIMEOUT: 30000,
    USER_SERVICE_URL: 'http://localhost:8080/api/users',
  },
}));

describe('axios instance', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  it('module can be imported without errors', async () => {
    const module = await import('./axios');
    expect(module.default).toBeDefined();
  });

  it('creates an instance with default config', async () => {
    const module = await import('./axios');
    const instance = module.default;

    expect(instance.defaults.headers['Content-Type']).toBe('application/json');
  });
});
