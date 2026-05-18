import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import CustomerManagementPage from './CustomerManagementPage';

const mockCustomers = [
  { id: 'c1', name: 'Alice Customer', email: 'alice@test.com', phone: '555-0001', isActive: true, loyaltyInfo: { tier: 'SILVER', totalPoints: 500, pointsEarned: 600, pointsRedeemed: 100 }, orderStats: { totalOrders: 25, totalSpent: 12500, completedOrders: 20, cancelledOrders: 2, averageOrderValue: 500 } },
  { id: 'c2', name: 'Bob Buyer', email: 'bob@test.com', phone: '555-0002', isActive: true, loyaltyInfo: { tier: 'BRONZE', totalPoints: 200, pointsEarned: 200, pointsRedeemed: 0 }, orderStats: { totalOrders: 10, totalSpent: 5000, completedOrders: 8, cancelledOrders: 1, averageOrderValue: 500 } },
];

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
  useGetAllCustomersQuery: () => ({ data: mockCustomers, isLoading: false }),
  useGetCustomerByIdQuery: () => ({ data: null }),
  useGetHighValueCustomersQuery: () => ({ data: [] }),
  useGetTopSpendersQuery: () => ({ data: [] }),
  useGetInactiveCustomersQuery: () => ({ data: [] }),
  useGetRecentlyActiveCustomersQuery: () => ({ data: [] }),
  useSearchCustomersQuery: () => ({ data: [] }),
  useDeactivateCustomerMutation: () => ([vi.fn()]),
  useActivateCustomerMutation: () => ([vi.fn()]),
  useAddNoteMutation: () => ([vi.fn()]),
  useGetCustomerStatsQuery: () => ({ data: { totalCustomers: 2, activeCustomers: 2 } }),
  useGetCustomerOrderStatsQuery: () => ({ data: null }),
  useGetCustomerPreferencesQuery: () => ({ data: null }),
  useGetCustomerLoyaltyPointsQuery: () => ({ data: null }),
  useGetCustomerAddressesQuery: () => ({ data: [] }),
  useAddAddressMutation: () => ([vi.fn()]),
  useUpdateAddressMutation: () => ([vi.fn()]),
  useRemoveAddressMutation: () => ([vi.fn()]),
  useSetDefaultAddressMutation: () => ([vi.fn()]),
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

describe('CustomerManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<CustomerManagementPage />);
    expect(screen.getByText('Alice Customer')).toBeInTheDocument();
  });

  it('displays customer names', () => {
    renderAsManager(<CustomerManagementPage />);
    expect(screen.getByText('Alice Customer')).toBeInTheDocument();
    expect(screen.getByText('Bob Buyer')).toBeInTheDocument();
  });

  it('shows filter bar', () => {
    renderAsManager(<CustomerManagementPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });
});
