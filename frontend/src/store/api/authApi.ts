import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER';
  name: string;
  email: string;
  phone: string;
  password: string;
  storeId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: string;
    storeId?: string;
    isActive: boolean;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Auth', 'User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/users/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/api/users/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),
    refreshToken: builder.mutation<AuthResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: '/api/users/refresh-token',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/api/users/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    getProfile: builder.query<AuthResponse['user'], void>({
      query: () => '/api/users/profile',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetProfileQuery,
} = authApi;