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
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;

      // Add authorization token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add user context headers
      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      // Add selected store for managers/customers
      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  }),
  tagTypes: ['Session', 'WorkingSessions'],
  endpoints: (builder) => ({
    // Get current user's active session
    getCurrentSession: builder.query<WorkingSession | null, void>({
      query: () => `/users/sessions/current`,
      providesTags: ['Session'],
    }),

    // Start a new working session
    startSession: builder.mutation<WorkingSession, StartSessionRequest>({
      query: (data) => ({
        url: '/users/sessions/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // End current session
    endSession: builder.mutation<WorkingSession, void>({
      query: () => ({
        url: `/users/sessions/end`,
        method: 'POST',
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // Add break time to session
    addBreakTime: builder.mutation<WorkingSession, { employeeId: string; breakMinutes: number }>({
      query: ({ employeeId, breakMinutes }) => ({
        url: `/users/sessions/${employeeId}/break`,
        method: 'POST',
        body: { breakMinutes },
      }),
      invalidatesTags: ['Session', 'WorkingSessions'],
    }),

    // Get all active sessions for a store (for managers)
    getActiveStoreSessions: builder.query<WorkingSession[], void>({
      query: () => `/users/sessions/store/active`,
      providesTags: ['WorkingSessions'],
    }),

    // Get all sessions for a store (including completed)
    getStoreSessions: builder.query<WorkingSession[], { date?: string }>({
      query: ({ date }) => {
        const params = date ? `?date=${date}` : '';
        return `/users/sessions/store${params}`;
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
        return `/users/sessions/${employeeId}${params}`;
      },
      providesTags: ['Session'],
    }),

    // Get pending approval sessions
    getPendingApprovalSessions: builder.query<WorkingSession[], void>({
      query: () => `/users/sessions/pending-approval`,
      providesTags: ['WorkingSessions'],
    }),

    // Approve a session (for managers)
    approveSession: builder.mutation<WorkingSession, string>({
      query: (sessionId) => ({
        url: `/users/sessions/${sessionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    // Reject a session (for managers)
    rejectSession: builder.mutation<WorkingSession, { sessionId: string; reason?: string }>({
      query: ({ sessionId, reason }) => ({
        url: `/users/sessions/${sessionId}/reject`,
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