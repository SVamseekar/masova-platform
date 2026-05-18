import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import DeliveryManagementPage from './DeliveryManagementPage';

vi.mock('@/store/api/deliveryApi', async () => {
  const actual = await vi.importActual('@/store/api/deliveryApi');
  return {
    ...actual,
  useGetDeliveryMetricsQuery: () => ({ data: { totalDeliveries: 150, activeDeliveries: 8, completedDeliveries: 135, averageDeliveryTime: 28.5, onTimeDeliveryRate: 0.92 }, isLoading: false }),
  useGetTodayMetricsQuery: () => ({ data: { totalDeliveries: 25, averageTime: 30 }, isLoading: false }),
  useAutoDispatchMutation: () => ([vi.fn(), { isLoading: false }]),
  useTrackOrderQuery: () => ({ data: null }),
  useGetAvailableDriversQuery: () => ({ data: [], isLoading: false }),
  useListDeliveryZonesQuery: () => ({ data: [] }),
  useGetDriverPerformanceQuery: () => ({ data: null }),
  useGetDriverStatusQuery: () => ({ data: null }),
  useAcceptDeliveryMutation: () => ([vi.fn()]),
  useRejectDeliveryMutation: () => ([vi.fn()]),
  };
});

vi.mock('@/store/api/orderApi', async () => {
  const actual = await vi.importActual('@/store/api/orderApi');
  return {
    ...actual,
  useGetStoreOrdersQuery: () => ({
    data: [
      { id: 'o1', orderNumber: 'ORD-001', status: 'DISPATCHED', orderType: 'DELIVERY', customerName: 'Test', items: [], total: 100, createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z', priority: 'NORMAL', storeId: 'store-1' },
    ],
    isLoading: false,
  }),
  };
});

vi.mock('@/contexts/PageStoreContext', async () => {
  const actual = await vi.importActual('@/contexts/PageStoreContext');
  return {
    ...actual,
  usePageStore: () => ({ selectedStoreId: 'store-1', setSelectedStoreId: vi.fn() }),
  };
});

vi.mock('@/hoc/withPageStoreContext', async () => {
  const actual = await vi.importActual('@/hoc/withPageStoreContext');
  return {
    ...actual,
  withPageStoreContext: (Component: React.ComponentType) => Component,
  };
});

vi.mock('@/hooks/useSmartBackNavigation', async () => {
  const actual = await vi.importActual('@/hooks/useSmartBackNavigation');
  return {
    ...actual,
  useSmartBackNavigation: () => ({ handleBack: vi.fn() }),
  };
});

vi.mock('@/components/common/FilterBar', async () => {
  const actual = await vi.importActual('@/components/common/FilterBar');
  return {
    ...actual,
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
  };
});

vi.mock('@/utils/filterUtils', async () => {
  const actual = await vi.importActual('@/utils/filterUtils');
  return {
    ...actual,
  applyFilters: vi.fn((data: any[]) => data),
  applySort: vi.fn((data: any[]) => data),
  exportToCSV: vi.fn(),
  commonFilters: { searchText: vi.fn() },
  };
});

vi.mock('@/components/backgrounds/AnimatedBackground', async () => {
  const actual = await vi.importActual('@/components/backgrounds/AnimatedBackground');
  return {
    ...actual,
  default: () => <div data-testid="animated-bg" />,
  };
});

vi.mock('@/components/delivery/DriverTrackingMap', async () => {
  const actual = await vi.importActual('@/components/delivery/DriverTrackingMap');
  return {
    ...actual,
  DriverTrackingMap: () => <div data-testid="tracking-map" />,
  };
});

vi.mock('@/config/test-locations', async () => {
  const actual = await vi.importActual('@/config/test-locations');
  return {
    ...actual,
  MOCK_STORE_LOCATION: { lat: 17.385, lng: 78.4867 },
  getRandomCustomerLocation: vi.fn(),
  toGeoJSONPoint: vi.fn(),
  toAddressDTO: vi.fn(),
  isTestMode: () => (false),
  TEST_SCENARIOS: {},
  };
});

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
