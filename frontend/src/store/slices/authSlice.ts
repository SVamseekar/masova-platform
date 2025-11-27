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
const getStorage = (key: string): string | null => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const setStorage = (key: string, value: string, rememberMe: boolean = true): void => {
  if (rememberMe) {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key); // Remove from sessionStorage if exists
  } else {
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key); // Remove from localStorage if exists
  }
};

const removeStorage = (key: string): void => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

// Try to load user from storage (checks both localStorage and sessionStorage)
const loadUserFromStorage = (): User | null => {
  try {
    const userStr = getStorage('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  isAuthenticated: !!getStorage('accessToken'),
  accessToken: getStorage('accessToken'),
  refreshToken: getStorage('refreshToken'),
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

      // Store tokens and user in appropriate storage
      setStorage('accessToken', accessToken, rememberMe);
      setStorage('refreshToken', refreshToken, rememberMe);
      setStorage('user', JSON.stringify(user), rememberMe);
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
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;

      // Clear all auth data from both storages
      removeStorage('accessToken');
      removeStorage('refreshToken');
      removeStorage('user');
    },
    refreshTokenSuccess: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      // Preserve existing storage type (localStorage or sessionStorage)
      const existingInLocal = !!localStorage.getItem('accessToken');
      setStorage('accessToken', action.payload, existingInLocal);
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

        // Store in appropriate storage based on rememberMe
        setStorage('accessToken', accessToken, rememberMe);
        setStorage('refreshToken', refreshToken, rememberMe);
        setStorage('user', JSON.stringify(user), rememberMe);
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

        // Store in appropriate storage
        setStorage('accessToken', accessToken, rememberMe);
        setStorage('refreshToken', refreshToken, rememberMe);
        setStorage('user', JSON.stringify(user), rememberMe);
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

        // Clear both storages
        removeStorage('accessToken');
        removeStorage('refreshToken');
        removeStorage('user');
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