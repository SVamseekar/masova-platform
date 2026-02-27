import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import type { PreloadedState } from '@reduxjs/toolkit';

// API slices
import { authApi } from '../store/api/authApi';
import { orderApi } from '../store/api/orderApi';
import { userApi } from '../store/api/userApi';
import { sessionApi } from '../store/api/sessionApi';
import { analyticsApi } from '../store/api/analyticsApi';
import { menuApi } from '../store/api/menuApi';
import { storeApi } from '../store/api/storeApi';
import { shiftApi } from '../store/api/shiftApi';
import { paymentApi } from '../store/api/paymentApi';
import { equipmentApi } from '../store/api/equipmentApi';
import { inventoryApi } from '../store/api/inventoryApi';
import { customerApi } from '../store/api/customerApi';
import { driverApi } from '../store/api/driverApi';
import { deliveryApi } from '../store/api/deliveryApi';
import { reviewApi } from '../store/api/reviewApi';
import { notificationApi } from '../store/api/notificationApi';
import { kioskApi } from '../store/api/kioskApi';

// Slice reducers
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';
import cartReducer from '../store/slices/cartSlice';
import notificationReducer from '../store/slices/notificationSlice';

import type { RootState } from '../store/store';

/**
 * Creates a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
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
      [storeApi.reducerPath]: storeApi.reducer,
      [shiftApi.reducerPath]: shiftApi.reducer,
      [paymentApi.reducerPath]: paymentApi.reducer,
      [equipmentApi.reducerPath]: equipmentApi.reducer,
      [inventoryApi.reducerPath]: inventoryApi.reducer,
      [customerApi.reducerPath]: customerApi.reducer,
      [driverApi.reducerPath]: driverApi.reducer,
      [deliveryApi.reducerPath]: deliveryApi.reducer,
      [reviewApi.reducerPath]: reviewApi.reducer,
      [notificationApi.reducerPath]: notificationApi.reducer,
      [kioskApi.reducerPath]: kioskApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests
      }).concat(
        authApi.middleware,
        orderApi.middleware,
        userApi.middleware,
        sessionApi.middleware,
        analyticsApi.middleware,
        menuApi.middleware,
        storeApi.middleware,
        shiftApi.middleware,
        paymentApi.middleware,
        equipmentApi.middleware,
        inventoryApi.middleware,
        customerApi.middleware,
        driverApi.middleware,
        deliveryApi.middleware,
        reviewApi.middleware,
        notificationApi.middleware,
        kioskApi.middleware
      ),
    preloadedState,
  });
}

interface TestWrapperProps {
  children: React.ReactNode;
  initialState?: PreloadedState<RootState>;
  initialEntries?: string[];
  useMemoryRouter?: boolean;
}

/**
 * Test wrapper component that provides Redux store and React Router
 *
 * @example
 * // Basic usage with BrowserRouter
 * render(<Component />, { wrapper: TestWrapper });
 *
 * @example
 * // With initial Redux state
 * const TestWrapperWithState = ({ children }) => (
 *   <TestWrapper initialState={{ auth: { user: mockUser } }}>
 *     {children}
 *   </TestWrapper>
 * );
 * render(<Component />, { wrapper: TestWrapperWithState });
 *
 * @example
 * // With MemoryRouter for specific routes
 * const TestWrapperWithRoute = ({ children }) => (
 *   <TestWrapper
 *     useMemoryRouter
 *     initialEntries={['/menu']}
 *   >
 *     {children}
 *   </TestWrapper>
 * );
 * render(<Component />, { wrapper: TestWrapperWithRoute });
 */
export const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  initialState,
  initialEntries = ['/'],
  useMemoryRouter = false,
}) => {
  const store = createTestStore(initialState);

  const Router = useMemoryRouter ? MemoryRouter : BrowserRouter;
  const routerProps = useMemoryRouter ? { initialEntries } : {};

  return (
    <Provider store={store}>
      <Router {...routerProps}>{children}</Router>
    </Provider>
  );
};

/**
 * Default wrapper for simple tests
 */
export const DefaultTestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <TestWrapper>{children}</TestWrapper>;
