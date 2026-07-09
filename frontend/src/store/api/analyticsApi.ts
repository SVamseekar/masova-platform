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

/** Dashboard-facing executive summary (mapped from backend ExecutiveSummaryResponse). */
export interface ExecutiveSummary {
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

/** Raw shape from GET /api/bi/reports?type=executive-summary */
interface BackendExecutiveSummary {
  reportPeriod?: string;
  financialSummary?: {
    totalRevenue?: number;
    totalCosts?: number;
    grossProfit?: number;
    netProfit?: number;
  };
  operationalMetrics?: {
    totalOrders?: number;
    averageOrderValue?: number;
    newCustomers?: number;
    activeCustomers?: number;
    totalCustomers?: number;
    averageDeliveryTime?: number;
    orderAccuracyRate?: number;
  };
  growthMetrics?: {
    revenueGrowthRate?: number;
    orderGrowthRate?: number;
    customerGrowthRate?: number;
  };
  insights?: Array<{ title?: string; description?: string; recommendation?: string }>;
  // Already-mapped shape (idempotent transform)
  revenue?: ExecutiveSummary['revenue'];
  orders?: ExecutiveSummary['orders'];
  customers?: ExecutiveSummary['customers'];
  topInsights?: string[];
  alerts?: string[];
  performance?: ExecutiveSummary['performance'];
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

function trendFromChange(change: number): 'UP' | 'DOWN' | 'STABLE' {
  if (change > 0.5) return 'UP';
  if (change < -0.5) return 'DOWN';
  return 'STABLE';
}

/**
 * Map backend ExecutiveSummaryResponse → dashboard ExecutiveSummary.
 * Prevents ErrorBoundary crashes on executiveSummary.revenue.total when API returns financialSummary.
 */
export function mapExecutiveSummary(raw: BackendExecutiveSummary | null | undefined): ExecutiveSummary {
  if (raw && raw.revenue && typeof raw.revenue.total === 'number') {
    return {
      revenue: {
        total: num(raw.revenue.total),
        change: num(raw.revenue.change),
        trend: raw.revenue.trend ?? trendFromChange(num(raw.revenue.change)),
      },
      orders: {
        total: num(raw.orders?.total),
        change: num(raw.orders?.change),
        trend: raw.orders?.trend ?? trendFromChange(num(raw.orders?.change)),
      },
      customers: {
        new: num(raw.customers?.new),
        returning: num(raw.customers?.returning),
        atRisk: num(raw.customers?.atRisk),
      },
      performance: {
        avgOrderValue: num(raw.performance?.avgOrderValue),
        customerSatisfaction: num(raw.performance?.customerSatisfaction),
        deliveryOnTime: num(raw.performance?.deliveryOnTime),
      },
      topInsights: Array.isArray(raw.topInsights) ? raw.topInsights : [],
      alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
    };
  }

  const fin = raw?.financialSummary ?? {};
  const ops = raw?.operationalMetrics ?? {};
  const growth = raw?.growthMetrics ?? {};
  const revenueChange = num(growth.revenueGrowthRate);
  const orderChange = num(growth.orderGrowthRate);

  const topInsights = Array.isArray(raw?.insights)
    ? raw!.insights!
        .map((i) => i?.title || i?.description || i?.recommendation || '')
        .filter((s): s is string => Boolean(s && s.trim()))
    : [];

  return {
    revenue: {
      total: num(fin.totalRevenue),
      change: revenueChange,
      trend: trendFromChange(revenueChange),
    },
    orders: {
      total: num(ops.totalOrders),
      change: orderChange,
      trend: trendFromChange(orderChange),
    },
    customers: {
      new: num(ops.newCustomers),
      returning: Math.max(0, num(ops.activeCustomers) - num(ops.newCustomers)),
      atRisk: 0,
    },
    performance: {
      avgOrderValue: num(ops.averageOrderValue),
      customerSatisfaction: 0,
      deliveryOnTime: num(ops.orderAccuracyRate),
    },
    topInsights,
    alerts: [],
  };
}

/** Map churn BI response to the shape used by manager dashboards. */
export function mapChurnPrediction(raw: Record<string, unknown> | null | undefined): ChurnPredictionResponse {
  if (!raw) {
    return { predictions: [], totalAtRisk: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 };
  }
  if (Array.isArray(raw.predictions)) {
    return raw as unknown as ChurnPredictionResponse;
  }
  const atRisk = (raw.atRiskCustomers as Array<Record<string, unknown>>) || [];
  return {
    predictions: atRisk.map((c) => ({
      customerId: String(c.customerId ?? c.id ?? ''),
      customerName: String(c.customerName ?? c.name ?? 'Customer'),
      churnProbability: num(c.churnProbability ?? c.riskScore),
      riskLevel: (String(c.riskLevel ?? 'MEDIUM').toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'),
      lastOrderDate: String(c.lastOrderDate ?? ''),
      daysSinceLastOrder: num(c.daysSinceLastOrder),
      totalOrders: num(c.totalOrders),
      totalSpent: num(c.totalSpent ?? c.lifetimeValue),
    })),
    totalAtRisk: num(raw.highRiskCustomers) + num(raw.mediumRiskCustomers),
    highRiskCount: num(raw.highRiskCustomers),
    mediumRiskCount: num(raw.mediumRiskCustomers),
    lowRiskCount: num(raw.lowRiskCustomers),
  };
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
      transformResponse: (response: Record<string, unknown>) => mapChurnPrediction(response),
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

    /**
     * Executive summary for dashboard.
     * Arg is storeId (used for cache tags only); period is always MONTH unless arg looks like WEEK|MONTH|QUARTER|YEAR.
     */
    getExecutiveSummary: builder.query<ExecutiveSummary, string | undefined>({
      query: (storeIdOrPeriod) => {
        const periods = new Set(['WEEK', 'MONTH', 'QUARTER', 'YEAR']);
        const period =
          storeIdOrPeriod && periods.has(storeIdOrPeriod.toUpperCase())
            ? storeIdOrPeriod.toUpperCase()
            : 'MONTH';
        return `/bi/reports?type=executive-summary&period=${encodeURIComponent(period)}`;
      },
      transformResponse: (response: BackendExecutiveSummary) => mapExecutiveSummary(response),
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