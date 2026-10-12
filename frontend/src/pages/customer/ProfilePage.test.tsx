import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderAsCustomer, screen, within } from '@/test/utils/testUtils';
import ProfilePage from './ProfilePage';

const mocks = vi.hoisted(() => ({
  customer: vi.fn(), channels: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), addAddress: vi.fn(), updateAddress: vi.fn(),
  removeAddress: vi.fn(), setDefaultAddress: vi.fn(), updatePreferences: vi.fn(), updateChannels: vi.fn(),
}));
const idle = { isLoading: false };
vi.mock('@/store/api/customerApi', async () => ({
  ...(await vi.importActual('@/store/api/customerApi')),
  useGetCustomerByUserIdQuery: () => mocks.customer(),
  useCreateCustomerMutation: () => [mocks.createCustomer, idle],
  useUpdateCustomerMutation: () => [mocks.updateCustomer, idle],
  useAddAddressMutation: () => [mocks.addAddress, idle],
  useUpdateAddressMutation: () => [mocks.updateAddress, idle],
  useRemoveAddressMutation: () => [mocks.removeAddress, idle],
  useSetDefaultAddressMutation: () => [mocks.setDefaultAddress, idle],
  useUpdatePreferencesMutation: () => [mocks.updatePreferences, idle],
}));
vi.mock('@/store/api/notificationApi', async () => ({
  ...(await vi.importActual('@/store/api/notificationApi')),
  useGetUserPreferencesQuery: () => mocks.channels(),
  useUpdateUserPreferencesMutation: () => [mocks.updateChannels, idle],
}));
vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const customer = {
  id: 'cust-1', name: 'Sara Patel', email: 'sara.patel@example.com', phone: '+4915123456789', defaultAddressId: 'a1',
  addresses: [
    { id: 'a1', label: 'HOME', addressLine1: 'Musterstrasse 12', city: 'Berlin', state: 'Berlin', postalCode: '10115', country: 'Germany', isDefault: true },
    { id: 'a2', label: 'WORK', addressLine1: 'Leipziger Platz 8', city: 'Berlin', state: 'Berlin', postalCode: '10117', country: 'Germany', isDefault: false },
  ],
  preferences: { dietaryRestrictions: ['Vegetarian'], spiceLevel: 'MILD', allergenAlerts: ['MILK'], notifyOnOrderStatus: true, notifyOnOffers: false },
};
const show = (route = '/customer/profile') => renderAsCustomer(<ProfilePage />, { initialEntries: [route] });

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mocks).forEach(mock => mock.mockReturnValue(ok()));
    mocks.customer.mockReturnValue({ data: customer, isLoading: false, isError: false });
    mocks.channels.mockReturnValue({ data: { id: 'p1', userId: 'u1', inAppEnabled: true, emailEnabled: true, smsEnabled: true, pushEnabled: false, promotionalEnabled: false }, isError: false });
  });

  it('shows the profile split into first and last name and saves edits', async () => {
    const user = userEvent.setup();
    show();
    expect(screen.getByLabelText('First name')).toHaveValue('Sara');
    expect(screen.getByLabelText('Last name')).toHaveValue('Patel');
    await user.clear(screen.getByLabelText('Last name'));
    await user.type(screen.getByLabelText('Last name'), 'Patel-Roy');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(mocks.updateCustomer).toHaveBeenCalledWith({ id: 'cust-1', data: expect.objectContaining({ name: 'Sara Patel-Roy', email: 'sara.patel@example.com' }) });
    expect(await screen.findByText('Your profile was saved.')).toBeInTheDocument();
  });

  it('rejects an invalid email without calling the server, and reports a failed save', async () => {
    const user = userEvent.setup();
    show();
    await user.clear(screen.getByLabelText('Email address'));
    await user.type(screen.getByLabelText('Email address'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mocks.updateCustomer).not.toHaveBeenCalled();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateCustomer.mockReturnValue({ unwrap: () => Promise.reject({ data: { message: 'This email is already in use.' } }) });
    await user.clear(screen.getByLabelText('Email address'));
    await user.type(screen.getByLabelText('Email address'), 'taken@example.com');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This email is already in use.');
  });

  it('lists addresses, marks the default and changes it', async () => {
    const user = userEvent.setup();
    show();
    const cards = within(screen.getByRole('region', { name: 'Delivery addresses' })).getAllByRole('listitem');
    expect(cards[0]).toHaveTextContent('Default');
    expect(cards[0]).toHaveTextContent('Musterstrasse 12');
    expect(within(cards[0]).queryByRole('button', { name: 'Set as default' })).not.toBeInTheDocument();
    await user.click(within(cards[1]).getByRole('button', { name: 'Set as default' }));
    expect(mocks.setDefaultAddress).toHaveBeenCalledWith({ customerId: 'cust-1', addressId: 'a2' });
  });

  it('deletes an address only after a second confirmation', async () => {
    const user = userEvent.setup();
    show();
    await user.click(screen.getByRole('button', { name: 'Delete Office address' }));
    expect(mocks.removeAddress).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(mocks.removeAddress).toHaveBeenCalledWith({ customerId: 'cust-1', addressId: 'a2' });
  });

  it('adds an address through the dialog and requires the address fields', async () => {
    const user = userEvent.setup();
    show();
    await user.click(screen.getByRole('button', { name: 'Add address' }));
    const dialog = screen.getByRole('dialog', { name: 'Add address' });
    await user.click(within(dialog).getByRole('button', { name: 'Save address' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Enter the street, postal code, city and region.');
    expect(mocks.addAddress).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText('Street and house number'), 'Torstrasse 1');
    await user.type(within(dialog).getByLabelText('City'), 'Berlin');
    await user.type(within(dialog).getByLabelText('State or region'), 'Berlin');
    await user.type(document.getElementById('address-postal') as HTMLInputElement, '10119');
    await user.click(within(dialog).getByRole('button', { name: 'Save address' }));
    expect(mocks.addAddress).toHaveBeenCalledWith({ customerId: 'cust-1', data: expect.objectContaining({ label: 'HOME', addressLine1: 'Torstrasse 1', city: 'Berlin', state: 'Berlin', postalCode: '10119' }) });
  });

  it('shows saved food and notification preferences and saves both kinds', async () => {
    const user = userEvent.setup();
    show('/customer/profile?section=preferences');
    expect(screen.getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radio', { name: 'Mild' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Email notifications' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Push notifications' })).not.toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Hot' }));
    await user.click(screen.getByRole('button', { name: 'Vegan' }));
    await user.click(screen.getByRole('switch', { name: 'Promotions and offers' }));
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(mocks.updatePreferences).toHaveBeenCalledWith({ customerId: 'cust-1', data: expect.objectContaining({ spiceLevel: 'HOT', dietaryRestrictions: ['Vegetarian', 'Vegan'], allergenAlerts: ['MILK'], notifyOnOffers: true }) });
    // Fields the page does not edit go back unchanged, because the server replaces the record.
    expect(mocks.updateChannels).toHaveBeenCalledWith({ userId: expect.any(String), preferences: { id: 'p1', userId: 'u1', inAppEnabled: true, emailEnabled: true, smsEnabled: true, pushEnabled: false, promotionalEnabled: true } });
    expect(await screen.findByText('Your preferences were saved.')).toBeInTheDocument();
  });

  it('does not show or save channel switches it could not load', async () => {
    const user = userEvent.setup();
    mocks.channels.mockReturnValue({ data: undefined, isError: true, refetch: vi.fn() });
    show('/customer/profile?section=notifications');
    expect(screen.getByRole('alert')).toHaveTextContent('Your channel settings could not be loaded.');
    expect(screen.queryByRole('switch', { name: 'Email notifications' })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Order updates' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(mocks.updatePreferences.mock.calls[0][0].data).not.toHaveProperty('notifyOnOffers');
    expect(mocks.updateChannels).not.toHaveBeenCalled();
    expect(await screen.findByText(/Channel settings could not be loaded, so they were not changed/)).toBeInTheDocument();
  });

  it('says which part was saved when the channel save fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateChannels.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) });
    show('/customer/profile?section=preferences');
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByText('Your food preferences were saved, but your notification channels were not. Try again.')).toBeInTheDocument();
  });

  it('asks for a phone number with a country code', async () => {
    const user = userEvent.setup();
    show();
    await user.clear(screen.getByLabelText('Phone number'));
    await user.type(screen.getByLabelText('Phone number'), '0170 1234567');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText(/country code/)).toBeInTheDocument();
    expect(mocks.updateCustomer).not.toHaveBeenCalled();
  });

  it('offers to create a missing profile and reports other load failures', async () => {
    const user = userEvent.setup();
    mocks.customer.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: { status: 404 } });
    const missing = show();
    await user.click(screen.getByRole('button', { name: 'Create profile' }));
    expect(mocks.createCustomer).toHaveBeenCalledWith(expect.objectContaining({ marketingOptIn: false, smsOptIn: false }));
    missing.unmount();
    const refetch = vi.fn();
    mocks.customer.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: { status: 500 }, refetch });
    show();
    expect(screen.getByRole('heading', { name: 'Your profile could not be loaded' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });
});
