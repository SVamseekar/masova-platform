import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import { logout, refreshTokenSuccess } from '../slices/authSlice';
import { authSessionIdentity, isCurrentAuthSession, redirectToSignIn } from '../../utils/security';

/**
 * Base query with token injection, store context and serialized token refresh.
 * Authentication endpoints return their own failures inline. Only an expired
 * protected session enters recovery; temporary refresh failures retain identity.
 */
const mutex = new Mutex();
const publicAuthPaths = new Set(['/auth/login', '/auth/register', '/auth/google', '/auth/refresh', '/auth/validate-pin', '/users/kiosk/auto-login']);

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const requestPath = (typeof args === 'string' ? args : args.url).split('?')[0];
  const publicAuth = publicAuthPaths.has(requestPath);
  if (!publicAuth) await mutex.waitForUnlock();

  const baseQuery = fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;
      // Public authentication must not inherit a previous account's bearer/context.
      if (!publicAuth) {
        if (token) headers.set('Authorization', 'Bearer ' + token);
        if (user) {
          headers.set('X-User-Id', user.id);
          headers.set('X-User-Type', user.type);
          if (user.storeId) headers.set('X-User-Store-Id', user.storeId);
        }
        if (selectedStoreId) headers.set('X-Selected-Store-Id', selectedStoreId);
      }
      return headers;
    },
  });

  const sessionAtRequest = authSessionIdentity((api.getState() as RootState).auth);
  const sessionChangedError = (): { error: FetchBaseQueryError } => ({
    error: { status: 'CUSTOM_ERROR', error: 'Session changed during the request. Please retry in your current workspace.' },
  });
  let result = await baseQuery(args, api, extraOptions);
  if (publicAuth) return result;
  const currentAuth = (api.getState() as RootState).auth;
  if (sessionAtRequest.refreshToken !== currentAuth.refreshToken || sessionAtRequest.userId !== currentAuth.user?.id) return sessionChangedError();
  if (result.error?.status !== 401) return result;

  function expireSession() {
    api.dispatch(logout());
    if (typeof window !== 'undefined') redirectToSignIn();
  }

  if (!mutex.isLocked()) {
    const release = await mutex.acquire();
    try {
      const state = api.getState() as RootState;
      if (sessionAtRequest.refreshToken !== state.auth.refreshToken || sessionAtRequest.userId !== state.auth.user?.id) return sessionChangedError();
      if (state.auth.accessToken && state.auth.accessToken !== sessionAtRequest.accessToken) {
        return await baseQuery(args, api, extraOptions);
      }
      if (!state.auth.refreshToken) {
        expireSession();
        return result;
      }
      const recoveringSession = authSessionIdentity(state.auth);
      const refreshed = await baseQuery({
        url: '/auth/refresh', method: 'POST', body: { refreshToken: state.auth.refreshToken },
      }, api, extraOptions);
      if (!isCurrentAuthSession(recoveringSession, (api.getState() as RootState).auth)) return sessionChangedError();
      const accessToken = (refreshed.data as { accessToken?: unknown } | undefined)?.accessToken;
      if (typeof accessToken === 'string' && accessToken.length > 0) {
        api.dispatch(refreshTokenSuccess(accessToken));
        result = await baseQuery(args, api, extraOptions);
      } else if (refreshed.error?.status === 401 || refreshed.error?.status === 403) {
        expireSession();
      } else {
        // Network/provider errors are not evidence that credentials expired.
        return refreshed.error ? { error: refreshed.error } : {
          error: { status: 'CUSTOM_ERROR', error: 'Session refresh returned no access token.' },
        };
      }
    } finally {
      release();
    }
  } else {
    await mutex.waitForUnlock();
    const auth = (api.getState() as RootState).auth;
    if (sessionAtRequest.refreshToken !== auth.refreshToken || sessionAtRequest.userId !== auth.user?.id) return sessionChangedError();
    if (auth.accessToken) result = await baseQuery(args, api, extraOptions);
  }
  return result;
};

export default baseQueryWithAuth;
