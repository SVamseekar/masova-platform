import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
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
  areaManagerId?: string;
  status: 'ACTIVE' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED' | 'UNDER_RENOVATION' | 'PENDING_APPROVAL';
  operatingConfig: StoreOperatingConfig;
  openingDate?: string;
  createdAt?: string;
  lastModified?: string;
}

export interface CreateStoreRequest {
  name: string;
  storeCode: string;
  address: Address;
  phoneNumber?: string;
  regionId?: string;
  areaManagerId?: string;
  operatingConfig: StoreOperatingConfig;
  openingDate?: string;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  status?: 'ACTIVE' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED' | 'UNDER_RENOVATION' | 'PENDING_APPROVAL';
}

export interface StoreMetrics {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeEmployees: number;
}

export interface DeliveryRadiusCheckResult {
  withinRadius: boolean;
  storeId: string;
  deliveryRadiusKm: number;
  latitude: number;
  longitude: number;
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

    // Get all active stores (public - no auth required)
    getActiveStores: builder.query<Store[], void>({
      query: () => `/stores/public`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Store' as const, id })), { type: 'Stores', id: 'LIST' }]
          : [{ type: 'Stores', id: 'LIST' }],
    }),

    // Get all active stores (protected - auth required)
    getActiveStoresProtected: builder.query<Store[], void>({
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

    // Check if a location is within a store's delivery radius
    checkDeliveryRadius: builder.query<DeliveryRadiusCheckResult, { storeId: string; latitude: number; longitude: number }>({
      query: ({ storeId, latitude, longitude }) =>
        `/stores/${storeId}/delivery-radius-check?latitude=${latitude}&longitude=${longitude}`,
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

    // Get store metrics
    // Takes storeId as parameter to ensure refetch when store changes
    getStoreMetrics: builder.query<StoreMetrics, string | undefined>({
      query: (storeId) => `/stores/metrics${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (_result, _error, storeId) => [{ type: 'Store', id: storeId || 'DEFAULT' }],
    }),
  }),
});

export const {
  useGetStoreQuery,
  useGetStoreByCodeQuery,
  useGetActiveStoresQuery,
  useGetActiveStoresProtectedQuery,
  useGetStoresByRegionQuery,
  useGetNearbyStoresQuery,
  useCheckDeliveryRadiusQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useGetOperationalStatusQuery,
  useGetStoreMetricsQuery,
} = storeApi;
