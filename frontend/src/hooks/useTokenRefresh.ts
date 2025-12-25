import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { refreshTokenSuccess, logout } from '../store/slices/authSlice';
import API_CONFIG from '../config/api.config';

/**
 * Hook for proactive token refresh (like Google, Amazon, etc.)
 *
 * Automatically refreshes the access token before it expires to prevent 401 errors.
 *
 * Features:
 * - Decodes JWT to get expiration time
 * - Schedules automatic refresh 5 minutes before expiration
 * - Handles refresh token expiration gracefully
 * - Cleans up timers on component unmount
 */
export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const { accessToken, refreshToken, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Decode JWT token to extract expiration time
   * Note: This only decodes the payload, doesn't validate the signature
   */
  const decodeToken = (token: string): { exp?: number } | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[TokenRefresh] Failed to decode token:', error);
      return null;
    }
  };

  /**
   * Perform token refresh
   */
  const performTokenRefresh = useCallback(async () => {
    if (!refreshToken) {
      console.warn('[TokenRefresh] No refresh token available');
      // Don't logout here - let the baseQueryWithAuth handle it on actual 401
      return;
    }

    try {
      console.log('[TokenRefresh] Proactively refreshing token...');
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[TokenRefresh] Token refreshed successfully');
        dispatch(refreshTokenSuccess(data.accessToken));
      } else if (response.status === 401 || response.status === 403) {
        // Only logout for auth failures (invalid refresh token)
        console.error('[TokenRefresh] Refresh token invalid/expired, logging out');
        dispatch(logout());

        // Redirect to login with return URL
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          if (currentPath !== '/login' && currentPath !== '/staff-login' && currentPath !== '/customer-login') {
            sessionStorage.setItem('returnUrl', currentPath);
          }
          window.location.href = '/customer-login';
        }
      } else {
        // For network/server errors, don't logout - just reschedule
        console.warn(`[TokenRefresh] Token refresh failed with status ${response.status}, will retry on next request`);
        // The baseQueryWithAuth will handle the actual refresh on next API call
      }
    } catch (error) {
      // Network errors - don't logout, let baseQueryWithAuth handle it
      console.warn('[TokenRefresh] Token refresh network error:', error);
      // The token will be refreshed on the next API call via baseQueryWithAuth
    }
  }, [refreshToken, dispatch]);

  /**
   * Schedule token refresh based on expiration time
   */
  const scheduleTokenRefresh = useCallback((token: string) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      console.warn('[TokenRefresh] Token has no expiration time - skipping proactive refresh');
      return;
    }

    // Calculate time until expiration
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    // FIX: Check if token is already expired
    if (timeUntilExpiration <= 0) {
      console.warn('[TokenRefresh] Token is already expired, refreshing immediately');
      performTokenRefresh();
      return;
    }

    // Log token expiration details (disabled in production)
    // const expiresInMinutes = Math.round(timeUntilExpiration / 1000 / 60);
    // console.log(`[TokenRefresh] Token expires in ${expiresInMinutes} minutes (at ${new Date(expirationTime).toLocaleTimeString()})`);

    // Refresh 5 minutes (300000ms) before expiration
    const refreshBuffer = 5 * 60 * 1000;
    const timeUntilRefresh = Math.max(0, timeUntilExpiration - refreshBuffer); // FIX: Prevent negative values

    if (timeUntilRefresh > 0) {
      // const refreshInMinutes = Math.round(timeUntilRefresh / 1000 / 60);
      // console.log(
      //   `[TokenRefresh] Proactive refresh scheduled in ${refreshInMinutes} minutes (at ${new Date(Date.now() + timeUntilRefresh).toLocaleTimeString()})`
      // );
      refreshTimerRef.current = setTimeout(() => {
        performTokenRefresh();
      }, timeUntilRefresh);
    } else if (timeUntilExpiration > 60000) {
      // Token expires in more than 1 minute but less than refresh buffer
      // Schedule refresh for 1 minute before expiration
      const oneMinuteBuffer = 60000;
      const safeRefreshTime = timeUntilExpiration - oneMinuteBuffer;
      console.log('[TokenRefresh] Token expires soon, scheduling refresh for 1 minute before expiration');
      refreshTimerRef.current = setTimeout(() => {
        performTokenRefresh();
      }, Math.max(safeRefreshTime, 0));
    } else {
      // Token expires very soon (less than 1 minute) - refresh immediately
      console.warn('[TokenRefresh] Token expires in less than 1 minute, refreshing immediately');
      performTokenRefresh();
    }
  }, [performTokenRefresh]);

  // Set up token refresh when user logs in or token changes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      scheduleTokenRefresh(accessToken);
    }

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [accessToken, isAuthenticated, scheduleTokenRefresh]);

  // Also refresh token when the page becomes visible again (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && accessToken) {
        const decoded = decodeToken(accessToken);
        if (decoded && decoded.exp) {
          const expirationTime = decoded.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiration = expirationTime - currentTime;

          // If token expires in less than 10 minutes, refresh it
          if (timeUntilExpiration < 10 * 60 * 1000) {
            console.log('[TokenRefresh] Token expires soon (page visible), refreshing...');
            performTokenRefresh();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [accessToken, isAuthenticated, performTokenRefresh]);
};
