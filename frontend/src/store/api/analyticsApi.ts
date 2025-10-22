import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface SalesAnalytics {
  todaySales: number;
  yesterdaySales: number;
  lastYearSameDaySales: number;
  percentageChange: number;
  weeklySales: number;
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/analytics',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    getSalesAnalytics: builder.query<SalesAnalytics, { storeId: string; period: string }>({
      query: ({ storeId, period }) => `sales/${storeId}?period=${period}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetSalesAnalyticsQuery,
} = analyticsApi;