import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen } from '@/test/utils/testUtils';
import CustomerManagementPage from './CustomerManagementPage';

const { mockCustomers } = vi.hoisted(() => {
  const baseLoyalty = {
    totalPoints: 500,
    pointsEarned: 500,
    pointsRedeemed: 0,
    tier: 'GOLD' as const,
    pointHistory: [],
  };
  return {
    mockCustomers: [
      {
        id: 'c1', userId: 'u1', name: 'Alice Customer', email: 'alice@test.com', phone: '555-0001',
        addresses: [], loyaltyInfo: baseLoyalty, preferences: {}, orderStats: { totalOrders: 25, totalSpent: 12500 },
        active: true, emailVerified: true, phoneVerified: true, marketingOptIn: false, smsOptIn: false,
        tags: [], notes: [], createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
      {
        id: 'c2', userId: 'u2', name: 'Bob Buyer', email: 'bob@test.com', phone: '555-0002',
        addresses: [], loyaltyInfo: { ...baseLoyalty, tier: 'SILVER' as const, totalPoints: 200 },
        preferences: {}, orderStats: { totalOrders: 10, totalSpent: 5000 },
        active: true, emailVerified: true, phoneVerified: true, marketingOptIn: false, smsOptIn: false,
        tags: [], notes: [], createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    ],
  };
});

vi.mock('@/store/api/customerApi', async () => {
  const actual = await vi.importActual('@/store/api/customerApi');
  return {
    ...actual,
    useGetAllCustomersQuery: vi.fn().mockReturnValue({ data: mockCustomers, isLoading: false }),
    useGetCustomerByIdQuery: vi.fn().mockReturnValue({ data: null }),
    useGetHighValueCustomersQuery: vi.fn().mockReturnValue({ data: [] }),
    useGetTopSpendersQuery: vi.fn().mockReturnValue({ data: [] }),
    useGetInactiveCustomersQuery: vi.fn().mockReturnValue({ data: [] }),
    useGetRecentlyActiveCustomersQuery: vi.fn().mockReturnValue({ data: [] }),
    useSearchCustomersQuery: vi.fn().mockReturnValue({ data: [] }),
    useDeactivateCustomerMutation: vi.fn().mockReturnValue([vi.fn()]),
    useActivateCustomerMutation: vi.fn().mockReturnValue([vi.fn()]),
    useAddNoteMutation: vi.fn().mockReturnValue([vi.fn()]),
    useGetCustomerStatsQuery: vi.fn().mockReturnValue({ data: { totalCustomers: 2, activeCustomers: 2 } }),
    useGetCustomerOrderStatsQuery: vi.fn().mockReturnValue({ data: null }),
    useGetCustomerPreferencesQuery: vi.fn().mockReturnValue({ data: null }),
    useGetCustomerLoyaltyPointsQuery: vi.fn().mockReturnValue({ data: null }),
    useGetCustomerAddressesQuery: vi.fn().mockReturnValue({ data: [] }),
    useAddAddressMutation: vi.fn().mockReturnValue([vi.fn()]),
    useUpdateAddressMutation: vi.fn().mockReturnValue([vi.fn()]),
    useRemoveAddressMutation: vi.fn().mockReturnValue([vi.fn()]),
    useSetDefaultAddressMutation: vi.fn().mockReturnValue([vi.fn()]),
  };
});

vi.mock('../../hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: vi.fn().mockReturnValue({ handleBack: vi.fn() }),
}));

vi.mock('@/components/common/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
}));

vi.mock('@/utils/filterUtils', () => ({
  applyFilters: vi.fn((data: unknown[]) => data),
  applySort: vi.fn((data: unknown[]) => data),
  exportToCSV: vi.fn(),
  commonFilters: { searchText: vi.fn() },
}));

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-bg" />,
}));

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
