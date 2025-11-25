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

export interface RouteOptimizationRequest {
  origin: DeliveryLocation;
  destination: DeliveryLocation;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

export interface RouteSegment {
  distance: number; // in meters
  duration: number; // in seconds
  instruction: string;
}

export interface RouteOptimizationResponse {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
  segments: RouteSegment[];
  estimatedArrival: string;
}

export interface AutoDispatchRequest {
  orderId: string;
  pickupLocation: DeliveryLocation;
  deliveryLocation: DeliveryLocation;
  priorityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface AutoDispatchResponse {
  orderId: string;
  assignedDriverId: string;
  driverName: string;
  driverPhone: string;
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  distance: number;
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
  location: DeliveryLocation;
  timestamp?: string;
  speed?: number;
  accuracy?: number;
}

// API Slice
export const deliveryApi = createApi({
  reducerPath: 'deliveryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Delivery', 'Tracking', 'Metrics'],
  endpoints: (builder) => ({
    // Auto-dispatch driver to order
    autoDispatch: builder.mutation<AutoDispatchResponse, AutoDispatchRequest>({
      query: (data) => ({
        url: '/delivery/auto-dispatch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Delivery', 'Metrics'],
    }),

    // Get optimized route
    getOptimizedRoute: builder.mutation<RouteOptimizationResponse, RouteOptimizationRequest>({
      query: (data) => ({
        url: '/delivery/route-optimize',
        method: 'POST',
        body: data,
      }),
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
    getTodayMetrics: builder.query<DeliveryMetrics, void>({
      query: () => '/delivery/metrics/today',
      providesTags: ['Metrics'],
    }),
  }),
});

export const {
  useAutoDispatchMutation,
  useGetOptimizedRouteMutation,
  useUpdateLocationMutation,
  useTrackOrderQuery,
  useGetETAQuery,
  useGetDeliveryMetricsQuery,
  useGetTodayMetricsQuery,
} = deliveryApi;
