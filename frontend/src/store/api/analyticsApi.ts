import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';

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

// BI (Business Intelligence) types
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
    baseUrl: `${API_CONFIG.BASE_URL}/analytics`,
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

    // BI (Business Intelligence) endpoints
    getSalesForecast: builder.query<SalesForecastResponse, { storeId?: string; days?: number }>({
      query: ({ storeId, days = 7 }) => {
        const params = new URLSearchParams();
        params.append('days', days.toString());
        if (storeId) params.append('storeId', storeId);
        return `/api/bi/forecast/sales?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `FORECAST_${storeId || 'DEFAULT'}` }],
    }),

    getCustomerBehaviorAnalysis: builder.query<CustomerBehaviorResponse, string | undefined>({
      query: (storeId) => `/api/bi/analysis/customer-behavior${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Analytics', id: `BEHAVIOR_${storeId || 'DEFAULT'}` }],
    }),

    getChurnPrediction: builder.query<ChurnPredictionResponse, { storeId?: string; threshold?: number }>({
      query: ({ storeId, threshold = 0.5 }) => {
        const params = new URLSearchParams();
        params.append('threshold', threshold.toString());
        if (storeId) params.append('storeId', storeId);
        return `/api/bi/prediction/churn?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `CHURN_${storeId || 'DEFAULT'}` }],
    }),

    getDemandForecast: builder.query<DemandForecastResponse, { storeId?: string; days?: number }>({
      query: ({ storeId, days = 7 }) => {
        const params = new URLSearchParams();
        params.append('days', days.toString());
        if (storeId) params.append('storeId', storeId);
        return `/api/bi/forecast/demand?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `DEMAND_${storeId || 'DEFAULT'}` }],
    }),

    getCostAnalysis: builder.query<CostAnalysisResponse, { storeId?: string; period?: string }>({
      query: ({ storeId, period = 'MONTHLY' }) => {
        const params = new URLSearchParams();
        params.append('period', period);
        if (storeId) params.append('storeId', storeId);
        return `/api/bi/cost-analysis?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [{ type: 'Analytics', id: `COST_${storeId || 'DEFAULT'}` }],
    }),

    getExecutiveSummary: builder.query<ExecutiveSummary, string | undefined>({
      query: (storeId) => `/api/bi/executive-summary${storeId ? `?storeId=${storeId}` : ''}`,
      providesTags: (result, error, storeId) => [{ type: 'Analytics', id: `EXECUTIVE_${storeId || 'DEFAULT'}` }],
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
  useGetSalesForecastQuery,
  useGetCustomerBehaviorAnalysisQuery,
  useGetChurnPredictionQuery,
  useGetDemandForecastQuery,
  useGetCostAnalysisQuery,
  useGetExecutiveSummaryQuery,
  useClearAnalyticsCacheMutation,
} = analyticsApi;