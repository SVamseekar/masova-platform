import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderAsCustomer, screen, within } from '@/test/utils/testUtils';
import CustomerDashboard, { orderDate } from './CustomerDashboard';

const mocks = vi.hoisted(() => ({ customer: vi.fn(), orders: vi.fn(), browse: vi.fn() }));
vi.mock('@/store/api/customerApi', async () => ({ ...(await vi.importActual('@/store/api/customerApi')), useGetCustomerByUserIdQuery: () => mocks.customer() }));
vi.mock('@/store/api/orderApi', async () => ({ ...(await vi.importActual('@/store/api/orderApi')), useGetCustomerOrdersQuery: (...args: unknown[]) => mocks.orders(...args) }));
vi.mock('@/apps/PublicWebsite/components/useBrowseMenu', async () => ({ ...(await vi.importActual('@/apps/PublicWebsite/components/useBrowseMenu')), useBrowseMenu: () => mocks.browse() }));
vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/apps/PublicWebsite/components/DishCustomization', () => ({ default: ({ item }: { item: { name: string } }) => <div role="dialog">Customise {item.name}</div> }));

const dish = (id: string, name: string, basePrice: number) => ({ id, name, basePrice, imageUrl: '' });
const order = (overrides = {}) => ({ id: 'o1', orderNumber: 'ORD1042', status: 'PREPARING', orderType: 'DELIVERY', currency: 'EUR', createdAt: '2026-10-10T14:12:00', total: 28.5, preparationTime: 20, items: [{ menuItemId: 'd1', name: 'Chicken Tikka Masala', quantity: 1, price: 15.5 }, { menuItemId: 'd2', name: 'Garlic Naan', quantity: 2, price: 4 }], ...overrides });
const customer = (overrides = {}) => ({ id: 'cust-1', name: 'alex meyer', loyaltyInfo: { tier: 'SILVER', totalPoints: 320, pointsEarned: 400 }, preferences: { favoriteMenuItems: [] }, ...overrides });

describe('CustomerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.customer.mockReturnValue({ data: customer(), isLoading: false, isError: false });
    mocks.orders.mockReturnValue({ data: [order(), order({ id: 'o0', orderNumber: 'ORD1041', status: 'DELIVERED', createdAt: '2026-10-08T19:24:00', total: 32 })], isLoading: false, isError: false });
    mocks.browse.mockReturnValue({ items: [dish('d1', 'Chicken Tikka Masala', 1550), dish('d2', 'Garlic Naan', 400), dish('d3', 'Paneer Tikka', 1400)], market: { currency: 'EUR', locale: 'de-DE' }, menu: { isFetching: false, isLoading: false }, online: true, canOrder: true, selectedStoreId: 'DOM001' });
  });

  it('greets the customer by first name and shows reward points from the profile', () => {
    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Good (morning|afternoon|evening), Alex$/);
    const rewards = screen.getByRole('region', { name: 'MaSoVa Rewards' });
    expect(rewards).toHaveTextContent('Silver tier');
    expect(rewards).toHaveTextContent('320');
  });

  it('shows the active order with its kitchen step and a link to tracking', () => {
    renderAsCustomer(<CustomerDashboard />);
    const active = screen.getByRole('region', { name: 'Your active order' });
    expect(within(active).getByRole('link')).toHaveAttribute('href', '/tracking/o1');
    expect(active).toHaveTextContent('#1042');
    expect(active).toHaveTextContent('+ 1 more item');
    const steps = within(active).getAllByRole('listitem');
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(steps[0]).toHaveAttribute('data-state', 'done');
  });

  it('lists recent orders newest first with status and total', () => {
    renderAsCustomer(<CustomerDashboard />);
    const rows = within(screen.getByRole('region', { name: 'Recent orders' })).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('#1042');
    expect(rows[0]).toHaveTextContent('Preparing');
    expect(rows[1]).toHaveTextContent('#1041');
    expect(rows[1]).toHaveTextContent('Delivered');
    expect(rows[1]).toHaveTextContent('08 Oct 2026');
  });

  it('offers the most ordered dishes again and opens the dish dialog to add one', async () => {
    const user = userEvent.setup();
    renderAsCustomer(<CustomerDashboard />);
    const section = screen.getByRole('region', { name: 'Order again' });
    expect(within(section).getAllByRole('listitem')[0]).toHaveTextContent('Garlic Naan');
    await user.click(within(section).getByRole('button', { name: 'Add Chicken Tikka Masala' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Customise Chicken Tikka Masala');
  });

  it('uses saved favourites when the profile has them', () => {
    mocks.customer.mockReturnValue({ data: customer({ preferences: { favoriteMenuItems: ['d3'] } }), isLoading: false, isError: false });
    renderAsCustomer(<CustomerDashboard />);
    expect(within(screen.getByRole('region', { name: 'Your favourites' })).getByText('Paneer Tikka')).toBeInTheDocument();
  });

  it('shows empty states without an active order or history', () => {
    mocks.customer.mockReturnValue({ data: customer({ loyaltyInfo: null }), isLoading: false, isError: false });
    mocks.orders.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderAsCustomer(<CustomerDashboard />);
    expect(screen.queryByRole('region', { name: 'Your active order' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'MaSoVa Rewards' })).not.toBeInTheDocument();
    expect(screen.getByText(/You have no orders yet/)).toBeInTheDocument();
    expect(screen.getByText('Dishes you order appear here.')).toBeInTheDocument();
  });

  it('reports a profile that could not be loaded and an order list that could not be loaded', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mocks.customer.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const failed = renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByRole('heading', { name: 'Your account could not be loaded' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
    failed.unmount();

    mocks.customer.mockReturnValue({ data: customer(), isLoading: false, isError: false });
    mocks.orders.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    renderAsCustomer(<CustomerDashboard />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your orders could not be loaded.');
  });

  it('formats order dates', () => {
    const now = new Date('2026-10-10T18:00:00');
    expect(orderDate('2026-10-10T14:12:00', now)).toBe('Today, 14:12');
    expect(orderDate('2026-10-08T19:24:00', now)).toBe('08 Oct 2026');
    expect(orderDate('2026-10-08T19:24:00', now, true)).toBe('08 Oct 2026 at 19:24');
    expect(orderDate('not a date', now)).toBe('');
  });
});
