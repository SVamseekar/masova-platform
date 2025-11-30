import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface DriverLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface DriverPerformance {
  driverId: string;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number; // in minutes
  onTimeDeliveryPercentage: number;
  totalDistanceCovered: number; // in km
  averageRating: number;
  totalEarnings: number;
  todayDeliveries: number;
  todayEarnings: number;
  weekDeliveries: number;
  weekEarnings: number;
  monthDeliveries: number;
  monthEarnings: number;
}

export interface DriverStats {
  totalDrivers: number;
  activeDrivers: number;
  onlineDrivers: number;
  offlineDrivers: number;
  availableDrivers: number;
  busyDrivers: number;
  totalDeliveriesToday: number;
  averageDeliveryTime: number;
}

export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  isAvailable: boolean;
  isOnline: boolean;
  currentLocation?: DriverLocation;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  activeDeliveryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDriverRequest {
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  isAvailable?: boolean;
}

export interface LocationUpdateRequest {
  driverId: string;
  location: DriverLocation;
  timestamp?: string;
}

// API Slice
export const driverApi = createApi({
  reducerPath: 'driverApi',
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
  tagTypes: ['Driver', 'DriverStats', 'DriverPerformance'],
  endpoints: (builder) => ({
    // Get all drivers
    getAllDrivers: builder.query<Driver[], void>({
      query: () => '/api/users/type/DRIVER',
      providesTags: ['Driver'],
    }),

    // Get driver by ID
    getDriverById: builder.query<Driver, string>({
      query: (id) => `/api/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'Driver', id }],
    }),

    // Get driver by user ID
    getDriverByUserId: builder.query<Driver, string>({
      query: (userId) => `/api/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'Driver', id: userId }],
    }),

    // Get online drivers
    getOnlineDrivers: builder.query<Driver[], void>({
      query: () => '/api/users/type/DRIVER?status=online',
      providesTags: ['Driver'],
    }),

    // Get available drivers
    getAvailableDrivers: builder.query<Driver[], void>({
      query: () => '/api/users/type/DRIVER?available=true',
      providesTags: ['Driver'],
    }),

    // Update driver
    updateDriver: builder.mutation<Driver, { id: string; data: UpdateDriverRequest }>({
      query: ({ id, data }) => ({
        url: `/api/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Driver', id }, 'Driver'],
    }),

    // Update driver location
    updateDriverLocation: builder.mutation<void, LocationUpdateRequest>({
      query: (data) => ({
        url: '/delivery/location-update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { driverId }) => [{ type: 'Driver', id: driverId }],
    }),

    // Get driver performance
    getDriverPerformance: builder.query<
      DriverPerformance,
      { driverId: string; startDate?: string; endDate?: string }
    >({
      query: ({ driverId, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/delivery/driver/${driverId}/performance?${params.toString()}`;
      },
      providesTags: (result, error, { driverId }) => [{ type: 'DriverPerformance', id: driverId }],
    }),

    // Get today's driver performance
    getTodayDriverPerformance: builder.query<DriverPerformance, string>({
      query: (driverId) => `/delivery/driver/${driverId}/performance/today`,
      providesTags: (result, error, driverId) => [{ type: 'DriverPerformance', id: driverId }],
    }),

    // Get driver stats
    getDriverStats: builder.query<DriverStats, void>({
      query: () => '/api/users/stats',
      providesTags: ['DriverStats'],
    }),

    // Activate driver
    activateDriver: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/users/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Driver', id }, 'Driver', 'DriverStats'],
    }),

    // Deactivate driver
    deactivateDriver: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/users/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Driver', id }, 'Driver', 'DriverStats'],
    }),
  }),
});

export const {
  useGetAllDriversQuery,
  useGetDriverByIdQuery,
  useGetDriverByUserIdQuery,
  useGetOnlineDriversQuery,
  useGetAvailableDriversQuery,
  useUpdateDriverMutation,
  useUpdateDriverLocationMutation,
  useGetDriverPerformanceQuery,
  useGetTodayDriverPerformanceQuery,
  useGetDriverStatsQuery,
  useActivateDriverMutation,
  useDeactivateDriverMutation,
} = driverApi;
