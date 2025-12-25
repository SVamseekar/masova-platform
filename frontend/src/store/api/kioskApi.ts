import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

export interface KioskAccount {
  id: string;
  terminalId: string;
  storeId: string;
  isActive: boolean;
  lastKioskAccess: string | null;
  name: string;
  email: string;
}

export interface CreateKioskRequest {
  storeId: string;
  terminalId: string;
}

export interface CreateKioskResponse {
  success: boolean;
  message: string;
  kioskUserId: string;
  terminalId: string;
  storeId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  instructions: string;
}

export const kioskApi = createApi({
  reducerPath: 'kioskApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Kiosk'],
  endpoints: (builder) => ({
    createKiosk: builder.mutation<CreateKioskResponse, CreateKioskRequest>({
      query: (data) => ({
        url: '/users/kiosk/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Kiosk'],
    }),
    listKioskAccounts: builder.query<KioskAccount[], string>({
      query: (storeId) => `/users/kiosk/list?storeId=${storeId}`,
      providesTags: ['Kiosk'],
    }),
    regenerateKioskTokens: builder.mutation<CreateKioskResponse, string>({
      query: (kioskUserId) => ({
        url: `/users/kiosk/${kioskUserId}/regenerate-tokens`,
        method: 'POST',
      }),
    }),
    deactivateKiosk: builder.mutation<{ success: string; message: string }, string>({
      query: (kioskUserId) => ({
        url: `/users/kiosk/${kioskUserId}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['Kiosk'],
    }),
  }),
});

export const {
  useCreateKioskMutation,
  useListKioskAccountsQuery,
  useRegenerateKioskTokensMutation,
  useDeactivateKioskMutation,
} = kioskApi;
