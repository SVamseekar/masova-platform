import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import DriverManagementPage from './DriverManagementPage';

const mockDrivers = [
  { id: 'd1', name: 'Driver One', phone: '555-0001', email: 'driver1@test.com', status: 'ONLINE', isActive: true, rating: 4.5, activeDeliveries: 1, totalDeliveries: 100 },
  { id: 'd2', name: 'Driver Two', phone: '555-0002', email: 'driver2@test.com', status: 'OFFLINE', isActive: true, rating: 4.0, activeDeliveries: 0, totalDeliveries: 75 },
];

vi.mock('@/store/api/driverApi', async () => {
  const actual = await vi.importActual('@/store/api/driverApi');
  return {
    ...actual,
  useGetAllDriversQuery: () => ({ data: mockDrivers, isLoading: false }),
  useGetOnlineDriversQuery: () => ({ data: [mockDrivers[0]], isLoading: false }),
  useGetDriverStatsQuery: () => ({ data: { totalDrivers: 2, onlineDrivers: 1, busyDrivers: 1 } }),
  useGetDriverPerformanceQuery: () => ({ data: null }),
  useActivateDriverMutation: () => ([vi.fn()]),
  useDeactivateDriverMutation: () => ([vi.fn()]),
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

vi.mock('@/components/delivery/ManagerDriverTrackingMap', async () => {
  const actual = await vi.importActual('@/components/delivery/ManagerDriverTrackingMap');
  return {
    ...actual,
  ManagerDriverTrackingMap: () => <div data-testid="driver-tracking-map" />,
  };
});

describe('DriverManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<DriverManagementPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  it('displays driver names', () => {
    renderAsManager(<DriverManagementPage />);
    expect(screen.getByText('Driver One')).toBeInTheDocument();
    expect(screen.getByText('Driver Two')).toBeInTheDocument();
  });
});
