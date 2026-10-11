import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createTestStore } from '../../test/TestWrapper';
import { syncedEuCartPreload } from '../../test/defaultPreloadedState';
import { mockCustomerUser } from '../../test/fixtures/mockUsers';
import PaymentPage from '../customer/PaymentPage';
import { checkoutCartConfiguration } from './components/checkoutContext';

const mocks = vi.hoisted(() => ({ create: vi.fn(), initiate: vi.fn(), customer: vi.fn(), radius: vi.fn() }));
vi.mock('../../store/api/orderApi', async () => ({ ...await vi.importActual('../../store/api/orderApi'), useCreateOrderMutation: () => [mocks.create, { isLoading: false }] }));
vi.mock('../../store/api/paymentApi', async () => ({ ...await vi.importActual('../../store/api/paymentApi'), useInitiatePaymentMutation: () => [mocks.initiate, { isLoading: false }] }));
vi.mock('../../store/api/customerApi', async () => ({ ...await vi.importActual('../../store/api/customerApi'), useGetCustomerByUserIdQuery: () => mocks.customer(), useGetOrCreateCustomerMutation: () => [vi.fn()], useUpdatePreferencesMutation: () => [vi.fn()] }));
vi.mock('../../store/api/storeApi', async () => ({ ...await vi.importActual('../../store/api/storeApi'), useCheckDeliveryRadiusQuery: (...args: unknown[]) => mocks.radius(...args) }));
const cart = { ...syncedEuCartPreload, items: [{ id: 'pizza', name: 'Pizza', quantity: 1, price: 12, variant: 'Large', customizations: ['Olives'] }], itemCount: 1, total: 12 };
const guestInfo = { name: 'Guest Person', email: 'guest@example.test', phone: '+491701234567', street: 'Differentstrasse 1', city: 'Berlin', state: 'Berlin', pincode: '10115' };
function mount(orderType: 'DELIVERY' | 'TAKEAWAY', account = false, storeId = 'DOM001') {
  const store = createTestStore({ cart, ...(account ? { auth: { isAuthenticated: true, user: mockCustomerUser } } : {}) });
  render(<Provider store={store}><MemoryRouter initialEntries={[{ pathname: '/payment', state: { orderType, checkoutStoreId: storeId, checkoutUserId: account ? mockCustomerUser.id : null, cartConfiguration: checkoutCartConfiguration(cart.items), guestInfo } }]}><PaymentPage /></MemoryRouter></Provider>);
}
beforeEach(() => {
  mocks.create.mockReset(); mocks.initiate.mockReset(); mocks.radius.mockClear();
  mocks.create.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'synthetic-order', total: 12 }) });
  mocks.customer.mockReturnValue({ data: undefined });
  mocks.radius.mockReturnValue({ data: { withinRadius: false, deliveryRadiusKm: 5 } });
});
describe('checkout payment handoff', () => {
  it('keeps pickup order type through actual order mutation and configuration DTO', async () => {
    const client = userEvent.setup(); mount('TAKEAWAY');
    expect(screen.getByText('Cash on Pickup')).toBeInTheDocument();
    await client.click(screen.getByText('Cash on Pickup'));
    await client.click(screen.getByRole('button', { name: /Place Order/i }));
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ orderType: 'TAKEAWAY', storeId: 'DOM001', items: [expect.objectContaining({ menuItemId: 'pizza', variant: 'Large', customizations: ['Olives'] })], deliveryAddress: undefined }));
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it('never applies unrelated saved-default outside-radius result to carried details', () => {
    mocks.customer.mockReturnValue({ data: { id: 'customer-1', addresses: [{ id: 'default', isDefault: true, addressLine1: 'Unrelatedstrasse', latitude: 52, longitude: 13 }] } });
    mount('DELIVERY', true);
    expect(mocks.radius).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
    expect(screen.queryByText(/outside this store's delivery area/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay/i })).toBeEnabled();
    expect(screen.getByText(/Differentstrasse/)).toBeInTheDocument();
  });
  it('blocks carried details after store/context changes and explains recovery', () => {
    mount('DELIVERY', false, 'OTHER');
    expect(screen.getByRole('alert')).toHaveTextContent('store, cart or account changed');
    expect(screen.getByRole('button', { name: /Pay/i })).toBeDisabled();
    expect(screen.queryByText('Differentstrasse 1')).not.toBeInTheDocument();
  });
});
