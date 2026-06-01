import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import Reports from './Reports';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks
// ---------------------------------------------------------------------------

vi.mock('../../store/api/analyticsApi', () => ({
  useGetTodaySalesMetricsQuery: () => ({
    data: {
      todaySales: 15000,
      todayOrderCount: 42,
      percentChangeFromYesterday: 8.5,
      lastYearSameDaySales: 12000,
      percentChangeFromLastYear: 25,
    },
    isLoading: false,
  }),
  useGetSalesTrendsQuery: ({ period }: any) => ({
    data: {
      totalSales: period === 'WEEKLY' ? 80000 : 320000,
      totalOrders: period === 'WEEKLY' ? 450 : 1800,
    },
    isLoading: false,
  }),
  useGetStaffLeaderboardQuery: () => ({
    data: {
      rankings: [
        {
          staffId: 'staff-1',
          staffName: 'Alice Chef',
          ordersProcessed: 15,
          salesGenerated: 4500,
        },
        {
          staffId: 'staff-2',
          staffName: 'Bob Cook',
          ordersProcessed: 12,
          salesGenerated: 3200,
        },
      ],
    },
    isLoading: false,
  }),
  useGetTopProductsQuery: () => ({
    data: {
      topProducts: [
        {
          itemId: 'item-1',
          itemName: 'Margherita Pizza',
          quantitySold: 25,
          revenue: 3250,
        },
        {
          itemId: 'item-2',
          itemName: 'Masala Dosa',
          quantitySold: 20,
          revenue: 1200,
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../../components/common/AppHeader', () => ({
  default: ({ title }: any) => <div data-testid="app-header">{title}</div>,
}));

const managerState = {
  auth: {
    user: {
      id: '3',
      email: 'manager@example.com',
      name: 'Manager User',
      type: 'MANAGER',
      role: 'MANAGER',
      phone: '555-0789',
      storeId: 'store-1',
    },
    isAuthenticated: true,
    token: 'mock-jwt-token',
    loading: false,
    error: null,
  },
};

const staffState = {
  auth: {
    user: {
      id: '2',
      email: 'staff@example.com',
      name: 'Staff Member',
      type: 'STAFF',
      role: 'STAFF',
      phone: '555-0456',
      storeId: 'store-1',
    },
    isAuthenticated: true,
    token: 'mock-jwt-token',
    loading: false,
    error: null,
  },
};

describe('Reports', () => {
  describe('access control', () => {
    it('shows access denied for non-manager users', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: staffState as any,
      });

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText(/This page is only accessible to managers/i)
      ).toBeInTheDocument();
    });

    it('shows back to POS button on access denied screen', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: staffState as any,
      });

      expect(
        screen.getByRole('button', { name: /Back to POS/i })
      ).toBeInTheDocument();
    });
  });

  describe('rendering for managers', () => {
    it('renders without crashing', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByTestId('app-header')).toBeInTheDocument();
    });

    it('displays the header with manager name', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByText('Reports & Analytics - Manager User')
      ).toBeInTheDocument();
    });

    it('shows the sales tab by default', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText("Today's Sales")).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('displays top selling items', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('renders three tab buttons', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText(/Sales/)).toBeInTheDocument();
      expect(screen.getByText(/Staff/)).toBeInTheDocument();
      expect(screen.getByText(/Inventory/)).toBeInTheDocument();
    });

    it('switches to staff tab and shows staff leaderboard', async () => {
      const user = userEvent.setup();

      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByText(/Staff/));

      expect(screen.getByText('Alice Chef')).toBeInTheDocument();
      expect(screen.getByText('Bob Cook')).toBeInTheDocument();
      expect(screen.getByText(/15 orders processed/)).toBeInTheDocument();
    });

    it('switches to inventory tab and shows redirect message', async () => {
      const user = userEvent.setup();

      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByText(/Inventory/));

      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Go to Inventory Management/i })
      ).toBeInTheDocument();
    });
  });

  describe('navigation buttons', () => {
    it('shows Back to POS button', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByRole('button', { name: /Back to POS/i })
      ).toBeInTheDocument();
    });

    it('shows View Full Analytics button', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByRole('button', { name: /View Full Analytics/i })
      ).toBeInTheDocument();
    });

    it('shows View Advanced Reports button', () => {
      renderWithProviders(<Reports />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByRole('button', { name: /View Advanced Reports/i })
      ).toBeInTheDocument();
    });
  });
});
