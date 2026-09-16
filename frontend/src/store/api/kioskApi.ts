import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';
import { mapKioskListResponse, type MappedKioskAccount } from '../../utils/kioskMappers';

export type KioskAccount = MappedKioskAccount;

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
  instructions?: string;
}

export const kioskApi = createApi({
  reducerPath: 'kioskApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Kiosk'],
  endpoints: (builder) => ({
    createKiosk: builder.mutation<CreateKioskResponse, CreateKioskRequest>({
      query: (data) => ({
        url: '/users/kiosk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Kiosk'],
    }),
    listKioskAccounts: builder.query<KioskAccount[], string>({
      query: (storeId) => `/users/kiosk?storeId=${encodeURIComponent(storeId)}`,
      transformResponse: (raw: unknown) => mapKioskListResponse(raw),
      providesTags: ['Kiosk'],
    }),
    regenerateKioskTokens: builder.mutation<CreateKioskResponse, string>({
      query: (kioskUserId) => ({
        url: `/users/kiosk/${kioskUserId}/regenerate`,
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
