import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import DriverManagementPage from './DriverManagementPage';

const mockDrivers = [
  { id: 'd1', name: 'Driver One', phone: '555-0001', email: 'driver1@test.com', status: 'ONLINE', isActive: true, rating: 4.5, activeDeliveries: 1, totalDeliveries: 100 },
  { id: 'd2', name: 'Driver Two', phone: '555-0002', email: 'driver2@test.com', status: 'OFFLINE', isActive: true, rating: 4.0, activeDeliveries: 0, totalDeliveries: 75 },
];

vi.mock('@/store/api/driverApi', () => ({
  useGetAllDriversQuery: vi.fn().mockReturnValue({ data: mockDrivers, isLoading: false }),
  useGetOnlineDriversQuery: vi.fn().mockReturnValue({ data: [mockDrivers[0]], isLoading: false }),
  useGetDriverStatsQuery: vi.fn().mockReturnValue({ data: { totalDrivers: 2, onlineDrivers: 1, busyDrivers: 1 } }),
  useGetDriverPerformanceQuery: vi.fn().mockReturnValue({ data: null }),
  useActivateDriverMutation: vi.fn().mockReturnValue([vi.fn()]),
  useDeactivateDriverMutation: vi.fn().mockReturnValue([vi.fn()]),
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

vi.mock('@/components/delivery/ManagerDriverTrackingMap', () => ({
  ManagerDriverTrackingMap: () => <div data-testid="driver-tracking-map" />,
}));

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
