import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import DeliveryManagementPage from './DeliveryManagementPage';

vi.mock('@/store/api/deliveryApi', () => ({
  useGetDeliveryMetricsQuery: vi.fn().mockReturnValue({ data: { totalDeliveries: 150, activeDeliveries: 8, completedDeliveries: 135, averageDeliveryTime: 28.5, onTimeDeliveryRate: 0.92 }, isLoading: false }),
  useGetTodayMetricsQuery: vi.fn().mockReturnValue({ data: { totalDeliveries: 25, averageTime: 30 }, isLoading: false }),
  useAutoDispatchMutation: vi.fn().mockReturnValue([vi.fn(), { isLoading: false }]),
  useTrackOrderQuery: vi.fn().mockReturnValue({ data: null }),
  useGetAvailableDriversQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useListDeliveryZonesQuery: vi.fn().mockReturnValue({ data: [] }),
  useGetDriverPerformanceQuery: vi.fn().mockReturnValue({ data: null }),
  useGetDriverStatusQuery: vi.fn().mockReturnValue({ data: null }),
  useAcceptDeliveryMutation: vi.fn().mockReturnValue([vi.fn()]),
  useRejectDeliveryMutation: vi.fn().mockReturnValue([vi.fn()]),
}));

vi.mock('@/store/api/orderApi', () => ({
  useGetStoreOrdersQuery: vi.fn().mockReturnValue({
    data: [
      { id: 'o1', orderNumber: 'ORD-001', status: 'DISPATCHED', orderType: 'DELIVERY', customerName: 'Test', items: [], total: 100, createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z', priority: 'NORMAL', storeId: 'store-1' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/contexts/PageStoreContext', () => ({
  usePageStore: vi.fn().mockReturnValue({ selectedStoreId: 'store-1', setSelectedStoreId: vi.fn() }),
}));

vi.mock('@/hoc/withPageStoreContext', () => ({
  withPageStoreContext: (Component: React.ComponentType) => Component,
}));

vi.mock('@/hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: vi.fn().mockReturnValue({ handleBack: vi.fn() }),
}));

vi.mock('@/components/common/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
}));

vi.mock('@/utils/filterUtils', () => ({
  applyFilters: vi.fn((data: any[]) => data),
  applySort: vi.fn((data: any[]) => data),
  exportToCSV: vi.fn(),
  commonFilters: { searchText: vi.fn() },
}));

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-bg" />,
}));

vi.mock('@/components/delivery/DriverTrackingMap', () => ({
  DriverTrackingMap: () => <div data-testid="tracking-map" />,
}));

vi.mock('@/config/test-locations', () => ({
  MOCK_STORE_LOCATION: { lat: 17.385, lng: 78.4867 },
  getRandomCustomerLocation: vi.fn(),
  toGeoJSONPoint: vi.fn(),
  toAddressDTO: vi.fn(),
  isTestMode: vi.fn().mockReturnValue(false),
  TEST_SCENARIOS: {},
}));

describe('DeliveryManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<DeliveryManagementPage />);
    expect(document.body).toBeTruthy();
  });

  it('shows the filter bar', () => {
    renderAsManager(<DeliveryManagementPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });
});
