import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsKitchenStaff } from '@/test/utils/testUtils';
import KitchenDisplayPage from './KitchenDisplayPage';

let mockKitchenOrders: any[] = [];
let mockIsLoading = false;
let mockError: any = null;
const mockUpdateOrderStatus = vi.fn(() => ({
  unwrap: () => Promise.resolve(),
}));
const mockRefetch = vi.fn();

vi.mock('../../store/api/orderApi', () => ({
  useGetKitchenQueueQuery: () => ({
    data: mockKitchenOrders,
    isLoading: mockIsLoading,
    error: mockError,
    refetch: mockRefetch,
  }),
  useUpdateOrderStatusMutation: () => [mockUpdateOrderStatus, { isLoading: false }],
  useGetAllMenuItemsQuery: () => ({ data: [], isLoading: false }),
  orderApi: { reducerPath: 'orderApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

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
  default: ({ menuItem, onClose }: any) => (
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

describe('KitchenDisplayPage', () => {
  beforeEach(() => {
    mockKitchenOrders = [];
    mockIsLoading = false;
    mockError = null;
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('displays kitchen header with store ID', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText(/Kitchen Display - STORE-1/)).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    mockIsLoading = true;
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('shows error state when API returns error', () => {
    mockError = { status: 500, data: 'Server Error' };
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(
      screen.getByText('Error loading orders. Please check if Order Service is running.')
    ).toBeInTheDocument();
  });

  it('renders all 5 status columns', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('New Orders')).toBeInTheDocument();
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('In Oven')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows "No orders" text in empty columns', () => {
    renderAsKitchenStaff(<KitchenDisplayPage />);
    const emptyTexts = screen.getAllByText('No orders');
    expect(emptyTexts.length).toBe(5);
  });

  it('renders order cards in correct status columns', () => {
    mockKitchenOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'RECEIVED',
        items: [{ menuItemId: 'item-1', name: 'Margherita Pizza', quantity: 2, price: 12.99 }],
        customerName: 'Alice',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        preparationTime: 15,
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
        storeId: 'store-1',
        subtotal: 25.98,
        deliveryFee: 5,
        tax: 3.1,
        total: 34.08,
        totalAmount: 34.08,
        paymentStatus: 'PAID',
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        status: 'PREPARING',
        items: [{ menuItemId: 'item-2', name: 'Garlic Bread', quantity: 1, price: 4.99 }],
        customerName: 'Bob',
        orderType: 'TAKEAWAY',
        priority: 'URGENT',
        preparationTime: 10,
        createdAt: '2026-02-15T10:05:00Z',
        updatedAt: '2026-02-15T10:05:00Z',
        storeId: 'store-1',
        subtotal: 4.99,
        deliveryFee: 0,
        tax: 0.5,
        total: 5.49,
        totalAmount: 5.49,
        paymentStatus: 'PAID',
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
    expect(screen.getByText('#ORD-002')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('displays urgent badge for urgent orders', () => {
    mockKitchenOrders = [
      {
        id: 'order-u',
        orderNumber: 'ORD-URG',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i-1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Urgent Customer',
        orderType: 'DELIVERY',
        priority: 'URGENT',
        preparationTime: 15,
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
        storeId: 'store-1',
        subtotal: 10,
        deliveryFee: 5,
        tax: 1.5,
        total: 16.5,
        totalAmount: 16.5,
        paymentStatus: 'PAID',
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('sorts urgent orders before normal orders in the same column', () => {
    mockKitchenOrders = [
      {
        id: 'order-normal',
        orderNumber: 'ORD-N',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i-1', name: 'Item A', quantity: 1, price: 10 }],
        customerName: 'Normal Customer',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        preparationTime: 15,
        createdAt: '2026-02-15T09:50:00Z',
        updatedAt: '2026-02-15T09:50:00Z',
        storeId: 'store-1',
        subtotal: 10,
        deliveryFee: 5,
        tax: 1,
        total: 16,
        totalAmount: 16,
        paymentStatus: 'PAID',
      },
      {
        id: 'order-urgent',
        orderNumber: 'ORD-U',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i-2', name: 'Item B', quantity: 1, price: 10 }],
        customerName: 'Urgent Customer',
        orderType: 'DELIVERY',
        priority: 'URGENT',
        preparationTime: 10,
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
        storeId: 'store-1',
        subtotal: 10,
        deliveryFee: 5,
        tax: 1,
        total: 16,
        totalAmount: 16,
        paymentStatus: 'PAID',
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);

    // Both should be rendered
    expect(screen.getByText('#ORD-U')).toBeInTheDocument();
    expect(screen.getByText('#ORD-N')).toBeInTheDocument();

    // Urgent should appear first in DOM order
    const urgentNode = screen.getByText('#ORD-U');
    const normalNode = screen.getByText('#ORD-N');
    expect(
      urgentNode.compareDocumentPosition(normalNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('displays order items with quantities', () => {
    mockKitchenOrders = [
      {
        id: 'order-items',
        orderNumber: 'ORD-ITEMS',
        status: 'PREPARING',
        items: [
          { menuItemId: 'i-1', name: 'Pepperoni Pizza', quantity: 3, price: 14.99 },
          { menuItemId: 'i-2', name: 'Garlic Bread', quantity: 1, price: 4.99 },
        ],
        customerName: 'Item Test',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        preparationTime: 20,
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
        storeId: 'store-1',
        subtotal: 49.96,
        deliveryFee: 5,
        tax: 5.5,
        total: 60.46,
        totalAmount: 60.46,
        paymentStatus: 'PAID',
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
    expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('displays order type badge', () => {
    mockKitchenOrders = [
      {
        id: 'order-type',
        orderNumber: 'ORD-TYPE',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i-1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Type Test',
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
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('DELIVERY')).toBeInTheDocument();
  });

  it('shows "Next Stage" button for non-terminal orders', () => {
    mockKitchenOrders = [
      {
        id: 'order-next',
        orderNumber: 'ORD-NEXT',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i-1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Next Test',
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
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Next Stage')).toBeInTheDocument();
  });

  it('calls updateOrderStatus when Next Stage is clicked', async () => {
    const user = userEvent.setup();

    mockKitchenOrders = [
      {
        id: 'order-click',
        orderNumber: 'ORD-CLICK',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i-1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Click Test',
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
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);

    await user.click(screen.getByText('Next Stage'));

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
      orderId: 'order-click',
      status: 'PREPARING',
    });
  });

  it('renders Recipe button on order items', () => {
    mockKitchenOrders = [
      {
        id: 'order-recipe',
        orderNumber: 'ORD-RCP',
        status: 'PREPARING',
        items: [{ menuItemId: 'i-1', name: 'Pizza', quantity: 1, price: 10 }],
        customerName: 'Recipe Test',
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
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    expect(screen.getByText('Recipe')).toBeInTheDocument();
  });

  it('displays column counts', () => {
    mockKitchenOrders = [
      {
        id: 'o1',
        orderNumber: 'ORD-1',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i', name: 'P', quantity: 1, price: 10 }],
        customerName: 'C1',
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
      },
      {
        id: 'o2',
        orderNumber: 'ORD-2',
        status: 'RECEIVED',
        items: [{ menuItemId: 'i', name: 'P', quantity: 1, price: 10 }],
        customerName: 'C2',
        orderType: 'DELIVERY',
        priority: 'NORMAL',
        preparationTime: 15,
        createdAt: '2026-02-15T10:01:00Z',
        updatedAt: '2026-02-15T10:01:00Z',
        storeId: 'store-1',
        subtotal: 10,
        deliveryFee: 5,
        tax: 1,
        total: 16,
        totalAmount: 16,
        paymentStatus: 'PAID',
      },
    ];

    renderAsKitchenStaff(<KitchenDisplayPage />);
    // The RECEIVED column should show count 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
