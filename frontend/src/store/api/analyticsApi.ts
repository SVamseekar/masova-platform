import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface SalesMetricsResponse {
  todaySales: number;
  yesterdaySalesAtSameTime: number;
  lastYearSameDaySales: number;
  todayOrderCount: number;
  yesterdayOrderCountAtSameTime: number;
  lastYearSameDayOrderCount: number;
  percentChangeFromYesterday: number;
  percentChangeFromLastYear: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

interface AverageOrderValueResponse {
  averageOrderValue: number;
  yesterdayAverageOrderValue: number;
  percentChange: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  totalOrders: number;
  totalSales: number;
}

interface DriverStatusResponse {
  totalDrivers: number;
  availableDrivers: number;
  busyDrivers: number;
  activeDeliveries: number;
  completedTodayDeliveries: number;
}

interface StaffPerformanceResponse {
  staffId: string;
  staffName: string;
  ordersProcessedToday: number;
  salesGeneratedToday: number;
  averageOrderValue: number;
  rank: number;
  performanceLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_IMPROVEMENT';
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/analytics',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Analytics', 'SalesMetrics', 'DriverStatus', 'StaffPerformance'],
  endpoints: (builder) => ({
    // Get today's sales metrics with comparisons
    getTodaySalesMetrics: builder.query<SalesMetricsResponse, string>({
      query: (storeId) => `store/${storeId}/sales/today`,
      providesTags: ['SalesMetrics'],
    }),

    // Get average order value
    getAverageOrderValue: builder.query<AverageOrderValueResponse, string>({
      query: (storeId) => `store/${storeId}/avgOrderValue/today`,
      providesTags: ['SalesMetrics'],
    }),

    // Get driver status
    getDriverStatus: builder.query<DriverStatusResponse, string>({
      query: (storeId) => `drivers/status/${storeId}`,
      providesTags: ['DriverStatus'],
    }),

    // Get staff performance
    getStaffPerformance: builder.query<StaffPerformanceResponse, string>({
      query: (staffId) => `staff/${staffId}/performance/today`,
      providesTags: ['StaffPerformance'],
    }),
  }),
});

export const {
  useGetTodaySalesMetricsQuery,
  useGetAverageOrderValueQuery,
  useGetDriverStatusQuery,
  useGetStaffPerformanceQuery,
} = analyticsApi;