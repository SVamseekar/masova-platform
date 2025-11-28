import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';
import { authApi } from '../api/authApi';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  lastLoginAttempt: string | null;
}

// Storage helper functions to support both localStorage and sessionStorage
// Uses different keys for customer and staff to prevent session conflicts
const getStorageKey = (baseKey: string, userType?: string): string => {
  const type = userType || 'customer'; // Default to customer for backward compatibility
  return type === 'CUSTOMER' || !userType ? baseKey : `${type}_${baseKey}`;
};

const getStorage = (key: string, userType?: string): string | null => {
  const storageKey = getStorageKey(key, userType);
  return localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
};

const setStorage = (key: string, value: string, rememberMe: boolean = true, userType?: string): void => {
  const storageKey = getStorageKey(key, userType);

  // Clear old keys from opposite storage
  if (rememberMe) {
    localStorage.setItem(storageKey, value);
    sessionStorage.removeItem(storageKey); // Remove from sessionStorage if exists
  } else {
    sessionStorage.setItem(storageKey, value);
    localStorage.removeItem(storageKey); // Remove from localStorage if exists
  }
};

const removeStorage = (key: string, userType?: string): void => {
  const storageKey = getStorageKey(key, userType);
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(storageKey);

  // Also clear legacy keys (for customers who were using old system)
  if (!userType || userType === 'CUSTOMER') {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

// Try to load user from storage (checks both localStorage and sessionStorage)
// Tries all user types to find an active session
const loadUserFromStorage = (): User | null => {
  try {
    // Try to load customer (default/legacy)
    let userStr = getStorage('user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    // Try other user types
    const userTypes = ['STAFF', 'MANAGER', 'DRIVER', 'ASSISTANT_MANAGER'];
    for (const type of userTypes) {
      userStr = getStorage('user', type);
      if (userStr) {
        return JSON.parse(userStr);
      }
    }

    return null;
  } catch {
    return null;
  }
};

const loadAccessTokenFromStorage = (): string | null => {
  // Try customer (default/legacy) first
  let token = getStorage('accessToken');
  if (token) return token;

  // Try other user types
  const userTypes = ['STAFF', 'MANAGER', 'DRIVER', 'ASSISTANT_MANAGER'];
  for (const type of userTypes) {
    token = getStorage('accessToken', type);
    if (token) return token;
  }

  return null;
};

const loadRefreshTokenFromStorage = (): string | null => {
  // Try customer (default/legacy) first
  let token = getStorage('refreshToken');
  if (token) return token;

  // Try other user types
  const userTypes = ['STAFF', 'MANAGER', 'DRIVER', 'ASSISTANT_MANAGER'];
  for (const type of userTypes) {
    token = getStorage('refreshToken', type);
    if (token) return token;
  }

  return null;
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

      state.isAuthenticated = true;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.loading = false;
      state.error = null;

      // Store tokens and user in appropriate storage with user type to prevent conflicts
      setStorage('accessToken', accessToken, rememberMe, user.type);
      setStorage('refreshToken', refreshToken, rememberMe, user.type);
      setStorage('user', JSON.stringify(user), rememberMe, user.type);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = action.payload;

      // Clear tokens from both storages
      removeStorage('accessToken');
      removeStorage('refreshToken');
      removeStorage('user');
    },
    logout: (state) => {
      const userType = state.user?.type;

      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;

      // Clear all auth data from both storages for the specific user type
      removeStorage('accessToken', userType);
      removeStorage('refreshToken', userType);
      removeStorage('user', userType);
    },
    refreshTokenSuccess: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      const userType = state.user?.type;
      // Preserve existing storage type (localStorage or sessionStorage)
      const storageKey = getStorageKey('accessToken', userType);
      const existingInLocal = !!localStorage.getItem(storageKey);
      setStorage('accessToken', action.payload, existingInLocal, userType);
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
        state.isAuthenticated = true;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = user as User;
        state.loading = false;
        state.error = null;

        // Store in appropriate storage based on rememberMe and user type
        const userType = (user as User).type;
        setStorage('accessToken', accessToken, rememberMe, userType);
        setStorage('refreshToken', refreshToken, rememberMe, userType);
        setStorage('user', JSON.stringify(user), rememberMe, userType);
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

        // Clear both storages
        removeStorage('accessToken');
        removeStorage('refreshToken');
        removeStorage('user');
      }
    );

    // Handle register
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, action) => {
        const { accessToken, refreshToken, user, rememberMe = true } = action.payload;
        state.isAuthenticated = true;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = user as User;
        state.loading = false;
        state.error = null;

        // Store in appropriate storage with user type
        const userType = (user as User).type;
        setStorage('accessToken', accessToken, rememberMe, userType);
        setStorage('refreshToken', refreshToken, rememberMe, userType);
        setStorage('user', JSON.stringify(user), rememberMe, userType);
      }
    );

    // Handle logout
    builder.addMatcher(
      authApi.endpoints.logout.matchFulfilled,
      (state) => {
        const userType = state.user?.type;

        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.loading = false;
        state.error = null;

        // Clear both storages for the specific user type
        removeStorage('accessToken', userType);
        removeStorage('refreshToken', userType);
        removeStorage('user', userType);
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

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;