import type { User } from '../../types/user';

// ---------------------------------------------------------------------------
// Individual user fixtures (matching the User interface from types/user.ts)
// ---------------------------------------------------------------------------

export const mockCustomerUser: User = {
  id: 'user-1',
  email: 'customer@test.com',
  name: 'Test Customer',
  type: 'CUSTOMER',
  phone: '555-0001',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockManagerUser: User = {
  id: 'user-2',
  email: 'manager@test.com',
  name: 'Test Manager',
  type: 'MANAGER',
  phone: '555-0002',
  storeId: 'store-1',
  isActive: true,
  role: 'MANAGER',
  permissions: ['MANAGE_ORDERS', 'MANAGE_STAFF', 'VIEW_ANALYTICS', 'MANAGE_MENU'],
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockDriverUser: User = {
  id: 'user-3',
  email: 'driver@test.com',
  name: 'Test Driver',
  type: 'DRIVER',
  phone: '555-0003',
  storeId: 'store-1',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockKitchenStaffUser: User = {
  id: 'user-4',
  email: 'kitchen@test.com',
  name: 'Test Kitchen',
  type: 'STAFF',
  phone: '555-0004',
  storeId: 'store-1',
  isActive: true,
  role: 'KITCHEN_STAFF',
  permissions: ['VIEW_ORDERS', 'UPDATE_ORDER_STATUS'],
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockAdminUser: User = {
  id: 'user-5',
  email: 'admin@test.com',
  name: 'Test Admin',
  type: 'MANAGER',
  phone: '555-0005',
  isActive: true,
  role: 'ADMIN',
  permissions: ['MANAGE_ORDERS', 'MANAGE_STAFF', 'VIEW_ANALYTICS', 'MANAGE_MENU', 'MANAGE_STORES'],
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockAssistantManagerUser: User = {
  id: 'user-6',
  email: 'assistant@test.com',
  name: 'Test Assistant Manager',
  type: 'ASSISTANT_MANAGER',
  phone: '555-0006',
  storeId: 'store-1',
  isActive: true,
  role: 'ASSISTANT_MANAGER',
  permissions: ['MANAGE_ORDERS', 'VIEW_ANALYTICS'],
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockInactiveUser: User = {
  id: 'user-7',
  email: 'inactive@test.com',
  name: 'Inactive Staff',
  type: 'STAFF',
  phone: '555-0007',
  storeId: 'store-1',
  isActive: false,
  createdAt: '2025-06-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

export const mockUserList: User[] = [
  mockCustomerUser,
  mockManagerUser,
  mockDriverUser,
  mockKitchenStaffUser,
  mockAdminUser,
  mockAssistantManagerUser,
];

export const mockStaffList: User[] = [
  mockManagerUser,
  mockKitchenStaffUser,
  mockAssistantManagerUser,
  mockDriverUser,
];

// ---------------------------------------------------------------------------
// Auth tokens and state
// ---------------------------------------------------------------------------

export const mockAuthToken = 'mock-jwt-token-eyJhbGciOiJIUzI1NiJ9';
export const mockRefreshToken = 'mock-refresh-token-abc123';

export const mockAuthState = {
  auth: {
    isAuthenticated: true,
    accessToken: mockAuthToken,
    refreshToken: mockRefreshToken,
    user: mockManagerUser,
    loading: false,
    error: null,
    lastLoginAttempt: null,
  },
};

export const mockCustomerAuthState = {
  auth: {
    isAuthenticated: true,
    accessToken: mockAuthToken,
    refreshToken: mockRefreshToken,
    user: mockCustomerUser,
    loading: false,
    error: null,
    lastLoginAttempt: null,
  },
};

export const mockDriverAuthState = {
  auth: {
    isAuthenticated: true,
    accessToken: mockAuthToken,
    refreshToken: mockRefreshToken,
    user: mockDriverUser,
    loading: false,
    error: null,
    lastLoginAttempt: null,
  },
};

export const mockUnauthenticatedState = {
  auth: {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: false,
    error: null,
    lastLoginAttempt: null,
  },
};

export const mockAuthLoadingState = {
  auth: {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: true,
    error: null,
    lastLoginAttempt: null,
  },
};

export const mockAuthErrorState = {
  auth: {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: false,
    error: 'Invalid credentials',
    lastLoginAttempt: '2026-02-15T09:00:00Z',
  },
};
