import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsDriver } from '@/test/utils/testUtils';
import DeliveryHistoryPage from './DeliveryHistoryPage';

let mockDeliveredOrders: any[] = [];
let mockIsLoading = false;

vi.mock('../../../store/api/orderApi', () => ({
  useGetOrdersByStatusQuery: () => ({
    data: mockDeliveredOrders,
    isLoading: mockIsLoading,
  }),
  orderApi: { reducerPath: 'orderApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

describe('DeliveryHistoryPage', () => {
  beforeEach(() => {
    mockDeliveredOrders = [];
    mockIsLoading = false;
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsDriver(<DeliveryHistoryPage />);
    expect(screen.getByText('Delivery History')).toBeInTheDocument();
  });

  it('shows loading skeleton when data is loading', () => {
    mockIsLoading = true;
    const { container } = renderAsDriver(<DeliveryHistoryPage />);
    expect(container.querySelector('[class*="MuiContainer"]')).toBeInTheDocument();
  });

  it('shows empty state when no deliveries', () => {
    renderAsDriver(<DeliveryHistoryPage />);
    expect(screen.getByText('No Deliveries Found')).toBeInTheDocument();
    expect(screen.getByText('Complete deliveries will appear here')).toBeInTheDocument();
  });

  it('displays delivery count header', () => {
    renderAsDriver(<DeliveryHistoryPage />);
    expect(screen.getByText('0 deliveries completed')).toBeInTheDocument();
  });

  it('renders search input field', () => {
    renderAsDriver(<DeliveryHistoryPage />);
    expect(screen.getByPlaceholderText('Search orders...')).toBeInTheDocument();
  });

  it('renders time filter dropdown with options', async () => {
    const user = userEvent.setup();
    renderAsDriver(<DeliveryHistoryPage />);

    // The default time filter value is "today" displayed as "Today"
    const filterSelect = screen.getByText('Today');
    expect(filterSelect).toBeInTheDocument();
  });

  it('displays delivered orders assigned to the driver', () => {
    const now = new Date();
    mockDeliveredOrders = [
      {
        id: 'order-10',
        orderNumber: 'ORD-010',
        assignedDriver: { id: '4' }, // matches mockDriverUser.id
        customerName: 'Delivered Customer',
        totalAmount: 45.99,
        deliveredAt: now.toISOString(),
        updatedAt: now.toISOString(),
        items: [
          { name: 'Margherita Pizza', quantity: 2 },
          { name: 'Garlic Bread', quantity: 1 },
        ],
      },
    ];

    renderAsDriver(<DeliveryHistoryPage />);
    expect(screen.getByText('1 delivery completed')).toBeInTheDocument();
  });

  it('filters orders by search query', async () => {
    const user = userEvent.setup();
    const now = new Date();

    mockDeliveredOrders = [
      {
        id: 'order-10',
        orderNumber: 'ORD-010',
        assignedDriver: { id: '4' },
        customer: { name: 'Alice Smith' },
        totalAmount: 45.99,
        deliveredAt: now.toISOString(),
        updatedAt: now.toISOString(),
        items: [],
      },
    ];

    renderAsDriver(<DeliveryHistoryPage />);

    const searchInput = screen.getByPlaceholderText('Search orders...');
    await user.type(searchInput, 'NONEXISTENT');

    expect(screen.getByText('No Deliveries Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('shows "Try adjusting your search" hint when search yields no results', async () => {
    const user = userEvent.setup();

    mockDeliveredOrders = [
      {
        id: 'order-10',
        orderNumber: 'ORD-010',
        assignedDriver: { id: '4' },
        totalAmount: 20,
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      },
    ];

    renderAsDriver(<DeliveryHistoryPage />);

    const searchInput = screen.getByPlaceholderText('Search orders...');
    await user.type(searchInput, 'xyz-no-match');

    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });
});
