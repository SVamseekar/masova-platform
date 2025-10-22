import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// API slices
import { authApi } from './api/authApi';
import { orderApi } from './api/orderApi';
import { userApi } from './api/userApi';
import { sessionApi } from './api/sessionApi';
import { analyticsApi } from './api/analyticsApi';
import { menuApi } from './api/menuApi';

// Slice reducers
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import cartReducer from './slices/cartSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    // Feature slices
    auth: authReducer,
    ui: uiReducer,
    cart: cartReducer,
    notifications: notificationReducer,
    
    // RTK Query API slices
    [authApi.reducerPath]: authApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [sessionApi.reducerPath]: sessionApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [menuApi.reducerPath]: menuApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }).concat(
      authApi.middleware,
      orderApi.middleware,
      userApi.middleware,
      sessionApi.middleware,
      analyticsApi.middleware,
      menuApi.middleware
    ),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks
export { useAppDispatch, useAppSelector } from './hooks';