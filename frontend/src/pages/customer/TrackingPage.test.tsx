import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, renderWithProviders, screen, within } from '@/test/utils/testUtils';
import TrackingPage from './TrackingPage';

const mocks = vi.hoisted(() => ({ order: vi.fn() }));

vi.mock('./useCustomerOrder', async () => ({ ...(await vi.importActual('./useCustomerOrder')), useCustomerOrder: () => mocks.order() }));
vi.mock('@/store/api/storeApi', async () => ({ ...(await vi.importActual('@/store/api/storeApi')), useGetActiveStoresQuery: () => ({ data: [{ id: 's1', storeCode: 'DOM001', name: 'MaSoVa Berlin Mitte', address: { street: 'Torstraße 72', city: 'Berlin' } }] }) }));
vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useParams: () => ({ orderId: 'order-1' }) }));

const order = {
  id: 'order-1', orderNumber: 'ORD2041', storeId: 'DOM001', status: 'PREPARING', orderType: 'DELIVERY', currency: 'EUR', createdAt: '2026-10-10T14:28:00Z',
  items: [{ menuItemId: 'm1', name: 'Chicken Tikka Masala', quantity: 1, price: 14.9, variant: 'Medium', customizations: ['Basmati rice'], notes: 'Spice: mild' }, { menuItemId: 'm2', name: 'Garlic Naan', quantity: 2, price: 3.5 }],
  subtotal: 21.9, deliveryFee: 1.99, tax: 1.53, totalVatAmount: 1.53, total: 23.89, paymentStatus: 'PAID', paymentMethod: 'CARD',
};
const show = (overrides = {}, extra = {}) => mocks.order.mockReturnValue({ order: { ...order, ...overrides }, isLoading: false, isError: false, limited: false, refetch: vi.fn(), ...extra });

describe('Order tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the order, its current step and server amounts', () => {
    show();
    renderAsCustomer(<TrackingPage />);
    expect(screen.getByRole('heading', { name: /Order #2041/ })).toBeInTheDocument();
    const steps = within(screen.getByRole('list', { name: 'Order steps' })).getAllByRole('listitem');
    expect(steps.map(step => step.querySelector('b')?.textContent)).toEqual(['Received', 'Preparing', 'In oven', 'Ready', 'Dispatched', 'Out for delivery', 'Delivered']);
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(steps[0]).toHaveAttribute('data-state', 'done');
    expect(screen.getByText('Your food is being prepared')).toBeInTheDocument();
    expect(screen.getByText('Medium, Basmati rice')).toBeInTheDocument();
    expect(screen.getByText('Note: Spice: mild')).toBeInTheDocument();
    expect(screen.getByText('Total paid')).toBeInTheDocument();
    expect(screen.getByText(/23[.,]89/)).toBeInTheDocument();
    expect(screen.getByText('Berlin Mitte')).toBeInTheDocument();
  });

  it('uses pickup steps and no delivery fee for a takeaway order', () => {
    show({ orderType: 'TAKEAWAY', status: 'READY' });
    renderAsCustomer(<TrackingPage />);
    const steps = within(screen.getByRole('list', { name: 'Order steps' })).getAllByRole('listitem');
    expect(steps).toHaveLength(5);
    expect(steps[4]).toHaveTextContent('Collected');
    expect(screen.queryByText('Delivery fee')).not.toBeInTheDocument();
  });

  it('links to the live map and shows the delivery code while the driver is on the way', () => {
    show({ status: 'OUT_FOR_DELIVERY', deliveryOtp: '4821' });
    const owner = renderAsCustomer(<TrackingPage />);
    expect(screen.getByRole('link', { name: 'Track live delivery' })).toHaveAttribute('href', '/live-tracking/order-1');
    expect(screen.getByLabelText('Delivery code 4 8 2 1')).toBeInTheDocument();
    owner.unmount();
    show({ status: 'OUT_FOR_DELIVERY', deliveryOtp: '4821' }, { limited: true });
    renderAsCustomer(<TrackingPage />);
    expect(screen.queryByLabelText(/Delivery code/)).not.toBeInTheDocument();
  });

  it('hides amounts in the limited public view', () => {
    show({}, { limited: true });
    renderAsCustomer(<TrackingPage />);
    expect(screen.getByText('Sign in to see the amounts for this order.')).toBeInTheDocument();
    expect(screen.queryByText('Total paid')).not.toBeInTheDocument();
  });

  it('shows no line prices, neutral steps and no rating in the public view of an unknown order type', () => {
    show({ orderType: undefined, status: 'DELIVERED', items: [{ name: 'Garlic Naan', quantity: 2 }] }, { limited: true });
    renderWithProviders(<TrackingPage />, { useMemoryRouter: true });
    expect(screen.getByText('Garlic Naan')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    const steps = within(screen.getByRole('list', { name: 'Order steps' })).getAllByRole('listitem');
    expect(steps.map(step => step.querySelector('b')?.textContent)).toEqual(['Received', 'Preparing', 'In oven', 'Ready', 'Completed']);
    expect(screen.queryByRole('link', { name: 'Rate your order' })).not.toBeInTheDocument();
  });

  it('shows a cancelled order without progress steps', () => {
    show({ status: 'CANCELLED' });
    renderAsCustomer(<TrackingPage />);
    expect(screen.getByText('This order was cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Order steps' })).not.toBeInTheDocument();
  });

  it('links a finished order to its review page for the signed-in owner only', () => {
    show({ status: 'DELIVERED' });
    const owner = renderAsCustomer(<TrackingPage />);
    expect(screen.getByRole('link', { name: 'Rate your order' })).toHaveAttribute('href', '/customer/orders/order-1/review');
    owner.unmount();
    show({ status: 'DELIVERED' }, { limited: true });
    renderAsCustomer(<TrackingPage />);
    expect(screen.queryByRole('link', { name: 'Rate your order' })).not.toBeInTheDocument();
  });

  it('distinguishes a failed load from a missing order', () => {
    const refetch = vi.fn();
    mocks.order.mockReturnValue({ order: undefined, isLoading: false, isError: true, limited: false, refetch });
    const view = renderAsCustomer(<TrackingPage />);
    expect(screen.getByRole('heading', { name: 'Your order could not be loaded' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(refetch).toHaveBeenCalled();
    view.unmount();
    mocks.order.mockReturnValue({ order: undefined, isLoading: false, isError: false, limited: false, refetch });
    const missing = renderAsCustomer(<TrackingPage />);
    expect(screen.getByRole('heading', { name: 'Order not found' })).toBeInTheDocument();
    missing.unmount();
    mocks.order.mockReturnValue({ order: undefined, isLoading: false, isError: true, notFound: true, limited: false, refetch });
    renderAsCustomer(<TrackingPage />);
    expect(screen.getByRole('heading', { name: 'Order not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
