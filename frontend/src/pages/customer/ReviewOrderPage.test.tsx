import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderAsCustomer, screen, within } from '@/test/utils/testUtils';
import ReviewOrderPage from './ReviewOrderPage';

const mocks = vi.hoisted(() => ({ order: vi.fn(), createReview: vi.fn(), createState: { isLoading: false, isSuccess: false } }));
vi.mock('@/store/api/orderApi', async () => ({ ...(await vi.importActual('@/store/api/orderApi')), useGetOrderQuery: () => mocks.order() }));
vi.mock('@/store/api/reviewApi', async () => ({ ...(await vi.importActual('@/store/api/reviewApi')), useCreateReviewMutation: () => [mocks.createReview, mocks.createState] }));
vi.mock('@/store/api/menuApi', async () => ({ ...(await vi.importActual('@/store/api/menuApi')), useGetAvailableMenuQuery: () => ({ currentData: [] }) }));
vi.mock('@/store/api/storeApi', async () => ({ ...(await vi.importActual('@/store/api/storeApi')), useGetActiveStoresQuery: () => ({ data: [{ id: 's1', storeCode: 'DOM001', name: 'MaSoVa Berlin Mitte', address: { city: 'Berlin' } }] }) }));
vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useParams: () => ({ orderId: 'order-1' }) }));

const order = (overrides = {}) => ({ id: 'order-1', orderNumber: 'ORD10248', storeId: 'DOM001', status: 'DELIVERED', orderType: 'DELIVERY', currency: 'EUR', createdAt: '2026-10-10T13:42:00', subtotal: 21.9, deliveryFee: 2, tax: 1.67, total: 25.57, items: [{ menuItemId: 'd1', name: 'Chicken Tikka Masala', quantity: 1, price: 14.5 }], ...overrides });

describe('ReviewOrderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createState = { isLoading: false, isSuccess: false };
    mocks.order.mockReturnValue({ data: order(), isLoading: false });
    mocks.createReview.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows the order with its server amounts', () => {
    renderAsCustomer(<ReviewOrderPage />);
    const summary = screen.getByRole('region', { name: 'Order summary' });
    expect(summary).toHaveTextContent('Order #10248');
    expect(summary).toHaveTextContent('Delivered');
    expect(summary).toHaveTextContent('Berlin Mitte');
    expect(summary).toHaveTextContent(/25[.,]57/);
  });

  it('requires an overall rating before sending', async () => {
    const user = userEvent.setup();
    renderAsCustomer(<ReviewOrderPage />);
    await user.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an overall rating.');
    expect(mocks.createReview).not.toHaveBeenCalled();
  });

  it('sends ratings, comment and the public choice; a review is private unless made public', async () => {
    const user = userEvent.setup();
    renderAsCustomer(<ReviewOrderPage />);
    await user.click(within(screen.getByRole('group', { name: 'Overall rating' })).getByRole('radio', { name: '4 stars, Good' }));
    await user.type(screen.getByLabelText(/Your comments/), 'Great food');
    expect(screen.getByText('10/500')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(mocks.createReview).toHaveBeenCalledWith({ orderId: 'order-1', overallRating: 4, comment: 'Great food', isAnonymous: true });
  });

  it('offers a delivery rating for delivery orders only', () => {
    const delivery = renderAsCustomer(<ReviewOrderPage />);
    expect(screen.getByRole('group', { name: 'Delivery experience' })).toBeInTheDocument();
    delivery.unmount();
    mocks.order.mockReturnValue({ data: order({ orderType: 'TAKEAWAY', status: 'COMPLETED' }), isLoading: false });
    renderAsCustomer(<ReviewOrderPage />);
    expect(screen.queryByRole('group', { name: 'Delivery experience' })).not.toBeInTheDocument();
    expect(screen.queryByText('Delivery fee')).not.toBeInTheDocument();
  });

  it('reports a review that was not saved', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.createReview.mockReturnValue({ unwrap: () => Promise.reject({ data: { error: 'You have already reviewed this order' } }) });
    renderAsCustomer(<ReviewOrderPage />);
    await user.click(screen.getAllByRole('radio', { name: '5 stars, Excellent' })[0]);
    await user.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You have already reviewed this order');
  });

  it('does not offer the form for an order that is not finished or not readable', () => {
    mocks.order.mockReturnValue({ data: order({ status: 'PREPARING' }), isLoading: false });
    const early = renderAsCustomer(<ReviewOrderPage />);
    expect(screen.getByRole('heading', { name: 'This order cannot be reviewed yet' })).toBeInTheDocument();
    early.unmount();
    mocks.order.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    renderAsCustomer(<ReviewOrderPage />);
    expect(screen.getByRole('heading', { name: 'This order could not be loaded' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit review' })).not.toBeInTheDocument();
  });

  it('confirms a saved review', () => {
    mocks.createState = { isLoading: false, isSuccess: true };
    renderAsCustomer(<ReviewOrderPage />);
    expect(screen.getByRole('heading', { name: 'Thank you for your review' })).toBeInTheDocument();
  });
});
