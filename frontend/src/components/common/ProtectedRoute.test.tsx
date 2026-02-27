import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { mockAuthState, mockCustomerAuthState, mockUnauthenticatedState } from '@/test/fixtures';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders children when user is authenticated and no role restrictions', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      {
        preloadedState: mockAuthState,
        useMemoryRouter: true,
      }
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to staff-login when not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      {
        preloadedState: mockUnauthenticatedState,
        useMemoryRouter: true,
        initialEntries: ['/manager'],
      }
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when user has an allowed role', () => {
    renderWithProviders(
      <ProtectedRoute allowedRoles={['MANAGER']}>
        <div>Manager only content</div>
      </ProtectedRoute>,
      {
        preloadedState: mockAuthState,
        useMemoryRouter: true,
      }
    );

    expect(screen.getByText('Manager only content')).toBeInTheDocument();
  });

  it('redirects when user role is not in allowedRoles', () => {
    renderWithProviders(
      <ProtectedRoute allowedRoles={['MANAGER']}>
        <div>Manager only content</div>
      </ProtectedRoute>,
      {
        preloadedState: mockCustomerAuthState,
        useMemoryRouter: true,
      }
    );

    expect(screen.queryByText('Manager only content')).not.toBeInTheDocument();
  });

  it('does not require auth when requireAuth is false', () => {
    renderWithProviders(
      <ProtectedRoute requireAuth={false}>
        <div>Public content</div>
      </ProtectedRoute>,
      {
        preloadedState: mockUnauthenticatedState,
        useMemoryRouter: true,
      }
    );

    expect(screen.getByText('Public content')).toBeInTheDocument();
  });

  it('allows KIOSK users to access POS routes', () => {
    localStorage.setItem('masova_kioskMode', 'true');

    renderWithProviders(
      <ProtectedRoute>
        <div>POS content</div>
      </ProtectedRoute>,
      {
        preloadedState: {
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
        } as any,
        useMemoryRouter: true,
        initialEntries: ['/pos'],
      }
    );

    expect(screen.getByText('POS content')).toBeInTheDocument();
  });
});
