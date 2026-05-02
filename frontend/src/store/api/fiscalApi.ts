import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

export interface FiscalSummary {
  storeId: string;
  countryCode: string;
  signerSystem: string;
  totalSigned: number;
  failedLast7Days: number;
  lastSignedAt: string | null;
}

export interface SigningFailure {
  orderId: string;
  storeId: string;
  countryCode: string;
  signerSystem: string;
  signingError: string;
  occurredAt: string;
}

export const fiscalApi = createApi({
  reducerPath: 'fiscalApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['FiscalSummary', 'SigningFailures'],
  endpoints: (builder) => ({
    getFiscalSummary: builder.query<FiscalSummary[], string>({
      query: (storeId) => `/fiscal/summary?storeId=${storeId}`,
      providesTags: ['FiscalSummary'],
    }),
    getSigningFailures: builder.query<SigningFailure[], string>({
      query: (storeId) => `/fiscal/failures?storeId=${storeId}`,
      providesTags: ['SigningFailures'],
    }),
  }),
});

export const {
  useGetFiscalSummaryQuery,
  useGetSigningFailuresQuery,
} = fiscalApi;
