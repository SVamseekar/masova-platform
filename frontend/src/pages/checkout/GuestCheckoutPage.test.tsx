import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createTestStore } from '../../test/TestWrapper';
import { syncedEuCartPreload } from '../../test/defaultPreloadedState';
import { mockCustomerUser } from '../../test/fixtures/mockUsers';
import { loginSuccess } from '../../store/slices/authSlice';
import GuestCheckoutPage from './GuestCheckoutPage';

const mocks = vi.hoisted(() => ({ query: vi.fn(), stores: vi.fn(), add: vi.fn(), remove: vi.fn(), setDefault: vi.fn(), retry: vi.fn() }));
vi.mock('../../store/api/customerApi', async () => ({ ...await vi.importActual('../../store/api/customerApi'), useGetCustomerByUserIdQuery: () => mocks.query(), useAddAddressMutation: () => [mocks.add], useRemoveAddressMutation: () => [mocks.remove], useSetDefaultAddressMutation: () => [mocks.setDefault] }));
vi.mock('../../store/api/storeApi', async () => ({ ...await vi.importActual('../../store/api/storeApi'), useGetActiveStoresQuery: () => mocks.stores() }));
vi.mock('../../components/common/AddressAutocomplete', () => ({ default: ({ inputId, value, onInputChange, disabled, invalid, describedBy }: { inputId: string; value: string; onInputChange: (value: string) => void; disabled?: boolean; invalid?: boolean; describedBy?: string }) => <input id={inputId} name="addressLine1" value={value} onChange={event => onInputChange(event.target.value)} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} /> }));
const cart = { ...syncedEuCartPreload, items: [{ id: 'pizza', name: 'Pizza', price: 12, quantity: 1, variant: 'Large', customizations: ['Olives'] }], itemCount: 1, total: 12 };
const user = { ...mockCustomerUser, phone: '+491701234567' };
const address = { id: 'address-1', label: 'HOME', addressLine1: 'Alexanderplatz 1', city: 'Berlin', state: 'Berlin', postalCode: '10178', country: 'Germany', isDefault: true };
const profile = { id: 'customer-1', userId: user.id, addresses: [address] };
function PaymentProbe() { const location = useLocation(); return <pre data-testid="handoff">{JSON.stringify(location.state)}</pre>; }
function mount(customer = false) {
  const store = createTestStore({ cart, ...(customer ? { auth: { isAuthenticated: true, user } } : {}) });
  const view = render(<Provider store={store}><MemoryRouter initialEntries={['/guest-checkout']}><Routes><Route path="/guest-checkout" element={<GuestCheckoutPage />} /><Route path="/payment" element={<PaymentProbe />} /></Routes></MemoryRouter></Provider>);
  return { ...view, store };
}
async function fillContact(client: ReturnType<typeof userEvent.setup>) {
  await client.type(screen.getByRole('textbox', { name: 'First name' }), 'Ada');
  await client.type(screen.getByRole('textbox', { name: 'Last name' }), 'Lovelace');
  await client.type(screen.getByRole('textbox', { name: 'Email address' }), 'ada@example.test');
  await client.type(screen.getByRole('textbox', { name: 'Phone number' }), '+491701234567');
}
async function fillAddress(client: ReturnType<typeof userEvent.setup>) {
  await client.type(screen.getByRole('textbox', { name: 'Address line 1' }), 'Hauptstrasse 1');
  await client.type(screen.getByRole('textbox', { name: 'City' }), 'Berlin');
  await client.type(screen.getByRole('textbox', { name: 'State / region' }), 'Berlin');
  await client.type(screen.getByRole('textbox', { name: 'Postal Code (PLZ)' }), '10115');
}
beforeEach(() => {
  mocks.add.mockReset(); mocks.remove.mockReset(); mocks.setDefault.mockReset(); mocks.retry.mockClear();
  mocks.query.mockReturnValue({ currentData: undefined, isLoading: false, isError: false, refetch: mocks.retry });
  mocks.stores.mockReturnValue({ data: [{ id: 'mongo-berlin', storeCode: 'DOM001', name: 'Berlin Mitte', status: 'ACTIVE', countryCode: 'DE', currency: 'EUR', locale: 'de-DE', operatingConfig: {} }], isLoading: false, isError: false, refetch: mocks.retry });
});

describe('checkout details workflow', () => {
  it('keeps same labeled input mounted while typing complete name', async () => {
    const client = userEvent.setup(); mount();
    const input = screen.getByRole('textbox', { name: 'First name' });
    await client.type(input, 'Ada');
    expect(input.isConnected).toBe(true); expect(input).toHaveValue('Ada'); expect(input).toHaveFocus();
  });
  it('starts EU city and region blank with store-derived country', () => {
    mount(); expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue(''); expect(screen.getByRole('textbox', { name: 'State / region' })).toHaveValue(''); expect(screen.getByRole('textbox', { name: 'Country' })).toHaveValue('Germany');
  });
  it('focuses first invalid field and associates inline errors', async () => {
    const client = userEvent.setup(); mount(); await client.click(screen.getByRole('button', { name: 'Continue to payment' }));
    const first = screen.getByRole('textbox', { name: 'First name' }); expect(first).toHaveFocus(); expect(first).toHaveAttribute('aria-invalid', 'true'); expect(first).toHaveAccessibleDescription('First name is required'); expect(screen.queryByTestId('handoff')).not.toBeInTheDocument();
  });
  it('carries pickup type/contact/store/configuration without requiring delivery fields', async () => {
    const client = userEvent.setup(); mount(); await client.click(screen.getByRole('radio', { name: /Pickup/ })); await fillContact(client); await client.click(screen.getByRole('button', { name: 'Continue to payment' }));
    const state = JSON.parse(screen.getByTestId('handoff').textContent!); expect(state).toMatchObject({ orderType: 'TAKEAWAY', checkoutStoreId: 'DOM001', checkoutUserId: null, guestInfo: { name: 'Ada Lovelace', phone: '+491701234567', street: '' } }); expect(state.cartConfiguration).toContain('Large'); expect(state.cartConfiguration).toContain('Olives'); expect(mocks.add).not.toHaveBeenCalled();
  });
  it('preserves manually entered delivery street and labels serviceability pending', async () => {
    const client = userEvent.setup(); mount(); expect(screen.getByText(/Delivery availability and fees are pending/)).toBeInTheDocument(); await fillContact(client); await fillAddress(client); await client.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(JSON.parse(screen.getByTestId('handoff').textContent!).guestInfo).toMatchObject({ street: 'Hauptstrasse 1', city: 'Berlin', state: 'Berlin', pincode: '10115' });
  });
  it('rejects non-numeric German postal code and focuses its retained field', async () => {
    const client = userEvent.setup(); mount(); await fillContact(client); await fillAddress(client);
    const postal = screen.getByRole('textbox', { name: 'Postal Code (PLZ)' });
    await client.clear(postal); await client.type(postal, 'not-a-code');
    await client.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(screen.queryByTestId('handoff')).not.toBeInTheDocument();
    expect(postal).toHaveFocus(); expect(postal).toHaveValue('not-a-code');
    expect(postal).toHaveAccessibleDescription(/German postal code/);
  });
  it('uses selected saved address and preserves failure/default/delete controls', async () => {
    const other = { ...address, id: 'address-2', label: 'WORK', addressLine1: 'Otherstrasse 2', isDefault: false };
    mocks.query.mockReturnValue({ currentData: { ...profile, addresses: [address, other] }, isLoading: false, isError: false });
    mocks.setDefault.mockReturnValue({ unwrap: () => Promise.reject({ data: { message: 'Default update failed' } }) });
    const client = userEvent.setup(); mount(true); await client.click(screen.getByRole('button', { name: 'Set WORK address as default' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Default update failed'); expect(mocks.setDefault).toHaveBeenCalledWith({ customerId: profile.id, addressId: other.id });
    await client.click(screen.getByRole('button', { name: 'Delete HOME address' })); await client.click(screen.getByRole('button', { name: 'Keep address' })); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await client.click(screen.getByRole('radio', { name: /WORK/ })); await client.click(screen.getByRole('button', { name: 'Continue to payment' })); expect(JSON.parse(screen.getByTestId('handoff').textContent!).guestInfo.street).toBe('Otherstrasse 2');
  });
  it('deletes only after confirmed successful server mutation', async () => {
    mocks.query.mockReturnValue({ currentData: profile, isLoading: false, isError: false }); mocks.remove.mockReturnValue({ unwrap: () => Promise.resolve({ ...profile, addresses: [] }) });
    const client = userEvent.setup(); mount(true); await client.click(screen.getByRole('button', { name: 'Delete HOME address' })); expect(mocks.remove).not.toHaveBeenCalled(); await client.click(screen.getByRole('button', { name: 'Delete address' })); await waitFor(() => expect(screen.queryByRole('radio', { name: /HOME/ })).not.toBeInTheDocument()); expect(mocks.remove).toHaveBeenCalledWith({ customerId: profile.id, addressId: address.id }); expect(await screen.findByRole('textbox', { name: 'Address line 1' })).toBeInTheDocument();
  });
  it('retains inputs and prevents duplicate save after API failure', async () => {
    mocks.query.mockReturnValue({ currentData: { ...profile, addresses: [] }, isLoading: false, isError: false }); let reject!: (error: unknown) => void; const pending = new Promise((_resolve, fail) => { reject = fail; }); mocks.add.mockReturnValue({ unwrap: () => pending });
    const client = userEvent.setup(); mount(true); await fillAddress(client); await client.dblClick(screen.getByRole('button', { name: 'Continue to payment' })); expect(mocks.add).toHaveBeenCalledTimes(1); expect(mocks.add.mock.calls[0][0].data.country).toBe('Germany'); await act(async () => reject({ data: { message: 'Address save failed' } })); expect(screen.getByRole('alert')).toHaveTextContent('Address save failed'); expect(screen.getByRole('textbox', { name: 'Address line 1' })).toHaveValue('Hauptstrasse 1'); expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('Berlin'); expect(screen.queryByTestId('handoff')).not.toBeInTheDocument();
  });
  it('discards previous-account query data and late mutation completion', async () => {
    mocks.query.mockReturnValue({ currentData: { ...profile, addresses: [] }, isLoading: false, isError: false }); let resolve!: (data: unknown) => void; const pending = new Promise(done => { resolve = done; }); const abort = vi.fn(); mocks.add.mockReturnValue({ unwrap: () => pending, abort });
    const client = userEvent.setup(); const view = mount(true); await fillAddress(client); await client.click(screen.getByRole('button', { name: 'Continue to payment' }));
    act(() => view.store.dispatch(loginSuccess({ user: { ...user, id: 'customer-B-user', name: 'Customer B' }, accessToken: 'synthetic-B', refreshToken: 'synthetic-refresh-B' })));
    await act(async () => resolve(profile)); expect(abort).toHaveBeenCalled(); expect(screen.queryByTestId('handoff')).not.toBeInTheDocument(); expect(screen.queryByText('Alexanderplatz 1')).not.toBeInTheDocument(); expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('');
  });
  it('shows address-service failure and retry instead of losing customer state', async () => {
    mocks.query.mockReturnValue({ currentData: undefined, isLoading: false, isError: true, refetch: mocks.retry }); const client = userEvent.setup(); mount(true); await client.click(screen.getByRole('button', { name: 'Retry addresses' })); expect(mocks.retry).toHaveBeenCalled(); expect(screen.getByRole('textbox', { name: 'Phone number' })).toHaveValue(user.phone);
  });
});
