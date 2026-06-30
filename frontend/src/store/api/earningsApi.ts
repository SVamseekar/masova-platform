import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

export interface WeeklyEarningsResponse {
  employeeId: string;
  storeId: string;
  weekStart: string;
  weekEnd: string;
  hoursWorked: number;
  basePayInr: number;
  tipsInr: number;
  totalInr: number;
  hourlyRateInr: number | null;
}

export interface StaffPayRate {
  id: string;
  employeeId: string;
  storeId: string;
  hourlyRateInr: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface SetPayRateRequest {
  employeeId: string;
  storeId: string;
  hourlyRateInr: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export const earningsApi = createApi({
  reducerPath: 'earningsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Earnings', 'PayRate'],
  endpoints: (builder) => ({
    getWeeklyEarnings: builder.query<
      WeeklyEarningsResponse,
      { employeeId: string; weekStart?: string }
    >({
      query: ({ employeeId, weekStart }) => {
        const params = new URLSearchParams({ employeeId });
        if (weekStart) params.append('weekStart', weekStart);
        return `/staff/earnings/weekly?${params.toString()}`;
      },
      providesTags: (result, error, { employeeId }) => [{ type: 'Earnings', id: employeeId }],
    }),

    getEarningsHistory: builder.query<
      WeeklyEarningsResponse[],
      { employeeId: string; weeks?: number }
    >({
      query: ({ employeeId, weeks = 12 }) =>
        `/staff/earnings/history?employeeId=${encodeURIComponent(employeeId)}&weeks=${weeks}`,
      providesTags: (result, error, { employeeId }) => [{ type: 'Earnings', id: `history-${employeeId}` }],
    }),

    getPayRate: builder.query<StaffPayRate, string>({
      query: (employeeId) => `/staff/pay-rates?employeeId=${encodeURIComponent(employeeId)}`,
      providesTags: (result, error, employeeId) => [{ type: 'PayRate', id: employeeId }],
    }),

    setPayRate: builder.mutation<StaffPayRate, SetPayRateRequest>({
      query: (body) => ({
        url: '/staff/pay-rates',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { employeeId }) => [
        { type: 'PayRate', id: employeeId },
        { type: 'Earnings', id: employeeId },
      ],
    }),
  }),
});

export const {
  useGetWeeklyEarningsQuery,
  useGetEarningsHistoryQuery,
  useGetPayRateQuery,
  useSetPayRateMutation,
} = earningsApi;