import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import OrderHistory from './OrderHistory';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks
// ---------------------------------------------------------------------------

const mockRecordCashPayment = vi.fn().mockReturnValue({ unwrap: vi.fn() });

vi.mock('../../store/api/paymentApi', () => ({
  useRecordCashPaymentMutation: () => [mockRecordCashPayment, { isLoading: false }],
}));

const today = new Date().toISOString();

const mockOrders = [
  {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '9876543210',
    status: 'PENDING',
    orderType: 'TAKEAWAY',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    total: 500,
    totalAmount: 500,
    items: [{ menuItemId: 'item-1', name: 'Pizza', quantity: 2, price: 250 }],
    createdAt: today,
    storeId: 'store-1',
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    customerPhone: '9876543211',
    status: 'COMPLETED',
    orderType: 'DELIVERY',
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    total: 800,
    totalAmount: 800,
    items: [{ menuItemId: 'item-2', name: 'Burger', quantity: 1, price: 800 }],
    createdAt: today,
    storeId: 'store-1',
  },
];

let mockOrdersData: any[] = mockOrders;
let mockIsLoading = false;
let mockError: any = null;

vi.mock('../../store/api/orderApi', () => ({
  useGetStoreOrdersQuery: () => ({
    data: mockOrdersData,
    isLoading: mockIsLoading,
    error: mockError,
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

describe('OrderHistory', () => {
  beforeEach(() => {
    mockOrdersData = mockOrders;
    mockIsLoading = false;
    mockError = null;
    mockRecordCashPayment.mockClear();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByTestId('app-header')).toBeInTheDocument();
    });

    it('displays the header with user name', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByText('Order History - Manager User')
      ).toBeInTheDocument();
    });

    it('shows order count and total sales', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('2 orders')).toBeInTheDocument();
    });

    it('displays the back to POS button', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByRole('button', { name: /Back to POS/i })
      ).toBeInTheDocument();
    });
  });

  describe('order display', () => {
    it('renders order numbers for each order', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-002')).toBeInTheDocument();
    });

    it('displays status badges', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });

    it('shows payment method badges', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText('CASH')).toBeInTheDocument();
      expect(screen.getByText('CARD')).toBeInTheDocument();
    });

    it('shows unpaid badge for pending payment status', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      // The first order has PENDING payment status
      expect(screen.getByText(/Unpaid/i)).toBeInTheDocument();
    });

    it('shows paid badge for paid orders', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText(/Paid/)).toBeInTheDocument();
    });

    it('shows Mark as Paid button for pending cash orders', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByRole('button', { name: /Mark as Paid/i })
      ).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('renders the search input', () => {
      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(
        screen.getByPlaceholderText(
          /Search by order number, customer name, or phone/i
        )
      ).toBeInTheDocument();
    });

    it('filters orders by customer name', async () => {
      const user = userEvent.setup();

      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      const searchInput = screen.getByPlaceholderText(
        /Search by order number/i
      );
      await user.type(searchInput, 'John');

      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
      expect(screen.queryByText('Order #ORD-002')).not.toBeInTheDocument();
    });

    it('filters orders by order number', async () => {
      const user = userEvent.setup();

      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      const searchInput = screen.getByPlaceholderText(
        /Search by order number/i
      );
      await user.type(searchInput, 'ORD-002');

      expect(screen.queryByText('Order #ORD-001')).not.toBeInTheDocument();
      expect(screen.getByText('Order #ORD-002')).toBeInTheDocument();
    });

    it('shows empty message when no orders match search', async () => {
      const user = userEvent.setup();

      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      const searchInput = screen.getByPlaceholderText(
        /Search by order number/i
      );
      await user.type(searchInput, 'nonexistent');

      expect(
        screen.getByText(/No orders found matching your search/i)
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner when orders are loading', () => {
      mockIsLoading = true;
      mockOrdersData = [];

      const { container } = renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      // The spinner is rendered as a div with animation
      const spinner = container.querySelector('[style*="animation"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when orders fail to load', () => {
      mockError = { message: 'Network error' };

      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty message when there are no orders today', () => {
      mockOrdersData = [];

      renderWithProviders(<OrderHistory />, {
        useMemoryRouter: true,
        preloadedState: managerState as any,
      });

      expect(screen.getByText(/No orders today yet/i)).toBeInTheDocument();
    });
  });
});
