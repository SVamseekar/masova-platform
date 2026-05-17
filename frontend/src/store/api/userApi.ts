import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import { User } from '../../types/user';

// Types
export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShiftTime {
  startTime: string;
  endTime: string;
}

export interface WorkSchedule {
  weeklySchedule?: Record<string, ShiftTime>;
  maxHoursPerWeek?: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER';
  storeId?: string;
  address?: Address;
  role?: string;
  permissions?: string[];
  schedule?: WorkSchedule;
  // Driver-specific fields
  vehicleType?: string;
  licenseNumber?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  storeId?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
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
  }),
  tagTypes: ['User', 'Users'],
  endpoints: (builder) => ({
    // Get current user profile
    getProfile: builder.query<User, void>({
      query: () => '/api/users/me',
      providesTags: ['User'],
    }),

    // Update current user profile
    updateProfile: builder.mutation<User, UpdateUserRequest>({
      query: (data) => ({
        url: '/api/users/me',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (data) => ({
        url: '/api/auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Get user by ID
    getUser: builder.query<User, string>({
      query: (userId) => `/api/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    // Update user
    updateUser: builder.mutation<User, { userId: string; data: UpdateUserRequest }>({
      query: ({ userId, data }) => ({
        url: `/api/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // Activate user
    activateUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/api/users/${userId}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // Deactivate user
    deactivateUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/api/users/${userId}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // Get users by type
    getUsersByType: builder.query<User[], string>({
      query: (type) => `/api/users?type=${type}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'Users', id: 'LIST' }]
          : [{ type: 'Users', id: 'LIST' }],
    }),

    // Get store employees
    getStoreEmployees: builder.query<User[], string | undefined>({
      query: (storeId) => `/api/users${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'Users', id: storeId || 'DEFAULT' }]
          : [{ type: 'Users', id: storeId || 'DEFAULT' }],
    }),

    // Get active managers
    getManagers: builder.query<User[], void>({
      query: () => '/api/users?type=MANAGER',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'Users', id: 'LIST' }]
          : [{ type: 'Users', id: 'LIST' }],
    }),

    // Check if user can take orders
    canTakeOrders: builder.query<{ canTakeOrders: boolean; reason?: string }, string>({
      query: (userId) => `/api/users/${userId}/can-take-orders`,
    }),

    // Get all users
    getUsers: builder.query<User[], void>({
      query: () => '/api/users',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'Users', id: 'LIST' }]
          : [{ type: 'Users', id: 'LIST' }],
    }),

    // Create new user (staff member)
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (data) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),

    // Get staff profile by ID (for both staff viewing own profile and managers viewing staff)
    getStaffProfile: builder.query<User, string>({
      query: (userId) => `/api/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    // Update staff profile (for both staff and managers)
    updateStaffProfile: builder.mutation<User, { userId: string; data: UpdateUserRequest }>({
      query: ({ userId, data }) => ({
        url: `/api/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // Validate PIN for POS authentication
    validatePIN: builder.mutation<
      { userId: string; name: string; type: string; role: string; storeId: string },
      { pin: string }
    >({
      query: (data) => ({
        url: '/api/auth/validate-pin',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetUsersByTypeQuery,
  useGetStoreEmployeesQuery,
  useGetManagersQuery,
  useCanTakeOrdersQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetStaffProfileQuery,
  useUpdateStaffProfileMutation,
  useValidatePINMutation,
} = userApi;