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
  tagTypes: ['Analytics', 'SalesMetrics', 'DriverStatus', 'StaffPerformance'],
  endpoints: (builder) => ({
    // Get today's sales metrics with comparisons
    getTodaySalesMetrics: builder.query<SalesMetricsResponse, void>({
      query: () => `sales/today`,
      providesTags: ['SalesMetrics'],
    }),

    // Get average order value
    getAverageOrderValue: builder.query<AverageOrderValueResponse, void>({
      query: () => `avgOrderValue/today`,
      providesTags: ['SalesMetrics'],
    }),

    // Get driver status
    getDriverStatus: builder.query<DriverStatusResponse, void>({
      query: () => `drivers/status`,
      providesTags: ['DriverStatus'],
    }),

    // Get staff performance
    getStaffPerformance: builder.query<StaffPerformanceResponse, string>({
      query: (staffId) => `staff/${staffId}/performance/today`,
      providesTags: ['StaffPerformance'],
    }),

    // Get sales trends (weekly or monthly)
    getSalesTrends: builder.query<SalesTrendResponse, { period: 'WEEKLY' | 'MONTHLY' }>({
      query: ({ period }) => `sales/trends/${period}`,
      providesTags: ['SalesMetrics'],
    }),

    // Get order type breakdown
    getOrderTypeBreakdown: builder.query<OrderTypeBreakdownResponse, void>({
      query: () => `sales/breakdown/order-type`,
      providesTags: ['SalesMetrics'],
    }),

    // Get peak hours analysis
    getPeakHours: builder.query<PeakHoursResponse, void>({
      query: () => `sales/peak-hours`,
      providesTags: ['Analytics'],
    }),

    // Get staff leaderboard
    getStaffLeaderboard: builder.query<StaffLeaderboardResponse, { period: string }>({
      query: ({ period }) => `staff/leaderboard?period=${period}`,
      providesTags: ['StaffPerformance'],
    }),

    // Get top selling products
    getTopProducts: builder.query<TopProductsResponse, { period: string; sortBy: string }>({
      query: ({ period, sortBy }) => `products/top-selling?period=${period}&sortBy=${sortBy}`,
      providesTags: ['Analytics'],
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
} = analyticsApi;