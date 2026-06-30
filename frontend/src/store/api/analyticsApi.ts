import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

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

interface SalesForecast {
  date: string;
  forecastedSales: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

interface SalesForecastResponse {
  forecasts: SalesForecast[];
  algorithm: string;
  accuracy: number;
  period: string;
}

interface CustomerBehaviorPattern {
  pattern: string;
  frequency: number;
  averageOrderValue: number;
  peakTime: string;
  segment: string;
}

interface CustomerBehaviorResponse {
  patterns: CustomerBehaviorPattern[];
  totalCustomers: number;
  segmentation: Record<string, number>;
}

interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  lastOrderDate: string;
  daysSinceLastOrder: number;
  totalOrders: number;
  totalSpent: number;
}

interface ChurnPredictionResponse {
  predictions: ChurnPrediction[];
  totalAtRisk: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

interface DemandForecast {
  itemId: string;
  itemName: string;
  forecastedDemand: number;
  currentStock: number;
  recommendedReorder: number;
  confidence: number;
}

interface DemandForecastResponse {
  forecasts: DemandForecast[];
  period: string;
  accuracy: number;
}

interface CostAnalysis {
  category: string;
  totalCost: number;
  percentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  monthlyAverage: number;
}

interface CostAnalysisResponse {
  breakdown: CostAnalysis[];
  totalCosts: number;
  profitMargin: number;
  period: string;
}

interface ExecutiveSummary {
  revenue: {
    total: number;
    change: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
  orders: {
    total: number;
    change: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
  customers: {
    new: number;
    returning: number;
    atRisk: number;
  };
  performance: {
    avgOrderValue: number;
    customerSatisfaction: number;
    deliveryOnTime: number;
  };
  topInsights: string[];
  alerts: string[];
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart?.selectedStoreId;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
        if (user.storeId) {
          headers.set('X-User-Store-Id', user.storeId);
        }
      }

      if (selectedStoreId) {
        headers.set('X-Selected-Store-Id', selectedStoreId);
      }

      return headers;
    },
  }),
  keepUnusedDataFor: 60,
  tagTypes: ['Analytics', 'SalesMetrics', 'DriverStatus', 'StaffPerformance'],
  endpoints: (builder) => ({
    getTodaySalesMetrics: builder.query<SalesMetricsResponse, string | undefined>({
      query: () => '/analytics?type=sales',
      providesTags: (result, error, storeId) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    getAverageOrderValue: builder.query<AverageOrderValueResponse, string | undefined>({
      query: () => '/analytics?type=aov',
      providesTags: (result, error, storeId) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    getDriverStatus: builder.query<DriverStatusResponse, string | undefined>({
      query: () => '/analytics?type=drivers',
      providesTags: (result, error, storeId) => [{ type: 'DriverStatus', id: storeId || 'DEFAULT' }],
    }),

    getStaffPerformance: builder.query<StaffPerformanceResponse, string>({
      query: (staffId) => `/analytics?type=staff-performance&staffId=${encodeURIComponent(staffId)}`,
      providesTags: ['StaffPerformance'],
    }),

    getSalesTrends: builder.query<SalesTrendResponse, { period: 'WEEKLY' | 'MONTHLY'; storeId?: string }>({
      query: ({ period }) => `/analytics?type=sales-trends&period=${period}`,
      providesTags: (result, error, { storeId }) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    getOrderTypeBreakdown: builder.query<OrderTypeBreakdownResponse, string | undefined>({
      query: () => '/analytics?type=order-breakdown',
      providesTags: (result, error, storeId) => [{ type: 'SalesMetrics', id: storeId || 'DEFAULT' }],
    }),

    getPeakHours: builder.query<PeakHoursResponse, string | undefined>({
      query: () => '/analytics?type=peak-hours',
      providesTags: (result, error, storeId) => [{ type: 'Analytics', id: storeId || 'DEFAULT' }],
    }),

    getStaffLeaderboard: builder.query<StaffLeaderboardResponse, { storeId?: string; period: string }>({
      query: ({ period }) => `/analytics?type=staff-leaderboard&period=${encodeURIComponent(period)}`,
      providesTags: (result, error, { storeId }) => [{ type: 'StaffPerformance', id: storeId || 'DEFAULT' }],
    }),

    getTopProducts: builder.query<TopProductsResponse, { storeId?: string; period: string; sortBy: string }>({
      query: ({ period, sortBy }) =>
        `/analytics?type=top-products&period=${encodeURIComponent(period)}&sortBy=${encodeURIComponent(sortBy)}`,
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: storeId || 'DEFAULT' }],
    }),

    getSalesForecast: builder.query<SalesForecastResponse, { storeId?: string; days?: number; period?: string }>({
      query: ({ days = 7, period = 'WEEKLY' }) =>
        `/bi?type=sales-forecast&days=${days}&period=${encodeURIComponent(period)}`,
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `FORECAST_${storeId || 'DEFAULT'}` }],
    }),

    getCustomerBehaviorAnalysis: builder.query<CustomerBehaviorResponse, string | undefined>({
      query: () => '/bi?type=customer-behavior',
      providesTags: (result, error, storeId) => [{ type: 'Analytics', id: `BEHAVIOR_${storeId || 'DEFAULT'}` }],
    }),

    getChurnPrediction: builder.query<ChurnPredictionResponse, { storeId?: string; threshold?: number }>({
      query: () => '/bi?type=churn',
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `CHURN_${storeId || 'DEFAULT'}` }],
    }),

    getDemandForecast: builder.query<DemandForecastResponse, { storeId?: string; days?: number; period?: string }>({
      query: ({ period = 'WEEKLY' }) => `/bi?type=demand-forecast&period=${encodeURIComponent(period)}`,
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `DEMAND_${storeId || 'DEFAULT'}` }],
    }),

    getCostAnalysis: builder.query<CostAnalysisResponse, { storeId?: string; period?: string }>({
      query: ({ period = 'MONTHLY' }) => `/bi?type=cost-analysis&period=${encodeURIComponent(period)}`,
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `COST_${storeId || 'DEFAULT'}` }],
    }),

    getExecutiveSummary: builder.query<ExecutiveSummary, string | undefined>({
      query: (period) =>
        `/bi/reports?type=executive-summary&period=${encodeURIComponent(period ?? 'MONTH')}`,
      providesTags: (result, error, storeId) => [{ type: 'Analytics', id: `EXECUTIVE_${storeId || 'DEFAULT'}` }],
    }),

    clearAnalyticsCache: builder.mutation<{ status: string; message: string; storeId: string }, void>({
      query: () => ({
        url: '/analytics/cache/clear',
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
  useGetSalesForecastQuery,
  useGetCustomerBehaviorAnalysisQuery,
  useGetChurnPredictionQuery,
  useGetDemandForecastQuery,
  useGetCostAnalysisQuery,
  useGetExecutiveSummaryQuery,
  useClearAnalyticsCacheMutation,
} = analyticsApi;