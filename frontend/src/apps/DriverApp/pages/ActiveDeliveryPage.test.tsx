import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsDriver } from '@/test/utils/testUtils';
import ActiveDeliveryPage from './ActiveDeliveryPage';

const mockUpdateOrderStatus = vi.fn(() => ({
  unwrap: () => Promise.resolve(),
}));

const mockRefetch = vi.fn();

// Default: no active deliveries
let mockActiveOrders: any[] = [];
let mockIsLoading = false;

vi.mock('../../../store/api/orderApi', () => ({
  useGetOrdersByStatusQuery: () => ({
    data: mockActiveOrders,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  }),
  useUpdateOrderStatusMutation: () => [mockUpdateOrderStatus, { isLoading: false }],
  orderApi: { reducerPath: 'orderApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

// Mock CustomerContact component
vi.mock('../components/CustomerContact', () => ({
  default: ({ open, onClose, customerName, customerPhone, orderNumber }: any) =>
    open ? (
      <div data-testid="customer-contact">
        <span>{customerName}</span>
        <span>{customerPhone}</span>
        <span>#{orderNumber}</span>
        <button onClick={onClose}>Close Contact</button>
      </div>
    ) : null,
}));

describe('ActiveDeliveryPage', () => {
  beforeEach(() => {
    mockActiveOrders = [];
    mockIsLoading = false;
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsDriver(<ActiveDeliveryPage />);
    expect(screen.getByText('No Active Deliveries')).toBeInTheDocument();
  });

  it('shows empty state when no deliveries assigned', () => {
    renderAsDriver(<ActiveDeliveryPage />);
    expect(screen.getByText('No Active Deliveries')).toBeInTheDocument();
    expect(
      screen.getByText("You're all caught up! Go online to receive new delivery assignments.")
    ).toBeInTheDocument();
  });

  it('shows loading skeleton when data is loading', () => {
    mockIsLoading = true;
    const { container } = renderAsDriver(<ActiveDeliveryPage />);
    // Skeleton cards are rendered as Box elements
    expect(container.querySelector('[class*="MuiContainer"]')).toBeInTheDocument();
  });

  it('renders delivery cards when orders are assigned to the driver', () => {
    mockActiveOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        assignedDriverId: '4', // matches mockDriverUser.id from testUtils
        customerName: 'Alice Smith',
        customerPhone: '555-1234',
        deliveryAddress: '42 Curry Lane, Hyderabad',
        total: 39.07,
        items: [
          { name: 'Margherita Pizza', quantity: 2 },
          { name: 'Garlic Bread', quantity: 1 },
        ],
      },
    ];

    renderAsDriver(<ActiveDeliveryPage />);
    expect(screen.getByText('Active Deliveries')).toBeInTheDocument();
    expect(screen.getByText('1 order in queue')).toBeInTheDocument();
  });

  it('shows plural "orders" text for multiple deliveries', () => {
    mockActiveOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        assignedDriverId: '4',
        customerName: 'Alice',
        customerPhone: '555-1111',
        deliveryAddress: '10 Main St',
        total: 25,
        items: [{ name: 'Pizza', quantity: 1 }],
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        assignedDriverId: '4',
        customerName: 'Bob',
        customerPhone: '555-2222',
        deliveryAddress: '20 Oak Ave',
        total: 18,
        items: [{ name: 'Burger', quantity: 2 }],
      },
    ];

    renderAsDriver(<ActiveDeliveryPage />);
    expect(screen.getByText('2 orders in queue')).toBeInTheDocument();
  });

  it('formats object delivery address into a string', () => {
    mockActiveOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        assignedDriverId: '4',
        customerName: 'Charlie',
        customerPhone: '555-3333',
        deliveryAddress: {
          street: '42 Curry Lane',
          landmark: 'Near Charminar',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
        },
        total: 39.07,
        items: [{ name: 'Pizza', quantity: 1 }],
      },
    ];

    renderAsDriver(<ActiveDeliveryPage />);
    expect(
      screen.getByText('42 Curry Lane, Near Charminar, Hyderabad, Telangana, 500001')
    ).toBeInTheDocument();
  });

  it('has view toggle buttons for list and map views', () => {
    mockActiveOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        assignedDriverId: '4',
        customerName: 'Test',
        customerPhone: '555-0000',
        deliveryAddress: 'Test Address',
        total: 10,
        items: [{ name: 'Item', quantity: 1 }],
      },
    ];

    renderAsDriver(<ActiveDeliveryPage />);
    // The ToggleButtonGroup has list and map buttons
    const toggleGroup = screen.getAllByRole('button');
    expect(toggleGroup.length).toBeGreaterThanOrEqual(2);
  });

  it('opens navigation in new tab when Navigate is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    mockActiveOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        assignedDriverId: '4',
        customerName: 'Test',
        customerPhone: '555-0000',
        deliveryAddress: '123 Test St',
        total: 10,
        items: [{ name: 'Item', quantity: 1 }],
      },
    ];

    renderAsDriver(<ActiveDeliveryPage />);

    const navigateBtn = screen.getByText('Navigate');
    await user.click(navigateBtn);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('openstreetmap.org'),
      '_blank'
    );

    openSpy.mockRestore();
  });
});
