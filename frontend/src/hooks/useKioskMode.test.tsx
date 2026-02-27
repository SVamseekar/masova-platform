import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the config module
vi.mock('../config/api.config', () => ({
  default: {
    BASE_URL: 'http://localhost:8080/api',
  },
}));

// Mock authSlice
vi.mock('../store/slices/authSlice', () => ({
  loginSuccess: (payload: any) => ({ type: 'auth/loginSuccess', payload }),
}));

import { useKioskMode } from './useKioskMode';

function createMockStore() {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false }, _action: any) => state,
    },
  });
}

function createWrapper(store: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useKioskMode', () => {
  let storageData: Record<string, string>;

  beforeEach(() => {
    storageData = {};

    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      return storageData[key] ?? null;
    });

    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      storageData[key] = value;
    });

    vi.mocked(localStorage.removeItem).mockImplementation((key: string) => {
      delete storageData[key];
    });

    global.fetch = vi.fn();

    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with kiosk mode disabled when no flag present', async () => {
    const store = createMockStore();

    const { result } = renderHook(() => useKioskMode(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isKioskMode).toBe(false);
    expect(result.current.kioskToken).toBeNull();
    expect(result.current.terminalId).toBeNull();
  });

  it('enables kiosk mode and stores tokens', () => {
    const store = createMockStore();

    const { result } = renderHook(() => useKioskMode(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.enableKioskMode('access-token', 'refresh-token', 'terminal-1');
    });

    expect(result.current.isKioskMode).toBe(true);
    expect(result.current.kioskToken).toBe('access-token');
    expect(result.current.terminalId).toBe('terminal-1');

    expect(storageData['masova_kioskMode']).toBe('true');
    expect(storageData['masova_kioskToken']).toBe('access-token');
    expect(storageData['masova_terminalId']).toBe('terminal-1');
  });

  it('disables kiosk mode and clears tokens', () => {
    storageData['masova_kioskMode'] = 'true';
    storageData['masova_kioskToken'] = 'token';
    storageData['masova_terminalId'] = 'terminal-1';

    const store = createMockStore();

    const { result } = renderHook(() => useKioskMode(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.disableKioskMode();
    });

    expect(result.current.isKioskMode).toBe(false);
    expect(result.current.kioskToken).toBeNull();
    expect(result.current.terminalId).toBeNull();

    expect(storageData['masova_kioskMode']).toBeUndefined();
    expect(storageData['masova_kioskToken']).toBeUndefined();
  });

  it('disables kiosk mode when token or terminal ID missing', async () => {
    storageData['masova_kioskMode'] = 'true';
    // No token or terminal ID

    const store = createMockStore();

    const { result } = renderHook(() => useKioskMode(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isKioskMode).toBe(false);
  });

  it('returns error property', () => {
    const store = createMockStore();

    const { result } = renderHook(() => useKioskMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.error).toBeNull();
  });
});
