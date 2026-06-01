import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsManager, screen, userEvent } from '@/test/utils/testUtils';
import OrderManagementPage from './OrderManagementPage';

const mockOrders = [
  {
    id: 'order-1', orderNumber: 'ORD-001', customerId: 'c1', customerName: 'Test Customer', customerPhone: '555-0001',
    storeId: 'store-1', items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 2, price: 12.99 }],
    subtotal: 25.98, deliveryFee: 5, tax: 3.1, total: 34.08, totalAmount: 34.08,
    status: 'RECEIVED', orderType: 'DELIVERY', paymentStatus: 'PENDING', priority: 'NORMAL',
    createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'order-2', orderNumber: 'ORD-002', customerId: 'c2', customerName: 'Jane Doe', customerPhone: '555-0002',
    storeId: 'store-1', items: [{ menuItemId: 'i2', name: 'Burger', quantity: 1, price: 8.99 }],
    subtotal: 8.99, deliveryFee: 0, tax: 0.9, total: 9.89, totalAmount: 9.89,
    status: 'DISPATCHED', orderType: 'TAKEAWAY', paymentStatus: 'PAID', priority: 'URGENT',
    createdAt: '2026-02-15T10:05:00Z', updatedAt: '2026-02-15T10:05:00Z',
  },
];

vi.mock('@/store/api/orderApi', () => ({
  useGetStoreOrdersQuery: vi.fn().mockReturnValue({ data: mockOrders, isLoading: false, refetch: vi.fn() }),
  useUpdateOrderStatusMutation: vi.fn().mockReturnValue([vi.fn(), {}]),
  useUpdateOrderPriorityMutation: vi.fn().mockReturnValue([vi.fn(), {}]),
  useCancelOrderMutation: vi.fn().mockReturnValue([vi.fn(), {}]),
  useAssignDriverMutation: vi.fn().mockReturnValue([vi.fn(), {}]),
  useUpdatePaymentStatusMutation: vi.fn().mockReturnValue([vi.fn(), {}]),
  useGetOrdersByDateQuery: vi.fn().mockReturnValue({ data: [] }),
  useGetOrdersByDateRangeQuery: vi.fn().mockReturnValue({ data: [] }),
  useGetActiveDeliveriesCountQuery: vi.fn().mockReturnValue({ data: { count: 3 } }),
  useSearchOrdersQuery: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('@/store/api/userApi', () => ({
  useGetUsersQuery: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('@/store/api/analyticsApi', () => ({
  useGetTodaySalesMetricsQuery: vi.fn().mockReturnValue({ data: { todaySales: 15000, todayOrderCount: 25 }, refetch: vi.fn() }),
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
  commonFilters: { searchText: vi.fn(), dateRange: vi.fn() },
}));

vi.mock('@/types/order', () => ({
  ORDER_STATUS_CONFIG: {
    RECEIVED: { label: 'Received', color: '#blue' },
    PREPARING: { label: 'Preparing', color: '#orange' },
    DISPATCHED: { label: 'Dispatched', color: '#green' },
    DELIVERED: { label: 'Delivered', color: '#green' },
    CANCELLED: { label: 'Cancelled', color: '#red' },
    OVEN: { label: 'In Oven', color: '#orange' },
    BAKED: { label: 'Baked', color: '#green' },
    SERVED: { label: 'Served', color: '#green' },
    COMPLETED: { label: 'Completed', color: '#green' },
    READY: { label: 'Ready', color: '#green' },
  },
  ORDER_TYPE_CONFIG: {
    DELIVERY: { label: 'Delivery', color: '#blue' },
    TAKEAWAY: { label: 'Takeaway', color: '#green' },
    DINE_IN: { label: 'Dine In', color: '#purple' },
  },
  PAYMENT_STATUS_CONFIG: {
    PENDING: { label: 'Pending', color: '#orange' },
    PAID: { label: 'Paid', color: '#green' },
    REFUNDED: { label: 'Refunded', color: '#red' },
    FAILED: { label: 'Failed', color: '#red' },
  },
}));

describe('OrderManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Active Orders')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('shows the create order button', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByText('+ Create Order')).toBeInTheDocument();
  });

  it('renders order cards with customer names', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows order numbers', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
    expect(screen.getByText('#ORD-002')).toBeInTheDocument();
  });

  it('displays the filter bar', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  it('shows mark as completed button for dispatched orders', () => {
    renderAsManager(<OrderManagementPage />);
    expect(screen.getByText(/Mark as Completed/)).toBeInTheDocument();
  });
});
