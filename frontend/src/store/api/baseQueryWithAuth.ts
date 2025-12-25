import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import { logout, refreshTokenSuccess } from '../slices/authSlice';

/**
 * Professional-grade baseQuery with automatic token refresh
 *
 * Features (like Google, Amazon, etc.):
 * - Automatic token refresh on 401 errors
 * - Request retry after token refresh
 * - Thread-safe refresh with mutex (prevents multiple simultaneous refresh calls)
 * - Token injection in headers
 * - User context headers
 * - Graceful logout only when refresh token fails
 */

// Mutex to prevent multiple simultaneous refresh token requests
const mutex = new Mutex();

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait until the mutex is available without locking it
  await mutex.waitForUnlock();

  // Base query configuration
  const baseQuery = fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;

      // Add authorization token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add user context headers
      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      // Add selected store for managers/customers
      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  });

  // Execute the base query
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized errors with automatic token refresh
  if (result.error && result.error.status === 401) {
    console.log('[Auth] 401 Unauthorized - Attempting token refresh');

    // Check if we already have a refresh in progress
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const state = api.getState() as RootState;
        const refreshToken = state.auth.refreshToken;

        if (!refreshToken) {
          console.warn('[Auth] No refresh token available - logging out');
          api.dispatch(logout());
          if (typeof window !== 'undefined') {
            // Phase 12: Save current URL before redirecting to login
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== '/login' && currentPath !== '/staff-login' && currentPath !== '/customer-login') {
              sessionStorage.setItem('returnUrl', currentPath);
            }
            window.location.href = '/login';
          }
          return result;
        }

        // Attempt to refresh the token
        console.log('[Auth] Refreshing access token...');
        const refreshResult = await baseQuery(
          {
            url: '/users/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Successfully refreshed token
          const { accessToken } = refreshResult.data as { accessToken: string };
          console.log('[Auth] Token refresh successful - New token received');
          console.log('[Auth] New token preview:', accessToken.substring(0, 30) + '...');

          // Update the access token in the store
          api.dispatch(refreshTokenSuccess(accessToken));

          // Wait a tiny bit to ensure Redux state is updated
          await new Promise(resolve => setTimeout(resolve, 50));

          // Retry the original request with the new token
          console.log('[Auth] Retrying original request with new token');
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh token failed - logout user
          console.error('[Auth] Token refresh failed - Response:', refreshResult.error);
          console.error('[Auth] Refresh token may be expired - logging out');
          api.dispatch(logout());
          if (typeof window !== 'undefined') {
            // Clear all storage to prevent stale token issues
            localStorage.clear();
            sessionStorage.clear();

            // Save current URL before redirecting to login
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== '/login' && currentPath !== '/staff-login' && currentPath !== '/customer-login') {
              sessionStorage.setItem('returnUrl', currentPath);
            }
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('[Auth] Token refresh error:', error);
        console.error('[Auth] Forcing logout due to refresh failure');
        api.dispatch(logout());
        if (typeof window !== 'undefined') {
          // Clear all storage to prevent stale token issues
          localStorage.clear();
          sessionStorage.clear();

          // Save current URL before redirecting to login
          const currentPath = window.location.pathname + window.location.search;
          if (currentPath !== '/login' && currentPath !== '/staff-login' && currentPath !== '/customer-login') {
            sessionStorage.setItem('returnUrl', currentPath);
          }
          window.location.href = '/login';
        }
      } finally {
        // Release the mutex
        release();
      }
    } else {
      // Wait for the mutex to be available, then retry the request
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export default baseQueryWithAuth;
