import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureStorage, SessionManager } from '../utils/security';

/**
 * Secure authentication hook with session management
 * Phase 14: Security Hardening - Authentication security
 */

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
}

interface UseSecureAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const SESSION_TIMEOUT_MINUTES = 30;
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useSecureAuth(): UseSecureAuthReturn {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const [sessionManager] = useState(() => new SessionManager(SESSION_TIMEOUT_MINUTES));

  /**
   * Check if user is authenticated
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = secureStorage.getItem('auth_token');
      if (!token) {
        setState((prev) => ({ ...prev, isAuthenticated: false, loading: false }));
        return false;
      }

      // Validate token with backend
      const response = await fetch('/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });
        sessionManager.start();
        return true;
      } else {
        secureStorage.removeItem('auth_token');
        secureStorage.removeItem('refresh_token');
        setState((prev) => ({ ...prev, isAuthenticated: false, loading: false }));
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        loading: false,
        error: 'Authentication check failed',
      }));
      return false;
    }
  }, [sessionManager]);

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();

        // Store tokens securely
        secureStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          secureStorage.setItem('refresh_token', data.refreshToken);
        }

        setState({
          isAuthenticated: true,
          user: data.user,
          loading: false,
          error: null,
        });

        sessionManager.start();

        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error: any) {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error.message || 'Login failed',
        });
        throw error;
      }
    },
    [navigate, sessionManager]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = secureStorage.getItem('auth_token');
      if (token) {
        // Notify backend
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear session regardless of backend response
      secureStorage.clear();
      sessionManager.stop();
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      navigate('/login');
    }
  }, [navigate, sessionManager]);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = secureStorage.getItem('refresh_token');
      if (!refreshToken) {
        await logout();
        return;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await logout();
        return;
      }

      const data = await response.json();
      secureStorage.setItem('auth_token', data.accessToken);
      if (data.refreshToken) {
        secureStorage.setItem('refresh_token', data.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [logout]);

  /**
   * Set up token refresh interval
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      const intervalId = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [state.isAuthenticated, refreshToken]);

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      sessionManager.stop();
    };
  }, [sessionManager]);

  return {
    ...state,
    login,
    logout,
    refreshToken,
    checkAuth,
  };
}
