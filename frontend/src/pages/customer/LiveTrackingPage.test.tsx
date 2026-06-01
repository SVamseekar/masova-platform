import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, screen } from '@/test/utils/testUtils';
import LiveTrackingPage from './LiveTrackingPage';

const mockUseTrackOrderQuery = vi.fn();
vi.mock('@/store/api/deliveryApi', async () => {
  const actual = await vi.importActual('@/store/api/deliveryApi');
  return {
    ...actual,
    useTrackOrderQuery: (...args: any[]) => mockUseTrackOrderQuery(...args),
  };
});

vi.mock('@/hooks/useOrderTrackingWebSocket', () => ({
  useOrderTrackingWebSocket: () => ({
    isConnected: false,
    lastUpdate: null,
  }),
}));

vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('@/components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
}));

vi.mock('@/components/delivery/DriverTrackingMap', () => ({
  DriverTrackingMap: () => <div data-testid="driver-tracking-map" />,
}));

vi.mock('@/components/delivery/RatingDialog', () => ({
  default: () => <div data-testid="rating-dialog" />,
}));

vi.mock('@/components/ui/neumorphic', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

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
  });

  it('shows loading state while tracking data is being fetched', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Loading tracking information...')).toBeInTheDocument();
  });

  it('shows error state when tracking data is not available', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 },
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Tracking Not Available')).toBeInTheDocument();
  });

  it('shows unavailable message for non-delivery orders (PICKUP)', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: { ...mockTrackingData, orderType: 'PICKUP' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Live Tracking Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Live tracking is not available for pickup orders.')).toBeInTheDocument();
  });

  it('renders Live Tracking heading for delivery orders', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: mockTrackingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Live Tracking')).toBeInTheDocument();
  });

  it('displays driver name', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: mockTrackingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Your Driver')).toBeInTheDocument();
  });

  it('displays Call Driver button', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: mockTrackingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText(/Call Driver/)).toBeInTheDocument();
  });

  it('shows Polling Mode when WebSocket is not connected', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: mockTrackingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Polling Mode')).toBeInTheDocument();
  });

  it('shows Estimated Arrival when available', () => {
    mockUseTrackOrderQuery.mockReturnValue({
      data: mockTrackingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderAsCustomer(<LiveTrackingPage />);
    expect(screen.getByText('Estimated Arrival')).toBeInTheDocument();
  });
});
