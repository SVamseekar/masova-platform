import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import POSDashboard from './POSDashboard';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks used by POSDashboard
// ---------------------------------------------------------------------------

const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../store/api/analyticsApi', () => ({
  useGetTodaySalesMetricsQuery: () => ({
    data: { todaySales: 5000, todayOrderCount: 25, percentChangeFromYesterday: 12.5, lastYearSameDaySales: 4000, percentChangeFromLastYear: 25 },
    isLoading: false,
  }),
  useGetSalesTrendsQuery: () => ({
    data: { totalSales: 35000, totalOrders: 180 },
    isLoading: false,
  }),
  useGetStaffLeaderboardQuery: () => ({
    data: { rankings: [] },
    isLoading: false,
  }),
  useGetTopProductsQuery: () => ({
    data: { topProducts: [] },
    isLoading: false,
  }),
}));

vi.mock('../../store/api/orderApi', () => ({
  useGetStoreOrdersQuery: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../../store/api/paymentApi', () => ({
  useRecordCashPaymentMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock('../../store/api/sessionApi', () => ({
  useGetActiveStoreSessionsQuery: () => ({
    data: [],
    isLoading: false,
  }),
  useClockOutEmployeeMutation: () => [vi.fn(), { isLoading: false }],
}));

// Mock child components to isolate POSDashboard behavior
vi.mock('./components/MenuPanel', () => ({
  default: ({ onAddItem }: any) => (
    <div data-testid="menu-panel">
      <button
        data-testid="add-pizza-btn"
        onClick={() =>
          onAddItem({ id: 'item-1', name: 'Margherita Pizza', basePrice: 1299 })
        }
      >
        Add Pizza
      </button>
    </div>
  ),
}));

vi.mock('./components/OrderPanel', () => ({
  default: ({ items, onNewOrder }: any) => (
    <div data-testid="order-panel">
      <span data-testid="order-item-count">{items.length}</span>
      <button data-testid="clear-order-btn" onClick={onNewOrder}>
        Clear
      </button>
    </div>
  ),
}));

vi.mock('./components/CustomerPanel', () => ({
  default: () => <div data-testid="customer-panel">CustomerPanel</div>,
}));

vi.mock('./components/MetricsTiles', () => ({
  default: () => <div data-testid="metrics-tiles">MetricsTiles</div>,
}));

vi.mock('./components/ClockInModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="clock-in-modal">ClockInModal</div> : null,
}));

vi.mock('./components/ClockOutModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="clock-out-modal">ClockOutModal</div> : null,
}));

vi.mock('./components/PINAuthModal', () => ({
  PINAuthModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="pin-auth-modal">PINAuthModal</div> : null,
}));

// ---------------------------------------------------------------------------
// Preloaded state helpers
// ---------------------------------------------------------------------------

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
  cart: {
    items: [],
    selectedStoreId: 'store-1',
    selectedStoreName: 'Downtown Branch',
    totalItems: 0,
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
  cart: {
    items: [],
    selectedStoreId: 'store-1',
    selectedStoreName: 'Downtown Branch',
    totalItems: 0,
  },
};

const unauthenticatedState = {
  auth: {
    user: null,
    isAuthenticated: false,
    token: null,
    loading: false,
    error: null,
  },
  cart: {
    items: [],
    selectedStoreId: 'store-1',
    selectedStoreName: 'Downtown Branch',
    totalItems: 0,
  },
};

describe('POSDashboard', () => {
  beforeEach(() => {
    mockEnqueueSnackbar.mockClear();
  });

  describe('rendering', () => {
    it('renders without crashing for a manager', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('MaSoVa POS')).toBeInTheDocument();
    });

    it('displays the store name in the header', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    });

    it('renders the orders tab by default', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByTestId('menu-panel')).toBeInTheDocument();
      expect(screen.getByTestId('order-panel')).toBeInTheDocument();
      expect(screen.getByTestId('customer-panel')).toBeInTheDocument();
    });

    it('shows tab navigation for managers', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('does not show tab navigation for staff users', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: staffState as any,
      });

      expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('switches to analytics tab when clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByText('Analytics'));

      // Analytics tab content should appear (MetricsTiles)
      expect(screen.getByTestId('metrics-tiles')).toBeInTheDocument();
      // Menu panel should no longer be visible
      expect(screen.queryByTestId('menu-panel')).not.toBeInTheDocument();
    });

    it('switches back to orders tab when clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByText('Analytics'));
      await user.click(screen.getByText('Orders'));

      expect(screen.getByTestId('menu-panel')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('switches to orders tab on F1', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      // First switch to analytics
      fireEvent.click(screen.getByText('Analytics'));
      expect(screen.queryByTestId('menu-panel')).not.toBeInTheDocument();

      // Press F1 to switch back to orders
      fireEvent.keyDown(window, { key: 'F1' });
      expect(screen.getByTestId('menu-panel')).toBeInTheDocument();
    });

    it('switches to analytics tab on F2', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      fireEvent.keyDown(window, { key: 'F2' });
      expect(screen.getByTestId('metrics-tiles')).toBeInTheDocument();
    });

    it('clears the order on Escape', async () => {
      const user = userEvent.setup();

      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      // Add an item to the order
      await user.click(screen.getByTestId('add-pizza-btn'));
      expect(screen.getByTestId('order-item-count')).toHaveTextContent('1');

      // Press Escape to clear
      fireEvent.keyDown(window, { key: 'Escape' });

      // For a logged-in user, handleNewOrder sets order user and clears items
      // The snackbar should fire
      expect(mockEnqueueSnackbar).toHaveBeenCalled();
    });
  });

  describe('order management', () => {
    it('adds an item to the order via MenuPanel', async () => {
      const user = userEvent.setup();

      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByTestId('add-pizza-btn'));
      expect(screen.getByTestId('order-item-count')).toHaveTextContent('1');
    });

    it('increments quantity when adding the same item twice', async () => {
      const user = userEvent.setup();

      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByTestId('add-pizza-btn'));
      await user.click(screen.getByTestId('add-pizza-btn'));

      // Still 1 unique item but quantity is 2 - OrderPanel receives items array
      expect(screen.getByTestId('order-item-count')).toHaveTextContent('1');
    });
  });

  describe('clock in/out buttons', () => {
    it('renders clock in and clock out buttons for managers', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('Clock In')).toBeInTheDocument();
      expect(screen.getByText('Clock Out')).toBeInTheDocument();
    });

    it('does not render clock buttons for staff users', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: staffState as any,
      });

      expect(screen.queryByText('Clock In')).not.toBeInTheDocument();
    });

    it('opens clock in modal when button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      await user.click(screen.getByText('Clock In'));
      expect(screen.getByTestId('clock-in-modal')).toBeInTheDocument();
    });
  });

  describe('unauthenticated POS', () => {
    it('renders for unauthenticated users', () => {
      renderWithProviders(<POSDashboard />, {
        useMemoryRouter: true,
        preloadedState: unauthenticatedState as any,
      });

      expect(screen.getByText('MaSoVa POS')).toBeInTheDocument();
    });
  });
});
