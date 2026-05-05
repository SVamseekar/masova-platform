import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlatformPnLPage from './PlatformPnLPage';

const mockOrders = [
  {
    id: '1', orderNumber: 'W001', customerName: 'A', storeId: 'store1',
    items: [{ name: 'Burger', quantity: 2, price: 300, menuItemId: 'm1' }],
    total: 600, orderSource: 'WOLT', aggregatorCommission: 168, aggregatorNetPayout: 432,
  },
  {
    id: '2', orderNumber: 'D001', customerName: 'B', storeId: 'store1',
    items: [{ name: 'Pizza', quantity: 1, price: 500, menuItemId: 'm2' }],
    total: 500, orderSource: 'DELIVEROO', aggregatorCommission: 150, aggregatorNetPayout: 350,
  },
  {
    id: '3', orderNumber: 'M001', customerName: 'C', storeId: 'store1',
    items: [{ name: 'Salad', quantity: 1, price: 200, menuItemId: 'm3' }],
    total: 200, orderSource: 'MASOVA',
  },
];

vi.mock('../../store/api/orderApi', () => ({
  useGetStoreOrdersQuery: vi.fn(() => ({ data: mockOrders, isLoading: false, error: null })),
}));

vi.mock('../../store/hooks', () => ({
  useAppSelector: (selector: (s: unknown) => unknown) => {
    const fakeState = {
      auth: { token: 'tok', user: { storeId: 'store1', type: 'MANAGER' } },
      cart: { selectedStoreId: 'store1' },
    };
    return selector(fakeState);
  },
  useAppDispatch: () => vi.fn(),
}));

describe('PlatformPnLPage', () => {
  it('renders platform P&L heading', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Platform P&L')).toBeDefined();
  });

  it('shows direct revenue summary tile', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Direct Revenue')).toBeDefined();
  });

  it('shows aggregator gross and commission tiles', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Aggregator Gross')).toBeDefined();
    expect(screen.getByText('Total Commission')).toBeDefined();
  });

  it('renders all 4 platform rows in the table', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Wolt')).toBeDefined();
    expect(screen.getByText('Deliveroo')).toBeDefined();
    expect(screen.getByText('Just Eat')).toBeDefined();
    expect(screen.getByText('Uber Eats')).toBeDefined();
  });
});
