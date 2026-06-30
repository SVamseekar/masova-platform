import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

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
  latitude?: number;
  longitude?: number;
}

export const sessionApi = createApi({
  reducerPath: 'sessionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.USER_SERVICE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  }),
  tagTypes: ['Session', 'WorkingSessions'],
  endpoints: (builder) => ({
    getCurrentSession: builder.query<WorkingSession | null, string>({
      query: (employeeId) => `/sessions?employeeId=${encodeURIComponent(employeeId)}&active=true`,
      transformResponse: (response: WorkingSession[]) => response[0] ?? null,
      providesTags: ['Session'],
    }),

    startSession: builder.mutation<WorkingSession, StartSessionRequest | void>({
      query: (body) => ({
        url: '/sessions',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    endSession: builder.mutation<WorkingSession, StartSessionRequest | void>({
      query: (body) => ({
        url: '/sessions/end',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    addBreakTime: builder.mutation<WorkingSession, { sessionId: string; breakMinutes: number }>({
      query: ({ sessionId, breakMinutes }) => ({
        url: `/sessions/${sessionId}/break`,
        method: 'POST',
        body: { breakMinutes },
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    getActiveStoreSessions: builder.query<WorkingSession[], string | undefined>({
      query: (storeId) =>
        `/sessions?active=true${storeId ? `&storeId=${encodeURIComponent(storeId)}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'WorkingSessions', id: storeId || 'DEFAULT' }],
    }),

    getStoreSessions: builder.query<WorkingSession[], { storeId?: string; date?: string }>({
      query: ({ storeId, date }) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        if (date) params.append('date', date);
        const qs = params.toString();
        return `/sessions${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['WorkingSessions'],
    }),

    getEmployeeSessions: builder.query<WorkingSession[], { employeeId: string; date?: string }>({
      query: ({ employeeId, date }) => {
        const params = new URLSearchParams({ employeeId });
        if (date) params.append('date', date);
        return `/sessions?${params.toString()}`;
      },
      providesTags: ['Session'],
    }),

    getPendingApprovalSessions: builder.query<WorkingSession[], void>({
      query: () => '/sessions/pending',
      providesTags: ['WorkingSessions'],
    }),

    approveSession: builder.mutation<{ message: string }, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    rejectSession: builder.mutation<{ message: string }, { sessionId: string; reason?: string }>({
      query: ({ sessionId, reason }) => ({
        url: `/sessions/${sessionId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    clockInWithPin: builder.mutation<{ message: string; session: WorkingSession }, { employeeId: string; pin: string }>({
      query: ({ employeeId, pin }) => ({
        url: '/sessions/clock-in',
        method: 'POST',
        body: { employeeId, pin },
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    clockOutEmployee: builder.mutation<{ message: string; session: WorkingSession }, { employeeId: string }>({
      query: ({ employeeId }) => ({
        url: '/sessions/clock-out',
        method: 'POST',
        body: { employeeId },
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    getEmployeeSessionReport: builder.query<WorkingSession[], { employeeId: string; date?: string }>({
      query: ({ employeeId, date }) => {
        const params = new URLSearchParams({ employeeId });
        if (date) params.append('date', date);
        return `/sessions?${params.toString()}`;
      },
      providesTags: (result, error, { employeeId }) => [{ type: 'Session', id: employeeId }],
    }),

    getEmployeeSessionStatus: builder.query<WorkingSession | null, string>({
      query: (employeeId) => `/sessions?employeeId=${encodeURIComponent(employeeId)}&active=true`,
      transformResponse: (response: WorkingSession[]) => response[0] ?? null,
      providesTags: (result, error, employeeId) => [{ type: 'Session', id: employeeId }],
    }),
  }),
});

export const {
  useGetCurrentSessionQuery,
  useStartSessionMutation,
  useEndSessionMutation,
  useAddBreakTimeMutation,
  useGetActiveStoreSessionsQuery,
  useGetStoreSessionsQuery,
  useGetEmployeeSessionsQuery,
  useGetPendingApprovalSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
  useClockInWithPinMutation,
  useClockOutEmployeeMutation,
  useGetEmployeeSessionReportQuery,
  useGetEmployeeSessionStatusQuery,
} = sessionApi;

export const useRecordBreakMutation = useAddBreakTimeMutation;