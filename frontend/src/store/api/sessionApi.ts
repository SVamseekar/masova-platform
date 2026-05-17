import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';

// Types
export interface WorkingSession {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  storeId: string;
  loginTime: string;
  logoutTime?: string;
  currentDuration?: string;
  totalHours?: number;
  breakTime?: number;
  breakDurationMinutes?: number;
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING_APPROVAL' | 'AUTO_CLOSED';
}

export interface StartSessionRequest {
  employeeId: string;
  storeId: string;
}

export const sessionApi = createApi({
  reducerPath: 'sessionApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Session', 'WorkingSessions'],
  endpoints: (builder) => ({
    startSession: builder.mutation<WorkingSession, StartSessionRequest>({
      query: (data) => ({
        url: '/api/sessions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    endSession: builder.mutation<WorkingSession, void>({
      query: () => ({
        url: '/api/sessions/end',
        method: 'POST',
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    clockIn: builder.mutation<{ message: string; session: WorkingSession }, { employeeId: string; pin: string }>({
      query: (data) => ({
        url: '/api/sessions/clock-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    clockOut: builder.mutation<{ message: string; session: WorkingSession }, { employeeId: string }>({
      query: (data) => ({
        url: '/api/sessions/clock-out',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    getSessions: builder.query<WorkingSession[], { storeId?: string; startDate?: string; endDate?: string } | void>({
      query: (args) => {
        const { storeId, startDate, endDate } = args ?? {};
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const qs = params.toString();
        return qs ? `/api/sessions?${qs}` : '/api/sessions';
      },
      providesTags: ['WorkingSessions'],
    }),

    getPendingApprovalSessions: builder.query<WorkingSession[], string | undefined>({
      query: (storeId) => `/api/sessions/pending${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: ['WorkingSessions'],
    }),

    approveSession: builder.mutation<WorkingSession, string>({
      query: (sessionId) => ({
        url: `/api/sessions/${sessionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    rejectSession: builder.mutation<WorkingSession, { sessionId: string; reason?: string }>({
      query: ({ sessionId, reason }) => ({
        url: `/api/sessions/${sessionId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    addBreakTime: builder.mutation<WorkingSession, { sessionId: string; breakMinutes: number }>({
      query: ({ sessionId, breakMinutes }) => ({
        url: `/api/sessions/${sessionId}/break`,
        method: 'POST',
        body: { breakMinutes },
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),
  }),
});

export const {
  useStartSessionMutation,
  useEndSessionMutation,
  useClockInMutation,
  useClockOutMutation,
  useGetSessionsQuery,
  useGetPendingApprovalSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
  useAddBreakTimeMutation,
} = sessionApi;
