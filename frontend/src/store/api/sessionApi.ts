import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface WorkingSession {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  storeId: string;
  loginTime: string;
  logoutTime?: string;
  currentDuration?: string;
  totalHours?: number;
  breakTime: number;
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING_APPROVAL';
}

export interface StartSessionRequest {
  employeeId: string;
  storeId: string;
}

export interface EndSessionRequest {
  sessionId: string;
}

export const sessionApi = createApi({
  reducerPath: 'sessionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Session', 'WorkingSessions'],
  endpoints: (builder) => ({
    // Get current user's active session
    getCurrentSession: builder.query<WorkingSession | null, string>({
      query: (employeeId) => `/api/sessions/employee/${employeeId}/current`,
      providesTags: ['Session'],
    }),

    // Start a new working session
    startSession: builder.mutation<WorkingSession, StartSessionRequest>({
      query: (data) => ({
        url: '/api/sessions/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // End current session
    endSession: builder.mutation<WorkingSession, string>({
      query: (sessionId) => ({
        url: `/api/sessions/${sessionId}/end`,
        method: 'POST',
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // Add break time to session
    addBreakTime: builder.mutation<WorkingSession, { sessionId: string; breakMinutes: number }>({
      query: ({ sessionId, breakMinutes }) => ({
        url: `/api/sessions/${sessionId}/break`,
        method: 'POST',
        body: { breakMinutes },
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // Get all active sessions for a store (for managers)
    getActiveStoreSessions: builder.query<WorkingSession[], string>({
      query: (storeId) => `/api/sessions/store/${storeId}/active`,
      providesTags: ['WorkingSessions'],
    }),

    // Get all sessions for a store (including completed)
    getStoreSessions: builder.query<WorkingSession[], { storeId: string; date?: string }>({
      query: ({ storeId, date }) => {
        const params = date ? `?date=${date}` : '';
        return `/api/sessions/store/${storeId}${params}`;
      },
      providesTags: ['WorkingSessions'],
    }),

    // Get sessions by employee
    getEmployeeSessions: builder.query<WorkingSession[], { employeeId: string; startDate?: string; endDate?: string }>({
      query: ({ employeeId, startDate, endDate }) => {
        let params = '';
        if (startDate && endDate) {
          params = `?startDate=${startDate}&endDate=${endDate}`;
        }
        return `/api/sessions/employee/${employeeId}${params}`;
      },
      providesTags: ['Session'],
    }),

    // Approve a session (for managers)
    approveSession: builder.mutation<WorkingSession, string>({
      query: (sessionId) => ({
        url: `/api/sessions/${sessionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    // Reject a session (for managers)
    rejectSession: builder.mutation<WorkingSession, { sessionId: string; reason?: string }>({
      query: ({ sessionId, reason }) => ({
        url: `/api/sessions/${sessionId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['WorkingSessions'],
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
  useApproveSessionMutation,
  useRejectSessionMutation,
} = sessionApi;