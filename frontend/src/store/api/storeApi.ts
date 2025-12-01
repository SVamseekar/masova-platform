import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeeklySchedule {
  MONDAY: TimeSlot & { isOpen: boolean };
  TUESDAY: TimeSlot & { isOpen: boolean };
  WEDNESDAY: TimeSlot & { isOpen: boolean };
  THURSDAY: TimeSlot & { isOpen: boolean };
  FRIDAY: TimeSlot & { isOpen: boolean };
  SATURDAY: TimeSlot & { isOpen: boolean };
  SUNDAY: TimeSlot & { isOpen: boolean };
}

export interface StoreOperatingConfig {
  weeklySchedule: WeeklySchedule;
  specialHours?: Array<{
    date: string;
    reason: string;
    isClosed: boolean;
    timeSlot?: TimeSlot;
  }>;
  deliveryRadiusKm?: number;
  maxConcurrentOrders?: number;
  estimatedPrepTimeMinutes?: number;
  acceptsOnlineOrders?: boolean;
  minimumOrderValueINR?: number;
}

export interface Store {
  id: string;
  name: string;
  storeCode: string;
  address: Address;
  phoneNumber?: string;
  regionId?: string;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  operatingConfig: StoreOperatingConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStoreRequest {
  name: string;
  storeCode: string;
  address: Address;
  phoneNumber?: string;
  regionId?: string;
  operatingConfig: StoreOperatingConfig;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  status?: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
}

export interface StoreMetrics {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeEmployees: number;
}

export const storeApi = createApi({
  reducerPath: 'storeApi',
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
  tagTypes: ['Store', 'Stores'],
  endpoints: (builder) => ({
    // Get store by ID
    getStore: builder.query<Store, string>({
      query: (storeId) => `/stores/${storeId}`,
      providesTags: (result, error, storeId) => [{ type: 'Store', id: storeId }],
    }),

    // Get store by code
    getStoreByCode: builder.query<Store, string>({
      query: (storeCode) => `/stores/code/${storeCode}`,
      providesTags: (result) => result ? [{ type: 'Store', id: result.id }] : [],
    }),

    // Get all active stores
    getActiveStores: builder.query<Store[], void>({
      query: () => `/stores`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Store' as const, id })), { type: 'Stores', id: 'LIST' }]
          : [{ type: 'Stores', id: 'LIST' }],
    }),

    // Get stores by region
    getStoresByRegion: builder.query<Store[], string>({
      query: (regionId) => `/stores/region/${regionId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Store' as const, id })), { type: 'Stores', id: 'LIST' }]
          : [{ type: 'Stores', id: 'LIST' }],
    }),

    // Find nearby stores
    getNearbyStores: builder.query<Store[], { latitude: number; longitude: number; radiusKm?: number }>({
      query: ({ latitude, longitude, radiusKm = 10 }) =>
        `/stores/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`,
      providesTags: [{ type: 'Stores', id: 'LIST' }],
    }),

    // Create new store
    createStore: builder.mutation<Store, CreateStoreRequest>({
      query: (data) => ({
        url: '/stores',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Stores', id: 'LIST' }],
    }),

    // Update store
    updateStore: builder.mutation<Store, { storeId: string; data: UpdateStoreRequest }>({
      query: ({ storeId, data }) => ({
        url: `/stores/${storeId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        { type: 'Stores', id: 'LIST' },
      ],
    }),

    // Get operational status (uses header-based store filtering)
    getOperationalStatus: builder.query<{ isOperational: boolean }, void>({
      query: () => `/stores/operational-status`,
      providesTags: [{ type: 'Store', id: 'CURRENT' }],
    }),

    // Get store metrics (uses header-based store filtering)
    getStoreMetrics: builder.query<StoreMetrics, void>({
      query: () => `/stores/metrics`,
      providesTags: [{ type: 'Store', id: 'CURRENT' }],
    }),
  }),
});

export const {
  useGetStoreQuery,
  useGetStoreByCodeQuery,
  useGetActiveStoresQuery,
  useGetStoresByRegionQuery,
  useGetNearbyStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useGetOperationalStatusQuery,
  useGetStoreMetricsQuery,
} = storeApi;
