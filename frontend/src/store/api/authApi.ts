import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

// Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER';
  name: string;
  email: string;
  phone: string;
  password: string;
  storeId?: string;
  rememberMe?: boolean;
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
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Auth', 'User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: ({ email, password }) => ({
        url: '/users/login',
        method: 'POST',
        body: { email, password },
      }),
      transformResponse: (response: AuthResponse, _meta, arg) => ({
        ...response,
        rememberMe: arg.rememberMe ?? true, // Include rememberMe in response
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: ({ rememberMe, ...userData }) => ({
        url: '/users/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: AuthResponse, _meta, arg) => ({
        ...response,
        rememberMe: arg.rememberMe ?? true, // Include rememberMe in response
      }),
      invalidatesTags: ['Auth'],
    }),
    refreshToken: builder.mutation<AuthResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: '/users/refresh-token',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/users/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    getProfile: builder.query<AuthResponse['user'], void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    googleLogin: builder.mutation<AuthResponse, { idToken: string }>({
      query: (body) => ({
        url: '/users/auth/google',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useGoogleLoginMutation,
} = authApi;