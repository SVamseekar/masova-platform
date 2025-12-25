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

interface DailyDataPoint {
  date: string;
  label: string;
  sales: number;
  orderCount: number;
  averageOrderValue: number;
}

interface SalesTrendResponse {
  period: 'WEEKLY' | 'MONTHLY';
  dataPoints: DailyDataPoint[];
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  percentChangeFromPreviousPeriod: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

interface OrderTypeData {
  orderType: string;
  count: number;
  sales: number;
  percentage: number;
  averageOrderValue: number;
}

interface OrderTypeBreakdownResponse {
  breakdown: OrderTypeData[];
  totalSales: number;
  totalOrders: number;
}

interface HourData {
  hour: number;
  label: string;
  orderCount: number;
  sales: number;
  averageOrderValue: number;
}

interface PeakHoursResponse {
  hourlyData: HourData[];
  peakHour: number;
  slowestHour: number;
  peakHourSales: number;
  peakHourOrders: number;
}

interface StaffRanking {
  rank: number;
  staffId: string;
  staffName: string;
  ordersProcessed: number;
  salesGenerated: number;
  averageOrderValue: number;
  performanceLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_IMPROVEMENT';
  percentOfTotalSales: number;
}

interface StaffLeaderboardResponse {
  rankings: StaffRanking[];
  period: string;
  totalStaff: number;
}

interface ProductData {
  rank: number;
  itemId: string;
  itemName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  unitPrice: number;
  percentOfTotalRevenue: number;
  trend: string;
}

interface TopProductsResponse {
  topProducts: ProductData[];
  period: string;
  sortBy: string;
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/analytics',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as any;
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
  // Cache analytics data for 60 seconds to avoid rate limiting
  keepUnusedDataFor: 60,
  tagTypes: ['Analytics', 'SalesMetrics', 'DriverStatus', 'StaffPerformance'],
  endpoints: (builder) => ({
    // Get today's sales metrics with comparisons
    getTodaySalesMetrics: builder.query<SalesMetricsResponse, string | undefined>({
      query: (storeId) => `sales/today${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    // Get average order value
    getAverageOrderValue: builder.query<AverageOrderValueResponse, string | undefined>({
      query: (storeId) => `avgOrderValue/today${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    // Get driver status
    getDriverStatus: builder.query<DriverStatusResponse, string | undefined>({
      query: (storeId) => `drivers/status${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'DriverStatus', id: storeId || 'DEFAULT' }],
    }),

    // Get staff performance
    getStaffPerformance: builder.query<StaffPerformanceResponse, string>({
      query: (staffId) => `staff/${staffId}/performance/today`,
      providesTags: ['StaffPerformance'],
    }),

    // Get sales trends (weekly or monthly)
    getSalesTrends: builder.query<SalesTrendResponse, { period: 'WEEKLY' | 'MONTHLY'; storeId?: string }>({
      query: ({ period, storeId }) => `sales/trends/${period}${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, { storeId }) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    // Get order type breakdown
    getOrderTypeBreakdown: builder.query<OrderTypeBreakdownResponse, string | undefined>({
      query: (storeId) => `sales/breakdown/order-type${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    // Get peak hours analysis
    getPeakHours: builder.query<PeakHoursResponse, string | undefined>({
      query: (storeId) => `sales/peak-hours${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Analytics', id: storeId || 'DEFAULT' }],
    }),

    // Get staff leaderboard
    getStaffLeaderboard: builder.query<StaffLeaderboardResponse, { storeId?: string; period: string }>({
      query: ({ storeId, period }) => {
        const params = new URLSearchParams();
        params.append('period', period);
        if (storeId) params.append('storeId', storeId);
        return `staff/leaderboard?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'StaffPerformance', id: storeId || 'DEFAULT' }],
    }),

    // Get top selling products
    getTopProducts: builder.query<TopProductsResponse, { storeId?: string; period: string; sortBy: string }>({
      query: ({ storeId, period, sortBy }) => {
        const params = new URLSearchParams();
        params.append('period', period);
        params.append('sortBy', sortBy);
        if (storeId) params.append('storeId', storeId);
        return `products/top-selling?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: storeId || 'DEFAULT' }],
    }),

    // Mutations
    clearAnalyticsCache: builder.mutation<{ status: string; message: string; storeId: string }, void>({
      query: () => ({
        url: 'cache/clear',
        method: 'POST',
      }),
      invalidatesTags: ['Analytics', 'SalesMetrics', 'DriverStatus', 'StaffPerformance'],
    }),
  }),
});

export const {
  useGetTodaySalesMetricsQuery,
  useGetAverageOrderValueQuery,
  useGetDriverStatusQuery,
  useGetStaffPerformanceQuery,
  useGetSalesTrendsQuery,
  useGetOrderTypeBreakdownQuery,
  useGetPeakHoursQuery,
  useGetStaffLeaderboardQuery,
  useGetTopProductsQuery,
  useClearAnalyticsCacheMutation,
} = analyticsApi;