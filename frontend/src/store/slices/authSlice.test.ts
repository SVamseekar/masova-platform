import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies before importing the slice
vi.mock('../../contexts/PageStoreContext', () => ({
  clearAllStoreContexts: vi.fn(),
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (state = {}) => state,
    middleware: () => (next: any) => (action: any) => next(action),
    endpoints: {
      login: {
        matchPending: () => false,
        matchFulfilled: () => false,
        matchRejected: () => false,
      },
      register: {
        matchFulfilled: () => false,
      },
      logout: {
        matchFulfilled: () => false,
      },
    },
  },
}));

import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  refreshTokenSuccess,
  updateUserProfile,
  clearError,
  setLoading,
  selectAuth,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from './authSlice';

describe('authSlice', () => {
  const mockUser = {
    id: '1',
    type: 'CUSTOMER' as const,
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-0123',
    isActive: true,
  };

  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
    vi.mocked(localStorage.removeItem).mockImplementation(() => {});
    vi.mocked(sessionStorage.getItem).mockReturnValue(null);
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {});
    vi.mocked(sessionStorage.removeItem).mockImplementation(() => {});
  });

  const unauthenticatedState = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: false,
    error: null,
    lastLoginAttempt: null,
  };

  describe('loginStart', () => {
    it('sets loading to true and clears error', () => {
      const stateWithError = { ...unauthenticatedState, error: 'Previous error' };
      const state = authReducer(stateWithError, loginStart());

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.lastLoginAttempt).toBeDefined();
    });
  });

  describe('loginSuccess', () => {
    it('sets authenticated state with user and tokens', () => {
      const state = authReducer(
        unauthenticatedState,
        loginSuccess({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: mockUser,
          rememberMe: true,
        })
      );

      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('stores tokens in localStorage when rememberMe is true', () => {
      authReducer(
        unauthenticatedState,
        loginSuccess({
          accessToken: 'token',
          refreshToken: 'refresh',
          user: mockUser,
          rememberMe: true,
        })
      );

      expect(localStorage.setItem).toHaveBeenCalledWith('auth_accessToken', 'token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_refreshToken', 'refresh');
    });

    it('stores tokens in sessionStorage when rememberMe is false', () => {
      authReducer(
        unauthenticatedState,
        loginSuccess({
          accessToken: 'token',
          refreshToken: 'refresh',
          user: mockUser,
          rememberMe: false,
        })
      );

      expect(sessionStorage.setItem).toHaveBeenCalledWith('auth_accessToken', 'token');
    });

    it('defaults rememberMe to true', () => {
      authReducer(
        unauthenticatedState,
        loginSuccess({
          accessToken: 'token',
          refreshToken: 'refresh',
          user: mockUser,
        })
      );

      expect(localStorage.setItem).toHaveBeenCalledWith('auth_accessToken', 'token');
    });
  });

  describe('loginFailure', () => {
    it('resets auth state and sets error', () => {
      const authenticatedState = {
        ...unauthenticatedState,
        isAuthenticated: true,
        accessToken: 'token',
        user: mockUser,
      };

      const state = authReducer(authenticatedState, loginFailure('Invalid credentials'));

      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.error).toBe('Invalid credentials');
      expect(state.loading).toBe(false);
    });

    it('clears storage', () => {
      authReducer(unauthenticatedState, loginFailure('Error'));

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('logout', () => {
    it('resets all auth state', () => {
      const authenticatedState = {
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
        loading: false,
        error: null,
        lastLoginAttempt: '2024-01-01',
      };

      const state = authReducer(authenticatedState, logout());

      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('clears all auth storage including legacy keys', () => {
      authReducer(unauthenticatedState, logout());

      expect(localStorage.removeItem).toHaveBeenCalled();
      expect(sessionStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('refreshTokenSuccess', () => {
    it('updates the access token', () => {
      const authenticatedState = {
        ...unauthenticatedState,
        isAuthenticated: true,
        accessToken: 'old-token',
      };

      const state = authReducer(authenticatedState, refreshTokenSuccess('new-token'));
      expect(state.accessToken).toBe('new-token');
    });
  });

  describe('updateUserProfile', () => {
    it('merges partial user update', () => {
      const authenticatedState = {
        ...unauthenticatedState,
        isAuthenticated: true,
        user: mockUser,
      };

      const state = authReducer(
        authenticatedState,
        updateUserProfile({ name: 'Updated Name', phone: '999-0000' })
      );

      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.phone).toBe('999-0000');
      expect(state.user?.email).toBe(mockUser.email); // unchanged
    });

    it('does nothing when user is null', () => {
      const state = authReducer(
        unauthenticatedState,
        updateUserProfile({ name: 'Test' })
      );

      expect(state.user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error field', () => {
      const stateWithError = { ...unauthenticatedState, error: 'Some error' };
      const state = authReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('sets the loading field', () => {
      const state = authReducer(unauthenticatedState, setLoading(true));
      expect(state.loading).toBe(true);
    });
  });

  describe('selectors', () => {
    const rootState = {
      auth: {
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
        loading: false,
        error: 'some error',
        lastLoginAttempt: null,
      },
    };

    it('selectAuth returns full auth state', () => {
      expect(selectAuth(rootState)).toEqual(rootState.auth);
    });

    it('selectCurrentUser returns user', () => {
      expect(selectCurrentUser(rootState)).toEqual(mockUser);
    });

    it('selectIsAuthenticated returns true when authenticated', () => {
      expect(selectIsAuthenticated(rootState)).toBe(true);
    });

    it('selectAuthLoading returns loading state', () => {
      expect(selectAuthLoading(rootState)).toBe(false);
    });

    it('selectAuthError returns error', () => {
      expect(selectAuthError(rootState)).toBe('some error');
    });
  });
});
