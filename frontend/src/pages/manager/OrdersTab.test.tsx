import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OrdersTab from './OrdersTab';

const order = (over: Record<string, unknown>) => ({
  id: 'id', orderNumber: '1', customerName: 'Customer', storeId: 'DOM001',
  items: [{ menuItemId: 'm1', name: 'Margherita', quantity: 2, price: 8 }],
  subtotal: 16, deliveryFee: 2.5, tax: 2.9, total: 18.5, status: 'PREPARING', orderType: 'DELIVERY',
  paymentStatus: 'PAID', paymentMethod: 'CARD', priority: 'NORMAL', orderSource: 'MASOVA',
  createdAt: '2026-10-12T10:12:00', updatedAt: '2026-10-12T10:12:00', ...over,
});

const orders = [
  order({ id: 'a', orderNumber: '1042', customerName: 'Priya Sharma', status: 'PREPARING', orderSource: 'DELIVEROO' }),
  order({ id: 'b', orderNumber: '1040', customerName: 'Anna Kowalska', status: 'READY', orderType: 'TAKEAWAY' }),
  order({ id: 'c', orderNumber: '1036', customerName: 'Marco Bianchi', status: 'PREPARING' }),
];

vi.mock('../../store/api/orderApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/api/orderApi')>();
  const mutation = () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }];
  return {
    ...actual,
    useGetRecentStoreOrdersQuery: () => ({ data: orders, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
    useUpdateOrderStatusMutation: mutation,
    useUpdateOrderPriorityMutation: mutation,
    useCancelOrderMutation: mutation,
    useApproveCancelRequestMutation: mutation,
    useRejectCancelRequestMutation: mutation,
  };
});

vi.mock('../../store/hooks', () => ({
  useAppSelector: (selector: (s: unknown) => unknown) => selector({ cart: { currency: 'EUR', locale: 'de-DE' } }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock('../../components/modals/AssignDriverModal', () => ({ default: () => null }));

const renderTab = () => render(<MemoryRouter><OrdersTab storeId="DOM001" tabs={<div>tabs</div>} /></MemoryRouter>);

describe('OrdersTab', () => {
  it('shows the order count and rows with the store currency in en format', () => {
    renderTab();
    expect(screen.getByText(/3\s+orders/)).toBeInTheDocument();
    expect(screen.getAllByText('€18.50').length).toBeGreaterThan(0);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });

  it('filters by status, shows a removable chip and a status summary', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.selectOptions(screen.getByLabelText('Status'), 'PREPARING');
    expect(screen.getByText(/2\s+orders/)).toBeInTheDocument();
    expect(screen.getByText('Status: Preparing')).toBeInTheDocument();
    expect(screen.queryByText('Anna Kowalska')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Clear all/ }));
    expect(screen.getByText(/3\s+orders/)).toBeInTheDocument();
  });

  it('opens the order panel with items, totals and the timeline', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole('button', { name: 'View' })[0]);
    const panel = screen.getByRole('region', { name: /Order 1042/ });
    expect(within(panel).getByText(/2 × Margherita/)).toBeInTheDocument();
    expect(within(panel).getByRole('list', { name: 'Order timeline' })).toBeInTheDocument();
    expect(within(panel).getByText('VAT (included)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close order details' }));
    expect(screen.queryByRole('region', { name: /Order 1042/ })).not.toBeInTheDocument();
  });

  it('selects rows and offers a bulk urgent action', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole('checkbox', { name: 'Select order 1042' }));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark urgent' })).toBeInTheDocument();
  });
});
