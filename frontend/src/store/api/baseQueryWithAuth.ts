import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import { logout } from '../slices/authSlice';

/**
 * Professional-grade baseQuery with automatic error handling
 *
 * Features:
 * - Automatic 401 error handling (logout & redirect)
 * - Token injection in headers
 * - User context headers
 * - Proper error propagation
 */
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
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

  // Handle 401 Unauthorized errors
  if (result.error && result.error.status === 401) {
    console.warn('[Auth] 401 Unauthorized - Token expired or invalid, logging out');

    // Dispatch logout action to clear state and storage
    api.dispatch(logout());

    // Redirect to login page
    // Note: In a real app, you might want to store the attempted URL
    // and redirect back after login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return result;
};

export default baseQueryWithAuth;
