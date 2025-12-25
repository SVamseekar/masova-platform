import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';
import { authApi } from '../api/authApi';
import { clearAllStoreContexts } from '../../contexts/PageStoreContext';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  lastLoginAttempt: string | null;
}

// ============================================================================
// SIMPLIFIED STORAGE - No multi-user-type keys to prevent pollution
// ============================================================================

/**
 * Professional storage management with single key strategy
 *
 * Key principle: ONE user session at a time, no multiple user type keys
 * - Prevents token pollution
 * - Clear on every logout/login
 * - Simple and predictable
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_accessToken',
  REFRESH_TOKEN: 'auth_refreshToken',
  USER: 'auth_user',
} as const;

const getStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch (error) {
    console.warn('Storage access denied:', error);
    return null;
  }
};

const setStorage = (key: string, value: string, rememberMe: boolean = true): void => {
  try {
    const storage = rememberMe ? localStorage : sessionStorage;
    const oppositeStorage = rememberMe ? sessionStorage : localStorage;

    // Set in preferred storage
    storage.setItem(key, value);
    // Remove from opposite storage
    oppositeStorage.removeItem(key);
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('Storage removal failed:', error);
  }
};

/**
 * Clear ALL auth data from storage
 * Called on logout and before new login to prevent pollution
 */
const clearAllAuthStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      removeStorage(key);
    });

    // NOTE: We do NOT clear returnUrl here anymore. It is now intentionally
    // preserved during logout so users can return to their previous page
    // after logging back in. The returnUrl is only cleared after successful
    // redirect in LoginPage.tsx (line 40).

    // Also clear legacy keys from old multi-user-type system
    const legacyKeys = [
      'accessToken', 'refreshToken', 'user',
      'MANAGER_accessToken', 'MANAGER_refreshToken', 'MANAGER_user',
      'STAFF_accessToken', 'STAFF_refreshToken', 'STAFF_user',
      'DRIVER_accessToken', 'DRIVER_refreshToken', 'DRIVER_user',
      'CUSTOMER_accessToken', 'CUSTOMER_refreshToken', 'CUSTOMER_user',
      'ASSISTANT_MANAGER_accessToken', 'ASSISTANT_MANAGER_refreshToken', 'ASSISTANT_MANAGER_user',
    ];

    legacyKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove legacy key ${key}:`, error);
      }
    });

    // Phase 11: Clear all page-specific store contexts on logout
    clearAllStoreContexts();
  } catch (error) {
    console.warn('Storage cleanup failed:', error);
  }
};

// Load functions - simplified, no multi-user-type complexity
const loadUserFromStorage = (): User | null => {
  try {
    const userStr = getStorage(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const loadAccessTokenFromStorage = (): string | null => {
  return getStorage(STORAGE_KEYS.ACCESS_TOKEN);
};

const loadRefreshTokenFromStorage = (): string | null => {
  return getStorage(STORAGE_KEYS.REFRESH_TOKEN);
};

const initialState: AuthState = {
  isAuthenticated: !!loadAccessTokenFromStorage(),
  accessToken: loadAccessTokenFromStorage(),
  refreshToken: loadRefreshTokenFromStorage(),
  user: loadUserFromStorage(),
  loading: false,
  error: null,
  lastLoginAttempt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
      state.lastLoginAttempt = new Date().toISOString();
    },
    loginSuccess: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: User;
      rememberMe?: boolean;
    }>) => {
      const { accessToken, refreshToken, user, rememberMe = true } = action.payload;

      // ALWAYS clear all storage first to prevent pollution
      clearAllAuthStorage();

      state.isAuthenticated = true;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.loading = false;
      state.error = null;

      // Store with new simplified keys
      setStorage(STORAGE_KEYS.ACCESS_TOKEN, accessToken, rememberMe);
      setStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, rememberMe);
      setStorage(STORAGE_KEYS.USER, JSON.stringify(user), rememberMe);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = action.payload;

      // Clear all auth storage
      clearAllAuthStorage();
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;

      // Clear all auth storage
      clearAllAuthStorage();
    },
    refreshTokenSuccess: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;

      // Preserve existing storage type (localStorage or sessionStorage)
      const existingInLocal = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      setStorage(STORAGE_KEYS.ACCESS_TOKEN, action.payload, existingInLocal);
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle login
    builder.addMatcher(
      authApi.endpoints.login.matchPending,
      (state) => {
        state.loading = true;
        state.error = null;
        state.lastLoginAttempt = new Date().toISOString();
      }
    );
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, action) => {
        const { accessToken, refreshToken, user, rememberMe = true } = action.payload;

        // ALWAYS clear all storage first to prevent pollution
        clearAllAuthStorage();

        state.isAuthenticated = true;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = user as User;
        state.loading = false;
        state.error = null;

        // Store with new simplified keys
        setStorage(STORAGE_KEYS.ACCESS_TOKEN, accessToken, rememberMe);
        setStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, rememberMe);
        setStorage(STORAGE_KEYS.USER, JSON.stringify(user), rememberMe);
      }
    );
    builder.addMatcher(
      authApi.endpoints.login.matchRejected,
      (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = (action.error.message || 'Login failed');

        // Clear all auth storage
        clearAllAuthStorage();
      }
    );

    // Handle register
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, action) => {
        const { accessToken, refreshToken, user, rememberMe = true } = action.payload;

        // ALWAYS clear all storage first to prevent pollution
        clearAllAuthStorage();

        state.isAuthenticated = true;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = user as User;
        state.loading = false;
        state.error = null;

        // Store with new simplified keys
        setStorage(STORAGE_KEYS.ACCESS_TOKEN, accessToken, rememberMe);
        setStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, rememberMe);
        setStorage(STORAGE_KEYS.USER, JSON.stringify(user), rememberMe);
      }
    );

    // Handle logout
    builder.addMatcher(
      authApi.endpoints.logout.matchFulfilled,
      (state) => {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.loading = false;
        state.error = null;

        // Clear all auth storage
        clearAllAuthStorage();
      }
    );
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  refreshTokenSuccess,
  updateUserProfile,
  clearError,
  setLoading,
} = authSlice.actions;

// Export cleanup function for app-level initialization
export { clearAllAuthStorage };

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;