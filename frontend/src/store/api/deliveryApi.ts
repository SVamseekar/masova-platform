import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface DeliveryLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
}

// AddressDTO format matching backend
export interface AddressDTO {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
}

export interface RouteOptimizationRequest {
  origin: AddressDTO;
  destination: AddressDTO;
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver?: string;
}

// Backend response format
export interface RouteOptimizationResponse {
  distanceKm: number;
  durationMinutes: number;
  polyline: string;
  steps: RouteStep[];
  startLocation?: AddressDTO;
  endLocation?: AddressDTO;
  // Computed fields for frontend convenience
  distance: number; // in meters (computed from distanceKm)
  duration: number; // in seconds (computed from durationMinutes)
  segments: RouteSegment[]; // mapped from steps for backward compatibility
  estimatedArrival?: string;
}

// Legacy format for backward compatibility
export interface RouteSegment {
  distance: number; // in meters
  duration: number; // in seconds
  instruction: string;
}

export interface DeliveryZoneCheck {
  inZone: boolean;
  zoneName?: string;
  zoneId?: string;
  distanceKm?: number;
}

export interface DeliveryZoneFee {
  fee: number;
  currency?: string;
  zoneName?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  fee: number;
}

export interface DeliveryOtpResponse {
  otp: string;
  expiresAt: string;
}

export interface DeliveryActionResponse {
  success: boolean;
  message?: string;
}

export interface DriverPerformance {
  driverId: string;
  totalDeliveries: number;
  completedDeliveries: number;
  avgRating?: number;
  avgDeliveryTimeMinutes?: number;
  onTimeRate?: number;
}

export interface DriverStatus {
  driverId: string;
  status: 'AVAILABLE' | 'ONLINE' | 'BUSY' | 'OFFLINE';
  activeDeliveries?: number;
  lastUpdated?: string;
}

export interface DriverDelivery {
  id: string;
  orderId: string;
  status: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  estimatedArrival?: string;
}

// Available driver for manual assignment
export interface AvailableDriver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  rating?: number;
  activeDeliveries?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  status?: string;
}

export interface AutoDispatchRequest {
  orderId: string;
  storeId: string;
  // Frontend format - GeoJSON Point
  pickupLocation?: DeliveryLocation;
  deliveryLocation?: DeliveryLocation;
  // Backend format - AddressDTO
  deliveryAddress?: AddressDTO;
  priorityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  preferredDriverId?: string; // For manual driver assignment
}

export interface AutoDispatchResponse {
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  distanceToPickup?: number;
  estimatedPickupTime?: number; // in minutes
  estimatedDeliveryTime?: number; // in minutes
  assignedAt?: string;
  dispatchMethod?: 'AUTO' | 'MANUAL';
  status?: string;
}

export interface TrackingResponse {
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  currentLocation: DeliveryLocation;
  destination: DeliveryLocation;
  status: string;
  estimatedArrival: string;
  distanceRemaining: number; // in meters
  lastUpdated: string;
  orderType?: 'DELIVERY' | 'PICKUP' | 'DINE_IN'; // Order type to restrict tracking
  deliveryOtp?: string; // Shown to customer when status is DISPATCHED
}

export interface ETAResponse {
  orderId: string;
  estimatedArrival: string;
  distanceRemaining: number;
  timeRemaining: number; // in minutes
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  activeDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number;
  averageDeliveryDistance: number;
  onTimeDeliveryRate: number;
  customerSatisfactionRate: number;
}

export interface LocationUpdateRequest {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

// API Slice
export const deliveryApi = createApi({
  reducerPath: 'deliveryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
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

      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Delivery', 'Tracking', 'Metrics', 'Drivers', 'Order', 'Orders', 'Zone'],
  endpoints: (builder) => ({
    // Get available drivers for manual assignment
    getAvailableDrivers: builder.query<AvailableDriver[], string>({
      query: (storeId) => `/delivery/drivers/available?storeId=${storeId}`,
      providesTags: ['Drivers'],
    }),

    // Auto-dispatch driver to order
    autoDispatch: builder.mutation<AutoDispatchResponse, AutoDispatchRequest>({
      query: (data) => ({
        url: '/delivery/auto-dispatch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'Delivery',
        'Metrics',
        { type: 'Order', id: arg.orderId },
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: arg.storeId },
      ],
    }),

    // Get optimized route (DELIV-004: Real navigation)
    getOptimizedRoute: builder.mutation<RouteOptimizationResponse, RouteOptimizationRequest>({
      query: (data) => ({
        url: '/delivery/route-optimize',
        method: 'POST',
        body: data,
      }),
      // Transform backend response to include computed fields for frontend convenience
      transformResponse: (response: any): RouteOptimizationResponse => {
        const distanceMeters = (response.distanceKm || 0) * 1000;
        const durationSeconds = (response.durationMinutes || 0) * 60;

        // Map steps to segments for backward compatibility
        const segments: RouteSegment[] = (response.steps || []).map((step: any) => ({
          distance: step.distanceMeters || 0,
          duration: step.durationSeconds || 0,
          instruction: step.instruction || '',
        }));

        // Calculate estimated arrival if not provided
        const estimatedArrival = response.estimatedArrival ||
          new Date(Date.now() + durationSeconds * 1000).toISOString();

        return {
          ...response,
          distance: distanceMeters,
          duration: durationSeconds,
          segments,
          estimatedArrival,
        };
      },
    }),

    // Update driver location
    updateLocation: builder.mutation<void, LocationUpdateRequest>({
      query: (data) => ({
        url: '/delivery/location-update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tracking'],
    }),

    // Track order
    trackOrder: builder.query<TrackingResponse, string>({
      query: (orderId) => `/delivery/track/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Tracking', id: orderId }],
    }),

    // Get ETA
    getETA: builder.query<ETAResponse, string>({
      query: (orderId) => `/delivery/eta/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Tracking', id: orderId }],
    }),

    // Get delivery metrics
    getDeliveryMetrics: builder.query<DeliveryMetrics, { startDate?: string; endDate?: string }>({
      query: ({ startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/delivery/metrics?${params.toString()}`;
      },
      providesTags: ['Metrics'],
    }),

    // Get today's metrics
    getTodayMetrics: builder.query<DeliveryMetrics, string | undefined>({
      query: (storeId) => `/delivery/metrics/today${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Metrics', id: storeId || 'DEFAULT' }],
    }),

    // Driver performance
    getDriverPerformance: builder.query<DriverPerformance, string>({
      query: (driverId) => `/delivery/driver/${driverId}/performance`,
      providesTags: (result, error, driverId) => [{ type: 'Drivers', id: driverId }],
    }),

    getDriverPerformanceToday: builder.query<DriverPerformance, string>({
      query: (driverId) => `/delivery/driver/${driverId}/performance/today`,
      providesTags: (result, error, driverId) => [{ type: 'Drivers', id: driverId }],
    }),

    getDriverStatus: builder.query<DriverStatus, string>({
      query: (driverId) => `/delivery/driver/${driverId}/status`,
      providesTags: (result, error, driverId) => [{ type: 'Drivers', id: driverId }],
    }),

    getDriverPendingDeliveries: builder.query<DriverDelivery[], string>({
      query: (driverId) => `/delivery/driver/${driverId}/pending`,
      providesTags: (result, error, driverId) => [{ type: 'Drivers', id: driverId }],
    }),

    // Delivery zone operations
    checkDeliveryZone: builder.query<DeliveryZoneCheck, { latitude: number; longitude: number }>({
      query: ({ latitude, longitude }) =>
        `/delivery/zone/check?latitude=${latitude}&longitude=${longitude}`,
      providesTags: ['Zone'],
    }),

    getDeliveryZoneFee: builder.query<DeliveryZoneFee, { latitude: number; longitude: number }>({
      query: ({ latitude, longitude }) =>
        `/delivery/zone/fee?latitude=${latitude}&longitude=${longitude}`,
      providesTags: ['Zone'],
    }),

    listDeliveryZones: builder.query<DeliveryZone[], void>({
      query: () => '/delivery/zone/list',
      providesTags: ['Zone'],
    }),

    validateDeliveryZone: builder.query<DeliveryZoneCheck, { latitude: number; longitude: number }>({
      query: ({ latitude, longitude }) =>
        `/delivery/zone/validate?latitude=${latitude}&longitude=${longitude}`,
      providesTags: ['Zone'],
    }),

    // Delivery operations
    acceptDelivery: builder.mutation<DeliveryActionResponse, { orderId: string; driverId: string }>({
      query: (data) => ({
        url: '/delivery/accept',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Delivery', 'Drivers'],
    }),

    rejectDelivery: builder.mutation<DeliveryActionResponse, { orderId: string; driverId: string; reason: string }>({
      query: (data) => ({
        url: '/delivery/reject',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Delivery', 'Drivers'],
    }),

    // OTP operations
    generateDeliveryOTP: builder.mutation<DeliveryOtpResponse, string>({
      query: (orderId) => ({
        url: `/delivery/${orderId}/generate-otp`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [{ type: 'Tracking', id: orderId }],
    }),

    regenerateDeliveryOTP: builder.mutation<DeliveryOtpResponse, string>({
      query: (orderId) => ({
        url: `/delivery/${orderId}/regenerate-otp`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [{ type: 'Tracking', id: orderId }],
    }),
  }),
});

export const {
  useGetAvailableDriversQuery,
  useAutoDispatchMutation,
  useGetOptimizedRouteMutation,
  useUpdateLocationMutation,
  useTrackOrderQuery,
  useGetETAQuery,
  useGetDeliveryMetricsQuery,
  useGetTodayMetricsQuery,
  useGetDriverPerformanceQuery,
  useGetDriverPerformanceTodayQuery,
  useGetDriverStatusQuery,
  useGetDriverPendingDeliveriesQuery,
  useCheckDeliveryZoneQuery,
  useGetDeliveryZoneFeeQuery,
  useListDeliveryZonesQuery,
  useValidateDeliveryZoneQuery,
  useAcceptDeliveryMutation,
  useRejectDeliveryMutation,
  useGenerateDeliveryOTPMutation,
  useRegenerateDeliveryOTPMutation,
} = deliveryApi;
