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

function createMockStore(authState: any) {
  return configureStore({
    reducer: {
      auth: (_state = authState, _action: any) => authState,
    },
  });
}

function createWrapper(store: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useTokenRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLogout.mockClear();
    mockRefreshTokenSuccess.mockClear();
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
