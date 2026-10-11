import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createTestStore } from '../../test/TestWrapper';
import { syncedEuCartPreload } from '../../test/defaultPreloadedState';
import { mockCustomerUser } from '../../test/fixtures/mockUsers';
import PaymentSuccessPage from './PaymentSuccessPage';

const mocks = vi.hoisted(() => ({ track: vi.fn(), limited: vi.fn() }));
vi.mock('../../store/api/orderApi', async () => ({ ...await vi.importActual('../../store/api/orderApi'), useGetOrderQuery: () => mocks.track(), useTrackOrderQuery: () => mocks.limited() }));
vi.mock('../../store/api/paymentApi', async () => ({ ...await vi.importActual('../../store/api/paymentApi'), useVerifyPaymentMutation: () => [vi.fn(), { isLoading: false, isError: false }] }));

const order = { id: 'order-1', orderNumber: 'ORD1', status: 'RECEIVED', orderType: 'DELIVERY', paymentStatus: 'PENDING', currency: 'EUR', vatCountryCode: 'DE', subtotal: 8.9, deliveryFee: 1.99, tax: 0, totalVatAmount: 0.62, total: 11.51, createdAt: '2026-10-11T12:00:00Z', items: [{ menuItemId: 'm1', name: 'Masala Dosa', quantity: 1, price: 8.9 }] };
function mount(query: string, data: unknown, signedIn = true) {
  mocks.track.mockReturnValue({ data, isLoading: false, isError: false, refetch: vi.fn() });
  mocks.limited.mockReturnValue({ data: { id: 'order-1', orderNumber: 'ORD1', status: 'RECEIVED', items: [] }, isLoading: false, isError: false, refetch: vi.fn() });
  const store = createTestStore({ cart: { ...syncedEuCartPreload, items: [{ id: 'm1', name: 'Masala Dosa', quantity: 1, price: 8.9 }], itemCount: 1, total: 8.9 }, ...(signedIn ? { auth: { isAuthenticated: true, user: mockCustomerUser } } : {}) });
  render(<Provider store={store}><MemoryRouter initialEntries={[`/payment/success?${query}`]}><PaymentSuccessPage /></MemoryRouter></Provider>);
  return store;
}
beforeEach(() => mocks.track.mockReset());

describe('payment result', () => {
  it('does not claim success while the store still reports the payment as pending', () => {
    mount('order_id=order-1&redirect_status=succeeded', order);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Confirming your payment');
    expect(screen.queryByText(/Payment successful/)).not.toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });
  it('shows success and server amounts once the store reports the order as paid', () => {
    mount('order_id=order-1&redirect_status=succeeded', { ...order, paymentStatus: 'PAID' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Payment successful!');
    expect(screen.getByText('#ORD1')).toBeInTheDocument();
    expect(screen.getByText('Total paid').nextElementSibling).toHaveTextContent('11,51');
    expect(screen.getByText('VAT').nextElementSibling).toHaveTextContent('0,62');
  });
  it('reports an unconfirmed payment when the provider did not succeed', () => {
    mount('order_id=order-1&redirect_status=failed', order);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Payment not confirmed');
  });
  it('keeps the cart when the provider did not succeed', () => {
    const store = mount('order_id=order-1&redirect_status=failed', order);
    expect(store.getState().cart.items).toHaveLength(1);
  });
  it('makes no payment claim from the public tracking view', () => {
    mount('order_id=order-1&redirect_status=succeeded', order, false);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Payment submitted');
    expect(screen.getByRole('status')).toHaveTextContent('cannot be shown on this page');
  });
});
