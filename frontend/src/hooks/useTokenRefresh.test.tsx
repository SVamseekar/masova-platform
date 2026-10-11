import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the config module
vi.mock('../config/api.config', () => ({
  default: {
    BASE_URL: 'http://localhost:8080/api',
  },
}));

// Mock authSlice actions
const mockLogout = vi.fn(() => ({ type: 'auth/logout' }));
const mockRefreshTokenSuccess = vi.fn((token: string) => ({
  type: 'auth/refreshTokenSuccess',
  payload: token,
}));

vi.mock('../store/slices/authSlice', () => ({
  refreshTokenSuccess: (token: string) => mockRefreshTokenSuccess(token),
  logout: () => mockLogout(),
}));

import { useTokenRefresh } from './useTokenRefresh';
import { redirectToSignIn } from '../utils/security';

vi.mock('../utils/security', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/security')>(), redirectToSignIn: vi.fn(),
}));

interface MockAuthState {
  isAuthenticated: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
}

function createMockStore(authState: MockAuthState) {
  return configureStore({
    reducer: {
      auth: (_state = authState, _action: unknown) => authState,
    },
  });
}

function createWrapper(store: ReturnType<typeof createMockStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useTokenRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLogout.mockClear();
    mockRefreshTokenSuccess.mockClear();
    vi.mocked(redirectToSignIn).mockClear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not schedule refresh when not authenticated', () => {
    const store = createMockStore({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });

    renderHook(() => useTokenRefresh(), {
      wrapper: createWrapper(store),
    });

    // No fetch calls should be made
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses role-aware session recovery when proactive refresh expires', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1 }));
    const store = createMockStore({ accessToken: `header.${payload}.signature`, refreshToken: 'expired-test-refresh', isAuthenticated: true });
    renderHook(() => useTokenRefresh(), { wrapper: createWrapper(store) });
    await vi.advanceTimersByTimeAsync(0);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(redirectToSignIn).toHaveBeenCalledTimes(1);
  });

  it.each([200, 401])('ignores stale proactive refresh response %s after another account signs in', async status => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1 }));
    const auth = { accessToken: `header.${payload}.signature`, refreshToken: 'refresh-A', isAuthenticated: true };
    const store = createMockStore(auth);
    renderHook(() => useTokenRefresh(), { wrapper: createWrapper(store) });
    auth.accessToken = 'account-B';
    auth.refreshToken = 'refresh-B';
    finish({ ok: status === 200, status, json: async () => ({ accessToken: 'refreshed-A' }) } as Response);
    await vi.advanceTimersByTimeAsync(0);
    expect(mockRefreshTokenSuccess).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
    expect(redirectToSignIn).not.toHaveBeenCalled();
  });

  it('adds visibilitychange event listener when authenticated', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    // Create a valid JWT with exp claim 30 minutes from now
    const exp = Math.floor(Date.now() / 1000) + 30 * 60;
    const payload = btoa(JSON.stringify({ exp }));
    const token = `header.${payload}.signature`;

    const store = createMockStore({
      accessToken: token,
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });

    renderHook(() => useTokenRefresh(), {
      wrapper: createWrapper(store),
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it('cleans up timers and event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const exp = Math.floor(Date.now() / 1000) + 30 * 60;
    const payload = btoa(JSON.stringify({ exp }));
    const token = `header.${payload}.signature`;

    const store = createMockStore({
      accessToken: token,
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });

    const { unmount } = renderHook(() => useTokenRefresh(), {
      wrapper: createWrapper(store),
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
