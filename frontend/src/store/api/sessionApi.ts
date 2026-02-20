import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface WorkingSession {
  id: string;
  employeeId: string;
  employeeName: string;  // Changed from 'name' to match backend
  role: string;
  storeId: string;
  loginTime: string;
  logoutTime?: string;
  currentDuration?: string;
  totalHours?: number;
  breakTime?: number;  // Made optional
  breakDurationMinutes?: number;  // Backend uses this field name
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING_APPROVAL' | 'AUTO_CLOSED';
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
    getActiveStoreSessions: builder.query<WorkingSession[], string | undefined>({
      query: (storeId) => `/users/sessions/store/active${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'WorkingSessions', id: storeId || 'DEFAULT' }],
    }),

    // Get all sessions for a store (including completed)
    getStoreSessions: builder.query<WorkingSession[], { date?: string }>({
      query: ({ date }) => {
        // Backend expects startDate and endDate, so use the same date for both to get sessions for a single day
        const params = date ? `?startDate=${date}&endDate=${date}` : '';
        return `/users/sessions/store${params}`;
      },
      providesTags: ['WorkingSessions'],
    }),

    // Get sessions by employee
    getEmployeeSessions: builder.query<WorkingSession[], { employeeId: string; startDate?: string; endDate?: string; page?: number; size?: number }>({
      query: ({ employeeId, startDate, endDate, page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', page.toString());
        params.append('size', size.toString());
        return `/users/sessions/${employeeId}?${params.toString()}`;
      },
      providesTags: ['Session'],
    }),

    // Get pending approval sessions
    getPendingApprovalSessions: builder.query<WorkingSession[], string | undefined>({
      query: (storeId) => `/users/sessions/pending-approval${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'WorkingSessions', id: storeId || 'DEFAULT' }],
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

    // Clock in employee with PIN (manager initiated) - Phase 2
    clockInWithPin: builder.mutation<{ message: string; session: WorkingSession }, { employeeId: string; pin: string }>({
      query: ({ employeeId, pin }) => ({
        url: '/users/sessions/clock-in-with-pin',
        method: 'POST',
        body: { employeeId, pin },
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    // Clock out employee (manager initiated) - Phase 2
    clockOutEmployee: builder.mutation<{ message: string; session: WorkingSession }, { employeeId: string }>({
      query: ({ employeeId }) => ({
        url: '/users/sessions/clock-out-employee',
        method: 'POST',
        body: { employeeId },
      }),
      invalidatesTags: ['WorkingSessions'],
    }),

    // Get employee session report (hours summary) - Phase 3
    getEmployeeSessionReport: builder.query<WorkingSession[], { employeeId: string; startDate: string; endDate: string }>({
      query: ({ employeeId, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/users/sessions/${employeeId}/report?${params.toString()}`;
      },
      providesTags: (result, error, { employeeId }) => [{ type: 'Session', id: employeeId }],
    }),

    // Get employee session status (current clock-in state) - Phase 3
    getEmployeeSessionStatus: builder.query<WorkingSession | null, string>({
      query: (employeeId) => `/users/sessions/${employeeId}/status`,
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

// Phase 3: Alias for break recording (same as addBreakTime)
export const useRecordBreakMutation = useAddBreakTimeMutation;