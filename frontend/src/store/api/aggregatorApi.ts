import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

export type AggregatorPlatform = 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';

export interface AggregatorConnection {
  id: string;
  storeId: string;
  platform: AggregatorPlatform;
  commissionPercent: number;
  active: boolean;
}

export const aggregatorApi = createApi({
  reducerPath: 'aggregatorApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.ORDER_SERVICE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const storeId = state.cart?.selectedStoreId;
      if (storeId) headers.set('X-Store-Id', storeId);
      return headers;
    },
  }),
  tagTypes: ['AggregatorConnection'],
  endpoints: (builder) => ({
    getConnections: builder.query<AggregatorConnection[], string>({
      query: (storeId) => `/api/aggregators/connections?storeId=${storeId}`,
      transformResponse: (response: { data: AggregatorConnection[] }) => response.data,
      providesTags: ['AggregatorConnection'],
    }),
    upsertConnection: builder.mutation<AggregatorConnection, {
      storeId: string;
      platform: AggregatorPlatform;
      commissionPercent: number;
    }>({
      query: ({ storeId, platform, commissionPercent }) => ({
        url: `/api/aggregators/connections?storeId=${storeId}&platform=${platform}&commissionPercent=${commissionPercent}`,
        method: 'PUT',
      }),
      transformResponse: (response: { data: AggregatorConnection }) => response.data,
      invalidatesTags: ['AggregatorConnection'],
    }),
  }),
});

export const { useGetConnectionsQuery, useUpsertConnectionMutation } = aggregatorApi;
