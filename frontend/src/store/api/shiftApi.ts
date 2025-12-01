import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Shift {
  id: string;
  storeId: string;
  employeeId: string;
  type: 'OPENING' | 'CLOSING' | 'PEAK' | 'REGULAR' | 'MAINTENANCE' | 'TRAINING' | 'EMERGENCY';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  roleRequired?: string;
  isMandatory: boolean;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateShiftRequest {
  storeId: string;
  employeeId: string;
  type: 'OPENING' | 'CLOSING' | 'PEAK' | 'REGULAR' | 'MAINTENANCE' | 'TRAINING' | 'EMERGENCY';
  scheduledStart: string;
  scheduledEnd: string;
  roleRequired?: string;
  isMandatory?: boolean;
  notes?: string;
}

export interface UpdateShiftRequest extends Partial<CreateShiftRequest> {
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
}

export interface ShiftCoverage {
  storeId: string;
  date: string;
  totalShifts: number;
  confirmedShifts: number;
  coveragePercentage: number;
  uncoveredSlots: TimeSlot[];
}

export const shiftApi = createApi({
  reducerPath: 'shiftApi',
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
  tagTypes: ['Shift', 'Shifts', 'ShiftCoverage'],
  endpoints: (builder) => ({
    // Create new shift
    createShift: builder.mutation<Shift, CreateShiftRequest>({
      query: (data) => ({
        url: '/shifts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Shifts', id: 'LIST' }, 'ShiftCoverage'],
    }),

    // Get shift by ID
    getShift: builder.query<Shift, string>({
      query: (shiftId) => `/shifts/${shiftId}`,
      providesTags: (result, error, shiftId) => [{ type: 'Shift', id: shiftId }],
    }),

    // Update shift
    updateShift: builder.mutation<Shift, { shiftId: string; data: UpdateShiftRequest }>({
      query: ({ shiftId, data }) => ({
        url: `/shifts/${shiftId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { shiftId }) => [
        { type: 'Shift', id: shiftId },
        { type: 'Shifts', id: 'LIST' },
        'ShiftCoverage',
      ],
    }),

    // Cancel/Delete shift
    deleteShift: builder.mutation<void, string>({
      query: (shiftId) => ({
        url: `/shifts/${shiftId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, shiftId) => [
        { type: 'Shift', id: shiftId },
        { type: 'Shifts', id: 'LIST' },
        'ShiftCoverage',
      ],
    }),

    // Get employee shifts
    getEmployeeShifts: builder.query<Shift[], { employeeId: string; startDate?: string; endDate?: string }>({
      query: ({ employeeId, startDate, endDate }) => {
        let url = `/shifts/employee/${employeeId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Shift' as const, id })), { type: 'Shifts', id: 'LIST' }]
          : [{ type: 'Shifts', id: 'LIST' }],
    }),

    // Get store shifts
    getStoreShifts: builder.query<Shift[], { storeId: string; startDate?: string; endDate?: string }>({
      query: ({ storeId, startDate, endDate }) => {
        let url = `/shifts/store/${storeId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Shift' as const, id })), { type: 'Shifts', id: 'LIST' }]
          : [{ type: 'Shifts', id: 'LIST' }],
    }),

    // Get current shift for employee
    getCurrentShift: builder.query<Shift | null, string>({
      query: (employeeId) => `/shifts/employee/${employeeId}/current`,
      providesTags: (result) => (result ? [{ type: 'Shift', id: result.id }] : []),
    }),

    // Confirm shift attendance
    confirmShift: builder.mutation<Shift, string>({
      query: (shiftId) => ({
        url: `/shifts/${shiftId}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, shiftId) => [
        { type: 'Shift', id: shiftId },
        { type: 'Shifts', id: 'LIST' },
      ],
    }),

    // Start shift
    startShift: builder.mutation<Shift, string>({
      query: (shiftId) => ({
        url: `/shifts/${shiftId}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, shiftId) => [
        { type: 'Shift', id: shiftId },
        { type: 'Shifts', id: 'LIST' },
      ],
    }),

    // Complete shift
    completeShift: builder.mutation<Shift, string>({
      query: (shiftId) => ({
        url: `/shifts/${shiftId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, shiftId) => [
        { type: 'Shift', id: shiftId },
        { type: 'Shifts', id: 'LIST' },
        'ShiftCoverage',
      ],
    }),

    // Get shift coverage
    getShiftCoverage: builder.query<ShiftCoverage, { storeId: string; date?: string }>({
      query: ({ storeId, date }) => {
        let url = `/shifts/store/${storeId}/coverage`;
        if (date) {
          url += `?date=${date}`;
        }
        return url;
      },
      providesTags: ['ShiftCoverage'],
    }),
  }),
});

export const {
  useCreateShiftMutation,
  useGetShiftQuery,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetEmployeeShiftsQuery,
  useGetStoreShiftsQuery,
  useGetCurrentShiftQuery,
  useConfirmShiftMutation,
  useStartShiftMutation,
  useCompleteShiftMutation,
  useGetShiftCoverageQuery,
} = shiftApi;
