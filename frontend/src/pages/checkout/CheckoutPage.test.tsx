import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils/testUtils';
import { syncedEuCartPreload } from '../../test/defaultPreloadedState';
import CheckoutPage from './CheckoutPage';
const mocks = vi.hoisted(() => ({ stores: vi.fn(), navigate: vi.fn() }));
vi.mock('../../store/api/storeApi', async () => ({ ...await vi.importActual('../../store/api/storeApi'), useGetActiveStoresQuery: () => mocks.stores() }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual('react-router-dom'), useNavigate: () => mocks.navigate }));
const cart = { ...syncedEuCartPreload, items: [{ id: 'pizza', name: 'Pizza', quantity: 1, price: 12 }], itemCount: 1, total: 12 };
beforeEach(() => { mocks.navigate.mockClear(); mocks.stores.mockReturnValue({ data: [{ id: 'mongo-store', storeCode: 'DOM001', name: 'Berlin Mitte', status: 'ACTIVE', countryCode: 'DE', currency: 'EUR', locale: 'de-DE', operatingConfig: {} }], isError: false }); });
describe('checkout choice', () => {
  it('offers labelled radio choices and one Continue action', async () => {
    const client = userEvent.setup(); renderWithProviders(<CheckoutPage />, { preloadedState: { cart } }); expect(screen.getAllByRole('radio')).toHaveLength(3); expect(screen.getByRole('radio', { name: /Sign in/ })).toBeChecked(); await client.click(screen.getByRole('radio', { name: /Continue as guest/ })); await client.click(screen.getByRole('button', { name: 'Continue', exact: true })); expect(mocks.navigate).toHaveBeenCalledWith('/guest-checkout');
  });
  it('routes sign-in/create-account choice through existing account pages', async () => {
    const client = userEvent.setup(); renderWithProviders(<CheckoutPage />, { preloadedState: { cart } }); await client.click(screen.getByRole('button', { name: 'Continue', exact: true })); expect(mocks.navigate).toHaveBeenCalledWith('/customer-login', { state: { from: '/checkout' } }); await client.click(screen.getByRole('radio', { name: /Create account/ })); await client.click(screen.getByRole('button', { name: 'Continue', exact: true })); expect(mocks.navigate).toHaveBeenCalledWith('/register', { state: { from: '/checkout' } });
  });
  it('labels menu amounts provisional and blocks empty or unavailable checkout', () => {
    renderWithProviders(<CheckoutPage />, { preloadedState: { cart: { ...cart, items: [], itemCount: 0 } } }); expect(screen.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled(); expect(screen.getByText(/Menu subtotal is provisional/)).toBeInTheDocument(); expect(screen.getByText('Calculated by store')).toBeInTheDocument(); expect(screen.getAllByText('Confirmed with order')).toHaveLength(2);
  });
});
