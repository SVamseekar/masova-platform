import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderAsCustomer, screen, within } from '@/test/utils/testUtils';
import CustomerOrdersPage from './CustomerOrdersPage';

const mocks = vi.hoisted(() => ({ customer: vi.fn(), orders: vi.fn(), requestCancel: vi.fn(), cancelState: { isLoading: false, isSuccess: false } }));
vi.mock('@/store/api/customerApi', async () => ({ ...(await vi.importActual('@/store/api/customerApi')), useGetCustomerByUserIdQuery: () => mocks.customer() }));
vi.mock('@/store/api/orderApi', async () => ({ ...(await vi.importActual('@/store/api/orderApi')), useGetCustomerOrdersQuery: (...args: unknown[]) => mocks.orders(...args), useRequestCancelMutation: () => [mocks.requestCancel, mocks.cancelState] }));
vi.mock('@/store/api/menuApi', async () => ({ ...(await vi.importActual('@/store/api/menuApi')), useGetAvailableMenuQuery: () => ({ currentData: [] }) }));
vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const order = (overrides = {}) => ({
  id: 'o1', orderNumber: 'ORD1042', storeId: 'DOM001', status: 'PREPARING', orderType: 'DELIVERY', currency: 'EUR', createdAt: '2026-10-10T14:12:00',
  subtotal: 23.5, deliveryFee: 1.99, tax: 1.5, total: 28.5, paymentStatus: 'PAID', paymentMethod: 'CARD',
  deliveryAddress: { street: '12 Lindenstrasse', city: 'Berlin', pincode: '10115' },
  items: [{ menuItemId: 'd1', name: 'Chicken Tikka Masala', quantity: 1, price: 15.5, variant: 'Medium' }, { menuItemId: 'd2', name: 'Garlic Naan', quantity: 2, price: 4 }], ...overrides,
});

describe('CustomerOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cancelState = { isLoading: false, isSuccess: false };
    mocks.requestCancel.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mocks.customer.mockReturnValue({ data: { id: 'cust-1' }, isLoading: false, isError: false });
    mocks.orders.mockReturnValue({ data: [
      order({ id: 'o0', orderNumber: 'ORD1041', status: 'DELIVERED', createdAt: '2026-10-08T19:24:00', total: 32 }),
      order(),
      order({ id: 'o9', orderNumber: 'ORD1036', status: 'CANCELLED', createdAt: '2026-10-02T13:40:00', total: 18 }),
    ], isLoading: false, isError: false });
  });

  it('asks the server for this customer\'s orders', () => {
    renderAsCustomer(<CustomerOrdersPage />);
    expect(mocks.orders).toHaveBeenCalledWith('cust-1', expect.objectContaining({ skip: false }));
  });

  it('splits active and past orders and opens the newest active order with its server amounts', () => {
    renderAsCustomer(<CustomerOrdersPage />);
    expect(screen.getByRole('tab', { name: 'Active orders (1)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Past orders (2)' })).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('#1042');
    expect(panel).not.toHaveTextContent('#1041');
    expect(screen.getByRole('button', { name: 'Hide details of order 1042' })).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveTextContent('Medium');
    expect(panel).toHaveTextContent('12 Lindenstrasse');
    expect(panel).toHaveTextContent('10115 Berlin');
    expect(panel).toHaveTextContent('Card · Paid');
    expect(panel).toHaveTextContent(/28[.,]50/);
    expect(screen.getByRole('link', { name: 'View order 1042' })).toHaveAttribute('href', '/tracking/o1');
  });

  it('shows past orders closed, newest first, and expands one on request', async () => {
    const user = userEvent.setup();
    renderAsCustomer(<CustomerOrdersPage />);
    await user.click(screen.getByRole('tab', { name: 'Past orders (2)' }));
    const rows = within(screen.getByRole('tabpanel')).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('#1041');
    expect(rows[0]).toHaveTextContent('08 Oct 2026 at 19:24');
    expect(rows[1]).toHaveTextContent('Cancelled');
    expect(screen.queryByText('Payment method')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show details of order 1041' }));
    expect(screen.getByText('Payment method')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request cancellation' })).not.toBeInTheDocument();
  });

  it('sends a cancellation request and reports a request that was not sent', async () => {
    const user = userEvent.setup();
    renderAsCustomer(<CustomerOrdersPage />);
    await user.click(screen.getByRole('button', { name: 'Request cancellation' }));
    expect(mocks.requestCancel).toHaveBeenCalledWith({ orderId: 'o1' });

    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.requestCancel.mockReturnValue({ unwrap: () => Promise.reject({ status: 409, data: { message: 'The order is already out for delivery.' } }) });
    await user.click(screen.getByRole('button', { name: 'Request cancellation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The order is already out for delivery.');
  });

  it('states that a cancellation is already requested instead of offering it again', () => {
    mocks.orders.mockReturnValue({ data: [order({ cancellationRequested: true })], isLoading: false, isError: false });
    renderAsCustomer(<CustomerOrdersPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Cancellation requested');
    expect(screen.queryByRole('button', { name: 'Request cancellation' })).not.toBeInTheDocument();
  });

  it('shows empty and failed states', async () => {
    const user = userEvent.setup();
    mocks.orders.mockReturnValue({ data: [], isLoading: false, isError: false });
    const empty = renderAsCustomer(<CustomerOrdersPage />);
    expect(screen.getByText(/You have no orders in progress/)).toBeInTheDocument();
    empty.unmount();
    const refetch = vi.fn();
    mocks.orders.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    renderAsCustomer(<CustomerOrdersPage />);
    expect(screen.getByRole('heading', { name: 'Your orders could not be loaded' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });
});
