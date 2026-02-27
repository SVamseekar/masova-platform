import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsKitchenStaff } from '@/test/utils/testUtils';
import OrderQueuePage from './OrderQueuePage';

let mockOrders: any[] = [];
let mockIsLoading = false;
let mockError: any = null;
const mockMoveToNextStage = vi.fn(() => ({
  unwrap: () => Promise.resolve(),
}));

vi.mock('../../store/api/orderApi', () => ({
  useGetKitchenQueueQuery: () => ({
    data: mockOrders,
    isLoading: mockIsLoading,
    error: mockError,
  }),
  useMoveToNextStageMutation: () => [mockMoveToNextStage, { isLoading: false }],
  orderApi: { reducerPath: 'orderApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

vi.mock('../../components/common/AppHeader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="app-header">{title}</div>,
}));

vi.mock('../../types/order', () => ({
  ORDER_STATUS_CONFIG: {
    RECEIVED: { label: 'Received', color: '#3b82f6', icon: '' },
    PREPARING: { label: 'Preparing', color: '#f59e0b', icon: '' },
    OVEN: { label: 'In Oven', color: '#e53e3e', icon: '' },
    BAKED: { label: 'Baked', color: '#f97316', icon: '' },
    READY: { label: 'Ready', color: '#10b981', icon: '' },
    DISPATCHED: { label: 'Dispatched', color: '#8b5cf6', icon: '' },
    DELIVERED: { label: 'Delivered', color: '#059669', icon: '' },
    COMPLETED: { label: 'Completed', color: '#059669', icon: '' },
    SERVED: { label: 'Served', color: '#10b981', icon: '' },
    CANCELLED: { label: 'Cancelled', color: '#6b7280', icon: '' },
  },
}));

describe('OrderQueuePage', () => {
  beforeEach(() => {
    mockOrders = [];
    mockIsLoading = false;
    mockError = null;
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByText('Order Queue')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    mockIsLoading = true;
    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('shows error state when API fails', () => {
    mockError = { status: 500, data: 'Error' };
    renderAsKitchenStaff(<OrderQueuePage />);
    expect(
      screen.getByText('Error loading orders. Check if Order Service is running.')
    ).toBeInTheDocument();
  });

  it('shows empty state when no orders', () => {
    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText('No active orders in queue')).toBeInTheDocument();
  });

  it('displays stats header with total orders count', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Customer A',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    // The stat-value for total orders should show 1
    const totalValueElements = screen.getAllByText('1');
    expect(totalValueElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays stats for urgent, preparing, and oven orders', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'PREPARING',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Customer A',
        orderType: 'DELIVERY',
        priority: 'URGENT',
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('In Oven')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Customer A',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText('Order #')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders order rows with customer details', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [
          { menuItemId: 'i1', name: 'Margherita Pizza', quantity: 2, price: 12.99 },
          { menuItemId: 'i2', name: 'Garlic Bread', quantity: 1, price: 4.99 },
        ],
        customerName: 'Alice Johnson',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText(/2 items/)).toBeInTheDocument();
  });

  it('shows "Next Stage" button for non-dispatched orders', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Test',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText(/Next Stage/)).toBeInTheDocument();
  });

  it('does not show "Next Stage" button for DISPATCHED orders', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'DISPATCHED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Test',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.queryByText(/Next Stage/)).not.toBeInTheDocument();
  });

  it('calls moveToNextStage when Next Stage button is clicked', async () => {
    const user = userEvent.setup();

    mockOrders = [
      {
        id: 'order-click',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Click Test',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);

    await user.click(screen.getByText(/Next Stage/));
    expect(mockMoveToNextStage).toHaveBeenCalledWith('order-click');
  });

  it('sorts urgent orders first in the queue', () => {
    const now = new Date();
    mockOrders = [
      {
        id: 'normal-order',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Normal',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date(now.getTime() - 60000).toISOString(),
        updatedAt: new Date(now.getTime() - 60000).toISOString(),
      },
      {
        id: 'urgent-order',
        orderNumber: 'ORD-20260215-002',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i2', name: 'Burger', quantity: 1, price: 8 }],
        customerName: 'Urgent',
        orderType: 'DELIVERY',
        priority: 'URGENT',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);

    const urgentNode = screen.getByText('Urgent');
    const normalNode = screen.getByText('Normal');

    // Urgent should appear before Normal in DOM
    expect(
      urgentNode.compareDocumentPosition(normalNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('displays elapsed time for orders', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Time Test',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    // Should show "0m ago" for an order created just now
    expect(screen.getByText('0m ago')).toBeInTheDocument();
  });

  it('displays order type in badge', () => {
    mockOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-20260215-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Test',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    renderAsKitchenStaff(<OrderQueuePage />);
    expect(screen.getByText(/DELIVERY/)).toBeInTheDocument();
  });
});
