import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { TestWrapper } from '../TestWrapper';
import type { RootState } from '../../store/store';

// PreloadedState type for Redux store
type PreloadedState<S> = {
  [K in keyof S]?: S[K] extends object ? PreloadedState<S[K]> : S[K];
};

/**
 * Custom render function that wraps components with TestWrapper
 *
 * @example
 * import { renderWithProviders } from '@/test/utils/testUtils';
 *
 * test('renders component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 *
 * @example
 * // With preloaded state
 * test('renders with user logged in', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />, {
 *     preloadedState: {
 *       auth: { user: mockUser, isAuthenticated: true }
 *     }
 *   });
 * });
 */
export interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  initialEntries?: string[];
  useMemoryRouter?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    initialEntries = ['/'],
    useMemoryRouter = false,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TestWrapper
        initialState={preloadedState}
        initialEntries={initialEntries}
        useMemoryRouter={useMemoryRouter}
      >
        {children}
      </TestWrapper>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER' as const,
  phone: '555-0123',
};

export const mockStaffUser = {
  id: '2',
  email: 'staff@example.com',
  name: 'Staff Member',
  role: 'STAFF' as const,
  phone: '555-0456',
  storeId: '1',
};

export const mockManagerUser = {
  id: '3',
  email: 'manager@example.com',
  name: 'Manager User',
  role: 'MANAGER' as const,
  phone: '555-0789',
  storeId: '1',
};

export const mockDriverUser = {
  id: '4',
  email: 'driver@example.com',
  name: 'Driver User',
  role: 'DRIVER' as const,
  phone: '555-1001',
  storeId: '1',
};

export const mockKitchenStaffUser = {
  id: '5',
  email: 'kitchen@example.com',
  name: 'Kitchen Staff',
  role: 'STAFF' as const,
  phone: '555-1100',
  storeId: '1',
};

/**
 * Mock menu items for testing
 */
export const mockMenuItem = {
  id: '1',
  name: 'Margherita Pizza',
  description: 'Classic pizza with tomato and mozzarella',
  price: 12.99,
  category: 'PIZZA',
  available: true,
  imageUrl: '/images/pizza.jpg',
};

export const mockMenuItems = [
  mockMenuItem,
  {
    id: '2',
    name: 'Cheeseburger',
    description: 'Juicy beef patty with cheese',
    price: 8.99,
    category: 'BURGER',
    available: true,
    imageUrl: '/images/burger.jpg',
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Fresh romaine with caesar dressing',
    price: 7.99,
    category: 'SALAD',
    available: true,
    imageUrl: '/images/salad.jpg',
  },
];

/**
 * Mock order data for testing
 */
export const mockOrder = {
  id: '1',
  customerId: '1',
  items: [
    {
      menuItemId: '1',
      menuItemName: 'Margherita Pizza',
      quantity: 2,
      price: 12.99,
    },
  ],
  subtotal: 25.98,
  tax: 2.6,
  deliveryFee: 5.0,
  totalAmount: 33.58,
  status: 'PENDING' as const,
  createdAt: new Date().toISOString(),
};

/**
 * Mock store data for testing
 */
export const mockStore = {
  id: '1',
  name: 'Downtown Branch',
  address: '123 Main St',
  phone: '555-0123',
  isOpen: true,
  coordinates: {
    lat: 40.7128,
    lng: -74.006,
  },
};

export const mockStores = [
  mockStore,
  {
    id: '2',
    name: 'Uptown Branch',
    address: '456 Oak Ave',
    phone: '555-0456',
    isOpen: true,
    coordinates: {
      lat: 40.7589,
      lng: -73.9851,
    },
  },
];

/**
 * Wait utilities for async operations
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to create mock event handlers
 */
export const createMockHandler = () => {
  const fn = vi.fn();
  return { handler: fn, calls: () => fn.mock.calls };
};

/**
 * Helper to suppress console errors in specific tests
 */
export const suppressConsoleError = (callback: () => void) => {
  const originalError = console.error;
  console.error = vi.fn();
  callback();
  console.error = originalError;
};

/**
 * Helper to create preloaded auth state
 */
export const createAuthState = (
  user: typeof mockUser | null,
  isAuthenticated = true
) => ({
  auth: {
    user,
    isAuthenticated,
    token: isAuthenticated ? 'mock-jwt-token' : null,
    loading: false,
    error: null,
  },
});

/**
 * Helper to create preloaded cart state
 */
export const createCartState = (items: any[] = []) => ({
  cart: {
    items,
    selectedStoreId: '1',
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
  },
});

/**
 * Role-specific render helpers
 *
 * These functions pre-configure the Redux store with authentication state
 * for a specific user role, making it easy to render components as different
 * users in tests.
 */
export function renderAsCustomer(
  ui: React.ReactElement,
  options?: Omit<ExtendedRenderOptions, 'preloadedState'> & { extraState?: PreloadedState<RootState> }
) {
  const { extraState, ...rest } = options ?? {};
  return renderWithProviders(ui, {
    ...rest,
    preloadedState: { ...createAuthState(mockUser, true), ...extraState },
    useMemoryRouter: true,
  });
}

export function renderAsManager(
  ui: React.ReactElement,
  options?: Omit<ExtendedRenderOptions, 'preloadedState'> & { extraState?: PreloadedState<RootState> }
) {
  const { extraState, ...rest } = options ?? {};
  return renderWithProviders(ui, {
    ...rest,
    preloadedState: { ...createAuthState(mockManagerUser, true), ...extraState },
    useMemoryRouter: true,
  });
}

export function renderAsDriver(
  ui: React.ReactElement,
  options?: Omit<ExtendedRenderOptions, 'preloadedState'> & { extraState?: PreloadedState<RootState> }
) {
  const { extraState, ...rest } = options ?? {};
  return renderWithProviders(ui, {
    ...rest,
    preloadedState: { ...createAuthState(mockDriverUser, true), ...extraState },
    useMemoryRouter: true,
  });
}

export function renderAsKitchenStaff(
  ui: React.ReactElement,
  options?: Omit<ExtendedRenderOptions, 'preloadedState'> & { extraState?: PreloadedState<RootState> }
) {
  const { extraState, ...rest } = options ?? {};
  return renderWithProviders(ui, {
    ...rest,
    preloadedState: { ...createAuthState(mockKitchenStaffUser, true), ...extraState },
    useMemoryRouter: true,
  });
}

export function renderUnauthenticated(
  ui: React.ReactElement,
  options?: Omit<ExtendedRenderOptions, 'preloadedState'> & { extraState?: PreloadedState<RootState> }
) {
  const { extraState, ...rest } = options ?? {};
  return renderWithProviders(ui, {
    ...rest,
    preloadedState: { ...createAuthState(null, false), ...extraState },
    useMemoryRouter: true,
  });
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { vi } from 'vitest';
