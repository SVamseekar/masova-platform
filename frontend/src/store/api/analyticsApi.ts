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

    // Get sales trends (weekly or monthly)
    getSalesTrends: builder.query<SalesTrendResponse, { storeId: string; period: 'WEEKLY' | 'MONTHLY' }>({
      query: ({ storeId, period }) => `sales/trends/${period}?storeId=${storeId}`,
      providesTags: ['SalesMetrics'],
    }),

    // Get order type breakdown
    getOrderTypeBreakdown: builder.query<OrderTypeBreakdownResponse, string>({
      query: (storeId) => `sales/breakdown/order-type?storeId=${storeId}`,
      providesTags: ['SalesMetrics'],
    }),

    // Get peak hours analysis
    getPeakHours: builder.query<PeakHoursResponse, string>({
      query: (storeId) => `sales/peak-hours?storeId=${storeId}`,
      providesTags: ['Analytics'],
    }),

    // Get staff leaderboard
    getStaffLeaderboard: builder.query<StaffLeaderboardResponse, { storeId: string; period: string }>({
      query: ({ storeId, period }) => `staff/leaderboard?storeId=${storeId}&period=${period}`,
      providesTags: ['StaffPerformance'],
    }),

    // Get top selling products
    getTopProducts: builder.query<TopProductsResponse, { storeId: string; period: string; sortBy: string }>({
      query: ({ storeId, period, sortBy }) => `products/top-selling?storeId=${storeId}&period=${period}&sortBy=${sortBy}`,
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