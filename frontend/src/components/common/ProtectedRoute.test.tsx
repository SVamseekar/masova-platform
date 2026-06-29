import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, type PreloadedState } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { RootState } from '../../store/store';
import authReducer from '../../store/slices/authSlice';

import {
  mockAuthState,
  mockCustomerAuthState,
  mockUnauthenticatedState,
} from '@/test/fixtures';
import { ProtectedRoute } from './ProtectedRoute';

function renderProtectedRoute(
  path: string,
  element: ReactNode,
  preloadedState?: PreloadedState<RootState>
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedState as { auth: RootState['auth'] } | undefined,
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path="/staff-login" element={<div>Staff Login</div>} />
          <Route path="/customer-login" element={<div>Customer Login</div>} />
          <Route path="/pos" element={element} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
    vi.mocked(localStorage.clear).mockImplementation(() => {});
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {});
    vi.mocked(sessionStorage.clear).mockImplementation(() => {});
  });

  it('renders children when user is authenticated and no role restrictions', () => {
    renderProtectedRoute(
      '/dashboard',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      mockAuthState
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to staff-login when not authenticated', () => {
    renderProtectedRoute(
      '/manager',
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      mockUnauthenticatedState
    );

    expect(screen.getByText('Staff Login')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when user has an allowed role', () => {
    renderProtectedRoute(
      '/manager',
      <ProtectedRoute allowedRoles={['MANAGER']}>
        <div>Manager only content</div>
      </ProtectedRoute>,
      mockAuthState
    );

    expect(screen.getByText('Manager only content')).toBeInTheDocument();
  });

  it('redirects when user role is not in allowedRoles', () => {
    renderProtectedRoute(
      '/manager',
      <ProtectedRoute allowedRoles={['MANAGER']}>
        <div>Manager only content</div>
      </ProtectedRoute>,
      mockCustomerAuthState
    );

    expect(screen.getByText('Staff Login')).toBeInTheDocument();
    expect(screen.queryByText('Manager only content')).not.toBeInTheDocument();
  });

  it('does not require auth when requireAuth is false', () => {
    renderProtectedRoute(
      '/public',
      <ProtectedRoute requireAuth={false}>
        <div>Public content</div>
      </ProtectedRoute>,
      mockUnauthenticatedState
    );

    expect(screen.getByText('Public content')).toBeInTheDocument();
  });

  it('allows KIOSK users to access POS routes', () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) =>
      key === 'masova_kioskMode' ? 'true' : null
    );

    renderProtectedRoute(
      '/pos',
      <ProtectedRoute>
        <div>POS content</div>
      </ProtectedRoute>,
      {
        auth: {
          isAuthenticated: true,
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: {
            id: 'kiosk-1',
            email: 'kiosk@test.com',
            name: 'Kiosk Terminal',
            type: 'KIOSK',
            isActive: true,
            createdAt: '2026-01-01T00:00:00Z',
          },
          loading: false,
          error: null,
          lastLoginAttempt: null,
        },
      }
    );

    expect(screen.getByText('POS content')).toBeInTheDocument();
  });
});