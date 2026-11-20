import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import LiveTrackingPage from './LiveTrackingPage';

const mockUseTrackOrderQuery = vi.fn();
vi.mock('@/store/api/deliveryApi', async () => {
  const actual = await vi.importActual('@/store/api/deliveryApi');
  return {
    ...actual,
    useTrackOrderQuery: (...args: unknown[]) => mockUseTrackOrderQuery(...args),
  };
});

vi.mock('@/hooks/useOrderTrackingWebSocket', () => ({
  useOrderTrackingWebSocket: () => ({
    isConnected: false,
    lastUpdate: null,
  }),
}));

vi.mock('@/apps/PublicWebsite/components/BrowseShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./useCustomerOrder', async () => ({
  ...(await vi.importActual('./useCustomerOrder')),
  useCustomerOrder: () => ({ order: { orderNumber: '2041', storeId: 'DOM001', createdAt: '2026-10-10T14:28:00Z', deliveryOtp: '4821' }, isLoading: false, isError: false, limited: false, ...orderView.current }),
}));

vi.mock('@/store/api/storeApi', async () => {
  const actual = await vi.importActual('@/store/api/storeApi');
  return { ...actual, useGetActiveStoresQuery: () => ({ data: [{ id: 's1', storeCode: 'DOM001', name: 'MaSoVa Berlin Mitte', address: { street: 'Torstraße 72', city: 'Berlin', latitude: 52.53, longitude: 13.4 } }] }) };
});

vi.mock('@/components/delivery/DriverTrackingMap', () => ({
  DriverTrackingMap: () => <div data-testid="driver-tracking-map" />,
}));

vi.mock('@/components/delivery/RatingDialog', () => ({
  default: () => <div data-testid="rating-dialog" />,
}));

vi.mock('@/components/ui/neumorphic', () => ({
  Card: ({ children, ...props }: unknown) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }: React.ComponentProps<"button">) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

const orderView = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ orderId: 'order-abc-123' }),
  };
});

const mockTrackingData = {
  status: 'IN_TRANSIT',
  orderType: 'DELIVERY',
  driverName: 'Rajesh Kumar',
  driverPhone: '+919876543210',
  estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString(),
  distanceRemaining: 2.5,
  lastUpdated: new Date().toISOString(),
  currentLocation: { latitude: 17.385, longitude: 78.4867 },
  destination: { coordinates: [78.49, 17.39] },
};

describe('LiveTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderView.current = {};
  });

  it('shows loading state while tracking data is being fetched', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Loading tracking information…')).toBeInTheDocument();
  });

  it('explains when tracking is not available yet and offers a retry', () => {
    const refetch = vi.fn();
    mockUseTrackOrderQuery.mockReturnValue({ data: undefined, isLoading: false, error: { status: 404 }, refetch });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByRole('heading', { name: 'Tracking not available' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Check again' }).click();
    expect(refetch).toHaveBeenCalled();
  });

  it('reports a failed first load as a load failure, not as a missing driver', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: undefined, isLoading: false, error: { status: 500 }, refetch: vi.fn() });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByRole('heading', { name: 'Tracking could not be loaded' })).toBeInTheDocument();
  });

  it('keeps the last known tracking view when a later poll fails', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: mockTrackingData, isLoading: false, error: { status: 500 } });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tracking not available' })).not.toBeInTheDocument();
  });

  it('shows a cancelled delivery as cancelled', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: { ...mockTrackingData, status: 'CANCELLED' }, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Order cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Call driver/ })).not.toBeInTheDocument();
  });

  it('shows unavailable message for pickup orders', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: { ...mockTrackingData, orderType: 'PICKUP' }, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Live tracking is not available for pickup orders.')).toBeInTheDocument();
  });

  it('shows the order, driver, stage and store for a delivery in transit', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: mockTrackingData, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByRole('heading', { name: 'Order #2041' })).toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Berlin Mitte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View order details' })).toHaveAttribute('href', '/tracking/order-abc-123');
    expect(screen.getByTestId('driver-tracking-map')).toBeInTheDocument();
    expect(screen.getByText('Out for delivery', { selector: 'li' })).toHaveAttribute('aria-current', 'step');
  });

  it('states that position updates are polled when the live connection is down', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: mockTrackingData, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('GPS · Updating every 10 seconds')).toBeInTheDocument();
  });

  it('shows the estimated arrival in minutes', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: mockTrackingData, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Estimated arrival')).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();
  });

  it('waits honestly for a position instead of drawing a map without one', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: { ...mockTrackingData, currentLocation: null }, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText("Waiting for the driver's position")).toBeInTheDocument();
    expect(screen.queryByTestId('driver-tracking-map')).not.toBeInTheDocument();
  });

  it('shows the delivery code from the order of the customer until delivered', () => {
    mockUseTrackOrderQuery.mockReturnValue({ data: mockTrackingData, isLoading: false, error: null });
    const view = renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('4821')).toBeInTheDocument();
    view.unmount();
    mockUseTrackOrderQuery.mockReturnValue({ data: { ...mockTrackingData, status: 'DELIVERED' }, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.queryByText('4821')).not.toBeInTheDocument();
  });

  it('never shows the delivery code in the public view, whatever the tracking response carries', () => {
    orderView.current = { limited: true };
    mockUseTrackOrderQuery.mockReturnValue({ data: { ...mockTrackingData, deliveryOtp: '4821' }, isLoading: false, error: null });
    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.queryByText('4821')).not.toBeInTheDocument();
    expect(screen.queryByText('Delivery code')).not.toBeInTheDocument();
  });
});
