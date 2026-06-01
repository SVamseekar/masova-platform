import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import DashboardPage from './DashboardPage';

// Mock all RTK Query hooks used by DashboardPage
vi.mock('@/store/api/sessionApi', () => ({
  useGetActiveStoreSessionsQuery: vi.fn().mockReturnValue({
    data: [
      { id: 's1', employeeName: 'Alice Smith', role: 'STAFF', isActive: true, loginTime: '2026-02-15T08:00:00Z', breakTime: 15, storeId: 'store-1', status: 'APPROVED' },
      { id: 's2', employeeName: 'Bob Jones', role: 'DRIVER', isActive: true, loginTime: '2026-02-15T09:00:00Z', breakTime: 0, storeId: 'store-1', status: 'APPROVED' },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApproveSessionMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
  useRejectSessionMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
}));

vi.mock('@/store/api/storeApi', () => ({
  useGetStoreMetricsQuery: vi.fn().mockReturnValue({
    data: { activeEmployees: 5, activeOrders: 12, totalOrders: 150, averageOrderValue: 450 },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/store/api/orderApi', () => ({
  useGetStoreOrdersQuery: vi.fn().mockReturnValue({
    data: [
      { id: 'o1', orderNumber: 'ORD-001', status: 'PREPARING', items: [{ name: 'Pizza' }], createdAt: '2026-02-15T10:00:00Z', customerName: 'Test Customer', priority: 'NORMAL' },
      { id: 'o2', orderNumber: 'ORD-002', status: 'DISPATCHED', items: [{ name: 'Burger' }], createdAt: '2026-02-15T10:05:00Z', customerName: 'Jane Doe', priority: 'URGENT' },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/store/api/shiftApi', () => ({
  useCheckWeeklyScheduleExistsQuery: vi.fn().mockReturnValue({ data: null }),
}));

vi.mock('@/store/api/analyticsApi', () => ({
  useGetTodaySalesMetricsQuery: vi.fn().mockReturnValue({ data: { todaySales: 25000, lastYearSameDaySales: 20000, percentChangeFromLastYear: 25, yesterdaySalesAtSameTime: 22000 }, isLoading: false }),
  useGetAverageOrderValueQuery: vi.fn().mockReturnValue({ data: { averageOrderValue: 450 } }),
  useGetDriverStatusQuery: vi.fn().mockReturnValue({ data: {} }),
  useGetSalesTrendsQuery: vi.fn().mockReturnValue({ data: { totalSales: 175000 } }),
  useGetOrderTypeBreakdownQuery: vi.fn().mockReturnValue({ data: {} }),
  useGetPeakHoursQuery: vi.fn().mockReturnValue({ data: {} }),
  useGetStaffLeaderboardQuery: vi.fn().mockReturnValue({ data: null }),
  useGetTopProductsQuery: vi.fn().mockReturnValue({ data: null }),
  useGetSalesForecastQuery: vi.fn().mockReturnValue({ data: null }),
  useGetChurnPredictionQuery: vi.fn().mockReturnValue({ data: null }),
  useGetExecutiveSummaryQuery: vi.fn().mockReturnValue({ data: null }),
  useGetCustomerBehaviorAnalysisQuery: vi.fn().mockReturnValue({ data: null }),
  useGetDemandForecastQuery: vi.fn().mockReturnValue({ data: null }),
  useGetCostAnalysisQuery: vi.fn().mockReturnValue({ data: null }),
}));

vi.mock('@/services/pushNotificationService', () => ({
  pushNotificationService: {
    requestPermission: vi.fn().mockResolvedValue(false),
    scheduleWeeklyReminder: vi.fn(),
    clearOldReminders: vi.fn(),
  },
}));

vi.mock('@/contexts/PageStoreContext', () => ({
  usePageStore: vi.fn().mockReturnValue({ selectedStoreId: 'store-1', setSelectedStoreId: vi.fn() }),
}));

vi.mock('@/hoc/withPageStoreContext', () => ({
  withPageStoreContext: (Component: React.ComponentType) => Component,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<DashboardPage />);
    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
  });

  it('displays the navigation tabs', () => {
    renderAsManager(<DashboardPage />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Staff Sessions')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows stats cards with data', () => {
    renderAsManager(<DashboardPage />);
    expect(screen.getByText('Weekly Total')).toBeInTheDocument();
    expect(screen.getByText('Active Staff')).toBeInTheDocument();
    expect(screen.getByText('Pending Orders')).toBeInTheDocument();
  });

  it('displays live order queue section', () => {
    renderAsManager(<DashboardPage />);
    expect(screen.getByText('Live Order Queue')).toBeInTheDocument();
  });

  it('displays active staff sessions section', () => {
    renderAsManager(<DashboardPage />);
    expect(screen.getByText('Active Staff Sessions')).toBeInTheDocument();
  });

  it('shows staff names in sessions', () => {
    renderAsManager(<DashboardPage />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });
});
