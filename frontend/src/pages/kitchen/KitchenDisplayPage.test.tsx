import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderAsKitchenStaff } from '@/test/utils/testUtils';
import KitchenDisplayPage from './KitchenDisplayPage';

import type { Order } from '../../store/api/orderApi';

let mockKitchenOrders: Order[] = [];
let mockIsLoading = false;
let mockError: unknown = null;
const mockUpdateOrderStatus = vi.fn(() => ({
  unwrap: () => Promise.resolve(),
}));
const mockRefetch = vi.fn();

vi.mock('../../store/api/orderApi', async () => {
  const actual = await vi.importActual<typeof import('../../store/api/orderApi')>('../../store/api/orderApi');
  return {
    ...actual,
    useGetKitchenQueueQuery: () => ({
      data: mockKitchenOrders,
      isLoading: mockIsLoading,
      isFetching: false,
      error: mockError,
      refetch: mockRefetch,
    }),
    useUpdateOrderStatusMutation: () => [mockUpdateOrderStatus, { isLoading: false }],
  };
});

vi.mock('../../store/api/menuApi', async () => {
  const actual = await vi.importActual<typeof import('../../store/api/menuApi')>('../../store/api/menuApi');
  return {
    ...actual,
    useGetAllMenuItemsQuery: () => ({ data: [], isLoading: false }),
  };
});

vi.mock('../../hooks/useKitchenWebSocket', () => ({
  useKitchenWebSocket: () => ({
    isConnected: false,
    error: null,
  }),
}));

vi.mock('../../components/common/AppHeader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="app-header">{title}</div>,
}));

vi.mock('../../components/RecipeViewer', () => ({
  default: ({ menuItem, onClose }: { menuItem: { name: string }; onClose: () => void }) => (
    <div data-testid="recipe-viewer">
      <span>{menuItem.name}</span>
      <button onClick={onClose}>Close Recipe</button>
    </div>
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ storeId: 'store-1' }),
  };
});

function baseOrder(partial: Partial<Order> & Pick<Order, 'id' | 'orderNumber' | 'status'>): Order {
  return {
    items: [{ menuItemId: 'i-1', name: 'Pizza', quantity: 1, price: 10 }],
    customerName: 'Test Customer',
    orderType: 'DELIVERY',
    priority: 'NORMAL',
    preparationTime: 15,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
    storeId: 'store-1',
    subtotal: 10,
    deliveryFee: 5,
    tax: 1,
    total: 16,
    totalAmount: 16,
    paymentStatus: 'PAID',
    ...partial,
  };
}

describe('KitchenDisplayPage', () => {
  beforeEach(() => {
    mockKitchenOrders = [];
    mockIsLoading = false;
    mockError = null;
    vi.clearAllMocks();
    mockUpdateOrderStatus.mockImplementation(() => ({
      unwrap: () => Promise.resolve(),
    }));
  });

  it('renders without crashing', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('kds-root')).toBeInTheDocument();
  });

  it('displays kitchen header with store ID', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText(/Kitchen Display - STORE-1/)).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    mockIsLoading = true;
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    expect(screen.getByTestId('kds-loading')).toBeInTheDocument();
  });

  it('shows error state with retry when API returns error', () => {
    mockError = { status: 500, data: 'Server Error' };
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(
      screen.getByText('Error loading orders. Please check if Order Service is running.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('retries kitchen queue when Retry is clicked', () => {
    mockError = { status: 500, data: 'Server Error' };
    renderAsKitchenStaff(<KitchenDisplayPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders cook-path columns and handoff columns', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('New Orders')).toBeInTheDocument();
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('In Oven')).toBeInTheDocument();
    expect(screen.getByText('Baked')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Dispatched')).toBeInTheDocument();
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
    expect(screen.getByText('Served')).toBeInTheDocument();
    expect(screen.getByText('Picked Up')).toBeInTheDocument();
  });

  it('shows "No orders" text in empty columns', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    const emptyTexts = screen.getAllByText('No orders');
    // 5 cook + 4 handoff
    expect(emptyTexts.length).toBe(9);
  });

  it('shows empty board banner when cook path is clear', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByTestId('kds-empty-board')).toBeInTheDocument();
    expect(screen.getByText(/Kitchen queue is clear/i)).toBeInTheDocument();
  });

  it('shows connection indicator (polling when WS offline)', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByTestId('kds-connection')).toHaveTextContent(/Polling/i);
  });

  it('renders order cards in correct status columns', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'item-1', name: 'Margherita Pizza', quantity: 2, price: 12.99 }],
        customerName: 'Alice',
      }),
      baseOrder({
        id: 'order-2',
        orderNumber: 'ORD-002',
        status: 'PREPARING',
        items: [{ menuItemId: 'item-2', name: 'Garlic Bread', quantity: 1, price: 4.99 }],
        customerName: 'Bob',
        orderType: 'TAKEAWAY',
        priority: 'URGENT',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
    expect(screen.getByText('#ORD-002')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    const newCol = screen.getByTestId('kds-column-RECEIVED');
    expect(within(newCol).getByText('#ORD-001')).toBeInTheDocument();
    const prepCol = screen.getByTestId('kds-column-PREPARING');
    expect(within(prepCol).getByText('#ORD-002')).toBeInTheDocument();
  });

  it('displays urgent badge for urgent orders', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-u',
        orderNumber: 'ORD-URG',
        status: 'RECEIVED',
        customerName: 'Urgent Customer',
        priority: 'URGENT',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('sorts urgent orders before normal orders in the same column', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-normal',
        orderNumber: 'ORD-N',
        status: 'RECEIVED',
        customerName: 'Normal Customer',
        createdAt: '2026-02-15T09:50:00Z',
      }),
      baseOrder({
        id: 'order-urgent',
        orderNumber: 'ORD-U',
        status: 'RECEIVED',
        customerName: 'Urgent Customer',
        priority: 'URGENT',
        createdAt: '2026-02-15T10:00:00Z',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);

    const urgentNode = screen.getByText('#ORD-U');
    const normalNode = screen.getByText('#ORD-N');
    expect(
      urgentNode.compareDocumentPosition(normalNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('displays order items with quantities', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-items',
        orderNumber: 'ORD-ITEMS',
        status: 'PREPARING',
        items: [
          { menuItemId: 'i-1', name: 'Pepperoni Pizza', quantity: 3, price: 14.99 },
          { menuItemId: 'i-2', name: 'Garlic Bread', quantity: 1, price: 4.99 },
        ],
        customerName: 'Item Test',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
    expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('displays order type badge', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-type',
        orderNumber: 'ORD-TYPE',
        status: 'RECEIVED',
        customerName: 'Type Test',
        orderType: 'DELIVERY',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('DELIVERY')).toBeInTheDocument();
  });

  it('shows "Next Stage" button for non-terminal orders', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-next',
        orderNumber: 'ORD-NEXT',
        status: 'RECEIVED',
        customerName: 'Next Test',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Next Stage')).toBeInTheDocument();
  });

  it('calls updateOrderStatus when Next Stage is clicked', async () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-click',
        orderNumber: 'ORD-CLICK',
        status: 'RECEIVED',
        customerName: 'Click Test',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);

    const nextStageButton = await waitFor(() => {
      const button = screen.getByText('Next Stage').closest('button');
      expect(button).toBeTruthy();
      return button!;
    });

    fireEvent.click(nextStageButton);

    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
        orderId: 'order-click',
        status: 'PREPARING',
      });
    });
  });

  it('shows inline action error when status update fails', async () => {
    mockUpdateOrderStatus.mockImplementation(() => ({
      unwrap: () => Promise.reject(new Error('network')),
    }));
    mockKitchenOrders = [
      baseOrder({
        id: 'order-fail',
        orderNumber: 'ORD-FAIL',
        status: 'RECEIVED',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    fireEvent.click(screen.getByText('Next Stage').closest('button')!);

    expect(await screen.findByTestId('kds-action-error')).toBeInTheDocument();
    expect(screen.getByText(/Could not advance #ORD-FAIL/i)).toBeInTheDocument();
  });

  it('renders Recipe button on order items', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'order-recipe',
        orderNumber: 'ORD-RCP',
        status: 'PREPARING',
        customerName: 'Recipe Test',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Recipe')).toBeInTheDocument();
  });

  it('displays column counts', () => {
    mockKitchenOrders = [
      baseOrder({ id: 'o1', orderNumber: 'ORD-1', status: 'RECEIVED', customerName: 'C1' }),
      baseOrder({
        id: 'o2',
        orderNumber: 'ORD-2',
        status: 'RECEIVED',
        customerName: 'C2',
        createdAt: '2026-02-15T10:01:00Z',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('New Orders')).toBeInTheDocument();
    const newCol = screen.getByTestId('kds-column-RECEIVED');
    expect(within(newCol).getByText('2')).toBeInTheDocument();
  });

  it('labels oven timer as Demo estimate when no actual oven time', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'oven-1',
        orderNumber: 'ORD-OVEN',
        status: 'OVEN',
        customerName: 'Oven Guest',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByTestId('oven-timer')).toBeInTheDocument();
    expect(screen.getByText('Demo estimate')).toBeInTheDocument();
  });

  it('shows Mark Served for dine-in READY tickets', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'dine-1',
        orderNumber: 'ORD-DINE',
        status: 'READY',
        orderType: 'DINE_IN',
        customerName: 'Table 4',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Mark Served')).toBeInTheDocument();
  });

  it('shows summary KPIs from live tickets', () => {
    mockKitchenOrders = [
      baseOrder({
        id: 'kpi-1',
        orderNumber: 'ORD-KPI',
        status: 'RECEIVED',
        priority: 'URGENT',
      }),
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    const summary = screen.getByTestId('kds-summary');
    expect(within(summary).getByText('Active')).toBeInTheDocument();
    expect(within(summary).getByText('Urgent')).toBeInTheDocument();
  });
});
