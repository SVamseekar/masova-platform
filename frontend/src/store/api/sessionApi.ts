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
    baseUrl: API_CONFIG.USER_SERVICE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      const user = (getState() as RootState).auth.user;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      // Add required headers for backend
      if (user) {
        headers.set('X-User-Id', user.id);
        if (user.storeId) {
          headers.set('X-Store-Id', user.storeId);
        }
      }

      return headers;
    },
  }),
  tagTypes: ['Session', 'WorkingSessions'],
  endpoints: (builder) => ({
    // Get current user's active session
    getCurrentSession: builder.query<WorkingSession | null, void>({
      query: () => `/api/users/sessions/current`,
      providesTags: ['Session'],
    }),

    // Start a new working session
    startSession: builder.mutation<WorkingSession, StartSessionRequest>({
      query: (data) => ({
        url: '/api/users/sessions/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // End current session
    endSession: builder.mutation<WorkingSession, void>({
      query: () => ({
        url: `/api/users/sessions/end`,
        method: 'POST',
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // Add break time to session
    addBreakTime: builder.mutation<WorkingSession, { employeeId: string; breakMinutes: number }>({
      query: ({ employeeId, breakMinutes }) => ({
        url: `/api/users/sessions/${employeeId}/break`,
        method: 'POST',
        body: { breakMinutes },
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // Get all active sessions for a store (for managers)
    getActiveStoreSessions: builder.query<WorkingSession[], string>({
      query: (storeId) => `/api/users/sessions/store/${storeId}/active`,
      providesTags: ['WorkingSessions'],
    }),

    // Get all sessions for a store (including completed)
    getStoreSessions: builder.query<WorkingSession[], { storeId: string; date?: string }>({
      query: ({ storeId, date }) => {
        const params = date ? `?date=${date}` : '';
        return `/api/users/sessions/store/${storeId}${params}`;
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
        return `/api/users/sessions/${employeeId}${params}`;
      },
      providesTags: ['Session'],
    }),

    // Get pending approval sessions
    getPendingApprovalSessions: builder.query<WorkingSession[], void>({
      query: () => `/api/users/sessions/pending-approval`,
      providesTags: ['WorkingSessions'],
    }),

    // Approve a session (for managers)
    approveSession: builder.mutation<WorkingSession, string>({
      query: (sessionId) => ({
        url: `/api/users/sessions/${sessionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    // Reject a session (for managers)
    rejectSession: builder.mutation<WorkingSession, { sessionId: string; reason?: string }>({
      query: ({ sessionId, reason }) => ({
        url: `/api/users/sessions/${sessionId}/reject`,
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
  useGetPendingApprovalSessionsQuery,
  useApproveSessionMutation,
  useRejectSessionMutation,
} = sessionApi;