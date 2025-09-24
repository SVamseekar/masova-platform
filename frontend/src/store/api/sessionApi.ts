import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { WorkingSession } from '../../types/user';

export const sessionApi = createApi({
  reducerPath: 'sessionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/users/sessions',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    getCurrentSession: builder.query<WorkingSession | null, void>({
      query: () => 'current',
      providesTags: ['Session'],
    }),
    startSession: builder.mutation<WorkingSession, void>({
      query: () => ({
        url: 'start',
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),
    endSession: builder.mutation<WorkingSession, void>({
      query: () => ({
        url: 'end',
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),
    addBreakTime: builder.mutation<WorkingSession, { employeeId: string; breakMinutes: number }>({
      query: ({ employeeId, breakMinutes }) => ({
        url: `${employeeId}/break`,
        method: 'POST',
        body: { breakMinutes },
      }),
      invalidatesTags: ['Session'],
    }),
    getActiveStoreSessions: builder.query<WorkingSession[], string>({
      query: (storeId) => `store/${storeId}/active`,
      providesTags: ['Session'],
    }),
    approveSession: builder.mutation<void, string>({
      query: (sessionId) => ({
        url: `${sessionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),
  }),
});

export const {
  useGetCurrentSessionQuery,
  useStartSessionMutation,
  useEndSessionMutation,
  useAddBreakTimeMutation,
  useGetActiveStoreSessionsQuery,
  useApproveSessionMutation,
} = sessionApi;